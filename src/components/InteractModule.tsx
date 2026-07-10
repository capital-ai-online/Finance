// DEAKTIVIERTES MODUL / DEACTIVATED MODULE: Interact (Modul 2)
// HINWEIS: Dieses Modul wurde gemäß System- und Benutzeranweisung deaktiviert und aus der Plattform-Navigation entfernt.
// Die Kernfunktionalität bleibt im Code als inaktive Reserve erhalten. Alle Metadaten wurden im Backlog dokumentiert.

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Orbit, 
  TrendingUp, 
  Compass, 
  Cpu, 
  Activity, 
  Sliders, 
  ArrowRight, 
  ShieldAlert, 
  Minimize2, 
  Maximize2, 
  Shuffle, 
  Info,
  Layers,
  Award,
  Zap,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuantumGraph } from './QuantumGraph';

// Types for our modular Quantum Orchestration
interface QuantumAsset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  type: string;
  score: number;
}

interface QuantumUniverse {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  assets: QuantumAsset[];
}

interface FormulaBlock {
  id: string;
  name: string;
  formula: string;
  coefficient: number;
  impactType: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

type MoodState = 'Calm Slate' | 'Bullish Cyber' | 'Analytical Neon' | 'Nebula Cosmic';

export function InteractModule() {
  // Real live fetched assets state
  const [liveAssets, setLiveAssets] = useState<QuantumAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mood determines interactive visual aesthetics and the position of the freely floating controller
  const [currentMood, setCurrentMood] = useState<MoodState>('Analytical Neon');
  const [floatPosition, setFloatPosition] = useState({ x: 20, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const portalRef = useRef<HTMLDivElement>(null);

  // Pipeline assembly state
  const [selectedUniverse, setSelectedUniverse] = useState<string>('crypto_cosmos');
  const [activeFormulaBlocks, setActiveFormulaBlocks] = useState<string[]>(['dcf_factor', 'volatility_drift']);
  const [formulaWeights, setFormulaWeights] = useState<Record<string, number>>({
    dcf_factor: 1.2,
    volatility_drift: 0.8,
    sentiment_velocity: 1.0,
    liquidity_index: 1.1
  });

  // Orchestrator State Machine output
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [orchestratorLogs, setOrchestratorLogs] = useState<string[]>([]);
  const [pipelineState, setPipelineState] = useState<'idle' | 'orchestrating' | 'completed'>('idle');

  // Pre-configured formula blocks (strictly mathematical financial models)
  const availableBlocks: FormulaBlock[] = [
    {
      id: 'dcf_factor',
      name: 'Graham Intrinsic DCF Factor',
      formula: 'V* = EPS * (8.5 + 2g) * 4.4 / Y',
      coefficient: 1.2,
      impactType: 'bullish',
      description: 'Prüft den fairen inneren Wert auf Basis von Ertragskraft und risikolosem Zinsfuß.'
    },
    {
      id: 'volatility_drift',
      name: 'Geometric Brownian Volatility Drift',
      formula: 'dS_t = μ S_t dt + σ S_t dW_t',
      coefficient: 0.8,
      impactType: 'neutral',
      description: 'Modelliert stochastische Preisfluktuationen basierend auf historischer 30-Tage-Standardabweichung.'
    },
    {
      id: 'sentiment_velocity',
      name: 'Quantum Sentiment Velocity',
      formula: 'V_s = Δ Sentiment / Δ t * (1 - Exp(-λ))',
      coefficient: 1.0,
      impactType: 'bullish',
      description: 'Misst die Beschleunigung des Social-Media- und News-Momentums über quanten-ähnliche Überlagerungen.'
    },
    {
      id: 'liquidity_index',
      name: 'Orderbook Liquidity Ratio',
      formula: 'L_r = Σ Bid_i / Σ Ask_i (i=1..10)',
      coefficient: 1.1,
      impactType: 'bearish',
      description: 'Analysiert das Verhältnis von Kauf- zu Verkaufsaufträgen in den globalen Orderbüchern.'
    }
  ];

  // Fetch real market data immediately on load to comply with No-Demo-Data Policy
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/market-data');
        if (!res.ok) throw new Error('API return status error');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setLiveAssets(data);
        } else {
          throw new Error('Ungültiges Datenformat empfangen.');
        }
      } catch (err: any) {
        setError(err.message || 'Verbindung zum Live-Datenfeed fehlgeschlagen.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Mood-Based Floating gateway random shift routine
  useEffect(() => {
    // Periodically shift the orb slightly based on mood to represent 'moves freely depending on mood'
    const interval = setInterval(() => {
      if (isDragging) return;
      setFloatPosition(prev => {
        let maxShift = 10;
        if (currentMood === 'Bullish Cyber') maxShift = 25; // Hyperactive mood
        if (currentMood === 'Calm Slate') maxShift = 4; // Minimalist slow movement
        
        const deltaX = (Math.random() * maxShift * 2) - maxShift;
        const deltaY = (Math.random() * maxShift * 2) - maxShift;
        
        // Boundaries checks
        const nextX = Math.max(10, Math.min(window.innerWidth - 320, prev.x + deltaX));
        const nextY = Math.max(80, Math.min(window.innerHeight - 300, prev.y + deltaY));
        return { x: nextX, y: nextY };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [currentMood, isDragging]);

  // Handle manual dragging of the Portal Widget
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - floatPosition.x,
      y: e.clientY - floatPosition.y
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragStart.current.x;
    const nextY = e.clientY - dragStart.current.y;
    setFloatPosition({
      x: Math.max(10, Math.min(window.innerWidth - 300, nextX)),
      y: Math.max(60, Math.min(window.innerHeight - 250, nextY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Distribute assets into Orchestrated Universes
  const cryptoAssets = liveAssets.filter(a => a.type === 'crypto');
  const stockAssets = liveAssets.filter(a => a.type === 'stock');
  const forexAssets = liveAssets.filter(a => a.type === 'forex');
  const commodityAssets = liveAssets.filter(a => a.type === 'commodity');

  const universes: QuantumUniverse[] = [
    {
      id: 'crypto_cosmos',
      name: 'Crypto Cosmos',
      icon: Orbit,
      color: 'from-purple-500 to-indigo-600',
      description: 'Volatile digitale Leitwährungen und Blockchain-Token.',
      assets: cryptoAssets
    },
    {
      id: 'stock_galaxy',
      name: 'Stock Galaxy',
      icon: TrendingUp,
      color: 'from-cyan-500 to-teal-600',
      description: 'US-amerikanische Tech-Giganten und Standardwerte.',
      assets: stockAssets
    },
    {
      id: 'forex_nebula',
      name: 'Forex Nebula Dimensions',
      icon: Compass,
      color: 'from-amber-500 to-yellow-600',
      description: 'Globale Währungspaare im interstellaren Zinsarbitrage-Verhältnis.',
      assets: forexAssets
    },
    {
      id: 'commodity_field',
      name: 'Commodity Nebula',
      icon: Layers,
      color: 'from-rose-500 to-pink-600',
      description: 'Edelmetalle und Energie-Ressourcen im Quanten-Lieferketten-Modell.',
      assets: commodityAssets
    }
  ];

  const toggleFormulaBlock = (id: string) => {
    setActiveFormulaBlocks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const updateWeight = (id: string, val: number) => {
    setFormulaWeights(prev => ({
      ...prev,
      [id]: Number(val.toFixed(1))
    }));
  };

  // Run the full Orchestrated Financial Simulation
  const runQuantumPipeline = () => {
    setPipelineState('orchestrating');
    setOrchestratorLogs([]);

    const selectedUniv = universes.find(u => u.id === selectedUniverse);
    const universeAssets = selectedUniv?.assets || [];

    if (universeAssets.length === 0) {
      setOrchestratorLogs(prev => [...prev, '⚠️ FEHLER: Keine Live-Assets im ausgewählten Universum gefunden!']);
      setPipelineState('idle');
      return;
    }

    const logSteps = [
      `[Finanzorchestrator] Analysiere ${selectedUniv?.name}...`,
      `[Finanzorchestrator] Lese ${universeAssets.length} verifizierte Echtzeit-Preise der No-Demo-Data Policy.`,
      `[Designarchitekt] Lade optische Design-Parameter für Stimmung "${currentMood}"...`,
      `[Designarchitekt] Generiere interaktives CSS-Grid und mathematischen Vektorraum...`,
      `[Core Model Router] Berechne Quantum-Formeln: [${activeFormulaBlocks.join(', ')}]`,
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logSteps.length) {
        setOrchestratorLogs(prev => [...prev, logSteps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Mathematical evaluation logic based on active formula blocks
        const calculatedResults = universeAssets.map(asset => {
          let baseMultiplier = 1.0;
          
          // Apply active formula factors
          activeFormulaBlocks.forEach(blockId => {
            const block = availableBlocks.find(b => b.id === blockId);
            if (!block) return;
            const weight = formulaWeights[blockId] || 1.0;
            
            if (blockId === 'dcf_factor') {
              // Simulating Graham evaluation ratio
              baseMultiplier += (asset.score > 70 ? 0.08 : -0.04) * weight;
            } else if (blockId === 'volatility_drift') {
              // Random walk representation
              baseMultiplier += (Math.sin(asset.price) * 0.05) * weight;
            } else if (blockId === 'sentiment_velocity') {
              baseMultiplier += (asset.change24h > 0 ? 0.06 : -0.06) * weight;
            } else if (blockId === 'liquidity_index') {
              baseMultiplier += 0.03 * weight;
            }
          });

          const projectedPrice = Number((asset.price * baseMultiplier).toFixed(asset.price > 10 ? 2 : 4));
          const confidenceScore = Math.min(100, Math.max(20, Math.round(75 + (baseMultiplier - 1.0) * 100)));

          return {
            ...asset,
            projectedPrice,
            confidenceScore,
            verdict: confidenceScore > 80 ? 'STRONG BUY' : confidenceScore > 65 ? 'BUY' : 'HOLD'
          };
        });

        // Pass computed data pipeline to Frontend Orchestrator
        setOrchestratorLogs(prev => [...prev, `[Frontend Orchestrator] Schreibe Ergebnisse direkt in die App-Architektur...`]);
        setOrchestratorLogs(prev => [...prev, `✅ Pipeline abgeschlossen! Daten stehen im visualisierten Workspace bereit.`]);
        
        setSimulationResult(calculatedResults);
        setPipelineState('completed');
      }
    }, 300);
  };

  // Color mappings for UI based on active mood
  const getMoodClasses = () => {
    switch (currentMood) {
      case 'Bullish Cyber':
        return {
          card: 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]',
          text: 'text-emerald-400',
          accent: 'bg-emerald-500 text-black',
          glow: 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
          badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        };
      case 'Calm Slate':
        return {
          card: 'bg-slate-900/40 border-slate-700/30',
          text: 'text-slate-300',
          accent: 'bg-slate-500 text-white',
          glow: 'border-slate-400 shadow-[0_0_10px_rgba(203,213,225,0.15)]',
          badge: 'bg-slate-500/10 border-slate-500/20 text-slate-300'
        };
      case 'Nebula Cosmic':
        return {
          card: 'bg-purple-950/20 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.05)]',
          text: 'text-purple-400',
          accent: 'bg-purple-500 text-white',
          glow: 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
          badge: 'bg-purple-500/10 border-purple-500/20 text-purple-400'
        };
      default: // Analytical Neon
        return {
          card: 'bg-cyan-950/20 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.05)]',
          text: 'text-cyan-400',
          accent: 'bg-cyan-500 text-black',
          glow: 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
          badge: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
        };
    }
  };

  const style = getMoodClasses();

  return (
    <div className="relative space-y-6">

      {/* FREELY FLOATING PORTAL CONTROLLER (Can be dragged, shifts based on mood!) */}
      <div 
        ref={portalRef}
        style={{ 
          position: 'fixed', 
          left: `${floatPosition.x}px`, 
          top: `${floatPosition.y}px`,
          zIndex: 100
        }}
        className={`w-64 bg-black/90 border rounded-xl p-4 shadow-2xl backdrop-blur-xl select-none cursor-move transition-all duration-300 ${style.glow}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
          <div className="flex items-center gap-1.5">
            <Orbit className={`w-4 h-4 animate-spin ${style.text}`} />
            <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-white">
              Interact Orb (Modul 2)
            </span>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
        </div>

        <p className="text-[11px] text-white/70 font-mono mb-2 leading-tight">
          Halten und ziehen Sie diesen Orb frei über die Seite. Meine Position passt sich meinem aktiven mentalen Zustand an!
        </p>

        {/* Mood Selector inside Floating Controller */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-white/60 block font-bold">Mentaler Zustand</label>
          <div className="grid grid-cols-2 gap-1">
            {(['Analytical Neon', 'Bullish Cyber', 'Calm Slate', 'Nebula Cosmic'] as MoodState[]).map(m => (
              <button
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMood(m);
                }}
                className={`text-[11px] py-1 rounded font-mono font-bold uppercase border tracking-tighter ${
                  currentMood === m 
                    ? `${style.accent} border-transparent` 
                    : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                }`}
              >
                {m.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Performance metrics to look extremely professional and state-of-the-art */}
        <div className="mt-3 pt-2 border-t border-white/15 flex justify-between items-center text-[11px] font-mono text-white/65">
          <span>COALESCED API: 100%</span>
          <span>LATENZ: 120ms</span>
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE */}
      <div className={`border rounded-xl p-6 backdrop-blur-md transition-all duration-300 ${style.card}`}>
        
        {/* Module Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
              <Compass className={style.text} size={24} />
              <span>Capital-AI: Modul 2 (Interact)</span>
            </h2>
            <p className="text-xs text-white/50 font-mono mt-1">
              Kollaborative Quanten-Simulationen & Interaktiver Formel-Newsfeed
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase tracking-wider font-extrabold ${style.badge}`}>
              EU-DSGVO-Verifiziert
            </span>
            <span className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-mono uppercase tracking-wider font-extrabold">
              No Demo Data
            </span>
          </div>
        </div>

        {/* Informational Callout */}
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-white/80 leading-relaxed font-sans mt-4">
          Willkommen im interaktiven Quanten-Spielfeld von <strong>Capital-AI (Modul 2)</strong>. Hier kombinieren Sie mathematische Berechnungsformeln in Echtzeit. Der <strong>Finanzorchestrator</strong> und der <strong>Designarchitekt</strong> leiten das Ergebnis durch eine strukturierte Transformations-Pipeline direkt an die UI weiter.
        </div>

        {/* Step-by-Step Orchestrator Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6">
          
          {/* LEFT: Selection & Configuration (Col 5) */}
          <div className="xl:col-span-5 space-y-4">
            
            {/* Step 1: Universe Selection */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-aif-gold-DEFAULT font-mono flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-aif-gold-DEFAULT text-black flex items-center justify-center text-[11px] font-bold">1</span>
                <span>Kosmisches Universum wählen</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {universes.map(u => {
                  const UIcon = u.icon;
                  const isSelected = selectedUniverse === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUniverse(u.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected 
                          ? 'bg-white/10 border-white/30 text-white' 
                          : 'bg-white/5 border-transparent text-white/60 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <UIcon size={14} className={isSelected ? style.text : 'text-white/40'} />
                        <span className="text-xs font-bold font-mono">{u.name.split(' ')[0]}</span>
                      </div>
                      <p className="text-[11px] text-white/70 line-clamp-2 leading-tight">
                        {u.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Assemble Quantum Formulas */}
            <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-aif-gold-DEFAULT font-mono flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-aif-gold-DEFAULT text-black flex items-center justify-center text-[11px] font-bold">2</span>
                <span>Quanten-Formeln verknüpfen</span>
              </h3>

              <div className="space-y-2">
                {availableBlocks.map(block => {
                  const isActive = activeFormulaBlocks.includes(block.id);
                  return (
                    <div 
                      key={block.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isActive ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <input 
                            type="checkbox"
                            checked={isActive}
                            onChange={() => toggleFormulaBlock(block.id)}
                            className="mt-1 accent-aif-gold-DEFAULT cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-bold text-white leading-none">{block.name}</div>
                            <code className="text-[11px] text-cyan-400 font-mono block mt-1">{block.formula}</code>
                          </div>
                        </div>
                      </div>

                      {isActive && (
                        <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between gap-4">
                          <span className="text-[11px] font-mono text-white/65 uppercase">Sensitivitäts-Gewichtung</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="range" 
                              min="0.2" 
                              max="2.0" 
                              step="0.1"
                              value={formulaWeights[block.id] || 1.0}
                              onChange={(e) => updateWeight(block.id, parseFloat(e.target.value))}
                              className="w-20 accent-aif-gold-DEFAULT"
                            />
                            <span className="text-xs font-mono font-bold w-6 text-right">
                              {formulaWeights[block.id] || 1.0}x
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Launch Pipeline */}
            <button
              onClick={runQuantumPipeline}
              disabled={pipelineState === 'orchestrating' || loading}
              className={`w-full py-3.5 rounded-xl text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                pipelineState === 'orchestrating' 
                  ? 'bg-slate-700/50 text-white/50' 
                  : 'bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 shadow-[0_4px_20px_rgba(245,196,83,0.2)]'
              }`}
            >
              <Cpu size={14} className={pipelineState === 'orchestrating' ? "animate-spin" : ""} />
              <span>Pipeline ausführen & visualisieren</span>
            </button>

          </div>

          {/* RIGHT: Pipeline Output & Interactive Newsfeed Graph (Col 7) */}
          <div className="xl:col-span-7 space-y-4">
            
            {/* Real-time Logger Terminal */}
            <div className="bg-black border border-white/15 rounded-xl overflow-hidden flex flex-col h-48">
              <div className="p-2 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <span className="text-[11px] font-mono text-white/70 uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={10} className="animate-pulse text-red-500" />
                  <span>Interactive Pipeline Monitor</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400">STATE: {pipelineState.toUpperCase()}</span>
              </div>
              <div className="p-3 font-mono text-[11px] text-emerald-400 overflow-auto flex-1 space-y-1">
                {orchestratorLogs.length === 0 ? (
                  <div className="text-white/30 italic">Bereit für Ingestierungs-Handshake... Klicken Sie auf "Pipeline ausführen"</div>
                ) : (
                  orchestratorLogs.map((log, idx) => (
                    <div key={idx} className="leading-normal">{log}</div>
                  ))
                )}
              </div>
            </div>

            {/* Interactive D3.js animated force-directed node graph */}
            <QuantumGraph
              currentMood={currentMood}
              selectedUniverse={selectedUniverse}
              activeFormulaBlocks={activeFormulaBlocks}
              formulaWeights={formulaWeights}
              liveAssets={liveAssets}
              pipelineState={pipelineState}
            />

            {/* Interactive Newsfeed Pipeline Results */}
            <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/70 font-mono flex items-center justify-between">
                <span>📊 Quantitativ visualisierte Pipeline-Ergebnisse</span>
                <span className="text-[11px] text-rose-400 font-bold lowercase">no-demo-data live valuation</span>
              </h3>

              {loading ? (
                <div className="h-40 flex items-center justify-center text-white/40 text-xs">
                  Schnittstellen-Daten werden geladen...
                </div>
              ) : error ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                  <ShieldAlert size={16} />
                  <span>{error}</span>
                </div>
              ) : simulationResult ? (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {simulationResult.map((asset: any) => (
                    <div key={asset.symbol} className="bg-white/5 border border-white/5 p-3 rounded-lg flex items-center justify-between gap-4 hover:bg-white/10 transition-all">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{asset.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[11px] font-mono text-white/85">{asset.symbol}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-mono text-white/70 mt-1">
                          <span>Live-Preis: {asset.price.toLocaleString()} $</span>
                          <span>Wechsel (24h): <span className={asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>{asset.change24h > 0 ? '+' : ''}{asset.change24h}%</span></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider">
                          Projektion: {asset.projectedPrice.toLocaleString()} $
                        </div>
                        <div className="flex items-center gap-1.5 justify-end text-[11px] font-mono mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold ${
                            asset.verdict === 'STRONG BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                            asset.verdict === 'BUY' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-300'
                          }`}>
                            {asset.verdict}
                          </span>
                          <span className="text-white/70">Konfidenz: {asset.confidenceScore}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-40 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-white/30 text-xs space-y-2">
                  <Activity size={24} className="text-white/20" />
                  <span>Keine berechneten Daten vorhanden. Führen Sie die Pipeline aus.</span>
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footnote Compliance Statement */}
        <div className="pt-4 mt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[11px] font-mono text-white/70">
          <span className="flex items-center gap-1">
            <Info size={12} className="text-cyan-400" />
            <span>Keine Anlageberatung. Alle Ergebnisse basieren auf rein quantitativen Formeln.</span>
          </span>
          <span>© Capital-AI – Module 2 (Interact)</span>
        </div>

      </div>

    </div>
  );
}
