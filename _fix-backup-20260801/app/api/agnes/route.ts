import { agnesApi } from '@/lib/agnes-api';
import { jsonResponse, jsonError, jsonErrorInternal } from '@lib/api-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, context } = body;

    if (!input) {
      return jsonError('INVALID_PARAMS', '缺少必要參數: input');
    }

    const result = await agnesApi.processRequest(input, context);

    return jsonResponse(result);
  } catch (error) {
    console.error('[AGNES_API] Error processing request:', error);
    return jsonErrorInternal(error);
  }
}

export async function GET() {
  try {
    const metrics = await agnesApi.getMetrics();
    return jsonResponse(metrics);
  } catch (error) {
    return jsonErrorInternal(error);
  }
}
