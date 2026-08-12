import { useEffect, useState } from 'react';
import { KeyRound, Copy } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

/**
 * M5A / ESS-0020 / ADR-0064:
 * Supabase Native MFA ist die authoritative TOTP-Assurance. Diese UI verwendet
 * enroll -> challengeAndVerify -> getAuthenticatorAssuranceLevel und schreibt
 * keine TOTP-Secrets in CAPITAL-AI-Anwendungstabellen.
 */

type SetupStage = 'idle' | 'awaiting-code';

export default function TotpSettings() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const [stage, setStage] = useState<SetupStage>('idle');
  const [factorId, setFactorId] = useState('');
  const [secret, setSecret] = useState('');
  const [otpauthUri, setOtpauthUri] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) {
        setEnabled(null);
        return;
      }

      const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
      if (factorError) throw factorError;
      setEnabled((factors?.totp ?? []).some((factor) => factor.status === 'verified'));
    } catch (e: any) {
      setEnabled(null);
      setMessage({ type: 'error', text: `Native-MFA-Status konnte nicht geladen werden: ${e.message ?? e}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleStartSetup() {
    if (!supabase) return;
    setMessage(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'CAPITAL-AI Authenticator',
      });
      if (error) throw error;
      if (!data?.id || !data.totp) throw new Error('Supabase hat keinen TOTP-Faktor zurückgegeben.');

      setFactorId(data.id);
      setSecret(data.totp.secret ?? '');
      setOtpauthUri(data.totp.uri ?? '');
      setQrCode(data.totp.qr_code ?? '');
      setCode('');
      setStage('awaiting-code');
      setMessage({ type: 'info', text: 'Native TOTP wurde angelegt und muss jetzt verifiziert werden.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: `Setup konnte nicht gestartet werden: ${e.message ?? e}` });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySetup(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!factorId) {
      setMessage({ type: 'error', text: 'Der Native-MFA-Faktor fehlt. Bitte Setup neu starten.' });
      return;
    }
    if (code.trim().length !== 6) {
      setMessage({ type: 'error', text: 'Bitte den 6-stelligen Code aus deiner Authenticator-App eingeben.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;
      if (aal?.currentLevel !== 'aal2' || aal?.nextLevel !== 'aal2') {
        throw new Error('Native MFA wurde verifiziert, aber die Session ist nicht aal2/aal2.');
      }

      setEnabled(true);
      setStage('idle');
      setFactorId('');
      setSecret('');
      setOtpauthUri('');
      setQrCode('');
      setCode('');
      setMessage({ type: 'success', text: 'Native TOTP ist aktiv und die aktuelle Session wurde auf AAL2 angehoben.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSetup() {
    if (supabase && factorId) {
      try {
        await supabase.auth.mfa.unenroll({ factorId });
      } catch {
        // Der unverified Faktor ist keine erfolgreiche Assurance. Status wird danach neu geladen.
      }
    }
    setFactorId('');
    setSecret('');
    setOtpauthUri('');
    setQrCode('');
    setCode('');
    setStage('idle');
    await loadStatus();
  }

  if (!isSupabaseConfigured()) {
    return <div className="text-red-400 text-sm">Supabase ist nicht konfiguriert.</div>;
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border border-white/10 bg-black/20">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-aif-gold-DEFAULT" />
        <h3 className="text-white font-semibold">Zwei-Faktor-Authentifizierung (Native TOTP)</h3>
      </div>
      <p className="text-white/50 text-sm">
        Supabase Native MFA ist die verbindliche TOTP-Assurance. Erfolgreiches Setup gilt erst,
        wenn die aktuelle Session nach der Verifikation den Zustand AAL2 erreicht.
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
            {enabled === null ? 'Status nicht verifiziert' : enabled ? '● Native MFA aktiv' : '○ Nicht aktiviert'}
          </span>
          {!enabled && (
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium"
            >
              {loading ? 'Bitte warten…' : 'Native TOTP einrichten'}
            </button>
          )}
        </div>
      )}

      {stage === 'awaiting-code' && (
        <form onSubmit={handleVerifySetup} className="space-y-3">
          {qrCode && (
            <div className="flex justify-center rounded-lg bg-white p-3">
              <img src={qrCode} alt="QR-Code für Supabase Native TOTP" className="w-48 h-48" />
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs text-white/50">Alternativ Secret manuell in der Authenticator-App eintragen:</p>
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
            {otpauthUri && <p className="text-[10px] text-white/30 break-all">Setup-URI: {otpauthUri}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/50">Code aus der Authenticator-App:</label>
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
              onClick={() => void handleCancelSetup()}
              className="flex-1 px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white text-sm"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="flex-1 px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-medium"
            >
              {loading ? 'Prüfe…' : 'Verifizieren & AAL2 aktivieren'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
