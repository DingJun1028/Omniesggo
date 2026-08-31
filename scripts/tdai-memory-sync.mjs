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

async function tryWrite(entry) {
  if (!TDAI_KEY) return { ok: false, why: 'no-key' };
  for (const p of WRITE_PATHS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
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
    console.warn(`[tdai-sync] ⚠ 降級: ${ok} 成功 / ${fail} 失敗 (端點未知, 本地 registry 不丟)`);
    console.warn('[tdai-sync] 失敗樣本: ' + results.slice(0, 3).join(' | '));
    console.warn('[tdai-sync] 建議: 確認 agentmemory 正確寫入路徑後重跑');
  }
}

main();
