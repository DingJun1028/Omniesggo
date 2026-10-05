'use client';

import React from 'react';
import { X, ShieldCheck, ArrowRight, BookOpen, ExternalLink, CheckCircle2 } from 'lucide-react';
import { OmniButton } from '../omni-base/OmniButton';
import { OmniBadge } from '../omni-base/OmniBadge';

export interface FacilitySpecInfo {
  code: string;
  name: string;
  enName: string;
  path: string;
  standard: string;
  summary: string;
  fiveTSeals: {
    truth: string;
    goodness: string;
    beauty: string;
    trust: string;
    transferful: string;
  };
  matrixSteps: Array<{
    phase: string;
    step: string;
    originCause: string;
    processTrace: string;
    finalEffect: string;
  }>;
}

interface FacilitiesSpecModalProps {
  facility: FacilitySpecInfo | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function FacilitiesSpecModal({ facility, onClose, onNavigate }: FacilitiesSpecModalProps) {
  if (!facility) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                {facility.code}
              </span>
              <OmniBadge variant="emerald">{facility.standard}</OmniBadge>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {facility.name}
            </h2>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
              {facility.enName} · 終始矩陣功能說明書
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vision & Summary */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            設施願景與功能摘要
          </span>
          <p className="text-sm text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
            {facility.summary}
          </p>
        </div>

        {/* End-Beginning Matrix (起承轉合終) */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
            5T 終始矩陣閉環 (End-Beginning Matrix)
          </h3>
          <div className="space-y-3">
            {facility.matrixSteps.map((m, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 sm:w-28 shrink-0">
                  <span className="w-6 h-6 rounded-lg bg-teal-600 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold flex items-center justify-center text-xs">
                    {m.phase}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">{m.step}</span>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">因 / 觸發:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{m.originCause}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">果 / 顯化:</span>
                    <span className="font-medium text-teal-700 dark:text-cyan-400">{m.finalEffect}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5T Checklist Seals */}
        <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-cyan-950/20 border border-teal-200/80 dark:border-cyan-500/30">
          <span className="text-xs font-bold text-teal-900 dark:text-cyan-300 block mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
            5T 協議神聖治理檢驗標準
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-teal-100 dark:border-cyan-900">
              <span className="font-bold text-teal-800 dark:text-cyan-400 block">真 (Truth)</span>
              <span className="text-slate-600 dark:text-slate-400">{facility.fiveTSeals.truth}</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-teal-100 dark:border-cyan-900">
              <span className="font-bold text-emerald-800 dark:text-emerald-400 block">善 (Goodness)</span>
              <span className="text-slate-600 dark:text-slate-400">{facility.fiveTSeals.goodness}</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-teal-100 dark:border-cyan-900">
              <span className="font-bold text-teal-800 dark:text-teal-400 block">美 (Beauty)</span>
              <span className="text-slate-600 dark:text-slate-400">{facility.fiveTSeals.beauty}</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-teal-100 dark:border-cyan-900">
              <span className="font-bold text-amber-800 dark:text-amber-400 block">信 (Trust)</span>
              <span className="text-slate-600 dark:text-slate-400">{facility.fiveTSeals.trust}</span>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-teal-100 dark:border-cyan-900">
              <span className="font-bold text-cyan-800 dark:text-cyan-300 block">傳 (Track)</span>
              <span className="text-slate-600 dark:text-slate-400">{facility.fiveTSeals.transferful}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
          <OmniButton variant="outline" onClick={onClose}>
            關閉視窗
          </OmniButton>
          <OmniButton 
            variant="primary" 
            onClick={() => {
              onClose();
              onNavigate(facility.path);
            }}
          >
            立即啟動此設施
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </OmniButton>
        </div>
      </div>
    </div>
  );
}
