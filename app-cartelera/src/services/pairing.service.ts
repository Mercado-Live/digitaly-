import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from './supabase';
import { TABLES } from '../config/supabase.config';
import type { DeviceRow } from '../types/supabase.types';

export type PairingResult =
  | { success: true; device: DeviceRow }
  | {
      success: false;
      error: string;
      errorCode: 'NOT_FOUND' | 'ALREADY_PAIRED' | 'NETWORK_ERROR' | 'INVALID_CODE';
    };

export async function pairDevice(code: string): Promise<PairingResult> {
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode.length !== 6) {
    return {
      success: false,
      error: 'El codigo debe tener exactamente 6 caracteres',
      errorCode: 'INVALID_CODE',
    };
  }

  if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
    return {
      success: false,
      error: 'El codigo solo puede contener letras y numeros',
      errorCode: 'INVALID_CODE',
    };
  }

  const supabase = getSupabase();

  const { data: devices, error: queryError } = await supabase
    .from(TABLES.DEVICES)
    .select('*')
    .eq('device_key', normalizedCode)
    .limit(1);

  if (queryError) {
    return {
      success: false,
      error: 'Error de red al verificar el codigo',
      errorCode: 'NETWORK_ERROR',
    };
  }

  if (!devices || devices.length === 0) {
    return {
      success: false,
      error: 'Codigo no encontrado. Verifica que sea correcto.',
      errorCode: 'NOT_FOUND',
    };
  }

  const device = devices[0] as DeviceRow;

  if (device.software_version) {
    return {
      success: false,
      error: 'Este codigo ya esta vinculado a otro dispositivo.',
      errorCode: 'ALREADY_PAIRED',
    };
  }

  return { success: true, device };
}

export async function unpairDevice(deviceId: string): Promise<void> {
  const supabase = getSupabase();

  await supabase
    .from(TABLES.DEVICES)
    .update({ status: 'offline', last_seen: new Date().toISOString() })
    .eq('id', deviceId);

  await AsyncStorage.removeItem('device_id');
  await AsyncStorage.removeItem('device_key');
}
