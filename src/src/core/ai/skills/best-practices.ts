// ═══════════════════════════════════════════════════════════════
// ESGGO MECE Best Practices Framework
// 互斥且完備的 ESG 最佳實踐矩陣
// ═══════════════════════════════════════════════════════════════

/**
 * MECE 原則（Mutually Exclusive, Collectively Exhaustive）
 * - 互斥：每個最佳實踐只屬於一個類別，無重疊
 * - 完備：所有 ESG 最佳實踐都被涵蓋，無遺漏
 */

// ── 類型定義 ─────────────────────────────────────────────────

export type ESGPillar = 'E' | 'S' | 'G';
export type PracticeLevel = 'not_started' | 'basic' | 'intermediate' | 'advanced';
export type PracticeStatus = 'not_started' | 'in_progress' | 'achieved';

export interface BestPractice {
  id: string;
  pillar: ESGPillar;
  category: string;
  subcategory: string;
  name: string;
  nameEn: string;
  description: string;
  level: PracticeLevel;
  kpis: string[];
  references: string[];
}

export interface PracticeAssessment {
  practiceId: string;
  status: PracticeLevel;
  score: number; // 0-100
  evidence: string[];
  gaps: string[];
  recommendations: string[];
}

// ── E: Environmental 最佳實踐 ────────────────────────────────

const ENVIRONMENTAL_PRACTICES: BestPractice[] = [
  // E1: 氣候變遷
  {
    id: 'E1.1',
    pillar: 'E',
    category: '氣候變遷',
    subcategory: '碳排管理',
    name: '建立碳盤查體系',
    nameEn: 'Establish Carbon Accounting System',
    description: '依 ISO 14064 進行組織層級碳盤查，涵蓋範疇 1/2/3',
    level: 'basic',
    kpis: ['碳排放量 (tCO2e)', '碳排強度 (tCO2e/營收)', '範疇 3 覆蓋率'],
    references: ['ISO 14064-1:2018', 'GHG Protocol'],
  },
  {
    id: 'E1.2',
    pillar: 'E',
    category: '氣候變遷',
    subcategory: '減碳目標',
    name: '設定科學基礎減碳目標',
    nameEn: 'Set Science-Based Targets',
    description: '依 SBTi 標準設定 1.5°C 路徑減碳目標',
    level: 'intermediate',
    kpis: ['減碳目標年份', '基準年排放量', '年度減碳率'],
    references: ['SBTi', 'Paris Agreement'],
  },
  {
    id: 'E1.3',
    pillar: 'E',
    category: '氣候變遷',
    subcategory: '淨零轉型',
    name: '制定淨零排放路徑',
    nameEn: 'Develop Net-Zero Roadmap',
    description: '制定 2050 淨零排放策略，包含短中長期行動方案',
    level: 'advanced',
    kpis: ['淨零目標年', '資本支出佔比', '再生能源佔比'],
    references: ['Net-Zero Standard', 'TCFD'],
  },

  // E2: 資源管理
  {
    id: 'E2.1',
    pillar: 'E',
    category: '資源管理',
    subcategory: '能源管理',
    name: '實施能源管理系統',
    nameEn: 'Implement Energy Management System',
    description: '依 ISO 50001 建立能源管理系統，提升能源效率',
    level: 'basic',
    kpis: ['能源消耗量 (MWh)', '能源強度 (MWh/營收)', '節能率'],
    references: ['ISO 50001:2018'],
  },
  {
    id: 'E2.2',
    pillar: 'E',
    category: '資源管理',
    subcategory: '水資源管理',
    name: '建立水資源管理機制',
    nameEn: 'Establish Water Resource Management',
    description: '監測水資源使用，設定節水目標',
    level: 'basic',
    kpis: ['用水量 (m³)', '水資源強度', '回收水比例'],
    references: ['CEO Water Mandate'],
  },
  {
    id: 'E2.3',
    pillar: 'E',
    category: '資源管理',
    subcategory: '廢棄物管理',
    name: '推動循環經濟模式',
    nameEn: 'Promote Circular Economy',
    description: '減少廢棄物產生，提升資源回收再利用',
    level: 'intermediate',
    kpis: ['廢棄物產生量 (噸)', '回收率', '零廢棄物目標進度'],
    references: ['Circular Economy Principles'],
  },

  // E3: 污染防治
  {
    id: 'E3.1',
    pillar: 'E',
    category: '污染防治',
    subcategory: '空氣品質',
    name: '監測並改善空氣品質',
    nameEn: 'Monitor and Improve Air Quality',
    description: '監測空氣污染物排放，確保符合法規標準',
    level: 'basic',
    kpis: ['空氣污染物排放量', '法規符合率', '改善措施執行率'],
    references: ['空氣污染防制法'],
  },
  {
    id: 'E3.2',
    pillar: 'E',
    category: '污染防治',
    subcategory: '水污染防制',
    name: '建立水污染防制機制',
    nameEn: 'Establish Water Pollution Prevention',
    description: '監測廢水排放，確保水質符合標準',
    level: 'basic',
    kpis: ['廢水排放量', '水質監測合格率', '改善措施完成率'],
    references: ['水污染防制法'],
  },

  // E4: 生態多樣性
  {
    id: 'E4.1',
    pillar: 'E',
    category: '生態多樣性',
    subcategory: '生物多樣性保育',
    name: '評估並管理生物多樣性影響',
    nameEn: 'Assess and Manage Biodiversity Impact',
    description: '評估營運對生物多樣性的影響，制定保育計畫',
    level: 'intermediate',
    kpis: ['影響評估覆蓋率', '保育措施執行率', '生態恢復指標'],
    references: ['TNFD', 'CBD'],
  },
];

