/**
 * Company Profiles — extracted from ESG Excel (01_10家公司Profile)
 * Auto-generated: 2026-06-24
 */

export interface CompanyProfile {
  /** 實例ID */
  instanceId: string;
  /** 產業類型 */
  industryType: string;
  /** 公司名稱 */
  companyName: string;
  /** 簡稱 */
  shortName: string;
  /** 規模 */
  scale: string;
  /** 員工數 */
  employees: number;
  /** 年度營收（新臺幣，含單位字串） */
  annualRevenue: string;
  /** 營運據點 */
  operatingLocations: string;
  /** 主要業務 */
  mainBusiness: string;
  /** 能源使用 */
  energyUsage: string;
  /** 用電量（kWh） */
  electricityKwh: number;
  /** 用水量（噸） */
  waterTons: number;
  /** 廢棄物（噸） */
  wasteTons: number;
  /** Scope 1 碳排放（tCO2e） */
  scope1Tco2e: number;
  /** Scope 2 碳排放（tCO2e） */
  scope2Tco2e: number;
  /** Scope 3 概況描述 */
  scope3Overview: string;
  /** 對應 SDGs */
  sdgs: string;
  /** Impact 重點 */
  impactFocus: string;
  /** 建議佐證 */
  suggestedEvidence: string;
}

