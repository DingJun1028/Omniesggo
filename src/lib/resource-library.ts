// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * src/lib/resource-library.ts
 *
 * ESGGO Resource Library — reusable report assets with
 * 5T trust scoring and ZKP integrity verification.
 */

import { FiveTGatekeeper, type FiveTScore } from './five-t-protocol';
import { createHash, randomBytes } from 'crypto';
import type { ChartAsset, TableAsset, ImageAsset, CalloutAsset, ReportAsset } from './report-brand-theme';

export interface ReportResourceMeta {
  id: string;
  slug: string;
  title: string;
  description: string;
  assetType: 'chart' | 'table' | 'image' | 'callout';
  tags: string[];
  category: 'core' | 'report' | 'governance' | 'intelligence' | 'system';
  fiveT: FiveTScore;
  zkpHashLock?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_FIVE_T: FiveTScore = {
  traceable: 0.8,
  transparent: 0.7,
  tangible: 0.7,
  trustworthy: 0.9,
  trackable: 0.6,
};

const RESOURCES: ReportResourceMeta[] = [
  {
    id: 'res-esg-scorecard',
    slug: 'esg-scorecard',
    title: 'ESG 總分卡',
    description: '可重用的 ESG 分數雷達與五維度摘要卡',
    assetType: 'chart',
    tags: ['ESG', '5T', '儀表板', '摘要'],
    category: 'core',
    fiveT: DEFAULT_FIVE_T,
    source: 'sustain-center',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'res-ghg-bar',
    slug: 'ghg-bar',
    title: 'GHG 排放柱狀圖',
    description: 'Scope 1/2/3 排放與減排目標視覺化模板',
    assetType: 'chart',
    tags: ['GHG', '碳排', 'TCFD', '氣候'],
    category: 'report',
    fiveT: DEFAULT_FIVE_T,
    source: 'sustain-write',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'res-governance-table',
    slug: 'governance-table',
    title: '治理指標表格',
    description: '董事會結構、性別平權、吹哨者制度的標準表格',
    assetType: 'table',
    tags: ['治理', 'G', '董事會', '指標'],
    category: 'governance',
    fiveT: DEFAULT_FIVE_T,
    source: 'sustain-write',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'res-social-insight',
    slug: 'social-insight',
    title: '社會影響洞察卡',
    description: '社會面向結論、利害關係人回饋摘要卡',
    assetType: 'callout',
    tags: ['社會', 'S', '洞察', '利害關係人'],
    category: 'intelligence',
    fiveT: DEFAULT_FIVE_T,
    source: 'village',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'res-zkp-seal-banner',
    slug: 'zkp-seal-banner',
    title: 'ZKP Seal 品牌信任橫幅',
    description: '適用於報告扉頁或驗證頁的品牌信任橫幅',
    assetType: 'image',
    tags: ['ZKP', '信任', '品牌', '品牌一體化'],
    category: 'system',
    fiveT: DEFAULT_FIVE_T,
    source: 'omni-base',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class ReportResourceLibrary {
  private static byId = new Map<string, ReportResourceMeta>();
  private static bySlug = new Map<string, ReportResourceMeta>();

  static init(items: ReportResourceMeta[] = RESOURCES) {
    this.byId.clear();
    this.bySlug.clear();
    for (const item of items) {
      this.byId.set(item.id, item);
      this.bySlug.set(item.slug, item);
    }
  }

  static list(filter?: { category?: string; assetType?: string; tag?: string }) {
    let items = Array.from(this.byId.values());
    if (filter?.category) items = items.filter(i => i.category === filter.category);
    if (filter?.assetType) items = items.filter(i => i.assetType === filter.assetType);
    const filterTag = filter?.tag;
    if (filterTag) items = items.filter(i => i.tags.includes(filterTag));
    return items;
  }

  static getById(id: string) {
    return this.byId.get(id) || null;
  }

  static getBySlug(slug: string) {
    return this.bySlug.get(slug) || null;
  }

  static sealZKP(id: string): { success: boolean; hashLock: string } {
    const item = this.byId.get(id);
    if (!item) return { success: false, hashLock: '' };
    const salt = randomBytes(16).toString('hex');
    const raw = `${id}|${item.title}|${salt}|${Date.now()}`;
    const hashLock = createHash('sha256').update(raw).digest('hex');
    item.zkpHashLock = hashLock;
    return { success: true, hashLock };
  }

  static verifyZKP(id: string, hashLock: string): boolean {
    const item = this.byId.get(id);
    if (!item || !item.zkpHashLock) return false;
    return item.zkpHashLock === hashLock;
  }

  static fiveTStatus(id: string) {
    const item = this.byId.get(id);
    if (!item) return null;
    return FiveTGatekeeper.evaluate(item.fiveT);
  }

  static markUsed(id: string) {
    const item = this.byId.get(id);
    if (!item) return;
    item.updatedAt = new Date().toISOString();
  }
}

ReportResourceLibrary.init();
