import { createClient } from "@supabase/supabase-js";

const metaEnv = (import.meta as any).env || {};
let rawSupabaseUrl = metaEnv.VITE_SUPABASE_URL || "";
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || "";

// Clean up standard misconfiguration (e.g., trailing slashes or /rest/v1 API routes)
if (rawSupabaseUrl.endsWith("/rest/v1/")) {
  rawSupabaseUrl = rawSupabaseUrl.slice(0, -9);
} else if (rawSupabaseUrl.endsWith("/rest/v1")) {
  rawSupabaseUrl = rawSupabaseUrl.slice(0, -8);
} else if (rawSupabaseUrl.endsWith("/")) {
  rawSupabaseUrl = rawSupabaseUrl.slice(0, -1);
}

export const supabaseUrl = rawSupabaseUrl.trim();
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

