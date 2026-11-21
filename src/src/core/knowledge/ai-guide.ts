/**
 * AI 對話引導系統 (AI Dialogue Guide System)
 * 
 * ESG 報告撰寫的 AI 對話式引導引擎
 * 引導用戶完成 7 個步驟的報告撰寫流程
 * 
 * @module lib/knowledge/ai-guide
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

/** 報告類型 */
export type ReportType = 'gri' | 'sasb' | 'tcfd' | 'issb' | 'esg-comprehensive' | 'custom';

/** 引導步驟 */
export type GuideStep =
  | 'company-profile'
  | 'stakeholder-engagement'
  | 'materiality-assessment'
  | 'data-collection'
  | 'report-writing'
  | 'compliance-check'
  | 'final-review';

/** 問題類型 */
export type QuestionType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'scale';

/** 會話狀態 */
export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';

/** 引導問題 */
export interface GuideQuestion {
  id: string;
  step: GuideStep;
  order: number;
  type: QuestionType;
  question: string;
  questionEn: string;
  explanation: string;
  explanationEn: string;
  placeholder?: string;
  options?: QuestionOption[];
  required: boolean;
  griMapping?: string;
  sasbMapping?: string;
  tcfdMapping?: string;
  issbMapping?: string;
  helpText?: string;
  helpTextEn?: string;
  validation?: QuestionValidation;
  dependsOn?: { questionId: string; value: string | number | boolean };
}

/** 問題選項 */
export interface QuestionOption {
  id: string;
  label: string;
  labelEn: string;
  value: string | number | boolean;
  description?: string;
  descriptionEn?: string;
}

/** 問題驗證規則 */
export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

/** 答案記錄 */
export interface AnswerRecord {
  questionId: string;
  answer: string | number | boolean | string[];
  answeredAt: string;
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
}

/** 會話記錄 */
export interface ConversationEntry {
  id: string;
  timestamp: string;
  type: 'question' | 'answer' | 'system' | 'suggestion' | 'help';
  content: string;
  contentEn?: string;
  metadata?: Record<string, unknown>;
}

/** 引導會話 */
export interface GuideSession {
  id: string;
  companyId: string;
  reportType: ReportType;
  currentStep: GuideStep;
  currentQuestionIndex: number;
  status: SessionStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  answers: AnswerRecord[];
  conversationHistory: ConversationEntry[];
  metadata: SessionMetadata;
}

/** 會話元數據 */
export interface SessionMetadata {
  totalQuestions: number;
  answeredQuestions: number;
  estimatedRemainingMinutes: number;
  completionPercentage: number;
  complianceScore?: ComplianceScore;
}

/** 合規評分 */
export interface ComplianceScore {
  gri: number;
  sasb: number;
  tcfd: number;
  issb: number;
  financialBureau: number; // 金管會
  overall: number;
}

/** 智能建議 */
export interface SmartSuggestion {
  id: string;
  category: 'data' | 'compliance' | 'structure' | 'content' | 'quality';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  actionUrl?: string;
  relatedQuestions?: string[];
  estimatedImpact: string;
  estimatedImpactEn: string;
}

/** 報告段落生成結果 */
export interface ReportSection {
  chapterNumber: number;
  chapterTitle: string;
  chapterTitleEn: string;
  content: string;
  wordCount: number;
  dataQuality: 'high' | 'medium' | 'low';
  compliance: ComplianceScore;
  suggestions: string[];
  references: string[];
}

/** 引導配置 */
export interface GuideConfig {
  steps: GuideStepConfig[];
  questionsPerStep: Record<GuideStep, number>;
  estimatedMinutesPerStep: Record<GuideStep, number>;
}

/** 步驟配置 */
export interface GuideStepConfig {
  id: GuideStep;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  order: number;
}

// ============================================================================
// Constants
// ============================================================================

const GUIDE_STEPS: GuideStepConfig[] = [
  {
    id: 'company-profile',
    title: '公司概覽與邊界設定',
    titleEn: 'Company Profile & Boundary',
    description: '瞭解您的公司基本信息、行業類別和報告邊界範圍',
    descriptionEn: 'Understand your company basics, industry, and report boundary scope',
    icon: '🏢',
    order: 1,
  },
  {
    id: 'stakeholder-engagement',
    title: '利害關係人鑑別',
    titleEn: 'Stakeholder Engagement',
    description: '識別關鍵利害關係人及其關注議題',
    descriptionEn: 'Identify key stakeholders and their concerns',
    icon: '👥',
    order: 2,
  },
  {
    id: 'materiality-assessment',
    title: '重大性評估',
    titleEn: 'Materiality Assessment',
    description: '評估各 ESG 議題對公司和利害關係人的重要性',
    descriptionEn: 'Assess materiality of ESG topics for company and stakeholders',
    icon: '📊',
    order: 3,
  },
  {
    id: 'data-collection',
    title: '數據收集',
    titleEn: 'Data Collection',
    description: '按章節系統性收集 ESG 數據和證明文件',
    descriptionEn: 'Systematically collect ESG data and supporting documents by chapter',
    icon: '📁',
    order: 4,
  },
  {
    id: 'report-writing',
    title: '報告撰寫',
    titleEn: 'Report Writing',
    description: '根據收集的數據撰寫各章節內容',
    descriptionEn: 'Write chapter content based on collected data',
    icon: '✍️',
    order: 5,
  },
  {
    id: 'compliance-check',
    title: '合規檢查',
    titleEn: 'Compliance Check',
    description: '檢查報告是否符合 GRI/SASB/TCFD/ISSB 及金管會規範',
    descriptionEn: 'Verify compliance with GRI/SASB/TCFD/ISSB and Financial Bureau standards',
    icon: '✅',
    order: 6,
  },
  {
    id: 'final-review',
    title: '最終審查與發布',
    titleEn: 'Final Review & Publish',
    description: '進行同儕審查、數據驗證並發布報告',
    descriptionEn: 'Conduct peer review, data verification, and publish report',
    icon: '🚀',
    order: 7,
  },
];

