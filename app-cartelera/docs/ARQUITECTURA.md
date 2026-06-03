# Arquitectura de la Cartelera Digital

## 1. Filosofía Arquitectónica

```text
No memorices sintaxis, entiende por qué el código está organizado así.
Cada decisión en esta arquitectura es una respuesta a una restricción
del mundo real: pantallas de diferentes tamaños, rotación de dispositivo,
rendimiento en mobile, facilidad de mantenimiento.
```

### Principios Rectores

| Principio | Significado | Consecuencia |
|---|---|---|
| **Separation of Concerns** | Cada archivo hace UNA cosa | `types/` define datos, `data/` los provee, `components/` los renderiza |
| **Single Responsibility** | Cada componente tiene UNA razón para cambiar | `BillboardSlide` cambia si cambia el DISEÑO visual, `Billboard` cambia si cambia la LÓGICA |
| **Composition > Inheritance** | Unir componentes pequeños > extender clases grandes | `Billboard` TIENE UN `BillboardSlide` y TIENE UN `SlideIndicator` |
| **Unidirectional Data Flow** | Los datos fluyen de padre a hijo | `Billboard` → `BillboardSlide` (props), nunca al revés |
| **Static Typing** | Los contratos se verifican en compilación | `interface Announcement` define el molde de los datos |

---

## 2. Estructura de Directorios

```text
src/
├── app/               ← RUTAS (Expo Router, file-based routing)
│   ├── _layout.tsx    ← Layout raíz (Stack navigator)
│   └── index.tsx      ← Ruta "/" — punto de entrada
│
├── components/        ← COMPONENTES REUTILIZABLES (UI)
│   ├── layouts/            ← MOTOR DE DISTRIBUCIONES
│   │   ├── layouts.ts      ← Registro de variaciones (10 layouts)
│   │   └── LayoutEngine.tsx ← Motor que interpreta y renderiza layouts
│   │
│   ├── media/              ← COMPONENTES DE CONTENIDO MULTIMEDIA
│   │   ├── VideoPlayer.tsx ← Reproduce video (expo-av)
│   │   ├── StoryPanel.tsx  ← Muestra imágenes en formato historia
│   │   └── ImageGrid.tsx   ← Grid 2×2 con paginación
│   │
│   ├── Billboard.tsx       ← Orquestador (container inteligente)
│   ├── BillboardSlide.tsx  ← Slide que usa LayoutEngine según layoutId
│   └── SlideIndicator.tsx  ← Dots de navegación (presentacional)
│
├── data/              ← CAPA DE DATOS (mock, API, cache)
│   └── announcements.ts   ← Anuncios de ejemplo con contenido multimedia
│
├── types/             ← CONTRATOS (interfaces TypeScript)
│   └── index.ts            ← Announcement, MediaContent, LayoutDefinition
│
└── utils/             ← UTILIDADES
    └── tv.ts               ← TV detection, escalas, constantes
```

### ¿Por qué esta separación?

```text
app/       → depende de qué RUTAS existen (cambia si agregas pantallas)
components/→ depende de CÓMO se ve la UI (cambia si rediseñas)
data/      → depende de DÓNDE vienen los datos (cambia si migras de API)
types/     → depende de QUÉ forma tienen los datos (cambia si evoluciona el negocio)

Si todo estuviera en un solo archivo, cambiar una cosa rompe todo.
Separando, puedes cambiar la fuente de datos sin tocar la UI.
```

---

## 3. Árbol de Componentes

```text
<App> (expo-router/entry)
  └── <Stack> (_layout.tsx)
        └── <Billboard> (index.tsx → "/")
              │
              │   Estado:  currentSlideIndex, isPaused, isTVFocused,
              │           forcedLayoutId
              │   Efectos: setInterval (timer), scrollTo (sincronización),
              │            TVEventHandler (control remoto)
              │   Ref:     scrollViewRef, tvEventHandlerRef,
              │            inactivityTimerRef, lastInteractionRef
              │
              ├── <ScrollView horizontal pagingEnabled>
              │     └── <View> (contenedor de slides, width = N × screenWidth)
              │           ├── <BillboardSlide announcement={0} isActive={true/false}>
              │           │     └── <LayoutEngine layout={...} content={...}>
              │           │           ├── <VideoPlayer />     (si el área es video)
              │           │           ├── <StoryPanel />      (si el área es story)
              │           │           └── <ImageGrid />       (si el área es grid)
              │           ├── <BillboardSlide announcement={1} .../>
              │           └── ... (10 slides en total)
              │
              ├── {isPaused && <PauseOverlay />}
              │     └── Muestra "PAUSADO" + layout actual + instrucciones
              │
              └── <SlideIndicator totalSlides={10} activeIndex={n} />
```

### Container vs. Presentational (Actualizado)

