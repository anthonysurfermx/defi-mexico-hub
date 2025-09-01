-- Crear tabla para fondos fintech con datos estáticos
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS fintech_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  platform VARCHAR(100) NOT NULL,
  apy DECIMAL(5,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Bajo', 'Medio', 'Alto')),
  fund_type VARCHAR(50) NOT NULL,
  investment_horizon VARCHAR(50) NOT NULL,
  tvl VARCHAR(20),
  description TEXT,
  minimum_investment DECIMAL(15,2),
  fee_percentage DECIMAL(4,2),
  liquidity VARCHAR(50),
  regulator VARCHAR(100),
  website_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_fintech_funds_platform ON fintech_funds(platform);
CREATE INDEX IF NOT EXISTS idx_fintech_funds_currency ON fintech_funds(currency);
CREATE INDEX IF NOT EXISTS idx_fintech_funds_risk ON fintech_funds(risk_level);
CREATE INDEX IF NOT EXISTS idx_fintech_funds_apy ON fintech_funds(apy DESC);
CREATE INDEX IF NOT EXISTS idx_fintech_funds_status ON fintech_funds(status);

-- Deshabilitar RLS para simplicidad (puedes habilitarlo después)
ALTER TABLE fintech_funds DISABLE ROW LEVEL SECURITY;

-- Insertar datos de fondos fintech mexicanos (datos que obtuvo ChatGPT)
INSERT INTO fintech_funds (
  name, platform, apy, currency, risk_level, fund_type, investment_horizon, 
  tvl, description, minimum_investment, fee_percentage, liquidity, regulator, website_url
) VALUES
-- GBM (Grupo Bursátil Mexicano)
(
  'GBMCASH - Liquidez en dólares',
  'GBM',
  4.70,
  'USD',
  'Alto',
  'Renta Fija',
  'Corto plazo',
  '150M',
  'Fondo con liquidez diaria en dólares estadounidenses',
  1000.00,
  0.75,
  'Diaria',
  'CNBV',
  'https://gbm.com'
),
(
  'GBMF2 - Fondo de liquidez',
  'GBM',
  3.50,
  'MXN',
  'Bajo',
  'Liquidez',
  'Corto plazo',
  '2.3B',
  'Fondo de liquidez para el mercado mexicano',
  100.00,
  0.50,
  'Inmediata',
  'CNBV',
  'https://gbm.com'
),
(
  'GBMDEUDA - Instrumentos de deuda',
  'GBM',
  5.20,
  'MXN',
  'Medio',
  'Renta Fija',
  'Mediano plazo',
  '890M',
  'Inversión en instrumentos de deuda gubernamental y corporativa',
  5000.00,
  1.00,
  'Semanal',
  'CNBV',
  'https://gbm.com'
),
(
  'GBMGLOBAL - Mercados globales',
  'GBM',
  6.80,
  'USD',
  'Alto',
  'Renta Variable',
  'Largo plazo',
  '340M',
  'Diversificación en mercados desarrollados y emergentes',
  10000.00,
  1.50,
  'Mensual',
  'CNBV',
  'https://gbm.com'
),

-- Kuspit (Fintech mexicana)
(
  'Kuspit Ahorro Plus',
  'Kuspit',
  8.50,
  'MXN',
  'Medio',
  'Ahorro Digital',
  'Flexible',
  '45M',
  'Cuenta de ahorro digital con rendimientos competitivos',
  1.00,
  0.00,
  'Diaria',
  'CNBV',
  'https://kuspit.com'
),
(
  'Kuspit Inversión',
  'Kuspit',
  11.20,
  'MXN',
  'Medio',
  'Fondos de Inversión',
  'Mediano plazo',
  '23M',
  'Portafolio diversificado de instrumentos mexicanos',
  100.00,
  0.90,
  'Semanal',
  'CNBV',
  'https://kuspit.com'
),

-- Fintual México
(
  'Fintual Conservador',
  'Fintual',
  6.30,
  'MXN',
  'Bajo',
  'Robo Advisor',
  'Corto plazo',
  '120M',
  'Portafolio conservador con enfoque en estabilidad',
  1000.00,
  0.49,
  'Diaria',
  'CNBV',
  'https://fintual.mx'
),
(
  'Fintual Moderado',
  'Fintual',
  8.90,
  'MXN',
  'Medio',
  'Robo Advisor',
  'Mediano plazo',
  '89M',
  'Balance entre crecimiento y estabilidad',
  1000.00,
  0.49,
  'Diaria',
  'CNBV',
  'https://fintual.mx'
),
(
  'Fintual Arriesgado',
  'Fintual',
  12.40,
  'MXN',
  'Alto',
  'Robo Advisor',
  'Largo plazo',
  '67M',
  'Portafolio orientado al crecimiento con mayor volatilidad',
  1000.00,
  0.49,
  'Diaria',
  'CNBV',
  'https://fintual.mx'
),

-- Cetesdirecto (Gobierno de México)
(
  'CETES 28 días',
  'Cetesdirecto',
  10.85,
  'MXN',
  'Bajo',
  'Gubernamental',
  'Corto plazo',
  '1.2T',
  'Certificados de la Tesorería de la Federación',
  100.00,
  0.00,
  'Al vencimiento',
  'Gobierno Federal',
  'https://cetesdirecto.com'
),
(
  'CETES 91 días',
  'Cetesdirecto',
  10.95,
  'MXN',
  'Bajo',
  'Gubernamental',
  'Corto plazo',
  '800B',
  'Certificados de la Tesorería con mayor plazo',
  100.00,
  0.00,
  'Al vencimiento',
  'Gobierno Federal',
  'https://cetesdirecto.com'
),
(
  'BONDDIA - Bonos de Desarrollo',
  'Cetesdirecto',
  9.85,
  'MXN',
  'Bajo',
  'Gubernamental',
  'Largo plazo',
  '456B',
  'Bonos de Desarrollo del Gobierno Federal con pago de intereses',
  100.00,
  0.00,
  'Al vencimiento',
  'Gobierno Federal',
  'https://cetesdirecto.com'
);

-- Verificar inserción
SELECT 
  COUNT(*) as total_funds,
  COUNT(DISTINCT platform) as platforms,
  AVG(apy) as avg_apy,
  MIN(apy) as min_apy,
  MAX(apy) as max_apy
FROM fintech_funds;

-- Mostrar resumen por plataforma
SELECT 
  platform,
  COUNT(*) as funds_count,
  AVG(apy) as avg_apy,
  MIN(apy) as min_apy,
  MAX(apy) as max_apy
FROM fintech_funds
GROUP BY platform
ORDER BY avg_apy DESC;