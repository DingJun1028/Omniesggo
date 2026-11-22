// vps/junaikey/operations.mjs
// ============================================================
// 公開 API operations: awaken, grow, remember, reflect, forget, prune, search, tag
// ============================================================
import { MANTRA, SKILL_TRAITS, DEFAULT_MEMORY_RETENTION, SUPERPOWERS_STAGES } from './schema.mjs';
import {
  parseTag, validateOmniTag, detectConflicts, normalizeTag,
  filterTags, getValuesByKey, aggregateTags, calculateBoundaryInheritance,
  OMNITAG_DIMENSIONS, ROUTING_PRIORITY,
} from './tags.mjs';
import { createModelResolver } from './model-resolver.mjs';
import { createServiceResolver } from './service-resolver.mjs';

// NCB memory schema 限欄位 (ts/event/summary/tags/sourceOrigin/task),
// stage/status 不可直寫 (400 Unknown column);兩 backend 統一以 summary
// 前綴 `<stage>:<status>` 編碼存取,讀取時由此 helper 解析還原。
function stageStatusOf(e) {
  if (e && e.stage) return { stage: e.stage, status: e.status };
  const m = /^([a-z0-9]+):(start|done|blocked|skipped)/.exec(String(e?.summary || ''));
  return m ? { stage: m[1], status: m[2] } : { stage: undefined, status: undefined };
}

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
    const bootstrap = await superpowersBootstrap({ silent });
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
      // superpowers 啟動引導
      superpowers: bootstrap,
    };
    try {
      await be.appendMemory({
        event: 'awaken', ts: new Date().toISOString(),
        summary: `skills=${skills.length} memories=${recent.length} backend=${be.name}`,
        tags: ['audit', be.name, 'superpowers:bootstrap'],
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
      if (!bootstrap.skipped) {
        console.log(`  superpowers  : bootstrapping ${bootstrap.stageLabel}`);
      } else {
        console.log(`  superpowers  : already bootstrapped (stage=${bootstrap.stage})`);
      }
    }
    return result;
  }

  // ── Superpowers 啟動引導 (Bootstrap) ────────────────────
  // 每次 session 透過 `awaken` 進入時,先在超能力 7 階段中點亮「腦力激盪」旗標,
  // 形成被動恆久覺醒 (passive-habitual awakening) 的超能力記載。
  async function superpowersBootstrap({ silent = false } = {}) {
    const be = await dispatcher.select();
    // 取最近 3 筆 superpowers 階段記錄,看是否已有 brainstorming 記錄
    const recent = await be.readMemory({ event: 'superpowers_stage', limit: 3 });
    const stagesSeen = recent.map(r => stageStatusOf(r).stage);
    if (stagesSeen.includes('brainstorming')) {
      return { bootstrappedAt: new Date().toISOString(), backend: be.name, skipped: true, stage: 'brainstorming', stageLabel: '腦力激盪' };
    }
    const now = new Date().toISOString();
    const entry = {
      ts: now,
      kind: 'superpowers_bootstrap',
      stage: 'brainstorming',
      stageLabel: '腦力激盪',
      status: 'start',
      source: 'session_awaken',
      backend: be.name,
    };
    try {
      await be.appendJournal(entry);
    } catch {
      /* 最佳努力 */
    }
    try {
      await be.appendMemory({
        event: 'superpowers_stage',
        ts: now,
        summary: 'brainstorming:start (session_awaken)',
        tags: ['superpowers', 'superpowers:brainstorming', be.name],
      });
    } catch (e) {
      if (!silent) console.warn(`[JunAikey] superpowers bootstrap skipped: ${(e?.message || e).toString().slice(0, 120)}`);
    }
    return { bootstrappedAt: now, backend: be.name, skipped: false, stage: 'brainstorming', stageLabel: '腦力激盪' };
  }

  async function loadSkills({ bypassCache = false } = {}) {
    if (!bypassCache && _skillsCache) return _skillsCache;
    return _loadSkillsFresh();
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
    // 過濾 junaikey_memory 表未定義的欄位 (只保留 ts/event/summary/grownSkills/tags)。
    // 若使用者傳入 'task'/'rc' 等非表欄位,會在此被捨棄,避免 "Unknown column" 400。
    const valid = new Set(['event', 'summary', 'grownSkills', 'tags']);
    for (const k of Object.keys(entry)) {
      if (k === 'ts') continue; // ts 由本函式新增,保留
      if (!valid.has(k)) delete entry[k];
    }
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

  // ── OmniTag 操作 (整合 ~/.opencode/skills/omnitag/SKILL.md) ──
  async function tagSkill(name, tags, { source = 'cli', reason = '' } = {}) {
    if (!Array.isArray(tags)) tags = [tags];
    const be = await dispatcher.select();
    const skills = await be.readSkills();
    const idx = skills.findIndex(s => s.name === name);
    if (idx < 0) return null;
    const existing = skills[idx].traits || [];
    const normalized = tags.map(normalizeTag).filter(Boolean);
    const newTags = normalized.filter(t => !existing.includes(t));
    const merged = [...new Set([...existing, ...normalized])];
    skills[idx] = { ...skills[idx], traits: merged, updatedAt: new Date().toISOString() };
    await be.writeSkills(skills);
    _skillsCache = skills;
    // FR-05 記錄血緣 (每個新 tag 一筆)
    for (const t of newTags) {
      await _recordLineage('tag-add', name, t, source, reason);
    }
    return skills[idx];
  }

  async function untagSkill(name, tag, { source = 'cli', reason = '' } = {}) {
    const normalized = normalizeTag(tag);
    const be = await dispatcher.select();
    const skills = await be.readSkills();
    const idx = skills.findIndex(s => s.name === name);
    if (idx < 0) return null;
    const filtered = (skills[idx].traits || []).filter(t => t !== normalized);
    if (filtered.length === (skills[idx].traits || []).length) return false;
    skills[idx] = { ...skills[idx], traits: filtered, updatedAt: new Date().toISOString() };
    await be.writeSkills(skills);
    _skillsCache = skills;
    await _recordLineage('tag-remove', name, normalized, source, reason);
    return true;
  }

  async function tagMemories(filter, newTags) {
    if (!Array.isArray(newTags)) newTags = [newTags];
    const be = await dispatcher.select();
    if (!be.tagMemories) return 0;
    return be.tagMemories(filter, newTags.map(normalizeTag).filter(Boolean));
  }

  async function listTags({ type = 'all', query } = {}) {
    const be = await dispatcher.select();
    const all = [];
    if (type === 'all' || type === 'skills') {
      const skills = await be.readSkills();
      for (const s of skills) all.push({ kind: 'skill', name: s.name, tags: s.traits || [] });
    }
    if (type === 'all' || type === 'memory') {
      const mems = await be.readMemory();
      for (const m of mems) all.push({ kind: 'memory', event: m.event, ts: m.ts, tags: Array.isArray(m.tags) ? m.tags : [] });
    }
    // 套用 query filter
    let filtered = all.map(item => {
      const matchedTags = query ? filterTags(item.tags, query) : item.tags;
      return { ...item, tags: matchedTags };
    });
    if (query) filtered = filtered.filter(item => item.tags.length > 0);

    // aggregate: single pass O(N) indexing
    const counts = new Map();
    const itemsByTag = new Map();
    for (const item of filtered) {
      const id = item.name || item.event || item.ts;
      for (const t of item.tags) {
        counts.set(t, (counts.get(t) || 0) + 1);
        if (!itemsByTag.has(t)) itemsByTag.set(t, []);
        itemsByTag.get(t).push(id);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count, items: itemsByTag.get(tag) || [] }));
  }

  async function findByTag(tag) {
    const be = await dispatcher.select();
    const normalized = normalizeTag(tag);
    const results = { skills: [], memory: [] };
    // skills
    const skills = await be.readSkills();
    for (const s of skills) {
      const matched = filterTags(s.traits || [], normalized);
      if (matched.length > 0) results.skills.push({ name: s.name, matchedTags: matched });
    }
    // memory
    const mems = await be.readMemory();
    for (const m of mems) {
      const matched = filterTags(Array.isArray(m.tags) ? m.tags : [], normalized);
      if (matched.length > 0) results.memory.push({ ts: m.ts, event: m.event, summary: m.summary, matchedTags: matched });
    }
    return results;
  }

  function validateTag(tag) {
    return validateOmniTag(tag);
  }

  function checkTagConflicts(tags) {
    return detectConflicts(tags);
  }

  // 結界 inheritance: 自動將 best-practice:結界 擴散到同 agent/squad 的 skills
  async function applyBoundaryInheritance({ dryRun = false } = {}) {
    const be = await dispatcher.select();
    const skills = await be.readSkills();
    const needs = calculateBoundaryInheritance(skills);
    if (dryRun) return { wouldInherit: needs, total: skills.length };
    if (needs.length === 0) return { inherited: 0, total: skills.length };
    const byName = new Map(skills.map(s => [s.name, s]));
    for (const { name } of needs) {
      const s = byName.get(name);
      if (s) {
        s.traits = [...new Set([...(s.traits || []), 'best-practice:結界'])];
        s.updatedAt = new Date().toISOString();
      }
    }
    await be.writeSkills(skills);
    _skillsCache = skills;
    return { inherited: needs.length, names: needs.map(x => x.name), total: skills.length };
  }

  // pruneSkills: 限制 skills 總數 (按 updatedAt 保留最新的)
  async function pruneSkills({ maxSkills = 200, keepName = [] } = {}) {
    const be = await dispatcher.select();
    const skills = await be.readSkills();
    if (skills.length <= maxSkills) return { removed: 0, total: skills.length };
    const sorted = [...skills].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    const keepNames = new Set(keepName);
    const keep = [];
    const remove = [];
    for (const s of sorted) {
      if (keepNames.has(s.name) || keep.length < maxSkills) keep.push(s);
      else remove.push(s);
    }
    if (remove.length === 0) return { removed: 0, total: skills.length };
    for (const r of remove) {
      if (be.forgetSkill) await be.forgetSkill(r.name);
    }
    const after = await be.readSkills();
    _skillsCache = after;
    return { removed: remove.length, removedNames: remove.map(s => s.name), total: after.length };
  }

  // mergeSkills: 將 srcName 的 traits 合併到 dstName,可選重新命名
  async function mergeSkills(srcName, dstName, { newBody, newName } = {}) {
    if (srcName === dstName) return null;
    const be = await dispatcher.select();
    const skills = await be.readSkills();
    const src = skills.find(s => s.name === srcName);
    const dst = skills.find(s => s.name === dstName);
    if (!src || !dst) return null;
    const mergedTraits = [...new Set([...(dst.traits || []), ...(src.traits || []), '永恆'])];
    const finalName = newName || dstName;
    const finalBody = newBody || dst.body + '\n\n---\n## 合併自 `' + srcName + '`:\n' + src.body;
    const filtered = skills.filter(s => s.name !== srcName);
    const idx = filtered.findIndex(s => s.name === dstName);
    if (newName && idx >= 0) filtered.splice(idx, 1);
    const target = { name: finalName, body: finalBody, traits: mergedTraits, updatedAt: new Date().toISOString() };
    if (idx >= 0 && !newName) filtered[idx] = target;
    else filtered.push(target);
    await be.writeSkills(filtered);
    _skillsCache = filtered;
    return { merged: true, from: srcName, to: finalName, traitsCount: mergedTraits.length };
  }

  // ── FR-05 標籤血緣追蹤 ──
  async function _recordLineage(op, target, tag, source = 'cli', reason = '') {
    const be = await dispatcher.select();
    if (!be.appendLineage) return;  // 後端不支援,跳過
    await be.appendLineage({
      ts: new Date().toISOString(),
      op,                    // 'tag-add' | 'tag-remove' | 'tag-inherit'
      target,                // skill name 或 'memory:<id>'
      tag,                   // 例如 'agent:13'
      source,                // 'cli' | 'inheritance' | 'auto-llm' | 'reflect'
      reason,
      backend: be.name,
    });
  }

  // 查詢血緣 (依 target 或 tag 過濾)
  async function getLineage({ target, tag, op, since, limit = 100 } = {}) {
    const be = await dispatcher.select();
    if (!be.readLineage) return [];
    return be.readLineage({ target, tag, op, since, limit });
  }

  // ── F-04 知識沉澱框架 L1-L5 ──
  // growSkill 支援 level 參數 (OmniTag + 6 大 trait 全部保留,不過濾)
  async function growSkill(name, body, traits = [], { level = 'L1' } = {}) {
    if (!name || typeof name !== 'string') throw new TypeError('growSkill: name required');
    const cleanTraits = Array.isArray(traits) ? traits : [traits];
    const be = await dispatcher.select();
    const skills = await be.readSkills();
    const idx = skills.findIndex(s => s.name === name);
    const record = {
      name,
      body: String(body || '').trim(),
      traits: cleanTraits,
      level,
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) skills[idx] = { ...skills[idx], ...record };
    else skills.push(record);
    await be.writeSkills(skills);
    _skillsCache = skills;
    return record;
  }

  // 提升 skill 沉澱層級 (L1→L2→L3→L4→L5)
  async function promoteSkill(name, newLevel, { reason = '' } = {}) {
    const be = await dispatcher.select();
    const skills = await be.readSkills();
    const idx = skills.findIndex(s => s.name === name);
    if (idx < 0) return null;
    const oldLevel = skills[idx].level || 'L1';
    skills[idx] = { ...skills[idx], level: newLevel, updatedAt: new Date().toISOString() };
    await be.writeSkills(skills);
    _skillsCache = skills;
    await _recordLineage('level-promote', name, `${oldLevel}→${newLevel}`, 'cli', reason);
    return { from: oldLevel, to: newLevel, name };
  }

  // 取得沉澱層級統計 (F-04 / OR-01 量化)
  async function getSedimentationStats() {
    const be = await dispatcher.select();
    const skills = await be.readSkills();
    const mems = await be.readMemory();
    const byLevel = {};
    for (const lv of ['L1', 'L2', 'L3', 'L4', 'L5']) byLevel[lv] = 0;
    for (const s of skills) byLevel[s.level || 'L1'] = (byLevel[s.level || 'L1'] || 0) + 1;
    return {
      skills: byLevel,
      memory: mems.length,
      total: skills.length + mems.length,
    };
  }

  // ── FR-03 智慧標籤生成 (LLM 自動標記) ──
  // 用本地 LLM (Ollama) 從 text 生 OmniTag;若無 LLM 可用,返回空陣列
  // 內部: 單次 ollama /api/generate 呼叫, 失敗即 throw (供眾鑰之首接續重試)
  async function _ollamaGenerate(model, prompt, ollamaUrl) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 60000); // 60s 容納冷載入 (3b 模型冷載入 ~8s)
    try {
      const r = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          keep_alive: '30m',
          options: { temperature: 0.1, num_ctx: 8192, num_predict: 256, repeat_penalty: 1.1 },
        }),
        signal: ac.signal,
      });
      clearTimeout(t);
      if (!r.ok) throw new Error(`ollama HTTP ${r.status}`);
      const j = await r.json();
      return (j.response || '').trim();
    } catch (e) {
      clearTimeout(t);
      throw (e.name === 'AbortError') ? new Error('timeout 60s') : e;
    }
  }

  function _parseOmniTags(raw) {
    const tags = raw.split('\n').map(s => s.trim()).filter(s => /^[a-z\-]+:[a-z0-9一-龥]+$/i.test(s));
    return tags.filter(t => validateOmniTag(t).valid);
  }

  async function autoTagFromLLM(text, { model = 'qwen2.5:3b-64k', maxTags = 5, ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434', autoFallback = true } = {}) {
    if (!text || text.length < 10) return { tags: [], reason: 'text too short' };
    const prompt = `從以下中文/英文內容提取最多 ${maxTags} 個 OmniTag (格式: key:value)。OmniTag 維度: security(public/internal/confidential/restricted), agent(01-30), squad(智庫聖所/符文契約/光之羽翼/煉金熵減/5T驗算), lifecycle(draft/active/frozen/archived), priority(p0/p1/p2/p3), platform(esggo/omni/vps/ncb/hermes/cloudflare), best-practice(awakened/結界/draft)。

內容:
"""
${text.slice(0, 2000)}
"""

請只輸出 tags,每行一個,例如:
agent:13
lifecycle:active
platform:vps
不要其他說明文字。`;
    // ── 眾鑰之首自動接續: 先試指定模型; 不可用 → resolveModel 選免費備援鏈 → 重試接續 ──
    try {
      const raw = await _ollamaGenerate(model, prompt, ollamaUrl);
      return { tags: _parseOmniTags(raw), raw, model };
    } catch (firstErr) {
      if (!autoFallback) return { tags: [], reason: firstErr.message };
      const resolved = await resolveModel({ preferred: model, remember: false });
      if (!resolved.ok || resolved.selectedModel === model) {
        return { tags: [], reason: firstErr.message, fellBack: false, resolveReason: resolved.reason || 'no alternative' };
      }
      try {
        const raw = await _ollamaGenerate(resolved.selectedModel, prompt, ollamaUrl);
        return {
          tags: _parseOmniTags(raw), raw,
          model: resolved.selectedModel,          // 實際使用的權威模型
          fellBack: true, fromModel: model,       // 透明標示已接續
          probeChain: resolved.probeChain,        // 5T Traceable
        };
      } catch (secondErr) {
        return { tags: [], reason: secondErr.message, fellBack: true, fromModel: model };
      }
    }
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

  // ── Superpowers 7 階段追蹤 ───────────────────────────────
  // 把上游 Superpowers 的 7 階段編碼方法論注入 junaikey 成長層：
  // 每個階段以 'superpowers:stage:<id>' 標籤 + journal 記錄，形成 closed-loop。
  // 可透過 `listSuperPowersStages()` 串流每階段的進度與證據，驅動進化。
  async function trackSuperPowersStage(stageId, status, { source = 'cli', sourceOrigin = '', notes = '' } = {}) {
    const validIds = SUPERPOWERS_STAGES.map(s => s.id);
    if (!validIds.includes(stageId)) {
      throw new Error(
        `trackSuperPowersStage: 未知階段 "${stageId}"。合法值: ${validIds.join(', ')}`
      );
    }
    const be = await dispatcher.select();
    const entry = {
      ts: new Date().toISOString(),
      kind: 'superpowers_stage',
      stage: stageId,
      stageLabel: SUPERPOWERS_STAGES.find(s => s.id === stageId)?.label || stageId,
      status, // 'start' | 'done' | 'blocked' | 'skipped'
      source,
      sourceOrigin,
      notes,
      backend: be.name,
    };
    // 1) 寫入 journal（審計軌跡，Traceable/Trackable）
    await be.appendJournal(entry);
    // 2) 同步寫入 memory（可被 searchMemory 找回，Trustworthy）
    const summary = [
      `${stageId}:${status}`,
      source ? `source=${source}` : '',
      sourceOrigin ? `origin=${sourceOrigin}` : '',
      notes ? `notes=${notes}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    await be.appendMemory({
      event: 'superpowers_stage',
      ts: entry.ts,
      summary,
      tags: ['superpowers', `superpowers:${stageId}`, be.name],
    });
    return entry;
  }

  async function listSuperPowersStages({ stage, status, limit = 50 } = {}) {
    const be = await dispatcher.select();
    const all = await be.readMemory({ event: 'superpowers_stage', limit });
    let filtered = all;
    if (stage) filtered = filtered.filter(e => stageStatusOf(e).stage === stage);
    if (status) filtered = filtered.filter(e => stageStatusOf(e).status === status);
    return filtered
      .map(e => {
        const { stage: st, status: stt } = stageStatusOf(e);
        return {
          ...e,
          stage: st,
          status: stt,
          stageLabel: SUPERPOWERS_STAGES.find(s => s.id === st)?.label || st,
          stageOrder: SUPERPOWERS_STAGES.find(s => s.id === st)?.order || 0,
        };
      })
      .sort((a, b) => (a.stageOrder || 0) - (b.stageOrder || 0));
  }

  async function resetSuperPowersStages() {
    const be = await dispatcher.select();
    const now = new Date().toISOString();
    const resetEntry = {
      ts: now,
      kind: 'superpowers_reset',
      summary: 'all superpowers stages reset to not_started',
      backend: be.name,
    };
    await be.appendJournal(resetEntry);
    await be.appendMemory({
      event: 'superpowers_reset',
      ts: now,
      summary: 'all superpowers stages reset',
      tags: ['superpowers', 'superpowers:reset', be.name],
    });
    return resetEntry;
  }

  // ── 🔑 眾鑰之首 — 模型存取權威 (L3) ──────────────────────
  // 當前模型不可用時,自動降級到免費備援鏈並選定權威模型。
  // 5T: probeChain 記錄實測軌跡; 選定結果 Object.freeze; 寫 NCB memory (Trackable)。
  async function resolveModel({ preferred = null, remember: doRemember = true } = {}) {
    const resolver = createModelResolver({});
    const result = await resolver.resolve(preferred);
    if (doRemember) {
      try {
        const be = await dispatcher.select();
        await be.appendMemory({
          event: 'model-resolve',
          ts: new Date().toISOString(),
          summary: result.ok
            ? `selected ${result.selectedBackend}/${result.selectedModel} · probeChain=${result.probeChain.length}`
            : `unavailable · probeChain=${result.probeChain.length}`,
          tags: ['model-resolver', result.selectedBackend || 'none', be.name],
        });
      } catch { /* NCB 不可達不阻塞 */ }
    }
    return result;
  }

  // ── 🔑 眾鑰之首 — 外部服務存取權威 (L3 泛化, 2026-10-15) ──
  // tts/visual/storage/llm 的雲端金鑰增強不可用時,自動接續免費模組。
  // 5T: probeChain 記錄實測軌跡; 選定結果 Object.freeze; 寫 NCB memory (Trackable)。
  // 對應 AI Station §9 七模組的雲端增強優雅回落。
  async function resolveService(name, { preferred = null, remember: doRemember = true } = {}) {
    const resolver = createServiceResolver({});
    const result = await resolver.resolve(name, { preferred });
    if (doRemember) {
      try {
        const be = await dispatcher.select();
        await be.appendMemory({
          event: 'service-resolve',
          ts: new Date().toISOString(),
          summary: result.ok
            ? `${name}: selected ${result.selectedProvider} · probeChain=${result.probeChain.length}`
            : `${name}: unavailable · probeChain=${result.probeChain.length}`,
          tags: ['service-resolver', name, result.selectedProvider || 'none', be.name],
        });
      } catch { /* NCB 不可達不阻塞 */ }
    }
    return result;
  }

  return {
    awaken, loadSkills, growSkill, recallSkill, forgetSkill, dedupSkills,
    remember, recall, searchMemory, pruneMemory,
    setProgress, getProgress, reflect,
    tagSkill, untagSkill, tagMemories, listTags, findByTag,
    validateTag, checkTagConflicts,
    applyBoundaryInheritance, pruneSkills, mergeSkills,
    getLineage, promoteSkill, getSedimentationStats, autoTagFromLLM,
    // ── 🔑 眾鑰之首 — 模型存取權威 (L3) ──
    resolveModel,
    // ── 🔑 眾鑰之首 — 服務存取權威 (L3 泛化) ──
    resolveService,
    _invalidateSkillsCache,
    // ── Superpowers 7 階段追蹤（融合入口）─────────────────────────
    trackSuperPowersStage,
    listSuperPowersStages,
    resetSuperPowersStages,
  };
}