// ── S: Social 最佳實踐 ──────────────────────────────────────

const SOCIAL_PRACTICES: BestPractice[] = [
  // S1: 員工權益
  {
    id: 'S1.1',
    pillar: 'S',
    category: '員工權益',
    subcategory: '勞動條件',
    name: '確保公平勞動條件',
    nameEn: 'Ensure Fair Labor Conditions',
    description: '遵守勞動法規，提供合理薪酬與工作環境',
    level: 'basic',
    kpis: ['員工流動率', '加班時數', '薪酬公平比'],
    references: ['ILO Conventions', '勞動基準法'],
  },
  {
    id: 'S1.2',
    pillar: 'S',
    category: '員工權益',
    subcategory: '職業安全',
    name: '建立職業安全衛生管理系統',
    nameEn: 'Establish Occupational Safety Management',
    description: '依 ISO 45001 建立職安衛管理系統',
    level: 'basic',
    kpis: ['職災發生率', '失能傷害頻率', '安全訓練時數'],
    references: ['ISO 45001:2018', '職業安全衛生法'],
  },
  {
    id: 'S1.3',
    pillar: 'S',
    category: '員工權益',
    subcategory: '員工發展',
    name: '建構員工發展體系',
    nameEn: 'Develop Employee Growth System',
    description: '提供培訓發展機會，建立人才培育機制',
    level: 'intermediate',
    kpis: ['人均培訓時數', '內部晉升率', '員工滿意度'],
    references: ['人才發展標竿'],
  },

  // S2: 多元共融
  {
    id: 'S2.1',
    pillar: 'S',
    category: '多元共融',
    subcategory: '性別平等',
    name: '推動性別平等政策',
    nameEn: 'Promote Gender Equality Policy',
    description: '確保同工同酬，提升女性主管比例',
    level: 'basic',
    kpis: ['男女薪酬比', '女性主管佔比', '性騷擾案件數'],
    references: ['性別平等工作法'],
  },
  {
    id: 'S2.2',
    pillar: 'S',
    category: '多元共融',
    subcategory: '多元共融',
    name: '建立多元共融職場',
    nameEn: 'Build Inclusive Workplace',
    description: '尊重多元背景，營造包容性工作環境',
    level: 'intermediate',
    kpis: ['多元指標', '員工資源小組數', '包容性調查分數'],
    references: ['DEI Best Practices'],
  },

  // S3: 供應鏈管理
  {
    id: 'S3.1',
    pillar: 'S',
    category: '供應鏈管理',
    subcategory: '供應商管理',
    name: '建立供應商行為準則',
    nameEn: 'Establish Supplier Code of Conduct',
    description: '要求供應商遵守 ESG 標準，定期稽覈',
    level: 'basic',
    kpis: ['供應商覆蓋率', '稽覈頻率', '違規案件數'],
    references: ['SA8000', 'Supplier Code of Conduct'],
  },
  {
    id: 'S3.2',
    pillar: 'S',
    category: '供應鏈管理',
    subcategory: '盡職調查',
    name: '實施供應鏈盡職調查',
    nameEn: 'Implement Supply Chain Due Diligence',
    description: '識別供應鏈 ESG 風險，採取預防與補救措施',
    level: 'advanced',
    kpis: ['高風險供應商比例', '改善計畫完成率', '第三方認證率'],
    references: ['UN Guiding Principles', 'EU CSDDD'],
  },

  // S4: 社區參與
  {
    id: 'S4.1',
    pillar: 'S',
    category: '社區參與',
    subcategory: '公益投入',
    name: '推動企業社會責任計畫',
    nameEn: 'Implement CSR Initiatives',
    description: '投入社區公益，創造共享價值',
    level: 'basic',
    kpis: ['公益投入金額', '志工服務時數', '受益人數'],
    references: ['ISO 26000'],
  },
  {
    id: 'S4.2',
    pillar: 'S',
    category: '社區參與',
    subcategory: '利害關係人溝通',
    name: '建立利害關係人溝通機制',
    nameEn: 'Establish Stakeholder Communication',
    description: '定期與利害關係人溝通，回應其關注議題',
    level: 'intermediate',
    kpis: ['溝通頻率', '議題回應率', '滿意度調查分數'],
    references: ['AA1000'],
  },

  // S5: 客戶責任
  {
    id: 'S5.1',
    pillar: 'S',
    category: '客戶責任',
    subcategory: '產品安全',
    name: '確保產品安全與品質',
    nameEn: 'Ensure Product Safety and Quality',
    description: '建立品質管理系統，確保產品安全',
    level: 'basic',
    kpis: ['產品合格率', '客訴案件數', '召回事件數'],
    references: ['ISO 9001'],
  },
  {
    id: 'S5.2',
    pillar: 'S',
    category: '客戶責任',
    subcategory: '客戶隱私',
    name: '保護客戶隱私與資料安全',
    nameEn: 'Protect Customer Privacy and Data Security',
    description: '建立資訊安全管理制度，保護客戶資料',
    level: 'intermediate',
    kpis: ['資安事件數', '資料外洩案件', 'ISO 27001 認證'],
    references: ['ISO 27001', '個資法'],
  },
];

