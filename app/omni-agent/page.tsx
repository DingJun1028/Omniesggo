"use client";

import React from 'react';

/**
 * OmniAgent Console UI — /omni-agent
 *
 * Features:
 * - Chat interface with OmniAgent
 * - Sub-agent panel (5T agents)
 * - Core stats display
 * - Quick commands panel
 *
 * Design: oa-ui-design-system (white theme, Teal#009EB0/Gold#D4AF37/ZKP Blue#3B82F6)
 * Architecture: Connects to /api/omni-agent/console
 */

import { useState, useRef, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  actions?: string[];
  ms?: number;
}

interface SubAgent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  progress: number;
  lastTask: string;
  startedAt: number;
  completedAt?: number;
  output?: string;
}

interface QuickCommand {
  id: string;
  label: string;
  icon: string;
  action: string;
  color: string;
  description: string;
}

interface CoreStats {
  agent: {
    name: string;
    version: string;
    status: string;
    maxConcurrent: number;
    supportedFormats: string[];
  };
  kernel: {
    registryCount: number;
    cacheMetrics: { size: number; hitRate: number };
    syncLogCount: number;
    initialized: boolean;
    agnesStatus: { activeNodes: number; throughput: string };
  };
  subAgents: {
    total: number;
    running: number;
    idle: number;
    complete: number;
  };
  capabilities: Array<{
    id: string;
    name: string;
    gate: string;
    enabled: boolean;
    confidence: number;
  }>;
  palette: {
    teal: string;
    gold: string;
    zkpBlue: string;
  };
  uptime: number;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// Constants (oa-ui-design-system)
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  teal: '#009EB0',
  tealLight: '#00C2AB',
  gold: '#D4AF37',
  zkpBlue: '#3B82F6',
  purple: '#8B5CF6',
  red: '#FF4D6D',
  green: '#22C55E',
  cyan: '#06B6D4',
  amber: '#F59E0B',
  white: '#FFFFFF',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate600: '#475569',
  slate900: '#0F172A',
};

const GATE_COLORS: Record<string, string> = {
  traceable: '#3B82F6',
  transparent: '#22C55E',
  tangible: '#F59E0B',
  trustworthy: '#8B5CF6',
  trackable: '#06B6D4',
};

