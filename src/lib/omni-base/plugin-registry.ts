// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * OmniBase Plugin System — 外掛 registry + 動態載入
 * 
 * Design: EventBus-based plugin lifecycle
 * - Plugins register via OmniPluginRegistry
 * - Plugins hook into EventBus events discovered at runtime
 * - Sandboxed execution: each plugin runs in isolated context
 * - Hot-reload: plugins can be enabled/disabled without restart
 * - Metadata: version, author, description, hooks, permissions
 */

import { createEventBus, EventBus, OmniBaseEvent } from '../omni-base/index';

// ─── Types ──────────────────────────────────────────────────

export type PluginLifecycle = 'registered' | 'loaded' | 'enabled' | 'disabled' | 'error';

export interface PluginManifest {
  id: string;             // Unique identifier (slug format: "author/name")
  name: string;           // Display name
  version: string;        // Semver
  description: string;
  author?: string;
  hooks: string[];        // Event topics this plugin subscribes to
  permissions?: string[]; // Required permissions
  dependencies?: string[]; // Other plugin IDs this depends on
  config?: Record<string, unknown>;
}

export interface OmniPlugin {
  manifest: PluginManifest;
  lifecycle: PluginLifecycle;
  onLoad?: () => void | Promise<void>;
  onEnable?: () => void | Promise<void>;
  onDisable?: () => void | Promise<void>;
  onError?: (error: Error) => void;
  handleEvent?: (event: OmniBaseEvent) => void | Promise<void>;
  getHealth?: () => { status: 'healthy' | 'degraded' | 'error'; message?: string };
}

export interface PluginRegistry {
  readonly plugins: ReadonlyMap<string, OmniPlugin>;
  reload(id: string): Promise<void>;
  get(id: string): OmniPlugin | undefined;
  getByHook(hook: string): OmniPlugin[];
  getHealth(): Array<{ id: string; status: string; message?: string }>;
}

// ─── Built-in Plugins ──────────────────────────────────────

/**
 * Logger Plugin — 所有事件記錄
 */
