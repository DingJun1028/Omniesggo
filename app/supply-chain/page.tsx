'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Download, Search, Sparkles, 
  CheckCircle2, AlertTriangle, RefreshCw, FileText, Plus, ShieldAlert, Award
} from 'lucide-react';

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

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/supply-chain/list');
      const json = await res.json();
      if (json.success && json.data) {
        setVendors(json.data);
      }
    } catch (err) {
      console.error('Fetch vendors error:', err);
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
    if (!supplierName || !rawData) {
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
        body: JSON.stringify({ supplierName, industry, tier, rawData }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setActiveEvaluation(json.data);
        fetchVendors();
      } else {
        setErrorMessage(json.error || '供應商評鑑失敗');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '連線伺服器失敗');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleExportCertificate = (id: string) => {
    window.open(`/api/supply-chain/export/${id}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans selection:bg-cyan-500/30">
      
      {/* ── Top Header ── */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-cyan-500/20">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              EU CSDD & Germany LkSG Compliant
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              5T Sealed Audit Pipeline
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
            供應鏈 ESG 永續與人權盡職調查 (Supply Chain CSDD)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            運用 AI 自動審查 Tier 1 / Tier 2 供應商報告，評定 ESG 等級與風險層級，並進行 5T 密碼學 Hash Lock 封印。
          </p>
        </div>

        <button
          onClick={fetchVendors}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-sm font-medium flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          重新整理清單
        </button>
      </div>

      {errorMessage && (
        <div className="max-w-7xl mx-auto mt-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm">
          {errorMessage}
        </div>
      )}

      {/* ── Main 2-Column Grid ── */}
      <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Vendor Form (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/40 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-2xl flex flex-col shadow-[0_0_30px_rgba(2,6,23,0.5)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <h2 className="font-bold text-lg text-slate-100">供應商資料審查</h2>
            </div>
            <button
              onClick={handleSimulatePreset}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" /> 帶入測試範例
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400">供應商公司名稱 *</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="例如: 綠能科技股份有限公司"
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400">產業別</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="電子零組件與半導體">電子零組件與半導體</option>
                  <option value="金屬加工與精密機械">金屬加工與精密機械</option>
                  <option value="化工與塑膠原物料">化工與塑膠原物料</option>
                  <option value="物流配送與倉儲運輸">物流配送與倉儲運輸</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">供應鏈層級</label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="Tier 1">Tier 1 (直接一階供應商)</option>
                  <option value="Tier 2">Tier 2 (二階原物料商)</option>
                  <option value="Subcontractor">外包承包商</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">CSR / 永續報告與稽核數據 *</label>
              <textarea
                rows={6}
                value={rawData}
                onChange={(e) => setRawData(e.target.value)}
                placeholder="貼上供應商問卷、ISO 證書摘要或勞安稽核文字..."
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>

            <button
              onClick={handleEvaluate}
              disabled={isEvaluating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
            >
              <Search className="w-4 h-4" />
              {isEvaluating ? 'AI 盡職調查評鑑中...' : '執行 5T 盡職調查評鑑'}
            </button>
          </div>
        </div>

        {/* Right Column: Active Result & Vendors List (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Active Result Card (If present) */}
          {activeEvaluation && (
            <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.15)] animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-cyan-500/30">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">{activeEvaluation.supplierName}</h3>
                    <p className="text-xs text-slate-400">{activeEvaluation.industry} · {activeEvaluation.tier}</p>
                  </div>
                </div>

                {/* Rating Badge */}
                <div className="flex items-center gap-2">
                  <span className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg
                    ${activeEvaluation.rating === 'A' ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/40' :
                      activeEvaluation.rating === 'B' ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/40' :
                      'bg-amber-500 text-slate-950 shadow-amber-500/40'}
                  `}>
                    {activeEvaluation.rating}
                  </span>
                  <button
                    onClick={() => handleExportCertificate(activeEvaluation.id)}
                    className="p-2 rounded-xl bg-cyan-900/60 hover:bg-cyan-800 border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-4 h-4" /> 證書
                  </button>
                </div>
              </div>

              {/* ESG Radar Scores */}
              <div className="grid grid-cols-3 gap-3 my-4 text-center">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400">E 環境治理</span>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">{activeEvaluation.envScore} / 100</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400">S 勞動人權</span>
                  <p className="text-lg font-bold text-cyan-400 mt-0.5">{activeEvaluation.socialScore} / 100</p>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <span className="text-[11px] text-slate-400">G 誠信公司治理</span>
                  <p className="text-lg font-bold text-amber-400 mt-0.5">{activeEvaluation.govScore} / 100</p>
                </div>
              </div>

              {/* Advice */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-cyan-400">採購與輔導建議: </span>
                {activeEvaluation.recommendation}
              </div>

              {/* Hash Lock footer */}
              <div className="mt-3 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                Hash Lock: <span className="text-cyan-400">{activeEvaluation.hashLock}</span>
              </div>
            </div>
          )}

          {/* Vendors History Table */}
          <div className="bg-slate-900/40 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(2,6,23,0.5)]">
            <h3 className="font-bold text-lg text-slate-100 pb-3 border-b border-slate-800 flex items-center justify-between">
              <span>已評鑑供應商清單 ({vendors.length})</span>
              <span className="text-xs font-normal text-slate-400">5T Hash Lock 封印庫</span>
            </h3>

            <div className="space-y-3 mt-4 max-h-[420px] overflow-y-auto pr-1">
              {vendors.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  尚無已評鑑的供應商紀錄，請於左側輸入資料進行評估。
                </div>
              ) : (
                vendors.map((v) => (
                  <div key={v.id} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`
                          w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center
                          ${v.rating === 'A' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                            v.rating === 'B' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/40'}
                        `}>
                          {v.rating}
                        </span>
                        <h4 className="font-semibold text-sm text-slate-200">{v.supplierName}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {v.industry} · {v.tier} · 風險: <span className={v.riskLevel === 'Low' ? 'text-emerald-400' : 'text-amber-400'}>{v.riskLevel}</span>
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 mt-1">
                        Lock: {v.hashLock.slice(0, 24)}...
                      </p>
                    </div>

                    <button
                      onClick={() => handleExportCertificate(v.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" /> 證書
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
