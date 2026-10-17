// G18: Junaikey secrets 統一取用層測試
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, readFileSync as rf } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  SECRET_REGISTRY, resolveSecret, inspectSecrets, getJunaikeyTelemetry, redactSecrets,
} from '../vps/junaikey/secrets-gate.mjs';

const SENTINEL = 'sentinel-SECRET-value-9f3a';
let passed = 0;
function t(name, fn) {
  try { fn(); passed++; console.log('ok  G18 ' + name); }
  catch (e) { console.error('FAIL G18 ' + name + ': ' + e.message); process.exitCode = 1; }
}

t('registry is frozen and covers groq/hermes', () => {
  assert.ok(Object.isFrozen(SECRET_REGISTRY));
  const ids = SECRET_REGISTRY.map((e) => e.id);
  for (const id of ['groq-key', 'hermes-base', 'hermes-model']) assert.ok(ids.includes(id));
});
t('missing secrets degrade without throwing', () => {
  const tel = getJunaikeyTelemetry({});
  assert.equal(tel.status, 'degraded');
  assert.equal(tel.secrets.find((s) => s.id === 'groq-key').via, 'missing');
  assert.equal(tel.secrets.find((s) => s.id === 'hermes-model').via, 'default');
});
t('HERMES_API_KEY alias resolves and GROQ_API_KEY wins', () => {
  assert.equal(resolveSecret('groq-key', { HERMES_API_KEY: SENTINEL }).via, 'HERMES_API_KEY');
  assert.equal(resolveSecret('groq-key', { HERMES_API_KEY: 'aaaa', GROQ_API_KEY: SENTINEL }).via, 'GROQ_API_KEY');
  assert.equal(getJunaikeyTelemetry({ GROQ_API_KEY: SENTINEL }).status, 'ready');
});
t('blank values count as missing', () => {
  assert.equal(resolveSecret('groq-key', { GROQ_API_KEY: '   ' }).present, false);
});
t('telemetry and inspect never contain secret values', () => {
  const env = { GROQ_API_KEY: SENTINEL, HERMES_API_BASE: 'https://example.invalid/' + SENTINEL, HERMES_MODEL: 'm-' + SENTINEL };
  assert.ok(!JSON.stringify(getJunaikeyTelemetry(env)).includes(SENTINEL));
  assert.ok(!JSON.stringify(inspectSecrets(env)).includes(SENTINEL));
});
t('redactSecrets masks values', () => {
  const out = redactSecrets('token=' + SENTINEL, { GROQ_API_KEY: SENTINEL });
  assert.ok(!out.includes(SENTINEL));
  assert.ok(out.includes('[REDACTED:GROQ_API_KEY]'));
});
t('ci-secrets.mjs exits 0 with no secrets and warns', () => {
  const r = spawnSync(process.execPath, ['scripts/ci-secrets.mjs'], { env: { PATH: process.env.PATH }, encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('::warning::[junaikey] groq-key missing'));
});
t('ci-secrets.mjs never prints values and writes GITHUB_OUTPUT', () => {
  const out = join(mkdtempSync(join(tmpdir(), 'jk-')), 'out.txt');
  const r = spawnSync(process.execPath, ['scripts/ci-secrets.mjs'], {
    env: { PATH: process.env.PATH, GROQ_API_KEY: SENTINEL, GITHUB_OUTPUT: out }, encoding: 'utf8',
  });
  assert.equal(r.status, 0);
  assert.ok(!r.stdout.includes(SENTINEL) && !r.stderr.includes(SENTINEL));
  const o = rf(out, 'utf8');
  assert.ok(o.includes('groq_ready=true') && o.includes('junaikey_status=ready'));
  assert.ok(!o.includes(SENTINEL));
});
t('SDK facade and radar endpoint expose status only', () => {
  const sdk = readFileSync('sdks/omni-one/src/junaikey-gate.ts', 'utf8');
  for (const s of ['getJunaikeyTelemetry', 'inspectJunaikeySecrets', 'JUNAIKEY_SECRET_REGISTRY']) assert.ok(sdk.includes('export ') && sdk.includes(s));
  assert.ok(!/export function (resolve|get)\w*Secret\w*Value/.test(sdk));
  assert.ok(existsSync('app/api/omni-center/junaikey/route.ts'));
  assert.ok(readFileSync('app/api/omni-center/junaikey/route.ts', 'utf8').includes('getJunaikeyTelemetry'));
});
console.log('G18 junaikey secrets gate: ' + passed + ' passed');
