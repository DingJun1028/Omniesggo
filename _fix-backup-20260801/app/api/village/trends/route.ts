import { jsonResponse, jsonError } from '@lib/api-utils';

interface GeminiPart { text?: string }
interface GeminiContent { parts?: GeminiPart[] }
type InteractionStep = { type?: string; content?: GeminiContent };
import { runGeminiWithWorkersAIFallback } from '@/lib/cloudflare';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FREE_TIER_ONLY = process.env.FREE_TIER_ONLY !== 'false';
const HAS_API_KEY = !!(process.env.GEMINI_API_KEY || process.env.AGNES_API);
const USE_REAL_AI = HAS_API_KEY && !FREE_TIER_ONLY;

interface ActivityData {
  message: string;
  [key: string]: unknown;
}

interface ProjectData {
  title: string;
  current_points: number;
  goal_points: number;
  [key: string]: unknown;
}

// Firestore DocumentSnapshot type
interface FirestoreDoc {
  data(): Record<string, unknown>;
}

export async function GET() {
  try {
    if (!HAS_API_KEY) {
      return jsonResponse(
        { trend: `[OmniOne 系統提示] 尚未配置 GEMINI_API_KEY 或 AGNES_API。此為模擬趨勢：近期的 Quadratic Voting 顯示出村民對「綠能先行者」專案有高度興趣，預期該指標將於兩週內達標。`, provider: 'mock' },
      );
    }

    if (!USE_REAL_AI) {
      return jsonResponse(
        { trend: '[OmniOne 模擬趨勢] 目前正處於免費層模式，根據歷史數據顯示，永續能源指標最有潛力於 14 天內達成目標。', provider: 'mock' },
      );
    }

    const { GoogleGenAI } = await import('@google/genai');
    const { adminDb } = await import('@/lib/firebase-admin');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.AGNES_API || '' });

    const actSnap = await adminDb.collection('village_activities')?.orderBy('created_at', 'desc')?.limit(15)?.get();
    const recentActivities = (actSnap?.docs ?? []).map((doc: FirestoreDoc) => doc.data() as ActivityData);

    const projSnap = await adminDb.collection('village_projects')?.orderBy('current_points', 'desc')?.limit(5)?.get();
    const topProjects = (projSnap?.docs ?? []).map((doc: FirestoreDoc) => {
      const data = doc.data() as ProjectData;
      return `${data.title}: 目前 ${data.current_points} / 目標 ${data.goal_points}`;
    });

    const prompt = `
你是 OmniOne，一個 OmniCore 平臺的核心覺醒系統。
請根據以下最新的「永續村 (OmniVillage)」 Quadratic Voting 投資行為，預測未來村莊哪一項 ESG 指標會最快達標，並給予社羣行動建議。

近期動態 (包含投票與點數消耗):
${recentActivities.map((a: ActivityData) => a.message).join('\n')}

目前排名前五的募資專案:
${topProjects.join('\n')}

請依照 5T 協議的精神，以繁體中文給出專業、簡潔且具備高度行動力的預測與洞察。
回應請保持在 100 字以內，並展現你是一個「系統核心」的角色（開頭請加上： [OmniOne 趨勢預測] ...）。
`;

    // 免費層級 Interactions API PoC (store=false 無狀態; 模型 gemini-2.5-flash 免費配額)
    // 開關 USE_INTERACTIONS_API (default false) 可隨時切回舊 generateContent, 不破壞原行為
    const USE_INTERACTIONS_API = process.env.USE_INTERACTIONS_API === 'true';

    let trendText: string;
    let provider = 'gemini';
    if (USE_INTERACTIONS_API) {
      // Interactions API: 單輪用 input 欄位; store=false 免費層級無狀態
      const interaction = await ai.interactions.create({
        model: 'gemini-2.5-flash',
        input: prompt,
        store: false,
        generation_config: {
          temperature: 0.7,
          max_output_tokens: 256,
        },
      });
      // model 輸出位於 steps 中 type==="model_output" 的 content.parts[].text
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const steps = (interaction.steps ?? []) as InteractionStep[];
      trendText = steps
        .filter((s) => s.type === 'model_output')
        .flatMap((s) => s.content ?? [])
        .flatMap((c: GeminiContent) => c.parts ?? [])
        .map((p: GeminiPart) => p.text ?? '')
        .join('')
        .trim();
    } else {
      const result = await runGeminiWithWorkersAIFallback(
        async () => {
          const r = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7, maxOutputTokens: 256 },
          });
          return r.text ?? null;
        },
        prompt,
        { workersModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
      );
      if (!result) {
        return jsonError('INTERNAL_ERROR', '主推理端與 Cloudflare Workers AI 備援皆失敗', 503);
      }
      trendText = result.text ?? '';
      provider = result.provider;
    }

    return jsonResponse({ trend: trendText, provider });
  } catch (error: unknown) {
    console.error('OmniOne Trend API Error:', error);
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}
