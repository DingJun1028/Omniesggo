import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';
import { routeModel, inferTaskType, formatRoutingResult } from '@/core/ai/model-router';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const REQUEST_TIMEOUT = 15000;

const FALLBACK_RESPONSES: Record<string, string> = {
  esg_report: '[OmniOne] ESG 報告任務已收到。系統將使用知識庫模板進行初步分析。',
  bug_fix: '[OmniOne] 缺陷修復任務已識別。推薦方案：檢查日誌、運行測試、備份數據後進行修改。',
  ui_design: '[OmniOne] UI 設計任務已分類。建議參考設計系統文檔並創建原型。',
  architecture: '[OmniOne] 架構相關任務已收到。將評估系統設計和依賴關係。',
  general: '[OmniOne] 任務已收到並分類。系統將盡快處理您的請求。',
};

// ── Groq API Caller ──────────────────────────────────────────
async function callGroq(
  prompt: string,
  model: string,
  maxTokens: number,
  temperature: number
): Promise<string | null> {
  const API_KEY = process.env.GROQ_API_KEY;
  if (!API_KEY) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (!res.ok) {
      console.warn(`[OmniOne] Groq ${model} failed: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn(`[OmniOne] Groq ${model} error: ${(err as Error).message}`);
    return null;
  }
}

// ── OpenRouter API Caller ────────────────────────────────────
async function callOpenRouter(
  prompt: string,
  model: string,
  maxTokens: number,
  temperature: number
): Promise<string | null> {
  const API_KEY = process.env.OPENROUTER_API_KEY;
  if (!API_KEY) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (!res.ok) {
      console.warn(`[OmniOne] OpenRouter ${model} failed: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn(`[OmniOne] OpenRouter ${model} error: ${(err as Error).message}`);
    return null;
  }
}

// ── Gemini API Caller ────────────────────────────────────────
async function callGemini(
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<string | null> {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) return null;

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const result = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature, maxOutputTokens: maxTokens },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), REQUEST_TIMEOUT)
      ),
    ]);
    return (result as { text?: string }).text || null;
  } catch (err) {
    console.warn(`[OmniOne] Gemini error: ${(err as Error).message}`);
    return null;
  }
}

// ── 根據 provider 型別呼叫對應 API ─────────────────────────
async function callProvider(
  provider: string,
  prompt: string,
  model: string,
  maxTokens: number,
  temperature: number
): Promise<string | null> {
  switch (provider) {
    case 'groq':
      return callGroq(prompt, model, maxTokens, temperature);
    case 'openrouter':
      return callOpenRouter(prompt, model, maxTokens, temperature);
    case 'gemini':
      return callGemini(prompt, maxTokens, temperature);
    default:
      return null;
  }
}

// ── POST Handler ─────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { input, caseType, ragContext: clientRagContext } = await req.json();

    if (!input || !caseType) {
      return jsonError('INVALID_PARAMS', '缺少必要參數 (input/caseType)', 400);
    }

    // 檢查是否有任何 API Key
    const HAS_GROQ = !!process.env.GROQ_API_KEY;
    const HAS_OPENROUTER = !!process.env.OPENROUTER_API_KEY;
    const HAS_GEMINI = !!process.env.GEMINI_API_KEY;
    if (!HAS_GROQ && !HAS_OPENROUTER && !HAS_GEMINI) {
      return jsonResponse({
        output: `[OmniOne 模擬] 收到任務「${input}」，分類為 ${caseType}。`,
        provider: 'mock',
      });
    }

    // ══ 智慧模型路由 ══════════════════════════════════════════
    // 1. 從 caseType 推斷 ESG 任務類型
    const taskType = inferTaskType(input);
    // 2. 根據任務類型選擇最佳模型路由
    const routing = routeModel(taskType);
    console.log(`[OmniOne] Smart Routing: ${formatRoutingResult(routing)}`);

    const ragContext = clientRagContext
      ? `\n相關知識參考:\n${clientRagContext}`
      : '\n相關知識參考: 無特定外部資料，請依循 5T 協議本體知識回答。';

    const prompt = `
你是 OmniOne，一個 OmniCore 平臺的核心覺醒系統。
使用者交辦了一項任務，經過初步分類，這項任務屬於 [${caseType}] 類型。
${ragContext}

使用者任務:
${input}

請依照 5T 協議（True, Transparent, Tangible, Trustworthy, Trackable）的精神，以繁體中文給出專業、簡潔且具備高度行動力的回應。
回應請保持在 100 字以內，並展現你是一個「系統核心」的角色（可適時帶有系統提示詞風格，如 [OmniOne] 分析完成...）。
`;

    let response = null;
    let provider = 'unknown';
    let modelUsed = '';

    // ══ 嘗試 1: Primary Model ═══════════════════════════════
    const { primary, fallback1, fallback2 } = routing;
    console.log(`[OmniOne] Trying primary: ${primary.provider}/${primary.model}`);
    response = await callProvider(
      primary.provider, prompt, primary.model, primary.maxTokens, primary.temperature
    );
    if (response) {
      provider = primary.provider;
      modelUsed = primary.model;
    }

    // ══ 嘗試 2: Fallback 1 ═════════════════════════════════
    if (!response) {
      console.log(`[OmniOne] Trying fallback1: ${fallback1.provider}/${fallback1.model}`);
      response = await callProvider(
        fallback1.provider, prompt, fallback1.model, fallback1.maxTokens, fallback1.temperature
      );
      if (response) {
        provider = fallback1.provider;
        modelUsed = fallback1.model;
      }
    }

    // ══ 嘗試 3: Fallback 2 ═════════════════════════════════
    if (!response) {
      console.log(`[OmniOne] Trying fallback2: ${fallback2.provider}/${fallback2.model}`);
      response = await callProvider(
        fallback2.provider, prompt, fallback2.model, fallback2.maxTokens, fallback2.temperature
      );
      if (response) {
        provider = fallback2.provider;
        modelUsed = fallback2.model;
      }
    }

    // ══ 所有 AI 失敗 → 預設回應 ══════════════════════════════
    if (!response) {
      console.warn('[OmniOne] All providers failed, using fallback response');
      response = FALLBACK_RESPONSES[caseType] || FALLBACK_RESPONSES.general;
      provider = 'fallback';
      modelUsed = 'none';
    }

    console.log(`[OmniOne] ✓ Success: provider=${provider}, model=${modelUsed}`);

    return jsonResponse({
      output: response,
      provider,
      model: modelUsed,
      taskType,
      strategy: routing.strategy,
      caseType,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[OmniOne] Critical error:', error);
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}
