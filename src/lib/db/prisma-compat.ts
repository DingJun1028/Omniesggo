/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// Supabase-backed Prisma-compat client
// ------------------------------------------------------------
// Supabase 全面取代 Prisma 後的資料層。保留 Prisma 的呼叫形狀
// (await prisma.<model>.<method>(args))，讓既有路由與服務不需改寫。
// 支援子集：findUnique / findFirst / findMany / create / createMany /
// update / updateMany / upsert / delete / deleteMany / count /
// $connect / $disconnect / $queryRaw / $executeRaw / $transaction
// 以及一層以上巢狀 include / select / where(AND/OR/in/gt/lt/gte/lte/contains)。
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── Model → Table mapping（Prisma 預設表名 = Model 名）──
// 可用環境變數 SUPABASE_TABLE_MAP (JSON) 覆寫個別表名。
const MODEL_TABLES: Record<string, string> = {
  regulation: 'Regulation',
  companyReport: 'CompanyReport',
  eSGTag: 'ESGTag',
  regulationTag: 'RegulationTag',
  reportTag: 'ReportTag',
  alertTag: 'AlertTag',
  universalTag: 'UniversalTag',
  tagPair: 'TagPair',
  crawlHistory: 'CrawlHistory',
  alert: 'Alert',
  pDFParseResult: 'PDFParseResult',
  notificationLog: 'NotificationLog',
  userGrowth: 'UserGrowth',
  achievement: 'Achievement',
  userAchievement: 'UserAchievement',
  growthTask: 'GrowthTask',
  userTask: 'UserTask',
  subscription: 'Subscription',
  dailyReport: 'DailyReport',
  dailyReportItem: 'DailyReportItem',
  omniMemory: 'OmniMemory',
  avatarContext: 'AvatarContext',
  omniTraceLog: 'OmniTraceLog',
  materialityAssessment: 'MaterialityAssessment',
  netZeroRoadmap: 'NetZeroRoadmap',
  supplyChainVendor: 'SupplyChainVendor',
  dataBridgeUpload: 'DataBridgeUpload',
  dataBridgeRecord: 'DataBridgeRecord',
};

