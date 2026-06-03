# Sistema de Distribuciones (Layouts) de la Cartelera Digital

## ═══════════════════════════════════════════════════════════════════════════════
## MAPA MENTAL DEL SISTEMA DE LAYOUTS
## ═══════════════════════════════════════════════════════════════════════════════

```text
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   ┌──────────────────────────────────────────────────────────────────┐       ║
║   │                   ¿QUÉ ES UN LAYOUT?                            │       ║
║   │                                                                  │       ║
║   │  Un layout es un MAPA DE DISTRIBUCIÓN que responde:             │       ║
║   │                                                                  │       ║
║   │   1. ¿EN QUÉ DIRECCIÓN se organiza el contenido?                 │       ║
║   │      → row (horizontal: izquierda → derecha)                    │       ║
║   │      → column (vertical: arriba → abajo)                        │       ║
║   │                                                                  │       ║
║   │   2. ¿CUÁNTAS ÁREAS tiene y qué PROPORCIÓN ocupa cada una?      │       ║
║   │      → flex = 6 (60%) vs flex = 4 (40%)                         │       ║
║   │      → flex = 75 (75%) vs flex = 25 (25%)                       │       ║
║   │                                                                  │       ║
║   │   3. ¿QUÉ TIPO DE CONTENIDO va en cada área?                    │       ║
║   │      → video: reproductor de video                              │       ║
║   │      → story: imágenes en formato historia (avance automático)  │       ║
║   │      → image-grid: cuadrícula 2×2 de imágenes                   │       ║
║   │      → stack: contenedor anidado para sub-layouts               │       ║
║   │                                                                  │       ║
║   └──────────────────────────────────────────────────────────────────┘       ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 1. ARQUITECTURA CONCEPTUAL
## ═══════════════════════════════════════════════════════════════════════════════

### 1.1 El Problema Fundamental

Una cartelera digital en TV tiene UNA restricción física: la pantalla es un
rectángulo de proporción fija (16:9 en la mayoría de TVs). Dentro de ese
rectángulo, debemos mostrar simultáneamente:

- **VIDEO**: contenido en movimiento que requiere un área con relación de
  aspecto definida (16:9, 4:3, 1:1, etc.)
- **HISTORIA (STORY)**: imágenes verticales en secuencia, formato 9:16,
  que cambian automáticamente cada N segundos
- **GRID DE IMÁGENES**: múltiples imágenes estáticas en cuadrícula que
  también rotan en páginas

Cada tipo de contenido tiene necesidades de ESPACIO y COMPORTAMIENTO
completamente diferentes. El sistema de layouts resuelve CÓMO dividir la
pantalla entre estos tipos de contenido.

### 1.2 El Árbol de Decisiones

```text
¿Qué quieres mostrar?
│
├── Solo video ──────────────────────────► Layout: "video-full"
│
├── Solo imágenes ───────────────────────► Layout: "story-full"
│
├── Video + Historia (izquierda) ────────► Layout: "video-left-story-right"
│
├── Video + Historia (derecha) ──────────► Layout: "video-right-story-left"
│
├── Video dominante + Historia pequeña ──► Layout: "video-left-wide"
│
├── Video pequeño + Historia dominante ──► Layout: "video-left-narrow"
│
├── Video arriba / Historia abajo ───────► Layout: "video-top-story-bottom"
│
├── Video abajo / Historia arriba ───────► Layout: "video-bottom-story-top"
│
├── Video + 2 Historias apiladas ────────► Layout: "video-left-dual-story"
│
├── Video + Grid de imágenes ────────────► Layout: "video-left-image-grid-right"
│
└── Video centro / Historias laterales ──► Layout: "video-center-story-split"
```

### 1.3 El Mapa Conceptual del Sistema

```text
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   DATOS (anuncios)                       CÓDIGO (componentes)                 ║
║   ────────────────                       ────────────────────                 ║
║                                                                               ║
║   ┌──────────────┐                     ┌──────────────────┐                  ║
║   │ Announcement │                     │   Billboard      │                  ║
║   │              │                     │  (orquestador)   │                  ║
║   │  - layoutId  │────►       ┌───────│                  │────► SCROLLVIEW  ║
║   │  - content   │     │      │       │  - currentSlide  │                  ║
║   │  - title     │     │      │       │  - isPaused      │                  ║
║   └──────────────┘     │      │       │  - forcedLayout  │                  ║
║                         │      │       └────────┬─────────┘                  ║
║   ┌──────────────┐     │      │                │                             ║
║   │   LAYOUTS    │     │      │                ▼                             ║
║   │  (registry)  │────►│      │       ┌──────────────────┐                  ║
║   │              │     │      │       │  BillboardSlide  │                  ║
║   │  - id        │     │      │       │                  │                  ║
║   │  - name      │     │      │       │  - announcement  │                  ║
║   │  - direction │     │      │       │  - isActive      │                  ║
║   │  - areas[]   │     │      │       │  - isTVFocused   │                  ║
║   └──────────────┘     │      │       └────────┬─────────┘                  ║
║                         │      │                │                             ║
║   ┌──────────────┐     │      │                ▼                             ║
║   │  CONTENT     │────►│      │       ┌──────────────────┐                  ║
║   │  (por área)  │     │      │       │  LayoutEngine    │                  ║
║   │              │     │      │       │                  │                  ║
║   │  video: [...]│     │      │       │  Toma layout +   │                  ║
║   │  story:[...] │────►│      │       │  content y       │                  ║
║   │  grid: [...] │     │      │       │  renderiza áreas │                  ║
║   └──────────────┘     │      │       └────────┬─────────┘                  ║
║                         │      │                │                             ║
║                         │      │         ┌──────┴──────┐                    ║
║                         │      │         ▼              ▼                    ║
║   ┌──────────────┐     │      │   ┌──────────┐  ┌───────────┐              ║
║   │ MEDIA TYPES  │     │      │   │   Video  │  │   Story   │              ║
║   │              │     │      │   │   Player │  │   Panel   │              ║
║   │  - video     │     │      │   └──────────┘  └───────────┘              ║
║   │  - image     │     │      │         │              │                    ║
║   │  - image-str │     │      │         ▼              ▼                    ║
║   └──────────────┘     │      │   ┌──────────┐  ┌───────────┐              ║
║                         │      │   │  expo-av │  │  Image    │              ║
║                         │      │   │  <Video> │  │  RN       │              ║
║                         │      │   └──────────┘  └───────────┘              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 2. LAS 10 VARIACIONES DE DISTRIBUCIÓN (DETALLE COMPLETO)
## ═══════════════════════════════════════════════════════════════════════════════

