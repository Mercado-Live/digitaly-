import { getSupabase } from './supabase';
import { TABLES } from '../config/supabase.config';
import type { PlaylistRow, MediaRow, PlaylistItem, SlideItem, ScheduleRow } from '../types/supabase.types';
import { isSlideItem } from '../types/supabase.types';
import type { Announcement, MediaContent } from '../types';

export async function fetchDeviceContent(
  deviceId: string
): Promise<Announcement[] | null> {
  const supabase = getSupabase();

  const { data: device, error: deviceError } = await supabase
    .from(TABLES.DEVICES)
    .select('current_playlist_id, current_media_id')
    .eq('id', deviceId)
    .single();

  if (!device || deviceError) return null;

  const activeSchedule = await getActiveSchedule(deviceId);
  if (activeSchedule?.playlist_id) {
    const playlist = await fetchPlaylistWithMedia(activeSchedule.playlist_id);
    if (playlist) {
      return convertPlaylistToAnnouncements(playlist);
    }
  }

  if (device.current_playlist_id) {
    const playlist = await fetchPlaylistWithMedia(device.current_playlist_id);
    if (playlist) {
      return convertPlaylistToAnnouncements(playlist);
    }
  }

  if (device.current_media_id) {
    const { data: media } = await supabase
      .from(TABLES.MEDIA)
      .select('*')
      .eq('id', device.current_media_id)
      .single();

    if (media) {
      return [convertMediaToAnnouncement(media as MediaRow)];
    }
  }

  return [];
}

export async function doesDeviceExist(deviceId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from(TABLES.DEVICES)
    .select('id', { count: 'exact', head: true })
    .eq('id', deviceId);

  if (error) return false;
  return (count ?? 0) > 0;
}

async function fetchPlaylistWithMedia(
  playlistId: string
): Promise<(PlaylistRow & { mediaItems: MediaRow[] }) | null> {
  const supabase = getSupabase();

  const { data: playlist, error } = await supabase
    .from(TABLES.PLAYLISTS)
    .select('*')
    .eq('id', playlistId)
    .single();

  if (error || !playlist) {
    if (error && (error as { code?: string }).code === 'PGRST116') {
      console.log('[Content] Playlist no encontrada (eliminada?):', playlistId);
    } else {
      console.error('Error fetching playlist:', error);
    }
    return null;
  }

  const pl = playlist as PlaylistRow;
  const items = pl.items || [];

  if (items.length === 0) {
    return { ...pl, mediaItems: [] };
  }

  const mediaIds = extractMediaIds(items);

  if (mediaIds.length === 0) {
    return { ...pl, mediaItems: [] };
  }

  const { data: mediaData, error: mediaError } = await supabase
    .from(TABLES.MEDIA)
    .select('*')
    .in('id', mediaIds);

  if (mediaError) {
    console.error('Error fetching media for playlist:', mediaError);
    return { ...pl, mediaItems: [] };
  }

  return { ...pl, mediaItems: (mediaData as MediaRow[]) || [] };
}

function extractMediaIds(items: PlaylistRow['items']): string[] {
  const ids: string[] = [];
  for (const item of items) {
    if (isSlideItem(item)) {
      const zones = item.zones || {};
      for (const zoneItems of Object.values(zones)) {
        if (!Array.isArray(zoneItems)) continue;
        for (const zoneItem of zoneItems) {
          if (zoneItem && zoneItem.media_id) {
            ids.push(zoneItem.media_id);
          }
        }
      }
    } else {
      const legacyItem = item as PlaylistItem;
      if (legacyItem.media_id) {
        ids.push(legacyItem.media_id);
      }
    }
  }
  return [...new Set(ids)];
}

