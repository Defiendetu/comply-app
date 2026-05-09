-- ===========================================
-- Calendario de Cumplimiento - Migration
-- Run in Supabase SQL Editor
-- ===========================================

-- 1. Add regimen column to empresas
ALTER TABLE empresas
ADD COLUMN IF NOT EXISTS regimen TEXT NOT NULL DEFAULT 'minimas';

-- 2. Create eventos_calendario table
CREATE TABLE IF NOT EXISTS eventos_calendario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  regimen TEXT NOT NULL DEFAULT 'minimas',

  obligacion_key TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL,

  fecha_vencimiento TIMESTAMPTZ NOT NULL,
  fecha_completado TIMESTAMPTZ,

  recurrencia TEXT,
  evento_origen_id UUID REFERENCES eventos_calendario(id),

  entidad_tipo TEXT,
  entidad_id UUID,
  entidad_nombre TEXT,

  estado TEXT NOT NULL DEFAULT 'pendiente',
  prioridad TEXT NOT NULL DEFAULT 'media',

  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE eventos_calendario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own calendar events"
ON eventos_calendario FOR ALL
USING (user_email = auth.jwt()->>'email')
WITH CHECK (user_email = auth.jwt()->>'email');

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_eventos_empresa ON eventos_calendario(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eventos_vencimiento ON eventos_calendario(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos_calendario(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_obligacion ON eventos_calendario(obligacion_key);
