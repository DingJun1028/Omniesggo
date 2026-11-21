/**
 * ==========================================
 * 完全代主自行 - 自主決策引擎
 * ==========================================
 * 
 * 實現自主決策邏輯，包括意圖解析、方案評估、決策執行
 * 
 * 「代理者在完全授權範圍內，自主、獨立、全面地代替主體行使職權與執行行動。」
 */

import { randomUUID } from 'crypto';
import {
  IAutonomousDecisionEngine,
  DecisionContext,
  DecisionOption,
  DecisionConstraint,
  AutonomousDecision,
  DelegationEventNames,
  DelegationTopics,
} from '../../types/complete-delegation';
import {
  DecisionStrategy,
  DecisionStrategyName,
  createDecisionStrategy,
} from './decision-strategy';
import { publishDelegationEvent } from './events';

type AuditEntry = { type: string; timestamp: number; [key: string]: unknown };

/**
 * 完全代主自行 - 自主決策引擎
 */
export class AutonomousDecisionEngine implements IAutonomousDecisionEngine {
  private _decisionHistory: Map<string, AutonomousDecision[]> = new Map();
  private _confidenceThreshold: number;
  private _strategy: DecisionStrategy;
  private _auditLogger: AuditLogger;

  constructor(
    config?: {
      confidenceThreshold?: number;
      strategy?: DecisionStrategyName | DecisionStrategy;
      auditSink?: AuditSink;
    }
  ) {
    this._confidenceThreshold = config?.confidenceThreshold ?? 0.7;
    this._strategy = createDecisionStrategy(config?.strategy ?? 'balanced');
    this._auditLogger = new AuditLogger(config?.auditSink);
  }

  /**
   * 評估是否可自主執行
   */
  async canAutonomouslyExecute(intent: string): Promise<boolean> {
    // 1. 分析意圖複雜度
    const complexity = await this.analyzeIntentComplexity(intent);

    // 2. 檢查歷史決策
    const historicalSuccess = await this.getHistoricalSuccessRate(intent);

    // 3. 評估信心分數
    const confidence = this.calculateConfidence(complexity, historicalSuccess);

    // 4. 記錄評估結果
    await this._auditLogger.log({
      type: 'AUTONOMY_ASSESSMENT',
      intent,
      complexity,
      historicalSuccess,
      confidence,
      canExecute: confidence >= this._confidenceThreshold,
      timestamp: Date.now(),
    });

    return confidence >= this._confidenceThreshold;
  }

  /**
   * 做出自主決策
   */
  async makeDecision(context: DecisionContext): Promise<AutonomousDecision> {
    // 1. 驗證上下文
    this.validateContext(context);

    // 2. 解析意圖
    const intent = await this.parseIntent(context.intent);

    // 3. 評估方案
    const evaluatedOptions = await this.evaluateOptions(
      context.options,
      context.constraints
    );

    // 4. 選擇最佳方案（委託可插拔決策策略）
    const bestOption = this.selectBestOption(evaluatedOptions, context);

    // 5. 生成決策理由
    const rationale = await this.generateRationale(bestOption, context);

    // 6. 計算信心分數
    const confidence = this.calculateDecisionConfidence(bestOption, context);

    // 7. 創建決策結果
    const decision: AutonomousDecision = {
      decisionId: this.generateDecisionId(),
      selectedOption: bestOption,
      rationale,
      confidence,
      timestamp: Date.now(),
      decidedBy: 'autonomous-engine',
      reportedToPrincipal: false,
      metadata: {
        intent,
        evaluatedOptionsCount: evaluatedOptions.length,
        constraintsCount: context.constraints.length,
      },
    };

    // 8. 記錄決策
    await this.recordDecision(decision);

    return decision;
  }

  /**
   * 記錄決策過程
   */
  async recordDecision(decision: AutonomousDecision): Promise<void> {
    const agentDecisions =
      this._decisionHistory.get(decision.decidedBy) ?? [];
    agentDecisions.push(decision);
    this._decisionHistory.set(decision.decidedBy, agentDecisions);

    // 記錄到審計日誌
    await this._auditLogger.log({
      type: 'AUTONOMOUS_DECISION',
      decisionId: decision.decisionId,
      selectedOption: decision.selectedOption.id,
      confidence: decision.confidence,
      timestamp: decision.timestamp,
    });

    // 經由 omni-gateway 轉發決策事件至 omni-agent-bus（深：決策可觀測）
    void publishDelegationEvent(
      DelegationEventNames.DELEGATION_DECISION_MADE,
      DelegationTopics.DECISION,
      {
        decisionId: decision.decisionId,
        selectedOption: decision.selectedOption.id,
        confidence: decision.confidence,
      },
      'AutonomousDecisionEngine'
    );
  }

