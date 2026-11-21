#!/usr/bin/env node
// observe.mjs — 自我進化引擎 · 觀測層
// 掃描 git 歷史 / 未追蹤檔 / 近期 fix 模式 → 萃取痛點信號
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

function scanGitPain() {
  let log = '';
  try { log = execSync(`git -C "${ROOT}" log --oneline -50`, { encoding: 'utf8' }); }
  catch { return []; }
  const painPatterns = [
    /fix\(.*\):\s*(ignore|還原|修復|treat.*as.*non|avoid)/i,
    /(boundary noise|契約測試|contract test|sample lines|vitest)/i,
    /(flaky|timeout|race|concurrent|併發)/i,
  ];
  const signals = [];
  for (const l of log.split('\n').filter(Boolean)) {
    for (const p of painPatterns) {
      if (p.test(l)) { signals.push({ source: 'git-log', raw: l.trim(), type: 'recurring-pain' }); break; }
    }
  }
  return signals;
}

function scanUntracked() {
  let status = '';
  try { status = execSync(`git -C "${ROOT}" status --short`, { encoding: 'utf8' }); }
  catch { return []; }
  return status.split('\n').filter(l => l.startsWith('??'))
    .map(l => l.replace('??', '').trim())
    .map(f => ({ source: 'untracked', raw: f, type: 'loose-artifact' }));
}

function scanRecurringThemes() {
  const all = scanGitPain();
  const freq = {};
  for (const s of all) {
    const m = s.raw.match(/(boundary noise|契約測試|contract|vitest|flaky|timeout|race|concurrent|併發|ignore|還原)/i);
    if (m) freq[m[1].toLowerCase()] = (freq[m[1].toLowerCase()] || 0) + 1;
  }
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([k,v])=>({theme:k,count:v}));
}

export function observe() {
  const gitPain = scanGitPain();
  const untracked = scanUntracked();
  const themes = scanRecurringThemes();
  return {
    timestamp: new Date().toISOString(),
    signals: [...gitPain, ...untracked],
    recurringThemes: themes,
    summary: `觀測到 ${gitPain.length} 個 git 痛點, ${untracked.length} 個未追蹤檔, ${themes.length} 個高頻主題`,
  };
}

if (process.argv[1] && process.argv[1].includes('observe.mjs')) {
  const obs = observe();
  console.log('[evolution:observe] ' + obs.summary);
  console.log('  高頻主題:', obs.recurringThemes.map(t=>`${t.theme}(${t.count})`).join(', ') || '無');
  for (const s of obs.signals.slice(0,5)) console.log(`   - [${s.source}] ${s.raw}`);
}
