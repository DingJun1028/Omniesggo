/**
 * OmniAgentGateway - 零信任「雙向驗算」與動態 Hash 鎖實作
 * 作為前後端數據的真理共鳴器，實現神聖契約締結機制
 */

import { createHash } from 'crypto';
import type { FreeModel } from '../model-discovery/free-models';
import type { ModelConverterConfig } from '../model-discovery/model-converter';

// IComponentCore 核心介面 (來自 SKILL.md)
export interface IComponentCore {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
  };
}

// 零幻覺驗算結果
export interface ZeroVisionVerification {
  isValid: boolean;
  hashLock: string;
  timestamp: number;
  complianceTags: string[];
  verificationTrail: Array<{ step: string; result: any }>;
}

// 神聖契約締結結果
export interface SacredContract {
  contractId: string;
  lockedObject: IComponentCore;
  verification: ZeroVisionVerification;
  unlockCallback?: () => void;
}

export class OmniAgentGateway {
  private contractRegistry: Map<string, SacredContract> = new Map();
  private uiCallbackRegistry: Map<string, () => void> = new Map();

  // ISO-14064-1 等合規驗證規則
  private readonly COMPLIANCE_RULES = {
    'ISO-14064-1': {
      requiredFields: ['emission_factor', 'activity_data', 'uncertainty'],
      validator: (data: any) => this.validateISO14064(data)
    },
    'GRI': {
      requiredFields: ['material_topic', 'boundary', 'assurance'],
      validator: (data: any) => this.validateGRI(data)
    }
  };

  /**
   * 零幻覺驗算 - 核心驗證邏輯
   * 驗證數據內容、計算公式、合規標準
   */
  async zeroVisionVerify(
    data: IComponentCore,
    complianceType?: keyof typeof COMPLIANCE_RULES
  ): Promise<ZeroVisionVerification> {
    const trail: Array<{ step: string; result: any }> = [];
    
    // 步驟1: 資料完整性驗證
    const integrityCheck = this.validateEvidenceIntegrity(data.evidence);
    trail.push({ step: 'integrity', result: integrityCheck });

    // 步驟2: Hash Lock 產生
    const hashLock = this.generateHashLock(data);
    trail.push({ step: 'hash_lock', result: hashLock });

    // 步驟3: 合規驗證 (如需要)
    const complianceTags: string[] = [];
    if (complianceType && this.COMPLIANCE_RULES[complianceType]) {
      const rule = this.COMPLIANCE_RULES[complianceType];
      const complianceResult = rule.validator(data.evidence);
      if (complianceResult.valid) {
        complianceTags.push(complianceType);
      }
      trail.push({ step: 'compliance', result: complianceResult });
    }

    return {
      isValid: integrityCheck.valid && (complianceTags.length > 0 || !complianceType),
      hashLock,
      timestamp: Date.now(),
      complianceTags,
      verificationTrail: trail
    };
  }

  /**
   * 生成 Hash Lock - 數據不可篡改識別
   */
  private generateHashLock(data: IComponentCore): string {
    return createHash('sha256')
      .update(JSON.stringify({ ...data, timestamp: undefined }))
      .digest('hex');
  }

