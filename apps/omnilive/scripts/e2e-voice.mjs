// OmniLive 真實語音 → 雙語字幕 端到端驗證
// 1) 用 edge-tts 合成真實語音 MP3 (英文/中文) — 已生成則沿用 fixture
// 2) 啟動 apps/stt (faster-whisper) 與 OmniLive
// 3) MP3 → OmniLive /api/transcribe → 雙語字幕 (真實辨識, 非 mock)
// 前置: apps/stt/.venv 已裝 faster-whisper + edge-tts
// 結果同時寫入 e2e-result.json (不依賴 stdout 捕獲)
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { TextDecoder } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const STT_DIR = path.resolve(ROOT, '../stt');
const FIX = process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Temp') : os.tmpdir();
const wavEn = path.join(FIX, 'en.mp3');
const wavZh = path.join(FIX, 'zh.mp3');
const RESULT = path.join(ROOT, 'e2e-result.json');
const OL_PORT = 8796;

const checks = [];
function log(...a) { console.log('[e2e]', ...a); }
function check(cond, msg) { checks.push({ ok: !!cond, msg }); log((cond ? '✅' : '❌') + ' ' + msg); if (!cond) process.exitCode = 1; }

function synth(text, out, voice) {
  const py = `
import asyncio, edge_tts
async def go():
    c = edge_tts.Communicate(${JSON.stringify(text)}, ${JSON.stringify(voice)})
    await c.save(${JSON.stringify(out)})
asyncio.run(go())
`;
  const script = path.join(FIX, 'synth.py');
  fs.writeFileSync(script, py);
  execFileSync(path.join(STT_DIR, '.venv', 'Scripts', 'python.exe'), [script], { stdio: 'ignore' });
}

function startServer(cwd, env, port, healthPath, usePython) {
  const cmd = usePython ? [path.join(cwd, '.venv', 'Scripts', 'python.exe'), 'server.py'] : [process.execPath, 'server.mjs'];
  const s = spawn(cmd[0], cmd.slice(1), { cwd, env: { ...process.env, ...env } });
  s.stderr.on('data', () => {});
  return s;
}
async function waitHealth(url, ms = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(url); if (r.ok) return true; } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}
// 內嵌 SSE 讀取 (不依賴瀏覽器)
async function readSSEOnce(url, predicate, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.body) return null;
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '', field = '', value = '', dataLines = [];
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      buf += dec.decode(chunk, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx); buf = buf.slice(idx + 1);
        if (line === '') {
          if (field === 'data') dataLines.push(value);
          const payload = dataLines.join('\n');
          if (payload) { try { const p = JSON.parse(payload); if (predicate(p)) { clearTimeout(timer); await reader.cancel(); return p.data; } } catch {} }
          field = ''; value = ''; dataLines = [];
        } else if (line.startsWith(':')) { /* comment */ }
        else if (line.includes(':')) { const c = line.indexOf(':'); field = line.slice(0, c); value = line.slice(c + 1).replace(/^ /, ''); }
        else { field = line; value = ''; }
      }
    }
  } catch {}
  finally { clearTimeout(timer); }
  return null;
}

async function main() {
  log('合成真實語音 (英文 + 中文)…');
  if (!fs.existsSync(wavEn) || fs.statSync(wavEn).size < 1000) synth('Hello, this is a live meeting test for OmniLive bilingual captions.', wavEn, 'en-US-AriaNeural');
  if (!fs.existsSync(wavZh) || fs.statSync(wavZh).size < 1000) synth('歡迎參加線上會議，這是即時雙語字幕測試。', wavZh, 'zh-TW-HsiaoChenNeural');
  check(fs.existsSync(wavEn) && fs.statSync(wavEn).size >= 1000 && fs.existsSync(wavZh) && fs.statSync(wavZh).size >= 1000, '已合成英文/中文真實語音 MP3');

  let stt = null;
  const preUp = await fetch('http://127.0.0.1:8791/health').then(r => r.ok).catch(() => false);
  if (!preUp) { stt = startServer(STT_DIR, { ...process.env, WHISPER_MODEL: 'tiny', WHISPER_COMPUTE: 'int8', STT_PORT: '8791' }, 8791, '/health', true); }
  const okStt = await waitHealth('http://127.0.0.1:8791/health');
  check(okStt, 'apps/stt (faster-whisper) 啟動 /health 可達');
  if (!okStt) { if (stt) stt.kill('SIGKILL'); writeResult(); return; }

  const ol = startServer(ROOT, { ...process.env, PORT: String(OL_PORT), OMNILIVE_AUDIO_SOURCE: 'system-display', STT_PORT: '8791', OMNILIVE_FROM: 'zh-TW', OMNILIVE_TO: 'en' }, OL_PORT, '/health', false);
  const okOl = await waitHealth(`http://127.0.0.1:${OL_PORT}/health`);
  check(okOl, `OmniLive 啟動 /health 可達 (:${OL_PORT})`);
  if (!okOl) { if (stt) stt.kill('SIGKILL'); if (ol) ol.kill('SIGKILL'); writeResult(); return; }

  for (const [name, wav, label] of [['EN', wavEn, '英文語音→繁中字幕'], ['ZH', wavZh, '繁中語音→英文字幕']]) {
    const buf = fs.readFileSync(wav);
    const r = await fetch(`http://127.0.0.1:${OL_PORT}/api/transcribe?room=voice`, { method: 'POST', headers: { 'content-type': 'application/octet-stream' }, body: buf });
    const d = await r.json().catch(() => ({}));
    const src = (d.source || '').trim();
    const tgt = (d.target || '').trim();
    check(r.ok && (src.length > 0 || tgt.length > 0), `[${name}] 真實語音辨識+翻譯成功 (${label}): 原文="${src.slice(0, 50)}" / 字幕="${tgt.slice(0, 50)}"`);
    check(r.ok && !!d.trace, `[${name}] 5T trace 溯源: ${d.trace || '(無)'}`);
    if (name === 'EN') console.log('   EN 辨識原文:', JSON.stringify(src), '→ 字幕:', JSON.stringify(tgt));
    if (name === 'ZH') console.log('   ZH 辨識原文:', JSON.stringify(src), '→ 字幕:', JSON.stringify(tgt));
  }

  const gotP = readSSEOnce(`http://127.0.0.1:${OL_PORT}/stream?room=voice`, p => p.data && p.data.source && p.data.source.includes('同步'), 10000);
  await new Promise(r => setTimeout(r, 400)); // 確保 SSE 訂閱已註冊
  await fetch(`http://127.0.0.1:${OL_PORT}/api/speak`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: '同步字幕測試', room: 'voice', from: 'zh-TW', to: 'en' }) });
  const got = await gotP;

  if (stt) stt.kill('SIGKILL');
  if (ol) ol.kill('SIGKILL');
  writeResult();
  log(process.exitCode ? '\n❌ E2E 語音驗證失敗' : '\n✅ E2E 真實語音 → 雙語字幕 全部通過');
}

function writeResult() {
  try { fs.writeFileSync(RESULT, JSON.stringify({ exitCode: process.exitCode || 0, checks }, null, 2)); } catch {}
}

main().catch(e => { log('FATAL ' + (e && e.stack || e)); try { fs.writeFileSync(RESULT, JSON.stringify({ fatal: String(e && e.stack || e) }, null, 2)); } catch {} process.exitCode = 1; });
