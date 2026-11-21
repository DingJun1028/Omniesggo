"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { EsgReportPdf } from "@/components/ui/esg-report-pdf";
import { PAGE_GUIDES } from "@/lib/config/guides";
import {
  Wand2,
  Grid,
  Archive,
  Globe,
  Play,
  PenTool,
  ShieldCheck,
  Lock,
  Send,
  Database,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Terminal,
  Sparkles,
  Save,
  Download,
  FileText,
  Cpu,
  RefreshCw,
  Eye,
  Shield,
  Layers,
  PieChart
} from "lucide-react";

import { useAppContext } from "@/lib/context/app-context";
import { ViewHeader } from "@/components/ui/view-header";

const CORE_MODULES = [
  {
    id: "Smart Assistant",
    name: "智能生成助手",
    desc: "基於 GRI 2026 標準，提供 200/300/500 頁自動化生成路徑，整合筆記中心資料。",
    icon: Wand2,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "Benchmark Hub",
    name: "產業基準對比",
    desc: "自動分析同產業前 5 大指標企業報告並進行維度對比，定位競爭點。",
    icon: Globe,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    id: "Evidence Drawer",
    name: "佐證文件包",
    desc: "數據可點擊溯源至原始憑證 (Vouchers)，確保報告真實性。",
    icon: Archive,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    id: "Compliance Lock",
    name: "合規封存",
    desc: "通過 Gemini 97 項指標合規檢索後，執行數位簽章鎖定防止竄改。",
    icon: ShieldCheck,
    color: "text-status-lethal",
    bg: "bg-status-lethal/10",
  },
];

const FORGING_FLOW = [
  {
    id: "1. Data Collection",
    title: "數據採集與同步",
    desc: "自動獲取內部指標，對接產業基準數據庫。",
    icon: Play,
  },
  {
    id: "2. Chapter Synthesis",
    title: "報告寫作與章節生成",
    desc: "規劃標準章節結構，執行 DMA 演算法轉譯與敘事生成。",
    icon: PenTool,
  },
  {
    id: "3. Audit & Verification",
    title: "品質審計與核對",
    desc: "進行差異分析與核實，確保指標精準與合規。",
    icon: ShieldCheck,
  },
  {
    id: "4. Digital Signature",
    title: "數據封存與簽章",
    desc: "執行封存程序，生成數位簽章防止資料變動。",
    icon: Lock,
  },
  {
    id: "5. Publication",
    title: "報告出具",
    desc: "產出具備競爭力數據的高保真 PDF 報告，完成文件存證。",
    icon: Send,
  },
];

interface ChapterData {
  id: string;
  title: string;
  status: 'pending' | 'drafting' | 'completed';
  content: string;
  dataPoints: string[];
}

const DEFAULT_CHAPTERS: ChapterData[] = [
  { id: 'ch1', title: 'CH 1. 永續願景與高階領導', status: 'pending', content: '（生成中...）', dataPoints: [] },
  { id: 'ch2', title: 'CH 2. 雙重重大性議題與利害關係人', status: 'pending', content: '（生成中...）', dataPoints: [] },
  { id: 'ch3', title: 'CH 3. 淨零碳排與環境永續 (E)', status: 'pending', content: '（生成中...）', dataPoints: [] },
  { id: 'ch4', title: 'CH 4. 社會共融與人才發展 (S)', status: 'pending', content: '（生成中...）', dataPoints: [] },
  { id: 'ch5', title: 'CH 5. 誠信經營與風險管理 (G)', status: 'pending', content: '（生成中...）', dataPoints: [] },
  { id: 'appx', title: '附錄：GRI / SASB 內容對照表', status: 'pending', content: '（生成中...）', dataPoints: [] },
];

