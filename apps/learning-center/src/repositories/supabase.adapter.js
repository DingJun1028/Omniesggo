/**
 * src/repositories/supabase.adapter.js
 *
 * 選用型 Supabase 適配器，僅提供：
 * 1) 健康檢查
 * 2) 可選的遠端讀取摘要
 *
 * 本檔案刻意不碰主要資料流程，也不直接寫入，
 * 避免與現有 pairing/submission/profile 行為互相干擾。
 */

const SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
const SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();
const isSupabaseEnabled = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let cachedClient = null;

const loadSupabaseClient = async () => {
  if (!isSupabaseEnabled()) return null;
  if (cachedClient) return cachedClient;

  try {
    // Dynamic import (ESM-compatible) so the app still bundles/runs without Supabase installed.
    const { createClient } = await import('@supabase/supabase-js');
    cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    return cachedClient;
  } catch (error) {
    console.warn('Supabase client init failed', error);
    return null;
  }
};

export const checkSupabaseHealth = async () => {
  const client = await loadSupabaseClient();
  if (!client) {
    return { enabled: false, healthy: false, reason: 'SUPABASE_DISABLED' };
  }

  try {
    const start = Date.now();
    const { data, error } = await client.from('_health_check').select('*').limit(1);
    const durationMs = Date.now() - start;

    if (error) {
      return { enabled: true, healthy: false, status: 'ERROR', reason: String(error?.message || error) };
    }

    return { enabled: true, healthy: true, durationMs, data: data ?? null };
  } catch (error) {
    return { enabled: true, healthy: false, reason: error?.message || String(error) };
  }
};

export const fetchSupabaseSyncSummary = async () => {
  const client = await loadSupabaseClient();
  if (!client) {
    return { enabled: false, healthy: false, reason: 'SUPABASE_DISABLED' };
  }

  try {
    const start = Date.now();
    const { data, error } = await client
      .from('submission_sync')
      .select('source, last_synced_at, record_count')
      .order('last_synced_at', { ascending: false })
      .limit(20);

    const durationMs = Date.now() - start;

    if (error) {
      return { enabled: true, healthy: false, status: 'ERROR', reason: String(error?.message || error) };
    }

    return { enabled: true, healthy: true, durationMs, rows: Array.isArray(data) ? data : [] };
  } catch (error) {
    return { enabled: true, healthy: false, reason: error?.message || String(error) };
  }
};
