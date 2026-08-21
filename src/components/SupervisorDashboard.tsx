import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  GitBranch,
  KeyRound,
  Layers,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { VersionManagerPanel } from './VersionManagerPanel';
import { M10PasskeyEnrollmentPanel } from './M10PasskeyEnrollmentPanel';
import { authFetch } from '../lib/authFetch';

interface SupervisorDashboardProps {
  currentUserEmail: string;
}

type TabId = 'overview' | 'agents' | 'version-manager' | 'm10-passkey';

interface RequestOrchestratorStats {
  activeRequests: number;
  queueSize: number;
  totalProcessed: number;
  totalRejected: number;
  rateLimitsHit: number;
}

interface OrchestratorStatus {
  id: string;
  name: string;
  status: string;
  latency: number | null;
  agentsCount: number;
  lastActive: string | null;
  type: string;
}

interface AgentProjection {
  id: string;
  name: string;
  role: string;
  status: 'IDLE' | 'ACTIVE';
  activeTask: string;
  queriesCount: number;
  model: string;
  performance: string;
}

interface SupervisorExecution {
  taskName: string;
  attempts: number;
  succeeded: boolean;
  durationMs: number;
  timestamp: string;
  error?: string;
}

interface SupervisorStatusResponse {
  recentExecutions?: SupervisorExecution[];
  routingTable?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Read-only operational projection for CAPITAL-AI Supervisor state.
 *
 * No Demo Data contract:
 * - no synthetic infrastructure metrics, latency, costs, alerts, backups or terminal logs;
 * - no client-side mutation of circuit breakers/agents;
 * - no runtime registration of agent architecture;
 * - absent evidence is rendered as "nicht instrumentiert" rather than fabricated values.
 *
 * Mutation/control authority remains in the existing repository/IAM/production control planes.
 */
export function SupervisorDashboard({ currentUserEmail }: SupervisorDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [requestStats, setRequestStats] = useState<RequestOrchestratorStats | null>(null);
  const [orchestrators, setOrchestrators] = useState<OrchestratorStatus[]>([]);
  const [agents, setAgents] = useState<AgentProjection[]>([]);
  const [supervisorStatus, setSupervisorStatus] = useState<SupervisorStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastObservedAt, setLastObservedAt] = useState<string | null>(null);

