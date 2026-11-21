/**
 * ==========================================
 * 完全代主自行 (Complete Autonomous Delegation)
 * ==========================================
 * 
 * 類型定義文件
 * 
 * 「代理者在完全授權範圍內，自主、獨立、全面地代替主體行使職權與執行行動。」
 */

import { IComponentCore, IBusEvent } from './core-contract';

// ==========================================
// 授權範圍
// ==========================================

/**
 * 授權權限類型
 */
export type DelegationPermission =
  | 'read'           // 讀取權限
  | 'write'          // 寫入權限
  | 'execute'        // 執行權限
  | 'decide'         // 決策權限
  | 'delegate'       // 再授權權限
  | 'govern'         // 治理權限
  | 'audit'          // 審計權限
  | 'monitor'        // 監控/觀測權限
  | 'full';          // 完全權限

/**
 * 授權限制類型
 */
export type DelegationRestrictionType =
  | 'scope'          // 範圍限制
  | 'time'           // 時間限制
  | 'resource'       // 資源限制
  | 'approval';      // 審批限制

/**
 * 授權限制
 */
export interface DelegationRestriction {
  /** 限制類型 */
  readonly type: DelegationRestrictionType;
  
  /** 限制描述 */
  readonly description: string;
  
  /** 限制值 */
  readonly value: unknown;
  
  /** 限制驗證函數 */
  readonly validator?: (value: unknown) => boolean;
}

/**
 * 完全代主自行 - 授權範圍
 */
export interface ICompleteDelegationScope {
  /** 授權唯一識別碼 */
  readonly delegationId: string;
  
  /** 主體識別碼 */
  readonly principalId: string;
  
  /** 代理者識別碼 */
  readonly agentId: string;
  
  /** 授權開始時間 */
  readonly validFrom: number;
  
  /** 授權結束時間 (Infinity 表示永久) */
  readonly validUntil: number;
  
  /** 授權權限 */
  readonly permissions: DelegationPermission[];
  
  /** 授權限制 */
  readonly restrictions: DelegationRestriction[];
  
  /** 授權簽章 */
  readonly signature: string;
  
  /** 授權描述 */
  readonly description?: string;
  
  /** 授權元數據 */
  readonly metadata?: Record<string, unknown>;
}

// ==========================================
// 自主決策
// ==========================================

/**
 * 決策上下文
 */
export interface DecisionContext {
  /** 原始意圖 */
  readonly intent: string;
  
  /** 可選方案 */
  readonly options: DecisionOption[];
  
  /** 約束條件 */
  readonly constraints: DecisionConstraint[];
  
  /** 歷史決策參考 */
  readonly historicalDecisions?: AutonomousDecision[];
  
  /** 額外上下文 */
  readonly extra?: Record<string, unknown>;
}

/**
 * 決策方案
 */
export interface DecisionOption {
  /** 方案 ID */
  readonly id: string;
  
  /** 方案描述 */
  readonly description: string;
  
  /** 方案評分 (0-1) */
  readonly score?: number;
  
  /** 方案成本 */
  readonly cost?: number;
  
  /** 方案風險 */
  readonly risk?: number;
  
  /** 方案參數 */
  readonly params?: Record<string, unknown>;
}

/**
 * 決策約束
 */
export interface DecisionConstraint {
  /** 約束類型 */
  readonly type: 'scope' | 'time' | 'resource' | 'budget' | 'custom';
  
  /** 約束描述 */
  readonly description: string;
  
  /** 約束值 */
  readonly value: unknown;
  
  /** 約束嚴重性 */
  readonly severity: 'soft' | 'hard';
}

/**
 * 自主決策結果
 */
export interface AutonomousDecision {
  /** 決策 ID */
  readonly decisionId: string;
  
  /** 選擇的方案 */
  readonly selectedOption: DecisionOption;
  
  /** 決策理由 */
  readonly rationale: string;
  
  /** 信心分數 (0-1) */
  readonly confidence: number;
  
  /** 決策時間戳 */
  readonly timestamp: number;
  
  /** 決策者 (代理者) */
  readonly decidedBy: string;
  
  /** 是否已回報主體 */
  reportedToPrincipal: boolean;
  
  /** 決策元數據 */
  readonly metadata?: Record<string, unknown>;
}

// ==========================================
// 執行結果
// ==========================================

/**
 * 執行結果
 */
export interface DelegationResult {
  /** 是否成功 */
  readonly success: boolean;
  
  /** 執行 ID */
  readonly executionId: string;
  
  /** 執行結果 */
  readonly result?: unknown;
  
  /** 錯誤訊息 */
  readonly error?: string;
  
  /** 執行時間 */
  readonly duration?: number;
  
  /** 執行元數據 */
  readonly metadata?: Record<string, unknown>;
}

/**
 * 回報內容
 */
export interface DelegationReport {
  /** 執行 ID */
  readonly executionId: string;
  
  /** 原始意圖 */
  readonly intent: string;
  
  /** 決策結果 */
  readonly decision: AutonomousDecision | null;
  
  /** 執行結果 */
  readonly result: unknown;
  
  /** 狀態 */
  readonly status: 'completed' | 'failed' | 'terminated';
  
  /** 回報時間 */
  readonly timestamp: number;
  
  /** 回報元數據 */
  readonly metadata?: Record<string, unknown>;
}

// ==========================================
// 監控相關
// ==========================================

/**
 * 異常事件
 */
export interface DelegationAnomaly {
  /** 異常 ID */
  readonly anomalyId: string;
  
  /** 授權 ID */
  readonly delegationId: string;
  
  /** 代理者 ID */
  readonly agentId: string;
  
