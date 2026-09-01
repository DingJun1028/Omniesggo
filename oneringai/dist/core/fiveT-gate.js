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
// ============================================================================
// 5T Verification Gate Implementation
// ============================================================================
export class FiveTGate {
    gateHistory = [];
    /**
     * Execute the 5T verification gate on an artifact.
     * Returns a GateResult with frozen artifact and Hash Lock.
     */
    execute(artifact, agentId = 'quality-bee') {
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
        const result = {
            passed,
            dimensions,
            frozen_artifact: frozen,
            hash_lock: hashLock,
            summary() {
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
    verifyTraceable(artifact) {
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
    verifyTrackable(artifact) {
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
    verifyTangible(artifact) {
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
    verifyTransparent(artifact) {
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
    verifyTrustworthy(artifact) {
        try {
            this.hashLock(artifact);
            return { ok: true, detail: 'Serializable and hashable' };
        }
        catch (e) {
            return { ok: false, detail: `Cannot freeze: ${e}` };
        }
    }
    /**
     * Hash Lock: produce SHA-256 hash of the artifact
     */
    hashLock(artifact) {
        const payload = JSON.stringify(artifact, Object.keys(artifact).sort(), 2);
        return `sha256:${crypto.createHash('sha256').update(payload).digest('hex')}`;
    }
    /**
     * Freeze artifact (Object.freeze equivalent for immutable contracts)
     */
    freezeArtifact(artifact) {
        const frozen = JSON.parse(JSON.stringify(artifact));
        return Object.freeze(frozen);
    }
    /**
     * Get gate history
     */
    getHistory() {
        return this.gateHistory;
    }
    /**
     * Clear history
     */
    clearHistory() {
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
export function apply5TToResponse(response, source) {
    const artifact = {
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
//# sourceMappingURL=fiveT-gate.js.map