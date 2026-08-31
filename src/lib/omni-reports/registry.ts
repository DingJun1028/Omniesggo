// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
import type { DynamicFormSchema } from './types';

/**
 * 聖典註冊中心 (Schema Registry)
 * 集中管理所有報告模組的 UUID → JSON Schema 對應。
 * 搭配 Next.js App Router 的 [reportId] 動態路由，單一頁面即可支撐 200+ 種報告。
 */

export const ReportSchemaRegistry: Record<string, DynamicFormSchema> = {
  'mod-env-carbon-0001': {
    uuid: 'mod-env-carbon-0001',
    title: 'ISO-14064 溫室氣體盤查',
    version: '1.1.0-Universe',
    fields: [
      { id: 'reportType', label: '報告標準', type: 'string', required: true, placeholder: '預設: ISO-14064', default: 'ISO-14064' },
      { id: 'previousYearUsage', label: '基準年/前期用電量', type: 'number', required: true, unit: 'kWh' },
      { id: 'currentYearUsage', label: '當期用電量', type: 'number', required: true, unit: 'kWh' },
      { id: 'gridEmissionFactor', label: '電力排碳系數', type: 'number', required: true, unit: 'kg CO2e/kWh' },
    ],
  },
  'mod-soc-dei-0001': {
    uuid: 'mod-soc-dei-0001',
    title: 'GRI 405: 多元化與平等機會 (DEI) 報告',
    version: '1.0.0-Universe',
    fields: [
      { id: 'reportYear', label: '申報年度', type: 'number', required: true, placeholder: '例如: 2026' },
      { id: 'totalEmployees', label: '全職員工總數', type: 'number', required: true, unit: '人' },
      { id: 'femaleManagementRatio', label: '女性主管佔比', type: 'number', required: true, unit: '%' },
      { id: 'genderPayGap', label: '性別薪酬差距 (男/女)', type: 'number', required: true, unit: '%' },
      { id: 'vulnerableGroupRatio', label: '弱勢族群/身心障礙員工佔比', type: 'number', required: true, unit: '%' },
    ],
  },
  'mod-gov-board-0001': {
    uuid: 'mod-gov-board-0001',
    title: 'GRI 2026: 董事會效能與風險治理評估',
    version: '1.0.0-Universe',
    fields: [
      { id: 'reportYear', label: '評估年度', type: 'number', required: true },
      { id: 'boardMeetingCount', label: '年度董事會開會次數', type: 'number', required: true, unit: '次' },
      { id: 'averageAttendanceRate', label: '董事平均出席率', type: 'number', required: true, unit: '%' },
      { id: 'independentDirectorRatio', label: '獨立董事席次佔比', type: 'number', required: true, unit: '%' },
      { id: 'femaleDirectorRatio', label: '女性董事席次佔比', type: 'number', required: true, unit: '%' },
      { id: 'hasRiskCommittee', label: '是否設立風險管理委員會 (1=是, 0=否)', type: 'number', required: true },
    ],
  },
};

/** 依 UUID 取得神聖契約 (實務上可改為從 NCBDB 動態 Fetch) */
export async function getSchemaByUUID(uuid: string): Promise<DynamicFormSchema | null> {
  return ReportSchemaRegistry[uuid] ?? null;
}
