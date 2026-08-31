// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// src/lib/omni-component/types.ts
/**
 * Type Definitions for OmniComponent
 * Shared types used across the component library
 */

// Base component configuration
export interface ComponentConfig {
  className?: string;
  id?: string;
  'data-testid'?: string;
}

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon';
export type ComponentVariant = 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';

// Theme configuration
export interface ThemeConfig {
  name: string;
  mode: 'light' | 'dark' | 'system';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    borderColor: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

// Data types
export interface ChartDataPoint {
  label: string;
  value: number | null;
  timestamp?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesData {
  series: ChartDataPoint[];
  metadata: {
    startDate: string;
    endDate: string;
    granularity: 'day' | 'week' | 'month' | 'quarter' | 'year';
    unit: string;
  };
}

export interface ESGMetric {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance' | 'economic';
  value: number;
  unit: string;
  year: number;
  companyId?: string;
  source?: string;
  verified?: boolean;
  proofHash?: string;
}

export interface CompanyData {
  id: string;
  name: string;
  country?: string;
  industry?: string;
  employees?: number;
  revenue?: number;
  website?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Indicator {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance' | 'economic';
  unit: string;
  description?: string;
  formula?: string;
  references?: string[];
  isActive: boolean;
}

// Form types
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'email' | 'url';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: string[];
  helpText?: string;
}

// Table types
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableConfig {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  sortable?: boolean;
  filterable?: boolean;
  pagination?: {
    enabled: boolean;
    pageSize: number;
  };
  selection?: {
    enabled: boolean;
    onSelect?: (rows: Record<string, unknown>[]) => void;
  };
}

// Modal/Dialog types
export interface ModalConfig {
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Chart types
export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'doughnut' | 'radar' | 'scatter';
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  options?: Record<string, unknown>;
  theme?: 'light' | 'dark' | 'auto';
}

// Component prop types for re-export
export type {
  DataCardProps,
  MetricCardProps,
  ProofBadgeProps,
  ButtonProps,
  BadgeProps,
  CardProps,
} from './functional/index';

export type {
  ChartConfig as VisualizationChartConfig,
  LineChartData,
  ESG_COLOR_SCHEMES,
} from './visualization/charts';

export type {
  ValidationRule,
  ValidationResult,
} from './rules';