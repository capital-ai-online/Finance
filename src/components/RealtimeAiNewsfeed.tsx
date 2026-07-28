import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ArrowRight, Zap, RefreshCw, Lock, Sparkles, CheckCircle, ShieldAlert, Cpu, Bell, BellOff } from 'lucide-react';

interface NewsAlert {
  id: string;
  time: string;
  symbol: string;
  headline: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  routedTo: string;
  insight: string;
  premium?: boolean;
}

const INITIAL_ALERTS: NewsAlert[] = [
  {
    id: '1',
    time: 'Gerade eben',
    symbol: 'BTC',
    headline: 'Fed signalisiert unerwartete Zinspause – Institutionelle Spot-ETFs verzeichnen Rekordzuflüsse',
    sentiment: 'bullish',
    impact: 'high',
    routedTo: 'Claude 3.5 Sonnet (Deep-Review)',
    insight: 'Die Marktliquidität steigt rasant. On-Chain-Daten zeigen eine starke Akkumulation durch Wallets mit >1.000 BTC. Der makroökonomische Rückenwind stärkt die Unterstützung bei $92.500.',
    premium: false
  },
  {
    id: '2',
    time: 'vor 4 Min.',
    symbol: 'AAPL',
    headline: 'Apple Intelligence Adoptionsrate übertrifft Erwartungen bei iPhone 16 Pro Vorbestellungen',
    sentiment: 'bullish',
    routedTo: 'Gemini 1.5 Pro (Low-Latency)',
    impact: 'high',
    insight: 'Die durchschnittliche Marge steigt durch den höheren Pro-Anteil auf über 42.5%. Lieferketten in Asien laufen mit 100% Auslastung. Die Bewertung nähert sich dem fairen DCF-Wert.',
    premium: false
  },
  {
    id: '3',
    time: 'vor 15 Min.',
    symbol: 'TSLA',
    headline: 'EU-Zulassungsverfahren für FSD v12.5 erreicht Meilenstein – Lokale Pilotprojekte gestartet',
    sentiment: 'neutral',
    routedTo: 'GPT-4o (Legacy Engine)',
    impact: 'medium',
    insight: 'Zulassung im europäischen Markt wird bis Q4 2026 erwartet. Kurzfristig verharren Margen unter Druck durch anhaltende Rabattaktionen im asiatischen Raum.',
    premium: true
  },
  {
    id: '4',
    time: 'vor 32 Min.',
    symbol: 'ETH',
    headline: 'Ethereum Staking erreicht historischen Höchststand – Zirkulierendes Angebot an Börsen sinkt um 14%',
    sentiment: 'bullish',
    routedTo: 'Llama 3 (DSGVO Local)',
    impact: 'medium',
    insight: 'Über 32 Millionen ETH sind im Smart Contract gebunden. Die Token-Burn-Rate steigt durch L2-Gebührenmigration langsamer, aber das Verknappungsszenario bleibt voll intakt.',
    premium: true
  },
  {
    id: '5',
    time: 'vor 1 Std.',
    symbol: 'GLD',
    headline: 'Zentralbanken beschleunigen Goldkäufe im schnellsten Quartalstempo seit 1971',
    sentiment: 'bullish',
    routedTo: 'Grok 2.0 (Research)',
    impact: 'medium',
    insight: 'Geopolitische Diversifikation weg von Staatsanleihen treibt physisches Gold auf Allzeithochs. Starker defensiver Anker für risikominimierte Portfolios.',
    premium: true
  }
];

const NEW_REALTIME_ALERTS: Partial<NewsAlert>[] = [
  {
    symbol: 'BTC',
    headline: 'Unerwarteter Orderbuch-Spike: Coinbase verzeichnet Single-Buy Order im Wert von 45 Mio. USD',
    sentiment: 'bullish',
    impact: 'high',
    routedTo: 'Gemini 1.5 Pro (Speed Router)',
    insight: 'Sofortige Absorption der Verkaufsorder knapp über $94.000 signalisiert starkes institutionelles Limit-Kaufinteresse.'
  },
  {
    symbol: 'NVDA',
    headline: 'Blackwell-Lieferzeiten verlängern sich auf 14 Monate durch CoWoS-Verpackungsengpässe',
    sentiment: 'neutral',
    impact: 'medium',
    routedTo: 'Claude 3.5 (Quant Review)',
    insight: 'Die Nachfrage bleibt gigantisch, doch physische Kapazitätsgrenzen limitieren das Umsatzwachstum im nächsten Quartal.'
  },
  {
    symbol: 'EURUSD',
    headline: 'EZB signalisiert aggressivere Zinssenkung im September zur Stimulierung der Eurozone',
    sentiment: 'bearish',
    impact: 'high',
    routedTo: 'Llama 3 (Compliance-Safe)',
    insight: 'Anstehende Zinsdifferenz begünstigt US-Dollar-Bestände. Technischer Bruch der 1.0820 Supportzone rückt in Reichweite.'
  }
];

