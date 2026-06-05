import { useMemo } from "react";
import { View, StyleSheet } from "react-native";

import type { LayoutDefinition, LayoutAreaConfig, MediaContent } from "../../types";
import VideoPlayer from "../media/VideoPlayer";
import StoryPanel from "../media/StoryPanel";
import ImageGrid from "../media/ImageGrid";

interface LayoutEngineProps {
  readonly layout: LayoutDefinition;
  readonly content: Record<string, readonly MediaContent[]>;
  readonly isActive: boolean;
}

export default function LayoutEngine({
  layout,
  content,
  isActive,
}: LayoutEngineProps) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: layout.direction,
        gap: layout.gap,
      }}
    >
      {layout.areas.map((area) => (
        <AreaNode
          key={area.id}
          area={area}
          content={content}
          isActive={isActive}
        />
      ))}
    </View>
  );
}

interface AreaNodeProps {
  readonly area: LayoutAreaConfig;
  readonly content: Record<string, readonly MediaContent[]>;
  readonly isActive: boolean;
}

function AreaNode({ area, content, isActive }: AreaNodeProps) {
  const areaContent = content[area.id] ?? [];

  if (area.type === "stack" && area.children) {
    return (
      <View
        style={[
          styles.area,
          { flex: area.flex, flexDirection: area.direction ?? "column" },
          area.style?.padding != null && { padding: area.style.padding },
          area.style?.backgroundColor != null && {
            backgroundColor: area.style.backgroundColor,
          },
        ]}
      >
        {area.children.map((child) => (
          <AreaNode
            key={child.id}
            area={child}
            content={content}
            isActive={isActive}
          />
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.area,
        { flex: area.flex },
        area.style?.padding != null && { padding: area.style.padding },
        area.style?.backgroundColor != null && {
          backgroundColor: area.style.backgroundColor,
        },
      ]}
    >
      <ContentRenderer
        type={area.type}
        content={areaContent}
        isActive={isActive}
        borderRadius={area.style?.borderRadius}
        direction={area.direction}
      />
    </View>
  );
}

interface ContentRendererProps {
  readonly type: LayoutAreaConfig["type"];
  readonly content: readonly MediaContent[];
  readonly isActive: boolean;
  readonly borderRadius?: number;
  readonly direction?: "row" | "column";
}

function ContentRenderer({
  type,
  content,
  isActive,
  borderRadius,
  direction,
}: ContentRendererProps) {
  switch (type) {
    case "video": {
      const videoContent = content.filter((c) => c.type === "video");
      const firstVideo =
        videoContent.length > 0
          ? videoContent[0]
          : { type: "video" as const, url: "" };
      return (
        <VideoPlayer
          media={firstVideo}
          mediaItems={videoContent.length > 1 ? videoContent : undefined}
          isActive={isActive}
          borderRadius={borderRadius}
        />
      );
    }
    case "story":
      return (
        <StoryPanel
          mediaItems={content}
          isActive={isActive}
          borderRadius={borderRadius}
          direction={direction ?? "column"}
        />
      );
    case "image-grid":
      return (
        <ImageGrid
          mediaItems={content}
          isActive={isActive}
          borderRadius={borderRadius}
        />
      );
    case "stack":
      return null;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  area: {
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
});
