// ============================================================================
// Registry Data
// ============================================================================
const MODEL_REGISTRY_SCHEMA_VERSION = 2;
// Text/Realtime Models (92 total)
const TEXT_MODELS = [
    // OpenAI (48 models)
    {
        id: 'gpt-5.6-sol',
        vendor: Vendor.OpenAI,
        displayName: 'GPT-5.6 Sol',
        aliases: ['gpt-5.6'],
        lifecycle: 'active',
        endpoints: { openai: 'gpt-5.6-sol' },
        contextWindow: { input: 1050000, output: 16384 },
        features: { input: { tokens: 1050000 }, output: { tokens: 16384 }, vision: true, tools: true, promptCaching: true },
        pricing: { input: 1.00, output: 4.00 },
        officialSources: ['https://platform.openai.com/docs/models/gpt-5.6'],
    },
    {
        id: 'gpt-5.6-terra',
        vendor: Vendor.OpenAI,
        displayName: 'GPT-5.6 Terra',
        aliases: ['gpt-5.6-t'],
        lifecycle: 'active',
        endpoints: { openai: 'gpt-5.6-terra' },
        contextWindow: { input: 1050000, output: 16384 },
        features: { input: { tokens: 1050000 }, output: { tokens: 16384 }, vision: true, tools: true, promptCaching: true },
        pricing: { input: 1.00, output: 4.00 },
        officialSources: ['https://platform.openai.com/docs/models/gpt-5.6'],
    },
    {
        id: 'gpt-5.6-luna',
        vendor: Vendor.OpenAI,
        displayName: 'GPT-5.6 Luna',
        aliases: ['gpt-5.6-l'],
        lifecycle: 'active',
        endpoints: { openai: 'gpt-5.6-luna' },
        contextWindow: { input: 1050000, output: 16384 },
        features: { input: { tokens: 1050000 }, output: { tokens: 16384 }, vision: true, tools: true, batch: true, promptCaching: true },
        pricing: { input: 1.00, output: 4.00, batch: { input: 0.50, output: 2.00 } },
        officialSources: ['https://platform.openai.com/docs/models/gpt-5.6'],
    },
    // Additional OpenAI models
    {
        id: 'o1-pro',
        vendor: Vendor.OpenAI,
        displayName: 'o1 Pro',
        lifecycle: 'active',
        endpoints: { openai: 'o1-pro' },
        contextWindow: { input: 200000, output: 100000 },
        features: { input: { tokens: 200000 }, output: { tokens: 100000 }, reasoning: { effort: 'high' } },
        pricing: { input: 15.00, output: 60.00 },
        officialSources: ['https://platform.openai.com/docs/models/o1-pro'],
    },
    {
        id: 'o3-mini',
        vendor: Vendor.OpenAI,
        displayName: 'o3 Mini',
        lifecycle: 'active',
        endpoints: { openai: 'o3-mini' },
        contextWindow: { input: 200000, output: 100000 },
        features: { input: { tokens: 200000 }, output: { tokens: 100000 }, reasoning: { effort: 'medium' } },
        pricing: { input: 1.10, output: 4.40 },
        officialSources: ['https://platform.openai.com/docs/models/o3-mini'],
    },
    {
        id: 'gpt-4.1',
        vendor: Vendor.OpenAI,
        displayName: 'GPT-4.1',
        lifecycle: 'active',
        endpoints: { openai: 'gpt-4.1' },
        contextWindow: { input: 1000000, output: 16384 },
        features: { input: { tokens: 1000000 }, output: { tokens: 16384 }, vision: true, tools: true },
        pricing: { input: 0.40, output: 1.60 },
        officialSources: ['https://platform.openai.com/docs/models/gpt-4'],
    },
    {
        id: 'gpt-4.1-mini',
        vendor: Vendor.OpenAI,
        displayName: 'GPT-4.1 Mini',
        lifecycle: 'active',
        endpoints: { openai: 'gpt-4.1-mini' },
        contextWindow: { input: 200000, output: 16384 },
        features: { input: { tokens: 200000 }, output: { tokens: 16384 }, vision: true, tools: true },
        pricing: { input: 0.10, output: 0.40 },
        officialSources: ['https://platform.openai.com/docs/models/gpt-4'],
    },
    {
        id: 'gpt-4o-mini',
        vendor: Vendor.OpenAI,
        displayName: 'GPT-4o Mini',
        lifecycle: 'active',
        endpoints: { openai: 'gpt-4o-mini' },
        contextWindow: { input: 200000, output: 16384 },
        features: { input: { tokens: 200000 }, output: { tokens: 16384 }, vision: true, tools: true },
        pricing: { input: 0.15, output: 0.60 },
        officialSources: ['https://platform.openai.com/docs/models/gpt-4o-mini'],
    },
    {
        id: 'gpt-image-2',
        vendor: Vendor.OpenAI,
        displayName: 'GPT Image 2',
        lifecycle: 'active',
        endpoints: { openai: 'gpt-image-2' },
        contextWindow: { input: 128000, output: 16384 },
        features: { input: { tokens: 128000 }, output: { tokens: 16384 }, imageGeneration: true, imageEditing: true },
        pricing: { input: 0, output: 0 },
        officialSources: ['https://platform.openai.com/docs/guides/image-generation'],
    },
    // Anthropic (15 models)
    {
        id: 'claude-opus-5',
        vendor: Vendor.Anthropic,
        displayName: 'Claude Opus 5',
        aliases: ['claude-opus-5-20260824'],
        lifecycle: 'active',
        endpoints: { anthropic: 'claude-opus-5-20260824' },
        contextWindow: { input: 1000000, output: 4096 },
        features: { input: { tokens: 1000000 }, output: { tokens: 4096 }, vision: true, tools: true, thinking: { effort: 'high' } },
        pricing: { input: 15.00, output: 75.00 },
        officialSources: ['https://docs.anthropic.com/en/docs/models-claude/claude-opus-5'],
    },
    {
        id: 'claude-sonnet-4-6',
        vendor: Vendor.Anthropic,
        displayName: 'Claude Sonnet 4.6',
        lifecycle: 'active',
        endpoints: { anthropic: 'claude-sonnet-4-6-20260824' },
        contextWindow: { input: 1000000, output: 16384 },
        features: { input: { tokens: 1000000 }, output: { tokens: 16384 }, vision: true, tools: true, thinking: { effort: 'medium' } },
        pricing: { input: 3.00, output: 15.00 },
        officialSources: ['https://docs.anthropic.com/en/docs/models-claude/claude-sonnet-4'],
    },
    {
        id: 'claude-sonnet-4-5',
        vendor: Vendor.Anthropic,
        displayName: 'Claude Sonnet 4.5',
        lifecycle: 'active',
        endpoints: { anthropic: 'claude-sonnet-4-5-20260824' },
        contextWindow: { input: 1000000, output: 16384 },
        features: { input: { tokens: 1000000 }, output: { tokens: 16384 }, vision: true, tools: true, thinking: { effort: 'medium' } },
        pricing: { input: 3.00, output: 15.00 },
        officialSources: ['https://docs.anthropic.com/en/docs/models-claude'],
    },
    // Google (14 models)
    {
        id: 'gemini-3.6-flash',
        vendor: Vendor.Google,
        displayName: 'Gemini 3.6 Flash',
        lifecycle: 'active',
        endpoints: { google: 'gemini-3.6-flash' },
        contextWindow: { input: 1000000, output: 6144 },
        features: { input: { tokens: 1000000 }, output: { tokens: 6144 }, vision: true, tools: true, nativeAudio: true },
        pricing: { input: 0.15, output: 0.60 },
        officialSources: ['https://cloud.google.com/vertex-ai/generative-ai/docs/models'],
    },
    {
        id: 'gemini-2.5-flash',
        vendor: Vendor.Google,
        displayName: 'Gemini 2.5 Flash',
        lifecycle: 'active',
        endpoints: { google: 'gemini-2.5-flash' },
        contextWindow: { input: 1000000, output: 8192 },
        features: { input: { tokens: 1000000 }, output: { tokens: 8192 }, vision: true, tools: true },
        pricing: { input: 0.30, output: 1.20 },
        officialSources: ['https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini-2-5-flash'],
    },
    {
        id: 'gemini-2.0-flash',
        vendor: Vendor.Google,
        displayName: 'Gemini 2.0 Flash',
        lifecycle: 'active',
        endpoints: { google: 'gemini-2.0-flash' },
        contextWindow: { input: 1000000, output: 8192 },
        features: { input: { tokens: 1000000 }, output: { tokens: 8192 }, vision: true, tools: true },
        pricing: { input: 0.10, output: 0.40 },
        officialSources: ['https://cloud.google.com/vertex-ai/generative-ai/docs/models/gemini-2-0-flash'],
    },
    // xAI (11 models)
    {
        id: 'grok-4.5',
        vendor: Vendor.Grok,
        displayName: 'Grok 4.5',
        lifecycle: 'active',
        endpoints: { grok: 'grok-4.5' },
        contextWindow: { input: 1000000, output: 16384 },
        features: { input: { tokens: 1000000 }, output: { tokens: 16384 }, vision: true, tools: true, webSearch: true },
        pricing: { input: 3.00, output: 15.00 },
        officialSources: ['https://docs.x.ai'],
    },
    {
        id: 'grok-4.3',
        vendor: Vendor.Grok,
        displayName: 'Grok 4.3',
        lifecycle: 'active',
        endpoints: { grok: 'grok-4.3' },
        contextWindow: { input: 256000, output: 8192 },
        features: { input: { tokens: 256000 }, output: { tokens: 8192 }, vision: true, tools: true },
        pricing: { input: 1.00, output: 5.00 },
        officialSources: ['https://docs.x.ai'],
    },
    {
        id: 'grok-3.5',
        vendor: Vendor.Grok,
        displayName: 'Grok 3.5',
        lifecycle: 'active',
        endpoints: { grok: 'grok-vision-beta' },
        contextWindow: { input: 256000, output: 8192 },
        features: { input: { tokens: 256000 }, output: { tokens: 8192 }, vision: true, tools: true },
        pricing: { input: 1.00, output: 5.00 },
        officialSources: ['https://docs.x.ai'],
    },
    // DeepSeek (dedicated adapter)
    {
        id: 'deepseek-v4',
        vendor: Vendor.DeepSeek,
        displayName: 'DeepSeek V4',
        aliases: ['deepseek-chat'],
        lifecycle: 'active',
        endpoints: { deepseek: 'chat', openrouter: 'deepseek/deepseek-chat' },
        contextWindow: { input: 128000, output: 32768 },
        features: { input: { tokens: 128000 }, output: { tokens: 32768 }, reasoning: { effort: 'high' }, webSearch: true },
        pricing: { input: 1.00, output: 2.00 },
        officialSources: ['https://platform.deepseek.com'],
    },
    {
        id: 'deepseek-v4-pro',
        vendor: Vendor.DeepSeek,
        displayName: 'DeepSeek V4 Pro',
        lifecycle: 'active',
        endpoints: { deepseek: 'pro', openrouter: 'deepseek/deepseek-pro' },
        contextWindow: { input: 128000, output: 32768 },
        features: { input: { tokens: 128000 }, output: { tokens: 32768 }, reasoning: { effort: 'high' }, webSearch: true, structuredOutput: true },
        pricing: { input: 2.00, output: 8.00 },
        officialSources: ['https://platform.deepseek.com'],
    },
    // Groq
    {
        id: 'llama-3.1-70b',
        vendor: Vendor.Groq,
        displayName: 'Llama 3.1 70B',
        lifecycle: 'active',
        endpoints: { groq: 'llama-3.1-70b-versatile' },
        contextWindow: { input: 128000, output: 8192 },
        features: { input: { tokens: 128000 }, output: { tokens: 8192 }, tools: true },
        pricing: { input: 0.59, output: 0.79 },
        officialSources: ['https://console.groq.com/docs/models'],
    },
    // Mistral
    {
        id: 'mistral-large-2',
        vendor: Vendor.Mistral,
        displayName: 'Mistral Large 2',
        lifecycle: 'active',
        endpoints: { mistral: 'mistral-large-2' },
        contextWindow: { input: 128000, output: 8192 },
        features: { input: { tokens: 128000 }, output: { tokens: 8192 }, tools: true },
        pricing: { input: 3.00, output: 9.00 },
        officialSources: ['https://docs.mistral.ai'],
    },
    // Ollama
    {
        id: 'qwen3-8b',
        vendor: Vendor.Ollama,
        displayName: 'Qwen3 8B',
        lifecycle: 'active',
        endpoints: { ollama: 'qwen3:8b' },
        contextWindow: { input: 128000, output: 32768 },
        features: { input: { tokens: 128000 }, output: { tokens: 32768 } },
        pricing: { input: 0, output: 0 }, // Free/local
        officialSources: ['https://ollama.com/library/qwen3'],
    },
];
// Image Generation Models
const IMAGE_MODELS = [
    {
        id: 'gpt-image-2',
        vendor: Vendor.OpenAI,
        displayName: 'GPT Image 2',
        lifecycle: 'active',
        endpoints: { openai: 'gpt-image-2' },
        contextWindow: { input: 128000, output: 16384 },
        features: { imageGeneration: true, imageEditing: true },
        pricing: { input: 0.42, output: 0 }, // per image
        officialSources: ['https://platform.openai.com/docs/guides/image-generation'],
    },
    {
        id: 'gemini-3.1-flash-image',
        vendor: Vendor.Google,
        displayName: 'Gemini 3.1 Flash Image',
        lifecycle: 'active',
        endpoints: { google: 'gemini-3.1-flash-image' },
        contextWindow: { input: 1000000, output: 6144 },
        features: { imageGeneration: true, imageEditing: true },
        pricing: { input: 0.02, output: 0 },
        officialSources: ['https://cloud.google.com/vertex-ai'],
    },
    {
        id: 'imagen-3',
        vendor: Vendor.Google,
        displayName: 'Imagen 3',
        lifecycle: 'active',
        endpoints: { google: 'imagen-3' },
        contextWindow: { input: 1000000, output: 6144 },
        features: { imageGeneration: true },
        pricing: { input: 0.02, output: 0 },
        officialSources: ['https://cloud.google.com/vertex-ai'],
    },
    {
        id: 'grok-imagine-1.5',
        vendor: Vendor.Grok,
        displayName: 'Grok Imagine 1.5',
        lifecycle: 'active',
        endpoints: { grok: 'grok-imagine-1.5' },
        contextWindow: { input: 1000000, output: 6144 },
        features: { imageGeneration: true },
        pricing: { input: 0.02, output: 0 },
        officialSources: ['https://docs.x.ai'],
    },
];
// Video Generation Models
const VIDEO_MODELS = [
    {
        id: 'sora-2',
        vendor: Vendor.OpenAI,
        displayName: 'Sora 2',
        aliases: ['sora'],
        lifecycle: 'active',
        endpoints: { openai: 'sora-2' },
        contextWindow: { input: 1, output: 1 },
        features: { videoGeneration: true, videoExtend: true, videoRemix: true, videoEdit: true },
        pricing: { input: 0.42, output: 0 }, // per second
        officialSources: ['https://platform.openai.com/docs/guides/video-generation'],
    },
    {
        id: 'veo-3.1-lite',
        vendor: Vendor.Google,
        displayName: 'Veo 3.1 Lite',
        lifecycle: 'active',
        endpoints: { google: 'veo-3.1-lite-generate-preview' },
        contextWindow: { input: 1, output: 1 },
        features: { videoGeneration: true },
        pricing: { input: 0.02, output: 0 },
        officialSources: ['https://cloud.google.com/vertex-ai'],
    },
    {
        id: 'grok-imagine-video-1.5',
        vendor: Vendor.Grok,
        displayName: 'Grok Imagine Video 1.5',
        lifecycle: 'active',
        endpoints: { grok: 'grok-imagine-video-1.5' },
        contextWindow: { input: 1, output: 1 },
        features: { videoGeneration: true },
        pricing: { input: 0.02, output: 0 },
        officialSources: ['https://docs.x.ai'],
    },
];
// Voice / TTS Models
const VOICE_MODELS = [
    {
        id: 'tts-1',
        vendor: Vendor.OpenAI,
        displayName: 'TTS-1',
        lifecycle: 'active',
        endpoints: { openai: 'tts-1' },
        contextWindow: { input: 40960, output: 40960 },
        features: { tts: true },
        pricing: { input: 4.00, output: 4.00 },
        officialSources: ['https://platform.openai.com/docs/guides/text-to-speech'],
    },
    {
        id: 'tts-1-hd',
        vendor: Vendor.OpenAI,
        displayName: 'TTS-1 HD',
        lifecycle: 'active',
        endpoints: { openai: 'tts-1-hd' },
        contextWindow: { input: 40960, output: 40960 },
        features: { tts: true },
        pricing: { input: 16.00, output: 16.00 },
        officialSources: ['https://platform.openai.com/docs/guides/text-to-speech'],
    },
    {
        id: 'gpt-4o-mini-tts',
        vendor: Vendor.OpenAI,
        displayName: 'GPT-4o Mini TTS',
        lifecycle: 'active',
        endpoints: { openai: 'gpt-4o-mini-tts' },
        contextWindow: { input: 128000, output: 16384 },
        features: { tts: true, ttsInstructions: true },
        pricing: { input: 4.00, output: 4.00 },
        officialSources: ['https://platform.openai.com/docs/guides/text-to-speech'],
    },
    {
        id: 'gemini-3.6-flash-tts-preview',
        vendor: Vendor.Google,
        displayName: 'Gemini 3.6 Flash TTS',
        lifecycle: 'active',
        endpoints: { google: 'gemini-3.6-flash-tts-preview' },
        contextWindow: { input: 1000000, output: 6144 },
        features: { tts: true, ttsMultiSpeaker: true },
        pricing: { input: 0.04, output: 0 },
        officialSources: ['https://cloud.google.com/vertex-ai'],
    },
];
// STT / Speech-to-Text Models
const STT_MODELS = [
    {
        id: 'gpt-transcribe',
        vendor: Vendor.OpenAI,
        displayName: 'GPT Transcribe',
        aliases: ['whisper-1'],
        lifecycle: 'active',
        endpoints: { openai: 'gpt-transcribe' },
        contextWindow: { input: 25000000, output: 128000 },
        features: { stt: true, sttTimestamps: true, sttWordTimestamps: true, sttLanguageDetection: true },
        pricing: { input: 0.006, output: 0 },
        officialSources: ['https://platform.openai.com/docs/guides/speech-to-text'],
    },
    {
        id: 'gemini-3.6-flash',
        vendor: Vendor.Google,
        displayName: 'Gemini 3.6 Flash (STT)',
        lifecycle: 'active',
        endpoints: { google: 'gemini-3.6-flash' },
        contextWindow: { input: 1000000, output: 6144 },
        features: { stt: true },
        pricing: { input: 0.002, output: 0 },
        officialSources: ['https://cloud.google.com/vertex-ai'],
    },
    {
        id: 'xai-stt',
        vendor: Vendor.Grok,
        displayName: 'xAI STT',
        lifecycle: 'active',
        endpoints: { grok: 'xai-stt' },
        contextWindow: { input: 25000000, output: 128000 },
        features: { stt: true, sttStreaming: true },
        pricing: { input: 0.006, output: 0 },
        officialSources: ['https://docs.x.ai'],
    },
];
// Embedding Models
const EMBEDDING_MODELS = [
    {
        id: 'text-embedding-3-small',
        vendor: Vendor.OpenAI,
        displayName: 'Text Embedding 3 Small',
        lifecycle: 'active',
        endpoints: { openai: 'text-embedding-3-small' },
        contextWindow: { input: 8191, output: 1536 },
        features: { embedding: true, matryoshka: true, maxDimensions: 1536 },
        pricing: { input: 0.02, output: 0 },
        officialSources: ['https://platform.openai.com/docs/guides/embeddings'],
    },
    {
        id: 'text-embedding-3-large',
        vendor: Vendor.OpenAI,
        displayName: 'Text Embedding 3 Large',
        lifecycle: 'active',
        endpoints: { openai: 'text-embedding-3-large' },
        contextWindow: { input: 8191, output: 3072 },
        features: { embedding: true, matryoshka: true, maxDimensions: 3072 },
        pricing: { input: 0.13, output: 0 },
        officialSources: ['https://platform.openai.com/docs/guides/embeddings'],
    },
    {
        id: 'gemini-embedding-2',
        vendor: Vendor.Google,
        displayName: 'Gemini Embedding 2',
        lifecycle: 'active',
        endpoints: { google: 'gemini-embedding-2' },
        contextWindow: { input: 2048, output: 3072 },
        features: { embedding: true, matryoshka: true, multimodal: true, maxDimensions: 3072 },
        pricing: { input: 0.15, output: 0 },
        officialSources: ['https://cloud.google.com/vertex-ai'],
    },
    {
        id: 'qwen3-embedding',
        vendor: Vendor.Ollama,
        displayName: 'Qwen3 Embedding',
        lifecycle: 'active',
        endpoints: { ollama: 'qwen3-embbeding:latest' },
        contextWindow: { input: 8192, output: 4096 },
        features: { embedding: true, matryoshka: true, maxDimensions: 4096, local: true },
        pricing: { input: 0, output: 0 },
        officialSources: ['https://ollama.com/library/qwen3-embedding'],
    },
];
// ============================================================================
// Registry Implementation
// ============================================================================
const ALL_MODELS = [...TEXT_MODELS, ...IMAGE_MODELS, ...VIDEO_MODELS, ...VOICE_MODELS, ...STT_MODELS, ...EMBEDDING_MODELS];
export const MODEL_REGISTRY_SCHEMA_VERSION = MODEL_REGISTRY_SCHEMA_VERSION;
export function getModelInfo(modelId) {
    // Check by id first
    let model = ALL_MODELS.find(m => m.id === modelId);
    if (model)
        return model;
    // Check by alias
    model = ALL_MODELS.find(m => m.aliases?.includes(modelId));
    if (model)
        return model;
    // Check by endpoint
    for (const m of ALL_MODELS) {
        if (Object.values(m.endpoints).some(ep => ep === modelId)) {
            return m;
        }
    }
    return undefined;
}
export function getModelsByVendor(vendor) {
    return ALL_MODELS.filter(m => m.vendor === vendor);
}
export function getModelsByLifecycle(lifecycle) {
    return ALL_MODELS.filter(m => m.lifecycle === lifecycle);
}
export function getAllTextModels() {
    return TEXT_MODELS;
}
export function getAllImageModels() {
    return IMAGE_MODELS;
}
export function getAllVideoModels() {
    return VIDEO_MODELS;
}
export function getAllVoiceModels() {
    return VOICE_MODELS;
}
export function getAllSTTModels() {
    return STT_MODELS;
}
export function getAllEmbeddingModels() {
    return EMBEDDING_MODELS;
}
export function getAllModels() {
    return ALL_MODELS;
}
/**
 * Calculate cost for a model based on token usage
 */
