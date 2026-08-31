/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
// ============================================================
// ESG PDF Report Parser
// src/core/pdf/pdf-parser.ts
//
// Parses ESG/sustainability report PDFs into structured data
// Uses pdf-parse (already in deps) - pure JS, no native bindings
// Free-tier compatible
// ============================================================

interface PDFParseOutput {
  text: string;
  numpages: number;
  numrender: number;
  info: Record<string, unknown>;
  metadata: unknown;
  version: string;
}
const pdfParse: (dataBuffer: Buffer) => Promise<PDFParseOutput> = require('pdf-parse');

export type ESGCategory = 'environmental' | 'social' | 'governance' | 'general';

export interface PDFSection {
  title: string;
  pageStart: number;
  pageEnd: number;
  text: string;
  category: ESGCategory | 'unknown';
}

export interface ESGMetric {
  name: string;
  value: string;
  unit: string;
  year: string;
  category: ESGCategory;
}

export interface ESGExtraction {
  categories: Record<ESGCategory, string[]>;
  companies: string[];
  metrics: ESGMetric[];
  goals: string[];
  risks: string[];
  opportunities: string[];
  standards: string[];
  years: string[];
}

export interface PDFStats {
  totalPages: number;
  totalWords: number;
  totalChars: number;
  avgWordsPerPage: number;
  esgKeywordDensity: number;
}

export interface PDFParseResult {
  success: boolean;
  error?: string;
  title: string;
  pageCount: number;
  text: string;
  sections: PDFSection[];
  esg: ESGExtraction;
  stats: PDFStats;
}

// --- ESG Keyword Dictionaries --------------------------------------

const ENV_KEYWORDS: string[] = [
  '碳排放', '碳足跡', '溫室氣體', 'GHG', '淨零', '碳中和', '氣候變遷',
  '氣候風險', '能源', '再生能源', '太陽能', '風電', '水資源', '廢棄物',
  '回收', '循環經濟', '生物多樣性', '污染', '碳費', 'carbon', 'emission',
  'net zero', 'climate', 'energy', 'renewable', 'water', 'waste',
  'recycling', 'biodiversity', 'pollution', 'decarbonization', 'CBAM',
];

const SOC_KEYWORDS: string[] = [
  '人權', '勞動', '工時', '薪資', '多元', '包容', '性別平等', '職業安全',
  '工傷', '訓練', '員工', '福利', '健康', '安全', '社區', 'human rights',
  'labor', 'diversity', 'inclusion', 'gender', 'equality', 'workplace',
  'safety', 'training', 'employee', 'workforce', 'talent',
];

const GOV_KEYWORDS: string[] = [
  '董事會', '治理', '稽覈', '吹哨', '誠信', '合規', '風險管理', '內控',
  '審計', '薪酬', '股東', '透明度', '', 'governance', 'audit',
  'whistleblower', 'compliance', 'integrity', 'risk management',
  'internal control', 'transparency', 'disclosure', 'stakeholder',
];

const GEN_KEYWORDS: string[] = [
  '永續報告', 'GRI', 'SASB', 'TCFD', 'IFRS', 'CSRD', 'SDGs',
  'SBTi', 'sustainability report', 'TNFD',
];

const KNOWN_COMPANIES: string[] = [
  '臺積電', '鴻海', '聯發科', '臺達電', '富邦媒', '中信金', '羣光', '漢唐',
  'TSMC', 'Foxconn', 'MediaTek', 'Delta', 'Fubon', 'CTBC',
];

// --- Parser Class --------------------------------------------------

export class PDFReportParser {
  private pages: string[] = [];

