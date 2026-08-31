// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// src/lib/omni-component/visualization/charts.ts
/**
 * Chart Configuration Utilities for OmniComponent
 * Provides standardized chart configurations for ESG visualizations
 */

import type { ChartDataPoint } from '../../types/esg-charts';

/**
 * Color schemes optimized for ESG reporting and accessibility
 */
export const ESG_COLOR_SCHEMES = {
  // Environmental focus
  environment: {
    primary: '#10b981', // emerald-500
    secondary: '#34d399', // emerald-300
    accent: '#6ee7b7', // emerald-200
    background: '#d1fae5', // emerald-50
  },
  // Social focus
  social: {
    primary: '#3b82f6', // blue-500
    secondary: '#60a5fa', // blue-300
    accent: '#93c5fd', // blue-200
    background: '#dbeafe', // blue-50
  },
  // Governance focus
  governance: {
    primary: '#8b5cf6', // violet-500
    secondary: '#a78bfa', // violet-300
    accent: '#c4b5fd', // violet-200
    background: '#e9d5ff', // violet-50
  },
  // Combined ESG palette
  esg: {
    primary: '#6366f1', // indigo-500
    secondary: '#818cf8', // indigo-300
    accent: '#a5b4fc', // indigo-200
    background: '#e0e7ff', // indigo-50
  },
  // Monochrome for accessibility
  mono: {
    primary: '#6366f1',
    secondary: '#818cf8',
    accent: '#a5b4fc',
    background: '#e0e7ff',
  },
} as const;

/**
 * Validate chart data meets minimum requirements
 * @param data Array of data points to validate
 * @returns Validation result with errors if any
 */
