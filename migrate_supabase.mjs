import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.rxdnylmzkqevzrlxwyri:Onces19982004!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const statements = [
  // 1. Tabla migracion_conceptos
  `CREATE TABLE IF NOT EXISTS migracion_conceptos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          TEXT                NOT NULL,
    concepto        TEXT,
    meta4_formula   TEXT,
    cegid_formula   TEXT,
    logica_aplicada TEXT,
    anotaciones     TEXT,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT now()
  )`,

  // Indice
  `CREATE INDEX IF NOT EXISTS idx_migracion_conceptos_job_id ON migracion_conceptos (job_id)`,

  // RLS
  `ALTER TABLE migracion_conceptos ENABLE ROW LEVEL SECURITY`,

  // Politica anon SELECT
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='migracion_conceptos' AND policyname='anon_select_migracion_conceptos') THEN
      CREATE POLICY "anon_select_migracion_conceptos" ON migracion_conceptos FOR SELECT TO anon USING (true);
    END IF;
  END $$`,

  // Politica service_role INSERT
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='migracion_conceptos' AND policyname='service_insert_migracion_conceptos') THEN
      CREATE POLICY "service_insert_migracion_conceptos" ON migracion_conceptos FOR INSERT TO service_role WITH CHECK (true);
    END IF;
  END $$`,

  // Realtime
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='migracion_conceptos') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE migracion_conceptos;
    END IF;
  END $$`,

  // 2. Tabla migracion_jobs
  `CREATE TABLE IF NOT EXISTS migracion_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          TEXT        UNIQUE NOT NULL,
    file_name       TEXT,
    status          TEXT        NOT NULL DEFAULT 'pending',
    total_conceptos INTEGER     DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
  )`,

  // RLS jobs
  `ALTER TABLE migracion_jobs ENABLE ROW LEVEL SECURITY`,

  // Politica anon SELECT jobs
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='migracion_jobs' AND policyname='anon_select_migracion_jobs') THEN
      CREATE POLICY "anon_select_migracion_jobs" ON migracion_jobs FOR SELECT TO anon USING (true);
    END IF;
  END $$`,

  // Politica service_role ALL jobs
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='migracion_jobs' AND policyname='service_all_migracion_jobs') THEN
      CREATE POLICY "service_all_migracion_jobs" ON migracion_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
  END $$`,

  // Realtime jobs
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='migracion_jobs') THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE migracion_jobs;
    END IF;
  END $$`,
];

async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado al pooler de Supabase');

    for (let i = 0; i < statements.length; i++) {
      const label = statements[i].trim().substring(0, 60).replace(/\n/g, ' ');
      try {
        await client.query(statements[i]);
        console.log(`  [${i + 1}/${statements.length}] OK — ${label}...`);
      } catch (err) {
        console.error(`  [${i + 1}/${statements.length}] ERROR — ${label}...`);
        console.error(`    → ${err.message}`);
      }
    }

    // Verificar
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('\n📋 Tablas en public schema:');
    rows.forEach(r => console.log(`   • ${r.table_name}`));

  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
  } finally {
    await client.end();
  }
}

main();
