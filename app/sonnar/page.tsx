'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  SolidCard,
  CardHeader,
  MetricCard,
  Badge,
  Button,
  Section,
  ProgressBar,
  Grid,
  SOLID_CARD_TOKENS,
} from '@esggo/ui';

// ─── Constants ────────────────────────────────────────────────

const KNOWN_REGIONS = new Set(['TW', 'EU', 'INT', 'US', 'AP']);

// ─── Types ────────────────────────────────────────────────────

interface Source {
  id: string;
  sourceId: string;
  sourceName: string;
  enabled: boolean;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastItemsFound?: number;
}

interface RadarSignal {
  source: { id: string; name: string };
  signalStrength: number;
  newItems: number;
  changedItems: number;
  anomaly: boolean;
  anomalyType?: string;
  topics: string[];
  lastUpdate: string;
}

interface Topic {
  topic: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
  sources: string[];
}

interface Alert {
  id: string;
  sourceName: string;
  alertType: string;
  severity: string;
  title: string;
  summary: string;
  acknowledged: boolean;
  createdAt: string;
}

interface WSEvent {
  type: 'crawl_complete' | 'alert_new' | 'signal_update' | 'heartbeat';
  data: Record<string, unknown>;
  ts: number;
}

// ─── Constants ────────────────────────────────────────────────

const SEVERITY_VARIANTS: Record<string, 'error' | 'warning' | 'blue' | 'muted'> = {
  critical: 'error',
  high: 'warning',
  medium: 'warning',
  low: 'muted',
};

const REGION_LABELS: Record<string, string> = {
  TW: '🇹🇼 臺灣',
  EU: '🇪🇺 歐盟',
  INT: '🌍 國際',
  US: '🇺🇸 美國',
  AP: '🌏 亞太',
  '3P': '📊 第三方',
};

const TREND_ICONS: Record<string, string> = { up: '↑', down: '↓', stable: '→' };

// ─── CSS Bar Chart (zero deps) ────────────────────────────────

const BarChart = React.memo(function BarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 ${color} rounded-t transition-all duration-500`}
          style={{
            height: maxVal > 0 ? `${(v / maxVal) * 100}%` : '0%',
            minHeight: v > 0 ? '2px' : '0',
          }}
          title={`${v}`}
        />
      ))}
    </div>
  );
});

// ─── Timeline sparkline ───────────────────────────────────────

const Sparkline = React.memo(function Sparkline({ data, color = 'text-teal-400' }: { data: number[]; color?: string }) {
  const pts = useMemo(() => {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const step = 100 / (data.length - 1);
    return data.map((v, i) => `${i * step},${100 - (max > 0 ? (v / max) * 90 : 0)}`).join(' ');
  }, [data]);

  if (!pts) return <span className="text-xs text-gray-500">--</span>;

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-8 ${color}`} preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

// ─── Main Dashboard ───────────────────────────────────────────

const SONNAR_TABS = ['overview', 'crawl', 'alerts'] as const;

