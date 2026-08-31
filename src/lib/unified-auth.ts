// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Unified Authentication Middleware - 無作妙德統一認證系統
 * 
 * 提供多策略認證機制，消除認證障礙
 * 支持 Firebase ID Token、API Key、內部服務認證
 */

import { NextRequest } from 'next/server';
import { getAdminApp } from './firebase-admin';
import { getAuth } from './firebase-admin';
import { adminDb } from './firebase-admin';
import { jsonError } from './api-utils';
import type { ErrorCodeKey } from '@esggo/errors';

// ── 認證策略類型 ─────────────────────────────────────────────────────

export type AuthStrategy = 'firebase' | 'api-key' | 'internal' | 'public';

export interface AuthConfig {
  strategies: AuthStrategy[];
  requiredLevel: 'public' | 'user' | 'admin' | 'system';
  resourceAccess?: string[];
  allowServiceAccount?: boolean;
}

export interface AuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  role?: 'user' | 'admin' | 'system';
  strategy?: AuthStrategy;
  error?: string;
}

// ── 認證配置 ───────────────────────────────────────────────────────

const DEFAULT_AUTH_CONFIG: AuthConfig = {
  strategies: ['firebase', 'api-key', 'internal'],
  requiredLevel: 'user',
  allowServiceAccount: true
};

// ── 認證類別 ───────────────────────────────────────────────────────

export class UnifiedAuth {
  
  /**
   * 統一認證入口
   */
  static async authenticate(
    request: NextRequest,
    config: AuthConfig = DEFAULT_AUTH_CONFIG
  ): Promise<AuthResult> {
    // 公開訪問
    if (config.requiredLevel === 'public' && config.strategies.includes('public')) {
      return { success: true, strategy: 'public' };
    }

    // 嘗試各種認證策略
    for (const strategy of config.strategies) {
      if (strategy === 'public') continue;
      
      const result = await this.tryStrategy(request, strategy, config);
      if (result.success) {
        return result;
      }
    }

    // 所有策略都失敗
    return {
      success: false,
      error: 'Authentication failed'
    };
  }

  /**
   * 嘗試單一認證策略
   */
  private static async tryStrategy(
    request: NextRequest,
    strategy: AuthStrategy,
    config: AuthConfig
  ): Promise<AuthResult> {
    switch (strategy) {
      case 'firebase':
        return this.authenticateFirebase(request, config);
      case 'api-key':
        return this.authenticateApiKey(request, config);
      case 'internal':
        return this.authenticateInternal(request, config);
      default:
        return { success: false, error: `Unknown strategy: ${strategy}` };
    }
  }

