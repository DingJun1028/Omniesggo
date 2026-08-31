// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Gemini 主推理 × Workers AI 備援 薄封裝層
 * ---------------------------------------------------------------------------
 * 讓 Next route 用一行切換「主端(@google/genai) → 備援(Cloudflare Workers AI)」。
 * - 主端失敗（拋錯/回 null）才降級到 Workers AI；不靜默造假。
 * - 兩者皆敗回 null，由呼叫方 fail-closed（不回模擬資料）。
 * - provider 欄位便於觀測是否發生降級。
 *
 * 參考：src/lib/cloudflare/workers-ai.ts（帳戶令牌 cfat_ 呼叫）
 */
import { workersAIChat, type WorkersAIMessage } from "./workers-ai";

export type InferenceProvider = "gemini" | "workers-ai";

export interface InferenceResult {
  text: string;
  provider: InferenceProvider;
}

export interface FallbackOptions {
  /** Workers AI 模型（預設走 workers-ai.ts 的 DEFAULT_MODEL） */
  workersModel?: string;
  /** 若主端已組好 messages 陣列可傳入；否則用 prompt 包成單條 user message */
  messages?: WorkersAIMessage[];
  /** Workers AI 額外參數 */
  workersOverrides?: { accountId?: string; apiToken?: string; baseUrl?: string };
}

/**
 * 執行主推理，失敗降級 Workers AI。
 * @param primary 主推理呼叫（如 Gemini generateContent），回傳文字或 null
 * @param prompt  當無自訂 messages 時，作為 Workers AI 的 user 訊息
 */
export async function runGeminiWithWorkersAIFallback(
  primary: () => Promise<string | null>,
  prompt: string,
  opts: FallbackOptions = {},
): Promise<InferenceResult | null> {
  const primaryText = await safe(primary);
  if (primaryText !== null && primaryText.length > 0) {
    return { text: primaryText, provider: "gemini" };
  }

  const fb = await workersAIChat(
    {
      model: opts.workersModel,
      messages: opts.messages ?? [{ role: "user", content: prompt }],
    },
    opts.workersOverrides,
  );

  if (fb.ok && fb.text && fb.text.length > 0) {
    return { text: fb.text, provider: "workers-ai" };
  }
  return null;
}

function safe<T>(p: () => Promise<T>): Promise<T | null> {
  return p().catch(() => null);
}
