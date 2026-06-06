# ANALISIS DE OPTIMIZACION PARA BUILD APK — CARTELERA DIGITAL

## Resumen Ejecutivo

| Parametro | Estado Actual | Recomendado | Impacto |
|---|---|---|---|
| APK debug (4 ABI) | ~120 MB | — | — |
| APK release (arm64-v8a) | ~45 MB estimado | ~25-30 MB optimizado | -40% |
| Minificacion | Off | On (R8) | -20% size |
| Firmado release | Debug keystore | Keystore propio | Seguridad |
| Arquitecturas | 4 ABI | arm64-v8a (+ armeabi-v7a opcional) | -50% size |
| Hermes | On | On | Correcto |

---

## 1. REDUCCION DE TAMANO DEL APK

### 1.1 Limitar Arquitecturas

El 99% de TVs y TV Boxes Android usan **arm64-v8a**. Solo boxes chinos muy viejos (pre-2018) usan armeabi-v7a. x86 es solo para emulador.

**Archivo:** `android/gradle.properties`
```properties
# Cambiar de:
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
# A (produccion):
reactNativeArchitectures=arm64-v8a

# O para max compatibilidad con boxes economicos:
reactNativeArchitectures=arm64-v8a,armeabi-v7a
```

**Ahorro:** ~50% si solo arm64, ~30% con arm64+armv7

### 1.2 Activar Minificacion R8

**Archivo:** `android/gradle.properties`
```properties
# Agregar al final:
android.enableMinifyInReleaseBuilds=true
android.enableShrinkResourcesInReleaseBuilds=true
```

**Ahorro:** ~20-30%

### 1.3 Reglas ProGuard Adicionales

**Archivo:** `android/app/proguard-rules.pro`

Las reglas actuales solo cubren reanimated. Hay que agregar:

```proguard
# Supabase JS SDK
-keep class org.supabase.** { *; }
-dontwarn org.supabase.**

# Expo Video
-keep class expo.modules.video.** { *; }
-keep class com.google.android.exoplayer2.** { *; }

# Expo Image
-keep class expo.modules.image.** { *; }

# Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# React Native TV
-keep class com.facebook.react.modules.** { *; }
-dontwarn com.facebook.**

# Kotlin Coroutines (usadas por Supabase)
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Mantener modelos de datos
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Evitar que R8 rompa React Native
-keep,allowobfuscation @interface com.facebook.proguard.annotations.DoNotStrip
-keep,allowobfuscation @interface com.facebook.proguard.annotations.KeepGettersAndSetters
-keep @com.facebook.proguard.annotations.DoNotStrip class *
-keepclassmembers class * { @com.facebook.proguard.annotations.DoNotStrip *; }
```

### 1.4 APK Splits (Opcional Avanzado)

Si se quiere generar un APK por arquitectura para distribuir por fuera de Google Play:

```groovy
// En android/app/build.gradle, dentro del bloque android { ... }
splits {
    abi {
        enable true
        reset()
        include 'arm64-v8a', 'armeabi-v7a'
        universalApk false
    }
}
```

---

## 2. RENDIMIENTO EN TV BOX DE BAJO PODER

### 2.1 Memoria y CPU

Los TV Box chinos tipicos (Amlogic S905, Rockchip) tienen:
- 1-2 GB RAM
- CPU Cortex-A53 quad-core
- GPU Mali-450

**Problemas comunes:**
- Videos 4K causan stuttering en boxes de 1GB
- Multiples imagenes en alta resolucion saturan RAM
- Fetching excesivo de Supabase drena bateria (no aplica en TV, pero si CPU)

**Optimizaciones de codigo:**

```typescript
// src/config/constants.ts — Reducir frecuencia de polling para TV
export const HEARTBEAT_INTERVAL_MS = 60_000;   // Era 30_000 → 60s es suficiente
export const SCHEDULE_CHECK_INTERVAL_MS = 120_000; // Era 60_000 → 120s
export const POLL_INTERVAL_MS = 30_000;        // Agregar: polling de contenido cada 30s
```

