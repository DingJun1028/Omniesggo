// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:結界]
/**
 * OmniBiz — 萬能商情入口
 *
 * Layer 3 智慧層。商情分析、競爭情報、業界數據整合。
 */

export type {
  Category,
  MarketSignal,
  CompetitorSnapshot,
  IndustryDataPoint,
  TrendSeries,
  OmniBizInsight,
} from './types';
export {
  hashLock,
  sealInsight,
  trendDirection,
  gravityTwo,
  OmniBizEngine,
  omniBiz,
} from './engine';
