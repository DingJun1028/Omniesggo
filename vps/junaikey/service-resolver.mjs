/** 眾鑰之首 service resolver — 外部服務存取權威 (L3 泛化, 2026-10-15)
 *
 *  與 model-resolver 完全同構的設計原則:
 *    1. 零成本免費模組優先 (free-local), 雲端金鑰模組為增強備援
 *    2. 任一候選不可用不阻塞 (probeOne 失敗即 throw, 由備援鏈接續)
 *    3. probeChain 全軌跡透明 (5T Transparent), 結果 Object.freeze (Trustworthy)
 *    4. 雲端僅驗證 key 存在, 不實際呼叫 (避免費用/速率 — 與 model-resolver 一致)
 *
 *  對應 AI Station §9 七模組的雲端增強:
 *    模組2 文字解析  → llm   (眾鑰之首 L3 模型鏈 + OpenRouter 免費模型)
 *    模組3 語音合成  → tts   (edge-tts 免費 → ElevenLabs)
 *    模組4 視覺生成  → visual (Pillow 品牌漸層 → Runway B-roll)
 *    模組6 雲端儲存  → storage (本地 /storage → S3)
 */
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { withRetry } from './util.mjs';
import { createModelResolver } from './model-resolver.mjs';

/** 已知 provider 名 (供 --prefer= 判別: 是 provider 名才可查鏈上規格)
 *  金鑰名以 secret-vault/ENV20230818.env 真實變數名為準 (2026-10-15 全名單核實):
 *  vault 有 JUNAKEY_OPENROUTER_API_KEY / NVIDIA_API_KEY / GEMINI_API_KEY;
 *  vault 無 ELEVENLABS_API_KEY / RUNWAY_API_SECRET / OPENAI_API_KEY / AWS_* —
 *  無 key 的雲端條目自動優雅降級到免費模組 (設計正確性已由單測驗證)。 */
const KNOWN_PROVIDERS = new Set([
  'edge-tts', 'elevenlabs', 'pillow', 'runway', 'local-fs', 's3', 'ollama', 'openrouter',
]);

/** llm 服務的模型鏈: 本地 ollama (零成本) → OpenRouter 免費模型 (金鑰增強)
 *  模型 ID 來自 GET /v1/models 實測清單 (2026-10-15): 推測的 llama-3.3-70b:free 不存在。
 *  ⚠ key 有效但帳戶 ZDR 政策擋下全部 :free 端點 — 待帳戶設定調整後自動生效 (見 model-resolver 檔頭) */
const DEFAULT_LLM_CHAIN = [
  { backend: 'ollama', model: 'qwen2.5:3b-64k', kind: 'free-local' },
  { backend: 'openrouter', model: 'nvidia/nemotron-3-super-120b-a12b:free', kind: 'cloud-key', keyEnv: 'JUNAKEY_OPENROUTER_API_KEY' },
];

const DEFAULT_SERVICE_CHAINS = {
  // 模組3 語音合成: edge-tts (免費, 多語) → ElevenLabs (金鑰增強質感)
  tts: [
    { provider: 'edge-tts', kind: 'free-local', probe: 'py:edge_tts' },
    { provider: 'elevenlabs', kind: 'cloud-key', keyEnv: 'ELEVENLABS_API_KEY' },
  ],
  // 模組4 視覺生成: Pillow 品牌漸層 (免費) → Runway B-roll (金鑰增強真實視覺)
  visual: [
    { provider: 'pillow', kind: 'free-local', probe: 'py:PIL' },
    { provider: 'runway', kind: 'cloud-key', keyEnv: 'RUNWAY_API_SECRET', keyEnvAlt: 'RUNWAY_API_KEY' },
  ],
  // 模組6 儲存: 本地 /storage (免費) → S3 (金鑰增強公開托管)
  storage: [
    { provider: 'local-fs', kind: 'free-local' },
    { provider: 's3', kind: 'cloud-key', keyEnv: 'AWS_ACCESS_KEY_ID', keyEnvAlt: 'AWS_SECRET_ACCESS_KEY' },
  ],
};

/** python 模組可用性探測 (edge-tts / Pillow)。
 *  用 execFile 引數陣列 (無 shell 插值); 模組名僅來自內部常數 (probe: 'py:XXX'), 無使用者輸入。
 *  python3 失敗回退 python (git-bash shim / cron exit 127 陷阱防護)。 */
function probePythonModule(mod, timeoutMs = 10000) {
  const expr = mod === 'PIL' ? "import PIL; print(PIL.__version__)" : `import ${mod}; print('ok')`;
  const tryPy = (bin) => new Promise((resolve, reject) => {
    execFile(bin, ['-c', expr], { timeout: timeoutMs, windowsHide: true }, (err, stdout) => {
      const out = (stdout || '').trim();
      if (err || !out) {
        reject(new Error(`${bin}: ${mod} 不可用${err ? ` (${err.code || err.message})` : ' (no output)'}`));
      } else {
        resolve({ version: out });
      }
    });
  });
  return tryPy('python3').catch(() => tryPy('python'));
}

