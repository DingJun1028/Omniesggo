// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Cloudflare Workers AI — 備援推理提供者
 * ---------------------------------------------------------------------------
 * 對照 Cloudflare 文件「Account API tokens」：Workers AI 在相容性矩陣為 ✅，
 * 可用帳戶 API 令牌（cfat_ 前綴）呼叫。
 *
 * 設計原則：
 *  - 零新依賴（僅用 fetch + WebCrypto），確保 pnpm typecheck 通過。
 *  - 作為 esggo 現有 @google/genai 主力的「備援」端：主端 Ollama/VPS 失敗時降級到此。
 *  - 絕不把 CLOUDFLARE_ACCOUNT_TOKEN 暴露到 NEXT_PUBLIC_*（僅後端使用）。
 *
 * 權限需求（建立帳戶令牌時勾選）：
 *  - Workers AI: Read  (推論只需 Read)
 *  - Account: Read     (讀取 account 層級設定，非必須但建議)
 *
 * 參考：https://developers.cloudflare.com/workers-ai/get-started/rest-api/
 */

export interface WorkersAIConfig {
  /** Cloudflare 帳戶 ID（32 字元 hex） */
  accountId: string;
  /** 帳戶 API 令牌（cfat_ 前綴）；建議從 process.env.CLOUDFLARE_ACCOUNT_TOKEN 注入 */
  apiToken: string;
  /** 自訂端點，預設 https://api.cloudflare.com */
  baseUrl?: string;
}

export interface WorkersAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface WorkersAIChatOptions {
  model?: string;
  messages: WorkersAIMessage[];
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

export interface WorkersAIResult {
  ok: boolean;
  text?: string;
  model?: string;
  error?: string;
  /** 原始用量（若有） */
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

const DEFAULT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DEFAULT_BASE = "https://api.cloudflare.com";

/** 取環境變數中的令牌；missing 時丟錯讓呼叫方 fail-fast（不靜默降級到假資料） */
function resolveConfig(overrides?: Partial<WorkersAIConfig>): WorkersAIConfig {
  const accountId = overrides?.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = overrides?.apiToken ?? process.env.CLOUDFLARE_ACCOUNT_TOKEN;
  if (!accountId || !/^[a-f0-9]{32}$/i.test(accountId)) {
    throw new Error("[WorkersAI] CLOUDFLARE_ACCOUNT_ID 未設定或格式不正確（應為 32 字元 hex）");
  }
  if (!apiToken || !apiToken.startsWith("cfat_")) {
    throw new Error("[WorkersAI] CLOUDFLARE_ACCOUNT_TOKEN 未設定或格式不正確（應以 cfat_ 開頭）");
  }
  return { accountId, apiToken, baseUrl: overrides?.baseUrl ?? DEFAULT_BASE };
}

/**
 * 呼叫 Workers AI 的聊天補全（非串流）。
 * 失敗時回傳 ok:false（交由上層決定是否降級到主推理端），不自行吞錯。
 */
export async function workersAIChat(opts: WorkersAIChatOptions, overrides?: Partial<WorkersAIConfig>): Promise<WorkersAIResult> {
  try {
    const cfg = resolveConfig(overrides);
    const model = opts.model ?? DEFAULT_MODEL;
    const url = `${cfg.baseUrl}/client/v4/accounts/${cfg.accountId}/ai/run/${encodeURIComponent(model)}`;

    const body = {
      messages: opts.messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
      top_p: opts.topP,
      stream: false,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `Workers AI HTTP ${res.status}: ${txt.slice(0, 300)}` };
    }

    const json = (await res.json()) as {
      success?: boolean;
      errors?: Array<{ message?: string }>;
      result?: { response?: string; usage?: WorkersAIResult["usage"] };
    };

    if (!json.success) {
      return { ok: false, error: `Workers AI 失敗: ${json.errors?.[0]?.message ?? "unknown"}` };
    }

    return {
      ok: true,
      text: json.result?.response ?? "",
      model,
      usage: json.result?.usage,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * 簡易降級封裝：嘗試主推理端（caller 傳入），失敗再試 Workers AI。
 * 僅在兩者都失敗時回傳 null。
 */
export async function withWorkersAIFallback(
  primary: () => Promise<string | null>,
  opts: WorkersAIChatOptions,
  overrides?: Partial<WorkersAIConfig>,
): Promise<string | null> {
  const primaryOut = await safe(primary);
  if (primaryOut !== null) return primaryOut;
  const fb = await workersAIChat(opts, overrides);
  return fb.ok && fb.text ? fb.text : null;
}

function safe<T>(p: () => Promise<T>): Promise<T | null> {
  return p().catch(() => null);
}
