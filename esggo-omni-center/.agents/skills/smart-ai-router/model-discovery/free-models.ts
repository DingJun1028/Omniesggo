/**
 * 動態發現免費 AI 模型
 * 從 OpenRouter、Groq、Hugging Face 等平台獲取最新免費模型列表
 */

export interface FreeModel {
  id: string;
  name: string;
  provider: 'openrouter' | 'groq' | 'huggingface' | 'gemini';
  tags: string[];
  contextWindow?: number;
  maxTokens?: number;
  isFree: boolean;
  lastUpdated: Date;
  description?: string;
  downloadUrl?: string; // 用於模型轉換
}

export interface ProviderInfo {
  name: string;
  apiUrl: string;
  apiKeyEnvVar: string;
  freeEndpoint: string;
  rateLimit: {
    requestsPerMinute: number;
    dailyLimit?: number;
  };
}

// 供應商配置
export const PROVIDERS: Record<string, ProviderInfo> = {
  openrouter: {
    name: 'OpenRouter',
    apiUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnvVar: 'OPENROUTER_API_KEY',
    freeEndpoint: '/models?tags=free',
    rateLimit: { requestsPerMinute: 10, dailyLimit: 200 }
  },
  groq: {
    name: 'Groq',
    apiUrl: 'https://api.groq.com/v1',
    apiKeyEnvVar: 'GROQ_API_KEY',
    freeEndpoint: '/models',
    rateLimit: { requestsPerMinute: 30 }
  },
  huggingface: {
    name: 'Hugging Face',
    apiUrl: 'https://huggingface.co/api',
    apiKeyEnvVar: 'HF_TOKEN',
    freeEndpoint: '/models?sort=downloads&direction=-1&filter=pytorch',
    rateLimit: { requestsPerMinute: 30 }
  },
  gemini: {
    name: 'Gemini',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyEnvVar: 'GOOGLE_API_KEY',
    freeEndpoint: '/models',
    rateLimit: { requestsPerMinute: 15, dailyLimit: 1500 }
  }
};

import { fetch } from 'undici';

/**
 * 從 OpenRouter 獲取免費模型列表
 */
export async function fetchOpenRouterModels(): Promise<FreeModel[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn('OpenRouter API key not found, skipping...');
    return [];
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://esggo.ai',
        'X-Title': 'ESG GO Smart AI Router'
      }
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];

    return models
      .filter((m: any) => m.id.includes(':free') || m.pricing?.creators === 0)
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        provider: 'openrouter' as const,
        tags: m.context === 'chat' ? ['chat', 'reasoning'] : ['completion'],
        contextWindow: m.context_length,
        maxTokens: m.max_context_length,
        isFree: true,
        lastUpdated: new Date(),
        description: m.description,
        downloadUrl: m.download_url
      }));
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    return [];
  }
}

/**
 * 從 Groq 獲取免費模型列表
 */
export async function fetchGroqModels(): Promise<FreeModel[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('Groq API key not found, skipping...');
    return [];
  }

  try {
    const response = await fetch('https://api.groq.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];

    return models
      .filter((m: any) => m.id.includes('llama') || m.id.includes('gemma'))
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        provider: 'groq' as const,
        tags: m.tags || ['chat'],
        contextWindow: m.context_window,
        maxTokens: m.max_tokens,
        isFree: true,
        lastUpdated: new Date(),
        description: m.description
      }));
  } catch (error) {
    console.error('Error fetching Groq models:', error);
    return [];
  }
}

/**
 * 從 Hugging Face 獲取免費模型列表
 */
export async function fetchHuggingFaceModels(): Promise<FreeModel[]> {
  const token = process.env.HF_TOKEN;
  if (!token) {
    console.warn('Hugging Face token not found, skipping...');
    return [];
  }

  try {
    const response = await fetch('https://huggingface.co/api/models?sort=downloads&limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const models = await response.json();

    return models
      .filter((m: any) => 
        m.library_name === 'transformers.js' || 
        m.tags?.includes('transformers.js') ||
        m.tags?.includes('onnx')
      )
      .map((m: any) => ({
        id: m.modelId,
        name: m.modelId.split('/').pop() || m.modelId,
        provider: 'huggingface' as const,
        tags: m.tags || [],
        contextWindow: m.config?.max_position_embeddings,
        isFree: true,
        lastUpdated: new Date(),
        description: m.config?.description || m.snippet,
        downloadUrl: `https://huggingface.co/${m.modelId}/resolve/main/config.json`
      }));
  } catch (error) {
    console.error('Error fetching HuggingFace models:', error);
    return [];
  }
}

/**
 * 獲取所有平台的免費模型（整合來源）
 */
export async function discoverAllFreeModels(): Promise<FreeModel[]> {
  const [openrouterModels, groqModels, huggingfaceModels] = await Promise.allSettled([
    fetchOpenRouterModels(),
    fetchGroqModels(),
    fetchHuggingFaceModels()
  ]);

  const allModels: FreeModel[] = [];

  if (openrouterModels.status === 'fulfilled') {
    allModels.push(...openrouterModels.value);
  }
  if (groqModels.status === 'fulfilled') {
    allModels.push(...groqModels.value);
  }
  if (huggingfaceModels.status === 'fulfilled') {
    allModels.push(...huggingfaceModels.value);
  }

  // 去重（基於模型 ID）
  const seen = new Set<string>();
  return allModels.filter(model => {
    if (seen.has(model.id)) return false;
    seen.add(model.id);
    return true;
  });
}

/**
 * 根據能力過濾模型
 */
export function filterModelsByCapability(
  models: FreeModel[],
  capability: 'chat' | 'reasoning' | 'vision' | 'embedding' | 'code'
): FreeModel[] {
  return models.filter(model => {
    if (capability === 'vision') {
      return model.tags.includes('vision') || model.tags.includes('image');
    }
    if (capability === 'code') {
      return model.tags.includes('code') || model.tags.includes('coding');
    }
    if (capability === 'reasoning') {
      return model.tags.includes('reasoning') || model.id.includes('qwen') || model.id.includes('llama');
    }
    return model.tags.includes(capability);
  });
}

/**
 * 根據上下文窗口長度排序
 */
export function sortByContextWindow(models: FreeModel[]): FreeModel[] {
  return [...models].sort((a, b) => {
    const aCtx = a.contextWindow || 0;
    const bCtx = b.contextWindow || 0;
    return bCtx - aCtx;
  });
}

/**
 * 快取模型列表（簡易實作）
 */
const MODEL_CACHE: {
  data: FreeModel[];
  timestamp: number;
  ttl: number;
} = {
  data: [],
  timestamp: 0,
  ttl: 30 * 60 * 1000 // 30 分鐘
};

export async function getCachedFreeModels(forceRefresh = false): Promise<FreeModel[]> {
  const now = Date.now();
  if (!forceRefresh && now - MODEL_CACHE.timestamp < MODEL_CACHE.ttl && MODEL_CACHE.data.length > 0) {
    return MODEL_CACHE.data;
  }

  const models = await discoverAllFreeModels();
  MODEL_CACHE.data = models;
  MODEL_CACHE.timestamp = now;
  return models;
}

export default {
  fetchOpenRouterModels,
  fetchGroqModels,
  fetchHuggingFaceModels,
  discoverAllFreeModels,
  filterModelsByCapability,
  sortByContextWindow,
  getCachedFreeModels
};