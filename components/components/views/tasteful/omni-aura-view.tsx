"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { Palette, Layers, Box, Paintbrush, Droplets, Moon, Sun, Monitor, Code, Zap, Sparkles, Cpu, Activity } from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ViewHeader } from "@/components/ui/view-header";
import { PAGE_GUIDES } from "@/lib/config/guides";
import { OmniDesignTerminal } from "@/components/views/system/omni-design-terminal";

export function OmniAuraView() {
  const { lang, aiProxyMode, theme: activeTheme, setTheme } = useAppContext();
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "萬能主題" : "OmniAura Design",
    subtitle: "AI Spatial Orchestration",
    description: lang === "zh" ? "正在自動編排全域 UI/UX 參數，重塑空間美學體驗。" : "AI auto-orchestrating global UI/UX parameters to reshape spatial aesthetics.",
    accent: "from-purple-500/20 to-transparent",
    tag: "AI",
    icon: Palette,
    guideSteps: PAGE_GUIDES["omni-aura"]
  } : {
    title: lang === "zh" ? "全域感知" : "OmniAura Core",
    subtitle: "Tasteful & Tangible Core",
    description: lang === "zh" ? "掌管所有 UI/UX 類別，為最小原子中「美」的表現 (Tasteful/Tangible)。" : "Governing all UI/UX categories, presenting the atomic essence of 'Tasteful'.",
    accent: "from-[#00FFFF]/20 to-transparent",
    tag: "CORE",
    icon: Palette,
    guideSteps: PAGE_GUIDES["omni-aura"]
  };

  const themes = [
    { 
      id: "light", 
      name: lang === "zh" ? "晨光清泉 (Omni Morning)" : "Morning Sprig", 
      desc: lang === "zh" ? "極簡光學介面，適合文書審閱" : "Pure light interface for review", 
      icon: Sun, 
      color: "text-blue-500",
    },
    { 
      id: "dark", 
      name: lang === "zh" ? "深空光流 (Omni Deep Space)" : "Deep Space Flow", 
      desc: lang === "zh" ? "物理玻璃質感，極致沉浸體驗" : "Liquid glass for immersion", 
      icon: Moon, 
      color: "text-cyan-400",
    },
    { 
      id: "emerald", 
      name: lang === "zh" ? "翡翠森林 (Omni Emerald)" : "Emerald Forest", 
      desc: lang === "zh" ? "永續自然底色，綻放生命張力" : "Sustainable nature aesthetic", 
      icon: Droplets, 
      color: "text-emerald-400",
    },
    { 
      id: "amber", 
      name: lang === "zh" ? "琥珀赤沙 (Omni Amber)" : "Amber Crimson", 
      desc: lang === "zh" ? "核心熱能感知，治理面高亮" : "High-energy governance mode", 
      icon: Zap, 
      color: "text-orange-400",
    },
    { 
      id: "ice", 
      name: lang === "zh" ? "冰晶極光 (Omni Ice)" : "Ice Aurora", 
      desc: lang === "zh" ? "物理冷卻未來感，跨維度美學" : "Cross-dimensional future cold", 
      icon: Box, 
      color: "text-indigo-400",
    },
    { 
      id: "milktea", 
      name: lang === "zh" ? "珍珠厚乳 (Omni Milk Tea)" : "Pearl Milk Tea", 
      desc: lang === "zh" ? "暖色有機質感，人文與專業平衡" : "Warm organic texture, balanced aura", 
      icon: Droplets, 
      color: "text-[#C2A687]",
    },
  ];

  const tools = [
    { title: "色彩學引擎", desc: "Colorimetry Engine", icon: Droplets, color: "text-rose-400" },
    { title: "排版空間學", desc: "Typography Spatial", icon: Layers, color: "text-amber-400" },
    { title: "材質渲染機", desc: "Material Renderer", icon: Box, color: "text-emerald-400" },
    { title: "微觀動效儀", desc: "Micro Motion", icon: Paintbrush, color: "text-cyan-400" },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", damping: 25, stiffness: 100 } }
  };

  return (
    <div className="space-y-10 pb-20 overflow-visible">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.2em]">Design_Sync</span>
                <span className="text-xs font-mono text-status-optimal font-bold">STABLE_0.14</span>
             </div>
             <div className="relative group">
                <motion.div 
                  animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-1 bg-primary/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                />
                <Button 
                  variant="solid" 
                  onClick={() => setIsTerminalOpen(true)}
                  className="relative px-8 h-12 bg-primary text-slate-900 border-none font-black italic shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Code className="w-5 h-5 mr-3" /> {lang === "zh" ? "呼出設計終端" : "CALL TERMINAL"}
                  <Sparkles className="w-3 h-3 ml-2 animate-pulse" />
                </Button>
             </div>
          </div>
        }
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-12 gap-10"
      >
        {/* Main Content: Theme Matrix */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
             <h2 className="text-2xl font-black text-text-main flex items-center gap-4 uppercase tracking-tighter italic">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5">
                  <Layers className="w-6 h-6" />
                </div>
                {lang === "zh" ? "全域光照與主題" : "Global Matrix"}
             </h2>
             <Badge variant="optimal" styleType="solid" className="font-mono text-[10px] tracking-widest hidden sm:flex">ILLUMINATION_GRID</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = activeTheme === t.id;
              return (
                <motion.button 
                  variants={itemVariants}
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  className={`relative p-8 rounded-[2rem] border transition-all text-left group overflow-hidden ${
                    isActive 
                      ? 'border-primary bg-primary/10 shadow-[0_0_40px_rgba(0,255,255,0.15)] ring-1 ring-primary/30 scale-100' 
                      : 'border-white/5 bg-bg-surface/50 hover:border-primary/40 hover:bg-white/5 scale-[0.98] hover:scale-100'
                  }`}
                >
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className={`p-4 rounded-2xl transition-all duration-500 ${
                      isActive ? "bg-primary text-slate-900 shadow-lg shadow-primary/30 rotate-12 scale-110" : "bg-bg-base border border-white/5 text-text-muted group-hover:text-primary group-hover:rotate-6"
                    }`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    {isActive ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                        <Activity className="w-3 h-3 text-primary animate-pulse" />
                        <span className="text-[9px] font-mono text-primary font-black uppercase">Active</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-text-muted/30 uppercase group-hover:text-primary/40 transition-colors tracking-tight">Ready</div>
                    )}
                  </div>

                  <h3 className={`font-black text-lg mb-2 relative z-10 transition-colors tracking-tight ${
                    isActive ? "text-primary italic" : "text-text-main"
                  }`}>
                    {t.name}
                  </h3>
                  <p className="text-xs relative z-10 text-text-muted/80 leading-relaxed font-medium">{t.desc}</p>
                  
                  {/* Metric Bar */}
                  <div className="mt-8 h-1 w-full bg-white/5 rounded-full overflow-hidden relative z-10 p-[1px]">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: isActive ? "100%" : "30%" }}
                       className={`h-full transition-all duration-1000 rounded-full ${isActive ? "bg-primary shadow-[0_0_12px_rgba(0,255,255,0.6)]" : "bg-white/10"}`} 
                    />
                  </div>

                  {isActive && (
                    <motion.div 
                      layoutId="activeThemeGlow"
                      className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none -z-10" 
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Pro Tools */}
        <div className="lg:col-span-4 space-y-8">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-text-main flex items-center gap-4 uppercase tracking-tighter italic lg:flex-row-reverse">
                {lang === "zh" ? "UI/UX 工具盒" : "Design Kit"}
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Paintbrush className="w-6 h-6" />
                </div>
              </h2>
           </div>

           <div className="p-8 rounded-[3rem] bg-bg-surface/30 border border-white/5 backdrop-blur-3xl space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12">
                <Cpu className="w-48 h-48 text-primary" />
              </div>

              {tools.map((tool, i) => (
                <motion.button 
                  variants={itemVariants}
                  key={i}
                  onClick={() => setIsTerminalOpen(true)}
                  className="w-full flex items-center justify-between p-5 rounded-2xl bg-bg-base/40 hover:bg-primary/5 border border-white/5 hover:border-primary/20 transition-all group/tool relative"
                >
                  <div className="flex items-center gap-6 relative z-10">
                    <div className={`p-3.5 rounded-xl bg-white/5 group-hover/tool:bg-primary/10 border border-white/5 group-hover/tool:border-primary/20 transition-all duration-300 ${tool.color}`}>
                      <tool.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left space-y-0.5">
                      <div className="font-black text-text-main text-sm group-hover/tool:text-primary transition-colors tracking-tight">{tool.title}</div>
                      <div className="text-[10px] text-text-muted font-mono uppercase tracking-[0.2em] opacity-40 font-black">{tool.desc}</div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center opacity-0 group-hover/tool:opacity-100 transition-all group-hover/tool:translate-x-1 shadow-inner border border-white/5">
                    <Code className="w-4 h-4 text-primary" />
                  </div>
                </motion.button>
              ))}

              <div className="pt-6 px-4 space-y-5 relative z-10">
                 <div className="flex justify-between items-center text-[10px] font-black text-text-muted/30 uppercase tracking-[0.4em]">
                   <span>Processing_Pulse</span>
                   <span className="text-primary italic">Synchronized</span>
                 </div>
                 <div className="h-1 bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div 
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" 
                    />
                 </div>
              </div>
           </div>
        </div>
      </motion.div>

      <OmniDesignTerminal 
        isOpen={isTerminalOpen} 
        onClose={() => setIsTerminalOpen(false)} 
        activeTheme={activeTheme}
      />
    </div>
  );
}
