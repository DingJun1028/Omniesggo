
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = 8799;
process.env.BASE = process.env.BASE || `http://127.0.0.1:${PORT}`;

const server = spawn('node', ['monitor-server.mjs'], {
  cwd: __dirname,
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore'
});

setTimeout(async () => {
  try {
    await runTests();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    server.kill();
  }
}, 2000);

async function runTests() {
// 端對端煙霧測試：SSE 訂閱 → /speak → 收 translation → 回放驗證
const BASE = process.env.BASE || 'http://localhost:8799';
const TOKEN = process.env.INGEST_TOKEN || '';
// 寫入端點統一帶認證（未設 token 時為無害的普通 header 集）
const WHEAD = { 'Content-Type': 'application/json', ...(TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}) };
const speak = (body) => fetch(BASE + '/speak', { method: 'POST', headers: WHEAD, body: JSON.stringify(body) });
const log = (...a) => console.log(...a);
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, log('  PASS', m)) : (fail++, log('  FAIL', m)); };

async function readSSE(url, ms) {
  const ctrl = new AbortController();
  const events = [];
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    const rd = r.body.getReader(); const dec = new TextDecoder(); let buf = '';
    while (true) {
      const { value, done } = await rd.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
        const ev = /event: (.+)/.exec(chunk)?.[1];
        const data = /data: ([\s\S]+)/.exec(chunk)?.[1];
        if (ev && data) { try { events.push({ ev, data: JSON.parse(data) }); } catch {} }
      }
    }
  } catch {} finally { clearTimeout(t); }
  return events;
}

log('\n=== 萬能藍圖中心 端對端煙霧測試 ===');

log('\n[1] /healthz');
const h = await (await fetch(BASE + '/healthz')).json();
ok(h.ok === true, 'healthz ok');
ok(Array.isArray(h.langTargets) && h.langTargets.length > 0, 'langTargets: ' + h.langTargets);

log('\n[2] SSE 訂閱 studio + POST /speak');
const p = readSSE(BASE + '/stream?src=studio', 9000);
await new Promise(r => setTimeout(r, 800));
const t0 = Date.now();
const sp = await (await speak({ text: 'Sustainability report verified under ISO 14064-1.', from: 'en', speaker: 'lecturer-a' })).json();
const dt = Date.now() - t0;
ok(sp.ok === true, '/speak ok');
ok(sp.translations && Object.keys(sp.translations).length === h.langTargets.length, '多語翻譯數=' + Object.keys(sp.translations || {}).length);
ok(!!sp.engines, 'engines 標記(5T 可溯源): ' + JSON.stringify(sp.engines));
log('  翻譯延遲(平行): ' + dt + 'ms');
log('  ' + JSON.stringify(sp.translations));

const evs = await p;
const tr = evs.filter(e => e.ev === 'translation');
ok(tr.length >= 1, 'SSE 收到 translation 事件 x' + tr.length);
ok(tr[0]?.data?.hash?.length === 64, 'hash sha256 (Trustworthy)');
ok(!!tr[0]?.data?.sourceOrigin, 'sourceOrigin (Traceable): ' + tr[0]?.data?.sourceOrigin);
ok(!!tr[0]?.data?.timestamp, 'timestamp (Trackable)');

log('\n[3] 快取命中（相同文本再送一次應更快）');
const t1 = Date.now();
await speak({ text: 'Sustainability report verified under ISO 14064-1.', from: 'en', speaker: 'lecturer-a' });
const dt2 = Date.now() - t1;
log('  第二次延遲: ' + dt2 + 'ms (第一次 ' + dt + 'ms)');
ok(dt2 < dt || dt2 < 100, '快取加速生效');

log('\n[4] 回放緩衝：新訂閱者立即收到近期事件');
const late = await readSSE(BASE + '/stream?src=studio', 3000);
ok(late.filter(e => e.ev === 'translation').length >= 1, '晚進訂閱者收到回放 translation x' + late.filter(e => e.ev === 'translation').length);

log('\n[5] 靜態白名單 + 穿越防護');
for (const p of ['/package.json', '/monitor-server.mjs', '/live.esggo.co.conf', '/%2e%2e/package.json']) {
  const r = await fetch(BASE + p);
  ok(r.status === 404 || r.status === 403, `${p} 被擋 status=${r.status}`);
}
ok((await fetch(BASE + '/stream.html')).status === 200, '/stream.html 正常可取');

log('\n[6] 未知 src');
ok((await fetch(BASE + '/stream?src=nope')).status === 404, '未知 src 回 404');

log('\n[7] 系統建制欄位 (healthz 擴充)');
ok(h.version === '0.6.0', 'version=' + h.version);
ok(typeof h.memoryMB === 'number', 'memoryMB=' + h.memoryMB);
ok(typeof h.envFileLoaded === 'boolean', 'envFileLoaded=' + h.envFileLoaded);
ok(!!h.translateEngine, 'translateEngine=' + h.translateEngine);
ok(typeof h.uptimeSec === 'number', 'uptimeSec=' + h.uptimeSec);

log('\n[8] 認證 (僅在 authRequired=true 時檢查)');
if (h.authRequired) {
  const TK = process.env.INGEST_TOKEN;
  const noTok = await fetch(BASE + '/speak', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"text":"x","from":"en"}' });
  ok(noTok.status === 401, '無 token 回 401 (實得 ' + noTok.status + ')');
  const badTok = await fetch(BASE + '/speak?token=__wrong__', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"text":"x","from":"en"}' });
  ok(badTok.status === 401, '錯 token 回 401 (實得 ' + badTok.status + ')');
  if (TK) {
    const good = await fetch(BASE + '/speak', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TK }, body: '{"text":"ok","from":"en"}' });
    ok(good.status === 200, 'Bearer 正確 token 回 200 (實得 ' + good.status + ')');
  } else {
    log('  SKIP 正確 token 案例：未提供 env INGEST_TOKEN');
  }
} else {
  log('  SKIP 認證未啟用 (authRequired=false)');
}

log(`\n=== 結果: ${pass} PASS / ${fail} FAIL ===`);
process.exit(fail ? 1 : 0);

}
