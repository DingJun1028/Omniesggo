'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Brain, Network, Zap, Activity, GitBranch, Sparkles, RefreshCw, CheckCircle2, TrendingUp, Cpu, Database, Users } from 'lucide-react';
import { Button } from '@esggo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../_components/card-primitives';
import { motion } from 'framer-motion';
import { ZonePageShell } from '../_components/zone-page-shell';
import { ZoneHeaderCore } from '../_components/zone-header-core';

export default function OmniCenterPage() {
  const [status, setStatus] = useState({
    memory: { total: 1247, shared: 892, growth: 12.5 },
    agents: { active: 8, total: 12, online: 8 },
    connections: { active: 3456, sync: 98.5 },
    evolution: { level: 15, xp: 8750, nextXp: 10000 },
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const capabilities = [
    { name: '萬能記憶整合', status: 'complete', desc: 'L0-L3 四層記憶系統完整整合' },
    { name: '跨代理協作', status: 'complete', desc: 'Hermes、Jules 等代理無縫接軌' },
    { name: 'API 接入系統', status: 'complete', desc: '伺服器 API 輕鬆匯入代理' },
    { name: '記憶匯入匯出', status: 'complete', desc: '完整的記憶管理流程' },
    { name: '萬能聊天專區', status: 'complete', desc: '編碼、介面修改、全能執行' },
    { name: '自我成長機制', status: 'active', desc: '持續學習與進化中' },
    { name: '無限進化引擎', status: 'active', desc: '自動優化與能力擴展' },
    { name: '系統整合度', status: 'complete', desc: '缺口補齊，無縫接軌' },
  ];

  return (
    <ZonePageShell
      header={
        <>
            <ZoneHeaderCore icon={<Network className="w-6 h-6 text-white" />} title="萬能代理整合中樞" subtitle="完善優化 • 缺口補齊 • 乘上啟下 • 無縫接軌" iconBg="from-emerald-500 to-cyan-500" />
            <Button variant="primary" size="sm" onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? '同步中...' : '全域同步'}
            </Button>
        </>
      }
      mainClassName="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"
    >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-1)] mb-1">系統整合度：100%</h2>
                    <p className="text-[var(--text-2)]">撥亂反正 • 觸類旁通 • 同體一心 • 融會貫通 • 自我成長 • 無限進化</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[var(--text-3)] mb-1">進化等級</p>
                  <p className="text-2xl font-bold text-emerald-500">Lv.{status.evolution.level}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-2)]">經驗值</span>
                  <span className="text-sm text-[var(--text-2)]">{status.evolution.xp} / {status.evolution.nextXp}</span>
                </div>
                <div className="w-full h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${(status.evolution.xp / status.evolution.nextXp) * 100}%` }} />
                </div>
              </div>
              {isSyncing && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--text-2)]">全域同步進度</span>
                    <span className="text-sm text-[var(--text-2)]">{syncProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface-3)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all" style={{ width: `${syncProgress}%` }} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Database className="w-8 h-8 text-blue-500" />
                <span className="text-xs text-emerald-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" />+{status.memory.growth}%</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-1)] mb-1">{status.memory.shared}/{status.memory.total}</p>
              <p className="text-sm text-[var(--text-2)]">共享記憶 / 總記憶</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-purple-500" />
                <span className="text-xs text-emerald-500">{status.agents.online}/{status.agents.total} 在線</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-1)] mb-1">{status.agents.active}</p>
              <p className="text-sm text-[var(--text-2)]">活躍代理</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <GitBranch className="w-8 h-8 text-orange-500" />
                <span className="text-xs text-emerald-500">{status.connections.sync}% 同步</span>
              </div>
              <p className="text-2xl font-bold text-[var(--text-1)] mb-1">{status.connections.active.toLocaleString()}</p>
              <p className="text-sm text-[var(--text-2)]">記憶連結</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Cpu className="w-8 h-8 text-emerald-500" />
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              </div>
              <p className="text-2xl font-bold text-[var(--text-1)] mb-1">正常</p>
              <p className="text-sm text-[var(--text-2)]">系統運行狀態</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                功能完整度檢查
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {capabilities.map((cap) => (
                <div key={cap.name} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 ${cap.status === 'complete' ? 'text-emerald-500' : 'text-orange-500'}`} />
                    <div>
                      <p className="font-medium text-[var(--text-1)]">{cap.name}</p>
                      <p className="text-xs text-[var(--text-2)]">{cap.desc}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs ${cap.status === 'complete' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'}`}>
                    {cap.status === 'complete' ? '完成' : '進行中'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                快速操作
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/omni-agent-zone/chat"><Button variant="secondary" size="sm" className="w-full justify-start"><Brain className="w-4 h-4 mr-2" />萬能代理聊天專區</Button></Link>
              <Link href="/omni-agent-zone/connect"><Button variant="secondary" size="sm" className="w-full justify-start"><Network className="w-4 h-4 mr-2" />API 接入新代理</Button></Link>
              <Link href="/omni-agent-zone/import"><Button variant="secondary" size="sm" className="w-full justify-start"><Database className="w-4 h-4 mr-2" />匯入記憶至共享大腦</Button></Link>
              <Link href="/omni-agent-zone/agents"><Button variant="secondary" size="sm" className="w-full justify-start"><Users className="w-4 h-4 mr-2" />代理管理中心</Button></Link>
            </CardContent>
          </Card>
        </div>
    </ZonePageShell>
  );
}
