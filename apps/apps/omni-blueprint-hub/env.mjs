// ============================================================
// 零依賴 .env 載入器 — 不覆寫已存在的 process.env (env 優先於檔案)
// 支援: KEY=VALUE / # 註解 / 空行 / 前後空白 / 引號包覆
// ============================================================
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadEnv(file = join(__dirname, '.env')) {
  if (!existsSync(file)) return { loaded: false, count: 0, file };
  let count = 0;
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i < 1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val === '') continue;                      // 空值視為未設定
    if (process.env[key] !== undefined) continue;  // 真實 env 優先
    process.env[key] = val;
    count++;
  }
  return { loaded: true, count, file };
}
