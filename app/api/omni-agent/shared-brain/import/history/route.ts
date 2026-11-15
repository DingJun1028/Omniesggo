import { NextResponse } from 'next/server';
import { importErrorResponse } from '../../_lib/import-response';

export async function POST() {
  try {
    // Simulate importing from conversation history
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const imported = 23;
    const skipped = 2;

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: [],
      memories: [
        {
          id: 'hist-1',
          content: '重構 ESG-GO 根平台 UI/UX/RWD，採用行銷與應用分離架構',
          layer: 'L2',
          tags: ['專案', 'UI/UX', '重構'],
        },
        {
          id: 'hist-2',
          content: '建立萬能代理專區，實現第二共享大腦與跨代理記憶整合',
          layer: 'L2',
          tags: ['代理', '記憶系統', '整合'],
        },
        {
          id: 'hist-3',
          content: '連接 Hermes、Jules 等代理至統一管理中心',
          layer: 'L1',
          tags: ['代理管理', 'Hermes', 'Jules'],
        },
      ],
    });
  } catch (error) {
    return importErrorResponse('匯入失敗：', error);
  }
}
