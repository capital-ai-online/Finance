import { useEffect, useState } from 'react';
import { AlertTriangle, Fingerprint, KeyRound, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { markLoginStepUpPassed } from '../lib/loginStepUp';
import {
  NativeMfaError,
  type NativeMfaAssuranceLevel,
  getCurrentAssuranceLevel,
  listVerifiedNativeMfaFactors,
  challengeTotpFactor,
  verifyTotpChallenge,
  authenticateWebauthnMfaFactor,
} from '../platform/Security/nativeMfa';

interface LoginStepUpGateProps {
  session: { user: any; [key: string]: any };
  initialAssurance?: NativeMfaAssuranceLevel | null;
  onVerified: () => void;
  onAbort: () => void;
}

type GateRequirement = 'checking' | 'totp' | 'webauthn' | 'blocked';
const MFA_OPERATION_TIMEOUT_MS = 10_000;

function withMfaTimeout<T>(operation: Promise<T>, operationName: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(
        new NativeMfaError(
          `${operationName} hat das Sicherheits-Zeitlimit überschritten. Bitte erneut anmelden.`,
        ),
      );
    }, MFA_OPERATION_TIMEOUT_MS);

    operation.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

/**
 * Supabase-native assurance gate.
 *
 * Primary authentication may arrive through email/password, Google OAuth or a native passkey.
 * Every path converges here. Supabase AAL/TOTP/WebAuthn failures remain fail-closed, and a
 * provider/client operation that never settles becomes an explicit blocked/error state instead
 * of an endless spinner. WebAuthn in this component is the Supabase MFA factor namespace and is
 * intentionally distinct from the primary-login `auth.signInWithPasskey()` API.
 */
