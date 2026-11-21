import { Client } from '@notionhq/client';
import { CelestialController } from '@/lib/celestial/implementation';

export interface ISyncPayload {
  title: string;
  content: string;
  category: string;
}

/**
 * ✅ 將長文本分塊，確保每塊 ≤ 2000 字元（Notion API 限制）
 * 以換行符為分割優先點，避免截斷語義。
 */
function chunkContent(text: string, maxChunkSize = 1900): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let current = '';

  for (const line of lines) {
    // 若加上此行仍在上限內，繼續累積
    if ((current + '\n' + line).length <= maxChunkSize) {
      current = current ? current + '\n' + line : line;
    } else {
      // 此行加入會超過上限：先 push 當前 chunk
      if (current) chunks.push(current);
      // 若單行本身超過上限，強制分割
      if (line.length > maxChunkSize) {
        for (let i = 0; i < line.length; i += maxChunkSize) {
          chunks.push(line.slice(i, i + maxChunkSize));
        }
        current = '';
      } else {
        current = line;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export class NotionSyncService {
  private client: Client;
  private databaseId: string;
  private celestial = CelestialController.getInstance();

  constructor() {
    this.client = new Client({ auth: process.env.NOTION_API_KEY });
    this.databaseId = process.env.NOTION_DATABASE_ID || '';
  }

  /**
   * 同步 5T 合規資產至 Notion 知識庫
   * @param payload 知識資產內容
   */
  async syncAsset(payload: ISyncPayload): Promise<string> {
    const traceId = this.celestial.initiateFlow('NotionSync');
    
    if (!process.env.NOTION_API_KEY || !this.databaseId) {
      this.celestial.recordMetric('NotionSync.Skipped', 1, { reason: 'Missing Credentials' });
      return 'Skipped (Missing API Key or Database ID)';
    }

    try {
      // ✅ 修復：使用 chunkContent() 分塊，確保完整文件同步（無截斷）
      const contentChunks = chunkContent(payload.content);
      this.celestial.recordMetric('NotionSync.Chunks', contentChunks.length, { title: payload.title });

      const contentBlocks = contentChunks.map(chunk => ({
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [
            {
              type: 'text' as const,
              text: { content: chunk },
            },
          ],
        },
      }));

      const response = await this.client.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          Title: {
            title: [{ text: { content: payload.title } }],
          },
          Category: {
            select: { name: payload.category },
          },
          Status: {
            status: { name: 'Trustworthy' }, // 符合 5T 協議
          },
        },
        children: contentBlocks as Parameters<typeof this.client.pages.create>[0]['children'],
      });

      this.celestial.recordMetric('NotionSync.Success', 1, { pageId: response.id });
      return response.id;
    } catch (error) {
      this.celestial.detectEntropy(traceId, 'NotionAPIError');
      console.error('[NotionSyncService] Failed to sync to Notion:', error);
      throw error;
    }
  }
}
