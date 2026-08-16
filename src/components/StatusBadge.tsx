import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Database,
  Loader2,
  XCircle,
} from 'lucide-react';

/**
 * Canonical frontend status values for scoring / data availability.
 * Matches backend contracts (READY, SCORE_NOT_COMPUTABLE, …) and UX states.
 */
export type StatusBadgeStatus =
  | 'READY'
  | 'REJECT'
  | 'DATA_UNAVAILABLE'
  | 'LOADING'
  | 'SCORE_NOT_COMPUTABLE'
  | 'OBSERVE'
  | 'ERROR'
  | (string & {});

export interface StatusBadgeProps {
  status: StatusBadgeStatus;
  /** Optional override of visible label (defaults to normalized status text). */
  label?: string;
  className?: string;
  /** Show leading icon (default true) — required for color-independent meaning. */
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

type Tone = {
  text: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultLabel: string;
};

const TONES: Record<string, Tone> = {
  READY: {
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/25',
    Icon: CheckCircle2,
    defaultLabel: 'READY',
  },
  REJECT: {
    text: 'text-rose-300',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/25',
    Icon: XCircle,
    defaultLabel: 'REJECT',
  },
  DATA_UNAVAILABLE: {
    text: 'text-white/50',
    bg: 'bg-white/5',
    border: 'border-white/15',
    Icon: Database,
    defaultLabel: 'DATA_UNAVAILABLE',
  },
  LOADING: {
    text: 'text-aif-gold-DEFAULT',
    bg: 'bg-aif-gold-DEFAULT/10',
    border: 'border-aif-gold-DEFAULT/25',
    Icon: Loader2,
    defaultLabel: 'LOADING',
  },
  SCORE_NOT_COMPUTABLE: {
    text: 'text-amber-200',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    Icon: CircleSlash,
    defaultLabel: 'SCORE_NOT_COMPUTABLE',
  },
  OBSERVE: {
    text: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/25',
    Icon: AlertTriangle,
    defaultLabel: 'OBSERVE',
  },
  ERROR: {
    text: 'text-red-200',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    Icon: AlertTriangle,
    defaultLabel: 'ERROR',
  },
};

const FALLBACK: Tone = {
  text: 'text-amber-200',
  bg: 'bg-amber-500/10',
  border: 'border-amber-500/25',
  Icon: AlertTriangle,
  defaultLabel: 'UNKNOWN',
};

function normalizeStatus(status: string): string {
  return status.trim().toUpperCase().replace(/\s+/g, '_');
}

function resolveTone(status: string): Tone {
  const key = normalizeStatus(status);
  if (TONES[key]) return TONES[key];
  // Soft aliases from decision / integrity vocabulary
  if (key.includes('UNAVAILABLE') || key.includes('NOT_COMPUTABLE')) return TONES.DATA_UNAVAILABLE;
  if (key.includes('REJECT') || key === 'FAIL') return TONES.REJECT;
  if (key.includes('LOAD') || key === 'PENDING') return TONES.LOADING;
  if (key.includes('ERROR') || key.includes('FAIL')) return TONES.ERROR;
  if (key.includes('OBSERVE') || key.includes('WATCH')) return TONES.OBSERVE;
  if (key === 'READY' || key === 'OK' || key === 'VERIFIED') return TONES.READY;
  return { ...FALLBACK, defaultLabel: key || FALLBACK.defaultLabel };
}

/**
 * Shared status badge: color + text + icon (WCAG: not color-only).
 * Phase 0 design-system primitive — see docs/frontend/PHASE0_LOADING_ERROR_STATES.md
 */
export function StatusBadge({
  status,
  label,
  className = '',
  showIcon = true,
  size = 'sm',
}: StatusBadgeProps) {
  const tone = resolveTone(String(status ?? 'DATA_UNAVAILABLE'));
  const text = label ?? tone.defaultLabel;
  const iconSize = size === 'md' ? 12 : 10;
  const padding = size === 'md' ? 'px-2.5 py-1' : 'px-2 py-0.5';
  const textSize = size === 'md' ? 'text-[10px]' : 'text-[9px]';
  const isLoading = normalizeStatus(String(status)) === 'LOADING';

  return (
    <span
      role="status"
      aria-label={`Status: ${text}`}
      className={
        `inline-flex items-center gap-1 ${padding} rounded ${textSize} font-mono font-black tracking-widest uppercase border select-none ` +
        `${tone.bg} ${tone.text} ${tone.border} ${className}`
      }
    >
      {showIcon && (
        <tone.Icon
          size={iconSize}
          className={`shrink-0 ${isLoading ? 'animate-spin' : ''}`}
          aria-hidden
        />
      )}
      <span>{text}</span>
    </span>
  );
}

export default StatusBadge;
