'use client';

import React, { useState, useMemo } from 'react';
import { OmniBarChartProps, ChartDataPoint } from '@/types/esg-charts';
import { Lock } from 'lucide-react';

export function OmniBarChart({
  title,
  description,
  data,
  proof,
  height = 300,
  width = '100%',
  xAxisLabel,
  yAxisLabel
}: OmniBarChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const padding = { top: 40, right: 20, bottom: 40, left: 50 };
  const graphHeight = Number(height) - padding.top - padding.bottom;
  
  // Hardcode viewBox width for relative coordinate calculation
  const viewBoxWidth = 600;
  const graphWidth = viewBoxWidth - padding.left - padding.right;
  
  const defaultColor = 'var(--accent-teal)';

  const { gridLines, bars } = useMemo(() => {
    if (!data || data.length === 0) return { gridLines: [], bars: [] };
    const maxVal = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
    const bWidth = Math.min((graphWidth / data.length) * 0.6, 40);
    const bSpacing = (graphWidth - (bWidth * data.length)) / (data.length + 1);

    const generatedGridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const y = padding.top + graphHeight * (1 - ratio);
      const val = (maxVal * ratio).toFixed(1);
      return { ratio, y, val };
    });

    const generatedBars = data.map((point, index) => {
      const x = padding.left + bSpacing + (index * (bWidth + bSpacing));
      const barHeight = (point.value / maxVal) * graphHeight;
      const y = padding.top + graphHeight - barHeight;
      return { point, index, x, y, barHeight, barWidth: bWidth };
    });

    return { gridLines: generatedGridLines, bars: generatedBars };
  }, [data, graphWidth, graphHeight, padding.left, padding.top]);

  if (!data || data.length === 0) return <div>No data available</div>;

  return (
    <div className="flex flex-col gap-2 w-full" style={{ width }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-textPrimary font-bold text-base">{title}</h4>
          {description && <p className="text-textSecondary text-xs">{description}</p>}
        </div>
        {/* 5T Trustworthy Label */}
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
            const rect = e.currentTarget.getBoundingClientRect();
            setMousePos({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
            });
          }}
        >
          {/* Grid Lines & Y-Axis Labels */}
          {gridLines.map(({ ratio, y, val }) => (
            <g key={`grid-${ratio}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={viewBoxWidth - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-borderColor/30"
                strokeDasharray="4,4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                className="fill-textSecondary"
              >
                {val}
              </text>
            </g>
          ))}

          {yAxisLabel && (
            <text 
              x={10} 
              y={padding.top - 15} 
              fontSize="10" 
              className="fill-textSecondary font-bold"
            >
              {yAxisLabel}
            </text>
          )}

          {/* Bars */}
          {bars.map(({ point, index, x, y, barHeight, barWidth }) => {
            const isHovered = hoveredPoint?.label === point.label;
            
            return (
              <g key={`bar-${index}`}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={point.color || defaultColor}
                  className={`transition-all duration-300 ease-in-out cursor-pointer ${isHovered ? 'opacity-80' : 'opacity-100'}`}
                  rx={4} // Rounded corners
                  onMouseEnter={() => setHoveredPoint(point)}
                />
                <text
                  x={x + barWidth / 2}
                  y={padding.top + graphHeight + 15}
                  textAnchor="middle"
                  fontSize="10"
                  className={`transition-colors ${isHovered ? 'fill-textPrimary font-bold' : 'fill-textSecondary'}`}
                >
                  {point.label}
                </text>
              </g>
            );
          })}

          {xAxisLabel && (
            <text 
              x={viewBoxWidth / 2} 
              y={height - 5} 
              textAnchor="middle" 
              fontSize="10" 
              className="fill-textSecondary font-bold"
            >
              {xAxisLabel}
            </text>
          )}
        </svg>

        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div 
            className="absolute z-10 bg-primary/95 backdrop-blur border border-borderColor shadow-lg rounded px-3 py-2 text-xs pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ 
              left: mousePos.x, 
              top: mousePos.y - 10 
            }}
          >
            <div className="font-bold text-textPrimary mb-1">{hoveredPoint.label}</div>
            <div className="text-accentTeal font-mono text-sm">{hoveredPoint.value}</div>
          </div>
        )}
      </div>
    </div>
  );
}
