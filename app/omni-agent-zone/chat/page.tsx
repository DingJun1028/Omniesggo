'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, Send, Bot, User, Code, Sparkles, 
  Settings, Plus, Mic, Paperclip, Zap, Brain
} from 'lucide-react';
import { Button } from '@esggo/ui';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  type?: 'text' | 'code' | 'thought';
}

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'busy';
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是萬能代理，具備編碼、自定義回覆、介面修改等完整能力。你想要我做什麼？',
      timestamp: Date.now(),
      type: 'text',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent>({
    id: 'omni-core',
    name: 'OmniAgent Core',
    type: 'omni',
    status: 'online',
  });
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'omni-core', name: 'OmniAgent Core', type: 'omni', status: 'online' },
    { id: 'hermes-30', name: 'Hermes 30', type: 'hermes', status: 'online' },
    { id: 'jules', name: 'Jules AI', type: 'jules', status: 'online' },
  ]);
  const [mode, setMode] = useState<'chat' | 'code' | 'custom'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      type: 'text',
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    try {
      const res = await fetch('/api/omni-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          agentId: selectedAgent.id,
          mode,
          history: messages.slice(-10),
        }),
      });
      const data = await res.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || '處理中...',
        timestamp: Date.now(),
        type: data.type || 'text',
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，發生錯誤。請稍後再試。',
        timestamp: Date.now(),
        type: 'text',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/omni-agent-zone">
                <Button variant="ghost" size="sm" className="group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  返回專區
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[var(--text-1)]">萬能代理聊天專區</h1>
                  <p className="text-xs text-[var(--text-3)]">編碼 • 自定義回覆 • 介面修改 • 全能執行</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedAgent.id}
                onChange={(e) => {
                  const agent = agents.find(a => a.id === e.target.value);
                  if (agent) setSelectedAgent(agent);
                }}
                className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] text-sm"
              >
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.status === 'online' ? '在線' : '忙碌'})
                  </option>
                ))}
              </select>
              <Link href="/omni-agent-zone/agents">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-[var(--border)] bg-[var(--surface-1)]/50 hidden lg:flex flex-col">
          <div className="p-4 border-b border-[var(--border)]">
            <Button variant="primary" size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              新對話
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-3)] mb-2 uppercase tracking-wider">模式</h3>
              <div className="space-y-1">
                <button onClick={() => setMode('chat')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'chat' ? 'bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'}`}>
                  <Sparkles className="w-4 h-4 inline mr-2" />一般對話
                </button>
                <button onClick={() => setMode('code')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'code' ? 'bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'}`}>
                  <Code className="w-4 h-4 inline mr-2" />編碼模式
                </button>
                <button onClick={() => setMode('custom')} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'custom' ? 'bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]' : 'text-[var(--text-2)] hover:bg-[var(--surface-2)]'}`}>
                  <Zap className="w-4 h-4 inline mr-2" />自定義模式
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[var(--text-3)] mb-2 uppercase tracking-wider">能力</h3>
              <div className="space-y-1 text-xs text-[var(--text-2)]">
                <div className="px-3 py-1">• 全能編碼</div>
                <div className="px-3 py-1">• 介面修改</div>
                <div className="px-3 py-1">• 自定義回覆</div>
                <div className="px-3 py-1">• 功能實現</div>
                <div className="px-3 py-1">• 檔案操作</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 max-w-4xl mx-auto ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.role === 'assistant' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-[var(--accent-cool)] to-emerald-400'}`}>
                  {message.role === 'assistant' ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                </div>
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${message.role === 'user' ? 'bg-[var(--accent-cool)] text-white rounded-tr-sm' : 'bg-[var(--surface-1)] border border-[var(--border)] text-[var(--text-1)] rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  </div>
                  <p className="text-xs text-[var(--text-3)] mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex gap-4 max-w-4xl mx-auto">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl rounded-tl-sm p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--text-3)] animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--text-3)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--text-3)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--surface-1)]/95 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" className="flex-shrink-0"><Paperclip className="w-5 h-5" /></Button>
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`使用 ${mode === 'code' ? '編碼模式' : mode === 'custom' ? '自定義模式' : '一般模式'} 與萬能代理對話...`}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent max-h-32"
                    rows={1}
                    style={{ minHeight: '48px' }}
                  />
                  <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2"><Mic className="w-5 h-5" /></Button>
                </div>
                <Button variant="primary" size="sm" onClick={handleSend} disabled={!input.trim() || isTyping} className="flex-shrink-0 px-6">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-[var(--text-3)] mt-2 text-center">萬能代理擁有完整能力：編碼、自定義回覆、介面修改、功能實現</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
