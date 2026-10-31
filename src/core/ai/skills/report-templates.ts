// ═══════════════════════════════════════════════════════════════
// ESGGO ESG Report Templates
// GRI / CSRD / TCFD 報告模板系統
// ═══════════════════════════════════════════════════════════════

export type ReportFramework = 'GRI' | 'CSRD' | 'TCFD' | 'SDG';
export type ReportLanguage = 'zh-TW' | 'en' | 'zh-CN';

export interface ReportSection {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  required: boolean;
  fields: ReportField[];
}

export interface ReportField {
  id: string;
  name: string;
  nameEn: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'table' | 'chart';
  required: boolean;
  options?: string[];
  unit?: string;
  placeholder?: string;
}

export interface ReportTemplate {
  id: string;
  framework: ReportFramework;
  name: string;
  nameEn: string;
  description: string;
  version: string;
  language: ReportLanguage;
  sections: ReportSection[];
}

// ── GRI 報告模板 ─────────────────────────────────────────────

export const GRI_TEMPLATE: ReportTemplate = {
  id: 'GRI-2021',
  framework: 'GRI',
  name: 'GRI 永續報告書模板',
  nameEn: 'GRI Sustainability Report Template',
  description: '依循 GRI Standards 2021 編製的永續報告書',
  version: '2021',
  language: 'zh-TW',
  sections: [
    {
      id: 'GRI-1',
      title: '關於本報告',
      titleEn: 'About This Report',
      description: '報告編製基礎、範圍、報導期間',
      required: true,
      fields: [
        { id: 'org_name', name: '組織名稱', nameEn: 'Organization Name', type: 'text', required: true },
        { id: 'report_period', name: '報導期間', nameEn: 'Reporting Period', type: 'text', required: true },
        { id: 'report_scope', name: '報告範圍', nameEn: 'Report Scope', type: 'textarea', required: true },
        { id: 'reporting_org', name: '報導組織', nameEn: 'Reporting Organization', type: 'textarea', required: true },
        { id: 'report_contact', name: '報告聯絡人', nameEn: 'Report Contact', type: 'text', required: false },
      ],
    },
    {
      id: 'GRI-2',
      title: '組織概況',
      titleEn: 'Organizational Profile',
      description: '組織基本資訊、規模、結構',
      required: true,
      fields: [
        { id: 'org_structure', name: '組織結構', nameEn: 'Organizational Structure', type: 'textarea', required: true },
        { id: 'location', name: '營運地點', nameEn: 'Location of Operations', type: 'textarea', required: true },
        { id: 'employees', name: '員工人數', nameEn: 'Number of Employees', type: 'number', required: true },
        { id: 'revenue', name: '營業收入', nameEn: 'Revenue', type: 'number', required: true, unit: 'USD' },
        { id: 'industry', name: '產業類別', nameEn: 'Industry', type: 'text', required: true },
      ],
    },
    {
      id: 'GRI-3',
      title: '策略',
      titleEn: 'Strategy',
      description: '永續發展策略、目標與進展',
      required: true,
      fields: [
        { id: 'esg_strategy', name: '永續策略', nameEn: 'ESG Strategy', type: 'textarea', required: true },
        { id: 'esg_goals', name: '永續目標', nameEn: 'ESG Goals', type: 'textarea', required: true },
        { id: 'esg_progress', name: '目標進展', nameEn: 'Goal Progress', type: 'textarea', required: true },
      ],
    },
    {
      id: 'GRI-400',
      title: 'GRI 400: 社會',
      titleEn: 'GRI 400: Social',
      description: '員工、人權、社區等社會議題',
      required: true,
      fields: [
        { id: 'employee_count', name: '員工人數', nameEn: 'Employee Count', type: 'number', required: true },
        { id: 'turnover_rate', name: '離職率', nameEn: 'Turnover Rate', type: 'number', required: true, unit: '%' },
        { id: 'training_hours', name: '培訓時數', nameEn: 'Training Hours', type: 'number', required: true, unit: 'hours' },
        { id: 'workplace_injury', name: '職業傷害', nameEn: 'Workplace Injury', type: 'number', required: true },
        { id: 'gender_ratio', name: '性別比例', nameEn: 'Gender Ratio', type: 'text', required: true },
        { id: 'diversity_initiatives', name: '多元共融措施', nameEn: 'Diversity Initiatives', type: 'textarea', required: false },
      ],
    },
    {
      id: 'GRI-300',
      title: 'GRI 300: 環境',
      titleEn: 'GRI 300: Environmental',
      description: '能源、水、排放等環境議題',
      required: true,
      fields: [
        { id: 'energy_consumption', name: '能源消耗', nameEn: 'Energy Consumption', type: 'number', required: true, unit: 'MWh' },
        { id: 'renewable_energy', name: '再生能源佔比', nameEn: 'Renewable Energy Ratio', type: 'number', required: true, unit: '%' },
        { id: 'ghg_scope1', name: 'Scope 1 排放', nameEn: 'GHG Scope 1', type: 'number', required: true, unit: 'tCO2e' },
        { id: 'ghg_scope2', name: 'Scope 2 排放', nameEn: 'GHG Scope 2', type: 'number', required: true, unit: 'tCO2e' },
        { id: 'ghg_scope3', name: 'Scope 3 排放', nameEn: 'GHG Scope 3', type: 'number', required: false, unit: 'tCO2e' },
        { id: 'water_withdrawal', name: '取水量', nameEn: 'Water Withdrawal', type: 'number', required: true, unit: 'm³' },
        { id: 'waste_generated', name: '廢棄物產生量', nameEn: 'Waste Generated', type: 'number', required: true, unit: 'kg' },
        { id: 'waste_recycled', name: '回收率', nameEn: 'Recycling Rate', type: 'number', required: true, unit: '%' },
      ],
    },
    {
      id: 'GRI-200',
      title: 'GRI 200: 經濟',
      titleEn: 'GRI 200: Economic',
      description: '經濟績效、間接經濟影響',
      required: true,
      fields: [
        { id: 'direct_economic_value', name: '直接經濟價值', nameEn: 'Direct Economic Value', type: 'number', required: true, unit: 'USD' },
        { id: 'tax_payments', name: '稅繳金額', nameEn: 'Tax Payments', type: 'number', required: true, unit: 'USD' },
        { id: 'local_procurement', name: '在地採購金額', nameEn: 'Local Procurement', type: 'number', required: false, unit: 'USD' },
      ],
    },
  ],
};

