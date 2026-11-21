/**
 * ==========================================
 * 完全代主自行 (Complete Autonomous Delegation)
 * ==========================================
 * 
 * 模組導出文件
 * 
 * 「代理者在完全授權範圍內，自主、獨立、全面地代替主體行使職權與執行行動。」
 */

// 類型導出
export type {
  // 授權範圍
  DelegationPermission,
  DelegationRestrictionType,
  DelegationRestriction,
  ICompleteDelegationScope,
  
  // 自主決策
  DecisionContext,
  DecisionOption,
  DecisionConstraint,
  AutonomousDecision,
  
  // 執行結果
  DelegationResult,
  DelegationReport,
  
  // 監控相關
  DelegationAnomaly,
  DelegationMonitorStatus,
  
  // 代理者介面
  ICompleteDelegationAgent,
  
  // 決策引擎介面
  IAutonomousDecisionEngine,
  
  // 授權管理器介面
  ICompleteDelegationManager,
  
  // 事件常數
  DelegationEventNames,
  DelegationTopics,
} from '../../types/complete-delegation';

// 類實例導出
export { CompleteDelegationManager } from './delegation-manager';
export { AutonomousDecisionEngine } from './autonomous-decision-engine';
export { CompleteDelegationAgent } from './complete-delegation-agent';

// 工廠函數導出
export {
  createCompleteDelegationAgent,
  executeCompleteDelegationTask,
} from './complete-delegation-agent';

// 單例函數導出
export {
  getDelegationManager,
  resetDelegationManager,
} from './delegation-manager';

export {
  getDecisionEngine,
  resetDecisionEngine,
} from './autonomous-decision-engine';

/**
 * ==========================================
 * 使用範例
 * ==========================================
 * 
 * ```typescript
 * import {
 *   createCompleteDelegationAgent,
 *   executeCompleteDelegationTask,
 * } from './agents/complete-delegation';
 * 
 * // 1. 創建完全代主自行代理
 * const agent = await createCompleteDelegationAgent({
 *   principalId: 'user-123',
 *   permissions: ['full'],
 *   description: 'ESG 報告代理',
 * });
 * 
 * // 2. 執行完全代主自行任務
 * const result = await executeCompleteDelegationTask(
 *   agent,
 *   'generate-esg-report',
 *   { data: 'test-data' }
 * );
 * 
 * console.log('執行結果:', result);
 * ```
 */