export const COMPANIES: CompanyProfile[] = [
  {
    instanceId: 'DEMO-01',
    industryType: '半導體製造',
    companyName: '晶嶽半導體股份有限公司',
    shortName: '晶嶽半導體',
    scale: '中大型企業',
    employees: 860,
    annualRevenue: '新臺幣42.5億元',
    operatingLocations: '新竹科學園區、臺南封測廠',
    mainBusiness: '半導體封裝、測試、可靠度驗證與先進封裝模組製造',
    energyUsage: '高',
    electricityKwh: 18500000,
    waterTons: 132000,
    wasteTons: 510,
    scope1Tco2e: 1250,
    scope2Tco2e: 9280,
    scope3Overview: '供應鏈運輸與材料採購為主，尚在盤點中',
    sdgs: 'SDG 7、8、9、12、13',
    impactFocus: '透過節能製程與良率提升，降低單位產品能耗並強化高科技供應鏈韌性',
    suggestedEvidence: '電費單、用水明細、ISO 14001證書、節能專案紀錄、供應商稽覈表',
  },
  {
    instanceId: 'DEMO-02',
    industryType: '金融服務',
    companyName: '和盛商業銀行股份有限公司',
    shortName: '和盛銀行',
    scale: '大型服務業',
    employees: 3200,
    annualRevenue: '新臺幣128億元',
    operatingLocations: '臺北總行及全臺86間分行',
    mainBusiness: '企業金融、個人金融、財富管理、數位銀行與信用卡服務',
    energyUsage: '中',
    electricityKwh: 9200000,
    waterTons: 75000,
    wasteTons: 95,
    scope1Tco2e: 410,
    scope2Tco2e: 4620,
    scope3Overview: '投融資組合與商務差旅為主要範疇，已啟動初步分類',
    sdgs: 'SDG 8、9、10、13、16',
    impactFocus: '透過永續金融商品與中小企業授信服務，支持低碳轉型與金融普惠',
    suggestedEvidence: '分行用電彙總、綠色授信清單、董事會紀錄、資訊安全政策、公益金融專案報告',
  },
  {
    instanceId: 'DEMO-03',
    industryType: '電商平臺',
    companyName: '雲市集電商股份有限公司',
    shortName: '雲市集',
    scale: '成長型企業',
    employees: 420,
    annualRevenue: '新臺幣18.6億元',
    operatingLocations: '臺北總部、桃園物流中心',
    mainBusiness: '線上零售平臺、會員經營、數位行銷與第三方賣家服務',
    energyUsage: '中',
    electricityKwh: 3100000,
    waterTons: 22000,
    wasteTons: 260,
    scope1Tco2e: 180,
    scope2Tco2e: 1550,
    scope3Overview: '包材、物流配送與平臺商家商品為主要影響來源',
    sdgs: 'SDG 8、9、12、13',
    impactFocus: '推動包材減量、綠色物流與平臺賣家永續教育，降低消費端環境負荷',
    suggestedEvidence: '物流數據、包材採購紀錄、倉儲用電、賣家培訓名單、客戶滿意度調查',
  },
  {
    instanceId: 'DEMO-04',
    industryType: '食品製造',
    companyName: '田禾食品工業股份有限公司',
    shortName: '田禾食品',
    scale: '中型製造業',
    employees: 560,
    annualRevenue: '新臺幣24.2億元',
    operatingLocations: '臺中大里廠、雲林加工廠',
    mainBusiness: '穀物、即食食品、醬料與冷藏食品製造與銷售',
    energyUsage: '中高',
    electricityKwh: 6800000,
    waterTons: 188000,
    wasteTons: 740,
    scope1Tco2e: 980,
    scope2Tco2e: 3410,
    scope3Overview: '農產品原料、冷鏈物流與包材為主要來源',
    sdgs: 'SDG 2、3、8、12、13',
    impactFocus: '透過食安管理、在地採購與包材減量，提升食品安全與低碳供應鏈表現',
    suggestedEvidence: '水費單、食安檢驗紀錄、供應商名冊、包材減量專案、廢棄物清運單',
  },
  {
    instanceId: 'DEMO-05',
    industryType: '醫療器材',
    companyName: '安序醫材科技股份有限公司',
    shortName: '安序醫材',
    scale: '成長型製造業',
    employees: 310,
    annualRevenue: '新臺幣9.8億元',
    operatingLocations: '新北汐止研發總部、桃園製造廠',
    mainBusiness: '醫療器材研發、製造、品質驗證與醫療院所通路服務',
    energyUsage: '中',
    electricityKwh: 2450000,
    waterTons: 16000,
    wasteTons: 62,
    scope1Tco2e: 90,
    scope2Tco2e: 1230,
    scope3Overview: '醫材原料、包裝與醫院通路物流為主',
    sdgs: 'SDG 3、8、9、12、13',
    impactFocus: '透過高品質醫療器材降低醫療風險，並推動產品安全與合規管理',
    suggestedEvidence: 'ISO 13485證書、品質驗證報告、用電彙總、產品召回流程、醫院回饋紀錄',
  },
  {
    instanceId: 'DEMO-06',
    industryType: '傳統金屬製造',
    companyName: '信昌精密工業股份有限公司',
    shortName: '信昌精密',
    scale: '中型製造業',
    employees: 690,
    annualRevenue: '新臺幣31.4億元',
    operatingLocations: '彰化總廠、越南協力加工廠',
    mainBusiness: '金屬零組件加工、表面處理、機械設備零件製造',
    energyUsage: '高',
    electricityKwh: 11800000,
    waterTons: 94000,
    wasteTons: 1200,
    scope1Tco2e: 1450,
    scope2Tco2e: 5920,
    scope3Overview: '鋼材採購、外包加工與運輸為主',
    sdgs: 'SDG 8、9、12、13',
    impactFocus: '以製程改善、回收金屬與工安訓練降低傳統製造的環境與職安風險',
    suggestedEvidence: '電費單、原物料採購紀錄、廢棄物清運單、職安訓練紀錄、工廠稽覈表',
  },
  {
    instanceId: 'DEMO-07',
    industryType: 'SaaS新創',
    companyName: '曜點雲端科技股份有限公司',
    shortName: '曜點雲端',
    scale: '新創企業',
    employees: 86,
    annualRevenue: '新臺幣1.7億元',
    operatingLocations: '臺北共同辦公室、遠端團隊',
    mainBusiness: '企業SaaS系統、資料分析服務與AI營運工具',
    energyUsage: '低',
    electricityKwh: 360000,
    waterTons: 1800,
    wasteTons: 8,
    scope1Tco2e: 12,
    scope2Tco2e: 180,
    scope3Overview: '雲端服務、員工通勤與商務差旅為主',
    sdgs: 'SDG 8、9、13',
    impactFocus: '以數位工具提升中小企業營運效率，並透過遠距工作降低通勤與辦公資源需求',
    suggestedEvidence: '雲端服務帳單、辦公室租賃資料、員工遠距政策、客戶案例、資安政策',
  },
  {
    instanceId: 'DEMO-08',
    industryType: '社會企業',
    companyName: '共好循環社會企業股份有限公司',
    shortName: '共好循環',
    scale: '社會創新組織',
    employees: 48,
    annualRevenue: '新臺幣0.9億元',
    operatingLocations: '臺北辦公室、北中南合作社區據點',
    mainBusiness: '循環包材服務、弱勢就業培力與社區回收教育',
    energyUsage: '低',
    electricityKwh: 210000,
    waterTons: 2300,
    wasteTons: 120,
    scope1Tco2e: 25,
    scope2Tco2e: 105,
    scope3Overview: '回收物流與合作場域為主，但因循環替代產生正向減量效益',
    sdgs: 'SDG 8、10、11、12、13',
    impactFocus: '創造弱勢就業機會並減少一次性包材使用，兼具社會包容與環境減量效益',
    suggestedEvidence: '受益人名冊、活動照片、回收重量紀錄、合作夥伴證明、培訓簽到表',
  },
  {
    instanceId: 'DEMO-09',
    industryType: '專業服務業',
    companyName: '睿禾顧問股份有限公司',
    shortName: '睿禾顧問',
    scale: '中小型服務業',
    employees: 120,
    annualRevenue: '新臺幣3.2億元',
    operatingLocations: '臺北總部、高雄辦公室',
    mainBusiness: '企業管理顧問、人才培訓、數位轉型輔導與專案管理',
    energyUsage: '低',
    electricityKwh: 520000,
    waterTons: 4200,
    wasteTons: 18,
    scope1Tco2e: 22,
    scope2Tco2e: 260,
    scope3Overview: '員工差旅、專案活動與外部供應商服務為主',
    sdgs: 'SDG 4、8、9、13',
    impactFocus: '透過人才培訓與企業輔導協助客戶強化創新、數位與永續轉型能力',
    suggestedEvidence: '培訓課程紀錄、客戶回饋、用電資料、差旅統計、專案成果報告',
  },
  {
    instanceId: 'DEMO-10',
    industryType: 'AI科技公司',
    companyName: '凌曜智慧科技股份有限公司',
    shortName: '凌曜智慧',
    scale: '成長型科技公司',
    employees: 240,
    annualRevenue: '新臺幣7.5億元',
    operatingLocations: '臺北研發中心、臺中資料運算合作機房',
    mainBusiness: 'AI模型開發、智慧製造解決方案、資料治理與自動化平臺',
    energyUsage: '中高',
    electricityKwh: 4200000,
    waterTons: 6100,
    wasteTons: 20,
    scope1Tco2e: 60,
    scope2Tco2e: 2100,
    scope3Overview: '雲端運算、資料中心電力與客戶導入設備為主要來源',
    sdgs: 'SDG 8、9、12、13',
    impactFocus: '透過AI節能與智慧製造方案協助客戶提升能源效率與製程良率',
    suggestedEvidence: '雲端帳單、模型訓練紀錄、客戶節能案例、資安政策、研發專案清單',
  },
];
