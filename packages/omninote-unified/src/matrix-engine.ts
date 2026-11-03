/**
 * ============================================================================
 * 終始矩陣引擎 — ALPHA/SIGMA/OMEGA 三態躍遷（結構共享式封印）
 * ============================================================================
 */
import { Value } from "@sinclair/typebox/value";
import {
  UnifiedNodeSchema,
  SyncDeltaPacketSchema,
  type CRDTBlock,
  type HashSHA256,
  type MatrixPhase,
  type MatrixVector,
  type SyncDeltaPacket,
  type UnifiedNode,
} from "./core-types.js";
import { sealWithStructuralSharing } from "./perf.js";

export async function sha256(source: string): Promise<HashSHA256> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("") as HashSHA256;
}

export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalStringify).join(",") + "]";
  return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + canonicalStringify((value as never)[k])).join(",") + "}";
}

export function computeUUID(): string {
  return crypto.randomUUID();
}

/** 5T 唯一真理鎖公式：全節點權威載具（引擎封印與稽核驗算共用此函式，杜絕公式漂移） */
export function nodeLockPayload(node: Readonly<UnifiedNode>): Record<string, unknown> {
  return {
    uuid: node.uuid,
    version: node.version,
    matrix_phase: node.matrix_phase,
    entity_type: node.entity_type,
    blocks: node.blocks,
    properties: node.properties,
  };
}

export async function computeNodeLockHash(node: Readonly<UnifiedNode>): Promise<HashSHA256> {
  return sha256(canonicalStringify(nodeLockPayload(node)));
}

export class UnifiedMatrixEngine {
  static async spawnAlphaOrigin(rawText: string, originTag: string): Promise<Readonly<UnifiedNode>> {
    const timestamp = Date.now();
    const uuid = computeUUID();
    const node: UnifiedNode = {
      uuid,
      version: "1.0.0",
      timestamp,
      matrix_phase: "ALPHA_ORIGIN_CAPTURE",
      entity_type: "note.ephemeral",
      blocks: [
        { block_id: uuid, type: "paragraph", content: rawText, lamport_ts: 1, peer_id: "peer-local", deleted: false },
      ],
      topology: { outlinks: [], tags: ["#inbox"] },
      properties: {},
      evidence: [
        {
          source_origin: originTag,
          captured_at: new Date(timestamp).toISOString(),
          content_hash: await sha256(rawText),
          hook_lifecycle: "ON_ALPHA_CAPTURE",
          audit_formula: "SHA-256(rawText)",
        },
      ],
      lock_hash: "0".repeat(64),
    };
    node.lock_hash = await computeNodeLockHash(node);
    return this.sealNode(node);
  }

  static async transitionToSigmaGraph(
    node: UnifiedNode,
    outlinks: UnifiedNode["topology"]["outlinks"],
    mergedMarkdown: string
  ): Promise<Readonly<UnifiedNode>> {
    const timestamp = Date.now();
    const next: UnifiedNode = {
      ...node,
      version: "1.1.0",
      timestamp,
      matrix_phase: "SIGMA_GRAPH_SYNTHESIS",
      entity_type: "note.synthesized",
      blocks: [
        { ...node.blocks[0]!, content: mergedMarkdown, lamport_ts: node.blocks[0]!.lamport_ts + 1 },
        ...node.blocks.slice(1),
      ],
      topology: { ...node.topology, outlinks },
      evidence: [
        ...node.evidence,
        {
          source_origin: "AST_MERGE(OmniFragments)",
          captured_at: new Date(timestamp).toISOString(),
          content_hash: await sha256(mergedMarkdown),
          hook_lifecycle: "ON_SIGMA_SYNTHESIS",
          audit_formula: "AST_MERGE(OmniFragments)",
        },
      ],
      lock_hash: "0".repeat(64),
    };
    next.lock_hash = await computeNodeLockHash(next);
    return this.sealNode(next);
  }

  static async crystallizeToOmegaObject(
    node: UnifiedNode,
    targetObjectType: string,
    properties: Record<string, unknown>
  ): Promise<Readonly<UnifiedNode>> {
    const timestamp = Date.now();
    const next: UnifiedNode = {
      ...node,
      version: "2.0.0",
      timestamp,
      matrix_phase: "OMEGA_OBJECT_CRYSTAL",
      entity_type: targetObjectType,
      properties: { ...node.properties, ...properties },
      evidence: [
        ...node.evidence,
        {
          source_origin: `SCHEMA_INJECTION(${targetObjectType})`,
          captured_at: new Date(timestamp).toISOString(),
          content_hash: await sha256(JSON.stringify(properties)),
          hook_lifecycle: "ON_OMEGA_CRYSTALLIZE",
          audit_formula: `SCHEMA_INJECTION(${targetObjectType})`,
        },
      ],
      lock_hash: "0".repeat(64),
    };
    next.lock_hash = await computeNodeLockHash(next);
    return this.sealNode(next);
  }

