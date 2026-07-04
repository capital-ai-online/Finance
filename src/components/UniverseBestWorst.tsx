import React, { useEffect, useState } from 'react';
import { 
  Orbit, 
  TrendingUp, 
  Compass, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  AlertTriangle,
  Award,
  TrendingDown,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { AssetLogo } from './AssetLogo';

interface RegistryAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
  price: number;
  change24h: number;
  expectedReturn: number;
  volatility: number;
  drift: number;
  risk: 'High' | 'Medium' | 'Low';
  status: string;
  score: number;
  peRatio?: number;
  dividendYield?: number;
}

interface UniverseGroup {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  accentColor: string;
  bgGlow: string;
  description: string;
  best: RegistryAsset[];
  worst: RegistryAsset[];
}

interface UniverseBestWorstProps {
  onSelectAsset?: (symbol: string) => void;
}

export function UniverseBestWorst({ onSelectAsset }: UniverseBestWorstProps) {
  const [assets, setAssets] = useState<RegistryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssets() {
      try {
        setLoading(true);
        const response = await fetch('/api/registry/assets');
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Asset-Daten.');
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setAssets(data);
        } else {
          throw new Error('Ungültiges Datenformat vom Server.');
        }
      } catch (err: any) {
        console.error('Error fetching assets for best/worst list:', err);
        setError(err.message || 'Verbindungsfehler zum Backend.');
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  if (loading) {
    return (
      <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="h-5 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-3.5 w-80 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-white/5 rounded-xl border border-white/5 p-4 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-20 bg-white/10 rounded" />
                  <div className="h-3 w-32 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-20 bg-white/5 rounded-lg" />
              <div className="h-20 bg-white/5 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-950/60 border border-red-500/20 rounded-2xl p-6 backdrop-blur-md text-center space-y-3">
        <AlertTriangle className="text-red-400 mx-auto" size={32} />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ladefehler</h3>
        <p className="text-xs text-white/60 font-mono">{error}</p>
      </div>
    );
  }

  // Group assets into the 5 universes
  const cryptoGroup = assets.filter(a => a.type === 'crypto');
  const stockGroup = assets.filter(a => a.type === 'stock');
  const forexGroup = assets.filter(a => a.type === 'forex');
  const commodityGroup = assets.filter(a => a.type === 'commodity');
  const indexGroup = assets.filter(a => a.type === 'index');

  const getBestAndWorst = (groupAssets: RegistryAsset[]) => {
    if (groupAssets.length === 0) return { best: [], worst: [] };
    
    // Sort by score descending
    const sorted = [...groupAssets].sort((a, b) => b.score - a.score);
    
    const best = sorted.slice(0, 2);
    // For worst, if there are fewer than 4 assets, slice from the remaining elements
    const worst = sorted.slice(-2).reverse(); // Reverse so the absolute worst is last or first depending on preference
    
    return { best, worst };
  };

  const universes: UniverseGroup[] = [
    {
      id: 'crypto',
      name: 'Crypto Cosmos',
      icon: Orbit,
      color: 'from-purple-500/25 to-indigo-600/10 border-purple-500/35 text-purple-400',
      accentColor: '#a855f7',
      bgGlow: 'rgba(168,85,247,0.15)',
      description: 'Digitale Leitwährungen & Token',
      ...getBestAndWorst(cryptoGroup)
    },
    {
      id: 'stock',
      name: 'Stock Galaxy',
      icon: TrendingUp,
      color: 'from-cyan-500/25 to-teal-600/10 border-cyan-500/35 text-cyan-400',
      accentColor: '#06b6d4',
      bgGlow: 'rgba(6,182,212,0.15)',
      description: 'Tech-Giganten & Bluechips',
      ...getBestAndWorst(stockGroup)
    },
    {
      id: 'index',
      name: 'Index World',
      icon: Compass,
      color: 'from-blue-500/25 to-indigo-600/10 border-blue-500/35 text-blue-400',
      accentColor: '#3b82f6',
      bgGlow: 'rgba(59,130,246,0.15)',
      description: 'Top 30 Globale Indizes',
      ...getBestAndWorst(indexGroup)
    },
    {
      id: 'forex',
      name: 'Forex Nebula',
      icon: Compass,
      color: 'from-amber-500/25 to-yellow-600/10 border-amber-500/35 text-amber-400',
      accentColor: '#f59e0b',
      bgGlow: 'rgba(245,158,11,0.15)',
      description: 'Globale Währungspaare',
      ...getBestAndWorst(forexGroup)
    },
    {
      id: 'commodity',
      name: 'Commodity Nebula',
      icon: Layers,
      color: 'from-rose-500/25 to-pink-600/10 border-rose-500/35 text-rose-400',
      accentColor: '#f43f5e',
      bgGlow: 'rgba(244,63,94,0.15)',
      description: 'Edelmetalle & Ressourcen',
      ...getBestAndWorst(commodityGroup)
    }
  ];

  const formatPrice = (price: number, type: string) => {
    if (type === 'forex') {
      return price.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
    return price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-neutral-950/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden" id="universe-scoring-root">
      {/* Background visual styling */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-5 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-purple-500/15 text-purple-400 border border-purple-500/25 uppercase">
              CAPITAL-AI QUANT-SYSTEM
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 uppercase flex items-center gap-1">
              <Activity size={10} />
              Live-Scoring
            </span>
          </div>
          <h2 className="text-lg font-black font-display text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="text-purple-400 shrink-0" size={18} />
            <span>Universum Best- &amp; Worst-Assets</span>
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-2xl leading-relaxed">
            Echtzeit-Performance-Leaderboards aller fünf quantitativen Handelsuniversen. Die Einstufung erfolgt streng algorithmisch basierend auf unserem Backend-Multi-Faktor-Scoringsystem (Bewertungsskala 0-100).
          </p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 relative z-10">
        {universes.map((univ) => {
          const UnivIcon = univ.icon;
          return (
            <div 
              key={univ.id} 
              className="bg-black/40 border border-white/5 hover:border-white/15 rounded-xl p-4 flex flex-col justify-between transition-all duration-300 relative group"
              style={{
                boxShadow: `0 0 30px rgba(0,0,0,0.5), inset 0 0 20px ${univ.bgGlow}`
              }}
            >
              {/* Universe Header */}
              <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${univ.color} flex items-center justify-center border shrink-0 shadow-lg`}>
                  <UnivIcon size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black font-display text-white uppercase tracking-wider group-hover:text-white transition-colors">
                    {univ.name}
                  </h3>
                  <p className="text-[10px] text-white/40 font-mono tracking-normal">{univ.description}</p>
                </div>
              </div>

              {/* Leaderboards */}
              <div className="space-y-5">
                {/* Best Assets (Top 2) */}
                <div>
                  <h4 className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Top 2 Outperformer (Best)
                  </h4>
                  <div className="space-y-1.5">
                    {univ.best.map((asset) => (
                      <div 
                        key={asset.symbol} 
                        onClick={() => onSelectAsset?.(asset.symbol)}
                        className={`border rounded-lg p-2 flex items-center justify-between text-xs transition-all duration-200 ${
                          onSelectAsset 
                            ? 'bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer active:scale-[0.98]' 
                            : 'bg-emerald-500/5 border-emerald-500/10'
                        }`}
                        title={onSelectAsset ? `Analysiere ${asset.symbol} im Livechart` : undefined}
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <AssetLogo symbol={asset.symbol} size="xs" className="shrink-0" />
                          <div className="overflow-hidden">
                            <div className="font-mono font-bold text-white leading-none">{asset.symbol}</div>
                            <div className="text-[9px] text-white/40 truncate mt-0.5">{asset.name}</div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2 shrink-0">
                          <div>
                            <div className="font-mono font-bold text-white text-[11px]">{formatPrice(asset.price, asset.type)}</div>
                            <div className={`text-[9px] font-mono font-bold ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                            </div>
                          </div>
                          <div className="px-1.5 py-0.5 rounded bg-emerald-400 text-black font-mono font-black text-[10px] min-w-[28px] text-center shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                            {asset.score.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Worst Assets (Top 2 Worst) */}
                <div>
                  <h4 className="text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Top 2 Underperformer (Worst)
                  </h4>
                  <div className="space-y-1.5">
                    {univ.worst.map((asset) => (
                      <div 
                        key={asset.symbol} 
                        onClick={() => onSelectAsset?.(asset.symbol)}
                        className={`border rounded-lg p-2 flex items-center justify-between text-xs transition-all duration-200 ${
                          onSelectAsset 
                            ? 'bg-rose-500/5 hover:bg-rose-500/15 border-rose-500/20 hover:border-rose-500/40 cursor-pointer active:scale-[0.98]' 
                            : 'bg-rose-500/5 border-rose-500/10'
                        }`}
                        title={onSelectAsset ? `Analysiere ${asset.symbol} im Livechart` : undefined}
                      >
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <AssetLogo symbol={asset.symbol} size="xs" className="shrink-0" />
                          <div className="overflow-hidden">
                            <div className="font-mono font-bold text-white leading-none">{asset.symbol}</div>
                            <div className="text-[9px] text-white/40 truncate mt-0.5">{asset.name}</div>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2 shrink-0">
                          <div>
                            <div className="font-mono font-bold text-white text-[11px]">{formatPrice(asset.price, asset.type)}</div>
                            <div className={`text-[9px] font-mono font-bold ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                            </div>
                          </div>
                          <div className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-mono font-black text-[10px] min-w-[28px] text-center border border-rose-500/30">
                            {asset.score.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