### ─── 2.1 video-left-story-right ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────────────┬────────────────────────┐         ║
║  │                          │                        │         ║
║  │       ┌──────┐           │    ┌────────────┐      │         ║
║  │       │      │           │    │            │      │         ║
║  │       │ VIDEO │          │    │   STORY    │      │         ║
║  │       │      │           │    │   (9:16)   │      │         ║
║  │       │ 16:9 │           │    │            │      │         ║
║  │       └──────┘           │    │   img▶img  │      │         ║
║  │                          │    │            │      │         ║
║  │         60%              │    │    40%     │      │         ║
║  └──────────────────────────┴────────────────────────┘         ║
║                                                                ║
║  ◀─────────────────────── 100% ──────────────────────────────▶ ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  ¿Por qué 60/40 y no 50/50?
  
  El video (16:9) es intrínsecamente más ancho que alto. Si le diéramos
  50%, el área de video sería cuadrada y el video se vería con barras
  negras arriba y abajo (letterbox). Con 60%, aprovechamos mejor el
  espacio horizontal del video.
  
  La historia (9:16) es intrínsecamente más alta que ancha. Con 40%,
  tiene suficiente ancho para ser legible sin recortarse.

COMPORTAMIENTO:
───────────────
  - Video: se reproduce en bucle (loop) mientras el slide esté activo
  - Story: avanza automáticamente cada 4 segundos entre imágenes
  - Al cambiar de slide: el video se detiene y el nuevo comienza
  - La story reinicia su progreso al cambiar de slide

ÁREAS:
──────
  [video] flex: 6  │  [story] flex: 4

CONTENIDO ESPERADO:
───────────────────
  content.video  = [ { type: "video", url: "..." } ]
  content.story  = [ { type: "image-story", url: "..." }, ... ]
```

### ─── 2.2 video-right-story-left ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────────────┬────────────────────────┐         ║
║  │                        │                        │         ║
║  │    ┌────────────┐      │       ┌──────┐         │         ║
║  │    │            │      │       │      │         │         ║
║  │    │   STORY    │      │       │ VIDEO │         │         ║
║  │    │   (9:16)   │      │       │      │         │         ║
║  │    │            │      │       │ 16:9 │         │         ║
║  │    │   img▶img  │      │       └──────┘         │         ║
║  │    │            │      │                        │         ║
║  │       40%       │      │         60%            │         ║
║  └──────────────────────────┴────────────────────────┘         ║
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Espejo del layout #1. La historia está a la izquierda porque el
  video o su contenido tienen información importante a la izquierda
  (como texto, logos, o personas mirando hacia la izquierda).
  
  En diseño visual, la REGLA DE TERCIOS dice que los elementos
  importantes deben estar en los tercios de la imagen. Este layout
  respeta esa regla poniendo la historia en el tercio izquierdo.

ÁREAS:
──────
  [story] flex: 4  │  [video] flex: 6
```

### ─── 2.3 video-left-wide ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────────────────────────┬──────────┐           ║
║  │                                      │          │           ║
║  │              ┌──────┐                │  STORY   │           ║
║  │              │      │                │  (9:16)  │           ║
║  │              │ VIDEO│                │          │           ║
║  │              │ 16:9 │                │          │           ║
║  │              └──────┘                │          │           ║
║  │                                      │          │           ║
║  │               75%                    │   25%    │           ║
║  └──────────────────────────────────────┴──────────┘           ║
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Layout DOMINANCIA DE VIDEO. Cuando el video es el contenido principal
  y la historia es secundaria. La historia ocupa solo 25% como barra
  lateral delgada.
  
  ¿Por qué 75/25 en lugar de 80/20 o 70/30? Porque 25% (1/4 de la
  pantalla) es el mínimo que necesita una imagen 9:16 para ser
  reconocible. Con menos de 25%, la historia se ve demasiado pequeña.

ÁREAS:
──────
  [video] flex: 75  │  [story] flex: 25
```

### ─── 2.4 video-left-narrow ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────┬────────────────────────────────┐         ║
║  │                  │                                │         ║
║  │    ┌────┐        │       ┌────────────┐           │         ║
║  │    │    │        │       │            │           │         ║
║  │    │VID │        │       │   STORY    │           │         ║
║  │    │4:3 │        │       │   (9:16)   │           │         ║
║  │    └────┘        │       │            │           │         ║
║  │                  │       │   img▶img  │           │         ║
║  │      35%         │       │    65%     │           │         ║
║  └──────────────────┴────────────────────────────────┘         ║
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Layout DOMINANCIA DE HISTORIA. Inverso del anterior. Cuando las
  imágenes/stories son el contenido principal y el video es apoyo.
  
  El video usa aspectRatio 4:3 (cuadrado casi) en lugar de 16:9
  porque al ser más angosto, un 16:9 se vería muy pequeño. 4:3
  aprovecha mejor el espacio vertical disponible.
  
  Ideal para: campañas de marketing visual, galerías de productos,
  portfolios de fotografía.

ÁREAS:
──────
  [video] flex: 35  │  [story] flex: 65
```

### ─── 2.5 video-top-story-bottom ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────────────────────────────────────┐          ║
║  │                                                  │          ║
║  │              ┌──────────────────────┐            │          ║
║  │              │                      │            │          ║
║  │              │        VIDEO         │            │    55%   ║
║  │              │        16:9          │            │          ║
║  │              └──────────────────────┘            │          ║
║  ├──────────────────────────────────────────────────┤          ║
║  │    ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │          ║
║  │    │ img1 │  │ img2 │  │ img3 │  │ img4 │      │    45%   ║
║  │    │      │  │      │  │      │  │      │      │          ║
║  │    └──────┘  └──────┘  └──────┘  └──────┘      │          ║
║  │                STORY (horizontal)                │          ║
║  └──────────────────────────────────────────────────┘          ║
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Layout PANORÁMICO HORIZONTAL. El video arriba, historia en franja
  inferior. La historia cambia a dirección "row" (horizontal) porque
  el área disponible es ancha y poco profunda.
  
  ¿Por qué la historia se vuelve horizontal aquí? Porque en un espacio
  angosto (45% de la altura), las imágenes 9:16 no caben verticalmente.
  Al ponerlas en fila horizontal, cada imagen se ve como miniatura
  y el usuario ve el avance como una línea de tiempo.
  
  Ideal para: presentaciones, conferencias, contenido mixto.

ÁREAS:
──────
  [video] flex: 55     dirección: column
  [story] flex: 45     dirección: row
