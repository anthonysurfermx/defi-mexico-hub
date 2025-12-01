-- ============================================
-- VIDEO TUTORIALS TABLE SETUP FOR DEFI MEXICO
-- ============================================
-- Ejecutar este SQL en el Editor de Supabase
-- ============================================

-- 1. Crear la tabla de video tutoriales
CREATE TABLE IF NOT EXISTS public.video_tutorials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    youtube_id TEXT NOT NULL, -- Extraído del URL para embeds
    thumbnail_url TEXT, -- Si es null, se usa el thumbnail de YouTube
    duration TEXT NOT NULL, -- Formato: "10:30" o "1:05:30"
    category TEXT NOT NULL CHECK (category IN ('defi', 'defai', 'fintech', 'trading', 'blockchain', 'nft', 'general')),
    level TEXT NOT NULL CHECK (level IN ('Principiante', 'Intermedio', 'Avanzado')),
    instructor TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0, -- Para ordenar manualmente los videos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_video_tutorials_status ON public.video_tutorials(status);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_category ON public.video_tutorials(category);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_level ON public.video_tutorials(level);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_featured ON public.video_tutorials(featured);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_order ON public.video_tutorials(order_index);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_created_at ON public.video_tutorials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_tutorials_views ON public.video_tutorials(views_count DESC);

-- 3. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_video_tutorials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_video_tutorials_updated_at ON public.video_tutorials;
CREATE TRIGGER update_video_tutorials_updated_at
    BEFORE UPDATE ON public.video_tutorials
    FOR EACH ROW
    EXECUTE FUNCTION update_video_tutorials_updated_at();

-- 4. Función para extraer YouTube ID de una URL
CREATE OR REPLACE FUNCTION extract_youtube_id(url TEXT)
RETURNS TEXT AS $$
DECLARE
    video_id TEXT;
BEGIN
    -- Formato: https://www.youtube.com/watch?v=VIDEO_ID
    IF url ~ 'youtube\.com/watch\?v=' THEN
        video_id := regexp_replace(url, '.*[?&]v=([^&]+).*', '\1');
    -- Formato: https://youtu.be/VIDEO_ID
    ELSIF url ~ 'youtu\.be/' THEN
        video_id := regexp_replace(url, '.*youtu\.be/([^?&]+).*', '\1');
    -- Formato: https://www.youtube.com/embed/VIDEO_ID
    ELSIF url ~ 'youtube\.com/embed/' THEN
        video_id := regexp_replace(url, '.*youtube\.com/embed/([^?&]+).*', '\1');
    ELSE
        video_id := url;
    END IF;

    RETURN video_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger para extraer automáticamente el YouTube ID al insertar/actualizar
CREATE OR REPLACE FUNCTION auto_extract_youtube_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.youtube_id := extract_youtube_id(NEW.youtube_url);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_extract_youtube_id_trigger ON public.video_tutorials;
CREATE TRIGGER auto_extract_youtube_id_trigger
    BEFORE INSERT OR UPDATE OF youtube_url ON public.video_tutorials
    FOR EACH ROW
    EXECUTE FUNCTION auto_extract_youtube_id();

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE public.video_tutorials ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de seguridad

-- Los videos publicados son visibles para todos
DROP POLICY IF EXISTS "Videos publicados son visibles para todos" ON public.video_tutorials;
CREATE POLICY "Videos publicados son visibles para todos"
    ON public.video_tutorials
    FOR SELECT
    USING (status = 'published');

-- Los admins pueden ver todos los videos
DROP POLICY IF EXISTS "Admins pueden ver todos los videos" ON public.video_tutorials;
CREATE POLICY "Admins pueden ver todos los videos"
    ON public.video_tutorials
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Solo admins pueden insertar videos
DROP POLICY IF EXISTS "Solo admins pueden insertar videos" ON public.video_tutorials;
CREATE POLICY "Solo admins pueden insertar videos"
    ON public.video_tutorials
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Solo admins pueden actualizar videos
DROP POLICY IF EXISTS "Solo admins pueden actualizar videos" ON public.video_tutorials;
CREATE POLICY "Solo admins pueden actualizar videos"
    ON public.video_tutorials
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Solo admins pueden eliminar videos
DROP POLICY IF EXISTS "Solo admins pueden eliminar videos" ON public.video_tutorials;
CREATE POLICY "Solo admins pueden eliminar videos"
    ON public.video_tutorials
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- 8. Función para incrementar vistas
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.video_tutorials
    SET views_count = views_count + 1
    WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Datos de ejemplo (videos reales de DeFi en español)
