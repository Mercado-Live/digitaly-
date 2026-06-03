/*
╔══════════════════════════════════════════════════════════════════════════════╗
║             TV UTILITIES — Capa de abstracción para TV                     ║
║                                                                             ║
║  react-native-tvos reemplaza a react-native por completo:                   ║
║  imports como 'TVFocusGuideView' y 'TVEventHandler' vienen                  ║
║  directamente de 'react-native'.                                            ║
║                                                                             ║
║  Este archivo centraliza TODA la lógica de detección y escalado TV          ║
║  para que los componentes importen desde aquí y no esparzan                 ║
║  Platform.isTV por todo el código.                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { Platform } from "react-native";

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * DETECCIÓN DE PLATAFORMA
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Platform.isTV es TRUE cuando la app corre en:
 *   - Apple TV (tvOS)
 *   - Android TV
 *   - Fire TV
 *   - Cualquier dispositivo con TV support habilitado
 *
 * Platform.isTVOS y Platform.isAndroidTV diferencian entre las dos.
 * Para nuestra cartelera, solo necesitamos saber si es TV o no,
 * porque el comportamiento UX cambia fundamentalmente:
 *
 *   - Touch: swipe manual + toque para pausa
 *   - TV:    D-pad remoto + botón play/pause
 *
 * En web, Platform.OS === 'web'.
 * En TV, Platform.OS === 'ios' o 'android' (según el dispositivo),
 * pero Platform.isTV === true.
 *
 * Esto significa que NO usamos Platform.OS para detectar TV.
 * Platform.isTV es la única fuente de verdad fiable.
 */
export const IS_TV = Platform.isTV === true;

/*
 * ESCALAS DE TAMAÑO PARA TV
 *
 * Las TVs se ven desde 2-4 metros de distancia.
 * Lo que en un teléfono se ve bien a 30cm, en TV se ve pequeño.
 *
 * Los factores de escala son EMPÍRICOS (basados en guías de Apple HIG
 * y Android TV Design Guidelines):
 *
 *   - TV: título 48dp, descripción 28dp
 *   - Móvil: título 32dp, descripción 18dp
 *
 * Relación: 48/32 = 1.5, 28/18 ≈ 1.56
 * Usamos un factor de 1.5× para todos los textos.
 *
 * Exportamos escalas específicas para que cada componente pueda
 * multiplicar sus tamaños base según su contexto.
 */
export const TV_TEXT_SCALE = 1.5;

export function tvScale(baseSize: number): number {
  return IS_TV ? Math.round(baseSize * TV_TEXT_SCALE) : baseSize;
}

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * CONSTANTES VISUALES PARA TV
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Focus ring (anillo de enfoque):
 *   - 4dp de ancho (visible desde 3m)
 *   - Blanco con opacidad 0.9 (contrasta con cualquier fondo)
 *   - border-radius heredado del slide (4dp)
 *
 * Los colores y grosores están elegidos para ser visibles en
 * TVs LED/LCD/OLED desde distancia de sala de estar.
 * En una pantalla de 55" a 3m, 4dp equivalen aproximadamente
 * a 1cm visual — el mínimo recomendado por Apple HIG.
 */
export const TV_FOCUS_RING_WIDTH = 4;
export const TV_FOCUS_RING_COLOR = "rgba(255, 255, 255, 0.9)";
export const TV_FOCUS_RING_RADIUS = 4;

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * TIMERS DE INACTIVIDAD (TV)
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Cuando el usuario interactúa con el control remoto en TV:
 * 1. Se muestra el focus ring en el slide actual
 * 2. Se DETIENE la rotación automática (para que el usuario pueda leer)
 * 3. Si el usuario NO presiona ningún botón durante INACTIVITY_TIMEOUT_MS,
 *    se REANUDA la rotación automática.
 *
 * 10 segundos es suficiente para:
 *   - Leer el slide actual (el usuario ya lo estaba viendo)
 *   - No hacer la espera frustrante (más de 15s es molesto)
 *   - No reanudar demasiado rápido (menos de 5s no da tiempo a leer)
 */
export const INACTIVITY_TIMEOUT_MS = 10_000;
export const AUTO_ROTATION_INTERVAL_MS = 5000;

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * EVENTOS DEL CONTROL REMOTO
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * react-native-tvos expone los eventos del control remoto Apple TV
 * y del D-pad de Android TV a través de TVEventHandler.
 *
 * Los eventType disponibles:
 *
 *   Apple TV Siri Remote:
 *     'swipeLeft', 'swipeRight'  → deslizar en el touchpad
 *     'left', 'right'            → botón izquierdo/derecho del ring
 *     'playPause'                → botón play/pause
 *     'select'                   → toque en el centro del touchpad
 *     'menu'                     → botón menu
 *     'up', 'down'               → botón arriba/abajo del ring
 *
 *   Android TV Remote:
 *     'left', 'right'            → D-pad left/right
 *     'playPause'                → botón play/pause
 *     'select'                   → botón OK/center
 *     'menu'                     → botón back
 *     'up', 'down'               → D-pad up/down
 *     'rewind', 'fastForward'    → avance/retroceso
 *
 * Para nuestra cartelera, solo necesitamos:
 *   - left/right → navegar entre slides
 *   - playPause  → pausar/reanudar rotación
 *   - select     → toggle pausa (fallback táctil en TV)
 */
export const TV_EVENT_LEFT = "left";
export const TV_EVENT_RIGHT = "right";
export const TV_EVENT_PLAY_PAUSE = "playPause";
export const TV_EVENT_SELECT = "select";
