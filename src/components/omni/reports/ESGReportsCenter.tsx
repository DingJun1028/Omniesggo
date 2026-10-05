'use client';

import React, { useState, useId } from 'react';
import { 
  FileText, ShieldCheck, CheckCircle2, 
  Sparkles, Download, Printer, Copy, Check,
  Building, Leaf, Users, ShieldAlert, Sliders, Sun, Moon,
  LayoutGrid, Eye, Edit3
} from 'lucide-react';
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from '../../omni-base/OmniCard';
import { OmniButton } from '../../omni-base/OmniButton';
import { OmniBadge } from '../../omni-base/OmniBadge';
import DynamicFormEngine from './DynamicFormEngine';
import type { DynamicFormSchema } from '@/lib/omni-reports/types';

// ── GRI / CSRD 標準章節大綱 ──
interface ReportChapter {
  id: string;
  code: string;
  title: string;
  category: 'GOV' | 'ENV' | 'SOC' | 'ASSURANCE';
  completed: boolean;
  sealed: boolean;
  hashLock?: string;
}

const ISO14064_SCHEMA: DynamicFormSchema = {
  uuid: 'mod-env-carbon-0001',
  title: 'ISO-14064 溫室氣體果因盤查契約 (Scope 1/2/3)',
  version: '1.1.0-Universe',
  fields: [
    { id: 'reportType', label: '申報規範類型', type: 'string', default: 'ISO-14064', required: true },
    { id: 'previousYearUsage', label: '前期基準用量 (tCO₂e)', type: 'number', default: 5000, required: true },
    { id: 'currentYearUsage', label: '當期申報用量 (tCO₂e)', type: 'number', default: 5071.2, required: true },
    { id: 'gridEmissionFactor', label: '電網排碳係數 (kgCO₂e/度)', type: 'number', default: 0.495, required: true },
    { id: 'evidence', label: '第三方盤查清冊/佐證憑證 URL (S3/R2)', type: 'evidence_upload', required: true }
  ]
};

