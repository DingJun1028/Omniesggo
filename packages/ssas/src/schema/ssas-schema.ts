/**
 * @esggo/ssas v0.3.0
 *
 * SSAS 系統框架 — 10 層同心圓架構
 * 核心接口定義 + 5T 治理契约
 *
 * ── 設計哲學 ──
 * 用戶需求為萬能力心核 (L0), 向外擴散, 每一層服務下一層。
 * 萬能力心核 = 一心 (One Mind): 全域全端全量雙向同步終始矩陣。
 * 所有層級共同體現「一心多用」「同體一心」。
 *
 * ── 原子單位 ──
 * 每個「萬能」前輟字都擁有萬能元件 (Omni Component) 為最小原子單位。
 * 萬能元件可無限小（單欄位）或無限大（完整工作流）；作為千面化身
 * (infinite avatars) 身分, 各自一心多用, 同體一心。所有元件的
 * 組合中心 = 萬能力心核 (Omni One Mind)。
 *
 * 5T 對應:
 * - Traceable: source_origin 標記每層數據來源
 * - Trackable: timestamp 記錄生命週期, lifecycle hooks 追蹤流轉
 * - Tangible: 所有介面都有可驗證的輸出 (entity / event / report)
 * - Transparent: 推理路徑、證據鏈、決策因果可查詢
 * - Trustworthy: 資料寫入後執行 Hash Lock + Object.freeze(), 5T-PROOF 航線
 */

import { createHash, randomUUID } from 'node:crypto';
import type { Evidence, IComponentCore, sealComponentCore } from '@esggo/omni-core';

// ============================================================================
// 1. 萬能元件 (Omni Component) — 最小原子單位
// ============================================================================

/**
 * 萬能元件 — 最小原子單位。作為千面化身 (infinite avatars), 身分
 * 於萬能力心核 (One Mind) 下一心多用, 同體一心。
 *
 * 設計規則:
 * - 每個層級 (L0-L9) 的核心實體都是一個 OmniComponent
 * - payload 可承載任意結構（單欄位至完整工作流）
 * - links 建立元件間的組合關係（父子、兄弟、關聯、依賴）
 * - 雙向同步 (bidirectional sync) 於全域全端全量終始矩陣中打通
 */
export interface OmniComponent extends IComponentCore {
  /** 層級標誌 */
  layer: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9';
  /** 元件類型（用於分類） */
  componentType: string;
  /** 元件名稱 */
  name: string;
  /** 數據承載（可為任意結構 — 無限小至單欄位、無限大至完整工作流） */
  payload: Record<string, unknown>;
  /** 關聯元件（步驟） */
  links: OmniComponentLink[];
  /** 生命週期狀態 */
  lifecycleState: 'UNSEALED' | 'PARSED' | 'PROCESSED' | 'SEALED' | 'ARCHIVED';
  /** 置信度（0-1） */
  confidence: number;
}

/** 萬能元件之間的關係 */
export interface OmniComponentLink {
  targetUuid: string;
  relation: 'parent' | 'child' | 'sibling' | 'related' | 'dependency';
  weight: number;           // 關聯強度 0-1
  capturedAt: number;
}

/** 全域全端全量雙向同步終始矩陣 — 万能蜂群知識代理的底層網路拓樸。
 * 每個 OmniComponent 都是千面化身; 矩陣令所有化身於一心同步,
 * 無論来自哪一層 (L0-L9), 數據在雙向同步頻道中流轉, 永不孤立。
 */
export interface OmniSyncMatrix {
  /** 所有千面化身 (all avatars) 的平坦索引 */
  avatars: OmniComponent[];
  /** 按層級分組的化身 */
  layers: Record<
    'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9',
    OmniComponent[]
  >;
  /** 雙向同步頻道清單（每個頻道是一個同步通道） */
  syncChannels: SyncChannel[];
  /** 全網共振度（One Mind 的共振心率） */
  resonanceScore: number;   // 0-1
}

