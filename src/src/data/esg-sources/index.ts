// ESG 商情偵測 - 訂閱式資訊來源結構
// 資料位置: src/data/esg-sources/index.ts

export interface Source {
  id: string;
  name: string;
  group: string;        // A~N 羣組
  category: string;     // UN/智庫/標準/政策/市場/產業/風險/地緣/社創
  url: string;
  contentType: string;
  updateFrequency: string;
  topics: string[];     // 可訂閱的主題標籤
  regions: string[];    // 覆蓋地區
  industries: string[]; // 適用產業
}

export interface UserSubscription {
  userId: string;
  watchlist: WatchItem[];
  deliveryChannel: 'email' | 'telegram' | 'webhook';
  frequency: 'realtime' | 'daily' | 'weekly';
  createdAt: string;
}

export interface WatchItem {
  type: 'company' | 'keyword' | 'indicator' | 'region' | 'industry';
  value: string;
  alertConditions: AlertCondition[];
}

export interface AlertCondition {
  field: string;        // e.g. "price", "policy_status", "penalty_amount"
  operator: 'changed' | 'increased' | 'decreased' | 'exceeds' | 'below';
  threshold?: number;
}

// ============================================================
// Part 1-A: 既有資訊來源總表（31 筆）
// ============================================================
export const EXISTING_SOURCES: Source[] = [
  // A. UN/政府間組織
  { id: 'un-sdgs', name: 'UN SDGs Knowledge Platform', group: 'A', category: 'UN/政府間組織', url: 'https://sdgs.un.org', contentType: '全球 SDG 政策、會議、國家報告', updateFrequency: 'Weekly', topics: ['SDG', '政策', '國家報告'], regions: ['全球'], industries: ['全產業'] },
  { id: 'unep', name: 'UNEP', group: 'A', category: 'UN/政府間組織', url: 'https://www.unep.org', contentType: '氣候、污染、自然、生物多樣性專題', updateFrequency: 'Daily/Weekly', topics: ['氣候', '污染', '生物多樣性'], regions: ['全球'], industries: ['全產業'] },
  { id: 'unfccc', name: 'UNFCCC', group: 'A', category: 'UN/政府間組織', url: 'https://unfccc.int', contentType: '氣候談判、COP 文稿、政策更新', updateFrequency: 'Daily During COP', topics: ['氣候', 'COP', '談判'], regions: ['全球'], industries: ['全產業'] },
  { id: 'ipcc', name: 'IPCC', group: 'A', category: 'UN/政府間組織', url: 'https://www.ipcc.ch', contentType: '氣候科學評估（AR 系列）', updateFrequency: '固定大型發布', topics: ['氣候科學', '評估報告'], regions: ['全球'], industries: ['全產業'] },
  { id: 'undp', name: 'UNDP', group: 'A', category: 'UN/政府間組織', url: 'https://www.undp.org', contentType: '再生發展、治理、減貧、永續專案', updateFrequency: 'Weekly', topics: ['發展', '治理', '減貧'], regions: ['全球'], industries: ['全產業'] },
  { id: 'who', name: 'WHO', group: 'A', category: 'UN/政府間組織', url: 'https://www.who.int', contentType: '健康、公共衛生、全球風險', updateFrequency: 'Daily/Weekly', topics: ['健康', '公共衛生'], regions: ['全球'], industries: ['醫療', '製藥'] },
  { id: 'worldbank', name: 'World Bank', group: 'A', category: 'UN/政府間組織', url: 'https://www.worldbank.org', contentType: '氣候投資、政策貸款、國別分析', updateFrequency: 'Weekly', topics: ['投資', '政策', '國別分析'], regions: ['全球'], industries: ['全產業'] },
  { id: 'oecd', name: 'OECD', group: 'A', category: 'UN/政府間組織', url: 'https://www.oecd.org', contentType: '永續政策、碳定價、企業治理', updateFrequency: 'Weekly', topics: ['政策', '碳定價', '治理'], regions: ['全球'], industries: ['全產業'] },
  { id: 'iea', name: 'IEA', group: 'A', category: 'UN/政府間組織', url: 'https://www.iea.org', contentType: '能源轉型、能源市場與政策', updateFrequency: 'Weekly', topics: ['能源', '轉型'], regions: ['全球'], industries: ['能源', '電力'] },
  { id: 'imf', name: 'IMF', group: 'A', category: 'UN/政府間組織', url: 'https://www.imf.org', contentType: '宏觀、轉型金融、國別風險', updateFrequency: 'Weekly', topics: ['金融', '風險', '總體經濟'], regions: ['全球'], industries: ['全產業'] },

  // B. 國際智庫/NGO/研究機構
  { id: 'wri', name: 'WRI', group: 'B', category: '國際智庫', url: 'https://www.wri.org', contentType: '氣候、土地利用、能源政策', updateFrequency: 'Daily/Weekly', topics: ['氣候', '土地利用', '能源'], regions: ['全球'], industries: ['全產業'] },
  { id: 'wwf', name: 'WWF', group: 'B', category: '國際智庫', url: 'https://www.worldwildlife.org', contentType: '生物多樣性、自然資本、倡議', updateFrequency: 'Weekly', topics: ['生物多樣性', '自然資本'], regions: ['全球'], industries: ['全產業'] },
  { id: 'iucn', name: 'IUCN', group: 'B', category: '國際智庫', url: 'https://www.iucn.org', contentType: '物種名錄、自然政策、研究', updateFrequency: 'Weekly', topics: ['物種', '自然政策'], regions: ['全球'], industries: ['全產業'] },
  { id: 'nature-conservancy', name: 'Nature Conservancy', group: 'B', category: '國際智庫', url: 'https://www.nature.org', contentType: '自然保育、自然解方（NbS）', updateFrequency: 'Weekly', topics: ['自然保育', 'NbS'], regions: ['全球'], industries: ['全產業'] },
  { id: 'cpi', name: 'Climate Policy Initiative', group: 'B', category: '國際智庫', url: 'https://www.climatepolicyinitiative.org', contentType: '氣候金融、政策分析、投資趨勢', updateFrequency: 'Weekly', topics: ['氣候金融', '投資'], regions: ['全球'], industries: ['金融'] },
  { id: 'tpi', name: 'Transition Pathway Initiative', group: 'B', category: '國際智庫', url: 'https://www.transitionpathwayinitiative.org', contentType: '企業轉型評估、氣候治理', updateFrequency: 'Quarterly', topics: ['轉型', '治理'], regions: ['全球'], industries: ['全產業'] },
  { id: 'carbon-tracker', name: 'Carbon Tracker', group: 'B', category: '國際智庫', url: 'https://carbontracker.org', contentType: '化石資產風險、轉型風險研究', updateFrequency: 'Monthly', topics: ['資產風險', '轉型風險'], regions: ['全球'], industries: ['化石燃料', '能源'] },
  { id: 'rmi', name: 'RMI', group: 'B', category: '國際智庫', url: 'https://rmi.org', contentType: '能源效率、電力系統、淨零解方', updateFrequency: 'Weekly', topics: ['能源效率', '電力', '淨零'], regions: ['全球'], industries: ['能源', '電力'] },
  { id: 'wef', name: 'World Economic Forum', group: 'B', category: '國際智庫', url: 'https://www.weforum.org', contentType: '全球趨勢、產業倡議、治理議題', updateFrequency: 'Daily/Weekly', topics: ['趨勢', '倡議', '治理'], regions: ['全球'], industries: ['全產業'] },
  { id: 'ellen-macarthur', name: 'Ellen MacArthur Foundation', group: 'B', category: '國際智庫', url: 'https://ellenmacarthurfoundation.org', contentType: '循環經濟、材料與設計策略', updateFrequency: 'Weekly', topics: ['循環經濟', '材料'], regions: ['全球'], industries: ['製造', '消費'] },

  // C. 揭露/標準/評等與框架
  { id: 'ifrs-issb', name: 'IFRS Foundation / ISSB', group: 'C', category: '標準框架', url: 'https://www.ifrs.org', contentType: '永續揭露標準（S1/S2）', updateFrequency: 'Weekly', topics: ['揭露', '標準', 'S1', 'S2'], regions: ['全球'], industries: ['全產業'] },
  { id: 'cdp', name: 'CDP', group: 'C', category: '標準框架', url: 'https://www.cdp.net', contentType: '氣候、水、森林揭露資料', updateFrequency: 'Daily/Weekly', topics: ['揭露', '氣候', '水', '森林'], regions: ['全球'], industries: ['全產業'] },
  { id: 'gri', name: 'GRI', group: 'C', category: '標準框架', url: 'https://www.globalreporting.org', contentType: '全球永續報告準則', updateFrequency: 'Weekly', topics: ['報告準則', '永續'], regions: ['全球'], industries: ['全產業'] },
  { id: 'sbti', name: 'SBTi', group: 'C', category: '標準框架', url: 'https://sciencebasedtargets.org', contentType: '科學基礎減量目標', updateFrequency: 'Weekly', topics: ['減量目標', '科學基礎'], regions: ['全球'], industries: ['全產業'] },
  { id: 'tnfd', name: 'TNFD', group: 'C', category: '標準框架', url: 'https://tnfd.global', contentType: '自然相關財務揭露框架', updateFrequency: 'Monthly', topics: ['自然', '財務揭露'], regions: ['全球'], industries: ['全產業'] },
  { id: 'pri', name: 'PRI', group: 'C', category: '標準框架', url: 'https://www.unpri.org', contentType: '機構投資人 ESG 原則', updateFrequency: 'Weekly', topics: ['投資', 'ESG'], regions: ['全球'], industries: ['金融', '投資'] },
  { id: 'msci-esg', name: 'MSCI ESG', group: 'C', category: '評等', url: 'https://www.msci.com/our-solutions/esg-investing', contentType: 'ESG Ratings/Research', updateFrequency: 'Weekly', topics: ['ESG評等', '研究'], regions: ['全球'], industries: ['全產業'] },
  { id: 'sustainalytics', name: 'Sustainalytics', group: 'C', category: '評等', url: 'https://www.sustainalytics.com', contentType: 'ESG Risk Ratings', updateFrequency: 'Weekly', topics: ['ESG風險', '評等'], regions: ['全球'], industries: ['全產業'] },
  { id: 'bloomberg-esg', name: 'Bloomberg ESG', group: 'C', category: '評等', url: 'https://www.bloomberg.com/professional/solution/esg/', contentType: 'ESG/市場資料', updateFrequency: 'Daily', topics: ['ESG', '市場資料'], regions: ['全球'], industries: ['全產業'] },
];

