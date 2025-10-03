-- Migration: Update DeFi Advocates Categories
-- Description: Actualizar categorías de referentes a: Programadores, Abogados, Financieros, Diseñadores, Marketers, Otros

-- Paso 1: Agregar columna temporal
ALTER TABLE public.defi_advocates
ADD COLUMN track_new TEXT;

-- Paso 2: Migrar datos existentes al nuevo formato
UPDATE public.defi_advocates
SET track_new = CASE
  WHEN track::text = 'developer_expert' THEN 'developer'
  WHEN track::text = 'community_advocate' THEN 'other'
  WHEN track::text = 'researcher' THEN 'other'
  WHEN track::text = 'educator' THEN 'other'
  WHEN track::text = 'influencer' THEN 'marketer'
  ELSE 'other'
END;

-- Paso 3: Eliminar columna antigua
ALTER TABLE public.defi_advocates
DROP COLUMN track;

-- Paso 4: Eliminar enum antiguo
DROP TYPE IF EXISTS advocate_track CASCADE;

-- Paso 5: Crear nuevo enum con las categorías actualizadas
CREATE TYPE advocate_track AS ENUM (
  'developer',
  'lawyer',
  'financial',
  'designer',
  'marketer',
  'other'
);

-- Paso 6: Renombrar columna temporal y convertir a enum
ALTER TABLE public.defi_advocates
RENAME COLUMN track_new TO track;

-- Paso 7: Convertir columna a tipo enum
ALTER TABLE public.defi_advocates
ALTER COLUMN track TYPE advocate_track USING track::advocate_track;

-- Paso 8: Establecer valor por defecto
ALTER TABLE public.defi_advocates
ALTER COLUMN track SET DEFAULT 'other'::advocate_track;

-- Paso 9: Recrear índice
DROP INDEX IF EXISTS idx_defi_advocates_track;
CREATE INDEX idx_defi_advocates_track ON public.defi_advocates(track);

-- Comentarios actualizados
COMMENT ON COLUMN public.defi_advocates.track IS 'Tipo de referente: developer (Programador), lawyer (Abogado), financial (Financiero), designer (Diseñador), marketer (Marketer), other (Otro)';