// ── TCFD 報告模板 ─────────────────────────────────────────────

export const TCFD_TEMPLATE: ReportTemplate = {
  id: 'TCFD-2021',
  framework: 'TCFD',
  name: 'TCFD 氣候相關財務揭露模板',
  nameEn: 'TCFD Climate-Related Financial Disclosures Template',
  description: '依循 TCFD Recommendations 2021 編製的氣候風險報告',
  version: '2021',
  language: 'zh-TW',
  sections: [
    {
      id: 'TCFD-Governance',
      title: '治理 (Governance)',
      titleEn: 'Governance',
      description: '董事會對氣候風險的監督、管理層的角色',
      required: true,
      fields: [
        { id: 'board_oversight', name: '董事會監督機制', nameEn: 'Board Oversight', type: 'textarea', required: true },
        { id: 'management_role', name: '管理層角色', nameEn: 'Management Role', type: 'textarea', required: true },
        { id: 'climate_competence', name: '氣候相關能力', nameEn: 'Climate Competence', type: 'textarea', required: false },
      ],
    },
    {
      id: 'TCFD-Strategy',
      title: '策略 (Strategy)',
      titleEn: 'Strategy',
      description: '氣候風險與機會對組織的影響',
      required: true,
      fields: [
        { id: 'climate_risks', name: '氣候風險識別', nameEn: 'Climate Risks Identified', type: 'textarea', required: true },
        { id: 'climate_opportunities', name: '氣候機會識別', nameEn: 'Climate Opportunities', type: 'textarea', required: true },
        { id: 'scenario_analysis', name: '情境分析', nameEn: 'Scenario Analysis', type: 'textarea', required: true },
        { id: 'financial_impact', name: '財務影響', nameEn: 'Financial Impact', type: 'textarea', required: true },
        { id: 'resilience', name: '韌性評估', nameEn: 'Resilience Assessment', type: 'textarea', required: true },
      ],
    },
    {
      id: 'TCFD-RiskManagement',
      title: '風險管理 (Risk Management)',
      titleEn: 'Risk Management',
      description: '識別、評估、管理氣候風險的流程',
      required: true,
      fields: [
        { id: 'risk_identification', name: '風險識別流程', nameEn: 'Risk Identification Process', type: 'textarea', required: true },
        { id: 'risk_assessment', name: '風險評估方法', nameEn: 'Risk Assessment Method', type: 'textarea', required: true },
        { id: 'risk_management', name: '風險管理整合', nameEn: 'Risk Management Integration', type: 'textarea', required: true },
        { id: 'risk_prioritization', name: '風險優先順序', nameEn: 'Risk Prioritization', type: 'textarea', required: true },
      ],
    },
    {
      id: 'TCFD-MetricsTargets',
      title: '指標與目標 (Metrics & Targets)',
      titleEn: 'Metrics & Targets',
      description: '衡量與管理氣候風險的指標與目標',
      required: true,
      fields: [
        { id: 'ghg_emissions', name: '溫室氣體排放', nameEn: 'GHG Emissions', type: 'table', required: true },
        { id: 'climate_kpis', name: '氣候相關 KPI', nameEn: 'Climate KPIs', type: 'table', required: true },
        { id: 'targets', name: '減碳目標', nameEn: 'Reduction Targets', type: 'textarea', required: true },
        { id: 'target_progress', name: '目標進展', nameEn: 'Target Progress', type: 'textarea', required: true },
        { id: 'internal_carbon_price', name: '內部碳價', nameEn: 'Internal Carbon Price', type: 'number', required: false, unit: 'USD/tCO2e' },
      ],
    },
  ],
};

