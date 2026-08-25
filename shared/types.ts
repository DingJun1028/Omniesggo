/**
 * 🌌 Omnipotent Think Tank - Shared Type Definitions
 * v3.1.0-Omni
 */

export enum ESGKnowledgeBase {
  ESG_STANDARDS = 'esg_standards',
  GRI_STANDARDS = 'gri_standards',
  TCFD_FRAMEWORK = 'tcfd_framework',
  SASB_STANDARDS = 'sasb_standards',
  SDGS_GOALS = 'sdgs_goals',
  CARBON_EMISSION = 'carbon_emission',
  ESG_REGULATIONS = 'esg_regulations',
  BEST_PRACTICES = 'best_practices',
}

export interface IKnowledgeRecord {
  id: string;
  content: string;
  source: string;
  kb: ESGKnowledgeBase;
  metadata?: Record<string, any>;
  embedding?: number[];
  createdAt: number;
}

export interface IRAGResult {
  answer: string;
  sources: { content: string; source: string; score: number }[];
  confidence: number;
  tokensUsed?: number;
}

// ARVO AI Workflow Stages
export enum ARVOStage {
  ANALYZE = 'ANALYZE',
  REASON = 'REASON',
  VERIFY = 'VERIFY',
  ORCHESTRATE = 'ORCHESTRATE',
}

export interface IARVOPlan {
  taskId: string;
  currentStage: ARVOStage;
  findings: string[];
  reasoning: string;
  verificationStatus: 'PENDING' | 'PASSED' | 'FAILED';
  skillsRequired: string[];
}

export interface IAgentProfile {
  id: string;
  name: string;
  role: string;
  skills: string[];
  status: 'IDLE' | 'BUSY' | 'EVOLVING';
  memory_pt: number;
}

// --- Skill Matrix Types ---
export enum SkillCategory {
  ESG_ANALYSIS = 'ESG_ANALYSIS',
  CARBON_ACCOUNTING = 'CARBON_ACCOUNTING',
  REGULATORY_COMPLIANCE = 'REGULATORY_COMPLIANCE',
  STAKEHOLDER_ENGAGEMENT = 'STAKEHOLDER_ENGAGEMENT',
  DATA_VERIFICATION = 'DATA_VERIFICATION',
}

export enum MasteryLevel {
  NOVICE = 'NOVICE',
  APPRENTICE = 'APPRENTICE',
  JOURNEYMAN = 'JOURNEYMAN',
  EXPERT = 'EXPERT',
  MASTER = 'MASTER',
}

export interface ISkillNode {
  id: string;
  uuid?: string;
  name: string;
  layer: number; // 0-7
  category: SkillCategory;
  description: string;
  hitlRequired: boolean;
  level: MasteryLevel;
  experience: number;
  unlocked_at?: string;
  certificate_hash?: string;
}

export interface IAwakeningResult {
  thought: string;
  action: string;
  reasoning: string;
  confidence: number;
  metadata?: Record<string, any>;
  skill_points_earned?: number;
}

export interface IHITLProposal {
  id: string;
  agentId: string;
  action: string;
  parameters: any;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rationale: string;
}

// --- ESG GO Core Types ---

export interface IServiceModule {
  id: string;
  uuid: string;
  name: string;
  route: string;
  domain: string;
}

export interface IEsgMetric {
  id: string;
  metric_id?: string;
  category: "E" | "S" | "G";
  year: number;
  name: string;
  metric_name?: string;
  value: number;
  target_value?: number;
  unit: string;
  status: string;
}

export interface IEvidenceRecord {
  id: string;
  record_id: string;
  type: string;
  timestamp: string;
  hash: string;
  status: string;
  variant: "optimal" | "critical" | "lethal";
  owner_id?: string;
}

export interface IMaterialityTopic {
  id: string;
  topic_name: string;
  category: "E" | "S" | "G";
  business_impact: number;
  stakeholder_importance: number;
  description?: string;
}

export interface ISupplyChainVendor {
  id: string;
  vendor_name: string;
  tier: "Tier 1" | "Tier 2" | "Tier 3";
  compliance_score: number;
  carbon_emission: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  last_audit_date: string;
  status: "Active" | "Under Review" | "Suspended";
}

export interface IUserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
  goodness_coins: number;
  sustainability_gems: number;
}

