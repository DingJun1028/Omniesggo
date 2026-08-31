// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  const sig = signatureHeader.startsWith('sha256=') ? signatureHeader.slice(7) : signatureHeader;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function requireWebhookAuth(req: NextRequest): Promise<NextResponse | null> {
  const signature = req.headers.get('X-Signature-256');
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !verifyWebhookSignature(await req.clone().text(), signature, secret)) {
    return NextResponse.json({ error: 'Invalid or missing webhook signature' }, { status: 401 });
  }
  return null;
}
