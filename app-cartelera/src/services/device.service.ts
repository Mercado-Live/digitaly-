import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getSupabase } from './supabase';
import { TABLES, STORAGE_KEYS } from '../config';
import type { DeviceUpdate, DeviceLogInsert } from '../types/supabase.types';

export async function registerDevice(deviceId: string): Promise<boolean> {
  const supabase = getSupabase();

  const updates: DeviceUpdate = {
    status: 'online',
    last_seen: new Date().toISOString(),
    software_version:
      Constants.expoConfig?.version ?? '1.0.0',
  };

  const { error } = await supabase
    .from(TABLES.DEVICES)
    .update(updates)
    .eq('id', deviceId);

  if (error) {
    console.error('Error al registrar dispositivo:', error);
    return false;
  }

  await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  return true;
}

export async function getStoredDeviceId(): Promise<string | null> {
  return await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
}

export async function clearStoredDeviceId(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_ID);
}

export async function updateDeviceStatus(
  deviceId: string,
  updates: DeviceUpdate
): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from(TABLES.DEVICES)
    .update(updates)
    .eq('id', deviceId);

  if (error) {
    console.error('Error al actualizar estado:', error);
    return false;
  }

  return true;
}

export async function insertDeviceLog(
  deviceId: string,
  eventType: DeviceLogInsert['event_type'],
  eventData?: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from(TABLES.DEVICE_LOGS)
    .insert({
      device_id: deviceId,
      event_type: eventType,
      event_data: eventData ?? null,
    } as DeviceLogInsert);

  if (error) {
    console.error('Error al insertar log:', error);
  }
}
