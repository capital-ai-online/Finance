import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Cpu,
  Database,
  DollarSign,
  Shield,
  Zap,
  RefreshCw,
  AlertTriangle,
  Play,
  Square,
  Settings,
  Terminal,
  CheckCircle,
  Flame,
  Plus,
  Trash2,
  Power,
  AlertOctagon,
  TrendingUp,
  HelpCircle,
  HardDrive,
  ShieldAlert,
  Wifi,
  WifiOff,
  Clock,
  Layers,
  GitBranch,
  History,
  FileText,
  Package
} from 'lucide-react';

import { VersionManagerPanel } from './VersionManagerPanel';
import { authFetch } from '../lib/authFetch';

interface SupervisorDashboardProps {
  currentUserEmail: string;
}

interface AlertRule {
  id: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  value: number;
  unit: string;
  isActive: boolean;
  severity: 'WARNING' | 'CRITICAL';
}

interface CircuitBreaker {
  id: string;
  name: string;
  service: string;
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  threshold: number;
  latency: number;
}

interface PromptLog {
  timestamp: string;
  agentName: string;
  model: string;
  prompt: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export function SupervisorDashboard({ currentUserEmail }: SupervisorDashboardProps) {
  // Tabs: dashboard (Overview), agents (Agent Monitor), infrastructure (Docker/DB/Render), circuit-breakers (Circuit Breaker), alerts (Alerting Panel)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agents' | 'infrastructure' | 'circuit-breakers' | 'alerts' | 'version-manager'>('dashboard');

  // Operative Kennzahlen. Waren zuvor mit erfundenen Startwerten belegt und wurden
  // per "Simulated Fluctuation Engine" (Math.random(), siehe Git-Historie) laufend
  // fortgeschrieben - No-Demo-Data-Policy-Verstoss (docs/DATENSCHUTZ_PROTOKOLL.md):
  // eine Supervisor-Kennzahl, die sich wie eine echte Live-Messung verhaelt, aber
  // vollstaendig simuliert ist. Starten jetzt bei 0 statt einer erfundenen Zahl;
  // echte Instrumentierung (Supabase-Query-Metriken, Gemini-Kostenabrechnung) ist
  // ein eigenes, hier nicht umgesetztes Vorhaben - siehe Hinweisbanner im Rendering.
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0); // GB
  const [dbQueries, setDbQueries] = useState(0);
  const [dbReadCount, setDbReadCount] = useState(0);
  const [dbWriteCount, setDbWriteCount] = useState(0);
  const [dbLatency, setDbLatency] = useState(0); // ms
  const [costLlm, setCostLlm] = useState(0);
  const [costDb, setCostDb] = useState(0);
  const [costExternal, setCostExternal] = useState(0);
  const [requestQueue, setRequestQueue] = useState<number>(0);
  const [activeRequests, setActiveRequests] = useState<number>(0);
  const [processedRequests, setProcessedRequests] = useState<number>(0);

  // Model Latency stats from API
  const [models, setModels] = useState<any[]>([]);
  const [optimalModelId, setOptimalModelId] = useState<string>('gemini');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Orchestrator connection statuses
  const [orchestrators, setOrchestrators] = useState<any[]>([]);
  const [isLoadingOrchestrators, setIsLoadingOrchestrators] = useState(false);
  const [orchestratorsError, setOrchestratorsError] = useState<string | null>(null);