// ── Relation metadata（供 include 使用）──
// modelKey.relKey → { table: 目標 modelKey, type: 'many'|'one', fk }
// many: 子表欄位 fk 指向本表 id；one: 本表欄位 fk 指向目標表 id。
const RELATIONS: Record<string, Record<string, { table: string; type: 'many' | 'one'; fk: string }>> = {
  regulation: {
    crawlHistory: { table: 'crawlHistory', type: 'many', fk: 'regulationId' },
    tags: { table: 'regulationTag', type: 'many', fk: 'regulationId' },
  },
  companyReport: {
    crawlHistory: { table: 'crawlHistory', type: 'many', fk: 'companyReportId' },
    tags: { table: 'reportTag', type: 'many', fk: 'reportId' },
  },
  eSGTag: {
    regulations: { table: 'regulationTag', type: 'many', fk: 'tagId' },
    reports: { table: 'reportTag', type: 'many', fk: 'tagId' },
    alerts: { table: 'alertTag', type: 'many', fk: 'tagId' },
  },
  regulationTag: {
    regulation: { table: 'regulation', type: 'one', fk: 'regulationId' },
    tag: { table: 'eSGTag', type: 'one', fk: 'tagId' },
  },
  reportTag: {
    report: { table: 'companyReport', type: 'one', fk: 'reportId' },
    tag: { table: 'eSGTag', type: 'one', fk: 'tagId' },
  },
  alertTag: {
    alert: { table: 'alert', type: 'one', fk: 'alertId' },
    tag: { table: 'eSGTag', type: 'one', fk: 'tagId' },
  },
  universalTag: {
    pairsAnchor: { table: 'tagPair', type: 'many', fk: 'anchorTagId' },
    pairsEvidence: { table: 'tagPair', type: 'many', fk: 'evidenceTagId' },
  },
  tagPair: {
    anchor: { table: 'universalTag', type: 'one', fk: 'anchorTagId' },
    evidence: { table: 'universalTag', type: 'one', fk: 'evidenceTagId' },
  },
  crawlHistory: {
    regulation: { table: 'regulation', type: 'one', fk: 'regulationId' },
    companyReport: { table: 'companyReport', type: 'one', fk: 'companyReportId' },
  },
  alert: {
    dailyReportItems: { table: 'dailyReportItem', type: 'many', fk: 'alertId' },
    notifications: { table: 'notificationLog', type: 'many', fk: 'alertId' },
    tags: { table: 'alertTag', type: 'many', fk: 'alertId' },
  },
  notificationLog: { alert: { table: 'alert', type: 'one', fk: 'alertId' } },
  userGrowth: {
    achievements: { table: 'userAchievement', type: 'many', fk: 'userId' },
    tasks: { table: 'userTask', type: 'many', fk: 'userId' },
    subscriptions: { table: 'subscription', type: 'many', fk: 'userId' },
    dailyReports: { table: 'dailyReport', type: 'many', fk: 'createdById' },
  },
  achievement: { users: { table: 'userAchievement', type: 'many', fk: 'achievementId' } },
  userAchievement: {
    user: { table: 'userGrowth', type: 'one', fk: 'userId' },
    achievement: { table: 'achievement', type: 'one', fk: 'achievementId' },
  },
  growthTask: { userTasks: { table: 'userTask', type: 'many', fk: 'taskId' } },
  userTask: {
    user: { table: 'userGrowth', type: 'one', fk: 'userId' },
    task: { table: 'growthTask', type: 'one', fk: 'taskId' },
  },
  subscription: { user: { table: 'userGrowth', type: 'one', fk: 'userId' } },
  dailyReport: {
    items: { table: 'dailyReportItem', type: 'many', fk: 'reportId' },
    createdBy: { table: 'userGrowth', type: 'one', fk: 'createdById' },
  },
  dailyReportItem: {
    report: { table: 'dailyReport', type: 'one', fk: 'reportId' },
    alert: { table: 'alert', type: 'one', fk: 'alertId' },
  },
  dataBridgeUpload: { records: { table: 'dataBridgeRecord', type: 'many', fk: 'uploadId' } },
  dataBridgeRecord: { upload: { table: 'dataBridgeUpload', type: 'one', fk: 'uploadId' } },
};

function tableFor(modelKey: string): string {
  const override = (() => {
    try { return JSON.parse(process.env.SUPABASE_TABLE_MAP || '{}'); } catch { return {}; }
  })() as Record<string, string>;
  return override[modelKey] || MODEL_TABLES[modelKey] || modelKey;
}

// ── Client 構造（優先 service role；anon 為後備）──
function resolveEnv(opts?: { url?: string; key?: string }) {
  const url = opts?.url || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    opts?.key ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  return { url, key };
}

