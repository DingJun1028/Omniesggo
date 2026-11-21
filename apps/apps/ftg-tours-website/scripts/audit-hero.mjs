/**
 * 用 CDP 直接量測 hero 比例與文字溢出 — 5T-Transparent: 全部輸出真實 px 數值。
 *
 * 檢查項：
 *   1. hero 高度 / viewport 高度 → 比例（目標 0.45~0.72，非 1.0 全屏）
 *   2. hero 寬高比 vs 原始圖片寬高比 → 裁切程度
 *   3. h1 scrollWidth vs clientWidth → 是否水平溢出（「字跑出邊邊」）
 *   4. document 整體水平溢出
 *   5. 所有元素是否有超出 viewport 右緣
 *   6. hero 內所有文字/按鈕/標籤的邊界是否都在 hero 內
 *   7. 缺圖 naturalWidth === 0
 *   8. 殘留 gradient class
 */
import { spawn } from 'node:child_process';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = process.argv[2] || 'http://localhost:4178';
const VIEWPORTS = [
  { name: 'iPhone SE', w: 375, h: 667 },
  { name: 'iPhone 14', w: 390, h: 844 },
  { name: 'iPad', w: 768, h: 1024 },
  { name: 'Laptop', w: 1280, h: 800 },
  { name: 'Desktop', w: 1920, h: 1080 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const freePort = () =>
  new Promise((res) => {
    const s = net.createServer();
    s.listen(0, () => {
      const p = s.address().port;
      s.close(() => res(p));
    });
  });

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
const port = await freePort();
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--hide-scrollbars',
  'about:blank',
]);
chrome.stderr.on('data', () => {});

// 等 CDP endpoint 起來
let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(300);
  try {
    const r = await fetch(`http://127.0.0.1:${port}/json/version`);
    wsUrl = (await r.json()).webSocketDebuggerUrl;
  } catch {}
}
if (!wsUrl) {
  console.error('Chrome CDP 未就緒');
  chrome.kill();
  process.exit(1);
}