  /** 異常類型 */
  readonly type: 'unauthorized' | 'anomalous_behavior' | 'exceeded_scope' | 'timeout';
  
  /** 異常描述 */
  readonly description: string;
  
  /** 發生時間 */
  readonly timestamp: number;
  
  /** 嚴重度 */
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** 相關事件 */
  readonly relatedEvent?: IBusEvent;
}

/**
 * 監控狀態
 */
export interface DelegationMonitorStatus {
  /** 活躍授權數量 */
  readonly activeDelegations: number;
  
  /** 今日執行次數 */
  readonly todayExecutions: number;
  
  /** 成功率 */
  readonly successRate: number;
  
  /** 平均決策信心分數 */
  readonly averageConfidence: number;
  
  /** 異常事件數量 */
  readonly anomalyCount: number;
  
  /** 最近決策 */
  readonly recentDecisions: AutonomousDecision[];
}

// ==========================================
// 代理者介面
// ==========================================

/**
 * 完全代主自行 - 代理者介面
 */
export interface ICompleteDelegationAgent extends IComponentCore {
  /** 主體識別碼 */
  readonly principal: string;
  
  /** 完全授權範圍 */
  readonly delegationScope: ICompleteDelegationScope;
  
  /**
   * 完全代主自行執行
   */
  executeOnBehalfOfPrincipal(
    intent: string,
    context?: Record<string, unknown>
  ): Promise<DelegationResult>;
  
  /**
   * 回報主體
   */
  reportToPrincipal(report: DelegationReport): Promise<void>;
  
  /**
   * 終止授權
   */
  terminateDelegation(reason: string): Promise<void>;
  
  /**
   * 獲取約束條件
   */
  getConstraints(): DecisionConstraint[];
}

// ==========================================
// 決策引擎介面
// ==========================================

/**
 * 完全代主自行 - 自主決策引擎介面
 */
export interface IAutonomousDecisionEngine {
  /**
   * 評估是否可自主執行
   */
  canAutonomouslyExecute(intent: string): Promise<boolean>;
  
  /**
   * 做出自主決策
   */
  makeDecision(context: DecisionContext): Promise<AutonomousDecision>;
  
  /**
   * 記錄決策過程
   */
  recordDecision(decision: AutonomousDecision): Promise<void>;
  
  /**
   * 回報決策結果
   */
  reportToPrincipal(decision: AutonomousDecision): Promise<void>;
}

// ==========================================
// 授權管理器介面
// ==========================================

/**
 * 完全代主自行 - 授權管理器介面
 */
export interface ICompleteDelegationManager {
  /**
   * 創建完全授權
   */
  createCompleteDelegation(params: {
    principalId: string;
    agentId: string;
    permissions: DelegationPermission[];
    restrictions?: DelegationRestriction[];
    validUntil?: number;
    description?: string;
  }): Promise<ICompleteDelegationScope>;
  
  /**
   * 驗證授權有效性
   */
  validateDelegation(
    delegationId: string,
    requiredPermission: DelegationPermission
  ): Promise<boolean>;
  
  /**
   * 獲取授權
   */
  getDelegation(delegationId: string): Promise<ICompleteDelegationScope | null>;
  
  /**
   * 終止授權
   */
  terminateDelegation(
    delegationId: string,
    reason: string
  ): Promise<void>;
  
  /**
   * 獲取活躍授權列表
   */
  getActiveDelegations(principalId?: string): Promise<ICompleteDelegationScope[]>;
}

// ==========================================
// 事件類型
// ==========================================

/**
 * 完全代主自行 - 事件名稱
 */
export const DelegationEventNames = {
  /** 授權創建 */
  DELEGATION_CREATED: 'delegation.created',
  
  /** 授權驗證 */
  DELEGATION_VALIDATED: 'delegation.validated',

  /** 客戶端經雙向同步回寫的同步訊號（client → bus → SSE 閉環） */
  DELEGATION_CLIENT_SYNC: 'delegation.client.sync',
  
  /** 授權終止 */
  DELEGATION_TERMINATED: 'delegation.terminated',
  
  /** 任務執行開始 */
  DELEGATION_EXECUTION_STARTED: 'delegation.execution.started',
  
  /** 任務執行完成 */
  DELEGATION_EXECUTION_COMPLETED: 'delegation.execution.completed',
  
  /** 任務執行失敗 */
  DELEGATION_EXECUTION_FAILED: 'delegation.execution.failed',
  
  /** 決策做出 */
  DELEGATION_DECISION_MADE: 'delegation.decision.made',
  
  /** 決策回報 */
  DELEGATION_DECISION_REPORTED: 'delegation.decision.reported',
  
  /** 異常檢測 */
  DELEGATION_ANOMALY_DETECTED: 'delegation.anomaly.detected',
  
  /** 緊急停止 */
  DELEGATION_EMERGENCY_STOP: 'delegation.emergency.stop',

  /** 告警觸發（監控→告警閉環；由觀測器發布，SSE 即時可見，不回灌觀測計數） */
  DELEGATION_ALERT_RAISED: 'delegation.alert.raised',
} as const;

/**
 * 完全代主自行 - 事件主題
 */
export const DelegationTopics = {
  /** 授權管理 */
  AUTHORIZATION: 'delegation.authorization',
  
  /** 執行管理 */
  EXECUTION: 'delegation.execution',
  
  /** 決策管理 */
  DECISION: 'delegation.decision',
  
  /** 監控管理 */
  MONITORING: 'delegation.monitoring',
  
  /** 回報管理 */
  REPORTING: 'delegation.reporting',

  /** 告警 */
  ALERT: 'delegation.alert',
} as const;
