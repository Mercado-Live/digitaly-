import { Stack } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import React, { Component } from 'react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<{ readonly children: React.ReactNode }, State> {
  constructor(props: { readonly children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || 'Error desconocido' };
  }

  handleRestart = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.title}>Error en la aplicacion</Text>
          <Text style={styles.message}>{this.state.errorMessage}</Text>
          <Pressable style={styles.button} onPress={this.handleRestart}>
            <Text style={styles.buttonText}>Reiniciar</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23', justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 48, color: '#ef4444', fontWeight: 'bold', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 12 },
  message: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 32, maxWidth: 400, lineHeight: 20 },
  button: { backgroundColor: '#3b82f6', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pairing" />
        <Stack.Screen name="playback" />
        <Stack.Screen name="error" />
      </Stack>
    </ErrorBoundary>
  );
}
