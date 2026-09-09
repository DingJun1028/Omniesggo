"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Share2, 
  Zap, 
  Cpu, 
  ShieldCheck, 
  Lock, 
  Activity, 
  Target, 
  ArrowRight,
  Sparkles,
  Database,
  Fingerprint,
  RefreshCw
} from "lucide-react";
import { ViewHeader } from "@/components/ui/view-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GuideStepper } from "@/components/ui/guide-stepper";
import { TenWingsStatus } from "@/components/ui/ten-wings-status";
import { useAppContext } from "@/lib/context/app-context";
import { engraveHashLock } from "@/lib/adk/engraver";
import { IComponentCore } from "@/lib/types/esg-core";
import { PAGE_GUIDES } from "@/lib/config/guides";

// --- Types ---
interface ImpactNode {
  id: string;
  name: string;
  category: "E" | "S" | "G";
  impact_score: number;
  nexus_count: number;
  status: "idle" | "computing" | "sealed";
  data?: IComponentCore;
}

const MOCK_NODES: ImpactNode[] = [
  { id: "NX-001", name: "碳揭露連結率", category: "E", impact_score: 95, nexus_count: 12, status: "idle" },
  { id: "NX-002", name: "供應鏈人權模型", category: "S", impact_score: 82, nexus_count: 8, status: "idle" },
  { id: "NX-003", name: "董事會數位轉型", category: "G", impact_score: 88, nexus_count: 5, status: "idle" },
  { id: "NX-004", name: "生物多樣性映射", category: "E", impact_score: 74, nexus_count: 15, status: "idle" },
  { id: "NX-005", name: "員工共融影響力", category: "S", impact_score: 91, nexus_count: 22, status: "idle" },
  { id: "NX-006", name: "反貪腐自動稽核", category: "G", impact_score: 98, nexus_count: 4, status: "idle" },
];

