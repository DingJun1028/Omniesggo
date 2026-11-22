import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, agentId, mode } = await request.json();

    await new Promise(resolve => setTimeout(resolve, 1500));

    let response = '';

    if (mode === 'code') {
      response = `我可以幫你編寫程式碼。根據你的需求：${message}

這是一個範例解決方案：\n\n\`\`\`typescript\n// 萬能代理生成的程式碼\nfunction example() {\n  console.log("Hello from OmniAgent");\n  return true;\n}\n\`\`\`\n

需要我調整什麼嗎？`;
    } else if (mode === 'custom') {
      response = `已切換至自定義模式。我會根據你的需求調整回覆風格和行為。\n\n關於「${message}」：我可以完全自定義回覆內容、格式和邏輯。請告訴我具體的自定義需求。`;
    } else {
      response = `我理解你的需求：「${message}」\n\n作為萬能代理，我具備以下能力：\n- **編碼**：撰寫、修改、重構程式碼\n- **介面修改**：調整 UI/UX、元件、樣式\n- **功能實現**：新增功能、整合 API\n- **自定義回覆**：根據需求調整回應方式\n- **全能執行**：完成各種開發任務\n\n請具體說明你想要我做什麼，我會立即開始執行。`;
    }

    return NextResponse.json({
      response,
      type: 'text' as const,
      agentId,
      mode,
    });
  } catch (error) {
    return NextResponse.json(
      { error: '聊天失敗：' + (error as Error).message },
      { status: 500 }
    );
  }
}
