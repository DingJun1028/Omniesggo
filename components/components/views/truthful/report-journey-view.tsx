import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Database, Target, CheckCircle2, FileCheck, Layers, 
  Eye, RefreshCw, Plus, ArrowRight, Lock, Shield, Zap
} from 'lucide-react';
import { GlassCard } from "@/components/ui/glass-card";
import { ViewHeader } from "@/components/ui/view-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/context/app-context";
import { PAGE_GUIDES } from "@/lib/config/guides";
import { cn } from "@/lib/utils";

const STAGES = [
  { id: 'stage-1', title: '系統初始化', subtitle: 'PHASE 01', description: '確立標準、邊界與核心小組', icon: Target },
  { id: 'stage-2', title: '重大性鑑別', subtitle: 'PHASE 02', description: '雙重重大性 (Double Materiality)', icon: Layers },
  { id: 'stage-3', title: '數據蒐集盤查', subtitle: 'PHASE 03', description: '高誠信數據 (Quantum Dropzone)', icon: Database },
  { id: 'stage-4', title: '視覺化轉譯', subtitle: 'PHASE 04', description: '極簡光學敘事 (Liquid Glass)', icon: Eye },
  { id: 'stage-5', title: '第三方保證', subtitle: 'PHASE 05', description: '確信與系統熵減 (Trust Lock)', icon: Shield },
];

const FRAMEWORKS = ['GRI Standards', 'SASB', 'TCFD', 'IFRS S1/S2', 'TNFD'];

type Evidence = {
  id: string;
  name: string;
  value: string;
  unit: string;
  hash: string;
  confidence: number;
  timestamp: string;
};

type MaterialTopic = {
  id: string;
  name: string;
  financial: number; // 0-100
  impact: number;    // 0-100
  color: string;
};

