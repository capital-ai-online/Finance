import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Compass,
  Database,
  FileText,
  Gauge,
  Percent,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import type { UserSession } from '../types/UserSession';
import type { DashboardView } from './dashboardViews';

const CryptoScoringEnterprise = lazy(() =>
  import('../../features/crypto/ui/CryptoScoringWorkspace').then((module) => ({
    default: module.CryptoScoringWorkspace,
  })),
);
const RealtimeAiNewsfeed = lazy(() =>
  import('../../features/news/ui/RealtimeAiNewsfeed').then((module) => ({
    default: module.RealtimeAiNewsfeed,
  })),
);
const ComplianceExporter = lazy(() =>
  import('../../features/reporting/ui').then((module) => ({ default: module.ComplianceExporter })),
);
const MarketSentiment = lazy(() =>
  import('../../features/news/ui').then((module) => ({ default: module.MarketSentiment })),
);
const ImageAnalyzer = lazy(() =>
  import('../../features/analytics/ui').then((module) => ({ default: module.ImageAnalyzer })),
);

function DashboardWidgetLoading({ label }: { label: string }) {
  return (
    <div
      className="flex min-h-48 items-center justify-center rounded-2xl border border-white/10 bg-black/25 px-6 py-10 text-center"
      data-dashboard-widget-loading={label}
    >
      <p className="text-xs font-mono uppercase tracking-widest text-white/45">{label} wird geladen…</p>
    </div>
  );
}

function DeferredDashboardSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (activated) return undefined;
    const element = containerRef.current;
    if (!element) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setActivated(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setActivated(true);
        observer.disconnect();
      },
      { rootMargin: '600px 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [activated]);

  return (
    <div ref={containerRef} data-dashboard-deferred-section={label}>
      {activated ? (
        <Suspense fallback={<DashboardWidgetLoading label={label} />}>{children}</Suspense>
      ) : (
        <DashboardWidgetLoading label={label} />
      )}
    </div>
  );
}

export interface DashboardPushNotificationInput {
  symbol: string;
  name: string;
  score: number;
  oldScore: number;
  headline: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  type: string;
  isOnWatchlist: boolean;
}

export interface DashboardHomeProps {
  userSession: UserSession;
  platformVersion: string;
  capital: number;
  preferredAssetClass: string;
  selectedSymbol: string;
  timeframe: string;
  watchlist: string[];
  onSelectSymbol: (symbol: string) => void;
  onChangeTimeframe: (timeframe: string) => void;
  onNavigate: (view: DashboardView) => void;
  onTriggerPushNotification: (data: DashboardPushNotificationInput) => void;
  triggerAttempt: (actionName: string, onExecute: () => void) => void;
}

