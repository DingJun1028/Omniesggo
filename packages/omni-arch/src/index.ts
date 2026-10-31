/**
 * @esggo/omni-arch v0.1.0
 *
 * 12大萬能架構 TypeScript 契約實作:
 *   三位一體 (OA/OAB/OAG) × 九大奇效 × 12大萬能模組 × OmniHeart × OmniBrain
 *
 * 四大維度 (MECE):
 *   物理: OmniBase / OmniMemory / OmniTime
 *   語義: OmniComponent / OmniTag / OmniEvidence
 *   動態: OmniAgent / OmniAPI / OmniBus
 *   治理: OmniGateway / OmniHealing / OmniEvolution
 *
 * 復用 @esggo/omni-core 已落地之 R1–R7:
 *   deepFreeze / egressLock / EntropyLedger / PrefetchGate / LearningLoop / ChaosEngine
 */
export { OmniArch, type ArchWire } from './arch';
export { OmniBase, type Lifecycle } from './base';
export { OmniMemory, type MemoryRecord } from './memory';
export { OmniTime } from './time';
export { OmniComponent, type ComponentDescriptor, type ComponentEffect } from './component';
export {
  HIGH_RISK_TAG,
  OmniTagRegistry,
  type OmniTagDef,
  type TagProtection,
} from './tag';
export {
  OmniEvidence,
  type Verification,
  type VerificationInputs,
  type VerifyOptions,
} from './evidence';
export { OmniAgent, type IntentHandler } from './agent';
export { OmniAPI, type RuneFn } from './api';
export { OmniBus, type BackpressureStrategy, type BusOptions, type PublishResult } from './bus';
export { OmniGateway } from './gateway';
export { OmniHealing, type HealOutcome } from './healing';
export { OmniEvolution, type EvolutionReport } from './evolution';
export { OmniSeed, type Germinated, type SeedDna, type SeedKind } from './seed';
export { OmniUserRegistry, type GrowthEntry } from './user-registry';
export { OmniTheme } from './theme';
export { OmniEngine, type EnginePulse } from './engine';
export { OmniBrain, OmniHeart } from './heart';
export {
  OmniAvatarCore,
  sealAvatarConfig,
  suggestMode,
  type AvatarCognitiveProfile,
  type AvatarConfig,
  type AvatarInterfaceConfig,
  type AvatarLayoutEngine,
  type AvatarMode,
  type AvatarToolPermissions,
  type AvatarTriggerRules,
  type AvatarWidget,
  type ToolPermissionDecision,
  type TriModeIntent,
} from './tri-mode';
export {
  mintEvent,
  MODULE_IDS,
  OmniArchError,
  type BusEvent,
  type ModuleId,
  type OmniDimension,
  type ThemeState,
} from './types';
