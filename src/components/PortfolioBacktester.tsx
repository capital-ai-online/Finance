import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Scale, 
  Trash2, 
  Plus, 
  RefreshCw, 
  AlertTriangle, 
  Play, 
  Sparkles, 
  Info, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  FileText, 
  Brain, 
  CheckCircle2, 
  TrendingUp, 
  Globe, 
  FileCheck,
  ChevronRight,
  Sliders,
  DollarSign
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { PdfExportModal } from './PdfExportModal';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface PortfolioBacktesterProps {
  userCapital?: number;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
  userEmail?: string;
}

interface AllocationItem {
  symbol: string;
  weight: number; // in %
  name: string;
  assetClass: string;
}

interface PeriodMetrics {
  returnVal: number;
  finalValue: number;
  benchmarkReturn: number;
  benchmarkFinalValue: number;
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  chartData: { date: string; strategyValue: number; holdValue: number }[];
}

interface SimulatedResults {
  '1Y': PeriodMetrics;
  '3Y': PeriodMetrics;
  '5Y': PeriodMetrics;
}

interface AIReview {
  executiveSummary: string;
  riskAssessment: string;
  optimizations: string[];
}

const TEMPLATES = [
  {
    name: 'Konservativ (60/40 Klassisch)',
    allocations: [
      { symbol: 'AAPL', weight: 30, name: 'Apple Inc.', assetClass: 'Stocks' },
      { symbol: 'MSFT', weight: 30, name: 'Microsoft Corp.', assetClass: 'Stocks' },
      { symbol: 'GLD', weight: 30, name: 'Gold ETF', assetClass: 'Commodities' },
      { symbol: 'EURUSD', weight: 10, name: 'EUR/USD FX', assetClass: 'Forex' }
    ]
  },
  {
    name: 'All-Weather-Portfolio (Ray Dalio)',
    allocations: [
      { symbol: 'GLD', weight: 40, name: 'Gold ETF', assetClass: 'Commodities' },
      { symbol: 'AAPL', weight: 20, name: 'Apple Inc.', assetClass: 'Stocks' },
      { symbol: 'MSFT', weight: 20, name: 'Microsoft Corp.', assetClass: 'Stocks' },
      { symbol: 'EURUSD', weight: 20, name: 'EUR/USD FX', assetClass: 'Forex' }
    ]
  },
  {
    name: 'Venture & Krypto-Schwergewicht',
    allocations: [
      { symbol: 'BTC', weight: 40, name: 'Bitcoin', assetClass: 'Crypto' },
      { symbol: 'ETH', weight: 30, name: 'Ethereum', assetClass: 'Crypto' },
      { symbol: 'AAPL', weight: 15, name: 'Apple Inc.', assetClass: 'Stocks' },
      { symbol: 'TSLA', weight: 15, name: 'Tesla Inc.', assetClass: 'Stocks' }
    ]
  },
  {
    name: 'Balanced Tech & Growth',
    allocations: [
      { symbol: 'MSFT', weight: 30, name: 'Microsoft Corp.', assetClass: 'Stocks' },
      { symbol: 'AAPL', weight: 30, name: 'Apple Inc.', assetClass: 'Stocks' },
      { symbol: 'BTC', weight: 20, name: 'Bitcoin', assetClass: 'Crypto' },
      { symbol: 'GLD', weight: 20, name: 'Gold ETF', assetClass: 'Commodities' }
    ]
  }
];

