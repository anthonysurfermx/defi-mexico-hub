-- ================================================================================
-- Script de configuración para tabla de cursos DeFi Academy
-- ================================================================================

-- Crear la tabla de cursos
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('Principiante', 'Intermedio', 'Avanzado')),
    category TEXT NOT NULL CHECK (category IN ('defi', 'defai', 'fintech', 'trading')),
    instructor TEXT NOT NULL,
    students INTEGER DEFAULT 0 CHECK (students >= 0),
    rating DECIMAL(3,2) DEFAULT 4.0 CHECK (rating >= 0 AND rating <= 5),
    topics TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    target_audience TEXT[] DEFAULT '{}',
    circle_url TEXT NOT NULL,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')),
    featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    enrollments_count INTEGER DEFAULT 0 CHECK (enrollments_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON public.courses(featured);
CREATE INDEX IF NOT EXISTS idx_courses_level ON public.courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_rating ON public.courses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_courses_students ON public.courses(students DESC);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at DESC);

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Configurar RLS (Row Level Security)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública de cursos publicados
CREATE POLICY "Public courses are viewable by everyone" ON public.courses
    FOR SELECT USING (status = 'published');

-- Política para que solo admins puedan ver todos los cursos
CREATE POLICY "All courses are viewable by admins" ON public.courses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- Política para que solo admins puedan insertar cursos
CREATE POLICY "Only admins can insert courses" ON public.courses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- Política para que solo admins puedan actualizar cursos
CREATE POLICY "Only admins can update courses" ON public.courses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- Política para que solo admins puedan eliminar cursos
CREATE POLICY "Only admins can delete courses" ON public.courses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- ================================================================================
-- Datos de ejemplo para probar la funcionalidad
-- ================================================================================

