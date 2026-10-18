#!/usr/bin/env node

// ============================================================
// Smart AI Router — 免費模組自動轉換路由器
// 
// 功能：
//   - 按 fallback chain 嘗試免費 LLM API
//   - 追蹤 rate limit，快到限額自動換模組
//   - OpenAI 相容輸出格式
//   - 從 vault env 載入 API keys
//
// 可用模組（已驗證 2026-10-16）：
//   - NVIDIA NIM: nemotron-3-super-120b-a12b, gpt-oss-20b
//   - Gemini: gemini-3.1-flash-lite, gemini-3-flash-preview
//
// 5T 協定：
//   - Traceable: 所有請求記錄 provider + model + timestamp
//   - Trackable: rate limit 追蹤 + fallback 事件記錄
//   - Tangible: 結構化輸出 + 錯誤訊息清晰
//   - Transparent: 決策邏輯公開（fallback chain + rate limit）
//   - Trustworthy: API keys 只從 vault 讀取，不落地
// ============================================================

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 預設設定 ──────────────────────────────────────────────
const DEFAULT_CONFIG = {
  providers: {
    nvidia: {
      name: 'NVIDIA NIM',
      endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
      apiKeyEnv: 'NVIDIA_API_KEY',
      models: [
        'nvidia/nemotron-3-super-120b-a12b',
        'openai/gpt-oss-20b',
      ],
      rateLimit: 60,        // requests per minute
      priority: 1,          // 數字小 = 優先
      format: 'openai',     // 輸出格式
    },
    gemini: {
      name: 'Google Gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
      apiKeyEnv: 'GEMINI_API_KEY',
      models: [
        'gemini-3.1-flash-lite',
        'gemini-3-flash-preview',
      ],
      rateLimit: 60,
      priority: 2,
      format: 'gemini',
    },
  },
  fallbackChain: ['nvidia', 'gemini'],
  rateLimitThreshold: 0.8,   // 80% 時切換到下一個
  maxRetries: 2,             // 每個 provider 重試次數
  retryDelayMs: 1000,        // 重試間隔
  vaultEnvPath: 'C:/Users/dingj/secret-vault/ENV20230818.env',
  requestTimeoutMs: 30000,   // 30s timeout
};

// ── Rate Limit Tracker ────────────────────────────────────
class RateLimitTracker {
  constructor() {
    this.requests = new Map();  // provider -> Array<timestamp>
  }

  record(provider) {
    if (!this.requests.has(provider)) {
      this.requests.set(provider, []);
    }
    this.requests.get(provider).push(Date.now());
  }

  getRecentCount(provider, windowMs = 60000) {
    const timestamps = this.requests.get(provider) || [];
    const cutoff = Date.now() - windowMs;
    return timestamps.filter(t => t > cutoff).length;
  }

  isNearLimit(provider, config) {
    const count = this.getRecentCount(provider);
    const limit = config.rateLimit;
    return count >= limit * DEFAULT_CONFIG.rateLimitThreshold;
  }

  reset() {
    this.requests.clear();
  }
}

// ── Vault Env Loader ──────────────────────────────────────
function loadVaultEnv(vaultPath) {
  const envPath = resolve(vaultPath || DEFAULT_CONFIG.vaultEnvPath);
  
  if (!existsSync(envPath)) {
    throw new Error(`Vault env file not found: ${envPath}`);
  }

  const content = readFileSync(envPath, 'utf-8');
  const env = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      let value = match[2];
      // 移除引號
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // 移除行內註解（# 開頭）
      const hashIdx = value.indexOf(' #');
      if (hashIdx > 0) {
        value = value.slice(0, hashIdx).trim();
      }
      env[match[1]] = value;
    }
  }

  return env;
}

// ── API Callers ───────────────────────────────────────────

/**
 * 呼叫 NVIDIA NIM（OpenAI 相容格式）
 */
