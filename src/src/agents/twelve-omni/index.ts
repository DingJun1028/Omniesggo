/**
 * ==========================================
 * 🌌 12-Omni Architecture — 十二萬能元件模組入口
 * ==========================================
 *
 * Organized into 4 Dimensions:
 *   Foundation:  OmniBase, OmniMemory(萬能永憶), OmniTime, OmniComponent(萬能元件)
 *   Boundaries:  OmniTag, OmniEvidence
 *   Execution:   OmniAgent, OmniAPI, OmniBus
 *   Governance:  OmniGateway, OmniHealing, OmniEvolution
 *
 * Plus 9 Magic-Effect Combinations (九大奇效組合)
 */

// ═══════════════════════════════════════════════════════════════
// Foundation Dimension — 基礎維度
// ═══════════════════════════════════════════════════════════════

export { OmniBase, getOmniBase } from './omni-base';
export { OmniMemory, getOmniMemory } from './omni-memory';
export { OmniTime, getOmniTime } from './omni-time';
export { OmniComponent, getOmniComponent } from './omni-component';

// ═══════════════════════════════════════════════════════════════
// Boundaries Dimension — 邊界維度
// ═══════════════════════════════════════════════════════════════

export { OmniTag, getOmniTag } from './omni-tag';
export { OmniEvidence, getOmniEvidence } from './omni-evidence';

// ═══════════════════════════════════════════════════════════════
// Execution Dimension — 執行維度
// ═══════════════════════════════════════════════════════════════

export { OmniAgentV2, createOmniAgent } from './omni-agent-v2';
export { OmniAPI, getOmniAPI } from './omni-api';
export { OmniBusV2, getOmniBus } from './omni-bus';

// ═══════════════════════════════════════════════════════════════
// Governance Dimension — 治理維度
// ═══════════════════════════════════════════════════════════════

export { OmniGatewayV2, getOmniGateway } from './omni-gateway';
export { OmniHealing, getOmniHealing } from './omni-healing';
export { OmniEvolution, getOmniEvolution } from './omni-evolution';

// ═══════════════════════════════════════════════════════════════
// 9 Magic-Effect Combinations — 九大奇效組合
// ═══════════════════════════════════════════════════════════════

export {
  ChaosHealing,
  TemporalRift,
  CellularFission,
  ProphetMatrix,
  OmniscientHive,
  MartialLaw,
  UniversalMemory,
  TaiChiResonance,
  OmniConvergence,
} from './magic-effects';

// ═══════════════════════════════════════════════════════════════
// Type Re-exports — 類型導出
// ═══════════════════════════════════════════════════════════════

export type {
  // Foundation
  IOmniBase,
  IOmniMemory,
  IOmniTime,
  IOmniComponent,
  // Boundaries
  IOmniTag,
  IOmniEvidence,
  // Execution
  IOmniAgentV2,
  IOmniAPI,
  IOmniBusV2,
  // Governance
  IOmniGatewayV2,
  IOmniHealing,
  IOmniEvolution,
  // Magic Effects
  IChaosHealing,
  ITemporalRift,
  ICellularFission,
  IProphetMatrix,
  IOmniscientHive,
  IMartialLaw,
  IUniversalMemory,
  ITaiChiResonance,
  IOmniConvergence,
} from '../../types/twelve-omni';
