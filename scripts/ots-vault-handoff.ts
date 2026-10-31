/**
 * ots-vault-handoff v3 — 代理密碼一次性交接工具（OneTimeSecret API v2）
 *
 * 目的：使用者在本機以隱藏輸入方式建立 OneTimeSecret 一次性連結，
 *       密碼與通關密語永不進入對話與 shell history；代理讀取連結後，
 *       直接寫入祕密聖櫃（.env.secrets 或 Supabase vault 資料表），
 *       全程不在 stdout / 對話中顯示密碼明文。
 *
 * API 版本：v2（v1 /api/v1/* 已於 us 區域實測 404/405，全面改用 v2）：
 *   - 建立：POST /api/v2/secret/conceal（JSON body）
 *   - 讀取：POST /api/v2/secret/{identifier}/reveal（兩段式：先 metadata，再 continue:true 取值）
 *   - 狀態：GET  /api/v2/receipt/{identifier}（交付端以 receipt identifier 查核）
 *   - 銷毀：POST /api/v2/receipt/{identifier}/burn
 *   - 認證：HTTP Basic；使用者名稱為帳號 email 或 customer extid（ur 開頭）
 *
 * 強化項目：
 *   - TTY raw-mode 隱藏輸入（含倒退鍵、Ctrl-C 處理；非 TTY 自動退回 readline）
 *   - --passphrase 不帶值時自動以隱藏輸入詢問，密語不再進 shell history
 *   - SHA-256 指紋（前 12 hex）：send 端與 receive 端皆顯示，無需揭露明文即可交叉驗證
 *   - status 子命令：以 receipt identifier 查核連結狀態
 *   - burn 子命令：代理未讀取前可隨時銷毀連結
 *   - send --generate：以 node:crypto 本地產生高強度隨機密碼（不經第三方傳輸明文）
 *   - send --show：產生模式時於本機顯示一次明文（預設隱藏）
 *   - 前後空白偵測警告（密碼含首尾空白時明確提示，不靜默修改）
 *
 * 環境變數（本機或 VPS 注入，禁止寫入 repo）：
 *   OTS_EMAIL      — OneTimeSecret 帳號 email（或改設 OTS_CUSTOMER 為 ur 開頭 extid）
 *   OTS_API_TOKEN  — OneTimeSecret API Token
 *   OTS_REGION     — 選填，預設主站；可為 ca/eu/nz/uk/us
 *   SUPABASE_URL / SUPABASE_SERVICE_KEY — 僅 --target supabase 時需要
 *
 * 用法：
 *   npx tsx ots-vault-handoff.ts send [--ttl 3600] [--passphrase [密語]] [--generate] [--show]
 *   npx tsx ots-vault-handoff.ts receive --url <連結> --name <金鑰名稱>
 *        [--target env:<路徑>|supabase] [--passphrase [密語]]
 *   npx tsx ots-vault-handoff.ts status --receipt <receipt_identifier>
 *   npx tsx ots-vault-handoff.ts burn   --receipt <receipt_identifier> [--passphrase [密語]]
 *
 * 退出碼：0 成功；1 使用者錯誤／API 錯誤；130 Ctrl-C。
 */

import * as readline from "node:readline";
import * as crypto from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";

/* ------------------------------------------------------------------ */
/* 共用                                                                */
/* ------------------------------------------------------------------ */

interface OtsConfig {
  baseUrl: string; // https://[region.]onetimesecret.com/api/v2
  host: string; // https://[region.]onetimesecret.com
  authHeader: string;
}

function loadConfig(): OtsConfig {
  const user = process.env.OTS_CUSTOMER ?? process.env.OTS_EMAIL;
  const token = process.env.OTS_API_TOKEN;
  if (!user || !token) {
    console.error("錯誤：請先設定 OTS_EMAIL（或 OTS_CUSTOMER）與 OTS_API_TOKEN 環境變數。");
    process.exit(1);
  }
  const region = (process.env.OTS_REGION ?? "").trim().toLowerCase();
  const host = `https://${region ? `${region}.` : ""}onetimesecret.com`;
  return {
    host,
    baseUrl: `${host}/api/v2`,
    authHeader:
      "Basic " + Buffer.from(`${user}:${token}`, "utf8").toString("base64"),
  };
}

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith("--")) {
      out[key] = next;
      i++;
    } else {
      out[key] = true; // 不帶值 → 由後續邏輯決定是否隱藏輸入
    }
  }
  return out;
}

