export const HEARTBEAT_INTERVAL_MS = 60_000;
export const SCHEDULE_CHECK_INTERVAL_MS = 120_000;
export const RECONNECT_DELAY_MS = 5_000;
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const POLL_INTERVAL_MS = 30_000;
export const MAX_RETRY_ATTEMPTS = 3;

export const PAIRING_CODE_LENGTH = 6;
export const PAIRING_TIMEOUT_MS = 15 * 60 * 1000;

export const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  IDLE: 'idle',
  PLAYING: 'playing',
} as const;

export const STORAGE_KEYS = {
  DEVICE_ID: 'device_id',
  DEVICE_KEY: 'device_key',
  ANON_USER_ID: 'anon_user_id',
  LAST_ANNOUNCEMENT: 'cache:last_announcement',
  LAST_SYNC: 'cache:last_sync',
  DEVICE_SETTINGS: 'cache:device_settings',
} as const;

export const ACTIVE_LAYOUTS = ['video-left-wide', 'story-full'] as const;
