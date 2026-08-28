/**
 * POST /api/zenrows/fetch
 * Body: { url: string, output?: 'markdown'|'html'|'text'|'json', js_render?: boolean }
 * Requires X-Signature-256 webhook auth when WEBHOOK_SECRET is set.
 */
import { NextRequest, NextResponse } from 'next/server';
import { zenrowsFetch, verifyZenrowsWebhookSignature } from '@/lib/zenrows-client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('X-Signature-256');
    const secret = process.env.WEBHOOK_SECRET;
    if (secret && !verifyZenrowsWebhookSignature(await request.clone().text(), signature, secret)) {
      return NextResponse.json({ error: 'Invalid or missing webhook signature' }, { status: 401 });
    }

    const body = (await request.json()) as { url?: string; output?: string; js_render?: boolean };
    if (!body?.url) {
      return NextResponse.json({ error: 'MISSING_URL' }, { status: 400 });
    }

    const text = await zenrowsFetch({
      url: body.url,
      output: (body.output as any) || 'markdown',
      js_render: Boolean(body.js_render),
    });

    return NextResponse.json({ url: body.url, output: text.slice(0, 2000) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'UNKNOWN' }, { status: 500 });
  }
}