/** 雙向同步頻道 */
export interface SyncChannel {
  channelId: string;
  layerFrom: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9';
  layerTo: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9';
  direction: 'bidirectional';
  createdAt: number;
  lastSyncAt: number;
}

// ============================================================================
// 3. 萬能力心核 (Omni One Mind) — 組合中心
// ============================================================================

/**
 * 萬能力心核 — 萬能元件 (千面化身) 的組合中心。
 * 負責聚合所有層級的 OmniComponent, 維持「一心多用」;
 * 同體一心 — 一心表現於所有化身, 一化身即一心。
 */
export interface OmnipotentCore extends IComponentCore {
  name: 'SSAS-Omni-One-Mind';
  root: 'true';
  /** 所有萬能元件的平坦索引（千面化身, 不論層級） */
  omniComponents: OmniComponent[];
  /** 按層級分組的元件 */
  layers: Record<
    'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8' | 'L9',
    OmniComponent[]
  >;
  /** 組合中心的共振度（萬能力心核的共振之心，所有元件的聚合信任指標） */
  resonanceScore: number;   // 0-1
  /** 百川歸一：萬能力心核的中心脈動 */
  heartbeat: {
    intervalMs: number;
    lastBeatAt: number;
    syncChannelsActive: number;
  };
  /** 版本演化記錄 */
  evolutionLog: EvolutionEntry[];
}

/** 系統配置 */
export interface SystemConfig {
  mode: 'offline' | 'hybrid' | 'cloud';
  fallbackBackend: 'local' | 'ncbdb';
  permissionLevel: 'read-only' | 'write' | 'admin';
  dataRetentionHours: number;
  heartbeatIntervalMs: number;
  originLink: string;       // 來源連結
}

/** 演化記錄項目 */
export interface EvolutionEntry {
  timestamp: number;
  version: string;
  changeType: 'add' | 'modify' | 'remove' | 'promote';
  target: string;           // 元件 UUID
  reason: string;
  justification: string;
  evidence: string[];
}

// ============================================================================
// 4. 5T 審核結果（共用）
// ============================================================================

/** 5T 審核狀態 */
export type FiveTStatus =
  | 'PENDING'   // 待審核
  | 'PASS'      // 通過
  | 'FAIL'      // 失敗
  | 'SKIPPED'   // 已跳過 (預設路徑)
  | 'BLOCKED';  // 阻塞 (需要人工介入)

/** 5T 審核結果 */
export interface FiveTResult {
  traceable: FiveTStatus;
  trackable: FiveTStatus;
  tangible: FiveTStatus;
  transparent: FiveTStatus;
  trustworthy: FiveTStatus;
  overall: FiveTStatus;
  auditTrail: AuditEntry[];
}

/** 審計軌跡項目 */
export interface AuditEntry {
  timestamp: number;
  phase: string;           // 階段名稱
  action: string;          // 操作 (e.g. "store", "seal", "verify")
  detail: Record<string, unknown>;
  source_origin: string;   // 數據來源
  hash: string;            // SHA256 哈希
}

// ============================================================================
// 4. 10 層具體欄位定義（作為資料請求/回傳形狀）
// ============================================================================

/** L0: 意圖心核 — 用戶核心目標、業務意圖、痛點 */
export interface L0IntentPayload {
  rawIntent: RawIntent;
  normalizedGoal: NormalizedGoal;
  businessIntent: BusinessIntent;
  painPoints: PainPoint[];
  context: Record<string, unknown>;
}