// ── CSRD 報告模板 ─────────────────────────────────────────────

export const CSRD_TEMPLATE: ReportTemplate = {
  id: 'CSRD-2024',
  framework: 'CSRD',
  name: 'CSRD 歐盟永續報告模板',
  nameEn: 'CSRD EU Sustainability Reporting Template',
  description: '依循 CSRD ESRS 2024 編製的歐盟永續報告',
  version: '2024',
  language: 'zh-TW',
  sections: [
    {
      id: 'CSRD-General',
      title: '一般要求 (ESRS 1)',
      titleEn: 'General Requirements (ESRS 1)',
      description: '報告原則、重大性評估、利害關係人',
      required: true,
      fields: [
        { id: 'materiality_assessment', name: '雙重重大性評估', nameEn: 'Double Materiality Assessment', type: 'textarea', required: true },
        { id: 'stakeholder_engagement', name: '利害關係人參與', nameEn: 'Stakeholder Engagement', type: 'textarea', required: true },
        { id: 'value_chain', name: '價值鏈描述', nameEn: 'Value Chain Description', type: 'textarea', required: true },
      ],
    },
    {
      id: 'CSRD-Environmental',
      title: '環境議題 (ESRS E1-E5)',
      titleEn: 'Environmental (ESRS E1-E5)',
      description: '氣候變遷、汙染、水資源、生物多樣性、迴圈經濟',
      required: true,
      fields: [
        { id: 'climate_change', name: '氣候變遷 (E1)', nameEn: 'Climate Change (E1)', type: 'textarea', required: true },
        { id: 'pollution', name: '污染 (E2)', nameEn: 'Pollution (E2)', type: 'textarea', required: true },
        { id: 'water', name: '水資源 (E3)', nameEn: 'Water (E3)', type: 'textarea', required: true },
        { id: 'biodiversity', name: '生物多樣性 (E4)', nameEn: 'Biodiversity (E4)', type: 'textarea', required: true },
        { id: 'circular_economy', name: '迴圈經濟 (E5)', nameEn: 'Circular Economy (E5)', type: 'textarea', required: true },
      ],
    },
    {
      id: 'CSRD-Social',
      title: '社會議題 (ESRS S1-S4)',
      titleEn: 'Social (ESRS S1-S4)',
      description: '自有勞動力、供應鏈勞動力、受影響社羣、消費者',
      required: true,
      fields: [
        { id: 'own_workforce', name: '自有勞動力 (S1)', nameEn: 'Own Workforce (S1)', type: 'textarea', required: true },
        { id: 'supply_chain_workers', name: '供應鏈勞動力 (S2)', nameEn: 'Value Chain Workers (S2)', type: 'textarea', required: true },
        { id: 'affected_communities', name: '受影響社羣 (S3)', nameEn: 'Affected Communities (S3)', type: 'textarea', required: true },
        { id: 'consumers', name: '消費者 (S4)', nameEn: 'Consumers (S4)', type: 'textarea', required: true },
      ],
    },
    {
      id: 'CSRD-Governance',
      title: '治理議題 (ESRS G1)',
      titleEn: 'Governance (ESRS G1)',
      description: '商業倫理、反貪腐、投訴機制',
      required: true,
      fields: [
        { id: 'business_ethics', name: '商業倫理', nameEn: 'Business Ethics', type: 'textarea', required: true },
        { id: 'anti_corruption', name: '反貪腐措施', nameEn: 'Anti-Corruption', type: 'textarea', required: true },
        { id: 'complaints_mechanism', name: '投訴機制', nameEn: 'Complaints Mechanism', type: 'textarea', required: true },
      ],
    },
  ],
};

