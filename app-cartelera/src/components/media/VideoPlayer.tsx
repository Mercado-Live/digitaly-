import { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image } from "expo-image";

import type { MediaContent } from "../../types";

interface VideoPlayerProps {
  readonly media: MediaContent;
  readonly mediaItems?: readonly MediaContent[];
  readonly isActive: boolean;
  readonly borderRadius?: number;
  readonly muted?: boolean;
}

export default function VideoPlayer({
  media,
  mediaItems,
  isActive,
  borderRadius = 0,
}: VideoPlayerProps) {
  const videos = mediaItems && mediaItems.length > 1 ? mediaItems : [media];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPoster, setShowPoster] = useState(!!videos[0]?.posterUrl);
  const [isMuted, setIsMuted] = useState(true); // muteado por defecto
  const prevUrl = useRef(videos[0]?.url);
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMedia = videos[currentIndex] || { type: "video" as const, url: "" };

  const player = useVideoPlayer(currentMedia.url || null, (player) => {
    player.loop = true;
    player.muted = true; // muteado por defecto
    player.volume = 0;
  });

  // Cycle through videos
  useEffect(() => {
    if (videos.length <= 1) return;
    if (!isActive) return;

    const duration = (currentMedia.durationMs || 15000);
    cycleTimer.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    }, duration);

    return () => {
      if (cycleTimer.current) clearTimeout(cycleTimer.current);
    };
  }, [currentIndex, isActive, videos.length]);

  // Update player when video changes
  useEffect(() => {
    if (currentMedia.url && currentMedia.url !== prevUrl.current) {
      prevUrl.current = currentMedia.url;
      setShowPoster(!!currentMedia.posterUrl);
      player.replaceAsync(currentMedia.url);
    }
  }, [currentMedia.url, currentMedia.posterUrl]);

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
      if (cycleTimer.current) clearTimeout(cycleTimer.current);
    }
  }, [isActive]);

  if (!media.url) {
    return (
      <View
        style={[
          styles.placeholder,
          borderRadius > 0 && { borderRadius },
        ]}
      >
        <Text style={styles.placeholderText}>Sin video</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        borderRadius > 0 && { borderRadius },
      ]}
    >
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        onFirstFrameRender={() => setShowPoster(false)}
      />
      {showPoster && media.posterUrl && (
        <Image
          source={{ uri: media.posterUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  video: {
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
    fontSize: 16,
  },
});
