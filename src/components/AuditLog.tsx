import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Download,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { authFetch } from '../lib/authFetch';

export interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'AUTH' | 'SUBSCRIPTION' | 'CREDITS' | 'ORCHESTRATOR' | 'MARKET_DATA' | 'SECURITY';
  action: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

interface JournalMetadata {
  durability: 'ephemeral';
  authority: 'operational-read-model';
  auditAuthority: false;
  piiPersistence: false;
}

interface AuditLogProps {
  currentUserEmail: string;
}

/**
 * Legacy component name retained for route/import compatibility.
 *
 * This view is NOT an audit log. It is a bounded, read-only operational projection. Durable
 * security/audit evidence belongs to the existing security_events and ADR-0059 authorities.
 */
export function AuditLog({ currentUserEmail }: AuditLogProps) {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [journal, setJournal] = useState<JournalMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/system-events');
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true);
        setEvents([]);
        setJournal(null);
        return;
      }
      if (!res.ok) throw new Error(`Operational event endpoint returned HTTP ${res.status}.`);
      const data = await res.json();
      setAccessDenied(false);
      setEvents(Array.isArray(data.events) ? data.events : []);
      setJournal(data.journal ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents, currentUserEmail]);

  const filteredEvents = useMemo(() => events.filter((event) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query
      || event.action.toLowerCase().includes(query)
      || event.details.toLowerCase().includes(query);
    const matchesType = typeFilter === 'ALL' || event.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || event.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }), [events, searchQuery, typeFilter, statusFilter]);

  const handleDownloadJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      semantics: 'operational-read-model-only',
      journal,
      events: filteredEvents,
    };
    const anchor = document.createElement('a');
    anchor.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
    anchor.download = `operational_events_${Math.floor(Date.now() / 1000)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  if (accessDenied) {
    return (
      <div className="bg-[#1C1C21]/80 border border-rose-500/20 rounded-2xl p-8 text-center space-y-3">
        <ShieldCheck size={24} className="text-rose-400 mx-auto" />
        <h3 className="text-sm font-bold text-white uppercase">Zugriff eingeschränkt</h3>
        <p className="text-xs text-white/55">Die operative Ereignisprojektion ist nur für autorisierte Administratoren verfügbar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="bg-[#141417]/80 border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT">
              <Activity size={13} /> Operational Event Projection
            </div>
            <h3 className="text-base font-extrabold text-white uppercase">Systemereignisse & Aktivitäten</h3>
            <p className="text-[11px] text-white/50 max-w-3xl leading-relaxed">
              Bounded Runtime-Telemetrie für Diagnose und Supervisor-Transparenz. Diese Ansicht ist kein Audit-Nachweis,
              keine Compliance-Evidence und keine Autorisierungsquelle. Actor-E-Mail und IP werden hier nicht persistiert.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchEvents()}
              disabled={loading}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 disabled:opacity-50"
              aria-label="Operational events aktualisieren"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={filteredEvents.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono text-white/70 disabled:opacity-40"
            >
              <Download size={13} /> Export
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[9px] font-mono uppercase tracking-wider">
          <span className="px-2 py-1 rounded bg-white/5 text-white/45">Authority: {journal?.authority ?? 'unbekannt'}</span>
          <span className="px-2 py-1 rounded bg-white/5 text-white/45">Durability: {journal?.durability ?? 'unbekannt'}</span>
          <span className="px-2 py-1 rounded bg-white/5 text-white/45">Audit: {journal?.auditAuthority === false ? 'nein' : 'unbekannt'}</span>
          <span className="px-2 py-1 rounded bg-white/5 text-white/45">PII Persistence: {journal?.piiPersistence === false ? 'nein' : 'unbekannt'}</span>
        </div>

        {error && <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">{error}</div>}
      </section>

      <section className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Action oder Details suchen"
              className="w-full rounded-xl bg-black/30 border border-white/10 pl-9 pr-3 py-2 text-xs text-white outline-none"
            />
          </label>
          <label className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="w-full rounded-xl bg-black/30 border border-white/10 pl-9 pr-3 py-2 text-xs text-white outline-none"
            >
              <option value="ALL">Alle Typen</option>
              {['AUTH', 'SUBSCRIPTION', 'CREDITS', 'ORCHESTRATOR', 'MARKET_DATA', 'SECURITY'].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs text-white outline-none"
          >
            <option value="ALL">Alle Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="WARNING">WARNING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        {loading ? (
          <p className="text-xs text-white/40">Operative Ereignisse werden geladen …</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-xs text-white/40">Keine beobachteten Ereignisse für den aktuellen Filter.</p>
        ) : (
          <div className="space-y-2">
            {filteredEvents.map((event) => (
              <article key={event.id} className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-white">{event.action}</div>
                  <div className="text-[9px] font-mono text-white/45">{event.type} · {event.status}</div>
                </div>
                <p className="text-[11px] text-white/55 leading-relaxed">{event.details}</p>
                <div className="text-[9px] font-mono text-white/30">{event.timestamp}</div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
