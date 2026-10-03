import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 100% Zero-Cost Local File-based Memory Store (Fallback since Supabase is unconfigured)
const MEMORY_FILE = path.join(process.cwd(), 'data', 'omni-memory.json');

// Ensure data directory exists
const ensureMemoryFile = () => {
  const dir = path.dirname(MEMORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({ contexts: {}, chats: [] }, null, 2));
  }
};

function checkAuth(req: Request): NextResponse | null {
  const memoryKey = process.env.MEMORY_API_KEY;
  if (memoryKey) {
    const headerKey = req.headers.get('x-memory-key');
    if (!headerKey || headerKey !== memoryKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Missing x-user-id header' }, { status: 401 });
    }
  }
  return null;
}

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
  const authErr = checkAuth(req);
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

export async function DELETE(req: Request) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  try {
    ensureMemoryFile();
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({ contexts: {}, chats: [] }, null, 2));
    return NextResponse.json({ success: true, message: 'Memory cleared' });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