export function LoginStepUpGate({
  session,
  initialAssurance = null,
  onVerified,
  onAbort,
}: LoginStepUpGateProps) {
  const [requirement, setRequirement] = useState<GateRequirement>('checking');
  const [totpFactorId, setTotpFactorId] = useState('');
  const [totpChallengeId, setTotpChallengeId] = useState('');
  const [webauthnFactorId, setWebauthnFactorId] = useState('');
  const [nativeCode, setNativeCode] = useState('');
  const [nativeVerifying, setNativeVerifying] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);

  const userId = session.user.id;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!supabase) {
        if (!cancelled) {
          setNativeError('Supabase ist nicht verfügbar. Der Sicherheitsstatus kann nicht geprüft werden.');
          setRequirement('blocked');
        }
        return;
      }

      try {
        const level =
          initialAssurance ??
          (await withMfaTimeout(
            getCurrentAssuranceLevel(supabase),
            'AAL-Prüfung',
          ));
        if (cancelled) return;

        if (level.currentLevel === 'aal2') {
          markLoginStepUpPassed(userId);
          onVerified();
          return;
        }

        if (level.nextLevel === 'aal2') {
          const factors = await withMfaTimeout(
            listVerifiedNativeMfaFactors(supabase),
            'MFA-Faktorprüfung',
          );
          if (cancelled) return;

          const webauthnFactor = factors.find((factor) => factor.factorType === 'webauthn');
          const totpFactor = factors.find((factor) => factor.factorType === 'totp');

          setWebauthnFactorId(webauthnFactor?.id ?? '');
          setTotpFactorId(totpFactor?.id ?? '');

          // Prefer the phishing-resistant WebAuthn MFA factor when available. The ceremony itself
          // starts only after a user click, preserving browser user-activation semantics.
          if (webauthnFactor) {
            setRequirement('webauthn');
            return;
          }

          if (totpFactor) {
            // Render the TOTP prompt as soon as the verified factor is known. Challenge creation
            // runs while the user can already open the authenticator and enter the code; submit
            // remains disabled until Supabase has returned the challenge id.
            setRequirement('totp');
            const challengeId = await withMfaTimeout(
              challengeTotpFactor(supabase, totpFactor.id),
              'MFA-Challenge',
            );
            if (cancelled) return;

            setTotpChallengeId(challengeId);
            return;
          }

          throw new NativeMfaError(
            'AAL2 ist erforderlich, aber es wurde kein verifizierter nativer MFA-Faktor gefunden.',
          );
        }

        if (level.currentLevel === 'aal1' && level.nextLevel === 'aal1') {
          markLoginStepUpPassed(userId);
          onVerified();
          return;
        }

        throw new NativeMfaError('Unbekannter Authenticator-Assurance-Zustand.');
      } catch (err) {
        console.error('[LoginStepUpGate] Native Supabase assurance verification failed closed:', err);
        if (!cancelled) {
          setNativeError(
            err instanceof NativeMfaError
              ? err.message
              : 'Der native Supabase-Sicherheitsstatus konnte nicht verifiziert werden.',
          );
          setRequirement('blocked');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function switchToTotp() {
    if (!supabase || !totpFactorId) {
      setNativeError('Kein verifizierter TOTP-Faktor als Fallback verfügbar.');
      return;
    }

    setNativeVerifying(true);
    setNativeError(null);
    try {
      const challengeId = await withMfaTimeout(
        challengeTotpFactor(supabase, totpFactorId),
        'MFA-Challenge',
      );
      setTotpChallengeId(challengeId);
      setNativeCode('');
      setRequirement('totp');
    } catch (err) {
      console.error('[LoginStepUpGate] TOTP fallback challenge failed closed:', err);
      setNativeError(
        err instanceof NativeMfaError ? err.message : 'TOTP-Challenge konnte nicht erstellt werden.',
      );
    } finally {
      setNativeVerifying(false);
    }
  }

  async function handleWebauthnVerify() {
    if (!supabase || !webauthnFactorId) {
      setNativeError('WebAuthn-MFA-Faktor ist nicht verfügbar. Verifikation wurde blockiert.');
      return;
    }

    setNativeVerifying(true);
    setNativeError(null);
    try {
      await withMfaTimeout(
        authenticateWebauthnMfaFactor(supabase, webauthnFactorId),
        'WebAuthn-MFA-Verifikation',
      );

      markLoginStepUpPassed(userId);
      onVerified();
    } catch (err) {
      console.error('[LoginStepUpGate] Native WebAuthn MFA verification failed closed:', err);
      setNativeError(
        err instanceof NativeMfaError ? err.message : 'WebAuthn-MFA-Verifikation fehlgeschlagen.',
      );
    } finally {
      setNativeVerifying(false);
    }
  }

  async function handleNativeVerify(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      setNativeError('Supabase ist nicht verfügbar. Verifikation wurde blockiert.');
      setRequirement('blocked');
      return;
    }

    if (nativeCode.trim().length !== 6) {
      setNativeError('Bitte den 6-stelligen Code aus deiner Authenticator-App eingeben.');
      return;
    }

    setNativeVerifying(true);
    setNativeError(null);
    try {
      await withMfaTimeout(
        verifyTotpChallenge(supabase, totpFactorId, totpChallengeId, nativeCode.trim()),
        'MFA-Verifikation',
      );

      const verifiedLevel = await withMfaTimeout(
        getCurrentAssuranceLevel(supabase),
        'AAL2-Nachprüfung',
      );
      if (verifiedLevel.currentLevel !== 'aal2') {
        throw new NativeMfaError('Die Sitzung hat nach der Verifikation kein AAL2 erreicht.');
      }

      markLoginStepUpPassed(userId);
      onVerified();
    } catch (err) {
      console.error('[LoginStepUpGate] Native TOTP verification failed closed:', err);
      setNativeError(
        err instanceof NativeMfaError ? err.message : '2FA-Verifikation fehlgeschlagen.',
      );
    } finally {
      setNativeVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-aif-gold-DEFAULT selection:text-black">
      <div className="w-full max-w-md bg-black/40 border border-aif-gold-DEFAULT/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(245,196,83,0.1)] space-y-6">
        <div className="flex items-center gap-2.5 justify-center">
          <ShieldCheck className="text-aif-gold-DEFAULT w-6 h-6" />
          <h1 className="text-xl font-bold font-display tracking-tight text-white">
            Sicherheits-Bestätigung
          </h1>
        </div>

        {requirement === 'checking' && (
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest text-center animate-pulse">
            Prüfe nativen Supabase-Sicherheitsstatus…
          </p>
        )}

        {requirement === 'webauthn' && (
          <div className="space-y-4">
            <p className="text-xs text-white/60 leading-relaxed text-center">
              Für dieses Konto ist ein verifizierter WebAuthn-MFA-Faktor aktiv. Bestätige die
              aktuelle Anmeldung mit deinem Passkey oder Sicherheitsschlüssel.
            </p>
            {nativeError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {nativeError}
              </p>
            )}
            <button
              type="button"
              onClick={handleWebauthnVerify}
              disabled={nativeVerifying}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT text-black hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Fingerprint size={16} />
              {nativeVerifying ? 'Prüfe WebAuthn-AAL2…' : 'Passkey-AAL2 bestätigen'}
            </button>
            {totpFactorId && (
              <button
                type="button"
                onClick={switchToTotp}
                disabled={nativeVerifying}
                className="w-full text-center text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-50"
              >
                Stattdessen Authenticator-App verwenden
              </button>
            )}
          </div>
        )}

        {requirement === 'totp' && (
          <div className="space-y-4">
            <form onSubmit={handleNativeVerify} className="space-y-4">
              <p className="text-xs text-white/60 leading-relaxed text-center">
                Für dieses Konto ist natives Supabase-MFA aktiv. Bitte bestätige die aktuelle
                Anmeldung mit dem Code aus deiner Authenticator-App.
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                value={nativeCode}
                onChange={(e) => setNativeCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-black/40 border border-white/10 rounded-xl py-3 text-white focus:border-aif-gold-DEFAULT/50 focus:outline-none"
              />
              {nativeError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {nativeError}
                </p>
              )}
              <button
                type="submit"
                disabled={nativeVerifying || nativeCode.length !== 6 || !totpChallengeId}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT text-black hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
              >
                <KeyRound size={16} />
                {nativeVerifying
                  ? 'Prüfe AAL2…'
                  : !totpChallengeId
                    ? 'AAL2 wird vorbereitet…'
                    : 'AAL2 bestätigen'}
              </button>
            </form>
            {webauthnFactorId && (
              <button
                type="button"
                onClick={() => {
                  setNativeError(null);
                  setRequirement('webauthn');
                }}
                disabled={nativeVerifying}
                className="w-full text-center text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-50"
              >
                Stattdessen Passkey verwenden
              </button>
            )}
          </div>
        )}

        {requirement === 'blocked' && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p className="text-xs leading-relaxed">
                {nativeError || 'Der Sicherheitsstatus konnte nicht verifiziert werden. Zugriff gesperrt.'}
              </p>
            </div>
            <p className="text-[11px] text-white/35 text-center leading-relaxed">
              Der native MFA-/AAL-Sicherheitsstatus wird nicht durch einen alternativen
              Primärlogin oder einen unverifizierten Faktor umgangen.
            </p>
          </div>
        )}

        <button
          onClick={onAbort}
          className="w-full text-center text-[11px] text-white/30 hover:text-white/60 transition-colors cursor-pointer"
        >
          Abmelden
        </button>
      </div>
    </div>
  );
}
