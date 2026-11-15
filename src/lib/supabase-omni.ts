// ============================================================
// Supabase Omni layer — shared helpers for the Prisma→Supabase migration
// src/lib/supabase-omni.ts
// ============================================================
import { supabase as _supabase } from './supabase-client';

// Re-export the lazy Supabase client proxy so routes keep
// `import { supabase } from '@/lib/supabase-omni'` with unchanged call sites.
export { supabase } from './supabase-client';

/** findFirst — first row matching `where` (0-row → null) */
export async function first<T = unknown>(
  table: string,
  where: Record<string, unknown>,
): Promise<T | null> {
  const entries = Object.entries(where);
  let query = _supabase.from(table).select('*');
  for (const [k, v] of entries) {
    query = query.eq(k, v);
  }
  const { data, error } = await query.limit(1).single();
  if (error) {
    // PGRST116 = no rows found (单一 result 查詢無資料)
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return (data as T) ?? null;
}

/** findMany — `where` (optional), `orderBy` {{field, dir}}, `limit` (optional) */
export async function list<T = unknown>(
  table: string,
  where?: Record<string, unknown>,
  orderBy?: { field: string; dir: 'asc' | 'desc' },
  limit?: number,
): Promise<T[]> {
  let q = _supabase.from(table).select('*');
  if (where) {
    for (const [k, v] of Object.entries(where)) {
      if (Array.isArray(v)) q = q.in(k, v);
      else q = q.eq(k, v);
    }
  }
  if (orderBy) q = q.order(orderBy.field, { ascending: orderBy.dir === 'asc' });
  if (limit != null) q = q.limit(limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data as T[]) ?? [];
}

/** count — exact count head */
export async function count(table: string): Promise<number> {
  const { data, error } = await _supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return typeof data === 'number' ? data : (((data as unknown as { count?: number } | null)?.count) ?? 0);
}
