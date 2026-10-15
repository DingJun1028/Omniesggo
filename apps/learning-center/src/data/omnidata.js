// ============================================================
// src/data/omnidata.js — User RAG 知識庫（OmniData）
// ============================================================
// 用途：
//   以雲端知識庫索引（Supabase），前端可依使用者/角色檢索相關條目。
//   若未連線雲端，則退回本機靜態種子資料，保證可用。

/** @typedef {{ id: string, title: string, body: string, tags: string[], roles: string[], updatedAt: string }} OmniEntry */

const seedEntries = [
  {
    id: 'student_onboarding',
    title: '學員入門指引',
    body: '學員請先完成課程影片觀看，並於每週按時填寫滿意度調查。提問請聚焦「可推進的下一步」與 90 天行動方案。',
    tags: ['student', 'onboarding', 'syllabus'],
    roles: ['student'],
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'mentor_rubric',
    title: 'Mentor 診斷回饋要點',
    body: '回饋請依循：背景限制 -> 90 天優先工作 -> 決策問題 -> 證據與治理 -> 下一步行動。避免直接提供答案，先協助聚焦問題。',
    tags: ['TA', 'rubric', 'feedback'],
    roles: ['TA', 'admin'],
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'admin_ops',
    title: '管理員營運清單',
    body: '管理員每週確認：影片與教材上架狀態、助教配對進度、問卷填寫率、近七日出版紀錄、高優先提問標註。',
    tags: ['admin', 'ops', 'checklist'],
    roles: ['admin'],
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'pairing_basics',
    title: '助教配對原則',
    body: '配對時請參考產業、組織規模與學習目標；student 可查看已接受的配對，mentor 可查看待確認/已接受的 mentee 清單。',
    tags: ['pairing', 'TA', 'student'],
    roles: ['student', 'TA', 'admin'],
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'rag_note',
    title: '知識庫檢索提示',
    body: '請用關鍵字查詢 ESG、治理、資料、90天、impact、responsible ai、portfolio、supply chain 等詞彙，系統會依角色過濾結果。',
    tags: ['rag', 'omnidata', 'search'],
    roles: ['student', 'TA', 'admin'],
    updatedAt: '2026-06-01T00:00:00.000Z',
  },
  {
    id: 'esg_framework',
    title: 'ESG 報告框架簡介',
    body: '主要框架包括 GRI、SASB、TCFD、EU CSRD。建議先从 GRI 核心選項開始，再依產業叠加 SASB 標準。',
    tags: ['ESG', 'framework', 'GRI', 'SASB', 'reporting'],
    roles: ['student', 'TA', 'admin'],
    updatedAt: '2026-06-05T00:00:00.000Z',
  },
  {
    id: 'sustainability_metrics',
    title: '常見 Sustainability 指標',
    body: '碳排放範疇一/二/三、用水量、廢棄物回收率、能源強度、供應鏈碳足跡。这些指標用於設定基線與追蹤進展。',
    tags: ['metrics', 'carbon', 'water', 'waste', 'energy'],
    roles: ['student', 'TA', 'admin'],
    updatedAt: '2026-06-10T00:00:00.000Z',
  },
  {
    id: 'stakeholder_engagement',
    title: 'Stakeholder 溝通策略',
    body: '高階主管關注風險與報酬；投資人要看碳揭露；社區關注重生態與就業；員工關注多元包容。建議建立利益關係人矩陣。',
    tags: ['stakeholder', 'communication', 'engagement'],
    roles: ['TA', 'admin'],
    updatedAt: '2026-06-15T00:00:00.000Z',
  },
  {
    id: 'supply_chain_esg',
    title: '供應鏈 ESG 盡職調查',
    body: '從供應商篩選、合約條款、稽核頻率到偏離處置，建議建立季度供應商 ESG 評分機制，並納入新版 RFP 要求。',
    tags: ['supply chain', 'due diligence', 'vendor', 'procurement'],
    roles: ['TA', 'admin'],
    updatedAt: '2026-06-20T00:00:00.000Z',
  },
  {
    id: 'materiality_assessment',
    title: '實質性評估（Materiality Assessment）步驟',
    body: '1) 列出议题 2) 利害關係人訪談 3) 影響程度與發生機率矩陣 4) 確立首要 ESG 議題 5) 每两年再评估一次。',
    tags: ['materiality', 'assessment', 'strategy'],
    roles: ['student', 'TA', 'admin'],
    updatedAt: '2026-06-25T00:00:00.000Z',
  },
];

const localKey = 'berkeley_omnidata';

/** Load all entries from localStorage fallback. @returns {OmniEntry[]} */
export const loadLocalOmnidata = () => {
  try {
    return JSON.parse(localStorage.getItem(localKey) || '[]');
  } catch {
    return seedEntries.slice();
  }
};

/** Persist entries into localStorage fallback. @param {OmniEntry[]} entries */
export const saveLocalOmnidata = (entries) => {
  try {
    localStorage.setItem(localKey, JSON.stringify(entries));
  } catch {
    // no-op
  }
};

export { seedEntries };
