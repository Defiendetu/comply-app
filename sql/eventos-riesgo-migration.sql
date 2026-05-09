-- ===========================================
-- Reporte de Eventos de Riesgo - Migration
-- Run in Supabase SQL Editor
-- ===========================================

CREATE TABLE IF NOT EXISTS eventos_riesgo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,

  -- Classification
  clasificacion TEXT NOT NULL DEFAULT 'inusual',  -- 'inusual' | 'sospechosa'
  tipo_riesgo TEXT NOT NULL DEFAULT 'lavado',     -- 'lavado' | 'terrorismo' | 'proliferacion'

  -- Event details
  descripcion TEXT NOT NULL,
  impacto_potencial TEXT,
  acciones_tomadas TEXT,
  comentarios TEXT,

  -- Reporter
  reportante_nombre TEXT,
  reportante_identificacion TEXT,

  -- Contraparte link (optional)
  contraparte_id UUID REFERENCES contrapartes(id),
  contraparte_nombre TEXT,

  -- Status & tracking
  estado TEXT NOT NULL DEFAULT 'abierto',  -- 'abierto' | 'en_revision' | 'cerrado' | 'reportado_uiaf'
  fecha_reporte_uiaf TIMESTAMPTZ,
  nivel_riesgo_sugerido TEXT,              -- 'bajo' | 'medio' | 'alto' | 'critico'
  confianza_clasificacion TEXT,            -- 'baja' | 'media' | 'alta'

  -- AI analysis
  analisis_ia JSONB,

  -- Document
  documento_id UUID REFERENCES documentos(id),

  -- Metadata
  mes_reporte TEXT,
  anio_reporte INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE eventos_riesgo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own risk events"
ON eventos_riesgo FOR ALL
USING (user_email = auth.jwt()->>'email')
WITH CHECK (user_email = auth.jwt()->>'email');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_eventos_riesgo_empresa ON eventos_riesgo(empresa_id);
CREATE INDEX IF NOT EXISTS idx_eventos_riesgo_contraparte ON eventos_riesgo(contraparte_id);
CREATE INDEX IF NOT EXISTS idx_eventos_riesgo_estado ON eventos_riesgo(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_riesgo_clasificacion ON eventos_riesgo(clasificacion);
