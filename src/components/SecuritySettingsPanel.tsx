import React, { useCallback, useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import {
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Loader2,
  LockKeyhole,
  MailCheck,
  QrCode,
  ShieldCheck,
  Trash2,
  Phone,
} from 'lucide-react';
import { authFetch } from '../lib/authFetch';

type TotpFactor = { id: string; friendlyName: string };
type PasskeyFactor = {
  id: string;
  friendlyName: string;
  createdAt?: string;
  lastUsedAt?: string | null;
};
type SecurityMethods = {
  password: { active: boolean };
  totp: { active: boolean; factors: TotpFactor[] };
  passkey: { active: boolean; available: boolean; factors: PasskeyFactor[] };
  phone: { active: boolean; available: boolean; maskedNumber: string | null };
};

async function responseMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.error === 'string' ? body.error : fallback;
}

export function SecuritySettingsPanel({ phoneNumber, phoneVerified }: { phoneNumber: string; phoneVerified: boolean }) {
  const [activeSection, setActiveSection] = useState<'password' | 'authentication'>('password');
  const [methods, setMethods] = useState<SecurityMethods | null>(null);
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<'password' | 'passkey' | 'totp' | 'phone' | null>(null);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneChallengePending, setPhoneChallengePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/auth/security/methods', {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'Sicherheitsstatus konnte nicht geladen werden.'));
      const payload = await response.json();
      setMethods(payload.methods);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sicherheitsstatus konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadMethods(); }, [loadMethods]);

  const requestPasswordReset = async () => {
    setBusyAction('password');
    setError(null);
    setSuccess(null);
    try {
      const response = await authFetch('/api/auth/security/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error(await responseMessage(response, 'Bestätigungsmail konnte nicht angefordert werden.'));
      }
      const payload = await response.json().catch(() => null);
      setSuccess(
        typeof payload?.message === 'string'
          ? payload.message
          : 'Bestätigungsmail zum sicheren Zurücksetzen des Passworts wurde angefordert.',
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Bestätigungsmail konnte nicht angefordert werden.');
    } finally {
      setBusyAction(null);
    }
  };

  const beginPasskeyEnrollment = async () => {
    setBusyAction('passkey');
    setError(null);
    setSuccess(null);
    try {
      const startResponse = await authFetch('/api/auth/security/passkeys/registration/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({}),
      });
      if (!startResponse.ok) {
        throw new Error(await responseMessage(startResponse, 'Passkey-Registrierung konnte nicht gestartet werden.'));
      }
      const startPayload = await startResponse.json();
      if (typeof startPayload?.challengeId !== 'string' || !startPayload?.options) {
        throw new Error('Ungültige Passkey-Challenge.');
      }

      const credential = await startRegistration({ optionsJSON: startPayload.options });
      const verifyResponse = await authFetch('/api/auth/security/passkeys/registration/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          challengeId: startPayload.challengeId,
          credential,
        }),
      });
      if (!verifyResponse.ok) {
        throw new Error(await responseMessage(verifyResponse, 'Passkey konnte nicht verifiziert werden.'));
      }

      setSuccess('Passkey erfolgreich für die Anmeldung aktiviert.');
      await loadMethods();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Passkey konnte nicht aktiviert werden.');
    } finally {
      setBusyAction(null);
    }
  };

  const removePasskey = async (passkeyId: string) => {
    setBusyAction('passkey');
    setError(null);
    setSuccess(null);
    try {
      const response = await authFetch(
        `/api/auth/security/passkeys/${encodeURIComponent(passkeyId)}`,
        { method: 'DELETE', headers: { Accept: 'application/json' } },
      );
      if (!response.ok) throw new Error(await responseMessage(response, 'Passkey konnte nicht entfernt werden.'));
      setSuccess('Passkey entfernt.');
      await loadMethods();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Passkey konnte nicht entfernt werden.');
    } finally {
      setBusyAction(null);
    }
  };

  const beginTotpEnrollment = async () => {
    setBusyAction('totp');
    setError(null);
    setSuccess(null);
    try {
      const response = await authFetch('/api/auth/security/totp/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'Einrichtung konnte nicht gestartet werden.'));
      const payload = await response.json();
      setFactorId(payload.factorId);
      setQrCode(payload.qrCode);
      setSecret(payload.secret);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Einrichtung konnte nicht gestartet werden.');
    } finally {
      setBusyAction(null);
    }
  };

  const verifyTotp = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusyAction('totp');
    setError(null);
    try {
      const response = await authFetch('/api/auth/security/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ factorId, code }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'Code konnte nicht verifiziert werden.'));
      setFactorId('');
      setQrCode('');
      setSecret('');
      setCode('');
      setSuccess('Authenticator-App erfolgreich aktiviert.');
      await loadMethods();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Code konnte nicht verifiziert werden.');
    } finally {
      setBusyAction(null);
    }
  };

  const beginPhoneVerification = async () => {
    setBusyAction('phone');
    setError(null);
    setSuccess(null);
    try {
      const response = await authFetch('/api/auth/security/phone/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'SMS-Code konnte nicht angefordert werden.'));
      setPhoneChallengePending(true);
      setSuccess('SMS-Code angefordert.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'SMS-Code konnte nicht angefordert werden.');
    } finally {
      setBusyAction(null);
    }
  };

  const verifyPhone = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusyAction('phone');
    setError(null);
    try {
      const response = await authFetch('/api/auth/security/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ phoneNumber, token: phoneCode }),
      });
      if (!response.ok) throw new Error(await responseMessage(response, 'Telefonnummer konnte nicht verifiziert werden.'));
      setPhoneChallengePending(false);
      setPhoneCode('');
      setSuccess('Telefonnummer verifiziert und für Recovery freigeschaltet.');
      await loadMethods();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Telefonnummer konnte nicht verifiziert werden.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary">Account-Sicherheit</p>
            <h2 className="mt-2 text-2xl font-black text-white">Anmeldung &amp; Schutz</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Ändere dein Passwort nur über die zusätzliche Bestätigungsmail, aktiviere einen Passkey
              für die Anmeldung oder sichere dein Konto mit einer Authenticator-App ab.
            </p>
          </div>
          <ShieldCheck className="h-7 w-7 shrink-0 text-brand-cyan" />
        </div>
      </div>

      {(error || success) && (
        <div className={`rounded-xl border p-4 text-sm ${error ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-black/40 p-1" role="tablist" aria-label="Einstellungen">
        <button type="button" role="tab" aria-selected={activeSection === 'password'} onClick={() => setActiveSection('password')} className={`rounded-lg px-4 py-3 text-xs font-black uppercase tracking-wider transition ${activeSection === 'password' ? 'bg-brand-primary text-black' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>Neues Passwort vergeben</button>
        <button type="button" role="tab" aria-selected={activeSection === 'authentication'} onClick={() => setActiveSection('authentication')} className={`rounded-lg px-4 py-3 text-xs font-black uppercase tracking-wider transition ${activeSection === 'authentication' ? 'bg-brand-cyan text-black' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>Anmeldung &amp; 2FA</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {activeSection === 'password' && <div className="rounded-2xl border border-white/10 bg-black/40 p-5 md:col-span-2">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5 text-brand-primary" />
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white">Passwort ändern</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/45">
                Wir senden zuerst eine Bestätigungsmail an deine hinterlegte Adresse. Erst der bestätigte Link öffnet die Passwortänderung.
              </p>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => void requestPasswordReset()}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-brand-primary/30 bg-brand-primary/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-brand-primary transition hover:bg-brand-primary/15 disabled:opacity-50"
              >
                {busyAction === 'password' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
                Bestätigungsmail senden
              </button>
            </div>
          </div>
        </div>}

        {activeSection === 'authentication' && <div className="rounded-2xl border border-white/10 bg-black/40 p-5 md:col-span-2">
          <div className="flex items-start gap-3">
            <Fingerprint className="mt-0.5 h-5 w-5 text-brand-cyan" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-white">Passkey</h3>
                {methods?.passkey.active && (
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-300">
                    Aktiv
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-white/45">
                Nutze Gerätebiometrie, PIN oder einen kompatiblen Sicherheitsschlüssel für die passwortlose Anmeldung.
              </p>
              <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-3 text-xs font-bold text-white">
                <input
                type="checkbox"
                checked={methods?.passkey.active === true}
                disabled={busyAction !== null || methods?.passkey.available === false}
                onChange={() => { if (!methods?.passkey.active) void beginPasskeyEnrollment(); }}
                className="h-4 w-4 rounded border-white/20 bg-black text-brand-cyan focus:ring-brand-cyan"
                />
                {busyAction === 'passkey' ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Anmeldung über Passkey aktivieren
              </label>
            </div>
          </div>

          {methods?.passkey.factors?.length ? (
            <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
              {methods.passkey.factors.map((factor) => (
                <div key={factor.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                  <span className="min-w-0 flex-1 truncate text-xs text-white">{factor.friendlyName}</span>
                  <button
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => void removePasskey(factor.id)}
                    aria-label={`Passkey ${factor.friendlyName} entfernen`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-400/20 bg-red-400/5 text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>}
      </div>

      {activeSection === 'authentication' && <div className="rounded-2xl border border-brand-cyan/15 bg-black/40 p-6">
        <div className="flex items-start gap-3">
          <QrCode className="mt-0.5 h-5 w-5 text-brand-cyan" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">Authenticator-App (TOTP)</h3>
                <p className="mt-1 text-xs text-white/45">
                  Funktioniert mit gängigen TOTP-Apps. Scanne den QR-Code oder nutze den manuellen Schlüssel.
                </p>
              </div>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-brand-cyan" />}
            </div>

            {methods?.totp.active ? (
              <div className="mt-5 space-y-3">
                {methods.totp.factors.map((factor) => (
                  <div key={factor.id} className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <span className="text-sm text-white">{factor.friendlyName}</span>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-300">Verifiziert</span>
                  </div>
                ))}
              </div>
            ) : factorId ? (
              <form onSubmit={verifyTotp} className="mt-5 grid gap-5 md:grid-cols-[180px_1fr]">
                <img src={qrCode} alt="QR-Code für die Authenticator-App" className="h-[180px] w-[180px] rounded-xl bg-white p-2" />
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-white/60">
                    Scanne den QR-Code oder hinterlege den Schlüssel manuell. Gib anschließend den aktuellen sechsstelligen Code ein.
                  </p>
                  <code className="block break-all rounded-lg border border-white/10 bg-black/60 p-3 text-[11px] text-brand-primary">{secret}</code>
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    required
                    aria-label="Sechsstelliger Authenticator-Code"
                    placeholder="000000"
                    className="w-full rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-white focus:border-brand-cyan focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={busyAction !== null || code.length !== 6}
                    className="w-full rounded-xl bg-brand-cyan px-4 py-3 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
                  >
                    Code verifizieren und aktivieren
                  </button>
                </div>
              </form>
            ) : (
              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-3 text-xs font-bold text-white">
                <input
                type="checkbox"
                checked={methods?.totp.active === true}
                disabled={busyAction !== null || loading}
                onChange={() => void beginTotpEnrollment()}
                className="h-4 w-4 rounded border-white/20 bg-black text-brand-cyan focus:ring-brand-cyan"
                />
                2FA über Authenticator-App aktivieren
              </label>
            )}
          </div>
        </div>
      </div>}

      {activeSection === 'authentication' && <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
        <div className="flex items-start gap-3">
          <Phone className="mt-0.5 h-5 w-5 text-brand-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-white">Telefon-Recovery</h3>
              {(phoneVerified || methods?.phone.active) && <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-300">Verifiziert</span>}
            </div>
            <p className="mt-1 text-xs text-white/45">Die Telefonnummer wird erst nach SMS-Bestätigung für das Zurücksetzen des Passworts verwendet.</p>
            {!methods?.phone.available && <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-200">SMS-Provider und Kostenfreigabe stehen produktiv noch aus.</p>}
            {phoneChallengePending ? (
              <form onSubmit={verifyPhone} className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input value={phoneCode} onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{6}" placeholder="000000" aria-label="Sechsstelliger SMS-Code" className="min-h-11 flex-1 rounded-xl border border-white/20 bg-black/60 px-4 text-center font-mono tracking-[0.35em] text-white" />
                <button type="submit" disabled={busyAction !== null || phoneCode.length !== 6} className="min-h-11 rounded-xl bg-brand-primary px-5 text-xs font-black uppercase text-black disabled:opacity-50">Telefonnummer bestätigen</button>
              </form>
            ) : (
              <label className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-bold text-white">
                <input type="checkbox" checked={phoneVerified || methods?.phone.active === true} disabled={!phoneNumber || methods?.phone.available === false || busyAction !== null} onChange={() => { if (!phoneVerified && !methods?.phone.active) void beginPhoneVerification(); }} className="h-4 w-4 rounded border-white/20 bg-black text-brand-primary focus:ring-brand-primary" />
                {phoneNumber ? `${phoneNumber} für Recovery verifizieren` : 'Zuerst im Profil eine Telefonnummer speichern'}
              </label>
            )}
          </div>
        </div>
      </div>}
    </div>
  );
}
