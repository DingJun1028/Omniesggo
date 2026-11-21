"use client";

import { Menu, Bell, Globe, X, FileText, Activity, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/lib/context/app-context";
import { NAVIGATION } from "@/lib/config/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function MobileHeader() {
  const { activeTab, setActiveTab, lang, setLang, showNotifications, setShowNotifications } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentNav = NAVIGATION.find((n) => n.id === activeTab);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-bg-surface/80 backdrop-blur-xl border-b border-primary/20 flex items-center justify-between px-6 z-[80] md:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 -ml-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
            aria-label="開啟選單 (Open Menu)"
            title="開啟選單 (Open Menu)"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
        
        <h1 className="text-base md:text-lg font-bold text-text-main truncate max-w-[200px] absolute left-1/2 -translate-x-1/2 text-center">
          {currentNav?.label?.[lang as keyof NonNullable<typeof currentNav.label>] || currentNav?.label?.zh || currentNav?.id}
        </h1>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setLang(lang === "zh" ? "en" : "zh")}
            className="p-2 text-text-muted hover:text-primary text-xs font-bold hover:bg-primary/10 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
            aria-label="切換語言 (Toggle Language)"
            title="切換語言 (Toggle Language)"
          >
            {lang === "zh" ? "EN" : "中文"}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-text-muted hover:text-primary relative hover:bg-primary/10 rounded-xl transition-colors group focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
              aria-label="通知 (Notifications)"
              title="通知 (Notifications)"
            >
              <Bell className="w-5 h-5 group-hover:text-primary transition-colors" aria-hidden="true" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-status-lethal rounded-full shadow-[0_0_8px_var(--color-status-lethal)]" />
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-0 z-[90]"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-bg-surface rounded-xl shadow-crystal-locked border border-primary/15 z-[100] overflow-hidden"
                  >
                    <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-bg-base">
                      <h3 className="font-bold text-text-main text-sm">
                        {lang === "zh" ? "通知中心 (Notifications)" : "Notifications"}
                      </h3>
                      <Badge variant="optimal" styleType="soft">
                        3 {lang === "zh" ? "則未讀 (Unread)" : "New"}
                      </Badge>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {[
                        {
                          title: lang === "zh" ? "單據收集提醒 (Voucher)" : "Voucher Reminder",
                          desc: lang === "zh" ? "「ISO 14064-1 查證聲明書」已由環安衛部門上傳。" : "ISO 14064-1 statement uploaded.",
                          time: "10m ago",
                          icon: FileText,
                          color: "text-primary",
                          bg: "bg-primary/10",
                        },
                        {
                          title: lang === "zh" ? "AI 異常偵測 (Anomaly)" : "AI Anomaly",
                          desc: lang === "zh" ? "Gnosis Engine 發現範疇三數據有 15% 偏差。" : "Gnosis Engine detected 15% deviation in Scope 3.",
                          time: "1h ago",
                          icon: Activity,
                          color: "text-accent",
                          bg: "bg-accent/10",
                        },
                        {
                          title: lang === "zh" ? "報告書進度 (Progress)" : "Report Progress",
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
                        {lang === "zh" ? "查看全部 (View All)" : "View All"}
                      </span>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[90] md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-bg-base z-[100] md:hidden flex flex-col shadow-xl border-r border-primary/10"
            >
              <div className="p-4 border-b border-primary/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <span className="font-bold text-lg tracking-tight text-text-main">
                  ESG <span className="text-primary">GO</span>
                </span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="ml-auto p-2 text-text-muted hover:text-primary rounded-full hover:bg-primary/10 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
                  aria-label="關閉選單 (Close Menu)"
                  title="關閉選單 (Close Menu)"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 pb-20">
                {NAVIGATION.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                          : "text-text-muted hover:bg-primary/5 border-l-2 border-transparent"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-text-muted"}`} />
                      <span className="text-sm">{item.label?.[lang as keyof NonNullable<typeof item.label>] || item.label?.zh || item.id}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
