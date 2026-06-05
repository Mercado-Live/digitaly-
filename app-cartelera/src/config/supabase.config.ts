export const SUPABASE_URL = 'https://wntecetvtwsmylsxexgt.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudGVjZXR2dHdzbXlsc3hleGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjkxMDgsImV4cCI6MjA5NjI0NTEwOH0.Rm27VzgfaZ_BZPTzFKkhKq7gLVOTt2_gayuZdJGxGa0';

export const REALTIME_CHANNELS = {
  DEVICE_CONTROL: (deviceId: string) => `device:${deviceId}:control`,
  DEVICE_STATUS: (deviceId: string) => `device:${deviceId}:status`,
  USER_GLOBAL: (userId: string) => `user:${userId}:global`,
} as const;

export const TABLES = {
  DEVICES: 'devices',
  MEDIA: 'media',
  PLAYLISTS: 'playlists',
  SCHEDULES: 'schedules',
  DEVICE_LOGS: 'device_logs',
  PROFILES: 'profiles',
} as const;

export const BUCKETS = {
  MEDIA: 'media',
  THUMBNAILS: 'thumbnails',
} as const;
