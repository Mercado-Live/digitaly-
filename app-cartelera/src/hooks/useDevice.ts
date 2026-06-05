import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config';

export function useDevice() {
  const deviceIdRef = useRef<string | null>(null);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID).then((id) => {
      deviceIdRef.current = id;
      isHydratedRef.current = true;
    });
  }, []);

  return {
    get deviceId() {
      return deviceIdRef.current;
    },
    get isHydrated() {
      return isHydratedRef.current;
    },
    get isPaired() {
      return deviceIdRef.current !== null;
    },
  };
}
