import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ExternalLink, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import type { SubscriptionTier } from '../../../app/types/UserSession';
import { authFetch } from '../../../lib/authFetch';
import { readAuthenticatedSubscriptionTier } from '../../../lib/subscriptionReadback';
import {
  SUBSCRIPTION_PRICES_EUR,
  formatEuro,
  type PaidSubscriptionPlan,
  type SubscriptionBillingPeriod,
} from '../billingContract';
import { SUBSCRIPTION_ENTITLEMENTS } from '../../../config/subscriptionEntitlements';
import { Checkout } from './Checkout';

interface AbonnementsProps {
  currentTier: SubscriptionTier;
  onUpdateTier: (tier: SubscriptionTier) => void;
  email?: string;
  userId?: string;
}

type SyncState = 'idle' | 'loading' | 'synchronized' | 'failed';

const PAID_PLANS: PaidSubscriptionPlan[] = ['Starter', 'Pro', 'Enterprise'];

const FEATURE_ROWS = [
  ['Verified Screening', (tier: SubscriptionTier) => SUBSCRIPTION_ENTITLEMENTS[tier].verifiedScreening],
  ['Backtesting', (tier: SubscriptionTier) => SUBSCRIPTION_ENTITLEMENTS[tier].backtest],
  ['Monte Carlo', (tier: SubscriptionTier) => SUBSCRIPTION_ENTITLEMENTS[tier].monteCarlo],
  ['Vollständige KI-Analyse', (tier: SubscriptionTier) => SUBSCRIPTION_ENTITLEMENTS[tier].fullAiAnalysis],
  ['Realtime AI-Newsfeed', (tier: SubscriptionTier) => SUBSCRIPTION_ENTITLEMENTS[tier].realtimeAiNewsfeed],
  ['Buffett Value Check', (tier: SubscriptionTier) => SUBSCRIPTION_ENTITLEMENTS[tier].buffettValueCheck],
  ['PDF-/Compliance-Export', (tier: SubscriptionTier) => SUBSCRIPTION_ENTITLEMENTS[tier].pdfComplianceExport],
] as const;

function formatEntitlement(value: unknown): string {
  if (value === true) return 'Enthalten';
  if (value === false || value === 'none') return 'Nicht enthalten';
  if (value === 'unlimited') return 'Unbegrenzt';
  if (value === 'preview_only') return 'Vorschau';
  if (value && typeof value === 'object' && 'limit' in value && 'windowDays' in value) {
    const limit = Number((value as any).limit);
    const windowDays = Number((value as any).windowDays);
    return `${limit} / ${windowDays === 1 ? 'Tag' : `${windowDays} Tage`}`;
  }
  return 'Nicht verfügbar';
}

/**
 * Canonical billing presentation for the User-Lifecycle slice.
 * Prices are projected from billingContract.ts; capability descriptions are projected from the
 * canonical entitlement contract. Neither source is treated as browser authorization: paid state
 * is synchronized only from authenticated server readback.
 */
