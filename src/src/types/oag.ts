// OAG: 代理安全網關契約 (整合先知預判與混沌自癒)
// ------------------------------------------------------------
// 此介面定義了 OAG（OmniAgent Gateway）在系統層面的安全防護與自癒機制。
// 主要功能包括：
//   1️⃣ 先知預判 – 基於已收集的 IBusEvent 與系統快照，預測可能的異常或攻擊。
//   2️⃣ 混沌自癒 – 在偵測到異常後自動執行修復流程，支援自訂回復腳本或擴容策略。
//   3️⃣ 安全 Hook – 允許在生命週期的特定階段註冊安全相關的 Hook，以便於
//      在事件流轉過程中加入額外的驗證或防護措施。
//
// 為保持與 OA、OAB、OAG 三層的統一，所有介面皆繼承自 IComponentCore，
// 並使用通用的 LifecycleStage 來描述安全流程的階段。

import { IComponentCore, LifecycleStage } from "./omni-agent";
import { IBusEvent } from "./bus-event";

/**
 * OAG（OmniAgent Gateway）安全網關抽象介面。
 *
 * - `predict(event)`：根據即時事件與歷史快照做出風險預測，返回任意結構化
 *   結果（如危險指數、建議行動等），可由外部模型或規則引擎實作。
 * - `selfHeal(issueId, context)`：針對指定的異常或安全事件自動執行修復流程，
 *   `context` 允許傳入額外資訊（如受影響服務、補救腳本路徑等）。
 * - `registerSecurityHook(stage, hook)`：在安全相關的生命週期階段註冊 Hook，
 *   例如在 `EMERGED` 階段檢查事件完整性、在 `FROZEN` 階段執行清理。
 */
export interface IOmniAgentGateway extends IComponentCore {
  /**
   * 先知預判 – 基於單筆 Bus 事件或事件集合返回風險評估結果。
   * @param event 要分析的 IBusEvent（或其子類型）
   * @returns 預測結果，結構自行定義（可為 { riskScore: number, actions: string[] }）
   */
  predict(event: IBusEvent): Promise<Record<string, unknown>>;

  /**
   * 先知預測與預先擷取 – 根據使用者意圖存根，預測相關事件並提前抓取相關 IBusEvent 集合。
   * @param userIntentStub 使用者意圖的簡短描述或關鍵字
   * @returns 可能相關的 IBusEvent 陣列，供後續處理使用
   */
  predictAndPreFetch(userIntentStub: string): Promise<Array<IBusEvent>>;

  /**
   * 混沌自癒 – 針對特定 issueId（安全事件 ID）執行自動修復。
   * @param issueId 需自癒的事件或問題唯一標識
   * @param context 可選的額外資訊，供修復腳本使用
   */
  selfHeal(issueId: string, context?: Record<string, unknown>): Promise<void>;

  /**
   * 在指定的安全生命週期階段註冊 Hook。
   * @param stage 目標階段（使用與 OA 相同的 LifecycleStage）
   * @param hook   Hook 函式，會收到當前事件與預測/修復結果
   */
  registerSecurityHook(
    stage: LifecycleStage,
    hook: (args: { event?: IBusEvent; prediction?: Record<string, unknown>; error?: Error }) => Promise<void> | void
  ): void;
  /**
   * 觸發 Hash Lock 與 Object.freeze()，將事件鎖定為不可變的安全物件。
   * @param event 要處理的 IBusEvent
   * @returns 任意回傳值，允許後續流程使用（如傳遞至其他模組）
   */
  /**
  * 觸發 Hash Lock 與 Object.freeze()，將事件鎖定為不可變的安全物件。
  * @param event 要處理的 IBusEvent
  * @returns 任意回傳值，允許後續流程使用（如傳遞至其他模組）
  */
  egress(event: IBusEvent): Promise<IBusEvent>;

  /**
   * 故意注入微小錯誤以測試自癒能力。
   * @param event 要注入錯誤的 IBusEvent
  +   * @returns 可能已被修改的 IBusEvent（用於測試自癒機制）
   */
  injectChaos(event: IBusEvent): IBusEvent;
  }
