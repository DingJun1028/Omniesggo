import { NextResponse } from 'next/server';

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat';
const OLLAMA_MODEL = 'qwen2.5:3b-64k';

export async function POST(req: Request) {
  try {
    const { url, title, content } = await req.json();

    if (!content) {
      return NextResponse.json({ success: false, error: 'Content is required for analysis' }, { status: 400 });
    }

    const systemPrompt = `You are Sonnar, an advanced ESG Threat Intelligence and Greenwashing Detection AI.
You will be given the extracted text from a corporate ESG report, news article, or press release.
Your task is to analyze the text and identify potential "Greenwashing" (漂綠) risks, regulatory non-compliance, and inconsistencies.
Provide a concise, structured JSON response with the following keys:
- "riskLevel": String ("Low", "Medium", "High", "Critical")
- "summary": String (Brief summary of the findings in Traditional Chinese)
- "redFlags": Array of Strings (Specific questionable claims or missing data, in Traditional Chinese)
- "confidence": Number (0-100)`;

    const userPrompt = `URL: ${url}\nTitle: ${title}\nContent:\n${content}\n\nPlease analyze this document for ESG risks.`;

    // 呼叫本地 100% 免費 Ollama 算力
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
        format: 'json' // 要求 JSON 輸出
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    let analysisResult;
    try {
      analysisResult = JSON.parse(data.message?.content || '{}');
    } catch (e) {
      // 容錯處理
      analysisResult = {
        riskLevel: 'Unknown',
        summary: '無法解析 AI 回應',
        redFlags: [],
        confidence: 0
      };
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message,
      // 備援結果 (當 Ollama 沒開時)
      fallback: {
        riskLevel: 'Medium',
        summary: '本地分析服務無法連線，啟用降級評估。',
        redFlags: ['需要進一步的人工審查', '無法驗證範圍三溫室氣體數據'],
        confidence: 50
      }
    });
  }
}