| Componente | Tipo | Estado interno | Efectos |
|---|---|---|---|
| `Billboard` | **Container** (inteligente) | `currentSlideIndex`, `isPaused`, `isTVFocused`, `forcedLayoutId` | `setInterval`, `scrollTo`, `TVEventHandler`, `inactivityTimer` |
| `BillboardSlide` | **Presentational** (tonto) | No | No |
| `SlideIndicator` | **Presentational** (tonto) | No | No |
| `LayoutEngine` | **Presentational** (tonto) | No | No |
| `VideoPlayer` | **Presentational** (tonto, con refs) | No | `playAsync/pauseAsync` según `isActive` |
| `StoryPanel` | **Presentational** (tonto) | `currentIndex` (interno, avance auto) | `setInterval` para avanzar imágenes |
| `ImageGrid` | **Presentational** (tonto) | `page` (interno, paginación auto) | `setInterval` para avanzar páginas |

```text
NOTA: StoryPanel e ImageGrid tienen ESTADO INTERNO pero es estado de
PRESENTACIÓN (qué imagen mostrar), no de NEGOCIO (qué datos mostrar).
El estado de negocio sigue siendo manejado por Billboard.

Esta es una excepción controlada al patrón container-presentational:
el estado interno de avance de imágenes es responsabilidad del
componente visual, no del orquestador.
```

### Container vs. Presentational

| Componente | Tipo | Estado interno | Efectos | Props que recibe |
|---|---|---|---|---|
| `Billboard` | **Container** (inteligente) | `currentSlideIndex`, `isPaused` | `setInterval`, `scrollTo` | Ninguna (usa datos internos) |
| `BillboardSlide` | **Presentational** (tonto) | No | No | `announcement: Announcement` |
| `SlideIndicator` | **Presentational** (tonto) | No | No | `totalSlides: number`, `activeIndex: number` |

```text
Los componentes presentacionales son FUNCIONES PURAS:
  f(props) → JSX
  Sin efectos secundarios. Sin estado. 100% predecibles.

El componente container es el CEREBRO:
  - Decide qué datos mostrar
  - Maneja el timer
  - Sincroniza el scroll
  - Pasa props a los hijos
```

---

## 4. Flujo de Datos (Data Flow)

### 4.1 Rotación Automática (Timer)

```text
TIMER (cada 5000ms)
  │
  ├── setCurrentSlideIndex(prev => (prev + 1) % N)
  │     │
  │     └── RE-RENDER (currentSlideIndex cambia)
  │           │
  │           ├── useEffect([currentSlideIndex, screenWidth])
  │           │     └── scrollViewRef.current.scrollTo({ x: newIndex * screenW })
  │           │           └── ScrollView se mueve al siguiente slide
  │           │
  │           ├── SlideIndicator.activeIndex = newIndex (dots se actualizan)
  │           │
  │           └── BillboardSlide recibe announcement correcto
  │
  └── onMomentumScrollEnd NO se dispara (solo scroll manual)
```

### 4.2 Scroll Manual (Usuario)

```text
USUARIO desliza el dedo
  │
  ├── ScrollView.scroll (nativo, animación)
  │     │
  │     └── pagingEnabled → snap al slide más cercano
  │           │
  │           └── onMomentumScrollEnd se dispara (1 vez)
  │                 │
  │                 └── handleMomentumScrollEnd()
  │                       │
  │                       ├── newIndex = Math.round(contentOffset.x / screenWidth)
  │                       │
  │                       └── setCurrentSlideIndex(newIndex)
  │                             │
  │                             └── RE-RENDER (dots se actualizan)
  │                                   │
  │                                   └── useEffect scrollTo()
  │                                         └── scrollTo() al slide actual
  │                                               (no-op, ya estamos ahí)
  │
  └── setInterval sigue corriendo (el timer no se reinicia)
```

### 4.3 Toggle Pausa

```text
USUARIO toca la pantalla
  │
  ├── Pressable.onPress → handleTogglePause()
  │     │
  │     └── setIsPaused(prev => !prev)
  │           │
  │           ├── isPaused = true:
  │           │     └── useEffect([isPaused]) → early return (no crea intervalo)
  │           │           └── NUEVO intervalo NO se crea → rotación DETENIDA
  │           │
  │           └── isPaused = false:
  │                 └── useEffect([isPaused]) → crea nuevo intervalo
  │                       └── Rotación REANUDADA
  │
  └── PauseOverlay se muestra/oculta (renderizado condicional)
```

---

## 5. Estado y Ciclo de Vida

### 5.1 useState

```typescript
const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
const [isPaused, setIsPaused] = useState(false);
const [isTVFocused, setIsTVFocused] = useState(false);  // ← solo relevante en TV
```

