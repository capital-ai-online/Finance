import type { HTMLAttributes, ReactNode } from 'react';
import { BrandLogo } from './frontend-port/components/BrandLogo';

interface LandingPageTemplateProps {
  eyebrow: string;
  statusLabel?: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

interface LandingPanelProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function LandingPanel({
  elevated = false,
  className = '',
  ...props
}: LandingPanelProps) {
  return (
    <div
      className={`landing-page-panel${elevated ? ' landing-page-panel--elevated' : ''} ${className}`.trim()}
      {...props}
    />
  );
}

/**
 * Finance-owned public-page composition derived from the current productive Landingpage.
 * Visual values remain sourced from docs/frontend/design-tokens.json.
 */
export function LandingPageTemplate({
  eyebrow,
  statusLabel,
  title,
  description,
  actions,
  children,
}: LandingPageTemplateProps) {
  return (
    <main className="landing-page-frame min-h-screen text-foreground">
      <div className="relative mx-auto w-full max-w-[1440px] px-4 pb-8 pt-4 sm:px-6 lg:px-12 lg:pb-12 lg:pt-6">
        <header className="landing-page-header">
          <div className="flex min-w-0 items-center gap-4">
            <BrandLogo variant="inline" size="md" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-brand-primary">
                {eyebrow}
              </span>
              {statusLabel ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  {statusLabel}
                </span>
              ) : null}
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <div className="mt-3 max-w-4xl text-sm leading-6 text-slate-400 sm:text-base">
              {description}
            </div>
          </div>

          {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
        </header>

        <div className="space-y-6">{children}</div>
      </div>
    </main>
  );
}

export default LandingPageTemplate;
