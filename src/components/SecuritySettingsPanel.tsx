import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, LockKeyhole, QrCode, ShieldCheck } from 'lucide-react';
import { authFetch } from '../lib/authFetch';

type TotpFactor = { id: string; friendlyName: string };
type SecurityMethods = {
  password: { active: boolean };
  totp: { active: boolean; factors: TotpFactor[] };
  passkey: { active: false; available: false; releaseGate: 'USER_TEST_REQUIRED' };
};

async function responseMessage(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null);
  return typeof body?.error === 'string' ? body.error : fallback;
}

export function SecuritySettingsPanel() {
  const [methods, setMethods] = useState<SecurityMethods | null>(null);
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
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

  const beginTotpEnrollment = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const verifyTotp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary">Account-Sicherheit</p>
            <h2 className="mt-2 text-2xl font-black text-white">Authentifizierungsmethoden</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">Verwalte zusätzliche Faktoren für dein Konto. Die Sitzung und alle Faktoränderungen werden ausschließlich im Backend verarbeitet.</p>
          </div>
          <ShieldCheck className="h-7 w-7 shrink-0 text-brand-cyan" />
        </div>
      </div>

      {(error || success) && (
        <div className={`rounded-xl border p-4 text-sm ${error ? 'border-red-400/30 bg-red-400/10 text-red-200' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'}`}>
          {error || success}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="flex items-center gap-3">
            <LockKeyhole className="h-5 w-5 text-brand-primary" />
            <div>
              <h3 className="font-bold text-white">Passwort</h3>
              <p className="text-xs text-white/45">Primäre Anmeldung per E-Mail und Passwort</p>
            </div>
            <span className="ml-auto rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-300">Aktiv</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-white/40" />
            <div>
              <h3 className="font-bold text-white">Passkey</h3>
              <p className="text-xs text-white/45">Freigabe nach erfolgreichem Benutzertest</p>
            </div>
            <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase text-white/45">Gesperrt</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-brand-cyan/15 bg-black/40 p-6">
        <div className="flex items-start gap-3">
          <QrCode className="mt-0.5 h-5 w-5 text-brand-cyan" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">Authenticator-App (TOTP)</h3>
                <p className="mt-1 text-xs text-white/45">Zusätzlicher sechsstelliger Einmalcode aus deiner Authenticator-App.</p>
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
                  <p className="text-xs leading-relaxed text-white/60">Scanne den QR-Code oder hinterlege den Schlüssel manuell. Gib anschließend den aktuellen sechsstelligen Code ein.</p>
                  <code className="block break-all rounded-lg border border-white/10 bg-black/60 p-3 text-[11px] text-brand-primary">{secret}</code>
                  <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required aria-label="Sechsstelliger Authenticator-Code" placeholder="000000" className="w-full rounded-xl border border-white/20 bg-black/60 px-4 py-3 text-center font-mono text-lg tracking-[0.4em] text-white focus:border-brand-cyan focus:outline-none" />
                  <button type="submit" disabled={loading || code.length !== 6} className="w-full rounded-xl bg-brand-cyan px-4 py-3 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50">Code verifizieren und aktivieren</button>
                </div>
              </form>
            ) : (
              <button type="button" disabled={loading} onClick={() => void beginTotpEnrollment()} className="mt-5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-cyan px-5 py-3 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50">Authenticator-App aktivieren</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
