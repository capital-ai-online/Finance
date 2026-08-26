import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Layers,
  Lock,
  RefreshCw,
  ShieldAlert,
  Sliders,
  Trash2,
} from 'lucide-react';
import { authFetch } from '../lib/authFetch';
import { ORCHESTRATOR_TELEMETRY_CONTRACT } from '../lib/orchestratorTelemetrySemantics';
import { describeRefusal, isRefusalStatus } from '../lib/orchestratorPollPolicy';

interface RequestLogEntry {
  id: string;
  ip: string;
  endpoint: string;
  timestamp: string;
  status: 'COMPLETED' | 'QUEUED' | 'REJECTED' | 'TIMED_OUT' | 'RUNNING';
  duration?: number;
}

interface OrchestratorStats {
  activeRequests: number;
  queueSize: number;
  totalProcessed: number;
  totalRejected: number;
  rateLimitsHit: number;
  concurrencyLimit: number;
  maxQueueSize: number;
  rateLimitWindowMs: number;
  maxRequestsPerWindow: number;
  requestsLastMinute: number;
  recentLogs: RequestLogEntry[];
}

interface ModelIntegrationStatus {
  id: string;
  name: string;
  task: string;
  configured: boolean;
  status: string;
  latency: number | null;
  cost?: string;
}

const POLL_INTERVAL_MS = 2000;

// FO-05 / F-01: Ein 401/403/429 auf den administrativen Orchestrator-Reads bedeutet, dass der Server
// diesen Aufruf abweist — Sitzung abgelaufen, Rolle außerhalb SUPERVISOR_ZONE_ROLES oder
// Autorisierungs-Rate-Limit. Keiner dieser Zustände bessert sich dadurch, dass der Panel-Poll ihn
// alle zwei Sekunden wiederholt; jeder Versuch schreibt serverseitig einen weiteren DENIED-Datensatz
// nach iam_access_log und verdünnt damit das Sicherheits-Auditlog.
//
// Der globale 'auth:unauthorized'-Handler in SessionComposition.tsx reicht als Stopp NICHT aus: er
// ruft handleLogout(), was folgenlos bleibt, wenn gar keine Session mehr zu löschen ist — also genau
// in dem Zustand, der das 401 überhaupt erst erzeugt. Zusätzlich ist das Admin-Gate in
// AdminPortal.tsx eine clientseitige E-Mail-Prüfung, sodass das Panel montiert bleiben kann,
// während der Server bereits ablehnt. Der Poll muss sich deshalb lokal selbst beenden.

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  note: string;
  icon: React.ReactNode;
  progress?: number;
  progressLabel?: string;
}

function MetricCard({ label, value, note, icon, progress, progressLabel }: MetricCardProps) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between min-h-[150px]">
      <div>
        <div className="flex justify-between items-center text-white/55 text-[11px] font-mono uppercase gap-2">
          <span>{label}</span>
          {icon}
        </div>
        <div className="text-3xl font-black font-display text-white mt-2">{value}</div>
      </div>
      <div className="mt-4 space-y-2">
        {progress !== undefined && (
          <>
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-aif-gold-DEFAULT h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/40 font-mono">
              <span>{progressLabel}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </>
        )}
        <p className="text-[10px] text-white/45 font-mono leading-relaxed">{note}</p>
      </div>
    </div>
  );
}

