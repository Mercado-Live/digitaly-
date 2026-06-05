import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { IS_TV, tvScale } from '../utils/tv';

export default function ErrorRoute() {
  const { message } = useLocalSearchParams<{ message?: string }>();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    router.replace('/playback');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠</Text>
      <Text style={styles.title}>Error de conexion</Text>
      <Text style={styles.message}>
        {message ??
          'No se pudo conectar con el servidor. Verifica tu conexion a internet.'}
      </Text>
      <Pressable
        style={styles.retryButton}
        onPress={handleRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.retryText}>Reintentar</Text>
        )}
      </Pressable>
      <Pressable
        style={styles.backButton}
        onPress={() => router.replace('/pairing')}
      >
        <Text style={styles.backText}>Volver a vincular</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: IS_TV ? tvScale(28) : 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  message: {
    fontSize: IS_TV ? tvScale(16) : 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 400,
    lineHeight: IS_TV ? tvScale(24) : 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 150,
    alignItems: 'center',
    marginBottom: 12,
  },
  retryText: {
    color: '#ffffff',
    fontSize: IS_TV ? tvScale(18) : 16,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: IS_TV ? tvScale(14) : 13,
  },
});
