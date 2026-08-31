/**
 * OA-Team 自我學習 · 無限進化引擎 (Self-Learning Evolution Engine)
 * 對齊: soul.md §十一 進化路線圖 Phase 3 (熵減引擎 + AI 分析 + 預測維護)
 * 5T 互引: Traceable(source_origin) / Trackable(lifecycle) / Transparent / Trustworthy
 *
 * 閉環: 任務完成 → 萃取經驗 → 熵減反思 → 寫入 TDAI (持久記憶) → 啟動時讀取優化策略
 */
import { OABClient } from './oab.js';
import { ISoulArtifact, I5TVerification } from '../types/generated/esggo-shared.js';

/// <reference path="../types/generated/esggo-shared.d.ts" />

export interface EvolutionLesson {
  /** 任務指紋 */
  taskFingerprint: string;
  /** 成功/失敗 */
  outcome: 'success' | 'failure' | 'partial';
  /** 萃取的經驗模式 (繁中描述) */
  pattern: string;
  /** 5T 違規項 (若有) */
  violations: string[];
  /** 熵值變化 */
  entropyBefore: number;
  entropyAfter: number;
  /** 效能指標 (ms) */
  latencyMs: number;
  /** 策略權重調整建議 */
  weightDelta: Partial<Record<string, number>>;
  /** 溯源 */
  source_origin: string;
  ts: number;
}

/**
 * 可復用 Skill 資產 (對齊 TencentDB-Agent-Memory v2.0.0 Skill 結構)
 * 經驗 (EvolutionLesson) 經審核後可升級為 Skill, 具備版本/觸發/步驟/驗證
 */
export interface EvolutionSkill {
  /** Skill 唯一 ID */
  id: string;
  /** 名稱 (繁中) */
  name: string;
  /** 版本 (語義化) */
  version: string;
  /** 觸發邊界: 何時適用此 Skill */
  trigger: string;
  /** 執行步驟 (可復用 SOP) */
  steps: string[];
  /** 驗證規則: 如何確認成功 */
  verify: string;
  /** 來源經驗指紋 */
  fromLesson: string;
  /** 可見性 (對齊 v2.0.0: private/team/restricted) */
  visibility: 'private' | 'team' | 'restricted';
  /** 使用次數 */
  uses: number;
  source_origin: string;
  ts: number;
}

export interface EvolutionState {
  /** 累計任務數 */
  tasksTotal: number;
  /** 累計成功數 */
  tasksSuccess: number;
  /** 當前熵值 */
  entropy: number;
  /** 策略權重 (可進化) */
  weights: Record<string, number>;
  /** 學習迭代次數 */
  iterations: number;
}

const SOURCE_ORIGIN = 'oa-swarm/evolution';

export class EvolutionEngine {
  private oab = new OABClient();
  private state: EvolutionState = {
    tasksTotal: 0,
    tasksSuccess: 0,
    entropy: 0.08,
    weights: {
      '5t-strict': 1.0,
      'entropy-reduce': 1.0,
      'parallel-dispatch': 1.0,
      'oab-persist': 1.0,
    },
    iterations: 0,
  };

  /** 啟動時從 TDAI 載入歷史經驗，初始化策略權重 (無限進化起點) */
  async bootstrap(): Promise<void> {
    try {
      const history = await this.oab.query(50);
      // 歷史經驗以 task 內容含 [EVOLUTION] 標記識別
      const lessons = history.filter((h) => h.task.startsWith('[EVOLUTION]'));
      this.state.iterations = lessons.length;
      // 從歷史 JSON 解析 outcome 統計 (無限進化: 成功多則提高 5t-strict 權重)
      let success = 0;
      for (const l of lessons) {
        try {
          const j = JSON.parse(l.task.replace('[EVOLUTION] ', ''));
          if (j.outcome === 'success') success++;
        } catch { /* ignore parse */ }
      }
      if (lessons.length > 0) {
        const successRate = success / lessons.length;
        this.state.weights['5t-strict'] = Math.min(2.0, 0.5 + successRate);
        console.log(`[EVOLUTION] bootstrap: ${lessons.length} 歷史經驗載入, 5t-strict 權重=${this.state.weights['5t-strict'].toFixed(2)}`);
      }
    } catch (e) {
      console.error('[EVOLUTION] bootstrap failed', (e as Error).message);
    }
  }

