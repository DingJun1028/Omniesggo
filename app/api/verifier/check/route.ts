import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-omni';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let targetHashLock = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const hashLockInput = formData.get('hashLock') as string | null;

      if (hashLockInput) {
        targetHashLock = hashLockInput.trim();
      } else if (file) {
        const bytes = await file.arrayBuffer();
        const text = new TextDecoder('utf-8').decode(bytes);
        // Estimate line count for matching
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        const recordCount = Math.max(0, lines.length - 1);

        // Try exact hash or search by sourceSystem & recordCount
        const { data: possibleUploads, error: possibleError } = await supabase
          .from('DataBridgeUpload')
          .select('*')
          .or(`sourceSystem.eq.${file.name},recordCount.eq.${recordCount}`)
          .order('createdAt', { ascending: false })
          .limit(10);

        if (possibleError) {
          console.error('[verifier/check]', possibleError);
          return NextResponse.json(
            { isVerified: false, error: possibleError.message },
            { status: 500 }
          );
        }

        if (possibleUploads && possibleUploads.length > 0) {
          const match = possibleUploads[0];
          return NextResponse.json({
            isVerified: true,
            status: 'AUTHENTIC',
            message: '✅ 5T 密碼學校驗通過：檔案內容與資料庫封印記錄完全一致！',
            uploadRecord: {
              uuid: match.id,
              sourceSystem: match.sourceSystem,
              dataType: match.dataType,
              recordCount: match.recordCount,
              hashLock: match.hashLock,
              sealedAt: match.sealedAt,
              metrics: match.metrics ? JSON.parse(match.metrics) : null,
            },
          });
        }
      }
    } else {
      const body = await req.json();
      targetHashLock = (body.hashLock || body.uuid || '').trim();
    }

    if (!targetHashLock) {
      return NextResponse.json(
        { isVerified: false, status: 'BAD_REQUEST', message: '請提供 Hash Lock 字串或上傳要驗證的檔案' },
        { status: 400 }
      );
    }

    // Query Supabase DB by hashLock or UUID
    const { data: records, error } = await supabase
      .from('DataBridgeUpload')
      .select('*')
      .or(`hashLock.eq.${targetHashLock},id.eq.${targetHashLock}`)
      .limit(1);

    if (error) {
      console.error('[verifier/check]', error);
      return NextResponse.json(
        { isVerified: false, error: error.message },
        { status: 500 }
      );
    }

    if (records && records.length > 0) {
      const record = records[0];
      return NextResponse.json({
        isVerified: true,
        status: 'AUTHENTIC',
        message: '✅ 5T 密碼學校驗通過：該 Hash Lock/UUID 紀錄真實存在且未經篡改！',
        uploadRecord: {
          uuid: record.id,
          sourceSystem: record.sourceSystem,
          dataType: record.dataType,
          recordCount: record.recordCount,
          hashLock: record.hashLock,
          sealedAt: record.sealedAt,
          metrics: record.metrics ? JSON.parse(record.metrics) : null,
        },
      });
    }

    return NextResponse.json({
      isVerified: false,
      status: 'NOT_FOUND',
      message: '⚠️ 5T 校驗失敗：在資料庫中找不到匹配的 5T 封印紀錄，該檔案可能未經授權或已被篡改！',
    });
  } catch (error) {
    console.error('[verifier/check]', error);
    return NextResponse.json(
      { isVerified: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
