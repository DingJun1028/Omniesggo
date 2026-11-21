import { describe, it, expect } from 'vitest';
import { computeFeedback } from '../DynamicFormEngine';

/**
 * 零幻覺警告邏輯的可重現驗證（不依賴瀏覽器熱重載）。
 * 對齊 DynamicFormEngine 的渲染條件：feedback.status==='error' 時顯示琥珀色橫幅。
 */
describe('computeFeedback (9式果因引擎 UI 對映)', () => {
  const basePayload = {
    uuid: 'mod-env-carbon-0001',
    version: '1.1.0-Universe',
    source_origin: 'dynamic-form-engine-ui',
    evidence: ['https://s3.example.com/proof.pdf'],
    reportType: 'ISO-14064',
    previousYearUsage: 1000,
    gridEmissionFactor: 0.495,
    timestamp: Date.now(),
  };

  it('正常增長 +5% → success 且攜帶 data (供 NCB 寫入)', () => {
    const fb = computeFeedback({
      ...basePayload,
      currentYearUsage: 1050,
    });
    expect(fb.status).toBe('success');
    expect(fb.data).toBeDefined();
    // data 必須可序列化（NCB insertDocument 會 JSON.stringify）
    expect(() => JSON.stringify(fb.data)).not.toThrow();
  });

  it('>500% 暴增 → error + 欄位錯誤', () => {
    const fb = computeFeedback({
      ...basePayload,
      currentYearUsage: 10000, // +900%
    });
    expect(fb.status).toBe('error');
    expect(fb.message).toContain('Dr. Thoth');
    expect(fb.errors?.currentYearUsage?._errors[0]).toContain('500%');
  });

  it('缺證據 → error + evidence 錯誤', () => {
    const fb = computeFeedback({
      ...basePayload,
      evidence: [],
      currentYearUsage: 1050,
    });
    expect(fb.status).toBe('error');
    expect(fb.errors?.evidence?._errors[0]).toContain('佐證');
  });
});
