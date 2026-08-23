import React from 'react';
import { CircleSlash, Sparkles } from 'lucide-react';

export interface ResearchOnlyBannerProps {
  modelLabel?: string;
  title?: string;
  description?: string;
  scoreEligible?: false;
  executionEligible?: false;
  className?: string;
}

export function ResearchOnlyBanner({
  modelLabel,
  title = 'Research Only',
  description,
  scoreEligible = false,
  executionEligible = false,
  className = '',
}: ResearchOnlyBannerProps) {
  return (
    <div
      role="note"
      aria-label={`${title}${modelLabel ? `: ${modelLabel}` : ''}. Score eligible: nein. Execution eligible: nein.${description ? ` ${description}` : ''}`}
      data-score-eligible={String(scoreEligible)}
      data-execution-eligible={String(executionEligible)}
      className={`rounded-xl border border-brand-accent/25 bg-brand-accent/[0.06] p-3 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-black uppercase tracking-wider text-brand-accent">
          <Sparkles size={11} aria-hidden /> {title}
        </span>
        {modelLabel && <span className="text-[9px] font-mono text-text-secondary">{modelLabel}</span>}
      </div>
      {description && <p className="mt-2 text-[10px] leading-relaxed text-text-secondary">{description}</p>}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9px] font-mono text-text-secondary">
        <span className="inline-flex items-center gap-1"><CircleSlash size={10} aria-hidden /> Score-eligible: nein</span>
        <span className="inline-flex items-center gap-1"><CircleSlash size={10} aria-hidden /> Execution-eligible: nein</span>
      </div>
    </div>
  );
}

export default ResearchOnlyBanner;
