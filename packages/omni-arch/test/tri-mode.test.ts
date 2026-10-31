import { describe, expect, it } from 'vitest';
import { OmniArchError } from '../src/types';
import {
  OmniAvatarCore,
  sealAvatarConfig,
  suggestMode,
  type AvatarConfig,
} from '../src/tri-mode';

const PHANTOM_CONFIG: AvatarConfig = {
  avatarId: 'ops-sentinel-01',
  displayName: 'Sentinel',
  baseMode: 'Phantom',
  triggerRules: { intents: ['execute'], userRole: 'sre', urgency: 'high' },
  cognitiveProfile: {
    systemPromptTemplate: 'ops_v1',
    tone: 'Precise, Terse',
    reasoningDepth: 'fast',
    creativityTemperature: 0.1,
  },
  interfaceConfig: { layoutEngine: 'headless', density: 'minimal', activeWidgets: [] },
  toolPermissions: {
    allow: ['read_logs', 'traceroute'],
    requireApproval: ['restart_service'],
    deny: ['delete_backup'],
  },
};

const GRID_CONFIG: AvatarConfig = {
  avatarId: 'carbon-captain-01',
  displayName: 'CarbonCaptain',
  baseMode: 'CommandGrid',
  triggerRules: { intents: ['query'] },
  cognitiveProfile: {
    systemPromptTemplate: 'analyst_v1',
    tone: 'Authoritative, Data-first',
    reasoningDepth: 'chain_of_thought',
    creativityTemperature: 0.2,
  },
  interfaceConfig: {
    layoutEngine: 'modular_grid',
    density: 'ultra_high',
    activeWidgets: [{ type: 'emission_heatmap', refreshRateMs: 5000, source: 'oesg.pulse' }],
  },
  toolPermissions: { allow: ['rag_search'], requireApproval: [], deny: [] },
};

describe('suggestMode — 意圖到三態預設映射', () => {
  it('chat → Companion, query → CommandGrid, execute → Phantom', () => {
    expect(suggestMode('chat')).toBe('Companion');
    expect(suggestMode('query')).toBe('CommandGrid');
    expect(suggestMode('execute')).toBe('Phantom');
  });
});

describe('sealAvatarConfig — 契約驗證與封存', () => {
  it('合法配置淺凍結 (不可熱改)', () => {
    const sealed = sealAvatarConfig(PHANTOM_CONFIG);
    expect(Object.isFrozen(sealed)).toBe(true);
  });

  it('空 avatarId fail-fast', () => {
    expect(() => sealAvatarConfig({ ...PHANTOM_CONFIG, avatarId: '' })).toThrowError(OmniArchError);
  });

  it('allow 清單禁用萬用字元 * (default-deny)', () => {
    expect(() =>
      sealAvatarConfig({
        ...PHANTOM_CONFIG,
        toolPermissions: { allow: ['*'], requireApproval: [], deny: [] },
      }),
    ).toThrowError(OmniArchError);
  });

  it('layoutEngine 與 baseMode 不一致 fail-fast', () => {
    expect(() =>
      sealAvatarConfig({
        ...GRID_CONFIG,
        interfaceConfig: { ...GRID_CONFIG.interfaceConfig, layoutEngine: 'chat_stream' },
      }),
    ).toThrowError(OmniArchError);
  });

  it('headless 化身不得掛載 activeWidgets', () => {
    expect(() =>
      sealAvatarConfig({
        ...PHANTOM_CONFIG,
        interfaceConfig: {
          layoutEngine: 'headless',
          density: 'minimal',
          activeWidgets: [{ type: 'leak' }],
        },
      }),
    ).toThrowError(OmniArchError);
  });
});

describe('OmniAvatarCore — 千面化身核心', () => {
  it('宣告意圖命中 baseMode, 未宣告回退預設映射', () => {
    const phantom = new OmniAvatarCore(PHANTOM_CONFIG);
    expect(phantom.resolveMode('execute')).toBe('Phantom');
    expect(phantom.resolveMode('chat')).toBe('Companion');
    expect(phantom.resolveMode('query')).toBe('CommandGrid');
    expect(phantom.currentMode()).toBe('Phantom');
    expect(phantom.displayName()).toBe('Sentinel');
  });

  it('CommandGrid 化身: query 命中 baseMode, chat 回退 Companion', () => {
    const captain = new OmniAvatarCore(GRID_CONFIG);
    expect(captain.resolveMode('query')).toBe('CommandGrid');
    expect(captain.resolveMode('chat')).toBe('Companion');
  });

  it('工具權限: allow / require_approval / deny / 未列冊一律 deny (fail-closed)', () => {
    const phantom = new OmniAvatarCore(PHANTOM_CONFIG);
    expect(phantom.toolPermission('read_logs')).toBe('allow');
    expect(phantom.toolPermission('restart_service')).toBe('require_approval');
    expect(phantom.toolPermission('delete_backup')).toBe('deny');
    expect(phantom.toolPermission('social_media_post')).toBe('deny');
  });

  it('deny 優先於 allow (清單衝突時從嚴)', () => {
    const conflicting = new OmniAvatarCore({
      ...PHANTOM_CONFIG,
      toolPermissions: { allow: ['restart_service'], requireApproval: [], deny: ['restart_service'] },
    });
    expect(conflicting.toolPermission('restart_service')).toBe('deny');
  });
});
