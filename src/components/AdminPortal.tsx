import React from 'react';
import { motion } from 'motion/react';
import {
  Cpu,
  FileText,
  Gauge,
  KeyRound,
  Network,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { AuthStateDebugger } from './AuthStateDebugger';
import { MarkdownOrchestrator } from './MarkdownOrchestrator';
import { OrchestratorPanel } from './OrchestratorPanel';
import PerformanceDashboard from './PerformanceDashboard';
import { AuditLogs } from './AuditLogs';
import { AuditLog } from './AuditLog';
import { AuditLogManager } from './AuditLogManager';
import { DocumentHygienePanel } from './DocumentHygienePanel';
import { SupervisorDashboard } from './SupervisorDashboard';
import { ComplianceBadge } from './ComplianceBadge';
import { ComplianceNotifications } from './ComplianceNotifications';
import { SecurityComplianceAuditor } from './SecurityComplianceAuditor';
import { SeoDashboard } from './SeoDashboard';
import { SkillEnginePanel } from './SkillEnginePanel';
import { AdminProcessGraph } from '../features/governance/ui/process-graph/AdminProcessGraph';
import { isAuthorizedOwnerOrDevAdmin } from '../lib/ownerUtils';

type AdminPortalTab =
  | 'users'
  | 'auth'
  | 'markdown'
  | 'requests'
  | 'performance'
  | 'logs'
  | 'hygiene'
  | 'supervisor'
  | 'seo'
  | 'compliance';

type PortalViewId = AdminPortalTab | 'skills' | 'process';

interface AdminPortalProps {
  currentUserEmail: string;
  activeTab: AdminPortalTab;
  onChangeTab: (tab: AdminPortalTab) => void;
}

interface PortalTabDefinition {
  id: PortalViewId;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  compliance: {
    adr: string;
    title: string;
    description: string;
  };
}

const tabs: PortalTabDefinition[] = [
  {
    id: 'process',
    label: 'Process Graph',
    description: 'Read-only PVC-, DevelopmentChain- und Evidence-Projektion',
    icon: Network,
    compliance: {
      adr: 'GOV-08 / PVC-01 / PVC-18',
      title: 'Read-only Process & Dependency Graph',
      description: 'Projiziert kanonische Projekt-/PVC- und Lifecycle-Semantik ohne Browser-Autorisierung oder zweite Governance-Registry.',
    },
  },
  {
    id: 'users',
    label: 'Admin-Zentrale',
    description: 'Benutzerverwaltung & Berechtigungen',
    icon: Users,
    compliance: {
      adr: 'ADR-0003.5',
      title: 'Identity Access Management & Owner-IAM',
      description: 'Schützt die Admin-Zone durch bestehende Owner-/Admin-IAM-Grenzen.',
    },
  },
  {
    id: 'auth',
    label: 'Auth Debugger',
    description: 'Token & Secure Local Pipelines',
    icon: KeyRound,
    compliance: {
      adr: 'ADR-0003.5',
      title: 'Cryptographic Token Tracking',
      description: 'Sichert lokale Authentifizierungs-Pipelines und verhindert Token-Leaks in Debug-Protokollen.',
    },
  },
  {
    id: 'markdown',
    label: 'Markdown Orchestrator',
    description: 'Code-basierter Dokumenten-Generator',
    icon: FileText,
    compliance: {
      adr: 'ADR-0007',
      title: 'Compliance Value Chain & System Documentation',
      description: 'Stellt nachvollziehbare Dokumentation aus der bestehenden Code- und Evidence-Basis bereit.',
    },
  },
  {
    id: 'requests',
    label: 'Request Orchestrator',
    description: 'Telemetrie- & API-Datenstrom-Überwachung',
    icon: Cpu,
    compliance: {
      adr: 'ADR-0006',
      title: 'Model-Independent Router & Data Masking',
      description: 'Schützt Routing- und Telemetriepfade innerhalb der bestehenden Daten- und IAM-Grenzen.',
    },
  },
  {
    id: 'performance',
    label: 'Performance-Zentrale',
    description: 'Latenz, API-Effizienz & Ressourcenauslastung',
    icon: Gauge,
    compliance: {
      adr: 'ADR-0005',
      title: 'Micro-Frontend SLAs & Load Performance',
      description: 'Stellt bestehende Performance- und Quality-Evidence dar.',
    },
  },
  {
    id: 'logs',
    label: 'Audit-Trail & Logs',
    description: 'Sicherheits- & Aktivitätsprotokolle',
    icon: ShieldCheck,
    compliance: {
      adr: 'ADR-0003.5 & ADR-0007',
      title: 'Immutable Audit Logs & PII Obfuscation',
      description: 'Bündelt vorhandene Audit- und DSGVO-Protokolle.',
    },
  },
  {
    id: 'hygiene',
    label: 'Capital-AI Documentary',
    description: 'Dokumentenhygiene, Status-Drift & Sync',
    icon: Sparkles,
    compliance: {
      adr: 'ADR-0004, ADR-0007 & ADR-0008',
      title: 'Documentary Lifecycle & Versioning',
      description: 'Überwacht Dokumentenhygiene und Versionierungsgrenzen über die bestehende Documentary-Komponente.',
    },
  },
  {
    id: 'supervisor',
    label: 'Capital-AI Supervisor',
    description: 'Zentralisierte Plattformüberwachung',
    icon: Shield,
    compliance: {
      adr: 'ESS-0002 / ESS-0003',
      title: 'Supervisor Recommendation Boundary',
      description: 'Trennt Beobachtung und Empfehlung von autorisierten Entscheidungen und Mutationen.',
    },
  },
  {
    id: 'skills',
    label: 'Skill Engine',
    description: 'Komponenten-Verifikation, Vocabulary & Prompt Registry',
    icon: Sparkles,
    compliance: {
      adr: 'ESS-0005 / ESS-0008 / ESS-0017',
      title: 'Read-only Skill Verification Projection',
      description: 'Kompiliert model-agnostische Verifikationsprompts als Quality-Projektion ohne autonome Mutation oder Provider-Aufruf.',
    },
  },
  {
    id: 'seo',
    label: 'SEO Management',
    description: 'Keywords, Rankings, Content & Quellenstatus',
    icon: Search,
    compliance: {
      adr: 'SEO-ROADMAP-0001 / S3',
      title: 'Messbares SEO ohne synthetische Kennzahlen',
      description: 'Zeigt ausschließlich validierte SEO-Daten und kennzeichnet fehlende externe Quellen.',
    },
  },
  {
    id: 'compliance',
    label: 'Compliance Auditor',
    description: 'Regulatorischer & DSGVO-Auditor',
    icon: ShieldCheck,
    compliance: {
      adr: 'ESS-0006',
      title: 'Security & Compliance Evidence',
      description: 'Prüft bestehende Security-/Compliance-Evidence ohne eigenständige Freigabeautorität.',
    },
  },
];

export function AdminPortal({ currentUserEmail, activeTab, onChangeTab }: AdminPortalProps) {
  const isAdmin = isAuthorizedOwnerOrDevAdmin(undefined, currentUserEmail);
  const [logSubTab, setLogSubTab] = React.useState<'system' | 'files' | 'gdpr'>('system');
  const [localView, setLocalView] = React.useState<'skills' | 'process' | null>(null);
  const visibleView: PortalViewId = localView ?? activeTab;

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md space-y-6 rounded-2xl border border-rose-500/20 bg-[#1A1A1E]/80 p-8 text-center shadow-2xl backdrop-blur-xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold uppercase tracking-wider text-white">Access Denied (403)</h2>
            <p className="text-sm font-mono text-rose-400">Security Clearance Level Required: Owner/Admin</p>
          </div>
          <p className="border-t border-white/5 pt-4 text-xs leading-relaxed text-white/50">
            Diese Administrationsoberfläche ist ausschließlich für autorisierte Owner/Admin-Konten reserviert. Die aktuelle Identität <span className="font-mono font-semibold text-rose-400">{currentUserEmail || 'Anonym'}</span> besitzt keine ausreichende Freigabe.
          </p>
        </motion.div>
      </div>
    );
  }

  const handlePortalTab = (tabId: PortalViewId) => {
    if (tabId === 'skills' || tabId === 'process') {
      setLocalView(tabId);
      return;
    }
    setLocalView(null);
    onChangeTab(tabId);
  };

  return (
    <div className="space-y-6">
      <ComplianceNotifications currentUserEmail={currentUserEmail} />

      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-[#1c1c21] to-[#121215] p-6 shadow-xl">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <p className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT">
              <Sparkles size={10} /> SECURE DEV-OPS TERMINAL
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">ADMINISTRATOR PORTAL</h2>
            <p className="max-w-2xl text-xs leading-relaxed text-white/55">
              Bestehende Admin-, Quality-, Governance- und Observability-Funktionen mit klar getrennten read-only und mutationsfähigen Boundaries.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/5 bg-black/40 px-4 py-2.5">
            <ShieldCheck size={16} className="text-aif-gold-DEFAULT" />
            <div className="font-mono text-left">
              <p className="text-[9px] uppercase tracking-wider text-white/40">Angemeldet als</p>
              <p className="text-xs font-bold text-white/90">{currentUserEmail}</p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-4">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isTabActive = visibleView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handlePortalTab(tab.id)}
                className={`flex shrink-0 items-center justify-between gap-4 rounded-xl border px-4 py-2.5 text-left font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  isTabActive
                    ? 'border-aif-gold-DEFAULT bg-aif-gold-DEFAULT text-black shadow-[0_0_15px_rgba(245,196,83,0.25)]'
                    : 'border-white/5 bg-black/20 text-white/70 hover:bg-white/5 hover:text-white'
                }`}
                title={tab.description}
              >
                <div className="flex items-center gap-2.5">
                  <IconComponent size={14} className={isTabActive ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                  <span>{tab.label}</span>
                </div>
                <ComplianceBadge
                  adr={tab.compliance.adr}
                  title={tab.compliance.title}
                  description={tab.compliance.description}
                  isActive={isTabActive}
                  placement="top"
                  className="shrink-0"
                />
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        key={visibleView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {visibleView === 'process' ? (
          <AdminProcessGraph />
        ) : visibleView === 'skills' ? (
          <SkillEnginePanel />
        ) : (
          <>
            {activeTab === 'users' && <AdminPanel currentUserEmail={currentUserEmail} />}
            {activeTab === 'auth' && <AuthStateDebugger />}
            {activeTab === 'markdown' && <MarkdownOrchestrator />}
            {activeTab === 'requests' && <OrchestratorPanel />}
            {activeTab === 'performance' && <PerformanceDashboard />}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-6 border-b border-white/5 pb-2.5">
                  {([
                    ['system', 'System-Ereignisse (Audit-Log)'],
                    ['gdpr', 'DSGVO Ledger'],
                    ['files', 'Orchestrator Berichte'],
                  ] as const).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLogSubTab(id)}
                      className={`border-b-2 pb-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                        logSubTab === id ? 'border-aif-gold-DEFAULT text-white' : 'border-transparent text-white/50 hover:text-white/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {logSubTab === 'system' ? (
                  <AuditLog currentUserEmail={currentUserEmail} />
                ) : logSubTab === 'gdpr' ? (
                  <AuditLogManager currentUserEmail={currentUserEmail} />
                ) : (
                  <AuditLogs />
                )}
              </div>
            )}
            {activeTab === 'hygiene' && <DocumentHygienePanel currentUserEmail={currentUserEmail} />}
            {activeTab === 'supervisor' && <SupervisorDashboard currentUserEmail={currentUserEmail} />}
            {activeTab === 'seo' && <SeoDashboard />}
            {activeTab === 'compliance' && <SecurityComplianceAuditor currentUserEmail={currentUserEmail} />}
          </>
        )}
      </motion.div>
    </div>
  );
}
