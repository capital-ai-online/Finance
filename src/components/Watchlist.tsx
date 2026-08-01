import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Search, 
  ChevronRight,
  Bell,
  Zap,
  AlertOctagon,
  ArrowUpRight
} from 'lucide-react';
import { AssetLogo } from './AssetLogo';

export interface WatchlistAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'commodity' | 'index' | 'forex' | 'bond';
  price: number;
  change24h: number;
  score: number;
  // Audit ARCH-AUDIT-0002 (AUD2-F-001): siehe Asset.scoreBasis in src/types.ts.
  scoreBasis?: 'synthetic';
}

interface WatchlistProps {
  watchlist: string[];
  onRemove: (symbol: string) => void;
  onAdd: (symbol: string) => void;
  onSelectAsset: (symbol: string) => void;
  selectedSymbol: string;
  onSimulateScoreEvent?: (symbol: string, type: 'crash' | 'rally') => void;
}

export function Watchlist({
  watchlist,
  onRemove,
  onAdd,
  onSelectAsset,
  selectedSymbol,
  onSimulateScoreEvent
}: WatchlistProps) {
  const [allAssets, setAllAssets] = useState<WatchlistAsset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch all assets for adding to watchlist
  useEffect(() => {
    fetch('/api/market-data')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load market data');
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          const clean = data.filter((a: any) => a?.name && !a.name.toLowerCase().includes('variant'));
          setAllAssets(clean);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error in Watchlist fetching market data:', err);
        setLoading(false);
      });
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestion list
  const filteredSuggestions = allAssets
    .filter(asset => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return false;
      return (
        (asset.symbol.toLowerCase().includes(q) || asset.name.toLowerCase().includes(q)) &&
        !watchlist.includes(asset.symbol)
      );
    })
    .slice(0, 5);

  // Filtered watched assets with live data
  const watchedAssetsData = watchlist
    .map(symbol => {
      const live = allAssets.find(a => a.symbol === symbol);
      if (live) return live;
      // Fallback if not loaded yet
      return {
        symbol,
        name: symbol,
        type: 'crypto' as const,
        price: 0,
        change24h: 0,
        score: 5.0
      };
    });

  const handleAddAsset = (symbol: string) => {
    onAdd(symbol);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md h-full relative overflow-hidden flex flex-col justify-between group">
      {/* Decorative top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-aif-gold-DEFAULT via-amber-500 to-violet-600" />
      
      <div className="space-y-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-aif-gold-DEFAULT">
              <Eye size={14} className="animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest font-mono">
                Persönliches Radar
              </span>
            </div>
            <h3 className="text-lg font-black text-white font-display mt-0.5">Watchlist</h3>
          </div>
          <span className="text-[11px] font-mono text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {watchlist.length} Assets
          </span>
        </div>

        {/* Add Asset Input */}
        <div className="relative" ref={suggestionsRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
            <input
              type="text"
              placeholder="Asset suchen & hinzufügen..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all font-sans"
            />
          </div>

          {/* Autocomplete Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && filteredSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute left-0 right-0 mt-1 bg-[#0e0e11]/95 border border-white/15 rounded-lg shadow-2xl z-30 overflow-hidden divide-y divide-white/5 backdrop-blur-lg"
              >
                {filteredSuggestions.map((asset) => (
                  <button
                    key={asset.symbol}
                    onClick={() => handleAddAsset(asset.symbol)}
                    className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={asset.symbol} size={16} />
                      <div>
                        <span className="font-bold text-white font-mono">{asset.symbol}</span>
                        <span className="text-[10px] text-white/40 ml-2 font-sans">{asset.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/50 uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {asset.type}
                      </span>
                      <Plus size={12} className="text-aif-gold-DEFAULT" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Asset List Container */}
        <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2 pr-1 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <span className="text-xs font-mono text-white/30">Lade Radar-Daten...</span>
            </div>
          ) : watchedAssetsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
              <Eye size={24} className="text-white/20 mb-2" />
              <span className="text-xs font-bold text-white/60">Watchlist ist leer</span>
              <span className="text-[10px] text-white/30 max-w-[180px] mt-1 leading-normal">
                Suche oben nach Krypto, Aktien oder Rohstoffen, um sie zu überwachen.
              </span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {watchedAssetsData.map((asset) => {
                const isSelected = selectedSymbol === asset.symbol;
                const change24h = asset.change24h || 0;
                const isPositive = change24h >= 0;
                const rawScore = asset.score || 5.0;
                const score = rawScore > 10 ? rawScore / 10 : rawScore;
                
                // Score badges styling
                let scoreColor = 'bg-white/5 border-white/10 text-white/70';
                if (score > 7) {
                  scoreColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold shadow-[0_0_8px_rgba(16,185,129,0.15)]';
                } else if (score < 3) {
                  scoreColor = 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-bold shadow-[0_0_8px_rgba(244,63,94,0.15)]';
                }

                return (
                  <motion.div
                    key={asset.symbol}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      isSelected 
                        ? 'bg-violet-950/20 border-violet-500/40 shadow-[0_0_12px_rgba(139,92,246,0.1)]' 
                        : 'bg-white/5 border-white/5 hover:border-white/15'
                    }`}
                  >
                    {/* Left side: Logo & Meta clickable to select */}
                    <div 
                      onClick={() => onSelectAsset(asset.symbol)}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                    >
                      <AssetLogo symbol={asset.symbol} size={20} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-white truncate">{asset.symbol}</span>
                          {score > 7 && <Sparkles size={10} className="text-emerald-400 shrink-0" />}
                          {score < 3 && <AlertOctagon size={10} className="text-rose-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] text-white/40 truncate block max-w-[110px]">{asset.name}</span>
                      </div>
                    </div>

                    {/* Right side: Price, Change & Score & Interactive Quick Simulation Buttons */}
                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <div className="font-mono text-xs text-white font-semibold">
                          ${asset.price > 1000 ? asset.price.toLocaleString('de-DE') : asset.price.toFixed(asset.price < 2 ? 4 : 2)}
                        </div>
                        <div className={`font-mono text-[9px] font-bold flex items-center justify-end gap-0.5 ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isPositive ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                          <span>{isPositive ? '+' : ''}{change24h.toFixed(2)}%</span>
                        </div>
                      </div>

                      {/* Score display */}
                      {/* Audit ARCH-AUDIT-0002 (AUD2-F-001): Tooltip legt bei synthetischen
                          Scores (Crypto, algorithmisch aus dem Symbol abgeleitet) offen, dass
                          keine Marktdaten zugrunde liegen (No-Demo-Data-Policy). */}
                      <div
                        className={`font-mono text-[10px] py-1 px-1.5 rounded border text-center min-w-[32px] ${scoreColor}`}
                        title={
                          asset.scoreBasis === 'synthetic'
                            ? `Asset Scoring: ${score}/10 — nicht marktdatenbasiert (algorithmisch aus dem Symbol abgeleitet)`
                            : `Asset Scoring: ${score}/10`
                        }
                      >
                        {score.toFixed(1)}
                      </div>

                      {/* Simulation Triggers for push-up testing */}
                      {onSimulateScoreEvent && (
                        <div className="flex flex-col gap-0.5 border-l border-white/10 pl-1.5 shrink-0">
                          <button
                            onClick={() => onSimulateScoreEvent(asset.symbol, 'rally')}
                            className="p-0.5 text-[8px] font-mono uppercase bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded font-black hover:scale-105 transition-all"
                            title="Simuliere News mit Bullish Breakout (>7)"
                          >
                            ▲ RLY
                          </button>
                          <button
                            onClick={() => onSimulateScoreEvent(asset.symbol, 'crash')}
                            className="p-0.5 text-[8px] font-mono uppercase bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 rounded font-black hover:scale-105 transition-all"
                            title="Simuliere News mit Bearish Crash (<3)"
                          >
                            ▼ CRH
                          </button>
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemove(asset.symbol)}
                        className="p-1 hover:bg-rose-500/10 hover:text-rose-400 text-white/30 rounded transition-colors cursor-pointer shrink-0"
                        title="Vom Radar entfernen"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[9px] font-mono text-white/30">
        <span className="flex items-center gap-1">
          <Bell size={10} className="text-aif-gold-DEFAULT animate-pulse" />
          <span>News &lt;3.0 o. &gt;7.0 triggeren Push</span>
        </span>
        <span className="text-aif-gold-DEFAULT">Radar-Modul v0.5.4</span>
      </div>
    </div>
  );
}
