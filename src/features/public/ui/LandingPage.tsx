import React from 'react';

interface LandingPageProps {
  preview: React.ReactNode;
}

/**
 * Canonical public landing page for `/`.
 *
 * Product discovery stays available without authentication. Application composition, session
 * contracts and dashboard wiring remain owned by src/app; this public feature only renders the
 * preview supplied by that composition layer plus public product/legal information.
 */
export function LandingPage({ preview }: LandingPageProps) {
  return (
    <>
      {preview}

      <footer
        aria-label="CAPITAL-AI Produkt- und Datenschutzinformationen"
        className="border-t border-white/10 bg-black px-4 py-8 text-white"
      >
        <div className="mx-auto max-w-7xl space-y-3 text-xs text-white/60">
          <h2 className="text-sm font-black text-white">
            CAPITAL-AI – quantitative Multi-Asset-Analyse
          </h2>
          <p className="max-w-4xl leading-relaxed">
            CAPITAL-AI bündelt Markt-, Bewertungs- und Sentiment-Daten zu erklärbaren KI-Scorings
            für Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe. Die öffentliche Landingpage
            zeigt den Enterprise Scorer als limitierte Vorschau ohne Anmeldung. CAPITAL-AI dient
            der Analyse und Bildung und stellt keine Anlageberatung dar.
          </p>
          <nav
            aria-label="Rechtliche Informationen"
            className="flex flex-wrap gap-x-4 gap-y-2 font-bold"
          >
            <a className="text-aif-gold-DEFAULT hover:underline" href="/datenschutz/">
              Datenschutzerklärung
            </a>
            <a className="text-aif-gold-DEFAULT hover:underline" href="/agb/">
              AGB
            </a>
            <a className="text-aif-gold-DEFAULT hover:underline" href="/impressum/">
              Impressum
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
