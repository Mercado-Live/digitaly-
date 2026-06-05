# PLAN INTEGRAL DEL PROYECTO — CARTELERÍA DIGITAL (HTML + Supabase)

---

## 1. VISIÓN GENERAL DEL SISTEMA

### 1.1 Objetivo
Plataforma web tipo SPA (Single Page Application) que actúa como **centro de control** para una red de dispositivos de cartelería digital (TVs con app React Native). Cada usuario autenticado administra sus propios dispositivos, sube contenido multimedia, organiza playlists, programa campañas y visualiza en tiempo real lo que se muestra en cada pantalla.

### 1.2 Flujo de datos

```
[Panel Web HTML] ←→ [Supabase (Auth + DB + Storage + Realtime)] ←→ [App React Native en TV]
```

- **Panel Web**: El usuario crea/edita contenido, lo asigna a dispositivos.
- **Supabase**: Almacena usuarios, dispositivos, contenido, playlists, y transmite cambios en tiempo real via canales de Realtime.
- **App React Native (TV)**: Se suscribe a Supabase Realtime, recibe cambios y renderiza el contenido asignado.

### 1.3 Tecnologías
- **Frontend**: HTML5, CSS3 (Grid + Flexbox + Custom Properties), Vanilla JS (ES Modules).
- **Backend/BaaS**: Supabase (Auth, Database, Storage, Realtime, Row Level Security).
- **Librerías CDN**: Supabase JS SDK, Chart.js (estadísticas opcional), SortableJS (drag & drop para playlists).
- **Patrón de arquitectura**: SPA con sistema de rutas hash (`#/login`, `#/dashboard`, etc.) y renderizado dinámico del DOM mediante plantillas (template literals).
- **Persistencia local**: `localStorage` para sesión (token JWT), preferencias de UI, último dispositivo seleccionado.

---

## 2. ESTRUCTURA DE ARCHIVOS DETALLADA

```
/proyecto
│
├── index.html                        # Entry point, carga la SPA
│
├── /pages                            # Plantillas HTML parciales (cargadas dinámicamente o embebidas)
│   ├── auth-login.html               # Formulario de inicio de sesión
│   ├── auth-register.html            # Formulario de registro
│   ├── auth-recovery.html            # Recuperación de contraseña
│   ├── dashboard-home.html           # Dashboard principal con resumen
│   ├── devices-list.html             # Lista/grid de dispositivos
│   ├── devices-detail.html           # Detalle de un dispositivo + preview en vivo
│   ├── media-library.html            # Biblioteca de archivos multimedia
│   ├── media-upload.html             # Subida de archivos (imagen, video)
│   ├── playlists-list.html           # Lista de playlists
│   ├── playlists-editor.html         # Editor de playlist (drag & drop de items)
│   ├── schedules-calendar.html       # Programación/calendario de campañas
│   ├── templates-list.html           # Plantillas predefinidas de layouts
│   ├── templates-editor.html         # Editor de plantillas (zonas, widgets)
│   ├── account-settings.html         # Configuración de cuenta
│   ├── account-billing.html          # Facturación y plan (placeholder)
│   └── error-404.html               # Página no encontrada
│
├── /css                              # Hojas de estilo modular
│   ├── main.css                      # Reset, variables CSS, tipografía, utilidades
│   ├── grid.css                      # Sistema de grid responsivo (12 columnas)
│   ├── components.css                # Botones, inputs, modales, tabs, tooltips, badges, loaders
│   ├── auth.css                      # Estilos de autenticación (login, registro)
│   ├── dashboard.css                 # Estilos del dashboard (cards, métricas)
│   ├── devices.css                   # Estilos de dispositivos (tarjetas, estados, preview)
│   ├── media.css                     # Estilos de galería/biblioteca multimedia
│   ├── playlists.css                 # Estilos del editor de playlists (drag & drop)
│   ├── schedules.css                 # Estilos del calendario y programación
│   ├── templates.css                 # Estilos de plantillas
│   ├── settings.css                  # Estilos de configuración
│   ├── notifications.css             # Sistema de notificaciones toast
│   └── themes.css                    # Temas (claro/oscuro)
│
├── /js                               # Lógica del frontend
│   ├── app.js                        # Inicialización de la SPA, router, estado global
│   ├── router.js                     # Sistema de enrutamiento basado en hash
│   ├── state.js                      # Store de estado centralizado (patrón pub/sub)
│   ├── supabase.js                   # Cliente de Supabase (init, auth, helpers)
│   ├── auth.js                       # Lógica de autenticación (login, register, logout, session)
│   ├── api.js                        # Capa de abstracción sobre Supabase (CRUD genérico)
│   │
│   ├── /modules                      # Módulos de funcionalidad por dominio
│   │   ├── dashboard.js              # Carga métricas, actividad reciente, resumen
│   │   ├── devices.js                # CRUD dispositivos, pairing, preview en vivo
│   │   ├── media.js                  # Subida, galería, eliminación de archivos
│   │   ├── playlists.js              # CRUD playlists, ordenamiento, asignación
│   │   ├── schedules.js              # CRUD programaciones, asignación fecha/hora
│   │   ├── templates.js              # CRUD plantillas, editor de zonas
│   │   ├── realtime.js               # Manejo de suscripciones Supabase Realtime
│   │   ├── notifications.js          # Sistema de toast/notificaciones
│   │   └── preview.js                # Renderizado de preview del dispositivo (iframe/canvas)
│   │
│   ├── /utils                        # Utilidades transversales
│   │   ├── dom.js                    # Helpers de manipulación del DOM
│   │   ├── format.js                 # Formateo de fechas, tamaños, duraciones
│   │   ├── validators.js             # Validación de formularios
│   │   ├── debounce.js               # Debounce y throttle
│   │   ├── i18n.js                   # Internacionalización básica (ES/EN)
│   │   └── logger.js                 # Logger con niveles (debug, info, warn, error)
│   │
│   └── /workers                      # Web Workers (opcional, para tareas pesadas)
│       └── image-processor.js        # Redimensionamiento de imágenes antes de subir
│
├── /assets
│   ├── /img
│   │   ├── logo.svg                  # Logo de la plataforma
│   │   ├── favicon.ico               # Favicon
│   │   ├── /icons                    # Iconos SVG individuales
│   │   │   ├── dashboard.svg
│   │   │   ├── device.svg
│   │   │   ├── media.svg
│   │   │   ├── playlist.svg
│   │   │   ├── schedule.svg
│   │   │   ├── template.svg
│   │   │   ├── settings.svg
│   │   │   ├── logout.svg
│   │   │   ├── add.svg
│   │   │   ├── edit.svg
│   │   │   ├── delete.svg
│   │   │   ├── upload.svg
│   │   │   ├── preview.svg
│   │   │   ├── online.svg
│   │   │   ├── offline.svg
│   │   │   ├── warning.svg
│   │   │   ├── success.svg
│   │   │   ├── error.svg
│   │   │   ├── search.svg
│   │   │   ├── filter.svg
│   │   │   ├── sort.svg
│   │   │   ├── drag.svg
│   │   │   ├── fullscreen.svg
│   │   │   ├── refresh.svg
│   │   │   ├── user.svg
│   │   │   ├── lock.svg
│   │   │   ├── mail.svg
│   │   │   └── eye.svg
│   │   ├── /backgrounds              # Fondos decorativos
│   │   │   ├── auth-bg.jpg
│   │   │   └── dashboard-bg.svg
│   │   └── /placeholders             # Imágenes placeholder
│   │       ├── device-placeholder.svg
│   │       ├── media-placeholder.svg
│   │       └── user-avatar.svg
│   │
│   └── /fonts                        # Tipografías locales (WOFF2)
│       ├── inter-regular.woff2
│       ├── inter-medium.woff2
│       ├── inter-bold.woff2
│       └── jetbrains-mono.woff2      # Para datos/métricas
│
└── supabase-schema.sql               # Script con el esquema de base de datos
```

---

## 3. ESQUEMA DE BASE DE DATOS (SUPABASE)

### 3.1 Tabla `profiles` (extiende `auth.users`)

| Columna         | Tipo        | Descripción                             |
|-----------------|-------------|-----------------------------------------|
| id              | uuid (PK)   | Referencia a auth.users.id              |
| email           | text        | Email del usuario                       |
| full_name       | text        | Nombre completo                         |
| company_name    | text        | Empresa/organización                    |
| avatar_url      | text        | URL de la foto de perfil                |
| role            | text        | 'admin', 'manager', 'viewer'            |
| plan            | text        | 'free', 'pro', 'enterprise'            |
| max_devices     | int2        | Límite de dispositivos según plan       |
| created_at      | timestamptz | Fecha de creación                       |
| updated_at      | timestamptz | Fecha de actualización                  |

### 3.2 Tabla `devices`

| Columna         | Tipo        | Descripción                             |
|-----------------|-------------|-----------------------------------------|
| id              | uuid (PK)   | Identificador único del dispositivo     |
| user_id         | uuid (FK)   | Dueño (profiles.id)                     |
| name            | text        | Nombre descriptivo ("TV Entrada")       |
| device_key      | text (UQ)   | Código único de pairing (6 dígitos)     |
| model           | text        | Modelo/info del hardware                |
| location        | text        | Ubicación física                        |
| orientation     | text        | 'landscape' o 'portrait'               |
| resolution      | text        | '1920x1080', '3840x2160', etc.          |
| status          | text        | 'online', 'offline', 'idle', 'playing' |
| last_seen       | timestamptz | Última vez que reportó actividad        |
| current_media_id| uuid (FK)   | Medio que está mostrando ahora          |
| current_playlist_id| uuid (FK)| Playlist activa actualmente             |
| software_version| text        | Versión de la app React Native          |
| ip_address      | text        | Última IP registrada                    |
| settings        | jsonb       | Configuración (brillo, volumen, etc.)   |
| created_at      | timestamptz | Fecha de registro                       |
| updated_at      | timestamptz | Fecha de actualización                  |

### 3.3 Tabla `media`

| Columna         | Tipo        | Descripción                             |
|-----------------|-------------|-----------------------------------------|
| id              | uuid (PK)   | Identificador único                     |
| user_id         | uuid (FK)   | Dueño                                   |
| name            | text        | Nombre descriptivo                      |
| type            | text        | 'image', 'video', 'webpage', 'widget'   |
| url             | text        | URL pública en Supabase Storage         |
| thumbnail_url   | text        | Thumbnail para la galería               |
| file_size       | int8        | Tamaño en bytes                         |
| duration        | int4        | Duración en segundos (videos)           |
| width           | int4        | Ancho en píxeles                        |
| height          | int4        | Alto en píxeles                         |
| mime_type       | text        | MIME type                               |
| tags            | text[]      | Etiquetas para búsqueda                 |
| is_archived     | bool        | Archivado (soft delete)                 |
| created_at      | timestamptz | Fecha de subida                         |
| updated_at      | timestamptz | Fecha de actualización                  |

### 3.4 Tabla `playlists`

| Columna         | Tipo        | Descripción                             |
|-----------------|-------------|-----------------------------------------|
| id              | uuid (PK)   | Identificador único                     |
| user_id         | uuid (FK)   | Dueño                                   |
| name            | text        | Nombre de la playlist                   |
| description     | text        | Descripción                             |
| items           | jsonb       | Array ordenado de {media_id, duration}  |
| is_loop         | bool        | Reproducir en bucle                     |
| transition      | text        | 'none', 'fade', 'slide', 'zoom'        |
| created_at      | timestamptz | Fecha de creación                       |
| updated_at      | timestamptz | Fecha de actualización                  |

Estructura de `items` (jsonb):
```json
[
  { "media_id": "uuid", "duration": 10, "order": 0 },
  { "media_id": "uuid", "duration": 15, "order": 1 },
  { "media_id": "uuid", "duration": 8,  "order": 2 }
]
```

### 3.5 Tabla `schedules`

| Columna         | Tipo        | Descripción                             |
|-----------------|-------------|-----------------------------------------|
| id              | uuid (PK)   | Identificador único                     |
| user_id         | uuid (FK)   | Dueño                                   |
| name            | text        | Nombre de la programación               |
| device_ids      | uuid[]      | Dispositivos asignados                  |
| playlist_id     | uuid (FK)   | Playlist a reproducir                   |
| start_date      | timestamptz | Fecha y hora de inicio                  |
| end_date        | timestamptz | Fecha y hora de fin                     |
| days_of_week    | int2[]      | Días (0=Dom, 1=Lun...6=Sab)            |
| start_time      | time        | Hora de inicio diaria                   |
| end_time        | time        | Hora de fin diaria                      |
| priority        | int2        | Prioridad (mayor = más importante)      |
| is_active       | bool        | Activado/desactivado                    |
| created_at      | timestamptz | Fecha de creación                       |
| updated_at      | timestamptz | Fecha de actualización                  |

