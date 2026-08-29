import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, RefreshCw } from 'lucide-react';
import { authFetch } from '../lib/authFetch';

interface RequestLogEntry {
  id: string;
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
  requestsLastMinute: number;
  recentLogs: RequestLogEntry[];
}

export function SystemLatencyMonitor() {
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('—');

  const refresh = async () => {
    try {
      const response = await authFetch('/api/orchestrator/stats');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      setStats(body);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString('de-DE'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(interval);
  }, []);

  const latency = useMemo(() => {
    const completed = (stats?.recentLogs ?? []).filter(
      (entry) => entry.status === 'COMPLETED' && typeof entry.duration === 'number' && Number.isFinite(entry.duration),
    );
    if (completed.length === 0) return { average: null as number | null, p95: null as number | null, samples: 0 };
    const values = completed.map((entry) => entry.duration as number).sort((a, b) => a - b);
    const average = Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    const p95Index = Math.min(values.length - 1, Math.ceil(values.length * 0.95) - 1);
    return { average, p95: values[p95Index], samples: values.length };
  }, [stats]);

  const endpointRows = useMemo(() => {
    const groups = new Map<string, number[]>();
    for (const entry of stats?.recentLogs ?? []) {
      if (entry.status !== 'COMPLETED' || typeof entry.duration !== 'number' || !Number.isFinite(entry.duration)) continue;
      const list = groups.get(entry.endpoint) ?? [];
      list.push(entry.duration);
      groups.set(entry.endpoint, list);
    }
    return [...groups.entries()]
      .map(([endpoint, values]) => ({
        endpoint,
        samples: values.length,
        average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      }))
      .sort((a, b) => b.samples - a.samples)
      .slice(0, 5);
  }, [stats]);

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 p-5 bg-[#0D0E12]/80 border border-white/10 rounded-2xl backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-4">
        <div>
          <div className="flex items-center gap-2 text-aif-gold-DEFAULT">
            <Activity className="w-4 h-4" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest">System Latency Monitor</h3>
          </div>
          <p className="text-[10px] text-white/50 mt-0.5">Gemessene Request-Orchestrator-Telemetrie · keine simulierten Latenzen</p>
        </div>
        <button type="button" onClick={() => void refresh()} className="flex items-center gap-2 text-[10px] font-mono text-white/60 hover:text-white">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {lastUpdated}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Runtime-Telemetrie nicht verfügbar: {error}. Es werden keine Ersatzwerte erzeugt.</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          ['Ø Latenz', latency.average === null ? '—' : `${latency.average} ms`],
          ['P95 Latenz', latency.p95 === null ? '—' : `${latency.p95} ms`],
          ['Aktive Requests', stats?.activeRequests ?? '—'],
          ['Queue', stats ? `${stats.queueSize}/${stats.maxQueueSize}` : '—'],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl border border-white/5 bg-black/40 p-3">
            <div className="text-[9px] uppercase tracking-wider text-white/40">{label}</div>
            <div className="mt-1 text-lg font-black font-mono text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/5 bg-black/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/60">
            <Clock className="h-3.5 w-3.5" /> Endpoint Samples
          </div>
          {endpointRows.length === 0 ? (
            <div className="text-[11px] text-white/35">Noch keine abgeschlossenen Request-Samples vorhanden.</div>
          ) : endpointRows.map((row) => (
            <div key={row.endpoint} className="flex items-center justify-between border-t border-white/5 py-2 text-[10px] first:border-t-0">
              <span className="truncate pr-3 text-white/60">{row.endpoint}</span>
              <span className="font-mono text-white">{row.average} ms · n={row.samples}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-white/5 bg-black/40 p-4 text-[10px]">
          <div className="mb-3 flex items-center gap-2 font-bold uppercase tracking-wider text-white/60">
            <Database className="h-3.5 w-3.5" /> Runtime Status
          </div>
          <div className="space-y-2 text-white/55">
            <div className="flex justify-between"><span>Processed</span><span className="font-mono text-white">{stats?.totalProcessed ?? '—'}</span></div>
            <div className="flex justify-between"><span>Rejected</span><span className="font-mono text-white">{stats?.totalRejected ?? '—'}</span></div>
            <div className="flex justify-between"><span>Rate limits</span><span className="font-mono text-white">{stats?.rateLimitsHit ?? '—'}</span></div>
            <div className="flex justify-between"><span>Requests / Minute</span><span className="font-mono text-white">{stats?.requestsLastMinute ?? '—'}</span></div>
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3 text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{latency.samples} gemessene Latenz-Samples im Runtime-Fenster</span>
          </div>
        </div>
      </div>
    </div>
  );
}
