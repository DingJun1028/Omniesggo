'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from '../../src/components/omni-base/OmniCard';
import { OmniButton } from '../../src/components/omni-base/OmniButton';
import { OmniBadge } from '../../src/components/omni-base/OmniBadge';
import {
  ShieldCheck, ShieldAlert, Key, Search, FileCheck, UploadCloud, CheckCircle2, 
  AlertTriangle, FileSpreadsheet, Printer, Sun, Moon, ArrowLeft, FileText, Check, Copy
} from 'lucide-react';
import { PrintableCertificate } from '../../src/components/verifier/printable-certificate';

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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'hash' | 'file'>('hash');
  const [hashInput, setHashInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 接收 URL hashLock 查詢參數
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qHash = params.get('hashLock');
      if (qHash) {
        setHashInput(qHash);
      }
    }
  }, []);

  const handleVerifyHash = async (customHash?: string) => {
    const targetHash = (customHash || hashInput).trim();
    if (!targetHash) return;
    setIsVerifying(true);
    setResult(null);

    try {
      const res = await fetch('/api/verifier/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashLock: targetHash }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setResult({
        isVerified: false,
        status: 'ERROR',
        message: `❌ 驗證請求失敗：${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsVerifying(false);
    }
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
    } catch (err: unknown) {
      setResult({
        isVerified: false,
        status: 'ERROR',
        message: `❌ 檔案比對失敗：${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ── 頂部手冊控制列 (Header) ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30">
                A03 · 5T VERIFIER WORKSTATION
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
                INDEPENDENT AUDIT PORTAL
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              5T 防偽與防篡改查驗工作台 (Verifier)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              第三方稽核與合規查驗 · SHA-256 雜湊鎖比對 · 官方可列印防偽憑證
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

            {/* 跳轉至解析工作站 */}
            <Link href="/parser">
              <button className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm">
                <FileText className="w-3.5 h-3.5" />
                前往 PDF 解析工作台 (/parser)
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── 主畫面 ── */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* 查驗模式卡片 */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-5">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              防偽查驗模式選擇 (Audit Mode)
            </span>
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('hash')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'hash'
                    ? 'bg-white text-teal-800 shadow-sm dark:bg-slate-900 dark:text-cyan-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                Hash Lock 雜湊查驗
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'file'
                    ? 'bg-white text-teal-800 shadow-sm dark:bg-slate-900 dark:text-cyan-300'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                原始檔案特徵碼比對
              </button>
            </div>
          </div>

          {activeTab === 'hash' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  請輸入 64 位 SHA-256 Hash Lock (5T 封印雜湊鎖)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="例: a45a9c066d20a34f7f89b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2..."
                    value={hashInput}
                    onChange={(e) => setHashInput(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  將自不可篡改存證庫 (Evidence Vault) 進行唯一性比對
                </span>
                <OmniButton
                  variant="emerald"
                  onClick={() => handleVerifyHash()}
                  isLoading={isVerifying}
                  disabled={!hashInput.trim() || isVerifying}
                  className="text-xs font-bold px-5 py-2 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5 mr-1" />
                  驗證真偽
                </OmniButton>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                上傳欲查驗真偽的原始 PDF / CSV / JSON 憑證檔案
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-950/40 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.json,.csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                />
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileSpreadsheet className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mb-2" />
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{file.name}</span>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      點擊或拖曳檔案進行 5T 封印比對
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">
                      系統將即時計算 SHA-256 特徵碼並與 DB 封印對比
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-1">
                <OmniButton
                  variant="emerald"
                  onClick={handleVerifyFile}
                  isLoading={isVerifying}
                  disabled={!file || isVerifying}
                  className="text-xs font-bold px-5 py-2 shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  比對 5T 封印
                </OmniButton>
              </div>
            </div>
          )}
        </div>

        {/* 查驗結果卡片 */}
        {result && (
          <div
            className={`border-2 rounded-2xl p-6 transition-all shadow-sm ${
              result.isVerified
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
            }`}
          >
            <div className="flex items-start gap-4">
              {result.isVerified ? (
                <ShieldCheck className="w-9 h-9 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert className="w-9 h-9 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className={`text-base font-bold ${result.isVerified ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>
                    {result.isVerified ? '5T 密碼學憑證驗證成功' : '5T 驗證失敗 / 數據異常'}
                  </h3>
                  <OmniBadge variant={result.isVerified ? 'emerald' : 'rose'}>
                    {result.status}
                  </OmniBadge>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium">
                  {result.message}
                </p>
              </div>
            </div>

            {/* 匹配細節 */}
            {result.isVerified && result.uploadRecord && (
              <div className="mt-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  匹配之 5T 封印正本細節
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">UUID</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{result.uploadRecord.uuid}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">來源系統</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{result.uploadRecord.sourceSystem}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">資料類型 / 筆數</span>
                    <span className="font-semibold text-teal-700 dark:text-cyan-400 font-mono">
                      {result.uploadRecord.dataType} ({result.uploadRecord.recordCount} 筆)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">封印時間</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      {new Date(result.uploadRecord.sealedAt).toLocaleString('zh-TW')}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>SHA-256 Hash Lock</span>
                    <button
                      onClick={() => handleCopyHash(result.uploadRecord!.hashLock)}
                      className="text-teal-700 dark:text-cyan-400 font-bold flex items-center gap-1 hover:underline text-[11px]"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedHash ? '已複製' : '複製'}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 break-all font-bold">
                    {result.uploadRecord.hashLock}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <OmniButton
                    variant="emerald"
                    onClick={() => setShowCertificateModal(true)}
                    className="text-xs font-bold py-2 shadow-sm"
                  >
                    <Printer className="w-4 h-4 mr-1.5" />
                    檢視 / 列印 5T 官方防偽憑證 (Certificate)
                  </OmniButton>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Printable Certificate Modal */}
      {showCertificateModal && result?.uploadRecord && (
        <PrintableCertificate
          data={{
            uuid: result.uploadRecord.uuid,
            sourceOrigin: result.uploadRecord.sourceSystem || 'JunAiKey_OmniAgent',
            hashLock: result.uploadRecord.hashLock,
            sealedAt: result.uploadRecord.sealedAt,
            specVersion: 'v3.4.0',
            fiveTProtocolSeals: {
              truth: { verified: true, sourceOrigin: result.uploadRecord.sourceSystem },
              goodness: { verified: true, standard: 'ISO 14064-1 & Taipower 2024' },
              beauty: { verified: true, uiStyle: 'Liquid Glass Cyan' },
              trust: { verified: true, hashLock: result.uploadRecord.hashLock },
              trackable: { verified: true, uuid: result.uploadRecord.uuid },
            },
          }}
          onClose={() => setShowCertificateModal(false)}
        />
      )}

    </div>
  );
}
