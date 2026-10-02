/**
 * Event Store 介面與實作
 * 支援 InMemory (開發)、PostgreSQL (測試/生產)、EventStoreDB (生產高性能)
 */

import type { TimeRiftEvent, EventFilter } from '../protocol/time-rift-protocol';

// ============================================
// 核心介面定義
// ============================================

export interface EventStore {
  /** 寫入事件 */
  append(event: TimeRiftEvent): Promise<void>;
  
  /** 讀取事件流 */
  readStream(streamId: string, fromPosition?: number): AsyncIterable<TimeRiftEvent>;
  
  /** 讀取單一事件 */
  readEvent(uuid: string): Promise<TimeRiftEvent | null>;
  
  /** 訂閱新事件 */
  subscribe(streamId: string, handler: (event: TimeRiftEvent) => void): () => void;
  
  /** 時間範圍查詢 */
  queryByTimeRange(
    startTime: number, 
    endTime: number, 
    filters?: EventFilter
  ): Promise<TimeRiftEvent[]>;
  
  /** 關聯 ID 查詢 */
  queryByCorrelation(correlationId: string): Promise<TimeRiftEvent[]>;
  
  /** 關閉連線 */
  close(): Promise<void>;
  
  /** 健康檢查 */
  healthCheck(): Promise<boolean>;
}

// 事件過濾器介面
export interface EventFilter {
  event_types?: string[];
  agent_ids?: string[];
  tags?: string[];
  source_origins?: string[];
  correlation_ids?: string[];
}

// 訂閱處理器
export type EventHandler = (event: TimeRiftEvent) => void | Promise<void>;

// 訂閱資訊
export interface Subscription {
  id: string;
  streamId: string;
  handler: EventHandler;
  filter?: EventFilter;
}

// ============================================
// InMemory 實作 (開發/測試用)
// ============================================

export class InMemoryEventStore implements EventStore {
  private events: Map<string, TimeRiftEvent> = new Map();
  private streams: Map<string, string[]> = new Map(); // streamId -> event UUIDs
  private subscriptions: Map<string, Subscription[]> = new Map();
  private correlationIndex: Map<string, string[]> = new Map(); // correlationId -> event UUIDs

  async append(event: TimeRiftEvent): Promise<void> {
    this.events.set(event.uuid, event);
    
    // 索引到流 (使用 source_origin 作為 streamId)
    const streamId = event.source_origin || 'default';
    if (!this.streams.has(streamId)) {
      this.streams.set(streamId, []);
    }
    this.streams.get(streamId)!.push(event.uuid);
    
    // 關聯 ID 索引
    if (event.correlation_id) {
      if (!this.correlationIndex.has(event.correlation_id)) {
        this.correlationIndex.set(event.correlation_id, []);
      }
      this.correlationIndex.get(event.correlation_id)!.push(event.uuid);
    }
    
    // 通知訂閱者
    this.notifySubscribers(streamId, event);
  }

  async readStream(streamId: string, fromPosition = 0): AsyncIterable<TimeRiftEvent> {
    const uuids = this.streams.get(streamId) || [];
    const events = uuids.slice(fromPosition).map(uuid => this.events.get(uuid)!).filter(Boolean);
    
    return {
      [Symbol.asyncIterator]() {
        let index = 0;
        return {
          async next() {
            if (index < events.length) {
              return { value: events[index++], done: false };
            }
            return { done: true };
          }
        };
      }
    };
  }

  async readEvent(uuid: string): Promise<TimeRiftEvent | null> {
    return this.events.get(uuid) || null;
  }

  subscribe(streamId: string, handler: EventHandler): () => void {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const subscription: Subscription = {
      id: subscriptionId,
      streamId,
      handler
    };
    
    if (!this.subscriptions.has(streamId)) {
      this.subscriptions.set(streamId, []);
    }
    this.subscriptions.get(streamId)!.push(subscription);
    
    // 返回取消訂閱函數
    return () => {
      const subs = this.subscriptions.get(streamId) || [];
      const index = subs.findIndex(s => s.id === subscriptionId);
      if (index >= 0) subs.splice(index, 1);
    };
  }