export function OrchestratorPanel() {
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [concurrencyLimit, setConcurrencyLimit] = useState(3);
  const [maxQueueSize, setMaxQueueSize] = useState(10);
  const [maxRequestsPerWindow, setMaxRequestsPerWindow] = useState(30);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const formInitialized = useRef(false);

  const [modelStatuses, setModelStatuses] = useState<ModelIntegrationStatus[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // FO-05 / F-01 — serverseitige Abweisung der administrativen Reads. Solange gesetzt, läuft kein Poll.
  const [refusal, setRefusal] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = () => {
    if (pollRef.current !== null) return;
    pollRef.current = setInterval(() => fetchStats(), POLL_INTERVAL_MS);
  };

  // Beendet den Poll und hält fest, warum. Der Aufruf ist idempotent.
  const blockOnRefusal = (status: number) => {
    stopPolling();
    setRefusal(describeRefusal(status));
    setError(null);
    setModelError(null);
  };

  const fetchModelIntegrationStatus = async () => {
    setIsLoadingModels(true);
    try {
      const response = await authFetch('/api/orchestrator/ping-models');
      if (isRefusalStatus(response.status)) {
        blockOnRefusal(response.status);
        return;
      }
      if (!response.ok) throw new Error('Modell-Integrationsstatus konnte nicht geladen werden.');
      const data = await response.json();
      setModelStatuses(Array.isArray(data.models) ? data.models : []);
      setModelError(null);
    } catch (err) {
      console.error('Failed to fetch model integration status:', err);
      setModelError(err instanceof Error ? err.message : 'Modell-Integrationsstatus konnte nicht geladen werden.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const fetchStats = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const response = await authFetch('/api/orchestrator/stats');
      // Abweisung durch den Server: Poll beenden, statt ihn im 2-Sekunden-Takt zu wiederholen.
      if (isRefusalStatus(response.status)) {
        blockOnRefusal(response.status);
        return;
      }
      if (!response.ok) throw new Error('Fehler beim Laden der Orchestrator-Daten.');
      const data: OrchestratorStats = await response.json();
      setStats(data);

      if (!formInitialized.current) {
        setConcurrencyLimit(data.concurrencyLimit);
        setMaxQueueSize(data.maxQueueSize);
        setMaxRequestsPerWindow(data.maxRequestsPerWindow);
        formInitialized.current = true;
      }
      setError(null);
      // Autorisierter Read: eine zuvor abgewiesene Sitzung ist wieder gültig, Poll darf laufen.
      setRefusal(null);
      startPolling();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Server-Verbindungsfehler.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // FO-05 — Polling-Lifecycle. Das Intervall startet erst aus einem autorisierten Read heraus
  // (siehe fetchStats), damit bei einer bereits abgewiesenen Sitzung gar kein Poll entsteht.
  useEffect(() => {
    fetchStats();
    fetchModelIntegrationStatus();
    return () => stopPolling();
  }, []);

  const handleSaveConfig = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await authFetch('/api/orchestrator/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrencyLimit, maxQueueSize, maxRequestsPerWindow }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Konfiguration konnte nicht aktualisiert werden.');
      }
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verbindungsfehler.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetStats = async () => {
    if (!window.confirm('Möchten Sie die Orchestrator-Zähler und Recent Events wirklich zurücksetzen?')) return;
    try {
      const response = await authFetch('/api/orchestrator/reset', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Zurücksetzen fehlgeschlagen.');
      }
      const data = await response.json();
      if (data.success) setStats(data.stats);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Verbindungsfehler.');
    }
  };

  if (loading && !stats) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-white/50 uppercase tracking-widest">Initialisiere Orchestrator-Telemetrie...</p>
      </div>
    );
  }

  const activePercent = stats ? Math.min(100, (stats.activeRequests / stats.concurrencyLimit) * 100) : 0;
  const queuePercent = stats ? Math.min(100, (stats.queueSize / stats.maxQueueSize) * 100) : 0;
  const contract = ORCHESTRATOR_TELEMETRY_CONTRACT;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
        <div className="max-w-4xl">
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/35 tracking-wider font-mono uppercase">
            Capital-AI • {contract.scope.badge}
          </span>
          <h2 className="text-2xl font-black text-white font-display mt-2">Request-Orchestrator Telemetrie</h2>
          <p className="text-xs text-white/70 mt-1 font-sans">{contract.scope.description}</p>
          <p className="text-[10px] text-white/40 mt-1 font-mono">{contract.scope.freshness}</p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/80 flex items-center gap-1.5 text-xs font-mono uppercase cursor-pointer"
          disabled={isRefreshing}
        >
          <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
          <span>Aktualisieren</span>
        </button>
      </div>

      {refusal && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 font-mono">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <span>{refusal}</span>
        </div>
      )}

      {error && !refusal && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-mono">
          <ShieldAlert size={16} />
          <span>Warnung: {error} (zuletzt geladene Daten können veraltet sein)</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <MetricCard
          label={contract.metrics.activeRequests.label}
          value={<>{stats?.activeRequests ?? 0} <span className="text-sm text-white/35">/ {stats?.concurrencyLimit ?? 0}</span></>}
          note={contract.metrics.activeRequests.note}
          icon={<Activity size={14} className="text-amber-400" />}
          progress={activePercent}
          progressLabel="Slot-Auslastung"
        />
        <MetricCard
          label={contract.metrics.queueSize.label}
          value={<>{stats?.queueSize ?? 0} <span className="text-sm text-white/35">/ {stats?.maxQueueSize ?? 0}</span></>}
          note={contract.metrics.queueSize.note}
          icon={<Layers size={14} className="text-purple-400" />}
          progress={queuePercent}
          progressLabel="Queue-Auslastung"
        />
        <MetricCard
          label={contract.metrics.recentEvents.label}
          value={stats?.requestsLastMinute ?? 0}
          note={contract.metrics.recentEvents.note}
          icon={<Clock size={14} className="text-aif-gold-DEFAULT" />}
        />
        <MetricCard
          label={contract.metrics.totalProcessed.label}
          value={(stats?.totalProcessed ?? 0).toLocaleString()}
          note={contract.metrics.totalProcessed.note}
          icon={<CheckCircle size={14} className="text-emerald-400" />}
        />
        <MetricCard
          label={contract.metrics.totalRejected.label}
          value={(stats?.totalRejected ?? 0).toLocaleString()}
          note={contract.metrics.totalRejected.note}
          icon={<AlertTriangle size={14} className="text-rose-400" />}
        />
        <MetricCard
          label={contract.metrics.rateLimitsHit.label}
          value={stats?.rateLimitsHit ?? 0}
          note={contract.metrics.rateLimitsHit.note}
          icon={<ShieldAlert size={14} className="text-purple-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col h-[520px]">
          <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Database className="text-aif-gold-DEFAULT" size={16} />
              <div>
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">{contract.events.title}</h3>
                <p className="text-[10px] text-white/40 mt-0.5 font-mono">{contract.events.limitation}</p>
              </div>
            </div>
            <button
              onClick={handleResetStats}
              className="text-white/40 hover:text-rose-400 transition-all p-1 hover:bg-white/5 rounded-lg flex items-center gap-1 text-[10px] font-mono uppercase"
              title="Zähler und Recent Events zurücksetzen"
            >
              <Trash2 size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {!stats || stats.recentLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Clock size={24} className="text-white/20 mb-2" />
                <p className="text-xs font-mono text-white/35">{contract.events.empty}</p>
                <p className="text-[10px] text-white/25 mt-1">{contract.events.limitation}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] font-mono text-white/55 uppercase tracking-wider bg-white/5">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Endpoint-Key</th>
                      <th className="p-2.5">Maskierte Client-IP</th>
                      <th className="p-2.5">Orchestrator-Status</th>
                      <th className="p-2.5">Zeitstempel</th>
                      <th className="p-2.5 text-right">Dauer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentLogs.map((log) => {
                      const badgeClass =
                        log.status === 'RUNNING'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                          : log.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                            : log.status === 'QUEUED'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/25'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/25';

                      return (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-all font-mono">
                          <td className="p-2.5 text-white/40">#{log.id}</td>
                          <td className="p-2.5 font-bold text-white/80">{log.endpoint}</td>
                          <td className="p-2.5 text-white/50 truncate max-w-[150px]">{log.ip}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>{log.status}</span>
                          </td>
                          <td className="p-2.5 text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="p-2.5 text-right font-bold text-white/65">
                            {log.duration !== undefined ? `${log.duration}ms` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-white/10">
              <Sliders className="text-aif-gold-DEFAULT" size={16} />
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">Orchestrator-Konfiguration</h3>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center gap-3">
                <label className="text-[11px] font-mono text-white/70 uppercase">Max. parallele Requests</label>
                <span className="text-xs font-black text-amber-300 font-mono">{concurrencyLimit}</span>
              </div>
              <input type="range" min="1" max="10" value={concurrencyLimit} onChange={(event) => setConcurrencyLimit(Number(event.target.value))} className="w-full accent-aif-gold-DEFAULT cursor-pointer" />
              <p className="text-[9px] text-white/40">Begrenzt parallele Ausführung ausschließlich für instrumentierte Orchestrator-Routen.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center gap-3">
                <label className="text-[11px] font-mono text-white/70 uppercase">Max. Queue-Größe</label>
                <span className="text-xs font-black text-purple-300 font-mono">{maxQueueSize}</span>
              </div>
              <input type="range" min="2" max="30" value={maxQueueSize} onChange={(event) => setMaxQueueSize(Number(event.target.value))} className="w-full accent-purple-400 cursor-pointer" />
              <p className="text-[9px] text-white/40">Ist die Queue voll, werden weitere instrumentierte Requests mit HTTP 429 abgelehnt.</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center gap-3">
                <label className="text-[11px] font-mono text-white/70 uppercase">Client-Limit pro Minute</label>
                <span className="text-xs font-black text-purple-300 font-mono">{maxRequestsPerWindow}</span>
              </div>
              <input type="range" min="5" max="100" value={maxRequestsPerWindow} onChange={(event) => setMaxRequestsPerWindow(Number(event.target.value))} className="w-full accent-purple-400 cursor-pointer" />
              <p className="text-[9px] text-white/40">Sliding-Window-Grenze pro abgeleiteter Client-IP; keine Bot- oder Angriffserkennung.</p>
            </div>

            {saveSuccess && (
              <div className="text-center text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 py-2 px-3 rounded-lg font-mono">
                ✓ Parameter gespeichert.
              </div>
            )}

            <button type="submit" disabled={isSaving} className="w-full py-3 rounded-xl bg-aif-gold-DEFAULT text-black text-xs font-black tracking-widest uppercase transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50">
              {isSaving ? 'Speichere...' : 'Parameter anwenden'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Cpu size={16} className="text-aif-gold-DEFAULT" />
              <span>{contract.models.title}</span>
            </h3>
            <p className="text-[11px] text-white/50 mt-1">{contract.models.description}</p>
          </div>
          <button
            type="button"
            onClick={fetchModelIntegrationStatus}
            disabled={isLoadingModels}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-mono uppercase transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoadingModels ? 'animate-spin' : ''} />
            <span>{isLoadingModels ? contract.models.loadingLabel : contract.models.refreshLabel}</span>
          </button>
        </div>

        {modelError && (
          <div className="text-xs font-mono text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg p-3">{modelError}</div>
        )}

        {modelStatuses.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs font-mono text-white/40 uppercase">{contract.models.loadingLabel}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modelStatuses.map((model) => (
              <div key={model.id} className="p-4 rounded-xl border bg-black/20 border-white/10">
                <div className="text-xs font-black text-white">{model.name}</div>
                <div className="text-[9px] font-mono text-white/40 uppercase mt-0.5">{model.task}</div>
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-mono gap-3">
                  <span className="text-white/40">Integration:</span>
                  <span className={model.configured ? 'font-bold text-emerald-300' : 'font-bold text-white/45'}>
                    {model.configured ? 'CONFIGURED' : 'NOT INTEGRATED'}
                  </span>
                </div>
                <p className="text-[9px] text-white/35 font-mono mt-3">{contract.models.noMeasurement}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="text-amber-400 shrink-0 mt-0.5" size={20} />
        <div>
          <div className="text-[11px] font-mono text-amber-300 uppercase font-bold">{contract.safeguards.title}</div>
          <p className="text-xs text-white/70 mt-1 leading-relaxed">{contract.safeguards.description}</p>
        </div>
      </div>
    </div>
  );
}
