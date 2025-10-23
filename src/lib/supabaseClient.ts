'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

/** Lazy getter so build/prerender doesn't crash without envs */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    // During Vercel build, env may not be present; don't hard-crash the build.
    if (typeof window === 'undefined') {
      throw new Error('Supabase env not available during build (expected for prerender).');
    } else {
      throw new Error('Supabase environment variables are missing in the browser.');
    }
  }

  _client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  return _client;
}