| Variable | Tipo | Inicial | ¿Qué controla? |
|---|---|---|---|
| `currentSlideIndex` | `number` | `0` | Qué slide se muestra y qué dot está activo |
| `isPaused` | `boolean` | `false` | Si el timer de rotación está activo o no |
| `isTVFocused` | `boolean` | `false` | Si el anillo de enfoque TV es visible (solo en TV) |

```text
REGLAS DEL ESTADO EN REACT:
1. No modifiques el estado directamente (no: currentSlideIndex = 5)
2. Usa la FORMA FUNCIONAL cuando el nuevo valor depende del anterior:
     setCurrentSlideIndex(prev => (prev + 1) % N)  ← correcto
     setCurrentSlideIndex(currentSlideIndex + 1)     ← incorrecto (stale closure)
3. Estado derivado no se guarda en useState:
     const currentAnnouncement = ANNOUNCEMENTS[currentSlideIndex];  ← correcto
```

### 5.2 useEffect

**Efecto 1 — Timer de rotación:**
```typescript
useEffect(() => {
  if (isPaused) return;            // ← guard clause
  const id = setInterval(advance, 5000);
  return () => clearInterval(id);  // ← cleanup OBLIGATORIO
}, [isPaused]);                    // ← solo se re-ejecuta si cambia isPaused
```

| Dependencia | ¿Por qué está? |
|---|---|
| `isPaused` | Si el usuario pausa, el intervalo debe detenerse. Si reanuda, debe crearse uno nuevo. |

**Efecto 2 — Sincronización del scroll:**
```typescript
useEffect(() => {
  scrollViewRef.current?.scrollTo({
    x: currentSlideIndex * screenWidth,
    animated: true,
  });
}, [currentSlideIndex, screenWidth]);
```

| Dependencia | ¿Por qué está? |
|---|---|
| `currentSlideIndex` | Cuando el timer avanza o el usuario scrollea, el ScrollView debe moverse. |
| `screenWidth` | Si la pantalla gira, el cálculo cambia. |

```text
PATRÓN DE LIMPIEZA (CLEANUP):
  useEffect(() => {
    const resource = createResource();
    return () => destroyResource(resource);  ← SIEMPRE limpia
  }, [dependencies]);

  Sin cleanup: memory leaks, fugas de suscripciones, timers huérfanos.
  Con cleanup: el componente es CIUDADANO de primera clase (puede nacer/morir).
```

### 5.3 useRef

```typescript
const scrollViewRef = useRef<ScrollView>(null);
const tvEventHandlerRef = useRef<TVEventHandler | null>(null);  // ← solo TV
const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // ← solo TV
const lastInteractionRef = useRef<number>(0);  // ← solo TV
```

| Ref | Propósito |
|---|---|
| `scrollViewRef` | Llamar `scrollTo()` en el ScrollView nativo |
| `tvEventHandlerRef` | Registrar/desregistrar el listener de control remoto TV |
| `inactivityTimerRef` | Timer de inactividad para reanudar rotación automática en TV |
| `lastInteractionRef` | Timestamp (Date.now) de la última interacción del usuario en TV |

```text
Diferencia clave:
  - useState: cambiar el valor → RE-RENDER
  - useRef:   cambiar .current → NO RE-RENDER

useRef es para valores que PERSISTEN entre renders pero cuyo cambio
no debe pintar la UI de nuevo. Como un "armario" donde guardas cosas
que no afectan la interfaz.
```

### 5.4 useCallback

```typescript
const handleMomentumScrollEnd = useCallback(
  (event) => { ... },
  [screenWidth, currentSlideIndex]
);

const handleTogglePause = useCallback(
  () => { setIsPaused(prev => !prev); },
  []  // ← vacío: misma función para SIEMPRE
);
```

| useCallback | Dependencias | ¿Por qué? |
|---|---|---|
| `handleMomentumScrollEnd` | `screenWidth`, `currentSlideIndex` | Necesita valores actuales para calcular el índice |
| `handleTogglePause` | `[]` | Usa forma funcional de setState, no necesita valores externos |

---

## 6. Manejo de Eventos

### 6.1 ¿Por qué `onMomentumScrollEnd` y no `onScroll`?

```text
onScroll:
  - Se dispara ~60 veces/segundo durante el scroll
  - Se dispara TANTO en scroll manual COMO en scrollTo() programático
  - PELIGRO: causa feedback loop con el scrollTo() del timer

onMomentumScrollEnd:
  - Se dispara 1 VEZ cuando el scroll COMPLETA (dedo levantado + animación termina)
  - Solo se dispara en scroll MANUAL del usuario
  - NO se dispara en scrollTo() programático
  - Rompe el ciclo de retroalimentación
```

**El bug que evitamos:**

```text
Timer avanza 0→1
  → useEffect scrollTo(x: screenWidth)
    → onScroll se dispara en posición intermedia 0.3×screenWidth
      → handleScroll calcula Math.round(0.3) = 0
        → setCurrentSlideIndex(0)
          → useEffect scrollTo(x: 0)
            → onScroll se dispara... (CICLO INFINITO)
```

