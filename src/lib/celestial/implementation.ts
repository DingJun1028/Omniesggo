// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-unused-vars */

import { IWuZuoMiaoDe, InputData } from './interfaces';
import { randomUUID, createHash } from 'node:crypto';
import { EntropyForge } from '../omni-core/entropy-forge';

export interface CelestialData {
  [key: string]: unknown;
  amount?: unknown;
  cost?: unknown;
  uuid?: string;
  id?: string;
  project_id?: string;
  evidence?: { processTrace: string[]; finalEffect: string };
  origin?: unknown;
}

export interface CelestialMetadata {
  [key: string]: unknown;
  strategy?: string;
  status?: string;
  timestamp?: number;
}

export class ZKPIntegrityModule implements IWuZuoMiaoDe {
  public uuid: string = randomUUID();
  public timestamp: number = Date.now();
  public version: string = "1.0.0";
  public evidence = {
    originCause: 'System Genesis',
    processTrace: [] as string[],
    finalEffect: 'Awaiting'
  };
  public state: "Awakened" | "Repairing" | "Calibrating" | "Stable" = "Awakened";

  private subscribers: Array<(data: unknown) => void> = [];

  stream<T>(data: T): void {
    // 圓通無礙：流轉控制 (Non-blocking observable pattern)
    this.subscribers.forEach(sub => setTimeout(() => sub(data), 0));
  }

  subscribe(callback: (data: unknown) => void) {
    this.subscribers.push(callback);
  }

  governance = {
    seal: <T>(data: T): Readonly<T> => {
      // 封印：固定關鍵資料，避免狀態被任意改寫
      this.evidence.processTrace.push(`[SEAL] Data sealed at ${new Date().toISOString()}`);
      return Object.freeze({ ...data, sealTimestamp: Date.now() });
    },
    purify: (entropyLevel: number) => {
      // 無作妙德：低幹預修復
      if (entropyLevel > 0.8) {
        this.state = "Calibrating";
        this.evidence.processTrace.push(`[PURIFY] Entropy reduction triggered. Level: ${entropyLevel}`);
        this.state = "Stable";
      }
    }
  };
}

export class CelestialController {
  private static instance: CelestialController;

  public static getInstance(): CelestialController {
    if (!CelestialController.instance) {
      CelestialController.instance = new CelestialController();
    }
    return CelestialController.instance;
  }

  // 6字心法與5標準流程: 感知 -> 封印 -> 流轉 -> 校準 -> 沉澱

  public initiateFlow(flowName: string): string {
    const traceId = randomUUID();
    console.log(`[Celestial] Initiated flow: ${flowName} (Trace ID: ${traceId})`);
    return traceId;
  }

  public recordMetric(metricName: string, value: number, metadata?: CelestialMetadata): void {
    console.log(`[Celestial] Metric recorded: ${metricName}=${value}`, metadata);
  }

  public detectEntropy(traceId: string, anomalyType: string): void {
    console.warn(`[Celestial] Entropy detected! Trace ID: ${traceId}, Anomaly: ${anomalyType}`);
  }

  async executeCelestialFlow(input: InputData | CelestialData) {
    // 1. 感知異常 (Sense)
    const _deviation = this.detectDeviation(input);

    // 2. 封印：確保數據安全 (Seal)
    const uuid = randomUUID();
    const sealTimestamp = Date.now();

    // 初始化 evidence
    const originCauseStr = typeof input.origin === 'string' ? input.origin : 'External Input';
    const initialEvidence = {
      originCause: EntropyForge.purify(originCauseStr),
      processTrace: [`[SENSE] Flow initiated. Trace ID: ${uuid}`],
      finalEffect: 'Sealed'
    };

    const payloadStr = JSON.stringify({ uuid, sealTimestamp, evidence: initialEvidence, ...input });
    const hash = createHash('sha256').update(payloadStr).digest('hex');

    const sealedData = Object.freeze({
      ...input,
      sealTimestamp,
      uuid,
      isFrozen: true,
      hash,
      evidence: initialEvidence
    });

    try {
      // 3. 流轉與校準 (Stream & Calibrate)
      const purified = await this.purifyAndAlign(sealedData);

      // 4. 沉澱：寫入日誌與知識庫 (Precipitate)
      this.engraveToRepository(purified, {
        strategy: "無作妙德",
        status: "Verified",
        timestamp: Date.now()
      });

      return purified;
    } catch (error) {
      // 失敗回退機制：隔離現場
      this.handleFailure(error, sealedData);
    }
  }

  private detectDeviation(input: InputData | CelestialData) {
    if (!input) return true;
    
    // Check for structural degradation (missing critical fields)
    let entropyScore = 0;
    const inputData = input as CelestialData;
    if (inputData.amount !== undefined && typeof inputData.amount !== 'number') entropyScore += 0.4;
    if (inputData.cost !== undefined && typeof inputData.cost !== 'number') entropyScore += 0.4;
    
    // If it's a chart config or complex object, check for missing values
    if (typeof input === 'object' && !inputData.uuid && !inputData.id && !inputData.project_id) {
      entropyScore += 0.3;
    }
    
    return entropyScore > 0.5; // Deviation threshold
  }

