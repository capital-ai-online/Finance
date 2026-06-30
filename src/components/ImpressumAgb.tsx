import React, { useState } from 'react';
import { Mail, Phone, MapPin, Scale, HelpCircle, CheckCircle2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ImpressumAgb() {
  const [activeTab, setActiveTab] = useState<'impressum' | 'agb'>('impressum');

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-aif-gold-DEFAULT font-mono">Unternehmenssitz</h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3 text-white/80">
                    <MapPin size={16} className="text-white/40 shrink-0" />
                    <span>
                      Sven Michael Kulessa<br />
                      von lepel Straße 3.<br />
                      27259 Freistatt, Deutschland
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 pt-2 border-t border-white/5">
                    <Mail size={16} className="text-white/40 shrink-0" />
                    <span>support@aifinancial.de</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/80 pt-2 border-t border-white/5">
                    <Phone size={16} className="text-white/40 shrink-0" />
                    <span>015204697947</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-white/70 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-aif-gold-DEFAULT font-mono">Regulatorische Angaben</h4>
                <div className="space-y-2 leading-relaxed">
                  <p><strong className="text-white">Vertretungsberechtigte Geschäftsführer:</strong> Sven Michael Kulessa</p>
                  <p><strong className="text-white">Registergericht:</strong> Amtsgericht Köln, HRB 993211</p>
                  <p><strong className="text-white">Umsatzsteuer-Identifikationsnummer (USt-IdNr.):</strong> DE 302119932</p>
                  <p><strong className="text-white">Zuständige Aufsichtsbehörde:</strong> Bundesanstalt für Finanzdienstleistungsaufsicht (BaFin), Marie-Curie-Straße 24-28, 60439 Frankfurt am Main</p>
                </div>
              </div>
            </div>

            <div className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/25 p-4 rounded-xl text-xs text-aif-gold-light leading-relaxed">
              <strong>Haftungsausschluss:</strong> Sämtliche bereitgestellten Berechnungen (z.B. Graham-DCF Formeln oder Monte-Carlo Risikoprojektionen) stellen keine Anlageberatung oder Finanzanalyse dar. Die historische Evidenz-Validierung schließt das Risiko künftiger Verluste nicht aus.
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
              <p className="text-xs text-white/50 mt-1">Vertragliche Rahmenbedingungen für die Nutzung der AIFinancial Quantitative Plattform</p>
            </div>

            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2 scrollbar-none text-xs text-white/70 space-y-4">
              <div className="space-y-1">
                <h4 className="font-bold text-white font-display">§ 1 Geltungsbereich und Vertragsgegenstand</h4>
                <p className="leading-relaxed">Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der von AIFinancial GmbH angebotenen Software-Tools, insbesondere des Screeners, der Graham Value Checks sowie der Monte-Carlo Simulationen.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white font-display">§ 2 Nutzungsrechte & Lizenzierung</h4>
                <p className="leading-relaxed">AIFinancial gewährt dem Nutzer eine zeitlich auf die Laufzeit des Abonnements beschränkte, einfache, nicht übertragbare Lizenz zur Nutzung der bereitgestellten Analysewerkzeuge zu privaten oder geschäftsmäßigen Zwecken (je nach Tarifstufe).</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white font-display">§ 3 Zahlungsbedingungen & Tarife</h4>
                <p className="leading-relaxed">Die Entgelte für Abonnements sind im Voraus monatlich fällig. Zahlungen können per Kreditkarte, Banküberweisung oder Google Pay verbucht werden. Eine Preisanpassung wird dem Nutzer mindestens 6 Wochen im Voraus mitgeteilt.</p>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-white font-display">§ 4 Haftungsausschluss & Datenintegrität</h4>
                <p className="leading-relaxed">AIFinancial haftet nicht für Schäden, die auf fehlerhafte Analysen, fehlende Marktdaten-Aktualität oder Server-Ausfälle zurückzuführen sind. Die Software dient rein mathematischen Berechnungen und Informationszwecken.</p>
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
