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

// 抓末次 "avatar-daily done" 之前的區塊
const lastDone = log.lastIndexOf('avatar-daily done');
const block = lastDone >= 0 ? log.slice(0, lastDone) : log;
const lines = block.split('\n').filter(l => l.includes('[Avatar]') || l.includes('[tdai-sync]') || l.includes('[VaultGuard]') || l.includes('[cleanup]') || l.includes('[recall]'));

const m = {
  ts: new Date().toISOString(),
  hatched: 0, synced: 0, syncFailed: 0, guardOk: false, cleaned: false, recall: 0,
  errors: [],
};
for (const l of lines) {
  if (l.includes('[Avatar] 孵化')) m.hatched = Number(l.match(/(\d+) 分身/)?.[1] || 0);
  if (l.includes('全數同步成功')) m.synced = Number(l.match(/成功 \(?(\d+)/)?.[1] || 0);
  if (l.includes('降級') || l.includes('失敗')) { m.syncFailed = Number(l.match(/(\d+) 失敗/)?.[1] || 0); }
  if (l.includes('[VaultGuard] ✅')) m.guardOk = true;
  if (l.includes('[cleanup] ✅')) m.cleaned = true;
  if (l.includes('[recall]') && l.includes('筆')) m.recall = Number(l.match(/(\d+) 筆/)?.[1] || 0);
  if (l.includes('✗') || l.includes('Error') || l.includes('MODULE_NOT_FOUND')) m.errors.push(l.trim());
  // Ignore known local/VPS boundary noise that does not indicate real breakage
  if (l.includes('失敗樣本:') || l.includes('失敗樣本：') || l.includes('[recall] ✗ fetch failed')) m.errors.pop();
}
m.healthy = m.syncFailed === 0 && m.errors.length === 0 && m.guardOk;
fs.writeFileSync(OUT, JSON.stringify(m, null, 2));
console.log(`[metrics] hatched=${m.hatched} synced=${m.synced} failed=${m.syncFailed} recall=${m.recall} healthy=${m.healthy}`);
process.exit(m.healthy ? 0 : 1);