```

### ─── 2.6 video-bottom-story-top ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────────────────────────────────────┐          ║
║  │    ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │          ║
║  │    │ img1 │  │ img2 │  │ img3 │  │ img4 │      │    45%   ║
║  │    │      │  │      │  │      │  │      │      │          ║
║  │    └──────┘  └──────┘  └──────┘  └──────┘      │          ║
║  │                STORY (horizontal)                │          ║
║  ├──────────────────────────────────────────────────┤          ║
║  │              ┌──────────────────────┐            │          ║
║  │              │                      │            │          ║
║  │              │        VIDEO         │            │    55%   ║
║  │              │        16:9          │            │          ║
║  │              └──────────────────────┘            │          ║
║  └──────────────────────────────────────────────────┘          ║
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Inverso del layout #5. La historia arriba, video abajo.
  
  ¿Por qué existe este layout? Porque en diseño visual, el OJO HUMANO
  escanea la pantalla de arriba a abajo. Si la historia contiene el
  mensaje principal (texto, llamado a la acción), debe estar arriba.
  Si el video es contexto o ambiente, va abajo.
  
  Esto sigue el patrón de diseño Z-PATTERN: el ojo empieza arriba a la
  izquierda, cruza horizontalmente, baja en diagonal, y termina abajo
  a la derecha. La historia capta la atención primero.

ÁREAS:
──────
  [story] flex: 45     dirección: row
  [video] flex: 55     dirección: column
```

### ─── 2.7 video-full ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────────────────────────────────────┐          ║
║  │                                                  │          ║
║  │                                                  │          ║
║  │               ┌────────────────────┐              │          ║
║  │               │                    │              │          ║
║  │               │     VIDEO 16:9     │              │   100%  ║
║  │               │   (fullscreen)     │              │          ║
║  │               │                    │              │          ║
║  │               └────────────────────┘              │          ║
║  │                                                  │          ║
║  │                                                  │          ║
║  └──────────────────────────────────────────────────┘          ║
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Layout INMERSIVO. Solo video, sin distracciones.
  
  ¿Por qué tenerlo si ya tenemos video en todos los otros layouts?
  Porque cuando el contenido ES el video (tráiler, anuncio, clip),
  cualquier otro elemento DIVIDE la atención. Este layout es el
  equivalente a "pantalla completa" en YouTube.
  
  Nota técnica: el video usa ResizeMode.CONTAIN, lo que significa que
  respeta su relación de aspecto. Si es 16:9, se ve sin recortes.
  Si es 21:9 (cinemascope), tendrá barras negras arriba y abajo.

ÁREAS:
──────
  [video] flex: 1   (100%)
```

### ─── 2.8 story-full ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────────────────────────────────────┐          ║
║  │                                                  │          ║
║  │                                                  │          ║
║  │               ┌────────────────────┐              │          ║
║  │               │                    │              │          ║
║  │               │   HISTORIA 16:9    │              │   100%  ║
║  │               │  (fullscreen)      │              │          ║
║  │               │                    │              │          ║
║  │               │   img1 ▶ img2 ▶   │              │          ║
║  │               └────────────────────┘              │          ║
║  │                                                  │          ║
║  └──────────────────────────────────────────────────┘          ║
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Layout GALERÍA. Solo imágenes/stories a pantalla completa.
  
  Las imágenes se muestran en secuencia automática (cada 4s) con
  transiciones directas (cut, no fade). En TV, la barra de progreso
  se muestra semitransparente en la parte superior.
  
  Las imágenes se renderizan con resizeMode="cover", lo que significa
  que LLENAN la pantalla recortando los bordes si es necesario.
  Para evitar recortes importantes, las imágenes ideales son 16:9.
  
  Si una imagen es 9:16 (vertical), se centrará y los costados se
  rellenan con color sólido o se recortan.

ÁREAS:
──────
  [story] flex: 1   (100%)
```

### ─── 2.9 video-left-dual-story ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────────────┬────────────────────────┐         ║
║  │                          │  ┌────────────────────┐ │         ║
║  │                          │  │  STORY TOP         │ │         ║
║  │       ┌──────┐           │  │  (9:16)            │ │         ║
║  │       │      │           │  │                    │ │         ║
║  │       │ VIDEO│           │  │  img1▶img2         │ │         ║
║  │       │ 16:9 │           │  └────────────────────┘ │         ║
║  │       │      │           │  ┌────────────────────┐ │         ║
║  │       │      │           │  │  STORY BOTTOM      │ │         ║
║  │       └──────┘           │  │  (9:16)            │ │         ║
║  │         50%              │  │  img1▶img2         │ │         ║
║  │                          │  └────────────────────┘ │         ║
║  └──────────────────────────┴────────────────────────┘         ║
║                             50%                                 ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Este layout presenta un CASO DE ANIDAMIENTO (stack). La parte
  derecha NO es un área plana, sino un CONTENEDOR VERTICAL con
  dos sub-áreas de tipo story.
  
  ¿Por qué anidar en lugar de tener 3 áreas planas?
  Porque la relación entre story-top y story-bottom es VERTICAL
  (una arriba de la otra), mientras que la relación general es
  HORIZONTAL (video a la izquierda, stories a la derecha).
  
  El anidamiento permite:
    - Direcciones diferentes en cada nivel del árbol
    - Proporciones independientes (50/50 global, 50/50 local)
    - Reutilización de componentes (StoryPanel se usa dos veces)
  
  Cada story tiene su PROPIO TIMER independiente. Si story-top tiene
  3 imágenes y story-bottom tiene 2, cada una avanza a su propio
  ritmo.

ESTRUCTURA DE ÁREAS:
────────────────────
  dirección: row
  ├── [video]        flex: 5
  └── [stack]        flex: 5   dirección: column
       ├── [story-top]    flex: 1   (tipo: story)
       └── [story-bottom] flex: 1   (tipo: story)

CONTENIDO:
─────────
  content.video        = [video]
  content["story-top"]    = [image-story, image-story, ...]
  content["story-bottom"] = [image-story, image-story, ...]
```

### ─── 2.10 video-left-image-grid-right ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────────────────────┬────────────────────────┐         ║
║  │                          │  ┌──────┬──────┐      │         ║
║  │       ┌──────┐           │  │ img1 │ img2 │      │         ║
║  │       │      │           │  │      │      │      │         ║
║  │       │ VIDEO│           │  ├──────┼──────┤      │         ║
║  │       │ 16:9 │           │  │ img3 │ img4 │      │         ║
║  │       │      │           │  │      │      │      │         ║
║  │       └──────┘           │  └──────┴──────┘      │         ║
║  │         55%              │  GRID 2x2    45%      │         ║
║  └──────────────────────────┴────────────────────────┘         ║
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Layout CATÁLOGO. Video a la izquierda, cuadrícula 2×2 de imágenes
  a la derecha. Cada celda del grid ocupa exactamente 25% del área.
  
  ¿Por qué 2×2 y no 3×2 o 4×4? Porque:
    - 2×2: 4 imágenes visibles simultáneamente → fácil de escanear
    - Más de 4 imágenes → páginas con rotación (cada 5s)
    - Menos de 4 → celdas vacías que se ven mal
  
  El grid hace PAGINACIÓN: si hay 8 imágenes, se muestran en 2 páginas
  de 4 imágenes cada una. La página avanza cada 5 segundos.
  
  Ideal para: catálogos de productos, portfolios, menús, galerías.

ÁREAS:
──────
  [video] flex: 55  │  [grid] flex: 45
```

