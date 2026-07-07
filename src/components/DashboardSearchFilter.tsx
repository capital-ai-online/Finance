import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, TrendingUp, TrendingDown, Eye, Sparkles, Newspaper, ChevronRight, X } from 'lucide-react';
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

interface DashboardSearchFilterProps {
  onSelectAsset: (symbol: string) => void;
  selectedSymbol: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
}

export function DashboardSearchFilter({
  onSelectAsset,
  selectedSymbol,
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
}: DashboardSearchFilterProps) {
  const [assets, setAssets] = useState<SearchAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      {/* Search Input and Categories */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input Field */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400/60" />
          </div>
          <input
            type="text"
            placeholder="Symbol oder Name suchen... (z.B. BTC, AAPL, DAX, Gold)"
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-aif-gold-DEFAULT focus:ring-1 focus:ring-aif-gold-DEFAULT transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 bg-black/60 p-1 rounded-lg border border-white/10 w-full md:w-auto overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
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
                      <div className="flex items-center gap-5 text-right font-mono">
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
              <span>CAPITAL-AI Beta Version 0.5.4</span>
              <span>Zeige max. 8 Suchergebnisse</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