### 3.6 Tabla `templates`

| Columna         | Tipo        | Descripción                             |
|-----------------|-------------|-----------------------------------------|
| id              | uuid (PK)   | Identificador único                     |
| user_id         | uuid (FK)   | Dueño (null = plantilla del sistema)    |
| name            | text        | Nombre de la plantilla                  |
| description     | text        | Descripción                             |
| thumbnail_url   | text        | Previsualización                        |
| zones           | jsonb       | Definición de zonas/layout              |
| is_system       | bool        | ¿Es plantilla del sistema?              |
| created_at      | timestamptz | Fecha de creación                       |
| updated_at      | timestamptz | Fecha de actualización                  |

Estructura de `zones` (jsonb):
```json
[
  { "id": "zone-1", "type": "media", "x": 0, "y": 0, "width": 50, "height": 100 },
  { "id": "zone-2", "type": "clock", "x": 50, "y": 0, "width": 50, "height": 30 },
  { "id": "zone-3", "type": "weather", "x": 50, "y": 30, "width": 50, "height": 30 },
  { "id": "zone-4", "type": "ticker", "x": 0, "y": 0, "width": 100, "height": 10 }
]
```

### 3.7 Tabla `device_logs` (historial de actividad)

| Columna         | Tipo        | Descripción                             |
|-----------------|-------------|-----------------------------------------|
| id              | bigserial   | Identificador                           |
| device_id       | uuid (FK)   | Dispositivo                             |
| event_type      | text        | 'online', 'offline', 'playing', 'error' |
| event_data      | jsonb       | Datos adicionales del evento            |
| created_at      | timestamptz | Fecha del evento                        |

### 3.8 Políticas RLS (Row Level Security)

Cada tabla tendrá políticas RLS para que un usuario SOLO pueda ver/modificar sus propios datos:
```sql
-- Ejemplo para devices
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own devices" ON devices
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own devices" ON devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own devices" ON devices
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own devices" ON devices
    FOR DELETE USING (auth.uid() = user_id);
```

### 3.9 Storage Buckets

| Bucket          | Descripción                       | Políticas               |
|-----------------|-----------------------------------|-------------------------|
| `media`         | Archivos multimedia (imágenes, videos) | user_id = auth.uid() |
| `thumbnails`    | Miniaturas generadas              | user_id = auth.uid() |
| `avatars`       | Fotos de perfil                   | user_id = auth.uid() |
| `templates`     | Assets de plantillas              | user_id = auth.uid() |

Límites:
- Plan Free: 500 MB total, archivos máx 50 MB
- Plan Pro: 10 GB total, archivos máx 500 MB
- Plan Enterprise: 100 GB total, archivos máx 2 GB

---

## 4. ARQUITECTURA DEL FRONTEND (SPA con Vanilla JS)

### 4.1 `index.html` — Entry Point

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cartelera Digital - Panel de Control</title>
    <meta name="description" content="Centro de control de cartelería digital">
    <link rel="icon" href="assets/img/favicon.ico">

    <!-- CSS -->
    <link rel="stylesheet" href="css/main.css">
    <link rel="stylesheet" href="css/grid.css">
    <link rel="stylesheet" href="css/components.css">
    <link rel="stylesheet" href="css/auth.css">
    <link rel="stylesheet" href="css/dashboard.css">
    <link rel="stylesheet" href="css/devices.css">
    <link rel="stylesheet" href="css/media.css">
    <link rel="stylesheet" href="css/playlists.css">
    <link rel="stylesheet" href="css/schedules.css">
    <link rel="stylesheet" href="css/templates.css">
    <link rel="stylesheet" href="css/settings.css">
    <link rel="stylesheet" href="css/notifications.css">
    <link rel="stylesheet" href="css/themes.css">

    <!-- Supabase SDK desde CDN (solo en producción) -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <!-- SortableJS para drag & drop -->
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1"></script>

    <!-- App -->
    <script type="module" src="js/app.js"></script>
</head>
<body>
    <!-- Shell de la aplicación -->
    <div id="app-root">
        <!-- Contenido dinámico renderizado por el router -->
        <div id="app-loading" class="app-loading">
            <div class="spinner"></div>
            <p>Cargando Cartelera Digital...</p>
        </div>
    </div>

    <!-- Contenedor de notificaciones toast -->
    <div id="toast-container" class="toast-container"></div>

    <!-- Contenedor de modales globales -->
    <div id="modal-container" class="modal-container"></div>
</body>
</html>
```

### 4.2 `js/app.js` — Inicialización

**Responsabilidades:**
1. Inicializar el cliente Supabase (`js/supabase.js`).
2. Verificar si hay sesión activa (token en `localStorage`).
3. Inicializar el router (`js/router.js`).
4. Inicializar el estado global (`js/state.js`).
5. Si hay sesión → redirigir a `#/dashboard`.
6. Si no hay sesión → redirigir a `#/login`.
7. Configurar listeners globales (resize, online/offline, teclas).
8. Activar suscripciones Realtime para notificaciones globales.

**Pseudocódigo:**
```
import { initSupabase } from './supabase.js';
import { Router } from './router.js';
import { Store } from './state.js';
import { initRealtime } from './modules/realtime.js';

async function bootstrap() {
    const supabase = initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
    const store = new Store({ user: null, session: null, theme: 'light' });

    const router = new Router(store, supabase);

    // Verificar sesión existente
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        store.setState({ user: session.user, session });
        router.navigate('dashboard');
    } else {
        router.navigate('login');
    }

    // Quitar pantalla de carga
    document.getElementById('app-loading').remove();

    // Inicializar sistema de notificaciones
    initNotifications();

    // Suscripciones globales
    initRealtime(supabase, store);
}

bootstrap();
```

### 4.3 `js/router.js` — Sistema de Rutas

**Rutas definidas:**

| Hash               | Vista                      | ¿Requiere auth? |
|--------------------|----------------------------|-----------------|
| `#/login`          | Login                      | No              |
| `#/register`       | Registro                   | No              |
| `#/recovery`       | Recuperar contraseña       | No              |
| `#/dashboard`      | Dashboard principal        | Sí              |
| `#/devices`        | Lista de dispositivos      | Sí              |
| `#/devices/:id`    | Detalle de dispositivo     | Sí              |
| `#/media`          | Biblioteca multimedia      | Sí              |
| `#/media/upload`   | Subir archivos             | Sí              |
| `#/playlists`      | Lista de playlists         | Sí              |
| `#/playlists/:id`  | Editor de playlist         | Sí              |
| `#/schedules`      | Calendario de programación | Sí              |
| `#/schedules/:id`  | Editor de programación     | Sí              |
| `#/templates`      | Lista de plantillas        | Sí              |
| `#/templates/:id`  | Editor de plantillas       | Sí              |
| `#/settings`       | Configuración de cuenta    | Sí              |
| `#/billing`        | Facturación                | Sí              |
| (cualquier otra)   | 404                        | -               |

**Implementación del Router:**

```javascript
class Router {
    constructor(store, supabase) {
        this.store = store;
        this.supabase = supabase;
        this.routes = new Map();
        this.currentRoute = null;
        this.guards = [];
        this.params = {};
        this.query = {};

        // Escuchar cambios de hash
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    register(pattern, handler, options = {}) {
        this.routes.set(pattern, { handler, options });
    }

    navigate(path) {
        window.location.hash = path.startsWith('/') ? path : '/' + path;
    }

    addGuard(fn) {
        this.guards.push(fn);
    }

    async handleRoute() {
        const hash = window.location.hash.slice(1) || '/login';
        const [path, queryString] = hash.split('?');

        // Parsear query params
        this.query = {};
        if (queryString) {
            queryString.split('&').forEach(pair => {
                const [k, v] = pair.split('=');
                this.query[decodeURIComponent(k)] = decodeURIComponent(v || '');
            });
        }

        // Buscar ruta que coincida
        let matchedRoute = null;
        let matchedParams = {};

        for (const [pattern, route] of this.routes) {
            const result = this.matchRoute(pattern, path);
            if (result) {
                matchedRoute = route;
                matchedParams = result;
                break;
            }
        }

        if (!matchedRoute) {
            // 404
            this.render('error-404');
            return;
        }

        // Ejecutar guards
        for (const guard of this.guards) {
            const canActivate = await guard(matchedRoute.options);
            if (!canActivate) {
                if (!this.store.getState().user) {
                    this.navigate('login');
                }
                return;
            }
        }

        this.params = matchedParams;
        this.currentRoute = matchedRoute;

        // Renderizar vista
        await matchedRoute.handler(this.params, this.query);
    }

    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) return null;

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = pathParts[i];
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return params;
    }
}
```

### 4.4 `js/state.js` — Store Centralizado

**Patrón:** Observable (pub/sub) para estado reactivo sin frameworks.

```javascript
class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = new Map(); // key: path, value: Set<callback>
        this.globalListeners = new Set();
    }

    getState() {
        return this.state;
    }

    setState(partialState) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...partialState };

        // Notificar listeners globales
        this.globalListeners.forEach(cb => cb(this.state, prevState));

        // Notificar listeners específicos
        for (const [key, newValue] of Object.entries(partialState)) {
            if (this.listeners.has(key)) {
                this.listeners.get(key).forEach(cb => cb(newValue, prevState[key]));
            }
        }
    }

    subscribe(keyOrCallback, callback) {
        if (typeof keyOrCallback === 'function') {
            this.globalListeners.add(keyOrCallback);
            return () => this.globalListeners.delete(keyOrCallback);
        } else {
            if (!this.listeners.has(keyOrCallback)) {
                this.listeners.set(keyOrCallback, new Set());
            }
            this.listeners.get(keyOrCallback).add(callback);
            return () => this.listeners.get(keyOrCallback)?.delete(callback);
        }
    }

    // Selector derivado (computed value)
    select(selectorFn) {
        let currentValue = selectorFn(this.state);
        const unsubscribe = this.subscribe(() => {
            const newValue = selectorFn(this.state);
            if (newValue !== currentValue) {
                currentValue = newValue;
                // notificar cambio... (simplificado)
            }
        });
        return { get: () => currentValue, unsubscribe };
    }
}
```

**Estado inicial:**
```javascript
{
    // Autenticación
    user: null,
    session: null,
    isAuthenticated: false,
    isAuthLoading: true,

    // Dispositivos
    devices: [],
    selectedDevice: null,
    devicesOnline: 0,
    devicesOffline: 0,

    // Media
    mediaItems: [],
    mediaUploading: [],    // Cola de subida
    mediaFilter: 'all',    // 'all', 'image', 'video'
    mediaSearchQuery: '',

    // Playlists
    playlists: [],
    currentPlaylist: null,

    // Schedules
    schedules: [],
    currentSchedule: null,

    // Templates
    templates: [],
    currentTemplate: null,

    // UI
    theme: 'light',        // 'light', 'dark'
    sidebarCollapsed: false,
    activeModal: null,
    toasts: [],
    isOnline: navigator.onLine,

    // Dashboard
    dashboardStats: {
        totalDevices: 0,
        activeDevices: 0,
        totalMedia: 0,
        totalPlaylists: 0,
        storageUsed: 0,
        storageLimit: 0
    }
}
```

### 4.5 `js/supabase.js` — Cliente Supabase

```javascript
const SUPABASE_URL = 'https://<proyecto>.supabase.co';
const SUPABASE_ANON_KEY = '<anon-key>';

let supabaseClient = null;

export function initSupabase() {
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                storage: window.localStorage,
                detectSessionInUrl: true
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });
    }
    return supabaseClient;
}

export function getSupabase() {
    if (!supabaseClient) throw new Error('Supabase no inicializado');
    return supabaseClient;
}
```

### 4.6 `js/auth.js` — Autenticación

