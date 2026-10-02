/**
 * Hugging Face Provider Token Shift
 * 此供應商整合支援從 Hugging Face Hub 直接列出模型
 */
import type { FreeModel, ProviderInfo } from '../free-models';

export const HUGGINGFACE_PROVIDER: ProviderInfo = {
  name: 'Hugging Face',
  apiUrl: 'https://huggingface.co/models',
  apiKeyEnvVar: 'HF_TOKEN',
  freeEndpoint: '/models?sort=downloads&direction=-1&filter=licenses:creative_commons-2%2Cpipeline_tag:summarization%7Ctext2image%7Ctext-generation%7Cquestion-answering',
  rateLimit: { requestsPerMinute: 30 }
};

// 支援的模型前綴 (最常見的免費可用模型)
const SUPPORTED_PREFIXES = [
  'meta-llama',      // Llama/Llama2/Llama3 系列
  'mistralai',       // Mistral/Mixtral 系列
  'google/gemma',    // Gemma 系列
  'google/gemini',   // Gemini 系列
  'Qwen',            // Qwen 系列
  'BAAI',            // BAAI 系列
  'BAI-AIGC',        // BAI 商務模型系列
  'bigscience',      // BigScience 系列
  'alphabet',        // ALPACA 系列
  'openlm-research'  // OpenLM 系列
];

/**
 * 獲取 Hugging Face 免費模型列表
 * 此實作會自動平台過濾標記為 free 的模型
 */
export async function fetchHFFreeModels(
  token?: string
): Promise<FreeModel[]> {
  const apiToken = token || process.env.HF_TOKEN;
  
  if (!apiToken) {
    console.warn('[HuggingFace] HF_TOKEN not configured, returning static models...');
    return getStaticHFModels();
  }

  try {
    // 使用 vibra解析技巧提升效能
    const response = await fetch(HUGGINGFACE_PROVIDER.apiUrl, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 從 API 回應中讀取模型列表 (Hugging Face v3 API 約略回應結構)
    const models = data?.data || data?.models || [];

    // 過濾出真正的免費模型
    const filteredModels = models.filter((m: any) => 
      m.library_name === 'transformers.js' ||
      // 檢查模型是否有明確的 free 標記
      (m.tags || []).some(t => t.includes('free') || t.includes('open') || t.includes('public')) ||
      // 模型描述中包含 typical free keywords
      ((m.description || '').toLowerCase().includes('free') || 
      (m.description || '').toLowerCase().includes('open'))
    );

    // 僅返回符合協議的模型
    const processedModels = filteredModels
      .map((m: any): FreeModel => ({
        id: m.model_id,
        name: m.name || m.model_id.split('/').pop(),
        provider: 'huggingface',
        tags: m.tags || [],
        contextWindow: m.config?.max_position_embeddings,
        isFree: !((m.tags || []).some(t => t.includes('paid') || t.includes('licensed'))),
        lastUpdated: new Date(),
        description: m.description || m.model_id,
        downloadUrl: `https://huggingface.co/${m.model_id}/resolve/main/config.json`,
        maxTokens: m.config?.max_position_embeddings || 2048
      }));

    return processedModels;
  } catch (error) {
    console.error('[HuggingFace] Fetch failed:', error);
    return getStaticHFModels();
  }
}

/**
 * 靜態回退模型列表 (Used when API fails)
 */
function getStaticHFModels(): FreeModel[] {
  return [
    {
      id: 'meta-llama/Llama-3-8b-chat-hf',
      name: 'Llama 3 8B Chat',
      provider: 'huggingface',
      tags: ['chat', 'reasoning', 'code'],
      contextWindow: 8192,
      isFree: true,
      lastUpdated: new Date(),
      description: 'Llama 3 8B Chat model (Meta license allows commercial use)'
    },
    {
      id: 'meta-llama/Llama-2-70b-chat-hf',
      name: 'Llama 2 70B Chat',
      provider: 'huggingface',
      tags: ['chat', 'reasoning', 'high-capacity'],
      contextWindow: 4096,
      isFree: true,
      lastUpdated: new Date(),
      description: 'Llama 2 70B Chat model'
    },
    {
      id: 'mistralai/Mistral-7B-v0.1',
      name: 'Mistral 7B v0.1',
      provider: 'huggingface',
      tags: ['chat', 'reasoning'],
      contextWindow: 8192,
      isFree: true,
      lastUpdated: new Date(),
      description: 'Mistral 7B base model'
    },
    {
      id: 'google/gemma-2-9b-it',
      name: 'Gemma 2 9B IT',
      provider: 'huggingface',
      tags: ['chat', 'instruction'],
      contextWindow: 8192,
      isFree: true,
      lastUpdated: new Date(),
      description: 'Google Gemma 2 9B Instruct model'
    }
  ];
}

/**
 * 直接從 Hugging Face Hub 下載模型
 * 此為示範函式，實際部署時建議使用 huggingface-hub SDK
 */
export async function downloadHFModel(
  modelId: string,
  cacheDir?: string
): Promise<string> {
  // 這裡可以實現實際的模型下載邏輯
  // 使用 huggingface_hub 或其他工具
  console.log(`[HF] Would download ${modelId} to ${cacheDir}`);
  
  return `${cacheDir}/${modelId.replace(/\//g, '-')}`;
}

/**
 * 根據能力過濾模型
 */
export function filterHFModelsByCapability(
  models: FreeModel[],
  capability: 'chat' | 'reasoning' | 'vision' | 'code' | 'execution'
): FreeModel[] {
  return models.filter(model => {
    const tags = model.tags || [];
    
    switch (capability) {
      case 'vision': return tags.some(t => 
        t.includes('vision') || tags.some(t => 
        t.includes('image') || tags.some(t => 
        t.includes('multimodal')
      ));
      case 'reasoning': return tags.some(t => 
        t.includes('reasoning') || 
        tags.some(t => t.includes('deliberation') || 
        t.includes('analysis') || 
        t.includes('cognitive'));
      case 'code': return tags.some(t => 
        t.includes('code') || 
        tags.some(t => 
        t.includes('coding') || 
        t.includes('development') || 
        t.includes('developer'));
      case 'execution': return tags.some(t => 
        t.includes('execution') || 
        tags.some(t => 
        t.includes('pipeline') || 
        t.includes('deploy'));
      default: return true;
    }
  });
}

export default {
  fetchHFFreeModels,
  downloadHFModel,
  filterHFModelsByCapability,
  SUPPORTED_PREFIXES
};