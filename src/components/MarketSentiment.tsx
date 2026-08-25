import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gauge, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Globe, 
  CheckCircle, 
  ChevronRight,
  Info
} from 'lucide-react';
import { authFetch } from '../lib/authFetch';

interface MarketSentimentProps {
  selectedSymbol: string;
  assetClass?: string;
}

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

export function MarketSentiment({ selectedSymbol, assetClass = 'Crypto' }: MarketSentimentProps) {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  // Loading simulation messages to improve UX for the deep-grounding request
  const loadingSteps = [
    'Sende Agenten zur Echtzeit-Nachrichtenrecherche...',
    'Initialisiere Google Search Grounding Schnittstelle...',
    'Rufe die neuesten Meldungen der letzten 24 Stunden ab...',
    'Führe Deep-Sentiment-Klassifizierung mit Gemini 3.5 Flash durch...',
    'Berechne gewichteten Sentiment-Score und Markttreiber...',
    'Bereite Echtzeit-Dashboard-Visualisierung vor...'
  ];

  const fetchSentiment = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    // Simulate stepping through stages for the user to understand what the AI is doing
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1800);

    try {
      // SECURITY (2026-08-25, Router-Anbindung): /api/market-sentiment verlangt jetzt eine
      // verifizierte Identitaet (konsistent mit /api/chat) - authFetch() haengt das Bearer-Token an.
      const response = await authFetch(`/api/market-sentiment?symbol=${encodeURIComponent(selectedSymbol)}&assetClass=${encodeURIComponent(assetClass)}`);
      const result = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(result.error || `Fehler beim Laden (Status ${response.status})`);
      }
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Safeguard array values or formats in compliance with AGENTS.md Data Integrity
      const sanitizedData: SentimentData = {
        score: typeof result.score === 'number' ? result.score : 50,
        label: result.label || 'Neutral',
        summary: result.summary || 'Keine Zusammenfassung verfügbar.',
        drivers: Array.isArray(result.drivers) ? result.drivers : [],
        sources: Array.isArray(result.sources) ? result.sources : []
      };

      setData(sanitizedData);
    } catch (err: any) {
      console.error('Error in Market Sentiment:', err);
      setError(err.message || 'Die Echtzeit-Suche konnte vorübergehend nicht abgeschlossen werden. Bitte versuche es erneut.');
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
  }, [selectedSymbol, assetClass]);

  // Color helper functions depending on score or sentiment labels
  const getScoreColorClass = (score: number) => {
    if (score >= 75) return 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]';
    if (score >= 55) return 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]';
    if (score >= 45) return 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]';
    if (score >= 25) return 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]';
    return 'text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.5)]';
  };

  const getScoreGlowBorder = (score: number) => {
    if (score >= 75) return 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]';
    if (score >= 55) return 'border-green-500/30 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.08)]';
    if (score >= 45) return 'border-amber-500/30 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.08)]';
    return 'border-rose-500/30 bg-rose-500/5 shadow-[0_0_20px_rgba(239,68,68,0.1)]';
  };

  const getImpactBadgeClass = (impact: 'Bullisch' | 'Bearisch' | 'Neutral') => {
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
    <div 
      id="market-sentiment-widget"
      className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden transition-all duration-300"
    >
      {/* Visual Accent Layer */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border border-white/10">
            <Gauge className="text-aif-gold-DEFAULT animate-pulse" size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-white text-base tracking-wide">AI Markt-Sentiment</h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 uppercase">
                {selectedSymbol}
              </span>
            </div>
            <p className="text-[11px] text-white/50 font-mono mt-0.5 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Echtzeit Google Search Grounding & Gemini 3.5 Flash
            </p>
          </div>
        </div>

        <button
          onClick={fetchSentiment}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sentiment neu berechnen"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin text-aif-gold-DEFAULT' : ''} />
          <span>Aktualisieren</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          /* Loading State with animated steps & shimmers */
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-12 flex flex-col items-center justify-center space-y-6"
          >
            <div className="relative flex items-center justify-center">
              {/* Spinning active ring */}
              <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-aif-gold-DEFAULT animate-spin" />
              <Sparkles className="absolute text-aif-gold-DEFAULT animate-bounce" size={22} />
            </div>

            <div className="text-center max-w-sm space-y-2">
              <span className="inline-block px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 rounded-full animate-pulse">
                Recherche im Gang
              </span>
              <p className="text-xs text-white/80 font-medium font-sans h-5">
                {loadingSteps[loadingStep]}
              </p>
              <div className="w-32 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-aif-gold-DEFAULT to-indigo-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        ) : error ? (
          /* Error Fallback View */
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white uppercase tracking-wide font-display">Analyse fehlgeschlagen</h4>
              <p className="text-xs text-white/50 max-w-md mx-auto leading-relaxed">{error}</p>
            </div>
            <button
              onClick={fetchSentiment}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold hover:bg-white/10 text-white transition-all cursor-pointer"
            >
              Erneut versuchen
            </button>
          </motion.div>
        ) : data ? (
          /* Main Analytical Content Grid */
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Left Column: Gauge & Overall Summary */}
            <div className={`p-6 rounded-2xl border ${getScoreGlowBorder(data.score)} transition-all duration-300 flex flex-col justify-between`}>
              <div className="flex flex-col items-center text-center space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">Gewichteter Sentiment Index</span>
                
                {/* Visual Gauge Meter */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    {/* Background track */}
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="65" 
                      fill="transparent" 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="10" 
                    />
                    {/* Active gradient value ring */}
                    <motion.circle 
                      cx="80" 
                      cy="80" 
                      r="65" 
                      fill="transparent" 
                      stroke="url(#sentiment-gradient)" 
                      strokeWidth="10" 
                      strokeDasharray="408.4"
                      initial={{ strokeDashoffset: 408.4 }}
                      animate={{ strokeDashoffset: 408.4 - (408.4 * data.score) / 100 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="sentiment-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" /> {/* Rose red for low score */}
                        <stop offset="50%" stopColor="#f5c453" /> {/* Amber gold for neutral */}
                        <stop offset="100%" stopColor="#10b981" /> {/* Emerald green for high score */}
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Absolute Centered Score Typography */}
                  <div className="flex flex-col items-center justify-center z-10">
                    <span className={`text-4xl font-mono font-black ${getScoreColorClass(data.score)}`}>
                      {data.score}
                    </span>
                    <span className="text-[10px] text-white/40 uppercase font-mono tracking-widest mt-0.5">SCORE</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getImpactBadgeClass(data.label as any)} shadow-[0_0_15px_rgba(255,255,255,0.02)]`}>
                    {data.label}
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed font-sans font-medium max-w-sm pt-4 border-t border-white/5">
                    {data.summary}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                <span>INDEX RANGE: 0 - 100</span>
                <span>STATUS: AKTIV</span>
              </div>
            </div>

            {/* Right Column: Drivers & Researched Sources */}
            <div className="space-y-6">
              {/* Sub-Section 1: Drivers */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-aif-gold-DEFAULT" />
                  Zentrale Sentiment-Treiber
                </h4>
                
                <div className="space-y-2">
                  {data.drivers.length > 0 ? (
                    data.drivers.map((driver, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white/5 border border-white/5 hover:border-white/10 p-3 rounded-xl flex items-center justify-between gap-4 transition-all"
                      >
                        <span className="text-xs text-white/80 font-medium leading-normal font-sans">
                          {driver.text}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0 ${getImpactBadgeClass(driver.impact)}`}>
                          {driver.impact}
                        </span>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-xs text-white/40 italic">Keine expliziten Treiber identifiziert.</p>
                  )}
                </div>
              </div>

              {/* Sub-Section 2: Sources */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-1.5">
                  <Globe size={14} className="text-indigo-400" />
                  Recherchierte Echtzeit-Quellen
                </h4>

                <div className="space-y-2">
                  {data.sources.length > 0 ? (
                    data.sources.slice(0, 3).map((src, idx) => (
                      <motion.a 
                        key={idx}
                        href={src.url || '#'}
                        target={src.url ? '_blank' : undefined}
                        rel={src.url ? 'noopener noreferrer' : undefined}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (idx + 2) * 0.1 }}
                        className={`block bg-white/5 border border-white/5 hover:border-white/20 p-3 rounded-xl transition-all group ${src.url ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-white/90 font-semibold group-hover:text-aif-gold-light transition-colors line-clamp-1">
                                {src.title || 'Nachrichtenbericht'}
                              </span>
                              {src.url && (
                                <ExternalLink size={10} className="text-white/30 group-hover:text-aif-gold-DEFAULT transition-colors flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-white/40 font-mono">
                              {src.url ? new URL(src.url).hostname : 'Google Grounding Quelle'}
                            </p>
                          </div>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase ${getImpactBadgeClass(src.sentiment)} flex-shrink-0`}>
                            {src.sentiment}
                          </span>
                        </div>
                      </motion.a>
                    ))
                  ) : (
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2 text-xs text-white/40">
                      <Info size={14} />
                      <span>Keine direkten Nachrichtenberichte indiziert.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
