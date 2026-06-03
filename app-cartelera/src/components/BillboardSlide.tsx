import { View, Text, StyleSheet } from "react-native";

import type { Announcement } from "../types";
import { IS_TV, tvScale, TV_FOCUS_RING_WIDTH, TV_FOCUS_RING_COLOR } from "../utils/tv";
import { getLayoutById } from "./layouts/layouts";
import LayoutEngine from "./layouts/LayoutEngine";

interface BillboardSlideProps {
  readonly announcement: Announcement;
  readonly isTVFocused?: boolean;
  readonly isActive?: boolean;
}

export default function BillboardSlide({
  announcement,
  isTVFocused = false,
  isActive = false,
}: BillboardSlideProps) {
  const { title, description, backgroundColor, layoutId, content } = announcement;
  const layout = getLayoutById(layoutId);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        IS_TV && isTVFocused && styles.tvFocusRing,
      ]}
    >
      {layout ? (
        <View style={styles.layoutContainer}>
          <LayoutEngine
            layout={layout}
            content={content}
            isActive={isActive}
          />
        </View>
      ) : (
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              IS_TV && { fontSize: tvScale(32) },
            ]}
          >
            {title}
          </Text>
          {description && (
            <Text
              style={[
                styles.description,
                IS_TV && { fontSize: tvScale(18), lineHeight: tvScale(28) },
              ]}
            >
              {description}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const tvFocusRing = {
  borderWidth: TV_FOCUS_RING_WIDTH,
  borderColor: TV_FOCUS_RING_COLOR,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  layoutContainer: {
    flex: 1,
    width: "100%",
  },
  content: {
    maxWidth: 600,
    width: "100%",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
  },
});
