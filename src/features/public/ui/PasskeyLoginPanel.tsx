import React, { useState } from 'react';
import { AlertCircle, Fingerprint, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

/**
 * Native Supabase passkey login panel.
 *
 * This panel is rendered only after the controlled native-passkey feature flag has been enabled.
 * Until that activation, Google OAuth and registered email/password identities remain the website
 * primary-login paths. Native passkey failures remain fail-closed.
 */
export function PasskeyLoginPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasskeyLogin = async () => {
    setError(null);

    if (!supabase) {
      setError('Supabase ist nicht konfiguriert. Anmeldung ist nicht möglich.');
      return;
    }

    setLoading(true);
    try {
      const auth = supabase.auth as typeof supabase.auth & {
        signInWithPasskey: () => Promise<{ error: Error | null }>;
      };
      const { error: passkeyError } = await auth.signInWithPasskey();
      if (passkeyError) throw passkeyError;
    } catch (err: any) {
      console.warn('[Auth] Supabase native passkey login failed:', err);
      setError(err?.message || 'Passkey-Anmeldung fehlgeschlagen oder abgebrochen.');
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-aif-gold-DEFAULT/30 bg-aif-gold-DEFAULT/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck size={16} className="text-aif-gold-DEFAULT" />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-aif-gold-DEFAULT">
            Primärer Login · Native Passkey
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-white/45">
            Der native Supabase-Passkey ist für diese Website kontrolliert aktiviert und wird
            gegenüber den Fallback-Anmeldewegen priorisiert.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePasskeyLogin}
        disabled={loading}
        className="flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-aif-gold-DEFAULT px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Loader2 size={17} className="animate-spin" /> : <Fingerprint size={17} />}
        {loading ? 'Passkey wird geprüft…' : 'Mit nativem Passkey anmelden'}
      </button>
    </section>
  );
}
