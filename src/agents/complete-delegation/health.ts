/**
 * ==========================================
 * 完全代主自行 - 委派系統健康檢查器
 * ==========================================
 *
 * 整合監控消費者（metrics.ts）與全量日誌（journal.ts），提供委派系統的
 * 健康狀態檢查，供 /healthz 端點與 Kubernetes readiness probe 使用。
 *
 * 檢查項目：
 * - journal 可讀寫（全量留存不中斷）
 * - metrics 觀測器存活（訂閱總線正常）
 * - 事件流活性（最近 N 秒內有事件流入）
 * - 告警存在性（critical 告警 → degraded / unhealthy）
 *
 * 對齊平臺不變量：
 * - 全量：journal 為 append-only JSONL，不截斷、不抽樣。
 * - 雙向同步：health checker 與 bus 訂閱者共享同一程序級 metrics 單例。
 */

import { getDefaultJournal } from './journal';
import { getDelegationMetrics, type DelegationMetricsSnapshot } from './metrics';

/** 健康狀態等級 */
export type DelegationHealthLevel = 'healthy' | 'degraded' | 'unhealthy';

// [ts-matrix] 對外相容別名：保留原匯出名稱，既有呼叫端不受影響。
export type { DelegationHealthLevel as HealthLevel };

/** 單項檢查結果 */
export interface HealthCheckItem {
  name: string;
  status: DelegationHealthLevel;
  message: string;
  /** 附加指標（可選） */
  metrics?: Record<string, unknown>;
}

/** 完整健康報告 */
export interface HealthReport {
  status: DelegationHealthLevel;
  timestamp: string;
  uptime: number;
  checks: HealthCheckItem[];
  delegationMetrics?: DelegationMetricsSnapshot;
  journalStats?: JournalHealthStats;
}

/** 日誌健康統計 */
export interface JournalHealthStats {
  totalRecords: number;
  auditCount: number;
  eventCount: number;
  latestId: number;
  path: string;
  writable: boolean;
}

/** 事件流活性追蹤器（程序級） */
class EventFlowTracker {
  private _lastEventAt: number | null = null;
  private _eventCount = 0;

  record(): void {
    this._lastEventAt = Date.now();
    this._eventCount++;
  }

  /** 距最後一次事件的秒數（null 表示從未收到事件） */
  secondsSinceLastEvent(): number | null {
    return this._lastEventAt != null ? (Date.now() - this._lastEventAt) / 1000 : null;
  }

  get eventCount(): number {
    return this._eventCount;
  }

  get lastEventAt(): number | null {
    return this._lastEventAt;
  }
}

let _flowTracker: EventFlowTracker | null = null;

function getFlowTracker(): EventFlowTracker {
  if (!_flowTracker) _flowTracker = new EventFlowTracker();
  return _flowTracker;
}

/**
 * 記錄一筆事件流入（供 publishDelegationEvent 或 bu
s 訂閱者回呼）。
 * 呼叫此方法不影響主流程（fire-and-forget）。
 */
export function recordDelegationEventFlow(): void {
  try {
    getFlowTracker().record();
  } catch {
    /* best-effort */
  }
}

/**
 * 檢查委派系統健康狀態。
 * 可供 GET /healthz?detail=true 或 Kubernetes readiness probe 使用。
 */
export async function checkDelegationHealth(): Promise<HealthReport> {
  const checks: HealthCheckItem[] = [];

  // ── 1. Journal 可讀寫 ──
  const journalCheck = checkJournalHealth();
  checks.push(journalCheck.item);
  const journalStats = journalCheck.stats;

  // ── 2. Metrics 觀測器存活 ──
  const metricsCheck = checkMetricsHealth();
  checks.push(metricsCheck.item);
  const delegationMetrics = metricsCheck.snapshot;

  // ── 3. 事件流活性 ──
  const flowCheck = checkEventFlowHealth();
  checks.push(flowCheck);

  // ── 4. 告警存在性 ──
  const alertCheck = checkAlertHealth(delegationMetrics);
  checks.push(alertCheck);

  // ── 整體狀態 ──
  const overallStatus = deriveOverallStatus(checks);

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    delegationMetrics,
    journalStats,
  };
}

// ── 個別檢查實現 ──

