/**
 * scripts/validate-env.ts
 * Validates required environment variables before build/deploy.
 * Exits with code 1 if any required variable is missing or empty.
 */
import fs from 'fs';
import path from 'path';

type EnvRec = { key: string; required: boolean; defaultValue?: string };

const requiredEnv: EnvRec[] = [
  { key: 'NODE_ENV', required: false, defaultValue: 'production' },
  { key: 'DATABASE_URL', required: true },
  { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', required: false },
  { key: 'FIREBASE_PROJECT_ID', required: false },
  { key: 'FIREBASE_SERVICE_ACCOUNT_JSON', required: false },
  { key: 'AGENTIC_TWIN_OLLAMA_URL', required: false, defaultValue: 'http://127.0.0.1:11434' },
  { key: 'MINIO_ENDPOINT', required: false, defaultValue: 'http://127.0.0.1:19001' },
  { key: 'WEBHOOK_SECRET', required: false },
  { key: 'CRON_SECRET', required: false },
  { key: 'MEMORY_API_KEY', required: false },
];

function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};
  const content = fs.readFileSync(filePath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

function main() {
  const envPath = path.join(process.cwd(), '.env');
  const hasEnvFile = fs.existsSync(envPath);
  if (!hasEnvFile) {
    // CI / hosted builds (GitHub Actions, Vercel) inject variables directly into
    // the process environment and never ship a .env file. Fall back to
    // process.env instead of hard-failing — the required-variable gate below
    // still applies, so a genuinely missing variable is still an error.
    console.warn('No .env file at', envPath, '- falling back to process.env');
  }
  const env = hasEnvFile ? loadEnvFile(envPath) : {};
  const missing: string[] = [];
  const empty: string[] = [];

  for (const rec of requiredEnv) {
    const value = env[rec.key] || process.env[rec.key];
    if (!value) {
      if (rec.required) missing.push(rec.key);
    } else if (value.trim() === '' && rec.required) {
      empty.push(rec.key);
    }
  }

  if (missing.length || empty.length) {
    console.error('Environment validation failed:');
    for (const key of missing) console.error(`  - Missing required: ${key}`);
    for (const key of empty) console.error(`  - Empty required: ${key}`);
    process.exit(1);
  }

  console.log(`Environment validation passed (${requiredEnv.length} checks).`);
}

main();