interface RealtimeAiNewsfeedProps {
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpgradeClick: () => void;
  selectedSymbol?: string;
  searchQuery?: string;
  categoryFilter?: string;
  prioritySymbols?: string[];
  onTriggerPushNotification?: (data: {
    symbol: string;
    name: string;
    score: number;
    oldScore: number;
    headline: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    impact: 'high' | 'medium' | 'low';
    type: string;
    isOnWatchlist: boolean;
  }) => void;
  watchlist?: string[];
  maxDisplayItems?: number;
}

const DEFAULT_SCORER_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'ADA', 'XRP', 'DOT', 'AVAX', 'LINK', 'BNB', 'MATIC',
  'DOGE', 'SHIB', 'PEPE', 'WIF', 'BONK', 'FLOKI', 'POPCAT', 'BRETT', 'MOG', 'BOME',
  'GLD', 'SLV', 'USO', 'NG=F', 'WTI', 'BRENT', 'AAPL', 'NVDA', 'TSLA'
];

// Utility to calculate how a news sentiment/impact alters an asset score
const calculateNewsImpactScore = (baseScore: number, sentiment: 'bullish' | 'bearish' | 'neutral', impact: 'high' | 'medium' | 'low'): number => {
  let score = baseScore;
  if (sentiment === 'bullish') {
    const boost = impact === 'high' ? 1.8 : impact === 'medium' ? 1.0 : 0.4;
    score = Math.min(10.0, baseScore + boost);
  } else if (sentiment === 'bearish') {
    const penalty = impact === 'high' ? 2.2 : impact === 'medium' ? 1.4 : 0.6;
    score = Math.max(1.0, baseScore - penalty);
  }
  return Number(score.toFixed(1));
};

