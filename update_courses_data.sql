-- Script para actualizar datos de ejemplo con nuevos campos
-- Ejecutar después del script principal

-- Agregar columnas si no existen (para actualizar una tabla existente)
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS requirements TEXT[] DEFAULT '{}';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS target_audience TEXT[] DEFAULT '{}';

-- Limpiar datos anteriores (opcional)
-- DELETE FROM public.courses;

-- Insertar datos actualizados con todos los campos
INSERT INTO public.courses (
    title, description, duration, level, category, instructor, students, rating,
    topics, requirements, target_audience, circle_url, thumbnail_url, status, featured
) VALUES 
-- Curso 1: Introducción a DeFi
(
    'Introducción a DeFi',
    'Aprende los fundamentos de las finanzas descentralizadas desde cero. Entiende qué es DeFi, cómo funcionan los protocolos y cómo usar las aplicaciones más populares.',
    '4h 30m', 'Principiante', 'defi', 'Carlos Mendoza', 1250, 4.8,
    ARRAY['Smart Contracts', 'Uniswap', 'Metamask', 'Wallet Security'],
    ARRAY['Computadora con acceso a internet', 'Ganas de aprender sobre finanzas descentralizadas', 'Conocimientos básicos de criptomonedas'],
    ARRAY['Personas sin experiencia en DeFi', 'Inversores principiantes en crypto', 'Estudiantes de finanzas'],
    'https://circle.so/introduccion-defi', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400', 'published', TRUE
),

-- Curso 2: DeFAI
(
    'DeFAI: IA y Blockchain',
    'Explora la intersección entre inteligencia artificial y blockchain. Aprende cómo la IA está transformando DeFi con trading automatizado y gestión de riesgos.',
    '6h 15m', 'Avanzado', 'defai', 'Ana Rodriguez', 890, 4.9,
    ARRAY['Machine Learning', 'Trading Bots', 'Risk Management', 'DeFi Protocols'],
    ARRAY['Conocimientos avanzados de blockchain', 'Experiencia básica en Python o programación', 'Comprensión de conceptos DeFi'],
    ARRAY['Desarrolladores blockchain experimentados', 'Data Scientists interesados en crypto', 'Traders buscando automatización'],
    'https://circle.so/defai-course', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400', 'published', TRUE
),

-- Curso 3: Trading DeFi Avanzado
(
    'Trading DeFi Avanzado',
    'Domina las estrategias de trading en DeFi. Aprende sobre yield farming, arbitraje, y técnicas avanzadas para maximizar tus ganancias.',
    '8h 45m', 'Avanzado', 'trading', 'Miguel Torres', 756, 4.7,
    ARRAY['Yield Farming', 'Arbitrage', 'Liquidity Mining', 'Risk Analysis'],
    ARRAY['Experiencia en trading tradicional', 'Conocimientos de DeFi intermedio', 'Capital para invertir'],
    ARRAY['Traders con experiencia', 'Inversores sofisticados', 'Gestores de fondos crypto'],
    'https://circle.so/trading-defi-avanzado', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400', 'published', FALSE
),

-- Curso 4: Fintech y Blockchain
(
    'Fintech y Blockchain',
    'Comprende cómo blockchain está revolucionando el sector fintech. Desde pagos digitales hasta servicios bancarios descentralizados.',
    '5h 20m', 'Intermedio', 'fintech', 'Laura González', 1100, 4.6,
    ARRAY['Digital Payments', 'CBDC', 'Banking Innovation', 'Regulatory Framework'],
    ARRAY['Conocimientos básicos de blockchain', 'Experiencia en sector financiero (deseable)', 'Computadora con acceso a internet'],
    ARRAY['Profesionales del sector financiero', 'Emprendedores fintech', 'Reguladores y compliance officers'],
    'https://circle.so/fintech-blockchain', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400', 'published', TRUE
),

-- Curso 5: Smart Contracts con Solidity
(
    'Smart Contracts con Solidity',
    'Aprende a desarrollar smart contracts seguros y eficientes. Desde los conceptos básicos hasta patrones avanzados de desarrollo.',
    '12h 30m', 'Intermedio', 'defi', 'Roberto Silva', 650, 4.8,
    ARRAY['Solidity', 'Security Patterns', 'Gas Optimization', 'Testing'],
    ARRAY['Experiencia básica en programación', 'Conocimientos de JavaScript (deseable)', 'Entorno de desarrollo configurado'],
    ARRAY['Desarrolladores web', 'Programadores interesados en blockchain', 'Estudiantes de informática'],
    'https://circle.so/solidity-contracts', 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400', 'published', FALSE
),

