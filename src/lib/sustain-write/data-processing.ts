// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Data Processing Utilities for ESG Data
 */

export interface DataField {
  key: string;
  label: string;
  type: 'number' | 'string' | 'date' | 'boolean';
  unit?: string;
  required?: boolean;
}

export interface DataQualityIssue {
  field: string;
  issue: 'missing' | 'outlier' | 'format' | 'range';
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export function validateField(value: unknown, field: DataField): DataQualityIssue | null {
  if (value === null || value === undefined || value === '') {
    if (field.required) {
      return { field: field.key, issue: 'missing', severity: 'high', suggestion: `必填欄位 ${field.label} 缺漏` };
    }
    return null;
  }

  if (field.type === 'number') {
    const num = Number(value);
    if (Number.isNaN(num)) {
      return { field: field.key, issue: 'format', severity: 'high', suggestion: `${field.label} 應為數字` };
    }
  }

  return null;
}

export function detectOutliers(values: number[]): { index: number; value: number; zScore: number }[] {
  if (values.length < 3) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length);
  const outliers: { index: number; value: number; zScore: number }[] = [];
  values.forEach((v, i) => {
    const z = std > 0 ? (v - mean) / std : 0;
    if (Math.abs(z) > 2.5) outliers.push({ index: i, value: v, zScore: z });
  });
  return outliers;
}

export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export function gapFillNumeric(series: (number | null)[]): (number | null)[] {
  return series.map((v, i) => {
    if (v !== null && !Number.isNaN(v)) return v;
    const prev = series.slice(0, i).reverse().find(x => x !== null && !Number.isNaN(x));
    const next = series.slice(i + 1).find(x => x !== null && !Number.isNaN(x));
    if (prev != null && next != null) return (prev + next) / 2;
    if (prev != null) return prev;
    if (next != null) return next;
    return null;
  });
}

export function summarizeMetric(values: number[]): { min: number; max: number; avg: number; std: number } {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length);
  return { min, max, avg, std: isNaN(std) ? 0 : std };
}