**Funciones:**
- `signUp(email, password, fullName)` → Registro + creación de perfil
- `signIn(email, password)` → Login
- `signOut()` → Logout + limpieza de estado
- `resetPassword(email)` → Enviar email de recuperación
- `updatePassword(newPassword)` → Cambiar contraseña
- `getSession()` → Obtener sesión actual
- `refreshSession()` → Refrescar token
- `onAuthStateChange(callback)` → Listener de cambios de auth

**Flujo de autenticación:**
1. Usuario ingresa credenciales.
2. Se llama a `supabase.auth.signInWithPassword()`.
3. Supabase devuelve `{ user, session }`.
4. Se guarda en `Store.state.user` y `Store.state.session`.
5. Se guarda en `localStorage` (gestionado por Supabase SDK).
6. Se crea/actualiza el perfil en tabla `profiles` mediante trigger SQL.

**Trigger SQL para crear perfil automáticamente:**
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, plan, max_devices)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        'manager',
        'free',
        3
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 4.7 `js/api.js` — Capa de Abstracción sobre Supabase

**Funciones genéricas:**
```javascript
// Todas reciben el store para obtener user_id y aplicar RLS automáticamente

async function fetchAll(table, options = {})       // SELECT con filtros
async function fetchById(table, id)                 // SELECT por ID
async function create(table, data)                  // INSERT
async function update(table, id, data)              // UPDATE
async function remove(table, id)                    // DELETE (soft o hard)
async function uploadFile(bucket, file, path)       // Upload a Storage
async function deleteFile(bucket, path)             // Delete de Storage
async function getPublicUrl(bucket, path)           // URL pública
async function subscribeToChannel(channel, event, callback)  // Realtime
```

**Implementación de `fetchAll`:**
```javascript
export async function fetchAll(table, options = {}) {
    const supabase = getSupabase();
    const store = window.__STORE__; // Referencia global o importado

    let query = supabase.from(table).select(options.select || '*');

    // Filtros
    if (options.filters) {
        for (const filter of options.filters) {
            const [column, op, value] = filter;
            query = query[op](column, value);
        }
    }

    // Ordenamiento
    if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false });
    }

    // Paginación
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 10) - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error(`Error fetching ${table}:`, error);
        throw error;
    }

    return { data, count };
}
```

---

## 5. MÓDULOS DE FUNCIONALIDAD (DETALLE)

### 5.1 `js/modules/dashboard.js` — Dashboard Principal

**Vista:** `#/dashboard`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                         [Fecha/Hora] [User]  │
├──────────┬──────────┬──────────┬────────────────────────┤
│ Disp.    │ Disp.    │ Media    │ Storage Used           │
│ Online   │ Total    │ Total    │ ████████░░ 65%         │
│    5     │    8     │   42     │ 325 MB / 500 MB        │
├──────────┴──────────┴──────────┴────────────────────────┤
│                                                         │
│  Actividad Reciente                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 12:30 - TV Entrada → Reproduciendo "Promo Verano"│   │
│  │ 12:15 - TV Recepción → En espera                 │   │
│  │ 11:45 - TV Cafetería → Sin conexión              │   │
│  │ 11:30 - Subiste "banner_oferta.jpg"              │   │
│  │ 11:00 - Actualizaste playlist "Loop Mañana"      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Dispositivos                           [Ver todos →]   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ TV       │ │ TV       │ │ TV       │ │ TV       │   │
│  │ Entrada  │ │ Recepc.  │ │ Cafeter. │ │ Sala J.  │   │
│  │ [Online] │ │ [Online] │ │[Offline] │ │ [Idle]   │   │
│  │ Loop M.  │ │ Promo V. │ │ ---      │ │ ---      │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                         │
│  Acciones Rápidas                                       │
│  [+ Dispositivo]  [+ Subir Media]  [+ Playlist]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
1. Carga 4 métricas principales desde `device_logs` y `media`.
2. Muestra últimos 10 eventos de `device_logs` unidos con `devices`.
3. Muestra grid de dispositivos (máximo 6, con link a `#/devices`).
4. Botones de acción rápida con tooltips.
5. Gráfico de actividad (opcional, con Chart.js): dispositivos online en las últimas 24h.
6. Auto-refresh cada 30 segundos (polling ligero + Realtime).

**Indicadores de color:**
- Verde: dispositivo online y reproduciendo
- Amarillo: dispositivo online pero idle
- Rojo: dispositivo offline (más de 5 min sin señal)
- Gris: dispositivo nunca conectado

**Funciones del módulo:**
- `loadDashboardStats()` → Query a `devices` (count por status), `media` (count), Storage (uso).
- `loadRecentActivity()` → Query a `device_logs` con join a `devices`.
- `loadDevicesPreview()` → Primeros 6 dispositivos.
- `renderDashboard(stats, activity, devices)` → Construir DOM.
- `setupAutoRefresh()` → `setInterval` cada 30s.

### 5.2 `js/modules/devices.js` — Gestión de Dispositivos

**Vista lista:** `#/devices`

**Layout lista:**
```
┌─────────────────────────────────────────────────────────┐
│  Dispositivos              [🔍 Buscar...]  [+ Agregar]  │
├─────────────────────────────────────────────────────────┤
│  Filtros:  [Todos] [Online] [Offline] [Idle]           │
│  Ordenar:  ▼ Nombre | Estado | Última vez              │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🟢 TV Entrada                    [Ver] [···]      │ │
│  │    Location: Hall Principal                       │ │
│  │    Playlist activa: Loop Mañana                    │ │
│  │    Última conexión: Hace 2 minutos                 │ │
│  │    Resolución: 1920×1080 | v2.1.0                  │ │
│  │    [🖼 Enviar contenido] [▶ Forzar refresh]        │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔴 TV Cafetería                  [Ver] [···]      │ │
│  │    Location: Cafetería 2do piso                    │ │
│  │    Sin conexión desde: Hace 47 minutos             │ │
│  └────────────────────────────────────────────────────┘ │
│  ... más dispositivos ...                              │
└─────────────────────────────────────────────────────────┘
```

**Vista detalle:** `#/devices/:id`

**Layout detalle:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Volver    TV Entrada - Hall Principal    [Online 🟢] │
├────────────────────────────┬────────────────────────────┤
│                            │                            │
│    PREVIEW EN VIVO         │  Información               │
│    (placeholder/iframe     │  ┌──────────────────────┐  │
│     que muestra lo que     │  │ Nombre: TV Entrada   │  │
│     el televisor está      │  │ Ubicación: Hall      │  │
│     mostrando ahora)       │  │ Modelo: Samsung Tizen│  │
│                            │  │ Resolución: 1920×1080│  │
│    ┌──────────────────┐   │  │ Orientación: Horiz.  │  │
│    │                  │   │  │ Versión: v2.1.0      │  │
│    │  [Preview del    │   │  │ IP: 192.168.1.45     │  │
│    │   contenido      │   │  └──────────────────────┘  │
│    │   actual en el   │   │                            │
│    │   televisor]     │   │  Acciones                  │
│    │                  │   │  ┌──────────────────────┐  │
│    └──────────────────┘   │  │[Cambiar contenido]   │  │
│                            │  │[Asignar playlist]    │  │
│    ┌──────────────────┐   │  │[Forzar sincronización]│  │
│    │ Screenshot real  │   │  │[Reiniciar dispositivo]│  │
│    │ si el dispositivo│   │  │[Cambiar configuración]│  │
│    │ lo soporta       │   │  │[Eliminar dispositivo] │  │
│    └──────────────────┘   │  └──────────────────────┘  │
│                            │                            │
│                            │  Historial de actividad    │
│                            │  ┌──────────────────────┐  │
│                            │  │ 12:30 - Reproduciendo│  │
│                            │  │ 12:28 - Recibió      │  │
│                            │  │        contenido     │  │
│                            │  │ 12:15 - En espera    │  │
│                            │  │ 11:45 - Se conectó   │  │
│                            │  └──────────────────────┘  │
│                            │                            │
├────────────────────────────┴────────────────────────────┤
│  Playlist asignada: Loop Mañana (12 items, 4:30 min)   │
│  Próxima programación: Hoy 14:00 - "Promo Tarde"       │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades del módulo devices:**

1. **Listar dispositivos**: Carga desde Supabase `devices` donde `user_id = auth.uid()`.
2. **Filtrar**: Por status (`online`, `offline`, `idle`), por nombre (búsqueda textual).
3. **Ordenar**: Por nombre, status, `last_seen`, fecha de creación.
4. **Agregar dispositivo**: Modal con formulario (nombre, ubicación, orientación, resolución).
   - Al crear, se genera un `device_key` de 6 dígitos aleatorio único.
   - El usuario ingresa ese código en la app React Native del TV para vincularlo.
5. **Ver detalle**:
   - Muestra toda la información del dispositivo.
   - Preview en vivo: Si el dispositivo está online, muestra un iframe con una URL proxy o un canvas que simula el contenido. Si no, muestra el último screenshot o placeholder.
   - Historial de actividad: últimos 50 logs.
6. **Acciones**:
   - **Cambiar contenido**: Modal con selector de media + playlist. Al seleccionar, se actualiza `devices.current_media_id` o `devices.current_playlist_id`. El cambio se transmite vía Supabase Realtime al dispositivo.
   - **Forzar sync**: Envía un evento al canal Realtime del dispositivo (`device:{id}:control`) con comando `sync_now`. La app React Native lo recibe y refresca.
   - **Reiniciar**: Similar, comando `restart`.
   - **Configuración**: Modal con sliders (brillo, volumen, intervalo de rotación).
   - **Eliminar**: Confirmación + soft delete.
7. **Vincular dispositivo**: El código de 6 dígitos se muestra en un modal grande al crear el dispositivo. También accesible desde el detalle.
8. **Suscripción Realtime**: Cada dispositivo tiene su canal `device:{id}:status`. El módulo se suscribe para actualizar el estado en tiempo real sin refrescar.

**Preview en vivo (detalle):**
- Opción A (simple): Mostrar un `<img>` o `<video>` con la URL del `current_media_id`. Si es playlist, rotar cada N segundos con JS.
- Opción B (avanzada): Usar la misma lógica de renderizado que la app React Native pero en un `<canvas>` o `<div>` con CSS (HTML/CSS puro). Requiere parsear la plantilla y zonas.

### 5.3 `js/modules/media.js` — Biblioteca Multimedia

**Vista:** `#/media`

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Biblioteca Multimedia            [🔍 Buscar...]  [+ Subir]│
├─────────────────────────────────────────────────────────┤
│  Filtros: [Todos] [Imágenes] [Videos]                   │
│  Vista:  ▤ Grid  ▥ Lista                                │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │          │ │          │ │          │ │          │   │
│  │ [IMG]    │ │ [IMG]    │ │ [VID]    │ │ [IMG]    │   │
│  │ banner_  │ │ promo_   │ │ video_   │ │ logo_    │   │
│  │ verano   │ │ oferta   │ │ inst_1   │ │ empresa  │   │
│  │          │ │          │ │          │ │          │   │
│  │ 2.3 MB   │ │ 1.1 MB   │ │ 45 MB    │ │ 0.5 MB   │   │
│  │ JPG      │ │ PNG      │ │ MP4 30s  │ │ SVG      │   │
│  │ [···]    │ │ [···]    │ │ [···]    │ │ [···]    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ... más archivos ...                                   │
│                                                         │
│  Página: ◀ 1 2 3 ... 8 ▶  (42 items)                  │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**

1. **Carga de archivos**: Query a `media` con paginación (20 por página).
2. **Filtrado**: Por tipo (`image`, `video`), por tags.
3. **Búsqueda**: Por nombre con debounce (300ms).
4. **Vista grid/lista**: Alternar con botón. Grid muestra thumbnail, nombre, tipo, tamaño. Lista muestra filas con más detalles.
5. **Subida de archivos** (`#/media/upload` o modal):
   - Drag & drop zone o file input.
   - Soporte: JPG, PNG, GIF, WebP, SVG, MP4, WebM, MOV.
   - Límite de tamaño por archivo: 50 MB (configurable por plan).
   - Validación cliente: tipo MIME, tamaño, dimensiones (para imágenes).
   - Barra de progreso de subida (Supabase Storage devuelve progreso).
   - Al completar: crear registro en tabla `media` con URL pública, thumbnail, metadatos.
   - Subida múltiple: cola con hasta 10 archivos simultáneos.
