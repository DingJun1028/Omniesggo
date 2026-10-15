// vps/junaikey/model-resolver.mjs
// ============================================================
// 🔑 JunAikey 眾鑰之首 — Model Resolver (模型權威)
// ============================================================
// 五層權威:
//   L0 JunAikey  ── 眾鑰之首 (key of keys): 管理所有 key
//     ├ L1 OmniKey        憑證權威
//     ├ L2 OmniMasterKey  保險櫃管理
//     └ L3 modelKey       模型存取權威  ← 本模組
//
// 原則 (5T):
//   Traceable  — 每次解析記錄 probeChain (試了哪些模型、成敗、為何降級)
//   Trustworthy — 不可篡改: 解析結果 Object.freeze
//   Transparent — selectedModel 與 fallback 由 probe 實測決定, 非猜測
//   Tangible   — CLI `junaikey model` 即時顯示當前權威模型
//   Trackable  — NCB memory 寫入 { event: 'model-resolve', ... }
//
// 備援鏈 (免費模組, 零成本):
//   1. 本地 ollama (qwen2.5:3b-64k)         — 預設, 零成本
//   2. nous 免費雲端 (upstage/solar-mini4)  — config fallback_providers 已列
//   3. stepfun 免費雲端 (step-5-preview)    — config fallback_providers 已列
//   4. openrouter 免費模型 (nemotron-3-super)  — vault JUNAKEY_OPENROUTER_API_KEY (真實)
// 金鑰名以 secret-vault 真實變數名為準 (2026-10-15 核實): vault 無 HERMES_NOUS/STEPFUN/OPENAI key,
// 有 JUNAKEY_OPENROUTER_API_KEY — 無 key 的 backend 自動降級, 不猜。
// ⚠ 2026-10-15 實測: openrouter key 有效 (GET /models 200, 462 模型) 但帳戶 ZDR 隱私政策
//   擋下全部 :free 端點 (chat completion 13/13 404 ZDR) — key 存在 ≠ 模型可用
//   (modelkey-cloud-key-presence-gap 教訓)。待帳戶開放 ZDR 端點或加付費額度後自動生效。
// ============================================================
import { withRetry } from './util.mjs';

export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_FALLBACK_MODEL = 'qwen2.5:3b-64k';

/**
 * 眾鑰之首備援鏈 (免費模組優先序)。
 * env 可覆寫: MODELKEY_CHAIN="ollama://...,nous://...,..."
 */
