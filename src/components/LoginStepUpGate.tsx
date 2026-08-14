import { useEffect, useState } from 'react';
import { ShieldCheck, Fingerprint, KeyRound } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { signInWithPasskey } from './PasskeySettings';
import { verifyStepUp, StepUpError } from '../lib/stepUp';
import { loginStepUpRequirement, markLoginStepUpPassed, type LoginStepUpRequirement } from '../lib/loginStepUp';
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

type GateRequirement = LoginStepUpRequirement | 'native' | 'checking';

/**
 * Ganzseitiges Login-Gate: wird zwischen erfolgreicher Primär-Authentifizierung (Google-OAuth,
 * Passwort, Session-Restore) und tatsächlichem Dashboard-Zugriff eingeblendet, sobald der Nutzer
 * einen Passkey registriert oder 2FA aktiviert hat. Passkey hat Vorrang vor 2FA - ist ein Passkey
 * registriert, genügt dessen Bestätigung allein.
 *
 * ADR-0064 / ESS-0020 (M5A): natives Supabase-MFA ist, sobald ein verifizierter Faktor existiert,
 * die vorrangige Prüfung - sie ist die einzige Quelle, die eine echte AAL2-Sitzung erzeugt (vom
 * Server über requireVerifiedAal2 unabhängig nachprüfbar). Existiert kein nativer Faktor, greift
 * unverändert der bisherige Passkey-/Legacy-TOTP-Pfad.
 *
 * Owner-Policy 2026-08-14: kein Notfall-Bypass-Mechanismus in der Anwendung - dieses Gate bietet
 * bewusst KEINEN Break-Glass-/Recovery-Code-Pfad mehr an. Verlust von Passkey und Authenticator
 * gleichzeitig wird ausschließlich außerhalb der Anwendung (Supabase-Dashboard-Administration
 * durch den Owner) behoben.
 */