// ============================================================
// Part 1-B: 新增五大類資訊來源（26 筆）
// ============================================================
export const NEW_SOURCES: Source[] = [
  // D. 政策執行端
  { id: 'ec-clima', name: 'EC DG CLIMA', group: 'D', category: '政策執行端', url: 'https://commission.europa.eu/about/departments-and-executive-agencies/climate-action_en', contentType: '歐盟氣候政策', updateFrequency: 'Weekly', topics: ['歐盟', '氣候政策'], regions: ['歐盟'], industries: ['全產業'] },
  { id: 'ec-climate-action', name: 'EC Climate Action', group: 'D', category: '政策執行端', url: 'https://climate.ec.europa.eu/index_en', contentType: 'EU ETS、CBAM、碳市場', updateFrequency: 'Daily/Weekly', topics: ['ETS', 'CBAM', '碳市場'], regions: ['歐盟'], industries: ['全產業'] },
  { id: 'ec-ets', name: 'EC EU ETS', group: 'D', category: '政策執行端', url: 'https://climate.ec.europa.eu/eu-action/carbon-markets/eu-emissions-trading-system-eu-ets_en', contentType: 'ETS 制度說明', updateFrequency: 'Weekly', topics: ['ETS', '碳交易'], regions: ['歐盟'], industries: ['能源', '製造'] },
  { id: 'sec', name: 'U.S. SEC', group: 'D', category: '政策執行端', url: 'https://www.sec.gov', contentType: '美國上市公司揭露、監理', updateFrequency: 'Daily', topics: ['SEC', '揭露', '監理'], regions: ['美國'], industries: ['全產業'] },
  { id: 'epa', name: 'U.S. EPA', group: 'D', category: '政策執行端', url: 'https://www.epa.gov/climateleadership/climate-related-financial-risks-and-opportunities', contentType: '氣候風險、揭露、環境監管', updateFrequency: 'Weekly', topics: ['氣候風險', '環境監管'], regions: ['美國'], industries: ['全產業'] },
  { id: 'carb', name: 'California ARB', group: 'D', category: '政策執行端', url: 'https://ww2.arb.ca.gov/our-work/programs/california-corporate-greenhouse-gas-ghg-reporting-and-climate-related-financial', contentType: '加州氣候揭露', updateFrequency: 'Weekly', topics: ['加州', 'GHG', '揭露'], regions: ['美國'], industries: ['全產業'] },

  // E. 市場價格端
  { id: 'eex-spot', name: 'EEX EU ETS Spot', group: 'E', category: '市場價格端', url: 'https://www.eex.com/en/markets/environmental-markets/eu-ets-spot-futures-options', contentType: 'EUA/EUAA 現貨與期貨', updateFrequency: 'Daily', topics: ['碳價', 'EUA', '期貨'], regions: ['歐盟'], industries: ['能源', '製造'] },
  { id: 'eex-auctions', name: 'EEX EU ETS Auctions', group: 'E', category: '市場價格端', url: 'https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions', contentType: 'ETS 拍賣資訊', updateFrequency: 'Daily', topics: ['拍賣', '碳價'], regions: ['歐盟'], industries: ['能源'] },
  { id: 'ice-eua', name: 'ICE EUA Futures', group: 'E', category: '市場價格端', url: 'https://www.ice.com/products/197/eua-futures', contentType: 'EUA 期貨契約', updateFrequency: 'Daily', topics: ['EUA', '期貨'], regions: ['歐盟'], industries: ['能源', '金融'] },
  { id: 'ice-emissions', name: 'ICE Emissions', group: 'E', category: '市場價格端', url: 'https://www.ice.com/products/Futures-Options/Energy/Emissions', contentType: '排放商品與碳市場產品', updateFrequency: 'Daily', topics: ['排放', '碳市場'], regions: ['全球'], industries: ['能源', '金融'] },
  { id: 'eia', name: 'U.S. EIA', group: 'E', category: '市場價格端', url: 'https://www.eia.gov', contentType: '官方能源統計', updateFrequency: 'Daily/Weekly', topics: ['能源', '油氣電', '價格'], regions: ['美國'], industries: ['能源'] },
  { id: 'eia-intl', name: 'U.S. EIA International', group: 'E', category: '市場價格端', url: 'https://www.eia.gov/international/', contentType: '國際能源數據', updateFrequency: 'Weekly', topics: ['國際能源', '國別'], regions: ['全球'], industries: ['能源'] },
  { id: 'lloyds', name: 'Lloyds Emerging Risk', group: 'E', category: '市場價格端', url: 'https://www.lloyds.com/insights/news/emerging-risk', contentType: '新興風險、保險市場', updateFrequency: 'Weekly', topics: ['保險', '新興風險'], regions: ['全球'], industries: ['保險', '航運'] },

  // F. 產業治理端
  { id: 'rba', name: 'Responsible Business Alliance', group: 'F', category: '產業治理端', url: 'https://www.responsiblebusiness.org/', contentType: '責任供應鏈、行為準則', updateFrequency: 'Weekly', topics: ['供應鏈', '行為準則'], regions: ['全球'], industries: ['電子', '製造'] },
  { id: 'sedex', name: 'Sedex', group: 'F', category: '產業治理端', url: 'https://www.sedex.com/', contentType: '供應鏈風險評估、SMETA', updateFrequency: 'Weekly', topics: ['供應鏈', 'SMETA', '風險'], regions: ['全球'], industries: ['全產業'] },
  { id: 'sa8000', name: 'SA8000', group: 'F', category: '產業治理端', url: 'https://sa-intl.org/programs/sa8000/', contentType: '社會責任標準', updateFrequency: 'Monthly', topics: ['社會責任', '勞工'], regions: ['全球'], industries: ['製造', '紡織'] },

  // G. 風險事件端
  { id: 'imo-security', name: 'IMO Maritime Security', group: 'G', category: '風險事件端', url: 'https://www.imo.org/en/ourwork/security/pages/guidemaritimesecuritydefault.aspx', contentType: '海事安全', updateFrequency: 'Weekly', topics: ['海事', '安全'], regions: ['全球'], industries: ['航運'] },
  { id: 'imo-guide', name: 'IMO Guide to Maritime Security', group: 'G', category: '風險事件端', url: 'https://www.imo.org/en/ourwork/security/guide_to_maritime', contentType: '海運安全、ISPS', updateFrequency: 'Weekly', topics: ['海運', 'ISPS', '海盜'], regions: ['全球'], industries: ['航運'] },

  // H. 地緣與供應鏈端
  { id: 'ofac', name: 'OFAC U.S. Treasury', group: 'H', category: '地緣與供應鏈端', url: 'https://ofac.treasury.gov/sanctions-programs-and-country-information', contentType: '制裁名單、出口限制', updateFrequency: 'Daily', topics: ['制裁', '出口管制'], regions: ['美國', '全球'], industries: ['全產業'] },
  { id: 'eu-sanctions', name: 'EU Sanctions Map', group: 'H', category: '地緣與供應鏈端', url: 'https://www.sanctionsmap.eu/', contentType: 'EU 制裁地圖', updateFrequency: 'Daily', topics: ['制裁', '歐盟'], regions: ['歐盟', '全球'], industries: ['全產業'] },
  { id: 'comtrade', name: 'UN Comtrade', group: 'H', category: '地緣與供應鏈端', url: 'https://comtrade.un.org/', contentType: '全球貿易統計', updateFrequency: 'Monthly', topics: ['貿易', '商品流向'], regions: ['全球'], industries: ['全產業'] },
  { id: 'wto-data', name: 'WTO Data Portal', group: 'H', category: '地緣與供應鏈端', url: 'https://data.wto.org/', contentType: 'WTO 關稅與貿易數據', updateFrequency: 'Weekly', topics: ['關稅', '貿易'], regions: ['全球'], industries: ['全產業'] },
];

