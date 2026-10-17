#!/usr/bin/env node
// workflow 讀取約定: 在 job 開頭執行 `node scripts/ci-secrets.mjs`，
// 以 GITHUB_OUTPUT 取得 junaikey_status / groq_ready，後續步驟用 if: 判斷是否略過。
// 永遠 exit 0；缺少 secret 只輸出 ::warning::；不輸出任何 secret 值。
import { appendFileSync } from 'node:fs';
import { getJunaikeyTelemetry } from '../vps/junaikey/secrets-gate.mjs';

const t = getJunaikeyTelemetry(process.env);
for (const s of t.secrets) {
  if (s.present) console.log(`::notice::[junaikey] ${s.id} ready (via ${s.via})`);
  else if (s.via === 'default') console.log(`::notice::[junaikey] ${s.id} not set, using default`);
  else console.log(`::warning::[junaikey] ${s.id} missing (${s.names.join(' / ')}), skipped safely`);
}
const groqReady = t.secrets.find((s) => s.id === 'groq-key')?.present === true;
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `junaikey_status=${t.status}\ngroq_ready=${groqReady}\n`);
}
console.log(`[junaikey] status=${t.status} ready=${t.ready}/${t.total}`);
process.exit(0);
