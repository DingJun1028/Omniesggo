/**
 * @esggo/ssas v0.1.0
 *
 * 第 0 層：萬能意圖心核 (Intent Core)
 * 職責：
 *  - 感應用戶核心目標、業務意圖與痛點
 *  - 作為系統校準的唯一北極星
 *
 * 5T 對應:
 * - Traceable: 每筆輸入必須標記 source_origin
 * - Trackable: 每次校準變更寫入生命週期日誌
 * - Tangible: 輸出 Intent Core entity，可被驗證
 * - Transparent: 推理路徑與依據可查
 * - Trustworthy: 寫入後 Hash Lock + Object.freeze()
 */

import { randomUUID, createHash } from 'node:crypto';
import type { IComponentCore, sealComponentCore } from '@esggo/omni-core';
import type {
  IntentCore,
  RawIntent,
  NormalizedGoal,
  BusinessIntent,
  PainPoint,
  FiveTStatus,
  FiveTResult,
  layerEvent,
} from '../schema/ssas-schema.js';
import { writeFiveTPassed, createAuditEntry, lifecycleTracker } from '../5t-governance/ssas-5t.js';

// ============================================================================
// 1. 意圖抽取器（L0 核心）
// ============================================================================

/**
 * 意圖抽取器 — 從多模態輸入中提取意圖
 * 這是 L0 的核心；可擴展為 Groq Qwen 引擎支援
 */
export class IntentExtractor {
  /**
   * 提取用戶意圖
   * @param raw - 原始用戶輸入
   * @param context - 上下文（可選）
   * @returns 規範化意圖核心
   */
  async extract(
    raw: RawIntent,
    context: Record<string, unknown> = {}
  ): Promise<IntentCore> {
    // 1. 校驗輸入
    const validation = this.validateRawIntent(raw);
    if (validation.status !== 'PASS') {
      throw new Error(`IntentExtractor 驗證失敗 (${validation.status}): ${validation.message}`);
    }

    // 2. 提取意圖（可擴展為 LLM 引擎）
    const derived = this.deriveIntent(raw, context);

    // 3. 建立 IComponentCore 骨架
    const core = this.createComponentCore(raw, {
      source_origin: raw.source_origin,
    });

    // 4. 準入 5T 驗證 + 寫入（Hold 5T gate）
    const result = await writeFiveTPassed<IntentCore>(
      {
        ...core,
        layer: 'L0' as const,
        rawIntent: raw,
        normalizedGoal: derived.normalizedGoal,
        businessIntent: derived.businessIntent,
        painPoints: derived.painPoints,
        confidence: derived.confidence,
        context,
      } as IntentCore,
      'L0',
      raw.source_origin,
      ['user-input', 'cli', 'api', 'scheduler']
    );

    // 5. 做完：寫入生命週期事件
    layerEvent('L0', 'STORE', `intent-${core.uuid}`, {
      rawTextLength: raw.text.length,
      goalType: derived.normalizedGoal.goalType,
      confidence: derived.confidence,
      validationPassed: result.result.overall,
    });

    return result.locked as IntentCore;
  }

  /**
   * 校驗原始意圖輸入
   */
  private validateRawIntent(raw: RawIntent): { status: FiveTStatus; message: string } {
    if (!raw.text || raw.text.trim().length === 0) {
      return { status: 'FAIL', message: 'raw.text 不能為空' };
    }
    if (!raw.source_origin || typeof raw.source_origin !== 'string') {
      return { status: 'FAIL', message: 'raw.source_origin 不能為空' };
    }
    if (!raw.timestamp || typeof raw.timestamp !== 'number') {
      return { status: 'FAIL', message: 'raw.timestamp 必須存在' };
    }
    return { status: 'PASS', message: '原始意圖輸入驗證通過' };
  }

