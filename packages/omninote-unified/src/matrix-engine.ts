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
  return "{" + Object.keys(value).sort((a, b) => a.localeCompare(b)).map((k) => JSON.stringify(k) + ":" + canonicalStringify((value as never)[k])).join(",") + "}";
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

  /**
   * 熔合投影：由未刪除區塊之 [[雙鏈]] 重建 topology.outlinks（拓撲權威）。
   * 標的解析雙軌：(1) UUIDv4 形式直接收錄；(2) 文字別名經 aliasIndex（別名→真實 uuid）解析後收錄，
   * wikilink_alias 記錄該文字別名；無法解析之文字標的不入拓撲（留在內容投影層，Web 呈現為懸浮節點）。
   * resolved 由 universe（現存節點 uuid 集）判定，去重以 target_uuid 為準。
   */
  static deriveOutlinks(
    blocks: readonly CRDTBlock[],
    universe: ReadonlySet<string>,
    aliasIndex: ReadonlyMap<string, string> = new Map()
  ): UnifiedNode["topology"]["outlinks"] {
    const WIKILINK_RE = /\[\[([^|\]]+)(?:\|([^\]]*))?\]\]/g;
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const seen = new Set<string>();
    const outlinks: UnifiedNode["topology"]["outlinks"] = [];
    for (const block of blocks) {
      if (block.deleted) continue;
      for (const match of block.content.matchAll(WIKILINK_RE)) {
        const rawTarget = match[1]?.trim() ?? "";
        if (rawTarget.length === 0) continue;
        const isUuid = UUID_RE.test(rawTarget);
        const target = isUuid ? rawTarget : aliasIndex.get(rawTarget);
        if (target === undefined || seen.has(target)) continue;
        seen.add(target);
        outlinks.push({
          target_uuid: target,
          wikilink_alias: isUuid ? (match[2]?.trim() ?? "") : rawTarget,
          resolved: universe.has(target),
        });
      }
    }
    return outlinks;
  }

  /** 區塊編輯（LWW 就地更新）：內容置換、Lamport 遞增、outlinks 熔合重建、證據鏈 ON_BLOCK_EDIT */
  static async editBlock(
    node: UnifiedNode,
    blockId: string,
    content: string,
    universe: ReadonlySet<string>,
    aliasIndex: ReadonlyMap<string, string> = new Map()
  ): Promise<Readonly<UnifiedNode>> {
    const index = node.blocks.findIndex((b) => b.block_id === blockId);
    if (index === -1) throw new Error("BLOCK_NOT_FOUND");
    const target = node.blocks[index]!;
    if (target.deleted) throw new Error("BLOCK_TOMBSTONED");
    const block: CRDTBlock = { ...target, content, lamport_ts: target.lamport_ts + 1 };
    return this.rewriteBlock(node, index, block, universe, aliasIndex, {
      source_origin: "BLOCK_EDIT_ENGINE",
      hook_lifecycle: "ON_BLOCK_EDIT",
      audit_formula: "LWW-Element-Set(edit)",
    });
  }

  /** 區塊軟刪除（CRDT tombstone）：deleted=true 保留原文與 block_id，outlinks 熔合重建（不含墓碑） */
  static async softDeleteBlock(
    node: UnifiedNode,
    blockId: string,
    universe: ReadonlySet<string>,
    aliasIndex: ReadonlyMap<string, string> = new Map()
  ): Promise<Readonly<UnifiedNode>> {
    const index = node.blocks.findIndex((b) => b.block_id === blockId);
    if (index === -1) throw new Error("BLOCK_NOT_FOUND");
    const target = node.blocks[index]!;
    if (target.deleted) throw new Error("BLOCK_TOMBSTONED");
    const block: CRDTBlock = { ...target, deleted: true, lamport_ts: target.lamport_ts + 1 };
    return this.rewriteBlock(node, index, block, universe, aliasIndex, {
      source_origin: "BLOCK_TOMBSTONE_ENGINE",
      hook_lifecycle: "ON_BLOCK_TOMBSTONE",
      audit_formula: "LWW-Element-Set(tombstone)",
    });
  }

  /** 區塊重寫共用落地：版本 patch 遞增、outlinks 熔合、證據鏈、lock_hash 重算、結構共享封印 */
  private static async rewriteBlock(
    node: UnifiedNode,
    index: number,
    block: CRDTBlock,
    universe: ReadonlySet<string>,
    aliasIndex: ReadonlyMap<string, string>,
    evidenceMeta: { source_origin: string; hook_lifecycle: string; audit_formula: string }
  ): Promise<Readonly<UnifiedNode>> {
    const blocks = [...node.blocks];
    blocks[index] = block;
    const parts = node.version.split(".");
    const next: UnifiedNode = {
      ...node,
      version: `${parts[0]}.${parts[1]}.${Number(parts[2]) + 1}`,
      timestamp: Date.now(),
      blocks,
      topology: {
        ...node.topology,
        outlinks: UnifiedMatrixEngine.deriveOutlinks(blocks, universe, aliasIndex),
      },
      evidence: [
        ...node.evidence,
        {
          source_origin: evidenceMeta.source_origin,
          captured_at: new Date().toISOString(),
          content_hash: await sha256(block.content),
          hook_lifecycle: evidenceMeta.hook_lifecycle,
          audit_formula: evidenceMeta.audit_formula,
        },
      ],
    };
    next.lock_hash = await computeNodeLockHash(next);
    return this.sealNode(next);
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

  /**
   * SyncDeltaPacket 對端套用（十一期）：同態收斂（from_phase === to_phase === 節點現相位）。
   * JSON Patch 子集：add / remove / replace / move；move 之 value 為來源路徑字串（契約僅有 op/path/value，如實標示此約定）。
   * 前置道閘：packet 經 SyncDeltaPacketSchema 驗證、node_uuid 一致、state_signature 須等於本端 lock_hash（分歧即拒）。
   */
  static async applySyncDelta(
    node: UnifiedNode,
    packet: SyncDeltaPacket,
    universe: ReadonlySet<string>,
    aliasIndex: ReadonlyMap<string, string> = new Map()
  ): Promise<Readonly<UnifiedNode>> {
    if (!Value.Check(SyncDeltaPacketSchema, packet)) {
      throw new Error("INVALID_PACKET_SHAPE");
    }
    if (packet.node_uuid !== node.uuid) throw new Error("PACKET_NODE_MISMATCH");
    if (packet.state_signature !== node.lock_hash) throw new Error("STATE_SIGNATURE_MISMATCH");
    if (packet.from_phase !== node.matrix_phase || packet.to_phase !== node.matrix_phase) {
      throw new Error("NOT_SAME_PHASE");
    }
    const draft = structuredClone(node) as UnifiedNode;
    const root = draft as unknown as Record<string, unknown>;
    for (const op of packet.patch) {
      UnifiedMatrixEngine.applyPatchOp(root, op);
    }
    const parts = draft.version.split(".");
    const next: UnifiedNode = {
      ...draft,
      version: `${parts[0]}.${parts[1]}.${Number(parts[2]) + 1}`,
      timestamp: Date.now(),
      matrix_phase: packet.to_phase,
      topology: {
        ...draft.topology,
        outlinks: UnifiedMatrixEngine.deriveOutlinks(draft.blocks, universe, aliasIndex),
      },
      evidence: [
        ...draft.evidence,
        {
          source_origin: `SYNC_DELTA_APPLY(${packet.vector})`,
          captured_at: new Date().toISOString(),
          content_hash: await sha256(canonicalStringify(packet.patch)),
          hook_lifecycle: "ON_SYNC_DELTA_APPLY",
          audit_formula: `LATERAL_REBASE(${packet.packet_id})`,
        },
      ],
    };
    next.lock_hash = await computeNodeLockHash(next);
    return this.sealNode(next);
  }

  /** JSON Patch 子集之單一操作套用；路徑不可達即 INVALID_PATCH_PATH。 */
  private static applyPatchOp(
    root: Record<string, unknown>,
    op: SyncDeltaPacket["patch"][number]
  ): void {
    if (!op.path.startsWith("/")) throw new Error("INVALID_PATCH_PATH");
    const tokens = op.path.slice(1).split("/");
    if (tokens.length === 0 || tokens.some((t) => t.length === 0)) throw new Error("INVALID_PATCH_PATH");
    const { container, key } = UnifiedMatrixEngine.patchNavigate(root, tokens);
    if (op.op === "add" || op.op === "replace") {
      if (Array.isArray(container)) {
        const index = key === "-" ? container.length : Number(key);
        if (!Number.isInteger(index) || index < 0 || index > container.length) throw new Error("INVALID_PATCH_PATH");
        if (op.op === "add") container.splice(index, 0, op.value);
        else {
          if (index === container.length) container.push(op.value);
          else container[index] = op.value;
        }
      } else {
        container[key] = op.value;
      }
      return;
    }
    if (op.op === "remove") {
      if (Array.isArray(container)) {
        const index = Number(key);
        if (!Number.isInteger(index) || index < 0 || index >= container.length) throw new Error("INVALID_PATCH_PATH");
        container.splice(index, 1);
      } else {
        if (!(key in container)) throw new Error("INVALID_PATCH_PATH");
        delete container[key];
      }
      return;
    }
    // move：value 為來源路徑字串（契約欄位僅 op/path/value 之約定）
    if (typeof op.value !== "string" || !op.value.startsWith("/")) throw new Error("INVALID_PATCH_PATH");
    const fromTokens = op.value.slice(1).split("/");
    if (fromTokens.length === 0 || fromTokens.some((t) => t.length === 0)) throw new Error("INVALID_PATCH_PATH");
    const source = UnifiedMatrixEngine.patchNavigate(root, fromTokens);
    let moved: unknown;
    if (Array.isArray(source.container)) {
      const index = Number(source.key);
      if (!Number.isInteger(index) || index < 0 || index >= source.container.length) throw new Error("INVALID_PATCH_PATH");
      moved = source.container.splice(index, 1)[0];
    } else {
      if (!(source.key in source.container)) throw new Error("INVALID_PATCH_PATH");
      moved = source.container[source.key];
      delete source.container[source.key];
    }
    if (Array.isArray(container)) {
      const index = key === "-" ? container.length : Number(key);
      if (!Number.isInteger(index) || index < 0 || index > container.length) throw new Error("INVALID_PATCH_PATH");
      container.splice(index, 0, moved);
    } else {
      container[key] = moved;
    }
  }

  /** 導覽至路徑父層：回傳容器與末段鍵。 */
  private static patchNavigate(
    root: Record<string, unknown>,
    tokens: string[]
  ): { container: Record<string, unknown> | unknown[]; key: string } {
    let current: Record<string, unknown> | unknown[] = root;
    for (let i = 0; i < tokens.length - 1; i++) {
      const token = tokens[i];
      const child = Array.isArray(current)
        ? current[Number(token)]
        : (current as Record<string, unknown>)[token];
      if (child === null || typeof child !== "object") throw new Error("INVALID_PATCH_PATH");
      current = child as Record<string, unknown> | unknown[];
    }
    return { container: current, key: tokens[tokens.length - 1] };
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
    const entropy = Number.parseFloat(((broken / total) * 0.5 + Math.min(node.blocks.length / 100, 0.5) * 0.5).toFixed(4));
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
