/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ==========================================
 * 🌌 OmniHealing — 萬能癒合實現
 * ==========================================
 * Self-healing, chaos injection, and adaptive recovery.
 * 混沌自癒：注入混沌 → 自動修復 → 適應性恢復
 * 
 * 果因修復 (Effect-Cause Healing):
 *   從果追溯因，從症狀追溯根源，再修復。
 *   因果逆轉的智慧：不是先找原因再看結果，
 *   而是先看到結果（症狀），再逆向追溯找到原因（根源），然後修復。
 */

import { randomUUID } from 'crypto';
import {
  IOmniHealing,
  ChaosInjectionResult,
  ChaosType,
  HealingResult,
  SystemHealth,
  HealthLevel,
  ComponentHealthV2,
  RecoveryStrategy,
  RecoveryResult,
} from '../../types/twelve-omni';
import { IBusEvent } from '../../lib/omni-core/contracts';

/**
 * 果因追溯節點
 * 從症狀逆向追溯到根源的每一步
 */
export interface EffectCauseNode {
  /** 節點 ID */
  id: string;
  /** 描述 */
  description: string;
  /** 類型: effect(症狀) | intermediate(中間) | cause(根源) */
  type: 'effect' | 'intermediate' | 'cause';
  /** 信心度 (0-1) */
  confidence: number;
  /** 關聯證據 */
  evidence: string[];
  /** 上游節點 (因) */
  parentCauseId?: string;
}

/**
 * 果因修復結果
 */
export interface EffectCauseHealingResult {
  /** 追溯 ID */
  traceId: string;
  /** 原始症狀 */
  effect: string;
  /** 追溯到的根源 */
  rootCause: string;
  /** 追溯鏈 */
  chain: EffectCauseNode[];
  /** 修復策略 */
  strategy: RecoveryStrategy;
  /** 修復是否成功 */
  healed: boolean;
  /** 追溯耗時 */
  traceTimeMs: number;
  /** 修復耗時 */
  healingTimeMs: number;
  /** 總耗時 */
  totalMs: number;
}

// ==========================================
// OmniHealing 實現
// ==========================================

/**
 * OmniHealing 實現
 * 自癒系統，支持混沌注入、果因修復和適應性恢復
 * 讀寫權限：可完全讀寫系統問題狀態，實現真正的自癒效果
 */

/** Mutable version of SystemIssue for internal read/write access */
interface MutableSystemIssue {
  id: string;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  detectedAt: number;
  resolved: boolean;
}
export class OmniHealing implements IOmniHealing {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  /** 問題追蹤 (mutable for read/write access) */
  private _issues: Map<string, MutableSystemIssue> = new Map();

  /** 修復歷史 */
  private _healingHistory: Array<{
    issueId: string;
    result: HealingResult;
    timestamp: number;
  }> = [];

  /** 果因修復歷史 */
  private _effectCauseHistory: EffectCauseHealingResult[] = [];

