import type { Announcement } from "../types";

export const ANNOUNCEMENTS = [
  {
    id: "1",
    title: "Bienvenidos a la Cartelera Digital",
    description:
      "Sistema de visualización con layouts dinámicos. " +
      "Video + formato historia + variaciones de distribución.",
    date: "2025-01-15",
    backgroundColor: "#0f0f23",
    layoutId: "video-left-story-right",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          title: "Bienvenida",
        },
      ],
      story: [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/bienvenida1/360/640",
          title: "Bienvenidos",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/bienvenida2/360/640",
          title: "Cartelera Digital",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/bienvenida3/360/640",
          title: "Sistema de Layouts",
        },
      ],
    },
  },
  {
    id: "2",
    title: "Arquitectura de Layouts",
    description:
      "Múltiples distribuciones: video izquierda, historia derecha. " +
      "Cada layout optimizado para diferentes tipos de contenido.",
    date: "2025-01-16",
    backgroundColor: "#1a0a2e",
    layoutId: "video-right-story-left",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
          title: "Arquitectura",
        },
      ],
      story: [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/arquitectura1/360/640",
          title: "Layouts Dinámicos",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/arquitectura2/360/640",
          title: "Video + Imagen",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/arquitectura3/360/640",
          title: "10 Variaciones",
        },
      ],
    },
  },
  {
    id: "3",
    title: "Contenido Multimedia",
    description:
      "Videos en bucle, historias de imágenes con avance automático, " +
      "grids de imágenes. Cada área tiene su propio ciclo de vida.",
    date: "2025-01-17",
    backgroundColor: "#0a1a2e",
    layoutId: "video-left-wide",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
          title: "Multimedia",
        },
      ],
      story: [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/multimedia1/360/640",
          title: "Videos",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/multimedia2/360/640",
          title: "Imágenes",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/multimedia3/360/640",
          title: "Storytelling Visual",
        },
      ],
    },
  },
  {
    id: "4",
    title: "Distribución Variable",
    description:
      "Cada slide puede usar un layout diferente. " +
      "La cartelera alterna entre las 10 variaciones de distribución.",
    date: "2025-01-18",
    backgroundColor: "#2e0a1a",
    layoutId: "video-left-narrow",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
          title: "Distribución",
        },
      ],
      story: [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/distribucion1/360/640",
          title: "Flexibilidad",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/distribucion2/360/640",
          title: "Adaptabilidad",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/distribucion3/360/640",
          title: "Variedad",
        },
      ],
    },
  },
  {
    id: "5",
    title: "Layout Panorámico",
    description:
      "Distribución horizontal con video dominante. " +
      "Ideal para contenido audiovisual con apoyo de imágenes.",
    date: "2025-01-19",
    backgroundColor: "#1a2e0a",
    layoutId: "video-top-story-bottom",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
          title: "Panorámico",
        },
      ],
      story: [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/panoramico1/640/360",
          title: "Horizontal",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/panoramico2/640/360",
          title: "Panorámica",
        },
      ],
    },
  },
  {
    id: "6",
    title: "Grid de Imágenes",
    description:
      "Video a la izquierda con grid de 2x2 imágenes a la derecha. " +
      "Perfecto para mostrar catálogos o portafolios.",
    date: "2025-01-20",
    backgroundColor: "#2e1a0a",
    layoutId: "video-left-image-grid-right",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          title: "Grid",
        },
      ],
      grid: [
        {
          type: "image",
          url: "https://picsum.photos/seed/grid1/400/400",
          title: "Imagen 1",
        },
        {
          type: "image",
          url: "https://picsum.photos/seed/grid2/400/400",
          title: "Imagen 2",
        },
        {
          type: "image",
          url: "https://picsum.photos/seed/grid3/400/400",
          title: "Imagen 3",
        },
        {
          type: "image",
          url: "https://picsum.photos/seed/grid4/400/400",
          title: "Imagen 4",
        },
        {
          type: "image",
          url: "https://picsum.photos/seed/grid5/400/400",
          title: "Imagen 5",
        },
        {
          type: "image",
          url: "https://picsum.photos/seed/grid6/400/400",
          title: "Imagen 6",
        },
        {
          type: "image",
          url: "https://picsum.photos/seed/grid7/400/400",
          title: "Imagen 7",
        },
        {
          type: "image",
          url: "https://picsum.photos/seed/grid8/400/400",
          title: "Imagen 8",
        },
      ],
    },
  },
  {
    id: "7",
    title: "Video Pantalla Completa",
    description:
      "Layout inmersivo: video ocupa toda la pantalla. " +
      "Sin distracciones, máximo impacto visual.",
    date: "2025-01-21",
    backgroundColor: "#000000",
    layoutId: "video-full",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
          title: "Fullscreen",
        },
      ],
    },
  },
  {
    id: "8",
    title: "Historias Visuales",
    description:
      "Formato historia a pantalla completa. " +
      "Imágenes en secuencia automática tipo story.",
    date: "2025-01-22",
    backgroundColor: "#1a1a2e",
    layoutId: "story-full",
    content: {
      story: [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/story1/1080/1920",
          title: "Historia 1",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/story2/1080/1920",
          title: "Historia 2",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/story3/1080/1920",
          title: "Historia 3",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/story4/1080/1920",
          title: "Historia 4",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/story5/1080/1920",
          title: "Historia 5",
        },
      ],
    },
  },
  {
    id: "9",
    title: "Dos Historias Simultáneas",
    description:
      "Video con dos paneles de historia apilados. " +
      "Múltiples mensajes en una sola vista.",
    date: "2025-01-23",
    backgroundColor: "#0a2e1a",
    layoutId: "video-left-dual-story",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
          title: "Dual",
        },
      ],
      "story-top": [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/dualtop1/360/640",
          title: "Promo 1",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/dualtop2/360/640",
          title: "Promo 2",
        },
      ],
      "story-bottom": [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/dualbottom1/360/640",
          title: "Oferta 1",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/dualbottom2/360/640",
          title: "Oferta 2",
        },
      ],
    },
  },
  {
    id: "10",
    title: "Video Central Balanceado",
    description:
      "Video centrado con historias laterales simétricas. " +
      "Distribución equilibrada para contenido premium.",
    date: "2025-01-24",
    backgroundColor: "#1a0a1a",
    layoutId: "video-center-story-split",
    content: {
      video: [
        {
          type: "video",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
          title: "Balance",
        },
      ],
      "story-left": [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/balanceleft1/360/640",
          title: "Izquierda",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/balanceleft2/360/640",
          title: "Complemento",
        },
      ],
      "story-right": [
        {
          type: "image-story",
          url: "https://picsum.photos/seed/balanceright1/360/640",
          title: "Derecha",
        },
        {
          type: "image-story",
          url: "https://picsum.photos/seed/balanceright2/360/640",
          title: "Soporte Visual",
        },
      ],
    },
  },
] as const satisfies readonly Announcement[];
