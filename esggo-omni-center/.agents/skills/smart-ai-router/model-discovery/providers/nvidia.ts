/**
 * NVIDIA Provider Integration
 * 從 NVIDIA NGC/Nemotron 獲取免費模型
 */

import type { FreeModel, ProviderInfo } from '../free-models';
import { fetch } from 'undici';

export const NVIDIA_PROVIDER: ProviderInfo = {
  name: 'NVIDIA',
  apiUrl: 'https://integrate.api.nvidia.com/v1',
  apiKeyEnvVar: 'NVIDIA_API_KEY',
  freeEndpoint: '/models',
  rateLimit: { requestsPerMinute: 30 }
};

// NVIDIA 免費模型列表 (Nemotron 系列)
const NVIDIA_FREE_MODELS = [
  'nvidia/nemotron-4-340b-reward',
  'nvidia/nemotron-4-340b-function-calling',
  'nvidia/nemotron-4-340b-code',
  'nvidia/llama-3.1-nemotron-70b-instruct'
];

/**
 * 從 NVIDIA API 獲取免費模型列表
 */
export async function fetchNVIDIAModels(apiKey?: string): Promise<FreeModel[]> {
  const key = apiKey || process.env.NVIDIA_API_KEY;
  
  if (!key) {
    console.warn('[NVIDIA] API key not configured, returning static models...');
    return getStaticNVIDIAModels();
  }

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`NVIDIA API error: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];

    return models
      .filter((m: any) => NVIDIA_FREE_MODELS.includes(m.id))
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id.split('/').pop(),
        provider: 'nvidia' as const,
        tags: inferNVIDIATags(m.id),
        contextWindow: m.context_length || 4096,
        maxTokens: m.max_tokens || 4096,
        isFree: true,
        lastUpdated: new Date(),
        description: m.description
      }));
  } catch (error) {
    console.error('[NVIDIA] Fetch failed:', error);
    return getStaticNVIDIAModels();
  }
}

function inferNVIDIATags(id: string): string[] {
  const tags: string[] = [];
  const lowerId = id.toLowerCase();

  if (lowerId.includes('reward')) tags.push('reward-model');
  if (lowerId.includes('function-calling')) tags.push('function-calling', 'tool-use');
  if (lowerId.includes('code')) tags.push('code', 'coding-assistant');
  if (lowerId.includes('instruct')) tags.push('instruction-following');
  if (lowerId.includes('70b')) tags.push('large-model');
  
  tags.push('chat'); // 默认支援
  return tags;
}

function getStaticNVIDIAModels(): FreeModel[] {
  return [
    {
      id: 'nvidia/nemotron-4-340b-reward',
      name: 'Nemotron 4 340B Reward',
      provider: 'nvidia',
      tags: ['reward-model', 'reasoning'],
      contextWindow: 32768,
      maxTokens: 4096,
      isFree: true,
      lastUpdated: new Date(),
      description: 'NVIDIA Nemotron Reward Model for preference ranking'
    },
    {
      id: 'nvidia/nemotron-4-340b-function-calling',
      name: 'Nemotron 4 340B Function Calling',
      provider: 'nvidia',
      tags: ['function-calling', 'tool-use', 'chat'],
      contextWindow: 32768,
      maxTokens: 4096,
      isFree: true,
      lastUpdated: new Date(),
      description: 'NVIDIA Nemotron with native function calling support'
    },
    {
      id: 'nvidia/llama-3.1-nemotron-70b-instruct',
      name: 'Llama 3.1 Nemotron 70B Instruct',
      provider: 'nvidia',
      tags: ['chat', 'instruction-following', 'large-model'],
      contextWindow: 8192,
      maxTokens: 8192,
      isFree: true,
      lastUpdated: new Date(),
      description: 'NVIDIA optimized Llama 3.1 70B instruction model'
    }
  ];
}

/**
 * NVIDIA 模型調用
 */
export async function callNVIDIAModel(
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  options: {
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
  } = {}
): Promise<{ content: string; usage?: any }> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY not configured');
  }

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
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
    throw new Error(`NVIDIA API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage
  };
}

export default {
  fetchNVIDIAModels,
  callNVIDIAModel,
  NVIDIA_FREE_MODELS
};