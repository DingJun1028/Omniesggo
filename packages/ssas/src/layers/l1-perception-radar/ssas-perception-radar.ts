/** @esggo/ssas v0.3.0 */

/**
 * 第 1 層：感知雷達 (Perception Radar)
 * 職責：
 *  - 接收多模態即時情境輸入（doc / code / log / event / voice / sensor）
 *  - 聚合上下文，輸出 L1 OmniComponent
 *  - 經 5T 驗證後註冊至 OmniSyncMatrix（雙向同步頻道）
 *
 * 5T 對應:
 * - Traceable: 每筆輸入標記 source_origin
 * - Trackable: 每次聚合寫入生命週期日誌（lifecycleTracker）
 * - Tangible: 輸出 L1 PerceptionInput entity，可被驗證
 * - Transparent: 推理路徑（聚合決策）與依據可查
 * - Trustworthy: 寫入後 Hash Lock + Object.freeze()，5T-PROOF 航線
 */

import { randomUUID, createHash } from 'node:crypto';
import type {
  OmniComponent,
  OmniSyncMatrix,
  SyncChannel,
  InputEvent,
  L1PerceptionInput,
} from '../schema/ssas-schema.js';
import {
  writeFiveTPassed,
  createAuditEntry,
  lifecycleTracker,
} from '../5t-governance/ssas-5t.js';

// ============================================================================
// 1. 感知雷達核心
// ============================================================================

/** 感知雷達 — 多模態即時情境輸入 */
export class PerceptionRadar {
  private matrix: OmniSyncMatrix;

  constructor(matrix: OmniSyncMatrix) {
    this.matrix = matrix;
  }

  /**
   * 接收多模態輸入，聚合情境，輸出 L1 OmniComponent
   */
  async perceive(inputs: InputEvent[], context: Record<string, unknown>): Promise<OmniComponent> {
    // 1. 校驗輸入
    const validation = this.validateInput(inputs);
    if (validation.status !== 'PASS') {
      throw new Error(`PerceptionRadar 驗證失敗 (${validation.status}): ${validation.message}`);
    }

    // 2. 聚合上下文
    const aggregated = this.aggregate(inputs, context);

    // 3. 建立 L1 OmniComponent
    const component = this.createOmniComponent(aggregated);

    // 4. 5T 驗證 + 寫入（Hold 5T gate）
    const result = await writeFiveTPassed<OmniComponent>(
      component,
      'L1',
      this.generateSourceOrigin(),
      ['voice', 'api', 'scheduler', 'webhook']
    );

    // 5. 註冊至 OmniSyncMatrix（雙向同步頻道打通）
    this.registerToMatrix(component, result.auditTrail);

    // 6. 寫入生命週期事件
    lifecycleTracker.record('L1', 'PERCEIVE', component.uuid, {
      inputCount: inputs.length,
      aggregatedContext: aggregated,
      traceable: result.traceable,
      trackable: result.trackable,
      tangible: result.tangible,
      transparent: result.transparent,
      trustworthy: result.trustworthy,
      overall: result.overall,
    });

    return result.locked as OmniComponent;
  }

  /** 校驗輸入 */
  private validateInput(inputs: InputEvent[]): { status: 'PASS' | 'FAIL'; message: string } {
    if (!inputs || inputs.length === 0) {
      return { status: 'FAIL', message: 'inputs 不能為空' };
    }
    for (const ev of inputs) {
      if (!ev.eventId) return { status: 'FAIL', message: '每個 InputEvent 必須有 eventId' };
      if (!ev.modality) return { status: 'FAIL', message: '每個 InputEvent 必須有 modality' };
      if (!ev.source_origin) return { status: 'FAIL', message: '每個 InputEvent 必須有 source_origin' };
      if (!ev.timestamp) return { status: 'FAIL', message: '每個 InputEvent 必須有 timestamp' };
      if (!ev.payload) return { status: 'FAIL', message: '每個 InputEvent 必須有 payload' };
    }
    return { status: 'PASS', message: '所有輸入校驗通過' };
  }

