// vps/junaikey.mjs
// ============================================================
// 🔑 JunAikey 萬能元鑰 — Agent Growth Layer (代理成長層) + 萬能永憶
// ============================================================
//
// Layered ON TOP of OmniKey (萬能元鑰) / OmniMasterKey (萬能鑰匙).
// Hierarchy (highest → lower):
//   L0  JunAikey 萬能元鑰 / 萬能永憶  — agent growth: 永恆習得 / 共享記憶 / 閉環
//   L1  OmniKey                       — supreme credential authority
//   L2  OmniMasterKey                 — vault-management key
//   L3  SUMMON_LAYERS L2-L5           — 標籤 → 同步 → 共鳴 → 糾纏
//
// 4 core capabilities (對應使用者定義):
//   1. 技能習得成長     (skill acquisition growth — 主線 A: skills)
//   2. 永恆習得技能     (eternal skill registry across sessions)
//   3. 被動自主恆久共享記憶 (passive autonomous persistent shared memory — 主線 B: memory)
//   4. 全自動閉環       (closed loop: awaken → act → reflect → next awaken 自動載入)
//
// 三個恆常層 (永恆/被動/自主) × 三條主線 (技能/記憶/進度) × 一個閉環
// 雙後端架構 (NCB primary / local fallback):
//   - NCB  (NoCodeBackend): 所有代理共用同一份,跨主機/容器一致
//   - local (~/.junaikey/): NCB 不可達時自動降級;單機仍可運作
// 選擇策略: JUNAKEY_BACKEND=ncb|local|auto (default: auto)
//
// 跨代理 / hermes 兼容: 純 ESM,零外部依賴,任何 Node 18+ 環境皆可 import
//
// 5T Trustworthy:
//   - 不寫入 secrets / credentials (那是 OmniKey 的職責)
//   - NCB 連線失敗時不拋出,降級到 local 並 emit 警告
//   - 不阻塞代理主流程 (append-only, idempotent)
//   - 可審計 (journal.jsonl 記錄每次 awaken/reflect,標記 backend)
// ============================================================

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ──────────────────────────────────────────────────────────────
// 0. CONFIG — JUNAKEY_HOME + Backend 選擇
// ──────────────────────────────────────────────────────────────
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

const SKILL_TRAITS = ['永恆', '被動', '自主', '共享', '閉環', '圓通'];
const MANTRA = '無作妙德。圓通無礙';

// NCB env: 對齊 .env.local (NCBDB_* 為當前可用前綴)
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
const NCB_TABLES = {
  skills: process.env.NCBDB_TABLE_SKILLS || 'junaikey_skills',
  memory: process.env.NCBDB_TABLE_MEMORY || 'junaikey_memory',
  progress: process.env.NCBDB_TABLE_PROGRESS || 'junaikey_progress',
  journal: process.env.NCBDB_TABLE_JOURNAL || 'junaikey_journal',
};

let _skillsCache = null;
let _skillsCacheMtime = 0;
let _activeBackend = null;        // 'ncb' | 'local'
let _ncbAvailable = null;         // 快取 NCB 健康狀態

