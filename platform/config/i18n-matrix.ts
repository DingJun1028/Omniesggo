/**
 * ESGGO 善向永續 萬能系統 — 全域全端全量 雙向同步 TypeScript 繁中英碼 終始矩陣
 *
 * 規約：
 * - 本章為所有 Route / Component / Lib 的「唯一字源 (SSOT)」
 * - 任何新增/修改畫面文字、API 欄位、錯誤訊息，都必須對應至此矩陣
 * - 雙向同步：繁中為預設使用者語言；英文字串同步保留，作為 fallback / SEO / debug
 * - 編碼慣例：
 *     TS 變數/函式：camelCase
 *     DB 欄位/JSON key：snake_case
 *     Route/URL 路徑：kebab-case
 *     CSS class：kebab-case
 *     Enum/Namespace：PascalCase
 */

// ============================================================
// 1. 全域核心字彙（Terminology）
// ============================================================
export const TERMS = {
  app: {
    title: ESGGO 善向永續,
    subtitle: 萬能系統,
    description: 善向永續萬能系統 — 連接企業、ESG 報告與 AI 分析,
  },
  nav: {
    home: { zh: 首頁, en: Home },
    dashboard: { zh: 儀表板, en: Dashboard },
    esgReport: { zh: ESG 報告, en: ESG Report },
    aiNotes: { zh: AI 筆記, en: AI Notes },
    omniCenter: { zh: 萬能中心, en: Omni Center },
    profile: { zh: 個人檔案, en: Profile },
    settings: { zh: 設定, en: Settings },
    admin: { zh: 管理後台, en: Admin },
  },
  actions: {
    submit: { zh: 送出, en: Submit },
    cancel: { zh: 取消, en: Cancel },
    save: { zh: 儲存, en: Save },
    delete: { zh: 刪除, en: Delete },
    edit: { zh: 編輯, en: Edit },
    preview: { zh: 預覽, en: Preview },
    download: { zh: 下載, en: Download },
    export: { zh: 匯出, en: Export },
    import: { zh: 匯入, en: Import },
    search: { zh: 搜尋, en: Search },
    filter: { zh: 篩選, en: Filter },
    reset: { zh: 重設, en: Reset },
    loading: { zh: 載入中…, en: Loading… },
    success: { zh: 成功, en: Success },
    error: { zh: 錯誤, en: Error },
    warning: { zh: 警告, en: Warning },
    info: { zh: 資訊, en: Info },
    confirm: { zh: 確認, en: Confirm },
  },
  status: {
    online: { zh: 線上, en: Online },
    offline: { zh: 離線, en: Offline },
    enabled: { zh: 已啟用, en: Enabled },
    disabled: { zh: 已停用, en: Disabled },
    pending: { zh: 待處理, en: Pending },
    processing: { zh: 處理中, en: Processing },
    completed: { zh: 已完成, en: Completed },
    failed: { zh: 失敗, en: Failed },
  },
  esg: {
    environmental: { zh: 環境, en: Environmental },
    social: { zh: 社會, en: Social },
    governance: { zh: 治理, en: Governance },
    esgScore: { zh: ESG 評分, en: ESG Score },
    carbonFootprint: { zh: 碳足跡, en: Carbon Footprint },
    sustainability: { zh: 永續性, en: Sustainability },
    compliance: { zh: 合規性, en: Compliance },
  },
  errors: {
    network: { zh: 網路連線失敗，請稍後再試。, en: Network error. Please try again later. },
    unauthorized: { zh: 未授權存取, en: Unauthorized },
    forbidden: { zh: 禁止存取, en: Forbidden },
    notFound: { zh: 找不到資源, en: Resource not found },
    serverError: { zh: 伺服器錯誤, en: Internal server error },
    validation: { zh: 欄位驗證失敗, en: Validation failed },
   rateLimit: { zh: 連線過於頻繁，請稍後再試。, en: Rate limit exceeded. Please retry later. },
  },
} as const;

// ============================================================
// 2. 使用型別
// ============================================================
export type Lang = zh | en;
export type TermKey = keyof typeof TERMS;
export type NestedTerm = (typeof TERMS)[TermKey];

/**
 * 取得單一翻譯字串
 */
export function t(path: string, lang: Lang = zh): string {
  const parts = path.split(.);
  let current: unknown = TERMS;
  for (const p of parts) {
    if (current && typeof current === object && p in current) {
      current = (current as Record<string, unknown>)[p];
    } else {
      return path;
    }
  }
  if (typeof current === object && current !== null && lang in current) {
    return (current as Record<string, string>)[lang];
  }
  return String(current);
}

/**
 * 取得完整分類詞彙
 */
export function getTerms(lang: Lang = zh): Record<string, string> {
  const flatten = (obj: unknown, prefix = ): Record<string, string> => {
    const out: Record<string, string> = {};
    if (typeof obj !== object || obj === null) return out;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === object && v !== null && zh in v && en in v) {
        out[key] = (v as Record<string, string>)[lang];
      } else if (typeof v === object && v !== null) {
        Object.assign(out, flatten(v, key));
      }
    }
    return out;
  };
  return flatten(TERMS);
}

// ============================================================
// 3. 雙向同步規則（Begin-to-End Matrix）
// ============================================================
export const SYNC_RULES = {
  sourceOfTruth: {
    zh: 繁體中文（presentation/UI）,
    en: 英文（SEO / API fallback / debug）,
  },
  conventions: {
    tsVariable: camelCase,
    dbField: snake_case,
    urlPath: kebab-case,
    cssClass: kebab-case,
    enumType: PascalCase,
  },
  syncPolicy: {
    newString: 必須更新 TERMS，禁止硬編碼,
    apiResponse: 優先回傳 zh；必要時雙欄,
    routeParam: 鍵名用 en，值內容可為 zh,
    logMessage: 英為主便於 grep；使用者訊息放 zh,
  },
} as const;

export type SyncRules = typeof SYNC_RULES;

// ============================================================
// 4. 應用範例
// ============================================================
export const EXAMPLES = {
  route: /omni-center,
  api: /api/omni-todo,
  component: OmniCenterPage,
  variable: isPluginEnabled,
  dbTable: omni_notes,
  cssClass: card-token,
  term: t(actions.save, zh),
} as const;

export default TERMS;
