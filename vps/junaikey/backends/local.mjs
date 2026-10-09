// vps/junaikey/backends/local.mjs
// ============================================================
// Local filesystem backend
// ============================================================
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MANTRA, SKILL_TRAITS } from '../schema.mjs';
import { filterEntries, parseProgress } from '../util.mjs';

export function createLocalBackend(JUNAKEY_HOME, PATHS) {
  return {
    name: 'local',
    home: JUNAKEY_HOME,

    async init() { await fs.mkdir(PATHS.home, { recursive: true }); },

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
        // head 格式: "name (Lx) [trait1|trait2]" — (Lx) 在中段, [traits] 在尾
        const tm = head.match(/\[(.+?)\]\s*$/);
        const lm = head.match(/\((L[1-5])\)/);
        let name = head
          .replace(/\s*\(L[1-5]\)/, '')    // 移除 (Lx) (中段)
          .replace(/\s*\[.*?\]\s*$/, '')   // 移除 [traits] (尾)
          .trim();
        const traits = tm
          ? tm[1].split('|').map(t => t.trim()).filter(Boolean)
          : [];
        const level = lm ? lm[1] : 'L1';
        if (name) skills.push({ name, traits, level, body, updatedAt: null });
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
        const lv = s.level ? ` (${s.level})` : '';
        return `## ${s.name}${lv}${t}\n\n${s.body}\n`;
      }).join('\n');
      await this.init();
      await fs.writeFile(PATHS.skills, header + body, 'utf8');
    },

    async forgetSkill(name) {
      const skills = await this.readSkills();
      const filtered = skills.filter(s => s.name !== name);
      if (filtered.length === skills.length) return false;
      await this.writeSkills(filtered);
      return true;
    },

    async dedupSkills() {
      // 本地檔案不會有重複(每次 writeSkills 都重建),但為介面一致保留
      return 0;
    },

    async readMemory(filter = {}) {
      let text = '';
      try { text = await fs.readFile(PATHS.memory, 'utf8'); }
      catch (e) { if (e.code === 'ENOENT') return []; throw e; }
      const entries = [];
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try { entries.push(JSON.parse(line)); } catch { /* skip malformed */ }
      }
      return filterEntries(entries, filter);
    },

    async appendMemory(entry) {
      await this.init();
      await fs.appendFile(PATHS.memory, JSON.stringify(entry) + '\n', 'utf8');
      return entry;
    },

    async tagMemories(filter, newTags) {
      const all = await this.readMemory();
      const tagged = [];
      const updated = all.map(e => {
        const match = Object.entries(filter).every(([k, v]) => {
          if (k === 'tag') return Array.isArray(e.tags) && e.tags.includes(v);
          if (k === 'contains') return JSON.stringify(e).includes(v);
          return e[k] === v;
        });
        if (!match) return e;
        const existing = Array.isArray(e.tags) ? e.tags : [];
        const merged = [...new Set([...existing, ...newTags])];
        if (merged.length > existing.length) {
          tagged.push(e);
          return { ...e, tags: merged };
        }
        return e;
      });
      if (tagged.length === 0) return 0;
      await this.init();
      await fs.writeFile(PATHS.memory, updated.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');
      return tagged.length;
    },

    async pruneMemory({ before, maxRecords, keepEvent = null } = {}) {
      const all = await this.readMemory();
      let filtered = all;
      if (before) filtered = filtered.filter(e => !e.ts || e.ts >= before);
      if (keepEvent) {
        const keep = filtered.filter(e => e.event === keepEvent);
        const rest = filtered.filter(e => e.event !== keepEvent);
        if (maxRecords && rest.length > maxRecords) {
          rest.splice(0, rest.length - maxRecords);
        }
        filtered = [...keep, ...rest].sort((a, b) => (a.ts || '').localeCompare(b.ts || ''));
      } else if (maxRecords && filtered.length > maxRecords) {
        filtered = filtered.slice(-maxRecords);
      }
      if (filtered.length === all.length) return 0;
      await this.init();
      await fs.writeFile(PATHS.memory, filtered.map(e => JSON.stringify(e)).join('\n') + '\n', 'utf8');
      return all.length - filtered.length;
    },

    async searchMemory(filter = {}) {
      // local backend 沒搜尋端點,用 filterEntries
      return this.readMemory(filter);
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

    // FR-05 標籤血緣追蹤
    async appendLineage(entry) {
      await this.init();
      const lineagePath = path.join(PATHS.home, 'lineage.jsonl');
      await fs.appendFile(lineagePath, JSON.stringify(entry) + '\n', 'utf8');
    },

    async readLineage(filter = {}) {
      const lineagePath = path.join(PATHS.home, 'lineage.jsonl');
      let text = '';
      try { text = await fs.readFile(lineagePath, 'utf8'); }
      catch (e) { if (e.code === 'ENOENT') return []; throw e; }
      const entries = [];
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try { entries.push(JSON.parse(line)); } catch { /* skip */ }
      }
      return filterEntries(entries, filter);
    },
  };
}
