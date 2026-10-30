'use client';

import React, { useState } from 'react';
import { Download, FileText, CheckCircle2, Brain, Calendar, Filter, FileJson, FileSpreadsheet, Archive } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@esggo/ui';
import { motion } from 'framer-motion';
import { ZonePageShell } from '../_components/zone-page-shell';
import { ZoneHeaderCore } from '../_components/zone-header-core';

interface ExportOptions {
  format: 'json' | 'csv' | 'markdown' | 'zip';
  layers: string[];
  includeTags: boolean;
  includeMetadata: boolean;
  dateRange: 'all' | 'today' | 'week' | 'month';
}

export default function ExportPage() {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    layers: ['L0', 'L1', 'L2', 'L3'],
    includeTags: true,
    includeMetadata: true,
    dateRange: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const toggleLayer = (layer: string) => {
    setOptions(prev => ({
      ...prev,
      layers: prev.layers.includes(layer)
        ? prev.layers.filter(l => l !== layer)
        : [...prev.layers, layer]
    }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExported(false);
    try {
      const res = await fetch('/api/omni-agent/shared-brain/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const contentDisposition = res.headers.get('content-disposition');
        const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 
          `omni-memory-export-${Date.now()}.${options.format === 'markdown' ? 'md' : options.format}`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setExported(true);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const layerConfig = {
    L0: { label: '即時記憶', color: 'text-blue-500' },
    L1: { label: '短期記憶', color: 'text-green-500' },
    L2: { label: '長期記憶', color: 'text-orange-500' },
    L3: { label: '核心記憶', color: 'text-purple-500' },
  };

  return (
    <ZonePageShell
      header={
        <>
            <ZoneHeaderCore icon={<Download className="w-6 h-6 text-white" />} title="記憶匯出中心" subtitle="匯出第二共享大腦記憶至本地" iconBg="from-blue-500 to-cyan-500" />
        </>
      }
      mainClassName="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8"
    >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>匯出格式</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button onClick={() => setOptions(prev => ({ ...prev, format: 'json' }))} className={`p-4 rounded-lg border text-left transition-all ${options.format === 'json' ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'}`}>
                  <FileJson className="w-6 h-6 text-yellow-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-1)] mb-1">JSON</h3>
                  <p className="text-xs text-[var(--text-2)]">結構化資料格式</p>
                </button>
                <button onClick={() => setOptions(prev => ({ ...prev, format: 'csv' }))} className={`p-4 rounded-lg border text-left transition-all ${options.format === 'csv' ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'}`}>
                  <FileSpreadsheet className="w-6 h-6 text-green-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-1)] mb-1">CSV</h3>
                  <p className="text-xs text-[var(--text-2)]">試算表相容格式</p>
                </button>
                <button onClick={() => setOptions(prev => ({ ...prev, format: 'markdown' }))} className={`p-4 rounded-lg border text-left transition-all ${options.format === 'markdown' ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'}`}>
                  <FileText className="w-6 h-6 text-blue-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-1)] mb-1">Markdown</h3>
                  <p className="text-xs text-[var(--text-2)]">文檔格式</p>
                </button>
                <button onClick={() => setOptions(prev => ({ ...prev, format: 'zip' }))} className={`p-4 rounded-lg border text-left transition-all ${options.format === 'zip' ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'}`}>
                  <Archive className="w-6 h-6 text-purple-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-1)] mb-1">ZIP (完整)</h3>
                  <p className="text-xs text-[var(--text-2)]">包含所有資料</p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" />匯出篩選</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-[var(--text-1)] mb-3">記憶層級</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(layerConfig).map(([layer, config]) => (
                    <button key={layer} onClick={() => toggleLayer(layer)} className={`px-4 py-2 rounded-lg border transition-all ${options.layers.includes(layer) ? `border-[var(--accent-cool)] bg-[var(--accent-cool-soft)] ${config.color}` : 'border-[var(--border)] text-[var(--text-2)] hover:border-[var(--border-accent)]'}`}>
                      {layer} - {config.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-[var(--text-1)] mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" />時間範圍</h4>
                <div className="flex flex-wrap gap-2">
                  {[{ value: 'all', label: '全部' }, { value: 'today', label: '今天' }, { value: 'week', label: '最近一週' }, { value: 'month', label: '最近一個月' }].map((range) => (
                    <button key={range.value} onClick={() => setOptions(prev => ({ ...prev, dateRange: range.value as any }))} className={`px-4 py-2 rounded-lg border transition-all ${options.dateRange === range.value ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]' : 'border-[var(--border)] text-[var(--text-2)] hover:border-[var(--border-accent)]'}`}>
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={options.includeTags} onChange={(e) => setOptions(prev => ({ ...prev, includeTags: e.target.checked }))} className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent-cool)]" />
                  <span className="text-[var(--text-1)]">包含標籤資訊</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={options.includeMetadata} onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))} className="w-4 h-4 rounded border-[var(--border)] text-[var(--accent-cool)]" />
                  <span className="text-[var(--text-1)]">包含元數據（時間戳、來源等）</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="w-16 h-16 text-[var(--accent-cool)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--text-1)] mb-2">準備匯出記憶</h3>
              <p className="text-[var(--text-2)] mb-6 max-w-md mx-auto">將從 {options.layers.length} 個記憶層級匯出記憶，格式為 {options.format.toUpperCase()}</p>
              <Button variant="primary" size="lg" onClick={handleExport} disabled={isExporting || options.layers.length === 0} className="group">
                {isExporting ? '匯出中...' : '開始匯出'}
                {!isExporting && <Download className="w-5 h-5 ml-2 group-hover:translate-y-0.5 transition-transform" />}
              </Button>
              {exported && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-emerald-500 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />匯出成功！
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>
    </ZonePageShell>
  );
}
