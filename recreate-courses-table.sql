-- Script para RECREAR la tabla courses con TODAS las columnas necesarias
-- ⚠️ CUIDADO: Esto ELIMINARÁ todos los datos existentes
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar tabla existente si existe
DROP TABLE IF EXISTS courses CASCADE;

-- 2. Crear tabla con TODAS las columnas necesarias
CREATE TABLE courses (
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

-- 3. Crear índices
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_level ON courses(level);
CREATE INDEX idx_courses_featured ON courses(featured);
CREATE INDEX idx_courses_created_at ON courses(created_at DESC);

-- 4. Trigger para updated_at
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

-- 5. Deshabilitar RLS temporalmente para facilitar testing
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- 6. Insertar cursos de ejemplo
INSERT INTO courses (
  title, description, duration, level, category, instructor, 
  students, rating, topics, circle_url, featured, status
) VALUES
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
  true,
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
  'Fintech en México',
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

-- 7. Verificar que todo está correcto
SELECT 
  COUNT(*) as total_cursos,
  COUNT(circle_url) as cursos_con_circle_url
FROM courses;

-- 8. Mostrar estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'courses'
ORDER BY ordinal_position;