// ============================================================
// Part 1-C: 社創/社企類（19 筆）
// ============================================================
export const SOCIAL_SOURCES: Source[] = [
  { id: 'oecd-social', name: 'OECD Social Economy', group: 'I', category: '社創政策', url: 'https://www.oecd.org/en/topics/sub-issues/social-economy-and-social-innovation.html', contentType: '社會經濟、社會創新', updateFrequency: 'Weekly', topics: ['社會經濟', '社會創新'], regions: ['全球'], industries: ['全產業'] },
  { id: 'ilo-social', name: 'ILO Social Economy', group: 'I', category: '社創政策', url: 'https://www.ilo.org/topics-and-sectors/social-and-solidarity-economy', contentType: '社會與團結經濟', updateFrequency: 'Weekly', topics: ['團結經濟', '就業'], regions: ['全球'], industries: ['全產業'] },
  { id: 'ashoka', name: 'Ashoka', group: 'J', category: '社創網絡', url: 'https://www.ashoka.org', contentType: '社會創業家案例', updateFrequency: 'Weekly', topics: ['社會創業', '系統變革'], regions: ['全球'], industries: ['全產業'] },
  { id: 'schwab', name: 'Schwab Foundation', group: 'J', category: '社創網絡', url: 'https://www.schwabfound.org', contentType: '社會創業家、社會創新', updateFrequency: 'Weekly', topics: ['社會創業', '創新'], regions: ['全球'], industries: ['全產業'] },
  { id: 'skoll', name: 'Skoll Foundation', group: 'J', category: '社創網絡', url: 'https://skoll.org', contentType: '社會創業、系統變革', updateFrequency: 'Weekly', topics: ['社會創業', '系統變革'], regions: ['全球'], industries: ['全產業'] },
  { id: 'giin', name: 'GIIN', group: 'K', category: '影響力投資', url: 'https://thegiin.org/', contentType: '影響力投資市場', updateFrequency: 'Weekly', topics: ['影響力投資', '市場'], regions: ['全球'], industries: ['金融'] },
  { id: 'b-lab', name: 'B Lab / B Corporation', group: 'L', category: '認證', url: 'https://www.bcorporation.net/', contentType: 'B Corp 標準', updateFrequency: 'Daily/Weekly', topics: ['B Corp', '認證'], regions: ['全球'], industries: ['全產業'] },
  { id: 'ssir', name: 'Stanford Social Innovation Review', group: 'M', category: '研究平臺', url: 'https://ssir.org/', contentType: '社會創新研究', updateFrequency: 'Daily/Weekly', topics: ['社會創新', '研究'], regions: ['全球'], industries: ['全產業'] },
  { id: 'impactalpha', name: 'ImpactAlpha', group: 'K', category: '影響力投資', url: 'https://impactalpha.com/', contentType: '影響力投資、氣候金融', updateFrequency: 'Daily/Weekly', topics: ['影響力投資', '氣候金融'], regions: ['全球'], industries: ['金融'] },
  { id: 'pioneerspost', name: 'Pioneers Post', group: 'N', category: '社創媒體', url: 'https://www.pioneerspost.com/', contentType: '社會企業、影響力投資新聞', updateFrequency: 'Daily/Weekly', topics: ['社會企業', '影響力投資'], regions: ['全球'], industries: ['全產業'] },
];

// 全部來源合併
export const ALL_SOURCES: Source[] = [
  ...EXISTING_SOURCES,
  ...NEW_SOURCES,
  ...SOCIAL_SOURCES,
];

// 依羣組取得來源
export function getSourcesByGroup(group: string): Source[] {
  return ALL_SOURCES.filter(s => s.group === group);
}

// 依主題搜尋來源
export function getSourcesByTopic(topic: string): Source[] {
  return ALL_SOURCES.filter(s =>
    s.topics.some(t => t.toLowerCase().includes(topic.toLowerCase()))
  );
}

// 取得所有唯一主題標籤
export function getAllTopics(): string[] {
  const topics = new Set<string>();
  ALL_SOURCES.forEach(s => s.topics.forEach(t => topics.add(t)));
  return Array.from(topics);
}
