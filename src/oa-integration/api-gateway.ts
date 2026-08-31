/**
 * §12.1.4 API 閘道 (API Gateway)
 * 5T: Trackable (訪問日誌可觀測)
 */
import { freeze, uuidV4, OA_VERSION } from './types';

export interface APIRequest {
  clientId: string;
  path: string;
}

export interface APIResponse {
  readonly id: string;
  readonly status: number;
  readonly body: string;
  readonly ts: number;
}

export class APIGateway {
  private readonly accessLog: APIResponse[] = [];

  /** Trackable: 每次請求寫入訪問日誌 */
  async handle(req: APIRequest, handler: () => string): Promise<APIResponse> {
    const body = handler();
    const res = freeze({
      id: uuidV4(),
      status: 200,
      body,
      ts: Date.now(),
    }) as APIResponse;
    this.accessLog.push(res);
    return res;
  }

  getAccessLog(): ReadonlyArray<APIResponse> {
    return freeze([...this.accessLog]);
  }
}
