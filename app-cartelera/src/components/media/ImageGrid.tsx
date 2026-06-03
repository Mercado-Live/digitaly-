import { useState, useEffect } from "react";
import { View, StyleSheet, Image, Text } from "react-native";
import type { MediaContent } from "../../types";

interface ImageGridProps {
  readonly mediaItems: readonly MediaContent[];
  readonly isActive: boolean;
  readonly borderRadius?: number;
}

const GRID_INTERVAL_MS = 5000;

export default function ImageGrid({
  mediaItems,
  isActive,
  borderRadius = 0,
}: ImageGridProps) {
  const images = mediaItems.filter(
    (m) => m.type === "image" || m.type === "image-story"
  );

  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(images.length / 4));

  const gridItems: (MediaContent | null)[] = [];
  const startIdx = page * 4;
  for (let i = 0; i < 4; i++) {
    const idx = startIdx + i;
    gridItems.push(idx < images.length ? images[idx] : null);
  }

  useEffect(() => {
    if (!isActive || totalPages <= 1) return;
    const interval = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, GRID_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isActive, totalPages]);

  useEffect(() => {
    setPage(0);
  }, [mediaItems]);

  if (images.length === 0) {
    return (
      <View
        style={[
          styles.placeholder,
          borderRadius > 0 && { borderRadius },
        ]}
      >
        <Text style={styles.placeholderText}>Sin imágenes</Text>
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
      <View style={styles.grid}>
        {gridItems.map((item, idx) => (
          <View key={idx} style={styles.cell}>
            {item ? (
              <Image
                source={{ uri: item.url }}
                style={styles.cellImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.emptyCell} />
            )}
          </View>
        ))}
      </View>

      {totalPages > 1 && (
        <View style={styles.pageIndicator}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === page ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
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
  grid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "50%",
    height: "50%",
    padding: 2,
  },
  cellImage: {
    flex: 1,
    borderRadius: 4,
  },
  emptyCell: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 4,
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
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
});
