import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Check, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  Hash, 
  Lock, 
  Download, 
  Send,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabaseClient';

// ADR-0003.5/0008: Die frühere client-seitige ADMIN_EMAILS-Prüfung wurde entfernt.
// Diese Komponente trifft keine eigene Autorisierungsentscheidung mehr - Sichtbarkeit
// richtet sich ausschließlich nach der Server-Antwort (401/403) auf jeden Request.
// isAdmin/ADMIN_EMAILS hier zu reproduzieren wäre reine UI-Kosmetik ohne Sicherheitswert.

export interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'AUTH' | 'SUBSCRIPTION' | 'CREDITS' | 'ORCHESTRATOR' | 'MARKET_DATA' | 'SECURITY';
  action: string;
  userEmail: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ip?: string;
}

interface AuditLogProps {
  currentUserEmail: string;
}

export function AuditLog({ currentUserEmail }: AuditLogProps) {
  // Wird erst nach der ersten Server-Antwort gesetzt - vorher unbekannt (null),
  // damit keine UI-Entscheidung auf Basis von Client-Daten getroffen wird.
  const [accessDenied, setAccessDenied] = useState<boolean | null>(null);

  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Custom manual event form states
  const [showManualForm, setShowManualForm] = useState<boolean>(false);
  const [newType, setNewType] = useState<'AUTH' | 'SUBSCRIPTION' | 'CREDITS' | 'ORCHESTRATOR' | 'MARKET_DATA' | 'SECURITY'>('SECURITY');
  const [newAction, setNewAction] = useState<string>('');
  const [newDetails, setNewDetails] = useState<string>('');
  const [newStatus, setNewStatus] = useState<'SUCCESS' | 'WARNING' | 'FAILED'>('SUCCESS');
  const [targetEmail, setTargetEmail] = useState<string>('');
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      // email-Query bleibt als Übergangs-Fallback bestehen, bis die IAM-Migration
      // produktiv läuft (siehe server/iam/authMiddleware.ts) - entscheidend ist der Token.
      const res = await fetch(`/api/admin/system-events?email=${encodeURIComponent(currentUserEmail)}`, { headers });
      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true);
        throw new Error('Access Denied: Kein ausreichend berechtigter Zugriff.');
      }
      if (!res.ok) {
        throw new Error('Fehler beim Abrufen des Aktivitäts-Protokolls.');
      }
      setAccessDenied(false);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verbindung zum System-Protokoll fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentUserEmail]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction || !newDetails) return;

    setSubmitLoading(true);
    setSubmitSuccess(false);
    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      const res = await fetch('/api/admin/system-events', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: currentUserEmail,
          type: newType,
          action: newAction,
          details: newDetails,
          status: newStatus,
          targetEmail: targetEmail || currentUserEmail
        })
      });

      if (res.status === 401 || res.status === 403) {
        setAccessDenied(true);
        throw new Error('Access Denied: Kein ausreichend berechtigter Zugriff.');
      }
      if (!res.ok) {
        throw new Error('Konnte manuelles Ereignis nicht registrieren.');
      }

      const data = await res.json();
      setEvents(data.events || []);
      
      // Reset form
      setNewAction('');
      setNewDetails('');
      setTargetEmail('');
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Fehler beim Speichern.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `system_events_export_${Math.floor(Date.now()/1000)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (accessDenied) {
    return (
      <div id="unauthorized-audit-view" className="bg-[#1C1C21]/80 border border-rose-500/20 rounded-2xl p-8 text-center space-y-4 backdrop-blur-xl">
        <div className="mx-auto w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/30">
          <ShieldAlert size={24} className="text-rose-500" />
        </div>
        <h3 className="text-md font-bold font-display text-white uppercase tracking-wider">Streng vertraulich (Restricted)</h3>
        <p className="text-xs text-white/55 leading-relaxed max-w-md mx-auto font-sans">
          Dieser Bereich ist ausschließlich für autorisierte Plattform-Administratoren reserviert. Ihr Benutzerkonto verfügt nicht über die erforderlichen Zugriffsrechte.
        </p>
      </div>
    );
  }

  // Filter events based on criteria
  const filteredEvents = events.filter(evt => {
    const matchesSearch = 
      evt.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = typeFilter === 'ALL' || evt.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || evt.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div id="secure-audit-log-view" className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#141417]/80 border border-white/5 rounded-2xl p-5 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-widest">
              Live-Integritäts-Audit
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white uppercase tracking-tight font-display">
            Systemereignisse & Aktivitäten
          </h3>
          <p className="text-[11px] text-white/50">
            Lückenlose Überwachung von Authentifizierungsversuchen, Rechnungsdaten und Sicherheitskontrollen.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto">
          <button
            onClick={() => setShowManualForm(!showManualForm)}
            className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-[11px] font-mono font-bold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={13} className="text-aif-gold-DEFAULT" />
            <span>Manuelles Ereignis</span>
          </button>
          
          <button
            onClick={handleDownloadJson}
            disabled={events.length === 0}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-mono font-bold uppercase tracking-wider text-white flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download size={12} />
            <span className="hidden md:inline">Exportieren (JSON)</span>
          </button>

          <button
            onClick={fetchEvents}
            disabled={loading}
            className="p-1.5 rounded-xl bg-neutral-900 border border-white/5 hover:border-white/15 text-white/70 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-aif-gold-DEFAULT' : ''} />
          </button>
        </div>
      </div>

      {/* Manual Audit Event Trigger Form */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleManualSubmit} className="bg-[#1A1A1F]/90 border border-aif-gold-DEFAULT/15 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-widest flex items-center gap-1.5">
                  <Terminal size={12} />
                  Manuelles Ereignis registrieren
                </span>
                <span className="text-[10px] text-white/40 font-mono">Simuliert DevOps Compliance</span>
              </div>

              {submitSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-mono flex items-center gap-2">
                  <Check size={14} />
                  <span>Ereignis erfolgreich in system_events.json aufgezeichnet!</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/50 uppercase">Kategorie</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                  >
                    <option value="SECURITY">SECURITY</option>
                    <option value="AUTH">AUTH</option>
                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                    <option value="CREDITS">CREDITS</option>
                    <option value="ORCHESTRATOR">ORCHESTRATOR</option>
                    <option value="MARKET_DATA">MARKET_DATA</option>
                  </select>
                </div>

                {/* Action Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/50 uppercase">Aktion</label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Security Patch Applied"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                  />
                </div>

                {/* Status Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/50 uppercase">Ergebnisstatus</label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                  >
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="WARNING">WARNING</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Target User Email */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/50 uppercase">Ziel-Benutzer-E-Mail (Optional)</label>
                  <input
                    type="email"
                    placeholder="E-Mail für Kontext (z.B. user@gmail.com)"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                  />
                </div>

                {/* Details Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-white/50 uppercase font-bold">Details & Beschreibung</label>
                  <input
                    type="text"
                    required
                    placeholder="Beschreibung der ausgeführten Systemaktivität"
                    value={newDetails}
                    onChange={(e) => setNewDetails(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitLoading || !newAction || !newDetails}
                  className="px-4 py-2 bg-aif-gold-DEFAULT text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-aif-gold-light transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send size={11} />
                  <span>{submitLoading ? 'Speichere...' : 'In Logdatei schreiben'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Filter and Search Bar Container */}
      <div className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={13} />
            <input
              type="text"
              placeholder="Ereignisse, Details oder E-Mails durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
            />
          </div>

          {/* Type Filter */}
          <div className="md:col-span-3 flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 uppercase hidden sm:inline">Typ:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
            >
              <option value="ALL">Alle Typen</option>
              <option value="SECURITY">SECURITY</option>
              <option value="AUTH">AUTH</option>
              <option value="SUBSCRIPTION">SUBSCRIPTION</option>
              <option value="CREDITS">CREDITS</option>
              <option value="ORCHESTRATOR">ORCHESTRATOR</option>
              <option value="MARKET_DATA">MARKET_DATA</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3 flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 uppercase hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT"
            >
              <option value="ALL">Alle Status</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="WARNING">WARNING</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>

          {/* KPI indicator */}
          <div className="md:col-span-1 flex items-center justify-center font-mono text-[10px] text-white/40 bg-black/20 border border-white/5 rounded-xl py-2">
            <span>{filteredEvents.length} Logs</span>
          </div>
        </div>
      </div>

      {/* Events Stream List */}
      <div className="bg-[#141417]/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md">
        {error && (
          <div className="p-6 text-center space-y-2">
            <AlertCircle size={24} className="text-rose-500 mx-auto" />
            <p className="text-xs text-rose-400 font-mono">{error}</p>
            <button 
              onClick={fetchEvents}
              className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-[10px] text-white font-mono rounded-lg hover:bg-rose-500/20"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {!error && loading && (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
              Lade verschlüsseltes System-Protokoll...
            </p>
          </div>
        )}

        {!error && !loading && filteredEvents.length === 0 && (
          <div className="py-16 text-center space-y-1.5">
            <ShieldCheck size={32} className="text-white/20 mx-auto animate-pulse" />
            <p className="text-xs text-white/50 font-bold">Keine Systemereignisse gefunden.</p>
            <p className="text-[10px] text-white/30 font-mono">Passen Sie die Filterkriterien an oder registrieren Sie ein Test-Ereignis.</p>
          </div>
        )}

        {!error && !loading && filteredEvents.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-black/30 text-white/40 uppercase font-mono tracking-wider font-semibold text-[9px]">
                  <th className="p-4">Event-ID</th>
                  <th className="p-4">Zeitstempel</th>
                  <th className="p-4">Kategorie</th>
                  <th className="p-4">Aktion</th>
                  <th className="p-4">Details & Trace</th>
                  <th className="p-4">Ausgeführt von</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {filteredEvents.map((evt) => {
                  const isSuccess = evt.status === 'SUCCESS';
                  const isWarning = evt.status === 'WARNING';
                  const isFailed = evt.status === 'FAILED';
                  
                  return (
                    <tr key={evt.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-white/40 text-[10px]">#{evt.id}</td>
                      <td className="p-4 text-white/60 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-white/30" />
                          <span>{new Date(evt.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          evt.type === 'SECURITY' 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : evt.type === 'AUTH'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : evt.type === 'SUBSCRIPTION'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : evt.type === 'CREDITS'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : evt.type === 'ORCHESTRATOR'
                            ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                            : 'bg-white/5 text-white/60'
                        }`}>
                          {evt.type}
                        </span>
                      </td>
                      <td className="p-4 text-white font-extrabold whitespace-nowrap">
                        {evt.action}
                      </td>
                      <td className="p-4 text-white/70 max-w-xs break-words leading-relaxed">
                        {evt.details}
                      </td>
                      <td className="p-4 text-white/50 text-[11px] truncate max-w-[150px]" title={evt.userEmail}>
                        {evt.userEmail}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center gap-1 w-fit ${
                          isSuccess 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : isWarning 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-rose-400'}`} />
                          <span>{evt.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info card footer */}
      <div className="bg-neutral-900/20 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest flex items-center gap-1.5">
          <Lock size={12} className="text-aif-gold-DEFAULT" />
          <span>DSGVO-Verordnung & PII-Verschlüsselung aktiv</span>
        </span>
        <span className="text-[10px] text-white/30 font-mono">
          System logs are stored inside the encrypted <strong>system_events.json</strong> container pipeline.
        </span>
      </div>
    </div>
  );
}
