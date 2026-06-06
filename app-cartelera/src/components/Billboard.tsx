import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  TVFocusGuideView,
  TVEventHandler,
  ActivityIndicator,
} from "react-native";

import BillboardSlide from "./BillboardSlide";
import {
  IS_TV,
  tvScale,
  INACTIVITY_TIMEOUT_MS,
  TV_EVENT_PLAY_PAUSE,
  TV_EVENT_SELECT,
  TV_EVENT_MENU,
  TV_EVENT_LEFT,
  TV_EVENT_RIGHT,
  TV_EVENT_UP,
  TV_EVENT_DOWN,
} from "../utils/tv";
import { LAYOUTS, getLayoutName, getLayoutIcon } from "./layouts/layouts";
import type { Announcement } from "../types";
import { ConnectionBanner } from "./ConnectionBanner";

const ACTIVE_LAYOUT_IDS = LAYOUTS.map((l) => l.id);

interface BillboardProps {
  readonly announcement: Announcement | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly isFromCache: boolean;
  readonly onRefresh: () => void;
  readonly slideCount?: number;
  readonly slideIndex?: number;
  readonly onNextSlide?: () => void;
  readonly onPrevSlide?: () => void;
  readonly onUnpair?: () => void;
}

export default function Billboard({
  announcement: remoteAnnouncement,
  isLoading,
  error,
  isFromCache,
  onRefresh,
  slideCount,
  slideIndex,
  onNextSlide,
  onPrevSlide,
  onUnpair,
}: BillboardProps) {
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTVFocused, setIsTVFocused] = useState(false);
  const [showLayoutOverlay, setShowLayoutOverlay] = useState(false);

  const tvEventHandlerRef = useRef<TVEventHandler | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInteractionRef = useRef<number>(0);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLayoutId = ACTIVE_LAYOUT_IDS[layoutIndex];
  const currentLayoutName = getLayoutName(currentLayoutId);
  const currentLayoutIcon = getLayoutIcon(currentLayoutId);

  const announcement = remoteAnnouncement
    ? { ...remoteAnnouncement, layoutId: currentLayoutId }
    : null;

  // Sync layoutIndex with the incoming announcement's layoutId
  // when a new slide/slideIndex arrives (auto-rotation or manual nav)
  useEffect(() => {
    if (remoteAnnouncement?.layoutId) {
      const idx = ACTIVE_LAYOUT_IDS.indexOf(remoteAnnouncement.layoutId);
      if (idx !== -1) {
        setLayoutIndex(idx);
      }
    }
  }, [remoteAnnouncement?.layoutId]);

  const toggleLayout = useCallback(() => {
    setLayoutIndex((prev) => (prev + 1) % ACTIVE_LAYOUT_IDS.length);
    setIsPaused(true);
    setIsTVFocused(true);
    setShowLayoutOverlay(true);

    if (overlayTimerRef.current !== null) {
      clearTimeout(overlayTimerRef.current);
    }
    overlayTimerRef.current = setTimeout(() => {
      setShowLayoutOverlay(false);
    }, 2000);
  }, []);

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
        setShowLayoutOverlay(false);
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!IS_TV || typeof TVEventHandler === 'undefined') return;

    let handler: TVEventHandler;
    try {
      handler = new TVEventHandler();
    } catch {
      return;
    }
    tvEventHandlerRef.current = handler;

    handler.enable(null, (_component, event) => {
      const { eventType } = event;

      if (eventType === TV_EVENT_SELECT) {
        toggleLayout();
        resetInactivityTimer();
      } else if (eventType === TV_EVENT_PLAY_PAUSE) {
        setIsPaused((prev) => !prev);
        setIsTVFocused(true);
        resetInactivityTimer();
      } else if (eventType === TV_EVENT_LEFT || eventType === TV_EVENT_UP) {
        onPrevSlide?.();
        resetInactivityTimer();
      } else if (eventType === TV_EVENT_RIGHT || eventType === TV_EVENT_DOWN) {
        onNextSlide?.();
        resetInactivityTimer();
      } else if (eventType === TV_EVENT_MENU) {
        // Android TV BACK: consumir evento para evitar salir de la app
        // En modo billboard, no queremos que el usuario cierre la app
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
  }, [toggleLayout, resetInactivityTimer]);

  const ContainerComponent = IS_TV && typeof TVFocusGuideView !== 'undefined' ? TVFocusGuideView : View;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.statusText}>Cargando contenido...</Text>
      </View>
    );
  }

  if (error && !announcement) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </Pressable>
      </View>
    );
  }

  if (!announcement) {
    return (
      <View style={styles.center}>
        <ConnectionBanner />
        <Text style={styles.emptyIcon}>📺</Text>
        <Text style={styles.emptyTitle}>Sin contenido asignado</Text>
        <Text style={styles.emptySubtitle}>
          Asigna una imagen, video o playlist desde el Panel de Control
        </Text>
        <Pressable style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Verificar ahora</Text>
        </Pressable>
        {onUnpair && (
          <Pressable style={styles.unpairButton} onPress={onUnpair}>
            <Text style={styles.unpairButtonText}>Desvincular dispositivo</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <Pressable
      style={styles.container}
      onPress={toggleLayout}
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
        <ConnectionBanner />

        {isFromCache && (
          <View style={styles.cacheBanner}>
            <Text style={styles.cacheBannerText}>Modo offline — Contenido guardado</Text>
          </View>
        )}

        {slideCount && slideCount > 1 && (
          <View style={styles.slideIndicator}>
            {Array.from({ length: slideCount }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.slideDot,
                  i === slideIndex && styles.slideDotActive,
                ]}
              />
            ))}
          </View>
        )}

        <BillboardSlide
          announcement={announcement}
          isTVFocused={isTVFocused}
          isActive={true}
        />

        {(showLayoutOverlay || isPaused) && (
          <View style={styles.pauseOverlay} pointerEvents="box-none">
            <View style={styles.layoutInfo}>
              <Text style={[styles.layoutLabel, IS_TV && { fontSize: tvScale(16) }]}>
                Layout actual
              </Text>
              <Text style={[styles.layoutName, IS_TV && { fontSize: tvScale(24) }]}>
                {currentLayoutIcon} {currentLayoutName}
              </Text>
            </View>

            <Text style={[styles.layoutHint, IS_TV && { fontSize: tvScale(14) }]}>
              {IS_TV
                ? "SELECT = cambiar layout  |  Play/Pause"
                : "Toca para cambiar layout"}
            </Text>
          </View>
        )}
      </ContainerComponent>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  center: {
    flex: 1,
    backgroundColor: "#0f0f23",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  statusText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    marginTop: 16,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 300,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: IS_TV ? tvScale(18) : 16,
    fontWeight: "600",
  },
  cacheBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(245,158,11,0.9)",
    paddingVertical: 4,
    paddingHorizontal: 16,
    zIndex: 99,
    alignItems: "center",
  },
  cacheBannerText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
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
  layoutInfo: {
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  layoutLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  layoutName: {
    fontSize: 22,
    fontWeight: "600",
    color: "#ffffff",
  },
  layoutHint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
  },
  slideIndicator: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  slideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  slideDotActive: {
    backgroundColor: '#3b82f6',
    width: 20,
  },
  unpairButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.5)',
  },
  unpairButtonText: {
    color: 'rgba(239,68,68,0.8)',
    fontSize: IS_TV ? tvScale(14) : 13,
    fontWeight: '500',
  },
});
