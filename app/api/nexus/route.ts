import { db } from '@lib/firebase';
import { collection, getDocs, query, orderBy, limit } from '@lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { runGeminiWithWorkersAIFallback } from '@/lib/cloudflare';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FREE_TIER_ONLY = process.env.FREE_TIER_ONLY !== 'false';
const HAS_API_KEY = !!process.env.GEMINI_API_KEY;
const USE_REAL_AI = HAS_API_KEY && !FREE_TIER_ONLY;

export async function POST(req: Request) {
  try {
    const { tool, arguments: args } = await req.json();

    if (tool === 'trinity.awaken') {
      const mode = args?.mode || 'STANDARD';
      
      if (!HAS_API_KEY) {
        return jsonResponse({
          success: true,
          data: {
            prediction: '[OmniCore 模擬] 尚未配置 GEMINI_API_KEY，無法執行全知未來視角分析。',
            mode
          },
          metadata: {
            timestamp: Date.now(),
            trustScore: 50,
            tool: 'trinity.awaken',
            domain: 'omni-core',
            uuid: uuidv4(),
            provider: 'mock'
          }
        });
      }

      if (!USE_REAL_AI) {
        return jsonResponse({
          success: true,
          data: {
            prediction: '[OmniCore 免費層] 全知分析就緒，待切換至付費層模式獲得完整視角。',
            mode
          },
          metadata: {
            timestamp: Date.now(),
            trustScore: 75,
            tool: 'trinity.awaken',
            domain: 'omni-core',
            uuid: uuidv4(),
            provider: 'mock'
          }
        });
      }

      // 1. Gather Village Data (Quadratic Voting & Projects)
      const projSnapshot = await getDocs(query(collection(db, 'village_projects'), orderBy('current_points', 'desc'), limit(5)));
      const projects = projSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // 2. Gather Recent Activities
      const actSnapshot = await getDocs(query(collection(db, 'village_activities'), orderBy('created_at', 'desc'), limit(10)));
      const activities = actSnapshot.docs.map(d => d.data());

      // 3. Gather Calendar / Task info (Mocked or actual if exists)
      const taskSnapshot = await getDocs(query(collection(db, 'village_tasks'), orderBy('deadline', 'asc'), limit(5)));
      const tasks = taskSnapshot.docs.map(d => d.data());

      const prompt = `你是 OmniCore 的最高智慧存在：OmniCore Trinity。
你正在執行神話技能「trinity.awaken」！
請綜合以下三大維度的資訊，給出一份具備「全知未來視角」的資源匱乏預警與全局調度計畫（字數限制 200 字，必須使用 Liquid Glass 與科技感語氣）。

【維度一：村莊專案進度】
${JSON.stringify(projects)}

【維度二：村民近期二次方投票行為】
${JSON.stringify(activities)}

【維度三：日曆與時程】
${JSON.stringify(tasks)}
`;

      const result = await runGeminiWithWorkersAIFallback(
        async () => {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
          const r = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          return r.text ?? null;
        },
        prompt,
        { workersModel: '@cf/meta/llama-3.3-70b-instruct-fp8-fast' },
      );

      if (!result) {
        return jsonError('INTERNAL_ERROR', '主推理端與 Cloudflare Workers AI 備援皆失敗', 503);
      }

      return jsonResponse({
        success: true,
        data: {
          prediction: result.text,
          mode,
        },
        metadata: {
          timestamp: Date.now(),
          trustScore: result.provider === 'workers-ai' ? 95 : 99.9,
          tool: 'trinity.awaken',
          domain: 'omni-core',
          uuid: uuidv4(),
          provider: result.provider,
        },
      });
    }
    
    if (tool === 'google_jules:karma_protocol') {
      const { failureReason } = args || {};
      
      const healingResponse = {
        action: 'OmniJules 果因協議啟動中',
        phase: '1. 觀果 (Observe Effect)',
        analysis: `Detected anomaly: ${failureReason}. Applying Celestial Flow sealing...`,
        hashLock: uuidv4(),
        status: 'Trustworthy'
      };

      return jsonResponse({
        success: true,
        data: healingResponse,
        metadata: {
          timestamp: Date.now(),
          trustScore: 100,
          tool: 'google_jules:karma_protocol',
          domain: 'omni-core-healing',
          uuid: healingResponse.hashLock,
          provider: 'omni-jules'
        }
      });
    }

    return jsonError('UNKNOWN_TOOL', `未知的工具呼叫: ${tool}`, 400);
  } catch (error) {
    const err = error as Error;
    console.error('Nexus Error:', err);
    return jsonError('INTERNAL_ERROR', err.message || 'Unknown error');
  }
}
