import { NextRequest, NextResponse } from 'next/server';
import { importErrorResponse } from './_lib/import-response';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string;

    if (!file && type !== 'history') {
      return NextResponse.json({ error: '請上傳檔案' }, { status: 400 });
    }

    // Simulate import processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const imported = Math.floor(Math.random() * 50) + 10;
    const skipped = Math.floor(Math.random() * 5);
    
    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: [],
      memories: Array.from({ length: imported }, (_, i) => ({
        id: `imported-${Date.now()}-${i}`,
        content: `匯入的記憶項目 ${i + 1}`,
        layer: ['L1', 'L2'][i % 2],
        tags: ['匯入', type],
      })),
    });
  } catch (error) {
    return importErrorResponse('伺服器錯誤：', error);
  }},
      { status: 500 }
    );
  }
}
