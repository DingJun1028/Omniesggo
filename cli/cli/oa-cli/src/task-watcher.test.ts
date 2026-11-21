// source_origin: 萬能奧義「每個工作項目都有 TASK ID，分身修復自動跟隨」
// 對應 task-watcher.ts 的四種健康狀態判定測試
import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  assessTask,
  watchTasks,
  formatReport,
  suggestOmniTag,
  type TrackerTask,
  type TrackerLogEntry,
  type TrackerState,
} from './task-watcher.js';

const T0 = Date.parse('2026-09-25T04:54:23.009610Z');

function mkTask(over: Partial<TrackerTask> = {}): TrackerTask {
  return {
    description: 'test',
    steps: ['a', 'b', 'c'],
    current_step: 0,
    status: 'running',
    created_at: '2026-09-25T04:54:23.008672Z',
    updated_at: '2026-09-25T04:54:23.008694Z',
    ...over,
  };
}

function log(taskId: string, events: Array<[TrackerLogEntry['event'], string, number]>): TrackerLogEntry[] {
  return events.map(([event, detail, offsetMs]) => ({
    task_id: taskId,
    timestamp: new Date(T0 + offsetMs).toISOString(),
    event,
    detail,
  }));
}

function fixtureDir(state: TrackerState, lines: TrackerLogEntry[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'task-watcher-'));
  writeFileSync(join(dir, 'tracker-state.json'), JSON.stringify(state, null, 2), 'utf-8');
  writeFileSync(
    join(dir, 'tracker-log.jsonl'),
    lines.map((l) => JSON.stringify(l)).join('\n') + '\n',
    'utf-8',
  );
  return dir;
}

