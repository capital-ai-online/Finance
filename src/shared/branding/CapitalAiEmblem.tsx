import React, { useId } from 'react';

interface CapitalAiEmblemProps {
  className?: string;
  sizeClass?: string;
}

/**
 * Canonical CAPITAL-AI emblem geometry.
 *
 * Geometry provenance:
 * SvenKulessa/FRONTEND@8f6b629c985ca2e46c822ff911f53741d0141e07
 * src/components/BrandLogo.tsx (blob 49e3580466cc4566068c5fdcc1dfa94ead3a31dd)
 *
 * Color authority remains local:
 * docs/frontend/design-tokens.json -> src/index.css CSS variables.
 */
export function CapitalAiEmblem({
  className = '',
  sizeClass = 'w-10 h-10',
}: CapitalAiEmblemProps) {
  const id = useId().replace(/:/g, '');
  const gold = `${id}-capital-gold`;
  const accent = `${id}-capital-accent`;
  const deepAccent = `${id}-capital-deep-accent`;
  const goldRod = `${id}-capital-gold-rod`;
  const accentRod = `${id}-capital-accent-rod`;
  const accentGlow = `${id}-capital-accent-glow`;
  const goldGlow = `${id}-capital-gold-glow`;

  return (
    <div
      className={`relative ${sizeClass} flex items-center justify-center shrink-0 select-none ${className}`}
      data-logo-source="SvenKulessa/FRONTEND"
      data-logo-source-commit="8f6b629c985ca2e46c822ff911f53741d0141e07"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id={gold} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--color-foreground)" />
            <stop offset="35%" stopColor="var(--color-brand-primary)" />
            <stop offset="70%" stopColor="var(--color-brand-primary)" />
            <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0.72" />
          </radialGradient>
          <radialGradient id={accent} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--color-foreground)" />
            <stop offset="30%" stopColor="var(--color-brand-accent)" stopOpacity="0.45" />
            <stop offset="70%" stopColor="var(--color-brand-accent)" />
            <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity="0.65" />
          </radialGradient>
          <radialGradient id={deepAccent} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="var(--color-foreground)" />
            <stop offset="32%" stopColor="var(--color-brand-accent)" stopOpacity="0.7" />
            <stop offset="78%" stopColor="var(--color-brand-accent)" />
            <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity="0.58" />
          </radialGradient>
          <linearGradient id={goldRod} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.72" />
            <stop offset="50%" stopColor="var(--color-brand-primary)" />
            <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0.66" />
          </linearGradient>
          <linearGradient id={accentRod} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-brand-primary)" />
            <stop offset="50%" stopColor="var(--color-brand-accent)" stopOpacity="0.72" />
            <stop offset="100%" stopColor="var(--color-brand-accent)" />
          </linearGradient>
          <filter id={accentGlow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id={goldGlow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <circle cx="50" cy="50" r="32" fill="var(--color-brand-accent)" opacity="0.18" filter={`url(#${accentGlow})`} />
        <circle cx="50" cy="48" r="18" fill="var(--color-brand-primary)" opacity="0.15" filter={`url(#${goldGlow})`} />

        <g strokeWidth="2.2" strokeLinecap="round" opacity="0.88">
          <line x1="20" y1="26" x2="50" y2="12" stroke={`url(#${goldRod})`} />
          <line x1="50" y1="12" x2="80" y2="26" stroke={`url(#${goldRod})`} />
          <line x1="80" y1="26" x2="85" y2="60" stroke={`url(#${goldRod})`} />
          <line x1="85" y1="60" x2="68" y2="82" stroke={`url(#${accentRod})`} />
          <line x1="68" y1="82" x2="32" y2="82" stroke={`url(#${accentRod})`} />
          <line x1="32" y1="82" x2="15" y2="60" stroke={`url(#${accentRod})`} />
          <line x1="15" y1="60" x2="20" y2="26" stroke={`url(#${goldRod})`} />

          <line x1="20" y1="26" x2="50" y2="48" stroke={`url(#${accentRod})`} strokeWidth="2" />
          <line x1="80" y1="26" x2="50" y2="48" stroke={`url(#${accentRod})`} strokeWidth="2" />
          <line x1="15" y1="60" x2="50" y2="48" stroke={`url(#${goldRod})`} strokeWidth="2" />
          <line x1="85" y1="60" x2="50" y2="48" stroke={`url(#${goldRod})`} strokeWidth="2" />
          <line x1="32" y1="82" x2="50" y2="48" stroke={`url(#${accentRod})`} strokeWidth="2.4" />
          <line x1="68" y1="82" x2="50" y2="48" stroke={`url(#${accentRod})`} strokeWidth="2.4" />
          <line x1="50" y1="12" x2="50" y2="48" stroke={`url(#${goldRod})`} strokeWidth="2.2" />

          <line x1="33" y1="36" x2="67" y2="36" stroke={`url(#${accentRod})`} strokeWidth="1.6" opacity="0.75" />
          <line x1="33" y1="36" x2="20" y2="26" stroke={`url(#${goldRod})`} strokeWidth="1.4" opacity="0.8" />
          <line x1="67" y1="36" x2="80" y2="26" stroke={`url(#${goldRod})`} strokeWidth="1.4" opacity="0.8" />
          <line x1="33" y1="36" x2="32" y2="82" stroke={`url(#${accentRod})`} strokeWidth="1.5" opacity="0.65" />
          <line x1="67" y1="36" x2="68" y2="82" stroke={`url(#${accentRod})`} strokeWidth="1.5" opacity="0.65" />
          <line x1="15" y1="60" x2="85" y2="60" stroke={`url(#${goldRod})`} strokeWidth="1.3" opacity="0.45" strokeDasharray="3 2" />
        </g>

        <circle cx="50" cy="12" r="6.2" fill={`url(#${gold})`} />
        <circle cx="48.5" cy="10.5" r="1.8" fill="var(--color-foreground)" opacity="0.8" />
        <circle cx="20" cy="26" r="7.5" fill={`url(#${gold})`} />
        <circle cx="18" cy="24" r="2.2" fill="var(--color-foreground)" opacity="0.85" />
        <circle cx="80" cy="26" r="7.5" fill={`url(#${gold})`} />
        <circle cx="78" cy="24" r="2.2" fill="var(--color-foreground)" opacity="0.85" />

        <circle cx="33" cy="36" r="5.2" fill={`url(#${accent})`} filter={`url(#${accentGlow})`} />
        <circle cx="33" cy="36" r="4.2" fill={`url(#${accent})`} />
        <circle cx="31.8" cy="34.8" r="1.4" fill="var(--color-foreground)" opacity="0.9" />
        <circle cx="67" cy="36" r="5.2" fill={`url(#${accent})`} filter={`url(#${accentGlow})`} />
        <circle cx="67" cy="36" r="4.2" fill={`url(#${accent})`} />
        <circle cx="65.8" cy="34.8" r="1.4" fill="var(--color-foreground)" opacity="0.9" />

        <circle cx="15" cy="60" r="6.5" fill={`url(#${gold})`} />
        <circle cx="13.5" cy="58.5" r="1.9" fill="var(--color-foreground)" opacity="0.8" />
        <circle cx="85" cy="60" r="6.5" fill={`url(#${gold})`} />
        <circle cx="83.5" cy="58.5" r="1.9" fill="var(--color-foreground)" opacity="0.8" />

        <circle cx="32" cy="82" r="7.8" fill={`url(#${deepAccent})`} filter={`url(#${accentGlow})`} />
        <circle cx="32" cy="82" r="6.8" fill={`url(#${deepAccent})`} />
        <circle cx="30" cy="80" r="2" fill="var(--color-foreground)" opacity="0.9" />
        <circle cx="68" cy="82" r="7.8" fill={`url(#${deepAccent})`} filter={`url(#${accentGlow})`} />
        <circle cx="68" cy="82" r="6.8" fill={`url(#${deepAccent})`} />
        <circle cx="66" cy="80" r="2" fill="var(--color-foreground)" opacity="0.9" />

        <circle cx="50" cy="48" r="11" fill="var(--color-brand-accent)" opacity="0.35" filter={`url(#${accentGlow})`} />
        <circle cx="50" cy="48" r="9" fill={`url(#${deepAccent})`} />
        <circle cx="50" cy="48" r="6.5" fill={`url(#${accent})`} />
        <circle cx="47.5" cy="45.5" r="2.4" fill="var(--color-foreground)" opacity="0.95" />

        <path d="M12 40 L13 36 L14 40 L18 41 L14 42 L13 46 L12 42 L8 41 Z" fill="var(--color-brand-primary)" opacity="0.8" />
        <path d="M88 42 L89 39 L90 42 L93 43 L90 44 L89 47 L88 44 L85 43 Z" fill="var(--color-brand-accent)" opacity="0.85" />
        <path d="M50 72 L51 70 L52 72 L54 73 L52 74 L51 76 L50 74 L48 73 Z" fill="var(--color-brand-accent)" opacity="0.9" />
        <path d="M38 18 L39 16 L40 18 L42 19 L40 20 L39 22 L38 20 L36 19 Z" fill="var(--color-brand-primary)" opacity="0.7" />
        <path d="M62 18 L63 16 L64 18 L66 19 L64 20 L63 22 L62 20 L60 19 Z" fill="var(--color-brand-primary)" opacity="0.7" />
      </svg>
    </div>
  );
}
