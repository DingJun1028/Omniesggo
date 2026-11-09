// GET /api/tags/omni-tag — 列出萬能標籤
// 5T Traceable — Prisma 全面禁用 → Supabase。
// 原 prisma.universalTag.findMany 改為 supabase.from('omni_tags').select(...)
// 萬能標籤服務已收合進 @/core/tags/omni-tag-service。
import { NextRequest } from 'next/server';
import { jsonResponse } from '@lib/api-utils';
import { supabase } from '@/lib/supabase-omni';
import { syncEsgTags, getEntityTags } from '@/core/tags/omni-tag-service';

export async function GET(_request: NextRequest) {
  // 查 omni_tags 取得所有萬能標籤
  const { data: tags, error: tagsErr } = await supabase
    .from('omni_tags')
    .select('id, label, kind, metadata')
    .eq('kind', 'esg')
    .limit(100);

  if (tagsErr) {
    return jsonResponse({ ok: false, error: tagsErr.message }, 500);
  }

  return jsonResponse({ ok: true, tags: tags ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const action = body.action;

  if (action === 'syncEsgTags') {
    const result = await syncEsgTags();
    return jsonResponse(result);
  }

  if (action === 'getEntityTags') {
    const { entityType, entityId } = body;
    if (!entityType || !entityId) {
      return jsonResponse({ ok: false, error: 'entityType and entityId required' }, 400);
    }
    const tags = await getEntityTags(entityType, entityId);
    return jsonResponse({ ok: true, tags });
  }

  return jsonResponse({ ok: false, error: 'invalid action' }, 400);
}
