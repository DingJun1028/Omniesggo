"use client";

import React from "react";
import { Lightbulb, ArrowRight } from "lucide-react";
import { ESGChartKnowledge } from "@/types/esg-charts";

interface InsightItem {
  id: string;
  knowledge: ESGChartKnowledge;
  sourceLabel: string;
}

interface InsightGridProps {
  insights: InsightItem[];
}

export function InsightGrid({ insights }: InsightGridProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-accentTeal font-bold text-lg flex items-center gap-2">
        <Lightbulb size={20} /> ESG 知識點洞察 (Knowledge Insights)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((item) => (
          <div
            key={item.id}
            className="bg-surface border border-borderColor rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 group"
          >
            <div className="text-xs font-mono text-textSecondary bg-primary self-start px-2 py-1 rounded">
              來源: {item.sourceLabel}
            </div>

            <div className="flex-grow flex flex-col gap-2 text-[13px]">
              <div>
                <span className="font-bold text-accentTeal block mb-0.5">
                  Why 為什麼重要？
                </span>
                <span className="text-textPrimary line-clamp-2">
                  {item.knowledge.why}
                </span>
              </div>
              <div>
                <span className="font-bold text-accentBlue block mb-0.5">
                  What 紀錄了什麼？
                </span>
                <span className="text-textPrimary line-clamp-2">
                  {item.knowledge.what}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-3 border-t border-borderColor/50">
              <span className="font-bold text-accentPurple block mb-1">
                How 具體建議
              </span>
              <span className="text-textPrimary text-[13px]">
                {item.knowledge.how}
              </span>
            </div>

            <div className="mt-auto pt-2 flex justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <button
                className="text-accentGold text-xs flex items-center gap-1 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentGold rounded-sm px-1 py-0.5"
                aria-label={`探索 ${item.sourceLabel} 的行動方案`}
              >
                探索行動方案 <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
