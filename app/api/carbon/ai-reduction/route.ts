import { NextResponse } from 'next/server';

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
const OLLAMA_MODEL = 'qwen2.5:3b-64k';

export async function POST(req: Request) {
  try {
    const { scope1, scope2, scope3, industry } = await req.json();

    const systemPrompt = `You are a top-tier ESG Carbon Management Consultant.
Your task is to analyze the provided Greenhouse Gas (GHG) emissions data (Scope 1, 2, and 3) and industry type.
Provide a highly professional, structured JSON response with a localized reduction strategy (in Traditional Chinese).
JSON Format Requirements:
- "status": String (e.g., "High Risk", "On Track", "Excellent")
- "analysis": String (A concise paragraph analyzing their current emission profile)
- "shortTerm": Array of Strings (3 immediate, low-cost actions)
- "longTerm": Array of Strings (3 strategic, CAPEX-heavy actions)
- "score": Number (1-100, representing current efficiency estimate)`;

    const userPrompt = `Industry: ${industry}
Scope 1 Emissions: ${scope1} tCO2e
Scope 2 Emissions: ${scope2} tCO2e
Scope 3 Emissions: ${scope3} tCO2e

Please provide a structured emission reduction strategy based on these metrics.`;

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: false,
        format: 'json'
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    let strategyData;
    try {
      strategyData = JSON.parse(data.message?.content || '{}');
    } catch (e) {
      strategyData = {
        status: "Unknown",
        analysis: "無法解析 AI 回應，請稍後再試。",
        shortTerm: ["檢查設備能耗", "導入智慧電表"],
        longTerm: ["規劃再生能源採購", "供應鏈低碳轉型"],
        score: 50
      };
    }

    // 🔥 每次成功執行 AI 減碳分析，自動注入化身經驗值
    const apiKey = process.env.OMNI_JUNAIKEY_GROWTH_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';
    if (apiKey) {
      fetch(`${baseUrl}/api/junaikey/growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ expGain: 45 })
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      strategy: strategyData
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message,
      fallback: {
        status: "Service Offline",
        analysis: "AI 引擎目前離線，啟用基本建議模式。您的範疇二排放可能偏高，建議優先處理。",
        shortTerm: ["關閉非必要照明", "汰換老舊冷氣"],
        longTerm: ["建置屋頂型太陽能", "導入 ISO 14064-1"],
        score: 60
      }
    });
  }
}
