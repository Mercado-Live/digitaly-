import { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet, Image, Text } from "react-native";

import type { MediaContent } from "../../types";

interface StoryPanelProps {
  readonly mediaItems: readonly MediaContent[];
  readonly isActive: boolean;
  readonly borderRadius?: number;
  readonly direction: "row" | "column";
}

const STORY_DURATION_MS = 4000;

export default function StoryPanel({
  mediaItems,
  isActive,
  borderRadius = 0,
  direction,
}: StoryPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const mediaArray = mediaItems.filter(
    (m) => m.type === "image" || m.type === "image-story" || m.type === "video"
  );

  const currentMedia =
    mediaArray.length > 0
      ? mediaArray[currentIndex % mediaArray.length]
      : null;

  useEffect(() => {
    if (!isActive || mediaArray.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % mediaArray.length);
    }, STORY_DURATION_MS);

    return () => clearInterval(interval);
  }, [isActive, mediaArray.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [mediaItems]);

  if (!currentMedia) {
    return (
      <View
        style={[
          styles.placeholder,
          borderRadius > 0 && { borderRadius },
        ]}
      >
        <Text style={styles.placeholderText}>Sin contenido</Text>
      </View>
    );
  }

  const progressIndicator = mediaArray.length > 1 && (
    <View
      style={[
        styles.progressContainer,
        direction === "row"
          ? { flexDirection: "row", top: 8, left: 8, right: 8 }
          : { flexDirection: "column", right: 8, top: 8, bottom: 8 },
      ]}
    >
      {mediaArray.map((_, idx) => (
        <View
          key={idx}
          style={[
            direction === "row" ? styles.progressBarH : styles.progressBarV,
            idx === currentIndex
              ? styles.progressActive
              : styles.progressInactive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        borderRadius > 0 && { borderRadius },
      ]}
    >
      <Image
        source={{ uri: currentMedia.url }}
        style={styles.image}
        resizeMode="cover"
      />

      {progressIndicator}

      <View style={styles.titleOverlay}>
        <Text style={styles.titleText} numberOfLines={2}>
          {currentMedia.title ?? ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#0d0d1a",
  },
  image: {
    flex: 1,
    width: "100%",
  },
  placeholder: {
    flex: 1,
    width: "100%",
    backgroundColor: "#1a1a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
  },
  progressContainer: {
    position: "absolute",
    flexDirection: "row",
    gap: 4,
  },
  progressBarH: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  progressBarV: {
    width: 3,
    flex: 1,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  progressInactive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  titleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  titleText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