### 2.2 Imagenes — Usar expo-image con cache

El componente `Image` de `expo-image` ya tiene cache automatico. Verificar que se use en lugar del `Image` nativo en todas partes:

- `StoryPanel.tsx` ✓ (usa expo-image)
- `ImageGrid.tsx` ✓ (importa expo-image)
- Cualquier otro componente que muestre imagenes debe usar `import { Image } from 'expo-image'`

**Opcional:** Limitar resolucion de descarga en boxes de baja RAM:
```typescript
// En StoryPanel, forzar resize a 720p max
const MAX_IMAGE_WIDTH = 1280;
const imageUrl = currentMedia.url + `?width=${MAX_IMAGE_WIDTH}`;
```

### 2.3 Videos — Buffering optimo

**Archivo:** `src/components/media/VideoPlayer.tsx`

```typescript
// Configuracion de buffer optimo para TV Box
const player = useVideoPlayer(currentMedia.url || null, (player) => {
    player.loop = true;
    player.muted = true;
    player.volume = 0;
    // TV Box: buffer mas grande para evitar stuttering en WiFi lento
    // (expo-video usa exoplayer internamente)
});
```

Si hay problemas de buffering, agregar `preferredForwardBufferDuration`:
```typescript
// En app.json, configurar expo-video:
"plugins": [
    "expo-video",
    {
        "preferredForwardBufferDuration": 10  // segundos de buffer adelantado
    }
]
```

### 2.4 Keep-Awake para TV

La app ya tiene `expo-keep-awake`. Verificar que este activado:

```typescript
// En playback.tsx, agregar:
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

useEffect(() => {
    activateKeepAwakeAsync();
    return () => { deactivateKeepAwake(); };
}, []);
```

**Importante:** En TVs, la pantalla no se "duerme" como un telefono, pero algunos TV Box cierran apps en background. Keep-awake previene esto.

---

## 3. CONFIGURACION DE BUILD PARA PRODUCCION

### 3.1 Generar Keystore de Produccion

```bash
# En Windows PowerShell:
keytool -genkeypair -v -storetype PKCS12 `
  -keystore cartelera-release.keystore `
  -alias cartelera `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storepass TU_PASSWORD_SEGURO `
  -keypass TU_PASSWORD_SEGURO `
  -dname "CN=Cartelera Digital, OU=Dev, O=Cartelera, L=Ciudad, ST=Provincia, C=AR"
```

**Guarda el keystore y passwords en lugar seguro. Sin esto no podes actualizar la app en Google Play.**

### 3.2 Configurar Firmado Release

**Archivo:** `android/app/build.gradle`

```groovy
signingConfigs {
    debug { ... }
    release {
        storeFile file('cartelera-release.keystore')
        storePassword System.getenv('KEYSTORE_PASSWORD') ?: 'TU_PASSWORD'
        keyAlias 'cartelera'
        keyPassword System.getenv('KEY_PASSWORD') ?: 'TU_PASSWORD'
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release  // Cambiar de debug a release
        ...
    }
}
```

**IMPORTANTE:** No hardcodear passwords. Usar variables de entorno:
```bash
# En PowerShell antes de buildear:
$env:KEYSTORE_PASSWORD = "TU_PASSWORD"
$env:KEY_PASSWORD = "TU_PASSWORD"
```

### 3.3 Build para Produccion

```bash
# Generar APK release
cd C:\Users\Proventa3\Documents\Digitaly\app-cartelera
npx expo run:android --variant release

