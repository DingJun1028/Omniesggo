export type ApostleCluster = "Architectural" | "Execution" | "Orchestration" | "Evolution";
export type ArcaneArt = "本質提純" | "聖典共鳴" | "代理織網" | "神蹟顯現" | "熵減煉金" | "永恆刻印";
export type ApostleStatus = "ONLINE" | "STANDBY" | "COMPUTING" | "SEALED";

export interface ApostleMetadata {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  description: string;
  mandate: string;          // MECE 責任聲明
  cluster: ApostleCluster;
  arcane: ArcaneArt;        // 奧義六式分配
  runeFile: string;         // 對應符文路徑
  pillars: ("真" | "善" | "美" | "信" | "通")[];  // 五T支柱
  entropyTarget: number;
  kpi?: string;             // KPI 指標
  agent?: any;              // ADK Agent 實體
}
