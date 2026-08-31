// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * SaaS 多租戶與訂閱制模組 (mod-agc-billing-0001)
 * 對齊《永續報告書架構補強建議》路徑二：商業化落地。
 */

export type SubscriptionTier = 'CORE' | 'ADVANCED' | 'UNIVERSE';

export interface TierFeatures {
  maxReportsPerYear: number;
  canUseMagicLink: boolean;
  canSummonDrThoth: boolean;
  canExportPDF: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierFeatures> = {
  CORE: {
    maxReportsPerYear: 3,
    canUseMagicLink: false,
    canSummonDrThoth: false,
    canExportPDF: true,
  },
  ADVANCED: {
    maxReportsPerYear: 10,
    canUseMagicLink: true,
    canSummonDrThoth: false,
    canExportPDF: true,
  },
  UNIVERSE: {
    maxReportsPerYear: 9999,
    canUseMagicLink: true,
    canSummonDrThoth: true,
    canExportPDF: true,
  },
};