  /**
   * 從單次任務萃取經驗 (學習核心)
   */
  extractLesson(opts: {
    task: string;
    artifact?: ISoulArtifact;
    v5?: I5TVerification;
    latencyMs: number;
    entropyBefore: number;
    entropyAfter: number;
    error?: string;
  }): EvolutionLesson {
    const { task, artifact, v5, latencyMs, entropyBefore, entropyAfter, error } = opts;
    const outcome: EvolutionLesson['outcome'] = error
      ? 'failure'
      : v5?.passed
        ? 'success'
        : 'partial';

    const violations: string[] = [];
    if (v5) {
      if (!v5.traceable) violations.push('traceable');
      if (!v5.trackable) violations.push('trackable');
      if (!v5.tangible) violations.push('tangible');
      if (!v5.transparent) violations.push('transparent');
      if (!v5.trustworthy) violations.push('trustworthy');
    }

    // 經驗模式萃取 (繁中)
    let pattern = '';
    if (outcome === 'failure') {
      pattern = `任務「${task.slice(0, 50)}」失敗: ${error?.slice(0, 100) || '未知'}. 建議降級或拆分。`;
    } else if (violations.length > 0) {
      pattern = `任務「${task.slice(0, 50)}」完成但 5T 未全過: ${violations.join('/')}. 強化對應驗算。`;
    } else if (latencyMs > 30000) {
      pattern = `任務「${task.slice(0, 50)}」延遲偏高 (${latencyMs}ms). 考慮增量輸出或並行化。`;
    } else {
      pattern = `任務「${task.slice(0, 50)}」順利完成 (${latencyMs}ms, 熵 ${entropyAfter.toFixed(3)}). 模式可複用。`;
    }

    // 權重調整建議
    const weightDelta: Partial<Record<string, number>> = {};
    if (violations.includes('trustworthy')) weightDelta['5t-strict'] = 0.1;
    if (latencyMs > 30000) weightDelta['parallel-dispatch'] = 0.1;
    if (entropyAfter < entropyBefore) weightDelta['entropy-reduce'] = 0.05;

    return {
      taskFingerprint: (artifact?.hash_lock || task).slice(0, 16),
      outcome,
      pattern,
      violations,
      entropyBefore,
      entropyAfter,
      latencyMs,
      weightDelta,
      source_origin: SOURCE_ORIGIN,
      ts: Date.now(),
    };
  }

  /** 熵減反思: 套用權重調整 + 熵值演化 */
  reflect(lesson: EvolutionLesson): void {
    this.state.tasksTotal++;
    if (lesson.outcome === 'success') this.state.tasksSuccess++;
    this.state.entropy = lesson.entropyAfter;
    this.state.iterations++;

    // 套用權重調整 (有界 0.1~2.0)
    for (const [k, d] of Object.entries(lesson.weightDelta)) {
      const cur = this.state.weights[k] ?? 1.0;
      this.state.weights[k] = Math.max(0.1, Math.min(2.0, cur + (d ?? 0)));
    }
    // 熵減: 每次反思微降 (對齊 swarm-core entropy*0.97)
    this.state.entropy = Math.max(0.01, this.state.entropy * 0.97);
  }

  /** 持久化: 寫入 TDAI (跨晝夜/跨重啟不丟) + 本地 JSONL (可驗證證據) */
  async persist(lesson: EvolutionLesson): Promise<boolean> {
    // 1. 本地 JSONL (5T Traceable + 可驗證) — 絕對路徑避免 cwd 解析歧義
    try {
      const { appendFile } = await import('node:fs/promises');
      const { resolve } = await import('node:path');
      const logPath = resolve(process.cwd(), 'evolution-log.jsonl');
      const line = JSON.stringify({ ...lesson, _content: undefined }) + '\n';
      await appendFile(logPath, line);
    } catch (e) {
      console.error('[EVOLUTION] local log failed', (e as Error).message);
    }
    // 2. TDAI (蜂寫層, 跨重啟持久)
    const ok = await this.oab.publish({
      id: `evo_${lesson.ts}`,
      from: 0,
      to: 'tdai-memory',
      channel: 'evolution',
      payload: {
        _content: `[EVOLUTION] ${lesson.pattern}`,
        task: `[EVOLUTION] ${JSON.stringify({
          outcome: lesson.outcome,
          violations: lesson.violations,
          entropy: lesson.entropyAfter,
          latencyMs: lesson.latencyMs,
          weights: this.state.weights,
          iter: this.state.iterations,
        })}`,
      },
      ts: lesson.ts,
    });
    if (ok) console.log(`[EVOLUTION] 經驗已沉澱 TDAI+本地 (#${this.state.iterations}, 熵=${this.state.entropy.toFixed(3)})`);
    return ok;
  }

  getState(): EvolutionState {
    return { ...this.state, weights: { ...this.state.weights } };
  }

  /**
   * 經驗升級為可復用 Skill (對齊 v2.0.0 Skill 強制歸檔)
   * 僅當 outcome=success 且無違規時, 才值得固化為團隊資產
   */
  promoteToSkill(lesson: EvolutionLesson, name: string, trigger: string, steps: string[], verify: string): EvolutionSkill {
    const skill: EvolutionSkill = {
      id: `skill_${lesson.taskFingerprint}_${lesson.ts}`,
      name,
      version: '1.0.0',
      trigger,
      steps,
      verify,
      fromLesson: lesson.taskFingerprint,
      visibility: 'team', // 預設團隊共享 (對齊 v2.0.0)
      uses: 0,
      source_origin: SOURCE_ORIGIN,
      ts: Date.now(),
    };
    console.log(`[EVOLUTION] 經驗升級為 Skill: ${name} v${skill.version} (visibility=${skill.visibility})`);
    return skill;
  }
}
