'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { OmniCard, OmniCardContent, OmniCardHeader, OmniCardTitle } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';
import {
  FileText,
  Database,
  Wand2,
  Eye,
  Download,
  CheckCircle2,
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Building2,
  XCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// 5T Transparent: every constant below mirrors a real server-side source of truth.
//   FRAMEWORKS   -> createTask() chapterMap in src/core/services/async-task-manager.ts
//   Company      -> GET /api/sustain-write/v5/async  (getV5Companies)
//   TaskProgress -> GET /api/sustain-write/v5/progress/:taskId
// No simulated progress: the UI reads the same task object the API polls.
// ═══════════════════════════════════════════════════════════════════════════════

const API_ASYNC = '/api/sustain-write/v5/async';
const POLL_INTERVAL_MS = 1200;

const FRAMEWORKS = [
  { id: 'gri', label: 'GRI 2021', chapters: 28, note: '通用永續揭露準則 · 完整章節結構' },
  { id: 'tcfd', label: 'TCFD', chapters: 12, note: '氣候相關財務資訊揭露' },
  { id: 'investor', label: '投資人簡報', chapters: 5, note: '董事會摘要版本' },
] as const;

interface Company {
  id: string;
  name: string;
  shortName: string;
  industry: string;
}

type TaskStatus = 'pending' | 'running' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface TaskResult {
  totalWords: number;
  totalTags: number;
  trinityHash: string;
  durationMs: number;
  companyId: string;
}

interface TaskProgress {
  taskId: string;
  status: TaskStatus;
  currentChapter: number;
  totalChapters: number;
  chapterTitle: string;
  wordsSoFar: number;
  fiveTGate: string;
  tagsCreated: number;
  percent: number;
  error?: string;
  result?: TaskResult;
}

const TERMINAL: TaskStatus[] = ['completed', 'failed', 'cancelled'];

export default function SustainWritePage() {
  const [step, setStep] = useState(1);

  // ── Step 1: real company + framework selection ──────────────────────────
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [frameworkId, setFrameworkId] = useState<string>('gri');
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  // ── Step 3: real render options ─────────────────────────────────────────
  const [wantCharts, setWantCharts] = useState(true);
  const [wantImagery, setWantImagery] = useState(true);

  // ── Step 4/5: real task state ───────────────────────────────────────────
  const [task, setTask] = useState<TaskProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const taskIdRef = useRef<string>('');

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Load the real company list from the v5 API (no hard-coded mock companies).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_ASYNC, { cache: 'no-store' });
        const body = (await res.json()) as { success?: boolean; data?: { companies?: Company[] } };
        if (cancelled) return;
        if (!res.ok || !body.success || !body.data?.companies?.length) {
          setCompaniesError(`API 回應異常 (HTTP ${res.status})：無法載入公司清單。`);
          return;
        }
        setCompanies(body.data.companies);
        setCompanyId(body.data.companies[0]?.id ?? '');
      } catch {
        if (!cancelled) setCompaniesError('無法連線至 v5 生成服務，請確認後端已啟動。');
      } finally {
        if (!cancelled) setCompaniesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const selectedCompany = companies.find((c) => c.id === companyId) ?? null;
  const selectedFramework = FRAMEWORKS.find((f) => f.id === frameworkId) ?? FRAMEWORKS[0];

  // ── Step 4: start real generation + poll real progress ───────────────────
  const pollProgress = useCallback(() => {
    stopPolling();
    timerRef.current = setInterval(async () => {
      const id = taskIdRef.current;
      if (!id) return;
      try {
        const res = await fetch(`/api/sustain-write/v5/progress/${encodeURIComponent(id)}`, {
          cache: 'no-store',
        });
        const body = (await res.json()) as { success?: boolean; data?: TaskProgress };
        if (!res.ok || !body.success || !body.data) return;

        const next = body.data;
        setTask(next);
        if (TERMINAL.includes(next.status)) {
          stopPolling();
          setIsGenerating(false);
          setStep(next.status === 'completed' ? 5 : 4);
        }
      } catch {
        // Transient network blip: keep polling, the task keeps running server-side.
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const startGeneration = useCallback(async () => {
    setStartError(null);
    setIsGenerating(true);
    setStep(4);
    try {
      const res = await fetch(API_ASYNC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          templateId: frameworkId,
          renderOptions: { charts: wantCharts, imagery: wantImagery },
        }),
      });
      const body = (await res.json()) as { success?: boolean; data?: { taskId?: string } };
      const newTaskId = body.data?.taskId;
      if (!res.ok || !body.success || !newTaskId) {
        throw new Error(`啟動失敗 (HTTP ${res.status})`);
      }
      taskIdRef.current = newTaskId;
      pollProgress();
    } catch (err) {
      setIsGenerating(false);
      setStep(3);
      setStartError(err instanceof Error ? err.message : '啟動生成任務失敗');
    }
  }, [companyId, frameworkId, wantCharts, wantImagery, pollProgress]);

  // 5T Transparent — the toggles must travel with every preview/download URL,
  // otherwise the route renders its defaults and the switch appears inert.
  const renderQuery = `charts=${wantCharts ? 1 : 0}&imagery=${wantImagery ? 1 : 0}`;

  const cancelGeneration = useCallback(async () => {
    const id = taskIdRef.current;
    if (!id) return;
    stopPolling();
    setIsGenerating(false);
    try {
      await fetch(`/api/sustain-write/v5/progress/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      // Cancellation is best-effort; the server also enforces its own timeout.
    }
  }, [stopPolling]);

  const canStart = Boolean(companyId) && !isGenerating && !startError;

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-slate-900/40 border border-emerald-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 -mt-20 -ml-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
              萬能永續報告產生器 (Omni Sustain-Write)
            </h1>
            <div className="text-sm text-emerald-100/60 font-medium mt-1">
              v5 真實生成管線 · 逐章 AI 生成 · 5T 驗證 · 圖文並茂自動排版
            </div>
          </div>
        </div>
        <OmniBadge variant="glass" className="relative z-10">
          資料源：GET {API_ASYNC}
        </OmniBadge>
      </div>

      {/* Stepper Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full -z-10" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full -z-10 transition-all duration-700"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          />
          {[
            { icon: FileText, label: '框架與大綱' },
            { icon: Database, label: '智庫數據對接' },
            { icon: Wand2, label: '視覺與樣式' },
            { icon: Loader2, label: '巨量生成與排版' },
            { icon: Eye, label: '預覽與導出' },
          ].map((s, i) => {
            const num = i + 1;
            const isActive = step === num;
            const isPassed = step > num;
            return (
              <div key={num} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                    isActive
                      ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : isPassed
                        ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                        : 'bg-slate-900 border-slate-700 text-slate-500'
                  }`}
                >
                  <s.icon size={18} className={isActive && num === 4 && isGenerating ? 'animate-spin' : ''} />
                </div>
                <span
                  className={`text-xs font-bold ${
                    isActive ? 'text-emerald-400' : isPassed ? 'text-emerald-500/80' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <OmniCard glow className="min-h-[500px]">
        <OmniCardHeader>
          <OmniCardTitle>
            {step === 1 && '步驟一：定義報告框架與生成大綱'}
            {step === 2 && '步驟二：OmniBrain RAG 數據對接'}
            {step === 3 && '步驟三：圖文並茂視覺設定'}
            {step === 4 && '步驟四：AI 逐章生成中...'}
            {step === 5 && '步驟五：萬能報告生成完成'}
          </OmniCardTitle>
        </OmniCardHeader>
        <OmniCardContent className="flex flex-col h-full">
          {/* ── STEP 1 ─────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 flex-1">
              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Building2 size={16} className="text-emerald-400" />
                  受測公司（來源：v5 API 真實清單）
                </h4>
                {companiesLoading && <p className="text-xs text-slate-500">載入公司清單中…</p>}
                {companiesError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    {companiesError}
                  </p>
                )}
                {!companiesLoading && !companiesError && companies.length === 0 && (
                  <p className="text-xs text-amber-400">API 未回傳任何公司，無法生成報告。</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCompanyId(c.id)}
                      className={`text-left border rounded-xl p-4 transition-colors ${
                        companyId === c.id
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : 'border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1 gap-2">
                        <span className="font-bold text-slate-200 text-sm truncate">{c.name}</span>
                        <div
                          className={`w-4 h-4 shrink-0 rounded-full border ${
                            companyId === c.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-500'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {c.industry} · {c.id}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-300 mb-3">揭露框架（章節數對應後端 chapterMap）</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {FRAMEWORKS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrameworkId(f.id)}
                      className={`text-left border rounded-xl p-4 transition-colors ${
                        frameworkId === f.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2 gap-2">
                        <span className="font-bold text-slate-200 text-sm">{f.label}</span>
                        <div
                          className={`w-4 h-4 shrink-0 rounded-full border ${
                            frameworkId === f.id ? 'border-cyan-500 bg-cyan-500' : 'border-slate-500'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-slate-500">{f.note}</p>
                      <p className="text-xs text-cyan-400 font-bold mt-2">{f.chapters} 章</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-slate-300 mb-2">生成規模（Omni-Scale）</h4>
                <p className="text-xs text-emerald-400">
                  將逐章呼叫 AI 產生 {selectedFramework.chapters} 章；最終總字數以任務完成時回傳的{' '}
                  <code className="text-emerald-300">result.totalWords</code> 為準。
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2 ─────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                <Database className="text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-emerald-400">已對接 v5 資料管線</h4>
                  <p className="text-xs text-slate-400">
                    生成時將由 <code className="text-emerald-300">startAsyncTask</code> 逐章檢索{' '}
                    <code className="text-emerald-300">rag_knowledge</code> 知識庫切片並注入章節提示詞。
                  </p>
                </div>
                <OmniBadge variant="amber" className="ml-auto shrink-0">
                  待啟動
                </OmniBadge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: '受測公司', value: selectedCompany?.shortName ?? '—' },
                  { label: '產業別', value: selectedCompany?.industry ?? '—' },
                  { label: '揭露框架', value: selectedFramework.label },
                  { label: '章節總數', value: `${selectedFramework.chapters} 章` },
                ].map((s) => (
                  <div key={s.label} className="border border-slate-800 p-4 rounded-xl text-center">
                    <div className="text-lg font-black text-slate-200 mb-1 truncate">{s.value}</div>
                    <div className="text-xs text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                5T 說明：Traceable 引用來源會寫入切片出處；Trustworthy 每章封存 ZKP 雜湊與 OmniTag。
              </p>
            </div>
          )}

          {/* ── STEP 3 ─────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300">圖表生成策略</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={wantCharts}
                        onChange={(e) => setWantCharts(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      <span className="text-sm text-slate-300">自動生成數據視覺化圖表</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-slate-800 rounded-lg cursor-pointer hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={wantImagery}
                        onChange={(e) => setWantImagery(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      <span className="text-sm text-slate-300">智慧配圖（章節視覺標示）</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-300">排版引擎</h4>
                  <div className="p-4 border border-emerald-500/30 bg-emerald-500/5 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="text-emerald-400" size={18} />
                      <span className="font-bold text-emerald-400">Liquid Layout v2</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      預覽與匯出走 <code className="text-emerald-300">reportV5ToHtml</code> /{' '}
                      <code className="text-emerald-300">reportV5ToMarkdown</code>，自動排入 KPI 表與 ZKP 註腳。
                    </p>
                  </div>
                  {startError && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      {startError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4 ─────────────────────────────────────────────────────── */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center flex-1 py-8">
              {task?.status === 'failed' || task?.status === 'cancelled' ? (
                <div className="text-center space-y-4">
                  <XCircle size={48} className="text-red-400 mx-auto" />
                  <h3 className="text-xl font-black text-slate-100">
                    {task.status === 'cancelled' ? '任務已取消' : '生成失敗'}
                  </h3>
                  {task.error && <p className="text-sm text-red-400 max-w-md">{task.error}</p>}
                  <OmniButton variant="secondary" onClick={() => setStep(3)}>
                    返回設定重新嘗試
                  </OmniButton>
                </div>
              ) : (
                <>
                  <div className="relative w-48 h-48 mb-8">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-slate-800"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-emerald-500 transition-all duration-300"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * (task?.percent ?? 0)) / 100}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-cyan-400">
                        {task?.percent ?? 0}%
                      </span>
                      <span className="text-xs text-slate-500 mt-1">
                        已生成 {(task?.wordsSoFar ?? 0).toLocaleString()} 字
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl mb-6">
                    {[
                      {
                        label: '章節進度',
                        value: `${task?.currentChapter ?? 0} / ${task?.totalChapters ?? selectedFramework.chapters}`,
                      },
                      { label: '目前章節', value: task?.chapterTitle || '初始化中' },
                      { label: '5T 守門', value: task?.fiveTGate ? task.fiveTGate.toUpperCase() : '—' },
                      { label: 'OmniTag', value: `${task?.tagsCreated ?? 0} 個` },
                    ].map((s) => (
                      <div key={s.label} className="border border-slate-800 p-3 rounded-xl text-center min-w-0">
                        <div className="text-sm font-black text-emerald-400 truncate" title={s.value}>
                          {s.value}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-400 animate-pulse mb-4">
                    <Loader2 size={16} className="animate-spin" />
                    正在逐章生成並封存 ZKP 證據…
                  </div>
                  <OmniButton variant="ghost" onClick={cancelGeneration} className="gap-2">
                    <XCircle size={16} />
                    取消任務
                  </OmniButton>
                </>
              )}
            </div>
          )}

          {/* ── STEP 5 ─────────────────────────────────────────────────────── */}
          {step === 5 && task?.result && (
            <div className="flex flex-col items-center justify-center flex-1 py-6 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-2 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={40} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-100 mb-2">生成完畢！</h3>
                <p className="text-slate-400 max-w-xl mx-auto text-sm">
                  {selectedCompany?.name ?? task.result.companyId} 已產出{' '}
                  <span className="text-emerald-400 font-bold">{task.result.totalWords.toLocaleString()}</span> 字、
                  {task.result.totalTags} 個章節標記，耗時 {(task.result.durationMs / 1000).toFixed(1)} 秒。
                </p>
              </div>

              <div className="w-full max-w-xl border border-slate-800 rounded-xl p-4 text-left space-y-2">
                <div className="text-xs font-bold text-emerald-400">5T Trustworthy — Trinity Hash</div>
                <code className="block text-[11px] text-slate-400 font-mono break-all">
                  {task.result.trinityHash}
                </code>
                <div className="text-xs text-slate-500 pt-2">
                  任務 ID：<code className="text-slate-400">{task.taskId}</code>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <OmniButton
                  variant="secondary"
                  size="lg"
                  className="gap-2"
                  onClick={() =>
                    window.open(
                      `/api/sustain-write/v5/preview?companyId=${encodeURIComponent(task.result!.companyId)}&format=html&${renderQuery}`,
                      '_blank',
                      'noopener,noreferrer',
                    )
                  }
                >
                  <Eye size={18} />
                  進入萬能預覽模式
                </OmniButton>
                <a
                  href={`/api/sustain-write/v5/download?companyId=${encodeURIComponent(task.result.companyId)}&format=md&${renderQuery}`}
                  download
                  className="inline-flex"
                >
                  <OmniButton variant="primary" size="lg" className="gap-2">
                    <Download size={18} />
                    匯出 Markdown
                  </OmniButton>
                </a>
                <a
                  href={`/api/sustain-write/v5/download?companyId=${encodeURIComponent(task.result.companyId)}&format=html&${renderQuery}`}
                  download
                  className="inline-flex"
                >
                  <OmniButton variant="primary" size="lg" className="gap-2">
                    <Download size={18} />
                    匯出 HTML
                  </OmniButton>
                </a>
              </div>
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────────────────────── */}
          <div className="mt-auto pt-6 flex justify-between border-t border-slate-800">
            <OmniButton
              variant="ghost"
              disabled={step === 1 || isGenerating || step === 5}
              onClick={() => setStep((s) => s - 1)}
            >
              上一步
            </OmniButton>

            {step < 3 ? (
              <OmniButton
                variant="primary"
                disabled={step === 1 && !companyId}
                onClick={() => setStep((s) => s + 1)}
              >
                下一步
              </OmniButton>
            ) : step === 3 ? (
              <OmniButton
                variant="secondary"
                disabled={!canStart}
                onClick={startGeneration}
                className="shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                <Wand2 size={16} className="mr-2" />
                開始萬能生成
              </OmniButton>
            ) : null}
          </div>
        </OmniCardContent>
      </OmniCard>
    </div>
  );
}