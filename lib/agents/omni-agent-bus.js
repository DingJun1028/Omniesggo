// OmniAgentBus (OAB) – lightweight in-process event bus for the ESGGO ecosystem.
//
// 本檔為 CJS 單一正典實作，對應 lib/types/oab-types.ts 的 IOmniBus 契約。
//
// 合併說明（結構修復）：
//   本檔先前由兩份實作錯誤拼接而成 —— 前半段有 class 宣告與 `export const`
//   （ESM），後半段自 108 行起是一段脫離 class 的孤立方法區塊（頂層出現
//   `constructor()`），再接一個 CJS `module.exports`。三種模組語意混在單一檔案，
//   導致 `require()` 直接 SyntaxError: Unexpected token '{'。
//   現已合併為單一 class、統一 CJS，並保留兩側行為（見下方 API 清單）。
//
// API（呼叫端實際使用，勿隨意更動）：
//   publish / subscribe / registerBroadcastHook / unregisterBroadcastHook
//   getEvents / broadcastGlobalNotification / startAutonomy / stopAutonomy
//   writeEntry / readEntry / queryBlackboard / idleDuration
//   registerSelfHealHook / decideHealing
//
// 依賴說明：uuid 曾以 inline require('uuid') 呼叫，但該套件在安裝環境中
//   實際不存在（package.json 有宣告、node_modules 缺漏），會在執行期拋
//   MODULE_NOT_FOUND。改用 Node 內建 crypto.randomUUID()，零外部依賴。

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/** UUID helper — 內建 crypto.randomUUID，無外部依賴 */
function newUuid() {
  return crypto.randomUUID();
}

/** Maximum number of events kept in memory – can be overridden with env var */
const MAX_EVENTS = Number(process.env.OMNI_BUS_MAX_EVENTS || '200');
/** File where the ring buffer is persisted – resolved relative to HERMES_HOME */
const PERSIST_PATH = path.resolve(
  process.env.HERMES_HOME || path.resolve(__dirname, '../../..'),
  'omni-bus',
  'events.json'
);

// ==== 主類別 ==============================================================
class OmniAgentBus {
  constructor() {
    /** @type {EventEmitter} */
    this.emitter = new EventEmitter();
    /** @type {Array<{event:string,payload:any,ts:number}>} */
    this.events = [];
    /** @type {Set<Function>} */
    this.broadcastHooks = new Set();
    /** @type {Map<string, Object>} */
    this.blackboard = new Map();
    this.lastEventTimestamp = Date.now(); // track last publish
    this.autonomyTimer = null;
    this.persistTimer = null;
    this._loadPersisted();
  }

  /** Singleton accessor */
  static getInstance() {
    if (!OmniAgentBus._instance) {
      OmniAgentBus._instance = new OmniAgentBus();
    }
    return OmniAgentBus._instance;
  }

  // ---------- 事件發布 ----------
  publish(event, payload) {
    const ev = {
      uuid: newUuid(),
      version: '1.0.0',
      timestamp: Date.now(),
      event,
      payload,
    };
    this.lastEventTimestamp = ev.timestamp;

    // 環形緩衝（保持有界）
    this.events.push(ev);
    if (this.events.length > MAX_EVENTS) this.events.shift();

    // 同步訂閱者
    this.emitter.emit(event, payload);

    // 非同步廣播 hooks – fire-and-forget，逐個捕捉錯誤
    for (const hook of this.broadcastHooks) {
      try {
        const res = hook(ev);
        if (res && typeof res.then === 'function') {
          res.catch(err => console.error('[OmniAgentBus] broadcast hook error:', err));
        }
      } catch (err) {
        console.error('[OmniAgentBus] broadcast hook threw:', err);
      }
    }

    console.debug(`[OmniAgentBus] publish ${event}`, payload);
    this._schedulePersist();
    return ev;
  }

  // ---------- 訂閱（回傳取消函式） ----------
  subscribe(event, cb) {
    this.emitter.on(event, cb);
    return () => this.emitter.removeListener(event, cb);
  }

  registerBroadcastHook(hook) { this.broadcastHooks.add(hook); }
  unregisterBroadcastHook(hook) { this.broadcastHooks.delete(hook); }

  /**
   * 契約別名：lib/types/oab-types.ts 的 IOmniBus 宣告 registerHook(hook: OABHook)。
   * 既有 CJS 呼叫端（omni-agent-bus-hook.js）使用較早的 registerBroadcastHook 名稱，
   * 故兩者並存且指向同一組 hook —— 契約名為準，實作名保留相容。
   */
  registerHook(hook) { this.registerBroadcastHook(hook); }

  // ---------- 查詢 ----------
  /**
   * 事件時間欄位相容層：publish() 寫入的是 `timestamp`（IComponentCore 契約欄位），
   * 但舊版實作與磁碟上持久化的事件用的是 `ts`。若只讀 `e.ts`，afterTs 篩選會靜默
   * 回傳空陣列 —— 這正是 omni-agent-bus-hook.js 的擴充容 trigger 與 Slack 異常偵測
   * 依賴的 API。此處兩種欄位都接受，新舊事件皆可正確篩選。
   */
  getEvents({ limit, event, afterTs } = {}) {
    let filtered = this.events;
    if (event) filtered = filtered.filter(e => e.event === event);
    if (afterTs !== undefined) {
      filtered = filtered.filter(e => (e.timestamp ?? e.ts ?? 0) > afterTs);
    }
    if (limit !== undefined) filtered = filtered.slice(-limit);
    return filtered;
  }

