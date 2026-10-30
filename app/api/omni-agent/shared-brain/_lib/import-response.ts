import { NextResponse } from 'next/server';

/**
 * shared-brain 匯入路由共用之錯誤回應（PR #114 品質閘去重）。
 */
export function importErrorResponse(prefix: string, error: unknown) {
  return NextResponse.json(
    {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [prefix + (error as Error).message],
      memories: [],
    },
    { status: 500 }
  );
}
