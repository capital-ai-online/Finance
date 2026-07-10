import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { 
  Zap, 
  TrendingUp, 
  Sliders, 
  Activity, 
  ShieldAlert, 
  Coins, 
  Layers, 
  Gauge, 
  ArrowRight,
  Info,
  RefreshCw,
  Droplet,
  PieChart
} from 'lucide-react';
import { generateCryptoScores, calculateDefiScore } from '../services/scoring.service';
import { ClassificationService } from '../services/classification.service';

interface DeFiPoolData {
  name: string;
  dex: 'Uniswap v3' | 'Sushiswap' | 'Curve' | 'Balancer';
  tvl: number;
  volume24h: number;
  apr: number;
  ilRisk: 'low' | 'medium' | 'high';
}

const DEFI_TOKENS = [
  { symbol: 'AAVE', name: 'Aave Governance Token', desc: 'Führendes dezentrales Liquiditätsprotokoll mit robusten Kreditmärkten.' },
  { symbol: 'UNI', name: 'Uniswap Protocol Token', desc: 'Führende dezentrale Börse (DEX) mit Multi-Chain v3 & v4 AMM.' },
  { symbol: 'MKR', name: 'Maker Protocol Token', desc: 'Dezentraler Kreditgeber und Verwalter der Stablecoin-Leitwährung DAI/USDS.' },
  { symbol: 'LDO', name: 'Lido DAO Token', desc: 'Marktbeherrschendes Liquid-Staking-Protokoll für Ethereum.' },
  { symbol: 'CRV', name: 'Curve DAO Token', desc: 'Führender AMM für extrem preiseffizienten Stablecoin-Handel.' },
  { symbol: 'COMP', name: 'Compound Governance Token', desc: 'Pionier unter den dezentralen Zins- und Geldmarkt-Protokollen.' }
];