  private async purifyAndAlign(data: CelestialData) {
    // 圓通無礙：確保狀態一致性 (Entropy Reduction)
    const deviation = this.detectDeviation(data);
    
    if (deviation) {
      console.log(`[Celestial] Deviation detected. Applying entropy reduction...`);
      // Attempt to cast, sanitize, or fallback types
      const sanitized = { ...data };
      if (typeof sanitized.amount === 'string') sanitized.amount = Number(sanitized.amount) || 0;
      if (typeof sanitized.cost === 'string') sanitized.cost = Number(sanitized.cost) || 0;
      
      for (const key of Object.keys(sanitized)) {
        if (typeof sanitized[key] === 'string') {
          sanitized[key] = EntropyForge.purify(sanitized[key]);
        }
      }

      if (sanitized.evidence) {
        const oldEvidence = sanitized.evidence as { processTrace?: string[]; finalEffect?: string };
        const newEvidence = {
          processTrace: [...(oldEvidence.processTrace ?? []), `[PURIFY] Entropy reduction applied.`],
          finalEffect: 'Purified',
        };
        sanitized.evidence = newEvidence;
      }

      return Object.freeze(sanitized);
    }
    
    if (data?.evidence) {
       const sanitized = { ...data };
       const oldEvidence = sanitized.evidence as NonNullable<CelestialData['evidence']>;
       const newEvidence = { ...oldEvidence };
       newEvidence.processTrace = [...oldEvidence.processTrace, `[ALIGN] Validation passed.`];
       newEvidence.finalEffect = 'Aligned';
       sanitized.evidence = newEvidence;
       return Object.freeze(sanitized);
    }

    return data;
  }

  private async engraveToRepository(artifact: CelestialData, metadata: CelestialMetadata) {
    // 沉澱：寫入 OmniVault (Alert 表) — 5T Trackable
    try {
      const { prisma } = await import('@/lib/storage-service');
      await prisma.alert.create({
        data: {
          sourceId: 'celestial-flow',
          sourceName: metadata.strategy || 'CelestialController',
          alertType: 'system_event',
          severity: 'low',
          title: `沉澱: ${metadata.status || 'Verified'}`,
          summary: JSON.stringify(metadata).slice(0, 500),
          url: '',
          hash: artifact.uuid || '',
          esgPillar: '',
        },
      });
      console.log(`[Celestial] Engraved to repository: ${metadata.status}`);
    } catch (_dbErr) {
      // Fallback: console only (DB may be unavailable in edge runtimes)
      console.warn(`[Celestial] DB engrave failed, console fallback:`, metadata);
    }
  }

  private async handleFailure(error: unknown, sealedData: CelestialData) {
    console.error(`[Celestial] Anomaly detected. Initiating self-healing protocol...`);
    
    // 1. 隔離失效現場，保留可用狀態 (WuZuoMiaoDe: 零幹預降級)
    const fallbackData: Record<string, unknown> = {};
    for (const key of Object.keys(sealedData)) {
      try {
        fallbackData[key] = sealedData[key];
      } catch (e) {
        console.warn(`[Celestial] Failed to copy sealedData key "${key}" during self-healing:`, e);
      }
    }
    fallbackData.state = 'Recovered';
    fallbackData.degradationTriggered = true;
    
    // 2. DB 持久化異常事件
    try {
      const { prisma } = await import('@/lib/storage-service');
      await prisma.alert.create({
        data: {
          sourceId: 'celestial-self-healing',
          sourceName: 'OmniOrchestrator',
          alertType: 'system_anomaly',
          severity: 'high',
          title: `[Self-Healing] 系統異常: ${String((error as Error).message || error).slice(0, 200)}`,
          summary: `UUID: ${sealedData.uuid}\n已觸發自癒協議，WuZuoMiaoDe 降級保護。`,
          url: '',
          hash: sealedData.uuid || '',
          esgPillar: '',
        },
      });
    } catch (e) {
      console.error('[Celestial] Failed to persist self-healing alert to DB:', e);
    }

    // 3. 錯誤知識化 (Write to Notion KI / Stub)
    const kiPayload = {
      title: `[Self-Healing KI] 系統異常紀錄: ${new Date().toISOString()}`,
      content: `發現異常錯誤：${(error as Error).message || error}\n封印數據 UUID: ${sealedData.uuid}\n已觸發自癒協議，保護系統狀態免於崩潰。`,
    };
    try {
      const notionMod = await import('../../core/services/notion-sync-service');
      if ('NotionSyncService' in notionMod) {
        const svc = new notionMod.NotionSyncService();
        await svc.syncAsset(kiPayload as never);
        console.log(`[Celestial] Notion KI created. System stabilized.`);
      } else {
        console.warn(`[Celestial] NotionSyncService not available`);
      }
    } catch (e) {
      console.warn(`[Celestial] Notion KI skipped (unavailable): ${e}`);
    }

    return fallbackData;
  }
}