**Solución:** `onMomentumScrollEnd` no se dispara durante `scrollTo()` programático, rompiendo el ciclo.

---

## 7. Arquitectura TV

### 7.1 ¿Por qué react-native-tvos?

```text
React Native tiene un fork MANTENIDO por la comunidad ( @react-native-tvos )
que agrega soporte nativo para Apple TV (tvOS) y Android TV.

La integración es transparente:
  npm install react-native-tvos
  // package.json: "react-native": "npm:react-native-tvos@version"

A partir de ahí, TODAS las importaciones de 'react-native' incluyen
automáticamente los componentes y APIs de TV:
  TVFocusGuideView, TVEventHandler, Platform.isTV, etc.

No hay que instalar nada aparte. El fork es 100% compatible con
Expo (gracias al config plugin @react-native-tvos/config-tv).
```

### 7.2 Detección de Plataforma

```typescript
// react-native-tvos agrega Platform.isTV a la API de Platform
import { Platform } from "react-native";

Platform.isTV    // true en Apple TV y Android TV
Platform.isTVOS  // true solo en Apple TV
Platform.isAndroidTV // true solo en Android TV
Platform.OS      // 'ios' en tvOS, 'android' en Android TV
```

```text
Usamos Platform.isTV como la ÚNICA fuente de verdad. No nos importa
si es Apple TV o Android TV porque el comportamiento UX es el mismo:
control remoto con D-pad + botón play/pause.

Platform.OS NO sirve para detectar TV. En tvOS, Platform.OS === 'ios'.
En Android TV, Platform.OS === 'android'. La única forma fiable de
saber si estamos en TV es Platform.isTV.

En desarrollo web (npx expo start --web), Platform.isTV es false.
Todo el código TV se omite vía dead-code elimination del compilador
(condiciones con IS_TV que el minimizador elimina).
```

### 7.3 Capa de Abstracción TV (src/utils/tv.ts)

Toda la lógica TV se centraliza en `src/utils/tv.ts`:

```typescript
// Detección
export const IS_TV = Platform.isTV === true;

// Escalado de texto (TV: 1.5× para legibilidad desde 3m)
export const TV_TEXT_SCALE = 1.5;
export function tvScale(baseSize: number): number {
  return IS_TV ? Math.round(baseSize * TV_TEXT_SCALE) : baseSize;
}

// Focus ring (anillo de enfoque visual)
export const TV_FOCUS_RING_WIDTH = 4;
export const TV_FOCUS_RING_COLOR = "rgba(255, 255, 255, 0.9)";

// Timeouts
export const INACTIVITY_TIMEOUT_MS = 10_000;  // 10s sin input → reanudar
export const AUTO_ROTATION_INTERVAL_MS = 5000;

// Eventos del control remoto
export const TV_EVENT_LEFT = "left";
export const TV_EVENT_RIGHT = "right";
export const TV_EVENT_PLAY_PAUSE = "playPause";
export const TV_EVENT_SELECT = "select";
```

```text
¿Por qué centralizar en utils/tv.ts?

1. EVITAR Platform.isTV esparcido por todo el código.
   Si mañana cambia la API de detección, cambias 1 archivo.

2. CONSTANTES NOMBRADAS eliminan magic numbers.
   10000 → INACTIVITY_TIMEOUT_MS (autodocumentado).

3. tvScale() como FUNCIÓN PURA permite escalar cualquier
   tamaño base sin if/IS_TV en cada componente.
```

### 7.4 TVEventHandler — Control Remoto

`TVEventHandler` es un singleton que escucha TODOS los eventos del control remoto:

```typescript
import { TVEventHandler } from "react-native";

useEffect(() => {
  const handler = new TVEventHandler();
  handler.enable(null, (component, event) => {
    // event.eventType: 'left', 'right', 'playPause', 'select', etc.
    if (event.eventType === "right") {
      // avanzar slide
    }
  });
  return () => handler.disable();  // ← cleanup OBLIGATORIO
}, []);
```

```text
Eventos disponibles en Apple TV Siri Remote:
  'swipeLeft', 'swipeRight'  → touchpad deslizar
  'left', 'right'            → ring izquierdo/derecho
  'playPause'                → botón play/pause
  'select'                   → centro del touchpad
  'menu'                     → botón menu
  'up', 'down'               → ring arriba/abajo

Eventos disponibles en Android TV:
  'left', 'right'            → D-pad
  'playPause'                → botón play/pause
  'select'                   → botón OK
  'up', 'down'               → D-pad
  'rewind', 'fastForward'    → avance/retroceso

Cleanup OBLIGATORIO: si el componente se desmonta sin llamar
handler.disable(), el event handler SIGUE VIVO en memoria y
sigue ejecutando callbacks en un componente muerto.
ESTO ES UN MEMORY LEAK.
```

