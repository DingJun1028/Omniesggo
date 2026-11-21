/**
 * ============================================================================
 * EvidenceAuditBundleExporter — 5T 稽核憑證（PASSED / COMPROMISED）
 * ============================================================================
 */
import type { EvidenceEntry, UnifiedNode } from "./core-types.js";
import { computeNodeLockHash } from "./matrix-engine.js";
import { sealWithStructuralSharing } from "./perf.js";

export interface AuditProofManifest {
  readonly manifest_version: "1.0.0";
  readonly subject_uuid: string;
  readonly subject_type: string;
  readonly export_timestamp: string;
  readonly final_lock_hash: string;
  readonly recomputed_hash: string;
  readonly verification_status: "PASSED" | "COMPROMISED";
  readonly evidence_chain: readonly EvidenceEntry[];
}

export class EvidenceAuditBundleExporter {
  static async generateProofManifest(node: Readonly<UnifiedNode>): Promise<Readonly<AuditProofManifest>> {
    const recomputedHash = await computeNodeLockHash(node);
    const isValid = recomputedHash === node.lock_hash ? "PASSED" : "COMPROMISED";
    return sealWithStructuralSharing({
      manifest_version: "1.0.0",
      subject_uuid: node.uuid,
      subject_type: node.entity_type,
      export_timestamp: new Date().toISOString(),
      final_lock_hash: node.lock_hash,
      recomputed_hash: recomputedHash,
      verification_status: isValid,
      evidence_chain: node.evidence,
    });
  }
}
