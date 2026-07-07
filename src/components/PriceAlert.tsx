import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  BellRing, 
  Plus, 
  Trash, 
  Volume2, 
  VolumeX, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Clock, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  DollarSign,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RegistryAsset } from '../lib/assetRegistry';

import { UserSession } from '../App';
import { 
  getSessionAlerts, 
  saveSessionAlerts, 
  getSessionLogs, 
  saveSessionLogs, 
  PriceAlertItem 
} from '../lib/alertStore';

export interface PriceAlert {
  id: string;
  symbol: string;
  assetName: string;
  type: 'crypto' | 'stock' | 'forex' | 'commodity' | 'index' | 'bond';
  targetPrice: number;
  condition: 'above' | 'below';
  initialPrice: number;
  currentPrice: number;
  createdAt: string;
  triggeredAt?: string;
  isTriggered: boolean;
  soundEnabled: boolean;
}

interface PriceAlertComponentProps {
  selectedSymbol?: string;
  userSession?: UserSession;
}

export function PriceAlert({ selectedSymbol, userSession }: PriceAlertComponentProps) {
  const [assets, setAssets] = useState<RegistryAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Alert form inputs
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>('BTC');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Active alerts lists
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    alertId: string;
    symbol: string;
    assetName: string;
    message: string;
    time: string;
  }>>([]);
  
  // Simulation config
  const [isSimulationActive, setIsSimulationActive] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(3000); // ms
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warn';
  } | null>(null);

  // Load assets
  useEffect(() => {
    setLoading(true);
    fetch('/api/registry/assets')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load asset list');
        return res.json();
      })
      .then((data: RegistryAsset[]) => {
        setAssets(data);
        if (selectedSymbol && data.some(a => a.symbol.toUpperCase() === selectedSymbol.toUpperCase())) {
          setSelectedAssetSymbol(selectedSymbol.toUpperCase());
        } else if (data.length > 0) {
          setSelectedAssetSymbol(data[0].symbol);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading assets for price alerts:', err);
        setLoading(false);
      });
  }, [selectedSymbol]);

  // Load saved alerts from localStorage on mount or user session change
  useEffect(() => {
    const email = userSession?.email;
    setAlerts(getSessionAlerts(email) as PriceAlert[]);
    setNotifications(getSessionLogs(email));

    // Event handlers for background state synchronization
    const handleAlertsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.email === email) {
        setAlerts(customEvent.detail.alerts);
      }
    };
    const handleLogsUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.email === email) {
        setNotifications(customEvent.detail.logs);
      }
    };

    window.addEventListener('aif-alerts-updated', handleAlertsUpdate);
    window.addEventListener('aif-logs-updated', handleLogsUpdate);

    return () => {
      window.removeEventListener('aif-alerts-updated', handleAlertsUpdate);
      window.removeEventListener('aif-logs-updated', handleLogsUpdate);
    };
  }, [userSession]);

  // Save alerts to localStorage whenever they change
  const saveAlerts = (updatedAlerts: PriceAlert[]) => {
    setAlerts(updatedAlerts);
    saveSessionAlerts(updatedAlerts as any, userSession?.email);
  };

  const saveLogs = (updatedLogs: typeof notifications) => {
    setNotifications(updatedLogs);
    saveSessionLogs(updatedLogs, userSession?.email);
  };

  // Play audio synth notification
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First tone (high-pitched bell)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.5);

      // Second tone slightly offset (warm harmony)
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109.73, audioCtx.currentTime); // C#6 note (major third)
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.6);
      }, 100);

    } catch (err) {
      console.warn('Audio Context is blocked or not supported by browser:', err);
    }
  };

  // Trigger notification
  const triggerNotification = (alert: PriceAlert, actualPrice: number) => {
    const timeStr = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const operator = alert.condition === 'above' ? 'überschritten' : 'unterschritten';
    const relation = alert.condition === 'above' ? '≥' : '≤';
    
    const message = `${alert.assetName} (${alert.symbol}) hat die Zielschwelle von $${alert.targetPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${operator}! Aktueller Kurs: $${actualPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}.`;

    const newLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      alertId: alert.id,
      symbol: alert.symbol,
      assetName: alert.assetName,
      message,
      time: timeStr
    };

    saveLogs([newLog, ...notifications].slice(0, 50)); // Keep last 50 logs

    if (alert.soundEnabled) {
      playAlertSound();
    }

    // In-app Push Toast
    setToastNotification({
      id: `toast-${Date.now()}`,
      title: `🔔 Preisalarm ausgelöst!`,
      message,
      type: 'warn'
    });

    // Auto dismiss toast
    setTimeout(() => {
      setToastNotification(null);
    }, 6000);
  };

  // Form submit handler
  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || isNaN(Number(targetPrice)) || Number(targetPrice) <= 0) return;

    const asset = assets.find(a => a.symbol === selectedAssetSymbol);
    if (!asset) return;

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      symbol: asset.symbol,
      assetName: asset.name,
      type: asset.type,
      targetPrice: Number(targetPrice),
      condition,
      initialPrice: asset.price,
      currentPrice: asset.price,
      createdAt: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      isTriggered: false,
      soundEnabled
    };

    saveAlerts([newAlert, ...alerts]);
    setTargetPrice('');
    
    // Welcome message/success
    setToastNotification({
      id: `toast-${Date.now()}`,
      title: `Preisalarm eingerichtet`,
      message: `Wir benachrichtigen dich, sobald ${asset.name} die Schwelle von $${Number(targetPrice).toLocaleString('de-DE')} durchbricht.`,
      type: 'success'
    });
    setTimeout(() => setToastNotification(null), 4000);
  };

  // Quick preset helper
  const handleApplyPreset = (percent: number) => {
    const asset = assets.find(a => a.symbol === selectedAssetSymbol);
    if (!asset) return;
    const factor = 1 + percent / 100;
    const target = asset.price * factor;
    setTargetPrice(target.toFixed(asset.price < 5 ? 4 : 2));
    setCondition(percent >= 0 ? 'above' : 'below');
  };

  // Delete alarm
  const handleDeleteAlert = (id: string) => {
    saveAlerts(alerts.filter(a => a.id !== id));
  };

  // Clear all triggered alerts
  const handleClearHistory = () => {
    saveLogs([]);
  };

  // Reset active triggered status
  const handleReactivateAlert = (id: string) => {
    const updated = alerts.map(a => {
      if (a.id === id) {
        return { ...a, isTriggered: false, triggeredAt: undefined };
      }
      return a;
    });
    saveAlerts(updated);
  };

  // Simulate Instant Price Jump to Trigger the Alert
  const handleSimulateAlertTrigger = (alert: PriceAlert) => {
    if (alert.isTriggered) return;

    // Determine a price that triggers the alert
    const targetJumpPrice = alert.condition === 'above' 
      ? alert.targetPrice * 1.005 
      : alert.targetPrice * 0.995;

    const updatedAlerts = alerts.map(a => {
      if (a.id === alert.id) {
        return {
          ...a,
          isTriggered: true,
          triggeredAt: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          currentPrice: targetJumpPrice
        };
      }
      return a;
    });

    saveAlerts(updatedAlerts);
    triggerNotification(alert, targetJumpPrice);
  };

  // Live Price Fluctuation Engine (Simulator)
  useEffect(() => {
    if (!isSimulationActive || assets.length === 0) return;

    const timer = setInterval(() => {
      // Create a map of fluctuated prices for all assets
      const fluctuatedAssetsMap: { [symbol: string]: number } = {};
      
      const updatedAssets = assets.map(asset => {
        // Random walk change between -0.4% and +0.4%
        const pctChange = (Math.random() - 0.5) * 0.008; 
        const newPrice = asset.price * (1 + pctChange);
        
        fluctuatedAssetsMap[asset.symbol] = Number(newPrice.toFixed(asset.price < 5 ? 4 : 2));
        
        return {
          ...asset,
          price: fluctuatedAssetsMap[asset.symbol],
          change24h: asset.change24h + (pctChange * 100)
        };
      });

      // Update local asset prices
      setAssets(updatedAssets);

      // Check alerts
      let alertTriggered = false;
      const updatedAlerts = alerts.map(alert => {
        if (alert.isTriggered) return alert;

        const currentAssetPrice = fluctuatedAssetsMap[alert.symbol];
        if (currentAssetPrice === undefined) return alert;

        const isTriggerConditionMet = alert.condition === 'above'
          ? currentAssetPrice >= alert.targetPrice
          : currentAssetPrice <= alert.targetPrice;

        if (isTriggerConditionMet) {
          alertTriggered = true;
          // Trigger the notification!
          setTimeout(() => triggerNotification(alert, currentAssetPrice), 10);
          return {
            ...alert,
            isTriggered: true,
            triggeredAt: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            currentPrice: currentAssetPrice
          };
        }

        // Just update current price tracker
        return { ...alert, currentPrice: currentAssetPrice };
      });

      if (alertTriggered || JSON.stringify(alerts) !== JSON.stringify(updatedAlerts)) {
        saveAlerts(updatedAlerts);
      }

    }, simulationSpeed);

    return () => clearInterval(timer);
  }, [isSimulationActive, assets, alerts, simulationSpeed]);

  const activeAssetObj = assets.find(a => a.symbol === selectedAssetSymbol);

  return (
    <div className="w-full space-y-6">
      
      {/* Dynamic Push Toast Notification Banner inside screen */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            className="fixed top-24 right-4 z-50 w-full max-w-sm overflow-hidden rounded-xl bg-black/95 border-2 border-aif-gold-DEFAULT/50 shadow-[0_10px_50px_rgba(245,196,83,0.3)] backdrop-blur-2xl p-4 flex gap-3.5 items-start"
          >
            <div className="p-2.5 rounded-lg bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT flex-shrink-0 animate-bounce">
              <BellRing size={20} />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-black text-white uppercase font-display tracking-wider">
                {toastNotification.title}
              </h4>
              <p className="text-xs text-white/85 leading-relaxed font-sans font-medium">
                {toastNotification.message}
              </p>
              <div className="text-[10px] text-aif-gold-DEFAULT font-mono uppercase tracking-wider font-extrabold flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>Simuliertes System-Echtzeitsignal</span>
              </div>
            </div>
            <button 
              onClick={() => setToastNotification(null)}
              className="text-white/40 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Form & Simulator Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Creator Form Card */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-5">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <div className="p-2 bg-gradient-to-br from-aif-gold-DEFAULT/10 to-amber-500/15 rounded-lg text-aif-gold-DEFAULT">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-base font-black font-display text-white uppercase tracking-wider">
                  Preisalarm Erstellen
                </h3>
                <p className="text-[11px] text-white/50 font-sans">
                  Benachrichtigungen für beliebige Vermögenswerte festlegen
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-white/40 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="animate-spin text-aif-gold-DEFAULT" />
                <span className="text-xs font-mono">Lade Vermögenswerte...</span>
              </div>
            ) : (
              <form onSubmit={handleCreateAlert} className="space-y-4">
                {/* Select Asset */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-white/60 block uppercase tracking-wider">
                    Vermögenswert wählen
                  </label>
                  <select
                    value={selectedAssetSymbol}
                    onChange={(e) => {
                      setSelectedAssetSymbol(e.target.value);
                      setTargetPrice('');
                    }}
                    className="w-full bg-[#18181b]/90 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT transition-all font-display font-bold uppercase tracking-wide cursor-pointer"
                  >
                    {assets.map((asset) => (
                      <option key={asset.symbol} value={asset.symbol} className="bg-neutral-950 font-bold uppercase tracking-wide">
                        {asset.symbol} - {asset.name} (${asset.price >= 1 ? asset.price.toLocaleString('de-DE', { minimumFractionDigits: 2 }) : asset.price.toFixed(4)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition Trigger */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-white/60 block uppercase tracking-wider">
                    Auslöser-Bedingung
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCondition('above')}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        condition === 'above'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-extrabold shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-black/30 border-white/10 text-white/60 hover:text-white hover:border-white/25'
                      }`}
                    >
                      <TrendingUp size={14} />
                      <span>Steigt Über (≥)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCondition('below')}
                      className={`py-2.5 px-3 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                        condition === 'below'
                          ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 font-extrabold shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                          : 'bg-black/30 border-white/10 text-white/60 hover:text-white hover:border-white/25'
                      }`}
                    >
                      <TrendingDown size={14} />
                      <span>Fällt Unter (≤)</span>
                    </button>
                  </div>
                </div>

                {/* Target price input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-mono text-white/60 block uppercase tracking-wider">
                      Zielpreis ($)
                    </label>
                    {activeAssetObj && (
                      <span className="text-[10px] font-mono text-white/40">
                        Kurs: ${activeAssetObj.price >= 1 ? activeAssetObj.price.toLocaleString('de-DE', { minimumFractionDigits: 2 }) : activeAssetObj.price.toFixed(4)}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono text-sm">$</div>
                    <input
                      type="number"
                      step="any"
                      placeholder="z.B. 72000"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="w-full bg-[#18181b]/90 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-aif-gold-DEFAULT transition-all font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Presets Button Quick Options */}
                {activeAssetObj && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Schnell-Schwellen</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(-5)}
                        className="py-1 px-1.5 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] font-mono font-bold text-rose-400 hover:bg-rose-500/20 transition-all text-center"
                      >
                        -5%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(-2)}
                        className="py-1 px-1.5 bg-rose-500/10 border border-rose-500/20 rounded text-[10px] font-mono font-bold text-rose-400 hover:bg-rose-500/20 transition-all text-center"
                      >
                        -2%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(2)}
                        className="py-1 px-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-mono font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all text-center"
                      >
                        +2%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyPreset(5)}
                        className="py-1 px-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-mono font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all text-center"
                      >
                        +5%
                      </button>
                    </div>
                  </div>
                )}

                {/* Sound Settings switch */}
                <div className="flex items-center justify-between py-1 border-t border-b border-white/5">
                  <span className="text-xs font-mono text-white/70 uppercase tracking-wide">
                    Soundeffekt simulieren
                  </span>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`p-2 rounded-lg border transition-all ${
                      soundEnabled 
                        ? 'bg-aif-gold-DEFAULT/10 border-aif-gold-DEFAULT/30 text-aif-gold-DEFAULT' 
                        : 'bg-black/30 border-white/10 text-white/30'
                    }`}
                  >
                    {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  </button>
                </div>

                {/* Create alarm button */}
                <button
                  type="submit"
                  disabled={!targetPrice || isNaN(Number(targetPrice))}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/30 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:brightness-110 shadow-[0_0_15px_rgba(245,196,83,0.2)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Preisalarm einrichten</span>
                </button>
              </form>
            )}
          </div>

          {/* Simulator Control Panel Card */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Activity className="text-aif-neon-cyan animate-pulse" size={18} />
                <h4 className="text-xs font-black font-mono text-white uppercase tracking-wider">
                  Preissimulator
                </h4>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${
                isSimulationActive 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-white/5 text-white/50 border border-white/10'
              }`}>
                {isSimulationActive ? 'LIVE AKTIV' : 'PAUSIERT'}
              </span>
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed font-sans">
              Der Simulator fluktuiert im Hintergrund kontinuierlich Marktpreise des Asset-Registries im Sekundentakt. Sobald eine Preisschwelle durchbrochen wird, ertönt ein synthetischer Sound und ein in-App Banner erscheint.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsSimulationActive(!isSimulationActive)}
                className={`py-2 px-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isSimulationActive
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-extrabold'
                    : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-extrabold'
                }`}
              >
                {isSimulationActive ? (
                  <>
                    <Pause size={12} />
                    <span>Stop Simulator</span>
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    <span>Start Simulator</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  // Simulate rapid tick of all prices
                  setSimulationSpeed(prev => prev === 1000 ? 5000 : prev === 5000 ? 3000 : 1000);
                }}
                className="py-2 px-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-white/85"
                title="Aktualisierungstakt anpassen"
              >
                <Sliders size={12} />
                <span>Takt: {simulationSpeed / 1000}s</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Columns: Active Price Alerts list & triggered history */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Alarms Container */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4 min-h-[300px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-display text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Aktive Überwachungen</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/10 text-white font-mono font-bold">
                        {alerts.filter(a => !a.isTriggered).length}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Autonomer Wächter-Modus</span>
                </div>
              </div>

              {/* Alerts List */}
              {alerts.length === 0 ? (
                <div className="py-16 text-center text-white/30 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center text-white/20">
                    <Bell size={20} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white/50 uppercase tracking-wider">Keine aktiven Alarme</h4>
                    <p className="text-[11px] text-white/40 max-w-sm leading-normal">
                      Richte einen neuen Preisalarm ein, um sofort benachrichtigt zu werden, wenn der Markt deine Zielmarken erreicht.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {alerts.map((alert) => (
                    <motion.div
                      layout
                      key={alert.id}
                      className={`relative border rounded-xl p-4 transition-all flex flex-col justify-between gap-3 ${
                        alert.isTriggered 
                          ? 'bg-neutral-950/80 border-white/5 opacity-60' 
                          : 'bg-black/60 border-white/10 hover:border-aif-gold-DEFAULT/30 shadow-lg'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Title line */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono font-extrabold uppercase bg-white/5 px-2 py-0.5 rounded text-white/70 border border-white/10">
                              {alert.symbol}
                            </span>
                            <span className="text-xs text-white/45 ml-2 font-mono truncate max-w-[110px] inline-block align-middle">
                              {alert.assetName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              alert.isTriggered 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' 
                                : alert.condition === 'above' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                            }`}>
                              {alert.isTriggered 
                                ? 'Ausgelöst' 
                                : alert.condition === 'above' 
                                ? 'Steigt Über' 
                                : 'Fällt Unter'
                              }
                            </span>
                            {alert.soundEnabled && <Volume2 size={12} className="text-white/40" />}
                          </div>
                        </div>

                        {/* Visual trigger conditions */}
                        <div className="grid grid-cols-2 gap-2 bg-[#18181b]/60 border border-white/5 p-2 rounded-lg">
                          <div>
                            <div className="text-[9px] font-mono text-white/40 uppercase">Ziel-Grenze</div>
                            <div className="text-xs font-mono font-extrabold text-white flex items-center gap-0.5">
                              <DollarSign size={10} className="text-aif-gold-DEFAULT" />
                              <span>{alert.targetPrice.toLocaleString('de-DE', { minimumFractionDigits: alert.targetPrice < 10 ? 4 : 2 })}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-[9px] font-mono text-white/40 uppercase">Aktuell</div>
                            <div className={`text-xs font-mono font-bold flex items-center gap-0.5 ${
                              alert.isTriggered 
                                ? 'text-white/40' 
                                : (alert.condition === 'above' && alert.currentPrice >= alert.targetPrice) || (alert.condition === 'below' && alert.currentPrice <= alert.targetPrice)
                                ? 'text-emerald-400 animate-pulse'
                                : 'text-aif-gold-light'
                            }`}>
                              <DollarSign size={10} />
                              <span>{alert.currentPrice.toLocaleString('de-DE', { minimumFractionDigits: alert.currentPrice < 10 ? 4 : 2 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action trigger line */}
                      <div className="flex justify-between items-center border-t border-white/5 pt-2 text-[10px] font-mono text-white/50">
                        <span>Erstellt um {alert.createdAt} Uhr</span>

                        <div className="flex items-center gap-1.5">
                          {!alert.isTriggered ? (
                            <button
                              onClick={() => handleSimulateAlertTrigger(alert)}
                              className="px-2 py-1 bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 hover:bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT rounded font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                              title="Löst diesen Alarm sofort testweise mit einem künstlichen Kurssprung aus"
                            >
                              <Play size={8} fill="currentColor" />
                              <span>Testauslösung</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateAlert(alert.id)}
                              className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded font-mono text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw size={8} />
                              <span>Reaktivieren</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 transition-all cursor-pointer"
                            title="Alarm löschen"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Sparkles background overlay on triggered alarms */}
                      {alert.isTriggered && (
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-purple-500/5 pointer-events-none rounded-xl" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {alerts.length > 0 && (
              <div className="text-[10px] text-white/40 font-mono text-center pt-2 mt-4 border-t border-white/5">
                💡 Tipp: Nutze die <strong>"Testauslösung"</strong>-Schaltfläche, um den Preisalarm-Empfang und die Push-Banner-Simulation sofort zu verifizieren.
              </div>
            )}
          </div>

          {/* Triggered History Notification logs */}
          <div className="bg-black/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="text-white/50" size={16} />
                <h3 className="text-sm font-black font-display text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Alarme-Historie (Protokoll)</span>
                  <span className="text-[10px] font-mono text-white/40 normal-case">
                    (letzte {notifications.length})
                  </span>
                </h3>
              </div>
              
              {notifications.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="px-2.5 py-1 text-[10px] font-mono font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 rounded-lg transition-all cursor-pointer"
                >
                  Protokoll leeren
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="py-10 text-center text-white/30 text-xs font-mono">
                Bisher wurden keine Preisalarme ausgelöst oder simulierte Signale empfangen.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {notifications.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex gap-3 items-start text-xs p-3 rounded-lg bg-black/30 border border-white/5 hover:bg-[#18181b]/50 transition-colors"
                  >
                    <div className="p-1 rounded bg-amber-500/10 text-amber-400 mt-0.5 flex-shrink-0">
                      <AlertCircle size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/85 leading-relaxed font-sans font-medium">
                        {log.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40 font-mono">
                        <span>{log.time} Uhr</span>
                        <span>•</span>
                        <span className="text-aif-gold-DEFAULT font-extrabold">{log.symbol}</span>
                        <span>•</span>
                        <span>Dauerhaft im lokalen Cache gespeichert</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
