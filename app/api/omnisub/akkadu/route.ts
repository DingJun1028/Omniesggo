import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { jsonResponse, jsonError } from '@/lib/api-utils';

interface AkkaduSubtitleItem {
  id: string;
  room: string;
  speaker: string;
  originalText: string;
  translatedText: string;
  srcLang: string;
  targetLang: string;
  timestamp: number;
  hashLock: string;
}

// In-memory buffer for active room subtitle streams (max 100 items per room)
const roomStreams = new Map<string, AkkaduSubtitleItem[]>();

function cleanRoomCode(raw: string): string {
  if (!raw) return 'AKKADU-LIVE-DEMO';
  let val = raw.trim();
  if (val.includes('akkadu') && val.includes('/live/')) {
    const parts = val.split('/live/');
    if (parts[1]) {
      val = parts[1].split('?')[0].split('#')[0];
    }
  }
  return val.toUpperCase();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawRoom = searchParams.get('room') || 'AKKADU-LIVE-DEMO';
  const room = cleanRoomCode(rawRoom);

  const items = roomStreams.get(room) || [
    {
      id: 'akkadu-sub-001',
      room,
      speaker: 'Akkadu AI 雙語對翻員',
      originalText: 'Welcome to ESG GO 2026 Global Sustainability Summit. Akkadu live subtitle stream active.',
      translatedText: '歡迎來到 ESG GO 2026 全球永續峰會。Akkadu 即時字幕轉播牆已成功啟動連線。',
      srcLang: 'en',
      targetLang: 'zh-Hant',
      timestamp: Date.now() - 10000,
      hashLock: crypto.createHash('sha256').update(`akkadu-sub-001-${Date.now()}`).digest('hex'),
    },
    {
      id: 'akkadu-sub-002',
      room,
      speaker: 'JunAiKey 靈魂編排器',
      originalText: 'OmniCore 5T Protocol cryptographic seal verified: 101/101 TRUSTED.',
      translatedText: 'OmniCore 5T 協議密碼學刻印驗證通過：101/101 誠信可信度。',
      srcLang: 'en',
      targetLang: 'zh-Hant',
      timestamp: Date.now() - 5000,
      hashLock: crypto.createHash('sha256').update(`akkadu-sub-002-${Date.now()}`).digest('hex'),
    },
    {
      id: 'akkadu-sub-003',
      room,
      speaker: 'Akkadu 即時語音',
      originalText: 'Real-time subtitle broadcasting is online. Type below or speak into mic to push live streams.',
      translatedText: '即時字幕轉播牆持續連線中。您可在下方推播即時字幕，或切換至單機 STT 模式開啟麥克風。',
      srcLang: 'en',
      targetLang: 'zh-Hant',
      timestamp: Date.now() - 1000,
      hashLock: crypto.createHash('sha256').update(`akkadu-sub-003-${Date.now()}`).digest('hex'),
    },
  ];

  if (!roomStreams.has(room)) {
    roomStreams.set(room, items);
  }

  return jsonResponse({
    room,
    status: 'STREAMING',
    itemCount: items.length,
    subtitles: items,
    metadata: {
      provider: 'Akkadu-OmniSub-Bridge',
      sourceOrigin: 'app/api/omnisub/akkadu/route.ts',
      timestamp: Date.now(),
      fiveTSeal: '5T: source_origin=akkadu-live-bridge',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { room: rawRoom = 'AKKADU-LIVE-DEMO', speaker = 'Akkadu Stream', originalText, translatedText, srcLang = 'zh-Hant', targetLang = 'en' } = body;
    const room = cleanRoomCode(rawRoom);

    if (!originalText && !translatedText) {
      return jsonError('INVALID_PARAMS', 'Missing subtitle text');
    }

    const id = `akkadu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = Date.now();
    const hashLock = crypto
      .createHash('sha256')
      .update(`${id}:${room}:${originalText}:${translatedText}:${timestamp}`)
      .digest('hex');

    const newItem: AkkaduSubtitleItem = {
      id,
      room,
      speaker,
      originalText: originalText || '',
      translatedText: translatedText || '',
      srcLang,
      targetLang,
      timestamp,
      hashLock,
    };

    const existing = roomStreams.get(room) || [];
    const updated = [...existing, newItem].slice(-100);
    roomStreams.set(room, updated);

    return jsonResponse(newItem);
  } catch (err: unknown) {
    return jsonError('INTERNAL_ERROR', err instanceof Error ? err.message : String(err));
  }
}
