import type { LayoutDefinition } from "../../types";

export const LAYOUTS = [
  {
    id: "video-left-story-right",
    name: "Video Izquierda / Historia Derecha",
    description:
      "Layout clásico 60/40. Video en rectángulo izquierdo, formato historia vertical a la derecha.",
    icon: "🎬",
    direction: "row",
    areas: [
      {
        id: "video",
        type: "video",
        flex: 6,
        style: { borderRadius: 12, padding: 8 },
      },
      {
        id: "story",
        type: "story",
        flex: 4,
        direction: "column",
        style: { borderRadius: 12, padding: 8 },
      },
    ],
  },
  {
    id: "video-right-story-left",
    name: "Video Derecha / Historia Izquierda",
    description:
      "Espejo del clásico. Video a la derecha, historia vertical a la izquierda.",
    icon: "🔄",
    direction: "row",
    areas: [
      {
        id: "story",
        type: "story",
        flex: 4,
        direction: "column",
        style: { borderRadius: 12, padding: 8 },
      },
      {
        id: "video",
        type: "video",
        flex: 6,
        style: { borderRadius: 12, padding: 8 },
      },
    ],
  },
  {
    id: "video-left-wide",
    name: "Video Ancho / Historia Estrecha",
    description:
      "Video ocupa 75% del ancho. Historia como barra lateral delgada.",
    icon: "📺",
    direction: "row",
    areas: [
      {
        id: "video",
        type: "video",
        flex: 75,
        style: { borderRadius: 8, padding: 4 },
      },
      {
        id: "story",
        type: "story",
        flex: 25,
        direction: "column",
        style: { borderRadius: 8, padding: 4 },
      },
    ],
  },
  {
    id: "video-left-narrow",
    name: "Video Estrecho / Historia Ancha",
    description:
      "Video ocupa 35% del ancho. Historia es el contenido principal.",
    icon: "📱",
    direction: "row",
    areas: [
      {
        id: "video",
        type: "video",
        flex: 35,
        style: { borderRadius: 12, padding: 8 },
      },
      {
        id: "story",
        type: "story",
        flex: 65,
        direction: "column",
        style: { borderRadius: 12, padding: 8 },
      },
    ],
  },
  {
    id: "video-top-story-bottom",
    name: "Video Arriba / Historia Abajo",
    description: "División horizontal. Video arriba, historia en franja inferior.",
    icon: "📐",
    direction: "column",
    areas: [
      {
        id: "video",
        type: "video",
        flex: 55,
        style: { borderRadius: 12, padding: 8 },
      },
      {
        id: "story",
        type: "story",
        flex: 45,
        direction: "row",
        style: { borderRadius: 12, padding: 8 },
      },
    ],
  },
  {
    id: "video-bottom-story-top",
    name: "Video Abajo / Historia Arriba",
    description: "Inverso del anterior. Historia arriba, video abajo.",
    icon: "📐↕",
    direction: "column",
    areas: [
      {
        id: "story",
        type: "story",
        flex: 45,
        direction: "row",
        style: { borderRadius: 12, padding: 8 },
      },
      {
        id: "video",
        type: "video",
        flex: 55,
        style: { borderRadius: 12, padding: 8 },
      },
    ],
  },
  {
    id: "video-full",
    name: "Video Pantalla Completa",
    description: "Video ocupa toda la pantalla. Sin historia visible.",
    icon: "🖥️",
    direction: "row",
    areas: [
      {
        id: "video",
        type: "video",
        flex: 1,
        style: { borderRadius: 0, padding: 0 },
      },
    ],
  },
  {
    id: "story-full",
    name: "Historia Pantalla Completa",
    description: "Historia/imágenes ocupan toda la pantalla.",
    icon: "🖼️",
    direction: "row",
    areas: [
      {
        id: "story",
        type: "story",
        flex: 1,
        direction: "column",
        style: { borderRadius: 0, padding: 0 },
      },
    ],
  },
  {
    id: "video-left-dual-story",
    name: "Video Izquierda / Dos Historias",
    description:
      "Video a la izquierda (50%). Dos paneles de historia apilados verticalmente a la derecha.",
    icon: "📽️",
    direction: "row",
    areas: [
      {
        id: "video",
        type: "video",
        flex: 5,
        style: { borderRadius: 12, padding: 8 },
      },
      {
        id: "story-stack",
        type: "stack",
        flex: 5,
        direction: "column",
        style: { padding: 4 },
        children: [
          {
            id: "story-top",
            type: "story",
            flex: 1,
            direction: "column",
            style: { borderRadius: 8, padding: 4 },
          },
          {
            id: "story-bottom",
            type: "story",
            flex: 1,
            direction: "column",
            style: { borderRadius: 8, padding: 4 },
          },
        ],
      },
    ],
  },
  {
    id: "video-left-image-grid-right",
    name: "Video Izquierda / Grid Imágenes Derecha",
    description:
      "Video a la izquierda (55%). Grid de 2x2 imágenes a la derecha (45%).",
    icon: "🧩",
    direction: "row",
    areas: [
      {
        id: "video",
        type: "video",
        flex: 55,
        style: { borderRadius: 12, padding: 8 },
      },
      {
        id: "grid",
        type: "image-grid",
        flex: 45,
        style: { borderRadius: 8, padding: 4 },
      },
    ],
  },
  {
    id: "video-center-story-split",
    name: "Video Centro / Historias Laterales",
    description:
      "Video centrado (40%). Historia izquierda (30%) e historia derecha (30%).",
    icon: "⚖️",
    direction: "row",
    areas: [
      {
        id: "story-left",
        type: "story",
        flex: 3,
        direction: "column",
        style: { borderRadius: 12, padding: 8 },
      },
      {
        id: "video",
        type: "video",
        flex: 4,
        style: { borderRadius: 12, padding: 8 },
      },
      {
        id: "story-right",
        type: "story",
        flex: 3,
        direction: "column",
        style: { borderRadius: 12, padding: 8 },
      },
    ],
  },
] as const satisfies readonly LayoutDefinition[];

export type LayoutId = (typeof LAYOUTS)[number]["id"];

export function getLayoutById(id: string): LayoutDefinition | undefined {
  return LAYOUTS.find((l) => l.id === id);
}

export function getLayoutIndex(id: string): number {
  return LAYOUTS.findIndex((l) => l.id === id);
}

export function getNextLayoutId(currentId: string): string {
  const idx = getLayoutIndex(currentId);
  return LAYOUTS[(idx + 1) % LAYOUTS.length].id;
}

export function getPreviousLayoutId(currentId: string): string {
  const idx = getLayoutIndex(currentId);
  return LAYOUTS[(idx - 1 + LAYOUTS.length) % LAYOUTS.length].id;
}

export function getLayoutName(id: string): string {
  const layout = getLayoutById(id);
  return layout ? layout.name : id;
}

export function getLayoutIcon(id: string): string {
  const layout = getLayoutById(id);
  return layout ? layout.icon : "❓";
}