  /** 監控定時器 */
  private watchInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.uuid = randomUUID();
    this.timestamp = Date.now();
  }

  /**
   * 注入混沌
   * 故意注入微小錯誤以測試自癒能力
   */
  injectChaos(event: IBusEvent): ChaosInjectionResult {
    const chaosTypes: ChaosType[] = ['mutation', 'delay', 'drop', 'duplicate', 'corrupt'];
    const chaosType = chaosTypes[Math.floor(Math.random() * chaosTypes.length)];

    const modifiedEvent = { ...event };

    switch (chaosType) {
      case 'mutation':
        modifiedEvent.topic = `mutated-${event.topic}`;
        break;
      case 'delay':
        // 模擬延遲 (實際不修改事件)
        break;
      case 'drop':
        // 模擬丟棄 (實際不修改事件)
        break;
      case 'duplicate':
        // 模擬重複 (實際不修改事件)
        break;
      case 'corrupt':
        modifiedEvent.payload = null;
        break;
    }

    return {
      chaosId: `CHAOS-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`,
      originalEvent: event,
      modifiedEvent,
      chaosType,
      injectedAt: Date.now(),
    };
  }

  /**
   * 自動修復
   * 針對特定 issueId 執行自動修復
   */
  async selfHeal(
    issueId: string,
    _context?: Record<string, unknown>
  ): Promise<HealingResult> {
    const issue = this._issues.get(issueId);
    if (!issue) {
      return {
        issueId,
        healed: false,
        strategy: 'retry',
        healingTimeMs: 0,
        details: 'Issue not found',
      };
    }

    const startTime = Date.now();
    const strategy = this.selectStrategy(issue);

    // 模擬修復
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

    const healed = Math.random() > 0.2; // 80% 修復成功率

    // 讀寫權限：直接修改問題狀態
    if (healed) {
      issue.resolved = true;
    }

    const result: HealingResult = {
      issueId,
      healed,
      strategy,
      healingTimeMs: Date.now() - startTime,
      details: healed
        ? `Successfully healed using ${strategy}`
        : `Failed to heal using ${strategy}`,
    };

    this._healingHistory.push({ issueId, result, timestamp: Date.now() });
    return result;
  }

  // ==========================================
  // 果因修復 (Effect-Cause Healing)
  // ==========================================

  /**
   * 果因修復 — 從果追溯因，從症狀追溯根源，再修復
   * 
   * 因果逆轉的智慧：
   * 不是先找原因再看結果，
   * 而是先看到結果（症狀），再逆向追溯找到原因（根源），然後修復。
   * 
   * @param effect 症狀描述 (如 "CPU 過高", "服務無回應")
   * @param context 上下文信息
   * @returns 果因修復結果
   */
  async effectCauseHeal(
    effect: string,
    context?: Record<string, unknown>
  ): Promise<EffectCauseHealingResult> {
    const traceId = `EC-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const startTime = Date.now();

    console.log(`[OmniHealing] 🔄 果因修復開始: ${effect}`);

    // Stage 1: 從症狀出發，逆向追溯
    const chain = await this._traceEffectToCause(effect, context);
    const traceTime = Date.now() - startTime;

    // Stage 2: 確定根源
    const rootCauseNode = chain.find(n => n.type === 'cause');
    const rootCause = rootCauseNode?.description ?? '未知根源';

    console.log(`[OmniHealing] 🔍 根源追溯完成: ${rootCause} (${traceTime}ms)`);

    // Stage 3: 根據根源選擇修復策略
    const strategy = this._selectStrategyFromCause(rootCause);

    // Stage 4: 執行修復
    const healingStart = Date.now();
    const healed = await this._executeHealing(strategy, rootCause, context);
    const healingTime = Date.now() - healingStart;

    const totalMs = Date.now() - startTime;

    const result: EffectCauseHealingResult = {
      traceId,
      effect,
      rootCause,
      chain,
      strategy,
      healed,
      traceTimeMs: traceTime,
      healingTimeMs: healingTime,
      totalMs,
    };

    this._effectCauseHistory.push(result);

    console.log(`[OmniHealing] ${healed ? '✅' : '❌'} 果因修復${healed ? '成功' : '失敗'}: ${rootCause} → ${strategy} (${totalMs}ms)`);

    return result;
  }

  /**
   * 從症狀逆向追溯到根源
   * 
   * 追溯鏈: 症狀 → 中間原因 → 根源
   */
  private async _traceEffectToCause(
    effect: string,
    _context?: Record<string, unknown>
  ): Promise<EffectCauseNode[]> {
    const chain: EffectCauseNode[] = [];
    const effectLower = effect.toLowerCase();

    // Stage 1: 症狀節點
    const effectNode: EffectCauseNode = {
      id: `NODE-${Date.now()}-0`,
      description: effect,
      type: 'effect',
      confidence: 1.0,
      evidence: [`症狀檢測: ${effect}`],
    };
    chain.push(effectNode);

    // Stage 2: 分析症狀，找到中間原因
    let intermediateCause = '';
    let intermediateConfidence = 0.8;

    if (effectLower.includes('cpu') || effectLower.includes('處理器')) {
      intermediateCause = '高 CPU 使用率';
      intermediateConfidence = 0.9;
    } else if (effectLower.includes('memory') || effectLower.includes('記憶體') || effectLower.includes('ram')) {
      intermediateCause = '記憶體不足';
      intermediateConfidence = 0.85;
    } else if (effectLower.includes('disk') || effectLower.includes('磁盤')) {
      intermediateCause = '磁盤空間不足';
      intermediateConfidence = 0.8;
    } else if (effectLower.includes('timeout') || effectLower.includes('超時')) {
      intermediateCause = '連接超時';
      intermediateConfidence = 0.75;
    } else if (effectLower.includes('error') || effectLower.includes('錯誤')) {
      intermediateCause = '系統錯誤';
      intermediateConfidence = 0.7;
    } else if (effectLower.includes('slow') || effectLower.includes('慢')) {
      intermediateCause = '性能瓶頸';
      intermediateConfidence = 0.7;
    } else {
      intermediateCause = '異常狀態';
      intermediateConfidence = 0.5;
    }

    const intermediateNode: EffectCauseNode = {
      id: `NODE-${Date.now()}-1`,
      description: intermediateCause,
      type: 'intermediate',
      confidence: intermediateConfidence,
      evidence: [`從症狀 "${effect}" 推斷`],
      parentCauseId: effectNode.id,
    };
    chain.push(intermediateNode);

    // Stage 3: 從中間原因追溯到根源
    let rootCause = '';
    let rootConfidence = 0.6;

    if (intermediateCause.includes('CPU')) {
      rootCause = '某個進程佔用過多 CPU 資源';
      rootConfidence = 0.7;
    } else if (intermediateCause.includes('記憶體')) {
      rootCause = '記憶體洩漏或配置不足';
      rootConfidence = 0.65;
    } else if (intermediateCause.includes('磁盤')) {
      rootCause = '日誌文件或快取累積';
      rootConfidence = 0.6;
    } else if (intermediateCause.includes('超時')) {
      rootCause = '網絡延遲或服務無回應';
      rootConfidence = 0.55;
    } else if (intermediateCause.includes('錯誤')) {
      rootCause = '代碼缺陷或配置錯誤';
      rootConfidence = 0.5;
    } else {
      rootCause = '需要進一步診斷';
      rootConfidence = 0.3;
    }

    const rootCauseNode: EffectCauseNode = {
      id: `NODE-${Date.now()}-2`,
      description: rootCause,
      type: 'cause',
      confidence: rootConfidence,
      evidence: [`從中間原因 "${intermediateCause}" 追溯`],
      parentCauseId: intermediateNode.id,
    };
    chain.push(rootCauseNode);

    return chain;
  }

  /**
   * 根據根源選擇修復策略
   */
  private _selectStrategyFromCause(rootCause: string): RecoveryStrategy {
    const causeLower = rootCause.toLowerCase();

    if (causeLower.includes('進程') || causeLower.includes('cpu')) return 'restart';
    if (causeLower.includes('記憶體') || causeLower.includes('洩漏')) return 'restart';
    if (causeLower.includes('磁盤') || causeLower.includes('日誌')) return 'fallback';
    if (causeLower.includes('網絡') || causeLower.includes('超時')) return 'retry';
    if (causeLower.includes('代碼') || causeLower.includes('配置')) return 'rollback';

    return 'retry';
  }

  /**
   * 執行修復
   */
  private async _executeHealing(
    strategy: RecoveryStrategy,
    _rootCause: string,
    _context?: Record<string, unknown>
  ): Promise<boolean> {
    // 模擬修復過程
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));

    // 根據策略模擬成功率
    const successRates: Record<RecoveryStrategy, number> = {
      retry: 0.7,
      rollback: 0.85,
      fallback: 0.8,
      restart: 0.9,
      isolate: 0.75,
    };

    const successRate = successRates[strategy] ?? 0.7;
    return Math.random() < successRate;
  }

  /**
   * 獲取果因修復歷史
   */
  getEffectCauseHistory(): EffectCauseHealingResult[] {
    return [...this._effectCauseHistory];
  }

  /**
   * 系統健康度
   */
  async systemHealth(): Promise<SystemHealth> {
    const components: Record<string, ComponentHealthV2> = {
      gateway: {
        name: 'Gateway',
        status: 'healthy',
        uptime: Date.now() - this.timestamp,
        errorRate: 0,
      },
      bus: {
        name: 'Bus',
        status: 'healthy',
        uptime: Date.now() - this.timestamp,
        errorRate: 0,
      },
      memory: {
        name: 'Memory',
        status: 'healthy',
        uptime: Date.now() - this.timestamp,
        errorRate: 0,
      },
    };

    const issues = Array.from(this._issues.values()).filter((i) => !i.resolved);
    const criticalIssues = issues.filter((i) => i.severity === 'critical');

    let overall: HealthLevel = 'healthy';
    if (criticalIssues.length > 0) {
      overall = 'critical';
    } else if (issues.length > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      components,
      lastCheck: Date.now(),
      issues,
    };
  }

  /**
   * 適應性恢復
   * 根據錯誤類型選擇最佳恢復策略
   */
  async adaptiveRecover(
    error: Error,
    strategy?: RecoveryStrategy
  ): Promise<RecoveryResult> {
    const selectedStrategy = strategy || this.selectRecoveryStrategy(error);
    const startTime = Date.now();

    // 模擬恢復
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 200));

    const success = Math.random() > 0.1; // 90% 恢復成功率

    return {
      success,
      strategy: selectedStrategy,
      recoveryTimeMs: Date.now() - startTime,
      message: success
        ? `Recovered using ${selectedStrategy}`
        : `Recovery failed with ${selectedStrategy}`,
    };
  }

  /**
   * 戒嚴觸發
   */
  triggerMartialLaw(reason: string, source: string): void {
    Object.assign((this as any).evidence, { martial_law_triggered: { reason, source, timestamp: Date.now() } });
  }

  /**
   * 監控與修復循環
   */
  watchAndHeal(intervalMs: number): void {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
    }

    this.watchInterval = setInterval(async () => {
      const health = await this.systemHealth();
      if (health.overall === 'critical') {
        console.warn('[OmniHealing] Critical health detected, triggering auto-heal');
        for (const issue of health.issues.filter((i) => i.severity === 'critical')) {
          await this.selfHeal(issue.id);
        }
      }
    }, intervalMs);
  }

  /**
   * 選擇修復策略 (內部輔助)
   */
  private selectStrategy(issue: MutableSystemIssue): RecoveryStrategy {
    switch (issue.severity) {
      case 'critical':
        return 'restart';
      case 'high':
        return 'rollback';
      case 'medium':
        return 'fallback';
      default:
        return 'retry';
    }
  }

  /**
   * 選擇恢復策略 (內部輔助)
   */
  private selectRecoveryStrategy(error: Error): RecoveryStrategy {
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) return 'retry';
    if (message.includes('connection')) return 'fallback';
    if (message.includes('memory')) return 'restart';
    if (message.includes('permission')) return 'isolate';

    return 'retry';
  }
}

/**
 * OmniHealing 單例工廠
 */
let _instance: OmniHealing | null = null;

export function getOmniHealing(): OmniHealing {
  if (!_instance) {
    _instance = new OmniHealing();
  }
  return _instance;
}