  /** 聚合上下文 */
  private aggregate(inputs: InputEvent[], context: Record<string, unknown>): Record<string, unknown> {
    const aggregated: Record<string, unknown> = {
      inputCount: inputs.length,
      modalities: inputs.map((i) => i.modality),
      sourceOrigins: inputs.map((i) => i.source_origin),
      capturedAt: Date.now(),
      ...context,
    };

    // 提取每筆輸入的 payload 摘要
    aggregated.inputSummaries = inputs.map((i) => ({
      eventId: i.eventId,
      payloadKey: Object.keys(i.payload as Record<string, unknown>).length,
      priority: i.priority,
    }));

    return aggregated;
  }

  /** 建立 L1 OmniComponent */
  private createOmniComponent(payload: Record<string, unknown>): OmniComponent {
    return {
      uuid: randomUUID(),
      version: '0.3.0',
      timestamp: Date.now(),
      source_origin: this.generateSourceOrigin(),
      evidence: [],
      layer: 'L1',
      componentType: 'PerceptionRadar',
      name: 'L1-Perception-Radar',
      payload,
      links: [],
      lifecycleState: 'PARSED',
      confidence: this.detectConfidence(payload),
    };
  }

  /** 偵測置信度 */
  private detectConfidence(payload: Record<string, unknown>): number {
    const count = Number(payload.inputCount ?? 0);
    const modalities = payload.modalities as string[] | undefined;
    const hasVoice = modalities?.includes('voice') ?? false;
    const hasExternal = modalities?.includes('external_api') ?? false || modalities?.includes('sensor') ?? false;

    let score = 0.5;
    if (count >= 3) score = 0.7;
    if (count >= 5) score = 0.85;
    if (hasVoice) score = Math.min(0.95, score + 0.1);
    if (hasExternal) score = Math.min(0.95, score + 0.1);

    return Math.min(0.95, score);
  }

  /** 產生來源標籤 */
  private generateSourceOrigin(): string {
    return `radar-${randomUUID()}`;
  }

  /** 註冊至 OmniSyncMatrix */
  private registerToMatrix(component: OmniComponent, auditTrail: Array<{ phase: string; action: string; source_origin: string }>) {
    this.matrix.avatars.push(component);

    this.matrix.layers.L1 = this.matrix.layers.L1 || [];
    this.matrix.layers.L1.push(component);

    // 建立雙向同步頻道（L0 → L1 → L2）
    const channel: SyncChannel = {
      channelId: `sync-L0-L1-L2-${randomUUID()}`,
      layerFrom: 'L0',
      layerTo: 'L2',
      direction: 'bidirectional',
      createdAt: Date.now(),
      lastSyncAt: Date.now(),
    };
    this.matrix.syncChannels.push(channel);

    // 記錄審計軌跡
    for (const entry of auditTrail) {
      const auditEntry: any = {
        timestamp: Date.now(),
        phase: 'L1-perception',
        action: entry.action,
        detail: { uuid: component.uuid, source_origin: entry.source_origin },
        source_origin: entry.source_origin,
        hash: createHash('sha256').update(JSON.stringify(component)).digest('hex'),
      };
      this.matrix.avatars.forEach((av) => {
        if (av.uuid === component.uuid) {
          // 信任指標記錄
          (av.payload as Record<string, unknown>).auditTrail = (av.payload as Record<string, unknown>).auditTrail || [];
          (av.payload as Record<string, unknown>).auditTrail.push(auditEntry);
        }
      });
    }

    this.matrix.resonanceScore = Math.min(1, this.matrix.resonanceScore ?? 0) + 0.01;
  }
}

// ============================================================================
// 2. 預設單例
// ============================================================================

/** 預設感知雷達單例（注入共享 OmniSyncMatrix） */
export const perceptionRadar = new PerceptionRadar({
  avatars: [],
  layers: {},
  syncChannels: [],
  resonanceScore: 0,
});
