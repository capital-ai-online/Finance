import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Gauge, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Globe, 
  Info,
  Search,
  Zap,
  Sliders,
  ChevronRight,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Activity,
  Award
} from 'lucide-react';

interface SentimentDriver {
  text: string;
  impact: 'Bullisch' | 'Bearisch' | 'Neutral';
}

interface SentimentSource {
  title: string;
  url: string;
  sentiment: 'Bullisch' | 'Bearisch' | 'Neutral';
}

interface SentimentData {
  score: number;
  label: string;
  summary: string;
  drivers: SentimentDriver[];
  sources: SentimentSource[];
}

interface ShockAnalysisResult {
  originalScore: number;
  newScore: number;
  impactLabel: string;
  transmissionMechanism: string;
  predictedDrivers: SentimentDriver[];
  riskLevel: 'Niedrig' | 'Mittel' | 'Hoch' | 'Extrem';
}

// Preset assets for the dashboard summary
const SENTIMENT_PRESET_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', type: 'Crypto', initialScore: 82, label: 'Extrem Bullisch' },
  { symbol: 'ETH', name: 'Ethereum', type: 'Crypto', initialScore: 74, label: 'Bullisch' },
  { symbol: 'NVDA', name: 'NVIDIA', type: 'Stock', initialScore: 91, label: 'Extrem Bullisch' },
  { symbol: 'AAPL', name: 'Apple', type: 'Stock', initialScore: 72, label: 'Bullisch' },
  { symbol: 'TSLA', name: 'Tesla', type: 'Stock', initialScore: 48, label: 'Neutral' },
  { symbol: 'EURUSD', name: 'EUR / USD', type: 'Forex', initialScore: 54, label: 'Neutral' },
  { symbol: 'GLD', name: 'Gold', type: 'Commodity', initialScore: 68, label: 'Bullisch' },
  { symbol: 'USO', name: 'Rohöl', type: 'Commodity', initialScore: 41, label: 'Bearisch' }
];

const SECTOR_SENTIMENT_DATA = [
  { subject: 'Kryptowährungen', A: 78, fullMark: 100 },
  { subject: 'Technologie-Aktien', A: 84, fullMark: 100 },
  { subject: 'Finanzwesen', A: 62, fullMark: 100 },
  { subject: 'Rohstoffe', A: 58, fullMark: 100 },
  { subject: 'Devisen (Forex)', A: 52, fullMark: 100 },
  { subject: 'Energie / Utility', A: 45, fullMark: 100 }
];

const HISTORICAL_SENTIMENT_DATA = [
  { date: '25.06', score: 58 },
  { date: '26.06', score: 62 },
  { date: '27.06', score: 60 },
  { date: '28.06', score: 67 },
  { date: '29.06', score: 71 },
  { date: '30.06', score: 69 },
  { date: '01.07', score: 74 }
];

const SHOCK_SCENARIOS = [
  {
    id: 'fed-cut',
    title: 'Fed senkt Leitzins überraschend um 50 Basispunkte',
    description: 'Drastische Lockerung der US-Geldpolitik zur Ankurbelung der Wirtschaftsaktivität.',
    category: 'Makroökonomie',
    defaultShock: 'Fed-Zinssenkung um 50 BP'
  },
  {
    id: 'supply-chain',
    title: 'Globale Transportkrise im asiatischen Seeweg verschärft sich',
    description: 'Verstopfte Häfen und gestiegene Frachtraten dämpfen weltweiten Warenhandel.',
    category: 'Infrastruktur',
    defaultShock: 'Transportkrise Asien Lieferketten-Störung'
  },
  {
    id: 'crypto-ban',
    title: 'Strikte EU-Geldwäsche-Verordnung für selbstverwaltete Wallets',
    description: 'Regulatorische Daumenschrauben schränken Anonymität im Krypto-Bereich ein.',
    category: 'Regulierung',
    defaultShock: 'Strikte EU-Regulierung selbstverwaltete Wallets'
  },
  {
    id: 'tech-earnings-beat',
    title: 'NVIDIA meldet Umsatzverdopplung im KI-Sektor',
    description: 'Nachfrage-Boom nach Rechenleistung übertrifft Analystenschätzungen massiv.',
    category: 'Unternehmenszahlen',
    defaultShock: 'NVIDIA übertrifft Erwartungen bei KI-Chips'
  },
  {
    id: 'oil-opec-cut',
    title: 'OPEC+ kündigt unerwartete Reduzierung der Fördermengen an',
    description: 'Koalition drosselt tägliches Angebot um 1 Million Barrel, um Ölpreis zu stützen.',
    category: 'Rohstoffe',
    defaultShock: 'OPEC+ drosselt Rohöl-Förderung um 1 Mio Barrel'
  }
];

