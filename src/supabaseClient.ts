import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
// Supabase's new API key format (sb_publishable_...) is preferred; the
// legacy JWT anon key is kept only as a fallback for projects that have not
// migrated / re-enabled legacy keys. Mixing an old anon key with a project
// that has legacy keys DISABLED in the dashboard causes a hard
// "Invalid API key" rejection at runtime — always set
// VITE_SUPABASE_PUBLISHABLE_KEY going forward.
const supabaseAnonKey =
  (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env.VITE_SUPABASE_ANON_KEY ||
  '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}
