'use client';

import React, { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { validateESGData } from '@/lib/omni-reports/jules-validator';
import { ncbClient } from '@/lib/omni-reports/ncb-client';
import EvidenceUploader from './EvidenceUploader';
import type { DynamicFormSchema } from '@/lib/omni-reports/types';

interface FeedbackState {
  status: 'idle' | 'success' | 'error';
  message: string;
  errors?: Record<string, { _errors: string[] }>;
  data?: unknown;
}

/**
 * 純函式：將果因引擎驗算結果對映為 UI 反饋狀態。
 * 抽離出來以便單元測試重現零幻覺警告邏輯（不依賴瀏覽器熱重載）。
 */
export function computeFeedback(
  payload: Record<string, unknown>
): FeedbackState {
  const result = validateESGData(payload);
  if (result.success) {
    return { status: 'success', message: result.message, data: result.data };
  }
  return {
    status: 'error',
    message: result.message,
    errors: result.errors as FeedbackState['errors'],
  };
}

export default function DynamicFormEngine({
  schema,
  initialData,
}: {
  schema: DynamicFormSchema;
  initialData?: Partial<Record<string, unknown>>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({
    status: 'idle',
    message: '',
  });

  const [formData, setFormData] = useState<Record<string, unknown>>(() => ({
    uuid: schema.uuid,
    version: schema.version,
    source_origin: 'dynamic-form-engine-ui',
    evidence: [],
    // 依 Schema 預填 literal / 預設值，避免 z.literal 因未填而先報錯
    ...schema.fields.reduce((acc, f) => {
      if (f.default !== undefined) acc[f.id] = f.default;
      return acc;
    }, {} as Record<string, unknown>),
    ...initialData,
  }));

  const handleEvidenceUpload = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      evidence: [...((prev.evidence as string[]) ?? []), url],
    }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setFeedback({ status: 'idle', message: '' });

    const payload = { ...formData, timestamp: Date.now() };
    try {
      const fb = computeFeedback(payload);
      setFeedback(fb);
      // 零幻覺驗算通過 → 寫入 NCBDB (Hash Lock 封印；無 NCB_API_KEY 時本地 fallback)
      if (fb.status === 'success' && fb.data) {
        try {
          await ncbClient.insertDocument('reports', fb.data as Record<string, unknown>);
        } catch (ncbErr) {
          // NCB 寫入失敗不阻斷 UI，但記錄於訊息
          setFeedback({
            status: 'success',
            message: (fb.message ?? '果因引擎驗算通過') + '（NCB 同步失敗：' + (ncbErr instanceof Error ? ncbErr.message : String(ncbErr)) + '）',
          });
        }
      }
    } catch (err) {
      setFeedback({
        status: 'error',
        message: '【果因引擎例外】' + (err instanceof Error ? err.message : String(err)),
      });
    }
    setIsSubmitting(false);
  };

  const fieldError = (id: string) => feedback.errors?.[id]?._errors[0];

  return (
    <div className="liquid-glass-container p-8 max-w-3xl mx-auto">
      <div className="mb-8 border-b border-white/10 pb-4">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">
          {schema.title}
        </h2>
        <p className="text-cyan-500/80 text-sm mt-1 font-mono tracking-widest">
          {schema.uuid}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {schema.fields.map((field) => {
            const err = fieldError(field.id);
            return (
              <div key={field.id} className="space-y-2">
                <label className="text-sm font-medium text-cyan-50 flex items-center justify-between">
                  <span>
                    {field.label}{' '}
                    {field.required && <span className="text-amber-400">*</span>}
                  </span>
                  {field.unit && (
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                      {field.unit}
                    </span>
                  )}
                </label>

                {field.type === 'number' ? (
                  <input
                    type="number"
                    required={field.required}
                    placeholder={field.placeholder}
                    className={`w-full bg-black/40 border rounded-xl p-3 text-white outline-none transition-all font-mono ${
                      err
                        ? 'border-amber-500/50 focus:ring-1 focus:ring-amber-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                    }`}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.id]: Number(e.target.value) })
                    }
                  />
                ) : (
                  <input
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder}
                    className={`w-full bg-black/40 border rounded-xl p-3 text-white outline-none transition-all ${
                      err
                        ? 'border-amber-500/50 focus:ring-1 focus:ring-amber-500'
                        : 'border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                    }`}
                    onChange={(e) =>
                      setFormData({ ...formData, [field.id]: e.target.value })
                    }
                  />
                )}

                {err && (
                  <p className="text-amber-400 text-xs mt-1 animate-pulse flex items-center gap-1">
                    <AlertTriangle size={12} /> {err}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <EvidenceUploader onUploadComplete={handleEvidenceUpload} />

        {feedback.status === 'error' && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 animate-fade-in-up">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold">{feedback.message}</p>
              {feedback.errors?.evidence && (
                <p className="text-xs mt-1 opacity-80">
                  {feedback.errors.evidence._errors.join('，')}
                </p>
              )}
            </div>
          </div>
        )}

        {feedback.status === 'success' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 flex items-center gap-3 animate-fade-in-up">
            <CheckCircle className="shrink-0" size={18} />
            <p className="text-sm font-bold">{feedback.message}</p>
          </div>
        )}

        <div className="pt-6 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-neon-cyan hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
          >
            {isSubmitting ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Zap size={18} />
            )}
            {isSubmitting ? '果因引擎驗算中...' : '提交永恆刻印 (Seal)'}
          </button>
        </div>
      </form>
    </div>
  );
}