/** 原始用戶輸入 */
export interface RawIntent {
  text: string;
  modality: 'text' | 'voice' | 'document' | 'code' | 'event' | 'external';
  source_origin: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/** 規範化目標 */
export interface NormalizedGoal {
  goalType: 'get_info' | 'solve_problem' | 'create_content' | 'automate' | 'analyze' | 'other';
  objective: string;
  successCriteria: string[];
  priority: 'low' | 'normal' | 'high' | 'critical';
}

/** 業務意圖 */
export interface BusinessIntent {
  department: string;
  domain: string;
  requestedBy: string;
  requestId: string;
  slaHours: number;        // SLA (小時)
}

/** 痛點 */
export interface PainPoint {
  description: string;
  impact: 'low' | 'moderate' | 'high' | 'critical';
  frequency: 'occasional' | 'regular' | 'frequent' | 'constant';
  severity: number;        // 0-1
  suggestedMitigation?: string;
}

/** L1: 感知雷達 — 多模態即時情境輸入 */
export interface L1PerceptionInput {
  inputs: InputEvent[];
  aggregatedContext: Record<string, unknown>;
}

/** 輸入事件 (多模態) */
export interface InputEvent {
  eventId: string;
  modality: 'doc' | 'code' | 'log' | 'event' | 'external_api' | 'voice' | 'sensor';
  source_origin: string;
  timestamp: number;
  payload: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  lifecycleState: 'RECEIVED' | 'PARSED' | 'PROCESSED' | 'SEALED' | 'ARCHIVED';
}

/** L2: 記憶樞紐 — 5T 治理存證 */
export interface L2MemoryHub {
  memories: MemoryEntry[];
  knowledgeGraph: KnowledgeNode[];
  decisionCausalChain: DecisionNode[];
  longTermPreferences: Preference[];
  facts: Fact[];
}

/** 記憶條目 */
export interface MemoryEntry {
  content: string;
  tags: OmniTag[];
  vector?: number[];
  links: string[];
  capturedAt: number;
}

/** 知識節點 */
export interface KnowledgeNode {
  uuid: string;
  content: string;
  type: 'fact' | 'case' | 'decision' | 'preference' | 'timeline';
  tags: OmniTag[];
  evidence: string[];
  linkedNodes: string[];
  createdAt: number;
}

/** 決策節點 (決策因果) */
export interface DecisionNode {
  id: string;
  decision: string;
  context: string;
  alternatives: string[];
  rationale: string;
  outcome: string;
  timestamp: number;
  sourceOrigin: string;
}

/** 長期偏好 */
export interface Preference {
  key: string;
  value: string;
  context: string;
  createdAt: number;
  lastUpdated: number;
  sourceOrigin: string;
}

/** 事實 */
export interface Fact {
  id: string;
  statement: string;
  evidence: string[];
  confidence: number;
  sourceOrigin: string;
  capturedAt: number;
}

/** L3: 推理大腦 — Groq Qwen 引擎 */
export interface L3ReasoningBrain {
  context: ContextSnapshot;
  analysis: AnalysisResult;
  strategy: StrategyProposal[];
  simulation: SimulationResult[];
}

/** 情境快照 */
export interface ContextSnapshot {
  intentId: string;
  perceptionContext: Record<string, unknown>;
  memorySnippets: MemoryEntry[];
  environmentalFactors: string[];
  timeContext: {
    timezone: string;
    date: string;
    urgency: 'low' | 'normal' | 'high' | 'critical';
  };
}

/** 分析結果 */
export interface AnalysisResult {
  situation: string;
  coreProblem: string;
  rootCause: string;
  risks: Risk[];
  opportunities: Opportunity[];
  recommendation: string;
}

/** 風險 */
export interface Risk {
  id: string;
  description: string;
  likelihood: 'low' | 'normal' | 'high';
  impact: 'low' | 'moderate' | 'high' | 'critical';
  mitigation: string;
}

/** 機會 */
export interface Opportunity {
  id: string;
  description: string;
  potential: 'low' | 'moderate' | 'high';
  action: string;
}

/** 策略建議 */
export interface StrategyProposal {
  strategyId: string;
  title: string;
  description: string;
  priority: 'low' | 'normal' | 'high';
  estimatedEffort: string;
  dependencies: string[];
  expectedOutcome: string;
}

/** 模擬結果 */
export interface SimulationResult {
  scenario: string;
  outcome: string;
  metrics: Record<string, number>;
  confidence: number;
  assumptions: string[];
}

/** L4: 治理閘門 — 權限、合規、隱私、邊界 */
export interface L4GovernanceGate {
  gateName: string;
  gateType: 'auth' | 'compliance' | 'privacy' | 'boundary' | 'risk';
  status: FiveTStatus;
  decision: 'ALLOW' | 'DENY' | 'ESCALATE';
  justification: string;
  permissions: Permission[];
  auditTrail: AuditEntry[];
}

/** 權限 */
export interface Permission {
  resource: string;
  action: string;
  allowed: boolean;
  grantedBy: string;
  allowedAt: number;
}

/** L5: 編排中樞 — DAG 工作流 */
export interface L5Orchestration {
  workflowId: string;
  workflowType: 'dag' | 'pipeline' | 'chain';
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
  outputs: WorkflowOutput[];
}

/** 工作流節點 */
export interface WorkflowNode {
  nodeId: string;
  type: string;
  name: string;
  stage: string;           // 圖 7 模組
  dependencies: string[];
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  error?: string;
}

/** 工作流邊 */
export interface WorkflowEdge {
  from: string;
  to: string;
  condition: string;
  priority: number;
}

/** 工作流輸出 */
export interface WorkflowOutput {
  nodeId: string;
  outputId: string;
  data: Record<string, unknown>;
  capturedAt: number;
}

/** L6: 執行工坊 — 核心業務運算 */
export interface L6ExecutionWorkshop {
  tasks: ExecutionTask[];
  results: ExecutionResult[];
  metrics: ExecutionMetrics;
}

/** 執行任務 */
export interface ExecutionTask {
  taskId: string;
  stage: 'code_fix' | 'esg_score' | 'pipeline' | 'external_api' | 'report' | 'other';
  inputs: Record<string, unknown>;
  parameters: Record<string, unknown>;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED';
  error?: string;
  outputId?: string;
}

/** 執行結果 */
export interface ExecutionResult {
  outputId: string;
  taskId: string;
  data: Record<string, unknown>;
  capturedAt: number;
  evidence: string[];
}

/** 執行指標 */
export interface ExecutionMetrics {
  totalTasks: number;
  completed: number;
  failed: number;
  elapsedMs: number;
  throughput: number;      // 每秒完成數
}

/** L7: 外部網絡 — 外部整合 */
export interface L7IntegrationNetwork {
  integrations: IntegrationEntry[];
  health: IntegrationHealth[];
  rateLimit: RateLimitConfig;
}

/** 整合入口 */
export interface IntegrationEntry {
  service: string;
  protocol: 'http' | 'https' | 'webhook' | 'grpc' | 'graphql' | 'smtp';
  endpoint: string;
  authType: 'none' | 'api_key' | 'bearer_token' | 'oauth2' | 'ssh_key';
  enabled: boolean;
  healthCheck: {
    url: string;
    intervalMs: number;
    timeoutMs: number;
    expectedStatus: number;
  };
}

/** 整合健康狀態 */
export interface IntegrationHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
  lastChecked: number;
  error?: string;
}