  /**
   * 從原始輸入衍生出規範化意圖
   * 簡化版：可擴展為 Groq Qwen 引擎或 NL2Intent 模型
   */
  private deriveIntent(raw: RawIntent, context: Record<string, unknown>): {
    normalizedGoal: NormalizedGoal;
    businessIntent: BusinessIntent;
    painPoints: PainPoint[];
    confidence: number;
  } {
    const text = raw.text.toLowerCase();
    const now = Date.now();

    // 依據關鍵詞分類目標類型
    let goalType: NormalizedGoal['goalType'] = 'other';
    if (/\b(找|查|查詢|查一下|找找|搜|搜尋)\b/.test(text)) {
      goalType = 'get_info';
    } else if (/\b(修|改|修復|解決|搞定|修理)\b/.test(text)) {
      goalType = 'solve_problem';
    } else if (/\b(做|寫|生|製作|創|產生|產出)\b/.test(text)) {
      goalType = 'create_content';
    } else if (/\b(算|評分|計算|評估|評)\b/.test(text)) {
      goalType = 'analyze';
    } else if (/\b(自動|自動化|自動跑|自動執行)\b/.test(text)) {
      goalType = 'automate';
    }

    // 建立規範化目標
    const normalizedGoal: NormalizedGoal = {
      goalType,
      objective: raw.text.trim(),
      successCriteria: [
        `response_time < ${context.expectedResponseTime || 5000}ms`,
        `accuracy >= ${context.minAccuracy || 0.85}`,
      ],
      priority: this.detectPriority(text),
    };

    // 業務意圖（簡化，預設值）
    const businessIntent: BusinessIntent = {
      department: (context.department as string) || 'general',
      domain: (context.domain as string) || 'general',
      requestedBy: (context.requestedBy as string) || 'unknown',
      requestId: raw.source_origin || `req-${randomUUID()}`,
      slaHours: (context.slaHours as number) || 24,
    };

    // 痛點（簡化，從文本推斷）
    const painPoints: PainPoint[] = this.extractPainPoints(text, context);

    // 置信度（可擴展為模型輸出）
    const confidence = Math.min(
      0.95,
      0.6 + (text.length / 1000) * 0.2 + (raw.modality === 'voice' ? 0.1 : 0)
    );

    return {
      normalizedGoal,
      businessIntent,
      painPoints,
      confidence,
    };
  }

  /**
   * 從文本推斷痛點
   */
  private extractPainPoints(text: string, context: Record<string, unknown>): PainPoint[] {
    const painPoints: PainPoint[] = [];
    const lower = text.toLowerCase();

    if (/\b(慢|卡|bug|問題|錯誤|失敗)\b/.test(lower)) {
      painPoints.push({
        description: '系統運行存在效能瓶頸',
        impact: 'high',
        frequency: 'regular',
        severity: 0.7,
      });
    }

    if (/\b(難|複雜|混淆|不清楚)\b/.test(lower)) {
      painPoints.push({
        description: '需求理解存在複雜度',
        impact: 'moderate',
        frequency: 'occasional',
        severity: 0.5,
      });
    }

    if (painPoints.length === 0) {
      painPoints.push({
        description: '用戶對系統進行初始使用，需建立基線',
        impact: 'moderate',
        frequency: 'occasional',
        severity: 0.3,
      });
    }

    return painPoints;
  }

  /**
   * 依據文本推斷優先級
   */
  private detectPriority(text: string): NormalizedGoal['priority'] {
    const lower = text.toLowerCase();
    if (/\b(緊急|critically|緊急|急迫)\b/.test(lower) || /\bcritical\b/.test(lower)) {
      return 'critical';
    }
    if (/\b(重要|important|急|迫)\b/.test(lower) || /\bhigh\b/.test(lower)) {
      return 'high';
    }
    return 'normal';
  }

  /**
   * 建立 IComponentCore 骨架
   */
  private createComponentCore(
    raw: RawIntent,
    options?: { source_origin?: string; uuid?: string; version?: string; timestamp?: number }
  ): IComponentCore {
    return {
      uuid: options?.uuid ?? randomUUID(),
      version: options?.version ?? '0.1.0',
      timestamp: options?.timestamp ?? raw.timestamp ?? Date.now(),
      source_origin: options?.source_origin ?? raw.source_origin,
      evidence: [],
    };
  }

  /**
   * 圈定（校準）意圖核心 — 所有下游層根據此意圖校準
   */
  circleOfConfusion(intentId: string, newContext: Record<string, unknown>): void {
    layerEvent('L0', 'CIRCLE', intentId, {
      newContext,
      timestamp: Date.now(),
    });
  }

  /**
   * 獲取意圖校準歷史
   */
  getHistory(intentId: string): Array<{ target: string; detail: Record<string, unknown> }> {
    return [
      { target: `intent-${intentId}`, detail: { action: 'INITIALIZE', at: Date.now() } },
    ];
  }
}

// ============================================================================
// 2. 預設單例
// ============================================================================

/**
 * 預設意圖抽取器單例
 */
export const intentExtractor = new IntentExtractor();
