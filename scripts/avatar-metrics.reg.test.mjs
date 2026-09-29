#!/usr/bin/env node
/**
 * avatar-metrics 假 PASS 回歸測試 (regression for the silent-zero bug)
 *
 * 缺陷: 舊版用 `l.includes('失敗')` 判定降級狀態, 但緊接的「失敗樣本:」明細行
 * 也含「失敗」二字且無數字, 於是把已解析的 N 失敗覆寫回 0 → 22 次真實寫入失敗
 * 被報成 failed=0 / healthy=true / exit 0 (假 PASS)。
 *
 * 本測試以兩份 fixture 鎖定行為:
 *   A. 降級 fixture → 必須報 failed=22, healthy=false, exit 1
 *   B. 成功 fixture → 必須報 synced=220, failed=0,  healthy=true,  exit 0
 * 真實缺口不可被量測掩蓋 —— 這是 5T Transparent 的硬門檻。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(HERE, 'avatar-metrics.mjs');

const GUARD_OK = '[VaultGuard] ✅ 通過: 無真憑證, 研究權限可全開';
const CLEAN_OK = '[cleanup] ✅ 無測試型別殘留';
const HATCH = '[Avatar] 孵化 366 分身';
const RECALL = '[recall] 10 筆 (query="avatar")';

const FIXTURE_DEGRADED = [
  `[avatar-daily] === Inherit ===`,
  `[recall] 10 筆 (query="avatar")`,
  `[Avatar] 孵化 366 分身`,
  `[tdai-sync] 同步 220 分身 → TencentDB (http://127.0.0.1:8420)`,
  `[tdai-sync] ⚠ 降級: 198 成功 / 22 失敗 (端點未知, 本地 registry 不丟)`,
  `[tdai-sync] 失敗樣本: 雙生拓撲: AbortError: This operation was aborted | 5T 閉環: AbortError`,
  `[tdai-sync] 建議: 確認 agentmemory 正確寫入路徑後重跑`,
  GUARD_OK,
  CLEAN_OK,
  `[avatar-daily] avatar-daily done`,
].join('\n');

const FIXTURE_SUCCESS = [
  `[recall] 10 筆 (query="avatar")`,
  HATCH,
  `[tdai-sync] 同步 220 分身 → TencentDB (http://127.0.0.1:8420)`,
  `[tdai-sync] ✅ 全數同步成功 (220)`,
  GUARD_OK,
  CLEAN_OK,
  `[avatar-daily] avatar-daily done`,
].join('\n');

function runFixture(name, logText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'avatar-metrics-reg-'));
  const log = path.join(dir, 'avatar.log');
  const out = path.join(dir, 'avatar-metrics.json');
  fs.writeFileSync(log, logText, 'utf8');
  let rc = 0;
  let stdout = '';
  try {
    stdout = execFileSync(process.execPath, [SCRIPT], {
      env: { ...process.env, AVATAR_LOG: log, AVATAR_METRICS: out },
      encoding: 'utf8',
    });
  } catch (e) {
    rc = e.status ?? -1;
    stdout = e.stdout ?? '';
  }
  const json = JSON.parse(fs.readFileSync(out, 'utf8'));
  fs.rmSync(dir, { recursive: true, force: true });
  return { name, rc, stdout: stdout.trim(), json };
}

const cases = [
  {
    name: 'A. 降級 fixture',
    log: FIXTURE_DEGRADED,
    expect: (r) => r.json.syncFailed === 22 && r.json.synced === 198 && r.json.healthy === false && r.rc === 1,
    why: '22 次真實失敗必須被看見 → failed=22, healthy=false, exit 1',
  },
  {
    name: 'B. 成功 fixture',
    log: FIXTURE_SUCCESS,
    expect: (r) => r.json.synced === 220 && r.json.syncFailed === 0 && r.json.healthy === true && r.rc === 0,
    why: '全數成功 → synced=220, failed=0, healthy=true, exit 0',
  },
  {
    // 缺口三: 舊版 `slice(0, lastDone)` 取到「最後 marker 之前的所有內容」=
    // 歷史上每一次 run。降級的舊 run 會把已恢復的末次 run 重新拖成 failed=22
    // (實測於 VPS: 同步 220/220 成功, metrics 仍報 failed=22)。
    name: 'C. 舊 run 資料不得滲入末次 run',
    log: [FIXTURE_DEGRADED, '', FIXTURE_SUCCESS].join('\n'),
    expect: (r) => r.json.synced === 220 && r.json.syncFailed === 0 && r.json.healthy === true && r.rc === 0,
    why: '前一次 run 降級 198/22, 末次全數成功 → 必須只報末次: 220/0/healthy=true',
  },
];

let failed = 0;
for (const c of cases) {
  const r = runFixture(c.name, c.log);
  const ok = c.expect(r);
  if (!ok) failed++;
  console.log(`${ok ? '  ✓' : '  ✗'} ${c.name}`);
  console.log(`      ${r.stdout}`);
  console.log(`      expect: ${c.why}`);
  if (!ok) {
    console.log(`      actual: ${JSON.stringify({ ...r.json, errors: r.json.errors.length })} rc=${r.rc}`);
  }
}

console.log('----------------------------------------');
if (failed) {
  console.log(`✗ 回歸測試失敗: ${failed}/${cases.length} 案例未通過 — 假 PASS 仍存在`);
  process.exit(1);
}
console.log(`✓ 假 PASS 已根除: ${cases.length}/${cases.length} 案例通過 (降級不再被靜默歸零)`);
