"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  GitBranch, Box, ArrowRight, 
  Activity, Search, Send
} from "lucide-react";

interface TraceNode {
  id: string;
  type: "LLM_CALL" | "TOOL_EXECUTION" | "FINAL_RESPONSE";
  label: string;
  details?: string;
  timestamp: number;
}

interface AdkTracingViewProps {
  trace: TraceNode[];
}

export function AdkTracingView({ trace }: AdkTracingViewProps) {
  if (!trace || trace.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-muted opacity-40">
        <GitBranch className="w-12 h-12 mb-4" />
        <p className="text-sm">尚未有追蹤數據</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8 space-y-8">
      {/* Timeline Line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gradient-to-b from-primary/50 via-border to-primary/50" />

      {trace.map((node, i) => (
        <motion.div
          key={node.id || i}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="relative"
        >
          {/* Timeline Dot */}
          <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 border-bg-base flex items-center justify-center ${
            node.type === "LLM_CALL" ? "bg-primary" : 
            node.type === "TOOL_EXECUTION" ? "bg-accent-blue" : "bg-optimal-success"
          }`}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                node.type === "LLM_CALL" ? "bg-primary/10 text-primary border-primary/20" : 
                node.type === "TOOL_EXECUTION" ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20" : 
                "bg-optimal-success/10 text-optimal-success border-optimal-success/20"
              }`}>
                {node.type}
              </span>
              <span className="text-[10px] text-text-muted">
                {new Date(node.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <h4 className="text-xs font-bold text-text-main mt-1">{node.label}</h4>
            
            {node.details && (
              <div className="mt-2 p-3 rounded-lg bg-bg-surface border border-border">
                <p className="text-[10px] text-text-muted leading-relaxed font-mono truncate hover:whitespace-normal transition-all">
                  {node.details}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