export function Abonnements({ currentTier, onUpdateTier, email = '', userId }: AbonnementsProps) {
  const [billingPeriod, setBillingPeriod] = useState<SubscriptionBillingPeriod>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PaidSubscriptionPlan | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const checkoutReturn = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('checkout') === 'pending' || params.get('payment') === 'success';
  }, []);

  const synchronizeTier = useCallback(async () => {
    if (!userId) {
      setSyncState('failed');
      setSyncError('Für die Abonnement-Synchronisierung ist eine authentifizierte Sitzung erforderlich.');
      return;
    }

    setSyncState('loading');
    setSyncError(null);
    try {
      const tier = await readAuthenticatedSubscriptionTier();
      if (!tier) {
        throw new Error('Der Server hat noch keinen verifizierbaren Abonnementstatus geliefert.');
      }
      if (tier !== currentTier) onUpdateTier(tier);
      setSyncState('synchronized');

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('checkout');
        url.searchParams.delete('payment');
        url.searchParams.delete('plan');
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      }
    } catch (err: any) {
      setSyncState('failed');
      setSyncError(err?.message || 'Der Abonnementstatus konnte nicht synchronisiert werden.');
    }
  }, [currentTier, onUpdateTier, userId]);

  useEffect(() => {
    if (userId) void synchronizeTier();
  }, [userId, synchronizeTier]);

  useEffect(() => {
    if (!checkoutReturn || !userId) return;
    const retry = window.setTimeout(() => void synchronizeTier(), 1_500);
    return () => window.clearTimeout(retry);
  }, [checkoutReturn, synchronizeTier, userId]);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const response = await authFetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await response.json();
      if (!response.ok || typeof data?.url !== 'string') {
        throw new Error(data?.error || 'Das Stripe-Kundenportal ist derzeit nicht verfügbar.');
      }
      window.location.assign(data.url);
    } catch (err: any) {
      setPortalError(err?.message || 'Das Stripe-Kundenportal ist derzeit nicht verfügbar.');
      setPortalLoading(false);
    }
  };

  return (
    <main className="space-y-6" aria-labelledby="billing-heading">
      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand-primary">User Lifecycle · Billing Projection</p>
            <h1 id="billing-heading" className="mt-1 text-2xl font-black text-white">Tarife &amp; Abonnementstatus</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
              Preis- und Leistungsinformationen werden aus den kanonischen Verträgen dargestellt. Geschützte Funktionen werden ausschließlich serverseitig autorisiert; dieser Browser kann keinen Tarif freischalten.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <p className="text-white/45">Serverseitig projizierter Tarif</p>
            <div className="mt-1 flex items-center gap-2 font-black text-white">
              <ShieldCheck size={17} className="text-brand-primary" aria-hidden="true" />
              <span>{currentTier}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1" aria-label="Abrechnungsintervall">
            {(['monthly', 'yearly'] as SubscriptionBillingPeriod[]).map((period) => (
              <button
                key={period}
                type="button"
                aria-pressed={billingPeriod === period}
                onClick={() => setBillingPeriod(period)}
                className={`min-h-11 rounded-lg px-4 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary ${billingPeriod === period ? 'bg-brand-primary text-black' : 'text-white/65 hover:bg-white/5'}`}
              >
                {period === 'monthly' ? 'Monatlich' : 'Jährlich'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void synchronizeTier()}
            disabled={syncState === 'loading' || !userId}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-45"
          >
            {syncState === 'loading' ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Status synchronisieren
          </button>

          {currentTier !== 'Free' ? (
            <button
              type="button"
              onClick={() => void openBillingPortal()}
              disabled={portalLoading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-wait disabled:opacity-55"
            >
              {portalLoading ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} />}
              Abrechnung / Kündigung verwalten
            </button>
          ) : null}
        </div>

        {checkoutReturn && syncState !== 'synchronized' ? (
          <div role="status" className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 p-3 text-xs leading-relaxed text-amber-100">
            Checkout abgeschlossen oder zurückgekehrt. Die Aktivierung bleibt <strong>ausstehend</strong>, bis der serverseitige Abonnementstatus die Änderung bestätigt.
          </div>
        ) : null}
        {syncState === 'synchronized' ? (
          <div role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs text-emerald-100">
            <Check size={15} className="mt-0.5 shrink-0" />
            <span>Abonnementstatus wurde mit der autoritativen Serverprojektion synchronisiert.</span>
          </div>
        ) : null}
        {syncError ? (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-xs text-rose-100">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{syncError} Bis zur Bestätigung bleibt der zuletzt verifizierte Tarif maßgeblich.</span>
          </div>
        ) : null}
        {portalError ? <p role="alert" className="mt-3 text-xs text-rose-300">{portalError}</p> : null}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-label="Bezahlte Tarife">
        {PAID_PLANS.map((plan) => {
          const price = SUBSCRIPTION_PRICES_EUR[plan][billingPeriod];
          const isCurrent = currentTier === plan;
          const selfServiceSupported = !(plan === 'Enterprise' && billingPeriod === 'yearly');
          return (
            <article key={plan} className={`rounded-2xl border p-5 ${isCurrent ? 'border-brand-primary/55 bg-brand-primary/[0.07]' : 'border-white/10 bg-black/35'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/45">{billingPeriod === 'monthly' ? 'Monatlich' : 'Jährlich'}</p>
                  <h2 className="mt-1 text-xl font-black text-white">{plan}</h2>
                </div>
                {isCurrent ? <span className="rounded-full border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 text-[10px] font-bold text-brand-primary">Aktiv</span> : null}
              </div>
              <p className="mt-4 font-mono text-2xl font-black text-brand-primary">{formatEuro(price)}</p>
              <p className="mt-1 text-[11px] text-white/40">{billingPeriod === 'monthly' ? 'pro Monat' : 'pro Jahr'}</p>
              {plan === 'Enterprise' && billingPeriod === 'yearly' ? (
                <p className="mt-2 text-[11px] leading-relaxed text-amber-200/80">Jährliche Enterprise-Abrechnung ist laut Entitlement-Vertrag kein Self-Service-Checkout und bleibt an den autoritativen Billing-Prozess gebunden.</p>
              ) : null}
              <ul className="mt-5 space-y-2 border-t border-white/10 pt-4 text-xs text-white/65">
                {FEATURE_ROWS.map(([label, read]) => (
                  <li key={label} className="flex items-start justify-between gap-3">
                    <span>{label}</span>
                    <strong className="text-right text-white">{formatEntitlement(read(plan))}</strong>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={isCurrent || !userId || !selfServiceSupported}
                onClick={() => setSelectedPlan(plan)}
                className="mt-5 min-h-11 w-full rounded-xl bg-brand-primary px-4 text-xs font-black uppercase tracking-wider text-black transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              >
                {isCurrent ? 'Aktueller Tarif' : !selfServiceSupported ? 'Jahresabo auf Anfrage' : 'Checkout starten'}
              </button>
            </article>
          );
        })}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-4 sm:p-5">
        <table className="min-w-[760px] w-full border-collapse text-left text-xs">
          <caption className="mb-4 text-left text-sm font-black text-white">Kanonische Entitlement-Projektion</caption>
          <thead>
            <tr className="border-b border-white/10 text-white/45">
              <th className="p-3">Funktion</th>
              {(['Free', 'Starter', 'Pro', 'Enterprise'] as SubscriptionTier[]).map((tier) => <th key={tier} className="p-3 text-center">{tier}</th>)}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map(([label, read]) => (
              <tr key={label} className="border-b border-white/5 last:border-0">
                <th className="p-3 font-medium text-white/75">{label}</th>
                {(['Free', 'Starter', 'Pro', 'Enterprise'] as SubscriptionTier[]).map((tier) => <td key={tier} className="p-3 text-center text-white/65">{formatEntitlement(read(tier))}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedPlan ? (
        <Checkout
          planId={selectedPlan}
          price={SUBSCRIPTION_PRICES_EUR[selectedPlan][billingPeriod]}
          billingPeriod={billingPeriod}
          email={email}
          userId={userId}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => undefined}
        />
      ) : null}
    </main>
  );
}
