"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Award, CheckCircle2, FileText, Download, ExternalLink, Hash } from "lucide-react";

export const FullReportAuditPreview = ({ onClose }: { onClose: () => void }) => {
  const verifiedChapters = [
    { id: "1.01", title: "經營者的話", score: 98, hash: "8dcf...2a1b", status: "Certified" },
    { id: "2.01", title: "永續發展策略", score: 95, hash: "3e12...f903", status: "Certified" },
    { id: "4.01", title: "溫室氣體排放", score: 100, hash: "77ab...cc21", status: "Certified" },
    { id: "4.02", title: "能源消耗管理", score: 92, hash: "bb92...110a", status: "Certified" },
    { id: "5.03", title: "職業安全衛生", score: 97, hash: "ff01...8842", status: "Certified" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full max-w-4xl mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800"
    >
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Award className="w-48 h-48 text-white" />
      </div>

      <div className="p-8 sm:p-12 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30">
                5T PROTOCOL COMPLIANT
              </div>
              <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-bold border border-indigo-500/30">
                NCBDB HASH-LOCKED
              </div>
            </div>
            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
              海流永續科技 2024 永續報告
            </h2>
            <p className="text-slate-400 font-medium">全景路徑試作 - ADK 導覽小隊核定成果彙整</p>
          </div>
          <button onClick={onClose} aria-label="Close report" className="p-2 hover:bg-white/10 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus:outline-none">
            <ShieldCheck className="w-8 h-8 text-slate-500" />
          </button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { label: "平均 5T 評分", value: "96.4%", color: "text-emerald-400" },
            { label: "已刻印章節", value: "18 / 24", color: "text-indigo-400" },
            { label: "第三方核實率", value: "100%", color: "text-amber-400" },
            { label: "區塊鏈存證數", value: "142", color: "text-cyan-400" }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl">
              <p className="text-xs text-slate-500 font-bold mb-1 uppercase">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Chapters Table */}
        <div className="bg-black/20 rounded-2xl border border-white/5 mb-8">
          <div className="p-4 border-b border-white/5 flex text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div className="w-16">ID</div>
            <div className="flex-1">章節名稱</div>
            <div className="w-24 text-center">5T 評分</div>
            <div className="w-32 text-center">核心雜湊 (Hash)</div>
            <div className="w-24 text-right">狀態</div>
          </div>
          <div className="divide-y divide-white/5">
            {verifiedChapters.map((ch, i) => (
              <div key={i} className="p-4 flex items-center text-sm">
                <div className="w-16 font-mono text-slate-500">{ch.id}</div>
                <div className="flex-1 font-bold text-slate-200">{ch.title}</div>
                <div className="w-24 text-center">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-mono font-bold">
                    {ch.score}
                  </span>
                </div>
                <div className="w-32 text-center text-xs font-mono text-slate-500">
                  {ch.hash}
                </div>
                <div className="w-24 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-emerald-500 font-bold text-xs uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {ch.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button className="flex-1 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-slate-400 focus:outline-none">
            <Download className="w-5 h-5" />
            下載 5T 確信報告全本 (PDF)
          </button>
          <button className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-400 focus:outline-none">
            <ExternalLink className="w-5 h-5" />
            發布至企業 ESG 官網
          </button>
        </div>
      </div>
    </motion.div>
  );
};
