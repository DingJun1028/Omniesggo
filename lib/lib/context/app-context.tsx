"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "zh" | "en";

interface AppContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isSpiritOpen: boolean;
  setIsSpiritOpen: (isOpen: boolean) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  goodnessCoins: number;
  setGoodnessCoins: React.Dispatch<React.SetStateAction<number>>;
  sustainabilityGems: number;
  setSustainabilityGems: React.Dispatch<React.SetStateAction<number>>;
  isReportingWizardOpen: boolean;
  setIsReportingWizardOpen: (isOpen: boolean) => void;
  reportingWizardStep: number;
  setReportingWizardStep: (step: number) => void;
  aiProxyMode: boolean;
  setAiProxyMode: (enabled: boolean) => void;
  theme: "light" | "dark" | "emerald" | "amber" | "ice" | "milktea";
  setTheme: (theme: "light" | "dark" | "emerald" | "amber" | "ice" | "milktea") => void;
}


const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSpiritOpen, setIsSpiritOpen] = useState(false);
  const [lang, setLang] = useState<Language>("zh");
  const [showNotifications, setShowNotifications] = useState(false);
  const [goodnessCoins, setGoodnessCoins] = useState(1250);
  const [sustainabilityGems, setSustainabilityGems] = useState(15);
  const [isReportingWizardOpen, setIsReportingWizardOpen] = useState(false);
  const [reportingWizardStep, setReportingWizardStep] = useState(0);
  const [aiProxyMode, setAiProxyMode] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "emerald" | "amber" | "ice" | "milktea">("light");

  React.useEffect(() => {
    // Clean up all theme classes
    const themeClasses = ["dark-mode", "theme-emerald", "theme-amber", "theme-ice", "theme-milktea"];
    document.body.classList.remove(...themeClasses);

    // Apply specific theme class
    if (theme === "dark") document.body.classList.add("dark-mode");
    if (theme === "emerald") document.body.classList.add("theme-emerald");
    if (theme === "amber") document.body.classList.add("theme-amber");
    if (theme === "ice") document.body.classList.add("theme-ice");
    if (theme === "milktea") document.body.classList.add("theme-milktea");
  }, [theme]);


  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isSidebarOpen,
        setIsSidebarOpen,
        isSpiritOpen,
        setIsSpiritOpen,
        lang,
        setLang,
        showNotifications,
        setShowNotifications,
        goodnessCoins,
        setGoodnessCoins,
        sustainabilityGems,
        setSustainabilityGems,
        isReportingWizardOpen,
        setIsReportingWizardOpen,
        reportingWizardStep,
        setReportingWizardStep,
        aiProxyMode,
        setAiProxyMode,
        theme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
