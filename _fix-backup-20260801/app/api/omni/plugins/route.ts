/**
 * GET /api/omni/plugins — list all registered plugins + health
 * POST /api/omni/plugins/:id/enable — enable a plugin
 * POST /api/omni/plugins/:id/disable — disable a plugin
 */

import { NextRequest } from 'next/server';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { getPluginRegistry } from '@/lib/omni-base/plugin-registry';

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
  try {
    const { action, pluginId } = await req.json();
    if (!action || !pluginId) {
      return jsonError('INVALID_PARAMS', 'action and pluginId required', 400);
    }

    const registry = getPluginRegistry();

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
      success: true,
      plugin: registry.get(pluginId)?.manifest,
      lifecycle: registry.get(pluginId)?.lifecycle,
    });
  } catch (error: unknown) {
    console.error('[api] INTERNAL_ERROR:', error);
    return jsonError('INTERNAL_ERROR');
  }
}
