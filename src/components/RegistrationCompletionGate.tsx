import { useState } from 'react';
import { ShieldCheck, KeyRound, Fingerprint, Copy } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { authFetch } from '../lib/authFetch';
import { COUNTRIES } from '../lib/countries';
import {
  NativeMfaError,
  enrollTotpFactor,
  challengeTotpFactor,
  verifyTotpChallenge,
  registerWebauthnMfaFactor,
} from '../platform/Security/nativeMfa';
import {
  AAL2_DIAGNOSTIC_SUPERSESSION_ID,
  AAL2_REACTIVATION_STAGE,
  isAal2EnabledFor,
} from '../platform/Security/aal2DiagnosticSupersession';

interface RegistrationCompletionGateProps {
  session: { user: any; [key: string]: any };
  onComplete: () => void;
  onAbort: () => void;
}

type Step = 'profile' | 'mfa';
type MfaMode = 'choice' | 'totp-setup' | 'totp-verify' | 'passkey';

/**
 * Owner-Policy 2026-08-14: Pflicht-Onboarding fuer NEUE Registrierungen (profiles.
 * onboarding_required = true, siehe Migration 20260814153000/20260814154500). Wird nach dem
 * erstmaligen Herstellen einer Session gezeigt - einheitlich fuer E-Mail/Passwort- UND
 * Google-OAuth-Konten (letztere hatten bisher gar keinen Schritt zur Erfassung von Land/
 * Zustimmung), bevor App.tsx den eigentlichen Dashboard-Zugriff gewaehrt.
 *
 * Schritt 1 (profile): Land (Pflicht), Telefonnummer (optional), erneute/erstmalige
 * versionierte Zustimmung zu AGB/Datenschutz + optionales Marketing-Opt-in -> serverseitig
 * protokolliert mit Zeitstempel + Dokumentversion + gehashter IP (Art. 7 Abs. 1 DSGVO,
 * server/stepUp.ts: POST /api/auth/register/complete).
 *
 * Schritt 2 (mfa) bleibt implementiert, ist während der Owner-Diagnose-Supersession Stage 0/1
 * jedoch deaktiviert. Ab Stage 2 wird die native AAL2-Einrichtung wieder verpflichtend. Die
 * Supersession löscht keine vorhandenen Faktoren und kann dadurch kontrolliert zurückgenommen
 * werden.
 */
