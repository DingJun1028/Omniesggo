"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Loader2, Sparkles, Server, Zap, Award } from "lucide-react";
import { dispatchSwarmTask, triggerSelfOptimization } from "@/lib/agents/swarm-orchestrator";
import { dispatchNavigationTask } from "@/lib/agents/navigation-swarm";
import { FiveTCertificate } from "./digital-certificate";

export const ESGSwarmHUD = ({ 
  mode = "calculation", 
  context = {},
  onComplete
}: { 
  mode?: "calculation" | "navigation",
  context?: any,
  onComplete?: (result: any) => void
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [agentStream, setAgentStream] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [certificateData, setCertificateData] = useState<any>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [errorManifest, setErrorManifest] = useState<string | null>(null);
  const [isOptimized, setIsOptimized] = useState(false);

  const startSimulation = useCallback(async () => {
    setIsStreaming(true);
    setAgentStream([]);
    setIsComplete(false);
    setErrorManifest(null);

    const traceId = `TRC-${Date.now()}`;
    const instruction = mode === "navigation" ? "協助導覽報告撰寫" : "開始盤查";

    const sendEvent = (data: any) => {
      if (data.type === 'COMPLETED') {
        setIsComplete(true);
        setIsStreaming(false);
      } else if (data.type === 'ERROR') {
        setErrorManifest(data.message);
        setIsStreaming(false);
      } else {
        setAgentStream((prev) => [...prev, data]);
      }
    };

    try {
      if (mode === "navigation") {
        const finalResult = await dispatchNavigationTask(instruction, context, sendEvent);
        if (finalResult.certificate) {
          setCertificateData(finalResult.certificate);
        }
        if (onComplete) onComplete(finalResult);
        sendEvent({ type: "COMPLETED", result: finalResult });
      } else {
        const finalResult = await dispatchSwarmTask(instruction, traceId, sendEvent, isOptimized);
        sendEvent({ type: "COMPLETED", result: finalResult });
      }
    } catch (error: any) {
      sendEvent({ type: "ERROR", message: error.message });
    }
  }, [isOptimized, mode, context, onComplete]);

  const handleSelfOptimize = async () => {
    setIsStreaming(true);
    setAgentStream([]);
    setIsComplete(false);
    setErrorManifest(null);

    const sendEvent = (data: any) => {
      if (data.type === 'COMPLETED') {
        setIsComplete(true);
        setIsStreaming(false);
        setIsOptimized(true);
      } else {
        setAgentStream((prev) => [...prev, data]);
      }
    };

    try {
      await triggerSelfOptimization(sendEvent);
      sendEvent({ type: "COMPLETED" });
    } catch (error: any) {
      sendEvent({ type: "ERROR", message: error.message });
    }
  };

  // Simulate progress on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startSimulation();
    }, 100);
    return () => clearTimeout(timer);
  }, [startSimulation]);

  return (
    <div className={`relative w-full p-6 rounded-lg backdrop-blur-[12px] border shadow-[0_2px_8px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-500 ${isOptimized ? 'bg-gradient-to-br from-white/80 to-[#009E9D]/5 border-[#009E9D]/20' : 'bg-white/60 border-black/5'}`}>
      {/* Top: Orchestrator Typewriter Panel */}
      <div className="mb-6 pb-4 border-b border-black/5 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {isOptimized ? (
              <Zap className="w-4 h-4 text-[#009E9D] animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#009E9D]" />
            )}
            <h3 className="text-sm text-[#009E9D] font-bold tracking-wider uppercase flex items-center gap-2">
              總管大腦 (The Orchestrator)
              {isOptimized && (
                <span className="text-[10px] bg-[#009E9D]/10 text-[#009E9D] px-2 py-0.5 rounded-full border border-[#009E9D]/20">
                  v2.0 Optimized
                </span>
              )}
            </h3>
          </div>
          <div className="h-8 flex items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={agentStream.length}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.15 }}
                className="text-base text-[#333333] font-mono tracking-wide font-medium"
              >
                {agentStream.length > 0
                  ? agentStream[agentStream.length - 1].status
                  : isComplete ? "任務完成：數據已刻印至 NCBDB 核心禁區。" : "等待指令..."}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        
        {!isOptimized && isComplete && (
          <button
            onClick={handleSelfOptimize}
            disabled={isStreaming}
            className="flex items-center gap-1 text-xs text-[#FFB703] hover:text-[#FFB703]/80 transition-colors duration-150 px-3 py-1.5 rounded-md bg-[#FFB703]/10 border border-[#FFB703]/20 hover:bg-[#FFB703]/20 disabled:opacity-50"
          >
            <Zap className="w-3 h-3" />
            自我優化 (Self-Optimize)
          </button>
        )}
      </div>

      {/* Bottom: Agent Array Breathing Lights */}
      <div className="space-y-3">
        {agentStream.map((step, index) => {
          const isActive = index === agentStream.length - 1 && !isComplete;
          const isDone = index < agentStream.length - 1 || isComplete;

          return (
            <div
              key={step.agent + index}
              className={`flex flex-col p-3 rounded-md transition-colors duration-200 ${
                isActive
                  ? "bg-[#009E9D]/5 border border-[#009E9D]/20"
                  : isDone
                  ? "bg-[#F8F9FA] border border-black/5"
                  : "bg-transparent border border-transparent opacity-50"
              }`}
            >
              <div className="flex items-center">
                {/* Status Indicator Light */}
                <div className="relative w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">
                  {step.type === 'debate' ? (
                    <Activity className="w-5 h-5 text-amber-500 animate-pulse relative z-10" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-[#009E9D] animate-spin relative z-10" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-[#219EBC]" />
                  ) : (
                    <div className="w-2 h-2 bg-[#333333]/20 rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-bold tracking-wider ${
                        step.type === 'debate' ? "text-amber-600" : isActive ? "text-[#009E9D]" : isDone ? "text-[#219EBC]" : "text-[#333333]/50"
                      }`}
                    >
                      [{step.agent}]
                    </span>
                  </div>
                  <p
                    className={`text-sm truncate font-normal ${
                      isActive ? "text-[#333333]" : isDone ? "text-[#333333]/80" : "text-[#333333]/50"
                    }`}
                  >
                    {step.status}
                  </p>
                </div>
                
                {/* Transferable / Trust Badge */}
                {isDone && step.agent !== "系統核心" && step.type !== 'debate' && (
                  <div className="ml-3 flex-shrink-0">
                    <span className="text-[10px] font-mono text-[#219EBC] flex items-center gap-1 bg-[#219EBC]/10 px-2 py-1 rounded-md border border-[#219EBC]/20">
                      <Server className="w-3 h-3" />
                      Hash Locked
                    </span>
                  </div>
                )}
              </div>

              {/* Specialized Debate UI */}
              {step.type === 'debate' && step.debateData && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-amber-200/30 pt-4"
                >
                  <div className="col-span-1 md:col-span-2 mb-2">
                    <h4 className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-3 h-3" /> 衝突解析：{step.debateData.conflict_point}
                    </h4>
                  </div>
                  {step.debateData.arguments.map((arg: any, i: number) => (
                    <div key={i} className={`p-3 rounded-lg border flex flex-col gap-2 ${arg.agent_name.includes('戰略') ? 'bg-indigo-50/50 border-indigo-100' : 'bg-rose-50/50 border-rose-100'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${arg.agent_name.includes('戰略') ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                          {arg.agent_name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium italic">「{arg.stance}」</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                        {arg.reasoning}
                      </p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Completion State */}
      <AnimatePresence>
        {isComplete && (
          <>
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#219EBC]" />
                <span className="text-xs text-[#219EBC] font-mono font-bold">
                  {isOptimized ? "5T Protocol Verified (Quantum Mode)" : "5T Protocol Verified"}
                </span>
              </div>
              <div className="flex gap-2">
                {certificateData && (
                  <button 
                    onClick={() => setShowCertificate(true)}
                    className="text-xs text-white px-3 py-1.5 rounded-md bg-[#009E9D] hover:bg-[#007E7D] transition-colors duration-150 flex items-center gap-1 shadow-md shadow-[#009E9D]/10"
                  >
                    <Award className="w-3.5 h-3.5" />
                    檢視 5T 數位證書
                  </button>
                )}
                <button 
                  onClick={startSimulation}
                  disabled={isStreaming}
                  className="text-xs text-[#009E9D] hover:text-[#00C2A8] transition-colors duration-150 px-3 py-1.5 rounded-md bg-transparent border border-[#009E9D] hover:bg-[#009E9D]/5 disabled:opacity-50"
                >
                  Restart
                </button>
              </div>
            </motion.div>

            {/* Certificate Modal Overlay */}
            <AnimatePresence>
              {showCertificate && certificateData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => setShowCertificate(false)}
                  />
                  <div className="relative z-10 w-full max-w-2xl">
                    <FiveTCertificate 
                      data={certificateData} 
                      onClose={() => setShowCertificate(false)} 
                    />
                  </div>
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
