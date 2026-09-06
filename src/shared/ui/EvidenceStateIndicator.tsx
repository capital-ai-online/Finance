import React from 'react';
import { AlertTriangle, CheckCircle2, Database } from 'lucide-react';

export interface EvidenceStateIndicatorProps {
  status?: string;
  state?: string;
  label?: string;
  providerCount?: number;
  evidenceCount?: number;
  className?: string;
}

type EvidenceTone = {
  text: string;
  dot: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

function normalize(status: string): string {
  return status.trim().toUpperCase().replace(/\s+/g, '_');
}

function resolveTone(status: string): EvidenceTone {
  const key = normalize(status);
  if (key === 'READY' || key === 'VERIFIED' || key === 'LIVE') {
    return { text: 'text-status-ready', dot: 'bg-status-ready', Icon: CheckCircle2 };
  }
  if (['PARTIAL', 'STALE', 'DEGRADED', 'DELAYED'].includes(key)) {
    return { text: 'text-score-warning', dot: 'bg-score-warning', Icon: AlertTriangle };
  }
  if (['INVALID', 'ERROR', 'REJECT', 'BLOCKED'].includes(key)) {
    return { text: 'text-status-reject', dot: 'bg-status-reject', Icon: AlertTriangle };
  }
  if (key === 'HISTORICAL') {
    return { text: 'text-status-info', dot: 'bg-status-info', Icon: Database };
  }
  return { text: 'text-text-secondary', dot: 'bg-text-secondary', Icon: Database };
}

export function EvidenceStateIndicator({
  status,
  state,
  label,
  providerCount,
  evidenceCount,
  className = '',
}: EvidenceStateIndicatorProps) {
  const normalized = normalize(status ?? state ?? 'NOT_AVAILABLE');
  const tone = resolveTone(normalized);
  const visibleLabel = label ?? normalized;
  const metadata = [
    providerCount === undefined ? null : `${providerCount} Provider`,
    evidenceCount === undefined ? null : `${evidenceCount} Evidence`,
  ].filter((item): item is string => Boolean(item));

  return (
    <span
      role="status"
      aria-label={`Evidence state: ${visibleLabel}${metadata.length ? `. ${metadata.join(', ')}` : ''}.`}
      data-evidence-state={normalized}
      className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider ${tone.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden />
      <tone.Icon size={10} aria-hidden className="shrink-0" />
      <span>{visibleLabel}</span>
      {metadata.length > 0 && <span className="font-normal normal-case tracking-normal opacity-70">· {metadata.join(' · ')}</span>}
    </span>
  );
}

export default EvidenceStateIndicator;
