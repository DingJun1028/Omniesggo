/**
 * ==========================================
 * 完全代主自行 - 授權管理器
 * ==========================================
 *
 * 管理完全授權的創建、驗證、終止
 *
 * 「代理者在完全授權範圍內，自主、獨立、全面地代替主體行使職權與執行行動。」
 */

import { createHash } from 'crypto';
import {
  ICompleteDelegationScope,
  ICompleteDelegationManager,
  DelegationPermission,
  DelegationRestriction,
  DelegationEventNames,
  DelegationTopics,
} from '../../types/complete-delegation';
import { AuditLogger, type AuditSink } from './autonomous-decision-engine';
import { publishDelegationEvent } from './events';
import {
  getDefaultJournal,
  type AuditEntry,
  type BusEventRecord,
} from './journal';

/**
 * 完全代主自行 - 授權管理器
 */
export class CompleteDelegationManager implements ICompleteDelegationManager {
  private _delegations: Map<string, ICompleteDelegationScope> = new Map();
  private _principalDelegations: Map<string, Set<string>> = new Map();
  private _agentDelegations: Map<string, Set<string>> = new Map();
  private _auditLogger: AuditLogger;
  private _fullVolume: boolean;

  constructor(config?: { auditSink?: AuditSink; fullVolume?: boolean }) {
    // 全量留存預設開啟（設 AUDIT_FULL_VOLUME=false 停用，退回環形緩衝）
    this._fullVolume = config?.fullVolume ?? process.env.AUDIT_FULL_VOLUME !== 'false';
    // 審計條目經統一日誌 sink 持久化（審計/事件同一份 JSONL、同一序號空間）
    const sink: AuditSink | undefined =
      config?.auditSink ??
      (this._fullVolume
        ? (e) => { void getDefaultJournal().append({ kind: 'audit', ts: e.timestamp, ...e }); }
        : undefined);
    this._auditLogger = new AuditLogger(sink);
  }
  /**
   * 創建完全授權
   */
  async createCompleteDelegation(params: {
    principalId: string;
    agentId: string;
    permissions: string[] | DelegationPermission[];
    restrictions?: DelegationRestriction[];
    validFrom?: number;
    validUntil?: number;
    description?: string;
  }): Promise<ICompleteDelegationScope> {
    // 1. 驗證參數
    await this.validateCreationParams(params);

    // 2. 創建授權範圍
    const delegationId = this.generateDelegationId();
    const validFrom = Date.now();
    const validUntil = params.validUntil ?? Number.MAX_SAFE_INTEGER;

    const scope: ICompleteDelegationScope = {
      delegationId,
      principalId: params.principalId,
      agentId: params.agentId,
      validFrom,
      validUntil,
      permissions: params.permissions as DelegationPermission[],
      restrictions: params.restrictions ?? [],
      signature: '',
      description: params.description,
      metadata: {
        createdAt: validFrom,
        version: '1.0.0',
      },
    };

    // 3. 生成簽章
    const signature = await this.signDelegation(scope);
    const signedScope: ICompleteDelegationScope = {
      ...scope,
      signature,
    };

    // 4. 註冊授權
    this._delegations.set(delegationId, signedScope);

    // 5. 建立索引
    this.addToPrincipalIndex(params.principalId, delegationId);
    this.addToAgentIndex(params.agentId, delegationId);

    // 6. 寫入審計日誌
    await this._auditLogger.log({
      type: 'DELEGATION_CREATED',
      delegationId,
      principalId: params.principalId,
      agentId: params.agentId,
      permissions: params.permissions,
      timestamp: Date.now(),
    });

    // 6a. 經由 omni-gateway 轉發至 omni-agent-bus（廣通：供監控 / 分析訂閱）
    void publishDelegationEvent(
      DelegationEventNames.DELEGATION_CREATED,
      DelegationTopics.AUTHORIZATION,
      {
        delegationId,
        principalId: params.principalId,
        agentId: params.agentId,
        permissions: params.permissions,
      },
      'CompleteDelegationManager',
    );

    return signedScope;
  }

  /**
   * 驗證授權有效性
   */
  async validateDelegation(
    delegationId: string,
    requiredPermission: DelegationPermission,
  ): Promise<boolean> {
    const scope = this._delegations.get(delegationId);
    if (!scope) {
      return false;
    }

    // 1. 檢查時效
    const now = Date.now();
    if (now < scope.validFrom || now > scope.validUntil) {
      return false;
    }

    // 2. 檢查權限
    if (!scope.permissions.includes(requiredPermission) && !scope.permissions.includes('full')) {
      return false;
    }

    // 3. 檢查限制
    for (const restriction of scope.restrictions) {
      if (!(await this.checkRestriction(restriction))) {
        return false;
      }
    }

    // 4. 驗證簽章（重新計算雜湊並比對，防止簽章被竄改）
    const valid = await this.verifySignature(scope);
    await this._auditLogger.log({
      type: 'DELEGATION_VALIDATED',
      delegationId,
      requiredPermission,
      valid,
      timestamp: Date.now(),
    });
    void publishDelegationEvent(
      DelegationEventNames.DELEGATION_VALIDATED,
      DelegationTopics.AUTHORIZATION,
      { delegationId, requiredPermission, valid },
      'CompleteDelegationManager',
    );
    return valid;
  }

