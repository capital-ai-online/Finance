import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, ShieldCheck, 
  Cpu, Sparkles, TrendingUp, Compass, Radio, Maximize2 
} from 'lucide-react';
import { CapitalAiLogo } from './CapitalAiLogo';

export function CapitalAiTrailer() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const duration = 20; // 20-second video limit
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Synthesize ambient futuristic soundscapes using Web Audio API on state changes
  const playSynthSound = (type: 'intro' | 'node' | 'beep' | 'outro' | 'ambient') => {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'intro') {
        // Deep cinematic sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, now); // Low A
        osc.frequency.exponentialRampToValueAtTime(110, now + 2.5);

        // Filter for deep warm bass
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(800, now + 2.5);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 3);
      } else if (type === 'beep') {
        // High-tech sonar beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'node') {
        // Neural network node sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(440, now + 0.15);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'outro') {
        // Ascending major chord highlight
        const notes = [220, 277.18, 329.63, 440]; // A major
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          
          gain.gain.setValueAtTime(0.01, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.12 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 1.2);
        });
      }
    } catch (e) {
      console.warn('Web Audio synthesis failed or not supported:', e);
    }
  };

  // Timeline loop control
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = Math.min(prev + 0.1, duration);
          if (next >= duration) {
            setIsPlaying(false);
            playSynthSound('outro');
            setShowNotification(true);
            return duration;
          }

          // Sound triggers on specific narrative sections
          const sec = Math.floor(next * 10) / 10;
          if (sec === 0.1) playSynthSound('intro');
          if (sec === 4.0) playSynthSound('beep');
          if (sec === 8.5) playSynthSound('node');
          if (sec === 13.0) playSynthSound('beep');
          if (sec === 17.5) playSynthSound('outro');

          return next;
        });
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isMuted]);

  // Restart video helper
  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
    setShowNotification(false);
    playSynthSound('intro');
  };

  // Convert float seconds to beautifully padded minutes:seconds
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}.${ms}`;
  };

  // Progress Bar click mapping for scrubbing
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetTime = Math.min(Math.max(percentage * duration, 0), duration);
    setCurrentTime(targetTime);
    playSynthSound('beep');
  };

  return (
    <div id="capital-ai-promo-container" className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-aif-neon-purple/20 text-aif-neon-purple border border-aif-neon-purple/30 uppercase">
              Brand Elevation 2026
            </span>
            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-white/5 text-white/50 border border-white/10 uppercase">
              Beta 0.6.0
            </span>
          </div>
          <h2 className="text-xl font-black font-display text-white uppercase tracking-wider flex items-center gap-2 mt-1">
            <Compass className="text-aif-gold-DEFAULT animate-spin-slow" size={18} />
            Capital-AI Cinematic Produkt-Trailer (20s)
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Erlebe die Zukunft des Asset-Universums in einer interaktiven HTML5 Motion-Graphic Präsentation.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRestart}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw size={14} /> Neu starten
          </button>
        </div>
      </div>

      {/* Cinematic Viewport Screen (16:9 Aspect ratio container) */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative aspect-video w-full rounded-2xl border border-white/15 bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] group flex flex-col justify-between"
      >
        {/* Subtle Futuristic Tech Overlays */}
        <div className="absolute inset-0 pointer-events-none bg-radial-vignette mix-blend-overlay opacity-60 z-10" />
        <div className="absolute inset-0 pointer-events-none bg-scanlines opacity-[0.07] z-10 animate-scanline" />

        {/* Top telemetry bar */}
        <div className="relative z-20 flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent text-[10px] font-mono text-white/50 tracking-wider">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-white/80 uppercase font-black">LIVE CINEMATIC RENDER</span>
          </div>
          <div className="flex items-center gap-4">
            <span>RES: 1920 X 1080</span>
            <span className="text-aif-gold-DEFAULT">FPS: 60.0</span>
            <span>TIMECODE: {formatTime(currentTime)} / 0:20.0</span>
          </div>
        </div>

        {/* CORE VIDEO STAGE (TIMELINE TRANSITIONS) */}
        <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
          
          {/* BACKGROUND GRAPHIC (CONSTANT SLATE NEURAL GRID) */}
          <div className="absolute inset-0 opacity-15">
            <div className="w-full h-full bg-grid-pattern scale-110" />
          </div>

          <AnimatePresence mode="wait">
            
            {/* NARRATIVE SECTION 1: Intro (0.0 to 4.5 seconds) */}
            {currentTime >= 0 && currentTime < 4.5 && (
              <motion.div 
                key="narrative-intro"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-6 max-w-xl z-20"
              >
                <div className="flex justify-center">
                  <CapitalAiLogo size={140} showText={false} />
                </div>
                
                <div className="space-y-2">
                  <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-aif-gold-DEFAULT to-white uppercase tracking-[0.15em] font-display"
                  >
                    CAPITAL-AI
                  </motion.h1>
                  
                  <motion.p 
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="text-xs md:text-sm font-mono text-white/70 uppercase tracking-[0.3em] font-medium"
                  >
                    THE NEXT EVOLUTION IN QUANTITATIVE INTELLIGENCE
                  </motion.p>
                </div>

                {/* Cyber Encryption handshake readout */}
                <div className="pt-2 text-[10px] font-mono text-emerald-400 tracking-widest uppercase flex items-center justify-center gap-1.5">
                  <ShieldCheck size={12} className="animate-pulse" />
                  <span>SECURE ISOLATION ESTABLISHED • COMPLIANCE RATIFIED</span>
                </div>
              </motion.div>
            )}

            {/* NARRATIVE SECTION 2: Multi-Agent Cascade (4.5 to 9.0 seconds) */}
            {currentTime >= 4.5 && currentTime < 9.0 && (
              <motion.div 
                key="narrative-cascade"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center z-20"
              >
                {/* 3D Neural web schematic rotating */}
                <div className="relative h-48 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden p-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-aif-gold-DEFAULT/10 via-transparent to-transparent" />
                  
                  {/* Glowing central node */}
                  <motion.div 
                    animate={{ scale: [1, 1.15, 1], rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="w-16 h-16 rounded-full border border-aif-gold-DEFAULT flex items-center justify-center relative shadow-[0_0_20px_rgba(245,196,83,0.3)] bg-black/60"
                  >
                    <Cpu className="text-aif-gold-DEFAULT" size={24} />
                    {/* Ring satellites */}
                    <div className="absolute inset-[-15px] rounded-full border border-white/10 border-dashed" />
                    <div className="absolute inset-[-30px] rounded-full border border-white/5" />
                  </motion.div>

                  {/* Satellite agents */}
                  <div className="absolute left-6 top-8 text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-cyan-400">CLASSIFICATION</div>
                  <div className="absolute right-6 top-6 text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-amber-400">VALUATION</div>
                  <div className="absolute left-8 bottom-6 text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-rose-400">RISK ENGINE</div>
                  <div className="absolute right-8 bottom-8 text-[9px] font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-purple-400">SENTIMENT</div>

                  {/* Connecting digital line sweeps */}
                  <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl" />
                </div>

                {/* Code streaming / active telemetry narrative */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-aif-gold-DEFAULT uppercase tracking-wider">Multi-Agent Cascade</div>
                    <h2 className="text-xl font-bold font-display text-white uppercase tracking-wide">Autonomous Synthesis</h2>
                  </div>
                  
                  <div className="bg-black/80 border border-white/10 p-3.5 rounded-xl font-mono text-[9px] space-y-1 text-white/60">
                    <div className="flex gap-2 text-cyan-400"><span className="text-white/30">[$]</span> CLASSIFIER: Commodities & Crypto parsed</div>
                    <div className="flex gap-2 text-amber-400"><span className="text-white/30">[$]</span> VALUATION: Graham Fair Value calculated</div>
                    <div className="flex gap-2 text-rose-400"><span className="text-white/30">[$]</span> RISK ENGINE: No structural anomalies found</div>
                    <div className="flex gap-2 text-purple-400"><span className="text-white/30">[$]</span> SENTIMENT: Google Search Grounding: ACTIVE</div>
                    <div className="flex gap-2 text-emerald-400 animate-pulse"><span className="text-white/30">[$]</span> COMPLETE: 24 regulatory nodes synchronised</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NARRATIVE SECTION 3: Scoring & Math Matrix (9.0 to 13.5 seconds) */}
            {currentTime >= 9.0 && currentTime < 13.5 && (
              <motion.div 
                key="narrative-scoring"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center z-20"
              >
                <div className="space-y-4 order-2 md:order-1">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-aif-gold-DEFAULT uppercase tracking-wider">Scoring Parity</div>
                    <h2 className="text-xl font-bold font-display text-white uppercase tracking-wide">Deterministic Models</h2>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Zahnradartige Präzision bei der Aggregation komplexer ESG-, NVT- und Graham-Werte im gesamten globalen Universum.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-widest font-black">
                      Verifiziert
                    </div>
                    <div className="px-3 py-1.5 rounded bg-white/5 border border-white/10 text-white/70 text-[10px] font-mono uppercase tracking-widest">
                      Zero-Breach
                    </div>
                  </div>
                </div>

                {/* Big dial and live animating math graph */}
                <div className="h-44 bg-black/50 border border-white/10 rounded-2xl flex flex-col justify-between p-4 relative overflow-hidden order-1 md:order-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
                    <span>ASSET RATING MODEL</span>
                    <span className="text-emerald-400">COMPLIANT</span>
                  </div>

                  <div className="flex items-center justify-center gap-4 my-2">
                    {/* Pulsing Score Dial */}
                    <div className="relative w-20 h-20 flex items-center justify-center rounded-full border border-white/10 bg-black">
                      <svg className="absolute inset-0 w-full h-full -rotate-95" viewBox="0 0 36 36">
                        <path
                          className="text-white/5"
                          strokeWidth="2.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <motion.path
                          initial={{ strokeDasharray: "0, 100" }}
                          animate={{ strokeDasharray: "92, 100" }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="text-aif-gold-DEFAULT"
                          strokeWidth="2.5"
                          strokeDasharray="92, 100"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="text-center">
                        <span className="text-lg font-black font-mono text-white tracking-tighter">92.4</span>
                        <p className="text-[7px] text-white/40 font-mono tracking-widest uppercase">SCORE</p>
                      </div>
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <div className="text-[10px] font-mono flex justify-between"><span className="text-white/40">MARGIN OF SAFETY:</span> <span className="text-white font-bold">88%</span></div>
                      <div className="text-[10px] font-mono flex justify-between"><span className="text-white/40">VOLATILITY CAP:</span> <span className="text-emerald-400 font-bold">STABLE</span></div>
                      <div className="text-[10px] font-mono flex justify-between"><span className="text-white/40">LIQUIDITY INDEX:</span> <span className="text-white font-bold">OPTIMAL</span></div>
                    </div>
                  </div>

                  <div className="h-6 w-full flex items-end gap-0.5 pt-1 overflow-hidden">
                    {[40, 25, 45, 60, 55, 70, 65, 80, 75, 92, 88, 95, 90, 100].map((val, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ height: 0 }}
                        animate={{ height: `${val}%` }}
                        transition={{ delay: idx * 0.03, duration: 0.5 }}
                        className="flex-1 bg-gradient-to-t from-aif-gold-DEFAULT/20 to-aif-gold-DEFAULT/80 rounded-t-[1px]" 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* NARRATIVE SECTION 4: Future OS & Token (13.5 to 17.5 seconds) */}
            {currentTime >= 13.5 && currentTime < 17.5 && (
              <motion.div 
                key="narrative-tokenomics"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center z-20"
              >
                {/* 3D rotating Token graphic */}
                <div className="relative h-44 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl p-4">
                  <div className="absolute inset-0 bg-radial-vignette opacity-45 pointer-events-none" />
                  
                  {/* Rotating Token */}
                  <motion.div 
                    animate={{ rotateY: 360, rotateZ: 5 }}
                    transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-aif-gold-DEFAULT to-amber-700 p-[1px] flex items-center justify-center shadow-[0_0_35px_rgba(245,196,83,0.3)] perspective-1000 cursor-pointer"
                  >
                    <div className="w-full h-full bg-black/90 rounded-full flex flex-col items-center justify-center text-center p-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-scanlines opacity-[0.1]" />
                      <Sparkles className="text-aif-gold-DEFAULT animate-pulse mb-1" size={18} />
                      <span className="text-[9px] font-black font-mono text-white uppercase tracking-widest leading-none">CAPITAL</span>
                      <span className="text-[8px] font-bold font-mono text-aif-gold-DEFAULT tracking-wider mt-0.5">TOKEN</span>
                    </div>
                  </motion.div>

                  {/* Satellite rings mapping out MiCA / ERC */}
                  <div className="absolute text-[8px] font-mono px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white/60 top-4">MiCA COMPLIANT</div>
                  <div className="absolute text-[8px] font-mono px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white/60 bottom-4">ERC-3643 STANDARD</div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono text-aif-gold-DEFAULT uppercase tracking-wider">Economic OS</div>
                    <h2 className="text-xl font-bold font-display text-white uppercase tracking-wide">Sovereign Asset OS</h2>
                    <p className="text-xs text-white/60 leading-relaxed">
                      Etablierung eines ökonomischen Betriebssystems mit nativem Asset-Token und dezentraler Settlement-Schnittstelle.
                    </p>
                  </div>

                  <div className="text-[10px] font-mono text-white/40 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-aif-gold-DEFAULT" />
                    <span>Beta-Phase 0.6.0 ready for deployment</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* NARRATIVE SECTION 5: Outro & Call to Action (17.5 to 20.0 seconds) */}
            {currentTime >= 17.5 && (
              <motion.div 
                key="narrative-outro"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-6 max-w-xl z-20"
              >
                <div className="relative inline-block p-1 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 rounded-2xl shadow-[0_0_30px_rgba(245,196,83,0.2)]">
                  <div className="bg-black/95 px-6 py-4 rounded-xl text-center space-y-2">
                    <span className="px-2 py-0.5 rounded text-[8px] font-mono font-black tracking-widest bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 uppercase">
                      VERBINDEN
                    </span>
                    <h2 className="text-2xl font-black font-display text-white tracking-wide uppercase">FOUNDERS TRIAL ACTIVE</h2>
                    <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                      Sichere Dir unbegrenzten Zugriff auf alle Multi-Agent-Schnittstellen und Graham-DCF-Module.
                    </p>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <button 
                    onClick={handleRestart}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Wiederholen
                  </button>
                  <a 
                    href="#nav-sec-hub"
                    className="px-5 py-2.5 bg-aif-gold-DEFAULT hover:bg-aif-gold-DEFAULT/80 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(245,196,83,0.3)] flex items-center gap-1.5"
                  >
                    <Sparkles size={12} /> Jetzt testen
                  </a>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* BOTTOM VIDEO PLAYER CONTROLS */}
        <div className="relative z-20 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent border-t border-white/5 space-y-3">
          
          {/* Progress Timeline Scrubber */}
          <div 
            onClick={handleTimelineClick}
            className="h-2 w-full bg-white/10 rounded-full cursor-pointer relative group/timeline"
          >
            {/* Hover preview tooltip */}
            <div className="absolute h-full bg-white/20 rounded-full w-full pointer-events-none opacity-0 group-hover/timeline:opacity-100 transition-opacity" />
            
            {/* Active filled timeline */}
            <div 
              style={{ width: `${(currentTime / duration) * 100}%` }}
              className="absolute h-full bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 rounded-full flex justify-end items-center"
            >
              {/* Scrubbing handle */}
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-0 group-hover/timeline:scale-100 transition-transform cursor-grab" />
            </div>
          </div>

          <div className="flex justify-between items-center">
            {/* Left Controls: Play, Pause, Mute */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 hover:text-white transition-all cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <button 
                onClick={handleRestart}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 hover:text-white transition-all cursor-pointer"
                title="Restart"
              >
                <RotateCcw size={14} />
              </button>

              <span className="text-[10px] font-mono text-white/50">
                {formatTime(currentTime)} / 0:20.0
              </span>

              <span className="text-[10px] font-mono text-white/20">|</span>

              {/* Narrative scene guide */}
              <span className="text-[10px] font-mono text-aif-gold-DEFAULT tracking-wider uppercase font-black animate-pulse">
                {currentTime < 4.5 && "1. Vision Intro"}
                {currentTime >= 4.5 && currentTime < 9.0 && "2. Multi-Agent Cascade"}
                {currentTime >= 9.0 && currentTime < 13.5 && "3. Mathematical scoring"}
                {currentTime >= 13.5 && currentTime < 17.5 && "4. Tokenomics OS"}
                {currentTime >= 17.5 && "5. Call To Action"}
              </span>
            </div>

            {/* Right Controls: Audio Synth toggle & Fullscreen */}
            <div className="flex items-center gap-3">
              {/* Synth sound icon */}
              <button 
                onClick={() => {
                  const val = !isMuted;
                  setIsMuted(val);
                  if (!val) {
                    setIsPlaying(true);
                    playSynthSound('beep');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  !isMuted 
                    ? 'bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/30 text-aif-gold-DEFAULT shadow-[0_0_10px_rgba(245,196,83,0.15)]' 
                    : 'bg-white/5 border-white/10 text-white/50'
                }`}
                title="Synthesizer Sound aktivieren"
              >
                {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} className="animate-bounce" />}
                <span>Synth-Ton: {!isMuted ? 'AN' : 'AUS'}</span>
              </button>

              <button 
                onClick={() => alert("Widescreen-Ansicht ist im Browser-Tab optimiert.")}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
                title="Fullscreen"
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Floating complete notice notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="bg-gradient-to-r from-emerald-500/20 via-black/80 to-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between gap-4 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">Cinematic Präsentation Abgeschlossen</p>
                <p className="text-[11px] text-white/60">Capital-AI wurde erfolgreich auf Version 0.6.0-Beta gehoben.</p>
              </div>
            </div>
            <button 
              onClick={handleRestart}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-mono font-black uppercase text-[9px] tracking-widest rounded-lg transition-all"
            >
              Erneut abspielen
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Summary Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 border border-white/5 p-5 rounded-2xl backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-aif-gold-DEFAULT/10 flex items-center justify-center text-aif-gold-DEFAULT mb-3">
            <Cpu size={16} />
          </div>
          <h3 className="text-xs font-bold font-mono uppercase text-white tracking-widest mb-1.5">Domain-Entscheidung</h3>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Die Marke <strong>Capital-AI</strong> bündelt alle algorithmischen Triebwerke unter einem einheitlichen Namen. Alle Schnittstellen wurden synchronisiert.
          </p>
        </div>

        <div className="bg-black/40 border border-white/5 p-5 rounded-2xl backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
            <Radio size={16} />
          </div>
          <h3 className="text-xs font-bold font-mono uppercase text-white tracking-widest mb-1.5">Auto-Synthesizer</h3>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Dieses Promo-Video verwendet die browserinterne <strong>Web Audio API</strong>, um Soundeffekte in Echtzeit rein mathematisch zu erzeugen - ohne Ladezeiten oder Cookies.
          </p>
        </div>

        <div className="bg-black/40 border border-white/5 p-5 rounded-2xl backdrop-blur-md">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
            <Sparkles size={16} />
          </div>
          <h3 className="text-xs font-bold font-mono uppercase text-white tracking-widest mb-1.5">Sovereign OS</h3>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Das Herzstück von Capital-AI integriert ein dezentrales, rechtskonformes (MiCA) Asset-System, um reale Werte digital handelbar zu machen.
          </p>
        </div>
      </div>
    </div>
  );
}