// ── G: Governance 最佳實踐 ──────────────────────────────────

const GOVERNANCE_PRACTICES: BestPractice[] = [
  // G1: 公司治理
  {
    id: 'G1.1',
    pillar: 'G',
    category: '公司治理',
    subcategory: '董事會結構',
    name: '建立多元化董事會',
    nameEn: 'Establish Diverse Board of Directors',
    description: '確保董事會成員多元，包含獨立董事',
    level: 'basic',
    kpis: ['獨立董事佔比', '女性董事比例', '董事會出席率'],
    references: ['公司治理守則'],
  },
  {
    id: 'G1.2',
    pillar: 'G',
    category: '公司治理',
    subcategory: '永續治理',
    name: '設置永續發展委員會',
    nameEn: 'Establish Sustainability Committee',
    description: '在董事會層級設置 ESG 決策機制',
    level: 'intermediate',
    kpis: ['委員會會議頻率', 'ESG 議題納入率', '績效考覈'],
    references: ['TCFD Governance'],
  },

  // G2: 商業倫理
  {
    id: 'G2.1',
    pillar: 'G',
    category: '商業倫理',
    subcategory: '反貪腐',
    name: '建立反貪腐政策與機制',
    nameEn: 'Establish Anti-Corruption Policy',
    description: '制定反貪腐政策，建立舉報機制',
    level: 'basic',
    kpis: ['反貪腐訓練涵蓋率', '舉報案件數', '違規案件數'],
    references: ['ISO 37001', '貪污治罪條例'],
  },
  {
    id: 'G2.2',
    pillar: 'G',
    category: '商業倫理',
    subcategory: '供應商倫理',
    name: '要求供應商遵守商業倫理',
    nameEn: 'Require Supplier Ethical Compliance',
    description: '將商業倫理要求納入供應商管理',
    level: 'intermediate',
    kpis: ['供應商倫理培訓率', '違規案件數', '稽覈頻率'],
    references: ['Supply Chain Ethics'],
  },

  // G3: 資訊透明
  {
    id: 'G3.1',
    pillar: 'G',
    category: '資訊透明',
    subcategory: 'ESG 報告',
    name: '發布年度 ESG 報告',
    nameEn: 'Publish Annual ESG Report',
    description: '依 GRI/TCFD 標準發布永續報告',
    level: 'basic',
    kpis: ['報告發布頻率', '第三方保證', '揭露完整度'],
    references: ['GRI Standards', 'TCFD'],
  },
  {
    id: 'G3.2',
    pillar: 'G',
    category: '資訊透明',
    subcategory: '資訊揭露',
    name: '即時揭露重大 ESG 資訊',
    nameEn: 'Real-time Disclosure of Material ESG Info',
    description: '建立重大 ESG 資訊即時揭露機制',
    level: 'advanced',
    kpis: ['揭露時效性', '資訊完整性', '投資人滿意度'],
    references: ['SEC Climate Disclosure', 'CSRD'],
  },

  // G4: 風險管理
  {
    id: 'G4.1',
    pillar: 'G',
    category: '風險管理',
    subcategory: 'ESG 風險管理',
    name: '將 ESG 納入企業風險管理',
    nameEn: 'Integrate ESG into Enterprise Risk Management',
    description: '識別 ESG 相關風險，納入整體風險管理框架',
    level: 'basic',
    kpis: ['ESG 風險識別數', '風險評估頻率', '緩解措施執行率'],
    references: ['ISO 31000', 'COSO ERM'],
  },
  {
    id: 'G4.2',
    pillar: 'G',
    category: '風險管理',
    subcategory: '氣候風險',
    name: '進行氣候風險與機會評估',
    nameEn: 'Conduct Climate Risk and Opportunity Assessment',
    description: '依 TCFD 框架評估氣候相關風險與機會',
    level: 'intermediate',
    kpis: ['情境分析覆蓋率', '風險量化程度', '管理措施完成率'],
    references: ['TCFD', 'ISSB S2'],
  },

  // G5: 法規遵循
  {
    id: 'G5.1',
    pillar: 'G',
    category: '法規遵循',
    subcategory: '合規管理',
    name: '建立法規遵循管理系統',
    nameEn: 'Establish Compliance Management System',
    description: '建立合規管理機制，確保遵循相關法規',
    level: 'basic',
    kpis: ['合規培訓涵蓋率', '違規案件數', '罰鍰金額'],
    references: ['ISO 37301'],
  },
  {
    id: 'G5.2',
    pillar: 'G',
    category: '法規遵循',
    subcategory: 'ESG 法規',
    name: '追蹤並遵循 ESG 相關法規',
    nameEn: 'Track and Comply with ESG Regulations',
    description: '追蹤國內外 ESG 法規變化，確保合規',
    level: 'intermediate',
    kpis: ['法規追蹤頻率', '合規評估覆蓋率', '改善措施完成率'],
    references: ['EU CSRD', '臺灣永續發展法'],
  },
];