6. **Generación de thumbnails**: Para imágenes > 500 KB, redimensionar a 400px de ancho con `<canvas>` antes de subir (opcional, en Web Worker).
7. **Acciones por archivo** (menú contextual o botón `[···]`):
   - **Previsualizar**: Abrir modal con visor de imagen/video.
   - **Renombrar**: Editar `name`.
   - **Editar tags**: Modal con input de tags.
   - **Descargar**: Link directo al archivo.
   - **Copiar enlace**: Al portapapeles.
   - **Añadir a playlist**: Modal rápido para seleccionar playlist existente o crear nueva.
   - **Eliminar**: Confirmación. Borra de Storage y de tabla `media`.
8. **Selección múltiple** (checkboxes): Para borrado masivo o añadir a playlist.
9. **Información detallada**: Modal con metadata completa (dimensiones, duración, codec, fecha, tamaño, uso en playlists).

**Procesamiento de imágenes (Web Worker opcional):**
```javascript
// js/workers/image-processor.js
self.onmessage = async (e) => {
    const { file, maxWidth } = e.data;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = new OffscreenCanvas(bitmap.width * scale, bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
    self.postMessage({ blob, originalName: file.name });
};
```

### 5.4 `js/modules/playlists.js` — Gestión de Playlists

**Vista lista:** `#/playlists`

**Vista editor:** `#/playlists/:id`

**Layout editor:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Volver    Editor de Playlist: "Loop Mañana"          │
├────────────────────────────┬────────────────────────────┤
│                            │                            │
│  Configuración             │  Items (4)       [+ Agregar]│
│  ┌──────────────────────┐  │  ┌──────────────────────┐  │
│  │ Nombre: Loop Mañana  │  │  │ ≡ 🖼 banner_verano   │  │
│  │ Descripción:         │  │  │    10 segundos   [×] │  │
│  │ Contenido matutino.. │  │  ├──────────────────────┤  │
│  │                      │  │  │ ≡ 🖼 promo_oferta    │  │
│  │ Reproducción:        │  │  │    8 segundos    [×] │  │
│  │ [✔] Repetir en bucle │  │  ├──────────────────────┤  │
│  │                      │  │  │ ≡ 🎬 video_inst_1    │  │
│  │ Transición:          │  │  │    30 segundos   [×] │  │
│  │ ○ Ninguna            │  │  ├──────────────────────┤  │
│  │ ● Fundido (Fade)     │  │  │ ≡ 🖼 logo_empresa    │  │
│  │ ○ Deslizar (Slide)   │  │  │    5 segundos    [×] │  │
│  │ ○ Zoom               │  │  └──────────────────────┘  │
│  │                      │  │                            │
│  │ [Guardar cambios]    │  │  Duración total: 53 seg    │
│  │ [Vista previa]       │  │                            │
│  └──────────────────────┘  │  [Ordenar items arrastrando]│
│                            │                            │
│  Previsualización          │                            │
│  ┌──────────────────────┐  │                            │
│  │                      │  │                            │
│  │  [Preview de la      │  │                            │
│  │   playlist completa  │  │                            │
│  │   con transiciones]  │  │                            │
│  │                      │  │                            │
│  │   00:12 / 00:53      │  │                            │
│  │   ▶ ⏸ ⏭             │  │                            │
│  └──────────────────────┘  │                            │
│                            │                            │
├────────────────────────────┴────────────────────────────┤
│  Asignado a: TV Entrada, TV Recepción                   │
│  Usado en programación: "Mañanas L-V"                   │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades del módulo playlists:**

1. **Listar playlists**: Carga desde `playlists` con conteo de items y duración total.
2. **Crear playlist**: Modal con nombre, descripción. Items vacíos inicialmente.
3. **Editar playlist**:
   - **Agregar items**: Botón que abre modal con grid de `media` (filtrable, con búsqueda). Selección múltiple. Al agregar, se añaden al array `items` en `playlists`.
   - **Reordenar**: Drag & drop con `SortableJS`. Al soltar, se actualiza `order` de cada item.
   - **Duración por item**: Input number al lado de cada item (segundos). Default: 10s para imágenes, duración real para videos.
   - **Eliminar item**: Botón [×] con confirmación.
   - **Configuración general**: Nombre, descripción, loop (bool), transición (select).
   - **Guardar**: Debounce de 2 segundos (auto-save) + botón manual. Se actualiza `playlists.items` (jsonb) y `playlists.updated_at`.
4. **Vista previa**:
   - Player HTML5 que recorre los items automáticamente con las duraciones configuradas.
   - Controles: play, pause, siguiente, anterior.
   - Barra de progreso total y por item.
   - Aplica transición CSS según lo configurado (fade, slide).
5. **Asignar a dispositivo**: Desde el editor de playlist, botón "Asignar a dispositivo(s)" que abre modal con checkboxes de dispositivos del usuario. Al confirmar, actualiza `devices.current_playlist_id` para los seleccionados.
6. **Duplicar playlist**: Copia con "(copia)" en el nombre.
7. **Eliminar**: Confirmación. Verifica si está asignada a algún dispositivo activo y advierte.

**Previsualizador de playlist (componente):**
```javascript
class PlaylistPreviewer {
    constructor(container, items, options = {}) {
        this.container = container;
        this.items = items;
        this.transition = options.transition || 'fade';
        this.currentIndex = 0;
        this.timeout = null;
        this.isPlaying = false;
    }

    async render() {
        // Crear estructura: div con img/video + controles
        this.container.innerHTML = `
            <div class="playlist-preview">
                <div class="playlist-preview__stage">
                    <div class="playlist-preview__content" id="preview-content"></div>
                </div>
                <div class="playlist-preview__controls">
                    <button class="btn-icon" id="preview-prev">⏮</button>
                    <button class="btn-icon" id="preview-play">▶</button>
                    <button class="btn-icon" id="preview-next">⏭</button>
                    <span class="playlist-preview__time">00:00 / ${this.formatTotal()}</span>
                    <div class="playlist-preview__progress">
                        <div class="playlist-preview__progress-bar"></div>
                    </div>
                </div>
            </div>
        `;
        this.bindControls();
    }

    play() { /* Mostrar item actual, iniciar timer */ }
    pause() { /* Pausar timer */ }
    next() { /* Avanzar al siguiente con transición */ }
    prev() { /* Retroceder */ }

    showItem(index) {
        const item = this.items[index];
        const mediaEl = item.type === 'video'
            ? `<video src="${item.url}" autoplay muted></video>`
            : `<img src="${item.url}" alt="${item.name}">`;
        const content = document.getElementById('preview-content');
        content.style.transition = this.getTransitionCSS();
        content.innerHTML = mediaEl;
        // Trigger reflow, add class for transition
        content.classList.add('active');
    }

    getTransitionCSS() {
        switch (this.transition) {
            case 'fade': return 'opacity 0.5s ease';
            case 'slide': return 'transform 0.5s ease';
            default: return 'none';
        }
    }

    formatTotal() {
        const totalSec = this.items.reduce((sum, i) => sum + (i.duration || 10), 0);
        return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;
    }
}
```

### 5.5 `js/modules/schedules.js` — Programaciones

**Vista lista:** `#/schedules`

**Vista editor:** `#/schedules/:id`

**Layout editor:**
```
┌─────────────────────────────────────────────────────────┐
│  ← Volver    Programación: "Promociones Fin de Semana"   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │ Datos Generales      │  │ Dispositivos             │ │
│  │ Nombre: Promo Fin...│  │ ☑ TV Entrada             │ │
│  │ Playlist: [Selecc...]│  │ ☑ TV Recepción           │ │
│  │ Prioridad: [Media ▼] │  │ ☐ TV Cafetería           │ │
│  │ [✔] Activado         │  │ ☑ TV Sala Juntas         │ │
│  └──────────────────────┘  └──────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Rango de Fechas                                   │   │
│  │ Desde: [2026-06-01] Hasta: [2026-08-31]          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Días y Horarios                                   │   │
│  │ ☑ L  ☑ M  ☑ X  ☑ J  ☑ V  ☐ S  ☐ D           │   │
│  │ Hora inicio: [08:00]  Hora fin: [12:00]          │   │
│  │                                                    │   │
│  │ + Agregar otro bloque horario                      │   │
│  │ Bloque 2: ☐ L ☐ M ☐ X ☐ J ☐ V ☑ S ☑ D        │   │
│  │ Hora inicio: [16:00]  Hora fin: [20:00]  [×]      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  [Guardar]  [Cancelar]                                 │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades del módulo schedules:**

1. **Listar programaciones**: Carga desde `schedules` con datos expandidos (nombres de playlists y dispositivos).
2. **Crear programación**:
   - Formulario con: nombre, selector de playlist (dropdown con búsqueda), selector de dispositivos (checkboxes en modal), rango de fechas (date inputs), días de la semana (checkboxes L-V-S-D), hora inicio/fin.
   - Múltiples bloques horarios (para programar mañana y tarde en la misma programación). Para simplificar, se guarda un registro por cada bloque o se usa array en jsonb de configuración.
   - Prioridad numérica (para resolver conflictos cuando 2 programaciones aplican al mismo tiempo).
   - Toggle activado/desactivado.
3. **Editar**: Mismo formulario, cargado con datos existentes.
4. **Vista de calendario**: (Opcional) Visualización tipo calendario semanal/mensual donde se muestran bloques de tiempo asignados a cada dispositivo. Colores por playlist.
5. **Conflictos**: Al guardar, verificar si hay solapamiento de horarios en los mismos dispositivos. Mostrar advertencia si hay conflicto (pero permitir guardar si tienen distinta prioridad).
6. **Eliminar**: Confirmación.

**Lógica de resolución de conflictos (para la app React Native):**
```sql
-- La app consulta: "¿Qué playlist debo reproducir ahora?"
SELECT s.playlist_id, s.priority
FROM schedules s
WHERE s.device_id = $device_id
  AND s.is_active = true
  AND s.start_date <= now()
  AND s.end_date >= now()
  AND EXTRACT(DOW FROM now()) = ANY(s.days_of_week)
  AND now()::time BETWEEN s.start_time AND s.end_time
ORDER BY s.priority DESC
LIMIT 1;
```

### 5.6 `js/modules/templates.js` — Plantillas de Layout

**Vista lista:** `#/templates`

**Vista editor:** `#/templates/:id`

**Layout editor (concepto simplificado):**
```
┌─────────────────────────────────────────────────────────┐
│  ← Volver    Editor de Plantilla: "Layout Corporativo"   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │                    ZONA 4 (Ticker)                │   │
│  ├──────────────────┬───────────────────────────────┤   │
│  │                  │                               │   │
│  │                  │       ZONA 2 (Reloj)          │   │
│  │    ZONA 1        │                               │   │
│  │   (Media)        ├───────────────────────────────┤   │
│  │                  │                               │   │
│  │   Principal      │       ZONA 3 (Clima)          │   │
│  │                  │                               │   │
│  └──────────────────┴───────────────────────────────┘   │
│                                                         │
│  Zonas actuales:                                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Zona 1: Media Principal | 50% x 80%              │   │
│  │ Zona 2: Reloj Digital  | 50% x 30%              │   │
│  │ Zona 3: Clima         | 50% x 30%              │   │
│  │ Zona 4: Ticker Texto  | 100% x 10%             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  [+ Agregar Zona]   [Guardar]   [Previsualizar]        │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades del módulo templates:**

1. **Listar plantillas**: Carga de `templates`. Muestra thumbnail, nombre, descripción, cantidad de zonas. Diferencia visual entre plantillas del sistema y del usuario.
2. **Crear plantilla**: Nombre, descripción, resolución base de referencia.
3. **Editor de zonas**:
   - Canvas visual que representa la pantalla (escalado).
   - Las zonas son rectángulos arrastrables y redimensionables con handles.
   - Cada zona tiene propiedades: tipo (`media`, `clock`, `weather`, `ticker`, `rss`, `qr`, `html-widget`), posición (x, y en %), tamaño (width, height en %), z-index.
   - Panel lateral con propiedades de la zona seleccionada.
   - Snap-to-grid (opcional con toggle) para alineación precisa.
4. **Tipos de zona y sus configuraciones**:
   - `media`: Muestra imágenes/videos. Config: ajuste (`cover`, `contain`, `fill`, `stretch`), border-radius.
   - `clock`: Reloj digital o analógico. Config: formato (24h/12h), mostrar segundos, color de texto, fuente.
   - `weather`: Clima (requiere API key). Config: ciudad, unidad (°C/°F), mostrar icono.
   - `ticker`: Texto deslizante. Config: texto, velocidad, dirección, color, fuente.
   - `rss`: Feed de noticias. Config: URL del feed, velocidad de rotación, cantidad de items.
   - `qr`: Código QR dinámico. Config: URL o texto, tamaño, color.
   - `html-widget`: iframe o HTML embebido. Config: URL o código HTML, refresh interval.
5. **Guardar**: Serializa las zonas a jsonb y actualiza `templates.zones`.
6. **Aplicar plantilla a dispositivo** (futuro): Asignar `template_id` en `devices`.

### 5.7 `js/modules/realtime.js` — Comunicación en Tiempo Real

**Arquitectura de canales Supabase Realtime:**

```
Canal global "realtime:all"
├── Evento: device_status_changed
│   payload: { device_id, status, timestamp }
│   → Actualiza Store.state.devices
│
├── Evento: media_uploaded
│   payload: { media_id, name, url }
│   → Actualiza Store.state.mediaItems, muestra toast
│
└── Evento: playlist_assigned
    payload: { device_id, playlist_id, playlist_name }
    → Actualiza Store.state.devices, muestra toast

