import { 
  LayoutDashboard,
  ShieldCheck,
  Search,
  Database,
  Activity,
  Lock,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Eye,
  Network,
  Rocket,
  Globe,
  History as HistoryIcon,
  Droplets,
  Paintbrush,
  Leaf,
  Cpu,
  Palette,
  Box,
  MousePointer2,
  Share2,
  Fingerprint,
  Layers,
  Monitor,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { GuideStep } from "@/components/ui/guide-stepper";

export const PAGE_GUIDES: Record<string, { title: string; steps: GuideStep[] }> = {
  settings: {
    title: "[OmniESGcell Kernel] 核心設定流程 (5T Protocol / Timeline View)",
    steps: [
      { id: 1, title: "確認底座狀態", desc: "稽核 Kernel 環境變數", icon: Activity, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "選擇代理模式", desc: "切換 AI/手動控制選單", icon: Zap, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "驗證算力引擎", desc: "測試 Gnosis 核心響應", icon: Search, color: "text-blue-500", border: "border-blue-500/20", bg: "bg-blue-500/10" },
      { id: 4, title: "串接溯源網格", desc: "連線 Hash Lock 節點", icon: Network, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
      { id: 5, title: "配置傳輸協議", desc: "設定 SMTP 外部郵件", icon: Rocket, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 6, title: "傳輸沙盒測試", desc: "發送驗證 Sandbox 節點", icon: CheckCircle2, color: "text-status-optimal", border: "border-status-optimal/20", bg: "bg-status-optimal/10" },
      { id: 7, title: "安全層級檢測", desc: "檢查防火牆與憑證級別", icon: ShieldAlert, color: "text-status-lethal", border: "border-status-lethal/20", bg: "bg-status-lethal/10" },
      { id: 8, title: "執行 Hash Lock", desc: "封裝參數並物理簽署", icon: Lock, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
    ]
  },
  dashboard: {
    title: "[智控核心] 全域監測流程 (Operational Protocol)",
    steps: [
      { id: 1, title: "接入全源數據", desc: "匯流範疇一至範疇三數據", icon: Database, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "執行先知饋送", desc: "AI 預判潛在合規風險", icon: Zap, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "同步全境脈動", desc: "檢查 URS 數據鏈狀態", icon: Activity, color: "text-blue-500", border: "border-blue-500/20", bg: "bg-blue-500/10" },
      { id: 4, title: "觸發靈魂導航", desc: "Dr. Thoth 引導今日路徑", icon: Eye, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
      { id: 5, title: "驗證意志動向", desc: "核心指標趨勢分析", icon: Rocket, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 6, title: "確認待辦清單", desc: "執行關鍵合規修復任務", icon: CheckCircle2, color: "text-status-optimal", border: "border-status-optimal/20", bg: "bg-status-optimal/10" },
      { id: 7, title: "發起信任封印", desc: "將今日狀態存入 Immutable Vault", icon: ShieldCheck, color: "text-status-lethal", border: "border-status-lethal/20", bg: "bg-status-lethal/10" },
      { id: 8, title: "完成導航閉環", desc: "更新全域智控面板", icon: Lock, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
    ]
  },
  "omni-truth": {
    title: "[數據核實] 證據追蹤流程 (Verification Logic)",
    steps: [
      { id: 1, title: "定位數據來源", desc: "掃描原始數據發生點", icon: Search, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "提取數位證詞", desc: "檢索引導性文件與簽名", icon: Database, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "交叉對比驗證", desc: "多源數據一致性校驗", icon: Activity, color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
      { id: 4, title: "標註真信評等", desc: "根據證據豐富度給予評級", icon: ShieldCheck, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
    ]
  },
  "omni-src": {
    title: "[報告管理] 數位資產生成流程 (Reporting Protocol)",
    steps: [
      { id: 1, title: "定義揭露邊界", desc: "選擇報告範圍與準則基準", icon: Globe, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "聚合全域數據", desc: "執行 5T 同步拉取數據節點", icon: Database, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "執行 AI 撰述", desc: "將數據轉化為敘事性合規內容", icon: Zap, color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
      { id: 4, title: "完成合規審視", desc: "對標最新國際準則並完成封印", icon: ShieldCheck, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
    ]
  },
  "omni-chrono": {
    title: "[溯源管理] 變更紀錄追蹤流程 (Chronology Protocol)",
    steps: [
      { id: 1, title: "檢索歷史存證", desc: "定位跨時序的區塊鏈存證", icon: HistoryIcon, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "對比數據差異", desc: "分析指標隨時間的波動率", icon: Activity, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "追蹤變更節點", desc: "定位數據修改的執行者與原因", icon: Network, color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
      { id: 4, title: "匯出真相日誌", desc: "生成可供審計的溯源分析報告", icon: Lock, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
    ]
  },
  "omni-aura": {
    title: "[全域感知] 介面與空間美學流程 (Aura Design Protocol)",
    steps: [
      { id: 1, title: "選擇視覺語境", desc: "切換深空或極簡光學模式", icon: LayoutDashboard, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "配置色彩原力", desc: "調整主色調與流體漸層參數", icon: Droplets, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "渲染材質光澤", desc: "優化毛玻璃與玻璃擬態強度", icon: Paintbrush, color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
      { id: 4, title: "全域感知更新", desc: "將設計變更推送至所有萬能節點", icon: Zap, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
    ]
  },
  "omni-supply": {
    title: "[供應鏈映射] 物資與數據流轉流程 (Supply Chain Protocol)",
    steps: [
      { id: 1, title: "繪製供應網格", desc: "可視化 Tier 1 至 Tier N 拓擺網絡", icon: Network, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "測算節點排放", desc: "聚合各供應商範疇三排放指標", icon: Leaf, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "執行傳輸查證", desc: "發起 5T 同步協議與哈希驗證", icon: Cpu, color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
      { id: 4, title: "生成供應溯源", desc: "鎖定物料流轉路徑與透明度憑證", icon: ShieldCheck, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
    ]
  },
  "omni-library": {
    title: "[資訊組件庫] 介面規範與樣式矩陣 (Omni Info Protocol)",
    steps: [
      { id: 1, title: "選擇 Omni 主題", desc: "切換五大主題測試組件適配性", icon: Palette, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "檢閱設計標籤", desc: "核對核心色彩與語意 Token", icon: Box, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "測試交互資訊", desc: "驗證按鈕與開關的動態回饋", icon: MousePointer2, color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
      { id: 4, title: "核對複合組件", desc: "確保複雜數據模塊的一致性", icon: Zap, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
    ]
  },
  "impact-nexus": {
    title: "[影響力連結] 十翼使徒節點運算流程 (Nexus ADK Protocol)",
    steps: [
      { id: 1, title: "初始化節點矩陣", desc: "載入六大影響力計算節點", icon: Layers, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "[07] 任務分派代理", desc: "路由運算任務至指定節點", icon: Network, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "[06] 符文編譯使", desc: "執行 LingoStep 邏輯與運算", icon: Zap, color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
      { id: 4, title: "[05] 零幻覺驗算師", desc: "驗證影響力結果符合 ISO 標準", icon: ShieldCheck, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
      { id: 5, title: "[01][04] 刻印鎖定", desc: "執行 Hash Lock 凍結節點數據", icon: Fingerprint, color: "text-status-optimal", border: "border-status-optimal/20", bg: "bg-status-optimal/10" },
      { id: 6, title: "連結封存歸檔", desc: "將已鎖定節點寫入萬能證據庫", icon: Lock, color: "text-status-lethal", border: "border-status-lethal/20", bg: "bg-status-lethal/10" },
    ]
  },
  "omni-note": {
    title: "[萬能筆記] 無作與悟作時序流程 (Omni Note Protocol)",
    steps: [
      { id: 1, title: "捕捉無作靈感", desc: "自動轉化語音或短句為結構化筆記", icon: Sparkles, color: "text-primary", border: "border-primary/20", bg: "bg-primary/10" },
      { id: 2, title: "標註 5T 維度", desc: "為筆記注入真相與傳輸價值", icon: Box, color: "text-proxy", border: "border-proxy/20", bg: "bg-proxy/10" },
      { id: 3, title: "啟發悟作洞察", desc: "AI 偵測跨域關聯，生成深度見解", icon: Zap, color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
      { id: 4, title: "執行哈希封存", desc: "物理鎖定知識資產，確保不可篡改", icon: ShieldCheck, color: "text-accent", border: "border-accent/20", bg: "bg-accent/10" },
    ]
  }
};
