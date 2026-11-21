/**
 * ==========================================
 * 🌌 12-Omni Architecture — 十二萬能元件類型定義
 * ==========================================
 *
 * 同心圓設計原則 (Concentric Circle Design):
 *   以用戶需求為中心，系統滿足成果，故同心圓——看似一個，事實上是無數個。
 *   每一層都是一個完整的同心圓，同時也是下一層的「用戶」。
 *   需求 → 服務 → 成果 → 新需求（無限循環）
 *   同一個模式，無數個尺度。
 *
 * 萬能元件 (OmniComponent):
 *   最小分子單位，可無限小亦可無限大，數量可增多或減少。
 *   因為它們都是同一個同心圓的不同尺度投影。
 *
 * Organized into 4 Dimensions:
 *   Foundation:  OmniBase, OmniMemory(萬能永憶), OmniTime, OmniComponent(萬能元件)
 *   Boundaries:  OmniTag, OmniEvidence
 *   Execution:   OmniAgent, OmniAPI, OmniBus
 *   Governance:  OmniGateway, OmniHealing, OmniEvolution
 *
 * Plus 9 Magic-Effect Combinations (奇效組合)
 */

import { IComponentCore, LifecycleStage, IBusEvent } from '../lib/omni-core/contracts';

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Foundation Dimension — 基礎維度
// ═══════════════════════════════════════════════════════════════

/**
 * OmniBase — 萬能基礎
 * The foundational layer providing type-safe primitives, constants, and shared utilities.
 */
export interface IOmniBase extends IComponentCore {
  /** 基礎常數 */
  readonly constants: OmniConstants;
  /** 型別守衛 */
  guard<T>(value: unknown, schema: string): value is T;
  /** 凍結 — 時間在那一刻凍結，讓那一刻永恆不變 */
  freeze<T extends object>(obj: T): Readonly<T>;
  /** 共享工具 */
  utils: OmniBaseUtils;
}

export interface OmniConstants {
  readonly MAX_EVENT_PAYLOAD: number;
  readonly HASH_ALGORITHM: string;
  readonly FIVE_T_DIMENSIONS: readonly string[];
  readonly LIFECYCLE_STAGES: readonly LifecycleStage[];
  readonly ENTROPY_THRESHOLD: number;
}

export interface OmniBaseUtils {
  generateUUID(): string;
  generateHash(data: string): string;
  deepClone<T>(obj: T): T;
  mergeDeep<T extends object>(target: T, source: Partial<T>): T;
}

/**
 * OmniMemory — 萬能永憶
 * Persistent, immutable memory store for knowledge crystallization.
 * 記憶體是知識沉澱的核心，支持 RAG 檢索和自動鞏固。
 */
export interface IOmniMemory extends IComponentCore {
  /** 存儲記憶體 */
  store(entry: MemoryEntry): Promise<MemoryId>;
  /** 檢索記憶 */
  retrieve(id: MemoryId): Promise<MemoryEntry | null>;
  /** 相似性搜索 */
  search(query: string, limit?: number): Promise<MemoryEntry[]>;
  /** 記憶體演化 */
  evolve(id: MemoryId, delta: Partial<MemoryEntry>): Promise<MemoryId>;
  /** 合併記憶 */
  merge(ids: MemoryId[], label: string): Promise<MemoryId>;
  /** 記憶體大小 */
  size(): Promise<number>;
  /** 記憶體清理 */
  garbageCollect(threshold?: number): Promise<number>;
}

export type MemoryId = string;

export interface MemoryEntry {
  readonly id: MemoryId;
  readonly content: string;
  readonly embedding?: number[];
  readonly metadata: MemoryMetadata;
  readonly createdAt: number;
  readonly accessCount: number;
  readonly decayFactor: number;
  readonly tags: string[];
  readonly parentIds: MemoryId[];
  readonly hash: string;
}

export interface MemoryMetadata {
  source: string;
  confidence: number;
  domain: string;
  relatedIds: MemoryId[];
}

/**
 * OmniTime — 萬能時間
 * Time-aware scheduling, time-travel debugging, and temporal event management.
 */
