'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, Wifi, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';

export interface DelegationEventView {
  type: string;
  delegationId?: string;
  hashLock?: string;
  ts?: number;
  payload?: Record<string, unknown>;
  raw?: string;
  /** 事件來源：client / test / server 等（經 SSE 即時幀帶出，供區分本端/外部） */
  source?: string;
  /** 由本端經雙向同步回寫、再經 SSE 迴路返回的事件（閉環標記） */
  self?: boolean;
}

interface DelegationEventStreamProps {
  delegationId: string;
  /** 最多保留的顯示筆數 */
  maxEvents?: number;
  className?: string;
}

type ConnState = 'connecting' | 'open' | 'closed' | 'error';

const RESUME_KEY = (id: string) => `delegation-stream:${id}:lastId`;

/** 事件類型色彩映射（對齊 RWD 視覺層級） */
const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'delegation.created':               { bg: 'bg-emerald-500/15', text: 'text-emerald-300' },
  'delegation.validated':             { bg: 'bg-blue-500/15',    text: 'text-blue-300' },
  'delegation.terminated':            { bg: 'bg-red-500/15',     text: 'text-red-300' },
  'delegation.decision.made':         { bg: 'bg-amber-500/15',   text: 'text-amber-300' },
  'delegation.decision.reported':     { bg: 'bg-orange-500/15',  text: 'text-orange-300' },
  'delegation.execution.started':     { bg: 'bg-cyan-500/15',    text: 'text-cyan-300' },
  'delegation.execution.completed':   { bg: 'bg-green-500/15',   text: 'text-green-300' },
  'delegation.execution.failed':      { bg: 'bg-red-500/15',     text: 'text-red-300' },
  'delegation.client.sync':           { bg: 'bg-purple-500/15',  text: 'text-purple-300' },
  'delegation.anomaly.detected':      { bg: 'bg-yellow-500/15',  text: 'text-yellow-300' },
  'delegation.emergency.stop':        { bg: 'bg-red-700/20',     text: 'text-red-200' },
};

/** 事件類型簡短標籤 */
const EVENT_TYPE_LABELS: Record<string, string> = {
  'delegation.created':             '建立',
  'delegation.validated':           '驗證',
  'delegation.terminated':          '終止',
  'delegation.decision.made':       '決策',
  'delegation.decision.reported':   '回報',
  'delegation.execution.started':   '執行中',
  'delegation.execution.completed': '完成',
  'delegation.execution.failed':    '失敗',
  'delegation.client.sync':         '同步',
  'delegation.anomaly.detected':    '異常',
  'delegation.emergency.stop':      '緊急停止',
};

function getEventColors(type: string) {
  return EVENT_TYPE_COLORS[type] ?? { bg: 'bg-gray-500/15', text: 'text-gray-300' };
}

function getEventLabel(type: string) {
  return EVENT_TYPE_LABELS[type] ?? type;
}

/**
 * 委派事件即時串流面板（對齊 RWD / 全端 / 雙向同步 / 全量）
 *
 * RWD 佈局：
 * - mobile (< 640px)：垂直堆疊、全寬輸入、事件卡片簡化
 * - tablet/desktop (≥ 640px)：較寬間距、完整 hashLock 顯示
 *
 * 功能：
 * - 經 EventSource 訂閱 GET /api/delegation/events/stream，server→client 即時推送。
 * - 斷點續傳：localStorage 持久化 SSE id，重載時以 ?sinceId= 續傳（全量不漏）。
 * - 雙向同步：回寫輸入框，經 POST /api/delegation/events 寫回同一 bus（閉環）。
 * - 事件卡片可展開/收合 payload（mobile 省空間）。
 */
