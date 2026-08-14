import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Sparkles, 
  Scale, 
  Info, 
  CheckCircle2, 
  DollarSign, 
  Activity, 
  AlertCircle, 
  Building2, 
  UserCheck, 
  Star,
  Award,
  BookOpen,
  Search,
  ChevronDown
} from 'lucide-react';

export function formatBuffettMetric(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Nicht verfügbar';
  const numericValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString('de-DE') : 'Nicht verfügbar';
}

interface RegistryAsset {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity';
  price: number;
  change24h: number;
  expectedReturn: number;
  volatility: number;
  drift: number;
  risk: 'High' | 'Medium' | 'Low';
  status: string;
  marketCap?: number;
  volume24h: number;
  score: number;
  pattern?: string;
  applicationArea?: string;
  peRatio?: number;
  debtToEquity?: number;
  dividendYield?: number;
}

interface BuffetValueCheckProps {
  selectedSymbol: string;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
}

export function BuffetValueCheck({ selectedSymbol, triggerAttempt }: BuffetValueCheckProps) {
  useEffect(() => {
    if (triggerAttempt) {
      triggerAttempt('Enterprise-Buffett-Valuation-Engine', () => {});
    }
  }, []);

  const [registryAssets, setRegistryAssets] = useState<RegistryAsset[]>([]);
  const [activeAsset, setActiveAsset] = useState<RegistryAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter assets by search query
  const filteredAssets = searchQuery.trim() === ''
    ? registryAssets
    : registryAssets.filter(asset => 
        asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // DCF Model State
  const [eps, setEps] = useState<number>(8.5);
  const [growth, setGrowth] = useState<number>(8.5);
  const [discountRate, setDiscountRate] = useState<number>(9.0); // WACC in %
  const [terminalMultiple, setTerminalMultiple] = useState<number>(18); // Terminal P/E Multiple
  const [projectionYears, setProjectionYears] = useState<number>(5);

  // Graham Model State
  const [bondYieldFactor, setBondYieldFactor] = useState<number>(4.4); // Graham reference multiplier
  const [aaaBondYield, setAaaBondYield] = useState<number>(4.8); // Current AAA yield (Y)
  const [customPrice, setCustomPrice] = useState<number>(150);

  // Tab State
  const [activeTab, setActiveTab] = useState<'graham' | 'dcf' | 'moat' | 'pillars'>('dcf');

  // Load Registry Assets on mount
  useEffect(() => {
    setLoading(true);
    fetch('/api/registry/assets')
      .then(res => {
        if (!res.ok) throw new Error('Could not fetch registry assets');
        return res.json();
      })
      .then((data: RegistryAsset[]) => {
        setRegistryAssets(data);
        const found = data.find(a => a.symbol.toUpperCase() === selectedSymbol.toUpperCase());
        if (found) {
          setActiveAsset(found);
          // Auto-adjust valuation inputs based on loaded asset
          setCustomPrice(found.price);
          const initialEps = found.peRatio && found.peRatio > 0 
            ? Number((found.price / found.peRatio).toFixed(2)) 
            : Number((found.price * 0.07).toFixed(2));
          setEps(initialEps <= 0 ? 3.5 : initialEps);
          setGrowth(found.type === 'crypto' ? 20.0 : found.type === 'stock' ? 9.5 : 4.0);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error in BuffetValueCheck loading registry assets:', err);
        setLoading(false);
      });
  }, [selectedSymbol]);

  // Synchronize when the user switches selectedSymbol
  useEffect(() => {
    if (registryAssets.length > 0) {
      const found = registryAssets.find(a => a.symbol.toUpperCase() === selectedSymbol.toUpperCase());
      if (found) {
        setActiveAsset(found);
        setCustomPrice(found.price);
        const calculatedEps = found.peRatio && found.peRatio > 0 
          ? Number((found.price / found.peRatio).toFixed(2)) 
          : Number((found.price * 0.07).toFixed(2));
        setEps(calculatedEps <= 0 ? 3.5 : calculatedEps);
        setGrowth(found.type === 'crypto' ? 20.0 : found.type === 'stock' ? 9.5 : 4.0);
      }
    }
  }, [selectedSymbol, registryAssets]);

  // Calculation: Benjamin Graham revised formula V = (EPS * (8.5 + 2g) * 4.4) / Y
  const getGrahamValue = () => {
    if (eps <= 0) return 0;
    const val = (eps * (8.5 + 2 * growth) * bondYieldFactor) / aaaBondYield;
    return Number(val.toFixed(2));
  };

  // Calculation: Discounted Cash Flow (DCF) with projection table
  const getDcfValue = () => {
    if (eps <= 0 || discountRate <= 0) return 0;
    
    let currentEps = eps;
    let totalPresentValue = 0;
    const dcfSteps = [];

    // Discount cash flows over the projection period
    for (let year = 1; year <= projectionYears; year++) {
      currentEps = currentEps * (1 + growth / 100);
      const discountFactor = Math.pow(1 + discountRate / 100, year);
      const presentValue = currentEps / discountFactor;
      totalPresentValue += presentValue;
      
      dcfSteps.push({
        year,
        projectedEps: currentEps,
        presentValue
      });
    }

    // Add Terminal Value at the end of projection period
    const terminalPrice = currentEps * terminalMultiple;
    const terminalPresentValue = terminalPrice / Math.pow(1 + discountRate / 100, projectionYears);
    const finalValue = totalPresentValue + terminalPresentValue;

    return {
      value: Number(finalValue.toFixed(2)),
      steps: dcfSteps,
      terminalPrice,
      terminalPresentValue
    };
  };

  const grahamValue = getGrahamValue();
  const dcfVal = getDcfValue();
  const dcfValue = typeof dcfVal === 'number' ? dcfVal : dcfVal.value;

  // Consensus Intrinsic Value (average of Graham & DCF for stable stocks, weighted for other asset classes)
  const getConsensusValue = () => {
    if (activeAsset?.type === 'crypto') {
      // Cryptos have zero terminal multiples and rely purely on premium projection flows
      return Number((dcfValue * 0.8 + grahamValue * 0.2).toFixed(2));
    }
    return Number(((grahamValue + dcfValue) / 2).toFixed(2));
  };

  const consensusValue = getConsensusValue();
  const marginOfSafety = consensusValue > 0
    ? Number((((consensusValue - customPrice) / consensusValue) * 100).toFixed(1))
    : 0;

  // Pillar checks (Warren Buffett's actual financial checklist)
  const getPillarStatus = () => {
    const isStock = activeAsset?.type === 'stock';
    const hasMoat = activeAsset && ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META', 'GLD'].includes(activeAsset.symbol);
    
    return [
      {
        id: 1,
        title: 'Ökonomischer Graben (Economic Moat)',
        desc: 'Besitzt das Unternehmen einen dauerhaften Wettbewerbsvorteil (Brand, Netzwerkeffekt, Kostenvorteil)?',
        status: hasMoat ? 'Wide' : (isStock ? 'Narrow' : 'N/A'),
        fulfilled: hasMoat || false,
        badge: hasMoat ? 'Breiter Graben (Wide Moat)' : (isStock ? 'Enger Graben' : 'Geringer Moat')
      },
      {
        id: 2,
        title: 'Verschuldung & Risikoprofil',
        desc: 'Ist das Debt-to-Equity-Verhältnis unter 0.8 oder hat das Asset ein sehr solides Liquiditätsprofil?',
        status: activeAsset?.debtToEquity !== undefined ? `${activeAsset.debtToEquity}x` : 'N/A',
        fulfilled: activeAsset?.debtToEquity ? activeAsset.debtToEquity < 1.0 : true,
        badge: activeAsset?.debtToEquity && activeAsset.debtToEquity < 1.0 ? 'Exzellent (<1.0x)' : 'Moderat'
      },
      {
        id: 3,
        title: 'Rentabilität & Bewertung (P/E Ratio)',
        desc: 'Ist das P/E Ratio unter 30 oder bietet das Asset eine unschlagbare Preissetzungsmacht?',
        status: activeAsset?.peRatio ? `${activeAsset.peRatio}x` : 'N/A',
        fulfilled: activeAsset?.peRatio ? activeAsset.peRatio < 35 : true,
        badge: activeAsset?.peRatio && activeAsset.peRatio < 30 ? 'Unterbewertet' : 'Wachstumspreis'
      },
      {
        id: 4,
        title: 'Qualitatives Management / Stabilität',
        desc: 'Zeigt das Asset eine verifizierte Historie und wird von etablierten Akteuren geführt?',
        status: activeAsset?.status === 'Verifiziert' ? 'Verifiziert' : 'Standard',
        fulfilled: activeAsset?.status === 'Verifiziert',
        badge: 'Geprüfter Score: ' + (activeAsset?.score || '7.5') + '/10'
      }
    ];
  };

  const pillars = getPillarStatus();
  const fulfilledCount = pillars.filter(p => p.fulfilled).length;

  const getVerdict = () => {
    if (marginOfSafety >= 30) {
      return {
        label: 'STARKER KAUF • HOHE SICHERHEITSMARGE',
        desc: `Das Asset bietet einen spektakulären Puffer von ${marginOfSafety}% MoS zum errechneten inneren Wert. Exzellente Value-Gelegenheit im Sinne des Warren-Buffett-Ansatzes.`,
        color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.1)]',
        badge: 'bg-emerald-500 text-black',
        signal: 'STARKER KAUF'
      };
    } else if (marginOfSafety >= 10) {
      return {
        label: 'MODERATER KAUF • SOLIDE DISZIPLIN',
        desc: `Die Sicherheitsmarge liegt bei ${marginOfSafety}%. Das Asset ist unterbewertet und erfüllt wesentliche qualitative Kernkriterien. Solider Einstiegspunkt.`,
        color: 'text-green-300 border-green-500/20 bg-green-500/5',
        badge: 'bg-green-500 text-black',
        signal: 'KAUFEN'
      };
    } else if (marginOfSafety >= -10) {
      return {
        label: 'FAIR BEWERTET • HALTEN',
        desc: `Der aktuelle Marktpreis ($${customPrice}) reflektiert exakt den inneren Substanzwert. Keine nennenswerte Margin of Safety, aber ein hervorragendes Core-Investment.`,
        color: 'text-amber-300 border-amber-500/20 bg-amber-500/5',
        badge: 'bg-amber-400 text-black',
        signal: 'HALTEN'
      };
    } else {
      return {
        label: 'ÜBERBEWERTET • INVESTITION VERMEIDEN',
        desc: `Der Marktpreis liegt deutlich über dem inneren Fundamentalwert. Die Sicherheitsmarge ist negativ (${marginOfSafety}%). Buffett rät hier strikt zur Geduld und zum Abwarten auf Korrekturen.`,
        color: 'text-rose-400 border-rose-500/25 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.1)]',
        badge: 'bg-rose-500 text-white',
        signal: 'ÜBERBEWERTET'
      };
    }
  };

  const verdict = getVerdict();

  if (loading && !activeAsset) {
    return (
      <div className="bg-zinc-800/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-2 border-aif-gold-DEFAULT border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-[12px] font-mono text-white/50 uppercase tracking-widest">Lade Buffett-Finanzdaten...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800/60 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/40 to-transparent" />
      
      {/* Enterprise Tool Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/10 mb-6">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-aif-gold-DEFAULT tracking-widest font-black uppercase">
            <Award size={12} className="text-aif-gold-DEFAULT" />
            <span>Enterprise Financial Intelligence Suite</span>
          </div>
          <h2 className="text-2xl font-black text-white font-display mt-1.5 flex items-center gap-2">
            Buffett Value Check & DCF Analysator
          </h2>
          <p className="text-sm text-white/60 mt-1 max-w-3xl">
            Professionelle Fundamentalanalyse basierend auf den Original-Regeln von Warren Buffett und Benjamin Graham. 
            Nutzt DCF-Projektionen und die revidierte Graham-Gleichung zur Ermittlung des fairen inneren Werts.
          </p>
        </div>
        
        {/* Dynamic Asset Info Badge with searchable dropdown */}
        <div className="relative" id="buffett-asset-selector">
          {isDropdownOpen && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => {
                setIsDropdownOpen(false);
                setSearchQuery('');
              }}
            />
          )}

          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all select-none relative z-40"
          >
            {activeAsset ? (
              <>
                <div className="w-10 h-10 rounded-lg bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 flex items-center justify-center font-mono font-black text-aif-gold-DEFAULT text-lg shrink-0">
                  {activeAsset.symbol}
                </div>
                <div className="text-left pr-2">
                  <div className="text-sm font-bold text-white font-display flex items-center gap-1">
                    <span>{activeAsset.name}</span>
                    <ChevronDown size={14} className="text-white/40" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-white/40 uppercase">{activeAsset.type}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="text-[11px] font-mono text-emerald-400 font-bold">${formatBuffettMetric(activeAsset.price)}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-white/60">Asset auswählen...</div>
            )}
          </div>

          {/* Floating Dropdown Panel with Search Bar */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-3 z-50">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 text-white/40" size={14} />
                <input
                  type="text"
                  placeholder="Symbol oder Name suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                  autoFocus
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-white/40 hover:text-white text-xs font-bold"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map(asset => (
                    <button
                      key={asset.symbol}
                      onClick={() => {
                        setActiveAsset(asset);
                        setCustomPrice(asset.price);
                        const initialEps = asset.peRatio && asset.peRatio > 0 
                          ? Number((asset.price / asset.peRatio).toFixed(2)) 
                          : Number((asset.price * 0.07).toFixed(2));
                        setEps(initialEps <= 0 ? 3.5 : initialEps);
                        setGrowth(asset.type === 'crypto' ? 20.0 : asset.type === 'stock' ? 9.5 : 4.0);
                        setIsDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                        activeAsset?.symbol === asset.symbol 
                          ? 'bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20' 
                          : 'hover:bg-white/5 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono font-bold text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white min-w-[50px] text-center shrink-0">
                          {asset.symbol}
                        </span>
                        <span className="text-xs font-semibold truncate max-w-[130px]">{asset.name}</span>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 font-bold shrink-0 ml-2">
                        ${formatBuffettMetric(asset.price)}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs font-mono text-white/40">
                    Keine Assets gefunden
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quote Banner */}
      <div className="bg-aif-gold-DEFAULT/[0.03] border border-aif-gold-DEFAULT/15 rounded-xl p-3.5 mb-6 flex items-start gap-3">
        <BookOpen className="text-aif-gold-DEFAULT/70 shrink-0 mt-0.5" size={16} />
        <div>
          <p className="text-sm text-white/80 italic font-serif">
            "Der Preis ist das, was du bezahlst. Der Wert ist das, was du bekommst. Kaufe hervorragende Unternehmen deutlich unter ihrem fairen Wert."
          </p>
          <span className="text-[10px] font-mono uppercase text-white/40 tracking-wider block mt-1">— Warren Buffett (Value-Investing-Legende)</span>
        </div>
      </div>

      {/* Main Analysis Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Valuation Input & Config (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-2">
              <span className="text-sm font-bold text-white uppercase tracking-wider font-display">Bewertungs-Parameter</span>
              <Activity size={14} className="text-aif-gold-DEFAULT animate-pulse" />
            </div>

            {/* Parameter Input 1: EPS */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] uppercase font-bold tracking-widest text-white/55 font-mono">
                <span>Gewinn pro Aktie (EPS) / Ertragskraft</span>
                <span className="text-white font-black">${eps}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max={activeAsset?.type === 'crypto' ? '5000' : '50'}
                step="0.1"
                value={eps}
                onChange={(e) => setEps(Number(e.target.value))}
                className="w-full accent-aif-gold-DEFAULT cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>Min: $0.1</span>
                <span>Max: ${activeAsset?.type === 'crypto' ? '5000' : '50'}</span>
              </div>
            </div>

            {/* Parameter Input 2: Growth */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] uppercase font-bold tracking-widest text-white/55 font-mono">
                <span>Erwartetes Wachstum (g) (% p.a.)</span>
                <span className="text-aif-gold-DEFAULT font-black">{growth}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="45"
                step="0.5"
                value={growth}
                onChange={(e) => setGrowth(Number(e.target.value))}
                className="w-full accent-aif-gold-DEFAULT cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>0.5% (Konservativ)</span>
                <span>45% (Aggressiv)</span>
              </div>
            </div>

            {/* Dynamic model configurations depending on selected model view */}
            <div className="border-t border-white/5 pt-3 mt-3">
              <div className="flex gap-2 mb-3 bg-white/5 p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('dcf')}
                  className={`flex-1 py-1.5 rounded-md text-[12px] font-bold uppercase font-mono tracking-wider transition-all cursor-pointer ${
                    activeTab === 'dcf' ? 'bg-aif-gold-DEFAULT text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  DCF Modell
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('graham')}
                  className={`flex-1 py-1.5 rounded-md text-[12px] font-bold uppercase font-mono tracking-wider transition-all cursor-pointer ${
                    activeTab === 'graham' ? 'bg-aif-gold-DEFAULT text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Graham Formel
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('moat')}
                  className={`flex-1 py-1.5 rounded-md text-[12px] font-bold uppercase font-mono tracking-wider transition-all cursor-pointer ${
                    activeTab === 'moat' ? 'bg-aif-gold-DEFAULT text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Graben (Moat)
                </button>
              </div>

              {activeTab === 'dcf' && (
                <div className="space-y-3.5 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 font-mono">Abzinsung (WACC) (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={discountRate}
                        onChange={(e) => setDiscountRate(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-zinc-900/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 font-mono">Terminaler KGV (PE)</label>
                      <input
                        type="number"
                        step="1"
                        value={terminalMultiple}
                        onChange={(e) => setTerminalMultiple(Math.max(5, Number(e.target.value)))}
                        className="w-full bg-zinc-900/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 font-mono">Projektionszeitraum (Jahre)</label>
                    <div className="flex gap-2">
                      {[3, 5, 7, 10].map(yr => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setProjectionYears(yr)}
                          className={`flex-1 py-1 rounded border text-[11px] font-mono ${
                            projectionYears === yr 
                              ? 'border-aif-gold-DEFAULT bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT' 
                              : 'border-white/10 hover:border-white/20 text-white/60'
                          }`}
                        >
                          {yr}J
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'graham' && (
                <div className="space-y-3.5 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 font-mono">Zins-Multiplikator</label>
                      <input
                        type="number"
                        step="0.1"
                        value={bondYieldFactor}
                        onChange={(e) => setBondYieldFactor(Math.max(0.1, Number(e.target.value)))}
                        className="w-full bg-zinc-900/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 font-mono">AAA-Anleiherendite (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={aaaBondYield}
                        onChange={(e) => setAaaBondYield(Math.max(0.1, Number(e.target.value)))}
                        className="w-full bg-zinc-900/80 border border-white/20 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                      />
                    </div>
                  </div>
                  <div className="bg-white/5 p-2 rounded border border-white/5 text-[10px] font-mono text-white/40 leading-relaxed">
                    Die revidierte Formel korrigiert das Wachstum um das aktuelle Zinsniveau an den erstklassigen AAA-Anleihemärkten (Sicherer Zins).
                  </div>
                </div>
              )}

              {activeTab === 'moat' && (
                <div className="space-y-2 pt-1 font-mono text-[11px] text-white/70">
                  <div className="flex items-center gap-1.5 text-aif-gold-DEFAULT font-bold mb-1">
                    <Star size={12} />
                    <span>Wettbewerbsvorteile von {activeAsset?.symbol}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded p-2.5 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-white/40">Preismacht:</span>
                      <span className="text-white font-bold">{['AAPL', 'MSFT', 'GLD'].includes(activeAsset?.symbol || '') ? 'Hervorragend' : 'Moderat'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Netzwerkeffekte:</span>
                      <span className="text-white font-bold">{['AAPL', 'MSFT', 'GOOGL', 'META', 'BTC'].includes(activeAsset?.symbol || '') ? 'Dominant' : 'Schwach'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Wechselkosten:</span>
                      <span className="text-white font-bold">{['AAPL', 'MSFT', 'NVDA'].includes(activeAsset?.symbol || '') ? 'Sehr hoch' : 'Gering'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Price Override Input */}
            <div className="space-y-1.5 border-t border-white/5 pt-3">
              <label className="text-[11px] uppercase font-bold tracking-widest text-white/55 font-mono">Aktueller Vergleichspreis ($)</label>
              <input
                type="number"
                step="0.01"
                value={customPrice}
                onChange={(e) => setCustomPrice(Math.max(0.01, Number(e.target.value)))}
                className="w-full bg-zinc-900/80 border border-white/20 rounded-lg px-3 py-2 text-base font-bold text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Enterprise Reports Dashboard (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Section 1: Valuation Comparison Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box 1: Benjamin Graham Value */}
            <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black">Modell A</span>
                <div className="text-sm text-white/70 font-semibold mt-1">Benjamin Graham</div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-mono font-black text-white">${grahamValue.toLocaleString()}</div>
                <div className="text-[10px] font-mono text-white/30 mt-1">Formel-Substanzwert</div>
              </div>
            </div>

            {/* Box 2: DCF Model Value */}
            <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black">Modell B</span>
                <div className="text-sm text-white/70 font-semibold mt-1">Multi-Stage DCF</div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-mono font-black text-white">${dcfValue.toLocaleString()}</div>
                <div className="text-[10px] font-mono text-white/30 mt-1">Disk. Cash-Flow Wert</div>
              </div>
            </div>

            {/* Box 3: Weighted Consensus Intrinsic Value */}
            <div className="bg-gradient-to-br from-aif-gold-DEFAULT/15 to-transparent border border-aif-gold-DEFAULT/25 rounded-xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(245,196,83,0.05)]">
              <div>
                <span className="text-[10px] font-mono text-aif-gold-DEFAULT uppercase tracking-widest font-black">Consensus</span>
                <div className="text-sm text-white font-bold mt-1">Fairer Innerer Wert</div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-mono font-black text-aif-gold-DEFAULT">${consensusValue.toLocaleString()}</div>
                <div className="text-[10px] font-mono text-white/40 mt-1">Synthetischer Zielwert</div>
              </div>
            </div>

          </div>

          {/* Section 2: Margin of Safety (MoS) Gauge */}
          <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-5 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-[11px] text-white/40 uppercase tracking-widest font-mono">Sicherheitsmarge (Margin of Safety)</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-4xl font-mono font-black tracking-tight ${marginOfSafety >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {marginOfSafety >= 0 ? `+${marginOfSafety}%` : `${marginOfSafety}%`}
                  </span>
                  <span className="text-sm text-white/50 font-mono">Puffer zum Marktpreis</span>
                </div>
              </div>
              <div className="text-left md:text-right font-mono text-sm text-white/60">
                <div>Zielwert: <span className="text-white font-bold">${consensusValue}</span></div>
                <div className="mt-0.5">Marktpreis: <span className="text-white">${customPrice}</span></div>
              </div>
            </div>

            {/* Visual Margin Scale slider */}
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full bg-white/15 rounded-full relative overflow-visible">
                {/* Colored safety fill */}
                {marginOfSafety > 0 && (
                  <div 
                    className="absolute h-2 bg-emerald-500/30 rounded-full transition-all duration-500"
                    style={{ 
                      left: `${Math.min(100, Math.max(0, (customPrice / (consensusValue * 1.5 || 1)) * 100))}%`, 
                      right: `${100 - Math.min(100, (1 / 1.5) * 100)}%`
                    }}
                  />
                )}
                {/* Pointer: Current market price */}
                <div 
                  className="absolute h-5 w-1 bg-red-400 -top-1.5 rounded transition-all duration-500 z-10"
                  style={{ left: `${Math.min(100, Math.max(0, (customPrice / (consensusValue * 1.5 || 1)) * 100))}%` }}
                />
                {/* Target marker: Inner Value */}
                <div 
                  className="absolute h-6 w-2 bg-aif-gold-DEFAULT -top-2 rounded shadow-[0_0_15px_rgba(245,196,83,0.8)]"
                  style={{ left: `${Math.min(100, (1 / 1.5) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-white/35">
                <span className="text-red-400">Marktpreis (${customPrice})</span>
                <span className="text-aif-gold-DEFAULT font-bold">Innerer Substanzwert (${consensusValue})</span>
              </div>
            </div>
          </div>

          {/* Section 3: Value-Urteil and Actionable Checklist Tabs */}
          <div className="bg-zinc-800/75 border border-white/10 rounded-xl p-5 space-y-4">
            
            {/* Dynamic visual box for active model details */}
            {activeTab === 'dcf' && typeof dcfVal !== 'number' && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Activity size={12} className="text-cyan-400" />
                  <span>DCF Cash-Flow Projektions-Matrix</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-[12px] border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-white/40">
                        <th className="py-2">Jahr</th>
                        <th className="py-2">Proj. Cash-Flow (EPS)</th>
                        <th className="py-2 text-right">Abgezinst (PV)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dcfVal.steps.map((step) => (
                        <tr key={step.year} className="border-b border-white/5 text-white/80">
                          <td className="py-1.5">Jahr {step.year}</td>
                          <td className="py-1.5 font-bold">${step.projectedEps.toFixed(2)}</td>
                          <td className="py-1.5 text-right font-bold text-cyan-400">${step.presentValue.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="text-white font-bold bg-white/5">
                        <td className="py-2 pl-2 rounded-l">Terminal Value</td>
                        <td className="py-2 font-mono">${dcfVal.terminalPrice.toFixed(2)}</td>
                        <td className="py-2 text-right pr-2 font-mono text-cyan-400 rounded-r">${dcfVal.terminalPresentValue.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'graham' && (
              <div className="space-y-2">
                <div className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Scale size={12} className="text-amber-400" />
                  <span>Graham Formel-Zuweisung</span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-white/5 space-y-2 text-[12px] font-mono text-white/80 leading-relaxed">
                  <div>
                    <span className="text-white/40">Formel:</span> V = (EPS × (8.5 + 2g) × {bondYieldFactor}) / Y
                  </div>
                  <div className="h-[1px] bg-white/10 my-2" />
                  <div className="flex justify-between">
                    <span>Ertrags-Multiplikator:</span>
                    <span className="font-bold text-white">{(8.5 + 2 * growth).toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AAA Bond-Yield Anpassung:</span>
                    <span className="font-bold text-white">{(bondYieldFactor / aaaBondYield).toFixed(3)}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'moat' && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Star size={12} className="text-aif-gold-DEFAULT" />
                  <span>Wettbewerbsvorteile (Pillar Ratings)</span>
                </div>
                <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-2 bg-white/5 border border-white/5 rounded">
                    <span className="text-white/40 block">Netzwerkeffekt:</span>
                    <span className="text-white font-bold mt-1 block">Unerreichte Ökosystem-Koppelung</span>
                  </div>
                  <div className="p-2 bg-white/5 border border-white/5 rounded">
                    <span className="text-white/40 block">Kostenvorteil:</span>
                    <span className="text-white font-bold mt-1 block">Skalenerträge & Vertikale Integration</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quantitative Checkpoints Checklist */}
            <div className="border-t border-white/10 pt-4 space-y-2.5">
              <div className="flex justify-between items-center text-sm font-bold text-white font-display">
                <span className="uppercase">Buffett Fundamental-Checkliste</span>
                <span className="text-aif-gold-DEFAULT font-mono">{fulfilledCount} / 4 Bestanden</span>
              </div>
              <div className="space-y-2">
                {pillars.map((p) => (
                  <div key={p.id} className="flex items-start gap-2.5 bg-zinc-800/40 border border-white/5 rounded-lg p-2.5">
                    {p.fulfilled ? (
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 mt-0.5 flex items-center justify-center text-[8px] font-bold text-white/50">
                        !
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className={`text-sm font-bold ${p.fulfilled ? 'text-white' : 'text-white/60'}`}>{p.title}</span>
                        <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${p.fulfilled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/45 mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed Actionable Recommendation Verdict Statement */}
            <div className={`border rounded-xl p-4 transition-all ${verdict.color}`}>
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-sm font-bold tracking-wider font-display uppercase flex items-center gap-1.5">
                  <Scale size={14} />
                  Fundermental-Analyse-Urteil
                </h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${verdict.badge}`}>
                  {verdict.signal}
                </span>
              </div>
              <div className="text-base font-black tracking-tight font-display text-white">
                {verdict.label}
              </div>
              <p className="text-sm text-white/70 leading-relaxed mt-1.5">
                {verdict.desc}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
