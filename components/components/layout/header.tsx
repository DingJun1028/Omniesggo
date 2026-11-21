"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Search,
  Bell,
  FileText,
  Activity,
  BookOpen,
  Coins,
  Gem,
  Zap,
  Bot,
  Palette,
  Sun,
  Moon,
  Droplets,
  Box,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { NAVIGATION } from "@/lib/config/navigation";
import { useAppContext } from "@/lib/context/app-context";

// ⚡ Bolt: Hoisted static configurations to module scope to prevent reallocation on every re-render
const PROXY_LABELS: Record<string, { zh: string; en: string }> = {
  "dashboard": { zh: "萬能核心", en: "Omni AI Core" },
  "reconnaissance": { zh: "萬能監測", en: "Omni Monitor" },
  "omni-note": { zh: "萬能採集", en: "Omni AI Harvest" },
  "omni-truth": { zh: "萬能核對", en: "Omni AI QA" },
  "reports": { zh: "萬能生成", en: "Omni AI Draft" },
  "omni-src": { zh: "萬能管理", en: "Omni AI Proxy" },
  "newsletter": { zh: "萬能專欄", en: "Omni AI Newsletter" },
  "omni-chrono": { zh: "萬能時程", en: "Omni AI Timeline" },
  "omni-aura": { zh: "萬能主題", en: "Omni OmniAura" },
};

const THEMES = [
  { id: "light", name: "晨光清泉 (Morning)", icon: Sun },
  { id: "dark", name: "深空光流 (Deep Space)", icon: Moon },
  { id: "emerald", name: "翡翠森林 (Emerald)", icon: Droplets },
  { id: "amber", name: "琥珀赤沙 (Amber)", icon: Zap },
  { id: "ice", name: "冰晶極光 (Ice)", icon: Box },
] as const;