export function validateChartData(data: ChartDataPoint[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data || data.length === 0) {
    errors.push('Data array is empty or null');
    return { valid: false, errors };
  }

  data.forEach((point, index) => {
    if (point.label === undefined || point.label === '') {
      errors.push(`Data point at index ${index} has missing or empty label`);
    }
    if (point.value === undefined || point.value === null) {
      errors.push(`Data point at index ${index} has missing or null value`);
    }
    if (typeof point.value !== 'number') {
      errors.push(`Data point at index ${index} has non-numeric value: ${point.value}`);
    }
  });

  // Check for duplicate labels
  const labels = data.map(p => p.label);
  const duplicateLabels = labels
    .filter((item, index) => labels.indexOf(item) !== index)
    .filter((item, index, self) => self.indexOf(item) === index); // unique duplicates

  if (duplicateLabels.length > 0) {
    errors.push(`Duplicate labels found: ${duplicateLabels.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a color scheme based on data length and theme
 * @param length Number of data points/series
 * @param theme Optional theme name ('environment', 'social', 'governance', 'esg', 'mono')
 * @returns Array of colors
 */
export function generateColorScheme(
  length: number,
  theme: keyof typeof ESG_COLOR_SCHEMES = 'esg'
): string[] {
  const baseColors = ESG_COLOR_SCHEMES[theme];
  const colors = [
    baseColors.primary,
    baseColors.secondary,
    baseColors.accent,
  ];

  // If we need more colors than base, generate variations
  if (length <= colors.length) {
    return colors.slice(0, length);
  }

  // Generate additional colors by adjusting lightness/saturation
  const result: string[] = [...colors];
  const baseHSL = hexToHsl(baseColors.primary);

  for (let i = 3; i < length; i++) {
    // Vary lightness
    const lightness = Math.max(20, Math.min(80, 50 + (i - 3) * 10));
    const saturation = Math.max(30, Math.min(80, 70 - (i - 3) * 5));
    const color = hslToString(baseHSL.h, saturation, lightness);
    result.push(color);
  }

  return result.slice(0, length);
}

/**
 * Create line chart configuration
 * @param data Chart data
 * @param options Chart options
 * @returns Chart configuration object
 */
export function createLineChartConfig(
  data: ChartDataPoint[],
  options: {
    title?: string;
    subtitle?: string;
    smooth?: boolean;
    showPoints?: boolean;
    tension?: number;
    fill?: boolean;
  } = {}
): Record<string, unknown> {
  const {
    title = '',
    subtitle = '',
    smooth = true,
    showPoints = true,
    tension = 0.3,
    fill = true,
  } = options;

  const validation = validateChartData(data);
  if (!validation.valid) {
    throw new Error(`Invalid chart data: ${validation.errors.join(', ')}`);
  }

  const labels = data.map(d => d.label);
  const values = data.map(d => d.value ?? 0);
  const colors = generateColorScheme(data.length);

  return {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: title || 'ESG Metric',
          data: values,
          borderColor: colors[0],
          backgroundColor: fill ? `${colors[0]}20` : 'transparent',
          borderWidth: 2,
          borderDash: [],
          borderCapStyle: 'butt',
          borderDashOffset: 0,
          borderJoinStyle: 'miter',
          pointBackgroundColor: colors[0],
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: colors[0],
          pointRadius: showPoints ? 3 : 0,
          pointHoverRadius: showPoints ? 5 : 0,
          fill: fill ? '+1' : false,
          tension: smooth ? tension : 0,
          pointHitRadius: 5,
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        subtitle: {
          display: !!subtitle,
          text: subtitle,
          font: {
            size: 12,
            weight: 'normal',
          },
        },
        legend: {
          display: false,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'Period',
          },
          grid: {
            display: false,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Value',
          },
          grid: {
            drawBorder: false,
          },
          ticks: {
            // Add a nice tick format
            callback: (value: number) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
              return value.toString();
            },
          },
        },
      },
    },
  };
}

/**
 * Create bar chart configuration
 * @param data Chart data
 * @param options Chart options
 * @returns Chart configuration object
 */
export function createBarChartConfig(
  data: ChartDataPoint[],
  options: {
    title?: string;
    subtitle?: string;
    stacked?: boolean;
    horizontal?: boolean;
  } = {}
): Record<string, unknown> {
  const {
    title = '',
    subtitle = '',
    stacked: _stacked = false,
    horizontal = false,
  } = options;

  const validation = validateChartData(data);
  if (!validation.valid) {
    throw new Error(`Invalid chart data: ${validation.errors.join(', ')}`);
  }

  const labels = data.map(d => d.label);
  const values = data.map(d => d.value ?? 0);
  const colors = generateColorScheme(data.length);

  return {
    type: horizontal ? 'horizontalBar' : 'bar',
    data: {
      labels,
      datasets: [
        {
          label: title || 'ESG Metric',
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace(')', ', 0.8)').replace('rgb(', 'rgba(')),
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: horizontal ? 'y' : 'x',
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        subtitle: {
          display: !!subtitle,
          text: subtitle,
          font: {
            size: 12,
            weight: 'normal',
          },
        },
        legend: {
          display: false,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            drawBorder: false,
          },
        },
        x: {
          beginAtZero: true,
          grid: {
            display: false,
          },
        },
      },
    },
  };
}

/**
 * Create radial/pie chart configuration
 * @param data Chart data
 * @param options Chart options
 * @returns Chart configuration object
 */
export function createRadialChartConfig(
  data: ChartDataPoint[],
  options: {
    title?: string;
    subtitle?: string;
    type?: 'pie' | 'doughnut';
  } = {}
): Record<string, unknown> {
  const {
    title = '',
    subtitle = '',
    type = 'doughnut',
  } = options;

  const validation = validateChartData(data);
  if (!validation.valid) {
    throw new Error(`Invalid chart data: ${validation.errors.join(', ')}`);
  }

  const labels = data.map(d => d.label);
  const values = data.map(d => d.value ?? 0);
  const colors = generateColorScheme(data.length);

  return {
    type,
    data: {
      labels,
      datasets: [
        {
          label: title || 'ESG Distribution',
          data: values,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 2,
          hoverBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title,
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        subtitle: {
          display: !!subtitle,
          text: subtitle,
          font: {
            size: 12,
            weight: 'normal',
          },
        },
        legend: {
          position: 'right',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
            },
          },
        },
        tooltip: {
          callbacks: {
            label: (context: { label: string; parsed: number; dataset: { data: number[] } }) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const sum = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value as number) / sum * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
          },
        },
      },
    },
  };
}

/**
 * Utility: Convert hex color to HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Normalize hex format
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);

  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
}

/**
 * Utility: Convert HSL to CSS color string
 */
function hslToString(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

export type {
  ChartDataPoint,
} from '../../types/esg-charts';

export type {
  // These are internal types for chart configs
  // In a real implementation, these would come from Chart.js types
  ChartConfig,
} from 'chart.js';

// Re-export color schemes for external use
export { ESG_COLOR_SCHEMES };