### 7.5 Focus Ring Visual

En TV, cuando el usuario presiona un botón del control remoto:

```text
1. isPaused = true          → rotación DETENIDA
2. isTVFocused = true       → focus ring VISIBLE
3. resetInactivityTimer()   → inicia cuenta regresiva de 10s
4. Después de 10s sin input → isPaused = false, isTVFocused = false
                              rotación REANUDADA, focus ring OCULTO
```

El focus ring NO usa el sistema de foco nativo de TV (`onFocus`/`onBlur`):

```text
¿Por qué no usar onFocus/onBlur nativo?

El ScrollView con pagingEnabled tiene un comportamiento impredecible
con el TV focus engine. Scroll y foco nativo COMPITEN:
cuando el scroll avanza, el foco nativo se pierde.

Solución: el focus ring es puramente VISUAL. Billboard controla
qué slide tiene el anillo a través de la prop isTVFocused,
sincronizada con currentSlideIndex.

Esto se llama "focus visual" vs "focus funcional":
  - Focus funcional: el TV sabe qué elemento está enfocado (onFocus)
  - Focus visual:    la UI muestra un anillo en el elemento actual
                     (isTVFocused prop)

Nuestra implementación es visual. El TV no necesita saber qué
slide está "enfocado" porque la navegación se maneja completamente
desde Billboard con TVEventHandler.
```

Implementación en `BillboardSlide.tsx`:

```typescript
<View style={[
  styles.container,
  { backgroundColor },
  IS_TV && isTVFocused && {
    borderWidth: TV_FOCUS_RING_WIDTH,      // 4dp
    borderColor: TV_FOCUS_RING_COLOR,       // blanco 90% opaco
  },
]}>
```

### 7.6 Escalado de Texto para TV

```text
En un teléfono (30cm de distancia): 32dp de título es legible.
En una TV (3m de distancia): 32dp se ve como 8dp efectivos.

Factor de escala: 1.5×
  - Título: 32 → 48dp
  - Descripción: 18 → 28dp
  - Line-height: 28 → 42dp

Guías seguidas:
  - Apple Human Interface Guidelines (tvOS): 44dp mínimo para texto legible
  - Android TV Design Guidelines: 40sp mínimo para texto primario
```

```typescript
// BillboardSlide.tsx
<Text style={[
  styles.title,
  IS_TV && { fontSize: tvScale(32) },  // 48dp en TV
]}>
  {title}
</Text>
```

### 7.7 Mecanismo de Inactividad

Cuando el usuario usa el control remoto en TV:

```text
1. Presiona left/right/playPause
2. setIsPaused(true)          → rotación DETENIDA
3. setIsTVFocused(true)       → focus ring visible
4. lastInteractionRef = Date.now()  → marca la última interacción
5. Se CANCELA el timer anterior (si existe)
6. Se CREA un NUEVO setTimeout de INACTIVITY_TIMEOUT_MS (10s)
7. Si pasa 10s sin interacción:
   - Verifica que Date.now() - lastInteractionRef >= 10s
   - setIsPaused(false)       → rotación REANUDADA
   - setIsTVFocused(false)    → focus ring OCULTO
8. Si el usuario vuelve a interactuar antes de 10s:
   - Vuelve al paso 4 (reset del timer)
```

```text
Este es el mismo patrón que un "debounce" o "idle timer":
el timer se reinicia en cada interacción y solo se ejecuta
cuando hay un período CONTINUO de inactividad.

Diferencia con un debounce clásico:
  Debounce: espera Nms después de la ÚLTIMA llamada
  Idle timer: espera Nms de SILENCIO continuo

Nuestra implementación es un idle timer porque queremos que
la rotación se reanude después de Nms sin NINGUNA interacción.
```

### 7.8 Flujo TV Completo

```text
USUARIO presiona RIGHT en el control remoto
  │
  ├── TVEventHandler detecta 'right'
  │     │
  │     ├── setCurrentSlideIndex(prev => (prev + 1) % N)
  │     ├── setIsPaused(true)
  │     ├── setIsTVFocused(true)
  │     └── resetInactivityTimer()
  │           │
  │           ├── lastInteractionRef = Date.now()
  │           ├── clearTimeout(timer anterior)
  │           └── setTimeout(10s) → reanudar rotación
  │
  ├── RE-RENDER:
  │     ├── ScrollView.scrollTo() → nuevo slide
  │     ├── BillboardSlide.isTVFocused = true → focus ring visible
  │     ├── SlideIndicator.activeIndex = newIndex
  │     └── PauseOverlay VISIBLE
  │
  └── setInterval DETENIDO (isPaused = true)
        └── (se reanudará en 10s si no hay más interacción)

vs.

USUARIO desliza el dedo en MÓVIL
  ├── onMomentumScrollEnd → setCurrentSlideIndex
  ├── setInterval SIGUE CORRIENDO (no se pausa)
  └── No hay focus ring, no hay timeout de inactividad
```

