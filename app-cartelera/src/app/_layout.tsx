/*
╔══════════════════════════════════════════════════════════════════════════════╗
║             ROOT LAYOUT — EXPOR ROUTER FILE-BASED ROUTING                   ║
║                                                                             ║
║  Expo Router usa SISTEMA DE ARCHIVOS para definir rutas (file-based).       ║
║                                                                             ║
║  Así como Next.js (web) usa el sistema de archivos para rutas,              ║
║  Expo Router hace lo mismo para React Native.                               ║
║                                                                             ║
║  La estructura:                                                             ║
║    src/app/                                                                  ║
║      _layout.tsx  → define el layout ROOT (envuelve todas las rutas)        ║
║      index.tsx    → la ruta "/" (pantalla principal)                        ║
║      settings.tsx → la ruta "/settings"                                      ║
║      user/                                                                  ║
║        [id].tsx  → la ruta "/user/123"  (ruta dinámica)                     ║
║                                                                             ║
║  Esto se llama "convention over configuration" (RoR, Next.js).              ║
║  En vez de declarar rutas en un archivo central (React Navigation clásico), ║
║  las rutas se INFIEREN de la estructura de carpetas.                        ║
║                                                                             ║
║  Ventajas:                                                                   ║
║  1. La ubicación del archivo te dice la ruta exacta                          ║
║  2. Mover un archivo = cambiar la ruta (refactor visible)                    ║
║  3. Layouts anidados naturalmente por carpeta                                ║
║  4. Carga diferida (lazy loading) automática por ruta                       ║
║                                                                             ║
║  Desventajas:                                                               ║
║  1. Menos flexible (no puedes tener una ruta sin archivo)                    ║
║  2. Rutas muy profundas = carpetas muy anidadas                              ║
║  3. No puedes nombrar rutas arbitrariamente                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

/*
 * Importamos Stack de expo-router.
 *
 * Stack: navegación tipo PILA (stack navigation).
 * Es la navegación más común en móviles: cada pantalla "empuja"
 * a la siguiente, y puedes "pop" para volver atrás.
 *
 * Alternativas en expo-router:
 * - Stack → pilas (push/pop), como iOS UINavigationController
 * - Tabs → pestañas en la parte inferior
 * - Drawer → menú lateral deslizable
 * - Slot → layout plano (sin navegación)
 *
 * Stack en particular implementa el patrón LIFO (Last In, First Out):
 * la última pantalla apilada es la que ves, y al hacer pop
 * vuelves a la anterior. Es idéntico al call stack de JavaScript,
 * pero con UI en vez de funciones.
 */
import { Stack } from "expo-router";

/*
 * Stack.Screen options definen la configuración de cada pantalla.
 * La prop "headerShown: false" oculta la barra de navegación superior.
 *
 * En una cartelera digital, NO queremos una barra de navegación
 * (que distrae). El contenido debe ser FULLSCREEN, inmersivo.
 */
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        /*
         * headerShown: false → oculta la barra de navegación para
         * TODAS las pantallas del Stack. Es un default global.
         *
         * Cada pantalla puede sobrescribir esto localmente:
         * <Stack.Screen name="settings" options={{ headerShown: true }} />
         */
        headerShown: false,
      }}
    />
  );
}