// ──────────────────────────────────────────────────────────────
// 1. BACKEND — Local (filesystem) implementation
// ──────────────────────────────────────────────────────────────
const localBackend = {
  name: 'local',

  async init() {
    await fs.mkdir(PATHS.home, { recursive: true });
  },

  async readSkills() {
    let text = '';
    try { text = await fs.readFile(PATHS.skills, 'utf8'); }
    catch (e) { if (e.code === 'ENOENT') return []; throw e; }
    const skills = [];
    const parts = text.split(/^##\s+/m);
    for (const p of parts.slice(1)) {
      const nl = p.indexOf('\n');
      if (nl < 0) continue;
      const head = p.slice(0, nl).trim();
      const body = p.slice(nl + 1).replace(/\n+$/g, '').trim();
      const tm = head.match(/\[(.+?)\]\s*$/);
      const name = tm ? head.slice(0, tm.index).trim() : head;
      const traits = tm
        ? tm[1].split('|').map(t => t.trim()).filter(t => SKILL_TRAITS.includes(t))
        : [];
      if (name) skills.push({ name, traits, body });
    }
    return skills;
  },

  async writeSkills(skills) {
    const header = [
      '# JunAikey 萬能元鑰 — Skills Registry',
      '',
      '> 永恆習得的技能清單。每次代理 awaken() 時被動載入。',
      `> traits: ${SKILL_TRAITS.join(' / ')}`,
      `> MANTRA: ${MANTRA}`,
      '',
    ].join('\n');
    const body = skills.map(s => {
      const t = s.traits && s.traits.length ? ` [${s.traits.join('|')}]` : '';
      return `## ${s.name}${t}\n\n${s.body}\n`;
    }).join('\n');
    await this.init();
    await fs.writeFile(PATHS.skills, header + body, 'utf8');
  },

  async readMemory(filter = {}) {
    let text = '';
    try { text = await fs.readFile(PATHS.memory, 'utf8'); }
    catch (e) { if (e.code === 'ENOENT') return []; throw e; }
    const entries = [];
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try { entries.push(JSON.parse(line)); } catch { /* skip */ }
    }
    return _filterEntries(entries, filter);
  },

  async appendMemory(entry) {
    await this.init();
    await fs.appendFile(PATHS.memory, JSON.stringify(entry) + '\n', 'utf8');
    return entry;
  },

  async readProgress() {
    try { return await fs.readFile(PATHS.progress, 'utf8'); }
    catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  },

  async writeProgress(content) {
    await this.init();
    await fs.writeFile(PATHS.progress, content, 'utf8');
  },

  async appendJournal(entry) {
    await this.init();
    await fs.appendFile(PATHS.journal, JSON.stringify(entry) + '\n', 'utf8');
  },
};

