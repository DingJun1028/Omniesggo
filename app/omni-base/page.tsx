/**
 * OmniBase Plugin Manager — 外掛管理頁面
 * Page /omni-base — Plugin registry, enable/disable, health monitoring
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// Solid Card Tokens
const SC = {
  bg: '#0A0F1A',
  surface: '#111827',
  surfaceHover: '#1E293B',
  border: '#1E3A5F',
  teal: '#009EB0',
  gold: '#D4AF37',
  zkp: '#3B82F6',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
};

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  lifecycle: string;
  hooks: string[];
}

interface HealthInfo {
  id: string;
  status: string;
  message?: string;
}

const LIFECYCLE_LABELS: Record<string, { label: string; color: string }> = {
  registered: { label: '已註冊', color: SC.textMuted },
  loaded: { label: '已載入', color: SC.zkp },
  enabled: { label: '已啟用', color: SC.success },
  disabled: { label: '已停用', color: SC.warning },
  error: { label: '錯誤', color: SC.error },
};

function PluginCard({ plugin, health, onAction }: {
  plugin: PluginInfo;
  health?: HealthInfo;
  onAction: (id: string, action: string) => void;
}) {
  const lc = LIFECYCLE_LABELS[plugin.lifecycle] || LIFECYCLE_LABELS.registered;
  const isPluginEnabled = plugin.lifecycle === 'enabled';

  return (
    <div style={{
      background: SC.surface,
      border: `1px solid ${SC.border}`,
      borderRadius: 12,
      padding: 20,
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: SC.text, margin: 0 }}>
            {plugin.name}
          </h3>
          <span style={{ fontSize: 12, color: SC.textMuted }}>{plugin.id}</span>
        </div>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 6,
          background: `${lc.color}22`,
          color: lc.color,
        }}>
          {lc.label}
        </span>
      </div>

      <p style={{ fontSize: 13, color: SC.textSecondary, margin: '8px 0', lineHeight: 1.5 }}>
        {plugin.description}
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
        {plugin.hooks.map((hook, i) => (
          <span key={i} style={{
            fontSize: 11,
            padding: '2px 8px',
            background: `${SC.teal}15`,
            color: SC.teal,
            borderRadius: 4,
          }}>
            {hook}
          </span>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTop: `1px solid ${SC.border}`,
      }}>
        <span style={{ fontSize: 12, color: SC.textMuted }}>
          v{plugin.version}
          {health && health.status !== plugin.lifecycle && (
            <span style={{ marginLeft: 8, color: health.status === 'healthy' ? SC.success : SC.error }}>
              ● {health.status}
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onAction(plugin.id, isPluginEnabled ? 'disable' : 'enable')}
            style={{
              padding: '5px 12px',
              background: isPluginEnabled ? SC.warning : SC.teal,
              color: isPluginEnabled ? SC.bg : SC.bg,
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isPluginEnabled ? '停用' : '啟用'}
          </button>
          <button
            onClick={() => onAction(plugin.id, 'reload')}
            style={{
              padding: '5px 12px',
              background: 'transparent',
              color: SC.zkp,
              border: `1px solid ${SC.zkp}`,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            重載
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OmniBasePage() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [health, setHealth] = useState<HealthInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchPlugins = useCallback(async () => {
    try {
      const res = await fetch('/api/omni/plugins', { cache: 'no-store' });
      const response: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const message = response && typeof response === 'object' && 'error' in response
          ? String(response.error)
          : `Plugin API returned ${res.status}`;
        throw new Error(message);
      }
      // jsonResponse wraps endpoint payloads as { success, data }, while allowing
      // direct payloads too for compatibility with older handlers.
      const envelope = response && typeof response === 'object'
        ? response as { success?: unknown; data?: unknown }
        : null;
      const data = envelope && envelope.data && typeof envelope.data === 'object'
        ? envelope.data
        : response;
      if (data && typeof data === 'object' && 'success' in data && data.success) {
        const payload = data as { plugins?: unknown; health?: unknown };
        const safePlugins = Array.isArray(payload.plugins)
          ? payload.plugins
              .filter((plugin): plugin is Record<string, unknown> => !!plugin && typeof plugin === 'object')
              .map((plugin) => ({
                id: String(plugin.id ?? ''),
                name: String(plugin.name ?? '未命名外掛'),
                version: String(plugin.version ?? '—'),
                description: String(plugin.description ?? ''),
                lifecycle: String(plugin.lifecycle ?? 'registered'),
                hooks: Array.isArray(plugin.hooks) ? plugin.hooks.map(String) : [],
              }))
              .filter((plugin) => plugin.id.length > 0)
          : [];
        const safeHealth = Array.isArray(payload.health)
          ? payload.health.filter((item): item is HealthInfo => !!item && typeof item === 'object' && 'id' in item && 'status' in item)
          : [];
        setPlugins(safePlugins);
        setHealth(safeHealth);
        setLoadError(null);
      } else {
        const errorMessage = data && typeof data === 'object' && 'error' in data
          ? String(data.error ?? 'Plugin API returned an invalid response')
          : 'Plugin API returned an invalid response';
        throw new Error(errorMessage);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setLoadError(message);
      console.error('Failed to fetch plugins:', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  const handleAction = async (id: string, action: string) => {
    try {
      setActioning(id);
      setActionError(null);
      const res = await fetch('/api/omni/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId: id, action }),
      });
      const response: unknown = await res.json().catch(() => null);
      const envelope = response && typeof response === 'object'
        ? response as { success?: unknown; data?: unknown; error?: unknown }
        : null;
      const data = envelope?.data && typeof envelope.data === 'object'
        ? envelope.data as { success?: unknown; error?: unknown }
        : envelope;
      if (!res.ok || !data?.success) {
        throw new Error(typeof data?.error === 'string' ? data.error : `Plugin action failed (${res.status})`);
      }
      await fetchPlugins();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setActionError(message);
    } finally {
      setActioning(null);
    }
  };

  // Keep the render path resilient even if state is populated by an unexpected payload.
  const pluginList = Array.isArray(plugins) ? plugins : [];
  const healthList = Array.isArray(health) ? health : [];
  const enabledCount = pluginList.filter(p => p.lifecycle === 'enabled').length;
  const totalHooks = pluginList.reduce((sum, p) => sum + (Array.isArray(p.hooks) ? p.hooks.length : 0), 0);

  return (
    <div style={{ background: SC.bg, minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          borderBottom: `1px solid ${SC.border}`,
          paddingBottom: 16,
          marginBottom: 24,
        }}>
          <h1 style={{ color: SC.text, fontSize: 24, fontWeight: 700 }}>
            🔌 萬能基地 — ESGGO ∞ Evolution
          </h1>
          <p style={{ color: SC.textSecondary, fontSize: 14, marginTop: 4 }}>
            萬能基地 · EventBus-driven · Hot-reload · 永續發展無限進化
          </p>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 13, color: SC.textMuted }}>
            <span>📦 外掛 <strong style={{ color: SC.teal }}>{pluginList.length}</strong></span>
            <span>✅ 啟用 <strong style={{ color: SC.success }}>{enabledCount}</strong></span>
            <span>🪝 Hooks <strong style={{ color: SC.gold }}>{totalHooks}</strong></span>
          </div>
        </header>

        {/* Plugin List */}
        {actionError && (
          <div role="alert" style={{ marginBottom: 16, color: SC.error, background: SC.surface, border: `1px solid ${SC.error}66`, borderRadius: 8, padding: 12 }}>
            外掛操作失敗：{actionError}
          </div>
        )}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: SC.teal }}>
            載入外掛列表中...
          </div>
        ) : loadError ? (
          <div role="alert" style={{
            background: SC.surface,
            border: `1px solid ${SC.error}66`,
            borderRadius: 12,
            padding: 24,
            color: SC.textSecondary,
          }}>
            <strong style={{ display: 'block', color: SC.error, marginBottom: 6 }}>外掛清單載入失敗</strong>
            <span style={{ fontSize: 13 }}>{loadError}</span>
            <button onClick={fetchPlugins} style={{ display: 'block', marginTop: 14, padding: '7px 12px', background: SC.teal, color: SC.bg, border: 0, borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>重新載入</button>
          </div>
        ) : pluginList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pluginList.map(plugin => (
              <div key={plugin.id} aria-busy={actioning === plugin.id} style={{ opacity: actioning === plugin.id ? 0.65 : 1, pointerEvents: actioning === plugin.id ? 'none' : 'auto' }}>
                <PluginCard
                  plugin={plugin}
                  health={healthList.find(h => h.id === plugin.id)}
                  onAction={handleAction}
                />
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            background: SC.surface,
            border: `1px solid ${SC.border}`,
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            color: SC.textMuted,
          }}>
            尚無外掛註冊
          </div>
        )}

        {/* Architecture Note */}
        <div style={{
          marginTop: 32,
          background: SC.surface,
          border: `1px solid ${SC.border}`,
          borderRadius: 12,
          padding: 20,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: SC.gold, marginBottom: 8 }}>
            🏗️ 架構說明
          </h3>
          <ul style={{ fontSize: 13, color: SC.textSecondary, lineHeight: 1.8, paddingLeft: 20 }}>
            <li>所有外掛透過 EventBus 訂閱事件，實現鬆耦合通訊</li>
            <li>生命週期：registered → loaded → enabled → disabled / error</li>
            <li>支援 hot-reload：無需重啟即可啟用/停用/重載外掛</li>
            <li>內建 4 個核心外掛：Logger、Metrics、Alerter、TagCache</li>
            <li>未來可動態載入第三方外掛（需實作 PluginLoader）</li>
          </ul>
        </div>
      </div>
    </div>
  );
}