import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="pairing" />
      <Stack.Screen name="playback" />
      <Stack.Screen name="error" />
    </Stack>
  );
}
