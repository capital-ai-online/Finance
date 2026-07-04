/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Public marketing landing page. Shown to every visitor by default —
 * no login required to view it. Actual product functionality (screenings,
 * scoring, watchlists, backtests) stays fully gated behind the Dashboard,
 * which only renders once a user is registered/authenticated (see App.tsx).
 * This page only ever links out to the auth form (LandingPage.tsx); it
 * never fetches or displays live scoring data itself, so it can't become
 * a No-Demo-Data-Policy surface.
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp, Coins, LineChart, Landmark, Gem,
  ShieldCheck, BarChart3, Bell, History, ArrowRight, Check
} from 'lucide-react';
import { AifCoreLogo } from './AifCoreLogo';

interface MarketingLandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const universes = [
  { icon: Coins, name: 'Krypto', desc: 'Top-300-Scoring: Markt, On-Chain, Sentiment, Regime.' },
  { icon: TrendingUp, name: 'Aktien', desc: 'Buffett-Style Fundamentaldaten, ROIC, Moat-Qualität.' },
  { icon: Gem, name: 'Rohstoffe', desc: 'Fundamentaldaten, Förderbarkeit, geopolitisches Risiko.' },
  { icon: Landmark, name: 'Indizes', desc: 'Breadth, Volatilität, Session-Kontext.' },
  { icon: LineChart, name: 'Forex', desc: 'Trend, Makro-Regime, Liquidität.' },
];

const features = [
  { icon: BarChart3, title: 'Intelligent Score', desc: 'Jedes Asset bekommt einen eigenständigen, universum-spezifischen Score von 1–10 — kein geteiltes Formelwerk zwischen den Klassen.' },
  { icon: Bell, title: 'Watchlist & Ampel-System', desc: 'Bis zu 3 Assets in engerer Auswahl mit Entry-, Stop-Loss- und Take-Profit-Ampel.' },
  { icon: History, title: 'Backtesting', desc: 'Strategien gegen echte historische Daten prüfen, bevor du Kapital einsetzt.' },
  { icon: ShieldCheck, title: 'Strict No-Demo-Data', desc: 'Ausschließlich echte Marktdaten. Keine simulierten oder erfundenen Werte — niemals.' },
];

const tiers = [
  { name: 'Free', price: '0€', tagline: 'Zum Reinschnuppern', highlights: ['3 Screenings / 5 Tage', 'Intelligent Score', 'Pattern Recognition', 'Watchlist'] },
  { name: 'Starter', price: '7€', tagline: 'Für den Einstieg', highlights: ['5 Screenings / Tag', 'Unbegrenzte Backtests', '1 KI-Analyse / Tag'] },
  { name: 'Pro', price: '29€', tagline: 'Für aktive Trader', highlights: ['20 Screenings / Tag', 'Vollständige KI-Analysen', 'Portfolio-Analysen'], featured: true },
  { name: 'Enterprise', price: '109€', tagline: 'Für Profis', highlights: ['Unbegrenzte Screenings', 'Alle KI-Agenten', 'API-Zugang (optional)'] },
];

export function MarketingLandingPage({ onGetStarted, onLogin }: MarketingLandingPageProps) {
  return (
    <div className="min-h-screen bg-[#06070B] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-20 backdrop-blur-xl bg-black/40 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <AifCoreLogo size={36} showText={true} />
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onLogin}
              className="px-3 sm:px-4 py-2 text-xs font-bold text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              Anmelden
            </button>
            <button
              onClick={onGetStarted}
              className="px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark text-black text-xs font-black uppercase tracking-wide cursor-pointer"
            >
              Kostenlos starten
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(245,196,83,0.08),transparent_60%)]" />
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-5xl font-black tracking-tight leading-tight"
        >
          Multi-Asset-Scoring für<br />
          <span className="bg-gradient-to-r from-aif-gold-DEFAULT via-[#0DDDDD] to-[#B026FF] bg-clip-text text-transparent">
            Krypto, Aktien, Rohstoffe, Indizes &amp; Forex
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-5 text-sm sm:text-base text-white/60 max-w-2xl mx-auto"
        >
          Jedes Universum mit eigenständiger Gewichtung, eigenen Werkzeugen und eigener Validierung — ausschließlich auf Basis echter Marktdaten, nie simuliert.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark text-black font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_30px_rgba(245,196,83,0.25)]"
          >
            Kostenlos registrieren <ArrowRight size={16} />
          </button>
          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 border border-white/15 text-white font-bold text-sm uppercase tracking-wide cursor-pointer"
          >
            Ich habe schon ein Konto
          </button>
        </motion.div>
        <p className="mt-4 text-[10px] font-mono text-white/30 uppercase tracking-widest">
          Registrierung erforderlich, um Screenings &amp; Live-Scores auszuführen
        </p>
      </section>

      {/* Universes */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-center text-xs font-mono uppercase tracking-widest text-white/40 mb-8">5 unabhängige Bewertungs-Universen</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {universes.map((u) => (
            <div key={u.name} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-aif-gold-DEFAULT/30 transition-colors text-center">
              <u.icon className="w-6 h-6 mx-auto text-aif-gold-DEFAULT mb-2" />
              <div className="text-xs font-bold text-white">{u.name}</div>
              <div className="text-[10px] text-white/40 mt-1 leading-snug">{u.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-5 rounded-xl bg-white/[0.03] border border-white/10 flex gap-4">
              <f.icon className="w-8 h-8 text-[#0DDDDD] shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">{f.title}</div>
                <div className="text-xs text-white/50 mt-1 leading-relaxed">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-center text-xs font-mono uppercase tracking-widest text-white/40 mb-8">Preise</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`p-5 rounded-xl border flex flex-col ${
                t.featured
                  ? 'bg-aif-gold-DEFAULT/[0.06] border-aif-gold-DEFAULT/40'
                  : 'bg-white/[0.03] border-white/10'
              }`}
            >
              <div className="text-xs font-mono uppercase tracking-widest text-white/40">{t.tagline}</div>
              <div className="text-lg font-black text-white mt-1">{t.name}</div>
              <div className="text-2xl font-black text-aif-gold-DEFAULT mt-2">{t.price}<span className="text-xs text-white/40 font-normal">/Monat</span></div>
              <ul className="mt-4 space-y-1.5 flex-1">
                {t.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-1.5 text-[11px] text-white/60">
                    <Check size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onGetStarted}
                className={`mt-4 w-full py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  t.featured
                    ? 'bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark text-black'
                    : 'bg-white/10 text-white'
                }`}
              >
                Auswählen
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-xl sm:text-2xl font-black text-white">Bereit für dein erstes Screening?</h2>
        <p className="text-xs text-white/50 mt-2">Kostenlos registrieren — keine Kreditkarte nötig.</p>
        <button
          onClick={onGetStarted}
          className="mt-6 px-8 py-3 rounded-xl bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark text-black font-black text-sm uppercase tracking-wide cursor-pointer"
        >
          Jetzt kostenlos starten
        </button>
      </section>

      <footer className="border-t border-white/10 py-6 text-center space-y-1">
        <p className="text-[10px] text-white/30 font-mono">
          Capital AI · Strict No Demo Data Policy · EU GDPR Compliant
        </p>
        <p className="text-[11px] font-mono text-white/60 uppercase tracking-widest">
          Support: support@capital-ai.online
        </p>
      </footer>
    </div>
  );
}