function makeSupabase(opts?: { url?: string; key?: string }): SupabaseClient {
  const { url, key } = resolveEnv(opts);
  if (!url || !key) {
    throw new Error(
      '[db] Supabase 未設定：需要 SUPABASE_URL（或 NEXT_PUBLIC_SUPABASE_URL）與 SUPABASE_SERVICE_ROLE_KEY（或 SUPABASE_ANON_KEY）。',
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── where / orderBy 轉換 ──────────────────────────────────────
type AnyObj = Record<string, any>;

function applyWhere(q: any, where?: AnyObj): any {
  if (!where) return q;
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (key === 'AND' && Array.isArray(value)) {
      for (const sub of value) q = applyWhere(q, sub);
      continue;
    }
    if (key === 'OR' && Array.isArray(value)) {
      const parts: string[] = [];
      for (const sub of value) {
        const collected: string[] = [];
        collectFilters(sub, collected);
        parts.push(collected.length === 1 ? collected[0] : `and(${collected.join(',')})`);
      }
      if (parts.length) q = q.or(parts.join(','));
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const cond = value as AnyObj;
      if ('in' in cond) q = q.in(key, cond.in as any[]);
      if ('gt' in cond) q = q.gt(key, cond.gt as any);
      if ('lt' in cond) q = q.lt(key, cond.lt as any);
      if ('gte' in cond) q = q.gte(key, cond.gte as any);
      if ('lte' in cond) q = q.lte(key, cond.lte as any);
      if ('contains' in cond) q = q.ilike(key, `%${String(cond.contains)}%`);
      if ('not' in cond && cond.not !== undefined && typeof cond.not !== 'object') q = q.neq(key, cond.not);
      continue;
    }
    q = q.eq(key, value);
  }
  return q;
}

function collectFilters(where: AnyObj, out: string[]): void {
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (key === 'AND' && Array.isArray(value)) {
      const parts: string[] = [];
      for (const sub of value) collectFilters(sub, parts);
      out.push(`and(${parts.join(',')})`);
      continue;
    }
    if (key === 'OR' && Array.isArray(value)) {
      const parts: string[] = [];
      for (const sub of value) collectFilters(sub, parts);
      out.push(`or(${parts.join(',')})`);
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const cond = value as AnyObj;
      if ('in' in cond) out.push(`${key}.in.(${(cond.in as any[]).map((v) => String(v)).join(',')})`);
      if ('gt' in cond) out.push(`${key}.gt.${cond.gt}`);
      if ('lt' in cond) out.push(`${key}.lt.${cond.lt}`);
      if ('gte' in cond) out.push(`${key}.gte.${cond.gte}`);
      if ('lte' in cond) out.push(`${key}.lte.${cond.lte}`);
      if ('contains' in cond) out.push(`${key}.ilike.*${String(cond.contains)}*`);
      continue;
    }
    const v = typeof value === 'string' ? `"${value.replace(/"/g, '\\"')}"` : String(value);
    out.push(`${key}.eq.${v}`);
  }
}

function applyOrderBy(q: any, orderBy?: AnyObj | AnyObj[]): any {
  if (!orderBy) return q;
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
  for (const entry of entries) {
    for (const [field, dir] of Object.entries(entry)) {
      q = q.order(field, { ascending: dir !== 'desc' });
    }
  }
  return q;
}

// ── include 解析 ──────────────────────────────────────────────
async function attachIncludes(
  supa: SupabaseClient,
  modelKey: string,
  rows: AnyObj[],
  include?: AnyObj,
): Promise<void> {
  if (!include || rows.length === 0) return;

  // _count: { select: { <rel>: true } }
  if (include._count?.select) {
    const rels0 = RELATIONS[modelKey] || {};
    for (const [relKey, specRaw] of Object.entries(include._count.select)) {
      if (!specRaw) continue;
      const spec = (rels0[relKey] || {}) as { table: string; type: 'many' | 'one'; fk: string };
      if (!spec.table) continue;
      const relTable = tableFor(spec.table);
      const ids = rows.map((r) => r.id).filter(Boolean) as any[];
      if (ids.length === 0) {
        for (const r of rows) {
          if (!r._count) r._count = {};
          r._count[relKey] = 0;
        }
        continue;
      }
      const { data, error } = await supa.from(relTable).select(spec.fk).in(spec.fk, ids);
      const counts = new Map<string, number>();
      if (!error && data) {
        for (const row of data as AnyObj[]) {
          const k = String(row[spec.fk]);
          counts.set(k, (counts.get(k) || 0) + 1);
        }
      }
      for (const r of rows) {
        if (!r._count) r._count = {};
        r._count[relKey] = counts.get(String(r.id)) || 0;
      }
    }
  }

  const rels = RELATIONS[modelKey] || {};
  for (const [relKey, specRaw] of Object.entries(rels)) {
    const includeVal = include[relKey];
    if (!includeVal) continue;
    const spec = specRaw as { table: string; type: 'many' | 'one'; fk: string };
    const relTable = tableFor(spec.table);
    const subInclude =
      typeof includeVal === 'object' && includeVal !== null && !Array.isArray(includeVal)
        ? (includeVal as AnyObj).include
        : undefined;
    const subWhere =
      typeof includeVal === 'object' && includeVal !== null && !Array.isArray(includeVal)
        ? (includeVal as AnyObj).where
        : undefined;

    if (spec.type === 'many') {
      const ids = rows.map((r) => r.id).filter(Boolean);
      if (ids.length === 0) continue;
      let q = supa.from(relTable).select('*').in(spec.fk, ids as any[]);
      q = applyWhere(q, subWhere);
      const { data, error } = await q;
      if (error || !data) {
        for (const r of rows) r[relKey] = [];
        continue;
      }
      await attachIncludes(supa, spec.table, data as AnyObj[], subInclude);
      const byParent = new Map<string, AnyObj[]>();
      for (const child of data as AnyObj[]) {
        const pk = String(child[spec.fk]);
        if (!byParent.has(pk)) byParent.set(pk, []);
        byParent.get(pk)!.push(child);
      }
      for (const r of rows) r[relKey] = byParent.get(String(r.id)) || [];
    } else {
      const fks = [...new Set(rows.map((r) => r[spec.fk]).filter((v) => v !== null && v !== undefined))] as any[];
      if (fks.length === 0) {
        for (const r of rows) r[relKey] = null;
        continue;
      }
      let q = supa.from(relTable).select('*').in('id', fks);
      const { data, error } = await q;
      if (error || !data) {
        for (const r of rows) r[relKey] = null;
        continue;
      }
      await attachIncludes(supa, spec.table, data as AnyObj[], subInclude);
      const byId = new Map<string, AnyObj>();
      for (const row of data as AnyObj[]) byId.set(String(row.id), row);
      for (const r of rows) r[relKey] = r[spec.fk] ? byId.get(String(r[spec.fk])) || null : null;
    }
  }
}

function unwrap(result: { data: any; error: any }, what: string): any {
  if (result.error) {
    throw new Error(`[db] ${what} 失敗: ${result.error.message}`);
  }
  return result.data;
}

// ── Model delegate ────────────────────────────────────────────
class ModelDelegate {
  constructor(private supa: SupabaseClient, private modelKey: string) {}

  private get table() { return tableFor(this.modelKey); }
  private from() { return this.supa.from(this.table); }

  private flattenWhere(where: AnyObj): AnyObj {
    // 支援複合唯一鍵（如 userId_taskId: { userId, taskId }）
    const flat: AnyObj = {};
    for (const [key, value] of Object.entries(where || {})) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(key in ({} as any)) && typeof (value as AnyObj).in === 'undefined' && typeof (value as AnyObj).gt === 'undefined') {
        const o = value as AnyObj;
        if (Object.keys(o).length > 0 && Object.values(o).every((v) => typeof v !== 'object')) {
          Object.assign(flat, o);
          continue;
        }
      }
      flat[key] = value;
    }
    return flat;
  }

  async findUnique(args: { where: AnyObj; select?: AnyObj; include?: AnyObj }): Promise<any> {
    const flat = this.flattenWhere(args.where);
    const cols = args.select ? Object.keys(args.select).join(',') : '*';
    let q = this.from().select(cols);
    q = applyWhere(q, flat);
    const data = unwrap(await q.maybeSingle(), `${this.modelKey}.findUnique`);
    if (data && args.include && !args.select) await attachIncludes(this.supa, this.modelKey, [data], args.include);
    return data;
  }

  async findFirst(args: AnyObj = {}): Promise<any> {
    const flat = args.where ? this.flattenWhere(args.where) : undefined;
    const cols = args.select ? Object.keys(args.select).join(',') : '*';
    let q = this.from().select(cols);
    q = applyWhere(q, flat);
    q = applyOrderBy(q, args.orderBy);
    const data = unwrap(await q.limit(1).maybeSingle(), `${this.modelKey}.findFirst`);
    if (data && args.include && !args.select) await attachIncludes(this.supa, this.modelKey, [data], args.include);
    return data;
  }

  async findMany(args: AnyObj = {}): Promise<any[]> {
    const flat = args.where ? this.flattenWhere(args.where) : undefined;
    const cols = args.select ? Object.keys(args.select).join(',') : '*';
    let q = this.from().select(cols);
    q = applyWhere(q, flat);
    q = applyOrderBy(q, args.orderBy);
    if (typeof args.take === 'number') q = q.limit(args.take);
    if (typeof args.skip === 'number' && args.skip > 0) q = q.range(args.skip, args.skip + (args.take ?? 1000) - 1);
    const data = unwrap(await q, `${this.modelKey}.findMany`) as AnyObj[];
    if (args.include && !args.select) await attachIncludes(this.supa, this.modelKey, data, args.include);
    return data;
  }

  async create(args: { data: AnyObj }): Promise<any> {
    const data: AnyObj = { ...args.data };
    // 巢狀寫入：data.<relKey>.create = [ ... ]（子表 fk = 本表 id）
    const rels = RELATIONS[this.modelKey] || {};
    const pendingChildren: Array<{ table: string; fk: string; rows: AnyObj[] }> = [];
    for (const [relKey, specRaw] of Object.entries(rels)) {
      const nested = data[relKey];
      if (nested && typeof nested === 'object' && Array.isArray((nested as AnyObj).create)) {
        const spec = specRaw as { table: string; type: string; fk: string };
        if (spec.type === 'many') {
          pendingChildren.push({ table: tableFor(spec.table), fk: spec.fk, rows: (nested as AnyObj).create as AnyObj[] });
          delete data[relKey];
        }
      }
    }
    const row = unwrap(await this.from().insert(data).select().single(), `${this.modelKey}.create`);
    for (const child of pendingChildren) {
      const payload = child.rows.map((r) => ({ ...r, [child.fk]: row.id }));
      await this.supa.from(child.table).insert(payload);
    }
    return row;
  }

  async createMany(args: { data: AnyObj[] }): Promise<{ count: number }> {
    const data = unwrap(await this.from().insert(args.data), `${this.modelKey}.createMany`);
    return { count: Array.isArray(data) ? data.length : args.data.length };
  }

  async update(args: { where: AnyObj; data: AnyObj }): Promise<any> {
    const flat = this.flattenWhere(args.where);
    return unwrap(await this.from().update(args.data).match(flat).select().single(), `${this.modelKey}.update`);
  }

  async updateMany(args: { where: AnyObj; data: AnyObj }): Promise<{ count: number }> {
    let q = this.from().update(args.data);
    q = applyWhere(q, this.flattenWhere(args.where));
    const data = unwrap(await q.select(), `${this.modelKey}.updateMany`);
    return { count: Array.isArray(data) ? data.length : 0 };
  }

  async upsert(args: { where: AnyObj; update?: AnyObj; create: AnyObj }): Promise<any> {
    const flat = this.flattenWhere(args.where);
    const existing = unwrap(
      await applyWhere(this.from().select('id'), flat).limit(1).maybeSingle(),
      `${this.modelKey}.upsert.lookup`,
    );
    if (existing) {
      const merged = { ...(args.update || {}), id: existing.id };
      return unwrap(await this.from().update(merged).eq('id', existing.id).select().single(), `${this.modelKey}.upsert.update`);
    }
    return unwrap(await this.from().insert(args.create).select().single(), `${this.modelKey}.upsert.create`);
  }

  async delete(args: { where: AnyObj }): Promise<any> {
    const flat = this.flattenWhere(args.where);
    return unwrap(await this.from().delete().match(flat).select().single(), `${this.modelKey}.delete`);
  }

  async deleteMany(args: { where: AnyObj }): Promise<{ count: number }> {
    let q = this.from().delete();
    q = applyWhere(q, this.flattenWhere(args.where));
    const data = unwrap(await q.select(), `${this.modelKey}.deleteMany`);
    return { count: Array.isArray(data) ? data.length : 0 };
  }

  async count(args: AnyObj = {}): Promise<number> {
    let q = this.from().select('id', { count: 'exact', head: true });
    q = applyWhere(q, args.where ? this.flattenWhere(args.where) : undefined);
    const res = await q;
    if (res.error) throw new Error(`[db] ${this.modelKey}.count 失敗: ${res.error.message}`);
    return res.count ?? 0;
  }
}

