"use client";

import { motion } from "motion/react";
import { ViewHeader } from "@/components/ui/view-header";
import { PAGE_GUIDES } from "@/lib/config/guides";
import { BookOpen, Palette, Box, MousePointer2, Type, Layout, Zap, ShieldCheck, Search, Bot, Database } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/lib/context/app-context";

export function OmniLibraryView() {
  const { theme, setTheme, aiProxyMode } = useAppContext();

  const themes = [
    { id: "light", name: "晨光清泉 (Omni Morning)", icon: "🌅" },
    { id: "dark", name: "深空光流 (Omni Deep Space)", icon: "🌌" },
    { id: "emerald", name: "翡翠森林 (Omni Emerald)", icon: "🌿" },
    { id: "amber", name: "琥珀赤沙 (Omni Amber)", icon: "🏜️" },
    { id: "ice", name: "冰晶極光 (Omni Ice)", icon: "❄️" },
    { id: "milktea", name: "珍珠奶茶 (Omni Milk Tea)", icon: "🧋" },
  ] as const;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1] as any
      } 
    },
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-8 space-y-12 max-w-7xl mx-auto pb-48"
    >
      <ViewHeader 
        title="Omni Atomic Library"
        subtitle="Industrial Standard Components"
        description="這是 ESG SUNSHINE 的萬能原子組件庫。所有組件均採原子級標籤封裝，能隨時適應五大 Omni 主題風格，確保「上善若水」的設計一致性。"
        accent="from-primary/20 to-transparent"
        tag="LIB"
        icon={BookOpen}
        guideSteps={PAGE_GUIDES["omni-library"]}
        aiProxyMode={aiProxyMode}
      />

      {/* Theme Switcher Gallery */}
      <motion.section variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">Omni 主題切換矩陣</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`p-6 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-3 group relative overflow-hidden ${
                theme === t.id 
                  ? 'border-primary bg-primary/10 shadow-2xl scale-[1.02]' 
                  : 'border-border bg-bg-surface hover:border-primary/50 hover:bg-bg-surface/50'
              }`}
            >
              <span className="text-4xl group-hover:scale-125 transition-transform duration-500">{t.icon}</span>
              <span className={`text-[11px] font-black uppercase tracking-widest ${theme === t.id ? 'text-primary' : 'text-text-muted'}`}>
                {t.name}
              </span>
              {theme === t.id && (
                <motion.div 
                  layoutId="activeTheme"
                  className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none"
                />
              )}
            </button>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Colors & Tokens */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-main">設計標籤 (Design Tokens)</h2>
          </div>
          <GlassCard className="p-6 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Background Base", token: "bg-bg-base", class: "bg-bg-base border-border" },
                { label: "Surface Layer", token: "bg-bg-surface", class: "bg-bg-surface border-border" },
                { label: "Primary Core", token: "bg-primary", class: "bg-primary border-transparent" },
                { label: "Accent Highlight", token: "bg-accent", class: "bg-accent border-transparent" },
                { label: "AI Proxy Sync", token: "bg-proxy", class: "bg-proxy border-transparent" },
                { label: "Border Token", token: "bg-border", class: "bg-border border-transparent" },
              ].map((c) => (
                <div key={c.label} className="space-y-2">
                  <div className={`h-12 rounded-lg border shadow-sm ${c.class}`} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-main uppercase">{c.label}</span>
                    <span className="text-[9px] font-mono text-text-muted italic">{c.token}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Semantic Signals</span>
              <div className="flex gap-4">
                <Badge variant="lethal" styleType="solid">Lethal State</Badge>
                <Badge variant="lethal" styleType="soft">Lethal Soft</Badge>
                <Badge variant="optimal" styleType="solid">Optimal Path</Badge>
                <Badge variant="optimal" styleType="soft">Optimal Soft</Badge>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Buttons & Interaction */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <MousePointer2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-main">原子按鈕 (Interactive Atoms)</h2>
          </div>
          <GlassCard className="p-6 space-y-10">
            <div className="flex flex-wrap gap-4">
              <Button variant="solid">主要操作 (Solid)</Button>
              <Button variant="wireframe">線框操作 (Wireframe)</Button>
              <Button variant="gold">品牌強調 (Gold)</Button>
              <Button variant="solid" className="bg-proxy hover:bg-proxy/90 text-white border-none">
                AI 代理模式
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase">Toggle States</span>
                <div className="w-12 h-6 rounded-full bg-primary/20 border border-primary/30 relative cursor-pointer p-1">
                  <div className="w-4 h-4 rounded-full bg-primary absolute right-1" />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase">Selection Filter</span>
                <div className="px-3 py-1.5 rounded-lg border border-primary bg-primary/10 text-primary text-[10px] font-bold text-center">
                  ACTIVE_NODE
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-muted uppercase">Ghost Action</span>
                <div className="text-text-muted hover:text-primary transition-colors cursor-pointer text-[10px] font-bold underline underline-offset-4">
                  REVERT_CHANGE
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-main">字體與層次 (Hierarchy)</h2>
          </div>
          <GlassCard className="p-6 space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-muted uppercase">H1 Platform Header</span>
              <h3 className="text-3xl font-black text-text-main tracking-tighter">OMNI_KINETICS_V1.0</h3>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-text-muted uppercase">H2 Section Title</span>
              <h3 className="text-xl font-bold text-text-main">Environmental Social Governance</h3>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-text-muted uppercase">Body Context</span>
              <p className="text-sm text-text-muted leading-relaxed">
                萬能主題原子組件書旨在規範全系統視覺一致性。透過物理性極簡設計，將繁瑣的 ESG 數據轉化為純粹的視覺回饋，讓決策者能直覺感應系統脈動。
              </p>
            </div>
          </GlassCard>
        </section>

        {/* Liquid Glass Showcase */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-main">物理玻璃態 (Liquid Glass)</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <GlassCard variant="liquid" className="p-8 relative h-48 flex items-center justify-center">
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-bold text-text-main tracking-widest">AQUA_FLOOD_ACTIVE</span>
              </div>
              <p className="text-2xl font-black text-text-main/80 uppercase italic drop-shadow-sm text-center">
                Refraction & <span className="text-primary underline">Backdrop Blur</span>
              </p>
            </GlassCard>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="liquid-glass p-4 rounded-xl flex items-center gap-3">
                <Database className="w-5 h-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-main">DATA_STREAM</span>
                  <span className="text-[8px] text-text-muted font-mono tracking-tighter">0x4F...B2E1</span>
                </div>
              </div>
              <div className="liquid-glass p-4 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-status-optimal" />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-text-main">TRUST_STAMP</span>
                  <span className="text-[8px] text-text-muted font-mono tracking-tighter">ISO_UN_2024</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Complex Components Preview */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-text-main">複合組件預覽 (Omni Compounds)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <GlassCard className="p-6 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-text-main uppercase">Audit Trace</span>
                </div>
                <Badge variant="optimal" styleType="soft">Verified</Badge>
             </div>
             <div className="h-2 bg-bg-surface rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[85%]" />
             </div>
             <p className="text-[10px] text-text-muted italic">Evidence collection in progress: 24/30 items matched.</p>
          </GlassCard>

          <GlassCard className="p-6 flex flex-col items-center justify-center gap-6">
             <div className="relative w-16 h-16">
                 <div className={`absolute inset-0 rounded-full border border-dashed animate-spin-slow ${aiProxyMode ? 'border-proxy/40' : 'border-primary/40'}`} />
                 <div className={`absolute inset-2 rounded-full bg-gradient-to-br transition-all duration-300 ${aiProxyMode ? 'from-proxy to-proxy/60' : 'from-primary to-primary/60'}`} />
             </div>
             <div className="text-center">
                <span className="text-[10px] font-black text-text-main uppercase block">Spirit AI Status</span>
                <span className={`text-[10px] font-bold uppercase ${aiProxyMode ? 'text-proxy' : 'text-primary'}`}>
                   {aiProxyMode ? 'Omni Proxy ACTIVE' : 'Manual Sync Mode'}
                </span>
             </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
             <div className="flex items-center gap-2 text-accent">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Compliance Node</span>
             </div>
             <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-[10px] text-text-main font-semibold">Requirement_0{i}</span>
                    <div className="w-2 h-2 rounded-full bg-status-optimal" />
                  </div>
                ))}
             </div>
          </GlassCard>
        </div>
      </section>
      {/* Infrastructure & Navigation Guide */}
      <motion.section variants={itemVariants} className="space-y-8 pt-12 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-text-main tracking-tight uppercase">System Infrastructure Guide</h2>
            <p className="text-xs text-text-muted font-bold tracking-widest uppercase mt-1">開發者快速巡航連結</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-8 border-l-4 border-l-primary hover:bg-primary/5 transition-all group">
            <div className="flex flex-col h-full justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm font-black text-text-main uppercase tracking-tighter">基礎樣式 (Core Styles)</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  管理全系統的色彩標籤、玻璃態係數、動畫曲線與全局佈局變量。
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <code className="text-[10px] bg-bg-base p-2 rounded border border-border text-primary font-mono select-all">/app/globals.css</code>
                <code className="text-[10px] bg-bg-base p-2 rounded border border-border text-primary font-mono select-all">/components/ui/*</code>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 border-l-4 border-l-accent hover:bg-accent/5 transition-all group">
            <div className="flex flex-col h-full justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span className="text-sm font-black text-text-main uppercase tracking-tighter">頁面內容 (View Matrix)</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  微調各個功能視圖細節，包含五感五德分類下的所有商務邏輯呈現層。
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <code className="text-[10px] bg-bg-base p-2 rounded border border-border text-accent font-mono select-all">/components/views/*</code>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-8 border-l-4 border-l-proxy hover:bg-proxy/5 transition-all group">
            <div className="flex flex-col h-full justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-proxy" />
                  <span className="text-sm font-black text-text-main uppercase tracking-tighter">AI 邏輯 (Core Logic)</span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  調整萬能代理 (Omni Agent) 的對話策略、決策權重與全局狀態同步邏輯。
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <code className="text-[10px] bg-bg-base p-2 rounded border border-border text-proxy font-mono select-all">/lib/agents/*</code>
                <code className="text-[10px] bg-bg-base p-2 rounded border border-border text-proxy font-mono select-all">/lib/context/app-context.tsx</code>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="bg-bg-surface p-4 rounded-xl border border-border flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-text-main uppercase">Omni Architect Note:</span>
              <p className="text-xs text-text-muted italic">&quot;Always maintain the atomic integrity of components before scaling views.&quot;</p>
           </div>
           <Button variant="wireframe" className="h-8 text-[10px]">
              VIEW_SYSTEM_MAP
           </Button>
        </div>
      </motion.section>
    </motion.div>
  );
}