export function ReportsView() {
  const { 
    isReportingWizardOpen: isWizardActive, 
    setIsReportingWizardOpen: setIsWizardActive,
    reportingWizardStep: currentStep,
    setReportingWizardStep: setCurrentStep,
    setActiveTab,
    aiProxyMode,
    lang
  } = useAppContext();

  const branding = aiProxyMode ? {
      title: lang === "zh" ? "萬能智稿生成" : "Omni AI Draft",
      subtitle: "Omni AI Agent",
      description: lang === "zh" ? "萬能代理：AI 自主彙整數據並生成永續報告，支持合規封存與數位簽章。" : "Omni AI agent auto-generating reports with compliance sealing.",
      accent: "from-primary to-primary/60",
      tag: "[自動]",
      icon: Terminal,
      guideSteps: PAGE_GUIDES["omni-src"]
  } : {
      title: lang === "zh" ? "萬能報告生成" : "Omni Report Tool",
      subtitle: "Omni Manual Control",
      description: lang === "zh" ? "萬能監測：手動引導報告生成工作流，基於國際標準鍛造永續報告。" : "Manually guided report forging based on international standards.",
      accent: "from-primary/20 to-transparent",
      tag: "[手動]",
      icon: Wand2,
      guideSteps: PAGE_GUIDES["omni-src"]
  };

  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [reportScale, setReportScale] = useState<200 | 300 | 500>(300);
  const [synthesisPath, setSynthesisPath] = useState<
    "conservative" | "aggressive" | "visionary" | null
  >(null);
  
  // Chapter Drafting State
  const [draftingPhase, setDraftingPhase] = useState<'setup' | 'writing' | 'review'>('setup');
  const [chapters, setChapters] = useState<ChapterData[]>(DEFAULT_CHAPTERS);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [selectedReviewChapter, setSelectedReviewChapter] = useState<string | null>(null);

  const [hash, setHash] = useState<string | null>(null);
  const [isSavingToWuzuo, setIsSavingToWuzuo] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    setIsProcessing(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const body = clonedDoc.body;
          const html = clonedDoc.documentElement;
          
          html.style.color = '#000000';
          html.style.backgroundColor = '#ffffff';
          body.style.color = '#000000';
          body.style.backgroundColor = '#ffffff';
          body.style.setProperty('--default-border-color', 'transparent');
          body.style.setProperty('--tw-ring-color', 'transparent');
          body.style.setProperty('--tw-shadow-color', 'transparent');
          
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            :root, body, * {
              --default-border-color: transparent !important;
              --tw-ring-color: transparent !important;
              --tw-shadow-color: transparent !important;
              --tw-outline-color: transparent !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("ESG_Sustainability_Report_2026.pdf");
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isWizardActive) return;
    const interval = setInterval(() => {
      setLastSaved(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [isWizardActive]);

  const addLog = (msg: string, delay: number) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setLogs((prev) => [
          ...prev,
          `[${new Date().toISOString().split("T")[1].slice(0, 8)}] ${msg}`,
        ]);
        resolve(true);
      }, delay);
    });
  };

  const handleInception = async () => {
    setIsProcessing(true);
    setLogs([]);
    await addLog("Initializing OmniAPI connection...", 500);
    await addLog("Connecting to 24 MECE Service Matrix...", 800);
    await addLog("Extracting Environmental (E) metrics...", 1000);
    await addLog("Extracting Social (S) & Governance (G) metrics...", 900);
    await addLog("Mapping data to FSC 97 indicators & SASB standards...", 1200);
    await addLog("Data collection complete. Ready for synthesis.", 500);
    setIsProcessing(false);
  };

  // The actual writing sequence loop
  const handleSynthesisSequence = async () => {
    if (!synthesisPath) return;
    setDraftingPhase('writing');
    setIsProcessing(true);
    setIsSavingToWuzuo(true);
    setLogs([]);

    await addLog(`Initializing Chapter Writing Algorithm [Scale: ${reportScale} Pages]...`, 500);
    
    let currentChIndex = 0;
    while(currentChIndex < chapters.length) {
      setActiveChapterIndex(currentChIndex);
      
      // Update status to drafting
      setChapters(prev => prev.map((ch, i) => i === currentChIndex ? { ...ch, status: 'drafting' } : ch));
      
      await addLog(`[${chapters[currentChIndex].title}] Step A: Extracting Matrix Data & Evidences...`, 600);
      await addLog(`[${chapters[currentChIndex].title}] Step B: Applying DMA (Management Approach) Logic...`, 600);
      await addLog(`[${chapters[currentChIndex].title}] Step C: Translating Narrative with '${synthesisPath}' Tone...`, 800);
      await addLog(`[${chapters[currentChIndex].title}] Step D: Binding Blockchain Hash Citations...`, 500);

      // Generating mock content based on chapter
      const mockContent = generateMockContentForChapter(chapters[currentChIndex].id, synthesisPath);

      // Update status to completed with content
      setChapters(prev => prev.map((ch, i) => i === currentChIndex ? { 
        ...ch, 
        status: 'completed', 
        content: mockContent,
        dataPoints: [`Hash Binding Verified.`, `DMA Mapped.`]
      } : ch));

      currentChIndex++;
    }

    await addLog("Draft generation successfully completed for all chapters.", 800);
    await addLog("Real-time sync to WuzuoNote completed.", 400);
    
    setActiveChapterIndex(-1);
    setIsProcessing(false);
    setIsSavingToWuzuo(false);
    setDraftingPhase('review');
    setSelectedReviewChapter('ch3'); // default open env chapter
  };

  const generateMockContentForChapter = (chId: string, tone: string) => {
    const toneAdjectives = {
      'conservative': '嚴謹且踏實地',
      'aggressive': '積極且具顛覆性地',
      'visionary': '極具前瞻願景地'
    }[tone] || '穩健地';

    switch(chId) {
      case 'ch3':
        return `【DMA: 氣候變遷與能源管理】\n我們${toneAdjectives}推動淨零碳排政策 (Input)，於 2025 年度斥資 1.2 億擴建太陽能儲能設施 (Process)。經嚴密結算，本年度用電降幅達 18% (Output)，且範疇一、二排放量成功維持在 12.4 tCO2e/M$ 的水準。未來我們將依循科學減碳目標 (SBTi) 進行動態檢討 (Feedback)。`;
      case 'ch4':
        return `【DMA: 多元平等與包容 (DE&I)】\n本集團${toneAdjectives}投資人才培育 (Input)，全面推行「全方位職能發展計畫」(Process)。本年度員工滿意度高達 94% (Output)，且中高階女性主管佔比躍升至 38.0%。在此過程中，我們設立了匿名回饋機制以確保持續優化職場環境 (Feedback)。`;
      default:
        return `【DMA 管理方針】\n遵循 GRI 相關準則，我們${toneAdjectives}制定並執行對應專案。此章節詳述了投入資源 (Input)、執行計畫 (Process)、評估成效 (Output) 與修正反饋 (Feedback) 之完整紀錄。`;
    }
  };

  const handleAudit = async () => {
    setIsProcessing(true);
    setLogs([]);
    await addLog("Connecting to Gemini Pro Audit Engine...", 500);
    await addLog("Running zero-hallucination verification...", 1200);
    await addLog("Cross-referencing with Evidence Drawer vouchers...", 1000);
    await addLog("FSC 97 Compliance: PASSED", 600);
    await addLog("SASB Alignment: PASSED", 400);
    await addLog("Audit complete. Report is ready for sealing.", 500);
    setIsProcessing(false);
  };

  const handleSealing = async () => {
    setIsProcessing(true);
    setLogs([]);
    await addLog("Initiating ReportService.seal()...", 500);
    await addLog("Compiling final document structure...", 800);
    await addLog("Generating SHA-256 Digital Signature...", 1000);
    const generatedHash =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    setHash(generatedHash);
    await addLog(`Hash Locked: ${generatedHash}`, 500);
    await addLog("Syncing to User Growth Database (NCBDB)...", 800);
    await addLog("Asset sealed successfully.", 400);
    setIsProcessing(false);
  };

  const resetWizard = () => {
    setIsWizardActive(false);
    setCurrentStep(0);
    setLogs([]);
    setSynthesisPath(null);
    setDraftingPhase('setup');
    setChapters(DEFAULT_CHAPTERS);
    setHash(null);
    setIsSavingToWuzuo(false);
  };

  const getAssistantMessage = () => {
    switch (currentStep) {
      case 0:
        return "您好！我是您的智能引導精靈。讓我們開始觸發 OmniAPI 來採集您的 ESG 數據與佐證件。";
      case 1:
        if (draftingPhase === 'setup') return "準備就緒，寫作核心已待命。請選擇報告規模與寫作風格，系統將自動建構章節並執行 DMA 邏輯。";
        if (draftingPhase === 'writing') return "AI 寫作演算法執行中。正在依序套用框架、提取數據與進行敘事轉譯。";
        return "章節寫作完成。請預覽各章節的高保真內容，確認無誤後即可前往合規審計。";
      case 2:
        return "章節草稿已就緒。現在將執行 Gemini Pro 稽核以確保數據與佐證包 (Evidence Drawer) 完全對齊，達成零幻覺目標。";
      case 3:
        return "稽核完成。各項指標表現優異。現在可以對報告進行數位簽章 (SHA-256 Digital Signature) 並封存資產。";
      case 4:
        return "恭喜！您的永續報告書已安全發布，並完整儲存在證據金庫 (Evidence Vault) 中。";
      default:
        return "請問今天需要什麼協助？";
    }
  };

  if (isWizardActive) {
    return (
      <div className="view-container space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <div>
              <h1 className="text-h1 font-black text-text-main tracking-tight text-balance italic uppercase">
                報告織稿 (Reporting Wizard)
              </h1>
              <p className="text-body text-text-muted mt-1 font-medium">
                章節自動化・合規敘事引擎
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {lastSaved && (
                <div className="text-[10px] text-text-muted flex items-center gap-1 bg-bg-surface border border-border px-3 py-1.5 rounded-[2px] shadow-flat font-mono">
                  <Save className="w-3 h-3" />
                  SAVED {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <Button variant="wireframe" onClick={resetWizard} className="flex-1 sm:flex-initial text-xs uppercase font-black tracking-widest">
                CANCEL
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-bold tracking-widest uppercase text-text-muted font-mono">
            <span>Wizard Progress</span>
            <span>
              STEP {currentStep + 1} OF {FORGING_FLOW.length}
            </span>
          </div>
          <div className="w-full bg-border/20 h-[3px] overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-700 ease-out"
              style={{
                width: `${((currentStep + 1) / FORGING_FLOW.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Stepper */}
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex items-center justify-between min-w-[600px] relative px-4">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-border border-dashed z-0" />
          {FORGING_FLOW.map((step, i) => {
            const isActive = i === currentStep;
            const isPast = i < currentStep;
            return (
              <div
                key={i}
                className="relative z-10 flex flex-col items-center gap-3 bg-bg-base px-6"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isActive
                      ? "border-primary bg-primary text-white shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)]"
                      : isPast
                        ? "border-emerald-500 bg-white text-emerald-500"
                        : "border-border bg-bg-surface text-text-muted opacity-40"
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest font-mono text-center ${isActive ? "text-primary" : isPast ? "text-slate-600" : "text-text-muted opacity-30"}`}
                >
                  {step.id}
                </span>
              </div>
            );
          })}
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <GlassCard className="p-5 md:p-8 min-h-[300px] md:min-h-[500px] flex flex-col relative relative overflow-hidden">
              <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

              {/* Intelligent Guidance Spirit UI */}
              <div className="md:absolute md:top-6 md:right-6 flex flex-col gap-1 max-w-full md:max-w-[280px] bg-bg-surface/80 backdrop-blur-md p-4 rounded-lg border border-primary/20 shadow-flat z-20 mb-6 md:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-[2px] flex items-center justify-center bg-primary text-white shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest font-mono">
                    AI CORE ADVISOR
                  </span>
                </div>
                <p className="text-xs text-text-main leading-relaxed font-bold italic">
                  {getAssistantMessage()}
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-text-main flex items-center gap-3 tracking-wide uppercase italic">
                  {FORGING_FLOW[currentStep].title}
                  <Badge variant="optimal" styleType="soft" className="text-[10px] font-mono tracking-widest bg-primary/5 text-primary border-primary/20 pt-1">
                    PHASE {currentStep + 1}
                  </Badge>
                </h2>
                <p className="text-xs text-text-muted mt-2 max-w-lg leading-relaxed font-medium">
                  {FORGING_FLOW[currentStep].desc}
                </p>
              </div>

              <div className="flex-1 flex flex-col z-10 w-full relative">
                
                {/* ---------- STEP 1: INCEPTION ---------- */}
                {currentStep === 0 && (
                  <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="text-center space-y-8 m-auto">
                    <div className="w-24 h-24 rounded-full bg-primary/5 border border-border flex items-center justify-center mx-auto shadow-flat relative group">
                      <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
                      <Grid className="w-10 h-10 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-text-muted max-w-md mx-auto text-sm leading-relaxed font-medium">
                      啟動 OmniAPI 並從 24 項 MECE 服務中收集環境 (E)、社會 (S) 與治理 (G) 的核心數據，為寫作流程做好準備。
                    </p>
                    {logs.length === 0 && !isProcessing && (
                      <Button
                        variant="solid"
                        onClick={handleInception}
                        className="w-full max-w-[240px] mx-auto shadow-flat hover:shadow-elevation-1 transition-all uppercase font-black tracking-widest"
                      >
                        <Play className="w-4 h-4 mr-2" /> 開始數據聯網提取
                      </Button>
                    )}
                  </motion.div>
                )}

                {/* ---------- STEP 2: CHAPTER SYNTHESIS ---------- */}
                {currentStep === 1 && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col h-full w-full">
                    
                    {draftingPhase === 'setup' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <h3 className="font-bold text-[11px] text-slate-500 uppercase tracking-widest mb-4 font-mono flex items-center gap-2">
                            <Layers className="w-4 h-4" /> 決定報告規模 (Report Scale)
                          </h3>
                          <div className="grid grid-cols-3 gap-4">
                            {[200, 300, 500].map((pages) => (
                              <button
                                key={pages}
                                onClick={() => setReportScale(pages as any)}
                                className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                                  reportScale === pages
                                    ? "border-primary bg-primary/5 text-primary shadow-sm"
                                    : "border-slate-200 bg-white text-slate-500 hover:border-primary/30"
                                }`}
                              >
                                <span className="text-2xl font-light">{pages}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest font-mono">Pages Target</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <h3 className="font-bold text-[11px] text-slate-500 uppercase tracking-widest mb-4 font-mono flex items-center gap-2">
                             <PenTool className="w-4 h-4" /> 選擇寫作風格與敘事路徑 (Narrative Tone)
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { id: "conservative", label: "嚴謹保守 (Conservative)", desc: "嚴格對齊合規要求，不浮誇宣傳" },
                              { id: "aggressive", label: "積極展現 (Aggressive)", desc: "強調社會責任與競爭力領先點" },
                              { id: "visionary", label: "前瞻願景 (Visionary)", desc: "著重減碳藍圖與長期永續敘事" },
                            ].map((path) => (
                              <button
                                key={path.id}
                                onClick={() => setSynthesisPath(path.id as any)}
                                disabled={isProcessing}
                                className={`p-5 rounded-xl border text-left transition-all flex flex-col gap-2 ${
                                  synthesisPath === path.id
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : "border-slate-200 bg-white hover:border-primary/30"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-sm font-bold ${synthesisPath === path.id ? "text-primary" : "text-slate-700"}`}>
                                    {path.label}
                                  </h4>
                                  <div className={`w-3 h-3 rounded-full border ${synthesisPath === path.id ? 'bg-primary border-primary' : 'border-slate-300'}`} />
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-mono">{path.desc}</p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {synthesisPath && logs.length === 0 && !isProcessing && (
                          <div className="flex justify-end pt-4">
                            <Button
                              variant="solid"
                              onClick={handleSynthesisSequence}
                              className="w-full md:w-auto px-8"
                            >
                              <Cpu className="w-4 h-4 mr-2" /> 開始執行寫作演算法
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {(draftingPhase === 'writing' || draftingPhase === 'review') && (
                      <div className="flex flex-col md:flex-row gap-6 h-full min-h-[400px]">
                        
                        {/* Left Column: Algorithm Processing or Chapter Selection */}
                        <div className="w-full md:w-[280px] shrink-0 space-y-3">
                          <h3 className="font-mono text-[10px] font-bold tracking-widest text-slate-400 mb-3 border-b border-slate-100 pb-2">CHAPTER PIPELINE</h3>
                          
                          {chapters.map((ch, idx) => (
                            <div 
                              key={ch.id} 
                              onClick={() => draftingPhase === 'review' && setSelectedReviewChapter(ch.id)}
                              className={`p-3 rounded-lg border text-xs transition-all flex items-center justify-between
                                ${draftingPhase === 'review' ? 'cursor-pointer' : ''}
                                ${idx === activeChapterIndex ? 'bg-primary/10 border-primary shadow-sm' : 
                                  ch.status === 'completed' ? (selectedReviewChapter === ch.id ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50') : 'bg-slate-50/50 border-transparent text-slate-400'}`}
                            >
                              <span className="truncate pr-2 font-medium">{ch.title}</span>
                              {ch.status === 'pending' && <span className="w-2 h-2 rounded-full bg-slate-200 shrink-0" />}
                              {ch.status === 'drafting' && <RefreshCw className="w-3 h-3 text-primary animate-spin shrink-0" />}
                              {ch.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                            </div>
                          ))}

                          {draftingPhase === 'writing' && (
                             <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100 animate-pulse">
                               <p className="text-[10px] font-mono text-amber-700 font-bold mb-2">WRITING ALGORITHM</p>
                               <div className="space-y-1 text-[9px] text-amber-600/80 font-mono">
                                  <p>1. Extract (NCBDB)</p>
                                  <p>2. Apply DMA Logic</p>
                                  <p>3. Format Tone</p>
                                  <p>4. Cite Hash Proofs</p>
                               </div>
                             </div>
                          )}
                        </div>

                        {/* Right Column: Preview Area */}
                        <div className="flex-1 bg-white/60 border border-slate-200 rounded-2xl relative overflow-hidden flex flex-col p-6 shadow-inner">
                          {draftingPhase === 'writing' ? (
                            <div className="m-auto flex flex-col items-center justify-center text-center space-y-4">
                              <div className="relative w-16 h-16">
                                <div className="absolute inset-0 rounded-full border-2 border-slate-100" />
                                <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                                <PenTool className="absolute inset-0 m-auto w-6 h-6 text-primary animate-bounce opacity-80" />
                              </div>
                              <p className="text-sm font-medium text-slate-600">章節生成與敘事轉譯中...</p>
                              <span className="text-[10px] text-slate-400 font-mono">正在分析大量 MECE 節點及佐證</span>
                            </div>
                          ) : (
                            selectedReviewChapter && (
                              <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4">
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                                  <FileText className="w-5 h-5 text-primary" />
                                  <h3 className="font-bold text-slate-800 text-lg">
                                    {chapters.find(c => c.id === selectedReviewChapter)?.title}
                                  </h3>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                  <div className="prose prose-sm prose-slate max-w-none">
                                    {chapters.find(c => c.id === selectedReviewChapter)?.content.split('\n').map((paragraph, i) => (
                                      <p key={i} className="text-sm text-slate-600 leading-loose tracking-wide text-justify mb-4">
                                        {paragraph}
                                      </p>
                                    ))}
                                  </div>

                                  <div className="mt-8 pt-4 border-t border-slate-100">
                                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3 flex items-center gap-2">
                                      <Shield className="w-3 h-3" /> Blockchain Data Binding
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {chapters.find(c => c.id === selectedReviewChapter)?.dataPoints.map((dp, i) => (
                                        <Badge key={i} variant="optimal" styleType="soft" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-1 flex items-center gap-1.5 font-mono">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                          {dp}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>

                      </div>
                    )}
                  </motion.div>
                )}

                {/* ---------- STEP 3: AUDIT ---------- */}
                {currentStep === 2 && (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6 m-auto w-full max-w-2xl">
                    <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <Globe className="w-6 h-6 text-accent" />
                        <h3 className="font-bold text-slate-800 tracking-wide text-lg">Industry Top 5 Comparison Details (產業差異對照表)</h3>
                      </div>
                      <div className="overflow-x-auto custom-scrollbar shadow-inner bg-white rounded-xl border border-slate-100">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50/50 text-slate-500 font-mono text-[10px] tracking-widest border-b border-slate-100">
                            <tr>
                              <th className="p-4 font-semibold">Dimensions (維度)</th>
                              <th className="p-4 font-semibold">Record (本案)</th>
                              <th className="p-4 font-semibold">Top 5 Avg (同業)</th>
                              <th className="p-4 font-semibold text-right">GAP (差異)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {[
                              { dim: "碳排放強度", our: "12.4 tCO2e/M$", avg: "15.2 tCO2e/M$", gap: "-18%", color: "text-emerald-600 bg-emerald-50" },
                              { dim: "能源回收率", our: "92.5%", avg: "88.0%", gap: "+4.5%", color: "text-emerald-600 bg-emerald-50" },
                              { dim: "供應鏈滲透率", our: "82.5%", avg: "85.0%", gap: "-2.5%", color: "text-amber-600 bg-amber-50" },
                              { dim: "性別多樣性", our: "38.0%", avg: "32.4%", gap: "+5.6%", color: "text-emerald-600 bg-emerald-50" }
                            ].map((row, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-700">{row.dim}</td>
                                <td className="p-4 text-slate-600 font-mono">{row.our}</td>
                                <td className="p-4 text-slate-400 font-mono">{row.avg}</td>
                                <td className="p-4 text-right">
                                  <span className={`px-2 py-1 rounded font-bold font-mono text-[10px] ${row.color}`}>{row.gap}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="text-center space-y-4 pt-4">
                      <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                        自動呼叫 Gemini Pro 引擎，執行 97 項 FSC 永續指標稽核。透過佐證文件庫防杜任何「漂綠 (Greenwashing)」或幻覺可能。
                      </p>
                      {logs.length === 0 && !isProcessing && (
                        <Button
                          variant="solid"
                          onClick={handleAudit}
                          className="w-full max-w-[240px] mx-auto shadow-md hover:shadow-lg transition-all"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" /> 啟動零幻覺品質審計
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ---------- STEP 4: SEALING ---------- */}
                {currentStep === 3 && (
                  <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center space-y-8 m-auto">
                    <div className="w-24 h-24 rounded-full bg-status-lethal/10 border border-status-lethal/20 flex items-center justify-center mx-auto relative group">
                      <div className="absolute inset-0 rounded-full bg-status-lethal/5 animate-ping opacity-60" />
                      <Lock className="w-10 h-10 text-status-lethal" />
                    </div>
                    <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                      稽核通過。即將為全份 {reportScale} 頁永續報告書產生 SHA-256 數位簽章。一旦鎖定，後續篡改將失效。
                    </p>
                    {logs.length === 0 && !isProcessing && (
                      <Button
                        onClick={handleSealing}
                        className="w-full max-w-[240px] mx-auto text-sm bg-slate-900 text-white hover:bg-slate-800 shadow-[0_4px_15px_rgba(0,0,0,0.15)] rounded-xl h-11 transition-all"
                      >
                        <Lock className="w-4 h-4 mr-2 text-status-lethal" /> 執行最終數據封裝
                      </Button>
                    )}
                  </motion.div>
                )}

                {/* ---------- STEP 5: PUBLICATION ---------- */}
                {currentStep === 4 && (
                  <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} className="text-center space-y-8 m-auto w-full max-w-md">
                    <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto">
                      <Send className="w-10 h-10 text-emerald-500 ml-1" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-light tracking-wide text-slate-800 mb-2">
                        永續報告書 (ESG Report) 產製完成
                      </h3>
                      <p className="text-sm text-slate-500">
                        全 {reportScale} 頁高保真文件已妥善封存於系統證據庫。
                      </p>
                    </div>
                    
                    {hash && (
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-2">
                           <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                           <span className="font-bold text-slate-700">Digital Seal</span>
                        </div>
                        <span className="font-mono text-[9px] text-slate-500 truncate">{hash}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto pt-4">
                      <Button
                        variant="solid"
                        onClick={generatePDF}
                        className="w-full justify-center shadow-md bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                      >
                        <Download className="w-4 h-4 mr-2" /> 下載高保真 PDF
                      </Button>
                      <Button
                        variant="wireframe"
                        onClick={resetWizard}
                        className="w-full justify-center text-slate-500 hover:bg-slate-50 border-slate-200"
                      >
                        結束導覽並返回主控台
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Hidden PDF Content */}
              <div className="absolute left-[-9999px] top-0 pointer-events-none">
                <EsgReportPdf ref={reportRef} />
              </div>

              {/* Next Step Control Banner */}
              <AnimatePresence>
                {currentStep < 4 && logs.length > 0 && !isProcessing && (draftingPhase === 'review' || currentStep !== 1) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                    className="absolute bottom-6 left-6 right-6 z-30"
                  >
                    <div className="bg-slate-900 text-white/90 p-3 lg:p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-white/10 backdrop-blur-md">
                      <div className="flex flex-col ml-2">
                         <span className="text-[10px] font-mono tracking-widest text-[#00FF00]">PHASE VERIFIED</span>
                         <span className="text-sm font-medium">Ready for {FORGING_FLOW[currentStep + 1].title}</span>
                      </div>
                      <Button
                        onClick={() => {
                          setCurrentStep(currentStep + 1);
                          setLogs([]);
                        }}
                        className="bg-white text-slate-900 hover:bg-slate-100 rounded-xl px-6 font-bold flex items-center shadow-sm"
                      >
                        Proceed to Next Step <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </div>

          {/* Terminal / Logs Area - Right Side */}
          <div className="hidden lg:block lg:col-span-1">
            <GlassCard
              className="p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-2xl flex flex-col h-full min-h-[500px]"
            >
              <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4 shrink-0">
                <Terminal className="w-4 h-4 text-[#00FF00] opacity-80" />
                <span className="font-mono text-[10px] tracking-widest text-white/70">ORCHESTRATOR LOGS</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 font-mono text-[10px] text-[#00FF00]/80">
                {logs.length === 0 && !isProcessing && (
                  <div className="text-slate-600/[0.6] italic mt-4 text-center">
                    -- STANDBY MODE --<br/>waiting for user input
                  </div>
                )}
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                    className="leading-relaxed whitespace-pre-wrap break-words border-l-2 border-[#00FF00]/30 pl-2 py-0.5"
                  >
                    {log}
                  </motion.div>
                ))}
                {isProcessing && (
                  <div className="flex items-center gap-2 text-[#00FF00] opacity-100 mt-4 px-2 py-1 bg-[#00FF00]/10 rounded inline-flex font-bold">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="animate-pulse">PROCESSING_</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="view-container space-y-8 animate-in fade-in duration-500">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Badge
              variant="optimal" styleType="soft"
              className="flex items-center gap-2 px-4 py-2 text-[11px] bg-bg-surface text-text-muted border-border h-auto tracking-[0.2em] font-black uppercase italic shadow-flat"
            >
              <Database className="w-3.5 h-3.5" />
              NCB LAYER ACTIVE
            </Badge>
            <Button 
              onClick={() => setIsWizardActive(true)}
              className="bg-text-main text-bg-base hover:bg-text-main/90 border-none px-6 py-5 h-auto shadow-flat rounded-[4px] transition-all uppercase font-black tracking-widest italic"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              啟動引導精靈 (INIT WIZARD)
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CORE_MODULES.map((mod, i) => (
          <GlassCard
            key={i}
            className="p-6 md:p-8 hover:bg-bg-surface transition-all cursor-default group flex flex-col md:flex-row gap-5 md:gap-6 border-b-2 border-b-transparent hover:border-b-primary shadow-flat rounded-[4px]"
          >
            <div
              className={`w-14 h-14 rounded-[4px] flex items-center justify-center flex-shrink-0 ${mod.bg} group-hover:-translate-y-1 transition-transform duration-300 shadow-flat border border-border`}
            >
              <mod.icon className={`w-7 h-7 ${mod.color}`} />
            </div>
            <div>
              <h3 className="text-xl font-black text-text-main mb-1 uppercase italic tracking-tight">
                {mod.name}
              </h3>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-3 italic opacity-60">
                {mod.id}
              </p>
              <p className="text-text-muted text-sm leading-relaxed font-medium">
                {mod.desc}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