// ──────────────────────────────────────────────────────────────
// 2. BACKEND — NCB (NoCodeBackend V2) implementation
// ──────────────────────────────────────────────────────────────
// NCB V2 endpoint pattern (per official Swagger):
//   POST   /create/{table}?instance={project}     — create record
//   GET    /read/{table}?instance={project}       — list (paginated)
//   GET    /read/{table}/{id}?instance={project}  — read by id
//   POST   /search/{table}?instance={project}     — search (body: filters)
//   PUT    /update/{table}/{id}?instance={project} — update by id
//   DELETE /delete/{table}/{id}?instance={project} — delete by id
//   POST   /bulk/create/{table}?instance={project} — bulk insert (max 500)
// Auth: Authorization: Bearer <secret_key>
// Response: { status: 'success'|'failed', data, error?, metadata: { page, limit, hasMore, hasPrev } }
// ──────────────────────────────────────────────────────────────
const ncbBackend = {
  name: 'ncb',

  async _req(path, opts = {}) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${NCB_BASE}${path}${sep}instance=${encodeURIComponent(NCB_PROJECT)}`;
    const r = await fetch(url, {
      ...opts,
      headers: {
        'Authorization': `Bearer ${NCB_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(opts.headers || {}),
      },
    });
    const txt = await r.text();
    let body;
    try { body = JSON.parse(txt); } catch { body = { status: 'failed', error: txt.slice(0, 200) }; }
    if (!r.ok || (body && body.status === 'failed')) {
      const msg = body?.error || `HTTP ${r.status}`;
      throw new Error(`NCB ${opts.method || 'GET'} ${url} → ${r.status} ${msg}`);
    }
    return body;
  },

  // NCB (MySQL) 期望 DATETIME 格式 'YYYY-MM-DD HH:MM:SS',非 ISO 8601
  // 同時遞迴處理巢狀物件/陣列,確保所有 datetime 欄位都轉好
  _toNCB(obj) {
    if (obj == null) return obj;
    if (Array.isArray(obj)) return obj.map(v => this._toNCB(v));
    if (typeof obj === 'string') {
      // 看起來像 ISO 8601 的就轉
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
        return obj.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
      }
      return obj;
    }
    if (typeof obj === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(obj)) out[k] = this._toNCB(v);
      return out;
    }
    return obj;
  },

  // NCB 把 JSON 欄位回傳成 string (e.g. '["永恆","被動"]'),需 parse
  _parseJSONField(v) {
    if (v == null) return v;
    if (Array.isArray(v) || typeof v === 'object') return v;
    if (typeof v === 'string') {
      const s = v.trim();
      if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
        try { return JSON.parse(s); } catch { return v; }
      }
    }
    return v;
  },

  async _listAll(table, { page = 1, limit = 500 } = {}) {
    const all = [];
    let p = page;
    while (true) {
      const r = await this._req(`/read/${table}?page=${p}&limit=${limit}`);
      const data = r.data || [];
      all.push(...data);
      if (!r.metadata?.hasMore) break;
      p++;
      if (p > 100) break; // safety: 100 pages × 500 = 50k records cap
    }
    return all;
  },

  async _insert(table, doc) {
    const r = await this._req(`/create/${table}`, { method: 'POST', body: JSON.stringify(this._toNCB(doc)) });
    return r.data;
  },

  async _bulkCreate(table, docs) {
    if (!docs.length) return [];
    // bulk in chunks of 500; NCB 期望 body 為 { records: [...] }
    const out = [];
    for (let i = 0; i < docs.length; i += 500) {
      const chunk = docs.slice(i, i + 500);
      const r = await this._req(`/bulk/create/${table}`, { method: 'POST', body: JSON.stringify({ records: this._toNCB(chunk) }) });
      out.push(...(Array.isArray(r.data) ? r.data : [r.data]));
    }
    return out;
  },

  async _deleteById(table, id) {
    return await this._req(`/delete/${table}/${id}`, { method: 'DELETE' });
  },

  async _updateById(table, id, fields) {
    return await this._req(`/update/${table}/${id}`, { method: 'PUT', body: JSON.stringify(this._toNCB(fields)) });
  },

  async _deleteAll(table) {
    const rows = await this._listAll(table, { limit: 500 });
    for (const r of rows) {
      const id = r.id;
      if (!id) continue;
      try { await this._deleteById(table, id); } catch { /* best-effort */ }
    }
  },

  async health() {
    if (!NCB_TOKEN || !NCB_PROJECT) {
      _ncbLastError = 'NCB_TOKEN or NCB_PROJECT missing';
      return false;
    }
    try {
      // /read/{table} 不存在的 table 會 500,但 token+instance 仍驗證通過;
      // 用 "name_1" 這個 NCB 預設 template table 來探活 (任何 project 都內建)
      await this._req('/read/name_1?page=1&limit=1');
      return true;
    } catch (e) {
      _ncbLastError = e.message;
      return false;
    }
  },

  async init() { /* tables created via NCB Dashboard */ },

  async readSkills() {
    let rows;
    try { rows = await this._listAll(NCB_TABLES.skills); }
    catch (e) { if (e.message.includes("doesn't exist")) return []; throw e; }
    return rows.map(r => {
      const traits = this._parseJSONField(r.traits);
      return {
        name: r.name,
        body: r.body || '',
        traits: Array.isArray(traits) ? traits.filter(t => SKILL_TRAITS.includes(t)) : [],
        updatedAt: r.updatedat || r.updatedAt || r.createdAt,
        _ncbId: r.id,
      };
    }).filter(s => s.name);
  },

  async writeSkills(skills) {
    // 取代式: 先刪除現有 skills,再 bulk insert 新集合
    try { await this._deleteAll(NCB_TABLES.skills); } catch { /* ignore if table doesn't exist yet */ }
    if (!skills.length) return;
    try {
      await this._bulkCreate(NCB_TABLES.skills, skills.map(s => ({
        name: s.name, body: s.body, traits: s.traits, updatedAt: s.updatedAt || new Date().toISOString(),
      })));
    } catch (e) { if (!e.message.includes("doesn't exist")) throw e; }
  },

  async readMemory(filter = {}) {
    let rows;
    try { rows = await this._listAll(NCB_TABLES.memory); }
    catch (e) { if (e.message.includes("doesn't exist")) return []; throw e; }
    const entries = rows.map(r => {
      const { id, createdAt, ...rest } = r;
      // NCB 回傳的 JSON 欄位是 string,需 parse
      if (rest.tags) rest.tags = this._parseJSONField(rest.tags);
      if (rest.grownSkills) rest.grownSkills = this._parseJSONField(rest.grownSkills);
      return { ts: r.ts || createdAt || new Date().toISOString(), ...rest };
    });
    return _filterEntries(entries, filter);
  },

  async appendMemory(entry) {
    try { return await this._insert(NCB_TABLES.memory, entry); }
    catch (e) { if (e.message.includes("doesn't exist")) return null; throw e; }
  },

  async readProgress() {
    let rows;
    try { rows = await this._listAll(NCB_TABLES.progress); }
    catch (e) { if (e.message.includes("doesn't exist")) return null; throw e; }
    if (!rows.length) return null;
    // 依 updatedAt 取最新一筆
    const sorted = [...rows].sort((a, b) => (a.updatedAt || '').localeCompare(b.updatedAt || ''));
    const r = sorted[sorted.length - 1];
    return [
      `# JunAikey 萬能元鑰 — Current Progress (NCB)`,
      '',
      `> Last updated: ${r.updatedAt}`,
      `> MANTRA: ${MANTRA}`,
      '',
      '## Active',
      '',
      r.active || '(none)',
      '',
      '## Notes',
      '',
      r.notes || '(none)',
      '',
    ].join('\n');
  },

  async writeProgress(content) {
    const active = (content.match(/##\s*Active\s*\n+([\s\S]*?)(?=\n##|\Z)/) || [])[1]?.trim() || '';
    const notes = (content.match(/##\s*Notes\s*\n+([\s\S]*?)(?=\n##|\Z)/) || [])[1]?.trim() || '';
    const payload = { active, notes, updatedAt: new Date().toISOString() };
    let rows;
    try { rows = await this._listAll(NCB_TABLES.progress); }
    catch (e) { if (e.message.includes("doesn't exist")) rows = []; else throw e; }
    if (rows.length) {
      // 取代式: 刪除全部再 insert 最新
      try { await this._deleteAll(NCB_TABLES.progress); } catch { /* ignore */ }
    }
    try { await this._insert(NCB_TABLES.progress, payload); }
    catch (e) { if (!e.message.includes("doesn't exist")) throw e; }
  },

  async appendJournal(entry) {
    try { await this._insert(NCB_TABLES.journal, entry); }
    catch { /* journal is best-effort */ }
  },
};

let _ncbLastError = null;

// ──────────────────────────────────────────────────────────────
// 3. BACKEND — Dispatcher (auto / explicit)
// ──────────────────────────────────────────────────────────────
async function _selectBackend() {
  if (_activeBackend) return _activeBackend;
  if (JUNAKEY_BACKEND === 'local') {
    _activeBackend = localBackend;
    return _activeBackend;
  }
  if (JUNAKEY_BACKEND === 'ncb') {
    if (await ncbBackend.health()) {
      _activeBackend = ncbBackend;
      return _activeBackend;
    }
    if (JUNAKEY_BACKEND === 'ncb') {
      throw new Error(`JUNAKEY_BACKEND=ncb but NCB unhealthy: ${_ncbLastError}`);
    }
  }
  // auto: try NCB first, fallback local
  if (NCB_TOKEN && NCB_PROJECT && (await ncbBackend.health())) {
    _activeBackend = ncbBackend;
  } else {
    _activeBackend = localBackend;
  }
  return _activeBackend;
}

async function _resetBackendCache() {
  _activeBackend = null;
  _ncbAvailable = null;
  _ncbLastError = null;
  _skillsCache = null;
  _skillsCacheMtime = 0;
}

function _filterEntries(entries, filter = {}) {
  let out = entries;
  if (filter.tag) out = out.filter(e => Array.isArray(e.tags) && e.tags.includes(filter.tag));
  if (filter.event) out = out.filter(e => e.event === filter.event);
  if (filter.since) out = out.filter(e => e.ts >= filter.since);
  if (filter.until) out = out.filter(e => e.ts <= filter.until);
  if (filter.contains) {
    const needle = String(filter.contains);
    out = out.filter(e => JSON.stringify(e).includes(needle));
  }
  if (filter.limit) out = out.slice(-Number(filter.limit));
  return out;
}

// ──────────────────────────────────────────────────────────────
// 4. PUBLIC API — 透過 backend 抽象,呼叫者無感
// ──────────────────────────────────────────────────────────────
async function loadSkills({ bypassCache = false } = {}) {
  if (!bypassCache && _skillsCache) return _skillsCache;
  const be = await _selectBackend();
  _skillsCache = await be.readSkills();
  return _skillsCache;
}

async function growSkill(name, body, traits = []) {
  if (!name || typeof name !== 'string') throw new TypeError('growSkill: name required');
  const cleanTraits = (Array.isArray(traits) ? traits : [traits])
    .filter(t => SKILL_TRAITS.includes(t));
  const be = await _selectBackend();
  const skills = await be.readSkills();
  const idx = skills.findIndex(s => s.name === name);
  const record = {
    name,
    body: String(body || '').trim(),
    traits: cleanTraits,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) skills[idx] = { ...skills[idx], ...record };
  else skills.push(record);
  await be.writeSkills(skills);
  _skillsCache = skills;
  return record;
}

async function recallSkill(name) {
  const skills = await loadSkills();
  return skills.find(s => s.name === name) || null;
}

async function remember(event) {
  const entry = { ts: new Date().toISOString(), ...(event && typeof event === 'object' ? event : { event }) };
  const be = await _selectBackend();
  const result = await be.appendMemory(entry);
  return { ...entry, _backend: be.name, _ncbResult: be.name === 'ncb' ? result : undefined };
}

async function recall(filter = {}) {
  const be = await _selectBackend();
  const entries = await be.readMemory(filter);
  return entries;
}

async function setProgress(active, notes = '') {
  const now = new Date().toISOString();
  const content = [
    '# JunAikey 萬能元鑰 — Current Progress',
    '',
    `> Last updated: ${now}`,
    `> MANTRA: ${MANTRA}`,
    '',
    '## Active',
    '',
    active || '(none)',
    '',
    '## Notes',
    '',
    notes || '(none)',
    '',
  ].join('\n');
  const be = await _selectBackend();
  await be.writeProgress(content);
  return { active, notes, ts: now, _backend: be.name };
}

async function getProgress() {
  const be = await _selectBackend();
  return await be.readProgress();
}

async function _journal(entry) {
  const e = { ts: new Date().toISOString(), ...entry };
  const be = await _selectBackend();
  try { await be.appendJournal(e); } catch { /* best-effort */ }
  return e;
}

async function awaken({ silent = false } = {}) {
  // 重置快取以反映其他代理可能已寫入
  _skillsCache = null;
  const be = await _selectBackend();
  const skills = await be.readSkills();
  const recent = await be.readMemory({ limit: 20 });
  const progress = await be.readProgress();
  const result = {
    awakenedAt: new Date().toISOString(),
    backend: be.name,
    home: be.name === 'local' ? JUNAKEY_HOME : `${NCB_BASE}/v1/projects/${NCB_PROJECT}`,
    ncbConfigured: !!NCB_TOKEN && !!NCB_PROJECT,
    skillsCount: skills.length,
    skills: skills.map(s => ({ name: s.name, traits: s.traits })),
    recentMemories: recent,
    progress,
    mantra: MANTRA,
  };
  // 寫 audit 事件:失敗僅警告,不拋出 (避免部分 table 缺欄位導致整個 awaken 失敗)
  try { await be.appendMemory({ event: 'awaken', skillsCount: skills.length, memories: recent.length, backend: be.name, ts: new Date().toISOString() }); }
  catch (e) { if (!silent) console.warn(`[JunAikey] memory audit write skipped: ${e.message.slice(0, 100)}`); }
  try { await _journal({ kind: 'awaken', skills: skills.length, memories: recent.length, backend: be.name }); }
  catch { /* journal best-effort */ }
  _skillsCache = skills;
  if (!silent) {
    console.log(`[JunAikey] awakened @ ${result.awakenedAt}`);
    console.log(`  backend      : ${be.name}${be.name === 'local' ? '' : ' (NCB shared)'}`);
    console.log(`  skills loaded: ${skills.length}`);
    console.log(`  recent mems  : ${recent.length}`);
    console.log(`  mantra       : ${MANTRA}`);
  }
  return result;
}

async function reflect(summary, learnings = [], tags = []) {
  const be = await _selectBackend();
  const grown = [];
  for (const l of learnings) {
    if (typeof l === 'string') {
      const rec = await growSkill(l, `# ${l}\n\nLearned at ${new Date().toISOString()}\n\n${summary || ''}`, ['永恆']);
      grown.push(rec.name);
    } else if (l && l.name) {
      const rec = await growSkill(l.name, l.body, l.traits || ['永恆']);
      grown.push(rec.name);
    }
  }
  const entry = await remember({ event: 'reflect', summary, grownSkills: grown, tags });
  await _journal({ kind: 'reflect', grown: grown.length, summary, backend: be.name });
  return entry;
}

// ──────────────────────────────────────────────────────────────
// 5. 公開物件 / exports
// ──────────────────────────────────────────────────────────────
const JunAikey = {
  JUNAKEY_HOME,
  JUNAKEY_BACKEND,
  PATHS,
  SKILL_TRAITS,
  MANTRA,
  NCB_TABLES,
  localBackend,
  ncbBackend,
  _selectBackend,
  _resetBackendCache,
  loadSkills,
  growSkill,
  recallSkill,
  remember,
  recall,
  setProgress,
  getProgress,
  awaken,
  reflect,
};

export {
  JunAikey,
  JUNAKEY_HOME,
  JUNAKEY_BACKEND,
  PATHS,
  SKILL_TRAITS,
  MANTRA,
  NCB_TABLES,
  localBackend,
  ncbBackend,
  _selectBackend as selectBackend,
  _resetBackendCache as resetBackendCache,
  loadSkills,
  growSkill,
  recallSkill,
  remember,
  recall,
  setProgress,
  getProgress,
  awaken,
  reflect,
};
export default JunAikey;

// ──────────────────────────────────────────────────────────────
// 6. CLI — 當直接執行此檔案時 (node vps/junaikey.mjs <cmd> ...)
// ──────────────────────────────────────────────────────────────
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  const [, , cmd, ...rest] = process.argv;
  const usage = `Usage:
  node vps/junaikey.mjs awaken
  node vps/junaikey.mjs grow <name> <body...> [--traits=trait1,trait2]
  node vps/junaikey.mjs recall <name>
  node vps/junaikey.mjs remember '<json-event>'
  node vps/junaikey.mjs query [--tag=X] [--event=X] [--limit=N] [--contains=needle]
  node vps/junaikey.mjs progress "<active-task>" ["<notes>"]
  node vps/junaikey.mjs reflect "<summary>" [--learn=name1,name2]
  node vps/junaikey.mjs home
  node vps/junaikey.mjs backend
  node vps/junaikey.mjs doctor
`;
  try {
    switch (cmd) {
      case 'awaken':
        await awaken();
        break;
      case 'grow': {
        const name = rest[0];
        if (!name) { console.log(usage); process.exit(1); }
        const ti = rest.findIndex(a => a.startsWith('--traits='));
        const traits = ti >= 0 ? rest[ti].slice('--traits='.length).split(',') : ['永恆'];
        const body = rest.slice(1, ti >= 0 ? ti : undefined).join(' ');
        const rec = await growSkill(name, body, traits);
        console.log(JSON.stringify(rec, null, 2));
        break;
      }
      case 'recall': {
        const name = rest[0];
        if (!name) { console.log(usage); process.exit(1); }
        const rec = await recallSkill(name);
        console.log(rec ? JSON.stringify(rec, null, 2) : '(not found)');
        break;
      }
      case 'remember': {
        const raw = rest.join(' ');
        if (!raw) { console.log(usage); process.exit(1); }
        let ev; try { ev = JSON.parse(raw); } catch { ev = { event: raw }; }
        const e = await remember(ev);
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
        const out = await recall(opts);
        console.log(JSON.stringify(out, null, 2));
        break;
      }
      case 'progress': {
        const active = rest[0] || '';
        const notes = rest.slice(1).join(' ') || '';
        const r = await setProgress(active, notes);
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case 'reflect': {
        const summary = rest[0];
        if (!summary) { console.log(usage); process.exit(1); }
        const li = rest.findIndex(a => a.startsWith('--learn='));
        const learnings = li >= 0 ? rest[li].slice('--learn='.length).split(',').filter(Boolean) : [];
        const e = await reflect(summary, learnings);
        console.log(JSON.stringify(e, null, 2));
        break;
      }
      case 'home':
        console.log(JUNAKEY_HOME);
        break;
      case 'backend':
        const be = await _selectBackend();
        console.log(JSON.stringify({
          selected: be.name,
          ncbConfigured: !!NCB_TOKEN && !!NCB_PROJECT,
          ncbBase: NCB_BASE,
          ncbProject: NCB_PROJECT,
          ncbTables: NCB_TABLES,
          ncbLastError: _ncbLastError,
          localHome: JUNAKEY_HOME,
        }, null, 2));
        break;
      case 'doctor': {
        const out = {
          env: {
            JUNAKEY_HOME,
            JUNAKEY_BACKEND,
            NCB_TOKEN_set: !!NCB_TOKEN,
            NCB_PROJECT: NCB_PROJECT || '(unset)',
            NCB_BASE,
          },
          backends: { local: 'available', ncb: 'pending' },
        };
        out.backends.ncb = (await ncbBackend.health()) ? 'healthy' : `unhealthy (${_ncbLastError || 'no token'})`;
        const be = await _selectBackend();
        out.activeBackend = be.name;
        console.log(JSON.stringify(out, null, 2));
        break;
      }
      default:
        console.log(usage);
        process.exit(cmd ? 1 : 0);
    }
  } catch (e) {
    console.error(`[JunAikey] error: ${e.message}`);
    process.exit(2);
  }
}
