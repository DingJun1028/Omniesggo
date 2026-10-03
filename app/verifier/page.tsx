'use client';

import { useState, useRef } from 'react';
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from '../../src/components/omni-base/OmniCard';
import { OmniButton } from '../../src/components/omni-base/OmniButton';
import { OmniBadge } from '../../src/components/omni-base/OmniBadge';
import {
  ShieldCheck, ShieldAlert, Key, Search, FileCheck, UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet
} from 'lucide-react';

interface VerificationResult {
  isVerified: boolean;
  status: string;
  message: string;
  uploadRecord?: {
    uuid: string;
    sourceSystem: string;
    dataType: string;
    recordCount: number;
    hashLock: string;
    sealedAt: string;
    metrics?: Record<string, string>;
  };
}

export default function VerifierPage() {
  const [activeTab, setActiveTab] = useState<'hash' | 'file'>('hash');
  const [hashInput, setHashInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVerifyHash = async () => {
    if (!hashInput.trim()) return;
    setIsVerifying(true);
    setResult(null);

    try {
      const res = await fetch('/api/verifier/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashLock: hashInput.trim() }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        isVerified: false,
        status: 'ERROR',
        message: `❌ 驗證請求失敗：${(err as Error).message}`,
      });
    }
    setIsVerifying(false);
  };

  const handleVerifyFile = async () => {
    if (!file) return;
    setIsVerifying(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/verifier/check', { method: 'POST', body: form });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        isVerified: false,
        status: 'ERROR',
        message: `❌ 檔案比對失敗：${(err as Error).message}`,
      });
    }
    setIsVerifying(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-400 dark:to-cyan-400 flex items-center gap-3">
          <ShieldCheck className="w-9 h-9 text-emerald-500 shrink-0" />
          5T 防偽與防篡改驗證器 (5T Verifier)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          第三方稽核員與合規人員專用工具。可輸入 <span className="text-emerald-500 font-semibold">SHA-256 Hash Lock</span> 或直接上傳檔案，比對 Supabase 數據庫中的不可篡改封印憑證。
        </p>
      </div>

      {/* Main Verification Card */}
      <OmniCard variant="glass" glow>
        <OmniCardHeader>
          <OmniCardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-500" />
              防偽查驗模式選擇
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => { setActiveTab('hash'); setResult(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'hash'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Hash Lock / UUID 比對
              </button>
              <button
                onClick={() => { setActiveTab('file'); setResult(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'file'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                檔案防篡改掃描
              </button>
            </div>
          </OmniCardTitle>
        </OmniCardHeader>
        <OmniCardContent className="space-y-6">
          {activeTab === 'hash' ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                貼上 5T Hash Lock 密碼學雜湊值或 UUID 憑證號
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Key className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    placeholder="輸入如: 405dc22d-c39f-4ac1-a1d6-45ac6bc211df 或 641a3cbd..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <OmniButton
                  variant="emerald"
                  onClick={handleVerifyHash}
                  isLoading={isVerifying}
                  disabled={!hashInput.trim() || isVerifying}
                >
                  <Search className="w-4 h-4 mr-1.5" />
                  驗證真偽
                </OmniButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                上傳欲查驗真偽的原始 CSV / Excel 檔案
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-400 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileSpreadsheet className="w-10 h-10 text-emerald-500 mb-2" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{file.name}</span>
                    <span className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">點擊或拖曳檔案進行 Hash Lock 比對</span>
                    <span className="text-xs text-slate-400 mt-1">系統將即時計算運算雜湊值並與 DB 封印比對</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <OmniButton
                  variant="emerald"
                  onClick={handleVerifyFile}
                  isLoading={isVerifying}
                  disabled={!file || isSyncingVerifying(isVerifying)}
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  比對 5T 封印
                </OmniButton>
              </div>
            </div>
          )}
        </OmniCardContent>
      </OmniCard>

      {/* Verification Result Banner */}
      {result && (
        <OmniCard
          variant={result.isVerified ? 'glass' : 'default'}
          glow={result.isVerified}
          className={`border-2 transition-all ${
            result.isVerified
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
          }`}
        >
          <OmniCardContent className="p-6 space-y-5">
            <div className="flex items-start gap-4">
              {result.isVerified ? (
                <ShieldCheck className="w-10 h-10 text-emerald-500 shrink-0" />
              ) : (
                <ShieldAlert className="w-10 h-10 text-rose-500 shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className={`text-lg font-black ${result.isVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {result.isVerified ? '5T 密碼學憑證驗證成功' : '5T 驗證失敗 / 數據異常'}
                  </h3>
                  <OmniBadge variant={result.isVerified ? 'emerald' : 'rose'}>
                    {result.status}
                  </OmniBadge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                  {result.message}
                </p>
              </div>
            </div>

            {/* Matched Details */}
            {result.isVerified && result.uploadRecord && (
              <div className="mt-4 p-4 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  匹配之 5T 封印正本細節
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">UUID</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.uploadRecord.uuid}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">來源檔案</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{result.uploadRecord.sourceSystem}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">資料類型 / 筆數</span>
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">{result.uploadRecord.dataType} ({result.uploadRecord.recordCount} 筆)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">封印時間</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(result.uploadRecord.sealedAt).toLocaleString('zh-TW')}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-xs block mb-1">SHA-256 Hash Lock</span>
                  <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-slate-100 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 break-all">
                    {result.uploadRecord.hashLock}
                  </div>
                </div>
              </div>
            )}
          </OmniCardContent>
        </OmniCard>
      )}
    </div>
  );
}

function isSyncingVerifying(val: boolean) {
  return val;
}
