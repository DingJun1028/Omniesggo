// Mock data sources for the report assembly engine
// In production, these would connect to the actual database

import type { CompanyProfile, QuestionBank, AnswerRecord, ChapterDefinition } from './types';

// ─── Company Profiles ────────────────────────────────────────────────────────

export const companyProfiles: CompanyProfile[] = [
  {
    id: 'comp-001',
    name: '臺灣積體電路製造股份有限公司',
    nameEn: 'Taiwan Semiconductor Manufacturing Company Limited',
    industry: '半導體製造業',
    industryEn: 'Semiconductor Manufacturing',
    capital: 2593000000000,
    employees: 73000,
    foundedYear: 1987,
    headquarters: '新竹市新竹科學工業園區',
    headquartersEn: 'Hsinchu Science Park, Hsinchu, Taiwan',
    website: 'https://www.tsmc.com',
    description: '全球規模最大的專業積體電路製造服務公司，為全球客戶提供先進的製程技術與設計服務。',
    descriptionEn: 'The world\'s largest dedicated independent semiconductor foundry, providing advanced process technology and design services.',
  },
  {
    id: 'comp-002',
    name: '鴻海精密工業股份有限公司',
    nameEn: 'Hon Hai Precision Industry Co., Ltd.',
    industry: '電子代工製造業',
    industryEn: 'Electronics Manufacturing Services',
    capital: 1423000000000,
    employees: 820000,
    foundedYear: 1974,
    headquarters: '新北市土城區',
    headquartersEn: 'Tucheng District, New Taipei City, Taiwan',
    website: 'https://www.foxconn.com',
    description: '全球最大的電子專業製造服務公司，為各大科技品牌提供完整的產品設計與製造解決方案。',
    descriptionEn: 'The world\'s largest electronics manufacturing services company, providing comprehensive product design and manufacturing solutions.',
  },
  {
    id: 'comp-003',
    name: '聯發科技股份有限公司',
    nameEn: 'MediaTek Inc.',
    industry: '半導體設計業',
    industryEn: 'Semiconductor IC Design',
    capital: 1650000000000,
    employees: 17000,
    foundedYear: 1997,
    headquarters: '新竹市新竹科學工業園區',
    headquartersEn: 'Hsinchu Science Park, Hsinchu, Taiwan',
    website: 'https://www.mediatek.com',
    description: '全球領先的IC設計公司，提供無線通訊、數位多媒體及人工智慧等領域的晶片解決方案。',
    descriptionEn: 'A leading global IC design company providing chip solutions for wireless communication, digital multimedia, and AI.',
  },
  {
    id: 'comp-004',
    name: '富邦媒體科技股份有限公司',
    nameEn: 'momo.com Inc.',
    industry: '網路零售業',
    industryEn: 'E-commerce / Online Retail',
    capital: 210000000000,
    employees: 3200,
    foundedYear: 2004,
    headquarters: '臺北市內湖區',
    headquartersEn: 'Neihu District, Taipei City, Taiwan',
    description: '臺灣領先的B2C電商平臺，提供多元商品與便捷的購物體驗。',
    descriptionEn: 'Taiwan\'s leading B2C e-commerce platform offering diverse products and convenient shopping experience.',
  },
  {
    id: 'comp-005',
    name: '中國信託商業銀行股份有限公司',
    nameEn: 'CTBC Bank Co., Ltd.',
    industry: '金融服務業',
    industryEn: 'Financial Services / Banking',
    capital: 2300000000000,
    employees: 28000,
    foundedYear: 1966,
    headquarters: '臺北市南港區',
    headquartersEn: 'Nangang District, Taipei City, Taiwan',
    website: 'https://www.ctbcbank.com',
    description: '臺灣最大的商業銀行之一，提供全方位金融服務與數位金融創新。',
    descriptionEn: 'One of Taiwan\'s largest commercial banks providing comprehensive financial services and digital innovation.',
  },
  {
    id: 'comp-006',
    name: '統一企業股份有限公司',
    nameEn: 'Uni-President Enterprises Corp.',
    industry: '食品製造業',
    industryEn: 'Food Manufacturing',
    capital: 570000000000,
    employees: 90000,
    foundedYear: 1967,
    headquarters: '臺南市永康區',
    headquartersEn: 'Yongkang District, Tainan City, Taiwan',
    description: '臺灣最大食品企業集團，涵蓋食品製造、零售、物流等多元事業版圖。',
    descriptionEn: 'Taiwan\'s largest food enterprise group covering food manufacturing, retail, and logistics.',
  },
  {
    id: 'comp-007',
    name: '臺達電子工業股份有限公司',
    nameEn: 'Delta Electronics, Inc.',
    industry: '電子零組件製造業',
    industryEn: 'Electronic Components Manufacturing',
    capital: 260000000000,
    employees: 85000,
    foundedYear: 1971,
    headquarters: '臺北市內湖區',
    headquartersEn: 'Neihu District, Taipei City, Taiwan',
    website: 'https://www.deltaww.com',
    description: '全球領先的電源管理與散熱解決方案供應商，積極推動節能環保技術。',
    descriptionEn: 'A global leader in power management and thermal solutions, actively promoting energy-saving technologies.',
  },
  {
    id: 'comp-008',
    name: '和碩聯合科技股份有限公司',
    nameEn: 'Pegatron Corporation',
    industry: '電腦及周邊設備製造業',
    industryEn: 'Computer and Peripheral Equipment',
    capital: 263000000000,
    employees: 60000,
    foundedYear: 2008,
    headquarters: '臺北市士林區',
    headquartersEn: 'Shilin District, Taipei City, Taiwan',
    description: '專業電子代工服務公司，為全球知名品牌提供設計、製造與組裝服務。',
    descriptionEn: 'Professional electronics design, manufacturing, and assembly services for global brands.',
  },
  {
    id: 'comp-009',
    name: '新光金控股份有限公司',
    nameEn: 'Shin Kong Financial Holding Co., Ltd.',
    industry: '金融控股業',
    industryEn: 'Financial Holding',
    capital: 1600000000000,
    employees: 18000,
    foundedYear: 2002,
    headquarters: '臺北市信義區',
    headquartersEn: 'Xinyi District, Taipei City, Taiwan',
    description: '臺灣主要金融控股公司，涵蓋銀行、保險、證券等多元金融業務。',
    descriptionEn: 'A major financial holding company in Taiwan covering banking, insurance, and securities.',
  },
  {
    id: 'comp-010',
    name: '緯創資通股份有限公司',
    nameEn: 'Wistron Corporation',
    industry: '電腦及周邊設備製造業',
    industryEn: 'Computer and Peripheral Equipment',
    capital: 290000000000,
    employees: 80000,
    foundedYear: 2001,
    headquarters: '臺北市士林區',
    headquartersEn: 'Shilin District, Taipei City, Taiwan',
    description: '專業資訊產品設計與製造服務公司，提供全方位的產品生命週期管理。',
    descriptionEn: 'Professional information product design and manufacturing services with full product lifecycle management.',
  },
];

