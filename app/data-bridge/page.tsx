'use client';

import { useState, useRef, useEffect } from 'react';
import { OmniCard, OmniCardHeader, OmniCardTitle, OmniCardContent } from '../../src/components/omni-base/OmniCard';
import { OmniButton } from '../../src/components/omni-base/OmniButton';
import { OmniBadge } from '../../src/components/omni-base/OmniBadge';
import {
  Database, UploadCloud, FileSpreadsheet, Key, ShieldCheck,
  Activity, Link as LinkIcon, CheckCircle2, AlertCircle, TableProperties, Clock, FileCheck
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BridgeLog {
  id: string;
  timestamp: string;
  message: string;
  status: 'info' | 'success' | 'error';
  hash?: string;
}

interface AnalysisResult {
  type: string;
  recordCount: number;
  metrics: Record<string, string>;
  scopeAffected: string;
}

interface UploadResponse {
  success: boolean;
  error?: string;
  uuid?: string;
  timestamp?: number;
  hashLock?: string;
  fileName?: string;
  fileSize?: number;
  detectedColumns?: string[];
  analysis?: AnalysisResult;
  preview?: Record<string, string>[];
}

interface HistoricalRecord {
  id: string;
  sourceSystem: string;
  dataType: string;
  recordCount: number;
  hashLock: string;
  metrics?: { metrics?: Record<string, string>; type?: string };
  createdAt: string;
}

// ─── DataType Config ──────────────────────────────────────────────────────────
const DATA_TYPES = [
  { value: 'hr_attendance', label: '人資系統：員工出缺勤 (通勤碳足跡)', scope: 'Scope 3' },
  { value: 'hr_roster',     label: '人資系統：員工名冊 (組織邊界)',     scope: 'GRI 2-7' },
  { value: 'erp_energy',    label: 'ERP 系統：能源度數 (電力)',          scope: 'Scope 2' },
  { value: 'erp_materials', label: 'ERP 系統：原物料採購',               scope: 'Scope 3' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DataBridgePage() {
  const [isDragging, setIsDragging]         = useState(false);
  const [file, setFile]                     = useState<File | null>(null);
  const [dataType, setDataType]             = useState('hr_attendance');
  const [logs, setLogs]                     = useState<BridgeLog[]>([]);
  const [isSyncing, setIsSyncing]           = useState(false);
  const [result, setResult]                 = useState<UploadResponse | null>(null);
  const [history, setHistory]               = useState<HistoricalRecord[]>([]);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/data-bridge/records');
      const data = await res.json();
      if (data.success && Array.isArray(data.uploads)) {
        setHistory(data.uploads);
      }
    } catch (err) {
      console.warn('Failed to fetch historical uploads', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const addLog = (message: string, status: BridgeLog['status'] = 'info', hash?: string) => {
    setLogs(prev => [{
      id: crypto.randomUUID(),
      timestamp: new Date().toTimeString().slice(0, 8),
      message, status, hash,
    }, ...prev]);
  };

  // ─── File handlers ─────────────────────────────────────────────────────────
  const handleFileSelection = (f: File) => {
    const ok = ['.csv', '.xlsx', '.xls'].some(ext => f.name.toLowerCase().endsWith(ext));
    if (!ok) { addLog('僅支援 CSV 或 Excel (.xlsx / .xls) 格式', 'error'); return; }
    setFile(f);
    setResult(null);
    addLog(`已載入檔案：${f.name}（${(f.size / 1024).toFixed(1)} KB）`, 'info');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFileSelection(e.dataTransfer.files[0]);
  };

  // ─── Bridge execution ──────────────────────────────────────────────────────
  const startSync = async () => {
    if (!file) { addLog('請先選擇要橋接的檔案', 'error'); return; }
    setIsSyncing(true);
    setResult(null);

    const typeLabel = DATA_TYPES.find(d => d.value === dataType)?.label ?? dataType;
    addLog(`▶ 啟動資料橋接序列 → ${typeLabel}`, 'info');
    addLog('📡 傳送至 5T Protocol Guard...', 'info');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('dataType', dataType);

      const res = await fetch('/api/data-bridge/upload', { method: 'POST', body: form });
      const data: UploadResponse = await res.json();

      if (!data.success) {
        addLog(`❌ 橋接失敗：${data.error}`, 'error');
        setIsSyncing(false);
        return;
      }

      addLog(`✅ 解析完成，共 ${data.analysis?.recordCount} 筆資料`, 'success');
      addLog(`🔑 UUID 刻印：${data.uuid?.slice(0, 18)}...`, 'info');
      addLog(`🔒 Hash Lock 封印完成`, 'success', data.hashLock);
      addLog(`📊 ESG 指標計算完畢 → ${data.analysis?.scopeAffected}`, 'success');
      addLog(`✨ 5T 橋接任務圓滿完成！`, 'success');

      setResult(data);
      fetchHistory();
    } catch (err) {
      addLog(`❌ 網路錯誤：${(err as Error).message}`, 'error');
    }

    setIsSyncing(false);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text
          bg-gradient-to-r from-cyan-600 to-emerald-500 dark:from-cyan-400 dark:to-emerald-400
          flex items-center gap-3">
          <Database className="w-9 h-9 text-cyan-500 shrink-0" />
          企業資料橋接 (Data Bridge)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          智能橋接人資系統 / ERP 資料，自動映射欄位、計算 ESG 指標，並執行
          <span className="text-cyan-600 dark:text-cyan-400 font-semibold"> 5T 協議不可篡改刻印</span>。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Config + Upload ── */}
        <div className="lg:col-span-2 space-y-6">

          <OmniCard variant="glass" glow>
            <OmniCardHeader>
              <OmniCardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
                批次檔案匯入
              </OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent className="space-y-5">

              {/* Data type selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  資料集類型（自動映射欄位）
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DATA_TYPES.map(dt => (
                    <button
                      key={dt.value}
                      onClick={() => setDataType(dt.value)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200
                        ${dataType === dt.value
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-cyan-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{dt.label.split('：')[0]}</span>
                        <OmniBadge variant={dataType === dt.value ? 'cyan' : 'default'} className="text-[10px]">
                          {dt.scope}
                        </OmniBadge>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{dt.label.split('：')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drop zone */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center
                  justify-center text-center transition-all duration-300 cursor-pointer
                  ${isDragging ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 scale-[1.01]' : ''}
                  ${file  ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10' : ''}
                  ${!isDragging && !file ? 'border-slate-300 dark:border-slate-700 hover:border-cyan-400' : ''}
                `}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileSelection(e.target.files[0])}
                />
                {file ? (
                  <>
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">{file.name}</p>
                    <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70 mt-1">
                      {(file.size / 1024).toFixed(1)} KB · 點擊或拖曳以更換
                    </p>
                  </>
                ) : (
                  <>
                    <UploadCloud className={`w-12 h-12 mb-3 transition-colors ${isDragging ? 'text-cyan-500' : 'text-slate-400'}`} />
                    <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                      拖曳 CSV 或 Excel 至此
                    </p>
                    <p className="text-sm text-slate-400 mt-1">支援 .csv · .xlsx · .xls</p>
                  </>
                )}
              </div>

              <div className="flex justify-end">
                <OmniButton
                  variant="cyber"
                  onClick={startSync}
                  isLoading={isSyncing}
                  disabled={!file || isSyncing}
                >
                  執行橋接與 5T 刻印
                </OmniButton>
              </div>
            </OmniCardContent>
          </OmniCard>

          {/* ── ESG Analysis Results Panel ── */}
          {result?.success && result.analysis && (
            <OmniCard variant="glass" glow>
              <OmniCardHeader>
                <OmniCardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  ESG 分析結果 · <span className="text-emerald-600 dark:text-emerald-400">{result.analysis.type}</span>
                </OmniCardTitle>
              </OmniCardHeader>
              <OmniCardContent className="space-y-6">

                {/* 5T Stamp */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm font-mono">
                  <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">UUID (Traceable)</div>
                    <div className="text-cyan-600 dark:text-cyan-400 truncate">{result.uuid?.slice(0, 18)}…</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Hash Lock (Trustworthy)</div>
                    <div className="text-emerald-600 dark:text-emerald-400">{result.hashLock}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Scope Affected</div>
                    <div className="text-indigo-600 dark:text-indigo-400">{result.analysis.scopeAffected}</div>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(result.analysis.metrics).map(([k, v]) => (
                    <div key={k} className="p-4 rounded-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{k}</div>
                      <div className="text-xl font-black text-slate-800 dark:text-slate-100 leading-tight">{v}</div>
                    </div>
                  ))}
                </div>

                {/* Preview table */}
                {result.preview && result.preview.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <TableProperties className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        欄位映射預覽（前 5 列）
                      </span>
                      <OmniBadge variant="default" className="text-[10px]">{result.detectedColumns?.length} 欄</OmniBadge>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="text-xs w-full">
                        <thead className="bg-slate-100 dark:bg-slate-900">
                          <tr>
                            {result.detectedColumns?.map(col => (
                              <th key={col} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {result.preview.map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                              {result.detectedColumns?.map(col => (
                                <td key={col} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-[150px] truncate">
                                  {row[col] || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </OmniCardContent>
            </OmniCard>
          )}

          {/* ── Historical 5T Sealed Vault Panel ── */}
          <OmniCard variant="glass">
            <OmniCardHeader>
              <OmniCardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-500" />
                  歷史 5T 封印庫 (Sealed Vault)
                </div>
                <OmniBadge variant="cyan">{history.length} 筆批次記錄</OmniBadge>
              </OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent>
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  尚無歷史上傳封印紀錄
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="text-xs w-full">
                    <thead className="bg-slate-100 dark:bg-slate-900">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">來源檔案</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">資料類型</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">筆數</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">5T Hash Lock</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">封印時間</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {history.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{item.sourceSystem}</td>
                          <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{item.dataType}</td>
                          <td className="px-3 py-2 font-mono text-cyan-600 dark:text-cyan-400">{item.recordCount} 筆</td>
                          <td className="px-3 py-2 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 max-w-[140px] truncate" title={item.hashLock}>
                            {item.hashLock}
                          </td>
                          <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString('zh-TW', { hour12: false })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </OmniCardContent>
          </OmniCard>

          {/* ── API Integration Panel ── */}
          <OmniCard variant="default">
            <OmniCardHeader>
              <OmniCardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-indigo-500" />
                企業 API 直連 (RESTful / GraphQL)
              </OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: '鼎新 Workflow', status: '規劃中', color: 'amber' },
                  { name: 'SAP S/4HANA',   status: '規劃中', color: 'amber' },
                  { name: 'Workday HCM',   status: '規劃中', color: 'amber' },
                ].map(api => (
                  <div key={api.name} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Key className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{api.name}</span>
                    </div>
                    <OmniBadge variant="amber">{api.status}</OmniBadge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-4 text-center">
                自動排程拉取 → 5T 淨化 → 寫入 ESG 儀表板（即將開放）
              </p>
            </OmniCardContent>
          </OmniCard>
        </div>

        {/* ── Right: 5T Terminal ── */}
        <div className="lg:col-span-1">
          <OmniCard variant="cyber" glow className="sticky top-6 flex flex-col" style={{ minHeight: '520px' }}>
            <OmniCardHeader>
              <OmniCardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                橋接軌跡終端
              </OmniCardTitle>
            </OmniCardHeader>
            <OmniCardContent className="flex-1 flex flex-col">
              <div className="flex-1 bg-[#020617] rounded-xl p-4 font-mono text-xs overflow-y-auto border border-slate-800 shadow-inner"
                style={{ maxHeight: '560px' }}>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-slate-500">5T Protocol Guard v2</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>

                {logs.length === 0 ? (
                  <div className="text-slate-700 italic h-full flex items-center justify-center text-center">
                    <div>
                      <div className="text-2xl mb-2">⬡</div>
                      等待橋接指令...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map(log => (
                      <div key={log.id}>
                        <div className="flex gap-2">
                          <span className="text-slate-600 shrink-0">{log.timestamp}</span>
                          <span className={
                            log.status === 'success' ? 'text-emerald-400 font-bold' :
                            log.status === 'error'   ? 'text-rose-400 font-bold' :
                            'text-cyan-400'
                          }>
                            {log.message}
                          </span>
                        </div>
                        {log.hash && (
                          <div className="mt-1 ml-20 text-[10px] text-slate-500 break-all bg-slate-900/60 p-1.5 rounded border border-slate-800">
                            {log.hash}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </OmniCardContent>
          </OmniCard>
        </div>
      </div>
    </div>
  );
}
