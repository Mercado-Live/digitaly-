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
import {
  getNextLayoutId,
  getPreviousLayoutId,
  getLayoutName,
  getLayoutIcon,
} from "./layouts/layouts";

interface BillboardProps {}

export default function Billboard(_props: BillboardProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTVFocused, setIsTVFocused] = useState(false);
  const [forcedLayoutId, setForcedLayoutId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const tvEventHandlerRef = useRef<TVEventHandler | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionRef = useRef<number>(0);

  const { width: screenWidth } = Dimensions.get("window");

  const activeAnnouncement = ANNOUNCEMENTS[currentSlideIndex];

  const currentLayoutId =
    forcedLayoutId ?? activeAnnouncement.layoutId;
  const currentLayoutName = getLayoutName(currentLayoutId);
  const currentLayoutIcon = getLayoutIcon(currentLayoutId);

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

  useEffect(() => {
    if (!forcedLayoutId) return;
    const timer = setTimeout(() => {
      setForcedLayoutId(null);
    }, AUTO_ROTATION_INTERVAL_MS * 3);
    return () => clearTimeout(timer);
  }, [forcedLayoutId]);

  /* ── INACTIVIDAD TV ────────────────────────────────────────────────────── */
  const resetInactivityTimer = useCallback(() => {
    lastInteractionRef.current = Date.now();

    if (inactivityTimerRef.current !== null) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      const elapsed = Date.now() - lastInteractionRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        setIsPaused(false);
        setIsTVFocused(false);
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  /* ── EFECTO 3: TV EVENT HANDLER ────────────────────────────────────────── */
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
      } else if (eventType === TV_EVENT_PLAY_PAUSE) {
        setIsPaused((prev) => !prev);
        setIsTVFocused(true);
        resetInactivityTimer();
      } else if (eventType === TV_EVENT_SELECT) {
        setIsPaused((prev) => !prev);
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

  /* ── MANEJADOR: TOGGLE PAUSA ───────────────────────────────────────────── */
  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
    if (!isPaused) {
      setForcedLayoutId(null);
    }
  }, [isPaused]);

  const cycleLayoutForward = useCallback(() => {
    setForcedLayoutId((prev) => {
      const baseId = prev ?? activeAnnouncement.layoutId;
      return getNextLayoutId(baseId);
    });
  }, [activeAnnouncement]);

  const cycleLayoutBackward = useCallback(() => {
    setForcedLayoutId((prev) => {
      const baseId = prev ?? activeAnnouncement.layoutId;
      return getPreviousLayoutId(baseId);
    });
  }, [activeAnnouncement]);

  const currentAnnouncement = ANNOUNCEMENTS[currentSlideIndex];

  const ContainerComponent = IS_TV ? TVFocusGuideView : View;

  return (
    <Pressable
      style={styles.container}
      onPress={handleTogglePause}
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
              const isActiveSlide = index === currentSlideIndex;
              return (
                <View key={announcement.id} style={{ width: screenWidth }}>
                  <BillboardSlide
                    announcement={announcement}
                    isTVFocused={isFocused}
                    isActive={isActiveSlide}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>

        {isPaused && (
          <View style={styles.pauseOverlay} pointerEvents="box-none">
            <Text
              style={[
                styles.pauseText,
                IS_TV && { fontSize: tvScale(36) },
              ]}
            >
              ⏸ PAUSADO
            </Text>

            <View style={styles.layoutInfo}>
              <Text
                style={[
                  styles.layoutLabel,
                  IS_TV && { fontSize: tvScale(16) },
                ]}
              >
                Layout actual:
              </Text>
              <Text
                style={[
                  styles.layoutName,
                  IS_TV && { fontSize: tvScale(20) },
                ]}
              >
                {currentLayoutIcon} {currentLayoutName}
              </Text>
            </View>

            {forcedLayoutId && (
              <Text
                style={[
                  styles.forcedHint,
                  IS_TV && { fontSize: tvScale(14) },
                ]}
              >
                Layout forzado — vuelve al original en 15s
              </Text>
            )}

            <Text
              style={[
                styles.pauseSubtext,
                IS_TV && { fontSize: tvScale(16) },
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  pauseText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  layoutInfo: {
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  layoutLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  layoutName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  forcedHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
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