  /**
   * 回報決策結果
   */
  async reportToPrincipal(decision: AutonomousDecision): Promise<void> {
    if (decision.reportedToPrincipal) {
      return;
    }

    // 1. 生成回報內容
    const report = await this.generateDecisionReport(decision);

    // 2. 記錄回報
    await this._auditLogger.log({
      type: 'DECISION_REPORTED',
      decisionId: decision.decisionId,
      report,
      timestamp: Date.now(),
    });

    void publishDelegationEvent(
      DelegationEventNames.DELEGATION_DECISION_REPORTED,
      DelegationTopics.REPORTING,
      { decisionId: decision.decisionId },
      'AutonomousDecisionEngine'
    );

    // 3. 標記已回報
    decision.reportedToPrincipal = true;
    await this.recordDecision(decision);
  }

  /**
   * 獲取歷史決策
   */
  getDecisionHistory(agentId: string): AutonomousDecision[] {
    return this._decisionHistory.get(agentId) ?? [];
  }

  /**
   * 分析意圖複雜度
   */
  private async analyzeIntentComplexity(intent: string): Promise<number> {
    // 簡單的複雜度分析
    const factors = [
      intent.length > 100 ? 0.2 : 0,
      intent.includes('多步驟') ? 0.3 : 0,
      intent.includes('整合') ? 0.2 : 0,
      intent.includes('優化') ? 0.15 : 0,
      intent.includes('分析') ? 0.15 : 0,
    ];

    return Math.min(factors.reduce((sum, f) => sum + f, 0), 1);
  }

  /**
   * 獲取歷史成功率
   */
  private async getHistoricalSuccessRate(intent: string): Promise<number> {
    // 從歷史決策中計算成功率
    let totalDecisions = 0;
    let successfulDecisions = 0;

    for (const decisions of this._decisionHistory.values()) {
      for (const decision of decisions) {
        if (decision.metadata?.intent === intent) {
          totalDecisions++;
          if (decision.confidence >= this._confidenceThreshold) {
            successfulDecisions++;
          }
        }
      }
    }

    return totalDecisions > 0 ? successfulDecisions / totalDecisions : 0.5;
  }

  /**
   * 計算信心分數
   */
  private calculateConfidence(
    complexity: number,
    historicalSuccess: number
  ): number {
    // 複雜度越高，信心分數越低
    const complexityFactor = 1 - complexity * 0.5;

    // 歷史成功率越高，信心分數越高
    const historyFactor = historicalSuccess;

    return (complexityFactor + historyFactor) / 2;
  }

  /**
   * 驗證上下文
   */
  private validateContext(context: DecisionContext): void {
    if (!context.intent) {
      throw new Error('Intent is required');
    }

    if (!context.options || context.options.length === 0) {
      throw new Error('At least one option is required');
    }

    if (!context.constraints) {
      throw new Error('Constraints are required');
    }
  }

  /**
   * 解析意圖
   */
  private async parseIntent(intent: string): Promise<string> {
    // 簡單的意圖解析
    return intent.trim().toLowerCase();
  }

  /**
   * 評估方案
   */
  private async evaluateOptions(
    options: DecisionOption[],
    constraints: DecisionConstraint[]
  ): Promise<DecisionOption[]> {
    const evaluatedOptions: DecisionOption[] = [];

    for (const option of options) {
      const evaluated = await this.evaluateOption(option, constraints);
      if (evaluated) {
        evaluatedOptions.push(evaluated);
      }
    }

    return evaluatedOptions;
  }

  /**
   * 評估單個方案
   */
  private async evaluateOption(
    option: DecisionOption,
    constraints: DecisionConstraint[]
  ): Promise<DecisionOption | null> {
    // 檢查約束條件
    for (const constraint of constraints) {
      if (!this.satisfiesConstraint(option, constraint)) {
        return null;
      }
    }

    // 計算方案評分
    const score = this.calculateOptionScore(option, constraints);

    return {
      ...option,
      score,
    };
  }

  /**
   * 檢查方案是否滿足約束
   */
  private satisfiesConstraint(
    option: DecisionOption,
    constraint: DecisionConstraint
  ): boolean {
    // 根據約束類型進行檢查
    switch (constraint.type) {
      case 'budget':
        return (option.cost ?? 0) <= (constraint.value as number);
      case 'time':
        return true; // 時間約束檢查
      case 'resource':
        return true; // 資源約束檢查
      default:
        return true;
    }
  }

