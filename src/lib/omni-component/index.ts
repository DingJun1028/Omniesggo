// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// src/lib/omni-component/index.ts
// Main entry point for OmniComponent
// Re-exports all public interfaces and implementations

// Core types
export type {
  ComponentConfig,
  ComponentSize,
  ComponentVariant,
} from './types';

export type {
  ThemeConfig,
} from './types';

export type {
  ChartDataPoint,
  TimeSeriesData,
  ESGMetric,
  CompanyData,
  Indicator,
  FormFieldConfig,
  TableColumn,
  TableConfig,
  ModalConfig,
  Notification,
  NotificationType,
  ChartConfig,
} from './types';

export type {
  DataCardProps,
  MetricCardProps,
  ProofBadgeProps,
  ButtonProps,
  BadgeProps,
  CardProps,
} from './functional/index';

// UI Utilities
export {
  cn,
  variantClasses,
  sizeClasses,
  responsive,
  cssVar,
  transition,
} from './ui/utils';

export {
  applyTheme,
  createCard,
  createButton,
  createInput,
  debounce,
  throttle,
} from './ui/utils';

// Validation Rules
export {
  ESG_VALIDATION_RULES,
  ValidationRule,
  ValidationResult,
  validate,
  validateESGMetric,
  validateCompanyData,
  validateIndicator,
  createCompositeValidator,
} from './rules';

// Visualization
export {
  validateChartData,
  generateColorScheme,
  createLineChartConfig,
  createBarChartConfig,
  createRadialChartConfig,
  type LineChartData,
  type ChartConfig as ChartConfigType,
} from './visualization/charts';

// Functional Components
export {
  DataCard,
  MetricCard,
  ProofBadge,
  Button,
  Badge,
  Card,
} from './functional/index';

// Export all UI components from ui/index
export * from './ui/index';

// Export all visualization components
export * from './visualization/index';