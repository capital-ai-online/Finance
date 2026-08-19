import React, { useEffect, useState } from 'react';
import { CheckCircle, GitCommit, RefreshCw, ShieldCheck } from 'lucide-react';
import { authFetch } from '../lib/authFetch';

interface VersionManagerPanelProps {
  currentUserEmail: string;
}

interface VersionProjection {
  version: string;
  authority: string;
  contract: string;
  readOnly: boolean;
  source: string;
  gitTag: string | null;
  commitSha: string | null;
  buildIdentity: string | null;
  manifestContract: string | null;
  releaseNotes: string;
}

interface VersionProjectionResponse {
  success: boolean;
  state?: VersionProjection;
  workspace?: {
    source?: string;
    mutationAuthority?: string;
  };
  error?: string;
}

export function VersionManagerPanel({ currentUserEmail }: VersionManagerPanelProps) {
  const [data, setData] = useState<VersionProjectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjection = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/admin/version');
      if (response.status === 401 || response.status === 403) {
        throw new Error('Zugriff verweigert: Die Plattformversions-Projektion ist auf Administratoren/Supervisoren beschränkt.');
      }
      if (!response.ok) throw new Error(`HTTP-Fehler ${response.status}`);
      const payload = await response.json() as VersionProjectionResponse;
      if (!payload.success || !payload.state) throw new Error(payload.error || 'Plattformversions-Projektion konnte nicht geladen werden.');
      setData(payload);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjection();
  }, [currentUserEmail]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw size={34} className="text-[#E5C17C] animate-spin" />
        <p className="font-mono text-xs text-white/50">Lade read-only Versionsprojektion…</p>
      </div>
    );
  }

  if (error || !data?.state) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center space-y-4">
        <p className="font-mono text-xs text-red-200">{error || 'Versionsprojektion nicht verfügbar.'}</p>
        <button onClick={() => void fetchProjection()} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-mono text-white hover:bg-white/5">
          Erneut prüfen
        </button>
      </div>
    );
  }

  const state = data.state;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 flex items-start gap-3">
        <ShieldCheck className="text-emerald-400 mt-0.5" size={22} />
        <div>
          <p className="text-sm font-semibold text-white">Read-only Platform Version Control Plane</p>
          <p className="mt-1 text-xs text-white/55">
            Diese Ansicht besitzt keine Versions-Mutationsfunktion. Plattformversionsänderungen erfolgen ausschließlich über das kontrollierte Release Version Gate.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/5 bg-[#111114] p-5">
          <span className="text-[10px] uppercase tracking-wider font-mono text-white/40">Plattformversion</span>
          <div className="mt-3 text-4xl font-black font-mono text-white">{state.version}</div>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-emerald-400">
            <CheckCircle size={14} /> {state.readOnly ? 'READ ONLY' : 'INVALID STATE'}
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#111114] p-5">
          <span className="text-[10px] uppercase tracking-wider font-mono text-white/40">Einzige Authority</span>
          <div className="mt-3 text-sm font-mono text-[#E5C17C] break-all">{state.authority}</div>
          <div className="mt-3 text-xs text-white/45">Projection source: <span className="text-white/75">{state.source}</span></div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#111114] p-5">
          <span className="text-[10px] uppercase tracking-wider font-mono text-white/40">Release Evidence</span>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
            <GitCommit size={14} className="text-[#E5C17C]" />
            <span className="font-mono truncate" title={state.commitSha || undefined}>{state.commitSha || 'nicht im Runtime-Manifest vorhanden'}</span>
          </div>
          <div className="mt-2 text-[11px] text-white/40 break-all">{state.buildIdentity || state.manifestContract || 'package.json projection'}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#111114] p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-white/45">Control-plane contract</p>
            <p className="mt-1 text-sm font-mono text-white/80">{state.contract}</p>
          </div>
          <button onClick={() => void fetchProjection()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-mono text-white hover:bg-white/5 disabled:opacity-50">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Aktualisieren
          </button>
        </div>
        <p className="text-xs text-white/50">{state.releaseNotes}</p>
        <p className="text-[11px] font-mono text-white/35">Mutation authority: {data.workspace?.mutationAuthority || 'controlled-release-version-gate'}</p>
      </div>
    </div>
  );
}
