// ============================================================
// OmniLive — 高耗能端點限流 / 併發閘
// 5T: Trustworthy — 公開部署時，單一 STT worker 與本地 LLM
// 不得被單一來源無限佔用。
// @ts-check
// ============================================================

/**
 * 為何需要「速率」而非只有「併發」：
 * /api/transcribe 已有 sttInflight 單飛守護，但那只限制同時進行中的
 * 請求數。攻擊者只要每 13 秒送一個請求，就能**永久**佔住唯一的
 * STT worker，正當主播每次都拿到 429 —— 這是持續性 DoS，比瞬間
 * 燒 CPU 更難察覺。併發閘擋不住這種模式，必須有速率閘。
 *
 * 金鑰與限流的關係（刻意的取捨）：
 * 瀏覽器端金鑰在架構上無法真正保護 —— caster 的頁面必須持有金鑰，
 * 任何 viewer 檢視原始碼即取得。因此 OMNILIVE_HOST_KEY 擋得住
 * 隨手路過的濫用，擋不住蓄意攻擊。
 * 限流是**與金鑰正交**的第二道防線，且在金鑰未設定（公開部署）
 * 時是唯一的防線。
 *
 * 為何「驗證通過就不限流」：
 * 已持有金鑰者是受信任的caster，限流只會在合法的長時直播中
 * 誤傷他們。限流的責任是**在沒有金鑰時**替系統守住資源。
 * @ts-check
 */

/**
 * 建立限流器。零依賴，滑動視窗 + 併發計數。
 *
 * @param {object} o
 * @param {number} o.limit      視窗內允許的請求數
 * @param {number} o.windowMs   滑動視窗長度 (ms)
 * @param {number} o.maxConcurrent 同時進行中的上限 (0 = 不限)
 * @param {number} o.globalMax  全域同時進行中上限 (0 = 不限)
 * @param {number} o.idleMs     多久沒活動就回收該 key 的狀態
 */
export function createRateLimiter({ limit, windowMs, maxConcurrent = 0, globalMax = 0, idleMs = 10 * 60_000 }) {
  /** @type {Map<string, {hits: number[], active: number, lastSeen: number}>} */
  const state = new Map();
  let globalActive = 0;

  /**
   * 回收長時間無活動的 key，避免以 IP 為鍵時 Map 無上限增長。
   *
   * 刻意**不**以 active===0 為前提：若呼叫端漏掉 release()（例外路徑
   * 忘了 finally），該 key 會被永久釘住，併發名額也永久洩漏 ——
   * 限流器自己就成了記憶體洩漏源。閒置超過 idleMs 的併發名額依定義
   * 已經是遺棄的，直接沒收。
   */
  function sweep(now) {
    for (const [k, s] of state) {
      if (now - s.lastSeen > idleMs) {
        globalActive -= s.active;
        if (globalActive < 0) globalActive = 0;
        state.delete(k);
      }
    }
  }

  function bucket(key) {
    let s = state.get(key);
    if (!s) { s = { hits: [], active: 0, lastSeen: Date.now() }; state.set(key, s); }
    s.lastSeen = Date.now();
    return s;
  }

  /**
   * 取得一次通行權。回傳 allowed=false 時呼叫端**不得**呼叫 release。
   * @param {string} key  通常是 client IP
   */
  function acquire(key) {
    const now = Date.now();
    sweep(now);
    const s = bucket(key);

    // 滑動視窗：丟掉視窗外的紀錄
    const cutoff = now - windowMs;
    s.hits = s.hits.filter((t) => t > cutoff);

    if (s.hits.length >= limit) {
      const oldest = s.hits[0];
      return { allowed: false, reason: 'rate', retryAfterMs: Math.max(0, oldest + windowMs - now) };
    }
    if (maxConcurrent > 0 && s.active >= maxConcurrent) {
      return { allowed: false, reason: 'concurrent', retryAfterMs: 1000 };
    }
    if (globalMax > 0 && globalActive >= globalMax) {
      return { allowed: false, reason: 'global', retryAfterMs: 1000 };
    }

    s.hits.push(now);
    s.active += 1;
    globalActive += 1;
    return { allowed: true, reason: null, retryAfterMs: 0 };
  }

  /** 釋放併發名額。與 acquire 配對。 */
  function release(key) {
    const s = state.get(key);
    if (!s) return;
    if (s.active > 0) { s.active -= 1; globalActive -= 1; }
  }

  return {
    acquire,
    release,
    /**
     * 手動觸發回收。sweep 採**延遲**策略（只在 acquire 時執行），
     * 因為週期性 timer 會讓 event loop 存活、拖住程序結束。
     * 若需要「完全無流量時也回收」，由外部排程呼叫本方法。
     */
    sweep: () => sweep(Date.now()),
    /** 測試/觀測用 */
    _stats: () => ({ keys: state.size, globalActive }),
  };
}

/**
 * 取可信的 client IP。
 * 注意：X-Forwarded-For 只有在**確實**位於反向代理後面才可信；
 * 公開直連時它可被偽造。此處一律採「左most 可解析項」並允許
 * 上層以 trustedProxy 選項關閉，避免限流被輕易繞過。
 * @param {import('node:http').IncomingMessage} req
 * @param {boolean} [trustedProxy] 是否信任 X-Forwarded-For
 */
export function clientIp(req, trustedProxy = true) {
  const sock = /** @type {any} */ (req.socket);
  if (trustedProxy) {
    const xff = (req.headers['x-forwarded-for'] || '').toString();
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  return (sock && (sock.remoteAddress || '').toString()) || 'unknown';
}
