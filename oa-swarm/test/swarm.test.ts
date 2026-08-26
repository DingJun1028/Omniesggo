/**
 * OA-Team 蜂群核心測試 — 5T 合規 + 30 矩陣 + 靈魂執行鏈
 */
import { describe, it, expect, vi } from 'vitest';

// 超能力 TDD: 測試隔離外部副作用 (Ollama / OAB / VPS 網路)
// 避免 CI 環境下 fetch/http 掛起導致 flaky timeout
vi.mock('../src/llm', () => ({
  callLLM: vi.fn(async (prompt: string) => ({
    text: `[MOCK] 蜂群收到任務：「${prompt.slice(0, 60)}」。測試隔離模式。`,
    model: 'mock',
    source: 'mock' as const,
  })),
}));

vi.mock('../src/oab', () => ({
  OABClient: class {
    async publish() { return true; }
    async query() { return []; }
  },
  DualHiveTunnel: class {
    async syncToVps() { return true; }
  },
}));

vi.mock('../src/incremental', () => ({
  ETLPipeline: class {
    async process() { return [{ version: 1, id: 1, title: 'mock' }]; }
  },
}));

import { purify, verifyZeroHallucination, hashLock, FeedbackCollector } from '../src/protocol-5t';
import { SOUL_MATRIX, getAgent } from '../src/soul-matrix';
import { SwarmCore } from '../src/swarm-core';

describe('5T 協定強制層', () => {
  it('Traceable: 產物帶 source_origin', () => {
    const a = purify('test', '萬能蜂后', { x: 1 });
    expect(a.source_origin).toBe('test');
  });
  it('Trustworthy: hash_lock 非空且凍結', () => {
    const a = purify('t', '蜂后', {});
    expect(a.hash_lock).toMatch(/^0x/);
    expect(Object.isFrozen(a)).toBe(true);
  });
  it('Transparent: 零幻覺驗算通過', () => {
    const a = purify('t', '蜂后', { data: 'ok' });
    expect(verifyZeroHallucination(a)).toBe(true);
  });
  it('Tangible: 回饋收集合格', () => {
    const fc = new FeedbackCollector();
    fc.submit('a1', 5, 'good');
    fc.submit('a1', 3, 'ok');
    expect(fc.avg('a1')).toBe(4);
  });
});

describe('30 萬能蜂群矩陣', () => {
  it('矩陣含 30 員', () => {
    expect(SOUL_MATRIX.length).toBe(30);
  });
  it('陣列均分 5 組 × 6', () => {
    const counts: Record<string, number> = {};
    SOUL_MATRIX.forEach((a) => (counts[a.array] = (counts[a.array] ?? 0) + 1));
    expect(Object.values(counts).every((c) => c === 6)).toBe(true);
  });
  it('編號 1-30 唯一', () => {
    const ids = SOUL_MATRIX.map((a) => a.id).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });
  it('萬能蜂后為 #1', () => {
    expect(getAgent(1)?.title).toBe('萬能蜂后');
  });
});

describe('靈魂執行鏈', () => {
  it('executeSwarmTask 產出 5T 凍結產物', async () => {
    const core = new SwarmCore();
    const art = await core.executeSwarmTask('設計一個登入頁面', 'unit-test');
    expect(art.hash_lock).toMatch(/^0x/);
    expect(verifyZeroHallucination(art)).toBe(true);
    expect(art.evidence.collaborators.length).toBeGreaterThan(0);
  }, 15000);
  it('熵減循環降低熵值', () => {
    const core = new SwarmCore();
    const before = core.getState().entropy;
    core.tickEntropyReduction();
    expect(core.getState().entropy).toBeLessThan(before);
  });
  it('自我學習: 任務後萃取經驗含 5T 狀態 (v5 傳遞)', async () => {
    // RED: 驗證 executeSwarmTask 將 5T 驗算結果傳入 evolution
    // 產物通過 5T (verifyZeroHallucination=true) → 經驗應為 success + violations 空
    const core = new SwarmCore();
    await core.executeSwarmTask('測試 v5 傳遞', 'unit-test');
    const fs = await import('node:fs/promises');
    const { readdir } = fs;
    const files = await readdir(process.cwd());
    const log = files.find((f) => f.endsWith('.jsonl'));
    expect(log).toBeTruthy();
    const content = await fs.readFile(log!, 'utf-8');
    const lastLine = content.trim().split('\n').pop()!;
    const rec = JSON.parse(lastLine);
    // v5 傳遞正確 → outcome=success → violations 應為空
    expect(rec.outcome).toBe('success');
    expect(rec.violations).toEqual([]);
  }, 15000);
});
