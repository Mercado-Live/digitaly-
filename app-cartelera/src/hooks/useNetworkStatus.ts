import { useState, useEffect, useCallback, useRef } from 'react';
import * as Network from 'expo-network';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });
  const mountedRef = useRef(true);

  const check = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      if (!mountedRef.current) return;
      setStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
        type: state.type ?? 'unknown',
      });
    } catch {
      if (mountedRef.current) {
        setStatus({
          isConnected: false,
          isInternetReachable: false,
          type: 'unknown',
        });
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    check();
    const interval = setInterval(check, 10_000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [check]);

  return status;
}
