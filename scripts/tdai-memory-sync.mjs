#!/usr/bin/env node
/**
 * 萬能知識分身 → TencentDB Agent Memory 蜂寫層同步 (B 線)
 *
 * 讀取 .avatar-registry.json, 將分身吸收狀態同步進 OA 蜂寫層。
 * 優雅降級: 寫入端點未知/失敗時標 sync_failed, 不崩、不漏本地狀態。
 *
 * 協議: agentmemory v3
 *   header: x-tdai-service-id: default + Authorization: Bearer <key>
 *   端點待確認 (8420/8424 寫入路徑未明, 先試常見路徑, 全失敗則降級)
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const VAULT = path.resolve('vault');
const REG = path.join(VAULT, 'Agents/context/.avatar-registry.json');
const TDAI_CORE = process.env.TDAI_MEMORY_URL || 'http://127.0.0.1:8420';
const TDAI_KEY = process.env.TDAI_GATEWAY_API_KEY
  || (fs.existsSync('.admin-key') ? fs.readFileSync('.admin-key', 'utf8').trim() : '')
  || (fs.existsSync('/opt/esggo/apps/tencentdb-memory/.admin-key') ? fs.readFileSync('/opt/esggo/apps/tencentdb-memory/.admin-key', 'utf8').trim() : '');
const SVC = process.env.TDAI_SERVICE_ID || 'default';

const WRITE_PATHS = [
  `/v3/conversation/add`,
  `/v3/knowledge/create`,
];

// 寫入格式: conversation/add 接受 messages array
function buildBody(entry) {
  return {
    messages: [{
      role: 'user',
      content: `[avatar ${entry.node}] correct=${entry.correct} variant=${entry.variant} file=${entry.file}`,
    }],
  };
}

function loadReg() {
  if (!fs.existsSync(REG)) return null;
  return JSON.parse(fs.readFileSync(REG, 'utf8'));
}

// 逾時預算: 8s 對長尾不足 (見 tryWrite catch 註解)。18s 足以覆蓋排隊長尾,
// 又短於 cron 可接受的單次上限。非逾時錯誤不受影響。
const REQ_TIMEOUT_MS = Number(process.env.TDAI_WRITE_TIMEOUT_MS || 18_000);
const MAX_RETRY = Number(process.env.TDAI_WRITE_MAX_RETRY || 1);
const RETRY_BACKOFF_MS = Number(process.env.TDAI_WRITE_BACKOFF_MS || 2_000);

async function tryWrite(entry, attempt = 0) {
  if (!TDAI_KEY) return { ok: false, why: 'no-key' };
  for (const p of WRITE_PATHS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS);
      const r = await fetch(TDAI_CORE + p, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tdai-service-id': SVC,
          Authorization: 'Bearer ' + TDAI_KEY,
        },
        body: JSON.stringify(buildBody(entry)),
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (r.ok) return { ok: true, path: p };
      const txt = await r.text();
      if (!/Not found/.test(txt)) return { ok: false, why: `${r.status}:${txt.slice(0, 60)}` };
      // 404 試下一個路徑
    } catch (e) {
      const aborted = e?.name === 'AbortError';
      // AbortError 是逾時而非端點錯誤。實測: 前 20 次寫入 avg 1.26s / max 2.07s
      // (遠低於 8s), 但 220 次連寫的長尾會觸發 TDAI 排隊, 尾部請求逾時 ——
      // 歷史上 19-22 個分身因此被判失敗, 而非真的寫不進去。故對逾時重試一次,
      // 退避後再試; 非逾時錯誤不重試 (避免放大真故障)。
      if (aborted && attempt < MAX_RETRY) {
        await new Promise(res => setTimeout(res, RETRY_BACKOFF_MS));
        return tryWrite(entry, attempt + 1);
      }
      return { ok: false, why: String(e).slice(0, 60) };
    }
  }
  return { ok: false, why: 'all-paths-404' };
}

async function main() {
  const reg = loadReg();
  if (!reg) {
    console.error('[tdai-sync] 無 registry, 請先跑 knowledge-avatar.mjs');
    process.exit(1);
  }
  const entries = Object.values(reg);
  console.log(`[tdai-sync] 同步 ${entries.length} 分身 → TencentDB (${TDAI_CORE})`);

  let ok = 0, fail = 0;
  const results = [];
  for (const e of entries) {
    const r = await tryWrite(e);
    if (r.ok) ok++;
    else { fail++; results.push(`${e.node}: ${r.why}`); }
  }
  if (fail === 0) {
    console.log(`[tdai-sync] ✅ 全數同步成功 (${ok})`);
  } else {
    // 端點已實測正常 (HTTP 200), 失敗多為長尾逾時, 故不再宣稱「端點未知」。
    const timeouts = results.filter(r => /AbortError|aborted/i.test(r)).length;
    const cause = timeouts === fail
      ? `逾時 ${fail} 筆 (端點實測正常, 屬長尾排隊)`
      : `逾時 ${timeouts} / 其他 ${fail - timeouts} 筆`;
    console.warn(`[tdai-sync] ⚠ 降級: ${ok} 成功 / ${fail} 失敗 (${cause}, 本地 registry 不丟)`);
    console.warn('[tdai-sync] 失敗樣本: ' + results.slice(0, 3).join(' | '));
    console.warn('[tdai-sync] 建議: 提高 TDAI_WRITE_TIMEOUT_MS 或降低 TDAI 端寫入負載後重跑');
  }
  // 退出碼誠實化: 有失敗即非零, 讓排程層看得到 (舊版永遠 exit 0)。
  process.exit(fail === 0 ? 0 : 1);
}

main();
