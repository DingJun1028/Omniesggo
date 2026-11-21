"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  FileText,
  Activity,
  ShieldCheck,
  Wrench,
  Send,
  Loader2,
  Mic,
  Square,
  MessageSquare,
  Target,
  Eye,
  Zap,
  Radio,
  Gamepad2,
  Trophy,
  Library,
  Lock,
  Unlock,
  LayoutDashboard,
  Network,
  Database,
  Cpu,
  Globe,
  Workflow,
  LineChart
} from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import { withRetry } from "@/lib/api-utils";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import Markdown from "react-markdown";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export function SpiritModal() {
  const { 
    isSpiritOpen, 
    setIsSpiritOpen, 
    setActiveTab: setGlobalActiveTab, 
    setIsReportingWizardOpen, 
    setReportingWizardStep,
    aiProxyMode,
    setAiProxyMode
  } = useAppContext();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "overview" | "cards" | "integration">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const mockData = [
    { time: '08:00', carbon: 2.4, energy: 80 },
    { time: '10:00', carbon: 3.1, energy: 85 },
    { time: '12:00', carbon: 4.5, energy: 92 },
    { time: '14:00', carbon: 3.8, energy: 88 },
    { time: '16:00', carbon: 2.9, energy: 82 },
    { time: '18:00', carbon: 2.1, energy: 75 },
  ];
  
  // Standard recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Live API refs
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const captureContextRef = useRef<AudioContext | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const [messages, setMessages] = useState<any[]>([
    {
      role: "assistant",
      content: "您好！我是您的萬能光球精靈 (Omni Genie)。我已準備好為您導航 ESG 治理路徑。\n\n目前系統支援 **自動模式 (Auto Mode)**。啟動後，我將自主執行數據採集、異常偵測與報表生成任務，讓您專注於策略決策。\n\n您可以隨時對我說「切換模式」來切換至 **手動模式 (Manual Mode)** 或持續使用 AI 代理。請問需要什麼協助？",
    },
  ]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSpiritOpen]);

  // Cleanup Live API on unmount or close
  useEffect(() => {
    if (!isSpiritOpen) {
      stopLiveSession();
    }
    return () => {
      stopLiveSession();
    };
  }, [isSpiritOpen]);

  // --- Standard Audio Recording (Transcription) ---
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
      console.error("Error accessing microphone:", error);
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
        const response = await withRetry(() => ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              parts: [
                { inlineData: { data: base64data, mimeType } },
                { text: "Please transcribe this audio accurately into Traditional Chinese (zh-TW). Only output the transcription, nothing else." },
              ],
            },
          ],
        }));

        const transcription = response.text?.trim() || "";
        if (transcription) {
          setInput((prev) => (prev ? prev + " " + transcription : transcription));
        }
        setIsLoading(false);
      };
    } catch (error) {
      console.error("Transcription error:", error);
      setIsLoading(false);
    }
  };

  // --- Live API (Native Audio) ---
  const startLiveSession = async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        alert("Missing Gemini API Key");
        return;
      }

      setIsLiveMode(true);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "🎙️ 已啟動即時語音對話模式 (Live API Mode)。請直接對我說話！" }
      ]);

      const ai = new GoogleGenAI({ apiKey });

      // Setup Playback AudioContext
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      nextPlayTimeRef.current = audioCtx.currentTime;

      const playAudioChunk = (base64Data: string) => {
        if (!audioContextRef.current) return;
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }
        const buffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
        buffer.getChannelData(0).set(float32Array);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        
        const startTime = Math.max(audioContextRef.current.currentTime, nextPlayTimeRef.current);
        source.start(startTime);
        nextPlayTimeRef.current = startTime + buffer.duration;
      };

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "你是萬能光球精靈 (Omni Genie)，ESG GO 系統的 AI 助理。請用繁體中文簡短、親切地回答。",
        },
        callbacks: {
          onopen: async () => {
            // Setup Capture AudioContext
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            captureStreamRef.current = stream;
            const captureCtx = new AudioContext({ sampleRate: 16000 });
            captureContextRef.current = captureCtx;
            
            const source = captureCtx.createMediaStreamSource(stream);
            const processor = captureCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
              }
              const buffer = pcm16.buffer;
              const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };

            source.connect(processor);
            processor.connect(captureCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const parts = message.serverContent?.modelTurn?.parts;
            const base64Audio = (parts && parts.length > 0) ? (parts[0] as any)?.inlineData?.data : undefined;
            if (base64Audio) {
              playAudioChunk(base64Audio as string);
            }
            if (message.serverContent?.interrupted) {
              if (audioContextRef.current) {
                nextPlayTimeRef.current = audioContextRef.current.currentTime;
              }
            }
          },
          onclose: () => {
            stopLiveSession();
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            stopLiveSession();
          }
        }
      });

      liveSessionRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to start Live API:", error);
      setIsLiveMode(false);
    }
  };

  const stopLiveSession = () => {
    setIsLiveMode(false);
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (captureStreamRef.current) {
      captureStreamRef.current.getTracks().forEach(track => track.stop());
      captureStreamRef.current = null;
    }
    if (captureContextRef.current) {
      captureContextRef.current.close();
      captureContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (liveSessionRef.current) {
      liveSessionRef.current.then((session: any) => session.close()).catch(console.error);
      liveSessionRef.current = null;
    }
  };

  // --- Standard Text Chat ---
  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const newUserMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, newUserMsg]);
    setInput("");
    setIsLoading(true);

    const predefinedResponses: Record<string, string> = {
      "請協助我進行：報告生成": `🌟 您好！我是您的萬能光球精靈 (Omni Genie)。很高興能協助您處理 ESG 報告生成任務！\n\n在 ESG GO v1.0 系統中，您可以透過以下步驟快速完成報告：\n\n**📝 報告生成三步驟 (3 Steps)：**\n* **數據確認 (Data Verification)**： 請先確保您的「碳盤查數據」、「能源使用紀錄」及「社會責任指標」已更新至最新狀態。\n* **選擇框架 (Select Framework)**： 進入系統的「報告管理」模組，選擇您欲遵循的國際標準（如：GRI 2021、SASB 或 TCFD）。\n* **自動合成 (Auto Synthesis)**： 點擊「一鍵生成初稿」。系統將根據您的歷史數據自動填入對應章節，並生成圖表。\n\n**💡 精靈的小提醒：**\n* **自定義編輯 (Custom Edit)**：生成初稿後，您可以針對特定章節進行手動調整。\n* **匯出格式 (Export Format)**：支持 PDF、Word 或網頁版（Interactive HTML）格式。\n\n需要我直接引導您跳轉至「報告管理」頁面，或是針對特定框架（如 GRI）提供建議嗎？ 請告訴我您的下一步指令！`,
      "生成永續報告書 (Sustainability Report)": `📝 **永續報告書 (Sustainability Report) 生成準備中...**\n\n我將根據您的企業數據與 GRI/SASB 準則為您草擬一份完整的永續報告書。這將包含：\n- 總裁致辭與永續願景\n- 重大性議題分析\n- 環境 (E)、社會 (S)、治理 (G) 績效指標\n\n請問您希望採用哪一個年度的數據進行生成？`,
      "生成碳足跡報告 (Carbon Footprint Report)": `🌍 **碳足跡報告 (Carbon Footprint Report) 生成準備中...**\n\n我將為您彙整 ISO 14064-1 範疇一、二、三的溫室氣體排放數據，並產出詳細的碳足跡報告。內容將涵蓋：\n- 總碳排放量與排放熱點分析\n- 各範疇排放源佔比\n- 減碳目標達成進度\n\n請問是否需要特別針對「供應鏈 (範疇三)」進行深度分析？`,
      "生成供應鏈透明度報告 (Supply Chain Transparency Report)": `🔗 **供應鏈透明度報告 (Supply Chain Transparency Report) 生成準備中...**\n\n我將為您統整供應商的 ESG 評鑑數據，產出供應鏈透明度報告。報告亮點包含：\n- 供應商碳排放與能源使用狀況\n- 勞工權益與人權風險評估\n- 綠色採購比例與在地採購成效\n\n請問您希望匯出為 PDF 還是互動式網頁格式？`,
      "請協助我進行：數據分析": `✨ 您好！我是 萬能光球精靈。很高興能為您提供專業的數據分析支援！\n\n在 ESG GO v1.0 系統中，我可以協助您針對以下維度進行深度分析：\n\n**📊 數據分析服務項目**\n* **碳排放量核算**：自動計算範疇一、二、三的碳足跡，並產出排放趨勢圖。\n* **能源使用效率 (EEI)**：分析電力、水資源及燃料的使用強度，找出節能熱點。\n* **減碳目標達成率**：比對基準年數據，評估目前與 Net Zero 目標的差距。\n* **供應鏈風險評估**：量化供應商的 ESG 表現數據，識別潛在風險。\n* **異常偵測**：自動識別數據中的異常偏差（例如突發的高耗能），並發出警示。\n\n**💡 如何開始？**\n請告訴我您目前的具體需求，例如：\n\n* 「請幫我分析本季與上季的總耗電量對比。」\n* 「請根據這份 Excel 數據計算碳排放強度。」\n* 「請預測明年若產能增加 10%，碳排放會如何變化？」\n\n請提供您的數據或描述分析目標，我將立即為您運算！ 🚀 ✨`,
      "請協助我進行：合規檢查": `您好！我是您的 ESG GO 萬能光球精靈！✨ 我已準備好協助您進行合規檢查。\n\n為了提供精確的分析，請選擇您目前需要檢查的範疇：\n\n**🔍 合規檢查清單**\n* **國際準則對標**：檢查報告是否符合 GRI、SASB 或 TCFD 框架。\n* **供應鏈法規**：針對 EUDR (歐盟反砍伐法) 或 供應商行為準則 進行審核。\n* **碳排申報合規**：檢查 ISO 14064-1 數據或 CBAM (碳邊境調整機制) 申報準備。\n* **國內法規**：檢查是否符合金管會最新的上市櫃公司永續發展路徑圖。\n\n**💡 您可以這樣做：**\n\n* **上傳文件**：請直接上傳您的永續報告書草稿或數據表格。\n* **指定法規**：輸入「檢查 CBAM 合規性」，我將為您列出必備清單。\n\n請告訴我您想從哪一項開始？`,
      "請協助我進行：系統優化": `您好！我是您的萬能光球精靈 ✨。很高興能協助您進行 ESG GO v1.0 的系統優化。\n\n為了提升系統效能並符合永續發展目標，我建議從以下三個維度進行優化：\n\n**1. 數據精確化 (Data Accuracy)**\n* **清理異常值**：自動識別並標記超出正常範圍的碳排或能源數據，確保 ESG 報告ের 真實性。\n* **自動化串接**：透過 API 整合範疇一至範疇三的數據源，減少人工輸入誤差。\n\n**2. 運作效能優化 (Performance)**\n* **綠色運算 (Green Computing)**：優化後端演算法，減少伺服器運算負擔，降低系統本身的數位碳足跡。\n* **快取機制**：針對頻繁讀取的永續指標頁面建立快取，縮短載入時間。\n\n**3. 使用者體驗 (User Experience)**\n* **視覺化儀表板**：優化數據圖表呈現，讓管理階層能更快速掌握減碳進度。\n* **預測提醒**：系統可根據歷史數據，自動優化排放預警門檻。\n\n請告訴我，您目前想優先針對哪個部分進行調整？ 例如：「我想加速報表生成速度」 或 「我想優化數據檢查邏輯」。我隨時準備好為您執行！加油！🚀`
    };

    if (text.includes("生成") && (text.includes("報告") || text.includes("Report"))) {
      setGlobalActiveTab("reports");
      setIsReportingWizardOpen(true);
      setReportingWizardStep(0);
      
      const response = `🌟 **已啟動「0 到 1 永續報告煉金引導」**！\n\n我已自動為您跳轉至 **永續報告中心 (SRC)** 並開啟了智能引導精靈。我們將一起完成以下五個關鍵階段：\n\n1.  **數據啟動**：對接內部 ERP 與產業基準資料庫。\n2.  **靈魂織稿**：您可以選擇 200/300/500 頁的規模與敘事路徑。\n3.  **基準審計**：由 Gemini Pro 進行同業 Top 5 差異分析對照。\n4.  **資產鎖定**：SHA-256 數位簽章存證。\n5.  **全域發布**：下載具備競爭力對照表的高保真 PDF。\n\n請點擊報告中心視窗內的 **「Trigger OmniAPI」** 開始數據啟動階段！`;
      
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response,
          },
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    if (text.includes("切換") && text.includes("模式")) {
      setAiProxyMode(!aiProxyMode);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: aiProxyMode 
              ? "已切換至 **手動模式**。您可以開始手動管理永續資產。" 
              : "已開啟 **自動模式**。系統將進入自主治理狀態。",
          },
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    if (predefinedResponses[text]) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: predefinedResponses[text],
          },
        ]);
        setIsLoading(false);
      }, 500);
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Gemini API Key");
      }

      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are the "萬能光球精靈" (Omnipotent Light Sphere Spirit), a helpful, fast, and intelligent assistant in the ESG GO v1.0 application.
      Respond to the user's queries in traditional Chinese (zh-TW).
      Keep your responses concise, friendly, and highly relevant to ESG, sustainability, or system tools. Use markdown for formatting.`;

      const responseStream = await withRetry(() => ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: text,
        config: { systemInstruction },
      }));

      // Add an empty assistant message to stream into
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
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
      console.error("Gemini API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，精靈目前遇到一些連線問題。請確認您的 API 金鑰設定，或稍後再試。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isSpiritOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            onClick={() => setIsSpiritOpen(false)}
          />

          {/* Spirit Animation & Workspace */}
          <motion.div
            initial={{ scale: 0.1, y: 300, rotate: 0 }}
            animate={{ scale: 1, y: 0, rotate: 360 }}
            exit={{ scale: 0.1, y: 300, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="relative w-[90%] max-w-md bg-white rounded-[24px] shadow-2xl overflow-hidden pointer-events-auto flex flex-col h-[80vh]"
          >
            <div className="p-6 bg-gradient-to-br from-[#009E9D] to-[#219EBC] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Omni Genie Assistant</h2>
                  <p className="text-xs text-white/80">萬能光球精靈 (Omni Genie)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-black/20 rounded-full p-1">
                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeTab === "chat" ? "bg-white text-[#009E9D]" : "text-white hover:bg-white/10"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeTab === "overview" ? "bg-white text-[#009E9D]" : "text-white hover:bg-white/10"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab("cards")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeTab === "cards" ? "bg-white text-[#009E9D]" : "text-white hover:bg-white/10"
                    }`}
                    title="永續卡牌與知識王挑戰"
                  >
                    <Gamepad2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab("integration")}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      activeTab === "integration" ? "bg-white text-[#009E9D]" : "text-white hover:bg-white/10"
                    }`}
                    title="深貫廣通整合矩陣"
                  >
                    <Network className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setIsSpiritOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {activeTab === "chat" ? (
              <>
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA] space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-slate-200 text-slate-600"
                        : "bg-gradient-to-br from-[#009E9D] to-[#219EBC] text-white"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <span className="font-bold text-xs">U</span>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] p-3 rounded-[12px] text-sm ${
                      msg.role === "user"
                        ? "bg-[#009E9D] text-white rounded-tr-none"
                        : "bg-white text-[#333333] rounded-tl-none shadow-sm"
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
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Toolbox */}
            <div className="p-4 bg-white border-t border-[#E5E7EB] pb-safe">
              <h3 className="text-xs font-bold text-[#999999] mb-3 uppercase tracking-wider">
                快速存取工具箱
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 mb-4 hide-scrollbar">
                {[
                  { icon: FileText, label: "報告生成 (Report)" },
                  { icon: Activity, label: "數據分析 (Analysis)" },
                  { icon: ShieldCheck, label: "合規檢查 (Audit)" },
                  { icon: Wrench, label: "系統優化 (Optimize)" },
                  { icon: Target, label: "目標追蹤 (Target)" },
                  { icon: Eye, label: "即時監控 (Monitor)" },
                  { icon: Zap, label: "AI 洞察 (Insight)" },
                  { icon: Library, label: "知識庫 (Library)" },
                ].map((tool, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(`請協助我進行：${tool.label.split(' ')[0]}`)}
                    disabled={isLoading || isLiveMode}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 min-w-[72px] rounded-xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition-all text-slate-600 disabled:opacity-50 flex-shrink-0"
                  >
                    <tool.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="text-[11px] font-medium whitespace-nowrap">{tool.label}</span>
                  </button>
                ))}
              </div>

              {/* Report Generation Prompts */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 hide-scrollbar">
                {[
                  "生成永續報告書 (SR)",
                  "生成碳足跡報告 (CFR)",
                  "生成供應鏈透明度報告 (SCTR)"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    disabled={isLoading || isLiveMode}
                    className="whitespace-nowrap px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center bg-[#F1F3F5] rounded-[12px] focus-within:ring-2 focus-within:ring-[#009E9D] transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                  disabled={isLoading || isLiveMode}
                  placeholder={isLiveMode ? "即時語音對話中..." : isRecording ? "正在聆聽..." : "輸入指令..."}
                  className="w-full bg-transparent border-none pl-4 pr-2 py-3 text-sm outline-none disabled:opacity-50"
                />
                <div className="flex items-center pr-2 gap-1">
                  {/* Live API Button */}
                  {isLiveMode ? (
                    <button
                      onClick={stopLiveSession}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-[8px] transition-colors animate-pulse"
                      title="停止即時對話"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={startLiveSession}
                      disabled={isLoading || isRecording}
                      className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-[8px] transition-colors disabled:opacity-50"
                      title="啟動即時語音對話"
                    >
                      <Radio className="w-4 h-4" />
                    </button>
                  )}

                  {/* Standard Transcription Recording Button */}
                  {!isLiveMode && (isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-[8px] transition-colors animate-pulse"
                      title="停止錄音"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      disabled={isLoading || isLiveMode}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-[8px] transition-colors disabled:opacity-50"
                      title="語音輸入"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  ))}

                  <button
                    onClick={() => handleSend(input)}
                    disabled={isLoading || (!input.trim() && !isRecording) || isLiveMode}
                    className="p-1.5 bg-[#009E9D] text-white rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#008A89] transition-colors"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            </>
            ) : activeTab === "overview" ? (
              <div className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA] flex flex-col gap-4">
                {/* 核心指標總覽 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-[16px] shadow-sm border border-[#E5E7EB] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                          <Activity className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">即時碳排</h3>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">-2.4%</span>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800">12.4</span>
                      <span className="text-xs text-slate-500 mb-1">tCO2e</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-[16px] shadow-sm border border-[#E5E7EB] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                          <Zap className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">能源效率</h3>
                      </div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">84%</span>
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-2xl font-black text-slate-800">A+</span>
                      <span className="text-xs text-slate-500 mb-1">評級</span>
                    </div>
                  </div>
                </div>

                {/* 趨勢圖表 */}
                <div className="bg-white p-4 rounded-[16px] shadow-sm border border-[#E5E7EB]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                        <LineChart className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">今日排放趨勢</h3>
                    </div>
                  </div>
                  <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#009E9D" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#009E9D" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Area type="monotone" dataKey="carbon" stroke="#009E9D" strokeWidth={2} fillOpacity={1} fill="url(#colorCarbon)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI 洞察與異常 */}
                <div className="bg-white p-4 rounded-[16px] shadow-sm border border-[#E5E7EB]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">系統守護狀態</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-amber-800 mb-0.5">偵測到異常能耗</p>
                        <p className="text-[11px] text-amber-700/80 leading-tight">B 廠區空調系統在非營業時間持續運轉，建議立即排查。</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-800 mb-0.5">API 串接正常</p>
                        <p className="text-[11px] text-emerald-700/80 leading-tight">ERP 與 IoT 感測器數據同步延遲小於 50ms。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "integration" ? (
              <div className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA] flex flex-col gap-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 rounded-[16px] shadow-lg text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />
                  <div className="flex items-center gap-3 mb-4 relative z-10">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                      <Network className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg tracking-wide">深貫廣通 矩陣</h3>
                      <p className="text-xs text-slate-400">系統全域整合狀態與模組連動</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded">已連線</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200">NCBDB 核心庫</p>
                      <p className="text-[10px] text-slate-400 mt-1">延遲: 12ms</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] bg-blue-400/20 text-blue-300 px-1.5 py-0.5 rounded">同步中</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200">全球法規 API</p>
                      <p className="text-[10px] text-slate-400 mt-1">GRI, SASB, CBAM</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] bg-purple-400/20 text-purple-300 px-1.5 py-0.5 rounded">運算中</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200">AI 預測引擎</p>
                      <p className="text-[10px] text-slate-400 mt-1">Gemini 3.1 Pro</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <Workflow className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">活躍</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200">ERP 數據流</p>
                      <p className="text-[10px] text-slate-400 mt-1">每 5 分鐘同步</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-[16px] shadow-sm border border-[#E5E7EB]">
                  <h3 className="font-bold text-slate-800 text-sm mb-3">跨模組協同任務</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">自動生成 Q3 報告</p>
                          <p className="text-[10px] text-slate-500">整合 ERP 數據與法規庫</p>
                        </div>
                      </div>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-[80%] h-full bg-indigo-500 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">供應商合規審查</p>
                          <p className="text-[10px] text-slate-500">比對 CBAM 最新標準</p>
                        </div>
                      </div>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="w-[30%] h-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "cards" ? (
              <div className="flex-1 overflow-y-auto p-4 bg-[#F8F9FA] flex flex-col gap-4">
                <div className="bg-gradient-to-br from-[#009E9D] to-[#219EBC] p-5 rounded-[12px] shadow-sm text-white relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-3 mb-2 relative z-10">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Library className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-balance">永續卡牌 知識庫</h3>
                      <p className="text-xs text-white/80 text-pretty">NCBDB 知識點收藏解鎖遊戲</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/90 mt-3 relative z-10 leading-relaxed text-pretty">
                    在平台中進行各項永續操作，即有機會從 NCBDB (用戶成長資料庫) 解鎖並獲得專屬的「永續卡牌」。收集卡牌以豐富您的知識庫！
                  </p>
                  <div className="mt-4 flex items-center justify-between bg-black/20 rounded-lg p-3 relative z-10">
                    <div className="flex flex-col">
                      <span className="text-xs text-white/70">已收集卡牌</span>
                      <span className="font-bold text-xl">12 / 108</span>
                    </div>
                    <button className="px-4 py-2 bg-white text-[#009E9D] rounded-full text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm">
                      查看我的卡牌
                    </button>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-[12px] shadow-sm border border-[#E5E7EB]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg text-balance">永續知識王挑戰</h3>
                      <p className="text-xs text-slate-500 text-pretty">六大模式等您來解鎖</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: "基礎概念模式", unlocked: true, desc: "ESG 核心名詞解析" },
                      { name: "GRI 準則模式", unlocked: true, desc: "GRI 2026 實務應用" },
                      { name: "碳盤查實戰模式", unlocked: false, desc: "ISO 14064-1 數據計算" },
                      { name: "CBAM 邊境模式", unlocked: false, desc: "歐盟碳關稅申報模擬" },
                      { name: "TCFD 氣候模式", unlocked: false, desc: "氣候變遷風險與機會" },
                      { name: "圓通無礙終極模式", unlocked: false, desc: "全方位永續治理綜合挑戰" },
                    ].map((mode, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-[8px] border ${
                          mode.unlocked 
                            ? "bg-slate-50 border-slate-200 hover:border-[#009E9D]/50 hover:shadow-sm cursor-pointer transition-all" 
                            : "bg-slate-50/50 border-slate-100 opacity-70 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            mode.unlocked ? "bg-[#009E9D]/10 text-[#009E9D]" : "bg-slate-200 text-slate-500"
                          }`}>
                            模式 {idx + 1}
                          </span>
                          {mode.unlocked ? (
                            <Unlock className="w-3.5 h-3.5 text-[#009E9D]" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <h4 className={`font-bold text-sm mb-1 ${mode.unlocked ? "text-slate-800" : "text-slate-500"}`}>
                          {mode.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {mode.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