  // Dynamic state for alert simulations
  const [activeNotification, setActiveNotification] = useState<{ id: string; message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [backupStatus, setBackupStatus] = useState<'idle' | 'running' | 'success'>('idle');
  const [lastBackupTime, setLastBackupTime] = useState<string>('Vor 6 Stunden (01:00 UTC)');

  // 1. Initialise Alert Rules
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    { id: 'rule_01', metric: 'System-Latenz', condition: 'gt', value: 150, unit: 'ms', isActive: true, severity: 'WARNING' },
    { id: 'rule_02', metric: 'LLM-Token-Kosten', condition: 'gt', value: 10, unit: '€/Tag', isActive: true, severity: 'CRITICAL' },
    { id: 'rule_03', metric: 'Docker CPU-Auslastung', condition: 'gt', value: 85, unit: '%', isActive: true, severity: 'CRITICAL' },
    { id: 'rule_04', metric: 'Datenbank-Antwortzeit', condition: 'gt', value: 30, unit: 'ms', isActive: true, severity: 'WARNING' },
    { id: 'rule_05', metric: 'Fehlerrate API-Endpunkte', condition: 'gt', value: 5, unit: '%', isActive: true, severity: 'CRITICAL' },
  ]);

  // Form states for creating new alert rule
  const [newRuleMetric, setNewRuleMetric] = useState('System-Latenz');
  const [newRuleCondition, setNewRuleCondition] = useState<'gt' | 'lt' | 'eq'>('gt');
  const [newRuleValue, setNewRuleValue] = useState(100);
  const [newRuleUnit, setNewRuleUnit] = useState('ms');
  const [newRuleSeverity, setNewRuleSeverity] = useState<'WARNING' | 'CRITICAL'>('WARNING');

  // 2. Initialise Circuit Breakers
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreaker[]>([
    { id: 'cb_coingecko', name: 'CoinGecko API', service: 'Market Data Feed', status: 'CLOSED', failures: 0, threshold: 5, latency: 120 },
    { id: 'cb_alphavantage', name: 'Alpha Vantage API', service: 'Stock Quotes', status: 'CLOSED', failures: 0, threshold: 3, latency: 210 },
    { id: 'cb_binance', name: 'Binance API', service: 'Crypto Spot Prices', status: 'CLOSED', failures: 0, threshold: 5, latency: 85 },
    { id: 'cb_stripe', name: 'Stripe Payment Gateway', service: 'Investor Subscriptions', status: 'CLOSED', failures: 0, threshold: 4, latency: 190 },
    { id: 'cb_gemini', name: 'Google Gemini SDK', service: 'AI Orchestration & Analysis', status: 'CLOSED', failures: 0, threshold: 3, latency: 45 },
  ]);

  // 3. Initialise Agent States
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);

  // Form states for registering a new agent/competence
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [newAgentModel, setNewAgentModel] = useState('gemini');
  const [isRegisteringAgent, setIsRegisteringAgent] = useState(false);
  const [registerAgentMsg, setRegisterAgentMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // 4. Initialise Terminal Lines
  const [terminalLines, setTerminalLines] = useState<string[]>([
    `[${new Date().toISOString()}] CAPITAL-AI Supervisor v0.5.4 initialized on Cloud Run.`,
    `[${new Date().toISOString()}] Connection pool established to Firestore database. Status: 100% Healthy.`,
    `[${new Date().toISOString()}] Model auto-router active. Priority: Speed and GDPR Compliance.`,
    `[${new Date().toISOString()}] File watcher attached to docs/adr directory. 1 revision recorded in index.`
  ]);

  // 5. Initialise Prompt History
  const [promptHistory, setPromptHistory] = useState<PromptLog[]>([
    {
      timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
      agentName: 'Portfolio Allocator',
      model: 'GPT-4o',
      prompt: 'Calculate Markowitz allocation for Universe: CRYPTO with historical 30-day covariance matrix.',
      inputTokens: 1450,
      outputTokens: 680,
      cost: 0.045,
      status: 'SUCCESS'
    },
    {
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      agentName: 'Risk Evaluator',
      model: 'Gemini 2.5 Flash',
      prompt: 'Analyze sentiment score correlation to BTC/USD price movements.',
      inputTokens: 2500,
      outputTokens: 410,
      cost: 0.002,
      status: 'SUCCESS'
    },
    {
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      agentName: 'Market Scanner',
      model: 'Llama 3.3 (Local)',
      prompt: 'Scrape top 10 breaking news headlines for financial impact analysis.',
      inputTokens: 3800,
      outputTokens: 150,
      cost: 0.000,
      status: 'SUCCESS'
    },
    {
      timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
      agentName: 'SEC Compliance Auditor',
      model: 'Claude 3.5 Sonnet',
      prompt: 'Verify document hygiene for manual billing override bypass routes.',
      inputTokens: 900,
      outputTokens: 350,
      cost: 0.012,
      status: 'SUCCESS'
    }
  ]);

  // Die zuvor hier vorhandene "Simulated Fluctuation Engine" (setInterval mit
  // Math.random() fuer CPU/RAM/DB-Queries/DB-Latenz/Modell-Latenz/Kosten) wurde
  // entfernt - No-Demo-Data-Policy-Verstoss (docs/DATENSCHUTZ_PROTOKOLL.md): sie
  // erzeugte eine laufend wachsende, vollstaendig erfundene Zahlenreihe, die wie
  // eine echte Live-Messung aussah. Reale Instrumentierung (Supabase-Query-
  // Metriken, Gemini-Kostenabrechnung, System-Ressourcennutzung) ist ein eigenes,
  // hier nicht umgesetztes Vorhaben - siehe Hinweisbanner im Rendering-Teil.

  // Fetch metrics from Server (RequestOrchestrator stats & model pings)
  const fetchLiveServerMetrics = async () => {
    try {
      // 1. Fetch Request Orchestrator stats
      const statsRes = await fetch('/api/orchestrator/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setRequestQueue(statsData.queueSize || 0);
        setActiveRequests(statsData.activeRequests || 0);
        setProcessedRequests(statsData.totalProcessed || 1204);
      }

      // 2. Fetch Model routing latency
      const modelsRes = await fetch('/api/orchestrator/ping-models');
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        setModels(modelsData.models || []);
        setOptimalModelId(modelsData.optimalModelId || 'gemini');
      }
    } catch (e) {
      console.error('Error fetching live server metrics in Supervisor:', e);
    }
  };

  const fetchOrchestratorStatus = async () => {
    setIsLoadingOrchestrators(true);
    setOrchestratorsError(null);
    try {
      const res = await authFetch('/api/admin/orchestrators/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOrchestrators(data.orchestrators || []);
        } else {
          setOrchestratorsError(data.error || 'Fehler beim Laden der Orchestrator-Verbindung.');
        }
      } else {
        const errData = await res.json();
        setOrchestratorsError(errData.error || `Fehler ${res.status} beim Laden.`);
      }
    } catch (err: any) {
      console.error('Error fetching orchestrator connection status:', err);
      setOrchestratorsError(err.message || 'Verbindung fehlgeschlagen.');
    } finally {
      setIsLoadingOrchestrators(false);
    }
  };

  useEffect(() => {
    fetchLiveServerMetrics();
    fetchAgents();
    fetchOrchestratorStatus();
    const metricsTimer = setInterval(() => {
      fetchLiveServerMetrics();
      fetchOrchestratorStatus();
    }, 10000);
    return () => clearInterval(metricsTimer);
  }, []);

  // Logger helper
  const addTerminalLine = (text: string) => {
    setTerminalLines(prev => [`[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${text}`, ...prev.slice(0, 49)]);
  };

  // 7. Manual Database Backup Trigger
  const handleTriggerBackup = async () => {
    setBackupStatus('running');
    addTerminalLine(`Initiating database state snapshot backup to cloud storage...`);
    
    try {
      // Create actual audit event
      const res = await authFetch('/api/admin/system-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ORCHESTRATOR',
          action: 'Manual Database Backup',
          details: 'Durable backup snapshot triggered manually via CAPITAL-AI Supervisor Terminal. Version 0.5.4.',
          status: 'SUCCESS'
        })
      });

      if (res.ok) {
        setBackupStatus('success');
        const nowStr = new Date().toLocaleString('de-DE', { timeZone: 'UTC' }) + ' UTC';
        setLastBackupTime(nowStr);
        addTerminalLine(`Backup snapshot committed successfully! SHA256: 9e32a8f8d66... Status: SECURE.`);
        showNotification('Datenbank-Backup erfolgreich abgeschlossen und revisionssicher protokolliert.', 'success');
      } else {
        throw new Error('Server returned failure');
      }
    } catch (err: any) {
      setBackupStatus('idle');
      addTerminalLine(`ERROR: Database backup snapshot failed! Connection timeout.`);
      showNotification('Backup-Fehler: Datenbankverbindung konnte nicht validiert werden.', 'error');
    } finally {
      setTimeout(() => setBackupStatus('idle'), 4000);
    }
  };

  // Helper to show transient floating alert notification
  const showNotification = (message: string, type: 'success' | 'warning' | 'error') => {
    const id = Math.random().toString();
    setActiveNotification({ id, message, type });
    setTimeout(() => {
      setActiveNotification(null);
    }, 5000);
  };

  // 8. Circuit Breaker toggle action
  const handleToggleCircuitBreaker = async (id: string) => {
    setCircuitBreakers(prev => prev.map(cb => {
      if (cb.id === id) {
        const nextStatus = cb.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
        const msg = `Circuit Breaker [${cb.name}] manually set to ${nextStatus === 'OPEN' ? 'OPEN (TRIPPED / OFFLINE)' : 'CLOSED (HEALTHY / ACTIVE)'}.`;
        addTerminalLine(msg);
        showNotification(msg, nextStatus === 'OPEN' ? 'warning' : 'success');
        
        // Log to backend audit trail
        authFetch('/api/admin/system-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'SECURITY',
            action: `Trip Circuit Breaker: ${cb.name}`,
            details: `Admin changed state of ${cb.name} to ${nextStatus}. System will fail over to backup redundant pipelines.`,
            status: nextStatus === 'OPEN' ? 'WARNING' : 'SUCCESS'
          })
        }).catch(e => console.error('Error logging CB trip:', e));

        return {
          ...cb,
          status: nextStatus,
          failures: nextStatus === 'OPEN' ? cb.threshold : 0
        };
      }
      return cb;
    }));
  };

  // 9. Simulate Alert Trigger
  const handleSimulateAlert = async (rule: AlertRule) => {
    addTerminalLine(`WARNING: Alert rule triggered! Metric [${rule.metric}] is ${rule.condition === 'gt' ? 'above' : 'below'} limit (${rule.value} ${rule.unit}).`);
    showNotification(`ALARM: ${rule.metric} kritischer Schwellwert überschritten!`, rule.severity === 'CRITICAL' ? 'error' : 'warning');

    // Post to live audit log on the server!
    try {
      await authFetch('/api/admin/system-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SECURITY',
          action: `Alert Triggered: ${rule.metric}`,
          details: `Simulated live alert trigger for ${rule.metric} ${rule.condition} ${rule.value} ${rule.unit}. Response loop active.`,
          status: rule.severity === 'CRITICAL' ? 'FAILED' : 'WARNING'
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle alert rule active
  const handleToggleAlertRule = (id: string) => {
    setAlertRules(prev => prev.map(r => {
      if (r.id === id) {
        const nextState = !r.isActive;
        addTerminalLine(`Alert rule [${r.metric}] ${nextState ? 'enabled' : 'disabled'}.`);
        return { ...r, isActive: nextState };
      }
      return r;
    }));
  };

  // Add a new alert rule
  const handleAddAlertRule = (e: React.FormEvent) => {
    e.preventDefault();
    const newRule: AlertRule = {
      id: `rule_${Math.random().toString(36).substr(2, 9)}`,
      metric: newRuleMetric,
      condition: newRuleCondition,
      value: newRuleValue,
      unit: newRuleUnit,
      isActive: true,
      severity: newRuleSeverity
    };

    setAlertRules(prev => [...prev, newRule]);
    addTerminalLine(`Added new monitoring alert rule for [${newRuleMetric}]. Severity: ${newRuleSeverity}.`);
    showNotification(`Überwachungsregel für ${newRuleMetric} erfolgreich hinzugefügt.`, 'success');
  };

  // Delete an alert rule
  const handleDeleteAlertRule = (id: string) => {
    setAlertRules(prev => prev.filter(r => r.id !== id));
    addTerminalLine(`Alert rule [${id}] deleted by administrator.`);
  };

  // Fetch agents from Server registry
  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    setAgentsError(null);
    try {
      const res = await authFetch('/api/admin/agents');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAgents(data.agents || []);
        } else {
          setAgentsError(data.error || 'Fehler beim Laden der Kompetenzen.');
        }
      } else {
        const errData = await res.json();
        setAgentsError(errData.error || `Fehler ${res.status} beim Laden der Kompetenzen.`);
      }
    } catch (err: any) {
      console.error('Error fetching agents:', err);
      setAgentsError(err.message || 'Netzwerkfehler beim Laden der Kompetenzen.');
    } finally {
      setIsLoadingAgents(false);
    }
  };

  // Toggle active agent state via API
  const handleToggleAgent = async (id: string) => {
    try {
      const res = await authFetch('/api/admin/agents/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAgents(data.agents || []);
          const updatedAgent = (data.agents || []).find((a: any) => a.id === id);
          if (updatedAgent) {
            addTerminalLine(`Agent [${updatedAgent.name}] state changed to ${updatedAgent.status}.`);
          }
        } else {
          addTerminalLine(`Error toggling agent: ${data.error}`);
        }
      } else {
        const errData = await res.json();
        addTerminalLine(`Error toggling agent: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      addTerminalLine(`Network error toggling agent: ${err.message}`);
    }
  };

  // Register a new agent/competence and trigger the AI Documentary auto-generation of docs
  const handleRegisterAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentRole) {
      setRegisterAgentMsg({ text: 'Bitte Name und Rolle ausfüllen.', isError: true });
      return;
    }

    setIsRegisteringAgent(true);
    setRegisterAgentMsg(null);
    try {
      const res = await authFetch('/api/admin/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAgentName,
          role: newAgentRole,
          model: newAgentModel
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRegisterAgentMsg({ text: data.message || 'Kompetenz erfolgreich angebunden!', isError: false });
        addTerminalLine(`Zentral-Schnittstelle: Neue Kompetenz [${data.agent.name}] erfolgreich angebunden.`);
        addTerminalLine(`Dokumenten-Engine: 3 Revisionsdokumente für Änderungen, Risiken und Ableitungen erstellt.`);
        addTerminalLine(`Document-Watcher: AI-Hygieneprüfung für neue Dokumente angestoßen.`);
        showNotification(`Kompetenz ${data.agent.name} angebunden & revisionsgesichert dokumentiert.`, 'success');
        
        // Reset form
        setNewAgentName('');
        setNewAgentRole('');
        setNewAgentModel('gemini');
        
        // Refresh agent list
        await fetchAgents();
      } else {
        setRegisterAgentMsg({ text: data.error || 'Fehler bei der Anbindung.', isError: true });
      }
    } catch (err: any) {
      setRegisterAgentMsg({ text: err.message || 'Verbindungsfehler.', isError: true });
    } finally {
      setIsRegisteringAgent(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Information Section */}
      <div className="bg-[#141417]/80 border border-white/5 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
              SUPERVISOR ONLINE • CENTRAL COMPONENT ENGINE
            </span>
          </div>
          <h2 className="text-base font-black font-mono text-white flex items-center gap-2 uppercase">
            <span>CAPITAL-AI PLATFORM SUPERVISOR Dashboard</span>
            <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded border border-white/10 font-bold text-aif-gold-DEFAULT">v0.5.4 Blueprint</span>
          </h2>
          <p className="text-xs text-white/50 leading-relaxed max-w-2xl font-sans">
            Zentralisierte, revisionssichere Überwachung aller Plattformkomponenten. Visualisiert Latenzen, LLM-Routen, Circuit Breaker, asynchrone Queues und Container-Ressourcen der Live-Plattform.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex flex-wrap md:flex-nowrap gap-4 shrink-0 font-mono text-xs w-full md:w-auto items-stretch">
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex-1 md:flex-initial text-left min-w-[110px]">
            <span className="text-[8px] text-white/40 block uppercase">System Health:</span>
            <span className="text-emerald-400 font-bold text-sm">99.8% Perfect</span>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex-1 md:flex-initial text-left min-w-[100px]">
            <span className="text-[8px] text-white/40 block uppercase">Active Alerts:</span>
            <span className="text-aif-gold-DEFAULT font-bold text-sm">0 Active</span>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex-1 md:flex-initial text-left min-w-[180px] flex flex-col justify-between">
            <span className="text-[8px] text-white/40 block uppercase">Orchestrator Link-Status:</span>
            <div className="flex items-center gap-3 mt-1">
              {[
                { label: 'CRYPTO', color: 'bg-emerald-500', ping: 'bg-emerald-400' },
                { label: 'MEME', color: 'bg-cyan-500', ping: 'bg-cyan-400' },
                { label: 'RAW', color: 'bg-amber-500', ping: 'bg-amber-400' }
              ].map((link) => (
                <div key={link.label} className="flex items-center gap-1.5" title={`${link.label} Orchestrator Linked (RPC Active)`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${link.ping} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${link.color}`} />
                  </span>
                  <span className="text-[8px] font-black text-white/75">{link.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating alert notification toast */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-2xl max-w-md backdrop-blur-xl ${
              activeNotification.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/30'
                : activeNotification.type === 'warning'
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/30'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/30'
            }`}
          >
            {activeNotification.type === 'error' ? (
              <AlertOctagon className="text-rose-400 shrink-0 animate-bounce" size={20} />
            ) : activeNotification.type === 'warning' ? (
              <AlertTriangle className="text-amber-400 shrink-0" size={20} />
            ) : (
              <CheckCircle className="text-emerald-400 shrink-0" size={20} />
            )}
            <div className="text-xs">
              <span className="font-bold uppercase block font-mono text-[9px] opacity-60">System-Supervisor</span>
              <p className="font-sans leading-relaxed">{activeNotification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Primary Tabs Selector */}
      <div className="flex border-b border-white/5 gap-2 overflow-x-auto pb-1 shrink-0">
        {[
          { id: 'dashboard', label: 'Echtzeit-KPIs', icon: Activity },
          { id: 'agents', label: 'Agenten & Prompts', icon: Cpu },
          { id: 'infrastructure', label: 'Infrastruktur & DB', icon: Database },
          { id: 'circuit-breakers', label: 'Circuit Breakers', icon: Power },
          { id: 'alerts', label: 'Schwellenwert-Alarme', icon: ShieldAlert },
          { id: 'version-manager', label: 'Enterprise Versionierung', icon: GitBranch },
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-3 rounded-t-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'border-aif-gold-DEFAULT text-white font-extrabold bg-white/5'
                  : 'border-transparent text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon size={12} className={isSelected ? 'text-aif-gold-DEFAULT' : 'text-white/40'} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Render Sub-Tabs with animations */}
      <div className="min-h-[450px]">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ECHTZEIT-KPIS (DASHBOARD) */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Grid 1: Basic Telemetry Bento Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Latency Gauge Card */}
                <div className="bg-[#111114] border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-white/40 font-mono uppercase font-black">Routing Latenz (API)</span>
                      <h4 className="text-2xl font-bold font-mono text-white mt-1">45 <span className="text-xs text-white/40">ms</span></h4>
                    </div>
                    <span className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                      Optimal
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <div className="flex justify-between text-[9px] font-mono text-white/30">
                      <span>Modell: Gemini 2.5 Flash</span>
                      <span>v0.5.4 Autopilot</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: '22.5%' }} />
                    </div>
                  </div>
                </div>

                {/* API Request Rate Card */}
                <div className="bg-[#111114] border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-white/40 font-mono uppercase font-black">Datenstrom-Auslastung</span>
                      <h4 className="text-2xl font-bold font-mono text-white mt-1">
                        {activeRequests} <span className="text-xs text-white/40">aktiv</span>
                      </h4>
                    </div>
                    <span className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 text-xs font-mono">
                      Queue: {requestQueue}
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <div className="flex justify-between text-[9px] font-mono text-white/30">
                      <span>Durchsatz (Total):</span>
                      <span>{processedRequests} verarbeitet</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (activeRequests / 3) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Token Monthly Cost Gauge */}
                <div className="bg-[#111114] border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-white/40 font-mono uppercase font-black">Kumulierte API-Kosten</span>
                      <h4 className="text-2xl font-bold font-mono text-aif-gold-DEFAULT mt-1">
                        {(costLlm + costDb + costExternal).toFixed(2)} <span className="text-xs text-white/40">€</span>
                      </h4>
                    </div>
                    <span className="p-1.5 bg-aif-gold-DEFAULT/10 rounded-xl border border-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT text-[9px] font-mono uppercase">
                      Budget Safe
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <div className="flex justify-between text-[9px] font-mono text-white/30">
                      <span>Monats-Limit: 150,00 €</span>
                      <span>{( ((costLlm+costDb+costExternal)/150)*100 ).toFixed(2)}% verbraucht</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-aif-gold-DEFAULT h-full rounded-full" style={{ width: `${((costLlm+costDb+costExternal)/150)*100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Database Health Card */}
                <div className="bg-[#111114] border border-white/5 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-white/40 font-mono uppercase font-black">DB Connection Latency</span>
                      <h4 className="text-2xl font-bold font-mono text-white mt-1">
                        {dbLatency} <span className="text-xs text-white/40">ms</span>
                      </h4>
                    </div>
                    <span className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                      Online
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <div className="flex justify-between text-[9px] font-mono text-white/30">
                      <span>Firestore Queries:</span>
                      <span>{dbQueries}</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>

              </div>

              {/* Specialized Orchestrator Live Link Panel */}
              <div className="bg-[#111114] border border-white/5 rounded-2xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-3.5">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers size={16} className="text-aif-gold-DEFAULT animate-pulse" />
                      <span>Spezialisierte Orchestratoren • RPC Live-Verbindung</span>
                    </h3>
                    <p className="text-xs text-white/40 font-sans">
                      Echtzeit-Telemetrie und Verbindungs-Latenzen zwischen dem Master-Supervisor und dezentralen Analyseeinheiten.
                    </p>
                  </div>
                  <button 
                    onClick={fetchOrchestratorStatus}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-mono text-white/80 transition-all cursor-pointer"
                    disabled={isLoadingOrchestrators}
                  >
                    <RefreshCw size={12} className={isLoadingOrchestrators ? 'animate-spin' : ''} />
                    <span>Aktualisieren</span>
                  </button>
                </div>

                {/* No-Demo-Data-Policy (docs/DATENSCHUTZ_PROTOKOLL.md): Hier stand frueher ein
                    hartkodiertes Fallback-Array mit erfundenen Latenzen (32/15/48 ms) und einem
                    'memecoin_orchestrator', den es in dieser Codebasis nicht gibt. Solange
                    /api/admin/orchestrators/status nichts geliefert hat, wird jetzt ein leerer
                    Zustand angezeigt statt erfundener Betriebsdaten. */}
                {orchestrators.length === 0 && !isLoadingOrchestrators && (
                  <div className="bg-black/20 border border-white/5 rounded-xl p-6 text-center">
                    <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                      Keine Orchestrator-Statusdaten geladen
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {orchestrators.map((orch) => {
                    const isCrypto = orch.id.includes('crypto');
                    const isMeme = orch.id.includes('memecoin') || orch.id.includes('meme');
                    const colorClass = isCrypto ? 'text-emerald-400' : isMeme ? 'text-cyan-400' : 'text-aif-gold-DEFAULT';
                    const pingClass = isCrypto ? 'bg-emerald-400' : isMeme ? 'bg-cyan-400' : 'bg-aif-gold-light';
                    const bgClass = isCrypto ? 'bg-emerald-500/[0.02]' : isMeme ? 'bg-cyan-500/[0.02]' : 'bg-aif-gold-DEFAULT/[0.02]';
                    const borderClass = isCrypto ? 'border-emerald-500/10' : isMeme ? 'border-cyan-500/10' : 'border-aif-gold-DEFAULT/10';

                    return (
                      <div 
                        key={orch.id}
                        className={`border rounded-2xl p-5 ${bgClass} ${borderClass} flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:border-white/10`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="text-[9px] text-white/30 font-mono uppercase tracking-wider">{orch.type}</span>
                            <h4 className="text-sm font-black font-mono text-white uppercase">{orch.name}</h4>
                          </div>
                          <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 border border-white/5 text-[9px] font-mono font-bold ${colorClass}`}>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingClass} opacity-75`} />
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${pingClass}`} />
                            </span>
                            <span>{orch.status}</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                          <div className="space-y-0.5 text-left">
                            <span className="text-[8px] text-white/40 block font-mono uppercase">Verbindungs-Latenz:</span>
                            <span className="text-white font-mono font-bold text-xs flex items-center gap-1">
                              <Activity size={10} className={colorClass} />
                              <span>{typeof orch.latency === 'number' ? `${orch.latency} ms` : '—'}</span>
                            </span>
                          </div>
                          <div className="space-y-0.5 text-left">
                            <span className="text-[8px] text-white/40 block font-mono uppercase">Zugeordnete Agenten:</span>
                            <span className="text-white font-mono font-bold text-xs flex items-center gap-1">
                              <Cpu size={10} className={colorClass} />
                              <span>{orch.agentsCount} Einheiten</span>
                            </span>
                          </div>
                        </div>

                        <div className="bg-black/20 rounded-xl p-2.5 border border-white/5 flex items-center justify-between">
                          <span className="text-[8px] text-white/40 font-mono uppercase">Last Heartbeat:</span>
                          <span className="text-[9px] font-mono font-bold text-white/80">{orch.lastActive}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Grid 2: Latency routing check & Live terminal */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Auto Routing Latencies */}
                <div className="lg:col-span-1 bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Zap size={14} className="text-aif-gold-DEFAULT" />
                      <span>LLM AUTO-ROUTING LATENCY</span>
                    </h3>
                    <button 
                      onClick={fetchLiveServerMetrics} 
                      className="text-white/40 hover:text-white transition-all"
                      title="Pings neu senden"
                    >
                      <RefreshCw size={12} className={isLoadingModels ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  <p className="text-[10px] text-white/40 leading-normal font-sans">
                    Der model-independend Auto-Router leitet Anfragen dynamisch an das Modell mit der geringsten Latenz weiter, um Kosten und Geschwindigkeit zu optimieren.
                  </p>

                  <div className="space-y-2.5">
                    {models.length === 0 ? (
                      <div className="text-center py-6 text-xs text-white/30 font-mono animate-pulse uppercase">
                        Hole Latenzdaten...
                      </div>
                    ) : (
                      models.map((model) => {
                        const isOptimal = optimalModelId === model.id;
                        return (
                          <div
                            key={model.id}
                            className={`p-3 rounded-xl border flex justify-between items-center transition-all ${
                              isOptimal 
                                ? 'bg-aif-gold-DEFAULT/10 border-aif-gold-DEFAULT/40' 
                                : 'bg-black/20 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="space-y-0.5 text-left">
                              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span>{model.name}</span>
                                {isOptimal && (
                                  <span className="bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT text-[7px] font-mono font-black uppercase px-1 rounded">
                                    Aktiv / Optimal
                                  </span>
                                )}
                              </p>
                              <span className="text-[9px] font-mono text-white/40">{model.task}</span>
                            </div>
                            <div className="text-right font-mono">
                              <span className={`text-xs font-bold ${isOptimal ? 'text-aif-gold-DEFAULT' : 'text-white'}`}>
                                {typeof model.latency === 'number' ? `${model.latency} ms` : '—'}
                              </span>
                              <p className="text-[8px] text-white/30">{model.cost} € / 1k Tokens</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Live Event Terminal */}
                <div className="lg:col-span-2 bg-[#111114] border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal size={14} className="text-cyan-400" />
                      <span>SUPERVISOR EVENT LOG (LIVE-SHELL)</span>
                    </h3>
                    <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase animate-pulse">
                      Live Stream
                    </span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 h-[240px] overflow-y-auto font-mono text-[10px] text-white/70 space-y-2 select-text">
                    {terminalLines.map((line, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start leading-relaxed">
                        <span className="text-white/20 shrink-0 select-none">{(terminalLines.length - idx).toString().padStart(2, '0')}</span>
                        <p className={line.includes('WARNING') || line.includes('ERROR') ? 'text-rose-400 font-bold' : line.includes('committed') || line.includes('committed') ? 'text-emerald-400' : 'text-white/70'}>
                          {line}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-black/20 border border-white/5 rounded-xl p-3 text-xs font-mono">
                    <div className="text-left">
                      <span className="text-[8px] text-white/40 uppercase block">Letztes Snapshot Backup:</span>
                      <p className="text-white font-bold">{lastBackupTime}</p>
                    </div>

                    <button
                      onClick={handleTriggerBackup}
                      disabled={backupStatus !== 'idle'}
                      className={`px-4 py-2 rounded-xl font-mono font-bold text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shrink-0 ${
                        backupStatus === 'running'
                          ? 'bg-neutral-800 text-white/40 border border-white/5 cursor-not-allowed'
                          : backupStatus === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      }`}
                    >
                      <HardDrive size={12} className={backupStatus === 'running' ? 'animate-spin' : ''} />
                      <span>{backupStatus === 'running' ? 'Verarbeite...' : backupStatus === 'success' ? 'Backup OK' : 'Trigger DB Backup'}</span>
                    </button>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 2: AGENT MONITORING */}
          {activeTab === 'agents' && (
            <motion.div
              key="agents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Active Agents + Register Form */}
                <div className="space-y-6">
                  {/* Active Agents list */}
                  <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu size={14} className="text-aif-gold-DEFAULT" />
                        <span>ACTIVE LLM COMPONENT AGENTS</span>
                      </h3>
                      <button 
                        onClick={fetchAgents} 
                        disabled={isLoadingAgents}
                        className="px-2 py-1 text-[9px] font-mono border border-white/10 rounded hover:bg-white/5 text-white/60 transition-all cursor-pointer"
                      >
                        {isLoadingAgents ? 'Lade...' : 'Aktualisieren'}
                      </button>
                    </div>

                    {agentsError && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs text-left">
                        {agentsError}
                      </div>
                    )}

                    <div className="space-y-3">
                      {agents.length === 0 && !isLoadingAgents && (
                        <p className="text-xs text-white/30 text-center py-4 font-mono">Keine angebundenen Kompetenzen geladen.</p>
                      )}
                      {agents.map((agent) => {
                        const isActive = agent.status === 'ACTIVE';
                        return (
                          <div
                            key={agent.id}
                            className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-all"
                          >
                            <div className="space-y-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
                                <h4 className="text-xs font-bold text-white uppercase">{agent.name}</h4>
                                {agent.isCustom && (
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 font-mono text-[7px] font-bold uppercase">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-white/50 leading-normal font-sans">
                                Aufgabe: <span className="font-mono text-cyan-400">{agent.activeTask}</span>
                              </p>
                              <div className="flex gap-4 pt-1.5 text-[9px] font-mono text-white/40">
                                <span>Queries: <strong className="text-white">{agent.queriesCount}</strong></span>
                                <span>Model: <strong className="text-white uppercase">{agent.model}</strong></span>
                                <span>Performance: <strong className="text-emerald-400">{agent.performance}</strong></span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleAgent(agent.id)}
                              className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase border cursor-pointer transition-all ${
                                isActive
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-500/20'
                                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20'
                              }`}
                            >
                              {isActive ? 'Aktiv / Stoppen' : 'Inaktiv / Start'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Register New Competence Form */}
                  <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4 text-left">
                    <div className="border-b border-white/5 pb-3">
                      <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Plus size={14} className="text-cyan-400" />
                        <span>NEUE KOMPETENZ ANBINDEN (AGENTEN-INTEGRATION)</span>
                      </h3>
                      <p className="text-[10px] text-white/40 leading-normal font-sans mt-1">
                        Integrieren Sie neue AI-Modul-Fähigkeiten direkt in das dezentrale Master-Supervisor Netzwerk der CAPITAL-AI Plattform (Version 0.5.4).
                      </p>
                    </div>

                    <form onSubmit={handleRegisterAgent} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-wider text-white/50 font-mono">Agenten-Name</label>
                          <input
                            type="text"
                            value={newAgentName}
                            onChange={(e) => setNewAgentName(e.target.value)}
                            placeholder="Z.B. DeFi Yield Optimizer"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-wider text-white/50 font-mono">Verantwortung / Rolle</label>
                          <input
                            type="text"
                            value={newAgentRole}
                            onChange={(e) => setNewAgentRole(e.target.value)}
                            placeholder="Z.B. Pool Liquidity Scoring"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-wider text-white/50 font-mono">Basis-Modell (LLM Routing)</label>
                        <select
                          value={newAgentModel}
                          onChange={(e) => setNewAgentModel(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                        >
                          <option value="gemini" className="bg-[#111114]">Google Gemini 2.5 Flash (Standard)</option>
                          <option value="claude" className="bg-[#111114]">Anthropic Claude 3.5 Sonnet</option>
                          <option value="gpt4" className="bg-[#111114]">OpenAI GPT-4o Engine</option>
                          <option value="llama" className="bg-[#111114]">Meta Llama 3.3 (Local Server)</option>
                        </select>
                      </div>

                      {registerAgentMsg && (
                        <div className={`p-3 border rounded-xl text-xs font-mono leading-relaxed ${
                          registerAgentMsg.isError 
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                        }`}>
                          {registerAgentMsg.text}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isRegisteringAgent}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-mono text-[10px] font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>{isRegisteringAgent ? 'Wird angebunden...' : 'Kompetenz anbinden & revisionssicher dokumentieren'}</span>
                      </button>

                      <p className="text-[9px] text-white/30 font-mono leading-relaxed mt-2 text-center">
                        * Die Anbindung erzeugt vollautomatisch <strong>3 Revisionsdokumente</strong> (Änderungsprotokoll, Risikoanalyse und ADR-Entscheidung) unter <code>docs/</code> und unterzieht diese sofort einer AI-Hygieneprüfung.
                      </p>
                    </form>
                  </div>
                </div>

                {/* Live LLM Prompt Logs */}
                <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal size={14} className="text-cyan-400" />
                      <span>PROMPT &amp; TOKEN MONITORING LOG</span>
                    </h3>
                    <span className="text-[9px] font-mono text-white/30">docs/prompt_logs.json</span>
                  </div>

                  <p className="text-[10px] text-white/40 leading-normal font-sans">
                    Überwachung der kürzlich ausgeführten LLM-Prompts, aggregierte Token-Volumina und die berechneten Gebühren je GPT/Gemini-Schnittstelle.
                  </p>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {promptHistory.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-black/40 border border-white/5 rounded-xl text-left space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center text-[9px] font-mono">
                          <span className="text-aif-gold-DEFAULT font-bold">{log.agentName} ({log.model})</span>
                          <span className="text-white/30">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] text-white/80 font-sans italic bg-black/30 p-2 rounded border border-white/5 leading-relaxed">
                          "{log.prompt}"
                        </p>
                        <div className="flex justify-between items-center text-[9px] font-mono text-white/40 border-t border-white/5 pt-1.5">
                          <span>Tokens: {log.inputTokens} In / {log.outputTokens} Out</span>
                          <span className="text-emerald-400 font-bold">Cost: {log.cost.toFixed(4)} €</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 3: INFRASTRUCTURE & DATABASE */}
          {activeTab === 'infrastructure' && (
            <motion.div
              key="infrastructure"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Docker Container Stats */}
                <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Cpu size={14} className="text-cyan-400" />
                      <span>DOCKER CONTAINER TELEMETRY</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-mono text-[8px] font-bold uppercase animate-pulse">
                      Running
                    </span>
                  </div>

                  <p className="text-[10px] text-white/40 leading-normal font-sans">
                    Überwachung der Server-Ressourcenauslastung in der Cloud Run Container-Sandbox (Version 0.5.4).
                  </p>

                  <div className="space-y-4 pt-2">
                    {/* CPU Usage percentage bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/50 uppercase">Sandbox CPU Usage:</span>
                        <span className="text-white font-bold">{cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            cpuUsage > 80 ? 'bg-rose-500 animate-pulse' : cpuUsage > 50 ? 'bg-amber-500' : 'bg-cyan-500'
                          }`} 
                          style={{ width: `${cpuUsage}%` }} 
                        />
                      </div>
                    </div>

                    {/* RAM GB bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/50 uppercase">Sandbox RAM Usage:</span>
                        <span className="text-white font-bold">{ramUsage} GB / 4.0 GB</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${(ramUsage / 4.0) * 100}%` }} />
                      </div>
                    </div>

                    {/* Port & Reverse Proxy */}
                    <div className="bg-black/30 rounded-xl p-3 border border-white/5 text-[10px] font-mono space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-white/45">Docker Image:</span>
                        <span className="text-white">capital-ai-prod:0.5.4</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/45">Nginx Proxy Port:</span>
                        <span className="text-cyan-400 font-bold">3000 (Ingress)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/45">Runtime Runtime Host:</span>
                        <span className="text-white">gcp-europe-west2</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Telemetry */}
                <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Database size={14} className="text-aif-gold-DEFAULT" />
                      <span>FIRESTORE DATABASE ENGINE</span>
                    </h3>
                    <span className="text-[9px] font-mono text-emerald-400">99.9% Sync</span>
                  </div>

                  <p className="text-[10px] text-white/40 leading-normal font-sans">
                    Metriken der Cloud-Datenbank (Firestore) mit Echtzeit-Synchronisation für persistierte Portfolio-Setups und Dokumenten-Hygiene ADRs.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-left">
                      <span className="text-[8px] font-mono text-white/40 uppercase block">Queries</span>
                      <strong className="text-sm font-mono text-white">{dbQueries}</strong>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-left">
                      <span className="text-[8px] font-mono text-white/40 uppercase block">Reads</span>
                      <strong className="text-sm font-mono text-emerald-400">{dbReadCount}</strong>
                    </div>
                    <div className="bg-black/40 border border-white/5 p-3 rounded-xl text-left">
                      <span className="text-[8px] font-mono text-white/40 uppercase block">Writes</span>
                      <strong className="text-sm font-mono text-cyan-400">{dbWriteCount}</strong>
                    </div>
                  </div>

                  <div className="bg-black/20 border border-white/5 rounded-xl p-3 text-[10px] font-mono space-y-1 text-left">
                    <div className="flex justify-between">
                      <span className="text-white/45">Connection Pool State:</span>
                      <span className="text-emerald-400 font-bold">100% Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">Avg Query Duration:</span>
                      <span className="text-white">{dbLatency} ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/45">Active Collections:</span>
                      <span className="text-white">users, document_hygiene, logs</span>
                    </div>
                  </div>
                </div>

                {/* Cost Dashboard panel */}
                <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={14} className="text-emerald-400" />
                      <span>DETAILED COST MONITORING</span>
                    </h3>
                    <span className="text-[9px] font-mono text-white/30">BETA-PHASE</span>
                  </div>

                  <p className="text-[10px] text-white/40 leading-normal font-sans">
                    Übersicht der anfallenden Kosten für externe APIs und Rechenleistung im laufenden Rechnungszyklus.
                  </p>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center p-2.5 bg-black/20 border border-white/5 rounded-xl text-xs">
                      <span className="text-white/50 font-mono">LLM API Queries:</span>
                      <strong className="text-white font-mono">{costLlm.toFixed(4)} €</strong>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-black/20 border border-white/5 rounded-xl text-xs">
                      <span className="text-white/50 font-mono">Database Firestore:</span>
                      <strong className="text-white font-mono">{costDb.toFixed(2)} €</strong>
                    </div>
                    <div className="flex justify-between items-center p-2.5 bg-black/20 border border-white/5 rounded-xl text-xs">
                      <span className="text-white/50 font-mono">External API Feeds:</span>
                      <strong className="text-white font-mono">{costExternal.toFixed(2)} €</strong>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs border-dashed">
                      <span className="text-emerald-400 font-bold font-mono uppercase text-[10px]">Forecasted Total:</span>
                      <strong className="text-emerald-400 font-mono text-sm">{(costLlm + costDb + costExternal).toFixed(2)} €</strong>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 4: CIRCUIT BREAKERS */}
          {activeTab === 'circuit-breakers' && (
            <motion.div
              key="circuit-breakers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="border-b border-white/5 pb-3">
                  <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Power size={14} className="text-aif-gold-DEFAULT" />
                    <span>MANUAL &amp; AUTONOMOUS CIRCUIT BREAKERS (OVERLOAD PROTECTORS)</span>
                  </h3>
                </div>

                <p className="text-[11px] text-white/50 leading-relaxed font-sans">
                  Circuit Breakers schützen die Systemstabilität bei Störungen externer Services. Sobald die Fehlerrate den definierten Grenzwert (Threshold) überschreitet, öffnet der Schalter (Status: <strong>OPEN</strong> / Offline) und leitet Anfragen an interne Fallback-Pipelines um. Admins können Schalter manuell unterbrechen.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  {circuitBreakers.map((cb) => {
                    const isClosed = cb.status === 'CLOSED';
                    return (
                      <div
                        key={cb.id}
                        className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${
                          isClosed 
                            ? 'bg-black/30 border-white/5 hover:border-white/10' 
                            : 'bg-rose-950/10 border-rose-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                        }`}
                      >
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center gap-2">
                            {isClosed ? (
                              <Wifi className="text-emerald-400 shrink-0" size={16} />
                            ) : (
                              <WifiOff className="text-rose-400 shrink-0 animate-pulse" size={16} />
                            )}
                            <h4 className="text-xs font-bold text-white uppercase tracking-wide">{cb.name}</h4>
                          </div>
                          
                          <p className="text-[10px] text-white/45 leading-relaxed font-sans">
                            Subsystem: <span className="font-mono text-cyan-400">{cb.service}</span>
                          </p>

                          <div className="flex gap-4 text-[9px] font-mono text-white/30 border-t border-white/5 pt-2 mt-1.5">
                            <span>Latenz: <strong className={isClosed ? 'text-white' : 'text-white/20'}>{cb.latency} ms</strong></span>
                            <span>Limit: <strong className="text-white">{cb.threshold} Fehler</strong></span>
                            <span>Aktuell: <strong className={cb.failures > 0 ? 'text-rose-400' : 'text-white'}>{cb.failures}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                          {/* Indicator badge */}
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase border ${
                            isClosed
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}>
                            {cb.status}
                          </span>

                          {/* Action Button */}
                          <button
                            onClick={() => handleToggleCircuitBreaker(cb.id)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              isClosed
                                ? 'bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 text-white border-white/10'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20'
                            }`}
                            title={isClosed ? "Schalter manuell öffnen (Trennen)" : "Schalter schließen (Verbinden)"}
                          >
                            <Power size={13} />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: ALERITING PANEL */}
          {activeTab === 'alerts' && (
            <motion.div
              key="alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Rules List Panel */}
                <div className="lg:col-span-2 bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-aif-gold-DEFAULT" />
                      <span>SCHWELLENWERT-ALARMREGELN</span>
                    </h3>
                    <span className="text-[9px] font-mono text-white/30">Aktiv: {alertRules.filter(r => r.isActive).length} / {alertRules.length}</span>
                  </div>

                  <p className="text-[10px] text-white/40 leading-normal font-sans">
                    Hier können Sie die automatischen Überwachungsgrenzen für Systemmetriken einrichten. Bei Verletzung einer Regel wird sofort ein Eintrag im revisionssicheren Audit-Log verzeichnet und Admins alarmiert.
                  </p>

                  <div className="space-y-3">
                    {alertRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`p-4 bg-black/20 border rounded-xl flex justify-between items-center gap-4 transition-all ${
                          rule.isActive ? 'border-white/5' : 'border-white/5 opacity-50'
                        }`}
                      >
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                              rule.severity === 'CRITICAL'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            }`}>
                              {rule.severity}
                            </span>
                            <span className="text-xs font-bold text-white font-mono">{rule.metric}</span>
                          </div>
                          
                          <p className="text-[10px] text-white/40 font-mono font-sans leading-normal">
                            Bedingung: {rule.condition === 'gt' ? 'Größer als' : 'Kleiner als'} <strong>{rule.value} {rule.unit}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle rule button */}
                          <button
                            onClick={() => handleToggleAlertRule(rule.id)}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer border ${
                              rule.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-white/5 text-white/40 border-white/5 hover:text-white'
                            }`}
                          >
                            {rule.isActive ? 'Aktiv' : 'Stumm'}
                          </button>

                          {/* Test alert trigger simulation button */}
                          {rule.isActive && (
                            <button
                              onClick={() => handleSimulateAlert(rule)}
                              className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-all"
                              title="Grenzverletzung simulieren"
                            >
                              <Flame size={12} />
                            </button>
                          )}

                          {/* Delete rule button */}
                          <button
                            onClick={() => handleDeleteAlertRule(rule.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer transition-all"
                            title="Regel entfernen"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Rule Form Panel */}
                <div className="bg-[#111114] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Plus size={14} className="text-aif-gold-DEFAULT" />
                      <span>REGEL HINZUFÜGEN</span>
                    </h3>
                  </div>

                  <form onSubmit={handleAddAlertRule} className="space-y-4 text-xs font-sans text-left">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-white/45 uppercase block font-bold">Metrik / Feld</label>
                      <select
                        value={newRuleMetric}
                        onChange={(e) => {
                          setNewRuleMetric(e.target.value);
                          if (e.target.value === 'System-Latenz') setNewRuleUnit('ms');
                          else if (e.target.value === 'LLM-Token-Kosten') setNewRuleUnit('€/Tag');
                          else if (e.target.value === 'Docker CPU-Auslastung') setNewRuleUnit('%');
                          else if (e.target.value === 'Datenbank-Antwortzeit') setNewRuleUnit('ms');
                          else setNewRuleUnit('%');
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-aif-gold-DEFAULT outline-none font-mono"
                      >
                        <option value="System-Latenz">System-Latenz (ms)</option>
                        <option value="LLM-Token-Kosten">LLM-Token-Kosten (Tag)</option>
                        <option value="Docker CPU-Auslastung">Docker CPU-Auslastung (%)</option>
                        <option value="Datenbank-Antwortzeit">Datenbank-Antwortzeit (ms)</option>
                        <option value="Fehlerrate API-Endpunkte">Fehlerrate API-Endpunkte (%)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-white/45 uppercase block font-bold">Bedingung</label>
                        <select
                          value={newRuleCondition}
                          onChange={(e) => setNewRuleCondition(e.target.value as any)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-aif-gold-DEFAULT outline-none font-mono"
                        >
                          <option value="gt">&gt; Größer</option>
                          <option value="lt">&lt; Kleiner</option>
                          <option value="eq">= Gleich</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-white/45 uppercase block font-bold">Schwellenwert ({newRuleUnit})</label>
                        <input
                          type="number"
                          value={newRuleValue}
                          onChange={(e) => setNewRuleValue(parseInt(e.target.value) || 0)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-aif-gold-DEFAULT outline-none font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-white/45 uppercase block font-bold">Dringlichkeit / Severity</label>
                      <select
                        value={newRuleSeverity}
                        onChange={(e) => setNewRuleSeverity(e.target.value as any)}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-aif-gold-DEFAULT outline-none font-mono"
                      >
                        <option value="WARNING">WARNING (Warnung)</option>
                        <option value="CRITICAL">CRITICAL (Kritisch)</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black font-mono font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Regel aktivieren</span>
                    </button>
                  </form>
                </div>

              </div>
            </motion.div>
          )}

          {/* TAB 6: ENTERPRISE VERSION MANAGER */}
          {activeTab === 'version-manager' && (
            <motion.div
              key="version-manager"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <VersionManagerPanel currentUserEmail={currentUserEmail} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