function OrientationJumpNav({ onBuffetValueClick }: { onBuffetValueClick: () => void }) {
  return (
    <nav
      className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider"
      aria-label="Sprungnavigation Hauptseite"
    >
      <a href="#enterprise-scorer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/70 hover:border-aif-gold-DEFAULT/40 hover:text-aif-gold-DEFAULT transition-colors"><Gauge size={12} /> Score</a>
      <a href="#trade-setup-grafik" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/70 hover:border-aif-gold-DEFAULT/40 hover:text-aif-gold-DEFAULT transition-colors"><Activity size={12} /> Trade-Setup</a>
      <a href="#favoriten-slots" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/70 hover:border-aif-gold-DEFAULT/40 hover:text-aif-gold-DEFAULT transition-colors"><Star size={12} /> Favoriten</a>
      <a href="#tiefenanalyse" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/70 hover:border-aif-gold-DEFAULT/40 hover:text-aif-gold-DEFAULT transition-colors"><Database size={12} /> Tiefenanalyse</a>
      <button
        type="button"
        onClick={onBuffetValueClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-white/70 hover:border-aif-gold-DEFAULT/40 hover:text-aif-gold-DEFAULT transition-colors"
      >
        <Percent size={12} /> Buffet Value Check
      </button>
    </nav>
  );
}

/**
 * BB-2G app-owned composition for the productive Dashboard Home surface.
 *
 * This component only composes existing feature facades and callbacks. It does
 * not own scoring, evidence, entitlement, IAM, release-version or routing authority.
 */
export function DashboardHome({
  userSession,
  platformVersion,
  capital,
  preferredAssetClass,
  selectedSymbol,
  timeframe,
  watchlist,
  onSelectSymbol,
  onChangeTimeframe,
  onNavigate,
  onTriggerPushNotification,
  triggerAttempt,
}: DashboardHomeProps) {
  return (
    <>
      {userSession.type === 'guest' ? (
        <div className="rounded-2xl border border-aif-gold-DEFAULT/25 bg-gradient-to-br from-black/40 via-black/30 to-purple-950/10 backdrop-blur-md px-5 py-6 sm:px-7 sm:py-7 space-y-5">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT">
            <span className="w-1.5 h-1.5 rounded-full bg-aif-gold-DEFAULT animate-pulse" />
            <span>Was ist CAPITAL-AI</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black font-display text-white leading-snug max-w-2xl text-balance">
            Quantitative Finanzanalyse für Multi-Asset-Screening — live, als Gast nutzbar.
          </h2>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed max-w-2xl">
            CAPITAL-AI bündelt Markt-, Bewertungs- und Sentiment-Daten zu erklärbaren KI-Scorings für Aktien, Indizes, Forex, Kryptowährungen und Rohstoffe. Sie sind aktuell als <span className="text-white font-bold">Gast im kostenlosen Free-Modus</span> angemeldet und sehen live das BTC Enterprise Scoring.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-aif-gold-DEFAULT mb-1"><Compass size={12} /> <span>Screening</span></div>
              <p className="text-[11px] text-white/55 leading-snug">Aktien, Indizes, Forex, Krypto, Rohstoffe</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-aif-gold-DEFAULT mb-1"><BarChart3 size={12} /> <span>Bewertung</span></div>
              <p className="text-[11px] text-white/55 leading-snug">Graham- &amp; DCF-Modelle, Scoring-Lineage</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-aif-gold-DEFAULT mb-1"><SlidersHorizontal size={12} /> <span>Simulation</span></div>
              <p className="text-[11px] text-white/55 leading-snug">Backtesting, Monte-Carlo, Stresstests</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-aif-gold-DEFAULT mb-1"><FileText size={12} /> <span>Export</span></div>
              <p className="text-[11px] text-white/55 leading-snug">PDF- &amp; CSV-Reports für Audit &amp; Compliance</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono text-white/45">DSGVO-konform</span>
              <span className="px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono text-white/45">Keine Anlageberatung</span>
              <span className="px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono text-white/45">Beta · Version {platformVersion}</span>
            </div>
            <OrientationJumpNav onBuffetValueClick={() => onNavigate('buffet-value')} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-md px-5 py-3.5">
          <p className="text-xs text-white/60 font-mono leading-relaxed max-w-xl">
            <span className="text-white font-bold">Willkommen bei CAPITAL-AI.</span> Ihr Cockpit für Multi-Asset-Scoring, Trade-Setups und Live-Pattern-Analyse — alles auf dieser Seite.
          </p>
          <OrientationJumpNav onBuffetValueClick={() => onNavigate('buffet-value')} />
        </div>
      )}

      <Suspense fallback={<DashboardWidgetLoading label="Enterprise Scorer" />}>
        <CryptoScoringEnterprise
          selectedSymbol={selectedSymbol}
          onSelectSymbol={onSelectSymbol}
          timeframe={timeframe}
          onChangeTimeframe={onChangeTimeframe}
          userSession={userSession}
        />
      </Suspense>

      <DeferredDashboardSection label="AI Newsfeed">
        <div className="w-full">
          <RealtimeAiNewsfeed
            onTriggerPushNotification={onTriggerPushNotification}
            watchlist={watchlist}
            maxDisplayItems={3}
            selectedSymbol={selectedSymbol}
          />
        </div>
      </DeferredDashboardSection>

      <DeferredDashboardSection label="Compliance Export">
        <ComplianceExporter
          capital={capital}
          selectedSymbol={selectedSymbol}
        />
      </DeferredDashboardSection>

      <DeferredDashboardSection label="Markt-Sentiment">
        <MarketSentiment selectedSymbol={selectedSymbol} assetClass={preferredAssetClass} />
      </DeferredDashboardSection>

      <DeferredDashboardSection label="Bildanalyse">
        <div className="grid grid-cols-1 gap-6">
          <ImageAnalyzer triggerAttempt={triggerAttempt} />
        </div>
      </DeferredDashboardSection>
    </>
  );
}
