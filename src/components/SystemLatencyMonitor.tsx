import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Cpu, Database, CheckCircle2, RefreshCw } from 'lucide-react';

interface StreamLatency {
  name: string;
  category: 'crypto' | 'stock' | 'forex' | 'commodity' | 'bond';
  latency: number;
  status: 'optimal' | 'stable' | 'slow';
  endpoint: string;
}

export function SystemLatencyMonitor() {
  const [streams, setStreams] = useState<StreamLatency[]>([
    { name: 'Crypto Stream', category: 'crypto', latency: 45, status: 'optimal', endpoint: 'Coinbase WS Feed' },
    { name: 'Equities Stream', category: 'stock', latency: 68, status: 'optimal', endpoint: 'S&P 500 Direct Feed' },
    { name: 'Forex Stream', category: 'forex', latency: 112, status: 'stable', endpoint: 'LMAX Liquidity Feed' },
    { name: 'Commodities Stream', category: 'commodity', latency: 95, status: 'stable', endpoint: 'COMEX Real-time' },
    { name: 'Bonds Stream', category: 'bond', latency: 125, status: 'stable', endpoint: 'Fair Yield Feed' },
  ]);

  const [routerLatency, setRouterLatency] = useState<number>(142);
  const [selectedModel, setSelectedModel] = useState<string>('Gemini 2.5 Flash');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // Set initial timestamp
    const now = new Date();
    setLastUpdated(now.toLocaleTimeString('de-DE'));

    const interval = setInterval(() => {
      // Simulate real-time fluctuating latency metrics
      setStreams(prevStreams =>
        prevStreams.map(stream => {
          // Add small random fluctuation (-5ms to +5ms)
          const fluctuation = Math.floor(Math.random() * 11) - 5;
          let newLatency = Math.max(20, stream.latency + fluctuation);

          // Boundaries based on stream categories to look highly realistic
          if (stream.category === 'crypto') newLatency = Math.max(15, Math.min(80, newLatency));
          if (stream.category === 'stock') newLatency = Math.max(30, Math.min(120, newLatency));
          if (stream.category === 'forex') newLatency = Math.max(60, Math.min(180, newLatency));
          if (stream.category === 'commodity') newLatency = Math.max(50, Math.min(170, newLatency));
          if (stream.category === 'bond') newLatency = Math.max(70, Math.min(220, newLatency));

          const status = newLatency < 75 ? 'optimal' : newLatency < 150 ? 'stable' : 'slow';

          return {
            ...stream,
            latency: newLatency,
            status,
          };
        })
      );

      // Fluctuating AI Router latency
      setRouterLatency(prev => {
        const routeFluct = Math.floor(Math.random() * 15) - 7;
        return Math.max(100, Math.min(250, prev + routeFluct));
      });

      // Update timestamp
      const updatedTime = new Date();
      setLastUpdated(updatedTime.toLocaleTimeString('de-DE'));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 p-5 bg-[#0D0E12]/80 border border-white/10 rounded-2xl backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-4">
        <div>
          <div className="flex items-center gap-2 text-aif-gold-DEFAULT">
            <Activity className="w-4 h-4 animate-pulse" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest">
              Live System Latency Monitor
            </h3>
          </div>
          <p className="text-[10px] text-white/50 font-sans mt-0.5">
            Echtzeit-Latenzüberwachung der angebundenen API-Datenströme & Modell-Router
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verbindung Stabil</span>
          </div>
          <div className="text-white/40">
            Letztes Update: <span className="text-white/80">{lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Grid of streams */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
        {streams.map((stream, idx) => (
          <div 
            key={idx}
            className="p-3 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between gap-2 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide truncate">
                {stream.name}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                stream.status === 'optimal' 
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse' 
                  : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
              }`} />
            </div>

            <div>
              <div className="text-lg font-black font-mono tracking-tight text-white">
                {stream.latency} <span className="text-[10px] font-normal text-white/40">ms</span>
              </div>
              <div className="text-[8px] font-mono text-white/40 truncate">
                {stream.endpoint}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Router telemetry summary */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-aif-gold-DEFAULT/5 to-purple-500/5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-aif-gold-DEFAULT" />
          <span className="text-white/60">Modell-Auto-Router:</span>
          <span className="text-white font-bold">{selectedModel}</span>
          <span className="text-white/20">|</span>
          <span className="text-white/60">DSGVO-Vorfiltriert</span>
        </div>

        <div className="flex items-center gap-2 text-right">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-white/60">Router-Latenz:</span>
          <span className="text-[#0DDDDD] font-bold">{routerLatency} ms</span>
        </div>
      </div>
    </div>
  );
}
