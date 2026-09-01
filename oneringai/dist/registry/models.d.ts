/**
 * Model Registry v2
 *
 * Lifecycle, aliases, endpoints, official sources, and modality-aware
 * pricing for 92 text/realtime models plus dedicated image, video, voice,
 * STT, and embedding registries.
 */
import type { Vendor, ProviderCapabilities, AdvancedCapabilities } from '../types/index.js';
export type ModelLifecycle = 'active' | 'deprecated' | 'maintenance' | 'retired';
export type ProcessingMode = 'interactive' | 'batch';
export interface ModelFeatures {
    input: {
        tokens: number;
    };
    output?: {
        tokens: number;
    };
    vision?: boolean;
    tts?: boolean;
    stt?: boolean;
    imageGeneration?: boolean;
    videoGeneration?: boolean;
    tools?: boolean;
    batch?: boolean;
    promptCaching?: boolean;
    nativeTools?: string[];
    [key: string]: unknown;
}
export interface ModelPricing {
    input: number;
    output: number;
    currency?: string;
    batch?: {
        input: number;
        output: number;
    };
}
export interface ModelInfo {
    readonly id: string;
    readonly vendor: Vendor;
    readonly displayName: string;
    readonly aliases?: string[];
    readonly lifecycle: ModelLifecycle;
    readonly endpoints: {
        openai?: string;
        anthropic?: string;
        google?: string;
        groq?: string;
        together?: string;
        ollama?: string;
    };
    readonly contextWindow: {
        input: number;
        output: number;
    };
    readonly features: ModelFeatures;
    readonly pricing: ModelPricing;
    readonly officialSources?: string[];
    readonly replacementModel?: string;
    readonly retirementDate?: string;
}
export declare const MODEL_REGISTRY_SCHEMA_VERSION = 2;
export declare function getModelInfo(modelId: string): ModelInfo | undefined;
export declare function getModelsByVendor(vendor: Vendor): ModelInfo[];
export declare function getModelsByLifecycle(lifecycle: ModelLifecycle): ModelInfo[];
export declare function getAllTextModels(): ModelInfo[];
export declare function getAllImageModels(): ModelInfo[];
export declare function getAllVideoModels(): ModelInfo[];
export declare function getAllVoiceModels(): ModelInfo[];
export declare function getAllSTTModels(): ModelInfo[];
export declare function getAllEmbeddingModels(): ModelInfo[];
export declare function getAllModels(): ModelInfo[];
/**
 * Calculate cost for a model based on token usage
 */
export declare function calculateCost(modelId: string, inputTokens: number, outputTokens: number, options?: {
    cachedInputTokens?: number;
    cacheCreationInputTokens?: number;
    cacheCreationDetails?: {
        shortTtlInputTokens?: number;
        extendedTtlInputTokens?: number;
    };
    processingMode?: ProcessingMode;
}): number;
/**
 * Get provider capabilities for a model
 */
export declare function getProviderCapabilities(modelId: string): ProviderCapabilities;
/**
 * Get advanced capabilities for agent API
 */
export declare function getAdvancedCapabilities(modelId: string): AdvancedCapabilities;
//# sourceMappingURL=models.d.ts.map