"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Send,
  Sparkles,
  BrainCircuit,
  Activity,
  BookOpen,
  ChevronRight,
  Wrench,
  ShieldAlert,
  Paperclip,
  Image as ImageIcon,
  BarChart2,
  ChevronDown,
  Loader2,
  Mic,
  Square,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import Markdown from "react-markdown";
import { useAppContext } from "@/lib/context/app-context";

const ESG_DATA = [
  { name: "ENV", value: 60 },
  { name: "SOC", value: 55 },
  { name: "GOV", value: 50 },
  { name: "AGC", value: 35 },
];

const CAPABILITIES = [
  {
    id: "cap1",
    title: "智能對話",
    desc: "有問題直接問 AI，快速獲取解答與洞察。",
  },
  {
    id: "cap2",
    title: "知識庫",
    desc: "企業專屬資料庫，自動檢索內部規章與國際準則。",
  },
  {
    id: "cap3",
    title: "Gnosis Engine",
    desc: "智能判斷與建議，基於數據模型進行趨勢預測。",
  },
  {
    id: "cap4",
    title: "草稿系統",
    desc: "資料不遺失，隨時保存與接續您的工作進度。",
  },
  {
    id: "cap5",
    title: "異常檢測",
    desc: "問題 early warning，提早發現潛在的合規風險。",
  },
  {
    id: "cap6",
    title: "自主修復",
    desc: "系統自動處理常見錯誤，降低人工維護成本。",
  },
  {
    id: "cap7",
    title: "數據洞察",
    desc: "從數據中發現商機，提供具體的行動方案。",
  },
  {
    id: "cap8",
    title: "學習優化",
    desc: "越用越聰明，根據您的使用習慣持續進化。",
  },
];

const BEST_PRACTICES = [
  {
    id: "bp1",
    title: "最佳實踐優化完善",
    desc: "比對同業標竿，自動生成 ESG 政策優化建議與行動方案。",
    icon: Wrench,
  },
  {
    id: "bp2",
    title: "缺口補強系統平台",
    desc: "自動掃描現有數據與合規缺口，提供補強工具與追蹤機制。",
    icon: ShieldAlert,
  },
];

const PERSONAS = [
  {
    id: "junaikey",
    name: "JunAiKey AI Core",
    title: "萬能元鑰",
    description: "全方位 ESG 自主治理 AI 核心，負責異常檢測與數據分析。",
    icon: Bot,
    gradient: "from-[#009E9D] to-[#00C2A8]",
    textColor: "text-[#009E9D]",
    bgColor: "bg-[#009E9D]",
    shadowColor: "shadow-[#009E9D]/20",
    greeting:
      "您好，我是 JunAiKey (萬能元鑰)，您的 ESG 自主治理 AI 核心。我可以協助您進行異常檢測、數據分析、或提供優化建議。請問今天需要什麼協助？",
  },
  {
    id: "thoth",
    name: "Dr. Thoth 壽司博士",
    title: "知識守護者",
    description: "精通國際準則與法規的 ESG 知識庫守護者，為您解答各類合規問題。",
    icon: BrainCircuit,
    gradient: "from-[#FFB703] to-[#FF9E00]",
    textColor: "text-[#FFB703]",
    bgColor: "bg-[#FFB703]",
    shadowColor: "shadow-[#FFB703]/20",
    greeting:
      "您好！我是 Dr. Thoth 壽司博士 🍣，精通各項 ESG 國際準則與法規。有任何關於 GRI、SASB 或碳盤查的疑難雜症，儘管問我吧！",
  },
  {
    id: "tribe",
    name: "部落代理聯盟",
    title: "協作專家",
    description: "匯聚各領域專家的多智能體聯盟，為您提供跨領域的永續發展策略與執行方案。",
    icon: Users,
    gradient: "from-[#8B5CF6] to-[#A78BFA]",
    textColor: "text-[#8B5CF6]",
    bgColor: "bg-[#8B5CF6]",
    shadowColor: "shadow-[#8B5CF6]/20",
    greeting:
      "您好！我們是「部落代理聯盟」🤝。我們集結了碳盤查、社會參與、公司治理等多領域的虛擬專家。請告訴我們您的需求，我們將為您提供最全面的協作方案！",
  },
];

