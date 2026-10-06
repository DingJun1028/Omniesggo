import { Client } from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function createTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    
    // Create OmniTraceLogs
    await client.query(`
      CREATE TABLE IF NOT EXISTS "public"."OmniTraceLogs" (
        "uuid" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "originCause" TEXT NOT NULL,
        "hashLock" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "agent" TEXT NOT NULL,
        CONSTRAINT "OmniTraceLogs_pkey" PRIMARY KEY ("uuid")
      );
      CREATE INDEX IF NOT EXISTS "OmniTraceLogs_type_idx" ON "public"."OmniTraceLogs"("type");
      CREATE INDEX IF NOT EXISTS "OmniTraceLogs_agent_idx" ON "public"."OmniTraceLogs"("agent");
    `);

    // Create MaterialityAssessments
    await client.query(`
      CREATE TABLE IF NOT EXISTS "public"."MaterialityAssessments" (
        "uuid" TEXT NOT NULL,
        "year" INTEGER NOT NULL,
        "threshold" DOUBLE PRECISION NOT NULL,
        "topics_snapshot" TEXT NOT NULL,
        "hash_lock" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "source_origin" TEXT NOT NULL,
        "timestamp" BIGINT NOT NULL,
        CONSTRAINT "MaterialityAssessments_pkey" PRIMARY KEY ("uuid")
      );
      CREATE INDEX IF NOT EXISTS "MaterialityAssessments_year_idx" ON "public"."MaterialityAssessments"("year");
      CREATE INDEX IF NOT EXISTS "MaterialityAssessments_hash_lock_idx" ON "public"."MaterialityAssessments"("hash_lock");
    `);

    // Create ESGReportSeals
    await client.query(`
      CREATE TABLE IF NOT EXISTS "public"."ESGReportSeals" (
        "uuid" TEXT NOT NULL,
        "chapter_id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "metadata" TEXT,
        "hash_lock" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "source_origin" TEXT NOT NULL,
        "timestamp" BIGINT NOT NULL,
        CONSTRAINT "ESGReportSeals_pkey" PRIMARY KEY ("uuid")
      );
      CREATE INDEX IF NOT EXISTS "ESGReportSeals_chapter_id_idx" ON "public"."ESGReportSeals"("chapter_id");
      CREATE INDEX IF NOT EXISTS "ESGReportSeals_hash_lock_idx" ON "public"."ESGReportSeals"("hash_lock");
    `);

    console.log("✅ Tables created successfully!");
  } catch (err) {
    console.error("❌ Failed to create tables:", err);
  } finally {
    await client.end();
  }
}

createTables();
