/**
 * §12.1.4 API 閘道 (API Gateway)
 * 5T: Trackable (訪問日誌可觀測)
 */
import { freeze, uuidV4 } from './types';

export interface OaAPIRequest {
  clientId: string;
  path: string;
}
// ts-matrix: 對外相容別名 (API 不變)
export type { OaAPIRequest as APIRequest };

export interface OaAPIResponse {
  readonly id: string;
  readonly status: number;
  readonly body: string;
  readonly ts: number;
}
// ts-matrix: 對外相容別名 (API 不變)
export type { OaAPIResponse as APIResponse };

export class APIGateway {
  private readonly accessLog: OaAPIResponse[] = [];

  /** Trackable: 每次請求寫入訪問日誌 */
  async handle(req: OaAPIRequest, handler: () => string): Promise<OaAPIResponse> {
    const body = handler();
    const res = freeze({
      id: uuidV4(),
      status: 200,
      body,
      ts: Date.now(),
    }) as OaAPIResponse;
    this.accessLog.push(res);
    return res;
  }

  getAccessLog(): ReadonlyArray<OaAPIResponse> {
    return freeze([...this.accessLog]);
  }
}