### 7.9 TVFocusGuideView

`TVFocusGuideView` es un contenedor que agrupa elementos focusables para el TV focus engine:

```tsx
// Billboard.tsx
const ContainerComponent = IS_TV ? TVFocusGuideView : View;

<ContainerComponent style={styles.container}>
  {/* slides y dots */}
</ContainerComponent>
```

```text
En móvil: ContainerComponent = View (sin efecto).
En TV: ContainerComponent = TVFocusGuideView (habilita navegación D-pad).

TVFocusGuideView le dice al TV focus engine: "todos los elementos
dentro de mí pueden recibir foco". Sin esto, el control remoto
no tiene efecto aunque tengamos TVEventHandler.

El Pressable padre también tiene:
  isTVSelectable: true    → el elemento puede recibir foco
  hasTVPreferredFocus: true → recibe el foco al iniciar la app

En móvil/web, estas props son ignoradas por react-native estándar.
```

### 7.10 TV vs. Móvil: Diferencias Clave

| Aspecto | Móvil | TV |
|---|---|---|
| **Navegación** | Swipe táctil (ScrollView) | Control remoto (TVEventHandler) |
| **Pausa** | Tocar la pantalla | Botón Play/Pause del control |
| **Focus actual** | No aplica | Focus ring visual (borde blanco 4dp) |
| **Tamaño texto** | 32dp título, 18dp descripción | 48dp título, 28dp descripción |
| **Auto-rotación** | Siempre activa (salvo pausa táctil) | Se pausa al interactuar, reanuda tras 10s inactividad |
| **Timer** | Nunca se reinicia | Se reinicia en cada interacción |
| **Container** | `<View>` | `<TVFocusGuideView>` |
| **Pressable** | `onPress` para pausar | `isTVSelectable` + `hasTVPreferredFocus` para foco |
| **Dots indicator** | 10px activo, 8px inactivo | 15px activo, 12px inactivo (tvScale 1.5×) |
| **Feedback visual** | Ninguno | Focus ring + overlay "Play/Pause para reanudar" |

### 7.1 Tipos del Sistema de Layouts

El sistema introduce nuevos contratos además de `Announcement`:

**MediaContent** — una pieza individual de contenido multimedia:
```typescript
export interface MediaContent {
  readonly type: "video" | "image" | "image-story";
  readonly url: string;
  readonly durationMs?: number;    // duración de visualización (ms)
  readonly posterUrl?: string;     // imagen de portada para video
  readonly title?: string;        // título opcional
}
```

**LayoutAreaConfig** — una región del layout:
```typescript
export interface LayoutAreaConfig {
  readonly id: string;           // identificador único del área
  readonly type: "video" | "story" | "image-grid" | "text" | "stack";
  readonly flex: number;         // proporción relativa
  readonly direction?: "row" | "column";  // dirección interna (para story/stack)
  readonly children?: LayoutAreaConfig[]; // sub-áreas (solo para stack)
  readonly style?: { ... };      // borderRadius, padding, backgroundColor
}
```

**LayoutDefinition** — la definición completa de una distribución:
```typescript
export interface LayoutDefinition {
  readonly id: string;           // "video-left-story-right"
  readonly name: string;         // "Video Izquierda / Historia Derecha"
  readonly description: string;
  readonly icon: string;         // "🎬"
  readonly direction: "row" | "column";
  readonly areas: LayoutAreaConfig[];
}
```

**Announcement** (actualizado) — ahora incluye layout y contenido:
```typescript
export interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly date: string;
  readonly backgroundColor?: string;
  readonly layoutId: string;     // qué layout usar
  readonly content: {           // contenido para cada área
    readonly [areaId: string]: readonly MediaContent[];
  };
}
```

```text
EL CONTRATO CENTRAL: layoutId + content

  layoutId define la ESTRUCTURA (dónde va cada cosa).
  content[areaId] define los DATOS (qué va en cada lugar).

  La conexión entre ambos es el ID del área:
    LayoutDefinition.areas[0].id = "video"
    Announcement.content.video   = [video, ...]

  Si el layout define un área "story-top" pero el content
  no tiene esa clave → se muestra "Sin contenido".
  Si el content tiene "story-extra" pero el layout no → se ignora.

  Esto es FLEXIBLE (no hay crash) pero QUIET (el error es silencioso).
```

### 7.2 `as const satisfies`

```typescript
export const ANNOUNCEMENTS = [
  { id: "1", title: "...", date: "2025-01-15", ... },
  ...
] as const satisfies Announcement[];
```

