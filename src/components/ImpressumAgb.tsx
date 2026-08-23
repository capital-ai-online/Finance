import React, { useState } from 'react';
import { Mail, MapPin, Phone, Scale, ShieldCheck } from 'lucide-react';
import { CONTROLLER } from '../privacy/privacyPolicy';
import {
  formatEuro,
  STRIPE_PRICE_SNAPSHOT_DATE,
  SUBSCRIPTION_PRICES_EUR,
  TERMS_EFFECTIVE_DATE,
  TERMS_VERSION,
} from '../features/billing/billingContract';

export function ImpressumAgb({ initialTab = 'impressum' }: { initialTab?: 'impressum' | 'agb' }) {
  const [activeTab, setActiveTab] = useState<'impressum' | 'agb'>(initialTab);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md max-w-4xl mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/40 to-transparent" />

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-white/10 mb-6">
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
            AGB
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
          <Scale size={12} className="text-aif-gold-DEFAULT" />
          <span>RECHTLICHE INFORMATIONEN</span>
        </div>
      </div>

      {activeTab === 'impressum' ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-black text-white font-display">Impressum – Angaben gemäß § 5 DDG</h1>
            <p className="text-xs text-white/50 mt-1">Anbieter und Verantwortlicher für das Angebot unter der Projektbezeichnung CAPITAL-AI</p>
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-xs text-white/65 leading-relaxed">
            <strong className="text-white">Rechtlicher Status:</strong> CAPITAL-AI ist eine Projekt-/Produktbezeichnung. Anbieter und Verantwortlicher ist Sven Michael Kulessa als natürliche Person.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-aif-gold-DEFAULT font-mono">Anbieter</h2>
              <div className="space-y-3 text-xs text-white/80">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-white/40 shrink-0 mt-0.5" />
                  <span>
                    {CONTROLLER.name}<br />
                    {CONTROLLER.street}<br />
                    {CONTROLLER.postalCode} {CONTROLLER.city}<br />
                    {CONTROLLER.country}
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <Mail size={16} className="text-violet-400 shrink-0" />
                  <a href={`mailto:${CONTROLLER.email}`} className="font-mono hover:underline">{CONTROLLER.email}</a>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <Mail size={16} className="text-aif-gold-DEFAULT shrink-0" />
                  <a href={`mailto:${CONTROLLER.supportEmail}`} className="font-mono hover:underline">{CONTROLLER.supportEmail}</a>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <Phone size={16} className="text-white/40 shrink-0" />
                  <span>015204697947</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-white/70">
              <h2 className="text-xs font-bold uppercase tracking-wider text-aif-gold-DEFAULT font-mono">Geschäftsmodell & Transparenz</h2>
              <p className="leading-relaxed">
                Das Angebot kann kostenlose und kostenpflichtige Tarife sowie gekennzeichnete Partner-/Referral-Verweise enthalten. Aussagen wie „privat, nicht-kommerziell, keine laufenden Umsätze“ werden deshalb nicht als pauschale Anbieterbeschreibung verwendet.
              </p>
              <p className="leading-relaxed">
                Soweit einzelne Dienste einer besonderen behördlichen Zulassung bedürften, würden die dafür erforderlichen Angaben hier ergänzt. Die derzeitige Anbieterinformation behauptet keine regulatorische Lizenz oder behördliche Freigabe.
              </p>
            </div>
          </div>

          <div className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/25 p-4 rounded-xl text-xs text-aif-gold-light leading-relaxed">
            <strong>Hinweis zu Analysefunktionen:</strong> Die bereitgestellten Berechnungs- und Analysewerkzeuge ersetzen keine individuelle Prüfung, Beratung oder eigene Risikobewertung. Aussagen zum aufsichtsrechtlichen Status einzelner Funktionen sind nicht Bestandteil dieses Impressums.
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/20 to-black/50 border border-violet-500/20 space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-widest text-violet-300 font-mono">Werblicher Partner-/Referral-Hinweis</div>
            <p className="text-xs text-white/70 leading-relaxed">
              Soweit auf CAPITAL-AI Referral- oder Partnerlinks eingesetzt werden, können daraus Vorteile oder Provisionen entstehen. Solche Verweise sind als Partner-/Referral-Inhalt zu kennzeichnen und ändern nichts an der eigenverantwortlichen Entscheidung des Nutzers.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-black text-white font-display">Allgemeine Geschäftsbedingungen (AGB)</h1>
            <p className="text-xs text-white/50 mt-1">Vertragliche Rahmenbedingungen für die Nutzung der unter CAPITAL-AI angebotenen Software-Funktionen</p>
            <p className="text-[10px] text-white/40 mt-2 font-mono">
              Version {TERMS_VERSION} · gültig ab {TERMS_EFFECTIVE_DATE}
            </p>
          </div>

          <div className="space-y-4 text-xs text-white/70">
            <section className="space-y-1">
              <h2 className="font-bold text-white font-display">§ 1 Anbieter, Geltungsbereich und Vertragsgegenstand</h2>
              <p className="leading-relaxed">
                Anbieter ist {CONTROLLER.name}, natürliche Person, {CONTROLLER.street}, {CONTROLLER.postalCode} {CONTROLLER.city}, {CONTROLLER.country}. CAPITAL-AI ist die Projekt-/Produktbezeichnung der angebotenen Software-Funktionen. Diese AGB gelten für deren Nutzung und, soweit angeboten, für kostenpflichtige Tarife.
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="font-bold text-white font-display">§ 2 Nutzungsrechte</h2>
              <p className="leading-relaxed">
                Nutzer erhalten ein einfaches, nicht übertragbares Nutzungsrecht im Umfang des jeweils freigeschalteten Tarifs. Zugangsdaten, Tokens und Sicherheitsfaktoren dürfen nicht unbefugt weitergegeben werden.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-white font-display">§ 3 Entgeltliche Tarife, Preise und Zahlungsabwicklung</h2>
              <p className="leading-relaxed">
                Bei kostenpflichtigen Tarifen werden Preis, Abrechnungsintervall und Leistungsumfang vor Abgabe der zahlungspflichtigen Bestellung angezeigt. Die Zahlungsabwicklung erfolgt über Stripe. Der im Stripe-Checkout für den ausgewählten Preis ausgewiesene Gesamtbetrag ist für die konkrete Bestellung maßgeblich.
              </p>
              <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
                <table className="w-full min-w-[460px] text-left text-[11px]">
                  <thead className="border-b border-white/10 text-white/50 font-mono uppercase">
                    <tr>
                      <th className="px-3 py-2">Tarif</th>
                      <th className="px-3 py-2">Monatlich</th>
                      <th className="px-3 py-2">Jährlich</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/75">
                    <tr><td className="px-3 py-2 font-bold text-white">Starter</td><td className="px-3 py-2">{formatEuro(SUBSCRIPTION_PRICES_EUR.Starter.monthly)}</td><td className="px-3 py-2">{formatEuro(SUBSCRIPTION_PRICES_EUR.Starter.yearly)}</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-white">Pro</td><td className="px-3 py-2">{formatEuro(SUBSCRIPTION_PRICES_EUR.Pro.monthly)}</td><td className="px-3 py-2">{formatEuro(SUBSCRIPTION_PRICES_EUR.Pro.yearly)}</td></tr>
                    <tr><td className="px-3 py-2 font-bold text-white">Enterprise</td><td className="px-3 py-2">{formatEuro(SUBSCRIPTION_PRICES_EUR.Enterprise.monthly)}</td><td className="px-3 py-2">{formatEuro(SUBSCRIPTION_PRICES_EUR.Enterprise.yearly)}</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-white/40 font-mono">
                Preisstand: produktiver Stripe-Katalog, read-only verifiziert am {STRIPE_PRICE_SNAPSHOT_DATE}. Preisänderungen gelten nicht rückwirkend für bereits abgerechnete Zeiträume.
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="font-bold text-white font-display">§ 4 Laufzeit, Verlängerung und Kündigung</h2>
              <p className="leading-relaxed">
                Bei Abonnements richtet sich die Abrechnungsperiode nach der im Bestellprozess gewählten Monats- oder Jahresoption. Soweit im Bestellprozess nichts Abweichendes ausgewiesen wird, verlängert sich das Abonnement um die jeweils gewählte Abrechnungsperiode, sofern es nicht rechtzeitig beendet wird. Für authentifizierte Kunden steht zur Verwaltung des Abonnements das Stripe-Kundenportal zur Verfügung. Gesetzliche Kündigungsrechte und zwingende verbraucherschützende Regelungen bleiben unberührt.
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="font-bold text-white font-display">§ 5 Widerruf bei Verbraucherverträgen</h2>
              <p className="leading-relaxed">
                Verbrauchern steht bei Fernabsatzverträgen, soweit die gesetzlichen Voraussetzungen vorliegen, grundsätzlich ein Widerrufsrecht zu. Die gesetzliche Widerrufsfrist beträgt regelmäßig 14 Tage. Der Widerruf ist durch eine eindeutige Erklärung gegenüber dem Anbieter möglich und bedarf keiner Begründung. Für eine elektronische Erklärung kann die Kontaktadresse <a href={`mailto:${CONTROLLER.email}`} className="text-aif-gold-DEFAULT hover:underline">{CONTROLLER.email}</a> verwendet werden. Gesetzliche Ausnahmen, Erlöschensgründe und weitergehende Rechte bleiben unberührt.
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="font-bold text-white font-display">§ 6 Daten- und Analysequalität</h2>
              <p className="leading-relaxed">
                Markt-, Scoring- und Analysefunktionen können von externen Datenquellen, Modellannahmen und technischen Verfügbarkeiten abhängen. Synthetische, Fallback- oder nicht marktdatenbasierte Werte sind in den dafür vorgesehenen Produktbereichen entsprechend zu kennzeichnen.
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="font-bold text-white font-display">§ 7 Datenschutz und Sicherheit</h2>
              <p className="leading-relaxed">
                Personenbezogene Daten werden nach der veröffentlichten Datenschutzerklärung verarbeitet. Die Kenntnisnahme der Datenschutzerklärung ist keine pauschale Einwilligung in sämtliche Verarbeitungen. Optionale Einwilligungen, insbesondere Marketing- oder Tracking-Einwilligungen, werden getrennt eingeholt.
              </p>
            </section>

            <section className="space-y-1">
              <h2 className="font-bold text-white font-display">§ 8 Änderungen und Dokumentversion</h2>
              <p className="leading-relaxed">
                Für die Nachvollziehbarkeit wird jeder veröffentlichte AGB-Stand mit einer Dokumentversion geführt. Änderungen dieser AGB werden nicht allein durch die Veröffentlichung rückwirkend Bestandteil bereits geschlossener Verträge; zwingende gesetzliche Vorgaben und wirksam vereinbarte Änderungsmechanismen bleiben unberührt.
              </p>
            </section>
          </div>

          <div className="pt-4 border-t border-white/5 text-[10px] text-white/40 font-mono flex items-center justify-center gap-2">
            <ShieldCheck size={12} /> AGB-Version {TERMS_VERSION}; Datenschutzinformationen werden separat versioniert und nachweisbar geführt.
          </div>
        </div>
      )}
    </div>
  );
}