import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  TrendingUp, 
  Globe, 
  Orbit, 
  DollarSign, 
  Activity, 
  Sparkles, 
  Check, 
  Sliders, 
  HelpCircle, 
  Gauge, 
  ShieldAlert, 
  Code, 
  Copy, 
  Download, 
  Info,
  Clock,
  Briefcase,
  Layers,
  Zap,
  TrendingDown,
  Percent
} from 'lucide-react';
import { CommodityEvaluationWorkspace } from '../features/commodities/ui';

interface AssetClassConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  scoringEngineName: string;
  features: {
    title: string;
    description: string;
    institutionTool: string;
    metricLabel: string;
    initialValue: number | null;
    unit: string;
  }[];
  weights: {
    [key: string]: number;
  };
  formulaText: string;
  valuationLogic: string;
  exampleValues: {
    asset: string;
    score: number;
    signal: 'BUY' | 'WATCH' | 'AVOID';
    metrics: { [key: string]: string };
  }[];
}

export function AssetUniverseDashboard() {
  const [activeTab, setActiveTab] = useState<string>('crypto');
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);

  // Define asset class models
  const assetClasses: AssetClassConfig[] = [
    {
      id: 'crypto',
      name: 'Kryptowährungen',
      icon: <Coins size={16} />,
      description: 'Analysiere On-chain Ströme, dezentrale Liquidität, Exchange Flows und regulatorische Compliance-Risiken im volatilen Digital-Asset Markt.',
      scoringEngineName: 'Dezentralisierte On-Chain Multi-Faktor Matrix',
      weights: {
        'onchain': 0.40,
        'flows': 0.30,
        'compliance': 0.30
      },
      formulaText: 'Score = (OnChainAnalytics * 0.40) + (ExchangeFlows * 0.30) + (ComplianceRisk * 0.30)',
      valuationLogic: 'Berechnet die fundamentale Gesundheit von Krypto-Netzwerken. Kombiniert On-Chain Aktivität (Netzwerkgebühren, aktive Adressen) mit Liquiditätsbewegungen an zentralen Börsen und bewertet gesetzliche Regulierungs- und Sanktionsrisiken (MICA/SEC-Metriken).',
      features: [
        {
          title: 'On-chain Analytics',
          description: 'Überwacht Transaktionsdichte, aktive Wallet-Adressen, NVT-Verhältnisse (Network Value to Transactions) und Smart Contract Gas-Verbrauch.',
          institutionTool: 'Capital-AI On-Chain Tracker v0.7.0',
          metricLabel: 'On-Chain Aktivitätsscore',
          initialValue: 82,
          unit: '/ 100'
        },
        {
          title: 'Exchange Flows',
          description: 'Verfolgt den Zufluss und Abfluss von Token auf Börsen-Wallets. Hohe Net-Outflows signalisieren Akkumulation und steigende Bullishness.',
          institutionTool: 'Exchange Netflow Oracle',
          metricLabel: 'Akkumulations-Ratio',
          initialValue: 68,
          unit: '/ 100'
        },
        {
          title: 'Compliance & Risk Audit',
          description: 'Quantifiziert regulatorische Risiken, Sanktions-Exposures von Wallets und Smart-Contract-Schwachstellen basierend auf globalen Melderegister-Indizes.',
          institutionTool: 'AML/MiCA Compliance Gate',
          metricLabel: 'Regulatorische Sicherheit',
          initialValue: 75,
          unit: '/ 100'
        }
      ],
      exampleValues: [
        { asset: 'Bitcoin (BTC)', score: 84.5, signal: 'BUY', metrics: { 'On-Chain': 'Hoch', 'Netflow': 'Starke Akkumulation', 'Sicherheit': 'Sehr Hoch' } },
        { asset: 'Ethereum (ETH)', score: 76.2, signal: 'BUY', metrics: { 'On-Chain': 'Mittel-Hoch', 'Netflow': 'Moderate Akkumulation', 'Sicherheit': 'Hoch' } },
        { asset: 'Solana (SOL)', score: 68.4, signal: 'WATCH', metrics: { 'On-Chain': 'Extrem Hoch', 'Netflow': 'Leichte Inflows', 'Sicherheit': 'Mittel' } },
        { asset: 'Meme-Coin Alpha (MCA)', score: 29.8, signal: 'AVOID', metrics: { 'On-Chain': 'Spekulativ', 'Netflow': 'Massive Inflows (Dumping)', 'Sicherheit': 'Kritisch' } }
      ]
    },
    {
      id: 'equities',
      name: 'Aktien',
      icon: <TrendingUp size={16} />,
      description: 'Bewertet Aktien-Wertpapiere nach modernem News-Momentum, Liquiditäts-Volumen und dem fairen inneren Wert nach den Kriterien von Warren Buffett.',
      scoringEngineName: 'Warren Buffett Value & Momentum Engine',
      weights: {
        'momentum': 0.30,
        'priceVol': 0.30,
        'buffetValue': 0.40
      },
      formulaText: 'Score = (NewsMomentum * 0.30) + (PriceVolumeVol * 0.30) + (BuffetValueCheck * 0.40)',
      valuationLogic: 'Kombiniert traditionelles Value Investing mit quantitativen Faktoren. Der Buffett-Score ermittelt Margins of Safety und faire Graham-Innere-Werte, während News-Sentiment und Orderbuch-Volumen kurzfristige Trendstärken validieren.',
      features: [
        {
          title: 'News & Event-Momentum',
          description: 'Erfasst globale Medienberichte, earnings reports und CEO-Sentiment mittels NLP (Natural Language Processing) und Google Search Grounding.',
          institutionTool: 'Sentiment Parser Pro',
          metricLabel: 'Medien-Resonanz',
          initialValue: 74,
          unit: '/ 100'
        },
        {
          title: 'Preis / Volumen / Volatilität',
          description: 'Analysiert Orderbuch-Tiefe, historische Volatilitätsbänder, Durchschnittsvolumen und gleitende Trend-Indikatoren.',
          institutionTool: 'Volatility Band Scanner',
          metricLabel: 'Trend-Festigkeit',
          initialValue: 80,
          unit: '/ 100'
        },
        {
          title: 'Relative Stärke & Buffett Value',
          description: 'Berechnet den fairen inneren Wert (DCF-Graham) auf Basis von Eigenkapitalrendite, Verschuldungsgrad und stabilem Free Cashflow.',
          institutionTool: 'Buffett Value Checker v0.7.0',
          metricLabel: 'Margin of Safety',
          initialValue: 88,
          unit: '/ 100'
        }
      ],
      exampleValues: [
        { asset: 'Apple Inc. (AAPL)', score: 81.4, signal: 'BUY', metrics: { 'Momentum': 'Positiv', 'Volumen': 'Ausgeglichen', 'Buffett Value': '88% Fair' } },
        { asset: 'Tesla Motors (TSLA)', score: 62.5, signal: 'WATCH', metrics: { 'Momentum': 'Volatil / Hoch', 'Volumen': 'Extrem Hoch', 'Buffett Value': 'Premium-KGV' } },
        { asset: 'Zombie Corp (ZMB)', score: 34.0, signal: 'AVOID', metrics: { 'Momentum': 'Negativ', 'Volumen': 'Gering', 'Buffett Value': 'Überschuldet' } }
      ]
    },
    {
      id: 'indices',
      name: 'Indizes',
      icon: <Globe size={16} />,
      description: 'Überwache weltweite Markt-Indizes. Nutze Marktbreiten-Daten, Multi-Timeframe Trend-Regime und adaptive Volatilitätsfilter.',
      scoringEngineName: 'Global Index Breadth & Volatility Filter',
      weights: {
        'breadth': 0.40,
        'regime': 0.35,
        'volFilter': 0.25
      },
      formulaText: 'Score = (MarketBreadth * 0.40) + (MultiTimeframeRegime * 0.35) + (VolatilityFilter * 0.25)',
      valuationLogic: 'Bestimmt die strukturelle Solidität von Aktienmärkten. Ein hoher Score signalisiert ein stabiles Bullen-Regime getragen von einer breiten Mehrheit der gelisteten Einzeltitel bei gleichzeitig sinkendem Stresslevel (VIX).',
      features: [
        {
          title: 'Marktbreite (Advance-Decline)',
          description: 'Berechnet das Verhältnis steigender zu fallender Aktien (A/D-Line), den Bullish Percent Index und das Handelsvolumen-Momentum.',
          institutionTool: 'Market Breadth Matrix',
          metricLabel: 'A/D-Ratio Breite',
          initialValue: 67,
          unit: '/ 100'
        },
        {
          title: 'Multi-Timeframe-Regime',
          description: 'Ermittelt langfristige Trendphasen (Weekly, Daily, H4) und gleitende Durchschnitte, um Trendbrüche frühzeitig zu detektieren.',
          institutionTool: 'Regime Router Engine',
          metricLabel: 'Trend-Regime Übereinstimmung',
          initialValue: 72,
          unit: '/ 100'
        },
        {
          title: 'Volatilitätsfilter (VIX / Risk-Off)',
          description: 'Skaliert Handelsentscheidungen anhand von VIX, ATR und makroökonomischem Systemstress. Schützt vor Fehlsignalen in Panikphasen.',
          institutionTool: 'VIX Volatility Guard',
          metricLabel: 'Volatilitäts-Stabilität',
          initialValue: 85,
          unit: '/ 100'
        }
      ],
      exampleValues: [
        { asset: 'S&P 500 Index (SPX)', score: 73.3, signal: 'WATCH', metrics: { 'Breite': 'Moderat', 'Regime': 'Bullish', 'VIX Stress': 'Sehr Niedrig' } },
        { asset: 'NASDAQ 100 (NDX)', score: 78.5, signal: 'BUY', metrics: { 'Breite': 'Stark', 'Regime': 'Klar Bullish', 'VIX Stress': 'Niedrig' } },
        { asset: 'DAX 40 (DAX)', score: 55.4, signal: 'WATCH', metrics: { 'Breite': 'Schwach', 'Regime': 'Seitwärts', 'VIX Stress': 'Mittel' } }
      ]
    },
    {
      id: 'commodities',
      name: 'Commodities',
      icon: <Orbit size={16} />,
      description: 'Kombiniert den verifizierten Commodity-Markt-Score mit klar getrennten Research-, Klassifizierungs- und Sandbox-Werkzeugen des Rohstoff-Orchestrators.',
      scoringEngineName: 'ScoringDispatcher + Rohstoff-Orchestrator (Research)',
      weights: {
        'trend': 0.30,
        'momentum': 0.25,
        'breakout_quality': 0.20,
        'volatility_quality': 0.25
      },
      formulaText: 'Canonical Market Score = Trend × 0.30 + Momentum × 0.25 + Breakout Quality × 0.20 + Volatility Quality × 0.25',
      valuationLogic: 'Der produktive Markt-Score nutzt ausschließlich verifizierte Preis-Historie. Strukturelle Rohstoff-, Risiko- und Kritikalitätswerte bleiben davon getrennte, nicht kanonische Research-Projektionen.',
      features: [
        {
          title: 'Trend',
          description: 'Verifizierter Trendfaktor aus realen täglichen Schlusskursen.',
          institutionTool: 'Commodity Evidence Scoring',
          metricLabel: 'Trendfaktor',
          initialValue: null,
          unit: '/ 100'
        },
        {
          title: 'Momentum',
          description: 'Verifiziertes Preis-Momentum aus derselben evidenzgebundenen Historie.',
          institutionTool: 'Commodity Evidence Scoring',
          metricLabel: 'Momentumfaktor',
          initialValue: null,
          unit: '/ 100'
        },
        {
          title: 'Breakout Quality',
          description: 'Position des letzten verifizierten Kurses innerhalb der beobachteten Handelsspanne.',
          institutionTool: 'Commodity Evidence Scoring',
          metricLabel: 'Breakout-Qualität',
          initialValue: null,
          unit: '/ 100'
        },
        {
          title: 'Volatility Quality',
          description: 'Qualitätsfaktor auf Basis der realisierten täglichen Renditevolatilität.',
          institutionTool: 'Commodity Evidence Scoring',
          metricLabel: 'Volatilitätsqualität',
          initialValue: null,
          unit: '/ 100'
        }
      ],
      exampleValues: []
    },
    {
      id: 'forex',
      name: 'Forex (Devisen)',
      icon: <DollarSign size={16} />,
      description: 'Zentralkassen-Überwachung für globale Währungs-Paare. Berechnet makroökonomische Zinsdifferenzen, Session-Liquidität und Hedge-Effizienz.',
      scoringEngineName: 'Macro Central Bank Interest & Liquidity Flow Matrix',
      weights: {
        'macro': 0.40,
        'rotation': 0.30,
        'hedgeEfficiency': 0.30
      },
      formulaText: 'Score = (MacroInterestDiff * 0.40) + (SessionVolatilityRotation * 0.30) + (HedgeEfficiency * 0.30)',
      valuationLogic: 'Berechnet die makroökonomische Stärke von Devisenpaaren. Kombiniert die Zinsdifferenzen (Carry Trade Attraktivität) mit Liquiditätsschwankungen der Handels-Sessions (London, New York, Tokio) und der Absicherungs-Effizienz (Basis-Swap Spreads).',
      features: [
        {
          title: 'Zinsdifferenzen / Makrotrend',
          description: 'Berechnet den Spread zwischen den Zentralbankzinsen (FED, EZB, BOJ) und antizipiert Inflationserwartungen für makroökonomische Trends.',
          institutionTool: 'Macro Spread Evaluator',
          metricLabel: 'Zinsvorteil Spread',
          initialValue: 65,
          unit: '% / 100'
        },
        {
          title: 'Volatilität & Session-Rotation',
          description: 'Analysiert die relative Volatilität und das Transaktionsvolumen während der wichtigsten Handelsfenster für präzise Daytrading-Einstiege.',
          institutionTool: 'Session Rotation Monitor',
          metricLabel: 'Liquiditäts-Dichte',
          initialValue: 78,
          unit: '/ 100'
        },
        {
          title: 'Exposure & Hedge-Effizienz',
          description: 'Bewertet Cross-Currency-Basis Spreads und Swap-Kosten für institutionelle Absicherungskosten in internationalen Transaktionen.',
          institutionTool: 'Cross-Currency Swap Engine',
          metricLabel: 'Hedge-Effektivität',
          initialValue: 82,
          unit: '/ 100'
        }
      ],
      exampleValues: [
        { asset: 'EUR / USD', score: 58.2, signal: 'WATCH', metrics: { 'Zinsspread': '0.75%', 'Session-Vol': 'Normal', 'Hedge-Kosten': 'Gering' } },
        { asset: 'USD / JPY', score: 81.6, signal: 'BUY', metrics: { 'Zinsspread': '4.50% (Carry)', 'Session-Vol': 'Sehr Hoch', 'Hedge-Kosten': 'Vorteilhaft' } },
        { asset: 'GBP / CHF', score: 41.5, signal: 'AVOID', metrics: { 'Zinsspread': '-0.50%', 'Session-Vol': 'Niedrig', 'Hedge-Kosten': 'Erhöht' } }
      ]
    }
  ];

  // What-If sliders adjustments state
  const [sliderValues, setSliderValues] = useState<{ [key: string]: number }>({
    'crypto-onchain': 82,
    'crypto-flows': 68,
    'crypto-compliance': 75,
    'equities-momentum': 74,
    'equities-priceVol': 80,
    'equities-buffetValue': 88,
    'indices-breadth': 67,
    'indices-regime': 72,
    'indices-volFilter': 85,
    'forex-macro': 65,
    'forex-rotation': 78,
    'forex-hedgeEfficiency': 82
  });

  const handleSliderChange = (featureId: string, val: number) => {
    setSliderValues(prev => ({
      ...prev,
      [featureId]: val
    }));
  };

  const getFeatureSliderId = (assetClassId: string, title: string): string => {
    const cleanTitle = title.toLowerCase();
    if (assetClassId === 'crypto') {
      if (cleanTitle.includes('on-chain') || cleanTitle.includes('onchain')) return 'crypto-onchain';
      if (cleanTitle.includes('flows')) return 'crypto-flows';
      return 'crypto-compliance';
    }
    if (assetClassId === 'equities') {
      if (cleanTitle.includes('momentum')) return 'equities-momentum';
      if (cleanTitle.includes('preis') || cleanTitle.includes('volumen') || cleanTitle.includes('trend')) return 'equities-priceVol';
      return 'equities-buffetValue';
    }
    if (assetClassId === 'indices') {
      if (cleanTitle.includes('breite')) return 'indices-breadth';
      if (cleanTitle.includes('regime')) return 'indices-regime';
      return 'indices-volFilter';
    }
    if (assetClassId === 'forex') {
      if (cleanTitle.includes('zins') || cleanTitle.includes('macro')) return 'forex-macro';
      if (cleanTitle.includes('rotation') || cleanTitle.includes('volatilität')) return 'forex-rotation';
      return 'forex-hedgeEfficiency';
    }
    return `${assetClassId}-unknown`;
  };

  const activeConfig = assetClasses.find(a => a.id === activeTab) || assetClasses[0];

  // Calculate live score based on sliders
  const calculateLiveScore = (config: AssetClassConfig): number => {
    let score = 0;
    if (config.id === 'crypto') {
      score = sliderValues['crypto-onchain'] * config.weights.onchain + 
              sliderValues['crypto-flows'] * config.weights.flows + 
              sliderValues['crypto-compliance'] * config.weights.compliance;
    } else if (config.id === 'equities') {
      score = sliderValues['equities-momentum'] * config.weights.momentum + 
              sliderValues['equities-priceVol'] * config.weights.priceVol + 
              sliderValues['equities-buffetValue'] * config.weights.buffetValue;
    } else if (config.id === 'indices') {
      score = sliderValues['indices-breadth'] * config.weights.breadth + 
              sliderValues['indices-regime'] * config.weights.regime + 
              sliderValues['indices-volFilter'] * config.weights.volFilter;
    } else if (config.id === 'forex') {
      score = sliderValues['forex-macro'] * config.weights.macro + 
              sliderValues['forex-rotation'] * config.weights.rotation + 
              sliderValues['forex-hedgeEfficiency'] * config.weights.hedgeEfficiency;
    }
    return Number(score.toFixed(1));
  };

  const getTrafficLightSignal = (score: number) => {
    if (score >= 75) return { label: 'BUY (LONG)', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' };
    if (score >= 45) return { label: 'WATCH (NEUTRAL)', color: 'text-aif-gold-DEFAULT border-aif-gold-DEFAULT/20 bg-aif-gold-DEFAULT/10' };
    return { label: 'AVOID (SHORT/RISK)', color: 'text-rose-500 border-rose-500/20 bg-rose-500/10' };
  };

  const liveScore = calculateLiveScore(activeConfig);
  const liveSignal = getTrafficLightSignal(liveScore);

  // JSON Data structure representing this config for direct integration
  const jsonOutput = JSON.stringify({
    version: "0.7.0-Beta",
    timestamp: "2026-07-02T07:26:08Z",
    platform: "CAPITAL-AI",
    asset_universe: assetClasses.map(ac => ({
      id: ac.id,
      name: ac.name,
      description: ac.description,
      scoring_model: ac.scoringEngineName,
      formula: ac.formulaText,
      weights: ac.weights,
      features: ac.features.map(f => ({
        key: f.title.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        label: f.title,
        description: f.description,
        tool: f.institutionTool,
        initial_value: sliderValues[getFeatureSliderId(ac.id, f.title)] ?? f.initialValue
      }))
    }))
  }, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonOutput);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonOutput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CAPITAL-AI-Asset-Universe-Config-v0.7.0.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="ui-stack" id="aif-asset-universe-root">
      
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-aif-gold-DEFAULT/15 via-black/40 to-neutral-950 border border-aif-gold-DEFAULT/20 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden shadow-[0_0_25px_rgba(245,196,83,0.05)]">
        <div className="absolute right-0 top-0 w-80 h-80 bg-aif-gold-DEFAULT/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute left-0 top-0 w-1.5 h-full bg-aif-gold-DEFAULT" />
        
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/30 uppercase">
              ASSET-KLASSEN-UNIVERSUM
            </span>
            <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-white/5 text-white/50 border border-white/10 uppercase">
              v0.7.0 Beta
            </span>
          </div>
          <h1 className="text-xl font-black font-display text-white uppercase tracking-wider flex items-center gap-2">
            <span>Enterprise Multi-Asset Cockpit</span>
          </h1>
          <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
            Institutionelle Marktbeobachtung, Daytrading-Zentrale und quantitative Bewertungslogiken. Wählen Sie eine Assetklasse, um Features zu konfigurieren, mathematische Scores in Echtzeit anzupassen und die Ampel-Handelssignale zu validieren.
          </p>
        </div>
      </div>

      {/* Asset Selection Tabs Menu — Phase 1: BFSG 44px hit targets */}
      <div className="flex flex-wrap bg-neutral-950 p-1 rounded-xl border border-white/5 gap-1.5">
        {assetClasses.map((ac) => (
          <button
            key={ac.id}
            onClick={() => setActiveTab(ac.id)}
            className={`flex-1 min-w-[140px] min-h-11 ui-hit py-3 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 cursor-pointer border ${
              activeTab === ac.id
                ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.2)]'
                : 'text-white/60 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            {ac.icon}
            <span>{ac.name}</span>
          </button>
        ))}
      </div>

      {activeTab === 'commodities' ? (
        <CommodityEvaluationWorkspace />
      ) : (
      /* Main Tab View Card Grid — Phase 1: gap-6 section rhythm */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Overview & Features */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Asset Class Card Details */}
          <div className="ui-panel space-y-4">
            <div className="flex justify-between items-start border-b border-white/5 pb-4">
              <div>
                <span className="text-[9px] font-mono text-aif-gold-DEFAULT uppercase tracking-widest font-black">
                  Assetklasse Spezifikation
                </span>
                <h2 className="text-lg font-black font-display text-white uppercase tracking-wide flex items-center gap-2 mt-1">
                  {activeConfig.icon}
                  <span>{activeConfig.name}</span>
                </h2>
              </div>
              <span className="px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-white/60">
                {activeConfig.scoringEngineName}
              </span>
            </div>

            <p className="text-xs text-white/80 leading-relaxed font-sans">
              {activeConfig.description}
            </p>

            {/* Render 3 Core Features */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest">
                3 Kern-Features & Workflows
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {activeConfig.features.map((feat, i) => (
                  <div key={i} className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-2 hover:border-white/10 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-aif-gold-DEFAULT" />
                        {feat.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20">
                        {feat.institutionTool}
                      </span>
                    </div>
                    
                    <p className="text-[11px] text-white/60 leading-normal">
                      {feat.description}
                    </p>

                    {/* Metric slider panel */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-4">
                      <span className="text-[10px] font-mono text-white/40 uppercase">
                        Live Wert-Regler:
                      </span>
                      <div className="flex items-center gap-3 flex-1 max-w-xs">
                        <input 
                          type="range"
                          min="0"
                          max="100"
                          value={sliderValues[getFeatureSliderId(activeConfig.id, feat.title)] ?? feat.initialValue ?? 0}
                          onChange={(e) => {
                            const mapId = getFeatureSliderId(activeConfig.id, feat.title);
                            handleSliderChange(mapId, parseInt(e.target.value));
                          }}
                          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-aif-gold-DEFAULT"
                        />
                        <span className="font-mono text-xs font-bold text-white shrink-0 min-w-[45px] text-right">
                          {sliderValues[getFeatureSliderId(activeConfig.id, feat.title)] ?? feat.initialValue ?? 0} {feat.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transparent Scoring Formula Details */}
          <div className="ui-panel space-y-4">
            <h3 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest">
              Mathematische Bewertungslogik & Transparenz
            </h3>

            <div className="bg-black/60 border border-white/5 rounded-xl p-4 font-mono space-y-3">
              <div className="text-[10px] text-white/40 uppercase">CAPITAL-AI Scoring-Formel:</div>
              <div className="text-xs text-aif-gold-DEFAULT font-extrabold break-words bg-black/40 p-3 rounded-lg border border-white/5">
                {activeConfig.formulaText}
              </div>
              
              <div className="text-[10px] text-white/40 uppercase pt-2">Untergewichtungsfaktoren:</div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {Object.entries(activeConfig.weights).map(([key, value]) => (
                  <div key={key} className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <div className="text-[9px] text-white/50 uppercase font-mono tracking-wider mb-1">{key}</div>
                    <div className="font-bold text-white text-sm">{(value * 100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed">
              <strong>Berechnungskontext:</strong> {activeConfig.valuationLogic} Alle Werte fließen ohne Glättung direkt in die Endberechnung ein. Bei unvollständigen Werten greifen BaFin-konforme Risikoabschläge auf die Konfidenz.
            </p>
          </div>

        </div>

        {/* Right Side: What-If Sandbox & Live Score */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Interactive What-If Score Meter */}
          <div className="ui-panel border-2 border-aif-gold-DEFAULT/30 relative overflow-hidden text-center space-y-4 shadow-[0_0_30px_rgba(245,196,83,0.05)]">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-aif-gold-DEFAULT" />
            
            <div className="space-y-1">
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 uppercase">
                Tuning Sandbox
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-1.5">
                Echtzeit Multi-Faktor Score
              </h3>
            </div>

            {/* Circular score gauge */}
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              {/* Outer circular gradient border */}
              <div className="absolute inset-0 rounded-full border border-white/10" />
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-white/5 animate-spin-slow" />
              
              <div className="text-center z-10">
                <div className="text-5xl font-mono font-black text-white leading-none">
                  {liveScore}
                </div>
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">
                  Punkte / 100
                </div>
              </div>
            </div>

            {/* Buy / Watch / Avoid traffic light signal */}
            <div className={`border rounded-xl p-4 transition-all duration-300 ${liveSignal.color}`}>
              <div className="text-[10px] font-mono uppercase opacity-70">Ampel-Handelssignal</div>
              <div className="text-lg font-black tracking-wider uppercase font-display mt-0.5">
                {liveSignal.label}
              </div>
            </div>

            <p className="text-[10px] text-white/40 italic font-mono leading-normal">
              Passen Sie die Slider links an, um die Auswirkungen auf das Signal in Echtzeit zu simulieren. Geeignet für Daytrading, Scalping und quantitative Risiko-Checks.
            </p>
          </div>

          {/* Example Assets table of each universe */}
          <div className="ui-panel space-y-3.5">
            <h3 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
              <Layers size={14} className="text-aif-gold-DEFAULT" />
              <span>Standard-Universum Beispielwerte</span>
            </h3>

            <div className="overflow-x-auto border border-white/5 rounded-xl">
              <table className="w-full text-left text-xs font-mono text-white/80">
                <thead className="bg-white/5 text-[9px] uppercase tracking-wider text-white/50 border-b border-white/10">
                  <tr>
                    <th className="p-3">Asset</th>
                    <th className="p-3 text-center">Score</th>
                    <th className="p-3 text-right">Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  {activeConfig.exampleValues.map((ex, idx) => {
                    const signalStyle = ex.signal === 'BUY' 
                      ? 'text-emerald-400 font-bold bg-emerald-500/10 border-emerald-500/20' 
                      : ex.signal === 'WATCH' 
                      ? 'text-aif-gold-DEFAULT font-bold bg-aif-gold-DEFAULT/10 border-aif-gold-DEFAULT/20' 
                      : 'text-rose-500 font-bold bg-rose-500/10 border-rose-500/20';
                    return (
                      <tr key={idx} className="hover:bg-white/5 transition-all">
                        <td className="p-3 font-sans font-extrabold text-white">
                          {ex.asset}
                        </td>
                        <td className="p-3 text-center text-white font-bold font-mono">
                          {ex.score}
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] border font-black uppercase tracking-wider ${signalStyle}`}>
                            {ex.signal}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* JSON Schema Export & Tech Stack Recommendation */}
          <div className="ui-panel space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Code size={14} className="text-aif-gold-DEFAULT" />
                <span>JSON Integrations-Struktur</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="ui-hit min-h-11 min-w-11 inline-flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="JSON in Zwischenablage kopieren"
                >
                  {copiedStatus ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="ui-hit min-h-11 min-w-11 inline-flex items-center justify-center bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="JSON-Datei herunterladen"
                >
                  <Download size={12} />
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="text-[10px] font-mono text-white/70 bg-black/80 rounded-xl p-4 border border-white/5 overflow-x-auto max-h-48 leading-relaxed">
                <code>{jsonOutput}</code>
              </pre>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3">
              <h4 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <Info size={12} className="text-aif-gold-DEFAULT" />
                <span>Modul-Empfehlung des Architekten</span>
              </h4>
              <p className="text-[10px] text-white/60 leading-normal font-sans">
                <strong>Architektur-Muster:</strong> Jeder dieser Reiter sollte als separates Service-Modul unter <code className="font-mono text-white bg-white/5 px-1 py-0.5 rounded">src/services/scoring/</code> gekapselt werden, um die Berechnungslogik von der UI zu trennen. Alle Klassen erben von einem gemeinsamen Interface <code className="font-mono text-white bg-white/5 px-1 py-0.5 rounded">AssetScoringProvider</code>. Das ermöglicht die einfache Erweiterung um neue Anlageklassen (wie Real Estate) ohne Refactoring des UI-Layers.
              </p>
            </div>
          </div>

        </div>

      </div>
      )}

    </div>
  );
}