export interface IOmniTime extends IComponentCore {
  /** 記錄事件 */
  recordEvent(event: IBusEvent): Promise<void>;
  /** 時間旅行重放 */
  replay(startTime: number, endTime: number, filter?: TimeFilter): Promise<IBusEvent[]>;
  /** 影子測試 */
  shadowTest(event: IBusEvent): Promise<ShadowTestResult>;
  /** 排程任務 */
  schedule(task: ScheduledTask): Promise<ScheduleId>;
  /** 取消排程 */
  cancel(scheduleId: ScheduleId): Promise<void>;
  /** 獲取時間線快照 */
  snapshot(timestamp?: number): Promise<TimelineSnapshot>;
  /** 時間旅行模式 */
  enterTimeTravelMode(config: TimeTravelConfig): Promise<TimeTravelSession>;
}

export type ScheduleId = string;

export interface TimeFilter {
  topic?: string;
  source?: string;
  stage?: LifecycleStage;
}

export interface ShadowTestResult {
  readonly originalEventId: string;
  readonly shadowEventId: string;
  readonly diverged: boolean;
  readonly divergencePoint?: number;
  readonly metrics: Record<string, number>;
}

export interface ScheduledTask {
  readonly name: string;
  readonly executeAt: number;
  readonly payload: unknown;
  readonly repeat?: { interval: number; count?: number };
}

export interface TimelineSnapshot {
  readonly timestamp: number;
  readonly events: IBusEvent[];
  readonly checksum: string;
}

export interface TimeTravelConfig {
  readonly startTime: number;
  readonly endTime?: number;
  readonly replaySpeed?: number;
  readonly maxEvents?: number;
}

export interface TimeTravelSession {
  readonly sessionId: string;
  readonly startTime: number;
  status: 'active' | 'paused' | 'completed';
  eventsObserved: number;
  pause(): Promise<void>;
  resume(): Promise<void>;
  step(): Promise<IBusEvent>;
  exit(): Promise<TimelineSnapshot>;
}

/**
 * OmniComponent — 萬能元件
 * The smallest molecular unit in each Omni series, yet infinitely scalable.
 * 每個萬能系列中最小的分子，可無限小亦可無限大，數量可增多或減少，元件生命週期管理，支持版本控制和依賴追蹤。
 */
export interface IOmniComponent extends IComponentCore {
  /** 註冊組件 */
  register(component: ComponentInfo): Promise<ComponentId>;
  /** 獲取組件 */
  get(id: ComponentId): Promise<ComponentInfo | null>;
  /** 更新組件 */
  update(id: ComponentId, delta: Partial<ComponentInfo>): Promise<void>;
  /** 移除組件 */
  remove(id: ComponentId): Promise<void>;
  /** 依賴圖 */
  dependencyGraph(): Promise<DependencyGraph>;
  /** 版本歷史 */
  versionHistory(id: ComponentId): Promise<ComponentVersion[]>;
  /** 組件健康度 */
  healthCheck(id: ComponentId): Promise<ComponentHealth>;
}

export type ComponentId = string;

