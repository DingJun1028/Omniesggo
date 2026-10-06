/**
 * 5T Traceable — Vitest setup file
 *
 * Provides dummy env vars for modules that access process.env at import time
 * (e.g. supabase-client.ts throws "supabaseUrl is required." when
 * NEXT_PUBLIC_SUPABASE_URL is unset). Without this, importing any route that
 * transitively imports supabase-client fails during test collection.
 *
 * These are dummy values — tests that need real Supabase should mock the client.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dummy.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-anon-key';
