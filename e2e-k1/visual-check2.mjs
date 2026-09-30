// 視覺驗證第二輪：精準點 ESG 分頁、開碳足跡 modal、比對 /impact 數值。
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2] || 'C:/Users/dingj/AppData/Local/hermes/cache/scratch/visual/out';
mkdirSync(OUT, { recursive: true });
const APP = 'http://127.0.0.1:5173';
const JID = 'visualjourney01';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const TOKEN = `${b64({ alg: 'HS256' })}.${b64({ email: 'visual@e2e.local', name: '視覺驗證員', exp: 4102444800 })}.visualsig`;

const R = [];
const log = (s) => { R.push(String(s)); console.log(s); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'zh-TW' });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + String(e).slice(0, 160)));
await page.addInitScript((t) => { localStorage.setItem('ftg_token', t); }, TOKEN);

await page.goto(`${APP}/journey/${JID}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

// ── 精準點 ESG 分頁（用完整 label，避免誤中標題「ESG 影響力實測旅程」）──
await page.locator('button', { hasText: '🌱 ESG' }).first().click();
await page.waitForTimeout(1200);
const activeTab = await page.locator('button.btn-primary').first().innerText().catch(() => '?');
log('點擊後 active tab = ' + JSON.stringify(activeTab));

// ESG 任務卡清單
const cards = await page.$$eval('.card-hoverable', (els) =>
  els.map((e) => e.innerText.split('\n').filter(Boolean).join(' | '))
);
log('\n=== ESG 任務卡 (' + cards.length + ' 張) ===');
cards.forEach((c, i) => log(`  [${i}] ${c}`));

// 頂部 ESG 任務影響力三格
const top3 = await page.$$eval('.grid.grid-cols-3 > div', (els) =>
  els.map((e) => e.innerText.split('\n').filter(Boolean).join(' / '))
).catch(() => []);
log('\n=== ESG 影響力三格 ===');
top3.forEach((t, i) => log(`  [${i}] ${t}`));
await page.screenshot({ path: path.join(OUT, 'r2-esg-tab.png') });

// ── 開「碳足跡記錄」modal（缺陷 A：fields 後端從未回傳）──
const carbonCard = page.locator('.card-hoverable', { hasText: '碳足跡記錄' }).first();
if (await carbonCard.count()) {
  await carbonCard.click();
  await page.waitForTimeout(900);
  const overlay = await page.locator('div.fixed.inset-0').count();
  log(`\n=== 碳足跡記錄 modal ===\n  overlay 出現 = ${overlay > 0}`);
  const modalFields = await page.$$eval('div.fixed.inset-0 label', (els) => els.map((e) => e.textContent.trim())).catch(() => []);
  log('  modal label = ' + JSON.stringify(modalFields));
  const modalOpts = await page.$$eval('div.fixed.inset-0 select option', (els) => els.map((e) => e.textContent)).catch(() => []);
  log('  select 選項 = ' + JSON.stringify(modalOpts));
  const box = await page.$eval('div.fixed.inset-0 > div', (el) => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), right: Math.round(r.right), scrollH: el.scrollHeight, clientH: el.clientHeight };
  }).catch(() => null);
  log('  modal box = ' + JSON.stringify(box));
  if (box) log(`  橫向溢出 = ${box.left < 0 || box.right > 1440}; 縱向捲動 = ${box.scrollH > box.clientH}`);
  await page.screenshot({ path: path.join(OUT, 'r2-carbon-modal.png') });
} else {
  log('\n=== 碳足跡記錄 modal === !! 找不到卡片');
}

// ── Impact Note：抓 label + value + unit 三元組，並與 API 對帳 ──
await page.goto(`${APP}/journey/${JID}/impact-note`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const tiles = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('.grid > div').forEach((d) => {
    const t = d.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
    if (t.length >= 2 && /\d/.test(t[0])) out.push({ value: t[0], label: t[t.length - 1] });
  });
  return out;
});
log('\n=== Impact Note 指標卡 (label=value unit) ===');
tiles.forEach((t) => log(`  ${t.label} = ${t.value}`));

const summary = await page.evaluate(() =>
  [...document.querySelectorAll('div')]
    .map((d) => d.innerText)
    .filter((s) => /kg 減碳|人次參與|志工時數/.test(s) && s.length < 40)
);
log('\n=== 彙總列 ===');
[...new Set(summary)].forEach((s) => log('  ' + s.replace(/\n/g, ' ')));

const api = await page.evaluate(async (t) => {
  const r = await fetch('http://127.0.0.1:8790/api/journeys/visualjourney01/impact', { headers: { Authorization: 'Bearer ' + t } });
  return r.json();
}, TOKEN);
log('\n=== /impact API 原始回傳（對帳基準）===');
log(JSON.stringify(api, null, 1));

await page.screenshot({ path: path.join(OUT, 'r2-impact-note.png') });
log('\nconsole 錯誤 = ' + JSON.stringify(errs));
writeFileSync(path.join(OUT, 'report2.txt'), R.join('\n'), 'utf8');
await browser.close();
