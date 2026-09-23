import React from 'react';
import { Eye, Filter, Newspaper, ShieldCheck } from 'lucide-react';
interface LandingRealtimeAiNewsfeedProps {
  onLoginNavigate?: () => void;
}

const CAPABILITY_FACTS = [
  {
    title: 'Verifizierte Artikel',
    description: 'Externe Artikel-Evidence statt erfundener Schlagzeilen.',
    icon: ShieldCheck,
  },
  {
    title: 'Multi-Asset-Filter',
    description: 'Asset- und Quellenfilter bleiben Teil des kanonischen Newsfeed.',
    icon: Filter,
  },
  {
    title: 'Evidence-only',
    description: 'News-Sentiment bleibt Präsentationsmetadatum ohne direkten Score-Impact.',
    icon: Newspaper,
  },
] as const;

/**
 * Public landing projection of the canonical realtime AI Newsfeed capability.
 *
 * The productive feed remains authenticated and server-entitlement protected. Because the
 * public landing route is intentionally anonymous, this component does not invoke the protected
 * news REST surface and does not create a second public news transport or synthetic preview dataset.
 */
export function LandingRealtimeAiNewsfeed({
  onLoginNavigate: _onLoginNavigate,
}: LandingRealtimeAiNewsfeedProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-2xl border border-brand-accent/20 bg-background/45 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-accent/30 bg-brand-accent/10 text-brand-accent">
              <Newspaper size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-brand-accent">
                Canonical Realtime AI Newsfeed
              </p>
              <h3 className="mt-1 text-base font-black text-text-primary sm:text-lg">
                Live-News ohne Tarif-Sichtbarkeitsschranke
              </h3>
            </div>
          </div>

          <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-primary/25 bg-brand-primary/10 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-brand-primary">
            <Eye size={13} aria-hidden="true" />
            Für alle sichtbar
          </span>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Das bisherige abonnementsabhängige Sichtbarkeitsmodell ist vorerst deaktiviert. Die
          News-/Evidence-Komponente wird unabhängig vom Tarif dargestellt; es entsteht kein zweiter
          News-Datenpfad und keine synthetische Demo-Evidence.
        </p>

        <p className="mt-5 text-[11px] leading-relaxed text-text-secondary">
          Geschützte Schreib-, Rechen- oder Provider-Aktionen behalten ihre eigenen serverseitigen
          Sicherheitsgrenzen. Sichtbarkeit ist nicht gleich Ausführungsautorität.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {CAPABILITY_FACTS.map(({ title, description, icon: Icon }) => (
          <article
            key={title}
            className="rounded-xl border border-border bg-background/45 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-primary/20 bg-brand-primary/[0.07] text-brand-primary">
                <Icon size={16} aria-hidden="true" />
              </span>
              <div>
                <h4 className="text-xs font-black text-text-primary">{title}</h4>
                <p className="mt-1 text-[10px] leading-relaxed text-text-secondary">{description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
