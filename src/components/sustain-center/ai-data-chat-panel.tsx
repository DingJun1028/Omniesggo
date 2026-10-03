'use client';

import React, { useState } from 'react';
import { Bot, Send, Sparkles, ShieldCheck, Hash, Cpu, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  hashLock?: string;
  engine?: string;
}

export function AIDataChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: '你好！我是 ESG GO 本地零算力 AI 數據分析助手 (Ollama Engine)。你可以輸入任何關於溫室氣體碳試算、台電 2024 排放係數或 5T 確信的疑問！',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engine: 'Ollama Local AI (Zero-Cloud-Cost)',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickQueries = [
    '範疇二電力碳排如何有效優化？',
    '台電 2024 最新係數 0.494 對企業的影響？',
    '如何進行 ISO 14064-1 5T 雜湊封印驗證？',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/local-ai/data-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          contextData: {
            standard: 'ISO 14064-1:2018',
            taipowerFactor2024: 0.494,
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const json = await res.json();

      if (json.success) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: json.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          hashLock: json.hashLock,
          engine: json.aiEngine,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(json.error || 'AI 回應失敗');
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ 分析過程發生錯誤: ${(err as Error).message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.08)] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
              Ollama 零算力 AI 數據對話介面 (AI Data Query)
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                100% De-Google Local
              </span>
            </h3>
            <p className="text-slate-400 text-xs font-mono">
              採用本地 Ollama 先進語言模組，資料 100% 不離開本機與 VPS 伺服器
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" /> Ollama Active
        </span>
      </div>

      {/* Quick query tags */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        <span className="text-slate-500 self-center text-[11px]">快捷分析：</span>
        {quickQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-purple-500/40 hover:text-purple-300 transition-all text-left text-[11px]"
          >
            💡 {q}
          </button>
        ))}
      </div>

      {/* Message Chat Window */}
      <div className="h-64 overflow-y-auto space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 rounded-tr-none'
                  : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none space-y-2'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {msg.hashLock && (
                <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" /> Engine: {msg.engine}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500">
                    <Hash className="w-3 h-3 text-cyan-400" /> Hash Lock: {msg.hashLock.substring(0, 24)}...
                  </div>
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-purple-400 font-mono p-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Ollama 本地 AI 正在分析數據中...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="輸入關於碳排數據、ISO 合規或 5T 確信的問題..."
          disabled={loading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:outline-none font-mono"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          發送
        </button>
      </div>
    </div>
  );
}
