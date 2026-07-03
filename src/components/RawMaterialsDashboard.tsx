/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Settings, 
  TrendingUp, 
  ShieldAlert, 
  Cpu, 
  Scale, 
  ChevronRight, 
  CheckCircle, 
  HelpCircle, 
  Sparkles,
  Database,
  Info,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line
} from 'recharts';
import { RAW_MATERIALS_DATABASE } from '../config/rawMaterialsConfig';
import { AnalysisPayload, RawMaterialInput } from '../types/rawMaterials';
import { assetRegistry } from '../lib/assetRegistry';

export function RawMaterialsDashboard() {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [materialsList, setMaterialsList] = useState<any[]>([]);

  // Active Analysis Payload
  const [selectedMaterial, setSelectedMaterial] = useState<string>('Kupfer');
  const [payload, setPayload] = useState<AnalysisPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Forward Curves data generator
  const forwardData = payload ? (() => {
    const matchedAsset = assetRegistry.getAssets().find(a => 
      a.name.toLowerCase() === payload.raw_material.toLowerCase() || 
      a.symbol.toLowerCase() === payload.raw_material.toLowerCase()
    );
    const symbol = matchedAsset ? matchedAsset.symbol : payload.raw_material.toUpperCase();
    const spotPrice = matchedAsset ? matchedAsset.price : 4200;
    
    const isOilOrGas = symbol.includes('BRENT') || symbol.includes('WTI') || symbol.includes('GAS');
    const isGoldOrSilver = symbol.includes('GOLD') || symbol.includes('SILVER') || symbol.includes('PLATINUM') || symbol === 'XAU' || symbol === 'XAG';
    
    // Deterministic market structure based on symbol
    let marketStructure: 'CONTANGO' | 'BACKWARDATION' = 'CONTANGO';
    if (isOilOrGas) {
      const charSum = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      marketStructure = charSum % 2 === 0 ? 'BACKWARDATION' : 'CONTANGO';
    } else if (isGoldOrSilver) {
      marketStructure = 'CONTANGO';
    } else {
      const charSum = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      marketStructure = charSum % 3 === 0 ? 'BACKWARDATION' : 'CONTANGO';
    }

    const months = ['Spot', 'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6', 'M+9', 'M+12'];
    const contractCodes = ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'];
    const currentMonthIdx = new Date().getMonth();
    
    const curveData = months.map((monthName, i) => {
      let priceCoeff = 1;
      let factor = (i * 0.008);
      
      if (marketStructure === 'CONTANGO') {
        priceCoeff = 1 + factor;
      } else {
        priceCoeff = 1 - factor * 0.85;
      }
      
      if (isOilOrGas || symbol.includes('COAL') || symbol.includes('WHEAT')) {
        priceCoeff += Math.sin(i * 1.2) * 0.015;
      }
      
      const targetMonthIdx = (currentMonthIdx + i) % 12;
      const yearCode = String(new Date().getFullYear() + Math.floor((currentMonthIdx + i) / 12)).substring(2);
      const contract = `${symbol}${contractCodes[targetMonthIdx]}${yearCode}`;
      const price = Number((spotPrice * priceCoeff).toFixed(2));
      const yieldPercent = Number(((price - spotPrice) / spotPrice * 100).toFixed(2));
      const costOfCarry = Number((spotPrice * (0.015 + i * 0.002)).toFixed(2));

      return {
        contract,
        month: monthName,
        price,
        yieldPercent,
        costOfCarry,
      };
    });

    const impliedInventory = marketStructure === 'CONTANGO' ? 'HOCH / REICHLICH' : 'KNAPP / NIEDRIG';
    const convenienceYield = marketStructure === 'BACKWARDATION' ? 4.25 : 0.85;

    return {
      symbol,
      spotPrice,
      marketStructure,
      curveData,
      impliedInventory,
      convenienceYield,
    };
  })() : null;

  // Manual Sandbox Tuning State
  const [sandboxMode, setSandboxMode] = useState(false);
  const [sandboxInput, setSandboxInput] = useState<Partial<RawMaterialInput>>({
    market_liquidity: 75,
    volatility: 40,
    trading_volume: 80,
    ore_grade: 85,
    tonnage: 70,
    tonnage_reserve: 75,
    substitution_potential: 30,
    recyclability: 65,
    processing_complexity: 45,
    infrastructure_availability: 80,
    extraction_costs: 50,
    geopolitical_risk: 35,
    supply_chain_risk: 40,
    regulatory_risk: 30,
    esg_risk: 50,
    producer_concentration: 60,
    military_importance: 40,
    industrial_importance: 90
  });

  // Load the initial list of materials from our API or static registry
  useEffect(() => {
    fetchMaterials();
  }, []);

  // Whenever selected material changes, run the orchestrated analysis
  useEffect(() => {
    if (selectedMaterial && !sandboxMode) {
      triggerAnalysis(selectedMaterial);
    }
  }, [selectedMaterial, sandboxMode]);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/raw-materials/list');
      if (res.ok) {
        const data = await res.json();
        setMaterialsList(data);
      } else {
        // Fallback to local keys if API not loaded yet
        const localList = Object.values(RAW_MATERIALS_DATABASE).map(item => ({
          symbol: item.symbol,
          name: item.name,
          category_main: item.category_main,
          category_sub: item.category_sub,
          is_critical: item.is_critical,
          score: 75 // Mock UI fallback initial score
        }));
        setMaterialsList(localList);
      }
    } catch (e) {
      console.warn("Could not fetch materials list from API, using fallback DB registry.", e);
    }
  };

  const triggerAnalysis = async (name: string, customInputs?: Partial<RawMaterialInput>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/raw-materials/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          customInput: customInputs
        })
      });

      if (!res.ok) {
        throw new Error('Fehler bei der Rohstoff-Analyse durch die Agenten.');
      }

      const data = await res.json();
      setPayload(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ein unerwarteter Verbindungsfehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSelect = (name: string) => {
    setSelectedMaterial(name);
    setSearchQuery('');
    setShowDropdown(false);
    setSandboxMode(false);
  };

  const handleSandboxCalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/raw-materials/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            name: selectedMaterial + " (Sandbox)",
            category_main: payload?.classification.category_main || 'Metal',
            ...sandboxInput
          }
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Fehler bei der Sandbox-Berechnung.');
      }

      const data = await res.json();
      setPayload(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Verbindungsfehler beim Berechnen des Scores.');
    } finally {
      setLoading(false);
    }
  };

  const syncSandboxWithPayload = () => {
    if (payload) {
      const inputs = payload.inputs;
      setSandboxInput({
        market_liquidity: inputs.market_liquidity,
        volatility: inputs.volatility,
        trading_volume: inputs.trading_volume,
        ore_grade: inputs.ore_grade,
        tonnage: inputs.tonnage,
        tonnage_reserve: inputs.tonnage_reserve,
        substitution_potential: inputs.substitution_potential,
        recyclability: inputs.recyclability,
        processing_complexity: inputs.processing_complexity,
        infrastructure_availability: inputs.infrastructure_availability,
        extraction_costs: inputs.extraction_costs,
        geopolitical_risk: inputs.geopolitical_risk,
        supply_chain_risk: inputs.supply_chain_risk,
        regulatory_risk: inputs.regulatory_risk,
        esg_risk: inputs.esg_risk,
        producer_concentration: inputs.producer_concentration,
        military_importance: inputs.military_importance,
        industrial_importance: inputs.industrial_importance
      });
    }
  };

  // Filter materials based on search query
  const filteredMaterials = materialsList.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category_sub.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-aif-gold-DEFAULT';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'bg-aif-gold-DEFAULT/10 border-aif-gold-DEFAULT/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="space-y-8">
      {/* Module Title Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-neutral-950 to-black p-6 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-aif-gold-DEFAULT/5 rounded-full filter blur-[80px] -z-10" />
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/25 tracking-widest uppercase">
              MODUL 1 - ERWEITERUNG
            </span>
            <span className="text-[11px] font-mono text-white/50 tracking-wider">Version 0.5.4 (Beta-Phase)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/90 to-[#D4A017] font-display tracking-tight uppercase">
            Rohstoff-Kategorisierung & AI-Scoring
          </h1>
          <p className="text-xs text-white/60 font-sans font-medium mt-1 leading-relaxed max-w-3xl">
            Zentralisierte Multi-Agenten-Architektur zur vollautomatischen Klassifizierung, geologischen Bewertung, geopolitischen Risiko-Analyse und strategischen Relevanzbewertung physischer & kritischer Rohstoffe.
          </p>
        </div>

        {/* Worker Threads Stats Card */}
        <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-xl flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20">
            <Cpu className="text-aif-gold-DEFAULT animate-spin" size={20} style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Master Orchestrator</div>
            <div className="text-xs font-mono font-black text-white">8 Workers / Parallel Processing</div>
          </div>
        </div>
      </div>

      {/* Autocomplete Search Bar & Hotkeys */}
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Rohstoff suchen... (z.B. Gold, Kupfer, Lithium, Kobalt, Erdgas, Weizen)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full bg-black/60 border border-white/15 focus:border-aif-gold-DEFAULT rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/30 tracking-wide font-sans focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-aif-gold-DEFAULT/50 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
            />
            
            {/* Real Autocomplete Dropdown */}
            <AnimatePresence>
              {showDropdown && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 mt-2 bg-black/95 border border-white/15 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 max-h-60 overflow-y-auto scrollbar-thin divide-y divide-white/5 backdrop-blur-xl"
                >
                  {filteredMaterials.length > 0 ? (
                    filteredMaterials.map((material) => (
                      <button
                        key={material.symbol || material.name}
                        onClick={() => handleSearchSelect(material.name)}
                        className="w-full text-left px-5 py-3 hover:bg-white/10 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-aif-gold-DEFAULT transition-colors font-display">
                            {material.name}
                          </p>
                          <p className="text-xs text-white/50">{material.category_sub}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {material.is_critical && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-500/10 border border-rose-500/20 text-rose-400">
                              KRITISCH
                            </span>
                          )}
                          <span className={`text-xs font-mono font-black ${getScoreColor(material.score)}`}>
                            {material.score} Pkt.
                          </span>
                          <ChevronRight size={14} className="text-white/30 group-hover:text-white" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-white/50">
                      Keine registrierten Rohstoffe gefunden. Tippe für Ad-hoc-Analyse.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['Lithium', 'Kupfer', 'Gold', 'Erdgas'].map((name) => (
              <button
                key={name}
                onClick={() => handleSearchSelect(name)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap ${
                  selectedMaterial === name && !sandboxMode
                    ? 'bg-aif-gold-DEFAULT text-black border-aif-gold-DEFAULT font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Scoring Cockpit Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Input Panel / Tuning Sandbox */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-neutral-950 to-black rounded-2xl border border-white/10 p-6 space-y-5 relative">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-base font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                <Sliders size={16} className="text-aif-gold-DEFAULT" />
                {sandboxMode ? 'Tuning Sandbox (Manuell)' : 'Stammdaten & Parameter'}
              </h2>
              <button
                onClick={() => {
                  setSandboxMode(!sandboxMode);
                  if (!sandboxMode) {
                    syncSandboxWithPayload();
                  }
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all border ${
                  sandboxMode 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {sandboxMode ? 'Reset / Agenten-Modus' : 'Sandbox aktivieren'}
              </button>
            </div>

            {sandboxMode ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 leading-relaxed flex gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>Sie befinden sich im <b>Sandbox-Modus</b>. Tunen Sie die Schieberegler manuell, um die Auswirkung auf den Gesamtscore in Echtzeit zu berechnen.</span>
                </div>

                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin">
                  {/* Section: Market */}
                  <div>
                    <h4 className="text-[10px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider mb-2">1. Markt & Liquidität</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/60 font-mono flex justify-between">
                        <span>Markt-Liquidität</span>
                        <span className="text-white font-bold">{sandboxInput.market_liquidity}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="100" value={sandboxInput.market_liquidity}
                        onChange={(e) => setSandboxInput({ ...sandboxInput, market_liquidity: parseInt(e.target.value) })}
                        className="w-full accent-aif-gold-DEFAULT h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Section: Fundamentals */}
                  <div className="pt-2 border-t border-white/5">
                    <h4 className="text-[10px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider mb-2">2. Geologie & Physische Daten</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/60 font-mono flex justify-between">
                        <span>Erzgehalt (Ore Grade)</span>
                        <span className="text-white font-bold">{sandboxInput.ore_grade}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="100" value={sandboxInput.ore_grade}
                        onChange={(e) => setSandboxInput({ ...sandboxInput, ore_grade: parseInt(e.target.value) })}
                        className="w-full accent-aif-gold-DEFAULT h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <label className="text-[10px] text-white/60 font-mono flex justify-between">
                        <span>Substituierbarkeit (100 = Einfach, 0 = Unersetzlich)</span>
                        <span className="text-white font-bold">{sandboxInput.substitution_potential}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="100" value={sandboxInput.substitution_potential}
                        onChange={(e) => setSandboxInput({ ...sandboxInput, substitution_potential: parseInt(e.target.value) })}
                        className="w-full accent-aif-gold-DEFAULT h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <label className="text-[10px] text-white/60 font-mono flex justify-between">
                        <span>Recyclingfähigkeit</span>
                        <span className="text-white font-bold">{sandboxInput.recyclability}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="100" value={sandboxInput.recyclability}
                        onChange={(e) => setSandboxInput({ ...sandboxInput, recyclability: parseInt(e.target.value) })}
                        className="w-full accent-aif-gold-DEFAULT h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Section: Risks */}
                  <div className="pt-2 border-t border-white/5">
                    <h4 className="text-[10px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider mb-2">3. Risiken & ESG (100 = Maximales Risiko)</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/60 font-mono flex justify-between">
                        <span>Geopolitisches Risiko</span>
                        <span className="text-white font-bold">{sandboxInput.geopolitical_risk}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="100" value={sandboxInput.geopolitical_risk}
                        onChange={(e) => setSandboxInput({ ...sandboxInput, geopolitical_risk: parseInt(e.target.value) })}
                        className="w-full accent-aif-gold-DEFAULT h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <label className="text-[10px] text-white/60 font-mono flex justify-between">
                        <span>ESG / CO2-Faktor</span>
                        <span className="text-white font-bold">{sandboxInput.esg_risk}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="100" value={sandboxInput.esg_risk}
                        onChange={(e) => setSandboxInput({ ...sandboxInput, esg_risk: parseInt(e.target.value) })}
                        className="w-full accent-aif-gold-DEFAULT h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <label className="text-[10px] text-white/60 font-mono flex justify-between">
                        <span>Herstellerkonzentration (Producer Concentration)</span>
                        <span className="text-white font-bold">{sandboxInput.producer_concentration}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="100" value={sandboxInput.producer_concentration}
                        onChange={(e) => setSandboxInput({ ...sandboxInput, producer_concentration: parseInt(e.target.value) })}
                        className="w-full accent-aif-gold-DEFAULT h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Section: Strategic */}
                  <div className="pt-2 border-t border-white/5">
                    <h4 className="text-[10px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider mb-2">4. Strategische Relevanz</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/60 font-mono flex justify-between">
                        <span>Wehrtechnische Relevanz (Militär)</span>
                        <span className="text-white font-bold">{sandboxInput.military_importance}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="100" value={sandboxInput.military_importance}
                        onChange={(e) => setSandboxInput({ ...sandboxInput, military_importance: parseInt(e.target.value) })}
                        className="w-full accent-aif-gold-DEFAULT h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-2 mt-2">
                      <label className="text-[10px] text-white/60 font-mono flex justify-between">
                        <span>Industrielle Wichtigkeit</span>
                        <span className="text-white font-bold">{sandboxInput.industrial_importance}%</span>
                      </label>
                      <input 
                        type="range" min="0" max="100" value={sandboxInput.industrial_importance}
                        onChange={(e) => setSandboxInput({ ...sandboxInput, industrial_importance: parseInt(e.target.value) })}
                        className="w-full accent-aif-gold-DEFAULT h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSandboxCalculate}
                  className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 text-black font-black text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <TrendingUp size={14} className="stroke-[3px]" />
                  <span>Sandbox Score berechnen</span>
                </button>
              </div>
            ) : (
              // Agent / Predefined Mode Summary Details
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Rohstoffname</span>
                  <p className="text-base font-bold text-white font-display uppercase tracking-wider">{selectedMaterial}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-white/40 uppercase">Hauptklasse</span>
                    <p className="font-bold text-white tracking-wide">{payload?.classification.category_main || 'Lädt...'}</p>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-white/40 uppercase">Unterklasse</span>
                    <p className="font-bold text-white/90 truncate">{payload?.classification.category_sub || 'Lädt...'}</p>
                  </div>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Klassifizierter Markttyp</span>
                  <p className="font-mono text-white font-bold">{payload?.classification.market_type || 'Lädt...'}</p>
                </div>

                <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Bewertungsmodus</span>
                  <p className="font-semibold text-aif-gold-DEFAULT">{payload?.classification.valuation_mode || 'Lädt...'}</p>
                </div>

                <div className="p-3.5 bg-neutral-950 border border-white/10 rounded-xl space-y-2 leading-relaxed">
                  <div className="flex items-center gap-2 text-aif-gold-DEFAULT font-bold text-[11px] uppercase tracking-wider">
                    <Info size={14} />
                    <span>Agenten-Hinweis</span>
                  </div>
                  <p className="text-white/70 text-[11px]">
                    Der Master-Orchestrator fragt parallel geologische, finanzielle und geopolitische Metriken ab, validiert den Input über quantitative Typsicherheit und liefert den standardisierten Score.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle & Right Columns: Interactive Score Display & Bento Grid */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-black/40 border border-white/10 rounded-2xl p-24 text-center flex flex-col items-center justify-center gap-4 backdrop-blur-md">
              <div className="w-12 h-12 rounded-full border-4 border-aif-gold-DEFAULT border-t-transparent animate-spin" />
              <p className="text-sm font-mono text-white/70 uppercase tracking-widest animate-pulse">Master-Orchestrator analysiert Rohstoff...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-16 text-center space-y-4">
              <ShieldAlert className="text-rose-400 mx-auto" size={40} />
              <h3 className="text-base font-bold text-white uppercase tracking-wider">Verbindungs- oder Berechnungsfehler</h3>
              <p className="text-xs text-white/60 leading-relaxed max-w-md mx-auto">{error}</p>
              <button 
                onClick={() => triggerAnalysis(selectedMaterial)}
                className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold uppercase transition-all"
              >
                Erneut versuchen
              </button>
            </div>
          ) : payload ? (
            <div className="space-y-6">
              
              {/* Score Header Indicator Widget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Score Gauge Block */}
                <div className={`p-6 rounded-2xl border ${getScoreBg(payload.scores.final_score)} md:col-span-1 flex flex-col items-center justify-center text-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider mb-2">Gesamt-Bewertungs-Score</span>
                  <div className="relative flex items-center justify-center">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                        className={`${getScoreColor(payload.scores.final_score)} transition-all duration-500`}
                        strokeDasharray={251.2}
                        strokeDashoffset={251.2 - (251.2 * payload.scores.final_score) / 100}
                      />
                    </svg>
                    <div className="absolute text-2xl font-mono font-black text-white">{payload.scores.final_score}</div>
                  </div>
                  <span className="text-[10px] font-mono text-white/50 mt-2">Berechnet nach Modell {payload.metadata.scoring_version}</span>
                </div>

                {/* Score Summary Metrics */}
                <div className="p-6 rounded-2xl bg-gradient-to-b from-neutral-950 to-black border border-white/10 md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Sicherheitskonfidenz</span>
                    <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                      {(payload.classification.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-2">
                      <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${payload.classification.confidence * 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Datenqualität</span>
                    <div className="text-lg font-mono font-bold text-aif-gold-DEFAULT mt-1">
                      {payload.metadata.data_quality * 100}%
                    </div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full mt-2">
                      <div className="bg-aif-gold-DEFAULT h-1.5 rounded-full" style={{ width: `${payload.metadata.data_quality * 100}%` }} />
                    </div>
                  </div>

                  <div className="col-span-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-white/50">Kritikalitäts-Status:</span>
                    {payload.scores.risk_resilience >= 60 ? (
                      <span className="px-2 py-0.5 rounded font-bold font-mono bg-rose-500/15 border border-rose-500/20 text-rose-400 animate-pulse">
                        HOCHRISIKO / SYSTEMKRITISCH
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-bold font-mono bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                        RISIKOKLASSE STANDARD
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bento Grid: 5 Dimension Subscores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Markt & Liquidität */}
                <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider">1. Markt & Liquidität</span>
                    <span className="text-xs font-mono font-bold text-white">{payload.scores.market_liquidity}/100</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full">
                    <div className="bg-aif-gold-DEFAULT h-1 rounded-full" style={{ width: `${payload.scores.market_liquidity}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-white/60 font-mono">
                    <div>Börsenliquidität: {payload.inputs.market_liquidity}%</div>
                    <div>Trading-Volumen: {payload.inputs.trading_volume}%</div>
                  </div>
                </div>

                {/* 2. Fundamentaldaten */}
                <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider">2. Geologie & Fundamente</span>
                    <span className="text-xs font-mono font-bold text-white">{payload.scores.fundamentals}/100</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full">
                    <div className="bg-aif-gold-DEFAULT h-1 rounded-full" style={{ width: `${payload.scores.fundamentals}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-white/60 font-mono">
                    <div>Erzgehalt/Reinheit: {payload.inputs.ore_grade}%</div>
                    <div>Kreislauf-Recycling: {payload.inputs.recyclability}%</div>
                  </div>
                </div>

                {/* 3. Förderbarkeit & Prozessierung */}
                <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider">3. Gewinnung & Komplexität</span>
                    <span className="text-xs font-mono font-bold text-white">{payload.scores.processing_complexity}/100</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full">
                    <div className="bg-aif-gold-DEFAULT h-1 rounded-full" style={{ width: `${payload.scores.processing_complexity}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-white/60 font-mono">
                    <div>Raffinationsaufwand: {payload.inputs.processing_complexity}%</div>
                    <div>Infrastruktur: {payload.inputs.infrastructure_availability}%</div>
                  </div>
                </div>

                {/* 4. Risiko & Resilienz */}
                <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider">4. Risiko & Resilienz</span>
                    <span className="text-xs font-mono font-bold text-white">{payload.scores.risk_resilience}/100</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full">
                    <div className="bg-aif-gold-DEFAULT h-1 rounded-full" style={{ width: `${payload.scores.risk_resilience}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-white/60 font-mono">
                    <div>Länderkonzentration: {payload.inputs.producer_concentration}%</div>
                    <div>Geopolitische Gefahren: {payload.inputs.geopolitical_risk}%</div>
                  </div>
                </div>

                {/* 5. Strategische Bedeutung */}
                <div className="p-5 rounded-xl bg-black/60 border border-white/10 space-y-3 md:col-span-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider">5. Strategische Relevanz</span>
                    <span className="text-xs font-mono font-bold text-white">{payload.scores.strategic_importance}/100</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full">
                    <div className="bg-aif-gold-DEFAULT h-1 rounded-full" style={{ width: `${payload.scores.strategic_importance}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-white/60 font-mono">
                    <div>Militärische Wichtigkeit: {payload.inputs.military_importance}%</div>
                    <div>Industrielle Unverzichtbarkeit: {payload.inputs.industrial_importance}%</div>
                    <div>Substitutions-Hürde: {100 - payload.inputs.substitution_potential}%</div>
                  </div>
                </div>

              </div>

              {/* Forward Curves (Terminkurven) Visualization Card */}
              {forwardData && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-neutral-950 to-black border border-white/10 space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-white/2 rounded-full filter blur-3xl pointer-events-none" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4 relative z-10">
                    <div>
                      <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp size={16} className="text-aif-gold-DEFAULT" />
                        Terminkurve &amp; Forward Curve Analyse
                      </h3>
                      <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                        Futures-Laufzeitstruktur (Spot bis M+12) für {payload.raw_material}.
                      </p>
                    </div>
                    
                    {/* Market Structure Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/40 uppercase">Marktstruktur:</span>
                      {forwardData.marketStructure === 'CONTANGO' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-mono bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/35 tracking-wider">
                          CONTANGO (Normal)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black font-mono bg-rose-500/15 text-rose-400 border border-rose-500/35 tracking-wider animate-pulse">
                          BACKWARDATION (Knappheit)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Key Metrics row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/5 p-4 rounded-xl border border-white/5 font-mono text-xs relative z-10">
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/40 uppercase">Spot-Referenz</span>
                      <p className="text-sm font-bold text-white">{forwardData.spotPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/40 uppercase">Convenience Yield</span>
                      <p className="text-sm font-bold text-emerald-400">+{forwardData.convenienceYield}%</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/40 uppercase">Lagerbestand</span>
                      <p className="text-sm font-bold text-white">{forwardData.impliedInventory}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-white/40 uppercase">12M-Terminaufschlag</span>
                      <p className={`text-sm font-bold ${forwardData.marketStructure === 'CONTANGO' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {forwardData.curveData[forwardData.curveData.length - 1].yieldPercent > 0 ? '+' : ''}
                        {forwardData.curveData[forwardData.curveData.length - 1].yieldPercent}%
                      </p>
                    </div>
                  </div>

                  {/* Chart Container */}
                  <div className="h-64 w-full relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={forwardData.curveData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={forwardData.marketStructure === 'CONTANGO' ? '#D4A017' : '#EF4444'} stopOpacity={0.25}/>
                            <stop offset="95%" stopColor={forwardData.marketStructure === 'CONTANGO' ? '#D4A017' : '#EF4444'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="month" 
                          stroke="rgba(255,255,255,0.4)" 
                          fontSize={10} 
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.4)" 
                          fontSize={10} 
                          tickLine={false}
                          domain={['dataMin - (dataMin * 0.05)', 'dataMax + (dataMax * 0.05)']}
                          tickFormatter={(v) => `${Number(v).toLocaleString('de-DE')}`}
                        />
                        <Tooltip 
                          content={({ active, payload: tPayload }) => {
                            if (active && tPayload && tPayload.length) {
                              const data = tPayload[0].payload;
                              return (
                                <div className="bg-neutral-950 border border-white/10 p-3 rounded-lg shadow-xl font-mono text-xs space-y-1.5">
                                  <p className="text-white font-bold">{data.contract}</p>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-white/50">Laufzeit:</span>
                                    <span className="text-white">{data.month}</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-white/50">Terminpreis:</span>
                                    <span className="text-aif-gold-DEFAULT font-bold">{data.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR</span>
                                  </div>
                                  <div className="flex justify-between gap-4">
                                    <span className="text-white/50">Auf/Abschlag:</span>
                                    <span className={data.yieldPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                      {data.yieldPercent >= 0 ? '+' : ''}{data.yieldPercent}%
                                    </span>
                                  </div>
                                  <div className="flex justify-between gap-4 border-t border-white/5 pt-1 mt-1 text-[10px]">
                                    <span className="text-white/40">Lagerkosten (impl.):</span>
                                    <span className="text-white/60">{data.costOfCarry.toLocaleString('de-DE', { minimumFractionDigits: 2 })} EUR</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke={forwardData.marketStructure === 'CONTANGO' ? '#D4A017' : '#EF4444'} 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#curveColor)" 
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke={forwardData.marketStructure === 'CONTANGO' ? '#D4A017' : '#EF4444'}
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 1, fill: '#0a0a0a' }}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Educational analysis note */}
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-white/50 leading-relaxed font-mono relative z-10">
                    {forwardData.marketStructure === 'CONTANGO' ? (
                      <span>
                        💡 <strong>CONTANGO-SITUATION:</strong> Die zukünftigen Lieferpreise liegen über dem aktuellen Spotpreis. Dies signalisiert eine ausreichende Versorgungssituation auf dem physischen Markt mit normalen Lagerkosten und Versicherungsaufschlägen (Cost of Carry). Spotkäufe bieten keine unmittelbare Arbitrageprämie.
                      </span>
                    ) : (
                      <span>
                        ⚠️ <strong>BACKWARDATION-SITUATION:</strong> Der Markt verzeichnet eine Verknappung der physischen Bestände. Die Spotpreise übersteigen die zukünftigen Forward-Preise. Dies deutet auf eine extrem hohe Nachfrage oder Unterbrechungen in den Lieferketten hin. Hedging über Terminverkäufe wird hochgradig attraktiv.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Traceable Reasoning Logs (Agent Reasoning outputs) */}
              <div className="p-5 rounded-2xl bg-[#080808] border border-white/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <Cpu className="text-aif-gold-DEFAULT animate-pulse" size={16} />
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest">
                    Multi-Agent-Orchestrator Traceability-Logs
                  </h3>
                </div>

                <div className="font-mono text-[10px] text-white/75 space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                  {payload.reasoning.map((step, idx) => (
                    <div key={idx} className="p-2.5 bg-black/60 rounded border border-white/5 flex gap-2.5 items-start">
                      <span className="text-aif-gold-DEFAULT font-extrabold select-none">▶</span>
                      <p className="leading-relaxed whitespace-pre-line">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : null}

        </div>
      </div>

      {/* Database Registry Catalog Overview */}
      <div className="bg-gradient-to-br from-neutral-950 to-black rounded-2xl border border-white/10 p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
            <Database size={16} className="text-aif-gold-DEFAULT" />
            Globales Rohstoff-Register
          </h3>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-white/5 border border-white/10 text-white/60">
            {materialsList.length} Rohstoffe Registriert
          </span>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-wider">
                <th className="py-3 px-4">Kürzel</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Kategorie</th>
                <th className="py-3 px-4 text-center">Strategisch Kritisch</th>
                <th className="py-3 px-4 text-right">Standard AI-Score</th>
                <th className="py-3 px-4 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs text-white/80">
              {materialsList.map((material) => (
                <tr key={material.symbol} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-mono font-extrabold text-aif-gold-DEFAULT">{material.symbol}</td>
                  <td className="py-3 px-4 font-bold text-white font-display">{material.name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/70">
                      {material.category_sub}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {material.is_critical ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        JA
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-white/5 text-white/40">
                        NEIN
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {material.score} / 100
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleSearchSelect(material.name)}
                      className="px-3 py-1 rounded bg-white/5 border border-white/10 hover:bg-aif-gold-DEFAULT hover:text-black hover:border-aif-gold-DEFAULT text-white text-[10px] font-bold uppercase transition-all cursor-pointer"
                    >
                      Laden
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