// ── MECE 驗證函數 ────────────────────────────────────────────

/**
 * 驗證 MECE 完備性：每個類別都有實踐
 */
export function validateMECECompleteness(): {
  pillars: Record<ESGPillar, number>;
  categories: Record<string, number>;
  isComplete: boolean;
  gaps: string[];
} {
  const allPractices = [
    ...ENVIRONMENTAL_PRACTICES,
    ...SOCIAL_PRACTICES,
    ...GOVERNANCE_PRACTICES,
  ];

  // 統計各支柱數量
  const pillars: Record<ESGPillar, number> = { E: 0, S: 0, G: 0 };
  allPractices.forEach(p => pillars[p.pillar]++);

  // 統計各類別數量
  const categories: Record<string, number> = {};
  allPractices.forEach(p => {
    const key = `${p.pillar}.${p.category}`;
    categories[key] = (categories[key] || 0) + 1;
  });

  // 檢查是否有遺漏
  const gaps: string[] = [];
  if (pillars.E < 3) gaps.push('Environmental 實踐不足 (至少需要 3 個)');
  if (pillars.S < 3) gaps.push('Social 實踐不足 (至少需要 3 個)');
  if (pillars.G < 3) gaps.push('Governance 實踐不足 (至少需要 3 個)');
  if (allPractices.length < 15) gaps.push('整體實踐數量不足 (至少需要 15 個)');

  return {
    pillars,
    categories,
    isComplete: gaps.length === 0,
    gaps,
  };
}

