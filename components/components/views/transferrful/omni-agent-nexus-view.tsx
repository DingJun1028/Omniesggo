"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { 
  Cpu, 
  Zap, 
  Activity, 
  Database, 
  ShieldCheck, 
  Bot, 
  Search,
  Waves,
  Network
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/lib/context/app-context";
import { AgentNetworkBus, AgentStatus } from "@/lib/services/EntropyAgent";
import { ViewHeader } from "@/components/ui/view-header";
import { cn } from "@/lib/utils";
import { ApostleSquadManager } from "@/lib/services/adk/apostle-squad-manager";

const INITIAL_AGENTS = [
  { id: "EntropyGuard", name: "熵減護衛 (Entropy Guard)", icon: ShieldCheck, color: "from-amber-500 to-orange-600", category: "AGENT" },
  { id: "TaskAlchemist", name: "任務煉金術師 (Task Alchemist)", icon: Zap, color: "from-blue-500 to-indigo-600", category: "AGENT" },
  { id: "DataCurer", name: "數據策展人 (Data Curer)", icon: Database, color: "from-emerald-500 to-teal-600", category: "DATA" },
  { id: "HolyLinter", name: "聖經判官 (Holy Linter)", icon: Activity, color: "from-rose-500 to-pink-600", category: "KNOWLEDGE" },
  { id: "AgentNexus", name: "網路中樞 (Agent Nexus)", icon: Network, color: "from-purple-500 to-violet-600", category: "AGENT" }
];

