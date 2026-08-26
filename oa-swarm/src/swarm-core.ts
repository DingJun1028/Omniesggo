/**
 * 萬能蜂群調度核心 (Swarm Orchestrator) — 雙蜂戰隊 60 版
 * 整合: 靈魂執行鏈 + OAB 共享記憶 + 增量 ETL (任務 A/B 匯流)
 * 背景模式: 熵減循環 + SSE 串流 + HTTP API
 */
import { purify, verifyZeroHallucination, FeedbackCollector, SoulArtifact } from './protocol-5t.js';
import { SOUL_MATRIX_60, SoulAgent60, ARRAY_NAMES, agentsByArray } from './soul-matrix-60.js';
import { callLLM } from './llm.js';
import { OABClient, DualHiveTunnel, OABMessage } from './oab.js';
import { ETLPipeline } from './incremental.js';
import type { IVideoGenerationTask, IVideoGenerationResult } from '../types/generated/esggo-shared.js';
import { EvolutionEngine, EvolutionLesson } from './evolution.js';

/// <reference path="../types/generated/esggo-shared.d.ts" />

export interface SwarmState {
  entropy: number;
  tasksDone: number;
  lastPurified: SoulArtifact | null;
  agents: SoulAgent60[];
  startedAt: number;
  uptimeSec: number;
  oab: { connected: boolean; synced: number };
}

/// 影片生成任務契約 (對齊 canonical IVideoGenerationTask / OmniAutoVideo)
export interface VideoGenerationTask extends IVideoGenerationTask {}

/// 影片生成結果契約 (對齊 canonical IVideoGenerationResult)
export interface VideoGenerationResult extends IVideoGenerationResult {}

export class SwarmCore {
  private entropy = 0.08;
  private tasksDone = 0;
  private lastPurified: SoulArtifact | null = null;
  private feedback = new FeedbackCollector();
  private startedAt = Date.now();
  private listeners = new Set<(s: SwarmState) => void>();
  private oab = new OABClient();
  private tunnel = new DualHiveTunnel();
  private etl = new ETLPipeline();
  private oabSynced = 0;
  private evolution = new EvolutionEngine();

  constructor() {
    this.evolution.bootstrap().catch((e) => console.error('[EVOLUTION] bootstrap error', (e as Error).message));
  }
  getState(): SwarmState {
    return {
      entropy: this.entropy,
      tasksDone: this.tasksDone,
      lastPurified: this.lastPurified,
      agents: SOUL_MATRIX_60,
      startedAt: this.startedAt,
      uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
      oab: { connected: this.oabSynced > 0, synced: this.oabSynced },
    };
  }

  subscribe(fn: (s: SwarmState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }

  tickEntropyReduction() {
    this.entropy = Math.max(0.01, this.entropy * 0.97);
    this.emit();
  }

  /** 靈魂執行鏈: 本質提純 → 蜂群協同 → 5T 驗算凍結 → OAB 上鏈 */
  async executeSwarmTask(task: string, clientId = 'cli'): Promise<SoulArtifact> {
    const queen = SOUL_MATRIX_60[0];
    const brief = `任務由 ${clientId} 提交。蜂后提純本質：${task}`;

    // 2. 蜂群協同 (60 員路由派遣)
    const picks = this.dispatch(task);
    const summary = picks.map((a) => `【${a.title}】${a.task}`).join('\n');

    // 3. LLM 本質回應 (VPS Ollama qwen2.5:3b)
    let llm;
    try {
      llm = await callLLM(`${brief}\n協作名單:\n${summary}\n請以蜂后口吻回應 50 字內。`);
    } catch (e) {
      console.error('[LLM_ERR]', (e as Error).message);
      llm = { text: `[MOCK] 蜂群收到任務：「${task.slice(0, 60)}」。Ollama 未連線。`, model: 'mock', source: 'mock' as const };
    }

    // 4. 增量 ETL: 僅留下版本變更 (任務 A 整合)
    const rows = picks.map((p, i) => ({ version: this.tasksDone + 1, id: p.id, title: p.title }));
    const delta = await this.etl.process(`task:${this.tasksDone}`, rows);

    // 5. 5T 驗算與 Hash Lock 刻印
    const artifact = purify(`client:${clientId}`, queen.title, {
      task,
      collaborators: picks.map((p) => p.id),
      llmEcho: llm.text,
      llmSource: llm.source,
      deltaCount: delta.length,
    });
    if (!verifyZeroHallucination(artifact)) {
      throw new Error('5T 驗算失敗: 產物被竄改');
    }

    // 6. OAB 上鏈 (Trackable 軌跡) — 雙蜂隧道同步
    const msg: OABMessage = {
      id: artifact.uuid,
      from: queen.id,
      to: 'broadcast',
      channel: 'execute',
      payload: { task, hash: artifact.hash_lock },
      ts: Date.now(),
    };
    if (await this.oab.publish(msg)) this.oabSynced++;
    await this.tunnel.syncToVps(msg);

    // 7. 自我學習 · 無限進化 (從任務萃取經驗 → 熵減反思 → 寫入 TDAI)
    const entropyBefore = this.entropy;
    const t0 = (msg.ts);
    const lesson = this.evolution.extractLesson({
      task,
      artifact,
      latencyMs: Date.now() - t0,
      entropyBefore,
      entropyAfter: Math.max(0.01, entropyBefore * 0.97),
    });
    this.evolution.reflect(lesson);
    this.evolution.persist(lesson).catch(() => {});

    this.lastPurified = artifact;
    this.tasksDone++;
    this.emit();
    return artifact;
  }

  /** 依任務關鍵字派遣相關蜂 (雙蜂 60 路由) */
  private dispatch(task: string): SoulAgent60[] {
    const kw: Record<string, string[]> = {
      碼: ['07', '08', '09', '10', '11', '37', '38', '39', '40', '41'],
      設計: ['12', '13', '14', '15', '43', '44', '45', '46'],
      市場: ['17', '19', '20', '23', '47', '49', '50', '51'],
      安全: ['27', '28', '29', '55', '56', '57', '58'],
      數據: ['03', '10', '21', '24', '31', '32', '33', '34'],
      風險: ['05', '25', '26', '53', '54', '59'],
      記憶: ['01', '02', '31', '32', '33', '34', '35', '36'],
    };
    const ids = new Set<number>([1]);
    for (const [k, arr] of Object.entries(kw)) {
      if (task.includes(k)) arr.forEach((s) => ids.add(parseInt(s, 10)));
    }
    if (ids.size === 1) [2, 4, 6, 22, 30, 32, 52, 60].forEach((i) => ids.add(i));
    return [...ids].map((i) => SOUL_MATRIX_60[i - 1]);
  }

  submitFeedback(uuid: string, rating: number, note: string) {
    this.feedback.submit(uuid, rating, note);
  }

  /** OAB 歷史檢索代理 */
  async oabQuery(limit = 10) {
    return this.oab.query(limit);
  }
}
