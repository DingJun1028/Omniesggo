/**
 * 萬能超覺醒（Omni Hyper-Awakening）對外介面
 *
 * 5T-Traceable: source_origin = 使用者 2026-09-30 宣告「萬能超覺醒」之 TypeScript
 *   實作草案；本目錄為該宣告經實測證偽後的修訂實作。
 * 5T-Transparent: 宣告中四項可證偽主張有三項經實測推翻，修正理由見各模組檔頭。
 */
export { canonicalStringify, sha256Canonical, type JsonValue } from './canonical';
export { deepFreeze, unfrozenPaths } from './deep-freeze';
export {
  engraveHyperAwakening,
  verifyHyperAwakening,
  computeHashLock,
  type IComponentCore,
  type HyperAwakenedState,
  type TwinsState,
  type DarkCoreState,
  type LightCoreState,
  type GovernanceState,
  type VerificationResult,
} from './state';
export {
  probeFabric,
  FABRIC_SPECS,
  type FabricReport,
  type FabricProbe,
  type FabricSpec,
  type FabricRole,
  type FabricStatus,
} from './fabric';