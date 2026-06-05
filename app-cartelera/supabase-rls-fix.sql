-- ================================================================
-- RLS FIX — APP TV CON AUTH ANONIMA (IDEMPOTENTE, SIN CONFLICTOS)
-- Ejecutar en: https://supabase.com/dashboard/project/wntecetvtwsmylsxexgt/sql/new
-- ================================================================

-- QUITAR politicas previas del fix (si existen)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Pairing: find device by key' AND tablename = 'devices') THEN
        DROP POLICY "Pairing: find device by key" ON public.devices;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Device self-update' AND tablename = 'devices') THEN
        DROP POLICY "Device self-update" ON public.devices;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Device can read media' AND tablename = 'media') THEN
        DROP POLICY "Device can read media" ON public.media;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Device can read playlists' AND tablename = 'playlists') THEN
        DROP POLICY "Device can read playlists" ON public.playlists;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Device can read schedules' AND tablename = 'schedules') THEN
        DROP POLICY "Device can read schedules" ON public.schedules;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Device insert own logs' AND tablename = 'device_logs') THEN
        DROP POLICY "Device insert own logs" ON public.device_logs;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Device read own logs' AND tablename = 'device_logs') THEN
        DROP POLICY "Device read own logs" ON public.device_logs;
    END IF;
END $$;

-- 1. DISPOSITIVO ANONIMO PUEDE LEER DEVICES (PAIRING POR device_key)
CREATE POLICY "Pairing: find device by key" ON public.devices
    FOR SELECT USING (auth.role() = 'authenticated');

-- 2. DISPOSITIVO PUEDE ACTUALIZAR SU PROPIO REGISTRO
CREATE POLICY "Device self-update" ON public.devices
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. DISPOSITIVO LEE MEDIA ASIGNADA
CREATE POLICY "Device can read media" ON public.media
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. DISPOSITIVO LEE PLAYLISTS
CREATE POLICY "Device can read playlists" ON public.playlists
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. DISPOSITIVO LEE SCHEDULES
CREATE POLICY "Device can read schedules" ON public.schedules
    FOR SELECT USING (auth.role() = 'authenticated');

-- 6. DISPOSITIVO INSERTA SUS LOGS
CREATE POLICY "Device insert own logs" ON public.device_logs
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- 7. DISPOSITIVO LEE SUS LOGS
CREATE POLICY "Device read own logs" ON public.device_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- VERIFICACION: lista todas las politicas actuales
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
