// ============================================================
// 標籤 API - GET (列表) / POST (建立)
// ============================================================

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError, validateParams } from '@lib/api-utils';
import { getNCBClient } from '@/lib/ncb-client';
// Tags route

// GET /api/ai-notes/tags - 取得標籤列表
export async function GET() {
  try {
    const ncb = getNCBClient();
    const tags = await ncb.getTags();

    return jsonResponse(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to fetch tags', 500);
  }
}

// POST /api/ai-notes/tags - 建立新標籤
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    // 驗證必要欄位
    const validation = validateParams({ name });

    if (!validation.valid) {
      return jsonError('INVALID_PARAMS', validation.missing ? `Missing required field: ${validation.missing}` : 'Invalid params', 400);
    }

    const ncb = getNCBClient();

    // 檢查標籤是否已存在
    const existingTags = await ncb.getTags();
    const existingTag = existingTags.find(t => t.name === name);

    if (existingTag) {
      return jsonError('INVALID_PARAMS', 'Tag already exists', 409);
    }

    // 建立新標籤
    const tag = await ncb.createTag({
      name,
      color: color || '#3B82F6',
    });

    return jsonResponse(tag, 201);
  } catch (error) {
    console.error('Error creating tag:', error);
    return jsonError('INTERNAL_ERROR', 'Failed to create tag', 500);
  }
}