export function JunAiKeyView() {
  const { lang } = useAppContext();
  const [activePersonaId, setActivePersonaId] = useState("junaikey");
  const [isPersonaDropdownOpen, setIsPersonaDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const activePersona =
    PERSONAS.find((p) => p.id === activePersonaId) || PERSONAS[0];

  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: activePersona.greeting,
      type: "text",
    },
  ]);
  const [input, setInput] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsPersonaDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePersonaChange = (personaId: string) => {
    setActivePersonaId(personaId);
    setIsPersonaDropdownOpen(false);
    const newPersona = PERSONAS.find((p) => p.id === personaId) || PERSONAS[0];
    setMessages([
      {
        role: "assistant",
        content: newPersona.greeting,
        type: "text",
      },
    ]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        audioChunksRef.current = [];
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      alert("無法存取麥克風，請確認權限設定。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(",")[1];
        const mimeType = blob.type.split(";")[0] || "audio/webm";

        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing Gemini API Key");

        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { inlineData: { data: base64data, mimeType } },
                { text: "Please transcribe this audio accurately into Traditional Chinese (zh-TW). Only output the transcription, nothing else." },
              ],
            },
          ],
        });

        const transcription = response.text?.trim() || "";
        if (transcription) {
          setInput((prev) => (prev ? prev + " " + transcription : transcription));
        }
        setIsLoading(false);
      };
    } catch (error) {
      setIsLoading(false);
    }
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const newUserMsg = { role: "user", content: text, type: "text" };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setIsLoading(true);

    // Check for special UI triggers
    const isChartRequest =
      text.includes("圖表") || text.includes("分析") || text.includes("數據");
    const isImageRequest =
      text.includes("圖片") ||
      text.includes("照片") ||
      text.includes("多模態") ||
      text.includes("生成");

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Gemini API Key");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // RAG: Fetch context from NCBDB based on user query
      let contextData = "";
      try {
        if (text.includes("指標") || text.includes("KPI") || text.includes("數據") || text.includes("ESG")) {
          const { esgMetricsApi } = await import("@/lib/ncb-service");
          // Fetch some sample metrics for context
          const eMetrics = await esgMetricsApi.listByCategory("E", 2024);
          const sMetrics = await esgMetricsApi.listByCategory("S", 2024);
          const gMetrics = await esgMetricsApi.listByCategory("G", 2024);
          
          if (eMetrics.data.length > 0 || sMetrics.data.length > 0 || gMetrics.data.length > 0) {
            contextData += "【內部 ESG 指標數據庫檢索結果】\n";
            eMetrics.data.slice(0, 3).forEach(m => contextData += `- 環境(E): ${m.metric_name} = ${m.value} ${m.unit}\n`);
            sMetrics.data.slice(0, 3).forEach(m => contextData += `- 社會(S): ${m.metric_name} = ${m.value} ${m.unit}\n`);
            gMetrics.data.slice(0, 3).forEach(m => contextData += `- 治理(G): ${m.metric_name} = ${m.value} ${m.unit}\n`);
          }
        }
      } catch (e) {
        // Silently ignore RAG context fetch errors
      }

      const systemInstruction = `You are ${activePersona.name}, ${activePersona.title}. ${activePersona.description}
      Respond to the user's queries in traditional Chinese (zh-TW) matching this persona.
      Keep responses concise, professional, and helpful. Use markdown for formatting.
      When generating content or analyzing issues, you MUST follow a 'root cause analysis' approach: identify and explain the underlying reasons for issues, and suggest improvements from the source rather than just treating symptoms.
      If the user asks about "分析數據" (analyze data) or "生成圖片" (generate image), provide a short contextual text response introducing the chart or image that will be displayed below your text.
      ${contextData ? `\n\n【重要參考資料】\n請參考以下從企業資料庫檢索出的最新數據來回答用戶問題：\n${contextData}` : ""}`;

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: text,
        config: { systemInstruction },
      });

      // Add an empty assistant message to stream into
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          type: isChartRequest ? "chart" : isImageRequest ? "image" : "text",
          mediaUrl: isImageRequest
            ? "https://picsum.photos/seed/greenfactory/800/400?blur=2"
            : undefined,
          mediaAlt: isImageRequest ? "綠色工廠概念圖" : undefined,
        },
      ]);

      let fullResponse = "";
      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      // Fallback response if API fails
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，系統目前遇到一些問題，無法連線至 AI 核心。請確認您的 API 金鑰設定，或稍後再試。",
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-5xl mx-auto">
      {/* AI Chat Interface */}
      <GlassCard className="flex flex-col flex-1 shadow-sm overflow-hidden border border-slate-200">
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 md:gap-4 relative" ref={dropdownRef}>
            <button
              onClick={() => setIsPersonaDropdownOpen(!isPersonaDropdownOpen)}
              className="flex items-center gap-2 md:gap-3 hover:bg-slate-50 p-1.5 md:p-2 -ml-1.5 md:-ml-2 rounded-xl transition-colors text-left"
            >
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${activePersona.gradient} flex items-center justify-center shadow-sm ${activePersona.shadowColor} transition-all duration-300`}
              >
                <activePersona.icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base md:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                  {activePersona.name}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isPersonaDropdownOpen ? "rotate-180" : ""}`}
                  />
                </h2>
                <p
                  className={`text-xs md:text-sm ${activePersona.textColor} font-semibold flex items-center gap-2`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${activePersona.bgColor} animate-pulse`}
                  />
                  {lang === 'zh' ? '系統上線' : 'System Online'}
                </p>
              </div>
            </button>

            {/* Persona Dropdown */}
            <AnimatePresence>
              {isPersonaDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50"
                >
                  <div className="p-2">
                    {PERSONAS.map((persona) => (
                      <button
                        key={persona.id}
                        onClick={() => handlePersonaChange(persona.id)}
                        className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${
                          activePersonaId === persona.id
                            ? "bg-slate-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${persona.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}
                        >
                          <persona.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {persona.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {persona.description}
                          </p>
                        </div>
                        {activePersonaId === persona.id && (
                          <div className={`ml-auto ${persona.textColor}`}>
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="hidden md:flex px-4 py-2 rounded-xl bg-slate-50 text-sm font-medium text-slate-600 items-center gap-2 border border-slate-100">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Gemini AI Powered
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50/50 relative">
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8"
            >
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#999999] uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> 系統強化與優化
                </h3>
                {BEST_PRACTICES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSend(`請協助執行：${item.title}`)}
                      disabled={isLoading}
                      className={`w-full text-left p-4 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[${activePersona.bgColor}] hover:shadow-md transition-all group disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`font-bold text-[#333333] group-hover:${activePersona.textColor} flex items-center gap-2`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.title}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 text-[#999999] group-hover:${activePersona.textColor}`}
                        />
                      </div>
                      <p className="text-xs text-[#666666] leading-relaxed">
                        {item.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-4 md:col-span-2 lg:col-span-1">
                <h3 className="text-sm font-bold text-[#999999] uppercase tracking-wider flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4" /> 核心能力
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAPABILITIES.map((cap) => (
                    <button
                      key={cap.id}
                      onClick={() =>
                        handleSend(`我想了解更多關於「${cap.title}」的功能`)
                      }
                      disabled={isLoading}
                      className={`w-full flex items-start justify-between p-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[${activePersona.bgColor}] hover:${activePersona.textColor} text-[#666666] transition-colors group disabled:opacity-50 h-full`}
                    >
                      <div className="text-left flex-1 mr-2">
                        <span
                          className={`text-sm font-bold block group-hover:${activePersona.textColor} mb-1`}
                        >
                          {cap.title}
                        </span>
                        <span className="text-[10px] opacity-70 block leading-tight text-balance">
                          {cap.desc}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 flex-shrink-0 mt-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex gap-3 md:gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-slate-200 text-slate-600"
                    : `bg-gradient-to-br ${activePersona.gradient} text-white shadow-sm`
                }`}
              >
                {msg.role === "user" ? (
                  <span className="font-bold text-sm">U</span>
                ) : (
                  <activePersona.icon className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </div>
              <div
                className={`max-w-[85%] md:max-w-[75%] flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 md:p-4 rounded-[12px] text-sm md:text-base ${
                    msg.role === "user"
                      ? "bg-slate-800 text-white rounded-tr-none"
                      : "bg-white border border-[#E5E7EB] text-[#333333] rounded-tl-none leading-relaxed shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-body prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-100 prose-pre:text-slate-800">
                      <Markdown>{msg.content || "..."}</Markdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* Multimodal Content */}
                {msg.type === "image" && msg.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm w-full max-w-md mt-3 relative h-[250px]">
                    <Image
                      src={msg.mediaUrl}
                      alt={msg.mediaAlt || "Generated Image"}
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                )}

                {msg.type === "chart" && (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-md h-[280px] flex flex-col mt-3">
                    <h4 className="text-sm font-bold text-slate-600 mb-6 text-center tracking-wide">
                      ESG 核心指標趨勢分析
                    </h4>
                    <div className="flex-1 w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart
                          data={ESG_DATA}
                          margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            tick={{
                              fontSize: 11,
                              fill: "#64748b",
                              fontWeight: 500,
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            tick={{
                              fontSize: 11,
                              fill: "#64748b",
                              fontWeight: 500,
                            }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            cursor={{ fill: "#f8fafc" }}
                            contentStyle={{
                              borderRadius: "12px",
                              border: "1px solid #e2e8f0",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            fill={
                              activePersonaId === "thoth"
                                ? "#FFB703"
                                : "#009E9D"
                            }
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 md:p-6 border-t border-slate-200 bg-white z-10">
          <div className="relative max-w-4xl mx-auto flex items-center gap-3">
            <div className="flex items-center gap-1 md:gap-2 text-slate-400">
              <button
                onClick={() => handleSend("分析數據")}
                disabled={isLoading}
                className={`p-2.5 hover:bg-slate-100 hover:${activePersona.textColor} rounded-xl transition-colors disabled:opacity-50`}
                title="分析數據"
              >
                <BarChart2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSend("生成圖片")}
                disabled={isLoading}
                className={`p-2.5 hover:bg-slate-100 hover:${activePersona.textColor} rounded-xl transition-colors disabled:opacity-50`}
                title="上傳/生成圖片"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="relative flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl shadow-inner focus-within:ring-4 focus-within:ring-[${activePersona.bgColor}]/10 focus-within:border-[${activePersona.bgColor}] transition-all duration-200">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                disabled={isLoading}
                placeholder={isRecording ? "正在聆聽..." : `Ask ${activePersona.name} about ESG insights...`}
                className={`w-full bg-transparent pl-5 pr-2 py-3.5 md:py-4 text-sm md:text-base text-slate-800 focus:outline-none placeholder:text-slate-400 disabled:opacity-50`}
              />
              <div className="flex items-center pr-2 gap-1">
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors animate-pulse"
                    title="停止錄音"
                  >
                    <Square className="w-5 h-5 fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    disabled={isLoading}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                    title="語音輸入"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleSend(input)}
                  disabled={isLoading || (!input.trim() && !isRecording)}
                  className={`p-2.5 md:p-3 ${activePersona.bgColor} text-white rounded-xl transition-colors shadow-sm hover:shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <p className="text-center text-[11px] font-medium text-slate-400 mt-4">
            {activePersona.name} can make mistakes. Consider verifying critical
            ESG data.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

