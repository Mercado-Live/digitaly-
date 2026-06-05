import { useEffect, useRef } from 'react';
import {
  startHeartbeat,
  stopHeartbeat,
  updateHeartbeatState,
} from '../services/heartbeat.service';

interface UseHeartbeatOptions {
  enabled: boolean;
  isPlaying: boolean;
  currentMediaId?: string;
}

export function useHeartbeat({
  enabled,
  isPlaying,
  currentMediaId,
}: UseHeartbeatOptions): void {
  const prevRef = useRef({ isPlaying, currentMediaId });

  useEffect(() => {
    if (!enabled) return;

    startHeartbeat();

    return () => {
      stopHeartbeat();
    };
  }, [enabled]);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.isPlaying !== isPlaying || prev.currentMediaId !== currentMediaId) {
      prevRef.current = { isPlaying, currentMediaId };
      updateHeartbeatState({
        status: isPlaying ? 'playing' : 'idle',
        currentMediaId,
      });
    }
  }, [isPlaying, currentMediaId]);
}
