import { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { getStoredDeviceId, clearStoredDeviceId } from '../services/device.service';
import { signInAnonymously, initSupabase } from '../services/supabase';
import { useContent } from '../hooks/useContent';
import { useRealtime } from '../hooks/useRealtime';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useSchedule } from '../hooks/useSchedule';
import Billboard from '../components/Billboard';
import ErrorBoundary from '../components/ErrorBoundary';

export default function PlaybackRoute() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [initReady, setInitReady] = useState(false);
  const [initFailed, setInitFailed] = useState(false);

  // Keep-awake: evitar que TV Box cierre la app
  useEffect(() => {
    activateKeepAwakeAsync();
    return () => { deactivateKeepAwake(); };
  }, []);

  const {
    announcement,
    isLoading,
    error: contentError,
    isFromCache,
    refresh,
    slides,
    slideIndex,
    nextSlide,
    prevSlide,
    deviceDeleted,
    unpair,
  } = useContent(initReady ? deviceId : null);

  useEffect(() => {
    if (deviceDeleted) {
      clearStoredDeviceId().finally(() => {
        router.replace('/pairing');
      });
    }
  }, [deviceDeleted]);

  const lastKnownIds = useMemo(
    () => ({
      mediaId: null,
      playlistId: announcement?.id?.split('_slide_')[0] || null,
    }),
    [announcement?.id]
  );

  useRealtime({
    deviceId: initReady ? deviceId : null,
    onSync: refresh,
    lastKnownMediaId: lastKnownIds.mediaId,
    lastKnownPlaylistId: lastKnownIds.playlistId,
  });

  const isPlaying = announcement !== null && !isLoading;

  useHeartbeat({
    enabled: initReady,
    isPlaying,
    currentMediaId: null, // no mandar ID falso de slide como media_id
  });

  useSchedule(initReady ? deviceId : null);

  useEffect(() => {
    const init = async () => {
      try {
        initSupabase();

        const storedId = await getStoredDeviceId();
        if (!storedId) {
          router.replace('/pairing');
          return;
        }

        await signInAnonymously();
        setDeviceId(storedId);
        setInitReady(true);
      } catch {
        setInitFailed(true);
      }
    };

    init();
  }, []);

  if (initFailed) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          No se pudo iniciar la aplicacion. Reinicia el dispositivo.
        </Text>
      </View>
    );
  }

  if (!initReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ErrorBoundary onRetry={refresh}>
      <Billboard
        announcement={announcement}
        isLoading={isLoading}
        error={contentError}
        isFromCache={isFromCache}
        onRefresh={refresh}
        slides={slides}
        slideCount={slides.length}
        slideIndex={slideIndex}
        onNextSlide={nextSlide}
        onPrevSlide={prevSlide}
        onUnpair={unpair}
      />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
});
