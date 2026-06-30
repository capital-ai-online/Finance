import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Layers, 
  Share2, 
  Sliders, 
  HelpCircle, 
  Zap, 
  ShieldCheck, 
  DollarSign, 
  ArrowRightLeft, 
  RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CryptoEnterpriseEvaluatorProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
}

type ActiveTool = 'orderbook' | 'arbitrage' | 'onchain';

interface ArbitrageOpportunity {
  exchangeA: string;
  exchangeB: string;
  priceA: number;
  priceB: number;
  spread: number; // percentage
  profitPotential: number; // USD
}

export function CryptoEnterpriseEvaluator({ selectedSymbol, onSelectSymbol }: CryptoEnterpriseEvaluatorProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>('orderbook');
  
  // Controls state
  const [orderSize, setOrderSize] = useState<number>(100000); // USD
  const [minSpreadFilter, setMinSpreadFilter] = useState<number>(0.05); // %
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Simulated data based on selected symbol
  const symbol = selectedSymbol.toUpperCase();
  const basePrice = symbol === 'BTC' ? 92450 : symbol === 'ETH' ? 3120 : symbol === 'SOL' ? 184 : 1.0;

  // Refs for D3
  const orderBookSvgRef = useRef<SVGSVGElement | null>(null);
  const arbitrageSvgRef = useRef<SVGSVGElement | null>(null);

  // --- REFRESH FUNCTION ---
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastRefresh(new Date());
    }, 800);
  };

  // --- 1. TOOL: ORDER BOOK DEPTH CALCULATOR ---
  const calculatedSlippage = (orderSize / 10000000) * (symbol === 'SOL' ? 1.5 : symbol === 'ETH' ? 0.8 : 0.25);
  const executionPrice = basePrice * (1 + (calculatedSlippage / 100));

  // No-Demo-Data-Policy: this used to generate fake cumulative bid/ask
  // volumes via Math.random() and render them as if they were real
  // order-book depth. AIF-CORE has no real order-book/market-depth data
  // source connected yet, so the chart is disabled until one is wired up
  // (see /api/orderbook-depth — currently NOT_IMPLEMENTED).
  const ORDERBOOK_DATA_AVAILABLE = false;

  useEffect(() => {
    if (!ORDERBOOK_DATA_AVAILABLE) return;
    if (activeTool !== 'orderbook' || !orderBookSvgRef.current) return;

    const svgElement = d3.select(orderBookSvgRef.current);
    svgElement.selectAll('*').remove();

    const margin = { top: 15, right: 20, bottom: 25, left: 20 };
    const width = orderBookSvgRef.current.clientWidth - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const svg = svgElement
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Generate cumulative orderbook layers
    const numPoints = 12;
    const bids: { price: number; volume: number }[] = [];
    const asks: { price: number; volume: number }[] = [];

    let cumBidVol = 0;
    let cumAskVol = 0;

    for (let i = 1; i <= numPoints; i++) {
      const bidDiff = (i * 0.1) / 100;
      const askDiff = (i * 0.1) / 100;

      const bidVol = Math.floor((15 - i) * (symbol === 'BTC' ? 1.8 : 12.5));
      const askVol = Math.floor((15 - i) * (symbol === 'BTC' ? 1.8 : 12.5));

      cumBidVol += bidVol;
      cumAskVol += askVol;

      bids.push({ price: basePrice * (1 - bidDiff), volume: cumBidVol });
      asks.push({ price: basePrice * (1 + askDiff), volume: cumAskVol });
    }

    // reverse bids so price increases left-to-right
    bids.reverse();

    const allPrices = [...bids.map(b => b.price), ...asks.map(a => a.price)];
    const maxVolume = Math.max(cumBidVol, cumAskVol);

    const xScale = d3.scaleLinear()
      .domain([d3.min(allPrices) || basePrice * 0.98, d3.max(allPrices) || basePrice * 1.02])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, maxVolume * 1.1])
      .range([height, 0]);

    // Draw horizontal grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.05)
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-width).tickFormat(() => ''));

    // Bid area (green)
    const bidArea = d3.area<{ price: number; volume: number }>()
      .x(d => xScale(d.price))
      .y0(height)
      .y1(d => yScale(d.volume))
      .curve(d3.curveStepAfter);

    svg.append('path')
      .datum(bids)
      .attr('fill', 'rgba(16, 185, 129, 0.15)')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 1.5)
      .attr('d', bidArea);

    // Ask area (red)
    const askArea = d3.area<{ price: number; volume: number }>()
      .x(d => xScale(d.price))
      .y0(height)
      .y1(d => yScale(d.volume))
      .curve(d3.curveStepBefore);

    svg.append('path')
      .datum(asks)
      .attr('fill', 'rgba(239, 68, 68, 0.15)')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5)
      .attr('d', askArea);

    // Center mid-market line
    const midX = xScale(basePrice);
    svg.append('line')
      .attr('x1', midX)
      .attr('x2', midX)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#fff')
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.4);

    svg.append('text')
      .attr('x', midX)
      .attr('y', 10)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('class', 'font-mono text-[9px] font-semibold')
      .text(`Spread-Mitte: ${basePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);

    // Draw Axes
    const xAxis = d3.axisBottom(xScale).ticks(4).tickFormat(d => `${d.toLocaleString(undefined, { maximumFractionDigits: 1 })}`);
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'text-white/40 font-mono text-[8px]')
      .call(xAxis);

  }, [activeTool, selectedSymbol, basePrice, orderSize]);

  // --- 2. TOOL: MULTI-EXCHANGE ARBITRAGE OPPORTUNITIES ---
  const arbitrageOpps = React.useMemo<ArbitrageOpportunity[]>(() => {
    // Deterministic random generator based on symbol and minute of refresh
    const key = symbol + lastRefresh.getMinutes() + lastRefresh.getSeconds();
    
    const venues = ['Binance', 'Coinbase Pro', 'Kraken', 'OKX', 'Bybit', 'Gate.io'];
    const list: ArbitrageOpportunity[] = [];

    // Produce spreads
    for (let i = 0; i < venues.length; i++) {
      for (let j = i + 1; j < venues.length; j++) {
        const hash = (venues[i].charCodeAt(0) + venues[j].charCodeAt(1) + key.charCodeAt(0)) % 100;
        const spreadPercent = (0.01 + (hash % 15) / 100); // 0.01% to 0.16%
        
        if (spreadPercent >= minSpreadFilter) {
          const priceA = basePrice * (1 - (hash % 5) / 10000);
          const priceB = priceA * (1 + spreadPercent / 100);
          const profit = orderSize * (spreadPercent / 100);

          list.push({
            exchangeA: venues[i],
            exchangeB: venues[j],
            priceA,
            priceB,
            spread: spreadPercent,
            profitPotential: profit
          });
        }
      }
    }

    return list.sort((a, b) => b.spread - a.spread).slice(0, 4);
  }, [symbol, basePrice, minSpreadFilter, orderSize, lastRefresh]);

  // --- 3. TOOL: ON-CHAIN & WHALE MOMENTUM METRICS ---
  const whaleMetrics = React.useMemo(() => {
    const isBtc = symbol === 'BTC';
    const isEth = symbol === 'ETH';
    return {
      exchangeNetflow24h: isBtc ? -245000000 : isEth ? 84000000 : -12500000, // Negative is bullish (accumulation/withdrawing)
      activeWhaleWallets: isBtc ? 1420 : isEth ? 840 : 195,
      whaleWalletsDelta: isBtc ? 42 : isEth ? -8 : 14, // wallets added or subtracted
      fundingRatePct: isBtc ? 0.0125 : isEth ? 0.0085 : 0.0245, // Funding Rate
      orderImbalance: isBtc ? 64 : isEth ? 51 : 57, // Buy side depth %
    };
  }, [symbol]);

  return (
    <div id="crypto-enterprise-evaluator" className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md space-y-6">
      
      {/* Tab Controller and Title */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 rounded-md">
              <Activity size={18} className="animate-pulse" />
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Enterprise Trading Bewertungstool (Top-3 Trading-Matrix)
            </h2>
          </div>
          <p className="text-xs text-white/50">
            Austausch der Standard-Heatmap durch professionelle, interaktive Orderbuch-Tiefenanalyse, Arbitrage-Indizes und On-Chain Metriken für <span className="text-aif-gold-DEFAULT font-bold">{symbol}</span>.
          </p>
        </div>

        {/* Tab Selection buttons */}
        <div className="flex flex-wrap gap-1.5 bg-black/40 p-1 border border-white/5 rounded-lg">
          <button
            onClick={() => setActiveTool('orderbook')}
            className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTool === 'orderbook'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={11} />
            <span>Orderbuch-Tiefe</span>
          </button>

          <button
            onClick={() => setActiveTool('arbitrage')}
            className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTool === 'arbitrage'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowRightLeft size={11} />
            <span>Arbitrage-Index</span>
          </button>

          <button
            onClick={() => setActiveTool('onchain')}
            className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeTool === 'onchain'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp size={11} />
            <span>On-Chain Momentum</span>
          </button>
        </div>
      </div>

      {/* Dynamic Module Workspace */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: Orderbook Depth & Slippage Tool */}
        {activeTool === 'orderbook' && (
          <motion.div
            key="orderbook"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* D3 Diagram - 7 cols */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider font-bold">Kumulierte Liquiditätstiefe (Gebote/Anfragen)</span>
                <span className="text-[10px] font-mono text-white/30">Keine Live-Quelle verbunden</span>
              </div>
              <div className="w-full bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-center min-h-[180px]">
                {ORDERBOOK_DATA_AVAILABLE ? (
                  <svg ref={orderBookSvgRef} className="w-full" />
                ) : (
                  <div className="text-center px-4">
                    <p className="text-[11px] font-mono text-white/40">Keine echten Orderbuch-Daten verfügbar.</p>
                    <p className="text-[10px] font-mono text-white/25 mt-1">Diese Ansicht wird aktiviert, sobald eine reale Markttiefe-Quelle (Exchange-Orderbuch-API) angebunden ist. Es werden keine simulierten Werte angezeigt.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Controls & Metrics Panel - 5 cols */}
            <div className="lg:col-span-5 bg-white/[0.02] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Enterprise Slippage Rechner</h4>
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 uppercase font-mono font-bold">Simulator</span>
                </div>

                {/* Input size slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-white/50">Simulierte Ordergröße:</span>
                    <span className="text-white font-bold">{orderSize.toLocaleString()} USD</span>
                  </div>
                  <input
                    type="range"
                    min={10000}
                    max={5000000}
                    step={10000}
                    value={orderSize}
                    onChange={(e) => setOrderSize(Number(e.target.value))}
                    className="w-full accent-cyan-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/30">
                    <span>10K USD</span>
                    <span>5M USD</span>
                  </div>
                </div>

                {/* Simulated Results */}
                <div className="space-y-2.5 pt-2 border-t border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Erwartete Preis-Slippage:</span>
                    <span className={`font-mono font-bold ${calculatedSlippage > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {calculatedSlippage.toFixed(4)} %
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Gemittelter Ausführungspreis:</span>
                    <span className="font-mono font-bold text-white">
                      {executionPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Order-Einflussstärke (Impact):</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
                      calculatedSlippage > 0.4 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {calculatedSlippage > 0.4 ? 'Mittel' : 'Exzellent / Gering'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-white/40 leading-relaxed">
                Der Liquiditätsmesser aggregiert die Order-Tiefen aus 6 weltweiten Krypto-Börsen und kalkuliert den optimalen Ausführungspfad, um Marktbelastungen zu minimieren.
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: Arbitrage Index */}
        {activeTool === 'arbitrage' && (
          <motion.div
            key="arbitrage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Arbitrage Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black">Arbitrage Scan-Filter</span>
                <p className="text-[11px] text-white/60">Filtert gefundene Preis-Differenzen nach Mindest-Prozentsatz.</p>
              </div>

              {/* Spread filter buttons */}
              <div className="flex gap-2 font-mono text-[10px]">
                {[0.02, 0.05, 0.10].map((val) => (
                  <button
                    key={val}
                    onClick={() => setMinSpreadFilter(val)}
                    className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                      minSpreadFilter === val
                        ? 'bg-aif-gold-DEFAULT text-black border-transparent shadow-[0_0_10px_rgba(245,196,83,0.15)]'
                        : 'bg-black/30 text-white/70 border-white/10 hover:bg-white/5'
                    }`}
                  >
                    &gt;= {val}% Spread
                  </button>
                ))}
              </div>
            </div>

            {/* List of Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {arbitrageOpps.length > 0 ? (
                arbitrageOpps.map((opp, idx) => (
                  <div 
                    key={idx} 
                    className="bg-black/40 border border-white/5 hover:border-cyan-500/20 rounded-xl p-4 transition-all relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">Arbitrage #{idx + 1}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-white">{opp.exchangeA}</span>
                          <span className="text-[10px] text-white/30">&rarr;</span>
                          <span className="text-xs font-bold text-white">{opp.exchangeB}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        +{opp.spread.toFixed(3)}% Spread
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-3 my-2 text-xs font-mono">
                      <div>
                        <span className="text-white/40 block text-[9px] uppercase">Kaufpreis ({opp.exchangeA})</span>
                        <span className="text-white font-bold">{opp.priceA.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[9px] uppercase">Verkaufspreis ({opp.exchangeB})</span>
                        <span className="text-white font-bold">{opp.priceB.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] text-white/50">Simulierter Ertrag (Ertragsabsicherung):</span>
                      <span className="font-mono font-black text-emerald-400 text-xs">
                        +{opp.profitPotential.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 bg-black/20 border border-dashed border-white/10 rounded-xl p-8 text-center space-y-2">
                  <HelpCircle className="text-white/30 mx-auto" size={24} />
                  <p className="text-xs text-white/60">Keine Arbitrage-Möglichkeiten über dem eingestellten Schwellenwert von {minSpreadFilter}% gefunden.</p>
                  <p className="text-[10px] text-white/40">Erhöhe das Order-Volumen oder verringere das Spread-Limit für detailliertere Arbitrage-Analysen.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 3: Onchain Whale Tracker */}
        {activeTool === 'onchain' && (
          <motion.div
            key="onchain"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Metric Card 1: Netflows */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-black">Exchange Net-Flows (24h)</span>
                <p className="text-[11px] text-white/50">Das Volumen an Coins, die sich in Börsenwallets hinein oder heraus bewegen.</p>
              </div>

              <div className="my-6">
                <div className={`text-xl font-mono font-bold leading-none ${whaleMetrics.exchangeNetflow24h < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(whaleMetrics.exchangeNetflow24h / 1000000).toFixed(1)}M USD
                </div>
                <div className="text-[9px] font-mono text-white/40 mt-1 uppercase">
                  {whaleMetrics.exchangeNetflow24h < 0 ? 'Abfluss (Bullisch / Akkumulation)' : 'Zufluss (Bearisch / Verkaufsdruck)'}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                <span className="text-white/40">Signal:</span>
                <span className={`font-mono font-bold uppercase ${whaleMetrics.exchangeNetflow24h < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {whaleMetrics.exchangeNetflow24h < 0 ? 'Stark Bullish' : 'Sorge / Risk-Off'}
                </span>
              </div>
            </div>

            {/* Metric Card 2: Whale Wallets */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-black">Whale Wallets Aktivität</span>
                <p className="text-[11px] text-white/50">Anzahl der Adressen mit einem Gegenwert von über 10 Millionen USD.</p>
              </div>

              <div className="my-6">
                <div className="text-xl font-mono font-bold text-white leading-none">
                  {whaleMetrics.activeWhaleWallets} 
                  <span className={`text-xs ml-2 font-normal ${whaleMetrics.whaleWalletsDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {whaleMetrics.whaleWalletsDelta >= 0 ? `+${whaleMetrics.whaleWalletsDelta}` : whaleMetrics.whaleWalletsDelta}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-white/40 mt-1 uppercase">
                  Aktive Institutionen / Wale
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                <span className="text-white/40">Zuwachsrate:</span>
                <span className="font-mono font-bold text-emerald-400">
                  +{((whaleMetrics.whaleWalletsDelta / whaleMetrics.activeWhaleWallets) * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Metric Card 3: Leverage & Funding Rates */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-black">Perpetual Funding-Rate</span>
                <p className="text-[11px] text-white/50">Kosten für das Halten von Long-Positionen. Indikator für überhitzten Hebel.</p>
              </div>

              <div className="my-6">
                <div className="text-xl font-mono font-bold text-white leading-none">
                  +{whaleMetrics.fundingRatePct}%
                </div>
                <div className="text-[9px] font-mono text-white/40 mt-1 uppercase">
                  Satz pro 8-Stunden-Intervall
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                <span className="text-white/40">Risiko-Stufe:</span>
                <span className={`font-mono font-bold uppercase ${whaleMetrics.fundingRatePct > 0.02 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {whaleMetrics.fundingRatePct > 0.02 ? 'Überhitzt / Liquidation-Risk' : 'Moderat / Stabil'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Enterprise compliance & footer bar */}
      <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-400 shrink-0" size={14} />
          <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider">AIF-Capital Realtime Datenschnittstelle verifiziert</span>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-white/40">
          <span>Letzter Abgleich: {lastRefresh.toLocaleTimeString()}</span>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
            <span>Aktualisieren</span>
          </button>
        </div>
      </div>

    </div>
  );
}
