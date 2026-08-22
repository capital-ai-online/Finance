import React from 'react';
import { motion } from 'motion/react';
import { CAPITAL_AI_VERSION } from '../../platform/Branding/runtimeBrand';

interface CapitalAiLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  version?: string;
}

/**
 * Canonical CAPITAL-AI brand mark.
 * Branding Manifest v6.0: Gold is primary, Purple is the only AI accent.
 * Cyan/blue brand geometry is intentionally not rendered.
 */
export function CapitalAiLogo({ className = '', size = 160, showText = true, version = CAPITAL_AI_VERSION }: CapitalAiLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <motion.div
        animate={{ scale: [1, 1.03, 1], rotateY: [0, 8, 0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        className="perspective-1000 select-none cursor-pointer"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 200 180" width="100%" height="100%" className="filter drop-shadow-[0_0_25px_rgba(249,191,33,0.3)]" aria-hidden="true">
          <defs>
            <radialGradient id="gold-sphere-3d" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="var(--color-brand-primary)" />
              <stop offset="42%" stopColor="var(--color-brand-primary)" />
              <stop offset="100%" stopColor="var(--color-brand-primary)" />
            </radialGradient>
            <filter id="glow-line" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <g strokeOpacity="0.55" strokeWidth="1">
            <line x1="60" y1="50" x2="140" y2="133" stroke="var(--color-brand-accent)" filter="url(#glow-line)" />
            <line x1="140" y1="48" x2="60" y2="135" stroke="var(--color-brand-accent)" />
            <line x1="140" y1="48" x2="78" y2="93" stroke="var(--color-brand-accent)" />
            <line x1="65" y1="85" x2="140" y2="133" stroke="var(--color-brand-accent)" />
            <line x1="60" y1="50" x2="140" y2="48" stroke="var(--color-brand-accent)" />
            <line x1="60" y1="135" x2="142" y2="90" stroke="var(--color-brand-accent)" filter="url(#glow-line)" />
            <line x1="100" y1="145" x2="65" y2="85" stroke="var(--color-brand-accent)" />
            <line x1="105" y1="55" x2="65" y2="85" stroke="var(--color-brand-accent)" />
            <line x1="65" y1="85" x2="142" y2="90" stroke="var(--color-brand-accent)" />
            <line x1="100" y1="100" x2="60" y2="50" stroke="var(--color-brand-accent)" />
          </g>
          <g stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeOpacity="0.85">
            <line x1="60" y1="50" x2="78" y2="93" />
            <line x1="78" y1="93" x2="60" y2="135" />
            <line x1="60" y1="135" x2="100" y2="145" />
            <line x1="100" y1="145" x2="140" y2="133" />
            <line x1="140" y1="133" x2="142" y2="90" />
            <line x1="142" y1="90" x2="140" y2="48" />
            <line x1="140" y1="48" x2="105" y2="55" />
            <line x1="105" y1="55" x2="100" y2="100" />
            <line x1="100" y1="100" x2="100" y2="145" />
            <line x1="100" y1="100" x2="78" y2="93" />
            <line x1="100" y1="100" x2="142" y2="90" />
          </g>
          <g>
            <circle cx="100" cy="100" r="11" fill="url(#gold-sphere-3d)" />
            <circle cx="60" cy="50" r="6.5" fill="url(#gold-sphere-3d)" />
            <circle cx="105" cy="55" r="4.5" fill="url(#gold-sphere-3d)" />
            <circle cx="140" cy="48" r="7" fill="url(#gold-sphere-3d)" />
            <circle cx="65" cy="85" r="4.5" fill="url(#gold-sphere-3d)" />
            <circle cx="78" cy="93" r="5" fill="url(#gold-sphere-3d)" />
            <circle cx="142" cy="90" r="6" fill="url(#gold-sphere-3d)" />
            <circle cx="60" cy="135" r="7.5" fill="url(#gold-sphere-3d)" />
            <circle cx="100" cy="145" r="5.5" fill="url(#gold-sphere-3d)" />
            <circle cx="140" cy="133" r="8" fill="url(#gold-sphere-3d)" />
          </g>
        </svg>
      </motion.div>
      {showText && (
        <div className="mt-4 flex flex-col items-center">
          <h1 className="text-2xl font-black text-brand-primary tracking-[0.1em] font-display uppercase mr-[-0.1em]">CAPITAL-AI</h1>
          <p className="text-[10px] text-white/50 font-mono tracking-[0.3em] uppercase mt-1.5 mr-[-0.3em]">VERSION {version}</p>
        </div>
      )}
    </div>
  );
}
