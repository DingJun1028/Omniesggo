#!/usr/bin/env node
/**
 * 對照測試: 證明 esggo .githooks/pre-commit 的 vault 質控蜂閘能否變紅。
 *
 * 用「真實 hook 檔」而非重寫實作 —— 重寫會測到我的仿製品而非真閘。
 * 每個案例都必須真的 staged, 否則閘拿到空清單必然綠燈, 負向對照將
 * 結構上沒有能力失敗 (第一版踩了這個坑, 差點把 harness bug 誤判成真缺陷)。
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// 由腳本位置推導 repo 根, 不可硬編碼 C:/Project/esggo ——
// 否則換個 checkout 路徑（含 CI 的 runner 暫存路徑）第一個 copyFileSync 就失敗，
// 整個對照 harness 跑不起來。
const REPO_SRC = path.resolve(__dirname, '..');
const SANDBOX = path.join(os.tmpdir(), 'gate-ctrl-' + Date.now());

const sh = (cmd, cwd) => execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });

function setup() {
  fs.rmSync(SANDBOX, { recursive: true, force: true });
  fs.mkdirSync(path.join(SANDBOX, '.githooks'), { recursive: true });
  fs.mkdirSync(path.join(SANDBOX, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(SANDBOX, 'vault'), { recursive: true });
  // 真實 hook 與其依賴 (每次重跑都重新複製 → 自動對照最新實作)
  fs.copyFileSync(path.join(REPO_SRC, '.githooks/pre-commit'), path.join(SANDBOX, '.githooks/pre-commit'));
  fs.copyFileSync(path.join(REPO_SRC, 'scripts/encoding-check.mjs'), path.join(SANDBOX, 'scripts/encoding-check.mjs'));
  // 不放 package.json / pnpm-lock.yaml / agents.yaml → 閘 #2 #3 不觸發,
  // 本測試只觀察 #4 質控蜂。閘 #1 (encoding) 永遠執行。
  sh('git init -q', SANDBOX);
  sh('git config user.email t@t.t && git config user.name t', SANDBOX);
  sh('git config core.hooksPath .githooks', SANDBOX);
}

function runHook() {
  // 必須同時取到成功與失敗兩種情況的輸出: 閘在假綠時正是走成功路徑,
  // 若只在失敗時取輸出, 它的警告訊號會被整個丟掉 (第二版踩了這個坑)。
  const r = spawnSync(process.execPath, ['.githooks/pre-commit'], { cwd: SANDBOX, encoding: 'utf-8' });
  return { rc: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

const GOOD = '---\nsource_origin: test\nco_authors: [x]\n---\n\n# ok\n';
const BAD = '---\nco_authors: [x]\n---\n\n# 缺 source_origin\n';

const cases = [
  { name: 'A. 壞內容, 工作區存在', want: 'red', file: 'a.md', body: BAD, del: false },
  // 決定性對照: 舊實作讀工作區 → ENOENT → catch 成 warn → exit 0 (假綠);
  // 新實作讀 index   → 看見壞內容 → exit 1 (正確)。
  { name: 'B. 壞內容, staged 後工作區刪除 ← 決定性對照', want: 'red', file: 'b.md', body: BAD, del: true },
  { name: 'C. 好內容, 工作區存在', want: 'green', file: 'c.md', body: GOOD, del: false },
  // D 的斷言: 必須證明「真的校驗了 1 檔」而非「跳過 0 檔」——
  // 只看 exit 0 無法區分「驗過且合格」與「什麼都沒驗」。
  { name: 'D. 好內容, staged 後工作區刪除', want: 'green', file: 'd.md', body: GOOD, del: true,
    mustSay: /1 vault 筆記通過/, why: '必須證明真的校驗了 1 檔, 而非跳過 0 檔' },
];

let pass = 0, fail = 0;
for (const c of cases) {
  setup();
  const p = path.join(SANDBOX, 'vault', c.file);
  fs.writeFileSync(p, c.body);
  sh(`git add vault/${c.file}`, SANDBOX);
  if (c.del) fs.rmSync(p);
  const stagedNow = sh('git diff --cached --name-only', SANDBOX).trim();
  const r = runHook();
  const got = r.rc === 0 ? 'green' : 'red';
  let ok = got === c.want;
  let extra = '';
  if (ok && c.mustSay) {
    const m = r.out.match(/(\d+) vault 筆記通過/);
    ok = c.mustSay.test(r.out);
    extra = `  [斷言 實際校驗檔數=${m ? m[1] : '無輸出'}]`;
  }
  ok ? pass++ : fail++;
  console.log(`${ok ? '  ✓' : '  ✗'} ${c.name}`);
  console.log(`      staged=[${stagedNow.split('\n').filter(Boolean).join(',')}]  實際=${got} (exit ${r.rc})  期望=${c.want}${extra}`);
  if (c.why && !ok) console.log(`      為何重要: ${c.why}`);
  const sig = r.out.split('\n').filter((l) => /質控蜂/.test(l));
  if (sig.length) console.log(`      閘輸出: ${sig.join(' | ').slice(0, 150)}`);
}
fs.rmSync(SANDBOX, { recursive: true, force: true });
console.log('----------------------------------------');
console.log(`${fail === 0 ? '✓ 對照組全部有效' : '✗ 對照組無效'}: ${pass}/${pass + fail} 案例符合期望`);
process.exit(fail === 0 ? 0 : 1);
