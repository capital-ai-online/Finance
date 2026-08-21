import React, { useEffect, useRef, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { authFetch } from '../lib/authFetch';

interface SystemEvent {
  id: string;
  timestamp: string;
  type: 'AUTH' | 'SUBSCRIPTION' | 'CREDITS' | 'ORCHESTRATOR' | 'MARKET_DATA' | 'SECURITY';
  action: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

interface ComplianceNotificationsProps {
  currentUserEmail: string;
}

/**
 * Legacy component name retained for import compatibility.
 * Displays authenticated operational notifications only; it is not a compliance/audit channel.
 */
export function ComplianceNotifications({ currentUserEmail }: ComplianceNotificationsProps) {
  const [notifications, setNotifications] = useState<SystemEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const initialized = useRef(false);
  const lastSeenId = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUserEmail) return;
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await authFetch('/api/admin/system-events');
        if (!res.ok) {
          if (!cancelled) setIsConnected(false);
          return;
        }
        const data = await res.json();
        const events: SystemEvent[] = Array.isArray(data.events) ? data.events : [];
        if (cancelled) return;
        setIsConnected(true);

        if (!initialized.current) {
          initialized.current = true;
          lastSeenId.current = events[0]?.id ?? null;
          return;
        }

        if (events.length === 0 || events[0].id === lastSeenId.current) return;
        const previousIndex = lastSeenId.current
          ? events.findIndex((event) => event.id === lastSeenId.current)
          : -1;
        const observed = previousIndex >= 0 ? events.slice(0, previousIndex) : [events[0]];
        lastSeenId.current = events[0].id;
        setNotifications((current) => {
          const unique = observed.filter((event) => !current.some((item) => item.id === event.id));
          return [...unique, ...current].slice(0, 5);
        });
      } catch {
        if (!cancelled) setIsConnected(false);
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [currentUserEmail]);

  const dismissNotification = (id: string) => {
    setNotifications((current) => current.filter((event) => event.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="self-end bg-black/90 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2 pointer-events-auto"
          >
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-[10px] font-mono font-bold text-white/60 tracking-wider uppercase">
              {isConnected ? 'Operational Event Feed' : 'Operational Feed Unavailable'}
            </span>
            <button
              type="button"
              onClick={() => setNotifications([])}
              className="text-white/40 hover:text-white text-[10px] uppercase font-bold tracking-wider pl-1.5 border-l border-white/10"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notifications.map((notification) => {
          const isSuccess = notification.status === 'SUCCESS';
          const isWarning = notification.status === 'WARNING';
          const Icon = isSuccess ? CheckCircle : isWarning ? AlertTriangle : Info;
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="pointer-events-auto rounded-2xl border border-white/10 bg-[#1c1c21]/95 backdrop-blur-xl p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <Icon size={17} className={isSuccess ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'} />
                  <div>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-white/35">
                      <Activity size={10} /> Operational Event · {notification.type}
                    </div>
                    <h4 className="text-sm font-bold text-white">{notification.action}</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismissNotification(notification.id)}
                  className="p-1 rounded-lg bg-white/5 text-white/50 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-white/65 leading-relaxed">{notification.details}</p>
              <div className="text-[9px] font-mono text-white/30">
                {notification.timestamp} · non-authorizing / non-audit projection
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
