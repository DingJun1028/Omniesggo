// vps/junaikey/schema.mjs
// ============================================================
// 共享常數、MANTRA、traits 定義
// ============================================================
export const MANTRA = '無作妙德。圓通無礙';
export const SKILL_TRAITS = ['永恆', '被動', '自主', '共享', '閉環', '圓通'];
export const NCB_TABLES = {
  skills: 'junaikey_skills',
  memory: 'junaikey_memory',
  progress: 'junaikey_progress',
  journal: 'junaikey_journal',
};
export const DEFAULT_MEMORY_RETENTION = 1000;
export const DEFAULT_NCB_LIST_LIMIT = 500;
export const DEFAULT_NCB_BULK_LIMIT = 500;
export const MAX_NCB_PAGES = 100;
