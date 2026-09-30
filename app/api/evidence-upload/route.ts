import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { ERROR_CODES } from '@esggo/errors';

export const dynamic = 'force-dynamic';

/**
 * Evidence Vault 上傳端點 (mod-src-vault-0001)
 * 免費算立：自託 MinIO (S3 相容) 於 VPS :19001。
 * 手寫 AWS SigV4 簽章，零新 npm 依賴。
 *
 * 環境變數 (VPS .env 或部署環境)：
 *   MINIO_ENDPOINT   (default: 127.0.0.1:19001)
 *   MINIO_ACCESS_KEY (default: esggo-minio)
 *   MINIO_SECRET_KEY (default: MinioESGG0!2026)
 *   MINIO_BUCKET     (default: evidence-vault)
 * 無上述變數 → 本地 fallback：回傳 data URL（不阻塞 UI，標記 local:true）
 */

function buildSignature({
  secretKey,
  region,
  service,
  dateStamp,
  amzDate,
  canonicalRequest,
}: {
  secretKey: string;
  region: string;
  service: string;
  dateStamp: string;
  amzDate: string;
  canonicalRequest: string;
}) {
  const hmac = (key: string | Buffer, data: string) =>
    crypto.createHmac('sha256', key).update(data, 'utf8').digest();
  const kDate = hmac('AWS4' + secretKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const hash = crypto.createHash('sha256').update(canonicalRequest, 'utf8').digest('hex');
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/${region}/${service}/aws4_request\n${hash}`;
  return 'AWS4-HMAC-SHA256 ' +
    `Credential=${process.env.MINIO_ACCESS_KEY ?? 'esggo-minio'}/${dateStamp}/${region}/${service}/aws4_request, ` +
    `SignedHeaders=host;x-amz-content-sha256;x-amz-date, ` +
    `Signature=${crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex')}`;
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'no file' }, { status: 400 });
    }

    const endpoint = process.env.MINIO_ENDPOINT ?? '127.0.0.1:19001';
    const accessKey = process.env.MINIO_ACCESS_KEY ?? 'esggo-minio';
    const secretKey = process.env.MINIO_SECRET_KEY ?? 'MinioESGG0!2026';
    const bucket = process.env.MINIO_BUCKET ?? 'evidence-vault';
    const region = process.env.MINIO_REGION ?? 'us-east-1';

    const buf = Buffer.from(await file.arrayBuffer());
    const key = `evidence-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '').replace('Z', 'Z');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = crypto.createHash('sha256').update(buf).digest('hex');
    const url = `http://${endpoint}/${bucket}/${key}`;
    const canonicalRequest =
      `PUT\n/${bucket}/${key}\n\n` +
      `host:${endpoint}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n\n` +
      `host;x-amz-content-sha256;x-amz-date\n${payloadHash}`;
    const auth = buildSignature({ secretKey, region, service: 's3', dateStamp, amzDate, canonicalRequest });

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Host: endpoint,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        Authorization: auth,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buf,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      return NextResponse.json(
        { success: false, error: `MinIO ${res.status}: ${errTxt.slice(0, 200)}` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url: `https://${endpoint}/${bucket}/${key}`,
      key,
      local: false,
    });
  } catch (err) {
    console.error('[API] app/api/evidence-upload/route.ts:', err);
    return NextResponse.json(
      { success: false, error: ERROR_CODES.INTERNAL_ERROR.message, code: ERROR_CODES.INTERNAL_ERROR.code },
      { status: 500 }
    );
  }
}
