import { NextRequest, NextResponse } from 'next/server';
import { AgenticTwin } from '@/lib/omni-reports/agentic-twin';

export const dynamic = 'force-dynamic';

/**
 * Agentic Twin API (mod-adv-twin-0001)
 * 接收報告數據 → 9式果因引擎零幻覺驗算 → 產出 Dr. Thoth 雙棲戰略洞察。
 *
 * 免費算立架構：
 * - 預設：本地啟發式 (AgenticTwin.autonomousAnalyze)，零外部依賴。
 * - 設 AGENTIC_TWIN_OLLAMA_URL（如 http://localhost:11434）+ 模型存在時：
 *   呼叫本機 Ollama（qwen2.5:3b / gemma4）產生真 LLM 洞察，啟發式作降級。
 * - 未來接雲端 LLM 亦同此模式（改 env 指向即可，前端不需改）。
 */
const OLLAMA_URL = process.env.AGENTIC_TWIN_OLLAMA_URL ?? '';
const OLLAMA_MODEL = process.env.AGENTIC_TWIN_OLLAMA_MODEL ?? 'qwen2.5:3b';

interface OllamaMsg {
  role: 'system' | 'user';
  content: string;
}

async function callOllama(prompt: string): Promise<string | null> {
  if (!OLLAMA_URL) return null;
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          {
            role: 'system',
            content:
              '你是 ESG 永續顧問 Dr. Thoth。根據企業環境數據，產出簡潔的雙棲戰略洞察（中文）。' +
              '若數據異常或證據不足，明確指出風險。只回傳 JSON：{status,title,insight,actionRequired[]}。',
          },
          { role: 'user', content: prompt },
        ] as OllamaMsg[],
        stream: false,
        options: { temperature: 0.3 },
      }),
      // 15s 超時，避免阻塞 UI
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.message?.content ?? null;
  } catch {
    return null; // 降級到啟發式
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const twin = new AgenticTwin({
      enterpriseName: 'ESGGO',
      industry: 'sustainability',
      currentEntropy: 0.08,
    });

    // 零幻覺驗算（啟發式，含 schema 防呆）
    const heuristic = await twin.autonomousAnalyze(body);

    // 嘗試真 LLM 增強；失敗則保持啟發式
    const llmRaw = await callOllama(
      `報告數據：${JSON.stringify(body)}\n請基於此產出 Dr. Thoth 洞察。`
    );

    let insight = heuristic;
    if (llmRaw) {
      try {
        const parsed = JSON.parse(llmRaw.replace(/```json|```/g, '').trim());
        if (parsed && parsed.title && parsed.insight) {
          insight = {
            status: parsed.status ?? heuristic.status,
            title: parsed.title,
            insight: parsed.insight,
            actionRequired: Array.isArray(parsed.actionRequired)
              ? parsed.actionRequired
              : heuristic.actionRequired,
          };
        }
      } catch {
        // LLM 回傳非 JSON → 保留啟發式
      }
    }

    return NextResponse.json({ success: true, insight, llmEnhanced: !!llmRaw });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
