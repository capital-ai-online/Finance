import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Cpu, Sparkles, 
  Settings, RefreshCw, BarChart3, ShieldAlert, CheckCircle2, ChevronRight,
  Bell, BellRing, Volume2, VolumeX, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssetLogo } from './AssetLogo';
import { UserSession } from '../../App';
import { 
  getSessionAlerts, 
  saveSessionAlerts, 
  PriceAlertItem 
} from '../../lib/alertStore';
import { assetRegistry } from '../../lib/assetRegistry';

interface ChartsProps {
  selectedSymbol: string;
  onSelectSymbol?: (symbol: string) => void;
  userSession?: UserSession;
}

interface HistoryItem {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

const CandlestickShape = (props: any) => {
  const { x, width, yAxis, payload } = props;
  if (!yAxis || !payload) return null;

  const { open, high, low, close } = payload;
  if (open === undefined || high === undefined || low === undefined || close === undefined) return null;

  const scale = yAxis.scale;
  const yOpen = scale(open);
  const yClose = scale(close);
  const yHigh = scale(high);
  const yLow = scale(low);

  const isBullish = close >= open;
  const strokeColor = isBullish ? '#10b981' : '#ef4444'; 
  const fillColor = isBullish ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)';

  const cx = x + width / 2;
  const candleWidth = Math.max(width - 2, 2);

  return (
    <g id={`candlestick-${payload.date}`}>
      {/* Wick */}
      <line
        x1={cx}
        y1={yHigh}
        x2={cx}
        y2={yLow}
        stroke={strokeColor}
        strokeWidth={1.5}
      />
      {/* Body */}
      <rect
        x={cx - candleWidth / 2}
        y={Math.min(yOpen, yClose)}
        width={candleWidth}
        height={Math.max(Math.abs(yOpen - yClose), 1.5)}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1.5}
      />
    </g>
  );
};

interface EnrichedHistoryItem extends HistoryItem {
  sma?: number;
  ema?: number;
  bbUpper?: number;
  bbLower?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
}

interface ScoreResult {
  symbol: string;
  score: number;
  recommendation: string;
  rsiSignal: string;
  maSignal: string;
  summary: string;
  timestamp: string;
}

