// End-to-End Type Safety for ESG Omni Charts

export interface OmniChartProof {
  hashLock: string;
  sourceOrigin: string; // The origin document or API
  timestamp: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string; // Optional custom color overriding the theme
}

export interface BaseOmniChartProps {
  title: string;
  description?: string;
  proof: OmniChartProof; // 5T Protocol Requirement
  height?: number;
  width?: number | string;
}

export interface OmniBarChartProps extends BaseOmniChartProps {
  data: ChartDataPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface OmniPieChartProps extends BaseOmniChartProps {
  data: ChartDataPoint[];
  donut?: boolean;
}

export interface ESGChartKnowledge {
  why: string;
  what: string;
  how: string;
}

export interface OmniDataAnalyticsConfig {
  id: string;
  type: 'bar' | 'pie';
  title: string;
  data: ChartDataPoint[];
  proof: OmniChartProof;
  knowledge?: ESGChartKnowledge;
}
