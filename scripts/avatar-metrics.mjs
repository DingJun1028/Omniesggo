#!/usr/bin/env node
/**
 * 萬能知識分身 · 指標萃取 (avatar-metrics)
 * 解析 avatar.log 末次 run, 產 JSON 指標供 OA 蜂群/監控讀取。
 * 零依賴: 只讀 log 文字, 不連外部。
 */
import fs from 'node:fs';
import path from 'node:path';

const LOG = process.env.AVATAR_LOG || path.resolve('avatar.log');
const OUT = process.env.AVATAR_METRICS || path.resolve('avatar-metrics.json');

if (!fs.existsSync(LOG)) { console.log('[metrics] 無 log, skip'); process.exit(0); }
const log = fs.readFileSync(LOG, 'utf8');

// 抓「末次 run」專屬區塊: 必須同時用末次與次末 marker 切兩端。
// 舊版只用 `log.slice(0, lastDone)`, 取到的是「最後 marker 之前的所有內容」
// = 歷史上每一次 run; 舊 run 的降級行因此滲進末次指標 (實測: 同步 220/220 成功
// 卻仍被舊 run 的 198/22 蓋成 failed=22)。
const RUN_MARK = 'avatar-daily done';
const lastDone = log.lastIndexOf(RUN_MARK);
let block;
if (lastDone < 0) {
  block = log; // 尚未完成過任何 run, 只能退回全檔
} else {
  const prevDone = log.lastIndexOf(RUN_MARK, lastDone - 1);
  block = log.slice(prevDone >= 0 ? prevDone + RUN_MARK.length : 0, lastDone);
}
const lines = block.split('\n').filter(l => l.includes('[Avatar]') || l.includes('[tdai-sync]') || l.includes('[VaultGuard]') || l.includes('[cleanup]') || l.includes('[recall]'));

const m = {
  ts: new Date().toISOString(),
  hatched: 0, synced: 0, syncFailed: 0, guardOk: false, cleaned: false, recall: 0,
  errors: [],
};
// 「失敗樣本:」是降級摘要的明細行, 不是狀態行。它含「失敗」二字, 舊版條件
// `l.includes('失敗')` 會在此把已解析的 N 失敗覆寫回 0 —— 導致 22 次真實寫入
// 失敗被報成 failed=0 / healthy=true (假 PASS)。狀態行必須用錨定前綴辨識。
const DEGRADED_RE = /^\[tdai-sync\]\s*⚠\s*降級:\s*(\d+)\s*成功\s*\/\s*(\d+)\s*失敗/;
const SUCCESS_RE = /^\[tdai-sync\]\s*✅\s*全數同步成功\s*\((\d+)\)/;
const SAMPLE_RE = /^\[tdai-sync\]\s*失敗樣本[:：]/;

for (const l of lines) {
  if (l.includes('[Avatar] 孵化')) m.hatched = Number(l.match(/(\d+) 分身/)?.[1] || 0);
  if (SUCCESS_RE.test(l)) m.synced = Number(l.match(SUCCESS_RE)[1] || 0);
  // 單向: 只在真正見到降級狀態行時設定, 明細行永不覆寫狀態
  if (DEGRADED_RE.test(l)) {
    const g = l.match(DEGRADED_RE);
    m.synced = Number(g[1] || 0);
    m.syncFailed = Number(g[2] || 0);
  }
  if (l.includes('[VaultGuard] ✅')) m.guardOk = true;
  if (l.includes('[cleanup] ✅')) m.cleaned = true;
  if (l.includes('[recall]') && l.includes('筆')) m.recall = Number(l.match(/(\d+) 筆/)?.[1] || 0);
  if (l.includes('✗') || l.includes('Error') || l.includes('MODULE_NOT_FOUND')) m.errors.push(l.trim());
  // Ignore known local/VPS boundary noise that does not indicate real breakage
  if (SAMPLE_RE.test(l) || l.includes('[recall] ✗ fetch failed')) m.errors.pop();
}
m.healthy = m.syncFailed === 0 && m.errors.length === 0 && m.guardOk;
fs.writeFileSync(OUT, JSON.stringify(m, null, 2));
console.log(`[metrics] hatched=${m.hatched} synced=${m.synced} failed=${m.syncFailed} recall=${m.recall} healthy=${m.healthy}`);
process.exit(m.healthy ? 0 : 1);
