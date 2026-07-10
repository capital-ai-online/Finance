import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Shield, X, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { ComplianceBadge } from './ComplianceBadge';

interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'SECURITY' | 'ORCHESTRATOR' | 'HYGIENE' | 'SYSTEM' | 'COMMODITY' | 'CRYPTO';
  action: string;
  userEmail: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ip?: string;
}

interface ComplianceNotificationsProps {
  currentUserEmail: string;
}

export function ComplianceNotifications({ currentUserEmail }: ComplianceNotificationsProps) {
  const [notifications, setNotifications] = useState<SystemEvent[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Map events to relevant ADR references
  const getADRForEvent = (event: SystemEvent) => {
    switch (event.type) {
      case 'SECURITY':
        return {
          adr: 'ADR-0003.5',
          title: 'Identity Access Management',
          description: 'Sichert Administrationsberechtigungen und schützt PII-Daten.'
        };
      case 'ORCHESTRATOR':
        return {
          adr: 'ADR-0006',
          title: 'Model-Independent Router & Data Masking',
          description: 'Sichert Multi-LLM-Routings und anonymisiert Logdaten-Signaturen.'
        };
      case 'HYGIENE':
        return {
          adr: 'ADR-0004 & ADR-0007',
          title: 'Autonomous Documentary & Version Pinning',
          description: 'Verwaltet Dokumentenhygiene, Version 0.5.4 und Rollbacks.'
        };
      default:
        return {
          adr: 'ADR-0007',
          title: 'Compliance Value Chain & System Documentation',
          description: 'Ermöglicht automatische, manipulationssichere Berichterstellung.'
        };
    }
  };

  useEffect(() => {
    if (!currentUserEmail) return;

    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let lastSeenId: string | null = null;

    // Try starting EventSource (SSE)
    const startSSE = () => {
      const url = `/api/admin/system-events/stream?email=${encodeURIComponent(currentUserEmail)}`;
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('[SSE] Compliance stream connected.');
      };

      eventSource.onerror = (err) => {
        setIsConnected(false);
        console.warn('[SSE] Connection lost. Falling back to active poll loop...', err);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startPolling();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type !== 'KEEPALIVE') {
            const newEvent = data as SystemEvent;
            // Prevent duplicates
            setNotifications(prev => {
              if (prev.some(n => n.id === newEvent.id)) return prev;
              return [newEvent, ...prev].slice(0, 5); // Keep up to 5 on screen
            });
          }
        } catch (e) {
          console.error('[SSE] Failed to parse event payload:', e);
        }
      };
    };

    // Polling fallback
    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/admin/system-events?email=${encodeURIComponent(currentUserEmail)}`);
          if (!res.ok) throw new Error('API request failed');
          const data = await res.json();
          if (data && Array.isArray(data.events) && data.events.length > 0) {
            const latest = data.events[0] as SystemEvent;
            if (lastSeenId && latest.id !== lastSeenId) {
              // Find all events newer than lastSeenId
              const index = data.events.findIndex((e: SystemEvent) => e.id === lastSeenId);
              const newEvents = index !== -1 ? data.events.slice(0, index) : [latest];
              
              setNotifications(prev => {
                const uniqueNew = newEvents.filter((n: SystemEvent) => !prev.some(p => p.id === n.id));
                return [...uniqueNew, ...prev].slice(0, 5);
              });
            }
            lastSeenId = latest.id;
          }
        } catch (err) {
          console.warn('[Polling] Fallback poll loop error:', err);
        }
      }, 10000); // Poll every 10 seconds
    };

    startSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentUserEmail]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {/* Stream Status indicator */}
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="self-end bg-black/90 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 pointer-events-auto"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-[10px] font-mono font-bold text-white/60 tracking-wider uppercase">
              {isConnected ? 'Compliance Live Stream Active' : 'Polling Compliance State'}
            </span>
            <button
              onClick={() => setNotifications([])}
              className="text-white/40 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-wider pl-1.5 border-l border-white/10"
            >
              Clear All
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notifications.map((notif) => {
          const adrInfo = getADRForEvent(notif);
          const isSuccess = notif.status === 'SUCCESS';
          const isWarning = notif.status === 'WARNING';
          
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 22, stiffness: 150 }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border bg-[#1c1c21]/95 backdrop-blur-xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-3 ${
                isSuccess 
                  ? 'border-emerald-500/30 shadow-emerald-950/20' 
                  : isWarning 
                    ? 'border-amber-500/30 shadow-amber-950/20' 
                    : 'border-rose-500/30 shadow-rose-950/20'
              }`}
            >
              {/* Decorative top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-[3px] ${
                isSuccess 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                  : isWarning 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                    : 'bg-gradient-to-r from-rose-500 to-red-500'
              }`} />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    isSuccess 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : isWarning 
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}>
                    {isSuccess ? (
                      <CheckCircle size={18} />
                    ) : isWarning ? (
                      <AlertTriangle size={18} />
                    ) : (
                      <Shield size={18} />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-white/40 tracking-widest uppercase">
                      Compliance Audit Entry
                    </span>
                    <h4 className="text-sm font-bold font-display text-white tracking-wide uppercase">
                      {notif.action}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <p className="text-white/70 font-sans leading-relaxed">
                  {notif.details}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[10px] text-white/40">
                  <span>Auditor: <strong className="text-white/60">{notif.userEmail}</strong></span>
                  <span>•</span>
                  <span>IP: <strong className="text-white/60">{notif.ip || 'Local Loopback'}</strong></span>
                </div>
              </div>

              {/* Compliance & ADR Association */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                <div className="flex items-center gap-1.5 font-mono text-[9px] text-white/30">
                  <Bell size={10} className="text-aif-gold-DEFAULT animate-pulse" />
                  <span>LIVE COMPLIANCE ALERTS</span>
                </div>

                {adrInfo && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-white/40">Reference:</span>
                    <ComplianceBadge
                      adr={adrInfo.adr}
                      title={adrInfo.title}
                      description={adrInfo.description}
                      isActive={true}
                      placement="left"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
