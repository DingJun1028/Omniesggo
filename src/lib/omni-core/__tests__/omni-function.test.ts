/**
 * omni-function.test.ts — 萬能函數與函數庫單元測試
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  omni,
  omniFn,
  processCaseLocal,
  createFiveTComponent,
  type ComponentRequest,
} from '../omni-function';
import { FiveTGatekeeper } from '../omni-kernel';
import type { OmniTask, OmniTaskFilter, OmniTaskSort } from '../types';

const evidence = {
  originCause: '測試觸發',
  processTrace: ['步驟一', '步驟二'],
  finalEffect: '測試結果',
};

describe('萬能函數 omni() — component', () => {
  it('建立組件並註冊進核心', () => {
    const r = omni({
      kind: 'component',
      data: { name: '碳排放基準', value: 1200 },
      evidence,
      actor: 'tester',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.kind).toBe('component');
      expect(r.id).toMatch(/^OC-/);
      expect(r.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(r.registered).toBe(true);
    }
  });

  it('可選擇不註冊', () => {
    const r = omni({ kind: 'component', data: { x: 1 }, evidence, register: false });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.registered).toBe(false);
  });
});

describe('萬能函數 omni() — note / task', () => {
  it('建立筆記', () => {
    const r = omni({ kind: 'note', title: 'ESG 戰略', content: 'Q3 目標' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.kind).toBe('note');
      expect(r.id).toMatch(/^ON-/);
      expect(r.hash).toMatch(/^[0-9a-f]{16}$/);
    }
  });

  it('建立任務', () => {
    const r = omni({ kind: 'task', title: '盤點碳排', priority: 'high' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.kind).toBe('task');
      expect(r.id).toMatch(/^OT-/);
    }
  });
});

describe('萬能函數 omni() — fn', () => {
  it('呼叫已註冊的內建函數', () => {
    const r = omni({ kind: 'fn', name: 'esggo.genId', args: ['TEST'] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toMatch(/^TEST-/);
    }
  });

  it('呼叫不存在的函數回傳失敗', () => {
    const r = omni({ kind: 'fn', name: 'no.such.fn' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('未註冊');
  });
});

describe('萬能函數 omni() — case', () => {
  it('分派 OmniOne 案例並回傳 ProcessResult', () => {
    const r = omni({ kind: 'case', caseType: 'esg_report', input: '產生 GRI 報告' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.kind).toBe('case');
      expect(r.id).toMatch(/^OCASE-/);
    }
  });
});

describe('OmniFunctionLibrary (函數庫)', () => {
  beforeEach(() => {
    // 確保內建函數已註冊
    if (!omniFn.has('esggo.fiveTScore')) {
      // registerBuiltinFunctions 已在模組載入時執行
    }
  });

  it('內建函數：esggo.fiveTScore', () => {
    const score = omniFn.call('esggo.fiveTScore', {
      sources: ['a', 'b', 'c'],
      hashLocked: true,
      algorithmVerified: true,
    }) as Record<string, number>;
    expect(score.traceable).toBeGreaterThan(0);
    expect(score.trustworthy).toBe(1);
  });

  it('內建函數：esggo.formatPercent / clampScore', () => {
    expect(omniFn.call('esggo.formatPercent', 0.735, 1)).toBe('73.5%');
    expect(omniFn.call('esggo.clampScore', 5)).toBe(1);
  });

  it('內建函數：esggo.filterTasks / sortTasks', () => {
    const tasks: OmniTask[] = [
      { id: 'T1', title: 'a', priority: 'low', status: 'pending', tags: [], createdAt: 1, updatedAt: 1, isFrozen: true },
      { id: 'T2', title: 'b', priority: 'high', status: 'pending', tags: [], createdAt: 2, updatedAt: 2, isFrozen: true },
    ];
    const filter: OmniTaskFilter = { priority: 'high', due: 'all', status: 'all' };
    const filtered = omniFn.call('esggo.filterTasks', tasks, filter) as OmniTask[];
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('T2');

    const sort: OmniTaskSort = { field: 'priority', direction: 'asc' };
    const sorted = omniFn.call('esggo.sortTasks', tasks, sort) as OmniTask[];
    expect(sorted[0].priority).toBe('high');
  });

  it('自註冊函數可被呼叫與移除', () => {
    omniFn.register('demo.add', (a: number, b: number) => a + b, { description: '加法', category: 'demo' });
    expect(omniFn.has('demo.add')).toBe(true);
    expect(omniFn.call('demo.add', 2, 3)).toBe(5);
    expect(omniFn.list().some(m => m.name === 'demo.add')).toBe(true);
    expect(omniFn.remove('demo.add')).toBe(true);
    expect(omniFn.has('demo.add')).toBe(false);
  });

  it('tryCall 不因錯誤拋出', () => {
    const res = omniFn.tryCall('definitely.missing');
    expect(res.ok).toBe(false);
  });
});

describe('createFiveTComponent 實作範例', () => {
  it('建立通過 5T 門檻的組件', () => {
    const c = createFiveTComponent({ metric: 'carbon', value: 1200 }, { actor: 'tester' });
    expect(c.uuid).toMatch(/^OC-/);
    expect((c as any).hash).toMatch(/^[0-9a-f]{64}$/);
    const status = FiveTGatekeeper.evaluate((c as any).fiveT);
    expect(FiveTGatekeeper.allPass(status)).toBe(true);
  });
});

describe('processCaseLocal', () => {
  it('產生確定性的 ProcessResult', () => {
    const r = processCaseLocal('bug_fix', '修復匯出錯誤');
    expect(r.caseType).toBe('bug_fix');
    expect(r.confidence).toBeGreaterThanOrEqual(0.3);
    expect(r.confidence).toBeLessThanOrEqual(1);
    expect(typeof r.processingTimeMs).toBe('number');
  });
});
