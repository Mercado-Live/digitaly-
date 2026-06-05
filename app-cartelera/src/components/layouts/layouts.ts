import type { LayoutDefinition } from "../../types";

export const LAYOUTS = [
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
] as const satisfies readonly LayoutDefinition[];

// ── LAYOUTS RESERVADOS PARA USO FUTURO ──────────────────────────────
// "grid-video-story"       — Grid CSS: div6 video 3/5 + div8 historia 2/5
// "video-left-story-right" — Video izq / Historia der (60/40)
// "video-right-story-left" — Video der / Historia izq (60/40)
// "video-left-narrow"      — Video 35% / Historia 65%
// "video-top-story-bottom" — Video arriba / Historia abajo
// "video-bottom-story-top" — Historia arriba / Video abajo
// "video-full"             — Video pantalla completa
// "video-left-dual-story"  — Video izq + 2 historias apiladas
// "video-left-image-grid-right" — Video izq + grid imágenes der
// "video-center-story-split"    — Video centro + historias laterales

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