export default function SonnarDashboard() {
  const [sources, setSources] = useState<Source[]>([]);
  const [signals, setSignals] = useState<RadarSignal[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [crawling, setCrawling] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'crawl' | 'alerts'>('overview');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [wsConnected, setWsConnected] = useState(false);
  const [wsEvents, setWsEvents] = useState<WSEvent[]>([]);
  const [evolution, setEvolution] = useState({ level: 1, xp: 0, nextXp: 120 });
  const [evolving, setEvolving] = useState(false);

  // Signal history (for sparklines) — keep last 20 ticks per source
  const [signalHistory, setSignalHistory] = useState<Record<string, number[]>>({});
  const signalHistoryRef = useRef<Record<string, number[]>>({});

  // ─── Fetch ──────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const [crawlRes, radarRes, alertsRes] = await Promise.all([
        fetch('/api/sonnar/crawl'),
        fetch('/api/sonnar/radar'),
        fetch('/api/sonnar/alerts'),
      ]);
      const crawlData = await crawlRes.json();
      const radarData = await radarRes.json();
      const alertsData = await alertsRes.json();

      if (crawlData.success) setSources(crawlData.data.jobs || []);
      if (radarData.success) {
        const sigs = radarData.data.signals || [];
        setSignals(sigs);
        setTopics(radarData.data.topicsAggregated || []);

        // Update signal history for sparklines
        const newHistory = { ...signalHistoryRef.current };
        sigs.forEach((s: RadarSignal) => {
          const hist = newHistory[s.source.id] || [];
          newHistory[s.source.id] = [...hist.slice(-19), s.signalStrength];
        });
        signalHistoryRef.current = newHistory;
        setSignalHistory(newHistory);
      }
      if (alertsData.success) setAlerts(alertsData.data.alerts || []);
    } catch (err) {
      console.error('[Sonar] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── WebSocket ──────────────────────────────────────────────
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${proto}//${location.host}/gateway/sonnar/ws`);

        ws.onopen = () => setWsConnected(true);
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws?.close();

        ws.onmessage = (ev) => {
          try {
            const event: WSEvent = JSON.parse(ev.data);
            setWsEvents((prev) => [...prev.slice(-49), event]); // keep last 50

            if (event.type === 'crawl_complete' || event.type === 'signal_update') {
              // Refresh data on crawl completion
              fetchStatus();
            }
            if (event.type === 'alert_new') {
              fetchStatus();
            }
          } catch {
            /* ignore bad messages */
          }
        };
      } catch {
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      ws?.close();
      clearTimeout(reconnectTimer);
    };
  }, [fetchStatus]);

  useEffect(() => {
    fetchStatus();
    // Fallback polling if WS not connected
    const interval = setInterval(() => {
      if (!wsConnected) fetchStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus, wsConnected]);

  // ─── Actions ────────────────────────────────────────────────
  const triggerCrawl = async (sourceId: string) => {
    setCrawling(sourceId);
    try {
      await fetch('/api/sonnar/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      });
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      console.error('[Sonar] Crawl error:', err);
    } finally {
      setCrawling(null);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch('/api/sonnar/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'acknowledge' }),
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a)));
    } catch (err) {
      console.error('[Sonar] Ack error:', err);
    }
  };

  // ─── Derived data ───────────────────────────────────────────
  const { regionCounts, maxRegionCount } = useMemo(() => {
    const counts = signals.reduce<Record<string, number>>((acc, s) => {
      const region = s.source.id.split('-')[0].toUpperCase();
      const key = KNOWN_REGIONS.has(region) ? region : '3P';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return {
      regionCounts: counts,
      maxRegionCount: Math.max(...Object.values(counts), 1),
    };
  }, [signals]);

  const { topicBarData, maxTopicCount } = useMemo(() => {
    const data = topics.slice(0, 10).map((t) => t.count);
    return {
      topicBarData: data,
      maxTopicCount: Math.max(...data, 1),
    };
  }, [topics]);

  const unackAlerts = useMemo(() => alerts.filter((a) => !a.acknowledged), [alerts]);
  const criticalAlerts = useMemo(
    () => unackAlerts.filter((a) => a.severity === 'critical' || a.severity === 'high'),
    [unackAlerts],
  );

  const filteredSignals = useMemo(() => {
    if (regionFilter === 'all') return signals;
    return signals.filter((s) => {
      const region = s.source.id.split('-')[0].toUpperCase();
      const key = KNOWN_REGIONS.has(region) ? region : '3P';
      return key === regionFilter;
    });
  }, [signals, regionFilter]);

  const anomalySignalCount = useMemo(() => signals.filter((s) => s.anomaly).length, [signals]);
  const anomalySignalTrend = useMemo(
    () => (anomalySignalCount > 0 ? 'up' : 'neutral'),
    [anomalySignalCount],
  );

  // ─── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: SOLID_CARD_TOKENS.bg,
          color: SOLID_CARD_TOKENS.textPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p style={{ color: SOLID_CARD_TOKENS.textSecondary }}>ESGSonar 初始化中...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: SOLID_CARD_TOKENS.bg,
        color: SOLID_CARD_TOKENS.textPrimary,
      }}
    >
      {/* ─── Header ─── */}
      <header
        style={{
          borderBottom: `1px solid ${SOLID_CARD_TOKENS.border}`,
          background: SOLID_CARD_TOKENS.surface,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${SOLID_CARD_TOKENS.teal}, ${SOLID_CARD_TOKENS.zkpBlue})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '18px',
                color: '#fff',
              }}
            >
              S
            </div>
            <div>
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  margin: 0,
                  color: SOLID_CARD_TOKENS.teal,
                }}
              >
                ESGSonar — ESGGO ∞ Evolution
              </h1>
              <p style={{ fontSize: '12px', color: SOLID_CARD_TOKENS.textSecondary, margin: 0 }}>
                ESG 法規信號雷達 — 20 源監控 · 永續發展無限進化
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: wsConnected ? SOLID_CARD_TOKENS.success : SOLID_CARD_TOKENS.error,
                }}
              />
              <span style={{ fontSize: '12px', color: SOLID_CARD_TOKENS.textSecondary }}>
                {wsConnected ? 'WS 即時' : '輪詢 30s'}
              </span>
            </div>
            {criticalAlerts.length > 0 && (
              <Badge variant="error">{criticalAlerts.length} 嚴重</Badge>
            )}
            {wsEvents.length > 0 && (
              <span style={{ fontSize: '12px', color: SOLID_CARD_TOKENS.textMuted }}>
                事件: {wsEvents.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ─── Tabs ─── */}
      <nav
        style={{
          borderBottom: `1px solid ${SOLID_CARD_TOKENS.border}`,
          background: SOLID_CARD_TOKENS.surface,
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '24px' }}>
          {SONNAR_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 0',
                fontSize: '14px',
                fontWeight: 600,
                color: activeTab === tab ? SOLID_CARD_TOKENS.teal : SOLID_CARD_TOKENS.textSecondary,
                background: 'none',
                border: 'none',
                borderBottomWidth: '2px',
                borderBottomStyle: 'solid',
                borderBottomColor: activeTab === tab ? SOLID_CARD_TOKENS.teal : 'transparent',
                cursor: 'pointer',
              }}
            >
              {tab === 'overview' && '信號雷達'}
              {tab === 'crawl' && '爬蟲控制'}
              {tab === 'alerts' &&
                `異常警報${unackAlerts.length > 0 ? ` (${unackAlerts.length})` : ''}`}
            </button>
          ))}
        </div>
      </nav>

      {/* ESGGO Sonnar 進化 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          marginTop: 16,
          marginBottom: 16,
          background: `rgba(212,175,55,0.12)`,
          border: `1px solid rgba(212,175,55,0.4)`,
          borderRadius: 12,
          padding: 14,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: SOLID_CARD_TOKENS.textSecondary }}>🧬 ESGGO Sonnar 進化</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              <div>
                <div style={{ fontSize: 10, color: SOLID_CARD_TOKENS.textMuted }}>LEVEL</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: SOLID_CARD_TOKENS.gold }}>{evolution.level}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: SOLID_CARD_TOKENS.textMuted }}>XP</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: SOLID_CARD_TOKENS.teal }}>{evolution.xp}/{evolution.nextXp}</div>
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              if (evolving) return;
              setEvolving(true);
              try {
                await new Promise(r => setTimeout(r, 500));
                setEvolution(prev => {
                  const xp = prev.xp + 20;
                  let level = prev.level;
                  let nextXp = prev.nextXp;
                  while (xp >= nextXp) { level += 1; nextXp = Math.floor(nextXp * 1.2); }
                  return { level, xp: xp % nextXp, nextXp };
                });
              } finally { setEvolving(false); }
            }}
            disabled={evolving}
            style={{
              padding: '8px 18px',
              background: evolving ? '#E2E8F0' : 'rgba(212,175,55,0.18)',
              color: SOLID_CARD_TOKENS.gold,
              border: `1px solid rgba(212,175,55,0.5)`,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: evolving ? 'not-allowed' : 'pointer',
              opacity: evolving ? 0.7 : 1,
            }}
          >
            {evolving ? '🧬 進化中...' : '🧬 啟動 Sonnar 進化'}
          </button>
        </div>
      </div>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* ═══ Overview Tab ═══ */}
        {activeTab === 'overview' && (
          <>
            {/* ─── Summary KPI Row ─── */}
            <Grid columns={4} gap={16} style={{ marginBottom: '24px' }}>
              <MetricCard label="監控來源" value={signals.length} unit="源" />
              <MetricCard label="異常信號" value={anomalySignalCount} trend={anomalySignalTrend} />
              <MetricCard
                label="未讀警報"
                value={unackAlerts.length}
                trend={unackAlerts.length > 0 ? 'up' : 'neutral'}
              />
              <MetricCard label="主題數" value={topics.length} />
            </Grid>

            {/* ─── Region Distribution Chart ─── */}
            <SolidCard>
              <CardHeader title="來源區域分佈" />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '12px',
                  textAlign: 'center',
                }}
              >
                {Object.entries(REGION_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <p
                      style={{
                        fontSize: '11px',
                        color: SOLID_CARD_TOKENS.textSecondary,
                        marginBottom: '4px',
                      }}
                    >
                      {label}
                    </p>
                    <div
                      style={{
                        height: '80px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          borderRadius: '4px 4px 0 0',
                          height: `${((regionCounts[key] || 0) / maxRegionCount) * 100}%`,
                          minHeight: regionCounts[key] ? '4px' : '0',
                          background:
                            key === 'TW'
                              ? SOLID_CARD_TOKENS.teal
                              : key === 'EU'
                                ? SOLID_CARD_TOKENS.zkpBlue
                                : key === 'INT'
                                  ? SOLID_CARD_TOKENS.gold
                                  : key === 'US'
                                    ? '#F59E0B'
                                    : key === 'AP'
                                      ? '#EC4899'
                                      : SOLID_CARD_TOKENS.textMuted,
                          transition: 'height 0.5s',
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>
                      {regionCounts[key] || 0}
                    </p>
                  </div>
                ))}
              </div>
            </SolidCard>

            {/* ─── Region Filter ─── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
              <Button
                variant={regionFilter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setRegionFilter('all')}
              >
                全部
              </Button>
              {Object.entries(REGION_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  variant={regionFilter === key ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setRegionFilter(key)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* ─── Signal Cards (with sparkline) ─── */}
            <Grid columns={3} gap={16}>
              {filteredSignals.map((signal) => (
                <SolidCard key={signal.source.id} variant={signal.anomaly ? 'warning' : 'default'}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {signal.source.name}
                    </h3>
                    {signal.anomaly && <Badge variant="warning">⚠ 異常</Badge>}
                  </div>

                  {/* Sparkline */}
                  <Sparkline data={signalHistory[signal.source.id] || []} />

                  {/* Signal bar */}
                  <div style={{ marginTop: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: SOLID_CARD_TOKENS.textSecondary,
                        marginBottom: '4px',
                      }}
                    >
                      <span>信號強度</span>
                      <span>{signal.signalStrength}%</span>
                    </div>
                    <ProgressBar
                      value={signal.signalStrength}
                      color={
                        signal.signalStrength > 80
                          ? SOLID_CARD_TOKENS.error
                          : signal.signalStrength > 50
                            ? SOLID_CARD_TOKENS.warning
                            : SOLID_CARD_TOKENS.teal
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '12px',
                      color: SOLID_CARD_TOKENS.textSecondary,
                      marginTop: '8px',
                    }}
                  >
                    <span>
                      新增:{' '}
                      <span style={{ color: SOLID_CARD_TOKENS.success }}>{signal.newItems}</span>
                    </span>
                    <span>
                      變動:{' '}
                      <span style={{ color: SOLID_CARD_TOKENS.warning }}>
                        {signal.changedItems}
                      </span>
                    </span>
                  </div>

                  {signal.topics.length > 0 && (
                    <div
                      style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}
                    >
                      {signal.topics.slice(0, 4).map((t) => (
                        <Badge key={t} variant="muted" size="sm">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </SolidCard>
              ))}
            </Grid>

            {/* ─── Topic Bar Chart ─── */}
            <SolidCard>
              <CardHeader title="ESG 主題趨勢" />
              {topics.length > 0 ? (
                <div>
                  <BarChart data={topicBarData} maxVal={maxTopicCount} color="bg-teal-500" />
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(topics.length, 10)}, 1fr)`,
                      marginTop: '12px',
                    }}
                  >
                    {topics.slice(0, 10).map((t) => (
                      <div key={t.topic} style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: SOLID_CARD_TOKENS.textPrimary }}>
                          {t.topic}
                        </span>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            color: SOLID_CARD_TOKENS.textMuted,
                          }}
                        >
                          {TREND_ICONS[t.trend]} {t.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: SOLID_CARD_TOKENS.textMuted, fontSize: '14px' }}>尚無主題資料</p>
              )}
            </SolidCard>

            {/* ─── WS Event Log ─── */}
            {wsEvents.length > 0 && (
              <SolidCard>
                <CardHeader title="即時事件流" />
                <div style={{ maxHeight: '128px', overflowY: 'auto' }}>
                  {wsEvents
                    .slice(-10)
                    .reverse()
                    .map((ev, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                          color: SOLID_CARD_TOKENS.textSecondary,
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ color: SOLID_CARD_TOKENS.textMuted }}>
                          {new Date(ev.ts).toLocaleTimeString()}
                        </span>
                        <Badge
                          variant={
                            ev.type === 'alert_new'
                              ? 'error'
                              : ev.type === 'crawl_complete'
                                ? 'success'
                                : 'muted'
                          }
                          size="sm"
                        >
                          {ev.type}
                        </Badge>
                      </div>
                    ))}
                </div>
              </SolidCard>
            )}
          </>
        )}

        {/* ═══ Crawl Control Tab ═══ */}
        {activeTab === 'crawl' && (
          <Section title="爬蟲控制" subtitle="管理 ESGSonar 所有法規來源的排程與手動執行">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div />
              <Button
                variant="primary"
                onClick={async () => {
                  setCrawling('all');
                  try {
                    await fetch('/api/sonnar/crawl', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ all: true }),
                    });
                    setTimeout(fetchStatus, 3000);
                  } finally {
                    setCrawling(null);
                  }
                }}
                disabled={crawling !== null}
              >
                {crawling === 'all' ? '執行中...' : '全部執行'}
              </Button>
            </div>

            {/* Group by region */}
            {['tw', 'eu', 'int', 'us', 'ap', '3p'].map((region) => {
              const regionSources = sources.filter((s) => s.sourceId.startsWith(region));
              if (regionSources.length === 0) return null;
              return (
                <div key={region} style={{ marginBottom: '16px' }}>
                  <h3
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: SOLID_CARD_TOKENS.textSecondary,
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    {REGION_LABELS[region.toUpperCase()] || region}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {regionSources.map((source) => (
                      <SolidCard key={source.sourceId}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
                                {source.sourceName}
                              </h4>
                              <span
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: source.enabled
                                    ? SOLID_CARD_TOKENS.success
                                    : SOLID_CARD_TOKENS.textMuted,
                                }}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                color: SOLID_CARD_TOKENS.textMuted,
                                marginTop: '2px',
                              }}
                            >
                              運行 {source.totalRuns} 次 · 成功 {source.successfulRuns} · 失敗{' '}
                              {source.failedRuns}
                              {source.lastItemsFound !== undefined &&
                                ` · 上次 ${source.lastItemsFound} 項`}
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => triggerCrawl(source.sourceId)}
                            disabled={crawling !== null || !source.enabled}
                          >
                            {crawling === source.sourceId ? '爬取中...' : '立即爬取'}
                          </Button>
                        </div>
                      </SolidCard>
                    ))}
                  </div>
                </div>
              );
            })}
          </Section>
        )}

        {/* ═══ Alerts Tab ═══ */}
        {activeTab === 'alerts' && (
          <Section title="異常警報" subtitle={`未讀: ${unackAlerts.length} / 共 ${alerts.length}`}>
            {/* Severity filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                <Button
                  key={sev}
                  variant={sev === severityFilter ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSeverityFilter(sev)}
                >
                  {sev === 'all' ? '全部' : sev.toUpperCase()}
                  {sev !== 'all' && ` (${alerts.filter((a) => a.severity === sev).length})`}
                </Button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts
                .filter((a) => severityFilter === 'all' || a.severity === severityFilter)
                .map((alert) => (
                <SolidCard key={alert.id} variant={alert.acknowledged ? 'default' : 'highlight'}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Badge variant={SEVERITY_VARIANTS[alert.severity] || 'muted'}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span style={{ fontSize: '12px', color: SOLID_CARD_TOKENS.textSecondary }}>
                          {alert.sourceName}
                        </span>
                        <span style={{ fontSize: '12px', color: SOLID_CARD_TOKENS.textMuted }}>
                          {alert.alertType}
                        </span>
                        <span style={{ fontSize: '12px', color: SOLID_CARD_TOKENS.textMuted }}>
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>
                        {alert.title}
                      </h3>
                      <p
                        style={{
                          fontSize: '13px',
                          color: SOLID_CARD_TOKENS.textSecondary,
                          margin: 0,
                        }}
                      >
                        {alert.summary}
                      </p>
                    </div>
                    {!alert.acknowledged && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        確認
                      </Button>
                    )}
                  </div>
                </SolidCard>
              ))}
              {alerts.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '48px 0',
                    color: SOLID_CARD_TOKENS.textMuted,
                  }}
                >
                  目前無異常警報 ✅
                </div>
              )}
            </div>
          </Section>
        )}
      </main>
    </div>
  );
}
