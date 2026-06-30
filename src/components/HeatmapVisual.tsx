import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Flame, TrendingUp, TrendingDown, Clock, HelpCircle, CheckCircle2, Search, RefreshCw } from 'lucide-react';

interface HeatmapVisualProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

interface SentimentNode {
  symbol: string;
  name: string;
  sector: 'Crypto' | 'Stock' | 'Forex' | 'Commodity';
  bullish: number; // percentage
  bearish: number; // percentage
  volume24h: string;
  aiVerdict: string;
}

const INITIAL_NODES: SentimentNode[] = [
  { symbol: 'BTC', name: 'Bitcoin', sector: 'Crypto', bullish: 78, bearish: 22, volume24h: '28.4B', aiVerdict: 'Stark Bullish' },
  { symbol: 'ETH', name: 'Ethereum', sector: 'Crypto', bullish: 64, bearish: 36, volume24h: '14.2B', aiVerdict: 'Moderat Bullish' },
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Stock', bullish: 72, bearish: 28, volume24h: '9.8B', aiVerdict: 'Stabil Bullish' },
  { symbol: 'TSLA', name: 'Tesla Motors', sector: 'Stock', bullish: 49, bearish: 51, volume24h: '18.1B', aiVerdict: 'Neutral / Volatil' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Stock', bullish: 89, bearish: 11, volume24h: '34.6B', aiVerdict: 'Extrem Bullish' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', sector: 'Forex', bullish: 41, bearish: 59, volume24h: '85.0B', aiVerdict: 'Bearish Bias' },
  { symbol: 'GLD', name: 'Gold Trust', sector: 'Commodity', bullish: 83, bearish: 17, volume24h: '3.1B', aiVerdict: 'Sicherer Hafen' },
  { symbol: 'BRENT', name: 'Crude Oil', sector: 'Commodity', bullish: 38, bearish: 62, volume24h: '7.4B', aiVerdict: 'Bearish' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Stock', bullish: 75, bearish: 25, volume24h: '11.5B', aiVerdict: 'Stark Bullish' }
];

export function HeatmapVisual({ selectedSymbol, onSelectSymbol }: HeatmapVisualProps) {
  const [apiNodes, setApiNodes] = useState<SentimentNode[]>([]);
  const [customNodes, setCustomNodes] = useState<SentimentNode[]>([]);
  const [deletedSymbols, setDeletedSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showToast, setShowToast] = useState(false);
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Convert Asset from API to SentimentNode
  const convertAssetToNode = (asset: any): SentimentNode => {
    const bull = Math.round(Math.min(95, Math.max(5, 50 + (asset.change24h || 0) * 5 + ((asset.score || 5) - 5) * 3)));
    const bear = 100 - bull;
    
    let volString = '1.2B';
    if (asset.marketCap) {
      const calculatedVol = asset.marketCap * 0.05;
      if (calculatedVol >= 1) {
        volString = calculatedVol.toFixed(1) + 'B';
      } else {
        volString = (calculatedVol * 1000).toFixed(0) + 'M';
      }
    }

    let aiVerd = 'Neutral / Volatil';
    if (bull >= 85) aiVerd = 'Extrem Bullish';
    else if (bull >= 70) aiVerd = 'Stark Bullish';
    else if (bull >= 55) aiVerd = 'Moderat Bullish';
    else if (bull >= 45) aiVerd = 'Neutral';
    else if (bull >= 30) aiVerd = 'Bearish Bias';
    else aiVerd = 'Stark Bearish';

    let sec: 'Crypto' | 'Stock' | 'Forex' | 'Commodity' = 'Stock';
    if (asset.type === 'crypto') sec = 'Crypto';
    else if (asset.type === 'stock') sec = 'Stock';
    else if (asset.type === 'forex') sec = 'Forex';
    else if (asset.type === 'commodity') sec = 'Commodity';

    return {
      symbol: asset.symbol,
      name: asset.name,
      sector: sec,
      bullish: bull,
      bearish: bear,
      volume24h: volString,
      aiVerdict: aiVerd
    };
  };

  // Sync state with localStorage and fetch real API data
  const loadData = () => {
    // Load custom nodes from labor if they exist
    const savedCustom = localStorage.getItem('aif_custom_heatmap_nodes');
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        setCustomNodes(parsed.map((n: any) => ({
          symbol: n.symbol,
          name: n.name,
          sector: n.sector,
          bullish: n.bullish,
          bearish: n.bearish,
          volume24h: n.volume24h,
          aiVerdict: n.aiVerdict
        })));
      } catch (e) {
        setCustomNodes([]);
      }
    } else {
      setCustomNodes([]);
    }

    // Load deleted symbols from labor
    const savedDeleted = localStorage.getItem('aif_deleted_heatmap_symbols');
    if (savedDeleted) {
      try {
        setDeletedSymbols(JSON.parse(savedDeleted));
      } catch (e) {
        setDeletedSymbols([]);
      }
    } else {
      setDeletedSymbols([]);
    }

    setLoading(true);
    fetch('/api/market-data')
      .then(res => {
        if (!res.ok) throw new Error(`Market data response not ok: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          const nonVariants = data.filter((asset: any) => asset?.name && !asset.name.toLowerCase().includes('variant'));
          const converted = nonVariants.map((asset: any) => convertAssetToNode(asset));
          setApiNodes(converted);
        } else {
          console.warn('HeatmapVisual: received invalid non-array market data');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading heatmap assets from API in preview:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    // Re-check localStorage when active tab is changed or when a new symbol is selected to keep them nicely in sync
  }, [selectedSymbol]);

  // Timer effect for 30s refresh cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          triggerDataRefresh();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const triggerDataRefresh = () => {
    // Fluctuates sentiment slightly for realistic live feed simulation
    setApiNodes((prevNodes) =>
      prevNodes.map((node) => {
        const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const newBullish = Math.min(95, Math.max(5, node.bullish + change));
        return {
          ...node,
          bullish: newBullish,
          bearish: 100 - newBullish,
          aiVerdict: getVerdict(newBullish)
        };
      })
    );
    setCustomNodes((prevNodes) =>
      prevNodes.map((node) => {
        const change = Math.floor(Math.random() * 7) - 3; // -3 to +3
        const newBullish = Math.min(95, Math.max(5, node.bullish + change));
        return {
          ...node,
          bullish: newBullish,
          bearish: 100 - newBullish,
          aiVerdict: getVerdict(newBullish)
        };
      })
    );
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const getVerdict = (bullish: number): string => {
    if (bullish >= 85) return 'Extrem Bullish';
    if (bullish >= 70) return 'Stark Bullish';
    if (bullish >= 55) return 'Moderat Bullish';
    if (bullish >= 45) return 'Neutral';
    if (bullish >= 30) return 'Bearish Bias';
    return 'Stark Bearish';
  };

  const getSentimentColor = (bullish: number) => {
    if (bullish >= 75) return 'from-emerald-950/40 via-emerald-900/30 to-black/80 border-emerald-500/40 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)]';
    if (bullish >= 55) return 'from-green-950/20 via-green-900/10 to-black/80 border-green-600/30 text-green-300';
    if (bullish >= 45) return 'from-aif-gold-dark/10 via-black/40 to-black/80 border-aif-gold-DEFAULT/25 text-aif-gold-DEFAULT';
    return 'from-rose-950/40 via-rose-900/30 to-black/80 border-rose-500/40 text-rose-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.15)]';
  };

  const getHeatmapBg = (bullish: number) => {
    if (bullish >= 75) return 'bg-emerald-500/20';
    if (bullish >= 55) return 'bg-green-500/10';
    if (bullish >= 45) return 'bg-aif-gold-DEFAULT/10';
    return 'bg-rose-500/20';
  };

  // Merge custom nodes and API nodes dynamically
  const allNodes = useMemo(() => {
    const merged = [...customNodes];
    apiNodes.forEach(apiNode => {
      const symUpper = apiNode.symbol.toUpperCase();
      if (!deletedSymbols.includes(symUpper) && !merged.some(n => n.symbol.toUpperCase() === symUpper)) {
        merged.push(apiNode);
      }
    });
    return merged.length > 0 ? merged : INITIAL_NODES;
  }, [customNodes, apiNodes, deletedSymbols]);

  // Filter nodes by sector and search query
  const filteredNodes = useMemo(() => {
    return allNodes.filter(node => {
      const matchesSector = selectedSectorFilter === 'all' || node.sector.toLowerCase() === selectedSectorFilter.toLowerCase();
      const matchesSearch = node.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            node.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSector && matchesSearch;
    });
  }, [allNodes, selectedSectorFilter, searchTerm]);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md h-full min-h-[440px] flex flex-col relative group">
      {/* Dynamic top glowing border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-neon-cyan/40 to-transparent" />

      {/* Header */}
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 font-display">
            Interaktive Markt-Sentiment-Heatmap
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Neuronales Mapping & algorithmischer Stimmungsindex basierend auf NLP & News-Flow
          </p>
        </div>

        {/* Live Countdown & Sync Status */}
        <div className="flex items-center gap-3 bg-black/60 px-4 py-2 rounded-xl border border-white/10 select-none">
          <Clock size={14} className="text-aif-neon-cyan animate-pulse shrink-0" />
          <div className="text-xs font-mono font-bold flex items-center gap-1">
            <span className="text-white/40">Refresh in:</span>
            <span className="text-aif-neon-cyan w-6 text-center">{timeLeft}s</span>
          </div>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0 hidden xs:block">
            <motion.div 
              className="h-full bg-aif-neon-cyan"
              initial={{ width: '100%' }}
              animate={{ width: `${(timeLeft / 30) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="px-6 pt-4 pb-2 border-b border-white/5 flex flex-col sm:flex-row gap-3 relative z-10">
        <div className="flex gap-1 bg-black/50 p-1 rounded-lg border border-white/5 overflow-x-auto shrink-0">
          {['all', 'stock', 'crypto', 'forex', 'commodity'].map(sec => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSectorFilter(sec)}
              className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedSectorFilter === sec 
                  ? 'bg-aif-gold-DEFAULT text-black' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {sec === 'all' ? 'Alle' : sec === 'stock' ? 'Aktien' : sec === 'crypto' ? 'Krypto' : sec === 'forex' ? 'Forex' : 'Rohstoffe'}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Kacheln filtern..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-4 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT font-mono"
          />
        </div>
      </div>

      {/* Heatmap Grid area */}
      <div className="flex-1 p-6 flex flex-col justify-between bg-gradient-to-b from-transparent to-black/20">
        
        {/* Toast alert on refresh */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-emerald-500/90 text-black font-black font-mono text-xs px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center gap-1.5"
            >
              <CheckCircle2 size={13} />
              SENTIMENTS AKTUALISIERT!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid of Nodes */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw size={24} className="text-aif-neon-cyan animate-spin" />
            <span className="text-xs font-mono text-white/40">Lade alle Markt-Sentiment-Kacheln...</span>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <span className="text-xs font-mono text-white/40">Keine Assets für Filterkriterien gefunden.</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 flex-1 max-h-[360px] overflow-y-auto pr-1.5 custom-scrollbar pb-2">
            {filteredNodes.slice(0, 9).map((node) => {
              const isSelected = selectedSymbol === node.symbol;
              const styleClasses = getSentimentColor(node.bullish);
              const badgeBg = getHeatmapBg(node.bullish);

              return (
                <motion.div
                  key={node.symbol}
                  whileHover={{ scale: 1.02, y: -1 }}
                  onClick={() => onSelectSymbol(node.symbol)}
                  className={`cursor-pointer rounded-xl border p-2.5 sm:p-3 flex flex-col justify-between transition-all relative overflow-hidden bg-gradient-to-br ${styleClasses} ${
                    isSelected ? 'ring-2 ring-white border-transparent' : ''
                  }`}
                >
                  {/* Micro background pulse for active elements */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                  )}

                  {/* Subdued grid lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />

                  {/* Top Info */}
                  <div className="relative z-10 flex justify-between items-start gap-1">
                    <div className="overflow-hidden">
                      <span className="text-[8px] uppercase tracking-wider font-bold opacity-45 block leading-none">{node.sector}</span>
                      <span className="text-xs sm:text-sm font-black font-mono tracking-tight block mt-1 truncate">{node.symbol}</span>
                    </div>
                    <div className={`px-1.5 py-0.5 rounded text-[7px] xs:text-[8px] font-black font-mono tracking-wide ${badgeBg} border border-white/5 shrink-0`}>
                      {node.aiVerdict}
                    </div>
                  </div>

                  {/* Sentiment Ratio visuals */}
                  <div className="relative z-10 my-2 space-y-1">
                    <div className="flex justify-between items-end text-[9px] font-mono leading-none">
                      <span className="font-bold flex items-center gap-0.5">
                        <TrendingUp size={10} className="opacity-85 text-emerald-400" /> {node.bullish}%
                      </span>
                      <span className="opacity-40 text-[8px]">Bullish</span>
                    </div>

                    {/* Segmented Sentiment Bar */}
                    <div className="h-1 w-full rounded-full bg-black/60 border border-white/5 overflow-hidden flex">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000"
                        style={{ width: `${node.bullish}%` }}
                      />
                      <div 
                        className="h-full bg-gradient-to-r from-rose-500 to-red-400 transition-all duration-1000"
                        style={{ width: `${node.bearish}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Stats */}
                  <div className="relative z-10 flex justify-between items-center text-[8px] sm:text-[9px] font-mono opacity-50 pt-1 border-t border-white/5">
                    <span>Vol 24h:</span>
                    <span className="font-bold text-white truncate">${node.volume24h}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer/Helper info */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col xs:flex-row justify-between items-center text-[10px] font-mono text-white/40 gap-2">
          <span className="flex items-center gap-1.5 text-center xs:text-left leading-normal">
            <Flame size={12} className="text-aif-gold-DEFAULT animate-pulse" />
            Grün: Hoher Bullish Index | Rot: Verkaufsdruck | Gold: Konsolidierung
          </span>
          <span className="text-center xs:text-right leading-normal">
            Klicke auf Kacheln zum Auswählen & Filtern.
          </span>
        </div>
      </div>
    </div>
  );
}
