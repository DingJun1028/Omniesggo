// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * ==========================================
 * ESG 合規報告自動生成 - 類型定義
 * ==========================================
 */

// ==========================================
// 報告標準
// ==========================================

export type ReportStandard = 'GRI' | 'SASB' | 'TCFD' | 'ISO14001' | 'CDP';

export interface ReportConfig {
  standard: ReportStandard;
  period: {
    start: Date;
    end: Date;
  };
  language: 'zh-TW' | 'en' | 'ja';
  format: 'pdf' | 'html' | 'markdown';
  sections?: string[];
}

// ==========================================
// GRI 標準
// ==========================================

export interface GRIReport {
  metadata: GRIMetadata;
  generalDisclosures: GRIGeneralDisclosures;
  materialTopics: GRIMaterialTopic[];
  specificDisclosures: GRISpecificDisclosure[];
}

export interface GRIMetadata {
  reportTitle: string;
  reportingPeriod: string;
  reportingOrganization: string;
  reportDate: string;
  reportType: 'annual' | 'sustainability' | 'special';
  contactPerson: string;
  contactEmail: string;
}

export interface GRIGeneralDisclosures {
  organizationalProfile: {
    name: string;
    nature: string;
    headquarters: string;
    countriesOfOperation: string[];
    ownershipStructure: string;
    markets: string[];
    stakeholderGroups: string[];
  };
  strategicInitiatives: {
    strategyDescription: string;
    strategicPriority: string[];
    sustainabilityStrategy: string;
  };
  stakeholderEngagement: {
    stakeholderGroups: string[];
    engagementMethods: string[];
    stakeholderNeeds: string[];
  };
  reportProfile: {
    reportingPeriod: string;
    previousReportDate: string;
    reportingBoundary: string;
    externalAssurance: boolean;
    assuranceProvider?: string;
  };
}

export interface GRIMaterialTopic {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance';
  materialityScore: number;
  description: string;
  disclosures: GRISpecificDisclosure[];
}

export interface GRISpecificDisclosure {
  code: string;
  title: string;
  description: string;
  data: string | number | boolean | string[];
  unit?: string;
  notes?: string;
}

// ==========================================
// SASB 標準
// ==========================================

export interface SASBReport {
  metadata: SASBMetadata;
  industry: SASBIndustry;
  dimensions: SASBDimension[];
  metrics: SASBMetric[];
}

export interface SASBMetadata {
  reportTitle: string;
  reportingPeriod: string;
  organizationName: string;
  industryClassification: string;
  reportDate: string;
}

export interface SASBIndustry {
  sector: string;
  industryGroup: string;
  industry: string;
  subIndustry: string;
}

export interface SASBDimension {
  name: string;
  description: string;
  metrics: SASBMetric[];
}

export interface SASBMetric {
  code: string;
  name: string;
  description: string;
  unit: string;
  value: number | string;
  yearOverYearChange?: number;
  notes?: string;
}

// ==========================================
// TCFD 標準
// ==========================================

export interface TCFDReport {
  metadata: TCFDMetadata;
  governance: TCFDGovernance;
  strategy: TCFDStrategy;
  riskManagement: TCFDRiskManagement;
  metricsAndTargets: TCFDMetricsAndTargets;
}

export interface TCFDMetadata {
  reportTitle: string;
  reportingPeriod: string;
  organizationName: string;
  reportDate: string;
  alignmentLevel: 'basic' | 'intermediate' | 'advanced';
}

export interface TCFDGovernance {
  boardOversight: {
    description: string;
    climateResponsibilities: string[];
    competencies: string[];
  };
  managementRole: {
    description: string;
    committees: string[];
    integration: string;
  };
}

export interface TCFDStrategy {
  climateRisksAndOpportunities: {
    shortTerm: TCFDRiskItem[];
    mediumTerm: TCFDRiskItem[];
    longTerm: TCFDRiskItem[];
  };
  impactOnBusiness: {
    description: string;
    financialImpact: string;
    strategicResponse: string;
  };
  resilience: {
    description: string;
    scenarios: TCFDScenario[];
  };
}

export interface TCFDRiskItem {
  type: 'physical' | 'transition';
  category: string;
  description: string;
  timeHorizon: string;
  potentialImpact: string;
}

export interface TCFDScenario {
  name: string;
  description: string;
  temperaturePath: string;
  assumptions: string[];
  outcomes: string[];
}

export interface TCFDRiskManagement {
  process: {
    description: string;
    identificationProcess: string;
    assessmentProcess: string;
    prioritizationProcess: string;
  };
  integration: {
    description: string;
    riskManagementProcess: string;
    strategicPlanning: string;
  };
}

export interface TCFDMetricsAndTargets {
  metrics: TCFDMetric[];
  targets: TCFDTarget[];
}

export interface TCFDMetric {
  category: 'greenhouse gas emissions' | 'climate-related risks' | 'climate-related opportunities' | 'water' | 'energy';
  name: string;
  description: string;
  unit: string;
  value: number;
  scope?: string;
  method?: string;
}

export interface TCFDTarget {
  name: string;
  description: string;
  targetYear: number;
  baselineYear: number;
  baselineValue: number;
  targetValue: number;
  unit: string;
  progress: number;
}

// ==========================================
// 報告生成結果
// ==========================================

export interface GeneratedReport {
  id: string;
  standard: ReportStandard;
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  content: string;
  sections: ReportSection[];
  metadata: Record<string, unknown>;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  subsections?: ReportSection[];
}

// ==========================================
// 報告模板
// ==========================================

export interface ReportTemplate {
  id: string;
  name: string;
  standard: ReportStandard;
  language: string;
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  title: string;
  required: boolean;
  contentGenerator: (data: unknown) => string;
}
