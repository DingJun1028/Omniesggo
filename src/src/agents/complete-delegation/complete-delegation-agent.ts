/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ==========================================
 * 完全代主自行 - 代理者實現
 * ==========================================
 * 
 * 實現完全代主自行代理，整合授權管理、自主決策、任務執行
 * 
 * 「代理者在完全授權範圍內，自主、獨立、全面地代替主體行使職權與執行行動。」
 */

import { randomUUID } from 'crypto';
import {
  ICompleteDelegationAgent,
  ICompleteDelegationScope,
  IAutonomousDecisionEngine,
  DecisionConstraint,
  DelegationResult,
  DelegationReport,
  AutonomousDecision,
  DecisionContext,
  DecisionOption,
  DelegationEventNames,
  DelegationTopics,
} from '../../types/complete-delegation';
import { IComponentCore } from '../../types/core-contract';
import { CompleteDelegationManager, getDelegationManager } from './delegation-manager';
import { AutonomousDecisionEngine } from './autonomous-decision-engine';
import { publishDelegationEvent } from './events';

/**
 * 完全代主自行 - 代理者實現
 */
export class CompleteDelegationAgent implements ICompleteDelegationAgent {
  readonly principal: string;
  readonly delegationScope: ICompleteDelegationScope;
  readonly decisionEngine: IAutonomousDecisionEngine;

  // IComponentCore 契約欄位（萬能元件心核識別資訊）
  readonly uuid: string;
  readonly version: string = "1.0.0";
  readonly timestamp: number;
  readonly evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
  } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  private _manager: CompleteDelegationManager;
  private _executionHistory: DelegationResult[] = [];
  private _monitor: AgentMonitor;

  constructor(
    principal: string,
    scope: ICompleteDelegationScope,
    decisionEngine?: IAutonomousDecisionEngine
  ) {
    this.principal = principal;
    this.delegationScope = scope;
    this.decisionEngine = decisionEngine ?? new AutonomousDecisionEngine();
    this.uuid = randomUUID();
    this.timestamp = Date.now();
    this._manager = getDelegationManager();
    this._monitor = new AgentMonitor();
  }

  /**
   * 組件核心資訊
   */
  get signature(): IComponentCore {
    return {
      uuid: this.delegationScope.agentId,
      version: '1.0.0',
      timestamp: Date.now(),
      evidence: Object.assign({ originCause: "unknown" as string, processTrace: [] as string[], finalEffect: "unknown" as string }, { delegationId: this.delegationScope.delegationId, principal: this.principal }) as any,
    };
  }

  /**
   * 完全代主自行執行
   */
  async executeOnBehalfOfPrincipal(
    intent: string,
    context?: Record<string, unknown>
  ): Promise<DelegationResult> {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    try {
      // 1. 監控開始
      await this._monitor.startMonitoring(executionId);

      // 2. 驗證授權
      await this.validateAuthorization(intent);

      // 3. 生成可選方案
      const options = await this.generateOptions(intent, context);

      // 4. 自主決策
      const decisionContext: DecisionContext = {
        intent,
        options,
        constraints: this.getConstraints(),
        extra: context,
      };

      const decision = await this.decisionEngine.makeDecision(decisionContext);

      // 5. 執行任務
      const executionResult = await this.executeTask(decision, context);

      // 6. 記錄執行結果
      const result: DelegationResult = {
        success: true,
        executionId,
        result: executionResult,
        duration: Date.now() - startTime,
        metadata: {
          intent,
          decisionId: decision.decisionId,
          selectedOption: decision.selectedOption.id,
        },
      };

      this._executionHistory.push(result);

      // 7. 監控結束
      await this._monitor.stopMonitoring(executionId);

      return result;

    } catch (error) {
      // 錯誤處理
      const errorResult: DelegationResult = {
        success: false,
        executionId,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        metadata: {
          intent,
          errorType: error instanceof Error ? error.name : 'UnknownError',
        },
      };

      this._executionHistory.push(errorResult);

      await this._monitor.recordError(executionId, error);

      throw error;
    }
  }

  /**
   * 回報主體
   */
  async reportToPrincipal(report: DelegationReport): Promise<void> {
    // 1. 生成回報內容
    const formattedReport = await this.formatReport(report);

    // 2. 記錄回報
    console.log(
      `[CompleteDelegationAgent] 回報主體: ${this.principal}`,
      formattedReport
    );

    // 3. 發送回報事件（如果有事件總線）
    await this.sendReportEvent(report);
  }

  /**
   * 終止授權
   */
  async terminateDelegation(reason: string): Promise<void> {
    // 1. 記錄終止原因
    console.log(
      `[CompleteDelegationAgent] 終止授權: ${this.delegationScope.delegationId}`,
      reason
    );

    // 2. 回報主體
    await this.reportToPrincipal({
      executionId: 'termination',
      intent: 'terminate-delegation',
      decision: null,
      result: { reason },
      status: 'terminated',
      timestamp: Date.now(),
    });

    // 3. 終止授權
    await this._manager.terminateDelegation(
      this.delegationScope.delegationId,
      reason
    );
  }

  /**
   * 獲取約束條件
   */
  getConstraints(): DecisionConstraint[] {
    const constraints: DecisionConstraint[] = [];

    // 根據授權範圍添加約束
    for (const restriction of this.delegationScope.restrictions) {
      constraints.push({
        type: restriction.type as DecisionConstraint['type'],
        description: restriction.description,
        value: restriction.value,
        severity: 'hard',
      });
    }

    // 添加時間約束（無期限時 validUntil 為 Number.MAX_SAFE_INTEGER，不加時間約束）
    if (this.delegationScope.validUntil !== Number.MAX_SAFE_INTEGER) {
      constraints.push({
        type: 'time',
        description: '授權有效期限',
        value: this.delegationScope.validUntil,
        severity: 'hard',
      });
    }

    return constraints;
  }

  /**
   * 獲取執行歷史
   */
  getExecutionHistory(): DelegationResult[] {
    return [...this._executionHistory];
  }

  /**
   * 驗證授權
   */
  private async validateAuthorization(_intent: string): Promise<void> {
    const isValid = await this._manager.validateDelegation(
      this.delegationScope.delegationId,
      'execute'
    );

    if (!isValid) {
      throw new Error(
        `Authorization validation failed for delegation: ${this.delegationScope.delegationId}`
      );
    }
  }

  /**
   * 生成可選方案
   */
  private async generateOptions(
    _intent: string,
    _context?: Record<string, unknown>
  ): Promise<DecisionOption[]> {
    // 基本方案生成邏輯
    const options: DecisionOption[] = [
      {
        id: 'option-standard',
        description: '標準執行方案',
        score: 0.7,
        cost: 1,
        risk: 0.2,
        params: { mode: 'standard' },
      },
      {
        id: 'option-optimized',
        description: '優化執行方案',
        score: 0.8,
        cost: 1.5,
        risk: 0.15,
        params: { mode: 'optimized' },
      },
      {
        id: 'option-conservative',
        description: '保守執行方案',
        score: 0.6,
        cost: 0.8,
        risk: 0.1,
        params: { mode: 'conservative' },
      },
    ];

    return options;
  }

  /**
   * 執行任務
   */
  private async executeTask(
    decision: AutonomousDecision,
    context?: Record<string, unknown>
  ): Promise<unknown> {
    // 根據決策執行任務
    console.log(
      `[CompleteDelegationAgent] 執行任務:`,
      decision.selectedOption.description
    );

    // 模擬任務執行
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      executed: true,
      selectedOption: decision.selectedOption.id,
      decisionId: decision.decisionId,
      context,
    };
  }

  /**
   * 格式化回報
   */
  private async formatReport(report: DelegationReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }

  /**
   * 發送回報事件
   */
  private async sendReportEvent(report: DelegationReport): Promise<void> {
    console.log(
      `[CompleteDelegationAgent] 發送回報事件:`,
      report.executionId
    );
    // 經由 omni-gateway 轉發回報事件至 omni-agent-bus（深：補齊 stub）
    void publishDelegationEvent(
      DelegationEventNames.DELEGATION_DECISION_REPORTED,
      DelegationTopics.REPORTING,
      {
        executionId: report.executionId,
        status: report.status,
        decisionId: report.decision?.decisionId ?? null,
      },
      'CompleteDelegationAgent'
    );
  }

  /**
   * 生成執行 ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${randomUUID().substring(0, 8)}`;
  }
}

/**
 * 代理者監控器
 */
