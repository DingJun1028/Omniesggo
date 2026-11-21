// ============================================================
// ESGSonar — 21 Monitored sources configuration
// src/core/sonnar/sources-config.ts
// Matches src/crawlers/sources-crawlers.ts 1:1
// ============================================================

export interface SourceConfig {
  id: string;
  name: string;
  region: 'TW' | 'EU' | 'INT' | 'US' | 'AP' | '3P';
  category: 'regulator' | 'exchange' | 'standard' | 'framework' | 'rating';
  url: string;
  crawlIntervalMs: number;
  enabled: boolean;
  description: string;
}

const HOUR = 3600000;

export const SOURCES: SourceConfig[] = [
  // ─── 臺灣 🇹🇼 ────
  { id: 'tw-fsc',     name: '金管會',         region: 'TW', category: 'regulator', url: 'https://www.fsc.gov.tw',        crawlIntervalMs: 4*HOUR,  enabled: true, description: '金融監督管理委員會法規/公告' },
  { id: 'tw-moenv',   name: '環境部',         region: 'TW', category: 'regulator', url: 'https://www.moenv.gov.tw',      crawlIntervalMs: 6*HOUR,  enabled: true, description: '環境法規/碳費/廢棄物' },
  { id: 'tw-moea',    name: '經濟部',         region: 'TW', category: 'regulator', url: 'https://www.moea.gov.tw',       crawlIntervalMs: 6*HOUR,  enabled: true, description: '產業政策/能源/貿易' },
  { id: 'tw-gazette', name: '行政院公報',     region: 'TW', category: 'regulator', url: 'https://gazette.nat.gov.tw',    crawlIntervalMs: 4*HOUR,  enabled: true, description: '法規預告/修正/施行' },
  { id: 'tw-twse',    name: '證交所',         region: 'TW', category: 'exchange',  url: 'https://www.twse.com.tw',       crawlIntervalMs: 8*HOUR,  enabled: true, description: '永續報告書揭露/公司治理評鑑' },
  { id: 'tw-tpex',    name: '櫃買中心',       region: 'TW', category: 'exchange',  url: 'https://www.tpex.org.tw',       crawlIntervalMs: 8*HOUR,  enabled: true, description: '上櫃公司ESG資訊' },
  { id: 'tw-mof',     name: '財政部',         region: 'TW', category: 'regulator', url: 'https://www.mof.gov.tw',        crawlIntervalMs: 8*HOUR,  enabled: true, description: '稅務與關務公告' },

  // ─── 國際 🌍 ────
  { id: 'eu-csrd',    name: 'EU CSRD',        region: 'EU', category: 'regulator', url: 'https://finance.ec.europa.eu',  crawlIntervalMs: 12*HOUR, enabled: true, description: '企業永續報告指令' },
  { id: 'eu-esrs',    name: 'EU ESRS',        region: 'EU', category: 'standard',  url: 'https://www.efrag.org',         crawlIntervalMs: 12*HOUR, enabled: true, description: '歐洲永續報告準則' },
  { id: 'int-ifrs',   name: 'IFRS S1/S2',     region: 'INT', category: 'standard', url: 'https://www.ifrs.org',           crawlIntervalMs: 24*HOUR, enabled: true, description: 'ISSB 永續揭露準則' },
  { id: 'int-gri',    name: 'GRI Standards',  region: 'INT', category: 'framework', url: 'https://www.globalreporting.org', crawlIntervalMs: 24*HOUR, enabled: true, description: '全球報告倡議組織準則' },
  { id: 'int-tcfd',   name: 'TCFD',           region: 'INT', category: 'framework', url: 'https://www.fsb-tcfd.org',       crawlIntervalMs: 24*HOUR, enabled: true, description: '氣候相關財務揭露' },
  { id: 'int-unfccc', name: 'UNFCCC',         region: 'INT', category: 'framework', url: 'https://unfccc.int',             crawlIntervalMs: 24*HOUR, enabled: true, description: '巴黎協定/NDC更新' },

  // ─── 美國 🇺🇸 ────
  { id: 'us-sec',     name: 'SEC News',       region: 'US', category: 'regulator', url: 'https://www.sec.gov',            crawlIntervalMs: 12*HOUR, enabled: true, description: 'SEC 氣候揭露規則' },
  { id: 'us-sec-gov', name: 'SEC Proposed',   region: 'US', category: 'regulator', url: 'https://www.sec.gov',            crawlIntervalMs: 24*HOUR, enabled: true, description: 'SEC 提案規則 (ESG相關)' },

  // ─── 亞太 🌏 ────
  { id: 'ap-jp-fsa',  name: '日本 FSA',       region: 'AP', category: 'regulator', url: 'https://www.fsa.go.jp',          crawlIntervalMs: 12*HOUR, enabled: true, description: '金融庁サステナビリティ開示' },
  { id: 'ap-hkex',    name: 'HKEX ESG',       region: 'AP', category: 'exchange',  url: 'https://www.hkex.com.hk',        crawlIntervalMs: 12*HOUR, enabled: true, description: '港交所ESG報告指引' },

  // ─── 第三方 📊 ────
  { id: '3p-msci',            name: 'MSCI ESG',           region: '3P', category: 'rating', url: 'https://www.msci.com',           crawlIntervalMs: 24*HOUR, enabled: true, description: 'MSCI ESG 評比公開摘要' },
  { id: '3p-sustainalytics',  name: 'Sustainalytics',     region: '3P', category: 'rating', url: 'https://www.sustainalytics.com',  crawlIntervalMs: 24*HOUR, enabled: true, description: 'Sustainalytics ESG 風險評分' },
  { id: '3p-cdp',             name: 'CDP',                region: '3P', category: 'rating', url: 'https://www.cdp.net',            crawlIntervalMs: 24*HOUR, enabled: true, description: '碳揭露專案問卷/評分' },
];

/** Get config by source ID */
export function getSourceConfig(id: string): SourceConfig | undefined {
  return SOURCES.find(s => s.id === id);
}

/** Get all enabled sources */
export function getEnabledSources(): SourceConfig[] {
  return SOURCES.filter(s => s.enabled);
}

/** Get sources by region */
export function getSourcesByRegion(region: SourceConfig['region']): SourceConfig[] {
  return SOURCES.filter(s => s.region === region);
}

/** Get sources by category */
export function getSourcesByCategory(category: SourceConfig['category']): SourceConfig[] {
  return SOURCES.filter(s => s.category === category);
}
