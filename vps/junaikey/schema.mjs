// vps/junaikey/schema.mjs
// ============================================================
// 共享常數、MANTRA、traits 定義
// ============================================================
export const MANTRA = '無作妙德。圓通無礙';
export const SKILL_TRAITS = ['永恆', '被動', '自主', '共享', '閉環', '圓通'];
export const NCB_TABLES = {
  skills: 'junaikey_skills',
  memory: 'junaikey_memory',
  progress: 'junaikey_progress',
  journal: 'junaikey_journal',
  lineage: 'junaikey_lineage',  // FR-05 標籤血緣追蹤
};
export const DEFAULT_MEMORY_RETENTION = 1000;
export const DEFAULT_NCB_LIST_LIMIT = 500;
export const DEFAULT_NCB_BULK_LIMIT = 500;
export const MAX_NCB_PAGES = 100;

// F-04 知識沉澱框架 L1-L5 (對應 Omniesggo 通典 §2.1 五大層級)
// L1 原始資料:剛寫入,未消化
// L2 結構化:已加 tag,結構化
// L3 語意化:已生成 vector,語意可搜尋
// L4 推理化:已 cross-reference,邏輯連接
// L5 組織化:已沉澱為組織智慧,跨專案通用
export const SEDIMENTATION_LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5'];
export const SEDIMENTATION_LABELS = {
  L1: '原始資料 (raw data)',
  L2: '結構化 (structured)',
  L3: '語意化 (semantic)',
  L4: '推理化 (inferred)',
  L5: '組織化 (organizational wisdom)',
};
