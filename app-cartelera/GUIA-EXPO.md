# GUIA COMPLETA DE EXPO Y REACT NATIVE

## INDICE

1. [¿Que es Expo?](#1-que-es-expo)
2. [Arquitectura de React Native](#2-arquitectura-de-react-native)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [El proceso de build](#4-el-proceso-de-build)
5. [Metro Bundler](#5-metro-bundler)
6. [Expo Router](#6-expo-router)
7. [Config Plugins](#7-config-plugins)
8. [Development builds vs Expo Go](#8-development-builds-vs-expo-go)
9. [Flujo de trabajo dia a dia](#9-flujo-de-trabajo-dia-a-dia)
10. [Android TV vs Phone](#10-android-tv-vs-phone)

---

## 1. ¿QUE ES EXPO?

Expo es un **framework sobre React Native**. No es un lenguaje nuevo, ni un reemplazo de React Native. Es una capa que simplifica el desarrollo.

### Los 3 pilares de Expo

| Pilar | Que hace |
|-------|----------|
| **Expo CLI** | Herramienta de terminal para crear, buildear y correr apps (`npx expo start`, `npx expo run:android`) |
| **Expo SDK** | Coleccion de modulos nativos ya empaquetados (camara, GPS, notificaciones, etc.) que funcionan sin configuracion extra |
| **EAS** (Expo Application Services) | Servicios en la nube para buildear y publicar apps sin necesidad de tener Xcode o Android Studio en tu maquina |

### Managed vs Bare workflow

| Managed | Bare |
|---------|------|
| No ves las carpetas `android/` ni `ios/` | Generas `android/` e `ios/` con `npx expo prebuild` |
| Expo maneja la configuracion nativa por ti | Tu tienes control total de los archivos nativos |
| Solo puedes usar modulos que Expo soporte | Puedes escribir codigo nativo propio (Java/Kotlin, Swift/ObjC) |
| Ideal para empezar | Necesario cuando requieres modulos nativos personalizados |

**Tu proyecto actual usa Bare workflow** (porque ya tienes carpeta `android/` generada con `prebuild`).

---

## 2. ARQUITECTURA DE REACT NATIVE

Esto es lo mas importante de entender. React Native NO es un "webview". Es **nativo real**.

```
┌──────────────────────────────────────────────────┐
│                 TU CODIGO (JS/TS)                 │
│  Componentes, logica, estado, navegacion          │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│              METRO BUNDLER                        │
│  Convierte tu JS/TS en un solo archivo bundle.js  │
│  (empaca todas las dependencias juntas)           │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────┐
│              2 HILOS (Threads)                    │
│                                                   │
│  ┌─────────────────────┐  ┌───────────────────┐  │
│  │   JS THREAD         │  │  NATIVE THREAD     │  │
│  │   - Corre tu logica │  │  - UI (Android)    │  │
│  │   - Estado          │  │  - Animaciones     │  │
│  │   - Eventos         │◄─┤  - GPS, Camara     │  │
│  │   - Virtual DOM     │  │  - Renderizado     │  │
│  └──────────┬──────────┘  └──────────┬─────────┘  │
│             │                        │             │
│             └──────────┬─────────────┘             │
│                        │                           │
│                 ┌──────┴──────┐                    │
│                 │   BRIDGE    │                    │
│                 │ (JSON msgs) │                    │
│                 └─────────────┘                    │
└──────────────────────────────────────────────────┘
```

### El Bridge (Arquitectura Antigua)

- Los 2 hilos se comunican enviandose mensajes **JSON** serializados
- Es asincrono: JS dice "crea un boton azul" y el hilo nativo lo recibe despues
- **Problema**: latencia, no puedes enviar objetos grandes, bottleneck de rendimiento

### Nueva Arquitectura (Fabric + JSI)

Desde React Native 0.76, la nueva arquitectura reemplaza el Bridge con **JSI** (JavaScript Interface):

- **JSI** permite que JS llame funciones nativas **directamente** (sincrono) sin serializar JSON
- **Fabric** es el nuevo sistema de renderizado (reemplaza UIManager)
- **TurboModules** cargan modulos nativos under demanda (no todos al inicio)
- Resultado: apps mas rapidas, menor uso de memoria, animaciones mas suaves

Tu proyecto actual usa React Native 0.85, que ya tiene la **Nueva Arquitectura** habilitada.

---

## 3. ESTRUCTURA DEL PROYECTO

```
app-cartelera/
│
├── package.json              ← CORAZON del proyecto
├── app.json                  ← Configuracion de Expo
├── tsconfig.json             ← Configuracion de TypeScript
├── .gitignore                ← Archivos que git ignora
├── babel.config.js           ← Configuracion de Babel (transpilador JS)
│
├── src/                      ← TU CODIGO (codigo fuente)
│   ├── app/                  ← Expo Router (rutas = archivos)
│   │   ├── _layout.tsx       ← Layout raiz (envoltura global)
│   │   └── index.tsx         ← Pantalla principal "/"
│   ├── components/           ← Componentes reutilizables
│   ├── constants/            ← Constantes (colores, temas)
│   ├── hooks/                ← Custom hooks
│   └── global.css            ← Estilos globales para web
│
├── assets/                   ← Recursos estaticos
│   ├── images/               ← Iconos, splash, logos
│   └── expo.icon/            ← Icono de Expo
│
├── android/                  ← PROYECTO NATIVO ANDROID (generado)
│   ├── app/                  ← Codigo de tu app
│   │   ├── src/main/         ← Codigo fuente Java/Kotlin
│   │   │   ├── AndroidManifest.xml  ← Permisos, activities, intent filters
│   │   │   └── java/.../     ← Codigo Kotlin/Java generado
│   ├── build.gradle          ← Configuracion Gradle (build system Android)
│   ├── gradle.properties     ← Propiedades de Gradle (memoria, JVM)
│   ├── settings.gradle       ← Modulos incluidos en el build
│   └── gradlew / gradlew.bat ← Wrapper de Gradle (no necesitas instalarlo)
│
├── example/                  ← Backup del template original (lo creo reset-project)
│   ├── src/                  ← Codigo antiguo respaldado
│   └── scripts/              ← Script antiguo respaldado
│
├── node_modules/             ← DEPENDENCIAS (NO TOCAR, NO GIT)
│
├── .expo/                    ← Cache de Expo (no importante, no git)
│
└── expo-env.d.ts             ← Tipos generados por Expo para TypeScript
```

### Explicacion archivo por archivo

#### package.json
```json
{
  "name": "app-cartelera",           // Nombre del proyecto
  "main": "expo-router/entry",       // Punto de entrada (quien inicia la app)
  "dependencies": { ... },           // Librerias que usa tu app
  "devDependencies": { ... },        // Librerias solo para desarrollo
  "scripts": { ... }                 // Comandos: npm start, npm run android
}
```

**Diferencia entre `dependencies` y `devDependencies`:**
- `dependencies` → se empaquetan en la app final
- `devDependencies` → solo existen en tu maquina (tipados, linters, config plugins)

#### app.json
```json
{
  "expo": {
    "name": "app-cartelera",         // Nombre visible
    "slug": "app-cartelera",         // Identificador unico
    "version": "1.0.0",              // Version de tu app
    "orientation": "portrait",       // Orientacion por defecto
    "icon": "...",                   // Icono de la app
    "scheme": "appcartelera",        // Deep link scheme (appcartelera://...)
    "plugins": [ ... ],              // Config plugins
    "experiments": { ... }           // Features experimentales
  }
}
```

Este archivo es **la unica fuente de verdad** para la configuracion. Expo lee esto y genera todo lo demas.

#### android/ (proyecto nativo)

Se genera con `npx expo prebuild`. Es un proyecto Android **real**, como si lo hubieras creado con Android Studio.

| Archivo | Que hace |
|---------|----------|
| `AndroidManifest.xml` | Declara permisos, activities, intent filters (lo que la app puede hacer) |
| `build.gradle` (root) | Configura el build system para todos los modulos |
| `build.gradle` (app) | Configura el build de tu app (SDK versions, dependencias nativas) |
| `gradle.properties` | Memoria maxima para Gradle, flags de JVM |
| `gradlew / gradlew.bat` | No necesitas instalar Gradle, este script lo descarga solo |

---

## 4. EL PROCESO DE BUILD

Cuando ejecutas `npx expo run:android`, esto es lo que pasa realmente:

```
PASO 1: PREBUILD (si no existe android/)
  ├── Lee app.json
  ├── Ejecuta config plugins (modifican AndroidManifest, etc.)
  ├── Genera android/ completo
  └── Ejecuta npm install

PASO 2: METRO BUNDLER
  ├── Toma todo tu codigo JS/TS
  ├── Resuelve imports (node_modules, archivos locales)
  ├── Transpila TS a JS
  ├── Convierte JSX a JS (React.createElement)
  └── Genera un UNICO archivo: bundle.js (cientos de miles de lineas)

PASO 3: GRADLE BUILD (Android)
  ├── Compila codigo Java/Kotlin nativo
  ├── Compila librerias C/C++ (via NDK)
  ├── Combina todo: bundle.js + codigo nativo + recursos (imagenes, etc.)
  ├── Firma el APK (debug keystore)
  └── Genera: android/app/build/outputs/apk/debug/app-debug.apk

PASO 4: INSTALACION
  ├── adb install app-debug.apk
  └── La app se abre en el dispositivo
```

### ¿Que es un APK?

APK = Android Package Kit. Es un archivo ZIP con:

```
app-debug.apk
├── classes.dex          ← Tu codigo Java/Kotlin compilado (Dalvik Executable)
├── assets/bundle.js     ← Todo tu codigo JS en un solo archivo
├── resources.arsc       ← Recursos compilados (strings, colores, layouts)
├── res/                 ← Recursos sin compilar (imagenes, XML)
├── lib/                 ← Librerias nativas (.so) para cada CPU (armeabi-v7a, arm64-v8a, x86)
├── AndroidManifest.xml  ← Permisos y configuracion
├── META-INF/            ← Firma digital y metadatos
└── kotlin/              ← Metadata de Kotlin
```

---

## 5. METRO BUNDLER

Metro es el **bundler** de React Native (como Webpack para web, pero para RN).

### ¿Que hace exactamente?

```
Tu codigo:
  src/app/index.tsx
  src/app/_layout.tsx
  node_modules/react-native/
  node_modules/expo-router/
  node_modules/react/
  ... (cientos de archivos)

Metro los procesa y genera:
  bundle.js (un solo archivo con TODO)
```

### Diferencias con Webpack (web)

| Metro | Webpack |
|-------|---------|
| Diseñado para RN | Diseñado para web |
| No tiene DOM | Tiene DOM |
| Transforma JSX pero no HTML | Transforma HTML tambien |
| Transforma imagenes a URIs locales | Transforma imagenes a URLs |
| Hot Reload nativo | Hot Reload via webpack-dev-server |

### Hot Reload vs Fast Refresh

| Hot Reload (antiguo) | Fast Refresh (nuevo) |
|----------------------|----------------------|
| Recargaba todo el bundle | Recarga solo el componente modificado |
| Perdia estado | Preserva el estado del componente |
| Lento | Rapido |

Tu proyecto usa **Fast Refresh**.

---

## 6. EXPO ROUTER

Expo Router es un sistema de navegacion **basado en archivos** (como Next.js).

### El concepto: cada archivo = una pantalla

```
src/app/
├── index.tsx       → Ruta: "/"
├── _layout.tsx     → Layout que envuelve todo
├── profile.tsx     → Ruta: "/profile"
├── settings/
│   ├── index.tsx   → Ruta: "/settings"
│   └── _layout.tsx → Layout para /settings y subrutas
└── [id].tsx        → Ruta: "/:id" (dinamica, ej: "/123")
```

### _layout.tsx

Son **layouts** que envuelven las pantallas hijas. Piensa en ellos como "moldes":

```tsx
// src/app/_layout.tsx - Layout raiz
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
```

### ¿Por que _layout.tsx?

El `_` al inicio es una convencion que le dice a Expo Router:
- "Esto no es una pantalla"
- "Esto es un layout que contiene otras pantallas"

---

## 7. CONFIG PLUGINS

Los config plugins son **scripts que modifican el proyecto nativo** antes de buildear.

### ¿Por que existen?

Cuando usas un modulo Expo (ej: `expo-splash-screen`), necesita cambios en:
- `AndroidManifest.xml`
- Archivos Kotlin
- `build.gradle`
- Configuraciones de iOS

En vez de que TU hagas esos cambios a mano, el config plugin los hace automaticamente cuando ejecutas `npx expo prebuild`.

### Ejemplo visual:

```
app.json
  "plugins": [
    "@react-native-tvos/config-tv"
  ]

Cuando ejecutas: $env:EXPO_TV = "1"; npx expo prebuild

El plugin "@react-native-tvos/config-tv" hace:
  1. Abre AndroidManifest.xml
  2. Agrega <category android:name="android.intent.category.LEANBACK_LAUNCHER"/>
  3. Quita android:screenOrientation="portrait"
  4. Guarda los cambios
```

Sin el plugin, tendrias que editar esos archivos nativos a mano CADA VEZ que regeneras `android/`.

---

## 8. DEVELOPMENT BUILDS vs EXPO GO

### Expo Go

App que instalas desde Play Store. Escanea un QR y corre tu codigo.

| Ventajas | Desventajas |
|----------|-------------|
| No necesitas build | No soporta modulos nativos personalizados |
| Instantaneo | No soporta TV |
| Ideal para empezar | No soporta config plugins |

### Development Build

Una app compilada con `npx expo run:android` que instalas en tu dispositivo.

| Ventajas | Desventajas |
|----------|-------------|
| Soporta TODO modulo nativo | Tarda ~20min en compilar la primera vez |
| Soporta TV | Necesitas Android Studio SDK |
| Soporta config plugins | El APK pesa ~50MB (debug) |

**Tu proyecto usa Development Build** (ya tienes `android/` y buildcaste con `run:android`).

---

## 9. FLUJO DE TRABAJO DIA A DIA

### Desarrollo normal (despues del primer build)

```powershell
# Ya buildcaste una vez, ahora solo necesitas:
npx expo start

# Esto inicia Metro Bundler. Cuando editas codigo:
# - Fast Refresh actualiza la pantalla automaticamente
# - No necesitas rebuildear el APK a menos que:
#   a) Cambies app.json
#   b) Cambies dependencias nativas (npm install)
#   c) Cambies config plugins
```

### ¿Cuando necesitas rebuildear el APK?

```
Situacion                                    ¿Rebuild?
Solo cambias JS/TS (componentes, logica)       NO
Agregas/quitas dependencias npm                NO (solo npm install)
Cambias app.json (plugins, icono, nombre)      SI
Agregas modulo que requiere config plugin      SI
Actualizas Expo SDK                           SI
```

El rebuild (solo el paso Gradle) es mas rapido que la primera vez porque usa cache:
- Primer build: 20 minutos (descarga Gradle, NDK, compila todo)
- Rebuild: 2-5 minutos (solo compila lo que cambio)

---

## 10. ANDROID TV vs PHONE

### Diferencias tecnicas reales

```
PHONE                                    TV
────────────────────────────────────────────────────
AndroidManifest.xml:

<intent-filter>                          <intent-filter>
  <action android:name=                    <action android:name=
    "android.intent.action.MAIN" />          "android.intent.action.MAIN" />
  <category android:name=                  <category android:name=
    "android.intent.category.LAUNCHER" />    "android.intent.category.LAUNCHER" />
                                         </intent-filter>
  <category android:name=
    "android.intent.category.LEANBACK_LAUNCHER" />
</intent-filter>

────────────────────────────────────────────────────
React Native usado:

react-native@0.85.3                     npm:react-native-tvos@0.85-stable
(fork de RN con soporte D-pad + focus)

────────────────────────────────────────────────────
Navegacion:

Touch                                   D-pad (flechas + enter)
                                        Focus management
                                        hasTVPreferredFocus

────────────────────────────────────────────────────
Orientacion:

portrait (vertical)                     landscape o sin restriccion
```

### ¿Por que tu build de TV funciona en el telefono?

Porque el APK sigue siendo una app Android normal. Los cambios son:
1. Se agrega un **segundo intent filter** (`LEANBACK_LAUNCHER`)
2. Se quita la restriccion de orientacion

En tu telefono:
- El launcher normal muestra la app (primer intent filter)
- La orientacion se adapta al telefono (sigue siendo touch)
- La app funciona igual, solo que ahora tambien sirve para TV

### Focus management en TV

En TV no hay touch. El usuario navega con flechas. Necesitas decirle a React "que elemento esta seleccionado ahora":

```tsx
// En phone: el usuario toca donde quiere
<Pressable onPress={...} />

// En TV: necesitas focus management
<Pressable
  onPress={...}
  hasTVPreferredFocus={true}  // ← este boton recibe focus al inicio
  isTVSelectable={true}        // ← este boton se puede seleccionar con D-pad
/>
```

---

## RESUMEN: EL VIAJE DEL CODIGO

```
ESCRIBES:                          src/app/index.tsx
                                  └── <Text>Hola</Text>
                                         │
METRO BUNDLER:                       Convierte JSX a JS
                                  └── React.createElement(Text, null, "Hola")
                                         │
                                  Empaca con dependencias
                                  └── bundle.js (~10MB)
                                         │
GRADLE BUILD:                        Compila Java/Kotlin nativo
                                  └── classes.dex
                                         │
                                  Combina con bundle.js, recursos, libs
                                  └── app-debug.apk (~50MB)
                                         │
ADB INSTALL:                         Instala en dispositivo
                                  └── App corriendo
                                         │
FAST REFRESH:                        Editas codigo
                                  └── Metro detecta cambio
                                  └── Envia nuevo bundle por USB/WiFi
                                  └── App se actualiza SIN rebuildear APK
```

---

## GLOSARIO RAPIDO

| Termino | Significado |
|---------|-------------|
| **Bundle** | Archivo unico con todo tu JS comprimido |
| **Metro** | El bundler de React Native |
| **JSI** | JavaScript Interface - comunicacion directa JS <> Nativo |
| **Fabric** | Nuevo renderizador de RN |
| **TurboModules** | Modulos nativos que cargan solo cuando se usan |
| **JSC** | JavaScript Core - engine de JS en iOS |
| **Hermes** | Engine de JS optimizado para Android (lo usas tu) |
| **ADB** | Android Debug Bridge - comunica PC con dispositivo |
| **Gradle** | Build system de Android (compila, empaqueta) |
| **NDK** | Native Development Kit - compila C/C++ para Android |
| **APK** | Android Package - archivo instalable |
| **AAB** | Android App Bundle - formato para Play Store |
| **JIT** | Just In Time - compilacion en tiempo de ejecucion |
| **AOT** | Ahead Of Time - compilacion antes de ejecutar |
