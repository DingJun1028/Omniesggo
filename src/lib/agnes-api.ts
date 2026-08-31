// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * AGNES API Client — OpenRouter :free integration
 * 
 * Supports:
 * - OpenRouter :free models (200 req/day free tier)
 * - Fallback chain: try multiple :free models
 * - Rate limit awareness
 * - ESG-specific system prompts
 */

import { callFreeProvider } from '../core/ai/model-router';

export interface AgnesResponse {
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
  metadata: {
    timestamp: number;
    provider: string;
    model?: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };
}

// OpenRouter :free models (rotate for higher throughput)
// ⚠️ 必須帶 :free 後綴才能享受免費額度 (200 req/day)
const FREE_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'mistralai/mistral-small-3.1-24b:free',
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.2-90b-vision:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'meta-llama/llama-3.2-90b-vision:free',
  'openai/gpt-oss-120b:free',
  'google/gemma-3-27b-it:free',
  'qwen/qwen3-vl-8b:free',
  'google/gemma-2-27b-it:free',
] as const;

// Groq free models (30 req/min, no daily cap — fastest free inference)
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
] as const;

const SYSTEM_PROMPT = `你是 ESGGO 永續報告 AI 助手，專注於 ESG（環境、社會、治理）領域分析。
回答時請：
1. 使用繁體中文
2. 引用 GRI / ISSB / TCFD / TNFD 標準
3. 提供具體數據和案例
4. 保持專業且簡潔`;

export class AgnesClient {
  private apiKey: string;
  private groqKey: string;
  private modelIndex: number = 0;
  private groqModelIndex: number = 0;
  private freeTierOnly: boolean;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    this.groqKey = process.env.GROQ_API_KEY || '';
    this.freeTierOnly = process.env.FREE_TIER_ONLY === 'false' ? false : true;
  }

  /**
   * Call Groq API (fastest free inference)
   */
  private async callGroq(prompt: string, systemPrompt: string): Promise<{ output: string; model: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } } | null> {
    if (!this.groqKey) return null;
    const model = GROQ_MODELS[this.groqModelIndex % GROQ_MODELS.length];
    this.groqModelIndex++;

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!res.ok) {
        console.warn(`[AGNES] Groq ${model} failed (${res.status})`);
        return null;
      }

      const data = await res.json();
      return {
        output: data.choices?.[0]?.message?.content || '',
        model,
        usage: data.usage,
      };
    } catch (e) {
      console.warn(`[AGNES] Groq error:`, e);
      return null;
    }
  }

  /**
   * Process a request via Groq → OpenRouter :free → Mock fallback
   */
  async processRequest(input: string, context?: { systemPrompt?: string; temperature?: number }): Promise<AgnesResponse> {
    const sysPrompt = context?.systemPrompt || SYSTEM_PROMPT;

    // Priority 1: Groq (fastest, no daily cap)
    if (this.groqKey) {
      const groqResult = await this.callGroq(input, sysPrompt);
      if (groqResult) {
        return {
          success: true,
          data: { output: groqResult.output, confidence: 0.9 },
          metadata: {
            timestamp: Date.now(),
            provider: 'groq',
            model: groqResult.model,
            usage: groqResult.usage,
          },
        };
      }
    }

    // Priority 2: OpenRouter :free models
    if (this.apiKey) {
      for (let attempt = 0; attempt < FREE_MODELS.length; attempt++) {
        const model = FREE_MODELS[(this.modelIndex + attempt) % FREE_MODELS.length];
        
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
              'X-Title': 'ESGGO',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: sysPrompt },
                { role: 'user', content: input },
              ],
              temperature: context?.temperature ?? 0.7,
              max_tokens: 2048,
            }),
          });

          if (res.status === 429) continue;

          if (!res.ok) {
            const errText = await res.text();
            console.warn(`[AGNES] Model ${model} failed (${res.status}): ${errText.slice(0, 200)}`);
            continue;
          }

          const data = await res.json();
          const output = data.choices?.[0]?.message?.content || '';
          
          this.modelIndex = (this.modelIndex + 1) % FREE_MODELS.length;

          return {
            success: true,
            data: { output, confidence: 0.9 },
            metadata: {
              timestamp: Date.now(),
              provider: 'openrouter',
              model,
              usage: data.usage,
            },
          };
        } catch (e) {
          console.warn(`[AGNES] Model ${model} error:`, e);
          continue;
        }
      }
    }

    // Priority 2.5: FreeProvider agent layer
    // 涵蓋 together / mistral / gemini / cloudflare 等 agnes 未覆蓋的免費端點，
    // 並帶 15s 逾時與模型級健康降級。失敗即退回既有 Mock，不影響 Groq / OpenRouter 成功路徑。
    try {
      const fp = await callFreeProvider(
        'general',
        [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: input },
        ],
        { maxTokens: 2048, temperature: context?.temperature ?? 0.7 },
      );
      return {
        success: true,
        data: { output: fp.content, confidence: 0.85 },
        metadata: {
          timestamp: Date.now(),
          provider: 'free-provider',
          model: fp.used.model,
        },
      };
    } catch (e) {
      console.warn(`[AGNES] FreeProvider fallback 失敗，退回 Mock:`, e);
    }

    // Priority 3: Mock fallback
    return this.mockResponse(input);
  }

  /**
   * Get system metrics
   */
  async getMetrics(): Promise<AgnesResponse> {
    return {
      success: true,
      data: {
        activeNodes: FREE_MODELS.length + GROQ_MODELS.length,
        openrouter: { models: [...FREE_MODELS], current: FREE_MODELS[this.modelIndex] },
        groq: { models: [...GROQ_MODELS], current: GROQ_MODELS[this.groqModelIndex % GROQ_MODELS.length] },
        throughput: this.groqKey ? 'Groq + OpenRouter :free' : 'OpenRouter :free',
      },
      metadata: {
        timestamp: Date.now(),
        provider: this.groqKey ? 'groq+openrouter' : 'openrouter',
      },
    };
  }

  /**
   * Mock fallback when no API key or all models fail
   */
  private async mockResponse(input: string): Promise<AgnesResponse> {
    return {
      success: true,
      data: {
        output: `[AGNES Mock] 已收到您的 ESG 查詢：「${input.slice(0, 100)}」。設定 GROQ_API_KEY 或 OPENROUTER_API_KEY 即可啟用真實 AI 回應。`,
        confidence: 0.5,
        mock: true,
      },
      metadata: {
        timestamp: Date.now(),
        provider: 'mock',
      },
    };
  }
}

// Singleton instance for server-side usage
export const agnesApi = new AgnesClient();
