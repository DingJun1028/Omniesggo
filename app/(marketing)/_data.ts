/**
 * 靜態資料 — 不含 React 元件，可安全在伺服器元件中使用。
 * icon 元件留在各自的 client section 內，避免跨邊界傳遞。
 */

export const STATS: { value: string; label: string }[] = [
  { value: 'GRI 2024', label: '標準支援' },
  { value: 'CSRD ESRS', label: 'EU 法規合規' },
  { value: '5T', label: '信任協議' },
  { value: 'Hash Lock', label: '不可篡改存證' },
];

export const BENEFITS: string[] = [
  '節省 60% 報告撰寫時間',
  '自動符合國際永續準則',
  '完整證據追溯機制',
  '跨部門協作無縫銜接',
  '即時合規性檢查',
  '專業顧問支援服務',
];
