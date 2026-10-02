import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { jsonError, jsonErrorInternal } from '@lib/api-utils';
import { verifyWebhookSignature } from '@/lib/webhook-auth';

// 100% Zero-Cost Local File-based Memory Store (Fallback since Supabase is unconfigured)
const MEMORY_FILE = path.join(process.cwd(), 'data', 'omni-memory.json');

/**
 * 寫入/刪除守門：memory 為對內共享總線，GET 保留開放供內部讀取；
 * POST/DELETE 需 MEMORY_API_KEY（HMAC 簽章或等值金鑰）或內部使用者上下文 (x-user-id)。
 * 對齊倉庫令牌式慣例（omni/sync 的 GATEWAY_API_KEY、cron 的 CRON_SECRET）。
 * 5T Trustworthy — 金鑰比對採 timingSafeEqual，避免時序側通道。
 */
function assertMemoryWriteAuth(req: Request): NextResponse | null {
  const secret = process.env.MEMORY_API_KEY;
  const provided =
    req.headers.get('x-memory-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (secret) {
    if (!provided) return jsonError('UNAUTHORIZED', 'Invalid or missing memory key', 401);
    const payload = `${req.method}:${req.url}`;
    if (verifyWebhookSignature(payload, provided, secret)) return null;
    const given = Buffer.from(provided);
    const expected = Buffer.from(secret);
    if (given.length === expected.length && crypto.timingSafeEqual(given, expected)) return null;
    return jsonError('UNAUTHORIZED', 'Invalid or missing memory key', 401);
  }

  if (!req.headers.get('x-user-id')) {
    return jsonError('UNAUTHORIZED', 'Authentication required', 401);
  }
  return null;
}

// Ensure data directory exists
const ensureMemoryFile = () => {
  const dir = path.dirname(MEMORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({ contexts: {}, chats: [] }, null, 2));
  }
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'default-user';
    
    ensureMemoryFile();
    const db = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    const context = db.contexts[userId] || {};
    
    return NextResponse.json({
      success: true,
      context
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authErr = assertMemoryWriteAuth(req);
  if (authErr) return authErr;

  try {
    const body = await req.json();
    const { userId = 'default-user', agentId = 'omni-core', content, role = 'user' } = body;

    ensureMemoryFile();
    const db = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    
    // Save chat interaction to local memory
    const memoryId = `mem_${Date.now()}`;
    db.chats.push({
      id: memoryId,
      userId,
      agentId,
      role,
      content,
      createdAt: new Date().toISOString()
    });

    fs.writeFileSync(MEMORY_FILE, JSON.stringify(db, null, 2));

    return NextResponse.json({ success: true, memoryId });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// DELETE /api/memory?id=mem_xxx — 移除單筆記憶（需認證）
export async function DELETE(req: Request) {
  const authErr = assertMemoryWriteAuth(req);
  if (authErr) return authErr;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return jsonError('INVALID_PARAMS', '缺少必要參數: id', 400);

    ensureMemoryFile();
    const db = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    const before = db.chats.length;
    db.chats = db.chats.filter((chat: { id: string }) => chat.id !== id);
    if (db.chats.length === before) {
      return NextResponse.json({ success: false, error: `找不到記憶: ${id}` }, { status: 404 });
    }

    fs.writeFileSync(MEMORY_FILE, JSON.stringify(db, null, 2));

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    return jsonErrorInternal(error);
  }
}
