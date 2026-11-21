"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TEN_WINGS_APOSTLES, 
  APOSTLE_CLUSTERS, 
  ARCANE_ARTS,
  type ApostleCluster,
  type ApostleMetadata 
} from "@/lib/adk/ten-wings";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Zap, Cpu, RefreshCw, CheckCircle2, 
  Activity, Lock, AlertTriangle, ChevronDown, 
  ChevronRight, Sparkles, Target
} from "lucide-react";
import { getApostleStatusesAction } from "@/lib/actions/adk-actions";

const CLUSTER_ICONS: Record<ApostleCluster, React.ElementType> = {
  Architectural: Shield,
  Execution:     Zap,
  Orchestration: Cpu,
  Evolution:     RefreshCw,
};

type ApostleRuntime = {
  status: "ONLINE" | "STANDBY" | "COMPUTING" | "SEALED";
  entropy: number;
  lastAction: string;
};

export function TenWingsStatus() {
  const [progress, setProgress] = useState(0);
  const [expandedCluster, setExpandedCluster] = useState<ApostleCluster | null>("Architectural");
  const [selectedApostle, setSelectedApostle] = useState<ApostleMetadata | null>(null);
  const [runtimes, setRuntimes] = useState<Record<string, ApostleRuntime>>({});

  // Actual status sync
  useEffect(() => {
    const syncStatus = async () => {
      const response = await getApostleStatusesAction();
      if (response.success && response.data) {
        const newRuntimes: Record<string, ApostleRuntime> = {};
        response.data.forEach((a: any) => {
          newRuntimes[a.id] = {
            status: a.status === "ONLINE" ? "ONLINE" : "STANDBY",
            entropy: 0.04, // Default or calculated
            lastAction: a.status === "ONLINE" ? "Standby" : "Offline",
          };
        });
        setRuntimes(newRuntimes);
        setProgress(100);
      }
    };

    syncStatus();
    const interval = setInterval(syncStatus, 10000); // Sync every 10s
    return () => clearInterval(interval);
  }, []);

  const clusters: ApostleCluster[] = ["Architectural", "Execution", "Orchestration", "Evolution"];
  const onlineCount = Object.values(runtimes).filter(r => r.status === "ONLINE").length;

  return (
    <GlassCard className="p-0 overflow-hidden border-primary/10">
      {/* Header */}
      <div className="p-5 border-b border-border bg-bg-base/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Cpu className="w-5 h-5 text-primary" />
              <motion.div 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-1 bg-primary/20 blur-md rounded-full -z-10"
              />
            </div>
            <div>
              <h3 className="font-black text-sm text-text-main tracking-widest uppercase">ADK 十翼使徒</h3>
              <p className="text-[9px] font-mono text-text-muted tracking-tighter">奧義六式 · 進化矩陣 v2.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-500">{onlineCount}/10 ONLINE</span>
            </div>
            <Badge variant={progress < 100 ? "lethal" : "optimal"} styleType="soft">
              {progress < 100 ? `BOOT ${Math.floor(progress)}%` : "ACTIVE"}
            </Badge>
          </div>
        </div>

        {/* Master Progress Bar */}
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-accent"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Cluster Pills */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {clusters.map(cluster => {
            const cfg = APOSTLE_CLUSTERS[cluster];
            const Icon = CLUSTER_ICONS[cluster];
            const members = TEN_WINGS_APOSTLES.filter(a => a.cluster === cluster);
            const onlineMem = members.filter(a => runtimes[a.id]?.status === "ONLINE").length;
            return (
              <button
                key={cluster}
                onClick={() => setExpandedCluster(expandedCluster === cluster ? null : cluster)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  expandedCluster === cluster 
                    ? "border-primary/40 bg-primary/10 text-primary" 
                    : "border-border bg-bg-surface text-text-muted hover:border-primary/20"
                }`}
              >
                <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                {cfg.label}
                <span className="text-[9px] opacity-70">({onlineMem}/{members.length})</span>
                {expandedCluster === cluster ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apostle Matrix */}
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {expandedCluster && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="p-4 space-y-2"
            >
              {TEN_WINGS_APOSTLES
                .filter(a => a.cluster === expandedCluster)
                .map(apostle => {
                  const runtime = runtimes[apostle.id];
                  const arcane = ARCANE_ARTS[apostle.arcane];
                  const isSelected = selectedApostle?.id === apostle.id;

                  return (
                    <motion.div
                      key={apostle.id}
                      layout
                      onClick={() => setSelectedApostle(isSelected ? null : apostle)}
                      className={`rounded-xl border cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? "border-primary/30 bg-primary/5" 
                          : "border-border bg-bg-surface/50 hover:border-primary/20 hover:bg-bg-surface"
                      }`}
                    >
                      {/* Row */}
                      <div className="flex items-center gap-3 p-3">
                        {/* ID Badge */}
                        <span className="text-[11px] font-black font-mono text-primary bg-primary/10 rounded-md px-1.5 py-0.5 flex-shrink-0">
                          [{apostle.id}]
                        </span>

                        {/* Name & Arcane */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-text-main leading-tight truncate">{apostle.name}</p>
                            <span 
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border leading-none flex-shrink-0"
                              style={{ 
                                color: arcane.color, 
                                borderColor: arcane.color + "40",
                                backgroundColor: arcane.color + "15"
                              }}
                            >
                              第{arcane.art}式 · {apostle.arcane}
                            </span>
                          </div>
                          <p className="text-[9px] text-text-muted mt-0.5 truncate">{apostle.role}</p>
                        </div>

                        {/* Pillars */}
                        <div className="flex gap-0.5 flex-shrink-0">
                          {apostle.pillars.map(p => (
                            <span key={p} className="text-[8px] font-bold text-primary bg-primary/10 px-1 rounded">
                              【{p}】
                            </span>
                          ))}
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0 flex items-center gap-1.5">
                          {runtime ? (
                            <>
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                              <span className="text-[9px] font-mono text-green-500">ONLINE</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 bg-text-muted rounded-full flex-shrink-0" />
                              <span className="text-[9px] font-mono text-text-muted">BOOT...</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/50 mx-3 overflow-hidden"
                          >
                            <div className="py-3 space-y-3">
                              {/* Mandate */}
                              <div className="p-2 rounded-lg bg-bg-base/50 border border-border/50">
                                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-1.5">MECE 責任聲明</p>
                                <p className="text-[10px] text-text-main leading-relaxed">{apostle.mandate}</p>
                              </div>

                              {/* KPI + Entropy */}
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                                  <p className="text-[8px] font-bold text-green-500 uppercase mb-1">KPI 目標</p>
                                  <p className="text-[9px] text-text-main leading-tight">{apostle.kpi}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                  <p className="text-[8px] font-bold text-blue-500 uppercase mb-1">目標熵值</p>
                                  <div className="flex items-center gap-1">
                                    <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-500" 
                                        style={{ width: `${apostle.entropyTarget * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-[9px] font-mono text-blue-500">{(apostle.entropyTarget * 100).toFixed(0)}%</span>
                                  </div>
                                </div>
                              </div>

                              {/* Rune File */}
                              <div className="flex items-center gap-2 text-[9px] font-mono text-text-muted">
                                <Lock className="w-3 h-3 text-primary" />
                                <span className="text-primary">符文：</span>
                                <code className="text-text-main">{apostle.runeFile}</code>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
            </motion.div>
          )}
        </AnimatePresence>

        {!expandedCluster && (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-text-muted opacity-30">
            <Sparkles className="w-10 h-10" />
            <p className="text-xs text-center">點選上方集群標籤<br/>展開查看使徒詳情</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-border bg-bg-base/30 grid grid-cols-4 gap-2">
        {clusters.map(cluster => {
          const cfg = APOSTLE_CLUSTERS[cluster];
          const Icon = CLUSTER_ICONS[cluster];
          const members = TEN_WINGS_APOSTLES.filter(a => a.cluster === cluster);
          return (
            <div key={cluster} className="flex items-center gap-1.5">
              <div className="p-1 rounded-md" style={{ backgroundColor: cfg.color + "20" }}>
                <Icon className="w-3 h-3" style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-text-main leading-none">{cfg.label}</p>
                <p className="text-[8px] text-text-muted leading-none mt-0.5">{members.length} 名使徒</p>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
