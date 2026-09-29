/**
 * §20.4 OA-Team 蜂群 API 處理器 — 可測純邏輯層
 * [agent:01] [squad:omni] [lifecycle:dev] [p1]
 * 5T-Traceable: source_origin=code review finding (deleg_1fc8882c [MEDIUM] 測試複製品)
 * 5T-Transparent: 三個 handler 為純函式，不觸及 req/res，可直接被測試 import
 *
 * 存在理由：omni-server.mjs 頂層會啟動 HTTP/WS server 並在 GATEWAY_KEY 缺失時
 * process.exit，無法在測試中 import。把處理器抽出後，測試打的是「被測物本身」
 * 而非複製品 — 這是 code review 指出的方法論缺陷修法。
 */
import { ARRAYS, AGENTS, listAgents, inferAgentNum } from './oa-swarm-matrix.mjs';

export const OA_TASK_RING_MAX = 200;
export const OA_PROMPT_MAX = 8000;
export const OA_ARRAYS_MIN = 1;
export const OA_ARRAYS_MAX = 5;

/** 簽印佇列：條目 frozen，陣列本身為記憶體環緩衝（可 push/shift） */
export function createTaskLog(capacity = OA_TASK_RING_MAX) {
  const log = [];
  return {
    push(task) {
      log.push(task);
      if (log.length > capacity) log.shift();
      return log.length;
    },
    get length() { return log.length; },
    all() { return log.slice(); },
    capacity,
  };
}

/**
 * 驗證 array 參數。
 * 為何不能用 (Number(a) < 1 || Number(a) > 5)：NaN 的任何比較皆為 false，
 * 故 'abc' 會繞過；Number(true) === 1 會讓 boolean 被當成陣列 1。
 * 回傳 { ok, value, error } 而非拋錯，讓 handler 自行決定狀態碼。
 */
export function validateArrayParam(array) {
  if (array === undefined) return { ok: true, value: null };
  const n = typeof array === 'string' ? Number(array) : array;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < OA_ARRAYS_MIN || n > OA_ARRAYS_MAX) {
    return { ok: false, error: `array must be an integer ${OA_ARRAYS_MIN}-${OA_ARRAYS_MAX}` };
  }
  return { ok: true, value: n };
}

/** 驗證 prompt，回傳 { ok, error, status } */
export function validatePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return { ok: false, error: 'prompt body required (string)', status: 400 };
  }
  if (prompt.length > OA_PROMPT_MAX) {
    return {
      ok: false,
      error: `prompt too long: max ${OA_PROMPT_MAX} chars`,
      got: prompt.length,
      status: 413,
    };
  }
  return { ok: true };
}

/**
 * 陣列路由：先在指定陣列內依 prompt 能力關鍵字二次挑選，無命中才退回陣列第一位。
 * - arrayId 為 null → 交蜂后 (agent:01)
 * - 命中關鍵字但該代理不在指定陣列 → 退回陣列第一位（不越陣列）
 * - 未命中 → 陣列第一位代理
 * 這解決了「array=2 恆派編碼蜂」的語意缺陷：資料庫任務會派給 agent:10 萬能數據蜂。
 */
export function routeAgent(arrayId, prompt) {
  if (!arrayId) return AGENTS[0];
  const pool = AGENTS.filter((a) => a.arrayId === arrayId);
  if (pool.length === 0) return undefined;

  // 把候選限制在此陣列內再比對關鍵字。若不限定，`資安分析報告` 會先撞上
  // 表格較前的 `分析`(03) 而漏掉本陣列的 `資安`(27)。
  const num = inferAgentNum(prompt, new Set(pool.map((a) => a.id.slice(6))));
  if (num) {
    const hit = pool.find((a) => a.id === `agent:${num}`);
    if (hit) return hit;
  }
  return pool[0];
}

/** 建立簽印任務（frozen） */
export function buildTask({ prompt, arrayId, routed }) {
  // 隨機後綴避免同毫秒碰撞：Date.now().toString(36) 本身不保證唯一
  return Object.freeze({
    id: `task:${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`,
    prompt,
    array: arrayId,
    routedTo: routed.id,
    routedName: routed.name,
    status: 'dispatched',
    signed_by: 'Key-Ω',
    ts: Date.now(),
  });
}

/** WS 廣播 payload：WS 通道無認證，故不夾帶 prompt 原文 */
export function buildBroadcastPayload(task) {
  const previewLen = 40;
  const p = task.prompt.length > previewLen
    ? `${task.prompt.slice(0, previewLen)}…`
    // 短 prompt 若原樣送出等於完整外流，故一律遮蔽內容
    : `${'•'.repeat(Math.min(task.prompt.length, 12))}`;
  return {
    id: task.id,
    array: task.array,
    routedTo: task.routedTo,
    routedName: task.routedName,
    status: task.status,
    signed_by: task.signed_by,
    ts: task.ts,
    prompt_preview: p,
    prompt_length: task.prompt.length,
  };
}

/** GET /oa/status 處理器 */
export function handleOaStatus({ mem, uptimeSeconds, wsClients, totalErrors }) {
  return {
    ok: true,
    source_origin: 'oa-swarm-matrix',
    swarm_matrix: {
      arrays: ARRAYS.length,
      agents: AGENTS.length,
      queen: AGENTS[0].id,
    },
    array_health: ARRAYS.map((a) => ({
      id: a.id,
      name: a.name,
      range: a.range,
      focus: a.focus,
      agents: listAgents(a.id).length,
    })),
    task_queue: null, // 由呼叫端填入（依賴 taskLog 實例）
    gateway: {
      version: '3.0.0',
      uptime_seconds: uptimeSeconds,
      ws_clients: wsClients,
      errors: totalErrors,
      memory_mb: {
        heap: Number((mem.heapUsed / 1048576).toFixed(1)),
        rss: Number((mem.rss / 1048576).toFixed(1)),
      },
    },
    ts: Date.now(),
  };
}

/** GET /oa/agents 處理器 */
export function handleOaAgents(queryArray) {
  // 不可用 `|| 'all'`：0 與 '' 為 falsy，會被誤當成「未指定」而回全部 30 位
  const array = queryArray === undefined || queryArray === '' ? 'all' : queryArray;
  const list = listAgents(array);
  return {
    ok: true,
    source_origin: 'oa-swarm-matrix',
    filter: { array },
    total_arrays: ARRAYS.length,
    count: list.length,
    agents: list,
  };
}

/**
 * POST /oa/task/dispatch 處理器。
 * 回傳 { status, body }，由呼叫端直接 res.status(status).json(body)。
 */
export function handleDispatch({ body, taskLog }) {
  const { prompt, array } = body || {};

  const p = validatePrompt(prompt);
  if (!p.ok) return { status: p.status, body: { error: p.error, ...(p.got ? { got: p.got } : {}) } };

  const a = validateArrayParam(array);
  if (!a.ok) return { status: 400, body: { error: a.error } };

  const routed = routeAgent(a.value, prompt);
  if (!routed) return { status: 400, body: { error: 'no agent for array' } };

  const task = buildTask({ prompt, arrayId: a.value, routed });
  const depth = taskLog.push(task);

  return {
    status: 200,
    body: {
      ok: true,
      source_origin: 'oa-swarm-matrix',
      // 5T-Transparent: 本端點只做「簽印入列」，不實際執行任務。
      // dispatched = 已記錄並廣播，不代表任務已完成。
      dispatch_mode: 'queued_only',
      task,
      queue_depth: depth,
    },
    task,
  };
}
