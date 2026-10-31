"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GoogleGenAI } from "@google/genai";
import {
  BookOpen,
  ListChecks,
  Sparkles,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Check,
  Bell,
  FileText,
  Send,
  Loader2,
  Users,
  MessageSquare,
  Edit3,
  RefreshCw,
  Target,
  Lightbulb,
  Wand2,
  LayoutTemplate,
  Palette,
  GripHorizontal,
  Download,
  StickyNote,
  MessageCircle,
  X,
  UserPlus,
  Printer,
  Clock,
  BrainCircuit,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ESGSwarmHUD } from "@/components/ui/esg-swarm-hud";
import { FullReportAuditPreview } from "@/components/ui/full-report-preview";

const CHAPTERS = [
  {
    id: "ch1",
    title: "1 關於本報告書",
    sub: [
      "1.01 經營者的話",
      "1.02 關於本公司",
      "1.03.2 報告涵蓋期間、頻率",
      "1.03.3 報告邊界與範疇",
      "1.03.4 資訊重編",
      "1.03.5 外部確信/保證情形",
      "1.03.6 永續報告之責任單位",
    ],
  },
  {
    id: "ch2",
    title: "2 永續經營",
    sub: [
      "2.01 永續發展策略",
      "2.02.1 推動永續發展之治理架構",
      "2.02.2 運作情形",
      "2.03.1.1 永續管理之角色及督導情形",
      "2.03.1.2 督導永續管理之績效評估",
      "2.03.1.3 對永續發展之持續進修",
      "2.03.2.1 成員及多元化",
      "2.03.2.3 提名與遴選",
      "2.03.2.4 利益迴避",
      "2.03.2.5 薪酬政策",
      "2.03.3 功能性委員會結構及運作情形",
    ],
  },
  {
    id: "ch3",
    title: "3 利害關係人與重大議題",
    sub: [
      "3.01 利害關係人議合",
      "3.02 決定重大主題的流程",
      "3.03 重大主題列表",
      "3.04 重大議題之管理",
    ],
  },
  {
    id: "ch4",
    title: "4 治理面",
    sub: [
      "4.01 經濟績效",
      "4.02 稅務",
      "4.03.1 誠信經營理念、政策、行為規範",
      "4.03.2 反貪腐機制",
      "4.03.3 反競爭行為",
      "4.04 溝通管道及申訴機制",
      "4.05.2 法規遵循",
      "4.06.2 客戶隱私保護",
      "4.07 參與各類社團組織",
      "4.08.1 顧客健康與安全",
      "4.08.2 行銷與標示",
      "4.09 供應商管理",
    ],
  },
  {
    id: "ch5",
    title: "5 社會面",
    sub: [
      "5.01.1 人權政策與承諾",
      "5.01.2.1 員工結構",
      "5.01.2.2 非員工結構",
      "5.01.3 員工多元包容及平等",
      "5.01.4 員工權益及福利",
      "5.01.5 團體協約",
      "5.01.6 人才培育與發展",
      "5.02.1 職業安全及衛生政策",
      "5.02.2 職業傷害",
      "5.03.1 對基礎設施的投資與支援服務",
      "5.03.2 當地社區",
    ],
  },
  {
    id: "ch6",
    title: "6 環境面",
    sub: [
      "6.01 氣候變遷",
      "6.02.1 溫室氣體管理之策略、方法、目標",
      "6.02.2 溫室氣體排放量",
      "6.03.2 能源使用情況",
      "6.04.1 水資源管理或減量目標",
      "6.04.2 用水情況",
      "6.05.1 廢棄物管理或減量目標",
      "6.05.2 廢棄物產生情況",
    ],
  },
  {
    id: "ch7",
    title: "7 附錄",
    sub: [
      "7.01 GRI 內容索引表",
      "7.02 氣候相關資訊",
      "7.03 產業別永續指標資訊",
      "7.04 其他準則內容索引表",
      "7.05 確信機構意見書",
    ],
  },
];

const VOUCHERS = [
  {
    id: "v1",
    name: "合併財務報表",
    desc: "經會計師簽證之年度合併財務報告",
    source: "財務部",
    status: "pending",
    response: "預計下週三前提供最終版。",
  },
  {
    id: "v2",
    name: "ISO 14064-1 查證聲明書",
    desc: "溫室氣體盤查第三方查證聲明書",
    source: "環安衛部門",
    status: "collected",
    response: "已上傳至系統。",
  },
  {
    id: "v3",
    name: "ISO 45001 證書",
    desc: "職業安全衛生管理系統證書",
    source: "環安衛部門",
    status: "collected",
    response: "已上傳至系統。",
  },
  {
    id: "v4",
    name: "員工教育訓練紀錄",
    desc: "年度各職級員工內外部受訓時數統計表",
    source: "人資部",
    status: "pending",
    response: "正在彙整各部門資料，需再兩天。",
  },
  {
    id: "v5",
    name: "水電費帳單/申報單",
    desc: "全年度各廠區水費、電費帳單及廢棄物申報單",
    source: "廠務部",
    status: "pending",
    response: "",
  },
  {
    id: "v6",
    name: "供應商評鑑紀錄",
    desc: "年度供應商永續/環安衛稽核評鑑表",
    source: "採購部",
    status: "pending",
    response: "",
  },
  {
    id: "v7",
    name: "董事會開會紀錄",
    desc: "年度董事會及功能性委員會開會次數與出席率",
    source: "董事會祕書室",
    status: "collected",
    response: "已提供 PDF 掃描檔。",
  },
];

type ChapterData = {
  template: string;
  examples: { title: string; content: string }[];
  requiredVouchers?: string[];
  explanation?: {
    purpose: string;
    why: string;
  };
  strategies?: {
    options: { name: string; pros: string; cons: string; caseStudy: string }[];
    top3Choice: string;
  };
  contextReminder?: string;
};

