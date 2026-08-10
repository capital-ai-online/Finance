import { useEffect, useState } from 'react';
import { ShieldCheck, Fingerprint, KeyRound } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { signInWithPasskey } from './PasskeySettings';
import { verifyStepUp, StepUpError } from '../lib/stepUp';
import { authFetch } from '../lib/authFetch';
import { loginStepUpRequirement, markLoginStepUpPassed, type LoginStepUpRequirement } from '../lib/loginStepUp';

interface LoginStepUpGateProps {
  session: { user: any; [key: string]: any };
  onVerified: () => void;
  onAbort: () => void;
}

/**
 * Ganzseitiges Login-Gate: wird zwischen erfolgreicher Primär-Authentifizierung (Google-OAuth,
 * Passwort, Session-Restore) und tatsächlichem Dashboard-Zugriff eingeblendet, sobald der Nutzer
 * einen Passkey registriert oder 2FA aktiviert hat. Passkey hat Vorrang vor 2FA - ist ein Passkey
 * registriert, genügt dessen Bestätigung allein.
 */
export function LoginStepUpGate({ session, onVerified, onAbort }: LoginStepUpGateProps) {
  const [requirement, setRequirement] = useState<LoginStepUpRequirement | 'checking'>('checking');
  const [totpAlsoEnabled, setTotpAlsoEnabled] = useState(false);

  const [passkeyVerifying, setPasskeyVerifying] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const [totpCode, setTotpCode] = useState('');
  const [totpVerifying, setTotpVerifying] = useState(false);
  const [totpError, setTotpError] = useState<string | null>(null);

  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryVerifying, setRecoveryVerifying] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  const userId = session.user.id;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const req = await loginStepUpRequirement(session);
      if (cancelled) return;
      if (req === 'none') {
        markLoginStepUpPassed(userId);
        onVerified();
        return;
      }
      setRequirement(req);
      if (req === 'passkey' && supabase) {
        try {
          const { data } = await supabase.from('profiles').select('totp_enabled').eq('id', userId).maybeSingle();
          if (!cancelled) setTotpAlsoEnabled(!!data?.totp_enabled);
        } catch {
          // Recovery-Verfügbarkeit ist nur eine UI-Information - bei Fehler wird die
          // vorsichtigere Annahme (kein Break-Glass verfügbar) beibehalten.
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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

  async function handleRecoveryRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!recoveryCode.trim()) return;
    setRecoveryVerifying(true);
    setRecoveryError(null);
    try {
      const res = await authFetch('/api/auth/break-glass/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: recoveryCode.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `Recovery fehlgeschlagen (HTTP ${res.status}).`);
      }
      // Redeem deaktiviert 2FA (und ggf. Passkeys) für dieses Konto - der Nutzer kann nach dem
      // Login in den Profil-Einstellungen neu einrichten. Kein neuer Step-Up in dieser Sitzung nötig.
      markLoginStepUpPassed(userId);
      onVerified();
    } catch (err: any) {
      setRecoveryError(err?.message || 'Recovery-Code ungültig oder bereits verwendet.');
    } finally {
      setRecoveryVerifying(false);
    }
  }

  const canOfferRecovery = requirement === 'totp' || (requirement === 'passkey' && totpAlsoEnabled);

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

        <div className="pt-2 border-t border-white/10 space-y-3">
          {!showRecovery ? (
            canOfferRecovery ? (
              <button
                onClick={() => setShowRecovery(true)}
                className="w-full text-center text-[11px] text-white/40 hover:text-white/70 transition-colors cursor-pointer"
              >
                {requirement === 'passkey' ? 'Kein Zugriff mehr auf diesen Passkey?' : 'Kein Zugriff mehr auf die Authenticator-App?'}
              </button>
            ) : requirement === 'passkey' ? (
              <p className="text-[11px] text-white/40 text-center leading-relaxed">
                Kein Zugriff mehr auf diesen Passkey? Bitte kontaktiere den Support - für Konten
                ohne aktivierte 2FA gibt es aktuell keinen automatischen Recovery-Weg.
              </p>
            ) : null
          ) : (
            <form onSubmit={handleRecoveryRedeem} className="space-y-3">
              <p className="text-[11px] text-white/50 leading-relaxed">
                Recovery-Code eingeben, der dir bei der Einrichtung von 2FA einmalig angezeigt
                wurde. {requirement === 'passkey' ? 'Dies entfernt sowohl 2FA als auch alle registrierten Passkeys' : 'Dies deaktiviert 2FA'}{' '}
                für dieses Konto, damit du dich neu einrichten kannst.
              </p>
              <input
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="RECOVERY-CODE"
                className="w-full text-center text-sm font-mono tracking-widest bg-black/40 border border-white/10 rounded-xl py-2.5 text-white focus:border-aif-gold-DEFAULT/50 focus:outline-none"
              />
              {recoveryError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {recoveryError}
                </p>
              )}
              <button
                type="submit"
                disabled={recoveryVerifying || !recoveryCode.trim()}
                className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
              >
                {recoveryVerifying ? 'Prüfe…' : 'Recovery-Code einlösen'}
              </button>
            </form>
          )}
        </div>

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