### ─── 2.11 video-center-story-split ───

```text
╔══════════════════════════════════════════════════════════════════╗
║                    CARTELERA DIGITAL                            ║
║                                                                ║
║  ┌──────────┬──────────────────────┬──────────┐                ║
║  │          │                      │          │                ║
║  │  STORY   │      ┌──────┐       │  STORY   │                ║
║  │  IZQ     │      │      │       │  DER     │                ║
║  │  (9:16)  │      │ VIDEO│       │  (9:16)  │                ║
║  │          │      │ 16:9 │       │          │                ║
║  │  img▶img │      └──────┘       │  img▶img │                ║
║  │          │                      │          │                ║
║  │   30%    │        40%          │   30%    │                ║
║  └──────────┴──────────────────────┴──────────┘                ║
║                                                                ║
╚══════════════════════════════════════════════════════════════════╝

DECISIÓN DE DISEÑO:
─────────────────
  Layout SIMÉTRICO. Video centrado flanqueado por dos historias
  laterales. Es el layout más BALANCEADO visualmente.
  
  ¿Por qué 30/40/30 y no 33/33/33? Porque el video necesita más
  espacio que las historias para ser funcional. 30% es suficiente
  para una historia 9:16, y 40% para un video 16:9.
  
  Este layout crea un EFECTO MARCO: las historias actúan como
  marco decorativo del video central. Ideal para branding donde
  el video es el mensaje principal y las historias son soporte.
  
  DESAFÍO TÉCNICO: 3 áreas con contenido vivo simultáneo significa
  3 timers de story corriendo al mismo tiempo. Esto es intencional:
  cada story es independiente y avanza a su propio ritmo.

ÁREAS:
──────
  [story-left] flex: 3  │  [video] flex: 4  │  [story-right] flex: 3
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 3. EL CICLO DE VIDA DEL CONTENIDO
## ═══════════════════════════════════════════════════════════════════════════════

### 3.1 Timeline de un Slide

```text
TIEMPO:  0s          4s          8s          12s         16s         20s
         │           │           │           │           │           │
SLIDE 1  └───────────┴───────────┴───────────┴───────────┴───────────┘
         Video reproduce ──────────────────────────────────────────────►
         Story: img1     img2     img3     img1     img2     img3
         Grid:  pág1     pág1     pág1     pág1     pág2     pág2
                                              ▲
                                              └── aquí rota al slide 2

SLIDE 2  ┌───────────┬───────────┬───────────┬───────────┬───────────┐
         Video reproduce (nuevo) ────────────────────────────────────►
         Story: imgA     imgB     imgC     imgD     imgA     imgB
         Grid:  pág1     pág1     pág2     pág2     pág2     pág2

CADA 5 SEGUNDOS:
  - El Billboard avanza al siguiente slide
  - El video del slide anterior se DETIENE (pauseAsync)
  - El video del nuevo slide se INICIA (playAsync)
  - Las stories de cada área REINICIAN su índice a 0
  - Los grids REINICIAN su página a 0

DENTRO DE CADA SLIDE (mientras está activo):
  - Story: avanza de imagen cada 4 segundos
  - Grid:  avanza de página cada 5 segundos (si hay más de 4 imágenes)
  - Video: se reproduce en bucle (isLooping = true)
```

### 3.2 ¿Qué pasa cuando el slide NO está activo?

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  SLIDE NO ACTIVO (en memoria, pero no visible):                     │
│                                                                     │
│  - Video:  pauseAsync() → se congela en el fotograma actual         │
│  - Story:  el setInterval NO se crea → las imágenes no avanzan     │
│  - Grid:   el setInterval NO se crea → las páginas no avanzan      │
│                                                                     │
│  SLIDE ACTIVO (visible en pantalla):                                │
│                                                                     │
│  - Video:  playAsync() → reproduce en bucle                        │
│  - Story:  setInterval(4000ms) → avanza imágenes                   │
│  - Grid:   setInterval(5000ms) → avanza páginas                    │
│                                                                     │
│  ¿Por qué no tener todos los slides activos simultáneamente?        │
│                                                                     │
│  1. RENDIMIENTO: 10 slides × 3 áreas = 30 timers + N videos        │
│     reproduciendo = CPU/GPU saturada en TV (que tiene menos         │
│     recursos que un teléfono).                                      │
│                                                                     │
│  2. SINCRO: cuando el usuario regresa al slide, el contenido        │
│     debería retomar donde quedó. Pero las stories avanzaron         │
│     sin que nadie las viera → experiencia inconsistente.            │
│                                                                     │
│  3. RED: videos en bucle consumen ancho de banda. En TV con         │
│     WiFi, tener 10 videos reproduciendo (aunque sea en offscreen)   │
│     satura la conexión.                                             │
│                                                                     │
│  SOLUCIÓN: solo el slide ACTIVO reproduce contenido.                │
│  Los slides inactivos están congelados hasta que les toque.         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 El Mecanismo de Propulsión (isActive)

```text
╔════════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║   Billboard                                                           ║
║     │                                                                 ║
║     │  currentSlideIndex = 2                                          ║
║     │                                                                 ║
║     ├── BillboardSlide[0] ─── isActive = false                        ║
║     │     └── LayoutEngine ─── VideoPlayer (paused)                   ║
║     │                          StoryPanel (timer detenido)            ║
║     │                                                                 ║
║     ├── BillboardSlide[1] ─── isActive = false                        ║
║     │     └── LayoutEngine ─── VideoPlayer (paused)                   ║�
║     │                          StoryPanel (timer detenido)            ║
║     │                                                                 ║
║     ├── BillboardSlide[2] ─── isActive = TRUE  ◄──── estamos aquí     ║
║     │     └── LayoutEngine ─── VideoPlayer (PLAYING)                  ║
║     │                          StoryPanel (timer ACTIVO)              ║
║     │                                                                 ║
║     ├── BillboardSlide[3] ─── isActive = false                        ║
║     │                                                                 ║
║     └── BillboardSlide[...] ─── isActive = false                      ║
║                                                                       ║
╚════════════════════════════════════════════════════════════════════════╝

