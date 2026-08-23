import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';

export interface FreshnessBadgeProps {
  state?: string | null;
  observedAt?: string | null;
  retrievedAt?: string | null;
  label?: string;
  className?: string;
}

type FreshnessTone = {
  text: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

const DEFAULT_TONE: FreshnessTone = {
  text: 'text-text-secondary',
  bg: 'bg-surface/70',
  border: 'border-border',
  Icon: Clock,
};

function normalize(value?: string | null): string {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '_');
}

function toneFor(state?: string | null): FreshnessTone {
  const normalized = normalize(state);
  if (normalized === 'LIVE') {
    return { text: 'text-status-ready', bg: 'bg-status-ready/5', border: 'border-status-ready/20', Icon: Clock };
  }
  if (normalized === 'HISTORICAL') {
    return { text: 'text-brand-cyan', bg: 'bg-brand-cyan/5', border: 'border-brand-cyan/20', Icon: Clock };
  }
  if (['DELAYED', 'STALE', 'DEGRADED', 'PARTIAL'].includes(normalized)) {
    return { text: 'text-score-warning', bg: 'bg-score-warning/5', border: 'border-score-warning/20', Icon: AlertTriangle };
  }
  if (['INVALID', 'REJECT', 'ERROR'].includes(normalized)) {
    return { text: 'text-status-reject', bg: 'bg-status-reject/5', border: 'border-status-reject/20', Icon: AlertTriangle };
  }
  return DEFAULT_TONE;
}

function formatTimestamp(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FreshnessBadge({
  state,
  observedAt,
  retrievedAt,
  label,
  className = '',
}: FreshnessBadgeProps) {
  const tone = toneFor(state);
  const normalized = normalize(state);
  const observed = formatTimestamp(observedAt);
  const retrieved = formatTimestamp(retrievedAt);
  const visibleLabel = label ?? (normalized || 'Zeitstempel');
  const detail = observed
    ? `Observed: ${observed}`
    : retrieved
      ? `Retrieved: ${retrieved}`
      : 'Kein Zeitstempel verfügbar';

  return (
    <span
      role="status"
      aria-label={`Freshness: ${visibleLabel}. ${detail}. Die UI leitet daraus keinen eigenen Freshness-Status ab.`}
      title={detail}
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${tone.text} ${tone.bg} ${tone.border} ${className}`}
    >
      <tone.Icon size={10} aria-hidden className="shrink-0" />
      <span>{visibleLabel}</span>
      {(observed || retrieved) && <span className="normal-case tracking-normal opacity-75">· {observed ?? retrieved}</span>}
    </span>
  );
}

export default FreshnessBadge;
