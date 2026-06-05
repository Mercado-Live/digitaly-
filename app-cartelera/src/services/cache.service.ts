import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Announcement } from '../types';
import { STORAGE_KEYS } from '../config';

export async function cacheAnnouncement(announcement: Announcement): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_ANNOUNCEMENT,
      JSON.stringify(announcement)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_SYNC,
      new Date().toISOString()
    );
  } catch (error) {
    console.error('[Cache] Error guardando anuncio:', error);
  }
}

export async function getCachedAnnouncement(): Promise<Announcement | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ANNOUNCEMENT);
    if (!raw) return null;
    return JSON.parse(raw) as Announcement;
  } catch (error) {
    console.error('[Cache] Error leyendo anuncio:', error);
    return null;
  }
}

export async function cacheDeviceSettings(
  settings: Record<string, unknown>
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.DEVICE_SETTINGS,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error('[Cache] Error guardando settings:', error);
  }
}

export async function getCachedDeviceSettings(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_SETTINGS);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    console.error('[Cache] Error leyendo settings:', error);
    return null;
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.LAST_ANNOUNCEMENT,
      STORAGE_KEYS.LAST_SYNC,
      STORAGE_KEYS.DEVICE_SETTINGS,
    ]);
  } catch (error) {
    console.error('[Cache] Error limpiando cache:', error);
  }
}
