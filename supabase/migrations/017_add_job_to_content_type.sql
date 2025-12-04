-- =============================================
-- Migración: 017_add_job_to_content_type.sql
-- Descripción: Agrega 'job' al enum content_type
--              para permitir propuestas de tipo job
-- =============================================

-- Agregar 'job' al enum de content_type
-- Nota: En PostgreSQL, no se puede eliminar valores de un enum,
-- pero sí se pueden agregar nuevos valores
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'job';

