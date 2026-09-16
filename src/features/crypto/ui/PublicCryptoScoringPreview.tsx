import React, { Suspense, lazy, startTransition, useEffect, useState } from 'react';
import type { CryptoScoringEnterpriseProps } from './CryptoScoringEnterprise';
import { EnterpriseScorerPresentationProvider } from './EnterpriseScorerPresentationContext';

const CanonicalCryptoScoringEnterprise = lazy(() =>
  import('./CryptoScoringEnterprise').then((module) => ({
    default: module.CryptoScoringEnterprise,
  })),
);

function PublicScorerShell({ symbol }: { symbol: string }) {
  return (
    <section
      className="min-h-[420px] rounded-2xl border border-border bg-surface/30 p-5 text-text-primary sm:p-6"
      aria-busy="true"
      aria-live="polite"
      data-testid="public-scorer-first-paint-shell"
    >
      <div className="flex h-full min-h-[360px] flex-col justify-between gap-6">
        <div className="space-y-3">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">
            Enterprise Scorer · {symbol.toUpperCase()}
          </p>
          <h3 className="max-w-xl font-display text-xl font-black sm:text-2xl">
            Kanonische Bewertung wird vorbereitet
          </h3>
          <p className="max-w-2xl text-sm leading-relaxed text-text-secondary">
            Die Landingpage bleibt vollständig bedienbar, während der Scorer getrennt vom ersten
            Browser-Paint geladen wird.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
          <div className="h-20 rounded-xl border border-border bg-background/35" />
          <div className="h-20 rounded-xl border border-border bg-background/35" />
          <div className="h-20 rounded-xl border border-border bg-background/35" />
        </div>
      </div>
    </section>
  );
}

/**
 * Public projection of the canonical Enterprise Scorer.
 *
 * The landing shell paints before the Motion/Recharts-heavy canonical scorer bundle is requested.
 * This is progressive loading only: there is no timer, sleep, click gate or alternative scoring
 * implementation. The same canonical scorer and all score/evidence contracts remain authoritative.
 */
export function PublicCryptoScoringPreview(props: CryptoScoringEnterpriseProps) {
  const [scorerReady, setScorerReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      startTransition(() => setScorerReady(true));
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const shell = <PublicScorerShell symbol={props.selectedSymbol} />;

  return (
    <EnterpriseScorerPresentationProvider mode="public-preview">
      {scorerReady ? (
        <Suspense fallback={shell}>
          <CanonicalCryptoScoringEnterprise {...props} />
        </Suspense>
      ) : (
        shell
      )}
    </EnterpriseScorerPresentationProvider>
  );
}
