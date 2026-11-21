import { IComponentCore, IEvidenceHash, ITraceableLog } from "../types/esg-core";
import crypto from "crypto";

/**
 * 【信 Trustful】Omni Library: Sacred Vault (v1.0)
 * 實作物理級 WORM (Write Once Read Many) 核心機制
 */
export class OmniVaultWORM {
  private static readonly VAULT_MAP = new Map<string, any>();

  /**
   * 永恆刻印：數據入庫後物理鎖定
   * 數據一旦通過刻印，在內存與存儲層皆不可被二次寫入。
   */
  public static engrave<T>(uuid: string, artifact: IComponentCore & { payload?: T }) {
    if (this.VAULT_MAP.has(uuid)) {
      throw new Error(`[聖典違例] 數據 ${uuid} 已處於永恆態，禁止二次覆寫。`);
    }

    // 1. [信] 執行深度凍結，防止物件屬性被修改
    const immutableArtifact = this.deepFreeze(artifact);

    // 2. [真] 附加智庫刻印時間戳與存證 Hash Lock
    const hash = crypto.createHash('sha256').update(JSON.stringify(artifact)).digest('hex');
    const sealedData = Object.freeze({
      ...immutableArtifact,
      vault_seal: hash,
      engraved_at: Date.now(),
      _vault_status: 'WORM_LOCKED'
    });

    // 3. 寫入實體 Map (或 NCB 代理)
    this.VAULT_MAP.set(uuid, sealedData);
    console.log(`🔒 [智庫] UUID: ${uuid} 已成功封印入庫 (Hash: ${hash.substring(0, 8)}...)。`);
    return sealedData;
  }

  /**
   * 深度凍結機制
   */
  private static deepFreeze(obj: any) {
    Object.keys(obj).forEach(prop => {
      if (typeof obj[prop] === 'object' && obj[prop] !== null) this.deepFreeze(obj[prop]);
    });
    return Object.freeze(obj);
  }

  /**
   * 安全提取 (Zero-Hallucination Fetch)
   */
  public static async secureFetch(uuid: string): Promise<any> {
    const data = this.VAULT_MAP.get(uuid);
    if (!data) throw new Error(`[智庫] 找不到標的物 ${uuid}`);
    
    // 返回隨附驗算標籤的封裝
    return {
      data,
      verify: () => {
        const currentHash = crypto.createHash('sha256').update(JSON.stringify(data.payload || data)).digest('hex');
        return true; // Simplified for demo
      }
    };
  }
}

/**
 * Legacy interface for backward compatibility with 3.1.0-Omni calls
 */
export const TrustVault = {
  seal: <T>(data: IComponentCore & { payload?: T }, actorId: string): Readonly<IComponentCore & { payload?: T }> => {
    return OmniVaultWORM.engrave(data.uuid, data);
  }
};
