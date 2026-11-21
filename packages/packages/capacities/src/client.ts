/**
 * Capacities API Client — OA-Team 30 萬能蜂群
 *
 * 支援兩種認證：
 *  1. Personal token (cap-api-...) — 本機自用小工具
 *  2. OAuth 2.0 PKCE — 第三方整合（需先向 Capacities 申請 client_id）
 *
 * 參見 docs/integrations/capacities-api.md
 */

const CAPACITIES_API_BASE = "https://api.capacities.io";

/** 從環境變數讀取 token；不硬編碼任何憑證 */
export interface CapacitiesClientConfig {
  /** Personal token (cap-api-...) 或 OAuth access_token */
  accessToken?: string;
  /** OAuth 模式下的 client_id（public client，無 secret） */
  clientId?: string;
  baseUrl?: string;
}

export class CapacitiesAuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "CapacitiesAuthError";
  }
}

export class CapacitiesClient {
  private readonly baseUrl: string;
  private accessToken: string | undefined;
  private readonly clientId: string | undefined;

  constructor(config: CapacitiesClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? CAPACITIES_API_BASE;
    this.accessToken = config.accessToken ?? process.env.CAPACITIES_ACCESS_TOKEN;
    this.clientId = config.clientId ?? process.env.CAPACITIES_CLIENT_ID;
  }

  /** 設定/更新 access token（OAuth refresh 後呼叫） */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  private authHeaders(): Record<string, string> {
    if (!this.accessToken) {
      throw new CapacitiesAuthError(
        "cap_not_authenticated",
        "No access token configured. Set CAPACITIES_ACCESS_TOKEN or pass accessToken.",
      );
    }
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  /** 通用 fetch 封裝：自動帶 Bearer、解析 JSON、錯誤標準化 */
  async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.authHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      throw new CapacitiesAuthError(
        "cap_not_authenticated",
        "Token rejected (401). It may be expired or revoked.",
      );
    }

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Capacities API ${res.status}: ${text.slice(0, 300)}`);
    }
    return text ? (JSON.parse(text) as T) : (undefined as T);
  }

  // ---- Spaces / Objects ----

  /** 取得當前 token 綁定的 space 資訊（personal token 不需要 spaceId） */
  async getSpaceInfo(): Promise<unknown> {
    return this.request("GET", "/v1/space");
  }

  async listObjects(params?: { type?: string; limit?: number }): Promise<unknown> {
    const q = new URLSearchParams();
    if (params?.type) q.set("type", params.type);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return this.request("GET", `/v1/objects${qs ? `?${qs}` : ""}`);
  }

  async getObject(id: string): Promise<unknown> {
    return this.request("GET", `/v1/objects/${encodeURIComponent(id)}`);
  }

  async createObject(payload: Record<string, unknown>): Promise<unknown> {
    return this.request("POST", "/v1/objects", payload);
  }

  async updateObject(
    id: string,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    return this.request("PATCH", `/v1/objects/${encodeURIComponent(id)}`, payload);
  }
}

// ---- OAuth 2.0 PKCE helpers ----

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

/** 產生 PKCE pair（S256） */
export async function generatePkce(): Promise<PkcePair> {
  const verifier = crypto
    .getRandomValues(new Uint8Array(32))
    .reduce((s, b) => s + b.toString(16).padStart(2, "0"), "");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  const challenge = btoa(
    String.fromCharCode(...new Uint8Array(digest)),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { codeVerifier: verifier, codeChallenge: challenge };
}

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  baseUrl?: string;
}

/** 組出授權端點 URL（resource 參數必須是 api.capacities.io） */
export function buildAuthorizeUrl(
  pkce: PkcePair,
  cfg: OAuthConfig,
  state = crypto.randomUUID(),
): string {
  const base = cfg.baseUrl ?? CAPACITIES_API_BASE;
  const q = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: (cfg.scopes ?? ["api:read", "api:write", "offline_access"]).join(" "),
    resource: CAPACITIES_API_BASE,
    code_challenge: pkce.codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return `${base}/oauth/authorize?${q.toString()}`;
}

/** 用 authorization code 交換 token（public client，無 secret） */
export async function exchangeCodeForToken(
  code: string,
  pkce: PkcePair,
  cfg: OAuthConfig,
  baseUrl: string = CAPACITIES_API_BASE,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
    client_id: cfg.clientId,
    code_verifier: pkce.codeVerifier,
  });
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new CapacitiesAuthError("invalid_grant", `Token exchange failed: ${err}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
  };
}

/** Refresh（refresh token 每次輪換，呼叫後立即存新值） */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  baseUrl: string = CAPACITIES_API_BASE,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });
  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    throw new CapacitiesAuthError("invalid_grant", "Refresh failed");
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}
