"use client";

import { motion } from "framer-motion";
import { Menu, User } from "lucide-react";
import { NAVIGATION, SECTION_LABELS } from "@/lib/config/navigation";
import { useAppContext } from "@/lib/context/app-context";

// ⚡ Bolt: Hoisted static configurations to module scope to prevent reallocation on every re-render
const PROXY_LABELS: Record<string, { zh: string; en: string }> = {
  "dashboard": { zh: "Omni Core (萬能核心)", en: "Omni AI Core" },
  "reconnaissance": { zh: "Omni Monitor (萬能監測)", en: "Omni Monitor" },
  "omni-note": { zh: "Omni WuZuo (悟作筆記)", en: "Omni AI WuZuo" },
  "omni-knowledge": { zh: "Omni ThinkTank (萬能智庫)", en: "Omni ThinkTank" },
  "omni-hub": { zh: "Omni Hub (萬能圓通)", en: "Omni Center" },
  "omni-truth": { zh: "Omni QA (萬能核對)", en: "Omni AI QA" },
};

const SECTIONS = ["recon", "settle", "evidence", "draft", "assets", "system"];

export function Sidebar() {
  const { activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, lang, aiProxyMode } =
    useAppContext();

  return (
    <motion.aside
      initial={{ width: 280 }}
      animate={{ width: isSidebarOpen ? 280 : 80 }}
      className="hidden md:flex h-full border-r border-border bg-bg-base flex-col transition-all duration-200 z-30 shadow-flat"
    >

      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center group">
              <div className="absolute inset-0 bg-bg-surface rounded-full border border-border transition-opacity" />
              <div className="absolute inset-0.5 bg-bg-base rounded-full flex items-center justify-center overflow-hidden border border-border">
                <div className="w-full h-full bg-[url('https://thumbs4.imagebam.com/e5/b8/6c/ME1B44KB_t.png')] bg-cover bg-center opacity-90" />
              </div>
            </div>
            <span className="font-bold text-lg leading-tight text-text-main whitespace-nowrap flex flex-col">
              ESG GO v1.0
              <span className={`text-[10px] ${aiProxyMode ? 'text-proxy' : 'text-primary'} font-medium tracking-widest -mt-0.5`}>
                善向永續
              </span>
            </span>

          </motion.div>
        )}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-primary/5 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"
          aria-label={isSidebarOpen ? "收起側邊欄" : "展開側邊欄"}
          title={isSidebarOpen ? "收起側邊欄" : "展開側邊欄"}
        >
          <Menu className="w-5 h-5 text-text-muted hover:text-primary transition-colors" aria-hidden="true" />
        </button>

      </div>

      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        {SECTIONS.map((sectionId) => {
          const sectionItems = NAVIGATION.filter(item => item.section === sectionId);
          if (sectionItems.length === 0) return null;

          return (
            <div key={sectionId} className="space-y-1">
              {isSidebarOpen && (
                <div className="px-4 mb-2">
                  <span className="text-[10px] font-bold text-text-muted opacity-70 uppercase tracking-[0.2em]">
                    {SECTION_LABELS[sectionId][lang]}
                  </span>
                </div>

              )}
              {sectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const localizedLabel = (aiProxyMode && PROXY_LABELS[item.id])
                  ? PROXY_LABELS[item.id][lang as 'zh' | 'en']
                  : (item.label ? item.label[lang as 'zh' | 'en'] : item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-1.5 rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      isActive
                        ? aiProxyMode 
                          ? "bg-proxy/10 text-proxy font-semibold border-l-2 border-proxy"
                          : "bg-primary/10 text-primary font-semibold border-l-2 border-primary"
                        : "text-text-muted hover:bg-primary/5 hover:text-text-main border-l-2 border-transparent"
                    }`}
                    aria-label={!isSidebarOpen ? localizedLabel : undefined}
                    title={!isSidebarOpen ? localizedLabel : undefined}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${isActive ? (aiProxyMode ? "text-proxy" : "text-primary") : ""}`}
                      aria-hidden="true"
                    />

                    {isSidebarOpen && (
                      <span className="text-[14px] whitespace-nowrap overflow-hidden text-ellipsis">
                        {localizedLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border bg-bg-base">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-bg-surface border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
            <User className="w-5 h-5 text-text-muted" />
          </div>

          {isSidebarOpen && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-text-main truncate">
                Admin User
              </span>
              <span className="text-xs text-text-muted truncate">
                admin@esggo.com
              </span>
            </div>

          )}
        </div>
      </div>
    </motion.aside>
  );
}
