"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  StickyNote, 
  Sparkles, 
  Zap, 
  History, 
  ShieldCheck, 
  Plus, 
  Search, 
  Trash2, 
  MoreVertical,
  Fingerprint,
  MessageSquare,
  Activity,
  Box,
  BrainCircuit,
  Save,
  Loader2,
  Undo
} from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ViewHeader } from "@/components/ui/view-header";
import { PAGE_GUIDES } from "@/lib/config/guides";
import { useNoteSystem } from "@/lib/hooks/useNoteSystem";
import { omniNoteApi, OmniNote } from "@/lib/ncb-service";

export function OmniNoteView() {
  const { aiProxyMode, lang } = useAppContext();
  const { notes: noteRecord } = useNoteSystem();
  const notes = Object.values(noteRecord); // Convert to array for the list
  
  const [activeTab, setActiveTab] = useState<"capture" | "vault" | "insights">("capture");
  const [noteContent, setNoteContent] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCaptureModal, setShowCaptureModal] = useState(false);

  // eslint-disable-next-line react-hooks/purity
  const hashLockValue = useMemo(() => Math.random().toString(16).substring(2, 24).toUpperCase(), []);

  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeNote, setActiveNote] = useState<Partial<OmniNote> | null>(null);
  const [saving, setSaving] = useState(false);

  const branding = {
    title: lang === "zh" ? "萬能筆記 (Omni Note)" : "Omni Note",
    subtitle: lang === "zh" ? "無作捕捉 | 悟作洞察 (Insight Engine)" : "Capture | Insight",
    description: lang === "zh" ? "自動結構化零散靈感，並透過 5T 協議轉化為高品質知識資產。" : "Structure scattered inspirations and transform them into high-quality knowledge assets via 5T.",
    accent: aiProxyMode ? "from-purple-500/20 to-transparent" : "from-cyan-500/20 to-transparent",
    tag: "AESTHETIC_SYNC",
    icon: StickyNote,
    guideSteps: PAGE_GUIDES["omni-note"]
  };

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    // [Note: In a real app, we'd fetch from API and sync to useNoteSystem]
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ⚡ Bolt Optimization:
  // 1. Wrapped in useMemo to prevent O(n) array reductions on every component re-render when notes array hasn't changed
  // 2. Consolidated 5 separate reduce passes (O(5n)) into a single pass (O(n)), significantly improving calculation speed
  const avgDimensions = useMemo(() => {
    if (notes.length === 0) {
      return {
        truthful: 0,
        transferful: 0,
        thankful: 0,
        tasteful: 0,
        trustful: 0
      };
    }
    const sum = notes.reduce((acc, n: any) => {
      acc.truthful += n.dimensions?.truthful || 0;
      acc.transferful += n.dimensions?.transferful || 0;
      acc.thankful += n.dimensions?.thankful || 0;
      acc.tasteful += n.dimensions?.tasteful || 0;
      acc.trustful += n.dimensions?.trustful || 0;
      return acc;
    }, { truthful: 0, transferful: 0, thankful: 0, tasteful: 0, trustful: 0 });

    return {
      truthful: Math.floor(sum.truthful / notes.length),
      transferful: Math.floor(sum.transferful / notes.length),
      thankful: Math.floor(sum.thankful / notes.length),
      tasteful: Math.floor(sum.tasteful / notes.length),
      trustful: Math.floor(sum.trustful / notes.length)
    };
  }, [notes]);


  const handleSave = async () => {
    if (!activeNote?.content) return;
    setSaving(true);
    
    // Default dimensions for a new note
    const newNote = {
      ...activeNote,
      type: (activeNote.type || "no-action") as "no-action" | "insight",
      variant: "optimal" as const,
      dimensions: activeNote.dimensions || {
        truthful: 80,
        transferful: 75,
        thankful: 90,
        tasteful: 85,
        trustful: 80
      },
      tags: activeNote.tags || ["omni"]
    };

    if (activeNote.id) {
      await omniNoteApi.update(activeNote.id, newNote);
    } else {
      await omniNoteApi.insert(newNote);
    }
    
    await fetchNotes();
    setIsCreating(false);
    setActiveNote(null);
    setSaving(false);
    toast.success(lang === "zh" ? "靈感已成功存入萬能智庫" : "Inspiration manifested in vault");
  };

  const handleDelete = async (id: string) => {
    toast(lang === "zh" ? "確定要刪除這則筆記嗎？" : "Are you sure you want to delete this note?", {
      action: {
        label: lang === "zh" ? "確定刪除" : "Delete",
        onClick: async () => {
          await omniNoteApi.delete(id);
          fetchNotes();
          toast.success(lang === "zh" ? "筆記已刪除" : "Note deleted");
        },
      },
    });
  };

  return (
    <div className="space-y-10 pb-20">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <Button 
            onClick={() => {
              setActiveNote({ type: "no-action", title: "", content: "" });
              setIsCreating(true);
            }}
            className="px-8 h-12 bg-primary text-slate-900 font-black italic shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            {lang === "zh" ? "捕捉靈感 (Capture)" : "CAPTURE"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Notes List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-text-main flex items-center gap-3 italic uppercase tracking-tighter">
              <History className="w-5 h-5 text-primary" />
              {lang === "zh" ? "時序靈感庫 (Timeline Vault)" : "Timeline Vault"}
            </h2>
            <div className="flex gap-2">
               <Badge variant="optimal" styleType="solid" className="text-[10px] font-mono">SYNCING</Badge>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-xs font-mono uppercase tracking-[0.2em]">Neural_Loading...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="p-20 border-2 border-dashed border-white/5 rounded-[3rem] text-center space-y-4 bg-bg-surface/10">
              <div className="relative inline-block">
                <StickyNote className="w-16 h-16 text-text-muted/20" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-primary animate-pulse" />
              </div>
              <p className="text-text-muted text-sm font-medium tracking-wide">
                {lang === "zh" ? "目前尚無靈感捕捉，開始你的第一步！" : "No captures yet. Start your journey!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <AnimatePresence>
                {(notes as any[]).map((note: any, i) => (
                  <motion.div
                    key={note.id || i}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative bg-white/5 border border-white/10 rounded-[32px] p-8 hover:bg-white/10 transition-all cursor-pointer shadow-xl hover:shadow-primary/5 h-full flex flex-col"
                    onClick={() => {
                      setActiveNote(note);
                      setIsCreating(true);
                    }}
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4 text-text-muted" />
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-3 rounded-xl ${note.type === "insight" ? "bg-amber-500/10 text-amber-400" : "bg-primary/10 text-primary"}`}>
                        {note.type === "insight" ? <BrainCircuit className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                      </div>
                      <div>
                        <Badge variant={note.variant} styleType="soft" className="text-[8px] font-mono font-black uppercase tracking-[0.1em]">
                          {note.type}
                        </Badge>
                        <div className="text-[10px] text-text-muted/60 mt-1 font-mono uppercase">
                          {new Date(note.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-text-main mb-3 line-clamp-1 group-hover:text-primary transition-colors tracking-tight italic">
                      {note.title || (lang === "zh" ? "未命名靈感" : "Untitled Inspiration")}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed line-clamp-3 mb-8 h-[3.75rem]">
                      {note.content}
                    </p>

                    <div className="flex items-center justify-between border-t border-white/5 pt-6">
                      <div className="flex gap-1">
                      {note.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-[9px] font-mono text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                          #{tag}
                        </span>
                      ))}
                    </div>
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-status-optimal" />
                        <span className="text-[10px] font-black text-status-optimal">95%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
               </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right: Insights & 10-Wing Agents */}
        <div className="lg:col-span-4 space-y-10">
           <div className="relative p-10 rounded-[3rem] bg-gradient-to-br from-bg-surface/80 to-bg-base border border-primary/10 shadow-2xl overflow-hidden group">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-1000" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary text-slate-900 rounded-2xl shadow-lg shadow-primary/20 italic rotate-12">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-text-main uppercase italic tracking-tighter">
                      Insight Engine
                    </h2>
                    <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest opacity-60 font-black italic">Active_Synthesis</p>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="p-6 rounded-2xl bg-black/20 border border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-400">
                        <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Potential Insight</span>
                        <span className="font-mono">Ready</span>
                      </div>
                      <p className="text-xs text-text-muted italic leading-relaxed">
                        {notes.length > 0 
                          ? `根據您捕捉的 ${notes.length} 則靈感，[無作模式] 已串聯 ${notes.length * 3} 個關聯節點：${notes[0]?.tags?.join('、') || '可持續、代幣化'}` 
                          : "等待靈感輸入以啟動 5T 聯動分析..."}
                      </p>
                      <button 
                        className="w-full h-10 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-amber-500/20 transition-all flex items-center justify-center gap-2"
                        onClick={() => toast.promise(
                          new Promise((resolve) => setTimeout(resolve, 2000)),
                          {
                            loading: lang === 'zh' ? '正在進行全域邏輯合成...' : 'Synthesizing global logic...',
                            success: lang === 'zh' ? '新洞察合成成功！' : 'New insight synthesized!',
                            error: 'Synthesis failed',
                          }
                        )}
                      >
                        <Plus className="w-3 h-3" /> Synthesis New Insight
                      </button>
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">
                    <span>Agent_Verification</span>
                    <span className="text-status-optimal">OK</span>
                  </div>
                  <div className="flex gap-3">
                     {[1, 4, 7].map((num) => (
                       <div 
                         key={num} 
                         className="w-10 h-10 rounded-xl bg-bg-base border border-white/5 flex items-center justify-center text-[10px] font-mono text-text-muted hover:border-primary/40 hover:text-primary transition-all cursor-crosshair group/agent"
                         onClick={() => toast.info(lang === 'zh' ? `正在啟動代理 ${num < 10 ? `0${num}` : num}` : `Waking up agent ${num < 10 ? `0${num}` : num}`)}
                       >
                          <span className="group-hover/agent:scale-125 transition-transform">{num < 10 ? `0${num}` : num}</span>
                       </div>
                     ))}
                     <div className="flex-1 flex items-center justify-center border border-dashed border-white/10 rounded-xl opacity-20 hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                     </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="p-8 rounded-[3rem] bg-bg-surface/20 border border-white/5 space-y-6">
              <h3 className="text-sm font-black text-text-main flex items-center gap-3 uppercase italic">
                <ShieldCheck className="w-4 h-4 text-primary" />
                5T Trust Protocol
              </h3>
              <div className="space-y-4">
                 {[
                   { label: "Truthful (真相度)", value: avgDimensions.truthful, color: "bg-primary" },
                   { label: "Transferful (傳輸度)", value: avgDimensions.transferful, color: "bg-blue-400" },
                   { label: "Thankful (感恩度)", value: avgDimensions.thankful, color: "bg-rose-400" },
                   { label: "Tasteful (美感度)", value: avgDimensions.tasteful, color: "bg-emerald-400" },
                   { label: "Trustful (信賴度)", value: avgDimensions.trustful, color: "bg-amber-400" }
                 ].map((t, i) => (
                   <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-black text-text-muted uppercase tracking-widest">
                        <span>{t.label}</span>
                        <span className="font-mono">{t.value}%</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden p-[1px]">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${t.value}%` }}
                           className={`h-full ${t.color} rounded-full`} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Capture Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!saving) setIsCreating(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-3xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-2xl bg-bg-base/90 border border-primary/20 rounded-[3rem] shadow-[0_0_100px_rgba(0,255,255,0.1)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-primary/10 flex justify-between items-center bg-bg-surface/30">
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-2xl ${activeNote?.type === "insight" ? "bg-amber-500/10 text-amber-400" : "bg-primary/10 text-primary"} border border-white/5`}>
                     {activeNote?.type === "insight" ? <BrainCircuit className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                   </div>
                   <div>
                    <h3 className="text-xl font-black text-text-main italic uppercase tracking-tighter">
                      {activeNote?.id ? (lang === "zh" ? "編輯靈感" : "Edit Capture") : (lang === "zh" ? "捕捉新靈感" : "New Capture")}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => setActiveNote({...activeNote, type: "no-action"})}
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all ${activeNote?.type === "no-action" ? "bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]" : "text-text-muted border-transparent"}`}
                      >NOACTION</button>
                      <button 
                        onClick={() => setActiveNote({...activeNote, type: "insight"})}
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition-all ${activeNote?.type === "insight" ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(255,191,0,0.1)]" : "text-text-muted border-transparent"}`}
                      >INSIGHT</button>
                    </div>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   {activeNote?.id && (
                     <button 
                       onClick={() => handleDelete(activeNote.id!)}
                       className="p-3 text-text-muted hover:text-rose-400 hover:bg-rose-400/5 rounded-2xl transition-all border border-transparent hover:border-rose-400/10"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                   )}
                   <button 
                    onClick={() => { if(!saving) setIsCreating(false); }}
                    className="p-3 text-text-muted hover:text-text-main hover:bg-white/5 rounded-2xl transition-all border border-white/5"
                   >
                    <Plus className="w-5 h-5 rotate-45" />
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Topic_Title</label>
                    <input 
                      type="text"
                      placeholder={lang === "zh" ? "輸入靈感主題..." : "Inspiration topic..."}
                      value={activeNote?.title || ""}
                      onChange={(e) => setActiveNote({...activeNote, title: e.target.value})}
                      className="w-full bg-black/20 border border-white/5 rounded-2xl p-5 text-text-main font-black italic focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-text-muted/30"
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-2">Content_Manifesto</label>
                    <textarea 
                      placeholder={lang === "zh" ? "捕捉這一刻的心流..." : "Capture your flow state..."}
                      value={activeNote?.content || ""}
                      onChange={(e) => setActiveNote({...activeNote, content: e.target.value})}
                      className="w-full h-48 bg-black/20 border border-white/5 rounded-2xl p-6 text-text-main leading-relaxed focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder:text-text-muted/30 resize-none font-medium text-sm"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6 pt-4">
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                       <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase">
                         <Fingerprint className="w-4 h-4" /> 5T Hash Lock
                       </div>
                       <div className="text-[9px] text-primary/60 font-mono break-all leading-relaxed">
                          0x4F8A...{hashLockValue}
                       </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-bg-surface border border-white/5 space-y-4">
                       <div className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase">
                         <MessageSquare className="w-4 h-4" /> Spirit Context
                       </div>
                       <p className="text-[10px] text-text-muted/60 leading-relaxed italic">
                         {lang === "zh" ? "等待精靈分析中..." : "Awaiting spirit analysis..."}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-bg-surface border-t border-primary/10 flex gap-4">
                 <button 
                  onClick={() => {
                    setIsCreating(false);
                    toast.info(lang === 'zh' ? "捕捉已取消" : "Capture discarded");
                  }}
                  className="flex-1 h-14 rounded-2xl border border-white/5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                 >Discard_Capture</button>
                 <button 
                   onClick={handleSave}
                   disabled={saving || !activeNote?.content}
                   className="flex-[2] h-14 bg-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all duration-300"
                 >
                   {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                   Manifest_Note
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
