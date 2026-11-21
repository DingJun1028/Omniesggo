/**
 * OmniAgentBus — 進階整合模式 (§12 六模式 + 增量輸出優化基礎設施)
 *
 * 對齊 soul.md §12:
 *   - §12.0 增量輸出優化架構 (Chunked / Stream / Parallel / Delta / Compression / CDN / Lazy / Pagination)
 *   - §12.1 6 種 5T 合規整合模式 (EventBus / ServiceOrchestrator / ETLPipeline / APIGateway / CacheManager / ErrorHandler)
 *
 * 設計哲學 (無作妙德圓通無礙):
 *   - 無作: 未初始化 / 空 / 未命中 皆靜默 graceful, 不報錯
 *   - 圓通: 所有模式共用 5T Gate (fiveT.ts) + 增量基礎設施, 互通無礙
 *   - 無礙: 所有輸出過 5T / hash_lock 才向後游流動
 */

// 基礎設施 (§12.0)
export { StreamBuffer } from './stream-buffer.js';
export { WorkerPool } from './worker-pool.js';
export { DeltaTracker } from './delta-tracker.js';
export type { DeltaEntry } from './delta-tracker.js';
export { CompressionEngine } from './compression.js';
export { LRUCache } from './lru-cache.js';
export type { CachedItem } from './lru-cache.js';
export { paginate, toPageResult } from './pagination.js';
export { RateLimiter } from './rate-limiter.js';
export { PriorityQueue } from './priority-queue.js';
export { verifyGate, verify5T, bus5TGateLocal, hashLock } from './five-t.js';

// 六模式 (§12.1)
export { EventBus, createEventBus } from './event-bus.js';
export type { DomainEvent, EventRecord } from './event-bus.js';
export { Conduit, createConduit } from './conduit.js';
export type { ConduitEnvelope, ConduitMessage, ConduitOptions } from './conduit.js';
export { ServiceOrchestrator } from './service-orchestrator.js';
export type { WorkflowDefinition, ExecutionRecord } from './service-orchestrator.js';
export { ETLPipeline } from './etl-pipeline.js';
export type { DataSource, ProcessedData } from './etl-pipeline.js';
export { APIGateway, UnauthorizedError, NotFoundError } from './api-gateway.js';
export type { APIRequest, APIResponse } from './gateway-types.js';
export { CacheManager } from './cache-manager.js';
export { ErrorHandler } from './error-handler.js';
export type { ExecutionContext, ErrorRecord } from './error-handler.js';

// 共用型別
export type {
  IFrozenCore,
  PaginationConfig,
  PaginatedResult,
  PageResult,
  FiveTDimension,
  FiveTResult,
  StreamEntry,
  RetryTask,
  CompressionSink,
} from './types.js';

// 生命週期埋點 (§24 P2: entropy + cross_unit_pairing)
export { LifecycleTracker, createLifecycleTracker } from './lifecycle.js';
export type { LifecycleEvent, LifecycleSnapshot } from './lifecycle.js';
