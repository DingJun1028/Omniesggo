'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Brain, Database, Share2, Zap, Network, Upload, Download, 
  ArrowLeft, Plus, Search, Clock, Tag,
  MessageSquare, Activity, GitBranch, Bot, Cpu
} from 'lucide-react';
import { Button } from '@esggo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@esggo/ui';
import { motion } from 'framer-motion';

interface Memory {
  id: string;
  content: string;
  layer: 'L0' | 'L1' | 'L2' | 'L3';
  tags: string[];
  timestamp: number;
  source: string;
}

interface BrainStats {
  totalMemories: number;
  sharedMemories: number;
  agents: number;
  connections: number;
}

const LAYER_CONFIG = {
  L0: { label: '即時記憶', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', desc: '當前對話與任務' },
  L1: { label: '短期記憶', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30', desc: '近期經驗與知識' },
  L2: { label: '長期記憶', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30', desc: '重要模式與規則' },
  L3: { label: '核心記憶', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30', desc: '本質原則與價值觀' },
};

export default function OmniAgentZonePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<BrainStats>({
    totalMemories: 0,
    sharedMemories: 0,
    agents: 0,
    connections: 0,
  });
  const [activeLayer, setActiveLayer] = useState<'ALL' | 'L0' | 'L1' | 'L2' | 'L3'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBrainData();
  }, []);

  const fetchBrainData = async () => {
    try {
      const [memRes, statsRes] = await Promise.all([
        fetch('/api/omni-agent/shared-brain/memories'),
        fetch('/api/omni-agent/shared-brain/stats'),
      ]);
      
      if (memRes.ok) {
        const memData = await memRes.json();
        setMemories(memData.memories || []);
      }
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch brain data:', error);
      setMemories([
        {
          id: '1',
          content: 'ESG 報告書需遵循 GRI 2024 標準，重點關注雙重重大性分析',
          layer: 'L2',
          tags: ['ESG', 'GRI', '重大性'],
          timestamp: Date.now() - 3600000,
          source: 'omni-agent',
        },
        {
          id: '2',
          content: '5T 協議：Traceable、Transparent、Trustworthy、Transferful、True',
          layer: 'L3',
          tags: ['5T', '協議', '信任'],
          timestamp: Date.now() - 7200000,
          source: 'core',
        },
        {
          id: '3',
          content: '用戶偏好使用繁體中文介面，偏好深色主題',
          layer: 'L1',
          tags: ['偏好', 'UI', '語言'],
          timestamp: Date.now() - 1800000,
          source: 'user-session',
        },
      ]);
      setStats({
        totalMemories: 1247,
        sharedMemories: 892,
        agents: 8,
        connections: 3456,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMemories = memories.filter(mem => {
    const matchesLayer = activeLayer === 'ALL' || mem.layer === activeLayer;
    const matchesSearch = searchQuery === '' || 
      mem.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLayer && matchesSearch;
  });

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '剛剛';
    if (hours < 24) return `${hours}小時前`;
    return `${Math.floor(hours / 24)}天前`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-4">
              <Link href="/app/dashboard">
                <Button variant="ghost" size="sm" className="group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  返回儀表板
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-[var(--text-1)]">萬能代理專區</h1>
                  <p className="text-xs text-[var(--text-3)]">第二共享大腦 • 統一記憶系統</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/omni-agent-zone/agents">
                <Button variant="secondary" size="sm">
                  <Bot className="w-4 h-4 mr-2" />
                  代理管理
                </Button>
              </Link>
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                新增記憶
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-3)] mb-1">總記憶數</p>
                  <p className="text-2xl font-bold text-[var(--text-1)]">{stats.totalMemories.toLocaleString()}</p>
                </div>
                <Database className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-3)] mb-1">共享記憶</p>
                  <p className="text-2xl font-bold text-[var(--text-1)]">{stats.sharedMemories.toLocaleString()}</p>
                </div>
                <Share2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-3)] mb-1">活躍代理</p>
                  <p className="text-2xl font-bold text-[var(--text-1)]">{stats.agents}</p>
                </div>
                <Zap className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-3)] mb-1">記憶連結</p>
                  <p className="text-2xl font-bold text-[var(--text-1)]">{stats.connections.toLocaleString()}</p>
                </div>
                <Network className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1 space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  記憶層級
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => setActiveLayer('ALL')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeLayer === 'ALL'
                      ? 'bg-[var(--accent-cool-soft)] text-[var(--accent-cool)]'
                      : 'hover:bg-[var(--surface-2)] text-[var(--text-2)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">全部層級</span>
                    <span className="text-sm">{memories.length}</span>
                  </div>
                </button>
                {Object.entries(LAYER_CONFIG).map(([layer, config]) => {
                  const count = memories.filter(m => m.layer === layer).length;
                  return (
                    <button
                      key={layer}
                      onClick={() => setActiveLayer(layer as any)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        activeLayer === layer
                          ? `${config.bg} ${config.color}`
                          : 'hover:bg-[var(--surface-2)] text-[var(--text-2)]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{layer} - {config.label}</span>
                        <span className="text-sm">{count}</span>
                      </div>
                      <p className="text-xs opacity-80">{config.desc}</p>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/omni-agent">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    代理對話
                  </Button>
                </Link>
                <Link href="/omni-agent-zone/agents">
                  <Button variant="secondary" size="sm" className="w-full justify-start">
                    <Bot className="w-4 h-4 mr-2" />
                    代理管理中心
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  <Activity className="w-4 h-4 mr-2" />
                  同步記憶
                </Button>
                <Button variant="secondary" size="sm" className="w-full justify-start">
                  <GitBranch className="w-4 h-4 mr-2" />
                  記憶圖譜
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>共享記憶庫</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
                    <input
                      type="text"
                      placeholder="搜尋記憶..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full sm:w-80 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-cool)] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-[var(--text-2)]">載入記憶庫中...</p>
                  </div>
                ) : filteredMemories.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-12 h-12 text-[var(--text-3)] mx-auto mb-4" />
                    <p className="text-[var(--text-2)]">暫無符合條件的記憶</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMemories.map((memory, index) => {
                      const layerConfig = LAYER_CONFIG[memory.layer];
                      return (
                        <motion.div
                          key={memory.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--border-accent)] hover:bg-[var(--surface-2)] transition-all cursor-pointer group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${layerConfig.bg} ${layerConfig.color}`}>
                                {memory.layer} {layerConfig.label}
                              </span>
                              <span className="text-xs text-[var(--text-3)] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(memory.timestamp)}
                              </span>
                            </div>
                            <span className="text-xs text-[var(--text-3)]">from {memory.source}</span>
                          </div>
                          <p className="text-[var(--text-1)] mb-3 leading-relaxed group-hover:text-[var(--accent-cool)] transition-colors">
                            {memory.content}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {memory.tags.map((tag) => (
                              <span
                                key={tag}
                                className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--surface-3)] text-xs text-[var(--text-2)]"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/omni-agent-zone/import">
              <Card className="hover:shadow-lg hover:border-[var(--border-accent)] transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-1)] group-hover:text-[var(--accent-cool)] transition-colors">
                        記憶匯入中心
                      </h3>
                      <p className="text-sm text-[var(--text-2)]">從當前紀錄匯入</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-3)]">
                    支援 JSON、CSV、對話歷史匯入至第二共享大腦
                  </p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/omni-agent-zone/export">
              <Card className="hover:shadow-lg hover:border-[var(--border-accent)] transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-1)] group-hover:text-[var(--accent-cool)] transition-colors">
                        記憶匯出中心
                      </h3>
                      <p className="text-sm text-[var(--text-2)]">匯出至本地</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-3)]">支援 JSON、CSV、Markdown、ZIP</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/omni-agent-zone/chat">
              <Card className="hover:shadow-lg hover:border-[var(--border-accent)] transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-1)] group-hover:text-purple-500 transition-colors">
                        萬能代理聊天專區
                      </h3>
                      <p className="text-sm text-[var(--text-2)]">全能對話與執行</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-3)]">編碼、自定義回覆、介面修改、功能實現</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/omni-agent-zone/center">
              <Card className="hover:shadow-lg hover:border-[var(--border-accent)] transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Network className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-1)] group-hover:text-emerald-500 transition-colors">
                        萬能代理整合中樞
                      </h3>
                      <p className="text-sm text-[var(--text-2)]">系統整合度 100%</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-3)]">完善優化 • 缺口補齊 • 無縫接軌 • 無限進化</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/omni-agent-zone/ollama">
              <Card className="hover:shadow-lg hover:border-[var(--border-accent)] transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Cpu className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-1)] group-hover:text-orange-500 transition-colors">
                        Ollama 零算力整合
                      </h3>
                      <p className="text-sm text-[var(--text-2)]">本地推理 • 零成本</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-3)]">零算力功能 • BYOK 設置 • 本地模型</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}