export const DelegationEventStream: React.FC<DelegationEventStreamProps> = ({
  delegationId,
  maxEvents = 200,
  className = '',
}) => {
  const [events, setEvents] = useState<DelegationEventView[]>([]);
  const [conn, setConn] = useState<ConnState>('connecting');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ── SSE 連線 ──
  useEffect(() => {
    if (!delegationId) return;
    setConn('connecting');
    setEvents([]);
    setEventCount(0);

    const sinceId =
      typeof window !== 'undefined' ? localStorage.getItem(RESUME_KEY(delegationId)) : null;
    const url =
      `/api/delegation/events/stream?delegationId=${encodeURIComponent(delegationId)}` +
      (sinceId ? `&sinceId=${encodeURIComponent(sinceId)}` : '');

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setConn('open');
    es.onmessage = (e: MessageEvent) => {
      if (e.lastEventId && typeof window !== 'undefined') {
        localStorage.setItem(RESUME_KEY(delegationId), e.lastEventId);
      }
      try {
        const data = JSON.parse(e.data) as DelegationEventView;
        const isSelf = data.source === 'client';
        setEvents((prev) =>
          [{ ...data, self: isSelf }, ...prev].slice(0, maxEvents)
        );
        setEventCount((c) => c + 1);
      } catch {
        setEvents((prev) =>
          [{ type: 'raw', raw: e.data } as DelegationEventView, ...prev].slice(0, maxEvents)
        );
      }
    };
    es.onerror = () => setConn('error');

    return () => {
      es.close();
      esRef.current = null;
      setConn('closed');
    };
  }, [delegationId, maxEvents]);

  // ── 雙向同步回寫 ──
  const handleSend = useCallback(async () => {
    const text = note.trim();
    if (!text || sending) return;
    setSending(true);
    setSendStatus(null);
    try {
      const res = await fetch('/api/delegation/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delegationId,
          type: 'delegation.client.sync',
          payload: { note: text, clientTs: Date.now() },
        }),
      });
      const json = (await res.json()) as { success?: boolean; hashLock?: string; error?: string };
      if (res.ok && json.success) {
        setSendStatus(`✓ 已回寫 (🔒 ${String(json.hashLock).substring(0, 10)}…)`);
        setNote('');
      } else {
        setSendStatus(`✗ 失敗：${json.error ?? res.status}`);
      }
    } catch (err) {
      setSendStatus(`✗ 異常：${err instanceof Error ? err.message : 'network'}`);
    } finally {
      setSending(false);
    }
  }, [note, sending, delegationId]);

  const toggleExpand = useCallback((idx: number) => {
    setExpandedIdx((prev) => (prev === idx ? null : idx));
  }, []);

  // ── 連線狀態 ──
  const connConfig = useMemo(() => {
    switch (conn) {
      case 'open':    return { color: 'text-green-400', icon: <Wifi className="w-3.5 h-3.5" />, label: '已連線' };
      case 'error':   return { color: 'text-red-400',   icon: <WifiOff className="w-3.5 h-3.5" />, label: '重連中' };
      case 'closed':  return { color: 'text-gray-400',  icon: <WifiOff className="w-3.5 h-3.5" />, label: '已關閉' };
      default:        return { color: 'text-yellow-400', icon: <Wifi className="w-3.5 h-3.5 animate-pulse" />, label: '連線中' };
    }
  }, [conn]);

  return (
    <div
      className={`rounded-2xl border border-white/15 bg-white/5 backdrop-blur-lg p-3 sm:p-6 flex flex-col gap-3 sm:gap-4 ${className}`}
    >
      {/* ── 標頭：連線狀態 + 事件計數 ── */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-bold text-purple-300 truncate">
            委派事件即時串流
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-400 font-mono break-all truncate">
            {delegationId}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-[10px] sm:text-xs text-gray-500 font-mono">
            {eventCount} 筆
          </span>
          <span className={`flex items-center gap-1 text-xs sm:text-sm font-mono ${connConfig.color}`}>
            {connConfig.icon}
            <span className="hidden sm:inline">{connConfig.label}</span>
          </span>
        </div>
      </div>

      {/* ── 雙向同步回寫 ── */}
      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-2.5 sm:p-3">
        <label className="text-[10px] sm:text-xs text-gray-400">
          雙向同步回寫（client → bus → SSE 返回）
        </label>
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleSend();
            }}
            placeholder="輸入同步訊號…"
            className="flex-1 min-w-0 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !note.trim()}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-purple-500 px-3 sm:px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-purple-400"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{sending ? '傳送中…' : '傳送'}</span>
          </button>
        </div>
        {sendStatus && (
          <div className="text-[10px] sm:text-xs text-teal-300 font-mono truncate">{sendStatus}</div>
        )}
      </div>

      {/* ── 事件列表 ── */}
      <div
        ref={listRef}
        className="h-64 sm:h-80 overflow-y-auto rounded-xl bg-black/30 p-2.5 sm:p-3 font-mono text-xs sm:text-sm space-y-1.5 sm:space-y-2"
      >
        {events.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <Wifi className="w-6 h-6 mx-auto mb-2 opacity-40" />
            等待事件…
          </div>
        ) : (
          events.map((ev, i) => {
            const colors = getEventColors(ev.type);
            const label = getEventLabel(ev.type);
            const isExpanded = expandedIdx === i;
            const hasPayload = ev.payload && Object.keys(ev.payload).length > 0;

            return (
              <div
                key={`${ev.ts ?? i}-${i}`}
                className="border-b border-white/5 pb-1.5 sm:pb-2 last:border-0"
              >
                {/* 事件主行：類型標籤 + 時間 + hashLock */}
                <div
                  className="flex items-center justify-between gap-2 cursor-pointer"
                  onClick={() => hasPayload && toggleExpand(i)}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold ${colors.bg} ${colors.text}`}>
                      {label}
                    </span>
                    {ev.self && (
                      <span className="shrink-0 inline-flex rounded bg-amber-500/20 px-1 py-0.5 text-[9px] sm:text-[10px] text-amber-300">
                        本端
                      </span>
                    )}
                    {ev.ts && (
                      <span className="text-gray-500 text-[10px] sm:text-xs truncate">
                        {new Date(ev.ts).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {ev.hashLock && (
                      <span
                        className="text-teal-300 text-[10px] sm:text-xs"
                        title={`HashLock: ${ev.hashLock}`}
                      >
                        🔒{ev.hashLock.substring(0, 8)}…
                      </span>
                    )}
                    {hasPayload && (
                      <span className="text-gray-600">
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </div>

                {/* 展開的 payload（點擊切換） */}
                {isExpanded && ev.payload && (
                  <pre className="mt-1 rounded bg-black/30 p-2 text-[10px] sm:text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(ev.payload, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DelegationEventStream;
