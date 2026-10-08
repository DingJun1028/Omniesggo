// vps/junaikey/backends/ncb.mjs
// ============================================================
// NCB (NoCodeBackend V2) backend
// Endpoint pattern (per Swagger):
//   POST   /create/{table}?instance={project}      — create
//   GET    /read/{table}?instance={project}        — list (paginated)
//   GET    /read/{table}/{id}?instance={project}   — read by id
//   POST   /search/{table}?instance={project}      — search (body: filters)
//   PUT    /update/{table}/{id}?instance={project} — update by id
//   DELETE /delete/{table}/{id}?instance={project} — delete by id
//   POST   /bulk/create/{table}?instance={project} — bulk insert
// Auth: Authorization: Bearer <secret_key>
// Response: { status, data, error?, metadata: { page, limit, hasMore, hasPrev } }
// ============================================================
import { MANTRA, SKILL_TRAITS, NCB_TABLES, DEFAULT_NCB_LIST_LIMIT, DEFAULT_NCB_BULK_LIMIT, MAX_NCB_PAGES } from '../schema.mjs';
import { toNCBPayload, parseJSONField, filterEntries, parseProgress, withRetry } from '../util.mjs';

export function createNcbBackend({ base, token, project, tables = NCB_TABLES }) {
  if (!token || !project) {
    return {
      name: 'ncb',
      _configured: false,
      health: async () => false,
    };
  }

  const _state = { lastError: null };

  async function _req(path, opts = {}) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${base}${path}${sep}instance=${encodeURIComponent(project)}`;
    const r = await fetch(url, {
      ...opts,
      headers: {
        'Authorization': `Bearer ${token}`,
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
  }

  async function _listAll(table, { page = 1, limit = DEFAULT_NCB_LIST_LIMIT } = {}) {
    const all = [];
    let p = page;
    while (true) {
      const r = await _req(`/read/${table}?page=${p}&limit=${limit}`);
      const data = r.data || [];
      all.push(...data);
      if (!r.metadata?.hasMore) break;
      p++;
      if (p > MAX_NCB_PAGES) break;
    }
    return all;
  }

  // 帶 retry 讀取 (NCB V2 寫入後讀寫延遲 1-5s)
  async function _listAllWithRetry(table, opts = {}) {
    const maxRetries = opts.maxRetries || 4;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const rows = await _listAll(table, opts);
      if (rows.length > 0 || attempt === maxRetries - 1) return rows;
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  async function _bulkCreate(table, docs) {
    if (!docs.length) return [];
    const out = [];
    for (let i = 0; i < docs.length; i += DEFAULT_NCB_BULK_LIMIT) {
      const chunk = docs.slice(i, i + DEFAULT_NCB_BULK_LIMIT);
      const r = await _req(`/bulk/create/${table}`, {
        method: 'POST',
        body: JSON.stringify({ records: toNCBPayload(chunk) }),
      });
      out.push(...(Array.isArray(r.data) ? r.data : [r.data]));
    }
    return out;
  }

  async function _deleteById(table, id) {
    return await _req(`/delete/${table}/${id}`, { method: 'DELETE' });
  }

  async function _deleteAll(table) {
    const rows = await _listAll(table);
    for (const r of rows) {
      const id = r.id;
      if (!id) continue;
      try { await _deleteById(table, id); } catch { /* best-effort */ }
    }
    return rows.length;
  }

  async function _search(table, body = {}) {
    const r = await _req(`/search/${table}`, { method: 'POST', body: JSON.stringify(body) });
    return r.data || [];
  }

  return {
    name: 'ncb',
    _configured: true,
    get lastError() { return _state.lastError; },

    async health() {
      try {
        // 用 NCB 內建的 name_1 探活(任何 project 都有)
        await withRetry(() => _req('/read/name_1?page=1&limit=1'));
        return true;
      } catch (e) {
        _state.lastError = e.message;
        return false;
      }
    },

    async init() { /* tables created via NCB Dashboard */ },

    async readSkills() {
      let rows;
      try { rows = await _listAllWithRetry(tables.skills); }
      catch (e) { if (e.message.includes("doesn't exist")) return []; throw e; }
      return rows.map(r => {
        const traits = parseJSONField(r.traits);
        return {
          name: r.name,
          body: r.body || '',
          // 保留所有 traits (含 OmniTag 與 6 大 trait,不再過濾)
          traits: Array.isArray(traits) ? traits : [],
          updatedAt: r.updatedat || r.updatedAt || r.createdAt,
          _ncbId: r.id,
        };
      }).filter(s => s.name);
    },

    async writeSkills(skills) {
      // 取代式: 刪除現有 + bulk insert 新集合
      try { await _deleteAll(tables.skills); } catch { /* table may not exist yet */ }
      if (!skills.length) return;
      try {
        await _bulkCreate(tables.skills, skills.map(s => ({
          name: s.name, body: s.body, traits: s.traits, updatedat: s.updatedAt || new Date().toISOString(),
        })));
      } catch (e) { if (!e.message.includes("doesn't exist")) throw e; }
    },

    async forgetSkill(name) {
      let rows;
      try { rows = await _listAll(tables.skills); }
      catch (e) { if (e.message.includes("doesn't exist")) return false; throw e; }
      let removed = false;
      for (const r of rows) {
        if (r.name === name && r.id) {
          try { await _deleteById(tables.skills, r.id); removed = true; } catch {}
        }
      }
      return removed;
    },

    async dedupSkills() {
      // 移除同名重複,保留最新的 (updatedAt 最大)
      let rows;
      try { rows = await _listAll(tables.skills); }
      catch (e) { if (e.message.includes("doesn't exist")) return 0; throw e; }
      const byName = new Map();
      for (const r of rows) {
        const existing = byName.get(r.name);
        if (!existing || (r.updatedat || r.updatedAt || '') > (existing.updatedat || existing.updatedAt || '')) {
          byName.set(r.name, r);
        }
      }
      const keep = new Set([...byName.values()].map(r => r.id));
      let removed = 0;
      for (const r of rows) {
        if (!keep.has(r.id)) {
          try { await _deleteById(tables.skills, r.id); removed++; } catch {}
        }
      }
      return removed;
    },

    async readMemory(filter = {}) {
      // 有 event/tag 條件用 server-side search 減少傳輸;其餘用 listAll
      const useServerSideSearch = filter.event || filter.tag || filter.since || filter.until;
      let rows;
      try {
        rows = useServerSideSearch
          ? await _search(tables.memory, _buildSearchBody(filter))
          : await _listAll(tables.memory);
      } catch (e) { if (e.message.includes("doesn't exist")) return []; throw e; }
      const entries = rows.map(r => {
        const { id, createdAt, ...rest } = r;
        if (rest.tags) rest.tags = parseJSONField(rest.tags);
        if (rest.grownSkills) rest.grownSkills = parseJSONField(rest.grownSkills);
        return { ts: r.ts || createdAt || new Date().toISOString(), _ncbId: r.id, ...rest };
      });
      return filterEntries(entries, filter);
    },

    async searchMemory(filter = {}) {
      return this.readMemory(filter);
    },

    async appendMemory(entry) {
      try { return await _req(`/create/${tables.memory}`, { method: 'POST', body: JSON.stringify(toNCBPayload(entry)) }); }
      catch (e) { if (e.message.includes("doesn't exist")) return null; throw e; }
    },

    async tagMemories(filter, newTags) {
      // NCB 無 PATCH 端點;用 listAll + update each
      const all = await this.readMemory({ ...filter, limit: undefined });
      if (!all.length) return 0;
      let tagged = 0;
      for (const e of all) {
        const existing = Array.isArray(e.tags) ? e.tags : [];
        const merged = [...new Set([...existing, ...newTags])];
        if (merged.length > existing.length && e._ncbId) {
          try {
            await _req(`/update/${tables.memory}/${e._ncbId}`, { method: 'PUT', body: JSON.stringify({ tags: merged }) });
            tagged++;
          } catch {}
        }
      }
      return tagged;
    },

    async pruneMemory({ before, maxRecords, keepEvent = null } = {}) {
      let rows;
      try { rows = await _listAll(tables.memory); }
      catch (e) { if (e.message.includes("doesn't exist")) return 0; throw e; }
      const filtered = rows.filter(r => {
        if (before && r.ts && r.ts >= before) return false;
        if (keepEvent && r.event === keepEvent) return true;
        return !before;
      });
      // 依 ts 排序,保留最後 maxRecords
      const sorted = filtered.sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));
      const toDelete = maxRecords && sorted.length > maxRecords ? sorted.slice(0, sorted.length - maxRecords) : [];
      let removed = 0;
      for (const r of toDelete) {
        if (r.id) { try { await _deleteById(tables.memory, r.id); removed++; } catch {} }
      }
      return removed;
    },

    async readProgress() {
      let rows;
      try { rows = await _listAll(tables.progress); }
      catch (e) { if (e.message.includes("doesn't exist")) return null; throw e; }
      if (!rows.length) return null;
      const sorted = [...rows].sort((a, b) => (a.updatedat || a.updatedAt || '').localeCompare(b.updatedat || b.updatedAt || ''));
      const r = sorted[sorted.length - 1];
      return [
        `# JunAikey 萬能元鑰 — Current Progress (NCB)`,
        '',
        `> Last updated: ${r.updatedat || r.updatedAt}`,
        `> MANTRA: ${MANTRA}`,
        '',
        '## Active', '',
        r.active || '(none)',
        '',
        '## Notes', '',
        r.notes || '(none)', '',
      ].join('\n');
    },

    async writeProgress(content) {
      const { active, notes } = parseProgress(content);
      const payload = { active, notes, updatedat: new Date().toISOString() };
      let rows;
      try { rows = await _listAll(tables.progress); }
      catch (e) { if (e.message.includes("doesn't exist")) rows = []; else throw e; }
      if (rows.length) {
        try { await _deleteAll(tables.progress); } catch { /* ignore */ }
      }
      try { await _req(`/create/${tables.progress}`, { method: 'POST', body: JSON.stringify(toNCBPayload(payload)) }); }
      catch (e) { if (!e.message.includes("doesn't exist")) throw e; }
    },

    async appendJournal(entry) {
      try { await _req(`/create/${tables.journal}`, { method: 'POST', body: JSON.stringify(toNCBPayload(entry)) }); }
      catch { /* journal is best-effort */ }
    },
  };
}

function _buildSearchBody(filter) {
  // NCB /search 端點: WHERE clause 只接欄位名運算,不收 limit/page/contains
  // limit 由後端在 _search 後本地 trim
  const body = {};
  if (filter.event) body.event = filter.event;
  if (filter.tag) body.tags = filter.tag;
  if (filter.since) body.ts_gte = filter.since;
  if (filter.until) body.ts_lte = filter.until;
  return body;
}
