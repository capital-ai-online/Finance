/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Security settings: TOTP 2FA (stable Supabase MFA API) and Passkeys
 * (WebAuthn — Supabase beta API, opt-in via supabaseClient.ts). Both are
 * additive login-hardening options; email/password plus Google/Microsoft
 * OAuth remain the primary sign-in methods.
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, KeyRound, Smartphone, Fingerprint, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface MfaFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

export function SecuritySettings() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // TOTP enrollment state
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Passkey state
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [registeringPasskey, setRegisteringPasskey] = useState(false);

  const loadFactors = async () => {
    if (!supabase) return;
    setLoadingFactors(true);
    try {
      const { data, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      const all: MfaFactor[] = [
        ...(data?.totp || []),
        ...((data as any)?.webauthn || []),
      ];
      setFactors(all);
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Laden der Sicherheitsfaktoren.');
    } finally {
      setLoadingFactors(false);
    }
  };

  useEffect(() => {
    loadFactors();
    // Passkeys require a browser that supports WebAuthn (navigator.credentials)
    // and the experimental client opt-in from supabaseClient.ts.
    setPasskeySupported(
      typeof window !== 'undefined' &&
      !!window.PublicKeyCredential &&
      !!supabase &&
      typeof (supabase.auth as any).registerPasskey === 'function'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTotpEnrollment = async () => {
    if (!supabase) return;
    setError(null);
    setInfo(null);
    setEnrolling(true);
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Capital AI – ${new Date().toLocaleDateString('de-DE')}`,
      });
      if (enrollError) throw enrollError;
      setFactorId(data.id);
      setQrCode(data.totp?.qr_code || null);
      setTotpSecret(data.totp?.secret || null);
    } catch (err: any) {
      setError(err?.message || 'TOTP-Registrierung fehlgeschlagen.');
      setEnrolling(false);
    }
  };

  const confirmTotpEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !factorId) return;
    setVerifying(true);
    setError(null);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;
      setInfo('Zwei-Faktor-Authentifizierung (TOTP) erfolgreich aktiviert.');
      setEnrolling(false);
      setQrCode(null);
      setTotpSecret(null);
      setFactorId(null);
      setVerifyCode('');
      await loadFactors();
    } catch (err: any) {
      setError(err?.message || 'Code konnte nicht verifiziert werden. Bitte erneut versuchen.');
    } finally {
      setVerifying(false);
    }
  };

  const removeFactor = async (id: string) => {
    if (!supabase) return;
    setError(null);
    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (unenrollError) throw unenrollError;
      setInfo('Faktor entfernt.');
      await loadFactors();
    } catch (err: any) {
      setError(err?.message || 'Faktor konnte nicht entfernt werden.');
    }
  };

  const registerPasskey = async () => {
    if (!supabase) return;
    setError(null);
    setInfo(null);
    setRegisteringPasskey(true);
    try {
      // Beta API — see supabaseClient.ts opt-in comment.
      const { error: passkeyError } = await (supabase.auth as any).registerPasskey({
        name: `Capital AI – ${navigator.platform || 'Gerät'}`,
      });
      if (passkeyError) throw passkeyError;
      setInfo('Passkey erfolgreich registriert.');
      await loadFactors();
    } catch (err: any) {
      setError(err?.message || 'Passkey-Registrierung fehlgeschlagen oder vom Browser nicht unterstützt.');
    } finally {
      setRegisteringPasskey(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-aif-gold-DEFAULT" />
        <h3 className="text-sm font-black text-white uppercase tracking-widest">Sicherheit &amp; Anmeldung</h3>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {info && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{info}</span>
        </div>
      )}

      {/* Active factors list */}
      <div className="space-y-2">
        <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Aktive Faktoren</p>
        {loadingFactors ? (
          <Loader2 className="w-4 h-4 animate-spin text-white/40" />
        ) : factors.length === 0 ? (
          <p className="text-xs text-white/40">Noch kein zusätzlicher Faktor eingerichtet.</p>
        ) : (
          factors.map(f => (
            <div key={f.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-white/80">
                {f.factor_type === 'totp' ? <Smartphone className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
                <span>{f.friendly_name || f.factor_type} · {f.status}</span>
              </div>
              <button onClick={() => removeFactor(f.id)} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* TOTP enrollment */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-aif-neon-cyan" />
          <span className="text-xs font-bold text-white">Authenticator-App (TOTP)</span>
        </div>
        {!enrolling ? (
          <button
            onClick={startTotpEnrollment}
            className="text-xs px-3 py-2 rounded-lg bg-aif-neon-cyan/10 border border-aif-neon-cyan/30 text-aif-neon-cyan hover:bg-aif-neon-cyan/20"
          >
            2FA einrichten
          </button>
        ) : qrCode ? (
          <form onSubmit={confirmTotpEnrollment} className="space-y-3">
            <img src={qrCode} alt="TOTP QR Code" className="w-40 h-40 bg-white p-2 rounded-lg" />
            {totpSecret && (
              <p className="text-[10px] text-white/40 break-all">Manueller Schlüssel: {totpSecret}</p>
            )}
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="6-stelliger Code"
              maxLength={6}
              className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-sm text-white"
              required
            />
            <button
              type="submit"
              disabled={verifying}
              className="w-full py-2 rounded-lg bg-aif-gold-DEFAULT text-black text-xs font-black disabled:opacity-50"
            >
              {verifying ? 'Wird geprüft...' : 'Bestätigen & aktivieren'}
            </button>
          </form>
        ) : (
          <Loader2 className="w-4 h-4 animate-spin text-white/40" />
        )}
      </div>

      {/* Passkey enrollment */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-aif-neon-purple" />
          <span className="text-xs font-bold text-white">Passkey (Face ID / Touch ID / Windows Hello)</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-aif-neon-purple/15 text-aif-neon-purple">Beta</span>
        </div>
        {!passkeySupported ? (
          <p className="text-xs text-white/40">Dein Browser oder diese Umgebung unterstützt aktuell keine Passkeys.</p>
        ) : (
          <button
            onClick={registerPasskey}
            disabled={registeringPasskey}
            className="text-xs px-3 py-2 rounded-lg bg-aif-neon-purple/10 border border-aif-neon-purple/30 text-aif-neon-purple hover:bg-aif-neon-purple/20 disabled:opacity-50"
          >
            {registeringPasskey ? 'Wird registriert...' : 'Passkey hinzufügen'}
          </button>
        )}
      </div>
    </div>
  );
}
