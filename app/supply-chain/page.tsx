'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2, ShieldCheck, Download, Search, Sparkles,
  RefreshCw, Award
} from 'lucide-react';
import { OmniCard } from '../../src/components/omni-base/OmniCard';
import { OmniButton } from '../../src/components/omni-base/OmniButton';
import { OmniBadge } from '../../src/components/omni-base/OmniBadge';

interface VendorRecord {
  id: string;
  supplierName: string;
  industry: string;
  tier: string;
  rating: string;
  riskLevel: string;
  envScore: number;
  socialScore: number;
  govScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  hashLock: string;
  createdAt: string;
}

export default function SupplyChainPage() {
  const [supplierName, setSupplierName] = useState('');
  const [industry, setIndustry] = useState('電子零組件與半導體');
  const [tier, setTier] = useState('Tier 1');
  const [rawData, setRawData] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [activeEvaluation, setActiveEvaluation] = useState<VendorRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isStorageUnavailable, setIsStorageUnavailable] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/supply-chain/list');
      const json = await res.json();
      if (!res.ok || !json?.success || !Array.isArray(json.data)) {
        throw new Error(json?.error || '無法載入供應商清單，請稍後重試。');
      }
      setVendors(json.data);
      setIsStorageUnavailable(json.persistence === 'unavailable');
    } catch (err) {
      console.error('Fetch vendors error:', err);
      const message = err instanceof Error ? err.message : '無法載入供應商清單，請稍後重試。';
      setIsStorageUnavailable(/DATABASE_URL|database|Prisma/i.test(message));
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatePreset = () => {
    setSupplierName('GreenTech Manufacturing Co. (綠能科技股份有限公司)');
    setIndustry('電子零組件與半導體');
    setTier('Tier 1');
    setRawData(`2025 年永續報告書與稽核摘要:
- ISO 14001 環境管理系統: 已通過第三方認證 (有效期限至 2027)
- ISO 45001 職業安全衛生系統: 已通過第三方認證
- 範疇一與範疇二碳排放總量: 14,500 tCO2e/年
- 綠電使用率 (RE100): 15% (已簽署 5MW 太陽能 PPA)
- 勞動人權: 近三年無重大職災、無違法加班裁罰紀錄
- 供應鏈管理: 50% 主要原物料供應商已完成 ESG 問卷填報`);
  };

  const handleEvaluate = async () => {
    if (!supplierName.trim() || !rawData.trim()) {
      setErrorMessage('請輸入供應商名稱與報告文字內容');
      return;
    }
    setIsEvaluating(true);
    setErrorMessage('');
    setActiveEvaluation(null);

    try {
      const res = await fetch('/api/supply-chain/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierName: supplierName.trim(), industry, tier, rawData: rawData.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success || !json?.data?.id) {
        throw new Error(json?.error || `評鑑失敗（HTTP ${res.status}）`);
      }
      setActiveEvaluation(json.data);
      await fetchVendors();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '連線伺服器失敗');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExportCertificate = (id: string) => {
    if (!id) {
      setErrorMessage('缺少評鑑紀錄識別碼，無法匯出證書。');
      return;
    }
    window.open(`/api/supply-chain/export/${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-w-0 w-full space-y-6 bg-[var(--bg)] px-0 font-sans text-[var(--text-1)] sm:space-y-8">

      {/* ── Top Header ── */}
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 shadow-sm sm:gap-6 sm:rounded-3xl sm:p-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <OmniBadge variant="teal">EU CSDD & Germany LkSG Compliant</OmniBadge>
            <OmniBadge variant="emerald">5T Sealed Audit Pipeline</OmniBadge>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 text-[var(--text-1)] dark:text-[var(--text-1)]">
            供應鏈 ESG 永續與人權盡職調查 (Supply Chain CSDD)
          </h1>
          <p className="text-[var(--text-3)] dark:text-[var(--text-3)] text-sm mt-1 max-w-3xl leading-relaxed">
            運用 AI 自動審查 Tier 1 / Tier 2 供應商報告，評定 ESG 等級與風險層級，並進行 5T 密碼學 Hash Lock 封印。
          </p>
        </div>

        <OmniButton
        variant="outline"
        onClick={() => { setErrorMessage(''); void fetchVendors(); }}
        disabled={isLoading}
          aria-label="重新整理供應商清單"
        >
        <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? '載入中…' : '重新整理清單'}
          </OmniButton>
      </div>

      {errorMessage && (
        <div role="alert" className="max-w-7xl mx-auto mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm flex flex-wrap items-center justify-between gap-3">
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage('')} className="min-h-11 px-3 rounded-lg font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500">關閉提示</button>
        </div>
      )}

      {/* ── Main 2-Column Grid ── */}
      {isStorageUnavailable && (
        <div className="max-w-7xl mx-auto mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100" role="status">
          <p className="font-semibold">資料庫尚未設定，供應商紀錄目前無法載入或保存。</p>
          <p className="mt-1">請在伺服器環境設定有效的 <code className="rounded bg-[var(--surface-1)] px-1 py-0.5 font-mono dark:bg-black/20">DATABASE_URL</code> 後再執行評鑑。為避免資料遺失，本頁不會以暫存結果冒充已保存紀錄。</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Vendor Form (5 cols) */}
        <OmniCard variant="glass" className="lg:col-span-5 p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] dark:border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
              <h2 className="font-bold text-base text-[var(--text-1)] dark:text-[var(--text-1)]">供應商資料審查</h2>
            </div>
            <button
              type="button"
              onClick={handleSimulatePreset}
              className="min-h-11 px-2 rounded-lg text-xs text-teal-700 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <Sparkles className="w-3.5 h-3.5" /> 帶入測試範例
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="supplier-name" className="text-xs font-semibold text-[var(--text-2)] dark:text-[var(--text-2)]">供應商公司名稱 *</label>
              <input
                id="supplier-name"
                type="text"
                autoComplete="organization"
                maxLength={160}
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="例如: 綠能科技股份有限公司"
                className="w-full min-h-11 mt-1 bg-[var(--surface-1)] dark:bg-[var(--bg)] border border-slate-300 dark:border-[var(--border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-1)] dark:text-[var(--text-1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="supplier-industry" className="text-xs font-semibold text-[var(--text-2)] dark:text-[var(--text-2)]">產業別</label>
                <select
                  id="supplier-industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full min-h-11 mt-1 bg-[var(--surface-1)] dark:bg-[var(--bg)] border border-slate-300 dark:border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-1)] dark:text-[var(--text-1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <option value="電子零組件與半導體">電子零組件與半導體</option>
                  <option value="金屬加工與精密機械">金屬加工與精密機械</option>
                  <option value="化工與塑膠原物料">化工與塑膠原物料</option>
                  <option value="物流配送與倉儲運輸">物流配送與倉儲運輸</option>
                </select>
              </div>
              <div>
                <label htmlFor="supplier-tier" className="text-xs font-semibold text-[var(--text-2)] dark:text-[var(--text-2)]">供應鏈層級</label>
                <select
                  id="supplier-tier"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full min-h-11 mt-1 bg-[var(--surface-1)] dark:bg-[var(--bg)] border border-slate-300 dark:border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-1)] dark:text-[var(--text-1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <option value="Tier 1">Tier 1 (直接一階供應商)</option>
                  <option value="Tier 2">Tier 2 (二階原物料商)</option>
                  <option value="Subcontractor">外包承包商</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="supplier-report" className="text-xs font-semibold text-[var(--text-2)] dark:text-[var(--text-2)]">CSR / 永續報告與稽核數據 *</label>
              <textarea
                id="supplier-report"
                rows={6}
                maxLength={12000}
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="貼上供應商問卷、ISO 證書摘要或勞安稽核文字..."
                className="w-full mt-1 min-h-36 bg-[var(--surface-1)] dark:bg-[var(--bg)] border border-slate-300 dark:border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-1)] dark:text-[var(--text-1)] font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-y"
              />
            </div>

            <OmniButton
              variant="primary"
              onClick={handleEvaluate}
              isLoading={isEvaluating}
              className="w-full min-h-11 justify-center"
              disabled={isEvaluating || isStorageUnavailable}
            >
              <Search className="w-4 h-4 mr-1.5" />
              {isEvaluating ? 'AI 盡職調查評鑑中...' : '執行 5T 盡職調查評鑑'}
            </OmniButton>
          </div>
        </OmniCard>

        {/* Right Column: Active Result & Vendors List (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Active Result Card (If present) */}
          {activeEvaluation && (
            <OmniCard variant="glass" className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)] dark:border-[var(--border)]">
                <div className="flex min-w-0 items-center gap-2">
                  <Award className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-1)] dark:text-[var(--text-1)]">{activeEvaluation.supplierName}</h3>
                    <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)]">{activeEvaluation.industry} · {activeEvaluation.tier}</p>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="flex items-center gap-2">
                  <span className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl shadow-md
                    ${activeEvaluation.rating === 'A' ? 'bg-emerald-500 text-slate-950' :
                      activeEvaluation.rating === 'B' ? 'bg-teal-500 dark:bg-cyan-500 text-slate-950' :
                      'bg-amber-500 text-slate-950'}
                  `}>
                    {activeEvaluation.rating}
                  </span>
                  <OmniButton
                    variant="outline"
                    onClick={() => handleExportCertificate(activeEvaluation.id)}
                    className="min-h-11 text-xs py-2 px-3"
                  >
                    <Download className="w-3.5 h-3.5 mr-1" /> 證書
                  </OmniButton>
                </div>
              </div>

              {/* ESG Radar Scores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-center">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg)]/60 border border-[var(--border)] dark:border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-3)] dark:text-[var(--text-3)]">E 環境治理</span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{activeEvaluation.envScore} / 100</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg)]/60 border border-[var(--border)] dark:border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-3)] dark:text-[var(--text-3)]">S 勞動人權</span>
                  <p className="text-lg font-bold text-teal-600 dark:text-cyan-400 mt-0.5">{activeEvaluation.socialScore} / 100</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[var(--bg)]/60 border border-[var(--border)] dark:border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-3)] dark:text-[var(--text-3)]">G 誠信公司治理</span>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">{activeEvaluation.govScore} / 100</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <section className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60" aria-label="評鑑優勢">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2">評鑑優勢</h4>
                  {activeEvaluation.strengths?.length ? <ul className="space-y-1 text-sm text-emerald-900 dark:text-emerald-100">{activeEvaluation.strengths.map((item, index) => <li key={`strength-${index}`} className="break-words">• {item}</li>)}</ul> : <p className="text-sm text-[var(--text-3)] dark:text-[var(--text-3)]">未提供優勢摘要</p>}
                </section>
                <section className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60" aria-label="改善建議">
                  <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2">待改善事項</h4>
                  {activeEvaluation.weaknesses?.length ? <ul className="space-y-1 text-sm text-amber-900 dark:text-amber-100">{activeEvaluation.weaknesses.map((item, index) => <li key={`weakness-${index}`} className="break-words">• {item}</li>)}</ul> : <p className="text-sm text-[var(--text-3)] dark:text-[var(--text-3)]">未提供改善摘要</p>}
                </section>
              </div>

              {/* Advice */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[var(--surface-1)]/90 border border-[var(--border)] dark:border-[var(--border)] text-sm text-[var(--text-2)] dark:text-[var(--text-2)] break-words">
                <span className="font-bold text-teal-700 dark:text-cyan-400">採購與輔導建議: </span>
                {activeEvaluation.recommendation}
              </div>

              {/* Hash Lock footer */}
              <div className="mt-3 text-xs font-mono text-[var(--text-3)] dark:text-[var(--text-3)] flex flex-wrap items-center gap-1 break-all">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-cyan-400" />
                Hash Lock: <span className="text-teal-700 dark:text-cyan-400">{activeEvaluation.hashLock}</span>
              </div>
            </OmniCard>
          )}

          {/* Vendors History Table */}
          <OmniCard variant="glass" className="p-6">
            <h3 className="font-bold text-base text-[var(--text-1)] dark:text-[var(--text-1)] pb-3 border-b border-[var(--border)] dark:border-[var(--border)] flex items-center justify-between">
              <span>已評鑑供應商清單 ({vendors.length})</span>
              <span className="text-xs font-normal text-[var(--text-3)] dark:text-[var(--text-3)]">5T Hash Lock 封印庫</span>
            </h3>

            <div className="space-y-3 mt-4 max-h-[420px] overflow-y-auto pr-1" aria-live="polite" aria-busy={isLoading}>
              {isLoading && vendors.length === 0 ? (
                <div className="py-10 text-center text-sm text-[var(--text-3)]" role="status">正在載入供應商紀錄…</div>
              ) : vendors.length === 0 ? (
                <div className="text-center py-10 text-[var(--text-3)] dark:text-[var(--text-3)] text-sm">
                  尚無已評鑑的供應商紀錄，請於左側輸入資料進行評估。
                </div>
              ) : (
                vendors.map((v) => (
                  <div key={v.id} className="p-4 rounded-xl bg-slate-50 dark:bg-[var(--surface-1)]/90 border border-[var(--border)] dark:border-[var(--border)] hover:border-slate-300 dark:hover:border-[var(--border-strong)] transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`
                          w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center
                          ${v.rating === 'A' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40' :
                            v.rating === 'B' ? 'bg-teal-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-400 border border-teal-300 dark:border-cyan-500/40' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-300 dark:border-amber-500/40'}
                        `}>
                          {v.rating}
                        </span>
                        <h4 className="font-semibold text-sm text-[var(--text-1)] dark:text-[var(--text-1)] break-words">{v.supplierName}</h4>
                      </div>
                      <p className="text-xs text-[var(--text-3)] dark:text-[var(--text-3)] mt-1">
                        {v.industry} · {v.tier} · 風險: <span className={v.riskLevel === 'Low' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>{v.riskLevel}</span>
                      </p>
                      <p className="text-[10px] font-mono text-[var(--text-3)] dark:text-[var(--text-3)] mt-1">
                        Lock: {v.hashLock?.slice(0, 24) || '尚無雜湊'}...
                      </p>
                    </div>

                    <OmniButton
                      variant="outline"
                      onClick={() => handleExportCertificate(v.id)}
                      className="min-h-11 text-xs py-2 px-3 shrink-0 self-start sm:self-auto"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> 證書
                    </OmniButton>
                  </div>
                ))
              )}
            </div>
          </OmniCard>

        </div>

      </div>
    </div>
  );
}