export function RealtimeAiNewsfeed({ 
  subscriptionTier, 
  onUpgradeClick, 
  selectedSymbol = '',
  searchQuery = '',
  categoryFilter = 'all',
  prioritySymbols = DEFAULT_SCORER_SYMBOLS,
  onTriggerPushNotification,
  watchlist = [],
  maxDisplayItems = 3
}: RealtimeAiNewsfeedProps) {
  const [alerts, setAlerts] = useState<NewsAlert[]>(INITIAL_ALERTS);
  const [activeAlert, setActiveAlert] = useState<NewsAlert | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlanForStripe, setSelectedPlanForStripe] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState<boolean>(false);

  // Generate dynamic, realistic news alert data for any asset
  const generateCustomAlertsForAsset = (asset: any): NewsAlert[] => {
    const sym = asset.symbol;
    const name = asset.name;
    const change = asset.change24h || 0;
    const isPositive = change >= 0;
    
    let headlines: string[] = [];
    let insights: string[] = [];
    const routings = [
      'Claude 3.5 Sonnet (Deep-Review)',
      'Gemini 1.5 Pro (Low-Latency)',
      'GPT-4o (Legacy Engine)',
      'Llama 3 (DSGVO Local)',
      'Grok 2.0 (Research)'
    ];

    if (asset.type === 'crypto') {
      headlines = [
        `${name} (${sym}) On-Chain Aktivität explodiert – Wale akkumulieren im Millionenbereich`,
        `Regulierungs-Entwicklung treibt stochastische Liquidität für ${sym}`,
        `Technischer Ausbruch bei ${sym}: Analysten prognostizieren anhaltendes Momentum`
      ];
      insights = [
        `Die Anzahl der aktiven Adressen stieg in den letzten 24 Stunden um 18.4%. Kalt-Wallets verzeichnen kontinuierliche Abflüsse zu OTC-Desks, was auf ein sinkendes liquides Angebot hindeutet.`,
        `Neue Regulierungsentwürfe in der EU und den USA begünstigen dezentrale Liquiditätsprotokolle. Das stochastische Handelsvolumen verzeichnet ein deutliches Wachstum im asiatischen Raum.`,
        `Nach dem Durchbrechen des gleitenden Durchschnitts der letzten 200 Tage zeigt der RSI-Indikator noch immer keine Überhitzung. Unterstützungszonen bei $${(asset.price * 0.95).toFixed(2)} halten stand.`
      ];
    } else if (asset.type === 'stock') {
      headlines = [
        `${name} (${sym}) meldet starke Quartalszahlen – EPS übertrifft Analystenschätzungen deutlich`,
        `Marktanteils-Ausbau: Neue KI-Schnittstellen-Integration beflügelt Kurs von ${sym}`,
        `Analysten-Konferenz: Management von ${name} prognostiziert Margen-Expansion`
      ];
      insights = [
        `Der Gewinn je Aktie (EPS) übertrifft den Konsens um 12.5%. Die Bruttomarge stieg dank optimierter Lieferketten und Skaleneffekte auf einen neuen Höchststand.`,
        `Die Einführung der neuen CAPITAL-AI kompatiblen Schnittstellen reduziert operative Kosten um geschätzte 20%. Großkunden zeigen starkes Interesse an langfristigen Verträgen.`,
        `Die Erhöhung des freien Cashflows ermöglicht erweiterte Aktienrückkäufe und Dividendenausschüttungen. Der faire Wert nach Graham liegt deutlich über dem aktuellen Kurs.`
      ];
    } else if (asset.type === 'index') {
      headlines = [
        `${name} (${sym}) erreicht Meilenstein: Globaler Index klettert auf neues Verlaufshoch`,
        `Technischer Durchbruch beim ${sym}: Momentum-Indikatoren signalisieren Fortsetzung der Rally`,
        `Volatilitäts-Spike im ${name}: Marktteilnehmer reagieren auf jüngste Wirtschaftsdaten`
      ];
      insights = [
        `Der wichtigste Benchmark-Index verzeichnete starke Zuflüsse aus institutionellen Portfolios. Optimistische Gewinnprognosen beflügeln das Sentiment auf breiter Front.`,
        `Durch den erfolgreichen Ausbruch über die psychologische Widerstandslinie hat sich das mittelfristige Chartbild drastisch aufgehellt. Ein Retest des alten Hochs gilt als wahrscheinlich.`,
        `Die Zunahme der Volatilität im Zuge der Zinsentscheidungen führt zu Umschichtungen innerhalb der Sektoren. Defensive Werte bleiben weiterhin stark nachgefragt.`
      ];
    } else if (asset.type === 'forex') {
      headlines = [
        `${sym} reagiert volatil auf die jüngsten Zinsentscheidungen der Zentralbanken`,
        `Makroökonomische Daten stützen die relative Stärke von ${sym}`,
        `Technischer Widerstand bei ${sym} rückt nach geopolitischen Spannungen in den Fokus`
      ];
      insights = [
        `Die geänderten Zinsdifferenzen erzeugen erhöhte Arbitrage-Aktivität im Devisenmarkt. Kapitalströme verlagern sich temporär in renditestärkere Fiskalräume.`,
        `Überraschend robuste Arbeitsmarktdaten und Inflationszahlen stützen das Währungspaar. Händler erwarten anhaltende Volatilität bis zur nächsten FOMC-Sitzung.`,
        `Devisenanalysten melden verstärktes Hedging über Optionen. Die psychologisch wichtige Kursmarke bildet eine extrem starke Barriere.`
      ];
    } else { // commodity or fallback
      headlines = [
        `${name} (${sym}) profitiert von globalen Lieferengpässen und geopolitischen Absicherungen`,
        `Nachfrage-Spike nach ${name}: Industrielle Nutzung erreicht neuen Höchststand`,
        `Inflationsschutz: Investoren flüchten vermehrt in Sachwerte wie ${sym}`
      ];
      insights = [
        `Die physischen Lagerbestände in den Haupthandelsplätzen sinken auf den tiefsten Stand seit Jahren. Lieferkettenstörungen im Schiffsverkehr stützen das Preisniveau weiter.`,
        `Die fortschreitende Dekarbonisierung und Halbleiterproduktion treiben die industrielle Nachfrage nach diesem Rohstoff. Das Angebot hinkt der Nachfrage hinterher.`,
        `Angesichts anhaltend hoher Kerninflationsraten diversifizieren Asset Manager ihre Portfolios vermehrt in Rohstoffe, um die Kaufkraft langfristig abzusichern.`
      ];
    }

    return headlines.map((headline, idx) => {
      const sentimentValue = idx === 0 ? (isPositive ? 'bullish' : 'bearish') : (idx === 1 ? 'neutral' : (isPositive ? 'bullish' : 'neutral'));
      return {
        id: `${sym}_custom_${idx}_${Date.now()}`,
        time: idx === 0 ? 'Gerade eben' : (idx === 1 ? 'vor 12 Min.' : 'vor 45 Min.'),
        symbol: sym,
        headline,
        sentiment: sentimentValue as any,
        impact: (idx === 0 ? 'high' : 'medium') as any,
        routedTo: routings[idx % routings.length],
        insight: insights[idx],
        premium: idx > 0
      };
    });
  };

  // Fetch all assets from server on mount
  // Guests and Free-tier users do not receive the Realtime AI Newsfeed at all,
  // so skip the network call and the rotation loop below entirely for them.
  useEffect(() => {
    if (subscriptionTier === 'Free') return;

    fetch('/api/market-data')
      .then(res => {
        if (!res.ok) throw new Error(`Market data response not ok: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          const nonVariants = data.filter((asset: any) => asset?.name && !asset.name.toLowerCase().includes('variant'));
          setAssets(nonVariants);
        } else {
          console.warn('RealtimeAiNewsfeed: received invalid non-array market data');
        }
      })
      .catch(err => {
        console.error('Error fetching market-data in RealtimeAiNewsfeed:', err);
      });
  }, [subscriptionTier]);

  // Rotate / Push new real-time alerts periodically from assets with priority for Enterprise Scorer assets
  useEffect(() => {
    if (subscriptionTier === 'Free') return;
    if (assets.length === 0) return;

    const interval = setInterval(() => {
      setIsUpdating(true);
      setTimeout(() => {
        // Prioritize assets listed in Enterprise Scorer
        const priorityPool = assets.filter(a => prioritySymbols.includes(a.symbol) || a.symbol === selectedSymbol || watchlist.includes(a.symbol));
        const poolToUse = (priorityPool.length > 0 && Math.random() < 0.85) ? priorityPool : assets;
        const randomAsset = poolToUse[Math.floor(Math.random() * poolToUse.length)];
        const generated = generateCustomAlertsForAsset(randomAsset);
        const template = generated[Math.floor(Math.random() * generated.length)];

        const newAlert: NewsAlert = {
          id: String(Date.now()),
          time: 'Gerade eben',
          symbol: randomAsset.symbol,
          headline: template.headline,
          sentiment: template.sentiment,
          impact: template.impact,
          routedTo: template.routedTo,
          insight: template.insight,
          premium: Math.random() > 0.4
        };

        // Calculate impact score
        const baseScore = randomAsset.score > 10 ? randomAsset.score / 10 : randomAsset.score;
        const adjustedScore = calculateNewsImpactScore(baseScore, template.sentiment, template.impact);

        // Check if adjusted score triggers push notification (only when push notifications are activated by user)
        if ((adjustedScore < 3.0 || adjustedScore > 7.0) && onTriggerPushNotification && pushNotificationsEnabled) {
          const isOnWatchlist = watchlist.includes(randomAsset.symbol);
          onTriggerPushNotification({
            symbol: randomAsset.symbol,
            name: randomAsset.name,
            score: adjustedScore,
            oldScore: Number(baseScore.toFixed(1)),
            headline: template.headline,
            sentiment: template.sentiment,
            impact: template.impact,
            type: randomAsset.type,
            isOnWatchlist
          });
        }

        // Update times for existing alerts
        setAlerts(prev => {
          const updated = prev.map(a => {
            if (a.time === 'Gerade eben') return { ...a, time: 'vor 1 Min.' };
            if (a.time.includes('Min.')) {
              const mins = parseInt(a.time.match(/\d+/)?.[0] || '1');
              return { ...a, time: `vor ${mins + 1} Min.` };
            }
            return a;
          });
          return [newAlert, ...updated.filter(a => a.id !== newAlert.id).slice(0, 5)];
        });
        setIsUpdating(false);
      }, 800);
    }, 14000);

    return () => clearInterval(interval);
  }, [assets, watchlist, prioritySymbols, selectedSymbol, onTriggerPushNotification, pushNotificationsEnabled, subscriptionTier]);

  const handleManualRefresh = () => {
    if (isUpdating || assets.length === 0) return;
    setIsUpdating(true);
    setTimeout(() => {
      const randomAsset = assets[Math.floor(Math.random() * assets.length)];
      const generated = generateCustomAlertsForAsset(randomAsset);
      const template = generated[Math.floor(Math.random() * generated.length)];
      const newAlert: NewsAlert = {
        id: String(Date.now()),
        time: 'Gerade eben',
        symbol: randomAsset.symbol,
        headline: template.headline,
        sentiment: template.sentiment,
        impact: template.impact,
        routedTo: template.routedTo,
        insight: template.insight,
        premium: false
      };
      setAlerts(prev => [newAlert, ...prev.filter(a => a.id !== newAlert.id).slice(0, 4)]);
      setIsUpdating(false);
    }, 600);
  };

  const handleAlertClick = (alert: NewsAlert) => {
    // Subscription constraint logic based on pricing.md
    if (alert.premium && subscriptionTier === 'Free') {
      setSelectedPlanForStripe({
        id: 'Starter',
        price: '7€',
        period: 'Monat',
        desc: 'KI-Analysen & Backtests freischalten'
      });
      setShowCheckoutModal(true);
      return;
    }
    setActiveAlert(alert);
  };

  // Mock Stripe checkout process
  const triggerStripeCheckout = (planName: string, price: string) => {
    alert(
      `[STRIPE PAYMENTS] Leite weiter zu Stripe Checkout...\n\n` +
      `📦 Produkt: AIFinancial ${planName} Subscription\n` +
      `💰 Preis: ${price}/Monat\n` +
      `🔗 URL: stripe.com/checkout/pay/ai_financial_secure_session\n\n` +
      `Dieser Prozess wird später über das Stripe Dashboard & Webhooks vollautomatisch verarbeitet.`
    );
    setShowCheckoutModal(false);
    onUpgradeClick(); // Redirect them to pricing plan overview
  };

  // Access control: Guests and Free-tier users receive no Realtime AI Newsfeed
  // messages at all (per Pricing.md). Show an upgrade card instead of any feed content.
  if (subscriptionTier === 'Free') {
    return (
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col items-center justify-center text-center gap-4 h-full relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-blue-500 to-emerald-500" />
        <div className="p-3 bg-white/5 border border-white/10 text-white/60 rounded-full">
          <Lock size={24} />
        </div>
        <h3 className="text-sm font-black text-white font-display uppercase tracking-tight">
          Realtime AI-Newsfeed – Ab dem Starter-Plan
        </h3>
        <p className="text-xs text-white/50 max-w-sm leading-relaxed">
          Gast- und Free-Nutzer erhalten keine Echtzeit-KI-Newsfeed-Meldungen. Upgraden Sie auf Starter oder höher, um Live-Marktnachrichten und KI-Insights freizuschalten.
        </p>
        <button
          onClick={onUpgradeClick}
          className="px-5 py-2.5 bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(245,196,83,0.3)] transition-all flex items-center gap-2 cursor-pointer"
        >
          <Sparkles size={14} />
          <span>Jetzt upgraden</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col justify-between h-full relative overflow-hidden group">
      {/* Decorative colored top line for visual excellence */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-blue-500 to-emerald-500" />
      
      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
                CAPITAL-AI Global Neural Intelligence Newsfeed
              </span>
            </div>
            <h3 className="text-lg font-black text-white font-display mt-1">Realtime AI-Newsfeed</h3>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <p className="text-xs text-white/50">Multi-Model-Router für globale Echtzeit-Marktindizien</p>
              <span className="text-[9px] font-mono font-bold text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 px-2 py-0.5 rounded-full">
                Synchronisiert mit Enterprise Scorer
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Pushup Notifications Regler / Switch */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/60 hidden sm:inline">
                Push-Alerts:
              </span>
              <button
                type="button"
                onClick={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}
                className="flex items-center gap-2 focus:outline-none cursor-pointer"
                title={pushNotificationsEnabled ? "Push-Benachrichtigungen deaktivieren" : "Push-Benachrichtigungen aktivieren"}
              >
                {pushNotificationsEnabled ? (
                  <Bell size={13} className="text-emerald-400 animate-pulse shrink-0" />
                ) : (
                  <BellOff size={13} className="text-zinc-500 shrink-0" />
                )}
                <span className={`text-[10px] font-black uppercase font-mono ${pushNotificationsEnabled ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  {pushNotificationsEnabled ? 'Aktiv' : 'Inaktiv'}
                </span>
                {/* Regler Switch Pill */}
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors relative ${
                  pushNotificationsEnabled ? 'bg-emerald-500/30 border border-emerald-500/50' : 'bg-zinc-800 border border-zinc-700'
                }`}>
                  <div className={`w-3 h-3 rounded-full transition-transform duration-200 ${
                    pushNotificationsEnabled ? 'translate-x-4 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'translate-x-0 bg-zinc-500'
                  }`} />
                </div>
              </button>
            </div>

            <button 
              disabled={isUpdating}
              onClick={handleManualRefresh}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all cursor-pointer disabled:opacity-50"
              title="Newsfeed manuell aktualisieren"
            >
              <RefreshCw size={14} className={isUpdating ? 'animate-spin text-aif-gold-DEFAULT' : ''} />
            </button>
          </div>
        </div>

        {/* Streaming entries */}
        <div className="space-y-3 pt-1">
          {[...alerts]
            .sort((a, b) => {
              const aPriority = prioritySymbols.includes(a.symbol) || a.symbol === selectedSymbol || watchlist.includes(a.symbol);
              const bPriority = prioritySymbols.includes(b.symbol) || b.symbol === selectedSymbol || watchlist.includes(b.symbol);
              if (aPriority && !bPriority) return -1;
              if (!aPriority && bPriority) return 1;
              return 0;
            })
            .slice(0, maxDisplayItems)
            .map((alert) => {
            const isBullish = alert.sentiment === 'bullish';
            const isBearish = alert.sentiment === 'bearish';
            const isLocked = alert.premium && subscriptionTier === 'Free';
            const isScorerPriority = prioritySymbols.includes(alert.symbol) || alert.symbol === selectedSymbol;

            return (
              <div 
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={`group/item border p-3.5 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden ${
                  isLocked 
                    ? 'bg-white/[0.01] border-white/5 opacity-55 hover:opacity-80' 
                    : 'bg-white/5 border-white/10 hover:border-violet-500/50 hover:bg-violet-950/10'
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded">
                      {alert.symbol}
                    </span>
                    {isScorerPriority && (
                      <span className="text-[9px] font-mono font-bold text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 px-1.5 py-0.5 rounded">
                        Scorer Asset
                      </span>
                    )}
                    <span className="text-[10px] text-white/40 font-mono">
                      {alert.time}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {/* Multi-Model Router Badge */}
                    <span className="text-[9px] font-mono text-white/35 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                      {alert.routedTo}
                    </span>

                    {/* Sentiment Badge */}
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      isBullish ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      isBearish ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-white/10 text-white/60 border border-white/20'
                    }`}>
                      {alert.sentiment}
                    </span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white mt-2 leading-snug group-hover/item:text-aif-gold-DEFAULT transition-colors pr-6">
                  {alert.headline}
                </h4>

                {/* Lock Overlay for Premium Items on Free Tier */}
                {isLocked ? (
                  <div className="absolute right-3 bottom-3 flex items-center gap-1.5 text-xs font-bold text-aif-gold-DEFAULT font-mono bg-black/80 px-2 py-1 rounded border border-aif-gold-DEFAULT/20 shadow-lg z-10">
                    <Lock size={11} />
                    <span>PRO SPECTRUM</span>
                  </div>
                ) : (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all">
                    <ArrowRight size={14} className="text-aif-gold-DEFAULT" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-white/10 text-[10px] font-mono text-white/30 flex justify-between items-center">
        <span>Gesteuert durch CAPITAL-AI Multi-Model Auto-Router</span>
        <span className="text-emerald-400 font-bold">DSGVO Compliant</span>
      </div>

      {/* Modal - Deep AI Insight Details or Stripe Upgrade Trigger */}
      <AnimatePresence>
        {activeAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveAlert(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-white/15 p-6 rounded-2xl max-w-lg w-full relative z-10 shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 to-indigo-500" />
              
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-xs font-black bg-white/10 text-white px-2.5 py-1 rounded">
                  AI DEEP ANALYSE: {activeAlert.symbol}
                </span>
                <span className="text-xs text-white/40 font-mono">{activeAlert.time}</span>
              </div>

              <h3 className="text-base font-bold text-white font-display mb-3 leading-snug">
                {activeAlert.headline}
              </h3>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2.5 text-[10px] text-white/40 font-mono uppercase tracking-wider border-b border-white/5 pb-1.5">
                  <span>Routing Engine</span>
                  <span className="text-violet-400 font-bold">{activeAlert.routedTo}</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed font-sans">
                  {activeAlert.insight}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                  <span className="text-[9px] uppercase font-mono text-white/40 block">Marktimpakt</span>
                  <span className="text-xs font-bold text-white font-mono uppercase mt-0.5 block">{activeAlert.impact} Impact</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                  <span className="text-[9px] uppercase font-mono text-white/40 block">Evidenzqualität</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono uppercase mt-0.5 block flex items-center gap-1">
                    <CheckCircle size={12} /> 98.4% Score
                  </span>
                </div>
              </div>

              {/* pricing.md preview text constraint for Starter Tier */}
              {subscriptionTier === 'Starter' && (
                <div className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/30 p-3 rounded-lg text-xs mb-4 text-aif-gold-DEFAULT leading-relaxed">
                  ⚠️ <span className="font-bold">Upgrade-Hinweis:</span> Sie haben heute Ihr Limit für vollständige KI-Analysen aufgebraucht. Zukünftige KI-Analysen werden nur als Vorschau angezeigt. 
                  <button onClick={() => { setActiveAlert(null); onUpgradeClick(); }} className="underline font-bold ml-1 hover:text-white">Hier auf Pro upgraden</button>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button 
                  onClick={() => setActiveAlert(null)}
                  className="px-5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stripe Payment Integration Modal Placeholder */}
      <AnimatePresence>
        {showCheckoutModal && selectedPlanForStripe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCheckoutModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-zinc-950 border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(245,196,83,0.15)]"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500" />
              
              <div className="text-center space-y-3 mb-6">
                <div className="p-3 bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT w-fit mx-auto rounded-full">
                  <Lock size={28} />
                </div>
                <h3 className="text-xl font-black text-white font-display">AIFinancial Premium freischalten</h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto">
                  Sie versuchen auf eine exklusive Premium-KI-Analyse zuzugreifen. Wählen Sie Ihr Abonnement für vollen Zugriff.
                </p>
              </div>

              {/* stripe-blue-badge indicator */}
              <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl mb-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-blue-400 font-bold font-mono">
                  <span>STRIPE SAFE DIRECT-CONNECT</span>
                  <span className="bg-blue-500 text-black px-1.5 py-0.5 rounded text-[8px]">ACTIVE</span>
                </div>
                <div className="text-xs text-white/70 font-sans leading-relaxed">
                  Unsere Stripe Integration nutzt modernste SCA (Strong Customer Authentication) Sicherheitsstandards nach MiFID II Richtlinien für unbeschwerten Zahlungsverkehr.
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="border border-white/10 rounded-xl p-4 flex justify-between items-center bg-white/5">
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Starter Plan</h4>
                    <p className="text-[10px] text-white/40 font-mono">5 Screenings / Tag + 1 KI-Analyse / Tag</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-mono font-black text-white">7 €</span>
                    <span className="text-[10px] text-white/40 font-mono block">/ Monat</span>
                  </div>
                </div>

                <div className="border border-aif-gold-DEFAULT/30 rounded-xl p-4 flex justify-between items-center bg-aif-gold-DEFAULT/5 relative">
                  <div className="absolute -top-2 right-4 bg-aif-gold-DEFAULT text-black px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                    BESTSELLER
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display">Pro Plan</h4>
                    <p className="text-[10px] text-white/40 font-mono">20 Screenings / Tag + unbegrenzte Backtests + Monte-Carlo</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-mono font-black text-white">29 €</span>
                    <span className="text-[10px] text-white/40 font-mono block">/ Monat</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button 
                  onClick={() => triggerStripeCheckout('Pro', '29 €')}
                  className="w-full py-3 bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(245,196,83,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Jetzt mit Stripe abonnieren</span>
                </button>
                <button 
                  onClick={() => setShowCheckoutModal(false)}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Vielleicht später
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
