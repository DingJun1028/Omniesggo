// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:結界]
import { randomUUID, createHash } from 'crypto';
import type {
  CompetitorSnapshot,
  IndustryDataPoint,
  MarketSignal,
  OmniBizInsight,
  TrendSeries,
} from './types';

// ---- 5T 鎖：可用於任何子物件 ----
export function hashLock(obj: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...obj };
  const payload = JSON.stringify(copy);
  const hash = createHash('sha256').update(payload).digest('hex');
  return Object.freeze({ ...copy, _hash_lock: hash });
}

export function sealInsight(insight: Omit<OmniBizInsight, 'evidenceHash' | 'sealedAt'>): OmniBizInsight {
  const evidenceHash = createHash('sha256').update(JSON.stringify(insight.payload)).digest('hex');
  return Object.freeze({
    ...insight,
    evidenceHash,
    sealedAt: new Date().toISOString(),
  });
}

/** 簡單趨勢：起點/中點/終點三點比對 */
export function trendDirection(series: number[]): 'up' | 'flat' | 'down' {
  if (series.length < 2) return 'flat';
  const first = series[0];
  const last = series[series.length - 1];
  if (last > first * 1.05) return 'up';
  if (last < first * 0.95) return 'down';
  return 'flat';
}

export function gravityTwo(a: number, b: number): number {
  // 雙向引力模型：差異越大，吸引力越弱（單調衰減）
  const diff = Math.abs(a - b);
  if (diff === 0) return 1;
  return 1 / (1 + diff);
}

export class OmniBizEngine {
  private signals: MarketSignal[] = [];
  private competitors: CompetitorSnapshot[] = [];
  private industryPoints: IndustryDataPoint[] = [];
  private trendSeries: TrendSeries[] = [];

  /** Traceable：新增市場訊號，帶 source_origin 加註 */
  addSignal(signal: MarketSignal): MarketSignal {
    const stamped = {
      ...signal,
      source_origin: {
        module: 'omni-biz',
        subsystem: 'market-signal',
        version: '0.1.0',
        receivedAt: new Date().toISOString(),
      },
    };
    this.signals.push(Object.freeze(stamped));
    return Object.freeze(stamped);
  }

  /** Traceable：新增競爭對手快照 */
  addCompetitor(c: CompetitorSnapshot): CompetitorSnapshot {
    this.competitors.push(Object.freeze({ ...c, origin: 'omni-biz' }));
    return Object.freeze(c);
  }

  /** Traceable：新增業界數據點 */
  addIndustryPoint(p: IndustryDataPoint): IndustryDataPoint {
    this.industryPoints.push(Object.freeze({ ...p, origin: 'omni-biz' }));
    return Object.freeze(p);
  }

  /** Tangible：趨勢線（外露給視覺化層使用） */
  getTrendSeries(label: string, values: number[], _unit: string): TrendSeries {
    const points = values.map((v, i) => ({ date: `2026-W${String(i + 1).padStart(2, '0')}`, value: v }));
    const series: TrendSeries = Object.freeze({ label, points });
    this.trendSeries.push(series);
    return series;
  }

  /** Transparent：競爭對手範圍分析（重複、可驗算） */
  analyzeCompetitor(name: string): CompetitorSnapshot[] {
    return this.competitors.filter(c => c.companyName === name);
  }

  /** Transparent：行業指標百分位比較 */
  benchmarkPercentile(sector: string, tag: string, value: number): number {
    const items = this.industryPoints.filter(p => p.sector === sector && p.tag === tag);
    if (items.length === 0) return 0;
    const sorted = [...items].sort((a, b) => a.value - b.value);
    const rank = sorted.filter(p => p.value <= value).length;
    return Math.round((rank / sorted.length) * 100);
  }

  /** Trackable：聚合儀表盤（可接 OmniAgentBus 廣播） */
  async dashboardSnapshot(): Promise<Record<string, unknown>> {
    return Object.freeze({
      signalCount: this.signals.length,
      competitorCount: this.competitors.length,
      industryPoints: this.industryPoints.map(p => Object.freeze({ ...p })),
      trendLabels: [...this.trendSeries].map(s => s.label),
      sealedAt: new Date().toISOString(),
    });
  }

  /** 產出可驗證洞察 */
  deriveInsights(): OmniBizInsight[] {
    const out: OmniBizInsight[] = [];
    const tags = Array.from(new Set(this.industryPoints.map(p => p.tag)));
    for (const tag of tags) {
      const vals = this.industryPoints.filter(p => p.tag === tag).map(p => p.value);
      const direction = trendDirection(vals);
      const insight: OmniBizInsight = {
        id: randomUUID(),
        kind: 'benchmarking',
        payload: { tag, samples: vals.length, direction, ofTotal: this.industryPoints.length },
        evidenceHash: '', // sealed by sealInsight
        sealedAt: '',
      };
      out.push(sealInsight(insight));
    }
    return out;
  }

  toJSON(): Record<string, unknown> {
    return Object.freeze({
      signals: this.signals.map(s => Object.freeze({ ...s })),
      competitors: this.competitors.map(c => Object.freeze({ ...c })),
      industryPoints: this.industryPoints.map(p => Object.freeze({ ...p })),
      trendSeries: this.trendSeries.map(s => Object.freeze({ ...s })),
    });
  }
}

/** 單例 */
export const omniBiz = new OmniBizEngine();