export function calculateCost(modelId, inputTokens, outputTokens, options) {
    const model = getModelInfo(modelId);
    if (!model)
        return 0;
    const pricing = model.pricing;
    const inputPrice = (inputTokens / 1_000_000) * pricing.input;
    let outputPrice = (outputTokens / 1_000_000) * pricing.output;
    // Apply cached input discount if applicable
    if (options?.cachedInputTokens && pricing.batch) {
        const cachedCost = (options.cachedInputTokens / 1_000_000) * (pricing.batch.input || pricing.input * 0.5);
        const uncachedInput = inputTokens - (options.cachedInputTokens || 0);
        const uncachedCost = (uncachedInput / 1_000_000) * pricing.input;
        return uncachedCost + (outputTokens / 1_000_000) * pricing.output;
    }
    // Apply batch discount
    if (options?.processingMode === 'batch' && pricing.batch) {
        const batchInput = pricing.batch.input || pricing.input * 0.5;
        const batchOutput = pricing.batch.output || pricing.output * 0.5;
        return (inputTokens / 1_000_000) * batchInput + (outputTokens / 1_000_000) * batchOutput;
    }
    return inputPrice + outputPrice;
}
/**
 * Get provider capabilities for a model
 */
export function getProviderCapabilities(modelId) {
    const model = getModelInfo(modelId);
    if (!model) {
        return {
            text: false, vision: false, tts: false, stt: false,
            imageGeneration: false, videoGeneration: false, tools: false,
            contextWindow: 0,
        };
    }
    const f = model.features;
    return {
        text: true,
        vision: f.vision || false,
        tts: f.tts || false,
        stt: f.stt || false,
        imageGeneration: f.imageGeneration || false,
        videoGeneration: f.videoGeneration || false,
        tools: f.tools || false,
        contextWindow: f.input.tokens,
        batch: f.batch,
        promptCaching: f.promptCaching ? { mode: 'implicit', reportsCacheUsage: true, ttlModes: ['short', 'extended'] } : undefined,
        nativeTools: f.nativeTools,
    };
}
/**
 * Get advanced capabilities for agent API
 */
export function getAdvancedCapabilities(modelId) {
    const caps = getProviderCapabilities(modelId);
    return {
        promptCaching: caps.promptCaching || null,
        nativeTools: caps.nativeTools || [],
        batch: { supported: caps.batch || false },
    };
}
//# sourceMappingURL=models.js.map