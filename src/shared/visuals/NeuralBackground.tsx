import React from 'react';

export type NeuralBackgroundIntensity = 'subtle' | 'standard';

export interface NeuralBackgroundProps {
  intensity?: NeuralBackgroundIntensity;
  className?: string;
}

/**
 * Canonical decorative CAPITAL-AI neural background.
 * Feature components must not re-implement the brand network geometry.
 */
export function NeuralBackground({ intensity = 'subtle', className = '' }: NeuralBackgroundProps) {
  const opacity = intensity === 'standard' ? 'opacity-50' : 'opacity-30';
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${opacity} ${className}`} aria-hidden="true">
      <svg width="100%" height="100%" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="neural-decor absolute inset-0">
        <defs>
          <linearGradient id="capital-ai-neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-aif-gold-DEFAULT)" stopOpacity="0.55" />
            <stop offset="50%" stopColor="var(--color-aif-neon-cyan)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-aif-neon-purple)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        <path d="M0 180 Q280 40 560 220 T1120 120 T1680 260" fill="none" stroke="url(#capital-ai-neural-gradient)" strokeWidth="2" />
        <path d="M80 700 Q360 480 700 690 T1320 520 T1660 720" fill="none" stroke="url(#capital-ai-neural-gradient)" strokeWidth="1.5" />
        <circle cx="320" cy="135" r="6" fill="var(--color-aif-neon-cyan)" className="animate-neural-pulse-fast" />
        <circle cx="780" cy="195" r="7" fill="var(--color-aif-gold-DEFAULT)" className="animate-gold-pulse" />
        <circle cx="1210" cy="105" r="6" fill="var(--color-aif-neon-purple)" className="animate-neural-pulse" />
        <circle cx="520" cy="610" r="5" fill="var(--color-aif-neon-purple)" className="animate-neural-pulse" />
        <circle cx="1080" cy="610" r="6" fill="var(--color-aif-gold-DEFAULT)" className="animate-gold-pulse" />
      </svg>
      <div className="absolute -top-24 right-0 h-80 w-80 rounded-full bg-aif-neon-purple/10 blur-[120px]" />
      <div className="absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-aif-neon-cyan/10 blur-[120px]" />
    </div>
  );
}
