import React, { useState, useEffect, useMemo } from 'react';
import { Asset } from '../types';
import { 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Cpu, 
  Layers, 
  BarChart4, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Coins, 
  BadgePercent,
  Check,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MarketScreenerProps {
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
}

type SortField = 'symbol' | 'name' | 'price' | 'change24h' | 'score' | 'peRatio' | 'marketCap' | 'dividendYield' | 'debtToEquity' | 'grahamScore' | 'volume24h';
type SortOrder = 'asc' | 'desc';

// Mapping dictionary matching German/English names, nicknames, and aliases to core stock tickers / crypto symbols
const ALIAS_MAP: Record<string, string[]> = {
  'AAPL': ['apple', 'apfel', 'iphone', 'macbook', 'ios', 'steve jobs', 'tim cook', 'tech aktie'],
  'TSLA': ['tesla', 'elon', 'musk', 'e-auto', 'ev', 'model s', 'cyber truck', 'elektroauto'],
  'NVDA': ['nvidia', 'ki-chips', 'gforce', 'gpu', 'grafikkarte', 'ai chips', 'rtx', 'chipsatz'],
  'GLD': ['gold', 'goldbarren', 'gld', 'edelmetall', 'sicherer hafen', 'commodity', 'rohstoff'],
  'BTC': ['bitcoin', 'btc', 'crypto', 'krypto', 'satoshi', 'digitales gold', 'digital gold', 'coin'],
  'ETH': ['ethereum', 'ether', 'eth', 'smart contracts', 'vitalik', 'gas fee', 'altcoin'],
  'EURUSD': ['forex', 'devisen', 'euro', 'dollar', 'währung', 'currency', 'geldkurs']
};

// Reusable simple hover tooltip with an elegant modern dark styling
function SimpleTooltip({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip inline-block w-full">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-3 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white shadow-2xl hidden group-hover/tooltip:block pointer-events-none z-50 animate-fade-in">
        <div className="font-extrabold text-aif-gold-DEFAULT mb-1 flex items-center gap-1">
          <HelpCircle size={12} className="text-aif-gold-DEFAULT" />
          <span>{title}</span>
        </div>
        <p className="text-[10px] text-white/70 leading-normal font-sans normal-case">{text}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-950" />
      </div>
    </div>
  );
}

export function MarketScreener({ onSelectSymbol, selectedSymbol, triggerAttempt }: MarketScreenerProps) {
  // Trigger attempt on mount
  useEffect(() => {
    if (triggerAttempt) {
      triggerAttempt('Custom Market Screener', () => {});
    }
  }, []);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Custom Filters State
  const [assetType, setAssetType] = useState<string>('all');
  
  // Custom Filter Criteria
  const [peMin, setPeMin] = useState<string>('');
  const [peMax, setPeMax] = useState<string>('');
  
  const [mcapMin, setMcapMin] = useState<string>('');
  const [mcapMax, setMcapMax] = useState<string>('');
  
  const [divMin, setDivMin] = useState<string>('');
  const [divMax, setDivMax] = useState<string>('');
  
  const [deMax, setDeMax] = useState<string>('');
  const [minKiScore, setMinKiScore] = useState<number>(0);
  const [minGrahamScore, setMinGrahamScore] = useState<number>(0);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active presets
  const [activePreset, setActivePreset] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        const nonVariants = data.filter((asset: any) => !asset.name.toLowerCase().includes('variant'));
        setAssets(nonVariants);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading screener assets:', err);
        setLoading(false);
      });
  }, []);

  // Preset templates
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    // Reset defaults first
    setPeMin('');
    setPeMax('');
    setMcapMin('');
    setMcapMax('');
    setDivMin('');
    setDivMax('');
    setDeMax('');
    setMinKiScore(0);
    setMinGrahamScore(0);

    if (preset === 'value') {
      setAssetType('stock');
      setPeMax('20');
      setDivMin('1.5');
      setMinGrahamScore(6);
      setMinKiScore(7.5);
    } else if (preset === 'growth') {
      setAssetType('stock');
      setPeMin('25');
      setMcapMin('100');
      setMinKiScore(8.5);
    } else if (preset === 'dividend') {
      setAssetType('stock');
      setDivMin('3.0');
      setPeMax('25');
    } else if (preset === 'crypto-high') {
      setAssetType('crypto');
      setMinKiScore(8.0);
    } else {
      setAssetType('all');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setAssetType('all');
    setPeMin('');
    setPeMax('');
    setMcapMin('');
    setMcapMax('');
    setDivMin('');
    setDivMax('');
    setDeMax('');
    setMinKiScore(0);
    setMinGrahamScore(0);
    setActivePreset('all');
    setCurrentPage(1);
  };

  // Autocomplete Suggestions logic based on fuzzy query and custom alias map
  const suggestedAssets = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    
    return assets.filter(asset => {
      const matchesAlias = Object.entries(ALIAS_MAP).some(([baseSym, aliases]) => {
        const isTargetAsset = asset.symbol.toUpperCase().startsWith(baseSym.toUpperCase());
        return isTargetAsset && aliases.some(alias => alias.includes(q));
      });
      
      return asset.symbol.toLowerCase().includes(q) || 
             asset.name.toLowerCase().includes(q) ||
             matchesAlias;
    }).slice(0, 5);
  }, [assets, searchQuery]);

  // Filter & Sort logic with smart alias mappings
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAlias = Object.entries(ALIAS_MAP).some(([baseSym, aliases]) => {
          const isTargetAsset = asset.symbol.toUpperCase().startsWith(baseSym.toUpperCase());
          return isTargetAsset && aliases.some(alias => alias.includes(q));
        });

        const matchesSearch = 
          asset.symbol.toLowerCase().includes(q) || 
          asset.name.toLowerCase().includes(q) ||
          matchesAlias;

        if (!matchesSearch) return false;
      }

      // 2. Asset Type Filter
      if (assetType !== 'all' && asset.type !== assetType) {
        return false;
      }

      // 3. Custom P/E Filter
      if (asset.peRatio !== undefined) {
        const minVal = parseFloat(peMin);
        const maxVal = parseFloat(peMax);
        if (!isNaN(minVal) && asset.peRatio < minVal) return false;
        if (!isNaN(maxVal) && asset.peRatio > maxVal) return false;
      } else if (peMin || peMax) {
        return false;
      }

      // 4. Custom Market Cap Filter (in Billions)
      if (asset.marketCap !== undefined) {
        const minVal = parseFloat(mcapMin);
        const maxVal = parseFloat(mcapMax);
        if (!isNaN(minVal) && asset.marketCap < minVal) return false;
        if (!isNaN(maxVal) && asset.marketCap > maxVal) return false;
      } else if (mcapMin || mcapMax) {
        return false;
      }

      // 5. Custom Dividend Yield Filter (in %)
      const divYield = asset.dividendYield !== undefined ? asset.dividendYield : 0;
      const minVal = parseFloat(divMin);
      const maxVal = parseFloat(divMax);
      if (!isNaN(minVal) && divYield < minVal) return false;
      if (!isNaN(maxVal) && divYield > maxVal) return false;

      // 6. Custom Debt to Equity
      if (deMax) {
        const maxVal = parseFloat(deMax);
        if (asset.debtToEquity === undefined || asset.debtToEquity > maxVal) return false;
      }

      // 7. KI Score
      if (asset.score < minKiScore) {
        return false;
      }

      // 8. Graham Score
      const gScore = asset.grahamScore !== undefined ? asset.grahamScore : 0;
      if (gScore < minGrahamScore) {
        return false;
      }

      return true;
    });
  }, [assets, searchQuery, assetType, peMin, peMax, mcapMin, mcapMax, divMin, divMax, deMax, minKiScore, minGrahamScore]);

  // Sorting logic
  const sortedAssets = useMemo(() => {
    const sorted = [...filteredAssets];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === undefined || valA === null) valA = sortOrder === 'asc' ? Infinity : -Infinity;
      if (valB === undefined || valB === null) valB = sortOrder === 'asc' ? Infinity : -Infinity;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' 
        ? valA - valB 
        : valB - valA;
    });
    return sorted;
  }, [filteredAssets, sortField, sortOrder]);

  // Statistics calculation for dynamic KPI widgets
  const stats = useMemo(() => {
    const count = sortedAssets.length;
    if (count === 0) return { avgPe: 0, totalMcap: 0, maxDiv: 0, avgKi: 0 };
    
    let peSum = 0;
    let peCount = 0;
    let mcapSum = 0;
    let maxDiv = 0;
    let kiSum = 0;

    sortedAssets.forEach(a => {
      kiSum += a.score;
      if (a.peRatio !== undefined) {
        peSum += a.peRatio;
        peCount++;
      }
      if (a.marketCap !== undefined) {
        mcapSum += a.marketCap;
      }
      if (a.dividendYield !== undefined && a.dividendYield > maxDiv) {
        maxDiv = a.dividendYield;
      }
    });

    return {
      avgPe: peCount > 0 ? Number((peSum / peCount).toFixed(1)) : 0,
      totalMcap: Number(mcapSum.toFixed(1)),
      maxDiv: Number(maxDiv.toFixed(2)),
      avgKi: Number((kiSum / count).toFixed(1))
    };
  }, [sortedAssets]);

  // Pagination bounds
  const totalPages = Math.ceil(sortedAssets.length / itemsPerPage);
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAssets.slice(start, start + itemsPerPage);
  }, [sortedAssets, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    if (sortedAssets.length === 0) return;
    
    const headers = [
      'Symbol',
      'Name',
      'Assetklasse',
      'Preis (EUR)',
      'Veraenderung 24h (%)',
      'P/E Ratio (KGV)',
      'Marktkapitalisierung (Mrd. EUR)',
      'Dividendenrendite (%)',
      'Debt-to-Equity (D/E)',
      'Graham Score',
      'KI-Score (0-10)',
      'Risiko',
      'Status'
    ];
    
    const rows = sortedAssets.map(asset => [
      asset.symbol,
      `"${asset.name.replace(/"/g, '""')}"`,
      asset.type.toUpperCase(),
      asset.price.toFixed(2),
      asset.change24h.toFixed(2),
      asset.peRatio !== undefined ? asset.peRatio.toFixed(1) : 'N/A',
      asset.marketCap !== undefined ? asset.marketCap.toFixed(1) : 'N/A',
      asset.dividendYield !== undefined ? asset.dividendYield.toFixed(2) : '0.00',
      asset.debtToEquity !== undefined ? asset.debtToEquity.toFixed(2) : 'N/A',
      asset.grahamScore > 0 ? asset.grahamScore.toFixed(1) : 'N/A',
      asset.score.toFixed(1),
      asset.risk,
      asset.status
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AIF_CORE_Screener_${assetType}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl overflow-visible backdrop-blur-md relative p-6">
      
      {/* Upper header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-aif-gold-DEFAULT text-xs font-mono tracking-widest uppercase mb-1">
            <Layers size={12} />
            <span>AIF-CORE MODUL 1</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-widest font-display uppercase flex items-center gap-3">
            Hocheffizienter Markt-Screener
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-xl">
            Definiere komplexe fundamentale & technische Kriterien für Aktien, Kryptowährungen und Rohstoffe. Filtere Millionen von Kombinationspfaden in Echtzeit.
          </p>
        </div>

        {/* Quick Presets with Tooltips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/40 font-mono uppercase mr-1">Vorgaben:</span>
          {[
            { id: 'all', label: 'Alle', tooltipTitle: 'Alle anzeigen', tooltipText: 'Zeigt alle verfügbaren Vermögenswerte ohne voreingestellte Kriterien an.' },
            { id: 'value', label: 'Graham Value', tooltipTitle: 'Graham Value', tooltipText: 'Sucht solide, unterbewertete Aktien nach dem bewährten Value-Prinzip von Benjamin Graham (z.B. niedriges KGV, Graham Score > 6).' },
            { id: 'growth', label: 'Big Growth', tooltipTitle: 'Big Growth', tooltipText: 'Fokussiert sich auf stark wachsende Tech-Giganten mit überdurchschnittlichem Momentum und hohem KI-Score.' },
            { id: 'dividend', label: 'High Dividend', tooltipTitle: 'High Dividend', tooltipText: 'Findet etablierte, verlässliche Unternehmen, die eine jährliche Dividendenrendite von über 3% ausschütten.' },
            { id: 'crypto-high', label: 'Crypto Top', tooltipTitle: 'Crypto Top', tooltipText: 'Filtert den Kryptomarkt nach hoch bewerteten digitalen Assets mit exzellenter Marktpräsenz.' }
          ].map(p => (
            <div key={p.id} className="w-auto">
              <SimpleTooltip title={p.tooltipTitle} text={p.tooltipText}>
                <button
                  onClick={() => applyPreset(p.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono tracking-wider uppercase transition-all cursor-pointer ${
                    activePreset === p.id 
                      ? 'bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border-aif-gold-DEFAULT/40 font-bold' 
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              </SimpleTooltip>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic KPI Stats Row with Tooltips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SimpleTooltip 
          title="Ergebnisse" 
          text="Die Gesamtzahl der gefilterten Aktien und Kryptowährungen, die all deine gewählten Suchkriterien erfüllen."
        >
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between h-full hover:bg-white/10 transition-colors">
            <div>
              <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">Ergebnisse</p>
              <p className="text-2xl font-black font-mono text-white mt-1">{sortedAssets.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </SimpleTooltip>

        <SimpleTooltip 
          title="Ø P/E (KGV)" 
          text="Das durchschnittliche Kurs-Gewinn-Verhältnis aller angezeigten Aktien. Ein niedriger Durchschnitt deutet auf ein tendenziell günstiger bewertetes Portfolio hin."
        >
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between h-full hover:bg-white/10 transition-colors">
            <div>
              <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">Ø P/E (KGV)</p>
              <p className="text-2xl font-black font-mono text-blue-400 mt-1">{stats.avgPe || 'N/A'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <BarChart4 size={18} />
            </div>
          </div>
        </SimpleTooltip>

        <SimpleTooltip 
          title="Max Dividende" 
          text="Die höchste Dividendenrendite unter allen gefilterten Werten. Zeigt dir die profitabelste jährliche Ausschüttung."
        >
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between h-full hover:bg-white/10 transition-colors">
            <div>
              <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">Max Dividende</p>
              <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{stats.maxDiv ? `${stats.maxDiv}%` : '0.0%'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BadgePercent size={18} />
            </div>
          </div>
        </SimpleTooltip>

        <SimpleTooltip 
          title="Ø KI-Score" 
          text="Der durchschnittliche KI-Score aller gefilterten Werte. Ein Wert nahe 10 bedeutet eine hervorragende Empfehlung der Künstlichen Intelligenz."
        >
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between h-full hover:bg-white/10 transition-colors">
            <div>
              <p className="text-[10px] text-white/40 font-mono tracking-wider uppercase">Ø KI-Score</p>
              <p className="text-2xl font-black font-mono text-aif-gold-DEFAULT mt-1">{stats.avgKi}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-aif-gold-DEFAULT/10 flex items-center justify-center text-aif-gold-DEFAULT">
              <Cpu size={18} />
            </div>
          </div>
        </SimpleTooltip>
      </div>

      {/* Custom Filters Board */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 mb-8 overflow-visible">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <SlidersHorizontal size={16} className="text-aif-gold-DEFAULT" />
            <span>Benutzerdefinierte Filterkriterien</span>
          </div>
          <button 
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Zurücksetzen</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* Assetklasse & Search */}
          <div className="space-y-4">
            <div>
              <SimpleTooltip 
                title="Assetklasse filtern" 
                text="Grenze die Suche auf Aktien (Unternehmensanteile) oder Kryptowährungen (dezentrale Währungen wie Bitcoin) ein."
              >
                <label className="block text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5 cursor-help">Asset-Klasse</label>
              </SimpleTooltip>
              <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5">
                {[
                  { id: 'all', label: 'Alle' },
                  { id: 'stock', label: 'Aktien' },
                  { id: 'crypto', label: 'Krypto' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setAssetType(item.id); setCurrentPage(1); }}
                    className={`flex-1 py-1 px-2.5 rounded-md text-xs font-mono uppercase tracking-wide transition-all cursor-pointer ${
                      assetType === item.id 
                        ? 'bg-white/10 text-white font-bold' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <SimpleTooltip 
                title="Intelligente Suche" 
                text="Tippe Symbole (AAPL), Rufnamen (Apple, Bitcoin) oder umgangssprachliche Aliase (Apfel, Krypto, E-Auto) ein, um die Treffer intelligent zu filtern."
              >
                <label className="block text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5 cursor-help">Direkte Suche</label>
              </SimpleTooltip>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input 
                  type="text"
                  placeholder="Z.B. Apfel, BTC, Tesla..."
                  value={searchQuery}
                  onChange={(e) => { 
                    setSearchQuery(e.target.value); 
                    setCurrentPage(1);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20"
                />

                {/* Autocomplete intelligent dropdown list */}
                <AnimatePresence>
                  {showSuggestions && searchQuery.trim().length > 0 && suggestedAssets.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 right-0 top-full mt-2 bg-neutral-950/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 backdrop-blur-md"
                    >
                      <div className="px-3 py-1.5 text-[9px] text-white/30 font-mono uppercase tracking-widest bg-white/[0.02]">Vorschläge</div>
                      {suggestedAssets.map(item => (
                        <button
                          key={item.symbol}
                          type="button"
                          onMouseDown={() => {
                            setSearchQuery(item.name);
                            setShowSuggestions(false);
                            onSelectSymbol(item.symbol);
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs hover:bg-aif-gold-DEFAULT/10 flex items-center justify-between transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-aif-gold-DEFAULT font-extrabold bg-aif-gold-DEFAULT/15 px-1.5 py-0.5 rounded text-[10px] border border-aif-gold-DEFAULT/20">
                              {item.symbol}
                            </span>
                            <span className="text-white/80 font-bold group-hover:text-white truncate max-w-[130px]">
                              {item.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white/40 font-mono text-[10px]">
                              €{item.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] font-mono font-bold uppercase text-white/30 px-1 py-0.5 rounded bg-white/5">
                              {item.type}
                            </span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* KGV / PE Ratio Custom Range */}
          <div className="space-y-4">
            <div>
              <SimpleTooltip 
                title="KGV (P/E Ratio)" 
                text="Das Kurs-Gewinn-Verhältnis. Gibt an, wie viel Euro Anleger zahlen, um einen Euro Jahresgewinn des Unternehmens zu erwerben. Ein kleineres KGV ist tendenziell günstiger."
              >
                <label className="block text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5 cursor-help">Kurs-Gewinn-Verhältnis (P/E)</label>
              </SimpleTooltip>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Min KGV"
                  value={peMin}
                  onChange={(e) => { setPeMin(e.target.value); setCurrentPage(1); }}
                  disabled={assetType === 'crypto'}
                  className="w-full bg-black/40 border border-white/10 disabled:opacity-30 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20"
                />
                <span className="text-white/30 text-xs">-</span>
                <input 
                  type="number"
                  placeholder="Max KGV"
                  value={peMax}
                  onChange={(e) => { setPeMax(e.target.value); setCurrentPage(1); }}
                  disabled={assetType === 'crypto'}
                  className="w-full bg-black/40 border border-white/10 disabled:opacity-30 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20"
                />
              </div>
              <p className="text-[9px] text-white/30 mt-1.5 font-mono">Normalbereich bei Aktien: 10 - 25</p>
            </div>

            <div>
              <SimpleTooltip 
                title="Benjamin Graham Score" 
                text="Berechnet den inneren Wert einer Aktie nach der klassischen Graham-Formel. Ein höherer Score signalisiert eine stärkere Unterbewertung relativ zu den fundamentalen Gewinnaussichten."
              >
                <label className="block text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5 cursor-help">Graham-DCF Mindestscore</label>
              </SimpleTooltip>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minGrahamScore}
                  onChange={(e) => { setMinGrahamScore(parseFloat(e.target.value)); setCurrentPage(1); }}
                  disabled={assetType === 'crypto'}
                  className="w-full accent-aif-gold-DEFAULT cursor-pointer disabled:opacity-30"
                />
                <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT min-w-[24px] text-right">{minGrahamScore}</span>
              </div>
            </div>
          </div>

          {/* Market Cap Custom Range */}
          <div className="space-y-4">
            <div>
              <SimpleTooltip 
                title="Marktkapitalisierung" 
                text="Der Gesamtwert aller an der Börse ausgegebenen Aktien oder Krypto-Münzen. Errechnet sich aus Preis multipliziert mit der Umlaufmenge."
              >
                <label className="block text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5 cursor-help">Marktkapitalisierung (Mrd. EUR)</label>
              </SimpleTooltip>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Min Mrd."
                  value={mcapMin}
                  onChange={(e) => { setMcapMin(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20"
                />
                <span className="text-white/30 text-xs">-</span>
                <input 
                  type="number"
                  placeholder="Max Mrd."
                  value={mcapMax}
                  onChange={(e) => { setMcapMax(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20"
                />
              </div>
              <p className="text-[9px] text-white/30 mt-1.5 font-mono">Mega Cap &gt; 100 Mrd. • Micro Cap &lt; 1 Mrd.</p>
            </div>

            <div>
              <SimpleTooltip 
                title="Intelligenter KI-Score" 
                text="Unser komplexes KI-Modell gewichtet über 45 technische, fundamentale und stimmungsbasierte Indikatoren und gibt eine Gesamtempfehlung von 0 (bärisch/verkaufen) bis 10 (bullisch/kaufen)."
              >
                <label className="block text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5 cursor-help">KI Intelligent-Score Mindestwert</label>
              </SimpleTooltip>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minKiScore}
                  onChange={(e) => { setMinKiScore(parseFloat(e.target.value)); setCurrentPage(1); }}
                  className="w-full accent-aif-gold-DEFAULT cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT min-w-[24px] text-right">{minKiScore}</span>
              </div>
            </div>
          </div>

          {/* Dividend Yield & Debt to Equity */}
          <div className="space-y-4">
            <div>
              <SimpleTooltip 
                title="Dividendenrendite" 
                text="Die prozentuale jährliche Ausschüttung des Unternehmens bezogen auf den aktuellen Aktienkurs. Eine hohe Dividende bietet verlässlichen passiven Cashflow."
              >
                <label className="block text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5 cursor-help">Dividendenrendite (%)</label>
              </SimpleTooltip>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Min %"
                  value={divMin}
                  onChange={(e) => { setDivMin(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20"
                />
                <span className="text-white/30 text-xs">-</span>
                <input 
                  type="number"
                  placeholder="Max %"
                  value={divMax}
                  onChange={(e) => { setDivMax(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20"
                />
              </div>
              <p className="text-[9px] text-white/30 mt-1.5 font-mono">Solide Dividendenzahler: 1.5% - 4%</p>
            </div>

            <div>
              <SimpleTooltip 
                title="Debt-to-Equity (D/E)" 
                text="Verschuldungsgrad. Vergleicht das Gesamtfremdkapital eines Unternehmens mit seinem Eigenkapital. Werte unter 1.5 bedeuten eine gesunde finanzielle Basis."
              >
                <label className="block text-[10px] text-white/40 font-mono uppercase tracking-wider mb-1.5 cursor-help">Debt-to-Equity Verschuldungsgrad Max</label>
              </SimpleTooltip>
              <input 
                type="number"
                step="0.1"
                placeholder="Max D/E"
                value={deMax}
                onChange={(e) => { setDeMax(e.target.value); setCurrentPage(1); }}
                disabled={assetType === 'crypto'}
                className="w-full bg-black/40 border border-white/10 disabled:opacity-30 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Tabulated List and Results Board */}
      <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        
        {/* Table header control bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white/5 border-b border-white/10 gap-4">
          <div className="text-xs text-white/50 font-mono">
            Zeigt <span className="text-white font-bold">{Math.min(sortedAssets.length, (currentPage - 1) * itemsPerPage + 1)}</span>-
            <span className="text-white font-bold">{Math.min(sortedAssets.length, currentPage * itemsPerPage)}</span> von{' '}
            <span className="text-aif-gold-DEFAULT font-bold">{sortedAssets.length}</span> Treffern
          </div>

          <SimpleTooltip title="CSV Export" text="Lade die aktuell gefilterten Ergebnisse als strukturierte Excel-kompatible CSV-Datei für Excel oder Python herunter.">
            <button
              onClick={exportToCSV}
              disabled={sortedAssets.length === 0}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white font-mono font-bold text-xs rounded-lg border border-white/10 py-1.5 px-3 transition-all cursor-pointer"
            >
              <Download size={14} className="text-aif-gold-DEFAULT" />
              <span>Ergebnisse exportieren (CSV)</span>
            </button>
          </SimpleTooltip>
        </div>

        {/* The responsive table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-white/50 font-mono flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-t-aif-gold-DEFAULT border-white/15 animate-spin" />
              <span>Analysiere globale Markt-Pipelines...</span>
            </div>
          ) : sortedAssets.length === 0 ? (
            <div className="p-16 text-center text-white/40 font-mono">
              <SlidersHorizontal size={24} className="mx-auto text-white/20 mb-3" />
              <p className="text-sm font-bold">Keine Vermögenswerte entsprechen Deinen Kriterien.</p>
              <p className="text-xs text-white/30 mt-1">Passe Deine Filter an oder setze sie zurück, um Ergebnisse zu sehen.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.01]">
                  {[
                    { field: 'symbol', label: 'Symbol', tooltipTitle: 'Wertpapier-Symbol', tooltipText: 'Eindeutiges Kürzel zur Identifizierung des Vermögenswertes an der Börse.' },
                    { field: 'name', label: 'Name', tooltipTitle: 'Vollständiger Name', tooltipText: 'Der Name des börsennotierten Unternehmens oder der Kryptowährung.' },
                    { field: 'price', label: 'Preis', tooltipTitle: 'Aktueller Kurs', tooltipText: 'Der aktuelle Handelswert in Euro (bzw. Einheiten bei Währungen).' },
                    { field: 'change24h', label: '24h %', tooltipTitle: 'Preisschwankung', tooltipText: 'Die prozentuale Kursbewegung innerhalb der vergangenen 24 Stunden.' },
                    { field: 'peRatio', label: 'P/E (KGV)', tooltipTitle: 'Kurs-Gewinn-Verhältnis', tooltipText: 'Kurs-Gewinn-Verhältnis der letzten 12 Monate. Nur für Aktien verfügbar.' },
                    { field: 'marketCap', label: 'Market Cap', tooltipTitle: 'Marktkapitalisierung', tooltipText: 'Der Gesamtwert aller ausgegebenen Einheiten (Aktien/Coins) an der Börse.' },
                    { field: 'volume24h', label: 'Volumen 24h', tooltipTitle: 'Handelsvolumen 24h', tooltipText: 'Das Handelsvolumen der letzten 24 Stunden in Mio. USD. Wichtiger Maßstab für Top-Regulierung.' },
                    { field: 'dividendYield', label: 'Dividende', tooltipTitle: 'Dividendenrendite', tooltipText: 'Die prozentuale jährliche Gewinnausschüttung bezogen auf den Preis.' },
                    { field: 'debtToEquity', label: 'D/E', tooltipTitle: 'Debt-to-Equity Ratio', tooltipText: 'Der Verschuldungsgrad des Unternehmens. Gibt die finanzielle Hebelwirkung an.' },
                    { field: 'grahamScore', label: 'Graham', tooltipTitle: 'Graham Score', tooltipText: 'Der errechnete Grad der fundamentalen Unterbewertung nach Benjamin Graham.' },
                    { field: 'score', label: 'KI-Score', tooltipTitle: 'Zentraler KI-Score', tooltipText: 'Die Gesamtbewertung des Vermögenswertes von 0 bis 10 durch unser KI-Modell.' }
                  ].map(header => (
                    <th 
                      key={header.field}
                      onClick={() => handleSort(header.field as SortField)}
                      className="px-4 py-3 text-[10px] font-mono tracking-widest uppercase text-white/40 font-bold hover:text-white hover:bg-white/5 cursor-pointer transition-all select-none"
                    >
                      <SimpleTooltip title={header.tooltipTitle} text={header.tooltipText}>
                        <div className="flex items-center gap-1.5">
                          <span>{header.label}</span>
                          <ArrowUpDown size={10} className={sortField === header.field ? 'text-aif-gold-DEFAULT' : 'text-white/20'} />
                        </div>
                      </SimpleTooltip>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-[10px] font-mono tracking-widest uppercase text-white/40 font-bold text-right">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {paginatedAssets.map((asset) => {
                    const isSelected = selectedSymbol === asset.symbol;
                    const changeIsPositive = asset.change24h >= 0;

                    return (
                      <motion.tr 
                        key={asset.symbol}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`transition-all ${isSelected ? 'bg-aif-gold-DEFAULT/5' : 'hover:bg-white/[0.02]'}`}
                      >
                        {/* Symbol */}
                        <td className="px-4 py-3.5 font-mono text-xs font-black text-white">
                          <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase">
                            {asset.symbol}
                          </span>
                        </td>

                        {/* Name & Type */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs font-bold text-white max-w-[120px] truncate" title={asset.name}>
                            {asset.name}
                          </div>
                          <div className="text-[9px] text-white/40 font-mono mt-0.5 uppercase tracking-wider">
                            {asset.type === 'stock' ? 'Aktie' : asset.type === 'crypto' ? 'Krypto' : asset.type === 'commodity' ? 'Rohstoff' : 'Forex'}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3.5 font-mono text-xs text-white">
                          €{asset.price < 10 ? asset.price.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : asset.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* 24h Change */}
                        <td className={`px-4 py-3.5 font-mono text-xs font-bold ${changeIsPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <div className="flex items-center gap-1">
                            {changeIsPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>{changeIsPositive ? '+' : ''}{asset.change24h.toFixed(2)}%</span>
                          </div>
                        </td>

                        {/* P/E Ratio */}
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-300">
                          {asset.peRatio !== undefined ? asset.peRatio.toFixed(1) : '-'}
                        </td>

                        {/* Market Cap */}
                        <td className="px-4 py-3.5 font-mono text-xs text-purple-300">
                          {asset.marketCap !== undefined ? `${asset.marketCap.toFixed(1)}B` : '-'}
                        </td>

                        {/* Volume 24h */}
                        <td className="px-4 py-3.5 font-mono text-xs text-amber-300">
                          {asset.volume24h !== undefined ? `${asset.volume24h.toLocaleString('de-DE', { maximumFractionDigits: 1 })}M` : '-'}
                        </td>

                        {/* Dividend Yield */}
                        <td className="px-4 py-3.5 font-mono text-xs text-emerald-300">
                          {asset.dividendYield !== undefined && asset.dividendYield > 0 ? `${asset.dividendYield.toFixed(2)}%` : '-'}
                        </td>

                        {/* Debt-to-Equity */}
                        <td className="px-4 py-3.5 font-mono text-xs text-white/60">
                          {asset.debtToEquity !== undefined ? asset.debtToEquity.toFixed(2) : '-'}
                        </td>

                        {/* Graham Value */}
                        <td className="px-4 py-3.5">
                          {asset.grahamScore > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {asset.grahamScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-white/20 font-mono text-xs">-</span>
                          )}
                        </td>

                        {/* KI-Score */}
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-aif-gold-DEFAULT">
                          <span className="px-1.5 py-0.5 rounded bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/25">
                            {asset.score.toFixed(1)}
                          </span>
                        </td>

                        {/* Action select button */}
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => onSelectSymbol(asset.symbol)}
                            className={`px-3 py-1.5 rounded-lg font-mono text-[10px] tracking-widest uppercase transition-all font-black cursor-pointer ${
                              isSelected 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-aif-gold-DEFAULT text-black hover:brightness-110 shadow-[0_0_10px_rgba(245,196,83,0.2)]'
                            }`}
                          >
                            {isSelected ? 'AKTIV' : 'WÄHLEN'}
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination control footer bar */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 bg-white/[0.01] border-t border-white/10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 bg-white/5 border border-white/10 text-xs font-mono py-1 px-3 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Zurück</span>
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center transition-all cursor-pointer ${
                      currentPage === pageNum 
                        ? 'bg-aif-gold-DEFAULT text-black font-black' 
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 bg-white/5 border border-white/10 text-xs font-mono py-1 px-3 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 transition-all cursor-pointer"
            >
              <span>Weiter</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
