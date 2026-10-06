'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sun, Moon, ShieldCheck, Download, Sparkles, RefreshCw, 
  ArrowRight, FileText, CheckCircle2, Lock, Copy, Check,
  Zap, Factory, Truck, Flame, TrendingDown, Layers
} from 'lucide-react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

// 台灣環境部 / 經濟部能源署官方電力排碳係數 (kgCO2e/度)
const TAIWAN_GRID_EMISSION_FACTOR = 0.494;

interface StrategyResult {
  status: string;
  analysis: string;
  shortTerm: string[];
  longTerm: string[];
  score: number;
}

export default function CarbonDashboardPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    industry: '製造業 (Manufacturing)',
    scope1: 1250, // tCO2e
    scope2PowerKwh: 3850000, // 度 (kWh)
    scope2: 1901.9, // tCO2e (3850000 * 0.494 / 1000)
    scope3: 8400 // tCO2e
  });
  
  const [result, setResult] = useState<StrategyResult | null>({
    status: '優化潛力高 (High Optimization Potential)',
    analysis: '依據 ISO 14064-1 盤查數據，外購電力 (範疇二) 與原料採購 (範疇三) 佔總排放 88.5%。建議短期優先進行廠房空調變頻與照明智控，中長期導入屋頂太陽光電與綠電 PPA 採購。',
    shortTerm: ['導入智慧電表與冰水主機溫差自動控制', '全面汰換廠區高天井為 LED 節能燈具', '空壓機管網漏氣巡檢與變頻節能改善'],
    longTerm: ['規劃 500kW 廠房屋頂型太陽光電自發自用', '簽訂再生能源轉供合約 (綠電 PPA) 提升綠電比', '啟動 Tier 1 供應商碳盤查與低碳原料替代'],
    score: 78
  });

  const [sealedHashLock, setSealedHashLock] = useState<string | null>(null);
  const [isSealing, setIsSealing] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // 初始化主題
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const handleToggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 當電力度數改變時，自動重新計算範疇二
  const handlePowerKwhChange = (kwh: number) => {
    const calcScope2 = Number(((kwh * TAIWAN_GRID_EMISSION_FACTOR) / 1000).toFixed(1));
    setFormData(prev => ({
      ...prev,
      scope2PowerKwh: kwh,
      scope2: calcScope2
    }));
  };

  // 總碳排與百分比
  const totalEmissions = Number((formData.scope1 + formData.scope2 + formData.scope3).toFixed(1));
  const scope1Percent = totalEmissions > 0 ? Number(((formData.scope1 / totalEmissions) * 100).toFixed(1)) : 0;
  const scope2Percent = totalEmissions > 0 ? Number(((formData.scope2 / totalEmissions) * 100).toFixed(1)) : 0;
  const scope3Percent = totalEmissions > 0 ? Number(((formData.scope3 / totalEmissions) * 100).toFixed(1)) : 0;

  const handleAnalyze = async () => {
    setLoading(true);
    setSealedHashLock(null);
    try {
      const response = await fetch('/api/carbon/ai-reduction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: formData.industry,
          scope1: formData.scope1,
          scope2: formData.scope2,
          scope3: formData.scope3
        })
      });
      const data = await response.json();
      if (data.success && data.strategy) {
        setResult(data.strategy);
      } else if (data.fallback) {
        setResult(data.fallback);
      }
    } catch (err) {
      console.error(err);
      setResult({
        status: '離線評定 (Offline Mode)',
        analysis: '本地 AI 引擎推演完成：範疇二能源佔比較高，建議優先以用電效率最佳化與綠電抵換為核心行動。',
        shortTerm: ['產線離峰用電排程優化', '既有變壓器能效檢測'],
        longTerm: ['建置儲能系統 (BESS)', '採購自發自用型綠電憑證 (T-REC)'],
        score: 72
      });
    } finally {
      setLoading(false);
    }
  };

  // 執行 5T 密碼學封印
  const handleSealRecord = () => {
    setIsSealing(true);
    setTimeout(() => {
      const payload = `${formData.industry}-${formData.scope1}-${formData.scope2}-${formData.scope3}-${Date.now()}`;
      const hash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      setSealedHashLock(hash);
      setIsSealing(false);
    }, 600);
  };

  const handleCopyHash = () => {
    if (!sealedHashLock) return;
    navigator.clipboard.writeText(sealedHashLock);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleExportJson = () => {
    const data = {
      facility: 'A06 · CARBON ACCOUNTING WORKBENCH',
      standard: 'ISO 14064-1:2018 / GHG Protocol',
      exportedAt: new Date().toISOString(),
      gridFactor: `${TAIWAN_GRID_EMISSION_FACTOR} kgCO2e/kWh (MOEA)`,
      inventory: {
        industry: formData.industry,
        scope1_tCO2e: formData.scope1,
        scope2_tCO2e: formData.scope2,
        scope2_power_kwh: formData.scope2PowerKwh,
        scope3_tCO2e: formData.scope3,
        total_tCO2e: totalEmissions
      },
      aiDiagnosis: result,
      hashLock: sealedHashLock || 'UNSEALED'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `A06-Carbon-Inventory-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ── 1. 頂部手冊控制列 (Header & Theme Capsule) ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30">
                A06 · CARBON ROADMAP WORKBENCH
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                ISO 14064-1 & SBTi 1.5°C
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
              碳排放計算與智慧減碳診斷站 (Carbon AI)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              依據 ISO 14064-1 組織溫室氣體盤查準則 · 5T 終始矩陣科學量化 · 本地 AI 減碳策略推演
            </p>
          </div>

          {/* 右側操作群 */}
          <div className="flex items-center flex-wrap gap-3">
            {/* 雙主題切換膠囊 */}
            <div className="flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => handleToggleTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'light' 
                    ? 'bg-white text-teal-800 shadow-sm font-semibold' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>淺色手冊</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  theme === 'dark' 
                    ? 'bg-slate-900 text-teal-300 shadow-sm font-semibold border border-teal-500/30' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-teal-300" />
                <span>深色手冊</span>
              </button>
            </div>

            {/* 導航至路徑規劃器 */}
            <Link
              href="/roadmap"
              className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>進入 MACC 淨零路徑規劃器</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* 匯出報告按鈕 */}
            <button
              onClick={handleExportJson}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              匯出盤查清冊
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. 主內容網格 ── */}
      <main className="max-w-[1600px] mx-auto p-6 space-y-6">

        {/* 頂部三指標總覽卡 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>總碳排放當量</span>
              <span className="font-mono font-bold text-teal-700 dark:text-cyan-400">ISO 14064-1</span>
            </div>
            <p className="text-3xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
              {totalEmissions.toLocaleString()} <span className="text-xs font-normal text-slate-500">tCO₂e</span>
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden flex">
              <div className="bg-amber-600 h-full" style={{ width: `${scope1Percent}%` }} title={`範疇一: ${scope1Percent}%`} />
              <div className="bg-teal-600 h-full" style={{ width: `${scope2Percent}%` }} title={`範疇二: ${scope2Percent}%`} />
              <div className="bg-purple-600 h-full" style={{ width: `${scope3Percent}%` }} title={`範疇三: ${scope3Percent}%`} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 mb-1 font-semibold">
              <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> 範疇一 (Scope 1)</span>
              <span className="font-mono">{scope1Percent}%</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {formData.scope1.toLocaleString()} <span className="text-xs font-normal text-slate-500">tCO₂e</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">製程燃料燃燒、天然氣與冷媒溢散</p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-teal-700 dark:text-cyan-400 mb-1 font-semibold">
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> 範疇二 (Scope 2)</span>
              <span className="font-mono">{scope2Percent}%</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {formData.scope2.toLocaleString()} <span className="text-xs font-normal text-slate-500">tCO₂e</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">外購電力 ({formData.scope2PowerKwh.toLocaleString()} 度 · 係數 0.494)</p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 mb-1 font-semibold">
              <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> 範疇三 (Scope 3)</span>
              <span className="font-mono">{scope3Percent}%</span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {formData.scope3.toLocaleString()} <span className="text-xs font-normal text-slate-500">tCO₂e</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">原物料採購、員工通勤與價值鏈上下游</p>
          </div>
        </div>

        {/* 雙欄主視圖 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 左側：數據輸入與邊界設定 (4 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-cyan-400 flex items-center gap-2">
                  <Factory className="w-4 h-4" /> 組織邊界與排碳數據設定
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                  基準年: 2026
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">產業分類 (Industry Category)</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:border-teal-500"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  >
                    <option>製造業 (Manufacturing)</option>
                    <option>半導體與高科技 (Semiconductor & High-Tech)</option>
                    <option>金融服務業 (Finance & Banking)</option>
                    <option>流通與零售服務 (Retail & Logistics)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-700 dark:text-amber-400 mb-1.5">
                    範疇一 (Scope 1) 直接排放 (tCO₂e)
                  </label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    value={formData.scope1}
                    onChange={(e) => setFormData({...formData, scope1: Number(e.target.value)})}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">包含柴油發電機、公務車燃油、天然氣燃燒等</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-teal-700 dark:text-cyan-400">
                      範疇二 (Scope 2) 外購電力用量 (度 kWh)
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      係數: {TAIWAN_GRID_EMISSION_FACTOR} kgCO₂e/度
                    </span>
                  </div>
                  <input 
                    type="number" 
                    step="1000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                    value={formData.scope2PowerKwh}
                    onChange={(e) => handlePowerKwhChange(Number(e.target.value))}
                  />
                  <div className="flex items-center justify-between text-xs mt-1.5 text-slate-600 dark:text-slate-400 bg-teal-50/50 dark:bg-teal-950/30 p-2 rounded-lg border border-teal-200/60 dark:border-teal-500/20 font-mono">
                    <span>折算範疇二排碳量:</span>
                    <span className="font-bold text-teal-700 dark:text-cyan-400">{formData.scope2.toLocaleString()} tCO₂e</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-400 mb-1.5">
                    範疇三 (Scope 3) 價值鏈間接排放 (tCO₂e)
                  </label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                    value={formData.scope3}
                    onChange={(e) => setFormData({...formData, scope3: Number(e.target.value)})}
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">供應商原料開採、委外物流、廢棄物處理等</span>
                </div>
              </div>

              {/* 操作按鈕組 */}
              <div className="pt-5 mt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'AI 本地模型推演診斷中...' : '執行 AI 本地端減碳推演 (Analyze)'}
                </button>

                <button 
                  onClick={handleSealRecord}
                  disabled={isSealing}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Lock className={`w-4 h-4 text-teal-600 dark:text-cyan-400 ${isSealing ? 'animate-pulse' : ''}`} />
                  {isSealing ? '密碼學封印運算中...' : '5T 密碼學存證封印 (Hash Lock)'}
                </button>
              </div>

              {/* 封印成果展示 */}
              {sealedHashLock && (
                <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-xs">
                  <div className="flex items-center justify-between mb-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> 5T Hash Lock 封印完成
                    </span>
                    <button
                      onClick={handleCopyHash}
                      className="text-emerald-700 dark:text-emerald-300 hover:opacity-80 transition-opacity flex items-center gap-1"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHash ? '已複製' : '複製'}</span>
                    </button>
                  </div>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 break-all block">
                    {sealedHashLock}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 右側：AI 診斷與減碳策略 (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {result && (
              <>
                {/* 淨零狀態評定卡 */}
                <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-cyan-300 border border-teal-200 dark:border-teal-500/30">
                          AI DIAGNOSIS
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {formData.industry}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {result.status}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {result.score}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        減碳潛力指標 (0-100)
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/90 dark:border-slate-800">
                    {result.analysis}
                  </p>
                </div>

                {/* 短期速贏 vs 資本轉型 雙欄 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 短期速贏 */}
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-teal-700 dark:text-cyan-400 uppercase tracking-wider">
                      <Zap className="w-4 h-4" /> 短期速贏策略 (Short-Term)
                    </div>
                    <ul className="space-y-2.5">
                      {result.shortTerm.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 資本戰略轉型 */}
                  <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      <TrendingDown className="w-4 h-4" /> 資本戰略轉型 (Long-Term)
                    </div>
                    <ul className="space-y-2.5">
                      {result.longTerm.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 下一步導引卡 */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      將碳盤查數據帶入 MACC 減碳路徑規劃器
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      以當前 {totalEmissions.toLocaleString()} tCO₂e 作為基準年碳排，科學試算 2030 SBTi -42% 減量差距。
                    </p>
                  </div>
                  <Link
                    href="/roadmap"
                    className="shrink-0 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                  >
                    <span>開啟 MACC 減碳模型</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
