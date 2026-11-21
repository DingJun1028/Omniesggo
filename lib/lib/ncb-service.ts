import { ncbFetch } from "./ncb-utils";
import { 
  IKnowledgeRecord, 
  ESGKnowledgeBase,
  IEsgMetric,
  IEvidenceRecord,
  IMaterialityTopic,
  ISupplyChainVendor,
  IOmniNote,
  IServiceModule,
  IUserProfile,
  ICommunityPost,
  IVillageMember,
  IApiResult
} from "../shared/types";

export const NCB_DB_CORE = "54686_esg_go_ncb";
export const NCB_DB_USER = "54686_esg_go_userdb";

/**
 * Client-Side API 工廠
 * 型別定義 + fetch 封裝
 */

// --- NCB Service Interfaces (using Shared types) ---
export type { 
  IServiceModule as ServiceModule,
  IEsgMetric as EsgMetric,
  IEvidenceRecord as EvidenceRecord,
  IMaterialityTopic as MaterialityTopic,
  ISupplyChainVendor as SupplyChainVendor,
  IOmniNote as OmniNote,
  IUserProfile as UserProfile,
  ICommunityPost as CommunityPost,
  IVillageMember as VillageMember
};

// --- API Factories ---

export const serviceModulesApi = {
  /**
   * 取得所有服務模組 (Hub, Core, Adv, Comm)
   */
  list: async (): Promise<IApiResult<IServiceModule[]>> => {
    try {
      const result = await ncbFetch("service_modules");
      return { data: result.data || [] };
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const esgMetricsApi = {
  /**
   * 取得所有 ESG KPI
   */
  list: async (): Promise<IApiResult<IEsgMetric[]>> => {
    try {
      const result = await ncbFetch("esg_metrics");
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },
  /**
   * 取得特定年份與類別的 KPI
   */
  listByCategory: async (category: "E" | "S" | "G", year: number): Promise<IApiResult<IEsgMetric[]>> => {
    try {
      const queryParams = `filter=category,eq,${category}&filter=year,eq,${year}`;
      const result = await ncbFetch("esg_metrics", {}, queryParams);
      return { data: result.data || [] };
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const materialityApi = {
  /**
   * 取得重大性議題矩陣資料
   */
  list: async (): Promise<IApiResult<IMaterialityTopic[]>> => {
    try {
      const result = await ncbFetch("materiality_matrix");
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const supplyChainApi = {
  /**
   * 取得供應鏈 ESG 數據
   */
  list: async (): Promise<IApiResult<ISupplyChainVendor[]>> => {
    try {
      const result = await ncbFetch("supply_chain_data");
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const evidenceVaultApi = {
  /**
   * 寫入 5T 證據庫 (Hash 凍結)
   */
  insert: async (record: Omit<IEvidenceRecord, "id">): Promise<IApiResult<IEvidenceRecord | null>> => {
    try {
      const result = await ncbFetch("evidence_vault", {
        method: "POST",
        body: JSON.stringify(record)
      });
      return { data: result.data as any, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
  
  /**
   * 讀取 5T 證據庫
   */
  list: async (): Promise<IApiResult<IEvidenceRecord[]>> => {
    try {
      const result = await ncbFetch("evidence_vault");
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
};

// --- User Database APIs ---
export const userProfileApi = {
  get: async (userId: string): Promise<IApiResult<IUserProfile | null>> => {
    try {
      const result = await ncbFetch(`user_profiles/${userId}`, {}, "", NCB_DB_USER);
      return { data: result.data as any, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
  list: async (): Promise<IApiResult<IUserProfile[]>> => {
    try {
      const result = await ncbFetch("user_profiles", {}, "", NCB_DB_USER);
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const communityApi = {
  listPosts: async (): Promise<IApiResult<ICommunityPost[]>> => {
    try {
      const result = await ncbFetch("community_posts", {}, "", NCB_DB_USER);
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const villageApi = {
  listMembers: async (): Promise<IApiResult<IVillageMember[]>> => {
    try {
      const result = await ncbFetch("village_members", {}, "", NCB_DB_USER);
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  }
};

export const omniNoteApi = {
  /**
   * 取得所有萬能筆記
   */
  list: async (): Promise<IApiResult<IOmniNote[]>> => {
    try {
      const result = await ncbFetch("omni_notes", {}, "sort=created_at,desc");
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  /**
   * 儲存筆記
   */
  insert: async (note: Partial<IOmniNote>): Promise<IApiResult<IOmniNote | null>> => {
    try {
      const result = await ncbFetch("omni_notes", {
        method: "POST",
        body: JSON.stringify({
          ...note,
          note_id: `NOTE_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * 更新筆記
   */
  update: async (id: string, note: Partial<IOmniNote>): Promise<IApiResult<IOmniNote | null>> => {
    try {
      const result = await ncbFetch(`omni_notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...note,
          updated_at: new Date().toISOString()
        })
      });
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * 刪除筆記
   */
  delete: async (id: string): Promise<{ success: boolean, error: any }> => {
    try {
      await ncbFetch(`omni_notes/${id}`, { method: "DELETE" });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }
};

export const skillsApi = {
  /**
   * 取得技能矩陣 (Skill Matrix)
   */
  list: async (): Promise<{ data: any[], error: any }> => {
    try {
      const result = await ncbFetch("skill_matrix_nodes", {}, "sort=category,asc");
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  /**
   * 學習/更新技能
   */
  upsert: async (skill: any): Promise<{ data: any | null, error: any }> => {
    try {
      const result = await ncbFetch("skill_matrix_nodes", {
        method: "POST", // NCB POST usually handles upsert if ID matches or is new
        body: JSON.stringify({
          ...skill,
          updated_at: new Date().toISOString()
        })
      });
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
};

export const knowledgeApi = {
  /**
   * 取得 ESG 智庫知識紀錄
   */
  list: async (kb?: ESGKnowledgeBase): Promise<{ data: IKnowledgeRecord[], error: any }> => {
    try {
      const queryParams = kb ? `filter=kb,eq,${kb}` : "";
      const result = await ncbFetch("esg_knowledge", {}, queryParams);
      return { data: result.data || [], error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  /**
   * 向量檢索 (NCB 代理)
   * 注意：這裡模擬 NCB 的向量檢索能力
   */
  matchKnowledge: async (embedding: number[], threshold: number, count: number, kbs: ESGKnowledgeBase[] | null): Promise<{ data: IKnowledgeRecord[], error: any }> => {
    try {
      // 假設 NCB 有一個名為 match_knowledge 的 RPC 或特定 endpoint
      const result = await ncbFetch("rpc/match_knowledge", {
        method: "POST",
        body: JSON.stringify({
          query_embedding: embedding,
          match_threshold: threshold,
          match_count: count,
          kb_filter: kbs
        })
      });
      return { data: result.data || [], error: null };
    } catch (error) {
      // 如果 RPC 未實現，回退到普通 list
      console.warn("[NCB] Vector search not available, falling back to list");
      const listResult = await knowledgeApi.list();
      return listResult;
    }
  },

  /**
   * 注入知識紀錄
   */
  upsert: async (records: Partial<IKnowledgeRecord>[]): Promise<{ success: boolean, error: any }> => {
    try {
      await ncbFetch("esg_knowledge", {
        method: "POST",
        body: JSON.stringify(records.map(r => ({
          ...r,
          created_at: Date.now()
        })))
      });
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  }
};
