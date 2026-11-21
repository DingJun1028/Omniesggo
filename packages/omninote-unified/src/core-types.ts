/**
 * ============================================================================
 * OmniNote: Unified — 核心數據契約（@sinclair/typebox 單一真理來源）
 * 編譯期：Static<T> 靜態推導；執行期：Value.Check 嚴格斷言
 * ============================================================================
 */
import { Type, type Static } from "@sinclair/typebox";

export const UUIDv4Schema = Type.String({
  pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
});

export const HashSHA256Schema = Type.String({ pattern: "^[a-fA-F0-9]{64}$" });

export const SemVerSchema = Type.String({ pattern: String.raw`^\d+\.\d+\.\d+$` });

export const EvidenceEntrySchema = Type.Object(
  {
    source_origin: Type.String({ minLength: 1 }),
    captured_at: Type.String(),
    content_hash: HashSHA256Schema,
    hook_lifecycle: Type.String(),
    audit_formula: Type.String(),
  },
  { additionalProperties: false }
);

export const MatrixPhaseSchema = Type.Union([
  Type.Literal("ALPHA_ORIGIN_CAPTURE"),
  Type.Literal("SIGMA_GRAPH_SYNTHESIS"),
  Type.Literal("OMEGA_OBJECT_CRYSTAL"),
]);

export const MatrixVectorSchema = Type.Union([
  Type.Literal("FORWARD_PROMOTE"),
  Type.Literal("REVERSE_PROJECT"),
  Type.Literal("LATERAL_REBASE"),
]);

export const CRDTBlockSchema = Type.Object(
  {
    block_id: UUIDv4Schema,
    type: Type.Union([
      Type.Literal("paragraph"),
      Type.Literal("heading"),
      Type.Literal("checklist_item"),
      Type.Literal("sketch_vector"),
      Type.Literal("audio_transcript"),
      Type.Literal("object_attribute_card"),
    ]),
    content: Type.String(),
    lamport_ts: Type.Integer({ minimum: 0 }),
    peer_id: Type.String({ minLength: 1 }),
    deleted: Type.Boolean({ default: false }),
  },
  { additionalProperties: false }
);

export const GraphTopologyLinkSchema = Type.Object({
  target_uuid: UUIDv4Schema,
  wikilink_alias: Type.String(),
  resolved: Type.Boolean(),
});

export const UnifiedNodeSchema = Type.Object(
  {
    uuid: UUIDv4Schema,
    version: SemVerSchema,
    timestamp: Type.Integer({ minimum: 0 }),
    matrix_phase: MatrixPhaseSchema,
    entity_type: Type.String(),
    blocks: Type.Array(CRDTBlockSchema),
    topology: Type.Object({
      outlinks: Type.Array(GraphTopologyLinkSchema),
      tags: Type.Array(Type.String()),
    }),
    properties: Type.Record(Type.String(), Type.Unknown()),
    evidence: Type.Array(EvidenceEntrySchema),
    lock_hash: HashSHA256Schema,
    entropy_score: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
  },
  { additionalProperties: false }
);

export const SyncDeltaPacketSchema = Type.Object({
  packet_id: UUIDv4Schema,
  node_uuid: UUIDv4Schema,
  from_phase: MatrixPhaseSchema,
  to_phase: MatrixPhaseSchema,
  vector: MatrixVectorSchema,
  clock_vector: Type.Record(Type.String(), Type.Integer()),
  patch: Type.Array(
    Type.Object({
      op: Type.Union([Type.Literal("add"), Type.Literal("remove"), Type.Literal("replace"), Type.Literal("move")]),
      path: Type.String(),
      value: Type.Optional(Type.Unknown()),
    })
  ),
  state_signature: HashSHA256Schema,
});

export type UUIDv4 = Static<typeof UUIDv4Schema>;
export type HashSHA256 = Static<typeof HashSHA256Schema>;
export type EvidenceEntry = Static<typeof EvidenceEntrySchema>;
export type MatrixPhase = Static<typeof MatrixPhaseSchema>;
export type MatrixVector = Static<typeof MatrixVectorSchema>;
export type CRDTBlock = Static<typeof CRDTBlockSchema>;
export type GraphTopologyLink = Static<typeof GraphTopologyLinkSchema>;
export type UnifiedNode = Static<typeof UnifiedNodeSchema>;
export type SyncDeltaPacket = Static<typeof SyncDeltaPacketSchema>;
