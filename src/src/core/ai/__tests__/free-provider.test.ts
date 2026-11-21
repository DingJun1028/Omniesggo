import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  getFreeModelPool,
  getFreeTierModels,
  selectFreeModel,
  callFreeProvider,
  callChatProvider,
  resetProviderHealth,
  type ChatMessage,
  type FreeProviderConfig,
} from '../model-router';

const messages: ChatMessage[] = [{ role: 'user', content: 'ESG 測試訊息' }];

describe('FreeProvider agent layer', () => {
  beforeAll(() => {
    // 僅配置 openrouter key，使公開免費模型成為「已配置」候選（groq 視為未配置）
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.GROQ_API_KEY = '';
  });

  afterAll(() => {
    delete process.env.OPENROUTER_API_KEY;
  });

  it('getFreeModelPool / getFreeTierModels 回傳非空且 isFreeTier 標記正確', () => {
    const pool = getFreeModelPool();
    expect(Array.isArray(pool)).toBe(true);
    expect(pool.length).toBeGreaterThan(0);

    const free = getFreeTierModels();
    expect(free.length).toBeGreaterThan(0);
    expect(free.every((m) => m.isFreeTier)).toBe(true);
  });

  it('selectFreeModel 回傳可用的模型 id 字串', () => {
    const id = selectFreeModel('general');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('callFreeProvider 使用注入發送器並回傳 content + used', async () => {
    const send = vi.fn(async (cfg: FreeProviderConfig) => `MOCK:${cfg.model}`);
    const res = await callFreeProvider('general', messages, { send });

    expect(res.content).toMatch(/^MOCK:/);
    expect(res.used).toBeDefined();
    // 本地 VPS 模型（local_gemma）免 Key，路由優先於雲端，故首選為 local_gemma
    expect(res.used.provider).toBe('local_gemma');
    expect(res.used.isFreeTier).toBe(true);
  });

  it('首個模型失敗時自動轉移下一個（模型級健康降級）', async () => {
    const tried: string[] = [];
    const send = vi.fn(async (cfg: FreeProviderConfig) => {
      tried.push(cfg.model);
      if (tried.length === 1) throw new Error('first model down');
      return `MOCK:${cfg.model}`;
    });

    const res = await callFreeProvider('general', messages, { send });
    expect(tried.length).toBeGreaterThanOrEqual(2);
    expect(res.content).toMatch(/^MOCK:/);
  });

  it('所有模型皆失敗時拋出並帶 lastError', async () => {
    const send = vi.fn(async () => {
      throw new Error('boom');
    });
    await expect(callFreeProvider('general', messages, { send })).rejects.toThrow(
      /所有免費模型皆失敗/,
    );
  });

  it('敏感任務 + excludePublicFree 守門：全部公開免費端點被排除', async () => {
    const send = vi.fn(async (cfg: FreeProviderConfig) => `MOCK:${cfg.model}`);
    await expect(
      callFreeProvider('carbon_calculation', messages, {
        excludePublicFree: true,
        send,
      }),
    ).rejects.toThrow(/無已配置 API Key/);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('local_gemma (VPS Ollama) provider', () => {
  const cloudKeyEnvs = [
    'GROQ_API_KEY',
    'OPENROUTER_API_KEY',
    'TOGETHER_API_KEY',
    'MISTRAL_API_KEY',
    'GEMINI_API_KEY',
    'CLOUDFLARE_API_TOKEN',
  ];

  // 避免上層測試（如「所有模型皆失敗」）將模型健康狀態標為降級而污染本區塊
  beforeEach(() => resetProviderHealth());

  it('雲端 Key 皆未配置時，callFreeProvider 選用本地 VPS 模型（免 Key 不跳過）', async () => {
    // 清空所有雲端 Key，驗證本地模型仍可被選用（apiKeyEnv 為空視為「免 Key」）
    const saved: Record<string, string | undefined> = {};
    for (const e of cloudKeyEnvs) {
      saved[e] = process.env[e];
      delete process.env[e];
    }
    try {
      const send = vi.fn(async (cfg: FreeProviderConfig) => `MOCK:${cfg.model}`);
      const res = await callFreeProvider('general', messages, { send });
      expect(res.used.provider).toBe('local_gemma');
      expect(res.content).toMatch(/^MOCK:/);
    } finally {
      for (const e of cloudKeyEnvs) {
        if (saved[e] !== undefined) process.env[e] = saved[e] as string;
      }
    }
  });

  it('callChatProvider 將 VPS_OLLAMA_URL 端點傳給 Ollama /api/chat', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ message: { content: 'LOCAL_OK' } }),
    }));
    const prevFetch = globalThis.fetch;
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const customUrl = 'http://custom-vps:9999/api/chat';
    const prevUrl = process.env.VPS_OLLAMA_URL;
    process.env.VPS_OLLAMA_URL = customUrl;
    try {
      const cfg: FreeProviderConfig = {
        id: 'gemma3:4b',
        provider: 'local_gemma',
        model: 'gemma3:4b',
        maxTokens: 128,
        temperature: 0.7,
        apiUrl: customUrl,
        apiKeyEnv: '',
        isFreeTier: true,
      };
      const content = await callChatProvider(cfg, messages);
      expect(content).toBe('LOCAL_OK');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const calledUrl = fetchMock.mock.calls[0]?.[0];
      expect(String(calledUrl)).toBe(customUrl);
    } finally {
      if (prevUrl !== undefined) process.env.VPS_OLLAMA_URL = prevUrl;
      else delete process.env.VPS_OLLAMA_URL;
      vi.stubGlobal('fetch', prevFetch);
    }
  });
});
