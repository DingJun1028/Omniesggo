/**
 * OmniAgentBus — 入口
 */
export { OmniAgentBus, createBus, bus5TGate } from './bus.js';
export type { FiveTDimension } from './bus.js';
export { deployGate, tryLoadForgeT5 } from './deploy-gate.js';
export { loadOAFramework, oaToBusPipeline } from './oa-bridge.js';
export type { BusHandler, BusMessage, OATaskResult, SubFrameId, IComponentCore } from './types.js';
export type { OAFrameworkModule } from './oa-bridge.js';
