/**
 * src/components/zkp-verify.tsx — ZKP 驗證 UI 組件
 */

'use client';

import { useState } from 'react';
import { Shield, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';

interface ZKPVerifyProps {
  documentId?: string;
  onVerified?: (result: { valid: boolean; hashLock: string }) => void;
}

export function ZKPVerify({ documentId: initialDocId, onVerified }: ZKPVerifyProps) {
  const [documentId, setDocumentId] = useState(initialDocId || '');
  const [hashLock, setHashLock] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; hashLock: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeal = async () => {
    if (!documentId) {
      setError('請輸入文件 ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/zkp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seal', documentId }),
      });

      const data = await res.json();
      if (data.success) {
        setResult({ valid: true, hashLock: data.data.hashLock });
        setHashLock(data.data.hashLock);
        onVerified?.({ valid: true, hashLock: data.data.hashLock });
      } else {
        setError(data.error || '封印失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '網路錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!documentId || !hashLock) {
      setError('請輸入文件 ID 和 Hash Lock');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/zkp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', documentId, hashLock }),
      });

      const data = await res.json();
      setResult(data.data);
      onVerified?.(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '網路錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-borderColor rounded-xl p-6 bg-secondary">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="text-accentPurple" size={24} />
        <h3 className="font-bold text-lg">ZKP 零知識證明驗證</h3>
      </div>

      <div className="space-y-4">
        {/* Document ID Input */}
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1">
            文件 ID
          </label>
          <input
            type="text"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="輸入文件 UUID"
            className="w-full px-3 py-2 border border-borderColor rounded-lg bg-primary text-textPrimary focus:outline-none focus:ring-2 focus:ring-accentPurple"
          />
        </div>

        {/* Hash Lock Input */}
        <div>
          <label className="block text-sm font-medium text-textSecondary mb-1">
            Hash Lock
          </label>
          <input
            type="text"
            value={hashLock}
            onChange={(e) => setHashLock(e.target.value)}
            placeholder="封印後自動填入，或手動輸入驗證"
            className="w-full px-3 py-2 border border-borderColor rounded-lg bg-primary text-textPrimary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accentPurple"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSeal}
            disabled={loading || !documentId}
            className="flex-1 py-2 bg-accentPurple text-white rounded-lg font-bold hover:bg-accentPurple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Shield size={16} />
            )}
            封印文件
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || !documentId || !hashLock}
            className="flex-1 py-2 bg-bgBase border border-accentPurple text-accentPurple rounded-lg font-bold hover:bg-accentPurple/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <ShieldCheck size={16} />
            )}
            驗證證明
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
            <ShieldX size={16} />
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`border rounded-lg p-4 ${result.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.valid ? (
                <ShieldCheck className="text-green-600" size={20} />
              ) : (
                <ShieldX className="text-red-600" size={20} />
              )}
              <span className={`font-bold ${result.valid ? 'text-green-800' : 'text-red-800'}`}>
                {result.valid ? '驗證通過' : '驗證失敗'}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-textSecondary">文件 ID: </span>
                <span className="font-mono">{documentId}</span>
              </div>
              <div>
                <span className="text-textSecondary">Hash Lock: </span>
                <span className="font-mono text-xs break-all">{result.hashLock}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
