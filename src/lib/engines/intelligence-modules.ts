// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// ESG 商情偵測系統 — 七大模組核心引擎
// M2: Entity Watchlist 實體監測清單
// M3: Impact Scoring 影響評分（四象限）
// M4: Anomaly Detection 異常偵測
// M5: Policy Timeline Tracker 政策節點雷達
// M6: Supply Chain Risk 供應鏈/航運風險
// M7: Opportunity Finder 機會偵測
// M1: Signal Radar 多源信號雷達（總覽）
// ============================================================
// 位置: src/lib/engines/intelligence-modules.ts

// ============================================================
// M2: Entity Watchlist — 實體監測清單
// ============================================================

export type EntityType = 'competitor' | 'customer' | 'supplier' | 'country' | 'port' | 'route' | 'regulation' | 'standard';

export interface WatchedEntity {
  id: string;
  type: EntityType;
  name: string;
  aliases: string[];       // 別名/簡稱
  country?: string;
  industry?: string;
  riskDept?: string;       // 對應 OmniCore Responsible Dept
  tags: string[];
  watchSources: string[]   // 監測來源類型 IDs];
}

export interface EntityChangeEvent {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  changeType: 'filing' | 'ir_update' | 'esg_report' | 'procurement' | 'penalty' | 'litigation' | 'audit' | 'sanction' | 'standard_update';
  title: string;
  summary: string;
  sourceUrl: string;
  detectedAt: string;
  evidenceRef: string;      // 證據編號
}

export interface EntityAlert {
  event: EntityChangeEvent;
  impactScore: number;            // 0-100
  affectedDepartments: string[];  // 對應 OmniCore Responsible Dept
  recommendedAction: string;
  routingRule: AlertRouting;
}

export interface AlertRouting {
  department: string;
  role: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  assignTo?: string;
}

// 部門路由映射
export const DEPARTMENT_ROUTING: Record<EntityType, AlertRouting> = {
  competitor:  { department: 'Strategy',     role: '分析師',   urgency: 'medium' },
  customer:    { department: 'Sales',        role: '客戶經理', urgency: 'high' },
  supplier:    { department: 'Procurement',  role: '採購/法務', urgency: 'high' },
  country:     { department: 'Legal',        role: '法務',     urgency: 'medium' },
  port:        { department: 'Logistics',    role: '物流經理', urgency: 'medium' },
  route:       { department: 'Logistics',    role: '物流經理', urgency: 'medium' },
  regulation:  { department: 'Compliance',   role: '永續/財務', urgency: 'high' },
  standard:    { department: 'Sustainability', role: '永續長', urgency: 'medium' },
};

// 事件類型對應的預設動作
export const CHANGE_TYPE_ACTIONS: Record<string, string> = {
  filing:          '檢閱公告內容並評估對業務的影響',
  ir_update:       '分析投資人關係更新中的財務與ESG指標',
  esg_report:      '比對報告數據與內部記錄是否一致',
  procurement:     '評估得標/失標原因與競爭態勢',
  penalty:         '立即啟動法務複議程序與公開說明',
  litigation:      '評估訴訟風險與潛在賠償金額',
  audit:           '準備稽覈回應與改善追蹤',
  sanction:        '立即篩查供應鏈關聯性並停止高風險交易',
  standard_update: '比對新舊標準差異並啟動合規調整',
};

// ============================================================
// M3: Impact Scoring — 四象限影響評分模型
// ============================================================

export interface ImpactScore {
  financial: ImpactDimension;   // 成本/營收/資本支出
  compliance: ImpactDimension;  // 罰則/時程/審計
  supply: ImpactDimension;      // 交期/替代性/單點故障
  reputation: ImpactDimension;  // 媒體/社羣/訴訟
  composite: number;            // 綜合加權分數 0-100
  light: 'green' | 'yellow' | 'red' | 'black';
  reasoning: string[];
  evidenceLinks: string[];
  generatedAt: string;
}

