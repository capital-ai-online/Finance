import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Orbit, Activity, RefreshCw, SlidersHorizontal, RotateCcw, X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type MoodState = 'Calm Slate' | 'Bullish Cyber' | 'Analytical Neon' | 'Nebula Cosmic';

interface QuantumAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  type: string;
  score: number;
}

interface QuantumGraphProps {
  currentMood: MoodState;
  selectedUniverse: string;
  activeFormulaBlocks: string[];
  formulaWeights: Record<string, number>;
  liveAssets: QuantumAsset[];
  pipelineState: 'idle' | 'orchestrating' | 'completed';
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'universe' | 'formula' | 'asset' | 'orchestrator' | 'architect';
  color?: string;
  size: number;
  val?: string | number;
  active?: boolean;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'data' | 'control' | 'influence';
  active?: boolean;
}

export function QuantumGraph({
  currentMood,
  selectedUniverse,
  activeFormulaBlocks,
  formulaWeights,
  liveAssets,
  pipelineState
}: QuantumGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  // Real-time Force Simulation Parameter States
  const [charge, setCharge] = useState<number>(-180);
  const [linkDistance, setLinkDistance] = useState<number>(100);
  const [collisionRadius, setCollisionRadius] = useState<number>(15);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true); // default open so user discovers it easily

  // Monitor container size dynamically to keep visualization perfectly responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 350)
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Determine colors based on active mood state
  const getThemeColors = () => {
    switch (currentMood) {
      case 'Bullish Cyber':
        return {
          primary: '#10b981', // emerald-500
          secondary: '#34d399',
          glow: 'rgba(16,185,129,0.4)',
          text: '#a7f3d0',
          link: 'rgba(16,185,129,0.2)'
        };
      case 'Calm Slate':
        return {
          primary: '#64748b', // slate-500
          secondary: '#94a3b8',
          glow: 'rgba(100,116,139,0.3)',
          text: '#cbd5e1',
          link: 'rgba(100,116,139,0.15)'
        };
      case 'Nebula Cosmic':
        return {
          primary: '#a855f7', // purple-500
          secondary: '#c084fc',
          glow: 'rgba(168,85,247,0.4)',
          text: '#e9d5ff',
          link: 'rgba(168,85,247,0.2)'
        };
      default: // Analytical Neon
        return {
          primary: '#06b6d4', // cyan-500
          secondary: '#22d3ee',
          glow: 'rgba(6,182,212,0.4)',
          text: '#cffafe',
          link: 'rgba(6,182,212,0.2)'
        };
    }
  };

  const theme = getThemeColors();

  useEffect(() => {
    if (!svgRef.current) return;

    // Filter down live assets for visualization to avoid visual clutter
    const filteredAssets = liveAssets
      .filter((asset) => {
        if (selectedUniverse === 'crypto_cosmos') return asset.type === 'crypto';
        if (selectedUniverse === 'stock_galaxy') return asset.type === 'stock';
        if (selectedUniverse === 'forex_nebula') return asset.type === 'forex';
        return asset.type === 'commodity';
      })
      .slice(0, 5); // Pick top 5 active assets in universe

    // 1. Build the Node set
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Base core engine nodes
    const rootUniverseNode: GraphNode = {
      id: 'universe_root',
      label: selectedUniverse === 'crypto_cosmos' ? 'Crypto Cosmos' :
             selectedUniverse === 'stock_galaxy' ? 'Stock Galaxy' :
             selectedUniverse === 'forex_nebula' ? 'Forex Nebula' : 'Commodity Nebula',
      type: 'universe',
      size: 24,
      val: `Universe ID: ${selectedUniverse}`,
      active: true,
      x: dimensions.width * 0.25,
      y: dimensions.height * 0.5
    };
    nodes.push(rootUniverseNode);

    // Formula nodes
    const formulaNodesList: { id: string; name: string; formula: string }[] = [
      { id: 'dcf_factor', name: 'Graham DCF', formula: 'V* = EPS*(8.5+2g)*4.4/Y' },
      { id: 'volatility_drift', name: 'Brownian Drift', formula: 'dS_t = μS_tdt + σS_tdW_t' },
      { id: 'sentiment_velocity', name: 'Sentiment Vel', formula: 'V_s = ΔSent / Δt' },
      { id: 'liquidity_index', name: 'Liquidity Ratio', formula: 'L_r = ΣBid / ΣAsk' }
    ];

    formulaNodesList.forEach((form, idx) => {
      const isActive = activeFormulaBlocks.includes(form.id);
      const coeff = formulaWeights[form.id] || 1.0;
      const fNode: GraphNode = {
        id: `formula_${form.id}`,
        label: form.name,
        type: 'formula',
        size: 18,
        val: `${form.formula} (Coeff: ${coeff}x)`,
        active: isActive,
        x: dimensions.width * 0.5,
        y: (dimensions.height * 0.2) + (idx * dimensions.height * 0.2)
      };
      nodes.push(fNode);

      // Connect universe to active formulas
      if (isActive) {
        links.push({
          source: 'universe_root',
          target: fNode.id,
          type: 'data',
          active: true
        });
      }
    });

    // Pipeline Engine nodes
    const finOrchNode: GraphNode = {
      id: 'fin_orchestrator',
      label: 'Finanz-Orchestrator',
      type: 'orchestrator',
      size: 20,
      val: 'Consolidates formula weight products',
      active: pipelineState !== 'idle',
      x: dimensions.width * 0.7,
      y: dimensions.height * 0.4
    };
    const designArchNode: GraphNode = {
      id: 'design_architect',
      label: 'Design-Architekt',
      type: 'architect',
      size: 16,
      val: `Stimmungs-Vektor: ${currentMood}`,
      active: true,
      x: dimensions.width * 0.7,
      y: dimensions.height * 0.7
    };
    const frontendOrchNode: GraphNode = {
      id: 'frontend_orchestrator',
      label: 'Frontend-Orchestrator',
      type: 'orchestrator',
      size: 22,
      val: 'Pipes rendered pipeline back into active DOM UI',
      active: pipelineState === 'completed',
      x: dimensions.width * 0.88,
      y: dimensions.height * 0.5
    };

    nodes.push(finOrchNode, designArchNode, frontendOrchNode);

    // Links for core orchestrator flow
    formulaNodesList.forEach((form) => {
      if (activeFormulaBlocks.includes(form.id)) {
        links.push({
          source: `formula_${form.id}`,
          target: 'fin_orchestrator',
          type: 'data',
          active: pipelineState !== 'idle'
        });
      }
    });

    links.push({
      source: 'fin_orchestrator',
      target: 'frontend_orchestrator',
      type: 'control',
      active: pipelineState === 'completed'
    });

    links.push({
      source: 'design_architect',
      target: 'frontend_orchestrator',
      type: 'influence',
      active: true
    });

    // Asset nodes attached to universe
    filteredAssets.forEach((asset, idx) => {
      const assetId = `asset_${asset.id}`;
      const assetNode: GraphNode = {
        id: assetId,
        label: asset.symbol,
        type: 'asset',
        size: 14,
        val: `${asset.name} - Preis: ${asset.price.toLocaleString()} $ (${asset.change24h}%)`,
        active: true,
        x: dimensions.width * 0.1,
        y: (dimensions.height * 0.15) + (idx * dimensions.height * 0.16)
      };
      nodes.push(assetNode);

      links.push({
        source: assetId,
        target: 'universe_root',
        type: 'data',
        active: true
      });
    });

    // 2. Setup D3 svg layout
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous layouts

    // Create marker pointers for flows
    svg.append('defs')
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 18)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', theme.primary)
      .attr('opacity', 0.6);

    // Add glowing filter todefs
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', 4)
      .attr('result', 'blur');

    filter.append('feMerge')
      .selectAll('feMergeNode')
      .data(['blur', 'SourceGraphic'])
      .enter()
      .append('feMergeNode')
      .attr('in', (d) => d);

    // Grouping container
    const g = svg.append('g');

    // 3. Initiate Force Simulation
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance((link) => {
          if (link.type === 'control') return linkDistance * 0.8;
          if (link.type === 'influence') return linkDistance * 0.6;
          return linkDistance;
        })
      )
      .force('charge', d3.forceManyBody().strength(charge))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.size + collisionRadius));

    // Render link paths
    const linkElements = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => d.active ? theme.primary : '#334155')
      .attr('stroke-opacity', (d) => d.active ? 0.7 : 0.25)
      .attr('stroke-width', (d) => d.active ? 2 : 1)
      .attr('stroke-dasharray', (d) => {
        if (d.type === 'influence') return '3,3';
        if (d.type === 'control') return '5,5';
        return 'none';
      })
      .attr('marker-end', 'url(#arrow)');

    // Particle flow animations on link channels
    let particleGroup = g.append('g').attr('class', 'particles');
    
    // Draw animated pulse circles on active flows
    const activeLinks = links.filter(l => l.active);
    const particles = particleGroup.selectAll('circle')
      .data(activeLinks)
      .enter()
      .append('circle')
      .attr('r', 2.5)
      .attr('fill', theme.secondary)
      .attr('filter', 'url(#glow)');

    // Render node groups
    const nodeElements = g.append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      )
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        // Trigger rapid shockwave rings around clicked node for fun quantum interactions
        const currentTarget = d3.select(event.currentTarget);
        currentTarget.append('circle')
          .attr('r', d.size)
          .attr('fill', 'none')
          .attr('stroke', theme.primary)
          .attr('stroke-width', 2)
          .attr('opacity', 0.8)
          .transition()
          .duration(800)
          .attr('r', d.size * 3.5)
          .attr('opacity', 0)
          .remove();
      });

    // Draw node shapes (circles with custom styles per type)
    nodeElements.append('circle')
      .attr('r', (d) => d.size)
      .attr('fill', (d) => {
        if (!d.active) return '#1e293b'; // off gray
        if (d.type === 'universe') return 'url(#universeGrad)';
        if (d.type === 'formula') return '#090d16';
        if (d.type === 'asset') return 'rgba(255, 255, 255, 0.05)';
        return theme.primary;
      })
      .attr('stroke', (d) => {
        if (!d.active) return '#475569';
        if (d.type === 'formula') return theme.primary;
        if (d.type === 'asset') return theme.secondary;
        return theme.primary;
      })
      .attr('stroke-width', (d) => d.type === 'universe' || d.type === 'orchestrator' ? 3 : 1.5)
      .attr('filter', (d) => d.active ? 'url(#glow)' : 'none')
      .style('cursor', 'grab');

    // Add unique icons/symbols directly inside larger nodes
    nodeElements.each(function(d) {
      if (d.type === 'universe') {
        d3.select(this).append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.3em')
          .attr('fill', '#ffffff')
          .attr('font-size', '10px')
          .attr('font-weight', 'black')
          .attr('font-family', 'monospace')
          .text('Ω');
      } else if (d.type === 'formula') {
        d3.select(this).append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '.33em')
          .attr('fill', theme.secondary)
          .attr('font-size', '8px')
          .attr('font-weight', 'bold')
          .attr('font-family', 'monospace')
          .text('f(x)');
      }
    });

    // Render text label indicators beneath nodes
    nodeElements.append('text')
      .attr('dy', (d) => d.size + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => d.active ? '#ffffff' : '#475569')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', (d) => d.type === 'universe' || d.type === 'orchestrator' ? 'bold' : 'normal')
      .text((d) => d.label);

    // Custom linear gradients for primary source nodes
    const grad = defs.append('linearGradient')
      .attr('id', 'universeGrad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%');

    grad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', theme.primary);

    grad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1e1b4b'); // deep indigo

    // 4. Update elements position in real time using simulation engine tick
    let particleOffset = 0;
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

      // Calculate particle progress positions along active lines
      particleOffset += pipelineState === 'orchestrating' ? 0.04 : 0.012;
      if (particleOffset > 1) particleOffset = 0;

      particles
        .attr('cx', (d: any) => {
          const x1 = d.source.x;
          const x2 = d.target.x;
          return x1 + (x2 - x1) * particleOffset;
        })
        .attr('cy', (d: any) => {
          const y1 = d.source.y;
          const y2 = d.target.y;
          return y1 + (y2 - y1) * particleOffset;
        });
    });

    // Drag handlers
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [selectedUniverse, activeFormulaBlocks, formulaWeights, liveAssets, dimensions, currentMood, pipelineState, theme.primary, theme.secondary, charge, linkDistance, collisionRadius]);

  return (
    <div className="relative w-full border border-white/5 bg-black/45 rounded-xl p-4 overflow-hidden" ref={containerRef}>
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[11px] font-mono text-white/80 uppercase tracking-widest flex items-center gap-1">
          <Activity size={12} className="text-cyan-400" />
          Realtime D3 Graph: Coalesced Pipelines
        </span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2 z-30">
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 active:scale-95 transition px-2.5 py-1 rounded border border-white/10 text-[11px] font-mono text-white/85 cursor-pointer shadow-lg backdrop-blur-sm"
        >
          <SlidersHorizontal size={12} className={isPanelOpen ? "text-cyan-400" : "text-white/60"} />
          <span>{isPanelOpen ? 'Panel ausblenden' : 'Kräfte anpassen'}</span>
        </button>
      </div>

      {/* Floating Control Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 15 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 15 }}
            className="absolute top-12 right-3 w-72 bg-black/90 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-md z-30 font-mono"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings size={12} className="text-cyan-400 animate-spin-slow" />
                Simulation Parameter
              </span>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="text-white/40 hover:text-white/80 transition"
              >
                <X size={12} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Charge Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/70">Abstoßung (Charge)</span>
                  <span className="text-cyan-400 font-bold">{charge}</span>
                </div>
                <input
                  type="range"
                  min="-500"
                  max="-50"
                  step="10"
                  value={charge}
                  onChange={(e) => setCharge(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[11px] text-white/65 block">
                  Reguliert den Druck zwischen den Nodes.
                </span>
              </div>

              {/* Link Distance Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/70">Verbindungsabstand</span>
                  <span className="text-cyan-400 font-bold">{linkDistance}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="250"
                  step="5"
                  value={linkDistance}
                  onChange={(e) => setLinkDistance(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[11px] text-white/65 block">
                  Definiert die Ziel-Länge der Datenkanäle.
                </span>
              </div>

              {/* Collision Radius Control */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-white/70">Kollisionspuffer</span>
                  <span className="text-cyan-400 font-bold">{collisionRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="1"
                  value={collisionRadius}
                  onChange={(e) => setCollisionRadius(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span className="text-[11px] text-white/65 block">
                  Verhindert die Überlappung von Elementen.
                </span>
              </div>

              {/* Reset to Defaults */}
              <button
                onClick={() => {
                  setCharge(-180);
                  setLinkDistance(100);
                  setCollisionRadius(15);
                }}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[11px] text-white/80 hover:text-white transition cursor-pointer"
              >
                <RotateCcw size={10} />
                Standards zurücksetzen
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG canvas workspace */}
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block w-full h-full select-none"
      />

      {/* Dynamic Hover Tooltip inside canvas box */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-black/90 border border-white/10 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl z-20 pointer-events-none font-mono"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-1.5">
              <span className="text-[11px] font-black text-white uppercase tracking-wider">
                {hoveredNode.label}
              </span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded ${
                hoveredNode.active 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-white/10 text-white/60'
              }`}>
                {hoveredNode.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-[11px] text-white/70 leading-relaxed">
              {hoveredNode.val}
            </p>
            <div className="mt-2 flex justify-between text-[11px] text-white/65">
              <span>TYPE: {hoveredNode.type.toUpperCase()}</span>
              <span>NODE SIZE: {hoveredNode.size}px</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
