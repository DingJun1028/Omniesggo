// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
import { Type, type Static, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

/**
 * Omni 9式果因引擎 (Jules-Karma-Engine) — 零幻覺驗算守門員
 *
 * 不論前端防護多嚴密，後端 validateESGData 才是真正的最終防線。
 * 已由 Zod 遷移至 TypeBox：以 Static 推導雙向 TypeScript 型別，前後端共享單一真實來源。
 * 為維持既有呼叫端（測試與 Server Action）介面相容，各契約提供 safeParse 方法。
 */

// ─── safeParse 相容層 ────────────────────────────────────────────────

export interface SafeParseResult<T> {
  success: boolean;
  data?: T;
  error?: { format: () => Record<string, { _errors: string[] }> };
}

type RefineFn<T> = (data: T) => Array<{ path: string; message: string }>;

/**
 * 以 TypeBox shape + 跨欄位 refine 函式組成契約，
 * 回傳 { schema, safeParse } — safeParse 行為對齊 zod（shape 驗證 + refine + format 錯誤形狀）。
 */
function defineContract<T extends TSchema>(shape: T, refines: RefineFn<Static<T>>[] = []) {
  const schema = shape;
  function safeParse(raw: unknown): SafeParseResult<Static<T>> {
    // 1. shape 驗證（Value.Check）
    const issues: Array<{ path: string; message: string }> = [];
    if (!Value.Check(schema, raw)) {
      for (const e of Value.Errors(schema, raw)) {
        issues.push({ path: String(e.path ?? '').replace(/^\//, ''), message: String(e.message ?? 'Invalid value') });
      }
      return { success: false, error: { format: () => formatIssues(issues) } };
    }
    const data = raw as Static<T>;
    // 2. 跨欄位 refine（對齊 zod superRefine）
    for (const fn of refines) {
      for (const issue of fn(data)) issues.push(issue);
    }
    if (issues.length > 0) {
      return { success: false, error: { format: () => formatIssues(issues) } };
    }
    return { success: true, data };
  }
  return { schema, safeParse };
}

/** 仿 zod format() 形狀：Record<string, { _errors: string[] }>（DynamicFormEngine FeedbackState 依賴此形狀） */
function formatIssues(issues: Array<{ path: string; message: string }>): Record<string, { _errors: string[] }> {
  const out = { _errors: [] } as unknown as Record<string, { _errors: string[] }>;
  for (const it of issues) {
    const key = it.path || '_errors';
    if (!(key in out)) out[key] = { _errors: [] };
    out[key]._errors.push(it.message);
  }
  return out;
}

// ─── 核心介面實作：萬能元件心核 (IComponentCore) ──────────────────────

const URL_RE = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;
const SEMVER_RE = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;

const coreRefine: RefineFn<{ evidence: unknown }> = (data) => {
  const issues: Array<{ path: string; message: string }> = [];
  // URL 檢查：zod z.string().url() 由 schema 引擎強制；TypeBox 以 refine 對齊行為
  for (const ev of Array.isArray(data.evidence) ? data.evidence : []) {
    if (typeof ev !== 'string' || !URL_RE.test(ev)) {
      issues.push({ path: 'evidence', message: '證據必須是合法的 URL (S3/R2)' });
      break;
    }
  }
  return issues;
};

const ComponentCoreShape = Type.Object({
  uuid: Type.String({ pattern: '^mod-' }),
  version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9]+)?$' }),
  timestamp: Type.Integer({ exclusiveMinimum: 0 }),
  source_origin: Type.String({ minLength: 1 }),
  evidence: Type.Array(Type.String(), { minItems: 1 }),
});

export const ComponentCoreSchema = defineContract(ComponentCoreShape, [coreRefine]);

// ─── 延伸實作：環境數據盤查契約 (ISO-14064 範例) ──────────────────────

const EnvironmentalDataShape = Type.Composite([
  ComponentCoreShape,
  Type.Object({
    reportType: Type.Literal('ISO-14064'),
    previousYearUsage: Type.Number({ minimum: 0 }),
    currentYearUsage: Type.Number({ minimum: 0 }),
    gridEmissionFactor: Type.Number({ exclusiveMinimum: 0 }),
  }),
]);

export const EnvironmentalDataSchema = defineContract(EnvironmentalDataShape, [
  coreRefine,
  (data) => {
    const issues: Array<{ path: string; message: string }> = [];
    // 果因引擎防呆：增長率若超過 5 倍 (500%)，觸發攔截 (零幻覺)
    const d = data as { previousYearUsage: number; currentYearUsage: number };
    if (d.previousYearUsage > 0) {
      const growthRate = (d.currentYearUsage - d.previousYearUsage) / d.previousYearUsage;
      if (growthRate > 5) {
        issues.push({
          path: 'currentYearUsage',
          message: '【Dr. Thoth 零幻覺警告】當期數據 (' + d.currentYearUsage + ') 較前期暴增超過 500%。請確認單位是否有誤，或補充異常說明憑證。',
        });
      }
    }
    return issues;
  },
]);

// ─── 延伸實作：SOC 社會 - 多元包容報告契約 (mod-soc-dei-0001) ──────────

const DeiDataShape = Type.Composite([
  ComponentCoreShape,
  Type.Object({
    reportYear: Type.Integer({ minimum: 2000, maximum: 2100 }),
    totalEmployees: Type.Integer({ exclusiveMinimum: 0 }),
    femaleManagementRatio: Type.Number({ minimum: 0, maximum: 100 }),
    genderPayGap: Type.Number({ minimum: -100, maximum: 100 }),
    vulnerableGroupRatio: Type.Number({ minimum: 0, maximum: 100 }),
    deiPolicyUrl: Type.Optional(Type.Union([Type.String(), Type.Literal('')])),
  }),
]);

export const DeiDataSchema = defineContract(DeiDataShape, [
  coreRefine,
  (data) => {
    const issues: Array<{ path: string; message: string }> = [];
    const d = data as {
      femaleManagementRatio: number; genderPayGap: number;
      totalEmployees: number; vulnerableGroupRatio: number; deiPolicyUrl?: string;
    };
    if (d.deiPolicyUrl !== undefined && d.deiPolicyUrl !== '' && !URL_RE.test(d.deiPolicyUrl)) {
      issues.push({ path: 'deiPolicyUrl', message: '請提供有效的 URL' });
    }
    if (d.femaleManagementRatio === 0) {
      issues.push({
        path: 'femaleManagementRatio',
        message: '【Dr. Thoth 預警】女性主管佔比為 0%。請確認數據無誤；若屬實，建議於證據庫補充說明以應對審計。',
      });
    }
    if (Math.abs(d.genderPayGap) > 30) {
      issues.push({
        path: 'genderPayGap',
        message: '【Dr. Thoth 阻攔】性別薪酬差距達 ' + d.genderPayGap + '%，已遠超國際警戒線 (30%)。請重新核對 HR 薪資原始數據！',
      });
    }
    if (d.totalEmployees >= 67 && d.vulnerableGroupRatio < 1) {
      issues.push({
        path: 'vulnerableGroupRatio',
        message: '【法規提示】貴司人數已達法定進用身心障礙者門檻 (67人)，但佔比低於 1%，可能面臨罰款風險。',
      });
    }
    return issues;
  },
]);

// ─── 延伸實作：GOV 治理 - 董事會效能契約 (mod-gov-board-0001) ─────────

const GovBoardDataShape = Type.Composite([
  ComponentCoreShape,
  Type.Object({
    reportYear: Type.Integer({ minimum: 2000, maximum: 2100 }),
    boardMeetingCount: Type.Integer({ minimum: 0 }),
    averageAttendanceRate: Type.Number({ minimum: 0, maximum: 100 }),
    independentDirectorRatio: Type.Number({ minimum: 0, maximum: 100 }),
    femaleDirectorRatio: Type.Number({ minimum: 0, maximum: 100 }),
    hasRiskCommittee: Type.Number({ minimum: 0, maximum: 1 }),
  }),
]);

export const GovBoardDataSchema = defineContract(GovBoardDataShape, [
  coreRefine,
  (data) => {
    const issues: Array<{ path: string; message: string }> = [];
    const d = data as {
      averageAttendanceRate: number; independentDirectorRatio: number; femaleDirectorRatio: number;
    };
    if (d.averageAttendanceRate < 85) {
      issues.push({
        path: 'averageAttendanceRate',
        message: '【Dr. Thoth 阻攔】董事平均出席率僅 ' + d.averageAttendanceRate + '%，低於金管會高度關注的 85% 警戒線。請上傳董事會簽到紀錄佐證。',
      });
    }
    if (d.independentDirectorRatio < 33.3) {
      issues.push({
        path: 'independentDirectorRatio',
        message: '【法規提示】獨立董事佔比低於法定 1/3 (33.3%)，請確認董事會結構是否符合最新證交法規定。',
      });
    }
    if (d.femaleDirectorRatio === 0) {
      issues.push({
        path: 'femaleDirectorRatio',
        message: '【ESG 評級預警】女性董事比例為 0%。這將大幅降低 MSCI 等國際機構的治理評級，建議補充「董事會多元化政策」改善計畫。',
      });
    }
    return issues;
  },
]);

// ─── 雙向 TypeScript 映射 (End-to-End Type Safety) ─────────────────────

export type TComponentCore = Static<typeof ComponentCoreShape>;
export type TEnvironmentalData = Static<typeof EnvironmentalDataShape>;
export type TDeiData = Static<typeof DeiDataShape>;
export type TGovBoardData = Static<typeof GovBoardDataShape>;

// ─── 標準化 API 回傳格式 (Server Action 契約) ─────────────────────────

export type ActionResponse<T> =
  | { success: true; status: 'saved' | 'published'; message: string; data: T }
  | {
      success: false;
      status: 'rejected' | 'error';
      message: string;
      errors?: Record<string, { _errors: string[] }>;
    };

// ─── 對外驗算入口：依 reportType 分派對應契約 ─────────────────────────

export function validateESGData(payload: unknown): ActionResponse<unknown> {
  // 依據 uuid 前綴決定使用哪一份契約
  const uuid =
    typeof payload === 'object' && payload !== null && 'uuid' in payload
      ? String((payload as Record<string, unknown>).uuid)
      : '';

  let result: SafeParseResult<unknown>;
  if (uuid.includes('soc-dei')) {
    result = DeiDataSchema.safeParse(payload);
  } else if (uuid.includes('gov-board')) {
    result = GovBoardDataSchema.safeParse(payload);
  } else {
    result = EnvironmentalDataSchema.safeParse(payload);
  }

  if (!result.success) {
    return {
      success: false,
      status: 'rejected',
      message: '【Dr. Thoth 零幻覺警告】數據未通過果因引擎驗算，請檢視高亮欄位。',
      errors: result.error?.format(),
    };
  }

  return {
    success: true,
    status: 'saved',
    message: '果因引擎驗算通過！數據與證據鏈已安全寫入 NCB 核心。',
    data: result.data,
  };
}