const QUICK_COMMANDS: QuickCommand[] = [
  {
    id: 'cmd-status',
    label: '系統狀態',
    icon: '◎',
    action: 'status',
    color: '#009EB0',
    description: '查看 OmniAgent 核心運行狀態',
  },
  {
    id: 'cmd-evolve',
    label: 'Agent 進化',
    icon: '🧬',
    action: 'evolve',
    color: '#8B5CF6',
    description: '觸發 Agent 自主進化程序',
  },
  {
    id: 'cmd-assemble',
    label: '報告組裝',
    icon: '📊',
    action: 'assemble',
    color: '#3B82F6',
    description: '啟動 ESG 報告組裝管線',
  },
  {
    id: 'cmd-sync',
    label: '全域同步',
    icon: '🔄',
    action: 'sync',
    color: '#D4AF37',
    description: '執行 OmniSyncGateway 全域對標',
  },
  {
    id: 'cmd-zkp-seal',
    label: 'ZKP 封印',
    icon: '🔒',
    action: 'zkp_seal',
    color: '#22C55E',
    description: '對當前報告執行零知識證明封印',
  },
  {
    id: 'cmd-5t-verify',
    label: '5T 驗證',
    icon: '📡',
    action: '5t_verify',
    color: '#06B6D4',
    description: '執行 5T 協議全維度驗證',
  },
];

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function now(): string {
  return new Date().toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

import DOMPurify from "isomorphic-dompurify";

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

function renderMarkdown(text: string): string {
  const sanitized = sanitizeHtml(text);
  return sanitized
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-textPrimary">$1</strong>')
    .replace(
      /`(.+?)`/g,
      `<code class="bg-secondary px-1.5 py-[1px] rounded font-mono text-[11px] text-teal-700">$1</code>`,
    )
    .replace(/• /g, '<span class="text-accentTeal">•</span> ')
    .replace(/✅/g, '<span class="text-accentGreen">✅</span>')
    .replace(/✓/g, '<span class="text-accentGreen">✓</span>')
    .replace(/\|(.+)\|/g, (match: string) => {
      const cells = match
        .split('|')
        .filter(Boolean)
        .map((c: string) => c.trim());
      if (cells.every((c: string) => /^[\-=]+$/.test(c))) return '';
      return `<div class="grid grid-cols-${cells.length} gap-2 text-[11px] py-1 border-b border-borderColor">${cells.map((c: string) => `<span>${c}</span>`).join('')}</div>`;
    })
    .replace(/\n/g, '<br/>');
}

interface ChatData {
  reply?: string;
  actions?: string[];
}

interface DispatchAgentData {
  agent?: SubAgent;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  reply?: string;
  actions?: string[];
  agent?: SubAgent;
  error?: string;
}

async function apiCall<T = unknown>(
  type: string,
  payload?: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  const res = await fetch('/api/omni-agent/console', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, payload }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
// Sub-Agent Panel Component
// ═══════════════════════════════════════════════════════════════

function SubAgentPanel({
  agents,
  onDispatch,
}: {
  agents: SubAgent[];
  onDispatch: (agent: SubAgent) => void;
}) {
  const statusColor = (status: string) => {
    switch (status) {
      case 'running':
        return COLORS.amber;
      case 'complete':
        return COLORS.green;
      case 'error':
        return COLORS.red;
      default:
        return COLORS.slate400;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return '執行中';
      case 'complete':
        return '完成';
      case 'error':
        return '錯誤';
      default:
        return '閒置';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-textSecondary tracking-wider">5T 子代理面板</h3>
        <span className="text-[10px] bg-accentTeal/10 text-accentTeal px-2 py-0.5 rounded-full font-mono">
          {agents.filter((a) => a.status === 'running').length}/{agents.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="bg-primary border border-borderColor rounded-xl p-3 transition-all duration-200 hover:shadow-sm hover:border-slate-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full transition-colors duration-300"
                  style={{
                    backgroundColor: statusColor(agent.status),
                    boxShadow:
                      agent.status === 'running' ? `0 0 6px ${statusColor(agent.status)}` : 'none',
                  }}
                />
                <span className="text-[12px] font-semibold text-textPrimary">{agent.name}</span>
              </div>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${statusColor(agent.status)}15`,
                  color: statusColor(agent.status),
                }}
              >
                {statusLabel(agent.status)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-secondary rounded-full mb-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${agent.progress}%`,
                  backgroundColor: GATE_COLORS[agent.role] || COLORS.teal,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-textSecondary truncate max-w-[60%]">
                {agent.lastTask}
              </span>
              <button
                onClick={() => onDispatch(agent)}
                disabled={agent.status === 'running'}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                style={{
                  backgroundColor:
                    agent.status === 'running'
                      ? COLORS.slate100
                      : `${GATE_COLORS[agent.role] || COLORS.teal}15`,
                  color:
                    agent.status === 'running'
                      ? COLORS.slate400
                      : GATE_COLORS[agent.role] || COLORS.teal,
                }}
              >
                派遣
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Core Stats Display Component
// ═══════════════════════════════════════════════════════════════

function CoreStatsDisplay({ stats }: { stats: CoreStats | null }) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-32 text-xs text-textSecondary">
        載入中...
      </div>
    );
  }

  const statCards = [
    {
      label: '註冊組件',
      value: stats.kernel.registryCount,
      color: COLORS.teal,
      icon: '⊙',
    },
    {
      label: '快取命中率',
      value: `${(stats.kernel.cacheMetrics.hitRate * 100).toFixed(0)}%`,
      color: COLORS.zkpBlue,
      icon: '⚡',
    },
    {
      label: '同步記錄',
      value: stats.kernel.syncLogCount,
      color: COLORS.gold,
      icon: '🔄',
    },
    {
      label: 'AGNES 節點',
      value: stats.kernel.agnesStatus.activeNodes,
      color: COLORS.purple,
      icon: '🤖',
    },
    {
      label: '吞吐量',
      value: stats.kernel.agnesStatus.throughput,
      color: COLORS.cyan,
      icon: '📈',
    },
    {
      label: '運行時間',
      value: formatUptime(stats.uptime),
      color: COLORS.green,
      icon: '⏱',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-textSecondary tracking-wider">核心統計</h3>
        <span className="text-[10px] font-mono text-textSecondary">v{stats.agent.version}</span>
      </div>

      {/* Agent Status Badge */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-accentTeal/100 animate-pulse" />
          <span className="text-[12px] font-bold text-teal-700">{stats.agent.name}</span>
        </div>
        <div className="text-[10px] text-textSecondary">
          狀態：
          <span className="font-semibold text-accentTeal">{stats.agent.status}</span> · 併發：
          {stats.agent.maxConcurrent} · 格式：
          {stats.agent.supportedFormats.join(', ')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-primary border border-borderColor rounded-lg p-2.5 hover:border-borderColor transition-colors"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{card.icon}</span>
              <span className="text-[10px] text-textSecondary font-medium">{card.label}</span>
            </div>
            <div className="font-mono text-base font-bold" style={{ color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* 5T Capabilities */}
      <div className="mt-auto">
        <div className="text-[10px] text-textSecondary font-semibold mb-1.5">5T 能力矩陣</div>
        <div className="space-y-1.5">
          {stats.capabilities.map((cap) => (
            <div key={cap.id} className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: GATE_COLORS[cap.gate] || COLORS.slate400,
                }}
              />
              <span className="text-[10px] text-textSecondary flex-1">{cap.name}</span>
              <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${cap.confidence * 100}%`,
                    backgroundColor: GATE_COLORS[cap.gate] || COLORS.slate400,
                  }}
                />
              </div>
              <span className="text-[9px] font-mono text-textSecondary w-7 text-right">
                {(cap.confidence * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Quick Commands Component
// ═══════════════════════════════════════════════════════════════

function QuickCommands({ onExecute }: { onExecute: (cmd: QuickCommand) => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-textSecondary tracking-wider">快速命令</h3>
        <span className="text-[10px] text-textSecondary">點擊執行</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd.id}
            onClick={() => onExecute(cmd)}
            className="bg-primary border border-borderColor rounded-xl p-3 text-left transition-all duration-200 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base group-hover:scale-110 transition-transform">
                {cmd.icon}
              </span>
              <span className="text-[11px] font-semibold text-textPrimary">{cmd.label}</span>
            </div>
            <div className="text-[9px] text-textSecondary leading-tight">{cmd.description}</div>
            <div className="mt-2 h-0.5 rounded-full overflow-hidden bg-secondary">
              <div
                className="h-full rounded-full transition-all duration-300 group-hover:w-full"
                style={{ width: '0%', backgroundColor: cmd.color }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Chat Interface Component
// ═══════════════════════════════════════════════════════════════

const CHAT_SUGGESTIONS = ['系統狀態', '5T 驗證', '幫助'] as const;
const LOADING_DOTS = [0, 1, 2] as const;

const RenderedMessage = React.memo(function RenderedMessage({ m }: { m: Message }) {
  return (
  <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
    <div
      className={`max-w-[90%] border rounded-2xl px-4 py-2.5 ${
        m.role === 'user'
          ? 'bg-accentTeal/100 border-teal-500 text-white rounded-br-md'
          : 'bg-primary border-borderColor rounded-bl-md shadow-sm'
      }`}
    >
      {m.actions && m.actions.length > 0 && (
        <div className="flex gap-1 mb-1.5 flex-wrap">
          {m.actions.map((a) => (
            <span
              key={a}
              className="text-[9px] bg-secondary text-textSecondary px-1.5 py-0.5 rounded font-mono"
            >
              {a}
            </span>
          ))}
        </div>
      )}
      <div
        className={`text-[13px] leading-relaxed ${m.role === 'user' ? 'text-white' : 'text-textPrimary'}`}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
      />
    </div>
    <div className="text-[10px] text-textSecondary mt-1 flex items-center gap-1.5">
      <span>{m.time}</span>
      {m.ms && <span className="font-mono">({m.ms}ms)</span>}
    </div>
  </div>
  );
});

function ChatInterface() {
  const [msgs, setMsgs] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      text: '**OmniAgent Console 已啟動** ⊙\n\n歡迎使用 OmniAgent 控制檯。您可以：\n• 輸入自然語言指令\n• 點擊右側「快速命令」\n• 派遣 5T 子代理\n\n輸入 `幫助` 查看可用指令。',
      time: now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || busy) return;

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      text: trimmed,
      time: now(),
    };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setBusy(true);

    const start = Date.now();

    try {
      const res = await apiCall<ChatData>('chat', { input: trimmed });
      const ms = Date.now() - start;

      if (res.success) {
        const aiMsg: Message = {
          id: uid(),
          role: 'assistant',
          text: res.data?.reply ?? '',
          time: now(),
          actions: res.data?.actions,
          ms,
        };
        setMsgs((m) => [...m, aiMsg]);
      } else {
        const errMsg: Message = {
          id: uid(),
          role: 'assistant',
          text: `錯誤：${res.error || '未知錯誤'}`,
          time: now(),
        };
        setMsgs((m) => [...m, errMsg]);
      }
    } catch {
      const fallbackMsg: Message = {
        id: uid(),
        role: 'assistant',
        text: '**連線失敗** ⚠️\n\n無法連接 OmniAgent API。請確認服務正在運行。',
        time: now(),
      };
      setMsgs((m) => [...m, fallbackMsg]);
    }

    setBusy(false);
  }, [input, busy]);

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accentTeal/100 animate-pulse" />
          <h3 className="text-xs font-semibold text-textSecondary tracking-wider">
            OmniAgent 對話
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] bg-accentTeal/10 text-accentTeal px-2 py-0.5 rounded-full font-bold">
            LIVE
          </span>
          <span className="text-[9px] text-textSecondary font-mono">{msgs.length} msgs</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 min-h-0">
        {msgs.map((m) => (
          <RenderedMessage key={m.id} m={m} />
        ))}
        {busy && (
          <div className="flex items-start">
            <div className="bg-primary border border-borderColor rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5 shadow-sm">
              {LOADING_DOTS.map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-teal-400"
                  style={{ animation: `pulse 1.2s ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Suggestions */}
      <div className="flex gap-1.5 flex-wrap my-2">
        {CHAT_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setInput(s);
            }}
            className="text-[10px] bg-accentTeal/10 border border-teal-200 text-accentTeal rounded-lg px-2.5 py-1 hover:bg-teal-100 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-auto">
        <input
          aria-label="輸入指令或自然語言任務"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="輸入指令或自然語言任務..."
          disabled={busy}
          className="flex-1 bg-primary border border-borderColor rounded-xl px-4 py-2.5 text-[13px] text-textPrimary outline-none font-['Noto_Sans_TC',sans-serif] focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all disabled:opacity-50 placeholder:text-slate-300"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className={`border-none rounded-xl px-4 py-2.5 font-bold text-[13px] transition-all ${
            busy || !input.trim()
              ? 'bg-slate-200 text-textSecondary cursor-not-allowed'
              : 'bg-accentTeal/100 text-white cursor-pointer hover:bg-teal-600 hover:shadow-md active:scale-95'
          }`}
        >
          {busy ? '…' : '發送'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main OmniAgent Console Page
// ═══════════════════════════════════════════════════════════════

const PANEL_TABS = [
  { id: 'stats', label: '核心統計', icon: '◎' },
  { id: 'evolution', label: '無限進化', icon: '🧬' },
  { id: 'agents', label: '子代理', icon: '🤖' },
  { id: 'commands', label: '快速命令', icon: '⚡' },
] as const;

export default function OmniAgentConsolePage() {
  const [subAgents, setSubAgents] = useState<SubAgent[]>([]);
  const [stats, setStats] = useState<CoreStats | null>(null);
  const [activePanel, setActivePanel] = useState<'stats' | 'agents' | 'commands' | 'evolution'>('stats');
  const [evolution, setEvolution] = useState({ level: 1, xp: 0, nextXp: 140 });
  const [evolving, setEvolving] = useState(false);
  const [evolutionLog, setEvolutionLog] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, agentsRes] = await Promise.all([
          apiCall<CoreStats>('get_stats'),
          apiCall<SubAgent[]>('get_sub_agents'),
        ]);
        if (statsRes.success) setStats(statsRes.data ?? null);
        if (agentsRes.success) setSubAgents(agentsRes.data ?? []);
      } catch (err) {
        console.warn('[OmniAgent Console] Failed to fetch initial data:', err);
      }
    };
    fetchData();

    // Poll for updates every 5s
    const interval = setInterval(async () => {
      try {
        const [statsRes, agentsRes] = await Promise.all([
          apiCall<CoreStats>('get_stats'),
          apiCall<SubAgent[]>('get_sub_agents'),
        ]);
        if (statsRes.success) setStats(statsRes.data ?? null);
        if (agentsRes.success) setSubAgents(agentsRes.data ?? []);
      } catch {
        /* silent */
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleDispatchAgent = useCallback(async (agent: SubAgent) => {
    try {
      const res = await apiCall<DispatchAgentData>('dispatch_sub_agent', {
        agentId: agent.id,
        task: `手動派遣任務 @ ${now()}`,
      });
      if (res.success) {
        setSubAgents((prev) => prev.map((a) => (a.id === agent.id ? (res.data?.agent ?? a) : a)));
      }
    } catch (err) {
      console.warn('[OmniAgent Console] Failed to dispatch agent:', err);
    }
  }, []);

  const evolveAgent = useCallback(async () => {
    if (evolving) return;
    setEvolving(true);
    try {
      const res = await apiCall('quick_command', { commandId: 'cmd-evolve' });
      const entry = res.success
        ? `[${now()}] 進化成功：${res.reply || 'Agent 進化程序已執行'}`
        : `[${now()}] 進化失敗：${res.error || '未知錯誤'}`;
      setEvolutionLog((prev) => [entry, ...prev].slice(0, 20));
      if (res.success) {
        setEvolution((prev) => {
          const xp = prev.xp + 25;
          let level = prev.level;
          let nextXp = prev.nextXp;
          while (xp >= nextXp) {
            level += 1;
            nextXp = Math.floor(nextXp * 1.2);
          }
          return { level, xp: xp % nextXp, nextXp };
        });
      }
    } finally {
      setEvolving(false);
    }
  }, [evolving]);

  const handleQuickCommand = useCallback(async (cmd: QuickCommand) => {
    try {
      await apiCall('quick_command', { commandId: cmd.id });
      const statsRes = await apiCall<CoreStats>('get_stats');
      if (statsRes.success) setStats(statsRes.data ?? null);
    } catch (err) {
      console.warn('[OmniAgent Console] Quick command failed:', err);
    }
  }, []);

  return (
    <div className="min-h-screen bg-secondary font-['Noto_Sans_TC',sans-serif]">
      {/* Global Styles */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      {/* Header */}
      <header className="bg-primary border-b border-borderColor sticky top-0 z-50 backdrop-blur-sm bg-primary/90">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-teal-200">
              ⊙
            </div>
            <div>
              <h1 className="text-base font-bold text-textPrimary tracking-tight">
                OmniAgent Console — 無限進化
              </h1>
              <p className="text-[10px] text-textSecondary">ESGGO 永續發展無限進化 · 統一指揮介面</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accentGreen animate-pulse" />
              <span className="text-[10px] font-semibold text-green-700">ONLINE</span>
            </div>

            {/* Stats summary */}
            <div className="hidden md:flex items-center gap-4 text-[10px] text-textSecondary font-mono">
              <span>
                Agent:{' '}
                <span className="text-accentTeal font-bold">{stats?.agent.status || '...'}</span>
              </span>
              <span>
                Cache:{' '}
                <span className="text-blue-600 font-bold">
                  {stats?.kernel.cacheMetrics.size || 0}
                </span>
              </span>
              <span>
                Nodes:{' '}
                <span className="text-purple-600 font-bold">
                  {stats?.kernel.agnesStatus.activeNodes || 0}
                </span>
              </span>
            </div>

            {/* Back link */}
            <a
              href="/omni-center"
              className="text-[11px] text-textSecondary hover:text-accentTeal transition-colors font-medium"
            >
              ← 萬能中心
            </a>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-[calc(100vh-100px)]">
          {/* Left: Chat Interface (7 cols) */}
          <div className="lg:col-span-7 bg-primary border border-borderColor rounded-2xl shadow-sm p-4 md:p-5 flex flex-col overflow-hidden">
            <ChatInterface />
          </div>

          {/* Right: Side Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6 overflow-hidden">
            {/* Panel Tabs */}
            <div className="bg-primary border border-borderColor rounded-2xl shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
              {/* Tab Bar */}
              <div className="flex border-b border-borderColor shrink-0">
                {PANEL_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={activePanel === tab.id}
                    onClick={() => setActivePanel(tab.id)}
                    className={`flex-1 py-2.5 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current ${
                      activePanel === tab.id
                        ? 'text-accentTeal border-b-2 border-teal-500 bg-accentTeal/10/50'
                        : 'text-textSecondary hover:text-textSecondary'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {activePanel === 'stats' && <CoreStatsDisplay stats={stats} />}
                {activePanel === 'agents' && (
                  <SubAgentPanel agents={subAgents} onDispatch={handleDispatchAgent} />
                )}
                {activePanel === 'commands' && <QuickCommands onExecute={handleQuickCommand} />}
                {activePanel === 'evolution' && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="text-xs font-semibold text-textSecondary tracking-wider mb-2">ESGGO 無限進化</div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-primary border border-borderColor rounded-xl p-3 text-center">
                          <div className="text-[10px] text-textSecondary">LEVEL</div>
                          <div className="text-xl font-bold text-accentGold">{evolution.level}</div>
                        </div>
                        <div className="bg-primary border border-borderColor rounded-xl p-3 text-center">
                          <div className="text-[10px] text-textSecondary">XP</div>
                          <div className="text-xl font-bold text-accentTeal">{evolution.xp}/{evolution.nextXp}</div>
                        </div>
                        <div className="bg-primary border border-borderColor rounded-xl p-3 text-center">
                          <div className="text-[10px] text-textSecondary">STATUS</div>
                          <div className="text-xs font-bold mt-1">{evolving ? '🧬 進化中...' : '∞ READY'}</div>
                        </div>
                      </div>
                      <button
                        onClick={evolveAgent}
                        disabled={evolving}
                        className="mt-3 w-full py-2 rounded-xl border border-accentPurple/40 bg-accentPurple/10 text-sm font-semibold text-accentPurple hover:bg-accentPurple/20 transition-colors disabled:opacity-50"
                      >
                        {evolving ? '進化中...' : '🧬 啟動 Agent 無限進化'}
                      </button>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-textSecondary tracking-wider mb-2">進化紀錄</div>
                      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                        {evolutionLog.length === 0 && (
                          <div className="text-[11px] text-textSecondary">尚無進化紀錄，請執行進化程序。</div>
                        )}
                        {evolutionLog.map((log, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] font-mono bg-primary border border-borderColor rounded-lg px-3 py-2 text-textPrimary"
                          >
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
