import { describe, expect, it } from 'vitest';
import { OmniAPI } from '../src/api';
import { OmniArchError } from '../src/types';
import { OmniAvatarCore, type AvatarConfig } from '../src/tri-mode';
import { invokeTrusted, REQUIRED_TRUST_BY_MODE, trustAwareToolPermission } from '../src/tool-trust-gate';

const baseConfig: AvatarConfig = {
  avatarId: 'avatar-test',
  displayName: '測試化身',
  baseMode: 'CommandGrid',
  triggerRules: { intents: ['chat', 'query', 'execute'] },
  cognitiveProfile: {
    systemPromptTemplate: '你是化身',
    tone: '專業',
    reasoningDepth: 'fast',
    creativityTemperature: 0.3,
  },
  interfaceConfig: {
    layoutEngine: 'modular_grid',
    density: 'standard',
    activeWidgets: [],
  },
  toolPermissions: {
    allow: ['esg.carbon.compute'],
    requireApproval: ['esg.report.export'],
    deny: ['esg.data.delete'],
  },
};

describe('ToolTrustGate 工具權限 × Trust Label 接線', () => {
  it('allow 清單通過後仍須達信任門檻: 不足降級 require_approval, 足夠放行', () => {
    const avatar = new OmniAvatarCore(baseConfig);
    expect(trustAwareToolPermission(avatar, 'esg.carbon.compute', 'high')).toBe('allow');
    expect(trustAwareToolPermission(avatar, 'esg.carbon.compute', 'low')).toBe('require_approval');
  });

  it('deny 恒拒、require_approval 恒人工程序 (信任不可越權)、未列冊恒拒', () => {
    const avatar = new OmniAvatarCore(baseConfig);
    expect(trustAwareToolPermission(avatar, 'esg.data.delete', 'critical')).toBe('deny');
    expect(trustAwareToolPermission(avatar, 'esg.report.export', 'critical')).toBe('require_approval');
    expect(trustAwareToolPermission(avatar, 'esg.unknown.tool', 'critical')).toBe('deny');
  });

  it('未知信任等級 → 分數 0 無 fallback → allow 降級 require_approval', () => {
    const avatar = new OmniAvatarCore(baseConfig);
    expect(trustAwareToolPermission(avatar, 'esg.carbon.compute', 'bogus-level')).toBe('require_approval');
  });

  it('Phantom 模式門檻從嚴 (high): CommandGrid 之 medium 不足以放行', () => {
    const phantom = new OmniAvatarCore({
      ...baseConfig,
      baseMode: 'Phantom',
      interfaceConfig: { layoutEngine: 'headless', density: 'minimal', activeWidgets: [] },
    });
    expect(REQUIRED_TRUST_BY_MODE.Phantom).toBe('high');
    expect(trustAwareToolPermission(phantom, 'esg.carbon.compute', 'medium')).toBe('require_approval');
    expect(trustAwareToolPermission(phantom, 'esg.carbon.compute', 'high')).toBe('allow');
  });

  it('invokeTrusted: 裁決 allow 才執行符文 (結果 deepFreeze); 非 allow fail-fast', async () => {
    const avatar = new OmniAvatarCore(baseConfig);
    const api = new OmniAPI();
    api.engrave<{ kwh: number }, number>('carbon.compute', (args) => args.kwh * 0.509);

    const ok = await invokeTrusted<{ kwh: number }, number>(avatar, api, {
      tool: 'esg.carbon.compute',
      rune: 'carbon.compute',
      trustLevel: 'high',
      args: { kwh: 1200 },
    });
    expect(Math.abs(ok - 610.8)).toBeLessThan(1e-6);
    expect(Object.isFrozen(ok)).toBe(true);

    await expect(
      invokeTrusted(avatar, api, {
        tool: 'esg.carbon.compute',
        rune: 'carbon.compute',
        trustLevel: 'low',
        args: { kwh: 1200 },
      })
    ).rejects.toThrowError(OmniArchError);
  });
});
