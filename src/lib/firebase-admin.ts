import adminDb from './local-store';
// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Firebase Admin 相容層 (本地模式) — GCP Firebase 已停用，改為本地資料層。
 *
 * 2026-08-25 重構: 移除 firebase-admin 依賴 (GCP 託管基礎設施移除, 力度 1)。
 * 保留與原 firebase-admin 相同的導出介面 (adminDb / getAdminApp / getAdminAuth)
 * 以最小化對既有 route 的改動。實際資料存取委託 src/lib/local-store.ts。
 *
 * 注意: getAdminAuth().verifyIdToken / getUser / setCustomUserClaims 等
 * Firebase Auth 專屬功能在本地模式下不可用 — 呼叫端 (claims route) 已改為
 * 優雅降級 (無憑證回 503)。本地認證請改用 middleware.ts 的 jose 實作。
 */



// 本地模式下不初始化任何 GCP 連線
let _app: { local: true } | null = null;

export function getAdminApp(): { local: true } {
  if (_app) return _app;
  _app = { local: true };
  return _app;
}

// 占位 auth 物件 — 本地模式不支援 Firebase Auth 功能
// 2026-08-25 力度 1: 方法接受可選參數以相容既有 call site, 但一律 throw (本地模式停用)
export const adminAuth = {
  async verifyIdToken(_token?: string, _force?: boolean): Promise<never> {
    throw new Error('[LocalMode] Firebase Auth 已停用; 請使用 jose 本地 JWT 驗證 (見 middleware.ts)');
  },
  async getUser(_uid?: string): Promise<never> {
    throw new Error('[LocalMode] Firebase Auth 已停用');
  },
  async setCustomUserClaims(_uid?: string, _claims?: Record<string, unknown>): Promise<never> {
    throw new Error('[LocalMode] Firebase Auth 已停用');
  },
};



// 相容舊 call site: getAuth(getAdminApp()) 形式
export function getAuth(_app: unknown): typeof adminAuth {
  return adminAuth;
}

export { adminDb };
