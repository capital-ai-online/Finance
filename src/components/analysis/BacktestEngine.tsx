import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  TrendingUp, 
  Percent, 
  Clock, 
  Sliders, 
  HelpCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  FileText,
  PieChart
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PdfExportModal } from '../common/PdfExportModal';
import { PortfolioBacktester } from './PortfolioBacktester';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

interface BacktestEngineProps {
  selectedSymbol?: string;
  userCapital?: number;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
  userEmail?: string;
}

interface StrategyParams {
  shortPeriod: number;
  longPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
  transactionCost: number; // in %
}

interface Trade {
  id: string;
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  shares: number;
  totalValue: number;
  cashRemaining: number;
}

interface SimResult {
  date: string;
  price: number;
  strategyValue: number;
  holdValue: number;
  rsi?: number;
  smaShort?: number;
  smaLong?: number;
}

const TICKERS = [
  { symbol: 'BTC', name: 'Bitcoin', assetClass: 'Crypto', basePrice: 57800, volatility: 0.55, drift: 0.18 },
  { symbol: 'ETH', name: 'Ethereum', assetClass: 'Crypto', basePrice: 3312, volatility: 0.65, drift: 0.15 },
  { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'Stocks', basePrice: 157.86, volatility: 0.22, drift: 0.12 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'Stocks', basePrice: 415.50, volatility: 0.20, drift: 0.14 },
  { symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'Stocks', basePrice: 187.20, volatility: 0.45, drift: 0.20 },
  { symbol: 'GLD', name: 'Gold ETF', assetClass: 'Commodities', basePrice: 220.40, volatility: 0.12, drift: 0.05 },
  { symbol: 'EURUSD', name: 'EUR/USD FX', assetClass: 'Forex', basePrice: 1.085, volatility: 0.08, drift: 0.01 },
];