// ── Raw SQL（Node 環境下經 pg 連線池；Worker 環境不支援）────
let _pool: any = null;
async function getPool(): Promise<any> {
  if (_pool) return _pool;
  const { Pool } = await import('pg');
  _pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      process.env.PGVECTOR_URL ||
      process.env.SUPABASE_DB_URL ||
      '',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  return _pool;
}

function rawText(segments: TemplateStringsArray, values: any[]): string {
  return segments.reduce((acc, seg, i) => acc + seg + (i < values.length ? '$' + (i + 1) : ''), '');
}

async function rawQuery(segments: TemplateStringsArray, values: any[]): Promise<any[]> {
  const pool = await getPool();
  const result = await pool.query(rawText(segments, values), values);
  return result.rows as any[];
}

async function rawExecute(segments: TemplateStringsArray, values: any[]): Promise<number> {
  const pool = await getPool();
  const result = await pool.query(rawText(segments, values), values);
  return result.rowCount || 0;
}

// ── Compat client ────────────────────────────────────────────
export class PrismaCompatClient {
  private _supa: SupabaseClient;
  readonly [key: string]: any;

  constructor(opts?: { url?: string; key?: string }) {
    this._supa = makeSupabase(opts);
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target || typeof prop === 'symbol') return (target as any)[prop];
        return new ModelDelegate(target._supa, String(prop));
      },
    });
  }

  async $connect(): Promise<void> { /* supabase-js 為無狀態 HTTP，無需連線 */ }
  async $disconnect(): Promise<void> { /* no-op */ }

  async $queryRaw(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
    return rawQuery(strings, values);
  }

  async $executeRaw(strings: TemplateStringsArray, ...values: any[]): Promise<number> {
    return rawExecute(strings, values);
  }

  async $transaction(fnOrOps: any, ...rest: any[]): Promise<any> {
    if (typeof fnOrOps === 'function') return fnOrOps(this);
    // 陣列型操作：循序執行（不保證原子性；如需嚴格交易請用 $queryRaw + BEGIN/COMMIT）
    const results: any[] = [];
    for (const op of [fnOrOps, ...rest]) {
      if (op && typeof op.then === 'function') results.push(await op);
    }
    return results;
  }
}

