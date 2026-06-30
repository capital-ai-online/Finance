import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, 
  TrendingDown, 
  Sliders, 
  HelpCircle, 
  Download, 
  RefreshCw, 
  Briefcase, 
  PieChart, 
  Activity, 
  Plus, 
  Trash2, 
  Info, 
  Coins, 
  Flame, 
  CheckCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Asset } from '../types';
import { jsPDF } from 'jspdf';

interface RealTimeRiskAssessmentProps {
  userCapital: number;
  selectedSymbol?: string;
  onSelectSymbol?: (symbol: string) => void;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
}

interface Holding {
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'commodity' | 'forex';
  weight: number; // percentage (0 to 100)
  price: number;
}

export function RealTimeRiskAssessment({ 
  userCapital, 
  selectedSymbol, 
  onSelectSymbol,
  triggerAttempt 
}: RealTimeRiskAssessmentProps) {
  // Config state
  const [portfolioValue, setPortfolioValue] = useState<number>(userCapital || 150000);
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95); // 90%, 95%, 99%
  const [holdingPeriod, setHoldingPeriod] = useState<number>(1); // days
  const [calcMethod, setCalcMethod] = useState<'parametric' | 'historical' | 'montecarlo'>('parametric');
  
  // Market data & Holdings
  const [marketAssets, setMarketAssets] = useState<Asset[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddMenu, setShowAddMenu] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);

  // Chart ref
  const chartSvgRef = useRef<SVGSVGElement | null>(null);

  // Asset class default annual volatilities
  const assetVolatilities: Record<string, number> = {
    crypto: 0.70,     // 70% annual volatility
    stock: 0.22,      // 22% annual volatility
    commodity: 0.15,  // 15% annual volatility
    forex: 0.08,      // 8% annual volatility
  };

  // Correlation rules
  const getCorrelation = (type1: string, type2: string): number => {
    if (type1 === type2) {
      if (type1 === 'crypto') return 0.65;
      if (type1 === 'stock') return 0.40;
      return 0.30;
    }
    // Cross asset correlations
    if (type1 === 'crypto' && type2 === 'stock' || type1 === 'stock' && type2 === 'crypto') return 0.18;
    if (type1 === 'commodity' && (type2 === 'stock' || type2 === 'crypto')) {
      // Commodities like Gold are often hedges
      return -0.05;
    }
    return 0.10;
  };

  // Fetch market assets and initialize holdings
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/market-data')
      .then(res => res.json())
      .then((data: Asset[]) => {
        if (data && Array.isArray(data)) {
          setMarketAssets(data);
          
          // Set standard portfolio holdings: 40% BTC, 30% ETH, 20% NVDA / AAPL, 10% GLD / Commodities
          const initialHoldings: Holding[] = [];
          
          const btc = data.find(a => a.symbol === 'BTC');
          const eth = data.find(a => a.symbol === 'ETH');
          const stock = data.find(a => a.type === 'stock') || data.find(a => a.symbol === 'AAPL');
          const gold = data.find(a => a.type === 'commodity') || data.find(a => a.symbol === 'GOLD');

          if (btc) initialHoldings.push({ symbol: btc.symbol, name: btc.name, type: btc.type, weight: 40, price: btc.price });
          if (eth) initialHoldings.push({ symbol: eth.symbol, name: eth.name, type: eth.type, weight: 30, price: eth.price });
          if (stock) initialHoldings.push({ symbol: stock.symbol, name: stock.name, type: stock.type, weight: 20, price: stock.price });
          if (gold) initialHoldings.push({ symbol: gold.symbol, name: gold.name, type: gold.type, weight: 10, price: gold.price });

          // Fallback if empty
          if (initialHoldings.length === 0 && data.length > 0) {
            initialHoldings.push({
              symbol: data[0].symbol,
              name: data[0].name,
              type: data[0].type,
              weight: 100,
              price: data[0].price
            });
          }

          setHoldings(initialHoldings);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load asset list for Risk Engine:', err);
        setIsLoading(false);
      });
  }, []);

  // Sync portfolioValue with external userCapital changes if userCapital is adjusted
  useEffect(() => {
    if (userCapital) {
      setPortfolioValue(userCapital);
    }
  }, [userCapital]);

  // Recalculate weights to always sum to 100%
  const normalizeWeights = (currentHoldings: Holding[]) => {
    const total = currentHoldings.reduce((sum, h) => sum + h.weight, 0);
    if (total === 0) return currentHoldings;
    return currentHoldings.map(h => ({
      ...h,
      weight: Math.round((h.weight / total) * 10000) / 100
    }));
  };

  const handleUpdateWeight = (symbol: string, newWeight: number) => {
    const updated = holdings.map(h => {
      if (h.symbol === symbol) {
        return { ...h, weight: Math.max(0, newWeight) };
      }
      return h;
    });
    setHoldings(updated);
  };

  const handleRemoveHolding = (symbol: string) => {
    const filtered = holdings.filter(h => h.symbol !== symbol);
    setHoldings(normalizeWeights(filtered));
  };

  const handleAddHolding = (asset: Asset) => {
    if (holdings.some(h => h.symbol === asset.symbol)) return;
    
    // Add with 10% weight, others will be normalized
    const newHolding: Holding = {
      symbol: asset.symbol,
      name: asset.name,
      type: asset.type,
      weight: 10,
      price: asset.price
    };
    
    setHoldings(normalizeWeights([...holdings, newHolding]));
    setShowAddMenu(false);
    setSearchQuery('');
  };

  const handleAutoRebalance = () => {
    // Distribute equally
    if (holdings.length === 0) return;
    const equalWeight = 100 / holdings.length;
    const updated = holdings.map(h => ({ ...h, weight: parseFloat(equalWeight.toFixed(2)) }));
    setHoldings(updated);
  };

  // RISK CALCULATIONS ENGINE
  const riskMetrics = useMemo(() => {
    if (holdings.length === 0) {
      return {
        portfolioVol: 0,
        varAmount: 0,
        varPct: 0,
        cvarAmount: 0,
        cvarPct: 0,
        diversificationBenefit: 0,
        assetsRiskContributions: [] as { symbol: string; weight: number; riskContribution: number; standaloneVol: number }[],
        zScore: 0,
        simulatedReturns: [] as number[],
        stressTestImpacts: {} as Record<string, number>
      };
    }

    // Total weights sanity check
    const totalWeight = holdings.reduce((sum, h) => sum + h.weight, 0);
    const normalizedWeights = holdings.map(h => h.weight / (totalWeight || 100));

    // Get Z-score based on confidence level
    // 90% -> 1.282, 95% -> 1.645, 99% -> 2.326
    let zScore = 1.645;
    if (confidenceLevel === 0.90) zScore = 1.282;
    if (confidenceLevel === 0.99) zScore = 2.326;

    // Get daily volatilities
    const dailyVols = holdings.map(h => {
      const annualVol = assetVolatilities[h.type] || 0.20;
      return annualVol / Math.sqrt(252); // Trading days in a year
    });

    // Compute portfolio volatility (sigma_p) using Covariance Matrix
    // Variance = Double sum (w_i * w_j * cov_ij)
    let portfolioVariance = 0;
    const n = holdings.length;

    // Standalone VaRs to compute Diversification benefit later
    let sumStandaloneVaR = 0;

    for (let i = 0; i < n; i++) {
      const w_i = normalizedWeights[i];
      const vol_i = dailyVols[i];
      
      // Standalone VaR for asset
      const assetStandaloneDailyVaR = portfolioValue * w_i * zScore * vol_i * Math.sqrt(holdingPeriod);
      sumStandaloneVaR += assetStandaloneDailyVaR;

      for (let j = 0; j < n; j++) {
        const w_j = normalizedWeights[j];
        const vol_j = dailyVols[j];
        const corr_ij = i === j ? 1.0 : getCorrelation(holdings[i].type, holdings[j].type);
        const cov_ij = vol_i * vol_j * corr_ij;

        portfolioVariance += w_i * w_j * cov_ij;
      }
    }

    const portfolioVolDaily = Math.sqrt(portfolioVariance);
    const portfolioVolPeriod = portfolioVolDaily * Math.sqrt(holdingPeriod);
    const portfolioVolAnnualized = portfolioVolDaily * Math.sqrt(252);

    // 1. Parametric VaR
    const parametricVaRPct = portfolioVolPeriod * zScore;
    const parametricVaRAmount = portfolioValue * parametricVaRPct;

    // 2. Historical Simulation Bootstrapping (realistic return paths based on asset statistics)
    const simCount = 1000;
    const simulatedDailyReturns: number[] = [];

    // Seeded pseudo-randomness for deterministic results based on holdings
    let seed = holdings.reduce((acc, h) => acc + h.symbol.charCodeAt(0), 0);
    const lcgRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // Standard Normal box-muller transform
    const boxMuller = () => {
      const u1 = lcgRandom();
      const u2 = lcgRandom();
      return Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
    };

    for (let s = 0; s < simCount; s++) {
      // Simulate correlated returns
      // For simplicity in simulation, we use a single common market factor and asset-specific idiosyncratic factors
      const marketFactor = boxMuller();
      let trialReturn = 0;

      for (let i = 0; i < n; i++) {
        const w_i = normalizedWeights[i];
        const vol_i = dailyVols[i];
        
        // Beta to market factor based on asset type
        const beta = holdings[i].type === 'crypto' ? 1.4 : holdings[i].type === 'stock' ? 1.0 : 0.3;
        const systematic = beta * marketFactor * vol_i * 0.5;
        const idiosyncratic = boxMuller() * vol_i * Math.sqrt(1 - 0.25 * beta * beta);
        
        trialReturn += w_i * (systematic + idiosyncratic);
      }

      // scale return to holding period
      simulatedDailyReturns.push(trialReturn * Math.sqrt(holdingPeriod));
    }

    // Sort simulated returns
    const sortedReturns = [...simulatedDailyReturns].sort((a, b) => a - b);
    const percentileIndex = Math.floor(simCount * (1 - confidenceLevel));
    
    // Historical VaR is the negative of the percentile return
    const historicalVaRPct = Math.max(0, -sortedReturns[percentileIndex]);
    const historicalVaRAmount = portfolioValue * historicalVaRPct;

    // Historical CVaR (Expected Shortfall) is the average of returns in the tail
    const tailReturns = sortedReturns.slice(0, percentileIndex + 1);
    const avgTailReturn = tailReturns.reduce((sum, r) => sum + r, 0) / (tailReturns.length || 1);
    const historicalCVaRPct = Math.max(0, -avgTailReturn);
    const historicalCVaRAmount = portfolioValue * historicalCVaRPct;

    // 3. Monte Carlo Simulation (using GBM)
    const mcSimCount = 5000;
    const mcReturns: number[] = [];

    for (let s = 0; s < mcSimCount; s++) {
      const marketFactor = boxMuller();
      let trialReturn = 0;

      for (let i = 0; i < n; i++) {
        const w_i = normalizedWeights[i];
        const vol_i = dailyVols[i];
        const drift = 0.08 / 252; // 8% expected annual drift
        
        const beta = holdings[i].type === 'crypto' ? 1.3 : holdings[i].type === 'stock' ? 1.0 : 0.2;
        const systematic = beta * marketFactor * vol_i * 0.6;
        const idiosyncratic = boxMuller() * vol_i * Math.sqrt(1 - 0.36 * beta * beta);
        
        // GBM step return
        const assetReturn = Math.exp((drift - 0.5 * vol_i * vol_i) * holdingPeriod + (systematic + idiosyncratic) * Math.sqrt(holdingPeriod)) - 1;
        trialReturn += w_i * assetReturn;
      }
      mcReturns.push(trialReturn);
    }

    const mcSorted = [...mcReturns].sort((a, b) => a - b);
    const mcPercentileIndex = Math.floor(mcSimCount * (1 - confidenceLevel));
    const mcVaRPct = Math.max(0, -mcSorted[mcPercentileIndex]);
    const mcVaRAmount = portfolioValue * mcVaRPct;

    const mcTail = mcSorted.slice(0, mcPercentileIndex + 1);
    const mcAvgTailReturn = mcTail.reduce((sum, r) => sum + r, 0) / (mcTail.length || 1);
    const mcCVaRPct = Math.max(0, -mcAvgTailReturn);
    const mcCVaRAmount = portfolioValue * mcCVaRPct;

    // Choose active metrics based on calc method
    let finalVaRAmount = parametricVaRAmount;
    let finalVaRPct = parametricVaRPct;
    let finalCVaRAmount = historicalCVaRAmount;
    let finalCVaRPct = historicalCVaRPct;
    let distribution = sortedReturns;

    if (calcMethod === 'historical') {
      finalVaRAmount = historicalVaRAmount;
      finalVaRPct = historicalVaRPct;
      finalCVaRAmount = historicalCVaRAmount;
      finalCVaRPct = historicalCVaRPct;
      distribution = sortedReturns;
    } else if (calcMethod === 'montecarlo') {
      finalVaRAmount = mcVaRAmount;
      finalVaRPct = mcVaRPct;
      finalCVaRAmount = mcCVaRAmount;
      finalCVaRPct = mcCVaRPct;
      distribution = mcSorted;
    } else {
      // For parametric, we generate standard Gaussian distribution returns based on sigma_p for visual chart
      const gaussReturns: number[] = [];
      for (let i = 0; i < 1000; i++) {
        gaussReturns.push(boxMuller() * portfolioVolPeriod);
      }
      distribution = gaussReturns.sort((a, b) => a - b);
    }

    // Marginal Risk Contribution
    // Risk Contribution of Asset i = w_i * Cov(R_i, R_p) / sigma_p
    const assetsRiskContributions = holdings.map((asset, i) => {
      const w_i = normalizedWeights[i];
      const vol_i = dailyVols[i];
      
      // Covariance with portfolio
      let covWithPortfolio = 0;
      for (let j = 0; j < n; j++) {
        const w_j = normalizedWeights[j];
        const vol_j = dailyVols[j];
        const corr_ij = i === j ? 1.0 : getCorrelation(asset.type, holdings[j].type);
        covWithPortfolio += w_j * vol_i * vol_j * corr_ij;
      }

      const marginalRisk = covWithPortfolio / (portfolioVolDaily || 0.0001);
      const riskContributionPct = (w_i * marginalRisk) / (portfolioVolDaily || 0.0001);

      return {
        symbol: asset.symbol,
        weight: asset.weight,
        standaloneVol: vol_i * Math.sqrt(252) * 100, // Annualized %
        riskContribution: riskContributionPct * 100 // percentage of total portfolio risk
      };
    });

    // Diversification Benefit
    // Benefit = Sum of Standalone VaRs - Portfolio VaR
    const diversificationBenefit = Math.max(0, sumStandaloneVaR - finalVaRAmount);

    // Stress Testing Impact Scenarios
    const stressTestImpacts: Record<string, number> = {
      '2008 Crisis (Finanzkrise)': 0,
      'Covid-19 Crash (März 2020)': 0,
      'Krypto-Winter (Bärenmarkt)': 0,
      'Zins-Schock (Tech Selloff)': 0,
      'Goldene Absicherung (Safe Haven)': 0
    };

    holdings.forEach((asset, i) => {
      const w = normalizedWeights[i];
      if (asset.type === 'crypto') {
        stressTestImpacts['2008 Crisis (Finanzkrise)'] += w * -0.55;
        stressTestImpacts['Covid-19 Crash (März 2020)'] += w * -0.40;
        stressTestImpacts['Krypto-Winter (Bärenmarkt)'] += w * -0.75;
        stressTestImpacts['Zins-Schock (Tech Selloff)'] += w * -0.22;
        stressTestImpacts['Goldene Absicherung (Safe Haven)'] += w * -0.15;
      } else if (asset.type === 'stock') {
        stressTestImpacts['2008 Crisis (Finanzkrise)'] += w * -0.38;
        stressTestImpacts['Covid-19 Crash (März 2020)'] += w * -0.25;
        stressTestImpacts['Krypto-Winter (Bärenmarkt)'] += w * -0.05;
        stressTestImpacts['Zins-Schock (Tech Selloff)'] += w * -0.18;
        stressTestImpacts['Goldene Absicherung (Safe Haven)'] += w * -0.08;
      } else if (asset.type === 'commodity') {
        stressTestImpacts['2008 Crisis (Finanzkrise)'] += w * -0.10;
        stressTestImpacts['Covid-19 Crash (März 2020)'] += w * +0.12;
        stressTestImpacts['Krypto-Winter (Bärenmarkt)'] += w * +0.02;
        stressTestImpacts['Zins-Schock (Tech Selloff)'] += w * -0.04;
        stressTestImpacts['Goldene Absicherung (Safe Haven)'] += w * +0.18;
      } else {
        stressTestImpacts['2008 Crisis (Finanzkrise)'] += w * -0.04;
        stressTestImpacts['Covid-19 Crash (März 2020)'] += w * -0.02;
        stressTestImpacts['Krypto-Winter (Bärenmarkt)'] += w * -0.01;
        stressTestImpacts['Zins-Schock (Tech Selloff)'] += w * +0.01;
        stressTestImpacts['Goldene Absicherung (Safe Haven)'] += w * +0.02;
      }
    });

    return {
      portfolioVol: portfolioVolAnnualized * 100, // as percentage
      varAmount: finalVaRAmount,
      varPct: finalVaRPct * 100,
      cvarAmount: finalCVaRAmount,
      cvarPct: finalCVaRPct * 100,
      diversificationBenefit,
      assetsRiskContributions,
      zScore,
      simulatedReturns: distribution,
      stressTestImpacts
    };
  }, [holdings, portfolioValue, confidenceLevel, holdingPeriod, calcMethod]);

  // Render D3.js Probability Density Chart
  useEffect(() => {
    if (!chartSvgRef.current || holdings.length === 0) return;

    const svgElement = d3.select(chartSvgRef.current);
    svgElement.selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 45, left: 45 };
    const width = chartSvgRef.current.clientWidth - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const svg = svgElement
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = riskMetrics.simulatedReturns;
    if (data.length === 0) return;

    // Binning returns to draw a histogram/probability density
    const thresholds = 45;
    const histogram = d3.bin()
      .domain([d3.min(data) || -0.1, d3.max(data) || 0.1])
      .thresholds(thresholds);

    const bins = histogram(data);

    // X Scale (Percentage Return)
    const xScale = d3.scaleLinear()
      .domain([d3.min(data) || -0.1, d3.max(data) || 0.1])
      .range([0, width]);

    // Y Scale (Density/Frequency)
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 10])
      .range([height, 0]);

    // Draw gridlines
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.05)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(() => ''));

    // Highlight area for tail risk (under VaR)
    // Value at Risk threshold as percentage
    const varThresholdPct = -(riskMetrics.varPct / 100);

    // Area generator for standard return distribution
    const areaGen = d3.area<d3.Bin<number, number>>()
      .x(d => xScale((d.x0! + d.x1!) / 2))
      .y0(height)
      .y1(d => yScale(d.length))
      .curve(d3.curveBasis);

    // Draw the non-risk area (above negative VaR return)
    const regularBins = bins.filter(b => ((b.x0! + b.x1!) / 2) >= varThresholdPct);
    const tailBins = bins.filter(b => ((b.x0! + b.x1!) / 2) < varThresholdPct);

    // Non-tail fill
    svg.append('path')
      .datum(bins)
      .attr('fill', 'rgba(16, 185, 129, 0.08)')
      .attr('stroke', 'rgba(16, 185, 129, 0.4)')
      .attr('stroke-width', 1.5)
      .attr('d', areaGen);

    // Tail Risk Shading (Red neon vibe)
    if (tailBins.length > 0) {
      const tailAreaGen = d3.area<d3.Bin<number, number>>()
        .x(d => xScale((d.x0! + d.x1!) / 2))
        .y0(height)
        .y1(d => yScale(d.length))
        .curve(d3.curveBasis);

      svg.append('path')
        .datum(tailBins)
        .attr('fill', 'rgba(239, 68, 68, 0.25)')
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 2)
        .attr('d', tailAreaGen);
    }

    // Draw vertical Value-at-Risk line
    const varX = xScale(varThresholdPct);
    svg.append('line')
      .attr('x1', varX)
      .attr('x2', varX)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4')
      .attr('filter', 'drop-shadow(0px 0px 4px rgba(244, 63, 94, 0.5))');

    // Add Label text for VaR line
    svg.append('text')
      .attr('x', varX + (varX > width / 2 ? -8 : 8))
      .attr('y', 20)
      .attr('text-anchor', varX > width / 2 ? 'end' : 'start')
      .attr('fill', '#f43f5e')
      .attr('class', 'font-mono text-[10px] font-black')
      .text(`VaR (${(confidenceLevel * 100).toFixed(0)}%): -${riskMetrics.varPct.toFixed(2)}%`);

    // Draw Zero center line (no return)
    const zeroX = xScale(0);
    svg.append('line')
      .attr('x1', zeroX)
      .attr('x2', zeroX)
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', 'rgba(255, 255, 255, 0.25)')
      .attr('stroke-width', 1);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat(d => `${((d as number) * 100).toFixed(1)}%`);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'text-white/40 font-mono text-[9px]')
      .call(xAxis);

    // Y Axis Label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.3)')
      .attr('class', 'font-mono text-[9px] uppercase tracking-wider')
      .text('Szenarien-Häufigkeit');

    // X Axis Label
    svg.append('text')
      .attr('y', height + 35)
      .attr('x', width / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.3)')
      .attr('class', 'font-mono text-[9px] uppercase tracking-wider')
      .text(`Simulierte Portfolio-Renditen (Zeitraum: ${holdingPeriod} Tag${holdingPeriod > 1 ? 'e' : ''})`);

  }, [riskMetrics, holdings, confidenceLevel, holdingPeriod, calcMethod]);

  // PDF Download Report Generator
  const downloadReport = () => {
    if (triggerAttempt) {
      triggerAttempt('VaR PDF Report Download', () => executePdfExport());
    } else {
      executePdfExport();
    }
  };

  const executePdfExport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = '#1e1b4b'; // Deep Indigo
    const accentColor = '#f5c453';  // Gold

    // Title Block
    doc.setFillColor(30, 27, 75);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('AIF-CAPITAL RISK SUITE', 15, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(245, 196, 83);
    doc.text('REAL-TIME VALUE-AT-RISK (VaR) RISK ASSESSMENT REPORT', 15, 26);

    const now = new Date();
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Erstellt am: ${now.toLocaleString('de-DE')} | Lizenzstufe: Enterprise`, 15, 34);

    // Section 1: Portfolio Key Parameters
    doc.setTextColor(30, 27, 75);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Portfolio-Struktur & Kernparameter', 15, 52);

    doc.setDrawColor(220, 220, 220);
    doc.line(15, 54, 195, 54);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);

    let yPos = 62;
    doc.text(`Gesamtkapital (Portfolio-Wert):`, 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${portfolioValue.toLocaleString('de-DE')} USD`, 85, yPos);
    
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Konfidenzniveau:`, 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${(confidenceLevel * 100).toFixed(0)}%`, 85, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Haltedauer (Holding Period):`, 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${holdingPeriod} Tag(e)`, 85, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Berechnungsmethode:`, 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(calcMethod.toUpperCase(), 85, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Portfolio Volatilität (annualisiert):`, 15, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`${riskMetrics.portfolioVol.toFixed(2)}%`, 85, yPos);

    // Section 2: Value-at-Risk Ergebnisse
    yPos += 15;
    doc.setTextColor(190, 24, 74); // Dark Rose
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Value-at-Risk (VaR) & Verlustrisiko', 15, yPos);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, yPos + 2, 195, yPos + 2);

    yPos += 10;
    doc.setFillColor(254, 242, 242);
    doc.rect(15, yPos, 180, 22, 'F');

    doc.setTextColor(153, 27, 27);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Kritischer Maximalverlust (Value-at-Risk):`, 20, yPos + 8);
    doc.setFontSize(13);
    doc.text(`-${riskMetrics.varPct.toFixed(2)}%  /  -${riskMetrics.varAmount.toLocaleString('de-DE', { maximumFractionDigits: 2 })} USD`, 20, yPos + 15);

    yPos += 28;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Interpretation: Mit einer Wahrscheinlichkeit von ${(confidenceLevel * 100).toFixed(0)}% wird der Verlust Deines Portfolios über einen Zeitraum von ${holdingPeriod} Tag(en) den Betrag von ${riskMetrics.varAmount.toLocaleString('de-DE', { maximumFractionDigits: 2 })} USD nicht überschreiten. Umgekehrt besteht ein Risiko von ${(100 - confidenceLevel * 100).toFixed(0)}%, dass der Verlust höher ausfällt.`, 15, yPos, { maxWidth: 180 });

    yPos += 20;
    doc.setFillColor(243, 244, 246);
    doc.rect(15, yPos, 180, 15, 'F');
    doc.setTextColor(55, 65, 81);
    doc.setFont('helvetica', 'bold');
    doc.text(`Conditional VaR (CVaR / Expected Shortfall):`, 20, yPos + 6);
    doc.text(`-${riskMetrics.cvarPct.toFixed(2)}%  /  -${riskMetrics.cvarAmount.toLocaleString('de-DE', { maximumFractionDigits: 2 })} USD`, 20, yPos + 11);

    // Section 3: Portfolio Holdings
    yPos += 25;
    doc.setTextColor(30, 27, 75);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Risikoallokation der Vermögenswerte', 15, yPos);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, yPos + 2, 195, yPos + 2);

    yPos += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Symbol', 15, yPos);
    doc.text('Typ', 40, yPos);
    doc.text('Gewichtung %', 70, yPos);
    doc.text('Individuelle Volatilität', 110, yPos);
    doc.text('Risikobeitrag %', 160, yPos);

    doc.line(15, yPos + 2, 195, yPos + 2);

    doc.setFont('helvetica', 'normal');
    holdings.forEach((h, idx) => {
      yPos += 8;
      const riskContr = riskMetrics.assetsRiskContributions.find(c => c.symbol === h.symbol);
      
      doc.text(h.symbol, 15, yPos);
      doc.text(h.type.toUpperCase(), 40, yPos);
      doc.text(`${h.weight.toFixed(1)}%`, 70, yPos);
      doc.text(`${riskContr?.standaloneVol.toFixed(1)}%`, 110, yPos);
      doc.text(`${riskContr?.riskContribution.toFixed(1)}%`, 160, yPos);
    });

    // Stress Testing
    yPos += 18;
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setTextColor(30, 27, 75);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Historische Stressszenarien (Stresstests)', 15, yPos);
    doc.setDrawColor(220, 220, 220);
    doc.line(15, yPos + 2, 195, yPos + 2);

    yPos += 8;
    doc.setFontSize(9);
    Object.entries(riskMetrics.stressTestImpacts).forEach(([scenario, impact]) => {
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(scenario, 15, yPos);
      
      doc.setFont('helvetica', 'bold');
      const amt = portfolioValue * impact;
      if (impact < 0) {
        doc.setTextColor(185, 28, 28);
        doc.text(`${(impact * 100).toFixed(1)}%  (${amt.toLocaleString('de-DE', { maximumFractionDigits: 0 })} USD)`, 140, yPos);
      } else {
        doc.setTextColor(4, 120, 87);
        doc.text(`+${(impact * 100).toFixed(1)}%  (+${amt.toLocaleString('de-DE', { maximumFractionDigits: 0 })} USD)`, 140, yPos);
      }
    });

    // Footer compliance
    yPos += 20;
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos, 195, yPos);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('Haftungsausschluss: Dieses Dokument dient ausschließlich internen Analysezwecken im Rahmen der AIF-Capital Risikoanalyse-Plattform. Die berechneten Risikomaße basieren auf mathematischen Wahrscheinlichkeitsmodellen und historischen Standardabweichungen. Zukünftige Marktentwicklungen können erheblich von diesen Schätzungen abweichen. Keine Anlageberatung.', 15, yPos + 5, { maxWidth: 180 });

    doc.save(`AIF_Capital_Risk_VaR_Report_${now.toISOString().split('T')[0]}.pdf`);
  };

  const handleRefreshSimulation = () => {
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
    }, 700);
  };

  // Filter asset options for the search dropdown
  const filteredAssetsList = useMemo(() => {
    if (!searchQuery) return marketAssets;
    return marketAssets.filter(
      a => a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
           a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [marketAssets, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Risk Suite Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-xl">
              <ShieldAlert size={22} className="animate-pulse" />
            </span>
            <h1 className="text-xl font-bold text-white uppercase tracking-wider font-display">
              Echtzeit Value-at-Risk (VaR) Risiko-Zentrale
            </h1>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Profitiere von mathematischen Risikomodellen (Variance-Covariance, Historische Bootstrappings & Monte-Carlo) zur Identifikation Deiner Portfoliorisiken.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={handleRefreshSimulation}
            className="px-4 py-2 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white border border-white/10 hover:border-white/20 rounded-xl font-mono text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={12} className={calculating ? 'animate-spin' : ''} />
            <span>Neukalkulation</span>
          </button>
          
          <button
            onClick={downloadReport}
            className="px-4 py-2 bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark text-black font-black hover:brightness-110 rounded-xl font-mono text-[11px] uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,196,83,0.15)] cursor-pointer"
          >
            <Download size={13} />
            <span>Bericht (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls & Holdings, Right Simulation Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN (7 COLS): Config & Holdings */}
        <div className="xl:col-span-7 space-y-6">
          
          {/* Module 1: Portfolio Holdings Configuration */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="text-aif-gold-DEFAULT" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Portfolio-Zusammensetzung</h3>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleAutoRebalance}
                  className="px-2.5 py-1 text-[9px] font-mono font-bold bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                  title="Gewichte alle Vermögenswerte gleichmäßig auf"
                >
                  Gleichgewicht
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="px-2.5 py-1 text-[9px] font-mono font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={10} />
                    <span>Hinzufügen</span>
                  </button>

                  <AnimatePresence>
                    {showAddMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-3 z-50 space-y-2"
                      >
                        <div className="text-[10px] font-mono text-white/40 uppercase">Wertpapier auswählen</div>
                        <input
                          type="text"
                          placeholder="Suchen (z.B. BTC, AAPL)..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {filteredAssetsList.map((asset) => (
                            <button
                              key={asset.symbol}
                              onClick={() => handleAddHolding(asset)}
                              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors flex justify-between items-center text-xs"
                            >
                              <span className="font-mono font-bold text-white">{asset.symbol}</span>
                              <span className="text-[10px] text-white/50 truncate max-w-[120px]">{asset.name}</span>
                              <span className="text-[10px] text-cyan-400 uppercase font-mono">{asset.type}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Total Portfolio value controller */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black block">Gesamtes Portfolio-Kapital (USD)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-mono text-sm">$</span>
                  <input
                    type="number"
                    value={portfolioValue}
                    onChange={(e) => setPortfolioValue(Math.max(1000, Number(e.target.value)))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT font-bold"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end text-right">
                <span className="text-[9px] font-mono text-white/30 uppercase">Summe der Vermögensgewichtungen</span>
                <div className="text-xl font-mono font-black text-white mt-1">
                  {holdings.reduce((sum, h) => sum + h.weight, 0).toFixed(0)} %
                </div>
                <span className="text-[9px] text-white/40">Gewichte müssen für präzise Risikokalkulation 100% ergeben.</span>
              </div>
            </div>

            {/* Interactive Holdings List */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[9px] font-mono text-white/30 uppercase font-black px-3">
                <div className="col-span-4">Asset / Name</div>
                <div className="col-span-3 text-right">Aktueller Preis</div>
                <div className="col-span-3 text-right">Gewichtung %</div>
                <div className="col-span-2 text-center">Aktion</div>
              </div>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {holdings.map((holding) => (
                  <div 
                    key={holding.symbol}
                    className="grid grid-cols-12 items-center bg-black/20 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors"
                  >
                    {/* Symbol / Name */}
                    <div className="col-span-4 flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black uppercase ${
                        holding.type === 'crypto' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        holding.type === 'stock' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {holding.symbol}
                      </span>
                      <div className="truncate hidden sm:block">
                        <span className="text-xs font-semibold text-white block truncate">{holding.name}</span>
                        <span className="text-[9px] text-white/40 font-mono block uppercase">{holding.type}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-3 text-right font-mono text-xs text-white">
                      $ {holding.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>

                    {/* Weight slider & input */}
                    <div className="col-span-3 flex items-center justify-end gap-1.5">
                      <input
                        type="number"
                        value={holding.weight}
                        min={0}
                        max={100}
                        step={0.5}
                        onChange={(e) => handleUpdateWeight(holding.symbol, Number(e.target.value))}
                        className="w-14 bg-black/40 border border-white/10 rounded px-1.5 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                      <span className="text-xs font-mono text-white/50">%</span>
                    </div>

                    {/* Delete button */}
                    <div className="col-span-2 text-center">
                      <button
                        onClick={() => handleRemoveHolding(holding.symbol)}
                        className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-all cursor-pointer"
                        title="Aus dem Portfolio entfernen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {holdings.length === 0 && (
                  <div className="bg-black/10 border border-dashed border-white/10 rounded-xl p-8 text-center space-y-2">
                    <Briefcase className="text-white/30 mx-auto" size={24} />
                    <p className="text-xs text-white/60">Dein Portfolio ist leer.</p>
                    <p className="text-[10px] text-white/40">Füge Assets über das obige "+" Menü hinzu, um eine Risikoanalyse durchzuführen.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Module 2: System-Config Sliders */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Sliders className="text-cyan-400" size={18} />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Risikomodell Parameter</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Confidence interval slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white/50">Konfidenzniveau (Confidence):</span>
                  <span className="text-rose-400 font-bold">{(confidenceLevel * 100).toFixed(0)} %</span>
                </div>
                <div className="flex gap-2">
                  {[0.90, 0.95, 0.99].map((val) => (
                    <button
                      key={val}
                      onClick={() => setConfidenceLevel(val)}
                      className={`flex-1 py-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer ${
                        confidenceLevel === val
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                          : 'bg-black/30 text-white/50 border-white/5 hover:bg-white/5'
                      }`}
                    >
                      {(val * 100).toFixed(0)}%
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-white/40 leading-relaxed">
                  Ein Niveau von 95% impliziert, dass der kalkulierte Höchstverlust mit einer Sicherheit von 95% nicht überschritten wird.
                </div>
              </div>

              {/* Time Horizon Horizon slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-white/50">Haltedauer (Holding Horizon):</span>
                  <span className="text-cyan-400 font-bold">{holdingPeriod} Tag{holdingPeriod > 1 ? 'e' : ''}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={holdingPeriod}
                  onChange={(e) => setHoldingPeriod(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-white/30">
                  <span>1 Tag</span>
                  <span>15 Tage</span>
                  <span>30 Tage</span>
                </div>
                <div className="text-[10px] text-white/40 leading-relaxed">
                  Skaliert das statistische Risiko über die Haltedauer hinweg (Quadratwurzel-t Skalierung).
                </div>
              </div>

            </div>

            {/* Simulation Method Buttons */}
            <div className="pt-2 border-t border-white/5">
              <div className="text-[10px] font-mono text-white/40 uppercase mb-2">Mathematischer Rechenkern</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setCalcMethod('parametric')}
                  className={`px-3 py-2 rounded-xl border text-left font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    calcMethod === 'parametric'
                      ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                      : 'bg-black/30 text-white/60 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className="block text-white font-black text-xs">Varianz-Kovarianz</span>
                  <span className="text-[9px] text-white/40 font-normal">Parametrisches Z-Score Modell</span>
                </button>

                <button
                  onClick={() => setCalcMethod('historical')}
                  className={`px-3 py-2 rounded-xl border text-left font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    calcMethod === 'historical'
                      ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                      : 'bg-black/30 text-white/60 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className="block text-white font-black text-xs">Historische Sim.</span>
                  <span className="text-[9px] text-white/40 font-normal">1.000 Bootstrapping-Pfade</span>
                </button>

                <button
                  onClick={() => setCalcMethod('montecarlo')}
                  className={`px-3 py-2 rounded-xl border text-left font-mono text-[11px] font-bold transition-all cursor-pointer ${
                    calcMethod === 'montecarlo'
                      ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                      : 'bg-black/30 text-white/60 border-white/5 hover:bg-white/5'
                  }`}
                >
                  <span className="block text-white font-black text-xs">Monte Carlo</span>
                  <span className="text-[9px] text-white/40 font-normal">5.000 stochastische Pfade</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN (5 COLS): Visualizations, Outputs & Risk Contributions */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Key Risk Indicators (KPIs) */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Value-at-Risk (VaR) Card */}
            <div className="bg-gradient-to-br from-slate-900 to-rose-950/30 border border-rose-500/15 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
              <span className="text-[9px] font-mono text-rose-400 uppercase tracking-widest font-black block">Value-at-Risk (VaR)</span>
              
              <div className="mt-3 space-y-0.5">
                <span className="text-2xl font-mono font-black text-rose-400 leading-none">
                  -${riskMetrics.varAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-white/40 font-mono block">USD Maximalverlust</span>
              </div>

              <div className="mt-4 pt-3 border-t border-rose-500/10 flex justify-between items-center text-xs">
                <span className="text-white/60">Risk-Anteil:</span>
                <span className="font-mono font-black text-rose-400">-{riskMetrics.varPct.toFixed(2)} %</span>
              </div>
            </div>

            {/* Expected Shortfall (CVaR) Card */}
            <div className="bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-500/15 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
              <span className="text-[9px] font-mono text-amber-400 uppercase tracking-widest font-black block">Expected Shortfall (CVaR)</span>
              
              <div className="mt-3 space-y-0.5">
                <span className="text-2xl font-mono font-black text-amber-400 leading-none">
                  -${riskMetrics.cvarAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-white/40 font-mono block">Mittel im Extremfall</span>
              </div>

              <div className="mt-4 pt-3 border-t border-amber-500/10 flex justify-between items-center text-xs">
                <span className="text-white/60">Katastrophen-Risk:</span>
                <span className="font-mono font-black text-amber-400">-{riskMetrics.cvarPct.toFixed(2)} %</span>
              </div>
            </div>

          </div>

          {/* D3.js Probability Distribution Chart */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black">Risiko-Verteilung (D3.js-Diagramm)</span>
              <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-mono rounded font-black uppercase">Tail-Glow</span>
            </div>
            
            <div className="w-full bg-black/40 border border-white/5 rounded-xl p-2 flex items-center justify-center">
              <svg ref={chartSvgRef} className="w-full" />
            </div>

            <div className="text-[10px] text-white/50 leading-relaxed bg-white/[0.01] border border-white/5 rounded-xl p-3 flex gap-2.5">
              <Info className="text-cyan-400 shrink-0 mt-0.5" size={14} />
              <p>
                Der rot schattierte Bereich repräsentiert die <span className="text-rose-400 font-bold">5% Worst-Case Renditefälle</span>. Die gepunktete vertikale Schranke stellt die genaue Value-at-Risk-Grenze dar.
              </p>
            </div>
          </div>

          {/* Asset Risk Contributions Table */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center gap-1.5">
                <PieChart className="text-cyan-400" size={16} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Marginale Risikobeiträge</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                Diversifikationsvorteil: +$ {riskMetrics.diversificationBenefit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1 custom-scrollbar">
              {riskMetrics.assetsRiskContributions.map((contrib) => {
                const isHighRisk = contrib.riskContribution > contrib.weight;
                return (
                  <div key={contrib.symbol} className="space-y-1 bg-black/20 rounded-xl p-2.5 border border-white/5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-white">{contrib.symbol}</span>
                        <span className="text-[9px] text-white/30">Gewicht: {contrib.weight.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/40">Anteil am Portfoliorisiko:</span>
                        <span className={`font-mono font-bold ${isHighRisk ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {contrib.riskContribution.toFixed(1)} %
                        </span>
                      </div>
                    </div>

                    {/* Simple horizontal progress bar representing risk contribution */}
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full ${isHighRisk ? 'bg-amber-400' : 'bg-cyan-500'}`}
                        style={{ width: `${Math.min(100, Math.max(1, contrib.riskContribution))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stress Testing Scenarios */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-3.5">
            <div className="flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Flame className="text-rose-500" size={16} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Historische Stress-Simulationen</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {Object.entries(riskMetrics.stressTestImpacts).map(([scenario, impact]) => {
                const amountImpact = portfolioValue * impact;
                return (
                  <div 
                    key={scenario}
                    className="flex justify-between items-center bg-white/[0.01] border border-white/5 rounded-xl p-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-white block">{scenario}</span>
                      <span className="text-[9px] text-white/40 uppercase font-mono">Modellierter Schock</span>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <span className={`font-bold block ${impact < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {impact < 0 ? '' : '+'}{(impact * 100).toFixed(1)} %
                      </span>
                      <span className="text-[10px] text-white/40">
                        {impact < 0 ? '-' : '+'}$ {Math.abs(amountImpact).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
