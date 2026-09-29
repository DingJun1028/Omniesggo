// 5T 守門驗證 — loadDotEnv（ftg-journey-server 內建 .env 載入）
//
// 為何需要這份測試（2026-09-28）:
//   生產事故：VPS /var/www/ftg-journey-server/.env 存在且內容正確，
//   但 server.js 沒有載入 .env 的機制，pm2 也不會讀。
//   → process.env.JWT_SECRET 永遠 undefined → 啟動守門 exit(1)
//   → 8787 無監聽 → https://journey-api.ftgtours.esggo.co 回 502
//   而 pm2 status 顯示 online（process 尚未退出，持續重啟 7 次）。
//   這是「部署看起來成功、實際完全沒服務」的失效型態。
//
//   本測試鎖住三條契約：
//   1. loadDotEnv 必須存在於 server.js 且在啟動守門之前被呼叫（否則修了等於沒修）
//   2. 語意正確：跳過註解/空行/註解鍵、不覆蓋已存在的環境變數（12-factor 優先序）
//   3. 引號與邊界：值含 = 、含空白、含 # 時仍能正確解析
//
// 隔離說明: 與 jwt-gate.test.js 相同 — apps/ftg-journey-server/node_modules
//   在本 repo 不完整，無法真正啟動 server.js。故以「同一組規則」獨立重現
//   loadDotEnv 語意，並用 loadDotEnvCallSite() 讀取 server.js 原始碼守住
//   「守門之前有呼叫」這個真正會回歸的契約。
//
// 執行: pnpm vitest run apps/ftg-journey-server/dotenv-load.test.js

import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverSrc = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

// ─── 與 server.js 逐行對應的實作（守門邏輯若改，這裡必須跟著改）────────────
function loadDotEnv(file, env) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
}

function withEnvFile(contents, env = {}) {
  const file = path.join(__dirname, '.dotenv-fixture.tmp');
  fs.writeFileSync(file, contents);
  try {
    loadDotEnv(file, env);
  } finally {
    fs.unlinkSync(file);
  }
  return env;
}

// ─── 契約 1：server.js 內必須真的接上這條路徑 ────────────────────────────
test('server.js 必須定義 loadDotEnv', () => {
  expect(serverSrc, 'server.js 內找不到 loadDotEnv（.env 修正可能已被回退）').toMatch(
    /function loadDotEnv\(/
  );
});

test('loadDotEnv 必須在 JWT_SECRET 啟動守門之前被呼叫', () => {
  // 這是本次事故真正會回歸的地方：函式存在但忘記呼叫，靜態檢查完全看不出來，
  // 而服務會再次以「JWT_SECRET 未設定」退出。
  const callIdx = serverSrc.indexOf('loadDotEnv(path.join(__dirname');
  expect(callIdx, 'server.js 未呼叫 loadDotEnv(...)').toBeGreaterThan(-1);

  const gateIdx = serverSrc.indexOf('拒絕啟動：JWT_SECRET 未設定');
  expect(gateIdx, 'server.js 的 JWT_SECRET 啟動守門消失，請重新檢視守門邏輯').toBeGreaterThan(-1);

  expect(
    callIdx,
    'loadDotEnv 的呼叫出現在 JWT_SECRET 守門之後，.env 修正不會生效'
  ).toBeLessThan(gateIdx);
});

// ─── 契約 2：語意正確性 ──────────────────────────────────────────────────
test('能載入 .env 內容（事故情境：.env 存在但服務讀不到）', () => {
  const env = withEnvFile('JWT_SECRET=abc123\nPORT=8787\n');
  expect(env.JWT_SECRET).toBe('abc123');
  expect(env.PORT).toBe('8787');
});

test('檔案不存在時安靜略過（本地開發無 .env 不應崩潰）', () => {
  const env = {};
  loadDotEnv(path.join(__dirname, 'this-file-does-not-exist.env'), env);
  expect(env).toEqual({});
});

test('既有環境變數優先於 .env（12-factor：CI/PM2 注入值不得被覆蓋）', () => {
  const env = withEnvFile('JWT_SECRET=from-file\n', { JWT_SECRET: 'from-process-env' });
  expect(env.JWT_SECRET).toBe('from-process-env');
});

test('跳過註解、空行與空值行', () => {
  const env = withEnvFile(
    ['# 這是註解', '', '   ', '   # 縮排的註解', 'PORT=8787', ''].join('\n')
  );
  expect(env.PORT).toBe('8787');
  expect(Object.keys(env)).toEqual(['PORT']);
});

test('跳過非法鍵名與無等號的行', () => {
  const env = withEnvFile('not a valid line\n123BAD=1\nPORT=8787\n');
  expect(env.PORT).toBe('8787');
  expect(env['123BAD']).toBeUndefined();
  expect(env['not a valid line']).toBeUndefined();
});

test('值可包含 = （不應在第一個 = 就截斷）', () => {
  const env = withEnvFile('JWT_SECRET=abc=def==ghi\n');
  expect(env.JWT_SECRET).toBe('abc=def==ghi');
});

test('值可包含 # 且未被當成註解', () => {
  const env = withEnvFile('JWT_SECRET=abc#123\n');
  expect(env.JWT_SECRET).toBe('abc#123');
});

test('剝除雙引號與單引號包裹，保留內部內容', () => {
  const env = withEnvFile('A="double quoted"\nB=\'single quoted\'\n');
  expect(env.A).toBe('double quoted');
  expect(env.B).toBe('single quoted');
});

test('值前後空白被裁切（.env 常見手寫格式）', () => {
  const env = withEnvFile('PORT=   8787   \n');
  expect(env.PORT).toBe('8787');
});

test('CRLF 行尾（Windows 寫出的 .env）可正確解析', () => {
  const env = withEnvFile('PORT=8787\r\nJWT_SECRET=abc\r\n');
  expect(env.PORT).toBe('8787');
  expect(env.JWT_SECRET).toBe('abc');
});

test('後出現的重複鍵以首次載入者為準（不覆蓋）', () => {
  const env = withEnvFile('PORT=8787\nPORT=9999\n');
  expect(env.PORT).toBe('8787');
});
