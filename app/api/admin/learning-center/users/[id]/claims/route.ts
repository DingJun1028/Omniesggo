// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Admin Learning-Center User Claims API — 本地模式 (GCP Firebase 已停用, 力度 1, 2026-08-25)
 *
 * GCP Firebase Auth custom claims (verifyIdToken / setCustomUserClaims) 已移除。
 * 本地模式: 此管理功能依賴 GCP 身分系統, 故回傳 503 明確標註停用, 避免半殘或誤導。
 * 若需啟用, 應接本地 RBAC (見 src/lib/local-rbac.ts) 並設定 LOCAL_JWT_SECRET。
 */

import { NextResponse } from 'next/server';

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

const DISABLED_MESSAGE =
  'GCP Firebase Auth 已停用 (力度 1)。User claims 管理功能需本地 RBAC 重建，目前未啟用。';

export async function GET() {
  return jsonError(DISABLED_MESSAGE, 503);
}

export async function PUT() {
  return jsonError(DISABLED_MESSAGE, 503);
}
