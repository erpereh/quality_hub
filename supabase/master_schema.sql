-- ============================================================
-- MASTER SQL SCRIPT — paralelos_sgel / Migrador Meta4→Cegid
-- Ejecutar en:  Supabase Dashboard → SQL Editor → New Query
-- Fecha de generación: 2026-03-11
-- ============================================================

-- ┌─────────────────────────────────────────────────────────┐
-- │  1. TABLA: migracion_conceptos                         │
-- │     Almacena cada fila de transformación IA por job.    │
-- └─────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS migracion_conceptos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          TEXT                NOT NULL,
    concepto        TEXT,
    meta4_formula   TEXT,
    cegid_formula   TEXT,
    logica_aplicada TEXT,
    anotaciones     TEXT,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
);

-- Índice para filtrado rápido por job_id (Realtime + fetch inicial)
CREATE INDEX IF NOT EXISTS idx_migracion_conceptos_job_id
    ON migracion_conceptos (job_id);

-- ┌─────────────────────────────────────────────────────────┐
-- │  2. ROW LEVEL SECURITY (RLS)                           │
-- └─────────────────────────────────────────────────────────┘
ALTER TABLE migracion_conceptos ENABLE ROW LEVEL SECURITY;

-- Lectura pública para el frontend con anon key
CREATE POLICY "anon_select_migracion_conceptos"
    ON migracion_conceptos
    FOR SELECT
    TO anon
    USING (true);

-- Inserción desde service_role (n8n workflow server-side)
CREATE POLICY "service_insert_migracion_conceptos"
    ON migracion_conceptos
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ┌─────────────────────────────────────────────────────────┐
-- │  3. REALTIME                                           │
-- │     Publica INSERTs para que el frontend reciba filas   │
-- │     en tiempo real vía Supabase channels.              │
-- └─────────────────────────────────────────────────────────┘
ALTER PUBLICATION supabase_realtime ADD TABLE migracion_conceptos;

-- ┌─────────────────────────────────────────────────────────┐
-- │  4. TABLA AUXILIAR: migracion_jobs                      │
-- │     Registro de cada ejecución del migrador.           │
-- │     Permite historial, reintentos y métricas futuras.  │
-- └─────────────────────────────────────────────────────────┘
CREATE TABLE IF NOT EXISTS migracion_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          TEXT        UNIQUE NOT NULL,
    file_name       TEXT,
    status          TEXT        NOT NULL DEFAULT 'pending',
                    -- 'pending' | 'processing' | 'completed' | 'error'
    total_conceptos INTEGER     DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

ALTER TABLE migracion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_migracion_jobs"
    ON migracion_jobs
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "service_insert_update_migracion_jobs"
    ON migracion_jobs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Realtime en jobs para poder mostrar progreso/estado en el frontend
ALTER PUBLICATION supabase_realtime ADD TABLE migracion_jobs;

-- ============================================================
-- FIN — Ejecuta todo de una sola vez en el SQL Editor.
-- ============================================================
