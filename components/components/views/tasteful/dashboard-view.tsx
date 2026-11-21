"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Activity,
  Leaf,
  Users,
  LayoutDashboard,
  Shield,
  Zap,
  ArrowRight,
  Copy,
  Check,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  FileText,
  CheckCircle2,
  Eye,
  Network,
  Sparkles,
  Lock,
  Loader2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Save,
  X,
  List,
  Volume2,
  Mic,
  MicOff,
  Database,
  Bot,
  Share2,
  FileBarChart,
  ShieldCheck,
  Building2,
  Table,
  Mail,
  History as HistoryIcon,
  TrendingUp,
  TrendingDown,
  BarChart2,
  PieChart,
  Terminal,
  Wand2
} from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import { userProfileApi, type UserProfile } from "@/lib/ncb-service";
import { ESG_FUNCTIONS } from "@/lib/data/esg-functions";
import { ViewHeader } from "@/components/ui/view-header";
import { SentientSpiritHub } from "@/components/ui/sentient-spirit-hub";
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card";
import { TrustVault } from "@/lib/services/trust-vault";
import { IComponentCore } from "@/lib/types/esg-core";
import { sentientBus } from "@/lib/services/sentient-bus";
import { SoulNavigatorLog } from "@/components/ui/soul-navigator-log";

import { PAGE_GUIDES } from "@/lib/config/guides";

const ESG_DATA = [
  { name: "ENV (環境)", value: 60, color: "var(--color-primary)" },
  { name: "SOC (社會)", value: 55, color: "var(--color-accent)" },
  { name: "GOV (治理)", value: 50, color: "var(--color-status-optimal)" },
  { name: "AGC (代理)", value: 35, color: "var(--color-proxy)" },
];

const PHASES = [
  "數據收集",
  "數據驗證",
  "證據封裝",
  "標準映射",
  "合規分析",
  "報告生成",
  "AI 審計",
  "數位封印",
  "發布存檔",
];

const PROPHETIC_FEED = [
  {
    type: "insight",
    title: "Sentient UI 整合報告",
    content: "系統已成功整合 Sentient UI 視覺增強模組。您現在可以體驗到溫暖的金色光暈效果、動態的 SENTIENT 識別徽章，以及沉浸式的感官回饋。我們移除了生硬的技術標籤，為您帶來更直覺、更具生命力的數據洞察體驗。",
    source: "SENTIENT_CORE",
    time: "剛剛",
    confidence: 100,
    status: "已啟用",
    tags: ["system", "ui", "trust"]
  },
  {
    type: "insight",
    title: "供應鏈碳排異常預警",
    content: "我們察覺到主要供應商 A 的 Q3 碳排放數據有不尋常的波動，較歷史平均偏離了 15%。建議您盡快與供應商展開對話，深入了解排放源的具體情況，以確保供應鏈的綠色承諾。",
    source: "SENTIENT_CORE",
    time: "10 分鐘前",
    confidence: 98,
    status: "已驗證",
    tags: ["sme", "carbon", "supply"]
  },
  {
    type: "news",
    title: "歐盟 CBAM 碳邊境調整機制正式進入過渡期",
    content: "隨著全球氣候行動的升溫，歐盟 CBAM 已正式啟動。這不僅是一項法規，更是推動綠色轉型的強大動力。建議您及早檢視出口產品的碳足跡，讓永續成為您的全球競爭力。過渡期自 2023 年 10 月 1 日起至 2025 年底，期間進口商僅需申報產品的碳排放量，無需繳納碳關稅。",
    source: "Intel Guardian",
    time: "5 小時前",
    tags: ["regulatory", "sme", "trust"]
  }
];

