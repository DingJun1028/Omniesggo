/**
 * Unit tests for the Model Registry
 */
import { describe, it, expect } from 'vitest';
import {
  getModelInfo,
  getModelsByVendor,
  calculateCost,
  getProviderCapabilities,
  getAllTextModels,
  getAllImageModels,
  getAllVideoModels,
  getAllVoiceModels,
  getAllSTTModels,
  getAllEmbeddingModels,
  MODEL_REGISTRY_SCHEMA_VERSION,
} from '../../src/registry/models.js';
import { Vendor } from '../../src/types/index.js';

describe('Model Registry', () => {
  describe('schema version', () => {
    it('should be v2', () => {
      expect(MODEL_REGISTRY_SCHEMA_VERSION).toBe(2);
    });
  });

  describe('getModelInfo', () => {
    it('should find model by id', () => {
      const model = getModelInfo('gpt-5.6-sol');
      expect(model).toBeDefined();
      expect(model?.vendor).toBe(Vendor.OpenAI);
      expect(model?.displayName).toBe('GPT-5.6 Sol');
    });

    it('should resolve alias to model', () => {
      const model = getModelInfo('gpt-5.6');
      expect(model).toBeDefined();
      expect(model?.id).toBe('gpt-5.6-sol');
    });

    it('should return undefined for unknown model', () => {
      const model = getModelInfo('nonexistent-model');
      expect(model).toBeUndefined();
    });

    it('should handle DeepSeek models', () => {
      const model = getModelInfo('deepseek-v4');
      expect(model).toBeDefined();
      expect(model?.vendor).toBe(Vendor.DeepSeek);
    });
  });

  describe('getModelsByVendor', () => {
    it('should return OpenAI models', () => {
      const models = getModelsByVendor(Vendor.OpenAI);
      expect(models.length).toBeGreaterThan(0);
      expect(models.every(m => m.vendor === Vendor.OpenAI)).toBe(true);
    });

    it('should return Anthropic models', () => {
      const models = getModelsByVendor(Vendor.Anthropic);
      expect(models.length).toBeGreaterThan(0);
    });

    it('should return empty for unknown vendor', () => {
      const models = getModelsByVendor('unknown' as any);
      expect(models).toHaveLength(0);
    });
  });

  describe('getAllModels', () => {
    it('should have text models', () => {
      const models = getAllTextModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should have image models', () => {
      const models = getAllImageModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should have video models', () => {
      const models = getAllVideoModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should have voice models', () => {
      const models = getAllVoiceModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should have STT models', () => {
      const models = getAllSTTModels();
      expect(models.length).toBeGreaterThan(0);
    });

    it('should have embedding models', () => {
      const models = getAllEmbeddingModels();
      expect(models.length).toBeGreaterThan(0);
    });
  });

  describe('calculateCost', () => {
    it('should calculate basic cost', () => {
      const cost = calculateCost('gpt-5.6-sol', 1_000_000, 500_000);
      expect(cost).toBeCloseTo(2000, 1); // 1.00 * 1 + 4.00 * 0.5 = 3.0... wait
      // input: 1M * $1 = $1, output: 500K * $4 = $2, total = $3
      expect(cost).toBeCloseTo(3.0, 2);
    });

    it('should apply batch discount', () => {
      const model = getModelInfo('gpt-5.6-luna');
      const batchCost = calculateCost('gpt-5.6-luna', 1_000_000, 500_000, {
        processingMode: 'batch',
      });
      const regularCost = calculateCost('gpt-5.6-luna', 1_000_000, 500_000);
      expect(batchCost).toBeLessThan(regularCost);
    });

    it('should return 0 for unknown model', () => {
      const cost = calculateCost('unknown-model', 1000, 1000);
      expect(cost).toBe(0);
    });

    it('should handle free local models', () => {
      const cost = calculateCost('qwen3-8b', 1_000_000, 500_000);
      expect(cost).toBe(0);
    });
  });

  describe('getProviderCapabilities', () => {
    it('should return capabilities for a vision model', () => {
      const caps = getProviderCapabilities('gpt-5.6-sol');
      expect(caps.vision).toBe(true);
      expect(caps.tools).toBe(true);
      expect(caps.text).toBe(true);
    });

    it('should return capabilities for a TTS model', () => {
      const caps = getProviderCapabilities('tts-1');
      expect(caps.tts).toBe(true);
      expect(caps.vision).toBe(false);
    });

    it('should return capabilities for an embedding model', () => {
      const caps = getProviderCapabilities('text-embedding-3-small');
      expect(caps.contextWindow).toBe(8191);
    });

    it('should return empty capabilities for unknown model', () => {
      const caps = getProviderCapabilities('unknown-model');
      expect(caps.text).toBe(false);
      expect(caps.vision).toBe(false);
    });
  });

  describe('Model metadata', () => {
    it('should have lifecycle for all models', () => {
      for (const model of getAllTextModels()) {
        expect(model.lifecycle).toBeDefined();
      }
    });

    it('should have pricing for all models', () => {
      for (const model of getAllTextModels()) {
        expect(model.pricing).toBeDefined();
        expect(model.pricing.input).toBeDefined();
        expect(model.pricing.output).toBeDefined();
      }
    });

    it('should have context windows for all models', () => {
      for (const model of getAllTextModels()) {
        expect(model.contextWindow).toBeDefined();
        expect(model.contextWindow.input).toBeGreaterThan(0);
      }
    });
  });
});
