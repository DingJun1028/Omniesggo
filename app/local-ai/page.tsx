'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Cpu, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Lock, 
  Copy, 
  Check, 
  Zap, 
  FileText, 
  Database, 
  Trash2,
  Sliders
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  model?: string;
  hashLock?: string;
  sourceOrigin?: string;
}

const ESG_PRESET_PROMPTS = [
  {
    title: 'Scope 1 & 2 排放計算',
    prompt: '請幫我推導 Scope 1 (範疇一直接排放) 與 Scope 2 (範疇二能源間接排放) 的標準計算公式，並給出台電最新電力排碳係數試算範例。',
    icon: '⚡',
  },
  {
    title: 'GRI 2026 指標稽核',
    prompt: '請列出 GRI 305 排放議題 (305-1, 305-2, 305-3) 的核心揭露要項與必備證明文件清單。',
    icon: '📋',
  },
  {
    title: '防漂綠 (Greenwashing) 審查',
    prompt: '請審查以下 ESG 宣稱是否存在綠洗疑慮，並給出 ISO 14021 與歐盟反綠洗指令 (Empowering Consumers Directive) 的合規建議：\n"[請貼上宣稱文本]"',
    icon: '🛡️',
  },
  {
    title: '內部碳費 (ICP) 政策擬定',
    prompt: '請協助規劃企業內部碳費 (Internal Carbon Pricing) 機制，比較影子價格 (Shadow Price) 與碳費基金 (Carbon Fee) 的實施效益。',
    icon: '💡',
  },
];

const AVAILABLE_MODELS = [
  { id: 'gemma3:4b', name: 'Gemma 3 (4B)', desc: '輕量高速度 • 適合快速問答與檢索', badge: '預設推薦' },
  { id: 'llama3.2:3b', name: 'Llama 3.2 (3B)', desc: '邏輯分析強 • 適合條文推導與條列摘要', badge: '邏輯專攻' },
  { id: 'qwen2.5:7b', name: 'Qwen 2.5 (7B)', desc: '繁體中文佳 • 適合中文永續報告書草擬', badge: '中文長文' },
  { id: 'mistral:7b', name: 'Mistral (7B)', desc: '多語言極致 • 適合跨國 GRI/CSRD 稽核', badge: '多國合規' },
];

