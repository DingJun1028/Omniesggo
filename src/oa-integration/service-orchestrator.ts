/**
 * §12.1.2 微服務編排 (Microservices Orchestration)
 * 5T: Transparent (執行日誌公開)
 */
import { freeze, uuidV4, OA_VERSION } from './types';

export interface WorkflowStep {
  name: string;
  run: () => Promise<unknown>;
}

export interface ExecutionRecord {
  readonly id: string;
  readonly step: string;
  readonly ok: boolean;
  readonly ts: number;
  readonly error?: string;
}

export class ServiceOrchestrator {
  private readonly records: ExecutionRecord[] = [];

  /** Transparent: 每步執行記錄可供觀測 */
  async executeWorkflow(steps: WorkflowStep[]): Promise<unknown[]> {
    const results: unknown[] = [];
    for (const step of steps) {
      const id = uuidV4();
      try {
        const r = await step.run();
        this.records.push(freeze({ id, step: step.name, ok: true, ts: Date.now() }));
        results.push(r);
      } catch (e) {
        this.records.push(
          freeze({ id, step: step.name, ok: false, ts: Date.now(), error: String(e) }),
        );
        throw e;
      }
    }
    return results;
  }

  getRecords(): ReadonlyArray<ExecutionRecord> {
    return freeze([...this.records]);
  }
}
