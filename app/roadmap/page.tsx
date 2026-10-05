'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingDown, ShieldCheck, Download, Save, RefreshCw, 
  Zap, DollarSign, Activity, CheckCircle2, AlertTriangle, Plus, Trash2, ArrowRight, FileText
} from 'lucide-react';
import { AbatementMeasure, DEFAULT_MEASURES } from '../api/roadmap/plan/route';
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from '../../src/components/omni-base/OmniCard';
import { OmniButton } from '../../src/components/omni-base/OmniButton';
import { OmniBadge } from '../../src/components/omni-base/OmniBadge';

export default function RoadmapPage() {
  const [measures, setMeasures] = useState<AbatementMeasure[]>(DEFAULT_MEASURES);
  const [title, setTitle] = useState('企業淨零碳中和減碳路徑規劃 2050');
  const [baseYear, setBaseYear] = useState(2024);
  const [baseEmissions, setBaseEmissions] = useState(50000); // tCO2e/year
  const [target2030Percent, setTarget2030Percent] = useState(42.0); // SBTi 1.5C

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    id: string;
    hashLock: string;
    message: string;
    createdAt: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // 載入最新紀錄
  useEffect(() => {
    fetchLatestRoadmap();
  }, []);

  const fetchLatestRoadmap = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/roadmap/plan');
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.measures) setMeasures(json.data.measures);
        if (json.data.title) setTitle(json.data.title);
        if (json.data.baseYear) setBaseYear(json.data.baseYear);
        if (json.data.baseEmissions) setBaseEmissions(json.data.baseEmissions);
        if (json.data.target2030Percent) setTarget2030Percent(json.data.target2030Percent);
        if (json.data.hashLock) {
          setSaveResult({
            id: json.data.id,
            hashLock: json.data.hashLock,
            message: '已成功載入最新 5T 淨零路徑封印紀錄',
            createdAt: json.data.createdAt,
          });
        }
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeasureChange = (id: string, field: keyof AbatementMeasure, value: any) => {
    setMeasures((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleAddMeasure = () => {
    const newId = `m${Date.now()}`;
    const newMeasure: AbatementMeasure = {
      id: newId,
      name: '全新減碳專案 (請輸入名稱)',
      category: 'Efficiency',
      reductionPotential: 1000,
      costPerTon: -500,
      capex: 2000000,
      status: 'Planned',
    };
    setMeasures([...measures, newMeasure]);
  };

  const handleDeleteMeasure = (id: string) => {
    setMeasures(measures.filter((m) => m.id !== id));
  };

  const handleSaveRoadmap = async () => {
    setIsSaving(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/roadmap/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          baseYear,
          baseEmissions,
          target2030Percent,
          measures,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSaveResult({
          id: json.data.id,
          hashLock: json.data.hashLock,
          message: json.data.message,
          createdAt: json.data.createdAt,
        });
      } else {
        setErrorMessage(json.error || '儲存失敗');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '連線伺服器失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCertificate = () => {
    if (!saveResult?.id) return;
    window.open(`/api/roadmap/export/${saveResult.id}`, '_blank');
  };

  const handleExportPdfCertificate = () => {
    if (!saveResult?.id) return;
    window.open(`/api/roadmap/export-pdf/${saveResult.id}`, '_blank');
  };

  // 統計與路徑計算
  const totalPlannedReduction = measures.reduce((acc, m) => acc + m.reductionPotential, 0);
  const target2030Emissions = baseEmissions * (1 - target2030Percent / 100);
  const netResidualEmissions2030 = Math.max(baseEmissions - totalPlannedReduction, 0);
  const isTargetAchieved2030 = netResidualEmissions2030 <= target2030Emissions;

  const totalCapex = measures.reduce((acc, m) => acc + m.capex, 0);
  const totalAnnualSavingsOrCost = measures.reduce((acc, m) => acc + m.reductionPotential * m.costPerTon, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10 font-sans">
      
      {/* ── Top Navigation Header ── */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <OmniBadge variant="teal">SBTi 1.5°C Near-Term Compliant</OmniBadge>
            <OmniBadge variant="emerald">MACC Carbon Abatement Curve</OmniBadge>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 text-slate-900 dark:text-slate-100">
            淨零減碳路徑與 MACC 邊際成本規劃器
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 max-w-3xl leading-relaxed">
            設定基準年碳排、2030 近程與 2050 淨零目標，試算熱力減碳措施與成本效益，經 5T Hash Lock 封印。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <OmniButton
            variant="outline"
            onClick={fetchLatestRoadmap}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </OmniButton>
          <OmniButton
            variant="primary"
            onClick={handleSaveRoadmap}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isSaving ? '5T 刻印中...' : '封印 5T 減碳路徑'}
          </OmniButton>
          {saveResult?.id && (
            <>
              <OmniButton
                variant="outline"
                onClick={handleExportCertificate}
              >
                <Download className="w-4 h-4 mr-1.5" />
                JSON 證書
              </OmniButton>
              <OmniButton
                variant="emerald"
                onClick={handleExportPdfCertificate}
              >
                <FileText className="w-4 h-4 mr-1.5" />
                PDF 證書
              </OmniButton>
            </>
          )}
        </div>
      </div>

      {/* ── Status Banner ── */}
      {saveResult && (
        <div className="max-w-7xl mx-auto mt-6 p-4 rounded-xl bg-teal-50 dark:bg-cyan-950/40 border border-teal-200 dark:border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-cyan-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-cyan-200">{saveResult.message}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Hash Lock: <span className="text-teal-700 dark:text-cyan-400 font-bold">{saveResult.hashLock}</span>
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            刻印時間: {new Date(saveResult.createdAt).toLocaleString('zh-TW')}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="max-w-7xl mx-auto mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm">
          {errorMessage}
        </div>
      )}

      {/* ── Baseline & Trajectory Milestone Cards ── */}
      <div className="max-w-7xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Card 1: Baseline Emissions */}
        <OmniCard variant="glass" className="p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">基準年溫室氣體排放量</span>
          <div className="flex items-baseline gap-2 mt-2">
            <input
              type="number"
              value={baseEmissions}
              onChange={(e) => setBaseEmissions(Number(e.target.value))}
              className="w-32 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-2xl font-black text-teal-700 dark:text-cyan-400 font-mono focus:outline-none focus:border-teal-500"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">tCO₂e/年</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">基準年份: {baseYear}</div>
        </OmniCard>

        {/* Card 2: 2030 SBTi Target */}
        <OmniCard variant="glass" className="p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">2030 SBTi 1.5°C 減量目標</span>
          <div className="flex items-baseline gap-2 mt-2">
            <input
              type="number"
              value={target2030Percent}
              onChange={(e) => setTarget2030Percent(Number(e.target.value))}
              className="w-24 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1 text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">% (相較 {baseYear})</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            目標剩餘上限: <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{target2030Emissions.toLocaleString()} tCO₂e</span>
          </div>
        </OmniCard>

        {/* Card 3: Total Planned Reductions */}
        <OmniCard variant="glass" className="p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">規劃減碳總潛力 (Total Abatement)</span>
          <div className="text-2xl font-black text-teal-700 dark:text-cyan-300 font-mono mt-2">
            -{totalPlannedReduction.toLocaleString()} <span className="text-xs font-normal text-slate-400">tCO₂e/年</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {isTargetAchieved2030 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 達標 2030 SBTi 目標！
              </span>
            ) : (
              <span className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> 尚差 {(netResidualEmissions2030 - target2030Emissions).toLocaleString()} tCO₂e 達標
              </span>
            )}
          </div>
        </OmniCard>

        {/* Card 4: Financial MACC Impact */}
        <OmniCard variant="glass" className="p-5">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">資本支出與年度淨效益</span>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-2">
            CAPEX: NT$ {(totalCapex / 10000).toLocaleString()} 萬
          </div>
          <div className="text-xs font-mono mt-1">
            年度淨損益: {' '}
            <span className={totalAnnualSavingsOrCost <= 0 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-amber-700 dark:text-amber-400 font-bold'}>
              {totalAnnualSavingsOrCost <= 0 ? `省 NT$ ${Math.abs(totalAnnualSavingsOrCost).toLocaleString()}` : `支出 NT$ ${totalAnnualSavingsOrCost.toLocaleString()}`} / 年
            </span>
          </div>
        </OmniCard>

      </div>

      {/* ── Visual Trajectory Bar ── */}
      <OmniCard variant="glass" className="max-w-7xl mx-auto mt-6 p-6">
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200 mb-3 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
          淨零減碳視覺化軌跡 (Trajectory Milestones)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 relative">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">2024 基準年</span>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono mt-1">{baseEmissions.toLocaleString()} tCO₂e</p>
            <span className="text-[10px] text-slate-500">100% 原始碳排</span>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-cyan-950/30 border border-teal-200 dark:border-cyan-500/30 relative">
            <span className="text-xs font-bold text-teal-800 dark:text-cyan-300">2030 中程目標</span>
            <p className="text-xl font-extrabold text-teal-700 dark:text-cyan-400 font-mono mt-1">
              {netResidualEmissions2030.toLocaleString()} tCO₂e
            </p>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
              已減 -{((totalPlannedReduction / baseEmissions) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 relative">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">2040 轉型加速</span>
            <p className="text-xl font-extrabold text-slate-800 dark:text-slate-300 font-mono mt-1">
              {Math.round(netResidualEmissions2030 * 0.4).toLocaleString()} tCO₂e
            </p>
            <span className="text-[10px] text-slate-500">預期剩餘 20%</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 relative">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">2050 淨零碳中和</span>
            <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono mt-1">0 tCO₂e</p>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">100% Net-Zero Goal</span>
          </div>
        </div>
      </OmniCard>

      {/* ── MACC Abatement Measures Table ── */}
      <OmniCard variant="glass" className="max-w-7xl mx-auto mt-8 p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
            <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">MACC 減碳專案與成本效益矩陣</h2>
          </div>
          <OmniButton
            variant="outline"
            onClick={handleAddMeasure}
            className="text-xs py-1.5 px-3"
          >
            <Plus className="w-4 h-4 mr-1" />
            新增減碳措施
          </OmniButton>
        </div>

        {/* Measures Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                <th className="py-2.5 px-3">措施專案名稱</th>
                <th className="py-2.5 px-3">專案分類</th>
                <th className="py-2.5 px-3">減碳潛力 (tCO₂e/年)</th>
                <th className="py-2.5 px-3">單位成本 (NT$/tCO₂e)</th>
                <th className="py-2.5 px-3">資本支出 (CAPEX)</th>
                <th className="py-2.5 px-3">推動狀態</th>
                <th className="py-2.5 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {measures.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => handleMeasureChange(m.id, 'name', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={m.category}
                      onChange={(e) => handleMeasureChange(m.id, 'category', e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-800 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="Efficiency">能效提升</option>
                      <option value="Renewable">綠能採購</option>
                      <option value="Electrification">製程電氣化</option>
                      <option value="Offset">碳抵換額度</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={m.reductionPotential}
                      onChange={(e) => handleMeasureChange(m.id, 'reductionPotential', Number(e.target.value))}
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-teal-700 dark:text-cyan-400 font-bold focus:outline-none focus:border-teal-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={m.costPerTon}
                      onChange={(e) => handleMeasureChange(m.id, 'costPerTon', Number(e.target.value))}
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-emerald-700 dark:text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={m.capex}
                      onChange={(e) => handleMeasureChange(m.id, 'capex', Number(e.target.value))}
                      className="w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={m.status}
                      onChange={(e) => handleMeasureChange(m.id, 'status', e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-800 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="Implemented">已實施</option>
                      <option value="In Progress">進行中</option>
                      <option value="Planned">規劃中</option>
                    </select>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={() => handleDeleteMeasure(m.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OmniCard>

    </div>
  );
}
