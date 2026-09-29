// Real integration test: spawns apps/gateway/omni-server.mjs and probes WS auth.
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// 以本檔位置推導路徑，不寫死 C:/ 絕對路徑 —— 否則在 Linux CI 上
// SERVER 會指向不存在的路徑而無法 spawn。
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.join(HERE, 'omni-server.mjs');
// createRequire 只接受絕對路徑或 file:// URL。import.meta.url 是
// 标准的 file:// URL，Windows 與 Linux 皆可。
const require = createRequire(import.meta.url);
const WebSocket = require('ws');

// 刻意使用無高熵、無憑證特徵的測試值：GitGuardian 會把
// 's3cr3t-…' 這類高熵字串判為 Generic High Entropy Secret。
// 這不是真憑證，但掃描器只看樣態不看語意，故選用明確的佔位字串。
const TOKEN = 'test-token-not-a-real-secret';
const PORT = Number(process.env.WS_AUTH_TEST_PORT || 8899);

function waitForLine(proc, re, ms = 20000) {
  return new Promise((resolve, reject) => {
    let buf = '';
    const t = setTimeout(() => reject(new Error('timeout waiting for ' + re)), ms);
    const onData = (d) => {
      buf += d.toString();
      if (re.test(buf)) { clearTimeout(t); proc.stdout.off('data', onData); resolve(buf); }
    };
    proc.stdout.on('data', onData);
  });
}

