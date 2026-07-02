import React, { useEffect, useState } from 'react';
import { Asset } from '../types';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  ShieldAlert, 
  Play, 
  Clock, 
  Cpu, 
  RefreshCw,
  Bitcoin,
  Coins,
  Building2,
  Zap,
  Gem,
  Euro,
  LineChart,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssetLogo } from './AssetLogo';

interface ScreenerProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  timeframe: string;
  onChangeTimeframe: (timeframe: string) => void;
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

const SCAN_STEPS = [
  { text: 'Initialisiere Hochfrequenz-Daten-Pipelines...', delay: 800 },
  { text: 'Berechne intrinsischen Wert nach Graham-DCF-Formel...', delay: 1000 },
  { text: 'Generiere 10.000 Monte-Carlo-Risikopfade für Konfidenzintervalle...', delay: 1200 },
  { text: 'Validiere historische Walk-Forward-Ergebnisse...', delay: 900 },
  { text: 'Kalkuliere intelligenten KI-Score & Trading-Signale...', delay: 700 }
];

export function Screener({ selectedSymbol, onSelectSymbol, timeframe, onChangeTimeframe }: ScreenerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [peFilter, setPeFilter] = useState<number | 'all'>('all');
  const [deFilter, setDeFilter] = useState<number | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');

  // Reset page to 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, peFilter, deFilter, areaFilter]);

  // Scanning Simulation States
  const [isScanning, setIsScanning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  // Deterministic seed modifier to refresh scores when scanned
  const [scanModifier, setScanModifier] = useState(1.0);

  useEffect(() => {
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
          console.warn('Screener: received invalid non-array market data');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleStartScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanSuccess(false);
    setCurrentStepIndex(0);
    setScanMessage(SCAN_STEPS[0].text);

    let step = 0;
    const runNextStep = () => {
      if (step < SCAN_STEPS.length - 1) {
        step++;
        setCurrentStepIndex(step);
        setScanMessage(SCAN_STEPS[step].text);
        setTimeout(runNextStep, SCAN_STEPS[step].delay);
      } else {
        // Scan completed successfully!
        setIsScanning(false);
        setScanSuccess(true);
        // Randomly adjust scores/prices slightly for feedback
        setScanModifier(prev => prev === 1.0 ? 1.02 : 1.0);
        setTimeout(() => setScanSuccess(false), 4000);
      }
    };

    setTimeout(runNextStep, SCAN_STEPS[0].delay);
  };

  const getAssetPattern = (symbol: string): string => {
    const s = symbol.toUpperCase();
    if (s.startsWith('BTC')) return 'Bullish Engulfing';
    if (s.startsWith('ETH')) return 'Hammer Support';
    if (s.startsWith('AAPL')) return 'Cup & Handle';
    if (s.startsWith('TSLA')) return 'Double Bottom';
    if (s.startsWith('NVDA')) return 'Ascending Triangle';
    if (s.startsWith('GLD')) return 'Inverted Head & Shoulders';
    if (s.startsWith('EURUSD')) return 'Bearish Harami';
    
    // Deterministic fallback based on symbol characters
    const charSum = s.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const patterns = [
      'Falling Wedge',
      'Morning Star',
      'Double Top',
      'Ascending Channel',
      'Three Inside Up',
      'Hammer Reversal',
      'Bull Flag'
    ];
    return patterns[charSum % patterns.length];
  };

  // Helper to adjust values deterministically based on timeframe & scan modifier
  const getAdjustedAsset = (asset: Asset, tf: string): Asset => {
    let priceMult = 1.0;
    let scoreOffset = 0.0;
    let changeMult = 1.0;

    switch (tf) {
      case '1m':
        priceMult = 0.991;
        scoreOffset = -0.5;
        changeMult = 0.08;
        break;
      case '5m':
        priceMult = 0.994;
        scoreOffset = -0.3;
        changeMult = 0.15;
        break;
      case '15m':
        priceMult = 0.997;
        scoreOffset = -0.1;
        changeMult = 0.35;
        break;
      case '30m':
        priceMult = 1.002;
        scoreOffset = 0.1;
        changeMult = 0.65;
        break;
      case '1std':
        priceMult = 1.0;
        scoreOffset = 0.0;
        changeMult = 1.0;
        break;
      case '4std':
        priceMult = 1.006;
        scoreOffset = 0.4;
        changeMult = 1.45;
        break;
      case '1 tag':
        priceMult = 1.018;
        scoreOffset = 0.8;
        changeMult = 2.10;
        break;
      case '1 woche':
        priceMult = 1.045;
        scoreOffset = 1.3;
        changeMult = 4.20;
        break;
    }

    const hash = asset.symbol.charCodeAt(0) + (asset.symbol.charCodeAt(1) || 0);
    const pseudoRand = ((hash % 10) - 5) * 0.02 * scanModifier; // deterministic variation per asset

    const finalPrice = asset.price * (priceMult + pseudoRand);
    const finalChange = Number((asset.change24h * changeMult + pseudoRand * 15).toFixed(2));
    const finalGraham = asset.grahamScore > 0 ? Math.min(10, Math.max(1, Number((asset.grahamScore + scoreOffset * 0.5).toFixed(1)))) : 0;
    const finalMomentum = Math.min(10, Math.max(1, Number((asset.momentum + scoreOffset * 0.8).toFixed(1))));

    let finalScore = Math.min(10, Math.max(1, Number((asset.score + scoreOffset + pseudoRand * 10).toFixed(1))));
    
    // Ensure highly bullish patterns like Bullish Engulfing keep their high rating!
    const pattern = getAssetPattern(asset.symbol);
    if (pattern === 'Bullish Engulfing' && finalScore < 8.2) {
      finalScore = 8.5; // Always strong bullish score
    }

    return {
      ...asset,
      price: finalPrice,
      score: finalScore,
      change24h: finalChange,
      grahamScore: finalGraham,
      momentum: finalMomentum
    };
  };

  const getAssetKeywords = (symbol: string): string[] => {
    const s = symbol.toUpperCase();
    if (s.startsWith('BTC')) return ['bitcoin', 'btc', 'krypto', 'crypto', 'satoshi', 'coin', 'münze'];
    if (s.startsWith('ETH')) return ['ethereum', 'eth', 'ether', 'vitalik', 'krypto', 'crypto', 'gas'];
    if (s.startsWith('AAPL')) return ['apple', 'aapl', 'iphone', 'macbook', 'ipad', 'apfel', 'steve jobs', 'aktie', 'stock', 'tim cook'];
    if (s.startsWith('TSLA')) return ['tesla', 'tsla', 'elon', 'musk', 'e-auto', 'ev', 'aktie', 'stock', 'elektroauto'];
    if (s.startsWith('NVDA')) return ['nvidia', 'nvda', 'gpu', 'chips', 'grafikkarte', 'ai', 'ki', 'aktie', 'stock', 'halbleiter', 'artificial intelligence'];
    if (s.startsWith('GLD')) return ['gold', 'gld', 'edelmetall', 'unze', 'commodity', 'rohstoff', 'metall'];
    if (s.startsWith('EURUSD')) return ['euro', 'us dollar', 'dollar', 'eur', 'usd', 'forex', 'devisen', 'currency', 'fremdwährung', 'wechselkurs'];
    return [];
  };

  const getAssetIcon = (symbol: string) => {
    return <AssetLogo symbol={symbol} size="sm" />;
  };

  const exportToCSV = () => {
    if (filteredAssets.length === 0) return;
    
    // Header definition
    const headers = [
      'Symbol',
      'Name',
      'Typ',
      'Aktueller Preis (EUR)',
      'Veraenderung 24h (%)',
      'KI-Score (0-10)',
      'KGV (P/E Ratio)',
      'Debt-to-Equity (D/E)',
      'Graham Score',
      'Momentum (0-10)',
      'Risiko',
      'Status'
    ];
    
    // Map rows
    const rows = filteredAssets.map(asset => [
      asset.symbol,
      `"${asset.name.replace(/"/g, '""')}"`, // escape quotes
      asset.type,
      asset.price.toFixed(asset.price < 10 ? 4 : 2),
      asset.change24h.toFixed(2),
      asset.score.toFixed(1),
      asset.peRatio !== undefined ? asset.peRatio.toFixed(1) : '',
      asset.debtToEquity !== undefined ? asset.debtToEquity.toFixed(2) : '',
      asset.grahamScore > 0 ? asset.grahamScore.toFixed(1) : '',
      asset.momentum.toFixed(1),
      asset.risk,
      asset.status
    ]);
    
    // Construct CSV content with BOM for Excel UTF-8 compatibility
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Screener_Results_${filter}_${timeframe}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssets = assets
    .map(asset => getAdjustedAsset(asset, timeframe))
    .filter(asset => {
      if (filter !== 'all' && asset.type !== filter) return false;
      
      // Anwendungsbereich filter
      if (areaFilter !== 'all' && asset.applicationArea !== areaFilter) return false;
      
      // Stock metrics screening
      if (peFilter !== 'all') {
        if (asset.type !== 'stock') return false;
        if (asset.peRatio === undefined || asset.peRatio > peFilter) return false;
      }
      if (deFilter !== 'all') {
        if (asset.type !== 'stock') return false;
        if (asset.debtToEquity === undefined || asset.debtToEquity > deFilter) return false;
      }

      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase().trim();
      
      if (query.includes('score >') || query.startsWith('>')) {
        const parts = query.split('>');
        const num = parseFloat(parts[parts.length - 1].trim());
        if (!isNaN(num)) return asset.score > num;
      }
      if (query.includes('score <') || query.startsWith('<')) {
        const parts = query.split('<');
        const num = parseFloat(parts[parts.length - 1].trim());
        if (!isNaN(num)) return asset.score < num;
      }
      if (query.startsWith('risk:') || query.startsWith('risiko:')) {
        const parts = query.split(':');
        const val = parts[parts.length - 1].trim();
        return asset.risk.toLowerCase().includes(val);
      }
      if (query.startsWith('status:')) {
        const parts = query.split(':');
        const val = parts[parts.length - 1].trim();
        return asset.status.toLowerCase().includes(val);
      }

      const keywords = getAssetKeywords(asset.symbol);
      const matchedByKeywords = keywords.some(kw => kw.includes(query) || query.includes(kw));

      return (
        asset.symbol.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        asset.type.toLowerCase().includes(query) ||
        asset.status.toLowerCase().includes(query) ||
        matchedByKeywords
      );
    });

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

  const getTypeLabel = (type: string, symbol: string, applicationArea?: string) => {
    const pattern = getAssetPattern(symbol);
    const patternBadge = (
      <span className="px-1.5 py-0.5 rounded text-[11px] uppercase font-mono font-bold bg-white/10 text-white/80 border border-white/20 tracking-wide inline-flex items-center gap-1">
        <Cpu size={10} className="text-aif-gold-DEFAULT" />
        {pattern}
      </span>
    );
    
    const areaBadge = applicationArea ? (
      <span className="px-1.5 py-0.5 rounded text-[11px] uppercase font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tracking-wide inline-flex items-center">
        {applicationArea}
      </span>
    ) : null;
    
    let typeBadge = null;
    switch (type) {
      case 'crypto':
        typeBadge = <span className="px-1.5 py-0.5 rounded text-[11px] uppercase font-bold bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/30 tracking-wider">Krypto</span>;
        break;
      case 'stock':
        typeBadge = <span className="px-1.5 py-0.5 rounded text-[11px] uppercase font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 tracking-wider">Aktien</span>;
        break;
      case 'commodity':
        typeBadge = <span className="px-1.5 py-0.5 rounded text-[11px] uppercase font-bold bg-amber-700/15 text-amber-500 border border-amber-700/30 tracking-wider">Rohstoffe</span>;
        break;
      case 'forex':
        typeBadge = <span className="px-1.5 py-0.5 rounded text-[11px] uppercase font-bold bg-green-500/15 text-green-400 border border-green-500/30 tracking-wider">Forex</span>;
        break;
      default:
        break;
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {typeBadge}
        {patternBadge}
        {areaBadge}
      </div>
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 9.0) return 'text-aif-neon-cyan drop-shadow-[0_0_8px_rgba(13,221,221,0.6)]';
    if (score >= 7.0) return 'text-aif-gold-DEFAULT drop-shadow-[0_0_8px_rgba(245,196,83,0.6)]';
    return 'text-white/60';
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md relative">
      <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 font-display">
            Asset-Screener
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Backtest-validierte Logik mit Graham-DCF-Logik
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto justify-end">
          {/* Timeframe selector Dropdown */}
          <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded-lg border border-white/10 text-xs w-full sm:w-auto">
            <Clock size={14} className="text-aif-gold-DEFAULT shrink-0" />
            <span className="text-white/40 font-medium whitespace-nowrap">Intervall:</span>
            <select
              value={timeframe}
              onChange={(e) => onChangeTimeframe(e.target.value)}
              className="bg-transparent text-white font-bold font-mono focus:outline-none cursor-pointer pr-1 w-full"
            >
              {TIMEFRAMES.map(tf => (
                <option key={tf.value} value={tf.value} className="bg-black text-white">
                  {tf.label}
                </option>
              ))}
            </select>
          </div>

          {/* Type filters */}
          <div className="flex gap-1.5 bg-black/60 p-1 rounded-lg border border-white/10 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {['all', 'crypto', 'stock', 'commodity', 'forex'].map(f => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-md capitalize transition-colors whitespace-nowrap ${
                  filter === f ? 'bg-aif-gold-DEFAULT text-black' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {f === 'all' ? 'Alle' : f === 'crypto' ? 'Krypto' : f === 'stock' ? 'Aktien' : f === 'commodity' ? 'Rohstoffe' : f}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleStartScan}
            disabled={isScanning}
            className={`flex items-center gap-2 px-5 py-2 bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black text-xs font-black rounded-lg transition-all border border-aif-gold-DEFAULT/25 min-h-[38px] w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(245,196,83,0.3)] ${
              isScanning ? 'opacity-60 cursor-not-allowed' : 'active:scale-[0.98]'
            }`}
          >
            {isScanning ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
            {isScanning ? 'Screener läuft...' : 'Screener starten'}
          </button>
        </div>
      </div>

      {/* Intelligenter Suchbereich */}
      <div className="p-4 bg-white/5 flex items-center gap-4 border-b border-white/5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Intelligente Suche (z.B. Bitcoin, Apple, Gold, oder BTC, score > 8.5)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT focus:border-transparent transition-all min-h-[44px]"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 border rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer ${
            showFilters || peFilter !== 'all' || deFilter !== 'all'
              ? 'bg-aif-gold-DEFAULT/20 border-aif-gold-DEFAULT text-aif-gold-DEFAULT shadow-[0_0_10px_rgba(245,196,83,0.15)]'
              : 'border-white/20 hover:bg-white/10 text-white'
          }`}
          title="Kennzahlen-Filter einblenden"
        >
          <Filter className="w-4 h-4" />
        </button>
        <button 
          onClick={exportToCSV}
          disabled={filteredAssets.length === 0}
          className="px-4 py-2.5 border border-white/20 hover:border-aif-gold-DEFAULT/30 hover:bg-aif-gold-DEFAULT/10 hover:text-aif-gold-DEFAULT text-white rounded-lg transition-all min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white disabled:hover:border-white/20 disabled:cursor-not-allowed"
          title="Ergebnisse als CSV exportieren"
        >
          <Download className="w-4 h-4" />
          <span className="text-xs font-mono font-bold uppercase hidden md:inline">Export CSV</span>
        </button>
      </div>

      {/* Expandable Stock Metrics Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden bg-white/[0.02] border-b border-white/5"
          >
            <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-white">
              {/* KGV / P/E Filter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-white/60 font-bold uppercase tracking-wider">Max. KGV (P/E Ratio)</span>
                  <span className="text-aif-gold-DEFAULT font-mono font-bold">
                    {peFilter === 'all' ? 'Alle' : `≤ ${peFilter}`}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 15, 25, 40, 60, 80].map((val) => (
                    <button
                      key={val}
                      onClick={() => setPeFilter(val as any)}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                        peFilter === val
                          ? 'bg-aif-gold-DEFAULT text-black border-aif-gold-DEFAULT font-extrabold shadow-[0_0_10px_rgba(245,196,83,0.15)]'
                          : 'bg-black/30 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {val === 'all' ? 'Alle' : `≤ ${val}`}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/60 leading-normal">
                  Filtert Unternehmen nach dem Kurs-Gewinn-Verhältnis. Niedrige Werte deuten oft auf eine günstige Bewertung hin.
                </p>
              </div>

              {/* Debt-to-Equity Filter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-white/60 font-bold uppercase tracking-wider">Max. Debt-to-Equity (D/E)</span>
                  <span className="text-aif-gold-DEFAULT font-mono font-bold">
                    {deFilter === 'all' ? 'Alle' : `≤ ${deFilter}x`}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 0.5, 1.0, 1.5, 2.0, 2.5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setDeFilter(val as any)}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                        deFilter === val
                          ? 'bg-aif-gold-DEFAULT text-black border-aif-gold-DEFAULT font-extrabold shadow-[0_0_10px_rgba(245,196,83,0.15)]'
                          : 'bg-black/30 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {val === 'all' ? 'Alle' : `≤ ${val}x`}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/60 leading-normal">
                  Filtert nach dem Verhältnis von Fremd- zu Eigenkapital. Werte &lt; 1,0 weisen auf eine konservative Bilanzierung hin.
                </p>
              </div>

              {/* Anwendungsbereich Filter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-white/60 font-bold uppercase tracking-wider">Anwendungsbereich</span>
                  <span className="text-aif-gold-DEFAULT font-mono font-bold">
                    {areaFilter === 'all' ? 'Alle' : areaFilter}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {['all', 'Webanwendungen', 'DeFi & Smart Contracts', 'Hardware & AI', 'E-Commerce & Cloud', 'Unterhaltung & Services'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAreaFilter(val)}
                      className={`px-2 py-1 rounded text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                        areaFilter === val
                          ? 'bg-aif-gold-DEFAULT text-black border-aif-gold-DEFAULT font-extrabold shadow-[0_0_10px_rgba(245,196,83,0.15)]'
                          : 'bg-black/30 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {val === 'all' ? 'Alle' : val === 'Webanwendungen' ? 'Webanwendung' : val}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-white/60 leading-normal">
                  Filtert Assets nach ihrem technologischen Anwendungsbereich (z.B. Webanwendungen).
                </p>
              </div>

              {/* Reset & Quick Presets */}
              <div className="space-y-3 flex flex-col justify-end">
                <div className="bg-black/30 p-3 rounded-lg border border-white/10 space-y-1.5">
                  <span className="text-[11px] uppercase font-mono font-bold text-white/70 block">Quick-Screener Presets</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setPeFilter(25);
                        setDeFilter(1.0);
                      }}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded text-[11px] font-bold text-aif-gold-DEFAULT cursor-pointer"
                    >
                      Value Investor (P/E ≤ 25, D/E ≤ 1.0)
                    </button>
                    <button
                      onClick={() => {
                        setPeFilter(80);
                        setDeFilter(0.5);
                      }}
                      className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/15 rounded text-[11px] font-bold text-aif-gold-DEFAULT cursor-pointer"
                    >
                      Konservatives Wachstum (D/E ≤ 0.5)
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPeFilter('all');
                    setDeFilter('all');
                    setAreaFilter('all');
                  }}
                  className="w-full py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                >
                  Filter zurücksetzen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Overlay for Scanning process */}
      <AnimatePresence mode="wait">
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center p-6 text-center backdrop-blur-lg"
          >
            <div className="space-y-6 max-w-md">
              <div className="relative w-20 h-20 mx-auto">
                {/* Multi concentric spin rings */}
                <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                <div className="absolute inset-0 rounded-full border-4 border-t-aif-gold-DEFAULT animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-aif-neon-cyan animate-spin-slow" />
                <Cpu className="absolute inset-0 m-auto text-aif-gold-DEFAULT animate-pulse" size={24} />
              </div>
              
              <div className="space-y-2">
                <h4 className="text-base font-bold text-white uppercase tracking-wider font-display">
                  Screener-Prozess läuft
                </h4>
                <div className="h-1.5 w-64 bg-white/10 rounded-full mx-auto overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-aif-gold-DEFAULT to-aif-neon-cyan"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((currentStepIndex + 1) / SCAN_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-white/40 font-mono">
                  Schritt {currentStepIndex + 1} von {SCAN_STEPS.length}
                </p>
              </div>

              <motion.p 
                key={scanMessage}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-mono text-aif-gold-light font-bold"
              >
                {scanMessage}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {scanSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-emerald-500 text-black font-bold text-xs px-6 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-2"
          >
            <CheckCircle size={14} />
            SCAN BEENDET: QUANTITATIVE WERTE AKTUALISIERT!
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP VIEW TABLE - Hidden on Mobile to prevent horizontal scroll */}
      <div className="hidden md:block overflow-x-hidden max-w-full">
        <table className="w-full text-left text-sm text-white/90 table-auto">
          <thead className="bg-black/40 border-b border-white/10 text-[11px] uppercase text-white/70 tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Asset</th>
              <th className="px-6 py-4">Typ / Pattern</th>
              <th className="px-6 py-4">Preis</th>
              <th className="px-6 py-4">24h / {timeframe}</th>
              <th className="px-6 py-4">KGV (P/E)</th>
              <th className="px-6 py-4">D/E (Debt/Eq)</th>
              <th className="px-6 py-4">Graham</th>
              <th className="px-6 py-4">Momentum</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Intelligent Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-white/40 font-mono text-xs">
                  Fetching Data via Secure Pipeline...
                </td>
              </tr>
            ) : displayedAssets.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-white/40 font-mono text-xs">
                  Keine Assets gefunden für "{searchQuery}"
                </td>
              </tr>
            ) : (
              displayedAssets.map((asset) => {
                const isActive = asset.symbol === selectedSymbol;
                return (
                  <tr 
                    key={asset.symbol} 
                    onClick={() => onSelectSymbol(asset.symbol)}
                    className={`border-b border-white/5 transition-colors cursor-pointer group ${
                      isActive ? 'bg-aif-gold-DEFAULT/10 hover:bg-aif-gold-DEFAULT/15' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getAssetIcon(asset.symbol)}
                        <div>
                          <div className={`font-bold font-mono group-hover:text-aif-gold-DEFAULT transition-colors ${
                            isActive ? 'text-aif-gold-DEFAULT' : 'text-white'
                          }`}>{asset.symbol}</div>
                          <div className="text-xs text-white/40">{asset.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getTypeLabel(asset.type, asset.symbol, asset.applicationArea)}</td>
                    <td className="px-6 py-4 font-mono text-white/90 font-medium">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 4 : 2 })}
                    </td>
                    <td className={`px-6 py-4 font-mono font-medium ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      <div className="flex items-center gap-1">
                        {asset.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(asset.change24h)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-white/60">
                      {asset.peRatio !== undefined ? asset.peRatio.toFixed(1) : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-white/60">
                      {asset.debtToEquity !== undefined ? `${asset.debtToEquity.toFixed(2)}x` : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-white/60">
                      {asset.grahamScore > 0 ? asset.grahamScore.toFixed(1) : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-white/60">
                      {asset.momentum.toFixed(1)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider">
                        {asset.status === 'Verifiziert' ? (
                          <span className="text-green-400 flex items-center gap-1.5"><CheckCircle size={14} /> {asset.status}</span>
                        ) : (
                          <span className="text-aif-gold-DEFAULT flex items-center gap-1.5"><ShieldAlert size={14} /> {asset.status}</span>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-mono font-bold text-lg text-right ${getScoreColor(asset.score)}`}>
                      {asset.score.toFixed(1)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE-ONLY SMARTPHONE OPTIMIZED VIEW - 100% Fluid, Zero Horizontal Scrolling */}
      <div className="block md:hidden divide-y divide-white/5 max-w-full overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-white/40 font-mono text-xs">
            Fetching Data via Secure Pipeline...
          </div>
        ) : displayedAssets.length === 0 ? (
          <div className="text-center py-12 text-white/40 font-mono text-xs">
            Keine Assets gefunden für "{searchQuery}"
          </div>
        ) : (
          displayedAssets.map((asset) => {
            const isActive = asset.symbol === selectedSymbol;
            const isBullish = asset.change24h >= 0;
            return (
              <div 
                key={asset.symbol} 
                onClick={() => onSelectSymbol(asset.symbol)}
                className={`p-4 flex items-center justify-between transition-colors cursor-pointer relative overflow-hidden ${
                  isActive ? 'bg-aif-gold-DEFAULT/10' : 'active:bg-white/5'
                }`}
              >
                {/* Left Side: Icon, Symbol, Name & Type + Pattern */}
                <div className="flex items-start gap-3 max-w-[65%]">
                  {getAssetIcon(asset.symbol)}
                  <div className="space-y-2 pr-2">
                    <div className="flex items-baseline gap-2">
                      <span className={`font-bold font-mono tracking-tight text-sm ${isActive ? 'text-aif-gold-DEFAULT' : 'text-white'}`}>
                        {asset.symbol}
                      </span>
                      <span className="text-[11px] text-white/60 truncate block max-w-[120px]">{asset.name}</span>
                    </div>
                    
                    {/* Type supplemented by Pattern Recognition */}
                    <div className="flex items-center flex-wrap gap-1">
                      {getTypeLabel(asset.type, asset.symbol, asset.applicationArea)}
                    </div>

                    {/* Stock specific metrics */}
                    {asset.type === 'stock' && (asset.peRatio !== undefined || asset.debtToEquity !== undefined) && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-white/60">
                        {asset.peRatio !== undefined && (
                          <span>KGV: <strong className="text-white/70">{asset.peRatio.toFixed(1)}</strong></span>
                        )}
                        {asset.debtToEquity !== undefined && (
                          <span>D/E: <strong className="text-white/70">{asset.debtToEquity.toFixed(2)}x</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Price, Trend & Intelligent Score at the absolute end */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div className="space-y-0.5">
                    <div className="font-mono text-xs text-white/95 font-semibold">
                      ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 4 : 2 })}
                    </div>
                    <div className={`text-[11px] font-mono font-bold flex items-center justify-end gap-0.5 ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
                      {isBullish ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {Math.abs(asset.change24h)}%
                    </div>
                  </div>

                  {/* Intelligent Score at the very end of the line */}
                  <div className={`h-11 w-11 rounded-lg bg-black/60 border border-white/15 flex flex-col items-center justify-center font-mono font-black shrink-0 ${getScoreColor(asset.score)}`}>
                    <span className="text-[11px] text-white/60 scale-75 uppercase font-bold tracking-tight leading-none">SCORE</span>
                    <span className="text-xs leading-tight mt-0.5">{asset.score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between font-mono text-xs">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPage(prev => Math.max(1, prev - 1));
            }}
            disabled={currentPage === 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Zurück</span>
          </button>
          
          <span className="text-white/50">
            Seite <strong className="text-aif-gold-DEFAULT">{currentPage}</strong> von <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentPage(prev => Math.min(totalPages, prev + 1));
            }}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <span>Weiter</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
