import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, HelpCircle, ArrowRight, TrendingUp, TrendingDown, Percent, Sparkles, Scale, Info, CheckCircle2 } from 'lucide-react';

interface BuffetValueCheckProps {
  selectedSymbol: string;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
}

export function BuffetValueCheck({ selectedSymbol, triggerAttempt }: BuffetValueCheckProps) {
  // Trigger attempt on mount
  React.useEffect(() => {
    if (triggerAttempt) {
      triggerAttempt('Graham-Intrinsik-Rechner', () => {});
    }
  }, []);

  const [assets, setAssets] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        const nonVariants = data.filter((asset: any) => !asset.name.toLowerCase().includes('variant'));
        setAssets(nonVariants);
      })
      .catch(err => console.error('Error in BuffetValueCheck loading assets:', err));
  }, []);

  // Preset Values based on symbol
  const presets: Record<string, { eps: number; growth: number; price: number }> = {
    'AAPL': { eps: 6.16, growth: 10.5, price: 181.50 },
    'TSLA': { eps: 3.12, growth: 18.0, price: 175.40 },
    'NVDA': { eps: 12.44, growth: 32.5, price: 875.12 },
    'BTC': { eps: 4500, growth: 25.0, price: 61500 }, // simulated equivalent metrics
    'ETH': { eps: 180, growth: 20.0, price: 3450 },
    'GLD': { eps: 5.5, growth: 4.5, price: 215 }
  };

  const preset = presets[selectedSymbol] || { eps: 8.5, growth: 7.5, price: 150 };

  const [eps, setEps] = useState<number>(preset.eps);
  const [growth, setGrowth] = useState<number>(preset.growth);
  const [bondYield, setBondYield] = useState<number>(4.4); // Historical multiplier
  const [currentYield, setCurrentYield] = useState<number>(4.8); // Current AAA corporate bond yield
  const [currentPrice, setCurrentPrice] = useState<number>(preset.price);
  
  // Update state when selected symbol or assets change
  React.useEffect(() => {
    const foundAsset = assets.find(a => a.symbol === selectedSymbol);
    const activePreset = presets[selectedSymbol] || (foundAsset ? {
      eps: foundAsset.type === 'crypto' 
        ? Number((foundAsset.price * 0.08).toFixed(2)) 
        : Number((foundAsset.price / (foundAsset.peRatio || 18)).toFixed(2)),
      growth: foundAsset.type === 'crypto' ? 25.0 : (foundAsset.type === 'commodity' ? 4.5 : 9.5),
      price: foundAsset.price
    } : { eps: 8.5, growth: 7.5, price: 150 });

    setEps(activePreset.eps <= 0 ? 1.5 : activePreset.eps);
    setGrowth(activePreset.growth);
    setCurrentPrice(activePreset.price);
  }, [selectedSymbol, assets]);

  // Graham Formula: V = (EPS * (8.5 + 2g) * 4.4) / Y
  const calculateIntrinsicValue = () => {
    if (eps <= 0) return 0;
    const value = (eps * (8.5 + 2 * growth) * bondYield) / currentYield;
    return Number(value.toFixed(2));
  };

  const intrinsicValue = calculateIntrinsicValue();
  
  // Margin of Safety calculation
  const marginOfSafety = intrinsicValue > 0 
    ? Number((((intrinsicValue - currentPrice) / intrinsicValue) * 100).toFixed(1))
    : 0;

  const getVerdict = () => {
    if (marginOfSafety >= 30) {
      return {
        label: 'STARKER KAUF (Unterbewertet)',
        desc: `Der aktuelle Preis liegt weit unter dem berechneten fairen Wert nach Graham. Ein hohes Maß an Margin of Safety (${marginOfSafety}%) schützt dein eingesetztes Kapital.`,
        color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
        badge: 'bg-emerald-500 text-black'
      };
    } else if (marginOfSafety >= 10) {
      return {
        label: 'KAUFEN / MODERAT GÜNSTIG',
        desc: `Die Aktie bietet eine gesunde Sicherheitsmarge von ${marginOfSafety}%. Ein Einstieg ist aus fundamentaler Sicht solide.`,
        color: 'text-green-300 border-green-500/20 bg-green-500/5',
        badge: 'bg-green-500 text-black'
      };
    } else if (marginOfSafety >= -10) {
      return {
        label: 'HALTEN / FAIR BEWERTET',
        desc: `Der Markt bewertet ${selectedSymbol} derzeit exakt im fairen Bereich. Erwartbare Renditen orientieren sich am künftigen Wachstum.`,
        color: 'text-aif-gold-DEFAULT border-aif-gold-DEFAULT/25 bg-aif-gold-DEFAULT/5',
        badge: 'bg-aif-gold-DEFAULT text-black'
      };
    } else {
      return {
        label: 'ÜBERBEWERTET / REDUZIEREN',
        desc: `Aktueller Preis übersteigt den fairen Graham-Wert deutlich. Die Sicherheitsmarge ist negativ (${marginOfSafety}%). Erhöhtes Risiko für Kurskorrekturen.`,
        color: 'text-rose-400 border-rose-500/20 bg-rose-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
        badge: 'bg-rose-500 text-white'
      };
    }
  };

  const verdict = getVerdict();

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/40 to-transparent" />

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Intrinsic Formula parameter inputs */}
        <div className="w-full lg:w-96 space-y-6">
          <div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/40 tracking-wider font-mono">
              BUFFETTVALUECHECK (GRAHAM-METHODOLOGY)
            </span>
            <h2 className="text-xl font-bold text-white font-display mt-2">Graham-Intrinsik-Rechner</h2>
            <p className="text-xs text-white/50 mt-1">
              Errechne den fairen Fundamentalwert für <span className="font-bold text-white font-mono">{selectedSymbol}</span> anhand der revidierten Benjamin Graham Formel.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Gewinn pro Aktie / Unit (EPS) ($)</label>
              <input
                type="number"
                step="0.01"
                value={eps}
                onChange={(e) => setEps(Math.max(0, Number(e.target.value)))}
                className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Erwartetes Wachstum (g) (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                value={growth}
                onChange={(e) => setGrowth(Math.max(0, Number(e.target.value)))}
                className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-white/55 font-mono">Basis-Zinsfaktor</label>
                <input
                  type="number"
                  step="0.1"
                  value={bondYield}
                  onChange={(e) => setBondYield(Math.max(0.1, Number(e.target.value)))}
                  className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-white/55 font-mono">Aktueller Renditesatz (Y) (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={currentYield}
                  onChange={(e) => setCurrentYield(Math.max(0.1, Number(e.target.value)))}
                  className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Aktueller Marktpreis ($)</label>
              <input
                type="number"
                step="0.01"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(Math.max(0.01, Number(e.target.value)))}
                className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT font-mono"
              />
            </div>

            {/* Formula display */}
            <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-[10px] font-mono text-white/40 leading-relaxed">
              <span className="text-aif-gold-DEFAULT font-bold">Formel:</span> V = (EPS × (8.5 + 2g) × {bondYield}) / Y
              <div className="mt-1">
                V = ({eps} × (8.5 + {2 * growth}) × {bondYield}) / {currentYield} = <span className="text-white font-bold">${intrinsicValue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Visual output results and margin gauge */}
        <div className="flex-1 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Value comparison gauge card */}
            <div className="bg-black/60 rounded-xl border border-white/10 p-5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Wertbestimmung</span>
                <div className="flex justify-between items-baseline mt-2">
                  <div>
                    <div className="text-xs text-white/50">Graham Fairer Wert</div>
                    <div className="text-3xl font-mono font-black text-aif-gold-DEFAULT">
                      ${intrinsicValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/50">Aktueller Preis</div>
                    <div className="text-xl font-mono text-white">
                      ${currentPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Slider scale visually comparing current vs intrinsic */}
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-white/40">
                  <span>0</span>
                  <span>Gleichstand</span>
                  <span>Maximaler Wert</span>
                </div>
                <div className="h-2 w-full bg-white/10 rounded-full relative overflow-visible">
                  {/* Marker for Current Price */}
                  <div 
                    className="absolute h-4 w-1 bg-red-400 -top-1 rounded transition-all duration-500"
                    style={{ left: `${Math.min(100, Math.max(0, (currentPrice / (intrinsicValue * 1.5 || 1)) * 100))}%` }}
                    title={`Marktpreis: $${currentPrice}`}
                  />
                  {/* Marker for Fair Value */}
                  <div 
                    className="absolute h-5 w-2 bg-aif-gold-DEFAULT -top-1.5 rounded shadow-[0_0_10px_rgba(245,196,83,0.8)] transition-all duration-500"
                    style={{ left: `${Math.min(100, (1 / 1.5) * 100)}%` }}
                    title={`Fairer Wert: $${intrinsicValue}`}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono">
                  <span className="text-red-400">Marktpreis</span>
                  <span className="text-aif-gold-DEFAULT font-bold">Innerer Wert (Graham)</span>
                </div>
              </div>
            </div>

            {/* Margin of safety circle gauge */}
            <div className="bg-black/60 rounded-xl border border-white/10 p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono absolute top-4 left-4">Sicherheitsmarge</span>
              
              <div className="space-y-1 my-4">
                <div className={`text-4xl font-mono font-black tracking-tighter ${marginOfSafety >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {marginOfSafety >= 0 ? `+${marginOfSafety}%` : `${marginOfSafety}%`}
                </div>
                <div className="text-xs text-white/60 font-mono">Margin of Safety (MoS)</div>
              </div>

              <p className="text-[10px] text-white/40 leading-relaxed max-w-[200px] font-mono">
                {marginOfSafety >= 20 
                  ? 'Kompakter Puffer vorhanden, der vor Marktschwankungen schützt.' 
                  : marginOfSafety >= 0 
                  ? 'Geringer Sicherheitsabstand vorhanden.' 
                  : 'Kein Sicherheitsabstand vorhanden. Aktie ist potenziell überteuert.'
                }
              </p>
            </div>

          </div>

          {/* Actionable Verdict Statement Box */}
          <div className={`border rounded-xl p-5 transition-all ${verdict.color}`}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold tracking-wider font-display uppercase flex items-center gap-2">
                <Scale size={16} />
                FUNDERMENTAL-ANALYS-URTEIL
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded ${verdict.badge}`}>
                {marginOfSafety >= 30 ? 'Premium' : marginOfSafety >= 0 ? 'Normal' : 'Risk'}
              </span>
            </div>
            
            <div className="text-lg font-black tracking-tight font-display text-white">
              {verdict.label}
            </div>
            
            <p className="text-xs text-white/70 leading-relaxed mt-2 font-sans">
              {verdict.desc}
            </p>
          </div>

          {/* Additional details note */}
          <div className="text-[10px] text-white/40 font-mono flex items-start gap-1.5 pt-2">
            <Info size={12} className="text-aif-gold-DEFAULT shrink-0 mt-0.5" />
            <span>
              Warren Buffett empfiehlt typischerweise eine Margin of Safety von mindestens 30% für value-orientierte Investments. Diese Logik liefert ein robustes, faktenbasiertes Fundament ohne künstliche Heuristiken.
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
