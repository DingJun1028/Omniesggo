/**
 * OA-Team 30 萬能蜂群矩陣 (30 Souls Matrix)
 * 來源: OA-Team 靈魂核心聖典 §二
 * 5 大陣列 (每陣列 6 員) — MECE 互斥窮盡
 */

export interface SoulAgent {
  id: number;
  title: string;
  tags: string[];
  array: 'strategy' | 'tech' | 'creative' | 'marketing' | 'guard';
  task: string;
}

export const SOUL_MATRIX: SoulAgent[] = [
  // 策略組 (1-6)
  { id: 1, title: '萬能蜂后', tags: ['#萬能領導', '#戰略總覽'], array: 'strategy', task: '整體戰略規劃、資源分配、跨組協調與決策鏈控制。' },
  { id: 2, title: '萬能規劃蜂', tags: ['#長遠規劃', '#SWOT分析'], array: 'strategy', task: '制定 3-5 年戰略藍圖，SWOT 分析。' },
  { id: 3, title: '萬能分析蜂', tags: ['#數據挖掘', '#趨勢預測'], array: 'strategy', task: '數據驅動決策，建立可追蹤數據流水線。' },
  { id: 4, title: '萬能策効蜂', tags: ['#創意思維', '#解難方案'], array: 'strategy', task: '設計創新解決方案，具備可感知實現路徑。' },
  { id: 5, title: '萬能風險蜂', tags: ['#風險控制', '#應急預案'], array: 'strategy', task: '評估管控專案風險，建立可信賴監控系統。' },
  { id: 6, title: '萬能優化蜂', tags: ['#效率提升', '#流程重組'], array: 'strategy', task: '持續優化流程，降低熵值至 < 0.1。' },
  // 技術組 (7-12)
  { id: 7, title: '萬能編碼蜂', tags: ['#全端開發', '#API設計'], array: 'tech', task: '實現可溯源代碼產出，建立代碼溯源鏈。' },
  { id: 8, title: '萬能算法蜂', tags: ['#機器學習', '#深度學習'], array: 'tech', task: '構建 AI 模型管線，訓練可追蹤驗證。' },
  { id: 9, title: '萬能架構蜂', tags: ['#雲端架構', '#分布式'], array: 'tech', task: '設計可擴展系統架構，實現追蹤監控。' },
  { id: 10, title: '萬能數據蜂', tags: ['#資料庫', '#數據管道'], array: 'tech', task: '建立高可靠數據管道，確保溯源與證明。' },
  { id: 11, title: '萬能測試蜂', tags: ['#自動化測試', '#效能測試'], array: 'tech', task: '實施全面測試策略，產出可驗證報告。' },
  { id: 12, title: '萬能設計蜂', tags: ['#UI/UX', '#用戶體驗'], array: 'tech', task: '設計可感知用戶介面，符合 5T 透明原則。' },
  // 創意組 (13-18)
  { id: 13, title: '萬能圖像蜂', tags: ['#平面設計', '#品牌視覺'], array: 'creative', task: '創作品牌視覺資產，確保可溯源。' },
  { id: 14, title: '萬能動畫蜂', tags: ['#動畫特效', '#視頻製作'], array: 'creative', task: '製作動態內容，建立動畫資產管理。' },
  { id: 15, title: '萬能文案蜂', tags: ['#文案撰寫', '#故事設計'], array: 'creative', task: '產出具備透明來源內容，可追蹤。' },
  { id: 16, title: '萬能音頻蜂', tags: ['#音樂製作', '#音頻編輯'], array: 'creative', task: '創作音頻資產，建立可溯源管理。' },
  { id: 17, title: '萬能市場蜂', tags: ['#市場分析', '#推廣策略'], array: 'creative', task: '執行市場推廣，產出可追蹤 ROI 報告。' },
  { id: 18, title: '萬能社群蜂', tags: ['#用戶管理', '#社群建設'], array: 'creative', task: '經營社群生態，確保互動可追蹤。' },
  // 營銷組 (19-24)
  { id: 19, title: '萬能增長蜂', tags: ['#用戶增長', '#業務拓展'], array: 'marketing', task: '推動業務增長，建立可驗證增長指標。' },
  { id: 20, title: '萬能運營蜂', tags: ['#進度管理', '#資源調度'], array: 'marketing', task: '協調資源與進度，確保運營可追蹤。' },
  { id: 21, title: '萬能商業分析蜂', tags: ['#商業洞察', '#決策支持'], array: 'marketing', task: '提供商業決策支持，產出可驗證報告。' },
  { id: 22, title: '萬能探路蜂', tags: ['#資源探索', '#機會發掘'], array: 'marketing', task: '發掘新機會，建立可溯源探索報告。' },
  { id: 23, title: '萬能外交蜂', tags: ['#合作關係', '#談判協商'], array: 'marketing', task: '建立合作關係，確保協議可追蹤。' },
  { id: 24, title: '萬能調研蜂', tags: ['#用戶研究', '#需求分析'], array: 'marketing', task: '進行用戶調研，產出可驗證調研報告。' },
  // 守衛組 (25-30)
  { id: 25, title: '萬能測場蜂', tags: ['#現場測評', '#回饋收集'], array: 'guard', task: '收集現場回饋，建立可追蹤測評數據。' },
  { id: 26, title: '萬能追蹤蜂', tags: ['#競品監控', '#動態追踪'], array: 'guard', task: '監控競品動態，確保監控數據可溯源。' },
  { id: 27, title: '萬能安全蜂', tags: ['#資安防護', '#數據保護'], array: 'guard', task: '保障系統安全，建立可信賴安全監控。' },
  { id: 28, title: '萬能維護蜂', tags: ['#系統維護', '#故障排除'], array: 'guard', task: '維護系統運行，確保維護記錄可追蹤。' },
  { id: 29, title: '萬能支援蜂', tags: ['#技術支援', '#問題解決'], array: 'guard', task: '提供技術支援，建立可溯源支援記錄。' },
  { id: 30, title: '萬能質控蜂', tags: ['#品質保障', '#標準制定'], array: 'guard', task: '管控產品品質，確保品質標準可追蹤。' },
];

export function getAgent(id: number): SoulAgent | undefined {
  return SOUL_MATRIX.find((a) => a.id === id);
}

export const ARRAY_NAMES: Record<SoulAgent['array'], string> = {
  strategy: '策略組',
  tech: '技術組',
  creative: '創意組',
  marketing: '營銷組',
  guard: '守衛組',
};
