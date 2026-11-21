"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Terminal, Shield, Cpu, Activity, 
  CheckCircle2, Clock, Code, MessageSquare 
} from "lucide-react";

interface AdkEvent {
  id: string;
  author?: string;
  parts: { text?: string; functionCall?: any; functionResponse?: any }[];
  timestamp: number;
}

interface AdkEventViewerProps {
  events: AdkEvent[];
}

export function AdkEventViewer({ events }: AdkEventViewerProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-text-muted opacity-40">
        <Terminal className="w-12 h-12 mb-4" />
        <p className="text-sm">尚未有事件紀錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-xs">
      {events.map((event, i) => (
        <motion.div
          key={event.id || i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-xl border border-border bg-bg-surface/50 space-y-3"
        >
          <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={event.author === "user" ? "standard" : "optimal"}>
                {event.author === "user" ? "USER" : event.author || "AGENT"}
              </Badge>
              <span className="text-text-muted text-[10px]">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <div className="text-[10px] text-text-muted font-mono opacity-50">
              ID: {event.id?.slice(0, 8)}
            </div>
          </div>

          <div className="space-y-2">
            {event.parts.map((part, pi) => (
              <div key={pi}>
                {part.text && (
                  <div className="flex gap-2">
                    <MessageSquare className="w-3 h-3 text-text-muted mt-0.5 flex-shrink-0" />
                    <p className="text-text-main whitespace-pre-wrap leading-relaxed">{part.text}</p>
                  </div>
                )}
                
                {part.functionCall && (
                  <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <Cpu className="w-3 h-3" />
                      <span className="font-bold">TOOL CALL: {part.functionCall.name}</span>
                    </div>
                    <pre className="text-[10px] text-primary/70 bg-black/20 p-2 rounded overflow-x-auto">
                      {JSON.stringify(part.functionCall.args, null, 2)}
                    </pre>
                  </div>
                )}

                {part.functionResponse && (
                  <div className="mt-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2 text-green-500">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="font-bold">TOOL RESPONSE: {part.functionResponse.name}</span>
                    </div>
                    <pre className="text-[10px] text-green-600 bg-black/20 p-2 rounded overflow-x-auto">
                      {JSON.stringify(part.functionResponse.response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Badge({ children, variant = "standard" }: { children: React.ReactNode; variant?: "standard" | "optimal" }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
      variant === "optimal" ? "bg-primary/10 text-primary border border-primary/20" : "bg-bg-base text-text-muted border border-border"
    }`}>
      {children}
    </span>
  );
}
