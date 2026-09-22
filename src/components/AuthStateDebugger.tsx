import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Lock,
  RefreshCw,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';

interface BackendSessionProjection {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    subscriptionTier: string;
  };
}

export function AuthStateDebugger() {
  const [projection, setProjection] = useState<BackendSessionProjection>({ authenticated: false });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadDebugData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        setProjection({ authenticated: false });
        setError(`Backend-Session nicht verfügbar (HTTP ${response.status}).`);
        return;
      }
      const payload = (await response.json()) as BackendSessionProjection;
      setProjection(payload?.authenticated === true ? payload : { authenticated: false });
    } catch (err) {
      setProjection({ authenticated: false });
      setError(err instanceof Error ? err.message : 'Backend-Session nicht erreichbar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDebugData();
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadDebugData();
    setRefreshing(false);
  };

  const copyDebugInfoToClipboard = () => {
    const debugPayload = {
      timestamp: new Date().toISOString(),
      architecture: 'backend-first-http-only-session',
      authenticated: projection.authenticated,
      userId: projection.user?.id ?? null,
      userEmail: projection.user?.email ?? null,
      subscriptionTier: projection.user?.subscriptionTier ?? null,
      rawTokenExposedToBrowser: false,
      error: error || null,
    };

    void navigator.clipboard.writeText(JSON.stringify(debugPayload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="auth-state-debugger-panel"
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1f]/80 p-6 shadow-xl backdrop-blur-md"
    >
      <div className="mb-6 flex flex-col gap-4 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <ShieldAlert className="text-aif-gold-DEFAULT" size={20} />
            <h3 className="font-display text-base font-bold uppercase tracking-wider text-white">
              Backend Auth Debugger
            </h3>
            <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/40">
              HTTPONLY SESSION
            </span>
          </div>
          <p className="text-xs text-white/60">
            Diagnose der serverseitig verifizierten Sessionprojektion. Raw Access-/Refresh-Tokens
            werden absichtlich nicht an den Browser ausgeliefert.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleManualRefresh()}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
            Aktualisieren
          </button>
          <button
            type="button"
            onClick={copyDebugInfoToClipboard}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/10"
          >
            <Copy size={12} />
            {copied ? 'Kopiert!' : 'Report kopieren'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center font-mono text-xs uppercase tracking-widest text-white/40">
          Backend-Session wird gelesen…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
              Sitzung
            </span>
            <div className="flex items-center gap-2">
              {projection.authenticated ? (
                <>
                  <UserCheck size={17} className="text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-300">Authentifiziert</span>
                </>
              ) : (
                <>
                  <Lock size={17} className="text-white/30" />
                  <span className="text-sm font-bold text-white/50">Nicht angemeldet</span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/5 p-4">
            <span className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-white/40">
              Token-Grenze
            </span>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={17} className="text-emerald-400" />
              <span className="text-sm font-bold text-emerald-300">Browser tokenfrei</span>
            </div>
          </div>

          {projection.authenticated && projection.user && (
            <div className="space-y-2 rounded-xl border border-white/5 bg-black/25 p-4 text-xs md:col-span-2">
              <div><span className="text-white/40">User-ID:</span> <span className="font-mono text-white">{projection.user.id}</span></div>
              <div><span className="text-white/40">E-Mail:</span> <span className="text-white">{projection.user.email}</span></div>
              <div><span className="text-white/40">Abo:</span> <span className="font-bold text-aif-gold-DEFAULT">{projection.user.subscriptionTier}</span></div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200 md:col-span-2">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