export function OmniAgentNexusView() {
  const { aiProxyMode, lang } = useAppContext();
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [eventLogs, setEventLogs] = useState<AgentStatus[]>([]);
  const [activeSyncs, setActiveSyncs] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Derive apostles from ApostleSquadManager to avoid setState in effect
  const apostles = useMemo(() => {
    ApostleSquadManager.init();
    return ApostleSquadManager.allApostles.map(a => {
      const isLeft = a.id.startsWith('A');
      return {
        id: a.id,
        name: lang === 'zh' ? a.name : (a as any).nameEn || a.name,
        icon: isLeft ? Bot : Cpu,
        color: isLeft ? "from-cyan-500 to-blue-400" : "from-amber-400 to-orange-500",
        category: isLeft ? "ARVO" : "ADK"
      };
    });
  }, [lang]);

  const allAgents = useMemo(() => [...INITIAL_AGENTS, ...apostles], [apostles]);

  useEffect(() => {
    const unsubscribe = AgentNetworkBus.subscribe((status) => {
      setAgentStatuses(prev => ({
        ...prev,
        [status.agentId]: status
      }));

      // Add to historical event log (limit to 20)
      setEventLogs(prev => [status, ...prev].slice(0, 20));

      if (status.status === "SYNCING" || status.status === "PROCESSING") {
        setActiveSyncs(prev => [...new Set([...prev, status.agentId])]);
      } else if (status.status === "COMPLETED" || status.status === "IDLE") {
        setActiveSyncs(prev => prev.filter(id => id !== status.agentId));
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [lang]);

  const branding = {
    title: lang === "zh" ? "代理網絡 (Agent Network)" : "Agent Network",
    subtitle: "融合共生神經協作 (Neural Collective Synergy)",
    description: lang === "zh" ? "這不是孤島，而是共生的神經。5T 協議下的多代理協作平台。" : "Symbiotic neurons in a collective. Multi-agent synergy under 5T Protocol.",
    accent: "from-purple-500/20 to-transparent",
    tag: "AGENT_NETWORK",
    icon: Network
  };

  const categories = ["ALL", "AGENT", "DATA", "KNOWLEDGE", "ARVO", "ADK"];
  const visibleAgents = activeCategory === "ALL" 
    ? allAgents 
    : allAgents.filter(a => a.category === activeCategory);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <ViewHeader {...branding} aiProxyMode={aiProxyMode} />

      {/* Category Filter & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all",
                activeCategory === cat 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-500 hover:text-slate-900 dark:text-white/40 dark:hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-6 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white/60">節點健康 (NODE_HEALTH): 最佳 (OPTIMAL)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/60 tracking-wider">同步鎖定 (SYNC_LOCK): </span>
            <span className="text-[10px] font-mono text-purple-400">0x5F3E...A2</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Swarm Visualization (Centerpiece) */}
        <GlassCard className="lg:col-span-2 relative overflow-hidden bg-slate-950 border-white/5 flex flex-col items-center justify-center min-h-[500px]">
          {/* Animated Background Grids */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
             <div className="w-full h-full bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px]" />
          </div>

          {/* Neural Connections (SVG Lines) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
             <defs>
                <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#A855F7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
                </linearGradient>
             </defs>
             {visibleAgents.map((agent, i) => {
                const angle = (i / visibleAgents.length) * 2 * Math.PI;
                const radius = 200 + (i % 2 === 0 ? 0 : 40);
                const x = 50 + (Math.cos(angle) * radius) / 10; // Normalized to %
                const y = 50 + (Math.sin(angle) * (radius * 0.8)) / 10;
                
                return activeSyncs.includes(agent.id) && (
                  <motion.path 
                    key={`path-${agent.id}`}
                    d={`M ${x}% ${y}% L 50% 50%`}
                    stroke="url(#neural-gradient)"
                    strokeWidth="1.5"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                );
             })}
          </svg>

          {/* Nexus Core */}
          <div className="relative z-10 text-center">
            <motion.div
              animate={{ 
                scale: activeSyncs.length > 0 ? [1, 1.05, 1] : 1,
                boxShadow: activeSyncs.length > 0 
                  ? ["0 0 20px rgba(168,85,247,0.2)", "0 0 50px rgba(168,85,247,0.4)", "0 0 20px rgba(168,85,247,0.2)"]
                  : "0 0 20px rgba(168,85,247,0.2)"
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-600/20 p-2 backdrop-blur-xl border border-white/10"
            >
              <div className="w-full h-full rounded-full bg-slate-900 border border-white/5 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                 <Network className="w-16 h-16 text-white/80 relative z-10" />
                 {/* Spinning outer ring */}
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                   className="absolute inset-0 border-t border-r border-transparent border-white/20 rounded-full"
                 />
              </div>
            </motion.div>
            <h3 className="mt-6 text-white font-black tracking-[0.3em] text-2xl">神經橋接 (NEURAL BRIDGE)</h3>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
                活躍突觸 (ACTIVE SYNAPSES): {activeSyncs.length}
              </div>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60">
                總節點數 (TOTAL NODES): {visibleAgents.length}
              </div>
            </div>
          </div>

          {/* Orbiting Agents */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {visibleAgents.map((agent, i) => {
                const angle = (i / visibleAgents.length) * 2 * Math.PI;
                const radius = 200 + (i % 2 === 0 ? 0 : 40);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * (radius * 0.8); // Slightly oval orbit
                const status = agentStatuses[agent.id];
                const isSyncing = activeSyncs.includes(agent.id);

                return (
                  <motion.div
                    key={agent.id}
                    layoutId={`agent-${agent.id}`}
                    initial={{ x: 0, y: 0, opacity: 0 }}
                    animate={{ 
                      x, 
                      y, 
                      opacity: 1,
                      scale: isSyncing ? 1.15 : 1
                    }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="absolute top-1/2 left-1/2 -ml-8 -mt-8 pointer-events-auto"
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-2xl bg-gradient-to-br p-0.5 shadow-xl group cursor-pointer relative transition-all",
                      agent.color,
                      isSyncing ? "shadow-[0_0_30px_rgba(255,255,255,0.2)]" : ""
                    )}>
                       {/* 5T Seal Overlay */}
                       <div className="absolute -top-2 -right-2 z-30">
                          <div className="w-6 h-6 rounded-full bg-slate-900 border border-white/20 flex items-center justify-center shadow-lg">
                             <span className="text-[10px] font-black text-white">{agent.category[0]}</span>
                          </div>
                       </div>

                       <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center relative overflow-hidden">
                          <agent.icon className={cn(
                            "w-8 h-8 transition-all group-hover:scale-110",
                            isSyncing ? "text-white" : "text-white/40"
                          )} />
                          
                          {isSyncing && (
                             <>
                               <motion.div 
                                 className="absolute inset-0 bg-white/5"
                                 animate={{ opacity: [0, 0.2, 0] }}
                                 transition={{ duration: 2, repeat: Infinity }}
                               />
                               <motion.div 
                                 className="absolute -inset-2 rounded-2xl border border-white/10"
                                 animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                                 transition={{ duration: 1.5, repeat: Infinity }}
                               />
                             </>
                          )}
                       </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap text-center">
                      <p className="text-[10px] font-black text-white tracking-[0.2em] uppercase">{agent.name.split(' ')[0]}</p>
                      <div className="flex items-center justify-center gap-1.5 mt-1">
                        <div className={cn(
                          "w-1 h-1 rounded-full",
                          status?.status === "PROCESSING" ? "bg-blue-400 animate-pulse" : 
                          status?.status === "ERROR" ? "bg-red-500" : "bg-white/20"
                        )} />
                        <p className="text-[8px] text-white/40 font-mono tracking-tighter uppercase">{status?.status || "IDLE"}</p>
                      </div>
                    </div>
                  </motion.div>
                );
            })}
          </div>
        </GlassCard>

        {/* Neural Log (Right Panel) */}
        <GlassCard className="flex flex-col border-t-2 border-t-purple-500 bg-slate-50 dark:bg-black/40">
           <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-white flex items-center gap-2">
                 <Activity className="w-4 h-4 text-purple-500" />
                 {lang === 'zh' ? '神經活動日誌 (Neural Activity Log)' : 'Neural Activity Log'}
              </h3>
              <Badge variant="optimal" styleType="soft" className="font-mono text-[8px]">實時追蹤 (LIVE_TRACE) 3.1</Badge>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                 {eventLogs.map((status, i) => (
                    <motion.div 
                      key={`${status.agentId}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 flex gap-3 items-start group hover:border-purple-500/50 transition-colors shadow-sm"
                    >
                       <div className="mt-1">
                          {status.status === "PROCESSING" ? (
                            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                              <Bot className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-between">
                             <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest truncate">
                               {status.agentId}
                             </p>
                             <span className="text-[7px] font-mono text-slate-400 dark:text-white/20">
                               {new Date().toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                             </span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-600 dark:text-white/60 mt-1.5 leading-relaxed">
                            {status.currentTask || (status.status === "COMPLETED" ? "操作已完成 (Operation finalized)." : "狀態更新已廣播 (Status update broadcasted).")}
                          </p>
                          {(status.citingNodeId || (status as any).adkEvent) && (
                             <div className="mt-2.5 flex flex-wrap gap-2">
                               {status.citingNodeId && (
                                 <div className="flex items-center gap-1.5 bg-blue-500/5 px-2 py-1 rounded-md border border-blue-500/10">
                                   <Search className="w-2.5 h-2.5 text-blue-400" />
                                   <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">
                                     Node: {status.citingNodeId.slice(0, 8)}
                                   </span>
                                 </div>
                               )}
                             </div>
                          )}
                       </div>
                    </motion.div>
                 ))}
              </AnimatePresence>

              {eventLogs.length === 0 && (
                 <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    >
                      <Waves className="w-12 h-12 text-slate-200 dark:text-white/5" />
                    </motion.div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-6 opacity-30">等待突觸活動 (Waiting for Synapse Activity)</p>
                 </div>
              )}
           </div>
        </GlassCard>
      </div>
    </div>
  );
}