INSERT INTO public.courses (
    title,
    description,
    duration,
    level,
    category,
    instructor,
    students,
    rating,
    topics,
    requirements,
    target_audience,
    circle_url,
    thumbnail_url,
    status,
    featured
) VALUES 
(
    'Introducción a DeFi',
    'Aprende los fundamentos de las finanzas descentralizadas desde cero. Entiende qué es DeFi, cómo funcionan los protocolos y cómo usar las aplicaciones más populares.',
    '4h 30m',
    'Principiante',
    'defi',
    'Carlos Mendoza',
    1250,
    4.8,
    ARRAY['Smart Contracts', 'Uniswap', 'Metamask', 'Wallet Security'],
    ARRAY['Computadora con acceso a internet', 'Ganas de aprender sobre finanzas descentralizadas', 'Conocimientos básicos de criptomonedas'],
    ARRAY['Personas sin experiencia en DeFi', 'Inversores principiantes en crypto', 'Estudiantes de finanzas'],
    'https://circle.so/introduccion-defi',
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
    'published',
    TRUE
),
(
    'DeFAI: IA y Blockchain',
    'Explora la intersección entre inteligencia artificial y blockchain. Aprende cómo la IA está transformando DeFi con trading automatizado y gestión de riesgos.',
    '6h 15m',
    'Avanzado',
    'defai',
    'Ana Rodriguez',
    890,
    4.9,
    ARRAY['Machine Learning', 'Trading Bots', 'Risk Management', 'DeFi Protocols'],
    ARRAY['Conocimientos avanzados de blockchain', 'Experiencia básica en Python o programación', 'Comprensión de conceptos DeFi'],
    ARRAY['Desarrolladores blockchain experimentados', 'Data Scientists interesados en crypto', 'Traders buscando automatización'],
    'https://circle.so/defai-course',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
    'published',
    TRUE
),
(
    'Trading DeFi Avanzado',
    'Domina las estrategias de trading en DeFi. Aprende sobre yield farming, arbitraje, y técnicas avanzadas para maximizar tus ganancias.',
    '8h 45m',
    'Avanzado',
    'trading',
    'Miguel Torres',
    756,
    4.7,
    ARRAY['Yield Farming', 'Arbitrage', 'Liquidity Mining', 'Risk Analysis'],
    'https://circle.so/trading-defi-avanzado',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
    'published',
    FALSE
),
(
    'Fintech y Blockchain',
    'Comprende cómo blockchain está revolucionando el sector fintech. Desde pagos digitales hasta servicios bancarios descentralizados.',
    '5h 20m',
    'Intermedio',
    'fintech',
    'Laura González',
    1100,
    4.6,
    ARRAY['Digital Payments', 'CBDC', 'Banking Innovation', 'Regulatory Framework'],
    'https://circle.so/fintech-blockchain',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400',
    'published',
    TRUE
),
(
    'Smart Contracts con Solidity',
    'Aprende a desarrollar smart contracts seguros y eficientes. Desde los conceptos básicos hasta patrones avanzados de desarrollo.',
    '12h 30m',
    'Intermedio',
    'defi',
    'Roberto Silva',
    650,
    4.8,
    ARRAY['Solidity', 'Security Patterns', 'Gas Optimization', 'Testing'],
    'https://circle.so/solidity-contracts',
    'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400',
    'published',
    FALSE
),
(
    'NFTs y Metaverso',
    'Explora el mundo de los NFTs y su aplicación en el metaverso. Aprende sobre creación, trading y aplicaciones innovadoras.',
    '3h 45m',
    'Principiante',
    'defi',
    'Sofia Martinez',
    980,
    4.5,
    ARRAY['NFT Creation', 'OpenSea', 'Metaverse', 'Digital Art'],
    'https://circle.so/nfts-metaverso',
    'https://images.unsplash.com/photo-1620207418302-439b387441b0?w=400',
    'published',
    TRUE
),
(
    'Análisis Técnico Crypto',
    'Domina el análisis técnico aplicado a criptomonedas. Aprende a identificar patrones y tomar decisiones de trading informadas.',
    '7h 15m',
    'Intermedio',
    'trading',
    'Diego Ramirez',
    1350,
    4.7,
    ARRAY['Chart Patterns', 'Technical Indicators', 'Risk Management', 'Trading Psychology'],
    'https://circle.so/analisis-tecnico-crypto',
    'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400',
    'published',
    FALSE
),
(
    'Seguridad en DeFi',
    'Aprende a proteger tus activos en DeFi. Desde wallets seguras hasta identificación de scams y mejores prácticas de seguridad.',
    '4h 00m',
    'Intermedio',
    'defi',
    'Patricia López',
    720,
    4.9,
    ARRAY['Wallet Security', 'Scam Prevention', 'Multi-sig', 'Cold Storage'],
    'https://circle.so/seguridad-defi',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400',
    'published',
    TRUE
),
(
    'DAO y Gobernanza',
    'Comprende cómo funcionan las Organizaciones Autónomas Descentralizadas. Aprende sobre gobernanza, voting y participación comunitaria.',
    '5h 30m',
    'Avanzado',
    'defi',
    'Fernando Castro',
    540,
    4.6,
    ARRAY['DAO Governance', 'Voting Mechanisms', 'Token Economics', 'Community Building'],
    'https://circle.so/dao-gobernanza',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400',
    'draft',
    FALSE
),
(
    'Regulación Crypto Global',
    'Mantente actualizado sobre el panorama regulatorio de criptomonedas a nivel global. Impacto en México y Latinoamérica.',
    '3h 15m',
    'Principiante',
    'fintech',
    'Andrés Morales',
    430,
    4.4,
    ARRAY['Crypto Regulation', 'Legal Framework', 'Compliance', 'Tax Implications'],
    'https://circle.so/regulacion-crypto',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400',
    'published',
    FALSE
);

-- ================================================================================
-- Verificar que la tabla se creó correctamente
-- ================================================================================

-- Mostrar estructura de la tabla
\d+ public.courses;

-- Mostrar datos insertados
SELECT 
    id,
    title,
    category,
    level,
    instructor,
    students,
    rating,
    status,
    featured,
    created_at
FROM public.courses
ORDER BY created_at DESC;

-- Mostrar estadísticas
SELECT 
    COUNT(*) as total_courses,
    COUNT(*) FILTER (WHERE status = 'published') as published,
    COUNT(*) FILTER (WHERE featured = TRUE) as featured,
    ROUND(AVG(rating), 2) as avg_rating,
    SUM(students) as total_students
FROM public.courses;

-- Mostrar por categoría
SELECT 
    category,
    COUNT(*) as count,
    ROUND(AVG(rating), 2) as avg_rating,
    SUM(students) as total_students
FROM public.courses
WHERE status = 'published'
GROUP BY category
ORDER BY count DESC;