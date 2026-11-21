// ============================================================
// ESGSonar Source Crawlers — 21 monitored sources
// src/crawlers/sources-crawlers.ts
// ============================================================

import { BaseCrawler, CrawlResultItem, CrawlerConfig } from './base-crawler';

// ─── 臺灣 🇹🇼 ────────────────────────────────────────────────

export class FSCCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'tw-fsc',
      name: '金融監督管理委員會',
      baseUrl: 'https://www.fsc.gov.tw',
      listUrl: 'https://www.fsc.gov.tw/ch/home.jsp?id=97&parentpath=0,2',
      selectors: { list: 'table tr', title: 'a', link: 'a', date: 'td:nth-child(2)' },
      maxItems: 15, requestDelay: 2000,
    };
    super(config);
  }

  protected extractItems(html: string, maxItems: number): CrawlResultItem[] {
    const results: CrawlResultItem[] = [];
    const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match: RegExpExecArray | null;
    const urls = new Set<string>();
    while ((match = linkPattern.exec(html)) !== null && results.length < maxItems) {
      const [, href, title] = match;
      const cleanTitle = title.trim().replace(/&[^;]+/g, '');
      if (!cleanTitle || cleanTitle.length < 5 || urls.has(href)) continue;
      if (!href.includes('.jsp') && !href.includes('/ch/')) continue;
      urls.add(href);
      const fullUrl = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
      results.push({ title: cleanTitle.substring(0, 200), url: fullUrl, summary: '', hash: this.computeHash(`${cleanTitle}${fullUrl}`) });
    }
    return results;
  }
}

export class MOENVCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'tw-moenv', name: '環境部',
      baseUrl: 'https://www.moenv.gov.tw',
      listUrl: 'https://www.moenv.gov.tw/reformation/news-list',
      selectors: { list: '.news-list-item', title: 'a', link: 'a', date: '.date' },
      maxItems: 15, requestDelay: 2000,
    };
    super(config);
  }
}

export class MOEACrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'tw-moea', name: '經濟部',
      baseUrl: 'https://www.moea.gov.tw',
      listUrl: 'https://www.moea.gov.tw/MNS/populace/news/News.aspx?kind=1',
      selectors: { list: 'table tr, .news-item', title: 'a', link: 'a', date: 'td:first-child' },
      maxItems: 15, requestDelay: 2000,
    };
    super(config);
  }
}

export class GazetteCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'tw-gazette', name: '行政院公報',
      baseUrl: 'https://gazette.nat.gov.tw',
      listUrl: 'https://gazette.nat.gov.tw/egazette/Index.jsp',
      selectors: { list: 'table tr, .list-item', title: 'a', link: 'a', date: 'td:nth-child(2)' },
      maxItems: 20, requestDelay: 2000,
    };
    super(config);
  }
}

