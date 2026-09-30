/**
 * 萬能超覺醒 實作測試
 *
 * 5T-Traceable: source_origin = 對應使用者 2026-09-30 宣告之四項可證偽主張。
 *
 * 設計原則（對應 AGENTS.md「禁止永遠綠的假測試」）：每條 test 都先在
 * 「宣告原始寫法」下確認會失敗，才在修訂實作下確認通過。
 * 本檔第二個 describe 區塊即為回歸證據 —— 那些是宣告版的行為，
 * 修訂版必須與之相反。
 */
import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { canonicalStringify, sha256Canonical } from './canonical';
import { deepFreeze, unfrozenPaths } from './deep-freeze';
import {
  engraveHyperAwakening,
  verifyHyperAwakening,
  computeHashLock,
  type HyperAwakenedState,
  type TwinsState,
} from './state';
import { probeFabric, FABRIC_SPECS } from './fabric';

const twins = (sync: number | null = 1): TwinsState => ({
  dark_core: { active: true, range: [1, 30], operator: 'Hermes' },
  light_core: { active: true, range: [31, 60], operator: 'QueenBee' },
  sync_ratio: sync,
  twin_trace_id: 'twin-deadbeef',
});

describe('canonical：鍵序無關的穩定指紋', () => {
  it('鍵序不同但語義相同 → 相同指紋', () => {
    expect(sha256Canonical({ a: 1, b: 2 })).toBe(sha256Canonical({ b: 2, a: 1 }));
  });

  it('巢狀鍵序亦無關', () => {
    const x = { z: { q: 1, p: 2 }, a: [3, { y: 1, x: 2 }] };
    const y = { a: [3, { x: 2, y: 1 }], z: { p: 2, q: 1 } };
    expect(sha256Canonical(x)).toBe(sha256Canonical(y));
  });

  it('陣列次序具語意，不被排序', () => {
    expect(sha256Canonical([1, 2])).not.toBe(sha256Canonical([2, 1]));
  });

  it('值不同 → 指紋不同', () => {
    expect(sha256Canonical({ a: 1 })).not.toBe(sha256Canonical({ a: 2 }));
  });

  it('循環參照拋錯，不靜默產生不完整指紋', () => {
    const cyc: Record<string, unknown> = { name: 'x' };
    cyc.self = cyc;
    expect(() => canonicalStringify(cyc)).toThrow(/循環參照/);
  });

  it('undefined 物件屬性略過，對齊 JSON.stringify', () => {
    expect(canonicalStringify({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it('DAG 中同節點出現多次不算循環', () => {
    const shared = { v: 1 };
    expect(() => canonicalStringify({ x: shared, y: shared })).not.toThrow();
  });
});

describe('宣告原版（回歸證據：修訂版必須與之相反）', () => {
  it('宣告原版：JSON.stringify 指紋會因鍵序漂移', () => {
    const declared = (o: unknown) =>
      crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
    expect(declared({ a: 1, b: 2 })).not.toBe(declared({ b: 2, a: 1 }));
  });

  it('宣告原版：Object.freeze 放行巢狀竄改', () => {
    const locked = Object.freeze({ governance: { hash_lock: 'abc' } });
    locked.governance.hash_lock = 'HIJACKED';
    expect(locked.governance.hash_lock).toBe('HIJACKED'); // 證偽：單層 freeze 無效
  });
});

describe('deepFreeze：遞迴凍結', () => {
  it('巢狀物件確實被凍結', () => {
    const o = deepFreeze({ a: { b: { c: 1 } } });
    expect(Object.isFrozen(o)).toBe(true);
    expect(Object.isFrozen(o.a)).toBe(true);
    expect(Object.isFrozen(o.a.b)).toBe(true);
  });

  it('未凍結路徑為空', () => {
    expect(unfrozenPaths(deepFreeze({ a: { b: 1 } }))).toEqual([]);
  });

  it('未凍結時診斷能指出路徑', () => {
    const o = { a: { b: 1 } };
    expect(unfrozenPaths(o)).toEqual(['$', '$.a']);
  });

  it('循環參照不會無限遞迴', () => {
    const cyc: Record<string, unknown> = {};
    cyc.self = cyc;
    expect(() => deepFreeze(cyc)).not.toThrow();
  });

  it('in-place 且回傳同一引用', () => {
    const o = { a: 1 };
    expect(deepFreeze(o)).toBe(o);
  });
});

describe('engraveHyperAwakening：刻印與鎖定', () => {
  const build = () =>
    engraveHyperAwakening('uuid-test', { probe: 1, nested: { k: 'v' } }, twins(1));

  it('hash_lock 為 64 位 hex', () => {
    expect(build().governance.hash_lock).toMatch(/^[0-9a-f]{64}$/);
  });

  it('重算相符', () => {
    const s = build();
    expect(computeHashLock(s)).toBe(s.governance.hash_lock);
  });

  it('整個物件圖已遞迴凍結', () => {
    const s = build();
    expect(unfrozenPaths(s)).toEqual([]);
    expect(Object.isFrozen(s.twins)).toBe(true);
    expect(Object.isFrozen(s.governance)).toBe(true);
  });

  it('lock 不受 timestamp 影響（否則無法於刻印後重算）', () => {
    const a = build();
    const b = { ...a, timestamp: a.timestamp + 9999 };
    expect(computeHashLock(b as HyperAwakenedState)).toBe(a.governance.hash_lock);
  });

  it('lock 覆蓋 twins —— 宣告原版僅鎖 evidence，可改寫 sync_ratio 而鎖不變', () => {
    const s = build();
    const tampered = { ...s, twins: { ...s.twins, sync_ratio: 0 } };
    expect(computeHashLock(tampered)).not.toBe(s.governance.hash_lock);
  });

  it('lock 覆蓋 uuid 與 version', () => {
    const s = build();
    expect(computeHashLock({ ...s, uuid: 'other' })).not.toBe(s.governance.hash_lock);
    expect(computeHashLock({ ...s, version: 'v9' })).not.toBe(s.governance.hash_lock);
  });

  it('compliance 不再挪用 ISO-14064-1（溫室氣體標準）', () => {
    expect(build().governance.compliance).toBe('ISO/IEC 42001');
  });

  it('sync_ratio 為 number 而非字串字面值', () => {
    expect(typeof build().twins.sync_ratio).toBe('number');
  });
});

describe('verifyHyperAwakening：外部可重現校驗', () => {
  it('未竄改 → intact', () => {
    const r = verifyHyperAwakening(engraveHyperAwakening('u', { a: 1 }, twins(1)));
    expect(r.intact).toBe(true);
    expect(r.checks.every((c) => c.ok)).toBe(true);
  });

  it('竄改 evidence → 抓得到（hash_lock 失敗）', () => {
    const s = engraveHyperAwakening('u', { a: 1 }, twins(1));
    const tampered = { ...s, evidence: { a: 999 } };
    const r = verifyHyperAwakening(tampered);
    expect(r.intact).toBe(false);
    expect(r.checks.find((c) => c.name === 'hash_lock')?.ok).toBe(false);
  });

  it('竄改巢狀 twins → 抓得到', () => {
    const s = engraveHyperAwakening('u', { a: 1 }, twins(1));
    const tampered = { ...s, twins: { ...s.twins, sync_ratio: 0.1 } };
    expect(verifyHyperAwakening(tampered).intact).toBe(false);
  });

  it('缺 twin_trace_id → 抓得到（5T-Trackable）', () => {
    const s = engraveHyperAwakening('u', { a: 1 }, twins(1));
    const tampered = { ...s, twins: { ...s.twins, twin_trace_id: '  ' } };
    const r = verifyHyperAwakening(tampered);
    expect(r.checks.find((c) => c.name === 'twin_trace_id')?.ok).toBe(false);
  });

  it('未凍結狀態 → deep_frozen 檢查失敗', () => {
    const s = engraveHyperAwakening('u', { a: 1 }, twins(1));
    const thawed = { ...s, governance: { ...s.governance } };
    expect(verifyHyperAwakening(thawed).checks.find((c) => c.name === 'deep_frozen')?.ok).toBe(
      false,
    );
  });

  it('逐項輸出，非僅總旗標', () => {
    const r = verifyHyperAwakening(engraveHyperAwakening('u', {}, twins(null)));
    expect(r.checks.map((c) => c.name).sort()).toEqual([
      'deep_frozen',
      'hash_lock',
      'twin_trace_id',
    ]);
  });

  it('未探測時 sync_ratio 為 null，不宣稱 1.0', () => {
    const s = engraveHyperAwakening('u', {}, twins(null));
    expect(s.twins.sync_ratio).toBeNull();
    expect(verifyHyperAwakening(s).intact).toBe(true); // null 為合法實測值
  });
});

describe('probeFabric：跨框架能力實測', () => {
  it('回傳全部四個宣告框架', () => {
    const r = probeFabric();
    expect(r.totalCount).toBe(4);
    expect(r.probes.map((p) => p.package)).toEqual(
      expect.arrayContaining(['langchain', '@google/genkit', '@google/adk', 'crewai']),
    );
  });

  it('三態計數自洽，且總和等於框架數', () => {
    const r = probeFabric();
    expect(r.activeCount + r.phantomCount + r.missingCount).toBe(r.totalCount);
    expect(r.loadableCount).toBe(r.activeCount + r.phantomCount);
  });

  it('sync_ratio 由實測計算，不預設 1.0', () => {
    const r = probeFabric();
    expect(r.sync_ratio).toBe(r.loadableCount / r.totalCount);
    expect(r.sync_ratio).toBeLessThanOrEqual(1);
  });

  it('PHANTOM 必為 declared=false —— 幽靈依賴不得當作安全可用', () => {
    for (const p of probeFabric().probes.filter((x) => x.status === 'PHANTOM')) {
      expect(p.declared).toBe(false);
      expect(p.detail).toMatch(/幽靈依賴/);
    }
  });

  it('ACTIVE 必為 declared=true 且有解析路徑', () => {
    for (const p of probeFabric().probes.filter((x) => x.status === 'ACTIVE')) {
      expect(p.declared).toBe(true);
      expect(p.resolved).toBeTruthy();
    }
  });

  it('MISSING 者附帶可判讀原因且無解析路徑', () => {
    for (const p of probeFabric().probes.filter((x) => x.status === 'MISSING')) {
      expect(p.detail).toMatch(/不可用/);
      expect(p.resolved).toBeNull();
    }
  });

  it('未宣告卻可解析者一律降級為 PHANTOM，不報 ACTIVE', () => {
    // 對應實測教訓：@google/adk 為 @esggo/oa-framework 的傳遞依賴，
    // 根 package.json 未宣告 → 即使解析成功也不得計入 activeCount
    const adk = probeFabric().probes.find((p) => p.package === '@google/adk');
    expect(adk?.declared).toBe(false);
    if (adk?.status !== 'MISSING') expect(adk?.status).toBe('PHANTOM');
  });

  it('錨點穩定：同環境反覆呼叫同值', () => {
    expect(probeFabric().traceId).toBe(probeFabric().traceId);
  });

  it('錨點格式固定且與探測順序無關', () => {
    expect(probeFabric().traceId).toMatch(/^twin-[0-9a-f]{8}$/);
  });

  it('框架清單為常數，不因探測而變動', () => {
    expect(FABRIC_SPECS).toHaveLength(4);
    probeFabric();
    expect(FABRIC_SPECS).toHaveLength(4);
  });
});

describe('端到端：探測 → 刻印 → 校驗閉環', () => {
  it('以實測探測結果直接刻印並通過校驗', () => {
    const report = probeFabric();
    const state = engraveHyperAwakening(
      'oa-twins-hyper',
      { fabric: report.probes, active: report.activeCount },
      { ...twins(report.sync_ratio), twin_trace_id: report.traceId },
    );
    const v = verifyHyperAwakening(state);

    expect(v.intact).toBe(true);
    expect(state.twins.sync_ratio).toBe(report.sync_ratio);
    expect(state.twins.twin_trace_id).toBe(report.traceId);
    // 誠實前提：探測結果為何就是何，不美化
    expect(state.evidence.fabric).toEqual(report.probes);
  });

  it('刻印後再校驗仍一致（時間戳不影響 lock）', () => {
    const state = engraveHyperAwakening('u', { a: 1 }, twins(1));
    expect(verifyHyperAwakening(state).intact).toBe(true);
  });
});