// ─── Question Bank ───────────────────────────────────────────────────────────

export const questionBank: QuestionBank[] = [
  // Chapter 1: 組織與報告邊界
  { id: 'q1-01', chapter: 1, category: '組織概況', question: '請描述公司的主要業務與產品服務？', questionEn: 'Describe the company\'s main business and products/services?', answerType: 'text', required: true, order: 1 },
  { id: 'q1-02', chapter: 1, category: '組織概況', question: '公司總部位於何處？主要營運據點分佈？', questionEn: 'Where is the company headquartered? Main operating locations?', answerType: 'text', required: true, order: 2 },
  { id: 'q1-03', chapter: 1, category: '報告邊界', question: '本報告涵蓋的期間為何？', questionEn: 'What period does this report cover?', answerType: 'text', required: true, order: 3 },
  { id: 'q1-04', chapter: 1, category: '報告邊界', question: '本報告涵蓋的組織範圍？', questionEn: 'What is the organizational scope of this report?', answerType: 'text', required: true, order: 4 },
  { id: 'q1-05', chapter: 1, category: '組織概況', question: '員工人數與資本資訊？', questionEn: 'Employee count and capital information?', answerType: 'text', required: true, order: 5 },

  // Chapter 2: 治理與永續管理
  { id: 'q2-01', chapter: 2, category: '治理架構', question: '董事會結構與組成？', questionEn: 'Board structure and composition?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-102-18' },
  { id: 'q2-02', chapter: 2, category: '永續管理', question: '永續管理委員會或類似組織之設置情形？', questionEn: 'Sustainability committee or similar organization?', answerType: 'text', required: true, order: 2, griMapping: 'GRI-102-19' },
  { id: 'q2-03', chapter: 2, category: '永續管理', question: '永續發展目標與策略？', questionEn: 'Sustainability goals and strategies?', answerType: 'text', required: true, order: 3 },
  { id: 'q2-04', chapter: 2, category: '治理架構', question: '高階主管薪酬與績效考覈機制？', questionEn: 'Executive compensation and performance evaluation?', answerType: 'text', required: false, order: 4, griMapping: 'GRI-102-35' },
  { id: 'q2-05', chapter: 2, category: '風險管理', question: '風險管理架構與流程？', questionEn: 'Risk management framework and processes?', answerType: 'text', required: true, order: 5 },

  // Chapter 3: 重大性與利害關係人
  { id: 'q3-01', chapter: 3, category: '利害關係人', question: '主要利害關係人羣體識別？', questionEn: 'Key stakeholder identification?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-102-40' },
  { id: 'q3-02', chapter: 3, category: '重大性分析', question: '重大主題識別過程與結果？', questionEn: 'Material topic identification process and results?', answerType: 'text', required: true, order: 2, griMapping: 'GRI-102-46' },
  { id: 'q3-03', chapter: 3, category: '利害關係人', question: '利害關係人溝通機制與頻率？', questionEn: 'Stakeholder engagement mechanisms and frequency?', answerType: 'text', required: true, order: 3, griMapping: 'GRI-102-43' },
  { id: 'q3-04', chapter: 3, category: '重大性分析', question: '重大主題優先順序矩陣？', questionEn: 'Material topic priority matrix?', answerType: 'text', required: false, order: 4 },

  // Chapter 4: 環境管理
  { id: 'q4-01', chapter: 4, category: '環境政策', question: '環境政策與承諾？', questionEn: 'Environmental policy and commitments?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-103-2' },
  { id: 'q4-02', chapter: 4, category: '環境管理', question: '環境管理系統認證情形？', questionEn: 'Environmental management system certifications?', answerType: 'text', required: true, order: 2 },
  { id: 'q4-03', chapter: 4, category: '水資源', question: '水資源使用與管理策略？', questionEn: 'Water resource usage and management strategy?', answerType: 'text', required: true, order: 3, griMapping: 'GRI-303-3' },
  { id: 'q4-04', chapter: 4, category: '廢棄物', question: '廢棄物管理與回收措施？', questionEn: 'Waste management and recycling measures?', answerType: 'text', required: true, order: 4, griMapping: 'GRI-306-3' },
  { id: 'q4-05', chapter: 4, category: '生物多樣性', question: '生物多樣性保護措施？', questionEn: 'Biodiversity protection measures?', answerType: 'text', required: false, order: 5, griMapping: 'GRI-304-2' },

  // Chapter 5: 氣候與碳管理
  { id: 'q5-01', chapter: 5, category: '氣候策略', question: '氣候變遷治理策略？', questionEn: 'Climate change governance strategy?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-201-2' },
  { id: 'q5-02', chapter: 5, category: '碳排放', question: '溫室氣體排放量（範疇一、二、三）？', questionEn: 'GHG emissions (Scope 1, 2, 3)?', answerType: 'text', required: true, order: 2, griMapping: 'GRI-305-1' },
  { id: 'q5-03', chapter: 5, category: '碳排放', question: '減碳目標與路徑？', questionEn: 'Carbon reduction targets and pathways?', answerType: 'text', required: true, order: 3 },
  { id: 'q5-04', chapter: 5, category: '能源', question: '能源使用效率與再生能源比例？', questionEn: 'Energy efficiency and renewable energy ratio?', answerType: 'text', required: true, order: 4, griMapping: 'GRI-302-1' },
  { id: 'q5-05', chapter: 5, category: '氣候風險', question: 'TCFD氣候風險評估？', questionEn: 'TCFD climate risk assessment?', answerType: 'text', required: false, order: 5 },

  // Chapter 6: 員工與人才
  { id: 'q6-01', chapter: 6, category: '人力結構', question: '人力結構與多元化統計？', questionEn: 'Workforce structure and diversity statistics?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-102-8' },
  { id: 'q6-02', chapter: 6, category: '人才發展', question: '人才培訓與發展計畫？', questionEn: 'Talent training and development programs?', answerType: 'text', required: true, order: 2, griMapping: 'GRI-404-2' },
  { id: 'q6-03', chapter: 6, category: '薪酬福利', question: '薪酬與福利政策？', questionEn: 'Compensation and benefits policy?', answerType: 'text', required: true, order: 3, griMapping: 'GRI-401-2' },
  { id: 'q6-04', chapter: 6, category: '員工關係', question: '員工敬業度與流動率？', questionEn: 'Employee engagement and turnover rate?', answerType: 'text', required: true, order: 4, griMapping: 'GRI-401-1' },
  { id: 'q6-05', chapter: 6, category: '多元化', question: '性別平等與多元化指標？', questionEn: 'Gender equality and diversity indicators?', answerType: 'text', required: true, order: 5, griMapping: 'GRI-405-1' },

  // Chapter 7: 職安與健康
  { id: 'q7-01', chapter: 7, category: '職安管理', question: '職業安全衛生管理體系？', questionEn: 'Occupational health and safety management system?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-403-1' },
  { id: 'q7-02', chapter: 7, category: '職安績效', question: '職業災害統計與發生率？', questionEn: 'Occupational injury statistics and rates?', answerType: 'text', required: true, order: 2, griMapping: 'GRI-403-9' },
  { id: 'q7-03', chapter: 7, category: '健康促進', question: '員工健康促進計畫？', questionEn: 'Employee health promotion programs?', answerType: 'text', required: true, order: 3, griMapping: 'GRI-403-6' },
  { id: 'q7-04', chapter: 7, category: '職安訓練', question: '安全衛生訓練時數？', questionEn: 'Safety and health training hours?', answerType: 'text', required: false, order: 4, griMapping: 'GRI-403-5' },

  // Chapter 8: 人權與社會責任
  { id: 'q8-01', chapter: 8, category: '人權政策', question: '人權政策與承諾？', questionEn: 'Human rights policy and commitments?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-412-1' },
  { id: 'q8-02', chapter: 8, category: '勞動權益', question: '勞動權益保障措施？', questionEn: 'Labor rights protection measures?', answerType: 'text', required: true, order: 2 },
  { id: 'q8-03', chapter: 8, category: '社會參與', question: '社區投資與社會參與計畫？', questionEn: 'Community investment and social engagement programs?', answerType: 'text', required: true, order: 3, griMapping: 'GRI-413-1' },
  { id: 'q8-04', chapter: 8, category: '多元包容', question: '多元包容政策與實踐？', questionEn: 'Diversity and inclusion policy and practices?', answerType: 'text', required: false, order: 4 },

  // Chapter 9: 供應鏈管理
  { id: 'q9-01', chapter: 9, category: '供應商管理', question: '供應商評估與篩選機制？', questionEn: 'Supplier evaluation and screening mechanisms?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-308-1' },
  { id: 'q9-02', chapter: 9, category: '永續採購', question: '永續採購政策與佔比？', questionEn: 'Sustainable procurement policy and ratio?', answerType: 'text', required: true, order: 2 },
  { id: 'q9-03', chapter: 9, category: '供應鏈風險', question: '供應鏈風險評估與管理？', questionEn: 'Supply chain risk assessment and management?', answerType: 'text', required: true, order: 3 },
  { id: 'q9-04', chapter: 9, category: '供應商稽覈', question: '供應商稽覈頻率與結果？', questionEn: 'Supplier audit frequency and results?', answerType: 'text', required: false, order: 4, griMapping: 'GRI-308-2' },

  // Chapter 10: 產品責任與客戶
  { id: 'q10-01', chapter: 10, category: '產品品質', question: '產品品質管理與認證？', questionEn: 'Product quality management and certifications?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-416-1' },
  { id: 'q10-02', chapter: 10, category: '客戶服務', question: '客戶滿意度調查結果？', questionEn: 'Customer satisfaction survey results?', answerType: 'text', required: true, order: 2, griMapping: 'GRI-418-1' },
  { id: 'q10-03', chapter: 10, category: '資訊安全', question: '資訊安全與客戶隱私保護？', questionEn: 'Information security and customer privacy protection?', answerType: 'text', required: true, order: 3 },
  { id: 'q10-04', chapter: 10, category: '創新研發', question: '研發投入與創新成果？', questionEn: 'R&D investment and innovation achievements?', answerType: 'text', required: false, order: 4 },

  // Chapter 11: Impact與投資人敘事
  { id: 'q11-01', chapter: 11, category: '財務績效', question: '財務績效與股東回報？', questionEn: 'Financial performance and shareholder returns?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-201-1' },
  { id: 'q11-02', chapter: 11, category: 'ESG績效', question: 'ESG績效指標與排名？', questionEn: 'ESG performance indicators and rankings?', answerType: 'text', required: true, order: 2 },
  { id: 'q11-03', chapter: 11, category: '投資關係', question: '投資人關係與溝通？', questionEn: 'Investor relations and communication?', answerType: 'text', required: true, order: 3 },
  { id: 'q11-04', chapter: 11, category: '影響力', question: '社會影響力評估？', questionEn: 'Social impact assessment?', answerType: 'text', required: false, order: 4 },

  // Chapter 12: 查覈與資料治理
  { id: 'q12-01', chapter: 12, category: '外部查覈', question: '外部第三方查證情形？', questionEn: 'External third-party verification?', answerType: 'text', required: true, order: 1, griMapping: 'GRI-102-56' },
  { id: 'q12-02', chapter: 12, category: '資訊揭露', question: '資訊揭露品質與透明度？', questionEn: 'Information disclosure quality and transparency?', answerType: 'text', required: true, order: 2 },
  { id: 'q12-03', chapter: 12, category: '合規', question: '法規遵循情形？', questionEn: 'Regulatory compliance status?', answerType: 'text', required: true, order: 3 },
  { id: 'q12-04', chapter: 12, category: '資料治理', question: 'ESG資料治理與報告流程？', questionEn: 'ESG data governance and reporting processes?', answerType: 'text', required: true, order: 4 },
];

