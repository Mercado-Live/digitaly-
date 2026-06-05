import { updateDeviceStatus } from './device.service';
import { HEARTBEAT_INTERVAL_MS } from '../config';
import { getStoredDeviceId } from './device.service';

interface HeartbeatState {
  status: 'online' | 'playing' | 'idle';
  currentMediaId?: string;
}

let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
let currentState: HeartbeatState = { status: 'online' };

export function startHeartbeat(): void {
  stopHeartbeat();
  sendHeartbeatNow();
  heartbeatIntervalId = setInterval(sendHeartbeatNow, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeat(): void {
  if (heartbeatIntervalId !== null) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}

export function updateHeartbeatState(state: Partial<HeartbeatState>): void {
  currentState = { ...currentState, ...state };
}

async function sendHeartbeatNow(): Promise<void> {
  try {
    const deviceId = await getStoredDeviceId();
    if (!deviceId) return;

    await updateDeviceStatus(deviceId, {
      status: currentState.status,
      current_media_id: currentState.currentMediaId ?? undefined,
      last_seen: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Heartbeat] Error:', error);
  }
}
