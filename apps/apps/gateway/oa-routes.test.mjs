/**
 * §20.4 /oa/* 路由處理器測試 — 補上「只測資料不測路由」的缺口
 * [agent:01] [squad:omni] [lifecycle:dev] [p1]
 * 5T-Traceable: source_origin=code review finding (deleg_1fc8882c [MEDIUM] 測試複製品)
 * 5T-Trackable: 直接 import oa-swarm-handlers.mjs — 測的是「被測物本身」，
 *               非複製品。舊版手寫一份 dispatchHandler 與 AGENTS_MOCK，
 *               導致 NaN 繞過這類真實 bug 落在測試盲區。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTaskLog,
  handleOaStatus,
  handleOaAgents,
  handleDispatch,
  buildBroadcastPayload,
  validateArrayParam,
  validatePrompt,
  routeAgent,
  OA_TASK_RING_MAX,
  OA_PROMPT_MAX,
} from './oa-swarm-handlers.mjs';
import { ARRAYS } from './oa-swarm-matrix.mjs';

let log;
const dispatch = (body) => handleDispatch({ body, taskLog: log });

beforeEach(() => { log = createTaskLog(); });

describe('validateArrayParam — NaN 與型別繞過防護', () => {
  it('拒絕 NaN 型輸入：NaN 的任何比較皆為 false，舊碼會放行', () => {
    for (const bad of ['abc', '2abc', 'NaN', {}, [], 2.5, true, false, 0, 9, -1, 6]) {
      const r = validateArrayParam(bad);
      expect(r.ok, `array=${JSON.stringify(bad)} 應被拒`).toBe(false);
    }
  });

  it('接受合法整數與字串數字（CLI 傳參相容）', () => {
    for (const good of [1, 2, 3, 4, 5, '1', '3', '5']) {
      const r = validateArrayParam(good);
      expect(r.ok, `array=${good} 應被接受`).toBe(true);
      expect(r.value).toBe(Number(good));
    }
  });

  it('undefined 代表未指定 → null（交蜂后）', () => {
    expect(validateArrayParam(undefined)).toEqual({ ok: true, value: null });
  });
});

describe('validatePrompt', () => {
  it('拒絕空值與非字串', () => {
    for (const bad of ['', null, 0, 123, ['a'], {}]) {
      expect(validatePrompt(bad).ok, `prompt=${JSON.stringify(bad)}`).toBe(false);
    }
  });

  it('邊界：8000 通過、8001 回 413', () => {
    expect(validatePrompt('A'.repeat(8000)).ok).toBe(true);
    const over = validatePrompt('A'.repeat(8001));
    expect(over.ok).toBe(false);
    expect(over.status).toBe(413);
    expect(over.got).toBe(8001);
    expect(OA_PROMPT_MAX).toBe(8000);
  });
});

describe('routeAgent — 陣列路由（含陣列內二次挑選）', () => {
  it('未指定陣列 → 蜂后 agent:01', () => {
    expect(routeAgent(null).id).toBe('agent:01');
  });

  it('無關鍵字命中 → 該陣列第一位代理', () => {
    expect(routeAgent(2, 'zzz 無關內容').id).toBe('agent:07');
    expect(routeAgent(3, 'zzz').id).toBe('agent:13');
    expect(routeAgent(4, 'zzz').id).toBe('agent:19');
    expect(routeAgent(5, 'zzz').id).toBe('agent:25');
  });

  it('array=2 技術組：依能力挑對代理（不再恆派編碼蜂）', () => {
    expect(routeAgent(2, '需要資料庫設計').id).toBe('agent:10');
    expect(routeAgent(2, '寫 API 開發').id).toBe('agent:07');
    expect(routeAgent(2, '機器學習演算法').id).toBe('agent:08');
    expect(routeAgent(2, '雲端架構設計').id).toBe('agent:09');
    expect(routeAgent(2, '自動化測試').id).toBe('agent:11');
    expect(routeAgent(2, 'UI 設計').id).toBe('agent:12');
  });

  it('array=5 守衛組：安全/維護/品質各歸其位', () => {
    expect(routeAgent(5, '資安防護').id).toBe('agent:27');
    expect(routeAgent(5, '故障排除').id).toBe('agent:28');
    expect(routeAgent(5, '品質標準').id).toBe('agent:30');
  });

  it('不越陣列：命中關鍵字但代理在別的陣列 → 退回本陣列第一位', () => {
    // 「資料庫」→ agent:10 在技術組(2)，指定守衛組(5)時不可跨組
    const a = routeAgent(5, '資料庫');
    expect(a.id).toBe('agent:25');
    expect(a.arrayId).toBe(5);
  });

  it('空 prompt 不誤判', () => {
    expect(routeAgent(2, '').id).toBe('agent:07');
    expect(routeAgent(2, null).id).toBe('agent:07');
  });

  it('越界陣列 → undefined（交由 handler 回 400）', () => {
    expect(routeAgent(99)).toBeUndefined();
  });
});

describe('handleDispatch — 派工流程', () => {
  it('正常派發回 200，佇列深度 1', () => {
    const r = dispatch({ prompt: '正常', array: 2 });
    expect(r.status).toBe(200);
    expect(r.body.queue_depth).toBe(1);
    expect(r.body.task.routedTo).toBe('agent:07');
    expect(r.body.task.signed_by).toBe('Key-Ω');
  });

  it('誠實語意：dispatch_mode 明示 queued_only（不實際執行）', () => {
    expect(dispatch({ prompt: 'x' }).body.dispatch_mode).toBe('queued_only');
  });

  it('task frozen，寫入即拒絕 (5T-Trustworthy Hash Lock)', () => {
    const t = dispatch({ prompt: '凍結' }).body.task;
    expect(Object.isFrozen(t)).toBe(true);
    expect(() => { 'use strict'; t.prompt = '竄改'; }).toThrow(TypeError);
  });

  it('task id 唯一（同毫秒多次派發不碰撞）', () => {
    const ids = new Set();
    for (let i = 0; i < 50; i++) ids.add(dispatch({ prompt: `t${i}` }).body.task.id);
    expect(ids.size).toBe(50);
  });

  it('ring buffer 超過容量丟棄最舊', () => {
    const small = createTaskLog(5);
    for (let i = 0; i < 12; i++) handleDispatch({ body: { prompt: `p${i}` }, taskLog: small });
    expect(small.length).toBe(5);
    expect(small.all()[0].prompt).toBe('p7');
  });

  it('預設容量為 200', () => {
    expect(log.capacity).toBe(OA_TASK_RING_MAX);
    expect(OA_TASK_RING_MAX).toBe(200);
  });

  it('錯誤案例零副作用：不進佇列', () => {
    expect(dispatch({}).status).toBe(400);
    expect(dispatch({ prompt: 'A'.repeat(9000) }).status).toBe(413);
    expect(dispatch({ prompt: 'x', array: 'abc' }).status).toBe(400);
    expect(dispatch({ prompt: 'x', array: 2.5 }).status).toBe(400);
    expect(dispatch({ prompt: 'x', array: true }).status).toBe(400);
    expect(log.length).toBe(0);
  });

  it('NaN 不會被靜默降級成 agent:01（審查指出的靜默誤投）', () => {
    const r = dispatch({ prompt: 'x', array: 'abc' });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/integer/);
    expect(r.body.task).toBeUndefined();
  });
});

describe('buildBroadcastPayload — WS 無認證故不外流 prompt', () => {
  it('payload 不含 prompt 原文', () => {
    const secret = '這是機密任務內容-不該出現在 WS';
    const t = dispatch({ prompt: secret }).body.task;
    const p = buildBroadcastPayload(t);
    expect(p.prompt).toBeUndefined();
    expect(JSON.stringify(p)).not.toContain(secret);
  });

  it('長 prompt 只留 40 字預覽 + 長度', () => {
    const t = dispatch({ prompt: 'B'.repeat(500) }).body.task;
    const p = buildBroadcastPayload(t);
    expect(p.prompt_preview.length).toBeLessThanOrEqual(41);
    expect(p.prompt_length).toBe(500);
  });

  it('短 prompt 一律遮蔽內容（不因短就完整外流）', () => {
    const secret = '短';
    const p = buildBroadcastPayload(dispatch({ prompt: secret }).body.task);
    expect(p.prompt_preview).not.toBe(secret);
    expect(p.prompt_preview).toBe('•');
    expect(p.prompt_length).toBe(1);
  });

  it('保留派工識別所需欄位', () => {
    const t = dispatch({ prompt: 'x', array: 3 }).body.task;
    const p = buildBroadcastPayload(t);
    for (const k of ['id', 'array', 'routedTo', 'routedName', 'status', 'signed_by', 'ts']) {
      expect(p[k], `缺欄位 ${k}`).toBeDefined();
    }
  });
});

describe('handleOaAgents — GET /oa/agents（先前零覆蓋）', () => {
  it('不帶參數回全部 30 位', () => {
    const r = handleOaAgents(undefined);
    expect(r.count).toBe(30);
    expect(r.total_arrays).toBe(5);
    expect(r.agents).toHaveLength(30);
    expect(r.filter.array).toBe('all');
  });

  it('array=1..5 各回 6 位且編號落在正確範圍', () => {
    for (const a of ARRAYS) {
      const r = handleOaAgents(a.id);
      expect(r.count, `陣列${a.id} 應有 6 位`).toBe(6);
      for (const ag of r.agents) expect(ag.arrayId).toBe(a.id);
    }
  });

  it('array=all 與不帶參數等價', () => {
    expect(handleOaAgents('all').count).toBe(handleOaAgents(undefined).count);
  });

  it('非法 array 回空陣列且 count=0（不拋錯）', () => {
    for (const bad of ['abc', 99, -1, 0]) {
      const r = handleOaAgents(bad);
      expect(r.count, `array=${bad}`).toBe(0);
      expect(r.agents).toEqual([]);
    }
  });
});

describe('handleOaStatus — GET /oa/status（先前零覆蓋）', () => {
  const base = { mem: { heapUsed: 104857600, rss: 209715200 }, uptimeSeconds: 42, wsClients: 3, totalErrors: 7 };

  it('回傳 5 陣列各 6 位，總計 30', () => {
    const r = handleOaStatus(base);
    expect(r.ok).toBe(true);
    expect(r.source_origin).toBe('oa-swarm-matrix');
    expect(r.swarm_matrix.arrays).toBe(5);
    expect(r.swarm_matrix.agents).toBe(30);
    expect(r.swarm_matrix.queen).toBe('agent:01');
    expect(r.array_health).toHaveLength(5);
    for (const a of r.array_health) expect(a.agents).toBe(6);
    expect(r.array_health.reduce((s, a) => s + a.agents, 0)).toBe(30);
  });

  it('記憶體轉 MB 正確', () => {
    const r = handleOaStatus(base);
    expect(r.gateway.memory_mb.heap).toBe(100);
    expect(r.gateway.memory_mb.rss).toBe(200);
  });

  it('閘值資訊如實傳遞', () => {
    const r = handleOaStatus(base);
    expect(r.gateway.uptime_seconds).toBe(42);
    expect(r.gateway.ws_clients).toBe(3);
    expect(r.gateway.errors).toBe(7);
  });
});

describe('端到端：dispatch 後 status 反映佇列', () => {
  it('連續派工後 task_queue 深度正確（由呼叫端填入）', () => {
    for (let i = 0; i < 3; i++) dispatch({ prompt: `t${i}` });
    const r = handleOaStatus({ mem: process.memoryUsage(), uptimeSeconds: 1, wsClients: 0, totalErrors: 0 });
    r.task_queue = {
      depth: log.length,
      dispatched: log.all().filter((t) => t.status === 'dispatched').length,
      ring_capacity: log.capacity,
    };
    expect(r.task_queue.depth).toBe(3);
    expect(r.task_queue.dispatched).toBe(3);
    expect(r.task_queue.ring_capacity).toBe(200);
  });
});