La prop isActive viaja así:
  Billboard (determina quién es el activo)
    └── BillboardSlide (recibe isActive)
          └── LayoutEngine (pasa isActive a sub-áreas)
                ├── VideoPlayer (play/pause según isActive)
                ├── StoryPanel (timer on/off según isActive)
                └── ImageGrid (timer on/off según isActive)
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 4. CÓMO SE CONSTRUYE UN LAYOUT (EL MOTOR)
## ═══════════════════════════════════════════════════════════════════════════════

### 4.1 La Estructura de Árbol

Cada layout es un ÁRBOL de áreas. La raíz es el contenedor principal
con una dirección (row o column). Cada nodo puede ser:

```text
Layout "video-left-dual-story"
│
│  dirección: "row"
│
├── Nodo: video (tipo: "video", flex: 5)
│     └── Leaf: VideoPlayer
│
└── Nodo: stack (tipo: "stack", flex: 5, dirección: "column")
      │
      ├── Nodo: story-top (tipo: "story", flex: 1)
      │     └── Leaf: StoryPanel
      │
      └── Nodo: story-bottom (tipo: "story", flex: 1)
            └── Leaf: StoryPanel
```

La gran ventaja del árbol sobre una lista plana es que permite
ANIDAMIENTO. Layouts complejos (como video + 2 stories) se construyen
componiendo sub-layouts dentro del layout principal.

### 4.2 Flex: Cómo se Calculan las Proporciones

El sistema usa `flex` de React Native, que es una PROPORCIÓN RELATIVA.

```text
EJEMPLO: Layout "video-left-story-right"
  áreas: [
    { id: "video", flex: 6 },
    { id: "story", flex: 4 },
  ]

  Cálculo:
    Suma total = 6 + 4 = 10
    Video = 6/10 = 60%
    Story = 4/10 = 40%

EJEMPLO: Layout "video-left-wide"
  áreas: [
    { id: "video", flex: 75 },
    { id: "story", flex: 25 },
  ]

  Cálculo:
    Suma total = 75 + 25 = 100
    Video = 75/100 = 75%
    Story = 25/100 = 25%

¿Por qué números enteros y no porcentajes?
  Porque flex en React Native funciona con enteros. + es más natural
  pensar en proporciones (6:4 = 60:40) que en decimales (0.6:0.4).

¿Por qué no usar siempre porcentajes?
  Porque Flexbox es RELACIONAL: la suma de flex de los hermanos
  determina la proporción. Es más intuitivo para layouts dinámicos.
```

### 4.3 El Algoritmo de Renderizado (LayoutEngine)

```text
function LayoutEngine(props):
  1. Toma el layout (definición de áreas)
  2. Toma el content (datos para cada área)
  3. Renderiza un contenedor con flexDirection = layout.direction
  4. Para CADA área en layout.areas:
       a. Calcula flex proporcional
       b. Crea un View contenedor con ese flex
       c. Si el área es "stack":
            - Renderiza recursivamente (vuelve al paso 3)
       d. Si el área es "video", "story" o "image-grid":
            - Filtra el contenido relevante
            - Renderiza el componente apropiado
            - Pasa isActive al componente
  5. Devuelve el árbol de Views

Esto es esencialmente un ALGORITMO RECURSIVO: un layout es un árbol,
y el LayoutEngine lo recorre en profundidad (depth-first), renderizando
cada nodo según su tipo.

COMPLEJIDAD:
  - Tiempo: O(n) donde n = número de áreas en el layout
  - Memoria: O(d) donde d = profundidad del árbol de áreas
  - La mayoría de layouts tienen profundidad 1 (planos)
  - Solo "video-left-dual-story" tiene profundidad 2
```

### 4.4 Type Safety: Cómo se Conectan los Datos

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  El sistema usa TypeScript para GARANTIZAR que los datos coinciden  │
│  con la estructura del layout. No hay validación en runtime.        │
│                                                                     │
│  CADENA DE CONTRATOS:                                                │
│                                                                     │
│  LayoutDefinition.areas[].id  ◄──►  Announcement.content[areaId]   │
│       │                                       │                    │
│       │  "video"                              │  videos[]          │
│       │  "story"                              │  images[]          │
│       │  "story-top"                          │  images[]          │
│       │  "grid"                               │  images[]          │
│       │                                       │                    │
│       └── ambas deben coincidir ──────────────┘                    │
│                                                                     │
│  Si el layout define un área "story-top" pero el content no tiene   │
│  esa clave, el área se renderiza vacía ("Sin contenido").           │
│                                                                     │
│  Si el content tiene datos para "story-extra" pero el layout no     │
│  tiene esa área, los datos se IGNORAN. No hay error, no hay crash.  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 5. DECISIONES DE DISEÑO (Y POR QUÉ)
## ═══════════════════════════════════════════════════════════════════════════════

### Decisión #1: Configuración Declarativa vs. Programática

```text
PROBLEMA:
  ¿Cómo definimos las variaciones de layout?

OPCIÓN A (DESCARTADA): Componentes separados para cada layout
  - VideoLeftStoryRight.tsx
  - VideoRightStoryLeft.tsx
  - VideoFull.tsx
  - ...
  
  VENTAJA: cada layout es 100% personalizable
  DESVENTAJA: 10 layouts = 10 componentes = MUCHO código duplicado

OPCIÓN B (ELEGIDA): Configuración declarativa en datos
  layouts.ts contiene un array de objetos LayoutDefinition
  LayoutEngine.tsx interpreta la configuración y renderiza

  VENTAJA: agregar un layout es agregar 10 líneas de config
  DESVENTAJA: layouts complejos (con anidamiento) requieren
              más configuración

¿POR QUÉ ELEGIMOS B?
  Porque la mayoría de los layouts son variaciones de:
    - dirección: row/column
    - proporciones: cambiar flex
    - tipos de área: video/story/grid
  
  Con la opción A, cada layout nuevo requería crear un archivo,
  importar componentes, manejar estados, etc.
  Con la opción B, es solo agregar un objeto al array.

  La excepción es "video-left-dual-story" que NECESITA anidamiento
  (stack). Para eso, la configuración permite hijos recursivos.
```

### Decisión #2: Un Solo Video por Área

```text
PROBLEMA:
  ¿Un área de video puede tener múltiples videos?

DECISIÓN: Sí, pero solo reproducimos el PRIMERO.
  - Si content.video tiene 3 videos, solo se reproduce el [0]
  - Los demás se ignoran
  - Si necesitas múltiples videos, crea un layout con 2 áreas video

ALTERNATIVA (DESCARTADA): Playlist de videos
  Podríamos tener una lista de reproducción que avance cada N segundos.
  Pero esto complica la sincronización con stories y grids.
  Además, un video en bucle es más común en carteleras digitales.

¿POR QUÉ?
  Las carteleras digitales REALES usan videos cortos en bucle.
  No hay "listas de reproducción" de videos en una misma área
  porque el video está diseñado para verse en loop.
```

