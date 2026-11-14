/**
 * @esggo/aios-matrix v0.1.0
 *
 * AIOS 系統終極融合矩陣（MECE 協同總表 v5.0）TypeScript 契約實作:
 *   「元件即代理」— 5 大行為核心 × 12 大 MECE 功能維度。
 *
 * 資料正典與 MECE 拓撲驗證: matrix.ts
 * 元件即代理運行層: fusion.ts
 * 正典文件: docs/vault-canon/AIOS-FUSION-MATRIX.md
 */
export {
  AIOS_AXIOMS,
  AIOS_AVATARS,
  AIOS_CORES,
  AIOS_DECLARED_AVATAR_COUNT,
  AIOS_DECLARED_ITEM_COUNT,
  AIOS_DIMENSIONS,
  AIOS_EXTERNAL_INTEGRATIONS,
  AIOS_PILLARS,
  AIOS_SECRET_ART_LOOP_NOTE,
  AIOS_SECRET_ARTS,
  AIOS_SOURCE_ORIGIN,
  AIOS_TECH_STACK,
  AIOS_WORLDVIEW,
  verifyAiosTopology,
  type AiosAxiom,
  type AiosAvatar,
  type AiosCore,
  type AiosCoreId,
  type AiosDimension,
  type AiosDimensionId,
  type AiosExternalIntegration,
  type AiosPillar,
  type AiosSecretArt,
  type AiosTechStackItem,
  type AiosTopologyReport,
  type AiosWorldviewPrinciple,
} from './matrix';
export {
  AiosDimensionAgent,
  AiosFusionMatrix,
  AiosMatrixError,
  type AiosDispatchRecord,
  type AiosIntent,
  type AiosIntentHandler,
  type AiosIntentResult,
} from './fusion';
