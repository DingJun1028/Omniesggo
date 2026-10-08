// vps/junaikey/util.mjs
// ============================================================
// 工具函式:datetime 轉換、JSON 解析、retry、filtering
// ============================================================

// ISO 8601 → MySQL DATETIME: '2026-10-08T10:03:59.439Z' → '2026-10-08 10:03:59'
export function isoToMysql(iso) {
  if (typeof iso !== 'string') return iso;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(iso)) return iso;
  return iso.replace('T', ' ').replace(/\.\d+Z?$/, '').replace(/Z$/, '');
}

// 遞迴把物件內所有 ISO 字串轉 MySQL 格式 (for NCB inserts)
export function toNCBPayload(obj) {
  if (obj == null) return obj;
  if (Array.isArray(obj)) return obj.map(toNCBPayload);
  if (typeof obj === 'string') return isoToMysql(obj);
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = toNCBPayload(v);
    return out;
  }
  return obj;
}

// NCB 把 JSON 欄位回傳成 string,需 parse
export function parseJSONField(v) {
  if (v == null) return v;
  if (Array.isArray(v) || typeof v === 'object') return v;
  if (typeof v === 'string') {
    const s = v.trim();
    if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('{') && s.endsWith('}'))) {
      try { return JSON.parse(s); } catch { return v; }
    }
  }
  return v;
}

// 統一的後端 filter 邏輯
export function filterEntries(entries, filter = {}) {
  let out = entries;
  if (filter.tag) {
    const want = String(filter.tag);
    out = out.filter(e => {
      if (Array.isArray(e.tags) && e.tags.includes(want)) return true;
      if (typeof e.tag === 'string' && e.tag === want) return true;  // 血緣記錄用單數 tag
      return false;
    });
  }
  if (filter.event) out = out.filter(e => e.event === filter.event);
  if (filter.since) out = out.filter(e => e.ts >= filter.since);
  if (filter.until) out = out.filter(e => e.ts <= filter.until);
  if (filter.target) out = out.filter(e => e.target === filter.target);
  if (filter.op) out = out.filter(e => e.op === filter.op);
  if (filter.contains) {
    const needle = String(filter.contains);
    out = out.filter(e => JSON.stringify(e).includes(needle));
  }
  if (filter.limit) out = out.slice(-Number(filter.limit));
  return out;
}

// retry with exponential backoff (預設 3 次,base 200ms)
export async function withRetry(fn, { maxRetries = 3, baseDelay = 200, maxDelay = 5000 } = {}) {
  let lastErr;
  for (let i = 0; i <= maxRetries; i++) {
    try { return await fn(i); }
    catch (e) {
      lastErr = e;
      if (i === maxRetries) break;
      const delay = Math.min(baseDelay * Math.pow(2, i), maxDelay);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

// parse '## Active' / '## Notes' 區塊 from progress markdown
export function parseProgress(content) {
  const active = (content.match(/##\s*Active\s*\n+([\s\S]*?)(?=\n##\s|\s*$)/) || [])[1]?.trim() || '';
  const notes = (content.match(/##\s*Notes\s*\n+([\s\S]*?)(?=\n##\s|\s*$)/) || [])[1]?.trim() || '';
  return { active, notes };
}
