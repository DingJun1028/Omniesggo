// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:結界]
/**
 * OmniBiz — 萬能商情 (Business / Competitive Intelligence)
 *
 * 萬能架構 Layer 3（智慧層）。
 * 職責：商情分析、競爭情報、業界數據整合。
 * 5T：
 *  - Traceable：每筆訊號帶 source_origin 來源
 *  - Trackable：事件發布到 OmniAgentBus
 *  - Tangible：外面丟的可跑輸出（趨勢、排名、洞察）
 *  - Transparent：演算法公开（trend / gravity）
 *  - Trustworthy：寫入後 Object.freeze + Hash Lock
 */

export type Category =
  | 'market'
  | 'policy'
  | 'supply_chain'
  | 'risk_event'
  | 'technology'
  | 'investment';

export interface MarketSignal {
  id: string;
  category: Category;
  title: string;
  sourceName: string;
  confidence: number; // 0..1
  relevance: string[];
  detectedAt: string; // ISO
}

export interface CompetitorSnapshot {
  companyName: string;
  esgScore?: number; // 0..100
  carbonIntensity?: number; // tCO2e per revenue unit
  disclosedTopics: string[];
  momentum: 'rising' | 'stable' | 'declining';
}

export interface IndustryDataPoint {
  sector: string;
  tag: string;
  value: number;
  unit: string;
  asOf: string;
}

export interface TrendSeries {
  label: string;
  points: { date: string; value: number }[];
}

export interface OmniBizInsight {
  id: string;
  kind: 'signal' | 'gap' | 'benchmarking' | 'momentum';
  payload: Record<string, unknown>;
  evidenceHash: string; // sha256 of serialized payload
  sealedAt: string;
}
