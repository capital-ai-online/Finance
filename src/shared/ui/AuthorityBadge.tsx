import React from 'react';
import { Activity, Award, Database, Sparkles } from 'lucide-react';

export type VisualizationAuthority =
  | 'CANONICAL_SCORE'
  | 'RESEARCH'
  | 'EVIDENCE_ONLY'
  | 'MARKET_DATA';

export interface AuthorityBadgeProps {
  authority: VisualizationAuthority;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
  compact?: boolean;
}

type AuthorityTone = {
  label: string;
  description: string;
  text: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

const AUTHORITY_TONES: Record<VisualizationAuthority, AuthorityTone> = {
  CANONICAL_SCORE: {
    label: 'Canonical Score',
    description: 'Kanonische Scoring-Authority',
    text: 'text-brand-primary',
    bg: 'bg-brand-primary/10',
    border: 'border-brand-primary/30',
    Icon: Award,
  },
  RESEARCH: {
    label: 'Research',
    description: 'Research-Kontext, nicht kanonischer Score',
    text: 'text-brand-accent',
    bg: 'bg-brand-accent/10',
    border: 'border-brand-accent/30',
    Icon: Sparkles,
  },
  EVIDENCE_ONLY: {
    label: 'Evidence Only',
    description: 'Evidence-Projektion ohne eigene Score-Authority',
    text: 'text-text-secondary',
    bg: 'bg-surface/70',
    border: 'border-border',
    Icon: Database,
  },
  MARKET_DATA: {
    label: 'Market Data',
    description: 'Marktdaten-Projektion, getrennt vom Scoring',
    text: 'text-brand-cyan',
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/30',
    Icon: Activity,
  },
};

export function AuthorityBadge({
  authority,
  label,
  className = '',
  size = 'sm',
  compact = false,
}: AuthorityBadgeProps) {
  const tone = AUTHORITY_TONES[authority];
  const resolvedSize = compact ? 'sm' : size;
  const padding = resolvedSize === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';
  const textSize = resolvedSize === 'md' ? 'text-[10px]' : 'text-[9px]';
  const iconSize = resolvedSize === 'md' ? 12 : 10;
  const visibleLabel = label ?? tone.label;

  return (
    <span
      role="status"
      aria-label={`${visibleLabel}. ${tone.description}.`}
      data-visualization-authority={authority}
      className={`inline-flex items-center gap-1 rounded border ${padding} ${textSize} font-mono font-black uppercase tracking-wider ${tone.text} ${tone.bg} ${tone.border} ${className}`}
    >
      <tone.Icon size={iconSize} aria-hidden className="shrink-0" />
      <span>{visibleLabel}</span>
    </span>
  );
}

export default AuthorityBadge;