export function RegistrationCompletionGate({ session, onComplete, onAbort }: RegistrationCompletionGateProps) {
  const registrationAal2Enabled = isAal2EnabledFor('registration');
  const [step, setStep] = useState<Step>('profile');

  const [country, setCountry] = useState('DE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [mfaMode, setMfaMode] = useState<MfaMode>('choice');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreeTerms || !agreePrivacy) {
      setProfileError('Bitte stimmen Sie den AGB und Datenschutzbestimmungen zu.');
      return;
    }
    if (!country) {
      setProfileError('Bitte wählen Sie Ihr Land/Wohnsitz aus.');
      return;
    }
    setProfileSubmitting(true);
    setProfileError(null);
    try {
      const res = await authFetch('/api/auth/register/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          phoneNumber: phoneNumber.trim() || undefined,
          termsAccepted: true,
          privacyAccepted: true,
          marketingOptIn,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);

      if (!registrationAal2Enabled) {
        console.info('[Auth][AAL2-DIAGNOSTIC-SUPERSESSION]', {
          supersessionId: AAL2_DIAGNOSTIC_SUPERSESSION_ID,
          reactivationStage: AAL2_REACTIVATION_STAGE,
          surface: 'registration',
          aal2Required: false,
        });
        await completeOnboarding();
        return;
      }

      setStep('mfa');
    } catch (err: any) {
      setProfileError(err.message ?? String(err));
    } finally {
      setProfileSubmitting(false);
    }
  }

  async function completeOnboarding() {
    const res = await authFetch('/api/auth/mfa/enrollment-complete', { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    onComplete();
  }

  async function handleTotpStart() {
    if (!supabase) return;
    setMfaError(null);
    setMfaLoading(true);
    try {
      const enrollment = await enrollTotpFactor(supabase, 'CAPITAL-AI Native MFA');
      setFactorId(enrollment.factorId);
      setQrCode(enrollment.qrCode);
      setSecret(enrollment.secret);
      const chId = await challengeTotpFactor(supabase, enrollment.factorId);
      setChallengeId(chId);
      setCode('');
      setMfaMode('totp-verify');
    } catch (err: any) {
      setMfaError(err instanceof NativeMfaError ? err.message : `Einrichtung fehlgeschlagen: ${err.message ?? err}`);
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleTotpVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (code.trim().length !== 6) {
      setMfaError('Bitte den 6-stelligen Code aus deiner Authenticator-App eingeben.');
      return;
    }
    setMfaLoading(true);
    setMfaError(null);
    try {
      await verifyTotpChallenge(supabase, factorId, challengeId, code.trim());
      await completeOnboarding();
    } catch (err: any) {
      setMfaError(err instanceof NativeMfaError ? err.message : (err.message ?? 'Verifikation fehlgeschlagen.'));
    } finally {
      setMfaLoading(false);
    }
  }

  async function handlePasskeyRegister() {
    if (!supabase) return;
    setMfaMode('passkey');
    setMfaError(null);
    setMfaLoading(true);
    try {
      await registerWebauthnMfaFactor(supabase, 'CAPITAL-AI WebAuthn MFA');
      await completeOnboarding();
    } catch (err: any) {
      setMfaError(
        err instanceof NativeMfaError
          ? err.message
          : (err?.message || 'WebAuthn-MFA-Registrierung fehlgeschlagen oder abgebrochen.'),
      );
      setMfaMode('choice');
    } finally {
      setMfaLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-aif-gold-DEFAULT selection:text-black">
      <div className="w-full max-w-md bg-black/40 border border-aif-gold-DEFAULT/30 rounded-2xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(245,196,83,0.1)] space-y-6">
        <div className="flex items-center gap-2.5 justify-center">
          <ShieldCheck className="text-aif-gold-DEFAULT w-6 h-6" />
          <h1 className="text-xl font-bold font-display tracking-tight text-white">Konto einrichten</h1>
        </div>
        <p className="text-[11px] text-white/40 text-center font-mono uppercase tracking-widest">
          Schritt {step === 'profile' ? '1' : '2'} von {registrationAal2Enabled ? '2' : '1'}
        </p>

        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Land / Wohnsitz</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="w-full bg-black/60 border border-white/25 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Telefonnummer (optional)</label>
              <input
                type="tel"
                placeholder="+49 151 23456789"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-black/60 border border-white/25 rounded-lg px-3 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
              />
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2">
                <input type="checkbox" id="rcg-terms" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 rounded border-white/20 bg-black/40 text-aif-gold-DEFAULT focus:ring-0 h-3.5 w-3.5 cursor-pointer" />
                <label htmlFor="rcg-terms" className="text-[10px] text-white/50 leading-tight cursor-pointer">
                  Ich stimme den <a href="https://capital-ai.online/agb/" target="_blank" rel="noopener noreferrer" className="text-aif-gold-DEFAULT hover:underline font-bold">Nutzungsbedingungen (AGB)</a> zu. *
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="rcg-privacy" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5 rounded border-white/20 bg-black/40 text-aif-gold-DEFAULT focus:ring-0 h-3.5 w-3.5 cursor-pointer" />
                <label htmlFor="rcg-privacy" className="text-[10px] text-white/50 leading-tight cursor-pointer">
                  Ich habe die <a href="https://capital-ai.online/datenschutz/" target="_blank" rel="noopener noreferrer" className="text-aif-gold-DEFAULT hover:underline font-bold">Datenschutzbestimmungen</a> zur Kenntnis genommen. *
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="rcg-marketing" checked={marketingOptIn} onChange={(e) => setMarketingOptIn(e.target.checked)} className="mt-0.5 rounded border-white/20 bg-black/40 text-aif-gold-DEFAULT focus:ring-0 h-3.5 w-3.5 cursor-pointer" />
                <label htmlFor="rcg-marketing" className="text-[10px] text-white/50 leading-tight cursor-pointer">
                  Ich möchte gelegentlich Produkt-/Marketing-Updates erhalten (optional, jederzeit widerrufbar).
                </label>
              </div>
            </div>
            {profileError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{profileError}</p>
            )}
            <button
              type="submit"
              disabled={profileSubmitting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT text-black hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {profileSubmitting ? 'Bitte warten…' : 'Weiter'}
            </button>
          </form>
        )}

        {step === 'mfa' && (
          <div className="space-y-4">
            <p className="text-xs text-white/60 leading-relaxed text-center">
              Zum Abschluss: richte native 2FA per Authenticator-App oder WebAuthn-Passkey als
              verifizierten MFA-Faktor ein. Mindestens einer davon ist erforderlich.
            </p>

            {mfaError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{mfaError}</p>
            )}

            {mfaMode === 'choice' && (
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={handleTotpStart}
                  disabled={mfaLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT text-black hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound size={16} />
                  Authenticator-App (TOTP) einrichten
                </button>
                <button
                  onClick={handlePasskeyRegister}
                  disabled={mfaLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/10 text-white hover:bg-white/15 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Fingerprint size={16} />
                  Passkey als WebAuthn-MFA einrichten
                </button>
              </div>
            )}

            {mfaMode === 'totp-verify' && (
              <form onSubmit={handleTotpVerify} className="space-y-3">
                {qrCode && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-white/50">QR-Code mit der Authenticator-App scannen:</p>
                    <div className="bg-white rounded-lg p-2 w-fit mx-auto">
                      <img src={qrCode} alt="QR-Code für MFA-Registrierung" width={160} height={160} />
                    </div>
                  </div>
                )}
                {secret && (
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                    <code className="text-xs font-mono text-white/90 flex-1 break-all">{secret}</code>
                    <button type="button" onClick={() => navigator.clipboard.writeText(secret)} className="text-white/40 hover:text-white shrink-0 cursor-pointer" aria-label="Secret kopieren">
                      <Copy size={14} />
                    </button>
                  </div>
                )}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-black/40 border border-white/10 rounded-xl py-3 text-white focus:border-aif-gold-DEFAULT/50 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMfaMode('choice')} className="flex-1 px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm cursor-pointer">
                    Zurück
                  </button>
                  <button
                    type="submit"
                    disabled={mfaLoading || code.length !== 6}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT text-black hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {mfaLoading ? 'Prüfe…' : 'Bestätigen & abschließen'}
                  </button>
                </div>
              </form>
            )}

            {mfaMode === 'passkey' && (
              <p className="text-xs text-white/40 text-center animate-pulse">Warte auf WebAuthn-MFA-Bestätigung…</p>
            )}
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
