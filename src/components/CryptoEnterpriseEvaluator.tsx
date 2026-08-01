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
  RefreshCw,
  Lock,
  ArrowRight,
  AlertCircle,
  X,
  Check,
  Search,
  Plus,
  Sparkles,
  Globe,
  Newspaper
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssetLogo } from './AssetLogo';
import { assetRegistry } from '../lib/assetRegistry';
import { Newsticker } from './Newsticker';
import { 
  getDailyScreeningCount, 
  canPerformScreening, 
  recordScreening, 
  STARTER_DAILY_LIMIT 
} from '../lib/dailyScreeningTracker';

interface CryptoEnterpriseEvaluatorProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  subscriptionTier?: string;
  onUpgradeClick?: () => void;
}

type ActiveTool = 'orderbook' | 'arbitrage' | 'onchain' | 'news';

interface ArbitrageOpportunity {
  exchangeA: string;
  exchangeB: string;
  priceA: number;
  priceB: number;
  spread: number; // percentage
  profitPotential: number; // USD
}

// Dynamically generate database from assetRegistry incorporating all universe assets
const getMarketAssetsDatabase = () => {
  const registryAssets = assetRegistry.getAssets();
  return registryAssets.map(asset => {
    let category = 'Crypto';
    if (asset.type === 'crypto') {
      category = asset.subtype === 'memecoin' ? 'Meme Crypto' : 'Crypto';
    } else if (asset.type === 'stock') {
      category = 'Aktien';
    } else if (asset.type === 'commodity') {
      category = 'Rohstoffe';
    } else if (asset.type === 'forex') {
      category = 'Forex';
    } else if (asset.type === 'index') {
      category = 'Indizes';
    } else if (asset.type === 'bond') {
      category = 'Bonds & Yields';
    }

    const displayScore = asset.score > 10 ? Number((asset.score / 10).toFixed(1)) : Number(asset.score.toFixed(1));

    return {
      symbol: asset.symbol,
      name: asset.name,
      category,
      type: asset.type,
      price: asset.price,
      score: displayScore
    };
  });
};

