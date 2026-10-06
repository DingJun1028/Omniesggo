/**
 * Rune Engrafting Plugin API Standard — 符文鑲嵌插件 API 標準 (PRD F-08 / M4)
 *
 * 驗證需求: OMN-PRD-001 §4.1 FR-07 插件擴展 → F-08 符文鑲嵌插件 API
 * 驗證方法: 插件 SDK 測試 — manifest 契約校驗 + registry 生命週期
 */

import { describe, it, expect } from 'vitest';
import {
  validateRuneManifest,
  describeRuneContract,
  RUNE_CONTRACT_VERSION,
  type RuneManifest,
} from '../src/lib/omni-base/rune-contract';
import {
  getPluginRegistry,
  getEventBus,
  OmniPluginRegistry,
  type OmniPlugin,
  type PluginManifest,
} from '../src/lib/omni-base/plugin-registry';

const validManifest = (overrides: Partial<RuneManifest> = {}): RuneManifest => ({
  id: 'acme/esg-widget',
  name: 'ESG Widget',
  version: '1.2.3',
  description: 'Renders an ESG score widget on the dashboard.',
  author: 'Acme',
  hooks: ['tag:created', 'system:error'],
  permissions: ['read:tags'],
  config: { theme: 'liquid-glass' },
  ...overrides,
});

function makePlugin(manifest: Partial<PluginManifest>, id?: string): OmniPlugin {
  return {
    manifest: { ...validManifest(), ...manifest, ...(id ? { id } : {}) } as unknown as PluginManifest,
    lifecycle: 'registered',
  };
}

describe('符文鑲嵌 Rune Engrafting — manifest 契約 (contract validation)', () => {
  it('accepts a compliant manifest and reports the contract version', () => {
    const result = validateRuneManifest(validManifest());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.contractVersion).toBe(RUNE_CONTRACT_VERSION);
  });

  it('rejects a non-object manifest', () => {
    expect(validateRuneManifest(null).ok).toBe(false);
    expect(validateRuneManifest('esggo/logger').ok).toBe(false);
    expect(validateRuneManifest(undefined).ok).toBe(false);
  });

  it('rejects an id that is not an "author/name" slug', () => {
    expect(validateRuneManifest(validManifest({ id: 'noshslash' })).errors.join()).toContain('id:');
    expect(validateRuneManifest(validManifest({ id: 'Acme/Widget' })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ id: 'acme/my widget' })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ id: '' })).ok).toBe(false);
  });

  it('rejects non-semver versions', () => {
    for (const version of ['1.0', 'v1.0.0', 'latest', '', '1.0.0.0']) {
      const result = validateRuneManifest(validManifest({ version }));
      expect(result.ok, `version=${version}`).toBe(false);
      expect(result.errors.join()).toContain('version:');
    }
  });

  it('rejects missing or oversized name/description', () => {
    expect(validateRuneManifest(validManifest({ name: '' })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ description: '' })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ name: 'x'.repeat(81) })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ description: 'x'.repeat(281) })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ name: 'bad\u0007name' })).ok).toBe(false);
  });

  it('requires hooks and validates every hook token', () => {
    const missing = validManifest() as Partial<RuneManifest>;
    delete missing.hooks;
    expect(validateRuneManifest(missing).errors.join()).toContain('hooks:');

    expect(validateRuneManifest(validManifest({ hooks: 'tag:created' as unknown as string[] })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ hooks: ['has space'] })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ hooks: ['ok', ''] })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ hooks: Array(65).fill('tag:x') })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ hooks: [] })).ok).toBe(true);
  });

  it('validates optional permissions, dependencies and config', () => {
    expect(validateRuneManifest(validManifest({ permissions: ['read tags'] })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ dependencies: ['not-a-rune-id'] })).ok).toBe(false);
    expect(validateRuneManifest(validManifest({ dependencies: ['acme/base'] })).ok).toBe(true);
    expect(validateRuneManifest(validManifest({ config: [] as unknown as Record<string, unknown> })).ok).toBe(false);
  });

  it('describes its own limits (self-describing standard)', () => {
    const contract = describeRuneContract();
    expect(contract.contractVersion).toBe(RUNE_CONTRACT_VERSION);
    expect(contract.idFormat).toContain('author/name');
    expect(contract.versionFormat).toContain('semver');
    expect(contract.limits.hooks).toBeGreaterThan(0);
  });
});

