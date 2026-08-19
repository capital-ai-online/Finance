import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, RefreshCw } from 'lucide-react';
import { browserSupportsWebAuthn, startAuthentication } from '@simplewebauthn/browser';
import { authFetch } from '../lib/authFetch';

interface ShadowSummary {
  shadowId: string;
  repository: string;
  prNumber: number;
  baseBranch: string;
  baseSha: string;
  headSha: string;
  authorizationDigest: string;
  approvedAt: string;
  observedAt: string;
  verdict: 'APPROVED_SHADOW';
}

interface ShadowStatus {
  mode: 'SHADOW';
  authoritativeForCi: false;
  dispatchEnabled: false;
  githubResolverConfigured: boolean;
  activeOwnerCredentialCount: number;
  recent: ShadowSummary[];
}

export function M10PrAuthorizationShadowPanel() {
  const [status, setStatus] = useState<ShadowStatus | null>(null);
  const [prNumber, setPrNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      const res = await authFetch('/api/m10/credential-enrollment/shadow/status');
      if (!res.ok) return;
      setStatus(await res.json());
    } catch {
      // Read-only refresh failure does not alter authorization state.
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const runShadowAuthorization = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const parsedPr = Number(prNumber);
      if (!Number.isInteger(parsedPr) || parsedPr <= 0) {
        throw new Error('Bitte eine gültige positive Pull-Request-Nummer eingeben.');
      }

      const beginRes = await authFetch('/api/m10/credential-enrollment/shadow/begin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prNumber: parsedPr }),
      });
      const beginBody = await beginRes.json().catch(() => ({}));
      if (!beginRes.ok) {
        throw new Error(beginBody.error || `Shadow-Challenge fehlgeschlagen (HTTP ${beginRes.status}).`);
      }

      const response = await startAuthentication({ optionsJSON: beginBody.options });
      const completeRes = await authFetch('/api/m10/credential-enrollment/shadow/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: beginBody.challengeId, response }),
      });
      const completeBody = await completeRes.json().catch(() => ({}));
      if (!completeRes.ok) {
        throw new Error(completeBody.error || `Shadow-Verifikation fehlgeschlagen (HTTP ${completeRes.status}).`);
      }
      if (completeBody.verdict !== 'APPROVED_SHADOW' || completeBody.dispatchEnabled !== false) {
        throw new Error('Shadow-Verifikation lieferte keinen eindeutig nicht-autoritativen PASS-Zustand.');
      }

      setMessage(
        `Shadow PASS für PR #${completeBody.context.prNumber} auf Head ${String(completeBody.context.headSha).slice(0, 12)}… — keine CI wurde gestartet.`,
      );
      await refreshStatus();
    } catch (err: any) {
      setError(err?.message || 'M10 Shadow-Autorisierung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  if (!browserSupportsWebAuthn()) {
    return (
      <div className="border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 text-xs text-amber-300">
        <AlertTriangle className="inline w-4 h-4 mr-2" />
        Phase-6-Shadow benötigt einen Browser mit WebAuthn/Passkey-Unterstützung.
      </div>
    );
  }

  return (
    <div className="border border-cyan-500/20 bg-cyan-500/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-300" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-200">M10 Phase 6 · Shadow Mode</h4>
          </div>
          <p className="text-xs text-white/55 mt-2 leading-relaxed">
            Prüft eine echte Owner-Passkey-Assertion gegen den aktuellen GitHub-PR-Zustand. Dieser Pfad ist
            ausdrücklich nicht autoritativ und startet, konsumiert oder dispatcht keine CI.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshStatus()}
          className="text-white/50 hover:text-white"
          aria-label="Shadow-Status aktualisieren"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          Modus: <span className="font-bold text-cyan-300">SHADOW</span>
        </div>
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          GitHub Resolver: <span className={status?.githubResolverConfigured ? 'text-emerald-300' : 'text-amber-300'}>
            {status?.githubResolverConfigured ? 'konfiguriert' : 'fail-closed'}
          </span>
        </div>
        <div className="rounded-lg bg-black/30 border border-white/10 px-3 py-2">
          Aktive Owner-Credentials: <span className="text-white/80">{status?.activeOwnerCredentialCount ?? '—'}</span>
        </div>
      </div>

      {status && !status.githubResolverConfigured && (
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          Der serverseitige M10 GitHub Resolver ist noch nicht konfiguriert. Shadow bleibt bis zur sicheren
          Bereitstellung von <code>M10_GITHUB_TOKEN</code> gesperrt.
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
          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-cyan-400/50"
        />
        <button
          type="button"
          disabled={loading || !status?.githubResolverConfigured || (status?.activeOwnerCredentialCount ?? 0) < 1}
          onClick={() => void runShadowAuthorization()}
          className="px-4 py-2.5 rounded-xl bg-cyan-300 text-black font-bold text-xs uppercase tracking-wider disabled:opacity-40"
        >
          {loading ? 'Passkey wird geprüft…' : 'Shadow-Autorisierung prüfen'}
        </button>
      </div>

      {error && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</p>}
      {message && (
        <p className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <CheckCircle2 className="inline w-4 h-4 mr-2" />{message}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-white/40">Letzte Shadow-Evidence</p>
        {(status?.recent ?? []).length === 0 ? (
          <p className="text-xs text-white/35">Noch keine reale Phase-6-Shadow-Assertion protokolliert.</p>
        ) : (
          status!.recent.map(item => (
            <div key={item.shadowId} className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-[11px] text-white/60">
              <span className="text-emerald-300 font-semibold">APPROVED_SHADOW</span>
              {' · '}PR #{item.prNumber}
              {' · '}Head {item.headSha.slice(0, 12)}…
              {' · '}{new Date(item.observedAt).toLocaleString('de-DE')}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
