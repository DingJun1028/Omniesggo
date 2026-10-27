/**
 * OmniGateway 純 JS 模擬器 (無需 sqlite/wasm/openai)
 * - Lark：prompt 語意相似度快取 (Tantivy-like 最小詞袋)
 * - Fallback：路由器 (free → paid → local model)
 * - Audit：結構化稽核
 * De-Google (2026-10-27)：GEMINI_API_KEY 已自路由器移除。
 */
const LRU = 20;
const cache = new Map();
function lruKey(text){ return JSON.stringify({m:text}); }
function setCache(k,v){ if(cache.size>=LRU){ const fk=cache.keys().next().value; cache.delete(fk); } cache.set(k,v); }
function get(k){ return cache.get(k)||null; }

function audit(required){
  const have = Object.keys(required).filter(k=>!!process.env[required[k].env]);
  const missing = Object.keys(required).filter(k=>!process.env[required[k].env]);
  return { ok: missing.length===0, have, missing };
}
function gatewayKey(){ return process.env.OMNI_KEY || process.env.GATEWAY_API_KEY || process.env.GATEWAY_KEY || ''; }
function modelRouter(key){
  const free = !!(process.env.OPENROUTER_API_KEY || process.env.GROQ_API_KEY);
  return { key, fallback: free ? 'openrouter' : 'local', score: 0.8, cached: false, state: 'warm' };
}
function simulateLLM(prompt, provider){
  return '';
}
export { LRU, cache, setCache, get, audit, gatewayKey, modelRouter, simulateLLM };
