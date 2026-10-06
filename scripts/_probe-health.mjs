import fs from 'node:fs';
process.env.TDAI_GATEWAY_URL = 'http://127.0.0.1:8420';
process.env.TDAI_GATEWAY_API_KEY = fs.readFileSync('C:/Project/esggo/apps/tencentdb-memory/.admin-key', 'utf8').trim();
process.env.TDAI_SERVICE_ID = 'oa-team-swarm';
process.env.HEALTHCHECK_QUIET = '1';
const CORE = process.env.TDAI_GATEWAY_URL ?? 'http://127.0.0.1:8420';
const PING_TIMEOUT_MS = 30000;
const ac = new AbortController();
const t = setTimeout(() => ac.abort(), PING_TIMEOUT_MS);
try {
  const r = await fetch(`${CORE}/health`, { signal: ac.signal });
  console.log('STATUS', r.status);
  const d = await r.json().catch(() => null);
  console.log('OK', d?.status === 'ok', 'raw', JSON.stringify(d)?.slice(0, 160));
} catch (e) {
  console.log('CATCH', e.constructor.name, '|', e.message);
} finally {
  clearTimeout(t);
}
