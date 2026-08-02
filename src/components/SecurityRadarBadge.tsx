import React from 'react';

export interface SecurityRadarBadgeProps {
  className?: string;
}

/**
 * Webscan Radar Sicherheits-Score-Badge. Wird site-weit direkt oberhalb jedes Footers
 * eingebunden (LandingPage.tsx für ausgeloggte Besucher:innen, Dashboard.tsx für alle
 * eingeloggten Ansichten) - eine einzige Quelle statt divergierender Kopien.
 */
export function SecurityRadarBadge({ className = '' }: SecurityRadarBadgeProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">
        System Security Verified By
      </span>
      <a
        href="https://webscan-radar.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block transition-all hover:scale-105 active:scale-95 duration-200"
      >
        <img
          src="https://webscan-radar.com/badge/Capital-AI.online"
          alt="Sicherheits-Score von Webscan Radar"
          className="h-9 w-auto rounded border border-white/10 shadow-lg"
          referrerPolicy="no-referrer"
        />
      </a>
    </div>
  );
}
