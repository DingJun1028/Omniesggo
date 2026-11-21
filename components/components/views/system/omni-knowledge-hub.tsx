"use client";

import { motion } from "framer-motion";
import { ViewHeader } from "@/components/ui/view-header";
import { PAGE_GUIDES } from "@/lib/config/guides";
import { BookOpen, Palette, Box, MousePointer2, Type, Layout, Zap, ShieldCheck, Search, Bot, Database, Activity } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

export function OmniKnowledgeHub() {
  const { theme, setTheme, aiProxyMode, lang } = useAppContext();

  const themes = [
    { id: "light", name: "Omni Morning", icon: "🌅" },
    { id: "dark", name: "Omni Deep Space", icon: "🌌" },
    { id: "emerald", name: "Omni Emerald", icon: "🌿" },
    { id: "amber", name: "Omni Amber", icon: "🏜️" },
    { id: "ice", name: "Omni Ice", icon: "❄️" },
    { id: "milktea", name: "Omni Milk Tea", icon: "🧋" },
  ] as const;

  const branding = {
      title: lang === "zh" ? "萬能知識中樞" : "Omni Knowledge Hub",
      subtitle: lang === "zh" ? "系統設計與永續智庫" : "Sustainable Intelligence & Regulatory Center",
      description: lang === "zh" 
        ? "這是 ESG SUNSHINE 的永續知識中樞。整合了全球 ESG 準則、行業標竿數據與系統設計規範層。" 
        : "The core intelligence hub for ESG SUNSHINE. Integrating global ESG standards and design tokens.",
      tag: "HUB",
      icon: BookOpen,
      guideSteps: PAGE_GUIDES["omni-library"],
      aiProxyMode: aiProxyMode
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1] as any
      } 
    },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="view-container pb-48 animate-in fade-in duration-500"
    >
      <ViewHeader {...branding} />

      {/* Theme Switcher Gallery */}
      <motion.section variants={itemVariants} className="mb-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-[1px] shadow-inner">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.3em] italic">Theme Orchestration Matrix</h2>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mt-1 italic">Dynamic aesthetic re-alignment</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "p-8 rounded-[1px] border transition-all duration-300 flex flex-col items-center gap-4 group relative overflow-hidden shadow-flat",
                theme === t.id 
                  ? 'border-primary bg-primary/[0.03] scale-[1.02]' 
                  : 'border-border bg-bg-surface hover:border-primary/40'
              )}
            >
              <span className="text-4xl group-hover:scale-110 transition-transform duration-500">{t.icon}</span>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest italic",
                theme === t.id ? 'text-primary' : 'text-text-muted opacity-60'
              )}>
                {t.name}
              </span>
              {theme === t.id && (
                <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Colors & Tokens */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="flex items-center gap-3">
            <Box className="w-5 h-5 text-primary" />
            <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Design Tokens (Mechanical Layer)</h2>
          </div>
          <GlassCard className="p-10 border border-border shadow-flat bg-bg-surface/30">
            <div className="grid grid-cols-2 gap-8">
              {[
                { label: "Background Base", token: "bg-bg-base", class: "bg-bg-base border-border" },
                { label: "Surface Layer", token: "bg-bg-surface", class: "bg-bg-surface border-border" },
                { label: "Primary Core", token: "bg-primary", class: "bg-primary border-none shadow-[0_0_15px_var(--color-primary-50)]" },
                { label: "Accent Highlight", token: "bg-accent", class: "bg-accent border-none shadow-[0_0_15px_var(--color-accent-50)]" },
                { label: "AI Proxy Sync", token: "bg-proxy", class: "bg-proxy border-none shadow-[0_0_15px_var(--color-proxy-50)]" },
                { label: "Border Token", token: "bg-border", class: "bg-border border-none" },
              ].map((c) => (
                <div key={c.label} className="space-y-4">
                  <div className={cn("h-14 rounded-[1px] border shadow-inner", c.class)} />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-text-main uppercase tracking-widest italic">{c.label}</span>
                    <span className="text-[9px] font-mono text-text-muted italic opacity-60 tracking-tighter">{c.token}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-border/40 space-y-6">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] italic opacity-40">Semantic Signal Matrix</span>
              <div className="flex flex-wrap gap-4">
                <Badge variant="lethal" styleType="solid" className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest italic rounded-[1px]">LETHAL_OVERRIDE</Badge>
                <Badge variant="lethal" styleType="soft" className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest italic rounded-[1px]">ALARM_SOFT</Badge>
                <Badge variant="optimal" styleType="solid" className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest italic rounded-[1px]">OPTIMAL_SYNC</Badge>
                <Badge variant="optimal" styleType="soft" className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest italic rounded-[1px]">NOMINAL_STATE</Badge>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* Buttons & Interaction */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="flex items-center gap-3">
            <MousePointer2 className="w-5 h-5 text-primary" />
            <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Interaction Feedback (Physical)</h2>
          </div>
          <GlassCard className="p-10 border border-border shadow-flat bg-bg-surface/30">
            <div className="flex flex-wrap gap-6 mb-12">
              <Button variant="solid" className="h-12 px-8 text-[10px] font-black uppercase tracking-widest italic rounded-[1px]">Primary Command</Button>
              <Button variant="wireframe" className="h-12 px-8 text-[10px] font-black uppercase tracking-widest italic rounded-[1px]">Secondary Wire</Button>
              <Button variant="gold" className="h-12 px-8 text-[10px] font-black uppercase tracking-widest italic rounded-[1px]">Noble Highlight</Button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-60">Logic Toggle</span>
                <div className="w-16 h-8 rounded-[1px] bg-bg-base border border-border relative cursor-pointer p-1 group">
                   <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-6 h-6 rounded-[1px] bg-primary absolute right-1 shadow-flat" />
                </div>
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-60">Status Indicator</span>
                <div className="px-4 py-2 rounded-[1px] border border-primary bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest text-center shadow-inner italic">
                  NODE_BROADCAST
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border/40">
               <span className="text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-60 mb-4 block">Atomic Sequence</span>
               <div className="flex items-center gap-2">
                 {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={cn("h-1 w-8 rounded-full", i < 4 ? "bg-primary" : "bg-border")} />
                 ))}
                 <span className="text-[9px] font-mono text-primary font-black ml-4">0.75_SEC</span>
               </div>
            </div>
          </GlassCard>
        </motion.section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
         {/* Typography */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="flex items-center gap-3">
            <Type className="w-5 h-5 text-primary" />
            <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Typography Hierarchy (Omni Serif)</h2>
          </div>
          <GlassCard className="p-10 border border-border shadow-flat bg-bg-surface/30 space-y-10">
            <div className="space-y-3">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] italic opacity-40">Display_Large</span>
              <h3 className="text-4xl font-black text-text-main tracking-tighter italic uppercase leading-none">OMNI_KINETICS_MOD_01</h3>
            </div>
            <div className="space-y-3">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] italic opacity-40">Subheader_Medium</span>
              <h3 className="text-xl font-black text-text-main uppercase italic tracking-tight">Environmental Governance Vector</h3>
            </div>
            <div className="space-y-3">
              <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] italic opacity-40">Contextual_Body</span>
              <p className="text-sm font-bold text-text-muted leading-relaxed italic opacity-80">
                The Ultimate Minimalist Edition leverages rational geometry and high-contrast feedback loops to minimize cognitive friction in high-stakes ESG decision making.
              </p>
            </div>
          </GlassCard>
        </motion.section>

        {/* Liquid Glass Showcase */}
        <motion.section variants={itemVariants} className="space-y-8">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-primary" />
            <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Physics Layer (Liquid Glass)</h2>
          </div>
          <div className="space-y-8">
            <div className="liquid-glass p-12 h-48 flex items-center justify-center relative border border-white/10 shadow-elevation-2 rounded-[1px]">
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
                <span className="text-[9px] font-black text-text-main tracking-widest italic opacity-60">OPTIC_REFRACTION_ENGAGED</span>
              </div>
              <p className="text-2xl font-black text-text-main uppercase italic drop-shadow-md text-center tracking-tighter">
                Refraction & <span className="text-primary underline underline-offset-8 decoration-primary/20">Backdrop Blur</span>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <GlassCard className="p-6 border border-border shadow-inner bg-bg-base/50 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-[1px] shadow-inner">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-text-main uppercase italic tracking-widest">Data_Stream_Bit</span>
                  <span className="text-[9px] text-text-muted font-mono tracking-tighter opacity-40 italic">0x4F...B2E1</span>
                </div>
              </GlassCard>
              <GlassCard className="p-6 border border-border shadow-inner bg-bg-base/50 flex items-center gap-4">
                <div className="p-3 bg-status-optimal/10 rounded-[1px] shadow-inner">
                  <ShieldCheck className="w-5 h-5 text-status-optimal" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-text-main uppercase italic tracking-widest">Trust_Core_Link</span>
                  <span className="text-[9px] text-text-muted font-mono tracking-tighter opacity-40 italic">ISO_UN_2026</span>
                </div>
              </GlassCard>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Complex Components Preview */}
      <motion.section variants={itemVariants} className="space-y-8 mb-16">
        <div className="flex items-center gap-4 mb-4">
          <Zap className="w-6 h-6 text-primary" />
          <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.3em] italic">Omni Compound Assemblies</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard className="p-10 border border-border shadow-flat hover:bg-bg-surface transition-all">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-black text-text-main uppercase tracking-widest italic">Audit Vector Alpha</span>
                </div>
                <Badge variant="optimal" styleType="soft" className="px-2 py-0.5 text-[8px] font-black italic rounded-[1px]">SYNCED</Badge>
             </div>
             <div className="h-1.5 bg-bg-base border border-border rounded-full overflow-hidden mb-6 shadow-inner">
                <div className="h-full bg-primary w-[85%] shadow-[0_0_8px_var(--color-primary)]" />
             </div>
             <p className="text-[10px] font-bold text-text-muted italic opacity-60 leading-relaxed uppercase">Evidence collection status: 24/30 items matched.</p>
          </GlassCard>

          <GlassCard className="p-10 flex flex-col items-center justify-center gap-8 border border-border shadow-flat relative overflow-hidden group">
             <div className="absolute inset-0 bg-primary/[0.01] group-hover:bg-primary/[0.03] transition-all" />
             <div className="relative w-20 h-20">
                 <div className={cn("absolute inset-0 rounded-full border border-dashed animate-spin-slow", aiProxyMode ? 'border-proxy/60' : 'border-primary/60')} />
                 <div className={cn("absolute inset-3 rounded-full bg-gradient-to-br shadow-inner transition-all duration-500", aiProxyMode ? 'from-proxy to-proxy/40' : 'from-primary to-primary/40')} />
             </div>
             <div className="text-center relative z-10">
                <span className="text-[10px] font-black text-text-main uppercase tracking-[0.2em] italic block mb-2">Omni Spirit Core</span>
                <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic", aiProxyMode ? 'text-proxy animate-pulse' : 'text-primary')}>
                   {aiProxyMode ? 'Agent Active' : 'Manual Control'}
                </span>
             </div>
          </GlassCard>

          <GlassCard className="p-10 space-y-6 border border-border shadow-flat bg-bg-surface/50">
             <div className="flex items-center gap-3 text-accent mb-4">
                <Activity className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Verification Sequence</span>
             </div>
             <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between border-b border-border/40 pb-3 group cursor-pointer">
                    <span className="text-[10px] text-text-main font-black uppercase italic tracking-tighter group-hover:text-primary transition-colors">Protocol_XN_0{i}</span>
                    <div className="w-2 h-2 rounded-full bg-status-optimal shadow-[0_0_5px_var(--color-status-optimal)]" />
                  </div>
                ))}
             </div>
          </GlassCard>
        </div>
      </motion.section>

      {/* Infrastructure & Navigation Guide */}
      <motion.section variants={itemVariants} className="space-y-12 pt-16 border-t border-border/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-status-lethal/10 rounded-[1px] shadow-inner">
            <ShieldCheck className="w-8 h-8 text-status-lethal" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-text-main tracking-tighter uppercase italic">System Infrastructure Index</h2>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mt-1 italic">Developer navigation layer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              label: "Core Styles", 
              color: "primary", 
              desc: "Global design tokens, glassmorphism constants, and layout variables.",
              files: ["/app/globals.css", "/components/ui/*"]
            },
            { 
              label: "View Matrix", 
              color: "accent", 
              desc: "Functional view logic across the Truth, Goodness, Beauty domains.",
              files: ["/components/views/*"]
            },
            { 
              label: "Agent Logic", 
              color: "proxy", 
              desc: "Omni Agent decision trees, orchestration strategies, and state sync.",
              files: ["/lib/agents/*", "/lib/context/app-context.tsx"]
            }
          ].map((item) => (
            <GlassCard key={item.label} className={cn("p-10 border-l-2 shadow-flat group transition-all h-full flex flex-col justify-between", `border-l-${item.color}`)}>
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", `bg-${item.color}`)} />
                  <span className="text-sm font-black text-text-main uppercase tracking-tight italic">{item.label}</span>
                </div>
                <p className="text-[11px] font-bold text-text-muted leading-relaxed italic opacity-60 group-hover:opacity-100 transition-opacity">
                  {item.desc}
                </p>
              </div>
              <div className="mt-8 flex flex-col gap-3">
                {item.files.map(file => (
                  <code key={file} className={cn("text-[10px] bg-bg-base/80 p-3 rounded-[1px] border border-border font-mono select-all transition-colors group-hover:border-primary/20", `text-${item.color}`)}>{file}</code>
                ))}
              </div>
            </GlassCard>
          ))}
        </div>

        <div className="bg-bg-surface/50 p-8 rounded-[1px] border border-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-flat">
           <div className="flex items-center gap-4">
              <Bot className="w-8 h-8 text-primary opacity-40" />
              <div>
                <span className="text-[10px] font-black text-text-main uppercase tracking-widest italic block">Architectural Note:</span>
                <p className="text-[11px] font-bold text-text-muted italic opacity-60">&quot;Maintain absolute geometric consistency across all federated view nodes.&quot;</p>
              </div>
           </div>
           <Button variant="wireframe" className="h-10 px-8 text-[10px] font-black uppercase tracking-widest italic border-border hover:bg-bg-base">
              SYSTEM_TOPOLOGY_MAP
           </Button>
        </div>
      </motion.section>
    </motion.div>
  );
}