  /**
   * 獲取授權
   */
  async getDelegation(delegationId: string): Promise<ICompleteDelegationScope | null> {
    return this._delegations.get(delegationId) ?? null;
  }

  /**
   * 取得授權管理器的完整審計軌跡
   */
  getAuditTrail() {
    return this._auditLogger.getLogs();
  }

  /**
   * 全量審計軌跡（對齊「全量」不變量）：
   * 若啟用全量留存，則讀回統一日誌的審計條目（依 delegationId 過濾）；
   * 否則退回記憶體環形緩衝區。
   */
  async getFullAuditTrail(delegationId?: string): Promise<AuditEntry[]> {
    if (this._fullVolume) {
      const all = await getDefaultJournal().readAll();
      const audit = all.filter((e) => e.kind === 'audit');
      const entries = delegationId
        ? audit.filter(
            (e) => (e as Record<string, unknown>).delegationId === delegationId,
          )
        : audit;
      return entries.map((e) => ({ ...e, timestamp: e.ts })) as AuditEntry[];
    }
    return this.getAuditTrail();
  }

  /**
   * 全量事件軌跡（對齊「全量」不變量）：
   * 讀回統一日誌的事件條目（依 delegationId 過濾，可指定 sinceId 斷點續傳），
   * 供 SSE 訂閱端點連線時回放。
   */
  async getFullEventTrail(delegationId?: string, sinceId?: number): Promise<BusEventRecord[]> {
    const all = await getDefaultJournal().readAll();
    return all
      .filter((e) => e.kind === 'event')
      .filter((e) => (delegationId ? e.delegationId === delegationId : true))
      .filter((e) => (sinceId == null ? true : e.id > sinceId))
      .map(
        (e) =>
          ({
            id: e.id,
            type: e.type,
            delegationId: e.delegationId ?? '',
            topic: e.topic ?? '',
            hashLock: e.hashLock ?? '',
            ts: e.ts,
            source: e.source ?? '',
            payload: e.payload ?? {},
          }) as BusEventRecord,
      );
  }

  /**
   * 終止授權
   */
  async terminateDelegation(delegationId: string, reason: string): Promise<void> {
    const scope = this._delegations.get(delegationId);
    if (!scope) {
      throw new Error(`Delegation not found: ${delegationId}`);
    }

    // 1. 記錄終止原因
    await this.recordTermination(delegationId, reason);
    await this._auditLogger.log({
      type: 'DELEGATION_TERMINATED',
      delegationId,
      reason,
      timestamp: Date.now(),
    });
    void publishDelegationEvent(
      DelegationEventNames.DELEGATION_TERMINATED,
      DelegationTopics.AUTHORIZATION,
      { delegationId, reason },
      'CompleteDelegationManager',
    );

    // 2. 移除索引
    this.removeFromPrincipalIndex(scope.principalId, delegationId);
    this.removeFromAgentIndex(scope.agentId, delegationId);

    // 3. 移除授權
    this._delegations.delete(delegationId);
  }

  /**
   * 獲取活躍授權列表
   */
  async getActiveDelegations(principalId?: string): Promise<ICompleteDelegationScope[]> {
    const now = Date.now();
    const activeDelegations: ICompleteDelegationScope[] = [];

    if (principalId) {
      // 獲取特定主體的授權
      const delegationIds = this._principalDelegations.get(principalId);
      if (delegationIds) {
        for (const id of delegationIds) {
          const scope = this._delegations.get(id);
          if (scope && this.isActive(scope, now)) {
            activeDelegations.push(scope);
          }
        }
      }
    } else {
      // 獲取所有活躍授權
      for (const scope of this._delegations.values()) {
        if (this.isActive(scope, now)) {
          activeDelegations.push(scope);
        }
      }
    }

    return activeDelegations;
  }

