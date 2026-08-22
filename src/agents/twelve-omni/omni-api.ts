 
/**
 * ==========================================
 * 🌌 OmniAPI — 萬能 API 實現
 * ==========================================
 * Type-safe API layer with rate limiting, circuit breaking, and observability.
 */

import { randomUUID } from 'crypto';
import {
  IOmniAPI,
  APIEndpoint,
  APIRequest,
  APIResponse,
  APIHealth,
  APIMetrics,
  EndpointHealth,
  CircuitState,
  RateLimitConfig,
} from '../../types/twelve-omni';

/**
 * OmniAPI 實現
 * 類型安全的 API 層
 */
export class OmniAPI implements IOmniAPI {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
    } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  /** API 端點 */
  private endpoints: Map<string, APIEndpoint> = new Map();

  /** 速率限制計數器 */
  private rateLimitCounters: Map<string, { count: number; windowStart: number }> = new Map();

  /** 熔斷器狀態 */
  private circuitStates: Map<string, CircuitState> = new Map();

  /** 調用歷史 */
  private callHistory: Array<{ endpointId: string; status: number; durationMs: number; timestamp: number }> = [];

  constructor() {
    this.uuid = randomUUID();
    this.timestamp = Date.now();
  }

  /**
   * 註冊 API 端點
   */
  async registerEndpoint(endpoint: APIEndpoint): Promise<void> {
    this.endpoints.set(endpoint.id, endpoint);
    this.circuitStates.set(endpoint.id, 'closed');
  }

  /**
   * 調用 API
   */
  async call<T>(request: APIRequest): Promise<APIResponse<T>> {
    const startTime = Date.now();
    const endpoint = this.endpoints.get(request.endpointId);

    if (!endpoint) {
      throw new Error(`Endpoint ${request.endpointId} not found`);
    }

    // 檢查熔斷器
    const circuitState = this.circuitStates.get(request.endpointId);
    if (circuitState === 'open') {
      throw new Error(`Circuit breaker open for endpoint ${request.endpointId}`);
    }

    // 檢查速率限制
    if (!this.checkRateLimit(request.endpointId, endpoint.rateLimit)) {
      throw new Error(`Rate limit exceeded for endpoint ${request.endpointId}`);
    }

    try {
      // 模擬 API 調用
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

      const response: APIResponse<T> = {
        status: 200,
        data: {} as T,
        headers: { 'content-type': 'application/json' },
        durationMs: Date.now() - startTime,
      };

      this.callHistory.push({
        endpointId: request.endpointId,
        status: 200,
        durationMs: response.durationMs,
        timestamp: Date.now(),
      });

      return response;
    } catch (error) {
      this.callHistory.push({
        endpointId: request.endpointId,
        status: 500,
        durationMs: Date.now() - startTime,
        timestamp: Date.now(),
      });

      // 更新熔斷器
      this.updateCircuitBreaker(request.endpointId, false);

      throw error;
    }
  }

  /**
   * 批量調用
   */
  async batchCall(requests: APIRequest[]): Promise<APIResponse[]> {
    return Promise.all(requests.map((req) => this.call(req)));
  }

  /**
   * API 健康度
   */
  async health(): Promise<APIHealth> {
    const endpoints: Record<string, EndpointHealth> = {};
    let allHealthy = true;

    for (const id of Array.from(this.endpoints.keys())) {
      const recentCalls = this.callHistory.filter(
        (c) => c.endpointId === id && c.timestamp > Date.now() - 60000
      );
      const errorRate = recentCalls.filter((c) => c.status >= 400).length / Math.max(recentCalls.length, 1);
      const avgLatency = recentCalls.reduce((sum, c) => sum + c.durationMs, 0) / Math.max(recentCalls.length, 1);

      endpoints[id] = {
        endpointId: id,
        status: errorRate < 0.1 ? 'healthy' : errorRate < 0.5 ? 'degraded' : 'down',
        errorRate,
        avgLatency,
      };

      if (endpoints[id].status !== 'healthy') {
        allHealthy = false;
      }
    }

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      endpoints,
    };
  }

  /**
   * API 指標
   */
  async metrics(): Promise<APIMetrics> {
    const totalCalls = this.callHistory.length;
    const successCalls = this.callHistory.filter((c) => c.status < 400).length;
    const latencies = this.callHistory.map((c) => c.durationMs).sort((a, b) => a - b);

    return {
      totalCalls,
      successRate: totalCalls > 0 ? successCalls / totalCalls : 1,
      avgLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      p99Latency: latencies[Math.floor(latencies.length * 0.99)] || 0,
      rateLimitHits: 0,
      circuitBreakerTrips: Array.from(this.circuitStates.values()).filter((s) => s === 'open').length,
    };
  }

  /**
   * 熔斷器狀態
   */
  async circuitBreaker(endpointId: string): Promise<CircuitState> {
    return this.circuitStates.get(endpointId) || 'closed';
  }

  /**
   * 檢查速率限制 (內部輔助)
   */
  private checkRateLimit(endpointId: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const counter = this.rateLimitCounters.get(endpointId);

    if (!counter || now - counter.windowStart > config.windowMs) {
      this.rateLimitCounters.set(endpointId, { count: 1, windowStart: now });
      return true;
    }

    if (counter.count >= config.maxRequests) {
      return false;
    }

    counter.count++;
    return true;
  }

  /**
   * 更新熔斷器 (內部輔助)
   */
  private updateCircuitBreaker(endpointId: string, success: boolean): void {
    if (success) {
      this.circuitStates.set(endpointId, 'closed');
    } else {
      this.circuitStates.set(endpointId, 'open');
      // 5 秒後嘗試半開
      setTimeout(() => {
        if (this.circuitStates.get(endpointId) === 'open') {
          this.circuitStates.set(endpointId, 'half-open');
        }
      }, 5000);
    }
  }
}

/**
 * OmniAPI 單例工廠
 */
let _instance: OmniAPI | null = null;

export function getOmniAPI(): OmniAPI {
  if (!_instance) {
    _instance = new OmniAPI();
  }
  return _instance;
}
