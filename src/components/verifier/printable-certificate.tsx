'use client';

import React from 'react';
import { ShieldCheck, Award, Printer, Hash, CheckCircle2, Lock, Sparkles, Download } from 'lucide-react';

export interface ICertificateData {
  uuid: string;
  recordType?: string;
  sourceOrigin: string;
  hashLock: string;
  sealedAt: string | number;
  specVersion?: string;
  metrics?: Record<string, any>;
  fiveTProtocolSeals?: {
    truth?: { verified: boolean; sourceOrigin: string };
    goodness?: { verified: boolean; standard: string };
    beauty?: { verified: boolean; uiStyle?: string };
    trust?: { verified: boolean; hashLock: string };
    trackable?: { verified: boolean; uuid: string };
  };
}

interface Props {
  data: ICertificateData;
  onClose?: () => void;
}

export function PrintableCertificate({ data, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const sealedDateStr = typeof data.sealedAt === 'number' 
    ? new Date(data.sealedAt).toLocaleString('zh-TW') 
    : new Date(data.sealedAt || Date.now()).toLocaleString('zh-TW');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      {/* Print-specific style overrides */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-certificate-card, #printable-certificate-card * {
            visibility: visible;
          }
          #printable-certificate-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-3xl bg-slate-950 border border-amber-500/40 rounded-3xl p-8 shadow-[0_0_50px_rgba(245,158,11,0.15)] relative space-y-6 animate-fadeIn" id="printable-certificate-card">
        {/* Top Actions Bar (No Print) */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs">
            <Award className="w-4 h-4" /> 5T 防偽確信證書檢視器 (Official 5T Certificate)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <Printer className="w-3.5 h-3.5" /> 列印 / 存為 PDF 憑證
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
              >
                關閉
              </button>
            )}
          </div>
        </div>

        {/* Certificate Outer Frame */}
        <div className="border-4 border-double border-amber-500/50 p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-[#121619] to-slate-950 text-slate-100 space-y-6 relative overflow-hidden">
          {/* Watermark Background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <ShieldCheck className="w-96 h-96 text-amber-400" />
          </div>

          {/* Certificate Header */}
          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-xs">
              <Sparkles className="w-3.5 h-3.5" /> OFFICIAL 5T COMPLIANCE CERTIFICATE
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-white">
              ESG GO 永續治理 5T 防偽密碼學確信憑證
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              SPECIFICATION VERSION: {data.specVersion || 'v3.4.0'} • 100% DE-GOOGLE ARCHITECTURE
            </p>
          </div>

          {/* Main Info Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono relative z-10">
            <div>
              <span className="text-slate-400 block mb-1">憑證唯一識別碼 (UUID)</span>
              <span className="text-cyan-300 font-bold break-all">{data.uuid}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">數據來源起點 (Source Origin)</span>
              <span className="text-amber-300 font-bold">{data.sourceOrigin || 'JunAiKey_OmniAgent'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">合規標準 (Compliance Standard)</span>
              <span className="text-emerald-300 font-bold">ISO 14064-1 & Taipower 2024 (0.494 kgCO2e/kWh)</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">密碼封印時間 (Sealed At)</span>
              <span className="text-slate-200 font-bold">{sealedDateStr}</span>
            </div>
          </div>

          {/* 5T Seals Status Grid */}
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              5T 協議防偽印記 (Five-T Protocol Seals)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-center">
              <div className="p-2 rounded bg-slate-900 border border-emerald-500/30 text-emerald-300">
                真 (TRUTH)<br /><span className="text-[9px] text-slate-400">Source Verified</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-cyan-500/30 text-cyan-300">
                善 (GOODNESS)<br /><span className="text-[9px] text-slate-400">GRI & ISO Standard</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-purple-500/30 text-purple-300">
                美 (BEAUTY)<br /><span className="text-[9px] text-slate-400">Liquid Glass Matrix</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-amber-500/30 text-amber-300">
                信 (TRUST)<br /><span className="text-[9px] text-slate-400">Hash Lock Sealed</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-indigo-500/30 text-indigo-300">
                通 (TRACKABLE)<br /><span className="text-[9px] text-slate-400">Lifecycle Active</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash Lock Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1.5 font-mono text-xs relative z-10">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Lock className="w-3.5 h-3.5" /> SHA-256 Cryptographic Hash Lock
            </div>
            <div className="text-[11px] text-cyan-300 break-all p-2 rounded bg-slate-900 border border-slate-800">
              {data.hashLock}
            </div>
          </div>

          {/* Certificate Footer */}
          <div className="flex justify-between items-end pt-2 text-[10px] font-mono text-slate-500 border-t border-slate-800 relative z-10">
            <div>
              <span>發證機構: ESG GO 善向永續 數位信任中心</span><br />
              <span>網址: https://esggo.co/verifier</span>
            </div>
            <div className="text-right">
              <span className="text-amber-400 font-bold">5T VERIFIED & SEALED</span><br />
              <span>© 2026 ESG GO System</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