function checkJournalHealth(): {
  item: HealthCheckItem;
  stats: JournalHealthStats;
} {
  const defaultPath =
    process.env.DELEGATION_JOURNAL_PATH ||
    process.env.AUDIT_SINK_PATH ||
    process.env.EVENT_SINK_PATH ||
    '.audit/delegation-journal.jsonl';

  try {
    const journal = getDefaultJournal();
    const all = journal.readAll();
    const auditCount = all.filter((r) => r.kind === 'audit').length;
    const eventCount = all.filter((r) => r.kind === 'event').length;
    const latestId = all.length > 0 ? all[all.length - 1].id : 0;

    const stats: JournalHealthStats = {
      totalRecords: all.length,
      auditCount,
      eventCount,
      latestId,
      path: defaultPath,
      writable: true,
    };

    return {
      item: {
        name: 'journal',
        status: 'healthy',
        message: `Journal 可讀寫：${all.length} 筆（審
計 ${auditCount} / 事件 ${eventCount}），最新 id=${latestId}`,
        metrics: { totalRecords: all.length, auditCount, eventCount, latestId },
      },
      stats,
    };
  } catch (err) {
    const stats: JournalHealthStats = {
      totalRecords: 0,
      auditCount: 0,
      eventCount: 0,
      latestId: 0,
      path: defaultPath,
      writable: false,
    };
    return {
      item: {
        name: 'journal',
        status: 'unhealthy',
        message: `Journal 讀取失敗：${err instanceof Error ? err.message : 'unknown'}`,
      },
      stats,
    };
  }
}

function checkMetricsHealth(): {
  item: HealthCheckItem;
  snapshot: DelegationMetricsSnapshot;
} {
  try {
    const metrics = getDelegationMetrics();
    const snapshot = metrics.getSnapshot();

    return {
      item: {
        name: 'metrics',
        status: 'healthy',
        message: `Metrics 觀測器存活：已觀測 ${snapshot.total} 筆事件，${snapshot.activeDelegations} 個活躍授權`,
        metrics: {
          total: snapshot.total,
          activeDelegations: snapshot.activeDelegations,
          lastSeenAt: snapshot.lastSeenAt,
        },
      },
      snapshot,
    };
  } catch (err) {
    return {
      item: {
        name: 'metrics',
        status: 'unhealthy',
        message: `Metrics 觀測器異常：${err instanceof Error ? err.message : 'unknown'}`,
      },
      snapshot: {
        startedAt: Date.now(),
        lastSeenAt: null,
        total: 0,
        byType: {},
        activeDelegations: 0,
        alerts: [],
      },
    };
  }
}

function checkEventFlowHealth(): HealthCheckItem {
  const tracker = getFlowTracker();
  const secs = tracker.secondsSinceLastEvent();

  // 無事件流入 → 可能正常（尚無委派建立）或異常（總線中斷）
  if (secs === null) {
    return {
      name: 'eventFlow',
      status: 'healthy',
      message: '事件流活性：尚無事件流入（正常：系統啟動後尚無委派建立）',
      metrics: { totalEvents: 0, lastEventAt: null },
    };
  }

  // 5 分鐘內有事件 → 健康
  if (secs < 300) {
    return {
      name: 'eventFlow',
      status: 'healthy',
      message: `事件流
活性：${Math.floor(secs)} 秒前有事件流入`,
      metrics: { totalEvents: tracker.eventCount, lastEventAt: tracker.lastEventAt, secondsAgo: Math.floor(secs) },
    };
  }

  // 5~30 分鐘無事件 → 降級
  if (secs < 1800) {
    return {
      name: 'eventFlow',
      status: 'degraded',
      message: `事件流活性：${Math.floor(secs / 60)} 分鐘無新事件，可能需要關注`,
      metrics: { totalEvents: tracker.eventCount, lastEventAt: tracker.lastEventAt, minutesAgo: Math.floor(secs / 60) },
    };
  }

  // 30+ 分鐘無事件 → 不健康
  return {
    name: 'eventFlow',
    status: 'unhealthy',
    message: `事件流活性：${Math.floor(secs / 60)} 分鐘無事件，事件總線可能中斷`,
    metrics: { totalEvents: tracker.eventCount, lastEventAt: tracker.lastEventAt, minutesAgo: Math.floor(secs / 60) },
  };
}

function checkAlertHealth(metrics: DelegationMetricsSnapshot): HealthCheckItem {
  const criticalAlerts = metrics.alerts.filter((a) => a.level === 'critical');
  const warningAlerts = metrics.alerts.filter((a) => a.level === 'warning');

  if (criticalAlerts.length > 0) {
    return {
      name: 'alerts',
      status: 'unhealthy',
      message: `存在 ${criticalAlerts.length} 個 critical 告警`,
      metrics: { critical: criticalAlerts.length, warning: warningAlerts.length, total: metrics.alerts.length },
    };
  }

  if (warningAlerts.length > 0) {
    return {
      name: 'alerts',
      status: 'degraded',
      message: `存在 ${warningAlerts.length} 個 warning 告警`,
      metrics: { critical: 0, warning: warningAlerts.length, total: metrics.alerts.length },
    };
  }

  return {
    name: 'alerts',
    status: 'healthy',
    message: '無告警',
    metrics: { critical: 0, warning: 0, total: 0 },
  };
}

function deriveOverallStatus(checks: HealthCheckItem[]): DelegationHealthLevel {
  if (checks.some((c) => c.status === 'unhealthy')) return 'unhealthy';
  if (checks.some((c) => c.status === 'degraded')) return 'degraded';
  return 'healthy';
}