/** 解析 --passphrase：帶值 → 直接用；不帶值 → 隱藏輸入詢問；未出現 → undefined。 */
async function resolvePassphrase(
  args: Record<string, string | boolean>
): Promise<string | undefined> {
  const v = args["passphrase"];
  if (v === undefined) return undefined;
  if (typeof v === "string" && v !== "") return v;
  const p = await promptHidden("請輸入通關密語（代理讀取時需提供；輸入不回顯）：");
  return p || undefined;
}

/**
 * 互動式隱藏輸入。
 * TTY：raw-mode 逐鍵讀取，不回顯任何字元；支援倒退；Ctrl-C 即中止。
 * 非 TTY（管線/CI）：退回 readline（此情境下不適用隱藏輸入，呼叫方應注意）。
 */
function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) {
      const rl = readline.createInterface({ input: stdin, output: process.stdout });
      rl.question(question, (answer: string) => {
        rl.close();
        resolve(answer);
      });
      return;
    }
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    let buf = "";
    const onData = (ch: string) => {
      if (ch === "\r" || ch === "\n") {
        stdin.removeListener("data", onData);
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write("\n");
        resolve(buf);
      } else if (ch === "\u0003") {
        stdin.setRawMode(false);
        stdin.pause();
        process.stdout.write("\n");
        process.exit(130);
      } else if (ch === "\b" || ch === "\u007f") {
        if (buf.length > 0) buf = Array.from(buf).slice(0, -1).join("");
      } else if (ch >= " ") {
        buf += ch;
      }
    };
    stdin.on("data", onData);
  });
}

/** SHA-256 指紋（前 12 hex）：兩端可比對而無需揭露明文。 */
function fingerprint(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex").slice(0, 12);
}

/** 密碼含首尾空白時提出明確警告（不靜默修改，避免破壞含空格密碼）。 */
function warnWhitespace(label: string, value: string): void {
  if (value !== value.trim()) {
    console.warn(
      `警告：${label} 的首或尾含空白字元。若非刻意，請重新輸入；空白會被完整保留。`
    );
  }
}

/** v2 回應通例：{ record: { ... } }；防禦性取出。 */
function getRecord(data: unknown): Record<string, unknown> {
  if (data && typeof data === "object") {
    const rec = (data as Record<string, unknown>)["record"];
    if (rec && typeof rec === "object") return rec as Record<string, unknown>;
    return data as Record<string, unknown>;
  }
  return {};
}

function getIdentifiers(rec: Record<string, unknown>): {
  receiptId?: string;
  secretId?: string;
  secretShareUrl?: string;
  receiptShareUrl?: string;
} {
  const idOf = (o: unknown): string | undefined => {
    if (!o || typeof o !== "object") return undefined;
    const r = o as Record<string, unknown>;
    for (const k of ["identifier", "key", "shortid"]) {
      const v = r[k];
      if (typeof v === "string" && v) return v;
    }
    return undefined;
  };
  const urlOf = (o: unknown): string | undefined => {
    if (!o || typeof o !== "object") return undefined;
    const r = o as Record<string, unknown>;
    for (const k of ["share_url", "url", "link"]) {
      const v = r[k];
      if (typeof v === "string" && v) return v;
    }
    return undefined;
  };
  return {
    receiptId: idOf(rec["receipt"]),
    secretId: idOf(rec["secret"]),
    secretShareUrl: urlOf(rec["secret"]),
    receiptShareUrl: urlOf(rec["receipt"]),
  };
}

/* ------------------------------------------------------------------ */
/* send — 建立一次性密文連結（使用者本機）                                */
/* ------------------------------------------------------------------ */

function generateRandomSecret(length: number): string {
  // 多取隨機位元組再經 SHA-256 均勻化，截斷至指定長度
  const bytes = crypto.randomBytes(64);
  return crypto.createHash("sha256").update(bytes).digest("base64url").slice(0, length);
}

