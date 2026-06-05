import type { Announcement } from "../types";

export const ANNOUNCEMENTS = [
  {
    id: "1",
    title: "Cartelera Digital",
    description:
      "Sistema de visualización con 2 layouts: Video Ancho + Historia Estrecha, " +
      "y Historia Pantalla Completa. Toca para alternar entre modos.",
    date: "2025-06-05",
    backgroundColor: "#0f0f23",
    layoutId: "video-left-wide",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          title: "Video Principal",
        },
      ],
      story: [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/cartelera1/360/640",
          title: "Promoción 1",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/cartelera2/360/640",
          title: "Promoción 2",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/cartelera3/360/640",
          title: "Promoción 3",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/cartelera4/360/640",
          title: "Promoción 4",
        },
      ],
    },
  },
] as const satisfies readonly Announcement[];
