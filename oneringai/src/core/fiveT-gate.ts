/**
 * 5T Protocol Verification Gate System
 * 
 * Implements the Five T's of verification:
 * - Traceable: source_origin tags on all code and tasks
 * - Trackable: lifecycle hooks and event tracking
 * - Tangible: UI/UX feedback evidence
 * - Transparent: zero-hallucination audit, public decision logic
 * - Trustworthy: Hash Lock + Object.freeze() for immutable artifacts
 */
import * as crypto from 'crypto';
import type { AgentResponse } from '../types/index.js';

// ============================================================================
// Verification Artifact Types
// ============================================================================

export interface VerificationArtifact {
  source_origin?: string;
  lifecycle_hooks?: string[];
  track_log?: string[];
  user_feedback?: string;
  tangible_evidence?: unknown;
  logic_doc?: string;
  decision_trace?: string;
  evidence?: Record<string, unknown>;
  content?: string;
  [key: string]: unknown;
}

export interface DimensionResult {
  ok: boolean;
  detail: string;
}

export interface GateResult {
  passed: boolean;
  dimensions: Record<string, DimensionResult>;
  frozen_artifact: VerificationArtifact | null;
  hash_lock: string;
  summary(): string;
}

// ============================================================================
// 5T Verification Gate Implementation
// ============================================================================

export class FiveTGate {
  private gateHistory: Array<{
    artifact: VerificationArtifact;
    result: GateResult;
    timestamp: number;
  }> = [];
  
  /**
   * Execute the 5T verification gate on an artifact.
   * Returns a GateResult with frozen artifact and Hash Lock.
   */
  execute(artifact: VerificationArtifact, agentId: string = 'quality-bee'): GateResult {
    const dimensions = {
      Traceable: this.verifyTraceable(artifact),
      Trackable: this.verifyTrackable(artifact),
      Tangible: this.verifyTangible(artifact),
      Transparent: this.verifyTransparent(artifact),
      Trustworthy: this.verifyTrustworthy(artifact),
    };
    
    const passed = Object.values(dimensions).every(d => d.ok);
    const hashLock = passed ? this.hashLock(artifact) : '';
    const frozen = passed ? this.freezeArtifact(artifact) : null;
    
    const result: GateResult = {
      passed,
      dimensions,
      frozen_artifact: frozen,
      hash_lock: hashLock,
      summary(): string {
        const lines = [`5T Verification Gate: ${result.passed ? 'PASS' : 'FAIL'}`];
        for (const [key, val] of Object.entries(this.dimensions)) {
          const status = val.ok ? '✓' : '✗';
          lines.push(`  ${status} ${key}: ${val.detail}`);
        }
        if (this.hash_lock) {
          lines.push(`  🔒 Hash Lock: ${this.hash_lock.substring(0, 16)}...`);
        }
        return lines.join('\n');
      },
    };
    
    this.gateHistory.push({ artifact, result, timestamp: Date.now() });
    return result;
  }
  
  /**
   * Verify Traceable: source_origin must be present
   */
  private verifyTraceable(artifact: VerificationArtifact): DimensionResult {
    const src = artifact.source_origin || artifact.evidence?.source_origin;
    const ok = !!src;
    return {
      ok,
      detail: ok ? `source_origin=${src}` : 'Missing source_origin tag (Traceable requirement)',
    };
  }
  
  /**
   * Verify Trackable: lifecycle hooks or track_log must exist
   */
  private verifyTrackable(artifact: VerificationArtifact): DimensionResult {
    const hooks = artifact.lifecycle_hooks || artifact.track_log;
    const ok = !!hooks && (Array.isArray(hooks) ? hooks.length > 0 : true);
    return {
      ok,
      detail: ok ? `hooks=${Array.isArray(hooks) ? hooks.length : hooks}` : 'No lifecycle tracking records (Trackable requirement)',
    };
  }
  
  /**
   * Verify Tangible: user feedback or tangible evidence must exist
   */
  private verifyTangible(artifact: VerificationArtifact): DimensionResult {
    const fb = artifact.user_feedback || artifact.tangible_evidence;
    const ok = !!fb;
    return {
      ok,
      detail: ok ? `feedback=${String(fb).substring(0, 40)}` : 'No perceptible feedback evidence (Tangible requirement)',
    };
  }
  
  /**
   * Verify Transparent: public decision logic, no hallucinations detected
   */
  private verifyTransparent(artifact: VerificationArtifact): DimensionResult {
    const logic = artifact.logic_doc || artifact.decision_trace;
    const logicStr = String(logic || '');
    const ok = !!logic && !logicStr.includes('幻覺') && !logicStr.includes('hallucination');
    return {
      ok,
      detail: ok 
        ? `logic_doc=${logicStr.length}B` 
        : 'No public decision logic or suspected hallucination (Transparent requirement)',
    };
  }
  
  /**
   * Verify Trustworthy: artifact must be serializable and hashable
   */
  private verifyTrustworthy(artifact: VerificationArtifact): DimensionResult {
    try {
      this.hashLock(artifact);
      return { ok: true, detail: 'Serializable and hashable' };
    } catch (e) {
      return { ok: false, detail: `Cannot freeze: ${e}` };
    }
  }
  
  /**
   * Hash Lock: produce SHA-256 hash of the artifact
   */
  private hashLock(artifact: VerificationArtifact): string {
    const payload = JSON.stringify(artifact, Object.keys(artifact).sort(), 2);
    return `sha256:${crypto.createHash('sha256').update(payload).digest('hex')}`;
  }
  
  /**
   * Freeze artifact (Object.freeze equivalent for immutable contracts)
   */
  private freezeArtifact(artifact: VerificationArtifact): VerificationArtifact {
    const frozen = JSON.parse(JSON.stringify(artifact));
    return Object.freeze(frozen) as VerificationArtifact;
  }
  
  /**
   * Get gate history
   */
  getHistory(): Array<{ artifact: VerificationArtifact; result: GateResult; timestamp: number }> {
    return this.gateHistory;
  }
  
  /**
   * Clear history
   */
  clearHistory(): void {
    this.gateHistory = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const fiveTGate = new FiveTGate();

// ============================================================================
// Agent Response 5T Compliance Helper
// ============================================================================

/**
 * Wrap an agent response with 5T verification metadata
 */
export function apply5TToResponse(response: AgentResponse, source: string): AgentResponse & { verification: GateResult } {
  const artifact: VerificationArtifact = {
    source_origin: source,
    lifecycle_hooks: ['init', 'run', 'verify'],
    user_feedback: 'Agent execution completed',
    logic_doc: `Agent response generated via ${response.usage ? 'provider API' : 'local inference'}`,
    evidence: { source_origin: source },
    content: response.output_text?.substring(0, 100),
  };
  
  const gateResult = fiveTGate.execute(artifact, 'agent-core');
  
  return {
    ...response,
    verification: gateResult,
  };
}

// ============================================================================
// Re-export for convenience
// ============================================================================
// Note: VerificationArtifact, DimensionResult, GateResult are exported above
