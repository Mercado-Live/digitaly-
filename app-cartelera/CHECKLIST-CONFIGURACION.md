# CHECKLIST DE CONFIGURACION — APP CARTELERA DIGITAL

---

## LO QUE YA ESTA HECHO (NO TOCAR)

### Proyecto Supabase
- [x] Proyecto creado: `https://wntecetvtwsmylsxexgt.supabase.co`
- [x] Anon key configurada en `cartelera-page/js/supabase.js`
- [x] Anon key configurada en `app-cartelera/src/config/supabase.config.ts`
- [x] Schema SQL creado en `cartelera-page/supabase-schema.sql`

### Panel Web (cartelera-page)
- [x] 35 archivos: 1 HTML, 11 CSS, 21 JS, 1 SQL, 1 MD
- [x] Router SPA funcional con hash-based routing
- [x] Autenticacion (login, registro, recuperacion)
- [x] Modulos: dashboard, devices, media, playlists, schedules, realtime, notifications, shell
- [x] Supabase SDK cargado via CDN (`@supabase/supabase-js@2`)
- [x] SortableJS via CDN para drag & drop en playlists

### App React Native TV (app-cartelera)
- [x] 2 layouts activos: `video-left-wide` + `story-full`
- [x] VideoPlayer con expo-video (compatible Expo Go)
- [x] Pantalla pairing con teclado virtual 6 caracteres
- [x] Pantalla playback con Billboard estatico
- [x] Pantalla error con reintento
- [x] Servicios: supabase, pairing, device, content, cache, realtime, heartbeat, schedule
- [x] Hooks: useSupabase, useDevice, useNetworkStatus, useContent, useRealtime, useHeartbeat, useSchedule
- [x] Componentes: PairingScreen, ConnectionBanner, Billboard, BillboardSlide, LayoutEngine
- [x] 0 errores TypeScript en src/

---

## LO QUE FALTA HACER (EN ORDEN)

### 1. EJECUTAR SQL EN SUPABASE DASHBOARD

Abre https://supabase.com/dashboard/project/wntecetvtwsmylsxexgt/sql y ejecuta en este orden:

**Paso 1: Schema principal**
Copia y pega TODO el contenido de:
```
C:\Users\Proventa3\Documents\Digitaly\cartelera-page\supabase-schema.sql
```
Click **Run**. Esto crea las 6 tablas, triggers, RLS, indices y la funcion `get_active_schedule`.

**Paso 2: Fix RLS para dispositivo anonimo**
Copia y pega TODO el contenido de:
```
C:\Users\Proventa3\Documents\Digitaly\app-cartelera\supabase-rls-fix.sql
```
Click **Run**. Esto agrega politicas para que la app del TV (auth anonima) pueda leer datos.

**Paso 3: Storage buckets**
Ejecuta estos comandos uno por uno:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
```

**Paso 4: Politicas de Storage** (SQL Editor)
```sql
CREATE POLICY "Public read media" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Auth insert media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Auth delete media" ON storage.objects
    FOR DELETE USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Public read thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Public read avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');
