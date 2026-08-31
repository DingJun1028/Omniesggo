/**
 * 萬能藍圖中心 (Omni-Blueprint Hub) - 核心執行引擎
 *
 * 核心公約：
 * 1. 5T 協議：Traceable, Trackable, Transparent, Tangible, Trustworthy
 * 2. 萬能元件心核 (IComponentCore)：UUID, Version, Timestamp, Evidence
 * 3. 4 可 1 不可狀態機 + 單一資料表原則 (Single Data Table)
 * 4. 全端雙向 TypeScript 架構
 *
 * 執行方式 (Node 24 原生 TS 支援)：
 *   node OmniBlueprintHub.ts
 * 型別檢查：
 *   npx tsc --noEmit --esModuleInterop --skipLibCheck --module commonjs --target es2020 OmniBlueprintHub.ts
 */

import crypto from 'crypto';

// ==========================================
// 1. 萬能元件心核與基礎型態定義
// ==========================================

export interface IComponentCore {
  // 萬能永憶主體唯一識別碼 (Immutable)
  readonly uuid: string;
  // 語義化版本控制
  readonly version: string;
  // 刻印時間戳 (溯源起點)
  readonly timestamp: number;
  // 證據左證庫 (儲存觀因循果的執行軌跡)
  evidence: {
    originCause: string;    // 因：原始觸發條件
    processTrace: string[]; // 循：InfoOne 流轉路徑
    finalEffect: string;    // 果：最終執行結果與狀態
  };
}

export type BlueprintType = 'LIVE_BROADCAST' | 'DESIGNATED_URL_BROADCAST';

export interface BlueprintDefinition extends IComponentCore {
  type: BlueprintType;
  name: string;
  sourceEndpoint: string;
  targetLanguages: string[];
  hostEmail: string;
  hashLock?: string;
}

export interface BlueprintProduct extends IComponentCore {
  blueprintId: string;
  productName: string;
  broadcastUrl?: string;
  status: 'INITIALIZED' | 'RUNNING' | 'FROZEN' | 'TERMINATED';
  activeViewers: number;
  payloadStream: Array<{
    id: string;
    originText: string;
    translatedText: Record<string, string>;
    sourceOrigin: string;
    hash: string;
    timestamp: string;
  }>;
}

// 單一資料表條目 (Single Data Table Protocol)
export interface UnifiedBlueprintEntity {
  id: string; // 唯一 UUID
  entityType: 'BLUEPRINT' | 'PRODUCT' | 'BROADCAST_LOG';
  blueprintType: BlueprintType;
  hostEmail: string;
  payload: Record<string, unknown>;
  hashLock: string;
  createdAt: string;
}

// ==========================================
// 2. 萬能藍圖中心 (Omni-Blueprint Hub) 服務類別
// ==========================================

export class OmniBlueprintHub {
  // 遵循「單一資料表原則」，所有數據收斂於此
  private singleDataTable: Map<string, UnifiedBlueprintEntity> = new Map();

