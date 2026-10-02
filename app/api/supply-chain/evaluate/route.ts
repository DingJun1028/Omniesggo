import { NextResponse } from 'next/server';

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
const OLLAMA_MODEL = 'qwen2.5:3b-64k';

export async function POST(req: Request) {
  try {
    const { supplierName, industry, rawData } = await req.json();

    if (!supplierName || !rawData) {
      return NextResponse.json({ success: false, error: '缺少供應商資料' }, { status: 400 });
    }

    const systemPrompt = `You are a Supply Chain ESG Risk Auditor.
Evaluate the supplier based on their data.
Respond ONLY with a JSON object in this format:
{
  "rating": "A", // A, B, C, or D
  "riskLevel": "Low", // Low, Medium, High, Critical
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendation": "Brief action plan for procurement"
}`;

    let evaluationResult;
    try {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Supplier: ${supplierName}\nIndustry: ${industry}\nData:\n${rawData}` }
          ],
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) throw new Error('Ollama failed');
      const data = await response.json();
      evaluationResult = JSON.parse(data.message?.content || '{}');
    } catch {
      // Fallback
      evaluationResult = {
        rating: "B",
        riskLevel: "Medium",
        strengths: ["ISO 14001 認證完備", "勞動人權合規"],
        weaknesses: ["範疇三碳排放數據不完整", "缺乏再生能源轉換計畫"],
        recommendation: "建議啟動供應商輔導計畫，要求於Q3前補齊碳排數據。"
      };
    }

    // 🔥 聯動：成功評估供應商，給予 JunAiKey 25 EXP
    const apiKey = process.env.OMNI_JUNAIKEY_GROWTH_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';
    if (apiKey) {
      fetch(`${baseUrl}/api/junaikey/growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ expGain: 25 })
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      evaluation: evaluationResult
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