INSERT INTO public.video_tutorials (title, description, youtube_url, duration, category, level, instructor, tags, status, featured, order_index) VALUES
('¿Qué es DeFi? Introducción a las Finanzas Descentralizadas',
 'Aprende los conceptos básicos de DeFi, cómo funciona y por qué está revolucionando el sistema financiero tradicional.',
 'https://www.youtube.com/watch?v=k9HYC0EJU6E',
 '15:30',
 'defi',
 'Principiante',
 'DeFi México',
 ARRAY['defi', 'introducción', 'blockchain', 'finanzas'],
 'published',
 true,
 1),

('Cómo usar Uniswap - Tutorial Completo 2024',
 'Guía paso a paso para usar Uniswap, el exchange descentralizado más popular. Aprende a hacer swaps, agregar liquidez y más.',
 'https://www.youtube.com/watch?v=PSJsR-K6xUE',
 '22:15',
 'defi',
 'Principiante',
 'DeFi México',
 ARRAY['uniswap', 'dex', 'swap', 'liquidez', 'tutorial'],
 'published',
 true,
 2),

('Yield Farming Explicado - Gana Rendimientos en DeFi',
 'Descubre qué es el yield farming, cómo funciona y las mejores estrategias para maximizar tus rendimientos de forma segura.',
 'https://www.youtube.com/watch?v=ClnnLI1SClA',
 '18:45',
 'defi',
 'Intermedio',
 'DeFi México',
 ARRAY['yield farming', 'rendimientos', 'liquidity mining', 'apy'],
 'published',
 false,
 3),

('Impermanent Loss - Lo que DEBES saber antes de proveer liquidez',
 'Entiende el riesgo de pérdida impermanente al proveer liquidez en AMMs y cómo minimizarlo.',
 'https://www.youtube.com/watch?v=8XJ1MSTEuU0',
 '14:20',
 'defi',
 'Intermedio',
 'DeFi México',
 ARRAY['impermanent loss', 'liquidez', 'amm', 'riesgos'],
 'published',
 false,
 4),

('Staking de Ethereum - Guía Completa',
 'Todo lo que necesitas saber sobre el staking de ETH: requisitos, recompensas, riesgos y mejores plataformas.',
 'https://www.youtube.com/watch?v=wO9bNw4fBww',
 '25:00',
 'defi',
 'Intermedio',
 'DeFi México',
 ARRAY['staking', 'ethereum', 'eth', 'pos', 'validador'],
 'published',
 false,
 5),

('NFTs y DeFi: El Futuro de los Coleccionables Digitales',
 'Explora la intersección entre NFTs y DeFi: préstamos con NFTs como colateral, fraccionalización y más.',
 'https://www.youtube.com/watch?v=Xdkkux6OxfM',
 '20:10',
 'nft',
 'Avanzado',
 'DeFi México',
 ARRAY['nft', 'defi', 'colateral', 'fraccionalización'],
 'published',
 false,
 6),

('Seguridad en DeFi - Protege tus Activos',
 'Aprende las mejores prácticas de seguridad para proteger tus criptoactivos en el ecosistema DeFi.',
 'https://www.youtube.com/watch?v=GJbPUOW0TsQ',
 '16:40',
 'defi',
 'Principiante',
 'DeFi México',
 ARRAY['seguridad', 'wallet', 'phishing', 'scams', 'protección'],
 'published',
 true,
 7),

('Introducción a los Agentes de IA en DeFi (DeFAI)',
 'Descubre cómo la inteligencia artificial está transformando las finanzas descentralizadas con agentes autónomos.',
 'https://www.youtube.com/watch?v=aircAruvnKk',
 '28:30',
 'defai',
 'Avanzado',
 'DeFi México',
 ARRAY['ia', 'agentes', 'defai', 'automatización', 'machine learning'],
 'draft',
 false,
 8);

-- 10. Verificar la instalación
SELECT
    'video_tutorials' as tabla,
    COUNT(*) as total_videos,
    COUNT(*) FILTER (WHERE status = 'published') as publicados,
    COUNT(*) FILTER (WHERE featured = true) as destacados
FROM public.video_tutorials;
