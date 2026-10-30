'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bot, Activity, CheckCircle2, XCircle, Settings, Plus, Wifi } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@esggo/ui';
import { motion } from 'framer-motion';
import { ZonePageShell } from '../_components/zone-page-shell';
import { ZoneHeaderCore } from '../_components/zone-header-core';
import { REGISTRY_AGENTS } from '../_shared/registry-data';

interface Agent {
  id: string;
  name: string;
  type: 'omni' | 'hermes' | 'jules' | 'custom';
  status: 'online' | 'busy' | 'offline' | 'error';
  capabilities: string[];
  endpoint?: string;
  lastHeartbeat?: number;
  tasksCompleted: number;
  memoryUsage: number;
}

const AGENT_TYPES = {
  omni: { label: 'OmniAgent', color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
  hermes: { label: 'Hermes', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  jules: { label: 'Jules', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  custom: { label: '自定義', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
};

const STATUS_CONFIG = {
  online: { label: '在線', color: 'text-emerald-500', icon: CheckCircle2 },
  busy: { label: '忙碌', color: 'text-orange-500', icon: Activity },
  offline: { label: '離線', color: 'text-gray-500', icon: XCircle },
  error: { label: '錯誤', color: 'text-red-500', icon: XCircle },
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/omni-agent/registry');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      setAgents(REGISTRY_AGENTS);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHeartbeat = (timestamp?: number) => {
    if (!timestamp) return '未知';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分鐘前`;
    return `${Math.floor(diff / 3600000)}小時前`;
  };

  return (
    <ZonePageShell
      header={
        <>
            <ZoneHeaderCore icon={<Bot className="w-6 h-6 text-white" />} title="代理管理中心" subtitle="連接與管理所有代理 • 統一介面" iconBg="from-cyan-500 to-blue-500" />
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              添加代理
            </Button>
        </>
      }
      mainClassName="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8"
    >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-cool)] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-[var(--text-2)]">載入代理列表中...</p>
            </div>
          ) : (
            agents.map((agent, index) => {
              const typeConfig = AGENT_TYPES[agent.type];
              const statusConfig = STATUS_CONFIG[agent.status];
              const StatusIcon = statusConfig.icon;
              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-all group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} flex items-center justify-center`}>
                            <Bot className={`w-5 h-5 ${typeConfig.color}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{agent.name}</CardTitle>
                            <p className="text-xs text-[var(--text-3)] mt-1">{agent.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                          <span className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-[var(--text-3)] mb-2">類型</p>
                        <span className={`px-2 py-1 rounded-md text-xs ${typeConfig.bg} ${typeConfig.color}`}>
                          {typeConfig.label}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-3)] mb-2">能力</p>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map((cap) => (
                            <span key={cap} className="px-2 py-1 rounded-md bg-[var(--surface-3)] text-xs text-[var(--text-2)]">
                              {cap}
                            </span>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <span className="px-2 py-1 rounded-md bg-[var(--surface-3)] text-xs text-[var(--text-3)]">
                              +{agent.capabilities.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                        <div>
                          <p className="text-xs text-[var(--text-3)]">完成任務</p>
                          <p className="text-lg font-semibold text-[var(--text-1)]">{agent.tasksCompleted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-3)]">記憶使用率</p>
                          <p className="text-lg font-semibold text-[var(--text-1)]">{agent.memoryUsage}%</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-3)]">
                          <Wifi className="w-3 h-3" />
                          <span>{formatHeartbeat(agent.lastHeartbeat)}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="secondary" size="sm">
                            連接
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: agents.length * 0.05 }}
          >
            <Link href="/omni-agent-zone/connect">
              <Card className="h-full border-dashed border-2 hover:border-[var(--accent-cool)] hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-cool-soft)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-[var(--accent-cool)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--text-1)] mb-2 group-hover:text-[var(--accent-cool)] transition-colors">
                    連接新代理
                  </h3>
                  <p className="text-sm text-[var(--text-2)]">
                    透過 API 金鑰接入 Hermes、Jules 等代理
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </motion.div>
    </ZonePageShell>
  );
}
