// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
import crypto from 'crypto';

/**
 * NCBDB (NoCodeBackend DataBase) 配接器 + Hash Lock 不可篡改封印
 * 對齊《永續報告書架構補強建議》路徑一：實體化 NCB 雲端同源。
 *
 * 注意：本檔為可執行的最小實作 (免費算立優先)。生產環境將 NCB_API_URL 指向
 * https://api.nocodebackend.com/v1/projects 並帶入 NCB_API_KEY / NCB_PROJECT_ID。
 */

const NCB_API_URL = process.env.NCB_API_URL ?? 'https://api.nocodebackend.com/v1/projects';
const NCB_API_KEY = process.env.NCB_API_KEY ?? '';
const NCB_PROJECT_ID = process.env.NCB_PROJECT_ID ?? 'omni-esg-local';

/** 神聖契約：生成 SHA-256 不可篡改雜湊值 (Trustworthy 核心禁區) */
export function generateHashLock(payload: unknown): string {
  const dataString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/** NCBDB 專屬配接器 (Adapter) */
export const ncbClient = {
  /** 寫入前強制壓上 Hash Lock 與刻印時間戳 */
  async insertDocument(collection: string, document: Record<string, unknown>) {
    const sealedDocument = {
      ...document,
      _sealed_at: new Date().toISOString(),
      _hash_signature: generateHashLock(document),
    };

    // 生產路徑：實際 RESTful 寫入 NCBDB
    if (NCB_API_KEY && NCB_API_KEY.length > 0) {
      const res = await fetch(
        `${NCB_API_URL}/${NCB_PROJECT_ID}/tables/${collection}/records`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${NCB_API_KEY}`,
          },
          body: JSON.stringify(sealedDocument),
        }
      );
      if (!res.ok) throw new Error(`NCBDB 寫入失敗: ${res.statusText}`);
      return await res.json();
    }

    // 本地/免費路徑：回傳已封印的物件，不對外發送
    return { id: crypto.randomBytes(8).toString('hex'), ...sealedDocument };
  },
};
