import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, Gauge, RefreshCw } from 'lucide-react';
import { QualityCenterPanel } from './QualityCenterPanel';
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

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[index];
}

export default function PerformanceDashboard() {
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('—');

  const refresh = async () => {
    setLoading(true);
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

  const measured = useMemo(() => {
    const completed = (stats?.recentLogs ?? []).filter(
      (entry) => entry.status === 'COMPLETED' && typeof entry.duration === 'number' && Number.isFinite(entry.duration),
    );
    const durations = completed.map((entry) => entry.duration as number);
    const average = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : null;
    return {
      samples: durations.length,
      average,
      p50: percentile(durations, 0.5),
      p95: percentile(durations, 0.95),
      successRate: stats && stats.totalProcessed + stats.totalRejected > 0
        ? (stats.totalProcessed / (stats.totalProcessed + stats.totalRejected)) * 100
        : null,
    };
  }, [stats]);

  const endpoints = useMemo(() => {
    const grouped = new Map<string, number[]>();
    for (const entry of stats?.recentLogs ?? []) {
      if (entry.status !== 'COMPLETED' || typeof entry.duration !== 'number' || !Number.isFinite(entry.duration)) continue;
      const values = grouped.get(entry.endpoint) ?? [];
      values.push(entry.duration);
      grouped.set(entry.endpoint, values);
    }
    return [...grouped.entries()].map(([endpoint, values]) => ({
      endpoint,
      samples: values.length,
      average: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      p95: percentile(values, 0.95),
    })).sort((a, b) => b.samples - a.samples).slice(0, 8);
  }, [stats]);

  const cards = [
    { label: 'Ø Request-Latenz', value: measured.average === null ? '—' : `${measured.average} ms` },
    { label: 'P95 Request-Latenz', value: measured.p95 === null ? '—' : `${measured.p95} ms` },
    { label: 'Success Rate', value: measured.successRate === null ? '—' : `${measured.successRate.toFixed(1)} %` },
    { label: 'Requests / Minute', value: stats?.requestsLastMinute ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-2xl border border-white/10 bg-[#0D0E12]/80 p-5 backdrop-blur-md">
        <div className="flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-aif-gold-DEFAULT">
              <Activity className="h-4 w-4" />
              <h2 className="text-xs font-black uppercase tracking-widest">Performance & Runtime Telemetry</h2>
            </div>
            <p className="mt-1 text-[10px] text-white/45">Ausschließlich gemessene Request-Orchestrator-Daten · keine Demo-, Seed- oder Random-Metriken</p>
          </div>
          <button type="button" onClick={() => void refresh()} className="flex items-center gap-2 text-[10px] font-mono text-white/50 hover:text-white">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {lastUpdated}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-[11px] text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Performance-Evidence nicht verfügbar: {error}. Es werden keine Ersatzmetriken erzeugt.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-white/5 bg-black/40 p-4">
              <div className="text-[9px] uppercase tracking-wider text-white/35">{card.label}</div>
              <div className="mt-2 text-xl font-black font-mono text-white">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-black/40 p-4 lg:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/55">
              <Clock className="h-3.5 w-3.5" /> Endpoint Latency Evidence
            </div>
            {endpoints.length === 0 ? (
              <div className="py-8 text-center text-[11px] text-white/35">Noch keine abgeschlossenen Request-Samples vorhanden.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {endpoints.map((row) => (
                  <div key={row.endpoint} className="grid grid-cols-[1fr_auto_auto] gap-4 py-2 text-[10px]">
                    <span className="truncate text-white/60">{row.endpoint}</span>
                    <span className="font-mono text-white">Ø {row.average} ms</span>
                    <span className="font-mono text-white/55">P95 {row.p95 ?? '—'} ms · n={row.samples}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-4">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/55">
              <Gauge className="h-3.5 w-3.5" /> Orchestrator State
            </div>
            <div className="space-y-2 text-[10px] text-white/50">
              <div className="flex justify-between"><span>Active</span><span className="font-mono text-white">{stats?.activeRequests ?? '—'} / {stats?.concurrencyLimit ?? '—'}</span></div>
              <div className="flex justify-between"><span>Queue</span><span className="font-mono text-white">{stats?.queueSize ?? '—'} / {stats?.maxQueueSize ?? '—'}</span></div>
              <div className="flex justify-between"><span>Processed</span><span className="font-mono text-white">{stats?.totalProcessed ?? '—'}</span></div>
              <div className="flex justify-between"><span>Rejected</span><span className="font-mono text-white">{stats?.totalRejected ?? '—'}</span></div>
              <div className="flex justify-between"><span>Rate-limit hits</span><span className="font-mono text-white">{stats?.rateLimitsHit ?? '—'}</span></div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-3 text-[10px] text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> {measured.samples} measured samples
            </div>
            <div className="mt-2 flex items-center gap-2 text-[9px] text-white/35"><Database className="h-3 w-3" /> Runtime-memory metrics are intentionally omitted until an instrumented backend contract exists.</div>
          </div>
        </div>
      </section>

      <QualityCenterPanel />
    </div>
  );
}
