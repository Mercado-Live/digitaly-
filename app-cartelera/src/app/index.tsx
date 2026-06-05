import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { getStoredDeviceId } from '../services/device.service';
import { initSupabase, signInAnonymously } from '../services/supabase';

export default function Index() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      initSupabase();
      await signInAnonymously();

      const deviceId = await getStoredDeviceId();
      if (deviceId) {
        router.replace('/playback');
      } else {
        router.replace('/pairing');
      }
      setChecking(false);
    };

    init();
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.text}>Iniciando...</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 16,
  },
});