async function cmdSend(argv: string[]): Promise<void> {
  const cfg = loadConfig();
  const args = parseArgs(argv);
  const ttl = String(args["ttl"] ?? "3600");
  if (!/^\d+$/.test(ttl) || Number(ttl) <= 0) {
    console.error("錯誤：--ttl 必須為正整數（秒）。");
    process.exit(1);
  }
  const passphrase = await resolvePassphrase(args);

  let secret: string;
  let generated = false;
  if (args["generate"] === true) {
    const length = Math.min(Math.max(Number(args["length"] ?? 24), 12), 128);
    secret = generateRandomSecret(length);
    generated = true;
    if (args["show"] === true) {
      console.log(`已本地產生 ${length} 字元隨機密碼（僅顯示此次）：${secret}`);
    } else {
      console.log(`已本地產生 ${length} 字元隨機密碼（未顯示明文）。`);
    }
  } else {
    secret = await promptHidden("請輸入要交給代理的密碼（輸入不回顯）：");
    if (!secret) {
      console.error("錯誤：密碼不可為空。");
      process.exit(1);
    }
    warnWhitespace("密碼", secret);
  }

  // v2 conceal：JSON body，巢狀於 secret 物件內
  const secretPayload: Record<string, unknown> = {
    kind: "conceal",
    secret,
    ttl: Number(ttl),
  };
  if (passphrase) secretPayload["passphrase"] = passphrase;

  const res = await fetch(`${cfg.baseUrl}/secret/conceal`, {
    method: "POST",
    headers: {
      Authorization: cfg.authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ secret: secretPayload }),
  });
  if (!res.ok) {
    console.error(`錯誤：建立密文失敗（HTTP ${res.status}）。`);
    process.exit(1);
  }
  const rec = getRecord(await res.json());
  const ids = getIdentifiers(rec);
  if (!ids.secretId) {
    console.error("錯誤：回應缺少 secret identifier。");
    process.exit(1);
  }

  const shareUrl = ids.secretShareUrl ?? `${cfg.host}/secret/${ids.secretId}`;
  console.log("一次性連結（僅可檢視一次，檢視後自毀）：");
  console.log(shareUrl);
  console.log(`SHA-256 指紋（前 12 hex）：${fingerprint(secret)}`);
  if (passphrase) console.log("提醒：代理需另行取得通關密語（請勿與連結同一管道傳遞）。");
  if (generated && args["show"] !== true) {
    console.log("提醒：產生模式未顯示明文；該密碼僅存在於此連結，無法再次取得。");
  }
  console.log(`receipt identifier（請自行留存，用於 status / burn）：${ids.receiptId ?? "(未回傳)"}`);
}

/* ------------------------------------------------------------------ */
/* receive — 讀取連結並寫入聖櫃（代理 / 收件端）                          */
/* ------------------------------------------------------------------ */

interface RevealResponse {
  show_secret?: boolean;
  secret_value?: string;
  details?: unknown;
}

/**
 * v2 兩段式 reveal：
 *   第一次（不帶 continue）→ 回 metadata（show_secret:false），不毀滅紀錄；
 *   第二次（continue:"true"）→ 回 secret_value，紀錄即毀（再呼 404）。
 * 防呆：若第一次回應已直接含 secret_value，則直接使用，不重呼。
 */