export function LoginStepUpGate({ session, onVerified, onAbort }: LoginStepUpGateProps) {
  const [requirement, setRequirement] = useState<GateRequirement>('checking');

  const [nativeFactorId, setNativeFactorId] = useState('');
  const [nativeChallengeId, setNativeChallengeId] = useState('');
  const [nativeCode, setNativeCode] = useState('');
  const [nativeVerifying, setNativeVerifying] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);

  const [passkeyVerifying, setPasskeyVerifying] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const [totpCode, setTotpCode] = useState('');
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);

  const userId = session.user.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // ADR-0064: natives MFA hat Vorrang, sofern ein verifizierter Faktor existiert - es ist die
      // einzige Quelle, die eine echte, server-seitig nachprüfbare AAL2-Sitzung erzeugt. Existiert
      // kein nativer Faktor (nextLevel !== 'aal2'), greift unverändert der bisherige Pfad.
      if (supabase) {
        try {
          const level = await getCurrentAssuranceLevel(supabase);
          if (!cancelled && level.nextLevel === 'aal2') {
            if (level.currentLevel === 'aal2') {
              markLoginStepUpPassed(userId);
              onVerified();
              return;
            }
            const factors = await listVerifiedTotpFactors(supabase);
            if (!cancelled && factors.length > 0) {
              const challengeId = await challengeTotpFactor(supabase, factors[0].id);
              if (!cancelled) {
                setNativeFactorId(factors[0].id);
                setNativeChallengeId(challengeId);
                setRequirement('native');
                return;
              }
            }
          }
        } catch (err) {
          console.error('[LoginStepUpGate] Nativer AAL-Status konnte nicht geladen werden, fahre mit Legacy-Pfad fort:', err);
        }
      }

      const req = await loginStepUpRequirement(session);
      if (cancelled) return;
      if (req === 'none') {
        markLoginStepUpPassed(userId);
        onVerified();
        return;
      }
      setRequirement(req);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleNativeVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (nativeCode.trim().length !== 6) {
      setNativeError('Bitte den 6-stelligen Code aus deiner Authenticator-App eingeben.');
      return;
    }
    setNativeVerifying(true);
    setNativeError(null);
    try {
      await verifyTotpChallenge(supabase, nativeFactorId, nativeChallengeId, nativeCode.trim());
      markLoginStepUpPassed(userId);
      onVerified();
    } catch (err) {
      setNativeError(err instanceof NativeMfaError ? err.message : '2FA-Verifikation fehlgeschlagen.');
    } finally {
      setNativeVerifying(false);
    }
  }

  async function handlePasskeyConfirm() {
    setPasskeyVerifying(true);
    setPasskeyError(null);
    try {
      const result: any = await signInWithPasskey();
      if (result.error) throw result.error;
      if (!result.data?.session || result.data.session.user.id !== userId) {
        throw new Error('Der bestätigte Passkey gehört nicht zu diesem Konto.');
      }
      markLoginStepUpPassed(userId);
      onVerified();
    } catch (err: any) {
      setPasskeyError(err?.message || 'Passkey-Bestätigung fehlgeschlagen oder abgebrochen.');
    } finally {
      setPasskeyVerifying(false);
    }
  }

  async function handleTotpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setTotpError('Bitte den 6-stelligen Code aus deiner Authenticator-App eingeben.');
      return;
    }
    setTotpVerifying(true);
    setTotpError(null);
    try {
      await verifyStepUp(totpCode.trim(), 'login');
      markLoginStepUpPassed(userId);
      onVerified();
    } catch (err) {
      setTotpError(err instanceof StepUpError ? err.message : '2FA-Verifikation fehlgeschlagen.');
    } finally {
      setTotpVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-aif-gold-DEFAULT selection:text-black">
      <div className="w-full max-w-md bg-black/40 border border-aif-gold-DEFAULT/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(245,196,83,0.1)] space-y-6">
        <div className="flex items-center gap-2.5 justify-center">
          <ShieldCheck className="text-aif-gold-DEFAULT w-6 h-6" />
          <h1 className="text-xl font-bold font-display tracking-tight text-white">Sicherheits-Bestätigung</h1>
        </div>

        {requirement === 'checking' && (
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest text-center animate-pulse">
            Prüfe Sicherheitseinstellungen…
          </p>
        )}

        {requirement === 'passkey' && (
          <div className="space-y-4">
            <p className="text-xs text-white/60 leading-relaxed text-center">
              Für dieses Konto ist ein Passkey registriert. Bitte bestätige die Anmeldung mit deinem
              Passkey.
            </p>
            <button
              onClick={handlePasskeyConfirm}
              disabled={passkeyVerifying}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT text-black hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Fingerprint size={16} />
              {passkeyVerifying ? 'Warte auf Passkey…' : 'Mit Passkey bestätigen'}
            </button>
            {passkeyError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {passkeyError}
              </p>
            )}
          </div>
        )}

        {requirement === 'totp' && (
          <form onSubmit={handleTotpVerify} className="space-y-4">
            <p className="text-xs text-white/60 leading-relaxed text-center">
              Für dieses Konto ist 2FA aktiviert. Bitte gib den aktuellen 6-stelligen Code aus
              deiner Authenticator-App ein.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-black/40 border border-white/10 rounded-xl py-3 text-white focus:border-aif-gold-DEFAULT/50 focus:outline-none"
            />
            {totpError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                {totpError}
              </p>
            )}
            <button
              type="submit"
              disabled={totpVerifying || totpCode.length !== 6}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT text-black hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              <KeyRound size={16} />
              {totpVerifying ? 'Prüfe…' : 'Bestätigen'}
            </button>
          </form>
        )}

        {requirement === 'native' && (
          <form onSubmit={handleNativeVerify} className="space-y-4">
            <p className="text-xs text-white/60 leading-relaxed text-center">
              Bitte gib den aktuellen 6-stelligen Code aus deiner Authenticator-App ein.
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
              {nativeVerifying ? 'Prüfe…' : 'Bestätigen'}
            </button>
          </form>
        )}

        <p className="pt-2 border-t border-white/10 text-[11px] text-white/40 text-center leading-relaxed">
          Kein Zugriff mehr auf Passkey oder Authenticator-App? Es gibt bewusst keinen
          automatischen Recovery-Weg in der Anwendung - bitte wende dich an den Owner.
        </p>

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
