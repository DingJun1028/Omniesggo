// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Business Intelligence — ESG商情數據整合模組
 */

export interface MarketSignal {
  id: string;
  category: 'market' | 'policy' | 'supply_chain' | 'risk_event' | 'technology' | 'investment';
  title: string;
  sourceName: string;
  confidence: number;
  relevance: string[];
  detectedAt: string;
}

export interface CompetitorSnapshot {
  companyName: string;
  esgScore?: number;
  carbonIntensity?: number;
  disclosedTopics: string[];
  momentum: 'rising' | 'stable' | 'declining';
}

export function estimateGap(current: number, target: number): number {
  return Math.max(0, target - current);
}

export function benchmarkPercentile(companyScore: number, marketScores: number[]): number {
  const sorted = [...marketScores].sort((a, b) => a - b);
  const rank = sorted.filter(s => s <= companyScore).length;
  return Math.round((rank / sorted.length) * 100);
}

export function summarizeTrend(values: number[]): 'up' | 'flat' | 'down' {
  if (values.length < 2) return 'flat';
  const first = values[0];
  const last = values[values.length - 1];
  if (last > first * 1.05) return 'up';
  if (last < first * 0.95) return 'down';
  return 'flat';
}

export class BizIntelligenceEngine {
  private signals: MarketSignal[] = [];

  addSignal(signal: MarketSignal): void {
    this.signals.push(Object.freeze(signal));
  }

  getSignals(category?: MarketSignal['category']): MarketSignal[] {
    if (!category) return [...this.signals];
    return this.signals.filter(s => s.category === category);
  }

  getTopSignals(limit = 5): MarketSignal[] {
    return [...this.signals].sort((a, b) => b.confidence - a.confidence).slice(0, limit);
  }

  computeMomentum(series: { date: string; value: number }[]): 'up' | 'flat' | 'down' {
    return summarizeTrend(series.map(s => s.value));
  }
}

export const bizIntelligence = new BizIntelligenceEngine();