function startServer(env) {
  const proc = spawn('node', [SERVER], {
    cwd: HERE,
    env: { ...process.env, PORT: String(PORT), GATEWAY_API_KEY: 'dummy-test-key', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  proc.stderr.on('data', d => process.stdout.write('  [srv-err] ' + d.toString()));
  return proc;
}

async function stop(proc) {
  // 先走標準 SIGTERM（跨平台），Windows 上對 node 子行程也有效。
  // 舊實作直接 spawn taskkill，該指令不存在於 Linux/macOS，CI 上會留下
  // 孤兒行程佔用 8899 埠，導致後續執行 bind 失敗。
  const exited = new Promise((r) => proc.once('exit', r));
  try { proc.kill('SIGTERM'); } catch {}
  const exitedInTime = await Promise.race([exited.then(() => true), new Promise((r) => setTimeout(() => r(false), 3000))]);
  if (!exitedInTime) {
    // 有界退路：僅在 SIGTERM 沒收尾時才強制，且不依賴平台專屬指令。
    try { proc.kill('SIGKILL'); } catch {}
    await Promise.race([exited, new Promise((r) => setTimeout(r, 2000))]);
  }
}

// Raw handshake so we can see the exact HTTP status line.
function rawHandshake({ query = '', protocol = null, headers = {} }) {
  return new Promise((resolve) => {
    const sock = net.connect(PORT, '127.0.0.1', () => {
      const key = crypto.randomBytes(16).toString('base64');
      const lines = [
        `GET /${query} HTTP/1.1`,
        'Host: 127.0.0.1:' + PORT,
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Key: ${key}`,
        'Sec-WebSocket-Version: 13',
      ];
      if (protocol) lines.push(`Sec-WebSocket-Protocol: ${protocol}`);
      for (const [k, v] of Object.entries(headers)) lines.push(`${k}: ${v}`);
      sock.write(lines.join('\r\n') + '\r\n\r\n');
    });
    let data = '';
    let done = false;
    const finish = (statusLine, rest) => {
      if (done) return; done = true;
      sock.destroy();
      resolve({ statusLine, headers: rest.split('\r\n\r\n')[0], raw: data });
    };
    sock.on('data', d => { data += d.toString(); if (data.includes('\r\n\r\n')) finish(data.split('\r\n')[0], data); });
    sock.on('error', e => { if (!done) { done = true; resolve({ statusLine: 'SOCKET-ERROR ' + e.message, raw: data }); } });
    setTimeout(() => { if (!done) finish('TIMEOUT (no response)', data); }, 4000);
  });
}

function wsClientTry(url, protocols, opts = {}) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url, protocols || [], opts);
    let opened = false, firstMsg = null;
    const t = setTimeout(() => { if (!opened) { try { ws.terminate(); } catch {} resolve({ ok: false, reason: 'TIMEOUT' }); } }, 5000);
    ws.on('open', () => { opened = true; });
    ws.on('message', d => { if (firstMsg === null) { firstMsg = JSON.parse(d.toString()).type; clearTimeout(t); ws.close(); resolve({ ok: true, firstMsg }); } });
    ws.on('unexpected-response', (_req, res) => { clearTimeout(t); resolve({ ok: false, reason: 'HTTP ' + res.statusCode + ' ' + res.statusMessage }); });
    ws.on('error', e => { if (!opened && firstMsg === null && !opened) { /* fallthrough */ } });
    ws.on('close', (code) => { clearTimeout(t); if (!opened && firstMsg === null) resolve({ ok: false, reason: 'closed code=' + code }); });
  });
}

function getHealth() {
  return new Promise((resolve) => {
    http.get({ host: '127.0.0.1', port: PORT, path: '/health', headers: { 'x-api-key': 'dummy-test-key' } }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b }));
    }).on('error', e => resolve({ status: 0, body: e.message }));
  });
}

const results = [];
function record(name, pass, detail) { results.push({ name, pass, detail }); console.log(`  ${pass ? '✅' : '❌'} ${name} → ${detail}`); }

// ── Phase 1: WS_AUTH_TOKEN set ────────────────────────────────
console.log('\n═══ PHASE 1: WS_AUTH_TOKEN 已設定 ═══');
let srv = startServer({ WS_AUTH_TOKEN: TOKEN });
await waitForLine(srv, /OmniAgent Gateway v3.0/);
console.log('  server booted');

const raw1 = await rawHandshake({ query: '?token=' + TOKEN });
record('raw handshake 帶正確 token', raw1.statusLine.includes('101'), raw1.statusLine);

const raw2 = await rawHandshake({ query: '?token=WRONG' });
record('raw handshake 帶錯誤 token 被拒', raw2.statusLine.includes('401'), raw2.statusLine + ' | body=' + (raw2.raw.split('\r\n\r\n')[1] || '').trim());

const raw3 = await rawHandshake({ query: '' });
record('raw handshake 無 token 被拒', raw3.statusLine.includes('401'), raw3.statusLine);

const raw4 = await rawHandshake({ query: '', protocol: 'bearer, ' + TOKEN });
const echo4 = (raw4.headers.match(/Sec-WebSocket-Protocol: (.*)/i) || [])[1] || 'none';
record('raw handshake subprotocol "bearer, TOKEN" 通過且回正確 protocol',
  raw4.statusLine.includes('101') && echo4.trim() === TOKEN,
  raw4.statusLine + ' | echo=' + echo4.trim() + ' (expected ' + TOKEN + ')');

const raw5 = await rawHandshake({ query: '', protocol: 'auth.' + TOKEN });
record('raw handshake subprotocol auth.TOKEN 通過', raw5.statusLine.includes('101'), raw5.statusLine);

const raw6 = await rawHandshake({ query: '', protocol: 'bearer, NOPE' });
record('raw handshake subprotocol 錯 token 被拒', raw6.statusLine.includes('401'), raw6.statusLine);

const raw7 = await rawHandshake({ query: '?token=' + TOKEN + 'extra' });
record('raw handshake token+雜訊被拒（嚴格相等）', raw7.statusLine.includes('401'), raw7.statusLine);

// 多候選遮蔽：client 可能同時帶無關的 header 與有效的 subprotocol token。
// 舊實作在第一個 header 就 return，會讓有效的 subprotocol 永不被檢查而誤回 401。
const raw8 = await rawHandshake({
  query: '',
  protocol: 'bearer, ' + TOKEN,
  headers: { Authorization: 'Bearer injected-by-proxy-not-a-real-token' },
});
record('無關 Authorization 不遮蔽有效 subprotocol token', raw8.statusLine.includes('101'), raw8.statusLine);

const raw9 = await rawHandshake({
  query: '',
  protocol: 'bearer, NOPE',
  headers: { Authorization: 'Bearer injected-by-proxy-not-a-real-token' },
});
record('所有候選皆錯才拒絕', raw9.statusLine.includes('401'), raw9.statusLine);

const c1 = await wsClientTry(`ws://127.0.0.1:${PORT}/?token=${TOKEN}`);
record('ws 套件 帶正確 token', c1.ok, JSON.stringify(c1));

// 負向斷言必須要求「明確的 401」，不能只判斷 !ok。
// 舊寫法讓 TIMEOUT、500、連線錯誤都算通過，掩蓋真實故障。
const rejected401 = (r) => !r.ok && /401/.test(String(r.reason || ''));
const j = (r) => JSON.stringify(r);

const c2 = await wsClientTry(`ws://127.0.0.1:${PORT}/?token=bad`);
record('ws 套件 錯誤 token 被拒 (401)', rejected401(c2), j(c2));

const c3 = await wsClientTry(`ws://127.0.0.1:${PORT}/`);
record('ws 套件 無 token 被拒 (401)', rejected401(c3), j(c3));

const c4 = await wsClientTry(`ws://127.0.0.1:${PORT}/`, ['bearer', TOKEN]);
record('ws 套件 subprotocol [bearer,TOKEN] 認證', c4.ok, j(c4));

const c5 = await wsClientTry(`ws://127.0.0.1:${PORT}/`, ['bearer', 'NOPE']);
record('ws 套件 subprotocol 錯 token 被拒 (401)', rejected401(c5), j(c5));

const c6 = await wsClientTry(`ws://127.0.0.1:${PORT}/`, ['auth.' + TOKEN]);
record('ws 套件 subprotocol auth.TOKEN 認證', c6.ok, j(c6));

// header-based auth (Node clients, e.g. gateway-client.ts X-Omni-Token)
const rawH1 = await rawHandshake({ query: '', headers: { 'X-Omni-Token': TOKEN } });
record('header X-Omni-Token 認證（既有 client 相容）', rawH1.statusLine.includes('101'), rawH1.statusLine);

const rawH2 = await rawHandshake({ query: '', headers: { Authorization: 'Bearer ' + TOKEN } });
record('header Authorization: Bearer ***', rawH2.statusLine.includes('101'), rawH2.statusLine);

const rawH3 = await rawHandshake({ query: '', headers: { 'X-Omni-Token': 'nope' } });
record('header 錯誤 token 被拒', rawH3.statusLine.includes('401'), rawH3.statusLine);

const c7 = await wsClientTry(`ws://127.0.0.1:${PORT}/`, null, { headers: { 'X-Omni-Token': TOKEN } });
record('ws 套件 X-Omni-Token header 認證', c7.ok, j(c7));

const c8 = await wsClientTry(`ws://127.0.0.1:${PORT}/`, null, { headers: { 'X-Omni-Token': 'bad' } });
record('ws 套件 錯 header 被拒 (401)', rejected401(c8), j(c8));

// legitimate client stays connected, health reports it
const live = new WebSocket(`ws://127.0.0.1:${PORT}/?token=${TOKEN}`);
await new Promise(r => live.on('open', r));
await new Promise(r => setTimeout(r, 300));
const h = await getHealth();
record('已認證 client 有被計入 ws_clients', /"ws_clients":1/.test(h.body), 'GET /health → ' + h.status + ' ' + h.body);
live.close();
await stop(srv);

// ── Phase 2: WS_AUTH_TOKEN unset (backward compat) ────────────
console.log('\n═══ PHASE 2: WS_AUTH_TOKEN 未設定（向後相容）═══');
srv = startServer({ WS_AUTH_TOKEN: '' });
const srvLines = [];
srv.stdout.on('data', d => srvLines.push(d.toString()));
srv.stderr.on('data', d => srvLines.push(d.toString()));
const boot = await waitForLine(srv, /OmniAgent Gateway v3.0/);
await new Promise(r => setTimeout(r, 500));
const bootAll = srvLines.join('');
record('啟動時明確警告認證未啟用', /WS AUTH: ⚠️ 未啟用/.test(bootAll), (bootAll.match(/.*WS AUTH:.*/) || ['not found'])[0].trim());

const d1 = await rawHandshake({ query: '' });
record('舊客戶端（無 token）仍可連線', d1.statusLine.includes('101'), d1.statusLine);

const d2 = await wsClientTry(`ws://127.0.0.1:${PORT}/`);
record('ws 套件 無 token 舊行為不變', d2.ok, JSON.stringify(d2));

const d3 = await wsClientTry(`ws://127.0.0.1:${PORT}/?token=whatever`);
record('無 token 設定時帶 token 也能連（不排斥）', d3.ok, JSON.stringify(d3));
await stop(srv);

console.log('\n═══ SUMMARY ═══');
const failed = results.filter(r => !r.pass);
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) { failed.forEach(f => console.log('FAILED: ' + f.name + ' → ' + f.detail)); process.exit(1); }
console.log('ALL PASS');
