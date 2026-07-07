import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { 
  Activity, 
  Cpu, 
  Clock, 
  Database, 
  Trash2, 
  Play, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  TrendingUp, 
  Gauge,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Data types for D3 tracking
interface LatencyDataPoint {
  timestamp: Date;
  assetRegistry: number; // ms
  simulations: number; // ms
}

interface ModelLatency {
  model: string;
  latency: number; // ms
  color: string;
}

interface EfficiencyData {
  category: string;
  value: number;
  color: string;
}

interface MemoryDataPoint {
  timestamp: Date;
  heapUsed: number; // MB
  heapLimit: number; // MB
}

export default function PerformanceDashboard() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'latency' | 'efficiency' | 'memory'>('latency');
  const [isSimulatingLoad, setIsSimulatingLoad] = useState<boolean>(false);
  const [alertTriggered, setAlertTriggered] = useState<boolean>(false);
  const [autoOptimizedCount, setAutoOptimizedCount] = useState<number>(3);
  const [lastOptimizationTime, setLastOptimizationTime] = useState<string>('Vor 12 min');

  // Core metrics state
  const [avgRegistryLatency, setAvgRegistryLatency] = useState<number>(42);
  const [avgModelLatency, setAvgModelLatency] = useState<number>(128);
  const [requestSuccessRate, setRequestSuccessRate] = useState<number>(99.8);
  const [currentMemoryLoad, setCurrentMemoryLoad] = useState<number>(142); // MB

  // --- REFS FOR D3 SVG CONTAINERS ---
  const lineChartRef = useRef<SVGSVGElement | null>(null);
  const barChartRef = useRef<SVGSVGElement | null>(null);
  const donutChartRef = useRef<SVGSVGElement | null>(null);
  const areaChartRef = useRef<SVGSVGElement | null>(null);

  // --- SEEDING LIVE DATA ---
  const [latencyData, setLatencyData] = useState<LatencyDataPoint[]>(() => {
    const data: LatencyDataPoint[] = [];
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      data.push({
        timestamp: new Date(now.getTime() - i * 4000),
        assetRegistry: Math.floor(35 + Math.random() * 15),
        simulations: Math.floor(110 + Math.random() * 30)
      });
    }
    return data;
  });

  const [modelLatencies, setModelLatencies] = useState<ModelLatency[]>([
    { model: 'Asset Registry', latency: 42, color: '#06b6d4' }, // Cyan
    { model: 'Monte Carlo', latency: 138, color: '#8b5cf6' }, // Purple
    { model: 'Buffett Graham DCF', latency: 28, color: '#f5c453' }, // Gold
    { model: 'Backtest Engine', latency: 195, color: '#10b981' }, // Emerald
    { model: 'Crypto Scoring', latency: 84, color: '#ec4899' } // Pink
  ]);

  const [efficiencyStats, setEfficiencyStats] = useState<EfficiencyData[]>([
    { category: 'Cached Hits', value: 72, color: '#10b981' }, // Emerald
    { category: 'Direct Fetch', value: 24, color: '#06b6d4' }, // Cyan
    { category: 'Throttled', value: 3.2, color: '#f5c453' }, // Gold
    { category: 'API Error', value: 0.8, color: '#ef4444' } // Rose
  ]);

  const [memoryData, setMemoryData] = useState<MemoryDataPoint[]>(() => {
    const data: MemoryDataPoint[] = [];
    const now = new Date();
    for (let i = 15; i >= 0; i--) {
      data.push({
        timestamp: new Date(now.getTime() - i * 4000),
        heapUsed: Math.floor(130 + Math.random() * 20),
        heapLimit: 512
      });
    }
    return data;
  });

  // --- INTERVAL FOR REALTIME DATA PIPELINE ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Generate new telemetry with occasional spikes if simulated
      const spikeFactor = isSimulatingLoad ? 2.5 : 1.0;
      const registrySpike = Math.random() > 0.85 ? 40 : 0;
      const simSpike = Math.random() > 0.85 ? 120 : 0;

      const newRegistry = Math.floor((35 + Math.random() * 15 + registrySpike) * spikeFactor);
      const newSim = Math.floor((110 + Math.random() * 30 + simSpike) * spikeFactor);

      // Memory increments slowly under load simulation
      const memoryDelta = isSimulatingLoad ? Math.floor(15 + Math.random() * 10) : Math.floor(-5 + Math.random() * 12);
      
      setLatencyData(prev => {
        const next = [...prev.slice(1), { timestamp: now, assetRegistry: newRegistry, simulations: newSim }];
        // Update live avg metrics
        const avgReg = Math.round(next.reduce((acc, d) => acc + d.assetRegistry, 0) / next.length);
        const avgS = Math.round(next.reduce((acc, d) => acc + d.simulations, 0) / next.length);
        setAvgRegistryLatency(avgReg);
        setAvgModelLatency(avgS);
        return next;
      });

      setMemoryData(prev => {
        const lastHeap = prev[prev.length - 1].heapUsed;
        const targetHeap = Math.max(100, Math.min(480, lastHeap + memoryDelta));
        setCurrentMemoryLoad(targetHeap);
        
        // Auto alert if memory spikes past 350MB or simulation latency past 240ms
        if (targetHeap > 340 || newSim > 280) {
          setAlertTriggered(true);
        }

        return [...prev.slice(1), { timestamp: now, heapUsed: targetHeap, heapLimit: 512 }];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isSimulatingLoad]);

  // --- TRIGGER AUTONOMOUS PURGE / CACHE CLEANING (4H RULE LINKED) ---
  const triggerAutonomousCleaning = () => {
    if (isSimulatingLoad) setIsSimulatingLoad(false);
    
    // Animate memory purge
    setTimeout(() => {
      setMemoryData(prev => {
        // Reset heap immediately to a healthy state
        const now = new Date();
        const baseHeap = 118;
        setCurrentMemoryLoad(baseHeap);
        
        // Repopulate smooth descending trail
        return prev.map((item, idx) => ({
          ...item,
          heapUsed: Math.floor(baseHeap + Math.sin(idx) * 8)
        }));
      });

      // Reset latency values to optimal
      setLatencyData(prev => {
        return prev.map((item) => ({
          ...item,
          assetRegistry: Math.floor(32 + Math.random() * 8),
          simulations: Math.floor(105 + Math.random() * 15)
        }));
      });

      setAlertTriggered(false);
      setAutoOptimizedCount(prev => prev + 1);
      setLastOptimizationTime('Gerade eben (Autonomer Purge)');
    }, 1200);
  };

  // --- D3 RENDERING PIPELINES ---

  // 1. Line Chart: Latency over time
  useEffect(() => {
    if (!lineChartRef.current || latencyData.length === 0) return;

    const svgElement = d3.select(lineChartRef.current);
    svgElement.selectAll('*').remove(); // Clear previous drawing

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = lineChartRef.current.clientWidth - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const svg = svgElement
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(latencyData, d => d.timestamp) as [Date, Date])
      .range([0, width]);

    const maxVal = d3.max(latencyData, d => Math.max(d.assetRegistry, d.simulations)) || 200;
    const yScale = d3.scaleLinear()
      .domain([0, Math.max(250, maxVal + 30)])
      .range([height, 0]);

    // X Axis with gridlines
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d3.timeFormat('%H:%M:%S') as any);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'text-white/40 font-mono text-[9px]')
      .call(xAxis)
      .selectAll('line')
      .attr('stroke', 'rgba(255,255,255,0.05)');

    // Y Axis with gridlines
    const yAxis = d3.axisLeft(yScale).ticks(5);
    svg.append('g')
      .attr('class', 'text-white/40 font-mono text-[9px]')
      .call(yAxis)
      .selectAll('line')
      .attr('stroke', 'rgba(255,255,255,0.05)');

    // Draw horizontal grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.15)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-width).tickFormat(() => ''));

    // Threshold Alert Line (e.g. 200ms latency warning limit)
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(200))
      .attr('y2', yScale(200))
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.8);

    svg.append('text')
      .attr('x', width - 10)
      .attr('y', yScale(200) - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#ef4444')
      .attr('class', 'font-mono text-[8px] font-black tracking-widest')
      .text('WARNING LATENCY LIMIT (200ms)');

    // Gradients for line fill
    const gradRegistry = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'grad-registry')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradRegistry.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.25);
    gradRegistry.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.0);

    const gradSim = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'grad-sim')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    gradSim.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.25);
    gradSim.append('stop').attr('offset', '100%').attr('stop-color', '#8b5cf6').attr('stop-opacity', 0.0);

    // Area generators
    const areaRegistry = d3.area<LatencyDataPoint>()
      .x(d => xScale(d.timestamp))
      .y0(height)
      .y1(d => yScale(d.assetRegistry))
      .curve(d3.curveMonotoneX);

    const areaSimulations = d3.area<LatencyDataPoint>()
      .x(d => xScale(d.timestamp))
      .y0(height)
      .y1(d => yScale(d.simulations))
      .curve(d3.curveMonotoneX);

    // Append areas
    svg.append('path')
      .datum(latencyData)
      .attr('fill', 'url(#grad-registry)')
      .attr('d', areaRegistry);

    svg.append('path')
      .datum(latencyData)
      .attr('fill', 'url(#grad-sim)')
      .attr('d', areaSimulations);

    // Line generators
    const lineRegistry = d3.line<LatencyDataPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.assetRegistry))
      .curve(d3.curveMonotoneX);

    const lineSimulations = d3.line<LatencyDataPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.simulations))
      .curve(d3.curveMonotoneX);

    // Draw lines
    svg.append('path')
      .datum(latencyData)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2)
      .attr('d', lineRegistry);

    svg.append('path')
      .datum(latencyData)
      .attr('fill', 'none')
      .attr('stroke', '#8b5cf6')
      .attr('stroke-width', 2)
      .attr('d', lineSimulations);

    // Scatterplot circles for live data points
    svg.selectAll('.dot-reg')
      .data(latencyData)
      .enter()
      .append('circle')
      .attr('class', 'dot-reg')
      .attr('cx', d => xScale(d.timestamp))
      .attr('cy', d => yScale(d.assetRegistry))
      .attr('r', 3)
      .attr('fill', '#06b6d4')
      .attr('stroke', '#000')
      .attr('stroke-width', 1);

    svg.selectAll('.dot-sim')
      .data(latencyData)
      .enter()
      .append('circle')
      .attr('class', 'dot-sim')
      .attr('cx', d => xScale(d.timestamp))
      .attr('cy', d => yScale(d.simulations))
      .attr('r', 3)
      .attr('fill', '#8b5cf6')
      .attr('stroke', '#000')
      .attr('stroke-width', 1);

  }, [latencyData, isSimulatingLoad]);

  // 2. Bar Chart: Models Execution Latency Compare
  useEffect(() => {
    if (!barChartRef.current) return;

    const svgElement = d3.select(barChartRef.current);
    svgElement.selectAll('*').remove();

    const margin = { top: 15, right: 15, bottom: 30, left: 100 };
    const width = barChartRef.current.clientWidth - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const svg = svgElement
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const yScale = d3.scaleBand()
      .domain(modelLatencies.map(d => d.model))
      .range([0, height])
      .padding(0.25);

    const xScale = d3.scaleLinear()
      .domain([0, 240])
      .range([0, width]);

    // Horizontal bars
    svg.selectAll('.bar')
      .data(modelLatencies)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', d => yScale(d.model) || 0)
      .attr('x', 0)
      .attr('height', yScale.bandwidth())
      .attr('width', d => xScale(d.latency))
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .attr('opacity', 0.85);

    // Values labels inside/beside bars
    svg.selectAll('.label')
      .data(modelLatencies)
      .enter()
      .append('text')
      .attr('class', 'font-mono text-[9px] font-bold fill-white')
      .attr('y', d => (yScale(d.model) || 0) + yScale.bandwidth() / 2 + 3)
      .attr('x', d => xScale(d.latency) + 5)
      .text(d => `${d.latency} ms`);

    // Axes
    const yAxis = d3.axisLeft(yScale).tickSize(0);
    svg.append('g')
      .attr('class', 'text-white/80 font-mono text-[10px]')
      .call(yAxis)
      .select('.domain').remove();

    const xAxis = d3.axisBottom(xScale).ticks(4);
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'text-white/40 font-mono text-[8px]')
      .call(xAxis)
      .selectAll('line')
      .attr('stroke', 'rgba(255,255,255,0.05)');

  }, [modelLatencies]);

  // 3. Donut Chart: API request efficiency
  useEffect(() => {
    if (!donutChartRef.current) return;

    const svgElement = d3.select(donutChartRef.current);
    svgElement.selectAll('*').remove();

    const width = donutChartRef.current.clientWidth;
    const height = 180;
    const radius = Math.min(width, height) / 2 - 10;

    const svg = svgElement
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<EfficiencyData>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<EfficiencyData>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const arcs = svg.selectAll('.arc')
      .data(pie(efficiencyStats))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', 'rgba(0,0,0,0.4)')
      .attr('stroke-width', 2)
      .attr('opacity', 0.85);

    // Center count
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('class', 'fill-white font-mono font-bold text-lg')
      .text(`${requestSuccessRate}%`);

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1em')
      .attr('class', 'fill-white/40 font-mono text-[8px] uppercase tracking-wider')
      .text('Erfolgsquote');

  }, [efficiencyStats, requestSuccessRate]);

  // 4. Memory Heap Area Area Chart
  useEffect(() => {
    if (!areaChartRef.current || memoryData.length === 0) return;

    const svgElement = d3.select(areaChartRef.current);
    svgElement.selectAll('*').remove();

    const margin = { top: 15, right: 15, bottom: 30, left: 40 };
    const width = areaChartRef.current.clientWidth - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    const svg = svgElement
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleTime()
      .domain(d3.extent(memoryData, d => d.timestamp) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, 512]) // MB
      .range([height, 0]);

    // Draw horizontal grid lines
    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(yScale).ticks(4).tickSize(-width).tickFormat(() => ''));

    // Area path
    const area = d3.area<MemoryDataPoint>()
      .x(d => xScale(d.timestamp))
      .y0(height)
      .y1(d => yScale(d.heapUsed))
      .curve(d3.curveMonotoneX);

    // Linear gradient for memory load
    const memGrad = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'mem-grad')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    memGrad.append('stop').attr('offset', '0%').attr('stop-color', '#a855f7').attr('stop-opacity', 0.5);
    memGrad.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.05);

    svg.append('path')
      .datum(memoryData)
      .attr('fill', 'url(#mem-grad)')
      .attr('d', area);

    // Memory border line
    const line = d3.line<MemoryDataPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.heapUsed))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(memoryData)
      .attr('fill', 'none')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Max limit dashed line
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(350))
      .attr('y2', yScale(350))
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3');

    svg.append('text')
      .attr('x', 5)
      .attr('y', yScale(350) - 5)
      .attr('class', 'fill-amber-400 font-mono text-[7px] tracking-widest uppercase')
      .text('Limit für automatische Garbage-Collection (350 MB)');

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(4)
      .tickFormat(d3.timeFormat('%H:%M:%S') as any);
    
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'text-white/40 font-mono text-[8px]')
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale).ticks(4).tickFormat(d => `${d}M`);
    svg.append('g')
      .attr('class', 'text-white/40 font-mono text-[8px]')
      .call(yAxis);

  }, [memoryData]);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md space-y-8 select-none">
      
      {/* 1. Header with Platform Diagnostics Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
              <Gauge size={18} className="animate-pulse" />
            </span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              CAPITAL-AI Performance- & Diagnose-Zentrale (D3.js Engine)
            </h2>
          </div>
          <p className="text-xs text-white/50">
            Echtzeit-Telemetrie der Berechnungs-Latenzen, der API-Effizienz des Asset Registries und des Speicherprofils.
          </p>
        </div>

        {/* Load simulation controller */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSimulatingLoad(!isSimulatingLoad)}
            className={`px-4 py-2 rounded-lg font-mono text-[11px] font-bold uppercase tracking-wider border transition-all flex items-center gap-2 cursor-pointer ${
              isSimulatingLoad 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
            }`}
          >
            <Activity size={12} className={isSimulatingLoad ? 'animate-bounce' : ''} />
            <span>{isSimulatingLoad ? 'Simuliere Hochlast...' : 'Last simulieren'}</span>
          </button>

          <button
            onClick={triggerAutonomousCleaning}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={12} />
            <span>Memory Purge (Autonom)</span>
          </button>
        </div>
      </div>

      {/* 2. Platform Status Indicators (KPI Bento Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* KPI 1: Asset Registry */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Asset Registry</span>
            <Database size={14} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              {avgRegistryLatency} <span className="text-xs text-cyan-400 font-normal">ms</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-1.5 h-1.5 rounded-full ${avgRegistryLatency < 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[9px] font-mono text-white/40 uppercase">Optimiert (Cachung aktiv)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Simulations latency */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Modell-Simulations</span>
            <Cpu size={14} className="text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              {avgModelLatency} <span className="text-xs text-purple-400 font-normal">ms</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-1.5 h-1.5 rounded-full ${avgModelLatency < 160 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className="text-[9px] font-mono text-white/40 uppercase">Monte-Carlo & DCF</span>
            </div>
          </div>
        </div>

        {/* KPI 3: API Request Efficiency */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">API-Effizienz</span>
            <Zap size={14} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              {requestSuccessRate}%
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-mono text-white/40 uppercase">Toleranz & DSGVO Okay</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Memory Usage */}
        <div className="bg-black/30 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Arbeitsspeicher (Heap)</span>
            <Activity size={14} className="text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              {currentMemoryLoad} <span className="text-xs text-white/50">MB</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-1.5 h-1.5 rounded-full ${currentMemoryLoad < 250 ? 'bg-emerald-500' : currentMemoryLoad < 350 ? 'bg-amber-500' : 'bg-rose-500'}`} />
              <span className="text-[9px] font-mono text-white/40 uppercase">Limit: 512MB (Container)</span>
            </div>
          </div>
        </div>

      </div>

      {/* Alert Banner if Memory / Latency is too high */}
      <AnimatePresence>
        {alertTriggered && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">WARNUNG: Erhöhte Latenz / Speicherauslastung erkannt</h4>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Das System registriert eine Speicherauslastung über dem Grenzwert von 340 MB oder eine simulierte Modell-Spitzen-Latenz. 
                Die autonome <strong>4-Stunden-Regel</strong> wird im Hintergrund in Kürze den <strong>Purger-Agenten</strong> entsenden, um nicht genutzte Reports zu löschen und den RAM freizugeben. Du kannst den Agenten auch manuell oben rechts oder unten triggern.
              </p>
              <div className="pt-2">
                <button
                  onClick={triggerAutonomousCleaning}
                  className="px-3 py-1 bg-rose-500/20 text-rose-300 font-mono text-[9px] font-black uppercase tracking-wider rounded border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
                >
                  Autonomen Purger-Agenten jetzt erzwingen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Realtime Latency Line Chart (D3.js Core) */}
      <div className="bg-black/20 border border-white/5 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Asset Registry Latenz vs. Simulationen</span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ml-2" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Modell-Simulationen</span>
          </div>
          <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Live Updates alle 4 Sek</span>
        </div>

        {/* The Live D3 Line Chart */}
        <div className="w-full bg-black/40 border border-white/5 rounded-lg p-2">
          <svg ref={lineChartRef} className="w-full select-none" />
        </div>
      </div>

      {/* 4. Secondary Row: Latency Comparison, Donut API Efficiency, Memory Space */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bar chart - 5 Columns */}
        <div className="lg:col-span-5 bg-black/20 border border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Latenz nach Modell-Typ</h3>
            <span className="text-[9px] font-mono text-white/40">In Millisekunden</span>
          </div>
          <div className="w-full bg-black/40 border border-white/5 rounded-lg p-2 flex items-center justify-center">
            <svg ref={barChartRef} className="w-full" />
          </div>
        </div>

        {/* Donut chart - 3 Columns */}
        <div className="lg:col-span-3 bg-black/20 border border-white/5 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider text-center">API Request-Effizienz</h3>
          <div className="w-full bg-black/40 border border-white/5 rounded-lg p-2 flex flex-col items-center justify-center relative">
            <svg ref={donutChartRef} className="w-64" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
            {efficiencyStats.map((item) => (
              <div key={item.category} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-white/60 truncate">{item.category}:</span>
                <span className="text-white font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Memory Space Area - 4 Columns */}
        <div className="lg:col-span-4 bg-black/20 border border-white/5 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Arbeitsspeicher Verlauf</h3>
            <span className="text-[9px] font-mono text-white/40">Heap Used</span>
          </div>
          <div className="w-full bg-black/40 border border-white/5 rounded-lg p-2 flex items-center justify-center">
            <svg ref={areaChartRef} className="w-full" />
          </div>
        </div>

      </div>

      {/* 5. Autonomous Purging Rule (Linked back to the 4-Hour Rule) */}
      <div className="bg-gradient-to-r from-blue-950/20 via-zinc-950/40 to-purple-950/20 border border-white/10 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold uppercase">Aktiv</span>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Regel-Verknüpfung: Autonomer Bereinigungs-Zyklus (4h)</h4>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              Die Plattform erzwingt alle 4 Stunden eine automatische Garbage Collection. Nicht genutzte Berichte, temporäre Berechnungs-Matrizen und veraltete Daten des Asset Registries werden gelöscht, um Ressourcen freizugeben. Bisher wurden bereits <strong>{autoOptimizedCount}</strong> Optimierungen autonom vorgenommen.
            </p>
          </div>

          <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center shrink-0 min-w-[160px]">
            <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest block">Letzter Zyklus-Run</span>
            <div className="text-xs font-bold text-emerald-400 font-mono mt-1">{lastOptimizationTime}</div>
            <span className="text-[8px] text-white/50 block mt-0.5 font-mono">Status: Gesund</span>
          </div>
        </div>
      </div>

    </div>
  );
}
