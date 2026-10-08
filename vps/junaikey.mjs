// vps/junaikey.mjs
// ============================================================
// 🔑 JunAikey 萬能元鑰 — Agent Growth Layer (代理成長層) + 萬能永憶
// ============================================================
// Hierarchy (highest → lower):
//   L0  JunAikey 萬能元鑰 / 萬能永憶 — agent growth: 永恆習得 / 共享記憶 / 閉環
//   L1  OmniKey                       — supreme credential authority
//   L2  OmniMasterKey                 — vault-management key
//   L3  SUMMON_LAYERS L2-L5           — 標籤 → 同步 → 共鳴 → 糾纏
//
// 雙後端 (NCBDB primary / local fallback), 自動選擇 (JUNAKEY_BACKEND=auto)
// 純 ESM 模組, 零外部依賴; Node 18+ 即可
// ============================================================
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { MANTRA, SKILL_TRAITS, NCB_TABLES, DEFAULT_MEMORY_RETENTION } from './junaikey/schema.mjs';
import { createLocalBackend } from './junaikey/backends/local.mjs';
import { createNcbBackend } from './junaikey/backends/ncb.mjs';
import { createDispatcher } from './junaikey/dispatcher.mjs';
import { createOperations } from './junaikey/operations.mjs';

// ── CONFIG ──────────────────────────────────────────────────
const JUNAKEY_HOME = process.env.JUNAKEY_HOME
  || path.join(os.homedir(), '.junaikey');
const JUNAKEY_BACKEND = (process.env.JUNAKEY_BACKEND || 'auto').toLowerCase();

const PATHS = {
  home: JUNAKEY_HOME,
  skills: path.join(JUNAKEY_HOME, 'skills.md'),
  memory: path.join(JUNAKEY_HOME, 'memory.jsonl'),
  progress: path.join(JUNAKEY_HOME, 'progress.md'),
  journal: path.join(JUNAKEY_HOME, 'journal.jsonl'),
};

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
  || process.env.NEXT_PUBLIC_NCB_API_URL
  || 'https://api.nocodebackend.com'
  ).replace(/\/+$/, '');

// ── BACKENDS + OPERATIONS ───────────────────────────────────
const localBackend = createLocalBackend(JUNAKEY_HOME, PATHS);
const ncbBackend = createNcbBackend({ base: NCB_BASE, token: NCB_TOKEN, project: NCB_PROJECT });

const dispatcher = createDispatcher({ localBackend, ncbBackend, NCB_TOKEN, NCB_PROJECT, JUNAKEY_BACKEND });
const ops = createOperations({ dispatcher, NCB_BASE, NCB_PROJECT, JUNAKEY_HOME });

// ── PUBLIC OBJECT ───────────────────────────────────────────
const JunAikey = {
  JUNAKEY_HOME, JUNAKEY_BACKEND, PATHS,
  MANTRA, SKILL_TRAITS, NCB_TABLES, DEFAULT_MEMORY_RETENTION,
  localBackend, ncbBackend,
  selectBackend: () => dispatcher.select(),
  resetBackendCache: () => dispatcher.resetCache(),
  ...ops,
};

// Re-export operations 給 import
const { awaken, loadSkills, growSkill, recallSkill, forgetSkill, dedupSkills, remember, recall, searchMemory, pruneMemory, setProgress, getProgress, reflect, tagSkill, untagSkill, tagMemories, listTags, findByTag, validateTag, checkTagConflicts } = ops;

export {
  JunAikey, JUNAKEY_HOME, JUNAKEY_BACKEND, PATHS,
  MANTRA, SKILL_TRAITS, NCB_TABLES, DEFAULT_MEMORY_RETENTION,
  localBackend, ncbBackend,
  awaken, loadSkills, growSkill, recallSkill, forgetSkill, dedupSkills,
  remember, recall, searchMemory, pruneMemory,
  setProgress, getProgress, reflect,
  tagSkill, untagSkill, tagMemories, listTags, findByTag, validateTag, checkTagConflicts,
};
export default JunAikey;

