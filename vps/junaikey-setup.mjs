// vps/junaikey-setup.mjs
// ============================================================
// JunAikey 萬能元鑰 — NCB Table 設定驗證工具
// ============================================================
// 用途: 檢查 NCB project 內 JunAikey 所需的 4 個 tables 是否已建立。
//      若未建立,輸出每個 table 需建立的欄位規格,供 NCB Dashboard 手動建表。
//
// 4 個 JunAikey tables:
//   1. junaikey_skills    (主線 A: 永恆技能)
//   2. junaikey_memory    (主線 B: 共享記憶 append-only)
//   3. junaikey_progress  (主線 C: 當前進度 single-doc)
//   4. junaikey_journal   (審計日誌 best-effort)
//
// 用法:
//   node vps/junaikey-setup.mjs check         # 檢查並報告
//   node vps/junaikey-setup.mjs spec           # 輸出每個 table 的欄位規格 (JSON)
//   node vps/junaikey-setup.mjs spec-md        # 輸出 Markdown 格式 (貼 NCB Dashboard)
// ============================================================

import { promises as fs } from 'node:fs';
import path from 'node:path';

// ─── 載入環境變數 (同 junaikey.mjs 邏輯) ───
const envFile = process.env.JUNAKEY_ENV_FILE
  || path.join(process.cwd(), '.env.local');
