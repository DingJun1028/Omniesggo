/**
 * OA 蜂群映射 — 對齊 soul.md 30 Souls Matrix
 * 30 萬能代理經 OmniAgentBus 廣播, 映射到 10 子框架 + 5 大陣列
 *
 * 陣列 (5): 策略(1-6) 技術(7-12) 創意(13-18) 營銷(19-24) 守衛(25-30)
 * 廣通: 每蜂群節點 subscribe `oa.swarm.<id>` 主題, 總線自動路由
 */
import type { SubFrameId } from './types.js';

export type SwarmArray = 'strategy' | 'tech' | 'creative' | 'marketing' | 'guard';

/** 30 蜂群 → { 陣列, 綁定子框架, 職責 }; 空 binds 保留節點但不路由到已移除的框架 */
export interface SwarmNode {
  id: number;
  name: string;
  array: SwarmArray;
  binds: SubFrameId[];
  role: string;
}

export const SWARM_NODES: SwarmNode[] = [
  // --- 策略陣列 (1-6) ---
  { id: 1, name: '萬能蜂后', array: 'strategy', binds: ['agent0'], role: '戰略總覽' },
  { id: 2, name: '萬能規劃蜂', array: 'strategy', binds: ['adk'], role: '長遠規劃' },
  { id: 3, name: '萬能分析蜂', array: 'strategy', binds: [], role: '數據挖掘' },
  { id: 4, name: '萬能策効蜂', array: 'strategy', binds: ['crewai'], role: '創意思維' },
  { id: 5, name: '萬能風險蜂', array: 'strategy', binds: ['omniroute'], role: '風險控制' },
  { id: 6, name: '萬能優化蜂', array: 'strategy', binds: ['agent0'], role: '效率提升' },
  // --- 技術陣列 (7-12) ---
  { id: 7, name: '萬能編碼蜂', array: 'tech', binds: ['deerflow'], role: '全端開發' },
  { id: 8, name: '萬能算法蜂', array: 'tech', binds: ['adk'], role: '機器學習' },
  { id: 9, name: '萬能架構蜂', array: 'tech', binds: ['agentreach'], role: '雲端架構' },
  { id: 10, name: '萬能數據蜂', array: 'tech', binds: ['turbovec'], role: '資料管道' },
  { id: 11, name: '萬能測試蜂', array: 'tech', binds: [], role: '自動化測試' },
  { id: 12, name: '萬能設計蜂', array: 'tech', binds: ['openmontage'], role: 'UI/UX' },
  // --- 創意陣列 (13-18) ---
  { id: 13, name: '萬能圖像蜂', array: 'creative', binds: ['openmontage'], role: '品牌視覺' },
  { id: 14, name: '萬能動畫蜂', array: 'creative', binds: ['openmontage'], role: '動畫特效' },
  { id: 15, name: '萬能文案蜂', array: 'creative', binds: ['crewai'], role: '文案撰寫' },
  { id: 16, name: '萬能音頻蜂', array: 'creative', binds: ['deerflow'], role: '音樂製作' },
  { id: 17, name: '萬能市場蜂', array: 'creative', binds: ['omniroute'], role: '市場分析' },
  { id: 18, name: '萬能社群蜂', array: 'creative', binds: ['agentreach'], role: '社群建設' },
  // --- 營銷陣列 (19-24) ---
  { id: 19, name: '萬能增長蜂', array: 'marketing', binds: ['turbovec'], role: '用戶增長' },
  { id: 20, name: '萬能運營蜂', array: 'marketing', binds: ['agent0'], role: '進度管理' },
  { id: 21, name: '萬能商業分析蜂', array: 'marketing', binds: [], role: '商業洞察' },
  { id: 22, name: '萬能探路蜂', array: 'marketing', binds: ['agentreach'], role: '資源探索' },
  { id: 23, name: '萬能外交蜂', array: 'marketing', binds: ['omniroute'], role: '合作關係' },
  { id: 24, name: '萬能調研蜂', array: 'marketing', binds: ['turbovec'], role: '用戶研究' },
  // --- 守衛陣列 (25-30) ---
  { id: 25, name: '萬能測場蜂', array: 'guard', binds: ['deerflow'], role: '現場測評' },
  { id: 26, name: '萬能追蹤蜂', array: 'guard', binds: ['tencent-mem'], role: '競品監控' },
  { id: 27, name: '萬能安全蜂', array: 'guard', binds: ['tencent-mem'], role: '資安防護' },
  { id: 28, name: '萬能維護蜂', array: 'guard', binds: ['deerflow'], role: '系統維護' },
  { id: 29, name: '萬能支援蜂', array: 'guard', binds: ['agentreach'], role: '技術支援' },
  { id: 30, name: '萬能質控蜂', array: 'guard', binds: ['tencent-mem'], role: '品質保障' },
];

/** 取得蜂群節點的總線主題 (廣通通道) */
export function swarmTopic(id: number): string {
  return `oa.swarm.${id}`;
}

/** 依陣列取得所有節點 (陣列級廣播) */
export function nodesByArray(array: SwarmArray): SwarmNode[] {
  return SWARM_NODES.filter((n) => n.array === array);
}