/** 速率限制配置 */
export interface RateLimitConfig {
  default: number;
  perService: Record<string, number>;
  burst: number;
}

/** L8: 體驗門戶 — SSE 即時串流、儀表板 */
export interface L8ExperiencePortal {
  streams: StreamEndpoint[];
  dashboardConfig: DashboardConfig;
  realTimeMetrics: RealTimeMetric[];
}

/** 串流端點 */
export interface StreamEndpoint {
  streamId: string;
  type: 'sse' | 'websocket' | 'graphql_subscription';
  endpoint: string;
  eventTypes: string[];
  authenticated: boolean;
  authPolicy: AuthPolicy;
}

/** 認證策略 */
export interface AuthPolicy {
  required: boolean;
  method: 'none' | 'api_key' | 'bearer' | 'jwt' | 'cookie';
}

/** 儀表板配置 */
export interface DashboardConfig {
  widgets: DashboardWidget[];
  refreshIntervalMs: number;
  defaultTimeRange: string;
}

/** 儀表板小部件 */
export interface DashboardWidget {
  widgetId: string;
  type: 'metric' | 'chart' | 'table' | 'status' | 'log';
  title: string;
  dataSource: string;
  refreshIntervalMs?: number;
}

/** 即時指標 */
export interface RealTimeMetric {
  metricId: string;
  name: string;
  value: number;
  unit: string;
  updatedAt: number;
  trend: 'up' | 'down' | 'stable';
}