const CHAPTER_CONTENT: Record<string, ChapterData> = {
  "1.01 經營者的話": {
    template:
      "【ABC科技】成立至今已邁入第【20】年。當今全球面臨著多重挑戰，包括氣候變遷帶來的環境壓力、以及供應鏈和貿易的不確定性。我們深知企業的社會責任，因此在【2024】年，我們正式設立了【減碳30%】的目標，並承諾在【2050】年達到淨零排放。\n\n我們將持續加強環境、社會、治理（ESG）行動，推動綠色和平等的未來。感謝所有利害關係人的支持，讓我們攜手共創美好明天。\n\n董事長 【請填寫董事長姓名】 敬上",
    examples: [
      {
        title: "版本一 (穩健專業風)",
        content:
          "當今全球面臨著多重挑戰，包括新冠疫情對全球經濟和社會造成的衝擊、地緣政治的不穩定、氣候變遷帶來的環境壓力、以及供應鏈和貿易的不確定性。這些挑戰顯示出我們所處時代的複雜性，需要全球共同努力應對，加強環境、社會、治理（ESG）行動，推動綠色和平等的未來。",
      },
      {
        title: "版本二 (創新前瞻風)",
        content:
          "在科技快速迭代的今天，我們不僅是技術的推動者，更是永續未來的守護者。面對氣候變遷的嚴峻考驗，我們將創新DNA注入ESG策略，透過AI與大數據優化能源效率，致力於打造零碳供應鏈，引領產業邁向綠色新紀元。",
      },
      {
        title: "版本三 (溫暖人文風)",
        content:
          "企業的價值，在於為社會帶來多少正向的改變。過去一年，我們走過風雨，更深刻體會到「共好」的重要。我們將持續傾聽員工、社區與環境的聲音，以具體行動落實社會關懷，讓永續不只是口號，而是我們每天實踐的日常。",
      },
    ],
    explanation: {
      purpose:
        "向利害關係人傳達企業最高階層對永續發展的承諾與願景，總結過去一年的重大成就，並展望未來的永續目標。",
      why: "經營者的話是整份報告書的靈魂，能展現企業由上而下推動 ESG 的決心，建立投資人與社會大眾的信任。",
    },
    strategies: {
      options: [
        {
          name: "穩健保守型",
          pros: "風險低，聚焦已達成之績效",
          cons: "缺乏前瞻性與突破感",
          caseStudy: "台積電：強調穩健成長與綠色製造承諾",
        },
        {
          name: "積極創新型",
          pros: "展現企圖心，吸引ESG投資人",
          cons: "若未達成目標易受質疑",
          caseStudy: "台達電：主打科技創新與淨零碳排目標",
        },
        {
          name: "溫暖人文型",
          pros: "容易引起社會共鳴，提升品牌形象",
          cons: "可能被認為缺乏具體數據支撐",
          caseStudy: "星巴克：強調社區共好與夥伴關係",
        },
      ],
      top3Choice:
        "目前同業前三名（如台達電、光寶科）多選擇「積極創新型」，結合具體減碳目標與科技應用，展現產業領導地位。",
    },
    contextReminder:
      "系統偵測到您在先前的「公司簡介」中提到了『AI 驅動綠色轉型』，建議您在此處的經營者願景中，進一步呼應 AI 技術如何協助達成減碳目標，以保持報告書前後邏輯一致。",
  },
  "1.02 關於本公司": {
    template:
      "1.公司簡介\n【ABC科技】成立於【2004】年，從事【電子零組件】之研發與製造；提供【智能自動化】服務項目，總部位於【台灣台北市】。我們以技術創新和卓越品質為核心，致力於為全球客戶提供優質產品和服務。\n\n2.價值鏈簡介\n我們的價值鏈涵蓋上游的【晶片、機構件】供應商（約【120】家），以及下游的【品牌系統廠】客戶。2024年，我們的價值鏈產生了以下重大變化：【請說明變化，例如：新增了20家在地供應商以降低碳足跡】。",
    examples: [
      {
        title: "版本一 (標準產業風)",
        content:
          "ABC公司成立於1995年，專注於電子產品研發與製造，提供智能設備、自動化系統及相關軟體服務。總部位於臺灣台北市，公司以技術創新和卓越品質為核心...",
      },
      {
        title: "版本二 (全球佈局風)",
        content:
          "作為全球領先的科技解決方案提供商，我們在全球設有15個研發中心與製造基地。我們的價值鏈緊密連結全球超過500家頂尖供應商，共同為世界500強企業提供最具競爭力的綠色產品...",
      },
      {
        title: "版本三 (在地深耕風)",
        content:
          "深耕台灣二十載，我們始終堅持在地採購與製造。透過與在地供應鏈的緊密合作，我們不僅帶動了地方經濟發展，更有效縮短了物流距離，大幅降低了產品碳足跡...",
      },
    ],
    explanation: {
      purpose: "清晰描述企業的營運範疇、主要產品/服務、所在市場及價值鏈結構。",
      why: "讓利害關係人了解企業的營運脈絡，作為後續評估重大性議題與 ESG 影響力的基礎。",
    },
    strategies: {
      options: [
        {
          name: "全球佈局型",
          pros: "展現跨國影響力與規模",
          cons: "需說明各地區的合規挑戰",
          caseStudy: "鴻海：強調全球供應鏈的韌性與管理",
        },
        {
          name: "在地深耕型",
          pros: "突顯對當地經濟與社會的貢獻",
          cons: "可能被認為缺乏國際視野",
          caseStudy: "中華電信：強調在地服務與數位平權",
        },
      ],
      top3Choice:
        "同業前三名多採用「全球佈局型」結合「在地深耕」的混合策略，強調『Global Reach, Local Touch』。",
    },
    contextReminder:
      "您在「經營者的話」中提到了『減碳30%』的目標，建議在此處的價值鏈簡介中，補充說明上下游供應商在減碳計畫中的角色。",
  },
  "1.03 報告書資訊": {
    template:
      "本報吿書依永續性報告倡議組織（Global Reporting Initiative, GRI）所發布之2021版GRI準則（GRI Standards）撰寫，並採用永續會計準則委員會（SASB）準則進行揭露。\n\n報導期間為【2024】年1月1日至【2024】年12月31日。本報告書【已】經獨立第三方【勤業眾信聯合會計師事務所】進行有限確信。",
    examples: [
      {
        title: "版本一 (GRI & SASB雙準則)",
        content:
          "本報告依全球永續性報告倡議組織（Global Reporting Initiative, GRI）發布的2021版GRI 永續報告準則（GRI Sustainability Reporting Standards, GRI Standards）；並採用永續會計準則委員會（SASB）準則進行揭露。",
      },
      {
        title: "版本二 (TCFD強化版)",
        content:
          "本報告書除依循GRI準則外，更特別導入氣候相關財務揭露（TCFD）框架，深入分析氣候變遷對本公司帶來的風險與機會，並詳述我們的因應策略與財務影響評估。",
      },
      {
        title: "版本三 (精簡確信版)",
        content:
          "本報告書為本公司發行之第5本永續報告書，內容涵蓋環境、社會與治理三大面向之績效。所有數據皆經過BSI英國標準協會依據AA1000AS v3標準進行Type 1中度保證。",
      },
    ],
    requiredVouchers: ["合併財務報表"],
    explanation: {
      purpose: "說明報告書的編製原則、涵蓋範圍、報導期間及確信資訊。",
      why: "確保資訊透明度與可信度，符合國際準則要求，讓讀者了解報告的邊界與數據可靠性。",
    },
    strategies: {
      options: [
        {
          name: "雙準則型",
          pros: "涵蓋面廣，符合多數投資人基本要求",
          cons: "需對應多套指標，編製成本較高",
          caseStudy: "聯發科：同時採用 GRI 與 SASB 準則",
        },
        {
          name: "TCFD強化型",
          pros: "突顯對氣候風險的重視，吸引綠色資金",
          cons: "需具備較強的氣候風險量化能力",
          caseStudy: "台達電：深度整合 TCFD 框架",
        },
        {
          name: "精簡確信型",
          pros: "聚焦核心數據，提升報告可信度",
          cons: "可能忽略非財務面的質性描述",
          caseStudy: "中鋼：強調第三方高度保證",
        },
      ],
      top3Choice:
        "同業前三名多採用「雙準則型」結合「TCFD強化」，以全面回應國際投資機構（如貝萊德）的期待。",
    },
    contextReminder:
      "您在「關於本公司」提到了全球佈局，建議在此處說明報告邊界是否涵蓋海外子公司，以避免範疇不一致的疑慮。",
  },
  "2.01 永續發展策略": {
    template:
      "本公司永續發展主要策略為：\n• 環境保護：著重於減少碳排放、使用再生能源、推動循環經濟。我們已設定【2030】年達成【RE100】的目標。\n• 技術創新：強調實現永續發展的技術創新，投入【15%】營收於綠色研發。\n• 企業治理：強化內稽內控制度的建立，連續【3】年獲得公司治理評鑑前【5%】。\n• 社會責任：提升員工照顧、社會關懷的重視，每年投入【請填寫金額】於社區發展。",
    examples: [
      {
        title: "版本一 (四大支柱)",
        content:
          "本公司永續發展主要策略為：\n• 環境保護：著重於減少碳排放、使用再生能源、推動循環經濟等。\n• 技術創新：強調實現永續發展的技術創新。\n• 企業治理：強化內稽內控制度的建立。\n• 社會責任：提升員工照顧、社會關懷的重視。",
      },
      {
        title: "版本二 (SDGs導向)",
        content:
          "我們將聯合國永續發展目標(SDGs)深度融入企業核心策略，聚焦於SDG 7(可負擔的潔淨能源)、SDG 9(工業、創新與基礎建設)及SDG 12(責任消費與生產)，透過具體行動方案，積極回應全球永續挑戰。",
      },
      {
        title: "版本三 (雙軸轉型)",
        content:
          "面對未來挑戰，我們啟動「數位與綠色」雙軸轉型策略。透過數位化工具提升營運效率，同時加速綠色能源佈局與低碳產品開發，建構具備高度韌性的永續企業體質。",
      },
    ],
    explanation: {
      purpose: "闡述企業推動永續發展的核心策略、短中長期目標及資源投入方向。",
      why: "讓利害關係人了解企業 ESG 發展藍圖，證明永續並非口號，而是與營運策略深度結合。",
    },
    strategies: {
      options: [
        {
          name: "四大支柱型",
          pros: "架構清晰，易於對應 ESG 各面向",
          cons: "較為傳統，缺乏獨特亮點",
          caseStudy: "富邦金控：以四大策略主軸貫穿報告",
        },
        {
          name: "SDGs導向型",
          pros: "接軌國際語言，易獲外資認同",
          cons: "若無實質作為易被批評為 SDG-washing",
          caseStudy: "台泥：將 SDGs 融入各項事業發展",
        },
        {
          name: "雙軸轉型型",
          pros: "結合數位與綠色，展現未來競爭力",
          cons: "需有強大的數位基礎建設支撐",
          caseStudy: "研華：主打物聯網與綠能雙軸策略",
        },
      ],
      top3Choice:
        "同業前三名多採用「雙軸轉型型」，強調科技賦能永續，將 ESG 轉化為企業的競爭優勢。",
    },
    contextReminder:
      "呼應「經營者的話」中的減碳承諾，建議在此具體列出減碳路徑與階段性目標，並說明預計投入的資源。",
  },
  "2.02 推動永續發展機制": {
    template:
      "為實踐ESG願景與使命，本公司成立【永續發展委員會】，做為公司內部的永續發展最高治理單位。該委員會由【董事長】擔任主任委員，並包含【3】名獨立董事。\n\n委員會轄下設立【環境永續】、【社會共融】及【公司治理】三個執行小組，每【季】定期向董事會報告執行成果。2024年共召開【4】次會議，出席率達【100%】。",
    examples: [
      {
        title: "版本一 (標準架構)",
        content:
          "ABC公司成立永續發展委員會，做為公司內部最高階的永續發展專責單位，永續發展委員會由2名董事及2名獨立董事組成...",
      },
      {
        title: "版本二 (高階督導)",
        content:
          "本公司將永續治理層級提升至董事會層級，由董事長親自領軍成立「永續發展暨氣候變遷因應委員會」，不僅負責整體策略制定，更直接督導各事業群的減碳進度與ESG績效表現。",
      },
      {
        title: "版本三 (跨部門協作)",
        content:
          "為確保永續策略落實於日常營運，我們建立跨部門的「永續推動小組」，由各部門最高主管擔任委員。透過每月的例行會議，打破部門穀倉，協同解決推動過程中的各項挑戰。",
      },
    ],
    requiredVouchers: ["董事會開會紀錄"],
    explanation: {
      purpose: "說明企業內部推動 ESG 的組織架構、運作機制與董事會參與程度。",
      why: "展現企業由上而下的治理決心，確保永續策略能有效落實，並符合主管機關對董事會督導責任的要求。",
    },
    strategies: {
      options: [
        {
          name: "標準架構型",
          pros: "符合法規基本要求，建置成本低",
          cons: "可能流於形式，缺乏實質影響力",
          caseStudy: "多數中小型上市櫃公司",
        },
        {
          name: "高階督導型",
          pros: "展現最高層級決心，資源調度快",
          cons: "過度依賴高層，基層參與度可能不足",
          caseStudy: "國泰金控：董事會層級的永續委員會",
        },
        {
          name: "跨部門協作型",
          pros: "有利於 ESG 融入日常營運",
          cons: "溝通成本高，需有強勢的專責單位協調",
          caseStudy: "宏碁：設立跨部門永續辦公室",
        },
      ],
      top3Choice:
        "同業前三名多採用「高階督導型」結合「跨部門協作」，確保策略高度與執行深度的統一。",
    },
    contextReminder:
      "建議說明永續發展委員會如何追蹤前述「永續發展策略」的執行進度，並將績效與高階主管薪酬連結。",
  },
  "2.03 董事會及功能性委員會": {
    template:
      "本公司董事會為最高治理機構，負責指導公司策略、監督管理階層，並對公司及股東負責。目前董事會由【7】席董事組成，包含【3】席獨立董事，具備多元專業背景。\n\n董事會轄下設有【審計委員會】、【薪資報酬委員會】及【永續發展委員會】，協助董事會履行監督職責。2024年度董事會共召開【6】次會議，平均出席率達【95%】。",
    examples: [
      {
        title: "版本一 (標準治理)",
        content:
          "本公司董事會為最高治理機構，負責指導公司策略、監督管理階層。目前董事會由7席董事組成，包含3席獨立董事。董事會轄下設有審計委員會、薪資報酬委員會及永續發展委員會。",
      },
      {
        title: "版本二 (強調多元性)",
        content:
          "我們深信多元化的董事會能帶來更全面的決策視角。本屆董事會成員具備產業、財務、法律及永續等多元專業背景，且女性董事比例達 28%，充分展現我們對董事會多元化的重視。",
      },
      {
        title: "版本三 (績效導向)",
        content:
          "為確保董事會運作效能，我們每年定期執行董事會績效評估，並將評估結果作為提名及薪酬分配之參考。2024年，我們更委託外部獨立機構進行效能評估，以客觀檢視治理成效。",
      },
    ],
    requiredVouchers: ["董事會開會紀錄", "董事會績效評估報告"],
    explanation: {
      purpose: "揭露董事會的組成、運作情形及轄下功能性委員會的職責。",
      why: "良好的董事會治理是企業永續發展的基石，透明的揭露有助於提升投資人信心。",
    },
    strategies: {
      options: [
        {
          name: "標準治理型",
          pros: "符合法規基本要求",
          cons: "缺乏亮點，難以突顯治理優勢",
          caseStudy: "多數上市櫃公司",
        },
        {
          name: "強調多元型",
          pros: "回應國際對董事會多元化的期待",
          cons: "需實際具備多元的董事陣容",
          caseStudy: "台積電：強調董事專業與性別多元",
        },
        {
          name: "績效導向型",
          pros: "展現對治理效能的重視",
          cons: "需投入資源進行外部評估",
          caseStudy: "玉山金控：定期進行外部董事會績效評估",
        },
      ],
      top3Choice:
        "同業前三名多採用「強調多元型」結合「績效導向型」，以展現最高標準的公司治理。",
    },
    contextReminder:
      "您在「推動永續發展機制」中提到了永續發展委員會，建議在此處進一步說明該委員會與董事會的互動與報告機制。",
  },
  "3.01 利害關係人議合": {
    template:
      "本公司深知利害關係人的意見對企業永續發展至關重要。我們依據 AA1000 利害關係人參與標準 (SES)，鑑別出【6】大類主要利害關係人：【員工、客戶、供應商、投資人、政府機關、社區】。\n\n我們透過多元溝通管道（如：【員工大會、客戶滿意度調查、供應商大會、法說會】等），持續與利害關係人進行議合，了解他們對各項永續議題的關注程度，作為擬定永續策略的重要參考。",
    examples: [
      {
        title: "版本一 (標準議合)",
        content:
          "我們依據 AA1000 SES 鑑別出 6 大類主要利害關係人，並透過問卷調查、會議等多元管道與其溝通，了解他們對各項永續議題的關注程度。",
      },
      {
        title: "版本二 (雙向溝通)",
        content:
          "我們將利害關係人視為推動永續的關鍵夥伴。除了定期的問卷調查，我們更主動發起『永續焦點訪談』，與關鍵客戶及供應商進行深度對話，確保我們的永續策略能精準回應他們的期待。",
      },
      {
        title: "版本三 (數位化議合)",
        content:
          "為提升議合效率與廣度，我們建置了『線上利害關係人專區』，提供常態性的意見回饋管道。2024年，我們共收集超過 2,000 份有效問卷，並透過大數據分析，精準掌握利害關係人的關注焦點。",
      },
    ],
    requiredVouchers: ["利害關係人問卷調查結果", "利害關係人溝通紀錄"],
    explanation: {
      purpose: "說明企業如何鑑別利害關係人，以及與他們溝通的管道和頻率。",
      why: "利害關係人議合是決定重大性議題的基礎，展現企業願意傾聽外部聲音並做出回應的態度。",
    },
    strategies: {
      options: [
        {
          name: "標準議合型",
          pros: "符合 GRI 準則基本要求",
          cons: "溝通方式較為單向，缺乏深度",
          caseStudy: "多數企業初期做法",
        },
        {
          name: "雙向溝通型",
          pros: "能獲得更深入的質性回饋",
          cons: "需投入較多時間與人力進行訪談",
          caseStudy: "台達電：舉辦供應商 ESG 深度座談",
        },
        {
          name: "數位化議合型",
          pros: "觸及面廣，數據分析客觀",
          cons: "需建置相關數位平台",
          caseStudy: "中華電信：運用線上平台擴大議合範圍",
        },
      ],
      top3Choice:
        "同業前三名多採用「雙向溝通型」結合「數位化議合型」，以兼顧議合的廣度與深度。",
    },
    contextReminder:
      "您在「關於本公司」提到了價值鏈的變化，建議在此處的議合對象中，特別強調與新加入的供應商或客戶的溝通情形。",
  },
  "6.02 溫室氣體管理": {
    template:
      "本公司依循ISO 14064-1：2018溫室氣體盤查標準計算溫室氣體排放量，2024年盤查結果為範疇一【4,313.06】 tCO2e、範疇二【2,715.82】 tCO2e，排放密集度為【0.517】 tCO2e/百萬元營業額。\n\n本年度排放量較基準年下降【15】%，主要原因為【導入高效率節能設備及增加太陽能自發自用比例】。相關數據業經【第三方查證機構】執行確信。",
    examples: [
      {
        title: "版本一 (標準盤查)",
        content:
          "2024年，ABC公司範疇一的直接溫室氣體排放量為4,313.06公噸CO2e，範疇二的能源間接溫室氣體排放量為2,715.82公噸CO2e。數據皆依循ISO 14064-1標準計算，並已經過外部查驗認證。",
      },
      {
        title: "版本二 (積極減碳)",
        content:
          "我們不僅完成範疇一與範疇二的盤查，更進一步擴大至範疇三的供應鏈碳足跡盤查。透過與上下游夥伴的緊密合作，我們成功將整體價值鏈的碳排放強度降低了12%，展現我們對淨零排放的堅定承諾。",
      },
      {
        title: "版本三 (內部碳定價)",
        content:
          "為加速減碳步伐，本公司於今年正式導入內部碳定價機制(每噸300美元)。透過將碳成本內部化，有效驅動各事業群主動尋求低碳解決方案，並將收取的碳費專款專用於綠色技術研發與再生能源投資。",
      },
    ],
    requiredVouchers: ["ISO 14064-1 查證聲明書"],
    explanation: {
      purpose:
        "揭露企業溫室氣體排放量（範疇一、二、三）及減量績效，並說明盤查方法與邊界。",
      why: "回應全球氣候變遷關注，展現企業碳管理能力，是投資人與供應鏈客戶最看重的量化指標之一。",
    },
    strategies: {
      options: [
        {
          name: "標準盤查型",
          pros: "數據準確，符合法規與查證要求",
          cons: "僅呈現現狀，缺乏未來減量規劃",
          caseStudy: "多數製造業初期做法",
        },
        {
          name: "積極減碳型",
          pros: "展現企圖心，符合 SBTi 等國際倡議",
          cons: "需投入大量資源進行範疇三盤查",
          caseStudy: "華碩：推動供應鏈減碳計畫",
        },
        {
          name: "內部碳定價型",
          pros: "將碳風險內部化，驅動實質減碳",
          cons: "制度設計複雜，可能影響短期獲利",
          caseStudy: "台達電：實施內部碳費制度",
        },
      ],
      top3Choice:
        "同業前三名多採用「積極減碳型」並逐步導入「內部碳定價」，以應對未來的碳稅/碳費挑戰。",
    },
    contextReminder:
      "呼應「永續發展策略」中的減碳目標，檢視目前排放數據是否符合預期減量軌跡，若有落後應說明改善計畫。",
  },
};

