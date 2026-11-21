"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Save, Sparkles, Tag, Share2, Loader2, Edit3, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNoteSystem } from '@/lib/hooks/useNoteSystem';
import { useTaskSystem } from '@/lib/hooks/useTaskSystem';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { automationService } from '@/lib/services/automationService';
import { HolyLinter } from '@/lib/core/omni-linter';

interface OmniNoteProps {
  contextId: string;      // 綁定的上下文 ID (例如 "ESG-Metric-01")
  className?: string;
  onClose?: () => void;
}

export const OmniNote: React.FC<OmniNoteProps> = ({ contextId, className, onClose }) => {
  const { getNote, saveNote } = useNoteSystem();
  const { addTask } = useTaskSystem();
  
  const existingNote = getNote(contextId);
  const [content, setContent] = useState(existingNote?.content || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ tags: string[], tasks: string[] }>({ 
    tags: existingNote?.tags || [], 
    tasks: [] 
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 🧠 AI 意圖識別 (Simulated Intent Recognition)
  const analyzeIntent = async (text: string) => {
    if (text.length < 5) return;
    
    setIsAnalyzing(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const extractedTags = text.match(/#[\w\u4e00-\u9fa5]+/g) || [];
    const extractedTasks = text.split('\n')
      .filter(line => line.trim().startsWith('- [ ]') || line.trim().startsWith('TODO:'))
      .map(line => line.replace(/- \[ \] |TODO: /, '').trim());

    setAiSuggestions({
      tags: [...new Set(['#ESG', '#Contextual', ...extractedTags])],
      tasks: extractedTasks
    });
    
    setIsAnalyzing(false);
  };

  // Debounced Analysis
  useEffect(() => {
    const timer = setTimeout(() => {
      analyzeIntent(content);
    }, 1000);
    return () => clearTimeout(timer);
  }, [content]);

  const handleSave = () => {
    const rawData = { content, tags: aiSuggestions.tags };
    
    // [真/信] 執行物理級 Hash Lock (聖典 v3.1.0)
    const sealedData = HolyLinter.seal(rawData, `OmniNote_${contextId}`);
    
    saveNote(contextId, sealedData.content, sealedData.tags);
    setSyncStatus('synced');
    automationService.triggerAutomation('NOTE_SAVED', sealedData);
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const handleSyncTasks = async () => {
    if (aiSuggestions.tasks.length === 0) return;
    
    setSyncStatus('syncing');
    try {
      // Sync to Omni Task Matrix
      aiSuggestions.tasks.forEach(taskTitle => {
        addTask({
          title: taskTitle,
          contextId: contextId,
          priority: 'MEDIUM',
          aiSuggested: true
        });
      });
      
      setSyncStatus('synced');
      automationService.executeAutomation('TASK_COMPLETED', { contextId, taskCount: aiSuggestions.tasks.length });
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      setSyncStatus('error');
    }
  };

  return (
    <div className={cn(
      "relative flex flex-col bg-bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all shadow-2xl",
      className
    )}>
      
      {/* Header: Context Info */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-500",
            isAnalyzing ? "bg-accent scale-150 animate-pulse" : "bg-emerald-500",
            "shadow-[0_0_8px_rgba(var(--accent),0.5)]"
          )}></div>
          <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
            Context: <span className="text-accent">{contextId}</span>
            {isAnalyzing && <span className="text-[8px] animate-pulse">| ANALYZING_FLOW...</span>}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isAnalyzing && <Sparkles className="w-3 h-3 text-accent animate-pulse" />}
          {syncStatus === 'syncing' && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
          {syncStatus === 'synced' && <span className="text-[10px] text-status-optimal font-bold">SAVED</span>}
          {onClose && (
            <button onClick={onClose} aria-label="Close note" className="p-1 hover:bg-white/10 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-white/20 focus:outline-none">
              <X className="w-4 h-4 text-text-muted" />
            </button>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Input tactical notes... (Use - [ ] for tasks, # for tags)"
          className="w-full h-48 bg-transparent p-4 text-sm text-text-main placeholder-text-muted/30 resize-none focus:outline-none font-mono leading-relaxed selection:bg-accent/30"
        />
      </div>

      {/* Intelligence Layer: AI Suggestions */}
      <AnimatePresence>
        {(aiSuggestions.tags.length > 0 || aiSuggestions.tasks.length > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-3 bg-black/20 border-t border-white/5 space-y-3"
          >
            {/* 5T Live Analysis Radar */}
            <div className="flex justify-between items-center px-1">
               <div className="flex gap-1">
                  {['真','善','美','信','通'].map((char, i) => {
                    const val = content.length > 0 ? Math.min(100, (content.length * (i + 1)) % 100 + 40) : 0;
                    return (
                      <div key={i} className="flex flex-col gap-1 items-center">
                        <div className="w-6 h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             animate={{ width: `${val}%` }} 
                             className="h-full bg-accent/60" 
                           />
                        </div>
                        <span className="text-[7px] text-text-muted/40 font-black">{char}</span>
                      </div>
                    );
                  })}
               </div>
               <Badge variant="optimal" styleType="soft" className="text-[8px] font-black tracking-widest">5T_ALIGNED</Badge>
            </div>

            {/* 🏷️ Smart Tags */}
            <div className="flex flex-wrap gap-2">
              {aiSuggestions.tags.map(tag => (
                <Badge key={tag} variant="optimal" styleType="soft" className="lowercase">
                  <Tag className="w-2 h-2 mr-1 opacity-50" /> {tag}
                </Badge>
              ))}
            </div>

            {/* ✅ Extracted Tasks */}
            {aiSuggestions.tasks.length > 0 && (
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="flex items-center justify-between bg-accent/5 border border-accent/20 rounded-xl p-2 pl-3"
              >
                <div className="flex items-center gap-2 text-[11px] text-accent font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>AI detected {aiSuggestions.tasks.length} tactical tasks</span>
                </div>
                <button 
                  onClick={handleSyncTasks}
                  disabled={syncStatus === 'syncing'}
                  className="flex items-center gap-1 text-[10px] bg-accent hover:bg-accent/80 text-bg-base px-3 py-1 rounded-lg transition-all font-bold shadow-lg shadow-accent/20"
                >
                  <Share2 className="w-3 h-3" />
                  SYNC MATRIX
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="flex justify-end p-3 border-t border-white/5 bg-white/5">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-1.5 bg-accent hover:bg-accent/80 text-bg-base rounded-xl transition-all font-bold shadow-lg shadow-accent/10 group"
        >
          <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>SAVE NARRATIVE</span>
        </button>
      </div>
    </div>
  );
};
