import { useEffect, useState } from 'react';
import { KeyRound, Copy, Check, ShieldAlert, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { authFetch } from '../lib/authFetch';
import {
  NativeMfaError,
  enrollTotpFactor,
  challengeTotpFactor,
  verifyTotpChallenge,
  listVerifiedTotpFactors,
  unenrollTotpFactor,
} from '../platform/Security/nativeMfa';

/**
 * ADR-0003.5 / Audit ARCH-AUDIT-0002 (D9): TOTP-Setup-Oberfläche für die Step-Up-
 * Authentifizierung. Der Server-seitige Ablauf (server/stepUp.ts: /totp/setup,
 * /totp/verify-setup) existierte bereits, hatte aber in der gesamten Codebasis keine
 * Frontend-Entsprechung - ohne diese Komponente konnte niemand jemals ein Step-Up-Token
 * erzeugen. Analog zu PasskeySettings.tsx als eigenständige Sicherheits-Einstellung in
 * ProfilePage.tsx eingebunden.
 *
 * ADR-0064 / ESS-0020 (M5A): ergänzt um natives Supabase-MFA (enroll -> challenge -> verify).
 * Native MFA ist die neue Autoritätsquelle für AAL2 (server-seitig via requireVerifiedAal2
 * geprüft); das bestehende Legacy-TOTP unten bleibt laut ADR-0064 Punkt 5 vorerst als
 * Migrationspfad/Defense-in-Depth erhalten und wird NICHT entfernt.
 */

type SetupStage = 'idle' | 'awaiting-code' | 'recovery-codes';
type NativeStage = 'idle' | 'enrolling' | 'awaiting-code' | 'active';

export default function TotpSettings() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [stage, setStage] = useState<SetupStage>('idle');
  const [secret, setSecret] = useState('');
  const [otpauthUri, setOtpauthUri] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const [nativeStage, setNativeStage] = useState<NativeStage>('idle');
  const [nativeLoading, setNativeLoading] = useState(false);
  const [nativeMessage, setNativeMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [nativeFactorId, setNativeFactorId] = useState('');
  const [nativeChallengeId, setNativeChallengeId] = useState('');
  const [nativeQrCode, setNativeQrCode] = useState('');
  const [nativeSecret, setNativeSecret] = useState('');
  const [nativeCode, setNativeCode] = useState('');

  useEffect(() => {
    void loadStatus();
    void loadNativeStatus();
  }, []);

  async function loadNativeStatus() {
    if (!supabase) return;
    try {
      const factors = await listVerifiedTotpFactors(supabase);
      if (factors.length > 0) {
        setNativeFactorId(factors[0].id);
        setNativeStage('active');
      }
    } catch (e: any) {
      // Nur UI-Status; ein Ladefehler blockiert nicht das Anzeigen des restlichen Formulars.
      console.error('[TotpSettings] Nativer MFA-Status konnte nicht geladen werden:', e?.message ?? e);
    }
  }

  async function handleNativeStartSetup() {
    if (!supabase) return;
    setNativeMessage(null);
    setNativeLoading(true);
    try {
      const enrollment = await enrollTotpFactor(supabase, 'CAPITAL-AI Native MFA');
      setNativeFactorId(enrollment.factorId);
      setNativeQrCode(enrollment.qrCode);
      setNativeSecret(enrollment.secret);
      const challengeId = await challengeTotpFactor(supabase, enrollment.factorId);
      setNativeChallengeId(challengeId);
      setNativeCode('');
      setNativeStage('awaiting-code');
    } catch (e: any) {
      setNativeMessage({
        type: 'error',
        text: e instanceof NativeMfaError ? e.message : `Registrierung konnte nicht gestartet werden: ${e.message ?? e}`,
      });
    } finally {
      setNativeLoading(false);
    }
  }

  async function handleNativeVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (nativeCode.trim().length !== 6) {
      setNativeMessage({ type: 'error', text: 'Bitte den 6-stelligen Code aus deiner Authenticator-App eingeben.' });
      return;
    }
    setNativeLoading(true);
    setNativeMessage(null);
    try {
      await verifyTotpChallenge(supabase, nativeFactorId, nativeChallengeId, nativeCode.trim());
      setNativeStage('active');
      setNativeQrCode('');
      setNativeSecret('');
      setNativeCode('');
      setNativeMessage({ type: 'success', text: 'Native MFA ist jetzt aktiv. Diese Sitzung erfüllt AAL2.' });
    } catch (e: any) {
      setNativeMessage({ type: 'error', text: e instanceof NativeMfaError ? e.message : 'Verifikation fehlgeschlagen.' });
    } finally {
      setNativeLoading(false);
    }
  }

  async function handleNativeCancel() {
    if (supabase && nativeFactorId && nativeStage === 'awaiting-code') {
      try {
        await unenrollTotpFactor(supabase, nativeFactorId);
      } catch {
        // Best effort - ein hängender unverified Faktor blockiert keine spätere Neuregistrierung.
      }
    }
    setNativeStage('idle');
    setNativeFactorId('');
    setNativeChallengeId('');
    setNativeQrCode('');
    setNativeSecret('');
    setNativeCode('');
    setNativeMessage(null);
  }

  async function loadStatus() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setEnabled(null);
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('totp_enabled')
        .eq('id', userData.user.id)
        .maybeSingle();
      if (error) throw error;
      setEnabled(!!data?.totp_enabled);
    } catch (e: any) {
      setMessage({ type: 'error', text: `2FA-Status konnte nicht geladen werden: ${e.message ?? e}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSetup() {
    setMessage(null);
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/totp/setup', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setSecret(body.secret);
      setOtpauthUri(body.otpauthUri);
      setCode('');
      setStage('awaiting-code');
    } catch (e: any) {
      setMessage({ type: 'error', text: `Setup konnte nicht gestartet werden: ${e.message ?? e}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySetup(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setMessage({ type: 'error', text: 'Bitte den 6-stelligen Code aus deiner Authenticator-App eingeben.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await authFetch('/api/auth/totp/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setRecoveryCodes(body.recoveryCodes || []);
      setStage('recovery-codes');
      setEnabled(true);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  function handleCopyRecoveryCodes() {
    void navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFinishSetup() {
    setStage('idle');
    setSecret('');
    setOtpauthUri('');
    setRecoveryCodes([]);
    setMessage({ type: 'success', text: '2FA (TOTP) ist jetzt aktiv.' });
  }

  if (!isSupabaseConfigured()) {
    return <div className="text-red-400 text-sm">Supabase ist nicht konfiguriert.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 p-4 rounded-lg border border-emerald-500/20 bg-black/20">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <h3 className="text-white font-semibold">Native Zwei-Faktor-Authentifizierung (empfohlen)</h3>
        </div>
        <p className="text-white/50 text-sm">
          Von Supabase Auth selbst verifiziert (AAL2) - die maßgebliche Quelle für alle künftigen
          Step-Up-geschützten Aktionen. Nutzt dieselbe Authenticator-App wie unten.
        </p>

        {nativeMessage && (
          <div
            className={`text-sm rounded px-3 py-2 ${
              nativeMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400'
                : nativeMessage.type === 'error'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-blue-500/10 text-blue-400'
            }`}
          >
            {nativeMessage.text}
          </div>
        )}

        {(nativeStage === 'idle' || nativeStage === 'active') && (
          <div className="flex items-center justify-between">
            <span className={`text-sm font-mono ${nativeStage === 'active' ? 'text-emerald-400' : 'text-white/40'}`}>
              {nativeStage === 'active' ? '● Aktiv' : '○ Nicht aktiviert'}
            </span>
            {nativeStage === 'idle' && (
              <button
                onClick={handleNativeStartSetup}
                disabled={nativeLoading}
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium"
              >
                {nativeLoading ? 'Bitte warten…' : 'Native MFA einrichten'}
              </button>
            )}
          </div>
        )}

        {nativeStage === 'awaiting-code' && (
          <form onSubmit={handleNativeVerify} className="space-y-3">
            {nativeQrCode && (
              <div className="space-y-1.5">
                <p className="text-xs text-white/50">QR-Code mit der Authenticator-App scannen:</p>
                <div className="bg-white rounded-lg p-2 w-fit">
                  <img src={nativeQrCode} alt="QR-Code für native MFA-Registrierung" width={160} height={160} />
                </div>
              </div>
            )}
            {nativeSecret && (
              <div className="space-y-1.5">
                <p className="text-xs text-white/50">Alternativ manuell hinzufügen:</p>
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
                  <code className="text-xs font-mono text-white/90 flex-1 break-all">{nativeSecret}</code>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(nativeSecret)}
                    className="text-white/40 hover:text-white shrink-0 cursor-pointer"
                    aria-label="Secret kopieren"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-white/50">Code aus der Authenticator-App zur Bestätigung:</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={nativeCode}
                onChange={(e) => setNativeCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full text-center text-xl font-mono tracking-[0.4em] bg-black/40 border border-white/10 rounded-lg py-2.5 text-white focus:border-aif-gold-DEFAULT/50 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleNativeCancel()}
                className="flex-1 px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={nativeLoading || nativeCode.length !== 6}
                className="flex-1 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium"
              >
                {nativeLoading ? 'Prüfe…' : 'Bestätigen & aktivieren'}
              </button>
            </div>
          </form>
        )}
      </div>

    <div className="space-y-4 p-4 rounded-lg border border-white/10 bg-black/20">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-aif-gold-DEFAULT" />
        <h3 className="text-white font-semibold">Zwei-Faktor-Authentifizierung (Legacy)</h3>
      </div>
      <p className="text-white/50 text-sm">
        Historischer Migrationspfad, bleibt als Defense-in-Depth erhalten. Für neue
        Einrichtungen bitte die native MFA oben verwenden.
      </p>

      {message && (
        <div
          className={`text-sm rounded px-3 py-2 ${
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

      {stage === 'idle' && (
        <div className="flex items-center justify-between">
          <span className={`text-sm font-mono ${enabled ? 'text-emerald-400' : 'text-white/40'}`}>
            {enabled === null ? 'Lade Status…' : enabled ? '● Aktiv' : '○ Nicht aktiviert'}
          </span>
          {!enabled && (
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium"
            >
              {loading ? 'Bitte warten…' : '2FA einrichten'}
            </button>
          )}
        </div>
      )}

      {stage === 'awaiting-code' && (
        <form onSubmit={handleVerifySetup} className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs text-white/50">
              In der Authenticator-App manuell hinzufügen (kein QR-Scan verfügbar):
            </p>
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
              <code className="text-xs font-mono text-white/90 flex-1 break-all">{secret}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(secret)}
                className="text-white/40 hover:text-white shrink-0 cursor-pointer"
                aria-label="Secret kopieren"
              >
                <Copy size={14} />
              </button>
            </div>
            {otpauthUri && (
              <p className="text-[10px] text-white/30 break-all">Setup-URI: {otpauthUri}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/50">Code aus der Authenticator-App zur Bestätigung:</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-xl font-mono tracking-[0.4em] bg-black/40 border border-white/10 rounded-lg py-2.5 text-white focus:border-aif-gold-DEFAULT/50 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStage('idle')}
              className="flex-1 px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex-1 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium"
            >
              {loading ? 'Prüfe…' : 'Bestätigen & aktivieren'}
            </button>
          </div>
        </form>
      )}

      {stage === 'recovery-codes' && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <ShieldAlert className="text-amber-400 w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs text-white/70 leading-relaxed">
              Diese 10 Recovery-Codes werden <span className="font-bold">nur jetzt einmalig</span> angezeigt.
              Jeder Code funktioniert genau einmal für den Break-Glass-Zugang, falls du dein Gerät verlierst.
              Speichere sie an einem sicheren Ort, bevor du fortfährst.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5 bg-black/40 border border-white/10 rounded-lg p-3">
            {recoveryCodes.map((c) => (
              <code key={c} className="text-xs font-mono text-white/90">{c}</code>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyRecoveryCodes}
              className="flex-1 px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm flex items-center justify-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? 'Kopiert' : 'Codes kopieren'}
            </button>
            <button
              onClick={handleFinishSetup}
              className="flex-1 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
            >
              Ich habe die Codes gespeichert
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
