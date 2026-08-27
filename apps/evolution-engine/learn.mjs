#!/usr/bin/env node
// learn.mjs — 自我進化引擎 · 學習層
// 把 observe 的痛點信號 → 結構化經驗 (experiences.json 累積)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { observe } from './observe.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXP_FILE = path.join(__dirname, 'experiences.json');

// 主題 → 經驗萃取規則 (5T 對齊: 可溯源/可驗證)
const RULES = {
  'timeout': { lesson: 'SSH/CI/LLM 呼叫需設 command_timeout 與模型 fallback，避免 45s 阻塞', tag: 'T3-robustness' },
  'boundary noise': { lesson: 'local/VPS 邊界噪聲不應計入健康失敗，需過濾 sample lines', tag: 'T1-truth' },
  'ignore': { lesson: '重複 ignore 模式表示該噪聲源應被永久排除 (gitignore/健康計算)', tag: 'T4-trust' },
  '契約測試': { lesson: 'Vitest 契約測試對 node:test 檔案敏感，需 exclude 或統一 runner', tag: 'T5-verifiable' },
  'vitest': { lesson: 'root vitest 收集 node:test 檔會 break，分層 test 配置', tag: 'T5-verifiable' },
};

export function learn(obs) {
  const exps = [];
  // 從高頻主題萃取經驗
  for (const { theme, count } of obs.recurringThemes) {
    if (RULES[theme]) {
      exps.push({
        id: `EXP-${Date.now().toString(36)}-${theme}`,
        theme, count,
        lesson: RULES[theme].lesson,
        tag: RULES[theme].tag,
        created_at: new Date().toISOString(),
        source: 'git-log-recurring',
      });
    }
  }
  // 從未追蹤檔萃取「鬆散產物」經驗
  const looseArtifacts = obs.signals.filter(s => s.type === 'loose-artifact').map(s => s.raw);
  if (looseArtifacts.length) {
    exps.push({
      id: `EXP-${Date.now().toString(36)}-loose`,
      theme: 'loose-artifact', count: looseArtifacts.length,
      lesson: `偵測到 ${looseArtifacts.length} 個未追蹤檔，應定期封存 (archive-protocol) 或補 commit`,
      tag: 'T2-tidy',
      artifacts: looseArtifacts.slice(0, 10),
      created_at: new Date().toISOString(),
      source: 'untracked',
    });
  }
  return exps;
}

// 累積寫入 experiences.json (不覆蓋歷史)
function accumulate(exps) {
  let all = [];
  try { all = JSON.parse(fs.readFileSync(EXP_FILE, 'utf8')); } catch { all = []; }
  const merged = [...all, ...exps];
  fs.writeFileSync(EXP_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged.length;
}

if (process.argv[1] && process.argv[1].includes('learn.mjs')) {
  const obs = observe();
  const exps = learn(obs);
  const total = accumulate(exps);
  console.log(`[evolution:learn] 萃取 ${exps.length} 條經驗, 累積共 ${total} 條`);
  for (const e of exps) console.log(`   - [${e.tag}] ${e.theme}: ${e.lesson}`);
}
