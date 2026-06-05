import { useRef, useCallback, useEffect } from 'react';
import { getSupabase } from '../services/supabase';
import { TABLES, POLL_INTERVAL_MS } from '../config';

interface UseRealtimeOptions {
  deviceId: string | null;
  onSync: () => void;
  lastKnownMediaId: string | null;
  lastKnownPlaylistId: string | null;
}

export function useRealtime({
  deviceId,
  onSync,
  lastKnownMediaId,
  lastKnownPlaylistId,
}: UseRealtimeOptions): void {
  const prevRef = useRef({ mediaId: lastKnownMediaId, playlistId: lastKnownPlaylistId });
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const checkForChanges = useCallback(async () => {
    if (!deviceId) return;

    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from(TABLES.DEVICES)
        .select('current_media_id, current_playlist_id')
        .eq('id', deviceId)
        .single();

      if (!data) {
        // Dispositivo no encontrado: pudo ser eliminado
        // Trigger refresh para que useContent verifique y redirija a pairing
        onSyncRef.current();
        return;
      }

      const prev = prevRef.current;
      const mediaChanged = data.current_media_id !== prev.mediaId;
      const playlistChanged = data.current_playlist_id !== prev.playlistId;

      if (mediaChanged || playlistChanged) {
        console.log(
          '[Poll] Cambio detectado:',
          mediaChanged ? `media ${prev.mediaId} → ${data.current_media_id}` : '',
          playlistChanged ? `playlist ${prev.playlistId} → ${data.current_playlist_id}` : ''
        );
        prevRef.current = {
          mediaId: data.current_media_id ?? null,
          playlistId: data.current_playlist_id ?? null,
        };
        onSyncRef.current();
      }
    } catch {
      // sin red
    }
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;

    console.log('[Poll] Iniciando cada', POLL_INTERVAL_MS / 1000, 's para dispositivo', deviceId);
    checkForChanges();

    const id = setInterval(checkForChanges, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [deviceId, checkForChanges]);
}
