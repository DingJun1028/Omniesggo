export interface IOmniTask {
  id: string;
  query: string;
  context?: Record<string, any>;
  timestamp: number;
}
export interface IRouteResult {
  category: "Knowledge" | "Action" | "Calculation" | "Unknown";
  confidence: number;
}
export interface IMemoryRecord {
  id: string;
  taskId: string;
  query: string;
  result: any;
  timestamp: number;
  tags: string[];
}
export interface OneIAwakeningResult {
  status: "success" | "partial" | "failed";
  data: any;
  plan: string[];
}

// [ts-matrix] 對外相容別名：保留原匯出名稱，既有呼叫端不受影響。
export type { OneIAwakeningResult as IAwakeningResult };