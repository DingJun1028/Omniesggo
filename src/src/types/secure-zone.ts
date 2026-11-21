// 核心禁區：鎖定數據並防止範改的具體執行常式
// Core Secure Zone – 對外發送與接收驗算 (Core Restricted Zone Protection)
// ------------------------------------------------------------
// 此介面定義在安全禁區（Core Restricted Zone）內的訊息傳遞與驗證流程。
// 所有對外通訊均必須經過驗算，以確保完整性、來源與防篡改。
// 介面遵循與 OA/OAG 相同的基礎型別 IComponentCore，並使用 IBusEvent 作為訊息載體。

import { IComponentCore } from "./omni-agent";
import { IBusEvent } from "./bus-event";

/** 驗算結果 */
export interface IVerificationResult extends IComponentCore {
  /** 是否驗證通過 */
  readonly verified: boolean;
  /** 失敗原因（若未驗證通過） */
  readonly reason?: string;
  /** 相關的雜湊或簽章值 */
  readonly hash: string;
  /** 其他任意資訊 */
  readonly meta?: Record<string, unknown>;
}

/**
 * 核心禁區防護介面 – 提供對外發送與接收的驗算機制。
 *
 * - `send(event)`：將 IBusEvent 發送至外部系統，返回驗算結果。
 * - `receive(event)`：接收外部系統回傳的 IBusEvent，執行驗證並返回結果。
 * - `verify(event)`：獨立驗證任意事件，供其他模組直接呼叫。
 */
export interface ISecureZoneGateway extends IComponentCore {
  /**
   * 對外發送事件，並在發送完成後返回驗算結果。
   * @param event 要傳送的 IBusEvent（含完整核心屬性）
   */
  send(event: IBusEvent): Promise<IVerificationResult>;

  /**
   * 接收外部回傳的事件，執行驗證並返回驗算結果。
   * @param event 收到的 IBusEvent
   */
  receive(event: IBusEvent): Promise<IVerificationResult>;

  /**
   * 直接驗證任意 IBusEvent，返回驗算結果。
   * 可在其他安全流程中重複使用。
   * @param event 要驗證的事件
   */
  verify(event: IBusEvent): Promise<IVerificationResult>;
}
