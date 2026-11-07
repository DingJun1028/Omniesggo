/**
 * Trust Label 契約 (§20 信任標別) — 下沉至 @esggo/omni-core 供各套件 MECE 復用。
 *
 * 權威語義 (對齊 src/lib/omni-core 之 esggo.trustScore/trustGate facade):
 *   low 0.7 | medium 0.85 | high 0.95 | critical 1.0 | authenticated 0.9
 *   未知等級 → 分數 0, 無 fallback (fail-closed, 與工具權限 default-deny 同一哲學)。
 *
 * 5T 對應: Trustworthy (信任分數可驗收) / Transparent (門檻顯式可見)
 */
export type TrustLevel = 'low' | 'medium' | 'high' | 'critical' | 'authenticated';

/** 各信任等級之分數門檻 (唯讀, 不可熱改) */
export const TRUST_LEVEL_SCORE: Readonly<Record<TrustLevel, number>> = Object.freeze({
  low: 0.7, medium: 0.85, high: 0.95, critical: 1.0, authenticated: 0.9,
});

/** 信任分數: 未知等級一律 0 (無 fallback) */
export function trustScore(level: string): number {
  return (TRUST_LEVEL_SCORE as Readonly<Record<string, number>>)[level] ?? 0;
}

/** 信任門控: 分數是否達到指定等級門檻 (≥ 判定) */
export function trustGate(score: number, required: TrustLevel): boolean {
  return score >= (TRUST_LEVEL_SCORE[required] ?? 0);
}
