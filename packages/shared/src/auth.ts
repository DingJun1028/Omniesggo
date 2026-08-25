// ═══════════════════════════════════════════════════════════════
// @esggo/shared/auth — Unified Authentication Module (本地模式)
// 2026-08-25 重構: GCP Firebase 已停用 (力度 1), 移除 firebase-admin 依賴。
// Token 驗證改用 jose (與 src/middleware.ts 一致), 本地 JWT 不依賴 GCP x509。
// ═══════════════════════════════════════════════════════════════

import { getConfig } from './config';
import { adminDb as localAdminDb } from '../../../src/lib/local-store';

// ── Types ──────────────────────────────────────────────────────

export interface AuthUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface AuthToken {
  uid: string;
  email?: string;
  firebaseToken: string;
}

// ── Local Mode (no GCP) ────────────────────────────────────────

let adminApp: { local: true } | null = null;
let adminAuth: unknown = null;
let adminDb: unknown = localAdminDb;

/**
 * Get Admin App (lazy singleton). Local mode — no GCP connection.
 */
export async function getAdminApp(): Promise<{ local: true }> {
  if (adminApp) return adminApp;
  adminApp = { local: true };
  return adminApp;
}

/**
 * Get Auth instance. Local mode — Firebase Auth 功能不可用。
 */
export async function getAdminAuth(): Promise<unknown> {
  await getAdminApp();
  return adminAuth;
}

/**
 * Get Firestore-compatible store (本地 JSON 資料層).
 */
export async function getAdminDb(): Promise<unknown> {
  await getAdminApp();
  return adminDb;
}

// ── Token Verification (jose, 本地模式) ────────────────────────

/**
 * Verify a JWT token locally (no GCP dependency).
 * Uses HS256 with LOCAL_JWT_SECRET if set, otherwise rejects (no GCP x509).
 * Returns the decoded payload or null if invalid.
 */
export async function verifyToken(
  idToken: string
): Promise<{ uid: string; email?: string } | null> {
  const secret = process.env.LOCAL_JWT_SECRET;
  if (!secret) {
    // 本地模式未配置 JWT 金鑰: 不依賴 GCP, 直接回 null (與 middleware jose 降級一致)
    return null;
  }
  try {
    const { jwtVerify, importHmacKey } = await import('jose');
    const key = await importHmacKey(secret, 'HS256');
    const { payload } = await jwtVerify(idToken, key, {
      algorithms: ['HS256'],
    });
    return {
      uid: String(payload.sub ?? payload.uid ?? ''),
      email: payload.email as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Verify token from Authorization header.
 * Returns user info or null.
 */
export async function verifyAuthHeader(
  authHeader: string | null
): Promise<{ uid: string; email?: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  return verifyToken(token);
}

// ── Firestore Helpers ──────────────────────────────────────────

export interface FirestoreDoc {
  id: string;
  [key: string]: unknown;
}

/**
 * Get a document from Firestore.
 */
export async function getFirestoreDoc(
  collection: string,
  docId: string
): Promise<FirestoreDoc | null> {
  const db = await getAdminDb() as {
    collection: (name: string) => {
      doc: (id: string) => {
        get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> }>;
      };
    };
  };
  const doc = await db.collection(collection).doc(docId).get();
  if (!doc.exists) return null;
  return { id: docId, ...doc.data() };
}

/**
 * Set a document in Firestore.
 */
export async function setFirestoreDoc(
  collection: string,
  docId: string,
  data: Record<string, unknown>
): Promise<void> {
  const db = await getAdminDb() as {
    collection: (name: string) => {
      doc: (id: string) => {
        set: (data: Record<string, unknown>) => Promise<void>;
      };
    };
  };
  await db.collection(collection).doc(docId).set(data, { merge: true });
}

/**
 * Query Firestore collection.
 */
export async function queryFirestore(
  collection: string,
  field: string,
  operator: string,
  value: unknown
): Promise<FirestoreDoc[]> {
  const db = await getAdminDb() as {
    collection: (name: string) => {
      where: (field: string, op: string, value: unknown) => {
        get: () => Promise<{
          docs: Array<{ id: string; data: () => Record<string, unknown> }>;
        }>;
      };
    };
  };
  const snapshot = await db.collection(collection)
    .where(field, operator, value)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// ── Health Check ───────────────────────────────────────────────

/**
 * Check if local auth store is available (本地模式, 無 GCP).
 */
export function checkAuthHealth(): {
  configured: boolean;
  mode: 'local';
} {
  const config = getConfig();
  return {
    configured: true,
    mode: 'local',
  };
}