/** L9: 演化生長環 — 持續進化 */
export interface L9EvolutionRing {
  feedback: FeedbackEntry[];
  performance: PerformanceMetrics;
  modelDrift: ModelDriftReport;
  decisionChainUpdates: DecisionChainUpdate[];
  nextIterationPlan: NextIterationPlan;
}

/** 客戶回饋 */
export interface FeedbackEntry {
  id: string;
  source: 'customer' | 'survey' | 'log' | 'test' | 'external';
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  rating: number;           // 1-5
  timestamp: number;
  sourceOrigin: string;
  tags: OmniTag[];
}

/** 性能指標 */
export interface PerformanceMetrics {
  satisfactionScore: number;   // > 4.5 / 5
  responseLatencyMs: number;
  taskSuccessRate: number;      // > 99%
  codeFixRate: number;
  esgScore: number;             // 0-100
  feedbackVolume: number;
  trend: 'improving' | 'stable' | 'declining';
}

/** 模型漂移報告 */
export interface ModelDriftReport {
  metric: string;
  currentValue: number;
  baseline: number;
  drift: number;           // |current - baseline| / baseline
  severity: 'low' | 'moderate' | 'high' | 'critical';
  recommendedAction: string;
}

/** 決策鏈更新 */
export interface DecisionChainUpdate {
  layer: 'L3' | 'L5' | 'L6';
  changeType: 'add' | 'modify' | 'remove' | 'promote';
  target: string;
  reason: string;
  justification: string;
  timestamp: number;
}

/** 下一輪迭代計劃 */
export interface NextIterationPlan {
  module: string;
  action: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  estimatedEffort: string;
  rollbackPlan: string;
  dueBy: number;
}

/** 萬能標籤 (跨層級) */
export interface OmniTag {
  namespace: string;
  key: string;
  value: string;
  sourceOrigin: string;
  capturedAt: number;
}

// ============================================================================
// 5. 5T 治理輔助工具
// ============================================================================

/**
 * 建立 5T 審核結果
 * 每一層在寫入前必須通過 5T 驗證
 */
export function createFiveTResult(
  traceable: FiveTStatus,
  trackable: FiveTStatus,
  tangible: FiveTStatus,
  transparent: FiveTStatus,
  trustworthy: FiveTStatus,
  auditTrail: AuditEntry[]
): FiveTResult {
  const all = [traceable, trackable, tangible, transparent, trustworthy];
  const overall: FiveTStatus = all.every((s) => s === 'PASS') ? 'PASS' :
    (all.some((s) => s === 'BLOCKED') || all.some((s) => s === 'FAIL')) ? 'FAIL' : 'PENDING';
  return { traceable, trackable, tangible, transparent, trustworthy, overall, auditTrail };
}

/**
 * 驗證 5T 審核是否全部通過
 */
export function isFiveTPassed(result: FiveTResult): boolean {
  return result.overall === 'PASS';
}

/**
 * 建立審計軌跡項目
 */
export function createAuditEntry(
  phase: string,
  action: string,
  detail: Record<string, unknown>,
  source_origin: string
): AuditEntry {
  return {
    timestamp: Date.now(),
    phase,
    action,
    detail,
    source_origin,
    hash: createHash('sha256').update(JSON.stringify(detail)).digest('hex'),
  };
}

/**
 * 執行完整 5T 驗證（針對 L0-L9 實體）
 * 依據每一層的特性調用對應驗證
 */