  const refreshObservedState = useCallback(async () => {
    setLoading(true);
    setError(null);

    const failures: string[] = [];

    try {
      const response = await fetch('/api/orchestrator/stats');
      if (response.ok) {
        const data = await response.json();
        setRequestStats({
          activeRequests: Number(data.activeRequests ?? 0),
          queueSize: Number(data.queueSize ?? 0),
          totalProcessed: Number(data.totalProcessed ?? 0),
          totalRejected: Number(data.totalRejected ?? 0),
          rateLimitsHit: Number(data.rateLimitsHit ?? 0),
        });
      } else {
        failures.push(`RequestOrchestrator HTTP ${response.status}`);
      }
    } catch (reason) {
      failures.push(`RequestOrchestrator: ${reason instanceof Error ? reason.message : String(reason)}`);
    }

    try {
      const response = await authFetch('/api/admin/orchestrators/status');
      if (response.ok) {
        const data = await response.json();
        setOrchestrators(Array.isArray(data.orchestrators) ? data.orchestrators : []);
      } else {
        failures.push(`Orchestrator-Projektion HTTP ${response.status}`);
      }
    } catch (reason) {
      failures.push(`Orchestrator-Projektion: ${reason instanceof Error ? reason.message : String(reason)}`);
    }

    try {
      const response = await authFetch('/api/admin/agents');
      if (response.ok) {
        const data = await response.json();
        setAgents(Array.isArray(data.agents) ? data.agents : []);
      } else {
        failures.push(`Agent-Projektion HTTP ${response.status}`);
      }
    } catch (reason) {
      failures.push(`Agent-Projektion: ${reason instanceof Error ? reason.message : String(reason)}`);
    }

    try {
      const response = await authFetch('/api/admin/supervisor/status');
      if (response.ok) {
        setSupervisorStatus(await response.json());
      } else {
        failures.push(`Supervisor HTTP ${response.status}`);
      }
    } catch (reason) {
      failures.push(`Supervisor: ${reason instanceof Error ? reason.message : String(reason)}`);
    }

    setLastObservedAt(new Date().toISOString());
    setError(failures.length > 0 ? failures.join(' · ') : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshObservedState();
    const timer = setInterval(() => void refreshObservedState(), 10_000);
    return () => clearInterval(timer);
  }, [refreshObservedState]);

  const recentExecutions = Array.isArray(supervisorStatus?.recentExecutions)
    ? supervisorStatus.recentExecutions
    : [];

  const observedCards = [
    {
      label: 'Aktive Requests',
      value: requestStats ? String(requestStats.activeRequests) : 'nicht instrumentiert',
      detail: requestStats ? `Queue ${requestStats.queueSize}` : 'Keine verifizierte Antwort',
    },
    {
      label: 'Verarbeitete Requests',
      value: requestStats ? String(requestStats.totalProcessed) : 'nicht instrumentiert',
      detail: requestStats ? `${requestStats.totalRejected} abgewiesen` : 'Keine verifizierte Antwort',
    },
    {
      label: 'Orchestrator-Projektionen',
      value: orchestrators.length > 0 ? String(orchestrators.length) : 'nicht instrumentiert',
      detail: 'Strukturelle Capability, keine Netzwerk-Latenzbehauptung',
    },
    {
      label: 'Supervisor-Ausführungen',
      value: recentExecutions.length > 0 ? String(recentExecutions.length) : 'nicht instrumentiert',
      detail: 'Nur tatsächlich beobachtete In-Process-Ausführungen',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="bg-[#141417]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT">
              <ShieldCheck size={14} />
              Read-only Operational Projection
            </div>
            <h2 className="text-base font-black font-mono text-white uppercase">
              CAPITAL-AI Platform Supervisor
            </h2>
            <p className="text-xs text-white/50 leading-relaxed max-w-3xl">
              Zeigt ausschließlich beobachtete oder strukturell belegte Zustände. Nicht instrumentierte
              Metriken werden nicht geschätzt. Agenten-, Infrastruktur-, Governance- und Production-
              Mutationen erfolgen ausschließlich über ihre kanonischen Control-Plane-Grenzen.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshObservedState()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Beobachtung aktualisieren
          </button>
        </div>

        <div className="text-[10px] font-mono text-white/35">
          {lastObservedAt ? `Letzte Beobachtung: ${lastObservedAt}` : 'Noch keine Beobachtung abgeschlossen.'}
        </div>
        {error && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
            Teilweise nicht verfügbar: {error}
          </div>
        )}
      </section>

      <nav className="flex border-b border-white/5 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'overview' as const, label: 'Beobachtung', icon: Activity },
          { id: 'agents' as const, label: 'Agenten-Projektion', icon: Cpu },
          { id: 'version-manager' as const, label: 'Version', icon: GitBranch },
          { id: 'm10-passkey' as const, label: 'M10 Passkey', icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 rounded-t-xl text-xs font-mono font-bold uppercase tracking-wider border-b-2 whitespace-nowrap flex items-center gap-2 ${
                selected
                  ? 'border-aif-gold-DEFAULT text-white bg-white/5'
                  : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon size={13} className={selected ? 'text-aif-gold-DEFAULT' : 'text-white/40'} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {observedCards.map((card) => (
              <div key={card.label} className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-2">
                <span className="text-[9px] text-white/40 font-mono uppercase font-black">{card.label}</span>
                <div className="text-xl font-bold font-mono text-white break-words">{card.value}</div>
                <p className="text-[10px] text-white/35 leading-relaxed">{card.detail}</p>
              </div>
            ))}
          </div>

          <section className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Layers size={15} className="text-aif-gold-DEFAULT" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Orchestrator-Capability-Projektion
              </h3>
            </div>
            <p className="text-[11px] text-white/45 leading-relaxed">
              `status` beschreibt die serverseitig verdrahtete Capability. `latency=null` und
              `lastActive=null` bleiben bewusst leer, solange dafür keine echte Messung vorliegt.
            </p>
            {orchestrators.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-black/20 p-5 text-xs text-white/40">
                Keine verifizierte Orchestrator-Projektion verfügbar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orchestrators.map((orchestrator) => (
                  <div key={orchestrator.id} className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold font-mono text-white">{orchestrator.name}</div>
                        <div className="text-[10px] text-white/40">{orchestrator.type}</div>
                      </div>
                      <span className="text-[9px] font-mono uppercase text-aif-gold-DEFAULT">
                        {orchestrator.status}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-white/35">
                      Agent-Komponenten: {orchestrator.agentsCount} · Latenz: {orchestrator.latency ?? 'nicht instrumentiert'} · Letzte Aktivität: {orchestrator.lastActive ?? 'nicht instrumentiert'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Jüngste Supervisor-Ausführungen
            </h3>
            {recentExecutions.length === 0 ? (
              <p className="text-xs text-white/40">Keine tatsächlich beobachteten Ausführungen verfügbar.</p>
            ) : (
              <div className="space-y-2">
                {recentExecutions.slice(0, 10).map((execution, index) => (
                  <div key={`${execution.taskName}-${execution.timestamp}-${index}`} className="rounded-xl border border-white/5 bg-black/20 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono text-white">{execution.taskName}</div>
                      <div className="text-[10px] text-white/35">{execution.timestamp}</div>
                    </div>
                    <div className="text-[10px] font-mono text-white/50">
                      {execution.succeeded ? 'SUCCESS' : 'FAILED'} · {execution.attempts} Versuch(e) · {execution.durationMs} ms
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'agents' && (
        <section className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="space-y-1 border-b border-white/5 pb-3">
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Runtime-abgeleitete Agenten-Projektion
            </h3>
            <p className="text-[11px] text-white/45 leading-relaxed">
              Diese Liste ist keine Registry- oder Provisioning-Authority. Architekturänderungen und neue
              Agenten werden über aktuellen Main-Abgleich, bestehende ADR/ESS/Registry-Grenzen, Branch und PR
              vorbereitet. Manuelle Runtime-Toggles und Runtime-Registrierung sind absichtlich nicht verfügbar.
            </p>
          </div>

          {agents.length === 0 ? (
            <p className="text-xs text-white/40">Keine beobachtete Agenten-Projektion verfügbar.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {agents.map((agent) => (
                <div key={agent.id} className="rounded-xl border border-white/5 bg-black/20 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">{agent.name}</div>
                      <div className="text-[10px] text-white/40">{agent.role}</div>
                    </div>
                    <span className={`text-[9px] font-mono ${agent.status === 'ACTIVE' ? 'text-emerald-400' : 'text-white/40'}`}>
                      {agent.status}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-white/35">
                    Aufgabe: {agent.activeTask} · Beobachtete Starts: {agent.queriesCount} · Provider-Semantik: {agent.model}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === 'version-manager' && (
        <VersionManagerPanel currentUserEmail={currentUserEmail} />
      )}

      {activeTab === 'm10-passkey' && (
        <M10PasskeyEnrollmentPanel />
      )}
    </div>
  );
}
