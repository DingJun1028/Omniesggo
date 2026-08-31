// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * Cloudflare R2 — S3 相容物件儲存適配器（零依賴，自簽 SigV4）
 * ---------------------------------------------------------------------------
 * ⚠️ 帳戶 API 令牌 vs R2 API token（關鍵區分）：
 *    R2 操作使用的是「R2 API token」(Access Key ID + Secret Access Key)，
 *    「不是」帳戶 API 令牌（cfat_）。兩者不同體系。
 *    R2 在帳戶令牌相容性矩陣為 ✅，但那是「能透過帳戶層管理 R2 設定」，
 *    實際讀寫物件仍需 R2 API token。建立路徑：
 *      Dashboard → R2 → Manage R2 API tokens → Create API token
 *    權限請用最小集合（例如僅 <Bucket> 的 Edit/Read）。
 *
 * 設計原則：
 *  - 零新依賴：用 Web Crypto（globalThis.crypto.subtle）+ fetch 自簽 AWS SigV4。
 *  - 採用 UNSIGNED-PAYLOAD 變體（x-amz-content-sha256: UNSIGNED-PAYLOAD），
 *    適合靜態資源上傳（傳輸層已有 TLS 保護），避免大檔重算雜湊。
 *  - 僅後端使用，密鑰絕不經 NEXT_PUBLIC_*。
 *
 * 參考：https://developers.cloudflare.com/r2/api/s3/api/
 *       https://developers.cloudflare.com/r2/api/s3/authentication/
 */

export interface R2Config {
  /** 帳號 ID（32 hex）。R2 endpoint 為 https://<accountId>.r2.cloudflarestorage.com */
  accountId: string;
  /** R2 API token 的 Access Key ID */
  accessKeyId: string;
  /** R2 API token 的 Secret Access Key */
  secretAccessKey: string;
  /** 自訂 S3 相容 endpoint（含 bucket 前綴的變體也可）；預設用 account 層 */
  endpoint?: string;
  region?: string;
}

export interface R2PutOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface R2ListEntry {
  key: string;
  size?: number;
  etag?: string;
  lastModified?: string;
}

function cfgFromEnv(): R2Config {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.CLOUDFLARE_R2_ACCOUNT_ID ?? "";
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? "";
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? "";
  if (!/^[a-f0-9]{32}$/i.test(accountId)) {
    throw new Error("[R2] CLOUDFLARE_R2_ACCOUNT_ID 未設定或格式不正確");
  }
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("[R2] CLOUDFLARE_R2_ACCESS_KEY_ID / CLOUDFLARE_R2_SECRET_ACCESS_KEY 未設定");
  }
  return { accountId, accessKeyId, secretAccessKey };
}

function endpointFor(cfg: R2Config): string {
  return cfg.endpoint ?? `https://${cfg.accountId}.r2.cloudflarestorage.com`;
}

// ── Web Crypto helpers ───────────────────────────────────────────────
const enc = new TextEncoder();

/** 複製成全新 ArrayBuffer 背書的 Uint8Array，滿足 crypto.subtle 的 BufferSource 約束 */
function toBuf(u: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(u.length);
  out.set(u);
  return out as Uint8Array<ArrayBuffer>;
}

function bufToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const keyBuf = key instanceof Uint8Array ? toBuf(key) : toBuf(new Uint8Array(key));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, toBuf(enc.encode(data)));
}

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", toBuf(enc.encode(data)));
  return bufToHex(digest);
}

async function deriveSigningKey(
  secret: string,
  dateStamp: string,
  region: string,
  service = "s3",
): Promise<Uint8Array> {
  let k = toBuf(enc.encode(secret));
  k = toBuf(new Uint8Array(await hmac(k, dateStamp)));
  k = toBuf(new Uint8Array(await hmac(k, region)));
  k = toBuf(new Uint8Array(await hmac(k, service)));
  k = toBuf(new Uint8Array(await hmac(k, "aws4_request")));
  return k;
}

