import crypto from 'crypto';

/**
 * 【信/真】 萬能智庫存儲引擎 (Omni Vault)
 * 實作物理級 WORM (Write Once Read Many) 邏輯
 * 
 * 在聖典 v3.1.0 規範下，進入智庫的數據視為「永恆態」，不可篡改。
 */
export class OmniVaultWORM {
  private static readonly VAULT_MAP = new Map<string, any>();

  /**
   * 永恆刻印：數據入庫後物理鎖定
   * @param uuid 唯一識別碼
   * @param artifact 要封印的數據物件
   */
  public static engrave(uuid: string, artifact: any) {
    if (this.VAULT_MAP.has(uuid)) {
      throw new Error(`[聖典違例] 數據 ${uuid} 已處於永恆態，禁止二次覆寫。`);
    }

    // 1. 【信】執行深度凍結，防止物件屬性被修改
    const immutableArtifact = this.deepFreeze(JSON.parse(JSON.stringify(artifact)));

    // 2. 【真】附加智庫刻印時間戳與存證 Hash
    const sealedData = Object.freeze({
      ...immutableArtifact,
      vault_seal: crypto.createHash('sha256').update(JSON.stringify(artifact)).digest('hex'),
      engraved_at: Date.now()
    });

    this.VAULT_MAP.set(uuid, sealedData);
    console.log(`🔒 [智庫] UUID: ${uuid} 已成功封印入庫。`);
    
    return sealedData;
  }

  /**
   * 安全提取：確保提取出的數據依然受保護
   */
  public static secureFetch(uuid: string) {
    const data = this.VAULT_MAP.get(uuid);
    if (!data) return null;
    return data;
  }

  /**
   * 遞迴執行 Object.freeze，達成物理級不可變性
   */
  private static deepFreeze(obj: any) {
    Object.keys(obj).forEach(prop => {
      const value = obj[prop];
      if (value && typeof value === 'object') {
        this.deepFreeze(value);
      }
    });
    return Object.freeze(obj);
  }
}
