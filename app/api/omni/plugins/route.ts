/**
 * GET /api/omni/plugins — list all registered plugins + health
 * POST /api/omni/plugins/:id/enable — enable a plugin
 * POST /api/omni/plugins/:id/disable — disable a plugin
 */

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { getPluginRegistry } from '@lib/omni-base/plugin-registry';

export const dynamic = 'force-dynamic';

// GET — list all plugins
export async function GET() {
  try {
    const registry = getPluginRegistry();
    const plugins = registry.list();
    const health = registry.getHealth();

    return jsonResponse({
      success: true,
      plugins,
      health,
      count: plugins.length,
    });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}

// POST — action on plugin (enable/disable)
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError('INVALID_PARAMS', 'Request body must be valid JSON', 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonError('INVALID_PARAMS', 'Request body must be a JSON object', 400);
  }

  const { action, pluginId } = body as { action?: unknown; pluginId?: unknown };
  if (typeof action !== 'string' || typeof pluginId !== 'string' || !action || !pluginId) {
    return jsonError('INVALID_PARAMS', 'action and pluginId are required strings', 400);
  }

  const registry = getPluginRegistry();
  if (!registry.get(pluginId)) {
    return jsonError('NOT_FOUND', 'Plugin not found', 404);
  }

  try {
    switch (action) {
      case 'enable':
        await registry.enable(pluginId);
        break;
      case 'disable':
        await registry.disable(pluginId);
        break;
      case 'reload':
        await registry.reload(pluginId);
        break;
      default:
        return jsonError('INVALID_ACTION', `Unknown action: ${action}`, 400);
    }

    return jsonResponse({
      plugin: registry.get(pluginId)?.manifest,
      lifecycle: registry.get(pluginId)?.lifecycle,
    });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}