export function Header() {
  const {
    activeTab,
    lang,
    setLang,
    showNotifications,
    setShowNotifications,
    goodnessCoins,
    sustainabilityGems,
    aiProxyMode,
    setAiProxyMode,
    theme,
    setTheme
  } = useAppContext();

  const activeLabel = (() => {
    const item = NAVIGATION.find((n) => n.id === activeTab);
    if (!item) return "";
    
    if (aiProxyMode && PROXY_LABELS[activeTab]) {
      return PROXY_LABELS[activeTab].zh;
    }
    return item.label?.zh || item.id;
  })();

  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const activeThemeObj = THEMES.find(t => t.id === theme) || THEMES[1];

  return (
    <header className="h-20 border-b border-border bg-bg-base/80 backdrop-blur-md flex items-center justify-between px-8 z-20 sticky top-0 transition-all duration-200">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-text-main tracking-tight">
          {activeLabel}
        </h1>

        <Badge
          variant={aiProxyMode ? "critical" : "optimal"}
          styleType="soft"
          className={`flex items-center gap-2 ${aiProxyMode ? 'bg-proxy/10 text-proxy border-proxy/20' : 'bg-primary/10 text-primary border-primary/20'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${aiProxyMode ? "bg-proxy" : "bg-status-optimal"}`} />
          {lang === "zh" 
            ? (aiProxyMode ? "自動" : "手動") 
            : (aiProxyMode ? "Auto" : "Manual")}
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        {/* Currency Display */}
        <div className="hidden md:flex items-center gap-3 mr-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
            <Coins className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold text-accent">
              {goodnessCoins.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-surface border border-border rounded-full">
            <Gem className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">
              {sustainabilityGems.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={() => setAiProxyMode(!aiProxyMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 text-xs font-bold shadow-flat focus-visible:ring-2 focus-visible:ring-primary focus:outline-none ${
            aiProxyMode 
              ? 'bg-proxy/20 border-proxy/40 text-proxy' 
              : 'bg-bg-surface border-primary/30 text-primary hover:border-primary'
          }`}
          title={aiProxyMode ? "切換至手動模式" : "切換至自動模式"}
          aria-pressed={aiProxyMode}
        >
          {aiProxyMode ? (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>自動模式 (Auto Mode)</span>
            </>
          ) : (
            <>
              <Bot className="w-3.5 h-3.5" aria-hidden="true" />
              <span>手動模式 (Manual Mode)</span>
            </>
          )}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex items-center gap-2 p-2.5 hover:bg-primary/5 rounded-xl transition-colors text-text-muted hover:text-primary group focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
            title={lang === "zh" ? "切換 Omni 主題" : "Switch Omni Theme"}
            aria-label={lang === "zh" ? "切換 Omni 主題" : "Switch Omni Theme"}
            aria-expanded={showThemeMenu}
            aria-haspopup="menu"
          >
            <activeThemeObj.icon className="w-4 h-4" aria-hidden="true" />
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showThemeMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>

          <AnimatePresence>
            {showThemeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-bg-surface border border-primary/15 rounded-xl shadow-crystal-locked z-50 overflow-hidden backdrop-blur-xl"
                >
                  <div className="p-2 border-b border-border/50 bg-bg-base/50">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] px-2 italic">
                      Omni Theme Switcher
                    </span>
                  </div>
                  <div className="p-1">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id);
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          theme === t.id 
                            ? 'bg-primary/10 text-primary font-bold' 
                            : 'text-text-muted hover:bg-primary/5 hover:text-text-main'
                        }`}
                      >
                        <t.icon className={`w-3.5 h-3.5 ${theme === t.id ? 'text-primary' : 'text-text-muted'}`} />
                        <span className="text-xs">{t.name}</span>
                        {theme === t.id && (
                          <div className="ml-auto w-1 h-1 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setLang(lang === "zh" ? "en" : "zh")}
          className="flex items-center gap-2 p-2.5 hover:bg-primary/5 rounded-xl transition-colors text-text-muted hover:text-primary text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
          aria-label={lang === "zh" ? "Switch to English" : "切換至中文"}
          title={lang === "zh" ? "Switch to English" : "切換至中文"}
        >
          <Globe className="w-4 h-4" aria-hidden="true" />
          {lang === "zh" ? "EN" : "中文"}
        </button>

        <div className="relative hidden md:block group">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Omni Search (⌘K)..."
            className="bg-bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 w-40 focus:w-64 transition-all duration-300 placeholder-text-muted/50 font-medium"
            suppressHydrationWarning
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 hover:bg-primary/5 rounded-xl transition-colors relative flex items-center justify-center group focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
            aria-label={lang === "zh" ? "通知中心" : "Notifications"}
            title={lang === "zh" ? "通知中心" : "Notifications"}
            aria-expanded={showNotifications}
            aria-haspopup="dialog"
          >
            <Bell className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" aria-hidden="true" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-status-lethal rounded-full" />
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-bg-surface rounded-xl shadow-crystal-locked border border-primary/15 z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-bg-base">
                  <h3 className="font-bold text-text-main text-sm">
                    通知中心 (Notifications)
                  </h3>
                  <Badge variant="lethal" styleType="soft">
                    3 則未讀
                  </Badge>
                </div>

                <div className="max-h-[300px] overflow-y-auto">
                  {[
                    {
                      title: lang === "zh" ? "單據收集提醒" : "Voucher Reminder",
                      desc: lang === "zh" ? "「ISO 14064-1 查證聲明書」已由環安衛部門上傳。" : "ISO 14064-1 statement uploaded.",
                      time: "10m ago",
                      icon: FileText,
                      color: "text-primary",
                      bg: "bg-primary/10",
                    },
                    {
                      title: lang === "zh" ? "AI 異常偵測" : "AI Anomaly",
                      desc: lang === "zh" ? "Gnosis Engine 發現範疇三數據有 15% 偏差。" : "Gnosis Engine detected 15% deviation in Scope 3.",
                      time: "1h ago",
                      icon: Activity,
                      color: "text-accent",
                      bg: "bg-accent/10",
                    },
                    {
                      title: lang === "zh" ? "報告書進度" : "Report Progress",
                      desc: lang === "zh" ? "「2.01 永續發展策略」已由 Admin 儲存為草稿。" : "Chapter 2.01 saved as draft by Admin.",
                      time: "2h ago",
                      icon: BookOpen,
                      color: "text-primary",
                      bg: "bg-primary/10",
                    },
                  ].map((notif, i) => (
                    <div
                      key={i}
                      className="p-4 border-b border-primary/10 hover:bg-primary/5 transition-colors cursor-pointer flex gap-3"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${notif.bg}`}>
                        <notif.icon className={`w-4 h-4 ${notif.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-main mb-0.5">{notif.title}</p>
                        <p className="text-xs text-text-muted leading-relaxed mb-1">{notif.desc}</p>
                        <p className="text-[10px] text-text-muted/60">{notif.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center border-t border-border bg-bg-surface hover:bg-bg-base cursor-pointer transition-colors" onClick={() => setShowNotifications(false)}>
                  <span className="text-xs font-medium text-primary">
                    {lang === "zh" ? "查看全部" : "View All"}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
