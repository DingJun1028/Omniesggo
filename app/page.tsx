'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Hexagon, FileText, Sliders, Building2, TrendingDown, 
  ShieldCheck, Database, ArrowRight, BookOpen, Sparkles,
  Layers, CheckCircle2, Award, Activity
} from 'lucide-react';
import { OmniCard, OmniCardContent } from '@/components/omni-base/OmniCard';
import { OmniBadge } from '@/components/omni-base/OmniBadge';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { FacilitiesSpecModal, type FacilitySpecInfo } from '@/components/omni/FacilitiesSpecModal';

const CORE_FACILITIES: FacilitySpecInfo[] = [
  {
    code: 'A01',
    name: '萬能中心與全息中樞',
    enName: 'Omni-Center & Hexa-Core Matrix',
    path: '/omni-center',
    standard: 'OmniCore Hexa-Core Swarm',
    summary: '驅動六位一體智慧中樞（全知之眼、全能之核、全域之脈、全境之骨、全息之腦、全通之心）。全天候自主代謝與共振監控。',
    fiveTSeals: {
      truth: '來源印記標記為 system_heartbeat',
      goodness: '算法公開驗算，排除黑箱',
      beauty: 'Editorial 高對比手冊排版',
      trust: 'SHA-256 狀態封印',
      transferful: '全生命週期代理鉤稽',
    },
    matrixSteps: [
      { phase: '起', step: '意圖感知', originCause: '使用者點擊共振或系統排程心跳', processTrace: 'OmniPulse 廣播至代理節點', finalEffect: '共振率與熵值即時重算' },
      { phase: '承', step: '契約稽核', originCause: '各設施回傳存證與日誌', processTrace: 'OmniBone 檢驗 Zod 契約', finalEffect: '契約合規與異常警告' },
      { phase: '轉', step: '熵減代謝', originCause: '偵測冗餘緩存與過期憑證', processTrace: 'OmniBrain 自動調用熵減腳本', finalEffect: '記憶體代謝與 KIs 知識沉澱' },
      { phase: '合', step: '狀態鎖定', originCause: '全域共識達成', processTrace: 'Hash Lock 執行密碼學封印', finalEffect: '不可篡改神聖結界確立' },
      { phase: '終', step: '全通顯化', originCause: '治理結果確立', processTrace: '終始矩陣即時顯化', finalEffect: '戰情看板即時同步' },
    ],
  },
  {
    code: 'A02',
    name: '永續報告中心與動態表單引擎',
    enName: 'ESG Reports Center & Dynamic Form Engine',
    path: '/sustain-write',
    standard: 'GRI 2024 / CSRD ESRS',
    summary: '全流程三欄式永續報告書編撰工作台，支援章節大綱導覽、動態欄位公式校驗、即時雙主題手冊印刷預覽與 5T Hash Lock 封印。',
    fiveTSeals: {
      truth: '每一章節綁定 source_origin',
      goodness: 'ISO 14064-1 & 能源署係數驗算',
      beauty: '即時雙主題印刷預覽',
      trust: '全書 SHA-256 雜湊鎖定',
      transferful: '章節進度全週期監控',
    },
    matrixSteps: [
      { phase: '起', step: '大綱建立', originCause: '選定 GRI / CSRD 準則範本', processTrace: '自動生成標準指標清冊', finalEffect: '章節目錄樹就緒' },
      { phase: '承', step: '數據錄入', originCause: '企業填報各部門 ESG 指標', processTrace: '動態表單即時型別與公式檢查', finalEffect: '合規數據無縫暫存' },
      { phase: '轉', step: '排版預覽', originCause: '章節內容即時渲染', processTrace: '雙主題手冊印刷排版轉換', finalEffect: '所見即所得報告預覽' },
      { phase: '合', step: '密碼封印', originCause: '點擊完成報告確信', processTrace: '計算全報告特徵雜湊', finalEffect: '產生不可逆 Hash Lock' },
      { phase: '終', step: '憑證發布', originCause: '審計通過確認', processTrace: '產出可印刷 PDF 與 JSON', finalEffect: '官方永續報告書誕生' },
    ],
  },
  {
    code: 'A03',
    name: '智能解析與審計查證工作站',
    enName: 'OmniParser & 5T Verifier Workstation',
    path: '/parser',
    standard: 'ISO 14064-1 / SHA-256 Verifier',
    summary: '非結構化 PDF 報告書批量解析、範疇一二三碳排數據自動提取，並提供獨立第三方查驗通道比對資料庫不可篡改存證。',
    fiveTSeals: {
      truth: 'PDF 二進位特徵對齊',
      goodness: '溫室氣體排碳係數自動換算',
      beauty: '官方防偽憑證列印排版',
      trust: '密碼學 SHA-256 比對',
      transferful: '解析審計軌跡全紀錄',
    },
    matrixSteps: [
      { phase: '起', step: '報告上傳', originCause: 'PDF 報告書或 Hash Lock 輸入', processTrace: '文字流提取與 OCR 校驗', finalEffect: '結構化文字流' },
      { phase: '承', step: '碳排分類', originCause: '辨識 Scope 1/2/3 數據標籤', processTrace: '自動加總與單位轉換', finalEffect: '範疇碳排清冊生成' },
      { phase: '轉', step: '真偽查核', originCause: '比對 DB/Vault 封印指紋', processTrace: 'SHA-256 雜湊碰撞驗算', finalEffect: '合規真偽判定報告' },
      { phase: '合', step: '憑證刻印', originCause: '驗證成功確信', processTrace: '綁定查驗機構與時間戳記', finalEffect: '5T Verified 印記確立' },
      { phase: '終', step: '證書輸出', originCause: '稽核員請求證明', processTrace: '產出官方 Printable Certificate', finalEffect: '防偽數位證書' },
    ],
  },
  {
    code: 'A04',
    name: '雙重重大性策略評估矩陣',
    enName: 'Double Materiality Strategy Matrix',
    path: '/materiality',
    standard: 'EU CSRD / GRI 3 Compliant',
    summary: 'CSRD 雙重實質性戰略羅盤，將「衝擊重大性」與「財務重大性」轉化為即時交互之 2D 散佈圖與四象限重大議題矩陣。',
    fiveTSeals: {
      truth: '利害關係人問卷來源存證',
      goodness: '5分制雙向權重公開計算',
      beauty: '動態散佈矩陣與光芒節點',
      trust: '矩陣版本 SHA-256 鎖定',
      transferful: '重大議題連動報告章節',
    },
    matrixSteps: [
      { phase: '起', step: '問卷採集', originCause: '利害關係人與主管評估輸入', processTrace: '歸納為 E/S/G 三大維度議題', finalEffect: '原始評分數據集' },
      { phase: '承', step: '門檻設定', originCause: '自訂重大性閥值 (1.0~5.0)', processTrace: '散佈圖動態虛線連動篩選', finalEffect: '高重大議題清單浮現' },
      { phase: '轉', step: '四象限分群', originCause: '交叉衝擊與財務維度', processTrace: '2D 座標幾何投影運算', finalEffect: '策略優先序排定' },
      { phase: '合', step: '矩陣封印', originCause: '董事會審批確立', processTrace: '全議題評分與理由 Hash Lock', finalEffect: '不可篡改評估版本' },
      { phase: '終', step: '章節輸出', originCause: '驅動報告撰寫', processTrace: '自動匯出 CSRD 合規 JSON/PDF', finalEffect: '回流至 A02 報告中心' },
    ],
  },
  {
    code: 'A05',
    name: '供應鏈永續盡職調查戰情室',
    enName: 'Supply Chain CSDD War Room',
    path: '/supply-chain',
    standard: 'EU CSDD & Germany LkSG',
    summary: '穿透式供應商治理、Tier 1/2 階層圖譜、AI 文字審查、ESG 評級與風險預警，簽發 5T 供應商合規背書憑證。',
    fiveTSeals: {
      truth: '供應商 SAQ 與 ISO 證號查驗',
      goodness: 'ESG 三維度透明評分算法',
      beauty: '雙主題戰情卡片與評級標章',
      trust: '供應商評鑑 SHA-256 封印',
      transferful: '採購簽約與範疇三全追蹤',
    },
    matrixSteps: [
      { phase: '起', step: '廠商登錄', originCause: '輸入供應商名稱與報告文本', processTrace: '自動辨識產業與供應階層', finalEffect: '待審核檔案建立' },
      { phase: '承', step: 'AI 盡調', originCause: '執行文字萃取與合規比對', processTrace: '評定 E/S/G 個別分數與等級', finalEffect: '評鑑雷達與優缺點分析' },
      { phase: '轉', step: '輔導建議', originCause: '辨識弱點與違規風險', processTrace: '產出矯正行動清單 (CAP)', finalEffect: '客製化改善策略' },
      { phase: '合', step: '評鑑鎖定', originCause: '審查合格發布', processTrace: '生成供應商專屬 Hash Lock', finalEffect: '防偽審計紀錄凍結' },
      { phase: '終', step: '憑證核發', originCause: '完成入冊與採購背書', processTrace: '核發官方合格證書與匯出', finalEffect: '合格供應商名錄' },
    ],
  },
  {
    code: 'A06',
    name: '碳排放計算與減碳路徑規劃站',
    enName: 'Carbon Accounting & MACC Roadmap',
    path: '/carbon',
    standard: 'ISO 14064-1 / SBTi 1.5°C / MACC',
    summary: '溫室氣體範疇一二三盤查、本地 AI 減碳策略推演、SBTi 1.5°C 淨零軌跡試算與邊際減碳成本 (MACC) 專案矩陣。',
    fiveTSeals: {
      truth: '能源署與環境部排碳係數標定',
      goodness: 'MACC 減碳成本公式透明',
      beauty: '淨零里程碑視覺化軌跡',
      trust: '減碳承諾專案 SHA-256 封印',
      transferful: 'SLL 永續連結貸款查核連動',
    },
    matrixSteps: [
      { phase: '起', step: '邊界盤查', originCause: '輸入活動數據與燃料電費', processTrace: '套用 ISO 14064-1 標準係數', finalEffect: '範疇一二三排放總量' },
      { phase: '承', step: 'AI 顧問', originCause: '呼叫本地端推論模型', processTrace: '行業痛點分析與潛力評分', finalEffect: '短長期減碳行動建議' },
      { phase: '轉', step: 'MACC 試算', originCause: '規劃能效/綠電/電氣化措施', processTrace: '計算每噸減碳成本與 CAPEX', finalEffect: '邊際減碳成本曲線' },
      { phase: '合', step: '路徑封印', originCause: '設定 2030/2050 減碳承諾', processTrace: 'Hash Lock 鎖定投資計畫', finalEffect: '不可篡改淨零藍圖' },
      { phase: '終', step: '金融連動', originCause: '提報銀行與投資人查核', processTrace: '匯出標準路徑憑證 (PDF/JSON)', finalEffect: '永續金融合規憑證' },
    ],
  },
  {
    code: 'A07',
    name: '信任錨定與區塊鏈存證中心',
    enName: 'Trust Anchor & 5T Evidence Vault',
    path: '/trust',
    standard: '5T Protocol / Merkle Tree ZKP',
    summary: '抵禦漂綠防線：不可篡改證據金庫 (Evidence Vault)、5T 治理健康度監控、異質數據橋接 (Data Bridge) 與零知識證明封印。',
    fiveTSeals: {
      truth: '100% 原始數據來源勾稽',
      goodness: '算法公開可驗，無黑箱操作',
      beauty: '雙主題沉浸式儀表板',
      trust: 'Merkle Tree 密碼學 Hash Lock',
      transferful: '跨系統安全管線實時監聽',
    },
    matrixSteps: [
      { phase: '起', step: '管線攝取', originCause: 'ERP / SCADA / IoT 數據匯入', processTrace: 'Data Bridge 格式清洗與檢驗', finalEffect: '標準化數據封包' },
      { phase: '承', step: '5T 檢驗', originCause: '流入治理骨幹', processTrace: '五道門徑依序嚴格評分驗證', finalEffect: '合規驗證通過' },
      { phase: '轉', step: 'Merkle 構建', originCause: '聚合批量存證資產', processTrace: '二進位特徵雜湊樹運算', finalEffect: '生成 Merkle Root 根雜湊' },
      { phase: '合', step: 'ZKP 封印', originCause: '執行冷光金庫鎖定', processTrace: '產生唯一 SHA-256 存證戳記', finalEffect: 'Evidence Vault 永久凍結' },
      { phase: '終', step: '全球稽核', originCause: '外部監管或稽核調閱', processTrace: '公開防偽雜湊查詢通道', finalEffect: '絕對數位誠信確立' },
    ],
  },
  {
    code: 'A08',
    name: '全通記憶與對齊引擎',
    enName: 'OmniMemory & Alignment Engine',
    path: '/omni-memory',
    standard: 'OmniCore Memory Matrix v1.0',
    summary: '借鑑 Meta Muse 架構的動態長期記憶系統，具備「記憶節點 (Memory)」、「夢境萃取 (Dreams)」與「遺忘衰減 (Forgetting)」三機制，賦予 OmniAgent Swarm 自我演化與個人化對齊能力。',
    fiveTSeals: {
      truth: '所有記憶節點夾帶 sourceOrigin 溯源印記',
      goodness: 'Confidence 信心度公開演算，JSONB 零黑箱',
      beauty: 'Editorial 雙主題記憶矩陣儀表板',
      trust: '核心規則節點 SHA-256 Hash Lock 封印',
      transferful: '夢境引擎每日合成 OMNI_ALIGNMENT.md',
    },
    matrixSteps: [
      { phase: '起', step: '記憶攝取', originCause: '代理互動或使用者行為觸發', processTrace: 'SyncEngine 離線佇列安全寫入', finalEffect: '新記憶節點建立並索引' },
      { phase: '承', step: '關鍵字索引', originCause: '記憶節點入庫', processTrace: 'JSONB 零成本全文搜尋標注', finalEffect: '精準低延遲記憶檢索就緒' },
      { phase: '轉', step: '夢境萃取', originCause: '每日 03:00 PM2 Cron 觸發', processTrace: 'Transcript 關鍵偏好自動提煉', finalEffect: '新 thought 節點注入記憶庫' },
      { phase: '合', step: '遺忘衰減', originCause: '信心度低於 0.35 閾值', processTrace: '舊記憶歸檔或刪除清理', finalEffect: '記憶庫熵值受控，語境精準' },
      { phase: '終', step: '對齊合成', originCause: '夢境完成後自動觸發', processTrace: '高信心度記憶萃取寫入 OMNI_ALIGNMENT.md', finalEffect: 'JunAiKey 靈魂文件更新完成' },
    ],
  },
];

