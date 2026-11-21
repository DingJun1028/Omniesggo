// PRD: docs/OMN-PRD-001.md §4.1 FR-02（即時事件流/ schema 追溯標註）
// apps/gateway/sync/schema.ts
// 運行時驗證（TypeBox）— 與 types.ts 的編譯期型別互補。
// 所有跨節點封包都先過 TypeBox Value.Check 再進入引擎，避免髒資料污染全域同步態。
import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import type { SyncPacket } from './types.js';

export const NodeKindSchema = Type.Union([Type.Literal('esggo'), Type.Literal('omni'), Type.Literal('relay'), Type.Literal('unknown')]);
export const TransportSchema = Type.Union([Type.Literal('ws'), Type.Literal('http'), Type.Literal('relay')]);

export const AgentStateSchema = Type.Object({
  agentId: Type.String(),
  name: Type.String(),
  host: Type.String(),
  channel: Type.String(),
  capabilities: Type.Array(Type.String()),
  status: Type.Union([Type.Literal('online'), Type.Literal('offline'), Type.Literal('summoned'), Type.Literal('busy')]),
  registeredAt: Type.Number(),
  lastHeartbeat: Type.Number(),
  layers: Type.Optional(Type.Array(Type.String())),
  summonedAt: Type.Optional(Type.String()),
  awakeningAuth: Type.Optional(Type.String()),
  fruitSeal: Type.Optional(Type.String()),
  system: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
});

export const ESGGOStateSchema = Type.Object({
  appVersion: Type.String(),
  buildId: Type.Union([Type.String(), Type.Null()]),
  activeWorkers: Type.Number(),
  agents: Type.Array(AgentStateSchema),
  lastSyncAt: Type.Number(),
});

export const OmniStateSchema = Type.Object({
  gatewayVersion: Type.String(),
  platform: Type.String(),
  vpsIp: Type.String(),
  activeWorkers: Type.Number(),
  providers: Type.Record(Type.String(), Type.Boolean()),
  agents: Type.Array(AgentStateSchema),
  websocket: Type.Object({ enabled: Type.Boolean(), clients: Type.Number() }),
  skills: Type.Object({ total: Type.Number(), transcended: Type.Number() }),
  lastSyncAt: Type.Number(),
});

export const SyncPacketSchema = Type.Object({
  v: Type.Literal(1),
  from: NodeKindSchema,
  to: Type.Union([NodeKindSchema, Type.Literal('*')]),
  kind: Type.Union([
    Type.Literal('state'), Type.Literal('patch'), Type.Literal('heartbeat'), Type.Literal('summon'),
    Type.Literal('cmd'), Type.Literal('result'), Type.Literal('ack')
  ]),
  seq: Type.Integer({ minimum: 0 }),
  ts: Type.Integer({ exclusiveMinimum: 0 }),
  payload: Type.Unknown(),
  originId: Type.String({ minLength: 1 }),
});

export type SyncPacketParsed = Static<typeof SyncPacketSchema>;

/** 安全解析：失敗回 null（不丟棄，避免同步迴圈崩潰） */
export function safeParsePacket(raw: unknown): SyncPacket | null {
  return Value.Check(SyncPacketSchema, raw) ? (raw as SyncPacket) : null;
}
