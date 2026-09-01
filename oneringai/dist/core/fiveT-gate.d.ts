import type { AgentResponse } from '../types/index.js';
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
export declare class FiveTGate {
    private gateHistory;
    /**
     * Execute the 5T verification gate on an artifact.
     * Returns a GateResult with frozen artifact and Hash Lock.
     */
    execute(artifact: VerificationArtifact, agentId?: string): GateResult;
    /**
     * Verify Traceable: source_origin must be present
     */
    private verifyTraceable;
    /**
     * Verify Trackable: lifecycle hooks or track_log must exist
     */
    private verifyTrackable;
    /**
     * Verify Tangible: user feedback or tangible evidence must exist
     */
    private verifyTangible;
    /**
     * Verify Transparent: public decision logic, no hallucinations detected
     */
    private verifyTransparent;
    /**
     * Verify Trustworthy: artifact must be serializable and hashable
     */
    private verifyTrustworthy;
    /**
     * Hash Lock: produce SHA-256 hash of the artifact
     */
    private hashLock;
    /**
     * Freeze artifact (Object.freeze equivalent for immutable contracts)
     */
    private freezeArtifact;
    /**
     * Get gate history
     */
    getHistory(): Array<{
        artifact: VerificationArtifact;
        result: GateResult;
        timestamp: number;
    }>;
    /**
     * Clear history
     */
    clearHistory(): void;
}
export declare const fiveTGate: FiveTGate;
/**
 * Wrap an agent response with 5T verification metadata
 */
export declare function apply5TToResponse(response: AgentResponse, source: string): AgentResponse & {
    verification: GateResult;
};
export type { VerificationArtifact, DimensionResult, GateResult };
//# sourceMappingURL=fiveT-gate.d.ts.map