export interface ICommunityPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category: string;
  likes: number;
  created_at: string;
}

export interface IVillageMember {
  id: string;
  user_id: string;
  village_name: string;
  level: number;
  title: string;
  reputation: number;
}

export interface IOmniNote {
  id: string;
  note_id: string;
  type: "no-action" | "insight";
  title: string;
  content: string;
  variant: "optimal" | "critical" | "lethal";
  dimensions: {
    truthful: number;
    transferful: number;
    thankful: number;
    tasteful: number;
    trustful: number;
  };
  tags: string[];
  created_at: string;
  updated_at: string;
  spirit_feedback?: string;
  hash?: string;
}

export interface IApiResult<T> {
  data: T;
  error?: any;
}

// --- Universal Translator (萬能即時翻譯) Domain Types ---
// canonical 源: esggo/shared/types.ts → 經 scripts/export-shared-types.js
// 生成各 consumer 的 types/generated/esggo-shared.d.ts (雙向 TS 終始矩陣)
// 語言碼矩陣: esggo/shared/lang-matrix.mjs → 經 scripts/sync-lang-matrix.mjs (執行期與型別雙向同步)

/** 翻譯引擎識別 (5T 可溯源 X-OA-Engine) */
export enum TranslateEngine {
  GOOGLE_GTX = 'google-gtx',
  LIBRETRANSLATE = 'libretranslate',
  MYMEMORY = 'mymemory',
  OLLAMA = 'ollama',
  PASSTHROUGH = 'passthrough',
  FALLBACK_ORIGIN = 'fallback-origin',
}

/** 支援語碼 (zh-TW 為繁中展示名, 內部規範為 zh-CN; 完整 union 見 lang-matrix) */
export type LanguageCode =
  | 'auto' | 'zh' | 'zh-CN' | 'zh-TW' | 'zh-Hant'
  | 'en' | 'ja' | 'ko' | 'es' | 'fr';

/** /translate 單語請求 */
export interface ITranslateRequest {
  text: string;
  /** 來源語碼 (運行期允許任意 string) */
  from?: string;
  /** 目標語碼 (運行期允許任意 string) */
  to?: string;
  /** 多語平行翻譯目標 (即時轉播場景) */
  targets?: LanguageCode[];
  /** 房間隔離 (SSE 多房間) */
  room?: string;
}

/** /translate 單語回應 */
export interface ITranslateResult {
  text: string;
  /** 引擎識別字串 (對齊 TranslateEngine 枚舉值, 但以 string 寬鬆容許運行期動態引擎) */
  engine: string;
  cached: boolean;
  version?: string;
}

/** /speak 即時轉播推播請求 (studio → SSE) */
export interface ISpeakPayload {
  text: string;
  /** 來源語碼 (運行期允許任意 string, 引擎層再做規範化) */
  from?: string;
  /** 目標語碼 (運行期允許任意 string) */
  to?: string;
  targets?: LanguageCode[];
  room?: string;
  speaker?: string;
}

/** SSE /stream 推播事件 (觀眾端雙語浮層字幕) */
export interface ISseTranslationEvent {
  text: string;
  translations: Partial<Record<LanguageCode, string>>;
  engines?: Partial<Record<LanguageCode, string>>;
  /** 單語場景的引擎識別字串 (對齊 TranslateEngine) */
  engine?: string;
  cached?: boolean;
  trace?: string;
  room?: string;
  speaker?: string;
  /** 跨句脈絡記憶: 近期前文 (供 UI 顯示「前文」, 提升連貫) */
  context?: Array<{ src: string; tgt?: string }>;
}

// --- STT → 雙語字幕契約 (語音轉字幕場景, 鎖定繁中↔英文雙向) ---
// 消費端 apps/universal-translator/stt_client.mjs 依賴 ISpeechToSubtitleResult
// 終始矩陣: 任一端需求 → 回饋 canonical → 重跑 scripts/export-shared-types.js → 全端同步

/** 雙語配對 (鎖定 zh-TW↔en, 禁其他) */
export type BilingualPair = 'zh-TW-en' | 'en-zh-TW';

