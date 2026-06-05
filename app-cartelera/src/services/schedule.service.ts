import { getSupabase } from './supabase';
import { TABLES } from '../config/supabase.config';
import type { ScheduleRow } from '../types/supabase.types';

export interface ActiveScheduleResult {
  activeSchedule: ScheduleRow | null;
  playlistId: string | null;
}

export async function resolveActiveSchedule(
  deviceId: string
): Promise<ActiveScheduleResult> {
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

  if (error || !data || data.length === 0) {
    return { activeSchedule: null, playlistId: null };
  }

  const schedules = data as ScheduleRow[];
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 8);

  const active = schedules.find((s) => {
    const dayMatch = s.days_of_week.includes(currentDay);
    const timeMatch =
      currentTime >= s.start_time && currentTime <= s.end_time;
    return dayMatch && timeMatch;
  });

  return {
    activeSchedule: active ?? null,
    playlistId: active?.playlist_id ?? null,
  };
}

export function isScheduleStillActive(schedule: ScheduleRow): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 8);
  const nowStr = now.toISOString();

  return (
    schedule.is_active &&
    schedule.start_date <= nowStr &&
    schedule.end_date >= nowStr &&
    schedule.days_of_week.includes(currentDay) &&
    currentTime >= schedule.start_time &&
    currentTime <= schedule.end_time
  );
}
