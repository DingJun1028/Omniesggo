"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { 
  X, 
  Terminal, 
  Settings2, 
  Droplets, 
  Layers, 
  Box, 
  Paintbrush, 
  ChevronRight,
  Activity,
  Cpu,
  Monitor,
  Database,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OmniDesignTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTheme: string;
}

export function OmniDesignTerminal({ isOpen, onClose, activeTheme }: OmniDesignTerminalProps) {
  const [activeTab, setActiveTab] = useState<"color" | "typo" | "material" | "motion">("color");
  const [logs, setLogs] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid SSR hydration issues
    Promise.resolve().then(() => setMounted(true));
  }, []);

  // Simulation of AI design logs
  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => setLogs([]));
      const messages = [
        "Initializing OMNI_CORE_V1.4.2...",
        `Loading Theme: ${activeTheme.toUpperCase()} (Physical Render)`,
        "Bypassing CSS Grid Layering Constraints...",
        "Neural Calibration: OK",
        "Liquid Glass Refraction: CALCULATING...",
        "Spatial Layout: TANGIBLE"
      ];
      
      const timers = messages.map((msg, i) => {
        return setTimeout(() => {
          setLogs((prev: string[]) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
        }, i * 300);
      });

      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [isOpen, activeTheme]);

  if (!mounted) return null;

  const TABS = [
    { id: "color", icon: Droplets, label: "色彩學", desc: "Colorimetry", color: "text-primary" },
    { id: "typo", icon: Layers, label: "排版空間", desc: "Typography", color: "text-amber-400" },
    { id: "material", icon: Box, label: "材質渲染", desc: "Material", color: "text-emerald-400" },
    { id: "motion", icon: Paintbrush, label: "微觀動效", desc: "Motion", color: "text-rose-400" },
  ] as const;

  const terminalUI = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[99999] pointer-events-none">
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-auto"
          />

          {/* Terminal Drawer */}
          <motion.div
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.5 }}
            transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.8 }}
            className="absolute right-0 top-0 bottom-0 w-[440px] bg-bg-base/95 border-l border-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden flex flex-col font-sans backdrop-blur-3xl"
          >
            {/* Header with Scanline Effect */}
            <div className="relative">
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <div className="p-8 pb-6 flex items-center justify-between bg-bg-surface/30">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-main uppercase tracking-[0.3em] italic">Omni Terminal</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-status-optimal shadow-[0_0_8px_var(--color-status-optimal)]" />
                      <span className="text-[10px] font-mono text-text-muted/80 tracking-widest">AESTHETIC_SYNC_ENABLED</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2.5 hover:bg-white/5 rounded-xl transition-all text-text-muted hover:text-rose-400 border border-transparent hover:border-rose-400/20 group"
                >
                  <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                </button>
              </div>
            </div>

            {/* Main Area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Tab Sidebar */}
              <div className="w-24 border-r border-white/5 bg-black/10 flex flex-col items-center py-8 gap-8">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex flex-col items-center gap-2 transition-all p-2 rounded-xl ${
                      activeTab === tab.id 
                        ? `${tab.color} bg-white/5 shadow-inner` 
                        : 'text-text-muted hover:text-text-main hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-105'}`} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,255,0.8)]" 
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Dynamic Content */}
              <div className="flex-1 flex flex-col bg-bg-base/30">
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                  {/* Tool Header */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.4em]">
                      <RefreshCw className="w-3 h-3 animate-spin-slow" />
                      Dynamic Tuning
                    </div>
                    <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                      <h4 className="text-2xl font-black text-text-main tracking-tighter italic">
                        {TABS.find(t => t.id === activeTab)?.desc}
                      </h4>
                      <Badge variant="optimal" styleType="solid" className="text-[9px] px-2 py-0">CORE_V1</Badge>
                    </div>
                  </div>

                  {/* Controls Grid */}
                  <div className="grid grid-cols-1 gap-6">
                    {activeTab === "color" && (
                      <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                           <div className="space-y-3">
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Primary Saturation</span>
                                <span className="text-xs font-mono text-primary font-bold">100%</span>
                              </div>
                              <div className="h-1.5 bg-black/40 rounded-full p-[2px]">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  className="h-full bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full shadow-[0_0_15px_rgba(0,255,255,0.4)]" 
                                />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Glass Refraction</span>
                                <span className="text-xs font-mono text-primary font-bold">0.85</span>
                              </div>
                              <div className="h-1.5 bg-black/40 rounded-full p-[2px]">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: "85%" }}
                                  className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(0,255,255,0.3)]" 
                                />
                              </div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <button className="flex items-center justify-center gap-2 p-4 rounded-xl border border-primary/30 bg-primary/10 text-xs font-black text-primary hover:bg-primary/20 transition-all active:scale-95 shadow-lg shadow-primary/5 uppercase">
                              <RefreshCw className="w-3 h-3" /> Re-calib
                           </button>
                           <button className="flex items-center justify-center gap-2 p-4 rounded-xl border border-white/10 bg-white/5 text-xs font-black text-text-muted hover:text-text-main transition-all active:scale-95 uppercase">
                              <Settings2 className="w-3 h-3" /> Advanced
                           </button>
                        </div>
                      </div>
                    )}

                    {activeTab === "typo" && (
                      <div className="space-y-4">
                        {[
                          { label: "Weight Distribution", value: "900 / BLACK", icon: Layers },
                          { label: "Tracking Unit", value: "-0.04em", icon: Activity },
                          { label: "Vertical Rhythm", value: "1.45", icon: Database }
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 group hover:border-primary/20 transition-colors">
                            <div className="flex items-center gap-3">
                              <item.icon className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{item.label}</span>
                            </div>
                            <span className="text-xs font-mono text-text-main font-bold">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {(activeTab === "material" || activeTab === "motion") && (
                       <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-3xl space-y-4 bg-black/10">
                         <div className="relative">
                           <Settings2 className="w-10 h-10 text-primary/40 animate-spin-slow" />
                           <Cpu className="absolute inset-0 w-6 h-6 m-auto text-primary animate-pulse" />
                         </div>
                         <div className="text-center space-y-1 text-text-muted/60">
                           <p className="text-[10px] font-mono uppercase tracking-[0.3em]">Awaiting Neural Logic</p>
                           <p className="text-[8px] font-mono italic">SYNC_CODE: X-999-MATERIAL</p>
                         </div>
                       </div>
                    )}
                  </div>

                  {/* Environment Pulse */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 rounded-2xl bg-bg-surface/50 border border-white/5 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                           <Activity className="w-8 h-8 text-status-optimal" />
                        </div>
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">System Fidelity</span>
                        <div className="text-2xl font-mono text-text-main font-black">99.98<span className="text-xs text-status-optimal">%</span></div>
                     </div>
                     <div className="p-5 rounded-2xl bg-bg-surface/50 border border-white/5 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                           <Monitor className="w-8 h-8 text-primary" />
                        </div>
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Render FPS</span>
                        <div className="text-2xl font-mono text-text-main font-black">120<span className="text-xs text-primary">fps</span></div>
                     </div>
                  </div>
                </div>

                {/* Cyber Console with Blur */}
                <div className="h-44 bg-black/60 border-t border-white/10 p-6 font-mono text-[10px] overflow-hidden relative group">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-primary/20" />
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
                    <span className="font-black uppercase tracking-[0.2em] text-primary/80">Sensory_Terminal_Output</span>
                  </div>
                  <div className="space-y-1.5 overflow-y-auto h-24 custom-scrollbar">
                    {logs.map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i} 
                        className="text-text-muted/80 border-l border-primary/20 pl-3 leading-relaxed"
                      >
                         <span className="text-primary/40 mr-2">&gt;&gt;</span>{log}
                      </motion.div>
                    ))}
                    <div className="w-2.5 h-4 bg-primary/80 inline-block animate-pulse align-middle" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                </div>

                {/* Pro Actions */}
                <div className="p-8 pt-6 bg-bg-surface border-t border-white/5 grid grid-cols-2 gap-4">
                   <button 
                     onClick={onClose}
                     className="h-12 border border-white/10 rounded-xl text-[10px] font-black text-text-muted uppercase tracking-widest hover:bg-white/5 hover:text-text-main transition-all"
                   >
                      Discard_Sync
                   </button>
                   <button 
                     onClick={onClose}
                     className="h-12 bg-primary text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_25px_rgba(0,255,255,0.2)] hover:shadow-[0_0_35px_rgba(0,255,255,0.4)] transition-all active:scale-95"
                   >
                      Deploy_Global
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(terminalUI, document.body);
}