async function callNVIDIA(config, apiKey, messages, options = {}) {
  const model = options.model || config.models[0];
  
  const body = {
    model,
    messages,
    max_tokens: options.maxTokens || 1024,
    temperature: options.temperature ?? 0.7,
  };

  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(DEFAULT_CONFIG.requestTimeoutMs),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`NVIDIA NIM ${response.status}: ${error.detail || error.message || response.statusText}`);
  }

  const data = await response.json();
  
  // 處理 reasoning model（content 可能為 null，內容在 reasoning_content）
  const choices = (data.choices || []).map(choice => {
    const msg = choice.message || {};
    let content = msg.content;
    
    // 如果 content 為空但有 reasoning_content，使用 reasoning_content
    if (!content && msg.reasoning_content) {
      content = msg.reasoning_content;
    }
    
    return {
      ...choice,
      message: {
        ...msg,
        content: content,
      },
    };
  });
  
  // 轉換為 OpenAI 相容格式
  return {
    id: data.id || `nvidia-${Date.now()}`,
    object: 'chat.completion',
    created: data.created || Math.floor(Date.now() / 1000),
    model: data.model || model,
    choices,
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    provider: 'nvidia',
    _raw: data,
  };
}

/**
 * 呼叫 Gemini（轉換為 OpenAI 相容格式）
 */
async function callGemini(config, apiKey, messages, options = {}) {
  const model = options.model || config.models[0];
  const endpoint = config.endpoint.replace('{model}', model);

  // 轉換 OpenAI messages 為 Gemini contents
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
    },
  };

  const url = `${endpoint}?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(DEFAULT_CONFIG.requestTimeoutMs),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Gemini ${response.status}: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  // 轉換為 OpenAI 相容格式
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  return {
    id: `gemini-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: text,
      },
      finish_reason: data.candidates?.[0]?.finishReason === 'STOP' ? 'stop' : 'length',
    }],
    usage: {
      prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
      completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      total_tokens: data.usageMetadata?.totalTokenCount || 0,
    },
    provider: 'gemini',
    _raw: data,
  };
}

// ── Smart Router Core ─────────────────────────────────────

export class SmartAIRouter {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tracker = new RateLimitTracker();
    this.env = null;
    this.stats = {
      totalRequests: 0,
      providerCalls: {},
      fallbackEvents: [],
      errors: [],
    };
  }

  /**
   * 初始化：載入 vault env
   */
  init() {
    this.env = loadVaultEnv(this.config.vaultEnvPath);
    return this;
  }

  /**
   * 取得 provider 的 API key
   */
  getApiKey(providerId) {
    const provider = this.config.providers[providerId];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }
    
    const key = this.env?.[provider.apiKeyEnv];
    if (!key) {
      throw new Error(`API key not found: ${provider.apiKeyEnv} (provider: ${providerId})`);
    }
    
    return key;
  }

  /**
   * 檢查 provider 是否可用（rate limit 未超）
   */
  isProviderAvailable(providerId) {
    const provider = this.config.providers[providerId];
    if (!provider) return false;
    
    // 檢查 API key 是否存在
    try {
      this.getApiKey(providerId);
    } catch {
      return false;
    }
    
    // 檢查 rate limit
    return !this.tracker.isNearLimit(providerId, provider);
  }

  /**
   * 取得下一個可用的 provider
   */
  getNextAvailableProvider(preferredProviderId = null) {
    const chain = [...this.config.fallbackChain];
    
    // 如果指定了 preferred provider，移到最前
    if (preferredProviderId && chain.includes(preferredProviderId)) {
      chain.splice(chain.indexOf(preferredProviderId), 1);
      chain.unshift(preferredProviderId);
    }

    for (const providerId of chain) {
      if (this.isProviderAvailable(providerId)) {
        return providerId;
      }
    }
    
    return null;
  }

  /**
   * 執行 chat completion
   */
  async chat(messages, options = {}) {
    if (!this.env) {
      this.init();
    }

    this.stats.totalRequests++;

    const preferredProvider = options.provider || null;
    const errors = [];

    // 嘗試所有可用的 provider
    const attemptedProviders = new Set();
    let maxAttempts = this.config.maxRetries + 1;

    while (maxAttempts > 0) {
      const providerId = this.getNextAvailableProvider(
        attemptedProviders.size === 0 ? preferredProvider : null
      );

      if (!providerId) {
        // 所有 provider 都不可用，重置 tracker 再試一次
        if (attemptedProviders.size < this.config.fallbackChain.length) {
          this.tracker.reset();
          attemptedProviders.clear();
          maxAttempts--;
          continue;
        }
        break;
      }

      if (attemptedProviders.has(providerId)) {
        maxAttempts--;
        continue;
      }

      attemptedProviders.add(providerId);
      const provider = this.config.providers[providerId];
      const apiKey = this.getApiKey(providerId);

      // 記錄請求
      this.tracker.record(providerId);
      this.stats.providerCalls[providerId] = (this.stats.providerCalls[providerId] || 0) + 1;

      try {
        let result;
        if (provider.format === 'gemini') {
          result = await callGemini(provider, apiKey, messages, options);
        } else {
          result = await callNVIDIA(provider, apiKey, messages, options);
        }

        // 記錄 fallback 事件（如果不是首選 provider）
        if (preferredProvider && providerId !== preferredProvider) {
          this.stats.fallbackEvents.push({
            timestamp: new Date().toISOString(),
            from: preferredProvider,
            to: providerId,
            reason: this.tracker.isNearLimit(preferredProvider, this.config.providers[preferredProvider]) 
              ? 'rate_limit' 
              : 'error',
          });
        }

        return result;

      } catch (error) {
        const errorRecord = {
          timestamp: new Date().toISOString(),
          provider: providerId,
          error: error.message,
        };
        this.stats.errors.push(errorRecord);
        errors.push(errorRecord);

        // 如果是 rate limit 錯誤，強制切換 provider
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          this.tracker.requests.set(
            providerId, 
            this.tracker.requests.get(providerId)?.concat(Array(10).fill(Date.now())) || []
          );
        }

        maxAttempts--;
        if (maxAttempts > 0) {
          await new Promise(r => setTimeout(r, this.config.retryDelayMs));
        }
      }
    }

    // 所有 provider 都失敗
    const errorMsg = errors.map(e => `[${e.provider}] ${e.error}`).join('; ');
    throw new Error(`All providers failed: ${errorMsg}`);
  }

  /**
   * 取得統計資訊
   */
  getStats() {
    return {
      ...this.stats,
      rateLimits: Object.fromEntries(
        this.config.fallbackChain.map(id => [
          id,
          {
            recent: this.tracker.getRecentCount(id),
            limit: this.config.providers[id]?.rateLimit || 0,
            available: this.isProviderAvailable(id),
          }
        ])
      ),
    };
  }

  /**
   * 健康檢查
   */
  async healthCheck() {
    if (!this.env) {
      this.init();
    }

    const results = {};
    for (const [id, provider] of Object.entries(this.config.providers)) {
      try {
        const apiKey = this.getApiKey(id);
        const result = await this.chat([{ role: 'user', content: 'ping' }], { 
          provider: id, 
          maxTokens: 5 
        });
        results[id] = { 
          status: 'ok', 
          model: result.model,
          latency: Date.now(),
        };
      } catch (error) {
        results[id] = { status: 'error', error: error.message };
      }
    }
    return results;
  }
}