export class TWSECrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'tw-twse', name: '臺灣證券交易所',
      baseUrl: 'https://www.twse.com.tw',
      listUrl: 'https://twse-regulation.twse.com.tw/m/LawNewNoticesPrintView.aspx',
      selectors: { list: 'table tr', title: 'td a', link: 'td a', date: 'td:first-child' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class TPEXCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'tw-tpex', name: '櫃買中心',
      baseUrl: 'https://www.tpex.org.tw',
      listUrl: 'https://www.tpex.org.tw/web/news/news_list.php',
      selectors: { list: 'table tr', title: 'a', link: 'a', date: 'td:first-child' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

// ─── 國際標準 🌍 ──────────────────────────────────────────────

export class EUCSRDCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'eu-csrd', name: 'EU Corporate Sustainability Reporting Directive',
      baseUrl: 'https://finance.ec.europa.eu',
      listUrl: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en',
      selectors: { list: '.ecl-list-item, article', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class EUESRSCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'eu-esrs', name: 'EU European Sustainability Reporting Standards',
      baseUrl: 'https://www.efrag.org',
      listUrl: 'https://www.efrag.org/Projects/Completed-Projects/ESRS',
      selectors: { list: '.list-item, .project-item', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class IFRSCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'int-ifrs', name: 'IFRS S1/S2 Sustainability Standards',
      baseUrl: 'https://www.ifrs.org',
      listUrl: 'https://www.ifrs.org/issued-standards/list-of-standards/standards-and-interpretations-available-for-implementation/',
      selectors: { list: '.standard-item, .card', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class GRICrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'int-gri', name: 'GRI Global Reporting Initiative',
      baseUrl: 'https://www.globalreporting.org',
      listUrl: 'https://www.globalreporting.org/standards/',
      selectors: { list: '.standard-item, .resource-item', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class TCFDCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'int-tcfd', name: 'TCFD Task Force on Climate-related Financial Disclosures',
      baseUrl: 'https://www.fsb-tcfd.org',
      listUrl: 'https://www.fsb-tcfd.org/publications/',
      selectors: { list: '.publication-item, article', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class UNFCCCCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'int-unfccc', name: 'UNFCCC Paris Agreement & NDCs',
      baseUrl: 'https://unfccc.int',
      listUrl: 'https://unfccc.int/news',
      selectors: { list: '.views-row, .news-item', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

// ─── 美國 🇺🇸 ────────────────────────────────────────────────

export class SECCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'us-sec', name: 'U.S. SEC Climate Disclosure Rules',
      baseUrl: 'https://www.sec.gov',
      listUrl: 'https://www.sec.gov/newsroom/whats-new',
      selectors: { list: 'table tr, .list-item', title: 'a', link: 'a', date: 'td:first-child' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class SECGovCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'us-sec-gov', name: 'U.S. SEC Proposed Rules (ESG)',
      baseUrl: 'https://www.sec.gov',
      listUrl: 'https://www.sec.gov/rules/proposed.shtml',
      selectors: { list: '.list-item, table tr', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

// ─── 亞太 🌏 ──────────────────────────────────────────────────

export class JapanFSACrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'ap-jp-fsa', name: '日本 金融庁 (FSA) サステナビリティ開示',
      baseUrl: 'https://www.fsa.go.jp',
      listUrl: 'https://www.fsa.go.jp/news/',
      selectors: { list: '.news-list li, table tr', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class HKEXCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'ap-hkex', name: '香港交易所 HKEX ESG Reporting Guide',
      baseUrl: 'https://www.hkex.com.hk',
      listUrl: 'https://www.hkex.com.hk/-/media/hkex-market/listing/rules-and-guidance/listing-rules-contingency/main-board-listing-rules/appendices/appendix_27',
      selectors: { list: '.article-item, .resource-item', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

// ─── 第三方評比 ────────────────────────────────────────────────

export class MSCIESGCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: '3p-msci', name: 'MSCI ESG Ratings (public summaries)',
      baseUrl: 'https://www.msci.com',
      listUrl: 'https://www.msci.com/our-solutions/esg-investing/esg-ratings',
      selectors: { list: '.card, .resource-item', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class SustainalyticsCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: '3p-sustainalytics', name: 'Sustainalytics ESG Risk Ratings',
      baseUrl: 'https://www.sustainalytics.com',
      listUrl: 'https://www.sustainalytics.com/esg-ratings/',
      selectors: { list: '.resource-item, article', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

export class CDPCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: '3p-cdp', name: 'CDP Carbon Disclosure Project',
      baseUrl: 'https://www.cdp.net',
      listUrl: 'https://www.cdp.net/en/press-releases',
      selectors: { list: '.news-item, article', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 3000,
    };
    super(config);
  }
}

// ─── 臺灣補充 ──────────────────────────────────────────────────

export class MOFCrawler extends BaseCrawler {
  constructor() {
    const config: CrawlerConfig = {
      sourceId: 'tw-mof', name: '財政部',
      baseUrl: 'https://www.mof.gov.tw',
      listUrl: 'https://www.mof.gov.tw/single-news-list.html',
      selectors: { list: '.news-item, table tr', title: 'a', link: 'a', date: '.date' },
      maxItems: 10, requestDelay: 2000,
    };
    super(config);
  }
}