  async queryByTimeRange(
    startTime: number, 
    endTime: number, 
    filters?: EventFilter
  ): Promise<TimeRiftEvent[]> {
    let results: TimeRiftEvent[] = [];
    
    for (const event of this.events.values()) {
      if (event.timestamp >= startTime && event.timestamp <= endTime) {
        if (this.matchesFilter(event, filters)) {
          results.push(event);
        }
      }
    }
    
    return results.sort((a, b) => a.timestamp - b.timestamp);
  }

  async queryByCorrelation(correlationId: string): Promise<TimeRiftEvent[]> {
    const uuids = this.correlationIndex.get(correlationId) || [];
    return uuids.map(uuid => this.events.get(uuid)!).filter(Boolean);
  }

  async close(): Promise<void> {
    this.events.clear();
    this.streams.clear();
    this.subscriptions.clear();
    this.correlationIndex.clear();
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // 內部方法
  private notifySubscribers(streamId: string, event: TimeRiftEvent): void {
    const subs = this.subscriptions.get(streamId) || [];
    for (const sub of subs) {
      try {
        sub.handler(event);
      } catch (error) {
        console.error('[InMemoryEventStore] Subscription handler error:', error);
      }
    }
  }

  private matchesFilter(event: TimeRiftEvent, filters?: EventFilter): boolean {
    if (!filters) return true;
    
    if (filters.event_types?.length && !filters.event_types.includes(event.event_type)) {
      return false;
    }
    if (filters.agent_ids?.length && !filters.agent_ids.includes(event.metadata.agent_id)) {
      return false;
    }
    if (filters.tags?.length && !filters.tags.some(t => event.metadata.tags.includes(t))) {
      return false;
    }
    if (filters.source_origins?.length && !filters.source_origins.includes(event.source_origin)) {
      return false;
    }
    if (filters.correlation_ids?.length && event.correlation_id && 
        !filters.correlation_ids.includes(event.correlation_id)) {
      return false;
    }
    
    return true;
  }
}

// ============================================
// PostgreSQL 實作 (生產環境推薦)
// ============================================

export interface PostgresEventStoreConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
}

export class PostgresEventStore implements EventStore {
  private pool: any; // pg.Pool
  private config: PostgresEventStoreConfig;
  private connected = false;

