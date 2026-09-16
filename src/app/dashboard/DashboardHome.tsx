import {
  Activity,
  BarChart3,
  Compass,
  Database,
  FileText,
  Gauge,
  Mail,
  Percent,
  SlidersHorizontal,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import {
  AnalyticsUI,
  CryptoUI,
  NewsUI,
  ReportingUI,
} from '../../features';
import type { SubscriptionTier, UserSession } from '../types/UserSession';
import type { DashboardView } from './dashboardViews';

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
  subscriptionTier: SubscriptionTier;
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
 * not own scoring, evidence, entitlement, IAM, or routing authority.
 */
export function DashboardHome({
  userSession,
  subscriptionTier,
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
              <span className="px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono text-white/45">Beta · Version 0.7.0</span>
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

      <CryptoUI.CryptoScoringEnterprise
        selectedSymbol={selectedSymbol}
        onSelectSymbol={onSelectSymbol}
        timeframe={timeframe}
        onChangeTimeframe={onChangeTimeframe}
        userSession={userSession}
        subscriptionTier={subscriptionTier}
        onUpgradeClick={() => onNavigate('abonnements')}
      />

      {(subscriptionTier === 'Free' || userSession.type === 'guest') && (
        <div className="bg-gradient-to-br from-amber-950/40 via-black to-blue-950/40 border border-aif-gold-DEFAULT/40 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-[0_10px_40px_rgba(245,196,83,0.15)] my-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aif-gold-DEFAULT/15 border border-aif-gold-DEFAULT/30 text-aif-gold-DEFAULT font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} className="animate-spin" />
                <span>Free &amp; Gast Modus – Limitierte Vorschau</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white font-display">Schalten Sie das volle CAPITAL-AI Potenzial frei</h3>
              <p className="text-xs sm:text-sm text-white/70 font-mono leading-relaxed">
                Als Gast- oder Free-Nutzer sehen Sie exklusiv das <strong className="text-white">BTC Enterprise Scoring Ergebnis</strong>. Für den Zugriff auf weitere Website-Inhalte, den Realtime AI-Newsfeed, Backtesting, Heatmaps und unbegrenztes Screening wählen Sie ein höheres Abonnement.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/60 pt-1">
                <span>✓ Starter (7€/m): Max 3 Assets</span>
                <span>✓ Pro (29€/m): Realtime AI Newsfeed</span>
                <span>✓ Enterprise (109€/m): BaFin PDF Exports</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => onNavigate('abonnements')}
                className="px-6 py-3 bg-gradient-to-r from-aif-gold-DEFAULT via-amber-400 to-aif-gold-DEFAULT text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(245,196,83,0.4)] hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                <span>Abonnement Upgraden</span>
              </button>
              <a
                href="mailto:support@capital-ai.online"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs font-mono rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mail size={14} className="text-aif-gold-DEFAULT" />
                <span>support@capital-ai.online</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <NewsUI.RealtimeAiNewsfeed
          subscriptionTier={subscriptionTier}
          onUpgradeClick={() => onNavigate('abonnements')}
          onTriggerPushNotification={onTriggerPushNotification}
          watchlist={watchlist}
          maxDisplayItems={3}
          selectedSymbol={selectedSymbol}
        />
      </div>

      <ReportingUI.ComplianceExporter
        capital={capital}
        selectedSymbol={selectedSymbol}
        subscriptionTier={subscriptionTier}
        onUpgradeClick={() => onNavigate('abonnements')}
      />

      <NewsUI.MarketSentiment selectedSymbol={selectedSymbol} assetClass={preferredAssetClass} />

      <div className="grid grid-cols-1 gap-6">
        <AnalyticsUI.ImageAnalyzer triggerAttempt={triggerAttempt} />
      </div>
    </>
  );
}
