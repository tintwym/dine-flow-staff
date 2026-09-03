import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

const looksLikeLocal =
  url.startsWith("http://127.0.0.1") ||
  url.startsWith("http://localhost");

export const isSupabaseConfigured =
  Boolean(url) &&
  Boolean(anonKey) &&
  !url.includes("YOUR_PROJECT") &&
  !anonKey.includes("YOUR_SUPABASE_ANON_KEY") &&
  (url.startsWith("https://") || looksLikeLocal);

/** Browser client with auth persistence for guest + staff sessions. */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