-- Curso 6: NFTs y Metaverso
(
    'NFTs y Metaverso',
    'Explora el mundo de los NFTs y su aplicación en el metaverso. Aprende sobre creación, trading y aplicaciones innovadoras.',
    '3h 45m', 'Principiante', 'defi', 'Sofia Martinez', 980, 4.5,
    ARRAY['NFT Creation', 'OpenSea', 'Metaverse', 'Digital Art'],
    ARRAY['Wallet de criptomonedas configurada', 'Ganas de explorar nuevas tecnologías', 'Creatividad y mente abierta'],
    ARRAY['Artistas digitales', 'Creadores de contenido', 'Inversores en activos digitales'],
    'https://circle.so/nfts-metaverso', 'https://images.unsplash.com/photo-1620207418302-439b387441b0?w=400', 'published', TRUE
),

-- Curso 7: Análisis Técnico Crypto
(
    'Análisis Técnico Crypto',
    'Domina el análisis técnico aplicado a criptomonedas. Aprende a identificar patrones y tomar decisiones de trading informadas.',
    '7h 15m', 'Intermedio', 'trading', 'Diego Ramirez', 1350, 4.7,
    ARRAY['Chart Patterns', 'Technical Indicators', 'Risk Management', 'Trading Psychology'],
    ARRAY['Conocimientos básicos de trading', 'Comprensión de mercados financieros', 'Paciencia y disciplina'],
    ARRAY['Traders principiantes e intermedios', 'Inversores a largo plazo', 'Analistas financieros'],
    'https://circle.so/analisis-tecnico-crypto', 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400', 'published', FALSE
),

-- Curso 8: Seguridad en DeFi
(
    'Seguridad en DeFi',
    'Aprende a proteger tus activos en DeFi. Desde wallets seguras hasta identificación de scams y mejores prácticas de seguridad.',
    '4h 00m', 'Intermedio', 'defi', 'Patricia López', 720, 4.9,
    ARRAY['Wallet Security', 'Scam Prevention', 'Multi-sig', 'Cold Storage'],
    ARRAY['Experiencia básica con wallets crypto', 'Conocimientos de DeFi básico', 'Activos crypto para proteger'],
    ARRAY['Usuarios de DeFi con activos', 'Inversores institucionales', 'Administradores de tesorería crypto'],
    'https://circle.so/seguridad-defi', 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400', 'published', TRUE
),

-- Curso 9: DAO y Gobernanza
(
    'DAO y Gobernanza',
    'Comprende cómo funcionan las Organizaciones Autónomas Descentralizadas. Aprende sobre gobernanza, voting y participación comunitaria.',
    '5h 30m', 'Avanzado', 'defi', 'Fernando Castro', 540, 4.6,
    ARRAY['DAO Governance', 'Voting Mechanisms', 'Token Economics', 'Community Building'],
    ARRAY['Conocimientos avanzados de DeFi', 'Experiencia en gobernanza organizacional', 'Tokens de gobernanza (para práctica)'],
    ARRAY['Líderes de comunidades crypto', 'Desarrolladores de protocolos DeFi', 'Inversores en tokens de gobernanza'],
    'https://circle.so/dao-gobernanza', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400', 'draft', FALSE
),

-- Curso 10: Regulación Crypto Global
(
    'Regulación Crypto Global',
    'Mantente actualizado sobre el panorama regulatorio de criptomonedas a nivel global. Impacto en México y Latinoamérica.',
    '3h 15m', 'Principiante', 'fintech', 'Andrés Morales', 430, 4.4,
    ARRAY['Crypto Regulation', 'Legal Framework', 'Compliance', 'Tax Implications'],
    ARRAY['Interés en aspectos legales', 'Comprensión básica del sistema financiero', 'Ganas de mantenerse actualizado'],
    ARRAY['Profesionales legales', 'Contadores y asesores fiscales', 'Empresarios del sector crypto'],
    'https://circle.so/regulacion-crypto', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400', 'published', FALSE
)

ON CONFLICT (id) DO UPDATE SET
    requirements = EXCLUDED.requirements,
    target_audience = EXCLUDED.target_audience,
    updated_at = NOW();