const UNIQUE_STRATEGIES: Record<string, any> = {
  "3.02 決定重大主題的流程": {
    options: [
      {
        name: "雙重重大性型",
        pros: "符合歐盟 CSRD 趨勢，涵蓋財務與衝擊",
        cons: "評估過程複雜，需量化財務影響",
        caseStudy: "台達電：導入雙重重大性評估",
      },
      {
        name: "傳統衝擊型",
        pros: "符合 GRI 基礎要求，執行成本較低",
        cons: "缺乏投資人關注的財務視角",
        caseStudy: "多數企業初期做法",
      },
      {
        name: "動態重大性型",
        pros: "能即時回應市場與法規變化",
        cons: "需建立常態性監測機制與數據庫",
        caseStudy: "宏碁：動態調整重大議題矩陣",
      },
    ],
    top3Choice:
      "標竿企業已全面轉向「雙重重大性型」，同時評估財務與環境社會衝擊。",
  },
  "3.03 重大主題列表": {
    options: [
      {
        name: "矩陣視覺型",
        pros: "直觀易懂，快速聚焦核心議題",
        cons: "細節資訊較少，容易過度簡化",
        caseStudy: "台積電：清晰的重大性矩陣",
      },
      {
        name: "價值鏈對應型",
        pros: "清楚呈現議題在價值鏈的衝擊熱點",
        cons: "圖表較為複雜，需詳細盤查",
        caseStudy: "華碩：價值鏈衝擊邊界圖",
      },
      {
        name: "SDGs 連結型",
        pros: "接軌國際目標，提升國際能見度",
        cons: "若無具體行動易流於形式",
        caseStudy: "富邦金控：重大主題關聯 SDGs",
      },
    ],
    top3Choice:
      "多數領先企業採用「矩陣視覺型」搭配「價值鏈對應型」，提供全方位視角。",
  },
  "3.04 重大議題之管理": {
    options: [
      {
        name: "DMA 標準架構型",
        pros: "完全符合 GRI 準則要求",
        cons: "敘述可能較為生硬、制式化",
        caseStudy: "標準合規企業",
      },
      {
        name: "績效導向管理型",
        pros: "強調目標達成率與具體數據",
        cons: "若未達標需有完善的說明機制",
        caseStudy: "台達電：嚴格的績效追蹤",
      },
      {
        name: "跨部門專案管理型",
        pros: "展現企業內部協作與整合能力",
        cons: "需有強而有力的永續委員會推動",
        caseStudy: "研華：跨部門 ESG 專案",
      },
    ],
    top3Choice: "建議採用「績效導向管理型」，以量化數據展現管理成效。",
  },
  "4.01 經濟績效": {
    options: [
      {
        name: "穩健獲利型",
        pros: "給予投資人信心，展現營運韌性",
        cons: "較少著墨於 ESG 帶來的財務效益",
        caseStudy: "傳統製造業",
      },
      {
        name: "綠色投資導向型",
        pros: "強調氣候轉型與綠色研發的投入",
        cons: "初期資本支出較高",
        caseStudy: "台泥：大舉投資綠能與儲能",
      },
      {
        name: "價值分配透明型",
        pros: "清晰呈現創造的經濟價值如何分配",
        cons: "需揭露較多敏感財務資訊",
        caseStudy: "中華電信：詳細的經濟價值分配表",
      },
    ],
    top3Choice:
      "領先企業多採用「綠色投資導向型」，將經濟績效與永續轉型深度結合。",
  },
  "4.02 稅務": {
    options: [
      {
        name: "基礎合規型",
        pros: "滿足法規最低要求，風險低",
        cons: "資訊透明度較低",
        caseStudy: "多數國內企業",
      },
      {
        name: "稅務治理透明型",
        pros: "公開稅務政策與風險管理機制",
        cons: "需建立完善的稅務治理架構",
        caseStudy: "富邦金控：公開稅務治理政策",
      },
      {
        name: "跨國稅務策略型",
        pros: "展現全球營運的稅務合規與貢獻",
        cons: "跨國稅務資訊彙整難度高",
        caseStudy: "鴻海：全球稅務貢獻揭露",
      },
    ],
    top3Choice:
      "大型企業應朝「稅務治理透明型」邁進，以回應國際對稅務透明的期待。",
  },
  "4.03 誠信經營": {
    options: [
      {
        name: "零容忍政策型",
        pros: "立場堅定，嚇阻不當行為",
        cons: "需有嚴格的查核機制配套",
        caseStudy: "台積電：絕對的誠信正直",
      },
      {
        name: "預防與吹哨機制型",
        pros: "建立完善的檢舉管道與保護機制",
        cons: "需確保機制的獨立性與保密性",
        caseStudy: "玉山金控：完善的吹哨者保護",
      },
      {
        name: "企業文化深耕型",
        pros: "透過教育訓練將誠信內化為 DNA",
        cons: "成效難以短期量化",
        caseStudy: "信義房屋：以信義為本的企業文化",
      },
    ],
    top3Choice: "最佳實務為「預防與吹哨機制型」結合「企業文化深耕型」。",
  },
  "4.04 溝通管道及申訴機制": {
    options: [
      {
        name: "多元管道型",
        pros: "提供信箱、專線等多種選擇",
        cons: "管理與追蹤成本較高",
        caseStudy: "多數大型企業",
      },
      {
        name: "匿名保護強化型",
        pros: "提高利害關係人發聲意願",
        cons: "可能增加不實檢舉的處理成本",
        caseStudy: "外商在台子企業",
      },
      {
        name: "數位化申訴平台型",
        pros: "案件追蹤透明，處理效率高",
        cons: "需投入系統建置成本",
        caseStudy: "科技大廠：導入線上申訴追蹤系統",
      },
    ],
    top3Choice: "導入「數位化申訴平台型」能有效提升處理效率與透明度。",
  },
  "4.05 風險管理": {
    options: [
      {
        name: "ERM 整合型",
        pros: "將 ESG 風險納入企業整體風險管理",
        cons: "需跨部門高度整合",
        caseStudy: "國泰金控：全面的 ERM 架構",
      },
      {
        name: "新興風險聚焦型",
        pros: "展現對未來趨勢的敏銳度",
        cons: "風險評估難度較高",
        caseStudy: "NVIDIA：針對供應鏈中斷與地緣政治的新興風險評估",
      },
      {
        name: "營運韌性導向型",
        pros: "強調危機應變與營運持續計畫(BCP)",
        cons: "需定期進行演練與測試",
        caseStudy: "馬士基 (Maersk)：全球航運風險與動態路由管理",
      },
    ],
    top3Choice: "「ERM 整合型」是目前國際評比機構最看重的風險管理模式。",
  },
  "4.06 資訊安全": {
    options: [
      {
        name: "ISO 27001 合規型",
        pros: "具備國際認證背書",
        cons: "僅為基礎門檻",
        caseStudy: "多數上市櫃公司",
      },
      {
        name: "零信任架構型",
        pros: "因應遠距辦公與雲端趨勢的最佳防護",
        cons: "架構轉換成本高",
        caseStudy: "大型科技業",
      },
      {
        name: "資安治理層級提升型",
        pros: "設立資安長(CISO)並向董事會報告",
        cons: "需調整組織架構",
        caseStudy: "金融業：高度重視資安治理",
      },
    ],
    top3Choice: "「資安治理層級提升型」結合「零信任架構」是目前的頂尖趨勢。",
  },
  "4.07 參與各類社團組織": {
    options: [
      {
        name: "產業公協會參與型",
        pros: "掌握產業動態，促進行業交流",
        cons: "影響力侷限於特定產業",
        caseStudy: "傳統製造業",
      },
      {
        name: "國際倡議簽署型",
        pros: "接軌國際，提升全球品牌形象",
        cons: "需承諾具體目標（如 RE100）",
        caseStudy: "台達電、宏碁：積極參與國際倡議",
      },
      {
        name: "政策倡導型",
        pros: "發揮企業影響力，推動法規進步",
        cons: "需具備較高的產業地位與話語權",
        caseStudy: "Apple：推動供應鏈清潔能源計畫 (Clean Energy Program)",
      },
    ],
    top3Choice:
      "領先企業多採取「國際倡議簽署型」，以實際行動響應全球永續目標。",
  },
  "4.08 產品管理": {
    options: [
      {
        name: "綠色產品設計型",
        pros: "從源頭減少環境衝擊",
        cons: "研發成本較高",
        caseStudy: "華碩：導入綠色設計準則",
      },
      {
        name: "產品生命週期(LCA)型",
        pros: "全面量化產品碳足跡",
        cons: "數據收集與計算複雜",
        caseStudy: "光寶科：產品碳足跡盤查",
      },
      {
        name: "循環經濟模式型",
        pros: "創新商業模式，如產品即服務(PaaS)",
        cons: "需顛覆傳統銷售模式",
        caseStudy: "宏碁：推出環保材質筆電與回收計畫",
      },
    ],
    top3Choice:
      "「產品生命週期(LCA)型」結合「循環經濟模式」是展現產品永續力的最佳途徑。",
  },
  "4.09 供應商管理": {
    options: [
      {
        name: "基礎稽核型",
        pros: "確保供應商符合基本行為準則",
        cons: "防弊重於興利",
        caseStudy: "多數企業初期做法",
      },
      {
        name: "供應商輔導培訓型",
        pros: "協助供應商提升 ESG 能力，共創價值",
        cons: "需投入大量人力與資源",
        caseStudy: "Patagonia：與供應商共同開發永續材質",
      },
      {
        name: "永續供應鏈評鑑型",
        pros: "將 ESG 納入採購決策，驅動供應鏈轉型",
        cons: "可能面臨供應商反彈或轉換成本",
        caseStudy: "台達電：嚴格的供應商 ESG 評鑑",
      },
    ],
    top3Choice:
      "標竿企業已從「稽核」轉向「輔導培訓」與「評鑑淘汰」並行的雙軌制。",
  },
  "5.01 人力發展": {
    options: [
      {
        name: "多元共融(DEI)型",
        pros: "吸引多元人才，提升創新力",
        cons: "需克服企業文化與無意識偏見",
        caseStudy: "外商企業、緯創：推動 DEI 倡議",
      },
      {
        name: "關鍵人才培育型",
        pros: "確保企業長期競爭力與接班梯隊",
        cons: "培訓資源集中於少數人",
        caseStudy: "Google：領先的全球人才培訓與發展體系",
      },
      {
        name: "員工福祉導向型",
        pros: "提升員工滿意度與留任率",
        cons: "福利支出較高",
        caseStudy: "聯發科：優渥的薪酬與全方位照顧",
      },
    ],
    top3Choice: "「多元共融(DEI)型」是目前國際投資人最關注的社會面(S)指標。",
  },
  "5.02 職業安全及衛生": {
    options: [
      {
        name: "零職災目標型",
        pros: "展現對員工生命安全的最高承諾",
        cons: "達成難度極高，需嚴格管理",
        caseStudy: "中鋼：工安零容忍",
      },
      {
        name: "智慧工安導入型",
        pros: "運用 AI/IoT 預防潛在風險",
        cons: "需投資軟硬體設備",
        caseStudy: "台塑企業：導入 AI 影像辨識防範工安",
      },
      {
        name: "身心健康促進型",
        pros: "關注員工心理健康與工作生活平衡",
        cons: "成效較難量化評估",
        caseStudy: "康健雜誌獲獎企業：推動 EAP 方案",
      },
    ],
    top3Choice:
      "製造業應優先導入「智慧工安」，服務業則可側重「身心健康促進」。",
  },
  "5.03 社區參與": {
    options: [
      {
        name: "慈善捐款型",
        pros: "執行容易，快速提供資源",
        cons: "缺乏長期影響力與企業連結",
        caseStudy: "傳統企業做法",
      },
      {
        name: "企業志工深耕型",
        pros: "提升員工向心力與在地認同",
        cons: "需投入員工工作時間",
        caseStudy: "富邦金控：龐大的企業志工團隊",
      },
      {
        name: "核心職能回饋型",
        pros: "結合企業專業，創造最大社會效益",
        cons: "專案設計難度較高",
        caseStudy: "研華：推動物聯網教育與產學合作",
      },
    ],
    top3Choice:
      "「核心職能回饋型」能創造企業與社會的雙贏，是最佳的社會參與策略。",
  },
  "6.01 氣候變遷": {
    options: [
      {
        name: "TCFD 完整揭露型",
        pros: "符合國際框架與主管機關要求",
        cons: "需跨部門整合財務與氣候數據",
        caseStudy: "多數大型金融業與製造業",
      },
      {
        name: "氣候情境分析型",
        pros: "深入評估不同升溫情境下的財務衝擊",
        cons: "需具備專業的氣候建模能力",
        caseStudy: "台達電：導入高階氣候情境分析",
      },
      {
        name: "內部碳定價驅動型",
        pros: "將氣候風險轉化為實質的減碳誘因",
        cons: "制度設計與推動阻力較大",
        caseStudy: "台積電、台達電：實施內部碳定價",
      },
    ],
    top3Choice:
      "領先企業已將「TCFD 揭露」深化為「氣候情境分析」與「內部碳定價」。",
  },
  "6.03 能源管理": {
    options: [
      {
        name: "節能減碳型",
        pros: "降低營運成本，執行門檻較低",
        cons: "減碳幅度有限",
        caseStudy: "多數企業的基礎做法",
      },
      {
        name: "RE100 承諾型",
        pros: "展現邁向淨零的決心，符合國際供應鏈要求",
        cons: "綠電取得成本高且供應不穩",
        caseStudy: "Microsoft：承諾 2030 實現負碳排",
      },
      {
        name: "智慧電網與儲能型",
        pros: "提升能源使用效率與電網韌性",
        cons: "需投入大量資本支出",
        caseStudy: "台泥：建置大型儲能系統",
      },
    ],
    top3Choice:
      "面對國際供應鏈壓力，「RE100 承諾型」已成為大型企業的必備策略。",
  },
  "6.04 水資源管理": {
    options: [
      {
        name: "節水回收型",
        pros: "降低水費支出，提升用水效率",
        cons: "回收率提升有其物理極限",
        caseStudy: "面板業、半導體業：高回收率",
      },
      {
        name: "水足跡盤查型",
        pros: "全面掌握產品生命週期的水資源消耗",
        cons: "盤查過程繁瑣",
        caseStudy: "日月光：產品水足跡認證",
      },
      {
        name: "水資源風險評估型",
        pros: "運用 WRI Aqueduct 等工具評估缺水風險",
        cons: "需結合營運據點進行地理空間分析",
        caseStudy: "可口可樂 (Coca-Cola)：水資源回饋與平衡計畫",
      },
    ],
    top3Choice:
      "高耗水產業必須採取「水資源風險評估型」結合極致的「節水回收」。",
  },
  "6.05 廢棄物管理": {
    options: [
      {
        name: "減量回收型",
        pros: "符合環保法規，降低處理成本",
        cons: "仍有部分廢棄物需掩埋或焚化",
        caseStudy: "多數製造業",
      },
      {
        name: "零廢棄物填埋型",
        pros: "展現極致的廢棄物管理能力 (UL 2799)",
        cons: "需尋找多元的去化管道",
        caseStudy: "台積電、光寶科：取得零廢棄認證",
      },
      {
        name: "循環經濟封閉迴路型",
        pros: "將廢棄物轉化為高價值資源，創造新商機",
        cons: "需跨產業合作與技術突破",
        caseStudy: "遠東新：寶特瓶回收再製技術",
      },
    ],
    top3Choice:
      "「循環經濟封閉迴路型」是廢棄物管理的最高境界，能創造新的商業價值。",
  },
  "7.01 GRI 內容索引表": {
    options: [
      {
        name: "基礎對應型",
        pros: "滿足 GRI 核心選項要求",
        cons: "僅提供頁碼，查閱不便",
        caseStudy: "一般報告書",
      },
      {
        name: "完整揭露型",
        pros: "涵蓋所有重大主題的揭露項目",
        cons: "報告書篇幅較長",
        caseStudy: "大型企業報告書",
      },
      {
        name: "互動式索引型",
        pros: "提供網頁版互動連結，提升閱讀體驗",
        cons: "需建置專屬 ESG 網站",
        caseStudy: "台達電：數位化 ESG 報告網站",
      },
    ],
    top3Choice:
      "「互動式索引型」能大幅提升利害關係人的閱讀體驗與資訊搜尋效率。",
  },
  "7.02 氣候相關資訊": {
    options: [
      {
        name: "法規遵循型",
        pros: "符合金管會氣候資訊揭露規定",
        cons: "內容較為制式",
        caseStudy: "上市櫃公司基本做法",
      },
      {
        name: "TCFD 對照型",
        pros: "清晰對應 TCFD 四大核心要素",
        cons: "需有完整的氣候治理架構",
        caseStudy: "標竿企業報告書",
      },
      {
        name: "財務影響量化型",
        pros: "具體揭露氣候風險與機會的財務數字",
        cons: "量化模型複雜且具不確定性",
        caseStudy: "大型金融業：氣候風險壓力測試",
      },
    ],
    top3Choice:
      "投資人越來越看重「財務影響量化型」的揭露，以評估企業的氣候韌性。",
  },
  "7.03 產業別永續指標資訊": {
    options: [
      {
        name: "SASB 基礎對應型",
        pros: "符合金管會要求與國際投資人期待",
        cons: "部分指標在台灣可能不適用",
        caseStudy: "多數上市櫃公司",
      },
      {
        name: "產業標竿比較型",
        pros: "與國際同業進行數據對標",
        cons: "需收集大量同業數據",
        caseStudy: "台積電：與國際半導體大廠對標",
      },
      {
        name: "核心指標強化型",
        pros: "針對產業關鍵指標進行深度揭露與目標設定",
        cons: "需投入資源改善該項指標績效",
        caseStudy: "金融業：強化永續金融指標揭露",
      },
    ],
    top3Choice:
      "建議採用「SASB 基礎對應型」並針對關鍵指標進行「產業標竿比較」。",
  },
  "7.04 其他準則內容索引表": {
    options: [
      {
        name: "聯合國 SDGs 對照型",
        pros: "展現對全球永續目標的貢獻",
        cons: "容易流於表面連結",
        caseStudy: "多數企業報告書",
      },
      {
        name: "永續會計準則(SASB)型",
        pros: "聚焦具財務重大性的 ESG 議題",
        cons: "需熟悉 SASB 產業分類與指標",
        caseStudy: "受外資青睞的大型企業",
      },
      {
        name: "綜合報告(IR)框架型",
        pros: "以六大資本展現企業價值創造過程",
        cons: "報告架構需全面重塑",
        caseStudy: "國泰金控：採用 IR 框架編製報告",
      },
    ],
    top3Choice: "同時提供 GRI、SASB 與 TCFD 索引表已成為標竿企業的標準配備。",
  },
  "7.05 確信機構意見書": {
    options: [
      {
        name: "有限確信型",
        pros: "成本較低，符合法規基本要求",
        cons: "保證程度較低",
        caseStudy: "多數企業初期做法",
      },
      {
        name: "合理確信型",
        pros: "提供高度保證，提升數據可信度",
        cons: "確信成本高，需有完善的內控機制",
        caseStudy: "針對溫室氣體盤查等關鍵數據",
      },
      {
        name: "雙重確信(財報+永續)型",
        pros: "由同一會計師事務所進行財報與 ESG 確信",
        cons: "費用最高",
        caseStudy: "大型金控與標竿製造業",
      },
    ],
    top3Choice: "針對溫室氣體等關鍵數據，建議逐步提升至「合理確信型」。",
  },
};

