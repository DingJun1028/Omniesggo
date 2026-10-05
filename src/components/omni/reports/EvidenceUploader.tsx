'use client';

import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, FileCheck, ShieldAlert, Loader2, Link } from 'lucide-react';

/** 證據庫佐證元件 (mod-src-vault-0001) — Liquid Glass 拖曳上傳 */
export default function EvidenceUploader({
  onUploadComplete,
}: {
  onUploadComplete: (url: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setStatus('uploading');
      try {
        // 真實上傳至 Evidence Vault (MinIO S3 相容, 免費算立自託)
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/evidence-upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'upload failed');
        }
        setEvidenceUrl(data.url);
        setStatus('success');
        onUploadComplete(data.url);
      } catch {
        setStatus('error');
      }
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        await processFile(file);
      }
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await processFile(file);
      }
    },
    [processFile]
  );

  const handleClick = useCallback(() => {
    if (status !== 'uploading' && status !== 'success') {
      fileInputRef.current?.click();
    }
  }, [status]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && status !== 'uploading' && status !== 'success') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  }, [status]);

  return (
    <div className="w-full">
      <label className="text-sm font-bold text-slate-700 dark:text-cyan-50 mb-2 block">
        佐證憑證 (Evidence Vault) <span className="text-amber-500 dark:text-amber-400">*</span>
      </label>
      <div
        role="button"
        tabIndex={0}
        aria-label="點擊或拖曳上傳佐證憑證"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 dark:focus-visible:ring-cyan-500 relative border-2 border-dashed rounded-2xl p-8 transition-all duration-500 flex flex-col items-center justify-center backdrop-blur-xl bg-slate-50 dark:bg-black/20 ${
          isDragging
            ? 'border-teal-400 dark:border-cyan-400 bg-teal-50 dark:bg-cyan-500/10 scale-[1.02] shadow-sm dark:shadow-neon-cyan'
            : 'border-slate-300 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/30 hover:bg-slate-100 dark:hover:bg-white/5'
        } ${status === 'error' ? 'border-amber-400 dark:border-amber-500/50 dark:shadow-neon-amber' : ''} ${
          status === 'success' ? 'border-emerald-400 dark:border-emerald-500/50 dark:shadow-neon-emerald' : ''
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png"
          tabIndex={-1}
        />
        {status === 'idle' && (
          <>
            <UploadCloud size={48} className="text-teal-500/50 dark:text-cyan-500/50 mb-4 animate-pulse" />
            <p className="text-sm font-bold text-slate-600 dark:text-gray-300">點擊或拖曳發票、水電單或 ISO 證書至此</p>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-1 font-mono">
              支援 PDF, JPG, PNG (上限 10MB)
            </p>
          </>
        )}
        {status === 'uploading' && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <Loader2 size={48} className="text-teal-500 dark:text-cyan-400 animate-spin mb-4" />
            <p className="text-sm font-bold text-teal-700 dark:text-cyan-200">執行 Hash Lock 與 S3 封裝中...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <FileCheck size={48} className="text-emerald-500 dark:text-emerald-400 mb-4 dark:drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
            <p className="text-sm text-emerald-700 dark:text-emerald-200 font-bold">憑證已安全刻印</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400 bg-slate-200/50 dark:bg-black/40 px-3 py-1 rounded-full border border-slate-300 dark:border-white/5">
              <Link size={12} /> <span className="truncate max-w-[200px]">{evidenceUrl}</span>
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center animate-fade-in-up">
            <ShieldAlert size={48} className="text-amber-500 dark:text-amber-400 mb-4" />
            <p className="text-sm font-bold text-amber-700 dark:text-amber-200">憑證上傳失敗，請檢查檔案格式</p>
          </div>
        )}
      </div>
    </div>
  );
}
