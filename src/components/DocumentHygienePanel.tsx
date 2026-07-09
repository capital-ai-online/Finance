import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Shield, 
  GitBranch, 
  History, 
  Check, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Play, 
  Eye, 
  FileText, 
  CheckCircle,
  HelpCircle,
  Database,
  ArrowRight,
  Mail,
  User,
  Code,
  Terminal,
  AlertOctagon,
  Info,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CapitalAiLogo } from './CapitalAiLogo';
import { AdrForm } from './AdrForm';

interface DocumentHygienePanelProps {
  currentUserEmail: string;
}

interface ReviewTicket {
  id: string;
  filePath: string;
  timestamp: string;
  previousContent: string;
  proposedContent: string;
  diff: string;
  classification: string;
  confidence: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
}

interface HygieneLogEntry {
  id: string;
  timestamp: string;
  filePath: string;
  eventType: 'add' | 'change' | 'unlink';
  classification: string;
  confidence: number;
  actionTaken: string;
  stateFlow: string[];
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'PAUSED';
  details: string;
}

interface DependencyGraph {
  [filePath: string]: string[];
}

interface BackupFile {
  name: string;
  size: number;
  modifiedAt: string;
}

export function DocumentHygienePanel({ currentUserEmail }: DocumentHygienePanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentState, setCurrentState] = useState<string>('IDLE');
  const [logs, setLogs] = useState<HygieneLogEntry[]>([]);
  const [tickets, setTickets] = useState<ReviewTicket[]>([]);
  const [graph, setGraph] = useState<DependencyGraph>({});
  const [historyFiles, setHistoryFiles] = useState<BackupFile[]>([]);
  
  // Tab states inside the Hygiene panel
  const [activeSubTab, setActiveSubTab] = useState<'tickets' | 'logs' | 'graph' | 'rollback' | 'linter' | 'adr'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<ReviewTicket | null>(null);
  const [manualTriggerPath, setManualTriggerPath] = useState<string>('');
  const [isTriggering, setIsTriggering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reviewStatusMsg, setReviewStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ADR States
  const [adrs, setAdrs] = useState<any[]>([]);
  const [isAdrsLoading, setIsAdrsLoading] = useState(false);
  const [adrError, setAdrError] = useState<string | null>(null);
  const [selectedAdr, setSelectedAdr] = useState<any | null>(null);
  const [isEditingAdr, setIsEditingAdr] = useState(false);
  const [isCreatingAdr, setIsCreatingAdr] = useState(false);
  const [selectedAdrHistory, setSelectedAdrHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Form states
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStatus, setFormStatus] = useState('PROPOSED');
  const [formDate, setFormDate] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formContext, setFormContext] = useState('');
  const [formDecision, setFormDecision] = useState('');
  const [formConsequences, setFormConsequences] = useState('');

  // Security & Document Linter States
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [isLinting, setIsLinting] = useState(false);
  const [lintFilter, setLintFilter] = useState<'all' | 'error' | 'warning'>('all');
  const [fixSuccessMsg, setFixSuccessMsg] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState<string | null>(null); // diagId of currently fixing item
  const [linterSubMode, setLinterSubMode] = useState<'scan' | 'playground'>('scan');
  const [customCode, setCustomCode] = useState<string>('');
  const [customDiagnostics, setCustomDiagnostics] = useState<any[]>([]);

  const fetchADRs = async () => {
    setIsAdrsLoading(true);
    setAdrError(null);
    try {
      const res = await fetch(`/api/admin/hygiene/adr?email=${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) {
        const data = await res.json();
        const sorted = (data.adrs || []).sort((a: any, b: any) => {
          return b.id.localeCompare(a.id);
        });
        setAdrs(sorted);
        if (sorted.length > 0 && !selectedAdr) {
          setSelectedAdr(sorted[0]);
        }
      } else {
        const data = await res.json();
        setAdrError(data.error || 'Fehler beim Laden der ADRs');
      }
    } catch (err: any) {
      setAdrError(`Netzwerkfehler: ${err.message}`);
    } finally {
      setIsAdrsLoading(false);
    }
  };

  const fetchAdrHistory = async (adrId: string) => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/admin/hygiene/adr/${adrId}/history?email=${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAdrHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch ADR history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAdr?.id) {
      fetchAdrHistory(selectedAdr.id);
    } else {
      setSelectedAdrHistory([]);
    }
  }, [selectedAdr]);

  const submitCreateAdr = async (data: {
    id: string;
    title: string;
    status: string;
    date: string;
    author: string;
    context: string;
    decision: string;
    consequences: string;
  }) => {
    try {
      const res = await fetch('/api/admin/hygiene/adr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          title: data.title,
          status: data.status,
          date: data.date,
          author: data.author,
          context: data.context,
          decision: data.decision,
          consequences: data.consequences,
          email: currentUserEmail
        })
      });
      if (res.ok) {
        const resData = await res.json();
        setIsCreatingAdr(false);
        setSelectedAdr(resData.adr);
        fetchADRs();
        fetchStatus();
      } else {
        const resData = await res.json();
        alert(`Fehler: ${resData.error}`);
      }
    } catch (err: any) {
      alert(`Verbindungsfehler: ${err.message}`);
    }
  };

  const submitUpdateAdr = async (data: {
    title: string;
    status: string;
    date: string;
    author: string;
    context: string;
    decision: string;
    consequences: string;
  }) => {
    try {
      const res = await fetch(`/api/admin/hygiene/adr/${selectedAdr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          status: data.status,
          date: data.date,
          author: data.author,
          context: data.context,
          decision: data.decision,
          consequences: data.consequences,
          email: currentUserEmail
        })
      });
      if (res.ok) {
        const resData = await res.json();
        setIsEditingAdr(false);
        setSelectedAdr(resData.adr);
        fetchADRs();
        fetchStatus();
      } else {
        const resData = await res.json();
        alert(`Fehler: ${resData.error}`);
      }
    } catch (err: any) {
      alert(`Verbindungsfehler: ${err.message}`);
    }
  };

  const handleDeleteAdr = async (id: string) => {
    if (!window.confirm(`Möchten Sie den Architecture Decision Record '${id}' wirklich unwiderruflich löschen? Die zugehörige Markdown-Datei auf dem Server wird dauerhaft entfernt.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/hygiene/adr/${id}?email=${encodeURIComponent(currentUserEmail)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedAdr(null);
        fetchADRs();
        fetchStatus();
      } else {
        const data = await res.json();
        alert(`Fehler: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Verbindungsfehler: ${err.message}`);
    }
  };

  const openCreateMode = () => {
    setIsEditingAdr(false);
    setIsCreatingAdr(true);
    const nextNum = adrs.reduce((max, a) => {
      const match = a.id.match(/ADR-(\d+)/i);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0) + 1;
    const paddedId = `ADR-${String(nextNum).padStart(4, '0')}`;
    
    setFormId(paddedId);
    setFormTitle('');
    setFormStatus('PROPOSED');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormAuthor(currentUserEmail === 'sven.kulessa@gmail.com' || currentUserEmail === 'sven.kulessa@gmx.net' ? 'Sven Kulessa' : 'Administrator');
    setFormContext('');
    setFormDecision('');
    setFormConsequences('');
  };

  const openEditMode = (adr: any) => {
    setIsCreatingAdr(false);
    setIsEditingAdr(true);
    setFormId(adr.id);
    setFormTitle(adr.title);
    setFormStatus(adr.status);
    setFormDate(adr.date);
    setFormAuthor(adr.author);
    setFormContext(adr.context);
    setFormDecision(adr.decision);
    setFormConsequences(adr.consequences);
  };

  const runWorkspaceLint = async () => {
    setIsLinting(true);
    setFixSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/hygiene/lint?email=${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setDiagnostics(data.diagnostics || []);
      } else {
        const data = await res.json();
        setError(`Linter-Fehler: ${data.error}`);
      }
    } catch (err: any) {
      setError(`Verbindungsfehler beim Linten: ${err.message}`);
    } finally {
      setIsLinting(false);
    }
  };

  const handleAutoFix = async (diag: any) => {
    setIsFixing(diag.id);
    setFixSuccessMsg(null);
    try {
      const res = await fetch('/api/admin/hygiene/lint-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: diag.filePath,
          line: diag.line,
          ruleId: diag.ruleId,
          email: currentUserEmail
        })
      });
      if (res.ok) {
        setFixSuccessMsg(`Erfolgreich behoben: Regel ${diag.ruleId} auf '${diag.filePath}' (Zeile ${diag.line})`);
        await runWorkspaceLint();
      } else {
        const data = await res.json();
        alert(`Auto-Fix fehlgeschlagen: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Fehler beim Auto-Fix: ${err.message}`);
    } finally {
      setIsFixing(null);
    }
  };

  const handleCustomLint = (text: string) => {
    setCustomCode(text);
    if (!text.trim()) {
      setCustomDiagnostics([]);
      return;
    }

    const lines = text.split('\n');
    const customDiags: any[] = [];

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      const lineNum = idx + 1;

      // SEC-01: API key
      const hasSk = /sk_(test|live)_[a-zA-Z0-9]{20,}/.test(line);
      const hasCmc = /CMC_PRO_API_KEY\s*[:=]\s*['"`][a-zA-Z0-9-]{10,}/i.test(line);
      const hasHardcodedKey = /api[-_]?key\s*[:=]\s*['"`][a-zA-Z0-9-_]{20,}/i.test(line);
      if (hasSk || hasCmc || hasHardcodedKey) {
        customDiags.push({
          line: lineNum,
          severity: 'error',
          ruleId: 'SEC-01',
          ruleName: 'Möglicher API-Key Leak',
          message: 'Hartkodierter API-Schlüssel oder Secret-Token entdeckt.',
          evidence: line.trim().substring(0, 80),
          suggestion: 'Nutzen Sie Umgebungsvariablen über process.env.'
        });
      }

      // SEC-02: alert
      const hasAlert = /window\.alert\s*\(/.test(line) || /\balert\s*\(['"`][^'"`]+['"`]\)/.test(line);
      if (hasAlert) {
        customDiags.push({
          line: lineNum,
          severity: 'error',
          ruleId: 'SEC-02',
          ruleName: 'Inkompatible Browser-API',
          message: 'Nutzung von window.alert() blockiert die Anwendung im Sandbox-Iframe von AI Studio.',
          evidence: line.trim(),
          suggestion: 'Nutzen Sie moderne UI-Modals oder Toast-Komponenten.'
        });
      }

      // SEC-03: localStorage token
      const hasSessionToken = /localStorage\.setItem\s*\(\s*['"`](token|auth|jwt|session)['"`]/.test(line);
      if (hasSessionToken) {
        customDiags.push({
          line: lineNum,
          severity: 'warning',
          ruleId: 'SEC-03',
          ruleName: 'Sitzungsschlüssel im LocalStorage',
          message: 'Sensible Authentifizierungsschlüssel sollten nicht im LocalStorage gespeichert werden.',
          evidence: line.trim(),
          suggestion: 'Nutzen Sie sichere HTTP-only Cookies oder zustandslose Authentifizierung.'
        });
      }

      // SEC-04: dangerouslySetInnerHTML
      const hasDangerHtml = /dangerouslySetInnerHTML/.test(line);
      if (hasDangerHtml) {
        customDiags.push({
          line: lineNum,
          severity: 'warning',
          ruleId: 'SEC-04',
          ruleName: 'Potenzielle XSS-Schnittstelle',
          message: 'Nutzung von dangerouslySetInnerHTML kann Cross-Site-Scripting (XSS) ermöglichen.',
          evidence: line.trim(),
          suggestion: 'Prüfen Sie, ob Sie stattdessen Text oder react-markdown nutzen können.'
        });
      }

      // SEC-05: Direct eval
      const hasEval = /\beval\s*\(/.test(line) || /new\s+Function\s*\(/.test(line);
      if (hasEval) {
        customDiags.push({
          line: lineNum,
          severity: 'error',
          ruleId: 'SEC-05',
          ruleName: 'Dynamische Code-Ausführung',
          message: 'eval() oder new Function() stellt ein extremes Sicherheitsrisiko dar.',
          evidence: line.trim(),
          suggestion: 'Verwenden Sie stattdessen strukturierte Parser oder statische Zuweisungen.'
        });
      }

      // DOC-01: Legacy Versioning
      const hasLegacyVersion = /(version|v7\.5|v1\.0\.0|v1\.0|v2\.0)\s*[:=]?\s*['"`]?[0-9]+\.[0-9]+(\.[0-9]+)?['"`]?/i.test(line) || 
                               /version\s+7\.5/i.test(line) || /version\s+1\.0/i.test(line);
      const isCorrectVersion = line.includes('0.5.4');
      if (hasLegacyVersion && !isCorrectVersion) {
        customDiags.push({
          line: lineNum,
          severity: 'warning',
          ruleId: 'DOC-01',
          ruleName: 'Veraltete Versionsangabe',
          message: 'Veraltete Version referenziert. Die Plattform-Version muss fest auf 0.5.4 stehen.',
          evidence: line.trim(),
          suggestion: 'Ändern Sie die Angabe auf Version 0.5.4 ab.'
        });
      }

      // DOC-02: Fake Data
      const hasMockKeyword = /(mockData|mock_data|tempData|dummyData|lorem\s+ipsum|loremIpsum|placeholder_data)/i.test(line);
      if (hasMockKeyword) {
        customDiags.push({
          line: lineNum,
          severity: 'warning',
          ruleId: 'DOC-02',
          ruleName: 'Scheindaten & Platzhalter',
          message: 'Es wurden simulierte Scheindaten (Mock-Variablen) oder Platzhalter-Texte gefunden.',
          evidence: line.trim(),
          suggestion: 'Ersetzen Sie den Platzhalter durch reale APIs oder Metriken.'
        });
      }
    }

    setCustomDiagnostics(customDiags);
  };

  const fetchStatus = async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/admin/hygiene/status?email=${encodeURIComponent(currentUserEmail)}`);
      if (!res.ok) {
        throw new Error(`Fehler ${res.status}: Zugriff verweigert oder Serverfehler.`);
      }
      const data = await res.json();
      setCurrentState(data.state || 'IDLE');
      setLogs(data.logs || []);
      setTickets(data.tickets || []);
      setGraph(data.dependencyGraph || {});
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verbindungsfehler beim Laden der Hygiene-Steuerung.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchHistoryFiles = async () => {
    try {
      const res = await fetch(`/api/admin/hygiene/history-files?email=${encodeURIComponent(currentUserEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryFiles(data.files || []);
      }
    } catch (e) {
      console.error('Error fetching history:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchHistoryFiles();
    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleReviewDecision = async (ticketId: string, decision: 'approve' | 'decline') => {
    setReviewStatusMsg(null);
    try {
      const res = await fetch('/api/admin/hygiene/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          decision,
          email: currentUserEmail
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
        setLogs(data.logs || []);
        setSelectedTicket(null);
        setReviewStatusMsg({
          type: 'success',
          message: `Ticket wurde erfolgreich ${decision === 'approve' ? 'freigegeben' : 'abgelehnt'} und verarbeitet.`
        });
        setTimeout(() => setReviewStatusMsg(null), 4000);
        fetchStatus();
      } else {
        setReviewStatusMsg({ type: 'error', message: data.error || 'Aktion fehlgeschlagen.' });
      }
    } catch (err: any) {
      setReviewStatusMsg({ type: 'error', message: err.message || 'Netzwerkfehler.' });
    }
  };

  const handleRollback = async (filePath: string, backupName: string) => {
    if (!window.confirm(`Möchten Sie '${filePath}' wirklich auf den Stand von '${backupName}' zurückrollen?`)) return;
    try {
      const res = await fetch('/api/admin/hygiene/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          backupName,
          email: currentUserEmail
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        alert('Rollback erfolgreich durchgeführt.');
        fetchStatus();
      } else {
        alert(`Rollback fehlgeschlagen: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Rollback-Verbindungsfehler: ${err.message}`);
    }
  };

  const handleManualTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTriggerPath.trim()) return;
    setIsTriggering(true);
    try {
      const res = await fetch('/api/admin/hygiene/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: manualTriggerPath.trim(),
          email: currentUserEmail
        })
      });
      const data = await res.json();
      if (res.ok) {
        setManualTriggerPath('');
        alert('Hygieneprüfung für die Datei erfolgreich angestoßen.');
        fetchStatus();
      } else {
        alert(`Konnte Prüfung nicht starten: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Verbindungsfehler: ${err.message}`);
    } finally {
      setIsTriggering(false);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-white/50 uppercase tracking-widest animate-pulse">Initialisiere Capital-AI Documentary...</p>
      </div>
    );
  }

  // State colors mapping
  const stateInfo: Record<string, { label: string; color: string; desc: string }> = {
    IDLE: { label: 'Bereit (Idle)', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', desc: 'System überwacht das Verzeichnis und wartet auf Dateiänderungen.' },
    PARSING: { label: 'Analysiere', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse', desc: 'Dateiänderung erkannt. Inhalt wird eingelesen und formatiert.' },
    CHECKING_DEPS: { label: 'Prüfe Abhängigkeiten', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse', desc: 'Dependency Graph wird nach Referenzen und Querabhängigkeiten durchsucht.' },
    WAITING_AI: { label: 'KI-Klassifizierung', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse', desc: 'Gemini 3.5-Flash führt semantische Relevanz- und Risiko-Klassifizierung durch.' },
    EXECUTING: { label: 'Wende Änderungen an', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse', desc: 'Änderungen werden freigegeben oder automatisch in abhängige Dokumente synchronisiert.' },
    REVIEW_REQUIRED: { label: 'Review Erforderlich', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', desc: 'Änderung gestoppt (Risiko-Kandidat oder niedrige Konfidenz). Wartet auf Administrator-Entscheidung.' },
    DONE: { label: 'Abgeschlossen', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', desc: 'Letzter Durchlauf erfolgreich beendet. State-Machine kehrt zu Bereit zurück.' }
  };

  const activeState = stateInfo[currentState] || stateInfo['IDLE'];

  return (
    <div className="space-y-6 text-white font-sans">
      
      {/* 1. Header with State Machine Status */}
      <div className="bg-[#1A1A1E]/80 border border-white/5 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
        {/* Decorative Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="shrink-0 bg-black/40 border border-white/10 rounded-2xl p-3 flex items-center justify-center">
              <CapitalAiLogo size={60} showText={false} />
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/30 tracking-wider font-mono uppercase">
                  KI-Modul • Capital-AI Documentary
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-white/50 border border-white/5 tracking-wider font-mono uppercase flex items-center gap-1">
                  <User size={10} />
                  Gründer: Sven Kulessa
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 tracking-wider font-mono uppercase flex items-center gap-1">
                  <Mail size={10} />
                  sven.kulessa@capital-ai.online
                </span>
              </div>
              
              <h2 className="text-2xl font-black font-display tracking-tight flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-aif-gold-DEFAULT uppercase">
                <span>Capital-AI Documentary</span>
              </h2>
              <p className="text-xs text-white/55 leading-relaxed font-sans max-w-2xl">
                Dieses System überwacht vollautomatisch alle Verzeichnisse unter <code>/docs</code>. Es analysiert Änderungen semantisch auf Risiken, pflegt die hierarchische Abhängigkeitskette und steuert revisionssichere Synchronisationszyklen mithilfe von Gemini 3.5-Flash.
              </p>
            </div>
          </div>

          {/* Glowing State Machine Indicator */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 min-w-[240px] shrink-0 w-full md:w-auto relative z-10">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-mono text-white/40 uppercase">State-Machine</span>
              <button 
                onClick={() => fetchStatus(true)}
                className="text-white/40 hover:text-white transition-all"
                title="Aktualisieren"
              >
                <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
              </button>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                {currentState !== 'IDLE' && currentState !== 'REVIEW_REQUIRED' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  currentState === 'IDLE' ? 'bg-emerald-500' :
                  currentState === 'REVIEW_REQUIRED' ? 'bg-rose-500' : 'bg-cyan-400'
                }`}></span>
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${activeState.color}`}>
                {activeState.label}
              </span>
            </div>
            <p className="text-[10px] text-white/50 leading-normal mt-2 font-sans">
              {activeState.desc}
            </p>
          </div>
        </div>

        {/* Manual Trigger Quick Form (FA-28) */}
        <form onSubmit={handleManualTrigger} className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3 items-end relative z-10">
          <div className="flex-1 space-y-1 w-full">
            <label className="text-[10px] font-mono text-white/40 uppercase block">Datei manuell überprüfen (Pfad relativ zu /docs)</label>
            <input
              type="text"
              value={manualTriggerPath}
              onChange={(e) => setManualTriggerPath(e.target.value)}
              placeholder="z.B. COMPLIANCE_REPORT.md oder ceo/EXECUTIVE_SUMMARY.md"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-aif-gold-DEFAULT outline-none placeholder-white/20"
            />
          </div>
          <button
            type="submit"
            disabled={isTriggering || !manualTriggerPath.trim()}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 w-full sm:w-auto shrink-0 justify-center"
          >
            <Play size={12} />
            <span>{isTriggering ? 'Prüfe...' : 'Manuell Triggern'}</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Sub-Tabs Menu */}
      <div className="flex border-b border-white/5 p-1 bg-white/5 rounded-xl gap-2 max-w-2xl overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('tickets')}
          className={`px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeSubTab === 'tickets' 
              ? 'bg-aif-gold-DEFAULT text-black font-extrabold' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Shield size={12} />
          <span>Freigaben ({tickets.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('linter');
            runWorkspaceLint();
          }}
          className={`px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeSubTab === 'linter' 
              ? 'bg-aif-gold-DEFAULT text-black font-extrabold' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Code size={12} />
          <span>Sicherheits-Linter</span>
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeSubTab === 'logs' 
              ? 'bg-aif-gold-DEFAULT text-black font-extrabold' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock size={12} />
          <span>Aktivitätshistorie</span>
        </button>
        <button
          onClick={() => setActiveSubTab('graph')}
          className={`px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeSubTab === 'graph' 
              ? 'bg-aif-gold-DEFAULT text-black font-extrabold' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <GitBranch size={12} />
          <span>Abhängigkeitsgraph</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('rollback');
            fetchHistoryFiles();
          }}
          className={`px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeSubTab === 'rollback' 
              ? 'bg-aif-gold-DEFAULT text-black font-extrabold' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <History size={12} />
          <span>Rollback-Manager</span>
        </button>
        <button
          onClick={() => {
            setActiveSubTab('adr');
            fetchADRs();
          }}
          className={`px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeSubTab === 'adr' 
              ? 'bg-aif-gold-DEFAULT text-black font-extrabold' 
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={12} />
          <span>Architektur-Entscheidungen (ADR)</span>
        </button>
      </div>

      {/* 2. Sub-Tab Content Rendering */}
      <AnimatePresence mode="wait">
        
        {/* SUB-TAB: TICKETS */}
        {activeSubTab === 'tickets' && (
          <motion.div
            key="tickets"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {reviewStatusMsg && (
              <div className={`p-3 rounded-xl border text-xs leading-normal ${
                reviewStatusMsg.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {reviewStatusMsg.message}
              </div>
            )}

            {tickets.length === 0 ? (
              <div className="bg-[#1A1A1E]/40 border border-white/5 rounded-2xl p-10 text-center space-y-3">
                <CheckCircle className="mx-auto text-emerald-400/80" size={32} />
                <p className="text-sm font-bold">Alles im grünen Bereich!</p>
                <p className="text-xs text-white/50 max-w-md mx-auto leading-normal">
                  Aktuell liegen keine ausstehenden Review-Tickets vor. Das System arbeitet autark und führt fehlerfreie, risikoarme Updates automatisch durch.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Ticket List */}
                <div className="lg:col-span-1 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2 font-mono">Offene Review-Tickets</h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {tickets.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={`w-full p-4 rounded-xl text-left border transition-all ${
                          selectedTicket?.id === t.id 
                            ? 'bg-white/10 border-aif-gold-DEFAULT text-white' 
                            : 'bg-white/5 border-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono text-white/40">ID: {t.id}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                            Risk: {t.classification}
                          </span>
                        </div>
                        <p className="text-xs font-bold truncate mb-1">{t.filePath}</p>
                        <p className="text-[10px] text-white/50 font-mono mt-2">
                          Konfidenz: <span className="text-rose-400 font-bold">{Math.round(t.confidence * 100)}%</span>
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Collapsible Detailed Ticket Inspector */}
                <div className="lg:col-span-2">
                  {selectedTicket ? (
                    <div className="bg-[#1A1A1E]/90 border border-white/10 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-start border-b border-white/5 pb-3">
                        <div>
                          <p className="text-[10px] font-mono text-white/40">Review Ticket Detail-Inspektion</p>
                          <h4 className="text-sm font-bold text-white font-mono mt-0.5">{selectedTicket.filePath}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 border border-white/10 text-white/80">
                          {selectedTicket.id}
                        </span>
                      </div>

                      {/* AI Reasoning Summary */}
                      <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 space-y-1">
                        <p className="text-[10px] font-mono text-rose-400 uppercase font-black">Begründung für Review-Stop:</p>
                        <p className="text-xs text-white/80 font-sans leading-relaxed">
                          {selectedTicket.reason}
                        </p>
                      </div>

                      {/* Split side-by-side or collapsible diff */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-mono text-white/40 uppercase">Datei-Diff (Inhaltliche Abweichung)</p>
                        <div className="bg-neutral-950/80 rounded-xl p-3 max-h-[180px] overflow-auto font-mono text-[10px] text-white/90 leading-relaxed border border-white/5">
                          <pre className="whitespace-pre-wrap">
                            {selectedTicket.diff}
                          </pre>
                        </div>
                      </div>

                      {/* Bottom action bar */}
                      <div className="flex gap-3 pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleReviewDecision(selectedTicket.id, 'approve')}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check size={14} />
                          <span>Änderung Freigeben &amp; Sync</span>
                        </button>
                        <button
                          onClick={() => handleReviewDecision(selectedTicket.id, 'decline')}
                          className="flex-1 py-2 rounded-xl bg-rose-700/80 hover:bg-rose-600 text-white font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X size={14} />
                          <span>Änderung Ablehnen &amp; Revert</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full bg-black/20 border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-8 min-h-[250px]">
                      <Eye size={24} className="text-white/20 mb-2" />
                      <p className="text-xs font-mono text-white/40 uppercase">Bitte wählen Sie links ein Review-Ticket zur Prüfung aus</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </motion.div>
        )}

        {/* SUB-TAB: LOGS */}
        {activeSubTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="bg-[#1A1A1E]/80 border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 font-mono">Echtzeit-Hygieneprotokolle</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/5 text-[11px] font-bold text-white/55 uppercase tracking-wider bg-white/5">
                      <th className="p-3">Zeitstempel</th>
                      <th className="p-3">Datei</th>
                      <th className="p-3">Ereignis</th>
                      <th className="p-3">Klasse</th>
                      <th className="p-3">Entscheidung / Aktion</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center p-6 text-white/30">
                          Bisher keine Hygiene-Events protokolliert.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        let statusColor = 'bg-white/5 text-white/50 border-white/10';
                        if (log.status === 'SUCCESS') statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                        else if (log.status === 'WARNING') statusColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                        else if (log.status === 'PAUSED') statusColor = 'bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse';

                        return (
                          <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                            <td className="p-3 text-white/40">{new Date(log.timestamp).toLocaleTimeString()}</td>
                            <td className="p-3 font-bold text-white/80">{log.filePath}</td>
                            <td className="p-3 uppercase text-white/50">{log.eventType}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">
                                {log.classification}
                              </span>
                            </td>
                            <td className="p-3 text-white/70 max-w-[220px] truncate" title={log.details}>
                              {log.details}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUB-TAB: GRAPH */}
        {activeSubTab === 'graph' && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Visual graph layout listing dependencies */}
            <div className="bg-[#1A1A1E]/80 border border-white/5 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 font-mono">Abhängigkeitstabelle (@depends on)</h3>
                <p className="text-[10px] text-white/50 font-sans mt-0.5">Visuelle Zuordnung der deklarierten Dokumentenabhängigkeiten im Projekt.</p>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {Object.keys(graph).length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-6">Keine expliziten Abhängigkeiten deklariert.</p>
                ) : (
                  Object.entries(graph).map(([file, deps]) => (
                    <div key={file} className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-aif-gold-DEFAULT" />
                        <span className="text-xs font-bold text-white font-mono">{file}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5 pl-2">
                        {deps.map((dep) => (
                          <div key={dep} className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded text-[10px] font-mono text-cyan-400 border border-white/5">
                            <ArrowRight size={10} />
                            <span>{dep}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#1A1A1E]/80 border border-white/5 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 font-mono">Semantische Verkettung</h3>
              <p className="text-[10px] text-white/60 leading-relaxed font-sans">
                Änderungen an einem Basisdokument werden kaskadierend analysiert. Erkennt das System deklarierte Abhängigkeiten, wird die Änderung vollautomatisch semantisch transformiert und auf die abhängigen Dokumente übertragen (z.B. wenn sich Compliance-Quoten im Master-Protokoll ändern, zieht der Compliance-Report automatisch nach).
              </p>
              
              <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-white/80 space-y-2">
                <p className="font-bold text-cyan-400 font-mono flex items-center gap-1.5 text-[11px] uppercase">
                  <Database size={12} />
                  <span>Deklaration im Code</span>
                </p>
                <p className="font-mono text-[10px] text-white/70 bg-black/40 p-2.5 rounded-lg border border-white/5 whitespace-pre">
                  # Mein Dokument{'\n'}
                  @depends on COMPLIANCE_REPORT.md{'\n'}
                  @depends on security/SECURITY_GUIDELINES.md
                </p>
                <p className="text-[10px] text-white/50 leading-normal">
                  Fügen Sie diese Deklaration einfach als Textzeile in ein beliebiges Dokument ein, um es mit dem automatischen Sync-Zyklus zu verknüpfen.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* SUB-TAB: ROLLBACK */}
        {activeSubTab === 'rollback' && (
          <motion.div
            key="rollback"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[#1A1A1E]/80 border border-white/5 rounded-2xl p-5 space-y-4"
          >
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 font-mono">Revisionssichere Backups (.history)</h3>
              <p className="text-[10px] text-white/50 font-sans mt-0.5">Bei jeder automatischen oder manuellen Dateianpassung sichert das System den vorherigen Stand im historischen Snapshot-Ordner.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-bold text-white/55 uppercase tracking-wider bg-white/5">
                    <th className="p-3">Backup-Datei</th>
                    <th className="p-3">Erstellt am</th>
                    <th className="p-3">Original-Zielpfad</th>
                    <th className="p-3 text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {historyFiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-6 text-white/30">
                        Aktuell keine Backup-Snapshots vorhanden.
                      </td>
                    </tr>
                  ) : (
                    historyFiles.map((file) => {
                      // Extract target path from backup safe name (safe timestamp_safefilename format)
                      const parts = file.name.split('_');
                      parts.shift(); // remove timestamp
                      const originalPath = parts.join('/').replace('.md', '.md').replace('.json', '.json');

                      return (
                        <tr key={file.name} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="p-3 font-bold text-cyan-400 max-w-[200px] truncate" title={file.name}>{file.name}</td>
                          <td className="p-3 text-white/40">{new Date(file.modifiedAt).toLocaleString()}</td>
                          <td className="p-3 text-white/60 font-semibold">{originalPath || 'Unbekannt'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRollback(originalPath, file.name)}
                              className="px-2.5 py-1 rounded bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 text-[10px] hover:bg-cyan-500 hover:text-black font-bold uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Zurückrollen
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* SUB-TAB: SECURITY & DOCUMENT LINTER */}
        {activeSubTab === 'linter' && (
          <motion.div
            key="linter"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Linter Sub Mode Selector */}
            <div className="flex gap-4 border-b border-white/5 pb-3">
              <button
                onClick={() => { setLinterSubMode('scan'); runWorkspaceLint(); }}
                className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                  linterSubMode === 'scan'
                    ? 'border-aif-gold-DEFAULT text-aif-gold-DEFAULT font-extrabold'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Workspace-Datei-Scanner
              </button>
              <button
                onClick={() => setLinterSubMode('playground')}
                className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                  linterSubMode === 'playground'
                    ? 'border-aif-gold-DEFAULT text-aif-gold-DEFAULT font-extrabold'
                    : 'border-transparent text-white/50 hover:text-white'
                }`}
              >
                Interaktiver Clipboard-Playground
              </button>
            </div>

            {linterSubMode === 'scan' ? (
              <div className="space-y-4">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/40 border border-white/5 p-4 rounded-xl">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
                      <Shield size={14} className="text-aif-gold-DEFAULT" />
                      <span>Workspace-Sicherheits- & Richtlinien-Linter</span>
                    </p>
                    <p className="text-[10px] text-white/55">Scant alle Dokumente unter <code>/docs</code> und kritische Full-Stack-Code-Dateien auf Sicherheitslücken und Richtlinienverstöße.</p>
                  </div>
                  <button
                    onClick={runWorkspaceLint}
                    disabled={isLinting}
                    className="px-4 py-2 bg-aif-gold-DEFAULT text-black hover:bg-aif-gold-light rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isLinting ? "animate-spin" : ""} />
                    <span>{isLinting ? 'Scanne...' : 'Scanner starten'}</span>
                  </button>
                </div>

                {fixSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
                    <CheckCircle size={14} />
                    <span>{fixSuccessMsg}</span>
                  </div>
                )}

                {/* Diagnostics Summary */}
                {!isLinting && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-mono text-white/45 uppercase">Gesamtanzahl Funde</p>
                      <p className="text-lg font-black font-mono mt-1 text-white">{diagnostics.length}</p>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-mono text-rose-400 uppercase">Sicherheits-Fehler</p>
                      <p className="text-lg font-black font-mono mt-1 text-rose-400">
                        {diagnostics.filter(d => d.severity === 'error').length}
                      </p>
                    </div>
                    <div className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/25 rounded-xl p-3 text-center">
                      <p className="text-[10px] font-mono text-aif-gold-DEFAULT uppercase">Richtlinien-Warnungen</p>
                      <p className="text-lg font-black font-mono mt-1 text-aif-gold-DEFAULT">
                        {diagnostics.filter(d => d.severity === 'warning').length}
                      </p>
                    </div>
                  </div>
                )}

                {/* Filter */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-lg max-w-xs">
                  {['all', 'error', 'warning'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLintFilter(filter as any)}
                      className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase rounded transition-all ${
                        lintFilter === filter
                          ? 'bg-white/15 text-white'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      {filter === 'all' ? 'Alle' : filter === 'error' ? 'Fehler' : 'Warnungen'}
                    </button>
                  ))}
                </div>

                {/* List of Diagnostics */}
                {isLinting ? (
                  <div className="p-12 text-center bg-black/20 border border-white/5 rounded-2xl flex flex-col items-center">
                    <RefreshCw className="animate-spin text-aif-gold-DEFAULT mb-3" size={24} />
                    <p className="text-xs font-mono text-white/50 uppercase tracking-widest animate-pulse">Durchsuche Workspace nach Compliance-Abweichungen...</p>
                  </div>
                ) : diagnostics.length === 0 ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center space-y-2">
                    <CheckCircle className="mx-auto text-emerald-400" size={32} />
                    <p className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">Workspace 100% Sicher & Konform</p>
                    <p className="text-[11px] text-white/60 max-w-md mx-auto leading-normal">
                      Hervorragend! Der Sicherheits-Linter hat keine unmaskierten API-Keys, verbotenen iframe-Sperren oder veralteten Plattform-Versionsnummern gefunden. Die Plattform entspricht allen Datenintegritäts-Anforderungen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnostics
                      .filter(d => lintFilter === 'all' || d.severity === lintFilter)
                      .map((d) => (
                        <div
                          key={d.id}
                          className={`border rounded-xl p-4 transition-all space-y-3 ${
                            d.severity === 'error'
                              ? 'bg-rose-500/5 border-rose-500/20'
                              : 'bg-aif-gold-DEFAULT/5 border-aif-gold-DEFAULT/20'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-white/5 pb-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                                  d.severity === 'error'
                                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                    : 'bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border-aif-gold-DEFAULT/30'
                                }`}>
                                  {d.severity === 'error' ? <AlertOctagon size={10} /> : <AlertTriangle size={10} />}
                                  <span>{d.ruleId} • {d.ruleName}</span>
                                </span>
                                <span className="text-[10px] font-mono text-white/40">{d.filePath}:{d.line}</span>
                              </div>
                              <p className="text-xs font-bold text-white mt-1 leading-snug">{d.message}</p>
                            </div>
                            {d.autoFixable && (
                              <button
                                onClick={() => handleAutoFix(d)}
                                disabled={isFixing === d.id}
                                className="px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] hover:bg-cyan-500 hover:text-black font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <Sparkles size={10} className={isFixing === d.id ? "animate-spin" : ""} />
                                <span>{isFixing === d.id ? 'Fixing...' : 'Auto-Fix'}</span>
                              </button>
                            )}
                          </div>

                          {/* Evidence */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-white/40 uppercase">Betroffener Code-Ausschnitt:</span>
                            <div className="bg-black/50 border border-white/5 rounded-lg p-2.5 font-mono text-[11px] overflow-x-auto text-white/80 select-all border-l-2 border-l-rose-500">
                              <code>{d.evidence}</code>
                            </div>
                          </div>

                          {/* Recommendation */}
                          <div className="flex items-start gap-2 bg-white/5 p-2.5 rounded-lg">
                            <Info size={14} className="text-cyan-400 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-mono text-cyan-400 uppercase font-black">Empfehlung & Lösung:</span>
                              <p className="text-[10px] text-white/70 leading-relaxed font-sans">{d.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
                    <Terminal size={14} className="text-cyan-400" />
                    <span>Sicherheits- & Dokumentations-Linter Playground</span>
                  </p>
                  <p className="text-[10px] text-white/55">Fügen Sie Markdown-Spezifikationen oder TypeScript-Code ein, um Richtlinien- und XSS-Risiken in Echtzeit lokal zu analysieren.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/45 uppercase block">Code-Snippet oder Markdown einfügen:</label>
                    <textarea
                      value={customCode}
                      onChange={(e) => handleCustomLint(e.target.value)}
                      placeholder="Fügen Sie Code ein... (z.B. const key = 'sk_test_12345'; window.alert('Test');)"
                      className="w-full h-80 bg-black/60 border border-white/10 rounded-xl p-3 text-xs font-mono text-white focus:border-aif-gold-DEFAULT outline-none placeholder-white/20 resize-none"
                    />
                  </div>

                  {/* Result Panel */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/45 uppercase block">Echtzeit-Sicherheitsdiagnose:</label>
                    <div className="h-80 bg-black/40 border border-white/10 rounded-xl p-4 overflow-y-auto space-y-3">
                      {customCode.trim() === '' ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-white/30 space-y-2 border border-dashed border-white/5 rounded-xl">
                          <Terminal size={24} className="opacity-40 animate-pulse text-aif-gold-DEFAULT" />
                          <p className="text-[11px] font-mono uppercase tracking-wider">Warte auf Code-Eingabe...</p>
                          <p className="text-[10px] leading-relaxed max-w-xs text-white/40">Geben Sie links Text ein, um die Echtzeit-Sicherheitsvalidierung der CAPITAL-AI Engine zu starten.</p>
                        </div>
                      ) : customDiagnostics.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-emerald-400/80 space-y-2 border border-emerald-500/10 bg-emerald-500/5 rounded-xl">
                          <CheckCircle size={24} />
                          <p className="text-[11px] font-mono uppercase tracking-wider font-bold">Keine Fehler gefunden</p>
                          <p className="text-[10px] leading-relaxed text-white/55 max-w-xs">Der Playground-Linter hat keine riskanten Patterns auf dem eingegebenen Inhalt entdeckt.</p>
                        </div>
                      ) : (
                        customDiagnostics.map((d, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border text-xs leading-normal ${
                              d.severity === 'error'
                                ? 'bg-rose-500/5 border-rose-500/20 text-rose-400'
                                : 'bg-aif-gold-DEFAULT/5 border-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-mono font-bold uppercase text-[9px] px-1 py-0.5 rounded border bg-black/40">
                                Zeile {d.line} • {d.ruleId}
                              </span>
                              <span className="text-[10px] font-semibold">{d.ruleName}</span>
                            </div>
                            <p className="font-bold text-white mb-1.5 text-[11px]">{d.message}</p>
                            <p className="font-mono text-[10px] text-white/50 bg-black/30 p-1.5 rounded border border-white/5 mb-2 truncate">
                              {d.evidence}
                            </p>
                            <p className="text-[10px] text-cyan-400 font-sans leading-snug">
                              <strong>Lösung:</strong> {d.suggestion}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* SUB-TAB: ADR MANAGER */}
        {activeSubTab === 'adr' && (
          <motion.div
            key="adr"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header / Info bar */}
            <div className="bg-[#1A1A1E]/40 border border-white/5 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-aif-gold-DEFAULT animate-pulse" />
                  <span>ARCHITECTURE DECISION RECORDS (ADR) MANAGER</span>
                </h3>
                <p className="text-[11px] text-white/50 leading-relaxed max-w-2xl font-sans">
                  Revisionssichere Dokumentation wesentlicher technischer Design- und Architekturentscheidungen der CAPITAL-AI Plattform (Version 0.5.4) im standardisierten Markdown-Format.
                </p>
              </div>
              <button
                onClick={openCreateMode}
                className="px-4 py-2 bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black font-mono font-bold text-xs uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,196,83,0.15)] shrink-0 self-end md:self-auto"
              >
                <Plus size={12} />
                <span>Neuer ADR-Eintrag</span>
              </button>
            </div>

            {adrError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-mono">
                <AlertTriangle size={15} />
                <span>{adrError}</span>
              </div>
            )}

            {isAdrsLoading && adrs.length === 0 ? (
              <div className="bg-[#1A1A1E]/20 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-8 h-8 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest animate-pulse">Lade Architektur-Entscheidungen...</p>
              </div>
            ) : adrs.length === 0 ? (
              <div className="bg-black/20 border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-12 min-h-[300px] space-y-4">
                <FileText size={40} className="text-white/10" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Keine ADRs vorhanden</p>
                  <p className="text-xs text-white/40 max-w-md mx-auto leading-normal font-sans">
                    Es wurden noch keine Revisionsberichte im Verzeichnis <code>docs/adr</code> abgelegt. Klicken Sie auf "+ Neuer ADR-Eintrag", um Ihre erste Architekturentscheidung zu dokumentieren.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: ADR Index List */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 font-mono">
                      Einträge ({adrs.length})
                    </h4>
                    <span className="text-[9px] font-mono text-white/30">docs/adr/*.md</span>
                  </div>

                  <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                    {adrs.map((adr) => {
                      const isSelected = selectedAdr?.id === adr.id;
                      const statusColors: Record<string, string> = {
                        ACCEPTED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        PROPOSED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                        REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                        DEPRECATED: 'bg-white/5 text-white/40 border-white/5',
                        SUPERSEDED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                      };
                      const sColor = statusColors[adr.status.toUpperCase()] || statusColors.PROPOSED;

                      return (
                        <button
                          key={adr.id}
                          onClick={() => {
                            setSelectedAdr(adr);
                            setIsEditingAdr(false);
                            setIsCreatingAdr(false);
                          }}
                          className={`w-full p-4 rounded-xl text-left border transition-all relative overflow-hidden flex flex-col gap-2 cursor-pointer ${
                            isSelected && !isCreatingAdr
                              ? 'bg-white/10 border-aif-gold-DEFAULT text-white shadow-[inset_0_0_12px_rgba(255,255,255,0.03)]'
                              : 'bg-white/5 border-white/5 text-white/75 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-aif-gold-DEFAULT tracking-wider">{adr.id}</span>
                            <span className={`px-2 py-0.5 rounded-[6px] text-[8px] font-mono font-bold uppercase border ${sColor}`}>
                              {adr.status}
                            </span>
                          </div>
                          
                          <p className="text-xs font-bold leading-normal text-white group-hover:text-aif-gold-DEFAULT transition-all font-sans">
                            {adr.title}
                          </p>

                          <div className="flex justify-between items-center mt-1 border-t border-white/5 pt-2 text-[9px] font-mono text-white/40">
                            <span>{adr.date}</span>
                            <span>{adr.author}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Detail Inspector & Form Block */}
                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    
                    {/* Mode 1: Create ADR */}
                    {isCreatingAdr && (
                      <AdrForm
                        mode="create"
                        onSubmit={submitCreateAdr}
                        onCancel={() => setIsCreatingAdr(false)}
                      />
                    )}

                    {/* Mode 2: Edit ADR */}
                    {isEditingAdr && selectedAdr && (
                      <AdrForm
                        mode="edit"
                        initialData={{
                          id: formId,
                          title: formTitle,
                          status: formStatus,
                          date: formDate,
                          author: formAuthor,
                          context: formContext,
                          decision: formDecision,
                          consequences: formConsequences,
                        }}
                        onSubmit={submitUpdateAdr}
                        onCancel={() => setIsEditingAdr(false)}
                      />
                    )}

                    {/* Mode 3: View ADR Detail */}
                    {!isCreatingAdr && !isEditingAdr && selectedAdr && (
                      <motion.div
                        key="view-detail"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-5"
                      >
                        {/* Detail Top Header Card */}
                        <div className="bg-[#1A1A1E]/95 border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
                          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <FileText size={120} />
                          </div>

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-3.5 mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-black text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 px-2.5 py-0.5 rounded border border-aif-gold-DEFAULT/25 uppercase">
                                  {selectedAdr.id}
                                </span>
                                <span className="text-[10px] text-white/40 font-mono">Dateiname: {selectedAdr.id}.md</span>
                              </div>
                              <h3 className="text-base font-bold font-display text-white uppercase tracking-tight leading-snug">
                                {selectedAdr.title}
                              </h3>
                            </div>

                            {/* Status label */}
                            {(() => {
                              const statusColors: Record<string, string> = {
                                ACCEPTED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]',
                                PROPOSED: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.1)]',
                                REJECTED: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                                DEPRECATED: 'bg-white/5 text-white/40 border-white/10',
                                SUPERSEDED: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.1)]',
                              };
                              return (
                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase border tracking-wider shrink-0 ${statusColors[selectedAdr.status.toUpperCase()] || statusColors.PROPOSED}`}>
                                  {selectedAdr.status}
                                </span>
                              );
                            })()}
                          </div>

                          {/* Metadata grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono bg-black/30 rounded-xl p-3 border border-white/5">
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-white/40 uppercase">Datum:</span>
                              <p className="text-white font-bold">{selectedAdr.date}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[9px] text-white/40 uppercase">Verantwortlicher Autor:</span>
                              <p className="text-white font-bold">{selectedAdr.author}</p>
                            </div>
                            <div className="col-span-2 sm:col-span-1 space-y-0.5">
                              <span className="text-[9px] text-white/40 uppercase">Relativer Dateipfad:</span>
                              <p className="text-cyan-400 truncate text-[10px]">{selectedAdr.relPath}</p>
                            </div>
                          </div>
                        </div>

                        {/* Detail Content Sections */}
                        <div className="space-y-4">
                          
                          {/* Section 1: Context */}
                          <div className="bg-[#121215]/80 border border-white/5 rounded-2xl p-5 space-y-2.5">
                            <div className="flex items-center gap-2 text-white/40 pb-2 border-b border-white/5">
                              <HelpCircle size={14} className="text-cyan-400" />
                              <h4 className="text-[10px] font-mono uppercase font-black tracking-widest text-white/70">1. Kontext (Hintergrund &amp; Problemstellung)</h4>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed font-sans whitespace-pre-wrap">
                              {selectedAdr.context || 'Kein Kontext dokumentiert.'}
                            </p>
                          </div>

                          {/* Section 2: Decision */}
                          <div className="bg-[#121215]/80 border border-white/5 rounded-2xl p-5 space-y-2.5 border-l-2 border-l-aif-gold-DEFAULT">
                            <div className="flex items-center gap-2 text-white/40 pb-2 border-b border-white/5">
                              <CheckCircle size={14} className="text-aif-gold-DEFAULT" />
                              <h4 className="text-[10px] font-mono uppercase font-black tracking-widest text-aif-gold-DEFAULT">2. Entscheidung (Gewählte Lösung)</h4>
                            </div>
                            <p className="text-xs text-white/90 leading-relaxed font-sans whitespace-pre-wrap font-medium">
                              {selectedAdr.decision || 'Keine Entscheidung dokumentiert.'}
                            </p>

                            {/* Expandable Decision Version History */}
                            <div className="mt-4 pt-3 border-t border-white/5">
                              <details className="group">
                                <summary className="list-none flex items-center justify-between cursor-pointer select-none">
                                  <span className="text-[9px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-widest flex items-center gap-1.5 hover:text-aif-gold-light transition-colors">
                                    <Clock size={10} className="group-open:rotate-180 transition-transform duration-200" />
                                    <span>Versionsverlauf der Entscheidung</span>
                                  </span>
                                  <div className="flex items-center gap-1 text-[8px] font-mono text-white/30">
                                    <span>{selectedAdrHistory.length} {selectedAdrHistory.length === 1 ? 'Version' : 'Versionen'}</span>
                                    <span className="transition-transform group-open:rotate-180 text-[7px]">▼</span>
                                  </div>
                                </summary>
                                
                                <div className="mt-3 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                  {isHistoryLoading ? (
                                    <div className="py-4 text-center text-[10px] font-mono text-white/30 animate-pulse">
                                      Lade Historie...
                                    </div>
                                  ) : selectedAdrHistory.length === 0 ? (
                                    <div className="py-3 text-center text-[10px] font-mono text-white/30 italic">
                                      Keine vorherigen Änderungen erfasst.
                                    </div>
                                  ) : (
                                    [...selectedAdrHistory].reverse().map((hist, index) => {
                                      const isLatest = hist.version === selectedAdrHistory.length;
                                      return (
                                        <div
                                          key={hist.version}
                                          className={`p-3 rounded-xl border text-[11px] leading-relaxed transition-all ${
                                            isLatest
                                              ? 'bg-aif-gold-DEFAULT/[0.03] border-aif-gold-DEFAULT/20 text-white'
                                              : 'bg-black/35 border-white/5 text-white/60'
                                          }`}
                                        >
                                          <div className="flex justify-between items-center mb-1 text-[9px] font-mono">
                                            <span className={`font-bold ${isLatest ? 'text-aif-gold-DEFAULT' : 'text-white/40'}`}>
                                              Version {hist.version} {isLatest && '(Aktuell)'}
                                            </span>
                                            <span className="text-white/30">
                                              {new Date(hist.updatedAt).toLocaleString('de-DE')}
                                            </span>
                                          </div>
                                          <p className="font-sans whitespace-pre-wrap text-white/80 select-all selection:bg-aif-gold-DEFAULT selection:text-black">
                                            {hist.decision}
                                          </p>
                                          <div className="mt-1.5 text-[8px] font-mono text-white/30 text-right">
                                            Autor: {hist.updatedBy}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </details>
                            </div>
                          </div>

                          {/* Section 3: Consequences */}
                          <div className="bg-[#121215]/80 border border-white/5 rounded-2xl p-5 space-y-2.5">
                            <div className="flex items-center gap-2 text-white/40 pb-2 border-b border-white/5">
                              <Info size={14} className="text-emerald-400" />
                              <h4 className="text-[10px] font-mono uppercase font-black tracking-widest text-white/70">3. Konsequenzen (Trade-Offs &amp; Resultate)</h4>
                            </div>
                            <p className="text-xs text-white/80 leading-relaxed font-sans whitespace-pre-wrap">
                              {selectedAdr.consequences || 'Keine Konsequenzen dokumentiert.'}
                            </p>
                          </div>

                        </div>

                        {/* Action Bar for Admin */}
                        <div className="flex gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => openEditMode(selectedAdr)}
                            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                          >
                            <span>Eintrag Bearbeiten</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAdr(selectedAdr.id)}
                            className="px-5 py-2.5 rounded-xl bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 font-mono font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-rose-900/30"
                          >
                            <span>Löschen</span>
                          </button>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>

              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
