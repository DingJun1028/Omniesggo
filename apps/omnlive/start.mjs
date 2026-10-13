// OmniLive 一鍵啟動器: 若啟用且 apps/stt 未跑, 先帶起本地 faster-whisper 微服務, 再啟動 OmniLive。
// 目的: `npm start` 單指令完成 Zoom 場景四流程串接 (輸入→辨識→翻譯→字幕), 免手動分開啟 STT。
// 5T: 失敗明確回報 (STT 起不來不阻塞 OmniLive 啟動, caption 模式仍可用)。
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { loadConfig } from './lib/config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const STT_DIR = path.resolve(ROOT, '../stt');
const OL_PORT = Number(process.env.PORT || 8795);
const STT_PORT = Number(process.env.STT_PORT || 8791);

function log(...a) { console.log('[omnilive:start]', ...a); }
async function ping(port) {
  try { const r = await fetch(`http://127.0.0.1:${port}/health`); return r.ok; } catch { return false; }
}
function startStt(model) {
  const venvPy = path.join(STT_DIR, '.venv', 'Scripts', 'python.exe');
  const fallbackPy = path.join(STT_DIR, '.venv', 'bin', 'python');
  const py = fs.existsSync(venvPy) ? venvPy : fallbackPy;
  const env = {
    ...process.env,
    WHISPER_MODEL: model || process.env.WHISPER_MODEL || 'tiny',
    WHISPER_COMPUTE: process.env.WHISPER_COMPUTE || 'int8',
    WHISPER_DEVICE: process.env.WHISPER_DEVICE || 'cpu',
    STT_PORT: String(STT_PORT),
  };
  const child = spawn(py, ['server.py'], { cwd: STT_DIR, env, stdio: 'inherit' });
  child.on('exit', (code) => log(`STT 子程序結束 (code=${code})`));
  return child;
}

let sttChild = null;
async function main() {
  let cfg;
  try { cfg = loadConfig(); } catch (/** @type {any} */ e) { console.error('[omnilive] 設定失敗:', e.message); process.exit(1); }

  // 若啟用自帶 STT 且目前 8791 沒服務 → 啟動
  if (cfg.autoStartStt) {
    const up = await ping(STT_PORT);
    if (up) log(`STT (:${STT_PORT}) 已在運作, 復用`);
    else {
      const hasVenv = [path.join(STT_DIR, '.venv', 'Scripts', 'python.exe'), path.join(STT_DIR, '.venv', 'bin', 'python')].some(p => fs.existsSync(p));
      if (hasVenv) {
        log(`啟動本地 STT (faster-whisper, ${cfg.sttModel}) …`);
        sttChild = startStt(cfg.sttModel);
        // 等 STT 健康 (最多 90s, 首跑需下載模型)
        let ok = false;
        for (let i = 0; i < 90; i++) { if (await ping(STT_PORT)) { ok = true; break; } await new Promise(r => setTimeout(r, 1000)); }
        log(ok ? `STT 就緒 (:${STT_PORT})` : `⚠️ STT 未在 90s 內就緒 — OmniLive 仍以 caption 模式啟動 (手動字幕可用)`);
      } else {
        log('⚠️ 未偵測 apps/stt/.venv, 跳過自帶 STT (僅 caption 模式可用)。先 `cd apps/stt && python -m venv .venv && pip install -r requirements.txt`');
      }
    }
  }

  // 啟動 OmniLive 主程序 (以子程序方式, 繼承本行程結束時一併退出)
  const ol = spawn(process.execPath, ['server.mjs'], { cwd: ROOT, env: process.env, stdio: 'inherit' });
  ol.on('exit', (code) => { if (sttChild) try { sttChild.kill('SIGKILL'); } catch {} process.exit(code || 0); });
  const shutdown = () => { try { sttChild && sttChild.kill('SIGKILL'); } catch {} try { ol.kill('SIGKILL'); } catch {} process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