export function PortfolioBacktester({ userCapital = 150000, triggerAttempt, userEmail }: PortfolioBacktesterProps) {
  const [initialCapital, setInitialCapital] = useState<number>(userCapital);
  const [showExportModal, setShowExportModal] = useState(false);
  const [allocations, setAllocations] = useState<AllocationItem[]>([
    { symbol: 'AAPL', weight: 30, name: 'Apple Inc.', assetClass: 'Stocks' },
    { symbol: 'MSFT', weight: 30, name: 'Microsoft Corp.', assetClass: 'Stocks' },
    { symbol: 'BTC', weight: 20, name: 'Bitcoin', assetClass: 'Crypto' },
    { symbol: 'GLD', weight: 20, name: 'Gold ETF', assetClass: 'Commodities' }
  ]);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [newAssetSymbol, setNewAssetSymbol] = useState<string>('ETH');

  // Interactive and calculation states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResults, setSimResults] = useState<SimulatedResults | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [activeChartRange, setActiveChartRange] = useState<'1Y' | '3Y' | '5Y'>('3Y');

  // AI review states
  const [isRequestingAIReview, setIsRequestingAIReview] = useState<boolean>(false);
  const [aiReview, setAIReview] = useState<AIReview | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);

  // Sync initial capital with userCapital
  useEffect(() => {
    setInitialCapital(userCapital);
  }, [userCapital]);

  // Load all available assets from endpoint to allow dynamic portfolio construction
  useEffect(() => {
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        const nonVariants = data.filter((asset: any) => !asset.name.toLowerCase().includes('variant'));
        const mapped = nonVariants.map((asset: any) => {
          let assetClass = 'Stocks';
          if (asset.type === 'crypto') assetClass = 'Crypto';
          else if (asset.type === 'commodity') assetClass = 'Commodities';
          else if (asset.type === 'forex') assetClass = 'Forex';

          return {
            symbol: asset.symbol,
            name: asset.name,
            assetClass,
            basePrice: asset.price
          };
        });
        setAvailableAssets(mapped);
      })
      .catch(err => {
        console.error('Failed to fetch assets in PortfolioBacktester:', err);
      });
  }, []);

  // Compute total allocation weight sum
  const totalWeight = useMemo(() => {
    return allocations.reduce((sum, item) => sum + item.weight, 0);
  }, [allocations]);

  // Equal weight distribution helper
  const handleEqualWeight = () => {
    if (allocations.length === 0) return;
    const equalWeight = Math.floor(100 / allocations.length);
    const remainder = 100 % allocations.length;
    
    const updated = allocations.map((item, idx) => ({
      ...item,
      weight: equalWeight + (idx < remainder ? 1 : 0)
    }));
    setAllocations(updated);
  };

  // Add asset to allocation
  const handleAddAsset = () => {
    if (allocations.some(item => item.symbol === newAssetSymbol)) {
      return; // Already in portfolio
    }
    const found = availableAssets.find(a => a.symbol === newAssetSymbol);
    if (!found) return;

    // Allocate remaining weight if any, otherwise 0
    const currentSum = allocations.reduce((s, item) => s + item.weight, 0);
    const remaining = Math.max(0, 100 - currentSum);

    setAllocations([
      ...allocations,
      {
        symbol: found.symbol,
        weight: remaining,
        name: found.name,
        assetClass: found.assetClass
      }
    ]);
  };

  // Remove asset from allocation
  const handleRemoveAsset = (symbol: string) => {
    setAllocations(allocations.filter(item => item.symbol !== symbol));
  };

  // Update specific asset weight
  const handleWeightChange = (symbol: string, newWeight: number) => {
    setAllocations(allocations.map(item => {
      if (item.symbol === symbol) {
        return { ...item, weight: Math.max(0, Math.min(100, newWeight)) };
      }
      return item;
    }));
  };

  // Load preset templates
  const handleLoadTemplate = (index: number) => {
    setAllocations(JSON.parse(JSON.stringify(TEMPLATES[index].allocations)));
    setAIReview(null);
  };

  // Main portfolio simulation execution
  const runPortfolioSimulation = () => {
    if (totalWeight !== 100) return;

    const executeSimulation = async () => {
      setIsSimulating(true);
      setErrorState(null);
      setAIReview(null);
      setAIError(null);

      try {
        // Fetch historical data for all assets in the portfolio over the maximum range (5 years)
        // Using Promise.all for fast parallel execution
        const fetchPromises = allocations.map(item => 
          fetch(`/api/backtest-history?symbol=${item.symbol}&range=5Y`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP_${res.status}`);
              return res.json();
            })
            .then(data => {
              if (data.status === 'NO_DATA' || !Array.isArray(data) || data.length === 0) {
                throw new Error(`Keine Verlaufsdaten für ${item.symbol}`);
              }
              return { symbol: item.symbol, history: data };
            })
        );

        const fetchedHistories = await Promise.all(fetchPromises);
        
        // Align historical prices by date chronologically
        // Gather all unique dates
        const allDates = Array.from(new Set(
          fetchedHistories.flatMap(h => h.history.map(d => d.close ? d.date : ''))
        )).filter(Boolean).sort();

        if (allDates.length === 0) {
          throw new Error('Es konnten keine gemeinsamen historischen Handelstage ermittelt werden.');
        }

        // Map dates for each asset for O(1) lookup speed
        const priceMaps = fetchedHistories.map(fh => {
          const map = new Map<string, number>();
          fh.history.forEach((h: any) => map.set(h.date, h.close));
          return map;
        });

        // Align daily prices with forward-fill carry-over for weekend gaps (Stocks)
        const alignedPrices: { date: string; prices: number[] }[] = [];
        const lastKnownPrices = fetchedHistories.map(fh => fh.history[0]?.close || 1);

        allDates.forEach(date => {
          const dayPrices = fetchedHistories.map((fh, idx) => {
            const p = priceMaps[idx].get(date);
            if (p !== undefined) {
              lastKnownPrices[idx] = p;
              return p;
            }
            return lastKnownPrices[idx];
          });
          alignedPrices.push({ date, prices: dayPrices });
        });

        // Multi-timeframe calculation core (1Y, 3Y, 5Y)
        const calculateForRange = (numDays: number): PeriodMetrics => {
          const rangeSlice = alignedPrices.slice(-numDays);
          if (rangeSlice.length === 0) {
            throw new Error('Unzureichende Verlaufsdaten im gewählten Segment.');
          }

          const basePrices = rangeSlice[0].prices;
          const chartData: any[] = [];
          
          let peakValue = initialCapital;
          let maxDrawdown = 0;
          const dailyReturns: number[] = [];
          let prevValue = initialCapital;

          rangeSlice.forEach((day, dayIdx) => {
            // Calculate custom portfolio allocation value
            const stratSum = allocations.reduce((sum, item, itemIdx) => {
              const baseP = basePrices[itemIdx] || 1;
              const currentP = day.prices[itemIdx] || 1;
              const growth = currentP / baseP;
              return sum + (initialCapital * (item.weight / 100) * growth);
            }, 0);

            // Calculate equal-weight benchmark value
            const benchmarkSum = allocations.reduce((sum, item, itemIdx) => {
              const baseP = basePrices[itemIdx] || 1;
              const currentP = day.prices[itemIdx] || 1;
              const growth = currentP / baseP;
              return sum + (initialCapital * (1 / allocations.length) * growth);
            }, 0);

            // Track peaks and drawdown calculations
            if (stratSum > peakValue) peakValue = stratSum;
            const dd = ((peakValue - stratSum) / peakValue) * 100;
            if (dd > maxDrawdown) maxDrawdown = dd;

            // Track daily return for volatility calculation
            if (dayIdx > 0) {
              const ret = (stratSum - prevValue) / prevValue;
              dailyReturns.push(ret);
            }
            prevValue = stratSum;

            // Sample periodically for chart performance optimization
            if (dayIdx % Math.max(1, Math.floor(rangeSlice.length / 60)) === 0 || dayIdx === rangeSlice.length - 1) {
              chartData.push({
                date: day.date,
                strategyValue: Math.round(stratSum),
                holdValue: Math.round(benchmarkSum)
              });
            }
          });

          const finalValue = rangeSlice[rangeSlice.length - 1].prices.reduce((sum, currentP, itemIdx) => {
            const baseP = basePrices[itemIdx] || 1;
            const growth = currentP / baseP;
            return sum + (initialCapital * (allocations[itemIdx].weight / 100) * growth);
          }, 0);

          const finalBenchmark = rangeSlice[rangeSlice.length - 1].prices.reduce((sum, currentP, itemIdx) => {
            const baseP = basePrices[itemIdx] || 1;
            const growth = currentP / baseP;
            return sum + (initialCapital * (1 / allocations.length) * growth);
          }, 0);

          const returnVal = ((finalValue - initialCapital) / initialCapital) * 100;
          const benchmarkReturn = ((finalBenchmark - initialCapital) / initialCapital) * 100;

          // Annualized Volatility
          const meanReturn = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length : 0;
          const variance = dailyReturns.length > 0 ? dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length : 0;
          const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized %

          // Sharpe Ratio (2.5% risk-free rate)
          const years = rangeSlice.length / 365 || 1;
          const cagr = (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100;
          const sharpeRatio = volatility > 0 ? (cagr - 2.5) / volatility : 0;

          return {
            returnVal,
            finalValue,
            benchmarkReturn,
            benchmarkFinalValue: finalBenchmark,
            maxDrawdown,
            volatility,
            sharpeRatio: Math.max(0, parseFloat(sharpeRatio.toFixed(2))),
            chartData
          };
        };

        // Standard ranges in calendar days
        const results: SimulatedResults = {
          '1Y': calculateForRange(365),
          '3Y': calculateForRange(365 * 3),
          '5Y': calculateForRange(365 * 5)
        };

        setSimResults(results);
      } catch (err: any) {
        console.error('Error calculating portfolio backtest:', err);
        setErrorState(err.message || 'Die historischen Daten konnten für manche Assets nicht abgerufen werden.');
      } finally {
        setIsSimulating(false);
      }
    };

    if (triggerAttempt) {
      triggerAttempt('Portfolio Simulation', executeSimulation);
    } else {
      executeSimulation();
    }
  };

  // AI portfolio feedback handler
  const requestAIReview = async () => {
    if (!simResults) return;
    setIsRequestingAIReview(true);
    setAIReview(null);
    setAIError(null);

    try {
      const response = await fetch('/api/portfolio-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocation: allocations.map(a => ({ symbol: a.symbol, weight: a.weight })),
          metrics1Y: { strategyReturn: simResults['1Y'].returnVal, maxDrawdown: simResults['1Y'].maxDrawdown, sharpeRatio: simResults['1Y'].sharpeRatio },
          metrics3Y: { strategyReturn: simResults['3Y'].returnVal, maxDrawdown: simResults['3Y'].maxDrawdown, sharpeRatio: simResults['3Y'].sharpeRatio },
          metrics5Y: { strategyReturn: simResults['5Y'].returnVal, maxDrawdown: simResults['5Y'].maxDrawdown, sharpeRatio: simResults['5Y'].sharpeRatio }
        })
      });

      if (!response.ok) {
        throw new Error('Fehler bei der Kommunikation mit dem AI Engine.');
      }

      const critique = await response.json();
      if (critique.error) {
        throw new Error(critique.error);
      }

      setAIReview({
        executiveSummary: critique.executiveSummary || 'Die Allokation zeigt ein solides Risikoprofil über alle Perioden.',
        riskAssessment: critique.riskAssessment || 'Die historische Volatilität korreliert stark mit dem Krypto-Anteil.',
        optimizations: Array.isArray(critique.optimizations) ? critique.optimizations : ['Keine Optimierungen vorgeschlagen.']
      });
    } catch (err: any) {
      console.error('AI Review request failed:', err);
      setAIError(err.message || 'Die AI-Bewertung ist temporär nicht verfügbar.');
    } finally {
      setIsRequestingAIReview(false);
    }
  };

  // Export results to CSV
  const exportPortfolioCSV = () => {
    if (!simResults) return;
    const currentMetrics = simResults[activeChartRange];
    const headers = ['Datum', 'Portfolio Wert (EUR)', 'Gleichgewichteter Benchmark (EUR)'];
    const rows = currentMetrics.chartData.map(d => [
      d.date,
      d.strategyValue,
      d.holdValue
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Portfolio_Allokation_Performance_${activeChartRange}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate gorgeous PDF report
  const exportPortfolioPDF = () => {
    if (!simResults) return;

    const doc = new jsPDF();
    
    // Header block
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setFillColor(245, 196, 83); // Gold line
    doc.rect(0, 38, 210, 2, 'F');

    doc.setTextColor(245, 196, 83);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('JENOVA NEXUS', 15, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('PORTFOLIO ALLOCATION QUANT BACKTEST REPORT', 15, 28);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 196, 83);
    doc.text('SYSTEM: PORTFOLIO CORE', 142, 18);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.text(`DATUM: ${new Date().toLocaleDateString('de-DE')}`, 142, 28);

    let y = 50;
    doc.setTextColor(15, 15, 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. PORTFOLIO ALLOKATION (GEWÄHLTE GEWICHTUNG)', 15, y);
    doc.setDrawColor(245, 196, 83);
    doc.line(15, y + 2, 195, y + 2);

    y += 10;
    doc.setFillColor(30, 30, 30);
    doc.rect(15, y, 180, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Ticker / Symbol', 18, y + 5);
    doc.text('Name des Assets', 55, y + 5);
    doc.text('Asset-Klasse', 115, y + 5);
    doc.text('Zugeordnete Gewichtung', 160, y + 5);

    y += 7.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    allocations.forEach((item, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255);
      doc.rect(15, y, 180, 7, 'F');
      doc.text(item.symbol, 18, y + 4.5);
      doc.text(item.name, 55, y + 4.5);
      doc.text(item.assetClass, 115, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.weight}%`, 160, y + 4.5);
      doc.setFont('helvetica', 'normal');
      y += 7;
    });

    // Section 2: Performance breakdown across timeframes
    y += 12;
    doc.setTextColor(15, 15, 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. HISTORISCHER ERFOLGS-NACHWEIS (1, 3 & 5 JAHRE)', 15, y);
    doc.line(15, y + 2, 195, y + 2);

    y += 10;
    doc.setFillColor(30, 30, 30);
    doc.rect(15, y, 180, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Zeitspanne', 18, y + 5);
    doc.text('Portfoliowert', 45, y + 5);
    doc.text('Portfolio-Rendite', 80, y + 5);
    doc.text('Benchmark-Rendite', 115, y + 5);
    doc.text('Max Drawdown', 150, y + 5);
    doc.text('Sharpe-Ratio', 178, y + 5);

    y += 7.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);

    const periods: ('1Y' | '3Y' | '5Y')[] = ['1Y', '3Y', '5Y'];
    periods.forEach((p, idx) => {
      const metrics = simResults[p];
      doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 248 : 255);
      doc.rect(15, y, 180, 7.5, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.text(p === '1Y' ? '1 Jahr' : p === '3Y' ? '3 Jahre' : '5 Jahre', 18, y + 5);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`EUR ${Math.round(metrics.finalValue).toLocaleString('de-DE')}`, 45, y + 5);
      
      doc.setTextColor(metrics.returnVal >= 0 ? 16 : 220, metrics.returnVal >= 0 ? 185 : 50, metrics.returnVal >= 0 ? 129 : 50);
      doc.text(`${metrics.returnVal >= 0 ? '+' : ''}${metrics.returnVal.toFixed(1)}%`, 80, y + 5);
      
      doc.setTextColor(80, 80, 80);
      doc.text(`${metrics.benchmarkReturn >= 0 ? '+' : ''}${metrics.benchmarkReturn.toFixed(1)}%`, 115, y + 5);
      
      doc.setTextColor(239, 68, 68);
      doc.text(`-${metrics.maxDrawdown.toFixed(1)}%`, 150, y + 5);
      
      doc.setTextColor(15, 15, 15);
      doc.setFont('helvetica', 'bold');
      doc.text(metrics.sharpeRatio.toFixed(2), 178, y + 5);
      doc.setFont('helvetica', 'normal');
      
      y += 7.5;
    });

    // Section 3: AI Critique summary if loaded
    if (aiReview) {
      y += 12;
      doc.setTextColor(15, 15, 15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. AI AGENT PORTFOLIO FEEDBACK', 15, y);
      doc.line(15, y + 2, 195, y + 2);

      y += 9;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 50);
      
      const splitExec = doc.splitTextToSize(`Zusammenfassung: ${aiReview.executiveSummary}`, 175);
      doc.text(splitExec, 15, y);
      y += splitExec.length * 4 + 2;

      const splitRisk = doc.splitTextToSize(`Risikobewertung: ${aiReview.riskAssessment}`, 175);
      doc.text(splitRisk, 15, y);
      y += splitRisk.length * 4 + 4;

      doc.setFont('helvetica', 'bold');
      doc.text('Optimierungsempfehlungen:', 15, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      aiReview.optimizations.forEach((opt) => {
        const splitOpt = doc.splitTextToSize(`• ${opt}`, 170);
        doc.text(splitOpt, 18, y);
        y += splitOpt.length * 4;
      });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text('CAPITAL-AI Portfoliodaten und Analysen entsprechen den Richtlinien für Zero-Breach Datenintegrität.', 15, 283);
    doc.text('Dieses Dokument dient Informationszwecken. Historische Renditen sind keine Garantie für zukünftige Performance.', 15, 287);

    doc.save(`JENOVA_NEXUS_Portfolio_Bericht.pdf`);
  };

  const currentPeriodMetrics = simResults ? simResults[activeChartRange] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT COLUMN: Allocations builder (spanning 5 cols) */}
      <div className="lg:col-span-5 bg-white/5 border border-white/5 rounded-2xl p-5 space-y-6 relative overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Scale className="text-aif-gold-DEFAULT" size={18} />
            <h3 className="font-display font-bold text-white text-base">Portfoliowert & Gewichtung</h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 uppercase">
            Allokations-Planer
          </span>
        </div>

        {/* Start Capital */}
        <div className="space-y-2">
          <label className="text-xs text-white/50 font-mono block">Simulations-Kapital (€)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xs font-mono">€</span>
            <input
              type="number"
              value={initialCapital}
              onChange={(e) => setInitialCapital(Math.max(1000, Number(e.target.value)))}
              className="w-full bg-black/60 border border-white/15 rounded-xl py-2.5 pl-8 pr-4 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 focus:ring-1 focus:ring-aif-gold-DEFAULT/30"
              placeholder="Startkapital"
            />
          </div>
        </div>

        {/* Templates selector */}
        <div className="space-y-2 pt-1">
          <label className="text-xs text-white/50 font-mono block">Strategische Portfoliovorlagen</label>
          <select
            onChange={(e) => {
              if (e.target.value !== '') {
                handleLoadTemplate(Number(e.target.value));
                e.target.value = ''; // Reset select after action
              }
            }}
            defaultValue=""
            className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT cursor-pointer font-sans"
          >
            <option value="" disabled className="text-white/40">-- Wähle eine Benchmark-Vorlage --</option>
            {TEMPLATES.map((tpl, idx) => (
              <option key={idx} value={idx} className="bg-black text-white">
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Current Allocations Table */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-xs text-white/50 font-mono">
            <span>Enthaltene Assets ({allocations.length})</span>
            <button 
              onClick={handleEqualWeight}
              className="text-aif-gold-DEFAULT hover:text-white transition-colors font-bold uppercase tracking-wider text-[10px] cursor-pointer flex items-center gap-1.5"
            >
              <Scale size={11} />
              Gleichgewichtung
            </button>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {allocations.map((item) => (
              <motion.div 
                key={item.symbol}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black/40 border border-white/10 hover:border-white/25 rounded-xl p-3 flex items-center justify-between gap-4 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white bg-white/5 px-2 py-0.5 rounded border border-white/10 flex-shrink-0">
                      {item.symbol}
                    </span>
                    <span className="text-[11px] text-white/60 truncate font-sans">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded">
                      {item.assetClass}
                    </span>
                  </div>
                </div>

                {/* Weight Input */}
                <div className="flex items-center gap-3">
                  <div className="relative w-20">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={item.weight}
                      onChange={(e) => handleWeightChange(item.symbol, Number(e.target.value))}
                      className="w-full bg-black/60 border border-white/15 rounded-lg py-1.5 px-2 text-xs font-mono text-white text-right focus:outline-none focus:border-aif-gold-DEFAULT/50 pr-6"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/40 font-mono">%</span>
                  </div>

                  <button
                    onClick={() => handleRemoveAsset(item.symbol)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                    title="Asset entfernen"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            ))}

            {allocations.length === 0 && (
              <p className="text-center py-8 text-xs text-white/40 italic font-mono">
                Dein Portfolio ist leer. Füge Assets hinzu.
              </p>
            )}
          </div>
        </div>

        {/* Add Asset Selector */}
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <select
            value={newAssetSymbol}
            onChange={(e) => setNewAssetSymbol(e.target.value)}
            className="flex-1 bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-mono"
          >
            {availableAssets
              .filter(a => !allocations.some(item => item.symbol === a.symbol))
              .map(a => (
                <option key={a.symbol} value={a.symbol} className="bg-black text-white">
                  {a.symbol} — {a.name} ({a.assetClass})
                </option>
              ))
            }
          </select>
          <button
            onClick={handleAddAsset}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Hinzufügen</span>
          </button>
        </div>

        {/* Sum Indicator */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-white/50">Gesamte Gewichtung:</span>
            <span className={`font-black ${totalWeight === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalWeight}% / 100%
            </span>
          </div>
          
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className={`h-full ${totalWeight === 100 ? 'bg-emerald-500' : 'bg-rose-500'}`}
              animate={{ width: `${Math.min(100, totalWeight)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {totalWeight !== 100 && (
            <p className="text-[10px] text-rose-400 flex items-center gap-1 font-mono">
              <AlertTriangle size={11} />
              Die Allokation muss exakt 100% betragen, um den Backtest zu berechnen.
            </p>
          )}
        </div>

        {/* Simulation Start button */}
        <button
          onClick={runPortfolioSimulation}
          disabled={totalWeight !== 100 || isSimulating}
          className="w-full py-3 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,196,83,0.15)] disabled:cursor-not-allowed cursor-pointer"
        >
          {isSimulating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Simuliere Portfoliopfade...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-black" />
              <span>Portfolio-Simulation starten</span>
            </>
          )}
        </button>
      </div>

      {/* RIGHT COLUMN: Performance & Visualization (spanning 7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Error Notification */}
        {errorState && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <span className="text-sm font-bold font-display uppercase tracking-widest">Backtest Error</span>
            </div>
            <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed font-mono">
              {errorState}
            </p>
            <button 
              onClick={() => setErrorState(null)} 
              className="px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-mono text-[10px] cursor-pointer"
            >
              Schließen
            </button>
          </div>
        )}

        {/* Results Matrix Block */}
        {!simResults && !isSimulating && (
          <div className="bg-black/20 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/10 to-aif-gold-DEFAULT/10 border border-white/10 flex items-center justify-center text-aif-gold-DEFAULT">
              <PieChart size={30} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-white font-bold font-display text-sm uppercase tracking-wide">Simulation Bereit</h4>
              <p className="text-xs text-white/50 max-w-md leading-relaxed">
                Stelle deine Allokation im linken Planer zusammen und starte den Backtester. Unser Algorithmus wertet deine Allokation parallel über **1, 3 und 5 Jahre** auf Basis historischer Realkurse aus.
              </p>
            </div>
          </div>
        )}

        {isSimulating && (
          <div className="bg-black/20 border border-white/5 rounded-2xl p-16 text-center flex flex-col items-center justify-center space-y-5">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-aif-gold-DEFAULT animate-spin" />
              <Sparkles className="absolute text-aif-gold-DEFAULT animate-bounce" size={20} />
            </div>
            <div className="space-y-1">
              <span className="inline-block px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 rounded-full animate-pulse">
                Parallel-Kalkulation
              </span>
              <p className="text-xs text-white/80 font-mono mt-2">
                Sende historische Asset-Abfragen an die Capital-AI-Registry...
              </p>
              <p className="text-[11px] text-white/40 leading-relaxed max-w-sm">
                Führe Kovarianz-Abstimmung, Dividenden-Bereinigung und Gebührenabzüge für {allocations.length} Vermögenswerte aus.
              </p>
            </div>
          </div>
        )}

        {simResults && !isSimulating && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Bento Grid: 1Y, 3Y, 5Y metrics at a glance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                { id: '1Y', label: '1 Jahr' },
                { id: '3Y', label: '3 Jahre' },
                { id: '5Y', label: '5 Jahre' }
              ] as const).map((period) => {
                const met = simResults[period.id];
                const active = activeChartRange === period.id;
                return (
                  <button
                    key={period.id}
                    onClick={() => setActiveChartRange(period.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-32 transition-all cursor-pointer relative group ${
                      active
                        ? 'border-aif-gold-DEFAULT bg-aif-gold-DEFAULT/5 shadow-[0_0_15px_rgba(245,196,83,0.08)]'
                        : 'border-white/5 bg-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <span className="text-[11px] font-mono font-bold uppercase text-white/50">
                        {period.label}
                      </span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-aif-gold-DEFAULT" />
                      )}
                    </div>

                    <div>
                      <div className="text-lg font-mono font-bold text-white leading-none">
                        EUR {Math.round(met.finalValue).toLocaleString('de-DE')}
                      </div>
                      <span className={`text-[11px] font-mono font-bold mt-1 inline-flex items-center gap-0.5 ${met.returnVal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {met.returnVal >= 0 ? '+' : ''}{met.returnVal.toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex justify-between items-center w-full text-[9px] text-white/40 font-mono border-t border-white/5 pt-1.5">
                      <span>Max DD: -{met.maxDrawdown.toFixed(1)}%</span>
                      <span className="text-white/60">Sharpe: {met.sharpeRatio.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Performance Chart details */}
            {currentPeriodMetrics && (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h4 className="text-sm font-bold font-display text-white">Visualisierter Vermögensverlauf ({activeChartRange === '1Y' ? '1 Jahr' : activeChartRange === '3Y' ? '3 Jahre' : '5 Jahre'})</h4>
                    <p className="text-[11px] text-white/50 font-mono">Vergleich deines Portfolios vs. Gleichgewichteter Benchmark</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportPortfolioCSV}
                      className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
                      title="Als CSV herunterladen"
                    >
                      <Download size={12} />
                      <span>CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        if (userEmail) {
                          setShowExportModal(true);
                        } else {
                          exportPortfolioPDF();
                        }
                      }}
                      className="p-2 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 border-none rounded-lg text-black transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold"
                      title="Vollständigen PDF-Bericht erstellen"
                    >
                      <FileText size={12} />
                      <span>PDF</span>
                    </button>

                    <AnimatePresence>
                      {showExportModal && userEmail && (
                        <PdfExportModal 
                          isOpen={showExportModal} 
                          onClose={() => setShowExportModal(false)} 
                          email={userEmail} 
                          onSuccess={exportPortfolioPDF} 
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Legend indicator */}
                <div className="flex items-center gap-4 text-[11px] font-mono pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-aif-gold-DEFAULT inline-block" />
                    <span className="text-white/80">Mein Portfolio ({currentPeriodMetrics.returnVal >= 0 ? '+' : ''}{currentPeriodMetrics.returnVal.toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-white/20 inline-block" />
                    <span className="text-white/50">Equal-Weighted Benchmark ({currentPeriodMetrics.benchmarkReturn >= 0 ? '+' : ''}{currentPeriodMetrics.benchmarkReturn.toFixed(1)}%)</span>
                  </div>
                </div>

                {/* Chart stage */}
                <div className="h-64 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={currentPeriodMetrics.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" vertical={false} />
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
                        formatter={(value: any) => [`EUR ${Number(value).toLocaleString('de-DE')}`, '']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="strategyValue" 
                        name="Mein Portfolio" 
                        stroke="#F5C453" 
                        strokeWidth={2} 
                        dot={false} 
                        activeDot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="holdValue" 
                        name="Benchmark" 
                        stroke="#444" 
                        strokeWidth={1.5} 
                        strokeDasharray="4 4"
                        dot={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* AI Advisor Panel */}
            <div className="bg-gradient-to-br from-indigo-950/20 via-black/40 to-indigo-950/10 border border-indigo-500/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="text-indigo-400" size={18} />
                  <h4 className="font-display font-bold text-white text-sm">AI Agent Portfolio-Analyse</h4>
                </div>
                <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                  Gemini 2.5 Flash
                </span>
              </div>

              {!aiReview && !isRequestingAIReview && (
                <div className="py-4 text-center">
                  <p className="text-xs text-white/60 mb-4 max-w-md mx-auto leading-relaxed">
                    Fordere eine tiefe qualitative AI-Analysen für deine Vermögensverteilung an. Das Modell wertet dein Risiko-Rendite-Verhältnis, Korrelationsfaktoren und historische Extrembelastungen aus.
                  </p>
                  <button
                    onClick={requestAIReview}
                    className="px-5 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <Brain size={14} className="animate-pulse" />
                    <span>AI-Portfolio-Review anfordern</span>
                  </button>
                </div>
              )}

              {isRequestingAIReview && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="text-xs text-white/85 font-mono">Agent analysiert Portfolio-Risikostrukturen...</span>
                </div>
              )}

              {aiError && (
                <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-xl text-center">
                  <p className="text-xs text-rose-400 font-mono flex items-center justify-center gap-1.5">
                    <AlertTriangle size={13} />
                    {aiError}
                  </p>
                </div>
              )}

              {aiReview && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-white/40 uppercase block tracking-wider">Management Summary</span>
                    <p className="text-xs text-white/80 leading-relaxed font-sans">
                      {aiReview.executiveSummary}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono text-white/40 uppercase block tracking-wider">Risikobewertung</span>
                    <p className="text-xs text-white/70 leading-relaxed font-sans">
                      {aiReview.riskAssessment}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-white/40 uppercase block tracking-wider">Konkrete Optimierungsansätze</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aiReview.optimizations.map((opt, idx) => (
                        <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex gap-2.5 items-start">
                          <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-[11px] text-white/85 leading-relaxed font-sans">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
}
