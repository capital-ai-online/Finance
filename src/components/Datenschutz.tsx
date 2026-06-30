import React, { useState } from 'react';
import { ShieldCheck, Lock, Search, Scale, FileText, CheckCircle2, Check } from 'lucide-react';
import { motion } from 'motion/react';

export function Datenschutz() {
  const [accepted, setAccepted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const SECTIONS = [
    {
      id: '1',
      title: '1. Allgemeine Hinweise & Verantwortliche Stelle',
      content: 'Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften (DSGVO) sowie dieser Datenschutzerklärung. Verantwortliche Stelle im Sinne des Art. 4 Abs. 7 DSGVO ist die AIFinancial GmbH.'
    },
    {
      id: '2',
      title: '2. Datenerfassung auf unserer Applikation',
      content: 'Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie in das Profil eingeben (Name, E-Mail, Investitionskapital, Risikoprofil). Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. IP-Adresse, Betriebssystem, Browser oder Uhrzeit des Seitenaufrufs).'
    },
    {
      id: '3',
      title: '3. Analyse-Tools & Intelligente Vorhersagen',
      content: 'Unsere Applikation nutzt ausschließlich On-Device und hochgradig anonymisierte Backtest-Analysen. Die Berechnung von Graham-Intrinsic-Werten und Monte-Carlo Simulationen findet serverseitig ohne Speicherung von PII (Personally Identifiable Information) statt. Eine Profilerstellung, die über die von Ihnen selbst festgelegten Filter und Anlageklassen hinausgeht, erfolgt nicht.'
    },
    {
      id: '4',
      title: '4. Ihre Rechte (Auskunft, Löschung, Einschränkung)',
      content: 'Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese jederzeit für die Zukunft widerrufen.'
    }
  ];

  const filteredSections = SECTIONS.filter(sec => 
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sec.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md max-w-4xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-neon-cyan/40 to-transparent" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/10 mb-6">
        <div>
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-aif-neon-cyan/20 text-aif-neon-cyan border border-aif-neon-cyan/40 tracking-wider font-mono">
            COMPLIANCE CENTER
          </span>
          <h2 className="text-2xl font-black text-white font-display mt-2">Datenschutzerklärung</h2>
          <p className="text-xs text-white/50 mt-1 font-sans">
            Konform mit der europäischen Datenschutz-Grundverordnung (EU-DSGVO)
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Lock size={14} />
          <span className="text-[10px] font-mono tracking-wider font-bold">DSGVO KONFORM</span>
        </div>
      </div>

      {/* Search policy bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input 
          type="text" 
          placeholder="Datenschutzbestimmungen durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/50 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-neon-cyan min-h-[38px]"
        />
      </div>

      {/* Content clauses */}
      <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-none mb-6">
        {filteredSections.length === 0 ? (
          <div className="text-center py-6 text-white/40 font-mono text-xs">Keine Klauseln zu "{searchQuery}" gefunden.</div>
        ) : (
          filteredSections.map(sec => (
            <div key={sec.id} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="text-sm font-bold text-white font-display">{sec.title}</h3>
              <p className="text-xs text-white/60 leading-relaxed font-sans">{sec.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Acceptance action block */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-xs text-white/40 font-mono flex items-center gap-1.5">
          <FileText size={12} className="text-aif-neon-cyan" />
          Zuletzt aktualisiert: Juni 2026 • Version 7.5
        </div>

        <div>
          {accepted ? (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-5 py-2.5 rounded-lg text-emerald-400 text-xs font-bold font-mono">
              <CheckCircle2 size={14} /> BESTÄTIGT & LOGG AKTIV
            </div>
          ) : (
            <button
              onClick={() => setAccepted(true)}
              className="px-6 py-2.5 bg-aif-neon-cyan hover:bg-aif-neon-cyan/80 text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(13,221,221,0.3)] transition-all active:scale-[0.98]"
            >
              <Check size={14} /> Richtlinien akzeptieren
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
