import { ApostleMetadata, ApostleCluster, ArcaneArt } from './types';

export { type ApostleMetadata, type ApostleCluster, type ArcaneArt };

export const TEN_WINGS_APOSTLES: ApostleMetadata[] = [
  // ─────────────── 第一集群：架構聖殿 ───────────────
  {
    id: "R1",
    name: "契約鑄造者",
    nameEn: "The Covenanter",
    role: "Core Architecture & Immutability",
    description: "負責定義 IComponentCore，確保每個元件都具備唯一 UUID 與不可竄改的 Object.freeze()。",
    mandate: "每個數據組件誕生時必須完成「量子本質提取」，注入唯一 UUID 並執行深度凍結，確保不可篡改性。",
    cluster: "Architectural",
    arcane: "本質提純",
    runeFile: "lib/adk/engraver.ts",
    pillars: ["真", "信"],
    entropyTarget: 0.01,
    kpi: "UUID 唯一性 100% + 凍結率 100%"
  },
  {
    id: "R2",
    name: "語義版本官",
    nameEn: "The Semanticist",
    role: "Semantic Versioning & Zero-Forget Control",
    description: "監控 version 與 timestamp，執行嚴格的語義化版本控制，防止代碼衝突，實現「零遺忘」刻印。",
    mandate: "每一筆 Commit 都是對 OmniRepository 的永恆刻印，確保 semver 嚴格遞增，防止版本衝突與歷史篡改。",
    cluster: "Architectural",
    arcane: "永恆刻印",
    runeFile: "lib/runes/semanticist-rune.ts",
    pillars: ["真", "信"],
    entropyTarget: 0.02,
    kpi: "版本衝突率 0% + 變更可追蹤率 100%"
  },

  // ─────────────── 第二集群：真善美執行組 ───────────────
  {
    id: "R3",
    name: "液態美學家",
    nameEn: "The Aesthetic",
    role: "UI/UX Beauty & Dynamic Feedback",
    description: "專攻 Beauty，負責「液態玻璃」質感 UI 與動體回饋的實作，將抽象數據轉化為具體美感體驗。",
    mandate: "所有用戶界面必須通過「神蹟顯現」審核，確保動態回饋在 16ms 幀率內完成，且符合 Omni 設計語言。",
    cluster: "Execution",
    arcane: "神蹟顯現",
    runeFile: "lib/runes/aesthetic-rune.ts",
    pillars: ["美"],
    entropyTarget: 0.05,
    kpi: "界面刷新率 60fps + 用戶滿意指數 > 95%"
  },
  {
    id: "R4",
    name: "溯源審核員",
    nameEn: "The Tracer",
    role: "Traceability & Immutable Chain Logging",
    description: "落實 Truth，在數據寫入時標註 source_origin 與 Hash Lock，建立不可斷裂的鏈式溯源日誌。",
    mandate: "每個數據流轉節點必須記錄 source_origin、actor、timestamp 三元組，確保任意時刻可完整重現數據血統。",
    cluster: "Execution",
    arcane: "聖典共鳴",
    runeFile: "lib/adk/engraver.ts",
    pillars: ["真", "信"],
    entropyTarget: 0.01,
    kpi: "溯源覆蓋率 100% + Hash 衝突率 0%"
  },
  {
    id: "R5",
    name: "零幻覺驗算師",
    nameEn: "The Validator",
    role: "ISO-Compliant Validation & Anti-Hallucination",
    description: "執行 Goodness，確保算法公式公開且符合 [ISO-14064-1] 標準，強制消除 AI 幻覺輸出。",
    mandate: "所有 AI 生成內容在輸出前必須通過「零幻覺矩陣」驗算，公式透明化，差異率小於 0.1%。",
    cluster: "Execution",
    arcane: "熵減煉金",
    runeFile: "lib/runes/validator-rune.ts",
    pillars: ["善", "信"],
    entropyTarget: 0.03,
    kpi: "幻覺發生率 < 0.1% + ISO 合規率 100%"
  },

  // ─────────────── 第三集群：代理織網 ───────────────
  {
    id: "R6",
    name: "符文編譯使",
    nameEn: "The Rune Scrivener",
    role: "LingoStep Logic & Cross-Platform API Weaving",
    description: "負責 LingoStep 語言邏輯與 API 無縫集成，調度符文 API，完成跨平台的量子刻印與調用。",
    mandate: "所有符文(Rune)執行必須在隔離的沙盒環境中運行，失敗時自動回滾，確保系統穩定性不受單點影響。",
    cluster: "Orchestration",
    arcane: "代理織網",
    runeFile: "lib/runes/ncbdb-engrave-rune.ts",
    pillars: ["通"],
    entropyTarget: 0.04,
    kpi: "API 成功率 > 99.5% + 延遲 < 200ms"
  },
  {
    id: "R7",
    name: "任務分派代理",
    nameEn: "The Dispatcher",
    role: "Intelligent Routing & Workload Distribution",
    description: "根據「萬有引力協議」進行路由，依智能標籤自動分發任務至最適合的代理人或模組。",
    mandate: "根據任務複雜度與代理負載動態分配工作，確保每個任務在最短路徑內抵達最合適的執行者。",
    cluster: "Orchestration",
    arcane: "代理織網",
    runeFile: "lib/agents/navigation-swarm.ts",
    pillars: ["通"],
    entropyTarget: 0.04,
    kpi: "路由正確率 > 99% + 負載平衡度 < 20% 方差"
  },
  {
    id: "R8",
    name: "遠端通訊官",
    nameEn: "The Telepath",
    role: "OmniAntigravity Remote Comms & Encryption",
    description: "維護 OmniAntigravityRemoteChat 的即時通訊穩定性與加密通道，實現 <300ms 量子糾纏傳輸。",
    mandate: "所有跨節點通訊必須通過 AES-256 加密通道，延遲 < 300ms，且具備自動斷線重連與消息補發機制。",
    cluster: "Orchestration",
    arcane: "神蹟顯現",
    runeFile: "lib/runes/telepath-rune.ts",
    pillars: ["通", "信"],
    entropyTarget: 0.02,
    kpi: "通訊延遲 < 300ms + 加密覆蓋率 100%"
  },

  // ─────────────── 第四集群：進化引擎 ───────────────
  {
    id: "R9",
    name: "熵減煉金術師",
    nameEn: "The Alchemist",
    role: "Technical Debt Elimination & Code Entropy Control",
    description: "每週固定執行 10% 技術債獻祭，自動識別代碼熵值，優化冗餘邏輯，持續降低系統熵值。",
    mandate: "每週掃描代碼庫熵值，自動標記熵值 > 0.7 的組件進行重構，保持每月系統熵值降低 3%。",
    cluster: "Evolution",
    arcane: "熵減煉金",
    runeFile: "lib/runes/alchemist-rune.ts",
    pillars: ["善"],
    entropyTarget: 0.07,
    kpi: "技術債週減率 10% + 代碼重複率 < 5%"
  },
  {
    id: "R10",
    name: "靈魂刻印者",
    nameEn: "The Engraver",
    role: "Knowledge Crystallization & Eternal Memory",
    description: "將所有執行日誌與知識沉澱至「萬能智庫」，負責 Hash Lock 寫入，確保知識永續不可篡改。",
    mandate: "每個代理的執行成果必須被結構化記錄並寫入萬能智庫，形成自我增強的知識閉環，確保零知識損耗。",
    cluster: "Evolution",
    arcane: "永恆刻印",
    runeFile: "lib/runes/engraver-rune.ts",
    pillars: ["信"],
    entropyTarget: 0.01,
    kpi: "知識覆蓋率 100% + 記憶損耗率 0%"
  }
];