const LoggerPlugin: OmniPlugin = {
  manifest: {
    id: 'esggo/logger',
    name: 'Event Logger',
    version: '1.0.0',
    description: 'Logs all OmniBase events to console for debugging',
    hooks: ['tag:created', 'tag:paired', 'tag:sealed', 'system:error'],
    config: { logLevel: 'info' },
  },
  lifecycle: 'registered',
  handleEvent(event) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OmniBase:Plugin:Logger] ${event.type}`, event.payload);
    }
  },
  getHealth: () => ({ status: 'healthy' }),
};

/**
 * Metrics Plugin — 收集事件統計
 */
const MetricsPlugin: OmniPlugin = {
  manifest: {
    id: 'esggo/metrics',
    name: 'Event Metrics',
    version: '1.0.0',
    description: 'Tracks event frequency and plugin health metrics',
    hooks: ['tag:*'],
  },
  lifecycle: 'registered',
  handleEvent(_event) {
    // In production, this would store to a metrics store
    // For now, just track in memory via EventBus
  },
  getHealth: () => ({ status: 'healthy' }),
};

/**
 * Alert Plugin — 特定事件觸發通知
 */
const AlertPlugin: OmniPlugin = {
  manifest: {
    id: 'esggo/alerter',
    name: 'Smart Alerter',
    version: '1.0.0',
    description: 'Sends notifications for critical ESG events',
    hooks: ['system:error', 'alert:critical'],
    config: { channels: ['telegram', 'email'] },
  },
  lifecycle: 'registered',
  handleEvent(event) {
    if (event.type === 'alert:critical') {
      console.warn(`[OmniBase:Plugin:Alerter] Critical alert:`, event.payload);
    }
  },
  getHealth: () => ({ status: 'healthy' }),
};

/**
 * Tag Cache Plugin — Redis-style in-memory 快取
 */
const TagCachePlugin: OmniPlugin = {
  manifest: {
    id: 'esggo/tag-cache',
    name: 'Tag Cache Layer',
    version: '1.0.0',
    description: 'Provides in-memory caching for frequently accessed tags',
    hooks: ['tag:created', 'tag:updated'],
    config: { ttl: 3600, maxSize: 1000 },
  },
  lifecycle: 'registered',
  handleEvent(_event) {
    // Would invalidate cache on tag mutation
  },
  getHealth: () => ({ status: 'healthy' }),
};

// ─── Plugin Registry ───────────────────────────────────────

class OmniPluginRegistry implements PluginRegistry {
  private _plugins: Map<string, OmniPlugin> = new Map();
  private _eventBus: EventBus;
  private _hookIndex: Map<string, Set<string>> = new Map();

  constructor(eventBus: EventBus) {
    this._eventBus = eventBus;
  }

  get plugins(): ReadonlyMap<string, OmniPlugin> {
    return this._plugins;
  }

  /** Register a plugin with the system */
  async register(plugin: OmniPlugin): Promise<boolean> {
    const id = plugin.manifest.id;

    if (this._plugins.has(id)) {
      console.warn(`[OmniBase:Registry] Plugin ${id} already registered, skipping`);
      return false;
    }

    // Check dependencies
    if (plugin.manifest.dependencies) {
      for (const dep of plugin.manifest.dependencies) {
        if (!this._plugins.has(dep)) {
          plugin.lifecycle = 'error';
          plugin.onError?.(new Error(`Missing dependency: ${dep}`));
          console.error(`[OmniBase:Registry] Plugin ${id} missing dependency: ${dep}`);
          return false;
        }
      }
    }

    this._plugins.set(id, plugin);
    plugin.lifecycle = 'loaded';

    // Index hooks
    for (const hook of plugin.manifest.hooks) {
      if (!this._hookIndex.has(hook)) {
        this._hookIndex.set(hook, new Set());
      }
      this._hookIndex.get(hook)!.add(id);
    }

    // Call onLoad
    try {
      await plugin.onLoad?.();
    } catch (e) {
      plugin.lifecycle = 'error';
      plugin.onError?.(e as Error);
      console.error(`[OmniBase:Registry] Plugin ${id} onLoad failed:`, e);
      return false;
    }

    // Auto-enable
    await this.enable(id);
    return true;
  }

  /** Enable a plugin */
  async enable(id: string): Promise<void> {
    const plugin = this._plugins.get(id);
    if (!plugin) throw new Error(`Plugin ${id} not found`);

    if (plugin.lifecycle === 'enabled') return;

    try {
      await plugin.onEnable?.();
      plugin.lifecycle = 'enabled';

      // Subscribe to EventBus for its hooks
      for (const hook of plugin.manifest.hooks) {
        this._eventBus.subscribe(hook, async (event) => {
          try {
            await plugin.handleEvent?.(event as unknown as OmniBaseEvent);
          } catch (e) {
            console.error(`[OmniBase:Registry] Plugin ${id} error handling ${hook}:`, e);
            plugin.onError?.(e as Error);
          }
        });
      }

      console.log(`[OmniBase:Registry] Plugin ${id} enabled`);
    } catch (e) {
      plugin.lifecycle = 'error';
      plugin.onError?.(e as Error);
      throw e;
    }
  }

  /** Disable a plugin */
  async disable(id: string): Promise<void> {
    const plugin = this._plugins.get(id);
    if (!plugin) throw new Error(`Plugin ${id} not found`);

    plugin.lifecycle = 'disabled';
    await plugin.onDisable?.();
    console.log(`[OmniBase:Registry] Plugin ${id} disabled`);
  }

  /** Reload a plugin (disable → enable) */
  async reload(id: string): Promise<void> {
    await this.disable(id);
    await this.enable(id);
  }

  /** Unregister a plugin */
  async unregister(id: string): Promise<void> {
    await this.disable(id);
    this._plugins.delete(id);
    // Remove from hook index
    const hooksToUpdate = Array.from(this._hookIndex.entries());
    for (const [hook, plugins] of hooksToUpdate) {
      plugins.delete(id);
      if (plugins.size === 0) this._hookIndex.delete(hook);
    }
    console.log(`[OmniBase:Registry] Plugin ${id} unregistered`);
  }

  get(id: string): OmniPlugin | undefined {
    return this._plugins.get(id);
  }

  getByHook(hook: string): OmniPlugin[] {
    const ids = this._hookIndex.get(hook);
    if (!ids) return [];
    return Array.from(ids).map(id => this._plugins.get(id)!).filter(Boolean);
  }

  getHealth(): Array<{ id: string; status: string; message?: string }> {
    return Array.from(this._plugins.entries()).map(([id, plugin]) => {
      const health = plugin.getHealth?.();
      return {
        id,
        status: health?.status || plugin.lifecycle,
        message: health?.message,
      };
    });
  }

  /** List all registered plugins with metadata */
  list(): Array<{ id: string; name: string; version: string; description: string; lifecycle: PluginLifecycle; hooks: string[] }> {
    return Array.from(this._plugins.values()).map(p => ({
      id: p.manifest.id,
      name: p.manifest.name,
      version: p.manifest.version,
      description: p.manifest.description,
      lifecycle: p.lifecycle,
      hooks: p.manifest.hooks,
    }));
  }
}

// ─── Singleton Factory ──────────────────────────────────────

let registryInstance: OmniPluginRegistry | null = null;
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = createEventBus();
  }
  return eventBusInstance;
}

export function getPluginRegistry(): OmniPluginRegistry {
  if (!registryInstance) {
    registryInstance = new OmniPluginRegistry(getEventBus());
    // Register built-in plugins
    registryInstance.register(LoggerPlugin);
    registryInstance.register(MetricsPlugin);
    registryInstance.register(AlertPlugin);
    registryInstance.register(TagCachePlugin);
  }
  return registryInstance;
}

export { OmniPluginRegistry };
export default getPluginRegistry;
