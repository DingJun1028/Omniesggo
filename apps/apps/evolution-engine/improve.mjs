#!/usr/bin/env node
// improve.mjs — 自我進化引擎 · 改進層
// 把 learn 的經驗 → 可執行改進 (技能骨架 / gitignore 修補 / 測試建議)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { observe } from './observe.mjs';
import { learn } from './learn.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXP_FILE = path.join(__dirname, 'experiences.json');
const OUT_DIR = path.join(__dirname, 'proposals');

export function improve(exps) {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const proposals = [];
  for (const e of exps) {
    let proposal;
    if (e.tag === 'T3-robustness' || e.theme === 'timeout') {
      proposal = {
        type: 'skill-skeleton',
        target: 'skills/devops/ssh-timeout-guard',
        content: `# ssh-timeout-guard\n自動為 SSH/CI 指令加 command_timeout + 模型 fallback，避免 45s 阻塞。\n觸發: 任何 ssh/git/curl 遠端呼叫前先設 timeout。`,
      };
    } else if (e.tag === 'T2-tidy' || e.theme === 'loose-artifact') {
      proposal = {
        type: 'gitignore-patch',
        target: '.gitignore',
        content: `# 自動建議: 排除常見鬆散產物\n.reports/\n*.bat\n_tmp_*/`,
      };
    } else {
      proposal = {
        type: 'note',
        target: 'experiences.json',
        content: e.lesson,
      };
    }
    const file = path.join(OUT_DIR, `${e.id}.proposal.md`);
    fs.writeFileSync(file, `# Proposal: ${e.theme}\n\n${proposal.content}\n`, 'utf8');
    proposals.push({ ...proposal, id: e.id, file });
  }
  return proposals;
}

if (process.argv[1] && process.argv[1].includes('improve.mjs')) {
  const obs = observe();
  const exps = learn(obs);
  const props = improve(exps);
  console.log(`[evolution:improve] 生成 ${props.length} 個改進提案:`);
  for (const p of props) console.log(`   - [${p.type}] ${p.id} → ${p.target}`);
}
