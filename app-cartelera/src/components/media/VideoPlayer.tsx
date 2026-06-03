import { useRef, useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { ResizeMode, Video } from "expo-av";

import type { MediaContent } from "../../types";

interface VideoPlayerProps {
  readonly media: MediaContent;
  readonly isActive: boolean;
  readonly borderRadius?: number;
}

export default function VideoPlayer({
  media,
  isActive,
  borderRadius = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive && isLoaded) {
      videoRef.current.playAsync();
    } else {
      videoRef.current.pauseAsync();
    }
  }, [isActive, isLoaded]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.stopAsync();
    setIsLoaded(false);
  }, [media.url]);

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
      <Video
        ref={videoRef}
        source={{ uri: media.url }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={isActive}
        isLooping
        isMuted={false}
        onLoad={() => setIsLoaded(true)}
        posterSource={
          media.posterUrl ? { uri: media.posterUrl } : undefined
        }
        usePoster={!!media.posterUrl}
      />
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
