/**
 * Groq 供應商整合
 * 獲取 Groq 上的免費模型列表與調用
 */

import type { FreeModel, ProviderInfo } from '../free-models';

export const GROQ_PROVIDER: ProviderInfo = {
  name: 'Groq',
  apiUrl: 'https://api.groq.com/v1',
  apiKeyEnvVar: 'GROQ_API_KEY',
  freeEndpoint: '/models',
  rateLimit: { requestsPerMinute: 30 }
};

// Groq 常用免費模型 ID
const FREE_MODEL_IDS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma-2-9b-it',
  'qwen-2.5-32b-Preview',
  'mixtral-8x7b-32768'
];

/**
 * 獲取 Groq 免費模型列表
 */
export async function fetchGroqFreeModels(
  apiKey?: string
): Promise<FreeModel[]> {
  const key = apiKey || process.env.GROQ_API_KEY;
  
  if (!key) {
    console.warn('[Groq] API key not configured, returning static models...');
    return getStaticGroqModels();
  }

  try {
    const response = await fetch('https://api.groq.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];

    return models
      .filter((m: any) => FREE_MODEL_IDS.includes(m.id))
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        provider: 'groq' as const,
        tags: inferGroqTags(m.id, m.description),
        contextWindow: m.context_window,
        maxTokens: m.max_tokens,
        isFree: true,
        lastUpdated: new Date(),
        description: m.description
      }));
  } catch (error) {
    console.error('[Groq] Fetch failed:', error);
    return getStaticGroqModels();
  }
}

/**
 * 推斷 Groq 模型標籤
 */
function inferGroqTags(id: string, description?: string): string[] {
  const tags: string[] = [];
  const lowerId = id.toLowerCase();

  if (lowerId.includes('llama')) {
    tags.push('reasoning', 'chat', 'code');
  }
  if (lowerId.includes('gemma')) {
    tags.push('chat', 'coding');
  }
  if (lowerId.includes('mixtral')) {
    tags.push('reasoning', 'chat');
  }
  if (lowerId.includes('vision')) {
    tags.push('vision');
  }
  if (lowerId.includes('instruct')) {
    tags.push('instruction-following');
  }
  if (lowerId.includes('preview')) {
    tags.push('preview', 'beta');
  }

  // 根據上下文窗口推斷
  if (id.includes('32b') || id.includes('70b')) {
    tags.push('large-context');
  }

  tags.push('chat'); // Groq 模型都支援 chat
  return tags;
}

/**
 * 靜態備用模型列表
 */
function getStaticGroqModels(): FreeModel[] {
  return [
    {
      id: 'llama-3.3-70b-versatile',
      name: 'Llama 3.3 70B Versatile',
      provider: 'groq',
      tags: ['chat', 'reasoning', 'code', 'large-context'],
      contextWindow: 32768,
      maxTokens: 32768,
      isFree: true,
      lastUpdated: new Date(),
      description: 'High-performance Llama model for various tasks'
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      provider: 'groq',
      tags: ['chat', 'speed'],
      contextWindow: 8192,
      maxTokens: 8192,
      isFree: true,
      lastUpdated: new Date(),
      description: 'Fast inference Llama model'
    },
    {
      id: 'gemma-2-9b-it',
      name: 'Gemma 2 9B IT',
      provider: 'groq',
      tags: ['chat', 'coding', 'instruction-following'],
      contextWindow: 8192,
      maxTokens: 8192,
      isFree: true,
      lastUpdated: new Date(),
      description: 'Google Gemma model optimized for instruction following'
    }
  ];
}

/**
 * 調用 Groq 模型
 */
export async function callGroqModel(
  modelId: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
  } = {}
): Promise<{ content: string; usage?: any }> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const response = await fetch('https://api.groq.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.3,
      stream: options.stream ?? false
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Groq API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage
  };
}

/**
 * 獲取模型推薦 (根據任務類型)
 */
export function getGroqModelForTask(taskType: string): string {
  const recommendations: Record<string, string> = {
    'carbon_calculation': 'llama-3.3-70b-versatile',
    'compliance_review': 'llama-3.3-70b-versatile',
    'tcfd_analysis': 'llama-3.3-70b-versatile',
    'sdg_mapping': 'llama-3.3-70b-versatile',
    'evidence_ocr': 'llama-3.1-8b-instant',
    'email_archive': 'llama-3.1-8b-instant',
    'general': 'llama-3.3-70b-versatile',
    'code': 'llama-3.3-70b-versatile',
    'reasoning': 'llama-3.3-70b-versatile'
  };

  return recommendations[taskType] || recommendations['general'];
}

export default {
  fetchGroqFreeModels,
  callGroqModel,
  getGroqModelForTask,
  FREE_MODEL_IDS
};