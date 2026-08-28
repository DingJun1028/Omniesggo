/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// src/ncb-client.js — NCBDB (NoCodeBackend) 客戶端
// ------------------------------------------------------------
// 2026-08-25 無縫轉移: GCP Firebase 移除後, 提供 NCBDB 作為
// 跨裝置共用的真·後端。
//
// 對齊根專案 src/lib/ncb-utils.ts 的真實 NCBDB 慣例:
//   - DB instance 硬編碼 54686_esg_go_userdb (報告規格書)
//   - endpoint: ${NCB_API_ENDPOINT}/db/${INSTANCE}/${table}
//   - 扁平表名 (無 platforms_ 前綴)
//   - LC 專屬資料用 lc_ 前綴隔離, 避免與根專案 user_profiles 等表衝突
//
// 設計:
//   - 透過 NCB_API_KEY / NEXT_PUBLIC_NCB_API_ENDPOINT 啟用 (useNcb 旗標)
//   - 所有 CRUD 委託 ncbQuery (REST)
//   - 無 API Key 時 isNcbEnabled() 回 false → 上層 fallback 到 localStorage
//   - 不依賴任何 GCP / Firebase 套件
// ============================================================

const NCB_API_ENDPOINT =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_NCB_API_ENDPOINT) ||
  (typeof process !== 'undefined' && process.env && process.env.NCB_API_ENDPOINT) ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_NCB_API_ENDPOINT) ||
  'https://api.nocodebackend.com';

// 2026-08-25: 對齊 NCBDB 建置報告 — 資料庫 ID 54686_esg_go_userdb
const NCB_DB_INSTANCE = '54686_esg_go_userdb';

const NCB_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_NCB_API_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.NCB_API_KEY) ||
  '';

/** NCBDB 是否啟用 (有 API Key 才啟用) */
export const isNcbEnabled = () => Boolean(NCB_API_KEY);

/**
 * NCBDB 通用查詢 — 對齊根專案 ncbQuery<T>
 * @param {{table:string, method?:'GET'|'POST'|'PUT'|'DELETE', body?:Record<string,unknown>, params?:Record<string,string>}} options
 */
export async function ncbQuery(options) {
  const { table, method = 'GET', body, params } = options;
  const url = new URL(`${NCB_API_ENDPOINT}/db/${NCB_DB_INSTANCE}/${table}`);
  if (params) {
    Object.keys(params).forEach((k) => url.searchParams.append(k, params[k]));
  }
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${NCB_API_KEY}`,
  };
  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      if (!NCB_API_KEY) {
        console.warn(`[NCBDB] API Key 尚未設定, 模擬空資料. table=${table}`);
        return [];
      }
      throw new Error(`NCBDB Query Failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.data ?? data);
  } catch (error) {
    console.error(`[NCBDB] Error table=${table}`, error);
    return [];
  }
}

// ── 集合封裝 (對齊 Firebase 集合路徑 platforms/{APP_ID}/{collection}) ──
// 2026-08-25: 對齊 NCBDB 建置報告 — 扁平表名, LC 專屬用 lc_ 前綴隔離
// 報告已建: user_profiles / village_members / impact_projects / community_posts / votes
// LC 專屬 (報告無對應, 新建): lc_submissions / lc_profiles / lc_tas / lc_pairings

export const ncbSubmissions = {
  async list(appId) {
    return ncbQuery({ table: 'lc_submissions', method: 'GET', params: { app_id: appId } });
  },
  async set(id, payload) {
    return ncbQuery({ table: 'lc_submissions', method: 'POST', body: { id, ...payload } });
  },
  async delete(id, appId) {
    return ncbQuery({ table: 'lc_submissions', method: 'DELETE', params: { id, app_id: appId } });
  },
};

export const ncbProfiles = {
  async get(uid, appId) {
    const rows = await ncbQuery({ table: 'lc_profiles', method: 'GET', params: { user_id: uid, app_id: appId } });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  },
  async set(uid, appId, data) {
    return ncbQuery({ table: 'lc_profiles', method: 'POST', body: { user_id: uid, app_id: appId, ...data } });
  },
};

export const ncbTAs = {
  async get(uid, appId) {
    const rows = await ncbQuery({ table: 'lc_tas', method: 'GET', params: { user_id: uid, app_id: appId } });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  },
  async set(uid, appId, data) {
    return ncbQuery({ table: 'lc_tas', method: 'POST', body: { user_id: uid, app_id: appId, ...data } });
  },
};

export const ncbPairings = {
  async list(appId) {
    return ncbQuery({ table: 'lc_pairings', method: 'GET', params: { app_id: appId } });
  },
  async set(id, appId, payload) {
    return ncbQuery({ table: 'lc_pairings', method: 'POST', body: { id, app_id: appId, ...payload } });
  },
  async delete(id, appId) {
    return ncbQuery({ table: 'lc_pairings', method: 'DELETE', params: { id, app_id: appId } });
  },
};
