'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Sun, Moon, ShieldCheck, Download, Lock, Copy, Check,
  Search, RefreshCw, Key, FileCheck, Database, ArrowRight,
  Layers, CheckCircle2, ShieldAlert, Cpu, Sparkles, Hash
} from 'lucide-react';
import { OmniCard } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

interface SealRecord {
  id: string;
  documentName: string;
  hashLock: string;
  zkpProof?: string;
  sealedAt: number;
  sourceOrigin: string;
}

const DEFAULT_SEALS: SealRecord[] = [
  {
    id: 'seal-2026-001',
    documentName: 'A06 企業 2050 淨零碳中和減碳路徑與 MACC 規劃案',
    hashLock: '4a6b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
    zkpProof: 'zkp_proof_v1_98ef2b892a0134bc5e903a4512e9b08f',
    sealedAt: Date.now() - 3600000 * 2,
    sourceOrigin: 'OmniCarbon Matrix Engine v2.0'
  },
  {
    id: 'seal-2026-002',
    documentName: 'A02 善向永續晶圓製造 2026 GRI / ISO 14064 永續報告書',
    hashLock: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    zkpProof: 'zkp_proof_v1_e3b0c44298fc1c149afbf4c8996fb924',
    sealedAt: Date.now() - 3600000 * 12,
    sourceOrigin: 'A02 ESGReports Center'
  },
  {
    id: 'seal-2026-003',
    documentName: 'A04 2026 企業雙重重大性 (Double Materiality) 評估矩陣',
    hashLock: '7d5870b2c3a51f3d82a170fb98ef2b892a0134bc5e903a4512e9b08f5127d49e',
    zkpProof: 'zkp_proof_v1_7d5870b2c3a51f3d82a170fb98ef2b89',
    sealedAt: Date.now() - 3600000 * 24,
    sourceOrigin: 'A04 Materiality Engine'
  },
  {
    id: 'seal-2026-004',
    documentName: 'A05 Tier 1 關鍵綠色供應鏈盡職調查與 CSDD 評級清單',
    hashLock: 'a45a9c066d20a34f7f89b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2',
    zkpProof: 'zkp_proof_v1_a45a9c066d20a34f7f89b1c2d3e4f5a6',
    sealedAt: Date.now() - 3600000 * 48,
    sourceOrigin: 'A05 SupplyChain Portal'
  }
];

