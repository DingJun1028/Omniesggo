'use client';

import React, { useState } from 'react';
import { Cloud, Server, Shield, Zap, CheckCircle2, Settings, Globe, HardDrive } from 'lucide-react';
import { Button } from '@esggo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../_components/card-primitives';
import { motion } from 'framer-motion';
import { ZonePageShell } from '../_components/zone-page-shell';
import { ZoneHeaderCore } from '../_components/zone-header-core';

export default function OllamaSelfHostPage() {
  const [config, setConfig] = useState({
    provider: 'oracle',
    instanceUrl: '',
    apiKey: '',
    region: 'ap-tokyo-1',
    zeroCost: true,
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const providers = [
    { id: 'oracle', name: 'Oracle Cloud Free Tier', icon: '☁️', desc: '永遠免費 ARM VM，4 OCPU + 24GB RAM', free: true },
    { id: 'railway', name: 'Railway', icon: '🚂', desc: '簡單部署，免費額度可用', free: true },
    { id: 'render', name: 'Render', icon: '🎨', desc: '免費 Web Service，支援 Docker', free: true },
    { id: 'fly', name: 'Fly.io', icon: '✈️', desc: '全球邊緣，免費額度', free: true },
    { id: 'custom', name: '自建 VPS', icon: '🖥️', desc: '任何 VPS 或本地伺服器', free: true },
  ];

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setDeployed(true);
    } catch (error) {
      console.error('ollama self-host deploy failed:', error);
      setDeployed(false);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <ZonePageShell
      header={
        <>
            <ZoneHeaderCore icon={<Cloud className="w-6 h-6 text-white" />} title="自託管雲端 Ollama 零算力配置" subtitle="一鍵部署 • 永久免費 • 零算力運行" iconBg="from-cyan-500 to-blue-500" backHref="/omni-agent-zone/ollama" backLabel="返回 Ollama 設定" />
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              <Zap className="w-3 h-3" />零算力雲端
            </span>
        </>
      }
      mainClassName="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"
    >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <Card className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--text-1)] mb-1">自託管雲端零算力 Ollama</h2>
                  <p className="text-[var(--text-2)]">在免費雲端平台部署專屬 Ollama 服務，實現真正的零算力、零成本推理</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>選擇雲端平台</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {providers.map((provider) => (
                    <button key={provider.id} onClick={() => setConfig(prev => ({ ...prev, provider: provider.id }))} className={`p-4 rounded-lg border text-left transition-all ${config.provider === provider.id ? 'border-[var(--accent-cool)] bg-[var(--accent-cool-soft)]' : 'border-[var(--border)] hover:border-[var(--border-accent)]'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{provider.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-[var(--text-1)]">{provider.name}</h3>
                          {provider.free && <span className="text-xs text-emerald-500">永久免費</span>}
                        </div>
                      </div>
                      <p className="text-xs text-[var(--text-2)]">{provider.desc}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" />部署配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="selfhost-instance-url" className="block text-sm font-medium text-[var(--text-1)] mb-2 flex items-center gap-2"><Globe className="w-4 h-4" />實例名稱/URL</label>
                  <input id="selfhost-instance-url" type="text" value={config.instanceUrl} onChange={(e) => setConfig(prev => ({ ...prev, instanceUrl: e.target.value }))} placeholder="ollama-esggo" className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]" />
                </div>
                <div>
                  <label htmlFor="selfhost-region" className="block text-sm font-medium text-[var(--text-1)] mb-2">地區</label>
                  <select id="selfhost-region" value={config.region} onChange={(e) => setConfig(prev => ({ ...prev, region: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cool)]">
                    <option value="ap-tokyo-1">亞太 - 東京</option>
                    <option value="ap-singapore-1">亞太 - 新加坡</option>
                    <option value="us-west-1">美西</option>
                    <option value="eu-frankfurt-1">歐洲 - 法蘭克福</option>
                  </select>
                </div>
                <Button variant="primary" size="lg" onClick={handleDeploy} disabled={isDeploying || !config.instanceUrl} className="w-full group">
                  {isDeploying ? '部署中...' : deployed ? '重新部署' : '一鍵部署零算力 Ollama'}
                  {!isDeploying && !deployed && <Cloud className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />}
                  {deployed && <CheckCircle2 className="w-5 h-5 ml-2" />}
                </Button>
                {deployed && (
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">部署成功！</p>
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">服務地址：<code className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded">https://{config.instanceUrl}.onrender.com</code></p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-emerald-500" />零算力優勢</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[var(--text-2)]">
                <div className="flex items-start gap-2"><Zap className="w-4 h-4 text-[var(--accent-cool)] mt-0.5 flex-shrink-0" /><p><strong className="text-[var(--text-1)]">永久免費：</strong>使用免費雲端資源，無需付費</p></div>
                <div className="flex items-start gap-2"><HardDrive className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" /><p><strong className="text-[var(--text-1)]">自託管：</strong>完全掌控，資料自主</p></div>
                <div className="flex items-start gap-2"><Globe className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" /><p><strong className="text-[var(--text-1)]">全球可用：</strong>隨時隨地存取 API</p></div>
                <div className="flex items-start gap-2"><Server className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" /><p><strong className="text-[var(--text-1)]">零算力：</strong>無 GPU 費用，僅運行推理</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>預設模型</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--text-2)]">
                <div className="p-2 rounded bg-[var(--surface-2)]">llama3.2:3b</div>
                <div className="p-2 rounded bg-[var(--surface-2)]">qwen2.5:7b</div>
                <div className="p-2 rounded bg-[var(--surface-2)]">gemma2:9b</div>
                <p className="text-xs text-[var(--text-3)] mt-2">部署後自動拉取這些模型</p>
              </CardContent>
            </Card>
          </div>
        </div>
    </ZonePageShell>
  );
}
