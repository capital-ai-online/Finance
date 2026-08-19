import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import { authFetch } from '../lib/authFetch';

interface AuthorizationStatus {
  mode: 'AUTHORITATIVE';
  authoritativeForCi: true;
  dispatchEnabled: true;
  githubResolverConfigured: boolean;
  githubDispatcherConfigured: boolean;
  activeOwnerCredentialCount: number;
}

export function M10PrAuthorizationPanel() {
  const [status, setStatus] = useState<AuthorizationStatus | null>(null);
  const [prNumber, setPrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      const res = await authFetch('/api/m10/credential-enrollment/authorize/status');
      if (!res.ok) return;
      setStatus(await res.json());
    } catch {
      // Read-only status refresh. Authorization remains fail-closed when status is unavailable.
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const authorizeCi = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const parsedPr = Number(prNumber);
      if (!Number.isInteger(parsedPr) || parsedPr <= 0) {
        throw new Error('Bitte eine gültige positive Pull-Request-Nummer eingeben.');
      }

      const beginRes = await authFetch('/api/m10/credential-enrollment/authorize/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prNumber: parsedPr }),
      });
      const beginBody = await beginRes.json().catch(() => ({}));
      if (!beginRes.ok) throw new Error(beginBody.error || `M10-Challenge fehlgeschlagen (HTTP ${beginRes.status}).`);

      const response = await startAuthentication({ optionsJSON: beginBody.options });
      const completeRes = await authFetch('/api/m10/credential-enrollment/authorize/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: beginBody.challengeId, response }),
      });
      const completeBody = await completeRes.json().catch(() => ({}));
      if (!completeRes.ok) {
        throw new Error(completeBody.error || `M10-Autorisierung fehlgeschlagen (HTTP ${completeRes.status}).`);
      }
      if (
        completeBody.verdict !== 'CI_DISPATCH_ACCEPTED'
        || completeBody.authoritativeForCi !== true
        || completeBody.workflowGatePending !== true
      ) {
        throw new Error('M10 lieferte keinen eindeutig autorisierten CI-Dispatch-Zustand.');
      }

      setMessage(
        `Passkey-Autorisierung akzeptiert für PR #${completeBody.context.prNumber} auf Head ${String(completeBody.context.headSha).slice(0, 12)}…. `
        + 'Der GitHub-Workflow darf die teure CI erst nach Einlösung des einmaligen M10-Workflow-Gates starten.',
      );
      await refreshStatus();
    } catch (err: any) {
      setError(err?.message || 'M10 CI-Autorisierung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  if (!browserSupportsWebAuthn()) {
    return (
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 text-xs text-amber-300">
        <AlertTriangle className="inline w-4 h-4 mr-2" />
        M10 CI-Autorisierung benötigt einen Browser mit WebAuthn/Passkey-Unterstützung.
      </div>
    );
  }

  const ready = Boolean(
    status?.githubResolverConfigured
    && status?.githubDispatcherConfigured
    && (status?.activeOwnerCredentialCount ?? 0) > 0,
  );

  return (
    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200">M10 · Autoritative CI-Autorisierung</h4>
          </div>
          <p className="text-xs text-white/55 mt-2 leading-relaxed">
            Bindet eine echte Owner-Passkey-Assertion an den aktuellen GitHub-PR-Zustand. Genau ein
            unverbrauchter Approval-/Consumption-Pfad darf anschließend den teuren CI-Workflow für
            diesen Head freischalten. Merge bleibt eine separate Human-Aktion.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshStatus()}
          className="text-white/50 hover:text-white"
          aria-label="M10 Autorisierungsstatus aktualisieren"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          Modus: <span className="font-bold text-emerald-300">AUTHORITATIVE</span>
        </div>
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          GitHub Resolver: <span className={status?.githubResolverConfigured ? 'text-emerald-300' : 'text-amber-300'}>
            {status?.githubResolverConfigured ? 'konfiguriert' : 'fail-closed'}
          </span>
        </div>
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          CI Dispatcher: <span className={status?.githubDispatcherConfigured ? 'text-emerald-300' : 'text-amber-300'}>
            {status?.githubDispatcherConfigured ? 'konfiguriert' : 'fail-closed'}
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[11px]">
        Aktive Owner-Credentials: <span className="text-white/80">{status?.activeOwnerCredentialCount ?? '—'}</span>
      </div>

      {!ready && status && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          M10 bleibt fail-closed, bis Resolver, separater Actions-Dispatcher und mindestens ein aktiver Owner-Passkey verfügbar sind.
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="number"
          min={1}
          inputMode="numeric"
          value={prNumber}
          onChange={event => setPrNumber(event.target.value)}
          placeholder="PR-Nummer"
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-400/50"
        />
        <button
          type="button"
          disabled={loading || !ready}
          onClick={() => void authorizeCi()}
          className="px-4 py-2.5 rounded-xl bg-emerald-300 text-black font-bold text-xs uppercase tracking-wider disabled:opacity-40"
        >
          {loading ? 'Passkey wird geprüft…' : 'CI per Passkey autorisieren'}
        </button>
      </div>

      {error && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
      {message && (
        <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <CheckCircle2 className="inline w-4 h-4 mr-2" />{message}
        </p>
      )}
    </div>
  );
}