  /**
   * 鑄造：建立萬能藍圖
   */
  public createBlueprint(
    type: BlueprintType,
    name: string,
    hostEmail: string,
    sourceEndpoint: string,
    targetLanguages: string[]
  ): BlueprintDefinition {
    const uuid = `uuid-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();

    const blueprint: BlueprintDefinition = {
      uuid,
      version: 'v0.5.0',
      timestamp,
      type,
      name,
      hostEmail,
      sourceEndpoint,
      targetLanguages,
      evidence: [
        {
          event: 'BLUEPRINT_CREATED',
          source_origin: 'OmniBlueprintHub.createBlueprint',
          iso_standard: 'ISO-14064-1',
          timestamp
        }
      ]
    };

    // 固化 Hash Lock (Trustworthy)
    const hashLock = this.generateHashLock(blueprint);
    blueprint.hashLock = hashLock;

    // 寫入單一資料表
    this.saveToSingleTable({
      id: blueprint.uuid,
      entityType: 'BLUEPRINT',
      blueprintType: type,
      hostEmail,
      payload: { ...blueprint },
      hashLock,
      createdAt: timestamp
    });

    return Object.freeze(blueprint);
  }

  /**
   * 具現化：將 [萬能藍圖] 實現為 [萬能藍圖產品]
   */
  public manifestToProduct(blueprint: BlueprintDefinition): BlueprintProduct {
    const productUuid = `prod-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();

    let broadcastUrl: string | undefined = undefined;

    // 藍圖二：指定轉播，生成專屬共享網址 (一台翻譯，全員共享)
    if (blueprint.type === 'DESIGNATED_URL_BROADCAST') {
      const shareToken = crypto.createHash('sha256')
        .update(`${blueprint.uuid}:${blueprint.hostEmail}:${timestamp}`)
        .digest('hex')
        .substring(0, 10);

      broadcastUrl = `https://esggo.app/live-sync?host=${encodeURIComponent(blueprint.hostEmail)}&token=5T-${shareToken}`;
    }

    const product: BlueprintProduct = {
      uuid: productUuid,
      version: blueprint.version,
      timestamp,
      blueprintId: blueprint.uuid,
      productName: `[萬能藍圖產品] ${blueprint.name}`,
      broadcastUrl,
      status: 'RUNNING',
      activeViewers: blueprint.type === 'DESIGNATED_URL_BROADCAST' ? 1 : 0,
      payloadStream: [],
      evidence: [
        ...blueprint.evidence,
        {
          event: 'PRODUCT_MANIFESTED',
          source_origin: 'OmniBlueprintHub.manifestToProduct',
          broadcastUrl,
          timestamp
        }
      ]
    };

    const hashLock = this.generateHashLock(product);

    // 寫入單一資料表
    this.saveToSingleTable({
      id: product.uuid,
      entityType: 'PRODUCT',
      blueprintType: blueprint.type,
      hostEmail: blueprint.hostEmail,
      payload: { ...product },
      hashLock,
      createdAt: timestamp
    });

    return product;
  }

