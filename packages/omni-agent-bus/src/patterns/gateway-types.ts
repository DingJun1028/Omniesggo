/**
 * Pattern 4 輔助型別 — API Gateway 請求/回應 (避免與 bus.ts 全域型別衝突)
 */
export interface GatewayAPIRequest {
  clientId: string;
  path: string;
  body?: string;
  headers?: Record<string, string>;
  handler?: () => Promise<unknown> | unknown;
}
// ts-matrix: 對外相容別名 (API 不變)
export type { GatewayAPIRequest as APIRequest };

export interface GatewayAPIResponse {
  status: number;
  body: unknown;
  cached: boolean;
  hashLock: string;
}
// ts-matrix: 對外相容別名 (API 不變)
export type { GatewayAPIResponse as APIResponse };
