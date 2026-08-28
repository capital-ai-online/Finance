import React, { useState } from 'react';
import { AlertCircle, Fingerprint, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { CapitalAiLogo } from './CapitalAiLogo';

interface NativePasskeyLoginProps {
  onLoginEmail?: (email: string, password: string) => Promise<void>;
  onGuestLogin?: () => void;
  onRegisterEmail?: (name: string, email: string, password: string) => Promise<void>;
  justLoggedOut?: boolean;
}

/**
 * Supabase Auth is the single interactive authentication authority.
 *
 * Compatibility props are intentionally ignored so legacy password/OAuth/registration callbacks
 * cannot become alternate authentication paths through the public UI facade.
 * Accounts must already be confirmed and have at least one Supabase-native passkey enrolled before
 * this login surface is enabled in production.
 */
export function NativePasskeyLogin({ justLoggedOut }: NativePasskeyLoginProps) {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      role="main"
      id="main-content"
      className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-aif-gold-DEFAULT selection:text-black"
    >
      <div className="w-full max-w-md rounded-2xl border border-aif-gold-DEFAULT/30 bg-black/50 p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(245,196,83,0.1)]">
        <div className="mb-7 flex flex-col items-center text-center">
          <CapitalAiLogo size={110} showText={true} />
          <div className="mt-5 flex items-center gap-2 text-aif-gold-DEFAULT">
            <ShieldCheck size={18} />
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em]">
              Supabase Native Passkey
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-white/55">
            Anmeldung erfolgt ausschließlich mit einem in Supabase Auth registrierten Passkey.
            Passwort-, OAuth- und Legacy-Anmeldewege sind deaktiviert.
          </p>
        </div>

        {justLoggedOut && (
          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-xs text-emerald-300">
            Erfolgreich abgemeldet.
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-aif-gold-DEFAULT px-5 py-3 text-xs font-black uppercase tracking-wider text-black transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Fingerprint size={17} />}
          {loading ? 'Passkey wird geprüft…' : 'Mit Passkey anmelden'}
        </button>

        <p className="mt-5 border-t border-white/10 pt-4 text-center text-[11px] leading-relaxed text-white/35">
          Kein Supabase-Passkey für dieses Konto vorhanden? Der Zugriff bleibt bewusst gesperrt.
          Es gibt auf dieser Oberfläche keinen Passwort-, OAuth- oder Recovery-Fallback.
        </p>
      </div>
    </main>
  );
}
