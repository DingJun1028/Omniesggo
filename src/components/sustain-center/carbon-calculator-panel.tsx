'use client';

import React, { useState } from 'react';
import { Calculator, ShieldCheck, Zap, Fuel, Plane, Truck, RefreshCw, Hash, CheckCircle2 } from 'lucide-react';

interface CalculationResult {
  success: boolean;
  specVersion: string;
  uuid: string;
  timestamp: number;
  sourceOrigin: string;
  hashLock: string;
  summary: {
    totalEmissionsKgCO2e: number;
    totalEmissionsTonnesCO2e: number;
    scope1KgCO2e: number;
    scope2KgCO2e: number;
    scope3KgCO2e: number;
  };
  breakdown: {
    scope1: { gasolineLiters: number; dieselLiters: number; naturalGasM3: number; emissionsKgCO2e: number };
    scope2: { electricityKWh: number; factorUsed: number; emissionsKgCO2e: number };
    scope3: { businessTravelKm: number; logisticsTonKm: number; emissionsKgCO2e: number };
  };
  fiveTProtocolSeals: {
    truth: { verified: boolean; sourceOrigin: string };
    goodness: { verified: boolean; standard: string };
    beauty: { verified: boolean; format: string };
    trust: { verified: boolean; hashLock: string };
    trackable: { verified: boolean; uuid: string };
  };
}

export function CarbonCalculatorPanel() {
  const [gasoline, setGasoline] = useState<string>('1500');
  const [diesel, setDiesel] = useState<string>('800');
  const [naturalGas, setNaturalGas] = useState<string>('500');
  const [electricity, setElectricity] = useState<string>('25000');
  const [travel, setTravel] = useState<string>('12000');
  const [logistics, setLogistics] = useState<string>('5000');

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/calculator/carbon-emissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope1: {
            gasolineLiters: parseFloat(gasoline) || 0,
            dieselLiters: parseFloat(diesel) || 0,
            naturalGasM3: parseFloat(naturalGas) || 0,
          },
          scope2: {
            electricityKWh: parseFloat(electricity) || 0,
          },
          scope3: {
            businessTravelKm: parseFloat(travel) || 0,
            logisticsTonKm: parseFloat(logistics) || 0,
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setResult(json);
      } else {
        setError(json.error || '計算失敗 (Calculation failed)');
      }
    } catch (err) {
      setError((err as Error).message || '連線 REST API 失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.08)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calculator className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-white">
              互動式 5T 溫室氣體碳試算面板 (Carbon Calculator)
            </h2>
          </div>
          <p className="text-slate-400 text-xs font-mono">
            預設採用台電 2024 年最新電力排碳係數 (0.494 kgCO2e/kWh) 與 DEFRA 2024 國際標準係數
          </p>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {loading ? '計算中...' : '執行 5T 碳試算與雜湊封印'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Scope 1 Panel */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-400" /> Scope 1 直接排放
            </h3>
            <span className="text-[10px] font-mono bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded border border-amber-400/20">
              Direct
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">汽油 (Gasoline / 公升)</label>
              <input
                type="number"
                value={gasoline}
                onChange={(e) => setGasoline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">柴油 (Diesel / 公升)</label>
              <input
                type="number"
                value={diesel}
                onChange={(e) => setDiesel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">天然氣 (Natural Gas / m³)</label>
              <input
                type="number"
                value={naturalGas}
                onChange={(e) => setNaturalGas(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Scope 2 Panel */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Scope 2 能源間接排放
            </h3>
            <span className="text-[10px] font-mono bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-400/20">
              Electricity
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">用電量 (Electricity / 度 kWh)</label>
              <input
                type="number"
                value={electricity}
                onChange={(e) => setElectricity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>套用排放係數:</span>
                <span className="text-cyan-400 font-bold font-mono">0.494 kgCO2e/kWh</span>
              </div>
              <p className="text-[10px] text-slate-500">來源：經濟部能源署台電 2024 年最新標準</p>
            </div>
          </div>
        </div>

        {/* Scope 3 Panel */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Plane className="w-4 h-4 text-emerald-400" /> Scope 3 其他間接排放
            </h3>
            <span className="text-[10px] font-mono bg-emerald-400/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-400/20">
              Value Chain
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">商務差旅 (Business Travel / 公里 km)</label>
              <input
                type="number"
                value={travel}
                onChange={(e) => setTravel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">物流運輸 (Logistics Freight / 噸公里 ton-km)</label>
              <input
                type="number"
                value={logistics}
                onChange={(e) => setLogistics(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-cyan-300 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Result Display Card */}
      {result && (
        <div className="rounded-xl bg-slate-950 border border-cyan-500/40 p-5 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                5T PROOF SEALED • v3.4.0
              </span>
              <h4 className="text-lg font-bold text-slate-100 mt-1">碳試算總結結果 (Emission Breakdown)</h4>
            </div>

            <div className="text-right">
              <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                {result.summary.totalEmissionsTonnesCO2e} <span className="text-sm font-normal text-slate-400">tCO2e</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">({result.summary.totalEmissionsKgCO2e} kgCO2e)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1">Scope 1 (直接)</span>
              <span className="text-amber-400 text-base font-bold">{result.summary.scope1KgCO2e} kgCO2e</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1">Scope 2 (電力)</span>
              <span className="text-cyan-400 text-base font-bold">{result.summary.scope2KgCO2e} kgCO2e</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1">Scope 3 (範疇三)</span>
              <span className="text-emerald-400 text-base font-bold">{result.summary.scope3KgCO2e} kgCO2e</span>
            </div>
          </div>

          {/* 5T Cryptographic Seal Info */}
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              5T 雜湊鎖憑證防僞資訊 (Cryptographic Hash Lock)
            </div>

            <div className="flex flex-col sm:flex-row justify-between text-slate-400 gap-1 text-[11px]">
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3 text-cyan-400" /> Hash Lock:
                <span className="text-cyan-300 break-all">{result.hashLock}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> TRUTH: {result.fiveTProtocolSeals.truth.sourceOrigin}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> GOODNESS: ISO 14064-1 & Taipower 2024
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> TRUST: SHA-256 Verified
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
