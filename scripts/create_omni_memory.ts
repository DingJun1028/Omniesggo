/**
 * A08 Phase 1 — OmniMemory & OmniTraceLog Bootstrap Script
 * scripts/create_omni_memory.ts
 *
 * Ensures tables exist in Supabase with correct columns.
 * Run via: npx tsx scripts/create_omni_memory.ts
 * Prisma 已移除：改以 pg (DATABASE_URL) 直接執行 DDL。
 */

import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '',
  max: 5,
});

async function bootstrap() {
  console.log("A08 Bootstrap — creating OmniMemory & OmniTraceLog tables if absent...");

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public."OmniMemory" (
        "id"           TEXT NOT NULL,
        "userId"       TEXT NOT NULL DEFAULT 'junai-key',
        "agentId"      TEXT NOT NULL DEFAULT 'omni-agent',
        "type"         TEXT NOT NULL DEFAULT 'claim',
        "content"      TEXT NOT NULL,
        "keywords"     TEXT NOT NULL DEFAULT '[]',
        "confidence"   DOUBLE PRECISION NOT NULL DEFAULT 1.0,
        "sourceOrigin" TEXT NOT NULL DEFAULT 'omni-memory',
        "metadata"     TEXT,
        "lastAccessed" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "OmniMemory_pkey" PRIMARY KEY ("id")
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS "OmniMemory_userId_idx"  ON public."OmniMemory"("userId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "OmniMemory_agentId_idx" ON public."OmniMemory"("agentId");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "OmniMemory_type_idx"    ON public."OmniMemory"("type");`);
    console.log("  [OK] OmniMemory table ready.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS public."OmniTraceLog" (
        "id"          TEXT NOT NULL,
        "uuid"        TEXT NOT NULL,
        "type"        TEXT NOT NULL DEFAULT 'seal',
        "agent"       TEXT NOT NULL DEFAULT 'omni-agent',
        "originCause" TEXT NOT NULL DEFAULT '',
        "hashLock"    TEXT,
        "metadata"    TEXT,
        "timestamp"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "OmniTraceLog_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "OmniTraceLog_uuid_key" UNIQUE ("uuid")
      );
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS "OmniTraceLog_type_idx"      ON public."OmniTraceLog"("type");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "OmniTraceLog_agent_idx"     ON public."OmniTraceLog"("agent");`);
    await pool.query(`CREATE INDEX IF NOT EXISTS "OmniTraceLog_timestamp_idx" ON public."OmniTraceLog"("timestamp");`);
    console.log("  [OK] OmniTraceLog table ready.");

    console.log("\nA08 Bootstrap complete. (Supabase direct connection — no Prisma client needed.)");
  } catch (err) {
    console.error("Bootstrap error:", err);
  } finally {
    await pool.end();
  }
}

bootstrap();
