#!/usr/bin/env tsx
// verify.ts -- 5T Verification: T1-T8 + fileSha256 (T8)
// v0.3.1 -- 收縮到雙語、加入 T8
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const LOCALES = ['en', 'zh-TW'] as const;

interface CheckResult {
  name: string;
  pass: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function check(name: string, pass: boolean, detail = ''): void {
  results.push({ name, pass, detail });
  console.log(`  ${pass ? '✓' : '✗'} ${name} ${detail}`);
}

// T1: i18n/ 有 2 個 locale 檔
for (const locale of LOCALES) {
  const file = join('src/i18n', `${locale}.json`);
  check(`T1 i18n/${locale}.json exists`, existsSync(file));
}

// T2: 每個 bundle 有 locale + version + dict
for (const locale of LOCALES) {
  const file = join('src/i18n', `${locale}.json`);
  if (!existsSync(file)) continue;
  const bundle = JSON.parse(readFileSync(file, 'utf-8'));
  check(`T2 ${locale} has locale/version/dict`,
    bundle.locale === locale && typeof bundle.version === 'string' && typeof bundle.dict === 'object'
  );
}

// T3: 每個 dict 有所有 8 個 keys
const KEYS = ['app.title', 'app.subtitle', 'app.welcome', 'nav.home', 'nav.about', 'nav.contact', 'btn.submit', 'btn.cancel'];
for (const locale of LOCALES) {
  const file = join('src/i18n', `${locale}.json`);
  if (!existsSync(file)) continue;
  const bundle = JSON.parse(readFileSync(file, 'utf-8'));
  const missing = KEYS.filter(k => !(k in bundle.dict));
  check(`T3 ${locale} has all 8 keys`, missing.length === 0, missing.length ? `missing=${missing.join(',')}` : '');
}

// T4: 雙語 dict keys 完全一致 (無孤立 key)
const bundles = LOCALES.map(l => JSON.parse(readFileSync(join('src/i18n', `${l}.json`), 'utf-8')));
const keysA = new Set(Object.keys(bundles[0].dict).sort());
const keysB = new Set(Object.keys(bundles[1].dict).sort());
const same = keysA.size === keysB.size && [...keysA].every(k => keysB.has(k));
check('T4 zh-TW/en keys identical', same);

// T5: 雙語 locale 欄位正確 (按 LOCALES 順序檢查, 不假設固定 index)
for (let i = 0; i < LOCALES.length; i++) {
  const expected = LOCALES[i];
  check(`T5 ${expected} locale = ${expected}`, bundles[i].locale === expected);
}

// T6: 沒有 legacy locales (ja, zh-CN, fr, ...)
const legacyCheck = LOCALES.every((_, i) => {
  const loc = bundles[i].locale;
  return loc === 'en' || loc === 'zh-TW';
});
check('T6 no legacy locales', legacyCheck);

// T7: canon.d.ts LOCALES 鎖定為 ['en', 'zh-TW']
const canonDts = readFileSync('src/canon.d.ts', 'utf-8');
const canonMatch = canonDts.match(/LOCALES.*?=.*?\[(.*?)\]/s);
const canonLocales = canonMatch ? canonMatch[1].replace(/['"\s]/g, '').split(',') : [];
const canonOk = canonLocales.length === 2 && canonLocales.includes('en') && canonLocales.includes('zh-TW');
check('T7 canon.d.ts LOCALES locked', canonOk, `parsed=[${canonLocales.join(',')}]`);

// T8: per-file sha256 in 5T-PROOF.json
const proofPath = 'dist/5T-PROOF.json';
let proofOk = false;
let proofDetail = '';
if (existsSync(proofPath)) {
  const proof = JSON.parse(readFileSync(proofPath, 'utf-8'));
  const fileSha256 = proof.fileSha256 || {};
  const keys = Object.keys(fileSha256);
  const onlyTwo = keys.length === 2 && keys.includes('en') && keys.includes('zh-TW');

  // 獨立算 per-file sha256 對照
  const independent: Record<string, string> = {};
  for (const loc of LOCALES) {
    const fp = join('src/i18n', `${loc}.json`);
    independent[loc] = createHash('sha256').update(readFileSync(fp)).digest('hex');
  }
  const matchSha = keys.every(k => fileSha256[k] === independent[k]);

  proofOk = onlyTwo && matchSha;
  proofDetail = `keys=[${keys.join(',')}] matchSha=${matchSha}`;
}
check('T8 5T-PROOF.json per-file sha256', proofOk, proofDetail);

// 輸出 5T-PROOF.json
function writeProof() {
  const fileSha256: Record<string, string> = {};
  for (const loc of LOCALES) {
    const fp = join('src/i18n', `${loc}.json`);
    fileSha256[loc] = createHash('sha256').update(readFileSync(fp)).digest('hex');
  }
  const canonSha = createHash('sha256').update(readFileSync('src/canon.d.ts')).digest('hex');
  const proof = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    locales: LOCALES,
    fileSha256,
    canonSha256: canonSha,
    checks: results,
    passed: results.every(r => r.pass),
  };
  if (!existsSync('dist')) mkdirSync('dist');
  writeFileSync('dist/5T-PROOF.json', JSON.stringify(proof, null, 2) + '\n');
}

writeProof();

// 總結
const passCount = results.filter(r => r.pass).length;
console.log(`\n${passCount}/${results.length} passed`);
if (passCount === results.length) {
  console.log('5T VERIFY OK');
  process.exit(0);
} else {
  console.log('5T VERIFY FAIL');
  process.exit(1);
}