export interface ImpactDimension {
  score: number;        // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  monetaryEstimate?: {  // 財務面才會有（選填）
    currency: string;
    min: number;
    max: number;
    basis: string;
  };
}

// 預設權重（可依政策/市場情境調整）
export const DEFAULT_WEIGHTS = {
  financial:  0.30,
  compliance: 0.30,
  supply:     0.20,
  reputation: 0.20,
};

// 指示燈邏輯
function getLight(score: number): 'green' | 'yellow' | 'red' | 'black' {
  if (score >= 80) return 'black';
  if (score >= 60) return 'red';
  if (score >= 40) return 'yellow';
  return 'green';
}

function getLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
}

/**
 * 一次算出完整四象限分數
 * 輸入各面向的原始證據強度 (0~1) * 衝擊程度 (0~1)
 */
export function calcImpactScore(dims: {
  financial: { strength: number; magnitude: number };
  compliance: { strength: number; magnitude: number };
  supply: { strength: number; magnitude: number };
  reputation: { strength: number; magnitude: number };
}, opts?: Partial<typeof DEFAULT_WEIGHTS>): ImpactScore {
  const w = { ...DEFAULT_WEIGHTS, ...opts };

  const financial: ImpactDimension = {
    score:   Math.min(100, Math.round(dims.financial.strength * dims.financial.magnitude * 100)),
    level:   getLevel(dims.financial.strength * dims.financial.magnitude * 100),
    factors: [],
  };
  const compliance: ImpactDimension = {
    score:   Math.min(100, Math.round(dims.compliance.strength * dims.compliance.magnitude * 100)),
    level:   getLevel(dims.compliance.strength * dims.compliance.magnitude * 100),
    factors: [],
  };
  const supply: ImpactDimension = {
    score:   Math.min(100, Math.round(dims.supply.strength * dims.supply.magnitude * 100)),
    level:   getLevel(dims.supply.strength * dims.supply.magnitude * 100),
    factors: [],
  };
  const reputation: ImpactDimension = {
    score:   Math.min(100, Math.round(dims.reputation.strength * dims.reputation.magnitude * 100)),
    level:   getLevel(dims.reputation.strength * dims.reputation.magnitude * 100),
    factors: [],
  };

  const composite = Math.round(
    financial.score * w.financial +
    compliance.score * w.compliance +
    supply.score * w.supply +
    reputation.score * w.reputation
  );

  return {
    financial, compliance, supply, reputation,
    composite,
    light: getLight(composite),
    reasoning: [],
    evidenceLinks: [],
    generatedAt: new Date().toISOString(),
  };
}

// ============================================================
// M4: Anomaly Detection — 異常偵測引擎
// ============================================================

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

export interface Anomaly {
  id: string;
  metric: string;          // 例: 'EUA碳價', 'BDI指數', '用電量'
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  currentValue: number;
  expectedValue: number;
  deviation: number;         // % 偏離
  description: string;
  recommendation: string;
  detectedAt: string;
  historicalData: TimeSeriesPoint[];
}

export type AnomalyType =
  | 'spike'          // 突然飆升
  | 'drop'           // 突然下跌
  | 'volatility'     // 波動率跳升
  | 'keyword_surge'  // 關鍵字激增
  | 'cluster'        // 事件羣聚
  | 'trend_shift';   // 趨勢轉向

/**
 * 使用滾動平均 + 標準差找異常（Z-score > 2 視為異常）
 */