export function BacktestEngine({ selectedSymbol = 'BTC', userCapital = 150000, triggerAttempt, userEmail }: BacktestEngineProps) {
  const [activeTab, setActiveTab] = useState<'strategy' | 'portfolio'>('portfolio');
  const [showExportModal, setShowExportModal] = useState(false);
  const [availableTickers, setAvailableTickers] = useState<any[]>(TICKERS);
  const [ticker, setTicker] = useState<string>(selectedSymbol);

  // Sync state if selectedSymbol changes
  useEffect(() => {
    setTicker(selectedSymbol);
  }, [selectedSymbol]);

  // Load all 410 assets dynamically from API
  useEffect(() => {
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        const nonVariants = data.filter((asset: any) => !asset.name.toLowerCase().includes('variant'));
        const mapped = nonVariants.map((asset: any) => {
          let assetClass = 'Stocks';
          let volatility = 0.22;
          let drift = 0.12;

          if (asset.type === 'crypto') {
            assetClass = 'Crypto';
            volatility = 0.55;
            drift = 0.18;
          } else if (asset.type === 'index') {
            assetClass = 'Indices';
            volatility = 0.15;
            drift = 0.08;
          } else if (asset.type === 'commodity') {
            assetClass = 'Commodities';
            volatility = 0.12;
            drift = 0.05;
          } else if (asset.type === 'forex') {
            assetClass = 'Forex';
            volatility = 0.08;
            drift = 0.01;
          }

          return {
            symbol: asset.symbol,
            name: asset.name,
            assetClass,
            basePrice: asset.price,
            volatility,
            drift
          };
        });

        const merged = [...TICKERS];
        mapped.forEach((m: any) => {
          if (!merged.some(t => m.symbol === t.symbol)) {
            merged.push(m);
          }
        });
        setAvailableTickers(merged);
      })
      .catch(err => {
        console.error('Error fetching assets in BacktestEngine:', err);
      });
  }, []);

  const [timeRange, setTimeRange] = useState<'1Y' | '3Y' | '5Y'>('3Y');
  const [strategy, setStrategy] = useState<'SMA_CROSS' | 'RSI_MOMENTUM' | 'MEAN_REVERSION'>('SMA_CROSS');
  const [initialCapital, setInitialCapital] = useState<number>(userCapital);
  
  // Strategy params
  const [params, setParams] = useState<StrategyParams>({
    shortPeriod: 12,
    longPeriod: 26,
    rsiOversold: 30,
    rsiOverbought: 70,
    transactionCost: 0.1, // 0.1% transaction cost
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Simulated metrics state
  const [metrics, setMetrics] = useState({
    finalStrategyValue: 0,
    finalHoldValue: 0,
    strategyReturn: 0,
    holdReturn: 0,
    cagr: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    winRate: 0,
    totalTrades: 0,
  });

  const [chartData, setChartData] = useState<SimResult[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  // Backtest on real historical data fetched dynamically from API
  const runSimulation = () => {
    const execute = async () => {
      setIsSimulating(true);
      setErrorState(null);
      setSimulationProgress(15);

      try {
        const response = await fetch(`/api/backtest-history?symbol=${ticker}&range=${timeRange}`);
        if (!response.ok) {
          throw new Error('NO_DATA');
        }
        const historicalData = await response.json();
        if (historicalData.status === 'NO_DATA' || !Array.isArray(historicalData) || historicalData.length === 0) {
          throw new Error('NO_DATA');
        }

        setSimulationProgress(65);

        const computed = calculateBacktestOnRealData(historicalData, strategy, params, initialCapital);
        
        setChartData(computed.chartData);
        setTrades(computed.trades);
        setMetrics(computed.metrics);
        setIsSimulating(false);
        setHasSimulated(true);
      } catch (err) {
        console.error('Backtest calculation error:', err);
        setErrorState('NO_DATA');
        setIsSimulating(false);
        setHasSimulated(false);
      }
    };

    if (triggerAttempt) {
      triggerAttempt('Backtest Simulation', execute);
    } else {
      execute();
    }
  };

  const exportTradesToCSV = () => {
    if (trades.length === 0) return;
    const headers = [
      'Order-ID',
      'Datum',
      'Typ',
      'Ausfuehrungskurs (EUR)',
      'Anteile',
      'Transaktionsvolumen (EUR)',
      'Verbleibender Cashbestand (EUR)',
      'Gesamter Portfoliowert (EUR)'
    ];
    const rows = trades.map(t => [
      t.id,
      t.date,
      t.type,
      t.price.toFixed(4),
      t.shares.toFixed(6),
      t.totalValue.toFixed(2),
      t.cashRemaining.toFixed(2),
      (t.cashRemaining + t.shares * t.price).toFixed(2)
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Backtest_Trades_${ticker}_${strategy}_${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPerformanceToCSV = () => {
    if (chartData.length === 0) return;
    const headers = [
      'Datum',
      'Kurs (EUR)',
      'Strategie-Portfoliowert (EUR)',
      'Buy-And-Hold-Wert (EUR)',
      'RSI',
      'SMA_Short',
      'SMA_Long'
    ];
    const rows = chartData.map(d => [
      d.date,
      d.price.toFixed(4),
      d.strategyValue.toFixed(2),
      d.holdValue.toFixed(2),
      d.rsi !== undefined ? d.rsi : '',
      d.smaShort !== undefined ? d.smaShort : '',
      d.smaLong !== undefined ? d.smaLong : ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Backtest_Performance_${ticker}_${strategy}_${timeRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPerformanceToPDF = () => {
    if (!hasSimulated || chartData.length === 0) return;
    
    const doc = new jsPDF();
    
    // Header banner (Charcoal block with gold accents)
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 38, 'F');
    
    // Gold line under header
    doc.setFillColor(245, 196, 83);
    doc.rect(0, 38, 210, 2, 'F');
    
    // Header Typography
    doc.setTextColor(245, 196, 83);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CAPITAL-AI', 15, 18);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('AUTOMATED QUANT BACKTESTING ENGINE REPORT', 15, 28);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 196, 83);
    doc.text('SYSTEM: AUTO-ROUTER', 152, 18);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.text(`DATUM: ${new Date().toLocaleDateString('de-DE')}`, 152, 28);
    
    // Section 1: Meta Configuration
    let y = 50;
    doc.setTextColor(15, 15, 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. SIMULATIONSPARAMETER & KONFIGURATION', 15, y);
    doc.setDrawColor(245, 196, 83);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    
    // 2-column configuration table
    doc.text('Basis-Asset / Ticker:', 15, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(String(ticker), 60, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Startkapital:', 110, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(`EUR ${initialCapital.toLocaleString('de-DE')}`, 150, y);
    
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Handelsstrategie:', 15, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(String(strategy), 60, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Transaktionsgebuehr:', 110, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(`${params.transactionCost}%`, 150, y);
    
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Zeithorizont:', 15, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(String(timeRange), 60, y);
    
    if (strategy === 'SMA_CROSS') {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('SMA Perioden:', 110, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 15, 15);
      doc.text(`SMA ${params.shortPeriod} (Kurz) / SMA ${params.longPeriod} (Lang)`, 150, y);
    } else if (strategy === 'RSI_MOMENTUM') {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('RSI Trigger:', 110, y);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 15, 15);
      doc.text(`Oversold: ${params.rsiOversold} / Overbought: ${params.rsiOverbought}`, 150, y);
    }
    
    // Section 2: Core Performance metrics
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 15, 15);
    doc.text('2. PERFORMANCE-METRIKEN UND ERGEBNISSE', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    // 4 visual KPI blocks
    const kpis = [
      { label: 'Strategie-Endwert', value: formatCurrency(metrics.finalStrategyValue), change: `${metrics.strategyReturn >= 0 ? '+' : ''}${metrics.strategyReturn.toFixed(1)}%` },
      { label: 'Buy & Hold Endwert', value: formatCurrency(metrics.finalHoldValue), change: `${metrics.holdReturn >= 0 ? '+' : ''}${metrics.holdReturn.toFixed(1)}%` },
      { label: 'Sharpe Ratio', value: metrics.sharpeRatio.toFixed(2), change: `Max DD: -${metrics.maxDrawdown.toFixed(1)}%` },
      { label: 'Trades / Winrate', value: `${metrics.totalTrades} Trades`, change: `Trefferquote: ${metrics.winRate.toFixed(0)}%` }
    ];
    
    kpis.forEach((kpi, idx) => {
      const kX = 15 + (idx * 45);
      // draw elegant light grey cards
      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(230, 230, 230);
      doc.rect(kX, y, 40, 24, 'FD');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(kpi.label, kX + 3, y + 5);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 15, 15);
      doc.text(kpi.value, kX + 3, y + 13);
      
      doc.setFontSize(8);
      if (kpi.change.includes('+') || (kpi.change.includes('Trefferquote') && metrics.winRate > 50)) {
        doc.setTextColor(16, 185, 129); // emerald green
      } else if (kpi.change.includes('-') || kpi.change.includes('Max DD')) {
        doc.setTextColor(239, 68, 68); // rose red
      } else {
        doc.setTextColor(80, 80, 80);
      }
      doc.text(kpi.change, kX + 3, y + 20);
    });
    
    // Section 3: Trade Log Table
    y += 35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 15, 15);
    doc.text('3. TRANSAKTIONS-PROTOKOLL (TOP TRADES)', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    // Table headers
    doc.setFillColor(30, 30, 30);
    doc.rect(15, y, 180, 6.5, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Datum', 18, y + 4.5);
    doc.text('Order-Typ', 45, y + 4.5);
    doc.text('Ausfuehrungskurs', 75, y + 4.5);
    doc.text('Anteile', 115, y + 4.5);
    doc.text('Volumen', 145, y + 4.5);
    doc.text('Portfolio-Wert', 175, y + 4.5);
    
    y += 6.5;
    doc.setFont('helvetica', 'normal');
    
    const rowsToDraw = trades.slice(0, 15);
    rowsToDraw.forEach((trade, idx) => {
      // zebra stripe rows
      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(15, y, 180, 6.5, 'F');
      
      doc.setTextColor(80, 80, 80);
      doc.text(trade.date, 18, y + 4.5);
      
      if (trade.type === 'BUY') {
        doc.setTextColor(16, 185, 129);
        doc.text('KAUF (BUY)', 45, y + 4.5);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('VERKAUF (SELL)', 45, y + 4.5);
      }
      
      doc.setTextColor(40, 40, 40);
      doc.text(`EUR ${trade.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`, 75, y + 4.5);
      doc.text(trade.shares.toFixed(4), 115, y + 4.5);
      doc.text(`EUR ${trade.totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, 145, y + 4.5);
      
      const portVal = trade.cashRemaining + (trade.shares * trade.price);
      doc.setFont('helvetica', 'bold');
      doc.text(`EUR ${portVal.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, 175, y + 4.5);
      doc.setFont('helvetica', 'normal');
      
      y += 6.5;
    });
    
    if (trades.length > 15) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`... und ${trades.length - 15} weitere Transaktionen. Laden Sie das vollstaendige CSV-Protokoll fuer alle Details herunter.`, 15, y + 6);
    }
    
    // Page bottom footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text('Dieses Dokument wurde automatisch von CAPITAL-AI generiert. DSGVO-konforme quantitative Echtzeitanalyse.', 15, 285);
    doc.text('Sven Kulessa • sven.kulessa@gmail.com • Compliant with Art. 30 GDPR / BFSG Accessibility Standards.', 15, 289);
    
    doc.save(`CAPITAL_AI_Backtest_${ticker}_${strategy}.pdf`);
  };

  const activeTickerInfo = availableTickers.find(t => t.symbol === ticker) || availableTickers[0] || TICKERS[0];

  return (
    <div id="backtest-engine-panel" className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6 relative overflow-hidden">
      {/* Visual background gradient accents */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-aif-gold-DEFAULT/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-aif-neon-purple/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-black/60 border border-white/5 rounded-xl w-fit relative z-10">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'portfolio'
              ? 'bg-aif-gold-DEFAULT text-black font-black'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <PieChart size={14} />
          <span>Portfolio-Allokation</span>
          <span className={`px-1 py-0.5 rounded text-[8px] font-mono font-bold tracking-normal uppercase ${
            activeTab === 'portfolio' ? 'bg-black text-aif-gold-DEFAULT' : 'bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT'
          }`}>
            NEU
          </span>
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'strategy'
              ? 'bg-aif-gold-DEFAULT text-black font-black'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders size={14} />
          <span>Asset-Strategie</span>
        </button>
      </div>

      {activeTab === 'portfolio' && (
        <PortfolioBacktester userCapital={userCapital} triggerAttempt={triggerAttempt} userEmail={userEmail} />
      )}

      {activeTab === 'strategy' && (
        <>
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/35 tracking-wider">
              ENTERPRISE Backtest Core
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-white/85 font-mono">Live Simulation Engine</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
            Quantitative Backtest Engine
          </h2>
          <p className="text-xs text-white/60 leading-relaxed max-w-2xl mt-1">
            Simuliere und vergleiche komplexe Handelsstrategien basierend auf mathematischen Wahrscheinlichkeitsmodellen, historischer Volatilität und gleitenden Durchschnitten.
          </p>
        </div>
        
        <button
          onClick={runSimulation}
          disabled={isSimulating}
          className="px-6 py-3 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,196,83,0.3)] w-full md:w-auto cursor-pointer"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Simuliere ({simulationProgress}%)</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-black" />
              <span>Simulation starten</span>
            </>
          )}
        </button>
      </div>

      {/* Grid: Controls & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Asset & Timeframe selection */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-aif-gold-DEFAULT mb-1">
            <Layers size={16} />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">1. Asset & Zeitspanne</span>
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1.5 font-mono">Basiswert / Ticker (Schnellwahl)</label>
            <div className="grid grid-cols-4 gap-2">
              {TICKERS.map((t) => (
                <button
                  key={t.symbol}
                  onClick={() => setTicker(t.symbol)}
                  className={`py-2 px-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                    ticker === t.symbol
                      ? 'bg-aif-gold-DEFAULT text-black border-aif-gold-DEFAULT shadow-[0_0_10px_rgba(245,196,83,0.15)] font-black'
                      : 'bg-black/20 text-white/60 border-white/10 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {t.symbol}
                </button>
              ))}
            </div>
            <div className="mt-2.5">
              <label className="text-[11px] text-white/70 block mb-1 font-mono">Oder suche aus allen 410 Assets:</label>
              <select
                value={availableTickers.some(t => t.symbol === ticker) ? ticker : 'BTC'}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT cursor-pointer font-mono"
              >
                {availableTickers.map((t) => (
                  <option key={t.symbol} value={t.symbol} className="bg-black text-white font-mono">
                    {t.symbol} — {t.name} ({t.assetClass})
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-white/70 font-mono">
              <span>{activeTickerInfo.name}</span>
              <span>Klasse: {activeTickerInfo.assetClass}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1.5 font-mono">Simulationszeitraum</label>
            <div className="grid grid-cols-3 gap-2">
              {(['1Y', '3Y', '5Y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`py-2 rounded-lg text-xs font-mono font-bold border transition-all ${
                    timeRange === range
                      ? 'bg-white/10 text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                      : 'bg-black/20 text-white/40 border-white/10 hover:bg-white/5'
                  }`}
                >
                  {range === '1Y' && '1 Jahr'}
                  {range === '3Y' && '3 Jahre'}
                  {range === '5Y' && '5 Jahre'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 block mb-1.5 font-mono">Startkapital (€)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-xs font-mono">€</span>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Math.max(1000, Number(e.target.value)))}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-8 pr-4 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50"
              />
            </div>
            <span className="text-[11px] text-white/65 font-mono mt-1 block">
              Default synchronisiert mit Ihrem Profil-Kapital
            </span>
          </div>
        </div>

        {/* Step 2: Strategy selection */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-aif-gold-DEFAULT mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">2. Handelsstrategie</span>
          </div>

          <div className="space-y-2">
            {[
              { 
                id: 'SMA_CROSS', 
                name: 'SMA Crossover', 
                desc: 'Kaufe, wenn der kurze gleitende Durchschnitt den langen nach oben schneidet (Golden Cross). Verkaufe beim Death Cross.'
              },
              { 
                id: 'RSI_MOMENTUM', 
                name: 'RSI Momentum', 
                desc: 'Kaufe bei Überverkauft-Schwelle (RSI < 30) und verkaufe bei Überkauft-Schwelle (RSI > 70).'
              },
              { 
                id: 'MEAN_REVERSION', 
                name: 'Mean Reversion', 
                desc: 'Nutzt statistische Abweichungen. Kauft bei starkem Kurseinbruch unter den Durchschnitt und verkauft bei Kurserholung.'
              },
            ].map((strat) => (
              <button
                key={strat.id}
                onClick={() => setStrategy(strat.id as any)}
                className={`w-full p-3 rounded-lg text-left border transition-all flex flex-col gap-1 ${
                  strategy === strat.id
                    ? 'bg-aif-gold-DEFAULT/5 border-aif-gold-DEFAULT/40 shadow-[0_0_15px_rgba(245,196,83,0.05)]'
                    : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-xs font-bold ${strategy === strat.id ? 'text-aif-gold-DEFAULT font-extrabold' : 'text-white'}`}>
                    {strat.name}
                  </span>
                  <input
                    type="radio"
                    checked={strategy === strat.id}
                    onChange={() => {}}
                    className="accent-aif-gold-DEFAULT w-3 h-3"
                  />
                </div>
                <p className="text-[10px] text-white/40 leading-normal">
                  {strat.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Strategy Parameter tuning */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-aif-gold-DEFAULT mb-1">
            <Sliders size={16} />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">3. Parameter-Feintuning</span>
          </div>

          {strategy === 'SMA_CROSS' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-white/50">Kurzer SMA (Perioden):</span>
                  <span className="text-aif-gold-DEFAULT font-bold">{params.shortPeriod}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={params.shortPeriod}
                  onChange={(e) => setParams({ ...params, shortPeriod: Number(e.target.value) })}
                  className="w-full accent-aif-gold-DEFAULT"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-white/50">Langer SMA (Perioden):</span>
                  <span className="text-aif-gold-DEFAULT font-bold">{params.longPeriod}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={params.longPeriod}
                  onChange={(e) => setParams({ ...params, longPeriod: Math.max(params.shortPeriod + 5, Number(e.target.value)) })}
                  className="w-full accent-aif-gold-DEFAULT"
                />
              </div>
            </div>
          )}

          {strategy === 'RSI_MOMENTUM' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-white/50">RSI Überverkauft (Kauf):</span>
                  <span className="text-emerald-400 font-bold">{params.rsiOversold}</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={params.rsiOversold}
                  onChange={(e) => setParams({ ...params, rsiOversold: Number(e.target.value) })}
                  className="w-full accent-aif-gold-DEFAULT"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-white/50">RSI Überkauft (Verkauf):</span>
                  <span className="text-rose-400 font-bold">{params.rsiOverbought}</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="85"
                  value={params.rsiOverbought}
                  onChange={(e) => setParams({ ...params, rsiOverbought: Number(e.target.value) })}
                  className="w-full accent-aif-gold-DEFAULT"
                />
              </div>
            </div>
          )}

          {strategy === 'MEAN_REVERSION' && (
            <div className="space-y-4">
              <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-white/50 block mb-1 font-mono uppercase">Info Mean Reversion</span>
                <p className="text-[10px] text-white/40 leading-relaxed font-sans">
                  Das Modell berechnet die Standardabweichung (2.0σ Bollinger-Bänder). Bei Ausbruch nach unten wird gekauft, bei Rückkehr zum Mittelwert liquidiert.
                </p>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-white/50">Basis-Periode:</span>
                  <span className="text-aif-gold-DEFAULT font-bold">{params.shortPeriod} Tage</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={params.shortPeriod}
                  onChange={(e) => setParams({ ...params, shortPeriod: Number(e.target.value) })}
                  className="w-full accent-aif-gold-DEFAULT"
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-white/5">
            <div className="flex justify-between text-xs mb-1 font-mono">
              <span className="text-white/50">Gebühren / Slippage:</span>
              <span className="text-white/80 font-bold">{params.transactionCost}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={params.transactionCost}
              onChange={(e) => setParams({ ...params, transactionCost: Number(e.target.value) })}
              className="w-full accent-aif-gold-DEFAULT"
            />
          </div>
        </div>
      </div>

      {/* Error state display */}
      {errorState === 'NO_DATA' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-3 text-red-400">
            <Info className="w-6 h-6 animate-pulse" />
            <span className="text-sm font-bold font-display uppercase tracking-widest">HTTP 503: NO_DATA</span>
          </div>
          <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed">
            Historische Kursdaten für <span className="font-bold text-white font-mono">{ticker}</span> konnten nicht von der Live-API abgerufen werden.
            Backtesting-Simulationen wurden gemäß der No-Demo-Data-Sicherheitsrichtlinie abgebrochen, um unzuverlässige Phantomberechnungen zu verhindern.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setErrorState(null)}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white font-mono text-[10px] rounded-lg transition-all"
            >
              Fehler schließen
            </button>
          </div>
        </div>
      )}

      {/* Loading state bar */}
      {isSimulating && (
        <div className="bg-white/5 border border-white/5 rounded-xl p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-5 h-5 text-aif-gold-DEFAULT animate-spin" />
            <span className="text-sm font-bold font-display">Simulationsdaten werden berechnet...</span>
          </div>
          <div className="max-w-md mx-auto w-full bg-black/60 rounded-full h-2 overflow-hidden border border-white/10">
            <div 
              className="bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 h-full transition-all duration-150"
              style={{ width: `${simulationProgress}%` }}
            />
          </div>
          <p className="text-[11px] text-white/70 font-mono">
            Echtzeit-Stochastic-Generator berechnet Pfade basierend auf historischer Kovarianz...
          </p>
        </div>
      )}

      {/* Results View */}
      {hasSimulated && !isSimulating && (
        <div className="space-y-6">
          
          {/* Key Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative group hover:border-white/20 transition-all">
              <div className="absolute top-3 right-3 text-white/60 font-mono text-[11px]">KPI 1</div>
              <span className="text-[11px] text-white/75 uppercase font-mono block mb-1">Strategie-Endwert</span>
              <div className="text-lg md:text-xl font-bold font-mono text-white flex items-center gap-1">
                {formatCurrency(metrics.finalStrategyValue)}
              </div>
              <span className={`text-xs font-mono font-bold mt-1 inline-flex items-center gap-0.5 ${metrics.strategyReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.strategyReturn >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {metrics.strategyReturn >= 0 ? '+' : ''}{metrics.strategyReturn.toFixed(1)}%
              </span>
            </div>

            {/* KPI 2 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative group hover:border-white/20 transition-all">
              <div className="absolute top-3 right-3 text-white/60 font-mono text-[11px]">KPI 2</div>
              <span className="text-[11px] text-white/75 uppercase font-mono block mb-1">Buy & Hold Endwert</span>
              <div className="text-lg md:text-xl font-bold font-mono text-white/80">
                {formatCurrency(metrics.finalHoldValue)}
              </div>
              <span className={`text-xs font-mono font-bold mt-1 inline-flex items-center gap-0.5 ${metrics.holdReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.holdReturn >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {metrics.holdReturn >= 0 ? '+' : ''}{metrics.holdReturn.toFixed(1)}%
              </span>
            </div>

            {/* KPI 3 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative group hover:border-white/20 transition-all">
              <div className="absolute top-3 right-3 text-white/60 font-mono text-[11px]">KPI 3</div>
              <span className="text-[11px] text-white/75 uppercase font-mono block mb-1">Sharpe Ratio / Max DD</span>
              <div className="text-lg md:text-xl font-bold font-mono text-aif-gold-DEFAULT">
                {metrics.sharpeRatio.toFixed(2)}
              </div>
              <span className="text-[11px] text-rose-400 font-mono font-bold mt-1 block">
                Max DD: -{metrics.maxDrawdown.toFixed(1)}%
              </span>
            </div>

            {/* KPI 4 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 relative group hover:border-white/20 transition-all">
              <div className="absolute top-3 right-3 text-white/60 font-mono text-[11px]">KPI 4</div>
              <span className="text-[11px] text-white/75 uppercase font-mono block mb-1">Trades / Winrate</span>
              <div className="text-lg md:text-xl font-bold font-mono text-white">
                {metrics.totalTrades}
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-bold mt-1 block">
                Trefferquote: {metrics.winRate.toFixed(0)}%
              </span>
            </div>

          </div>

          {/* Performance Comparison Chart */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold font-display text-white">Wachstumsverlauf im Vergleich</h3>
                <p className="text-[11px] text-white/70 font-mono">Entwicklung von {formatCurrency(initialCapital)} über den Zeitraum</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <button
                  onClick={exportPerformanceToCSV}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 hover:text-aif-gold-DEFAULT text-white/75 border border-white/10 hover:border-aif-gold-DEFAULT/30 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Wachstumsverlauf als CSV exportieren"
                >
                  <Download size={12} />
                  <span>Performance Exportieren</span>
                </button>
                <button
                  onClick={() => {
                    if (userEmail) {
                      setShowExportModal(true);
                    } else {
                      exportPerformanceToPDF();
                    }
                  }}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 text-black font-mono font-bold text-[11px] rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,196,83,0.2)] hover:shadow-[0_0_18px_rgba(245,196,83,0.35)]"
                  title="PDF-Bericht herunterladen"
                >
                  <FileText size={12} />
                  <span>PDF-Bericht</span>
                </button>

                <AnimatePresence>
                  {showExportModal && userEmail && (
                    <PdfExportModal 
                      isOpen={showExportModal} 
                      onClose={() => setShowExportModal(false)} 
                      email={userEmail} 
                      onSuccess={exportPerformanceToPDF} 
                    />
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-aif-gold-DEFAULT inline-block" />
                  <span className="text-white/80">Strategie ({metrics.strategyReturn >= 0 ? '+' : ''}{metrics.strategyReturn.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-white/30 inline-block" />
                  <span className="text-white/50">Buy & Hold ({metrics.holdReturn >= 0 ? '+' : ''}{metrics.holdReturn.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5C453" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#F5C453" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#555" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#555" 
                    fontSize={10} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `€${(val/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                    labelStyle={{ color: '#aaa', fontFamily: 'monospace', fontSize: '11px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="strategyValue" 
                    name="Strategie Wert" 
                    stroke="#F5C453" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="holdValue" 
                    name="Buy & Hold" 
                    stroke="#666" 
                    strokeWidth={1.5} 
                    strokeDasharray="4 4"
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

           {/* Trade Execution History */}
          <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-sm font-bold font-display text-white">Transaktions-Protokoll</h3>
                <p className="text-[11px] text-white/70 font-mono">Detaillierter Orderverlauf der simulierten Handelsaktivität</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportTradesToCSV}
                  disabled={trades.length === 0}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 hover:text-aif-gold-DEFAULT text-white/75 border border-white/10 hover:border-aif-gold-DEFAULT/30 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-white disabled:hover:border-white/20 disabled:cursor-not-allowed"
                  title="Trades als CSV exportieren"
                >
                  <Download size={12} />
                  <span>Trades Exportieren</span>
                </button>
                <span className="text-[11px] font-mono font-bold text-white/80 bg-white/5 border border-white/10 px-2 py-1 rounded">
                  Gebühr: {params.transactionCost}% / Trade
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] text-white/70 font-mono uppercase tracking-wider">
                    <th className="py-2">Datum</th>
                    <th className="py-2">Order-Typ</th>
                    <th className="py-2 text-right">Ausführungskurs</th>
                    <th className="py-2 text-right">Anteile</th>
                    <th className="py-2 text-right">Volumen (€)</th>
                    <th className="py-2 text-right">Portfolio-Wert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trades.slice(0, 10).map((trade) => (
                    <tr key={trade.id} className="text-xs font-mono hover:bg-white/5 transition-all">
                      <td className="py-2.5 text-white/60">{trade.date}</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          trade.type === 'BUY' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold">{formatCurrency(trade.price)}</td>
                      <td className="py-2.5 text-right text-white/70">{trade.shares.toLocaleString('de-DE', { maximumFractionDigits: 4 })}</td>
                      <td className="py-2.5 text-right font-bold text-white">{formatCurrency(trade.totalValue)}</td>
                      <td className="py-2.5 text-right text-aif-gold-DEFAULT font-bold">{formatCurrency(trade.cashRemaining + trade.shares * trade.price)}</td>
                    </tr>
                  ))}
                  {trades.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-xs text-white/30 font-mono">
                        Keine Trades während des Simulationszeitraums ausgeführt (Ausschließlich Halten oder keine Crossover-Kriterien getroffen).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {trades.length > 10 && (
              <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[11px] text-white/70 font-mono">
                <span>Zeige 10 von {trades.length} Transaktionen</span>
                <span className="text-aif-gold-DEFAULT">Lade vollständigen Report im Enterprise Dashboard</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )}
</div>
);
}

// Format currency beautifully
function formatCurrency(val: number): string {
  if (val >= 100000) {
    return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  }
  return val.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
}

// Backtest Algorithm Core Execution on Real Historical Close Price Paths
function calculateBacktestOnRealData(
  historicalData: { date: string; close: number }[],
  strategy: 'SMA_CROSS' | 'RSI_MOMENTUM' | 'MEAN_REVERSION',
  params: StrategyParams,
  initialCapital: number
) {
  const chartData: SimResult[] = [];
  const trades: Trade[] = [];
  const days = historicalData.length;
  const prices = historicalData.map(d => d.close);

  let cash = initialCapital;
  let shares = 0;

  // Pre-calculate technical indicators
  const smaShortArr: number[] = [];
  const smaLongArr: number[] = [];
  const rsiArr: number[] = [];

  for (let i = 0; i < days; i++) {
    // Short SMA
    if (i >= params.shortPeriod) {
      const sum = prices.slice(i - params.shortPeriod, i).reduce((a, b) => a + b, 0);
      smaShortArr.push(sum / params.shortPeriod);
    } else {
      smaShortArr.push(prices[i]);
    }

    // Long SMA
    if (i >= params.longPeriod) {
      const sum = prices.slice(i - params.longPeriod, i).reduce((a, b) => a + b, 0);
      smaLongArr.push(sum / params.longPeriod);
    } else {
      smaLongArr.push(prices[i]);
    }

    // RSI calculation
    if (i >= 14) {
      let gains = 0;
      let losses = 0;
      for (let j = i - 14; j < i; j++) {
        const diff = prices[j + 1] - prices[j];
        if (diff > 0) gains += diff;
        else losses -= diff;
      }
      const rs = gains / (losses || 1);
      const rsi = 100 - 100 / (1 + rs);
      rsiArr.push(rsi);
    } else {
      rsiArr.push(50);
    }
  }

  // Simulate Strategy Trading
  let peakValue = initialCapital;
  let maxDrawdown = 0;
  let wonTradesCount = 0;
  let lastBuyPrice = 0;

  for (let i = 0; i < days; i++) {
    const price = prices[i];
    const dateStr = historicalData[i].date;

    const sShort = smaShortArr[i];
    const sLong = smaLongArr[i];
    const rsi = rsiArr[i];

    let buySignal = false;
    let sellSignal = false;

    if (strategy === 'SMA_CROSS') {
      const prevShort = i > 0 ? smaShortArr[i - 1] : sShort;
      const prevLong = i > 0 ? smaLongArr[i - 1] : sLong;
      if (prevShort <= prevLong && sShort > sLong) {
        buySignal = true;
      }
      if (prevShort >= prevLong && sShort < sLong) {
        sellSignal = true;
      }
    } else if (strategy === 'RSI_MOMENTUM') {
      if (rsi < params.rsiOversold) buySignal = true;
      if (rsi > params.rsiOverbought) sellSignal = true;
    } else if (strategy === 'MEAN_REVERSION') {
      if (price < sShort * 0.88) buySignal = true;
      if (price > sShort * 1.05) sellSignal = true;
    }

    // Execute Buy
    if (buySignal && cash > 10) {
      const fee = cash * (params.transactionCost / 100);
      const netCash = cash - fee;
      const purchasedShares = netCash / price;
      
      shares += purchasedShares;
      cash = 0;
      lastBuyPrice = price;

      trades.push({
        id: `T-${i}-${Math.floor(Math.random()*1000)}`,
        date: dateStr,
        type: 'BUY',
        price,
        shares: purchasedShares,
        totalValue: netCash,
        cashRemaining: cash,
      });
    }

    // Execute Sell
    if (sellSignal && shares > 0) {
      const grossValue = shares * price;
      const fee = grossValue * (params.transactionCost / 100);
      const netCashReceived = grossValue - fee;
      
      cash += netCashReceived;
      if (price > lastBuyPrice) {
        wonTradesCount++;
      }

      trades.push({
        id: `T-${i}-${Math.floor(Math.random()*1000)}`,
        date: dateStr,
        type: 'SELL',
        price,
        shares,
        totalValue: grossValue,
        cashRemaining: cash,
      });

      shares = 0;
    }

    // Calculate portfolio values
    const currentPortfolioValue = cash + shares * price;
    const currentHoldValue = (initialCapital / prices[0]) * price;

    if (currentPortfolioValue > peakValue) {
      peakValue = currentPortfolioValue;
    }
    const dd = ((peakValue - currentPortfolioValue) / peakValue) * 100;
    if (dd > maxDrawdown) {
      maxDrawdown = dd;
    }

    // Push chart data periodically
    if (i % Math.max(1, Math.floor(days / 60)) === 0 || i === days - 1) {
      chartData.push({
        date: dateStr,
        price,
        strategyValue: currentPortfolioValue,
        holdValue: currentHoldValue,
        rsi: Math.round(rsi),
        smaShort: Math.round(sShort),
        smaLong: Math.round(sLong),
      });
    }
  }

  // Final values
  const finalStrategyValue = cash + shares * prices[days - 1];
  const finalHoldValue = (initialCapital / prices[0]) * prices[days - 1];
  const strategyReturn = ((finalStrategyValue - initialCapital) / initialCapital) * 100;
  const holdReturn = ((finalHoldValue - initialCapital) / initialCapital) * 100;

  // CAGR calculation
  const years = days / 365 || 1;
  const cagr = (Math.pow(finalStrategyValue / initialCapital, 1 / years) - 1) * 100;

  // Real Sharpe ratio calculation: excess return vs portfolio volatility
  let dailyReturns = [];
  let prevVal = initialCapital;
  for (let i = 0; i < days; i++) {
    const currentVal = prices[i] * shares + (cash || 0);
    const ret = (currentVal - prevVal) / prevVal;
    dailyReturns.push(ret);
    prevVal = currentVal;
  }
  const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
  const stdDev = Math.sqrt(variance) * Math.sqrt(365);
  const sharpeRatio = stdDev > 0 ? (cagr - 2.5) / 100 / stdDev : 0;

  const totalTradesCount = trades.length;
  const completedTrades = trades.filter(t => t.type === 'SELL').length;
  const winRate = completedTrades > 0 ? (wonTradesCount / completedTrades) * 100 : 50;

  return {
    chartData,
    trades,
    metrics: {
      finalStrategyValue,
      finalHoldValue,
      strategyReturn,
      holdReturn,
      cagr,
      maxDrawdown,
      sharpeRatio: Math.max(0, parseFloat(sharpeRatio.toFixed(2))),
      winRate,
      totalTrades: totalTradesCount,
    }
  };
}