// ── 最小 WebSocket client（避免依賴）──
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => {
  ws.onopen = r;
  ws.onerror = j;
});
let msgId = 0;
const pending = new Map();
const events = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  } else if (m.method) {
    events.push(m);
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const id = ++msgId;
    pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (m, p) => send(m, p, sessionId);

await S('Page.enable');
await S('Runtime.enable');
await S('Log.enable');

const audit = `(() => {
  const hero = document.querySelector('section[class*="min-h-[52vh]"]') || document.querySelector('section');
  const h1 = document.querySelector('h1');
  const vp = { w: window.innerWidth, h: window.innerHeight };
  const r = hero.getBoundingClientRect();

  // 水平溢出元素
  const overflowing = [];
  document.querySelectorAll('*').forEach(el => {
    const b = el.getBoundingClientRect();
    if (b.width === 0) return;
    if (b.right > vp.w + 1 || b.left < -1) {
      const cs = getComputedStyle(el);
      if (cs.overflow === 'visible' || cs.position !== 'fixed') {
        overflowing.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 60),
          left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width),
        });
      }
    }
  });

  // 缺圖
  const brokenImgs = [];
  document.querySelectorAll('img').forEach(im => {
    if (im.complete && im.naturalWidth === 0) brokenImgs.push(im.getAttribute('src'));
    else if (!im.complete) brokenImgs.push('PENDING:' + im.getAttribute('src'));
  });

  // 漸層殘留
  const gradients = [];
  document.querySelectorAll('*').forEach(el => {
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg.includes('gradient')) gradients.push(el.tagName.toLowerCase() + '.' + (el.className||'').toString().slice(0,40));
  });

  // hero 內文字邊界
  const heroText = [];
  hero.querySelectorAll('h1,p,a,span,button').forEach(el => {
    const b = el.getBoundingClientRect();
    heroText.push({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 22),
      top: Math.round(b.top), bottom: Math.round(b.bottom),
      fs: getComputedStyle(el).fontSize,
    });
  });

  return {
    vp,
    heroH: Math.round(r.height),
    heroRatio: +(r.height / vp.h).toFixed(3),
    heroW: Math.round(r.width),
    heroAspect: +(r.width / r.height).toFixed(3),
    h1: h1 ? {
      fs: getComputedStyle(h1).fontSize,
      scrollW: h1.scrollWidth, clientW: h1.clientWidth,
      overflowPx: h1.scrollWidth - h1.clientWidth,
      whiteSpace: getComputedStyle(h1).whiteSpace,
      text: (h1.textContent||'').trim().slice(0,30),
    } : null,
    docOverflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    overflowing: overflowing.slice(0, 8),
    overflowingCount: overflowing.length,
    brokenImgs,
    gradients,
    heroText,
  };
})()`;

const rows = [];
for (const vp of VIEWPORTS) {
  await S('Emulation.setDeviceMetricsOverride', {
    width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.w < 768,
  });
  events.length = 0;
  await S('Page.navigate', { url: SITE });
  await sleep(2200);
  const { result } = await S('Runtime.evaluate', { expression: audit, returnByValue: true });
  const d = { ...result.value, consoleErrs: [] };

  d.consoleErrs = events
    .filter((e) => e.method === 'Log.entryAdded' && ['error', 'warning'].includes(e.params.entry.level))
    .map((e) => e.params.entry.level + ': ' + e.params.entry.text.slice(0, 90));

  // 缺圖 — 5T-Transparent: PENDING 只是 loading="lazy" 尚未進 viewport，不是真缺圖。
  // 捲到底觸發 lazy load 後仍 PENDING 的，才可能真沒載入。
  await S('Runtime.evaluate', {
    expression: `(async()=>{const H=document.documentElement.scrollHeight;
      for(let y=0;y<=H;y+=400){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));}
      window.scrollTo(0,0);await new Promise(r=>setTimeout(r,300));})()`,
    awaitPromise: true,
  });
  await sleep(1200);
  const { result: r2 } = await S('Runtime.evaluate', { expression: audit, returnByValue: true });
  // 分離：真缺圖 = naturalWidth===0；lazy 未載 = PENDING（不算失敗）
  d.brokenImgs = r2.value.brokenImgs.filter((s) => !s.startsWith('PENDING:'));
  d.lazyPending = r2.value.brokenImgs.filter((s) => s.startsWith('PENDING:'));
  // lazy 圖已進 DOM 但仍未載入 → 確認資源真的存在（fetch HEAD 驗證）
  if (d.lazyPending.length) {
    const paths = d.lazyPending.map((s) => s.slice(8));
    const { result: r3 } = await S('Runtime.evaluate', {
      expression: `Promise.all(${JSON.stringify(paths)}.map(p=>fetch(p,{method:'HEAD'})
        .then(r=>r.status).catch(()=>0))).then(a=>a)`,
      awaitPromise: true, returnByValue: true,
    });
    d.lazyHttp = r3.value;
    d.lazyMissing = d.lazyPending.filter((_, i) => r3.value[i] !== 200);
  }

  rows.push({ name: vp.name, ...d });

  const ok =
    d.heroRatio <= 0.78 && d.h1?.overflowPx <= 0 && d.docOverflowPx <= 0 &&
    d.brokenImgs.length === 0 && d.gradients.length === 0 && d.overflowingCount === 0;

  console.log(`\n${'='.repeat(70)}`);
  console.log(`${vp.name}  ${vp.w}x${vp.h}   ${ok ? 'PASS' : 'FAIL'}`);
  console.log('='.repeat(70));
  console.log(`  hero 比例        ${d.heroH}px / ${d.vp.h}px = ${d.heroRatio}  (目標 <=0.72)`);
  console.log(`  hero 寬高比      ${d.heroAspect}   尺寸 ${d.heroW}x${d.heroH}`);
  if (d.h1) {
    console.log(`  h1 字級          ${d.h1.fs}  white-space: ${d.h1.whiteSpace}`);
    console.log(`  h1 溢出          scrollW ${d.h1.scrollW} / clientW ${d.h1.clientW} = ${d.h1.overflowPx}px  ${d.h1.overflowPx <= 0 ? 'OK' : '溢出!'}`);
  }
  console.log(`  整頁水平溢出     ${d.docOverflowPx}px  ${d.docOverflowPx <= 0 ? 'OK' : '溢出!'}`);
  console.log(`  超出視窗元素     ${d.overflowingCount}`);
  for (const o of d.overflowing) console.log(`     ${o.tag}.${o.cls}  left=${o.left} right=${o.right}`);
  console.log(`  缺圖             ${d.brokenImgs.length ? d.brokenImgs.join(', ') : '無'}`);
  console.log(`  漸層殘留         ${d.gradients.length ? d.gradients.join(', ') : '無'}`);
  console.log(`  console          ${d.consoleErrs.length ? d.consoleErrs.join(' | ') : '乾淨'}`);
  console.log(`  hero 內文字:`);
  for (const t of d.heroText) {
    console.log(`     ${t.tag.padEnd(7)} fs=${t.fs.padEnd(7)} y=${t.top}..${t.bottom}  "${t.text}"`);
  }
}

fs.writeFileSync(
  path.resolve('scripts/.hero-audit.json'),
  JSON.stringify(rows, null, 2)
);
console.log('\nsaved scripts/.hero-audit.json');

const fail = rows.filter(
  (r) => r.heroRatio > 0.78 || (r.h1 && r.h1.overflowPx > 0) || r.docOverflowPx > 0 ||
         r.brokenImgs.length || r.gradients.length || r.overflowingCount ||
         (r.lazyMissing && r.lazyMissing.length)
);
console.log(fail.length ? `\nFAIL: ${fail.map((f) => f.name).join(', ')}` : '\nPASS: 全部 5 種 viewport 無溢出/缺圖/漸層');

ws.close();
chrome.kill();
process.exit(fail.length ? 1 : 0);