// ── CLI 介面 ──────────────────────────────────────────────

export async function runCLI() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Smart AI Router — 免費模組自動轉換路由器

Usage:
  node smart-ai-router.mjs chat <message> [options]
  node smart-ai-router.mjs health
  node smart-ai-router.mjs stats

Options:
  --provider <id>    指定 provider (nvidia|gemini)
  --model <name>     指定模型
  --max-tokens <n>   最大 token 數
  --json             輸出 JSON 格式

Examples:
  node smart-ai-router.mjs chat "Hello, how are you?"
  node smart-ai-router.mjs chat "Write a poem" --provider gemini
  node smart-ai-router.mjs health
  node smart-ai-router.mjs stats --json
`);
    return;
  }

  const router = new SmartAIRouter().init();

  if (args[0] === 'health') {
    const health = await router.healthCheck();
    console.log(JSON.stringify(health, null, 2));
    return;
  }

  if (args[0] === 'stats') {
    const stats = router.getStats();
    console.log(JSON.stringify(stats, null, 2));
    return;
  }

  if (args[0] === 'chat') {
    const message = args[1];
    if (!message) {
      console.error('Error: message is required');
      process.exit(1);
    }

    // 解析 options
    const options = {};
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--provider' && args[i + 1]) {
        options.provider = args[i + 1];
        i++;
      } else if (args[i] === '--model' && args[i + 1]) {
        options.model = args[i + 1];
        i++;
      } else if (args[i] === '--max-tokens' && args[i + 1]) {
        options.maxTokens = parseInt(args[i + 1]);
        i++;
      }
    }

    try {
      const result = await router.chat([{ role: 'user', content: message }], options);
      
      if (args.includes('--json')) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const content = result.choices?.[0]?.message?.content || '(no content)';
        console.log(content);
        console.log(`\n---\nProvider: ${result.provider} | Model: ${result.model}`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  console.error(`Unknown command: ${args[0]}`);
  process.exit(1);
}

// 如果直接執行（非 import）
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
