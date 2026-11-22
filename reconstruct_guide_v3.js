const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'components', 'views', 'system', 'guide-view.tsx');

const content = `// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Menu, 
  Layout, 
  Briefcase, 
  Zap,
  Globe,
  Settings,
  HelpCircle,
  X,
  Plus,
  Target,
  Trophy,
  History,
  Calendar,
  Filter,
  Download,
  Share2,
  MoreVertical,
  Bell,
  MessageSquare,
  Users,
  Send,
  Sparkles,
  BarChart3,
  PieChart,
  LineChart,
  Table as TableIcon,
  Image as ImageIcon,
  Layers,
  StickyNote,
  Trash2,
  GripVertical,
  Maximize2,
  RefreshCw,
  Loader2,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { useAppContext } from "@/lib/context/app-context";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

// --- Types (InfoOne Matrix Architecture) ---

interface ChapterData {
  id: string;
  title: string;
  items: string[];
  explanation: {
    what: string;
    why: string;
    how: string;
  };
  strategies: {
    title: string;
    points: {
      label: string;
      desc: string;
    }[];
  };
  template: string;
}

const CHAPTERS = [
  {
    id: "foundation",
    title: "基礎設施 (Foundation)",
    subChapters: ["company-info", "esg-team", "stakeholders"]
  },
  {
    id: "environment",
    title: "環境保護 (Environment)",
    subChapters: ["carbon-footprint", "energy-efficiency", "waste-management"]
  },
  {
    id: "social",
    title: "社會責任 (Social)",
    subChapters: ["employee-wellbeing", "community-engagement", "supply-chain"]
  },
  {
    id: "governance",
    title: "公司治理 (Governance)",
    subChapters: ["board-diversity", "ethics-compliance", "transparency"]
  }
];

const CHAPTER_CONTENT: Record<string, ChapterData> = {
  // --- Foundation ---
  "company-info": {
    id: "company-info",
    title: "公司基本概況 (Company Overview)",
    items: [
      "企業基本資料 (Corporate Information)",
      "核心業務與營運地點 (Operations & Locations)",
      "永續願景與承諾 (Sustainability Vision)"
    ],
    explanation: {
      what: "記錄公司的基礎法律與營運資訊，建立 ESG 報告的信任基石。",
      why: "透明的基礎資料是利害關係人評估企業穩定性與誠信的首要指標。",
      how: "彙整工商登記、年報與官方網站，整合出統一的年度營運背景說明。"
    },
    strategies: {
      title: "核心要素 (Core Elements)",
      points: [
        { label: "透明度 (Transparency)", desc: "準確披露組織架構與所有權細節。" },
        { label: "完整性 (Integrity)", desc: "覆蓋所有主要子公司與分支機構的營運規模。" }
      ]
    },
    template: "# 公司基本概況分析報告\\n\\n## 1. 組織架構說明\\n[請填寫組織架構詳情...]\\n\\n## 2. 年度營運數據摘要\\n[請填寫營運數據...]\\n\\n## 3. 永續發展目標 (SDGs) 關聯性\\n[請分析與 SDGs 的連結...]"
  },
  "esg-team": {
    id: "esg-team",
    title: "ESG 組織架構 (ESG Governance)",
    items: [
      "委員會成員組成 (Committee Composition)",
      "職責權限劃分 (Roles & Responsibilities)",
      "決議與回報機制 (Reporting Mechanics)"
    ],
    explanation: {
      what: "定義領導 ESG 事務的核心團隊與其運作流程。",
      why: "強有力的治理架構確保永續策略能由上而下落實於企業文化中。",
      how: "成立跨部門小組，由高層主管擔任召集人，並定期召開進度審核會議。"
    },
    strategies: {
      title: "治理策略 (Governance Strategy)",
      points: [
        { label: "權責對等 (Accountability)", desc: "明確劃分永續目標與各級主管的 KPI 連結。" },
        { label: "跨部協作 (Collaboration)", desc: "建立跨部門數據互通平台，降低資訊孤島效率。" }
      ]
    },
    template: "# ESG 治理架構規劃\\n\\n## 1. 委員會名冊\\n[填寫成員清單與職稱...]\\n\\n## 2. 年度查核計畫\\n[填寫計畫時程...]"
  },
  "stakeholders": {
    id: "stakeholders",
    title: "利害關係人議合 (Stakeholder Engagement)",
    items: [
      "利害關係人識別 (Identification)",
      "重大性議題矩陣 (Materiality Matrix)",
      "議合渠道與頻率 (Engagement Channels)"
    ],
    explanation: {
      what: "識別關心企業運作的個人或團體，並評估其關注議題。",
      why: "回應利害關係人的期望能降低經營風險並發掘市場機會。",
      how: "透過問卷、訪談與論壇，收集各方意見並進行雙向溝通。"
    },
    strategies: {
      title: "議合核心 (Engagement Core)",
      points: [
        { label: "雙向性 (Bidirectional)", desc: "建立透明的對話管道，而非單向公告。" },
        { label: "回應性 (Responsiveness)", desc: "將調查結果納入企業決策與報告重點。" }
      ]
    },
    template: "# 利害關係人溝通成果報告\\n\\n## 1. 識別對象清單\\n[政府、員工、客戶、供應商...]\\n\\n## 2. 重大議題熱點分析\\n[插入重大性矩陣圖表...]"
  },
  // --- Environment ---
  "carbon-footprint": {
    id: "carbon-footprint",
    title: "碳足跡盤查 (Carbon Footprint)",
    items: ["範疇一與範疇二排放 (Scope 1 & 2)", "範疇三價值鏈盤查 (Scope 3)", "減碳目標與路徑 (Net Zero Path)"],
    explanation: {
      what: "量化組織活動產生的溫室氣體總量。",
      why: "碳盤查是氣候行動的第一步，也是滿足合規要求的關鍵數據。",
      how: "依據 ISO 14064-1 進行邊境界定、排放源識別與活動數據收集。"
    },
    strategies: {
      title: "減碳策略 (Carbon Strategy)",
      points: [
        { label: "數據完整性 (Completeness)", desc: "覆蓋所有重要排放源，避免資料遺漏。" },
        { label: "可驗證性 (Verifyability)", desc: "保留原始憑證，以利外部查證機構查驗。" }
      ]
    },
    template: "# 溫室氣體盤查彙整表\\n\\n## 1. 年度排放總量摘要\\n[填寫 CO2e 數據...]\\n\\n## 2. 減排計畫執行進度\\n[描述當前減量措施...]"
  },
  "energy-efficiency": {
    id: "energy-efficiency",
    title: "能源管理提升 (Energy Efficiency)",
    items: ["能源消耗總量分析 (Consumption)", "節能措施與成效 (Energy Saving)", "再生能源配比 (Renewables)"],
    explanation: {
      what: "監控與優化企業能源使用效率，並增加綠能比例。",
      why: "提升能效能直接降低營運成本並減少環境負荷。",
      how: "建立能源管理系統 (ISO 50001)，優化照明、空調與生產製程。"
    },
    strategies: {
      title: "節能路徑 (Energy Roadmap)",
      points: [
        { label: "系統化 (Systemization)", desc: "建立即時能耗監控平台，識別高耗能熱點。" },
        { label: "轉型化 (Transformation)", desc: "逐步替換老舊設備，並導入低碳能源技術。" }
      ]
    },
    template: "# 能源績效改善報告\\n\\n## 1. 能源結構分析\\n[電力、燃油、再生能源...]\\n\\n## 2. 節能改善專案成果\\n[描述專案內容與省下之電費或碳排...]"
  },
  "waste-management": {
    id: "waste-management",
    title: "廢棄物循環管理 (Waste Management)",
    items: ["廢棄物總量與分類 (Waste Flow)", "回收與再利用率 (Recycling Rate)", "危險廢棄物處理 (Hazardous Waste)"],
    explanation: {
      what: "追蹤產品從生產到最終處置的廢棄物流向。",
      why: "推動資源循環利用，減少對垃圾埋填與焚燒的依賴。",
      how: "導入循環經濟設計，優化包裝材質，並與合規回收商合作。"
    },
    strategies: {
      title: "循環策略 (Circular Strategy)",
      points: [
        { label: "源頭減量 (Reduction)", desc: "從設計階段就考慮減少廢棄物產生。" },
        { label: "價值再造 (Value Recovery)", desc: "將廢棄物視為資源，轉化為生產原料。" }
      ]
    },
    template: "# 廢棄物管理與循環報告\\n\\n## 1. 廢棄物產量分析\\n[一般事業、危險廢棄物...]\\n\\n## 2. 資源循環率目標達成狀況\\n[填寫回收率數據...]"
  },
  // --- Social ---
  "employee-wellbeing": {
    id: "employee-wellbeing",
    title: "員工福祉與培訓 (Employee Wellbeing)",
    items: ["薪酬平等與晉升 (Fair Pay)", "職業健康與安全 (Health & Safety)", "人才多元培力 (Talent Training)"],
    explanation: {
      what: "確保員工擁有安全、公平且具成長空間的工作環境。",
      why: "人才的核心優勢在於健康與動力，是企業競爭力的基石。",
      how: "提供健康檢查、職業訓練規劃，並建立公正的績效評核系統。"
    },
    strategies: {
      title: "人才策略 (Talent Strategy)",
      points: [
        { label: "多樣性 (Diversity)", desc: "推動性別平等與跨文化的工作環境。" },
        { label: "幸福感 (Wellness)", desc: "平衡工作與生活，提供彈性辦公或心理輔導。" }
      ]
    },
    template: "# 人力資源發展摘要\\n\\n## 1. 員工人數與組成分析\\n[填寫男女比、職級分佈...]\\n\\n## 2. 安全衛生績效指標\\n[失能傷害頻率 FR、嚴重率 SR...]"
  },
  "community-engagement": {
     id: "community-engagement",
     title: "社會參與與共好 (Community Engagement)",
     items: ["公益活動投入 (Philanthropy)", "社區夥伴關係 (Partnership)", "社會影響力評估 (Impact)"],
     explanation: {
        what: "回饋社區，建立和諧的地方關係與品牌形象。",
        why: "企業作為社會公民，應協助解決在地需求以獲得經營認同。",
        how: "支持教育、文化、環保等公益項目，並鼓勵員工參與志工服務。"
     },
     strategies: {
        title: "公益核心 (Social Purpose)",
        points: [
           { label: "長期性 (Sustainability)", desc: "專注於具備長期影響力的專案，而非一次性捐贈。" },
           { label: "關聯性 (Relevance)", desc: "核心公益計畫應與企業本業能力相結合。" }
        ]
     },
     template: "# 社會影響力報告\\n\\n## 1. 年度公益投入金額與時數\\n[填寫數據...]\\n\\n## 2. 重點專案成果描述\\n[執行內容與受益人次...]"
  },
  "supply-chain": {
    id: "supply-chain",
    title: "永續供應鏈管理 (Supply Chain)",
    items: ["供應商風險評鑑 (Assessment)", "綠色採購標準 (Green Procurement)", "輔導與能力建構 (Supplier Training)"],
    explanation: {
      what: "管理上下游夥伴的 ESG 合規狀況，降低供應鏈風險。",
      why: "全球供應鏈日益脆弱，穩定的永續夥伴是韌性營運的關鍵。",
      how: "建立供應商行為準則，進行實地稽核，並協助優化其減碳技術。"
    },
    strategies: {
      title: "鏈動策略 (Chain Strategy)",
      points: [
        { label: "透明度 (Traceability)", desc: "掌握關鍵原物料的來源與產製過程。" },
        { label: "共榮性 (Co-prosperity)", desc: "與轉型商共議減碳路徑，共享永續成果。" }
      ]
    },
    template: "# 供應鏈永續績效報告\\n\\n## 1. 供應商查核覆蓋率\\n[填寫稽核百分比...]\\n\\n## 2. 綠色採購金額佔比\\n[描述採購策略成果...]"
  },
  // --- Governance ---
  "board-diversity": {
    id: "board-diversity",
    title: "董事會組成與多元化 (Board Diversity)",
    items: ["席位分佈與專業性 (Expertise)", "性別平等指標 (Gender Balance)", "永續治理職責 (ESG oversight)"],
    explanation: {
      what: "建構具備多樣專業背景與獨立性的決策核心。",
      why: "多元視角能提升風險偵測能力並強化組織治理深度。",
      how: "提名具備 ESG、法律、財務專長的專家，並設定女性董事比例目標。"
    },
    strategies: {
      title: "決策引領 (Leadership)",
      points: [
        { label: "獨立性 (Independence)", desc: "確保外部董事能客觀審視經營狀況。" },
        { label: "韌性 (Resilience)", desc: "將氣候風險納入董事會層級的常態議題。" }
      ]
    },
    template: "# 治理效率評估報告\\n\\n## 1. 董事會成員組成明細\\n[名單與背景...]\\n\\n## 2. 下屆多元化目標規劃\\n[預計調整方向...]"
  },
  "ethics-compliance": {
     id: "ethics-compliance",
     title: "商業道德與合規 (Ethics & Compliance)",
     items: ["誠信經營準則 (Anti-corruption)", "吹哨者保護機制 (Whistleblower)", "法規遵循查核 (Legal Check)"],
     explanation: {
        what: "維護企業廉潔，杜絕貪腐與任何非法商業行為。",
        why: "信譽是企業最貴的資產，合規經營是防範法律危機的唯一底線。",
        how: "舉辦定期誠信宣導，建立外部獨立報案管道，並落實內稽內控。"
     },
     strategies: {
        title: "基石策略 (Core Foundation)",
        points: [
           { label: "零容忍 (Zero Tolerance)", desc: "對於貪腐與賄賂行為採取堅決清查態度。" },
           { label: "透明化 (Transparency)", desc: "主動披露任何重大違規事件及其後續處理。" }
        ]
     },
     template: "# 誠信經營執行報告\\n\\n## 1. 教育訓練涵蓋率\\n[填寫百分比...]\\n\\n## 2. 申訴舉報案件處理摘要\\n[描述管理流程與結果...]"
  },
  "transparency": {
     id: "transparency",
     title: "資訊披露透明度 (Transparency)",
     items: ["公開資訊觀測站申報 (Public Filing)", "ESG 官網專區維護 (Portal)", "外部保證與確信 (Assurance)"],
     explanation: {
        what: "確保永續數據的準確報送與易於取得性。",
        why: "建立資本市場信心，提高 ESG 評級機構的資料可信度。",
        how: "委託會計師事務所進行第三方確信，並定期更新永續動態網頁。"
     },
     strategies: {
        title: "信賴策略 (Trust Strategy)",
        points: [
           { label: "及時性 (Timeliness)", desc: "依照法定時程儘早發布年度永續報告。" },
           { label: "對標性 (Alignment)", desc: "確切符合 GRI、SASB 與金管會之最新準則。" }
        ]
     },
     template: "# 資訊揭露質化分析\\n\\n## 1. 合規查檢清單達成度\\n[項次查對...]\\n\\n## 2. 第三方查驗聲明書\\n[附上查證案號...]"
  }
};

const VOUCHERS = [
  {
    id: "v1",
    name: "溫室氣體排放盤查數據 (GHC Inventory Data)",
    source: "環境工程部",
    status: "collected",
    syncStatus: "synced", // 雙向TS
    desc: "2023 年度範疇一與範疇二之總排放量統計報告。",
    response: "報告已核准，文件案號：E-2023-004。"
  },
  {
    id: "v2",
    name: "供應商行為準則簽署率 (Supplier Code of Conduct)",
    source: "採購管理處",
    status: "pending",
    syncStatus: "syncing", // 雙向TS
    desc: "統計 Tier 1 供應商簽署社會責任承諾書之比例。",
    response: null
  },
  {
    id: "v3",
    name: "利害關係人問卷原始檔 (Stakeholder Survey Raw Data)",
    source: "永續發展辦公室",
    status: "collected",
    syncStatus: "synced", // 雙向TS
    desc: "針對股東、客戶及社區之年度線上問卷調查完整結果。",
    response: "資料已入庫，共計 842 份有效樣本。"
  }
];

// --- Sub-components ---

const VisualizationBlock = ({ block, onDelete }: { block: any; onDelete: () => void }) => {
  const renderContent = () => {
    switch (block.type) {
      case "text":
        return <div className="text-sm text-slate-700 whitespace-pre-wrap">{block.content}</div>;
      case "chart":
        return (
          <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-[#219EBC] mx-auto mb-2 opacity-50" />
              <p className="text-xs text-slate-500 font-medium">已生成「{block.chartType}」數據圖表 (Dynamic Chart Generated)</p>
            </div>
          </div>
        );
      case "image":
        return (
          <div className="relative group overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
             <img src={block.url} alt="AI Generated Visual" className="w-full h-auto object-cover" />
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="wireframe" className="text-white border-white scale-75">放大查看 (View Full)</Button>
             </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4 relative group">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{block.title || block.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

// --- Main View Component ---

export default function GuideView() {
  const { activeTab, setActiveTab } = useAppContext();
  const [activeSubChapter, setActiveSubChapter] = useState("company-info");
  const [expandedChapters, setExpandedChapters] = useState<string[]>(["foundation"]);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isCollabMode, setIsCollabMode] = useState(false);
  const [isGuideActive, setIsGuideActive] = useState(true);
  
  // Content Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState("");
  const [layoutBlocks, setLayoutBlocks] = useState<any[]>([]);
  
  // Analysis States
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzingCrossChapter, setIsAnalyzingCrossChapter] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const [isAnalyzingGap, setIsAnalyzingGap] = useState(false);
  
  // Vouchers & Chat
  const [remindedVouchers, setRemindedVouchers] = useState<string[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([
    { id: 1, user: "陳經理", text: "請查清範疇三的盤查範圍是否完整？", time: "10:30 AM", avatarColor: "bg-indigo-500" },
    { id: 2, user: "系統 AI", text: "已偵測到數據更新，建議重新進行實踐差距分析。", time: "11:15 AM", avatarColor: "bg-emerald-500" }
  ]);

  const currentChapter = CHAPTER_CONTENT[activeSubChapter] || CHAPTER_CONTENT["company-info"];

  useEffect(() => {
    setEditedTemplate(currentChapter.template);
    setLayoutBlocks([]);
    setAnalysisResult(null);
  }, [activeSubChapter]);

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = \`你是一位專業的 ESG 永續顧問。基於以下章節背景：
章節：\${currentChapter.title}
目標內容：\${currentChapter.explanation.what}
策略：\${currentChapter.strategies.title}

請針對以下模板進行專業擴充與優化：
\${editedTemplate}

要求：
1. 使用專業、正式的繁體中文。
2. 增加具體的行業標竿案例。
3. 結構清晰，使用 Markdown 格式。\`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setEditedTemplate(response.text());
      setIsEditingTemplate(false);
    } catch (error) {
      console.error("AI Generation Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVisuals = async () => {
    setIsGeneratingVisuals(true);
    setTimeout(() => {
      const newBlocks = [
        { id: Date.now() + 1, type: "chart", chartType: "Bar Chart", title: "營運數據看板 (Operations Dashboard)" },
        { id: Date.now() + 2, type: "text", content: "AI 分析：當前章節的數據完整度為 87%，優於同業平均。" },
        { id: Date.now() + 3, type: "image", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800", title: "資產分佈圖 (Asset Distribution)" }
      ];
      setLayoutBlocks(newBlocks);
      setIsGeneratingVisuals(false);
    }, 1500);
  };

  const handleCrossChapterAnalysis = async () => {
    setIsAnalyzingCrossChapter(true);
    setTimeout(() => {
      setAnalysisResult({
        type: "cross-chapter",
        content: "經交叉分析：『公司基本概況』中所述的子公司 A 在『環境保護』章節中尚未列入範疇三計算。建議修正以確保一致性。"
      });
      setIsAnalyzingCrossChapter(false);
    }, 2000);
  };

  const handleGapAnalysis = async () => {
    setIsAnalyzingGap(true);
    setTimeout(() => {
      setAnalysisResult({
        type: "gap",
        content: "當前披露內容與 GRI 實務準則相比，仍存在對『極端氣候適應方案』的實踐描述缺失（Gap 12%）。"
      });
      setIsAnalyzingGap(false);
    }, 1200);
  };

  const handleComplianceCheck = async () => {
     setIsCheckingCompliance(true);
     setTimeout(() => {
       setAnalysisResult({
         type: "compliance",
         content: "✓ 符合 TCFD 指引要求的治理披露方式。\\n✓ 符合 ISO 14064-1 數據格式需求。"
       });
       setIsCheckingCompliance(false);
     }, 1000);
  };

  const handleRemind = (id: string, source: string) => {
    setRemindedVouchers(prev => [...prev, id]);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: comments.length + 1,
      user: "我",
      text: newComment,
      time: "剛剛 (Just now)",
      avatarColor: "bg-[#009E9D]"
    };
    setComments(prev => [...prev, comment]);
    setNewComment("");
  };

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 sm:px-6 animate-in fade-in duration-500 h-full flex flex-col">
      {/* 頂部動態標題 (Dynamic Header) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#333333] tracking-tight">
            實踐進度與指引 (Practice & Guide)
          </h1>
          <p className="text-[#666666] mt-1.5 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            隨時取用 5T 協議驅動的智慧寫作輔助。 (AI-Powered Assistant)
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/60 p-1 rounded-[12px] border border-slate-200 backdrop-blur-md">
           <Button 
            variant={isGuideActive ? "default" : "outline"} 
            className={\`rounded-[10px] px-6 h-10 text-sm \${isGuideActive ? 'bg-slate-900 text-white' : ''}\`}
            onClick={() => setIsGuideActive(true)}
           >
             <Layout className="w-4 h-4 mr-2" />
             編寫模式 (Editor)
           </Button>
           <Button 
            variant={!isGuideActive ? "default" : "outline"} 
            className={\`rounded-[10px] px-6 h-10 text-sm \${!isGuideActive ? 'bg-slate-900 text-white' : ''}\`}
            onClick={() => setIsGuideActive(false)}
           >
             <Layers className="w-4 h-4 mr-2" />
             終始矩陣 (Matrix)
           </Button>
        </div>
      </div>

      {isGuideActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[750px]">
          {/* 左側邊欄 - 章節清單 (Chapters List) */}
          <GlassCard className="lg:col-span-3 p-4 flex flex-col gap-4 overflow-hidden border-none shadow-xl bg-white/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="搜尋章節 (Search Chapters...)"
                className="w-full bg-slate-100/50 border-none rounded-xl py-2.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-[#009E9D]/20 outline-none placeholder:text-slate-400"
              />
            </div>
            
            <ScrollArea className="flex-1">
              <div className="space-y-2 pr-4">
                {CHAPTERS.map(chapter => (
                  <div key={chapter.id} className="space-y-1">
                    <button 
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/60 transition-all text-sm font-black text-slate-700 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className={\`w-2 h-2 rounded-full \${expandedChapters.includes(chapter.id) ? 'bg-[#009E9D] shadow-[0_0_8px_rgba(0,158,157,0.4)]' : 'bg-slate-300'}\`} />
                        {chapter.title}
                      </div>
                      {expandedChapters.includes(chapter.id) ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </button>
                    
                    <AnimatePresence>
                      {expandedChapters.includes(chapter.id) && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden bg-white/20 rounded-xl ml-2"
                        >
                          {chapter.subChapters.map(sub => (
                            <button
                              key={sub}
                              onClick={() => setActiveSubChapter(sub)}
                              className={\`w-full text-left p-3 pl-6 text-xs transition-all border-l-4 \${activeSubChapter === sub ? 'text-[#009E9D] font-black border-[#009E9D] bg-white/60 shadow-sm' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-white/40'}\`}
                            >
                              {CHAPTER_CONTENT[sub]?.title || sub}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </GlassCard>

          {/* 中央內容 - 編輯器與 AI 工作區 (Editor & AI Workspace) */}
          <GlassCard className="lg:col-span-9 p-0 flex flex-col relative overflow-hidden border-none shadow-2xl bg-white/30">
            <div className="border-b border-slate-100 bg-white/90 backdrop-blur-md p-5 flex justify-between items-center z-10 sticky top-0 shadow-sm">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-gradient-to-br from-[#009E9D] to-[#219EBC] rounded-2xl shadow-lg shadow-[#009E9D]/10">
                    <FileText className="w-6 h-6 text-white" />
                 </div>
                 <div>
                    <h3 className="font-black text-slate-800 text-lg leading-tight">{currentChapter.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">數據就緒 (Ready)</span>
                       <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <History className="w-3.5 h-3.5" /> 剛更新 (Updated)
                       </span>
                    </div>
                 </div>
               </div>
               <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="h-10 px-4 text-xs font-black shadow-sm"
                    onClick={() => setIsCollabMode(!isCollabMode)}
                  >
                    <Users className="w-4 h-4 mr-2 text-indigo-500" />
                    團隊協作 (Collab)
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-10 px-4 text-xs font-black shadow-sm"
                    onClick={() => setIsNoteOpen(!isNoteOpen)}
                  >
                    <StickyNote className="w-4 h-4 mr-2 text-amber-500" />
                    萬能筆記 (Notes)
                  </Button>
               </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-8 space-y-8">
                {/* 脈絡指引 (Context Guide) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   {[
                     { label: "要做什麼? (What)", content: currentChapter.explanation.what, color: "bg-blue-50/80 border-blue-100 text-blue-900", icon: <HelpCircle className="w-4 h-4 text-blue-500" /> },
                     { label: "為何重要? (Why)", content: currentChapter.explanation.why, color: "bg-amber-50/80 border-amber-100 text-amber-900", icon: <Target className="w-4 h-4 text-amber-500" /> },
                     { label: "如何實踐? (How)", content: currentChapter.explanation.how, color: "bg-emerald-50/80 border-emerald-100 text-emerald-900", icon: <Zap className="w-4 h-4 text-emerald-500" /> }
                   ].map((box, i) => (
                     <div key={i} className={\`p-5 rounded-2xl border backdrop-blur-sm transition-all hover:shadow-md \${box.color}\`}>
                        <h4 className="font-black text-xs mb-2 flex items-center gap-2 uppercase tracking-wider">
                           {box.icon}
                           {box.label}
                        </h4>
                        <p className="text-xs leading-relaxed font-medium opacity-80">{box.content}</p>
                     </div>
                   ))}
                </div>

                {/* 策略核心區 (Strategy Hub) */}
                <div className="bg-slate-900 text-white rounded-[32px] p-8 relative overflow-hidden group shadow-2xl">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#009E9D]/40 to-[#219EBC]/10 blur-[120px] pointer-events-none group-hover:scale-110 transition-transform duration-700" />
                   <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-4">
                         <div>
                            <h4 className="text-2xl font-black flex items-center gap-3 tracking-tight">
                               <Trophy className="w-6 h-6 text-amber-400" />
                               {currentChapter.strategies.title}
                            </h4>
                            <p className="text-slate-400 text-xs mt-2 font-medium tracking-wide">GRI / SASB 實踐核心指導準則 (Core Guidelines)</p>
                         </div>
                         <Button 
                          variant="solid" 
                          className="bg-white text-slate-900 hover:bg-slate-100 px-6 h-12 text-sm font-black rounded-2xl shadow-xl hover:scale-105 transition-all"
                          onClick={handleAIGenerate}
                          disabled={isGenerating}
                         >
                           {isGenerating ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Sparkles className="w-5 h-5 mr-3 text-[#009E9D]" />}
                           AI 專業寫作 (AI Write)
                         </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         {currentChapter.strategies.points.map((p, i) => (
                           <div key={i} className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl hover:bg-white/15 transition-all">
                              <span className="text-[#009E9D] text-[10px] font-black block mb-2 uppercase tracking-widest">準則 {i + 1}</span>
                              <h5 className="font-black text-base mb-2">{p.label}</h5>
                              <p className="text-xs text-slate-300 leading-relaxed font-medium">{p.desc}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* 工作畫布區 (Canvas & Visuals) */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-800 text-lg flex items-center gap-3">
                      <Layout className="w-5 h-5 text-[#219EBC]" />
                      報告智庫畫布 (Intelligence Canvas)
                    </h4>
                    <div className="flex gap-3">
                       <Button 
                        variant="outline" 
                        className="h-9 px-4 text-xs font-black rounded-xl hover:bg-[#219EBC]/5"
                        onClick={handleGenerateVisuals}
                        disabled={isGeneratingVisuals}
                       >
                         <BarChart3 className="w-4 h-4 mr-2 text-[#219EBC]" />
                         生成視覺 (Visuals)
                       </Button>
                       <Button 
                        variant="outline" 
                        className={\`h-9 px-4 text-xs font-black rounded-xl \${isEditingTemplate ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' : 'hover:bg-slate-50'}\`}
                        onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                       >
                         <Settings className="w-4 h-4 mr-2" />
                         {isEditingTemplate ? '退出編輯 (Exit)' : '調整模板 (Edit)'}
                       </Button>
                    </div>
                  </div>

                  <div className="min-h-[400px] bg-white/40 rounded-3xl border-2 border-slate-200 border-dashed p-6 md:p-8 transition-all hover:bg-white/50">
                    {layoutBlocks.length > 0 || isGeneratingVisuals ? (
                      <div className="space-y-6">
                        {isGeneratingVisuals && (
                          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#219EBC]" />
                            <p className="text-sm font-black bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100">正在萃取數據並生成視覺面板 (Generating...)</p>
                          </div>
                        )}
                        {layoutBlocks.map(block => (
                          <VisualizationBlock 
                            key={block.id} 
                            block={block} 
                            onDelete={() => setLayoutBlocks(prev => prev.filter(b => b.id !== block.id))} 
                          />
                        ))}
                      </div>
                    ) : isEditingTemplate ? (
                      <textarea 
                        className="w-full bg-white/80 p-8 rounded-2xl border-2 border-[#009E9D]/30 font-mono text-sm focus:outline-none focus:ring-4 focus:ring-[#009E9D]/10 min-h-[500px] resize-y shadow-inner leading-relaxed text-slate-700"
                        value={editedTemplate}
                        onChange={(e) => setEditedTemplate(e.target.value)}
                        placeholder="在此自定義報告模板..."
                      />
                    ) : (
                      <div className="bg-white/80 p-8 rounded-2xl border border-slate-200 whitespace-pre-wrap font-mono text-sm min-h-[500px] shadow-sm leading-relaxed text-slate-700 text-lg">
                        {editedTemplate}
                      </div>
                    )}
                  </div>

                  {/* 分析控制台 (Analysis Console Overlay) */}
                  <AnimatePresence>
                    {analysisResult && (
                      <motion.div 
                        initial={{ y: 40, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 40, opacity: 0, scale: 0.95 }}
                        className={\`p-8 rounded-[32px] border-2 shadow-2xl relative z-20 \${
                          analysisResult.type === 'cross-chapter' 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900' 
                            : analysisResult.type === 'compliance'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-blue-50 border-blue-200 text-blue-900'
                        }\`}
                      >
                        <div className="flex justify-between items-start mb-5">
                          <h4 className="text-xl font-black flex items-center gap-3">
                            {analysisResult.type === 'cross-chapter' ? <RefreshCw className="w-6 h-6 text-indigo-600" /> : analysisResult.type === 'compliance' ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <Target className="w-6 h-6 text-blue-600" />}
                            {analysisResult.type === 'cross-chapter' ? '跨章節一致性查核報告' : analysisResult.type === 'compliance' ? '合規性查核報告' : '實踐差距分析報告'}
                          </h4>
                          <button onClick={() => setAnalysisResult(null)} className="p-2 hover:bg-black/5 rounded-full transition-all text-slate-400 hover:text-slate-600">
                             <X className="w-6 h-6" />
                          </button>
                        </div>
                        <div className="text-base leading-relaxed whitespace-pre-wrap bg-white/60 backdrop-blur-sm p-6 rounded-2xl shadow-inner font-medium border border-white/50">
                          {analysisResult.content}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </ScrollArea>

            {/* 底部工具欄 (Footer Toolbar) */}
            <div className="p-5 border-t border-slate-100 bg-white/90 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-4 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] uppercase">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCrossChapterAnalysis}
                  disabled={isAnalyzingCrossChapter}
                  className="text-[10px] h-9 px-4 font-black text-indigo-800 border-indigo-200 hover:bg-indigo-50 rounded-xl"
                >
                  {isAnalyzingCrossChapter ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  一致性查核 (Consistency)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleComplianceCheck}
                  disabled={isCheckingCompliance}
                  className="text-[10px] h-9 px-4 font-black text-emerald-800 border-emerald-200 hover:bg-emerald-50 rounded-xl"
                >
                  {isCheckingCompliance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  規範查核 (Compliance)
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleGapAnalysis}
                  disabled={isAnalyzingGap}
                  className="text-[10px] h-9 px-4 font-black text-blue-800 border-blue-200 hover:bg-blue-50 rounded-xl"
                >
                  {isAnalyzingGap ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
                  差距分析 (Gap Analysis)
                </Button>
              </div>
              
              <div className="flex gap-4">
                 <Button variant="outline" className="px-6 h-11 text-xs font-black border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl transition-all">
                    <Download className="w-4 h-4 mr-2" /> PDF 導出
                 </Button>
                 <Button variant="solid" className="px-10 h-11 text-xs font-black bg-slate-900 border-slate-900 hover:bg-black rounded-xl shadow-xl shadow-black/10 transition-all text-white">
                    完成本章 (Complete Section)
                    <ArrowRight className="w-4 h-4 ml-3" />
                 </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        /* 終始矩陣視圖 (Beginning-to-End Matrix View) */
        <div className="space-y-8">
          <GlassCard className="p-10 border-none shadow-2xl bg-gradient-to-br from-[#219EBC]/10 to-white/30 backdrop-blur-xl rounded-[40px]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                  終始矩陣與雙向同步 (Beginning-to-End Matrix & Sync)
                </h2>
                <p className="text-slate-500 mt-4 text-sm sm:text-base leading-relaxed font-medium">
                  管理跨部門提交的 ESG 關鍵數據。所有文件皆符合 GRI/TCFD 查證體系。 (Cross-dept Verification Protocol)
                </p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="bg-white/90 p-4 rounded-3xl border border-slate-100 flex items-center gap-8 shadow-sm">
                    <div className="text-center px-6 border-r border-slate-100">
                       <span className="block text-3xl font-black text-emerald-600">02</span>
                       <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">已取得 (Verified)</span>
                    </div>
                    <div className="text-center px-6">
                       <span className="block text-3xl font-black text-amber-500">01</span>
                       <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">待查證 (Pending)</span>
                    </div>
                 </div>
                 <Button variant="solid" className="h-16 w-16 rounded-3xl bg-slate-900 p-0 shadow-2xl hover:scale-105 transition-all text-white">
                    <Plus className="w-8 h-8" />
                 </Button>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VOUCHERS.map((v) => (
              <GlassCard
                key={v.id}
                className="p-8 flex flex-col h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 group bg-white/40 rounded-[32px] hover:-translate-y-2"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-col gap-2">
                    {v.status === "collected" ? (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-tight">已取得 (Verified)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 shadow-sm">
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-tight">查證中 (In Review)</span>
                      </div>
                    )}
                    <Badge variant="outline" className={\`text-[9px] uppercase tracking-tighter w-fit px-2 \${v.syncStatus === 'synced' ? 'text-blue-500 border-blue-200' : 'text-amber-500 border-amber-200'}\`}>
                      {v.syncStatus === 'synced' ? '雙向TS: 已同步 (Synced)' : '雙向TS: 同步中 (Syncing...)'}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 bg-white/80 px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                    {v.source}
                  </span>
                </div>

                <div className="mb-8 flex-1">
                  <h3 className="font-black text-slate-800 text-xl leading-tight mb-3 group-hover:text-[#009E9D] transition-colors">{v.name}</h3>
                  <div className="h-12 overflow-hidden">
                     <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed font-medium">{v.desc}</p>
                  </div>
                </div>

                <div className="bg-slate-50/80 backdrop-blur-sm rounded-2xl p-5 mb-8 border border-slate-100 min-h-[100px] flex flex-col justify-center shadow-inner">
                  {v.response ? (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-[#009E9D] text-white flex items-center justify-center text-xs font-black shadow-lg shadow-[#009E9D]/20 shrink-0">{v.source.charAt(0)}</div>
                      <span className="text-xs text-slate-600 leading-relaxed font-black italic">"{v.response}"</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 opacity-30">
                       <MessageSquare className="w-6 h-6 text-slate-400" />
                       <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">等待相關部門回應 (Waiting)</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-auto">
                  {v.status === "pending" && (
                    <Button
                      variant="outline"
                      className={\`flex-1 h-12 text-xs font-black rounded-2xl transition-all \${remindedVouchers.includes(v.id) ? "opacity-50 cursor-not-allowed bg-slate-100 border-transparent shadow-none" : "text-amber-700 border-amber-200 hover:bg-amber-50 hover:shadow-md"}\`}
                      onClick={() => handleRemind(v.id, v.source)}
                      disabled={remindedVouchers.includes(v.id)}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      {remindedVouchers.includes(v.id) ? "已提醒" : "件提醒 (Remind)"}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-xs font-black rounded-2xl text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:shadow-md transition-all"
                    onClick={() => setActiveChat(v.id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    矩陣對話 (Matrix Chat)
                  </Button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* 矩陣流轉抽屜 (Matrix Workflow Drawer) */}
      <AnimatePresence>
        {isCollabMode && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-80 md:w-[420px] bg-white/90 backdrop-blur-2xl shadow-[-20px_0_60px_rgba(0,0,0,0.15)] z-[100] flex flex-col border-l border-white/50"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-indigo-100/30">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
                    <Users className="w-6 h-6 text-white" />
                 </div>
                 <div>
                    <h3 className="font-black text-slate-800 text-lg">矩陣流轉區 (Matrix Workflow)</h3>
                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-0.5">3 名成員在場 (3 Members Online)</p>
                 </div>
              </div>
              <button onClick={() => setIsCollabMode(false)} className="p-3 hover:bg-rose-100 hover:text-rose-600 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <ScrollArea className="flex-1 p-8">
              <div className="space-y-8">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-4 group">
                    <div className={\`w-12 h-12 rounded-[20px] flex-shrink-0 flex items-center justify-center text-white text-sm font-black shadow-2xl transition-transform group-hover:scale-110 \${comment.avatarColor}\`}>
                      {comment.user.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-black text-sm text-slate-800">{comment.user}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{comment.time}</span>
                      </div>
                      <div className="bg-white p-5 rounded-3xl rounded-tl-none border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium shadow-sm group-hover:shadow-md transition-all">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-8 border-t border-slate-50 bg-white/80 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
              <div className="flex gap-3 p-2 bg-slate-50 rounded-[28px] border-2 border-slate-100 focus-within:border-indigo-500/30 focus-within:ring-8 focus-within:ring-indigo-500/5 transition-all">
                <textarea 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="標記 @成員 或在此輸入對話..."
                  className="flex-1 bg-transparent border-none rounded-2xl p-4 text-xs resize-none focus:ring-0 outline-none h-24 placeholder:font-black placeholder:opacity-40"
                />
                <Button 
                  variant="solid" 
                  className="self-end mb-2 mr-2 w-12 h-12 rounded-2xl bg-indigo-600 p-0 shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all text-white"
                  onClick={handleAddComment}
                >
                  <Send className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 萬能筆記抽屜 (Omni-Note Drawer) */}
      <AnimatePresence>
        {isNoteOpen && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-80 md:w-[400px] bg-white/95 backdrop-blur-2xl shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[90] flex flex-col border-l border-amber-100/50"
          >
            <div className="p-8 border-b border-amber-50 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-transparent">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500 rounded-2xl shadow-xl shadow-amber-200">
                     <StickyNote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                     <h3 className="font-black text-slate-800 text-lg">萬能筆記 (Omni-Note)</h3>
                     <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">跨模組即時靈感 (Unified Notes)</p>
                  </div>
               </div>
               <button onClick={() => setIsNoteOpen(false)} className="p-3 hover:bg-amber-100 hover:text-amber-600 rounded-2xl transition-all">
                  <X className="w-6 h-6" />
               </button>
            </div>
            <ScrollArea className="flex-1 p-8 bg-amber-50/20">
               <div className="space-y-6">
                 {/* Sample Notes */}
                 <div className="bg-white p-5 rounded-3xl border border-amber-200 shadow-sm hover:shadow-md transition-all border-l-[6px] border-l-amber-500">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">無作筆記 (Implicit)</span>
                       <span className="text-[9px] text-slate-400 font-bold">10 分鐘前</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">系統偵測到您在「供給側」與「碳足跡盤查」中切換頻繁，建議兩者數據進行交叉驗證。</p>
                 </div>
                 
                 <div className="bg-white/80 p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all border-l-[6px] border-l-emerald-500">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">悟作筆記 (Insight)</span>
                       <span className="text-[9px] text-slate-400 font-bold">剛剛 (Just now)</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">重大性議題的權重配置對於 TCFD 報告的風險評估至關重要。</p>
                 </div>

                 <div className="text-center py-10 opacity-30">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-amber-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest">靈感持續同步中...</p>
                 </div>
               </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
`;

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Reconstruction complete!');