export function DashboardView({ mode = "default" }: { mode?: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      text: "Review Q3 carbon emissions data",
      completed: false,
      priority: "High",
      dueDate: "2026-03-15",
      category: "Strategy",
    },
    {
      id: 2,
      text: "Update supplier code of conduct",
      completed: true,
      priority: "Medium",
      dueDate: "2026-03-10",
      category: "Implementation",
    },
    {
      id: 3,
      text: "Prepare for annual ESG audit",
      completed: false,
      priority: "High",
      dueDate: "2026-04-01",
      category: "Verification",
    },
    {
      id: 4,
      text: "Stakeholder engagement survey",
      completed: false,
      priority: "Medium",
      dueDate: "2026-04-10",
      category: "Engagement",
    },
  ]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: 'complete' | 'delete', taskId: number } | null>(null);
  
  const [favorites, setFavorites] = useState<number[]>([]);
  const [expandedArticles, setExpandedArticles] = useState<number[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("Medium");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [selectedEsgDomain, setSelectedEsgDomain] = useState<keyof typeof ESG_FUNCTIONS | null>(null);
  const [activeTrace, setActiveTrace] = useState<any[] | null>(null);
  
  const [coreData, setCoreData] = useState<IComponentCore>({
    uuid: "TRH-A1-INIT",  // Static initial value — prevents SSR/Client hydration mismatch
    version: 'v1.0.0-immutable',
    timestamp: 0,           // Static — updated after mount
    source_origin: "IOT_SENSOR_X7",
    payload: { value: 62.4, unit: "kgCO2e", label: "即時碳排" },
    evidence: [] as any[],
    traceability_chain: [{ 
      action: 'GENESIS', timestamp: 0, actor: 'SYSTEM', source_origin: 'IOT_SENSOR_X7' 
    }] as any[]

  });

  const [isSealed, setIsSealed] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  // Hydration-safe: generate random UUID and real timestamps ONLY on the client
  // after first mount. This prevents SSR/Client mismatch from Math.random() / Date.now()
  useEffect(() => {
    const now = Date.now();
    Promise.resolve().then(() => {
      setCoreData(prev => ({
        ...prev,
        uuid: "TRH-A1-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
        timestamp: now,
        traceability_chain: [{ 
          action: 'GENESIS', timestamp: now, actor: 'SYSTEM', source_origin: 'IOT_SENSOR_X7' 
        }]
      }));
    });
  }, []);

  const handleSeal = () => {
    setIsComputing(true);
    setTimeout(() => {
      const sealed = TrustVault.seal(coreData, 'ADMIN_001');
      setCoreData(sealed);
      setIsSealed(true);
      setIsComputing(false);
      sentientBus.emit({ type: 'DATA_SEALED', payload: sealed });
    }, 1200);
  };

  const { setActiveTab, aiProxyMode, lang } = useAppContext();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      const { data } = await userProfileApi.get("1");
      if (data) setProfile(data);
      setLoadingProfile(false);
    };
    fetchProfile();
  }, []);

  const toggleFavorite = (index: number) => {
    setFavorites(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const toggleExpand = (index: number) => {
    setExpandedArticles(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
  };

  const startEditTask = (id: number, text: string, priority: string, dueDate: string) => {
    setEditingTaskId(id);
    setEditTaskText(text);
    setEditTaskPriority(priority || "Medium");
    setEditTaskDueDate(dueDate || "");
  };

  const saveEditTask = (id: number) => {
    if (!editTaskText.trim()) return;
    setTasks(tasks.map(t => t.id === id ? { ...t, text: editTaskText, priority: editTaskPriority, dueDate: editTaskDueDate } : t));
    setEditingTaskId(null);
  };

  const handleCopy = (value: string, index: number) => {
    navigator.clipboard.writeText(value);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const addTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        text: newTaskText,
        completed: false,
        priority: newTaskPriority,
        dueDate: newTaskDueDate,
        category: mode === "qa" ? "Verification" : mode === "sme" ? "Implementation" : "Strategy",
      },
    ]);
    setNewTaskText("");
    setNewTaskPriority("Medium");
    setNewTaskDueDate("");
  };

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const requestToggleTask = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      setConfirmAction({ type: 'complete', taskId: id });
    } else {
      toggleTask(id);
    }
  };

  const requestDeleteTask = (id: number) => {
    setConfirmAction({ type: 'delete', taskId: id });
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'complete') {
      toggleTask(confirmAction.taskId);
    } else if (confirmAction.type === 'delete') {
      deleteTask(confirmAction.taskId);
    }
    setConfirmAction(null);
  };

  let branding;
  if (mode === "qa") {
    branding = {
      title: lang === "zh" ? "萬能數據核驗 (Omni QA)" : "Omni Data Verification",
      subtitle: "5T Trust & Integrity Protocol",
      description: lang === "zh" ? "執行數據完整性校驗與 5T 信任核合。確保每一筆 ESG 數據皆具備不可篡改的真實性。" : "Executing data integrity checks and 5T trust reconciliation. Ensuring immutable authenticity for every ESG data point.",
      accent: "from-status-optimal/20 to-transparent",
      tag: "QA",
      icon: ShieldCheck,
      guideSteps: PAGE_GUIDES["omni-truth"],
      feedLabel: lang === "zh" ? "核驗軌跡" : "Verification Trail",
      calendarLabel: lang === "zh" ? "查核進度" : "Audit Progress"
    };
  } else if (mode === "sme") {
    branding = {
      title: lang === "zh" ? "企業轉型任務 (SME Actions)" : "SME Transformation",
      subtitle: "Accelerating Sustainable Growth",
      description: lang === "zh" ? "針對中小企業的減碳與轉型路徑導航。將法規壓力轉化為價值鏈競爭力。" : "Navigating carbon reduction and transformation pathways for SMEs. Turning regulatory pressure into value chain competitiveness.",
      accent: "from-amber-400/20 to-transparent",
      tag: "SME",
      icon: Building2,
      guideSteps: PAGE_GUIDES.dashboard,
      feedLabel: lang === "zh" ? "行動清單" : "Action List",
      calendarLabel: lang === "zh" ? "轉型里程碑" : "Milestones"
    };
  } else if (mode === "social") {
    branding = {
      title: lang === "zh" ? "社會影響力中心 (Social Impact)" : "Social Impact Hub",
      subtitle: "Community & Stakeholder Engagement",
      description: lang === "zh" ? "監測並優化企業的社會影響力。提升社區參與度與員工福祉，共創永續價值。" : "Monitoring and optimizing corporate social impact. Enhancing community engagement and employee well-being for sustainable value creation.",
      accent: "from-blue-500/22 to-transparent",
      tag: "SOC",
      icon: Users,
      guideSteps: PAGE_GUIDES.dashboard,
      feedLabel: lang === "zh" ? "社會脈動" : "Social Dynamics",
      calendarLabel: lang === "zh" ? "參與時程" : "Engagement Timeline"
    };
  } else {
    branding = aiProxyMode ? {
      title: lang === "zh" ? `智控脈動，${profile?.username || "Admin User"}` : `Sentient Pulse, ${profile?.username || "Admin User"}`,
      subtitle: "Omni Sentient Interface",
      description: lang === "zh" ? "全感官戰情模式。系統正透過 ADK 代理協同處理全球永續變量，導航最優路徑。" : "All-sensory strategic mode. System is processing global sustainability variables via ADK agents.",
      accent: "from-purple-500/20 to-transparent",
      tag: "CORE",
      icon: Bot,
      guideSteps: PAGE_GUIDES.dashboard,
      feedLabel: lang === "zh" ? "每日脈動" : "Daily Pulse",
      calendarLabel: lang === "zh" ? "每日導引" : "Daily Guidance"
    } : {
      title: lang === "zh" ? `每日導引，${profile?.username || "Admin User"}` : `Daily Guidance, ${profile?.username || "Admin User"}`,
      subtitle: "Omni Manual Control Center",
      description: lang === "zh" ? "實作導航模式。為您準備了今日的永續路徑簡報，導航企業核心發展。" : "Omni manual navigator. Your daily sustainability pathway briefing.",
      accent: "from-[#00FFFF]/20 to-transparent",
      guideSteps: PAGE_GUIDES.dashboard,
      feedLabel: lang === "zh" ? "萬能脈動" : "Omni Dynamics",
      calendarLabel: lang === "zh" ? "萬能時程" : "Omni Timeline"
    };
  }

  // Filter content based on mode
  const filteredFeed = useMemo(() => {
    return PROPHETIC_FEED.filter(item => {
      if (mode === "qa") return item.tags?.includes("trust") || item.type === "insight";
      if (mode === "sme") return item.tags?.includes("sme") || item.tags?.includes("carbon");
      if (mode === "social") return item.tags?.includes("social") || item.tags?.includes("stakeholder");
      return true;
    });
  }, [mode]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (mode === "qa") return task.category === "Verification";
      if (mode === "sme") return task.category === "Implementation" || task.category === "Strategy";
      if (mode === "social") return task.category === "Engagement";
      return true;
    });
  }, [tasks, mode]);

  return (
    <div className="view-container">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="optimal" styleType="soft" className="bg-primary/10 border-primary/20 px-3 py-1.5 h-auto text-text-main">
                <Calendar className="w-3.5 h-3.5 text-primary mr-2" />
                今日 3 個會議
              </Badge>
              <Badge variant="optimal" styleType="soft" className="bg-primary/10 border-primary/20 px-3 py-1.5 h-auto text-text-main">
                <Clock className="w-3.5 h-3.5 text-amber-400 mr-2" />
                報告提交倒數 45 天
              </Badge>
            </div>
            <SentientSpiritHub variant="header" />
          </div>
        }
      />

      {/* 【魂】Dr. Thoth 引路日誌 */}
      <SoulNavigatorLog />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Prophetic Feed (先知饋送) */}
        <GlassCard className="p-6 md:p-8 lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
            <h2 className="text-2xl font-bold text-text-main tracking-tight flex items-center gap-3">
              {aiProxyMode ? <Zap className="w-6 h-6 text-purple-500" /> : <Eye className="w-6 h-6 text-primary" />}
              {branding.feedLabel}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="optimal" styleType="soft" className="px-3 py-1.5 flex items-center gap-1 border-primary/20">
                <Network className="w-3 h-3 text-primary" />
                URS 同步中
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4 flex-1">
              {filteredFeed.map((item, i) => (
                <div
                  key={i}
                  className={`relative p-5 rounded-2xl border transition-all duration-500 cursor-pointer group overflow-hidden ${
                    item.type === "insight"
                      ? "border-accent/30 bg-gradient-to-br from-accent/10 to-bg-surface/80 hover:shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.1)]"
                      : "border-border/10 bg-bg-surface/50 hover:border-primary/30 hover:bg-bg-surface/40 shadow-sm"
                  }`}
                  onClick={() => toggleExpand(i)}
                >
                  {/* Visual Indicator */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${item.type === "insight" ? "bg-amber-400" : "bg-slate-300"}`} />

                  <div className="relative z-10 pl-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="optimal" styleType="soft" className="text-[10px] px-2 py-0.5 uppercase tracking-wider">
                          {item.type === "insight" ? "Insight" : "News"}
                        </Badge>
                        <span className="text-xs text-text-muted font-medium">
                          {item.time} • {item.source}
                        </span>
                      </div>
                      {item.type === "insight" && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFD700]/20 border border-[#FFD700]/30">
                          <Sparkles className="w-3 h-3 text-[#FFD700]" />
                          <span className="text-[10px] font-bold text-[#FFD700] tracking-wide">SENTIENT</span>
                        </div>
                      )}
                    </div>
                    
                    <h3 className={`font-bold mb-2 transition-colors duration-300 text-balance ${
                      item.type === "insight" ? "text-text-main group-hover:text-[#FFD700]" : "text-text-main group-hover:text-primary"
                    }`}>
                      {item.title}
                    </h3>
                    
                    <p className={`text-sm text-text-muted leading-relaxed mb-3 text-pretty ${expandedArticles.includes(i) ? "line-clamp-none" : "line-clamp-2"}`}>
                      {item.content}
                    </p>

                    {/* Insight-specific actions */}
                    {item.type === "insight" && (
                      <div className="flex items-center justify-between mt-4 border-t border-[#FFD700]/10 pt-3">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleExpand(i); }} 
                            className="text-xs font-bold text-[#FFD700] hover:text-[#FFD700] flex items-center gap-1 transition-colors"
                          >
                            {expandedArticles.includes(i) ? "Show Less" : "Read More"} <ArrowRight className={`w-3 h-3 transition-transform ${expandedArticles.includes(i) ? "-rotate-90" : ""}`} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(i); }} 
                            className={`text-xs font-bold flex items-center gap-1 transition-colors ${favorites.includes(i) ? "text-rose-500" : "text-[#FFD700]/60 hover:text-rose-500"}`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${favorites.includes(i) ? "fill-current" : ""}`} />
                            {favorites.includes(i) ? "已收藏" : "加到我的收藏中"}
                          </button>
                        </div>
                        <span className="text-xs font-bold text-[#FFD700] flex items-center gap-1 bg-[#FFD700]/5 px-2 py-1 rounded-md border border-[#FFD700]/10">
                          <Activity className="w-3 h-3" />
                          {(item as any).confidence}% 信心水準
                        </span>
                      </div>
                    )}

                    {/* News-specific actions */}
                    {item.type === "news" && (
                      <div className="flex items-center justify-start gap-4 mt-3 pt-3 border-t border-border/10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleExpand(i); }} 
                          className="text-xs font-bold text-primary hover:text-primary-glow flex items-center gap-1 transition-colors"
                        >
                          {expandedArticles.includes(i) ? "Show Less" : "Read More"} <ArrowRight className={`w-3 h-3 transition-transform ${expandedArticles.includes(i) ? "-rotate-90" : ""}`} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(i); }} 
                          className={`text-xs font-bold flex items-center gap-1 transition-colors ${favorites.includes(i) ? "text-status-lethal" : "text-text-muted hover:text-status-lethal"}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${favorites.includes(i) ? "fill-current" : ""}`} />
                          {favorites.includes(i) ? "已收藏" : "加到我的收藏中"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
        </GlassCard>

        {/* Omni Calendar & Task List */}
        <GlassCard className="p-6 md:p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
            <h2 className="text-2xl font-bold text-text-main tracking-tight flex items-center gap-3 text-balance">
              {aiProxyMode ? <Network className="w-6 h-6 text-purple-500" /> : <Calendar className="w-6 h-6 text-[#219EBC]" />}
              {branding.calendarLabel}
            </h2>
            <Badge variant="optimal" styleType="soft" className="px-3 py-1.5">
              {tasks.filter((t) => !t.completed).length} 件待辦
            </Badge>
          </div>

          {/* Mini Calendar */}
          <div className="bg-gradient-to-br from-bg-base to-bg-surface rounded-2xl border border-border p-5 mb-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-main text-lg">2026年 3月</h3>
              <div className="flex gap-2">
                <button aria-label="Previous month" title="Previous month" className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"><ChevronLeft className="w-4 h-4 text-text-muted" aria-hidden="true" /></button>
                <button aria-label="Next month" title="Next month" className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-primary focus:outline-none"><ChevronRight className="w-4 h-4 text-text-muted" aria-hidden="true" /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d} className="text-xs font-bold text-text-muted py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <div key={d} className={`text-sm py-2 rounded-lg cursor-pointer transition-all ${d === 9 ? "bg-gradient-to-br from-primary to-primary-end text-white font-bold shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)] transform scale-105" : "text-text-main hover:bg-primary/5 font-medium"}`}>
                  {d}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                  task.completed
                    ? "bg-bg-surface/40 border-border opacity-60"
                    : "bg-bg-surface/50 border-border hover:border-primary/30 shadow-sm"
                }`}
              >
                <button
                  onClick={() => requestToggleTask(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                    task.completed
                      ? "bg-primary border-primary"
                      : "border-slate-300 hover:border-primary"
                  }`}
                >
                  {task.completed && <Check className="w-3 h-3 text-white" />}
                </button>
                <div className="flex-1">
                  {editingTaskId === task.id ? (
                    <div className="flex flex-col gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={editTaskText}
                          onChange={(e) => setEditTaskText(e.target.value)}
                          className="flex-1 text-sm border border-primary rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#009E9D]/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEditTask(task.id);
                            if (e.key === 'Escape') setEditingTaskId(null);
                          }}
                          suppressHydrationWarning
                        />
                        <button onClick={() => saveEditTask(task.id)} aria-label="Save task" title="Save task" className="p-1 text-primary hover:bg-primary/10 rounded-md focus-visible:ring-2 focus-visible:ring-primary focus:outline-none">
                          <Save className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button onClick={() => setEditingTaskId(null)} aria-label="Cancel edit" title="Cancel edit" className="p-1 text-text-muted hover:bg-slate-100 rounded-md focus-visible:ring-2 focus-visible:ring-primary focus:outline-none">
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={editTaskPriority}
                          onChange={(e) => setEditTaskPriority(e.target.value)}
                          className="text-xs border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#009E9D]/20 text-text-muted bg-bg-surface/50"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                        <input
                          type="date"
                          value={editTaskDueDate}
                          onChange={(e) => setEditTaskDueDate(e.target.value)}
                          className="text-xs border border-border rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#009E9D]/20 text-text-muted bg-bg-surface/50"
                        />
                      </div>
                    </div>
                  ) : (
                    <p
                      className={`text-sm font-medium ${task.completed ? "line-through text-text-muted" : "text-text-main"}`}
                      onDoubleClick={() => !task.completed && startEditTask(task.id, task.text, task.priority, task.dueDate)}
                    >
                      {task.text}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-3">
                      {task.priority && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                            task.priority === "High"
                              ? "bg-rose-100 text-rose-600"
                              : task.priority === "Medium"
                                ? "bg-[#FFD700]/20 text-[#FFD700]"
                                : "bg-cyan-100 text-cyan-600"
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!task.completed && editingTaskId !== task.id && (
                        <button
                          onClick={() => startEditTask(task.id, task.text, task.priority, task.dueDate)}
                          className="text-slate-300 hover:text-primary transition-colors p-1.5 rounded-md hover:bg-primary/10"
                          title="編輯任務"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => requestDeleteTask(task.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 rounded-md hover:bg-rose-50"
                        title="刪除任務"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Add New Task Form */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex gap-2 mb-2">
              <input 
                type="text" 
                placeholder="新增待辦事項..." 
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTask();
                }}
                className="flex-1 text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-glow bg-bg-surface/50 text-text-main"
                suppressHydrationWarning
              />
              <button 
                onClick={addTask}
                disabled={!newTaskText.trim()}
                className="bg-primary hover:bg-[#00C2A8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <select 
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="text-xs border border-border rounded-md px-2 py-1 focus:outline-none focus:border-primary text-text-muted bg-bg-surface/50"
                suppressHydrationWarning
              >
                <option value="High">高優先級</option>
                <option value="Medium">中優先級</option>
                <option value="Low">低優先級</option>
              </select>
              <input 
                type="date" 
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="text-xs border border-border rounded-md px-2 py-1 focus:outline-none focus:border-primary text-text-muted bg-bg-surface/50"
                suppressHydrationWarning
              />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* 【真善美信通】並行展示區 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <LiquidGlassCard 
            data={coreData} 
            isSealed={isSealed} 
            isComputing={isComputing}
            onViewTrace={(trace) => setActiveTrace(trace)}
          />
          {!isSealed && (
            <button 
              onClick={handleSeal}
              className="w-full mt-4 py-3 bg-text-main text-bg-base rounded-[4px] font-black text-[10px] tracking-[0.2em] hover:brightness-110 transition-all shadow-flat active:scale-95 uppercase italic"
            >
              發起 5T 信任封印 (INIT TRUST SEAL)
            </button>
          )}
        </div>
        {[
          {
            label: "SOC (Social)",
            value: "55",
            icon: Users,
            color: "text-[#FFB703]",
            bg: "bg-[#FFB703]/10",
          },
          {
            label: "GOV (Governance)",
            value: "50",
            icon: Shield,
            color: "text-[#219EBC]",
            bg: "bg-[#219EBC]/10",
          },
          {
            label: "AGC (Agency)",
            value: "35",
            icon: Zap,
            color: "text-[#FF4D6D]",
            bg: "bg-[#FF4D6D]/10",
          },
        ].map((stat, i) => (
          <GlassCard
            key={i}
            className="p-5 sm:p-8 flex items-center justify-between hover:-translate-y-1 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:border-primary/30"
            onClick={() => setSelectedEsgDomain(stat.label.split(' ')[0] as keyof typeof ESG_FUNCTIONS)}
          >
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {stat.label}
                </p>
                <h3 className="text-4xl font-bold text-text-main tracking-tight group-hover:text-primary transition-colors">
                  {stat.value}
                </h3>
                <p className="text-xs text-text-muted mt-1 font-medium uppercase tracking-wider flex items-center gap-1">
                  <List className="w-3 h-3" />
                  View Functions
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(stat.value, i);
              }}
              className="p-2.5 rounded-xl hover:bg-slate-100 text-text-muted hover:text-text-main transition-colors opacity-0 group-hover:opacity-100"
              title="Copy value"
            >
              {copiedIndex === i ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </GlassCard>
        ))}
      </div>

      {/* ESG GO System Overview Chart */}
      <GlassCard className="p-8 bg-bg-base border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">ESG GO 系統總覽圖</h2>
              <p className="text-text-muted text-sm">全方位永續治理架構與數據流轉</p>
            </div>
            <Badge className="bg-proxy/20 text-proxy border-proxy/30">Architecture v2.5</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-bg-surface border border-border">
              <h3 className="text-primary font-bold mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" /> 數據採集層
              </h3>
              <ul className="space-y-3 text-sm text-text-muted">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> IoT 能源感測器</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> ERP/SCM 系統對接</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> 供應商自評問卷</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-bg-surface border border-border">
              <h3 className="text-status-optimal font-bold mb-4 flex items-center gap-2">
                <Bot className="w-4 h-4" /> AI 處理層
              </h3>
              <ul className="space-y-3 text-sm text-text-muted">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> 碳排放因子自動匹配</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> 永續風險預警模型</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-500 rounded-full" /> 合規報告自動生成</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-bg-surface border border-border">
              <h3 className="text-accent font-bold mb-4 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> 價值輸出層
              </h3>
              <ul className="space-y-3 text-sm text-text-muted">
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-accent rounded-full" /> 永續幣獎勵生態</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-accent rounded-full" /> 供應鏈影響力評級</li>
                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-accent rounded-full" /> 投資者關係透明化</li>
              </ul>
            </div>

          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GlassCard className="p-6 sm:p-8 bg-gradient-to-br from-status-optimal/10 to-bg-surface/80 border-status-optimal/20 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-200/30 rounded-full blur-3xl group-hover:bg-emerald-300/40 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-text-main tracking-tight">
                ［善向永續村 號召令］
              </h2>
            </div>
            <p className="text-text-muted mb-6 font-medium text-lg">
              徵集村民 / 優質進駐商家
            </p>
            <p className="text-sm text-text-muted mb-6 leading-relaxed">
              加入我們的永續生態系，與志同道合的夥伴共同打造綠色未來。無論您是關注永續發展的個人，還是致力於 ESG 實踐的優質企業，善向永續村都歡迎您的加入。
            </p>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-status-optimal hover:bg-status-optimal/80 text-white rounded-xl font-bold transition-colors shadow-sm shadow-status-optimal/20">
              立即響應 <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6 sm:p-8 bg-gradient-to-br from-purple-500/10 to-[#0A1626]/80 border-purple-500/20 relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-violet-200/30 rounded-full blur-3xl group-hover:bg-violet-300/40 transition-colors" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-violet-100 text-violet-600 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-text-main tracking-tight">
                下期重點改版內容
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "善向永續村 RPG", icon: Shield },
                { name: "永續學堂", icon: FileText },
                { name: "永續卡牌", icon: Zap },
                { name: "永續部屋", icon: Heart },
                { name: "永續代理", icon: Network },
                { name: "永續商城", icon: Leaf },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-bg-surface/50 rounded-xl border border-proxy/20 shadow-sm hover:shadow-md hover:border-proxy/40 transition-all">
                  <div className="p-2 bg-proxy/10 text-proxy rounded-lg">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-text-main text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-bg-surface/50 rounded-2xl shadow-xl border border-border p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-full ${confirmAction.type === 'delete' ? 'bg-rose-100 text-rose-600' : 'bg-primary/10 text-primary'}`}>
                {confirmAction.type === 'delete' ? <Trash2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <h3 className="text-lg font-bold text-text-main">
                {confirmAction.type === 'delete' ? '確認刪除任務？' : '確認完成任務？'}
              </h3>
            </div>
            <p className="text-text-muted text-sm mb-6">
              {confirmAction.type === 'delete'
                ? '此操作將永久刪除該任務，無法復原。您確定要繼續嗎？'
                : '標記為完成後，該任務將歸檔。您確定已完成此任務嗎？'}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-text-muted hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors ${
                  confirmAction.type === 'delete'
                    ? 'bg-rose-500 hover:bg-rose-600'
                    : 'bg-primary hover:bg-[#00C2A8]'
                }`}
              >
                確認{confirmAction.type === 'delete' ? '刪除' : '完成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ESG Functions Modal */}
      {selectedEsgDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-6">
          <div className={`rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden ${
            selectedEsgDomain === 'ENV' ? 'bg-emerald-50/90 border border-emerald-200' :
            selectedEsgDomain === 'SOC' ? 'bg-[#FFFAF0] border border-[#FFD700]/30' :
            selectedEsgDomain === 'GOV' ? 'bg-bg-surface/40 border border-slate-300' :
            'bg-slate-950 border border-rose-900/50'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              selectedEsgDomain === 'ENV' ? 'bg-[#0A1626]/60 border-emerald-100' :
              selectedEsgDomain === 'SOC' ? 'bg-[#0A1626]/60 border-amber-100' :
              selectedEsgDomain === 'GOV' ? 'bg-bg-surface/50 border-border' :
              'bg-slate-900/80 border-rose-900/50'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${
                  selectedEsgDomain === 'ENV' ? 'bg-cyan-100 text-cyan-600' :
                  selectedEsgDomain === 'SOC' ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                  selectedEsgDomain === 'GOV' ? 'bg-slate-200 text-text-main' :
                  'bg-rose-950 border border-rose-800 text-rose-500'
                }`}>
                  {selectedEsgDomain === 'ENV' ? <Leaf className="w-6 h-6" /> :
                   selectedEsgDomain === 'SOC' ? <Users className="w-6 h-6" /> :
                   selectedEsgDomain === 'GOV' ? <Shield className="w-6 h-6" /> :
                   <Zap className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${
                    selectedEsgDomain === 'AGC' ? 'text-rose-400' : 'text-text-main'
                  }`}>
                    {selectedEsgDomain === 'ENV' ? '環境 (Environment)' :
                     selectedEsgDomain === 'SOC' ? '社會 (Social)' :
                     selectedEsgDomain === 'GOV' ? '治理 (Governance)' :
                     '代理 (Agency)'} 功能清單
                  </h2>
                  <p className={`text-sm mt-1 ${
                    selectedEsgDomain === 'AGC' ? 'text-rose-500/70' : 'text-slate-500'
                  }`}>
                    共 {selectedEsgDomain ? ESG_FUNCTIONS[selectedEsgDomain].length : 0} 項核心功能模組
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEsgDomain(null)}
                className={`p-2 rounded-full transition-colors ${
                  selectedEsgDomain === 'AGC' 
                    ? 'hover:bg-rose-900/50 text-rose-500 hover:text-rose-400' 
                    : 'hover:bg-black/5 text-text-muted hover:text-text-muted'
                }`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Area */}
            <div className={`p-6 overflow-y-auto custom-scrollbar ${
              selectedEsgDomain === 'AGC' ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black' : ''
            }`}>
              {selectedEsgDomain === 'ENV' && (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                  {ESG_FUNCTIONS.ENV.map((func, idx) => (
                    <div key={idx} className="break-inside-avoid bg-gradient-to-br from-white to-emerald-50/30 border-l-4 border-emerald-500 rounded-r-2xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </div>
                        <Leaf className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-text-main font-medium leading-relaxed">{func}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedEsgDomain === 'SOC' && (
                <div className="flex flex-wrap gap-4 justify-center">
                  {ESG_FUNCTIONS.SOC.map((func, idx) => (
                    <div key={idx} className="flex-auto min-w-[280px] max-w-[400px] bg-bg-surface/50 border border-[#FFD700]/30 rounded-[2rem] p-2 pr-6 flex items-center gap-4 hover:bg-[#FFD700]/10 hover:scale-105 transition-all cursor-default shadow-sm hover:shadow-amber-100/50 group">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-white flex items-center justify-center font-bold shadow-inner group-hover:rotate-12 transition-transform">
                        {idx + 1}
                      </div>
                      <span className="text-text-main font-medium text-sm leading-relaxed">{func}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedEsgDomain === 'GOV' && (
                <div className="bg-bg-surface/50 border border-slate-300 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white">
                        <th className="py-4 px-6 font-semibold text-sm w-24">編號</th>
                        <th className="py-4 px-6 font-semibold text-sm">治理控制項目 (Governance Protocol)</th>
                        <th className="py-4 px-6 font-semibold text-sm text-right">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ESG_FUNCTIONS.GOV.map((func, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-bg-surface/40 transition-colors">
                          <td className="py-4 px-6 font-mono text-slate-500 text-sm">{(idx + 1).toString().padStart(2, '0')}</td>
                          <td className="py-4 px-6 font-medium text-text-main">{func}</td>
                          <td className="py-4 px-6 text-right">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-text-muted uppercase tracking-wider border border-border">
                              <Shield className="w-3 h-3" /> Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedEsgDomain === 'AGC' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 font-mono">
                  {ESG_FUNCTIONS.AGC.map((func, idx) => (
                    <div key={idx} className="relative bg-black/50 border border-rose-500/30 p-5 rounded-lg overflow-hidden group hover:border-rose-500 hover:shadow-[0_0_15px_rgba(225,29,72,0.2)] transition-all">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-rose-500 text-xs font-bold tracking-widest">SYS.REQ.{(idx + 1).toString().padStart(2, '0')}</span>
                        <Zap className="w-4 h-4 text-rose-400 opacity-50 group-hover:opacity-100 group-hover:animate-pulse" />
                      </div>
                      <p className="text-rose-100 text-sm leading-relaxed">
                        <span className="text-rose-500 mr-2">{'>'}</span>
                        {func}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-6 border-t flex justify-end ${
              selectedEsgDomain === 'ENV' ? 'bg-[#0A1626]/60 border-emerald-100' :
              selectedEsgDomain === 'SOC' ? 'bg-[#0A1626]/60 border-amber-100' :
              selectedEsgDomain === 'GOV' ? 'bg-slate-100 border-border' :
              'bg-slate-900/80 border-rose-900/50'
            }`}>
              <button
                onClick={() => setSelectedEsgDomain(null)}
                className={`px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  selectedEsgDomain === 'ENV' ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-200' :
                  selectedEsgDomain === 'SOC' ? 'bg-[#FFD700]/100 hover:bg-amber-600 text-white hover:shadow-amber-200' :
                  selectedEsgDomain === 'GOV' ? 'bg-slate-800 hover:bg-slate-900 text-white hover:shadow-slate-300' :
                  'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(225,29,72,0.6)]'
                }`}
              >
                {selectedEsgDomain === 'AGC' ? 'TERMINATE_SESSION' : '關閉清單'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Matrix (快捷存取) */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-main tracking-tight">快速啟動模組</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'omni-src', label: aiProxyMode ? '報告管理' : '影響力管理', icon: FileBarChart, color: 'hover:bg-indigo-50 border-indigo-100 text-indigo-700' },
            { id: 'omni-chrono', label: aiProxyMode ? '時程管理' : '合規管理', icon: HistoryIcon, color: 'hover:bg-[#FFD700]/10 border-amber-100 text-[#FFD700]' },
            { id: 'omni-truth', label: aiProxyMode ? '數據中心' : '數據核對', icon: Table, color: 'hover:bg-emerald-50 border-emerald-100 text-emerald-700' },
            { id: 'newsletter', label: '永續月報', icon: Mail, color: 'hover:bg-rose-50 border-rose-100 text-rose-700' }
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => setActiveTab(action.id)}
                className={`p-6 rounded-2xl border bg-bg-surface/50 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:shadow-xl ${action.color}`}
              >
                <Icon className="w-8 h-8" />
                <span className="font-bold text-sm tracking-wide">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Traceability Chain Overlay */}
      <AnimatePresence>
        {activeTrace && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg-base/80 backdrop-blur-md"
              onClick={() => setActiveTrace(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-bg-surface border border-border shadow-flat p-8 rounded-[4px] max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-text-main uppercase italic tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  溯源存證鏈 (Traceability Chain)
                </h3>
                <button onClick={() => setActiveTrace(null)} aria-label="Close Traceability Chain" title="Close Traceability Chain" className="p-2 hover:bg-bg-base rounded-full text-text-muted focus-visible:ring-2 focus-visible:ring-primary focus:outline-none">
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <div className="space-y-6">
                {activeTrace.map((log, idx) => (
                  <div key={idx} className="relative pl-8 border-l border-border py-1">
                    <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-bg-surface shadow-flat" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{log.action}</span>
                        <span className="text-[10px] font-mono text-text-muted">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] font-black text-text-main uppercase italic tracking-tighter">ACTOR: {log.actor}</p>
                      <p className="text-[10px] text-text-muted font-mono break-all opacity-60">ORIGIN: {log.source_origin}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-[9px] text-text-muted font-medium italic opacity-50 uppercase tracking-widest text-center">
                  Immutable hash lock secured by ADK-10 Apostles.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
