/**
 * OmniBase — 運行時容器 (維度一: 物理空間與記憶)
 *
 * 12大萬能架構的物理載體: 模組註冊表 + 生命週期 (init/start/stop)。
 * 所有註冊進容器的模組以 deepFreeze 鎖定註冊表, 禁止運行期置換 (核心禁區)。
 */
import { deepFreeze } from '@esggo/omni-core';
import { OmniArchError } from './types';

export interface Lifecycle {
  start?(): void | Promise<void>;
  stop?(): void | Promise<void>;
}

type ModuleRecord = { readonly id: string; readonly instance: unknown };

export class OmniBase {
  private readonly registry = new Map<string, ModuleRecord>();
  private state: 'idle' | 'running' | 'stopped' = 'idle';
  private readonly startedAt: number[] = [];

  register(id: string, instance: unknown & Lifecycle): Readonly<ModuleRecord> {
    if (this.registry.has(id)) {
      throw new OmniArchError('E_MODULE_DUPLICATE', `模組 ${id} 已註冊, MECE 禁止重複`);
    }
    const record: ModuleRecord = deepFreeze({ id, instance });
    this.registry.set(id, record);
    return record;
  }

  resolve<T>(id: string): T {
    const record = this.registry.get(id);
    if (!record) {
      throw new OmniArchError('E_MODULE_NOT_FOUND', `模組 ${id} 未註冊`);
    }
    return record.instance as T;
  }

  registeredIds(): readonly string[] {
    return Object.freeze([...this.registry.keys()]);
  }

  currentState(): 'idle' | 'running' | 'stopped' {
    return this.state;
  }

  uptimeCount(): number {
    return this.startedAt.length;
  }

  async start(): Promise<void> {
    if (this.state === 'running') {
      throw new OmniArchError('E_ALREADY_RUNNING', '容器已在運行中');
    }
    for (const record of this.registry.values()) {
      const lifecycle = record.instance as Lifecycle;
      await lifecycle.start?.();
    }
    this.startedAt.push(Date.now());
    this.state = 'running';
  }

  async stop(): Promise<void> {
    if (this.state !== 'running') {
      throw new OmniArchError('E_NOT_RUNNING', '容器未在運行中');
    }
    for (const record of [...this.registry.values()].reverse()) {
      const lifecycle = record.instance as Lifecycle;
      await lifecycle.stop?.();
    }
    this.state = 'stopped';
  }
}