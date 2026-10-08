// vps/junaikey/operations.mjs
// ============================================================
// 公開 API operations: awaken, grow, remember, reflect, forget, prune, search
// ============================================================
import { MANTRA, SKILL_TRAITS, DEFAULT_MEMORY_RETENTION } from './schema.mjs';

export function createOperations({ dispatcher, NCB_BASE, NCB_PROJECT, JUNAKEY_HOME }) {
  let _skillsCache = null;
  let _skillsCacheMtime = 0;

  async function _loadSkillsFresh() {
    const be = await dispatcher.select();
    if (_skillsCache) {
      // 簡單 cache 策略:每次 awaken 都重讀,其他操作依賴該 cache
      // 進階:用 TTL 或 invalidation (未來)
    }
    _skillsCache = await be.readSkills();
    _skillsCacheMtime = Date.now();
    return _skillsCache;
  }

  function _invalidateSkillsCache() { _skillsCache = null; _skillsCacheMtime = 0; }

  async function awaken({ silent = false } = {}) {
    _invalidateSkillsCache();
    const be = await dispatcher.select();
    const skills = await be.readSkills();
    const recent = await be.readMemory({ limit: 20 });
    const progress = await be.readProgress();
    const result = {
      awakenedAt: new Date().toISOString(),
      backend: be.name,
      home: be.name === 'local' ? JUNAKEY_HOME : `${NCB_BASE}/v1/projects/${NCB_PROJECT}`,
      ncbConfigured: !!NCB_PROJECT,
      skillsCount: skills.length,
      skills: skills.map(s => ({ name: s.name, traits: s.traits })),
      recentMemories: recent,
      progress,
      mantra: MANTRA,
    };
    try {
      await be.appendMemory({
        event: 'awaken', ts: new Date().toISOString(),
        summary: `skills=${skills.length} memories=${recent.length} backend=${be.name}`,
        tags: ['audit', be.name],
      });
    } catch (e) { if (!silent) console.warn(`[JunAikey] memory audit skipped: ${(e?.message || e).toString().slice(0, 120)}`); }
    try { await be.appendJournal({ kind: 'awaken', skills: skills.length, memories: recent.length, backend: be.name }); } catch {}
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

  async function loadSkills({ bypassCache = false } = {}) {
    if (!bypassCache && _skillsCache) return _skillsCache;
    return _loadSkillsFresh();
  }

  async function growSkill(name, body, traits = []) {
    if (!name || typeof name !== 'string') throw new TypeError('growSkill: name required');
    const cleanTraits = (Array.isArray(traits) ? traits : [traits]).filter(t => SKILL_TRAITS.includes(t));
    const be = await dispatcher.select();
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

  async function forgetSkill(name) {
    const be = await dispatcher.select();
    const removed = await be.forgetSkill(name);
    if (removed) _invalidateSkillsCache();
    return removed;
  }

  async function dedupSkills() {
    const be = await dispatcher.select();
    const removed = await be.dedupSkills();
    if (removed > 0) _invalidateSkillsCache();
    return removed;
  }

  async function remember(event) {
    const entry = { ts: new Date().toISOString(), ...(event && typeof event === 'object' ? event : { event }) };
    const be = await dispatcher.select();
    const result = await be.appendMemory(entry);
    return { ...entry, _backend: be.name, _ncbResult: be.name === 'ncb' ? result : undefined };
  }

  async function recall(filter = {}) {
    const be = await dispatcher.select();
    return be.readMemory(filter);
  }

  async function searchMemory(filter = {}) {
    const be = await dispatcher.select();
    if (be.searchMemory) return be.searchMemory(filter);
    return be.readMemory(filter);
  }

  async function pruneMemory(opts = {}) {
    const be = await dispatcher.select();
    if (!be.pruneMemory) return 0;
    return be.pruneMemory({ maxRecords: DEFAULT_MEMORY_RETENTION, ...opts });
  }

  async function setProgress(active, notes = '') {
    const now = new Date().toISOString();
    const content = [
      '# JunAikey 萬能元鑰 — Current Progress',
      '',
      `> Last updated: ${now}`,
      `> MANTRA: ${MANTRA}`,
      '',
      '## Active', '',
      active || '(none)',
      '',
      '## Notes', '',
      notes || '(none)', '',
    ].join('\n');
    const be = await dispatcher.select();
    await be.writeProgress(content);
    return { active, notes, ts: now, _backend: be.name };
  }

  async function getProgress() {
    const be = await dispatcher.select();
    return be.readProgress();
  }

  async function reflect(summary, learnings = [], tags = []) {
    const be = await dispatcher.select();
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
    try { await be.appendJournal({ kind: 'reflect', grown: grown.length, summary, backend: be.name }); } catch {}
    return entry;
  }

  return {
    awaken, loadSkills, growSkill, recallSkill, forgetSkill, dedupSkills,
    remember, recall, searchMemory, pruneMemory,
    setProgress, getProgress, reflect,
    _invalidateSkillsCache,
  };
}