// ── SDG 對應模板 ─────────────────────────────────────────────

export const SDG_TEMPLATE: ReportTemplate = {
  id: 'SDG-MAPPING',
  framework: 'SDG',
  name: 'SDG 永續發展目標對應模板',
  nameEn: 'SDG Alignment Mapping Template',
  description: '對應聯合國 17 項永續發展目標的貢獻報告',
  version: '2015',
  language: 'zh-TW',
  sections: [
    {
      id: 'SDG-Overview',
      title: 'SDG 對應總覽',
      titleEn: 'SDG Alignment Overview',
      description: '組織對 SDGs 的整體貢獻概述',
      required: true,
      fields: [
        { id: 'sdg_alignment_strategy', name: 'SDG 對應策略', nameEn: 'SDG Alignment Strategy', type: 'textarea', required: true },
        { id: 'priority_sdgs', name: '優先 SDGs', nameEn: 'Priority SDGs', type: 'select', required: true, options: Array.from({ length: 17 }, (_, i) => `SDG ${i + 1}`) },
        { id: 'sdg_contribution', name: 'SDG 貢獻說明', nameEn: 'SDG Contribution', type: 'textarea', required: true },
      ],
    },
    {
      id: 'SDG-Details',
      title: '各 SDG 詳細對應',
      titleEn: 'SDG Detailed Mapping',
      description: '針對每個優先 SDG 的具體行動與成果',
      required: true,
      fields: [
        { id: 'sdg_actions', name: '具體行動', nameEn: 'Specific Actions', type: 'textarea', required: true },
        { id: 'sdg_targets', name: 'SDG 目標對應', nameEn: 'SDG Targets Alignment', type: 'textarea', required: true },
        { id: 'sdg_kpis', name: 'SDG 相關 KPI', nameEn: 'SDG-related KPIs', type: 'table', required: true },
        { id: 'sdg_progress', name: '進展與成果', nameEn: 'Progress & Results', type: 'textarea', required: true },
      ],
    },
  ],
};

// ── 模板管理 ─────────────────────────────────────────────────

export const ALL_TEMPLATES: ReportTemplate[] = [
  GRI_TEMPLATE,
  TCFD_TEMPLATE,
  CSRD_TEMPLATE,
  SDG_TEMPLATE,
];

export function getTemplate(framework: ReportFramework): ReportTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.framework === framework);
}

export function getAllTemplates(): ReportTemplate[] {
  return ALL_TEMPLATES;
}

export function getTemplateSections(framework: ReportFramework): ReportSection[] {
  const template = getTemplate(framework);
  return template?.sections || [];
}
