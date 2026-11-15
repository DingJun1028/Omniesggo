import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    const { name, type, endpoint, apiKey } = config;

    if (!name || !endpoint || !apiKey) {
      return NextResponse.json({ success: false, error: '請填寫完整的 API 設定' }, { status: 400 });
    }

    // Simulate API connection test
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production, would test connection to the agent API
    return NextResponse.json({
      success: true,
      agent: {
        id: `${type}-${Date.now()}`,
        name,
        type,
        endpoint,
        status: 'online',
        capabilities: type === 'hermes' ? ['自動巡檢', '自癒修復', '排程任務'] : 
                       type === 'jules' ? ['程式開發', '代碼審查'] : 
                       ['自定義能力'],
        connectedAt: new Date().toISOString(),
      },
      message: '代理連接成功並已匯入至萬能代理專區',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '連接失敗：' + (error as Error).message },
      { status: 500 }
    );
  }
}