// ─── Answer Database (mock) ─────────────────────────────────────────────────

function generateMockAnswers(companyId: string): AnswerRecord[] {
  const answers: AnswerRecord[] = [];
  const now = new Date().toISOString();

  for (const q of questionBank) {
    let answer: string;

    switch (q.chapter) {
      case 1:
        if (q.id === 'q1-01') answer = '本公司專注於{{industry}}領域，主要產品涵蓋{{products}}，服務全球主要客戶。';
        else if (q.id === 'q1-02') answer = '公司總部位於{{headquarters}}，並於全球主要市場設有營運據點。';
        else if (q.id === 'q1-03') answer = '本報告涵蓋{{report_year}}年1月1日至12月31日之永續作為與績效資訊。';
        else if (q.id === 'q1-04') answer = '本報告涵蓋本公司{{company_name}}所有營運據點之資訊。';
        else answer = '本公司現有員工約{{employees}}人，實收資本額為{{capital}}。';
        break;
      case 2:
        if (q.id === 'q2-01') answer = '董事會由{{board_members}}名董事組成，包含{{independent_count}}名獨立董事，並設有審計委員會、薪酬委員會及永續發展委員會。';
        else if (q.id === 'q2-02') answer = '本公司設有永續發展委員會，由董事長擔任主任委員，每季召開會議檢視永續議題執行情形。';
        else if (q.id === 'q2-03') answer = '本公司以「{{sustainability_vision}}」為永續願景，設定短中長期目標並定期追蹤。';
        else if (q.id === 'q2-04') answer = '高階主管薪酬與公司績效、個人表現及永續目標達成率掛鉤，並經薪酬委員會審議後提報董事會。';
        else answer = '本公司建立完整風險管理架構，由董事會監督，管理層執行，涵蓋策略、營運、財務及合規風險。';
        break;
      case 3:
        if (q.id === 'q3-01') answer = '透過系統性分析，本公司識別出{{stakeholder_groups}}等{{stakeholder_count}}類主要利害關係人羣體。';
        else if (q.id === 'q3-02') answer = '本公司依GRI準則進行重大性分析，透過{{materiality_process}}流程，識別出{{material_topics}}項重大主題。';
        else if (q.id === 'q3-03') answer = '本公司透過多元管道與利害關係人溝通，包括{{engagement_channels}}，溝通頻率依需求調整。';
        else answer = '重大主題優先順序以利害關係人關注度及公司影響程度兩個構面進行評估，形成重大性矩陣。';
        break;
      case 4:
        if (q.id === 'q4-01') answer = '本公司承諾遵守環保法規，推動環境永續，以「{{environmental_policy}}」為核心環境政策。';
        else if (q.id === 'q4-02') answer = '本公司已取得ISO 14001環境管理系統認證，並持續改善環境績效。';
        else if (q.id === 'q4-03') answer = '水資源管理策略包括{{water_strategy}}，{{report_year}}年用水量為{{water_usage}}立方公尺。';
        else if (q.id === 'q4-04') answer = '廢棄物管理以減量、回收、再利用為目標，{{report_year}}年廢棄物回收率達{{recycling_rate}}%。';
        else answer = '本公司重視生物多樣性保護，透過{{biodiversity_actions}}等措施降低生態衝擊。';
        break;
      case 5:
        if (q.id === 'q5-01') answer = '本公司將氣候變遷視為重大風險與機會，制定{{climate_strategy}}氣候策略。';
        else if (q.id === 'q5-02') answer = '{{report_year}}年溫室氣體排放量：範疇一{{ghg_scope1}}公噸CO2e、範疇二{{ghg_scope2}}公噸CO2e、範疇三{{ghg_scope3}}公噸CO2e。';
        else if (q.id === 'q5-03') answer = '設定{{carbon_target}}年較基準年減碳{{carbon_reduction}}%之目標，並制定具體減碳路徑。';
        else if (q.id === 'q5-04') answer = '{{report_year}}年總能耗為{{energy_total}}GJ，再生能源佔比達{{renewable_ratio}}%。';
        else answer = '本公司依TCFD框架進行氣候風險評估，識別出{{climate_risks}}項主要風險。';
        break;
      case 6:
        if (q.id === 'q6-01') answer = '本公司員工總數{{employees}}人，其中女性佔比{{female_ratio}}%，管理層女性佔比{{female_mgmt_ratio}}%。';
        else if (q.id === 'q6-02') answer = '{{report_year}}年每人平均訓練時數達{{training_hours}}小時，涵蓋{{training_programs}}等課程。';
        else if (q.id === 'q6-03') answer = '提供具競爭力的薪酬福利，包括{{benefits}}等福利措施。';
        else if (q.id === 'q6-04') answer = '{{report_year}}年員工流動率為{{turnover_rate}}%，敬業度調查得分{{engagement_score}}分。';
        else answer = '本公司重視性別平等，女性員工佔比{{female_ratio}}%，並持續推動職場平權。';
        break;
      case 7:
        if (q.id === 'q7-01') answer = '本公司建立ISO 45001職業安全衛生管理系統，透過{{ohs_practices}}確保工作場所安全。';
        else if (q.id === 'q7-02') answer = '{{report_year}}年職業災害發生率為{{injury_rate}}，無重大職災事件。';
        else if (q.id === 'q7-03') answer = '推動{{health_programs}}等員工健康促進計畫，照顧員工身心健康。';
        else answer = '{{report_year}}年安全衛生訓練總時數達{{safety_training_hours}}小時。';
        break;
      case 8:
        if (q.id === 'q8-01') answer = '本公司承諾遵循國際人權公約，制定{{human_rights_policy}}人權政策。';
        else if (q.id === 'q8-02') answer = '保障勞動權益，包括{{labor_protections}}等措施，確保勞動條件符合法規。';
        else if (q.id === 'q8-03') answer = '{{report_year}}年社區投資金額達{{community_investment}}元，投入{{community_programs}}等計畫。';
        else answer = '推動多元包容政策，透過{{diversity_initiatives}}營造友善職場環境。';
        break;
      case 9:
        if (q.id === 'q9-01') answer = '本公司建立供應商評估機制，涵蓋{{supplier_criteria}}等面向，{{report_year}}年評估家數達{{supplier_count}}家。';
        else if (q.id === 'q9-02') answer = '永續採購政策要求供應商符合{{sustainable_procurement_criteria}}，{{report_year}}年永續採購佔比達{{sustainable_procurement_ratio}}%。';
        else if (q.id === 'q9-03') answer = '定期進行供應鏈風險評估，識別{{supply_risks}}等風險因子，並制定緩解措施。';
        else answer = '{{report_year}}年供應商稽覈次數達{{audit_count}}次，稽覈合格率為{{audit_pass_rate}}%。';
        break;
      case 10:
        if (q.id === 'q10-01') answer = '產品品質管理通過{{quality_certifications}}認證，確保產品符合國際標準。';
        else if (q.id === 'q10-02') answer = '{{report_year}}年客戶滿意度調查結果為{{satisfaction_score}}分（滿分5分）。';
        else if (q.id === 'q10-03') answer = '建立資訊安全管理系統（ISO 27001），保護客戶隱私與資料安全。';
        else answer = '{{report_year}}年研發投入金額達{{rd_investment}}元，取得{{patents_count}}項專利。';
        break;
      case 11:
        if (q.id === 'q11-01') answer = '{{report_year}}年合併營收為{{revenue}}元，稅後淨利{{net_income}}元，EPS為{{eps}}元。';
        else if (q.id === 'q11-02') answer = '本公司ESG績效獲{{esg_rating}}評級，在{{esg_ranking}}排名中表現優異。';
        else if (q.id === 'q11-03') answer = '透過{{ir_activities}}等方式與投資人保持密切溝通，維護良好投資人關係。';
        else answer = '本公司完成{{impact_assessments}}項社會影響力評估，量化社會價值創造。';
        break;
      case 12:
        if (q.id === 'q12-01') answer = '本報告經{{verifier}}第三方機構查證，採用{{verification_standard}}標準進行有限確信。';
        else if (q.id === 'q12-02') answer = '本公司重視資訊揭露品質，依GRI準則及當地法規編製報告，確保資訊透明可靠。';
        else if (q.id === 'q12-03') answer = '{{report_year}}年無重大違規事件，所有營運活動均符合相關法規要求。';
        else answer = '建立ESG資料治理流程，由{{data_owner}}負責資料品質，定期進行內部查覈。';
        break;
      default:
        answer = '本公司持續推動相關作為，{{report_year}}年已有具體成果。';
    }

    answers.push({
      id: `${companyId}-${q.id}`,
      companyId,
      questionId: q.id,
      answer,
      answeredAt: now,
      verified: true,
    });
  }

  return answers;
}

