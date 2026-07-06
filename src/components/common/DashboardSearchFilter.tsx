import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, TrendingUp, TrendingDown, Eye, Sparkles, Newspaper, ChevronRight, X, Star, Mic, MicOff, Clock, Cpu } from 'lucide-react';
import Markdown from 'react-markdown';
import { AssetLogo } from './AssetLogo';

export interface SearchAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'commodity' | 'index' | 'forex' | 'bond';
  price: number;
  change24h: number;
  marketCap?: number;
  volume24h: number;
  score: number;
}

const TIMEFRAMES = [
  { value: '1m', label: '1 Min' },
  { value: '5m', label: '5 Min' },
  { value: '15m', label: '15 Min' },
  { value: '30m', label: '30 Min' },
  { value: '1std', label: '1 Std' },
  { value: '4std', label: '4 Std' },
  { value: '1 tag', label: '1 Tag' },
  { value: '1 woche', label: '1 Woche' }
];

interface DashboardSearchFilterProps {
  onSelectAsset: (symbol: string) => void;
  selectedSymbol: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  enterpriseSymbols?: string[];
  onToggleEnterpriseSymbol?: (symbol: string) => void;
  timeframe?: string;
  onChangeTimeframe?: (tf: string) => void;
  aiScoringService?: string;
  onChangeAiScoringService?: (service: string) => void;
}

