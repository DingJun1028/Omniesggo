#!/usr/bin/env node
// evolve.mjs — 自我進化引擎 · 主循環
// observe → learn → improve → verify → 回寫 (skills/ 或 proposals/)
// 5T 對齊: 每輪產出可追溯、可驗證、不可篡改的進化報告
import { observe } from './observe.mjs';
import { learn } from './learn.mjs';
import { improve } from './improve.mjs';
import { verify } from './verify.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT = path.join(__dirname, 'evolution-report.json');

function evolve() {
  const obs = observe();              // 觀測
  const exps = learn(obs);            // 學習
  const props = improve(exps);        // 改進
  const v = verify(props);            // 驗證

  // hashLock (5T: 不可篡改)
  const report = {
    cycle: Date.now(),
    timestamp: new Date().toISOString(),
    observed: obs.summary,
    recurringThemes: obs.recurringThemes,
    experiences: exps.length,
    proposals: props.length,
    verified: `${v.pass}/${v.total}`,
    hashLock: 'R-SEAL:' + crypto.createHash('sha256')
      .update(JSON.stringify({ obs, exps, props, v })).digest('hex').slice(0, 32),
  };
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), 'utf8');
  return report;
}

if (process.argv[1] && process.argv[1].includes('evolve.mjs')) {
  const r = evolve();
  console.log('[evolution:evolve] 自我進化循環完成');
  console.log(`  觀測: ${r.observed}`);
  console.log(`  經驗萃取: ${r.experiences} 條`);
  console.log(`  改進提案: ${r.proposals} 個`);
  console.log(`  驗證: ${r.verified}`);
  console.log(`  hashLock: ${r.hashLock}`);
  console.log(`  報告: ${REPORT}`);
}