### Decisión #3: El Forzado de Layout (forcedLayoutId)

```text
PROBLEMA:
  ¿Cómo probar diferentes layouts con el mismo contenido?

SOLUCIÓN: forcedLayoutId en Billboard
  - Cuando el usuario pausa, puede forzar un layout diferente
  - El layout forzado SOBREESCRIBE el layoutId del announcement
  - Después de 15s (3 ciclos de rotación), el forzado expira
  - El layout vuelve al original automáticamente

DECISIÓN DE DISEÑO:
  El forzado NO persiste al cambiar de slide. Cuando la rotación
  avanza al siguiente announcement, su layoutId original se usa.
  Esto evita bugs donde el layout forzado se queda pegado.
```

### Decisión #4: Stories vs. Grids

```text
PROBLEMA:
  ¿Cuándo usar StoryPanel y cuándo ImageGrid?

STORY PANEL:
  - Contenido VERTICAL (9:16)
  - Una imagen a la vez
  - Avance automático cada 4s
  - Ideal para: historias, mensajes secuenciales, storytelling

IMAGE GRID:
  - Contenido CUADRADO (1:1)
  - Múltiples imágenes simultáneas (2×2)
  - Paginación cada 5s
  - Ideal para: catálogos, galerías, comparativas

REGLAS:
  - Si las imágenes son verticales → usa story
  - Si las imágenes son cuadradas → usa grid
  - Si hay 1-4 imágenes → story (secuencial) o grid (simultáneo)
  - Si hay 5+ imágenes → grid con paginación
```

### Decisión #5: Sin Transiciones Animadas entre Imágenes

```text
PROBLEMA:
  ¿Cómo hacemos la transición entre imágenes de una story?

DECISIÓN: Cambio directo (cut), sin fade, sin slide.

¿POR QUÉ?
  1. RENDIMIENTO EN TV: Las TVs tienen GPUs menos potentes.
     Las animaciones consumen frames que podrían dedicarse al video.
  
  2. SIMPLICIDAD: El cambio directo es más fácil de depurar y
     mantener. No hay estados intermedios.
  
  3. CONSISTENCIA: Los reproductores de video usan cambio directo
     entre escenas. La story debe sentirse parte del mismo sistema.

FUTURO: Se puede agregar fade suave (300ms) sin cambiar la
  arquitectura. Es solo modificar StoryPanel para usar
  react-native-reanimated con withTiming en la opacidad.
  La propuesta está documentada en la sección "Cómo Extender".
```

### Decisión #6: expo-av vs. Video Nativo

```text
PROBLEMA:
  ¿Qué librería usar para reproducir video?

OPCIÓN A: expo-av (ELEGIDA)
  - Librería oficial de Expo
  - API estable y bien documentada
  - Soporte para poster (imagen de portada)
  - ResizeMode.CONTAIN / COVER / STRETCH
  - isLooping, shouldPlay, isMuted
  - Funciona en TV (Android TV y tvOS)

OPCIÓN B: expo-video (nueva)
  - Más moderna pero más reciente
  - Menos documentación
  - Menos probada en TV

OPCIÓN C: react-native-video
  - No oficial de Expo
  - Requiere configuración adicional en Bare Workflow
  - Más opciones pero más complejo

¿POR QUÉ expo-av?
  Porque es la opción más probada de Expo para video en TV.
  expo-av funciona con react-native-tvos sin configuración extra.
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 6. CÓMO AGREGAR UN NUEVO LAYOUT
## ═══════════════════════════════════════════════════════════════════════════════

### 6.1 El Proceso (3 Pasos)

```text
PASO 1: Definir el layout en layouts.ts
─────────────────────────────────────

Agrega un objeto al array LAYOUTS:

  {
    id: "mi-layout-personalizado",       // ← único, sin espacios
    name: "Mi Layout Personalizado",      // ← nombre legible
    description: "Descripción del layout", // ← qué lo hace único
    icon: "✨",                           // ← emoji para identificar
    direction: "row",                     // ← "row" o "column"
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
  }

PASO 2: Agregar contenido en announcements.ts
───────────────────────────────────────────────

En el announcement que usará el layout, agrega:

  layoutId: "mi-layout-personalizado",
  content: {
    video: [ { type: "video", url: "..." } ],
    story: [ { type: "image-story", url: "..." }, ... ],
  }

PASO 3: ¡Listo!
────────────────
  No necesitas tocar LayoutEngine, Billboard, ni BillboardSlide.
  El sistema es EXTENSIBLE por configuración.
```

### 6.2 Layouts Avanzados con Anidamiento

```text
Si necesitas un layout con sub-áreas (como "video-left-dual-story"):

  areas: [
    {
      id: "video",
      type: "video",
      flex: 5,
      style: { borderRadius: 12, padding: 8 },
    },
    {
      id: "mi-stack",
      type: "stack",           // ← contenedor anidado
      flex: 5,
      direction: "column",     // ← dirección del stack
      style: { padding: 4 },
      children: [              // ← sub-áreas del stack
        {
          id: "arriba",
          type: "story",
          flex: 1,
          direction: "column",
          style: { borderRadius: 8, padding: 4 },
        },
        {
          id: "abajo",
          type: "image-grid",
          flex: 1,
          style: { borderRadius: 8, padding: 4 },
        },
      ],
    },
  ],

  Esto crea un layout con:
    dirección: row
    ├── video (50%)
    └── stack (50%, dirección: column)
          ├── story "arriba" (50% del stack)
          └── grid "abajo" (50% del stack)
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 7. TV: CONSIDERACIONES ESPECIALES
## ═══════════════════════════════════════════════════════════════════════════════

### 7.1 Video en TV

```text
PROBLEMAS ESPECÍFICOS DE TV:
───────────────────────────

1. CÓDECS:
   Android TV: H.264 (AVC), H.265 (HEVC)
   Apple TV:   H.264, H.265, VP9 (algunos modelos)
   
   RECOMENDACIÓN: usar H.264 (máxima compatibilidad)
   Los videos de ejemplo usan .mp4 con H.264.

2. FRAMERATE:
   La mayoría de TVs son 60Hz. Videos a 30fps o 60fps.
   Evitar 24fps (cine) porque en TV puede verse entrecortado
   (3:2 pulldown).

3. RESOLUCIÓN:
   1080p es suficiente para una cartelera digital.
   4K consume más ancho de banda y GPU.

4. BUCLE (LOOP):
   En TV, el video debe hacer loop SIN pausa visible.
   expo-av con isLooping=true lo maneja automáticamente.
   Pero algunos videos tienen un "gap" al reiniciar.
   
   SOLUCIÓN: videos cortos (10-30s) diseñados para loop.
   Los videos de ejemplo son cortos y diseñados para bucle.

5. MÚLTIPLES VIDEOS SIMULTÁNEOS:
   En layouts como "video-left-dual-story", solo hay UN video
   reproduciendo. Las áreas story NO reproducen video, solo
   imágenes estáticas. Esto es INTENCIONAL para evitar saturar
   la GPU de la TV.
```

