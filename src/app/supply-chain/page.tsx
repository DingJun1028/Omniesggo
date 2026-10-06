'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, AlertTriangle, Leaf, 
  Users, CheckCircle2, Copy, Check, Filter, Search,
  TrendingUp, Download
} from 'lucide-react';
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { OmniBadge } from '@/components/omni-base/OmniBadge';

// 供應商資料型別定義
interface Supplier {
  id: string;
  name: string;
  industry: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  rating: 'A+' | 'A' | 'B' | 'C' | 'D';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  envScore: number;
  socialScore: number;
  govScore: number;
  strengths: string[];
  weaknesses: string[];
  hashLock?: string;
  isSealing?: boolean;
}

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-001',
    name: '台積永續半導體 (TSMC-Green)',
    industry: '半導體製造',
    tier: 'Tier 1',
    rating: 'A+',
    riskLevel: 'Low',
    envScore: 92,
    socialScore: 88,
    govScore: 95,
    strengths: ['100% 綠電使用承諾', '無衝突礦產認證'],
    weaknesses: ['水資源回收率待提升'],
    hashLock: '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'sup-002',
    name: '綠能化學材料股份有限公司',
    industry: '化學材料',
    tier: 'Tier 2',
    rating: 'B',
    riskLevel: 'Medium',
    envScore: 68,
    socialScore: 75,
    govScore: 80,
    strengths: ['勞工權益保障良好'],
    weaknesses: ['碳排放盤查數據不全', '無 ISO14001 認證']
  },
  {
    id: 'sup-003',
    name: '光達封裝測試廠',
    industry: '電子零組件',
    tier: 'Tier 1',
    rating: 'C',
    riskLevel: 'High',
    envScore: 55,
    socialScore: 60,
    govScore: 65,
    strengths: ['定期董事會報告'],
    weaknesses: ['發生過重大職安事故', '高耗能機台未汰換']
  }
];

