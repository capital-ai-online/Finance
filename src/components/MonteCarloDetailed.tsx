import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Play, Cpu, TrendingUp, TrendingDown, RefreshCw, Info, HelpCircle, CheckCircle } from 'lucide-react';
import { authFetch } from '../lib/authFetch';

interface MonteCarloDetailedProps {
  selectedSymbol: string;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
}

interface SimResult {
  finalMedian: number;
  finalWorst: number;
  finalBest: number;
  var95: number;
  probOfProfit: number;
  paths: number[][]; // [pathIndex][yearIndex]
}

export function MonteCarloDetailed({ selectedSymbol, triggerAttempt }: MonteCarloDetailedProps) {
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [years, setYears] = useState<number>(5);
  const [expectedReturn, setExpectedReturn] = useState<number>(12); // %
  const [volatility, setVolatility] = useState<number>(25); // %
  const [simPathsCount, setSimPathsCount] = useState<number>(2000);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [authorizationError, setAuthorizationError] = useState<string | null>(null);

  React.useEffect(() => {
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        const nonVariants = data.filter((asset: any) => !asset.name.toLowerCase().includes('variant'));
        setAssets(nonVariants);
      })
      .catch(err => console.error('Error in MonteCarloDetailed fetching assets:', err));
  }, []);

  // Update expected return & volatility when selectedSymbol or assets load
  React.useEffect(() => {
    let ret = 11;
    let vol = 22;
    
    if (assets.length > 0) {
      const foundAsset = assets.find(a => a.symbol === selectedSymbol);
      if (foundAsset) {
        if (foundAsset.type === 'crypto') {
          ret = 18;
          vol = 55;
        } else if (foundAsset.type === 'forex') {
          ret = 4;
          vol = 8;
        } else if (foundAsset.type === 'commodity') {
          ret = 6;
          vol = 14;
        } else {
          ret = 11;
          vol = 22;
        }
      }
    } else {
      const s = selectedSymbol.toUpperCase();
      if (s === 'BTC' || s === 'ETH') {
        ret = 18;
        vol = 55;
      } else if (s === 'EURUSD') {
        ret = 4;
        vol = 8;
      } else if (s === 'GLD') {
        ret = 6;
        vol = 14;
      }
    }
    
    setExpectedReturn(ret);
    setVolatility(vol);
  }, [selectedSymbol, assets]);

  const runSimulation = () => {
    const execute = async () => {
      setSimulating(true);
      setResult(null);
      setAuthorizationError(null);

      try {
        const authorizationResponse = await authFetch('/api/entitlements/monte-carlo/authorize', {
          method: 'POST',
        });

        if (!authorizationResponse.ok) {
          const body = await authorizationResponse.json().catch(() => ({}));
          const reason = String(body?.reason || `HTTP_${authorizationResponse.status}`);
          setAuthorizationError(
            reason === 'quota-limit-reached'
              ? 'Das Monte-Carlo-Tageskontingent ist ausgeschöpft.'
              : reason === 'feature-not-entitled'
                ? 'Monte Carlo ist für dieses Abonnement nicht freigeschaltet.'
                : reason === 'authentication-required'
                  ? 'Anmeldung erforderlich, um Monte Carlo auszuführen.'
                  : 'Die serverseitige Entitlement-Prüfung ist derzeit nicht verfügbar.',
          );
          setSimulating(false);
          return;
        }
      } catch (error) {
        console.error('Monte Carlo authorization failed:', error);
        setAuthorizationError('Die serverseitige Entitlement-Prüfung ist derzeit nicht verfügbar.');
        setSimulating(false);
        return;
      }

      setTimeout(() => {
        // Simulate paths only after the authoritative server ALLOW decision.
        const pathsCountToRender = 15; // Number of visual paths to show on chart
        const yearsCount = years;
        const stepSize = 1; // 1 year intervals
        void stepSize;
        
        const simulatedPaths: number[][] = [];
        const finalValues: number[] = [];

        // Run math simulation
        const r = expectedReturn / 100;
        const sigma = volatility / 100;

        // We will precalculate statistics for simPathsCount
        for (let i = 0; i < simPathsCount; i++) {
          let currentVal = initialCapital;
          const path: number[] = [currentVal];

          for (let y = 1; y <= yearsCount; y++) {
            // Geometric Brownian Motion formula
            // Price_t = Price_t-1 * exp((r - 0.5 * sigma^2) * dt + sigma * W_t * sqrt(dt))
            const rand = Math.random() + Math.random() + Math.random() + Math.random() + Math.random() + Math.random() - 3; // Approx normal distribution
            const W_t = rand / Math.sqrt(6/12); // Standard normal variance correction
            const change = Math.exp((r - 0.5 * sigma * sigma) * 1 + sigma * W_t * Math.sqrt(1));
            currentVal = currentVal * change;
            path.push(currentVal);
          }
          finalValues.push(currentVal);
          
          if (i < pathsCountToRender) {
            simulatedPaths.push(path);
          }
        }

        // Sort final values to find percentiles
        finalValues.sort((a, b) => a - b);
        const medianIndex = Math.floor(finalValues.length * 0.5);
        const worstIndex = Math.floor(finalValues.length * 0.05); // 5th percentile (95% confidence worst case)
        const bestIndex = Math.floor(finalValues.length * 0.95); // 95th percentile (best case)

        const finalMedian = finalValues[medianIndex];
        const finalWorst = finalValues[worstIndex];
        const finalBest = finalValues[bestIndex];

        const var95 = initialCapital - finalWorst;
        const probOfProfit = (finalValues.filter(v => v > initialCapital).length / finalValues.length) * 100;

        setResult({
          finalMedian,
          finalWorst,
          finalBest,
          var95,
          probOfProfit,
          paths: simulatedPaths
        });
        setSimulating(false);
      }, 1500);
    };

    if (triggerAttempt) {
      triggerAttempt('Monte Carlo Simulation', execute);
    } else {
      void execute();
    }
  };

  // FIN-SEC-03: there is intentionally no automatic simulation effect. Every execution is
  // user-triggered and must receive a fresh server-authoritative ALLOW decision first.

  // SVG dimensions for chart
  const chartWidth = 600;
  const chartHeight = 280;
  const padding = 40;

  // Find max value in visual paths to scale chart
  const getChartCoordinates = () => {
    if (!result) return [];
    
    let maxVal = initialCapital;
    result.paths.forEach(path => {
      path.forEach(v => {
        if (v > maxVal) maxVal = v;
      });
    });
    // Add 10% breathing room
    maxVal = maxVal * 1.1;

    const minVal = Math.min(0, ...result.paths.map(p => Math.min(...p))) * 0.9;

    return result.paths.map((path) => {
      return path.map((val, yearIdx) => {
        const x = padding + (yearIdx / years) * (chartWidth - padding * 2);
        const y = chartHeight - padding - ((val - minVal) / (maxVal - minVal)) * (chartHeight - padding * 2);
        return { x, y, value: val };
      });
    });
  };

  const coordinates = getChartCoordinates();

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-neon-cyan/40 to-transparent" />

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Left Side: Parameters Form */}
        <div className="w-full xl:w-80 space-y-6">
          <div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-aif-neon-cyan/20 text-aif-neon-cyan border border-aif-neon-cyan/40 tracking-wider font-mono">
              PREDIKTIV-ANALYSIS
            </span>
            <h2 className="text-xl font-bold text-white font-display mt-2">Monte-Carlo-Risk-Engine</h2>
            <p className="text-xs text-white/50 mt-1">
              Führe stochastische Pfadsimulationen für <span className="font-bold text-white font-mono">{selectedSymbol}</span> durch.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Anfangskapital ($)</label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Math.max(1, Number(e.target.value)))}
                className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aif-neon-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Laufzeit (Jahre)</label>
              <div className="flex gap-2">
                {[3, 5, 7, 10].map(yr => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setYears(yr)}
                    className={`flex-1 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                      years === yr ? 'bg-aif-neon-cyan text-black border-aif-neon-cyan' : 'bg-black/40 text-white/60 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {yr} J.
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">
                <span>Rendite-Erwartung (p.a.)</span>
                <span className="text-aif-neon-cyan">{expectedReturn}%</span>
              </div>
              <input
                type="range"
                min="-10"
                max="50"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full accent-aif-neon-cyan cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">
                <span>Volatilität (p.a.)</span>
                <span className="text-red-400">{volatility}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={volatility}
                onChange={(e) => setVolatility(Number(e.target.value))}
                className="w-full accent-red-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/55 font-mono">Anzahl der Pfad-Iterationen</label>
              <select
                value={simPathsCount}
                onChange={(e) => setSimPathsCount(Number(e.target.value))}
                className="w-full bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none cursor-pointer"
              >
                <option value="500">500 (Schnell)</option>
                <option value="2000">2000 (Standard)</option>
                <option value="5000">5000 (Präzise)</option>
              </select>
            </div>

            <button
              onClick={runSimulation}
              disabled={simulating}
              className="w-full py-3 bg-aif-neon-cyan hover:bg-aif-neon-cyan/80 text-black font-black text-xs uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(13,221,221,0.3)] transition-all disabled:opacity-50"
            >
              {simulating ? <RefreshCw className="animate-spin" size={14} /> : <Play fill="currentColor" size={12} />}
              {simulating ? 'Berechne Pfade...' : 'Simulation starten'}
            </button>

            {authorizationError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] text-red-300 font-mono leading-relaxed">
                {authorizationError}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Charts and Output Metrics */}
        <div className="flex-1 space-y-6">
          <AnimatePresence mode="wait">
            {simulating ? (
              <div className="h-[320px] bg-white/5 border border-white/5 rounded-xl flex flex-col items-center justify-center space-y-4">
                <Cpu className="w-12 h-12 text-aif-neon-cyan animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-bold text-white uppercase tracking-wider font-mono">Verarbeite stochastische Matrix...</p>
                  <p className="text-xs text-white/40 mt-1 font-mono">Simuliere {simPathsCount} alternative Zeithorizonte</p>
                </div>
              </div>
            ) : result ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Simulated Path Visual Chart (SVG based) */}
                <div className="bg-black/60 rounded-xl border border-white/10 p-4 relative">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">15 repräsentative Zufallspfade (Fächer-Diagramm)</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                      Laufzeit: {years} Jahre
                    </span>
                  </div>

                  <div className="relative" style={{ height: `${chartHeight}px` }}>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                      {/* Grid Lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                        const y = padding + p * (chartHeight - padding * 2);
                        return (
                          <line
                            key={i}
                            x1={padding}
                            y1={y}
                            x2={chartWidth - padding}
                            y2={y}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                          />
                        );
                      })}
                      
                      {/* Year X labels */}
                      {Array.from({ length: years + 1 }).map((_, yearIdx) => {
                        const x = padding + (yearIdx / years) * (chartWidth - padding * 2);
                        return (
                          <g key={yearIdx}>
                            <line
                              x1={x}
                              y1={padding}
                              x2={x}
                              y2={chartHeight - padding}
                              stroke="rgba(255,255,255,0.05)"
                              strokeWidth="1"
                            />
                            <text
                              x={x}
                              y={chartHeight - 12}
                              textAnchor="middle"
                              fill="rgba(255,255,255,0.4)"
                              fontSize="9"
                              fontFamily="monospace"
                            >
                              Jahr {yearIdx}
                            </text>
                          </g>
                        );
                      })}

                      {/* Visual Paths rendering */}
                      {coordinates.map((pathCoords, pathIdx) => {
                        const pointsStr = pathCoords.map(c => `${c.x},${c.y}`).join(' ');
                        const isHigh = pathIdx === 0;
                        const isLow = pathIdx === coordinates.length - 1;
                        let strokeColor = 'rgba(13,221,221,0.25)'; // standard cyan path
                        if (isHigh) strokeColor = 'rgba(16,185,129,0.7)'; // emerald
                        if (isLow) strokeColor = 'rgba(239,68,68,0.7)'; // red

                        return (
                          <polyline
                            key={pathIdx}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={isHigh || isLow ? '2' : '1'}
                            points={pointsStr}
                          />
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Key output statistics bento grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Erwartung (Median)</span>
                    <div className="text-lg font-mono font-bold text-white mt-1">
                      ${Math.round(result.finalMedian).toLocaleString()}
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono">
                      +{Math.round(((result.finalMedian - initialCapital) / initialCapital) * 100)}% Ertrag
                    </span>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Best-Case (95%)</span>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                      ${Math.round(result.finalBest).toLocaleString()}
                    </div>
                    <span className="text-[9px] text-white/40 font-mono">95. Perzentil</span>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Worst-Case (5%)</span>
                    <div className="text-lg font-mono font-bold text-rose-400 mt-1">
                      ${Math.round(result.finalWorst).toLocaleString()}
                    </div>
                    <span className="text-[9px] text-white/40 font-mono">5. Perzentil</span>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Gewinn-Wahrsch.</span>
                    <div className="text-lg font-mono font-bold text-aif-neon-cyan mt-1">
                      {result.probOfProfit.toFixed(1)}%
                    </div>
                    <span className={`text-[9px] font-mono font-bold uppercase ${result.probOfProfit >= 65 ? 'text-green-400' : 'text-aif-gold-DEFAULT'}`}>
                      {result.probOfProfit >= 65 ? 'Hoch' : 'Moderat'}
                    </span>
                  </div>

                </div>

                {/* Risks evaluation card */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-3 items-start">
                    <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg shrink-0 mt-0.5">
                      <TrendingDown size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Value at Risk (VaR 95%)</h4>
                      <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                        Mit 95%-iger Sicherheit wird dein Verlust über den gesamten Zeithorizont nicht mehr als <span className="font-bold text-white">${Math.round(result.var95).toLocaleString()}</span> betragen.
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Maximaler VaR</div>
                    <div className="text-xl font-mono font-black text-rose-500 mt-0.5">
                      ${Math.round(result.var95).toLocaleString()}
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
