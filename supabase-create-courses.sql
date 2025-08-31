CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  duration VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('Principiante', 'Intermedio', 'Avanzado')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('defi', 'defai', 'fintech', 'trading')),
  instructor VARCHAR(255) NOT NULL,
  students INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 4.0 CHECK (rating >= 1.0 AND rating <= 5.0),
  topics TEXT[] DEFAULT '{}',
  circle_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('published', 'draft', 'archived')),
  featured BOOLEAN DEFAULT false,
  views_count INTEGER DEFAULT 0,
  enrollments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(featured);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_students ON courses(students DESC);
CREATE INDEX IF NOT EXISTS idx_courses_rating ON courses(rating DESC);

CREATE INDEX IF NOT EXISTS idx_courses_search ON courses 
USING gin(to_tsvector('spanish', title || ' ' || description || ' ' || instructor));

CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de todos los cursos" ON courses
  FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserción de cursos" ON courses
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir actualización de cursos" ON courses
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir eliminación de cursos" ON courses
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

INSERT INTO courses (
  title, description, duration, level, category, instructor, students, rating, topics, circle_url, featured, status
) VALUES
(
  'DeFi Security Best Practices',
  'Protege tus activos en el ecosistema DeFi aprendiendo las mejores prácticas de seguridad',
  '3h 45m',
  'Intermedio',
  'defi',
  'Miguel Santos',
  2100,
  4.7,
  ARRAY['Smart Contract Audits', 'Wallet Security', 'Rug Pull Prevention'],
  'https://circle.so/defi-security',
  true,
  'published'
),
(
  'DeFi Fundamentals',
  'Aprende los conceptos básicos de las finanzas descentralizadas desde cero',
  '2h 30m',
  'Principiante',
  'defi',
  'Carlos Mendez',
  1240,
  4.8,
  ARRAY['Lending', 'DEX', 'Yield Farming', 'Liquidity Pools'],
  'https://circle.so/defi-fundamentals',
  false,
  'published'
),
(
  'Advanced DeFi Strategies',
  'Estrategias avanzadas para maximizar rendimientos en DeFi',
  '4h 15m',
  'Avanzado',
  'defi',
  'Ana Rodriguez',
  856,
  4.9,
  ARRAY['Flash Loans', 'Arbitrage', 'MEV', 'Protocol Governance'],
  'https://circle.so/advanced-defi',
  false,
  'published'
),
(
  'Introduction to DeFAI',
  'Inteligencia artificial aplicada a finanzas descentralizadas',
  '3h 20m',
  'Intermedio',
  'defai',
  'Laura Garcia',
  920,
  4.6,
  ARRAY['AI Trading Bots', 'Predictive Analytics', 'Automated Strategies'],
  'https://circle.so/defai-intro',
  false,
  'published'
),
(
  'Machine Learning for DeFi',
  'Aplica machine learning a trading y análisis DeFi',
  '5h 10m',
  'Avanzado',
  'defai',
  'Roberto Kim',
  645,
  4.8,
  ARRAY['Neural Networks', 'Risk Management', 'Portfolio Optimization'],
  'https://circle.so/defai-ml',
  false,
  'published'
),
(
  'Fintech en México: Regulación y Oportunidades',
  'Panorama del sector fintech mexicano y su marco regulatorio',
  '2h 15m',
  'Intermedio',
  'fintech',
  'Patricia Vega',
  1180,
  4.5,
  ARRAY['Regulación', 'Sandbox Regulatorio', 'Fintech Law'],
  'https://circle.so/fintech-mexico',
  false,
  'published'
);

SELECT title, instructor, category, level, students, rating, status, featured
FROM courses 
ORDER BY students DESC;