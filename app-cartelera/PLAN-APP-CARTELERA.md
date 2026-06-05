# PLAN DE ACCIÓN DETALLADO — APP REACT NATIVE (TV Box) PARA CARTELERA DIGITAL

---

## ÍNDICE

1. [Visión General y Alineación con el Panel Web](#1-visión-general-y-alineación-con-el-panel-web)
2. [Arquitectura Técnica de la App TV](#2-arquitectura-técnica-de-la-app-tv)
3. [Estructura de Archivos Propuesta](#3-estructura-de-archivos-propuesta)
4. [Integración con Supabase (Capa de Datos)](#4-integración-con-supabase-capa-de-datos)
5. [Flujo de Vinculación (Pairing) del Dispositivo](#5-flujo-de-vinculación-pairing-del-dispositivo)
6. [Sistema de Autenticación Anónima por Dispositivo](#6-sistema-de-autenticación-anónima-por-dispositivo)
7. [Motor de Renderizado de Contenido (Playlist Engine)](#7-motor-de-renderizado-de-contenido-playlist-engine)
8. [Sistema de Plantillas (Layouts) — Solo 2 Modos Activos](#8-sistema-de-plantillas-layouts--solo-2-modos-activos)
9. [Comunicación en Tiempo Real (Supabase Realtime)](#9-comunicación-en-tiempo-real-supabase-realtime)
10. [Sistema de Heartbeat y Monitoreo](#10-sistema-de-heartbeat-y-monitoreo)
11. [Resolución de Programaciones (Schedules)](#11-resolución-de-programaciones-schedules)
12. [Modo Offline y Caché Local](#12-modo-offline-y-caché-local)
13. [Manejo de Errores y Estados](#13-manejo-de-errores-y-estados)
14. [Plan de Implementación por Fases (Detallado)](#14-plan-de-implementación-por-fases-detallado)
15. [Checklist de Archivos a Crear/Modificar](#15-checklist-de-archivos-a-crearmodificar)
16. [Pruebas y Verificación](#16-pruebas-y-verificación)

---

## 1. VISIÓN GENERAL Y ALINEACIÓN CON EL PANEL WEB

### 1.1 Propósito del Sistema Conjunto

El sistema completo consta de DOS componentes que trabajan en conjunto a través de Supabase:

```
┌─────────────────────────────┐     ┌──────────────────────────────────┐
│    PANEL WEB (SPA HTML)     │     │   APP REACT NATIVE (TV Box)      │
│                             │     │                                  │
│  • Usuario crea contenido   │     │  • Recibe contenido asignado     │
│  • Gestiona dispositivos    │◄───►│  • Renderiza en pantalla         │
│  • Arma playlists           │     │  • Reporta estado y actividad    │
│  • Programa campañas        │     │  • Se vincula con device_key     │
│                             │     │  • Opera offline si pierde red   │
└──────────┬──────────────────┘     └───────────────┬──────────────────┘
           │                                        │
           │         ┌──────────────────┐           │
           └────────►│     SUPABASE     │◄──────────┘
                     │                  │
                     │  • Auth          │
                     │  • Database      │
                     │  • Storage       │
                     │  • Realtime      │
                     └──────────────────┘
```

### 1.2 Flujo de Datos Bidireccional

| Dirección | Canal | Qué transmite |
|---|---|---|
| Panel → TV | `device:{id}:control` (Broadcast) | Comandos: play, pause, sync, restart, update_settings, assign_content |
| Panel → TV | `playlists` + `media` (DB) | Contenido nuevo o modificado que el TV consulta al recibir comando sync |
| TV → Panel | `device:{id}:status` (Broadcast) | Heartbeat cada 30s, screenshots opcionales, logs de actividad |
| TV → Panel | `devices` (DB Update) | Actualización de last_seen, current_media_id, status, ip_address |

### 1.3 Estados del Dispositivo (Ciclo de Vida)

```
 ┌─────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
 │ PENDING │────►│ PAIRING  │────►│  ONLINE  │────►│  IDLE    │
 │(recién  │     │(ingresar │     │(reprodu- │     │(sin      │
 │creado)  │     │ código)  │     │ciendo)   │     │contenido)│
 └─────────┘     └──────────┘     └────┬─────┘     └────┬─────┘
                                       │                 │
                                       │  pierde red     │  recibe
                                       ▼                 ▼  contenido
                                  ┌──────────┐     ┌──────────┐
                                  │ OFFLINE  │     │ PLAYING  │
                                  │(último   │     │(contenido│
                                  │contenido)│     │activo)   │
                                  └──────────┘     └──────────┘
```

### 1.4 Correspondencia con las Fases del Panel Web

| Fase Panel Web | Qué necesita la App TV | Estado Actual App TV |
|---|---|---|
| Fase 1 (Fundación) | Auth anónima, estructura base, router, estilos | ✓ Hecho (index.tsx, _layout.tsx, tipos) |
| Fase 2 (Core) | Vinculación, heartbeat, preview, renderizado básico | ✗ Pendiente |
| Fase 3 (Contenido) | Motor de playlists, cambio de contenido en vivo | ✗ Pendiente |

**MVP Objetivo (Fase 1-3 completado):**
- App se vincula con código de 6 dígitos
- Recibe y renderiza contenido asignado desde el panel web
- Soporta 2 layouts: Video Ancho + Historia Estrecha, Historia Pantalla Completa
- Reporta heartbeat cada 30 segundos
- Cambia de contenido en tiempo real cuando el panel envía comando
- Funciona offline con el último contenido cacheado

---

## 2. ARQUITECTURA TÉCNICA DE LA APP TV

### 2.1 Stack Tecnológico

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Framework | Expo (managed workflow) | SDK 56 | Desarrollo rápido, OTA updates, compatibilidad TV |
| UI | React Native (TV fork) | 0.85-stable | Soporte nativo de TV (D-pad, focus, TVEventHandler) |
| Navegación | Expo Router | ~56.2.8 | File-based routing, igual que Next.js |
| Estado local | React hooks (useState, useReducer, useContext) | - | Sin librería externa para MVP, mantener simple |
| BaaS | Supabase JS SDK | v2 | Auth, Database, Storage, Realtime |
| Video | expo-video | SDK 56 | Compatible con Expo Go y TV box |
| Imágenes | expo-image | SDK 56 | Caché de imágenes, mejor performance que RN Image |
| Persistencia | AsyncStorage (expo-sqlite opcional) | - | Caché offline de contenido y config |
| Animaciones | react-native-reanimated | 4.3.1 | Ya instalado, para transiciones suaves |

### 2.2 Patrón de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    src/app/                              │
│  _layout.tsx       → Layout raíz (Stack Navigator)      │
│  index.tsx          → Punto de entrada, renderiza App    │
│  pairing.tsx        → Pantalla de vinculación (código)  │
│  playback.tsx       → Pantalla de reproducción          │
│  error.tsx          → Pantalla de error/sin conexión    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  src/components/                         │
│  Billboard.tsx        → Orquestador principal           │
│  BillboardSlide.tsx   → Renderiza un slide/anuncio      │
│  SlideIndicator.tsx   → Indicador de dots (futuro)      │
│  PairingScreen.tsx    → UI de vinculación               │
│  DeviceStatus.tsx     → Overlay de estado del dispositivo│
│  ConnectionBanner.tsx  → Banner de conectividad          │
│                                                          │
│  layouts/                                                │
│    LayoutEngine.tsx    → Motor de renderizado de áreas   │
│    layouts.ts          → Definiciones de layouts (2)    │
│                                                          │
│  media/                                                  │
│    VideoPlayer.tsx     → Reproductor de video (expo-video)│
│    StoryPanel.tsx      → Panel de historia/imágenes      │
│    ImageGrid.tsx       → Grid de imágenes                │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  src/services/                            │
│  supabase.ts            → Cliente Supabase (init)        │
│  pairing.service.ts     → Lógica de vinculación          │
│  content.service.ts     → Descarga de contenido/media    │
│  realtime.service.ts    → Suscripciones Realtime          │
│  heartbeat.service.ts   → Heartbeat cada 30s             │
│  schedule.service.ts    → Resolución de schedules        │
│  cache.service.ts       → Caché offline (AsyncStorage)   │
│  device.service.ts      → Registro y estado dispositivo  │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  src/hooks/                               │
│  useSupabase.ts        → Hook de acceso al cliente       │
│  useDevice.ts          → Estado del dispositivo          │
│  useContent.ts         → Contenido actual + loading      │
│  useRealtime.ts        → Suscripción a canal Realtime    │
│  useHeartbeat.ts       → Hook del heartbeat              │
│  useNetworkStatus.ts   → Hook de conectividad            │
│  useSchedule.ts        → Hook de resolución de horario   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  src/types/                               │
│  index.ts              → MediaContent, LayoutDefinition, │
│                          Announcement, etc.              │
│  supabase.types.ts     → Tipos generados de la DB        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                  src/config/                              │
│  supabase.config.ts    → URL y anon key de Supabase      │
│  constants.ts          → Intervalos, timeouts, límites   │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Diagrama de Navegación (Flujo de Pantallas)

```
INICIO DE APP
    │
    ▼
┌─────────────┐   ¿Dispositivo     ┌──────────────┐
│  _layout.tsx│── vinculado? ──SI──►  playback.tsx │
│  (Stack)    │                    │  (Reproducir) │
└─────────────┘                    └──────────────┘
    │
    │ NO (primer inicio o
    │    se desvinculó)
    ▼
┌─────────────┐
│ pairing.tsx │  Usuario ingresa código de 6 dígitos
│ (Vincular)  │
└─────────────┘
    │
    │ Código válido ──► guardar device_id en AsyncStorage
    ▼
┌──────────────┐
│ playback.tsx │  Loop principal de reproducción
└──────────────┘
    │
    │ Si hay error de red o sin contenido
    ▼
┌─────────────┐
│  error.tsx  │  Pantalla de error con reintento
└─────────────┘
```

---

## 3. ESTRUCTURA DE ARCHIVOS PROPUESTA

### 3.1 Archivos NUEVOS a Crear

```
src/
├── app/
│   ├── pairing.tsx                    [NUEVO] Pantalla de vinculación
│   ├── playback.tsx                   [NUEVO] Pantalla de reproducción principal
│   └── error.tsx                      [NUEVO] Pantalla de error/reintento
│
├── services/
│   ├── supabase.ts                    [NUEVO] Inicialización cliente Supabase
│   ├── pairing.service.ts             [NUEVO] Lógica de vinculación device_key
│   ├── content.service.ts             [NUEVO] Descarga de playlists/media/storage URLs
│   ├── realtime.service.ts            [NUEVO] Suscripciones canales Realtime
│   ├── heartbeat.service.ts           [NUEVO] Heartbeat periódico (30s)
│   ├── schedule.service.ts            [NUEVO] Resolución de programaciones activas
│   ├── cache.service.ts               [NUEVO] Caché offline con AsyncStorage
│   └── device.service.ts              [NUEVO] Registro/actualización estado dispositivo
│
├── hooks/
│   ├── useSupabase.ts                 [NUEVO] Hook para acceder al cliente Supabase
│   ├── useDevice.ts                   [NUEVO] Estado del dispositivo vinculado
│   ├── useContent.ts                  [NUEVO] Contenido actual, loading, error
│   ├── useRealtime.ts                 [NUEVO] Suscripción a canal de comandos
│   ├── useHeartbeat.ts                [NUEVO] Hook del heartbeat automático
│   ├── useNetworkStatus.ts            [NUEVO] Hook de conectividad (NetInfo)
│   └── useSchedule.ts                 [NUEVO] Hook de resolución de programación
│
├── config/
│   ├── supabase.config.ts             [NUEVO] SUPABASE_URL, SUPABASE_ANON_KEY
│   └── constants.ts                   [NUEVO] Constantes de la app
│
├── types/
│   └── supabase.types.ts              [NUEVO] Tipos de la base de datos Supabase
│
└── components/
    ├── PairingScreen.tsx               [NUEVO] UI de vinculación (teclado numérico)
    ├── DeviceStatus.tsx                [NUEVO] Overlay de estado (online/offline)
    └── ConnectionBanner.tsx            [NUEVO] Banner cuando se pierde conexión
```

### 3.2 Archivos EXISTENTES a Modificar

```
src/
├── app/
│   ├── index.tsx                       [MODIFICAR] Redirigir según estado vinculación
│   └── _layout.tsx                     [MODIFICAR] Agregar rutas pairing, playback, error
│
├── components/
│   ├── Billboard.tsx                   [MODIFICAR] Conectar con useContent en vez de data local
│   └── BillboardSlide.tsx              [OPCIONAL] Ajustes menores si es necesario
│
├── types/
│   └── index.ts                        [MODIFICAR] Agregar tipos de Supabase si necesario
│
├── app.json                            [MODIFICAR] Agregar config plugin expo-secure-store
│
└── package.json                        [MODIFICAR] Agregar dependencias nuevas
```

---

## 4. INTEGRACIÓN CON SUPABASE (CAPA DE DATOS)

### 4.1 Configuración Inicial

**Archivo: `src/config/supabase.config.ts`**
```typescript
export const SUPABASE_URL = 'https://<tu-proyecto>.supabase.co';
export const SUPABASE_ANON_KEY = '<tu-anon-key>';

// Nombres de canales Realtime
export const REALTIME_CHANNELS = {
  DEVICE_CONTROL: (deviceId: string) => `device:${deviceId}:control`,
  DEVICE_STATUS: (deviceId: string) => `device:${deviceId}:status`,
  USER_GLOBAL: (userId: string) => `user:${userId}:global`,
} as const;

// Nombres de tablas
export const TABLES = {
  DEVICES: 'devices',
  MEDIA: 'media',
  PLAYLISTS: 'playlists',
  SCHEDULES: 'schedules',
  DEVICE_LOGS: 'device_logs',
  PROFILES: 'profiles',
} as const;

// Nombres de buckets de Storage
export const BUCKETS = {
  MEDIA: 'media',
  THUMBNAILS: 'thumbnails',
} as const;
```

**Archivo: `src/config/constants.ts`**
```typescript
// Intervalos (en milisegundos)
export const HEARTBEAT_INTERVAL_MS = 30_000;       // 30 segundos
export const SCHEDULE_CHECK_INTERVAL_MS = 60_000;  // 1 minuto
export const RECONNECT_DELAY_MS = 5_000;            // 5 segundos
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;   // 24 horas
export const MAX_RETRY_ATTEMPTS = 3;

// Timeouts
export const PAIRING_CODE_LENGTH = 6;
export const PAIRING_TIMEOUT_MS = 15 * 60 * 1000;  // 15 minutos

// Estados del dispositivo
export const DEVICE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  IDLE: 'idle',
  PLAYING: 'playing',
} as const;
```

**Archivo: `src/services/supabase.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabase.config';
import type { Database } from '../types/supabase.types';

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export function initSupabase(): ReturnType<typeof createClient<Database>> {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: AsyncStorageAdapter, // o expo-secure-store
      detectSessionInUrl: false,    // No aplica en RN
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    db: {
      schema: 'public',
    },
  });

  return supabaseInstance;
}

export function getSupabase() {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase no ha sido inicializado. Llama a initSupabase() primero.'
    );
  }
  return supabaseInstance;
}

// AsyncStorage adapter para Supabase Auth
const AsyncStorageAdapter = {
  getItem: async (key: string) => {
    // Usar expo-secure-store para tokens (más seguro)
    const SecureStore = require('expo-secure-store');
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    const SecureStore = require('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  },
};
```

### 4.2 Nuevas Dependencias a Instalar

```bash
npx expo install @supabase/supabase-js
npx expo install expo-secure-store     # Almacenamiento seguro de tokens
npx expo install expo-network           # Detección de conectividad (NetInfo)
npx expo install @react-native-async-storage/async-storage  # Caché offline
npx expo install expo-crypto            # Generación de IDs únicos locales
npx expo install expo-file-system       # Descarga y caché de archivos media
npx expo install expo-keep-awake        # Mantener pantalla encendida
```

Estas se agregan a `package.json` en la sección `dependencies`. El comando `npx expo install` instala la versión compatible con SDK 56 automáticamente.

### 4.3 Tipos de Base de Datos

**Archivo: `src/types/supabase.types.ts`**

Estos tipos representan las filas de las tablas definidas en el `supabase-schema.sql` del PLAN-CARTELERA-DIGITAL.md. Se generan idealmente con `npx supabase gen types typescript`, pero para MVP se definen manualmente:

```typescript
export interface Database {
  public: {
    Tables: {
      devices: {
        Row: DeviceRow;
        Insert: DeviceInsert;
        Update: DeviceUpdate;
      };
      media: {
        Row: MediaRow;
        Insert: MediaInsert;
        Update: MediaUpdate;
      };
      playlists: {
        Row: PlaylistRow;
        Insert: PlaylistInsert;
        Update: PlaylistUpdate;
      };
      schedules: {
        Row: ScheduleRow;
        Insert: ScheduleInsert;
        Update: ScheduleUpdate;
      };
      device_logs: {
        Row: DeviceLogRow;
        Insert: DeviceLogInsert;
      };
      profiles: {
        Row: ProfileRow;
      };
    };
  };
}

// ── DEVICES ────────────────────────────────────────────────────────

export interface DeviceRow {
  id: string;                    // uuid PK
  user_id: string;                // uuid FK → profiles.id
  name: string;
  device_key: string;            // 6 dígitos únicos
  model: string | null;
  location: string | null;
  orientation: 'landscape' | 'portrait';
  resolution: string | null;
  status: 'online' | 'offline' | 'idle' | 'playing';
  last_seen: string | null;      // timestamptz
  current_media_id: string | null;
  current_playlist_id: string | null;
  software_version: string | null;
  ip_address: string | null;
  settings: Record<string, unknown> | null;  // jsonb
  created_at: string;
  updated_at: string;
}

export interface DeviceInsert {
  id?: string;
  user_id: string;
  name: string;
  device_key: string;
  model?: string;
  location?: string;
  orientation?: 'landscape' | 'portrait';
  resolution?: string;
  status?: 'online' | 'offline' | 'idle' | 'playing';
  software_version?: string;
  ip_address?: string;
}

export interface DeviceUpdate {
  status?: 'online' | 'offline' | 'idle' | 'playing';
  last_seen?: string;
  current_media_id?: string | null;
  current_playlist_id?: string | null;
  software_version?: string;
  ip_address?: string;
  settings?: Record<string, unknown>;
}

// ── MEDIA ───────────────────────────────────────────────────────────

export interface MediaRow {
  id: string;                    // uuid PK
  user_id: string;                // uuid FK
  name: string;
  type: 'image' | 'video' | 'webpage' | 'widget';
  url: string;                   // URL pública en Supabase Storage
  thumbnail_url: string | null;
  file_size: number | null;      // int8
  duration: number | null;       // int4 (segundos)
  width: number | null;          // int4
  height: number | null;         // int4
  mime_type: string | null;
  tags: string[] | null;         // text[]
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaInsert {
  id?: string;
  user_id: string;
  name: string;
  type: 'image' | 'video' | 'webpage' | 'widget';
  url: string;
  thumbnail_url?: string;
  file_size?: number;
  duration?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  tags?: string[];
}

export interface MediaUpdate {
  name?: string;
  tags?: string[];
  is_archived?: boolean;
}

// ── PLAYLISTS ───────────────────────────────────────────────────────

export interface PlaylistItem {
  media_id: string;
  duration: number;              // segundos
  order: number;
}

export interface PlaylistRow {
  id: string;                    // uuid PK
  user_id: string;                // uuid FK
  name: string;
  description: string | null;
  items: PlaylistItem[];          // jsonb
  is_loop: boolean;
  transition: 'none' | 'fade' | 'slide' | 'zoom';
  created_at: string;
  updated_at: string;
}

export interface PlaylistInsert {
  id?: string;
  user_id: string;
  name: string;
  description?: string;
  items?: PlaylistItem[];
  is_loop?: boolean;
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
}

export interface PlaylistUpdate {
  name?: string;
  description?: string;
  items?: PlaylistItem[];
  is_loop?: boolean;
  transition?: 'none' | 'fade' | 'slide' | 'zoom';
}

// ── SCHEDULES ────────────────────────────────────────────────────────

export interface ScheduleRow {
  id: string;                    // uuid PK
  user_id: string;                // uuid FK
  name: string;
  device_ids: string[];           // uuid[]
  playlist_id: string;            // uuid FK
  start_date: string;             // timestamptz
  end_date: string;               // timestamptz
  days_of_week: number[];         // int2[] (0=Dom..6=Sab)
  start_time: string;             // time (HH:MM:SS)
  end_time: string;               // time
  priority: number;               // int2
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleInsert {
  id?: string;
  user_id: string;
  name: string;
  device_ids: string[];
  playlist_id: string;
  start_date: string;
  end_date: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  priority?: number;
  is_active?: boolean;
}

export interface ScheduleUpdate {
  name?: string;
  device_ids?: string[];
  playlist_id?: string;
  start_date?: string;
  end_date?: string;
  days_of_week?: number[];
  start_time?: string;
  end_time?: string;
  priority?: number;
  is_active?: boolean;
}

// ── DEVICE LOGS ──────────────────────────────────────────────────────

export interface DeviceLogRow {
  id: number;                    // bigserial
  device_id: string;              // uuid FK
  event_type: 'online' | 'offline' | 'playing' | 'error' | 'sync' | 'restart';
  event_data: Record<string, unknown> | null;  // jsonb
  created_at: string;
}

export interface DeviceLogInsert {
  device_id: string;
  event_type: 'online' | 'offline' | 'playing' | 'error' | 'sync' | 'restart';
  event_data?: Record<string, unknown>;
}

// ── PROFILES ─────────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;                    // uuid PK → auth.users.id
  email: string;
  full_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'viewer';
  plan: 'free' | 'pro' | 'enterprise';
  max_devices: number;
  created_at: string;
  updated_at: string;
}
```

---

## 5. FLUJO DE VINCULACIÓN (PAIRING) DEL DISPOSITIVO

### 5.1 Descripción del Flujo

```
┌──────────────────────────┐          ┌──────────────────────────┐
│      PANEL WEB           │          │     APP REACT NATIVE     │
│                          │          │                          │
│ 1. Usuario crea device ──┼──────┐   │                          │
│    Se genera device_key  │      │   │                          │
│    (6 dígitos: "A73K9")  │      │   │                          │
│                          │      │   │                          │
│ 2. Usuario ve el código  │      │   │ 3. App muestra teclado   │
│    en el panel           │      │   │    de 6 caracteres       │
│                          │      │   │                          │
│                          │      │   │ 4. Usuario ingresa       │
│                          │      │   │    "A73K9"               │
│                          │      │   │                          │
│                          │      │   │ 5. App consulta:         │
│                          │      │   │    SELECT * FROM devices │
│                          │      └──►│    WHERE device_key =    │
│                          │          │    'A73K9'              │
│                          │          │                          │
│                          │          │ 6. Si existe y user_id   │
│                          │          │    coincide → VINCULADO  │
│                          │          │                          │
│                          │      ┌───│ 7. Guardar device_id     │
│ 8. Panel recibe evento   │◄─────┘   │    en SecureStore        │
│    realtime: dispositivo │          │    Actualizar campos:    │
│    ahora ONLINE          │          │    status='online',      │
│                          │          │    last_seen=now(),      │
│                          │          │    software_version,     │
│                          │          │    ip_address            │
└──────────────────────────┘          └──────────────────────────┘
```

### 5.2 Implementación del Servicio de Pairing

**Archivo: `src/services/pairing.service.ts`**

```typescript
import { getSupabase } from './supabase';
import { TABLES } from '../config/supabase.config';
import type { DeviceRow } from '../types/supabase.types';

interface PairingResult {
  success: true;
  device: DeviceRow;
} | {
  success: false;
  error: string;
  errorCode: 'NOT_FOUND' | 'ALREADY_PAIRED' | 'NETWORK_ERROR' | 'INVALID_CODE';
}

/**
 * Intenta vincular el dispositivo con un código de 6 dígitos.
 *
 * Flujo:
 * 1. Buscar en tabla devices por device_key
 * 2. Si no existe → NOT_FOUND
 * 3. Si existe y ya tiene software_version → ALREADY_PAIRED
 * 4. Si existe y no está vinculado → devolver device para actualizar
 */
export async function pairDevice(code: string): Promise<PairingResult> {
  // Normalizar código: mayúsculas, sin espacios, exacto 6 caracteres
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode.length !== 6) {
    return {
      success: false,
      error: 'El código debe tener exactamente 6 caracteres',
      errorCode: 'INVALID_CODE',
    };
  }

  if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
    return {
      success: false,
      error: 'El código solo puede contener letras y números',
      errorCode: 'INVALID_CODE',
    };
  }

  const supabase = getSupabase();

  // Buscar dispositivo por device_key
  const { data: devices, error: queryError } = await supabase
    .from(TABLES.DEVICES)
    .select('*')
    .eq('device_key', normalizedCode)
    .limit(1);

  if (queryError) {
    console.error('Error al buscar dispositivo:', queryError);
    return {
      success: false,
      error: 'Error de red al verificar el código. Intenta de nuevo.',
      errorCode: 'NETWORK_ERROR',
    };
  }

  if (!devices || devices.length === 0) {
    return {
      success: false,
      error: 'Código no encontrado. Verifica que sea correcto.',
      errorCode: 'NOT_FOUND',
    };
  }

  const device = devices[0] as DeviceRow;

  // Verificar si ya está vinculado (tiene software_version)
  if (device.software_version) {
    return {
      success: false,
      error: 'Este código ya está vinculado a otro dispositivo. ' +
             'Solicita uno nuevo desde el panel.',
      errorCode: 'ALREADY_PAIRED',
    };
  }

  return {
    success: true,
    device,
  };
}

/**
 * Desvincula el dispositivo (borra vinculación local).
 * No elimina el registro en BD, solo limpia el estado local.
 */
export async function unpairDevice(deviceId: string): Promise<void> {
  const supabase = getSupabase();

  // Marcar como offline en BD
  await supabase
    .from(TABLES.DEVICES)
    .update({ status: 'offline', last_seen: new Date().toISOString() })
    .eq('id', deviceId);

  // Limpiar storage local
  const SecureStore = require('expo-secure-store');
  await SecureStore.deleteItemAsync('device_id');
  await SecureStore.deleteItemAsync('device_key');
}
```

### 5.3 Pantalla de Vinculación (UI)

**Archivo: `src/app/pairing.tsx`**

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  TVFocusGuideView,
  TVEventHandler,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { pairDevice } from '../services/pairing.service';
import { registerDevice } from '../services/device.service';
import { IS_TV, tvScale } from '../utils/tv';

// Teclado virtual simplificado para TV (navegación con D-pad)
const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
  ['U', 'V', 'W', 'X', 'Y', 'Z', '⌫', '✓'],
];

export default function PairingScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // En TV, enfocar el input al montar
  useEffect(() => {
    if (IS_TV) {
      setTimeout(() => inputRef.current?.focus(), 500);
    }
  }, []);

  const handleKeyPress = useCallback((key: string) => {
    setError(null);

    if (key === '⌫') {
      setCode(prev => prev.slice(0, -1));
      return;
    }

    if (key === '✓') {
      handleSubmit();
      return;
    }

    if (code.length < 6) {
      setCode(prev => (prev + key).toUpperCase());
    }
  }, [code]);

  const handleSubmit = useCallback(async () => {
    if (code.length !== 6 || isLoading) return;

    setIsLoading(true);
    setError(null);

    const result = await pairDevice(code);

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // Vincular exitoso → registrar dispositivo y navegar
    const registered = await registerDevice(result.device.id);

    if (registered) {
      setSuccess(true);
      setTimeout(() => {
        router.replace('/playback');
      }, 1500);
    } else {
      setError('Error al registrar el dispositivo. Intenta de nuevo.');
    }

    setIsLoading(false);
  }, [code, isLoading]);

  const codeDisplay = code.padEnd(6, '_').split('');

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo / Título */}
        <Text style={styles.title}>Cartelera Digital</Text>
        <Text style={styles.subtitle}>Vinculación de Dispositivo</Text>

        {/* Display del código */}
        <View style={styles.codeDisplay}>
          {codeDisplay.map((char, i) => (
            <View
              key={i}
              style={[
                styles.codeChar,
                i < code.length && styles.codeCharFilled,
                i === code.length && styles.codeCharActive,
              ]}
            >
              <Text style={styles.codeCharText}>{char}</Text>
            </View>
          ))}
        </View>

        {/* Mensaje de estado */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>¡Vinculado correctamente!</Text>
          </View>
        )}

        {isLoading && (
          <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
        )}

        {/* Instrucción */}
        <Text style={styles.instruction}>
          Ingresa el código de 6 dígitos que aparece en el Panel de Control
        </Text>

        {/* Teclado virtual */}
        <View style={styles.keyboard}>
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keyboardRow}>
              {row.map((key) => (
                <Pressable
                  key={key}
                  style={[
                    styles.key,
                    key === '✓' && styles.keySubmit,
                    key === '⌫' && styles.keyDelete,
                  ]}
                  onPress={() => handleKeyPress(key)}
                >
                  <Text style={[
                    styles.keyText,
                    (key === '✓' || key === '⌫') && styles.keySpecialText,
                  ]}>
                    {key}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Input oculto para TV (maneja entrada de teclado físico) */}
      {IS_TV && (
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(text) => {
            const filtered = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (filtered.length <= 6) {
              setCode(filtered);
              setError(null);
            }
            if (filtered.length === 6) {
              // Auto-submit en TV cuando se ingresan 6 caracteres
              setTimeout(() => handleSubmit(), 300);
            }
          }}
          maxLength={6}
          autoFocus
          style={styles.hiddenInput}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    alignItems: 'center',
  },
  title: {
    fontSize: IS_TV ? tvScale(36) : 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: IS_TV ? tvScale(20) : 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 40,
  },
  codeDisplay: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  codeChar: {
    width: IS_TV ? tvScale(52) : 48,
    height: IS_TV ? tvScale(64) : 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  codeCharFilled: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  codeCharActive: {
    borderColor: '#60a5fa',
    borderStyle: 'dashed',
  },
  codeCharText: {
    fontSize: IS_TV ? tvScale(28) : 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#ef4444',
    fontSize: IS_TV ? tvScale(16) : 14,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  successText: {
    color: '#10b981',
    fontSize: IS_TV ? tvScale(18) : 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  loader: {
    marginBottom: 16,
  },
  instruction: {
    fontSize: IS_TV ? tvScale(16) : 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 350,
  },
  keyboard: {
    width: '100%',
    gap: 8,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  key: {
    width: IS_TV ? tvScale(48) : 40,
    height: IS_TV ? tvScale(48) : 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keySubmit: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  keyDelete: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  keyText: {
    fontSize: IS_TV ? tvScale(18) : 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  keySpecialText: {
    fontSize: IS_TV ? tvScale(20) : 18,
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});
```

### 5.4 Registro del Dispositivo Post-Vinculación

**Archivo: `src/services/device.service.ts`**

```typescript
import { Platform } from 'react-native';
import { getSupabase } from './supabase';
import { TABLES } from '../config/supabase.config';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const DEVICE_ID_KEY = 'device_id';
const DEVICE_KEY_KEY = 'device_key';

/**
 * Registra el dispositivo después de una vinculación exitosa.
 *
 * Actualiza en BD: status='online', software_version, ip_address, last_seen.
 * Guarda localmente: device_id en SecureStore para futuros inicios.
 *
 * @param deviceId - UUID del dispositivo obtenido del pairing
 * @returns true si se registró correctamente
 */
export async function registerDevice(deviceId: string): Promise<boolean> {
  const supabase = getSupabase();

  const updates = {
    status: 'online' as const,
    last_seen: new Date().toISOString(),
    software_version: `${Constants.expoConfig?.version ?? '1.0.0'} (Expo SDK ${Constants.expoConfig?.sdkVersion ?? '56'})`,
    ip_address: '', // Se podría obtener con expo-network, pero requiere permiso
  };

  const { error } = await supabase
    .from(TABLES.DEVICES)
    .update(updates)
    .eq('id', deviceId);

  if (error) {
    console.error('Error al registrar dispositivo:', error);
    return false;
  }

  // Guardar device_id localmente
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);

  return true;
}

/**
 * Obtiene el device_id guardado localmente.
 * @returns device_id o null si no está vinculado
 */
export async function getStoredDeviceId(): Promise<string | null> {
  return await SecureStore.getItemAsync(DEVICE_ID_KEY);
}

/**
 * Actualiza el estado del dispositivo en BD.
 * Usado por el heartbeat y cambios de contenido.
 */
export async function updateDeviceStatus(
  deviceId: string,
  updates: {
    status?: 'online' | 'offline' | 'idle' | 'playing';
    current_media_id?: string | null;
    current_playlist_id?: string | null;
    last_seen?: string;
  }
): Promise<boolean> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from(TABLES.DEVICES)
    .update(updates)
    .eq('id', deviceId);

  if (error) {
    console.error('Error al actualizar estado del dispositivo:', error);
    return false;
  }

  return true;
}

/**
 * Inserta un log de actividad del dispositivo.
 */
export async function insertDeviceLog(
  deviceId: string,
  eventType: 'online' | 'offline' | 'playing' | 'error' | 'sync' | 'restart',
  eventData?: Record<string, unknown>
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from(TABLES.DEVICE_LOGS)
    .insert({
      device_id: deviceId,
      event_type: eventType,
      event_data: eventData ?? null,
    });

  if (error) {
    console.error('Error al insertar log:', error);
  }
}
```

---

## 6. SISTEMA DE AUTENTICACIÓN ANÓNIMA POR DISPOSITIVO

### 6.1 Modelo de Auth

La app del TV **NO inicia sesión con usuario/contraseña**. En su lugar:

1. Al iniciar la app por primera vez, se genera un **ID de dispositivo anónimo** (UUID).
2. Este ID se guarda en `SecureStore` y se usa como identificador persistente.
3. La vinculación con `device_key` asocia este dispositivo físico con el registro en BD del panel web.
4. Para operaciones que requieren auth (consultas a BD con RLS), se usa **Supabase Anonymous Sign-In** (`signInAnonymously`).
5. Las políticas RLS en Supabase deben permitir acceso al dispositivo anónimo autenticado cuando el `device_id` coincide.

### 6.2 Implementación

**Archivo: `src/services/supabase.ts` — Sección de Auth Anónima**

```typescript
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const ANON_DEVICE_ID_KEY = 'anon_device_id';

/**
 * Inicia sesión anónima o recupera la sesión existente.
 * Cada dispositivo físico tiene un UUID anónimo persistente.
 *
 * @returns El user ID anónimo de Supabase Auth
 */
export async function signInAnonymously(): Promise<string> {
  const supabase = getSupabase();

  // Verificar si ya hay sesión
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    return session.user.id;
  }

  // Si no hay sesión, crear una nueva anónima
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    console.error('Error en signInAnonymously:', error);
    throw new Error('No se pudo autenticar el dispositivo: ' + error.message);
  }

  if (!data.user) {
    throw new Error('No se recibió usuario anónimo');
  }

  // Guardar ID de dispositivo anónimo localmente
  await SecureStore.setItemAsync(ANON_DEVICE_ID_KEY, data.user.id);

  return data.user.id;
}

/**
 * Obtiene el ID de dispositivo anónimo guardado.
 */
export async function getAnonymousDeviceId(): Promise<string | null> {
  return await SecureStore.getItemAsync(ANON_DEVICE_ID_KEY);
}
```

### 6.3 Política RLS para Dispositivos Anónimos

En Supabase SQL Editor, agregar política que permita a un dispositivo anónimo leer/actualizar su propio registro (identificado por `device_key` durante el pairing, luego por `id`):

```sql
-- Permitir que un dispositivo anónimo lea su propio registro
-- (durante el pairing, busca por device_key)
CREATE POLICY "Anonymous can read own device by key"
  ON devices FOR SELECT
  USING (true);  -- Permitir lectura para pairing (el código es el secreto)

-- Permitir que un dispositivo autenticado actualice su propio registro
-- (después del pairing, el dispositivo conoce su device_id)
CREATE POLICY "Device can update itself"
  ON devices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = devices.id
      -- Nota: Como es auth anónimo, no tenemos user_id.
      -- El device_id se guarda en SecureStore y se usa directamente.
      -- RLS se basa en que solo quien conoce el device_id puede actualizar.
    )
  );
```

---

## 7. MOTOR DE RENDERIZADO DE CONTENIDO (PLAYLIST ENGINE)

### 7.1 Servicio de Contenido

**Archivo: `src/services/content.service.ts`**

```typescript
import { getSupabase } from './supabase';
import { TABLES, BUCKETS } from '../config/supabase.config';
import type { PlaylistRow, MediaRow, PlaylistItem } from '../types/supabase.types';
import type { Announcement, MediaContent } from '../types';

/**
 * Obtiene el contenido asignado al dispositivo.
 *
 * Prioridad:
 * 1. Si hay schedule activo → usar playlist del schedule
 * 2. Si hay playlist asignada → usar playlist
 * 3. Si hay media asignado → reproducir media individual
 * 4. Si no hay nada → retornar null (estado idle)
 *
 * @param deviceId - UUID del dispositivo
 * @returns Announcement listo para renderizar, o null si no hay contenido
 */
export async function fetchDeviceContent(
  deviceId: string
): Promise<Announcement | null> {
  const supabase = getSupabase();

  // 1. Obtener info del dispositivo
  const { data: device } = await supabase
    .from(TABLES.DEVICES)
    .select('current_playlist_id, current_media_id')
    .eq('id', deviceId)
    .single();

  if (!device) return null;

  // 2. Revisar schedules activos primero
  const activeSchedule = await getActiveSchedule(deviceId);
  if (activeSchedule) {
    const playlist = await fetchPlaylistWithMedia(activeSchedule.playlist_id);
    if (playlist) {
      return convertPlaylistToAnnouncement(playlist, activeSchedule);
    }
  }

  // 3. Revisar playlist asignada al dispositivo
  if (device.current_playlist_id) {
    const playlist = await fetchPlaylistWithMedia(device.current_playlist_id);
    if (playlist) {
      return convertPlaylistToAnnouncement(playlist);
    }
  }

  // 4. Revisar media individual asignado
  if (device.current_media_id) {
    const { data: media } = await supabase
      .from(TABLES.MEDIA)
      .select('*')
      .eq('id', device.current_media_id)
      .single();

    if (media) {
      return convertMediaToAnnouncement(media as MediaRow);
    }
  }

  // 5. Sin contenido
  return null;
}

/**
 * Obtiene una playlist con los datos completos de cada media item.
 */
async function fetchPlaylistWithMedia(
  playlistId: string
): Promise<(PlaylistRow & { mediaItems: MediaRow[] }) | null> {
  const supabase = getSupabase();

  // Obtener la playlist
  const { data: playlist, error } = await supabase
    .from(TABLES.PLAYLISTS)
    .select('*')
    .eq('id', playlistId)
    .single();

  if (error || !playlist) {
    console.error('Error fetching playlist:', error);
    return null;
  }

  const pl = playlist as PlaylistRow;

  // Obtener todos los media referenciados en items
  const mediaIds = pl.items.map((item: PlaylistItem) => item.media_id);

  if (mediaIds.length === 0) {
    return { ...pl, mediaItems: [] };
  }

  const { data: mediaData, error: mediaError } = await supabase
    .from(TABLES.MEDIA)
    .select('*')
    .in('id', mediaIds);

  if (mediaError) {
    console.error('Error fetching media for playlist:', mediaError);
    return { ...pl, mediaItems: [] };
  }

  // Ordenar según el orden de la playlist
  const mediaMap = new Map(
    (mediaData as MediaRow[]).map(m => [m.id, m])
  );
  const orderedMedia = pl.items
    .sort((a: PlaylistItem, b: PlaylistItem) => a.order - b.order)
    .map((item: PlaylistItem) => mediaMap.get(item.media_id))
    .filter((m): m is MediaRow => m !== undefined);

  return { ...pl, mediaItems: orderedMedia };
}

// ── CONVERSORES: Supabase Types → App Types ──────────────────────

/**
 * Convierte una playlist de Supabase en un Announcement para el motor de renderizado.
 */
function convertPlaylistToAnnouncement(
  playlist: PlaylistRow & { mediaItems: MediaRow[] },
  schedule?: import('../types/supabase.types').ScheduleRow
): Announcement {
  const videoItems = playlist.mediaItems.filter(m => m.type === 'video');
  const imageItems = playlist.mediaItems.filter(m => m.type === 'image');

  return {
    id: playlist.id,
    title: playlist.name,
    description: playlist.description ?? undefined,
    date: playlist.updated_at.split('T')[0],
    backgroundColor: schedule ? '#0f1a2e' : '#0f0f23',
    layoutId: schedule ? 'story-full' : 'video-left-wide',
    content: {
      video: videoItems.map(m => ({
        type: 'video' as const,
        url: m.url,
        title: m.name,
        durationMs: (m.duration ?? 10) * 1000,
        posterUrl: m.thumbnail_url ?? undefined,
      })),
      story: imageItems.map(m => ({
        type: 'image-story' as const,
        url: m.url,
        title: m.name,
        durationMs: (m.duration ?? 8) * 1000,
      })),
    },
  };
}

/**
 * Convierte un media individual en un Announcement.
 */
function convertMediaToAnnouncement(media: MediaRow): Announcement {
  const isVideo = media.type === 'video';

  return {
    id: media.id,
    title: media.name,
    description: undefined,
    date: media.created_at.split('T')[0],
    backgroundColor: '#0f0f23',
    layoutId: isVideo ? 'video-left-wide' : 'story-full',
    content: {
      video: isVideo
        ? [{
            type: 'video' as const,
            url: media.url,
            title: media.name,
            durationMs: (media.duration ?? 10) * 1000,
            posterUrl: media.thumbnail_url ?? undefined,
          }]
        : [],
      story: !isVideo
        ? [{
            type: 'image-story' as const,
            url: media.url,
            title: media.name,
            durationMs: (media.duration ?? 8) * 1000,
          }]
        : [],
    },
  };
}

/**
 * Obtiene el schedule activo para el dispositivo en este momento.
 */
async function getActiveSchedule(
  deviceId: string
): Promise<import('../types/supabase.types').ScheduleRow | null> {
  const supabase = getSupabase();
  const now = new Date();

  const { data, error } = await supabase
    .from(TABLES.SCHEDULES)
    .select('*')
    .contains('device_ids', [deviceId])
    .eq('is_active', true)
    .lte('start_date', now.toISOString())
    .gte('end_date', now.toISOString())
    .order('priority', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const schedule = data[0] as import('../types/supabase.types').ScheduleRow;

  // Verificar día de la semana
  const currentDay = now.getDay(); // 0=Dom, 6=Sab
  if (!schedule.days_of_week.includes(currentDay)) {
    return null;
  }

  // Verificar hora del día
  const currentTime = now.toTimeString().slice(0, 8); // "HH:MM:SS"
  if (currentTime < schedule.start_time || currentTime > schedule.end_time) {
    return null;
  }

  return schedule;
}
```

### 7.2 Hook de Contenido

**Archivo: `src/hooks/useContent.ts`**

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDeviceContent } from '../services/content.service';
import type { Announcement } from '../types';

interface UseContentResult {
  announcement: Announcement | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook que gestiona el contenido actual del dispositivo.
 *
 * - Carga el contenido al montar
 * - Expone función refresh para recargar (ej: al recibir comando sync)
 * - Maneja estados de loading, error, y vacío (idle)
 */
export function useContent(deviceId: string | null): UseContentResult {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadContent = useCallback(async () => {
    if (!deviceId) {
      setIsLoading(false);
      setError('Dispositivo no vinculado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const content = await fetchDeviceContent(deviceId);

      if (!mountedRef.current) return;

      if (content) {
        setAnnouncement(content);
        setError(null);
      } else {
        setAnnouncement(null);
        setError(null); // No es error, es estado idle (sin contenido asignado)
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error cargando contenido:', message);
      setError(message);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [deviceId]);

  // Cargar al montar y cuando cambia deviceId
  useEffect(() => {
    mountedRef.current = true;
    loadContent();
    return () => { mountedRef.current = false; };
  }, [loadContent]);

  return {
    announcement,
    isLoading,
    error,
    refresh: loadContent,
  };
}
```

### 7.3 Temporizador de Rotación de Playlist Items

Dentro del componente `Billboard.tsx` (o su equivalente para playlists), cuando el anuncio viene de una playlist con múltiples items, se necesita un temporizador que rote entre los items. Esto puede implementarse en el hook `useContent` o como un hook separado `usePlaylistTimer`:

```typescript
// src/hooks/usePlaylistTimer.ts
import { useState, useEffect, useRef } from 'react';
import type { PlaylistItem } from '../types/supabase.types';

interface UsePlaylistTimerResult {
  currentItemIndex: number;
  isTransitioning: boolean;
}

export function usePlaylistTimer(
  items: PlaylistItem[],
  isActive: boolean,
  isLoop: boolean
): UsePlaylistTimerResult {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive || items.length === 0) return;

    const currentItem = items[currentItemIndex];
    if (!currentItem) return;

    const duration = (currentItem.duration || 10) * 1000;

    timerRef.current = setTimeout(() => {
      setIsTransitioning(true);

      // Breve delay para transición
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentItemIndex(prev => {
          const next = prev + 1;
          if (next >= items.length) {
            return isLoop ? 0 : prev; // Si no es loop, quedarse en el último
          }
          return next;
        });
      }, 500); // 500ms para la transición

    }, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [currentItemIndex, isActive, items, isLoop]);

  return { currentItemIndex, isTransitioning };
}
```

---

## 8. SISTEMA DE PLANTILLAS (LAYOUTS) — SOLO 2 MODOS ACTIVOS

### 8.1 Estado Actual (Confirmado)

Los layouts activos son EXACTAMENTE estos dos, definidos en `src/components/layouts/layouts.ts`:

```typescript
// Layout 1: Video Ancho (75%) + Historia Estrecha (25%)
{
  id: 'video-left-wide',
  name: 'Video Ancho / Historia Estrecha',
  icon: '📺',
  direction: 'row',
  areas: [
    { id: 'video', type: 'video', flex: 75, style: { borderRadius: 8, padding: 4 } },
    { id: 'story', type: 'story', flex: 25, direction: 'column', style: { borderRadius: 8, padding: 4 } },
  ],
}

// Layout 2: Historia Pantalla Completa
{
  id: 'story-full',
  name: 'Historia Pantalla Completa',
  icon: '🖼️',
  direction: 'row',
  areas: [
    { id: 'story', type: 'story', flex: 1, direction: 'column', style: { borderRadius: 0, padding: 0 } },
  ],
}
```

### 8.2 Correspondencia Contenido Supabase → Layouts

```
┌──────────────────────────────────────────────────────────┐
│  CONTENIDO DESDE SUPABASE                                │
│                                                          │
│  Media type = 'video'                                    │
│    → Usar layout: 'video-left-wide'                      │
│    → Área 'video': el video                             │
│    → Área 'story': vacía (placeholder)                   │
│                                                          │
│  Media type = 'image' (multiple)                         │
│    → Usar layout: 'story-full'                           │
│    → Área 'story': todas las imágenes en secuencia       │
│                                                          │
│  Playlist con videos + imágenes                         │
│    → Usar layout: 'video-left-wide'                      │
│    → Área 'video': primer video de la playlist           │
│    → Área 'story': imágenes en carrusel vertical         │
│                                                          │
│  Playlist solo imágenes                                 │
│    → Usar layout: 'story-full'                           │
│    → Área 'story': todas las imágenes                    │
│                                                          │
│  Schedule activo con playlist                           │
│    → Igual que playlist, según contenido                 │
└──────────────────────────────────────────────────────────┘
```

### 8.3 Lógica de Selección de Layout (en Billboard.tsx)

```typescript
/**
 * Determina qué layout usar basado en el contenido disponible.
 *
 * Reglas:
 * - Si hay videos + imágenes → video-left-wide (75/25)
 * - Si solo hay videos → video-left-wide (video solo, 100% efectivo)
 * - Si solo hay imágenes → story-full
 * - Si no hay contenido → layout por defecto (video-left-wide con placeholder)
 */
function selectLayout(announcement: Announcement): string {
  const hasVideo = announcement.content.video?.length > 0;
  const hasStory = announcement.content.story?.length > 0;

  if (hasStory && !hasVideo) {
    return 'story-full';
  }

  // Default: video-left-wide (funciona con solo video también)
  return 'video-left-wide';
}
```

### 8.4 Modo de Alternancia Manual (Toggle)

El comportamiento actual de `Billboard.tsx` donde el usuario toca/SELECT para alternar entre layouts se mantiene. La diferencia es que ahora:

1. El layout por defecto lo determina el contenido (reglas arriba).
2. El usuario puede alternar manualmente al otro layout con toque/SELECT.
3. Si el contenido solo tiene imágenes, alternar a `video-left-wide` mostrará el área de video vacía y el story completo. Esto es aceptable.
4. Si el contenido tiene ambos, alternar a `story-full` mostrará solo las imágenes (sin video).

---

## 9. COMUNICACIÓN EN TIEMPO REAL (SUPABASE REALTIME)

### 9.1 Canales y Eventos

```
┌─────────────────────────────────────────────────────────┐
│               CANALES REALTIME                           │
│                                                          │
│  Canal: device:{deviceId}:control                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Evento: command                                   │   │
│  │ Payload: {                                        │   │
│  │   command: 'play' | 'pause' | 'sync' |           │   │
│  │            'restart' | 'update_settings',         │   │
│  │   media_id?: string,                              │   │
│  │   playlist_id?: string,                           │   │
│  │   settings?: Record<string, unknown>,             │   │
│  │   timestamp: string                               │   │
│  │ }                                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Canal: device:{deviceId}:status (broadcast desde app)   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Evento: heartbeat                                 │   │
│  │ Payload: {                                        │   │
│  │   status: 'online' | 'playing' | 'idle',         │   │
│  │   current_media_id?: string,                      │   │
│  │   timestamp: string                               │   │
│  │ }                                                 │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Evento: screenshot (opcional)                     │   │
│  │ Payload: {                                        │   │
│  │   image_url: string (base64 o URL Storage)        │   │
│  │ }                                                 │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Evento: log                                       │   │
│  │ Payload: {                                        │   │
│  │   event_type: string,                             │   │
│  │   event_data: Record<string, unknown>             │   │
│  │ }                                                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Servicio de Realtime

**Archivo: `src/services/realtime.service.ts`**

```typescript
import { getSupabase } from './supabase';
import { REALTIME_CHANNELS } from '../config/supabase.config';
import type { RealtimeChannel } from '@supabase/supabase-js';

type CommandHandler = (command: DeviceCommand) => void;

export interface DeviceCommand {
  command: 'play' | 'pause' | 'sync' | 'restart' | 'update_settings';
  media_id?: string;
  playlist_id?: string;
  settings?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Se suscribe al canal de comandos del dispositivo.
 *
 * @param deviceId - UUID del dispositivo
 * @param onCommand - Callback que recibe cada comando
 * @returns Función para cancelar suscripción
 */
export function subscribeToCommands(
  deviceId: string,
  onCommand: CommandHandler
): () => void {
  const supabase = getSupabase();
  const channelName = REALTIME_CHANNELS.DEVICE_CONTROL(deviceId);

  const channel: RealtimeChannel = supabase
    .channel(channelName)
    .on('broadcast', { event: 'command' }, (payload) => {
      const command = payload.payload as DeviceCommand;
      console.log(`[Realtime] Comando recibido: ${command.command}`, command);
      onCommand(command);
    })
    .subscribe((status) => {
      console.log(`[Realtime] Canal ${channelName} status:`, status);
    });

  // Retornar función de cleanup
  return () => {
    console.log(`[Realtime] Cerrando canal ${channelName}`);
    supabase.removeChannel(channel);
  };
}

/**
 * Envía un heartbeat al canal de estado del dispositivo.
 * Esto notifica al panel web que el dispositivo sigue vivo.
 */
export async function sendHeartbeat(
  deviceId: string,
  status: 'online' | 'playing' | 'idle',
  currentMediaId?: string
): Promise<void> {
  const supabase = getSupabase();
  const channelName = REALTIME_CHANNELS.DEVICE_STATUS(deviceId);

  await supabase.channel(channelName).send({
    type: 'broadcast',
    event: 'heartbeat',
    payload: {
      status,
      current_media_id: currentMediaId ?? null,
      timestamp: new Date().toISOString(),
    },
  });
}
```

### 9.3 Hook de Realtime

**Archivo: `src/hooks/useRealtime.ts`**

```typescript
import { useEffect, useRef } from 'react';
import { subscribeToCommands, type DeviceCommand } from '../services/realtime.service';
import { updateDeviceStatus } from '../services/device.service';

interface UseRealtimeOptions {
  deviceId: string | null;
  onSync: () => void;            // Se llama al recibir comando 'sync'
  onRestart: () => void;         // Se llama al recibir comando 'restart'
  onPlay: (mediaId?: string) => void;
  onPause: () => void;
  onUpdateSettings: (settings: Record<string, unknown>) => void;
}

/**
 * Hook que gestiona la suscripción Realtime a comandos del panel web.
 * Se subscribe/desubscribe automáticamente según deviceId.
 */
export function useRealtime({
  deviceId,
  onSync,
  onRestart,
  onPlay,
  onPause,
  onUpdateSettings,
}: UseRealtimeOptions): void {
  const handlersRef = useRef({ onSync, onRestart, onPlay, onPause, onUpdateSettings });
  handlersRef.current = { onSync, onRestart, onPlay, onPause, onUpdateSettings };

  useEffect(() => {
    if (!deviceId) return;

    const handleCommand = (command: DeviceCommand) => {
      switch (command.command) {
        case 'sync':
          handlersRef.current.onSync();
          break;
        case 'restart':
          handlersRef.current.onRestart();
          break;
        case 'play':
          handlersRef.current.onPlay(command.media_id);
          break;
        case 'pause':
          handlersRef.current.onPause();
          break;
        case 'update_settings':
          if (command.settings) {
            handlersRef.current.onUpdateSettings(command.settings);
          }
          break;
        default:
          console.warn('[Realtime] Comando desconocido:', command.command);
      }
    };

    const unsubscribe = subscribeToCommands(deviceId, handleCommand);

    return () => {
      unsubscribe();
    };
  }, [deviceId]);
}
```

---

## 10. SISTEMA DE HEARTBEAT Y MONITOREO

### 10.1 Servicio de Heartbeat

**Archivo: `src/services/heartbeat.service.ts`**

```typescript
import { updateDeviceStatus, insertDeviceLog } from './device.service';
import { sendHeartbeat } from './realtime.service';

interface HeartbeatState {
  status: 'online' | 'playing' | 'idle';
  currentMediaId?: string;
}

let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
let currentState: HeartbeatState = { status: 'online' };

/**
 * Inicia el heartbeat periódico.
 *
 * Cada 30 segundos:
 * 1. Actualiza 'last_seen' y 'status' en tabla devices
 * 2. Envía broadcast al canal de status
 *
 * @param deviceId - UUID del dispositivo
 */
export function startHeartbeat(deviceId: string): void {
  // Detener heartbeat previo si existe
  stopHeartbeat();

  // Primer heartbeat inmediato
  sendHeartbeatNow(deviceId);

  // Heartbeat periódico cada 30 segundos
  heartbeatIntervalId = setInterval(() => {
    sendHeartbeatNow(deviceId);
  }, 30_000);
}

/**
 * Detiene el heartbeat (ej: al desvincular o cerrar).
 */
export function stopHeartbeat(): void {
  if (heartbeatIntervalId !== null) {
    clearInterval(heartbeatIntervalId);
    heartbeatIntervalId = null;
  }
}

/**
 * Actualiza el estado que se reporta en el heartbeat.
 * Llama a esto cuando el dispositivo empieza/pausa reproducción.
 */
export function updateHeartbeatState(state: Partial<HeartbeatState>): void {
  currentState = { ...currentState, ...state };
}

async function sendHeartbeatNow(deviceId: string): Promise<void> {
  try {
    // 1. Actualizar en BD
    await updateDeviceStatus(deviceId, {
      status: currentState.status,
      current_media_id: currentState.currentMediaId ?? undefined,
      last_seen: new Date().toISOString(),
    });

    // 2. Broadcast al canal de status
    await sendHeartbeat(
      deviceId,
      currentState.status,
      currentState.currentMediaId
    );
  } catch (error) {
    console.error('[Heartbeat] Error:', error);
  }
}
```

### 10.2 Hook de Heartbeat

**Archivo: `src/hooks/useHeartbeat.ts`**

```typescript
import { useEffect, useRef } from 'react';
import { startHeartbeat, stopHeartbeat, updateHeartbeatState } from '../services/heartbeat.service';

interface UseHeartbeatOptions {
  deviceId: string | null;
  isPlaying: boolean;
  currentMediaId?: string;
}

/**
 * Hook que inicia/detiene el heartbeat automáticamente.
 * También actualiza el estado cuando cambia isPlaying o currentMediaId.
 */
export function useHeartbeat({ deviceId, isPlaying, currentMediaId }: UseHeartbeatOptions): void {
  const prevStateRef = useRef({ isPlaying, currentMediaId });

  useEffect(() => {
    if (!deviceId) return;

    // Iniciar heartbeat
    startHeartbeat(deviceId);

    return () => {
      stopHeartbeat();
    };
  }, [deviceId]);

  // Actualizar estado del heartbeat cuando cambia reproducción
  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev.isPlaying !== isPlaying || prev.currentMediaId !== currentMediaId) {
      prevStateRef.current = { isPlaying, currentMediaId };
      updateHeartbeatState({
        status: isPlaying ? 'playing' : 'idle',
        currentMediaId,
      });
    }
  }, [isPlaying, currentMediaId]);
}
```

---

## 11. RESOLUCIÓN DE PROGRAMACIONES (SCHEDULES)

### 11.1 Servicio de Schedules

**Archivo: `src/services/schedule.service.ts`**

```typescript
import { getSupabase } from './supabase';
import { TABLES } from '../config/supabase.config';
import type { ScheduleRow } from '../types/supabase.types';

interface ActiveScheduleResult {
  activeSchedule: ScheduleRow | null;
  playlistId: string | null;
}

/**
 * Consulta si hay un schedule activo AHORA para este dispositivo.
 *
 * Lógica:
 * 1. Buscar schedules que incluyan este device_id
 * 2. Que estén activos (is_active = true)
 * 3. Que la fecha actual esté dentro de [start_date, end_date]
 * 4. Que el día de la semana coincida
 * 5. Que la hora actual esté dentro de [start_time, end_time]
 * 6. Ordenar por prioridad descendente, tomar el primero
 *
 * @param deviceId - UUID del dispositivo
 * @returns Schedule activo o null
 */
export async function resolveActiveSchedule(
  deviceId: string
): Promise<ActiveScheduleResult> {
  const supabase = getSupabase();
  const now = new Date();

  const { data, error } = await supabase
    .from(TABLES.SCHEDULES)
    .select('*')
    .contains('device_ids', [deviceId])
    .eq('is_active', true)
    .lte('start_date', now.toISOString())
    .gte('end_date', now.toISOString())
    .order('priority', { ascending: false })
    .limit(5); // Traer varios por si hay que filtrar por día/hora

  if (error) {
    console.error('[Schedule] Error al consultar:', error);
    return { activeSchedule: null, playlistId: null };
  }

  if (!data || data.length === 0) {
    return { activeSchedule: null, playlistId: null };
  }

  const schedules = data as ScheduleRow[];
  const currentDay = now.getDay(); // 0=Dom..6=Sab
  const currentTime = now.toTimeString().slice(0, 8); // "HH:MM:SS"

  // Filtrar por día de la semana y hora
  const activeSchedule = schedules.find(schedule => {
    const dayMatch = schedule.days_of_week.includes(currentDay);
    const timeMatch =
      currentTime >= schedule.start_time &&
      currentTime <= schedule.end_time;
    return dayMatch && timeMatch;
  });

  if (!activeSchedule) {
    return { activeSchedule: null, playlistId: null };
  }

  return {
    activeSchedule,
    playlistId: activeSchedule.playlist_id,
  };
}

/**
 * Verifica si un schedule sigue activo en este momento.
 * Útil para detectar cuándo terminó un schedule y hay que volver
 * al contenido por defecto.
 */
export function isScheduleStillActive(schedule: ScheduleRow): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.toTimeString().slice(0, 8);

  const nowStr = now.toISOString();

  return (
    schedule.is_active &&
    schedule.start_date <= nowStr &&
    schedule.end_date >= nowStr &&
    schedule.days_of_week.includes(currentDay) &&
    currentTime >= schedule.start_time &&
    currentTime <= schedule.end_time
  );
}
```

### 11.2 Hook de Schedule

**Archivo: `src/hooks/useSchedule.ts`**

```typescript
import { useState, useEffect, useRef } from 'react';
import { resolveActiveSchedule, isScheduleStillActive } from '../services/schedule.service';
import type { ScheduleRow } from '../types/supabase.types';

interface UseScheduleResult {
  activeSchedule: ScheduleRow | null;
  isScheduleActive: boolean;
  playlistId: string | null;
}

/**
 * Hook que monitorea programaciones activas.
 *
 * - Consulta al montar
 * - Re-consulta cada 60 segundos
 * - Cuando un schedule termina, notifica (isScheduleActive → false)
 */
export function useSchedule(deviceId: string | null): UseScheduleResult {
  const [activeSchedule, setActiveSchedule] = useState<ScheduleRow | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!deviceId) return;

    const check = async () => {
      const result = await resolveActiveSchedule(deviceId);
      setActiveSchedule(result.activeSchedule);
    };

    // Consulta inicial
    check();

    // Re-consulta cada minuto
    intervalRef.current = setInterval(check, 60_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [deviceId]);

  const isScheduleActive = activeSchedule !== null &&
    isScheduleStillActive(activeSchedule);

  return {
    activeSchedule,
    isScheduleActive,
    playlistId: activeSchedule?.playlist_id ?? null,
  };
}
```

---

## 12. MODO OFFLINE Y CACHÉ LOCAL

### 12.1 Estrategia de Caché

```
┌─────────────────────────────────────────────────────────┐
│                ESTRATEGIA DE CACHÉ                       │
│                                                          │
│  NIVEL 1: AsyncStorage (metadatos)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • Último device_id vinculado                     │   │
│  │ • Último Announcement/playlist recibido           │   │
│  │ • URLs de media del contenido actual              │   │
│  │ • Timestamp de última sincronización              │   │
│  │ • Configuración del dispositivo (brillo, etc.)    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  NIVEL 2: expo-file-system (archivos media)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │ • Imágenes descargadas localmente                 │   │
│  │ • Videos NO (demasiado grandes para TV box)      │   │
│  │ • Estructura: file:///cache/media/{media_id}.ext  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  COMPORTAMIENTO OFFLINE:                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 1. Detectar pérdida de red (useNetworkStatus)    │   │
│  │ 2. Cargar último Announcement del caché           │   │
│  │ 3. Para imágenes: usar archivo local si existe    │   │
│  │ 4. Para videos: placeholder "Sin conexión"        │   │
│  │ 5. Mostrar ConnectionBanner sutil                  │   │
│  │ 6. Al recuperar red → refrescar contenido         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 12.2 Servicio de Caché

**Archivo: `src/services/cache.service.ts`**

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Announcement } from '../types';

const CACHE_KEYS = {
  LAST_ANNOUNCEMENT: 'cache:last_announcement',
  LAST_DEVICE_ID: 'cache:last_device_id',
  LAST_SYNC_TIMESTAMP: 'cache:last_sync',
  DEVICE_SETTINGS: 'cache:device_settings',
} as const;

/**
 * Guarda el último anuncio en caché local.
 */
export async function cacheAnnouncement(announcement: Announcement): Promise<void> {
  try {
    const data = JSON.stringify(announcement);
    await AsyncStorage.setItem(CACHE_KEYS.LAST_ANNOUNCEMENT, data);
    await AsyncStorage.setItem(
      CACHE_KEYS.LAST_SYNC_TIMESTAMP,
      new Date().toISOString()
    );
  } catch (error) {
    console.error('[Cache] Error guardando anuncio:', error);
  }
}

/**
 * Recupera el último anuncio cacheado.
 * @returns Announcement o null si no hay caché
 */
export async function getCachedAnnouncement(): Promise<Announcement | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.LAST_ANNOUNCEMENT);
    if (!raw) return null;
    return JSON.parse(raw) as Announcement;
  } catch (error) {
    console.error('[Cache] Error leyendo anuncio:', error);
    return null;
  }
}

/**
 * Guarda configuración del dispositivo (brillo, volumen, etc.).
 */
export async function cacheDeviceSettings(
  settings: Record<string, unknown>
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_KEYS.DEVICE_SETTINGS,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.error('[Cache] Error guardando settings:', error);
  }
}

/**
 * Recupera configuración del dispositivo.
 */
export async function getCachedDeviceSettings(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEYS.DEVICE_SETTINGS);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    console.error('[Cache] Error leyendo settings:', error);
    return null;
  }
}

/**
 * Limpia toda la caché (útil al desvincular).
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = Object.values(CACHE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('[Cache] Error limpiando caché:', error);
  }
}
```

---

## 13. MANEJO DE ERRORES Y ESTADOS

### 13.1 Estados de la App

```
┌─────────────────────────────────────────────────────────┐
│              ESTADOS DE LA APLICACIÓN                    │
│                                                          │
│  UNPAIRED        → Sin vincular (primera ejecución)      │
│  PAIRING         → En pantalla de vinculación            │
│  LOADING         → Cargando contenido desde Supabase     │
│  PLAYING         → Reproduciendo contenido normalmente   │
│  IDLE            → Vinculado pero sin contenido asignado │
│  OFFLINE_PLAYING → Sin red, mostrando contenido cacheado │
│  OFFLINE_IDLE    → Sin red y sin caché                   │
│  ERROR           → Error irrecuperable                   │
│  RESTARTING      → Reiniciando (comando del panel)       │
└─────────────────────────────────────────────────────────┘
```

### 13.2 Pantalla de Error

**Archivo: `src/app/error.tsx`**

```typescript
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { IS_TV, tvScale } from '../utils/tv';

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      } else {
        router.replace('/playback');
      }
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠</Text>
      <Text style={styles.title}>Error de conexión</Text>
      <Text style={styles.message}>
        {message ?? 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'}
      </Text>
      <Pressable
        style={styles.retryButton}
        onPress={handleRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.retryText}>Reintentar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: IS_TV ? tvScale(28) : 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  message: {
    fontSize: IS_TV ? tvScale(16) : 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 400,
    lineHeight: IS_TV ? tvScale(24) : 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  retryText: {
    color: '#ffffff',
    fontSize: IS_TV ? tvScale(18) : 16,
    fontWeight: '600',
  },
});
```

### 13.3 Banner de Conectividad

**Archivo: `src/components/ConnectionBanner.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { IS_TV, tvScale } from '../utils/tv';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function ConnectionBanner() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const [visible, setVisible] = useState(false);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (!isConnected || !isInternetReachable) {
      setVisible(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isConnected, isInternetReachable]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, { opacity }]}>
      <Text style={styles.text}>
        Sin conexión — Mostrando contenido guardado
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingVertical: IS_TV ? 6 : 4,
    paddingHorizontal: 16,
    zIndex: 100,
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: IS_TV ? tvScale(14) : 12,
    fontWeight: '600',
  },
});
```

---

## 14. PLAN DE IMPLEMENTACIÓN POR FASES (DETALLADO)

### FASE 1: FUNDACIÓN (Semana 1-2)

#### Objetivo: Estructura base y Supabase conectado

**Tareas — Día 1-2: Configuración**
1. [ ] Agregar dependencias a `package.json`:
   - `@supabase/supabase-js`
   - `expo-secure-store`
   - `expo-network`
   - `@react-native-async-storage/async-storage`
   - `expo-crypto`
   - `expo-file-system`
   - `expo-keep-awake`
2. [ ] Ejecutar `npx expo install` para instalar versiones compatibles con SDK 56.
3. [ ] Ejecutar `npx expo install --fix` para validar compatibilidad de dependencias.
4. [ ] Crear archivo `src/config/supabase.config.ts` con URL y anon key.
5. [ ] Crear archivo `src/config/constants.ts` con intervalos y timeouts.
6. [ ] Crear archivo `src/services/supabase.ts` con inicialización del cliente.
7. [ ] Crear archivo `src/types/supabase.types.ts` con todas las interfaces de DB.
8. [ ] Configurar proyecto Supabase:
   - Ejecutar `supabase-schema.sql` para crear tablas.
   - Configurar políticas RLS.
   - Crear buckets de Storage (`media`, `thumbnails`).
   - Habilitar Realtime en las tablas necesarias.

**Tareas — Día 3-4: Auth Anónima y Vinculación**
9. [ ] Implementar `signInAnonymously()` en `supabase.ts`.
10. [ ] Probar flujo de auth anónima (sign in + get session + refresh).
11. [ ] Crear `src/hooks/useSupabase.ts` (contexto/provider o simple hook).
12. [ ] Crear `src/services/pairing.service.ts` (función `pairDevice`).
13. [ ] Crear `src/services/device.service.ts` (funciones `registerDevice`, `updateDeviceStatus`, `insertDeviceLog`, `getStoredDeviceId`).
14. [ ] Crear `src/components/PairingScreen.tsx` (teclado numérico virtual + input TV).
15. [ ] Crear ruta `src/app/pairing.tsx` que renderiza `PairingScreen`.
16. [ ] Probar flujo de pairing:
    - Insertar un dispositivo manualmente en Supabase con un `device_key`.
    - Ingresar el código en la app.
    - Verificar que `registerDevice` actualiza el registro en BD.
    - Verificar que `device_id` se guarda en SecureStore.

**Tareas — Día 5-6: Navegación y Estados de App**
17. [ ] Modificar `src/app/index.tsx` para redirigir según estado:
    - Si no hay `device_id` en SecureStore → redirigir a `/pairing`.
    - Si hay `device_id` → redirigir a `/playback`.
18. [ ] Crear `src/app/playback.tsx` (pantalla principal de reproducción).
19. [ ] Crear `src/app/error.tsx` (pantalla de error con reintento).
20. [ ] Modificar `src/app/_layout.tsx`:
    - Agregar `<Stack.Screen name="pairing" />`.
    - Agregar `<Stack.Screen name="playback" />`.
    - Agregar `<Stack.Screen name="error" />`.
21. [ ] Probar navegación completa:
    - Primera ejecución → pairing.
    - Pairing exitoso → playback.
    - Error de red → error (desde playback).
    - Reintento → playback.

**Tareas — Día 7: Hook de Red**
22. [ ] Crear `src/hooks/useNetworkStatus.ts` usando `expo-network`.
23. [ ] Crear `src/components/ConnectionBanner.tsx`.
24. [ ] Integrar banner en `playback.tsx`.
25. [ ] Probar detección de conectividad:
    - Activar/desactivar WiFi en el dispositivo.
    - Verificar que el banner aparece/desaparece.

**Validación Fase 1:**
- App inicia → muestra pairing.
- Ingresar código válido → navega a playback.
- Playback muestra placeholder "Sin contenido" (IDLE state).
- Desconectar WiFi → aparece banner rojo.
- Reconectar → desaparece banner.

---

### FASE 2: CORE — CONTENIDO Y REPRODUCCIÓN (Semana 3-4)

#### Objetivo: La app recibe y reproduce contenido desde Supabase

**Tareas — Día 1-3: Servicio de Contenido**
26. [ ] Crear `src/services/content.service.ts`:
    - `fetchDeviceContent(deviceId)` — obtiene playlist/media asignado.
    - `fetchPlaylistWithMedia(playlistId)` — expande items de playlist con datos de media.
    - `convertPlaylistToAnnouncement()` — transforma datos Supabase a tipo `Announcement`.
    - `convertMediaToAnnouncement()` — transforma media individual.
27. [ ] Crear `src/hooks/useContent.ts`:
    - `loadContent()` — llama a `fetchDeviceContent`.
    - Estados: `announcement`, `isLoading`, `error`.
    - `refresh()` — recarga contenido (usado por comando sync).
28. [ ] Probar fetch de contenido:
    - Insertar manualmente un media en Supabase (vía panel web o SQL).
    - Asignarlo al dispositivo (`current_media_id`).
    - Verificar que la app carga y muestra el título del media (modo debug/texto).

**Tareas — Día 4-5: Integración con Billboard**
29. [ ] Modificar `src/components/Billboard.tsx`:
    - Eliminar importación de `ANNOUNCEMENTS` locales.
    - Recibir `announcement: Announcement | null` como prop.
    - Si `announcement === null` → mostrar estado IDLE ("Sin contenido asignado").
    - Si `announcement` tiene contenido → renderizar `BillboardSlide`.
30. [ ] Modificar `src/components/BillboardSlide.tsx` (si es necesario):
    - Aceptar el announcement desde Supabase (misma interfaz `Announcement`).
    - Verificar que los IDs de área (`video`, `story`) coinciden con los layouts.
31. [ ] Integrar en `src/app/playback.tsx`:
    - Obtener `deviceId` de SecureStore con `getStoredDeviceId()`.
    - Usar `useContent(deviceId)` para obtener el contenido.
    - Pasar `announcement` a `Billboard`.
    - Manejar estados: loading → spinner, error → ErrorScreen, idle → EmptyState.
32. [ ] Probar reproducción:
    - Subir una imagen a Supabase Storage vía panel web.
    - Asignarla al dispositivo.
    - Verificar que la imagen se renderiza en la app.
    - Subir un video → verificar que se reproduce con expo-video.
    - Asignar playlist con 3 imágenes → verificar rotación.

**Tareas — Día 6-7: Caché Offline**
33. [ ] Crear `src/services/cache.service.ts`:
    - `cacheAnnouncement(announcement)` — guarda en AsyncStorage.
    - `getCachedAnnouncement()` — recupera.
    - `cacheDeviceSettings(settings)` — guarda config.
    - `getCachedDeviceSettings()` — recupera config.
    - `clearAllCache()` — limpia todo.
34. [ ] Modificar `src/hooks/useContent.ts`:
    - Al cargar exitosamente → llamar `cacheAnnouncement()`.
    - Si falla la carga (sin red) → cargar `getCachedAnnouncement()`.
35. [ ] Integrar modo offline en `playback.tsx`:
    - Si `useContent` devuelve datos cacheados + `isConnected === false` → mostrar `ConnectionBanner`.
    - Si no hay caché y no hay red → mostrar ErrorScreen con mensaje específico.
36. [ ] Probar modo offline:
    - Cargar contenido normalmente.
    - Desconectar WiFi.
    - Verificar que el contenido sigue visible (caché).
    - Verificar que aparece el banner rojo.

**Validación Fase 2:**
- Panel web asigna imagen → app la muestra.
- Panel web asigna video → app lo reproduce.
- Panel web asigna playlist → app rota entre items.
- Sin conexión → app muestra último contenido cacheado.
- Sin contenido asignado → app muestra estado IDLE.

---

### FASE 3: TIEMPO REAL Y MONITOREO (Semana 5-6)

#### Objetivo: Comunicación bidireccional en vivo y reporting

**Tareas — Día 1-2: Realtime (Comandos del Panel)**
37. [ ] Crear `src/services/realtime.service.ts`:
    - `subscribeToCommands(deviceId, onCommand)` — suscribe a canal de comandos.
    - Implementar handlers para cada comando: `play`, `pause`, `sync`, `restart`, `update_settings`.
38. [ ] Crear `src/hooks/useRealtime.ts`:
    - Recibe `deviceId` y callbacks (`onSync`, `onRestart`, etc.).
    - Se subscribe/desubscribe automáticamente.
39. [ ] Integrar en `playback.tsx`:
    - `onSync` → llamar `refresh()` de `useContent`.
    - `onRestart` → reiniciar app (o recargar desde pairing).
    - `onPause` / `onPlay` → controlar reproducción.
40. [ ] Probar comandos en vivo:
    - Desde Supabase Dashboard → Realtime → Broadcast.
    - Enviar comando `sync` al canal `device:{id}:control`.
    - Verificar que la app refresca el contenido.
    - Enviar comando `restart` → verificar que la app se reinicia.

**Tareas — Día 3-4: Heartbeat**
41. [ ] Crear `src/services/heartbeat.service.ts`:
    - `startHeartbeat(deviceId)` — inicia intervalo de 30s.
    - `stopHeartbeat()` — detiene intervalo.
    - `updateHeartbeatState(state)` — actualiza estado a reportar.
42. [ ] Crear `src/hooks/useHeartbeat.ts`:
    - Inicia/detiene heartbeat automáticamente.
    - Actualiza estado cuando cambia reproducción.
43. [ ] Integrar en `playback.tsx`:
    - Iniciar heartbeat después de cargar contenido.
    - Actualizar estado: `online` → `playing` cuando hay contenido activo.
44. [ ] Probar heartbeat:
    - Verificar en Supabase que `devices.last_seen` se actualiza cada ~30s.
    - Verificar que `devices.status` cambia a `playing` cuando hay contenido.
    - Verificar que el panel web ve el dispositivo como 🟢 online.

**Tareas — Día 5-6: Device Logs**
45. [ ] Integrar `insertDeviceLog` en eventos clave:
    - Al vincularse → log `online`.
    - Al empezar a reproducir → log `playing`.
    - Al recibir comando sync → log `sync`.
    - Al recibir comando restart → log `restart`.
    - Al perder conexión → log `offline`.
    - Al recuperar conexión → log `online`.
    - Al encontrar error → log `error`.
46. [ ] Probar logs:
    - Realizar acciones en la app.
    - Verificar en Supabase `device_logs` que los eventos se registran.

**Tareas — Día 7: Programaciones (Schedules)**
47. [ ] Crear `src/services/schedule.service.ts`:
    - `resolveActiveSchedule(deviceId)` — consulta schedules activos ahora.
    - `isScheduleStillActive(schedule)` — verifica si sigue vigente.
48. [ ] Crear `src/hooks/useSchedule.ts`:
    - Consulta schedules cada 60s.
    - Notifica cuando un schedule se activa/desactiva.
49. [ ] Integrar en `playback.tsx`:
    - Si hay schedule activo → usar su `playlist_id` en vez del `current_playlist_id`.
    - Si el schedule termina → volver al contenido por defecto.
50. [ ] Probar schedules:
    - Crear schedule en Supabase para el dispositivo (rango de fecha/hora actual).
    - Verificar que la app reproduce la playlist del schedule.
    - Modificar end_time para que expire → verificar que vuelve al contenido default.

**Validación Fase 3 (MVP LISTO):**
- Panel web asigna contenido → app lo recibe en vivo (comando sync vía Realtime).
- Panel web ve dispositivo online con heartbeat.
- Panel web ve logs de actividad del dispositivo.
- Schedules funcionan: playlist programada se activa/desactiva automáticamente.
- App funciona offline con caché.
- Cambio de layout manual (toque/SELECT) sigue funcionando.

---

### FASES 4-6: POST-MVP (FUERA DEL ALCANCE INMEDIATO)

Estas fases corresponden al plan original pero NO son necesarias para el MVP de salir a vender. Se documentan para referencia futura:

- **Fase 4**: Editor de plantillas avanzado, control remoto avanzado, temas.
- **Fase 5**: Optimizaciones de performance, testing, pulido UX.
- **Fase 6**: Lanzamiento, dominio, monitoreo, analytics.

---

## 15. CHECKLIST DE ARCHIVOS A CREAR/MODIFICAR

### Archivos NUEVOS (23 archivos)

```
✓ = Creado en este plan (pseudocódigo detallado)
□ = Pendiente de crear con implementación real

Carpeta src/config/ (2):
□ src/config/supabase.config.ts
□ src/config/constants.ts

Carpeta src/services/ (7):
□ src/services/supabase.ts
□ src/services/pairing.service.ts
□ src/services/device.service.ts
□ src/services/content.service.ts
□ src/services/realtime.service.ts
□ src/services/heartbeat.service.ts
□ src/services/schedule.service.ts
□ src/services/cache.service.ts

Carpeta src/hooks/ (7):
□ src/hooks/useSupabase.ts
□ src/hooks/useDevice.ts
□ src/hooks/useContent.ts
□ src/hooks/useRealtime.ts
□ src/hooks/useHeartbeat.ts
□ src/hooks/useNetworkStatus.ts
□ src/hooks/useSchedule.ts

Carpeta src/app/ (3):
□ src/app/pairing.tsx
□ src/app/playback.tsx
□ src/app/error.tsx

Carpeta src/components/ (3):
□ src/components/PairingScreen.tsx
□ src/components/ConnectionBanner.tsx
□ src/components/DeviceStatus.tsx

Carpeta src/types/ (1):
□ src/types/supabase.types.ts
```

### Archivos a MODIFICAR (5 archivos)

```
□ src/app/index.tsx          — Redirigir según estado vinculación
□ src/app/_layout.tsx        — Agregar rutas pairing, playback, error
□ src/components/Billboard.tsx — Conectar con useContent (eliminar ANNOUNCEMENTS locales)
□ src/types/index.ts          — Verificar compatibilidad con tipos Supabase
□ package.json                — Agregar nuevas dependencias
□ app.json                    — Agregar plugins si es necesario
```

### Archivos SIN CAMBIOS

```
✓ src/components/BillboardSlide.tsx  — Misma interfaz Announcement
✓ src/components/layouts/LayoutEngine.tsx — Sin cambios
✓ src/components/layouts/layouts.ts  — Ya tiene los 2 layouts activos
✓ src/components/media/VideoPlayer.tsx — Ya migrado a expo-video
✓ src/components/media/StoryPanel.tsx — Sin cambios
✓ src/components/media/ImageGrid.tsx  — Sin cambios
✓ src/utils/tv.ts                     — Sin cambios
```

---

## 16. PRUEBAS Y VERIFICACIÓN

### 16.1 Pruebas Manuales por Fase

**Fase 1:**
| # | Escenario | Resultado Esperado |
|---|---|---|
| 1 | App inicia sin device_id | Muestra pantalla de pairing |
| 2 | Ingresar código inválido (< 6 chars) | Mensaje de error |
| 3 | Ingresar código no existente en BD | "Código no encontrado" |
| 4 | Ingresar código ya vinculado | "Código ya en uso" |
| 5 | Ingresar código válido | Navega a playback |
| 6 | Cerrar y reabrir app | Va directo a playback (sin pairing) |
| 7 | Desconectar WiFi en pairing | Mensaje de error de red |
| 8 | Reconectar y reintentar | Pairing exitoso |

**Fase 2:**
| # | Escenario | Resultado Esperado |
|---|---|---|
| 9 | Dispositivo sin contenido asignado | Muestra "Sin contenido" (IDLE) |
| 10 | Asignar 1 imagen desde panel | App muestra la imagen |
| 11 | Asignar 1 video desde panel | App reproduce el video |
| 12 | Asignar playlist con 3 imágenes | App rota cada N segundos |
| 13 | Cambiar contenido desde panel | App actualiza (al presionar refresh) |
| 14 | Desconectar WiFi durante reproducción | Sigue mostrando contenido cacheado + banner |
| 15 | Reconectar WiFi | Banner desaparece, refresca contenido |
| 16 | Sin caché y sin WiFi | Muestra pantalla de error con reintento |

**Fase 3:**
| # | Escenario | Resultado Esperado |
|---|---|---|
| 17 | Panel envía comando sync vía Realtime | App refresca contenido automáticamente |
| 18 | Panel envía comando restart | App se reinicia |
| 19 | Verificar heartbeat en Supabase | `last_seen` se actualiza cada ~30s |
| 20 | Verificar estado en panel web | Dispositivo aparece 🟢 online |
| 21 | Crear schedule activo ahora | App cambia a la playlist del schedule |
| 22 | Schedule expira | App vuelve al contenido default |
| 23 | Verificar logs en Supabase | Eventos registrados correctamente |

### 16.2 Pruebas en TV Box

| # | Escenario | Resultado Esperado |
|---|---|---|
| 24 | Navegación con D-pad en pairing | Moverse entre teclas del teclado virtual |
| 25 | SELECT en el teclado virtual | Ingresa el carácter |
| 26 | SELECT en "✓" | Envía el código |
| 27 | SELECT en pantalla playback | Alterna entre los 2 layouts |
| 28 | Play/Pause en playback | Pausa/reanuda (overlay de layout) |
| 29 | Inactividad 5 min en TV | Overlay desaparece, enfoque TV se limpia |
| 30 | App en background (TV) | Sigue reproduciendo (si el SO lo permite) |

---

## RESUMEN PARA MVP

El MVP consiste en completar **Fases 1, 2 y 3** (6 semanas de trabajo estimado):

| Fase | Semanas | Entregable Principal |
|---|---|---|
| Fase 1 | 1-2 | App se vincula con código, estructura base con Supabase |
| Fase 2 | 3-4 | Recibe y reproduce contenido (playlists, media), modo offline básico |
| Fase 3 | 5-6 | Comunicación en tiempo real, heartbeat, schedules, logs |

**Lo que NO se incluye en MVP:**
- Editor de plantillas (Fase 4 del plan original)
- Temas claro/oscuro (Fase 4)
- Internacionalización completa (Fase 4)
- Virtualización de listas (Fase 5)
- OTA updates (Fase 6)
- Analíticas (Fase 6)
- Screenshots automáticos (funcionalidad opcional)

**Dependencias externas para MVP:**
- Proyecto Supabase creado con esquema SQL ejecutado
- Panel web funcional (aunque sea básico) para crear dispositivos y asignar contenido
- Al menos 1 TV box Android para pruebas físicas

---

## FLUJO COMPLETO MVP (DEMO DE VENTA)

```
1. Vendedor abre panel web en su laptop
2. Crea un dispositivo → obtiene código "A73K9"
3. En el TV box, abre la app → pantalla de pairing
4. Ingresa "A73K9" → vinculado
5. Vendedor sube 3 imágenes y 1 video al panel
6. Crea playlist "Demo Comercial" con los 4 items
7. Asigna la playlist al dispositivo → click en "Enviar"
8. INSTANTÁNEAMENTE el TV muestra el video + imágenes
9. Vendedor toca la pantalla → cambia a layout Historia Completa
10. Vendedor dice: "Así de simple. $15/mes por pantalla."
```

---

*Plan generado el 5 de Junio de 2026.*
*App React Native alineada con PLAN-CARTELERA-DIGITAL.md.*
*Solo 2 layouts activos: video-left-wide y story-full.*
