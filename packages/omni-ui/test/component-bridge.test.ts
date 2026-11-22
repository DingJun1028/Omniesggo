import { describe, expect, it } from 'vitest';
import { OmniComponent, type ComponentDescriptor } from '@esggo/omni-arch';
import {
  OmniComponentRenderer,
  OmniUIError,
  renderEffectKeyframes,
  verifyDescriptorSeal,
} from '../src/component-bridge';

const omniComponent = new OmniComponent();

describe('OmniComponent 渲染橋 (12大萬能架構維度二套件層)', () => {
  it('封裝描述子 → LiquidGlass 渲染計畫 (deepFreeze)', async () => {
    const descriptor = await omniComponent.describe('card', { title: 'CSRD-ESRS' });
    const renderer = new OmniComponentRenderer();
    const plan = await renderer.render(descriptor);

    expect(plan.kind).toBe('card');
    expect(plan.uuid).toBe(descriptor.uuid);
    expect(plan.themeRequested).toBe('LiquidGlass');
    expect(plan.themeApplied).toBe('LiquidGlass');
    expect(plan.style['backdrop-filter']).toContain('blur');
    expect(plan.effect).toBe('ripple');
    expect(plan.effectKeyframes).toContain('omni-effect-ripple');
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.style)).toBe(true);
  });

  it('戒嚴 (lockProvider) → 強制 MartialLock 唯讀防護色, 覆寫 CelestialGlow 請求', async () => {
    const descriptor = await omniComponent.describe('badge', {}, { theme: 'CelestialGlow' });
    const renderer = new OmniComponentRenderer({ lockProvider: () => true });
    const plan = await renderer.render(descriptor);

    expect(plan.locked).toBe(true);
    expect(plan.themeRequested).toBe('CelestialGlow');
    expect(plan.themeApplied).toBe('MartialLock');
    expect(plan.style['pointer-events']).toBe('none');
    expect(plan.style['cursor']).toBe('not-allowed');
  });

  it('CelestialGlow 主題 → 輝煌樣式', async () => {
    const descriptor = await omniComponent.describe('medal', {}, { theme: 'CelestialGlow', effect: 'glow' });
    const renderer = new OmniComponentRenderer();
    const plan = await renderer.render(descriptor);

    expect(plan.themeApplied).toBe('CelestialGlow');
    expect(plan.style['box-shadow']).toContain('201, 162, 75');
    expect(plan.effectKeyframes).toContain('omni-effect-glow');
  });

  it('未封裝/遭篡改描述子 → fail-fast E_DESCRIPTOR_UNSEALED', async () => {
    const sealed = await omniComponent.describe('card', {});
    const forged = { ...sealed } as unknown as ComponentDescriptor; // 淺層複製: 未凍結且證據鏈脫鉤
    const renderer = new OmniComponentRenderer();

    await expect(renderer.render(forged)).rejects.toBeInstanceOf(OmniUIError);
    await expect(renderer.render(forged)).rejects.toMatchObject({ code: 'E_DESCRIPTOR_UNSEALED' });
  });

  it('verifyDescriptorSeal — 封裝描述子為 true, 淺拷貝為 false', async () => {
    const sealed = await omniComponent.describe('card', {});
    expect(verifyDescriptorSeal(sealed)).toBe(true);

    const copy = { ...sealed } as unknown as ComponentDescriptor;
    expect(verifyDescriptorSeal(copy)).toBe(false);
  });

  it('renderEffectKeyframes 三特效齊備', () => {
    expect(renderEffectKeyframes('ripple')).toContain('omni-effect-ripple');
    expect(renderEffectKeyframes('freeze')).toContain('omni-effect-freeze');
    expect(renderEffectKeyframes('glow')).toContain('omni-effect-glow');
  });
});
