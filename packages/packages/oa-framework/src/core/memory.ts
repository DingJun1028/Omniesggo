/**
 * TencentDB Agent Memory — Team Memory 資產型別
 * 對齊官方 README: Chat Memory(L0-L3) / Skill / Wiki / CodeGraph + 團隊/Agent Loadout
 */
export type MemoryLayer = 'L0' | 'L1' | 'L2' | 'L3';

export type MemoryAssetKind =
  | 'chat_memory' // L0 原始對話 → L1 事實 → L2 場景 → L3 人格
  | 'skill'       // 可複用技能 (版本/觸發邊界/執行步驟/驗證規則)
  | 'wiki'        // 文件 → 結構化頁面 + 連結圖
  | 'codegraph';  // 代碼符號/檔案/呼叫關係/影響路徑

export type MemoryVisibility = 'private' | 'team' | 'restricted' | 'agent';

/** 一筆記憶資產 (跨框架可攜, 多 Agent 共享) */
export interface MemoryAsset {
  kind: MemoryAssetKind;
  id?: string;
  title: string;
  content: string;
  layer?: MemoryLayer;
  visibility: MemoryVisibility;
  ownerAgent?: string;  // 資產歸屬 Agent
  team?: string;        // 所屬團隊 (如 OA-Team)
  version?: string;
  trigger?: string;     // Skill 觸發邊界
}

/** Team Memory 部署端點 (global-images 一鍵部署) */
export interface TeamMemoryConfig {
  coreUrl: string; // MemoryCore gateway — Knowledge OpenAPI (/v3/tools/*) 預設 :8420
  hubUrl: string;  // Memory Hub panel — 資產管理/團隊/Loadout 預設 :8125
  proxyUrl?: string; // Proxy 預設 :8096
  apiKey?: string;   // Bearer auth (server.apiKey / TDAI_GATEWAY_API_KEY)
  serviceId?: string; // x-tdai-service-id header (區分蜂群/服務來源)
}
