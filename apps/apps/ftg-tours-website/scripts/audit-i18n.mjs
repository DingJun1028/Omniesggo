/**
 * i18n 完整性稽核 — 真實載入模組並走訪物件。
 *
 * 驗證三件事：
 *  1. 每個 t('key') 在 zh 與 en 都能解析出非空字串（不漏字）
 *  2. 解析結果不會是 key 字串本身（LanguageContext 的缺鍵行為）
 *  3. zh / en 兩邊的 leaf key 集合對稱（不漏翻譯）
 */
import fs from 'fs';
import path from 'path';
import { translations } from '../src/i18n/translations.js';

const WEB = path.resolve('.');
const SRC = path.join(WEB, 'src');

// ---- 1. 收集所有 t('...') 呼叫 ----
const used = new Set();
const callSites = {};
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); continue; }
    if (!/\.(js|jsx)$/.test(e.name)) continue;
    const src = fs.readFileSync(p, 'utf8');
    for (const m of src.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) {
      used.add(m[1]);
      const rel = path.relative(WEB, p).replace(/\\/g, '/');
      (callSites[m[1]] ??= []).push(rel);
    }
  }
}
walk(SRC);

// ---- 2. 走訪 leaf key ----
function leaves(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') leaves(v, key, out);
    else out.add(key);
  }
  return out;
}
const zhLeaves = leaves(translations.zh);
const enLeaves = leaves(translations.en);

const resolve = (obj, dotted) =>
  dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

console.log(`t() 呼叫點總數: ${used.size}`);
console.log(`zh leaf keys: ${zhLeaves.size}   en leaf keys: ${enLeaves.size}\n`);

let bad = 0;
const rows = [];
for (const key of [...used].sort()) {
  const zh = resolve(translations.zh, key);
  const en = resolve(translations.en, key);
  const zhBad = typeof zh !== 'string' || !zh.trim() || zh === key;
  const enBad = typeof en !== 'string' || !en.trim() || en === key;
  if (zhBad || enBad) {
    bad++;
    rows.push({ key, zh, en, zhBad, enBad, at: callSites[key] });
  }
}

if (rows.length === 0) {
  console.log('PASS — 所有 t() key 在 zh/en 皆解析出非空字串，無漏字。');
} else {
  console.log(`FAIL — ${bad} 個 key 有問題：\n`);
  for (const r of rows) {
    console.log(`  ${r.key}`);
    console.log(`     zh: ${r.zhBad ? '✗ 缺失/空字串' : 'ok'}  ${JSON.stringify(r.zh)}`);
    console.log(`     en: ${r.enBad ? '✗ 缺失/空字串' : 'ok'}  ${JSON.stringify(r.en)}`);
    console.log(`     用於: ${[...new Set(r.at)].join(', ')}`);
  }
}

// ---- 3. 對稱性 ----
const onlyZh = [...zhLeaves].filter((k) => !enLeaves.has(k));
const onlyEn = [...enLeaves].filter((k) => !zhLeaves.has(k));
console.log(`\n只在 zh: ${onlyZh.length ? onlyZh.join(', ') : '(無)'}`);
console.log(`只在 en: ${onlyEn.length ? onlyEn.join(', ') : '(無)'}`);

// ---- 4. 句點複驗 ----
const periodHits = [];
for (const lang of ['zh', 'en']) {
  const hit = (obj, p = '') => {
    for (const [k, v] of Object.entries(obj ?? {})) {
      const key = p ? `${p}.${k}` : k;
      if (v && typeof v === 'object') hit(v, key);
      else if (typeof v === 'string' && v.includes('。')) periodHits.push(`${lang}.${key}`);
    }
  };
  hit(translations[lang]);
}
console.log(`\ntranslations 內含「。」: ${periodHits.length ? periodHits.join(', ') : '(無)'}`);

fs.writeFileSync(
  path.join(WEB, 'scripts', '.i18n-audit.json'),
  JSON.stringify({ used: [...used].sort(), bad, onlyZh, onlyEn, periodHits }, null, 2)
);
console.log('\nsaved: scripts/.i18n-audit.json');
process.exit(bad ? 1 : 0);