export function detectAnomaly(series: TimeSeriesPoint[], opts?: {
  window?: number;
  threshold?: number;
}): Anomaly | null {
  const len = series.length;
  if (len == null) return null;
  const window = opts?.window || 20;
  const threshold = opts?.threshold || 2.0;

  const recent = series.slice(-window);
  const mean = recent.reduce((a, b) => a + b.value, 0) / recent.length;
  const std = Math.sqrt(
    recent.reduce((a, b) => a + Math.pow(b.value - mean, 2), 0) / recent.length
  );

  const current = series[series.length - 1];
  const zscore = std > 0 ? (current.value - mean) / std : 0;

  if (Math.abs(zscore) <= threshold) return null;

  const deviation = mean !== 0 ? ((current.value - mean) / mean) * 100 : 0;

  return {
    id: `ano_${Date.now()}`,
    metric: 'metric',  // 外部指定
    type: zscore > 0 ? 'spike' : 'drop',
    severity: Math.abs(zscore) > 3 ? 'critical' :
              Math.abs(zscore) > 2.5 ? 'high' : 'medium',
    currentValue: current.value,
    expectedValue: parseFloat(mean.toFixed(2)),
    deviation: parseFloat(deviation.toFixed(2)),
    description: `${detectAnomaly.name} 偵測：${zscore > 0 ? '異常上升' : '異常下降'}（偏離均值 ${deviation.toFixed(1)}%, Z=${zscore.toFixed(2)}）`,
    recommendation: zscore > 0
      ? '建議檢查是否為單事件、政策或持續性趨勢，並啟動因應對策'
      : '建議監控進場機會或建立避險部位',
    detectedAt: new Date().toISOString(),
    historicalData: series.slice(-window),
  };
}

// ============================================================
// M5: Policy Timeline Tracker — 政策節點雷達
// ============================================================

export interface PolicyMilestone {
  id: string;
  regulation: string;       // 法規名稱
  region: string;
  eventType: 'consultation' | 'draft' | 'approved' | 'effective' | 'enforcement' | 'review' | 'transition_end';
  date: string;
  description: string;
  applicability: ApplicabilityResult;
  tasks: ComplianceTask[];
  evidenceUrl: string;
}

export interface ApplicabilityResult {
  applicable: boolean;
  reason: string;
  matchingCriteria: string[];     // ['revenue_eu>15M', 'listed', 'high_emission'];
  revenueThreshold?: number;
  employeeThreshold?: number;
  supplyChainScope?: string[];
}

export interface ComplianceTask {
  id: string;
  title: string;
  ownerDept: string;          // Responsible Dept
  dueDate: string;
  status: 'pending' | 'in_progress' | 'done' | 'overdue';
  effortDays: number;
}

/**
 * 判讀使用者是否適用某法規（簡易規則引擎）
 */
export function assessApplicability(
  policy: { revenueThreshold?: number; regions: string[]; sectors: string[] },
  company: { revenue?: number; regions: string[]; sector: string }
): ApplicabilityResult {
  const matches: string[] = [];
  let applicable = false;

  if (policy.regions.some(r => company.regions.includes(r))) {
    matches.push('company_operates_in_scope');
    applicable = true;
  }
  if (policy.revenueThreshold && company.revenue && company.revenue >= policy.revenueThreshold) {
    matches.push(`revenue>=${policy.revenueThreshold}`);
    applicable = true;
  }
  if (policy.sectors.includes(company.sector)) {
    matches.push(`sector=${company.sector}`);
    applicable = true;
  }

  return {
    applicable,
    reason: applicable
      ? `符合 ${matches.length} 項適用條件`
      : '不符合任何適用條件（目前無需行動）',
    matchingCriteria: matches,
  };
}

/**
 * 自動產生 90 天合規待辦
 */
export function generateComplianceTasks(milestone: PolicyMilestone, department: string): ComplianceTask[] {
  const _today = new Date();
  const due = new Date(milestone.date);

  return [
    {
      id: `task_gap_${milestone.id}`,
      title: `法規落差分析 — ${milestone.regulation}`,
      ownerDept: department,
      dueDate: new Date(due.getTime() - 60 * 864e5).toISOString(),
      status: 'pending',
      effortDays: 5,
    },
    {
      id: `task_evidence_${milestone.id}`,
      title: `準備合規證據清單 — ${milestone.regulation}`,
      ownerDept: department,
      dueDate: new Date(due.getTime() - 30 * 864e5).toISOString(),
      status: 'pending',
      effortDays: 10,
    },
    {
      id: `task_submit_${milestone.id}`,
      title: `完成合規提交或申報 — ${milestone.regulation}`,
      ownerDept: department,
      dueDate: due.toISOString(),
      status: 'pending',
      effortDays: 3,
    },
  ];
}