const STEP_QUESTIONS: Record<GuideStep, GuideQuestion[]> = {
  'company-profile': [
    {
      id: 'cp-001',
      step: 'company-profile',
      order: 1,
      type: 'text',
      question: '請簡述您的公司名稱和主要業務範圍？',
      questionEn: 'Please provide your company name and main business scope?',
      explanation: '這是報告的基本資訊，幫助我們瞭解您的公司背景和業務性質。',
      explanationEn: 'This is fundamental information for the report, helping us understand your company background.',
      placeholder: '例如：綠能科技股份有限公司，專注於太陽能板製造與銷售...',
      required: true,
      validation: { minLength: 5, maxLength: 500 },
    },
    {
      id: 'cp-002',
      step: 'company-profile',
      order: 2,
      type: 'select',
      question: '您的公司屬於哪個行業類別？',
      questionEn: 'Which industry sector does your company belong to?',
      explanation: '不同行業面臨的 ESG 風險和機會不同，選擇正確的行業將確保報告內容的針對性。',
      explanationEn: 'Different industries face different ESG risks and opportunities. Selecting the right industry ensures report relevance.',
      options: [
        { id: 'opt-1', label: '製造業', labelEn: 'Manufacturing', value: 'manufacturing' },
        { id: 'opt-2', label: '金融服務業', labelEn: 'Financial Services', value: 'financial' },
        { id: 'opt-3', label: '科技/資訊業', labelEn: 'Technology/IT', value: 'technology' },
        { id: 'opt-4', label: '能源/公用事業', labelEn: 'Energy/Utilities', value: 'energy' },
        { id: 'opt-5', label: '交通運輸', labelEn: 'Transportation', value: 'transportation' },
        { id: 'opt-6', label: '建築/營造', labelEn: 'Construction', value: 'construction' },
        { id: 'opt-7', label: '農林漁牧', labelEn: 'Agriculture/Forestry/Fishery', value: 'agriculture' },
        { id: 'opt-8', label: '醫療保健', labelEn: 'Healthcare', value: 'healthcare' },
        { id: 'opt-9', label: '零售/批發', labelEn: 'Retail/Wholesale', value: 'retail' },
        { id: 'opt-10', label: '其他', labelEn: 'Other', value: 'other' },
      ],
      required: true,
    },
    {
      id: 'cp-003',
      step: 'company-profile',
      order: 3,
      type: 'number',
      question: '請提供公司的員工總人數（全職）？',
      questionEn: 'Please provide total number of full-time employees?',
      explanation: '員工人數是報告中的重要指標，用於計算各項人均數據和判斷公司規模。',
      explanationEn: 'Employee count is a key metric for per-capita calculations and company size classification.',
      required: true,
      validation: { min: 1, max: 10000000 },
    },
    {
      id: 'cp-004',
      step: 'company-profile',
      order: 4,
      type: 'select',
      question: '報告涵蓋的時間範圍是？',
      questionEn: 'What is the reporting period?',
      explanation: '通常為一個完整的會計年度，確保數據時間範圍一致。',
      explanationEn: 'Typically a full fiscal year to ensure consistent data timeframe.',
      options: [
        { id: 'opt-1', label: '2024 年度 (1月-12月)', labelEn: 'FY2024 (Jan-Dec)', value: '2024' },
        { id: 'opt-2', label: '2025 年度 (1月-12月)', labelEn: 'FY2025 (Jan-Dec)', value: '2025' },
        { id: 'opt-3', label: '其他期間', labelEn: 'Other period', value: 'custom' },
      ],
      required: true,
    },
    {
      id: 'cp-005',
      step: 'company-profile',
      order: 5,
      type: 'multiselect',
      question: '報告涵蓋的營運邊界包含哪些？（可複選）',
      questionEn: 'Which operational boundaries does the report cover? (Multiple selection)',
      explanation: '界定報告邊界是 ESG 報告的重要步驟，確保資訊揭露的完整性。',
      explanationEn: 'Defining report boundaries is crucial for complete ESG disclosure.',
      options: [
        { id: 'opt-1', label: '總部/總公司', labelEn: 'Headquarters', value: 'hq' },
        { id: 'opt-2', label: '所有子公司', labelEn: 'All subsidiaries', value: 'subsidiaries' },
        { id: 'opt-3', label: '海外營運據點', labelEn: 'Overseas operations', value: 'overseas' },
        { id: 'opt-4', label: '供應商/價值鏈', labelEn: 'Suppliers/Value chain', value: 'supply-chain' },
        { id: 'opt-5', label: '合資企業', labelEn: 'Joint ventures', value: 'jv' },
      ],
      required: true,
    },
  ],
  'stakeholder-engagement': [
    {
      id: 'se-001',
      step: 'stakeholder-engagement',
      order: 1,
      type: 'multiselect',
      question: '您認為您公司的主要利害關係人有哪些？（可複選）',
      questionEn: 'Who are your primary stakeholders? (Multiple selection)',
      explanation: '利害關係人是指對公司決策和活動有影響或受影響的個人或羣體。正確識別有助於聚焦報告重點。',
      explanationEn: 'Stakeholders are individuals or groups affected by or able to influence company decisions.',
      options: [
        { id: 'opt-1', label: '股東/投資人', labelEn: 'Shareholders/Investors', value: 'investors' },
        { id: 'opt-2', label: '員工', labelEn: 'Employees', value: 'employees' },
        { id: 'opt-3', label: '客戶', labelEn: 'Customers', value: 'customers' },
        { id: 'opt-4', label: '供應商', labelEn: 'Suppliers', value: 'suppliers' },
        { id: 'opt-5', label: '社區/在地居民', labelEn: 'Communities', value: 'communities' },
        { id: 'opt-6', label: '政府/監管機構', labelEn: 'Government/Regulators', value: 'government' },
        { id: 'opt-7', label: '非政府組織 (NGO)', labelEn: 'NGOs', value: 'ngos' },
        { id: 'opt-8', label: '媒體', labelEn: 'Media', value: 'media' },
      ],
      required: true,
    },
    {
      id: 'se-002',
      step: 'stakeholder-engagement',
      order: 2,
      type: 'scale',
      question: '您公司與利害關係人的互動頻率如何？',
      questionEn: 'How frequently does your company engage with stakeholders?',
      explanation: '互動頻率反映了公司對利害關係人意見的重視程度，是 GRI 報告的重要指標。',
      explanationEn: 'Engagement frequency reflects how much the company values stakeholder input.',
      required: true,
      validation: { min: 1, max: 5 },
      options: [
        { id: '1', label: '極少/從未', labelEn: 'Rarely/Never', value: 1 },
        { id: '2', label: '偶爾', labelEn: 'Occasionally', value: 2 },
        { id: '3', label: '定期', labelEn: 'Regularly', value: 3 },
        { id: '4', label: '頻繁', labelEn: 'Frequently', value: 4 },
        { id: '5', label: '非常頻繁/持續性', labelEn: 'Very frequently/Continuous', value: 5 },
      ],
    },
    {
      id: 'se-003',
      step: 'stakeholder-engagement',
      order: 3,
      type: 'text',
      question: '請描述您公司收集利害關係人意見的主要管道？',
      questionEn: 'What are the main channels for collecting stakeholder feedback?',
      explanation: '常見的管道包括問卷調查、股東大會、客戶滿意度調查、員工座談會等。',
      explanationEn: 'Common channels include surveys, AGMs, customer satisfaction surveys, employee forums, etc.',
      placeholder: '例如：年度問卷調查、股東大會、客戶投訴熱線...',
      required: true,
    },
  ],
  'materiality-assessment': [
    {
      id: 'ma-001',
      step: 'materiality-assessment',
      order: 1,
      type: 'multiselect',
      question: '以下哪些 ESG 議題對您的公司最為重要？（選出前 5 項）',
      questionEn: 'Which ESG topics are most material to your company? (Select top 5)',
      explanation: '重大性評估幫助識別對公司和利害關係人最重要的議題，確保報告資源集中在最關鍵的領域。',
      explanationEn: 'Materiality assessment helps identify the most critical topics for focused reporting.',
      options: [
        { id: 'opt-1', label: '溫室氣體排放', labelEn: 'GHG Emissions', value: 'ghg-emissions' },
        { id: 'opt-2', label: '能源管理', labelEn: 'Energy Management', value: 'energy' },
        { id: 'opt-3', label: '水資源管理', labelEn: 'Water Management', value: 'water' },
        { id: 'opt-4', label: '廢棄物與循環經濟', labelEn: 'Waste & Circular Economy', value: 'waste' },
        { id: 'opt-5', label: '員工健康與安全', labelEn: 'Employee Health & Safety', value: 'ohs' },
        { id: 'opt-6', label: '人力發展與培訓', labelEn: 'Workforce Development', value: 'workforce' },
        { id: 'opt-7', label: '多元與包容', labelEn: 'Diversity & Inclusion', value: 'dei' },
        { id: 'opt-8', label: '供應鏈管理', labelEn: 'Supply Chain Management', value: 'supply-chain' },
        { id: 'opt-9', label: '客戶隱私與數據安全', labelEn: 'Customer Privacy & Data Security', value: 'privacy' },
        { id: 'opt-10', label: '公司治理', labelEn: 'Corporate Governance', value: 'governance' },
        { id: 'opt-11', label: '社區投資', labelEn: 'Community Investment', value: 'community' },
        { id: 'opt-12', label: '生物多樣性', labelEn: 'Biodiversity', value: 'biodiversity' },
      ],
      required: true,
    },
    {
      id: 'ma-002',
      step: 'materiality-assessment',
      order: 2,
      type: 'scale',
      question: '您的重大性評估是否經過外部驗證？',
      questionEn: 'Has your materiality assessment been externally verified?',
      explanation: '外部驗證增加報告可信度，GRI 標準鼓勵進行外部保證。',
      explanationEn: 'External verification increases report credibility. GRI encourages external assurance.',
      required: true,
      validation: { min: 1, max: 3 },
      options: [
        { id: '1', label: '無驗證', labelEn: 'No verification', value: 1 },
        { id: '2', label: '內部驗證', labelEn: 'Internal verification', value: 2 },
        { id: '3', label: '外部第三方驗證', labelEn: 'External third-party verification', value: 3 },
      ],
    },
  ],
  'data-collection': [
    {
      id: 'dc-001',
      step: 'data-collection',
      order: 1,
      type: 'boolean',
      question: '您是否已建立 ESG 數據收集系統？',
      questionEn: 'Have you established an ESG data collection system?',
      explanation: '有系統的數據收集是高品質報告的基礎。如果還沒有，我們可以幫助您建立。',
      explanationEn: 'Systematic data collection is the foundation of quality reporting.',
      required: true,
    },
    {
      id: 'dc-002',
      step: 'data-collection',
      order: 2,
      type: 'multiselect',
      question: '您目前已經擁有哪些 ESG 相關數據？（可複選）',
      questionEn: 'What ESG data do you currently have? (Multiple selection)',
      explanation: '瞭解現有數據狀態有助於規劃收集優先順序和時程。',
      explanationEn: 'Understanding current data status helps plan collection priorities and timeline.',
      options: [
        { id: 'opt-1', label: '碳排放數據（範疇 1, 2, 3）', labelEn: 'Carbon emissions data (Scope 1, 2, 3)', value: 'carbon' },
        { id: 'opt-2', label: '能源使用數據', labelEn: 'Energy consumption data', value: 'energy' },
        { id: 'opt-3', label: '水資源使用數據', labelEn: 'Water usage data', value: 'water' },
        { id: 'opt-4', label: '廢棄物與回收數據', labelEn: 'Waste & recycling data', value: 'waste' },
        { id: 'opt-5', label: '員工統計與多元化數據', labelEn: 'Employee statistics & diversity data', value: 'hr' },
        { id: 'opt-6', label: '公司治理相關文件', labelEn: 'Corporate governance documents', value: 'governance' },
        { id: 'opt-7', label: '供應鏈評估結果', labelEn: 'Supply chain assessment results', value: 'supply-chain' },
        { id: 'opt-8', label: '社區投資與公益活動記錄', labelEn: 'Community investment records', value: 'community' },
      ],
      required: true,
    },
    {
      id: 'dc-003',
      step: 'data-collection',
      order: 3,
      type: 'select',
      question: '您的數據收集主要使用什麼工具？',
      questionEn: 'What tools do you primarily use for data collection?',
      explanation: '合適的工具可以提高數據收集的效率和準確性。',
      explanationEn: 'Appropriate tools improve collection efficiency and accuracy.',
      options: [
        { id: 'opt-1', label: 'Excel/試算表', labelEn: 'Excel/Spreadsheets', value: 'excel' },
        { id: 'opt-2', label: '專門 ESG 軟體', labelEn: 'Dedicated ESG software', value: 'esg-software' },
        { id: 'opt-3', label: 'ERP 系統', labelEn: 'ERP system', value: 'erp' },
        { id: 'opt-4', label: '內部開發平臺', labelEn: 'Internal platform', value: 'internal' },
        { id: 'opt-5', label: '尚未系統化', labelEn: 'Not yet systematized', value: 'none' },
      ],
      required: true,
    },
  ],
  'report-writing': [
    {
      id: 'rw-001',
      step: 'report-writing',
      order: 1,
      type: 'select',
      question: '您希望報告的語言為？',
      questionEn: 'What language should the report be written in?',
      explanation: '報告語言影響內容生成方式和目標讀者。',
      explanationEn: 'Report language affects content generation approach and target audience.',
      options: [
        { id: 'opt-1', label: '繁體中文', labelEn: 'Traditional Chinese', value: 'zh-TW' },
        { id: 'opt-2', label: '簡體中文', labelEn: 'Simplified Chinese', value: 'zh-CN' },
        { id: 'opt-3', label: '英文', labelEn: 'English', value: 'en' },
        { id: 'opt-4', label: '中英文對照', labelEn: 'Bilingual (Chinese-English)', value: 'bilingual' },
      ],
      required: true,
    },
    {
      id: 'rw-002',
      step: 'report-writing',
      order: 2,
      type: 'select',
      question: '報告的預期頁數約為？',
      questionEn: 'What is the expected page count for the report?',
      explanation: '頁數規劃影響各章節的深度和廣度。',
      explanationEn: 'Page count planning affects depth and breadth of each chapter.',
      options: [
        { id: 'opt-1', label: '精簡版 (30頁以內)', labelEn: 'Concise (under 30 pages)', value: 'concise' },
        { id: 'opt-2', label: '標準版 (30-80頁)', labelEn: 'Standard (30-80 pages)', value: 'standard' },
        { id: 'opt-3', label: '詳細版 (80-150頁)', labelEn: 'Detailed (80-150 pages)', value: 'detailed' },
        { id: 'opt-4', label: '完整版 (150頁以上)', labelEn: 'Comprehensive (150+ pages)', value: 'comprehensive' },
      ],
      required: true,
    },
  ],
  'compliance-check': [
    {
      id: 'cc-001',
      step: 'compliance-check',
      order: 1,
      type: 'multiselect',
      question: '您的報告需要符合哪些標準？（可複選）',
      questionEn: 'Which standards must your report comply with? (Multiple selection)',
      explanation: '不同標準有不同的揭露要求，確保合規是報告發布前的關鍵步驟。',
      explanationEn: 'Different standards have different disclosure requirements. Ensuring compliance is critical before publication.',
      options: [
        { id: 'opt-1', label: 'GRI Standards', labelEn: 'GRI Standards', value: 'gri' },
        { id: 'opt-2', label: 'SASB Standards', labelEn: 'SASB Standards', value: 'sasb' },
        { id: 'opt-3', label: 'TCFD 架構', labelEn: 'TCFD Framework', value: 'tcfd' },
        { id: 'opt-4', label: 'ISSB (IFRS S1/S2)', labelEn: 'ISSB (IFRS S1/S2)', value: 'issb' },
        { id: 'opt-5', label: '金管會永續報告指引', labelEn: 'Financial Bureau Sustainability Guidelines', value: 'financial-bureau' },
      ],
      required: true,
    },
    {
      id: 'cc-002',
      step: 'compliance-check',
      order: 2,
      type: 'boolean',
      question: '報告是否已經過內部或外部保證/查證？',
      questionEn: 'Has the report undergone internal or external assurance?',
      explanation: '外部保證大幅提升報告可信度，是多數投資人和監管機構的要求。',
      explanationEn: 'External assurance significantly boosts credibility and is required by many investors and regulators.',
      required: true,
    },
  ],
  'final-review': [
    {
      id: 'fr-001',
      step: 'final-review',
      order: 1,
      type: 'boolean',
      question: '報告內容是否已經過董事會審查通過？',
      questionEn: 'Has the report content been reviewed and approved by the board?',
      explanation: '董事會審查是報告發布前的必要程序，確保資訊的準確性和完整性。',
      explanationEn: 'Board review is a necessary procedure before publication to ensure accuracy and completeness.',
      required: true,
    },
    {
      id: 'fr-002',
      step: 'final-review',
      order: 2,
      type: 'boolean',
      question: '所有數據是否都有來源佐證？',
      questionEn: 'Do all data points have source documentation?',
      explanation: '可溯源的數據是報告品質的核心指標，也是外部查證的基本要求。',
      explanationEn: 'Traceable data is a core quality metric and fundamental requirement for external verification.',
      required: true,
    },
    {
      id: 'fr-003',
      step: 'final-review',
      order: 3,
      type: 'select',
      question: '報告的發布方式？',
      questionEn: 'How will the report be published?',
      explanation: '選擇合適的發布管道可以最大化報告的影響力和觸及率。',
      explanationEn: 'Choosing appropriate distribution channels maximizes report impact and reach.',
      options: [
        { id: 'opt-1', label: '公司官網', labelEn: 'Company website', value: 'website' },
        { id: 'opt-2', label: '永續報告平臺', labelEn: 'Sustainability reporting platform', value: 'platform' },
        { id: 'opt-3', label: '紙本+電子同時發布', labelEn: 'Print + Digital', value: 'both' },
        { id: 'opt-4', label: '僅內部使用', labelEn: 'Internal use only', value: 'internal' },
      ],
      required: true,
    },
  ],
};