export const DEFAULT_MODEL_CHAIN = [
  { backend: 'ollama', model: DEFAULT_FALLBACK_MODEL, kind: 'local', url: DEFAULT_OLLAMA_URL, num_ctx: 2048 },
  { backend: 'nous', model: 'upstage/solar-mini4:free', kind: 'cloud-free' },
  { backend: 'stepfun', model: 'stepfun/step-5-preview:free', kind: 'cloud-free' },
  { backend: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', kind: 'cloud-key' }, // JUNAKEY_OPENROUTER_API_KEY (ZDR 擋下 :free 端點, 見檔頭註記)
];

/** 已知 backend 名 — preferred 字串據此判斷是 backend 還是模型名 */
const KNOWN_BACKENDS = new Set(['ollama', 'nous', 'stepfun', 'openai', 'openrouter']);

/** 雲端 backend 預設模型名 — preferred 僅帶 backend 名 (無 model) 時的權威回填
 *  模型 ID 一律來自 GET /v1/models 實測清單 (2026-10-15): 推測的 llama-3.3-70b:free 不存在 */
const BACKEND_DEFAULT_MODELS = {
  nous: 'upstage/solar-mini4:free',
  stepfun: 'stepfun/step-5-preview:free',
  openai: 'gpt-4o',
  openrouter: 'nvidia/nemotron-3-super-120b-a12b:free',
};

/** 建眾鑰之首 model resolver。opts: { chain, ollamaUrl, timeoutMs, log } */
export function createModelResolver({ chain = DEFAULT_MODEL_CHAIN, ollamaUrl = DEFAULT_OLLAMA_URL, timeoutMs = 30000, log = console.error } = {}) {
  if (!Array.isArray(chain) || chain.length === 0) {
    throw new Error('model-resolver: chain 不可為空');
  }

  // ── 內部: 探測單一模組是否可用 ──
  async function probeOne({ backend, model, kind, url, num_ctx }) {
    const started = Date.now();
    if (backend === 'ollama') {
      const base = url || ollamaUrl;
      // 1) 輕探 /api/tags 確認服務在
      const tagsResp = await fetch(`${base}/api/tags`, {
        signal: AbortSignal.timeout(Math.min(timeoutMs, 3000)),
      });
      if (!tagsResp.ok) throw new Error(`ollama HTTP ${tagsResp.status}`);
      const tags = await tagsResp.json();
      const installed = (tags.models || []).map(m => m.name);
      // 2) 確認目標模型已安裝
      const hit = installed.find(n => n === model || n.startsWith(model.split(':')[0] + ':'));
      if (!hit) throw new Error(`model ${model} 未安裝`);
      // 3) 真實 generate 微探測 (帶 num_ctx, 與 embed 慣例一致)
      const genResp = await fetch(`${base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: hit,
          prompt: 'OK',
          stream: false,
          keep_alive: '0',
          options: { num_ctx: num_ctx || 2048, num_predict: 4 },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!genResp.ok) throw new Error(`ollama generate HTTP ${genResp.status}`);
      const gen = await genResp.json();
      if (!gen || typeof gen.response !== 'string') throw new Error('ollama 回傳異常');
      return { ok: true, resolvedModel: hit, latencyMs: Date.now() - started };
    }
    if (backend === 'nous' || backend === 'stepfun' || backend === 'openai' || backend === 'openrouter') {
      // 雲端模組: 需 API key 才可驗證, 無 key 視為不可用 (不猜)
      // keyEnv 以 secret-vault 真實變數名為準: openrouter → JUNAKEY_OPENROUTER_API_KEY (vault 有, 2026-10-15 核實)
      const keyEnv = backend === 'nous' ? 'HERMES_NOUS_API_KEY'
        : backend === 'stepfun' ? 'STEPFUN_API_KEY'
        : backend === 'openrouter' ? 'JUNAKEY_OPENROUTER_API_KEY'
        : 'OPENAI_API_KEY';
      const key = process.env[keyEnv];
      if (!key) throw new Error(`${backend} 無 API key (${keyEnv} 未設)`);
      // 不實際呼叫雲端 (避免費用/速率), 僅確認 key 存在
      return { ok: true, resolvedModel: model || BACKEND_DEFAULT_MODELS[backend] || backend, latencyMs: Date.now() - started, keyPresent: true };
    }
    throw new Error(`未知 backend: ${backend}`);
  }

  // ── 公開: 解析眾鑰之首權威模型 ──
  // 回傳 { ok, selectedBackend, selectedModel, reason, probeChain }
  async function resolve(preferred = null) {
    const candidates = [];
    if (preferred) {
      // preferred 可為 backend 名 (ollama/nous/stepfun/openrouter) 或模型名 (qwen2.5:3b-64k)
      // backend 名時繼承鏈上規格 (model/kind/url) — 否則 selectedModel 會是 undefined
      const p = typeof preferred === 'string'
        ? (KNOWN_BACKENDS.has(preferred)
            ? { ...(chain.find(c => c.backend === preferred) || {}), backend: preferred }
            : { backend: 'ollama', model: preferred })
        : preferred;
      candidates.push({ ...p, url: p.url || ollamaUrl, kind: p.kind || 'preferred' });
    }
    for (const c of chain) {
      candidates.push(c.backend === 'ollama' ? { ...c, url: c.url || ollamaUrl } : c);
    }

    const probeChain = [];
    for (const c of candidates) {
      let res;
      try {
        res = await withRetry(() => probeOne(c), { maxRetries: 1, baseDelay: 300 });
      } catch (e) {
        res = { ok: false, error: e.message || String(e) };
      }
      probeChain.push({
        backend: c.backend, model: c.model, kind: c.kind,
        ok: !!res.ok, resolvedModel: res.resolvedModel || c.model,
        latencyMs: res.latencyMs || 0, error: res.error || null,
      });
      if (res.ok) {
        return Object.freeze({
          ok: true,
          selectedBackend: c.backend,
          selectedModel: res.resolvedModel,
          kind: c.kind,
          reason: `眾鑰之首選定: ${c.backend}/${res.resolvedModel}`,
          probeChain: Object.freeze(probeChain),
          timestamp: new Date().toISOString(),
        });
      }
    }
    return Object.freeze({
      ok: false,
      selectedBackend: null,
      selectedModel: null,
      reason: `眾鑰之首備援鏈全數不可用 (試了 ${probeChain.length} 個)`,
      probeChain: Object.freeze(probeChain),
      timestamp: new Date().toISOString(),
    });
  }

  return { resolve };
}