Canales por dispositivo "device:{id}:status"
├── Evento: heartbeat (cada 30s)
│   → Actualiza last_seen del dispositivo en Store
│
├── Evento: screenshot
│   payload: { image_url } (base64 o URL de Storage)
│   → Actualiza preview en página de detalle
│
└── Evento: log
    payload: { event_type, event_data }
    → Agrega entrada al historial
```

**Implementación de `js/modules/realtime.js`:**

```javascript
import { getSupabase } from '../supabase.js';

let channels = [];

export function initRealtime(store) {
    const supabase = getSupabase();
    const userId = store.state.user?.id;
    if (!userId) return;

    // Canal 1: Eventos globales del usuario
    const globalChannel = supabase
        .channel(`user:${userId}:global`)
        .on('broadcast', { event: 'device_status_changed' }, (payload) => {
            const { device_id, status, last_seen } = payload.payload;
            const devices = store.state.devices.map(d =>
                d.id === device_id ? { ...d, status, last_seen } : d
            );
            store.setState({ devices });
            // También actualizar contadores
            const online = devices.filter(d => d.status === 'online').length;
            const offline = devices.filter(d => d.status === 'offline').length;
            store.setState({ devicesOnline: online, devicesOffline: offline });
        })
        .on('broadcast', { event: 'media_uploaded' }, (payload) => {
            const { media } = payload.payload;
            const mediaItems = [media, ...store.state.mediaItems];
            store.setState({ mediaItems });
            showToast('Archivo subido exitosamente', 'success');
        })
        .on('broadcast', { event: 'playlist_assigned' }, (payload) => {
            const { device_id, playlist_name } = payload.payload;
            const devices = store.state.devices.map(d =>
                d.id === device_id ? { ...d, current_playlist_name: playlist_name } : d
            );
            store.setState({ devices });
            showToast(`Playlist "${playlist_name}" asignada al dispositivo`, 'info');
        })
        .subscribe();

    channels.push(globalChannel);

    // Canal 2: Suscripciones a cambios en BD (Postgres Changes)
    const dbChannel = supabase
        .channel(`user:${userId}:db-changes`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'devices', filter: `user_id=eq.${userId}` },
            (payload) => {
                console.log('Device change:', payload);
                // Refrescar lista de dispositivos
                // O actualizar item específico en Store
            }
        )
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'media', filter: `user_id=eq.${userId}` },
            (payload) => {
                const newMedia = payload.new;
                store.setState({ mediaItems: [newMedia, ...store.state.mediaItems] });
            }
        )
        .subscribe();

    channels.push(dbChannel);
}

export function subscribeToDevice(deviceId, callback) {
    const supabase = getSupabase();
    const channel = supabase
        .channel(`device:${deviceId}:status`)
        .on('broadcast', { event: 'heartbeat' }, (payload) => {
            callback({ type: 'heartbeat', data: payload.payload });
        })
        .on('broadcast', { event: 'screenshot' }, (payload) => {
            callback({ type: 'screenshot', data: payload.payload });
        })
        .on('broadcast', { event: 'log' }, (payload) => {
            callback({ type: 'log', data: payload.payload });
        })
        .subscribe();

    channels.push(channel);
    return () => {
        supabase.removeChannel(channel);
        channels = channels.filter(c => c !== channel);
    };
}

export function sendDeviceCommand(deviceId, command, params = {}) {
    const supabase = getSupabase();
    return supabase.channel(`device:${deviceId}:control`).send({
        type: 'broadcast',
        event: 'command',
        payload: { command, ...params, timestamp: new Date().toISOString() }
    });
}

export function cleanupChannels() {
    const supabase = getSupabase();
    channels.forEach(ch => supabase.removeChannel(ch));
    channels = [];
}
```

### 5.8 `js/modules/notifications.js` — Sistema de Toast

**Tipos de notificación:**
- `success`: Verde, icono check. Auto-dismiss 5s.
- `error`: Rojo, icono X. Auto-dismiss 10s o manual.
- `warning`: Amarillo, icono ⚠. Auto-dismiss 7s.
- `info`: Azul, icono ℹ. Auto-dismiss 5s.
- `loading`: Con spinner, persistente hasta llamar `dismiss()`.

**Implementación:**
```javascript
const toastContainer = document.getElementById('toast-container');

export function showToast(message, type = 'info', duration = 5000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.id = id;
    toast.innerHTML = `
        <span class="toast__icon">${getIcon(type)}</span>
        <span class="toast__message">${message}</span>
        <button class="toast__close" onclick="this.parentElement.remove()">×</button>
        ${duration > 0 ? '<div class="toast__progress"><div class="toast__progress-bar"></div></div>' : ''}
    `;

    toastContainer.appendChild(toast);

    // Animación de entrada
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    if (duration > 0) {
        setTimeout(() => dismissToast(id), duration);
    }

    return { id, dismiss: () => dismissToast(id) };
}

function dismissToast(id) {
    const toast = document.getElementById(id);
    if (!toast) return;
    toast.classList.remove('toast--visible');
    toast.classList.add('toast--hiding');
    setTimeout(() => toast.remove(), 300);
}

function getIcon(type) {
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    return icons[type] || 'ℹ';
}
```

### 5.9 `js/modules/preview.js` — Sistema de Previsualización

**Propósito:** Renderizar en el panel web una aproximación de lo que se ve en el televisor.

**Métodos de preview:**

1. **Preview de media individual**: `<img>` o `<video>` en un contenedor con las proporciones correctas.
2. **Preview de playlist**: Rotación automática con timer y transiciones CSS.
3. **Preview de plantilla**: Contenedor con zonas posicionadas absolutamente según porcentajes. Cada zona renderiza su tipo de widget.
4. **Preview en vivo del dispositivo**: 
   - Si el dispositivo soporta screenshots (la app React Native captura y sube a Storage cada N segundos o bajo demanda), se muestra la última captura.
   - Si no, se simula renderizando el contenido actual asignado.

**Renderizado de plantilla (preview de zonas):**
```javascript
export function renderTemplatePreview(container, template, mediaAssignments = {}) {
    const { zones, resolution } = template;
    const [resW, resH] = (resolution || '1920x1080').split('x').map(Number);

    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.aspectRatio = `${resW} / ${resH}`;
    container.style.overflow = 'hidden';
    container.style.background = '#000';

    for (const zone of zones) {
        const el = document.createElement('div');
        el.className = `preview-zone preview-zone--${zone.type}`;
        el.style.cssText = `
            position: absolute;
            left: ${zone.x}%;
            top: ${zone.y}%;
            width: ${zone.width}%;
            height: ${zone.height}%;
            z-index: ${zone.z_index || 1};
            overflow: hidden;
        `;

        // Renderizar contenido según tipo
        switch (zone.type) {
            case 'media':
                const mediaId = mediaAssignments[zone.id];
                if (mediaId) {
                    const media = getMediaById(mediaId); // del store
                    if (media) {
                        el.innerHTML = media.type === 'video'
                            ? `<video src="${media.url}" autoplay muted loop style="width:100%;height:100%;object-fit:${zone.object_fit || 'cover'}"></video>`
                            : `<img src="${media.url}" alt="${media.name}" style="width:100%;height:100%;object-fit:${zone.object_fit || 'cover'}">`;
                    }
                } else {
                    el.innerHTML = `<div class="preview-zone--empty">Sin contenido</div>`;
                }
                break;
            case 'clock':
                el.innerHTML = `<div class="preview-clock">${formatTime(new Date())}</div>`;
                // Actualizar cada segundo
                break;
            case 'weather':
                el.innerHTML = `<div class="preview-weather">🌤 22°C</div>`;
                break;
            case 'ticker':
                el.innerHTML = `<div class="preview-ticker"><span>${zone.text || 'Texto de ejemplo'}</span></div>`;
                break;
        }

        container.appendChild(el);
    }
}
```

---

## 6. SISTEMA DE DISEÑO Y CSS

### 6.1 `css/main.css` — Variables y Reset

```css
/* === RESET === */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    line-height: 1.6;
    min-height: 100vh;
}

/* === CUSTOM PROPERTIES (Diseño atómico) === */
:root {
    /* Paleta principal */
    --color-primary-50: #eff6ff;
    --color-primary-100: #dbeafe;
    --color-primary-200: #bfdbfe;
    --color-primary-300: #93c5fd;
    --color-primary-400: #60a5fa;
    --color-primary-500: #3b82f6;
    --color-primary-600: #2563eb;
    --color-primary-700: #1d4ed8;
    --color-primary-800: #1e40af;
    --color-primary-900: #1e3a8a;

    /* Semánticos */
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    --color-info: #3b82f6;

    /* Neutros */
    --color-gray-50: #f9fafb;
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-800: #1f2937;
    --color-gray-900: #111827;

    /* Tema claro (default) */
    --color-bg-primary: #ffffff;
    --color-bg-secondary: #f9fafb;
    --color-bg-tertiary: #f3f4f6;
    --color-bg-card: #ffffff;
    --color-bg-sidebar: #1f2937;
    --color-bg-modal-overlay: rgba(0, 0, 0, 0.5);

    --color-text-primary: #111827;
    --color-text-secondary: #4b5563;
    --color-text-tertiary: #9ca3af;
    --color-text-inverse: #ffffff;
    --color-text-link: #2563eb;

    --color-border-primary: #e5e7eb;
    --color-border-secondary: #d1d5db;
    --color-border-focus: #3b82f6;

    /* Sombras */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);

    /* Bordes */
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --radius-xl: 16px;
    --radius-full: 9999px;

    /* Espaciado */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-10: 40px;
    --space-12: 48px;
    --space-16: 64px;

    /* Tipografía */
    --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-family-mono: 'JetBrains Mono', 'Fira Code', monospace;
    --font-size-xs: 0.75rem;    /* 12px */
    --font-size-sm: 0.875rem;   /* 14px */
    --font-size-base: 1rem;     /* 16px */
    --font-size-lg: 1.125rem;   /* 18px */
    --font-size-xl: 1.25rem;    /* 20px */
    --font-size-2xl: 1.5rem;    /* 24px */
    --font-size-3xl: 1.875rem;  /* 30px */
    --font-size-4xl: 2.25rem;   /* 36px */

    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    /* Transiciones */
    --transition-fast: 150ms ease;
    --transition-base: 250ms ease;
    --transition-slow: 350ms ease;

    /* Layout */
    --sidebar-width: 260px;
    --sidebar-collapsed-width: 72px;
    --header-height: 64px;
    --content-max-width: 1400px;
}

/* === TEMA OSCURO === */
[data-theme="dark"] {
    --color-bg-primary: #111827;
    --color-bg-secondary: #1f2937;
    --color-bg-tertiary: #374151;
    --color-bg-card: #1f2937;
    --color-bg-sidebar: #0f172a;

    --color-text-primary: #f9fafb;
    --color-text-secondary: #d1d5db;
    --color-text-tertiary: #6b7280;

    --color-border-primary: #374151;
    --color-border-secondary: #4b5563;

    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
}

