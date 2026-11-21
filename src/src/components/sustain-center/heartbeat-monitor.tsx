'use client';

import React from 'react';
import { Activity, Users, ShieldAlert, Cpu } from 'lucide-react';

export interface HeartbeatMetrics {
  wsClients: number;
  uptime: number; // in seconds
  errorCount: number;
  memoryUsage?: number; // in MB
  status: 'Healthy' | 'Healing' | 'Degraded';
}

interface HeartbeatMonitorProps {
  metrics: HeartbeatMetrics;
  connected: boolean;
}

export function HeartbeatMonitor({ metrics, connected }: HeartbeatMonitorProps) {
  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const getStatusColor = (status: string, connected: boolean) => {
    if (!connected) return 'text-textSecondary';
    switch (status) {
      case 'Healthy': return 'text-success';
      case 'Healing': return 'text-accentGold';
      case 'Degraded': return 'text-danger';
      default: return 'text-textSecondary';
    }
  };

  const getStatusBorder = (status: string, connected: boolean) => {
    if (!connected) return 'border-borderColor/50';
    switch (status) {
      case 'Healthy': return 'border-success/30 bg-success/5';
      case 'Healing': return 'border-accentGold/30 bg-accentGold/5';
      case 'Degraded': return 'border-danger/30 bg-danger/5';
      default: return 'border-borderColor/50';
    }
  };

  return (
    <div className={`flex flex-col md:flex-row gap-4 p-4 rounded-xl backdrop-blur-xl border ${getStatusBorder(metrics.status, connected)} transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.2)]`}>
      {/* Pulse Status */}
      <div className="flex items-center gap-3 pr-4 md:border-r border-borderColor/30">
        <div className="relative flex h-4 w-4">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'animate-ping' : ''} ${getStatusColor(metrics.status, connected).replace('text-', 'bg-')}`}></span>
          <span className={`relative inline-flex rounded-full h-4 w-4 ${getStatusColor(metrics.status, connected).replace('text-', 'bg-')}`}></span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-textSecondary uppercase tracking-widest font-mono">Gateway Link</span>
          <span className={`text-sm font-bold ${getStatusColor(metrics.status, connected)}`}>
            {connected ? metrics.status : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="flex flex-wrap md:flex-nowrap gap-6 items-center flex-1">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-accentTeal" />
          <div className="flex flex-col">
            <span className="text-[10px] text-textSecondary uppercase font-mono">WS Clients</span>
            <span className="text-sm font-semibold">{connected ? metrics.wsClients : '--'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-accentTeal" />
          <div className="flex flex-col">
            <span className="text-[10px] text-textSecondary uppercase font-mono">Uptime</span>
            <span className="text-sm font-semibold font-mono">{connected ? formatUptime(metrics.uptime) : '--:--:--'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className={metrics.errorCount > 0 ? 'text-accentGold' : 'text-success'} />
          <div className="flex flex-col">
            <span className="text-[10px] text-textSecondary uppercase font-mono">Anomalies</span>
            <span className="text-sm font-semibold">{connected ? metrics.errorCount : '--'}</span>
          </div>
        </div>

        {metrics.memoryUsage !== undefined && (
          <div className="flex items-center gap-2 ml-auto">
            <Cpu size={16} className="text-textSecondary" />
            <div className="flex flex-col">
              <span className="text-[10px] text-textSecondary uppercase font-mono">MEM</span>
              <span className="text-sm font-semibold text-textSecondary">{connected ? `${metrics.memoryUsage} MB` : '--'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