export type PrismaClient = PrismaCompatClient;

export function createPrismaCompatClient(opts?: { url?: string; key?: string }): PrismaClient {
  return new PrismaCompatClient(opts);
}
 + (i + 1) : ''), '');
}

async function rawQuery(segments: TemplateStringsArray, values: any[]): Promise<any[]> {
  const pool = await getPool();
  const result = await pool.query(rawText(segments, values), values);
  return result.rows as any[];
}

async function rawExecute(segments: TemplateStringsArray, values: any[]): Promise<number> {
  const pool = await getPool();
  const result = await pool.query(rawText(segments, values), values);
  return result.rowCount || 0;
}

// ── Compat client ────────────────────────────────────────────
export class PrismaCompatClient {
  private _supa: SupabaseClient;
  readonly [key: string]: any;

  constructor(opts?: { url?: string; key?: string }) {
    this._supa = makeSupabase(opts);
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target || typeof prop === 'symbol') return (target as any)[prop];
        return new ModelDelegate(target._supa, String(prop));
      },
    });
  }

  async $connect(): Promise<void> { /* supabase-js 為無狀態 HTTP，無需連線 */ }
  async $disconnect(): Promise<void> { /* no-op */ }

  async $queryRaw(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
    return rawQuery(strings, values);
  }

  async $executeRaw(strings: TemplateStringsArray, ...values: any[]): Promise<number> {
    return rawExecute(strings, values);
  }

  async $transaction(fnOrOps: any, ...rest: any[]): Promise<any> {
    if (typeof fnOrOps === 'function') return fnOrOps(this);
    // 陣列型操作：循序執行（不保證原子性；如需嚴格交易請用 $queryRaw + BEGIN/COMMIT）
    const results: any[] = [];
    for (const op of [fnOrOps, ...rest]) {
      if (op && typeof op.then === 'function') results.push(await op);
    }
    return results;
  }
}

export type PrismaClient = PrismaCompatClient;

export function createPrismaCompatClient(opts?: { url?: string; key?: string }): PrismaClient {
  return new PrismaCompatClient(opts);
}