export interface ComponentInfo {
  readonly id: ComponentId;
  readonly name: string;
  readonly type: ComponentType;
  readonly version: string;
  readonly status: ComponentStatus;
  readonly dependencies: ComponentId[];
  readonly metadata: Record<string, unknown>;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export type ComponentType = 'agent' | 'gateway' | 'bus' | 'memory' | 'utility' | 'ui';
export type ComponentStatus = 'active' | 'inactive' | 'deprecated' | 'error';

export interface DependencyGraph {
  readonly nodes: Array<{ id: ComponentId; name: string; type: ComponentType }>;
  readonly edges: Array<{ from: ComponentId; to: ComponentId; type: 'depends' | 'extends' }>;
}

export interface ComponentVersion {
  readonly version: string;
  readonly timestamp: number;
  readonly changes: string[];
  readonly breakingChanges: boolean;
}

export interface ComponentHealth {
  readonly status: ComponentStatus;
  readonly lastCheck: number;
  readonly uptime: number;
  readonly errorRate: number;
  readonly responseTime: number;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Boundaries Dimension — 邊界維度
// ═══════════════════════════════════════════════════════════════

/**
 * OmniTag — 萬能標籤
 * Semantic tagging, classification, and knowledge graph edges.
 */
export interface IOmniTag extends IComponentCore {
  /** 創建標籤 */
  create(tag: TagDefinition): Promise<TagId>;
  /** 查詢標籤 */
  query(filter: TagFilter): Promise<TagDefinition[]>;
  /** 標籤關聯 */
  associate(tagId: TagId, targetId: string, targetType: string, relation: string): Promise<void>;
  /** 標籤圖譜 */
  graph(tagId: TagId, depth?: number): Promise<TagGraph>;
  /** 反向查詢 */
  reverseLookup(targetId: string, targetType: string): Promise<TagDefinition[]>;
  /** 標籤統計 */
  statistics(): Promise<TagStatistics>;
}

export type TagId = string;

export interface TagDefinition {
  readonly id: TagId;
  readonly name: string;
  readonly namespace: string;
  readonly description?: string;
  readonly aliases: string[];
  readonly metadata: Record<string, unknown>;
  readonly createdAt: number;
}

export interface TagFilter {
  namespace?: string;
  namePattern?: string;
  aliases?: boolean;
  limit?: number;
}

export interface TagGraph {
  readonly nodes: Array<{ id: TagId; name: string; namespace: string }>;
  readonly edges: Array<{ from: TagId; to: TagId; relation: string; weight: number }>;
}

export interface TagStatistics {
  readonly totalTags: number;
  readonly namespaces: Record<string, number>;
  readonly topTags: Array<{ tagId: TagId; name: string; count: number }>;
}

/**
 * OmniEvidence — 萬能證據
 * Immutable evidence chain for compliance, audit trails, and ZKP sealing.
 */
export interface IOmniEvidence extends IComponentCore {
  /** 提交證據 */
  submit(evidence: EvidenceRecord): Promise<EvidenceId>;
  /** 驗證證據 */
  verify(id: EvidenceId): Promise<EvidenceVerification>;
  /** 鎖定證據 (ZKP Seal) */
  seal(id: EvidenceId): Promise<SealResult>;
  /** 查詢證據鏈 */
  chain(id: EvidenceId): Promise<EvidenceChain>;
  /** 批量驗證 */
  batchVerify(ids: EvidenceId[]): Promise<EvidenceBatchResult>;
  /** 證據完整性報告 */
  integrityReport(): Promise<IntegrityReport>;
}

export type EvidenceId = string;

export interface EvidenceRecord {
  readonly id?: EvidenceId;
  readonly type: EvidenceType;
  readonly content: string;
  readonly hash: string;
  readonly source: string;
  readonly timestamp: number;
  readonly metadata: Record<string, unknown>;
  readonly parentEvidenceId?: EvidenceId;
}

export type EvidenceType = 'document' | 'log' | 'hash' | 'signature' | 'zkp' | 'attestation';

export interface EvidenceVerification {
  readonly id: EvidenceId;
  readonly valid: boolean;
  readonly verifiedAt: number;
  readonly hashMatch: boolean;
  readonly chainIntact: boolean;
  readonly error?: string;
}

export interface SealResult {
  readonly evidenceId: EvidenceId;
  readonly zkpProof: string;
  readonly sealedAt: number;
  readonly merkleRoot: string;
}

export interface EvidenceChain {
  readonly rootId: EvidenceId;
  readonly entries: EvidenceRecord[];
  readonly totalHash: string;
  readonly verified: boolean;
}

export interface EvidenceBatchResult {
  readonly total: number;
  readonly valid: number;
  readonly invalid: number;
  readonly details: EvidenceVerification[];
}

export interface IntegrityReport {
  readonly timestamp: number;
  readonly totalEvidence: number;
  readonly sealedEvidence: number;
  readonly chainIntegrity: number; // percentage
  readonly anomalies: string[];
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: Execution Dimension — 執行維度
// ═══════════════════════════════════════════════════════════════

/**
 * OmniAgent — 萬能代理 (enhanced)
 * Autonomous agent with clone, backpressure, and flow monitoring.
 */
export interface IOmniAgentV2 extends IComponentCore {
  readonly signature: IComponentCore;
  readonly config: AgentConfig;
  readonly metrics: AgentMetrics;