| Keyword | Función | Sin ella |
|---|---|---|
| `as const` | Infiere VALORES LITERALES como tipos | `date` sería `string` (genérico), no `"2025-01-15"` (específico) |
| `satisfies` | Verifica que cumple el contrato `Announcement[]` | El tipo se INFIERE, no se VERIFICA contra el contrato |

---

## 8. Layout y Estilos

### 8.1 Flexbox en React Native

```text
Diferencias con CSS web:
  - flexDirection por defecto: 'column' (web: 'row')
  - No hay "display: grid", "display: inline-flex"
  - Flex: 1 significa "ocupa TODO el espacio disponible"
  - No hay "box-shadow", "border-radius" requiere propiedades explícitas

En esta app:
  - Pressable: flex: 1 (ocupa toda la pantalla)
  - ScrollView: flex: 1 (hereda el espacio del padre)
  - slidesContainer: flexDirection: 'row' + flex: 1
  - Cada slide: width: screenWidth (ancla al tamaño de pantalla)
  - SlideIndicator: position: 'absolute' (flota sobre el contenido)
```

### 8.2 StyleSheet.create() vs. objetos inline

| Aspecto | `StyleSheet.create()` | Objeto inline `{}` |
|---|---|---|
| Validación | Sí (warnings en desarrollo) | No |
| Optimización bridge | Sí (IDs numéricos en producción) | No (serializa JSON en cada render) |
| Referencia | Constante (misma referencia) | Nueva en cada render |
| Cuándo usarlo | Estilos ESTÁTICOS | Estilos DINÁMICOS (basados en props/estado) |

---

## 9. Patrón de Renderizado Condicional

```typescript
{isPaused && (
  <View style={styles.pauseOverlay} pointerEvents="none">
    <Text>PAUSADO</Text>
  </View>
)}
```

```text
Mecanismo: short-circuit evaluation (&&)
  isPaused es true  → renderiza <View>
  isPaused es false → no renderiza nada

pointerEvents="none":
  Permite que los toques "atraviesen" el overlay.
  Sin esto, el overlay atraparía el toque y no se podría
  reanudar tocando la pantalla.
```

---

## 10. Cómo Extender

### 10.1 Agregar más anuncios

Editar `src/data/announcements.ts`:

```typescript
export const ANNOUNCEMENTS = [
  // ... existentes ...
  {
    id: "5",
    title: "Nuevo anuncio",
    description: "Descripción",
    date: "2025-01-19",
    backgroundColor: "#e94560",
  },
] as const satisfies Announcement[];
```

### 10.2 Conectar a API real

Crear `src/hooks/useAnnouncements.ts`:

```typescript
export function useAnnouncements() {
  const [data, setData] = useState<Announcement[]>([]);
  useEffect(() => {
    fetch("https://api.tuservidor.com/announcements")
      .then(res => res.json())
      .then(setData);
  }, []);
  return data;
}
```

Luego en `Billboard.tsx`, reemplazar:

```typescript
// Antes:
import { ANNOUNCEMENTS } from "../data/announcements";

// Después:
import { useAnnouncements } from "../hooks/useAnnouncements";
const ANNOUNCEMENTS = useAnnouncements();
```

### 10.3 Agregar un nuevo layout

Ver documentación completa en `docs/DISTRIBUCIONES.md` (Sección 6).
Resumen: agregar un objeto al array `LAYOUTS` en `layouts.ts` y
el contenido correspondiente en `announcements.ts`. No necesitas
tocar ningún componente.

### 10.4 Cambiar velocidad de rotación

Editar la constante en `src/utils/tv.ts`:

```typescript
export const AUTO_ROTATION_INTERVAL_MS = 3000; // 3 segundos
```

### 10.5 Cambiar velocidad de las stories

Editar la constante en `src/components/media/StoryPanel.tsx`:

```typescript
const STORY_DURATION_MS = 3000; // 3 segundos por imagen
```

### 10.6 Agregar animaciones entre imágenes de story

Actualmente las stories usan cambio directo (cut). Para fade:

En `StoryPanel.tsx`, reemplazar `<Image>` con `<Animated.Image>`
usando `react-native-reanimated` (ya incluido) y `withTiming`.

### 10.7 Forzar un layout desde el código

En `Billboard.tsx`, `forcedLayoutId` permite sobrescribir el layout
del anuncio actual. Se puede llamar programáticamente:

```typescript
setForcedLayoutId("video-full"); // fuerza layout fullscreen
```

El forzado expira después de 15s (3 ciclos de rotación) y vuelve
al layout original del anuncio.

---

## 11. Resumen de Conceptos de CS Aplicados

