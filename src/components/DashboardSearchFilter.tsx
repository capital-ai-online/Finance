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
      className="bg-black/40 border border-white/10 rounded-xl p-4 backdrop-blur-md relative transition-all duration-200" 
      ref={dropdownRef}
    >
      {/* Category Tabs & Active Asset Status */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1 bg-black/60 p-1 rounded-xl border border-white/10 w-full sm:w-auto overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategoryFilter(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                categoryFilter === cat.value
                  ? 'bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark text-black shadow-[0_0_10px_rgba(245,196,83,0.25)] font-black'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Selected Asset Indicator */}
        {currentAsset && (
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aif-gold-DEFAULT opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-aif-gold-DEFAULT"></span>
            </span>
            <span className="text-zinc-500">Asset:</span>
            <span className="text-aif-gold-DEFAULT font-bold bg-aif-gold-DEFAULT/10 px-1.5 py-0.5 rounded font-mono">
              {currentAsset.symbol}
            </span>
            <span className="text-zinc-300 font-medium hidden md:inline">{currentAsset.name}</span>
          </div>
        )}
      </div>

      {/* Category Counts Summary */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-500">
        <span className="font-bold text-zinc-400">Asset-Bestand:</span>
        <span>Gesamt: <strong className="text-zinc-400 font-bold">{assets.length}</strong></span>
        <span>Equities: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'stock').length}</strong></span>
        <span>Forex: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'forex').length}</strong></span>
        <span>Crypto: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'crypto').length}</strong></span>
        <span>Commodities: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'commodity').length}</strong></span>
        <span>Bonds: <strong className="text-zinc-400 font-bold">{assets.filter(a => a.type === 'bond').length}</strong></span>
      </div>
    </div>
  );
}
