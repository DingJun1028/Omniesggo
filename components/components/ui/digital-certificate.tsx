"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Award, Calendar, Hash, CheckCircle2, Star } from "lucide-react";
import { VerificationCertificate } from "@/lib/schemas/navigation-schema";
import { WithOmniHeart } from "@/lib/core/omni-linter";

interface FiveTCertificateProps {
  data: WithOmniHeart<VerificationCertificate>;
  onClose?: () => void;
}

export const FiveTCertificate = ({ data, onClose }: FiveTCertificateProps) => {
  const heart = data._omniHeart;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateX: 15, y: 40 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, rotateX: -15, y: 40 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="relative w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 perspective-1000 max-h-[90vh] flex flex-col"
    >
      {/* Holographic Shimmer Overlay */}
      <motion.div 
        animate={{ 
          backgroundPosition: ["0% 0%", "200% 200%"],
          opacity: [0.03, 0.08, 0.03]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 pointer-events-none z-10 bg-[length:200%_200%] bg-gradient-to-br from-transparent via-primary/30 to-transparent mix-blend-overlay"
      />
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#009E9D] via-[#219EBC] to-[#009E9D]" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#009E9D]/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#219EBC]/5 rounded-full blur-3xl" />

      <div className="p-8 sm:p-12 overflow-y-auto flex-1">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-[#009E9D] to-[#219EBC] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#009E9D]/20">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
            5T 數位確信證書
          </h2>
          <p className="text-slate-500 font-medium">Digital Assurance Certificate of 5T Protocol</p>
        </div>

        {/* Certificate Body */}
        <div className="space-y-8">
          <div className="border-y border-slate-100 py-8 text-center space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400 font-bold">
              Subject of Verification
            </p>
            <h3 className="text-2xl font-bold text-[#009E9D]">
              {data.subject}
            </h3>
            <p className="max-w-md mx-auto text-slate-600 leading-relaxed text-sm italic">
               &quot;本章節內容已通過 ADK 永續報告導覽小隊之專家級核定，確信符合 5T 數據治理架構與國際 ESG 揭露準則。&quot;
            </p>
          </div>

          {/* 5T Scores Grid */}
          {/* 5T Protocol Status */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-between w-full max-w-sm bg-slate-50 px-6 py-3 rounded-full border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider">5T PROTOCOL (Governance)</span>
                <div className="flex items-center gap-2">
                  {['Truthful', 'Thankful', 'Tasteful', 'Trustful', 'Transferful'].map(p => (
                    <div key={p} className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100" title={`${p} Verified`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
  
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-5 mb-1 text-center text-xs font-bold text-slate-400 tracking-widest uppercase">
                5T Principles (Core Philosophy)
              </div>
            {[
              { label: "Truthful", key: "truthful", char: "真", color: "text-emerald-500", desc: "Traceable (鏈式溯源)" },
              { label: "Thankful", key: "thankful", char: "善", color: "text-amber-500", desc: "Transparent (算法透明)" },
              { label: "Tasteful", key: "tasteful", char: "美", color: "text-blue-500", desc: "Tangible (物理感知)" },
              { label: "Trustful", key: "trustful", char: "信", color: "text-cyan-500", desc: "Trustworthy (Hash Lock)" },
              { label: "Transferful", key: "transferful", char: "transferful", char_overide: "通", color: "text-indigo-500", desc: "Trackable (轉移路徑)" },
            ].map((item) => (
              <div key={item.key} className="flex flex-col items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className={`text-xl font-bold ${item.color} mb-1`}>{item.char_overide || item.char}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">{item.label}</span>
                <span className="text-[9px] text-slate-300 mb-2 truncate max-w-full" title={item.desc}>{item.desc}</span>
                <div className="text-sm font-bold text-slate-700">
                  {data.score_5t[item.key as keyof typeof data.score_5t]}%
                </div>
              </div>
            ))}
          </div>

          {/* Footer Metadata */}
          <div className="grid grid-cols-2 gap-6 pt-6 text-[11px] font-mono text-slate-400">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Issued At: {new Date(data.issued_at).toLocaleString()}</span>
              </div>
               <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" />
                <span className="truncate">Digital Signature: {data.digital_signature.substring(0, 16)}...</span>
              </div>
              {heart && (
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Star className="w-3.5 h-3.5" />
                  <span className="truncate tracking-tighter uppercase">Vault_Seal (Physical): {heart.trustful.substring(0, 12)}...</span>
                </div>
              )}
            </div>
            <div className="space-y-1.5 text-right">
              <div className="flex items-center justify-end gap-2 text-[#009E9D] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verification ID: {data.certificate_id}</span>
              </div>
               <div className="flex items-center justify-end gap-2 text-emerald-600 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Status: {data.status.toUpperCase()}</span>
              </div>
              {heart && (
                <div className="flex items-center justify-end gap-2 text-text-muted/60">
                  <span className="text-[9px] uppercase tracking-widest italic">Origin: {heart.truthful}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Closing Button */}
        {onClose && (
          <div className="mt-10 text-center">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              確認並完成全景刻印
            </button>
          </div>
        )}
      </div>

      {/* Security Seal */}
      <div className="absolute bottom-6 right-6 opacity-10">
        <Award className="w-24 h-24" />
      </div>
    </motion.div>
  );
};
