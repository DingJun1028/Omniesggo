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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get('room') || 'AKKADU-LIVE-DEMO';

  const items = roomStreams.get(room) || [
    {
      id: 'akkadu-sub-001',
      room,
      speaker: 'Akkadu Live Interpreter',
      originalText: 'Welcome to ESG GO 2026 Global Sustainability Summit.',
      translatedText: '歡迎來到 ESG GO 2026 全球永續峰會。',
      srcLang: 'en',
      targetLang: 'zh-Hant',
      timestamp: Date.now() - 5000,
      hashLock: crypto.createHash('sha256').update(`akkadu-sub-001-${Date.now()}`).digest('hex'),
    },
    {
      id: 'akkadu-sub-002',
      room,
      speaker: 'Akkadu Live Interpreter',
      originalText: 'Today we present the 5T Protocol & AI-powered real-time subtitle translation.',
      translatedText: '今天我們將展示 5T 協議與 AI 驅動的即時字幕翻譯技術。',
      srcLang: 'en',
      targetLang: 'zh-Hant',
      timestamp: Date.now() - 2000,
      hashLock: crypto.createHash('sha256').update(`akkadu-sub-002-${Date.now()}`).digest('hex'),
    },
  ];

  return jsonResponse({
    success: true,
    data: {
      room,
      status: 'STREAMING',
      itemCount: items.length,
      subtitles: items,
    },
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
    const { room = 'AKKADU-LIVE-DEMO', speaker = 'Akkadu Stream', originalText, translatedText, srcLang = 'zh-Hant', targetLang = 'en' } = body;

    if (!originalText && !translatedText) {
      return jsonError('INVALID_INPUT', 'Missing subtitle text');
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

    return jsonResponse({
      success: true,
      data: newItem,
      metadata: {
        hashLock,
        timestamp,
        fiveTSeal: '5T: source_origin=akkadu-live-bridge',
      },
    });
  } catch (err: unknown) {
    return jsonError('INTERNAL_ERROR', err instanceof Error ? err.message : String(err));
  }
}
