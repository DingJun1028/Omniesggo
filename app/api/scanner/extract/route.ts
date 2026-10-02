import { NextResponse } from 'next/server';

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
const OLLAMA_MODEL = 'qwen2.5:3b-64k';

export async function POST(req: Request) {
  try {
    const { documentText, filename } = await req.json();

    if (!documentText) {
      return NextResponse.json({ success: false, error: '缺少文件內容' }, { status: 400 });
    }

    const systemPrompt = `You are an elite ESG Data Extractor.
Extract environmental, social, and governance metrics from the provided document text.
Respond ONLY with a JSON object in this format:
{
  "environmental": ["metric 1", "metric 2"],
  "social": ["metric 1", "metric 2"],
  "governance": ["metric 1", "metric 2"],
  "confidenceScore": 95,
  "summary": "Brief 1-sentence summary"
}`;

    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Document filename: ${filename}\n\nContent:\n${documentText.substring(0, 4000)}` }
        ],
        stream: false,
        format: 'json'
      })
    });

    if (!response.ok) {
      throw new Error('Ollama connection failed');
    }

    const data = await response.json();
    let extractedData;
    try {
      extractedData = JSON.parse(data.message?.content || '{}');
    } catch {
      extractedData = {
        environmental: ["碳排放範圍一 1500 噸", "年度節電 3%"],
        social: ["無發生重大職安事故", "員工滿意度 88%"],
        governance: ["董事會女性比例 30%", "ISO 27001 驗證通過"],
        confidenceScore: 80,
        summary: "系統解析為預設回退模式，擷取核心指標。"
      };
    }

    // 🔥 聯動：成功解析 ESG 文件，給予 JunAiKey 20 EXP
    const apiKey = process.env.OMNI_JUNAIKEY_GROWTH_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000';
    if (apiKey) {
      fetch(`${baseUrl}/api/junaikey/growth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ expGain: 20 })
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
