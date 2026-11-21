// Omni-Blueprint Hub — Plugin Registry (5T Gate + Lifecycle)
// 無作: 註冊失敗靜默略過; 啟用失敗標 errored 不崩
// 圓通: 鉤子廣播給所有 enabled 外掛; Trustworthy: 每筆註冊附 hashLock
import crypto from 'crypto';
import type {
  HubPlugin,
  PluginManifest,
  PluginContext,
  HubHook,
  RegistryEntry,
  PluginPhase,
} from './plugin-types.js';
import type { UnifiedBlueprintEntity } from './core-types.js';

export class PluginRegistry {
  private entries = new Map<string, RegistryEntry>();
  private ctx: PluginContext | null = null;
  private readonly strict: boolean;

  constructor(opts?: { strict?: boolean }) {
    this.strict = opts?.strict ?? false;
  }

  /** 綁定 Hub 上下文 (由 OmniBlueprintHub / monitor-server 呼叫) */
  bindContext(ctx: PluginContext): void {
    this.ctx = ctx;
  }

  /** 5T Gate: 外掛 manifest 必須聲明全 5T 且過基本結構檢查 */
  private passes5TGate(m: PluginManifest): { ok: boolean; failed: string[] } {
    const failed: string[] = [];
    if (!m.pluginId || !m.name || !m.version) failed.push('manifest:missing-id/name/version');
    const t = m.fiveT;
    if (!t.traceable) failed.push('traceable');
    if (!t.trackable) failed.push('trackable');
    if (!t.tangible) failed.push('tangible');
    if (!t.transparent) failed.push('transparent');
    if (!t.trustworthy) failed.push('trustworthy');
    if (!Array.isArray(m.hooks) || m.hooks.length === 0) failed.push('hooks:empty');
    return { ok: failed.length === 0, failed };
  }

  /** 註冊外掛 (strict 模式下未過 5T Gate 則拒絕, 返回 false) */
  register(plugin: HubPlugin): boolean {
    const m = plugin.manifest;
    const gate = this.passes5TGate(m);
    if (!gate.ok) {
      if (this.strict) {
        plugin.manifest.evidence.push({
          originCause: 'PluginRegistry.register',
          processTrace: ['5T gate failed'],
          finalEffect: `rejected: ${gate.failed.join(',')}`,
        });
        return false; // 結界阻斷
      }
      // loose: 仍註冊但標記, 允許後續補強
    }
    const hashLock = crypto
      .createHash('sha256')
      .update(JSON.stringify(m))
      .digest('hex');
    plugin.manifest.hashLock = hashLock;
    this.entries.set(m.pluginId, {
      plugin,
      phase: 'registered',
      registeredAt: new Date().toISOString(),
    });
    return true;
  }

  /** 啟用外掛 (呼叫 enable, 失敗標 errored 不拋) */
  async enable(pluginId: string): Promise<boolean> {
    const entry = this.entries.get(pluginId);
    if (!entry || !this.ctx) return false;
    try {
      const ok = await entry.plugin.enable(this.ctx);
      entry.phase = ok ? 'enabled' : 'errored';
      if (!ok) entry.lastError = 'enable() returned false';
      return ok;
    } catch (e) {
      entry.phase = 'errored';
      entry.lastError = String((e as Error)?.message ?? e);
      return false; // 無作: 不向上拋
    }
  }

  /** 停用外掛 */
  async disable(pluginId: string): Promise<boolean> {
    const entry = this.entries.get(pluginId);
    if (!entry) return false;
    try {
      await entry.plugin.disable();
      entry.phase = 'disabled';
      return true;
    } catch {
      entry.phase = 'errored';
      return false;
    }
  }

  /** 卸載 (disable + 移除) */
  async unload(pluginId: string): Promise<boolean> {
    const entry = this.entries.get(pluginId);
    if (!entry) return false;
    if (entry.phase === 'enabled') await this.disable(pluginId);
    this.entries.delete(pluginId);
    return true;
  }

  /** 廣播鉤子事件給所有 enabled 外掛 (圓通無礙) */
  async emit(hook: HubHook, payload: unknown): Promise<void> {
    if (!this.ctx) return;
    for (const entry of this.entries.values()) {
      if (entry.phase !== 'enabled' || !entry.plugin.onHook) continue;
      if (!entry.plugin.manifest.hooks.includes(hook)) continue;
      try {
        await entry.plugin.onHook(hook, payload, this.ctx);
      } catch (e) {
        entry.lastError = String((e as Error)?.message ?? e);
        entry.phase = 'errored'; // 單外掛錯不中斷其他 (無礙)
      }
    }
  }

  /** 列出已註冊外掛 (Transparent) */
  list(): Array<{ pluginId: string; name: string; phase: PluginPhase; hooks: HubHook[] }> {
    return Array.from(this.entries.values()).map((e) => ({
      pluginId: e.plugin.manifest.pluginId,
      name: e.plugin.manifest.name,
      phase: e.phase,
      hooks: e.plugin.manifest.hooks,
    }));
  }

  /** 健康彙總 (Trustworthy + Transparent) */
  health(): { total: number; enabled: number; errored: number; entries: RegistryEntry[] } {
    let enabled = 0;
    let errored = 0;
    for (const e of this.entries.values()) {
      if (e.phase === 'enabled') enabled++;
      if (e.phase === 'errored') errored++;
    }
    return { total: this.entries.size, enabled, errored, entries: Array.from(this.entries.values()) };
  }

  /** 取得單一資料表 (委轉) */
  getUnifiedTable(): UnifiedBlueprintEntity[] {
    return this.ctx?.getUnifiedTable() ?? [];
  }
}
