import { describe, it, expect, afterEach } from 'vitest';
import {
  LiquidGlassRenderer,
  FloatingCore,
  MetricVisualizer,
  OmniUI,
  DEFAULT_GLASS,
  DEFAULT_FLOATING_CORE,
  BRAND_COLORS,
} from '../src/index.js';

describe('OmniUI v1.0 (Liquid Glass + Floating Core + Metric Visualizer)', () => {
  describe('LiquidGlassRenderer', () => {
    it('default config matches DEFAULT_GLASS', () => {
      const r = new LiquidGlassRenderer();
      expect(r.getConfig()).toEqual(DEFAULT_GLASS);
    });

    it('renderStyle includes backdrop-filter + brand colors', () => {
      const r = new LiquidGlassRenderer();
      const style = r.renderStyle();
      expect(style['backdrop-filter']).toBe('blur(20px)');
      expect(style['background']).toContain('16, 36, 63'); // deepBlue rgba
      expect(style['border']).toContain('201, 162, 75'); // warmGold rgba
    });

    it('setVariant adjusts blur/opacity', () => {
      const r = new LiquidGlassRenderer();
      r.setVariant('prominent');
      expect(r.getConfig().blur).toBe(30);
      expect(r.getConfig().opacity).toBe(0.95);

      r.setVariant('subtle');
      expect(r.getConfig().blur).toBe(10);
      expect(r.getConfig().opacity).toBe(0.7);
    });
  });

  describe('FloatingCore', () => {
    let core: FloatingCore;

    afterEach(() => {
      core?.stopPulse();
    });

    it('default config is 428x428', () => {
      core = new FloatingCore();
      expect(core.getConfig().position).toEqual({ x: 428, y: 428 });
      expect(core.getConfig().pulse).toBe(true);
    });

    it('moveTo updates position', () => {
      core = new FloatingCore();
      core.moveTo(100, 200);
      expect(core.getConfig().position).toEqual({ x: 100, y: 200 });
    });

    it('renderPulseKeyframes returns CSS', () => {
      core = new FloatingCore();
      const css = core.renderPulseKeyframes();
      expect(css).toContain('@keyframes omni-core-pulse');
      expect(css).toContain('scale(1.08)');
    });

    it('startPulse + stopPulse', () => {
      core = new FloatingCore();
      core.startPulse(100);
      core.stopPulse();
      // 沒有 throw 即 PASS
      expect(true).toBe(true);
    });
  });

  describe('MetricVisualizer', () => {
    it('addMetric + getAllMetrics', () => {
      const v = new MetricVisualizer();
      v.addMetric({ kind: 'entropy', value: 0.05, unit: 'ratio' });
      v.addMetric({ kind: 'pass-rate', value: 95, unit: '%' });
      expect(v.getAllMetrics()).toHaveLength(2);
    });

    it('getStatus: ok / warn / critical', () => {
      const v = new MetricVisualizer();
      v.addMetric({
        kind: 'entropy',
        value: 0.05,
        unit: 'ratio',
        threshold: { warn: 0.1, critical: 0.3 },
      });
      expect(v.getStatus('entropy')).toBe('ok');

      v.addMetric({
        kind: 'pass-rate',
        value: 85,
        unit: '%',
        threshold: { warn: 90, critical: 70 },
      });
      expect(v.getStatus('pass-rate')).toBe('warn');

      v.addMetric({
        kind: 'drift-count',
        value: 5,
        unit: 'count',
        threshold: { warn: 1, critical: 3 },
      });
      expect(v.getStatus('drift-count')).toBe('critical');
    });

    it('renderColor returns brand colors', () => {
      const v = new MetricVisualizer();
      v.addMetric({ kind: 'entropy', value: 0.05, unit: 'ratio' });
      const okColor = v.renderColor('entropy');
      expect(okColor).toBe(BRAND_COLORS.green);
    });
  });

  describe('OmniUI integration', () => {
    it('render returns glass + core + metrics', () => {
      // 用新 instance 避免被其他 test 改 state
      const ui = new OmniUI();
      ui.visualizer.addMetric({ kind: 'entropy', value: 0.05, unit: 'ratio' });
      const result = ui.render();
      expect(result.glass['backdrop-filter']).toBeTruthy();
      expect(result.core.position.x).toBe(428);
      expect(result.core.position.y).toBe(428);
      expect(result.metrics).toHaveLength(1);
    });
  });
});
