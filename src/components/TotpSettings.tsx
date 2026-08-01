import { useEffect, useState } from 'react';
import { KeyRound, Copy, Check, ShieldAlert } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { authFetch } from '../lib/authFetch';

/**
 * ADR-0003.5 / Audit ARCH-AUDIT-0002 (D9): TOTP-Setup-Oberfläche für die Step-Up-
 * Authentifizierung. Der Server-seitige Ablauf (server/stepUp.ts: /totp/setup,
 * /totp/verify-setup) existierte bereits, hatte aber in der gesamten Codebasis keine
 * Frontend-Entsprechung - ohne diese Komponente konnte niemand jemals ein Step-Up-Token
 * erzeugen. Analog zu PasskeySettings.tsx als eigenständige Sicherheits-Einstellung in
 * ProfilePage.tsx eingebunden.
 */

type SetupStage = 'idle' | 'awaiting-code' | 'recovery-codes';

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

  useEffect(() => {
    void loadStatus();
  }, []);

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
    <div className="space-y-4 p-4 rounded-lg border border-white/10 bg-black/20">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-aif-gold-DEFAULT" />
        <h3 className="text-white font-semibold">Zwei-Faktor-Authentifizierung (TOTP)</h3>
      </div>
      <p className="text-white/50 text-sm">
        Erforderlich für Step-Up-geschützte Aktionen (z. B. Versions-Bump). Nutzt eine
        Authenticator-App (z. B. Google Authenticator, 1Password, Authy).
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
  );
}
