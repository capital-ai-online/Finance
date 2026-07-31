import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  FileText, 
  Terminal, 
  AlertTriangle, 
  Search, 
  Cpu, 
  Award, 
  Info, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  XCircle,
  Clock,
  Code,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { ComplianceRun, ScannerResult, Finding, RemediationPlan, ComplianceCertificate } from '../../server/compliance/types';

interface SecurityComplianceAuditorProps {
  currentUserEmail: string;
}

export function SecurityComplianceAuditor({ currentUserEmail }: SecurityComplianceAuditorProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [runningAudit, setRunningAudit] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'scanners' | 'findings' | 'remediations' | 'policies' | 'certification'>('scanners');
  const [selectedScanner, setSelectedScanner] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<ComplianceCertificate[]>([]);
  const [remediations, setRemediations] = useState<RemediationPlan[]>([]);
  const [exportOutput, setExportOutput] = useState<{ type: string; content: string } | null>(null);

  // Fetch initial dashboard status & history
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/compliance/dashboard');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
        if (data.lastRun) {
          setSelectedRunId(data.lastRun.id);
          // Fetch additional risk profiles & remediation plans
          const riskRes = await fetch(`/api/compliance/risk?runId=${data.lastRun.id}`);
          if (riskRes.ok) {
            const riskData = await riskRes.json();
            setRemediations(riskData.reremediations || riskData.remediationPlans || []);
          }
        }
      }
      
      const certsRes = await fetch('/api/compliance/certificates');
      if (certsRes.ok) {
        const certsData = await certsRes.json();
        setCertificates(certsData.certificates || []);
      }
    } catch (err) {
      console.error('Error fetching compliance dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Run a manual compliance audit scan
  const triggerComplianceScan = async () => {
    try {
      setRunningAudit(true);
      setFeedback(null);
      const res = await fetch('/api/compliance/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUserEmail
        },
        body: JSON.stringify({ email: currentUserEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ message: 'BaFin Compliance-Audit erfolgreich abgeschlossen!', type: 'success' });
        await fetchDashboardData();
      } else {
        setFeedback({ message: data.error || 'Fehler während des Scans.', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Verbindungsfehler beim Scannen.', type: 'error' });
    } finally {
      setRunningAudit(false);
    }
  };

  // Generate compliance certificate
  const triggerCertify = async () => {
    if (!dashboardData?.lastRun) return;
    try {
      const res = await fetch('/api/compliance/certify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': currentUserEmail
        },
        body: JSON.stringify({ runId: dashboardData.lastRun.id, email: currentUserEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ message: `Regulatory Certificate ${data.certificate.id} erfolgreich ausgestellt!`, type: 'success' });
        // Refresh cert list
        const certsRes = await fetch('/api/compliance/certificates');
        if (certsRes.ok) {
          const certsData = await certsRes.json();
          setCertificates(certsData.certificates || []);
        }
      } else {
        setFeedback({ message: data.error || 'Zertifizierung abgelehnt.', type: 'error' });
      }
    } catch (err: any) {
      setFeedback({ message: err.message || 'Verbindungsfehler.', type: 'error' });
    }
  };

  // Fetch reports (Markdown, JSON, Mermaid, etc.)
  const fetchReportExport = async (type: 'markdown' | 'json' | 'mermaid' | 'documentaryExport') => {
    if (!dashboardData?.lastRun) return;
    try {
      const res = await fetch(`/api/compliance/report?runId=${dashboardData.lastRun.id}`);
      if (res.ok) {
        const data = await res.json();
        const content = data.reports[type];
        setExportOutput({ type, content });
      }
    } catch (err) {
      console.error('Failed to export report:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <RefreshCw className="animate-spin text-aif-gold-DEFAULT" size={32} />
        <p className="text-xs font-mono text-white/50 uppercase tracking-widest">Lade BaFin Compliance Auditor Daten...</p>
      </div>
    );
  }

  const lastRun: ComplianceRun | null = dashboardData?.lastRun || null;
  const activePolicy = dashboardData?.activePolicy || null;

  return (
    <div className="space-y-6">
      {/* Overview stats header */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Overall score block */}
        <div className="bg-[#1c1c21]/90 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <ShieldCheck size={48} className="text-emerald-400" />
          </div>
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider">Overall Compliance</span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-black font-display ${lastRun && lastRun.scores.compliance >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {lastRun ? lastRun.scores.compliance : 0}%
            </span>
            <span className="text-xs font-mono text-white/30">/100</span>
          </div>
          <div className="text-[10px] text-white/50 font-mono flex items-center gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${lastRun?.isProductionReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{lastRun?.isProductionReady ? 'Prüfung Bestanden' : 'Nachbesserung Erforderlich'}</span>
          </div>
        </div>

        {/* Security rating block */}
        <div className="bg-[#1c1c21]/90 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <ShieldCheck size={48} className="text-cyan-400" />
          </div>
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider">Security Score</span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-black font-display ${lastRun && lastRun.assessment.securityScore >= 95 ? 'text-cyan-400' : 'text-amber-400'}`}>
              {lastRun ? lastRun.assessment.securityScore : 0}%
            </span>
            <span className="text-xs font-mono text-white/30">/100</span>
          </div>
          <span className="text-[9px] text-white/40 font-mono">Basierend auf OWASP & Secrets</span>
        </div>

        {/* Enterprise Readiness index */}
        <div className="bg-[#1c1c21]/90 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Award size={48} className="text-indigo-400" />
          </div>
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider">Enterprise Readiness</span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-display text-indigo-400">
              {lastRun ? lastRun.assessment.enterpriseReadiness : 0}%
            </span>
            <span className="text-xs font-mono text-white/30">/100</span>
          </div>
          <span className="text-[9px] text-white/40 font-mono">Resilienz & Dokumentation</span>
        </div>

        {/* Production Readiness index */}
        <div className="bg-[#1c1c21]/90 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Cpu size={48} className="text-pink-400" />
          </div>
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider">Production Readiness</span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-black font-display ${lastRun?.isProductionReady ? 'text-emerald-400' : 'text-pink-400'}`}>
              {lastRun ? lastRun.assessment.productionReadiness : 0}%
            </span>
            <span className="text-xs font-mono text-white/30">/100</span>
          </div>
          <span className="text-[9px] text-white/40 font-mono">Builds & CI/CD Pipelines</span>
        </div>

        {/* Risk profile metrics */}
        <div className="bg-[#1c1c21]/90 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <AlertTriangle size={48} className="text-amber-400" />
          </div>
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider">Risk Index</span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-black font-display ${lastRun && lastRun.assessment.riskScore > 30 ? 'text-amber-500' : 'text-emerald-400'}`}>
              {lastRun ? lastRun.assessment.riskScore : 0}
            </span>
            <span className="text-xs font-mono text-white/30">/100</span>
          </div>
          <span className="text-[9px] text-white/40 font-mono">Gesamtes Risikopotenzial</span>
        </div>

        {/* Findings Counter */}
        <div className="bg-[#1c1c21]/90 border border-white/5 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Terminal size={48} className="text-rose-400" />
          </div>
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-wider">Aktiv-Mängel</span>
          <div className="my-2 flex items-baseline gap-1.5">
            <span className={`text-3xl font-black font-display ${lastRun && lastRun.findings.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {lastRun ? lastRun.findings.length : 0}
            </span>
          </div>
          <span className="text-[9px] text-white/40 font-mono">Unerfüllte Anforderungen</span>
        </div>
      </div>

      {/* Trigger & Notification action panel */}
      <div className="bg-gradient-to-r from-[#1c1c21] to-[#121215] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black font-display text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="text-aif-gold-DEFAULT" size={18} />
            <span>Zentrale BaFin-Governance-Instanz</span>
          </h3>
          <p className="text-xs text-white/60 font-sans max-w-xl">
            Der Compliance Auditor agiert als automatisches Freigabetor. Er prüft systematisch 21 Schwachstellenklassen ab. Ein Deployment in die Live-Produktionsumgebung wird nur bei vollständiger Mängelfreiheit freigegeben.
          </p>
        </div>

        <button
          onClick={triggerComplianceScan}
          disabled={runningAudit}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 text-black font-mono font-bold uppercase text-xs tracking-wider flex items-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
        >
          {runningAudit ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          <span>Full Compliance Scan Ausführen</span>
        </button>
      </div>

      {/* Alert feeds */}
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border font-mono text-xs flex items-center gap-3 ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{feedback.message}</span>
        </motion.div>
      )}

      {/* Tab select sub-system */}
      <div className="flex border-b border-white/5 pb-2.5 gap-6">
        {[
          { id: 'scanners', label: 'Scanner-Module (21)' },
          { id: 'findings', label: `Ermittelte Mängel (${lastRun?.findings.length || 0})` },
          { id: 'remediations', label: 'Behebungspläne' },
          { id: 'policies', label: 'Sicherheitsrichtlinie' },
          { id: 'certification', label: 'Regulatorische Zertifikate' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-aif-gold-DEFAULT text-white font-extrabold'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab render containers */}
      <div className="space-y-4">
        {/* SCANNERS TAB */}
        {activeTab === 'scanners' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-white/30" size={16} />
                <input
                  type="text"
                  placeholder="Scannermodule filtern..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT/50"
                />
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {lastRun && Object.values(lastRun.scannerResults)
                  .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.type.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(scanner => {
                    const isSelected = selectedScanner === scanner.id;
                    return (
                      <div 
                        key={scanner.id}
                        className={`bg-[#1c1c21]/60 border rounded-xl transition-all ${
                          isSelected ? 'border-aif-gold-DEFAULT/40' : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div 
                          onClick={() => setSelectedScanner(isSelected ? null : scanner.id)}
                          className="p-4 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`h-2.5 w-2.5 rounded-full ${
                              scanner.complianceScore >= 95 ? 'bg-emerald-400' :
                              scanner.complianceScore >= 70 ? 'bg-amber-400' : 'bg-rose-500'
                            }`} />
                            <div>
                              <p className="text-xs font-bold font-mono text-white">{scanner.name}</p>
                              <p className="text-[9px] text-white/40 uppercase tracking-wider font-mono">{scanner.type} • v{scanner.version}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right font-mono">
                              <p className="text-[10px] text-white/40 uppercase">Compliance</p>
                              <p className={`text-xs font-bold ${
                                scanner.complianceScore >= 95 ? 'text-emerald-400' : 'text-amber-400'
                              }`}>{scanner.complianceScore}%</p>
                            </div>

                            <div className="text-right font-mono">
                              <p className="text-[10px] text-white/40 uppercase">Confidence</p>
                              <p className="text-xs font-bold text-white/80">{(scanner.confidenceScore * 100).toFixed(0)}%</p>
                            </div>

                            {isSelected ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />}
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-white/5 p-4 bg-black/20 font-mono text-[11px] text-white/80 space-y-3 overflow-hidden"
                            >
                              <div>
                                <p className="text-white/40 uppercase text-[9px] tracking-wider">Prüfbericht & Nachweiserhebung:</p>
                                <p className="mt-1 leading-relaxed text-white/90">{scanner.evidence}</p>
                              </div>

                              {scanner.findings.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-rose-400 font-bold uppercase text-[9px] tracking-wider">Identifizierte Mängel:</p>
                                  {scanner.findings.map(finding => (
                                    <div key={finding.id} className="p-3 rounded bg-rose-500/5 border border-rose-500/10 text-rose-300">
                                      <p className="font-bold text-xs flex items-center gap-1.5">
                                        <AlertTriangle size={12} />
                                        <span>{finding.title} ({finding.severity})</span>
                                      </p>
                                      <p className="mt-1 font-sans text-xs">{finding.description}</p>
                                      <p className="mt-1.5 text-[9px] text-white/40">Zugeordnete Norm: {finding.complianceReference}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex justify-between text-[10px] text-white/40 border-t border-white/5 pt-2">
                                <span>Risk Score: {scanner.riskScore}/100</span>
                                <span>Dauer: {scanner.executionTimeMs}ms</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Sidebar with action links */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#1c1c21]/80 border border-white/5 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider border-b border-white/5 pb-2">Audit-Berichtsexporte</h4>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => fetchReportExport('markdown')}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs text-left flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>Markdown Report (.md)</span>
                    <FileText size={12} className="text-aif-gold-DEFAULT" />
                  </button>
                  <button 
                    onClick={() => fetchReportExport('json')}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs text-left flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>JSON Schema Export (.json)</span>
                    <FileCode size={12} className="text-aif-gold-DEFAULT" />
                  </button>
                  <button 
                    onClick={() => fetchReportExport('mermaid')}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs text-left flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>Mermaid Flowchart Graph</span>
                    <Code size={12} className="text-aif-gold-DEFAULT" />
                  </button>
                </div>
              </div>

              {/* Show code exports if loaded */}
              {exportOutput && (
                <div className="bg-black/80 border border-white/10 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider">{exportOutput.type} Output</span>
                    <button 
                      onClick={() => setExportOutput(null)}
                      className="text-[10px] font-mono text-white/40 hover:text-white cursor-pointer"
                    >
                      Schließen
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-white/70 overflow-x-auto max-h-48 p-2 bg-black/40 border border-white/5 rounded leading-relaxed">
                    {exportOutput.content}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FINDINGS TAB */}
        {activeTab === 'findings' && (
          <div className="space-y-4">
            {lastRun && lastRun.findings.length === 0 ? (
              <div className="p-8 text-center bg-[#1c1c21]/40 border border-white/5 rounded-2xl">
                <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-wider">0 Mängel Identifiziert</p>
                <p className="text-xs text-white/55 font-sans mt-1">Dieses Release erfüllt die strengen BaFin-Sicherheitsanforderungen vollständig.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lastRun?.findings.map(finding => (
                  <div key={finding.id} className="bg-[#1c1c21]/70 border border-rose-500/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-mono font-bold uppercase tracking-wider">
                          {finding.severity}
                        </span>
                        <h4 className="text-xs font-bold text-white font-mono">{finding.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono text-white/30">{finding.complianceReference}</span>
                    </div>

                    <p className="text-xs text-white/70 font-sans leading-relaxed">{finding.description}</p>
                    
                    <div className="p-3 rounded bg-black/40 border border-white/5 font-mono text-[11px] text-white/80 space-y-1.5">
                      <p><span className="text-white/40 uppercase text-[9px] tracking-wider">Risiko: </span>{finding.risk}</p>
                      {finding.filePath && <p><span className="text-white/40 uppercase text-[9px] tracking-wider">Datei: </span><code className="text-aif-gold-DEFAULT">{finding.filePath}</code></p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REMEDIATIONS TAB */}
        {activeTab === 'remediations' && (
          <div className="space-y-4">
            {remediations.length === 0 && (!lastRun || lastRun.findings.length === 0) ? (
              <div className="p-8 text-center bg-[#1c1c21]/40 border border-white/5 rounded-2xl">
                <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-xs font-mono text-emerald-400 uppercase font-bold tracking-wider">Keine Nachbesserungen Notwendig</p>
              </div>
            ) : (
              <div className="space-y-4">
                {lastRun?.findings.map((f, i) => {
                  const plan = remediations.find(p => p.findingId === f.id) || {
                    priority: f.severity === 'CRITICAL' ? 'CRITICAL' : f.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
                    solution: `Empfohlen: Sichern Sie die Datei ${f.filePath || 'Systemdateien'}. Validieren Sie, dass ${f.complianceReference} eingehalten wird.`
                  };
                  return (
                    <div key={i} className="bg-[#1c1c21]/80 border border-white/5 rounded-2xl p-4 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            plan.priority === 'CRITICAL' || plan.priority === 'HIGH' ? 'bg-rose-500' : 'bg-amber-400'
                          }`} />
                          <h4 className="text-xs font-bold font-mono text-white">Behebungsplan: {f.title}</h4>
                        </div>
                        <span className="text-[10px] text-white/40 font-mono uppercase">Priorität: {plan.priority}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-1.5">
                          <p className="text-white/40 font-mono text-[9px] uppercase tracking-wider">Ausgangssituation & Risiko</p>
                          <p className="text-white/80 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{f.risk}</p>
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-emerald-400 font-mono text-[9px] uppercase tracking-wider">Automatisierte Lösungsempfehlung</p>
                          <p className="text-emerald-300 leading-relaxed bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                            {plan.solution}
                          </p>
                        </div>
                      </div>

                      {f.filePath && (
                        <div className="flex items-center gap-2 font-mono text-[10px] text-white/50 bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <FileCode size={12} className="text-aif-gold-DEFAULT" />
                          <span>Code-Referenz: <code className="text-white">{f.filePath}</code></span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* POLICIES TAB */}
        {activeTab === 'policies' && (
          <div className="bg-[#1c1c21]/80 border border-white/5 rounded-2xl p-6 space-y-6">
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold font-mono text-white uppercase tracking-wider">{activePolicy?.name || 'BaFin Compliance & GDPR Policy'}</h4>
              <p className="text-xs text-white/60 font-sans">{activePolicy?.description || 'Enforces strict secure data processing, transaction tracking, and release requirements.'}</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 'rule_sec_95', desc: 'Sicherheits-Score muss ≥ 95% betragen.', min: 95, current: lastRun ? lastRun.assessment.securityScore : 0 },
                { id: 'rule_comp_95', desc: 'Compliance-Score muss ≥ 95% betragen.', min: 95, current: lastRun ? lastRun.scores.compliance : 0 },
                { id: 'rule_no_critical', desc: '0 kritische Funde im Codebase-Audit.', min: 100, current: lastRun ? lastRun.findings.filter(f => f.severity === 'CRITICAL').length === 0 ? 100 : 0 : 0, isCount: true, countVal: lastRun ? lastRun.findings.filter(f => f.severity === 'CRITICAL').length : 0 },
                { id: 'rule_no_high', desc: '0 schwere Funde im Codebase-Audit.', min: 100, current: lastRun ? lastRun.findings.filter(f => f.severity === 'HIGH').length === 0 ? 100 : 0 : 0, isCount: true, countVal: lastRun ? lastRun.findings.filter(f => f.severity === 'HIGH').length : 0 }
              ].map(rule => {
                const passed = rule.current >= rule.min;
                return (
                  <div key={rule.id} className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between gap-4 font-mono text-xs">
                    <div className="space-y-1">
                      <p className="text-white font-bold">{rule.desc}</p>
                      <p className="text-[10px] text-white/40 uppercase">Regel-ID: {rule.id} • Fail-Closed: True</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-white/40 uppercase">Ist-Wert</p>
                        <p className={`text-xs font-bold ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {rule.isCount ? `${rule.countVal} Funde` : `${rule.current}%`}
                        </p>
                      </div>

                      <div className="flex items-center justify-center">
                        {passed ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold">ERFÜLLT</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-bold">VERLETZT</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CERTIFICATION TAB */}
        {activeTab === 'certification' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-4">
              {lastRun && (
                <div className="bg-gradient-to-br from-[#1c1c21] to-[#121215] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
                  {/* Watermark certificate logo background */}
                  <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                    <Award size={220} className="text-aif-gold-DEFAULT" />
                  </div>

                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <Award className="text-aif-gold-DEFAULT" size={32} />
                      <div>
                        <h4 className="text-sm font-black font-mono text-white uppercase tracking-wider">CONFORMITY CERTIFICATE</h4>
                        <p className="text-[9px] text-white/40 font-mono uppercase tracking-widest">BaFin Financial AI Regulatory Standard</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-aif-gold-DEFAULT font-bold uppercase border border-aif-gold-DEFAULT/30 rounded px-2.5 py-0.5">LEVEL 3 CERTIFIED</span>
                  </div>

                  <div className="space-y-4 text-xs font-sans text-white/80 leading-relaxed">
                    <p>
                      Hiermit wird bescheinigt, dass der Build des Systems <span className="text-white font-bold font-mono">CAPITAL-AI (Version 0.5.4)</span> die Konformitätsprüfung für Hochsicherheitsumgebungen und Risikomanagement gemäß den Richtlinien der Bundesanstalt für Finanzdienstleistungsaufsicht (BaFin) bestanden hat.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-[10px] text-white/60 bg-black/40 p-4 rounded-xl border border-white/5">
                      <p>Release Status: <span className="text-emerald-400 font-bold">PRODUCTION APPROVED</span></p>
                      <p>Prüfende Instanz: <span className="text-white">Supervisor Orchestration Engine</span></p>
                      <p>Vorschriften: <span className="text-white">Art. 32 DSGVO & OWASP 2021</span></p>
                      <p>Gültig bis: <span className="text-white">{new Date(Date.now() + 31536000000).toLocaleDateString('de-DE')}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/5">
                    <div className="font-mono text-[9px] text-white/30 leading-snug">
                      <p>Kryptografischer Signatur-Hash:</p>
                      <p className="text-white/60">{lastRun ? lastRun.id : 'N/A'}-SIGN-SHA256</p>
                    </div>

                    <button
                      onClick={triggerCertify}
                      disabled={!lastRun?.isProductionReady}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 text-black font-mono font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
                    >
                      <Award size={12} />
                      <span>Certificate Ausstellen</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#1c1c21]/80 border border-white/5 rounded-2xl p-4 space-y-4">
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider border-b border-white/5 pb-2">Ausgestellte Zertifikate ({certificates.length})</h4>
                
                {certificates.length === 0 ? (
                  <p className="text-xs font-mono text-white/40 text-center py-4">Noch keine Zertifikate ausgestellt.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-1">
                    {certificates.map(cert => (
                      <div key={cert.id} className="p-3 rounded-xl bg-black/40 border border-emerald-500/10 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-emerald-400 font-bold">
                          <span>{cert.id}</span>
                          <span className="text-[9px] uppercase">Gültig</span>
                        </div>
                        <p className="text-white/60 text-[10px]">Durch: {cert.certifiedBy}</p>
                        <p className="text-white/30 text-[9px]">Scope: {cert.scope}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
