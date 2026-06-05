import { getSupabase } from './supabase';
import { REALTIME_CHANNELS } from '../config/supabase.config';

export interface DeviceCommand {
  command: 'play' | 'pause' | 'sync' | 'restart' | 'update_settings';
  media_id?: string;
  playlist_id?: string;
  settings?: Record<string, unknown>;
  timestamp: string;
}

export async function sendHeartbeat(
  deviceId: string,
  status: 'online' | 'playing' | 'idle',
  currentMediaId?: string
): Promise<void> {
  const supabase = getSupabase();
  const channelName = REALTIME_CHANNELS.DEVICE_STATUS(deviceId);

  try {
    await supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'heartbeat',
      payload: {
        status,
        current_media_id: currentMediaId ?? null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    // Sin Realtime habilitado, falla silenciosamente
  }
}
