"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SpiritOrbGoProps {
  onGo: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

/**
 * 萬能永續光球精靈 (Omni Sustainability Spirit Orb)
 * 實作 5T 協議中的「美」與「通」
 * 此為 GO 功能的視覺與觸發核心
 */
export function SpiritOrbGo({ onGo, isLoading, className }: SpiritOrbGoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => (p + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Background Glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        className="absolute w-40 h-40 bg-primary/20 rounded-full blur-3xl"
      />

      {/* Rotating Rings */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-32 h-32 border border-primary/20 rounded-full border-dashed"
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute w-28 h-28 border border-accent/20 rounded-full border-dotted"
      />

      {/* Main Interactive Orb */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onGo}
        disabled={isLoading}
        className={cn(
          "relative w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-700 overflow-hidden group",
          isLoading 
            ? "cursor-wait" 
            : "cursor-pointer hover:shadow-[0_0_30px_rgba(60,42,33,0.3)]"
        )}
      >
        {/* Liquid Glass Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-xl border border-white/40 shadow-inner" />
        
        {/* Pulse Overlay */}
        <motion.div 
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-full bg-primary/20"
        />

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="z-10 flex flex-col items-center"
            >
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-[10px] font-black text-primary mt-1 tracking-tighter">GO...</span>
            </motion.div>
          ) : (
            <motion.div
              key="static"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="z-10 flex flex-col items-center"
            >
              <Sparkles className={cn(
                "w-8 h-8 transition-all duration-500",
                isHovered ? "text-accent scale-110 rotate-12" : "text-primary"
              )} />
              <span className="text-sm font-black text-slate-800 mt-1 tracking-widest uppercase">GO</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Energy Flow Animation */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse" />
      </motion.button>

      {/* Label Tooltip */}
      <AnimatePresence>
        {isHovered && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -bottom-16 bg-bg-surface/90 backdrop-blur-xl px-4 py-2 rounded-2xl border border-primary/10 shadow-crystal-locked whitespace-nowrap"
          >
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              啟動萬能永續評估系統
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