// ============================================================
// M6: Supply Chain & Logistics Risk — 供應鏈/航運風險
// ============================================================

export interface LogisticsRisk {
  id: string;
  route: string;
  riskType: 'congestion' | 'blockade' | 'piracy' | 'sanctions' | 'weather' | 'port_closure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedPorts: string[];
  estimatedDelay: number;       // 天
  costImpact: {
    additionalCost: number;
    currency: string;
    basis: string;
  };
  alternatives: AlternativeRoute[];
  recommendation: string;
}

export interface AlternativeRoute {
  description: string;
  via: string[];
  estimatedDays: number;
  costDelta: number;     // +% vs original
  riskLevel: 'low' | 'medium' | 'high';
}

export interface MaterialRisk {
  material: string;
  singlePointOfFailure: boolean;
  topSuppliers: { name: string; country: string; share: number }[];
  alternatives: string[];
  strategicDays: number;   // 可撐天數
  recommendation: string;
}

/**
 * 供應鏈風險評分（單點故障 + 集中度 + 地緣風險）
 */
export function assessSupplyChainRisk(opts: {
  suppliers: { name: string; country: string; share: number; sanctioned?: boolean }[];
  material: string;
  dailyUsage: number;       // 每日消耗量
  currentInventory: number;  // 目前庫存（噸/單位）
}): { score: number; singleRisk: MaterialRisk; recommendations: string[] } {
  const totalShare = opts.suppliers.reduce((a, b) => a + b.share, 0);
  const top3share = opts.suppliers.slice(0, 3).reduce((a, b) => a + b.share, 0) / totalShare;
  const sanctioned = opts.suppliers.filter(s => s.sanctioned).length;
  const strategicDays = opts.currentInventory / opts.dailyUsage;
  let score = 0;
  const recommendations: string[] = [];

  if (top3share > 0.7) { score += 30; recommendations.push('前三大供應商佔比>70%，建議分散採購'); }
  if (sanctioned > 0) { score += 25; recommendations.push(`有 ${sanctioned} 家供應商在制裁名單中，建議立即排查替代方案`); }
  if (strategicDays < 14) { score += 25; recommendations.push('庫存低於 14 天，建議提升安全存量'); }
  if (strategicDays < 7)  { score += 20; recommendations.push('庫存低於 7 天，啟動緊急採購程序'); }

  const spof = opts.suppliers.length <= 2 || opts.suppliers[0].share > 0.6;

  return {
    score: Math.min(100, score),
    singleRisk: {
      material: opts.material,
      singlePointOfFailure: spof,
      topSuppliers: opts.suppliers.slice(0, 5),
      alternatives: [],
      strategicDays: parseFloat(Math.max(0, strategicDays).toFixed(1)),
      recommendation: recommendations[0] || '目前風險可控，持續監控',
    },
    recommendations,
  };
}

// ============================================================
// M7: Opportunity Finder — 機會偵測
// ============================================================

export interface Opportunity {
  id: string;
  type: 'subsidy' | 'tender' | 'green_finance' | 'procurement_demand' | 'tax_incentive';
  title: string;
  agency: string;
  region: string;
  sector: string[];
  amount?: {
    min: number;
    max: number;
    currency: string;
  };
  deadline: string;
  eligibility: string[];
  applicationUrl: string;
  fitScore: number;       // 與用戶的匹配度 0-100
  effortDays: number;
  summary: string;
}

/**
 * 計算用戶與機會的匹配度
 */
