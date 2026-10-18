// OmniLive SSE 測試/驗證輔助 (Node 端, 不依賴瀏覽器 EventSource 全域)
// 用 fetch streaming 解析 text/event-stream，拿到第一個符合 predicate 的 event data。
import { TextDecoder } from 'node:util';

/**
 * @param {string} url
 * @param {(p:any)=>boolean} predicate
 * @param {number} [timeoutMs]
 * @returns {Promise<any|null>}
 */
export async function readSSEOnce(url, predicate, timeoutMs = 5000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const res = await fetch(url, { signal: ac.signal, headers: { Accept: 'text/event-stream' } });
  if (!res.body) { clearTimeout(timer); return null; }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let result = null;
  const start = Date.now();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n\n')) >= 0) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        let ev = 'message', data = '';
        for (const line of raw.split('\n')) {
          if (line.startsWith('event:')) ev = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (ev === 'subtitle' && data) {
          try { const p = JSON.parse(data); if (predicate(p)) { result = p.data; ac.abort(); } } catch {}
        }
      }
      if (result) break;
      if (Date.now() - start > timeoutMs) break;
    }
  } catch { /* aborted */ } finally {
    clearTimeout(timer);
    try { await reader.cancel(); } catch {}
    try { if (typeof (/** @type {any} */ (res.body)?.destroy) === 'function') (/** @type {any} */ (res.body)).destroy(); } catch {}
  }
  return result;
}