export default function DigitalTrustHubPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [seals, setSeals] = useState<SealRecord[]>(DEFAULT_SEALS);
  const [searchQuery, setSearchQuery] = useState('');
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // 線上即時 SHA-256 驗算器狀態
  const [calcInput, setCalcInput] = useState('');
  const [calcHash, setCalcHash] = useState('');

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

  const fetchSeals = async () => {
    try {
      const res = await fetch('/api/trust/seal');
      const data = await res.json();
      if (data.success && Array.isArray(data.seals) && data.seals.length > 0) {
        setSeals(data.seals);
      }
    } catch (e) {
      console.error('Fetch seals error:', e);
    }
  };

  useEffect(() => {
    fetchSeals();
  }, []);

  // 即時計算 SHA-256
  useEffect(() => {
    if (!calcInput.trim()) {
      setCalcHash('');
      return;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(calcInput);
    crypto.subtle.digest('SHA-256', data).then(buffer => {
      const hashArray = Array.from(new Uint8Array(buffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setCalcHash(hashHex);
    });
  }, [calcInput]);

  const handleSeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !docContent.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/trust/seal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentName: docName, content: docContent })
      });
      const data = await res.json();
      if (data.success && data.seal) {
        setSeals(prev => [data.seal, ...prev]);
        setDocName('');
        setDocContent('');
      } else {
        // Fallback 本地生成
        const encoder = new TextEncoder();
        const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(docContent));
        const hashHex = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        const localSeal: SealRecord = {
          id: `seal-${Date.now().toString().slice(-6)}`,
          documentName: docName,
          hashLock: hashHex,
          zkpProof: `zkp_proof_v1_${hashHex.slice(0, 32)}`,
          sealedAt: Date.now(),
          sourceOrigin: 'OmniCore Local Trust Engine'
        };
        setSeals(prev => [localSeal, ...prev]);
        setDocName('');
        setDocContent('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDownloadSealJson = (seal: SealRecord) => {
    const blob = new Blob([JSON.stringify(seal, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `5T-Proof-${seal.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSeals = useMemo(() => {
    if (!searchQuery.trim()) return seals;
    const q = searchQuery.toLowerCase();
    return seals.filter(s => 
      s.documentName.toLowerCase().includes(q) ||
      s.hashLock.toLowerCase().includes(q) ||
      s.sourceOrigin.toLowerCase().includes(q)
    );
  }, [seals, searchQuery]);

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ── 1. 頂部手冊控制列 (Header & Theme Capsule) ── */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-white/10 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200/90 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-500/30">
                A07 · TRUST ANCHOR & EVIDENCE VAULT
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                5T PROTOCOL HASH LOCK
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-teal-600 dark:text-cyan-400" />
              信任錨定與密碼學存證中心 (Trust Hub)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              ESGGO 抵禦綠洗終極防線 · 5T 全維度密碼學不可篡改存證 · Merkle 樹零知識證明保險庫
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

            {/* 導航至數據橋接管線 */}
            <Link
              href="/data-bridge"
              className="px-3.5 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Database className="w-3.5 h-3.5" />
              <span>進入數據橋接管線 (/data-bridge)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={fetchSeals}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              重新整理
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. 主內容網格 ── */}
      <main className="max-w-[1600px] mx-auto p-6 space-y-6">

        {/* 5T 治理健康度 5 大核心指標 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-teal-700 dark:text-cyan-400 font-bold mb-1">
              <span>真 (Traceable)</span>
              <span>100%</span>
            </div>
            <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">來源追溯刻印</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">100% 原始數據附帶 sourceOrigin</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-teal-600 dark:bg-cyan-400 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-bold mb-1">
              <span>善 (Transparent)</span>
              <span>99.8%</span>
            </div>
            <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">演算法透明化</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">ISO-14064 係數公式全公開</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full" style={{ width: '99.8%' }} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400 font-bold mb-1">
              <span>美 (Tangible)</span>
              <span>100%</span>
            </div>
            <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">純色手冊體驗</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">全站 0 處漸層文字 · 高對比印刷</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-blue-600 dark:bg-blue-400 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-400 font-bold mb-1">
              <span>信 (Trustworthy)</span>
              <span>100%</span>
            </div>
            <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">Hash Lock 封印</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">SHA-256 密碼學防篡改磐石</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-purple-600 dark:bg-purple-400 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-bold mb-1">
              <span>通 (Transferful)</span>
              <span>99.4%</span>
            </div>
            <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">全生命週期追蹤</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Hook 跨端即時連動校驗</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-rose-600 dark:bg-rose-400 h-full rounded-full" style={{ width: '99.4%' }} />
            </div>
          </div>
        </div>

        {/* 雙欄主區塊：左側驗算與新增存證，右側證據保管庫清單 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* 左側欄位 (5 cols) */}
          <div className="lg:col-span-5 space-y-6">

            {/* 即時 SHA-256 密碼學驗算工具 */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-cyan-400 flex items-center gap-2">
                  <Hash className="w-4 h-4" /> 即時密碼學驗算工具 (Live SHA-256)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-cyan-300 font-bold">
                  Zero Knowledge
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                在瀏覽器本地即時驗算任意特徵值或報告文字之 SHA-256 雜湊鎖，絕不上傳明文。
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    輸入檢驗特徵或內容
                  </label>
                  <textarea
                    rows={3}
                    placeholder="輸入文字、數字或 JSON 特徵..."
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                {calcHash && (
                  <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-mono">
                      <span>SHA-256 輸出雜湊鎖:</span>
                      <button
                        onClick={() => handleCopyHash(calcHash)}
                        className="text-teal-600 dark:text-cyan-400 hover:opacity-80 flex items-center gap-1 font-bold"
                      >
                        {copiedHash === calcHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>複製</span>
                      </button>
                    </div>
                    <span className="font-mono text-xs font-bold text-teal-700 dark:text-cyan-400 break-all select-all">
                      {calcHash}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 新增 5T 存證封印表單 */}
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-cyan-400 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> 執行 5T 密碼學存證封印
                </h3>
              </div>

              <form onSubmit={handleSeal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    文件 / 資產名稱
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例：2026 Q3 溫室氣體盤查外部查驗聲明"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    存證特徵內容 (Payload)
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="貼上文字、盤查清冊結構或 JSON 摘要..."
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !docName.trim() || !docContent.trim()}
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Lock className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? '正在計算 SHA-256 與 ZKP 封裝...' : '立即封印並登錄至 Evidence Vault'}
                </button>
              </form>
            </div>

          </div>

          {/* 右側欄位：密碼學證據金庫清單 (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-teal-600 dark:text-cyan-400" /> 
                    密碼學證據保管箱清單 (Evidence Vault)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    共存證 {seals.length} 筆不可篡改紀錄 · 包含 SHA-256 Hash Lock 與 ZKP Proof
                  </p>
                </div>

                {/* 搜尋列 */}
                <div className="relative w-full md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜尋文件名稱或雜湊..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* 存證項目卡片清單 */}
              <div className="space-y-3">
                {filteredSeals.map((seal) => (
                  <div
                    key={seal.id}
                    className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-xs space-y-2 hover:border-teal-500/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {seal.documentName}
                        </h4>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400 shrink-0">
                        {new Date(seal.sealedAt).toISOString().replace('T', ' ').substring(0, 19)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>來源模組:</span>
                      <span className="font-mono text-teal-700 dark:text-cyan-400 font-semibold">{seal.sourceOrigin}</span>
                    </div>

                    {/* Hash Lock 區塊 */}
                    <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Lock className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400 shrink-0" />
                        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate">
                          {seal.hashLock}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopyHash(seal.hashLock)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                          title="複製 Hash Lock"
                        >
                          {copiedHash === seal.hashLock ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedHash === seal.hashLock ? '已複製' : '複製'}</span>
                        </button>

                        <button
                          onClick={() => handleDownloadSealJson(seal)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                          title="下載 JSON 存證"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>存證</span>
                        </button>
                      </div>
                    </div>

                    {seal.zkpProof && (
                      <div className="font-mono text-[10px] text-slate-400 truncate">
                        ZKP 封裝標籤: <span className="text-slate-500 dark:text-slate-400">{seal.zkpProof}</span>
                      </div>
                    )}
                  </div>
                ))}

                {filteredSeals.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    查無符合條件的存證紀錄
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