  async parse(buffer: Buffer): Promise<PDFParseResult> {
    try {
      const pdfData = await pdfParse(buffer);
      const rawText = pdfData.text || '';
      this.pages = this.splitPages(rawText);

      const esg = this.extractESG(rawText);
      const stats = this.computeStats(rawText);
      const sections = this.extractSections(rawText);

      return {
        success: true,
        title: String(pdfData.info?.Title || this.guessTitle(rawText)),
        pageCount: pdfData.numpages || this.pages.length,
        text: rawText.slice(0, 50000),
        sections,
        esg,
        stats,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return this.emptyResult(msg || 'parse failed');
    }
  }

  async parseFile(filePath: string): Promise<PDFParseResult> {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(filePath);
    return this.parse(buffer);
  }

  // --- Private ------------------------------------------------------

  private splitPages(rawText: string): string[] {
    const pages = rawText.split('---PAGE_BREAK---').map(p => p.trim()).filter(p => p.length > 10);
    return pages.length > 0 ? pages : [rawText];
  }

  private guessTitle(rawText: string): string {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    for (const line of lines.slice(0, 10)) {
      if (line && line.length < 100 && !/^\d+$/.test(line)) return line;
    }
    return 'Unknown Report';
  }

  private extractESG(rawText: string): ESGExtraction {
    const text = rawText.toLowerCase();

    const categories: Record<ESGCategory, string[]> = {
      environmental: ENV_KEYWORDS.filter(kw => text.includes(kw.toLowerCase())),
      social: SOC_KEYWORDS.filter(kw => text.includes(kw.toLowerCase())),
      governance: GOV_KEYWORDS.filter(kw => text.includes(kw.toLowerCase())),
      general: GEN_KEYWORDS.filter(kw => text.includes(kw.toLowerCase())),
    };

    const companies = this.extractCompanies(rawText);
    const metrics = this.extractMetrics(rawText);
    const years = this.extractYears(rawText);

    return { categories, companies, metrics, goals: [], risks: [], opportunities: [], standards: [], years };
  }

  private extractCompanies(rawText: string): string[] {
    const found = new Set<string>(KNOWN_COMPANIES.filter(c => rawText.includes(c)));

    const pattern = /([\u4e00-\u9fff]{2,8}(?:公司|股份有限公司|集團))/g;
    let m;
    while ((m = pattern.exec(rawText)) !== null) found.add(m[1]);

    return Array.from(found).slice(0, 20);
  }

  private extractMetrics(rawText: string): ESGMetric[] {
    const metrics: ESGMetric[] = [];
    const years = this.extractYears(rawText);
    const year = years[0] || '';

    // Carbon emissions
    const carbonRe = /([\d,]+(?:\.\d+)?)\s*(?:公噸|tCO2e|tonnes?\s*CO2)/gi;
    let m;
    while ((m = carbonRe.exec(rawText)) !== null) {
      metrics.push({ name: 'carbon_emissions', value: m[1].replace(/,/g, ''), unit: 'tCO2e', year, category: 'environmental' });
    }

    // Energy
    const energyRe = /([\d,]+(?:\.\d+)?)\s*(?:MWh|GJ|kWh)/gi;
    while ((m = energyRe.exec(rawText)) !== null) {
      metrics.push({ name: 'energy_consumption', value: m[1].replace(/,/g, ''), unit: 'MWh', year, category: 'environmental' });
    }

    // Employees
    const empRe = /(\d[\d,]*)\s*(?:人|employees?|staff)/gi;
    while ((m = empRe.exec(rawText)) !== null) {
      metrics.push({ name: 'employees', value: m[1].replace(/,/g, ''), unit: 'headcount', year, category: 'social' });
    }

    return metrics.slice(0, 50);
  }

  private extractYears(rawText: string): string[] {
    const matches = rawText.match(/20\d{2}/g);
    if (!matches) return [];
    const currentYear = new Date().getFullYear();
    return Array.from(new Set(matches))
      .map((y: string) => parseInt(y))
      .filter((y: number) => y >= 2010 && y <= currentYear + 3)
      .sort((a: number, b: number) => b - a)
      .map((y: number) => y.toString());
  }

  private extractSections(rawText: string): PDFSection[] {
    const sections: PDFSection[] = [];
    const lines = rawText.split('\n');
    const linesPerPage = Math.max(1, Math.floor(lines.length / Math.max(1, this.pages.length)));

    const sectionHeaders: [RegExp, string, ESGCategory][] = [
      [/Chapter\s+1|[1]\.\s+/, 'Overview', 'general'],
      [/Environmental|climate|carbon/i, 'Environmental', 'environmental'],
      [/Social|employee|human rights/i, 'Social', 'social'],
      [/Governance|board/i, 'Governance', 'governance'],
    ];

    let current: PDFSection | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const page = Math.min(Math.floor(i / linesPerPage), this.pages.length - 1);
      const match = sectionHeaders.find(([re]) => re.test(line) && line.length < 80);

      if (match) {
        if (current) { current.pageEnd = page; sections.push(current); }
        current = { title: match[1], pageStart: page, pageEnd: page, text: '', category: match[2] };
      }
      if (current) current.text += line + '\n';
    }

    if (current) { current.pageEnd = this.pages.length - 1; sections.push(current); }
    return sections;
  }

  private computeStats(rawText: string): PDFStats {
    const totalChars = rawText.length;
    const totalWords = rawText.split(/\s+/).filter(w => w.length > 0).length;
    const totalPages = this.pages.length;

    const text = rawText.toLowerCase();
    let hitCount = 0;
    for (const kw of [...ENV_KEYWORDS, ...SOC_KEYWORDS, ...GOV_KEYWORDS]) {
      const escaped = kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const re = new RegExp(escaped.toLowerCase(), 'gi');
      const mm = text.match(re);
      if (mm) hitCount += mm.length;
    }

    return {
      totalPages,
      totalWords,
      totalChars,
      avgWordsPerPage: totalPages > 0 ? Math.round(totalWords / totalPages) : 0,
      esgKeywordDensity: totalWords > 0 ? Math.round((hitCount / totalWords) * 10000) / 100 : 0,
    };
  }

  private emptyResult(error: string): PDFParseResult {
    return {
      success: false,
      error,
      title: '',
      pageCount: 0,
      text: '',
      sections: [],
      esg: { categories: { environmental: [], social: [], governance: [], general: [] }, companies: [], metrics: [], goals: [], risks: [], opportunities: [], standards: [], years: [] },
      stats: { totalPages: 0, totalWords: 0, totalChars: 0, avgWordsPerPage: 0, esgKeywordDensity: 0 },
    };
  }
}

// --- Singleton ----------------------------------------------------

let instance: PDFReportParser | null = null;

export function getPDFParser(): PDFReportParser {
  if (!instance) instance = new PDFReportParser();
  return instance;
}

export async function parsePDFReport(buffer: Buffer): Promise<PDFParseResult> {
  return getPDFParser().parse(buffer);
}