```

### 2. HABILITAR AUTH ANONIMA EN SUPABASE

1. Ve a **Authentication > Settings** en Supabase Dashboard
2. Busca **Allow anonymous sign-ins**
3. Activalo (toggle ON)
4. Click **Save**

### 3. REALTIME — NO DISPONIBLE EN PLAN FREE (USAMOS POLLING)

La app del TV ya esta adaptada para funcionar SIN Realtime:
- **Comandos del panel**: La app consulta cada 15s si cambio `current_media_id` o `current_playlist_id`
- **Heartbeat**: Actualiza `devices.last_seen` y `devices.status` directamente en BD cada 30s
- **Schedules**: Ya se consultaban por polling cada 60s

Si en el futuro actualizas a plan Pro, Reactiva Realtime en Database > Replication. El codigo ya tiene los canales preparados.

### 4. VERIFICAR TABLAS CREADAS

En **Table Editor**, confirma que existen:
- `profiles` (con trigger `on_auth_user_created`)
- `devices` (con indice en `device_key`)
- `media`
- `playlists` (con `items` jsonb)
- `schedules`
- `device_logs`

### 5. PROBAR FLUJO COMPLETO

**Panel Web:**
1. Abre `cartelera-page/index.html` (puede ser con Live Server o similar)
2. Registra una cuenta (email + password)
3. Ve a Dispositivos > Crear dispositivo
4. Anota el `device_key` generado (ej: "A73K9M")

**App TV:**
1. `npx expo start --clear` en `app-cartelera`
2. Abre en Android (Expo Go)
3. Ingresa el codigo de 6 digitos
4. Deberia mostrar "Vinculado correctamente" y navegar a playback
5. En playback mostrara "Sin contenido asignado" (normal — no hay media aun)

**Panel Web (asignar contenido):**
6. Ve a Multimedia > Subir archivo > Sube una imagen JPG
7. Ve a Playlists > Crear playlist > Agrega la imagen
8. Ve a Dispositivos > Click en el dispositivo > Asignar playlist
9. La app TV deberia mostrar la imagen automaticamente

---

## NOTAS IMPORTANTES

### Credenciales ya configuradas:
| Proyecto | Archivo | URL |
|---|---|---|
| Panel web | `cartelera-page/js/supabase.js` | `https://wntecetvtwsmylsxexgt.supabase.co` |
| App TV | `app-cartelera/src/config/supabase.config.ts` | `https://wntecetvtwsmylsxexgt.supabase.co` |

### Ambos proyectos usan la misma anon key:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndudGVjZXR2dHdzbXlsc3hleGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjkxMDgsImV4cCI6MjA5NjI0NTEwOH0.Rm27VzgfaZ_BZPTzFKkhKq7gLVOTt2_gayuZdJGxGa0
```

### Compatibilidad schema ↔ app:
- [x] Tipos `MediaRow.type` incluye `'image-story'` (coincide con SQL CHECK)
- [x] `ScheduleRow.playlist_id` es nullable (coincide con `ON DELETE SET NULL`)
- [x] `ScheduleRow.start_date` y `end_date` son nullable (coincide con SQL)
- [x] `DeviceLogInsert.event_type` incluye `'content_changed'` (coincide con SQL CHECK)
- [x] `MediaRow.url` es nullable (coincide con SQL)

---

## ARBOL DE ARCHIVOS RELEVANTES

```
C:\Users\Proventa3\Documents\Digitaly\
├── cartelera-page\                          ← PANEL WEB
│   ├── index.html
│   ├── supabase-schema.sql                  ← Schema SQL principal
│   ├── js\
│   │   ├── supabase.js                      ← Credenciales Supabase
│   │   └── modules\                         ← Modulos funcionales
│   └── css\                                 ← Estilos
│
├── app-cartelera\                           ← APP REACT NATIVE TV
│   ├── supabase-rls-fix.sql                 ← SQL fix RLS (NUEVO - ejecutar)
│   ├── CHECKLIST-CONFIGURACION.md           ← Este archivo
│   ├── PLAN-APP-CARTELERA.md               ← Plan detallado de la app
│   ├── src\
│   │   ├── config\
│   │   │   └── supabase.config.ts           ← Credenciales Supabase
│   │   ├── services\                        ← Capa de datos
│   │   ├── hooks\                           ← Hooks React
│   │   ├── components\                      ← UI
│   │   ├── types\
│   │   │   └── supabase.types.ts            ← Tipos alineados con SQL
│   │   └── app\                             ← Rutas Expo Router
│   └── package.json
│
└── PLAN-CARTELERA-DIGITAL.md               ← Plan maestro del proyecto
```

---

*Checklist verificado el 5 Jun 2026. Credenciales reales confirmadas en ambos proyectos.*
