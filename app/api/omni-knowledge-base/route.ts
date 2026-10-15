// ═══════════════════════════════════════════════════════════════
// /api/omni-knowledge-base — 萬能知識庫 API
//
// 5T 對應:
// - Traceable: source_origin 標記知識庫來源
// - Trackable: 生命週期事件可查詢
// - Tangible: REST API 可查詢
// - Transparent: 回應包含完整證據鏈
// - Trustworthy: 封存後不可篡改
// ═══════════════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';
import {
  knowledgeBaseRegistry,
  createKnowledgeBase,
  createKnowledgeSource,
  createDeploymentTarget,
  type KnowledgeStorage,
  type KnowledgeTargetType,
} from '@/lib/omni-core/index';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ── GET /api/omni-knowledge-base ─────────────────────────────
// 列出所有知識庫 + 系統指標
export async function GET() {
  try {
    const bases = knowledgeBaseRegistry.getAll();
    const metrics = knowledgeBaseRegistry.getMetrics();
    const lifecycle = knowledgeBaseRegistry.getLifecycle();

    return jsonResponse({
      bases,
      metrics,
      lifecycleCount: lifecycle.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[KB-API] GET error:', error);
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}

// ── POST /api/omni-knowledge-base ────────────────────────────
// 註冊新知識庫（可同時加入來源與部署目標）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, source_origin, version, sources, targets } = body;

    // 驗證必要參數
    if (!name || typeof name !== 'string') {
      return jsonError('INVALID_PARAMS', '缺少必要參數: name (string)', 400);
    }
    if (!description || typeof description !== 'string') {
      return jsonError('INVALID_PARAMS', '缺少必要參數: description (string)', 400);
    }
    if (!source_origin || typeof source_origin !== 'string') {
      return jsonError('INVALID_PARAMS', '缺少必要參數: source_origin (string)', 400);
    }

    // 建立知識庫
    const kb = createKnowledgeBase(name, description, source_origin, version);
    knowledgeBaseRegistry.register(kb);

    // 加入來源（可選）
    const addedSources: string[] = [];
    if (Array.isArray(sources)) {
      for (const src of sources) {
        if (!src.name || !src.storage || !src.path || !src.source_origin) {
          return jsonError('INVALID_PARAMS', `來源缺少必要欄位: name/storage/path/source_origin`, 400);
        }
        const validStorages: KnowledgeStorage[] = ['obsidian', 'filesystem', 'tencentdb', 'gbrain'];
        if (!validStorages.includes(src.storage)) {
          return jsonError('INVALID_PARAMS', `無效的 storage: ${src.storage}`, 400);
        }
        const source = createKnowledgeSource(
          src.name,
          src.storage as KnowledgeStorage,
          src.path,
          src.source_origin,
          src.version,
        );
        knowledgeBaseRegistry.addSource(kb.uuid, source);
        addedSources.push(source.uuid);
      }
    }

    // 加入部署目標（可選）
    const addedTargets: string[] = [];
    if (Array.isArray(targets)) {
      for (const tgt of targets) {
        if (!tgt.type || !tgt.path) {
          return jsonError('INVALID_PARAMS', `部署目標缺少必要欄位: type/path`, 400);
        }
        const validTypes: KnowledgeTargetType[] = ['obsidian', 'filesystem', 'filesystem-git', 'tencentdb'];
        if (!validTypes.includes(tgt.type)) {
          return jsonError('INVALID_PARAMS', `無效的 target type: ${tgt.type}`, 400);
        }
        const target = createDeploymentTarget(tgt.type as KnowledgeTargetType, tgt.path);
        knowledgeBaseRegistry.addTarget(kb.uuid, target);
        addedTargets.push(target.uuid);
      }
    }

    const registry = knowledgeBaseRegistry.getRegistry(kb.uuid);

    return jsonResponse({
      uuid: kb.uuid,
      name: kb.name,
      status: 'active',
      sourceCount: addedSources.length,
      targetCount: addedTargets.length,
      registry,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('[KB-API] POST error:', error);
    return jsonErrorInternal(error, 'INTERNAL_ERROR', 500);
  }
}
