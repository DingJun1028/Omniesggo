/**
 * OA Orchestrator — 萬能分身協調器
 * 接收 OATask, 依路由策略分派給 7 個子框架適配器, 並經 5T 閘門鑄造產出
 */
import type { ISubFrameAdapter, OAFrameConfig, OATask, OATaskResult, SubFrameId } from './types.js';
import { forgeT5 } from './t5.js';
import { SWARM_NODES, swarmTopic, nodesByArray } from './swarm-map.js';

/** 廣通回呼: 由 OAB 注入, 讓 run 結果自動廣播 (依賴反轉, 避免 OAB<->oa 循環 import) */
export type BusPublisher = (topic: string, source: string, payload: unknown) => void | Promise<void>;

export class OAOrchestrator {
  private adapters = new Map<SubFrameId, ISubFrameAdapter>();
  private publisher?: BusPublisher;

  constructor(private config: OAFrameConfig) {}

  /** 注入廣通總線 (OAB 呼叫) — 實現廣泛連通 */
  attachBus(pub: BusPublisher): void {
    this.publisher = pub;
  }

  /** 註冊子框架適配器 */
  register(adapter: ISubFrameAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  /** 簡易路由: 未指定則輪詢全部已註冊 adapter (蜂群並行) */
  private resolveRoute(task: OATask): SubFrameId[] {
    if (task.routeTo && task.routeTo.length) return task.routeTo;
    return Array.from(this.adapters.keys());
  }

  /** 執行任務 — 多框架並行 dispatch + 5T 鑄造 (每 route 獨立 timeout, 不互相等) */
  async run(task: OATask, perRouteTimeoutMs = 45_000): Promise<OATaskResult[]> {
    const routes = this.resolveRoute(task);
    const results = await Promise.all(
      routes.map(async (id) => {
        const adapter = this.adapters.get(id);
        if (!adapter) throw new Error(`adapter ${id} not registered`);
        const dispatchWithTimeout = Promise.race([
          adapter.dispatch(task),
          new Promise<{ output: string }>((_, reject) =>
            setTimeout(() => reject(new Error(`dispatch timeout ${id}`)), perRouteTimeoutMs)
          ),
        ]);
        try {
          const r = await dispatchWithTimeout;
          const forged = forgeT5({
            subFrame: id,
            output: r.output,
            uuid: `${id}-${task.id}`,
            version: '0.5.0',
            evidence: { taskId: task.id },
          });
          // 廣通: 自動廣播到 oa.pipeline.<subFrame> 主題
          await this.publisher?.(`oa.pipeline.${id}`, `orchestrator`, forged);
          return forged;
        } catch (e: any) {
          // 單一 route 逾時/失敗不阻斷其他 — 回 scaffold 錯誤, 5T 仍鑄造 (failed 標記)
          const forged = forgeT5({
            subFrame: id,
            output: `【${id} dispatch 失敗】${e.message} — 依 §19 不可寫入未驗證產出`,
            uuid: `${id}-${task.id}`,
            version: '0.5.0',
            evidence: { taskId: task.id, error: e.message },
          });
          await this.publisher?.(`oa.pipeline.${id}.failed`, `orchestrator`, forged);
          return forged;
        }
      })
    );
    return results;
  }

  /**
   * 深貫 (cross-frame chain): 把前一子框架產出作為下一子框架輸入, 形成貫穿鏈
   * 例: crewai(草稿) → deerflow(編排) → tencent-mem(存記憶)
   * 每跳經 5T 鑄造, 未過閘的跳不阻斷 (graceful)
   */
  async chain(task: OATask, chain: SubFrameId[], perRouteTimeoutMs = 45_000): Promise<OATaskResult[]> {
    const out: OATaskResult[] = [];
    let prevOutput = task.input ?? '';
    for (const id of chain) {
      const adapter = this.adapters.get(id);
      if (!adapter) {
        out.push(forgeT5({ subFrame: id, output: `【深貫中斷】${id} 未註冊`, uuid: `${id}-${task.id}`, version: '0.5.0', evidence: { taskId: task.id, error: 'unregistered' } }));
        continue;
      }
      const stepTask: OATask = { ...task, input: prevOutput };
      try {
        const r = await Promise.race([
          adapter.dispatch(stepTask),
          new Promise<{ output: string }>((_, reject) =>
            setTimeout(() => reject(new Error(`dispatch timeout ${id}`)), perRouteTimeoutMs)
          ),
        ]);
        prevOutput = r.output;
        const forged = forgeT5({ subFrame: id, output: r.output, uuid: `${id}-${task.id}`, version: '0.5.0', evidence: { taskId: task.id, chainedFrom: chain } });
        await this.publisher?.(`oa.chain.${id}`, `orchestrator`, forged);
        out.push(forged);
      } catch (e: any) {
        out.push(forgeT5({ subFrame: id, output: `【深貫跳失敗】${e.message}`, uuid: `${id}-${task.id}`, version: '0.5.0', evidence: { taskId: task.id, error: e.message } }));
      }
    }
    return out;
  }

  /** 全框架健康檢查 */
  async healthAll(): Promise<Record<SubFrameId, { status: string; detail?: string }>> {
    const out = {} as Record<SubFrameId, { status: string; detail?: string }>;
    for (const [id, ad] of this.adapters) {
      out[id] = await ad.health();
    }
    return out;
  }

  /** 蜂群廣播: 對某陣列所有節點發送訊息 (廣通) */
  broadcastSwarm(array: 'strategy' | 'tech' | 'creative' | 'marketing' | 'guard', payload: unknown): void {
    for (const n of nodesByArray(array)) {
      void this.publisher?.(swarmTopic(n.id), `orchestrator`, payload);
    }
  }

  /** 蜂群總數 (對齊 30 Souls Matrix) */
  get swarmSize(): number {
    return SWARM_NODES.length;
  }
}
