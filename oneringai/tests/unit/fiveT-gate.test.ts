/**
 * Unit tests for the 5T Verification Gate
 */
import { describe, it, expect } from 'vitest';
import { FiveTGate, fiveTGate, apply5TToResponse } from '../../src/core/fiveT-gate.js';

describe('5T Gate', () => {
  const gate = new FiveTGate();

  describe('execute', () => {
    it('should PASS for a fully compliant artifact', () => {
      const artifact = {
        source_origin: 'oa-team/agent-runtime',
        lifecycle_hooks: ['init', 'run', 'verify'],
        user_feedback: 'All tests pass',
        logic_doc: 'Agent processed via OneRingAI driver with 5T compliance',
        evidence: { source_origin: 'oa-team/agent-runtime' },
      };

      const result = gate.execute(artifact, 'quality-bee');

      expect(result.passed).toBe(true);
      expect(result.hash_lock).toMatch(/^sha256:/);
      expect(result.frozen_artifact).toEqual(artifact);
      
      // Verify all 5 dimensions
      expect(result.dimensions.Traceable.ok).toBe(true);
      expect(result.dimensions.Trackable.ok).toBe(true);
      expect(result.dimensions.Tangible.ok).toBe(true);
      expect(result.dimensions.Transparent.ok).toBe(true);
      expect(result.dimensions.Trustworthy.ok).toBe(true);
    });

    it('should FAIL for missing source_origin (Traceable)', () => {
      const artifact = {
        lifecycle_hooks: ['init'],
        user_feedback: 'test',
        logic_doc: 'test logic',
      };

      const result = gate.execute(artifact);
      expect(result.passed).toBe(false);
      expect(result.dimensions.Traceable.ok).toBe(false);
      expect(result.hash_lock).toBe('');
      expect(result.frozen_artifact).toBeNull();
    });

    it('should FAIL for missing lifecycle_hooks (Trackable)', () => {
      const artifact = {
        source_origin: 'test',
        user_feedback: 'test',
        logic_doc: 'test logic',
      };

      const result = gate.execute(artifact);
      expect(result.passed).toBe(false);
      expect(result.dimensions.Trackable.ok).toBe(false);
    });

    it('should FAIL for missing user_feedback (Tangible)', () => {
      const artifact = {
        source_origin: 'test',
        lifecycle_hooks: ['init'],
        logic_doc: 'test logic',
      };

      const result = gate.execute(artifact);
      expect(result.passed).toBe(false);
      expect(result.dimensions.Tangible.ok).toBe(false);
    });

    it('should FAIL for missing logic_doc (Transparent)', () => {
      const artifact = {
        source_origin: 'test',
        lifecycle_hooks: ['init'],
        user_feedback: 'test',
      };

      const result = gate.execute(artifact);
      expect(result.passed).toBe(false);
      expect(result.dimensions.Transparent.ok).toBe(false);
    });

    it('should FAIL for hallucination keyword in logic_doc', () => {
      const artifact = {
        source_origin: 'test',
        lifecycle_hooks: ['init'],
        user_feedback: 'test',
        logic_doc: 'This is a 幻覺-based decision',
      };

      const result = gate.execute(artifact);
      expect(result.passed).toBe(false);
      expect(result.dimensions.Transparent.ok).toBe(false);
    });
  });

  describe('hash lock', () => {
    it('should produce consistent hash for same input', () => {
      const artifact = {
        source_origin: 'test',
        lifecycle_hooks: ['init'],
        user_feedback: 'test',
        logic_doc: 'test logic',
      };

      const r1 = gate.execute(artifact);
      const r2 = gate.execute(artifact);

      expect(r1.hash_lock).toBe(r2.hash_lock);
    });

    it('should produce different hash for different input', () => {
      const r1 = gate.execute({
        source_origin: 'test1',
        lifecycle_hooks: ['init'],
        user_feedback: 'test',
        logic_doc: 'test logic',
      });

      const r2 = gate.execute({
        source_origin: 'test2',
        lifecycle_hooks: ['init'],
        user_feedback: 'test',
        logic_doc: 'test logic',
      });

      expect(r1.hash_lock).not.toBe(r2.hash_lock);
    });
  });

  describe('frozen artifact', () => {
    it('should freeze the artifact on pass', () => {
      const artifact = {
        source_origin: 'test',
        lifecycle_hooks: ['init'],
        user_feedback: 'test',
        logic_doc: 'test logic',
      };

      const result = gate.execute(artifact);
      expect(Object.isFrozen(result.frozen_artifact)).toBe(true);
    });
  });

  describe('summary', () => {
    it('should produce a readable summary', () => {
      const artifact = {
        source_origin: 'test',
        lifecycle_hooks: ['init'],
        user_feedback: 'test',
        logic_doc: 'test logic',
      };

      const result = gate.execute(artifact);
      const summary = result.summary();
      
      expect(summary).toContain('PASS');
      expect(summary).toContain('Traceable');
      expect(summary).toContain('Hash Lock');
    });

    it('should show FAIL on failure', () => {
      const result = gate.execute({ content: 'no tags' });
      const summary = result.summary();
      
      expect(summary).toContain('FAIL');
    });
  });

  describe('apply5TToResponse', () => {
    it('should wrap agent response with verification', () => {
      const response = {
        output_text: 'Hello, world!',
        usage: { input_tokens: 10, output_tokens: 5 },
        status: 'completed' as const,
      };

      const wrapped = apply5TToResponse(response, 'test-agent');
      expect(wrapped.verification).toBeDefined();
      expect(wrapped.verification.passed).toBe(true);
    });
  });
});