  /**
   * 驗證證據完整性
   */
  private validateEvidenceIntegrity(evidence: Record<string, any>): { valid: boolean; issues?: string[] } {
    const issues: string[] = [];
    
    // 檢查必要欄位是否存在
    if (!evidence || typeof evidence !== 'object') {
      issues.push('Evidence data is missing or invalid');
      return { valid: false, issues };
    }

    // 檢查循環參考
    if (JSON.stringify(evidence).includes('__circular__')) {
      issues.push('Circular reference detected in evidence');
    }

    // 檢查過大數據 (超過 1MB)
    const size = Buffer.byteLength(JSON.stringify(evidence));
    if (size > 1024 * 1024) {
      issues.push('Evidence data exceeds 1MB limit');
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * ISO-14064-1 驗證
   */
  private validateISO14064(data: any): { valid: boolean; missingFields?: string[] } {
    const required = ['emission_factor', 'activity_data', 'uncertainty'];
    const missing = required.filter(f => !(f in data));
    return {
      valid: missing.length === 0,
      missingFields: missing.length > 0 ? missing : undefined
    };
  }

  /**
   * GRI 驗證
   */
  private validateGRI(data: any): { valid: boolean; missingFields?: string[] } {
    const required = ['material_topic', 'boundary', 'assurance'];
    const missing = required.filter(f => !(f in data));
    return {
      valid: missing.length === 0,
      missingFields: missing.length > 0 ? missing : undefined
    };
  }

  /**
   * 神聖契約締結 - 結合 OA 前端 UI 回饋
   */
  async sealSacredContract(
    data: IComponentCore,
    options: {
      complianceType?: keyof typeof COMPLIANCE_RULES;
      uiFeedback?: boolean;
      emitUnlockEvent?: boolean;
    } = {}
  ): Promise<SacredContract> {
    // 執行零幻覺驗算
    const verification = await this.zeroVisionVerify(
      data,
      options.complianceType
    );

    const contractId = `contract_${Date.now()}_${data.uuid}`;
    
    // 鎖定對象 (不可變)
    const lockedData = Object.freeze({ ...data });

    const contract: SacredContract = {
      contractId,
      lockedObject: lockedData,
      verification,
      unlockCallback: options.emitUnlockEvent 
        ? () => this.emitUnlockEvent(contractId, verification) 
        : undefined
    };

    // 註冊契約
    this.contractRegistry.set(contractId, contract);

    // 觸發 UI 回饋 (如有)
    if (options.uiFeedback) {
      await this.triggerUIFeedback(contractId, verification);
    }

    return contract;
  }

  /**
   * 觸發 UI 動態回饋
   */
  private async triggerUIFeedback(
    contractId: string,
    verification: ZeroVisionVerification
  ): Promise<void> {
    // 發送事件給前端 UI
    // 前端應監聽此事件並呈現「液態玻璃」效果與倒數計時
    
    const feedbackEvent = {
      type: 'OAG_CONTRACT_FEEDBACK',
      contractId,
      status: verification.isValid ? 'locksuccess': 'lockfailed',
      hashLock: verification.hashLock,
      complianceTags: verification.complianceTags
    };

    // 透過 WebSocket 或其他管道發送 (示例)
    console.log('[OAG] UI Feedback Event:', feedbackEvent);
    
    // 若整合到 Next.js，可透過 EventEmitter 或 IPC
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('oag-feedback', { detail: feedbackEvent }));
    }
  }

  /**
   * 觸發解鎖事件
   */
  private emitUnlockEvent(contractId: string, verification: ZeroVisionVerification): void {
    const unlockEvent = {
      type: 'OAG_CONTRACT_UNLOCK',
      contractId,
      hashLock: verification.hashLock
    };

    console.log('[OAG] Unlock Event:', unlockEvent);

    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('oag-unlock', { detail: unlockEvent }));
    }
  }

  /**
   * 取得已締結的契約
   */
  getContract(contractId: string): SacredContract | undefined {
    return this.contractRegistry.get(contractId);
  }

  /**
   * 驗證契約有效性
   */
  verifyContract(contractId: string): boolean {
    const contract = this.contractRegistry.get(contractId);
    return contract?.verification.isValid ?? false;
  }

  /**
   * 跨網域安全轉發 - 整合至模型路由
   */
  async secureForwardToModel(
    model: FreeModel,
    prompt: string,
    taskType: string
  ): Promise<any> {
    // 1. 建立證據資料
    const evidence: Record<string, any> = {
      model: model.id,
      promptLength: prompt.length,
      taskType,
      invokedBy: this._getCurrentCaller()
    };

    const requestData: IComponentCore = {
      uuid: `req_${Date.now()}`,
      version: '1.0.0',
      timestamp: Date.now(),
      evidence
    };

    // 2. 執行神聖契約
    const contract = await this.sealSacredContract(requestData, {
      complianceType: 'ISO-14064-1',
      uiFeedback: true
    });

    // 3. 若驗算通過，轉發至模型
    if (contract.verification.isValid) {
      return this._dispatchToModel(model, prompt);
    }

    throw new Error('Contract verification failed - cannot dispatch to model');
  }

  private async _dispatchToModel(model: FreeModel, prompt: string): Promise<any> {
    // 內部模型調用邏輯
    // 這裡應整合實際的模型調用 (OpenRouter, Groq 等)
    console.log(`[OAG] Dispatching to model: ${model.id}`);
    return { content: 'mock_response', model: model.id };
  }

  private _getCurrentCaller(): string {
    // 取得呼叫者資訊 (堆疊追蹤)
    return new Error().stack?.split('\n')[3] || 'unknown';
  }
}

// 單例實例
export const OAG = new OmniAgentGateway();