import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { pairDevice } from '../services/pairing.service';
import { registerDevice } from '../services/device.service';
import { IS_TV, tvScale } from '../utils/tv';

const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '⌫'],
  ['✓', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '-', '_'],
];

interface PairingScreenProps {
  readonly onPaired: () => void;
}

export default function PairingScreen({ onPaired }: PairingScreenProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const doSubmit = useCallback(async (codeToSubmit: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await pairDevice(codeToSubmit);

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      const registered = await registerDevice(result.device.id);

      if (registered) {
        setSuccess(true);
        setTimeout(() => onPaired(), 1200);
      } else {
        setError('Error al registrar el dispositivo. Intenta de nuevo.');
      }
    } catch (err) {
      setError('Error de conexion. Verifica tu internet.');
      console.error('Pairing error:', err);
    }

    setIsLoading(false);
  }, [onPaired]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (isLoading || success) return;
      setError(null);

      if (key === '⌫') {
        setCode((prev) => prev.slice(0, -1));
        return;
      }

      if (key === '✓') {
        if (code.length === 6) {
          doSubmit(code);
        }
        return;
      }

      if (code.length < 6) {
        const newCode = code + key;
        setCode(newCode.toUpperCase());

        if (newCode.length === 6) {
          setTimeout(() => doSubmit(newCode.toUpperCase()), 300);
        }
      }
    },
    [code, isLoading, success, doSubmit]
  );

  const codeDisplay = code.padEnd(6, '_').split('');

  const keySize = IS_TV ? tvScale(42) : 34;
  const keyGap = IS_TV ? tvScale(6) : 4;
  const fontSize = IS_TV ? tvScale(16) : 14;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      bounces={false}
    >
      <View style={styles.container}>
        {/* Header compacto */}
        {!isLandscape && (
          <>
            <Text style={styles.title}>Cartelera Digital</Text>
            <Text style={styles.subtitle}>Vinculacion de Dispositivo</Text>
          </>
        )}

        {/* Fila horizontal: titulo + codigo lado a lado en landscape */}
        <View style={[isLandscape && styles.landscapeRow]}>
          {isLandscape && (
            <View style={styles.landscapeHeader}>
              <Text style={[styles.title, styles.titleSmall]}>Cartelera Digital</Text>
              <Text style={[styles.subtitle, styles.subtitleSmall]}>Codigo de vinculacion</Text>
            </View>
          )}

          <View style={styles.codeDisplay}>
            {codeDisplay.map((char, i) => (
              <View
                key={i}
                style={[
                  styles.codeChar,
                  i < code.length && styles.codeCharFilled,
                  i === code.length && styles.codeCharActive,
                ]}
              >
                <Text style={styles.codeCharText}>{char}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mensajes de estado */}
        {error && (
          <View style={styles.messageBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={[styles.messageBox, styles.messageBoxSuccess]}>
            <Text style={styles.successText}>Vinculado correctamente</Text>
          </View>
        )}

        {isLoading && (
          <ActivityIndicator size={IS_TV ? 'large' : 'small'} color="#3b82f6" style={styles.loader} />
        )}

        {/* Teclado */}
        <View style={styles.keyboard}>
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={[styles.keyboardRow, { gap: keyGap }]}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  style={[
                    styles.key,
                    { width: key === '✓' ? keySize * 1.6 : keySize, height: keySize },
                    key === '✓' && styles.keySubmit,
                    key === '⌫' && styles.keyDelete,
                  ]}
                  onPress={() => handleKeyPress(key)}
                >
                  <Text style={[styles.keyText, { fontSize }]}>
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {!isLandscape && (
          <Text style={styles.instruction}>
            Ingresa el codigo de 6 digitos que aparece en el Panel de Control
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: IS_TV ? 24 : 12,
  },
  landscapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 8,
  },
  landscapeHeader: {
    alignItems: 'flex-start',
  },
  title: {
    fontSize: IS_TV ? tvScale(32) : 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: IS_TV ? 8 : 4,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: IS_TV ? tvScale(24) : 18,
  },
  subtitle: {
    fontSize: IS_TV ? tvScale(18) : 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: IS_TV ? 32 : 12,
    textAlign: 'center',
  },
  subtitleSmall: {
    fontSize: IS_TV ? tvScale(14) : 13,
    marginBottom: 0,
  },
  codeDisplay: {
    flexDirection: 'row',
    gap: IS_TV ? tvScale(10) : 8,
    marginBottom: IS_TV ? 20 : 10,
  },
  codeChar: {
    width: IS_TV ? tvScale(48) : 36,
    height: IS_TV ? tvScale(56) : 42,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  codeCharFilled: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  codeCharActive: {
    borderColor: '#60a5fa',
    borderStyle: 'dashed',
  },
  codeCharText: {
    fontSize: IS_TV ? tvScale(26) : 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  messageBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: IS_TV ? 12 : 8,
    marginBottom: IS_TV ? 14 : 8,
    width: '100%',
    maxWidth: IS_TV ? 500 : 400,
  },
  messageBoxSuccess: {
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: IS_TV ? tvScale(15) : 13,
    textAlign: 'center',
  },
  successText: {
    color: '#10b981',
    fontSize: IS_TV ? tvScale(16) : 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  loader: {
    marginBottom: IS_TV ? 14 : 8,
  },
  instruction: {
    fontSize: IS_TV ? tvScale(14) : 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    marginTop: IS_TV ? 16 : 8,
    maxWidth: 350,
  },
  keyboard: {
    width: '100%',
    maxWidth: IS_TV ? 520 : 420,
    alignItems: 'center',
    gap: IS_TV ? tvScale(6) : 4,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  key: {
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keySubmit: {
    backgroundColor: 'rgba(16,185,129,0.3)',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  keyDelete: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  keyText: {
    fontWeight: '700',
    color: '#ffffff',
  },
});
