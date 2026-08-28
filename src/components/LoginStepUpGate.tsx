import { useEffect, useState } from 'react';
import { AlertTriangle, KeyRound, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { markLoginStepUpPassed } from '../lib/loginStepUp';
import {
  NativeMfaError,
  getCurrentAssuranceLevel,
  listVerifiedTotpFactors,
  challengeTotpFactor,
  verifyTotpChallenge,
} from '../platform/Security/nativeMfa';

interface LoginStepUpGateProps {
  session: { user: any; [key: string]: any };
  onVerified: () => void;
  onAbort: () => void;
}

type GateRequirement = 'checking' | 'native' | 'blocked';

/**
 * Supabase-native assurance gate.
 *
 * The primary authentication authority is the Supabase-native passkey flow. If Supabase reports
 * that this account can reach AAL2, the verified native TOTP factor is required before application
 * access. Any failure to read AAL state, enumerate factors or create the challenge fails closed.
 * There is deliberately no legacy Passkey/TOTP/password fallback.
 */
export function LoginStepUpGate({ session, onVerified, onAbort }: LoginStepUpGateProps) {
  const [requirement, setRequirement] = useState<GateRequirement>('checking');
  const [nativeFactorId, setNativeFactorId] = useState('');
  const [nativeChallengeId, setNativeChallengeId] = useState('');
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
        const level = await getCurrentAssuranceLevel(supabase);
        if (cancelled) return;

        if (level.currentLevel === 'aal2') {
          markLoginStepUpPassed(userId);
          onVerified();
          return;
        }

        if (level.nextLevel === 'aal2') {
          const factors = await listVerifiedTotpFactors(supabase);
          if (cancelled) return;

          if (factors.length === 0) {
            throw new NativeMfaError(
              'AAL2 ist erforderlich, aber es wurde kein verifizierter nativer TOTP-Faktor gefunden.',
            );
          }

          const challengeId = await challengeTotpFactor(supabase, factors[0].id);
          if (cancelled) return;

          setNativeFactorId(factors[0].id);
          setNativeChallengeId(challengeId);
          setRequirement('native');
          return;
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
      await verifyTotpChallenge(supabase, nativeFactorId, nativeChallengeId, nativeCode.trim());

      const verifiedLevel = await getCurrentAssuranceLevel(supabase);
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

        {requirement === 'native' && (
          <form onSubmit={handleNativeVerify} className="space-y-4">
            <p className="text-xs text-white/60 leading-relaxed text-center">
              Für dieses Konto ist natives Supabase-MFA aktiv. Bitte bestätige die Passkey-Sitzung
              mit dem aktuellen Code aus deiner Authenticator-App.
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
              disabled={nativeVerifying || nativeCode.length !== 6}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT text-black hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              <KeyRound size={16} />
              {nativeVerifying ? 'Prüfe AAL2…' : 'AAL2 bestätigen'}
            </button>
          </form>
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
              Es wird bewusst kein Legacy-, Passwort-, OAuth- oder lokaler MFA-Fallback verwendet.
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