  static async projectReverseToCapture(node: UnifiedNode): Promise<Readonly<UnifiedNode>> {
    const timestamp = Date.now();
    const next: UnifiedNode = {
      ...node,
      matrix_phase: "ALPHA_ORIGIN_CAPTURE",
      timestamp,
      evidence: [
        ...node.evidence,
        {
          source_origin: "PROJECTION_DECRYSTALLIZE",
          captured_at: new Date(timestamp).toISOString(),
          content_hash: await sha256(canonicalStringify(node.blocks)),
          hook_lifecycle: "ON_REVERSE_PROJECT",
          audit_formula: "PROJECTION_DECRYSTALLIZE",
        },
      ],
      lock_hash: "0".repeat(64),
    };
    next.lock_hash = await computeNodeLockHash(next);
    return this.sealNode(next);
  }

  /** Block-Level LWW-Element-Set 合併（Lamport 優先，同值比 peer_id 字典序） */
  static mergeCRDTBlocks(local: readonly CRDTBlock[], remote: readonly CRDTBlock[]): CRDTBlock[] {
    const map = new Map<string, CRDTBlock>();
    for (const b of [...local, ...remote]) {
      const ex = map.get(b.block_id);
      if (!ex || b.lamport_ts > ex.lamport_ts || (b.lamport_ts === ex.lamport_ts && b.peer_id > ex.peer_id)) {
        map.set(b.block_id, b);
      }
    }
    return [...map.values()].filter((b) => !b.deleted);
  }

  static generateSyncDelta(
    sourceNode: UnifiedNode,
    toPhase: MatrixPhase,
    vector: MatrixVector,
    clockVector: Record<string, number>,
    patch: SyncDeltaPacket["patch"]
  ): Readonly<SyncDeltaPacket> {
    const packet: SyncDeltaPacket = {
      packet_id: computeUUID(),
      node_uuid: sourceNode.uuid,
      from_phase: sourceNode.matrix_phase,
      to_phase: toPhase,
      vector: vector,
      clock_vector: clockVector,
      patch: patch,
      state_signature: sourceNode.lock_hash,
    };
    if (!Value.Check(SyncDeltaPacketSchema, packet)) {
      throw new Error("[TypeBox Matrix Constraint Error]: " + JSON.stringify([...Value.Errors(SyncDeltaPacketSchema, packet)]));
    }
    return Object.freeze(packet);
  }

  /** 熵減自癒：標註死鏈並計算 entropy_score */
  static async purifyAndReduceEntropy(
    node: UnifiedNode,
    universe: ReadonlySet<string>
  ): Promise<Readonly<UnifiedNode>> {
    let broken = 0;
    const outlinks = node.topology.outlinks.map((l) => {
      const resolved = universe.has(l.target_uuid);
      if (!resolved) broken++;
      return { ...l, resolved };
    });
    const total = outlinks.length || 1;
    const entropy = parseFloat(((broken / total) * 0.5 + Math.min(node.blocks.length / 100, 0.5) * 0.5).toFixed(4));
    const next: UnifiedNode = {
      ...node,
      topology: { ...node.topology, outlinks },
      entropy_score: entropy,
      evidence: [
        ...node.evidence,
        {
          source_origin: "SYSTEM_ENTROPY_REDUCTION_FORGE",
          captured_at: new Date().toISOString(),
          content_hash: await sha256(`${node.uuid}:ENTROPY:${entropy}`),
          hook_lifecycle: "ON_ENTROPY_PURIFICATION",
          audit_formula: `H(x)=(BrokenLinks/TotalLinks)*0.5+Fragment*0.5 -> ${entropy}`,
        },
      ],
    };
    next.lock_hash = await computeNodeLockHash(next);
    return this.sealNode(next);
  }

  /** 結構共享式封印：未變動子樹零拷貝共享，僅凍結新建分支 */
  private static sealNode(node: UnifiedNode): Readonly<UnifiedNode> {
    if (!Value.Check(UnifiedNodeSchema, node)) {
      throw new Error("[TypeBox Matrix Constraint Error]: " + JSON.stringify([...Value.Errors(UnifiedNodeSchema, node)], null, 2));
    }
    return sealWithStructuralSharing(node) as Readonly<UnifiedNode>;
  }
}
