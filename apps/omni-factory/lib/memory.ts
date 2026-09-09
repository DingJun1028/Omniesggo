/**
 * OmniFactory Memory Module
 * Provides client-side interface to TDAI Gateway memory endpoints
 * 
 * Supports:
 * - /memory/retrieve: Retrieve memories by semantic query
 * - /memory/search: Full-text search across memories
 * - /recall: Recall a specific memory by ID
 */

export interface MemoryMetadata {
  createdAt?: number;
  updatedAt?: number;
  category?: string;
  tags?: string[];
  source?: string;
  confidence?: number;
}

export interface MemoryRecord {
  id: string;
  content: string;
  timestamp: number;
  metadata?: MemoryMetadata;
  embedding?: number[];
}

export interface MemoryRetrievalResult {
  success: boolean;
  records: MemoryRecord[];
  totalCount?: number;
  queryTime?: number;
}

export interface MemorySearchOptions {
  limit?: number;
  offset?: number;
  category?: string;
  tags?: string[];
  minScore?: number;
}

/**
 * MemoryClient - Interface to TDAI Gateway
 * 
 * Usage:
 * ```
 * import { memoryClient } from '@/lib/memory';
 * 
 * const results = await memoryClient.retrieve('user preferences');
 * const searched = await memoryClient.search('budget', { limit: 10 });
 * const recalled = await memoryClient.recall('memory-id-123');
 * ```
 */
export class MemoryClient {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_TDAI_GATEWAY_URL || 'http://localhost:8420',
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = timeout;
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'OmniFactory/1.0',
    };
  }

  /**
   * Retrieve memories by semantic query
   */
  async retrieve(query: string): Promise<MemoryRetrievalResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/memory/retrieve`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        records: Array.isArray(data) ? data : data.records || [],
        totalCount: data.totalCount,
        queryTime: data.queryTime,
      };
    } catch (error) {
      console.error('[MemoryClient.retrieve]', error);
      return {
        success: false,
        records: [],
      };
    }
  }

  /**
   * Search memories by keyword
   */
  async search(
    keyword: string,
    options?: MemorySearchOptions
  ): Promise<MemoryRetrievalResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const searchPayload = {
        keyword,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
        ...options,
      };

      const response = await fetch(`${this.baseUrl}/memory/search`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(searchPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        records: Array.isArray(data) ? data : data.records || [],
        totalCount: data.totalCount,
        queryTime: data.queryTime,
      };
    } catch (error) {
      console.error('[MemoryClient.search]', error);
      return {
        success: false,
        records: [],
      };
    }
  }

  /**
   * Recall a specific memory by ID
   */
  async recall(memoryId: string): Promise<MemoryRecord | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/recall`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ id: memoryId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[MemoryClient.recall]', error);
      return null;
    }
  }

  /**
   * Health check - verify TDAI Gateway is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance for convenient usage
export const memoryClient = new MemoryClient();

export default memoryClient;