// ── CLI ─────────────────────────────────────────────────────
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  const [, , cmd, ...rest] = process.argv;
  const usage = `Usage:
  node vps/junaikey.mjs awaken
  node vps/junaikey.mjs grow <name> <body...> [--traits=trait1,trait2]
  node vps/junaikey.mjs recall <name>
  node vps/junaikey.mjs forget <name>
  node vps/junaikey.mjs dedup
  node vps/junaikey.mjs remember '<json-event>'
  node vps/junaikey.mjs query [--tag=X] [--event=X] [--limit=N] [--contains=needle]
  node vps/junaikey.mjs search <query>             # NCB /search 端點
  node vps/junaikey.mjs progress "<active-task>" ["<notes>"]
  node vps/junaikey.mjs get-progress
  node vps/junaikey.mjs reflect "<summary>" [--learn=name1,name2]
  node vps/junaikey.mjs prune [--max=1000] [--before=2026-10-01] [--keep-event=awaken]
  node vps/junaikey.mjs tag <skill-name> <tag1,tag2,...>      # OmniTag 加到 skill
  node vps/junaikey.mjs untag <skill-name> <tag>               # 移除 skill tag
  node vps/junaikey.mjs tag-mem [--event=X] <tag1,tag2,...>    # 批次加 tag 到 memories
  node vps/junaikey.mjs tags [--type=skills|memory|all] [--query=PATTERN]  # 列出所有 tags
  node vps/junaikey.mjs find <tag>                             # 找帶此 tag 的 items
  node vps/junaikey.mjs validate-tag <tag>                     # 驗證 OmniTag 格式
  node vps/junaikey.mjs home
  node vps/junaikey.mjs backend
  node vps/junaikey.mjs doctor`;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const run = async () => {
    switch (cmd) {
      case 'awaken': return ops.awaken();
      case 'grow': {
        const name = rest[0];
        if (!name) { console.log(usage); process.exit(1); }
        const ti = rest.findIndex(a => a.startsWith('--traits='));
        const traits = ti >= 0 ? rest[ti].slice('--traits='.length).split(',') : ['永恆'];
        const body = rest.slice(1, ti >= 0 ? ti : undefined).join(' ');
        const rec = await ops.growSkill(name, body, traits);
        console.log(JSON.stringify(rec, null, 2));
        break;
      }
      case 'recall': {
        const name = rest[0];
        if (!name) { console.log(usage); process.exit(1); }
        const rec = await ops.recallSkill(name);
        console.log(rec ? JSON.stringify(rec, null, 2) : '(not found)');
        break;
      }
      case 'forget': {
        const name = rest[0];
        if (!name) { console.log(usage); process.exit(1); }
        const ok = await ops.forgetSkill(name);
        console.log(ok ? `✓ ${name} forgotten` : `${name} not found`);
        break;
      }
      case 'dedup': {
        const removed = await ops.dedupSkills();
        console.log(`✓ dedup removed ${removed} duplicate(s)`);
        break;
      }
      case 'remember': {
        const raw = rest.join(' ');
        if (!raw) { console.log(usage); process.exit(1); }
        let ev; try { ev = JSON.parse(raw); } catch { ev = { event: raw }; }
        const e = await ops.remember(ev);
        console.log(JSON.stringify(e, null, 2));
        break;
      }
      case 'query': {
        const opts = {};
        for (const a of rest) {
          if (a.startsWith('--tag=')) opts.tag = a.slice(5);
          else if (a.startsWith('--event=')) opts.event = a.slice(8);
          else if (a.startsWith('--limit=')) opts.limit = a.slice(8);
          else if (a.startsWith('--contains=')) opts.contains = a.slice(11);
        }
        const out = await ops.recall(opts);
        console.log(JSON.stringify(out, null, 2));
        break;
      }
      case 'search': {
        const opts = {};
        for (const a of rest) {
          if (a.startsWith('--tag=')) opts.tag = a.slice(5);
          else if (a.startsWith('--event=')) opts.event = a.slice(8);
          else if (a.startsWith('--limit=')) opts.limit = a.slice(8);
        }
        const out = await ops.searchMemory(opts);
        console.log(JSON.stringify(out, null, 2));
        break;
      }
      case 'progress': {
        const active = rest[0] || '';
        const notes = rest.slice(1).join(' ') || '';
        const r = await ops.setProgress(active, notes);
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case 'get-progress': {
        const p = await ops.getProgress();
        console.log(p || '(no progress set yet)');
        break;
      }
      case 'reflect': {
        const summary = rest[0];
        if (!summary) { console.log(usage); process.exit(1); }
        const li = rest.findIndex(a => a.startsWith('--learn='));
        const learnings = li >= 0 ? rest[li].slice('--learn='.length).split(',').filter(Boolean) : [];
        const e = await ops.reflect(summary, learnings);
        console.log(JSON.stringify(e, null, 2));
        break;
      }
      case 'prune': {
        const opts = {};
        for (const a of rest) {
          if (a.startsWith('--max=')) opts.maxRecords = parseInt(a.slice(5), 10);
          else if (a.startsWith('--before=')) opts.before = a.slice(9);
          else if (a.startsWith('--keep-event=')) opts.keepEvent = a.slice(13);
        }
        const removed = await ops.pruneMemory(opts);
        console.log(`✓ pruned ${removed} record(s)`);
        break;
      }
      case 'home': return console.log(JUNAKEY_HOME);
      case 'backend': {
        const be = await dispatcher.select();
        console.log(JSON.stringify({
          selected: be.name,
          ncbConfigured: !!NCB_TOKEN && !!NCB_PROJECT,
          ncbBase: NCB_BASE, ncbProject: NCB_PROJECT,
          ncbTables: NCB_TABLES,
          ncbLastError: ncbBackend.lastError,
          localHome: JUNAKEY_HOME,
        }, null, 2));
        break;
      }
      case 'doctor': {
        const out = {
          env: { JUNAKEY_HOME, JUNAKEY_BACKEND, NCB_TOKEN_set: !!NCB_TOKEN, NCB_PROJECT: NCB_PROJECT || '(unset)', NCB_BASE },
          backends: { local: 'available', ncb: 'pending' },
        };
        out.backends.ncb = (await ncbBackend.health?.()) ? 'healthy' : `unhealthy (${ncbBackend.lastError || 'no token'})`;
        out.activeBackend = (await dispatcher.select()).name;
        console.log(JSON.stringify(out, null, 2));
        break;
      }
      case 'tag': {
        const name = rest[0];
        const tags = rest.slice(1).join('').split(',').map(t => t.trim()).filter(Boolean);
        if (!name || !tags.length) { console.log(usage); process.exit(1); }
        // 衝突檢查
        const conflicts = ops.checkTagConflicts(tags);
        if (conflicts.length > 0) {
          console.log('⚠️ tag 衝突:');
          for (const c of conflicts) console.log(`  ${c.tags.join(' + ')} → ${c.reason}`);
        }
        const rec = await ops.tagSkill(name, tags);
        console.log(rec ? `✓ ${name} 標籤: ${rec.traits.join(', ')}` : `✗ skill "${name}" not found`);
        break;
      }
      case 'untag': {
        const name = rest[0];
        const tag = rest[1];
        if (!name || !tag) { console.log(usage); process.exit(1); }
        const ok = await ops.untagSkill(name, tag);
        console.log(ok ? `✓ ${name} 移除 ${tag}` : `✗ ${name} 沒有此 tag 或不存在`);
        break;
      }
      case 'tag-mem': {
        const ti = rest.findIndex(a => a.startsWith('--event='));
        const event = ti >= 0 ? rest[ti].slice(8) : null;
        const tags = rest.filter((_, i) => i !== ti).join('').split(',').map(t => t.trim()).filter(Boolean);
        if (!tags.length) { console.log(usage); process.exit(1); }
        const filter = event ? { event } : {};
        const n = await ops.tagMemories(filter, tags);
        console.log(`✓ tagged ${n} memory(ies) with [${tags.join(', ')}]`);
        break;
      }
      case 'tags': {
        const opts = {};
        for (const a of rest) {
          if (a.startsWith('--type=')) opts.type = a.slice(7);
          else if (a.startsWith('--query=')) opts.query = a.slice(8);
        }
        const list = await ops.listTags(opts);
        console.log(JSON.stringify(list, null, 2));
        break;
      }
      case 'find': {
        const tag = rest[0];
        if (!tag) { console.log(usage); process.exit(1); }
        const r = await ops.findByTag(tag);
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case 'validate-tag': {
        const tag = rest[0];
        if (!tag) { console.log(usage); process.exit(1); }
        console.log(JSON.stringify(ops.validateTag(tag), null, 2));
        break;
      }
      default: console.log(usage); process.exit(cmd ? 1 : 0);
    }
  };

  run().catch(e => { console.error(`[JunAikey] error: ${e.message}`); process.exit(2); });
}