/* === UTILIDADES === */
.sr-only { /* Screen reader only */
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@font-face {
    font-family: 'Inter';
    src: url('../assets/fonts/inter-regular.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}
@font-face {
    font-family: 'Inter';
    src: url('../assets/fonts/inter-medium.woff2') format('woff2');
    font-weight: 500;
    font-style: normal;
    font-display: swap;
}
@font-face {
    font-family: 'Inter';
    src: url('../assets/fonts/inter-bold.woff2') format('woff2');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
}
@font-face {
    font-family: 'JetBrains Mono';
    src: url('../assets/fonts/jetbrains-mono.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
}
```

### 6.2 `css/grid.css` — Sistema de Grid

```css
/* Grid de 12 columnas */
.row {
    display: flex;
    flex-wrap: wrap;
    margin-left: calc(var(--space-4) * -1);
    margin-right: calc(var(--space-4) * -1);
}

[class*="col-"] {
    padding-left: var(--space-4);
    padding-right: var(--space-4);
    flex: 0 0 auto;
}

.col-1  { width: 8.333%; }
.col-2  { width: 16.667%; }
.col-3  { width: 25%; }
.col-4  { width: 33.333%; }
.col-5  { width: 41.667%; }
.col-6  { width: 50%; }
.col-7  { width: 58.333%; }
.col-8  { width: 66.667%; }
.col-9  { width: 75%; }
.col-10 { width: 83.333%; }
.col-11 { width: 91.667%; }
.col-12 { width: 100%; }

/* Responsive: tablet */
@media (max-width: 1024px) {
    .col-md-1  { width: 8.333%; }
    .col-md-2  { width: 16.667%; }
    .col-md-3  { width: 25%; }
    .col-md-4  { width: 33.333%; }
    .col-md-6  { width: 50%; }
    .col-md-12 { width: 100%; }
}

/* Responsive: mobile */
@media (max-width: 768px) {
    .col-sm-6  { width: 50%; }
    .col-sm-12 { width: 100%; }
}

/* Grid CSS nativo para layouts más complejos */
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.grid-cols-auto-fill {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}
.gap-4 { gap: var(--space-4); }
.gap-6 { gap: var(--space-6); }
```

### 6.3 `css/components.css` — Componentes Reutilizables

```css
/* === BOTONES === */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: 1.5;
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
    text-decoration: none;
    user-select: none;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn--primary {
    background-color: var(--color-primary-600);
    color: white;
}
.btn--primary:hover:not(:disabled) {
    background-color: var(--color-primary-700);
}

.btn--secondary {
    background-color: var(--color-bg-secondary);
    color: var(--color-text-primary);
    border-color: var(--color-border-primary);
}
.btn--secondary:hover:not(:disabled) {
    background-color: var(--color-bg-tertiary);
}

.btn--danger {
    background-color: var(--color-error);
    color: white;
}
.btn--danger:hover:not(:disabled) {
    background-color: #dc2626;
}

.btn--ghost {
    background: transparent;
    color: var(--color-text-secondary);
}
.btn--ghost:hover:not(:disabled) {
    background-color: var(--color-bg-tertiary);
    color: var(--color-text-primary);
}

.btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-xs); }
.btn--lg { padding: var(--space-3) var(--space-6); font-size: var(--font-size-base); }

.btn--icon {
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: var(--radius-full);
}

/* === INPUTS === */
.form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-4);
}

.form-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
}

.form-input,
.form-select,
.form-textarea {
    padding: var(--space-2) var(--space-3);
    font-family: var(--font-family-sans);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    background-color: var(--color-bg-primary);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-md);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    outline: none;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
    border-color: var(--color-primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input--error {
    border-color: var(--color-error);
}

.form-error {
    font-size: var(--font-size-xs);
    color: var(--color-error);
}

.form-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-tertiary);
}

/* Search input */
.search-input-wrapper {
    position: relative;
}
.search-input-wrapper .form-input {
    padding-left: 36px;
}
.search-input-wrapper::before {
    content: "🔍";
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--font-size-sm);
    pointer-events: none;
}

/* === CARDS === */
.card {
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--transition-fast);
}
.card:hover {
    box-shadow: var(--shadow-md);
}
.card--clickable {
    cursor: pointer;
}
.card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
}
.card__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
}
.card__body { }
.card__footer {
    margin-top: var(--space-4);
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border-primary);
}

/* === STAT CARDS === */
.stat-card {
    text-align: center;
}
.stat-card__value {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary-600);
}
.stat-card__label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-top: var(--space-1);
}

/* === BADGES === */
.badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    border-radius: var(--radius-full);
    white-space: nowrap;
}
.badge--success { background-color: #dcfce7; color: #166534; }
.badge--warning { background-color: #fef3c7; color: #92400e; }
.badge--error   { background-color: #fee2e2; color: #991b1b; }
.badge--info    { background-color: #dbeafe; color: #1e40af; }
.badge--neutral { background-color: var(--color-bg-tertiary); color: var(--color-text-secondary); }

/* Status dot */
.status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
}
.status-dot--online  { background-color: var(--color-success); }
.status-dot--offline { background-color: var(--color-error); }
.status-dot--idle    { background-color: var(--color-warning); }

/* === MODAL === */
.modal-overlay {
    position: fixed;
    inset: 0;
    background-color: var(--color-bg-modal-overlay);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--transition-base), visibility var(--transition-base);
}
.modal-overlay--open {
    opacity: 1;
    visibility: visible;
}
.modal {
    background-color: var(--color-bg-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    width: 90%;
    max-width: 560px;
    max-height: 85vh;
    overflow-y: auto;
    transform: scale(0.95) translateY(10px);
    transition: transform var(--transition-base);
}
.modal-overlay--open .modal {
    transform: scale(1) translateY(0);
}
.modal--sm { max-width: 400px; }
.modal--lg { max-width: 800px; }
.modal--xl { max-width: 1100px; }
.modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid var(--color-border-primary);
}
.modal__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
}
.modal__close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-text-tertiary);
    padding: 4px;
    line-height: 1;
}
.modal__body {
    padding: var(--space-6);
}
.modal__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--color-border-primary);
}

/* === TABS === */
.tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border-primary);
    margin-bottom: var(--space-6);
}
.tab {
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all var(--transition-fast);
}
.tab:hover { color: var(--color-text-primary); }
.tab--active {
    color: var(--color-primary-600);
    border-bottom-color: var(--color-primary-600);
}

/* === SPINNER === */
.spinner {
    width: 24px;
    height: 24px;
    border: 3px solid var(--color-border-primary);
    border-top-color: var(--color-primary-600);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}
.spinner--lg { width: 40px; height: 40px; border-width: 4px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* === TOOLTIP === */
[data-tooltip] {
    position: relative;
}
[data-tooltip]::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    font-size: var(--font-size-xs);
    color: white;
    background-color: var(--color-gray-800);
    border-radius: var(--radius-sm);
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--transition-fast);
    pointer-events: none;
    z-index: 100;
}
[data-tooltip]:hover::after {
    opacity: 1;
    visibility: visible;
}

/* === DROPDOWN / MENU === */
.dropdown {
    position: relative;
    display: inline-block;
}
.dropdown__menu {
    position: absolute;
    right: 0;
    top: calc(100% + 4px);
    min-width: 180px;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 50;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-4px);
    transition: all var(--transition-fast);
}
.dropdown--open .dropdown__menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
}
.dropdown__item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
}
.dropdown__item:hover {
    background-color: var(--color-bg-secondary);
}
.dropdown__item--danger { color: var(--color-error); }
.dropdown__divider {
    height: 1px;
    background-color: var(--color-border-primary);
    margin: 4px 0;
}

/* === EMPTY STATE === */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-16) var(--space-8);
    text-align: center;
}
.empty-state__icon {
    font-size: 3rem;
    margin-bottom: var(--space-4);
    opacity: 0.5;
}
.empty-state__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--space-2);
}
.empty-state__description {
    color: var(--color-text-secondary);
    margin-bottom: var(--space-6);
    max-width: 400px;
}
```

### 6.4 `css/notifications.css` — Toast

```css
.toast-container {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    z-index: 2000;
    display: flex;
    flex-direction: column-reverse;
    gap: var(--space-3);
    max-width: 400px;
}

.toast {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border-primary);
    border-left: 4px solid var(--color-gray-400);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    transform: translateX(120%);
    transition: transform var(--transition-base);
    position: relative;
    overflow: hidden;
}

.toast--visible {
    transform: translateX(0);
}
.toast--hiding {
    transform: translateX(120%);
}

.toast--success { border-left-color: var(--color-success); }
.toast--error   { border-left-color: var(--color-error); }
.toast--warning { border-left-color: var(--color-warning); }
.toast--info    { border-left-color: var(--color-info); }

.toast__icon {
    font-size: 1.2rem;
    flex-shrink: 0;
}
.toast__message {
    flex: 1;
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
}
.toast__close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--color-text-tertiary);
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
}

.toast__progress {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background-color: var(--color-border-primary);
}
.toast__progress-bar {
    height: 100%;
    background-color: var(--color-primary-500);
    animation: toast-progress linear forwards;
}
.toast--success .toast__progress-bar { background-color: var(--color-success); }
@keyframes toast-progress {
    from { width: 100%; }
    to   { width: 0%; }
}
```

### 6.5 Layout Principal (App Shell)

```css
/* === APP SHELL LAYOUT === */
.app-shell {
    display: flex;
    min-height: 100vh;
}

/* === SIDEBAR === */
.sidebar {
    width: var(--sidebar-width);
    background-color: var(--color-bg-sidebar);
    color: var(--color-text-inverse);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    transition: width var(--transition-base);
    overflow-x: hidden;
}

.sidebar--collapsed {
    width: var(--sidebar-collapsed-width);
}

.sidebar__logo {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-5) var(--space-4);
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.sidebar__logo img {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
}

.sidebar__logo-text {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
    overflow: hidden;
}

.sidebar--collapsed .sidebar__logo-text {
    display: none;
}

.sidebar__nav {
    flex: 1;
    padding: var(--space-3);
    overflow-y: auto;
}

.sidebar__section-title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.4);
    padding: var(--space-4) var(--space-2) var(--space-2);
    white-space: nowrap;
    overflow: hidden;
}

.sidebar--collapsed .sidebar__section-title {
    display: none;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all var(--transition-fast);
    white-space: nowrap;
    overflow: hidden;
    cursor: pointer;
}

.nav-item:hover {
    background-color: rgba(255,255,255,0.1);
    color: white;
}

.nav-item--active {
    background-color: var(--color-primary-600);
    color: white;
}

.nav-item__icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    opacity: 0.8;
}

.nav-item__text {
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar--collapsed .nav-item__text,
.sidebar--collapsed .nav-item__badge {
    display: none;
}

.nav-item__badge {
    margin-left: auto;
    background-color: var(--color-error);
    color: white;
    font-size: 10px;
    padding: 1px 6px;
    border-radius: var(--radius-full);
}

.sidebar__footer {
    padding: var(--space-3);
    border-top: 1px solid rgba(255,255,255,0.1);
}

/* === MAIN CONTENT === */
.main-content {
    flex: 1;
    margin-left: var(--sidebar-width);
    transition: margin-left var(--transition-base);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.sidebar--collapsed ~ .main-content {
    margin-left: var(--sidebar-collapsed-width);
}

/* === HEADER === */
.header {
    height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--space-6);
    background-color: var(--color-bg-card);
    border-bottom: 1px solid var(--color-border-primary);
    position: sticky;
    top: 0;
    z-index: 50;
}

.header__left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
}

.header__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
}

.header__right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.header__user-menu {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
}

.header__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    background-color: var(--color-bg-tertiary);
}

/* === PAGE CONTENT === */
.page-content {
    flex: 1;
    padding: var(--space-6);
    max-width: var(--content-max-width);
    width: 100%;
    margin: 0 auto;
}

.page-content--fluid {
    max-width: none;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
    flex-wrap: wrap;
    gap: var(--space-4);
}

.page-title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
}

.page-actions {
    display: flex;
    gap: var(--space-3);
}

/* === TOOLBAR (filtros, búsqueda, acciones) === */
.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-6);
    gap: var(--space-4);
    flex-wrap: wrap;
}

