/**
 * OA-Team 自我學習 · 無限進化引擎測試
 * Superpowers TDD: RED-GREEN-REFACTOR — 先寫測試界定行為邊界
 * 5T 互引: Traceable(source_origin) / Trustworthy(雙寫凍結)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// 隔離外部副作用: OAB (TDAI 網路) + fs (本地 JSONL)
const publishMock = vi.fn(async () => true);
const queryMock = vi.fn(async () => []);

vi.mock('../src/oab', () => ({
  OABClient: class {
    async publish() { return publishMock(); }
    async query() { return queryMock(); }
  },
  DualHiveTunnel: class { async syncToVps() { return true; } },
  OABMessage: class {},
}));

// 動態切換 cwd 讓本地 JSONL 寫入可驗證目錄
const tmp = mkdtempSync(join(tmpdir(), 'oa-evo-test-'));
vi.spyOn(process, 'cwd').mockReturnValue(tmp);

import { EvolutionEngine } from '../src/evolution';
import type { ISoulArtifact, I5TVerification } from '../types/generated/esggo-shared';

function makeArtifact(hash: string): ISoulArtifact {
  return {
    uuid: 'u1', version: '1.0.0', timestamp: Date.now(),
    source_origin: 'client:test', lifecycle: ['extract', 'dispatch'],
    hash_lock: hash, author: '蜂后', evidence: { collaborators: [1, 2] },
  } as ISoulArtifact;
}

function makeV5(passed: boolean): I5TVerification {
  return { traceable: passed, trackable: passed, tangible: passed, transparent: passed, trustworthy: passed, passed };
}

describe('EvolutionEngine 經驗萃取', () => {
  beforeEach(() => { publishMock.mockClear(); queryMock.mockClear(); });

  it('success: 5T 全過 + 無錯誤 → outcome=success', () => {
    const e = new EvolutionEngine();
    const lesson = e.extractLesson({
      task: '品牌視覺設計', artifact: makeArtifact('0xabc'), v5: makeV5(true),
      latencyMs: 1000, entropyBefore: 0.08, entropyAfter: 0.078,
    });
    expect(lesson.outcome).toBe('success');
    expect(lesson.violations).toEqual([]);
    expect(lesson.source_origin).toBe('oa-swarm/evolution');
    expect(lesson.pattern).toContain('順利完成');
  });

  it('failure: 有 error → outcome=failure', () => {
    const e = new EvolutionEngine();
    const lesson = e.extractLesson({
      task: '崩潰任務', artifact: makeArtifact('0xdef'), latencyMs: 500,
      entropyBefore: 0.08, entropyAfter: 0.08, error: 'Ollama 超時',
    });
    expect(lesson.outcome).toBe('failure');
    expect(lesson.pattern).toContain('失敗');
  });

  it('partial: 5T 有違規 → outcome=partial + violations 列出', () => {
    const e = new EvolutionEngine();
    const v5: I5TVerification = { ...makeV5(false), traceable: false, trustworthy: false };
    const lesson = e.extractLesson({
      task: '部分任務', artifact: makeArtifact('0x123'), v5,
      latencyMs: 2000, entropyBefore: 0.08, entropyAfter: 0.079,
    });
    expect(lesson.outcome).toBe('partial');
    expect(lesson.violations).toContain('traceable');
    expect(lesson.violations).toContain('trustworthy');
  });

  it('高延遲 → 建議 parallel-dispatch 權重調整', () => {
    const e = new EvolutionEngine();
    const lesson = e.extractLesson({
      task: '慢任務', artifact: makeArtifact('0x999'), v5: makeV5(true),
      latencyMs: 40000, entropyBefore: 0.08, entropyAfter: 0.078,
    });
    expect(lesson.weightDelta['parallel-dispatch']).toBeGreaterThan(0);
  });
});

describe('EvolutionEngine 反思與持久化', () => {
  beforeEach(() => { publishMock.mockClear(); queryMock.mockClear(); });

  it('reflect: 熵減 + 任務計數 + 權重有界 [0.1, 2.0]', () => {
    const e = new EvolutionEngine();
    const before = e.getState().entropy;
    const lesson = e.extractLesson({
      task: 't', artifact: makeArtifact('0x1'), v5: makeV5(true),
      latencyMs: 1000, entropyBefore: before, entropyAfter: before * 0.97,
    });
    e.reflect(lesson);
    const s = e.getState();
    expect(s.tasksTotal).toBe(1);
    expect(s.entropy).toBeLessThanOrEqual(before);
    expect(s.weights['5t-strict']).toBeGreaterThanOrEqual(0.1);
    expect(s.weights['5t-strict']).toBeLessThanOrEqual(2.0);
  });

  it('persist: 雙寫 TDAI (publish 呼叫) + 本地 JSONL 寫入', async () => {
    const e = new EvolutionEngine();
    const lesson = e.extractLesson({
      task: '持久化測試', artifact: makeArtifact('0x777'), v5: makeV5(true),
      latencyMs: 800, entropyBefore: 0.08, entropyAfter: 0.078,
    });
    e.reflect(lesson);
    const ok = await e.persist(lesson);
    expect(ok).toBe(true);
    expect(publishMock).toHaveBeenCalledTimes(1);
    // 本地 JSONL 應寫入 (Traceable 證據)
    const fs = await import('node:fs/promises');
    const files = await fs.readdir(tmp);
    const logFile = files.find((f) => f.endsWith('.jsonl'));
    expect(logFile).toBeTruthy();
    const content = await fs.readFile(join(tmp, logFile!), 'utf-8');
    expect(content).toContain('持久化測試');
  });

  it('bootstrap: 從 TDAI 載入歷史 → 迭代次數反映', async () => {
    queryMock.mockResolvedValueOnce([
      { hash: '', task: '[EVOLUTION] {"outcome":"success"}', ts: '2026-01-01' },
      { hash: '', task: '[EVOLUTION] {"outcome":"failure"}', ts: '2026-01-02' },
    ]);
    const e = new EvolutionEngine();
    await e.bootstrap();
    // bootstrap 讀取 2 條 [EVOLUTION] → iterations=2
    expect(e.getState().iterations).toBe(2);
  });
});
