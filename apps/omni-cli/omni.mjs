#!/usr/bin/env node
// OmniCLI — esggo 統一命令行入口
// 零外部依賴：node 原生 fetch + child_process
// 對齊 OA-Team 萬能分身操作（status / health / 5t / branches）
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);
const API = process.env.OMNI_API || 'http://127.0.0.1:8789';
const REPO = process.env.ESGRO_REPO || 'C:/Project/esggo';

const HELP = `OmniCLI — esggo 統一命令行入口

用法:
  omni health               Ping OmniAPI 健康檢查
  omni status               顯示本機 repo 狀態（分支 / 5T 數）
  omni 5t                   顯示 5T 協定結構
  omni branches             列出所有 git 分支
  omni help                 顯示本說明

環境變數:
  OMNI_API     OmniAPI 基址 (預設 http://127.0.0.1:8789)
  ESGRO_REPO   esggo 倉庫路徑 (預設 C:/Project/esggo)
`;

async function git(args) {
  try {
    const { stdout } = await execFileP('git', args, { cwd: REPO, timeout: 8000 });
    return stdout.trim();
  } catch {
    return '';
  }
}

async function getJSON(path) {
  const r = await fetch(API + path);
  return r.json();
}

async function main() {
  const cmd = process.argv[2] || 'help';

  switch (cmd) {
    case 'health': {
      const d = await getJSON('/health');
      console.log('OmniAPI health:', JSON.stringify(d));
      break;
    }
    case 'status': {
      const branch = await git(['branch', '--show-current']);
      const d = await getJSON('/api/status').catch(() => null);
      console.log('repo   :', REPO);
      console.log('branch :', branch || 'unknown');
      console.log('5T items:', d?.fiveT ?? '(api 離線)');
      break;
    }
    case '5t': {
      const d = await getJSON('/api/5t');
      console.log('5T 協定:');
      for (const [k, v] of Object.entries(d.items)) console.log(`  ${k}: ${v}`);
      break;
    }
    case 'branches': {
      const d = await getJSON('/api/branches');
      console.log('branches:');
      d.branches.forEach((b) => console.log('  ' + b));
      break;
    }
    case 'help':
    default:
      console.log(HELP);
  }
}

main().catch((e) => {
  console.error('omni error:', e.message);
  process.exit(1);
});
