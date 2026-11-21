'use client';

import React from 'react';
import { OmniDataAnalyticsConfig } from '@/types/esg-charts';
import { OmniBarChart } from './charts/omni-bar-chart';
import { OmniPieChart } from './charts/omni-pie-chart';
import { FileText, Download, Target } from 'lucide-react';

interface OmniDataAnalyticsPanelProps {
  configs: OmniDataAnalyticsConfig[];
}

export function OmniDataAnalyticsPanel({ configs }: OmniDataAnalyticsPanelProps) {
  if (!configs || configs.length === 0) {
    return (
      <div className="p-8 text-center bg-surface border border-borderColor rounded-xl text-textSecondary">
        無可用的數據圖表。請上傳單據以產生分析。
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h3 className="text-accentTeal font-bold text-lg flex items-center gap-2">
          <Target size={20} /> 智能數據視覺化分析 (Data Analytics)
        </h3>
        <button className="flex items-center gap-2 text-xs text-textSecondary hover:text-accentGold bg-primary px-3 py-1.5 rounded-md border border-borderColor/50 transition-colors">
          <Download size={14} /> 匯出報告資產
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {configs.map((config) => (
          <div key={config.id} className="flex flex-col bg-surface border border-borderColor rounded-xl overflow-hidden shadow-md">
            
            {/* Chart Area */}
            <div className="p-5 flex-grow border-b border-borderColor/50">
              {config.type === 'bar' ? (
                <OmniBarChart
                  title={config.title}
                  data={config.data}
                  proof={config.proof}
                  height={250}
                />
              ) : (
                <OmniPieChart
                  title={config.title}
                  data={config.data}
                  proof={config.proof}
                  height={250}
                />
              )}
            </div>

            {/* Knowledge Extraction Area (Asset as Knowledge) */}
            {config.knowledge && (
              <div className="bg-primary/30 p-5 flex flex-col gap-3">
                <h4 className="text-accentGold text-sm font-bold flex items-center gap-2">
                  <FileText size={16} /> ESG 洞察與建議 (Insights)
                </h4>
                <div className="text-[13px] grid gap-2">
                  <div className="flex gap-2">
                    <span className="font-bold text-accentTeal whitespace-nowrap">Why:</span>
                    <span className="text-textPrimary">{config.knowledge.why}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-accentBlue whitespace-nowrap">What:</span>
                    <span className="text-textPrimary">{config.knowledge.what}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-accentPurple whitespace-nowrap">How:</span>
                    <span className="text-textPrimary">{config.knowledge.how}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