export default function SupplyChainWarRoom() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // 預設深色主題
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 監聽並自動適配 html class (Liquid Glass Dark/Light Theme)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(theme);
    
    // 背景設定
    if (theme === 'dark') {
      document.body.style.backgroundColor = '#020617';
      document.body.style.color = '#f8fafc';
    } else {
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
    
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, [theme]);

  // 執行 5T 雜湊封印
  const handleSeal = async (supplierId: string) => {
    // 標記進行中
    setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, isSealing: true } : s));
    
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    try {
      const res = await fetch('/api/supply-chain/seal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplier, year: 2026 })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuppliers(prev => prev.map(s => 
          s.id === supplierId ? { ...s, isSealing: false, hashLock: data.data.hashLock } : s
        ));
      } else {
        alert('封印失敗: ' + data.error);
        setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, isSealing: false } : s));
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('網路異常，封印失敗');
      setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, isSealing: false } : s));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSuppliers = selectedTier === 'All' 
    ? suppliers 
    : suppliers.filter(s => s.tier === selectedTier);

  // 取得風險徽章顏色
  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  // 取得評級顏色
  const getRatingColor = (rating: string) => {
    if (rating === 'A+' || rating === 'A') return 'text-emerald-500';
    if (rating === 'B') return 'text-cyan-500';
    if (rating === 'C') return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen p-6 font-sans">
      {/* 頂部導航 */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <OmniBadge variant="outline" className="text-cyan-500 border-cyan-500">A05 · SUPPLY CHAIN ESG</OmniBadge>
            <OmniBadge variant="outline" className="text-emerald-500 border-emerald-500">CSDDD COMPLIANT</OmniBadge>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">供應鏈永續盡職調查戰情室</h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            穿透式供應商治理機制，對一二級供應商進行 ESG 綜合評鑑，並產出具備 5T 密碼學背書的官方合格憑證。
          </p>
        </div>
        <div className="flex gap-3">
          <OmniButton 
            variant="outline"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            切換 {theme === 'dark' ? '淺色' : '深色'} 手冊主題
          </OmniButton>
          <OmniButton className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Building2 className="w-4 h-4 mr-2" />
            新增供應商審計
          </OmniButton>
        </div>
      </div>

      {/* 戰情看板 */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <OmniCard className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <OmniCardContent className="p-6">
            <div className="text-sm text-gray-400 mb-1">受稽供應商總數</div>
            <div className="text-3xl font-bold text-white">324</div>
            <div className="text-sm text-emerald-500 mt-2 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +12 本月新增
            </div>
          </OmniCardContent>
        </OmniCard>
        <OmniCard className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <OmniCardContent className="p-6">
            <div className="text-sm text-gray-400 mb-1">A 級優良供應商比例</div>
            <div className="text-3xl font-bold text-emerald-400">42%</div>
            <div className="text-sm text-gray-500 mt-2">136 家達標</div>
          </OmniCardContent>
        </OmniCard>
        <OmniCard className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <OmniCardContent className="p-6">
            <div className="text-sm text-gray-400 mb-1">高風險 (High Risk) 警示</div>
            <div className="text-3xl font-bold text-orange-500">18</div>
            <div className="text-sm text-gray-500 mt-2">需立即介入輔導</div>
          </OmniCardContent>
        </OmniCard>
        <OmniCard className="bg-slate-900/50 border-slate-800 backdrop-blur-xl">
          <OmniCardContent className="p-6">
            <div className="text-sm text-gray-400 mb-1">5T 確信封印完成度</div>
            <div className="text-3xl font-bold text-cyan-400">89%</div>
            <div className="text-sm text-gray-500 mt-2">已上鏈存證 288 筆</div>
          </OmniCardContent>
        </OmniCard>
      </div>

      {/* 名錄篩選與表格 */}
      <div className="max-w-7xl mx-auto">
        <OmniCard className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
          <OmniCardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
            <OmniCardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-500" />
              供應鏈全景名錄戰情表
            </OmniCardTitle>
            <div className="flex gap-2">
              <select 
                className="bg-slate-950 border border-slate-800 text-sm rounded-md px-3 py-1 text-slate-300 outline-none"
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
              >
                <option value="All">全階層 (All Tiers)</option>
                <option value="Tier 1">Tier 1 關鍵模組</option>
                <option value="Tier 2">Tier 2 原物料商</option>
              </select>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="搜尋供應商..." 
                  className="bg-slate-950 border border-slate-800 text-sm rounded-md pl-9 pr-3 py-1 text-slate-300 outline-none w-64"
                />
              </div>
            </div>
          </OmniCardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-sm">
                  <th className="p-4 font-medium">供應商名稱</th>
                  <th className="p-4 font-medium">階層與產業</th>
                  <th className="p-4 font-medium">ESG 分數 (E/S/G)</th>
                  <th className="p-4 font-medium">評級/風險</th>
                  <th className="p-4 font-medium">優劣勢分析</th>
                  <th className="p-4 font-medium text-right">5T 封印狀態</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{supplier.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">ID: {supplier.id}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300">{supplier.tier}</div>
                      <div className="text-xs text-slate-500 mt-1">{supplier.industry}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center text-emerald-400"><Leaf className="w-3 h-3 mr-1"/> {supplier.envScore}</span>
                        <span className="flex items-center text-blue-400"><Users className="w-3 h-3 mr-1"/> {supplier.socialScore}</span>
                        <span className="flex items-center text-purple-400"><Building2 className="w-3 h-3 mr-1"/> {supplier.govScore}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2 items-start">
                        <span className={`text-xl font-bold ${getRatingColor(supplier.rating)}`}>{supplier.rating}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getRiskBadgeColor(supplier.riskLevel)}`}>
                          {supplier.riskLevel} Risk
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 max-w-xs">
                        {supplier.strengths.map((s, i) => (
                          <div key={i} className="text-xs text-emerald-400 flex items-start">
                            <span className="mr-1 mt-0.5">+</span><span className="truncate">{s}</span>
                          </div>
                        ))}
                        {supplier.weaknesses.map((w, i) => (
                          <div key={i} className="text-xs text-orange-400 flex items-start">
                            <span className="mr-1 mt-0.5">-</span><span className="truncate">{w}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {supplier.hashLock ? (
                        <div className="flex flex-col items-end gap-2">
                          <OmniBadge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 font-mono">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            5T Verified
                          </OmniBadge>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-gray-500">
                              {supplier.hashLock.substring(0, 10)}...
                            </span>
                            <button 
                              onClick={() => copyToClipboard(supplier.hashLock!, supplier.id)}
                              className="text-gray-500 hover:text-white transition-colors p-1"
                              title="複製完整 Hash Lock"
                            >
                              {copiedId === supplier.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <button className="text-xs text-cyan-500 hover:text-cyan-400 flex items-center mt-1 transition-colors">
                            <Download className="w-3 h-3 mr-1" /> 下載合規憑證
                          </button>
                        </div>
                      ) : (
                        <OmniButton 
                          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs py-1 h-8"
                          onClick={() => handleSeal(supplier.id)}
                          disabled={supplier.isSealing}
                        >
                          {supplier.isSealing ? '封印中...' : '執行 5T 封印存證'}
                        </OmniButton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </OmniCard>
      </div>
    </div>
  );
}
