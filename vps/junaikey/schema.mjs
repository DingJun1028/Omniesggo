// vps/junaikey/schema.mjs
// ============================================================
// 共享常數、MANTRA、traits 定義
// NCB table 名稱可由 env 覆寫 (e.g. NCBDB_TABLE_SKILLS=skills)
// ============================================================
export const MANTRA = '無作妙德。圓通無礙';
export const SKILL_TRAITS = ['永恆', '被動', '自主', '共享', '閉環', '圓通'];
export const NCB_TABLES = {
  skills:   process.env.NCBDB_TABLE_SKILLS   || 'junaikey_skills',
  memory:   process.env.NCBDB_TABLE_MEMORY   || 'junaikey_memory',
  progress: process.env.NCBDB_TABLE_PROGRESS || 'junaikey_progress',
  journal:  process.env.NCBDB_TABLE_JOURNAL  || 'junaikey_journal',
  lineage:  process.env.NCBDB_TABLE_LINEAGE  || 'junaikey_lineage',
};
export const DEFAULT_MEMORY_RETENTION = 1000;
export const DEFAULT_NCB_LIST_LIMIT = 500;
export const DEFAULT_NCB_BULK_LIMIT = 500;
// ── Superpowers 7 階段融合 ──
// 把上游 Superpowers 的 7 階段編碼方法論，注入 junaikey 成長層。
// 每個階段以 'superpowers:stage:<id>' 標籤writers + journal 記錄，形成 closed-loop。
export const SUPERPOWERS_VERSION = '1.1.0';
export const SUPERPOWERS_STAGES = [
  { id: 'brainstorming', label: '腦力激盪', order: 1, desc: '寫碼前釐清真要做什麼;分段設計供簽核' },
  { id: 'worktrees', label: '工作樹隔離', order: 2, desc: '隔離 workspace;驗證乾淨測試基線' },
  { id: 'plans', label: '實作計畫', order: 3, desc: '拆 2-5 分鐘小任務;含檔案路徑/完整碼/驗證步驟' },
  { id: 'subagent', label: '子代理執行', order: 4, desc: '派 subagent + 兩階段審查(規格→品質)' },
  { id: 'tdd', label: '測試驅動開發', order: 5, desc: 'RED-GREEN-REFACTOR;測試先覆蓋' },
  { id: 'codereview', label: '代碼審查', order: 6, desc: '對照計畫審查;critical 阻擋' },
  { id: 'finish5t', label: '5T 驗證閘', order: 7, desc: 'Traceable/Trackable/Tangible/Transparent/Trustworthy' },
];
// 12 項 superpowers 標籤 (7 階段 + 5 支援標籤)
// 格式: <key>:<value>, 其中 key='superpowers', value 為階段 id / 支援標籤
export const SUPERPOWERS_TAGS = [
  'superpowers:brainstorming',
  'superpowers:worktrees',
  'superpowers:plans',
  'superpowers:subagent',
  'superpowers:tdd',
  'superpowers:codereview',
  'superpowers:finish5t',
  'superpowers:version',
  'superpowers:closedloop',
  'superpowers:formulation',
  'superpowers:branch',
  'superpowers:daemon',
];
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
