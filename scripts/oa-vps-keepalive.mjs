#!/usr/bin/env node
/**
 * OA_VPS 閒置收割防護 (oa-vps-keepalive)
 * 防止 Oracle Always Free A1 因 7天 CPU<20% 被回收。
 * 每 5 分鐘查 load avg(1min)，若低於閾值則自啟 60s 輕負載 (Pi 計算) 撐到 ~20%。
 *
 * 設計原則 (5T):
 * - Traceable: 寫 /var/log/oa-keepalive.log 含每次動作 + load 快照
 * - Trackable: 輸出 JSON 指標 (last_load / boosted / skipped)
 * - Tangible: 實際消耗 CPU (非空轉 spin，用 Math 避免 100% 卡死)
 * - Trustworthy: 上限 60s/次，絕不壟斷 CPU
 * - Transparent: 閾值/行為全部可配置，無隱藏副作用
 *
 * 用法: node scripts/oa-vps-keepalive.mjs [--once] [--threshold 0.4]
 */
import { readFileSync, appendFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import os from 'node:os';
import { dirname } from 'node:path';

const LOG = process.env.OA_KEEPALIVE_LOG || (process.env.HOME ? `${process.env.HOME}/logs/oa-keepalive.log` : '/tmp/oa-keepalive.log');
const METRICS = process.env.OA_KEEPALIVE_METRICS || (process.env.HOME ? `${process.env.HOME}/logs/oa-keepalive-metrics.json` : '/tmp/oa-keepalive-metrics.json');
const THRESHOLD = Number(process.env.OA_KEEPALIVE_THRESHOLD || (process.argv.includes('--threshold') ? process.argv[process.argv.indexOf('--threshold') + 1] : 0.4));
const ONCE = process.argv.includes('--once');
const BOOST_SECONDS = Number(process.env.OA_KEEPALIVE_BOOST || 60);

// 讀 1min load avg (Linux /proc/loadavg)
function getLoad1() {
  try {
    const [l1] = readFileSync('/proc/loadavg', 'utf8').trim().split(/\s+/);
    return Number(l1);
  } catch {
    return os.loadavg()[0];
  }
}

// 輕負載: 算 Pi 到 N 位 (CPU 友好, 不 I/O 阻塞)
function lightLoad(seconds) {
  const end = Date.now() + seconds * 1000;
  let pi = 0, k = 0;
  while (Date.now() < end) {
    // Leibniz 級數片段, 每次迴圈約 1ms
    for (let i = 0; i < 50000; i++) { pi += (k % 2 === 0 ? 4 : -4) / (2 * k + 1); k++; }
  }
  return pi;
}

function log(line) {
  const ts = new Date().toISOString();
  const entry = `[${ts}] ${line}`;
  try {
    const dir = dirname(LOG);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(LOG, entry + '\n');
  } catch { /* log best-effort */ }
  return entry;
}

const load1 = getLoad1();
const cpus = os.cpus().length;
// 負載率 = load1 / cpus (4核時 0.4 ≈ 10%, 0.8 ≈ 20%)
const rate = load1 / cpus;

if (rate < THRESHOLD) {
  log(`LOW load=${load1.toFixed(2)} rate=${(rate*100).toFixed(0)}% < thr=${(THRESHOLD*100).toFixed(0)}% → boost ${BOOST_SECONDS}s`);
  const pi = lightLoad(BOOST_SECONDS);
  log(`BOOSTED pi≈${pi.toFixed(4)} spent=${BOOST_SECONDS}s`);
  writeMetrics({ last_load: load1, rate, boosted: true, skipped: false, ts: new Date().toISOString() });
  console.log(`[keepalive] boosted: load ${load1.toFixed(2)} → spent ${BOOST_SECONDS}s`);
} else {
  log(`OK load=${load1.toFixed(2)} rate=${(rate*100).toFixed(0)}% >= thr OK`);
  writeMetrics({ last_load: load1, rate, boosted: false, skipped: true, ts: new Date().toISOString() });
  console.log(`[keepalive] skipped: load ${load1.toFixed(2)} healthy`);
}

function writeMetrics(m) {
  try { writeFileSync(METRICS, JSON.stringify(m, null, 2)); } catch { /* best-effort */ }
}

if (!ONCE) {
  // 由 cron/systemd 每 5 分鐘呼叫; 此處不自我循環避免重複常駐
  process.exit(0);
}