export function SentimentDashboard() {
  const [activeAsset, setActiveAsset] = useState<string>('BTC');
  const [activeClass, setActiveClass] = useState<string>('Crypto');
  const [loading, setLoading] = useState<boolean>(false);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Custom search states
  const [customSymbol, setCustomSymbol] = useState<string>('');
  const [customClass, setCustomClass] = useState<string>('Stock');

  // Impact analysis states
  const [simAsset, setSimAsset] = useState<string>('BTC');
  const [simClass, setSimClass] = useState<string>('Crypto');
  const [customShockText, setCustomShockText] = useState<string>('');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<ShockAnalysisResult | null>(null);
  const [simError, setSimError] = useState<string | null>(null);

  // Load initial preset sentiment when component mounts or activeAsset changes
  useEffect(() => {
    fetchSentimentData(activeAsset, activeClass);
  }, [activeAsset]);

  const fetchSentimentData = async (symbol: string, assetClass: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/market-sentiment?symbol=${encodeURIComponent(symbol)}&assetClass=${encodeURIComponent(assetClass)}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Fehler beim Laden der API (Status ${response.status})`);
      }
      if (data.error) {
        throw new Error(data.error);
      }
      setSentimentData(data);
    } catch (err: any) {
      console.error('Error loading sentiment:', err);
      setError(err.message || 'Sentiment-Recherche konnte vorübergehend nicht abgeschlossen werden.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymbol.trim()) return;
    const cleanSym = customSymbol.trim().toUpperCase();
    setActiveAsset(cleanSym);
    setActiveClass(customClass);
  };

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const shockText = customShockText.trim();
    if (!shockText) return;

    setSimulating(true);
    setSimError(null);
    setSimResult(null);

    try {
      const response = await fetch('/api/market-sentiment/analyze-shock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: simAsset,
          assetClass: simClass,
          shockScenario: shockText
        })
      });

      if (!response.ok) {
        throw new Error(`Analysefehler: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      setSimResult(result);
    } catch (err: any) {
      console.error('Error analyzing shock:', err);
      setSimError(err.message || 'Die KI-basierte Schockanalyse ist vorübergehend fehlgeschlagen.');
    } finally {
      setSimulating(false);
    }
  };

  const selectPresetShock = (shockText: string) => {
    setCustomShockText(shockText);
  };

  // UI helper colors
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 55) return 'text-green-400';
    if (score >= 45) return 'text-amber-400';
    if (score >= 25) return 'text-orange-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 55) return 'bg-green-500/10 border-green-500/20';
    if (score >= 45) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const getImpactBadge = (impact: 'Bullisch' | 'Bearisch' | 'Neutral') => {
    switch (impact) {
      case 'Bullisch':
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
      case 'Bearisch':
        return 'bg-rose-500/10 border border-rose-500/20 text-rose-400';
      default:
        return 'bg-amber-500/10 border border-amber-500/20 text-amber-400';
    }
  };

  return (
    <div id="sentiment-dashboard-root" className="space-y-8 pb-12">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-display font-black text-white text-2xl tracking-tight uppercase">
            AI-gestütztes <span className="text-aif-gold-DEFAULT">Grounded Markt-Sentiment</span>
          </h2>
          <p className="text-xs text-white/50 font-mono mt-1">
            Echtzeit-Nachrichtenrecherche mit Google Search Grounding & NLP-Klassifizierung über Gemini 3.5 Flash
          </p>
        </div>
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg font-mono text-[10px] text-white/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>REAL-TIME PIPELINE AKTIV</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-aif-gold-DEFAULT/5 blur-2xl rounded-full" />
          <p className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Globaler Sentiment-Index</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-mono font-black text-white">68</span>
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-black bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Bullisch</span>
          </div>
          <p className="text-[10px] text-white/50 mt-2 font-sans">Gewichteter Durchschnitt der Top-10 Assets</p>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <p className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Stärkster Sektor</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-bold text-white leading-tight">Tech-Aktien</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">84 Index</span>
          </div>
          <p className="text-[10px] text-white/50 mt-2 font-sans">Getrieben durch anhaltende KI-Chip-Nachfrage</p>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full" />
          <p className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Schwächster Sektor</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-bold text-white leading-tight">Energie</span>
            <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">45 Index</span>
          </div>
          <p className="text-[10px] text-white/50 mt-2 font-sans">Mäßiger Abgabedruck wegen Rohöl-Konsolidierung</p>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full" />
          <p className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Analysegrundlage</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-mono font-black text-white">450+</span>
            <span className="text-[10px] font-mono text-indigo-400 uppercase font-black bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Quellen</span>
          </div>
          <p className="text-[10px] text-white/50 mt-2 font-sans">Gescannte Finanzheadlines in den letzten 24h</p>
        </div>
      </div>

      {/* Bento Grid: preset sentiment trackers */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 flex items-center gap-1.5">
            <Activity size={14} className="text-aif-gold-DEFAULT" />
            Bento Grid Asset-Sentiment-Tracker
          </h3>
          <span className="text-[10px] text-white/40 font-mono uppercase">Für Deep-Dive anklicken</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SENTIMENT_PRESET_ASSETS.map((asset) => {
            const isActive = activeAsset === asset.symbol;
            return (
              <motion.button
                key={asset.symbol}
                onClick={() => {
                  setActiveAsset(asset.symbol);
                  setActiveClass(asset.type);
                }}
                whileHover={{ y: -3 }}
                className={`p-4 rounded-xl text-left border relative overflow-hidden transition-all ${
                  isActive 
                    ? 'bg-gradient-to-br from-white/5 to-white/10 border-aif-gold-DEFAULT/50 shadow-[0_0_15px_rgba(245,196,83,0.1)]' 
                    : 'bg-black/30 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-sm text-white">{asset.symbol}</span>
                      <span className="text-[8px] font-mono text-white/40 uppercase bg-white/5 px-1 py-0.2 rounded">
                        {asset.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 font-sans mt-0.5">{asset.name}</p>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${getScoreColor(asset.initialScore)}`}>
                    {asset.initialScore}%
                  </span>
                </div>

                {/* Mini linear indicator bar */}
                <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                  <div 
                    className={`h-full ${
                      asset.initialScore >= 75 ? 'bg-emerald-400' : asset.initialScore >= 45 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${asset.initialScore}%` }}
                  />
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5 text-[9px] font-mono text-white/40">
                  <span>STATUS: {asset.label}</span>
                  {isActive && <span className="text-aif-gold-DEFAULT font-bold flex items-center gap-0.5">Aktiv <ChevronRight size={8} /></span>}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Section: Search & Active Asset deep analysis + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 8 Columns: Deep Analysis & Grounded Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Custom Ticker Search Form */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <form onSubmit={handleCustomSearch} className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
                  Beliebiges Asset / Ticker analysieren
                </label>
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    placeholder="z.B. AAPL, BTC, TSLA, GLD, MSFT..."
                    className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT transition-colors"
                  />
                </div>
              </div>

              <div className="w-full sm:w-48 space-y-1">
                <label className="text-[10px] font-mono uppercase text-white/40 tracking-wider">
                  Asset-Klasse
                </label>
                <select
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white/80 focus:outline-none focus:border-aif-gold-DEFAULT cursor-pointer"
                >
                  <option value="Crypto">Krypto (Crypto)</option>
                  <option value="Stock">Aktien (Stock)</option>
                  <option value="Forex">Devisen (Forex)</option>
                  <option value="Commodity">Rohstoffe (Commodity)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !customSymbol.trim()}
                className="w-full sm:w-auto px-6 py-2.5 bg-aif-gold-DEFAULT text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-aif-gold-light transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 self-end"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>Analyse starten</span>
              </button>
            </form>
          </div>

          {/* Deep-Dive Active Asset Analysis Card */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden min-h-[400px]">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[50px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 blur-[50px] rounded-full" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <Gauge className="text-aif-gold-DEFAULT animate-pulse" size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-white text-base tracking-wide">Fokus-Asset Sentiment</h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 uppercase">
                      {activeAsset}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 font-mono mt-0.5 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Kategorie: {activeClass} • Grounded News Engine
                  </p>
                </div>
              </div>

              <button
                onClick={() => fetchSentimentData(activeAsset, activeClass)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin text-aif-gold-DEFAULT' : ''} />
                <span>Neu laden</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-16 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-aif-gold-DEFAULT animate-spin" />
                    <Sparkles className="absolute text-aif-gold-DEFAULT animate-bounce" size={22} />
                  </div>
                  <div className="text-center max-w-sm space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT">AI Recherche-Pipeline</span>
                    <p className="text-xs text-white/80 font-medium">Recherchiere Finanznachrichten und analysiere Sentiment...</p>
                  </div>
                </motion.div>
              ) : error ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wide">Analyse fehlgeschlagen</h4>
                    <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">{error}</p>
                  </div>
                  <button
                    onClick={() => fetchSentimentData(activeAsset, activeClass)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold hover:bg-white/10 text-white transition-all cursor-pointer"
                  >
                    Erneut versuchen
                  </button>
                </motion.div>
              ) : sentimentData ? (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-6"
                >
                  {/* Left Column: Index Gauge & Summary */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/5 text-center space-y-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Sentiment-Koeffizient</span>
                    
                    {/* Gauge Chart */}
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="72" cy="72" r="58" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <motion.circle 
                          cx="72" cy="72" r="58" fill="transparent" 
                          stroke="url(#dash-sentiment-grad)" strokeWidth="8" strokeDasharray="364.4"
                          initial={{ strokeDashoffset: 364.4 }}
                          animate={{ strokeDashoffset: 364.4 - (364.4 * sentimentData.score) / 100 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="dash-sentiment-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#f5c453" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="flex flex-col items-center z-10">
                        <span className={`text-3xl font-mono font-black ${getScoreColor(sentimentData.score)}`}>
                          {sentimentData.score}
                        </span>
                        <span className="text-[9px] text-white/40 uppercase font-mono tracking-widest mt-0.5">INDEX</span>
                      </div>
                    </div>

                    <div className="space-y-3 w-full">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getImpactBadge(sentimentData.label as any)}`}>
                        {sentimentData.label}
                      </span>
                      <p className="text-xs text-white/80 leading-relaxed font-medium pt-3 border-t border-white/5">
                        {sentimentData.summary}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Drivers & Sources */}
                  <div className="md:col-span-7 space-y-4">
                    {/* Drivers */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-aif-gold-DEFAULT" />
                        Identifizierte Markttreiber
                      </h4>
                      <div className="space-y-1.5">
                        {sentimentData.drivers && sentimentData.drivers.length > 0 ? (
                          sentimentData.drivers.map((drv, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs">
                              <span className="text-white/80 font-medium leading-relaxed">{drv.text}</span>
                              <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${getImpactBadge(drv.impact)}`}>
                                {drv.impact}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-white/40 italic">Keine expliziten Treiber identifiziert.</p>
                        )}
                      </div>
                    </div>

                    {/* Researched news */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                        <Globe size={12} className="text-indigo-400" />
                        Gegroundete Echtzeit-Nachrichtenheadlines
                      </h4>
                      <div className="space-y-1.5">
                        {sentimentData.sources && sentimentData.sources.length > 0 ? (
                          sentimentData.sources.slice(0, 3).map((src, i) => (
                            <a 
                              key={i}
                              href={src.url || '#'}
                              target={src.url ? '_blank' : undefined}
                              rel={src.url ? 'noopener noreferrer' : undefined}
                              className={`block p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 transition-all group ${src.url ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-white/90 font-semibold group-hover:text-aif-gold-light transition-colors line-clamp-1">
                                      {src.title || 'Aktueller Nachrichtenbericht'}
                                    </span>
                                    {src.url && <ExternalLink size={8} className="text-white/30 flex-shrink-0" />}
                                  </div>
                                  <p className="text-[9px] text-white/40 font-mono">
                                    {src.url ? new URL(src.url).hostname : 'Google Search Grounding Quelle'}
                                  </p>
                                </div>
                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${getImpactBadge(src.sentiment)}`}>
                                  {src.sentiment}
                                </span>
                              </div>
                            </a>
                          ))
                        ) : (
                          <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg text-xs text-white/40 italic">
                            Keine direkten Newsheadlines zu diesem Ticker indiziert.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Right 4 Columns: Sector Radar & Trend Charts */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Historical Trend Area Chart */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 mb-4 flex items-center gap-1.5">
              <Activity size={14} className="text-aif-gold-DEFAULT" />
              Verlauf Sentiment-Trend (7 Tage)
            </h3>
            
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HISTORICAL_SENTIMENT_DATA} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f5c453" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f5c453" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={9} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={9} domain={[30, 100]} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}
                    itemStyle={{ fontSize: '11px', color: '#f5c453', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#f5c453" strokeWidth={2} fillOpacity={1} fill="url(#trendGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[10px] font-mono text-white/40">
              <span>MA7 TREND-UPDATE</span>
              <span className="text-emerald-400 font-bold">+12.4% ANSTIEG</span>
            </div>
          </div>

          {/* Sector Sentiment Radar Chart */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 mb-4 flex items-center gap-1.5">
              <Sliders size={14} className="text-indigo-400" />
              Sektor-Sentiment Index
            </h3>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={SECTOR_SENTIMENT_DATA}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.5)" fontSize={8} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.1)" tick={false} />
                  <Radar name="Index" dataKey="A" stroke="#f5c453" fill="#f5c453" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[10px] font-mono text-white/40">
              <span>KLASSIFIZIERUNG: GEMINI</span>
              <span className="text-white/60">6 SEKTOREN AKTIV</span>
            </div>
          </div>

        </div>
      </div>

      {/* Interactive What-If Sentiment Analysis Sandbox */}
      <div className="bg-gradient-to-br from-indigo-950/20 via-black/40 to-emerald-950/10 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
        {/* Decorative ambient spots */}
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -translate-y-1/2 pointer-events-none" />

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <Zap className="text-indigo-400 animate-pulse" size={20} />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-base tracking-wide uppercase">
              CAPITAL-AI Sentiment Shock Analysator
            </h3>
            <p className="text-[10px] text-white/50 font-mono mt-0.5">
              Analysiere makroökonomische Extremereignisse und berechne theoretische Sentimentübertragungen auf Assets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Input parameters */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">1. Szenariovorgaben wählen</span>
              <div className="grid grid-cols-2 gap-2">
                {SHOCK_SCENARIOS.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => selectPresetShock(scen.defaultShock)}
                    className="p-2.5 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-left transition-all group"
                  >
                    <p className="text-[9px] font-mono text-indigo-400 uppercase font-black tracking-wider mb-1">{scen.category}</p>
                    <p className="text-[10px] text-white/70 font-semibold leading-snug group-hover:text-white transition-colors line-clamp-1">{scen.title}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleRunSimulation} className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">2. Ziel-Asset & Schock konfigurieren</span>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <select
                      value={simAsset}
                      onChange={(e) => {
                        setSimAsset(e.target.value);
                        // Align asset class automatically
                        const found = SENTIMENT_PRESET_ASSETS.find(a => a.symbol === e.target.value);
                        if (found) setSimClass(found.type);
                      }}
                      className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-white/80 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {SENTIMENT_PRESET_ASSETS.map(a => (
                        <option key={a.symbol} value={a.symbol}>{a.symbol} ({a.name})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/2">
                    <input
                      type="text"
                      disabled
                      value={simClass}
                      className="w-full px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-xs font-mono text-white/40"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <textarea
                  value={customShockText}
                  onChange={(e) => setCustomShockText(e.target.value)}
                  placeholder="Beschreibe das Schock-Szenario im Detail (z.B. Fed Zinserhöhung um 75 Basispunkte oder Hacker-Angriff auf globale Krypto-Börse...)"
                  className="w-full h-24 p-3 bg-black/40 border border-white/10 rounded-xl text-xs font-medium text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
                  maxLength={250}
                />
              </div>

              <button
                type="submit"
                disabled={simulating || !customShockText.trim()}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all cursor-pointer shadow-lg shadow-indigo-950/50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap size={14} className={simulating ? 'animate-bounce text-aif-gold-DEFAULT' : ''} />
                <span>{simulating ? 'KI-Analyse berechnet...' : 'Schock-Einfluss analysieren'}</span>
              </button>
            </form>
          </div>

          {/* Right: Simulation output display */}
          <div className="lg:col-span-7 bg-black/50 border border-white/5 rounded-xl p-5 relative min-h-[300px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {simulating ? (
                <motion.div 
                  key="simulating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10 p-6 rounded-xl space-y-4 text-center"
                >
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
                  <div className="space-y-1 max-w-xs">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">Geopolitische Transmission</span>
                    <p className="text-xs text-white/80 font-medium">Gemini 3.5 Flash analysiert Übertragungskanäle und Markt-Drivers...</p>
                  </div>
                </motion.div>
              ) : simError ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                    <AlertTriangle size={20} />
                  </div>
                  <p className="text-xs text-white/60">{simError}</p>
                </motion.div>
              ) : simResult ? (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        Analyse Erfolgreich
                      </span>
                      <h4 className="font-display font-black text-white text-base tracking-wide mt-1.5 uppercase">
                        Szenario-Bericht für {simAsset}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono text-white/40 block">RISIKO-PROFIL</span>
                      <span className={`text-xs font-mono font-black ${
                        simResult.riskLevel === 'Extrem' ? 'text-rose-500' : simResult.riskLevel === 'Hoch' ? 'text-orange-400' : 'text-emerald-400'
                      }`}>
                        {simResult.riskLevel}
                      </span>
                    </div>
                  </div>

                  {/* Dual Gauge meters */}
                  <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/5 rounded-xl p-4">
                    <div>
                      <span className="text-[9px] font-mono text-white/40 uppercase block">Basis-Sentiment</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-mono font-black text-white/70">{simResult.originalScore}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-white/30" style={{ width: `${simResult.originalScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-indigo-400 uppercase block">Projiziertes Sentiment</span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className={`text-2xl font-mono font-black ${getScoreColor(simResult.newScore)}`}>
                          {simResult.newScore}%
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${
                          simResult.newScore >= simResult.originalScore ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {simResult.newScore >= simResult.originalScore ? '+' : ''}
                          {simResult.newScore - simResult.originalScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                        <div className={`h-full ${
                          simResult.newScore >= simResult.originalScore ? 'bg-emerald-400' : 'bg-rose-400'
                        }`} style={{ width: `${simResult.newScore}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Impact and Transmission Mechanism */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-white/40 uppercase block">Übertragungsmechanismus</span>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                      <p className="text-xs text-white/90 leading-relaxed font-sans font-medium">
                        {simResult.transmissionMechanism}
                      </p>
                    </div>
                  </div>

                  {/* Predicted Drivers */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono text-white/40 uppercase block">Projizierte Marktdreiber nach Schock</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {simResult.predictedDrivers && simResult.predictedDrivers.map((drv, i) => (
                        <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between gap-2 text-xs">
                          <span className="text-white/80 font-medium truncate">{drv.text}</span>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${getImpactBadge(drv.impact)}`}>
                            {drv.impact}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                    <Sliders size={20} />
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-mono uppercase text-white/60">Analyse-Ausgabe</h5>
                    <p className="text-[11px] text-white/40 max-w-xs mx-auto">
                      Bitte konfiguriere links die Parameter und starte die KI-Analyse, um Ergebnisse zu berechnen.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Bottom footnote */}
            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-white/40">
              <span>SANDBOX VERSE: 0.7.0</span>
              <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-indigo-400" /> DSGVO-Konform</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