export function calcOpportunityFit(
  opportunity: Omit<Opportunity, 'fitScore'>,
  companyProfile: { sector: string[]; regions: string[]; revenue: number; esgTargets: string[] }
): number {
  let score = 0;
  const max = 100;
  score += opportunity.sector.some(s => companyProfile.sector.includes(s)) ? 30 : 0;
  score += opportunity.region.includes('全球') || companyProfile.regions.some(r => opportunity.region.includes(r)) ? 25 : 0;
  score += opportunity.eligibility.filter(e =>
    companyProfile.esgTargets.some(t => e.toLowerCase().includes(t.toLowerCase()))
  ).length * 15;
  return Math.min(max, score);
}

// ============================================================
// M1: Signal Radar — 多源信號雷達總覽
// ============================================================

export interface Signal {
  id: string;
  category: 'policy' | 'market' | 'supply_chain' | 'risk_event' | 'technology' | 'investment';
  title: string;
  sourceName: string;
  confidence: number;    // 可信度 0-1
  relevance: string[];   // 受影響的 OmniCore 指標羣組
  actions: string[];
  detectedAt: string;
}

export interface RadarSnapshot {
  date: string;
  topSignals: Signal[];
  byCategory: Record<string, number>;
  byRegion: Record<string, number>;
  bySeverity: { low: number; medium: number; high: number; critical: number };
}

/**
 * 由所有模組統一匯入信號，產生 Top‑N 週報
 */
export function buildRadarSnapshot(opts: {
  entityAlerts: EntityAlert[];
  anomalies: Anomaly[];
  policyMilestones: PolicyMilestone[];
  logisticsRisks: LogisticsRisk[];
  opportunities: Opportunity[];
}): RadarSnapshot {
  const byCategory: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };

  const count = (m: string) => { byCategory[m] = (byCategory[m] || 0) + 1; };
  const countRegion = (r: string) => { byRegion[r] = (byRegion[r] || 0) + 1; };

  opts.entityAlerts.forEach(a => {
    count(a.event.changeType.includes('sanction') ? 'risk_event' :
          a.event.changeType.includes('standard') ? 'policy' : 'supply_chain');
    bySeverity[a.impactScore >= 80 ? 'critical' : a.impactScore >= 60 ? 'high' :
               a.impactScore >= 40 ? 'medium' : 'low']++;
  });
  opts.anomalies.forEach(a => { count('market'); if (a.severity == 'critical') bySeverity.critical++; });
  opts.policyMilestones.forEach(p => { count('policy'); countRegion(p.region); });
  opts.logisticsRisks.forEach(l => { count('supply_chain'); countRegion(l.route); });
  opts.opportunities.forEach(_o => { count('investment'); });

  const topSignals: Signal[] = [];
  return {
    date: new Date().toISOString(),
    topSignals,
    byCategory,
    byRegion,
    bySeverity,
  };
}

// ============================================================
// 匯出單例服務（可直接在 route 中使用）
// ============================================================
export const IntelligenceModules = {
  // M2
  getRouting: (type: EntityType) => DEPARTMENT_ROUTING[type],
  getAction:   (eventType: string) => CHANGE_TYPE_ACTIONS[eventType] || '內部審查',
  buildAlert:  (event: EntityChangeEvent): EntityAlert => ({
    event,
    impactScore: 50,
    affectedDepartments: [DEPARTMENT_ROUTING[event.entityType].department],
    recommendedAction: CHANGE_TYPE_ACTIONS[event.changeType] || '審查',
    routingRule: DEPARTMENT_ROUTING[event.entityType],
  }),
  // M3
  score:       calcImpactScore,
  // M4
  anomaly:     detectAnomaly,
  // M5
  applicable:  assessApplicability,
  tasking:     generateComplianceTasks,
  // M6
  supplyRisk:  assessSupplyChainRisk,
  // M7
  oppFit:      calcOpportunityFit,
  // M1
  radar:       buildRadarSnapshot,
};
