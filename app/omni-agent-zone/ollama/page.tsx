'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Cpu, Zap, Settings, CheckCircle2, Server, Key, RefreshCw, Activity } from 'lucide-react';
import { Button } from '@esggo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@esggo/ui';
import { motion } from 'framer-motion';
import { ZoneHeaderCore } from '../_components/zone-header-core';

export default function OllamaPage() {
  const [config, setConfig] = useState({
    endpoint: 'http://localhost:11434',
    enabled: true,
    zeroCost: true,
    byok: false,
    apiKey: '',
  });
  const [models] = useState([
    { name: 'llama3.2:latest', size: '2.0GB', modified: '2024-10-01' },
    { name: 'qwen2.5:latest', size: '4.7GB', modified: '2024-10-05' },
    { name: 'gemma2:latest', size: '5.4GB', modified: '2024-09-28' },
  ]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [stats] = useState({ requests: 1247, tokens: 456789, cost: 0 });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setConnected(true);
    } catch (error) {
      setConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <ZoneHeaderCore icon={<Cpu className="w-6 h-6 text-white" />} title="Ollama 零算力整合" subtitle="本地推理 • 零成本 • BYOK 支援" iconBg="from-orange-500 to-red-500" />
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <Zap className="w-3 h-3" />零算力模式
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />Ollama 設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--accent-cool-soft)] border border-[var(--border-accent)]">
                    <div className="flex items-center gap-3">
                      <Zap className="w-6 h-6 text-[var(--accent-cool)]" />
                      <div>
                        <p className="font-medium text-[var(--text-1)]">零算力功能</p>
                        <p className="text-sm text-[var(--text-2)]">使用本地 Ollama 模型，完全零成本</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={config.zeroCost} onChange={(e) => setConfig(prev => ({ ...prev, zeroCost: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--accent-cool-soft)] rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--accent-cool)]"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-1)] mb-2 flex items-center gap-2"><Server className="w-4 h-4" />Ollama 端點</label>
                    <input type="url" value={config.endpoint} onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]" />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <Key className="w-6 h-6 text-purple-500" />
                      <div>
                        <p className="font-medium text-[var(--text-1)]">BYOK（Bring Your Own Key）</p>
                        <p className="text-sm text-[var(--text-2)]">使用自有 API 金鑰連接遠端 Ollama</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={config.byok} onChange={(e) => setConfig(prev => ({ ...prev, byok: e.target.checked }))} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                  {config.byok && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-1)] mb-2">API 金鑰</label>
                      <input type="password" value={config.apiKey} onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))} placeholder="輸入您的 Ollama API 金鑰" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  )}
                  <Button variant="primary" size="lg" onClick={handleConnect} disabled={isConnecting} className="w-full group">
                    {isConnecting ? '連接中...' : connected ? '重新連接' : '連接 Ollama'}
                    {!isConnecting && !connected && <RefreshCw className="w-5 h-5 ml-2 group-hover:rotate-180 transition-transform" />}
                    {connected && <CheckCircle2 className="w-5 h-5 ml-2" />}
                  </Button>
                  {connected && (
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">Ollama 連接成功！零算力模式已啟用</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle>可用模型</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {models.map((model) => (
                      <div key={model.name} className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)] hover:border-[var(--border-accent)] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-1)]">{model.name}</p>
                            <p className="text-sm text-[var(--text-2)]">{model.size} • {model.modified}</p>
                          </div>
                        </div>
                        <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 text-xs">
                          <CheckCircle2 className="w-3 h-3" />可用
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />使用統計</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                  <p className="text-3xl font-bold text-emerald-500">${stats.cost.toFixed(2)}</p>
                  <p className="text-sm text-[var(--text-2)]">總成本（零算力）</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-[var(--text-2)]">請求次數</span><span className="font-semibold text-[var(--text-1)]">{stats.requests.toLocaleString()}</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--text-2)]">Token 數</span><span className="font-semibold text-[var(--text-1)]">{stats.tokens.toLocaleString()}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>功能說明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[var(--text-2)]">
                <div className="flex items-start gap-2"><Zap className="w-4 h-4 text-[var(--accent-cool)] mt-0.5 flex-shrink-0" /><p><strong className="text-[var(--text-1)]">零算力模式：</strong>使用本地 Ollama 運行模型，無需 API 費用</p></div>
                <div className="flex items-start gap-2"><Key className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" /><p><strong className="text-[var(--text-1)]">BYOK 支援：</strong>可使用自有金鑰連接遠端 Ollama 服務</p></div>
                <div className="flex items-start gap-2"><Cpu className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" /><p><strong className="text-[var(--text-1)]">本地推理：</strong>資料不離開本地，保護隱私</p></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

            <Link href="/omni-agent-zone/ollama-selfhost" className="block mt-4">
              <Button variant="secondary" className="w-full group">
                <Cloud className="w-4 h-4 mr-2" />
                自託管雲端零算力配置
                <Settings className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform" />
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