export function ImpactNexusView() {
  const { aiProxyMode, lang } = useAppContext();
  const [nodes, setNodes] = useState<ImpactNode[]>(MOCK_NODES);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "萬能影響力連結 (Omni Impact Nexus)" : "Omni Impact Nexus",
    subtitle: "萬能進階運算 (Omni Advanced Computation)",
    description: lang === "zh" 
      ? "萬能代理：執行「十翼使徒」邏輯運算決策。自動映射跨維度影響力，鎖定數據糾纏態。" 
      : "ADK Ten Wings execution. Mapping multi-dimensional impacts and data entanglement.",
    accent: "from-primary to-primary/60",
    tag: "[自動]",
    icon: Share2
  } : {
    title: lang === "zh" ? "萬能影響力連結 (Omni Impact Nexus)" : "Omni Impact Nexus",
    subtitle: "萬能手動映射 (Omni Manual Mapping)",
    description: lang === "zh" 
      ? "萬能核實：手動執行影響力權重計算。透過 5T 協議鎖定核心連結節點。" 
      : "Manually executing impact weight calculations via 5T protocol.",
    accent: "from-primary/20 to-transparent",
    tag: "[手動]",
    icon: Share2
  };

  const handleRunLogic = async (id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status: "computing" } : n));
    setActiveNodeId(id);

    // Simulate [06] Rune Scrivener logic execution
    await new Promise(r => setTimeout(r, 2000));

    // [01] & [04] Engrave Hash Lock
    const targetNode = nodes.find(n => n.id === id);
    if (targetNode) {
      // eslint-disable-next-line react-hooks/purity
      const impactAdjustment = (Date.now() % 2000) / 1000; 
      const engravedData = engraveHashLock(
        { ...targetNode, impact_score: targetNode.impact_score + impactAdjustment },
        `nexus://node/${id}`
      );

      setNodes(prev => prev.map(n => n.id === id ? { 
        ...n, 
        status: "sealed", 
        data: engravedData 
      } : n));
    }
  };

  const activeNode = nodes.find(n => n.id === activeNodeId);

  return (
    <div className="view-container space-y-12">
      <ViewHeader 
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-4">
            <Badge variant="optimal" className="bg-bg-surface border-border px-4 py-2 h-auto rounded-[2px] shadow-flat">
              <div className="flex flex-col items-start gap-1">
                <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] leading-none opacity-50 italic">Nexus Status</span>
                <span className="text-xs font-black text-primary leading-none italic uppercase tracking-widest">ACTIVE: 54,686 NODES</span>
              </div>
            </Badge>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Nexus Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-text-main flex items-center gap-2 uppercase italic tracking-tight">
              <Activity className="w-5 h-5 text-primary" />
              計算節點矩陣 (Nexus Matrix)
            </h3>
            <Button variant="wireframe" onClick={() => setNodes(MOCK_NODES)} className="uppercase font-black tracking-widest text-[10px]">
              <RefreshCw className="w-3.5 h-3.5 mr-2" /> 重置矩陣 (Reset)
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {nodes.map((node) => (
                <ImpactCard 
                  key={node.id} 
                  node={node} 
                  isActive={activeNodeId === node.id}
                  onExecute={() => handleRunLogic(node.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Execution Terminal */}
        <div className="lg:col-span-4">
          <GlassCard className="h-full sticky top-8 p-6 space-y-6 min-h-[600px] flex flex-col border-primary/10">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-text-main">運算終端 (ADK-10)</h4>
              </div>
              <Badge variant="optimal" styleType="soft" className="font-mono text-[10px]">v1.0.0</Badge>
            </div>

            <div className="flex-1 space-y-4 font-mono text-xs overflow-y-auto custom-scrollbar pr-2">
              {activeNode ? (
                <div className="space-y-4 font-mono text-[11px] leading-relaxed">
                  <div className="flex gap-3 text-primary animate-pulse">
                    <span className="shrink-0 font-black">[07] DISPATCHER:</span>
                    <span className="text-text-main font-bold italic uppercase tracking-tighter">Target analysis initiated for {activeNode.name}</span>
                  </div>
                  <div className="flex gap-3 text-text-muted opacity-80">
                    <span className="shrink-0 font-black">[06] RUNE SCRIVENER:</span>
                    <span>Loading 5T integrity protocol...</span>
                  </div>
                  <div className="flex gap-3 text-text-muted opacity-80">
                    <span className="shrink-0 font-black">[04] TRACER:</span>
                    <span>Mapping cross-dimensional dependencies...</span>
                  </div>
                  <div className="flex gap-3 text-primary/80">
                    <span className="shrink-0 font-black">[01] COVENANTER:</span>
                    <span className="italic">Ready for Hash Lock solidification.</span>
                  </div>

                  <AnimatePresence>
                    {activeNode.status === "computing" && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 bg-secondary/5 rounded border border-secondary/10 border-l-4 border-l-secondary"
                      >
                        <p className="text-secondary font-bold mb-1">[06] RUNE SCRIVENER</p>
                        <p className="text-text-muted">執行 LingoStep 運算... 映射維度 [{activeNode.category}]</p>
                        <div className="mt-2 h-1 bg-secondary/10 rounded-[1px] overflow-hidden">
                          <motion.div 
                            className="h-full bg-secondary shadow-flat"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2 }}
                          />
                        </div>
                      </motion.div>
                    )}

                    {activeNode.status === "sealed" && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 bg-accent/5 rounded border border-accent/10 border-l-4 border-l-accent"
                        >
                          <p className="text-accent font-bold mb-1">[05] VALIDATOR</p>
                          <p className="text-text-muted">驗證通過：符合 [ISO-14064-1] 影響力模型。</p>
                        </motion.div>

                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 bg-green-500/5 rounded border border-green-500/10 border-l-4 border-l-green-500"
                        >
                          <p className="text-green-500 font-bold mb-1">[01] COVENANTER</p>
                          <p className="text-text-muted uppercase tracking-tighter">SUCCESS: Hash Lock Solidified.</p>
                          <p className="mt-2 text-[10px] break-all opacity-50">{activeNode.data?.evidence[0].hashId}</p>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-30 text-center gap-4">
                  <Sparkles className="w-12 h-12" />
                  <p>等待使徒待命 (Waiting for Dispatcher)...<br/>請選擇一個節點啟動運算 (Select Node to Start)</p>
                </div>
              )}
            </div>

            {activeNode?.status === "sealed" && (
              <div className="pt-4 border-t border-border">
                <Button className="w-full bg-primary text-white font-bold" onClick={() => setActiveNodeId(null)}>
                  完成運算並歸檔 (Complete & Archive)
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* ADK Deployment Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <TenWingsStatus />
        <GlassCard className="p-6 space-y-4 border-primary/10">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h4 className="font-bold text-text-main">ADK 執行流程嚮導 (Execution Guide)</h4>
          </div>
          {PAGE_GUIDES["impact-nexus"] && (
            <GuideStepper 
              title={PAGE_GUIDES["impact-nexus"].title}
              steps={PAGE_GUIDES["impact-nexus"].steps}
            />
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function ImpactCard({ node, isActive, onExecute }: { node: ImpactNode; isActive: boolean; onExecute: () => void }) {
  return (
    <motion.div
      layout
      className={`relative p-5 rounded-[4px] border transition-all duration-75 shadow-flat ${
        isActive 
          ? "bg-primary/5 border-primary" 
          : "bg-bg-surface border-border hover:border-primary/40"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-[2px] border border-border ${node.category === 'E' ? 'bg-status-optimal/10 text-status-optimal' : node.category === 'S' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-black text-text-main text-[11px] uppercase tracking-widest italic">{node.name}</h5>
            <span className="text-[9px] text-text-muted uppercase font-black tracking-widest opacity-40">{node.id}</span>
          </div>
        </div>
        <Badge variant={node.status === 'sealed' ? 'optimal' : node.status === 'computing' ? 'lethal' : 'critical'} styleType="soft" className="text-[9px] font-black tracking-widest uppercase">
          {node.status === 'sealed' ? '已封存 (SEALED)' : node.status === 'computing' ? '計算中 (COMPUTING)' : '閒置 (IDLE)'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="p-3 bg-bg-base rounded-[2px] border border-border shadow-flat">
          <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] block mb-1 opacity-50 italic">Impact</span>
          <span className="text-xl font-black text-text-main italic">{node.impact_score}%</span>
        </div>
        <div className="p-3 bg-bg-base rounded-[2px] border border-border shadow-flat">
          <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] block mb-1 opacity-50 italic">Nexus</span>
          <span className="text-xl font-black text-text-main italic">{node.nexus_count}</span>
        </div>
      </div>

      <Button 
        variant={node.status === 'sealed' ? 'wireframe' : 'solid'} 
        className="w-full h-10 text-[10px] font-black tracking-[0.2em] uppercase italic"
        onClick={onExecute}
        disabled={node.status !== 'idle'}
      >
        {node.status === 'idle' ? (
          <>啟動邏輯 (RUN LOGIC) <ArrowRight className="w-3 h-3 ml-2" /></>
        ) : node.status === 'computing' ? (
          <>計算中 (COMPUTING)... <RefreshCw className="w-3 h-3 ml-2 animate-spin" /></>
        ) : (
          <>雜湊鎖定 (HASH LOCKED) <Lock className="w-3 h-3 ml-2" /></>
        )}
      </Button>

      {/* Sealed Evidence Preview */}
      {node.status === 'sealed' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-2 bg-status-optimal/5 rounded border border-status-optimal/10 flex items-center justify-between text-[9px] font-mono text-status-optimal"
        >
          <div className="flex items-center gap-1">
            <Fingerprint className="w-3 h-3" />
            <span>識別 (UUID): {node.data?.uuid.slice(0, 8)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>已封存 (SEALED)</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