export function ReportJourneyView() {
  const { aiProxyMode, lang } = useAppContext();
  const [activeStage, setActiveStage] = useState(0);

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "永續撰寫旅程 (Omni Journey)" : "Omni Reporting Journey",
    subtitle: "5T Architecture Protocol",
    description: lang === "zh" ? "全域代理導航。系統正協助您穿越永續報告的五大階段，確保每一節點皆符合真信協議。" : "Global proxy navigation assistência. System is guiding you through 5 stages of reporting.",
    accent: "from-primary/20 to-transparent",
    tag: "JOURNEY_PROXY",
    icon: Zap,
    guideSteps: PAGE_GUIDES["reports"] // Assuming similar guide to reports or create one
  } : {
    title: lang === "zh" ? "報告編製路徑" : "Reporting Roadmap",
    subtitle: "Omni Manual Guide",
    description: lang === "zh" ? "手動編製路徑。系統為您規劃了標準的 ESG 報告書產製流程，請依序執行關鍵節點。" : "Manual roadmap. Standardized workflow for ESG report production.",
    accent: "from-blue-500/20 to-transparent",
    tag: "JOURNEY_MANUAL",
    icon: FileText,
    guideSteps: PAGE_GUIDES["reports"]
  };


  // --- Centralized Journey State ---
  // Stage 1 State
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['GRI Standards']);
  
  // Stage 2 State
  const [topics, setTopics] = useState<MaterialTopic[]>([
    { id: 't1', name: '氣候變遷減緩', financial: 85, impact: 92, color: 'bg-blue-500' },
    { id: 't2', name: '供應鏈永續管理', financial: 70, impact: 88, color: 'bg-indigo-500' },
    { id: 't3', name: '員工健康與安全', financial: 45, impact: 75, color: 'bg-emerald-500' },
    { id: 't4', name: '資源循環利用', financial: 60, impact: 65, color: 'bg-amber-500' },
    { id: 't5', name: '資訊安全與隱私', financial: 90, impact: 60, color: 'bg-rose-500' },
  ]);

  // Stage 3 & 5 State
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [isForging, setIsForging] = useState(false);

  const toggleFramework = (fw: string) => {
    setSelectedFrameworks(prev => 
      prev.includes(fw) ? prev.filter(f => f !== fw) : [...prev, fw]
    );
  };

  const handleUploadMock = () => {
    setIsForging(true);
    setTimeout(() => {
      const mockEvidences = [
        { name: '台北總部 10 月份用電量', value: '12,500', unit: 'kWh' },
        { name: '新竹廠區 第四季用水量', value: '45,200', unit: '噸' },
        { name: '年度綠電採購證明', value: '2,000,000', unit: 'kWh' }
      ];
      const randomEv = mockEvidences[Math.floor(Math.random() * mockEvidences.length)];
      
      const newEvidence: Evidence = {
        id: `ev-${Date.now()}`,
        name: randomEv.name,
        value: randomEv.value,
        unit: randomEv.unit,
        hash: Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        confidence: Math.floor(Math.random() * 5) + 95, // 95-99
        timestamp: new Date().toISOString()
      };
      
      setEvidences(prev => [newEvidence, ...prev]);
      setIsForging(false);
    }, 2500);
  };

  return (
    <div className="view-container animate-in fade-in duration-500">
      
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-4">
            <Badge variant="optimal" styleType="soft" className="px-3 py-1.5 border-primary/20">
              <RefreshCw className="w-3.5 h-3.5 text-primary mr-2" />
              URS 同步正常 (Sync Active)
            </Badge>
          </div>
        }
      />

      {/* Stepper Navigation */}
      <div className="w-full overflow-x-auto pb-8 custom-scrollbar">
        <div className="flex min-w-max md:w-full items-center justify-between relative px-4">
          {/* Connecting Line */}
          <div className="absolute top-6 left-8 right-8 h-[1px] bg-border border-dashed -z-10" />
          
          {STAGES.map((stage, idx) => {
            const isActive = idx === activeStage;
            const isPassed = idx < activeStage;
            const Icon = stage.icon;
            
            return (
              <button 
                key={stage.id}
                onClick={() => setActiveStage(idx)}
                className="flex flex-col items-center gap-3 group relative w-32 md:w-1/5"
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative bg-bg-base border-2 h-12 w-12",
                  isActive ? 'border-primary shadow-flat shadow-primary/20' : 
                    isPassed ? 'border-status-optimal bg-status-optimal/5' : 'border-border group-hover:border-primary/30'
                )}>
                  <Icon className={cn("w-5 h-5", isActive ? 'text-primary' : isPassed ? 'text-status-optimal' : 'text-text-muted')} />
                  
                  {isActive && (
                    <motion.div 
                      layoutId="activeBloom"
                      className="absolute inset-0 rounded-full bg-primary/5 blur-md pointer-events-none"
                    />
                  )}
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className={cn("text-[9px] font-black tracking-[0.2em] mb-1 italic uppercase", 
                    isActive ? 'text-primary' : isPassed ? 'text-status-optimal' : 'text-text-muted')}>
                    {stage.subtitle}
                  </span>
                  <span className={cn("text-xs font-bold italic uppercase tracking-tight", 
                    isActive ? 'text-text-main' : 'text-text-muted')}>
                    {stage.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area - Standardized GlassCard */}
      <GlassCard className="flex-1 flex flex-col min-h-[500px] border border-border shadow-flat relative overflow-hidden">
        
        {/* Abstract Background Element */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar">

          <AnimatePresence mode="wait">
            
            {/* ---------------- STAGE 1: INITIALIZATION ---------------- */}
            {activeStage === 0 && (
              <motion.div 
                key="stage1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-light text-slate-800 mb-2">確立標準與邊界</h2>
                  <p className="text-sm text-slate-500">
                    請選定您本次報告所需遵循的國際框架。這將影響後續自動生成的指令矩陣。
                  </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {FRAMEWORKS.map(framework => {
                    const isSelected = selectedFrameworks.includes(framework);
                    return (
                      <div 
                        key={framework} 
                        onClick={() => toggleFramework(framework)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col items-start gap-4
                          ${isSelected ? 'bg-primary/5 border-primary shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.1)]' : 'bg-white/60 border-slate-200 hover:border-primary/30'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors
                          ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </div>
                        <h4 className={`font-bold ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{framework}</h4>
                      </div>
                    );
                  })}
                </div>

                {selectedFrameworks.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-8 p-6 bg-slate-50/80 border border-slate-200 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">已選定 {selectedFrameworks.length} 項框架</h4>
                      <p className="text-xs text-slate-500">系統核心將以此為邊界進行合規驗證</p>
                    </div>
                    <button 
                      onClick={() => setActiveStage(1)}
                      className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      進入重大性鑑別 <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ---------------- STAGE 2: DOUBLE MATERIALITY ---------------- */}
            {activeStage === 1 && (
              <motion.div 
                key="stage2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col h-full space-y-6"
              >
                <div>
                  <h2 className="text-2xl font-light text-slate-800 mb-2">雙重重大性鑑別矩陣</h2>
                  <p className="text-sm text-slate-500">
                    基於您選定的 <span className="text-primary font-medium">{selectedFrameworks.join(', ')}</span>，系統自動推演的議題落點。
                  </p>
                </div>
                
                <div className="flex-1 w-full min-h-[400px] border border-slate-200 rounded-2xl bg-slate-50/50 relative overflow-hidden group shadow-inner">
                  {/* Axis Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
                  
                  {/* Quadrant Lines */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-300 border-dashed border-b" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300 border-dashed border-r" />

                  {/* Labels */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-70">
                     <span className="text-xs font-mono text-slate-500 font-semibold tracking-widest">Impact Materiality (衝擊重大性) -&gt;</span>
                  </div>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 origin-left flex items-center gap-2 opacity-70">
                     <span className="text-xs font-mono text-slate-500 font-semibold tracking-widest">Financial Materiality (財務重大性) -&gt;</span>
                  </div>
                  
                  {/* Interactive Bubbles */}
                  {topics.map(topic => (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', delay: topic.impact * 0.005 }}
                      key={topic.id}
                      className={`absolute w-3 h-3 rounded-full cursor-pointer group/bubble ${topic.color}`}
                      style={{
                        left: `${topic.impact}%`,
                        bottom: `${topic.financial}%`,
                        transform: 'translate(-50%, 50%)'
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 rounded shadow-md border border-slate-100 text-[10px] font-bold text-slate-700 opacity-0 group-hover/bubble:opacity-100 transition-opacity z-20 pointer-events-none">
                        {topic.name}
                      </div>
                      <div className={`absolute inset-0 rounded-full ${topic.color} animate-ping opacity-30`} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ---------------- STAGE 3: QUANTUM DROPZONE ---------------- */}
            {activeStage === 2 && (
              <motion.div 
                key="stage3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-light text-slate-800 mb-2">高誠信數據蒐集與盤查</h2>
                    <p className="text-sm text-slate-500">
                      動用 ADK 代理網絡解析憑證，降熵後直接寫入 NCBDB 觸發不可篡改印記。
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Upload Area */}
                  <div className="relative w-full rounded-3xl bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-500">
                    {!isForging ? (
                      <div onClick={handleUploadMock} className="flex flex-col items-center justify-center w-full h-[320px] cursor-pointer group hover:bg-white/80 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Database className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm text-slate-600 font-medium">點擊或拖曳憑證文件 (PDF/PNG)</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-2">啟動 Rune Forge / 本質提純機制</p>
                        <div className="mt-8 px-4 py-2 bg-amber-50 rounded-full border border-amber-100 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-[10px] font-mono text-amber-700 font-bold tracking-widest">ADK AGENT STANDBY</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-[320px] bg-slate-50/50">
                        <div className="relative w-16 h-16 mb-6">
                            <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin" />
                            <div className="absolute inset-2 rounded-full border-b-2 border-primary/50 animate-spin-reverse" />
                            <RefreshCw className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse" />
                        </div>
                        <p className="text-slate-600 text-sm font-medium tracking-wide">ADK 小隊深度解析中...</p>
                        <div className="flex items-center gap-2 mt-4 text-[10px] text-slate-400 font-mono">
                          <span className="text-primary font-bold">OCR</span> -&gt; <span className="text-primary font-bold">Zod 驗證</span> -&gt; Hash Lock
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vault Log Area */}
                  <div className="flex flex-col bg-slate-50/50 rounded-3xl border border-slate-200 p-6 h-[320px]">
                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-400" /> 已降熵憑證紀錄 ({evidences.length})
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                      <AnimatePresence>
                        {evidences.length === 0 ? (
                          <div className="text-xs text-slate-400 font-mono text-center mt-10">尚無紀錄。上傳文件以開始鑄造。</div>
                        ) : (
                          evidences.map((ev, i) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                              key={ev.id}
                              className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm text-xs"
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-700">{ev.name}</span>
                                <span className="text-primary font-mono text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                                  {ev.confidence}% ACC
                                </span>
                              </div>
                              <div className="flex justify-between items-end">
                                <span className="text-emerald-600 font-mono">{ev.value} {ev.unit}</span>
                                <span className="text-[9px] text-slate-400 font-mono truncate w-24">#{ev.hash.substring(0,8)}...</span>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---------------- STAGE 4: VISUAL TRANSLATION ---------------- */}
            {activeStage === 3 && (
              <motion.div 
                key="stage4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col space-y-8 h-full"
              >
                <div>
                  <h2 className="text-2xl font-light text-slate-800 mb-2">視覺化轉譯與敘事</h2>
                  <p className="text-sm text-slate-500">
                    根據第一階段選定的 {selectedFrameworks.length} 個框架與雙重重大性結果，自動展現極簡光學 (Minimalist Optics) 的 DMA 進度。
                  </p>
                </div>

                <div className="flex flex-col gap-6">
                  {topics.slice(0,3).map(topic => (
                    <div key={topic.id} className="bg-white/60 border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 group hover:border-primary/20 transition-all">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${topic.color}`} /> {topic.name}
                        </h4>
                        <p className="text-[10px] font-mono text-slate-500">DMA 執行達成率追蹤</p>
                      </div>
                      
                      {/* Interactive Data Bars */}
                      <div className="w-full md:w-2/3 grid grid-cols-4 gap-2 text-center text-xs">
                         <div className="flex flex-col items-center gap-1 group/bar cursor-default">
                           <div className="h-8 w-full bg-slate-100 rounded flex items-end justify-center overflow-hidden">
                             <div className={`w-full bg-slate-800 transition-all duration-1000 group-hover/bar:bg-primary`} style={{ height: `${topic.financial}%` }} />
                           </div>
                           <span className="text-[9px] text-slate-400 uppercase font-mono mt-1">Input</span>
                         </div>
                         <div className="flex flex-col items-center gap-1 group/bar cursor-default">
                           <div className="h-8 w-full bg-slate-100 rounded flex items-end justify-center overflow-hidden">
                             <div className={`w-full bg-primary/60 transition-all duration-1000 group-hover/bar:bg-primary`} style={{ height: `${topic.impact}%` }} />
                           </div>
                           <span className="text-[9px] text-slate-400 uppercase font-mono mt-1">Process</span>
                         </div>
                         <div className="flex flex-col items-center gap-1 group/bar cursor-default">
                           <div className="h-8 w-full bg-slate-100 rounded flex items-end justify-center overflow-hidden">
                             <div className={`w-full bg-emerald-400 transition-all duration-1000 group-hover/bar:bg-emerald-500`} style={{ height: `${(topic.financial + topic.impact)/2}%` }} />
                           </div>
                           <span className="text-[9px] text-slate-400 uppercase font-mono mt-1">Output</span>
                         </div>
                         <div className="flex flex-col items-center gap-1 group/bar cursor-default">
                           <div className="h-8 w-full bg-slate-100 rounded flex items-end justify-center overflow-hidden">
                             <div className={`w-full bg-rose-400 transition-all duration-1000 group-hover/bar:bg-rose-500`} style={{ height: `85%` }} />
                           </div>
                           <span className="text-[9px] text-slate-400 uppercase font-mono mt-1">Feedbk</span>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ---------------- STAGE 5: ASSURANCE & EVOLUTION ---------------- */}
            {activeStage === 4 && (
              <motion.div 
                key="stage5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col space-y-6 h-full"
              >
                <div>
                  <h2 className="text-2xl font-light text-slate-800 mb-2">第三方保證確信系統</h2>
                  <p className="text-sm text-slate-500">
                    由 Stage 3 所產生之全量數據皆已執行 `is_frozen = true`。<br/>這些不可篡改之證據庫 (Evidence Vault) 隨時開放第三方檢驗。
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-600" /> Evidence Vault Immutable Ledger
                    </h3>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-mono font-bold">
                      {evidences.length} RECORDS LOCKED
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto text-xs font-mono">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/50 text-slate-500">
                        <tr>
                          <th className="px-6 py-3 font-semibold">T-STAMP</th>
                          <th className="px-6 py-3 font-semibold">TARGET NODE</th>
                          <th className="px-6 py-3 font-semibold text-right">VALUE DEC</th>
                          <th className="px-6 py-3 font-semibold">SHA-256 HASH</th>
                          <th className="px-6 py-3 font-semibold text-center">STAT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {evidences.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-slate-400">目前數據庫內無任何封存的資料。請回到上一階段進行存證。</td>
                          </tr>
                        ) : (
                          evidences.map(ev => (
                            <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-slate-400">{new Date(ev.timestamp).toISOString().split('T')[1].substring(0,8)}</td>
                              <td className="px-6 py-4 font-sans font-medium text-slate-700">{ev.name}</td>
                              <td className="px-6 py-4 text-right text-emerald-600 font-bold">{ev.value} {ev.unit}</td>
                              <td className="px-6 py-4 text-[10px] text-slate-400">{ev.hash}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </GlassCard>
      
    </div>
  );
}

