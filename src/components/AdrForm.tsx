import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  X,
  FileText,
  Info,
  HelpCircle,
  Eye,
  Code,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import Markdown from 'react-markdown';

interface AdrFormProps {
  initialData?: {
    id: string;
    title: string;
    status: string;
    date: string;
    author: string;
    context: string;
    decision: string;
    consequences: string;
  };
  onSubmit: (data: {
    id: string;
    title: string;
    status: string;
    date: string;
    author: string;
    context: string;
    decision: string;
    consequences: string;
  }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode: 'create' | 'edit';
}

const TEMPLATES = [
  {
    name: 'Standard-Architekturvorlage (Leer)',
    icon: FileText,
    description: 'Eine leere Standard-Struktur nach dem Nygard-Schema.',
    context: 'Im Rahmen des Aufbaus der CAPITAL-AI Plattform (v0.5.4) stehen wir vor der Herausforderung, [Problem/Herausforderung einfügen] zu implementieren. Die aktuellen Rahmenbedingungen erfordern eine Entscheidung bezüglich...',
    decision: 'Wir entscheiden uns dafür, [die gewählte Lösung einfügen], weil dies die folgenden Vorteile bietet:\n- \n- \n\nFolgende Alternativen wurden evaluiert und aus folgenden Gründen verworfen:\n- Alternative A: ...',
    consequences: 'Durch diesen Entscheid ergeben sich folgende Konsequenzen:\n- Positiv: ...\n- Negativ / Risiken: ...\n- Nächste Schritte: ...'
  },
  {
    name: 'Datenbank & Persistenz (Firestore vs. Relational SQL)',
    icon: Sparkles,
    description: 'Für Entscheidungen bezüglich Datenbanktyp, Datensynchronisation und Indizes.',
    context: 'Für die dauerhafte Speicherung von Benutzerkonfigurationen, historischen Portfolios und Revisionsprotokollen ist eine hochverfügbare, latenzarme Persistenzschicht erforderlich. Es muss entschieden werden, ob Firestore (NoSQL mit Echtzeitsynchronisation) oder Cloud SQL (PostgreSQL für relationale Konsistenz) verwendet wird.',
    decision: 'Wir entscheiden uns für die Verwendung von Google Cloud Firestore als primäre NoSQL-Datenbank für dynamische Benutzerprofile und Dokumenten-Hygiene, während kritische relationale Scoring-Pipelines optional über Cloud SQL PostgreSQL angebunden werden können. Firestore wird gewählt, weil:\n- Es out-of-the-box Echtzeit-Updates für das User Interface bereitstellt.\n- Die schemalose Struktur schnelle Iterationen in der Beta-Phase (v0.5.4) zulässt.\n- Es über eingebaute Offline-Persistenz im Web-SDK verfügt.',
    consequences: 'Konsequenzen:\n- Positiv: Extrem niedrige Time-to-Market, minimale DevOps-Kosten und automatische Skalierung.\n- Negativ: Komplexe relationale Abfragen und aggregierte Finanzstatistiken müssen clientseitig oder über isolierte Cloud Functions aggregiert werden.\n- Risiken: Datenintegrität muss durch strenge Firestore Security Rules abgesichert werden.'
  },
  {
    name: 'Sicherheits- & API-Key-Schnittstellen (Credentials Protection)',
    icon: BookOpen,
    description: 'Für die Anbindung von Drittanbieter-APIs (Stripe, Alpha Vantage, Binance).',
    context: 'Zur Bereitstellung von Live-Marktdaten und Zahlungsabwicklungen müssen wir externe APIs anbinden. Die genutzten API-Keys (z.B. Stripe Secret, Alpha Vantage Key) dürfen niemals im Browser exponiert werden, um Missbrauch zu verhindern.',
    decision: 'Wir legen fest, dass alle API-Anfragen an Drittanbieter ausschließlich serverseitig in der `server.ts` über dedizierte Express-Schnittstellen (`/api/*`) ausgeführt werden. \n- Der Client fragt niemals externe APIs direkt mit Geheimnissen an.\n- Alle API-Schlüssel werden ausschließlich über Umgebungsvariablen (`process.env`) auf Cloud Run geladen.\n- Im Browser werden nur maskierte oder öffentlich unbedenkliche Endpunkte zur Verfügung gestellt.',
    consequences: 'Konsequenzen:\n- Positiv: 100% Schutz der Firmen-Geheimnisse vor XSS und Reverse Engineering.\n- Negativ: Zusätzlicher Routing-Overhead auf dem Express-Server und Implementierungsaufwand für Proxy-Endpunkte.\n- Nächste Schritte: Deklaration aller erforderlichen Variablen in der `.env.example` Datei.'
  },
  {
    name: 'Microservices, Routing & Reverse-Proxy (Nginx / Ingress)',
    icon: ArrowRight,
    description: 'Für Routing, Portkonfigurationen (Port 3000) und Container-Bedingungen.',
    context: 'Die Plattform läuft in einer isolierten Docker-Umgebung auf Cloud Run hinter einem Nginx-Reverse-Proxy. Alle externen Anfragen werden über Port 3000 geroutet. Es muss sichergestellt werden, dass die lokale Entwicklung und der Produktions-Build exakt dieselben Port-Bedingungen widerspiegeln.',
    decision: 'Wir konfigurieren alle Dev-Server und Express-Schnittstellen so, dass sie fest an Port `3000` auf Host `0.0.0.0` binden. Externe HMR-Dienste (Hot Module Replacement) werden deaktiviert (`DISABLE_HMR=true`), um Build-Flackern und Websocket-Fehlverbindungen im iFrame zu unterbinden. Die statischen Assets werden im Produktionsmodus direkt von Express aus dem `/dist` Verzeichnis ausgeliefert.',
    consequences: 'Konsequenzen:\n- Positiv: Nahtlose Ingress-Routing-Kompatibilität und keine Port-Konflikte im Cloud Run Container.\n- Negativ: Clientseitige Codeänderungen erfordern einen manuellen Refresh im Entwicklungsmodus, da HMR deaktiviert ist.\n- Nächste Schritte: Überprüfung aller `package.json` Skripte auf korrekte Bindung.'
  }
];

export function AdrForm({ initialData, onSubmit, onCancel, isSubmitting = false, mode }: AdrFormProps) {
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStatus, setFormStatus] = useState('PROPOSED');
  const [formDate, setFormDate] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formContext, setFormContext] = useState('');
  const [formDecision, setFormDecision] = useState('');
  const [formConsequences, setFormConsequences] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showHelp, setShowHelp] = useState<string | null>(null);

  // Initialize fields
  useEffect(() => {
    if (initialData) {
      setFormId(initialData.id);
      setFormTitle(initialData.title);
      setFormStatus(initialData.status);
      setFormDate(initialData.date);
      setFormAuthor(initialData.author);
      setFormContext(initialData.context);
      setFormDecision(initialData.decision);
      setFormConsequences(initialData.consequences);
    } else {
      // Create defaults
      const nextId = 'ADR-0004';
      const today = new Date().toISOString().split('T')[0];
      setFormId(nextId);
      setFormDate(today);
      setFormAuthor('Developer Team');
      
      // Load standard template
      setFormContext(TEMPLATES[0].context);
      setFormDecision(TEMPLATES[0].decision);
      setFormConsequences(TEMPLATES[0].consequences);
    }
  }, [initialData]);

  // Handle template selection
  const handleApplyTemplate = (tpl: typeof TEMPLATES[0]) => {
    if (window.confirm('Möchten Sie diese Vorlage anwenden? Der aktuelle Text in Kontext, Entscheidung und Konsequenzen wird überschrieben.')) {
      setFormContext(tpl.context);
      setFormDecision(tpl.decision);
      setFormConsequences(tpl.consequences);
    }
  };

  // Build markdown string for preview
  const getMarkdownContent = () => {
    return `# ${formId}: ${formTitle || 'Ohne Titel'}

**Status:** ${formStatus}
**Datum:** ${formDate || 'Nicht definiert'}
**Autor:** ${formAuthor || 'Nicht definiert'}

## 1. Kontext (Hintergrund)
${formContext || '*Kein Kontext definiert.*'}

## 2. Entscheidung
${formDecision || '*Keine Entscheidung definiert.*'}

## 3. Konsequenzen & Auswirkungen
${formConsequences || '*Keine Konsequenzen definiert.*'}

---
*Generiert am ${new Date().toLocaleDateString('de-DE')} via CAPITAL-AI ADR-Manager v0.5.4.*`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim()) return;
    if (!formTitle.trim()) return;
    if (!formDate.trim()) return;
    if (!formAuthor.trim()) return;

    onSubmit({
      id: formId.trim().toUpperCase(),
      title: formTitle.trim(),
      status: formStatus,
      date: formDate,
      author: formAuthor.trim(),
      context: formContext.trim(),
      decision: formDecision.trim(),
      consequences: formConsequences.trim(),
    });
  };

  return (
    <div className="bg-[#121215]/90 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl relative">
      
      {/* Form Header */}
      <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT text-[9px] font-mono font-bold uppercase tracking-wider border border-aif-gold-DEFAULT/20">
              {mode === 'create' ? 'Neues ADR-Dokument' : 'ADR Bearbeiten'}
            </span>
            <span className="text-[10px] text-white/40 font-mono">v0.5.4 Standards</span>
          </div>
          <h3 className="text-sm font-black font-mono text-white tracking-wide uppercase">
            {mode === 'create' ? 'Architektur-Entscheid entwerfen' : `Revisionsdokument ${formId}`}
          </h3>
        </div>

        {/* Tab switcher: Edit / Preview */}
        <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Code size={11} />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white/80'
            }`}
          >
            <Eye size={11} />
            <span>Live-Vorschau</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <AnimatePresence mode="wait">
          {activeTab === 'edit' ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-5"
            >
              {/* Template quick choice section (Only in create mode or as helper) */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                <span className="text-[9px] font-mono text-white/40 uppercase block font-black tracking-wider">
                  Schnell-Architekturvorlagen (Nygard Schema):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TEMPLATES.map((tpl, i) => {
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="p-2.5 bg-black/30 border border-white/5 hover:border-aif-gold-DEFAULT/30 rounded-xl text-left transition-all hover:bg-black/50 group flex items-start gap-2.5 cursor-pointer"
                      >
                        <div className="p-1.5 bg-white/5 group-hover:bg-aif-gold-DEFAULT/10 rounded-lg text-white/60 group-hover:text-aif-gold-DEFAULT transition-all shrink-0 mt-0.5">
                          <Icon size={12} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-white font-mono group-hover:text-aif-gold-DEFAULT transition-all leading-snug">
                            {tpl.name}
                          </p>
                          <p className="text-[9px] text-white/40 leading-snug font-sans truncate max-w-[200px]">
                            {tpl.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* ID & Status Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[9px] font-mono text-white/45 uppercase font-bold flex items-center gap-1">
                        <span>Referenz-ID</span>
                        <span className="text-rose-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowHelp(showHelp === 'id' ? null : 'id')}
                        className="text-white/30 hover:text-white transition-all"
                      >
                        <HelpCircle size={10} />
                      </button>
                    </div>
                    {showHelp === 'id' && (
                      <p className="text-[9px] text-cyan-400 font-mono bg-black/30 p-2 rounded border border-white/5">
                        Format: ADR-[Zahl]. Z.B. ADR-0004. Definiert die Dateisortierung im Verzeichnis docs/adr/.
                      </p>
                    )}
                    <input
                      type="text"
                      value={formId}
                      onChange={(e) => setFormId(e.target.value.toUpperCase())}
                      placeholder="ADR-0004"
                      disabled={mode === 'edit'}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-aif-gold-DEFAULT outline-none font-mono text-xs disabled:opacity-50"
                      required
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-mono text-white/45 uppercase font-bold flex items-center gap-1">
                      <span>Entscheidungs-Status</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-aif-gold-DEFAULT outline-none font-mono text-xs"
                    >
                      <option value="PROPOSED">PROPOSED (Vorgeschlagen)</option>
                      <option value="ACCEPTED">ACCEPTED (Akzeptiert)</option>
                      <option value="REJECTED">REJECTED (Abgelehnt)</option>
                      <option value="DEPRECATED">DEPRECATED (Veraltet)</option>
                      <option value="SUPERSEDED">SUPERSEDED (Ersetzt / Abgelöst)</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1 text-left">
                  <label className="text-[9px] font-mono text-white/45 uppercase font-bold flex items-center gap-1">
                    <span>Titel des Entscheids</span>
                    <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="z.B. Einführung der dezentralen AI Multi-Routing Engine"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-aif-gold-DEFAULT outline-none text-xs"
                    required
                  />
                </div>

                {/* Date & Author */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-mono text-white/45 uppercase font-bold flex items-center gap-1">
                      <span>Entscheidungsdatum</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-aif-gold-DEFAULT outline-none font-mono text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-mono text-white/45 uppercase font-bold flex items-center gap-1">
                      <span>Verfasser / Autor</span>
                      <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      placeholder="z.B. Sven Kulessa / Dev-Team"
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-aif-gold-DEFAULT outline-none text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Context */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-mono text-white/45 uppercase font-bold">
                      1. Kontext &amp; Problemstellung
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHelp(showHelp === 'context' ? null : 'context')}
                      className="text-white/30 hover:text-white transition-all flex items-center gap-1 text-[8px] font-mono uppercase"
                    >
                      <span>Ausfüllhilfe</span>
                      <HelpCircle size={9} />
                    </button>
                  </div>
                  {showHelp === 'context' && (
                    <div className="text-[10px] text-cyan-400 font-sans bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-xl leading-relaxed space-y-1">
                      <p className="font-bold uppercase font-mono text-[8px] text-cyan-300">Was gehört hierhin?</p>
                      <p>Erklären Sie den Hintergrund der Entscheidung. Welches Problem wird gelöst? Welche Randbedingungen (z.B. Latenz, Kosten, Datenschutz) schränken die Architektur ein? Verwenden Sie gerne Listen.</p>
                    </div>
                  )}
                  <textarea
                    value={formContext}
                    onChange={(e) => setFormContext(e.target.value)}
                    placeholder="Beschreiben Sie das architektonische Umfeld und das genaue Problem..."
                    className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-aif-gold-DEFAULT outline-none font-sans text-xs resize-y"
                  />
                </div>

                {/* Decision */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-mono text-white/45 uppercase font-bold">
                      2. Getroffene Entscheidung
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHelp(showHelp === 'decision' ? null : 'decision')}
                      className="text-white/30 hover:text-white transition-all flex items-center gap-1 text-[8px] font-mono uppercase"
                    >
                      <span>Ausfüllhilfe</span>
                      <HelpCircle size={9} />
                    </button>
                  </div>
                  {showHelp === 'decision' && (
                    <div className="text-[10px] text-cyan-400 font-sans bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-xl leading-relaxed space-y-1">
                      <p className="font-bold uppercase font-mono text-[8px] text-cyan-300">Was gehört hierhin?</p>
                      <p>Die gewählte Option im Aktiv formuliert (z.B. "Wir verwenden Firestore..." statt "Es wurde entschieden"). Begründen Sie, warum diese Alternative gewählt wurde und warum andere weggelassen wurden.</p>
                    </div>
                  )}
                  <textarea
                    value={formDecision}
                    onChange={(e) => setFormDecision(e.target.value)}
                    placeholder="Beschreiben Sie die gewählte Architektur-Lösung und verworfene Alternativen..."
                    className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-aif-gold-DEFAULT outline-none font-sans text-xs resize-y"
                  />
                </div>

                {/* Consequences */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-mono text-white/45 uppercase font-bold">
                      3. Konsequenzen &amp; Trade-Offs
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowHelp(showHelp === 'consequences' ? null : 'consequences')}
                      className="text-white/30 hover:text-white transition-all flex items-center gap-1 text-[8px] font-mono uppercase"
                    >
                      <span>Ausfüllhilfe</span>
                      <HelpCircle size={9} />
                    </button>
                  </div>
                  {showHelp === 'consequences' && (
                    <div className="text-[10px] text-cyan-400 font-sans bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-xl leading-relaxed space-y-1">
                      <p className="font-bold uppercase font-mono text-[8px] text-cyan-300">Was gehört hierhin?</p>
                      <p>Jede Entscheidung hat Konsequenzen. Was wird nach diesem Entscheid einfacher? Was wird schwieriger oder erfordert zusätzliche Sicherheitsvorkehrungen? (z.B. "Die Datensicherheit steigt, aber wir haben 10ms mehr Overhead").</p>
                    </div>
                  )}
                  <textarea
                    value={formConsequences}
                    onChange={(e) => setFormConsequences(e.target.value)}
                    placeholder="Erläutern Sie die positiven und negativen Trade-Offs nach Einführung dieser Änderung..."
                    className="w-full h-32 bg-black/60 border border-white/10 rounded-xl p-3 text-white focus:border-aif-gold-DEFAULT outline-none font-sans text-xs resize-y"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/5">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-aif-gold-DEFAULT hover:bg-aif-gold-light disabled:opacity-50 text-black font-mono font-bold text-xs uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>{isSubmitting ? 'Wird gespeichert...' : 'ADR Dokument Speichern & Commit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-white/5"
                  >
                    <span>Abbrechen</span>
                  </button>
                </div>

              </form>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4 text-left"
            >
              <div className="bg-[#17171C] border border-white/10 rounded-2xl p-6 shadow-inner relative overflow-hidden select-text">
                <div className="absolute top-3 right-3 select-none">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/40 text-[8px] font-mono font-bold uppercase">
                    Markdown-Vorschau
                  </span>
                </div>
                
                <div className="markdown-body prose prose-invert max-w-none text-white/90 text-xs leading-relaxed font-sans space-y-4">
                  <Markdown>{getMarkdownContent()}</Markdown>
                </div>
              </div>

              {/* Guide card */}
              <div className="flex gap-3 bg-cyan-950/15 border border-cyan-500/10 p-4 rounded-xl text-xs text-cyan-400">
                <Info size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1 leading-relaxed">
                  <span className="font-bold uppercase font-mono text-[9px] text-cyan-300">Dateisystem-Persistenz:</span>
                  <p>
                    Nach dem Speichern wird dieses Revisionsdokument automatisch als standardisierte Datei <code>docs/adr/{formId.toLowerCase()}.md</code> im Dateisystem hinterlegt. Der Scanner indiziert den Eintrag unmittelbar für das Revisionslog.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
