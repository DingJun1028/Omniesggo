// Omniesggo — 萬能永續平台
// Local seed data for the MVP. In production these come from Supabase.

export const pillars = [
  {
    id: 'carbon',
    key: '碳',
    name: '碳盤查',
    en: 'Carbon Accounting',
    color: 'moss',
    desc: '溫室氣體盤查、減量路徑與碳權管理',
    metrics: [
      { label: '範疇一排放', value: '1,284', unit: 'tCO₂e' },
      { label: '範疇二排放', value: '3,902', unit: 'tCO₂e' },
      { label: '範疇三排放', value: '18,540', unit: 'tCO₂e' },
    ],
    trend: -12.4,
  },
  {
    id: 'esg',
    key: '永',
    name: '永續報告',
    en: 'ESG Reporting',
    color: 'sky',
    desc: 'GRI / SASB / TCFD 框架揭露與合規',
    metrics: [
      { label: '揭露指標', value: '142', unit: '項' },
      { label: '合規度', value: '96', unit: '%' },
      { label: '利害關係人', value: '38', unit: '群' },
    ],
    trend: 8.1,
  },
  {
    id: 'supply',
    key: '鏈',
    name: '供應鏈',
    en: 'Supply Chain',
    color: 'clay',
    desc: '供應商永續評鑑與風險追蹤',
    metrics: [
      { label: '供應商', value: '214', unit: '家' },
      { label: '評鑑覆蓋', value: '87', unit: '%' },
      { label: '高風險', value: '9', unit: '家' },
    ],
    trend: -3.2,
  },
  {
    id: 'knowledge',
    key: '知',
    name: '知識庫',
    en: 'Knowledge Base',
    color: 'leaf',
    desc: '永續知識沉澱、標籤追蹤與智慧檢索',
    metrics: [
      { label: '文件', value: '1,208', unit: '篇' },
      { label: '標籤', value: '3,456', unit: '個' },
      { label: '檢索命中', value: '94', unit: '%' },
    ],
    trend: 21.7,
  },
]

export const activities = [
  { id: 1, type: 'carbon', text: '範疇三供應商排放資料已更新', time: '2 分鐘前', actor: '系統自動' },
  { id: 2, type: 'esg', text: 'GRI 302 能源揭露指標完成驗證', time: '18 分鐘前', actor: '林專員' },
  { id: 3, type: 'knowledge', text: '新增標籤「再生能源憑證」並關聯 12 篇文件', time: '1 小時前', actor: 'AI 標籤引擎' },
  { id: 4, type: 'supply', text: '供應商 A-042 風險等級由中調升為高', time: '3 小時前', actor: '風險模型' },
  { id: 5, type: 'carbon', text: '2024 年度盤查報告草稿已產生', time: '昨天', actor: '報告產生器' },
  { id: 6, type: 'esg', text: '利害關係人議合問卷回收率達 82%', time: '昨天', actor: '林專員' },
]

export const tasks = [
  { id: 1, title: '完成範疇二排放數據驗證', pillar: 'carbon', due: '今天', status: '進行中' },
  { id: 2, title: '更新供應商永續評鑑表單', pillar: 'supply', due: '明天', status: '待辦' },
  { id: 3, title: '撰寫 TCFD 情境分析章節', pillar: 'esg', due: '本週', status: '待辦' },
  { id: 4, title: '審核 AI 標籤建議清單', pillar: 'knowledge', due: '本週', status: '進行中' },
]

export const tags = [
  { id: 1, name: '再生能源', count: 342, weight: 0.92 },
  { id: 2, name: '碳權', count: 218, weight: 0.88 },
  { id: 3, name: '供應鏈', count: 196, weight: 0.84 },
  { id: 4, name: 'TCFD', count: 154, weight: 0.81 },
  { id: 5, name: '淨零', count: 141, weight: 0.79 },
  { id: 6, name: '水資源', count: 122, weight: 0.74 },
  { id: 7, name: '生物多樣性', count: 98, weight: 0.68 },
  { id: 8, name: '循環經濟', count: 87, weight: 0.65 },
]

export const documents = [
  { id: 1, title: '2024 永續報告書（草稿）', tags: ['永續報告', 'GRI'], updated: '昨天', size: '4.2 MB' },
  { id: 2, title: '範疇三排放清冊', tags: ['碳盤查', '供應鏈'], updated: '3 天前', size: '1.8 MB' },
  { id: 3, title: '再生能源採購策略', tags: ['再生能源', '策略'], updated: '1 週前', size: '860 KB' },
  { id: 4, title: '供應商風險矩陣', tags: ['供應鏈', '風險'], updated: '2 週前', size: '2.1 MB' },
  { id: 5, title: 'TCFD 情境分析', tags: ['TCFD', '氣候'], updated: '3 週前', size: '3.4 MB' },
]

export const pillarMeta = {
  carbon: { label: '碳盤查', color: 'moss' },
  esg: { label: '永續報告', color: 'sky' },
  supply: { label: '供應鏈', color: 'clay' },
  knowledge: { label: '知識庫', color: 'leaf' },
}