describe('TASK ID 任務線監看（萬能分身修復）', () => {
  describe('assessTask 健康判定', () => {
    it('silent: running 但只有 CREATED、從未開始任何步驟（真實卡住型態）', () => {
      const h = assessTask(
        'TASK-D6741720',
        mkTask({ description: 'Auto-fix: Permission denied (publickey)' }),
        log('TASK-D6741720', [['CREATED', 'Task created', 0]]),
        { nowMs: T0 + 3 * 24 * 3600 * 1000 },
      );
      expect(h.verdict).toBe('silent');
      expect(h.reasons.join()).toMatch(/從未開始任何步驟/);
    });

    it('silent: running 且日誌完全不存在', () => {
      const h = assessTask('TASK-X', mkTask(), undefined, { nowMs: T0 });
      expect(h.verdict).toBe('silent');
      expect(h.reasons.join()).toMatch(/無任何紀錄/);
    });

    it('stale: 有在推進但超過門檻未更新', () => {
      const h = assessTask(
        'TASK-Y',
        mkTask(),
        log('TASK-Y', [
          ['CREATED', 'c', 0],
          ['STEP_START', 's', 1000],
        ]),
        { nowMs: T0 + 60 * 60 * 1000, staleAfterMinutes: 30 },
      );
      expect(h.verdict).toBe('stale');
      expect(h.reasons.join()).toMatch(/未更新/);
    });

    it('healthy: running 且剛剛推進過', () => {
      const h = assessTask(
        'TASK-Z',
        mkTask(),
        log('TASK-Z', [
          ['CREATED', 'c', 0],
          ['STEP_START', 's', 1000],
          ['STEP_DONE', 'd', 2000],
        ]),
        { nowMs: T0 + 5000, staleAfterMinutes: 30 },
      );
      expect(h.verdict).toBe('healthy');
      expect(h.stepsDone).toBe(1);
    });

    it('fake: success 但 final_output 為空（假成功）', () => {
      const h = assessTask(
        'TASK-F',
        mkTask({ status: 'success', final_output: '', completed_at: '2026-09-25T04:54:30Z' }),
        log('TASK-F', [['COMPLETED', 'done', 1000]]),
        { nowMs: T0 + 2000 },
      );
      expect(h.verdict).toBe('fake');
      expect(h.reasons.join()).toMatch(/無證據/);
    });

    it('healthy: success 且有實質輸出', () => {
      const h = assessTask(
        'TASK-G',
        mkTask({ status: 'success', final_output: 'PR #123 opened', completed_at: '2026-09-25T04:54:30Z' }),
        log('TASK-G', [['COMPLETED', 'done', 1000]]),
        { nowMs: T0 + 2000 },
      );
      expect(h.verdict).toBe('healthy');
    });

    it('failed 視為誠實回報，不算異常', () => {
      const h = assessTask('TASK-H', mkTask({ status: 'failed' }), log('TASK-H', [['FAILED', 'boom', 10]]), {
        nowMs: T0,
      });
      expect(h.verdict).toBe('healthy');
    });

    it('步驟完成數以日誌為準，而非 current_step 宣稱值', () => {
      // current_step 宣稱已到第 2 步，但日誌只有 1 筆 STEP_DONE
      const h = assessTask(
        'TASK-I',
        mkTask({ current_step: 2 }),
        log('TASK-I', [
          ['CREATED', 'c', 0],
          ['STEP_DONE', 'd0', 10],
        ]),
        { nowMs: T0 + 1000 },
      );
      expect(h.stepsDone).toBe(1);
      expect(h.stepsTotal).toBe(3);
    });
  });

  describe('OmniTag 路由建議', () => {
    it('漏洞/安全類 → 5T驗算 (agent:27)', () => {
      expect(suggestOmniTag('T', '修復 Dependabot 高優先漏洞').squad).toBe('5T驗算');
    });
    it('部署類 → 光之羽翼 (agent:15)', () => {
      expect(suggestOmniTag('T', 'PM2 reload 部署 VPS').squad).toBe('光之羽翼');
    });
    it('重構類 → 煉金熵減 (agent:21)', () => {
      expect(suggestOmniTag('T', 'refactor 重構命名遷移').squad).toBe('煉金熵減');
    });
    it('型別/契約類 → 符文契約 (agent:09)', () => {
      expect(suggestOmniTag('T', 'type 型別契約修正').squad).toBe('符文契約');
    });
    it('記憶/知識類 → 智庫聖所 (agent:03)', () => {
      expect(suggestOmniTag('T', '記憶召回 knowledge 修正').squad).toBe('智庫聖所');
    });
    it('產出的 omniTag 通過契約閘（必備三要素齊全）', () => {
      const { omniTag } = suggestOmniTag('T', '修復漏洞');
      expect(omniTag.agent).toMatch(/^agent:\d{2}$/);
      expect(omniTag.lifecycle).toBeTruthy();
      expect(omniTag.priority).toBeTruthy();
    });
  });

  describe('watchTasks 端到端（讀真實檔案格式）', () => {
    it('讀取 state+log，產出完整報告與統計', () => {
      const dir = fixtureDir(
        {
          active_tasks: { 'TASK-D6741720': mkTask({ description: 'Auto-fix: Permission denied' }) },
          completed_tasks: {
            'TASK-OK': mkTask({ status: 'success', final_output: 'done', completed_at: '2026-09-25T05:00:00Z' }),
            'TASK-FAKE': mkTask({ status: 'success', final_output: '', completed_at: '2026-09-25T05:00:00Z' }),
          },
          failed_tasks: {},
        },
        [
          ...log('TASK-D6741720', [['CREATED', 'c', 0]]),
          ...log('TASK-OK', [['COMPLETED', 'd', 10]]),
          ...log('TASK-FAKE', [['COMPLETED', 'd', 10]]),
        ],
      );
      const r = watchTasks(dir, { nowMs: T0 + 3 * 24 * 3600 * 1000 });
      expect(r.summary.total).toBe(3);
      expect(r.summary.silent).toBe(1); // D6741720
      expect(r.summary.fake).toBe(1); // FAKE
      expect(r.summary.healthy).toBe(1); // OK
      const ids = r.tasks.map((t) => t.taskId).sort();
      expect(ids).toEqual(['TASK-D6741720', 'TASK-FAKE', 'TASK-OK']);
    });

    it('檔案不存在時回傳空報告而非拋錯', () => {
      const r = watchTasks(join(tmpdir(), 'definitely-not-here-' + Date.now()));
      expect(r.summary.total).toBe(0);
      expect(r.tasks).toEqual([]);
    });

    it('formatReport 產出含 TASK ID 與 verdict 的可讀文字', () => {
      const dir = fixtureDir(
        {
          active_tasks: { 'TASK-D6741720': mkTask({ description: 'Auto-fix: Permission denied' }) },
          completed_tasks: {},
          failed_tasks: {},
        },
        log('TASK-D6741720', [['CREATED', 'c', 0]]),
      );
      const text = formatReport(watchTasks(dir, { nowMs: T0 + 3 * 24 * 3600 * 1000 }));
      expect(text).toContain('TASK-D6741720');
      expect(text).toContain('silent');
      expect(text).toContain('萬能分身修復任務線監看報告');
    });
  });

  describe('唯讀保證', () => {
    it('watchTasks 不寫入任何檔案（狀態檔 mtime/內容不變）', async () => {
      const dir = fixtureDir(
        { active_tasks: { 'T': mkTask() }, completed_tasks: {}, failed_tasks: {} },
        log('T', [['CREATED', 'c', 0]]),
      );
      const { readFileSync, statSync } = await import('fs');
      const p = join(dir, 'tracker-state.json');
      const before = readFileSync(p, 'utf-8');
      const beforeMtime = statSync(p).mtimeMs;
      watchTasks(dir, { nowMs: T0 });
      expect(readFileSync(p, 'utf-8')).toBe(before);
      expect(statSync(p).mtimeMs).toBe(beforeMtime);
    });

    it('watchTasks 產出內不引用任何非存在目錄（不依賴 .hermes 路徑）', () => {
      const dir = mkdtempSync(join(tmpdir(), 'tw-nodep-'));
      mkdirSync(dir, { recursive: true });
      expect(() => watchTasks(dir)).not.toThrow();
    });
  });
});
