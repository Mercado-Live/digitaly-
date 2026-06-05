import { router } from 'expo-router';
import PairingScreen from '../components/PairingScreen';

export default function PairingRoute() {
  return (
    <PairingScreen
      onPaired={() => {
        router.replace('/playback');
      }}
    />
  );
}
