import React, { useState } from 'react';
import { Mail, Phone, MapPin, Scale, HelpCircle, CheckCircle2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ImpressumAgb({ initialTab = 'impressum' }: { initialTab?: 'impressum' | 'agb' }) {
  const [activeTab, setActiveTab] = useState<'impressum' | 'agb'>(initialTab);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md max-w-4xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/40 to-transparent" />

      {/* Tabs */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('impressum')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all font-mono ${
              activeTab === 'impressum' ? 'bg-aif-gold-DEFAULT text-black' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Impressum
          </button>
          <button
            onClick={() => setActiveTab('agb')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all font-mono ${
              activeTab === 'agb' ? 'bg-aif-gold-DEFAULT text-black' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            Allgemeine Geschäftsbedingungen (AGB)
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-white/40 font-mono">
          <Scale size={12} className="text-aif-gold-DEFAULT" />
          <span>RECHTLICHE INFOS</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'impressum' ? (
          <motion.div
            key="impressum"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-black text-white font-display">Impressum (Angaben gemäß § 5 TMG)</h3>
              <p className="text-xs text-white/50 mt-1">Verantwortlich für den Inhalt dieses Telemediendienstes</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-[11px] text-white/60 leading-relaxed">
              Dieses Angebot wird von einer Privatperson betrieben (kein eingetragenes Unternehmen,
              keine Gesellschaftsform). Es handelt sich um ein privates, nicht-kommerzielles Projekt
              ohne laufende Umsätze.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-aif-gold-DEFAULT font-mono">Angaben zur Person</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3 text-white/80">
                    <MapPin size={16} className="text-white/40 shrink-0" />
                    <span>
                      Sven Michael Kulessa<br />
                      von Lepel Straße 3a<br />
                      27259 Freistatt, Deutschland
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/5 text-white/80">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-violet-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-mono text-white/40 block leading-none">Kontakt</span>
                        <span className="font-mono">sven.kulessa@capital-ai.online</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                      <Mail size={16} className="text-aif-gold-DEFAULT shrink-0" />
                      <div>
                        <span className="text-[10px] font-mono text-white/40 block leading-none">Support-Anfragen</span>
                        <span className="font-mono">support@capital-ai.online</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 pt-2 border-t border-white/5">
                    <Phone size={16} className="text-white/40 shrink-0" />
                    <span>015204697947</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-white/70 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-aif-gold-DEFAULT font-mono">Rechtlicher Status</h4>
                <div className="space-y-2 leading-relaxed">
                  <p><strong className="text-white">Betreiber:</strong> Sven Michael Kulessa (Privatperson, kein eingetragenes Unternehmen)</p>
                  <p><strong className="text-white">Umsatzsteuer:</strong> Es wird derzeit keine Umsatzsteuer ausgewiesen (kein laufender Geschäftsbetrieb).</p>
                  <p className="text-white/50">Die bereitgestellten Werkzeuge dienen ausschließlich Informations- und Berechnungszwecken (siehe Haftungsausschluss unten) und stellen keine lizenzierte Finanzdienstleistung dar.</p>
                </div>
              </div>
            </div>

            <div className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/25 p-4 rounded-xl text-xs text-aif-gold-light leading-relaxed">
              <strong>Haftungsausschluss:</strong> Sämtliche bereitgestellten Berechnungen (z.B. Graham-DCF Formeln oder Monte-Carlo Risikoprojektionen) stellen keine Anlageberatung oder Finanzanalyse dar. Die historische Evidenz-Validierung schließt das Risiko künftiger Verluste nicht aus.
            </div>

            {/* Kraken Pro Referral Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/20 to-black/50 border border-violet-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(139,92,246,0.05)]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-violet-300 font-mono">Kraken Pro Partner-Bonus</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Melde dich über meinen Link unten oder mit meinem Empfehlungscode <code className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-aif-gold-DEFAULT font-mono font-bold select-all">yc4ggk3f</code> bei Kraken Pro an, dann können wir beide Prämien verdienen.
                </p>
              </div>
              <a 
                href="https://proinvite.kraken.com/9f1e/5bq7c9cn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:scale-[1.02] active:scale-[0.98] group"
              >
                <span>Kraken Pro</span>
                <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-xs">↗</span>
              </a>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="agb"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-lg font-black text-white font-display">Allgemeine Geschäftsbedingungen (AGB)</h3>
              <p className="text-xs text-white/50 mt-1">Vertragliche Rahmenbedingungen für die Nutzung der Capital-AI Quantitative Plattform</p>
            </div>

            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2 scrollbar-none text-xs text-white/70 space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-white font-display">§ 1 Geltungsbereich und Vertragsgegenstand</h4>
                <p className="leading-relaxed">Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der von Sven Michael Kulessa (Privatperson, kein eingetragenes Unternehmen) unter der Bezeichnung "Capital-AI" angebotenen Software-Tools, insbesondere des Screeners, der Graham Value Checks sowie der Risiko-Analysen.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white font-display">§ 2 Nutzungsrechte & Lizenzierung</h4>
                <p className="leading-relaxed">Capital-AI gewährt dem Nutzer eine zeitlich auf die Laufzeit des Abonnements beschränkte, einfache, nicht übertragbare Lizenz zur Nutzung der bereitgestellten Analysewerkzeuge zu privaten oder geschäftsmäßigen Zwecken (je nach Tarifstufe).</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white font-display">§ 3 Zahlungsbedingungen & Tarife</h4>
                <p className="leading-relaxed">Die Entgelte für Abonnements sind im Voraus monatlich fällig. Zahlungen können per Kreditkarte, Banküberweisung oder Google Pay verbucht werden. Eine Preisanpassung wird dem Nutzer mindestens 6 Wochen im Voraus mitgeteilt.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white font-display">§ 4 Haftungsausschluss & Datenintegrität</h4>
                <p className="leading-relaxed">Capital-AI haftet nicht für Schäden, die auf fehlerhafte Analysen, fehlende Marktdaten-Aktualität oder Server-Ausfälle zurückzuführen sind. Die Software dient rein mathematischen Berechnungen und Informationszwecken.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-[10px] text-white/40 font-mono text-center">
              Mit dem Abschließen eines Tarifs akzeptierst du diese Bestimmungen in vollem Umfang.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
