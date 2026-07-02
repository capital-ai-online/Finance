import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  Layers, 
  Settings, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Sliders, 
  Database, 
  Trash2,
  Lock,
  Wifi,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';

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

export function OrchestratorPanel() {
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form controls for configuration
  const [concurrencyLimit, setConcurrencyLimit] = useState<number>(3);
  const [maxQueueSize, setMaxQueueSize] = useState<number>(10);
  const [maxRequestsPerWindow, setMaxRequestsPerWindow] = useState<number>(30);
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem('aif_orchestrator_admin_token') || 'aif-admin-2026');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Model Routing & Latency Check states
  const [modelPings, setModelPings] = useState<any[]>([]);
  const [optimalModelId, setOptimalModelId] = useState<string>('');
  const [isPinging, setIsPinging] = useState(false);

  const triggerPingTests = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/orchestrator/ping-models');
      if (res.ok) {
        const data = await res.json();
        setModelPings(data.models);
        setOptimalModelId(data.optimalModelId);
      }
    } catch (e) {
      console.error('Failed to fetch model pings:', e);
    } finally {
      setIsPinging(false);
    }
  };

  // Fetch stats from backend API
  const fetchStats = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch('/api/orchestrator/stats');
      if (!res.ok) throw new Error('Fehler beim Laden der Orchestrator-Daten.');
      const data: OrchestratorStats = await res.json();
      setStats(data);
      
      // Sync form controls with server settings only on initial load or non-interactive refresh
      if (loading) {
        setConcurrencyLimit(data.concurrencyLimit);
        setMaxQueueSize(data.maxQueueSize);
        setMaxRequestsPerWindow(data.maxRequestsPerWindow);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server-Verbindungsfehler.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Auto-refresh stats every 2 seconds & load model pings on mount
  useEffect(() => {
    fetchStats();
    triggerPingTests();
    const interval = setInterval(() => {
      fetchStats();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update server config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/orchestrator/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Orchestrator-Admin-Token': adminToken
        },
        body: JSON.stringify({
          concurrencyLimit,
          maxQueueSize,
          maxRequestsPerWindow
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Konfiguration konnte nicht aktualisiert werden.');
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Verbindungsfehler.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset counters
  const handleResetStats = async () => {
    if (!window.confirm('Möchten Sie die Transaktions- und Ablehnungszähler wirklich zurücksetzen?')) return;
    try {
      const res = await fetch('/api/orchestrator/reset', { 
        method: 'POST',
        headers: {
          'X-Orchestrator-Admin-Token': adminToken
        }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Zurücksetzen fehlgeschlagen.');
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err: any) {
      alert(err.message || 'Verbindungsfehler.');
    }
  };

  if (loading && !stats) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-md flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-white/50 uppercase tracking-widest">Initialisiere Orchestrator Telemetrie...</p>
      </div>
    );
  }

  // Calculate load percentages
  const activePercent = stats ? Math.min(100, (stats.activeRequests / stats.concurrencyLimit) * 100) : 0;
  const queuePercent = stats ? Math.min(100, (stats.queueSize / stats.maxQueueSize) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10 mb-2">
        <div>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/25 text-amber-400 border border-amber-500/40 tracking-wider font-mono uppercase">
            AIF-Core • Server-Side Traffic Protection
          </span>
          <h2 className="text-2xl font-black text-white font-display mt-2">Request-Orchestrator & Rate Limiter</h2>
          <p className="text-xs text-white/70 mt-1 font-sans">
            Automatische Ablaufsteuerung, Lastverteilung und DDoS-Schutz zur Vermeidung von Serverüberlastungen und API-Abstürzen.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/80 flex items-center gap-1.5 text-xs font-mono uppercase cursor-pointer"
            disabled={isRefreshing}
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Aktualisieren</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Lock size={12} />
            <span className="text-[11px] font-mono tracking-wider font-bold uppercase">AIF-Shield Aktiv</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-mono">
          <ShieldAlert size={16} />
          <span>Warnung: {error} (Daten veraltet)</span>
        </div>
      )}

      {/* Grid: Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        
        {/* KPI 1: Active Concurrency */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-white/50 text-[11px] font-mono uppercase">
              <span>Aktive Threads</span>
              <Activity size={14} className="text-amber-400 animate-pulse" />
            </div>
            <div className="text-3xl font-black font-display text-white mt-2">
              {stats?.activeRequests} <span className="text-sm font-mono font-medium text-white/35">/ {stats?.concurrencyLimit}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${activePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/40 font-mono mt-1.5">
              <span>Auslastung</span>
              <span>{Math.round(activePercent)}%</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Queue Size */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-white/50 text-[11px] font-mono uppercase">
              <span>Warteschlange</span>
              <Layers size={14} className="text-cyan-400" />
            </div>
            <div className="text-3xl font-black font-display text-white mt-2">
              {stats?.queueSize} <span className="text-sm font-mono font-medium text-white/35">/ {stats?.maxQueueSize}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${queuePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/40 font-mono mt-1.5">
              <span>Warteliste voll</span>
              <span>{Math.round(queuePercent)}%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Requests in Last Minute */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-white/50 text-[11px] font-mono uppercase">
              <span>Anfragen / Min</span>
              <Clock size={14} className="text-aif-gold-DEFAULT animate-pulse" />
            </div>
            <div className="text-3xl font-black font-display text-white mt-2">
              {stats?.requestsLastMinute ?? 0} <span className="text-xs font-mono font-medium text-white/35">/ {stats?.maxRequestsPerWindow}</span>
            </div>
          </div>
          <p className="text-[10px] text-aif-gold-DEFAULT font-mono mt-4 flex items-center gap-1">
            <span>Echtzeit Durchsatz</span>
          </p>
        </div>

        {/* KPI 4: Processed Requests */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-white/50 text-[11px] font-mono uppercase">
              <span>Verarbeitet</span>
              <CheckCircle size={14} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black font-display text-white mt-2">
              {stats?.totalProcessed.toLocaleString()}
            </div>
          </div>
          <p className="text-[10px] text-emerald-400/80 font-mono mt-4 flex items-center gap-1">
            <Wifi size={10} />
            <span>Erfolgreich</span>
          </p>
        </div>

        {/* KPI 5: Rejected / Dropped Requests */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-white/50 text-[11px] font-mono uppercase">
              <span>Verworfen</span>
              <AlertTriangle size={14} className="text-rose-400" />
            </div>
            <div className="text-3xl font-black font-display text-white mt-2">
              {stats?.totalRejected.toLocaleString()}
            </div>
          </div>
          <p className="text-[10px] text-rose-400/80 font-mono mt-4 flex items-center gap-1">
            <span>Server geschützt</span>
          </p>
        </div>

        {/* KPI 6: Rate Limit Triggers */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-white/50 text-[11px] font-mono uppercase">
              <span>Spam-Blocks</span>
              <ShieldAlert size={14} className="text-purple-400" />
            </div>
            <div className="text-3xl font-black font-display text-white mt-2">
              {stats?.rateLimitsHit}
            </div>
          </div>
          <p className="text-[10px] text-purple-400/80 font-mono mt-4 flex items-center gap-1">
            <span>DDoS unterbunden</span>
          </p>
        </div>

      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Activity Live Logs */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col h-[520px]">
          <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2">
              <Database className="text-aif-gold-DEFAULT" size={16} />
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">Echtzeit Transaktions-Log</h3>
            </div>
            <button
              onClick={handleResetStats}
              className="text-white/40 hover:text-rose-400 transition-all p-1 hover:bg-white/5 rounded-lg flex items-center gap-1 text-[10px] font-mono uppercase"
              title="Zähler zurücksetzen"
            >
              <Trash2 size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {!stats || stats.recentLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Clock size={24} className="text-white/20 mb-2" />
                <p className="text-xs font-mono text-white/35">Noch keine Transaktionen erfasst.</p>
                <p className="text-[10px] text-white/25 mt-0.5">Senden Sie eine Chatfrage oder laden Sie Marktdaten.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] font-mono text-white/55 uppercase tracking-wider bg-white/5">
                      <th className="p-2.5">ID</th>
                      <th className="p-2.5">Endpoint</th>
                      <th className="p-2.5">Client-IP</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Zeitstempel</th>
                      <th className="p-2.5 text-right">Latenz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentLogs.map((log) => {
                      let badgeColor = 'bg-white/5 text-white/50 border-white/10';
                      if (log.status === 'RUNNING') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/25 animate-pulse';
                      else if (log.status === 'COMPLETED') badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
                      else if (log.status === 'QUEUED') badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25';
                      else if (log.status === 'REJECTED') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/25';
                      else if (log.status === 'TIMED_OUT') badgeColor = 'bg-purple-500/10 text-purple-400 border-purple-500/25';

                      return (
                        <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-all font-mono">
                          <td className="p-2.5 text-white/40">#{log.id}</td>
                          <td className="p-2.5 font-bold text-white/80">{log.endpoint}</td>
                          <td className="p-2.5 text-white/50 truncate max-w-[120px]">{log.ip}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-white/40">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-cyan-400">
                            {log.duration !== undefined ? `${log.duration}ms` : '-'}
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

        {/* Right 1 Column: Interactive Tuner Controls */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <form onSubmit={handleSaveConfig} className="space-y-6 flex flex-col h-full justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-4 border-b border-white/10">
                <Sliders className="text-aif-gold-DEFAULT" size={16} />
                <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">Modul-Einstellregler</h3>
              </div>

              {/* Admin Passcode Input */}
              <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider">Admin-Passcode (X-Token)</label>
                  <Lock size={12} className="text-amber-500" />
                </div>
                <input 
                  type="password" 
                  value={adminToken} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setAdminToken(val);
                    localStorage.setItem('aif_orchestrator_admin_token', val);
                  }}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder-white/30 focus:border-amber-500/50 outline-none"
                  placeholder="Passcode eingeben..."
                />
              </div>

              {/* Slider 1: Concurrency */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-white/70 uppercase">Max Parallel-Anfragen</label>
                  <span className="text-xs font-black text-amber-400 font-mono bg-amber-400/10 px-2 py-0.5 rounded">
                    {concurrencyLimit} Threads
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={concurrencyLimit} 
                  onChange={(e) => setConcurrencyLimit(Number(e.target.value))}
                  className="w-full accent-aif-gold-DEFAULT cursor-pointer h-1 rounded-lg bg-white/10"
                />
                <p className="text-[9px] text-white/40 leading-normal">
                  Wie viele teure Rechen- & KI-Operationen dürfen gleichzeitig laufen, bevor andere Anfragen in die Warteschlange müssen.
                </p>
              </div>

              {/* Slider 2: Queue Capacity */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-white/70 uppercase">Warteschlangen-Größe</label>
                  <span className="text-xs font-black text-cyan-400 font-mono bg-cyan-400/10 px-2 py-0.5 rounded">
                    {maxQueueSize} Plätze
                  </span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="30" 
                  value={maxQueueSize} 
                  onChange={(e) => setMaxQueueSize(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1 rounded-lg bg-white/10"
                />
                <p className="text-[9px] text-white/40 leading-normal">
                  Größe des Wartebereichs. Übersteigt der Traffic dieses Limit, werden Anfragen zum Server-Schutz sofort mit Code 429 verworfen.
                </p>
              </div>

              {/* Slider 3: Rate Limiter Ceiling */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-mono text-white/70 uppercase">Client-Limit pro Minute</label>
                  <span className="text-xs font-black text-purple-400 font-mono bg-purple-400/10 px-2 py-0.5 rounded">
                    {maxRequestsPerWindow} Req/Min
                  </span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={maxRequestsPerWindow} 
                  onChange={(e) => setMaxRequestsPerWindow(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer h-1 rounded-lg bg-white/10"
                />
                <p className="text-[9px] text-white/40 leading-normal">
                  Sliding-Window Blockgrenze pro Client-IP pro Minute, um Spam-Bots und automatisierte Ausleseversuche zu stoppen.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              {saveSuccess && (
                <div className="text-center text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 py-2 px-3 rounded-lg font-mono animate-fade-in">
                  ✓ Parameter erfolgreich gespeichert!
                </div>
              )}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-aif-gold-DEFAULT text-black text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(245,196,83,0.2)] hover:shadow-[0_0_25px_rgba(245,196,83,0.35)] hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Speichere...' : 'Parameter anwenden'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Model Auto-Routing Latency Checks */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
              <Cpu size={16} className="text-aif-gold-DEFAULT" />
              <span>Model Auto-Routing &amp; Latency Monitor</span>
            </h3>
            <p className="text-[11px] text-white/50 mt-1">
              Aktive Latenzprüfungen des <strong>Auto-Routers</strong> zur dynamischen Auswahl des schnellsten LLM-Knotens unter 200ms.
            </p>
          </div>
          <button
            type="button"
            onClick={triggerPingTests}
            disabled={isPinging}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-mono uppercase transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw size={12} className={isPinging ? 'animate-spin' : ''} />
            <span>{isPinging ? 'Pinge LLM-Knoten...' : 'Latenz-Ping ausführen'}</span>
          </button>
        </div>

        {modelPings.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs font-mono text-white/40 uppercase">Initialisiere Auto-Router Telemetrie...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {modelPings.map((m) => {
              const isOptimal = m.id === optimalModelId;
              const latencyWarning = m.latency >= 200;
              return (
                <div 
                  key={m.id} 
                  className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-300 ${
                    isOptimal 
                      ? 'bg-aif-gold-DEFAULT/5 border-aif-gold-DEFAULT/40 shadow-[0_0_20px_rgba(245,196,83,0.08)]' 
                      : 'bg-black/20 border-white/5'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="truncate max-w-[80%]">
                      <div className="text-xs font-black text-white truncate">{m.name}</div>
                      <div className="text-[9px] font-mono text-white/40 uppercase mt-0.5">{m.task}</div>
                    </div>
                    {isOptimal && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/30 uppercase font-black tracking-wider animate-pulse">
                        Optimal
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex justify-between items-baseline">
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-mono text-white/40 uppercase">Latency</div>
                      <div className={`text-xl font-black font-mono ${
                        latencyWarning ? 'text-rose-400' : isOptimal ? 'text-aif-gold-DEFAULT' : 'text-cyan-400'
                      }`}>
                        {m.latency}ms
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-mono text-white/40 uppercase">Cost/1M</div>
                      <div className="text-xs font-mono text-white/70 font-bold">${m.cost}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-mono">
                    <span className="text-white/40">Status:</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      latencyWarning ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        latencyWarning ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} />
                      {latencyWarning ? 'LATENCY WARN' : 'READY (<200ms)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safeguards Disclaimer */}
      <div className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-3">
        <Cpu className="text-amber-500 shrink-0" size={20} />
        <div>
          <div className="text-[11px] font-mono text-white/40 uppercase font-bold">Failsafe-Sicherheitsnetzwerk</div>
          <p className="text-xs text-white/70 mt-0.5">
            Der Request-Orchestrator ist vollständig asynchron programmiert. Bei Serverüberlastung oder Erreichen von externen Rate-Limits (wie Alpha Vantage Limits) fängt die Warteschlange Anfragen zuverlässig ab und schützt so den Node.js-Prozess vor Abstürzen durch unbehandelte Timeouts oder Heap-Memory Errors.
          </p>
        </div>
      </div>

    </div>
  );
}
