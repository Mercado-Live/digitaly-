import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

import type { MediaContent } from "../../types";

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})(?:&|$)/,
  ];
  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }
  return null;
}

interface VideoPlayerProps {
  readonly media: MediaContent;
  readonly mediaItems?: readonly MediaContent[];
  readonly isActive: boolean;
  readonly borderRadius?: number;
  readonly muted?: boolean;
}

let useVideoPlayer: any;
let VideoView: any;
try {
  const expoVideo = require("expo-video");
  useVideoPlayer = expoVideo.useVideoPlayer;
  VideoView = expoVideo.VideoView;
} catch {
  // expo-video no disponible en esta plataforma
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
  const prevUrl = useRef(videos[0]?.url);
  const cycleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentMedia = videos[currentIndex] || { type: "video" as const, url: "" };

  const isYoutube = currentMedia.source === 'youtube' || !!extractYoutubeId(currentMedia.url);
  const youtubeId = isYoutube ? extractYoutubeId(currentMedia.url) : null;
  console.log('[VideoPlayer] source:', currentMedia.source, 'url:', currentMedia.url, 'isYoutube:', isYoutube, 'youtubeId:', youtubeId);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    if (youtubeError === '150' || youtubeError === '152' || youtubeError === '101') {
      setUseFallback(true);
    }
  }, [youtubeError]);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    const msg = event.nativeEvent.data;
    if (msg.startsWith('yt_error:')) {
      setYoutubeError(msg.split(':')[1]);
    }
  }, []);

  const youtubeFullscreenHtml = useMemo(() => {
    if (!youtubeId) return null;
    return {
      html: `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
*{margin:0;padding:0}
body{background:#000;overflow:hidden;width:100vw;height:100vh}
#player{width:100vw;height:100vh}
</style></head>
<body>
<div id="player"></div>
<script>
var tag=document.createElement('script');
tag.src="https://www.youtube.com/iframe_api";
var firstScript=document.getElementsByTagName('script')[0];
firstScript.parentNode.insertBefore(tag,firstScript);
var player;
function onYouTubeIframeAPIReady(){
  player=new YT.Player('player',{
    height:'100%',width:'100%',
    videoId:'${youtubeId}',
    playerVars:{
      autoplay:1,mute:1,controls:0,loop:1,
      playlist:'${youtubeId}',
      modestbranding:1,playsinline:1,rel:0
    },
    events:{
      onReady:function(e){e.target.playVideo();},
      onError:function(e){
        window.ReactNativeWebView.postMessage('yt_error:'+e.data);
      }
    }
  });
}
</script>
</body></html>`,
      baseUrl: 'https://www.youtube.com',
    };
  }, [youtubeId]);

  const youtubeFallbackUrl = useMemo(() => {
    if (!youtubeId) return null;
    return `https://www.youtube.com/watch?v=${youtubeId}&autoplay=1&mute=1`;
  }, [youtubeId]);

  const player = useVideoPlayer ? useVideoPlayer(
    isYoutube ? null : (currentMedia.url || null),
    (player: any) => {
      player.loop = true;
      player.muted = true;
      player.volume = 0;
    }
  ) : null;

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

  // Update player when video changes (only for non-YouTube)
  useEffect(() => {
    if (isYoutube || !player) return;
    if (currentMedia.url && currentMedia.url !== prevUrl.current) {
      prevUrl.current = currentMedia.url;
      setShowPoster(!!currentMedia.posterUrl);
      player.replaceAsync(currentMedia.url);
    }
  }, [currentMedia.url, currentMedia.posterUrl, isYoutube]);

  useEffect(() => {
    if (isYoutube || !player) return;
    if (isActive) {
      player.play();
    } else {
      player.pause();
      if (cycleTimer.current) clearTimeout(cycleTimer.current);
    }
  }, [isActive, isYoutube]);

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

  if (!useVideoPlayer) {
    return (
      <View
        style={[
          styles.placeholder,
          borderRadius > 0 && { borderRadius },
        ]}
      >
        <Text style={styles.placeholderText}>Video no disponible en esta plataforma</Text>
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
      {isYoutube && !useFallback && youtubeFullscreenHtml ? (
        <WebView
          source={youtubeFullscreenHtml}
          style={styles.video}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          androidLayerType="hardware"
          onMessage={handleWebViewMessage}
          onError={() => setYoutubeError('load')}
        />
      ) : isYoutube && useFallback && youtubeFallbackUrl ? (
        <WebView
          source={{ uri: youtubeFallbackUrl }}
          style={styles.video}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          androidLayerType="hardware"
          originWhitelist={['*']}
        />
      ) : (
        <>
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
        </>
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