  /**
   * 計算方案評分
   */
  private calculateOptionScore(
    option: DecisionOption,
    _constraints: DecisionConstraint[]
  ): number {
    // 使用提供的評分作為基礎，如果沒有的話使用預設值
    let score = option.score ?? 0.5;

    // 根據成本調整
    if (option.cost !== undefined) {
      score -= option.cost * 0.05;
    }

    // 根據風險調整
    if (option.risk !== undefined) {
      score -= option.risk * 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * 選擇最佳方案
   */
  private selectBestOption(
    options: DecisionOption[],
    context: DecisionContext
  ): DecisionOption {
    if (options.length === 0) {
      throw new Error('No valid options available');
    }

    // 委託給可插拔決策策略（預設 balanced，與原行為一致）
    return this._strategy.select(options, context);
  }

  /**
   * 取得完整審計軌跡
   */
  getAuditTrail(): AuditEntry[] {
    return this._auditLogger.getLogs();
  }

  /**
   * 生成決策理由
   */
  private async generateRationale(
    option: DecisionOption,
    context: DecisionContext
  ): Promise<string> {
    const parts = [
      `選擇方案 "${option.description}"`,
      `因為此方案在`,
      context.constraints.length > 0
        ? `滿足 ${context.constraints.length} 個約束條件下，`
        : '',
      `提供了最佳的評分 (${(option.score ?? 0).toFixed(2)})`,
    ];

    return parts.join('');
  }

  /**
   * 計算決策信心分數
   */
  private calculateDecisionConfidence(
    option: DecisionOption,
    context: DecisionContext
  ): number {
    let confidence = option.score ?? 0.5;

    // 根據約束數量調整
    if (context.constraints.length > 0) {
      confidence *= 0.9;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * 生成決策 ID
   */
  private generateDecisionId(): string {
    return `dec_${Date.now()}_${randomUUID().substring(0, 8)}`;
  }

  /**
   * 生成決策回報
   */
  private async generateDecisionReport(
    decision: AutonomousDecision
  ): Promise<string> {
    return JSON.stringify({
      decisionId: decision.decisionId,
      selectedOption: decision.selectedOption,
      rationale: decision.rationale,
      confidence: decision.confidence,
      timestamp: decision.timestamp,
    });
  }
}

/** 審計日誌 sink：可將每一筆日誌轉送至外部儲存（資料庫、Kafka 等） */
export type AuditSink = (entry: AuditEntry) => void | Promise<void>;

/**
 * 審計日誌記錄器
 *
 * 預設將日誌存入記憶體環形緩衝區（上限 1000 筆）並輸出至 console。
 * 可透過 auditSink 將日誌轉送至外部儲存，實現可查詢、可持久化的審計軌跡。
 */
export class AuditLogger {
  private _logs: AuditEntry[] = [];
  private _sink?: AuditSink;
  private _maxEntries: number;

  constructor(sink?: AuditSink, options?: { maxEntries?: number }) {
    this._sink = sink;
    this._maxEntries = options?.maxEntries ?? 0; // 0 = no limit (full-volume)
  }

  async log(entry: AuditEntry): Promise<void> {
    this._logs.push(entry);

    // Ring buffer truncation only when maxEntries > 0 is explicitly set
    if (this._maxEntries > 0 && this._logs.length > this._maxEntries) {
      this._logs.shift();
    }

    // 控制檯輸出
    console.log(`[AuditLogger] ${entry.type}:`, JSON.stringify(entry));

    // 轉送至外部 sink（若有）
    if (this._sink) {
      try {
        await this._sink(entry);
      } catch (err) {
        console.error('[AuditLogger] sink failed:', err);
      }
    }
  }

  getLogs(type?: string): AuditEntry[] {
    return type
      ? this._logs.filter((log) => log.type === type)
      : [...this._logs];
  }

  /** 進階查詢：依謂詞過濾審計日誌 */
  query(predicate: (entry: AuditEntry) => boolean): AuditEntry[] {
    return this._logs.filter(predicate);
  }

  get size(): number {
    return this._logs.length;
  }
}

// ==========================================
// 單例實例
// ==========================================

let _instance: AutonomousDecisionEngine | null = null;

/**
 * 獲取決策引擎單例
 */
export function getDecisionEngine(
  config?: { confidenceThreshold?: number }
): AutonomousDecisionEngine {
  if (!_instance) {
    _instance = new AutonomousDecisionEngine(config);
  }
  return _instance;
}

/**
 * 重置決策引擎（用於測試）
 */
export function resetDecisionEngine(): void {
  _instance = null;
}