// ================================================================
// NUEVO FORMATO: slides con layout_id + zones
// ================================================================
function convertSlideToAnnouncement(
  slide: SlideItem,
  mediaMap: Map<string, MediaRow>
): Announcement {
  const content: Announcement['content'] = {};
  const zones = slide.zones || {};

  let hasVideo = false;
  let hasImages = false;

  for (const [zoneId, zoneItems] of Object.entries(zones)) {
    if (!Array.isArray(zoneItems) || zoneItems.length === 0) continue;

    const mediaContents: MediaContent[] = [];
    for (const item of zoneItems) {
      if (!item) continue;

      if (item.media_id) {
        const media = mediaMap.get(item.media_id);
        if (!media) continue;
        mediaContents.push(mediaToContent(media));
        if (media.type === 'video') hasVideo = true;
        else hasImages = true;
      } else if (item.media_url) {
        const source = item.source || detectSource(item.media_url);
        const isVideo = item.media_type === 'video' || source === 'youtube';
        mediaContents.push({
          type: isVideo ? 'video' : 'image-story',
          url: item.media_url,
          durationMs: (item.duration || 10) * 1000,
          title: item.media_name,
          source,
        });
        if (isVideo) hasVideo = true;
        else hasImages = true;
      }
    }
    if (mediaContents.length > 0) {
      content[zoneId] = mediaContents;
    }
  }

  let layoutId = slide.layout_id;
  if (!layoutId || layoutId === 'unknown') {
    layoutId = hasImages && !hasVideo ? 'story-full' : 'video-left-wide';
  }

  const firstZone = Object.entries(zones).find(([, items]) => Array.isArray(items) && items.length > 0);
  const firstName = firstZone ? (firstZone[1][0]?.media_name || 'Slide') : 'Slide';

  return {
    id: slide.layout_id + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title: firstName,
    description: undefined,
    date: new Date().toISOString().split('T')[0],
    backgroundColor: '#0f0f23',
    layoutId,
    content,
  };
}

function convertPlaylistToAnnouncements(
  playlist: PlaylistRow & { mediaItems: MediaRow[] }
): Announcement[] {
  const mediaMap = new Map(playlist.mediaItems.map(m => [m.id, m]));
  const items = playlist.items || [];

  const hasNewFormat = items.some(item => isSlideItem(item));

  if (hasNewFormat) {
    const announcements: Announcement[] = [];
    for (const item of items) {
      if (isSlideItem(item)) {
        announcements.push(convertSlideToAnnouncement(item, mediaMap));
      }
    }
    if (announcements.length > 0) {
      // Fill IDs with playlist info for tracking
      return announcements.map((a, i) => {
        const item = items[i] as SlideItem;
        return { ...a, id: playlist.id + '_slide_' + i };
      });
    }
  }

  // Fallback to legacy format
  const videoItems = playlist.mediaItems.filter(m => m.type === 'video');
  const imageItems = playlist.mediaItems.filter(
    m => m.type === 'image' || m.type === 'image-story'
  );

  const hasVideo = videoItems.length > 0;
  const hasImages = imageItems.length > 0;

  return [{
    id: playlist.id,
    title: playlist.name,
    description: playlist.description ?? undefined,
    date: playlist.updated_at.split('T')[0],
    backgroundColor: '#0f0f23',
    layoutId: hasImages && !hasVideo ? 'story-full' : 'video-left-wide',
    content: {
      video: videoItems.map(m => mediaToContent(m)),
      story: imageItems.map(m => mediaToContent(m)),
    },
  }];
}

function convertMediaToAnnouncement(media: MediaRow): Announcement {
  const isVideo = media.type === 'video';
  return {
    id: media.id,
    title: media.name,
    description: undefined,
    date: media.created_at.split('T')[0],
    backgroundColor: '#0f0f23',
    layoutId: isVideo ? 'video-left-wide' : 'story-full',
    content: {
      video: isVideo ? [mediaToContent(media)] : [],
      story: !isVideo ? [mediaToContent(media)] : [],
    },
  };
}

function mediaToContent(media: MediaRow): MediaContent {
  const isVideo = media.type === 'video';
  return {
    type: isVideo ? 'video' : 'image-story',
    url: media.url ?? '',
    title: media.name,
    durationMs: (media.duration ?? 10) * 1000,
    posterUrl: media.thumbnail_url ?? undefined,
    source: 'upload',
  };
}

function detectSource(url: string): 'url' | 'youtube' {
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  return 'url';
}

async function getActiveSchedule(deviceId: string): Promise<ScheduleRow | null> {
  const supabase = getSupabase();
  const now = new Date();

  const { data, error } = await supabase
    .from(TABLES.SCHEDULES)
    .select('*')
    .contains('device_ids', [deviceId])
    .eq('is_active', true)
    .lte('start_date', now.toISOString())
    .gte('end_date', now.toISOString())
    .order('priority', { ascending: false })
    .limit(5);

  if (error || !data || data.length === 0) return null;

  const schedules = data as ScheduleRow[];
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 8);

  const active = schedules.find(s => {
    const dayMatch = s.days_of_week.includes(currentDay);
    const timeMatch = currentTime >= s.start_time && currentTime <= s.end_time;
    return dayMatch && timeMatch;
  });

  return active ?? null;
}
