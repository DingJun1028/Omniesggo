// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// src/lib/sustain-write/index.ts
// Re-export key utilities from each module

// Theme Manager
export { ThemeManager, type ThemeMode, type BrandTheme, DEFAULT_THEMES } from './theme-manager';

// Data Processing
export {
  type DataField,
  type DataQualityIssue,
  validateField,
  detectOutliers,
  normalizeValue,
  summarizeMetric,
  gapFillNumeric,
} from './data-processing';

// Business Intelligence
export {
  type MarketSignal,
  type CompetitorSnapshot,
  estimateGap,
  benchmarkPercentile,
  summarizeTrend,
  BizIntelligenceEngine,
  bizIntelligence,
} from './biz-intelligence';

// C-Version Report API
export {
  getAvailableCompanies,
  assembleCVersionReport,
  reportToHtml,
  reportToMarkdown,
} from './c-version';