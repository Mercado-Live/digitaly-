export interface MediaContent {
  readonly type: "video" | "image" | "image-story";
  readonly url: string;
  readonly durationMs?: number;
  readonly posterUrl?: string;
  readonly title?: string;
}

export interface LayoutAreaConfig {
  readonly id: string;
  readonly type: "video" | "story" | "image-grid" | "text" | "stack";
  readonly flex: number;
  readonly direction?: "row" | "column";
  readonly children?: readonly LayoutAreaConfig[];
  readonly style?: {
    readonly aspectRatio?: number;
    readonly borderRadius?: number;
    readonly backgroundColor?: string;
    readonly padding?: number;
  };
}

export interface LayoutDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly direction: "row" | "column";
  readonly areas: readonly LayoutAreaConfig[];
}

export interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly date: string;
  readonly backgroundColor?: string;
  readonly layoutId: string;
  readonly content: {
    readonly [areaId: string]: readonly MediaContent[];
  };
}
