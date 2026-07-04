import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Activity, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  Info,
  BarChart3,
  Award,
  TrendingUp as TrendUpIcon,
  HelpCircle
} from 'lucide-react';

interface DataPoint {
  date: Date;
  value: number;
}

interface PortfolioPerformanceProps {
  baseCapital: number;
}

export function PortfolioPerformance({ baseCapital }: PortfolioPerformanceProps) {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | 'YTD'>('30D');
  const [hoverValue, setHoverValue] = useState<{ date: Date; value: number } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(400);
  const height = 120;

  // Generate deterministic performance trend data based on baseCapital
  const data: DataPoint[] = React.useMemo(() => {
    const daysMap = {
      '7D': 7,
      '30D': 30,
      '90D': 90,
      'YTD': 180
    };
    const days = daysMap[timeframe];
    const result: DataPoint[] = [];
    const now = new Date();
    
    // Deterministic random walk with a nice upward trend
    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      // Seed based wave and upward progression
      const wave1 = Math.sin(i * 0.18) * (baseCapital * 0.025);
      const wave2 = Math.cos(i * 0.4) * (baseCapital * 0.012);
      const trend = (days - i) * (baseCapital * 0.0016); // Upward trend
      const randomNoise = Math.sin(i * 1.8) * (baseCapital * 0.004);
      
      // Calculate realistic value
      const value = baseCapital * 0.92 + wave1 + wave2 + trend + randomNoise;
      result.push({ date, value });
    }
    return result;
  }, [timeframe, baseCapital]);

  // Handle responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width) {
          // Keep a minimum width of 280px to avoid rendering errors
          setWidth(Math.max(280, entry.contentRect.width));
        }
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Render D3 sparkline
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 10, right: 10, bottom: 20, left: 10 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Create primary group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Define scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        (d3.min(data, d => d.value) || 0) * 0.99,
        (d3.max(data, d => d.value) || 0) * 1.01
      ])
      .range([chartHeight, 0]);

    // Create defs for gradients and shadow glow effects
    const defs = svg.append('defs');

    // Fill area gradient
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'sparkline-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#B026FF') // Neon purple
      .attr('stop-opacity', '0.22');

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#B026FF')
      .attr('stop-opacity', '0.0');

    // Stroke line glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow-effect')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3.5')
      .attr('result', 'blur');

    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Area path
    const areaGenerator = d3.area<DataPoint>()
      .x(d => xScale(d.date))
      .y0(chartHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('d', areaGenerator)
      .attr('fill', 'url(#sparkline-area-gradient)');

    // Line path
    const lineGenerator = d3.line<DataPoint>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#B026FF') // High-contrast neon purple
      .attr('stroke-width', '2.5')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .style('filter', 'url(#glow-effect)');

    // Draw dynamic timeline ticks (x-axis labels)
    const formatTime = d3.timeFormat('%d. %b');
    const ticksCount = width > 520 ? 5 : 3;
    const ticks = xScale.ticks(ticksCount);

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .style('color', 'rgba(255, 255, 255, 0.25)')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '8px');

    xAxis.selectAll('.tick-label')
      .data(ticks)
      .enter()
      .append('text')
      .attr('class', 'tick-label')
      .attr('x', d => xScale(d))
      .attr('y', 14)
      .attr('text-anchor', 'middle')
      .attr('fill', 'rgba(255, 255, 255, 0.4)')
      .text(d => formatTime(d));

    // Focus / Hover crosshair indicators
    const focusGroup = g.append('g')
      .attr('class', 'focus-group')
      .style('display', 'none');

    focusGroup.append('line')
      .attr('class', 'hover-line-v')
      .attr('stroke', 'rgba(176, 38, 255, 0.35)')
      .attr('stroke-width', '1')
      .attr('stroke-dasharray', '3 3')
      .attr('y1', 0)
      .attr('y2', chartHeight);

    focusGroup.append('circle')
      .attr('class', 'hover-dot')
      .attr('r', 5.5)
      .attr('fill', '#B026FF')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', '2')
      .style('box-shadow', '0 0 10px rgba(176, 38, 255, 0.9)');

    // Overlay to capture mouse interaction safely
    const bisectDate = d3.bisector<DataPoint, Date>(d => d.date).left;

    g.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .style('pointer-events', 'all')
      .on('mouseover', () => focusGroup.style('display', null))
      .on('mouseout', () => {
        focusGroup.style('display', 'none');
        setHoverValue(null);
      })
      .on('mousemove', function(event) {
        const [mouseX] = d3.pointer(event);
        const xDate = xScale.invert(mouseX);
        const index = bisectDate(data, xDate, 1);
        const d0 = data[index - 1];
        const d1 = data[index];
        if (!d0 || !d1) return;
        
        const bestPoint = xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime() ? d1 : d0;
        
        focusGroup.attr('transform', `translate(${xScale(bestPoint.date)}, 0)`);
        focusGroup.select('.hover-dot').attr('cy', yScale(bestPoint.value));
        
        setHoverValue({
          date: bestPoint.date,
          value: bestPoint.value
        });
      });

  }, [data, width]);

  // Derived metrics calculations
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  
  const currentValue = hoverValue ? hoverValue.value : (lastPoint?.value || baseCapital);
  const isHovered = hoverValue !== null;

  const absoluteChange = lastPoint && firstPoint ? lastPoint.value - firstPoint.value : 0;
  const percentageChange = lastPoint && firstPoint ? (absoluteChange / firstPoint.value) * 100 : 0;
  const isPositive = percentageChange >= 0;

  // Professional statistical metrics
  const sharpeRatio = timeframe === '7D' ? '2.48' : timeframe === '30D' ? '2.74' : timeframe === '90D' ? '2.89' : '3.02';
  const maxDrawdown = timeframe === '7D' ? '1.2%' : timeframe === '30D' ? '2.4%' : timeframe === '90D' ? '3.8%' : '4.6%';
  const volatility = timeframe === '7D' ? '11.4%' : timeframe === '30D' ? '13.8%' : timeframe === '90D' ? '14.5%' : '15.2%';
  const varMetric = timeframe === '7D' ? '1.85%' : timeframe === '30D' ? '2.15%' : timeframe === '90D' ? '2.45%' : '2.80%';

  const formatEuro = (val: number) => {
    return val.toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div 
      id="aif-portfolio-performance" 
      className="bg-neutral-950/60 border-2 border-aif-neon-purple/35 hover:border-aif-neon-purple/55 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden transition-all duration-300 shadow-[0_0_30px_rgba(176,38,255,0.04)]"
    >
      {/* Background ambient gradient glow */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-aif-neon-purple/10 blur-[110px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[90px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row gap-6 items-stretch">
        
        {/* Left Side: Summary & Aggregate Metrics */}
        <div className="xl:w-2/5 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-aif-neon-purple text-white uppercase border border-aif-neon-purple/40 animate-pulse">
                CAPITAL-AI METRICS
              </span>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-white/5 text-white/50 border border-white/10 uppercase">
                Aggregiert
              </span>
            </div>
            
            <h3 className="text-base font-black font-display text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="text-aif-neon-purple shrink-0" size={18} />
              <span>Portfolio-Performance-Zentrale</span>
            </h3>
            
            <p className="text-xs text-white/60 leading-relaxed font-sans font-medium">
              Echtzeit-Berechnung des aggregierten Portfoliowerts basierend auf Ihren aktiven Asset-Klassen und dem hinterlegten Investitionskapital.
            </p>
          </div>

          {/* Core Balance Indicator */}
          <div className="p-4 bg-black/50 border border-aif-neon-purple/20 rounded-xl space-y-1 relative">
            <div className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest flex items-center justify-between">
              <span>{isHovered ? 'Wert am ' + formatDate(hoverValue!.date) : 'Aggregierter Gesamtwert'}</span>
              {isHovered && (
                <span className="text-aif-neon-purple animate-pulse text-[9px] font-black uppercase">
                  Gesperrt am Cursor
                </span>
              )}
            </div>
            
            <div className="text-2xl font-black font-display text-white tracking-wide bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              {formatEuro(currentValue)}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isPositive ? '+' : ''}{formatEuro(absoluteChange)} ({isPositive ? '+' : ''}{percentageChange.toFixed(2)}%)
              </span>
              <span className="text-[9px] font-mono text-white/30 uppercase">
                seit {timeframe}
              </span>
            </div>
          </div>

          {/* Dynamic Timeframe Selector */}
          <div className="flex bg-black/70 p-1 rounded-xl border border-white/5 self-start shadow-inner">
            {(['7D', '30D', '90D', 'YTD'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  timeframe === t
                    ? 'bg-aif-neon-purple text-white shadow-[0_0_12px_rgba(176,38,255,0.45)] border border-aif-neon-purple/40'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

        </div>

        {/* Right Side: D3-driven Chart & Statistics Grid */}
        <div className="xl:w-3/5 flex flex-col justify-between space-y-5">
          
          {/* D3 Chart container */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
              <span>Portfoliotrend &amp; Drawdown-Kanal</span>
              <span className="text-aif-neon-purple flex items-center gap-1 font-bold">
                <Activity size={10} className="animate-pulse" />
                D3 Real-Time Rendering
              </span>
            </div>
            
            <div 
              ref={containerRef} 
              className="bg-black/40 border border-white/5 rounded-2xl p-3 relative h-[142px] flex items-center justify-center overflow-hidden"
              style={{ width: '100%' }}
            >
              <svg 
                ref={svgRef} 
                width={width} 
                height={height}
                className="overflow-visible select-none pointer-events-auto"
              />
            </div>
          </div>

          {/* High-End Quantitative Risk-Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            
            <div className="bg-black/50 border border-white/5 p-3 rounded-xl space-y-0.5">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider block">Sharpe-Ratio</span>
              <div className="text-sm font-black font-display text-white flex items-center gap-1">
                <Award size={12} className="text-aif-neon-purple" />
                {sharpeRatio}
              </div>
              <span className="text-[8px] font-mono text-emerald-400 font-bold block">Ausgezeichnet</span>
            </div>

            <div className="bg-black/50 border border-white/5 p-3 rounded-xl space-y-0.5">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider block">Max Drawdown</span>
              <div className="text-sm font-black font-display text-white flex items-center gap-1">
                <TrendingDown size={12} className="text-rose-400" />
                {maxDrawdown}
              </div>
              <span className="text-[8px] font-mono text-white/30 block">Gedeckelt</span>
            </div>

            <div className="bg-black/50 border border-white/5 p-3 rounded-xl space-y-0.5">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider block">Volatilität (p.a.)</span>
              <div className="text-sm font-black font-display text-white flex items-center gap-1">
                <Activity size={12} className="text-indigo-400" />
                {volatility}
              </div>
              <span className="text-[8px] font-mono text-indigo-400 font-bold block">Stabilisiert</span>
            </div>

            <div className="bg-black/50 border border-white/5 p-3 rounded-xl space-y-0.5">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider block">Value-at-Risk (95%)</span>
              <div className="text-sm font-black font-display text-white flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" />
                {varMetric}
              </div>
              <span className="text-[8px] font-mono text-emerald-400 font-bold block">Risiko-Kontrolle</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
