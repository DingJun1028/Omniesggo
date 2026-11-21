"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  BookOpen,
  LucideIcon,
  Zap,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuideStep {
  id: number;
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  border: string;
  bg: string;
  status?: 'pending' | 'active' | 'completed';
}

interface GuideStepperProps {
  title: string;
  steps: GuideStep[];
  defaultOpen?: boolean;
}

export function GuideStepper({ title, steps, defaultOpen = true }: GuideStepperProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Determine actual status if not provided (mocking logic)
  const enhancedSteps = steps.map((s, i) => ({
    ...s,
    status: s.status || (i === 0 ? 'active' : i < 0 ? 'completed' : 'pending')
  }));

  return (
    <div className="bg-bg-surface/40 rounded-2xl border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] relative backdrop-blur-3xl overflow-hidden transition-all duration-500">
      {/* Glossy Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 px-6 cursor-pointer hover:bg-white/5 transition-all relative z-20 group"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5">
              <BookOpen className="w-4 h-4" />
            </div>
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-1 bg-primary/20 blur-md rounded-xl -z-10"
            />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-sm font-black text-text-main group-hover:text-primary transition-colors uppercase tracking-widest italic">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/3" />
              </div>
              <span className="text-[9px] font-mono text-text-muted/60 uppercase tracking-tighter">Guide Engine Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest hidden sm:block">
            {enhancedSteps.length} Phases
          </span>
          <div className={cn(
            "p-1.5 rounded-full border border-white/10 transition-all duration-300",
            isOpen ? "bg-primary/20 border-primary/30" : "bg-white/5"
          )}>
            <ChevronDown className={cn(
              "w-4 h-4 text-text-muted transition-transform duration-500",
              isOpen ? "rotate-180 text-primary" : ""
            )} />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="px-6 overflow-visible"
          >
            <div className="pb-12 pt-8">
              {/* Step Visualization */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-y-12 gap-x-6 relative z-10">
                {enhancedSteps.map((panel, index) => (
                  <div 
                    key={panel.id} 
                    className="relative group flex flex-col items-center"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Connection Line with Flow Animation */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute left-[calc(50%+24px)] top-6 w-[calc(100%-48px)] h-[1px]">
                         <div className="absolute inset-0 bg-white/5" />
                         <motion.div 
                           animate={{ 
                             x: ["-100%", "100%"],
                             opacity: [0, 1, 0]
                           }}
                           transition={{ 
                             duration: 3, 
                             repeat: Infinity, 
                             ease: "linear",
                             delay: index * 0.4
                           }}
                           className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent w-full"
                         />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center gap-4 relative z-10">
                      {/* Step ID with high contrast */}
                      <div className="text-[9px] font-black font-mono text-text-muted/30 tracking-tighter mb-1">
                        PHASE_{panel.id < 10 ? `0${panel.id}` : panel.id}
                      </div>
                      
                      {/* Icon Container with Layered Glass */}
                      <div className="relative">
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={cn(
                            "w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300 relative z-10 overflow-hidden",
                            panel.border,
                            panel.bg,
                            panel.color,
                            hoveredIndex === index ? "shadow-[0_0_20px_rgba(0,255,255,0.2)]" : "shadow-inner"
                          )}
                        >
                          {/* Scanline Effect */}
                          <div className="absolute inset-x-0 h-[2px] bg-white/10 -top-full group-hover:top-[200%] transition-all duration-700 ease-in-out opacity-20" />
                          
                          <panel.icon className="w-5 h-5" />
                        </motion.div>

                        {/* Status Ornament */}
                        {panel.status === 'completed' && (
                          <div className="absolute -top-1 -right-1 bg-status-optimal text-slate-900 rounded-full p-0.5 shadow-lg border border-bg-base">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                        {panel.status === 'active' && (
                          <div className="absolute -top-1 -right-1 bg-primary text-slate-900 rounded-full p-0.5 shadow-lg border border-bg-base animate-pulse">
                            <Zap className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center px-1">
                        <p className="text-[10px] font-black text-text-main leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">
                          {panel.title}
                        </p>
                      </div>

                      {/* Liquid Glass Tooltip */}
                      <AnimatePresence>
                        {hoveredIndex === index && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.9 }}
                            className="absolute top-24 pointer-events-none z-50 min-w-[140px]"
                          >
                             <div className="relative p-3 rounded-xl bg-bg-base/80 border border-white/10 backdrop-blur-xl shadow-2xl">
                               <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-bg-base border-t border-l border-white/10 rotate-45" />
                               <p className="text-[10px] text-text-main font-bold text-center leading-relaxed">
                                {panel.desc}
                               </p>
                               <div className="mt-2 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decorative Gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
    </div>
  );
}