export function DashboardSearchFilter({
  onSelectAsset,
  selectedSymbol,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  enterpriseSymbols = [],
  onToggleEnterpriseSymbol,
  timeframe = '1std',
  onChangeTimeframe,
  aiScoringService = 'perplexity',
  onChangeAiScoringService,
}: DashboardSearchFilterProps) {
  const [assets, setAssets] = useState<SearchAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPerplexityLoading, setIsPerplexityLoading] = useState(false);
  const [perplexityResult, setPerplexityResult] = useState<string | null>(null);

  const handleTriggerPerplexityScoring = async (asset: SearchAsset) => {
    setIsPerplexityLoading(true);
    setPerplexityResult(null);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Führe eine quantitative AI-Scoring Bewertung durch für das Asset ${asset.name} (${asset.symbol}) bezüglich des aktuellen Intervalls ${timeframe}. Berechne einen genauen numerischen Score (0-100) basierend auf Risiko-, Trend-, Liquiditäts- und Sentiment-Metriken im Perplexity-Stil. Nenne konkrete Kauf-/Verkauf-Schwellenwerte und ein geschätztes Stop-Loss Limit.`,
          history: []
        })
      });

      if (!response.ok) throw new Error('Perplexity Service-Timeout');
      const data = await response.json();
      setPerplexityResult(data.reply);
    } catch (err: any) {
      setPerplexityResult(`❌ **Fehler beim Perplexity AI-Scoring:** ${err.message || err}. Bitte stellen Sie sicher, dass Ihr API-Schlüssel konfiguriert ist.`);
    } finally {
      setIsPerplexityLoading(false);
    }
  };
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Voice Search / Web Speech API Integration
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'de-DE'; // Primary support for German, can also interpret tickers like BTC, AAPL

      rec.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Mikrofon-Zugriff verweigert.');
        } else if (event.error === 'no-speech') {
          setSpeechError('Keine Sprache erkannt. Bitte erneut versuchen.');
        } else {
          setSpeechError('Fehler bei der Spracherkennung.');
        }
        // Auto-clear error after 3 seconds
        setTimeout(() => setSpeechError(null), 3000);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // Process transcript: e.g. "suche nach Bitcoin" -> "Bitcoin"
          let processed = transcript.trim();
          
          // German & English search prefixes
          const prefixes = [
            'suche nach', 'suche', 'finde', 'zeige mir', 'zeige', 'nach', 'search for', 'find', 'show me', 'lookup'
          ];
          
          for (const prefix of prefixes) {
            if (processed.toLowerCase().startsWith(prefix)) {
              processed = processed.slice(prefix.length).trim();
              break;
            }
          }
          
          // Remove trailing period if present
          if (processed.endsWith('.')) {
            processed = processed.slice(0, -1).trim();
          }

          setSearchQuery(processed);
          setIsFocused(true); // Open search results
        }
      };

      recognitionRef.current = rec;
    }
  }, [setSearchQuery]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Spracherkennung wird von Ihrem Browser nicht unterstützt.');
      setTimeout(() => setSpeechError(null), 3000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting speech recognition:', e);
        setIsListening(false);
      }
    }
  };

  // Categories mapping to internal asset types
  const categories = [
    { value: 'all', label: 'Alle' },
    { value: 'stock', label: 'Equities (Aktien)' },
    { value: 'forex', label: 'Forex' },
    { value: 'crypto', label: 'Crypto (Krypto)' },
    { value: 'commodity', label: 'Commodities' },
    { value: 'bond', label: 'Bonds (Anleihen)' },
  ];

  // Fetch all assets on mount to search across the entire database of 150+ assets
  useEffect(() => {
    fetch('/api/market-data')
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) {
          // Exclude any variants/placeholders
          const cleanAssets = data.filter(
            (asset: any) => asset?.name && !asset.name.toLowerCase().includes('variant')
          );
          setAssets(cleanAssets);
        } else {
          console.warn('DashboardSearchFilter: received invalid non-array market data');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching market-data for search:', err);
        setError('Fehler beim Laden der Vermögenswerte.');
        setLoading(false);
      });
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter assets based on search query & active category
  const filteredAssets = assets.filter((asset) => {
    const query = searchQuery.toLowerCase().trim();
    if (query !== '') {
      // Ignore categoryFilter to perform global search across all asset types
      return (
        asset.symbol.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query)
      );
    }

    // Category filter applies only when search is empty
    if (categoryFilter !== 'all' && asset.type !== categoryFilter) {
      return false;
    }

    return true;
  });

  // Sort filtered assets by smart quantitative relevance
  const sortedFilteredAssets = [...filteredAssets].sort((a, b) => {
    const query = searchQuery.toLowerCase().trim();
    if (query === '') return 0;

    const aSym = a.symbol.toLowerCase();
    const bSym = b.symbol.toLowerCase();
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    // 1. Exact ticker symbol matches first
    if (aSym === query && bSym !== query) return -1;
    if (bSym === query && aSym !== query) return 1;

    // 2. Ticker symbol starts with search query
    if (aSym.startsWith(query) && !bSym.startsWith(query)) return -1;
    if (bSym.startsWith(query) && !aSym.startsWith(query)) return 1;

    // 3. Name starts with search query (common names / Rufnamen)
    if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
    if (bName.startsWith(query) && !aName.startsWith(query)) return 1;

    // 4. Current category match priority
    if (categoryFilter !== 'all') {
      if (a.type === categoryFilter && b.type !== categoryFilter) return -1;
      if (b.type === categoryFilter && a.type !== categoryFilter) return 1;
    }

    return 0;
  });

  // Get current active asset detail
  const currentAsset = assets.find((a) => a.symbol === selectedSymbol);

  const handleAssetClick = (symbol: string) => {
    onSelectAsset(symbol);
    setIsFocused(false);
  };

  // Helper to format currency
  const formatPrice = (val: number, type: string) => {
    if (type === 'forex') {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(val);
    }
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
  };

  return (
    <div 
      className={`bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-md relative transition-all duration-200 ${
        isFocused ? 'z-40 shadow-[0_20px_50px_rgba(0,0,0,0.8)]' : 'z-10'
      }`} 
      ref={dropdownRef}
    >
      {/* Search Input and Control Panel layout */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        
        {/* Left: Search Input Field with Voice Command Support */}
        <div className="relative w-full xl:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400/60" />
          </div>
          <input
            id="global-search-input"
            type="text"
            placeholder="Symbol oder Name suchen... (z.B. BTC, AAPL, DAX, Gold)"
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-20 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-aif-gold-DEFAULT focus:ring-1 focus:ring-aif-gold-DEFAULT transition-all font-mono"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
                title="Suche löschen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleListening();
              }}
              className={`p-1.5 rounded-lg border transition-all duration-300 flex items-center justify-center cursor-pointer ${
                isListening
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-zinc-100 hover:border-white/25'
              }`}
              title={isListening ? 'Zuhören stoppen' : 'Sprachsuche aktivieren (Web Speech API)'}
            >
              {isListening ? (
                <div className="relative flex items-center justify-center h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-rose-400 opacity-75"></span>
                  <Mic className="h-3.5 w-3.5 text-rose-400" />
                </div>
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Voice Search Feedback / Status Overlay */}
          <AnimatePresence>
            {(isListening || speechError) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`absolute top-full left-0 right-0 mt-2 z-50 p-3 rounded-xl border backdrop-blur-md text-xs font-mono shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 ${
                  speechError
                    ? 'bg-rose-950/95 border-rose-500/30 text-rose-200'
                    : 'bg-black/95 border-aif-gold-DEFAULT/30 text-zinc-200 shadow-[0_0_15px_rgba(245,196,83,0.1)]'
                }`}
              >
                <div className="flex-1 flex items-center gap-2">
                  {isListening ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="font-bold text-rose-400">Höre zu...</span>
                      <span className="text-zinc-400 text-[11px]">Nennen Sie ein Asset (z.B. &quot;Bitcoin&quot;, &quot;Apple&quot;, &quot;suche Gold&quot;)</span>
                    </>
                  ) : (
                    <>
                      <span className="text-rose-400 font-bold">Hinweis:</span>
                      <span className="text-[11px]">{speechError}</span>
                    </>
                  )}
                </div>
                {isListening && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleListening();
                    }}
                    className="px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/25 text-[10px] text-rose-400 border border-rose-500/20 uppercase font-black transition-all cursor-pointer"
                  >
                    Stoppen
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Integrated Controllers & Category Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Enterprise Scorer Timeframe Selection */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-xl px-3 py-2 h-[38px] shrink-0">
            <Clock className="text-aif-gold-DEFAULT" size={13} />
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/45 font-mono hidden sm:inline">
              Intervall:
            </span>
            <select
              value={timeframe}
              onChange={(e) => {
                if (onChangeTimeframe) {
                  onChangeTimeframe(e.target.value);
                }
              }}
              className="bg-transparent text-[11px] text-white focus:outline-none font-mono font-bold cursor-pointer"
            >
              {TIMEFRAMES.map((tf) => (
                <option key={tf.value} value={tf.value} className="bg-zinc-950 text-white font-mono">
                  {tf.label}
                </option>
              ))}
            </select>
          </div>

          {/* AI Scoring Service Selection with Perplexity integration */}
          <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-xl px-3 py-2 h-[38px] shrink-0">
            <Cpu className="text-violet-400" size={13} />
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/45 font-mono hidden sm:inline">
              AI-Scoring:
            </span>
            <select
              value={aiScoringService}
              onChange={(e) => {
                if (onChangeAiScoringService) {
                  onChangeAiScoringService(e.target.value);
                }
              }}
              className="bg-transparent text-[11px] text-white focus:outline-none font-mono font-bold cursor-pointer"
            >
              <option value="perplexity" className="bg-zinc-950 text-white font-mono">Perplexity AI</option>
              <option value="gemini" className="bg-zinc-950 text-white font-mono">Gemini 2.5</option>
              <option value="claude" className="bg-zinc-950 text-white font-mono">Claude 3.5</option>
            </select>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 bg-black/60 p-1 rounded-lg border border-white/10 overflow-x-auto scrollbar-none h-[38px] items-center">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  categoryFilter === cat.value
                    ? 'bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark text-black shadow-[0_0_10px_rgba(245,196,83,0.25)] font-black'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Connected Newsfeed Sync Info */}
      {currentAsset && (
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
            <span>Aktiviertes Asset:</span>
            <span className="text-aif-gold-DEFAULT font-bold bg-aif-gold-DEFAULT/10 px-1.5 py-0.5 rounded font-mono">
              {currentAsset.symbol}
            </span>
            <span className="text-zinc-300 font-semibold">{currentAsset.name}</span>
          </div>

          <div className="flex items-center gap-1.5 text-violet-400 font-bold bg-violet-950/20 border border-violet-500/20 px-2.5 py-0.5 rounded-full">
            <Newspaper size={11} />
            <span>AI-Newsfeed synchronisiert</span>
          </div>
        </div>
      )}

      {/* Category Counts Summary */}
      <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-500">
        <span className="font-bold text-zinc-400">Asset-Bestand:</span>
        <span>Gesamt: <strong className="text-zinc-400 font-bold">{assets.length}</strong></span>
        <span>Equities: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'stock').length}</strong></span>
        <span>Forex: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'forex').length}</strong></span>
        <span>Crypto: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'crypto').length}</strong></span>
        <span>Commodities: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'commodity').length}</strong></span>
        <span>Bonds: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'bond').length}</strong></span>
      </div>

      {/* Perplexity AI Scoring Panel */}
      {aiScoringService === 'perplexity' && currentAsset && (
        <div className="mt-4 p-4 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/20 via-black/45 to-zinc-950/25 backdrop-blur-md shadow-[0_4px_20px_rgba(139,92,246,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white font-display tracking-wider uppercase">
                  Perplexity AI Scoring Dienst
                </h4>
                <p className="text-[9px] font-mono text-zinc-400">
                  Real-time Web-Grounded valuation & Hype analysis
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleTriggerPerplexityScoring(currentAsset)}
              disabled={isPerplexityLoading}
              className="w-full sm:w-auto px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-950/55 disabled:text-zinc-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isPerplexityLoading ? (
                <>
                  <span className="animate-spin border-2 border-white border-t-transparent w-3 h-3 rounded-full" />
                  <span>Berechne Score...</span>
                </>
              ) : (
                <>
                  <Sparkles size={11} />
                  <span>Starte Perplexity AI-Scoring</span>
                </>
              )}
            </button>
          </div>

          {/* Loading or Result view */}
          <AnimatePresence mode="wait">
            {isPerplexityLoading && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="py-6 flex flex-col items-center justify-center text-center space-y-2 relative z-10"
              >
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-400 animate-spin" />
                  <Cpu className="text-violet-400 animate-pulse" size={16} />
                </div>
                <p className="text-[11px] font-mono text-zinc-300 animate-pulse">
                  Verbinde mit Perplexity Web-Grounded Engine...
                </p>
                <p className="text-[9px] text-zinc-500 font-mono">
                  Generiere Real-time Compliance & quantitativen Valuation-Score für {currentAsset.symbol} ({timeframe})
                </p>
              </motion.div>
            )}

            {!isPerplexityLoading && perplexityResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-lg bg-black/60 border border-white/5 space-y-3 relative z-10"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase bg-violet-500/25 border border-violet-500/30 text-violet-300">
                      Ergebnis
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Analysiertes Asset: <strong className="text-white">{currentAsset.symbol}</strong> ({timeframe})
                    </span>
                  </div>
                  <button
                    onClick={() => setPerplexityResult(null)}
                    className="text-[9px] font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  >
                    Ausblenden
                  </button>
                </div>
                
                <div className="text-[11px] text-zinc-300 font-sans leading-relaxed markdown-body max-h-[180px] overflow-y-auto scrollbar-thin pr-1">
                  <Markdown>{perplexityResult}</Markdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Real-time Search Results Dropdown */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-[#121214] border border-white/15 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden max-h-[380px] flex flex-col"
          >
            {/* Header/Info inside dropdown */}
            <div className="px-4 py-2.5 bg-black/60 border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono flex justify-between items-center">
              <span>Suchergebnisse ({Math.min(8, sortedFilteredAssets.length)} von {sortedFilteredAssets.length})</span>
              <span>Klicke zum Auswählen</span>
            </div>

            <div className="overflow-y-auto divide-y divide-white/5 flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {loading ? (
                <div className="p-8 text-center text-xs text-zinc-400 font-mono flex items-center justify-center gap-2">
                  <span className="animate-spin border-2 border-aif-gold-DEFAULT border-t-transparent w-4 h-4 rounded-full" />
                  Assets werden geladen...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-xs text-rose-400 font-mono">{error}</div>
              ) : sortedFilteredAssets.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 font-mono">
                  Keine Vermögenswerte passend zur Suche gefunden.
                </div>
              ) : (
                sortedFilteredAssets.slice(0, 8).map((asset) => {
                  const isPositive = asset.change24h >= 0;
                  const isSelected = asset.symbol === selectedSymbol;

                  return (
                    <div
                      key={asset.symbol}
                      onClick={() => handleAssetClick(asset.symbol)}
                      className={`px-4 py-3 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-aif-gold-DEFAULT/10 hover:bg-aif-gold-DEFAULT/15'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Left: Asset Logo and Names */}
                      <div className="flex items-center gap-3">
                        <AssetLogo symbol={asset.symbol} size={24} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-zinc-100 font-mono uppercase">
                              {asset.symbol}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-white/5 text-zinc-400 border border-white/10 text-[9px]">
                              {asset.type === 'crypto'
                                ? 'Krypto'
                                : asset.type === 'stock'
                                ? 'Aktie'
                                : asset.type === 'commodity'
                                ? 'Rohstoff'
                                : asset.type === 'index'
                                ? 'Index'
                                : 'Forex'}
                            </span>
                            {isSelected && (
                              <span className="text-[9px] px-1 bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/30 rounded font-bold">
                                Aktiv
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-sans mt-0.5 truncate max-w-[160px] sm:max-w-[240px]">
                            {asset.name}
                          </div>
                        </div>
                      </div>

                      {/* Right: Price and Change */}
                      <div className="flex items-center gap-4 text-right font-mono">
                        {/* Star (Favorite for Enterprise Scorer) */}
                        {onToggleEnterpriseSymbol && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // prevent setting selectedSymbol
                              onToggleEnterpriseSymbol(asset.symbol);
                            }}
                            className={`p-2 rounded-lg border transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center ${
                              enterpriseSymbols.includes(asset.symbol.toUpperCase())
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                : 'bg-white/5 border-white/10 text-white/30 hover:text-white hover:border-white/20'
                            }`}
                            title={
                              enterpriseSymbols.includes(asset.symbol.toUpperCase())
                                ? 'Vom Enterprise Scorer entfernen'
                                : 'Dem Enterprise Scorer hinzufügen (Slot belegen)'
                            }
                          >
                            <Star
                              size={12}
                              className={
                                enterpriseSymbols.includes(asset.symbol.toUpperCase())
                                  ? 'fill-amber-400 text-amber-400'
                                  : ''
                              }
                            />
                          </button>
                        )}

                        <div>
                          <div className="text-xs font-bold text-zinc-100">
                            {formatPrice(asset.price, asset.type)}
                          </div>
                          <div
                            className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 justify-end ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {asset.change24h.toFixed(2)}%
                            {isPositive ? (
                              <TrendingUp size={10} className="inline" />
                            ) : (
                              <TrendingDown size={10} className="inline" />
                            )}
                          </div>
                        </div>

                        <ChevronRight size={14} className="text-white/20" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom info banner */}
            <div className="px-4 py-2 bg-black/40 border-t border-white/5 text-[9px] font-mono text-zinc-500 flex justify-between items-center">
              <span>CAPITAL-AI Beta Version 0.5.5</span>
              <span>Zeige max. 8 Suchergebnisse</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
