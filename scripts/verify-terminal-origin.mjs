#!/usr/bin/env node
// ============================================================
// OA-Team 終始矩陣 · 統一驗證閘 (Unified Terminal-Origin Matrix Gate)
//
// 併入同一套 5T 守門: 缺口補齊終始矩陣 (72 配對) + OmniLive Float 終始矩陣 (5 柱 RWD)
// 任一子閘 exit≠0 → 本閘 exit 1 (5T Trustworthy 不可篡改閉環, 不得宣稱通過)
//
// 雙向同步拓撲一致性比對:
//   缺口補齊: shared/types.ts(終) → shared/gap-matrix.ts(單一真相源) → consumer .d.ts(始)
//   Float:    types/float-matrix.ts(終) → shared/float-matrix.mjs(鏡像) → public/float.html(始)
//   兩者皆: canonical 單一來源 + 雙向同步 + 5T 驗算閘 + exit 1 阻斷
//
// 用法: node scripts/verify-terminal-origin.mjs
// ============================================================
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function runGate(name, cmd, args, cwd) {
  console.log(`\n${CYAN}── ${name} ──${RESET}`);
  const r = spawnSync(cmd, args, { cwd: cwd || root, encoding: 'utf-8' });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  const okExit = r.status === 0;
  console.log(`${okExit ? GREEN + '  ✓' : RED + '  ✗'} ${name} ${okExit ? 'PASS' : 'FAIL'} (exit=${r.status})`);
  return okExit;
}

// 1. 缺口補齊終始矩陣 (需 tsx 轉譯 TS verify)
const gapOk = runGate(
  'OA-Team 缺口補齊 終始矩陣 (72 配對 / 30·30 觸達)',
  'npx', ['tsx', 'scripts/verify_gap_matrix.ts'], root
);

// 2. OmniLive Float 終始矩陣 (純 mjs 驗證閘)
const floatOk = runGate(
  'OmniLive Float 終始矩陣 (RWD × 字幕 × 音訊 × 房間 × 分享)',
  'node', ['scripts/verify-float-matrix.mjs'], path.join(root, 'apps/universal-translator')
);

// 3. Learning-Center 消費端終始矩陣 (consumer 契約完整性 + 72 重放)
const lcOk = runGate(
  'Learning-Center 消費端終始矩陣',
  'node', ['scripts/verify-matrix.mjs'], path.join(root, 'apps/learning-center')
);

// 4. OA-Swarm 雙蜂 60 員終始矩陣 (自有閘: OA 型別同步 + 五陣列 MECE + 60 觸達 + 5T 協定)
const oaOk = runGate(
  'OA-Swarm 雙蜂 60 員終始矩陣',
  'node', ['scripts/verify-oa-gap.mjs'], path.join(root, 'oa-swarm')
);

// 5. 增量輸出優化引擎 (soul.md §12 / §15.5: 增量 delta + Hash Lock + 5T 閘)
const incrOk = runGate(
  '增量輸出優化引擎 (§12/§15.5)',
  'npx', ['tsx', 'scripts/verify-incremental.mjs'], root
);

// 一致性比對: 五套終始矩陣必須共用同一套 5T 守門 (全綠)
const allPass = gapOk && floatOk && lcOk && oaOk && incrOk;

console.log('\n══════════════════════════════════════════');
if (allPass) {
  console.log(`${GREEN}✅ 終始矩陣統一驗證閘: 缺口補齊(72) + Float(5柱) + Learning-Center(消費端) + OA-Swarm(雙蜂60) + 增量輸出(§12) 全數通過 — 雙向同步拓撲一致, 5T 同一套守門${RESET}`);
  console.log('═'.repeat(40));
  process.exit(0);
} else {
  console.log(`${RED}❌ 終始矩陣統一驗證閘: 有矩陣未通過 (缺口補齊=${gapOk}, Float=${floatOk}, Learning-Center=${lcOk}, OA-Swarm=${oaOk}, 增量輸出=${incrOk}) — 不得宣稱通過${RESET}`);
  console.log('═'.repeat(40));
  process.exit(1);
}
