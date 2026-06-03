/*
╔══════════════════════════════════════════════════════════════════════════════════╗
║             Billboard — COMPONENTE INTELIGENTE (Container / Controller)         ║
║                                                                                 ║
║  Este es el "cerebro" de la aplicación. Orquesta a los componentes tontos       ║
║  (BillboardSlide, SlideIndicator) y maneja toda la lógica de estado:            ║
║   - Rotación automática (timer)                                                ║
║   - Navegación manual (scroll táctil + control remoto TV)                      ║
║   - Pausa/Reanudación                                                          ║
║   - Focus ring para TV                                                         ║
║   - Timeout de inactividad en TV                                               ║
║                                                                                 ║
║  La arquitectura es CONTAINER-PRESENTATIONAL:                                   ║
║    Billboard (container, inteligente)                                          ║
║      ├── BillboardSlide (presentational, tonto)                                ║
║      └── SlideIndicator (presentational, tonto)                                ║
╚══════════════════════════════════════════════════════════════════════════════════╝
*/

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * IMPORTACIONES
 * ──────────────────────────────────────────────────────────────────────────────
 * Todas las importaciones de react-native funcionan igual en react-native-tvos.
 * Los componentes TV (TVFocusGuideView, TVEventHandler, etc.) se exportan
 * desde 'react-native' cuando se usa el fork tvos.
 *
 * Platform.isTV solo es true cuando la app compila y corre para tvOS/Android TV.
 * En desarrollo web o móvil, es false y el código TV se omite vía
 * short-circuit evaluation o dead-code elimination del compilador.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  Text,
  Pressable,
  TVFocusGuideView,
  TVEventHandler,
  Platform,
} from "react-native";

import BillboardSlide from "./BillboardSlide";
import SlideIndicator from "./SlideIndicator";
import { ANNOUNCEMENTS } from "../data/announcements";

/*
 * Importamos constantes TV desde nuestra capa de utilidades.
 * Si IS_TV es false, los escalados devuelven el valor original
 * y los timeouts se ignoran.
 */
import {
  IS_TV,
  tvScale,
  INACTIVITY_TIMEOUT_MS,
  AUTO_ROTATION_INTERVAL_MS,
  TV_EVENT_LEFT,
  TV_EVENT_RIGHT,
  TV_EVENT_PLAY_PAUSE,
  TV_EVENT_SELECT,
} from "../utils/tv";

interface BillboardProps {}

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║               COMPONENTE PRINCIPAL                                          ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * El flujo completo de la cartelera:
 *
 * 1. INICIO: currentSlideIndex = 0, isPaused = false, isTVFocused = false
 * 2. TIMER: cada 5s, avanza currentSlideIndex → useEffect scrollTo()
 * 3. USUARIO (touch): swipe → onMomentumScrollEnd → actualiza índice
 * 4. USUARIO (TV): left/right → actualiza índice + pausa + focus ring
 * 5. USUARIO (TV): playPause → toggle isPaused
 * 6. TV: timeout 10s sin interacción → reanuda rotación + quita focus ring
 * 7. USUARIO: toca pantalla → toggle isPaused (válido para touch y TV)
 *
 * Cada pieza de estado es INDEPENDIENTE y ORTOGONAL:
 * - currentSlideIndex: qué slide se muestra
 * - isPaused: si el timer está activo
 * - isTVFocused: si el anillo de enfoque TV es visible
 * - lastInteractionRef (ref, no estado): cuándo fue la última interacción
 *
 * La ortogonalidad del estado evita bugs de inconsistencias
 * (ej. slide cambiando mientras está pausado).
 */