  /** 執行任務 */
  execute(task: AgentTask): Promise<AgentResult>;
  /** 註冊鉤子 */
  registerHook(stage: LifecycleStage, hook: AgentHook): void;
  /** 戒嚴模式 */
  onMartialLaw(reason: string): void;
  /** 克隆代理 */
  clone(newUuid: string): IOmniAgentV2;
  /** 背壓監控 */
  monitorBackpressure(): Promise<BackpressureMetrics>;
  /** 獲取近期流量 */
  getRecentFlow(windowMs?: number): Promise<FlowMetrics>;
  /** 更新配置 */
  updateConfig(delta: Partial<AgentConfig>): Promise<void>;
}

export interface AgentConfig {
  readonly name: string;
  readonly maxConcurrency: number;
  readonly timeout: number;
  readonly retryPolicy: RetryPolicy;
  readonly hooks: Map<LifecycleStage, AgentHook[]>;
}

export interface RetryPolicy {
  readonly maxRetries: number;
  readonly backoffMs: number;
  readonly maxBackoffMs: number;
}

export interface AgentMetrics {
  tasksExecuted: number;
  tasksSucceeded: number;
  tasksFailed: number;
  avgExecutionTime: number;
  lastExecutedAt?: number;
  uptime: number;
}

export interface AgentTask {
  readonly id: string;
  readonly name: string;
  readonly payload: unknown;
  readonly priority: number;
  readonly timeout?: number;
}

export interface AgentResult {
  readonly taskId: string;
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
  readonly executionTimeMs: number;
}

export interface AgentHook {
  (ctx: { task?: AgentTask; result?: AgentResult; error?: Error }): Promise<void> | void;
}

export interface BackpressureMetrics {
  readonly queueDepth: number;
  readonly processingRate: number;
  readonly memoryUsage: number;
  readonly pressureLevel: 'normal' | 'elevated' | 'critical';
}

export interface FlowMetrics {
  readonly windowMs: number;
  readonly totalTasks: number;
  readonly throughput: number;
  readonly latencyP50: number;
  readonly latencyP99: number;
}

/**
 * OmniAPI — 萬能 API
 * Type-safe API layer with rate limiting, circuit breaking, and observability.
 */
export interface IOmniAPI extends IComponentCore {
  /** 註冊 API 端點 */
  registerEndpoint(endpoint: APIEndpoint): Promise<void>;
  /** 調用 API */
  call<T>(request: APIRequest): Promise<APIResponse<T>>;
  /** 批量調用 */
  batchCall(requests: APIRequest[]): Promise<APIResponse[]>;
  /** API 健康度 */
  health(): Promise<APIHealth>;
  /** API 指標 */
  metrics(): Promise<APIMetrics>;
  /** 熔斷器 */
  circuitBreaker(endpointId: string): Promise<CircuitState>;
}

export interface APIEndpoint {
  readonly id: string;
  readonly path: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  readonly rateLimit: RateLimitConfig;
  readonly timeout: number;
  readonly schema?: Record<string, unknown>;
}

export interface RateLimitConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly burstSize?: number;
}

export interface APIRequest {
  readonly endpointId: string;
  readonly params?: Record<string, unknown>;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
}

export interface APIResponse<T = unknown> {
  readonly status: number;
  readonly data: T;
  readonly headers: Record<string, string>;
  readonly durationMs: number;
}

export interface APIHealth {
  readonly status: 'healthy' | 'degraded' | 'down';
  readonly endpoints: Record<string, EndpointHealth>;
}

export interface EndpointHealth {
  readonly endpointId: string;
  readonly status: 'healthy' | 'degraded' | 'down';
  readonly errorRate: number;
  readonly avgLatency: number;
}

export interface APIMetrics {
  readonly totalCalls: number;
  readonly successRate: number;
  readonly avgLatency: number;
  readonly p99Latency: number;
  readonly rateLimitHits: number;
  readonly circuitBreakerTrips: number;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * OmniBus — 萬能總線 (enhanced)
 * Event-driven backbone with replay, shadow testing, and backpressure.
 */
export interface IOmniBusV2 extends IComponentCore {
  /** 發佈事件 */
  publish(event: IBusEvent): Promise<void>;
  /** 訂閱主題 */
  subscribe(topic: string, handler: BusHandler): SubscriptionId;
  /** 取消訂閱 */
  unsubscribe(id: SubscriptionId): void;
  /** 歷史重放 */
  replay(startTime: number, endTime: number, filter?: BusFilter): Promise<IBusEvent[]>;
  /** 影子測試入口 */
  shadowIngress(event: IBusEvent): Promise<void>;
  /** 背壓監控 */
  monitorBackpressure(topic: string, threshold: number): Promise<void>;
  /** 克隆代理 */
  cloneAgent(topic: string, threshold: number): Promise<void>;
  /** 事件統計 */
  statistics(): Promise<BusStatistics>;
}

export type SubscriptionId = string;

export interface BusHandler {
  (event: IBusEvent): Promise<void>;
}

export interface BusFilter {
  topic?: string;
  source?: string;
  stage?: LifecycleStage;
}

export interface BusStatistics {
  readonly totalPublished: number;
  readonly totalDelivered: number;
  readonly totalFailed: number;
  readonly topicStats: Record<string, TopicStats>;
}

export interface TopicStats {
  readonly topic: string;
  readonly published: number;
  readonly delivered: number;
  readonly avgLatency: number;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: Governance Dimension — 治理維度
// ═══════════════════════════════════════════════════════════════

/**
 * OmniGateway — 萬能網關
 * Security gateway with ingress/egress, hash lock, and martial law control.
 */
export interface IOmniGatewayV2 extends IComponentCore {
  /** 入口驗證 */
  ingress(event: IBusEvent): Promise<IBusEvent>;
  /** 安全轉發 */
  secureForward(event: IBusEvent): Promise<IBusEvent>;
  /** Hash Lock 鎖定 */
  hashLock(event: IBusEvent): Promise<LockedEvent>;
  /** 戒嚴控制 */
  onMartialLaw(reason: string): void;
  liftMartialLaw(): void;
  isUnderMartialLaw(): boolean;
  /** 安全策略 */
  securityPolicy(): SecurityPolicy;
}

export interface LockedEvent {
  readonly event: IBusEvent;
  readonly lockHash: string;
  readonly lockedAt: number;
  readonly frozen: boolean;
}

export interface SecurityPolicy {
  readonly maxEventSize: number;
  readonly allowedTopics: string[];
  readonly blockedSources: string[];
  readonly martialLawThreshold: number;
}

/**
 * OmniHealing — 萬能癒合
 * Self-healing, chaos injection, and adaptive recovery.
 * 
 * 果因修復 (Effect-Cause Healing):
 *   從果追溯因，從症狀追溯根源，再修復。
 *   因果逆轉的智慧：不是先找原因再看結果，
 *   而是先看到結果（症狀），再逆向追溯找到原因（根源），然後修復。
 */
export interface IOmniHealing extends IComponentCore {
  /** 注入混沌 */
  injectChaos(event: IBusEvent): ChaosInjectionResult;
  /** 自動修復 */
  selfHeal(issueId: string, context?: Record<string, unknown>): Promise<HealingResult>;
  /** 果因修復 — 從症狀追溯根源再修復 */
  effectCauseHeal(effect: string, context?: Record<string, unknown>): Promise<EffectCauseHealingResult>;
  /** 系統健康度 */
  systemHealth(): Promise<SystemHealth>;
  /** 適應性恢復 */
  adaptiveRecover(error: Error, strategy?: RecoveryStrategy): Promise<RecoveryResult>;
  /** 戒嚴觸發 */
  triggerMartialLaw(reason: string, source: string): void;
  /** 監控與修復循環 */
  watchAndHeal(intervalMs: number): void;
}

export interface ChaosInjectionResult {
  readonly chaosId: string;
  readonly originalEvent: IBusEvent;
  readonly modifiedEvent: IBusEvent;
  readonly chaosType: ChaosType;
  readonly injectedAt: number;
}

export type ChaosType = 'mutation' | 'delay' | 'drop' | 'duplicate' | 'corrupt';

export interface HealingResult {
  readonly issueId: string;
  readonly healed: boolean;
  readonly strategy: string;
  readonly healingTimeMs: number;
  readonly details: string;
}

export interface SystemHealth {
  readonly overall: HealthLevel;
  readonly components: Record<string, ComponentHealthV2>;
  readonly lastCheck: number;
  readonly issues: SystemIssue[];
}

export type HealthLevel = 'healthy' | 'degraded' | 'critical' | 'emergency';

export interface ComponentHealthV2 {
  readonly name: string;
  readonly status: HealthLevel;
  readonly uptime: number;
  readonly errorRate: number;
  readonly lastError?: string;
}

export interface SystemIssue {
  readonly id: string;
  readonly component: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message: string;
  readonly detectedAt: number;
  readonly resolved: boolean;
}

export type RecoveryStrategy = 'retry' | 'fallback' | 'restart' | 'rollback' | 'isolate';

export interface RecoveryResult {
  readonly success: boolean;
  readonly strategy: RecoveryStrategy;
  readonly recoveryTimeMs: number;
  readonly message: string;
}

/**
 * 果因追溯節點
 * 從症狀逆向追溯到根源的每一步
 */
export interface EffectCauseNode {
  readonly id: string;
  readonly description: string;
  readonly type: 'effect' | 'intermediate' | 'cause';
  readonly confidence: number;
  readonly evidence: string[];
  readonly parentCauseId?: string;
}

/**
 * 果因修復結果
 */
export interface EffectCauseHealingResult {
  readonly traceId: string;
  readonly effect: string;
  readonly rootCause: string;
  readonly chain: EffectCauseNode[];
  readonly strategy: RecoveryStrategy;
  readonly healed: boolean;
  readonly traceTimeMs: number;
  readonly healingTimeMs: number;
  readonly totalMs: number;
}

/**
 * OmniEvolution — 萬能進化
 * Adaptive evolution, meta-learning, and system optimization.
 */
export interface IOmniEvolution extends IComponentCore {
  /** 記錄演化事件 */
  recordEvolution(event: EvolutionEvent): Promise<void>;
  /** 獲取演化歷史 */
  history(filter?: EvolutionFilter): Promise<EvolutionEvent[]>;
  /** 適應度評估 */
  fitnessScore(componentId: string): Promise<FitnessScore>;
  /** 自動優化 */
  autoOptimize(componentId: string): Promise<OptimizationResult>;
  /** 元學習 */
  metaLearn(pattern: LearningPattern): Promise<void>;
  /** 演化報告 */
  report(): Promise<EvolutionReport>;
}

export interface EvolutionEvent {
  readonly id: string;
  readonly componentId: string;
  readonly type: EvolutionType;
  readonly before: Record<string, unknown>;
  readonly after: Record<string, unknown>;
  readonly improvement: number;
  readonly timestamp: number;
  readonly reason: string;
}

export type EvolutionType = 'mutation' | 'crossover' | 'selection' | 'optimization' | 'pruning';

export interface EvolutionFilter {
  componentId?: string;
  type?: EvolutionType;
  startTime?: number;
  endTime?: number;
}

export interface FitnessScore {
  readonly componentId: string;
  readonly score: number; // 0.0 - 1.0
  readonly dimensions: FitnessDimensions;
  readonly evaluatedAt: number;
}

export interface FitnessDimensions {
  readonly performance: number;
  readonly reliability: number;
  readonly efficiency: number;
  readonly adaptability: number;
}

export interface OptimizationResult {
  readonly componentId: string;
  readonly optimizations: string[];
  readonly improvement: number;
  readonly appliedAt: number;
}

export interface LearningPattern {
  readonly name: string;
  readonly triggers: string[];
  readonly actions: string[];
  readonly confidence: number;
}

export interface EvolutionReport {
  readonly timestamp: number;
  readonly totalEvolutions: number;
  readonly averageImprovement: number;
  readonly topOptimizations: string[];
  readonly recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5: 9 Magic-Effect Combinations — 九大奇效組合
// ═══════════════════════════════════════════════════════════════

/**
 * Magic-Effect #1: 混沌自癒 (Chaos Self-Healing)
 * Combines: OAG + OAB
 * Chaos monkey injection → Automatic healing → Adaptive recovery
 */
export interface IChaosHealing extends IComponentCore {
  /** 觸發混沌注入 */
  triggerChaos(event: IBusEvent): Promise<ChaosHealingResult>;
  /** 系統自癒能力評估 */
  resilienceScore(): Promise<number>;
}

export interface ChaosHealingResult {
  readonly chaosId: string;
  readonly healingId: string;
  readonly survived: boolean;
  readonly recoveryTimeMs: number;
  readonly chaosType: ChaosType;
  readonly healingStrategy: RecoveryStrategy;
}

/**
 * Magic-Effect #2: 時空裂縫 (Temporal Rift)
 * Combines: OAB + Time
 * Historical event replay + Shadow testing
 */
export interface ITemporalRift extends IComponentCore {
  /** 開啟時間裂縫 */
  openRift(config: TimeTravelConfig): Promise<TemporalRiftSession>;
  /** 影子測試 */
  shadowCompare(original: IBusEvent, shadow: IBusEvent): Promise<RiftComparison>;
}

export interface TemporalRiftSession {
  readonly sessionId: string;
  status: 'open' | 'closed' | 'observing';
  eventsObserved: number;
  close(): Promise<TimelineSnapshot>;
}

export interface RiftComparison {
  readonly diverged: boolean;
  readonly divergencePoints: number[];
  readonly metrics: Record<string, { original: number; shadow: number }>;
}

/**
 * Magic-Effect #3: 細胞分裂 (Cellular Fission)
 * Combines: OA + OAB
 * Dynamic agent cloning under backpressure
 */
export interface ICellularFission extends IComponentCore {
  /** 監控背壓 */
  watchBackpressure(topic: string, threshold: number): Promise<void>;
  /** 觸發分裂 */
  triggerFission(agentId: string, reason: string): Promise<FissionResult>;
}

export interface FissionResult {
  readonly parentAgentId: string;
  readonly childAgentId: string;
  readonly fissionType: 'hot-swap' | 'cold-start' | 'warm-clone';
  readonly timestamp: number;
}

/**
 * Magic-Effect #4: 先知矩陣 (Prophet Matrix)
 * Combines: OAG + Time
 * Predictive prefetching based on user intent
 */
export interface IProphetMatrix extends IComponentCore {
  /** 預測意圖 */
  predictIntent(intent: string): Promise<PredictedIntent>;
  /** 預取事件 */
  preFetch(intent: PredictedIntent): Promise<IBusEvent[]>;
  /** 預測準確度 */
  accuracy(): Promise<number>;
}

export interface PredictedIntent {
  readonly intent: string;
  readonly confidence: number;
  readonly predictedTopics: string[];
  readonly predictedTimes: number[];
}

/**
 * Magic-Effect #5: 全知蜂巢 (Omniscient Hive)
 * Combines: OA matrix + OAB
 * Shared blackboard + Swarm intelligence
 */
export interface IOmniscientHive extends IComponentCore {
  /** 共享黑板 */
  contribute(key: string, value: unknown, providerUuid: string): void;
  getSharedKnowledge(key: string): unknown;
  /** 羣體決策 */
  swarmDecision(options: string[]): Promise<string>;
  /** 知識圖譜 */
  knowledgeGraph(): Promise<KnowledgeGraph>;
}

export interface KnowledgeGraph {
  readonly nodes: Array<{ id: string; type: string; value: unknown }>;
  readonly edges: Array<{ from: string; to: string; relation: string }>;
}

/**
 * Magic-Effect #6: 武裝戒嚴 (Martial Law)
 * Combines: OAG + Bus
 * Dynamic rate limiting + Emergency lockdown
 */
export interface IMartialLaw extends IComponentCore {
  /** 啟動戒嚴 */
  activate(reason: string): Promise<void>;
  /** 解除戒嚴 */
  deactivate(): Promise<void>;
  /** 戒嚴狀態 */
  status(): MartialLawStatus;
  /** 動態限流 */
  dynamicRateLimit(topic: string, currentLoad: number): Promise<RateLimitAction>;
}

export interface MartialLawStatus {
  readonly active: boolean;
  readonly reason?: string;
  readonly activatedAt?: number;
  readonly affectedTopics: string[];
}

export type RateLimitAction = 'allow' | 'throttle' | 'reject' | 'queue';

/**
 * Magic-Effect #7: 全面記憶 (Universal Memory)
 * Combines: Memory + Tag + Evidence
 * Personalized RAG growth database
 */
export interface IUniversalMemory extends IComponentCore {
  /** 個人化存儲 */
  personalizedStore(entry: MemoryEntry, userId: string): Promise<MemoryId>;
  /** 個人化檢索 */
  personalizedSearch(query: string, userId: string, limit?: number): Promise<MemoryEntry[]>;
  /** 標籤增強搜索 */
  tagEnhancedSearch(query: string, tags?: string[]): Promise<MemoryEntry[]>;
  /** 證據鏈記憶 */
  evidentialRecall(evidenceId: EvidenceId): Promise<MemoryEntry[]>;
}

/**
 * Magic-Effect #8: 太極共振 (Tai Chi Resonance)
 * Combines: Soul + Singularity + Key
 * Soul-guided decision making with singularity consciousness
 */
export interface ITaiChiResonance extends IComponentCore {
  /** 共鳴決策 */
  resonateDecision(context: {
    intent: string;
    options: Array<{ id: string; description: string }>;
  }): Promise<ResonanceDecision>;
  /** 靈魂對齊檢查 */
  soulAlignmentCheck(action: { type: string; params: Record<string, unknown> }): Promise<AlignmentResult>;
}

export interface ResonanceDecision {
  readonly chosenOptionId: string;
  readonly resonanceScore: number;
  readonly soulAlignment: AlignmentResult;
  readonly reasoning: string;
}

export interface AlignmentResult {
  readonly aligned: boolean;
  readonly score: number;
  readonly dimensions: Record<string, number>;
  readonly recommendations: string[];
}

/**
 * Magic-Effect #9: 萬法歸宗 (Omni Convergence)
 * Combines: ALL components
 * Complete system integration and unified consciousness
 */
export interface IOmniConvergence extends IComponentCore {
  /** 全系統快照 */
  fullSnapshot(): Promise<SystemSnapshot>;
  /** 全系統健康度 */
  fullHealth(): Promise<FullSystemHealth>;
  /** 全系統演化 */
  fullEvolution(): Promise<EvolutionReport>;
  /** 全系統協同 */
  synergize(): Promise<SynergyResult>;
}

export interface SystemSnapshot {
  readonly timestamp: number;
  readonly foundation: { base: boolean; memory: boolean; time: boolean; component: boolean };
  readonly boundaries: { tag: boolean; evidence: boolean };
  readonly execution: { agent: boolean; api: boolean; bus: boolean };
  readonly governance: { gateway: boolean; healing: boolean; evolution: boolean };
  readonly checksum: string;
}

export interface FullSystemHealth {
  readonly overall: HealthLevel;
  readonly dimensions: Record<string, HealthLevel>;
  readonly criticalPaths: string[];
  readonly recommendations: string[];
}

export interface SynergyResult {
  readonly synergyScore: number;
  readonly bottlenecks: string[];
  readonly optimizations: string[];
  readonly timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6: Dimension Enums & Constants
// ═══════════════════════════════════════════════════════════════

export enum OmniDimension {
  Foundation = 'foundation',
  Boundaries = 'boundaries',
  Execution = 'execution',
  Governance = 'governance',
}

export const TWELVE_OMNI_NAMES: Record<string, { zh: string; en: string; dimension: OmniDimension }> = {
  OmniBase:      { zh: '萬能基礎', en: 'Foundation', dimension: OmniDimension.Foundation },
  OmniMemory:    { zh: '萬能永憶', en: 'Memory', dimension: OmniDimension.Foundation },
  OmniTime:      { zh: '萬能時間', en: 'Time', dimension: OmniDimension.Foundation },
  OmniComponent: { zh: '萬能元件', en: 'Component', dimension: OmniDimension.Foundation },
  OmniTag:       { zh: '萬能標籤', en: 'Tag', dimension: OmniDimension.Boundaries },
  OmniEvidence:  { zh: '萬能證據', en: 'Evidence', dimension: OmniDimension.Boundaries },
  OmniAgent:     { zh: '萬能代理', en: 'Agent', dimension: OmniDimension.Execution },
  OmniAPI:       { zh: '萬能API', en: 'API', dimension: OmniDimension.Execution },
  OmniBus:       { zh: '萬能總線', en: 'Bus', dimension: OmniDimension.Execution },
  OmniGateway:   { zh: '萬能網關', en: 'Gateway', dimension: OmniDimension.Governance },
  OmniHealing:   { zh: '萬能癒合', en: 'Healing', dimension: OmniDimension.Governance },
  OmniEvolution: { zh: '萬能進化', en: 'Evolution', dimension: OmniDimension.Governance },
};