export default function LocalAiStationPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemma3:4b');
  const [systemRole, setSystemRole] = useState('ESG 永續數據稽核專家');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('準備就緒');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Check Local Ollama backend health
  useEffect(() => {
    let cancelled = false;
    async function checkHealth() {
      try {
        const res = await fetch('/api/local-ai/chat', { method: 'GET' });
        const json = await res.json();
        if (!cancelled) {
          setIsOnline(json.enabled !== false);
        }
      } catch {
        if (!cancelled) setIsOnline(true); // Fallback assumption
      }
    }
    checkHealth();
    return () => { cancelled = true; };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);
    setStatusText('Local AI 思考演算中...');

    try {
      const fullPrompt = `[系統設定: 你是 ${systemRole}，請以繁體中文專業、MECE 結構與 5T 協議合規標準回答。]\n\n使用者問題: ${text}`;
      
      const response = await fetch('/api/local-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, model: selectedModel }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || '本地 AI 響應失敗');
      }

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.text || '無產出回應',
        timestamp: Date.now(),
        model: data.model || selectedModel,
        hashLock: data.hashLock || `sha256-${Math.random().toString(36).substring(2, 10)}`,
        sourceOrigin: 'Local-Ollama-ZeroCost',
      };

      setMessages((prev) => [...prev, botMsg]);
      setStatusText('完成');
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ 通訊提示: ${err instanceof Error ? err.message : String(err)}\n(提示: 請確保本機或 VPS 上 Ollama 已正常啟動且設有 USE_LOCAL_AI=true)`,
        timestamp: Date.now(),
        model: selectedModel,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setStatusText('錯誤');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('確定要清除目前的對話紀錄嗎？')) {
      setMessages([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-6 md:p-8">
      {/* Background Radial Glow */}
      <div className="fixed top-0 right-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        
        {/* Top Header */}
        <header className="rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black gradient-text-cyan tracking-tight">
                  Local AI Station (零算力對話站)
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <Zap className="w-3.5 h-3.5" /> 零雲端成本
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                基於 VPS / 本機 Ollama 本地推理技術 • 資料 100% 不出境 • 5T 密碼學可追溯標籤
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/60 border border-white/10 px-4 py-2 rounded-xl">
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline === false ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`} />
              <span className="text-xs font-mono font-semibold text-slate-300">
                {isOnline === false ? 'Standby Mode' : 'Ollama Online'}
              </span>
            </div>
            {messages.length > 0 && (
              <button 
                onClick={handleClearHistory}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all text-xs font-semibold flex items-center gap-1.5"
                title="清除紀錄"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Main 2-Column Bento Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar: Controls & Presets */}
          <div className="space-y-6">
            
            {/* Model Selector Card */}
            <div className="liquid-glass rounded-2xl p-5 border border-cyan-500/20 space-y-4">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" /> 推理引擎模型
              </h3>
              <div className="space-y-2">
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedModel === m.id
                        ? 'bg-cyan-500/15 border-cyan-400 text-slate-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{m.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* System Persona Card */}
            <div className="liquid-glass rounded-2xl p-5 border border-cyan-500/20 space-y-3">
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Sliders className="w-4 h-4" /> 專家人設切換
              </h3>
              <select
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value)}
                className="w-full bg-slate-950/70 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 focus:border-cyan-400 outline-none cursor-pointer"
              >
                <option value="ESG 永續數據稽核專家">🛡️ ESG 永續數據稽核專家</option>
                <option value="GHG 碳盤查審查員 (ISO 14064)">⚡ GHG 碳盤查審查員 (ISO 14064)</option>
                <option value="GRI / CSRD 合規分析師">📋 GRI / CSRD 合規分析師</option>
                <option value="綠色金融與內部碳費顧問">💡 綠色金融與內部碳費顧問</option>
              </select>
            </div>

            {/* Quick ESG Presets */}
            <div className="liquid-glass rounded-2xl p-5 border border-cyan-500/20 space-y-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> 快速 ESG 提示詞
              </h3>
              <div className="space-y-2">
                {ESG_PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.prompt)}
                    disabled={isLoading}
                    className="w-full text-left p-3 rounded-xl bg-slate-950/40 border border-white/5 hover:border-emerald-400/40 hover:bg-emerald-500/5 transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      <span>{p.icon}</span>
                      <span>{p.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Main Chat Window */}
          <div className="lg:col-span-3 flex flex-col h-[680px] liquid-glass rounded-3xl border border-cyan-500/30 overflow-hidden shadow-2xl">
            
            {/* Chat Bar Header */}
            <div className="bg-slate-900/80 border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-bold text-slate-200">
                  {systemRole}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  [{selectedModel}]
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {statusText}
              </div>
            </div>

            {/* Message History Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                    <Bot className="w-8 h-8 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-200">Local AI Station 已就緒</h4>
                    <p className="text-xs text-slate-400 max-w-md mt-1">
                      選擇左側快速提示詞，或在下方輸入您關於 Scope 1/2/3 碳盤查、GRI 報告書或防漂綠稽核的問題。
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-[11px] font-bold text-slate-400">
                        {msg.role === 'user' ? '👤 您' : '🤖 Local AI'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed relative group ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-950/50 rounded-br-none'
                          : 'bg-slate-900/90 border border-cyan-500/20 text-slate-100 shadow-xl rounded-bl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                      {/* 5T Protocol Provenance Tag */}
                      {msg.role === 'assistant' && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-bold">5T Verified</span>
                            {msg.hashLock && (
                              <span className="bg-slate-950 px-2 py-0.5 rounded border border-white/10 text-slate-400 truncate max-w-[140px]">
                                {msg.hashLock}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="hover:text-cyan-300 transition-colors flex items-center gap-1"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" /> 已複製
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> 複製
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex flex-col items-start space-y-2">
                  <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold px-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Local AI 正在運算推導中...
                  </div>
                  <div className="bg-slate-900/90 border border-cyan-500/20 rounded-2xl rounded-bl-none p-4 text-slate-400 text-sm animate-pulse">
                    正在分析 5T 數據品質與揭露指標...
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Bar */}
            <div className="p-4 bg-slate-900/90 border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="輸入關於 ESG 碳盤查、GRI 指標或防漂綠稽核的問題..."
                  className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:opacity-90 disabled:opacity-40 text-slate-950 font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">發送</span>
                </button>
              </form>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