export default function Billboard(_props: BillboardProps) {
  /* ── ESTADO ────────────────────────────────────────────────────────────── */
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTVFocused, setIsTVFocused] = useState(false);

  /* ── REFERENCIAS ────────────────────────────────────────────────────────── */
  const scrollViewRef = useRef<ScrollView>(null);
  const tvEventHandlerRef = useRef<TVEventHandler | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /*
   * lastInteractionRef: cuándo fue la última vez que el usuario (TV) presionó
   * un botón del control remoto. Se usa para calcular si ya pasó el timeout
   * de inactividad. Es useRef porque NO queremos re-renderizar en cada
   * interacción — solo cuando el timeout expira (setIsTVFocused(false)).
   */
  const lastInteractionRef = useRef<number>(0);

  const { width: screenWidth } = Dimensions.get("window");

  /* ── EFECTO 1: TIMER DE ROTACIÓN AUTOMÁTICA ────────────────────────────── */
  useEffect(() => {
    if (isPaused) return;
    const intervalId = setInterval(() => {
      setCurrentSlideIndex(
        (prevIndex) => (prevIndex + 1) % ANNOUNCEMENTS.length
      );
    }, AUTO_ROTATION_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isPaused]);

  /* ── EFECTO 2: SINCRONIZACIÓN DEL SCROLL ────────────────────────────────── */
  useEffect(() => {
    scrollViewRef.current?.scrollTo({
      x: currentSlideIndex * screenWidth,
      y: 0,
      animated: true,
    });
  }, [currentSlideIndex, screenWidth]);

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * EFECTO 3: TV EVENT HANDLER (CONTROL REMOTO)
   * ──────────────────────────────────────────────────────────────────────────
   *
   * TVEventHandler es un singleton que escucha TODOS los eventos del control
   * remoto. Se registra al montar el componente y se desregistra al desmontar.
   *
   * El callback recibe (component, event):
   *   - component: el componente React que está enfocado (o null si no hay)
   *   - event: { eventType: string, ... }
   *
   * Este efecto SOLO se activa si IS_TV === true (Platform.isTV).
   * En móvil/web, el effect se salta completamente.
   *
   * DESPUÉS de manejar el evento, llamamos a resetInactivityTimer()
   * para reiniciar la cuenta regresiva antes de reanudar la rotación.
   *
   * ──────────────────────────────────────────────────────────────────────────
   * INACTIVIDAD
   * ──────────────────────────────────────────────────────────────────────────
   *
   * En TV, cuando el usuario interactúa:
   *   1. Detenemos la rotación (isPaused = true) para que pueda leer
   *   2. Mostramos el focus ring (isTVFocused = true)
   *   3. Iniciamos un timer de INACTIVITY_TIMEOUT_MS
   *   4. Si el usuario no presiona nada en ese tiempo:
   *      - Reanudamos rotación (isPaused = false)
   *      - Ocultamos focus ring (isTVFocused = false)
   *
   * Esto es análogo al "screensaver mode" de los reproductores de video:
   * los controles aparecen cuando interactúas y desaparecen después
   * de unos segundos sin input.
   *
   * La inactividad se maneja con un setTimeout que:
   *   1. Se CANCELA si el usuario vuelve a interactuar (reset de timer)
   *   2. Se EJECUTA si pasa INACTIVITY_TIMEOUT_MS sin interacción
   *
   * Es el mismo patrón que un "debounce" pero con timeout fijo.
   * ──────────────────────────────────────────────────────────────────────────
   */

  const resetInactivityTimer = useCallback(() => {
    /*
     * Marcamos la última interacción como AHORA.
     * Este valor se lee en el timeout para verificar si pasó suficiente tiempo.
     */
    lastInteractionRef.current = Date.now();

    /*
     * Cancelamos el timer anterior si existe.
     * Esto evita que múltiples timeouts se acumulen.
     */
    if (inactivityTimerRef.current !== null) {
      clearTimeout(inactivityTimerRef.current);
    }

    /*
     * Configuramos un NUEVO timer de inactividad.
     * Cuando se ejecute, verificaremos que efectivamente pasó
     * INACTIVITY_TIMEOUT_MS desde la ÚLTIMA interacción.
     * (Esta verificación extra evita condiciones de carrera).
     */
    inactivityTimerRef.current = setTimeout(() => {
      const elapsed = Date.now() - lastInteractionRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        setIsPaused(false);
        setIsTVFocused(false);
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!IS_TV) return;

    const handler = new TVEventHandler();
    tvEventHandlerRef.current = handler;

    handler.enable(null, (_component, event) => {
      const { eventType } = event;

      if (eventType === TV_EVENT_LEFT) {
        setCurrentSlideIndex(
          (prev) => (prev - 1 + ANNOUNCEMENTS.length) % ANNOUNCEMENTS.length
        );
        setIsPaused(true);
        setIsTVFocused(true);
        resetInactivityTimer();
      } else if (eventType === TV_EVENT_RIGHT) {
        setCurrentSlideIndex(
          (prev) => (prev + 1) % ANNOUNCEMENTS.length
        );
        setIsPaused(true);
        setIsTVFocused(true);
        resetInactivityTimer();
      } else if (
        eventType === TV_EVENT_PLAY_PAUSE ||
        eventType === TV_EVENT_SELECT
      ) {
        setIsPaused((prev) => !prev);
        /*
         * Si la rotación está PAUSADA (recién la pausamos con playPause),
         * mostramos el focus. Si está REANUDANDO, lo ocultamos.
         * En ambos casos reiniciamos el timer de inactividad.
         */
        setIsTVFocused(true);
        resetInactivityTimer();
      }
    });

    return () => {
      handler.disable();
      tvEventHandlerRef.current = null;
      if (inactivityTimerRef.current !== null) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [resetInactivityTimer]);

  /* ── MANEJADOR: SCROLL TÁCTIL ──────────────────────────────────────────── */
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const newIndex = Math.round(
        event.nativeEvent.contentOffset.x / screenWidth
      );
      if (newIndex !== currentSlideIndex) {
        setCurrentSlideIndex(newIndex);
      }
    },
    [screenWidth, currentSlideIndex]
  );

  /* ── MANEJADOR: TOGGLE PAUSA (táctil) ──────────────────────────────────── */
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  /* ── ESTADO DERIVADO ────────────────────────────────────────────────────── */
  const currentAnnouncement = ANNOUNCEMENTS[currentSlideIndex];

  /*
   * ╔══════════════════════════════════════════════════════════════════════════╗
   * ║               RENDER                                                     ║
   * ╚══════════════════════════════════════════════════════════════════════════╝
   *
   * En TV, el contenido se envuelve en TVFocusGuideView para habilitar
   * la navegación por D-pad del control remoto.
   *
   * TVFocusGuideView actúa como un "contenedor de enfoque":
   *   - Agrupa elementos focusables
   *   - El foco puede moverse entre ellos con las flechas del control
   *   - Sin TVFocusGuideView, el foco TV no sabe qué elementos existen
   *
   * En móvil/web, se renderiza un simple View (identidad visual).
   * El código es el MISMO — solo cambia el componente contenedor.
   */

  const ContainerComponent = IS_TV ? TVFocusGuideView : View;

  return (
    <Pressable
      style={styles.container}
      onPress={handleTogglePause}
      /*
       * En TV, Pressable necesita isTVSelectable para recibir el foco inicial.
       * Sin esto, el primer toque del control remoto no tiene efecto.
       * Nota: en web/móvil, esta prop es ignorada por react-native estándar.
       */
      /*
       * tvParallaxProperties: solo disponible en react-native-tvos.
       * Agrega un efecto de escala/sombra/paralaje nativo cuando el
       * elemento recibe foco (Apple TV UI paradigm).
       * En móvil/web, estas props son ignoradas.
       */
      {...(IS_TV
        ? {
            isTVSelectable: true,
            hasTVPreferredFocus: true,
            tvParallaxProperties: {
              magnification: 1.02,
              pressMagnification: 0.98,
              pressDuration: 0.2,
              pressDelay: 0,
            },
          }
        : {})}
    >
      <ContainerComponent style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          style={styles.scrollView}
        >
          <View
            style={[
              styles.slidesContainer,
              { width: screenWidth * ANNOUNCEMENTS.length },
            ]}
          >
            {ANNOUNCEMENTS.map((announcement, index) => {
              const isFocused = IS_TV && isTVFocused && index === currentSlideIndex;
              return (
                <View key={announcement.id} style={{ width: screenWidth }}>
                  <BillboardSlide
                    announcement={announcement}
                    isTVFocused={isFocused}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/*
         * OVERLAY DE PAUSA
         * En TV, el overlay incluye iconos del control remoto.
         * En móvil, solo texto.
         */}
        {isPaused && (
          <View style={styles.pauseOverlay} pointerEvents="none">
            <Text
              style={[
                styles.pauseText,
                IS_TV && { fontSize: tvScale(48) },
              ]}
            >
              {IS_TV ? (
                <>
                  {/* Play/Pause button hint for TV remote */}
                  <Text>⏸ PAUSADO</Text>
                </>
              ) : (
                "⏸ PAUSADO"
              )}
            </Text>
            <Text
              style={[
                styles.pauseSubtext,
                IS_TV && { fontSize: tvScale(18) },
              ]}
            >
              {IS_TV
                ? "Play/Pause para reanudar"
                : "Toca para reanudar"}
            </Text>
          </View>
        )}

        <View style={styles.indicatorContainer} pointerEvents="none">
          <SlideIndicator
            totalSlides={ANNOUNCEMENTS.length}
            activeIndex={currentSlideIndex}
          />
        </View>
      </ContainerComponent>
    </Pressable>
  );
}

/*
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║               ESTILOS                                                       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * NOTA: BillboardSlide y SlideIndicator TIENEN sus propios estilos de enfoque TV.
 * Aquí solo están los estilos estructurales del contenedor.
 *
 * Los estilos TV deberían estar en los componentes respectivos porque son
 * responsabilidad de cada componente saber cómo se ve cuando está enfocado.
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  scrollView: {
    flex: 1,
  },

  slidesContainer: {
    flexDirection: "row",
    flex: 1,
  },

  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },

  pauseText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
  },

  pauseSubtext: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 8,
  },

  indicatorContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