async function fetchSecret(
  cfg: OtsConfig,
  secretId: string,
  passphrase?: string
): Promise<string> {
  const headers: Record<string, string> = {
    Authorization: cfg.authHeader,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const call = async (body: Record<string, unknown>) => {
    const res = await fetch(`${cfg.baseUrl}/secret/${secretId}/reveal`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (res.status === 404) {
      console.error("錯誤：連結已失效（已被檢視、銷毀或過期）。");
      process.exit(1);
    }
    if (!res.ok) {
      console.error(`錯誤：讀取密文失敗（HTTP ${res.status}）。`);
      process.exit(1);
    }
    return getRecord(await res.json()) as Record<string, unknown> & RevealResponse;
  };

  const first: Record<string, unknown> = {};
  if (passphrase) first["passphrase"] = passphrase;
  const meta = await call(first);

  if (typeof meta.secret_value === "string" && meta.secret_value) {
    return meta.secret_value;
  }
  if (meta.show_secret !== false) {
    console.error("錯誤：第一次 reveal 未回傳預期的 metadata（show_secret:false）。");
    process.exit(1);
  }

  const second: Record<string, unknown> = { continue: "true" };
  if (passphrase) second["passphrase"] = passphrase;
  const full = await call(second);

  if (typeof full.secret_value !== "string" || !full.secret_value) {
    console.error("錯誤：回應缺少密文值（secret_value）。");
    process.exit(1);
  }
  return full.secret_value;
}

/** 原子寫入 env 檔：更新單一 KEY，保留其他行與註解，永不列印值。 */
async function writeEnvFile(
  envPath: string,
  keyName: string,
  secret: string
): Promise<void> {
  const abs = path.resolve(envPath);
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(keyName)) {
    console.error("錯誤：--name 必須是合法的環境變數名稱（例：GROQ_API_KEY）。");
    process.exit(1);
  }
  let lines: string[] = [];
  try {
    lines = (await fs.readFile(abs, "utf8")).split("\n");
  } catch {
    /* 檔案不存在則新建 */
  }
  const prefix = `${keyName}=`;
  const idx = lines.findIndex(
    (l) => l.startsWith(prefix) || l.startsWith(`export ${prefix}`)
  );
  const newline = `${keyName}=${secret}`;
  if (idx >= 0) lines[idx] = newline;
  else lines.push(newline);

  const tmp = `${abs}.tmp-${process.pid}`;
  await fs.writeFile(tmp, lines.join("\n") + "\n", { mode: 0o600 });
  await fs.rename(tmp, abs);
}

/** 寫入 Supabase 祕密聖櫃資料表（須先建表，見檔尾附註）。 */
async function writeSupabaseVault(
  keyName: string,
  secret: string
): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("錯誤：--target supabase 需要 SUPABASE_URL 與 SUPABASE_SERVICE_KEY。");
    process.exit(1);
  }
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/vault_secrets`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      name: keyName,
      secret,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    console.error(`錯誤：寫入 Supabase 聖櫃失敗（HTTP ${res.status}）。`);
    process.exit(1);
  }
}

async function cmdReceive(argv: string[]): Promise<void> {
  const cfg = loadConfig();
  const args = parseArgs(argv);
  const url = typeof args["url"] === "string" ? String(args["url"]) : "";
  const keyName = typeof args["name"] === "string" ? String(args["name"]) : "";
  const passphrase = await resolvePassphrase(args);
  const target =
    typeof args["target"] === "string" ? String(args["target"]) : "env:.env.secrets";

  if (!url || !keyName) {
    console.error("錯誤：需要 --url 與 --name。");
    process.exit(1);
  }
  const m = url.match(/\/secret\/([a-z0-9]+)/i);
  if (!m) {
    console.error("錯誤：無法從 --url 解析出 secret identifier。");
    process.exit(1);
  }

  // 讀取即自毀：成功取得 secret_value 之後連結立即失效
  let secret = await fetchSecret(cfg, m[1]!, passphrase);

  // v2 實測：secret_value 可能含前導換行雜訊；僅剝離首尾 CR/LF，其餘空白完整保留並警告
  const cleaned = secret.replace(/^[\r\n]+/, "").replace(/[\r\n]+$/, "");
  if (cleaned !== secret) {
    console.warn("注意：已剝離回應值首尾的換行雜訊（v2 API 已知現象）。");
    secret = cleaned;
  }

  console.log(`SHA-256 指紋（前 12 hex）：${fingerprint(secret)}（請與交付端比對）`);
  warnWhitespace("密文", secret);

  if (target === "supabase") {
    await writeSupabaseVault(keyName, secret);
    console.log(`已寫入 Supabase 聖櫃：${keyName}（值未顯示）`);
  } else {
    const envPath = target.startsWith("env:") ? target.slice(4) : target;
    await writeEnvFile(envPath, keyName, secret);
    console.log(`已寫入 ${envPath}：${keyName}（值未顯示）`);
  }
  console.log("提醒：連結已自毀，密碼未在任何輸出中顯示。");
}

/* ------------------------------------------------------------------ */
/* status / burn — 連結狀態查核與主動銷毀（交付端留存 receipt identifier）  */
/* ------------------------------------------------------------------ */

async function cmdStatus(argv: string[]): Promise<void> {
  const cfg = loadConfig();
  const args = parseArgs(argv);
  const rid = typeof args["receipt"] === "string" ? String(args["receipt"]) : "";
  if (!rid) {
    console.error("錯誤：需要 --receipt（v2 以 receipt identifier 查核，取代 v1 metadata_key）。");
    process.exit(1);
  }
  const res = await fetch(`${cfg.baseUrl}/receipt/${rid}`, {
    headers: { Authorization: cfg.authHeader, Accept: "application/json" },
  });
  if (!res.ok) {
    console.error(`錯誤：查核失敗（HTTP ${res.status}）。receipt identifier 可能已過期。`);
    process.exit(1);
  }
  const rec = getRecord(await res.json());
  const stateText: Record<string, string> = {
    new: "未讀取（連結仍有效）",
    viewed: "已被讀取（已自毀）",
    burned: "已主動銷毀",
    expired: "已過期",
  };
  const s = typeof rec["state"] === "string" ? rec["state"] : "";
  console.log(`狀態：${stateText[s] ?? (s || "(未知)")}`);
  for (const [field, label] of [
    ["received", "讀取時間"],
    ["burned", "銷毀時間"],
    ["created", "建立時間"],
    ["updated", "更新時間"],
  ] as const) {
    const v = rec[field];
    if (typeof v === "string" && v) {
      const t = new Date(v);
      console.log(`${label}：${isNaN(t.getTime()) ? v : t.toISOString()}`);
    }
  }
  const ids = getIdentifiers(rec);
  if (ids.secretId) console.log(`對應 secret identifier：${ids.secretId}`);
}

async function cmdBurn(argv: string[]): Promise<void> {
  const cfg = loadConfig();
  const args = parseArgs(argv);
  const rid = typeof args["receipt"] === "string" ? String(args["receipt"]) : "";
  const passphrase = await resolvePassphrase(args);
  if (!rid) {
    console.error("錯誤：需要 --receipt。");
    process.exit(1);
  }
  const body: Record<string, unknown> = {};
  if (passphrase) body["passphrase"] = passphrase;
  const res = await fetch(`${cfg.baseUrl}/receipt/${rid}/burn`, {
    method: "POST",
    headers: {
      Authorization: cfg.authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`錯誤：銷毀失敗（HTTP ${res.status}）。`);
    process.exit(1);
  }
  const rec = getRecord(await res.json());
  const s = typeof rec["state"] === "string" ? rec["state"] : "";
  console.log(`已銷毀。狀態：${s || "(未回傳)"}`);
}

/* ------------------------------------------------------------------ */
/* 進入點                                                              */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "send") return cmdSend(rest);
  if (cmd === "receive") return cmdReceive(rest);
  if (cmd === "status") return cmdStatus(rest);
  if (cmd === "burn") return cmdBurn(rest);
  console.error(
    "用法：ots-vault-handoff.ts send [--ttl 秒] [--passphrase [密語]] [--generate] [--show]\n" +
      "      ots-vault-handoff.ts receive --url <連結> --name <金鑰名稱> [--target env:<路徑>|supabase] [--passphrase [密語]]\n" +
      "      ots-vault-handoff.ts status --receipt <receipt_identifier>\n" +
      "      ots-vault-handoff.ts burn   --receipt <receipt_identifier> [--passphrase [密語]]"
  );
  process.exit(cmd ? 1 : 0);
}

main().catch((e: unknown) => {
  console.error(`未預期錯誤：${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});

/* ------------------------------------------------------------------ */
/* 附註：Supabase 聖櫃資料表（一次性建立）                                */
/* ------------------------------------------------------------------ */
/*
create table if not exists vault_secrets (
  name        text primary key,
  secret      text not null,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
alter table vault_secrets enable row level security;
-- 僅允許 service role 存取，不建立任何 public policy。
-- 生產環境建議改用 Supabase Vault 擴充（pgsodium / vault.schema）加密儲存。
*/