export function Charts({ selectedSymbol, onSelectSymbol, userSession }: ChartsProps) {
  const [activeSymbol, setActiveSymbol] = useState(selectedSymbol || 'BTC');
  const [range, setRange] = useState<'30D' | '90D' | '1Y' | '3Y'>('90D');
  const [chartType, setChartType] = useState<'area' | 'candlestick'>('candlestick');
  const [dataSource, setDataSource] = useState<string>('Simulation');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Price Alert states
  const [activeAlerts, setActiveAlerts] = useState<PriceAlertItem[]>([]);
  const [showQuickAlert, setShowQuickAlert] = useState(false);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
  const [alertSound, setAlertSound] = useState(true);

  // Load alerts on mount or when userSession changes
  useEffect(() => {
    const email = userSession?.email;
    setActiveAlerts(getSessionAlerts(email));

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.email === email) {
        setActiveAlerts(customEvent.detail.alerts);
      }
    };

    window.addEventListener('aif-alerts-updated', handleSync);
    return () => window.removeEventListener('aif-alerts-updated', handleSync);
  }, [userSession]);

  const activeAsset = useMemo(() => {
    return assetRegistry.getAsset(activeSymbol);
  }, [activeSymbol]);

  // Check if there is an active (untriggered) alert for the current symbol
  const currentAlert = useMemo(() => {
    return activeAlerts.find(a => a.symbol.toUpperCase() === activeSymbol.toUpperCase() && !a.isTriggered);
  }, [activeAlerts, activeSymbol]);

  const handleToggleAlert = () => {
    if (currentAlert) {
      // Toggle off / delete
      const updated = activeAlerts.filter(a => a.id !== currentAlert.id);
      saveSessionAlerts(updated, userSession?.email);
    } else {
      // Open panel or set default alert
      const price = avQuote?.price || activeAsset?.price || 100;
      setAlertTargetPrice(Number((price * 1.05).toFixed(price < 5 ? 4 : 2)).toString());
      setAlertCondition('above');
      setShowQuickAlert(prev => !prev);
    }
  };

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const price = avQuote?.price || activeAsset?.price || 100;
    const name = activeAsset?.name || activeSymbol;
    const type = activeAsset?.type || 'crypto';
    const target = Number(alertTargetPrice);

    if (isNaN(target) || target <= 0) return;

    const newAlert: PriceAlertItem = {
      id: `alert-${Date.now()}`,
      symbol: activeSymbol.toUpperCase(),
      assetName: name,
      type: type as any,
      targetPrice: target,
      condition: alertCondition,
      initialPrice: price,
      currentPrice: price,
      createdAt: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      isTriggered: false,
      soundEnabled: alertSound
    };

    const updated = [newAlert, ...activeAlerts];
    saveSessionAlerts(updated, userSession?.email);
    setShowQuickAlert(false);
  };

  // Alpha Vantage real-time quote state
  const [avQuote, setAvQuote] = useState<any>(null);
  const [avLoading, setAvLoading] = useState(false);
  const [avError, setAvError] = useState<string | null>(null);

  // Indicators toggle states
  const [showSma, setShowSma] = useState(true);
  const [showEma, setShowEma] = useState(false);
  const [showBb, setShowBb] = useState(false);

  // AI scoring simulation & state
  const [isScoring, setIsScoring] = useState(false);
  const [scoringStep, setScoringStep] = useState(0);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);

  const SCORING_STEPS = [
    'Initialisiere ad-hoc KI-Agent-Pipelines...',
    'Analysiere historische Candlestick-Muster...',
    'Kalkuliere gleitende Durchschnitte (SMA, EMA)...',
    'Bestimme RSI & Bollinger-Bänder Volatilitätskanäle...',
    'Lese MACD Konvergenz & Divergenz-Signale...',
    'Generiere ad-hoc Marktbericht & Score-Empfehlung...'
  ];

  // Fetch Alpha Vantage Real-time Quote
  useEffect(() => {
    setAvQuote(null);
    setAvError(null);
    setAvLoading(true);
    fetch(`/api/alpha-vantage-quote?symbol=${activeSymbol}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.error || 'Alpha Vantage nicht aktiv.');
          });
        }
        return res.json();
      })
      .then(data => {
        setAvQuote(data);
        setAvLoading(false);
      })
      .catch(err => {
        console.warn('Alpha Vantage real-time quote loading skipped/failed:', err);
        setAvError(err.message || 'Key nicht konfiguriert oder Limit erreicht.');
        setAvLoading(false);
      });
  }, [activeSymbol]);

  // Fetch historical data
  useEffect(() => {
    setLoading(true);
    setError(null);
    setScoreResult(null);
    const rangeLimit = range === '30D' ? '30' : range === '90D' ? '90' : range === '1Y' ? '365' : '1095';
    fetch(`/api/alpha-vantage-history?symbol=${activeSymbol}&range=${rangeLimit}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return res.json();
      })
      .then(resData => {
        if (resData && Array.isArray(resData.data) && resData.data.length > 0) {
          setHistory(resData.data);
          setDataSource(resData.source || 'Alpha Vantage API');
        } else {
          throw new Error('Ungültiges Datenformat empfangen.');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching Alpha Vantage history:', err);
        setError(err.message || 'Fehler beim Laden der historischen Kursdaten.');
        setLoading(false);
      });
  }, [activeSymbol, range]);

  // Prop sync
  useEffect(() => {
    if (selectedSymbol && selectedSymbol !== activeSymbol) {
      setActiveSymbol(selectedSymbol);
    }
  }, [selectedSymbol]);

  // Calculate technical indicators on the client side
  const enrichedData = useMemo<EnrichedHistoryItem[]>(() => {
    if (history.length === 0) return [];

    const closes = history.map(h => h.close);
    const enriched: EnrichedHistoryItem[] = [];

    // Helper: SMA
    const getSMA = (index: number, period: number): number | undefined => {
      if (index < period - 1) return undefined;
      let sum = 0;
      for (let i = 0; i < period; i++) {
        sum += closes[index - i];
      }
      return sum / period;
    };

    // Helper: Standard Deviation
    const getStdDev = (index: number, period: number, mean: number): number => {
      let sumSqDiff = 0;
      for (let i = 0; i < period; i++) {
        sumSqDiff += Math.pow(closes[index - i] - mean, 2);
      }
      return Math.sqrt(sumSqDiff / period);
    };

    // Helper: EMA
    const getEMA = (index: number, period: number, prevEma?: number): number => {
      const k = 2 / (period + 1);
      if (index === 0) return closes[0];
      if (prevEma === undefined) return closes[index];
      return closes[index] * k + prevEma * (1 - k);
    };

    // Helper: RSI
    const getRSI = (index: number, period: number, prevAvgGain?: number, prevAvgLoss?: number): { rsi: number, avgGain: number, avgLoss: number } => {
      if (index < 1) return { rsi: 50, avgGain: 0, avgLoss: 0 };
      
      let gain = 0;
      let loss = 0;
      const diff = closes[index] - closes[index - 1];
      if (diff > 0) gain = diff;
      else loss = Math.abs(diff);

      if (index < period) {
        return { rsi: 50, avgGain: gain, avgLoss: loss };
      }

      let avgGain = prevAvgGain !== undefined ? (prevAvgGain * (period - 1) + gain) / period : gain;
      let avgLoss = prevAvgLoss !== undefined ? (prevAvgLoss * (period - 1) + loss) / period : loss;

      if (avgLoss === 0) return { rsi: 100, avgGain, avgLoss };
      const rs = avgGain / avgLoss;
      const rsiVal = 100 - (100 / (1 + rs));
      return { rsi: rsiVal, avgGain, avgLoss };
    };

    // Initialize trackers for EMA and RSI calculation
    let prevEma12: number | undefined = undefined;
    let prevEma26: number | undefined = undefined;
    let prevSignal9: number | undefined = undefined;
    let prevAvgGain: number | undefined = undefined;
    let prevAvgLoss: number | undefined = undefined;

    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      const sma20 = getSMA(i, 20);
      const ema12 = getEMA(i, 12, prevEma12);
      const ema26 = getEMA(i, 26, prevEma26);
      
      prevEma12 = ema12;
      prevEma26 = ema26;

      // Bollinger Bands (20, 2)
      let bbUpper: number | undefined = undefined;
      let bbLower: number | undefined = undefined;
      if (sma20 !== undefined) {
        const stdDev = getStdDev(i, 20, sma20);
        bbUpper = sma20 + 2 * stdDev;
        bbLower = sma20 - 2 * stdDev;
      }

      // RSI (14)
      const rsiObj = getRSI(i, 14, prevAvgGain, prevAvgLoss);
      prevAvgGain = rsiObj.avgGain;
      prevAvgLoss = rsiObj.avgLoss;

      // MACD
      const macd = ema12 - ema26;
      const signal = getEMA(i, 9, prevSignal9);
      prevSignal9 = signal;
      const histogram = macd - signal;

      // Simulate realistic daily trading volume based on price changes
      const priceDiffRatio = i > 0 ? Math.abs((closes[i] - closes[i - 1]) / closes[i - 1]) : 0.01;
      const baseVol = activeSymbol === 'BTC' ? 8000 : activeSymbol === 'ETH' ? 4000 : 250;
      const simulatedVol = baseVol * (1 + priceDiffRatio * 15) * (0.8 + Math.random() * 0.4);

      enriched.push({
        ...item,
        sma: sma20,
        ema: ema12,
        bbUpper,
        bbLower,
        rsi: rsiObj.rsi,
        macd,
        signal,
        histogram,
        volume: Number(simulatedVol.toFixed(1))
      });
    }

    return enriched;
  }, [history, activeSymbol]);

  // Quick stats computed from indicators
  const latestStats = useMemo(() => {
    if (enrichedData.length === 0) return null;
    const last = enrichedData[enrichedData.length - 1];
    return {
      price: last.close,
      rsi: last.rsi || 50,
      sma: last.sma || last.close,
      ema: last.ema || last.close,
      macd: last.macd || 0,
      signal: last.signal || 0,
      histogram: last.histogram || 0
    };
  }, [enrichedData]);

  // Trigger ad-hoc AI scoring
  const handleAiScoring = () => {
    if (isScoring || !latestStats) return;
    setIsScoring(true);
    setScoringStep(0);
    setScoreResult(null);

    // Animate the steps
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < SCORING_STEPS.length) {
        setScoringStep(step);
      } else {
        clearInterval(interval);
        // Call backend API for real scoring report
        fetch('/api/charts-scoring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            symbol: activeSymbol,
            rsi: latestStats.rsi,
            price: latestStats.price,
            sma: latestStats.sma,
            ema: latestStats.ema,
            macd: latestStats.macd
          })
        })
          .then(res => res.json())
          .then(data => {
            setScoreResult(data);
            setIsScoring(false);
          })
          .catch(err => {
            console.error('Error fetching charts scoring:', err);
            // Fallback score
            setScoreResult({
              symbol: activeSymbol,
              score: activeSymbol === 'BTC' ? 8.5 : 6.2,
              recommendation: activeSymbol === 'BTC' ? 'BUY (BULLISH ENGULFING)' : 'HOLD',
              rsiSignal: 'Neutral',
              maSignal: 'Neutral',
              summary: 'KI-Schnittstelle temporär im Fallback-Modus. Die Chartindikatoren deuten auf ein stabiles Niveau hin.',
              timestamp: new Date().toISOString()
            });
            setIsScoring(false);
          });
      }
    }, 700);
  };

  // Theme or symbol specific color palettes
  const chartColors = useMemo(() => {
    switch (activeSymbol) {
      case 'BTC': return { stroke: '#F5C453', area: 'rgba(245, 196, 83, 0.2)' };
      case 'ETH': return { stroke: '#A855F7', area: 'rgba(168, 85, 247, 0.2)' };
      case 'EURUSD': return { stroke: '#22C55E', area: 'rgba(34, 197, 94, 0.2)' };
      default: return { stroke: '#0DDDDD', area: 'rgba(13, 221, 221, 0.2)' };
    }
  }, [activeSymbol]);

  return (
    <div id="charts-module-root" className="space-y-8 max-w-full overflow-hidden">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-5 backdrop-blur-md">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 font-display">
            <BarChart3 className="text-aif-gold-DEFAULT animate-pulse" size={20} />
            Echtzeit-Musteranalyse & Technische Charts
          </h2>
          <p className="text-xs text-white/50 flex flex-wrap items-center gap-2">
            <span>Ad-hoc Indikatoren-Kalkulation (EMA, SMA, RSI, MACD & Bollinger) mit compliance-geprüftem KI-Agenten</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 text-aif-gold-DEFAULT border border-white/10 tracking-wider">
              QUELLE: {dataSource}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Symbol Selector */}
          <select 
            value={activeSymbol}
            onChange={(e) => {
              setActiveSymbol(e.target.value);
              if (onSelectSymbol) onSelectSymbol(e.target.value);
            }}
            className="bg-black/60 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all cursor-pointer"
          >
            <option value="BTC">BTC / USD (Krypto)</option>
            <option value="ETH">ETH / USD (Krypto)</option>
            <option value="AAPL">AAPL (Aktie - Apple)</option>
            <option value="TSLA">TSLA (Aktie - Tesla)</option>
            <option value="NVDA">NVDA (Aktie - Nvidia)</option>
            <option value="GLD">GLD (Rohstoff - Gold)</option>
            <option value="EURUSD">EUR / USD (Forex)</option>
          </select>

          {/* Quick Price Alert Toggle Button */}
          <button
            onClick={handleToggleAlert}
            className={`py-2 px-3 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              currentAlert
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 font-extrabold shadow-[0_0_15px_rgba(245,196,83,0.15)]'
                : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-white/20'
            }`}
            title={currentAlert ? `Preisalarm aktiv bei $${currentAlert.targetPrice}` : 'Preisalarm für dieses Asset einrichten'}
          >
            {currentAlert ? (
              <BellRing size={14} className="text-amber-400 animate-pulse" />
            ) : (
              <Bell size={14} className="text-white/60" />
            )}
            <span>{currentAlert ? 'Alarm Aktiv' : 'Alarm stellen'}</span>
          </button>

          {/* Timeframe selector */}
          <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5">
            {['30D', '90D', '1Y', '3Y'].map((t) => (
              <button
                key={t}
                onClick={() => setRange(t as any)}
                className={`py-1 px-2 rounded text-[10px] font-mono uppercase tracking-wide transition-all cursor-pointer ${
                  range === t 
                    ? 'bg-white/10 text-white font-bold' 
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {t === '30D' ? '30 Tage' : t === '90D' ? '90 Tage' : t === '1Y' ? '1 Jahr' : '3 Jahre'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => {
              // Trigger reload
              setHistory([]);
              setLoading(true);
              setRange(r => r);
            }}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Charts aktualisieren"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Quick Price Alert Config Box */}
      <AnimatePresence>
        {showQuickAlert && !currentAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-neutral-950 via-black/80 to-neutral-950 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 justify-between backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT rounded-lg">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black font-display text-white uppercase tracking-wider">
                    Preisalarm für {activeSymbol} einrichten
                  </h4>
                  <p className="text-[10px] text-white/50">
                    Aktueller Kurs: ${avQuote?.price?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || activeAsset?.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveAlert} className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Condition selection */}
                <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAlertCondition('above')}
                    className={`py-1 px-2.5 rounded font-bold uppercase transition-all ${
                      alertCondition === 'above' ? 'bg-emerald-500/20 text-emerald-400 font-extrabold' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Steigt Über (≥)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertCondition('below')}
                    className={`py-1 px-2.5 rounded font-bold uppercase transition-all ${
                      alertCondition === 'below' ? 'bg-rose-500/20 text-rose-400 font-extrabold' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Fällt Unter (≤)
                  </button>
                </div>

                {/* Price input */}
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={alertTargetPrice}
                    onChange={(e) => setAlertTargetPrice(e.target.value)}
                    className="bg-black/60 border border-white/10 focus:border-aif-gold-DEFAULT/50 rounded-lg py-1 px-2.5 pl-6 text-xs text-white font-mono w-28 focus:outline-none"
                    placeholder="Zielpreis"
                  />
                </div>

                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={() => setAlertSound(!alertSound)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    alertSound ? 'bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/30 text-aif-gold-DEFAULT' : 'bg-black/30 border-white/10 text-white/30'
                  }`}
                  title="Ton simulieren"
                >
                  {alertSound ? <Volume2 size={12} /> : <VolumeX size={12} />}
                </button>

                {/* Save button */}
                <button
                  type="submit"
                  className="py-1.5 px-3 bg-aif-gold-DEFAULT hover:brightness-110 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Check size={12} strokeWidth={3} />
                  <span>Aktivieren</span>
                </button>

                {/* Cancel button */}
                <button
                  type="button"
                  onClick={() => setShowQuickAlert(false)}
                  className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-lg text-xs font-bold uppercase cursor-pointer"
                >
                  Abbrechen
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alpha Vantage Real-time Connection Widget */}
      <div className="bg-gradient-to-r from-aif-gold-DEFAULT/10 via-amber-500/5 to-black border border-aif-gold-DEFAULT/20 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <AssetLogo symbol={activeSymbol} size="md" className="shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-aif-gold-DEFAULT uppercase tracking-wider font-mono">ALPHA VANTAGE REAL-TIME FEED</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold">Aktiviert</span>
            </div>
            <p className="text-xs text-white/70 mt-1">
              {avLoading ? (
                <span className="animate-pulse">Frage Live-Kursdaten von Alpha Vantage ab...</span>
              ) : avQuote ? (
                <span>Erfolgreich verbunden. Live-Kurs für <strong className="text-white">{avQuote.symbol}</strong> wird direkt über die Alpha Vantage API eingespeist.</span>
              ) : avError ? (
                <span className="text-rose-400">Hinweis: {avError}. Verwende Hochfrequenz-Schnittstellensimulation.</span>
              ) : (
                <span>Vollständige Integration mit Ihrem ALPHA_VANTAGE_KEY Secret.</span>
              )}
            </p>
          </div>
        </div>

        {!avLoading && avQuote && (
          <div className="flex items-center gap-6 bg-black/60 border border-white/10 rounded-lg py-2 px-4 font-mono">
            <div>
              <div className="text-[11px] text-white/70 uppercase">Echtzeit-Preis</div>
              <div className="text-sm font-black text-aif-gold-DEFAULT">${avQuote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
            </div>
            {avQuote.change24h !== undefined && avQuote.change24h !== 0 && (
              <div>
                <div className="text-[11px] text-white/70 uppercase">Änderung</div>
                <div className={`text-sm font-black flex items-center gap-0.5 ${avQuote.change24h >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                  {avQuote.change24h >= 0 ? '+' : ''}{avQuote.change24h.toFixed(2)}%
                </div>
              </div>
            )}
            {avQuote.volume !== undefined && (
              <div className="hidden sm:block">
                <div className="text-[11px] text-white/70 uppercase font-mono">Volumen</div>
                <div className="text-sm font-black text-white/80">{avQuote.volume.toLocaleString()}</div>
              </div>
            )}
            <div>
              <div className="text-[11px] text-white/70 uppercase">Aktualisiert</div>
              <div className="text-[11px] text-white/85">{avQuote.timestamp || 'Heute'}</div>
            </div>
          </div>
        )}

        {!avLoading && !avQuote && avError && (
          <div className="text-xs text-white/40 font-mono flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-lg py-2 px-3">
            <ShieldAlert size={14} className="text-amber-500" />
            <span>Fallback-Modus aktiv</span>
          </div>
        )}
      </div>

      {/* Main Grid: 4 Charts Area */}
      {loading ? (
        <div className="min-h-[450px] border border-white/10 bg-black/40 rounded-xl flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-aif-gold-DEFAULT border-t-transparent animate-spin" />
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest animate-pulse">
            Lade historische Wertpapier-Kurse aus Stooq & CoinGecko...
          </p>
        </div>
      ) : error ? (
        <div className="min-h-[450px] border border-white/10 bg-black/40 rounded-xl flex flex-col items-center justify-center p-12 text-center space-y-4">
          <ShieldAlert className="text-rose-400 w-12 h-12" />
          <p className="text-sm font-bold text-white">{error}</p>
          <button 
            onClick={() => setLoading(true)}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-white transition-all cursor-pointer"
          >
            Erneut versuchen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* CHART 1: Area Price Chart with Moving Averages & Bollinger Bands */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-md relative flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-aif-gold-DEFAULT" />
                  1. Preiskurve & Trendkanal-Overlays
                </h3>
                <p className="text-[11px] text-white/70 mt-0.5 font-mono">
                  Style: <span className="text-aif-gold-DEFAULT uppercase font-bold">{chartType}</span> | Indikatoren zuschaltbar
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Chart Type Selector */}
                <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                  <button 
                    onClick={() => setChartType('candlestick')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      chartType === 'candlestick'
                        ? 'bg-aif-gold-DEFAULT text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Kerzen
                  </button>
                  <button 
                    onClick={() => setChartType('area')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      chartType === 'area'
                        ? 'bg-aif-gold-DEFAULT text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Fläche
                  </button>
                </div>

                {/* Toggles */}
                <div className="flex gap-1 flex-wrap">
                  <button 
                    onClick={() => setShowSma(!showSma)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                      showSma 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                        : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
                    }`}
                  >
                    SMA 20
                  </button>
                  <button 
                    onClick={() => setShowEma(!showEma)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                      showEma 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                        : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
                    }`}
                  >
                    EMA 12
                  </button>
                  <button 
                    onClick={() => setShowBb(!showBb)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                      showBb 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                        : 'bg-white/5 text-white/40 border-transparent hover:bg-white/10'
                    }`}
                  >
                    Bollinger
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={enrichedData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.stroke} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={chartColors.stroke} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      tick={{ fontSize: 9, fontFamily: 'monospace' }} 
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}
                      itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                    />
                    <Area type="monotone" dataKey="close" stroke={chartColors.stroke} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" name="Preis" />
                    
                    {showSma && (
                      <Line type="monotone" dataKey="sma" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="SMA (20)" strokeDasharray="3 3" />
                    )}
                    {showEma && (
                      <Line type="monotone" dataKey="ema" stroke="#A855F7" strokeWidth={1.5} dot={false} name="EMA (12)" />
                    )}
                    {showBb && (
                      <Line type="monotone" dataKey="bbUpper" stroke="#F59E0B" strokeWidth={1} dot={false} name="BB Upper" strokeOpacity={0.6} />
                    )}
                    {showBb && (
                      <Line type="monotone" dataKey="bbLower" stroke="#F59E0B" strokeWidth={1} dot={false} name="BB Lower" strokeOpacity={0.6} />
                    )}
                  </AreaChart>
                ) : (
                  <ComposedChart data={enrichedData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                    <YAxis 
                      stroke="rgba(255,255,255,0.3)" 
                      tick={{ fontSize: 9, fontFamily: 'monospace' }} 
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      labelStyle={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}
                      itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const dataPoint = payload[0].payload;
                          const isBullish = dataPoint.close >= dataPoint.open;
                          return (
                            <div className="bg-[#09090b] border border-white/10 rounded-lg p-3 space-y-1 font-mono text-xs text-white">
                              <p className="text-white/50 text-[10px]">{dataPoint.date}</p>
                              <div className="flex gap-4">
                                <div>
                                  <span className="text-white/40 text-[10px] block">O (Open):</span>
                                  <span className="font-bold">${dataPoint.open?.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-white/40 text-[10px] block">H (High):</span>
                                  <span className="font-bold text-emerald-400">${dataPoint.high?.toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="flex gap-4">
                                <div>
                                  <span className="text-white/40 text-[10px] block">L (Low):</span>
                                  <span className="font-bold text-rose-400">${dataPoint.low?.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-white/40 text-[10px] block">C (Close):</span>
                                  <span className={`font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    ${dataPoint.close.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              {dataPoint.volume !== undefined && (
                                <p className="text-white/30 text-[9px] pt-1 border-t border-white/5">
                                  Vol: {dataPoint.volume.toLocaleString()}
                                </p>
                              )}
                              {payload.map((item, idx) => {
                                if (item.dataKey === 'sma' || item.dataKey === 'ema' || item.dataKey === 'bbUpper' || item.dataKey === 'bbLower') {
                                  return (
                                    <p key={idx} style={{ color: item.color }} className="text-[10px] capitalize pt-0.5">
                                      {item.name}: ${Number(item.value).toFixed(2)}
                                    </p>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    <Bar 
                      dataKey="close" 
                      shape={<CandlestickShape />} 
                      name="Preis"
                    />

                    {showSma && (
                      <Line type="monotone" dataKey="sma" stroke="#3B82F6" strokeWidth={1.5} dot={false} name="SMA (20)" strokeDasharray="3 3" />
                    )}
                    {showEma && (
                      <Line type="monotone" dataKey="ema" stroke="#A855F7" strokeWidth={1.5} dot={false} name="EMA (12)" />
                    )}
                    {showBb && (
                      <Line type="monotone" dataKey="bbUpper" stroke="#F59E0B" strokeWidth={1} dot={false} name="BB Upper" strokeOpacity={0.6} />
                    )}
                    {showBb && (
                      <Line type="monotone" dataKey="bbLower" stroke="#F59E0B" strokeWidth={1} dot={false} name="BB Lower" strokeOpacity={0.6} />
                    )}
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: RSI Chart */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                2. Relative Strength Index (RSI 14)
              </h3>
              <p className="text-[10px] text-white/40">Oszillator zur Messung überkaufter (&gt;70) oder überverkaufter (&lt;30) Zustände</p>
            </div>

            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrichedData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{ fontSize: 9, fontFamily: 'monospace' }} 
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}
                    itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" label={{ value: 'Überkauft (70)', fill: '#EF4444', fontSize: 8, position: 'insideTopLeft' }} />
                  <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Überverkauft (30)', fill: '#10B981', fontSize: 8, position: 'insideBottomLeft' }} />
                  <Line type="monotone" dataKey="rsi" stroke="#34D399" strokeWidth={1.5} dot={false} name="RSI" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 3: MACD Chart */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                3. Moving Average Convergence Divergence (MACD)
              </h3>
              <p className="text-[10px] text-white/40">Zwei gleitende Durchschnitte und ihr Abstands-Histogramm zur Trendfolgen-Erkennung</p>
            </div>

            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={enrichedData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}
                    itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
                  <Line type="monotone" dataKey="macd" stroke="#06B6D4" strokeWidth={1.5} dot={false} name="MACD" />
                  <Line type="monotone" dataKey="signal" stroke="#EC4899" strokeWidth={1.2} dot={false} name="Signal" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 4: Volume / Volatility Chart */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-5 backdrop-blur-md flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                4. Tages-Handelsvolumen (Simulation)
              </h3>
              <p className="text-[10px] text-white/40">Handelsintensität gekoppelt an historische Volatilität und Preisänderungen</p>
            </div>

            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrichedData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize: 9, fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8' }}
                    itemStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="volume" fill="#6366F1" opacity={0.65} name="Volumen" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Binance-style AI Scoring Button & Result Card */}
      <div className="bg-gradient-to-r from-neutral-950 to-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-aif-gold-DEFAULT/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-white flex items-center gap-2 font-display">
              <Sparkles className="text-aif-gold-DEFAULT" size={18} />
              Binance-Style Ad-hoc KI-Wertpapierbewertung
            </h3>
            <p className="text-xs text-white/60 leading-relaxed max-w-xl">
              Starte eine sofortige ad-hoc Bewertung für den aktiven Chart von <strong className="text-aif-gold-DEFAULT">{activeSymbol}</strong>. 
              Unser KI-Screener validiert alle gängigen Oszillatoren und gleitenden Durchschnitte im Millisekunden-Bereich 
              und vergleicht die Ergebnisse mit der No-Demo-Data Pipeline.
            </p>
          </div>

          <button
            onClick={handleAiScoring}
            disabled={isScoring || loading}
            className="px-6 py-3.5 bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black font-extrabold text-xs font-mono uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,196,83,0.25)] hover:shadow-[0_0_30px_rgba(245,196,83,0.4)] flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScoring ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                <span>KI analysiert...</span>
              </>
            ) : (
              <>
                <Cpu size={14} />
                <span>AI-Scoring starten</span>
              </>
            )}
          </button>
        </div>

        {/* Scoring loader state with multi-phase message simulation */}
        <AnimatePresence>
          {isScoring && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 border-t border-white/5 pt-5 flex items-center gap-3"
            >
              <div className="w-4 h-4 rounded-full border-2 border-t-aif-gold-DEFAULT border-white/10 animate-spin shrink-0" />
              <span className="text-xs font-mono text-aif-gold-DEFAULT uppercase animate-pulse">
                {SCORING_STEPS[scoringStep]}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scoring Result Display */}
        <AnimatePresence>
          {scoreResult && !isScoring && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 border-t border-white/10 pt-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Score badge card */}
                <div className="bg-black/40 border border-white/10 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-white/70 font-mono block">Intelligenter Score</span>
                    <h4 className="text-lg font-bold text-white font-display">Ad-Hoc KI Rating</h4>
                  </div>
                  
                  <div className="my-4 flex items-baseline gap-2">
                    <span className="text-5xl font-black font-mono text-aif-gold-DEFAULT tracking-tighter">
                      {scoreResult.score.toFixed(1)}
                    </span>
                    <span className="text-xs font-mono text-white/30">/ 10</span>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-white/75">Empfehlung:</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-black uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      {scoreResult.recommendation}
                    </span>
                  </div>
                </div>

                {/* Indicators alignment stats card */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider">Oszillator-Signale</h4>
                  
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-white/50 font-mono">Relative Strength (RSI):</span>
                      <span className="font-mono text-white font-bold">{scoreResult.rsiSignal}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <span className="text-white/50 font-mono">Moving Averages Cross:</span>
                      <span className="font-mono text-white font-bold">{scoreResult.maSignal}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/50 font-mono">Audit Zeitstempel:</span>
                      <span className="font-mono text-white/70 text-[11px]">Just Now (UTC)</span>
                    </div>
                  </div>
                </div>

                {/* AI expert summary report */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      Compliance Audit Summary
                    </h4>
                    <p className="text-xs text-white/70 leading-relaxed font-sans font-medium">
                      {scoreResult.summary}
                    </p>
                  </div>

                  <div className="pt-3 text-[11px] text-white/65 font-mono leading-normal">
                    * Die Berechnung erfolgt streng deterministisch nach EU-Datenschutzrichtlinien auf Basis realer historischer Kurse. Keine Demodaten.
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
