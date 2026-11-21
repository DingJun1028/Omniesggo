// Bus Event – 共享事件介面 (用於 OA 層直接處理 Bus 輸入)
// 依賴 IComponentCore 與 LifecycleStage 共同描述事件全貌。

import { IComponentCore } from "./omni-agent"; // 已在同目錄定義
import { LifecycleStage } from "./omni-agent";

/**
 * IBusEvent – 事件模型
 *  * uuid、version、timestamp、evidence、hash 等核心屬性來自 IComponentCore。
 *  * 額外欄位說明事件本身的語意與路徑資訊，支援全鏈路可追溯。
 */
export interface IBusEvent<T = unknown> extends IComponentCore {
  /** 事件名稱 (如 "user.signup", "data.update") */
  readonly eventName: string;
  /** 事件負載資料 */
  readonly payload: T;
  /** 事件所處的生命週期階段 */
  readonly stage: LifecycleStage;
  /** 事件來源標示 (OA、OAG、外部系統等) */
  readonly source_origin: string;
  /** 可選分類或主題 */
  readonly topic?: string;
  /** 事件在全局流程中的路徑（如 "EMERGED > ROUTING > VERIFIED"） */
  readonly lifecycle_path?: string;
  /** 任意備註 */
  readonly note?: string;
}