.toolbar__left {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.toolbar__right {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

/* === RESPONSIVE === */
@media (max-width: 1024px) {
    .sidebar {
        transform: translateX(-100%);
    }
    .sidebar--mobile-open {
        transform: translateX(0);
    }
    .main-content {
        margin-left: 0;
    }
    .header {
        padding: 0 var(--space-4);
    }
}

@media (max-width: 768px) {
    .page-content {
        padding: var(--space-4);
    }
    .page-header {
        flex-direction: column;
        align-items: flex-start;
    }
    .toolbar {
        flex-direction: column;
        align-items: stretch;
    }
    .toolbar__left,
    .toolbar__right {
        flex-wrap: wrap;
    }
}
```

---

## 7. FLUJOS DE USUARIO COMPLETOS

### 7.1 Flujo de Registro y Primer Inicio

```
1. Usuario visita la URL → #/login
2. Click en "Crear cuenta" → #/register
3. Formulario: email, contraseña, confirmar contraseña, nombre completo, nombre de empresa
4. Click "Registrarse"
   → Validación de campos (formato email, contraseña >= 8 chars, coincidencia)
   → Llamada a supabase.auth.signUp({ email, password, options: { data: { full_name, company_name } } })
   → Trigger SQL crea perfil en profiles
   → Se envía email de confirmación (configurado en Supabase)
5. Redirigir a #/login con mensaje: "Revisa tu email para confirmar la cuenta"
6. Usuario confirma email → click en link → redirigido de vuelta al panel
7. Login exitoso → #/dashboard

Estado inicial del dashboard (sin dispositivos):
┌─────────────────────────────────────────────┐
│  ¡Bienvenido a Cartelera Digital!           │
│                                              │
│  Comienza configurando tu primer dispositivo │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  1. Agrega un dispositivo            │   │
│  │     Crea un dispositivo y obtén un   │   │
│  │     código de vinculación            │   │
│  │                          [Empezar →] │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  2. Sube contenido multimedia        │   │
│  │     Imágenes y videos para mostrar   │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  3. Crea una playlist                │   │
│  │     Organiza tu contenido            │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 7.2 Flujo de Vinculación de Dispositivo

```
1. Panel Web: Usuario hace click en "+ Agregar dispositivo"
2. Modal: formulario con nombre, ubicación, orientación, resolución
3. Al guardar → INSERT en tabla devices
   → Se genera device_key (6 dígitos aleatorios, único)
   → Respuesta incluye el código
4. Modal de confirmación muestra el código en grande:
   ┌──────────────────────────┐
   │  Código de Vinculación   │
   │                          │
   │      ╔════════════╗     │
   │      ║  A 7 3 K 9  ║     │
   │      ╚════════════╝     │
   │                          │
   │  Ingresa este código     │
   │  en la app del televisor │
   │                          │
   │  El código expira en 15  │
   │  minutos                 │
   │                          │
   │     [Copiar código]      │
   │     [Cerrar]             │
   └──────────────────────────┘

5. App React Native (TV):
   - Pantalla de vinculación con input de 6 caracteres
   - Usuario ingresa "A73K9"
   - App consulta a Supabase: SELECT * FROM devices WHERE device_key = 'A73K9'
   - Si existe y no está vinculado a otra sesión:
     → Actualiza devices (software_version, ip_address)
     → Comienza a reportar heartbeats cada 30s
     → Se suscribe al canal Realtime device:{id}:control

6. Panel Web:
   - El canal Realtime notifica que el dispositivo cambió a status 'online'
   - El dashboard actualiza la lista automáticamente
   - El usuario ve su dispositivo como 🟢 Online
```

### 7.3 Flujo de Asignación de Contenido

```
Opción A — Asignación rápida desde dispositivo:
1. Usuario va a #/devices/:id
2. Botón "Cambiar contenido"
3. Modal con 2 tabs: [Media individual] [Playlist]
4. Tab Media: Grid de archivos multimedia. Click en uno → asigna directamente.
5. Tab Playlist: Dropdown con playlists existentes. Selecciona una → asigna.
6. Al confirmar:
   → UPDATE devices SET current_media_id = X (o current_playlist_id = Y)
   → Se envía evento por canal Realtime device:{id}:control { command: 'play', media_id: X }
   → La app del TV recibe y comienza a reproducir

Opción B — Desde playlist:
1. Usuario edita playlist en #/playlists/:id
2. Botón "Asignar a dispositivos"
3. Modal con checkboxes de todos sus dispositivos
4. Selecciona uno o varios → "Asignar"
5. Mismo proceso de UPDATE + Realtime para cada dispositivo seleccionado

Opción C — Programación automática:
1. Usuario crea schedule en #/schedules
2. Asigna playlist a dispositivo(s) con rango de fechas y horarios
3. La app del TV tiene lógica para consultar schedules activos cada minuto
4. Cuando detecta un schedule que aplica, reproduce la playlist correspondiente
```

### 7.4 Flujo de Subida de Contenido

```
1. Usuario va a #/media
2. Click en "+ Subir" (o arrastra archivos a la zona de drop)
3. Modal/página de subida:
   ┌──────────────────────────────────────────┐
   │  Subir Archivos                          │
   │                                           │
   │  ┌───────────────────────────────────┐   │
   │  │                                   │   │
   │  │   Arrastra archivos aquí          │   │
   │  │   o haz click para seleccionar    │   │
   │  │                                   │   │
   │  │   Formatos: JPG, PNG, WebP,       │   │
   │  │   GIF, SVG, MP4, WebM             │   │
   │  │   Tamaño máx: 50 MB               │   │
   │  └───────────────────────────────────┘   │
   │                                           │
   │  Archivos seleccionados (3):              │
   │  ┌──────────────────────────────────┐    │
   │  │ banner_verano.jpg   2.3 MB  ✓   │    │
   │  │ promo_oferta.png    1.1 MB  ✓   │    │
   │  │ video_inst.mp4     45.0 MB ⏳ 78%│   │
   │  └──────────────────────────────────┘    │
   │                                           │
   │              [Subir] [Cancelar]           │
   └──────────────────────────────────────────┘

4. Validación previa (cliente):
   - Tipo MIME aceptado
   - Tamaño ≤ límite del plan
   - Para imágenes: verificar dimensiones mínimas (ej: 800x600)

5. Subida:
   - Para cada archivo: supabase.storage.from('media').upload(path, file)
   - Barra de progreso individual por archivo
   - Al completar: obtener URL pública con supabase.storage.from('media').getPublicUrl(path)
   - Para imágenes: generar thumbnail con Canvas y subir a bucket 'thumbnails'
   - Crear registro en tabla media con todos los metadatos

6. Al completar:
   - Toast de éxito
   - Los archivos aparecen en la galería (si estamos en #/media, se añaden al inicio)
   - Si fue desde modal de playlist, se cierra y refresca la lista de items disponibles

7. Manejo de errores:
   - Archivo demasiado grande → toast error, se saltea
   - Error de red → toast error, opción de reintentar
   - Storage lleno → toast error con link a planes de upgrade
```

---

## 8. SEGURIDAD Y CONSIDERACIONES

### 8.1 Autenticación
- JWT gestionado por Supabase SDK con refresh automático.
- Sesión persistida en `localStorage` (configurable a `sessionStorage` para mayor seguridad).
- Middleware de router verifica sesión antes de cargar rutas protegidas.
- Si el token expira, Supabase SDK lo refresca automáticamente.
- Si el refresh falla, redirigir a `#/login` con mensaje "Sesión expirada".

### 8.2 Row Level Security (RLS)
- Todas las tablas tienen RLS habilitado.
- Políticas por operación: SELECT, INSERT, UPDATE, DELETE.
- Cada política filtra por `auth.uid() = user_id`.
- La tabla `templates` tiene políticas especiales: los usuarios pueden SELECT templates del sistema (`is_system = true`) y CRUD sus propias.

### 8.3 Storage Security
- Buckets privados: solo se accede mediante políticas RLS o URLs firmadas.
- Para visualización en el panel: usar `getPublicUrl()` (genera URL pública permanente).
- Opcional: URLs firmadas con expiración para contenido sensible.
- Políticas de Storage:
```sql
CREATE POLICY "Users can upload own media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### 8.4 Validaciones en el Cliente
- Sanitización de inputs (escapar HTML para prevenir XSS).
- Validación de tipos MIME antes de subir.
- Límites de tamaño antes de enviar al servidor.
- CSRF: No aplica porque Supabase usa JWT en headers, no cookies.

### 8.5 Planes y Límites
```javascript
const PLAN_LIMITS = {
    free: {
        maxDevices: 3,
        storageMB: 500,
        maxFileSizeMB: 50,
        maxPlaylists: 5,
        features: ['basic']
    },
    pro: {
        maxDevices: 20,
        storageMB: 10240,   // 10 GB
        maxFileSizeMB: 500,
        maxPlaylists: 50,
        features: ['basic', 'schedules', 'templates', 'analytics']
    },
    enterprise: {
        maxDevices: 999,
        storageMB: 102400,  // 100 GB
        maxFileSizeMB: 2000,
        maxPlaylists: 999,
        features: ['basic', 'schedules', 'templates', 'analytics', 'api', 'white-label']
    }
};
```

---

## 9. INTERNACIONALIZACIÓN (i18n)

`js/utils/i18n.js`:
```javascript
const translations = {
    es: {
        dashboard: 'Panel de Control',
        devices: 'Dispositivos',
        media: 'Multimedia',
        playlists: 'Playlists',
        schedules: 'Programaciones',
        templates: 'Plantillas',
        settings: 'Configuración',
        logout: 'Cerrar Sesión',
        login: 'Iniciar Sesión',
        register: 'Crear Cuenta',
        email: 'Correo electrónico',
        password: 'Contraseña',
        confirmPassword: 'Confirmar contraseña',
        fullName: 'Nombre completo',
        companyName: 'Empresa',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        add: 'Agregar',
        upload: 'Subir',
        search: 'Buscar',
        filter: 'Filtrar',
        all: 'Todos',
        online: 'En línea',
        offline: 'Sin conexión',
        idle: 'En espera',
        noDevices: 'No tienes dispositivos aún',
        noMedia: 'No has subido contenido',
        confirmDelete: '¿Estás seguro de eliminar esto?',
        // ... 100+ claves más
    },
    en: {
        dashboard: 'Dashboard',
        devices: 'Devices',
        media: 'Media',
        // ...
    }
};

let currentLang = localStorage.getItem('lang') || 'es';

export function t(key) {
    return translations[currentLang]?.[key] || translations['es'][key] || key;
}

export function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    // Disparar evento para re-renderizar UI
    window.dispatchEvent(new CustomEvent('lang-changed', { detail: lang }));
}
```

---

## 10. OPTIMIZACIONES Y PERFORMANCE

### 10.1 Carga Inicial
- CSS crítico inline en `<head>` para evitar FOUC (Flash of Unstyled Content).
- Fuentes cargadas con `font-display: swap`.
- Imágenes con `loading="lazy"` y `decoding="async"`.
- Supabase SDK cargado con `defer` desde CDN.

### 10.2 Caché Local
- Estado del store cacheado en `sessionStorage` para restaurar la UI al refrescar.
- Lista de dispositivos y media cacheada localmente (con timestamp de expiración).
- Datos revalidados al volver a la vista (stale-while-revalidate).

```javascript
function cacheData(key, data, ttl = 300000) { // 5 min default
    const entry = { data, timestamp: Date.now(), ttl };
    sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry));
}