export function validateSSASLayer<T extends Record<string, unknown>>(
  layer: string,
  entity: T,
  source_origin: string,
  expectedPrefixes?: string[]
): FiveTResult {
  const auditTrail: AuditEntry[] = [];

  const t1 = validateTraceable(source_origin, expectedPrefixes);
  auditTrail.push(createAuditEntry(layer, 'traceable-validate', { source_origin, ...t1 }, source_origin));
  const traceable = t1.status;

  const t2 = validateTrackable(entity.timestamp as number | undefined);
  auditTrail.push(createAuditEntry(layer, 'trackable-validate', { timestamp: entity.timestamp }, source_origin));
  const trackable = t2.status;

  const t3 = validateTangible(entity);
  auditTrail.push(createAuditEntry(layer, 'tangible-validate', { keys: Object.keys(entity) }, source_origin));
  const tangible = t3.status;

  const t4 = validateTransparent(entity.evidence as unknown[] | undefined ?? []);
  auditTrail.push(createAuditEntry(layer, 'transparent-validate', { evidenceCount: (entity.evidence as unknown[] | undefined)?.length || 0 }, source_origin));
  const transparent = t4.status;

  const t5 = validateTrustworthy(entity);
  auditTrail.push(createAuditEntry(layer, 'trustworthy-validate', { frozen: Object.isFrozen(entity) }, source_origin));
  const trustworthy = t5.status;

  const all = [traceable, trackable, tangible, transparent, trustworthy];
  const overall: FiveTStatus = all.every((s) => s === 'PASS') ? 'PASS' :
    (all.some((s) => s === 'BLOCKED') || all.some((s) => s === 'FAIL')) ? 'FAIL' : 'PENDING';

  return { traceable, trackable, tangible, transparent, trustworthy, overall, auditTrail };
}

/**
 * 透過 5T 驗證後寫入（自動 seal + freeze）
 */
export async function writeFiveTPassed<T extends Record<string, unknown>>(
  entity: T,
  layer: string,
  source_origin: string,
  expectedPrefixes?: string[]
): Promise<{ result: FiveTResult; locked: Readonly<T>; hash: string }> {
  const validation = validateSSASLayer(layer, entity, source_origin, expectedPrefixes);
  if (validation.overall !== 'PASS') {
    return { result: validation, locked: entity as Readonly<T>, hash: '' };
  }

  const hashedPayload = JSON.stringify(entity, (_, v) => (v === undefined ? null : v));
  const hash = createHash('sha256').update(hashedPayload).digest('hex');

  (entity as Record<string, unknown>).evidence = [
    ...(Array.isArray((entity as Record<string, unknown>).evidence)
      ? (entity as Record<string, unknown>).evidence
      : []),
    {
      hash,
      verifiedBy: `ssas-${layer.toLowerCase()}@0.2.0`,
      standard: '5T-PROOF',
      payload: { layer, sealedAt: new Date().toISOString() },
    },
  ];
  Object.freeze(entity);
  Object.freeze((entity as Record<string, unknown>).evidence);

  return { result: validation, locked: entity as Readonly<T>, hash };
}

// ============================================================================
// 6. 5T 驗證輔助函數
// ============================================================================

/** 驗證 Traceable (可溯源) */
export function validateTraceable(
  source_origin: string,
  expectedPrefixes?: string[]
): { status: FiveTStatus; message: string } {
  if (!source_origin || typeof source_origin !== 'string' || source_origin.trim() === '') {
    return { status: 'FAIL', message: 'source_origin 不可為空' };
  }
  if (expectedPrefixes && !expectedPrefixes.some((p) => source_origin.startsWith(p))) {
    return { status: 'FAIL', message: `source_origin 需以以下前綴之一開頭: ${expectedPrefixes.join(', ')}` };
  }
  return { status: 'PASS', message: 'source_origin 驗證通過' };
}

