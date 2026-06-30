import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Shield, 
  Cpu, 
  Sparkles, 
  Code, 
  Check, 
  Download, 
  Copy, 
  Terminal, 
  Settings, 
  ArrowRight,
  TrendingUp,
  Search,
  BookOpen,
  Layers,
  Award,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrchestratorConfig {
  projectName: string;
  currency: string;
  database: string;
  focus: string;
  language: 'Deutsch' | 'English';
}

type PerspectiveId = 'ceo' | 'security' | 'qa' | 'code-quality' | 'content' | 'seo' | 'frontend' | 'backend';

interface Perspective {
  id: PerspectiveId;
  title: string;
  role: string;
  icon: any;
  color: string;
  description: string;
  stateOfTheArtTool: string;
}

export function MarkdownOrchestrator() {
  const [activeTab, setActiveTab] = useState<'info' | 'orchestrate' | 'templates'>('info');
  const [selectedPerspective, setSelectedPerspective] = useState<PerspectiveId>('ceo');
  const [config, setConfig] = useState<OrchestratorConfig>({
    projectName: 'Jenova Nexus (AIF-CORE)',
    currency: 'EUR',
    database: 'Supabase PostgreSQL',
    focus: 'Kryptowährungen & Quantitative Analysen',
    language: 'Deutsch'
  });

  const [generatedMarkdown, setGeneratedMarkdown] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);

  // Real local documentation state
  const [selectedRealDocPath, setSelectedRealDocPath] = useState<string>('DATENSCHUTZ_PROTOKOLL.md');
  const [realDocContent, setRealDocContent] = useState<string>('');
  const [realDocLoading, setRealDocLoading] = useState<boolean>(false);
  const [realDocError, setRealDocError] = useState<string | null>(null);
  const [copiedRealDoc, setCopiedRealDoc] = useState<boolean>(false);

  const fetchRealDocument = (docPath: string) => {
    setSelectedRealDocPath(docPath);
    setRealDocLoading(true);
    setRealDocError(null);
    
    fetch(`/api/docs-file?path=${docPath}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((errData) => {
            throw new Error(errData.error || `Fehler beim Laden von ${docPath}`);
          });
        }
        return res.json();
      })
      .then((data) => {
        setRealDocContent(data.content);
        setRealDocLoading(false);
      })
      .catch((err) => {
        console.warn('Error reading local doc:', err);
        setRealDocError(err.message || 'Die Datei konnte nicht geladen werden.');
        setRealDocLoading(false);
      });
  };

  // Automatically load the first document on tab selection
  useEffect(() => {
    if (activeTab === 'templates' && !realDocContent && !realDocLoading) {
      fetchRealDocument(selectedRealDocPath);
    }
  }, [activeTab]);

  const perspectives: Perspective[] = [
    {
      id: 'ceo',
      title: 'CEO & Business Strategy',
      role: 'Geschäftsführung / Visionär',
      icon: TrendingUp,
      color: 'from-amber-500 to-yellow-600',
      description: 'Zukunftssichere KPIs, strategische Marktvorteile, DSGVO-Wachstumsschranken und ROI-Maximierung.',
      stateOfTheArtTool: 'Quarto & Obsidian Publisher'
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      role: 'Sicherheitsarchitekt',
      icon: Shield,
      color: 'from-red-500 to-rose-600',
      description: 'OWASP Top 10 Absicherung, Schutz vertraulicher Algorithmen, Sandboxing und API-Proxying.',
      stateOfTheArtTool: 'GitLab Security Scan MD & Snyk'
    },
    {
      id: 'qa',
      title: 'QA & Test Plan',
      role: 'Test-Ingenieur',
      icon: Check,
      color: 'from-emerald-500 to-green-600',
      description: 'Szenarien für mathematische Präzision, Verifizierung von Fallback-Zuständen und UX-Touch-Vorgaben.',
      stateOfTheArtTool: 'Playwright Reporter & Jest MD'
    },
    {
      id: 'code-quality',
      title: 'Code Quality & Clean Code',
      role: 'Technical Lead',
      icon: Code,
      color: 'from-blue-500 to-indigo-600',
      description: 'Strict TypeScript-Regeln, modulares Splitting großer Hooks, und Performance-Budgets.',
      stateOfTheArtTool: 'ESLint MD Lint & SonarQube'
    },
    {
      id: 'content',
      title: 'Content Creator & Copy',
      role: 'Brand Manager',
      icon: Sparkles,
      color: 'from-fuchsia-500 to-purple-600',
      description: 'Disziplinierte Expert-Partner-Tonalität ohne Werbe-Hype, gesetzliche Risikoaufklärungen.',
      stateOfTheArtTool: 'Obsidian Canvas & Astro MDX'
    },
    {
      id: 'seo',
      title: 'SEO & Search Optimization',
      role: 'SEO-Analyst',
      icon: Search,
      color: 'from-cyan-500 to-teal-600',
      description: 'Semantische H-Struktur, schema.org Metadaten, Eliminierung externer Webfont-Lecks.',
      stateOfTheArtTool: 'Astro MDX Schema & Google Lighthouse'
    },
    {
      id: 'frontend',
      title: 'Frontend Architecture',
      role: 'UI/UX Developer',
      icon: Layers,
      color: 'from-indigo-500 to-violet-600',
      description: 'Responsive Bento-Grids, Touch-Sizing (>44px), CSS-Optimierung und performante Render-Hooks.',
      stateOfTheArtTool: 'Marp Slide Deck & Storybook MDX'
    },
    {
      id: 'backend',
      title: 'Backend Layer & API',
      role: 'Backend Developer',
      icon: Cpu,
      color: 'from-slate-500 to-neutral-600',
      description: 'Server-seitiges Caching (Prevention 429), Webhook raw-body-Ingestion, und Lazy-loading von Client-SDKs.',
      stateOfTheArtTool: 'Swagger / OpenAPI to Markdown'
    }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedMarkdown], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${config.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedPerspective}_report.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const runOrchestrate = () => {
    setIsCompiling(true);
    setTimeout(() => {
      const compiled = compileReport(selectedPerspective, config);
      setGeneratedMarkdown(compiled);
      setIsCompiling(false);
    }, 1200);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md space-y-6 text-white">
      
      {/* Header section with state-of-the-art metadata badges */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
            <BookOpen className="text-aif-gold-DEFAULT" size={24} />
            <span>Multi-Perspective Markdown Orchestrator</span>
          </h2>
          <p className="text-xs text-white/50 font-mono mt-1">
            State-of-the-Art Finanzreporte & Dokumentations-Engine für Code-Projekte
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-2.5 py-1 rounded bg-aif-gold-DEFAULT/15 border border-aif-gold-DEFAULT/30 text-aif-gold-DEFAULT text-[11px] font-mono uppercase tracking-wider font-extrabold">
            Modellunabhängig
          </span>
          <span className="px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono uppercase tracking-wider font-extrabold">
            MCP-Zentriert
          </span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10 p-1 bg-white/5 rounded-xl gap-2 max-w-md">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'info' ? 'bg-aif-gold-DEFAULT text-black font-black' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Stacks & Tech-Review
        </button>
        <button
          onClick={() => {
            setActiveTab('orchestrate');
            if (!generatedMarkdown) runOrchestrate();
          }}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'orchestrate' ? 'bg-aif-gold-DEFAULT text-black font-black' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Code-Orchestrator
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
            activeTab === 'templates' ? 'bg-aif-gold-DEFAULT text-black font-black' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          Pro-Berichte (Local Docs)
        </button>
      </div>

      {/* Content Rendering */}
      <AnimatePresence mode="wait">
        {activeTab === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Introductory Explanation on state-of-the-art stacks */}
            <div className="bg-gradient-to-r from-aif-gold-DEFAULT/5 to-transparent p-5 rounded-xl border border-white/5 space-y-4">
              <h3 className="text-sm font-bold uppercase text-aif-gold-DEFAULT font-mono tracking-widest">
                🚀 Markdown Stacks & Tools im Enterprise- & Finanzsektor
              </h3>
              <p className="text-xs text-white/80 leading-relaxed font-sans">
                Moderne Tech-Unternehmen und quantitative Finanzabteilungen schreiben Dokumente nicht mehr manuell in Word oder PowerPoint. Berichte werden direkt aus dem Code generiert (<strong>Documentation-as-Code</strong>), um mathematische Fehler zu eliminieren, Schnittstellenänderungen in Echtzeit abzubilden und gesetzliche EU-Compliance-Checks automatisiert zu durchlaufen.
              </p>
            </div>

            {/* Structured Tools Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono text-cyan-400">
                  <Terminal size={14} />
                  <span>Quarto Financial Engine</span>
                </div>
                <p className="text-[11px] text-white/60 leading-normal">
                  Kombiniert reines Markdown mit ausführbarem Python, R oder Julia Code. Perfekt für quantitative Analysten, um Monte-Carlo-Simulationen und historische Backtests in Echtzeit zu berechnen und pixelperfekte Finanzberichte als PDF oder interaktive Weboberflächen ohne Formatierungsaufwand zu rendern.
                </p>
              </div>

              <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono text-fuchsia-400">
                  <Sparkles size={14} />
                  <span>Marp - Markdown Slides</span>
                </div>
                <p className="text-[11px] text-white/60 leading-normal">
                  Erlaubt das Erstellen hochprofessioneller Foliensätze (Pitchdecks, Vorstandspräsentationen) direkt in VS Code auf rein deklarativer Textbasis. Durch CSS-Themes und HTML-Exporte wird die Präsentations-Formatierung vollständig vom Inhalt getrennt.
                </p>
              </div>

              <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono text-emerald-400">
                  <Code size={14} />
                  <span>Astro & MDX (Markdown-JSX)</span>
                </div>
                <p className="text-[11px] text-white/60 leading-normal">
                  Die modernste Wahl für interaktive Dashboards und Report-Webseiten (wie Stripe, Supabase). Ermöglicht die direkte Einbindung von hochleistungsfähigen React-Komponenten (Recharts-Diagrammen, interaktiven Graham-Formel-Reglern) direkt in statisch kompilierte Markdown-Inhalte.
                </p>
              </div>

              <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono text-amber-400">
                  <Layers size={14} />
                  <span>Pandoc + Weasyprint</span>
                </div>
                <p className="text-[11px] text-white/60 leading-normal">
                  Konvertiert Markdown-Dateien über CSS-Print-Medien in hochauflösende Druck-Berichte. Weit verbreitet im institutionellen Bankensektor für automatisierte MiFID-II-Berichterstattung, Daten-Audits und Kunden-Reportings.
                </p>
              </div>
            </div>

            {/* Visual benefit callout */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
              <Award className="text-emerald-400 shrink-0" size={20} />
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                  Entscheidungsvorteil im Finanzsektor
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed mt-1">
                  Durch Markdown-Automatisierung verringert sich die Zeitspanne zwischen Modellberechnung und Berichterstellung von Stunden auf Millisekunden. Analysten können Parameter verändern, der Orchestrator aktualisiert das mathematische Modell im Hintergrund und spuckt das finale, auditierbare PDF-Dokument sofort aus – fehlerfrei und ohne manuelle Copy-Paste-Schritte.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'orchestrate' && (
          <motion.div
            key="orchestrate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Configuration Column */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-aif-gold-DEFAULT font-mono flex items-center gap-1.5">
                  <Settings size={14} />
                  <span>Parameter Konfigurieren</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-white/75 uppercase font-mono block mb-1">Projektname</label>
                    <input 
                      type="text" 
                      value={config.projectName}
                      onChange={(e) => setConfig({...config, projectName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-aif-gold-DEFAULT"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-white/75 uppercase font-mono block mb-1">Währung</label>
                    <input 
                      type="text" 
                      value={config.currency}
                      onChange={(e) => setConfig({...config, currency: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-aif-gold-DEFAULT"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-white/75 uppercase font-mono block mb-1">Primäre Datenbank</label>
                    <input 
                      type="text" 
                      value={config.database}
                      onChange={(e) => setConfig({...config, database: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-aif-gold-DEFAULT"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-white/75 uppercase font-mono block mb-1">Analytischer Fokus</label>
                    <input 
                      type="text" 
                      value={config.focus}
                      onChange={(e) => setConfig({...config, focus: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-aif-gold-DEFAULT"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-white/75 uppercase font-mono block mb-1">Sprache</label>
                    <select
                      value={config.language}
                      onChange={(e) => setConfig({...config, language: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-aif-gold-DEFAULT"
                    >
                      <option value="Deutsch" className="bg-neutral-900">Deutsch</option>
                      <option value="English" className="bg-neutral-900">English</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={runOrchestrate}
                  disabled={isCompiling}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 text-black font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Cpu size={14} className={isCompiling ? "animate-spin" : ""} />
                  <span>{isCompiling ? "Generiere..." : "Report orchestrieren"}</span>
                </button>
              </div>

              {/* Perspective Selection */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 font-mono mb-2">
                  Rolle / Perspektive wählen
                </h3>
                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                  {perspectives.map((p) => {
                    const PIcon = p.icon;
                    const isSelected = selectedPerspective === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPerspective(p.id);
                          const compiled = compileReport(p.id, config);
                          setGeneratedMarkdown(compiled);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-3 transition-all ${
                          isSelected 
                            ? 'bg-white/10 border border-white/20 text-aif-gold-DEFAULT' 
                            : 'hover:bg-white/5 border border-transparent text-white/70 hover:text-white'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded bg-gradient-to-br ${p.color} flex items-center justify-center shrink-0`}>
                          <PIcon className="w-3.5 h-3.5 text-black" />
                        </div>
                        <div className="overflow-hidden leading-tight">
                          <div className="text-[11px] font-bold truncate">{p.title}</div>
                          <div className="text-[11px] font-mono text-white/70 truncate">{p.role}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Output Panel */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-black/50 border border-white/10 rounded-xl flex flex-col h-[520px] overflow-hidden">
                {/* Panel Actions Header */}
                <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[11px] font-mono text-white/80 ml-2 uppercase">
                      compiler_output_{selectedPerspective}.md
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/95 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono uppercase"
                      title="In Zwischenablage kopieren"
                    >
                      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                      <span>{copied ? "Kopiert!" : "Kopieren"}</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/95 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono uppercase"
                      title="Als Markdown-Datei herunterladen"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* Report Viewer */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-white/90 leading-relaxed space-y-2 select-text selection:bg-aif-gold-DEFAULT/40">
                  {isCompiling ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                      <div className="w-8 h-8 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin" />
                      <p className="text-[11px] uppercase tracking-widest text-white/70 animate-pulse">
                        Kompiliere {selectedPerspective.toUpperCase()} Markdown Core...
                      </p>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-mono text-[11px] bg-neutral-950/40 p-3 rounded-lg border border-white/5 select-text">
                      {generatedMarkdown}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Folder Layout Header Explanation */}
            <div className="bg-neutral-950/40 border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase text-aif-gold-DEFAULT font-mono tracking-widest flex items-center gap-2">
                <Terminal size={14} />
                <span>📂 Gerichtsfestes Compliance & Dokumentations-Center</span>
              </h3>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Unser System ist voll-auditierbar und konform zu den europäischen Datenschutzrichtlinien (**DSGVO**), dem TDDDG und dem Barrierefreiheitsgesetz (**BFSG**). Alle Dokumente liegen im sicheren Verzeichnis <code>/docs/</code> unseres Repositories und werden direkt in Echtzeit von dort eingelesen.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Document Navigation Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Section 1: Core Audits */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-aif-gold-DEFAULT font-mono mb-2 flex items-center gap-1.5">
                    <Shield size={12} />
                    <span>EU-Compliance & Audits</span>
                  </h4>
                  <div className="space-y-1">
                    {[
                      { path: 'DATENSCHUTZ_PROTOKOLL.md', label: 'DSGVO-Protokoll (Art. 30)', icon: Award },
                      { path: 'COMPLIANCE_REPORT.md', label: 'EU Compliance Bericht', icon: FileText },
                      { path: 'SECURITY_AUDIT.md', label: 'Security & OWASP Audit', icon: Shield },
                      { path: 'ARCHITECTURE_REVIEW.md', label: 'Systemarchitektur & Router', icon: Layers },
                    ].map((doc) => {
                      const Icon = doc.icon;
                      const isSelected = selectedRealDocPath === doc.path;
                      return (
                        <button
                          key={doc.path}
                          onClick={() => fetchRealDocument(doc.path)}
                          className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2.5 transition-all text-xs ${
                            isSelected 
                              ? 'bg-aif-gold-DEFAULT text-black font-black font-mono shadow-[0_0_10px_rgba(245,196,83,0.15)]' 
                              : 'bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon size={14} />
                          <span className="truncate">{doc.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Developer Perspective Guidelines */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50 font-mono mb-2 flex items-center gap-1.5">
                    <Code size={12} />
                    <span>Entwickler & Rollen-Guides</span>
                  </h4>
                  <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                    {[
                      { path: 'ceo/EXECUTIVE_SUMMARY.md', label: 'CEO Business & Vision', icon: TrendingUp },
                      { path: 'security/SECURITY_GUIDELINES.md', label: 'Developer Security Guide', icon: Shield },
                      { path: 'qa/TEST_PLAN_AND_QA.md', label: 'QA & Formel-Testplan', icon: Check },
                      { path: 'code-quality/CODE_QUALITY_STANDARDS.md', label: 'TypeScript Code Standards', icon: Code },
                      { path: 'content-creator/CONTENT_STRATEGY.md', label: 'Copywriting & Tonalität', icon: Sparkles },
                      { path: 'seo/SEO_CHECKLIST.md', label: 'SEO & Meta-Struktur', icon: Search },
                      { path: 'frontend/FRONTEND_ARCH.md', label: 'Frontend UI-Architecture', icon: Layers },
                      { path: 'backend/BACKEND_ARCH.md', label: 'Backend API & Caching', icon: Cpu },
                    ].map((doc) => {
                      const Icon = doc.icon;
                      const isSelected = selectedRealDocPath === doc.path;
                      return (
                        <button
                          key={doc.path}
                          onClick={() => fetchRealDocument(doc.path)}
                          className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2.5 transition-all text-xs ${
                            isSelected 
                              ? 'bg-aif-gold-DEFAULT text-black font-black font-mono shadow-[0_0_10px_rgba(245,196,83,0.15)]' 
                              : 'bg-white/5 border border-white/5 text-white/80 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon size={14} />
                          <span className="truncate">{doc.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Document Interactive Viewer */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-black/50 border border-white/10 rounded-xl flex flex-col h-[520px] overflow-hidden">
                  {/* Action Bar */}
                  <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                        git_local://docs/{selectedRealDocPath}
                      </span>
                    </div>

                    {!realDocLoading && !realDocError && realDocContent && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(realDocContent);
                            setCopiedRealDoc(true);
                            setTimeout(() => setCopiedRealDoc(false), 2000);
                          }}
                          className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/80 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono uppercase"
                        >
                          {copiedRealDoc ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                          <span>{copiedRealDoc ? 'Kopiert!' : 'Kopieren'}</span>
                        </button>
                        <button
                          onClick={() => {
                            const el = document.createElement("a");
                            const file = new Blob([realDocContent], { type: 'text/plain' });
                            el.href = URL.createObjectURL(file);
                            el.download = selectedRealDocPath.split('/').pop() || 'doc.md';
                            document.body.appendChild(el);
                            el.click();
                            document.body.removeChild(el);
                          }}
                          className="p-1.5 rounded bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/80 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono uppercase"
                        >
                          <Download size={12} />
                          <span>Herunterladen</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Viewer Content Area */}
                  <div className="flex-1 overflow-auto p-4 font-mono text-[11px] text-white/90 leading-relaxed bg-neutral-950/20 select-text selection:bg-aif-gold-DEFAULT/40">
                    {realDocLoading ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <div className="w-8 h-8 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] uppercase tracking-widest text-white/40 animate-pulse font-mono">
                          Lese Datei aus Repository-Zweig...
                        </p>
                      </div>
                    ) : realDocError ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-2 text-rose-400 max-w-md mx-auto text-center p-6 bg-rose-500/5 rounded-xl border border-rose-500/10">
                        <Shield size={24} className="text-rose-500" />
                        <p className="font-bold text-xs uppercase tracking-wide">Ladefehler</p>
                        <p className="text-[10px] text-white/60 font-sans leading-normal">{realDocError}</p>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap select-text leading-relaxed p-2 font-mono">
                        {realDocContent || 'Wählen Sie links ein Dokument aus, um die Echtzeit-Fassung zu lesen.'}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Highly programmatic Markdown compiler engine based on user configurations and strict perspective layers
function compileReport(perspective: PerspectiveId, config: OrchestratorConfig): string {
  const dateStr = new Date().toLocaleDateString(config.language === 'Deutsch' ? 'de-DE' : 'en-US');
  const currencySymbol = config.currency === 'USD' ? '$' : config.currency === 'EUR' ? '€' : config.currency;

  if (config.language === 'Deutsch') {
    switch (perspective) {
      case 'ceo':
        return `# 👔 Executive Summary & Strategischer Fahrplan
**Projekt**: ${config.projectName}
**Fokusbereich**: ${config.focus}
**Datum**: ${dateStr}
**Status**: Freigegeben für Vorstandspräsentationen

---

## 🎯 Strategische Vision & Zielsetzungen
Als Geschäftsführer von **${config.projectName}** ist es unser primäres Ziel, die anspruchsvollsten Berechnungsalgorithmen im Bereich **${config.focus}** ohne Code-Barrieren und unter voller Einhaltung europäischer Richtlinien bereitzustellen.

### Strategische Eckpfeiler:
1. **Modell-Unabhängigkeit**: Keine Bindung an einzelne LLM-Anbieter. Unsere KI-Routing-Engine wählt das optimale Modell nach Latenz und Kosten.
2. **Datenschutz**: Datenverarbeitung unter vollständiger DSGVO-Konformität (Art. 5-9) mit optionalen lokalen Fallbacks.
3. **No-Demo-Data Mandat**: Vollständiger Verzicht auf unzuverlässige Pseudo-Datenreihen. Alle Werte beruhen auf realen Datenreihen (Währung in **${config.currency}**).

---

## 📊 Marktvorteil (Strategic Moat)
In einem volatilen Umfeld verschafft uns das modell-unabhängige, latenzoptimierte Routing (<150ms) einen signifikanten Wettbewerbsvorteil. Durch das server-seitige Caching werden externe 429-Zustände vermieden, was die Systemzuverlässigkeit von 94% auf **99.9%** erhöht.

---

## 🛣️ Zukünftige Investitions-Phasen

\`\`\`
Phase 1 (Fundament) 🚀        ->  Phase 2 (Skalierung) 🌐   -> Phase 3 (Automatisierung) 💎
- Modell-Router optimiert        - Plugin-Registrierungen        - Voll-autonome Trading-Agenten
- Primärdatenbank: ${config.database} - Multi-API Anbindungen         - Broker-Direktanbindungen
\`\`\``;

      case 'security':
        return `# 🔒 Sicherheits-Audit & Compliance-Richtlinien
**Projekt**: ${config.projectName}
**Klassifizierung**: Vertraulich (CEO / CTO / Security Lead)
**Prüfungsdatum**: ${dateStr}

---

## 🛡️ Sicherheitsarchitektur und Bedrohungsanalyse
Wir verfolgen für das Projekt **${config.projectName}** einen "Secure-by-Default" Ansatz nach den strengen Vorgaben der OWASP Top 10 sowie der EU-DSGVO.

### Kritische Absicherungen:
1. **Vollständige Secret-Isolation**: Private Keys (z.B. für Stripe, Gemini, Datenbanken) verbleiben ausschließlich im Backend.
2. **Datenbank-Autorisierung**: Das System nutzt ${config.database} mit integrierten row-level Sicherheitsüberprüfungen.
3. **Stripe-Webhook Validierung**: Ingestierung der raw-body Rohdaten zur Verifizierung der kryptografischen Stripe-Signaturen.

---

## 🛠️ Handlungsanweisungen für Entwickler
* **Keine Frontend-Secrets**: Variablen ohne das \`VITE_\`-Präfix deklarieren und ausschließlich im server-seitigen Node-Umfeld ausführen.
* **CORS-Medienbeschränkungen**: Keine Wildcard-Berechtigungen (\`*\`) im CORS-Header für die REST-Schnittstellen zulassen.
* **Fehler-Verschleierung**: Stack-Traces werden intern protokolliert, aber niemals an den Client gesendet.`;

      case 'qa':
        return `# 🧪 Test-Szenarien & Qualitätssicherung
**Projekt**: ${config.projectName}
**QA Lead**: System Orchestrator
**Datum**: ${dateStr}

---

## 🎯 Testabdeckung & Methodik
Für **${config.projectName}** ist eine stabile, fehlerfreie mathematische Kalkulation im Bereich **${config.focus}** geschäftskritisch.

### Haupt-Testbereiche:
1. **Mathematische Formeltests**:
   * Graham-Formel: Überprüfung auf NaN-Zustände und negative EPS-Grenzbereiche.
   * Monte-Carlo: Überprüfung der geometrischen Standardabweichung auf statistische Plausibilität.
2. **Netzwerk-Resilienz (No-Demo-Data Policy)**:
   * Simulation von API-Grenzfällen (HTTP 429 Rate Limits der Ingestierungs-Schnittstellen).
   * Verifizierung des automatischen Umschaltens auf den server-seitigen Cache von ${config.database}.

---

## 📋 QA Checkliste vor jedem Deployment:
- [ ] **React Hook Stabilität**: Keine Zustandsänderungen direkt im Render-Body (Verhinderung von Endlosschleifen).
- [ ] **Touch Target Check**: Hit-Targets für Bedienelemente haben mindestens eine Größe von **44x44px** (BFSG/Barrierefreiheit).
- [ ] **Type Guarding**: Dynamische JSON-Feeds vor dem Mapping mittels \`Array.isArray(data)\` absichern.`;

      case 'code-quality':
        return `# 💻 Codequalität & Clean Code Standards
**Projekt**: ${config.projectName}
**Language**: TypeScript (Strict Mode)
**Datum**: ${dateStr}

---

## 📐 Kernrichtlinien für saubere Codebases
Eine nachhaltige Softwarearchitektur für **${config.projectName}** setzt strikte Typisierung und modulare File-Strukturen voraus.

### Strikte Entwicklungsregeln:
1. **Kein 'any'-Typing**: Verwende Interfaces für sämtliche Datenstrukturen der Währung ${config.currency}.
2. **Module Splitting**: Dateien dürfen **500 Zeilen** nicht überschreiten. Hooks, Types und Sub-Komponenten sind sauber in separate Quelldateien auszulagern.
3. **Sichere Hook-Abhängigkeiten**: In \`useEffect\`-Abhängigkeiten dürfen nur primitive Typen (Strings, Numbers, Booleans) definiert werden, um speicherfressende Re-Renders zu eliminieren.

---

## 📊 Performance-Vorgaben:
* **Serverless Kaltstarts**: Unter **1.5 Sekunden** (ermöglicht durch Lazy-loading der DB-Verbindungen von ${config.database}).
* **Lighthouse Score**: Zielwert für Performance und Barrierefreiheit liegt bei **> 90 Punkten**.`;

      case 'content':
        return `# ✍️ Brand Persona & Content-Strategie
**Projekt**: ${config.projectName}
**Brand Voice**: Expert Partner (Sachlich & Präzise)
**Datum**: ${dateStr}

---

## 🎭 Marken-Tonalität
Innerhalb des Projekts **${config.projectName}** treten wir als verlässlicher, wissenschaftlicher Partner auf.

* **Wir verwenden**: Eine sachliche, präzise und datengetriebene Sprache im Bereich **${config.focus}**.
* **Wir meiden**: Reißerische Marketing-Phrasen, unrealistische Rendite-Versprechungen oder unvollständige Modellberechnungen.

---

## 📋 Copy-Vorgaben für den Finanzsektor (BaFin/MiFID II)
Jede quantitative Darstellung von Marktdaten muss mit dem standardisierten Disclaimer versehen werden:

> **HINWEIS**: Keine Anlageberatung. Die gezeigten Daten stellen ausschließlich quantitative Berechnungen dar. Die endgültige Anlageentscheidung liegt beim Nutzer. Währungsausgaben erfolgen standardisiert in **${config.currency}**.`;

      case 'seo':
        return `# 🔍 SEO Optimierung & Technische Sichtbarkeit
**Projekt**: ${config.projectName}
**Keyword-Fokus**: ${config.focus}
**Datum**: ${dateStr}

---

## 🎯 Suchmaschinen-Optimierungsplan
Das System wird auf maximale Crawlbarkeit und blitzschnelle Ladezeiten (Core Web Vitals) optimiert, um bei Suchmaschinen Top-Positionen zu besetzen.

### SEO-Eckpfeiler:
1. **Semantische HTML-Struktur**: Strict Single \`<h1>\`-Tag pro Ansicht, gefolgt von hierarchisch verschachtelten \`<h2>\` und \`<h3>\`-Überschriften.
2. **Asset Lokalisierung**: Keine externen CDN-Aufrufe (z.B. für Google Fonts), um DSGVO-Mahnungen zu vermeiden und Ladezeiten auf mobilen Geräten drastisch zu verringern.
3. **Strukturierte Daten (JSON-LD)**: Schema-Markup zur Kennzeichnung von Rechnern (Benjamin Graham / Monte Carlo) zur Erzielung von Rich-Snippets in Suchergebnissen.`;

      case 'frontend':
        return `# 🎨 Frontend-Architektur & Design-System
**Projekt**: ${config.projectName}
**UI-Tech-Stack**: React 18 / Tailwind CSS / Motion
**Datum**: ${dateStr}

---

## 📐 UI/UX Gestaltungsrichtlinien
Das Interface von **${config.projectName}** basiert auf einem hochmodernen, flüssigen "Cyber Slate" Dark Theme mit Glassmorphism-Elementen.

### Visuelle Kernkonzepte:
1. **Akkurate Kontraste**: Strahlend weißer Text auf tiefschwarzem Untergrund (\`bg-black\`), akzentuiert durch cyber-grüne Status-Badges und goldene Highlights.
2. **Fluidität**: Einbindung der \`motion\`-Bibliothek für flüssige, hardwarebeschleunigte Page-Transitions und Navigations-Drawers.
3. **Bento-Grid Layouts**: Strukturierte Aufteilung von Charts (Recharts/D3) und Formularen in adaptive, anpassbare Kacheln.`;

      case 'backend':
        return `# ⚙️ Backend-Architektur & API Spezifikationen
**Projekt**: ${config.projectName}
**Architektur**: Express / Node.js
**Datum**: ${dateStr}

---

## 🗺️ Systemarchitektur & API-Design
Das Backend von **${config.projectName}** fungiert als sicherer Daten-Proxy und verwaltet die Anbindung der Datenbank **${config.database}**.

### Sicherheits- & Performance-Dienste:
1. **Server-seitiges Ingest-Caching**: Umgehung von 429-Fehlern durch intelligentes 60-Sekunden Caching und Request-Coalescing bei zeitgleichen Client-Anfragen.
2. **Stripe Webhook raw-body Ingestion**: Gewährleistet unmodifizierte Puffer-Auslesungen zur Signaturüberprüfung vor der globalen JSON-Verarbeitung.
3. **Lazy-loading von Drittanbieter-SDKs**: Instanziierung von Client-Verbindungen erst bei tatsächlicher API-Verwendung zur Eliminierung von Startverzögerungen.`;
    }
  } else {
    // English Version Fallback
    switch (perspective) {
      case 'ceo':
        return `# 👔 Executive Summary & Strategic Roadmap
**Project**: ${config.projectName}
**Core Focus**: ${config.focus}
**Date**: ${dateStr}
**Status**: Approved for Board Presentation

---

## 🎯 Vision & Business Drivers
Under the leadership of **${config.projectName}**, our primary mission is to democratize institutional-grade financial intelligence in the field of **${config.focus}** under strict regulatory compliance.

### Strategic Goals:
1. **Model Independence**: Elimination of third-party vendor lock-in. Our router dispatches tasks dynamically based on costs and latencies.
2. **Privacy First**: High-fidelity DSGVO compliance (Art. 5-9) via state-of-the-art secure routing.
3. **No-Demo-Data Mandate**: All calculations leverage real, live data feeds with fallback caches on ${config.database}. Output currency is standard ${config.currency}.`;

      case 'security':
        return `# 🔒 Security Audit & Compliance Matrix
**Project**: ${config.projectName}
**Classification**: Confidential / Internal
**Date**: ${dateStr}

---

## 🛡️ Threat Assessment & Prevention
We enforce a secure-by-default environment for **${config.projectName}** following OWASP Top 10 guidelines.

### Mandatory Mitigations:
1. **Absolute Secret Isolation**: Private keys (Stripe, Gemini, DB) reside solely within the server memory boundary.
2. **Secure Database Layer**: Utilizing ${config.database} with strict row-level security.
3. **Raw Webhook Parsing**: Ensuring unaltered buffer inputs for checkout signature verifications.`;

      default:
        return `# 📝 Technical Documentation Perspective: ${perspective.toUpperCase()}
**Project**: ${config.projectName}
**Date**: ${dateStr}
**Database**: ${config.database}
**Focus**: ${config.focus}

This report was compiled dynamically under the **AIF-CORE Markdown Orchestrator** framework. It implements state-of-the-art formatting guidelines, strict module splitting, and programmatic data alignment (Currency: ${currencySymbol}).`;
    }
  }
}
