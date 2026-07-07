import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Cpu, 
  Coins, 
  Building2, 
  Zap, 
  RefreshCw, 
  Sliders, 
  Info, 
  CheckCircle, 
  Search,
  Sparkles
} from 'lucide-react';
import { RealtimeAiNewsfeed } from './RealtimeAiNewsfeed';

interface HeatmapNode {
  id: string;
  symbol: string;
  name: string;
  sector: 'Crypto' | 'Stock' | 'Forex' | 'Commodity';
  bullish: number;
  bearish: number;
  volume24h: string;
  aiVerdict: string;
  pattern: string;
}

const DEFAULT_USER_NODES: HeatmapNode[] = [
  { id: '1', symbol: 'BTC', name: 'Bitcoin', sector: 'Crypto', bullish: 78, bearish: 22, volume24h: '28.4B', aiVerdict: 'Stark Bullish', pattern: 'Bullish Engulfing' },
  { id: '2', symbol: 'ETH', name: 'Ethereum', sector: 'Crypto', bullish: 64, bearish: 36, volume24h: '14.2B', aiVerdict: 'Moderat Bullish', pattern: 'Hammer Support' },
  { id: '3', symbol: 'AAPL', name: 'Apple Inc.', sector: 'Stock', bullish: 72, bearish: 28, volume24h: '9.8B', aiVerdict: 'Stabil Bullish', pattern: 'Cup & Handle' },
  { id: '4', symbol: 'TSLA', name: 'Tesla Motors', sector: 'Stock', bullish: 49, bearish: 51, volume24h: '18.1B', aiVerdict: 'Neutral / Volatil', pattern: 'Double Bottom' },
  { id: '5', symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Stock', bullish: 89, bearish: 11, volume24h: '34.6B', aiVerdict: 'Extrem Bullish', pattern: 'Ascending Triangle' },
  { id: '6', symbol: 'EUR/USD', name: 'Euro / US Dollar', sector: 'Forex', bullish: 41, bearish: 59, volume24h: '85.0B', aiVerdict: 'Bearish Bias', pattern: 'Bearish Harami' }
];

const PRESET_PATTERNS = [
  'Bullish Engulfing',
  'Hammer Support',
  'Cup & Handle',
  'Double Bottom',
  'Ascending Triangle',
  'Inverted Head & Shoulders',
  'Falling Wedge',
  'Morning Star',
  'Bull Flag',
  'Bearish Harami',
  'Double Top',
  'Ascending Channel',
  'Head & Shoulders'
];

interface HeatmapCreatorProps {
  subscriptionTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpgradeClick: () => void;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
}

export function HeatmapCreator({ subscriptionTier, onUpgradeClick, triggerAttempt }: HeatmapCreatorProps) {
  const [nodes, setNodes] = useState<HeatmapNode[]>(() => {
    const saved = localStorage.getItem('aif_custom_heatmap_nodes');
    return saved ? JSON.parse(saved) : DEFAULT_USER_NODES;
  });
  
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  
  // Form states
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [sector, setSector] = useState<'Crypto' | 'Stock' | 'Forex' | 'Commodity'>('Stock');
  const [bullish, setBullish] = useState(60);
  const [volume, setVolume] = useState('1.5B');
  const [verdict, setVerdict] = useState('Moderat Bullish');
  const [pattern, setPattern] = useState('Bull Flag');
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // New states for integrated market assets
  const [apiNodes, setApiNodes] = useState<HeatmapNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
  const [deletedSymbols, setDeletedSymbols] = useState<string[]>(() => {
    const saved = localStorage.getItem('aif_deleted_heatmap_symbols');
    return saved ? JSON.parse(saved) : [];
  });

  // Convert Asset from API to HeatmapNode
  const convertAssetToNode = (asset: any): HeatmapNode => {
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
    else if (bull >= 45) aiVerd = 'Neutral / Seitwärts';
    else if (bull >= 30) aiVerd = 'Bearish Bias';
    else aiVerd = 'Stark Bearish';

    const patternIndex = Math.abs(asset.symbol.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % PRESET_PATTERNS.length;
    const pat = PRESET_PATTERNS[patternIndex];

    let sec: 'Crypto' | 'Stock' | 'Forex' | 'Commodity' = 'Stock';
    if (asset.type === 'crypto') sec = 'Crypto';
    else if (asset.type === 'stock') sec = 'Stock';
    else if (asset.type === 'forex') sec = 'Forex';
    else if (asset.type === 'commodity') sec = 'Commodity';

    return {
      id: asset.symbol,
      symbol: asset.symbol,
      name: asset.name,
      sector: sec,
      bullish: bull,
      bearish: bear,
      volume24h: volString,
      aiVerdict: aiVerd,
      pattern: pat
    };
  };

  // Fetch all assets from server on mount
  useEffect(() => {
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
          console.warn('HeatmapCreator: received invalid non-array market data');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading heatmap assets from API:', err);
        setLoading(false);
      });
  }, []);

  // Persist custom nodes
  useEffect(() => {
    localStorage.setItem('aif_custom_heatmap_nodes', JSON.stringify(nodes));
  }, [nodes]);

  // Persist deleted symbols
  useEffect(() => {
    localStorage.setItem('aif_deleted_heatmap_symbols', JSON.stringify(deletedSymbols));
  }, [deletedSymbols]);

  // Merge custom nodes and API nodes
  const allNodes = React.useMemo(() => {
    const merged = [...nodes];
    apiNodes.forEach(apiNode => {
      const symUpper = apiNode.symbol.toUpperCase();
      if (!deletedSymbols.includes(symUpper) && !merged.some(n => n.symbol.toUpperCase() === symUpper)) {
        merged.push(apiNode);
      }
    });
    return merged;
  }, [nodes, apiNodes, deletedSymbols]);

  // Filter nodes by sector and search query
  const filteredNodes = React.useMemo(() => {
    return allNodes.filter(node => {
      const matchesSector = selectedSectorFilter === 'all' || node.sector.toLowerCase() === selectedSectorFilter.toLowerCase();
      const matchesSearch = node.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            node.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSector && matchesSearch;
    });
  }, [allNodes, selectedSectorFilter, searchTerm]);

  const getSentimentColor = (bullishVal: number) => {
    if (bullishVal >= 75) return 'from-emerald-950/40 via-emerald-900/30 to-black/80 border-emerald-500/40 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)]';
    if (bullishVal >= 55) return 'from-green-950/20 via-green-900/10 to-black/80 border-green-600/30 text-green-300';
    if (bullishVal >= 45) return 'from-aif-gold-dark/10 via-black/40 to-black/80 border-aif-gold-DEFAULT/25 text-aif-gold-DEFAULT';
    return 'from-rose-950/40 via-rose-900/30 to-black/80 border-rose-500/40 text-rose-400 shadow-[inset_0_0_15px_rgba(239,68,68,0.15)]';
  };

  const getHeatmapBg = (bullishVal: number) => {
    if (bullishVal >= 75) return 'bg-emerald-500/20';
    if (bullishVal >= 55) return 'bg-green-500/10';
    if (bullishVal >= 45) return 'bg-aif-gold-DEFAULT/10';
    return 'bg-rose-500/20';
  };

  const getAssetIcon = (sym: string) => {
    const s = sym.toUpperCase();
    if (s.startsWith('BTC')) return <BitcoinIcon />;
    if (s.startsWith('ETH')) return <EthereumIcon />;
    if (s.startsWith('AAPL') || s.startsWith('MSFT') || s.startsWith('TSLA') || s.startsWith('NVDA')) return <StockIcon />;
    return <DefaultAssetIcon sym={s} />;
  };

  const handleAddOrUpdateNode = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!symbol.trim() || !name.trim()) {
      setFormError('Bitte Symbol und Name vollständig ausfüllen.');
      return;
    }

    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanName = name.trim();

    const execute = () => {
      if (isEditing) {
        // Update existing node
        setNodes(prev => prev.map(node => {
          if (node.id === isEditing) {
            return {
              ...node,
              symbol: cleanSymbol,
              name: cleanName,
              sector,
              bullish,
              bearish: 100 - bullish,
              volume24h: volume,
              aiVerdict: verdict,
              pattern
            };
          }
          return node;
        }));
        setFormSuccess('Asset erfolgreich aktualisiert!');
        setIsEditing(null);
      } else {
        // Add new node
        if (nodes.some(n => n.symbol === cleanSymbol)) {
          setFormError(`Symbol ${cleanSymbol} existiert bereits in der Heatmap.`);
          return;
        }
        const newNode: HeatmapNode = {
          id: String(Date.now()),
          symbol: cleanSymbol,
          name: cleanName,
          sector,
          bullish,
          bearish: 100 - bullish,
          volume24h: volume,
          aiVerdict: verdict,
          pattern
        };
        setNodes(prev => [...prev, newNode]);
        setFormSuccess('Asset zur Heatmap hinzugefügt!');
      }

      // Reset inputs
      setSymbol('');
      setName('');
      setBullish(60);
      setVolume('1.5B');
      setVerdict('Moderat Bullish');
      setPattern('Bull Flag');
    };

    if (triggerAttempt) {
      triggerAttempt('Heatmap Creator (Asset anpassen)', execute);
    } else {
      execute();
    }
  };

  const startEditNode = (node: HeatmapNode) => {
    setIsEditing(node.id);
    setSymbol(node.symbol);
    setName(node.name);
    setSector(node.sector);
    setBullish(node.bullish);
    setVolume(node.volume24h);
    setVerdict(node.aiVerdict);
    setPattern(node.pattern);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const deleteNode = (id: string, sym: string) => {
    setDeletedSymbols(prev => [...prev, sym.toUpperCase()]);
    setNodes(prev => prev.filter(node => node.id !== id));
    if (selectedSymbol === sym) {
      setSelectedSymbol('BTC');
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Möchten Sie die Heatmap wirklich auf die Standard-Assets zurücksetzen?')) {
      setNodes(DEFAULT_USER_NODES);
      setDeletedSymbols([]);
      setSelectedSymbol('BTC');
      setFormSuccess('Heatmap erfolgreich zurückgesetzt.');
    }
  };

  // Autoguide Verdict based on Bullishness Slider
  const adjustVerdictFromBullish = (bullishVal: number) => {
    setBullish(bullishVal);
    if (bullishVal >= 85) setVerdict('Extrem Bullish');
    else if (bullishVal >= 70) setVerdict('Stark Bullish');
    else if (bullishVal >= 55) setVerdict('Moderat Bullish');
    else if (bullishVal >= 45) setVerdict('Neutral / Seitwärts');
    else if (bullishVal >= 30) setVerdict('Bearish Bias');
    else setVerdict('Stark Bearish');
  };

  return (
    <div className="space-y-8 max-w-full">
      {/* Title Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/30 to-transparent" />
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 font-display">
            <Flame className="text-aif-gold-DEFAULT animate-pulse" size={24} />
            Eigene Heatmap-Laboratorium
          </h1>
          <p className="text-xs text-white/50 mt-1 max-w-2xl">
            Konfigurieren, erweitern und modifizieren Sie Ihre eigene Markt-Sentiment-Heatmap im Live-Schnittstelleneditor. 
            Definieren Sie eigene Kerzenmuster (Chart Patterns) und filtern Sie den Echtzeit-KI-Newsfeed basierend auf Ihren Kacheln.
          </p>
        </div>

        <button 
          onClick={resetToDefault}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-lg text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={13} />
          Standard laden
        </button>
      </div>

      {/* Editor & Creation Form and Real-time Rendering side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Creation/Edit Form (1 Column) */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col justify-between relative overflow-hidden h-full">
          <div className="space-y-4">
            <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
              <Sliders size={16} className="text-aif-gold-DEFAULT" />
              {isEditing ? 'Asset editieren' : 'Neues Asset erstellen'}
            </h3>

            <form onSubmit={handleAddOrUpdateNode} className="space-y-4 text-xs">
              {/* Row 1: Symbol & Sector */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/60 font-mono font-bold block">SYMBOL</label>
                  <input 
                    type="text" 
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="z.B. SOL, MSFT"
                    maxLength={10}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT focus:border-transparent font-mono uppercase font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/60 font-mono font-bold block">SEKTOR / TYP</label>
                  <select
                    value={sector}
                    onChange={(e: any) => setSector(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT focus:border-transparent font-mono cursor-pointer"
                  >
                    <option value="Stock">Aktie</option>
                    <option value="Crypto">Krypto</option>
                    <option value="Forex">Forex</option>
                    <option value="Commodity">Rohstoff</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Name */}
              <div className="space-y-1.5">
                <label className="text-white/60 font-mono font-bold block">ASSET-NAME</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Solana Foundation, Microsoft Corp."
                  className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT focus:border-transparent"
                />
              </div>

              {/* Row 3: Bullish Slider & Verdict */}
              <div className="space-y-2 pt-1 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                  <span className="text-white/60">BULLISH-SENTIMENT</span>
                  <span className={`${bullish >= 50 ? 'text-green-400' : 'text-red-400'}`}>{bullish}%</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="95" 
                  value={bullish}
                  onChange={(e) => adjustVerdictFromBullish(Number(e.target.value))}
                  className="w-full accent-aif-gold-DEFAULT cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] text-white/30 font-mono">
                  <span>Bärisch</span>
                  <span>Neutral</span>
                  <span>Bullisch</span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/5 mt-2">
                  <label className="text-[10px] text-white/50 font-mono block">AUTOMATISCHES KI-URTEIL</label>
                  <input 
                    type="text" 
                    value={verdict}
                    onChange={(e) => setVerdict(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded px-2.5 py-1 text-[11px] text-aif-gold-DEFAULT font-bold font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Pattern Selector & Volume */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/60 font-mono font-bold block">CHART PATTERN</label>
                  <select
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT focus:border-transparent font-mono cursor-pointer text-[10px]"
                  >
                    {PRESET_PATTERNS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-white/60 font-mono font-bold block">24H VOLUMEN</label>
                  <input 
                    type="text" 
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    placeholder="z.B. 4.5B"
                    className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-aif-gold-DEFAULT focus:border-transparent font-mono font-bold text-center"
                  />
                </div>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-lg font-mono text-[10px] font-bold">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg font-mono text-[10px] font-bold flex items-center gap-1.5">
                  <CheckCircle size={12} />
                  {formSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(null);
                      setSymbol('');
                      setName('');
                    }}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg font-bold font-mono uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Abbrechen
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark hover:brightness-110 text-black font-black font-mono rounded-lg uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,196,83,0.2)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{isEditing ? 'Sichern' : 'Hinzufügen'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-white/35 flex items-start gap-1.5 leading-normal">
            <Info size={14} className="text-aif-gold-DEFAULT shrink-0 mt-0.5" />
            <span>
              Klicken Sie auf ein beliebiges Asset auf der rechten Seite, um den Nachrichtenfeed unten zu filtern, oder drücken Sie auf das Stift-Symbol, um das Asset direkt zu bearbeiten.
            </span>
          </div>
        </div>

        {/* Live Heatmap Display Area (2 Columns) */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col justify-between h-full relative">
          <div className="space-y-4 flex-1 flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold font-display text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={16} className="text-aif-neon-cyan" />
                Interaktives Sentiment Gitter ({filteredNodes.length} Kacheln)
              </h3>
              <span className="text-[10px] font-mono text-white/40">Klicken zum Auswählen & Filtern</span>
            </div>

            {/* Sector Filters and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
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
                  placeholder="Asset nach Symbol oder Name filtern..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg pl-8 pr-4 py-1 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-aif-gold-DEFAULT font-mono"
                />
              </div>
            </div>

            {/* Heatmap Grid of custom & API-integrated Nodes */}
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-3">
                <RefreshCw size={24} className="text-aif-gold-DEFAULT animate-spin" />
                <span className="text-xs font-mono text-white/40">Lade alle Markt-Assets in das Sentiment-Gitter...</span>
              </div>
            ) : filteredNodes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                <span className="text-xs font-mono text-white/40">Keine Assets für die aktuellen Filterkriterien gefunden.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 flex-1 my-4 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                {filteredNodes.map((node) => {
                  const isSelected = selectedSymbol === node.symbol;
                  const styleClasses = getSentimentColor(node.bullish);
                  const badgeBg = getHeatmapBg(node.bullish);

                  return (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedSymbol(node.symbol)}
                      className={`cursor-pointer rounded-xl border p-3 flex flex-col justify-between transition-all relative overflow-hidden bg-gradient-to-br ${styleClasses} ${
                        isSelected ? 'ring-2 ring-white border-transparent' : ''
                      }`}
                    >
                    {/* Active pulsing state */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                    )}

                    {/* Subdued matrix background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none" />

                    {/* Header: symbol & verdict */}
                    <div className="relative z-10 flex justify-between items-start gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {getAssetIcon(node.symbol)}
                        <div>
                          <span className="text-xs font-black font-mono tracking-tight block leading-none">{node.symbol}</span>
                          <span className="text-[8px] text-white/40 truncate block max-w-[70px] mt-0.5">{node.name}</span>
                        </div>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-[8px] font-black font-mono tracking-wider ${badgeBg} border border-white/5 shrink-0`}>
                        {node.aiVerdict}
                      </div>
                    </div>

                    {/* Dynamic Chart Pattern Display below the symbol as requested */}
                    <div className="relative z-10 mt-2 bg-black/30 border border-white/5 rounded px-2 py-1 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-white/40 uppercase tracking-widest text-[8px]">Muster:</span>
                      <span className="text-aif-gold-DEFAULT font-bold uppercase tracking-wider">{node.pattern}</span>
                    </div>

                    {/* Sentiment Ratio visuals */}
                    <div className="relative z-10 my-2 space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono">
                        <span className="font-bold flex items-center gap-0.5">
                          <TrendingUp size={10} className="text-emerald-400" /> {node.bullish}%
                        </span>
                        <span className="font-bold flex items-center gap-0.5">
                          <TrendingDown size={10} className="text-rose-400" /> {node.bearish}%
                        </span>
                      </div>

                      {/* Segmented Sentiment Bar */}
                      <div className="h-1.5 w-full rounded-full bg-black/60 border border-white/5 overflow-hidden flex">
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

                    {/* Bottom Stats & Edit Controls */}
                    <div className="relative z-10 flex justify-between items-center text-[9px] font-mono opacity-60 pt-2 border-t border-white/5">
                      <span>Vol: <strong className="text-white">${node.volume24h}</strong></span>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => startEditNode(node)}
                          className="p-1 text-white/50 hover:text-aif-gold-DEFAULT rounded hover:bg-white/5 transition-colors"
                          title="Eigenschaften anpassen"
                        >
                          <Sliders size={11} />
                        </button>
                        <button
                          onClick={() => deleteNode(node.id, node.symbol)}
                          className="p-1 text-white/50 hover:text-rose-400 rounded hover:bg-white/5 transition-colors"
                          title="Aus Heatmap löschen"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI Newsfeed rendered below the heatmap taking over dashboard newsfeed functionality */}
      <div className="pt-4 border-t border-white/5 space-y-4">
        <div className="bg-black/30 border border-white/5 p-4 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 flex items-center justify-center shrink-0">
            <Cpu size={14} className="text-aif-gold-DEFAULT" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">Synchronisierte AI Newsfeed Pipeline</h4>
            <p className="text-[10px] text-white/40">
              Der nachfolgende Echtzeit-Feed scannt globalen Newsflow auf Erwähnungen von <strong className="text-aif-gold-DEFAULT">"{selectedSymbol}"</strong>. 
              Klicken Sie oben auf eine Kachel, um den Feed sofort umzuschalten.
            </p>
          </div>
        </div>

        <RealtimeAiNewsfeed 
          subscriptionTier={subscriptionTier} 
          onUpgradeClick={onUpgradeClick}
          selectedSymbol={selectedSymbol}
        />
      </div>
    </div>
  );
}

// Inline Helper SVG icons to avoid external assets loading issues
function BitcoinIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 flex items-center justify-center shrink-0">
      <span className="text-[10px] font-extrabold text-aif-gold-DEFAULT font-mono">₿</span>
    </div>
  );
}

function EthereumIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
      <Coins size={11} className="text-purple-400" />
    </div>
  );
}

function StockIcon() {
  return (
    <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
      <Building2 size={11} className="text-blue-400" />
    </div>
  );
}

function DefaultAssetIcon({ sym }: { sym: string }) {
  return (
    <div className="w-6 h-6 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center shrink-0">
      <span className="text-[9px] font-bold text-slate-300 font-mono">{sym.slice(0, 2)}</span>
    </div>
  );
}
