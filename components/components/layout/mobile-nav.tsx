"use client";

import { Sparkles, LayoutDashboard, Compass, Bot, Library, Map } from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";

export function MobileNav() {
  const { activeTab, setActiveTab, lang, setIsSpiritOpen } = useAppContext();

  const MOBILE_NAV_ITEMS = [
    { id: "dashboard", label: { zh: "首頁 (Home)", en: "Home" }, icon: LayoutDashboard },
    { id: "report-journey", label: { zh: "旅程 (Journey)", en: "Journey" }, icon: Map },
    { id: "spirit", label: { zh: "精靈 (Spirit)", en: "Spirit" }, isCenter: true },
    { id: "junaikey", label: { zh: "智能 (AI)", en: "AI" }, icon: Bot },
    { id: "library", label: { zh: "書庫 (Library)", en: "Library" }, icon: Library },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-surface/90 backdrop-blur-xl border-t border-primary/20 z-40 pb-safe">
      <div className="grid grid-cols-5 h-16 px-1">
        {MOBILE_NAV_ITEMS.map((item) => {
          if (item.isCenter) {
            return (
              <div key="center" className="flex items-center justify-center">
                <button
                  onClick={() => setIsSpiritOpen(true)}
                  className="flex items-center justify-center transform transition-transform active:scale-95"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center group">
                    <div className="absolute inset-0 bg-bg-surface rounded-full border border-primary/20 group-hover:border-primary/40 transition-colors" />
                    <div className="absolute inset-0.5 bg-bg-base rounded-full flex items-center justify-center overflow-hidden border border-primary/10">
                      <div className="w-full h-full bg-[url('https://thumbs4.imagebam.com/e5/b8/6c/ME1B44KB_t.png')] bg-cover bg-center opacity-90 transition-transform group-hover:scale-110" />
                    </div>
                  </div>
                </button>
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? "text-primary" : "text-text-muted hover:text-text-main"
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-1 ${isActive ? "text-primary" : ""}`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-medium ${isActive ? "font-bold" : ""}`}>
                {item.label.en}
              </span>
            </button>
          );
        })}
      </div>
    </div>

  );
}
