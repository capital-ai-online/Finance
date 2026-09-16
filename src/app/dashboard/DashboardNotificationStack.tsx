import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { DashboardPushNotificationInput } from './DashboardHome';

export interface DashboardPushNotification extends DashboardPushNotificationInput {
  id: string;
  timestamp: string;
}

export interface DashboardNotificationStackProps {
  notifications: DashboardPushNotification[];
  onDismiss: (id: string) => void;
}

/** Presentation-only notification stack; financial values arrive from existing evidence flows. */
export function DashboardNotificationStack({
  notifications,
  onDismiss,
}: DashboardNotificationStackProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => {
          const isBullish = notif.sentiment === 'bullish';
          const isBearish = notif.sentiment === 'bearish';

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
              className="pointer-events-auto w-full bg-[#0e0e11]/95 border border-white/10 rounded-xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden flex flex-col gap-2 group"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : 'bg-blue-500'}`} />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono shrink-0 ${isBullish ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isBearish ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    {isBullish ? '🟢 BULLISH SCORE ALERT' : isBearish ? '🔴 BEARISH SCORE ALERT' : '🔵 NEWS ALERT'}
                  </span>
                  {notif.isOnWatchlist && (
                    <span className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT px-1.5 py-0.5 rounded text-[8px] font-black font-mono tracking-wider shrink-0 animate-pulse flex items-center gap-0.5">
                      ⭐ RADAR
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onDismiss(notif.id)}
                  className="text-white/40 hover:text-white transition-colors cursor-pointer"
                  aria-label={`${notif.symbol} Benachrichtigung schließen`}
                >
                  <X size={12} />
                </button>
              </div>

              <div className="flex items-start gap-2.5 mt-1">
                <div className="flex flex-col items-center shrink-0">
                  <span className="font-mono text-[14px] font-black text-white">{notif.symbol}</span>
                  <div className={`mt-1 font-mono text-xs py-0.5 px-1.5 rounded font-black border text-center ${notif.score > 7 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                    {notif.score.toFixed(1)}
                  </div>
                  <span className="text-[7px] font-mono text-white/30 uppercase mt-0.5">Score</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white leading-snug line-clamp-3">{notif.headline}</p>
                  <div className="flex items-center justify-between mt-2 text-[9px] font-mono text-white/40">
                    <span>
                      Score: <span className="text-white/60">{notif.oldScore}</span> → <span className={isBullish ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{notif.score}</span>
                    </span>
                    <span>{notif.timestamp}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
