"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  Mic, 
  MicOff, 
  Volume2, 
  Settings2, 
  LayoutDashboard, 
  ShieldCheck, 
  Activity,
  Globe,
  Sparkles,
  Command,
  ChevronRight,
  ChevronLeft,
  X,
  Bot
} from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import Image from "next/image";
import { GoogleGenAI, Modality } from "@google/genai";
import { Badge } from "@/components/ui/badge";
import { AgentNetworkBus, AgentStatus } from "@/lib/services/EntropyAgent";
import { AwakeningManager } from "@/lib/services/adk/AwakeningManager";
import { cn } from "@/lib/utils";

interface SentientSpiritHubProps {
  variant?: "floating" | "header" | "modal";
  className?: string;
}

export function SentientSpiritHub({ variant = "floating", className }: SentientSpiritHubProps) {
  const { 
    aiProxyMode, 
    setAiProxyMode, 
    lang, 
    isSpiritOpen, 
    setIsSpiritOpen 
  } = useAppContext();
  
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingBriefing, setIsPlayingBriefing] = useState(false);
  const [pulseScale, setPulseScale] = useState(1);
  const [latestAgentStatus, setLatestAgentStatus] = useState<AgentStatus | null>(null);

  useEffect(() => {
    const unsubscribe = AgentNetworkBus.subscribe((status) => {
      setLatestAgentStatus(status);
    });
    return () => {
      unsubscribe?.();
    };
  }, []);

  // Subtle scale sync
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseScale(s => s === 1 ? 1.01 : 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleMode = async () => {
    if (!aiProxyMode) {
      await AwakeningManager.initiateAwakening(setAiProxyMode);
    } else {
      AwakeningManager.stopAwakening(setAiProxyMode);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('您的瀏覽器不支持語音識別。');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'zh' ? 'zh-TW' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const command = event.results[0][0].transcript.toLowerCase();
      console.log('Voice command:', command);
      if (command.includes('會報') || command.includes('briefing') || command.includes('報告')) {
        playBriefing();
      } else if (command.includes('切換') || command.includes('switch')) {
        toggleMode();
      }
    };

    recognition.start();
  };

  const playBriefing = async () => {
    if (isPlayingBriefing) return;
    setIsPlayingBriefing(true);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Missing Gemini API Key");

      const ai = new GoogleGenAI({ apiKey });
      const textToRead = aiProxyMode 
        ? "自主治理中樞已上線，AI 代行程序運作正常。全域合規風險已對沖。" 
        : "早安，為您準備了今日的永續路徑簡報。目前進度穩定，建議關注供應鏈碳排數據。";

      const response = await ai.models.generateContent({
        model: "gemini-2.1-flash",
        contents: [{ parts: [{ text: textToRead }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: aiProxyMode ? 'Fenrir' : 'Aoide' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) float32Array[i] = int16Array[i] / 32768.0;

        const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
        source.onended = () => setIsPlayingBriefing(false);
      } else {
        setIsPlayingBriefing(false);
      }
    } catch (e) {
      setIsPlayingBriefing(false);
    }
  };

  const branding = aiProxyMode ? {
      color: "from-proxy/70 to-proxy/40",
      glow: "shadow-[0_0_20px_rgba(176,137,104,0.2)]",
      border: "border-proxy/20",
      spiritImg: "https://thumbs4.imagebam.com/e5/b8/6c/ME1B44KB_t.png",
      label: "自動 [AUTOMATIC]",
      desc: "AI 有機代行視界",
  } : {
      color: "from-primary/70 to-primary/40",
      glow: "shadow-[0_0_20px_rgba(60,42,33,0.15)]",
      border: "border-primary/20",
      spiritImg: "https://thumbs4.imagebam.com/e5/b8/6c/ME1B44KB_t.png",
      label: "手動 [MANUAL]",
      desc: "純淨人本協作",
  };



  const containerVariants: any = {
    collapsed: { width: 64, height: 64, borderRadius: "50%" },
    expanded: { 
      width: 280, 
      height: 380, 
      borderRadius: "24px",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
  };

  const orbRef = useRef<HTMLDivElement>(null);

  if (variant === "header") {
    return (
      <div 
        className="relative group cursor-pointer"
        onClick={() => setIsSpiritOpen(true)}
      >
        <motion.div 
          animate={{ scale: isPlayingBriefing ? [1, 1.1, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-12 h-12 rounded-full relative overflow-hidden ${branding.glow} ${branding.border} border-2 overflow-hidden`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${branding.color} opacity-20`} />
          <Image 
            src={branding.spiritImg} 
            alt="Spirit Core" 
            fill 
            className="object-cover mix-blend-multiply opacity-90"
          />
          {isPlayingBriefing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 z-[100] ${className}`}>
      <motion.div
        variants={containerVariants}
        initial="collapsed"
        animate={isExpanded ? "expanded" : "collapsed"}
        onMouseEnter={() => variant === "floating" && setIsHovered(true)}
        onMouseLeave={() => variant === "floating" && !isExpanded && setIsHovered(false)}
        className={`bg-bg-surface/90 backdrop-blur-2xl shadow-crystal-locked border ${branding.border} overflow-hidden pointer-events-auto flex flex-col elite-card p-0 !rounded-[24px]`}
      >

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              {/* HUD Header */}
              <div className={`p-4 bg-gradient-to-r ${branding.color} text-white flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold text-sm tracking-widest">{branding.label}</span>
                  {latestAgentStatus?.status === "PROCESSING" && (
                    <motion.div
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Badge variant="optimal" styleType="soft" className="ml-2 bg-white/20 text-[8px] border-none">NEURAL SYNC</Badge>
                    </motion.div>
                  )}
                </div>
                <button onClick={() => setIsExpanded(false)} className="hover:rotate-90 transition-transform focus-visible:ring-2 focus-visible:ring-primary rounded-sm" aria-label="關閉" title="關閉">
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* HUD Body */}
              <div className="flex-1 p-5 space-y-6 overflow-y-auto hide-scrollbar">
                {/* Mode Info */}
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-text-main">{branding.desc}</h3>
                  <p className="text-xs text-text-muted font-medium flex items-center gap-2">
                    {latestAgentStatus?.status === "PROCESSING" ? (
                      <>
                        <Activity className="w-3 h-3 text-status-optimal animate-pulse" />
                        代理活躍中: {latestAgentStatus.agentId}
                      </>
                    ) : (
                      "系統狀態評估：優良 | 代理待命"
                    )}
                  </p>
                  {latestAgentStatus?.currentTask && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 p-2 bg-slate-900/50 rounded-lg border border-white/5 text-[10px] font-mono text-status-optimal"
                    >
                      PROCESSED_BY_{latestAgentStatus.agentId}: {latestAgentStatus.currentTask}
                    </motion.div>
                  )}
                </div>


                {/* Quick Stats HUD */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-base/40 p-3 rounded-[16px] border border-primary/10 shadow-sm group hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[10px] font-bold text-text-muted">CARBON INTENSITY</span>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-lg font-black text-text-main">12.4</span>
                      <span className="text-[10px] text-primary mb-1">▼ 2%</span>
                    </div>
                  </div>
                  <div className="bg-bg-base/40 p-3 rounded-xl border border-primary/10 shadow-sm group hover:border-accent/30 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-accent" />
                      <span className="text-[10px] font-bold text-text-muted">ENERGY EFF.</span>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-lg font-black text-text-main">92%</span>
                      <span className="text-[10px] text-accent mb-1">▲ 5%</span>
                    </div>
                  </div>
                </div>


                {/* Main Action Orbits */}
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setIsSpiritOpen(true);
                      setIsExpanded(false);
                    }}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${branding.color} opacity-0 group-hover:opacity-20 transition-opacity`} />
                    <Bot className={`w-5 h-5 ${isSpiritOpen ? 'text-primary' : 'text-slate-400'}`} />
                    <div className="flex flex-col items-start translate-x-0 group-hover:translate-x-1 transition-transform">
                      <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Neural Link</span>
                      <span className="text-sm font-black">與精靈進行深層對話</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 ml-auto mr-4" />
                  </button>

                  <button 
                    onClick={playBriefing}
                    className="w-full py-4 bg-bg-base/60 border border-primary/10 text-text-main rounded-2xl flex items-center justify-center gap-3 group relative overflow-hidden hover:border-primary/30 transition-all font-bold"
                  >
                    <Volume2 className={`w-5 h-5 ${isPlayingBriefing ? 'animate-bounce text-primary' : 'text-text-muted'}`} />
                    <div className="flex flex-col items-start text-left">
                      <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">Oracle Voice</span>
                      <span className="text-sm">播放每日 AI 會報</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted ml-auto mr-4" />
                  </button>


                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={startListening}
                      className={`py-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${isListening ? 'border-status-lethal/50 bg-status-lethal/10 text-status-lethal' : 'border-primary/10 bg-bg-base/40 text-text-muted hover:border-primary/20'}`}
                    >
                      {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                      <span className="text-[10px] font-bold">VOICE OPS</span>
                    </button>
                    <button 
                      onClick={toggleMode}
                      className={cn(
                        "py-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                        aiProxyMode 
                          ? "border-proxy/50 bg-proxy/10 text-proxy shadow-[0_0_15px_rgba(255,183,3,0.3)] animate-pulse" 
                          : "border-primary/10 bg-bg-base/40 text-text-muted hover:border-primary/20"
                      )}
                    >
                      <Zap className={cn("w-5 h-5", aiProxyMode && "animate-spin-slow")} />
                      <span className="text-[10px] font-bold">{aiProxyMode ? "AWAKENED" : "AWAKEN"}</span>
                    </button>
                  </div>

                </div>

                {/* Bottom Hint */}
                <div className="pt-2 flex items-center justify-center gap-2 text-[10px] font-bold text-text-muted">
                  <Command className="w-3 h-3" />
                  <span>CTRL + K 喚醒萬能助手</span>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed Orb Hub */}
        {!isExpanded && (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer group"
            onClick={() => setIsExpanded(true)}
          >
            {/* Animated Rings */}
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ rotate: { duration: 10, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity } }}
              className={`absolute inset-2 rounded-full border border-dashed ${aiProxyMode ? 'border-proxy/30' : 'border-primary/30'}`}
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className={`absolute inset-4 rounded-full border border-dotted ${aiProxyMode ? 'border-proxy/30' : 'border-primary/20'}`}
            />
            
            {/* Core Orb */}
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`w-14 h-14 rounded-full relative overflow-hidden ${branding.glow} ${branding.border} border-2 overflow-hidden z-10 transition-all duration-500`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${branding.color} opacity-20`} />
              <Image 
                src={branding.spiritImg} 
                alt="Spirit Core" 
                fill 
                className="object-cover mix-blend-multiply opacity-90 transition-transform group-hover:scale-110"
              />
              {(isListening || isPlayingBriefing) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
                  {isListening ? <Mic className="w-4 h-4 text-proxy absolute" /> : <Volume2 className="w-4 h-4 text-primary absolute" />}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Hover Hotkeys Tooltip */}
      <AnimatePresence>
        {isHovered && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="absolute right-[80px] bottom-0 bg-bg-surface/90 backdrop-blur-xl p-3 rounded-2xl shadow-crystal-locked border border-primary/10 whitespace-nowrap hidden md:block"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${aiProxyMode ? 'bg-proxy' : 'bg-primary'}`} />
                <span className="text-xs font-black text-text-main tracking-tighter uppercase whitespace-nowrap">Omni Spirit Core V2.5</span>
              </div>
              <div className="h-px bg-border/50" />

              {[
                { k: "K", d: "喚醒與互動" },
                { k: "V", d: "語音代行指令" },
                { k: "S", d: "切換治理模式" }
              ].map(h => (
                <div key={h.k} className="flex items-center justify-between gap-6 text-[10px] text-text-muted">
                  <span className="font-bold">{h.d}</span>
                  <div className="flex items-center gap-1 font-mono bg-bg-base/80 px-1.5 py-0.5 rounded border border-border">
                    <Command className="w-2 h-2" /> {h.k}
                  </div>
                </div>

              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