async function signV4(
  method: string,
  url: URL,
  body: ArrayBuffer | Uint8Array,
  cfg: R2Config,
  region: string,
  extraHeaders: Record<string, string>,
): Promise<Record<string, string>> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = "UNSIGNED-PAYLOAD";

  const host = url.host;
  const signedHeadersList = ["host", "x-amz-content-sha256", "x-amz-date"];
  const headers: Record<string, string> = {
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...extraHeaders,
  };

  // 規範標頭（依字母排序、小寫、trim、合併）
  const canonicalHeaders = signedHeadersList
    .map((h) => `${h}:${headers[h].trim()}\n`)
    .join("");

  const canonicalRequest = [
    method,
    url.pathname + url.search,
    "",
    canonicalHeaders,
    signedHeadersList.join(";"),
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await deriveSigningKey(cfg.secretAccessKey, dateStamp, region, "s3");
  const signature = bufToHex(await hmac(signingKey, stringToSign));

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeadersList.join(";")}, Signature=${signature}`;

  return {
    ...extraHeaders,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    Authorization: authorization,
  };
}

async function requestR2(
  method: string,
  objectKey: string,
  cfg: R2Config,
  opts: { bucket: string; body?: ArrayBuffer | Uint8Array; query?: string; headers?: Record<string, string> } = { bucket: "" },
): Promise<Response> {
  const region = cfg.region ?? "auto";
  const base = endpointFor(cfg);
  const path = opts.bucket ? `/${opts.bucket}/${objectKey}` : `/${objectKey}`;
  const url = new URL(`${base}${path}${opts.query ? `?${opts.query}` : ""}`);
  const headers = await signV4(method, url, opts.body ?? new Uint8Array(), cfg, region, opts.headers ?? {});
  return fetch(url.toString(), {
    method,
    headers,
    body: opts.body ? opts.body as BodyInit : undefined,
  });
}

// ── 公開 API ──────────────────────────────────────────────────────────

export async function r2PutObject(
  bucket: string,
  key: string,
  data: ArrayBuffer | Uint8Array | string,
  opts: R2PutOptions = {},
  overrides?: Partial<R2Config>,
): Promise<{ ok: boolean; etag?: string; error?: string }> {
  try {
    const cfg = overrides ? { ...cfgFromEnv(), ...overrides } : cfgFromEnv();
    const body = typeof data === "string" ? enc.encode(data) : data;
    const headers: Record<string, string> = {};
    if (opts.contentType) headers["Content-Type"] = opts.contentType;
    if (opts.cacheControl) headers["Cache-Control"] = opts.cacheControl;
    if (opts.metadata) {
      for (const [k, v] of Object.entries(opts.metadata)) headers[`x-amz-meta-${k}`] = v;
    }
    const res = await requestR2("PUT", key, cfg, { bucket, body: body as Uint8Array, headers });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `R2 PUT HTTP ${res.status}: ${txt.slice(0, 300)}` };
    }
    return { ok: true, etag: res.headers.get("etag") ?? undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function r2GetObject(
  bucket: string,
  key: string,
  overrides?: Partial<R2Config>,
): Promise<{ ok: boolean; data?: ArrayBuffer; error?: string }> {
  try {
    const cfg = overrides ? { ...cfgFromEnv(), ...overrides } : cfgFromEnv();
    const res = await requestR2("GET", key, cfg, { bucket });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `R2 GET HTTP ${res.status}: ${txt.slice(0, 300)}` };
    }
    return { ok: true, data: await res.arrayBuffer() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function r2DeleteObject(
  bucket: string,
  key: string,
  overrides?: Partial<R2Config>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const cfg = overrides ? { ...cfgFromEnv(), ...overrides } : cfgFromEnv();
    const res = await requestR2("DELETE", key, cfg, { bucket });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `R2 DELETE HTTP ${res.status}: ${txt.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function r2ListObjects(
  bucket: string,
  prefix = "",
  overrides?: Partial<R2Config>,
): Promise<{ ok: boolean; objects?: R2ListEntry[]; error?: string }> {
  try {
    const cfg = overrides ? { ...cfgFromEnv(), ...overrides } : cfgFromEnv();
    const query = new URLSearchParams();
    if (prefix) query.set("prefix", prefix);
    const res = await requestR2("GET", "", cfg, { bucket, query: query.toString() });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `R2 LIST HTTP ${res.status}: ${txt.slice(0, 300)}` };
    }
    const xml = await res.text();
    const objects = parseS3List(xml);
    return { ok: true, objects };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function parseS3List(xml: string): R2ListEntry[] {
  const out: R2ListEntry[] = [];
  const re = /<Contents>([\s\S]*?)<\/Contents>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const block = m[1];
    const key = /<Key>(.*?)<\/Key>/.exec(block)?.[1] ?? "";
    const size = /<Size>(.*?)<\/Size>/.exec(block)?.[1];
    const etag = /<ETag>(.*?)<\/ETag>/.exec(block)?.[1];
    const last = /<LastModified>(.*?)<\/LastModified>/.exec(block)?.[1];
    if (key) out.push({ key, size: size ? Number(size) : undefined, etag, lastModified: last });
  }
  return out;
}
