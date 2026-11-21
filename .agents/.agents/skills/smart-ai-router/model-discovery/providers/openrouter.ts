/**
 * OpenRouter 供應商整合
 * 獲取 OpenRouter 上的免費模型列表
 */

import type { FreeModel, ProviderInfo } from '../free-models';

export const OPENROUTER_PROVIDER: ProviderInfo = {
  name: 'OpenRouter',
  apiUrl: 'https://openrouter.ai/api/v1',
  apiKeyEnvVar: 'OPENROUTER_API_KEY',
  freeEndpoint: '/models',
  rateLimit: { requestsPerMinute: 10, dailyLimit: 200 }
};

// OpenRouter 免費模型常用前綴
const FREE_MODEL_PREFIXES = [
  'qwen/qwen3',
  'qwen/qwen',
  'meta-llama/llama-3',
  'google/gemini',
  'mistralai/mistral',
  'anthropic/claude-3',
  'openai/gpt-4',
  'openai/gpt-3.5-turbo'
];

export async function fetchOpenRouterFreeModels(
  apiKey?: string
): Promise<FreeModel[]> {
  const key = apiKey || process.env.OPENROUTER_API_KEY;
  
  if (!key) {
    console.warn('[OpenRouter] API key not configured, skipping...');
    return getStaticOpenRouterModels(); // fallback 到靜態列表
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': process.env.REFERER || 'https://esggo.ai',
        'X-Title': 'Smart AI Router - ESG GO'
      }
    });

    if (!response.ok) {
      console.error(`[OpenRouter] API error: ${response.status}`);
      return getStaticOpenRouterModels();
    }

    const data = await response.json();
    const models = data.data || [];

    // 篩選免費模型與熱門模型
    return models
      .filter((m: any) => 
        m.id.includes(':free') || // 明確標記為免費
        m.id.includes(':preview') || // 預覽版可能免費
        FREE_MODEL_PREFIXES.some(p => m.id.startsWith(p))
      )
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id.replace(':free', '').replace(':preview', ''),
        provider: 'openrouter' as const,
        tags: inferOpenRouterTags(m.id, m.description),
        contextWindow: m.context_length || 4096,
        maxTokens: m.max_completion_tokens || 4096,
        isFree: m.id.includes(':free') || m.pricing?.input_cost === '0',
        lastUpdated: new Date(),
        description: m.description,
        downloadUrl: m.download_url
      }));
  } catch (error) {
    console.error('[OpenRouter] Fetch failed:', error);
    return getStaticOpenRouterModels();
  }
}

// 推斷模型能力標籤
function inferOpenRouterTags(id: string, description?: string): string[] {
  const tags: string[] = [];
  const lowerId = id.toLowerCase();
  const lowerDesc = (description || '').toLowerCase();

  if (lowerId.includes('vision') || lowerId.includes('gpt-4') && lowerId.includes('vision')) {
    tags.push('vision');
  }
  if (lowerId.includes('32-90b') || lowerId.includes('vision')) {
    tags.push('large-context');
  }
  if (lowerId.includes('coder') || lowerDesc.includes('coding') || lowerDesc.includes('code')) {
    tags.push('code');
  }
  if (lowerId.includes('reasoning') || lowerDesc.includes('reasoning')) {
    tags.push('reasoning');
  }
  tags.push('chat'); // 默認都支援 chat
  return tags;
}

// 靜態fallback列表
function getStaticOpenRouterModels(): FreeModel[] {
  return [
    {
      id: 'qwen/qwen3-next-80b-a3b-instruct:free',
      name: 'Qwen3-80B',
      provider: 'openrouter',
      tags: ['chat', 'reasoning'],
      contextWindow: 32000,
      maxTokens: 4096,
      isFree: true,
      lastUpdated: new Date(),
      description: 'Qwen3 80B instruct model (free tier)'
    },
    {
      id: 'meta-llama/llama-3.2-90b-vision:free',
      name: 'Llama Vision 90B',
      provider: 'openrouter',
      tags: ['chat', 'vision'],
      contextWindow: 32000,
      maxTokens: 4096,
      isFree: true,
      lastUpdated: new Date(),
      description: 'Llama 3.2 Vision model (free tier)'
    }
  ];
}