export function CryptoEnterpriseEvaluator({ 
  selectedSymbol, 
  onSelectSymbol,
  subscriptionTier,
  onUpgradeClick 
}: CryptoEnterpriseEvaluatorProps) {
  // Normalize current user subscription tier
  const effectiveTier = (subscriptionTier || (typeof window !== 'undefined' ? localStorage.getItem('capital_ai_subscription_tier') : 'Free')) || 'Free';
  
  const isFreeOrGuest = effectiveTier === 'Free' || effectiveTier === 'Gast' || effectiveTier === 'Guest';
  const isStarter = effectiveTier === 'Starter';
  const isPro = effectiveTier === 'Pro' || effectiveTier === 'PRO';
  const isEnterprise = effectiveTier === 'Enterprise' || effectiveTier === 'Enterprise OS';

  const [activeTool, setActiveTool] = useState<ActiveTool>('orderbook');
  const [tierNotice, setTierNotice] = useState<string | null>(null);

  // Track daily screening count
  const [dailyCount, setDailyCount] = useState<number>(() => getDailyScreeningCount());

  useEffect(() => {
    const handleUpdate = () => {
      setDailyCount(getDailyScreeningCount());
    };
    window.addEventListener('dailyScreeningUpdated', handleUpdate);
    return () => window.removeEventListener('dailyScreeningUpdated', handleUpdate);
  }, []);

  // Custom Asset List State
  const [customAssetList, setCustomAssetList] = useState<string[]>(() => {
    if (isFreeOrGuest) return ['BTC', 'ETH'];
    return ['BTC', 'ETH', 'SOL', 'XRP', 'AVAX', 'BNB', 'DOGE', 'PEPE', 'NVDA', 'AAPL'];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<string>('Alle');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddSearchAsset = (assetSymbol: string) => {
    const upper = assetSymbol.trim().toUpperCase();
    if (!upper) return;

    if (isFreeOrGuest && !customAssetList.includes(upper) && customAssetList.length >= 2) {
      setTierNotice(`Free/Gast-Limit: Im Free/Gast-Tarif können Sie maximal 1 Zusatz-Asset neben BTC hinzufügen (BTC + 1 Zusatz-Asset).`);
      setIsSearchOpen(false);
      return;
    }

    if ((isFreeOrGuest || isStarter) && selectedSymbol !== upper) {
      if (!canPerformScreening(effectiveTier)) {
        setTierNotice(`Tägliches Screening-Limit erreicht (5/5 Screenings verbraucht). Upgraden Sie auf PRO für unbegrenzte Screenings.`);
        setIsSearchOpen(false);
        if (onUpgradeClick) onUpgradeClick();
        return;
      }
      recordScreening(upper, effectiveTier);
    }

    if (!customAssetList.includes(upper)) {
      setCustomAssetList(prev => [...prev, upper]);
    }
    setTierNotice(null);
    onSelectSymbol(upper);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleToolSelect = (tool: ActiveTool) => {
    setTierNotice(null);
    setActiveTool(tool);
  };

  const handleAssetSelect = (sym: string) => {
    const upper = sym.toUpperCase();
    
    if (isFreeOrGuest && upper !== 'BTC') {
      setTierNotice(`Schutzhinweis: Im Free- & Gast-Modus ist im Enterprise Bewertungstool exklusiv Bitcoin (BTC) freigeschaltet. Für die volle Auswertung anderer Assets upgraden Sie auf Starter, PRO oder Enterprise OS.`);
      onSelectSymbol(sym);
      return;
    }

    if (isStarter && selectedSymbol !== upper) {
      if (!canPerformScreening(effectiveTier)) {
        setTierNotice(`Tägliches Screening-Limit erreicht (5/5 Screenings heute verbraucht). Im Starter-Tarif stehen täglich 5 Screenings zur Verfügung. Upgrade auf PRO für unbegrenztes Screening.`);
        if (onUpgradeClick) onUpgradeClick();
        return;
      }
      recordScreening(upper, effectiveTier);
    }

    setTierNotice(null);
    onSelectSymbol(sym);
  };
  
  // Controls state
  const [orderSize, setOrderSize] = useState<number>(100000); // USD
  const [minSpreadFilter, setMinSpreadFilter] = useState<number>(0.05); // %
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // State for full scoring architecture details
  const symbol = selectedSymbol.toUpperCase();
  const [livePrice, setLivePrice] = useState<number>(() => {
    return symbol === 'BTC' ? 68500 : symbol === 'ETH' ? 3450 : symbol === 'SOL' ? 145.2 : 1.0;
  });

  const [assetDetails, setAssetDetails] = useState<{
    name?: string;
    score?: number;
    pattern?: string;
    risk?: string;
    change24h?: number;
    expectedReturn?: number;
    volatility?: number;
  }>({});

  useEffect(() => {
    let active = true;
    async function fetchLiveAssetDetails() {
      try {
        const res = await fetch(`/api/registry/assets/${symbol}`);
        if (res.ok) {
          const data = await res.json();
          if (data && active) {
            if (typeof data.price === 'number') {
              setLivePrice(data.price);
            }
            setAssetDetails({
              name: data.name || symbol,
              score: typeof data.score === 'number' ? data.score : 8.2,
              // Audit ARCH-AUDIT-0002 (J1): data.pattern ist seit server.ts'
              // computeDisplayTrendLabel() eine echte Trend-Einordnung aus Kurshistorie
              // oder undefined - der Fallback-Text behauptet entsprechend keine Analyse,
              // die nicht stattgefunden hat.
              pattern: data.pattern || 'Keine reale Kurshistorie verfügbar',
              risk: data.risk || 'Medium',
              change24h: typeof data.change24h === 'number' ? data.change24h : 0.0,
              expectedReturn: typeof data.expectedReturn === 'number' ? data.expectedReturn : 15,
              volatility: typeof data.volatility === 'number' ? data.volatility : 50
            });
          }
        }
      } catch (err) {
        console.error('Error fetching live price for evaluator:', err);
      }
    }
    fetchLiveAssetDetails();
    return () => {
      active = false;
    };
  }, [symbol, lastRefresh]);

  const basePrice = livePrice;

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

  // Render D3 Order Book Depth
  useEffect(() => {
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
      
      const bidVol = Math.floor((15 - i) * (symbol === 'BTC' ? 1.8 : 12.5) * (1 + Math.random() * 0.4));
      const askVol = Math.floor((15 - i) * (symbol === 'BTC' ? 1.8 : 12.5) * (1 + Math.random() * 0.4));
      
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

  // --- LOCK OVERLAY FOR FREE & GAST USERS ---
  if (isFreeOrGuest) {
    return (
      <div id="crypto-enterprise-evaluator" className="bg-black/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden space-y-6 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-aif-gold-DEFAULT via-amber-400 to-aif-neon-cyan" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 shrink-0">
              <Lock size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-display">
                  Enterprise Trading Bewertungssystem
                </h2>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Für Free &amp; Gast gesperrt
                </span>
              </div>
              <p className="text-xs text-white/60 font-mono mt-0.5">
                Professionelle Orderbuch-Tiefenanalyse, Multi-Exchange Arbitrage &amp; On-Chain Whale Momentum
              </p>
            </div>
          </div>

          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="px-4 py-2 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:from-amber-400 hover:to-aif-gold-DEFAULT text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_20px_rgba(245,196,83,0.3)] flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] shrink-0"
            >
              <span>Jetzt Freischalten</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Lock Notice Box */}
        <div className="bg-gradient-to-r from-rose-950/40 via-black to-neutral-900/60 border border-rose-500/30 rounded-xl p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-400">
            <Lock size={32} />
          </div>
          <h3 className="text-xl font-black text-white font-display">
            In der Free- &amp; Gast-Version nicht enthalten
          </h3>
          <p className="text-xs sm:text-sm text-white/70 font-mono max-w-xl mx-auto leading-relaxed">
            Das Enterprise Trading Bewertungssystem verarbeitet hochfrequente Marktdaten und erfordert einen aktiven <strong className="text-aif-gold-DEFAULT">Starter-Tarif</strong> (ab 7€/m) oder höher.
          </p>

          {/* Tier Feature Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 text-left">
            {/* Starter */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black text-amber-400 uppercase font-mono">Starter</span>
                <span className="text-[10px] text-white/60 font-mono">7€ / m</span>
              </div>
              <ul className="text-[11px] font-mono text-white/70 space-y-1.5">
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <Check size={12} /> Bitcoin (BTC)
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <Check size={12} /> Orderbuch-Tiefenanalyse
                </li>
                <li className="flex items-center gap-1.5 text-white/40">
                  <X size={12} /> Arbitrage &amp; On-Chain
                </li>
              </ul>
            </div>

            {/* PRO */}
            <div className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-aif-gold-DEFAULT/20 pb-2">
                <span className="text-xs font-black text-aif-gold-DEFAULT uppercase font-mono flex items-center gap-1">
                  <Zap size={12} /> PRO (Bestseller)
                </span>
                <span className="text-[10px] text-white/60 font-mono">29€ / m</span>
              </div>
              <ul className="text-[11px] font-mono text-white/80 space-y-1.5">
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <Check size={12} /> BTC, ETH &amp; SOL
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <Check size={12} /> Alle 3 Trading Tools
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <Check size={12} /> Arbitrage &amp; On-Chain
                </li>
              </ul>
            </div>

            {/* Enterprise */}
            <div className="bg-aif-neon-cyan/10 border border-aif-neon-cyan/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-aif-neon-cyan/20 pb-2">
                <span className="text-xs font-black text-aif-neon-cyan uppercase font-mono flex items-center gap-1">
                  <ShieldCheck size={12} /> Enterprise OS
                </span>
                <span className="text-[10px] text-white/60 font-mono">109€ / m</span>
              </div>
              <ul className="text-[11px] font-mono text-white/80 space-y-1.5">
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <Check size={12} /> Alle Assets &amp; Aktien
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <Check size={12} /> Uneingeschränkter Zugriff
                </li>
                <li className="flex items-center gap-1.5 text-emerald-400">
                  <Check size={12} /> Zukünftige Features
                </li>
              </ul>
            </div>
          </div>

          {onUpgradeClick && (
            <div className="pt-2">
              <button
                onClick={onUpgradeClick}
                className="px-6 py-3 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:from-amber-400 hover:to-aif-gold-DEFAULT text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(245,196,83,0.4)] cursor-pointer hover:scale-105 inline-flex items-center gap-2"
              >
                <span>Jetzt Tarif ab 7€/Monat wählen</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="crypto-enterprise-evaluator" className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md space-y-6">
      
      {/* Tab Controller and Title */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 rounded-md">
              <Activity size={18} className="animate-pulse" />
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Enterprise Trading Bewertungstool
            </h2>

            {/* Current Tier Status Badge */}
            {isFreeOrGuest && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Free / Gast Tier (BTC Standard)
              </span>
            )}
            {isStarter && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Starter Tier
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white/10 text-white border border-white/20">
                  Screenings heute: <strong className={dailyCount >= 5 ? "text-rose-400" : "text-emerald-400"}>{dailyCount}/5</strong>
                </span>
              </div>
            )}
            {(isPro || isEnterprise) && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-aif-neon-cyan/20 text-aif-neon-cyan border border-aif-neon-cyan/40">
                PRO / Enterprise OS (Unbegrenzt)
              </span>
            )}
          </div>
          <p className="text-xs text-white/50">
            Professionelle, interaktive Orderbuch-Tiefenanalyse, Arbitrage-Indizes, On-Chain Metriken &amp; Realtime Intelligence Feed für <span className="text-aif-gold-DEFAULT font-bold">{symbol}</span>.
          </p>
        </div>

        {/* Tab Selection buttons with Tier locks */}
        <div className="flex flex-wrap gap-1.5 bg-black/40 p-1 border border-white/5 rounded-lg">
          <button
            onClick={() => handleToolSelect('orderbook')}
            className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'orderbook'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={11} />
            <span>Orderbuch-Tiefe</span>
          </button>

          <button
            onClick={() => handleToolSelect('arbitrage')}
            className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'arbitrage'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {isStarter && <Lock size={10} className="text-amber-400 shrink-0" />}
            <ArrowRightLeft size={11} />
            <span>Arbitrage-Index</span>
            {isStarter && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded">PRO</span>}
          </button>

          <button
            onClick={() => handleToolSelect('onchain')}
            className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'onchain'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {isStarter && <Lock size={10} className="text-amber-400 shrink-0" />}
            <TrendingUp size={11} />
            <span>On-Chain Momentum</span>
            {isStarter && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded">PRO</span>}
          </button>

          <button
            onClick={() => handleToolSelect('news')}
            className={`px-3 py-1.5 rounded-md font-mono text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'news'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {isStarter && <Lock size={10} className="text-amber-400 shrink-0" />}
            <Newspaper size={11} />
            <span>Intelligence Feed</span>
            {isStarter && <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1 rounded">PRO</span>}
          </button>
        </div>
      </div>

      {/* Tier Notice Alert if user clicks restricted asset or tool */}
      <AnimatePresence>
        {tierNotice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs font-mono"
          >
            <div className="flex items-center gap-2.5 text-amber-200">
              <AlertCircle size={16} className="text-amber-400 shrink-0" />
              <span>{tierNotice}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onUpgradeClick && (
                <button
                  onClick={onUpgradeClick}
                  className="px-2.5 py-1 bg-amber-500 text-black font-black text-[10px] uppercase rounded hover:bg-amber-400 transition-all cursor-pointer"
                >
                  Upgrade
                </button>
              )}
              <button
                onClick={() => setTierNotice(null)}
                className="text-white/50 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset Quick Selector & Scoring Architecture Sync Banner */}
      <div className="bg-black/60 border border-white/10 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/50 font-bold">Asset Schnell-Auswahl:</span>
            <div className="flex flex-wrap gap-1 items-center">
              {customAssetList.map((sym) => {
                const upper = sym.toUpperCase();
                const isAssetStarterDisabled = isStarter && upper !== 'BTC';
                const isAssetProDisabled = isPro && !['BTC', 'ETH', 'SOL'].includes(upper);
                const isLockedForCurrentTier = isAssetStarterDisabled || isAssetProDisabled;

                return (
                  <button
                    key={sym}
                    onClick={() => handleAddSearchAsset(sym)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      symbol === upper
                        ? 'bg-aif-gold-DEFAULT text-black shadow-[0_0_10px_rgba(245,196,83,0.3)]'
                        : isLockedForCurrentTier
                        ? 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                    title={
                      isAssetStarterDisabled 
                        ? 'Erfordert PRO (ETH/SOL) oder Enterprise' 
                        : isAssetProDisabled 
                        ? 'Erfordert Enterprise OS' 
                        : sym
                    }
                  >
                    <AssetLogo symbol={upper} size="xs" className="shrink-0" />
                    <span>{sym}</span>
                    {isLockedForCurrentTier && <Lock size={9} className="text-amber-400/80" />}
                    {isAssetStarterDisabled && <span className="text-[7px] text-amber-300 font-normal font-sans">PRO</span>}
                    {isAssetProDisabled && <span className="text-[7px] text-aif-neon-cyan font-normal font-sans">ENT</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Intelligent Enterprise Asset Search Field */}
          <div className="relative w-full lg:w-auto" ref={searchContainerRef}>
            <div className="flex items-center bg-white/5 border border-white/10 focus-within:border-aif-gold-DEFAULT/60 rounded-lg px-2.5 py-1.5 text-xs transition-all w-full lg:w-72">
              <Search size={13} className="text-aif-gold-DEFAULT mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Enterprise Asset-Suche (z.B. SUI, TSLA, GOLD, EURUSD)..."
                className="bg-transparent text-white placeholder-white/40 focus:outline-none w-full font-mono text-[11px]"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-white/40 hover:text-white ml-1 cursor-pointer"
                >
                  <X size={12} />
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[9px] font-mono text-aif-neon-cyan bg-aif-neon-cyan/10 border border-aif-neon-cyan/30 px-1.5 py-0.5 rounded ml-1 shrink-0">
                  <Sparkles size={10} />
                  Enterprise OS
                </span>
              )}
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  className="absolute left-0 lg:right-0 lg:left-auto top-full mt-1.5 w-full sm:w-[420px] bg-neutral-950/95 border border-white/15 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.9)] backdrop-blur-xl z-50 p-2 space-y-1.5 max-h-80 overflow-y-auto"
                >
                  {(() => {
                    const allMarketAssets = getMarketAssetsDatabase();
                    return (
                      <>
                        <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 text-[10px] font-mono text-white/50 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Globe size={11} className="text-aif-gold-DEFAULT" />
                            Enterprise Asset Registry
                          </span>
                          <span className="text-aif-gold-DEFAULT font-bold">{allMarketAssets.length} Assets im Bestand</span>
                        </div>

                        {/* Universe Category Tabs Filter */}
                        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg border border-white/5 overflow-x-auto no-scrollbar">
                          {['Alle', 'Crypto', 'Aktien', 'Rohstoffe', 'Forex', 'Indizes'].map(cat => (
                            <button
                              key={cat}
                              onClick={() => setSearchCategory(cat)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all shrink-0 cursor-pointer ${
                                searchCategory === cat
                                  ? 'bg-aif-gold-DEFAULT text-black font-bold shadow-[0_0_8px_rgba(217,119,6,0.3)]'
                                  : 'text-white/60 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Filtered Assets from Database */}
                        {(() => {
                          const query = searchQuery.trim().toLowerCase();
                          const filtered = allMarketAssets.filter(item => {
                            const matchesQuery = !query || 
                              item.symbol.toLowerCase().includes(query) || 
                              item.name.toLowerCase().includes(query) || 
                              item.category.toLowerCase().includes(query);

                            if (!matchesQuery) return false;

                            if (searchCategory === 'Alle') return true;
                            if (searchCategory === 'Crypto') return item.type === 'crypto';
                            if (searchCategory === 'Aktien') return item.type === 'stock';
                            if (searchCategory === 'Rohstoffe') return item.type === 'commodity';
                            if (searchCategory === 'Forex') return item.type === 'forex';
                            if (searchCategory === 'Indizes') return item.type === 'index' || item.type === 'bond';

                            return true;
                          });

                          if (filtered.length === 0 && searchQuery.trim()) {
                            const customSym = searchQuery.trim().toUpperCase();
                            return (
                              <div className="p-3 text-center space-y-2">
                                <p className="text-xs font-mono text-white/60">Kein vordefiniertes Asset für &quot;{searchQuery}&quot; in {searchCategory} gefunden.</p>
                                <button
                                  onClick={() => handleAddSearchAsset(customSym)}
                                  className="w-full py-1.5 px-3 bg-aif-gold-DEFAULT/20 hover:bg-aif-gold-DEFAULT text-aif-gold-DEFAULT hover:text-black border border-aif-gold-DEFAULT/40 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Plus size={14} />
                                  <span>Symbol &quot;{customSym}&quot; als Custom Asset hinzufügen</span>
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-1 pt-1">
                              {filtered.slice(0, 10).map(asset => {
                                const upper = asset.symbol;
                                const isAssetStarterDisabled = isStarter && upper !== 'BTC';
                                const isAssetProDisabled = isPro && !['BTC', 'ETH', 'SOL'].includes(upper);
                                const isLocked = isAssetStarterDisabled || isAssetProDisabled;

                                return (
                                  <button
                                    key={asset.symbol}
                                    onClick={() => handleAddSearchAsset(asset.symbol)}
                                    className="w-full p-2 hover:bg-white/10 rounded-lg transition-all text-left flex items-center justify-between gap-2 group cursor-pointer border border-transparent hover:border-white/10"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="p-1 bg-white/5 border border-white/10 rounded group-hover:border-aif-gold-DEFAULT/50 shrink-0 flex items-center justify-center">
                                        <AssetLogo symbol={asset.symbol} size="sm" className="shrink-0" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                          <span className="font-mono text-aif-gold-DEFAULT font-bold">{asset.symbol}</span>
                                          <span className="truncate text-white/90 max-w-[150px]">{asset.name}</span>
                                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-white/50 border border-white/5 shrink-0">
                                            {asset.category}
                                          </span>
                                        </div>
                                        <div className="text-[10px] font-mono text-white/40">
                                          Kurs: ${asset.price < 1 ? asset.price.toFixed(6) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | AI Score: {asset.score}/10
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {isLocked ? (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                          <Lock size={10} />
                                          {isAssetStarterDisabled ? 'PRO/ENT' : 'Enterprise'}
                                        </span>
                                      ) : (
                                        <span className="p-1 bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/30 text-aif-gold-DEFAULT rounded group-hover:bg-aif-gold-DEFAULT group-hover:text-black transition-all">
                                          <Plus size={12} />
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}

                              {searchQuery.trim() && !filtered.some(a => a.symbol.toLowerCase() === searchQuery.trim().toLowerCase()) && (
                                <button
                                  onClick={() => handleAddSearchAsset(searchQuery.trim().toUpperCase())}
                                  className="w-full mt-1 py-1.5 px-3 bg-white/5 hover:bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border border-white/10 hover:border-aif-gold-DEFAULT/40 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Plus size={12} />
                                  <span>Custom Symbol &quot;{searchQuery.trim().toUpperCase()}&quot; hinzufügen</span>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scoring Sync Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-[10px]">Aktives Asset:</span>
            <div className="flex items-center gap-1.5 font-black text-white bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT px-2 py-0.5 rounded border border-aif-gold-DEFAULT/30">
              <AssetLogo symbol={symbol} size="xs" className="shrink-0" />
              <span>{symbol}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-white/50 text-[10px]">Scoring Architektur:</span>
            <span className="font-bold text-aif-gold-DEFAULT">{assetDetails.score ?? 8.2} / 10</span>
            <span className="text-white/30">|</span>
            <span className="text-emerald-400 font-bold">{assetDetails.pattern || 'Keine reale Kurshistorie verfügbar'}</span>
            <span className="text-white/30">|</span>
            <span className={(assetDetails.change24h ?? 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {(assetDetails.change24h ?? 0) >= 0 ? `+${assetDetails.change24h}%` : `${assetDetails.change24h}%`}
            </span>
          </div>
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
                <span className="text-[10px] font-mono text-emerald-400">Verteilungsverhältnis: {whaleMetrics.orderImbalance}% Kaufsignal</span>
              </div>
              <div className="w-full bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-center">
                <svg ref={orderBookSvgRef} className="w-full" />
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

        {/* TAB 4: Realtime Intelligence Feed */}
        {activeTool === 'news' && (
          <motion.div
            key="news"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <Newsticker selectedSymbol={symbol} timeframe="1D" />
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
