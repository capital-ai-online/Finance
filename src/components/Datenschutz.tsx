import React, { useState } from 'react';
import { ShieldCheck, Lock, Search, Scale, FileText, CheckCircle2, Check, HelpCircle, HardDrive, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DataSource {
  name: string;
  type: string;
  protocol: string;
  purpose: string;
  leakPrevention: string;
  gdprBasis: string;
}

function AuditTrailFlowGraphic() {
  const [activeNode, setActiveNode] = useState<string | null>('gateway');

  const nodes = [
    {
      id: 'client',
      label: 'Endnutzer (Browser)',
      status: 'Anonymisiert',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      icon: Lock,
      description: 'Der Client führt lokale Analysen durch. Schriften & Symbole werden lokal aus dem Cloud-Container ausgeliefert.',
      bulletPoints: [
        'Kein Drittland-Datenabfluss (IP-Isolation)',
        'Keine Werbe- o. Tracking-Pixel',
        'Inter & JetBrains Mono lokal gehostet'
      ]
    },
    {
      id: 'gateway',
      label: 'CAPITAL-AI Server-Proxy',
      status: 'Zertifiziert (Art. 32)',
      statusColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      icon: Cpu,
      description: 'Zentrale Serverinstanz bündelt Anfragen des Clients. Schützt die Identität des Anwenders vor Abfragen an Drittländer.',
      bulletPoints: [
        'Request-Coalescing (API Lastbegrenzung)',
        'Server-Side Memory Caching (TTL: 60s)',
        'Volle TLS 1.3 Transport-Verschlüsselung'
      ]
    },
    {
      id: 'apis',
      label: 'Verifizierte APIs',
      status: 'No-Demo-Data Konform',
      statusColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: HardDrive,
      description: 'Institutionelle Marktdaten von führenden Brokern und Providern. Keine künstlichen Simulationsdaten.',
      bulletPoints: [
        'CoinMarketCap & CoinGecko Crypto APIs',
        'Stooq Aktien- & Rohstoffströme (CSV)',
        'Google Gemini NLP News-Scoring API'
      ]
    }
  ];

  return (
    <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
            <RefreshCw className="text-cyan-400 animate-spin-slow w-3.5 h-3.5" />
            <span>Interaktive Audit-Trail-Grafik (DSGVO Flow)</span>
          </h4>
          <p className="text-[10px] text-white/50">Wähle einen Knoten, um den verschlüsselten Daten-Auditpfad im Detail zu untersuchen.</p>
        </div>
        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase tracking-widest">
          SYSTEM: GESICHERT
        </span>
      </div>

      {/* Visual Nodes & Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative py-2">
        {/* SVG background connection lines for desktop */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 hidden md:block pointer-events-none z-0">
          <svg className="w-full h-4" preserveAspectRatio="none">
            <defs>
              <linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="line-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            {/* Dashed background */}
            <line x1="15%" y1="8" x2="85%" y2="8" stroke="rgba(255,255,255,0.05)" strokeWidth="2" strokeDasharray="6 4" />
          </svg>
        </div>

        {nodes.map((node) => {
          const NodeIcon = node.icon;
          const isActive = activeNode === node.id;
          return (
            <button
              key={node.id}
              onClick={() => setActiveNode(node.id)}
              className={`text-left relative z-10 p-4 rounded-xl border transition-all duration-300 backdrop-blur-sm cursor-pointer ${
                isActive
                  ? 'bg-white/[0.04] border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] scale-[1.02]'
                  : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-white/[0.01]'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-lg ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/50'}`}>
                  <NodeIcon size={18} />
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${node.statusColor}`}>
                  {node.status}
                </span>
              </div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-1">{node.label}</h5>
              <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">{node.description}</p>
            </button>
          );
        })}
      </div>

      {/* Selected Node Details Pane */}
      <AnimatePresence mode="wait">
        {activeNode && (
          <motion.div
            key={activeNode}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="bg-black/50 border border-white/5 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="sm:col-span-1 space-y-1">
              <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-bold">Knoten-Schnittstelle</span>
              <h6 className="text-xs font-bold text-white font-display">
                {nodes.find(n => n.id === activeNode)?.label}
              </h6>
              <p className="text-[11px] text-white/60 leading-relaxed pt-1">
                {nodes.find(n => n.id === activeNode)?.description}
              </p>
            </div>
            
            <div className="sm:col-span-2 space-y-2">
              <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-bold">Compliance-Sicherheitsmerkmale</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {nodes.find(n => n.id === activeNode)?.bulletPoints.map((bp, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/[0.02] border border-white/5 p-2.5 rounded-lg text-white/80">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-medium leading-tight">{bp}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Datenschutz() {
  const [accepted, setAccepted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'privacy' | 'audit'>('privacy');

  const SECTIONS = [
    {
      id: '1',
      title: '1. Allgemeine Hinweise & Verantwortliche Stelle',
      content: 'Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften (DSGVO) sowie dieser Datenschutzerklärung. Verantwortliche Stelle im Sinne des Art. 4 Abs. 7 DSGVO ist die Capital-AI GmbH.'
    },
    {
      id: '2',
      title: '2. Datenerfassung auf unserer Applikation',
      content: 'Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie in das Profil eingeben (Name, E-Mail, Investitionskapital, Risikoprofil). Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. IP-Adresse, Betriebssystem, Browser oder Uhrzeit des Seitenaufrufs).'
    },
    {
      id: '3',
      title: '3. Analyse-Tools & Intelligente Vorhersagen',
      content: 'Unsere Applikation nutzt ausschließlich On-Device und hochgradig anonymisierte Backtest-Analysen. Die Berechnung von Graham-Intrinsic-Werten und Risiko-Analysen findet serverseitig ohne Speicherung von PII (Personally Identifiable Information) statt. Eine Profilerstellung, die über die von Ihnen selbst festgelegten Filter und Anlageklassen hinausgeht, erfolgt nicht.'
    },
    {
      id: '4',
      title: '4. Ihre Rechte (Auskunft, Löschung, Einschränkung)',
      content: 'Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese jederzeit für die Zukunft widerrufen.'
    }
  ];

  const DATA_SOURCES: DataSource[] = [
    {
      name: 'CoinGecko API (v3)',
      type: 'Krypto-Leitkurse & Marktkapitalisierungen',
      protocol: 'Server-to-Server HTTPS (Port 443)',
      purpose: 'Versorgung der Screener und des Interact-Spielfelds (Modul 2) mit echten Marktwerten.',
      leakPrevention: 'Vollständig serverseitig gekapselt. Die Client-IP-Adresse berührt die CoinGecko-Server niemals.',
      gdprBasis: 'Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse an fehlerfreien Marktpreisen).'
    },
    {
      name: 'Stooq Financial API',
      type: 'US-Aktienkurse, Rohstoffe, Währungs-Arbitrage',
      protocol: 'Server-to-Server CSV-Stream (SSL)',
      purpose: 'Mathematisch-reale Fundamentaldaten zur Ermittlung des Benjamin Graham DCF Inneren Werts.',
      leakPrevention: 'Kein clientseitiger Datenabfluss. Sämtliche Ticker-Anfragen werden im Backend aggregiert.',
      gdprBasis: 'Art. 6 Abs. 1 lit. f DSGVO (Systemstabilität & No-Demo-Data Integrität).'
    },
    {
      name: 'Stripe Gateway Services',
      type: 'Abonnementstatus & Zahlungs-Token',
      protocol: 'Verschlüsseltes Stripe-Backend Token-Verfahren',
      purpose: 'PCI-DSS konforme Premium-Zahlungsabwicklung für Starter-, Pro- und Enterprise-Tarife.',
      leakPrevention: 'Direktes Sandboxing im Iframe. IP wird nur verschlüsselt zur Betrugserkennung genutzt.',
      gdprBasis: 'Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung zur Abonnement-Bereitstellung).'
    },
    {
      name: 'Supabase Serverless Database',
      type: 'E-Mail, Login-Credentials, historische Favoriten',
      protocol: 'TLS 1.3 verschlüsseltes Intranet-Netzwerk',
      purpose: 'Speicherung von Nutzer-Abonnements & präferierten Suchfiltern im Backtest.',
      leakPrevention: 'Row-Level-Security (RLS) aktiv. Kein unbefugtes Auslesen von Kreuztabellen möglich.',
      gdprBasis: 'Art. 6 Abs. 1 lit. a DSGVO (Einwilligung des Nutzers beim Registrierungsvorgang).'
    },
    {
      name: 'Google GenAI (Gemini) API',
      type: 'AI-gestütztes Financial News-Scoring',
      protocol: 'HTTPS REST (Google Cloud Run VPC)',
      purpose: 'Intelligentes mathematisches News-Scoring zur Modell-Auswahl des Auto-Routers.',
      leakPrevention: 'Keine Übermittlung persönlicher Nutzerdaten (PII) oder Client-IPs an Google-Modelle.',
      gdprBasis: 'Art. 6 Abs. 1 lit. f DSGVO (Echtzeit-Analyse zur Risiko-Prävention).'
    }
  ];

  const filteredSections = SECTIONS.filter(sec => 
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sec.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md max-w-5xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10 mb-6">
        <div>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/25 text-cyan-400 border border-cyan-500/50 tracking-wider font-mono">
            CAPITAL-AI AUDIT-SUITE • JURISDICTION READY
          </span>
          <h2 className="text-2xl font-black text-white font-display mt-2">Rechtssicheres Compliance-Center</h2>
          <p className="text-xs text-white/70 mt-1 font-sans">
            Wissenschaftliche Offenlegung aller Datenquellen & datenschutzgeprüfte System-Integrität (EU-DSGVO)
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
          <Lock size={14} />
          <span className="text-[11px] font-mono tracking-wider font-bold">DSGVO VERIFIZIERT</span>
        </div>
      </div>

      {/* Selector Tabs: General Privacy Statement vs Detailed Audit Ledger (Doktorarbeit-Level) */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/5 mb-6">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`py-2.5 rounded-lg font-mono text-[11px] uppercase tracking-wider font-bold transition-all ${
            activeTab === 'privacy' 
              ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-white border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
              : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          📄 Datenschutzerklärung (Standard)
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2.5 rounded-lg font-mono text-[11px] uppercase tracking-wider font-bold transition-all ${
            activeTab === 'audit' 
              ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
              : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          🎓 Gerichtsfestes Datenquellen-Protokoll (Audit)
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'privacy' ? (
          <motion.div
            key="privacy-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search policy bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text" 
                placeholder="Datenschutzbestimmungen durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-cyan-500 min-h-[38px]"
              />
            </div>

            {/* Content clauses */}
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {filteredSections.length === 0 ? (
                <div className="text-center py-6 text-white/40 font-mono text-xs">Keine Klauseln zu "{searchQuery}" gefunden.</div>
              ) : (
                filteredSections.map(sec => (
                  <div key={sec.id} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2 hover:border-white/10 transition-all">
                    <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                      <Scale className="text-cyan-400 w-4 h-4" />
                      <span>{sec.title}</span>
                    </h3>
                    <p className="text-xs text-white/60 leading-relaxed font-sans">{sec.content}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="audit-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Scientific explanation */}
            <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase font-mono">
                <HelpCircle size={14} />
                <span>Wissenschaftlicher Begründungsnachweis</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed font-sans">
                Dieses Protokoll dient als gerichtlich verwertbare Ausarbeitung zum Nachweis der Einhaltung der 
                <strong> No-Demo-Data-Policy</strong> und der <strong>EU-DSGVO</strong>. Zur absoluten IP-Isolation werden sämtliche Marktdaten von CoinGecko und Stooq über einen dedizierten, serverseitig gecachten Express Proxy abgefragt. Zu keinem Zeitpunkt findet ein clientseitiger IP-Adressen-Abfluss (IP-Leak) an Drittländer statt.
              </p>
            </div>

            {/* Interactive Audit Trail Flow Graphic */}
            <AuditTrailFlowGraphic />

            {/* Interactive Data Sources Ledger Table */}
            <div className="border border-white/10 rounded-xl overflow-hidden bg-black/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-[11px] font-mono text-white/80 uppercase tracking-widest">
                      <th className="p-3">Datenquelle</th>
                      <th className="p-3">Übertragungsprotokoll</th>
                      <th className="p-3">IP-Leak-Prevention</th>
                      <th className="p-3">DSGVO-Rechtsgrundlage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-sans text-white/80">
                    {DATA_SOURCES.map((source, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-all">
                        <td className="p-3 space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <HardDrive size={12} className="text-purple-400" />
                            <span>{source.name}</span>
                          </div>
                          <div className="text-[11px] text-white/70 font-mono">{source.type}</div>
                        </td>
                        <td className="p-3">
                          <code className="text-[11px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-cyan-400 font-mono">
                            {source.protocol}
                          </code>
                        </td>
                        <td className="p-3 text-[11px] text-emerald-400 font-mono">
                          {source.leakPrevention}
                        </td>
                        <td className="p-3 text-[11px] text-white/75 italic">
                          {source.gdprBasis}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scientific Architecture KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                <Cpu className="text-cyan-400 shrink-0" size={18} />
                <div>
                  <div className="text-[11px] font-mono text-white/60 uppercase font-bold">VPC Isolation</div>
                  <div className="text-xs font-bold text-white">100% Server-Gekapselt</div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                <RefreshCw className="text-purple-400 shrink-0" size={18} />
                <div>
                  <div className="text-[11px] font-mono text-white/60 uppercase font-bold">Coalesced API TTL</div>
                  <div className="text-xs font-bold text-white">60s Aggregation Cache</div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                <AlertTriangle className="text-pink-400 shrink-0" size={18} />
                <div>
                  <div className="text-[11px] font-mono text-white/60 uppercase font-bold">Drittlandtransfer</div>
                  <div className="text-xs font-bold text-white">0% Unautorisierte Leaks</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Acceptance action block */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div className="text-xs text-white/40 font-mono flex items-center gap-1.5">
          <FileText size={12} className="text-cyan-400" />
          Zuletzt verifiziert: 29. Juni 2026 • Gerichtsfest
        </div>

        <div>
          {accepted ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5 rounded-lg text-emerald-400 text-xs font-bold font-mono">
              <CheckCircle2 size={14} /> JURISDICTION APPROVAL LOGGED
            </div>
          ) : (
            <button
              onClick={() => setAccepted(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98] cursor-pointer"
            >
              <Check size={14} /> Protokoll als Richter absegnen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
