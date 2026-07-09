import React from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Users, 
  KeyRound, 
  FileText, 
  Cpu, 
  Gauge, 
  ShieldCheck, 
  Sparkles,
  Activity
} from 'lucide-react';
import { AdminPanel } from './AdminPanel';
import { AuthStateDebugger } from './AuthStateDebugger';
import { MarkdownOrchestrator } from './MarkdownOrchestrator';
import { OrchestratorPanel } from './OrchestratorPanel';
import PerformanceDashboard from './PerformanceDashboard';
import { AuditLogs } from './AuditLogs';
import { AuditLog } from './AuditLog';
import { DocumentHygienePanel } from './DocumentHygienePanel';

// Hardcoded authorized administrator emails
const ADMIN_EMAILS = ['sven.kulessa@gmail.com', 'sven.kulessa@gmx.net'];

interface AdminPortalProps {
  currentUserEmail: string;
  activeTab: 'users' | 'auth' | 'markdown' | 'requests' | 'performance' | 'logs' | 'hygiene';
  onChangeTab: (tab: 'users' | 'auth' | 'markdown' | 'requests' | 'performance' | 'logs' | 'hygiene') => void;
}

export function AdminPortal({ currentUserEmail, activeTab, onChangeTab }: AdminPortalProps) {
  // Exclusively check for authorized admin email addresses
  const isAdmin = ADMIN_EMAILS.includes(currentUserEmail);
  const [logSubTab, setLogSubTab] = React.useState<'system' | 'files'>('system');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-[#1A1A1E]/80 border border-rose-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto w-16 w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/30 animate-pulse">
            <ShieldAlert size={32} className="text-rose-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-display text-white uppercase tracking-wider">Access Denied (403)</h2>
            <p className="text-sm font-mono text-rose-400">Security Clearance Level Required: Owner/Admin</p>
          </div>

          <div className="text-xs text-white/50 leading-relaxed font-sans border-t border-white/5 pt-4">
            Diese Administrationsoberfläche ist ausschließlich für den Eigentümer der Plattform reserviert. 
            Ihre Anmeldeadresse <span className="text-rose-400 font-mono font-semibold">{currentUserEmail || 'Anonym'}</span> verfügt nicht über die erforderlichen Administrationsrechte.
          </div>

          <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest pt-2">
            Zutritt verweigert • CAPITAL-AI Security Protocol
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin tabs definition
  const tabs = [
    {
      id: 'users' as const,
      label: 'Admin-Zentrale',
      description: 'Benutzerverwaltung & Berechtigungen',
      icon: Users,
    },
    {
      id: 'auth' as const,
      label: 'Auth Debugger',
      description: 'Token & Secure Local Pipelines',
      icon: KeyRound,
    },
    {
      id: 'markdown' as const,
      label: 'Markdown Orchestrator',
      description: 'Code-basierter Dokumenten-Generator',
      icon: FileText,
    },
    {
      id: 'requests' as const,
      label: 'Request Orchestrator',
      description: 'Telemetrie- & API-Datenstrom-Überwachung',
      icon: Cpu,
    },
    {
      id: 'performance' as const,
      label: 'Performance-Zentrale',
      description: 'Latenz, API-Effizienz & Ressourcenauslastung',
      icon: Gauge,
    },
    {
      id: 'logs' as const,
      label: 'Audit-Trail & Logs',
      description: 'Sicherheits- & Aktivitätsprotokolle',
      icon: ShieldCheck,
    },
    {
      id: 'hygiene' as const,
      label: 'Capital-AI Documentary',
      description: 'Autonome KI-Dokumentenpflege & Sync (Gründer: Sven Kulessa, sven.kulessa@capital-ai.online)',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header section for the entire portal */}
      <div className="bg-gradient-to-r from-[#1c1c21] to-[#121215] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Decorative Grid background overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aif-gold-DEFAULT opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-aif-gold-light"></span>
              </span>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT flex items-center gap-1">
                <Sparkles size={10} />
                SECURE DEV-OPS TERMINAL
              </p>
            </div>
            
            <h2 className="text-2xl font-black font-display text-white tracking-tight uppercase flex items-center gap-2">
              <span>ADMINISTRATOR PORTAL</span>
              <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded border border-white/10 text-white/80">v0.5.4</span>
            </h2>
            <p className="text-xs text-white/55 leading-relaxed font-sans max-w-2xl">
              Echtzeit-Verwaltung, Datenstrom-Orchestrierung und kryptografische Protokollanalyse für das CAPITAL-AI Ökosystem.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5">
            <ShieldCheck size={16} className="text-aif-gold-DEFAULT" />
            <div className="text-left font-mono">
              <p className="text-[9px] text-white/40 uppercase tracking-wider">Angemeldet als</p>
              <p className="text-xs font-bold text-white/90">{currentUserEmail}</p>
            </div>
          </div>
        </div>

        {/* Quick Horizontal sub-tab selector with glowing indicators */}
        <div className="relative mt-6 pt-4 border-t border-white/5 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-left font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer border ${
                  isTabActive
                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]'
                    : 'bg-black/20 hover:bg-white/5 text-white/70 hover:text-white border-white/5'
                }`}
              >
                <IconComponent size={14} className={isTabActive ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render selected administrative/DevOps view container */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {activeTab === 'users' && (
          <AdminPanel currentUserEmail={currentUserEmail} />
        )}
        
        {activeTab === 'auth' && (
          <AuthStateDebugger />
        )}

        {activeTab === 'markdown' && (
          <MarkdownOrchestrator />
        )}

        {activeTab === 'requests' && (
          <OrchestratorPanel />
        )}

        {activeTab === 'performance' && (
          <PerformanceDashboard />
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div className="flex border-b border-white/5 pb-2.5 gap-6">
              <button
                onClick={() => setLogSubTab('system')}
                className={`pb-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  logSubTab === 'system'
                    ? 'border-aif-gold-DEFAULT text-white font-extrabold font-black'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                System-Ereignisse (Audit-Log)
              </button>
              <button
                onClick={() => setLogSubTab('files')}
                className={`pb-2.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  logSubTab === 'files'
                    ? 'border-aif-gold-DEFAULT text-white font-extrabold font-black'
                    : 'border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                Orchestrator Berichte (Reports)
              </button>
            </div>
            {logSubTab === 'system' ? (
              <AuditLog currentUserEmail={currentUserEmail} />
            ) : (
              <AuditLogs />
            )}
          </div>
        )}

        {activeTab === 'hygiene' && (
          <DocumentHygienePanel currentUserEmail={currentUserEmail} />
        )}
      </motion.div>
    </div>
  );
}