// ─── Chapter Definitions ─────────────────────────────────────────────────────

export const chapterDefinitions: ChapterDefinition[] = [
  {
    number: 1,
    title: '組織與報告邊界',
    titleEn: 'Organization & Report Boundaries',
    description: '本章節說明公司組織架構、主要業務範圍、以及本永續報告之涵蓋邊界。',
    descriptionEn: 'This chapter describes the organizational structure, main business scope, and reporting boundaries.',
    griStandards: ['GRI-102-1', 'GRI-102-2', 'GRI-102-3', 'GRI-102-4', 'GRI-102-5'],
    requiredAnswers: ['q1-01', 'q1-02', 'q1-03', 'q1-04', 'q1-05'],
  },
  {
    number: 2,
    title: '治理與永續管理',
    titleEn: 'Governance & Sustainability Management',
    description: '本章節說明公司治理架構、永續管理機制、風險管理與高階主管薪酬政策。',
    descriptionEn: 'This chapter covers governance structure, sustainability management mechanisms, risk management, and executive compensation.',
    griStandards: ['GRI-102-18', 'GRI-102-19', 'GRI-102-20', 'GRI-102-35'],
    requiredAnswers: ['q2-01', 'q2-02', 'q2-03', 'q2-04', 'q2-05'],
  },
  {
    number: 3,
    title: '重大性與利害關係人',
    titleEn: 'Materiality & Stakeholder Engagement',
    description: '本章節說明利害關係人識別、溝通機制、重大性分析過程與重大主題。',
    descriptionEn: 'This chapter covers stakeholder identification, engagement mechanisms, materiality analysis, and material topics.',
    griStandards: ['GRI-102-40', 'GRI-102-42', 'GRI-102-43', 'GRI-102-44', 'GRI-102-46'],
    requiredAnswers: ['q3-01', 'q3-02', 'q3-03', 'q3-04'],
  },
  {
    number: 4,
    title: '環境管理',
    titleEn: 'Environmental Management',
    description: '本章節說明環境政策、管理系統、水資源、廢棄物及生物多樣性管理。',
    descriptionEn: 'This chapter covers environmental policy, management systems, water resources, waste, and biodiversity.',
    griStandards: ['GRI-302', 'GRI-303', 'GRI-304', 'GRI-306'],
    requiredAnswers: ['q4-01', 'q4-02', 'q4-03', 'q4-04', 'q4-05'],
  },
  {
    number: 5,
    title: '氣候與碳管理',
    titleEn: 'Climate & Carbon Management',
    description: '本章節說明氣候策略、溫室氣體排放、減碳目標、能源管理及TCFD風險評估。',
    descriptionEn: 'This chapter covers climate strategy, GHG emissions, carbon reduction targets, energy management, and TCFD.',
    griStandards: ['GRI-201-2', 'GRI-302-1', 'GRI-305-1', 'GRI-305-2', 'GRI-305-3'],
    requiredAnswers: ['q5-01', 'q5-02', 'q5-03', 'q5-04', 'q5-05'],
  },
  {
    number: 6,
    title: '員工與人才',
    titleEn: 'Workforce & Talent',
    description: '本章節說明人力結構、人才發展、薪酬福利、員工關係與多元化。',
    descriptionEn: 'This chapter covers workforce structure, talent development, compensation, employee relations, and diversity.',
    griStandards: ['GRI-102-8', 'GRI-401-1', 'GRI-401-2', 'GRI-404-2', 'GRI-405-1'],
    requiredAnswers: ['q6-01', 'q6-02', 'q6-03', 'q6-04', 'q6-05'],
  },
  {
    number: 7,
    title: '職安與健康',
    titleEn: 'Occupational Safety & Health',
    description: '本章節說明職安管理體系、災害統計、健康促進及安全訓練。',
    descriptionEn: 'This chapter covers OHS management system, injury statistics, health promotion, and safety training.',
    griStandards: ['GRI-403-1', 'GRI-403-5', 'GRI-403-6', 'GRI-403-9'],
    requiredAnswers: ['q7-01', 'q7-02', 'q7-03', 'q7-04'],
  },
  {
    number: 8,
    title: '人權與社會責任',
    titleEn: 'Human Rights & Social Responsibility',
    description: '本章節說明人權政策、勞動權益、社區參與及多元包容。',
    descriptionEn: 'This chapter covers human rights policy, labor rights, community engagement, and diversity & inclusion.',
    griStandards: ['GRI-412-1', 'GRI-413-1', 'GRI-405-2'],
    requiredAnswers: ['q8-01', 'q8-02', 'q8-03', 'q8-04'],
  },
  {
    number: 9,
    title: '供應鏈管理',
    titleEn: 'Supply Chain Management',
    description: '本章節說明供應商管理、永續採購、供應鏈風險及供應商稽覈。',
    descriptionEn: 'This chapter covers supplier management, sustainable procurement, supply chain risk, and supplier audits.',
    griStandards: ['GRI-308-1', 'GRI-308-2', 'GRI-414-1', 'GRI-414-2'],
    requiredAnswers: ['q9-01', 'q9-02', 'q9-03', 'q9-04'],
  },
  {
    number: 10,
    title: '產品責任與客戶',
    titleEn: 'Product Responsibility & Customers',
    description: '本章節說明產品品質、客戶滿意度、資訊安全及研發創新。',
    descriptionEn: 'This chapter covers product quality, customer satisfaction, information security, and R&D innovation.',
    griStandards: ['GRI-416-1', 'GRI-416-2', 'GRI-418-1'],
    requiredAnswers: ['q10-01', 'q10-02', 'q10-03', 'q10-04'],
  },
  {
    number: 11,
    title: 'Impact與投資人敘事',
    titleEn: 'Impact & Investor Narrative',
    description: '本章節說明財務績效、ESG績效、投資人及社會影響力。',
    descriptionEn: 'This chapter covers financial performance, ESG performance, investor relations, and social impact.',
    griStandards: ['GRI-201-1', 'GRI-201-3', 'GRI-201-4'],
    requiredAnswers: ['q11-01', 'q11-02', 'q11-03', 'q11-04'],
  },
  {
    number: 12,
    title: '查覈與資料治理',
    titleEn: 'Verification & Data Governance',
    description: '本章節說明外部查證、資訊揭露、法規遵循及ESG資料治理。',
    descriptionEn: 'This chapter covers external verification, disclosure quality, regulatory compliance, and ESG data governance.',
    griStandards: ['GRI-102-56', 'GRI-103-1', 'GRI-103-2'],
    requiredAnswers: ['q12-01', 'q12-02', 'q12-03', 'q12-04'],
  },
];

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getCompanyById(id: string): CompanyProfile | undefined {
  for (let i = 0; i < companyProfiles.length; i++) {
    if (companyProfiles[i].id === id) return companyProfiles[i];
  }
  return undefined;
}

export function getQuestionsByChapter(chapter: number): QuestionBank[] {
  return questionBank.filter(q => q.chapter === chapter).sort((a, b) => a.order - b.order);
}

export function getAnswersForCompany(companyId: string): AnswerRecord[] {
  return generateMockAnswers(companyId);
}

export function getChapterDefinition(chapter: number): ChapterDefinition | undefined {
  for (let i = 0; i < chapterDefinitions.length; i++) {
    if (chapterDefinitions[i].number === chapter) return chapterDefinitions[i];
  }
  return undefined;
}