  /**
   * Firebase ID Token 認證
   */
  private static async authenticateFirebase(
    request: NextRequest,
    config: AuthConfig
  ): Promise<AuthResult> {
    // 2026-08-25 力度 1: GCP Firebase Auth 已停用 (本地模式)。
    // verifyIdToken 在本地模式下會 throw; 直接降級回傳失敗, 改用 jose 本地 JWT (見 middleware.ts)。
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '');
      if (!token) {
        return { success: false, error: 'Missing Bearer token' };
      }
      return { success: false, error: 'Firebase authentication disabled (local mode)' };
    } catch {
      return { success: false, error: 'Firebase authentication failed' };
    }
  }

  /**
   * API Key 認證
   */
  private static async authenticateApiKey(
    request: NextRequest,
    config: AuthConfig
  ): Promise<AuthResult> {
    try {
      const apiKey = request.headers.get('x-api-key') || 
                     request.headers.get('authorization')?.replace('Bearer ', '');
      
      if (!apiKey) {
        return { success: false, error: 'Missing API key' };
      }

      // 驗證 API Key
      const validKey = process.env.GATEWAY_API_KEY || process.env.OMNI_KEY;
      if (apiKey !== validKey) {
        return { success: false, error: 'Invalid API key' };
      }

      return {
        success: true,
        role: 'system',
        strategy: 'api-key'
      };
    } catch (error) {
      return { success: false, error: 'API key authentication failed' };
    }
  }

  /**
   * 內部服務認證
   */
  private static async authenticateInternal(
    request: NextRequest,
    config: AuthConfig
  ): Promise<AuthResult> {
    try {
      const internalToken = request.headers.get('x-omni-token') || 
                          request.headers.get('x-internal-token');
      
      if (!internalToken) {
        return { success: false, error: 'Missing internal token' };
      }

      // 驗證內部令牌
      const validToken = process.env.OMNI_KEY || process.env.GATEWAY_API_KEY;
      if (internalToken !== validToken) {
        return { success: false, error: 'Invalid internal token' };
      }

      return {
        success: true,
        role: 'system',
        strategy: 'internal'
      };
    } catch (error) {
      return { success: false, error: 'Internal authentication failed' };
    }
  }

  /**
   * 檢查管理員角色
   */
  private static async checkAdminRole(userId: string): Promise<boolean> {
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      
      if (!userDoc.exists) return false;
      
      const userData = userDoc.data() as Record<string, unknown> | null;
      const role = userData?.role;
      const permissions = Array.isArray(userData?.permissions) ? (userData!.permissions as unknown[]) : [];
      return role === 'admin' || permissions.includes('admin');
    } catch {
      return false;
    }
  }

  /**
   * 創建認證中間件包裝器
   */
  static withAuth<T>(
    handler: (request: NextRequest, auth: AuthResult) => Promise<T>,
    config?: AuthConfig
  ) {
    return async (request: NextRequest): Promise<T> => {
      const authResult = await this.authenticate(request, config);
      
      if (!authResult.success) {
        return jsonError('UNAUTHORIZED', authResult.error || 'Unauthorized', 401) as T;
      }

      return handler(request, authResult);
    };
  }

  /**
   * 資源訪問檢查
   */
  static checkResourceAccess(
    auth: AuthResult,
    resource: string,
    config: AuthConfig
  ): boolean {
    if (auth.role === 'admin' || auth.role === 'system') {
      return true;
    }

    if (Array.isArray(config.resourceAccess) && config.resourceAccess.includes(resource)) {
      return true;
    }

    return false;
  }
}

// ── 預定義認證配置 ─────────────────────────────────────────────────

export const AUTH_CONFIGS = {
  // 公開訪問
  public: {
    strategies: ['public'],
    requiredLevel: 'public' as const
  },
  
  // 用戶訪問
  user: {
    strategies: ['firebase', 'api-key'],
    requiredLevel: 'user' as const
  },
  
  // 管理員訪問
  admin: {
    strategies: ['firebase', 'api-key'],
    requiredLevel: 'admin' as const
  },
  
  // 系統服務
  system: {
    strategies: ['internal', 'api-key'],
    requiredLevel: 'system' as const
  },
  
  // 內部 API
  internal: {
    strategies: ['internal'],
    requiredLevel: 'system' as const
  }
};

// ── 輔助函數 ─────────────────────────────────────────────────────

/**
 * 從請求中提取認證信息
 */
export function extractAuthInfo(request: NextRequest): {
  hasBearer: boolean;
  hasApiKey: boolean;
  hasInternalToken: boolean;
  hasOmniToken: boolean;
} {
  return {
    hasBearer: request.headers.get('authorization')?.startsWith('Bearer ') || false,
    hasApiKey: !!request.headers.get('x-api-key'),
    hasInternalToken: !!request.headers.get('x-internal-token'),
    hasOmniToken: !!request.headers.get('x-omni-token')
  };
}

/**
 * 認證錯誤響應
 */
export function authErrorResponse(errorKey: ErrorCodeKey = 'UNAUTHORIZED', message?: string) {
  return jsonError(errorKey, message || 'Authentication required', 401);
}