/** 驗證 Trackable (可追蹤) */
export function validateTrackable(timestamp: number | undefined): { status: FiveTStatus; message: string } {
  if (timestamp === undefined || typeof timestamp !== 'number' || isNaN(timestamp)) {
    return { status: 'FAIL', message: 'timestamp 不存在或格式錯誤' };
  }
  if (timestamp === 0) {
    return { status: 'FAIL', message: 'timestamp 不能為 0' };
  }
  return { status: 'PASS', message: 'timestamp 驗證通過' };
}

/** 驗證 Tangible (可感知) */
export function validateTangible(entity: Record<string, unknown>): { status: FiveTStatus; message: string } {
  let hasEntity = false;
  for (const value of Object.values(entity)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'string' && value.length > 0) { hasEntity = true; break; }
      if (Array.isArray(value) && value.length > 0) { hasEntity = true; break; }
      if (typeof value === 'object') { hasEntity = true; break; }
    }
  }
  return hasEntity
    ? { status: 'PASS', message: 'Tangible 驗證通過' }
    : { status: 'FAIL', message: 'Tangible 驗證失敗（無非空實體）' };
}

/** 驗證 Transparent (透明) */
export function validateTransparent(evidence: unknown[]): { status: FiveTStatus; message: string } {
  if (!Array.isArray(evidence)) return { status: 'FAIL', message: 'evidence 不是陣列' };
  if (evidence.length === 0) return { status: 'SKIPPED', message: '無 evidence（尚未寫入）' };
  return { status: 'PASS', message: `${evidence.length} 個 evidence` };
}

/** 驗證 Trustworthy (可信) */
export function validateTrustworthy(component: Record<string, unknown>): { status: FiveTStatus; message: string } {
  if (Object.isFrozen(component)) return { status: 'PASS', message: 'Trustworthy 已凍結' };
  return { status: 'FAIL', message: '物件尚未凍結' };
}

// ============================================================================
// 7. 預設生命週期跟蹤（Trackable 實現）
// ============================================================================

/** 生命週期 hook 監聽器 */
export type LifecycleHook = (entry: {
  layer: string;
  phase: 'CREATE' | 'STORE' | 'UPDATE' | 'SEAL' | 'VERIFY' | 'ARCHIVE';
  target: string;
  detail: Record<string, unknown>;
}) => void;

export class LifecycleTracker {
  private hooks: LifecycleHook[] = [];
  private events: Array<{ layer: string; phase: 'CREATE' | 'STORE' | 'UPDATE' | 'SEAL' | 'VERIFY' | 'ARCHIVE'; target: string; timestamp: number; detail: Record<string, unknown> }> = [];

  onHook(hook: LifecycleHook): void { this.hooks.push(hook); }

  track(layer: string, phase: 'CREATE' | 'STORE' | 'UPDATE' | 'SEAL' | 'VERIFY' | 'ARCHIVE', target: string, detail: Record<string, unknown>): void {
    const event = { layer, phase, target, timestamp: Date.now(), detail };
    this.events.push(event);
    for (const hook of this.hooks) {
      try { hook({ layer, phase, target, detail }); } catch (e) {
        console.warn(`[LifecycleTracker] Hook 失敗: ${String(e)}`);
      }
    }
  }

  getEvents(): typeof this.events { return this.events; }
  clear(): void { this.events = []; }
}

export const lifecycleTracker = new LifecycleTracker();
lifecycleTracker.onHook((entry) => {
  console.debug(`[SSAS-Lifecycle] ${entry.layer} | ${entry.phase} | ${entry.target}`);
});

export function layerEvent(layer: string, phase: string, target: string, detail: Record<string, unknown>): void {
  lifecycleTracker.track(layer, phase, target, detail);
}

// ============================================================================
// 8. 預設工具（Hash Lock + 驗證）
// ============================================================================

/** 計算 SHA256 哈希 */
export function computeHash(payload: unknown): string {
  const json = JSON.stringify(payload, (_, v) => (v === undefined ? null : v));
  return createHash('sha256').update(json).digest('hex');
}

