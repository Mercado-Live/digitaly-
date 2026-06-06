export interface DeviceRow {
  id: string;
  user_id: string;
  name: string;
  device_key: string | null;
  model: string | null;
  location: string | null;
  orientation: 'landscape' | 'portrait';
  resolution: string | null;
  status: 'online' | 'offline' | 'idle' | 'playing';
  last_seen: string | null;
  current_media_id: string | null;
  current_playlist_id: string | null;
  software_version: string | null;
  ip_address: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceUpdate {
  status?: 'online' | 'offline' | 'idle' | 'playing';
  last_seen?: string;
  current_media_id?: string | null;
  current_playlist_id?: string | null;
  software_version?: string;
  ip_address?: string;
  settings?: Record<string, unknown>;
}

export interface MediaRow {
  id: string;
  user_id: string;
  name: string;
  type: 'image' | 'video' | 'webpage' | 'widget' | 'image-story';
  url: string | null;
  thumbnail_url: string | null;
  file_size: number;
  duration: number | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  tags: string[] | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItem {
  media_id: string;
  duration: number;
  order: number;
}

export interface SlideZoneItem {
  media_id?: string;
  media_url?: string;
  media_name?: string;
  media_type?: string;
  duration?: number;
  source?: 'upload' | 'url' | 'youtube';
}

export interface SlideItem {
  layout_id: string;
  zones: Record<string, SlideZoneItem[]>;
  duration: number;
}

export type PlaylistItemUnion = PlaylistItem | SlideItem;

export function isSlideItem(item: unknown): item is SlideItem {
  return typeof item === 'object' && item !== null && 'layout_id' in item && 'zones' in item;
}

export interface PlaylistRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  items: PlaylistItemUnion[];
  is_loop: boolean;
  transition: 'none' | 'fade' | 'slide' | 'zoom';
  created_at: string;
  updated_at: string;
}

export interface ScheduleRow {
  id: string;
  user_id: string;
  name: string;
  device_ids: string[];
  playlist_id: string | null;
  start_date: string | null;
  end_date: string | null;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceLogInsert {
  device_id: string;
  event_type: 'online' | 'offline' | 'playing' | 'error' | 'sync' | 'restart' | 'content_changed';
  event_data?: Record<string, unknown>;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'viewer';
  plan: 'free' | 'pro' | 'enterprise';
  max_devices: number;
  created_at: string;
  updated_at: string;
}