### 7.2 Texto en TV

```text
ESCALADO:
────────
  Todos los textos se escalan con tvScale(1.5×) cuando IS_TV es true.
  Esto aplica a:
    - Títulos de anuncios (32 → 48dp)
    - Descripciones (18 → 28dp)
    - Overlay de pausa (48 → 72dp)
    - Nombres de layout en el overlay

  El escalado NO aplica a:
    - Overlays de imagen (títulos dentro de StoryPanel)
    - Estos se renderizan directamente sobre la imagen y se ven
      pequeños en TV.
    
  SOLUCIÓN FUTURA: agregar tvScale() a los textos de StoryPanel
  y ImageGrid cuando se detecte IS_TV.
```

### 7.3 Navegación entre Layouts

```text
En TV, el usuario puede cambiar de layout mientras está PAUSADO:

  LEFT/RIGHT: navega entre slides (como antes)
  PLAY/PAUSE: pausa/reanuda rotación (como antes)
  SELECT:     pausa/reanuda (como antes)

¿CÓMO CAMBIAR LAYOUT?
  Actualmente no hay un botón específico de TV para cambiar layout.
  El cambio entre layouts se produce:
    1. Automáticamente: cada slide tiene su layoutId
    2. Por código: modificando forcedLayoutId en Billboard

  Para agregar control TV de layouts:
    - Mapear MENU o un botón específico a cycleLayoutForward()
    - Esto requiere modificar el TVEventHandler en Billboard.tsx
  
  DECISIÓN DE DISEÑO: No incluimos navegación TV de layouts por ahora
  porque:
    - Los layouts están diseñados para ser parte del contenido
      (cada anuncio elige su layout ideal)
    - El forzado es una herramienta de DEBUG, no de UX
```

### 7.4 Consumo de Recursos

```text
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  RECURSOS CRÍTICOS EN TV:                                           │
│                                                                     │
│  MEMORIA RAM:                                                       │
│    - TVs tienen 1-2GB RAM (vs 4-8GB en teléfonos)                  │
│    - Cada componente montado consume RAM                            │
│    - Los slides inactivos siguen montados (ScrollView)              │
│    - Pero sus timers y videos están DETENIDOS                       │
│                                                                     │
│  GPU:                                                               │
│    - TVs usan GPUs integradas (menos potentes que móviles)          │
│    - Renderizar 1 video + 1 imagen por slide es óptimo              │
│    - Los layouts con grid (4 imágenes simultáneas) son más          │
│      pesados pero aceptables porque son estáticas                   │
│                                                                     │
│  RED/WiFi:                                                          │
│    - TV conectada por WiFi (no ethernet en muchos casos)            │
│    - Los videos se cargan una vez y quedan en buffer                │
│    - Las imágenes (picsum.photos) se cargan bajo demanda            │
│    - En TV, 10 imágenes de 360×640 ≈ 2-3MB cada una                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 8. MAPA DE ARCHIVOS
## ═══════════════════════════════════════════════════════════════════════════════

```text
src/
│
├── types/
│   └── index.ts                    ← CONTRATOS
│       MediaContent                ← { type, url, durationMs, posterUrl, title }
│       LayoutAreaConfig            ← { id, type, flex, direction, children, style }
│       LayoutDefinition            ← { id, name, desc, icon, direction, areas }
│       Announcement                ← { ..., layoutId, content }
│
├── components/
│   │
│   ├── layouts/
│   │   ├── layouts.ts              ← REGISTRY (10 layouts definidos aquí)
│   │   │   LAYOUTS                 ← Array<LayoutDefinition>
│   │   │   getLayoutById()         ← Buscador por ID
│   │   │   getNextLayoutId()       ← Ciclador hacia adelante
│   │   │   getPreviousLayoutId()   ← Ciclador hacia atrás
│   │   │
│   │   └── LayoutEngine.tsx        ← MOTOR DE RENDERIZADO
│   │       LayoutEngine            ← Componente principal
│   │       AreaNode                ← Renderiza un nodo del árbol
│   │       ContentRenderer         ← Elige el componente según tipo
│   │
│   ├── media/
│   │   ├── VideoPlayer.tsx         ← REPRODUCTOR DE VIDEO
│   │   │   VideoPlayer             ← expo-av <Video>
│   │   │   playAsync/pauseAsync    ← Control por isActive
│   │   │
│   │   ├── StoryPanel.tsx          ← PANEL DE HISTORIA
│   │   │   StoryPanel              ← Imagen + timer + progreso
│   │   │   STORY_DURATION_MS=4000  ← 4s por imagen
│   │   │
│   │   └── ImageGrid.tsx           ← GRID DE IMÁGENES
│   │       ImageGrid               ← 2×2 + paginación
│   │       GRID_INTERVAL_MS=5000   ← 5s por página
│   │
│   ├── Billboard.tsx               ← ORQUESTADOR (CONTENEDOR INTELIGENTE)
│   │   Billboard                   ← Timer, scroll, TV, layouts
│   │   forcedLayoutId              ← Override de layout para debug
│   │   cycleLayoutForward/Backward ← Navegación entre layouts
│   │
│   ├── BillboardSlide.tsx          ← PRESENTADOR DE SLIDE
│   │   BillboardSlide              ← Busca layout + renderiza LayoutEngine
│   │
│   └── SlideIndicator.tsx          ← INDICADOR DE SLIDE (sin cambios)
│
├── data/
│   └── announcements.ts            ← 10 ANUNCIOS CON CONTENIDO REAL
│       ANNOUNCEMENTS               ← 10 entries, cada uno con layoutId único
│
├── app/
│   ├── _layout.tsx                 ← (sin cambios)
│   └── index.tsx                   ← (sin cambios)
│
└── utils/
    └── tv.ts                       ← (sin cambios, sigue funcionando)
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 9. MATRIZ DE COMPATIBILIDAD: CONTENIDO vs. LAYOUT
## ═══════════════════════════════════════════════════════════════════════════════

