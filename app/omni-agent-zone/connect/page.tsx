'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plug, Key, Server, CheckCircle2, AlertCircle, Zap, Bot } from 'lucide-react';
import { Button } from '@esggo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../_components/card-primitives';
import { motion } from 'framer-motion';
import { ZonePageShell } from '../_components/zone-page-shell';
import { ZoneHeaderCore } from '../_components/zone-header-core';

interface AgentConfig {
  name: string;
  type: string;
  endpoint: string;
  apiKey: string;
  enabled: boolean;
}

const PRESET_AGENTS = [
  { type: 'hermes', name: 'Hermes', icon: '🐝', description: 'Hermes 30 萬能蜂群' },
  { type: 'jules', name: 'Jules AI', icon: '🤖', description: 'Google Jules 助理' },
  { type: 'claude', name: 'Claude', icon: '🧠', description: 'Anthropic Claude' },
  { type: 'openai', name: 'OpenAI', icon: '⚡', description: 'OpenAI GPT 系列' },
  { type: 'custom', name: '自定義代理', icon: '🔧', description: '自建或其他代理' },
];

export default function ConnectPage() {
  const [selectedType, setSelectedType] = useState('hermes');
  const [config, setConfig] = useState<AgentConfig>({
    name: '',
    type: 'hermes',
    endpoint: '',
    apiKey: '',
    enabled: true,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const handleTypeSelect = (type: string, preset: any) => {
    setSelectedType(type);
    setConfig(prev => ({
      ...prev,
      type,
      name: preset.name,
      endpoint: type === 'hermes' ? 'https://api.hermes-agent.io/v1' : 
                type === 'jules' ? 'https://jules.googleapis.com/v1' : 
                type === 'claude' ? 'https://api.anthropic.com/v1' :
                type === 'openai' ? 'https://api.openai.com/v1' : ''
    }));
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    setConnected(false);
    try {
      const res = await fetch('/api/omni-agent/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnected(true);
      } else {
        setError(data.error || '連接失敗');
      }
    } catch (err) {
      setError('網路錯誤：' + (err as Error).message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <ZonePageShell
      header={
        <>
            <ZoneHeaderCore icon={<Plug className="w-6 h-6 text-white" />} title="代理 API 接入" subtitle="透過伺服器 API 輕鬆連接代理" iconBg="from-cyan-500 to-blue-500" backHref="/omni-agent-zone/agents" backLabel="返回代理管理" />
        </>
      }
      mainClassName="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8"
    >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>選擇代理種類</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {PRESET_AGENTS.map((preset) => (
                  <button
                    key={preset.type}
                    onClick={() => handleTypeSelect(preset.type, preset)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedType === preset.type ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{preset.icon}</span>
                      <h3 className="font-medium text-[var(--text-1)]">{preset.name}</h3>
                    </div>
                    <p className="text-xs text-[var(--text-2)]">{preset.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" />API 設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="connect-agent-name" className="block text-sm font-medium text-[var(--text-1)] mb-2">代理名稱</label>
                <input id="connect-agent-name" type="text" value={config.name} onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))} placeholder="輸入自定義名稱" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="connect-endpoint" className="block text-sm font-medium text-[var(--text-1)] mb-2 flex items-center gap-2"><Server className="w-4 h-4" />API 端點 URL</label>
                <input id="connect-endpoint" type="url" value={config.endpoint} onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))} placeholder="https://api.example.com/v1" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent" />
              </div>
              <div>
                <label htmlFor="connect-api-key" className="block text-sm font-medium text-[var(--text-1)] mb-2 flex items-center gap-2"><Key className="w-4 h-4" />API 金鑰</label>
                <input id="connect-api-key" type="password" value={config.apiKey} onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))} placeholder="sk-... 或輸入代理 API 金鑰" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)] focus:border-transparent" />
                <p className="text-xs text-[var(--text-3)] mt-1">API 金鑰將安全儲存在伺服器端，僅用於與該代理通訊</p>
              </div>
              {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
              {connected && (
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">連接成功！</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">代理已匯入至萬能代理專區，可開始使用</p>
                  </div>
                </div>
              )}
              <Button variant="primary" size="lg" onClick={handleConnect} disabled={isConnecting || !config.name || !config.endpoint || !config.apiKey} className="w-full group">
                {isConnecting ? '連接中...' : connected ? '重新連接' : '連接並匯入代理'}
                {!isConnecting && !connected && <Plug className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />}
              </Button>
            </CardContent>
          </Card>

          {connected && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex gap-3">
                <Link href="/omni-agent-zone/agents" className="flex-1">
                  <Button variant="primary" className="w-full"><Bot className="w-4 h-4 mr-2" />前往代理管理中心</Button>
                </Link>
                <Link href="/omni-agent-zone" className="flex-1">
                  <Button variant="secondary" className="w-full"><Zap className="w-4 h-4 mr-2" />返回萬能代理專區</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
    </ZonePageShell>
  );
}
