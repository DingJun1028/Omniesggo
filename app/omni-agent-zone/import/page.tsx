'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Upload, FileText, Database, 
  CheckCircle2, AlertCircle, Download, Brain,
  History, Zap
} from 'lucide-react';
import { Button } from '@esggo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@esggo/ui';
import { motion } from 'framer-motion';

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  memories: any[];
}

export default function ImportPage() {
  const [importType, setImportType] = useState<'json' | 'csv' | 'history' | 'api'>('json');
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file && importType !== 'history') return;
    setIsImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('type', importType);
      const res = await fetch('/api/omni-agent/shared-brain/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['匯入失敗：' + (error as Error).message],
        memories: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const importFromHistory = async () => {
    setIsImporting(true);
    setResult(null);
    try {
      const res = await fetch('/api/omni-agent/shared-brain/import/history', {
        method: 'POST',
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['從歷史記錄匯入失敗：' + (error as Error).message],
        memories: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-4">
              <Link href="/omni-agent-zone">
                <Button variant="ghost" size="sm" className="group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  返回專區
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-[var(--text-1)]">記憶匯入中心</h1>
                  <p className="text-xs text-[var(--text-3)]">從當前紀錄匯入至第二共享大腦</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>匯入方式選擇</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => setImportType('json')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    importType === 'json' ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'
                  }`}
                >
                  <FileText className="w-6 h-6 text-[var(--accent-cool)] mb-2" />
                  <h3 className="font-medium text-[var(--text-1)] mb-1">JSON 檔案</h3>
                  <p className="text-xs text-[var(--text-2)]">結構化記憶資料</p>
                </button>
                <button
                  onClick={() => setImportType('csv')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    importType === 'csv' ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'
                  }`}
                >
                  <Database className="w-6 h-6 text-green-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-1)] mb-1">CSV 檔案</h3>
                  <p className="text-xs text-[var(--text-2)]">表格式記憶資料</p>
                </button>
                <button
                  onClick={() => setImportType('history')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    importType === 'history' ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'
                  }`}
                >
                  <History className="w-6 h-6 text-orange-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-1)] mb-1">對話歷史</h3>
                  <p className="text-xs text-[var(--text-2)]">從當前會話匯入</p>
                </button>
                <button
                  onClick={() => setImportType('api')}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    importType === 'api' ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'
                  }`}
                >
                  <Zap className="w-6 h-6 text-purple-500 mb-2" />
                  <h3 className="font-medium text-[var(--text-1)] mb-1">API 匯入</h3>
                  <p className="text-xs text-[var(--text-2)]">從外部系統匯入</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {importType === 'history' ? (
            <Card className="mb-6">
              <CardContent className="p-8 text-center">
                <History className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--text-1)] mb-2">從當前對話歷史匯入</h3>
                <p className="text-[var(--text-2)] mb-6 max-w-md mx-auto">將當前會話中的對話記錄、自動提取的知識點和重要決策匯入至第二共享大腦</p>
                <Button variant="primary" size="lg" onClick={importFromHistory} disabled={isImporting} className="group">
                  {isImporting ? '匯入中...' : '開始匯入歷史記錄'}
                  {!isImporting && <Download className="w-5 h-5 ml-2 group-hover:translate-y-0.5 transition-transform" />}
                </Button>
              </CardContent>
            </Card>
          ) : importType === 'api' ? (
            <Card className="mb-6">
              <CardContent className="p-8 text-center">
                <Zap className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--text-1)] mb-2">從 API 匯入</h3>
                <p className="text-[var(--text-2)] mb-6 max-w-md mx-auto">連接外部系統 API，自動同步記憶資料至共享大腦</p>
                <Button variant="primary" size="lg" disabled>即將推出</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>上傳檔案</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept={importType === 'json' ? '.json' : '.csv'}
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-12 h-12 text-[var(--text-3)] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[var(--text-1)] mb-2">{file ? file.name : '拖放檔案至此或點擊上傳'}</h3>
                  <p className="text-[var(--text-2)] mb-4">支援 {importType === 'json' ? 'JSON' : 'CSV'} 格式</p>
                  {file && (
                    <Button variant="primary" onClick={handleImport} disabled={isImporting}>
                      {isImporting ? '匯入中...' : '開始匯入'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                    匯入結果
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                      <p className="text-2xl font-bold text-emerald-500">{result.imported}</p>
                      <p className="text-sm text-[var(--text-2)]">已匯入</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30">
                      <p className="text-2xl font-bold text-orange-500">{result.skipped}</p>
                      <p className="text-sm text-[var(--text-2)]">已跳過</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-950/30">
                      <p className="text-2xl font-bold text-red-500">{result.errors.length}</p>
                      <p className="text-sm text-[var(--text-2)]">錯誤</p>
                    </div>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">錯誤訊息</h4>
                      <ul className="space-y-1">
                        {result.errors.map((err, idx) => (
                          <li key={idx} className="text-sm text-red-600 dark:text-red-400">• {err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.success && result.imported > 0 && (
                    <div className="flex gap-3">
                      <Link href="/omni-agent-zone" className="flex-1">
                        <Button variant="primary" className="w-full group">
                          <Brain className="w-4 h-4 mr-2" />
                          查看共享大腦
                        </Button>
                      </Link>
                      <Button variant="secondary" onClick={() => { setResult(null); setFile(null); }} className="flex-1">
                        繼續匯入
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
