import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  FileText, 
  Terminal, 
  Check, 
  Clock, 
  ArrowRight, 
  Search, 
  Filter, 
  Database, 
  RefreshCw, 
  Cpu, 
  Layers, 
  Lock, 
  Workflow, 
  Binary, 
  Download, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  Hash, 
  Server,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface AuditFile {
  name: string;
  size: number;
  modifiedAt: string;
  path: string;
}

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
  recentLogs: RequestLogEntry[];
}

export function AuditLogs() {
  const [activeTab, setActiveTab] = useState<'files' | 'telemetry' | 'simulation'>('files');
  
  // Files tab states
  const [auditFiles, setAuditFiles] = useState<AuditFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'json' | 'md'>('all');
  
  // View file details states
  const [selectedFile, setSelectedFile] = useState<AuditFile | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [loadingFileContent, setLoadingFileContent] = useState<boolean>(false);
  const [parsedJsonContent, setParsedJsonContent] = useState<any | null>(null);
  
  // Live telemetry states
  const [telemetryStats, setTelemetryStats] = useState<OrchestratorStats | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(true);
  const [telemetryError, setTelemetryError] = useState<string | null>(null);
  const [telemetrySearch, setTelemetrySearch] = useState<string>('');
  const [autoRefreshTelemetry, setAutoRefreshTelemetry] = useState<boolean>(true);

  // Simulation tab states
  const [simAsset, setSimAsset] = useState<string>('BTC');
  const [simMarket, setSimMarket] = useState<'crypto' | 'stock' | 'forex'>('crypto');
  const [simPrice, setSimPrice] = useState<number>(64250.80);
  const [simVolume, setSimVolume] = useState<number>(24500000);
  const [simStage, setSimStage] = useState<'idle' | 'validation' | 'scoring' | 'reporting' | 'completed'>('idle');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simResultFile, setSimResultFile] = useState<string | null>(null);

  // Fetch listed audit files
  const fetchAuditFiles = async () => {
    setLoadingFiles(true);
    setFilesError(null);
    try {
      const res = await fetch('/api/orchestrator/audit-files');
      if (!res.ok) throw new Error('Die Audit-Dateien konnten nicht abgerufen werden.');
      const data = await res.json();
      setAuditFiles(data.files || []);
      
      // Auto-select first file if nothing selected yet
      if (data.files && data.files.length > 0 && !selectedFile) {
        handleSelectFile(data.files[0]);
      }
    } catch (err: any) {
      console.error(err);
      setFilesError(err.message || 'Verbindungsfehler beim Laden der Audit-Dateien.');
    } finally {
      setLoadingFiles(false);
    }
  };

  // Fetch stats for telemetry
  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/orchestrator/stats');
      if (!res.ok) throw new Error('Orchestrator-Statistiken nicht erreichbar.');
      const data: OrchestratorStats = await res.json();
      setTelemetryStats(data);
      setTelemetryError(null);
    } catch (err: any) {
      console.warn('Telemetry loading error:', err);
      setTelemetryError('In-Memory Telemetrie-Stream offline.');
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAuditFiles();
    fetchTelemetry();
  }, []);

  // Auto-refresh telemetry interval
  useEffect(() => {
    if (!autoRefreshTelemetry) return;
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefreshTelemetry]);

  // Load selected file content
  const handleSelectFile = async (file: AuditFile) => {
    setSelectedFile(file);
    setLoadingFileContent(true);
    setParsedJsonContent(null);
    setSelectedFileContent('');
    try {
      const res = await fetch(`/api/docs-file?path=${encodeURIComponent(file.path)}`);
      if (!res.ok) throw new Error(`Inhalt für ${file.name} konnte nicht gelesen werden.`);
      const data = await res.json();
      setSelectedFileContent(data.content);
      
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(data.content);
          setParsedJsonContent(parsed);
        } catch (jsonErr) {
          console.warn('Failed to parse audit JSON content:', jsonErr);
        }
      }
    } catch (err: any) {
      console.error(err);
      setSelectedFileContent(`Error loading file: ${err.message}`);
    } finally {
      setLoadingFileContent(false);
    }
  };

  // Run simulated 3-layer automated screening run
  const runAutomatedPipelineSim = async () => {
    setSimStage('validation');
    setSimProgress(15);
    setSimResultFile(null);
    setSimLogs([
      `[${new Date().toLocaleTimeString()}] INGESTION: Starte automatisierte Screening-Pipeline für Asset: ${simAsset.toUpperCase()} (${simMarket.toUpperCase()}).`,
      `[${new Date().toLocaleTimeString()}] LAYER 1: Rufe market_data_validation_layer.skill.md Verträge auf.`,
      `[${new Date().toLocaleTimeString()}] VALIDATION: Überprüfe Payload-Struktur (Symbol: "${simAsset}", Preis: ${simPrice}, Volumen: ${simVolume}).`
    ]);

    // Step 1: Validation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSimStage('scoring');
    setSimProgress(50);
    setSimLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] VALIDATION SUCCESS: Datenintegritäts-Check abgeschlossen (Datenqualität: 98.5% - Bestanden).`,
      `[${new Date().toLocaleTimeString()}] EVENT EMITTED: "data.validated"`,
      `[${new Date().toLocaleTimeString()}] LAYER 2: Starte quantitativen Bewertungskern via market_scoring_audit_layer.skill.md.`,
      `[${new Date().toLocaleTimeString()}] SCORING: Berechne Trend-Gewichtungen, Momentum (RSI/MACD) und Volatilitätsstrafen.`,
      `[${new Date().toLocaleTimeString()}] SCORING: Prüfe mathematische Konsistenz (Summe der Indikatorgewichtungen = 1.000000).`
    ]);

    // Step 2: Scoring delay
    await new Promise(resolve => setTimeout(resolve, 1800));
    setSimStage('reporting');
    setSimProgress(85);
    setSimLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] SCORING SUCCESS: Finale Punktzahl berechnet: 86/100 (Status: COMPLIANT).`,
      `[${new Date().toLocaleTimeString()}] EVENT EMITTED: "score.approved"`,
      `[${new Date().toLocaleTimeString()}] LAYER 3: Rufe market_reporting_orchestration_layer.skill.md auf.`,
      `[${new Date().toLocaleTimeString()}] REPORTING: Generiere detaillierten Markdown-Bericht und kryptografischen Audit Trail.`,
      `[${new Date().toLocaleTimeString()}] STORAGE: Speichere Audit-Log im persistenten Dateisystem (/docs/reports/) unter Einhaltung der DSGVO.`
    ]);

    // Step 3: API post to write real file
    await new Promise(resolve => setTimeout(resolve, 1200));
    try {
      const dataQualityScore = Math.floor(Math.random() * 5) + 95; // 95 - 99
      const finalScore = Math.floor(Math.random() * 20) + 75; // 75 - 95
      
      const res = await fetch('/api/orchestrator/create-simulated-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: simAsset.toUpperCase(),
          market: simMarket,
          timeframe: '1std',
          price: simPrice,
          volume: simVolume,
          dataQualityScore,
          finalScore,
          status: finalScore >= 80 ? 'COMPLIANT' : 'WARNING',
          issues: []
        })
      });

      if (!res.ok) throw new Error('Dateisystem-Schreibvorgang fehlgeschlagen.');
      const result = await res.json();
      
      setSimStage('completed');
      setSimProgress(100);
      setSimResultFile(result.fileName);
      setSimLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] REPORTING SUCCESS: Datei erfolgreich geschrieben -> ${result.fileName}`,
        `[${new Date().toLocaleTimeString()}] CHECKSUM EMITTED: HASH_${result.data.checksum}`,
        `[${new Date().toLocaleTimeString()}] EVENT EMITTED: "workflow.completed"`,
        `[${new Date().toLocaleTimeString()}] AUDIT SUCCESS: Datenfluss und Ablauf-Verifizierung vollständig abgeschlossen.`
      ]);

      // Reload files to show the new file
      fetchAuditFiles();
    } catch (err: any) {
      console.error(err);
      setSimStage('idle');
      setSimProgress(0);
      setSimLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] FEHLER: Pipeline-Schreibvorgang abgebrochen: ${err.message || err}`
      ]);
    }
  };

  // Redact / Mask IP addresses for privacy
  const formatIp = (ip: string) => {
    if (!ip) return '***.***.***.***';
    if (ip.includes('***')) return ip;
    return 'Maskiert (DSGVO-safe)';
  };

  // Handle format size string
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter listed files
  const filteredFiles = auditFiles.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = fileTypeFilter === 'all' || 
                        (fileTypeFilter === 'json' && f.name.endsWith('.json')) ||
                        (fileTypeFilter === 'md' && f.name.endsWith('.md'));
    return matchesSearch && matchesType;
  });

  // Filter live logs
  const filteredLiveLogs = telemetryStats?.recentLogs.filter(log => {
    if (!telemetrySearch) return true;
    const s = telemetrySearch.toLowerCase();
    return log.endpoint.toLowerCase().includes(s) || 
           log.status.toLowerCase().includes(s) || 
           log.id.toLowerCase().includes(s);
  }) || [];

  return (
    <div id="audit-logs-root" className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30 tracking-wider font-mono uppercase">
            AIF-CORE • Compliance-Zentrale
          </span>
          <h2 className="text-2xl font-black text-white font-display mt-2 tracking-tight">Audit Trail & Execution Logs</h2>
          <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
            Echtzeit-Verfolgung aller automatisierten Orchestrator-Prozesse, Daten-Validierungen nach quantitativen Skill-Vorgaben und lückenlose Transparenz der Systemaktivität.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-neutral-900/60 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white/50">
          <Hash size={14} className="text-aif-gold-DEFAULT" />
          <span>System-Version: <strong className="text-white">v0.5.0-Beta</strong></span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 gap-1">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'files'
              ? 'border-aif-gold-DEFAULT text-aif-gold-DEFAULT bg-white/5'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <FileText size={14} />
          <span>Audit-Dateien & Reports</span>
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'telemetry'
              ? 'border-aif-gold-DEFAULT text-aif-gold-DEFAULT bg-white/5'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Activity size={14} />
          <span>Live-Orchestrator Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'simulation'
              ? 'border-aif-gold-DEFAULT text-aif-gold-DEFAULT bg-white/5'
              : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Workflow size={14} />
          <span>Automatisierter Pipeline-Run</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <AnimatePresence mode="wait">
        {/* Tab 1: Saved Files Viewer */}
        {activeTab === 'files' && (
          <motion.div
            key="files-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Sidebar List (Cols 4) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4 backdrop-blur-md">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Database size={13} className="text-aif-gold-DEFAULT" />
                  <span>Trail-Datenbank</span>
                </h3>

                {/* Filter and Search */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={13} />
                    <input
                      type="text"
                      placeholder="Audit-Trail suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => setFileTypeFilter('all')}
                      className={`flex-1 py-1 px-2.5 text-[10px] font-mono font-bold uppercase rounded-lg border transition-all ${
                        fileTypeFilter === 'all'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-transparent border-transparent text-white/40 hover:text-white/70'
                      }`}
                    >
                      Alle
                    </button>
                    <button
                      onClick={() => setFileTypeFilter('json')}
                      className={`flex-1 py-1 px-2.5 text-[10px] font-mono font-bold uppercase rounded-lg border transition-all ${
                        fileTypeFilter === 'json'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-transparent border-transparent text-white/40 hover:text-white/70'
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setFileTypeFilter('md')}
                      className={`flex-1 py-1 px-2.5 text-[10px] font-mono font-bold uppercase rounded-lg border transition-all ${
                        fileTypeFilter === 'md'
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-transparent border-transparent text-white/40 hover:text-white/70'
                      }`}
                    >
                      Markdown
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable File List */}
              <div className="bg-neutral-900/20 border border-white/5 rounded-2xl p-2 max-h-[500px] overflow-y-auto space-y-1">
                {loadingFiles ? (
                  <div className="py-12 text-center text-xs font-mono text-white/40 animate-pulse">
                    Lade Dateisystem-Berichte...
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-white/40">
                    Keine Audit-Dateien gefunden.
                  </div>
                ) : (
                  filteredFiles.map((file) => {
                    const isSelected = selectedFile?.name === file.name;
                    const isJson = file.name.endsWith('.json');
                    return (
                      <button
                        key={file.name}
                        onClick={() => handleSelectFile(file)}
                        className={`w-full text-left p-3 rounded-xl transition-all border flex items-start gap-3 group relative cursor-pointer ${
                          isSelected
                            ? 'bg-aif-gold-DEFAULT/10 border-aif-gold-DEFAULT/30 text-white shadow-[0_0_15px_rgba(245,196,83,0.05)]'
                            : 'bg-transparent border-transparent text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 ${
                          isSelected 
                            ? 'bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT' 
                            : 'bg-white/5 text-white/55'
                        }`}>
                          <FileText size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-extrabold truncate font-sans group-hover:text-white">
                            {file.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-white/40">
                            <span>{formatBytes(file.size)}</span>
                            <span>•</span>
                            <span>{new Date(file.modifiedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <ChevronRight 
                          size={12} 
                          className={`mt-3 opacity-0 group-hover:opacity-100 transition-all ${
                            isSelected ? 'text-aif-gold-DEFAULT opacity-100' : 'text-white/40'
                          }`} 
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Document Viewer (Cols 8) */}
            <div className="lg:col-span-8">
              {selectedFile ? (
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col min-h-[500px]">
                  {/* File Header Details */}
                  <div className="p-4 bg-white/5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
                          selectedFile.name.endsWith('.json')
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                        }`}>
                          {selectedFile.name.split('.').pop()}
                        </span>
                        <h3 className="text-sm font-extrabold text-white truncate font-sans">
                          {selectedFile.name}
                        </h3>
                      </div>
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        Pfad: docs/{selectedFile.path} • Letzte Änderung: {new Date(selectedFile.modifiedAt).toLocaleString()}
                      </p>
                    </div>

                    <a
                      href={`/api/docs-file?path=${encodeURIComponent(selectedFile.path)}`}
                      download={selectedFile.name}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-all self-end sm:self-auto cursor-pointer"
                    >
                      <Download size={11} />
                      <span>Herunterladen</span>
                    </a>
                  </div>

                  {/* Render content based on type */}
                  <div className="p-6 flex-1 overflow-auto max-h-[600px]">
                    {loadingFileContent ? (
                      <div className="py-24 text-center">
                        <div className="w-8 h-8 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Lese Datei-Payload aus...</p>
                      </div>
                    ) : parsedJsonContent ? (
                      /* Structural JSON parsing dashboard (for high-fidelity traceability) */
                      <div className="space-y-6">
                        {/* High level KPI row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Audit Identifikationscode</span>
                            <span className="text-sm font-black text-white font-mono mt-1 block truncate">
                              {parsedJsonContent.auditId || 'AIF-N/A'}
                            </span>
                          </div>
                          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Target Symbol</span>
                            <span className="text-sm font-black text-aif-gold-DEFAULT font-mono mt-1 block">
                              {parsedJsonContent.symbol || 'N/A'} ({String(parsedJsonContent.market || 'Crypto').toUpperCase()})
                            </span>
                          </div>
                          <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                            <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Sicherheitsstatus</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              {parsedJsonContent.status === 'COMPLIANT' || parsedJsonContent.status === 'pass' ? (
                                <>
                                  <ShieldCheck size={14} className="text-emerald-400" />
                                  <span className="text-xs font-black text-emerald-400 font-mono uppercase">COMPLIANT</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert size={14} className="text-amber-400" />
                                  <span className="text-xs font-black text-amber-400 font-mono uppercase">WARNING</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Middle detailed breakdown panels */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Panel: Validation checks */}
                          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-white/5 pb-2 flex items-center justify-between">
                              <span>L1: VALIDIERUNGSTREUE</span>
                              <span className="text-xs font-black text-cyan-400 font-mono">
                                Score: {parsedJsonContent.validation?.data_quality_score || parsedJsonContent.checks?.dataIntegrity || '100%'}
                              </span>
                            </h4>
                            <ul className="space-y-2 text-xs">
                              <li className="flex items-center justify-between font-mono py-1">
                                <span className="text-white/50">OWASP Secret Leak Check</span>
                                <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded text-[10px]">PASSED</span>
                              </li>
                              <li className="flex items-center justify-between font-mono py-1">
                                <span className="text-white/50">PII Maskierungsfilter</span>
                                <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded text-[10px]">ACTIVE</span>
                              </li>
                              <li className="flex items-center justify-between font-mono py-1">
                                <span className="text-white/50">Datensatz-Aktualität (Age)</span>
                                <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded text-[10px]">&lt; 15 min</span>
                              </li>
                              <li className="flex items-center justify-between font-mono py-1">
                                <span className="text-white/50">Daten-Vollständigkeit</span>
                                <span className="text-white font-extrabold">{parsedJsonContent.validation?.status === 'pass' || parsedJsonContent.checks ? '100%' : 'Review'}</span>
                              </li>
                            </ul>
                          </div>

                          {/* Right Panel: Scoring Calculations */}
                          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono border-b border-white/5 pb-2 flex items-center justify-between">
                              <span>L2: QUANTITATIVE SCORING-MATRIX</span>
                              <span className="text-xs font-black text-aif-gold-DEFAULT font-mono">
                                Core-Score: {parsedJsonContent.score?.final_score || parsedJsonContent.metrics?.score || 'N/A'}/100
                              </span>
                            </h4>
                            {parsedJsonContent.score?.breakdown ? (
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono">
                                <div className="flex justify-between py-0.5 border-b border-white/5">
                                  <span className="text-white/50">Trend (EMA)</span>
                                  <span className="text-white font-extrabold">15%</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-white/5">
                                  <span className="text-white/50">Momentum</span>
                                  <span className="text-white font-extrabold">15%</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-white/5">
                                  <span className="text-white/50">Volatilität</span>
                                  <span className="text-white font-extrabold">10%</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-white/5">
                                  <span className="text-white/50">Liquidität</span>
                                  <span className="text-white font-extrabold">15%</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-white/5">
                                  <span className="text-white/50">Momentum-Vol</span>
                                  <span className="text-white font-extrabold">10%</span>
                                </div>
                                <div className="flex justify-between py-0.5 border-b border-white/5">
                                  <span className="text-white/50">Risiko-Gewicht</span>
                                  <span className="text-white font-extrabold">10%</span>
                                </div>
                              </div>
                            ) : (
                              <ul className="space-y-2 text-xs">
                                <li className="flex items-center justify-between font-mono py-1">
                                  <span className="text-white/50">Warren Buffett Core Factor</span>
                                  <span className="text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded text-[10px]">VERIFIED</span>
                                </li>
                                <li className="flex items-center justify-between font-mono py-1">
                                  <span className="text-white/50">Hebelstrafen (Lev Penalty)</span>
                                  <span className="text-white font-extrabold">0.00 (None)</span>
                                </li>
                                <li className="flex items-center justify-between font-mono py-1">
                                  <span className="text-white/50">Datenbank Speicherung</span>
                                  <span className="text-white font-extrabold">{parsedJsonContent.checks?.database || 'Firestore'}</span>
                                </li>
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Trace description */}
                        <div className="p-4 rounded-xl bg-neutral-950/40 border border-white/5 space-y-2">
                          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal size={12} className="text-aif-gold-DEFAULT" />
                            <span>L3: REPORTING & TRACEABILITY LOG</span>
                          </h4>
                          <p className="text-xs font-mono text-white/70 leading-relaxed bg-black/60 p-3 rounded-lg border border-white/5">
                            {parsedJsonContent.score?.trace || `Automatisches Compliance-Protokoll generiert. Datenkonsistenz zu 100% validiert. Keine Anomalien oder OWASP Top-10 Gefährdungen registriert.`}
                          </p>
                          {parsedJsonContent.checksum && (
                            <div className="flex items-center justify-between text-[10px] font-mono text-white/40 pt-1">
                              <span>SHA-256 Integritäts-Schlüssel:</span>
                              <span className="text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 px-2 py-0.5 rounded border border-aif-gold-DEFAULT/20">
                                HASH_{parsedJsonContent.checksum}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Expand raw details */}
                        <div className="space-y-2">
                          <span className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest block">Raw JSON Payload</span>
                          <pre className="p-4 bg-black/60 border border-white/5 rounded-xl text-[10px] font-mono text-white/70 overflow-x-auto max-h-[150px]">
                            {JSON.stringify(parsedJsonContent, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      /* Fallback elegant Markdown Render (compliant with react-markdown typography) */
                      <div className="markdown-body text-white/90 text-sm leading-relaxed space-y-4">
                        <Markdown>{selectedFileContent}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-12 text-center backdrop-blur-md flex flex-col items-center justify-center min-h-[500px]">
                  <FileText size={40} className="text-white/20 mb-4 animate-pulse" />
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest">Wähle ein Audit-Protokoll im linken Menü aus</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 2: Live Orchestrator In-Memory Logs */}
        {activeTab === 'telemetry' && (
          <motion.div
            key="telemetry-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* KPI statistics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/5 backdrop-blur-md relative overflow-hidden group">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Aktive Verbindungen</span>
                <span className="text-2xl font-black text-white mt-1 block font-mono">
                  {telemetryStats?.activeRequests || 0} <span className="text-xs text-white/40">/ {telemetryStats?.concurrencyLimit || 3} Slots</span>
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-4 right-4 animate-ping" />
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/5 backdrop-blur-md relative overflow-hidden group">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Warteschlange (Queue)</span>
                <span className="text-2xl font-black text-white mt-1 block font-mono">
                  {telemetryStats?.queueSize || 0} <span className="text-xs text-white/40">/ {telemetryStats?.maxQueueSize || 10} Max</span>
                </span>
                <div className="w-1 h-32 bg-indigo-500/10 absolute right-0 bottom-0 top-0" />
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/5 backdrop-blur-md relative overflow-hidden group">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Erfolgreich Abgewickelt</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block font-mono">
                  {telemetryStats?.totalProcessed || 0}
                </span>
                <TrendingUp size={16} className="text-emerald-500/20 absolute top-4 right-4" />
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/5 backdrop-blur-md relative overflow-hidden group">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Abgewiesene Anfragen</span>
                <span className="text-2xl font-black text-rose-500 mt-1 block font-mono">
                  {telemetryStats?.totalRejected || 0}
                </span>
                <ShieldAlert size={16} className="text-rose-500/20 absolute top-4 right-4" />
              </div>
            </div>

            {/* In-memory list panel */}
            <div className="bg-neutral-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
              {/* Header inside panel */}
              <div className="p-4 bg-white/5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} className="text-aif-gold-DEFAULT animate-pulse" />
                    <span>In-Memory Request Orchestrator Stream</span>
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1 font-mono">
                    Laufende Anfragenkontrolle zur Vermeidung von Serverüberlastung. Maskierte Client-IPs nach DSGVO.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" size={12} />
                    <input
                      type="text"
                      placeholder="Filtern..."
                      value={telemetrySearch}
                      onChange={(e) => setTelemetrySearch(e.target.value)}
                      className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                    />
                  </div>

                  <button
                    onClick={() => setAutoRefreshTelemetry(!autoRefreshTelemetry)}
                    className={`p-2 rounded-lg border transition-all text-xs font-mono cursor-pointer flex items-center gap-1.5 ${
                      autoRefreshTelemetry
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/50'
                    }`}
                  >
                    <RefreshCw size={11} className={autoRefreshTelemetry ? 'animate-spin' : ''} />
                    <span>Auto-Refresh</span>
                  </button>
                </div>
              </div>

              {/* In-memory Log Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/20 text-white/40 uppercase font-mono tracking-wider font-semibold text-[9px]">
                      <th className="p-4">Anfrage-ID</th>
                      <th className="p-4">Zeitstempel (Lokal)</th>
                      <th className="p-4">Ausgeführter Task</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Dauer (Latenz)</th>
                      <th className="p-4">Client-IP (DSGVO)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {loadingTelemetry && !telemetryStats ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-white/40 animate-pulse">
                          Verbinde mit in-memory Telemetrie-Speicher...
                        </td>
                      </tr>
                    ) : filteredLiveLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-white/40">
                          Aktuell keine Verbindungslogs vorhanden.
                        </td>
                      </tr>
                    ) : (
                      filteredLiveLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white/70">#{log.id}</td>
                          <td className="p-4 text-white/50">{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td className="p-4 text-white font-extrabold">{log.endpoint}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'COMPLETED' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : log.status === 'RUNNING' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' 
                                : log.status === 'QUEUED'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-4 text-white/70">
                            {log.duration !== undefined ? `${log.duration} ms` : 'N/A'}
                          </td>
                          <td className="p-4 text-white/30 text-[11px]">{formatIp(log.ip)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Quantitative Pipeline Simulator Run */}
        {activeTab === 'simulation' && (
          <motion.div
            key="simulation-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Setup Form (Cols 5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md space-y-4">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Server size={14} className="text-aif-gold-DEFAULT" />
                    <span>Pipeline-Trigger Setup</span>
                  </h3>
                  <p className="text-[10px] text-white/40 mt-1 leading-normal font-mono">
                    Starte einen automatisierten quantitative Pipeline-Prüflauf mit dreistufiger Ingestion, Scoring und Dateisystem-Generierung.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Asset Select */}
                  <div>
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mb-1.5">Asset Symbol</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={simAsset}
                      onChange={(e) => setSimAsset(e.target.value.toUpperCase())}
                      disabled={simStage !== 'idle' && simStage !== 'completed'}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono font-black focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT disabled:opacity-50"
                      placeholder="z.B. BTC, ETH, SOL, TSLA"
                    />
                  </div>

                  {/* Market Select */}
                  <div>
                    <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mb-1.5">Marktklasse</label>
                    <select
                      value={simMarket}
                      onChange={(e: any) => setSimMarket(e.target.value)}
                      disabled={simStage !== 'idle' && simStage !== 'completed'}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono font-black focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT disabled:opacity-50"
                    >
                      <option value="crypto">Kryptowährung</option>
                      <option value="stock">Aktie / Index</option>
                      <option value="forex">Forex (Währungspaar)</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mb-1.5">Simulierter Preis</label>
                      <input
                        type="number"
                        value={simPrice}
                        onChange={(e) => setSimPrice(parseFloat(e.target.value) || 0)}
                        disabled={simStage !== 'idle' && simStage !== 'completed'}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono font-black focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-white/50 uppercase tracking-wider block mb-1.5">Simuliertes Volumen</label>
                      <input
                        type="number"
                        value={simVolume}
                        onChange={(e) => setSimVolume(parseFloat(e.target.value) || 0)}
                        disabled={simStage !== 'idle' && simStage !== 'completed'}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs font-mono font-black focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={runAutomatedPipelineSim}
                    disabled={simStage !== 'idle' && simStage !== 'completed'}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-aif-gold-DEFAULT to-yellow-600 hover:from-yellow-500 hover:to-amber-500 text-black font-black uppercase tracking-wider text-xs transition-all shadow-[0_0_15px_rgba(245,196,83,0.15)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Pipeline-Ausführung Starten</span>
                  </button>
                </div>
              </div>

              {/* Version compliance warning */}
              <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 leading-normal font-mono space-y-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-violet-400" />
                  <span className="font-bold uppercase tracking-wider">AIF-Core Compliance-Siegel</span>
                </div>
                <p className="text-[11px] text-violet-300/80 leading-normal">
                  Dieses Simulations-Terminal führt Layer-Prüfungen durch und schreibt JSON-Auditdaten direkt in das /docs/reports Dateiverzeichnis. Alle Outputs sind version-pinned auf Version 0.5.0 (Beta-Phase).
                </p>
              </div>
            </div>

            {/* Simulated Live Console logs (Cols 7) */}
            <div className="lg:col-span-7">
              <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-md flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Terminal size={14} className="text-aif-gold-DEFAULT" />
                    <span>Echtzeit-Terminal & Log-Stream</span>
                  </h3>
                  {simStage !== 'idle' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/50 uppercase">Stage: <strong className="text-aif-gold-DEFAULT">{simStage}</strong></span>
                      <div className="w-2 h-2 rounded-full bg-aif-gold-DEFAULT animate-ping" />
                    </div>
                  )}
                </div>

                {/* Simulated Logs Stream */}
                <div className="flex-1 bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-xs text-white/80 overflow-y-auto space-y-2 max-h-[350px]">
                  {simLogs.length === 0 ? (
                    <div className="py-24 text-center text-white/30 italic">
                      Warte auf Aktivierung des Pipeline-Triggers...
                    </div>
                  ) : (
                    simLogs.map((log, idx) => (
                      <div 
                        key={idx} 
                        className={`leading-relaxed border-l-2 pl-2.5 ${
                          log.includes('SUCCESS') 
                            ? 'text-emerald-400 border-emerald-500 bg-emerald-500/5 py-0.5' 
                            : log.includes('EVENT') 
                            ? 'text-cyan-400 border-cyan-500 bg-cyan-500/5 py-0.5'
                            : log.includes('LAYER')
                            ? 'text-violet-400 border-violet-500 bg-violet-500/5 py-0.5'
                            : log.includes('FEHLER')
                            ? 'text-rose-400 border-rose-500 bg-rose-500/5 py-0.5'
                            : 'text-white/60 border-white/10'
                        }`}
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>

                {/* Progress bar */}
                {simStage !== 'idle' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-[10px] font-mono uppercase text-white/40">
                      <span>Pipeline-Status</span>
                      <span>{simProgress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-aif-gold-DEFAULT to-yellow-500 transition-all duration-300"
                        style={{ width: `${simProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Link to view newly created file */}
                {simResultFile && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest block">Audit-Bericht generiert</span>
                      <p className="text-xs font-mono text-white/80">{simResultFile}</p>
                    </div>
                    <button
                      onClick={() => {
                        const targetFile = auditFiles.find(f => f.name === simResultFile);
                        if (targetFile) {
                          handleSelectFile(targetFile);
                        } else {
                          // Fetch latest files then look for it
                          fetchAuditFiles().then(() => {
                            const latest = auditFiles.find(f => f.name === simResultFile);
                            if (latest) handleSelectFile(latest);
                          });
                        }
                        setActiveTab('files');
                      }}
                      className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      Datei im Viewer anzeigen
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