describe('符文鑲嵌 Rune Engrafting — registry 准入 (admission control)', () => {
  it('every built-in plugin manifest satisfies the rune contract', async () => {
    const registry = getPluginRegistry();
    const manifests = registry.list().map((p) => p);
    expect(manifests.length).toBeGreaterThanOrEqual(4);

    for (const entry of registry.list()) {
      const full = registry.get(entry.id);
      const result = validateRuneManifest(full?.manifest);
      expect(result.ok, `${entry.id}: ${result.errors.join('; ')}`).toBe(true);
    }
  });

  it('rejects a non-compliant manifest and marks the plugin as error', async () => {
    const registry = getPluginRegistry();
    let captured: Error | undefined;
    const plugin = makePlugin({ version: 'not-semver' }, 'acme/broken-rune');
    plugin.onError = (error: Error) => {
      captured = error;
    };

    const accepted = await registry.register(plugin);

    expect(accepted).toBe(false);
    expect(plugin.lifecycle).toBe('error');
    expect(captured?.message).toContain('Rune contract violated');
    expect(registry.get('acme/broken-rune')).toBeUndefined();
  });

  it('rejects a duplicate plugin id', async () => {
    const registry = getPluginRegistry();
    const builtinId = registry.list()[0]?.id;
    expect(builtinId).toBeTruthy();

    const duplicate = makePlugin({}, `${builtinId}`);
    const accepted = await registry.register(duplicate);
    expect(accepted).toBe(false);
  });

  it('rejects a plugin whose dependency is not engrafted', async () => {
    const registry = new OmniPluginRegistry(getEventBus());

    const orphan = makePlugin({ dependencies: ['acme/does-not-exist'] }, 'acme/orphan-rune');
    const accepted = await registry.register(orphan);
    expect(accepted).toBe(false);
    expect(orphan.lifecycle).toBe('error');
    expect(registry.get('acme/orphan-rune')).toBeUndefined();
  });
});

describe('符文鑲嵌 Rune Engrafting — 生命週期 (lifecycle)', () => {
  it('engrafts, gates event delivery on enable/disable, reloads and unregisters', async () => {
    const registry = getPluginRegistry();
    const bus = getEventBus();
    const id = 'acme/lifecycle-rune';
    const emit = () => bus.publish('tag:sealed', { type: 'tag:sealed', payload: {} });
    let loaded = false;
    let enabled = 0;
    let disabled = 0;
    let delivered = 0;

    const plugin = makePlugin({ hooks: ['tag:sealed'] }, id);
    plugin.onLoad = () => {
      loaded = true;
    };
    plugin.onEnable = () => {
      enabled += 1;
    };
    plugin.onDisable = () => {
      disabled += 1;
    };
    plugin.handleEvent = () => {
      delivered += 1;
    };

    expect(await registry.register(plugin)).toBe(true);
    expect(loaded).toBe(true);
    expect(enabled).toBe(1);
    expect(plugin.lifecycle).toBe('enabled');
    expect(registry.getByHook('tag:sealed').map((p) => p.manifest.id)).toContain(id);

    emit();
    expect(delivered).toBe(1);

    await registry.disable(id);
    expect(disabled).toBe(1);
    expect(plugin.lifecycle).toBe('disabled');
    emit();
    expect(delivered, 'disabled plugins must not receive events').toBe(1);

    await registry.enable(id);
    expect(plugin.lifecycle).toBe('enabled');
    emit();
    expect(delivered).toBe(2);

    await registry.reload(id);
    expect(enabled, 'reload must not duplicate subscriptions').toBe(3);
    expect(plugin.lifecycle).toBe('enabled');
    emit();
    expect(delivered, 'exactly one delivery per publish after reload').toBe(3);

    const health = registry.getHealth().find((h) => h.id === id);
    expect(health).toBeDefined();

    await registry.unregister(id);
    expect(registry.get(id)).toBeUndefined();
    expect(registry.getByHook('tag:sealed').map((p) => p.manifest.id)).not.toContain(id);
    emit();
    expect(delivered, 'unregistered plugins are fully detached').toBe(3);
  });

  it('exposes manifest metadata through list() for the admin console', async () => {
    const registry = getPluginRegistry();
    const id = 'acme/metadata-rune';
    await registry.register(makePlugin({ hooks: ['tag:paired'] }, id));

    const entry = registry.list().find((p) => p.id === id);
    expect(entry).toMatchObject({
      id,
      name: 'ESG Widget',
      version: '1.2.3',
      hooks: ['tag:paired'],
      lifecycle: 'enabled',
    });

    await registry.unregister(id);
  });
});