/** /transcribe 請求契約 (音訊由 multipart 帶入, 此處僅描述 metadata) */
export interface ISpeechToSubtitleRequest {
  /** 語言提示 (鎖定雙向, 禁其他) */
  languageHint?: 'zh-TW' | 'en';
  /** 房間隔離 (SSE 多房間) */
  room?: string;
  /** 講者標籤 (5T 溯源) */
  speaker?: string;
}

/** STT 辨識 + 即時雙向翻譯的合併結果 (stt_client.mjs 產出) */
export interface ISpeechToSubtitleResult {
  /** 原始辨識文字 */
  text: string;
  /** STT 偵測語 (鎖定雙向) */
  detected: 'zh-TW' | 'en';
  /** 即時翻譯對向 (單語場景): zh-TW→en 或 en→zh-TW */
  translation: string;
  /** 翻譯目標語 */
  target: 'zh-TW' | 'en';
  /** 平行翻譯多語場景: 語碼 → 譯文 (translateToMany 輸出) */
  translations?: Partial<Record<LanguageCode, string>>;
  /** 引擎識別字串 (5T 溯源: stt:whisper + ollama:<model>) */
  engine: string;
  /** 平行翻譯多語場景: 語碼 → 引擎 (translateToMany 輸出) */
  engines?: Partial<Record<LanguageCode, string>>;
  /** 是否命中快取 */
  cached: boolean;
  /** 溯源追蹤碼 */
  trace?: string;
}

/** 全域全端全量雙向 TS 架構終始矩陣錨點 (全 consumer 共享同一份契約) */
export interface IOmniTypeMatrix {
  canonical: 'esggo/shared/types.ts';
  generator: 'scripts/export-shared-types.js';
  consumers: string[]; // 各端 types/generated/esggo-shared.d.ts 路徑
}

// ===== 萬能即時雙語字幕撥放器 · 三元一體 (Zoom 線上會議場景) 領域契約 =====
// 三元: 載入(source) + 撥放(playback) + 字幕(caption) 同一頁; 來源支援 檔案/網址/Zoom 會議 三態
export type PlayerSourceKind = 'file' | 'url' | 'zoom';

/** 播放器來源聯合 (繁中英碼終始矩陣雙向同步) */
export type IPlayerSource =
  | { kind: 'file'; file: File }
  | { kind: 'url'; url: string }
  | { kind: 'zoom'; displayMedia: MediaStream };

/** Zoom 線上會議中繼資料 */
export interface IZoomMeeting {
  /** Zoom 會議號 (選填, 僅作展示) */
  meetingId?: string;
  /** 會議原文語言 (對齊 LanguageCode) */
  sourceLang: LanguageCode;
  /** 是否為線上直播中 */
  isLive: boolean;
}

/** 撥放器運行態 (三元一體狀態機) */
export interface IPlayerState {
  sourceKind: PlayerSourceKind;
  isPlaying: boolean;
  isCaptioning: boolean;
  lastCaption?: { src: string; translations: Partial<Record<LanguageCode, string>> };
}


export interface ISecondBrainNote {
  id: string;
  title: string;
  tags: string[];
  source_origin: string;
  sync: 'mirror' | 'up';
}

// ===== OA-Team 雙蜂戰隊 60 領域契約 (蜂群 / 5T 驗算 / 靈魂產物) =====
// 終始矩陣: OA 核心契約集中定義於此 (終), 各 consumer (oa-swarm / dashboard) 消費生成檔 (始)
// 任一端需求變更 → 回饋此處 → 重跑 scripts/export-shared-types.js → 全端同步

/** 雙蜂側: 蜂王 OA-LOCAL (本機) / 蜂后 OA-VPS (雲端) */
export type HiveSide = 'local' | 'vps';

/** 五陣列 MECE 鍵 */
export type ArrayKey = 'sanctum' | 'rune' | 'wing' | 'alchemy' | 'audit';

/** 單一蜂代理 (雙蜂戰隊 60 員矩陣成員) */
export interface ISoulAgent {
  id: number;
  title: string;
  tags: string[];
  array: ArrayKey;
  side: HiveSide;
  task: string;
}

/** 靈魂核心契約: 5T 強制層產物 (Traceable/Trackable/Tangible/Transparent/Trustworthy) */
export interface IComponentCore {
  uuid: string;        // 萬能永憶主體唯一識別碼 (Traceable)
  version: string;     // 語意化版本控制
  timestamp: number;   // 刻印時間戳
  evidence: Record<string, unknown>; // 證據佐證庫
}

