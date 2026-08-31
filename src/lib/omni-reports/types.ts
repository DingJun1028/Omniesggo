// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * OMNI ESG Reports Center — 萬能元件心核 (IComponentCore)
 * 對齊《OMNI ESG 萬能永續報告書 - 開發與架構對照書》v1.1.0-Universe
 *
 * 所有進入 NCB 資料庫的數據，都必須繼承此神聖契約：
 *  - uuid: 萬能永憶主體分發的唯一識別碼 (唯讀)
 *  - version: 語義化版本控制 (唯讀)
 *  - timestamp: 刻印時間戳 (唯讀)
 *  - evidence: 證據佐證庫連結 (對應 Omni 9式果因引擎憑證)
 */

/** 萬能元件心核介面 (5T 不可篡改禁區) */
export interface IComponentCore {
  // 萬能永憶主體唯一識別碼 (Immutable)
  readonly uuid: string;
  // 語義化版本控制
  readonly version: string;
  // 刻印時間戳 (溯源起點)
  readonly timestamp: number;
  // 證據左證庫 (儲存觀因循果的執行軌跡)
  evidence: {
    originCause: string;    // 因：原始觸發條件
    processTrace: string[]; // 循：InfoOne 流轉路徑
    finalEffect: string;    // 果：最終執行結果與狀態
  };
}

/** 動態表單欄位型別 (Schema-Driven UI) */
export type SchemaFieldType =
  | 'string'
  | 'number'
  | 'select'
  | 'boolean'
  | 'evidence_upload';

/** 單一表單欄位定義 */
export interface FormSchemaField {
  id: string;
  label: string;
  type: SchemaFieldType;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  placeholder?: string;
  unit?: string;
  default?: string | number;
}

/** 一份報告模組的完整 JSON Schema 契約 */
export interface DynamicFormSchema {
  uuid: string; // 報告模組 UUID (如 mod-env-carbon-0001)
  title: string;
  version: string;
  fields: FormSchemaField[];
}

/** 標準化 Server Action 回傳格式 (雙向 TypeScript 契約) */
export type ActionResponse<T> =
  | {
      success: true;
      status: 'saved' | 'published';
      message: string;
      data: T;
    }
  | {
      success: false;
      status: 'rejected' | 'error';
      message: string;
      errors?: unknown;
    };