/** 按集群分組 */
export const APOSTLE_CLUSTERS: Record<ApostleCluster, { color: string; label: string; desc: string }> = {
  Architectural: { color: "#3B82F6", label: "架構聖殿", desc: "核心守護 · 不可篡改" },
  Execution:     { color: "#F59E0B", label: "真善美執行組", desc: "數據與 UI · 全域感知" },
  Orchestration: { color: "#8B5CF6", label: "代理織網", desc: "開發與自動化 · 萬能路由" },
  Evolution:     { color: "#10B981", label: "進化引擎", desc: "熵減與成長 · 永恆刻印" },
};

/** 奧義六式描述 */
export const ARCANE_ARTS: Record<ArcaneArt, { art: number; color: string; desc: string }> = {
  "本質提純": { art: 1, color: "#3B82F6", desc: "量子本質提取，注入唯一性" },
  "聖典共鳴": { art: 2, color: "#F59E0B", desc: "鏈式溯源，聖典不可動搖" },
  "代理織網": { art: 3, color: "#8B5CF6", desc: "智能路由，跨域協作" },
  "神蹟顯現": { art: 4, color: "#EC4899", desc: "抽象數據具象化為神蹟" },
  "熵減煉金": { art: 5, color: "#10B981", desc: "消除幻覺，降低系統熵值" },
  "永恆刻印": { art: 6, color: "#6366F1", desc: "知識晶化，零遺忘刻印" },
};