# O directamente con gradle:
cd android
./gradlew assembleRelease
```

El APK se genera en: `android/app/build/outputs/apk/release/app-release.apk`

### 3.4 Version y Package Name

Antes de publicar, cambiar:
```json
// app.json
{
  "expo": {
    "name": "Cartelera Digital",
    "slug": "cartelera-digital",
    "version": "1.0.0",
    "android": {
      "package": "com.digitaly.cartelera"  // Tu propio package
    }
  }
}
```

Luego ejecutar `npx expo prebuild --clean` para regenerar con nuevo package.

---

## 4. OPTIMIZACIONES ESPECIFICAS PARA TV

### 4.1 Soporte de Control Remoto

La app ya maneja eventos de TV via `TVEventHandler`. Verificar que todos los botones funcionen:

| Boton Remoto | Funcion | Archivo |
|---|---|---|
| SELECT / OK | Cambiar layout | `Billboard.tsx` |
| PLAY / PAUSE | Pausar/reanudar | `Billboard.tsx` |
| DPAD | Navegacion focus | `TVFocusGuideView` |
| BACK | Minimizar app (no cerrar) | `MainActivity.kt` (ya implementado) |

### 4.2 Overscan en TVs

Muchos TVs tienen overscan (recorte de bordes). Para compensar:

```typescript
// src/utils/tv.ts — agregar constante
export const TV_OVERSCAN_MARGIN = Platform.OS === 'android' && Platform.isTV ? 16 : 0;
```

Y aplicarlo en `LayoutEngine.tsx` o `BillboardSlide.tsx` como padding/margin.

### 4.3 Inicio Automatico (Boot)

Para TV Boxes que inician automaticamente al recibir corriente:

**AndroidManifest.xml:**
```xml
<receiver android:name=".BootReceiver" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED"/>
    </intent-filter>
</receiver>
```

Y crear `BootReceiver.kt`:
```kotlin
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val launchIntent = context.packageManager
                .getLaunchIntentForPackage(context.packageName)
            launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
        }
    }
}
```

### 4.4 Pantalla Completa Verdadera

Ocultar barras de sistema y mantener pantalla siempre encendida:

```typescript
// En playback.tsx - ya existe el keep-awake, agregar:
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';

useEffect(() => {
    SystemUI.setBackgroundColorAsync('#000000');
    if (Platform.OS === 'android') {
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('overlay-swipe');
    }
}, []);
```

---

## 5. SEGURIDAD

### 5.1 ProGuard para Ocultar API Keys

Aunque la anon key es publica, en APK release conviene no dejarla en texto plano:

```proguard
# Obfuscar strings sensibles
-keepclassmembers class com.anonymous.appcartelera.BuildConfig {
    public static <fields>;
}
```

### 5.2 Almacenamiento Seguro

Para datos sensibles (no aplica actualmente porque usas auth anonima), `expo-secure-store` ya esta instalado. Para futura autenticacion con usuario real:

```typescript
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('auth_token', token);
```

### 5.3 Permisos Minimos

La app solo necesita `INTERNET`. Verificar que no haya permisos innecesarios en el manifest que puedan rechazar el review en Google Play:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<!-- Estos NO son necesarios para TV y pueden eliminarse: -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.VIBRATE"/>
```

`SYSTEM_ALERT_WINDOW` solo es para debug overlay, en release se puede quitar.

---

## 6. NETWORK Y OFFLINE

### 6.1 Estrategia de Cache

La app ya cachea el ultimo anuncio en AsyncStorage. Mejoras:

1. **Cache de imagenes**: `expo-image` tiene cache de disco automatico (200 MB default)
2. **Cache de playlist completa**: guardar todos los slides y URLs
3. **Modo offline**: si no hay internet, mostrar contenido cacheado

```typescript
// src/hooks/useContent.ts — ya implementado parcialmente
// Mejora: cachear lista completa de anuncios, no solo el ultimo
async function cacheAllAnnouncements(announcements: Announcement[]) {
    await AsyncStorage.setItem('cache:all_announcements', JSON.stringify(announcements));
}
```

### 6.2 Retry con Backoff

Agregar reintentos con delay exponencial cuando Supabase falla:

```typescript
// src/services/content.service.ts
async function fetchWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
        try { return await fn(); }
        catch (e) {
            if (i === maxRetries - 1) throw e;
            await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, i)));
        }
    }
    throw new Error('Max retries');
}
```