/** 本地檔案系統可寫性探測 (儲存服務 free-local 的鐵證)。 */
function probeLocalFs(dir) {
  return new Promise((resolve, reject) => {
    const target = dir || process.cwd();
    const probeFile = `${target}/.junaikey-probe-${process.pid}`;
    fs.writeFile(probeFile, 'ok', (werr) => {
      if (werr) return reject(new Error(`local-fs 不可寫: ${werr.message}`));
      fs.unlink(probeFile, (uerr) => {
        if (uerr) return reject(new Error(`local-fs 清理失敗: ${uerr.message}`));
        resolve({ dir: target });
      });
    });
  });
}

/** 建眾鑰之首 service resolver。opts: { chains, llmChain, ollamaUrl, timeoutMs, log, probePythonModuleFn, probeLocalFsFn, modelResolverFactory, env } */
export function createServiceResolver({ chains = DEFAULT_SERVICE_CHAINS, llmChain, ollamaUrl, timeoutMs = 15000, log = console.error, probePythonModuleFn = probePythonModule, probeLocalFsFn = probeLocalFs, modelResolverFactory = createModelResolver, env = process.env } = {}) {
  const serviceNames = [...Object.keys(chains), 'llm'];

  // ── 內部: 探測單一服務候選是否可用 (失敗即 throw, 由鏈接續) ──
  async function probeOne(c) {
    const started = Date.now();
    if (typeof c.probe === 'string' && c.probe.startsWith('py:')) {
      const r = await probePythonModuleFn(c.probe.slice(3), timeoutMs);
      return { ok: true, ...r, latencyMs: Date.now() - started };
    }
    if (c.provider === 'local-fs') {
      const r = await probeLocalFsFn(c.dir);
      return { ok: true, ...r, latencyMs: Date.now() - started };
    }
    if (c.kind === 'cloud-key') {
      const key = env[c.keyEnv] || (c.keyEnvAlt && env[c.keyEnvAlt]);
      if (!key) {
        throw new Error(`${c.provider} 無 API key (${c.keyEnv}${c.keyEnvAlt ? ` / ${c.keyEnvAlt}` : ''} 未設)`);
      }
      // 不實際呼叫雲端 (避免費用/速率), 僅確認 key 存在
      return { ok: true, latencyMs: Date.now() - started, keyPresent: true };
    }
    throw new Error(`未知 provider: ${c.provider}`);
  }

  // ── 公開: 解析眾鑰之首權威服務 ──
  // 回傳 { ok, service, selectedProvider, kind, reason, probeChain }
  async function resolve(name, opts = {}) {
    const preferred = opts.preferred ?? null;

    // llm: 委派眾鑰之首 L3 model-resolver (同一權威, 同一鏈)
    if (name === 'llm') {
      const mr = modelResolverFactory({
        chain: llmChain || DEFAULT_LLM_CHAIN,
        ollamaUrl,
        timeoutMs: Math.max(timeoutMs, 30000), // 模型冷載入需 30s (modelkey-coldload-timeout 教訓)
        env,
      });
      const r = await mr.resolve(preferred);
      return Object.freeze({ ...r, service: 'llm', selectedProvider: r.selectedBackend });
    }

    const chain = chains[name];
    if (!chain) {
      throw new Error(`未知 service: ${name} (可用: ${serviceNames.join(', ')})`);
    }

    const candidates = [];
    if (preferred) {
      if (typeof preferred === 'string') {
        if (KNOWN_PROVIDERS.has(preferred)) {
          const found = chain.find(c => c.provider === preferred);
          // 保留鏈上規格 (kind/probe/keyEnv), 僅標記 preferred —
          // kind 是 probeOne 的分派依據, 不可覆寫 (preferred-clobbers-kind 教訓)
          candidates.push(found ? { ...found, preferred: true } : { provider: preferred, kind: 'cloud-key', preferred: true });
        } else {
          throw new Error(`未知 provider: ${preferred} (可用: ${chain.map(c => c.provider).join(', ')})`);
        }
      } else {
        candidates.push({ ...preferred, preferred: true });
      }
    }
    candidates.push(...chain);

    const probeChain = [];
    for (const c of candidates) {
      let res;
      try {
        res = await withRetry(() => probeOne(c), { maxRetries: 1, baseDelay: 300 });
      } catch (e) {
        res = { ok: false, error: e.message || String(e) };
      }
      probeChain.push({
        provider: c.provider, kind: c.kind,
        ok: !!res.ok, error: res.error || null,
        latencyMs: res.latencyMs || 0, version: res.version || null, keyPresent: !!res.keyPresent,
      });
      if (res.ok) {
        return Object.freeze({
          ok: true,
          service: name,
          selectedProvider: c.provider,
          kind: c.kind,
          reason: `眾鑰之首選定: ${c.provider} (${c.kind})`,
          probeChain: Object.freeze(probeChain),
          timestamp: new Date().toISOString(),
        });
      }
    }
    return Object.freeze({
      ok: false,
      service: name,
      selectedProvider: null,
      reason: `眾鑰之首服務備援鏈全數不可用 (試了 ${probeChain.length} 個)`,
      probeChain: Object.freeze(probeChain),
      timestamp: new Date().toISOString(),
    });
  }

  return { resolve, serviceNames: Object.freeze(serviceNames) };
}
