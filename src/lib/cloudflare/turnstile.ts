// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Cloudflare Turnstile — 網站防機器人驗證（後端驗證）
 * ---------------------------------------------------------------------------
 * ⚠️ 重要（來自 Cloudflare 帳戶 API 令牌相容性矩陣）：
 *    Turnstile 為 ❌「不支援」帳戶 API 令牌。Turnstile 使用「zone 層級
 *    scoped API token」或「Global API Key」，與帳戶令牌（cfat_）是不同體系。
 *    本模組只做「token 驗證」(siteverify)，需要的密鑰是 TURNSTILE_SECRET_KEY
 *    （在 zone 的 API Tokens 頁產生，或 dashboard 的 Turnstile 設定取得）。
 *
 * 設計原則：
 *  - 零依賴（fetch），僅後端呼叫 siteverify。
 *  - 前端 widget 請參見 README 區段：在表單頁注入 https://challenges.cloudflare.com/turnstile/v0/api.js
 *    並以 data-sitekey="{{NEXT_PUBLIC_TURNSTILE_SITE_KEY}}" 渲染。
 *  - 學員中心的作業提交 / 預約諮詢表單可在 API route 呼叫 verifyTurnstile() 防刷。
 *
 * 參考：https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

export interface TurnstileVerifyOptions {
  /** 前端回傳的 token */
  token: string;
  /** 後端 secret（secret key，絕不能 NEXT_PUBLIC_*） */
  secret: string;
  /** 使用者 IP（選填，提升風險判斷） */
  ip?: string;
  /** 自訂 action 比對（選填，前端設定的 c.action） */
  action?: string;
  /** 預期網站主機名（選填，前端設定的 c.origin） */
  cdata?: string;
  siteverifyUrl?: string;
}

export interface TurnstileVerifyResult {
  ok: boolean;
  /** 風險分數 0.0~1.0（僅在 enterprise 方案回傳） */
  score?: number;
  action?: string;
  cdata?: string;
  hostname?: string;
  challengeTs?: string;
  errorCodes?: string[];
  raw?: unknown;
}

const DEFAULT_SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * 驗證 Turnstile token。失敗 / 缺 secret / 缺 token 一律回傳 ok:false（fail closed）。
 */
export async function verifyTurnstile(opts: TurnstileVerifyOptions): Promise<TurnstileVerifyResult> {
  if (!opts.token) return { ok: false, errorCodes: ["missing-response"] };
  if (!opts.secret) return { ok: false, errorCodes: ["missing-secret"] };

  const params = new URLSearchParams();
  params.set("secret", opts.secret);
  params.set("response", opts.token);
  if (opts.ip) params.set("remoteip", opts.ip);
  if (opts.action) params.set("action", opts.action);
  if (opts.cdata) params.set("cdata", opts.cdata);

  try {
    const res = await fetch(opts.siteverifyUrl ?? DEFAULT_SITEVERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const json = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
      score?: number;
      action?: string;
      cdata?: string;
      hostname?: string;
      challenge_ts?: string;
    };
    return {
      ok: Boolean(json.success),
      score: json.score,
      action: json.action,
      cdata: json.cdata,
      hostname: json.hostname,
      challengeTs: json.challenge_ts,
      errorCodes: json["error-codes"],
      raw: json,
    };
  } catch (err) {
    return { ok: false, errorCodes: ["fetch-failed"], raw: String(err) };
  }
}

/**
 * 在 Next.js route handler 中快速取用環境變數驗證。
 * 從 process.env 讀 TURNSTILE_SECRET_KEY（與 NEXT_PUBLIC_TURNSTILE_SITE_KEY 分開）。
 */
export function verifyTurnstileFromEnv(token: string, ip?: string): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  return verifyTurnstile({ token, secret: secret ?? "", ip });
}