---

## 7. DEPENDENCIAS INNECESARIAS

Paquetes que se pueden eliminar para reducir APK:

| Paquete | Uso | Accion |
|---|---|---|
| `expo-glass-effect` | Efecto vidrio (iOS) | **Eliminar** — no aplica en TV |
| `expo-symbols` | SF Symbols (iOS) | **Eliminar** — solo iOS |
| `expo-web-browser` | Abrir navegador | Mantener (pairing?) |
| `react-native-web` | Soporte web | **Eliminar** — solo TV |
| `react-dom` | Soporte web | **Eliminar** — solo TV |

```bash
npm uninstall expo-glass-effect expo-symbols react-native-web react-dom
```

**Ahorro estimado:** ~5-8 MB del APK

---

## 8. SPLASH SCREEN Y UI DE CARGA

### 8.1 Splash Screen Optimizado

La app actual muestra un splash azul. Para TV, idealmente debe ser:

- Fondo negro (la mayoria de TVs tienen pantalla negra al iniciar)
- Sin texto pequeno (no se lee a 3 metros)
- Logo centrado grande

```json
// app.json
{
  "expo": {
    "plugins": [
      ["expo-splash-screen", {
        "backgroundColor": "#000000",
        "android": {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain"
        }
      }]
    ]
  }
}
```

---

## 9. MONITOREO EN PRODUCCION

### 9.1 Logs Minimos

En release, deshabilitar console.log para no gastar CPU:

```typescript
// En entry point (index.tsx), solo en release builds:
if (!__DEV__) {
    console.log = () => {};
    console.warn = () => {};
    // Mantener console.error para crash reporting
}
```

### 9.2 Crash Reporting Basico

```typescript
// En app/_layout.tsx — Error Boundary simple
import { ErrorBoundary } from 'react-native';

function FallbackComponent() {
    // Reiniciar despues de crash
    useEffect(() => {
        setTimeout(() => NativeModules.DevSettings?.reload(), 5000);
    }, []);
    return <View style={{flex:1,backgroundColor:'#000',justifyContent:'center',alignItems:'center'}}>
        <Text style={{color:'white'}}>Error. Reiniciando...</Text>
    </View>;
}
```

---

## 10. PROCESO DE BUILD PASO A PASO

```bash
# 1. Limpiar cache
cd C:\Users\Proventa3\Documents\Digitaly\app-cartelera
npx expo prebuild --clean

# 2. Configurar variables de entorno
$env:KEYSTORE_PASSWORD = "tu_password"
$env:KEY_PASSWORD = "tu_password"

# 3. Configurar gradle.properties para release:
#    - reactNativeArchitectures=arm64-v8a
#    - android.enableMinifyInReleaseBuilds=true
#    - android.enableShrinkResourcesInReleaseBuilds=true

# 4. Build release APK
cd android
./gradlew assembleRelease

# 5. APK generado en:
# android/app/build/outputs/apk/release/app-release.apk

# 6. Verificar tamano:
Get-Item android\app\build\outputs\apk\release\app-release.apk | Select-Object Length, Name
```

---

## 11. CHECKLIST PRE-LANZAMIENTO

- [ ] Package name cambiado a `com.digitaly.cartelera`
- [ ] Keystore de release generado y respaldado
- [ ] Minificacion R8 activada
- [ ] Arquitecturas limitadas a `arm64-v8a`
- [ ] Splash screen en negro con logo grande
- [ ] Dependencias innecesarias eliminadas
- [ ] Permisos minimos en AndroidManifest
- [ ] ProGuard rules para Supabase agregadas
- [ ] Keep-awake activado en playback
- [ ] Cache offline funcionando
- [ ] Control remoto TV testeado (SELECT = cambiar layout, PLAY/PAUSE = pausar)
- [ ] APK probado en al menos 2 TV Box diferentes
- [ ] Version code y nombre actualizados (app.json + build.gradle)