// ============================================================================
// Storage Layer (In-memory with interface for DB integration)
// ============================================================================

const sessionStore: Record<string, GuideSession> = {};
const companyStore: Record<string, CompanyGuideProfile> = {};

/** Company profile for guide context */
interface CompanyGuideProfile {
  id: string;
  name: string;
  industry: string;
  employees: number;
  reportType: ReportType;
  existingData: string[];
  complianceTargets: string[];
}

// ============================================================================
// AIGuide Class
// ============================================================================

/**
 * AI 對話引導系統主類
 * 
 * 提供完整的 ESG 報告撰寫引導流程，包含：
 * - 7 步驟漸進式引導
 * - 智能問題流程
 * - 答案管理與驗證
 * - 報告段落自動生成
 * - 智能建議引擎
 */
export class AIGuide {
  private config: GuideConfig;

  constructor() {
    this.config = {
      steps: GUIDE_STEPS,
      questionsPerStep: {
        'company-profile': STEP_QUESTIONS['company-profile'].length,
        'stakeholder-engagement': STEP_QUESTIONS['stakeholder-engagement'].length,
        'materiality-assessment': STEP_QUESTIONS['materiality-assessment'].length,
        'data-collection': STEP_QUESTIONS['data-collection'].length,
        'report-writing': STEP_QUESTIONS['report-writing'].length,
        'compliance-check': STEP_QUESTIONS['compliance-check'].length,
        'final-review': STEP_QUESTIONS['final-review'].length,
      },
      estimatedMinutesPerStep: {
        'company-profile': 15,
        'stakeholder-engagement': 20,
        'materiality-assessment': 25,
        'data-collection': 45,
        'report-writing': 60,
        'compliance-check': 20,
        'final-review': 15,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /**
   * 初始化引導會話
   * @param companyId - 公司 ID
   * @param reportType - 報告類型
   * @returns 新的引導會話
   */
  startGuide(companyId: string, reportType: ReportType): GuideSession {
    const sessionId = this.generateSessionId(companyId);
    const now = new Date().toISOString();

    const session: GuideSession = {
      id: sessionId,
      companyId,
      reportType,
      currentStep: 'company-profile',
      currentQuestionIndex: 0,
      status: 'active',
      startedAt: now,
      updatedAt: now,
      answers: [],
      conversationHistory: [
        {
          id: this.generateEntryId(),
          timestamp: now,
          type: 'system',
          content: '歡迎使用 ESG 報告 AI 引導系統！我將帶您一步步完成永續報告的撰寫。',
          contentEn: 'Welcome to the ESG Report AI Guide! I will walk you through writing your sustainability report step by step.',
          metadata: { reportType },
        },
        {
          id: this.generateEntryId(),
          timestamp: now,
          type: 'system',
          content: `您選擇的報告類型為：${this.getReportTypeName(reportType)}。讓我們從第一步「公司概覽與邊界設定」開始。`,
          contentEn: `Your selected report type: ${this.getReportTypeName(reportType)}. Let's start with Step 1: Company Profile & Boundary.`,
          metadata: { step: 'company-profile' },
        },
      ],
      metadata: {
        totalQuestions: this.getTotalQuestions(),
        answeredQuestions: 0,
        estimatedRemainingMinutes: this.getTotalEstimatedMinutes(),
        completionPercentage: 0,
      },
    };

    sessionStore[sessionId] = session;
    return session;
  }

  /**
   * 獲取下一個引導問題
   * @param sessionId - 會話 ID
   * @returns 下一個問題或完成狀態
   */
  getNextQuestion(sessionId: string): { question: GuideQuestion | null; isComplete: boolean; stepInfo: GuideStepConfig } {
    const session = sessionStore[sessionId];
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== 'active') {
      throw new Error(`Session is not active: ${session.status}`);
    }

    const stepQuestions = STEP_QUESTIONS[session.currentStep];
    const currentQuestion = stepQuestions[session.currentQuestionIndex];

    if (!currentQuestion) {
      // Move to next step or complete
      const nextStepResult = this.advanceStep(session);
      if (nextStepResult.isComplete) {
        return { question: null, isComplete: true, stepInfo: this.getStepConfig('final-review') };
      }
      return {
        question: STEP_QUESTIONS[session.currentStep][0],
        isComplete: false,
        stepInfo: this.getStepConfig(session.currentStep),
      };
    }

    // Add question to conversation history
    const entry: ConversationEntry = {
      id: this.generateEntryId(),
      timestamp: new Date().toISOString(),
      type: 'question',
      content: currentQuestion.question,
      contentEn: currentQuestion.questionEn,
      metadata: { questionId: currentQuestion.id, step: session.currentStep },
    };
    session.conversationHistory.push(entry);
    session.updatedAt = new Date().toISOString();

    return { question: currentQuestion, isComplete: false, stepInfo: this.getStepConfig(session.currentStep) };
  }

  /**
   * 提交答案並推進流程
   * @param sessionId - 會話 ID
   * @param questionId - 問題 ID
   * @param answer - 答案
   * @returns 更新後的會話狀態
   */
  submitAnswer(sessionId: string, questionId: string, answer: string | number | boolean | string[]): GuideSession {
    const session = sessionStore[sessionId];
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (session.status !== 'active') {
      throw new Error(`Session is not active: ${session.status}`);
    }

    // Validate answer
    const stepQuestions = STEP_QUESTIONS[session.currentStep];
    const currentQuestion = stepQuestions[session.currentQuestionIndex];

    if (!currentQuestion || currentQuestion.id !== questionId) {
      throw new Error(`Invalid question ID: ${questionId}. Expected: ${currentQuestion ? currentQuestion.id : 'unknown'}`);
    }

    this.validateAnswer(currentQuestion, answer);

    // Store answer
    const answerRecord: AnswerRecord = {
      questionId,
      answer,
      answeredAt: new Date().toISOString(),
    };
    session.answers.push(answerRecord);

    // Add to conversation history
    const answerEntry: ConversationEntry = {
      id: this.generateEntryId(),
      timestamp: new Date().toISOString(),
      type: 'answer',
      content: this.formatAnswer(answer, currentQuestion),
      contentEn: this.formatAnswer(answer, currentQuestion),
      metadata: { questionId },
    };
    session.conversationHistory.push(answerEntry);

    // Advance question index
    session.currentQuestionIndex++;
    session.metadata.answeredQuestions++;
    session.metadata.completionPercentage = Math.round(
      (session.metadata.answeredQuestions / session.metadata.totalQuestions) * 100
    );
    session.metadata.estimatedRemainingMinutes = this.calculateRemainingMinutes(session);

    // Check if step is complete
    if (session.currentQuestionIndex >= stepQuestions.length) {
      const advanceResult = this.advanceStep(session);
      if (!advanceResult.isComplete) {
        const nextStepInfo = this.getStepConfig(session.currentStep);
        const systemEntry: ConversationEntry = {
          id: this.generateEntryId(),
          timestamp: new Date().toISOString(),
          type: 'system',
          content: `步驟完成！進入下一步：${nextStepInfo.title}`,
          contentEn: `Step complete! Moving to: ${nextStepInfo.titleEn}`,
          metadata: { step: session.currentStep },
        };
        session.conversationHistory.push(systemEntry);
      }
    }

    session.updatedAt = new Date().toISOString();
    return session;
  }

  /**
   * 獲取完整對話歷史
   * @param sessionId - 會話 ID
   * @return 對話記錄陣列
   */
  getConversationHistory(sessionId: string): ConversationEntry[] {
    const session = sessionStore[sessionId];
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return [...session.conversationHistory];
  }

  /**
   * 根據引導答案自動生成報告段落
   * @param sessionId - 會話 ID
   * @param chapterNumber - 章節編號 (1-28)
   * @returns 報告段落
   */
  generateReportSection(sessionId: string, chapterNumber: number): ReportSection {
    const session = sessionStore[sessionId];
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (chapterNumber < 1 || chapterNumber > 28) {
      throw new Error(`Invalid chapter number: ${chapterNumber}. Must be 1-28.`);
    }

    const chapterTitle = this.getChapterTitle(chapterNumber);
    const relevantAnswers = this.getRelevantAnswers(session, chapterNumber);
    const content = this.generateChapterContent(chapterNumber, relevantAnswers);
    const compliance = this.calculateComplianceScore(session, chapterNumber);

    return {
      chapterNumber,
      chapterTitle: chapterTitle.zh,
      chapterTitleEn: chapterTitle.en,
      content,
      wordCount: content.length,
      dataQuality: this.assessDataQuality(relevantAnswers.length),
      compliance,
      suggestions: this.generateSuggestions(chapterNumber, relevantAnswers),
      references: this.getChapterReferences(chapterNumber),
    };
  }

  /**
   * 根據公司檔案提供智能建議
   * @param context - 上下文資訊
   * @returns 智能建議列表
   */
  getSmartSuggestions(context: {
    companyId?: string;
    step?: GuideStep;
    chapterNumber?: number;
    reportType?: ReportType;
  }): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const companyProfile = context.companyId ? companyStore[context.companyId] : undefined;

    // Step-based suggestions
    if (context.step) {
      suggestions.push(...this.getStepSuggestions(context.step, context.reportType));
    }

    // Chapter-based suggestions
    if (context.chapterNumber) {
      suggestions.push(...this.getChapterSuggestions(context.chapterNumber, companyProfile));
    }

    // Company-specific suggestions
    if (companyProfile) {
      suggestions.push(...this.getCompanySuggestions(companyProfile));
    }

    // General best practice suggestions
    suggestions.push(...this.getGeneralSuggestions(context.reportType));

    return suggestions.sort((a, b) => this.priorityWeight(b.priority) - this.priorityWeight(a.priority));
  }

  /**
   * 暫停會話
   */
  pauseSession(sessionId: string): GuideSession {
    const session = sessionStore[sessionId];
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    session.status = 'paused';
    session.updatedAt = new Date().toISOString();
    return session;
  }

  /**
   * 恢復會話
   */
  resumeSession(sessionId: string): GuideSession {
    const session = sessionStore[sessionId];
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    if (session.status !== 'paused') {
      throw new Error(`Session is not paused: ${session.status}`);
    }
    session.status = 'active';
    session.updatedAt = new Date().toISOString();
    return session;
  }

  /**
   * 獲取步驟列表
   */
  getSteps(): GuideStepConfig[] {
    return [...GUIDE_STEPS];
  }

  /**
   * 獲取配置
   */
  getConfig(): GuideConfig {
    return { ...this.config };
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private generateSessionId(companyId: string): string {
    return `guide-${companyId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private generateEntryId(): string {
    return `entry-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  private getReportTypeName(type: ReportType): string {
    const names: Record<ReportType, string> = {
      gri: 'GRI 永續報告',
      sasb: 'SASB 行業報告',
      tcfd: 'TCFD 氣候報告',
      issb: 'ISSB/IFRS S1 S2 報告',
      'esg-comprehensive': '綜合 ESG 報告',
      custom: '自訂報告',
    };
    return names[type];
  }

  private getTotalQuestions(): number {
    return Object.values(STEP_QUESTIONS).reduce((sum, qs) => sum + qs.length, 0);
  }

  private getTotalEstimatedMinutes(): number {
    return Object.values(this.config.estimatedMinutesPerStep).reduce((sum, m) => sum + m, 0);
  }

  private getStepConfig(step: GuideStep): GuideStepConfig {
    const config = GUIDE_STEPS.find(s => s.id === step);
    if (!config) throw new Error(`Invalid step: ${step}`);
    return config;
  }

  private advanceStep(session: GuideSession): { isComplete: boolean } {
    const currentStepIndex = GUIDE_STEPS.findIndex(s => s.id === session.currentStep);
    
    if (currentStepIndex >= GUIDE_STEPS.length - 1) {
      // All steps complete
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      session.metadata.completionPercentage = 100;
      
      session.conversationHistory.push({
        id: this.generateEntryId(),
        timestamp: new Date().toISOString(),
        type: 'system',
        content: '🎉 恭喜！您已完成所有引導步驟。現在可以開始生成報告了。',
        contentEn: '🎉 Congratulations! You have completed all guide steps. You can now generate your report.',
      });
      
      return { isComplete: true };
    }

    const nextStep = GUIDE_STEPS[currentStepIndex + 1];
    session.currentStep = nextStep.id;
    session.currentQuestionIndex = 0;

    return { isComplete: false };
  }

  private validateAnswer(question: GuideQuestion, answer: string | number | boolean | string[]): void {
    if (question.required && (answer === '' || answer === null || answer === undefined)) {
      throw new Error(`Question ${question.id} is required`);
    }

    if (question.validation) {
      const { validation } = question;
      
      if (typeof answer === 'string') {
        if (validation.minLength && answer.length < validation.minLength) {
          throw new Error(`Answer too short. Minimum: ${validation.minLength}`);
        }
        if (validation.maxLength && answer.length > validation.maxLength) {
          throw new Error(`Answer too long. Maximum: ${validation.maxLength}`);
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(answer)) {
          throw new Error(validation.patternMessage || 'Invalid format');
        }
      }

      if (typeof answer === 'number') {
        if (validation.min !== undefined && answer < validation.min) {
          throw new Error(`Value too small. Minimum: ${validation.min}`);
        }
        if (validation.max !== undefined && answer > validation.max) {
          throw new Error(`Value too large. Maximum: ${validation.max}`);
        }
      }
    }
  }

  private formatAnswer(answer: string | number | boolean | string[], question: GuideQuestion): string {
    if (question.type === 'boolean') {
      return answer ? '是 (Yes)' : '否 (No)';
    }
    if (question.type === 'multiselect' && Array.isArray(answer)) {
      return answer.join(', ');
    }
    return String(answer);
  }

  private calculateRemainingMinutes(session: GuideSession): number {
    const currentStepIndex = GUIDE_STEPS.findIndex(s => s.id === session.currentStep);
    let remaining = 0;

    // Remaining in current step
    const stepQuestions = STEP_QUESTIONS[session.currentStep];
    const remainingInStep = stepQuestions.length - session.currentQuestionIndex;
    const avgTimePerQuestion = this.config.estimatedMinutesPerStep[session.currentStep] / stepQuestions.length;
    remaining += remainingInStep * avgTimePerQuestion;

    // All remaining steps
    for (let i = currentStepIndex + 1; i < GUIDE_STEPS.length; i++) {
      remaining += this.config.estimatedMinutesPerStep[GUIDE_STEPS[i].id];
    }

    return Math.round(remaining);
  }

  private getChapterTitle(num: number): { zh: string; en: string } {
    const titles: Record<number, { zh: string; en: string }> = {
      1: { zh: '關於本報告', en: 'About This Report' },
      2: { zh: '公司簡介', en: 'Company Overview' },
      3: { zh: '治理結構', en: 'Governance Structure' },
      4: { zh: '利害關係人溝通', en: 'Stakeholder Communication' },
      5: { zh: '重大性分析', en: 'Materiality Analysis' },
      6: { zh: '永續發展策略', en: 'Sustainability Strategy' },
      7: { zh: '風險管理', en: 'Risk Management' },
      8: { zh: '經濟績效', en: 'Economic Performance' },
      9: { zh: '間接經濟影響', en: 'Indirect Economic Impacts' },
      10: { zh: '採購實務', en: 'Procurement Practices' },
      11: { zh: '環境政策與管理', en: 'Environmental Policy & Management' },
      12: { zh: '能源與氣候變遷', en: 'Energy & Climate Change' },
      13: { zh: '水資源管理', en: 'Water Management' },
      14: { zh: '廢棄物與污染防制', en: 'Waste & Pollution Prevention' },
      15: { zh: '生物多樣性', en: 'Biodiversity' },
      16: { zh: '員工組成與多元化', en: 'Workforce Composition & Diversity' },
      17: { zh: '職業安全衛生', en: 'Occupational Health & Safety' },
      18: { zh: '人才發展與留才', en: 'Talent Development & Retention' },
      19: { zh: '人權評估', en: 'Human Rights Assessment' },
      20: { zh: '社區投資', en: 'Community Investment' },
      21: { zh: '客戶關係管理', en: 'Customer Relationship Management' },
      22: { zh: '產品責任與品質', en: 'Product Responsibility & Quality' },
      23: { zh: '供應鏈永續管理', en: 'Sustainable Supply Chain Management' },
      24: { zh: '資訊安全與隱私保護', en: 'Information Security & Privacy' },
      25: { zh: '法規遵循', en: 'Regulatory Compliance' },
      26: { zh: '溫室氣體排放', en: 'Greenhouse Gas Emissions' },
      27: { zh: '氣候變遷風險與機會', en: 'Climate Change Risks & Opportunities' },
      28: { zh: '附錄與索引', en: 'Appendices & Index' },
    };
    return titles[num] || { zh: `第 ${num} 章`, en: `Chapter ${num}` };
  }

  private getRelevantAnswers(session: GuideSession, chapterNumber: number): AnswerRecord[] {
    // Map chapters to relevant question steps
    const chapterStepMap: Record<number, GuideStep[]> = {
      1: ['company-profile'],
      2: ['company-profile'],
      3: ['company-profile'],
      4: ['stakeholder-engagement'],
      5: ['materiality-assessment'],
      6: ['company-profile', 'materiality-assessment'],
      7: ['materiality-assessment'],
      8: ['company-profile'],
      9: ['company-profile', 'stakeholder-engagement'],
      10: ['company-profile', 'materiality-assessment'],
      11: ['materiality-assessment', 'data-collection'],
      12: ['materiality-assessment', 'data-collection'],
      13: ['materiality-assessment', 'data-collection'],
      14: ['materiality-assessment', 'data-collection'],
      15: ['materiality-assessment', 'data-collection'],
      16: ['company-profile', 'data-collection'],
      17: ['data-collection'],
      18: ['data-collection'],
      19: ['stakeholder-engagement', 'data-collection'],
      20: ['stakeholder-engagement', 'data-collection'],
      21: ['stakeholder-engagement', 'data-collection'],
      22: ['data-collection'],
      23: ['materiality-assessment', 'data-collection'],
      24: ['data-collection'],
      25: ['compliance-check'],
      26: ['data-collection'],
      27: ['materiality-assessment', 'data-collection'],
      28: ['compliance-check'],
    };

    const relevantSteps = chapterStepMap[chapterNumber] || [];
    return session.answers.filter(a => {
      const questionStep = Object.entries(STEP_QUESTIONS).find(([, qs]) =>
        qs.some(q => q.id === a.questionId)
      );
      return questionStep ? relevantSteps.includes(questionStep[0] as GuideStep) : false;
    });
  }

  private generateChapterContent(chapterNumber: number, answers: AnswerRecord[]): string {
    const title = this.getChapterTitle(chapterNumber);
    let content = `# ${title.zh}\n\n`;
    content += `## ${title.en}\n\n`;

    if (answers.length === 0) {
      content += `本章節尚未收集到相關數據。請完成引導系統中的相關問題以自動生成內容。\n\n`;
      content += `No relevant data collected yet. Please complete the relevant guide questions to auto-generate content.\n`;
      return content;
    }

    content += `本章節根據以下 ${answers.length} 個引導答案自動生成：\n\n`;
    content += `This chapter is auto-generated based on ${answers.length} guide answers:\n\n`;

    // Group answers by step for structured content
    const groupedAnswers = this.groupAnswersByStep(answers);
    for (const [step, stepAnswers] of Object.entries(groupedAnswers)) {
      const stepConfig = this.getStepConfig(step as GuideStep);
      content += `### ${stepConfig.title}\n\n`;
      for (const ans of stepAnswers) {
        content += `- ${ans.questionId}: ${JSON.stringify(ans.answer)}\n`;
      }
      content += '\n';
    }

    return content;
  }

  private groupAnswersByStep(answers: AnswerRecord[]): Record<string, AnswerRecord[]> {
    const grouped: Record<string, AnswerRecord[]> = {};
    for (const ans of answers) {
      const stepEntry = Object.entries(STEP_QUESTIONS).find(([, qs]) =>
        qs.some(q => q.id === ans.questionId)
      );
      const step = stepEntry ? stepEntry[0] : 'unknown';
      if (!grouped[step]) grouped[step] = [];
      grouped[step].push(ans);
    }
    return grouped;
  }

  private assessDataQuality(answerCount: number): 'high' | 'medium' | 'low' {
    if (answerCount >= 5) return 'high';
    if (answerCount >= 2) return 'medium';
    return 'low';
  }

  private calculateComplianceScore(session: GuideSession, _chapterNumber: number): ComplianceScore {
    const answerCount = session.answers.length;
    const totalQuestions = this.getTotalQuestions();
    const baseScore = Math.min(100, Math.round((answerCount / totalQuestions) * 100));

    return {
      gri: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
      sasb: Math.min(100, baseScore + Math.floor(Math.random() * 8)),
      tcfd: Math.min(100, baseScore + Math.floor(Math.random() * 12)),
      issb: Math.min(100, baseScore + Math.floor(Math.random() * 10)),
      financialBureau: Math.min(100, baseScore + Math.floor(Math.random() * 5)),
      overall: baseScore,
    };
  }

  private generateSuggestions(chapterNumber: number, answers: AnswerRecord[]): string[] {
    const suggestions: string[] = [];
    
    if (answers.length === 0) {
      suggestions.push('建議完成引導系統中的相關問題以獲得更好的報告內容');
      suggestions.push('可以參考 GRI Standards 的具體指引來補充本章節內容');
    } else if (answers.length < 3) {
      suggestions.push('目前收集的數據較少，建議補充更多佐證資料');
      suggestions.push('考慮增加量化數據和具體案例');
    } else {
      suggestions.push('數據收集良好，建議進行同儕覆核');
      suggestions.push('可以考慮添加圖表和視覺化呈現');
    }

    return suggestions;
  }

  private getChapterReferences(chapterNumber: number): string[] {
    const refs: string[] = [];
    
    if (chapterNumber <= 5) {
      refs.push('GRI 1: Foundation 2021');
      refs.push('GRI 2: General Disclosures 2021');
    }
    if (chapterNumber >= 11 && chapterNumber <= 15) {
      refs.push('GRI 3: Environmental Topics 2021');
    }
    if (chapterNumber >= 16 && chapterNumber <= 20) {
      refs.push('GRI 4: Social Topics 2021');
    }
    if (chapterNumber === 27) {
      refs.push('TCFD Recommendations');
      refs.push('IFRS S2 Climate-related Disclosures');
    }
    if (chapterNumber === 26) {
      refs.push('GRI 305: Emissions 2016');
      refs.push('GHG Protocol Corporate Standard');
    }

    return refs;
  }

  private getStepSuggestions(step: GuideStep, reportType?: ReportType): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (step === 'company-profile') {
      suggestions.push({
        id: 'sug-cp-1',
        category: 'data',
        priority: 'high',
        title: '準備公司基本資料',
        titleEn: 'Prepare company basic information',
        description: '建議提前準備好公司章程、股東結構、主要產品服務等基本資料，加速引導流程。',
        descriptionEn: 'Prepare articles of incorporation, shareholder structure, and main products/services in advance.',
        estimatedImpact: '節省 50% 引導時間',
        estimatedImpactEn: 'Save 50% guide time',
      });
    }

    if (step === 'stakeholder-engagement') {
      suggestions.push({
        id: 'sug-se-1',
        category: 'compliance',
        priority: 'high',
        title: 'GRI 403 職業安全衛生',
        titleEn: 'GRI 403 Occupational Health & Safety',
        description: '利害關係人溝通是 GRI 403 的核心要求，確保記錄所有溝通活動和回應。',
        descriptionEn: 'Stakeholder engagement is core to GRI 403. Ensure all communication activities are documented.',
        relatedQuestions: ['se-001', 'se-002', 'se-003'],
        estimatedImpact: '提升合規評分 15%',
        estimatedImpactEn: 'Improve compliance score by 15%',
      });
    }

    if (step === 'materiality-assessment') {
      suggestions.push({
        id: 'sug-ma-1',
        category: 'structure',
        priority: 'critical',
        title: '重大性評估需要利害關係人參與',
        titleEn: 'Materiality assessment requires stakeholder participation',
        description: 'GRI 3-1 要求重大性評估需包含利害關係人參與。建議在進行評估前先完成利害關係人鑑別。',
        descriptionEn: 'GRI 3-1 requires stakeholder participation in materiality assessment.',
        relatedQuestions: ['ma-001', 'ma-002'],
        estimatedImpact: '確保 GRI 合規性',
        estimatedImpactEn: 'Ensure GRI compliance',
      });
    }

    if (step === 'data-collection' && reportType === 'tcfd') {
      suggestions.push({
        id: 'sug-dc-tcfd',
        category: 'compliance',
        priority: 'critical',
        title: 'TCFD 需要情境分析數據',
        titleEn: 'TCFD requires scenario analysis data',
        description: 'TCFD 要求揭露氣候情境分析（1.5°C/2°C/3°C+），請確保已收集相關模擬數據。',
        descriptionEn: 'TCFD requires climate scenario analysis disclosure (1.5°C/2°C/3°C+).',
        estimatedImpact: 'TCFD 合規必要條件',
        estimatedImpactEn: 'Required for TCFD compliance',
      });
    }

    return suggestions;
  }

  private getChapterSuggestions(chapterNumber: number, _profile?: CompanyGuideProfile): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (chapterNumber === 26) {
      suggestions.push({
        id: 'sug-ch26-1',
        category: 'data',
        priority: 'critical',
        title: '溫室氣體盤查需符合 ISO 14064',
        titleEn: 'GHG inventory should comply with ISO 14064',
        description: '溫室氣體排放數據需要符合 ISO 14064 或 GHG Protocol 標準，並涵蓋三個範疇。',
        descriptionEn: 'GHG data must comply with ISO 14064 or GHG Protocol, covering all three scopes.',
        estimatedImpact: '提升數據可信度',
        estimatedImpactEn: 'Improve data credibility',
      });
    }

    if (chapterNumber === 27) {
      suggestions.push({
        id: 'sug-ch27-1',
        category: 'compliance',
        priority: 'high',
        title: 'TCFD 四大支柱',
        titleEn: 'TCFD Four Pillars',
        description: '確保涵蓋治理、策略、風險管理、指標與目標四大支柱。',
        descriptionEn: 'Ensure coverage of Governance, Strategy, Risk Management, Metrics & Targets.',
        estimatedImpact: '完整 TCFD 揭露',
        estimatedImpactEn: 'Complete TCFD disclosure',
      });
    }

    return suggestions;
  }

  private getCompanySuggestions(profile: CompanyGuideProfile): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];

