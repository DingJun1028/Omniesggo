"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mic, Search, Command, Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useTaskSystem } from "@/lib/hooks/useTaskSystem";

export function OmniSpirit() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const { tasks } = useTaskSystem();
  const inputRef = useRef<HTMLInputElement>(null);

  const pendingCount = tasks.filter(t => t.status !== 'DONE').length;
  const pulseDuration = Math.max(1, 4 - (pendingCount * 0.2)); // Faster pulse with more tasks

  useEffect(() => {
    setIsMounted(true);
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + / toggle
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isProcessing) return;

    const userQuery = query.trim();
    setQuery("");
    setResponses(prev => [...prev, { type: 'user', text: userQuery }]);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/omni-one', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery, context: { location: window.location.pathname } })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "System failed via 5T Gateway.");

      setResponses(prev => [...prev, { type: 'ai', data: data.result }]);
    } catch (error: any) {
      setResponses(prev => [...prev, { type: 'error', text: error.message }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionClick = (presetQ: string) => {
    setQuery(presetQ);
    setTimeout(() => handleSubmit(), 50);
  };

  if (!isMounted) return null;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-[100] hidden md:flex flex-col items-end"
      drag
      dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }}
      dragElastic={0.1}
      dragMomentum={false}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const newRipple = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
        setRipples(prev => [...prev, newRipple]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 1000);
      }}
    >
      {/* 5T Ripples */}
      {ripples.map(ripple => (
        <motion.div
           key={ripple.id}
           initial={{ scale: 0, opacity: 0.5 }}
           animate={{ scale: 4, opacity: 0 }}
           transition={{ duration: 0.8 }}
           className="absolute w-16 h-16 rounded-full border-2 border-primary/40 pointer-events-none z-0"
           style={{ left: ripple.x - 32, top: ripple.y - 32 }}
        />
      ))}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-4 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl w-80 font-sans overflow-hidden flex flex-col max-h-[500px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#009E9D] to-[#219EBC] p-3 text-white">
              <div className="text-xs font-bold uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Omni-One Awakening</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-black/20 rounded">v1.0.0</span>
              </div>
            </div>

            {/* Conversation Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px] min-h-[150px]">
              {responses.length === 0 ? (
                <div className="space-y-2 text-sm">
                  <p className="text-slate-500 font-medium mb-3">歡迎喚醒 OmniOne 核心引擎。您可以嘗試以下指令：</p>
                  <button onClick={() => handleActionClick("分析目前頁面數據並生成總結")} className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 hover:bg-[#009E9D]/10 hover:border-[#009E9D]/30 rounded-lg text-slate-700 hover:text-[#009E9D] transition-all text-left focus-visible:ring-2 focus-visible:ring-[#009E9D] focus:outline-none">
                     <span className="flex items-center gap-2 text-xs"><Search className="w-3.5 h-3.5" /> 頁面數據總結</span>
                  </button>
                  <button onClick={() => handleActionClick("計算此章節可能的 5T 涵蓋率")} className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 hover:bg-[#009E9D]/10 hover:border-[#009E9D]/30 rounded-lg text-slate-700 hover:text-[#009E9D] transition-all text-left focus-visible:ring-2 focus-visible:ring-[#009E9D] focus:outline-none">
                     <span className="flex items-center gap-2 text-xs"><Command className="w-3.5 h-3.5" /> 計算 5T 涵蓋率</span>
                  </button>
                  <button onClick={() => handleActionClick("開啟自主學習模式")} className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 hover:bg-[#009E9D]/10 hover:border-[#009E9D]/30 rounded-lg text-slate-700 hover:text-[#009E9D] transition-all text-left focus-visible:ring-2 focus-visible:ring-[#009E9D] focus:outline-none">
                     <span className="flex items-center gap-2 text-xs"><Zap className="w-3.5 h-3.5 text-amber-500" /> 啟動自主模式</span>
                  </button>
                </div>
              ) : (
                responses.map((res, i) => (
                  <div key={i} className={`flex ${res.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-xl p-3 text-sm ${
                      res.type === 'user' ? 'bg-[#F1F3F5] text-slate-800' : 
                      res.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                      'bg-gradient-to-br from-[#009E9D]/10 to-[#219EBC]/5 border border-[#009E9D]/20 text-slate-800'
                    }`}>
                      {res.type === 'user' || res.type === 'error' ? (
                        <p>{res.text}</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-bold text-[#009E9D] flex items-center gap-1.5 border-b border-[#009E9D]/20 pb-1.5 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> 
                            {res.data.solution}
                          </p>
                          <div className="flex gap-2 mb-2 items-center">
                             <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                                CAT: {res.data.category}
                             </span>
                             <div className="flex gap-0.5 ml-auto">
                                {['真','善','美','信','通'].map((char, i) => (
                                  <span key={i} className="w-4 h-4 rounded-sm bg-primary/10 text-primary text-[9px] flex items-center justify-center border border-primary/20">
                                    {char}
                                  </span>
                                ))}
                             </div>
                          </div>
                          {res.data.plan && (
                            <ul className="text-xs text-slate-600 space-y-1 list-disc pl-4">
                              {res.data.plan.map((p: string, idx: number) => <li key={idx}>{p}</li>)}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-[#009E9D]/5 border border-[#009E9D]/20 rounded-xl p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#009E9D] animate-spin" />
                    <span className="text-xs text-[#009E9D] font-mono">OmniOne is routing task...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 bg-white flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="輸入指令 (Enter 送出)..."
                className="flex-1 text-sm outline-none px-2 text-slate-700 bg-transparent placeholder-slate-400"
                disabled={isProcessing}
              />
              <button 
                type="button" 
                className="p-2 text-slate-400 hover:text-[#009E9D] hover:bg-[#009E9D]/10 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#009E9D]"
                title="語音輸入"
                aria-label="語音輸入"
              >
                 <Mic className="w-4 h-4" aria-hidden="true" />
              </button>
              <button 
                type="submit" 
                disabled={!query.trim() || isProcessing}
                className="p-2 bg-[#009E9D] text-white rounded-lg hover:bg-[#00C2A8] transition-colors disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#009E9D]"
                title="送出指令"
                aria-label="送出指令"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        className="relative w-16 h-16 group cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        title="萬能光球精靈 (Ctrl + /)"
      >
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.6, 0.9, 0.6]
          }}
          transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-br from-[#009E9D] to-[#219EBC] rounded-full blur-md z-0" 
        />
        <div className="absolute inset-[2px] bg-gradient-to-br from-white to-[#E0F7FA] rounded-full shadow-[0_0_15px_rgba(0,158,157,0.5)] flex items-center justify-center overflow-hidden border-2 border-white/80 z-10">
          <Image
            src="https://thumbs4.imagebam.com/e5/b8/6c/ME1B44KB_t.png"
            alt="Omni Spirit Logo"
            fill
            sizes="64px"
            className="object-cover object-center opacity-90 mix-blend-multiply transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute -top-1 -right-1 z-20 bg-[#FFB703] text-white text-[9px] font-bold px-1.5 rounded-full border border-white shadow-sm flex items-center justify-center tracking-tighter">
          Omni
        </div>
      </div>
    </motion.div>
  );
}
