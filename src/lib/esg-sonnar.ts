// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * src/lib/esg-sonnar.ts — ESGSonnar 整合服務
 */

// ── Types ─────────────────────────────────────────────────────

export interface SonnarQuery {
  companyId?: string;
  keyword?: string;
  category?: 'environment' | 'social' | 'governance';
  limit?: number;
}

export interface SonnarResult {
  id: string;
  companyId: string;
  source: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  publishedAt: number;
  url?: string;
}

export interface SonnarStats {
  totalResults: number;
  byCategory: Record<string, number>;
  lastUpdated: number;
}

// ── ESGSonnar Service ─────────────────────────────────────────

export class ESGSonnarService {
  private static _results: Map<string, SonnarResult> = new Map();
  private static _initialized = false;

  /**
   * 初始化模擬數據
   */
  static init(): void {
    if (this._initialized) return;

    const mockResults: SonnarResult[] = [
      {
        id: 'SONNAR-001',
        companyId: 'C001',
        source: 'ESGSonnar',
        title: '2025年碳排放報告',
        content: '本公司2025年碳排放量較去年減少12%，主要歸功於節能措施及再生能源使用比例提升。',
        category: 'environment',
        tags: ['碳排放', '減碳', '再生能源'],
        publishedAt: Date.now() - 86400000 * 30,
      },
      {
        id: 'SONNAR-002',
        companyId: 'C001',
        source: 'ESGSonnar',
        title: '供應鏈人權評估',
        content: '完成對前50大供應商的人權風險評估，無發現重大違規事項。',
        category: 'social',
        tags: ['人權', '供應鏈', '風險評估'],
        publishedAt: Date.now() - 86400000 * 15,
      },
      {
        id: 'SONNAR-003',
        companyId: 'C001',
        source: 'ESGSonnar',
        title: '董事會多元性報告',
        content: '董事會成員包含3位獨立董事，女性董事比例達33%。',
        category: 'governance',
        tags: ['治理', '董事會', '多元性'],
        publishedAt: Date.now() - 86400000 * 7,
      },
    ];

    mockResults.forEach(r => this._results.set(r.id, r));
    this._initialized = true;
  }

  /**
   * 查詢 ESG 資訊
   */
  static query(params: SonnarQuery): SonnarResult[] {
    this.init();

    let results = Array.from(this._results.values());

    if (params.companyId) {
      results = results.filter(r => r.companyId === params.companyId);
    }

    if (params.category) {
      results = results.filter(r => r.category === params.category);
    }

    if (params.keyword) {
      const kw = params.keyword.toLowerCase();
      results = results.filter(
        r =>
          r.title.toLowerCase().includes(kw) ||
          r.content.toLowerCase().includes(kw) ||
          r.tags.some(t => t.toLowerCase().includes(kw))
      );
    }

    if (params.limit) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  /**
   * 取得統計資訊
   */
  static getStats(companyId?: string): SonnarStats {
    this.init();

    let results = Array.from(this._results.values());
    if (companyId) {
      results = results.filter(r => r.companyId === companyId);
    }

    const byCategory: Record<string, number> = {
      environment: 0,
      social: 0,
      governance: 0,
    };

    results.forEach(r => {
      if (byCategory[r.category] !== undefined) {
        byCategory[r.category]++;
      }
    });

    return {
      totalResults: results.length,
      byCategory,
      lastUpdated: Date.now(),
    };
  }

  /**
   * 取得單一結果
   */
  static getResult(id: string): SonnarResult | undefined {
    this.init();
    return this._results.get(id);
  }
}

// ── Convenience Functions ─────────────────────────────────────

/**
 * 快速查詢 ESG 資訊
 */
export function queryESGSonnar(params: SonnarQuery): SonnarResult[] {
  return ESGSonnarService.query(params);
}

/**
 * 快速取得統計
 */
export function getESGSonnarStats(companyId?: string): SonnarStats {
  return ESGSonnarService.getStats(companyId);
}