    if (profile.employees > 500) {
      suggestions.push({
        id: `sug-company-${profile.id}-size`,
        category: 'structure',
        priority: 'medium',
        title: '大型企業建議設置專責永續單位',
        titleEn: 'Large enterprises should establish dedicated sustainability unit',
        description: '員工人數超過 500 人的公司建議設立獨立的永續發展委員會或專責單位。',
        descriptionEn: 'Companies with 500+ employees should establish a dedicated sustainability committee.',
        estimatedImpact: '提升治理評分',
        estimatedImpactEn: 'Improve governance score',
      });
    }

    if (profile.existingData.length < 3) {
      suggestions.push({
        id: `sug-company-${profile.id}-data`,
        category: 'data',
        priority: 'high',
        title: '建議建立系統化數據收集機制',
        titleEn: 'Recommend establishing systematic data collection',
        description: '目前現有數據較少，建議建立標準化的數據收集流程和工具。',
        descriptionEn: 'Limited existing data. Recommend establishing standardized collection processes.',
        estimatedImpact: '加速報告撰寫 30%',
        estimatedImpactEn: 'Accelerate report writing by 30%',
      });
    }

    return suggestions;
  }

  private getGeneralSuggestions(_reportType?: ReportType): SmartSuggestion[] {
    return [
      {
        id: 'sug-general-1',
        category: 'quality',
        priority: 'medium',
        title: '定期更新報告內容',
        titleEn: 'Regularly update report content',
        description: '建議每年定期檢視和更新報告內容，確保資訊的時效性和準確性。',
        descriptionEn: 'Review and update report content annually to ensure timeliness and accuracy.',
        estimatedImpact: '維持報告品質',
        estimatedImpactEn: 'Maintain report quality',
      },
      {
        id: 'sug-general-2',
        category: 'content',
        priority: 'low',
        title: '參考同業最佳實務',
        titleEn: 'Reference industry best practices',
        description: '可以參考同業或產業標竿企業的永續報告，學習其揭露方式和內容架構。',
        descriptionEn: 'Reference sustainability reports from industry peers for disclosure practices.',
        estimatedImpact: '提升報告可比性',
        estimatedImpactEn: 'Improve report comparability',
      },
    ];
  }

  private priorityWeight(priority: SmartSuggestion['priority']): number {
    const weights: Record<SmartSuggestion['priority'], number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return weights[priority];
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const aiGuide = new AIGuide();
export default AIGuide;
