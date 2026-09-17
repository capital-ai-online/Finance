import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Passkey-Support ist bei Supabase Auth aktuell experimentell (Stand: Beta seit Mai 2026)
        // und muss hier explizit aktiviert werden. Voraussetzung: @supabase/supabase-js >= 2.105.0
        // (Projekt nutzt 2.108.2 – erfüllt).
        experimental: { passkey: true },
      },
    })
  : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}