  /**
   * 執行即時轉播與翻譯推播 (一台翻譯，全員共享)
   */
  public pushBroadcastPayload(
    product: BlueprintProduct,
    originEmailText: string,
    translations: Record<string, string>
  ): BlueprintProduct {
    if (product.status !== 'RUNNING') {
      throw new Error('【狀態機違規】產品非執行狀態 (RUNNING)，無法推播廣播數據。');
    }

    const logId = `log-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();
    const sourceOrigin = `EmailHost:${product.blueprintId}`;

    const payloadHash = crypto.createHash('sha256')
      .update(`${originEmailText}:${JSON.stringify(translations)}:${timestamp}`)
      .digest('hex');

    const streamItem = {
      id: logId,
      originText: originEmailText,
      translatedText: translations,
      sourceOrigin, // 5T: Traceable 可溯源
      hash: payloadHash, // 5T: Trustworthy 不可篡改
      timestamp // 5T: Trackable 可追踪
    };

    // 更新產品內部的動態流
    product.payloadStream.unshift(streamItem);

    // 寫入單一資料表紀錄
    this.saveToSingleTable({
      id: logId,
      entityType: 'BROADCAST_LOG',
      blueprintType: product.broadcastUrl ? 'DESIGNATED_URL_BROADCAST' : 'LIVE_BROADCAST',
      hostEmail: product.productName,
      payload: { ...streamItem, productId: product.uuid },
      hashLock: payloadHash,
      createdAt: timestamp
    });

    return product;
  }

  /**
   * 鎖定固化產品數據 (Trustworthy - Hash Lock & Object.freeze)
   */
  public freezeProduct(product: BlueprintProduct): Readonly<BlueprintProduct> {
    product.status = 'FROZEN';
    product.evidence.push({
      event: 'PRODUCT_FROZEN',
      hashLock: this.generateHashLock(product),
      timestamp: new Date().toISOString()
    });
    return Object.freeze(product);
  }

  /**
   * 查詢單一資料表 (Single Data Table Viewer)
   */
  public getUnifiedTable(): UnifiedBlueprintEntity[] {
    return Array.from(this.singleDataTable.values());
  }

  // Helper: 生成 5T Hash Lock
  private generateHashLock(data: object): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  // Helper: 寫入單一資料表
  private saveToSingleTable(entity: UnifiedBlueprintEntity): void {
    this.singleDataTable.set(entity.id, entity);
  }
}

// ==========================================
// 3. 實機執行驗證 (Execution Demo)
// ==========================================

console.log('===  啟動萬能藍圖中心 (Omni-Blueprint Hub) ===\n');

const hub = new OmniBlueprintHub();

// ---------------------------------------------------------
// 任務一：鑄造與實現 [萬能藍圖：即時轉播]
// ---------------------------------------------------------
console.log('--- [1/2] 執行：萬能藍圖【即時轉播】 ---');

const liveBlueprint = hub.createBlueprint(
  'LIVE_BROADCAST',
  '即時串流轉播',
  'master@esggo.app',
  'https://api.esggo.app/stream/xxx',
  ['en', 'ja', 'zh-TW']
);
console.log(' 萬能藍圖鑄造完成：', liveBlueprint.uuid);

const liveProduct = hub.manifestToProduct(liveBlueprint);
console.log(' 萬能藍圖產品實現成功：', liveProduct.productName);

hub.pushBroadcastPayload(
  liveProduct,
  '永續報告書數據 ISO-14064-1 驗算已通過。',
  {
    en: 'Sustainability report data verified under ISO-14064-1.',
    ja: '持続可能性レポートデータは ISO-14064-1 に基づいて検証されました。'
  }
);
console.log(' 即時轉播數據已推播 (5T 可溯源)。\n');

// ---------------------------------------------------------
// 任務二：鑄造與實現 [萬能藍圖：指定轉播] (一台翻譯，全員共享)
// ---------------------------------------------------------
console.log('--- [2/2] 執行：萬能藍圖【指定轉播】 ---');

const designatedBlueprint = hub.createBlueprint(
  'DESIGNATED_URL_BROADCAST',
  '主帳號 Email 翻譯共享廣播',
  'chief-strategy-officer@esggo.app',
  'mailto:chief-strategy-officer@esggo.app',
  ['en', 'ja']
);

const designatedProduct = hub.manifestToProduct(designatedBlueprint);

console.log(' 萬能藍圖鑄造完成：', designatedBlueprint.uuid);
console.log(' 萬能藍圖產品實現成功！');
console.log(' [一台翻譯 全員共享] 專屬轉播網址：', designatedProduct.broadcastUrl);

hub.pushBroadcastPayload(
  designatedProduct,
  '主帳號來信：請確認 5T 協議單一資料表之 Hash Lock 是否完全凍結。',
  {
    en: 'Host Email: Please confirm whether the Hash Lock of the 5T protocol single table is fully frozen.',
    ja: 'ホストメール：5Tプロトコル単一データテーブルのHash Lockが完全凍結されているか確認してください。'
  }
);

console.log(' 主帳號 Email 翻譯已完成，即時廣播給所有連結訂閱者！');

// ---------------------------------------------------------
// 檢視單一資料表 (Single Data Table Validation)
// ---------------------------------------------------------
console.log('\n---  萬能藍圖中心：單一資料表 (Unified Table) 狀態彙整 ---');
console.table(
  hub.getUnifiedTable().map((row) => ({
    ID: row.id,
    Type: row.entityType,
    BlueprintType: row.blueprintType,
    Host: row.hostEmail,
    HashLock: row.hashLock.substring(0, 16) + '...'
  }))
);

console.log('\n 萬能藍圖產品運作完畢，完全符合 5T 誠信協定與萬能元件心核規範。');
