/**
 * 蜂群矩陣 SSOT 資料層測試 — 萬能代理無限分身
 * 5T-Trackable: 只覆蓋 oa-swarm-matrix.mjs 的常數與純函數
 * 5T-Traceable: source_origin=萬能覺醒奧義 session
 * 路由層的 method/query/body/狀態碼契約由 oa-routes.test.mjs 負責
 */
import { describe, it, expect } from 'vitest';
import { AGENTS, ARRAYS, listAgents } from './oa-swarm-matrix.mjs';

describe('§20.4 蜂群矩陣 SSOT', () => {
  it('恰為 30 位代理 (5T-Trustworthy)', () => {
    expect(AGENTS).toHaveLength(30);
  });

  it('恰為 5 大陣列且編號 1-5 (MECE)', () => {
    expect(ARRAYS).toHaveLength(5);
    expect(ARRAYS.map((a) => a.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('陣列互斥且窮盡：每位代理恰屬一陣列，每陣列恰 6 位', () => {
    for (const arr of ARRAYS) {
      expect(listAgents(arr.id)).toHaveLength(6);
    }
    const total = ARRAYS.reduce((n, arr) => n + listAgents(arr.id).length, 0);
    expect(total).toBe(30);
  });

  it('代理編號連續 01-30 無缺漏 (5T-Transparent)', () => {
    expect(AGENTS.map((a) => a.num)).toEqual(
      Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, '0'))
    );
  });

  it('陣列歸屬正確：01→策略, 12→技術, 30→守衛', () => {
    const byNum = (n) => AGENTS[n - 1];
    expect(byNum(1).arrayName).toBe('策略組');
    expect(byNum(12).arrayName).toBe('技術組');
    expect(byNum(18).arrayName).toBe('創意組');
    expect(byNum(24).arrayName).toBe('營銷組');
    expect(byNum(30).arrayName).toBe('守衛組');
  });

  it('代理 01 為萬能蜂后 (5T-Traceable 指揮鏈)', () => {
    expect(AGENTS[0].name).toBe('萬能蜂后');
    expect(AGENTS[0].id).toBe('agent:01');
  });

  it('21 為萬能商業分析蜂，與 03 萬能分析蜂區隔 (§8.1 修正)', () => {
    expect(AGENTS[20].name).toBe('萬能商業分析蜂');
    expect(AGENTS[2].name).toBe('萬能分析蜂');
    expect(AGENTS[20].name).not.toBe(AGENTS[2].name);
  });

  it('矩陣為 frozen，寫入即拒絕 (5T-Trustworthy Hash Lock)', () => {
    expect(Object.isFrozen(AGENTS)).toBe(true);
    expect(Object.isFrozen(ARRAYS)).toBe(true);
    expect(Object.isFrozen(AGENTS[0])).toBe(true);
    // 真正嘗試寫入（strict mode 會拋 TypeError），而非只斷言旗標
    expect(() => { 'use strict'; AGENTS[0].name = '竄改'; }).toThrow(TypeError);
    expect(() => { 'use strict'; ARRAYS.push({ id: 'x' }); }).toThrow(TypeError);
  });

  it('每位代理皆帶 OmniTag 三枚必備標 (5T-Traceable)', () => {
    for (const a of AGENTS) {
      expect(a.id).toMatch(/^agent:\d{2}$/);
      expect(a.name).toBeTruthy();
      expect(a.tags.length).toBeGreaterThan(0);
    }
  });

  it('listAgents 未知陣列回空陣列而非拋錯 (5T-Transparent)', () => {
    expect(listAgents(9)).toEqual([]);
    expect(listAgents('all')).toHaveLength(30);
  });
});
