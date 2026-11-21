/* ============================================================
 * 萬能藍圖中心 - 前端共享資料模型 (IComponentCore)
 * 與 OmniBlueprintHub.ts 共用同一套心核規格 (5T + 單一資料表)
 * 純前端 in-memory 模擬，與後端 .ts 邏輯對齊。
 * ============================================================ */
(function (global) {
  'use strict';

  const crypto =
    global.crypto && global.crypto.subtle
      ? global.crypto
      : null;

  // 前端 Hash Lock (簡化版 sha256 via SubtleCrypto 非同步；此處用同步降級)
  function hashLock(data) {
    // 同步降級：避免依賴 async SubtleCrypto 阻塞渲染
    const str = JSON.stringify(data);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return ('00000000' + h.toString(16)).slice(-8) +
      ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }

  function uuid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx'.replace(/x/g, () =>
      ((Math.random() * 16) | 0).toString(16)
    );
  }

  const VERSION = 'v0.5.0';

  /** 萬能藍圖中心 (前端精簡版) — 對齊 OmniBlueprintHub.ts */
  class OmniBlueprintHub {
    constructor() {
      this.singleDataTable = new Map();
    }

    createBlueprint(type, name, hostEmail, sourceEndpoint, targetLanguages) {
      const id = 'uuid-' + uuid();
      const ts = new Date().toISOString();
      const blueprint = {
        uuid: id,
        version: VERSION,
        timestamp: ts,
        type,
        name,
        sourceEndpoint,
        targetLanguages,
        hostEmail,
        evidence: [{ event: 'BLUEPRINT_CREATED', source_origin: 'OmniBlueprintHub.createBlueprint', iso_standard: 'ISO-14064-1', timestamp: ts }]
      };
      blueprint.hashLock = hashLock(blueprint);
      this._save({ id, entityType: 'BLUEPRINT', blueprintType: type, hostEmail, payload: blueprint, hashLock: blueprint.hashLock, createdAt: ts });
      return Object.freeze(blueprint);
    }

    manifestToProduct(blueprint) {
      const pid = 'prod-' + uuid();
      const ts = new Date().toISOString();
      let broadcastUrl;
      if (blueprint.type === 'DESIGNATED_URL_BROADCAST') {
        const tok = hashLock({ u: blueprint.uuid, e: blueprint.hostEmail, t: ts }).slice(0, 10);
        broadcastUrl = 'https://esggo.app/live-sync?host=' + encodeURIComponent(blueprint.hostEmail) + '&token=5T-' + tok;
      }
      const product = {
        uuid: pid,
        version: blueprint.version,
        timestamp: ts,
        blueprintId: blueprint.uuid,
        productName: '[萬能藍圖產品] ' + blueprint.name,
        broadcastUrl,
        status: 'RUNNING',
        activeViewers: blueprint.type === 'DESIGNATED_URL_BROADCAST' ? 1 : 0,
        payloadStream: [],
        evidence: [
          ...blueprint.evidence,
          { event: 'PRODUCT_MANIFESTED', source_origin: 'OmniBlueprintHub.manifestToProduct', broadcastUrl, timestamp: ts }
        ]
      };
      const hl = hashLock(product);
      this._save({ id: pid, entityType: 'PRODUCT', blueprintType: blueprint.type, hostEmail: blueprint.hostEmail, payload: product, hashLock: hl, createdAt: ts });
      return product;
    }

    pushBroadcastPayload(product, originText, translations) {
      if (product.status !== 'RUNNING') throw new Error('【狀態機違規】產品非執行狀態');
      const logId = 'log-' + uuid();
      const ts = new Date().toISOString();
      const sourceOrigin = 'EmailHost:' + product.blueprintId;
      const h = hashLock({ o: originText, t: translations, ts });
      const item = { id: logId, originText, translatedText: translations, sourceOrigin, hash: h, timestamp: ts };
      product.payloadStream.unshift(item);
      this._save({
        id: logId,
        entityType: 'BROADCAST_LOG',
        blueprintType: product.broadcastUrl ? 'DESIGNATED_URL_BROADCAST' : 'LIVE_BROADCAST',
        hostEmail: product.productName,
        payload: Object.assign({}, item, { productId: product.uuid }),
        hashLock: h,
        createdAt: ts
      });
      return product;
    }

    getUnifiedTable() {
      return Array.from(this.singleDataTable.values());
    }

    _save(entity) {
      this.singleDataTable.set(entity.id, entity);
    }
  }

  global.OmniBlueprintHub = OmniBlueprintHub;
  global.OBH_VERSION = VERSION;
})(window);