/** 5T 凍結靈魂產物 (purify 產出, Object.freeze 後不可篡改) */
export interface ISoulArtifact extends IComponentCore {
  source_origin: string; // Traceable: 產物來源標註
  lifecycle: string[];   // Trackable: 狀態流轉記錄
  hash_lock: string;     // Trustworthy: 雜湊鎖定
  author: string;        // Trustworthy: 不可篡改署名
}

/** 蜂群任務契約 (executeSwarmTask 輸入) */
export interface ISwarmTask {
  task: string;
  source_origin: string; // Traceable
  array?: ArrayKey;      // 指定陣列 (選填)
  side?: HiveSide;       // 指定蜂側 (選填)
}

/** 蜂群任務結果 (5T 驗算後凍結) */
export type SwarmTaskResult = Readonly<ISoulArtifact>;

/** OAB (OmniAgentBus) 訊息契約 — 跨蜂群 / 跨服務總線 */
export interface IOABMessage {
  serviceId: string;
  topic: string;
  payload: unknown;
  trace?: string;       // 5T 溯源碼
  ts: number;
}

/** 5T 驗算結果 (零幻覺驗算守門) */
export interface I5TVerification {
  traceable: boolean;
  trackable: boolean;
  tangible: boolean;
  transparent: boolean;
  trustworthy: boolean;
  passed: boolean;
}

// ===== OA-Team 缺口補齊 · 終始矩陣契約 (Gap Remediation Terminal-Origin Matrix) =====
// 雙語 (繁中 + English) | 全域全端全量全面 | 單一真相源 shared/gap-matrix.ts 程式化派生 72 配對
// 終 (canonical): 本節型別在此一次性定義 → 重跑 scripts/export-shared-types.js → 全端 consumer 雙向同步 (始)
// 5T: 每一配對皆標 source_origin (Traceable) / 可追蹤 (Trackable) / 體感回饋 (Tangible) /
//     / 公開推導 (Transparent) / 凍結不可篡改 (Trustworthy)

/** 五大陣列 MECE 鍵 (Five Arrays, MECE) */
export type GapUnitKey = 'strategy' | 'technology' | 'creative' | 'marketing' | 'guard';

/** 配對角色: 基礎 MECE 1:1 / 樞紐疊加 (base / hub) */
export type GapRole = 'base' | 'hub';

/** 樞紐種類: 守衛防護 / 蜂后總控 (guard-defense / queen-command) */
export type GapHubKind = 'guard-defense' | 'queen-command';

/** 單一蜂代理名冊 (30 員, 雙語) — 與 §二 30 矩陣編號歸屬嚴格對齊 */
export interface IGapAgent {
  /** 編號 01-30 */
  id: number;
  /** 稱號 (繁中) */
  title: string;
  /** Title (English) */
  titleEn: string;
  /** 所屬陣列 */
  unit: GapUnitKey;
}

/** 跨組配對 (成員級) — 基礎或樞紐 */
export interface IGapPairing {
  /** 左側代理編號 */
  a: number;
  /** 右側代理編號 */
  b: number;
  /** 左側陣列 */
  aUnit: GapUnitKey;
  /** 右側陣列 */
  bUnit: GapUnitKey;
  /** 角色 */
  role: GapRole;
  /** 樞紐種類 (role=hub 時) */
  hubKind?: GapHubKind;
  /** 樞紐覆蓋陣列 (role=hub 時, 如 '全陣列'→ 五陣列皆列) */
  coverage?: GapUnitKey[];
  /** 5T 溯源標籤 (Traceable) */
  source_origin: 'gap-matrix-canon';
}

/** 缺口補齊覆蓋率證明 (Coverage Proof) — 深貫廣通無礙圓通 */
export interface IGapMatrixCoverage {
  /** 成員總數 */
  totalAgents: 30;
  /** 基礎配對數 (C(5,2)×6) */
  totalBase: 60;
  /** 樞紐配對數 (守衛防護 6 + 蜂后總控 6) */
  totalHub: 12;
  /** 配對總數 (60+12) */
  totalPairings: 72;
  /** 陣列對覆蓋 (C(5,2)) */
  arrayPairs: 10;
  /** 成員跨組觸達 */
  reach: '30/30';
}
