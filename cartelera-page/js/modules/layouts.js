// ================================================================
// CARTELERA DIGITAL - modules/layouts.js
// Definiciones de layouts sincronizadas con app React Native
// Cada layout define zonas con posiciones %, tipos aceptados y
// capacidades multi-item (cada zona puede tener N contenidos en
// secuencia/bucle)
// ================================================================

export const LAYOUTS = [
    {
        id: 'video-left-wide',
        name: 'Video Ancho + Historia',
        icon: '\u{1F3AC}',
        description: 'Video principal a la izquierda (75%) + historia vertical derecha (25%)',
        backgroundColor: '#1a1a2e',
        // Guia de tamanos
        sizeGuide: {
            'video': 'Videos 16:9 (1920x1080). Se usa el 75% horizontal. Recomendado: foco visual centrado.',
            'story': 'Imagenes verticales 9:16 (1080x1920). Se muestran en columna derecha. Ideal: fotos, promos verticales.'
        },
        zones: [
            {
                id: 'video',
                name: 'Video Principal',
                type: 'video',
                x: 0,
                y: 0,
                width: 75,
                height: 100,
                description: 'Zona de video. Acepta videos en secuencia. Cada video se reproduce en loop por su duracion configurada, luego avanza al siguiente.',
                acceptsTypes: ['video'],
                maxItems: 10,
                resolution: '1440 x 1080 px',
                recommendedSize: '1920x1080 (16:9)',
                tips: 'Foco central. Los bordes laterales pueden recortarse en TVs con overscan.'
            },
            {
                id: 'story',
                name: 'Historia Vertical',
                type: 'image-story',
                x: 75,
                y: 0,
                width: 25,
                height: 100,
                description: 'Zona de historia/imagen. Acepta imagenes en secuencia. Cada imagen se muestra por su duracion, luego avanza.',
                acceptsTypes: ['image', 'image-story'],
                maxItems: 20,
                resolution: '480 x 1080 px',
                recommendedSize: '1080x1920 (9:16 vertical)',
                tips: 'Usa imagenes en formato retrato/vertical. Ideal para promociones, menus, fotos de productos.'
            }
        ]
    },
    {
        id: 'story-full',
        name: 'Historia Pantalla Completa',
        icon: '\u{1F4F1}',
        description: 'Historia o imagen a pantalla completa (100%)',
        backgroundColor: '#0f0f1a',
        sizeGuide: {
            'story': 'Imagenes horizontales 16:9 (1920x1080). Ocupan toda la pantalla. Ideal para banners principales.'
        },
        zones: [
            {
                id: 'story',
                name: 'Historia Principal',
                type: 'image-story',
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                description: 'Zona unica a pantalla completa. Acepta imagenes en secuencia. Cada imagen se muestra por su duracion.',
                acceptsTypes: ['image', 'image-story'],
                maxItems: 20,
                resolution: '1920 x 1080 px',
                recommendedSize: '1920x1080 (16:9 horizontal)',
                tips: 'Resolucion minima 1280x720. Sin texto en bordes (posible overscan en TVs). Archivos PNG o JPG de alta calidad.'
            }
        ]
    }
];

// Obtener un layout por ID
export function getLayoutById(id) {
    return LAYOUTS.find(l => l.id === id);
}

// Obtener guia de tamanos formateada
export function getSizeGuide(layoutId) {
    const layout = getLayoutById(layoutId);
    if (!layout || !layout.sizeGuide) return '';
    return Object.entries(layout.sizeGuide)
        .map(([zoneId, guide]) => `<strong>${zoneId}:</strong> ${guide}`)
        .join('<br>');
}

// Estructura de un slide en la playlist:
// {
//   layout_id: 'video-left-wide',
//   zones: {
//     video: [
//       { media_id: 'uuid1', duration: 15, media_url: '...', media_name: '...', media_type: 'video' },
//       { media_id: 'uuid2', duration: 20, media_url: '...', media_name: '...', media_type: 'video' }
//     ],
//     story: [
//       { media_id: 'uuid3', duration: 8, media_url: '...', media_name: '...', media_type: 'image' }
//     ]
//   },
//   duration: 43  // suma de todas las duraciones de zonas (la mayor)
// }
