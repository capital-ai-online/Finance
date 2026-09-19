import { createClient } from '@supabase/supabase-js';
import { isNativePasskeyLoginEnabled } from './lib/authFeatureFlags';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabasePublishableKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const supabase = (supabaseUrl && supabasePublishableKey)
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        // Native Supabase passkeys remain disabled until the controlled website feature flag is
        // explicitly enabled. Google OAuth may independently use a Google-account passkey.
        experimental: { passkey: isNativePasskeyLoginEnabled() },
      },
    })
  : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}
