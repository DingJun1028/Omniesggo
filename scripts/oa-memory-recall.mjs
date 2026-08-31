#!/usr/bin/env node
/**
 * OA 蜂群記憶召回 (oa-memory-recall) — TencentDB 蜂寫層讀路徑
 *
 * 讓 OA 蜂群從 TencentDB Agent Memory 取回知識分身 / 對話記憶。
 * 協議: agentmemory v3 — POST /v3/conversation/query (messages array)
 *
 * 用法:
 *   node scripts/oa-memory-recall.mjs "avatar"         查詢關鍵字
 *   node scripts/oa-memory-recall.mjs --recent 5       最近 5 筆
 *   node scripts/oa-memory-recall.mjs --node "IPlayerSource"  精確結點
 */
import fs from 'node:fs';
import path from 'node:path';

const TDAI_CORE = process.env.TDAI_MEMORY_URL || 'http://127.0.0.1:8420';
const TDAI_KEY = process.env.TDAI_GATEWAY_API_KEY
  || (fs.existsSync('.admin-key') ? fs.readFileSync('.admin-key', 'utf8').trim() : '')
  || (fs.existsSync('/opt/esggo/apps/tencentdb-memory/.admin-key') ? fs.readFileSync('/opt/esggo/apps/tencentdb-memory/.admin-key', 'utf8').trim() : '');
const SVC = process.env.TDAI_SERVICE_ID || 'default';

const args = process.argv.slice(2);
const recentFlag = args.indexOf('--recent');
const nodeFlag = args.indexOf('--node');
const query = recentFlag >= 0 ? '' : (nodeFlag >= 0 ? args[nodeFlag + 1] : (args[0] || ''));
const limit = recentFlag >= 0 ? Number(args[recentFlag + 1] || 5) : 10;

async function recall(q, lim) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${TDAI_CORE}/v3/conversation/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tdai-service-id': SVC, Authorization: 'Bearer ' + TDAI_KEY },
      body: JSON.stringify({ query: q, limit: lim }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const msgs = (j.data && j.data.messages) || [];
    const filtered = q ? msgs.filter(m => (m.content || '').includes(q)) : msgs;
    return filtered;
  } catch (e) {
    console.error(`[recall] ✗ ${e.message}`);
    return null;
  }
}

(async () => {
  if (!TDAI_KEY) { console.error('[recall] ✗ 無 API key'); process.exit(1); }
  const msgs = await recall(query, limit);
  if (!msgs) process.exit(1);
  console.log(`[recall] ${msgs.length} 筆 (query="${query}")`);
  for (const m of msgs) {
    console.log(`  • ${m.content}`);
  }
})();
