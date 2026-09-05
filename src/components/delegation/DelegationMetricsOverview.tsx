'use client';

import { useEffect, useState, useMemo } from 'react';

/**
 * ==========================================
 * 委派事件指標總覽卡（監控消費者可視化）
 * ==========================================
 *
 * 消費 GET /api/delegation/metrics，呈現委派事件的即時聚合指標：
 * - 全球聚合：總事件數、活躍 delegation 數、最近觀測時間、各事件類型計數。
 * - 單一 delegation（當已連線且具 monitor / full 權限）：該 delegation 的事件聚合。
 *
 * 對齊平臺不變量：RWD（響應式網格）、全端（client 直接消費同一總線衍生的 API）、
 * 全量（指標本身來自全量觀測，不抽樣）。
 */

interface GlobalMetrics {
  success: boolean;
  startedAt: number;
  lastSeenAt: number | null;
  total: number;
  byType: Record<string, number>;
  activeDelegations: number;
  alerts: AlertItem[];
}

interface DelegationMetrics {
  success: boolean;
  delegationId: string;
  total: number;
  byType: Record<string, number>;
  lastSeenAt: number | null;
  alerts: AlertItem[];
}

/** 告警項目（與 metrics.ts 之 DelegationAlert 同形） */
interface AlertItem {
  id: string;
  level: 'critical' | 'warning';
  type: string;
  delegationId: string;
  ts: number;
  message: string;
}

/** 將時間戳轉為相對描述（對齊 RWD UI 的簡潔呈現） */
function relativeTime(ts: number | null): string {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  if (diff < 0) return '剛剛';
  if (diff < 1000) return '剛剛';
  if (diff < 60000) return `${Math.floor(diff / 1000)} 秒前`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分鐘前`;
  return `${Math.floor(diff / 3600000)} 小時前`;
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
      <span className="text-xs text-gray-400 truncate">{label}</span>
      <span className="text-sm font-mono font-bold text-purple-300">{value}</span>
    </div>
  );
}

function AlertList({ alerts }: { alerts: AlertItem[] }) {
  // 最近的告警置頂（取最後 5 筆）
  const recent = useMemo(() => {
    if (!alerts) return [];
    return [...alerts].slice(-5).reverse();
  }, [alerts]);

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-xs text-emerald-300/80 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
        無告警
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {recent.map((a) => (
        <div
          key={a.id}
          className={`rounded-lg px-3 py-2 border text-xs ${
            a.level === 'critical'
              ? 'bg-red-500/15 border-red-500/40 text-red-200'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold uppercase">{a.level}</span>
            <span className="font-mono text-[10px] opacity-70">
              {relativeTime(a.ts)}
            </span>
          </div>
          <div className="mt-0.5">{a.message}</div>
        </div>
      ))}
    </div>
  );
}

export default function DelegationMetricsOverview({
  delegationId,
}: {
  delegationId?: string;
}) {
  const [global, setGlobal] = useState<GlobalMetrics | null>(null);
  const [delegation, setDelegation] = useState<DelegationMetrics | null>(null);
  const [delegationForbidden, setDelegationForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // 全球聚合（僅計數，恆可取得）
      try {
        const res = await fetch('/api/delegation/metrics');
        if (res.ok && !cancelled) {
          setGlobal((await res.json()) as GlobalMetrics);
        }
      } catch {
        /* 觀測性請求失敗不影響主流程 */
      }

      // 單一 delegation（需 monitor / full 權限）
      if (delegationId) {
        try {
          const res = await fetch(
            `/api/delegation/metrics?delegationId=${encodeURIComponent(delegationId)}`
          );
          if (!cancelled) {
            if (res.ok) {
              setDelegation((await res.json()) as DelegationMetrics);
              setDelegationForbidden(false);
            } else if (res.status === 403) {
              setDelegation(null);
              setDelegationForbidden(true);
            } else {
              setDelegation(null);
              setDelegationForbidden(false);
            }
          }
        } catch {
          if (!cancelled) {
            setDelegation(null);
            setDelegationForbidden(false);
          }
        }
      } else if (!cancelled) {
        setDelegation(null);
        setDelegationForbidden(false);
      }

      if (!cancelled) setLoading(false);
    };

    load();
    // 輕量輪詢：對齊「即時」監控（5s）
    const timer = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [delegationId]);

  const globalTypes = useMemo(() => {
    return global ? Object.entries(global.byType) : [];
  }, [global]);

  const delegationTypes = useMemo(() => {
    return delegation ? Object.entries(delegation.byType) : [];
  }, [delegation]);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">事件指標總覽</h2>
        <span className="text-xs text-gray-400">
          {loading ? '載入中…' : `最近觀測：${relativeTime(global?.lastSeenAt ?? null)}`}
        </span>
      </div>

      {/* 全球聚合 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-gray-400">總事件數（全量）</div>
          <div className="text-2xl font-bold text-white">{global?.total ?? '—'}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-white/10">
          <div className="text-xs text-gray-400">活躍 Delegation</div>
          <div className="text-2xl font-bold text-white">
            {global?.activeDelegations ?? '—'}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-3 border border-white/10 col-span-2 sm:col-span-1">
          <div className="text-xs text-gray-400">觀測器啟動</div>
          <div className="text-sm font-mono text-purple-300">
            {global ? relativeTime(global.startedAt) : '—'}
          </div>
        </div>
      </div>

      {/* 全球事件類型分佈 */}
      {globalTypes.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-400 mb-2">事件類型分佈</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {globalTypes.map(([type, count]) => (
              <MetricChip key={type} label={type} value={count} />
            ))}
          </div>
        </div>
      )}

      {/* 全球告警 */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">告警（全量留存）</div>
        <AlertList alerts={global?.alerts ?? []} />
      </div>

      {/* 單一 delegation 指標（需 monitor / full） */}
      {delegationId && (
        <div className="border-t border-white/10 pt-4">
          <div className="text-sm font-semibold text-white mb-2">
            本 Delegation 指標
          </div>
          {delegationForbidden ? (
            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              需要 monitor / full 權限才能檢視此 delegation 的指標。
            </div>
          ) : delegation ? (
            <div>
              <div className="flex gap-4 mb-2">
                <span className="text-xs text-gray-400">
                  總計：
                  <span className="text-purple-300 font-mono font-bold ml-1">
                    {delegation.total}
                  </span>
                </span>
                <span className="text-xs text-gray-400">
                  最近：{relativeTime(delegation.lastSeenAt)}
                </span>
              </div>
              {delegationTypes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {delegationTypes.map(([type, count]) => (
                    <MetricChip key={type} label={type} value={count} />
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500">尚無事件</div>
              )}
              <div className="mt-3">
                <div className="text-xs text-gray-400 mb-2">告警</div>
                <AlertList alerts={delegation.alerts} />
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500">尚無資料</div>
          )}
        </div>
      )}
    </div>
  );
}