try {
  const text = await fs.readFile(envFile, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*"?([^"\r]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch { /* .env.local optional */ }

const NCB_TOKEN = process.env.NCBDB_API_TOKEN
  || process.env.NCB_API_KEY
  || process.env.NEXT_PUBLIC_NCB_API_KEY
  || '';
const NCB_PROJECT = process.env.NCBDB_PROJECT_ID
  || process.env.NCB_PROJECT_ID
  || process.env.NCB_DB_INSTANCE
  || '';
const NCB_BASE = (process.env.NCBDB_BASE_URL
  || process.env.NCB_API_URL
  || process.env.NCB_API_ENDPOINT
  || 'https://api.nocodebackend.com'
  ).replace(/\/+$/, '');

const TABLES = {
  junaikey_skills: {
    desc: '永恆習得的技能 (主線 A)',
    columns: [
      { name: 'name',       type: 'VARCHAR(255)', required: true,  desc: '技能名稱 (唯一識別)' },
      { name: 'body',       type: 'TEXT',         required: true,  desc: '技能本體 (markdown)' },
      { name: 'traits',     type: 'JSON',         required: false, desc: '標籤陣列,如 ["永恆","被動"]' },
      { name: 'updatedAt',  type: 'DATETIME',     required: true,  desc: '最後更新時間 (ISO 8601)' },
    ],
  },
  junaikey_memory: {
    desc: '共享記憶 (主線 B, append-only)',
    columns: [
      { name: 'ts',           type: 'DATETIME', required: true,  desc: '事件時間 (ISO 8601)' },
      { name: 'event',        type: 'VARCHAR(64)', required: true, desc: '事件名稱 (awaken/reflect/remember)' },
      { name: 'summary',      type: 'TEXT',      required: false, desc: '事件摘要' },
      { name: 'grownSkills',  type: 'JSON',      required: false, desc: '本次 reflect grow 的 skills' },
      { name: 'tags',         type: 'JSON',      required: false, desc: '標籤陣列,用於 query --tag=' },
    ],
  },
  junaikey_progress: {
    desc: '當前進度 (主線 C, single-doc 取代式)',
    columns: [
      { name: 'active',     type: 'TEXT',     required: true,  desc: '當前進行中的任務' },
      { name: 'notes',      type: 'TEXT',     required: false, desc: '補充註記' },
      { name: 'updatedAt',  type: 'DATETIME', required: true,  desc: '最後更新時間' },
    ],
  },
  junaikey_journal: {
    desc: '審計日誌 (best-effort, awakened/reflect 觸發記錄)',
    columns: [
      { name: 'ts',       type: 'DATETIME',    required: true,  desc: '事件時間' },
      { name: 'kind',     type: 'VARCHAR(32)', required: true,  desc: 'awaken / reflect / grow' },
      { name: 'summary',  type: 'TEXT',        required: false, desc: '事件摘要' },
      { name: 'backend',  type: 'VARCHAR(16)', required: false, desc: 'ncb / local' },
    ],
  },
};

async function checkTable(name) {
  try {
    const r = await fetch(`${NCB_BASE}/read/${name}?instance=${encodeURIComponent(NCB_PROJECT)}&page=1&limit=1`, {
      headers: { 'Authorization': `Bearer ${NCB_TOKEN}`, 'Accept': 'application/json' },
    });
    const txt = await r.text();
    if (r.ok) return { exists: true, status: r.status, body: JSON.parse(txt).data?.length || 0 };
    if (r.status === 500 && txt.includes("doesn't exist")) return { exists: false, status: 500 };
    return { exists: false, status: r.status, error: txt.slice(0, 200) };
  } catch (e) {
    return { exists: false, error: e.message };
  }
}

function specMarkdown() {
  const lines = [
    '# JunAikey 萬能元鑰 — NCB Dashboard 設定指南',
    '',
    '> Project: `' + (NCB_PROJECT || '(unset NCBDB_PROJECT_ID)') + '`',
    '> Base: `' + NCB_BASE + '`',
    '',
    '請在 NCB Dashboard 對上述 project 建立以下 4 個 tables:',
    '',
  ];
  for (const [tname, tdef] of Object.entries(TABLES)) {
    lines.push(`## ${tname}`);
    lines.push('');
    lines.push(`**${tdef.desc}**`);
    lines.push('');
    lines.push('| Column | Type | Required | 說明 |');
    lines.push('|---|---|---|---|');
    for (const c of tdef.columns) {
      lines.push(`| \`${c.name}\` | ${c.type} | ${c.required ? '✅' : '—'} | ${c.desc} |`);
    }
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push('建好後執行: `node vps/junaikey-setup.mjs check` 確認所有 tables 存在。');
  return lines.join('\n');
}

function specJson() {
  return JSON.stringify({
    project: NCB_PROJECT,
    base: NCB_BASE,
    tables: TABLES,
  }, null, 2);
}

const [, , cmd] = process.argv;

if (cmd === 'check') {
  if (!NCB_TOKEN || !NCB_PROJECT) {
    console.error('NCB_TOKEN or NCB_PROJECT missing. 請設定 .env.local 的 NCBDB_* 變數。');
    process.exit(1);
  }
  console.log(`Checking project: ${NCB_PROJECT}`);
  console.log(`Base: ${NCB_BASE}\n`);
  let allOk = true;
  for (const tname of Object.keys(TABLES)) {
    const r = await checkTable(tname);
    if (r.exists) {
      console.log(`  ✅ ${tname.padEnd(20)} exists (${r.body} record${r.body === 1 ? '' : 's'})`);
    } else {
      allOk = false;
      console.log(`  ❌ ${tname.padEnd(20)} MISSING (${r.status || r.error})`);
    }
  }
  console.log();
  if (allOk) {
    console.log('🎉 All 4 JunAikey tables exist. junaikey.mjs NCB backend ready.');
  } else {
    console.log('⚠️  Missing tables. 請在 NCB Dashboard 建立,或執行:');
    console.log('   node vps/junaikey-setup.mjs spec-md > junaikey-ncb-spec.md');
  }
  process.exit(allOk ? 0 : 1);
} else if (cmd === 'spec') {
  console.log(specJson());
} else if (cmd === 'spec-md') {
  console.log(specMarkdown());
} else {
  console.log('Usage:');
  console.log('  node vps/junaikey-setup.mjs check     # 檢查並報告');
  console.log('  node vps/junaikey-setup.mjs spec      # 輸出 JSON 規格');
  console.log('  node vps/junaikey-setup.mjs spec-md   # 輸出 Markdown 規格');
}