/**
 * 驗證 MECE 互斥性：無重複實踐
 */
export function validateMECEExclusivity(): {
  totalPractices: number;
  uniqueIds: number;
  duplicates: string[];
  isExclusive: boolean;
} {
  const allPractices = [
    ...ENVIRONMENTAL_PRACTICES,
    ...SOCIAL_PRACTICES,
    ...GOVERNANCE_PRACTICES,
  ];

  const seenIds = new Set<string>();
  const duplicates: string[] = [];

  allPractices.forEach(p => {
    if (seenIds.has(p.id)) {
      duplicates.push(p.id);
    }
    seenIds.add(p.id);
  });

  return {
    totalPractices: allPractices.length,
    uniqueIds: seenIds.size,
    duplicates,
    isExclusive: duplicates.length === 0,
  };
}

// ── 導出所有實踐 ────────────────────────────────────────────

export function getAllPractices(): BestPractice[] {
  return [
    ...ENVIRONMENTAL_PRACTICES,
    ...SOCIAL_PRACTICES,
    ...GOVERNANCE_PRACTICES,
  ];
}

export function getPracticesByPillar(pillar: ESGPillar): BestPractice[] {
  return getAllPractices().filter(p => p.pillar === pillar);
}

export function getPracticesByCategory(category: string): BestPractice[] {
  return getAllPractices().filter(p => p.category === category);
}

export function getPracticesByLevel(level: PracticeLevel): BestPractice[] {
  return getAllPractices().filter(p => p.level === level);
}

export function getPracticeById(id: string): BestPractice | undefined {
  return getAllPractices().find(p => p.id === id);
}

/**
 * 計算 ESG 總體評分
 */
export function calculateOverallScore(
  assessments: PracticeAssessment[]
): {
  totalScore: number;
  pillarScores: Record<ESGPillar, number>;
  levelBreakdown: Record<PracticeLevel, number>;
  recommendations: string[];
} {
  const allPractices = getAllPractices();
  const assessmentMap = new Map(assessments.map(a => [a.practiceId, a]));

  let totalScore = 0;
  const pillarScores: Record<ESGPillar, number> = { E: 0, S: 0, G: 0 };
  const pillarCounts: Record<ESGPillar, number> = { E: 0, S: 0, G: 0 };
  const levelBreakdown: Record<PracticeLevel, number> = { not_started: 0, basic: 0, intermediate: 0, advanced: 0 };

  allPractices.forEach(practice => {
    const assessment = assessmentMap.get(practice.id);
    const score = assessment?.score || 0;
    totalScore += score;
    pillarScores[practice.pillar] += score;
    pillarCounts[practice.pillar]++;
    if (assessment?.status) {
      levelBreakdown[assessment.status]++;
    }
  });

  // 計算平均分
  Object.keys(pillarScores).forEach(pillar => {
    const p = pillar as ESGPillar;
    pillarScores[p] = pillarCounts[p] > 0 ? Math.round(pillarScores[p] / pillarCounts[p]) : 0;
  });

  const avgScore = Math.round(totalScore / allPractices.length);

  // 產生建議
  const recommendations: string[] = [];
  if (pillarScores.E < 60) recommendations.push('加強 Environmental 實踐');
  if (pillarScores.S < 60) recommendations.push('加強 Social 實踐');
  if (pillarScores.G < 60) recommendations.push('加強 Governance 實踐');
  if (levelBreakdown.advanced < 3) recommendations.push('提升至 Advanced 等級的實踐數量');

  return {
    totalScore: avgScore,
    pillarScores,
    levelBreakdown,
    recommendations,
  };
}