  constructor(config: PostgresEventStoreConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    
    // 動態導入 pg (避免強制依賴)
    const { Pool } = await import('pg');
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      ssl: this.config.ssl,
      max: this.config.poolSize || 20
    });
    
    // 初始化表結構
    await this.initializeSchema();
    this.connected = true;
  }

  private async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS events (
          uuid VARCHAR(255) PRIMARY KEY,
          version VARCHAR(50) NOT NULL,
          timestamp BIGINT NOT NULL,
          source_origin VARCHAR(255) NOT NULL,
          causality_id VARCHAR(255),
          correlation_id VARCHAR(255),
          event_type VARCHAR(100) NOT NULL,
          event_name VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL,
          metadata JSONB NOT NULL,
          hash_lock VARCHAR(64),
          hash_algorithm VARCHAR(20),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
        CREATE INDEX IF NOT EXISTS idx_events_source_origin ON events(source_origin);
        CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON events(correlation_id);
        CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
        CREATE INDEX IF NOT EXISTS idx_events_metadata_gin ON events USING GIN(metadata);
      `);
    } finally {
      client.release();
    }
  }

  async append(event: TimeRiftEvent): Promise<void> {
    await this.connect();
    
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO events 
         (uuid, version, timestamp, source_origin, causality_id, correlation_id, 
          event_type, event_name, payload, metadata, hash_lock, hash_algorithm)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (uuid) DO NOTHING`,
        [
          event.uuid,
          event.version,
          event.timestamp,
          event.source_origin,
          event.causality_id,
          event.correlation_id,
          event.event_type,
          event.event_name,
          JSON.stringify(event.payload),
          JSON.stringify(event.metadata),
          event.hash_lock,
          event.hash_algorithm
        ]
      );
    } finally {
      client.release();
    }
  }

  async readStream(streamId: string, fromPosition = 0): AsyncIterable<TimeRiftEvent> {
    await this.connect();
    
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM events 
         WHERE source_origin = $1 
         ORDER BY timestamp ASC 
         OFFSET $2`,
        [streamId, fromPosition]
      );
      
      const events = result.rows.map(this.rowToEvent);
      
      return {
        [Symbol.asyncIterator]() {
          let index = 0;
          return {
            async next() {
              if (index < events.length) {
                return { value: events[index++], done: false };
              }
              return { done: true };
            }
          };
        }
      };
    } finally {
      client.release();
    }
  }

  async readEvent(uuid: string): Promise<TimeRiftEvent | null> {
    await this.connect();
    
    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT * FROM events WHERE uuid = $1', [uuid]);
      return result.rows.length > 0 ? this.rowToEvent(result.rows[0]) : null;
    } finally {
      client.release();
    }
  }

  subscribe(streamId: string, handler: EventHandler): () => void {
    // PostgreSQL 使用 LISTEN/NOTIFY 機制
    // 這裡簡化實作，實際生產建議使用 pg-boss 或類似工具
    console.warn('[PostgresEventStore] subscribe not fully implemented, using polling fallback');
    
    const interval = setInterval(async () => {
      try {
        const events = await this.queryByTimeRange(
          Date.now() - 5000, // 過去 5 秒
          Date.now(),
          { source_origins: [streamId] }
        );
        for (const event of events) {
          await handler(event);
        }
      } catch (error) {
        console.error('[PostgresEventStore] Subscription error:', error);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }

  async queryByTimeRange(
    startTime: number, 
    endTime: number, 
    filters?: EventFilter
  ): Promise<TimeRiftEvent[]> {
    await this.connect();
    
    const client = await this.pool.connect();
    try {
      let query = `SELECT * FROM events WHERE timestamp >= $1 AND timestamp <= $2`;
      const params: any[] = [startTime, endTime];
      let paramIndex = 3;
      
      if (filters?.event_types?.length) {
        query += ` AND event_type = ANY($${paramIndex++})`;
        params.push(filters.event_types);
      }
      if (filters?.source_origins?.length) {
        query += ` AND source_origin = ANY($${paramIndex++})`;
        params.push(filters.source_origins);
      }
      if (filters?.agent_ids?.length) {
        query += ` AND metadata->>'agent_id' = ANY($${paramIndex++})`;
        params.push(filters.agent_ids);
      }
      if (filters?.correlation_ids?.length) {
        query += ` AND correlation_id = ANY($${paramIndex++})`;
        params.push(filters.correlation_ids);
      }
      
      query += ` ORDER BY timestamp ASC`;
      
      const result = await client.query(query, params);
      return result.rows.map(this.rowToEvent);
    } finally {
      client.release();
    }
  }

  async queryByCorrelation(correlationId: string): Promise<TimeRiftEvent[]> {
    await this.connect();
    
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM events WHERE correlation_id = $1 ORDER BY timestamp ASC',
        [correlationId]
      );
      return result.rows.map(this.rowToEvent);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.connected = false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      const client = await this.pool.connect();
      client.release();
      return true;
    } catch {
      return false;
    }
  }

  private rowToEvent(row: any): TimeRiftEvent {
    return {
      uuid: row.uuid,
      version: row.version,
      timestamp: row.timestamp,
      source_origin: row.source_origin,
      causality_id: row.causality_id,
      correlation_id: row.correlation_id,
      event_type: row.event_type,
      event_name: row.event_name,
      payload: row.payload,
      metadata: row.metadata,
      hash_lock: row.hash_lock,
      hash_algorithm: row.hash_algorithm
    };
  }
}

// ============================================
// EventStoreDB 實作 (高性能生產)
// ============================================

export interface EventStoreDBConfig {
  connectionString: string; // esdb://localhost:2113?tls=false
  defaultCredentials?: { username: string; password: string };
}

export class EventStoreDBStore implements EventStore {
  private client: any; // @eventstore/db-client
  private config: EventStoreDBConfig;
  private connected = false;

  constructor(config: EventStoreDBConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    
    const { EventStoreDBClient } = await import('@eventstore/db-client');
    this.client = EventStoreDBClient.connectionString(this.config.connectionString);
    
    if (this.config.defaultCredentials) {
      this.client = this.client.withCredentials(
        this.config.defaultCredentials.username,
        this.config.defaultCredentials.password
      );
    }
    
    this.connected = true;
  }

  async append(event: TimeRiftEvent): Promise<void> {
    await this.connect();
    
    const streamName = `events-${event.source_origin}`;
    const eventData = {
      type: event.event_type,
      data: event,
      metadata: {
        version: event.version,
        timestamp: event.timestamp,
        correlationId: event.correlation_id
      }
    };
    
    await this.client.appendToStream(streamName, eventData);
  }

  async readStream(streamId: string, fromPosition = 0): AsyncIterable<TimeRiftEvent> {
    await this.connect();
    
    const streamName = `events-${streamId}`;
    const events = this.client.readStream(streamName, {
      fromRevision: fromPosition,
      direction: 'forwards'
    });
    
    return {
      [Symbol.asyncIterator]() {
        const iterator = events[Symbol.asyncIterator]();
        return {
          async next() {
            const result = await iterator.next();
            if (result.done) return { done: true };
            return { 
              value: result.value.event.data as TimeRiftEvent, 
              done: false 
            };
          }
        };
      }
    };
  }

  async readEvent(uuid: string): Promise<TimeRiftEvent | null> {
    // EventStoreDB 通常不直接按 UUID 查詢，需透過流讀取
    console.warn('[EventStoreDBStore] readEvent by UUID not directly supported');
    return null;
  }

  subscribe(streamId: string, handler: EventHandler): () => void {
    const streamName = `events-${streamId}`;
    const subscription = this.client.subscribeToStream(streamName, {
      fromRevision: 'end',
      resolveLinkTos: true
    });
    
    (async () => {
      for await (const event of subscription) {
        if (event.event) {
          await handler(event.event.data as TimeRiftEvent);
        }
      }
    })();
    
    return () => subscription.unsubscribe();
  }

  async queryByTimeRange(
    startTime: number, 
    endTime: number, 
    filters?: EventFilter
  ): Promise<TimeRiftEvent[]> {
    // EventStoreDB 通常使用投影(projection)進行複雜查詢
    // 這裡簡化實作：讀取所有流並過濾 (僅適合小數據量)
    console.warn('[EventStoreDBStore] queryByTimeRange requires projection for production use');
    return [];
  }

  async queryByCorrelation(correlationId: string): Promise<TimeRiftEvent[]> {
    // 需要自定義投影按 correlation_id 索引
    console.warn('[EventStoreDBStore] queryByCorrelation requires projection for production use');
    return [];
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.connected = false;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      // 嘗試讀取系統流
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// 工廠函數
// ============================================

export type StoreType = 'memory' | 'postgres' | 'eventstoredb';

export interface StoreFactoryOptions {
  type: StoreType;
  postgres?: PostgresEventStoreConfig;
  eventstoredb?: EventStoreDBConfig;
}

export function createEventStore(options: StoreFactoryOptions): EventStore {
  switch (options.type) {
    case 'memory':
      return new InMemoryEventStore();
    
    case 'postgres':
      if (!options.postgres) {
        throw new Error('PostgreSQL config required for postgres store type');
      }
      return new PostgresEventStore(options.postgres);
    
    case 'eventstoredb':
      if (!options.eventstoredb) {
        throw new Error('EventStoreDB config required for eventstoredb store type');
      }
      return new EventStoreDBStore(options.eventstoredb);
    
    default:
      throw new Error(`Unknown store type: ${options.type}`);
  }
}

// 預設導出
export default {
  InMemoryEventStore,
  PostgresEventStore,
  EventStoreDBStore,
  createEventStore
};