/**
 * 套用哈希鎖（Hash Lock）於 萬能元件
 * 5T: Trustworthy — 寫入後凍結
 */
export async function applyHashLock<T extends IComponentCore>(
  component: T,
  sealProof: string
): Promise<Readonly<T>> {
  const payload = JSON.stringify(component, (_, v) => (v === undefined ? null : v));
  const hash = createHash('sha256').update(payload).digest('hex');

  (component as IComponentCore).evidence.push({
    hash,
    verifiedBy: 'ssas-framework@0.2.0',
    standard: '5T-PROOF',
    payload: { sealProof, sealedAt: new Date().toISOString() },
  });
  Object.freeze(component);
  Object.freeze((component as IComponentCore).evidence);
  return component as Readonly<T>;
}

/**
 * 驗證哈希鎖（不可篡改）
 */
export async function verifyHashLock<T extends IComponentCore>(
  component: Readonly<T>
): Promise<boolean> {
  if (!Object.isFrozen(component) || !Object.isFrozen((component as IComponentCore).evidence)) {
    return false;
  }
  const sealEvidence = (component as IComponentCore).evidence[(component as IComponentCore).evidence.length - 1];
  if (!sealEvidence || sealEvidence.standard !== '5T-PROOF') return false;

  const cloned: IComponentCore = {
    uuid: (component as IComponentCore).uuid,
    version: (component as IComponentCore).version,
    timestamp: (component as IComponentCore).timestamp,
    source_origin: (component as IComponentCore).source_origin,
    evidence: (component as IComponentCore).evidence.slice(0, -1) as Evidence[],
  };
  return computeHash(cloned) === sealEvidence.hash;
}

// ============================================================================
// 9. 萬能心核預設入口（組合中心）
// ============================================================================

/**
 * 建立 SSAS 萬能心核（組合中心）
 * 所有萬能元件的根容器
 */
export async function createOmnipotentCore(
  name: string,
  sourceOrigin: string
): Promise<Readonly<OmnipotentCore>> {
  const core: OmnipotentCore = {
      uuid: randomUUID(),
      version: '0.3.0',
      timestamp: Date.now(),
      source_origin: sourceOrigin,
      evidence: [],
      name: 'SSAS-Omni-One-Mind',
      root: 'true',
      omniComponents: [],
      layers: {
        'L0': [], 'L1': [], 'L2': [], 'L3': [], 'L4': [],
        'L5': [], 'L6': [], 'L7': [], 'L8': [], 'L9': [],
      },
      resonanceScore: 0,
      config: {
        mode: 'offline',
        fallbackBackend: 'local',
        permissionLevel: 'read-only',
        dataRetentionHours: 720,
        heartbeatIntervalMs: 60_000,
        originLink: 'https://github.com/DingJun1028/esggo',
      },
      genesis: 'SSAS-2026-10-16-v0.3.0',
      evolutionLog: [];
    };

  await sealComponentCore(core);
  return core as Readonly<OmnipotentCore>;
}

export const SSAS_SCHEMA = {
  version: '0.2.0',
  layers: ['L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9'],
  sourceOriginPrefixes: {
    L0: ['user-input', 'cli', 'api', 'scheduler'],
    L1: ['webhook', 'log', 'file', 'event-bus', 'external-api'],
    L2: ['memory-hub', 'tencentdb', 'obsidian', 'gbrain'],
    L3: ['groq-qwen', 'reasoning-engine', 'ml-model'],
    L4: ['governance-gate', 'auth-service', 'compliance-checker'],
    L5: ['orchestrator', 'dag-engine', 'pipeline-scheduler'],
    L6: ['forge', 'executor', 'worker'],
    L7: ['github', 'cloudflare', 'saas', 'external-api'],
    L8: ['sse-portal', 'dashboard', 'analytics'],
    L9: ['evolution-ring', 'feedback-collector', 'model-sync'],
  },
  tags: ['ssas', '10-layer', 'concentric-circle', 'customer-journey', '5T-governance', 'omni-component', 'omni-core'],
};
