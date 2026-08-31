// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// src/lib/types/esg-charts.ts
/**
 * ESG Chart Types
 * Shared type definitions for ESG visualization components
 */

export interface ChartDataPoint {
  label: string;
  value: number | null;
  timestamp?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
  borderColor?: string;
  backgroundColor?: string;
}

export interface LineChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  proof?: {
    hashLock: string;
    timestamp?: string;
  };
  height?: number;
  width?: number | string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  smooth?: boolean;
  showPoints?: boolean;
  animation?: boolean;

  /** Density of the line strokes */
  tension?: number;

  /** String of dash array values for styling chart borders */
  borderDash?: readonly string[];

  /** Offset distance for dash array */
  borderDashOffset?: number;

  /** Cap style for border */
  borderCapStyle?: 'butt' | 'round' | 'square';

  borderJoinStyle?: 'miter' | 'round' | 'bevel';

  /** @deprecated since v0.5 */
  showPointIndicators?: boolean;
}

export interface BarChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  proof?: {
    hashLock: string;
    timestamp?: string;
  };
  height?: number;
  width?: number | string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  horizontal?: boolean;
  stacked?: boolean;
  animation?: boolean;
  onClick?: (point: ChartDataPoint) => void;
  className?: string;
}

export interface AreaChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  proof?: {
    hashLock: string;
    timestamp?: string;
  };
  height?: number;
  width?: number | string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  smooth?: boolean;
  fill?: boolean;
  animation?: boolean;
  onClick?: (point: ChartDataPoint) => void;
  className?: string;
}

export interface RadarChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  proof?: {
    hashLock: string;
    timestamp?: string;
  };
  height?: number;
  width?: number | string;
  aspectRatio?: number; /* ratio width/height */
  animate?: boolean;
  onClick?: (point: ChartDataPoint) => void;
  className?: string;
}

export interface ChartCancelledEvent {
  locationX?: number;
  locationY?: number;
  event: React.MouseEvent;
  activeElement?: HTMLElement;
}