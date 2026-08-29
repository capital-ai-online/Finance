import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { canRemoveLastFactor } from '../lib/mfaLastFactorGuard';
import {
  NativeMfaError,
  listVerifiedNativeMfaFactors,
  registerWebauthnMfaFactor,
  type NativeMfaFactor,
} from '../platform/Security/nativeMfa';

/**
 * Self-service settings for WebAuthn MFA factors.
 *
 * IMPORTANT: these credentials are deliberately enrolled through `auth.mfa.webauthn` and are
 * therefore AAL2 factors. They are not primary-login passkeys (`auth.registerPasskey`). Primary
 * authentication stays email/password or Google OAuth; after successful primary authentication
 * Supabase reports `nextLevel === 'aal2'` when one of these verified factors is enrolled, and the
 * existing LoginStepUpGate performs the WebAuthn challenge.
 */
export default function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<NativeMfaFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    void loadPasskeys();
    void loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    setCurrentUserEmail(data.user?.email ?? null);
    setCurrentUserId(data.user?.id ?? null);
  }

  async function loadPasskeys() {
    if (!supabase) {
      setMessage({ type: 'error', text: 'Supabase-Client ist nicht konfiguriert (fehlende ENV-Variablen).' });
      return;
    }

    setLoading(true);
    try {
      const factors = await listVerifiedNativeMfaFactors(supabase);
      setPasskeys(factors.filter((factor) => factor.factorType === 'webauthn'));
    } catch (error: any) {
      const text =
        error instanceof NativeMfaError
          ? error.message
          : `AAL2-Passkeys konnten nicht geladen werden: ${error?.message ?? error}`;
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!supabase) return;
    setMessage(null);
    setLoading(true);

    try {
      await registerWebauthnMfaFactor(supabase, 'CAPITAL-AI AAL2 Passkey');
      setMessage({
        type: 'success',
        text: 'AAL2-Passkey erfolgreich aktiviert. Künftige Anmeldungen fordern diesen Faktor nach dem Primärlogin an.',
      });
      await loadPasskeys();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error instanceof NativeMfaError
            ? error.message
            : `AAL2-Passkey konnte nicht registriert werden: ${error?.message ?? error}`,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(factorId: string) {
    if (!supabase) return;
    if (!window.confirm('Diesen AAL2-Passkey wirklich entfernen?')) return;

    setLoading(true);
    setMessage(null);
    try {
      if (currentUserId) {
        const guard = await canRemoveLastFactor(supabase, currentUserId, 'native');
        if (!guard.allowed) {
          setMessage({ type: 'error', text: guard.reason ?? 'Der letzte MFA-Faktor darf nicht entfernt werden.' });
          return;
        }
      }

      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      setMessage({ type: 'success', text: 'AAL2-Passkey entfernt.' });
      await loadPasskeys();
    } catch (error: any) {
      setMessage({ type: 'error', text: `Entfernen fehlgeschlagen: ${error?.message ?? error}` });
    } finally {
      setLoading(false);
    }
  }

  if (!isSupabaseConfigured()) {
    return <div className="text-red-400 text-sm">Supabase ist nicht konfiguriert.</div>;
  }

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-black/20 p-4">
      <div>
        <h3 className="font-semibold text-white">AAL2-Passkeys</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/50">
          WebAuthn-Passkeys werden hier als zusätzlicher AAL2-Sicherheitsfaktor aktiviert. Nach
          einer Anmeldung mit Google oder E-Mail/Passwort fordert CAPITAL-AI den Passkey an, wenn
          für dein Konto ein verifizierter WebAuthn-MFA-Faktor hinterlegt ist.
        </p>
        <p className="mt-1 text-xs text-white/40">
          {currentUserEmail ? `Konto: ${currentUserEmail}` : 'Nicht eingeloggt'}
        </p>
      </div>

      {message && (
        <div
          className={`rounded px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400'
              : message.type === 'error'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-blue-500/10 text-blue-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={loading || !currentUserEmail}
        className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
      >
        {loading ? 'Bitte warten…' : 'AAL2-Passkey auf diesem Gerät aktivieren'}
      </button>

      {!currentUserEmail && (
        <p className="text-xs text-amber-400">Du musst eingeloggt sein, um einen AAL2-Passkey zu aktivieren.</p>
      )}

      <div className="space-y-2">
        {passkeys.length === 0 && (
          <p className="text-sm text-white/40">Noch kein WebAuthn-AAL2-Passkey aktiviert.</p>
        )}
        {passkeys.map((passkey) => (
          <div
            key={passkey.id}
            className="flex items-center justify-between rounded border border-white/10 px-3 py-2"
          >
            <div>
              <p className="text-sm text-white">{passkey.friendlyName || 'CAPITAL-AI AAL2 Passkey'}</p>
              <p className="text-xs text-white/40">Verifizierter WebAuthn-MFA-Faktor</p>
            </div>
            <button
              onClick={() => handleDelete(passkey.id)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Entfernen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
