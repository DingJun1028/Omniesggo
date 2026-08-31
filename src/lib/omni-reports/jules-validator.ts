// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
import { z } from 'zod';

/**
 * Omni 9式果因引擎 (Jules-Karma-Engine) — 零幻覺驗算守門員
 *
 * 不論前端防護多嚴密，後端 validateESGData 才是真正的最終防線。
 * 透過 Zod 的 z.infer 推導雙向 TypeScript 型別，前後端共享單一真實來源。
 */

/** 核心介面實作：萬能元件心核 (IComponentCore) */
export const ComponentCoreSchema = z.object({
  uuid: z
    .string()
    .startsWith('mod-', { message: "UUID 必須以 'mod-' 開頭 (英碼繁博準則)" }),
  version: z
    .string()
    .regex(
      /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/,
      '版本號必須符合語義化規範 (例: 1.1.0-Universe)'
    ),
  timestamp: z.number().int().positive(),
  source_origin: z.string().min(1, '必須標註數據來源起點 (Traceable 真理)'),
  evidence: z
    .array(z.string().url('證據必須是合法的 URL (S3/R2)'))
    .min(1, '至少需要提供一份佐證憑證')
    .default([]),
});

/** 延伸實作：環境數據盤查契約 (ISO-14064 範例) */
export const EnvironmentalDataSchema = ComponentCoreSchema.extend({
  reportType: z.literal('ISO-14064'),
  previousYearUsage: z.number().nonnegative('基準數據不得為負數'),
  currentYearUsage: z.number().nonnegative('當期數據不得為負數'),
  gridEmissionFactor: z.number().positive('排碳系數必須大於 0'),
}).superRefine((data, ctx) => {
  // 果因引擎防呆：增長率若超過 5 倍 (500%)，觸發攔截 (零幻覺)
  if (data.previousYearUsage > 0) {
    const growthRate =
      (data.currentYearUsage - data.previousYearUsage) /
      data.previousYearUsage;
    if (growthRate > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `【Dr. Thoth 零幻覺警告】當期數據 (${data.currentYearUsage}) 較前期暴增超過 500%。請確認單位是否有誤，或補充異常說明憑證。`,
        path: ['currentYearUsage'],
      });
    }
  }
});

/** 延伸實作：SOC 社會 - 多元包容報告契約 (mod-soc-dei-0001) */
export const DeiDataSchema = ComponentCoreSchema.extend({
  reportYear: z.number().int().min(2000).max(2100),
  totalEmployees: z.number().int().positive('員工總數必須大於 0'),
  femaleManagementRatio: z.number().min(0).max(100, '比例不能超過 100%'),
  genderPayGap: z.number().min(-100).max(100),
  vulnerableGroupRatio: z.number().min(0).max(100),
  deiPolicyUrl: z.string().url('請提供有效的 URL').optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (data.femaleManagementRatio === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        '【Dr. Thoth 預警】女性主管佔比為 0%。請確認數據無誤；若屬實，建議於證據庫補充說明以應對審計。',
      path: ['femaleManagementRatio'],
    });
  }
  if (Math.abs(data.genderPayGap) > 30) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `【Dr. Thoth 阻攔】性別薪酬差距達 ${data.genderPayGap}%，已遠超國際警戒線 (30%)。請重新核對 HR 薪資原始數據！`,
      path: ['genderPayGap'],
    });
  }
  if (data.totalEmployees >= 67 && data.vulnerableGroupRatio < 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        '【法規提示】貴司人數已達法定進用身心障礙者門檻 (67人)，但佔比低於 1%，可能面臨罰款風險。',
      path: ['vulnerableGroupRatio'],
    });
  }
});

/** 延伸實作：GOV 治理 - 董事會效能契約 (mod-gov-board-0001) */
export const GovBoardDataSchema = ComponentCoreSchema.extend({
  reportYear: z.number().int().min(2000).max(2100),
  boardMeetingCount: z.number().int().min(0),
  averageAttendanceRate: z.number().min(0).max(100),
  independentDirectorRatio: z.number().min(0).max(100),
  femaleDirectorRatio: z.number().min(0).max(100),
  hasRiskCommittee: z.number().min(0).max(1),
}).superRefine((data, ctx) => {
  if (data.averageAttendanceRate < 85) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `【Dr. Thoth 阻攔】董事平均出席率僅 ${data.averageAttendanceRate}%，低於金管會高度關注的 85% 警戒線。請上傳董事會簽到紀錄佐證。`,
      path: ['averageAttendanceRate'],
    });
  }
  if (data.independentDirectorRatio < 33.3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        '【法規提示】獨立董事佔比低於法定 1/3 (33.3%)，請確認董事會結構是否符合最新證交法規定。',
      path: ['independentDirectorRatio'],
    });
  }
  if (data.femaleDirectorRatio === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        '【ESG 評級預警】女性董事比例為 0%。這將大幅降低 MSCI 等國際機構的治理評級，建議補充「董事會多元化政策」改善計畫。',
      path: ['femaleDirectorRatio'],
    });
  }
});

/** 雙向 TypeScript 映射 (End-to-End Type Safety) */
export type TComponentCore = z.infer<typeof ComponentCoreSchema>;
export type TEnvironmentalData = z.infer<typeof EnvironmentalDataSchema>;
export type TDeiData = z.infer<typeof DeiDataSchema>;
export type TGovBoardData = z.infer<typeof GovBoardDataSchema>;

/** 標準化 API 回傳格式 (Server Action 契約) */
export type ActionResponse<T> =
  | { success: true; status: 'saved' | 'published'; message: string; data: T }
  | {
      success: false;
      status: 'rejected' | 'error';
      message: string;
      errors?: z.ZodFormattedError<T>;
    };

/** 對外驗算入口：依 reportType 分派對應契約 */
export function validateESGData(payload: unknown): ActionResponse<unknown> {
  // 依據 uuid 前綴決定使用哪一份契約
  const uuid =
    typeof payload === 'object' && payload !== null && 'uuid' in payload
      ? String((payload as Record<string, unknown>).uuid)
      : '';

  let result: z.SafeParseReturnType<unknown, unknown>;
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
      errors: result.error.format(),
    };
  }

  return {
    success: true,
    status: 'saved',
    message: '果因引擎驗算通過！數據與證據鏈已安全寫入 NCB 核心。',
    data: result.data,
  };
}