  broadcastGlobalNotification(msg, context) {
    this.publish('system:global:sync', { msg, context });
  }

  // ---------- 取得閒置時間（毫秒） ----------
  idleDuration() {
    return Date.now() - this.lastEventTimestamp;
  }

  // ---------- 黑板 ----------
  writeEntry(entry) {
    this.blackboard.set(entry.uuid, entry);
    this.publish('blackboard:entry', entry);
  }

  readEntry(uuid) {
    return this.blackboard.get(uuid);
  }

  /** 依標籤 / 來源 / 時間範圍查詢黑板 */
  queryBlackboard({ tags, source_origin, from, to } = {}) {
    let out = Array.from(this.blackboard.values());
    if (source_origin) out = out.filter(e => e.source_origin === source_origin);
    if (tags && tags.length) out = out.filter(e => (e.tags || []).some(t => tags.includes(t)));
    if (from !== undefined) out = out.filter(e => e.timestamp >= from);
    if (to !== undefined) out = out.filter(e => e.timestamp <= to);
    return out;
  }

  // ---------- 自癒 Hook ----------
  registerSelfHealHook() {
    this.broadcastHooks.add(async ev => {
      if (ev.event !== 'system:error' && ev.event !== 'managed:mutation') return;
      const isManaged = ev.event === 'managed:mutation';
      const payload = ev.payload;
      console.debug('[OAB] 觸發自癒 Hook', ev.uuid, isManaged ? '(managed mutation)' : '');

      // 若為 managed mutation，視為輕微錯誤
      const errorInfo = isManaged
        ? { type: 'managed-mutation', target: payload.target, detail: payload.detail }
        : payload;

      const action = {
        uuid: newUuid(),
        version: '1.0.0',
        timestamp: Date.now(),
        source_origin: 'OAB-selfHeal',
        tags: ['heal'],
        evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
        payload: this.decideHealing(errorInfo),
      };

      // 寫入黑板
      this.writeEntry({
        uuid: action.uuid,
        version: action.version,
        timestamp: action.timestamp,
        source_origin: action.source_origin,
        tags: action.tags,
        payload: action.payload,
        evidence: action.evidence,
      });

      // 發布 heal 事件讓 OAG 執行
      this.publish('system:heal', action);
    });
  }

  /** 依錯誤類型產生修復指令（簡易範例） */
  decideHealing(err) {
    const { type, target } = err;
    switch (type) {
      case 'http-failure':
        return { action: 'retry', target, detail: { maxAttempts: 3 } };
      case 'fs-corrupt':
        return { action: 'rollback', target, detail: { backup: `${target}.bak` } };
      case 'process-killed':
        return { action: 'restart', target, detail: {} };
      case 'managed-mutation':
        // 輕微錯誤只需要 notify
        return { action: 'notify', target, detail: { message: 'Managed mutation observed' } };
      default:
        return { action: 'notify', target, detail: { message: err.message || 'unknown' } };
    }
  }

  // ---------- 自主心跳 ----------
  startAutonomy(intervalMs = 60_000) {
    if (this.autonomyTimer) return; // already running
    this.autonomyTimer = setInterval(() => {
      this.publish('system:autonomy:tick', { ts: Date.now() });
    }, intervalMs);
    if (typeof this.autonomyTimer.unref === 'function') this.autonomyTimer.unref();
    console.debug('[OmniAgentBus] autonomy started, intervalMs=', intervalMs);
  }

  stopAutonomy() {
    if (this.autonomyTimer) {
      clearInterval(this.autonomyTimer);
      this.autonomyTimer = null;
      console.debug('[OmniAgentBus] autonomy stopped');
    }
  }

  // ---------- Persistence ----------
  _schedulePersist() {
    if (this.persistTimer) return; // debounce
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      this._persistToDisk();
    }, 500);
    if (typeof this.persistTimer.unref === 'function') this.persistTimer.unref();
  }

  _persistToDisk() {
    try {
      const dir = path.dirname(PERSIST_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(PERSIST_PATH, JSON.stringify(this.events, null, 2), 'utf-8');
      console.debug('[OmniAgentBus] persisted', this.events.length, 'events to', PERSIST_PATH);
    } catch (err) {
      console.error('[OmniAgentBus] persist error:', err);
    }
  }

  _loadPersisted() {
    try {
      if (fs.existsSync(PERSIST_PATH)) {
        const raw = fs.readFileSync(PERSIST_PATH, 'utf-8');
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded)) {
          this.events = loaded.slice(-MAX_EVENTS);
          console.debug('[OmniAgentBus] loaded', this.events.length, 'events from', PERSIST_PATH);
        }
      }
    } catch (err) {
      console.error('[OmniAgentBus] load error:', err);
    }
  }
}

// 單例：供所有 CJS 呼叫端 require('./omni-agent-bus').omniBus
const omniBus = OmniAgentBus.getInstance();
omniBus.registerSelfHealHook();   // 立即註冊自癒 Hook

module.exports = {
  OmniAgentBus,
  omniBus,
};

// If this file is executed directly, start Autonomy ticker and keep the process alive
if (require.main === module) {
  omniBus.startAutonomy();
  console.debug('[OmniAgentBus] Autonomy started automatically on direct exec');
  process.stdin.resume();
}