function getCachedData(key) {
    const raw = sessionStorage.getItem(`cache:${key}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > entry.ttl) {
        sessionStorage.removeItem(`cache:${key}`);
        return null;
    }
    return entry.data;
}
```

### 10.3 Lazy Loading de Módulos
```javascript
// Carga dinámica de módulos solo cuando se necesita la ruta
async function loadModule(moduleName) {
    switch (moduleName) {
        case 'devices':
            return import('./modules/devices.js');
        case 'playlists':
            return import('./modules/playlists.js');
        // ...
    }
}
```

### 10.4 Debounce en Búsquedas
- Inputs de búsqueda: 300ms debounce.
- Auto-save en editor de playlist: 2000ms debounce.

### 10.5 Virtualización de Listas (Opcional)
Para listas con más de 100 items (media library), implementar virtual scroll:
- Solo renderizar elementos visibles + buffer.
- Usar `IntersectionObserver` para lazy load.
- Altura fija por item para cálculo rápido.

---

## 11. PLAN DE IMPLEMENTACIÓN (FASES)

### Fase 1 — Fundación (Semana 1-2)
1. Crear proyecto en Supabase.
2. Ejecutar script SQL del esquema de base de datos.
3. Configurar RLS y políticas.
4. Configurar Storage buckets.
5. Crear estructura de archivos del proyecto HTML/CSS/JS.
6. Implementar `index.html`, `main.css`, `grid.css`, `components.css`.
7. Implementar `supabase.js`, `state.js`, `router.js`, `app.js`.
8. Implementar sistema de autenticación (`auth.js`, páginas login/register).
9. Implementar layout del app shell (sidebar, header, área de contenido).
10. Implementar sistema de notificaciones toast.

### Fase 2 — Core (Semana 3-4)
1. Implementar módulo `dashboard.js` con métricas y actividad reciente.
2. Implementar módulo `devices.js` (lista, crear, pairing, detalle básico).
3. Implementar `realtime.js` para actualizaciones en vivo de dispositivos.
4. Implementar módulo `media.js` (subida con progreso, galería, filtrado básico).
5. Implementar vista de detalle de dispositivo con preview.

### Fase 3 — Contenido (Semana 5-6)
1. Implementar módulo `playlists.js` (CRUD, drag & drop con SortableJS, previsualizador).
2. Implementar módulo `schedules.js` (CRUD, asignación, vista de calendario).
3. Implementar lógica de asignación de contenido a dispositivos (manual y programada).
4. Implementar vista previa de plantillas.

### Fase 4 — Avanzado (Semana 7-8)
1. Implementar módulo `templates.js` (editor de zonas con drag & resize).
2. Implementar comando `sendDeviceCommand` para control remoto (sync, restart).
3. Implementar temas claro/oscuro con persistencia.
4. Implementar i18n (español/inglés).
5. Implementar modo offline básico (mostrar datos cacheados cuando no hay red).

### Fase 5 — Pulido (Semana 9-10)
1. Optimizaciones de performance (lazy loading, caché, virtualización).
2. Testing manual de todos los flujos.
3. Correcciones de bugs y mejoras de UX.
4. Estados vacíos para todas las vistas.
5. Estados de carga (skeleton screens) para todas las vistas.
6. Manejo de errores completo (try/catch en todas las llamadas a API).
7. Responsive design: probar en tablet y móvil.
8. Documentación interna (comentarios JSDoc en funciones principales).

### Fase 6 — Lanzamiento (Semana 11-12)
1. Pruebas de integración con app React Native real.
2. Ajustes de RLS y políticas de seguridad.
3. Configuración de dominio personalizado y HTTPS.
4. Pruebas de carga (múltiples dispositivos simultáneos).
5. Despliegue en hosting (Netlify/Vercel/Cloudflare Pages).
6. Monitoreo y analytics.

---

## 12. HOJA DE RUTA DE LA APP REACT NATIVE (TV)

Para que tengas contexto de lo que la app del televisor debe hacer:

### Funcionalidades esenciales de la app React Native:
1. **Pantalla de vinculación**: Input de 6 caracteres para ingresar `device_key`. Consultar Supabase para vincular.
2. **Reproductor fullscreen**: Renderizar imágenes/videos a pantalla completa.
3. **Motor de playlists**: Reproducir secuencia de items con duraciones y transiciones.
4. **Cliente Realtime**: Suscribirse a canal `device:{id}:control` para recibir comandos (play, pause, next, sync, restart, update_settings).
5. **Heartbeat**: Enviar `device_status_changed` cada 30 segundos con status y timestamp.
6. **Screenshot** (opcional): Capturar pantalla y subir a Storage bajo demanda o cada N minutos.
7. **Resolución de schedules**: Cada minuto, consultar schedules activos para determinar qué playlist reproducir.
8. **Modo offline**: Si pierde conexión, seguir reproduciendo el último contenido asignado (cacheado localmente).
9. **Actualización OTA**: Consultar si hay nueva versión de la app disponible.

---

## 13. ESTIMACIÓN DE ESFUERZO

| Módulo               | Archivos         | Complejidad | Horas est. |
|----------------------|------------------|-------------|------------|
| Setup y estructura   | index.html, css/*, js/app.js, router.js, state.js | Media | 16 |
| Autenticación        | auth.js, auth.css, páginas login/register | Media | 12 |
| Dashboard            | dashboard.js     | Baja | 8 |
| Dispositivos         | devices.js, devices.css | Alta | 24 |
| Multimedia           | media.js, media.css | Alta | 20 |
| Playlists            | playlists.js, playlists.css | Alta | 24 |
| Programaciones       | schedules.js, schedules.css | Alta | 20 |
| Plantillas           | templates.js, templates.css | Muy Alta | 30 |
| Realtime             | realtime.js      | Media | 12 |
| UI Components        | components.css, notifications | Media | 16 |
| Utilidades           | utils/*          | Baja | 8 |
| Testing y pulido     | -                | Media | 20 |
| **Total**            |                  |         | **~210 horas** |

---

## 14. RECURSOS Y REFERENCIAS

- [Supabase JS SDK v2](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [SortableJS](https://sortablejs.github.io/Sortable/)
- [MDN Web APIs](https://developer.mozilla.org/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)

---

## 15. ANÁLISIS DE NEGOCIO Y ESTRATEGIA DE EJECUCIÓN

### 15.1 Dos modelos contrastados

#### Modelo A: Cartelera Digital SaaS (Proyecto Original)
Plataforma donde cada empresa gestiona SUS propios televisores con SU contenido. Mercado probado y activo (ScreenCloud, OptiSigns, Yodeck, Raydiant). Las empresas pagan suscripción mensual por dispositivo gestionado. La venta es directa: "controla lo que muestran tus pantallas desde un panel web".

#### Modelo B: Marketplace Publicitario Descentralizado (Visión Futura)
Cualquier dueño de una pantalla vende su espacio publicitario a terceros. Cada televisor del mundo se convierte en inventario publicitario. La persona que paga elige en qué pantalla aparece, basándose en ubicación, concurrencia, fotos del lugar. El dueño de la pantalla cobra por tiempo de exposición o por escaneos de QR. Es una idea de alcance global con potencial masivo.

### 15.2 Análisis crítico de viabilidad

#### Fortalezas del modelo SaaS original
- **Mercado validado**: Existen competidores facturando millones. No hay que educar al cliente sobre POR QUÉ necesita esto.
- **Venta simple**: Una cafetería con una pantalla para su menú entiende el valor en 30 segundos.
- **Revenue predecible**: Suscripción mensual recurrente. Modelo de negocio que inversores entienden y valoran.
- **Sin efectos de red**: No necesitas 1000 pantallas para que el producto funcione. Funciona con UNA.
- **Barrera de entrada baja**: Construible por una persona con Supabase + HTML/JS.

#### Problemas del modelo marketplace si se ejecuta primero

1. **El huevo y la gallina**: Anunciantes sin pantallas no pagan. Dueños de pantallas sin anunciantes no se registran. Resolver ambos lados simultáneamente sin presupuesto de marketing es casi imposible. Las plataformas de dos lados requieren capital o un growth hack excepcional.

2. **Fraude masivo**: Gente simulando pantallas con emuladores, bots escaneando QRs para inflar métricas, GPS spoofeado para mentir ubicación. Google y Meta pierden miles de millones anuales en fraude publicitario con ejércitos de ingenieros dedicados. Un equipo pequeño no tiene capacidad de detección suficiente.

3. **Verificación de ubicación y tráfico**: ¿Cómo probar que una pantalla está realmente en un centro comercial concurrido y no en el garaje de alguien? Fotos (fácilmente falsificables con IA), GPS (spoofeable), verificación presencial (no escala). Sin verificación confiable, los anunciantes no pagan tarifas premium, y el mercado colapsa a calidad baja.

4. **Brand safety**: Las marcas grandes son extremadamente sensibles a dónde aparece su publicidad. Un anuncio de una multinacional junto a contenido inapropiado en una pantalla no verificada = demanda legal y daño reputacional. Moderar contenido en miles de pantallas requiere IA avanzada o equipos humanos masivos.

5. **Fragmentación técnica del hardware**: TV boxes chinos genéricos, Android TV oficial, Fire Stick, Roku, Smart TVs Samsung/LG, Raspberry Pi. Cada plataforma tiene limitaciones distintas de rendimiento, codecs, resolución, y capacidades de background execution. Mantener una app funcional en todo ese espectro es una pesadilla de desarrollo y soporte.

6. **Regulación internacional**: La publicidad en espacio público está regulada de forma distinta en cada país, estado, y municipio. Con pantallas en 50 jurisdicciones, necesitas 50 asesores legales. Los anunciantes exigirán compliance antes de invertir.

7. **Riesgo de plataforma dominante**: Si el modelo funciona, Google/Amazon pueden aplastarlo en meses integrando su infraestructura publicitaria existente (Google Ad Manager, Amazon Ads) con cualquier app de pantalla. Tienen la demanda publicitaria, las relaciones con marcas, y los sistemas de detección de fraude ya construidos.

### 15.3 Estrategia óptima: SaaS como caballo de Troya

**Construir el SaaS primero. Usarlo como puente al marketplace después.**

La secuencia correcta elimina el problema del huevo-gallina porque el lado de la oferta (pantallas) se acumula como efecto colateral del negocio principal:

1. **Fase 1 (3-6 meses)**: Construir y lanzar el panel de control SaaS. Enfocar en pequeños negocios: cafeterías, restaurantes, gimnasios, consultorios, comercios minoristas. Una pantalla, $15-25/mes. Cero marketplace. Cero QRs. Cero pagos entre usuarios.

2. **Fase 2 (12-18 meses)**: Acumular 50-100 clientes de pago. Cada uno representa una pantalla real, verificada, con ubicación conocida y datos de actividad. Estas pantallas YA están monetizando (pagan suscripción). El inventario publicitario se acumula sin costo de adquisición específico.

3. **Fase 3 (momento del pivot)**: Cuando hay masa crítica de pantallas, agregar una feature al panel existente: *"Tu pantalla está sin contenido 14 horas al día. Activa 'Modo Anuncios' y gana dinero extra cuando no estás mostrando tu contenido."* Un toggle. El dueño de la pantalla elige si participa.

4. **Fase 4 (marketplace ligero)**: Landing simple para anunciantes locales (negocios del mismo barrio/ciudad). Sin algoritmos complejos, sin puja en tiempo real. Publicidad local geolocalizada manualmente. Las pantallas YA son legítimas (todas pagan el SaaS), así que no hay problema de verificación ni brand safety catastrófico.

### 15.4 Comparativa de estrategias

| Variable | SaaS primero | Marketplace primero |
|---|---|---|
| Riesgo de fracaso | Bajo | Altísimo |
| Inversión inicial | ~$12 (dominio) + tiempo propio | Mínimo $50-100K (marketing, legal, anti-fraude) |
| Tiempo a primer ingreso | 3-6 meses | 24+ meses |
| Validación de producto | Con 10 clientes ya sabes si funciona | Necesitas cientos en ambos lados |
| Adquisición de pantallas | Ventas directas a negocios | Marketing masivo a consumidores |
| Verificación de pantallas | No necesaria (el cliente las opera) | Crítica para la viabilidad |
| Complejidad técnica inicial | Moderada | Muy alta |
| Escalabilidad del negocio | Lineal (más clientes = más revenue) | Exponencial (efectos de red) |
| Potencial de salida/exit | Adquisición por competitor más grande ($1-10M) | Potencial de unicornio ($1B+) si funciona |

### 15.5 Plan de costos mínimos real

| Concepto | Costo mensual |
|---|---|
| Supabase (plan free: 500 MB DB, 5 GB storage, 50K usuarios) | $0 |
| Hosting frontend (Netlify/Vercel/Cloudflare Pages free tier) | $0 |
| Dominio .com | ~$1/mes |
| Email transactional (Resend free tier: 100 emails/día) | $0 |
| **Total mensual operativo** | **~$1** |

La única inversión real es tu tiempo de desarrollo (estimado en 210 horas según el plan).

### 15.6 Conclusión

**El plan actual del documento es el camino correcto sin modificaciones.** Construye exactamente lo que está documentado en las secciones 1 a 14. No agregues funcionalidad de marketplace todavía. Cuando tengas las pantallas, el marketplace será una feature, no un producto separado.

El modelo de negocio de las fases 1-2 es simple: "Paga $15/mes por gestionar tu pantalla". Eso solo ya es un negocio sostenible. La visión del marketplace es el multiplicador a futuro, no el punto de partida.
