/**
 * OmniAgentBus — 入口
 */
export { OmniAgentBus, createBus, bus5TGate } from './bus.js';
export type { FiveTDimension } from './bus.js';
export { deployGate, tryLoadForgeT5 } from './deploy-gate.js';
export { loadOAFramework, oaToBusPipeline } from './oa-bridge.js';
export type { BusHandler, BusMessage, OATaskResult, SubFrameId, IComponentCore } from './types.js';
export type { OAFrameworkModule } from './oa-bridge.js';
export { TaskGraph } from './orchestrator/task-graph.js';
export type { TaskNode, TaskContext, TaskResult, TaskStatus, TaskGraphOptions } from './orchestrator/task-graph.js';
export { AgentRegistry, createDescriptor, getArrayCapabilities } from './registry/agent-registry.js';
export type { AgentDescriptor, ResonanceEvent } from './registry/agent-registry.js';
export { ARRAY_CAPABILITIES } from './registry/agent-registry.js';
// ── R4/R5 v2 hardening (2026-10-30, 承接 @esggo/omni-core PR #106) ──
export { IdempotentJournal, wrapIdempotent } from './idempotent-replay.js';
export type { ReplayedMessage, ReplayOptions } from './idempotent-replay.js';
export { StateSnapshotStore } from './state-snapshot.js';
export type { FissionState } from './state-snapshot.js';