const getChapterContent = (sub: string): ChapterData => {
  if (CHAPTER_CONTENT[sub]) return CHAPTER_CONTENT[sub];

  // Default fallback for chapters without specific content
  return {
    template: `【${sub}】\n\n本公司依據 GRI 準則及相關法規要求，針對此議題進行管理與揭露。我們已建立完善的管理方針（DMA），包含政策、承諾、目標及資源投入。\n\n2024年度，我們在此議題上的主要績效為：【請填寫具體數據或成果】。未來我們將持續優化管理機制，以回應利害關係人的期待。`,
    examples: [
      {
        title: "版本一 (標準揭露)",
        content: `針對「${sub}」，本公司已訂定明確的管理政策與目標。透過跨部門協作與定期績效追蹤，我們確保各項行動方案能有效落實。2024年各項指標均達成預期目標。`,
      },
      {
        title: "版本二 (積極作為)",
        content: `我們將「${sub}」視為企業永續發展的關鍵驅動力。除了符合法規最低要求，我們更主動對標國際最佳實務，導入創新管理工具，並將績效與高階主管薪酬連結，展現我們追求卓越的決心。`,
      },
      {
        title: "版本三 (利害關係人導向)",
        content: `在「${sub}」的推動上，我們高度重視利害關係人的回饋。透過定期的議合與溝通，我們將外部觀點納入決策過程，確保我們的管理方針能精準回應社會與環境的真實需求。`,
      },
    ],
    explanation: {
      purpose: `揭露企業在「${sub}」議題上的管理方針（DMA）、具體作為與量化績效。`,
      why: "這是 GRI 準則的核心要求，能讓利害關係人評估企業對該特定議題的管理能力與實質影響力。",
    },
    strategies: UNIQUE_STRATEGIES[sub] || {
      options: [
        {
          name: "合規揭露型",
          pros: "滿足基本要求，風險低",
          cons: "難以突顯企業特色",
          caseStudy: "多數企業初期做法",
        },
        {
          name: "績效領先型",
          pros: "展現產業領導地位",
          cons: "需具備強大的數據收集與管理能力",
          caseStudy: "標竿企業做法",
        },
        {
          name: "創新實踐型",
          pros: "吸引特定領域的 ESG 投資人",
          cons: "可能需要較高的初期資源投入",
          caseStudy: "特定領域領導品牌",
        },
      ],
      top3Choice:
        "建議依據貴公司在該議題的實際成熟度，選擇適合的揭露策略。若為重大主題，建議朝「績效領先型」邁進。",
    },
    contextReminder: `系統已透過 Omni NCBDB (用戶成長資料庫) 自動關聯與「${sub}」相關的使用者習慣與歷史軌跡。撰寫時請確保與前期報告的數據邏輯保持一致。`,
  };
};

