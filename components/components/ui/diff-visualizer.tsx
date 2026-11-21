"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FileDiff, AlertCircle } from "lucide-react";

interface DiffVisualizerProps {
  unifiedDiff: string;
  title?: string;
}

/**
 * 💡 Diff Visualizer UI (法規差異比對視覺化組件)
 * 針對 diff-engine.ts 產出的 Unified Diff 格式，用紅綠高亮顯示「新增」與「刪除」內容
 */
export function DiffVisualizer({ unifiedDiff, title = "版本變更比對 (Diff Engine)" }: DiffVisualizerProps) {
  const parsedLines = useMemo(() => {
    if (!unifiedDiff) return [];
    const lines = unifiedDiff.split("\n");
    return lines.map((line, index) => {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        return { type: "add", content: line.substring(1), id: index };
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        return { type: "remove", content: line.substring(1), id: index };
      } else if (line.startsWith("@@")) {
        return { type: "header", content: line, id: index };
      } else if (line.startsWith("---") || line.startsWith("+++")) {
        return { type: "meta", content: line, id: index };
      } else {
        return { type: "context", content: line.substring(1) || line, id: index };
      }
    });
  }, [unifiedDiff]);

  if (!unifiedDiff) {
    return (
      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center gap-3 text-slate-400">
        <AlertCircle className="w-5 h-5" />
        <span>目前沒有偵測到版本變更 (No diff available)</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden font-mono text-sm shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-3 border-b border-slate-700">
        <FileDiff className="w-4 h-4 text-blue-400" />
        <span className="font-bold text-slate-200">{title}</span>
        <div className="ml-auto flex gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
            新增 (Additions)
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <div className="w-2 h-2 rounded-full bg-rose-500/20 border border-rose-500/50" />
            刪除 (Deletions)
          </span>
        </div>
      </div>

      {/* Diff Content */}
      <div className="overflow-x-auto p-4 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
        {parsedLines.map((line) => {
          if (line.type === "add") {
            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={line.id}
                className="flex rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-1"
              >
                <span className="w-6 text-emerald-500/50 select-none">+</span>
                <span className="whitespace-pre-wrap break-words flex-1">{line.content}</span>
              </motion.div>
            );
          }
          if (line.type === "remove") {
            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={line.id}
                className="flex rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-1 line-through decoration-rose-500/50"
              >
                <span className="w-6 text-rose-500/50 select-none">-</span>
                <span className="whitespace-pre-wrap break-words flex-1">{line.content}</span>
              </motion.div>
            );
          }
          if (line.type === "header") {
            return (
              <div key={line.id} className="flex text-blue-400/70 px-2 py-2 mt-2 bg-blue-500/5 rounded text-xs">
                <span className="whitespace-pre-wrap">{line.content}</span>
              </div>
            );
          }
          if (line.type === "meta") {
            return (
              <div key={line.id} className="flex text-slate-500 px-2 py-1 text-xs font-bold">
                <span className="whitespace-pre-wrap">{line.content}</span>
              </div>
            );
          }
          return (
            <div key={line.id} className="flex text-slate-400 px-2 py-0.5 hover:bg-slate-800/50 rounded transition-colors">
              <span className="w-6 text-slate-600 select-none"> </span>
              <span className="whitespace-pre-wrap break-words flex-1">{line.content}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