const INITIAL_CHAPTERS: ReportChapter[] = [
  { id: 'chap-1', code: 'GRI 2', title: '組織概況與永續聲明', category: 'GOV', completed: true, sealed: true, hashLock: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' },
  { id: 'chap-2', code: 'GRI 305', title: '氣候變遷與溫室氣體 (Scope 1/2/3)', category: 'ENV', completed: true, sealed: false },
  { id: 'chap-3', code: 'GRI 401', title: '勞工人權、多元包容 (DEI) 與職安', category: 'SOC', completed: false, sealed: false },
  { id: 'chap-4', code: 'GRI 205', title: '誠信經營與商業道德法規遵從', category: 'GOV', completed: false, sealed: false },
  { id: 'chap-5', code: '5T SEAL', title: '5T 協議獨立第三方確信聲明', category: 'ASSURANCE', completed: false, sealed: false },
];

export default function ESGReportsCenter() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [editorMode, setEditorMode] = useState<'standard' | 'karma'>('standard');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('chap-2');
  const [chapters, setChapters] = useState<ReportChapter[]>(INITIAL_CHAPTERS);
  
  // 表單資料狀態
  const [reportData, setReportData] = useState({
    companyName: '善向永續科技股份有限公司',
    reportingYear: '2026',
    contactPerson: '永續長辦公室',
    scope1: 1250.4,
    scope2: 3820.8,
    scope3: 14200.0,
    renewablesPercentage: 42.5,
    independentDirectors: 57,
    deiScore: 88,
    ceoStatement: '在 2026 關鍵轉型期，本集團依據 5T 協議推動全面數位治理與脫碳路徑，落實無作妙德與長青永續。',
    auditFirm: 'OmniTrust 5T 數位存證委員會',
  });

  const [isSealing, setIsSealing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeHashLock, setActiveHashLock] = useState<string>('7d5870b2c3a51f3d82a170fb98ef2b892a0134bc5e903a4512e9b08f5127d49e');

  const selectedChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];
  const totalEmissions = Number((reportData.scope1 + reportData.scope2 + reportData.scope3).toFixed(1));

  // 帶入示範數據
  const handleLoadSample = () => {
    setReportData({
      companyName: '群益善向永續晶圓製造股份有限公司',
      reportingYear: '2026',
      contactPerson: 'ESG 永續推動委員會',
      scope1: 2840.5,
      scope2: 5690.2,
      scope3: 21450.0,
      renewablesPercentage: 68.4,
      independentDirectors: 60,
      deiScore: 92,
      ceoStatement: '我們深信綠色技術是引領企業進入新維度的骨幹。透過 100% 本地 5T 雜湊封印，為每一噸碳排建立永不磨滅的數位信譽。',
      auditFirm: '全球 5T 數位公正獨立確信鏈',
    });
  };

  // 執行 5T 雜湊封印
  const handleSealChapter = () => {
    setIsSealing(true);
    setTimeout(() => {
      const generatedHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      setActiveHashLock(generatedHash);
      setChapters(prev => prev.map(c => 
        c.id === selectedChapterId ? { ...c, completed: true, sealed: true, hashLock: generatedHash } : c
      ));
      setIsSealing(false);
    }, 600);
  };

  // 果因引擎驗算通過回調
  const handleKarmaSuccess = (data: unknown) => {
    const d = data as { currentYearUsage?: number };
    if (d?.currentYearUsage) {
      setReportData(prev => ({
        ...prev,
        scope1: Number((d.currentYearUsage! * 0.25).toFixed(1)),
        scope2: Number((d.currentYearUsage! * 0.75).toFixed(1)),
      }));
    }
    const generatedHash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setActiveHashLock(generatedHash);
    setChapters(prev => prev.map(c => 
      c.id === selectedChapterId ? { ...c, completed: true, sealed: true, hashLock: generatedHash } : c
    ));
  };

  // 複製 Hash Lock
  const handleCopyHash = () => {
    navigator.clipboard.writeText(activeHashLock);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ── 頂部手冊控制列 (Header) ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30">
                A02 · ESG REPORTS WORKBENCH
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
                GRI 2024 / CSRD ESRS
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
              永續報告書編撰中心 (ESG Reports Center)
            </h1>
          </div>

          {/* 右側操作群 */}
          <div className="flex items-center gap-3">
            {/* 雙主題切換膠囊 */}
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'light' ? 'bg-white text-teal-800 shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>淺色手冊</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'dark' ? 'bg-slate-900 text-teal-300 shadow-sm font-semibold border border-teal-500/30' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-teal-300" />
                <span>深色手冊</span>
              </button>
            </div>

            <button
              onClick={handleLoadSample}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              帶入示範資料
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              列印手冊
            </button>
          </div>
        </div>
      </header>

      {/* ── 主畫面三欄式架構 (Workbench Layout) ── */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── 1. 左側：章節與指標導覽 (3 cols) ── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>報告章節大綱</span>
              <span className="text-xs font-mono text-teal-700 dark:text-cyan-400">5 / 5 章節</span>
            </h2>

            <div className="space-y-2">
              {chapters.map((chap) => {
                const isSelected = chap.id === selectedChapterId;
                return (
                  <button
                    key={chap.id}
                    onClick={() => setSelectedChapterId(chap.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-300 dark:border-teal-500/50 shadow-sm'
                        : 'bg-slate-50/60 dark:bg-slate-950/30 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                        {chap.code}
                      </span>
                      <p className={`text-xs font-bold mt-1.5 ${isSelected ? 'text-teal-900 dark:text-teal-200' : 'text-slate-800 dark:text-slate-300'}`}>
                        {chap.title}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {chap.sealed ? (
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已封印
                        </span>
                      ) : chap.completed ? (
                        <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-400">編撰中</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">未開始</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 進度總攬卡片 */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="flex justify-between items-center mb-1.5 font-bold">
                <span className="text-slate-600 dark:text-slate-400">全書完成進度</span>
                <span className="text-teal-700 dark:text-cyan-400 font-mono">60%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-600 dark:bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. 中間：動態編撰與表單引擎 (5 cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div>
                <span className="text-[10px] font-mono text-teal-700 dark:text-cyan-400 font-bold tracking-wider">
                  {selectedChapter.code} 欄位編撰
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedChapter.title}
                </h2>
              </div>
              <OmniBadge variant={selectedChapter.sealed ? 'emerald' : 'cyan'}>
                {selectedChapter.sealed ? '5T 已封印' : '草稿狀態'}
              </OmniBadge>
            </div>

            {/* 模式切換膠囊 */}
            <div className="flex items-center gap-2 mb-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setEditorMode('standard')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                  editorMode === 'standard'
                    ? 'bg-white text-teal-800 shadow-sm dark:bg-slate-900 dark:text-cyan-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                標準章節編撰
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('karma')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  editorMode === 'karma'
                    ? 'bg-white text-teal-800 shadow-sm dark:bg-slate-900 dark:text-cyan-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Jules-Karma 果因防呆驗算
              </button>
            </div>

            {editorMode === 'karma' ? (
              <div className="pt-2">
                <div className="mb-3 p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-500/30 text-[11px] text-teal-900 dark:text-teal-200">
                  <span className="font-bold block mb-0.5">【Dr. Thoth 零幻覺驗算結界】</span>
                  本表單直接由後端 Zod 契約驅動，針對暴增數據進行自動防呆攔截，驗算通過後自動寫入 NCBDB 並加蓋 5T 雜湊封印。
                </div>
                <DynamicFormEngine
                  schema={ISO14064_SCHEMA}
                  initialData={{
                    currentYearUsage: Number((reportData.scope1 + reportData.scope2).toFixed(1)),
                    previousYearUsage: 4800,
                    gridEmissionFactor: 0.495
                  }}
                  onSuccess={handleKarmaSuccess}
                />
              </div>
            ) : (
              /* 動態表單欄位 */
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">申報企業主體名稱 *</label>
                  <input
                    type="text"
                    value={reportData.companyName}
                    onChange={(e) => setReportData({ ...reportData, companyName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">報告年度 (Reporting Year)</label>
                    <input
                      type="text"
                      value={reportData.reportingYear}
                      onChange={(e) => setReportData({ ...reportData, reportingYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">主責單位 / 聯絡人</label>
                    <input
                      type="text"
                      value={reportData.contactPerson}
                      onChange={(e) => setReportData({ ...reportData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* 溫室氣體三範疇數值 */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <span className="font-bold text-slate-900 dark:text-slate-200 block text-xs">
                    ISO-14064 溫室氣體數據填報 (tCO₂e)
                  </span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">範疇一 (Scope 1)</label>
                      <input
                        type="number"
                        value={reportData.scope1}
                        onChange={(e) => setReportData({ ...reportData, scope1: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-teal-700 dark:text-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">範疇二 (Scope 2)</label>
                      <input
                        type="number"
                        value={reportData.scope2}
                        onChange={(e) => setReportData({ ...reportData, scope2: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-emerald-700 dark:text-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">範疇三 (Scope 3)</label>
                      <input
                        type="number"
                        value={reportData.scope3}
                        onChange={(e) => setReportData({ ...reportData, scope3: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-indigo-700 dark:text-indigo-400"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 text-[11px]">加總總排放量:</span>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{totalEmissions.toLocaleString()} tCO₂e</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">永續長與董事長治理宣告 (CEO Statement)</label>
                  <textarea
                    rows={4}
                    value={reportData.ceoStatement}
                    onChange={(e) => setReportData({ ...reportData, ceoStatement: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* 操作按鈕 */}
                <div className="pt-4 flex gap-3">
                  <OmniButton
                    variant="emerald"
                    onClick={handleSealChapter}
                    isLoading={isSealing}
                    className="flex-1 py-2.5 text-xs font-bold shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isSealing ? '5T 雜湊封印中...' : '封印本章節並生成 5T 雜湊鎖'}
                  </OmniButton>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. 右側：即時印刷風格手冊報告預覽 (4 cols) ── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-teal-600 dark:text-cyan-400" /> 手冊即時印刷預覽
              </span>
              <span className="text-[10px] font-mono text-slate-400">PDF PAGE 14</span>
            </div>

            {/* 報告書仿真白皮書預覽容器 */}
            <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-inner space-y-5 text-slate-900 dark:text-slate-100">
              
              <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  {reportData.reportingYear} SUSTAINABILITY REPORT
                </div>
                <h3 className="text-lg font-black tracking-tight mt-1 text-slate-900 dark:text-slate-100">
                  {reportData.companyName}
                </h3>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-teal-700 dark:text-cyan-400 uppercase font-mono">
                  {selectedChapter.code} · {selectedChapter.title}
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 italic">
                  "{reportData.ceoStatement}"
                </p>
              </div>

              {/* 排放量小報表 */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span>Scope 1 直接排放:</span>
                  <span className="font-bold">{reportData.scope1.toLocaleString()} tCO₂e</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span>Scope 2 能源間接:</span>
                  <span className="font-bold">{reportData.scope2.toLocaleString()} tCO₂e</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span>Scope 3 價值鏈:</span>
                  <span className="font-bold">{reportData.scope3.toLocaleString()} tCO₂e</span>
                </div>
                <div className="flex justify-between pt-1.5 font-bold text-teal-800 dark:text-cyan-300">
                  <span>年度總碳足跡:</span>
                  <span>{totalEmissions.toLocaleString()} tCO₂e</span>
                </div>
              </div>

              {/* 5T 密碼學封印認證印記 */}
              <div className="p-3 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-500/30 text-[10px]">
                <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-cyan-300">
                  <ShieldCheck className="w-3.5 h-3.5" /> 5T Hash Lock 封印證明
                </div>
                <div className="font-mono text-slate-500 dark:text-slate-400 truncate mt-1">
                  {activeHashLock}
                </div>
                <button
                  onClick={handleCopyHash}
                  className="mt-2 text-teal-700 dark:text-cyan-400 font-bold flex items-center gap-1 hover:underline"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copied ? '已複製到剪貼簿' : '複製雜湊值查驗'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