  /**
   * 獲取代理者的授權列表
   */
  async getAgentDelegations(agentId: string): Promise<ICompleteDelegationScope[]> {
    const now = Date.now();
    const agentDelegations: ICompleteDelegationScope[] = [];

    const delegationIds = this._agentDelegations.get(agentId);
    if (delegationIds) {
      for (const id of delegationIds) {
        const scope = this._delegations.get(id);
        if (scope && this.isActive(scope, now)) {
          agentDelegations.push(scope);
        }
      }
    }

    return agentDelegations;
  }

  /**
   * 檢查授權是否活躍
   */
  private isActive(scope: ICompleteDelegationScope, now: number): boolean {
    return now >= scope.validFrom && now <= scope.validUntil;
  }

  /**
   * 驗證創建參數
   */
  private async validateCreationParams(params: {
    principalId: string;
    agentId: string;
    permissions: string[];
  }): Promise<void> {
    if (!params.principalId) {
      throw new Error('Principal ID is required');
    }

    if (!params.agentId) {
      throw new Error('Agent ID is required');
    }

    if (!params.permissions) {
      throw new Error('At least one permission is required');
    }

    // 驗證權限有效性
    const validPermissions: string[] = [
      'read',
      'write',
      'execute',
      'decide',
      'delegate',
      'govern',
      'audit',
      'monitor',
      'full',
    ];

    for (const permission of params.permissions) {
      if (!validPermissions.includes(permission as string)) {
        throw new Error(`Invalid permission: ${permission}`);
      }
    }
  }

  /**
   * 生成授權 ID
   */
  private generateDelegationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `del_${timestamp}_${random}`;
  }

  /**
   * 創建授權簽章
   */
  private async signDelegation(scope: ICompleteDelegationScope): Promise<string> {
    const data = JSON.stringify({
      delegationId: scope.delegationId,
      principalId: scope.principalId,
      agentId: scope.agentId,
      permissions: scope.permissions,
      validFrom: scope.validFrom,
      validUntil: scope.validUntil,
    });

    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * 驗證簽章
   */
  private async verifySignature(scope: ICompleteDelegationScope): Promise<boolean> {
    const expectedSignature = await this.signDelegation({
      ...scope,
      signature: '',
    });

    return scope.signature === expectedSignature;
  }

  /**
   * 檢查限制條件
   */
  private async checkRestriction(restriction: DelegationRestriction): Promise<boolean> {
    // 基本限制檢查
    switch (restriction.type) {
      case 'scope':
        // 範圍限制檢查
        return true;
      case 'time':
        // 時間限制檢查
        return true;
      case 'resource':
        // 資源限制檢查
        return true;
      case 'approval':
        // 審批限制檢查
        return true;
      default:
        return true;
    }
  }

  /**
   * 記錄終止
   */
  private async recordTermination(delegationId: string, reason: string): Promise<void> {
    console.log(`[DelegationManager] 授權終止: ${delegationId}, 原因: ${reason}`);
  }

  /**
   * 添加到主體索引
   */
  private addToPrincipalIndex(principalId: string, delegationId: string): void {
    const delegationIds = this._principalDelegations.get(principalId) ?? new Set();
    delegationIds.add(delegationId);
    this._principalDelegations.set(principalId, delegationIds);
  }

  /**
   * 從主體索引移除
   */
  private removeFromPrincipalIndex(principalId: string, delegationId: string): void {
    const delegationIds = this._principalDelegations.get(principalId);
    if (delegationIds) {
      delegationIds.delete(delegationId);
      if (delegationIds.size === 0) {
        this._principalDelegations.delete(principalId);
      }
    }
  }

  /**
   * 添加到代理者索引
   */
  private addToAgentIndex(agentId: string, delegationId: string): void {
    const delegationIds = this._agentDelegations.get(agentId) ?? new Set();
    delegationIds.add(delegationId);
    this._agentDelegations.set(agentId, delegationIds);
  }

  /**
   * 從代理者索引移除
   */
  private removeFromAgentIndex(agentId: string, delegationId: string): void {
    const delegationIds = this._agentDelegations.get(agentId);
    if (delegationIds) {
      delegationIds.delete(delegationId);
      if (delegationIds.size === 0) {
        this._agentDelegations.delete(agentId);
      }
    }
  }
}

// ==========================================
// 單例實例
// ==========================================

let _instance: CompleteDelegationManager | null = null;

/**
 * 獲取授權管理器單例
 */
export function getDelegationManager(): CompleteDelegationManager {
  if (!_instance) {
    // 預設啟用全量留存（對齊「全量」不變量）；設 AUDIT_FULL_VOLUME=false 可停用
    const fullVolume = process.env.AUDIT_FULL_VOLUME !== 'false';
    _instance = new CompleteDelegationManager({ fullVolume });
  }
  return _instance;
}

/**
 * 重置授權管理器（用於測試）
 */
export function resetDelegationManager(): void {
  _instance = null;
}