const FIVE_T = [
  { symbol: 'T¹', label: 'Traceable', zh: '可溯源', desc: '來源印記不可偽造' },
  { symbol: 'T²', label: 'Transparent', zh: '可驗算', desc: '演算法公開透明' },
  { symbol: 'T³', label: 'Tangible', zh: '可感知', desc: '高對比手冊印刷質感' },
  { symbol: 'T⁴', label: 'Trustworthy', zh: '不可篡改', desc: 'SHA-256 密碼學封印' },
  { symbol: 'T⁵', label: 'Trackable', zh: '可追蹤', desc: '全生命週期精確勾稽' },
];

export default function HomePage() {
  const router = useRouter();
  const [selectedSpec, setSelectedSpec] = useState<FacilitySpecInfo | null>(null);

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* ── 英雄視界 (Hero Section) ── */}
      <section className="relative pt-16 pb-12 px-4 sm:px-6 text-center flex flex-col items-center justify-center">
        <div className="flex items-center gap-2 mb-4">
          <OmniBadge variant="teal">OmniSub Editorial Framework</OmniBadge>
          <OmniBadge variant="emerald">5T Canonical Matrix v3.0</OmniBadge>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl">
          ESGGO 善向永續設施總匯
        </h1>
        <p className="text-base sm:text-lg text-teal-800 dark:text-cyan-300 font-bold tracking-widest mt-3">
          全通之心 · 無作妙德 · 5T 終始矩陣閉環
        </p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mt-2 leading-relaxed">
          以 5T 協議驅動的 A01~A08 核心永續治理工作台 — 從碳排計算、重大性矩陣到防偽報告，乃至 OmniMemory 自演化記憶引擎，嚴格零文字漸層、全手冊高對比雙主題。
        </p>

        {/* 5T Protocol Live Bar */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-8">
          {FIVE_T.map((t) => (
            <div
              key={t.symbol}
              className="flex flex-col items-center px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-teal-500/60"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-teal-700 dark:text-cyan-400">{t.symbol}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t.zh}</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── A01~A07 核心設施戰情矩陣 (Facilities War Room Grid) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 w-full">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
              A01 ~ A08 核心治理設施矩陣 (Core Facilities Matrix)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              各設施皆具備完整「終始矩陣功能說明書」與「5T 密碼學 Hash Lock 封印」
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-teal-700 dark:text-cyan-400 bg-teal-50 dark:bg-cyan-950/40 px-3 py-1 rounded-full border border-teal-200 dark:border-cyan-500/30">
            8 設施在線運作中
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_FACILITIES.map((fac) => (
            <OmniCard 
              key={fac.code}
              variant="glass"
              className="flex flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/50"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-mono font-black bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                      {fac.code}
                    </span>
                    <OmniBadge variant="emerald">{fac.standard}</OmniBadge>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mt-1"></span>
                </div>

                {/* Facility Titles */}
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {fac.name}
                </h3>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-3">
                  {fac.enName}
                </p>

                {/* Facility Summary */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-4">
                  {fac.summary}
                </p>
              </div>

              {/* Card Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedSpec(fac)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-teal-700 dark:text-cyan-400 hover:bg-teal-50 dark:hover:bg-slate-800 border border-teal-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  終始說明書
                </button>

                <OmniButton
                  variant="primary"
                  onClick={() => router.push(fac.path)}
                  className="text-xs py-1.5 px-3"
                >
                  啟動工作台
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </OmniButton>
              </div>
            </OmniCard>
          ))}
        </div>
      </section>

      {/* ── 5T 終始矩陣功能說明書 預覽彈窗 ── */}
      <FacilitiesSpecModal
        facility={selectedSpec}
        onClose={() => setSelectedSpec(null)}
        onNavigate={(path) => router.push(path)}
      />

      {/* ── 底部系統狀態 ── */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-4 sm:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold">OmniCore ♾️ ESGGO · 5T Protocol Active</span>
        </div>
        <div className="text-teal-700 dark:text-cyan-400 font-bold">
          上善若水，善向永續。服務即教學，知識即資產。
        </div>
        <div className="font-semibold">
          Editorial Framework · Zero Text Gradients
        </div>
      </footer>

    </div>
  );
}
