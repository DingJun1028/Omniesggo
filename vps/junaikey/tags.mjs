// vps/junaikey/tags.mjs
// ============================================================
// 萬能標籤 OmniTag — 整合 6 維結構化標籤系統
// Spec: ~/.opencode/skills/omnitag/SKILL.md
// ============================================================

// 6 大維度 (MECE)
export const OMNITAG_DIMENSIONS = {
  security: ['public', 'internal', 'confidential', 'restricted'],
  agent: Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0')),
  squad: ['智庫聖所', '符文契約', '光之羽翼', '煉金熵減', '5T驗算'],
  lifecycle: ['draft', 'active', 'frozen', 'archived'],
  priority: ['p0', 'p1', 'p2', 'p3'],
  platform: ['esggo', 'omni', 'vps', 'firebase', 'vercel', 'github', 'cloudflare', 'ncb', 'hermes', 'ncndb'],
  'best-practice': ['awakened', '结界', 'draft'],
};

// 路由優先級 (從高到低)
export const ROUTING_PRIORITY = [
  'security',         // 安全優先
  'best-practice',    // 覺醒結界
  'priority',         // 緊急度
  'agent',            // 代理歸屬
  'squad',            // 群組
  'platform',         // 平台
  'lifecycle',        // 生命週期
  'custom',           // 自訂
];

// 衝突規則
export const CONFLICT_RULES = [
  { rule: 'lifecycle:frozen + lifecycle:active', reason: '狀態衝突' },
  { rule: 'security:public + security:restricted', reason: '安全矛盾' },
  { rule: 'p0 + p3', reason: '優先級衝突' },
  { rule: 'best-practice:awakened + lifecycle:draft', reason: '覺醒不可為草稿' },
];

// 解析 tag 字串: "security:public" → {key: "security", value: "public"}
export function parseTag(tag) {
  if (typeof tag !== 'string') return null;
  const trimmed = tag.trim();
  if (!trimmed) return null;
  const idx = trimmed.indexOf(':');
  if (idx < 0) return { key: null, value: trimmed, raw: trimmed, valid: true, isOmni: false };
  const key = trimmed.slice(0, idx).trim();
  const value = trimmed.slice(idx + 1).trim();
  return { key, value, raw: trimmed, valid: true, isOmni: isOmniTag(key) };
}

// 判斷是否為 OmniTag 規範維度
export function isOmniTag(key) {
  if (!key) return false;
  return Object.prototype.hasOwnProperty.call(OMNITAG_DIMENSIONS, key);
}

// 驗證 OmniTag 是否在合法值範圍內
export function validateOmniTag(tag) {
  const parsed = parseTag(tag);
  if (!parsed) return { valid: false, reason: 'invalid format' };
  if (!parsed.isOmni) return { valid: true, parsed, note: 'custom tag (not OmniTag dimension)' };
  const validValues = OMNITAG_DIMENSIONS[parsed.key];
  if (validValues && !validValues.includes(parsed.value)) {
    return { valid: false, parsed, reason: `value "${parsed.value}" not in ${parsed.key}: [${validValues.join(', ')}]` };
  }
  return { valid: true, parsed };
}

// 檢查多個 tags 之間的衝突
export function detectConflicts(tags) {
  // 收集所有衝突候選 (set 形式),最後去重為 list
  const conflictMap = new Map();  // pairKey (sorted) → {tags, reason}
  const addConflict = (t1, t2, reason) => {
    const pairKey = [t1, t2].sort().join(' + ');
    if (!conflictMap.has(pairKey)) {
      conflictMap.set(pairKey, { tags: [t1, t2], reason });
    }
  };
  // 1) 同 group (key 前綴) 多 value = 衝突
  const byGroup = new Map();
  for (const t of tags) {
    const p = parseTag(t);
    if (!p) continue;
    const groupKey = p.key ? `${p.key}:` : '';
    if (!byGroup.has(groupKey)) byGroup.set(groupKey, new Set());
    byGroup.get(groupKey).add({ tag: t, value: p.value });
  }
  for (const [groupKey, items] of byGroup) {
    if (items.size > 1) {
      const allTags = [...items].map(x => x.tag);
      const allValues = [...items].map(x => x.value).join(' + ');
      // 兩兩配對加入 (以 set 形式去重)
      for (let i = 0; i < allTags.length; i++) {
        for (let j = i + 1; j < allTags.length; j++) {
          addConflict(allTags[i], allTags[j], `同 group "${groupKey || '(free-form)'}" 多 value: ${allValues}`);
        }
      }
    }
  }
  // 2) 預定義跨 group 衝突規則
  for (const rule of CONFLICT_RULES) {
    const [a, b] = rule.rule.split(' + ');
    if (tags.includes(a) && tags.includes(b)) {
      addConflict(a, b, rule.reason);
    }
  }
  return [...conflictMap.values()];
}

// 將 tag 正規化為統一格式 ("agent:13" 保留, "agent: 13 " 標準化為 "agent:13")
export function normalizeTag(tag) {
  const p = parseTag(tag);
  if (!p) return null;
  if (!p.key) return p.value;  // 沒有 key 的 free-form tag
  return `${p.key}:${p.value}`;
}

// 從 tag 陣列提取特定維度的所有值
export function getValuesByKey(tags, key) {
  return tags
    .map(t => parseTag(t))
    .filter(p => p && p.key === key)
    .map(p => p.value);
}

// 檢查 tag 是否符合 prefix pattern (e.g., "agent:1*" matches "agent:10", "agent:11")
export function matchPrefix(tag, prefix) {
  const tp = parseTag(tag);
  const pp = parseTag(prefix);
  if (!tp || !pp) return false;
  if (pp.key !== tp.key) return false;
  if (!pp.value.endsWith('*')) return tp.value === pp.value;
  const prefixStr = pp.value.slice(0, -1);
  return tp.value.startsWith(prefixStr);
}

// 過濾 tags 符合 query (支援 wildcard 和 key-only)
export function filterTags(tags, query) {
  if (!query) return tags;
  // exact match
  if (tags.includes(query)) return [query];
  // prefix match
  return tags.filter(t => matchPrefix(t, query) || t.startsWith(query));
}

// Tag 索引聚合 (從多個 records 收集所有 tags + 計算數量)
export function aggregateTags(records) {
  const counts = new Map();
  for (const r of records) {
    const tags = Array.isArray(r.tags) ? r.tags : (Array.isArray(r.traits) ? r.traits : []);
    for (const t of tags) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  // 排序: 次數降序, 同次數按 tag 字母序
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
}
