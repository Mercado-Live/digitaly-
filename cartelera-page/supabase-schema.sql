-- ================================================================
-- CARTELERA DIGITAL - supabase-schema.sql
-- Esquema de base de datos para Supabase
-- Ejecutar en SQL Editor de Supabase Dashboard
-- ================================================================

-- ============================================================
-- 1. TABLA DE PERFILES (extiende auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email           text,
    full_name       text,
    company_name    text,
    avatar_url      text,
    role            text DEFAULT 'manager' CHECK (role IN ('admin', 'manager', 'viewer')),
    plan            text DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    max_devices     smallint DEFAULT 3,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- Trigger para crear perfil automaticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, company_name, role, plan, max_devices)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
        'manager',
        'free',
        3
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. TABLA DE DISPOSITIVOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.devices (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name                text NOT NULL,
    device_key          text UNIQUE,
    model               text,
    location            text,
    orientation         text DEFAULT 'landscape' CHECK (orientation IN ('landscape', 'portrait')),
    resolution          text DEFAULT '1920x1080',
    status              text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'idle', 'playing')),
    last_seen           timestamptz,
    current_media_id    uuid,
    current_playlist_id uuid,
    software_version    text,
    ip_address          text,
    settings            jsonb DEFAULT '{}'::jsonb,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON public.devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_device_key ON public.devices(device_key);

-- ============================================================
-- 3. TABLA DE MEDIA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.media (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name            text NOT NULL,
    type            text DEFAULT 'image' CHECK (type IN ('image', 'video', 'webpage', 'widget', 'image-story')),
    url             text,
    thumbnail_url   text,
    file_size       bigint DEFAULT 0,
    duration        integer,
    width           integer,
    height          integer,
    mime_type       text,
    tags            text[] DEFAULT '{}',
    is_archived     boolean DEFAULT false,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON public.media(type);

-- ============================================================
-- 4. TABLA DE PLAYLISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.playlists (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name            text NOT NULL,
    description     text,
    items           jsonb DEFAULT '[]'::jsonb,
    is_loop         boolean DEFAULT true,
    transition      text DEFAULT 'fade' CHECK (transition IN ('none', 'fade', 'slide', 'zoom')),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);

-- ============================================================
-- 5. TABLA DE PROGRAMACIONES (SCHEDULES)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name            text NOT NULL,
    device_ids      uuid[] DEFAULT '{}',
    playlist_id     uuid REFERENCES public.playlists(id) ON DELETE SET NULL,
    start_date      timestamptz,
    end_date        timestamptz,
    days_of_week    smallint[] DEFAULT '{1,2,3,4,5}',
    start_time      time DEFAULT '08:00',
    end_time        time DEFAULT '20:00',
    priority        smallint DEFAULT 1,
    is_active       boolean DEFAULT true,
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON public.schedules(is_active);

-- ============================================================
-- 6. TABLA DE LOGS DE DISPOSITIVOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.device_logs (
    id              bigserial PRIMARY KEY,
    device_id       uuid NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    event_type      text NOT NULL CHECK (event_type IN ('online', 'offline', 'playing', 'error', 'sync', 'restart', 'content_changed')),
    event_data      jsonb DEFAULT '{}'::jsonb,
    created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_logs_device_id ON public.device_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_device_logs_created ON public.device_logs(created_at DESC);

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven su propio perfil" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuarios actualizan su propio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Devices
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven sus dispositivos" ON public.devices
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus dispositivos" ON public.devices
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus dispositivos" ON public.devices
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios eliminan sus dispositivos" ON public.devices
    FOR DELETE USING (auth.uid() = user_id);

-- Media
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven su media" ON public.media
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan su media" ON public.media
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan su media" ON public.media
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios eliminan su media" ON public.media
    FOR DELETE USING (auth.uid() = user_id);

-- Playlists
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven sus playlists" ON public.playlists
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus playlists" ON public.playlists
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus playlists" ON public.playlists
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios eliminan sus playlists" ON public.playlists
    FOR DELETE USING (auth.uid() = user_id);

-- Schedules
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven sus schedules" ON public.schedules
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuarios insertan sus schedules" ON public.schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuarios actualizan sus schedules" ON public.schedules
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuarios eliminan sus schedules" ON public.schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Device Logs
ALTER TABLE public.device_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios ven logs de sus dispositivos" ON public.device_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.devices WHERE devices.id = device_logs.device_id AND devices.user_id = auth.uid())
    );
CREATE POLICY "Dispositivos insertan sus logs" ON public.device_logs
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.devices WHERE devices.id = device_logs.device_id)
    );

-- ============================================================
-- 8. STORAGE BUCKETS Y POLITICAS
-- ============================================================
-- Ejecutar estos comandos en SQL Editor de Supabase:

-- Crear buckets (ejecutar uno por uno)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Politicas de Storage para el bucket 'media'
/*
CREATE POLICY "Usuarios suben su propia media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios ven su propia media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

CREATE POLICY "Usuarios eliminan su propia media"
ON storage.objects FOR DELETE
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
*/

-- ============================================================
-- 9. FUNCION AUXILIAR: Verificar si un schedule esta activo ahora
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_active_schedule(p_device_id uuid)
RETURNS TABLE (
    playlist_id uuid,
    schedule_name text,
    priority smallint
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.playlist_id, s.name, s.priority
    FROM public.schedules s
    WHERE p_device_id = ANY(s.device_ids)
      AND s.is_active = true
      AND (s.start_date IS NULL OR s.start_date <= now())
      AND (s.end_date IS NULL OR s.end_date >= now())
      AND EXTRACT(DOW FROM now()) = ANY(s.days_of_week)
      AND now()::time BETWEEN s.start_time AND s.end_time
    ORDER BY s.priority DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
ok 