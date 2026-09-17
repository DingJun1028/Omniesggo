'use client';

import React, { useState, useMemo, useRef } from 'react';
import { LineChartProps, ChartDataPoint } from '@/types/esg-charts';
import { Lock } from 'lucide-react';

export function OmniLineChart({
  title,
  description,
  data,
  proof,
  height = 300,
  width = '100%',
  xAxisLabel,
  yAxisLabel,
  smooth = true,
}: LineChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const padding = { top: 40, right: 20, bottom: 40, left: 50 };
  const graphHeight = Number(height) - padding.top - padding.bottom;
  const viewBoxWidth = 800;
  const graphWidth = viewBoxWidth - padding.left - padding.right;

  const defaultColor = 'var(--accent-teal)';

  const { minValue, valueRange, points, pathD, areaD } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minValue: 0, valueRange: 1, points: [], pathD: '', areaD: '' };
    }
    const stepX = data.length > 1 ? graphWidth / (data.length - 1) : 0;
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const minVal = Math.min(...data.map(d => d.value), 0);
    const valRange = maxVal - minVal || 1;

    const pts = data.map((point, index) => {
      const x = padding.left + stepX * index;
      const y = padding.top + graphHeight - ((point.value - minVal) / valRange) * graphHeight;
      return { x, y, point };
    });

    const pD = pts
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : smooth ? `S ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(' ');

    const aD = `${pD} L ${pts[pts.length - 1].x} ${padding.top + graphHeight} L ${pts[0].x} ${padding.top + graphHeight} Z`;

    return { minValue: minVal, valueRange: valRange, points: pts, pathD: pD, areaD: aD };
  }, [data, padding.left, padding.top, graphWidth, graphHeight, smooth]);

  if (!data || data.length === 0) return <div>No data available</div>;

  return (
    <div className="flex flex-col gap-2 w-full" style={{ width }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-textPrimary font-bold text-base">{title}</h4>
          {description && <p className="text-textSecondary text-xs">{description}</p>}
        </div>
        <div className="flex items-center gap-1 bg-primary px-2 py-1 rounded border border-borderColor/50 text-[10px] text-textSecondary font-mono">
          <Lock size={10} className="text-accentGold" />
          {proof.hashLock.substring(0, 8)}...
        </div>
      </div>

      <div className="relative w-full overflow-visible bg-surface rounded-lg border border-borderColor p-4 shadow-sm">
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
          onMouseMove={(e) => {
            if (tooltipRef.current) {
              const rect = e.currentTarget.getBoundingClientRect();
              tooltipRef.current.style.left = `${e.clientX - rect.left}px`;
              tooltipRef.current.style.top = `${e.clientY - rect.top - 10}px`;
            }
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + graphHeight * (1 - ratio);
            const val = (minValue + valueRange * ratio).toFixed(1);
            return (
              <g key={`grid-${ratio}`}>
                <line x1={padding.left} y1={y} x2={viewBoxWidth - padding.right} y2={y} stroke="currentColor" className="text-borderColor/30" strokeDasharray="4,4" />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="10" className="fill-textSecondary">{val}</text>
              </g>
            );
          })}

          {yAxisLabel && (
            <text x={10} y={padding.top - 15} fontSize="10" className="fill-textSecondary font-bold">{yAxisLabel}</text>
          )}

          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={defaultColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={defaultColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#lineGradient)" />
          <path d={pathD} fill="none" stroke={defaultColor} strokeWidth="2" strokeLinejoin="round" />

          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.label === p.point.label ? 5 : 3}
              fill={p.point.color || defaultColor}
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredPoint(p.point)}
            />
          ))}

          {xAxisLabel && (
            <text x={viewBoxWidth / 2} y={height - 5} textAnchor="middle" fontSize="10" className="fill-textSecondary font-bold">{xAxisLabel}</text>
          )}
        </svg>

        <div
            ref={tooltipRef}
            className={`absolute z-10 bg-primary/95 backdrop-blur border border-borderColor shadow-lg rounded px-3 py-2 text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full ${hoveredPoint ? "opacity-100" : "opacity-0"}`}
          >
            <div className="font-bold text-textPrimary mb-1">{hoveredPoint?.label || ''}</div>
            <div className="text-accentTeal font-mono text-sm">{hoveredPoint?.value || ''}</div>
          </div>
      </div>
    </div>
  );
}
