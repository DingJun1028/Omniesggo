// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * ==========================================
 * ESG 資料分析引擎 - 類型定義
 * ==========================================
 */

// ==========================================
// ESG 資料模型
// ==========================================

export interface ESGDataPoint {
  id: string;
  timestamp: Date;
  category: ESGCategory;
  metric: string;
  value: number;
  unit: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export type ESGCategory = 'environmental' | 'social' | 'governance';

// ==========================================
// 環境指標 (Environmental)
// ==========================================

export interface EnvironmentalMetrics {
  carbonEmissions: CarbonEmissions;
  energyConsumption: EnergyConsumption;
  wasteManagement: WasteManagement;
  waterUsage: WaterUsage;
  biodiversityImpact: BiodiversityImpact;
}

export interface CarbonEmissions {
  scope1: number; // 直接排放
  scope2: number; // 間接排放（電力）
  scope3: number; // 其他間接排放
  total: number;
  unit: 'tCO2e';
  reductionTarget?: number;
  reductionProgress?: number;
}

export interface EnergyConsumption {
  renewable: number;
  nonRenewable: number;
  total: number;
  unit: 'MWh';
  efficiency: number; // %
  renewableRatio: number; // %
}

export interface WasteManagement {
  recycled: number;
  landfilled: number;
  incinerated: number;
  total: number;
  unit: 'tonnes';
  recyclingRate: number; // %
}

export interface WaterUsage {
  freshwater: number;
  recycled: number;
  total: number;
  unit: 'm³';
  efficiency: number; // %
  waterStress: 'low' | 'medium' | 'high';
}

export interface BiodiversityImpact {
  score: number; // 0-100
  affectedArea: number; // hectares
  mitigationMeasures: string[];
  netPositive: boolean;
}

// ==========================================
// 社會指標 (Social)
// ==========================================

export interface SocialMetrics {
  workforce: WorkforceMetrics;
  diversity: DiversityMetrics;
  healthSafety: HealthSafetyMetrics;
  humanRights: HumanRightsMetrics;
  communityImpact: CommunityImpactMetrics;
}

export interface WorkforceMetrics {
  totalEmployees: number;
  turnoverRate: number; // %
  trainingHours: number; // per employee
  satisfactionScore: number; // 0-100
  livingWage: boolean;
}

export interface DiversityMetrics {
  genderDiversity: {
    female: number; // %
    male: number; // %
    nonBinary: number; // %
  };
  ageDiversity: {
    under30: number; // %
    between30and50: number; // %
    over50: number; // %
  };
  ethnicDiversity: number; // 0-100 index
  payEquityRatio: number; // female/male ratio
}

export interface HealthSafetyMetrics {
  incidentRate: number; // per 200,000 hours
  lostTimeInjuryRate: number;
  nearMissReporting: number;
  safetyTrainingHours: number;
  fatalityCount: number;
}

export interface HumanRightsMetrics {
  policyInPlace: boolean;
  dueDiligenceScore: number; // 0-100
  grievanceMechanism: boolean;
  supplierAuditRate: number; // %
}

export interface CommunityImpactMetrics {
  investmentInCommunity: number; // USD
  volunteerHours: number;
  localEmploymentRate: number; // %
  socialPrograms: number;
}

// ==========================================
// 治理指標 (Governance)
// ==========================================

export interface GovernanceMetrics {
  boardComposition: BoardComposition;
  ethics: EthicsMetrics;
  transparency: TransparencyMetrics;
  riskManagement: RiskManagementMetrics;
}

export interface BoardComposition {
  totalMembers: number;
  independentDirectors: number; // %
  femaleDirectors: number; // %
  averageTenure: number; // years
  diversityIndex: number; // 0-100
}

export interface EthicsMetrics {
  codeOfEthics: boolean;
  antiCorruptionPolicy: boolean;
  whistleblowerMechanism: boolean;
  trainingCompletionRate: number; // %
  violationsReported: number;
}

export interface TransparencyMetrics {
  esgReporting: boolean;
  thirdPartyVerification: boolean;
  disclosureScore: number; // 0-100
  reportingStandards: string[]; // GRI, SASB, TCFD, etc.
}

export interface RiskManagementMetrics {
  esgRiskAssessment: boolean;
  climateRiskAssessment: boolean;
  cyberSecurityScore: number; // 0-100
  businessContinuityPlan: boolean;
}

// ==========================================
// 分析結果
// ==========================================

export interface ESGAnalysisResult {
  id: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  scores: ESGScores;
  insights: ESGInsight[];
  recommendations: ESGRecommendation[];
  benchmarks: ESGBenchmark[];
  trends: ESGTrend[];
}

export interface ESGScores {
  environmental: ScoreBreakdown;
  social: ScoreBreakdown;
  governance: ScoreBreakdown;
  overall: number; // 0-100
}

export interface ScoreBreakdown {
  score: number; // 0-100
  rank: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  percentile: number; // 0-100
  change: number; // vs previous period
}

export interface ESGInsight {
  id: string;
  category: ESGCategory;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  dataPoints: string[];
}

export interface ESGRecommendation {
  id: string;
  category: ESGCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  implementationCost: 'high' | 'medium' | 'low';
  timeframe: 'short' | 'medium' | 'long';
}

export interface ESGBenchmark {
  category: ESGCategory;
  metric: string;
  value: number;
  industryAverage: number;
  industryBest: number;
  unit: string;
}

export interface ESGTrend {
  category: ESGCategory;
  metric: string;
  direction: 'improving' | 'stable' | 'declining';
  changeRate: number; // %
  period: string;
}

// ==========================================
// 視覺化配置
// ==========================================

export interface ESGVisualizationConfig {
  type: 'chart' | 'dashboard' | 'report';
  title: string;
  description?: string;
  layout: VisualizationLayout;
  components: VisualizationComponent[];
}

export interface VisualizationLayout {
  columns: number;
  rows: number;
  gap: number;
}

export interface VisualizationComponent {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'radar' | 'heatmap' | 'gauge' | 'table';
  title: string;
  data: unknown;
  position: {
    column: number;
    row: number;
    colspan: number;
    rowspan: number;
  };
  options?: Record<string, unknown>;
}