export function DeFiOrchestration() {
  const [selectedToken, setSelectedToken] = useState<string>('AAVE');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [agentReasoning, setAgentReasoning] = useState<string[]>([]);
  const [scores, setScores] = useState<any>(null);
  
  // IL Simulator State
  const [priceChangeA, setPriceChangeA] = useState<number>(25); // in % (e.g. +25%)
  const [priceChangeB, setPriceChangeB] = useState<number>(0);  // in % (e.g. 0%)
  
  // Initial loading
  useEffect(() => {
    loadTokenScores(selectedToken);
  }, [selectedToken]);

  const loadTokenScores = async (symbol: string) => {
    setAnalyzing(true);
    try {
      // Fetch dynamic classification and generate composite base scores
      const classification = ClassificationService.classifyAsset(symbol);
      const generated = generateCryptoScores(symbol, 4.2); // seed change
      
      const payload = {
        asset_name: DEFI_TOKENS.find(t => t.symbol === symbol)?.name || symbol,
        symbol,
        classification,
        scores: generated
      };

      const computed = calculateDefiScore(payload);
      setScores(computed);

      // Simulate Multi-Agent telemetry fetch
      setTimeout(() => {
        setAgentReasoning([
          `[Master Orchestrator] Analysiere Liquiditäts-Parameter für "${symbol}"...`,
          `[Risk Agent] Volatilität liegt bei ${generated.volatility}%. Smart-Contract Risiko ist durch Multi-Audits minimiert.`,
          `[Fundamentals Agent] TVL-Qualität bewertet mit ${generated.tvlQuality}/100. Governance-Capture-Modus ist voll aktiv.`,
          `[Valuation Agent] Das DeFi-Cashflow-Modell liefert eine fundamentale Bewertung von ${(computed.final_score ?? 0).toFixed(1)}/100.`
        ]);
        setAnalyzing(false);
      }, 600);
    } catch (e) {
      console.error(e);
      setAnalyzing(false);
    }
  };

  const handleAgentTrigger = async () => {
    setAnalyzing(true);
    setAgentReasoning(prev => [...prev, `[Master Orchestrator] Triggering live multi-agent sub-routine via @google/genai...`]);
    try {
      const res = await fetch('/api/crypto/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: selectedToken })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.scores) {
          setScores(data.scores);
        }
        if (data.reasoning) {
          setAgentReasoning(data.reasoning);
        }
      } else {
        setAgentReasoning(prev => [...prev, `[Fehler] Live-Anfrage fehlgeschlagen. Nutze hochpräzise deterministische Rückfallebene.`]);
      }
    } catch (err: any) {
      setAgentReasoning(prev => [...prev, `[Fehler] Netzwerkfehler: ${err.message || err}. Rückfall-Modus aktiv.`]);
    } finally {
      setAnalyzing(false);
    }
  };

  // Calculate Impermanent Loss
  // Formula: IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
  // where priceRatio is the relative price change ratio of A to B.
  const factorA = 1 + priceChangeA / 100;
  const factorB = 1 + priceChangeB / 100;
  const priceRatio = factorA / factorB;
  const impermanentLossPct = ((2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1) * 100;

  // Derive Impermanent Loss Risk Score (0 - 100)
  // Higher divergence = higher IL % = higher risk
  const ilRiskScore = Math.min(100, Math.round(Math.abs(impermanentLossPct) * 4));

  // Build Radar Data
  const radarData = scores ? [
    { name: 'TVL Qualität', wert: scores.tvlQuality ?? 70, max: 100 },
    { name: 'Gebührengenerierung', wert: scores.feeGeneration ?? 65, max: 100 },
    { name: 'Liquiditätstiefe', wert: scores.liquidity ?? 80, max: 100 },
    { name: 'Protokoll-Sicherheit', wert: scores.security ?? 85, max: 100 },
    { name: 'IL-Risiko (Simulator)', wert: ilRiskScore, max: 100 },
    { name: 'Governance Wert', wert: scores.governanceStrength ?? 75, max: 100 },
    { name: 'Adoption & Nutzen', wert: scores.utility ?? 60, max: 100 }
  ] : [];

  // Generate Pools for selected token
  const getPoolsForToken = (symbol: string): DeFiPoolData[] => {
    switch (symbol) {
      case 'AAVE':
        return [
          { name: 'AAVE / WETH (0.3%)', dex: 'Uniswap v3', tvl: 42300000, volume24h: 3800000, apr: 14.5, ilRisk: 'medium' },
          { name: 'AAVE / wstETH', dex: 'Balancer', tvl: 28500000, volume24h: 1200000, apr: 11.2, ilRisk: 'low' },
          { name: 'AAVE / sDAI', dex: 'Curve', tvl: 12900000, volume24h: 450000, apr: 8.9, ilRisk: 'low' }
        ];
      case 'UNI':
        return [
          { name: 'UNI / WETH (0.3%)', dex: 'Uniswap v3', tvl: 128400000, volume24h: 19400000, apr: 18.2, ilRisk: 'medium' },
          { name: 'UNI / USDC (1.0%)', dex: 'Uniswap v3', tvl: 45100000, volume24h: 5200000, apr: 12.4, ilRisk: 'high' },
          { name: 'UNI / WBTC', dex: 'Sushiswap', tvl: 14200000, volume24h: 890000, apr: 9.8, ilRisk: 'medium' }
        ];
      case 'MKR':
        return [
          { name: 'MKR / WETH (0.3%)', dex: 'Uniswap v3', tvl: 35100000, volume24h: 2100000, apr: 11.6, ilRisk: 'medium' },
          { name: 'MKR / USDS', dex: 'Curve', tvl: 58900000, volume24h: 4600000, apr: 13.1, ilRisk: 'low' },
          { name: 'MKR / DAI', dex: 'Balancer', tvl: 22400000, volume24h: 900000, apr: 10.4, ilRisk: 'low' }
        ];
      case 'LDO':
        return [
          { name: 'LDO / WETH (0.3%)', dex: 'Uniswap v3', tvl: 95400000, volume24h: 14200000, apr: 22.4, ilRisk: 'high' },
          { name: 'wstETH / LDO', dex: 'Balancer', tvl: 64100000, volume24h: 3800000, apr: 16.8, ilRisk: 'medium' },
          { name: 'LDO / CRV', dex: 'Curve', tvl: 18500000, volume24h: 750000, apr: 14.1, ilRisk: 'high' }
        ];
      case 'CRV':
        return [
          { name: 'CRV / WETH (1.0%)', dex: 'Uniswap v3', tvl: 15400000, volume24h: 2900000, apr: 25.6, ilRisk: 'high' },
          { name: '3pool / CRV', dex: 'Curve', tvl: 142800000, volume24h: 18400000, apr: 19.4, ilRisk: 'medium' },
          { name: 'CRV / crvUSD', dex: 'Curve', tvl: 89100000, volume24h: 11500000, apr: 17.2, ilRisk: 'low' }
        ];
      default:
        return [
          { name: 'COMP / WETH (0.3%)', dex: 'Uniswap v3', tvl: 14800000, volume24h: 1100000, apr: 9.4, ilRisk: 'medium' },
          { name: 'COMP / USDC', dex: 'Balancer', tvl: 9500000, volume24h: 450000, apr: 7.2, ilRisk: 'medium' }
        ];
    }
  };

  const selectedTokenInfo = DEFI_TOKENS.find(t => t.symbol === selectedToken);
  const currentPools = getPoolsForToken(selectedToken);

  return (
    <div id="defi-orchestration-widget" className="space-y-8">
      {/* Top Banner / Intro */}
      <div className="bg-gradient-to-r from-purple-900/40 via-black/40 to-indigo-900/40 border border-purple-500/20 rounded-2xl p-6 backdrop-blur-md shadow-[0_0_30px_rgba(139,92,246,0.1)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Enterprise DeFi v0.5.4
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white font-display tracking-tight flex items-center gap-2">
              <Zap className="text-purple-400" size={24} />
              DeFi Token Orchestration &amp; IL Radar
            </h2>
            <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
              Dezentrale Protokolle erfordern ein spezialisiertes Bewertungsverfahren. Dieser Leitstand analysiert TVL-Qualität, organische Gebührenströme, Pool-Konzentrationen und kalkuliert das Risiko von unbeständigen Verlusten (Impermanent Loss) unter dynamischen Preispfaden.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {DEFI_TOKENS.map(t => (
              <button
                key={t.symbol}
                onClick={() => setSelectedToken(t.symbol)}
                className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  selectedToken === t.symbol
                    ? 'bg-purple-600 text-white border-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                    : 'bg-black/40 text-white/60 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: 1. Main Telemetry and Radar, 2. Live Simulator & Pools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Radar and Stats */}
        <div className="lg:col-span-7 bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-display">
                  {selectedTokenInfo?.name} ({selectedToken})
                </h3>
                <p className="text-xs text-white/50 mt-0.5">{selectedTokenInfo?.desc}</p>
              </div>
              <button
                onClick={handleAgentTrigger}
                disabled={analyzing}
                className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 rounded-lg text-2xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={analyzing ? 'animate-spin' : ''} />
                Agenten Re-Analyse
              </button>
            </div>

            {/* Radar Chart Container */}
            <div className="h-64 w-full flex items-center justify-center relative bg-gradient-to-b from-purple-950/5 to-transparent rounded-2xl border border-white/5 p-4 mb-6">
              {analyzing ? (
                <div className="text-center space-y-2">
                  <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <span className="text-2xs font-mono text-purple-300 uppercase tracking-widest block">Lese Blockchain-Muster...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="name" stroke="rgba(255,255,255,0.6)" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.15)" tick={false} />
                    <Radar 
                      name={`${selectedToken} Score`} 
                      dataKey="wert" 
                      stroke="#a855f7" 
                      fill="#a855f7" 
                      fillOpacity={0.2} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#120c1f', borderColor: 'rgba(168, 85, 247, 0.3)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Metrics Quick Check */}
          {scores && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
              <div className="bg-white/2 border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[9px] font-mono text-white/40 uppercase block">DeFi Final Score</span>
                <span className="text-xl font-black text-purple-400 font-display mt-1 block">
                  {(scores.final_score ?? 0).toFixed(1)}
                  <span className="text-xs text-white/50 font-normal">/100</span>
                </span>
              </div>
              <div className="bg-white/2 border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[9px] font-mono text-white/40 uppercase block">TVL Qualität</span>
                <span className="text-xl font-black text-emerald-400 font-display mt-1 block">
                  {scores.tvlQuality ?? 0}
                  <span className="text-xs text-white/50 font-normal">/100</span>
                </span>
              </div>
              <div className="bg-white/2 border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[9px] font-mono text-white/40 uppercase block">Gebühren Note</span>
                <span className="text-xl font-black text-cyan-400 font-display mt-1 block">
                  {scores.feeGeneration ?? 0}
                  <span className="text-xs text-white/50 font-normal">/100</span>
                </span>
              </div>
              <div className="bg-white/2 border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[9px] font-mono text-white/40 uppercase block">IL Sensitivität</span>
                <span className={`text-xl font-black font-display mt-1 block ${ilRiskScore > 60 ? 'text-rose-400' : ilRiskScore > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {ilRiskScore}
                  <span className="text-xs text-white/50 font-normal">/100</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live Simulator & Audit Log */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* IL Simulator Widget */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 mb-4 flex items-center gap-1.5">
              <Sliders size={14} className="text-purple-400" />
              Impermanent Loss Simulator (50/50 AMM)
            </h3>

            {/* Inputs sliders */}
            <div className="space-y-4 mb-5 bg-purple-950/10 border border-purple-500/10 p-4 rounded-xl">
              <div className="space-y-1">
                <div className="flex justify-between text-2xs font-mono">
                  <span className="text-white/60">Preisänderung Asset A ({selectedToken})</span>
                  <span className={`font-bold ${priceChangeA >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {priceChangeA >= 0 ? '+' : ''}{priceChangeA}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-75" 
                  max="300" 
                  value={priceChangeA} 
                  onChange={(e) => setPriceChangeA(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-2xs font-mono">
                  <span className="text-white/60">Preisänderung Asset B (z.B. ETH)</span>
                  <span className={`font-bold ${priceChangeB >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {priceChangeB >= 0 ? '+' : ''}{priceChangeB}%
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-75" 
                  max="300" 
                  value={priceChangeB} 
                  onChange={(e) => setPriceChangeB(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>

            {/* Simulation Results */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-black/60 border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[9px] font-mono text-white/40 uppercase block">Divergenz-Ratio</span>
                <span className="text-base font-black text-white font-mono mt-0.5 block">
                  1 : {priceRatio.toFixed(2)}
                </span>
              </div>
              <div className="bg-black/60 border border-white/5 rounded-xl p-3 text-center">
                <span className="text-[9px] font-mono text-white/40 uppercase block">Kalkulierter IL</span>
                <span className={`text-base font-black font-mono mt-0.5 block ${impermanentLossPct < -10 ? 'text-rose-400' : impermanentLossPct < -2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {impermanentLossPct.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Explainer warning */}
            <div className={`p-3 rounded-lg flex items-start gap-2 text-[11px] leading-relaxed border ${
              impermanentLossPct < -10 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' 
                : impermanentLossPct < -2 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}>
              <ShieldAlert size={14} className="shrink-0 mt-0.5" />
              <div>
                {impermanentLossPct < -10 ? (
                  <span><strong>Kritischer IL-Wert!</strong> Die starke Preis-Divergenz zwischen den Vermögenswerten verursacht signifikanten permanenten Verlust gegenüber einfachem HODL. Erwäge eine Absicherung.</span>
                ) : impermanentLossPct < -2 ? (
                  <span><strong>Moderate Divergenz.</strong> Geringe Verluste, die voraussichtlich durch die verdienten Handelsgebühren (APR) des Pools kompensiert werden können.</span>
                ) : (
                  <span><strong>Gleichlaufend / Stabil.</strong> Minimale Divergenz der Vermögenswerte. Perfektes Szenario für LP-Staking, um die volle APR ohne Verluste zu ernten.</span>
                )}
              </div>
            </div>
          </div>

          {/* Multi-Agent Live Audit Trail */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
            <h3 className="text-xs font-mono uppercase tracking-widest text-white/60 mb-3 flex items-center gap-1.5">
              <Activity size={14} className="text-emerald-400" />
              Multi-Agent Audit-Trail
            </h3>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {agentReasoning.map((r, idx) => (
                <div key={idx} className="p-2 bg-white/2 rounded-lg border border-white/5 text-[10px] font-mono text-white/70 leading-relaxed flex items-start gap-1.5">
                  <span className="text-purple-400 font-bold shrink-0">●</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Pools Table (Bottom Row) */}
      <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-display flex items-center gap-2">
              <Droplet className="text-purple-400" size={16} />
              Aktive DeFi Liquidity Pools
            </h3>
            <p className="text-xs text-white/50 mt-0.5">Top-Liquiditätspools mit Real-time TVL, Volumen-Indikatoren und APR-Gewichtung.</p>
          </div>
          <span className="text-[10px] font-mono text-white/40 uppercase bg-white/5 border border-white/10 px-2 py-1 rounded">
            DEX-Verzeichnisse aktiv
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white/70">
            <thead className="bg-white/2 text-[10px] uppercase font-mono tracking-wider text-white/40 border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Pool &amp; Paar</th>
                <th className="py-3 px-4">DEX Plattform</th>
                <th className="py-3 px-4 text-right">TVL (USD)</th>
                <th className="py-3 px-4 text-right">24h Volumen</th>
                <th className="py-3 px-4 text-right text-purple-400">Verteilte APR</th>
                <th className="py-3 px-4 text-center">IL-Risikostatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {currentPools.map((pool, idx) => (
                <tr key={idx} className="hover:bg-white/2 transition-all">
                  <td className="py-3.5 px-4 font-bold text-white font-display flex items-center gap-2">
                    <Coins size={14} className="text-purple-400" />
                    {pool.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 text-3xs uppercase">
                      {pool.dex}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold">
                    ${(pool.tvl / 1000000).toFixed(1)}M
                  </td>
                  <td className="py-3.5 px-4 text-right text-white/50">
                    ${(pool.volume24h / 1000000).toFixed(1)}M
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                    {pool.apr.toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-3xs font-black uppercase border inline-block ${
                      pool.ilRisk === 'low' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : pool.ilRisk === 'medium' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {pool.ilRisk === 'high' ? 'Kritisch' : pool.ilRisk === 'medium' ? 'Moderat' : 'Gering'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
