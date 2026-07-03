import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Passkey (WebAuthn) support in supabase-js is in beta and requires an
// explicit opt-in. Requires @supabase/supabase-js >= 2.105.0 and the
// corresponding "Passkeys" configuration to be enabled in the Supabase
// Dashboard (Authentication -> Passkeys) with the Relying Party ID set to
// the bare domain "capital-ai.online". The API may change without notice
// while in beta.
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        experimental: {
          passkey: true,
        } as any,
      },
    })
  : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}