class AgentMonitor {
  private _activeMonitoring: Map<string, { startTime: number }> = new Map();

  async startMonitoring(executionId: string): Promise<void> {
    this._activeMonitoring.set(executionId, {
      startTime: Date.now(),
    });
    console.log(`[AgentMonitor] 開始監控: ${executionId}`);
  }

  async stopMonitoring(executionId: string): Promise<void> {
    const monitoring = this._activeMonitoring.get(executionId);
    if (monitoring) {
      const duration = Date.now() - monitoring.startTime;
      console.log(
        `[AgentMonitor] 停止監控: ${executionId}, 耗時: ${duration}ms`
      );
      this._activeMonitoring.delete(executionId);
    }
  }

  async recordError(executionId: string, error: unknown): Promise<void> {
    console.error(`[AgentMonitor] 記錄錯誤: ${executionId}`, error);
    this._activeMonitoring.delete(executionId);
  }
}

// ==========================================
// 工廠函數
// ==========================================

/**
 * 創建完全代主自行代理
 */
export async function createCompleteDelegationAgent(params: {
  principalId: string;
  agentId?: string;
  permissions?: string[];
  validUntil?: number;
  description?: string;
}): Promise<CompleteDelegationAgent> {
  const manager = getDelegationManager();

  // 創建授權範圍
  const scope = await manager.createCompleteDelegation({
    principalId: params.principalId,
    agentId: params.agentId ?? `agent_${Date.now()}`,
    permissions: (params.permissions ?? ['full']) as string[],
    validUntil: params.validUntil,
    description: params.description,
  });

  // 創建代理者
  const agent = new CompleteDelegationAgent(
    params.principalId,
    scope
  );

  return agent;
}

/**
 * 執行完全代主自行任務
 */
export async function executeCompleteDelegationTask(
  agent: CompleteDelegationAgent,
  intent: string,
  context?: Record<string, unknown>
): Promise<DelegationResult> {
  return await agent.executeOnBehalfOfPrincipal(intent, context);
}