export function GuideView() {
  const [activeTab, setActiveTab] = useState<"guide" | "vouchers">("guide");
  const [expandedChapter, setExpandedChapter] = useState<string | null>("ch1");
  const [activeSub, setActiveSub] = useState<string>("1.01 經營者的話");
  const [isAutoNavigating, setIsAutoNavigating] = useState(false);
  const [remindedVouchers, setRemindedVouchers] = useState<string[]>([]);
  const [assistantMessage, setAssistantMessage] = useState(
    "您好！我是永續精靈。我將全程引導您完成這份 195 頁的永續報告書。我們從「1.01 經營者的話」開始吧！",
  );
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isCollabMode, setIsCollabMode] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [editedTemplate, setEditedTemplate] = useState("");
  const [selectedExampleIndex, setSelectedExampleIndex] = useState(0);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAnalyzingCrossChapter, setIsAnalyzingCrossChapter] = useState(false);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false);
  const [isAnalyzingGap, setIsAnalyzingGap] = useState(false);
  const [isExportingToNote, setIsExportingToNote] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ type: 'cross-chapter' | 'compliance' | 'gap-analysis', content: string } | null>(null);

  type LayoutBlock = {
    id: string;
    type: 'text' | 'bar-chart' | 'pie-chart' | 'line-chart' | 'area-chart' | 'radar-chart' | 'scatter-chart' | 'composed-chart' | 'image' | 'table';
    content: string;
    title?: string;
    data?: any[];
  };
  const [isVisualMode, setIsVisualMode] = useState(false);
  const [layoutBlocks, setLayoutBlocks] = useState<LayoutBlock[]>([]);
  const [brandColor, setBrandColor] = useState('#009E9D');
  const [isGeneratingVisuals, setIsGeneratingVisuals] = useState(false);
  const [draggedBlockIdx, setDraggedBlockIdx] = useState<number | null>(null);

  // Omni-Note State
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [notes, setNotes] = useState<{id: string, title: string, content: string, date: string}[]>([]);

  // Collaboration State
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{id: string, user: string, text: string, time: string, avatarColor: string}[]>([
    { id: '1', user: '環安衛-林經理', text: '這裡的溫室氣體盤查數據，請確認是否包含範疇三？', time: '10 分鐘前', avatarColor: 'bg-emerald-500' },
    { id: '2', user: 'HR-陳主任', text: '員工福利的部分我已經更新在最新版的附檔中了。', time: '1 小時前', avatarColor: 'bg-blue-500' }
  ]);
  const [newComment, setNewComment] = useState("");

  // Export State
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  useEffect(() => {
    setIsEditingTemplate(false);
    setAnalysisResult(null);
    setIsVisualMode(false);
    setLayoutBlocks([]);
    const chapterData = getChapterContent(activeSub);
    setEditedTemplate(
      chapterData?.template ||
        "【請依公司實際情形填寫】\n\n[系統將自動帶入相關數據]",
    );
    setSelectedExampleIndex(0);

    // Check for required vouchers and update spirit message
    if (
      chapterData?.requiredVouchers &&
      chapterData.requiredVouchers.length > 0
    ) {
      const vouchersStr = chapterData.requiredVouchers.join("、");
      setAssistantMessage(
        `本章節需要獲取【${vouchersStr}】單據，我已為您加入永續萬用曆中，並在獲取許可時同步詢問對方！`,
      );
    } else {
      setAssistantMessage(
        `正在編輯：${activeSub}。您可以參考右側的模板與範例進行撰寫。`,
      );
    }
  }, [activeSub]);

  const handleRandomizeExample = () => {
    const chapterData = getChapterContent(activeSub);
    if (chapterData && chapterData.examples.length > 0) {
      setSelectedExampleIndex(
        (prev) => (prev + 1) % chapterData.examples.length,
      );
    }
  };

  const handleSaveDraft = () => {
    setAssistantMessage(
      `已將「${activeSub}」儲存為草稿，並同步更新至您的專屬知識庫中！`,
    );
  };

  const handleCompleteNext = () => {
    setAssistantMessage(
      `「${activeSub}」已完成並儲存至知識庫！為您導航至下一節。`,
    );
    if (!completedSteps.includes(activeSub)) {
      setCompletedSteps((prev) => [...prev, activeSub]);
    }

    const allSubs = CHAPTERS.flatMap((ch) =>
      ch.sub.map((sub) => ({ chId: ch.id, sub })),
    );
    const currentIndex = allSubs.findIndex((s) => s.sub === activeSub);
    if (currentIndex >= 0 && currentIndex < allSubs.length - 1) {
      const next = allSubs[currentIndex + 1];
      setTimeout(() => {
        setExpandedChapter(next.chId);
        setActiveSub(next.sub);
      }, 1000);
    }
  };

  const handleAutoNavigate = () => {
    setIsAutoNavigating(true);
    setAssistantMessage(
      "永續精靈啟動自動導航模式... 正在為您逐項刻畫報告內容，並與 NCBDB (用戶成長資料庫) 進行核對。",
    );

    // Simulate auto navigation
    let step = 0;
    const allSubs = CHAPTERS.flatMap((ch) =>
      ch.sub.map((sub) => ({ chId: ch.id, sub })),
    );

    const interval = setInterval(() => {
      if (step < allSubs.length && step < 5) {
        // Limit to 5 steps for demo
        const next = allSubs[step];
        setExpandedChapter(next.chId);
        setActiveSub(next.sub);
        setCompletedSteps((prev) => [...prev, next.sub]);
        setAssistantMessage(
          `正在處理：${next.sub}... 已自動帶入相關數據與模板。`,
        );
        step++;
      } else {
        clearInterval(interval);
        setIsAutoNavigating(false);
        setAssistantMessage(
          "自動導航完成！已為您初步刻畫所有章節內容。建議您前往「單據收集清冊總表」核對尚缺的佐證資料。",
        );
      }
    }, 3000);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleRemind = (id: string, source: string) => {
    setRemindedVouchers((prev) => [...prev, id]);
    // Simulate sending reminder
    setTimeout(() => {
      alert(`已一鍵發送提醒通知給【${source}】負責人！`);
    }, 500);
  };

  const [swarmResult, setSwarmResult] = useState<any>(null);

  const onSwarmComplete = (result: any) => {
    setSwarmResult(result);
    setAssistantMessage(`導覽小隊完成分析！已發現「${result.mapping.compliance_status}」合規，建議行動：${result.suggestion}`);
  };

  const handleApplySwarmSuggestion = () => {
    if (!swarmResult?.suggestion) return;
    setEditedTemplate(prev => prev + "\n\n【AI 導覽小隊建議優化】\n" + swarmResult.suggestion);
    setAssistantMessage("已成功將導覽小隊的優化建議應用至文稿中！🛡️");
    setSwarmResult(null);
  };

  const [isGeneratingFullReport, setIsGeneratingFullReport] = useState(false);
  const [showFullReportPreview, setShowFullReportPreview] = useState(false);

  const handleGenerateFullReport = async () => {
    setIsGeneratingFullReport(true);
    setAssistantMessage("ADK 導覽小隊正在啟動「全景報告試作模式」... 正在同步進行五個核心章節的 5T 審計與撰寫。");
    
    // 模擬批量處理
    const chapters = ["1.01 經營者的話", "2.01 永續發展策略", "4.01 溫室氣體排放"];
    
    for (const ch of chapters) {
      setAssistantMessage(`神使正在核定：${ch}...`);
      await new Promise(r => setTimeout(r, 1500));
      if (!completedSteps.includes(ch)) {
        setCompletedSteps(prev => [...prev, ch]);
      }
    }

    setIsGeneratingFullReport(false);
    setShowFullReportPreview(true);
    setAssistantMessage("全景報告試作完成！已完成核心章節的數位刻印，您可以檢視「5T 成果彙整」。");
  };

  const handleAIGenerate = async () => {
    setIsGeneratingAI(true);
    setAssistantMessage("永續精靈正在為您產出超越水準的極致表現內容，請稍候...");
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const chapterData = getChapterContent(activeSub);
      const contextReminder = chapterData?.contextReminder || "無特別提醒";
      const explanation = chapterData?.explanation?.purpose || "無特別說明";

      const prompt = `身為頂尖的永續報告撰寫專家，請根據以下主題、現有模板以及上下文提醒，為永續報告書撰寫一段「超越水準的極致表現」的內容。

主題：${activeSub}
撰寫目的：${explanation}
上下文提醒：${contextReminder}

現有模板：
${editedTemplate}

請以繁體中文輸出，並嚴格遵循以下「根因分析 (Root Cause Analysis)」的方法論來撰寫：
1. 辨識核心問題與挑戰 (Identify Issues)：明確指出企業在該主題上面臨的挑戰或曾發生的問題。
2. 深入剖析根本原因 (Root Cause Explanation)：不僅描述表象，必須深入解釋造成這些問題的「底層原因 (Underlying Reasons)」。
3. 源頭改善與長效機制 (Source Improvements)：針對上述根本原因，提出從「源頭」進行改善的具體策略與長效機制，而非僅是治標的短期對策。
4. 極致針對性與專業度：內容必須深度契合「${activeSub}」的精髓，融入最新的 ESG 趨勢（如雙重重大性、AI 賦能等），語氣專業且具說服力。
5. 字數約 300-500 字。

請直接輸出最終可放入報告書的正式內容，段落分明，不要包含任何額外的對話或標題。`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        setEditedTemplate(response.text.trim());
        setIsEditingTemplate(true);
        setAssistantMessage("已為您產出極致表現的內容！您可以進一步編輯或直接儲存。");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAssistantMessage("抱歉，AI 產出過程中發生錯誤，請稍後再試。");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCrossChapterAnalysis = async () => {
    setIsAnalyzingCrossChapter(true);
    setAssistantMessage("永續精靈正在進行跨章節關聯分析，深貫檢視整體報告邏輯...");
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `身為頂尖的永續報告顧問，請針對當前章節「${activeSub}」的內容，進行深度的「跨章節關聯分析」與「根因分析 (Root Cause Analysis)」。

當前章節：${activeSub}
當前內容：
${editedTemplate}

請以繁體中文輸出，並遵循以下原則：
1. 針對性：必須完全針對「${activeSub}」的主題特性給出獨特建議，絕不可使用通用或重複的樣板文字。
2. 深貫廣通：提供 2-3 點具體的跨章節關聯建議（例如：若本節為治理，應如何貫穿至環境或社會面的具體章節與指標）。
3. 根因分析與源頭改正：若發現內容邏輯斷層或數據缺乏關聯，請指出其背後的管理機制或數據收集源頭可能出了什麼問題，並提出從源頭改正的具體作法（例如：不僅是修改文字，而是建議跨部門建立某種追蹤機制）。

直接輸出分析結果與建議，條理分明，不要包含任何額外的開場白或結語。`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        setAnalysisResult({ type: 'cross-chapter', content: response.text.trim() });
        setAssistantMessage("跨章節關聯分析完成！已為您列出具體建議與根因分析。");
      }
    } catch (error) {
      console.error("Cross Chapter Analysis Error:", error);
      setAssistantMessage("抱歉，跨章節關聯分析過程中發生錯誤，請稍後再試。");
    } finally {
      setIsAnalyzingCrossChapter(false);
    }
  };

  const handleComplianceCheck = async () => {
    setIsCheckingCompliance(true);
    setAssistantMessage("永續精靈正在進行合規性即時檢測，確保符合 GRI/SASB 準則...");
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `身為嚴格的 ESG 稽核員，請針對當前章節「${activeSub}」的內容，進行「合規性即時檢測」與「根因分析 (Root Cause Analysis)」。

當前章節：${activeSub}
當前內容：
${editedTemplate}

請以繁體中文輸出，並遵循以下原則：
1. 針對性：必須完全針對「${activeSub}」在 GRI/SASB 等國際準則中的特定要求進行檢視，絕不可給出空泛的合規建議。
2. 核心揭露檢測：明確指出當前內容是否涵蓋了該章節應有的核心揭露項目（如特定的量化指標或管理方針）。
3. 根因分析與源頭改正：若發現合規性缺口（例如缺少某項關鍵數據或政策描述），請深入分析為何會缺失（如：缺乏專責單位、系統未記錄），並給出 1-2 點從「管理源頭」或「流程機制」進行改正的具體行動建議，而非僅僅建議補充文字。

直接輸出檢測結果與改善建議，條理分明，不要包含任何額外的開場白或結語。`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        setAnalysisResult({ type: 'compliance', content: response.text.trim() });
        setAssistantMessage("合規性即時檢測完成！已為您列出檢測結果、根因分析與源頭改善建議。");
      }
    } catch (error) {
      console.error("Compliance Check Error:", error);
      setAssistantMessage("抱歉，合規性檢測過程中發生錯誤，請稍後再試。");
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const handleGapAnalysis = async () => {
    setIsAnalyzingGap(true);
    setAssistantMessage("永續精靈正在進行最佳實踐對標與缺口分析...");
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `身為頂尖的 ESG 顧問與產業標竿分析師，請針對當前章節「${activeSub}」的內容，進行「最佳實踐優化與缺口補齊 (Best Practice & Gap Analysis)」。

當前章節：${activeSub}
當前內容：
${editedTemplate}

請以繁體中文輸出，並嚴格遵循「根因分析 (Root Cause Analysis)」的方法論，遵循以下原則：
1. 最佳實踐對標 (Best Practice Benchmarking)：指出業界領先企業在揭露此章節時的「最佳實踐」作法是什麼（例如：不僅揭露數據，還結合財務影響評估）。
2. 核心缺口辨識 (Gap Identification)：嚴格比對當前內容與最佳實踐，精準點出當前內容的「缺口」在哪裡（例如：缺乏短中長期目標設定、缺乏價值鏈延伸）。
3. 根因剖析與源頭優化 (Root Cause Analysis & Source Optimization)：針對上述缺口，深入剖析為何會產生這些落差（例如：內部跨部門溝通不足、缺乏自動化數據收集工具），並給出 2-3 點具體、可執行的源頭優化建議，指導如何從營運面或數據收集面「補齊」這些缺口，讓報告達到業界頂尖水準。

直接輸出分析結果與建議，條理分明，不要包含任何額外的開場白或結語。`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        setAnalysisResult({ type: 'gap-analysis', content: response.text.trim() });
        setAssistantMessage("最佳實踐與缺口分析完成！已為您列出對標結果與補齊建議。");
      }
    } catch (error) {
      console.error("Gap Analysis Error:", error);
      setAssistantMessage("抱歉，缺口分析過程中發生錯誤，請稍後再試。");
    } finally {
      setIsAnalyzingGap(false);
    }
  };

  const handleGenerateVisuals = async () => {
    setIsGeneratingVisuals(true);
    setAssistantMessage("永續精靈正在分析文章內容，為您自動生成數據圖表與完美圖文排版...");
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `身為頂尖的資料視覺化與排版專家，請根據以下永續報告內容，自動為其進行「圖文排版」。
請萃取出適合繪製成圖表的數據，並將長篇文字拆分為適合閱讀的段落。

當前內容：
${editedTemplate}

請嚴格輸出 JSON 陣列格式，不要有任何 Markdown 標記 (\`\`\`json 等)。
陣列中的每個物件代表一個排版區塊 (block)，格式如下：
[
  {
    "type": "text",
    "content": "報告的引言或敘述文字..."
  },
  {
    "type": "bar-chart", // 支援: bar-chart, pie-chart, line-chart, area-chart, radar-chart, scatter-chart, composed-chart
    "title": "圖表標題",
    "data": [
      {"name": "2021", "value": 100, "value2": 80}, // 可包含多個數值欄位 (scatter-chart 需使用 x, y 欄位)
      {"name": "2022", "value": 120, "value2": 90}
    ]
  }
]
請確保至少包含一段文字與一個圖表（若內容有數據）。若無數據，請產生示範數據。
不同圖表適用情境：
- bar-chart: 比較不同類別或年份的數值。
- pie-chart: 顯示各部分佔整體的比例。
- line-chart: 顯示隨時間變化的趨勢。
- area-chart: 強調隨時間變化的數量或趨勢累積。
- radar-chart: 顯示多個變數的相對大小（如：各項 ESG 指標表現）。
- table: 呈現詳細的數據對比或多維度資訊矩陣。
- image: 插入情境示意圖（請在 content 欄位填入 "https://picsum.photos/seed/esg/800/400" 作為預設圖片）。

請確保至少包含一段文字與一個圖表或表格（若內容有數據）。若無數據，請產生示範數據。`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      if (response.text) {
        try {
          const jsonStr = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsedBlocks = JSON.parse(jsonStr);
          const blocksWithIds = parsedBlocks.map((b: any) => ({ ...b, id: Math.random().toString(36).substring(7) }));
          setLayoutBlocks(blocksWithIds);
          setIsVisualMode(true);
          setAssistantMessage("圖文排版生成完成！您可以自由拖放區塊，或更換品牌主題色。");
        } catch (e) {
          console.error("JSON Parse Error:", e, response.text);
          setAssistantMessage("抱歉，圖表生成格式有誤，請稍後再試。");
        }
      }
    } catch (error) {
      console.error("Visuals Generation Error:", error);
      setAssistantMessage("抱歉，圖表生成過程中發生錯誤，請稍後再試。");
    } finally {
      setIsGeneratingVisuals(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBlockIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBlockIdx === null || draggedBlockIdx === index) return;
    
    const newBlocks = [...layoutBlocks];
    const draggedBlock = newBlocks[draggedBlockIdx];
    newBlocks.splice(draggedBlockIdx, 1);
    newBlocks.splice(index, 0, draggedBlock);
    
    setDraggedBlockIdx(index);
    setLayoutBlocks(newBlocks);
  };

  const handleDragEnd = () => {
    setDraggedBlockIdx(null);
  };

  const handleExportToNote = () => {
    setIsExportingToNote(true);
    setAssistantMessage("正在將當前內容與分析結果匯出至萬能筆記 (Omni-Note)...");
    setTimeout(() => {
      setIsExportingToNote(false);
      const newNote = {
        id: Date.now().toString(),
        title: activeSub,
        content: isVisualMode ? "已匯出圖文排版區塊" : editedTemplate.substring(0, 100) + "...",
        date: new Date().toLocaleString()
      };
      setNotes(prev => [newNote, ...prev]);
      setIsNoteOpen(true);
      setAssistantMessage(`已成功將「${activeSub}」的內容匯出至萬能筆記！您可以在筆記中進行更自由的編輯與發想。`);
    }, 1500);
  };

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    setAssistantMessage("正在為您排版並生成 PDF 報告...");
    setTimeout(() => {
      setIsExportingPDF(false);
      setAssistantMessage("PDF 報告已成功匯出！");
    }, 2000);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: Date.now().toString(),
      user: '我 (永續負責人)',
      text: newComment,
      time: '剛剛',
      avatarColor: 'bg-indigo-500'
    }]);
    setNewComment("");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#333333] tracking-tight flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span>Sustainability Report Guide</span>
            <Badge
              variant="optimal"
              styleType="soft"
              className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2 py-0.5 w-fit"
            >
              Omni NCBDB (用戶成長資料庫): STABILIZED & SECURED 🛡️
            </Badge>
          </h1>
          <p className="text-[#666666] text-sm sm:text-base">
            永續報告撰寫指南 - 永續精靈全程自動導航與單據清冊
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button
            variant={activeTab === "guide" ? "solid" : "wireframe"}
            onClick={() => setActiveTab("guide")}
            className="flex-1 sm:flex-none"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            撰寫導航 (Guide)
          </Button>
          <Button
            variant={activeTab === "vouchers" ? "solid" : "wireframe"}
            onClick={() => setActiveTab("vouchers")}
            className="flex-1 sm:flex-none"
          >
            <ListChecks className="w-4 h-4 mr-2" />
            單據清冊與協作 (Vouchers & Collab)
          </Button>
          <div className="h-6 w-px bg-slate-300 hidden sm:block mx-2"></div>
          <Button
            variant={isCollabMode ? "solid" : "wireframe"}
            onClick={() => setIsCollabMode(!isCollabMode)}
            className={`flex-1 sm:flex-none ${isCollabMode ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600' : ''}`}
          >
            <Users className="w-4 h-4 mr-2" />
            協作模式
          </Button>
          <Button
            variant={isNoteOpen ? "solid" : "wireframe"}
            onClick={() => setIsNoteOpen(!isNoteOpen)}
            className={`flex-1 sm:flex-none ${isNoteOpen ? 'bg-amber-600 hover:bg-amber-700 border-amber-600' : ''}`}
          >
            <StickyNote className="w-4 h-4 mr-2" />
            萬能筆記
          </Button>
          <Button
            variant="solid"
            onClick={handleGenerateFullReport}
            disabled={isGeneratingFullReport}
            className="bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white shadow-xl shadow-indigo-200 border-none"
          >
            {isGeneratingFullReport ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            ADK 導覽小隊全景試作
          </Button>
        </div>
      </div>

      {/* ADK Navigation Swarm HUD - NEW EXPERIMENT */}
      <GlassCard className="p-8 bg-bg-base border-border">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-main mb-4 flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-proxy" />
              ADK 永續報告導覽小隊
            </h2>
            <p className="text-text-muted leading-relaxed mb-6">
              由 ADK (Agent Development Kit) 驅動的專家級導覽陣列。
              「導航總管」協同「框架戰略神使」與「內容編纂神使」，為您的永續報告路徑提供即時戰略指引、合規映射與文稿編撰。
              所有建議均透過 5T 協議驗證，確保在撰寫過程中達成零幻覺、可感知與可信賴的卓越成就。
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge variant="optimal" styleType="soft" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                GRI/SASB/TCFD Expert
              </Badge>
              <Badge variant="optimal" styleType="soft" className="bg-teal-500/20 text-teal-300 border-teal-500/30">
                Context-Aware
              </Badge>
              <Badge variant="optimal" styleType="soft" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                5T Verified
              </Badge>
            </div>
          </div>
          <div className="flex-1 w-full max-w-xl">
            <ESGSwarmHUD 
              mode="navigation" 
              context={{ 
                chapterId: activeSub, 
                content: editedTemplate 
              }} 
              onComplete={onSwarmComplete}
            />
          </div>
        </div>
      </GlassCard>

      {/* Intelligent Guidance Spirit UI */}
      <GlassCard className="p-4 bg-gradient-to-r from-[#009E9D]/10 to-[#219EBC]/10 border-[#009E9D]/20 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009E9D] to-[#219EBC] flex items-center justify-center flex-shrink-0 shadow-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-[#009E9D]">
              永續精靈 (Sustainability Spirit)
            </p>
            {activeTab === "guide" && !isAutoNavigating && (
              <Button
                variant="solid"
                className="h-8 text-xs py-0"
                onClick={handleAutoNavigate}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                啟動全程自動導航
              </Button>
            )}
            {isAutoNavigating && (
              <Badge
                variant="optimal"
                styleType="soft"
                className="animate-pulse"
              >
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                自動導航中...
              </Badge>
            )}
          </div>
          <p className="text-[#333333] text-sm leading-relaxed">
            {assistantMessage}
          </p>
        </div>
      </GlassCard>

      {activeTab === "guide" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Chapter Navigation */}
          <div className="lg:col-span-1">
            <Button
              variant="wireframe"
              className="w-full lg:hidden mb-4 flex items-center justify-between"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <span>{activeSub}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            <GlassCard className={`p-4 h-[400px] lg:h-[600px] overflow-y-auto ${!isSidebarOpen ? 'hidden lg:block' : 'block'}`}>
            <h3 className="font-bold text-[#333333] mb-4 px-2">
              報告書架構 (GRI 準則)
            </h3>
            <div className="space-y-2">
              {CHAPTERS.map((ch) => (
                <div key={ch.id} className="space-y-1">
                  <button
                    onClick={() =>
                      setExpandedChapter(
                        expandedChapter === ch.id ? null : ch.id,
                      )
                    }
                    className={`w-full flex items-center justify-between p-2 rounded-[6px] text-sm font-medium transition-colors ${
                      expandedChapter === ch.id
                        ? "bg-[#009E9D]/10 text-[#009E9D]"
                        : "text-[#333333] hover:bg-[#F1F3F5]"
                    }`}
                  >
                    <span className="truncate text-left">{ch.title}</span>
                    {expandedChapter === ch.id ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                  {expandedChapter === ch.id && (
                    <div className="pl-4 pr-2 py-1 space-y-1">
                      {ch.sub.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => {
                            setActiveSub(sub);
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-[6px] text-xs transition-colors flex items-center justify-between ${
                            activeSub === sub
                              ? "bg-[#009E9D] text-white"
                              : "text-[#666666] hover:bg-[#F1F3F5]"
                          }`}
                        >
                          <span className="truncate">{sub}</span>
                          {completedSteps.includes(sub) && (
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Content Editor Area */}
        <GlassCard className="p-5 md:p-8 lg:col-span-3 min-h-[500px] lg:min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E7EB]">
              <h2 className="text-2xl font-bold text-[#333333]">{activeSub}</h2>
              <Badge variant="optimal" styleType="soft">
                GRI 對應章節
              </Badge>
            </div>

            <div className="flex-1 bg-[#F8F9FA] rounded-[8px] border border-[#E5E7EB] p-6 relative overflow-hidden group">
              {isAutoNavigating && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="bg-white p-4 rounded-[8px] shadow-lg flex items-center gap-3 text-[#009E9D] font-medium">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    永續精靈正在為您刻畫此章節內容...
                  </div>
                </div>
              )}

              <div className="space-y-6 text-sm text-[#666666]">
                {/* 教學與策略區塊 */}
                {getChapterContent(activeSub)?.explanation && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard className="p-4 border-[#219EBC]/20 bg-[#219EBC]/5">
                      <h4 className="font-bold text-[#219EBC] mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        教學式解說
                      </h4>
                      <div className="space-y-3 text-xs leading-relaxed">
                        <p>
                          <strong className="text-[#333333] block mb-1">
                            表達項目：
                          </strong>
                          {getChapterContent(activeSub).explanation?.purpose}
                        </p>
                        <p>
                          <strong className="text-[#333333] block mb-1">
                            為何如此：
                          </strong>
                          {getChapterContent(activeSub).explanation?.why}
                        </p>
                      </div>
                    </GlassCard>

                    {getChapterContent(activeSub)?.strategies && (
                      <GlassCard className="p-4 border-[#D4AF37]/20 bg-[#D4AF37]/5">
                        <h4 className="font-bold text-[#D4AF37] mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          策略與頂尖案例
                        </h4>
                        <div className="space-y-3 text-xs">
                          <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                            {getChapterContent(
                              activeSub,
                            ).strategies?.options.map((opt, i) => (
                              <div
                                key={i}
                                className="bg-white/60 p-2.5 rounded-[6px] border border-[#D4AF37]/20"
                              >
                                <p className="font-bold text-[#333333] mb-1.5">
                                  {opt.name}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-[10px] mb-1.5">
                                  <p>
                                    <span className="text-emerald-600 font-medium">
                                      優：
                                    </span>
                                    {opt.pros}
                                  </p>
                                  <p>
                                    <span className="text-rose-600 font-medium">
                                      缺：
                                    </span>
                                    {opt.cons}
                                  </p>
                                </div>
                                <p className="text-[10px] text-[#666666] bg-white/50 p-1 rounded">
                                  案例：{opt.caseStudy}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="bg-[#D4AF37]/10 p-2.5 rounded-[6px] text-[#333333] font-medium text-[11px] leading-relaxed border border-[#D4AF37]/20">
                            💡 同業前三選擇：
                            {
                              getChapterContent(activeSub).strategies
                                ?.top3Choice
                            }
                          </div>
                        </div>
                      </GlassCard>
                    )}
                  </div>
                )}

                {/* 上下文推斷提醒 */}
                {getChapterContent(activeSub)?.contextReminder && (
                  <div className="bg-[#009E9D]/10 border border-[#009E9D]/30 p-4 rounded-[6px] flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-[#009E9D] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#009E9D] text-sm mb-1">
                        上下文推斷提醒
                      </h4>
                      <p className="text-xs text-[#333333] leading-relaxed">
                        {getChapterContent(activeSub).contextReminder}
                      </p>
                    </div>
                  </div>
                )}

                {/* API Documentation */}
                <GlassCard className="p-4 border-slate-200 bg-slate-50">
                  <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    API Documentation: Generate AI Content
                  </h4>
                  <div className="space-y-4 text-xs text-slate-600">
                    <div>
                      <strong className="text-slate-800 block mb-1">Endpoint:</strong>
                      <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">ai.models.generateContent</code> (via <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">@google/genai</code> SDK)
                    </div>
                    <div>
                      <strong className="text-slate-800 block mb-1">Model:</strong>
                      <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">gemini-3-flash-preview</code>
                    </div>
                    <div>
                      <strong className="text-slate-800 block mb-1">Parameters (Prompt Structure):</strong>
                      <ul className="list-disc pl-4 space-y-1 mt-1">
                        <li><strong className="text-slate-700">主題 (Topic):</strong> The current active sub-chapter (e.g., &quot;{activeSub}&quot;).</li>
                        <li><strong className="text-slate-700">撰寫目的 (Purpose):</strong> The specific goal of the chapter content.</li>
                        <li><strong className="text-slate-700">上下文提醒 (Context Reminder):</strong> Any relevant historical data or context.</li>
                        <li><strong className="text-slate-700">現有模板 (Current Template):</strong> The current content of the editor to base the generation on.</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-slate-800 block mb-1">Expected Response Structure:</strong>
                      <p className="mb-1">The API returns a <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-800">GenerateContentResponse</code> object. The generated text is extracted using:</p>
                      <pre className="bg-slate-800 text-slate-50 p-2 rounded overflow-x-auto">
                        <code>
{`const response = await ai.models.generateContent({ ... });
const generatedText = response.text; // Extracted string`}
                        </code>
                      </pre>
                    </div>
                  </div>
                </GlassCard>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#219EBC] font-bold flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      參考範例 (Example)
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#666666] bg-[#F1F3F5] px-2 py-1 rounded-[4px] truncate max-w-[120px] sm:max-w-none">
                        {getChapterContent(activeSub)?.examples?.[
                          selectedExampleIndex
                        ]?.title || "預設版本"}
                      </span>
                      <Button
                        variant="wireframe"
                        className="h-7 w-7 p-0 flex items-center justify-center text-[#219EBC] border-[#219EBC]/30 hover:bg-[#219EBC]/10"
                        onClick={handleRandomizeExample}
                        title="切換風格"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-[6px] border border-[#E5E7EB] whitespace-pre-wrap leading-relaxed min-h-[150px] text-sm sm:text-base">
                    {getChapterContent(activeSub)?.examples?.[
                      selectedExampleIndex
                    ]?.content ||
                      "本公司致力於永續發展，並在各項指標上取得顯著進展。詳細內容請參閱本章節之具體說明。"}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#009E9D] font-bold flex items-center gap-2 text-sm sm:text-base">
                      <FileText className="w-4 h-4" />
                      [無作筆記: 永續報告撰寫]
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={!isVisualMode ? "solid" : "wireframe"}
                        className="h-7 text-xs px-2 py-0"
                        onClick={() => setIsVisualMode(false)}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        純文字編輯
                      </Button>
                      <Button
                        variant={isVisualMode ? "solid" : "wireframe"}
                        className="h-7 text-xs px-2 py-0"
                        onClick={() => {
                          if (layoutBlocks.length === 0) {
                            handleGenerateVisuals();
                          } else {
                            setIsVisualMode(true);
                          }
                        }}
                        disabled={isGeneratingVisuals}
                      >
                        {isGeneratingVisuals ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <LayoutTemplate className="w-3.5 h-3.5 mr-1" />}
                        圖文排版模式
                      </Button>
                      {!isVisualMode && (
                        <>
                          {swarmResult && (
                            <Button
                              variant="solid"
                              className="h-7 text-xs px-3 py-0 bg-[#009E9D] hover:bg-[#007E7D] text-white animate-bounce"
                              onClick={handleApplySwarmSuggestion}
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              應用小隊優化建議
                            </Button>
                          )}
                          <Button
                            variant="wireframe"
                            className="h-7 w-7 p-0 flex items-center justify-center text-amber-600 border-amber-300 hover:bg-amber-50"
                            onClick={handleAIGenerate}
                            disabled={isGeneratingAI}
                            title="AI 智能產出"
                          >
                            {isGeneratingAI ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Wand2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="wireframe"
                            className="h-7 w-7 p-0 flex items-center justify-center text-[#009E9D] border-[#009E9D]/30 hover:bg-[#009E9D]/10"
                            onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                            title={isEditingTemplate ? "完成編輯" : "開啟編輯"}
                          >
                            {isEditingTemplate ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Edit3 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {isVisualMode && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Palette className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">品牌主題色:</span>
                        <div className="flex gap-2">
                          {['#009E9D', '#D4AF37', '#219EBC', '#E76F51', '#2A9D8F', '#1D3557'].map(color => (
                            <button
                              key={color}
                              onClick={() => setBrandColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${brandColor === color ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <Button variant="wireframe" className="h-7 text-xs" onClick={handleGenerateVisuals} disabled={isGeneratingVisuals}>
                        {isGeneratingVisuals ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                        重新生成版面
                      </Button>
                    </div>
                  )}

                  {isVisualMode ? (
                    <div className="space-y-4 min-h-[400px] bg-slate-50/50 p-4 rounded-[8px] border border-slate-200">
                      {layoutBlocks.map((block, idx) => (
                        <div
                          key={block.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all cursor-move hover:shadow-md ${draggedBlockIdx === idx ? 'opacity-50 scale-[0.98]' : ''}`}
                          style={{ borderLeft: `4px solid ${brandColor}` }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="optimal" styleType="soft" className="text-xs" style={{ color: brandColor, backgroundColor: `${brandColor}15` }}>
                              {block.type === 'text' ? '文字段落' : 
                               block.type === 'bar-chart' ? '長條圖表' : 
                               block.type === 'pie-chart' ? '圓餅圖表' : 
                               block.type === 'line-chart' ? '折線圖表' :
                               block.type === 'area-chart' ? '面積圖表' :
                               block.type === 'radar-chart' ? '雷達圖表' :
                               block.type === 'scatter-chart' ? '散佈圖表' :
                               block.type === 'composed-chart' ? '複合圖表' : 
                               block.type === 'table' ? '數據表格' :
                               block.type === 'image' ? '圖片' : '內容區塊'}
                            </Badge>
                            <GripHorizontal className="w-4 h-4 text-slate-400" />
                          </div>
                          
                          {block.type === 'text' && (
                            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {block.content}
                            </div>
                          )}
                          
                          {block.type === 'bar-chart' && block.data && (
                            <div className="w-full h-[300px]">
                              {block.title && <h4 className="text-center font-bold mb-4 text-slate-800">{block.title}</h4>}
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={block.data}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                  <Legend />
                                  <Bar dataKey="value" fill={brandColor} radius={[4, 4, 0, 0]} />
                                  {block.data[0]?.value2 !== undefined && <Bar dataKey="value2" fill={`${brandColor}80`} radius={[4, 4, 0, 0]} />}
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {block.type === 'line-chart' && block.data && (
                            <div className="w-full h-[300px]">
                              {block.title && <h4 className="text-center font-bold mb-4 text-slate-800">{block.title}</h4>}
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={block.data}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                  <Legend />
                                  <Line type="monotone" dataKey="value" stroke={brandColor} strokeWidth={3} dot={{ r: 4, fill: brandColor }} activeDot={{ r: 6 }} />
                                  {block.data[0]?.value2 !== undefined && <Line type="monotone" dataKey="value2" stroke={`${brandColor}80`} strokeWidth={3} dot={{ r: 4 }} />}
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {block.type === 'area-chart' && block.data && (
                            <div className="w-full h-[300px]">
                              {block.title && <h4 className="text-center font-bold mb-4 text-slate-800">{block.title}</h4>}
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={block.data}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                  <Legend />
                                  <Area type="monotone" dataKey="value" stroke={brandColor} fill={brandColor} fillOpacity={0.3} />
                                  {block.data[0]?.value2 !== undefined && <Area type="monotone" dataKey="value2" stroke={`${brandColor}80`} fill={`${brandColor}80`} fillOpacity={0.3} />}
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {block.type === 'radar-chart' && block.data && (
                            <div className="w-full h-[300px]">
                              {block.title && <h4 className="text-center font-bold mb-4 text-slate-800">{block.title}</h4>}
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={block.data}>
                                  <PolarGrid stroke="#E5E7EB" />
                                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fontSize: 10 }} />
                                  <Radar name="數值" dataKey="value" stroke={brandColor} fill={brandColor} fillOpacity={0.5} />
                                  {block.data[0]?.value2 !== undefined && <Radar name="數值2" dataKey="value2" stroke={`${brandColor}80`} fill={`${brandColor}80`} fillOpacity={0.5} />}
                                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                  <Legend />
                                </RadarChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {block.type === 'scatter-chart' && block.data && (
                            <div className="w-full h-[300px]">
                              {block.title && <h4 className="text-center font-bold mb-4 text-slate-800">{block.title}</h4>}
                              <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                  <XAxis dataKey="x" type="number" name="X" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <YAxis dataKey="y" type="number" name="Y" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                  <Legend />
                                  <Scatter name="分佈數據" data={block.data} fill={brandColor} />
                                </ScatterChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {block.type === 'composed-chart' && block.data && (
                            <div className="w-full h-[300px]">
                              {block.title && <h4 className="text-center font-bold mb-4 text-slate-800">{block.title}</h4>}
                              <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={block.data}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                  <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                  <Legend />
                                  <Bar dataKey="value" barSize={20} fill={brandColor} radius={[4, 4, 0, 0]} />
                                  {block.data[0]?.value2 !== undefined && <Line type="monotone" dataKey="value2" stroke="#D4AF37" strokeWidth={3} />}
                                </ComposedChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {block.type === 'pie-chart' && block.data && (
                            <div className="w-full h-[300px]">
                              {block.title && <h4 className="text-center font-bold mb-4 text-slate-800">{block.title}</h4>}
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={block.data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    {block.data.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 0 ? brandColor : index === 1 ? `${brandColor}99` : index === 2 ? `${brandColor}66` : `${brandColor}33`} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {block.type === 'table' && block.data && (
                            <div className="w-full overflow-x-auto">
                              {block.title && <h4 className="text-center font-bold mb-4 text-slate-800">{block.title}</h4>}
                              <table className="w-full text-sm text-left text-slate-600 rounded-lg overflow-hidden">
                                <thead className="text-xs text-slate-700 uppercase" style={{ backgroundColor: `${brandColor}15` }}>
                                  <tr>
                                    {Object.keys(block.data[0] || {}).map(key => (
                                      <th key={key} className="px-6 py-3 font-semibold">{key}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {block.data.map((row, i) => (
                                    <tr key={i} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                      {Object.values(row).map((val: any, j) => (
                                        <td key={j} className="px-6 py-4">{val}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {block.type === 'image' && (
                            <div className="w-full flex flex-col items-center">
                              {block.title && <h4 className="text-center font-bold mb-4 text-slate-800">{block.title}</h4>}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={block.content || "https://picsum.photos/seed/esg/800/400"} 
                                alt={block.title || "Report Image"} 
                                className="rounded-lg max-w-full h-auto object-cover shadow-sm border border-slate-200"
                                style={{ maxHeight: '400px' }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      {layoutBlocks.length === 0 && !isGeneratingVisuals && (
                        <div className="text-center py-12 text-slate-500 text-sm">
                          點擊「重新生成版面」讓永續精靈為您自動排版
                        </div>
                      )}
                    </div>
                  ) : isEditingTemplate ? (
                    <textarea
                      className="w-full bg-white p-4 rounded-[6px] border border-[#009E9D] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#009E9D] min-h-[150px] resize-y"
                      value={editedTemplate}
                      onChange={(e) => setEditedTemplate(e.target.value)}
                    />
                  ) : (
                    <div className="bg-white p-4 rounded-[6px] border border-[#E5E7EB] whitespace-pre-wrap font-mono text-xs min-h-[150px]">
                      {editedTemplate}
                    </div>
                  )}
                </div>

                {/* Analysis Result Display */}
                {analysisResult && (
                  <div className={`p-4 rounded-[6px] border ${
                    analysisResult.type === 'cross-chapter' 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-800' 
                      : analysisResult.type === 'compliance'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}>
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      {analysisResult.type === 'cross-chapter' ? <RefreshCw className="w-4 h-4" /> : analysisResult.type === 'compliance' ? <CheckCircle2 className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                      {analysisResult.type === 'cross-chapter' ? '跨章節關聯分析結果' : analysisResult.type === 'compliance' ? '合規性即時檢測結果' : '最佳實踐與缺口分析結果'}
                    </h4>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {analysisResult.content}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="wireframe" 
                  onClick={handleCrossChapterAnalysis}
                  disabled={isAnalyzingCrossChapter}
                  className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  {isAnalyzingCrossChapter ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                  跨章節關聯分析
                </Button>
                <Button 
                  variant="wireframe" 
                  onClick={handleComplianceCheck}
                  disabled={isCheckingCompliance}
                  className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                >
                  {isCheckingCompliance ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                  合規性即時檢測
                </Button>
                <Button 
                  variant="wireframe" 
                  onClick={handleGapAnalysis}
                  disabled={isAnalyzingGap}
                  className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  {isAnalyzingGap ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Target className="w-3 h-3 mr-1" />}
                  最佳實踐與缺口分析
                </Button>
                <Button 
                  variant="wireframe" 
                  onClick={handleExportToNote}
                  disabled={isExportingToNote}
                  className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  {isExportingToNote ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                  匯出至萬能筆記
                </Button>
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="wireframe" 
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  {isExportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  匯出 PDF
                </Button>
                <Button variant="wireframe" onClick={handleSaveDraft}>
                  儲存草稿
                </Button>
                <Button variant="solid" onClick={handleCompleteNext}>
                  完成並前往下一節
                </Button>
              </div>
            </div>

            {/* Collaboration Sidebar for Guide */}
            {isCollabMode && (
              <div className="absolute right-0 top-0 bottom-0 w-64 bg-white border-l border-[#E5E7EB] shadow-[-4px_0_15px_rgba(0,0,0,0.03)] flex flex-col z-20 animate-in slide-in-from-right-8 duration-200">
                <div className="p-4 border-b border-[#E5E7EB] bg-[#F8F9FA]">
                  <h4 className="font-bold text-[#333333] text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#219EBC]" />
                    協作討論區
                  </h4>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#009E9D] text-white flex items-center justify-center text-xs flex-shrink-0">
                      A
                    </div>
                    <div className="bg-[#F1F3F5] p-2 rounded-[6px] rounded-tl-none text-xs text-[#333333]">
                      這段經營者的話，是否需要加入今年新設立的減碳目標？
                    </div>
                  </div>
                  <div className="flex gap-2 flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-[#219EBC] text-white flex items-center justify-center text-xs flex-shrink-0">
                      我
                    </div>
                    <div className="bg-[#E6F4F1] p-2 rounded-[6px] rounded-tr-none text-xs text-[#333333]">
                      好主意，我請永續精靈幫忙補充進去。
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-[#E5E7EB]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="輸入留言..."
                      className="w-full bg-[#F1F3F5] border-none rounded-[4px] py-1.5 pl-2 pr-8 text-xs focus:ring-1 focus:ring-[#219EBC] outline-none"
                    />
                    <button className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#219EBC]">
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      ) : (
        /* Vouchers Master List */
        <div className="space-y-6">
          <GlassCard className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#333333]">
                  單據清冊與協作總表 (Vouchers & Collab)
                </h2>
                <p className="text-[#666666] mt-1 text-sm sm:text-base">
                  與各單位核對單據項目，並提供一鍵提醒與即時協作功能。
                </p>
              </div>
              <div className="bg-[#F1F3F5] px-4 py-2 rounded-[6px] text-sm font-medium text-[#333333] whitespace-nowrap">
                進度: 2 / 7 已收集
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {VOUCHERS.map((v) => (
              <GlassCard
                key={v.id}
                className="p-5 flex flex-col h-full border-t-4 transition-all hover:shadow-md"
                style={{ borderTopColor: v.status === "collected" ? "#10B981" : "#F59E0B" }}
              >
                <div className="flex justify-between items-start mb-3">
                  {v.status === "collected" ? (
                    <Badge
                      variant="optimal"
                      styleType="soft"
                      className="flex w-fit items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> 已收集
                    </Badge>
                  ) : (
                    <Badge
                      variant="critical"
                      styleType="soft"
                      className="flex w-fit items-center gap-1 bg-amber-50 text-amber-700 border-amber-200"
                    >
                      <FileText className="w-3.5 h-3.5" /> 待收集
                    </Badge>
                  )}
                  <span className="text-xs font-bold text-[#009E9D] bg-[#009E9D]/10 px-2 py-1 rounded-full">
                    {v.source}
                  </span>
                </div>

                <div className="mb-4 flex-1">
                  <h3 className="font-bold text-[#333333] text-base leading-tight mb-1">{v.name}</h3>
                  <p className="text-sm text-[#666666] line-clamp-2">{v.desc}</p>
                </div>

                <div className="bg-[#F8F9FA] rounded-[8px] p-3 mb-4 min-h-[60px] flex flex-col justify-center border border-[#E5E7EB]">
                  {v.response ? (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-[#219EBC] flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-[#666666] leading-relaxed">{v.response}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-[#999999] italic text-center w-full block">
                      尚未有協作回應...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[#E5E7EB]">
                  {v.status === "pending" && (
                    <Button
                      variant="wireframe"
                      className={`flex-1 text-xs h-9 ${remindedVouchers.includes(v.id) ? "bg-[#E5E7EB] text-[#999999] border-transparent" : "text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/10"}`}
                      onClick={() => handleRemind(v.id, v.source)}
                      disabled={remindedVouchers.includes(v.id)}
                    >
                      <Bell className="w-3.5 h-3.5 mr-1.5" />
                      {remindedVouchers.includes(v.id) ? "已提醒" : "一鍵提醒"}
                    </Button>
                  )}
                  
                  <Button
                    variant="wireframe"
                    className="flex-1 text-xs h-9 text-[#219EBC] border-[#219EBC]/30 hover:bg-[#219EBC]/10"
                    onClick={() => setActiveChat(activeChat === v.id ? null : v.id)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    協作討論
                  </Button>

                  {v.status === "collected" && (
                    <Button
                      variant="wireframe"
                      className="flex-1 text-xs h-9 text-[#009E9D] border-[#009E9D]/30 hover:bg-[#009E9D]/10"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      檢視單據
                    </Button>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Floating Chat Box for Vouchers */}
          {activeChat && (
            <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-80 bg-white rounded-[12px] shadow-2xl border border-[#E5E7EB] z-50 overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-200">
              <div className="bg-[#219EBC] p-3 text-white flex justify-between items-center">
                <span className="font-medium text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />與{" "}
                  {VOUCHERS.find((v) => v.id === activeChat)?.source} 協作
                </span>
                <button
                  onClick={() => setActiveChat(null)}
                  className="hover:bg-white/20 p-1 rounded transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="h-48 bg-[#F8F9FA] p-4 overflow-y-auto space-y-3">
                <div className="text-center text-xs text-[#999999] mb-2">
                  關於：{VOUCHERS.find((v) => v.id === activeChat)?.name}
                </div>
                {VOUCHERS.find((v) => v.id === activeChat)?.response && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#009E9D] text-white flex items-center justify-center text-xs flex-shrink-0">
                      {VOUCHERS.find((v) => v.id === activeChat)?.source.charAt(0)}
                    </div>
                    <div className="bg-white border border-[#E5E7EB] p-2 rounded-[6px] rounded-tl-none text-xs text-[#333333]">
                      {VOUCHERS.find((v) => v.id === activeChat)?.response}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-[#E5E7EB] bg-white">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="催件或詢問進度..."
                    className="w-full bg-[#F1F3F5] border-none rounded-[6px] py-2.5 pl-3 pr-10 text-sm focus:ring-1 focus:ring-[#219EBC] outline-none"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-[#219EBC] p-1.5 hover:bg-[#219EBC]/10 rounded-md transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Omni-Note Drawer */}
      {isNoteOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
            <h3 className="font-bold text-amber-800 flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              Omni-Note 萬能筆記
            </h3>
            <button onClick={() => setIsNoteOpen(false)} className="text-amber-600 hover:text-amber-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {notes.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <StickyNote className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">目前還沒有筆記。<br/>點擊「匯出至萬能筆記」來新增！</p>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{note.title}</h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {note.date.split(' ')[1]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{note.content}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-slate-100 bg-white">
            <Button variant="solid" className="w-full bg-amber-600 hover:bg-amber-700 border-amber-600">
              前往完整知識庫
            </Button>
          </div>
        </div>
      )}

      {/* Collaboration Drawer */}
      {isCollabMode && (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl border-l border-slate-200 z-40 flex flex-col transform transition-transform duration-300 ease-in-out" style={{ right: isNoteOpen ? '320px' : '0' }}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50">
            <h3 className="font-bold text-indigo-800 flex items-center gap-2">
              <Users className="w-5 h-5" />
              多人協作與留言
            </h3>
            <button onClick={() => setIsCollabMode(false)} className="text-indigo-600 hover:text-indigo-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 border-b border-slate-100 bg-white">
            <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">目前在線 (3)</p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">我</div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">林</div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">陳</div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full"></div>
              </div>
              <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors ring-2 ring-white border border-dashed border-slate-300">
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {comments.map(comment => (
              <div key={comment.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${comment.avatarColor}`}>
                  {comment.user.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-800">{comment.user}</span>
                    <span className="text-[10px] text-slate-400">{comment.time}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-slate-200 text-sm text-slate-600 leading-relaxed">
                    {comment.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="輸入留言或 @ 同事..."
                className="flex-1 border border-slate-200 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button variant="solid" className="px-3 bg-indigo-600 hover:bg-indigo-700 border-indigo-600" onClick={handleAddComment}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Report Preview Modal */}
      {showFullReportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            onClick={() => setShowFullReportPreview(false)}
          />
          <div className="relative z-10 w-full max-w-4xl">
            <FullReportAuditPreview onClose={() => setShowFullReportPreview(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
