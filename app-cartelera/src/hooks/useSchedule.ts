import { useState, useEffect, useRef } from 'react';
import {
  resolveActiveSchedule,
  isScheduleStillActive,
} from '../services/schedule.service';
import type { ScheduleRow } from '../types/supabase.types';
import { SCHEDULE_CHECK_INTERVAL_MS } from '../config';

interface UseScheduleResult {
  activeSchedule: ScheduleRow | null;
  isScheduleActive: boolean;
  playlistId: string | null;
}

export function useSchedule(deviceId: string | null): UseScheduleResult {
  const [activeSchedule, setActiveSchedule] = useState<ScheduleRow | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    const check = async () => {
      const result = await resolveActiveSchedule(deviceId);
      setActiveSchedule(result.activeSchedule);
    };

    check();

    intervalRef.current = setInterval(check, SCHEDULE_CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [deviceId]);

  const isScheduleActive =
    activeSchedule !== null && isScheduleStillActive(activeSchedule);

  return {
    activeSchedule,
    isScheduleActive,
    playlistId: activeSchedule?.playlist_id ?? null,
  };
}