```text
¿Qué layout usar según el tipo de contenido?

                                  │ Video   │ Story   │ Grid    │ Mixto   │
                                  │ solo    │ solo    │ solo    │ (V+S+G) │
──────────────────────────────────┼─────────┼─────────┼─────────┼─────────┤
video-full                        │   ✅    │   ❌    │   ❌    │   ❌    │
story-full                        │   ❌    │   ✅    │   ❌    │   ❌    │
video-left-story-right            │   ❌    │   ❌    │   ❌    │   ✅    │
video-right-story-left            │   ❌    │   ❌    │   ❌    │   ✅    │
video-left-wide                   │   ❌    │   ❌    │   ❌    │   ✅    │
video-left-narrow                 │   ❌    │   ❌    │   ❌    │   ✅    │
video-top-story-bottom            │   ❌    │   ❌    │   ❌    │   ✅    │
video-bottom-story-top            │   ❌    │   ❌    │   ❌    │   ✅    │
video-left-dual-story             │   ❌    │   ❌    │   ❌    │   ✅    │
video-left-image-grid-right       │   ❌    │   ❌    │   ✅    │   ❌    │
video-center-story-split          │   ❌    │   ❌    │   ❌    │   ✅    │

✅ = compatible, ❌ = incompatible (el área definida no existe o no se usa)

NOTA: un layout SIEMPRE renderiza todas sus áreas. Si un área no tiene
contenido (content[areaId] = undefined), se muestra "Sin contenido".
Esto es mejor que un crash, pero no es ideal.
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## 10. EXTENDIENDO EL SISTEMA (FUTURO)
## ═══════════════════════════════════════════════════════════════════════════════

### 10.1 Nuevos Tipos de Área

```text
Para agregar un nuevo tipo de contenido (ej: "text", "carousel", "map"):

  1. En types/index.ts:
     Agregar el nuevo tipo a LayoutAreaConfig.type

  2. En LayoutEngine.tsx:
     Agregar un case en ContentRenderer

  3. Crear el componente en media/:
     src/components/media/NuevoComponente.tsx

  4. En layouts.ts:
     Usar el nuevo tipo en las áreas

  EJEMPLO: tipo "text" para mostrar texto formateado
    areas: [
      { id: "mensaje", type: "text", flex: 3, ... },
      { id: "video", type: "video", flex: 7, ... },
    ]
    content: {
      mensaje: [{ type: "text", url: "", title: "Texto aquí" }],
      video: [{ type: "video", url: "..." }],
    }
```

### 10.2 Animaciones entre Stories

```text
Actualmente las stories hacen cambio DIRECTO (cut).
Para agregar fade entre imágenes:

  En StoryPanel.tsx, reemplazar:
  
    <Image source={currentMedia.url} />
  
  Con:
  
    const opacity = useSharedValue(0);
    useEffect(() => {
      opacity.value = withTiming(1, { duration: 300 });
      return () => { opacity.value = 0; };
    }, [currentIndex]);
    
    <Animated.Image style={{ opacity }} source={...} />

  react-native-reanimated ya está instalado en el proyecto.
```

### 10.3 Layouts Dinámicos (API)

```text
Si los layouts vienen de un servidor en lugar de ser estáticos:

  1. Los layouts se definirían en JSON:
     GET /api/layouts → LayoutDefinition[]

  2. Se cargarían con fetch en un hook:
     useLayouts() → { layouts, loading, error }

  3. LayoutEngine no cambia (sigue recibiendo LayoutDefinition)

  La validación de layouts remotos requiere Zod o similar:
  
    import { z } from "zod";
    const LayoutSchema = z.object({
      id: z.string(),
      name: z.string(),
      areas: z.array(AreaSchema),
    });
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## APÉNDICE A: GLOSARIO VISUAL DEL SISTEMA DE LAYOUTS
## ═══════════════════════════════════════════════════════════════════════════════

```text
TÉRMINO              │ SIGNIFICADO                                    │ EJEMPLO
─────────────────────┼────────────────────────────────────────────────┼────────────────────
Layout               │ Mapa de distribución del contenido             │ video-left-story-right
Área                 │ Región rectangular con un tipo de contenido    │ { id: "video", type: "video" }
Flex                 │ Proporción relativa del área en el contenedor  │ flex: 6 = 60%
Dirección (dir)      │ Eje principal del layout (row/column)          │ direction: "row"
Stack                │ Contenedor anidado con su propia dirección     │ stack + children[]
Video area           │ Área que reproduce un video en bucle           │ type: "video"
Story area           │ Área que muestra imágenes en secuencia         │ type: "story"
Grid area            │ Área con cuadrícula 2×2 de imágenes            │ type: "image-grid"
Content              │ Datos de media para cada área del layout       │ content.video, content.story
DurationMs           │ Tiempo que una story/grid muestra cada item    │ 4000ms, 5000ms
isActive             │ Flag que indica si el slide es el actual        │ true/false
forcedLayoutId       │ Override temporal del layout de un anuncio     │ "video-full"
LayoutRegistry       │ Array central de todos los layouts definidos   │ LAYOUTS en layouts.ts
```

---

## ═══════════════════════════════════════════════════════════════════════════════
## APÉNDICE B: ÁRBOL DE DECISIÓN VISUAL
## ═══════════════════════════════════════════════════════════════════════════════

```text
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║   INICIO: ¿Qué contenido tienes?                                              ║
║   │                                                                           ║
║   ├─► Solo video ────────────────────────────────► video-full                 ║
║   │                                                                           ║
║   ├─► Solo imágenes ──────────────────────────────► story-full                ║
║   │                                                                           ║
║   ├─► Video + imágenes ─── ¿Cuál es el principal?                             ║
║   │   │                                                                       ║
║   │   ├─► Video es principal ── ¿Quieres simetría?                            ║
║   │   │   │                                                                   ║
║   │   │   ├─► Sí ──► video-center-story-split                                 ║
║   │   │   │                                                                   ║
║   │   │   └─► No ── ¿La historia es apoyo o contenido?                        ║
║   │   │       │                                                               ║
║   │   │       ├─► Apoyo mínimo ──► video-left-wide (75/25)                    ║
║   │   │       │                                                               ║
║   │   │       └─► Apoyo normal ──► video-left-story-right (60/40)             ║
║   │   │                                                                       ║
║   │   └─► Imágenes son principales ──► video-left-narrow (35/65)              ║
║   │                                                                           ║
║   ├─► Video + imágenes ── ¿Layout horizontal o vertical?                       ║
║   │   │                                                                       ║
║   │   ├─► Horizontal (panorámico) ──► video-top-story-bottom                  ║
║   │   │                                   video-bottom-story-top              ║
║   │   │                                                                       ║
║   │   └─► Vertical ── ¿Cuántos paneles de historia?                           ║
║   │       │                                                                   ║
║   │       ├─► 1 ──► video-left-story-right o video-right-story-left           ║
║   │       │                                                                   ║
║   │       └─► 2 ──► video-left-dual-story                                     ║
║   │                                                                           ║
║   └─► Video + muchas imágenes ──► video-left-image-grid-right                 ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```