| Concepto | ¿Dónde se aplica? | ¿Por qué importa? |
|---|---|---|---|
| **Función pura** | `BillboardSlide`, `SlideIndicator`, `LayoutEngine` | Misma entrada = misma salida. Predecible, testeable. |
| **Estado vs. derivado** | `currentAnnouncement` se calcula de `currentSlideIndex` | Menos estado = menos bugs de inconsistencias. |
| **Closures (cierres)** | `setInterval` callback captura variables | Si no usas forma funcional de setState, tienes stale closures. |
| **Cortocircuito** | `{isPaused && <Overlay />}` | Renderizado condicional sin if/else. |
| **Cuantización** | `Math.round(contentOffset / screenWidth)` | Señal continua → valor discreto. |
| **Composición > Herencia** | `Billboard` = `SlideIndicator` + `BillboardSlide` + `LayoutEngine` | Más flexible que extender clases. |
| **Inmutabilidad** | `readonly` en interfaces, `as const` en datos | Menos efectos secundarios sorpresa. |
| **Módulos (ESM)** | `export`/`import` por archivo | Encapsulamiento a nivel de archivo. |
| **Event Loop** | `useEffect` se ejecuta DESPUÉS del paint | No bloquea la UI. |
| **Memory management** | `clearInterval` en cleanup | Sin cleanup = memory leak. |
| **Árbol (Tree)** | Layouts con stack (anidamiento) | Los layouts son árboles de áreas, no listas planas |
| **Recursión** | LayoutEngine se llama a sí mismo para stacks | Renderiza profundidad arbitraria de anidamiento |
| **Configuración declarativa** | Layouts definidos como datos en layouts.ts | Agregar layout = agregar datos, no código |
| **Registro (Registry)** | LAYOUTS array central | Todos los layouts en un solo lugar, buscables por ID |
| **Ciclo de vida (Lifecycle)** | isActive controla play/pause de cada área | Solo el slide visible consume recursos |

---

## 12. Lecturas Recomendadas

Este documento cubre la arquitectura GENERAL del proyecto.
Para el sistema de distribuciones (layouts) en detalle absoluto,
incluyendo mapa mental, las 10 variaciones con diagramas, decisiones
de diseño, matriz de compatibilidad, y guía de extensión:

→ **`docs/DISTRIBUCIONES.md`** — Documentación completa del sistema de layouts

```text
DISTRIBUCIONES.md contiene:
  - Mapa mental del sistema de layouts
  - Las 10 variaciones de distribución (con diagramas ASCII)
  - Decisiones de diseño explicadas (por qué 60/40 y no 50/50)
  - Ciclo de vida del contenido (timelines, isActive)
  - Cómo funciona el motor de renderizado (algoritmo recursivo)
  - Cómo agregar un nuevo layout (3 pasos)
  - Consideraciones TV (códecs, framerate, resolución)
  - Mapa de archivos completo
  - Matriz de compatibilidad contenido vs layout
  - Árbol de decisión visual para elegir layout
```

---

## 13. Glosario

| Término | Definición |
|---|---|
| **JSX** | Extensión de sintaxis para JavaScript que parece HTML. Se transforma a `React.createElement()` |
| **Virtual DOM** | Representación en memoria del árbol de componentes. React lo compara (diff) con el anterior para aplicar solo cambios mínimos al DOM nativo |
| **Reconciliación** | Algoritmo de React para determinar qué cambió entre dos renders |
| **Bridge (RN)** | Canal de comunicación asíncrono entre el hilo JS y el hilo nativo |
| **JSI** | JavaScript Interface — reemplazo moderno del Bridge, permite llamadas síncronas JS↔Nativo |
| **Expo Router** | Librería de enrutamiento para React Native con file-based routing (como Next.js) |
| **Container-Presentational** | Patrón de diseño donde los componentes inteligentes manejan estado/lógica y los tontos solo renderizan props |
| **Stale Closure** | Bug donde una closure captura un valor antiguo de una variable porque la dependencia no se incluyó en el array de deps |
| **Layout** | Mapa de distribución que define cómo se organiza el contenido en la pantalla (dirección, proporciones, tipos de área) |
| **Layout Registry** | Array central de todas las definiciones de layout en `layouts.ts` |
| **LayoutEngine** | Componente que interpreta una definición de layout y renderiza las áreas con sus componentes de contenido |
| **Stack (layout)** | Área contenedora que agrupa sub-áreas con su propia dirección (row/column), permitiendo anidamiento |
| **Flex (proporción)** | Valor relativo que determina qué fracción del espacio ocupa un área respecto a sus hermanas |
| **Story** | Secuencia de imágenes que se muestran una a la vez con avance automático, similar a Instagram Stories |
| **Image Grid** | Cuadrícula 2×2 de imágenes con paginación automática, para mostrar múltiples imágenes simultáneamente |
| **isActive** | Prop que indica si un slide es el actualmente visible; controla la reproducción de video y timers de story/grid |
| **forcedLayoutId** | Mecanismo para sobrescribir temporalmente el layout de un anuncio (útil para debug y previsualización) |
