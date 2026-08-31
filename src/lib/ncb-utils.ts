// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * NoCodeBackend (NCBDB) 代理服務器工具
 * 負責將資料請求路由至 54686_esg_go_userdb 實例，確保跨資料庫調用的一致性。
 * 已建置模組資料表：
 * - 用戶及數位分身: user_profiles, digital_twins, knowledge_chunks, rag_sessions
 * - 永續報告 RAG: report_sections, report_citations, gri_knowledge_base, validation_logs
 * - 善向永續村: village_members, impact_projects, community_posts, votes
 */

const NCB_API_ENDPOINT = process.env.NEXT_PUBLIC_NCB_API_ENDPOINT || 'https://api.nocodebackend.com';
const NCB_DB_INSTANCE = '54686_esg_go_userdb';
const NCB_API_KEY = process.env.NCB_API_KEY || '';

export interface NCBQueryOptions {
  table: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

export async function ncbQuery<T>(options: NCBQueryOptions): Promise<T> {
  const { table, method = 'GET', body, params } = options;
  
  // 建立代理路由 URL
  const url = new URL(`${NCB_API_ENDPOINT}/db/${NCB_DB_INSTANCE}/${table}`);
  
  if (params) {
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${NCB_API_KEY}`
  };

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      // 若是模擬環境未設定 API Key，回傳空資料或模擬資料以防崩潰
      if (!NCB_API_KEY) {
        console.warn(`[NCBDB Proxy] API Key 尚未設定，模擬返回空陣列。目標資料表: ${table}`);
        return [] as unknown as T;
      }
      throw new Error(`NCBDB Query Failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data as T;
  } catch (error) {
    console.error(`[NCBDB Proxy Error] Table: ${table}`, error);
    // 預設返回模擬或空資料，避免阻斷開發流程
    return [] as unknown as T;
  }
}

// ── RAG 模組專用封裝 ──────────────────────────────────────────────────────

export const ncbRagService = {
  async getKnowledgeChunks(queryText: string): Promise<unknown[]> {
    // 模擬呼叫 RAG Vector Search
    return ncbQuery({
      table: 'knowledge_chunks',
      method: 'POST',
      body: { action: 'similarity_search', query: queryText }
    });
  },

  async saveKnowledgeChunks(chunkData: Record<string, unknown>): Promise<unknown> {
    return ncbQuery({
      table: 'knowledge_chunks',
      method: 'POST',
      body: chunkData
    });
  },

  async getDigitalTwin(userId: string): Promise<unknown> {
    return ncbQuery({
      table: 'digital_twins',
      method: 'GET',
      params: { user_id: userId }
    });
  },
  
  async saveValidationLog(log: Record<string, unknown>): Promise<unknown> {
    return ncbQuery({
      table: 'validation_logs',
      method: 'POST',
      body: log
    });
  }
};

// [DEPRECATED] ncbVillageService has been removed. Village operations now use Firebase atomic transactions directly.

// ── User Profile 專用封裝 ──────────────────────────────────────────────

export const ncbUserService = {
  async getProfile(userId: string): Promise<unknown> {
    return ncbQuery({
      table: 'user_profiles',
      method: 'GET',
      params: { user_id: userId }
    });
  },

  async upsertProfile(profile: Record<string, unknown>): Promise<unknown> {
    return ncbQuery({
      table: 'user_profiles',
      method: 'POST',
      body: profile
    });
  },

  async updatePoints(userId: string, delta: number): Promise<unknown> {
    return ncbQuery({
      table: 'user_profiles',
      method: 'PUT',
      params: { user_id: userId },
      body: { total_points: delta }
    });
  },
};
