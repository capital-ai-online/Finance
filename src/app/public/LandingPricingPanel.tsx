import React, { useEffect, useState } from 'react';
import type { UserSession } from '../types/UserSession';
import { Abonnements } from '../../features/billing/ui/Abonnements';

type PublicPlanTier = 'Free' | 'Starter' | 'Pro' | 'Enterprise';

interface PublicPlanEntitlements {
  monthlyPriceEur: number;
  annualBilling: 'not_applicable' | 'ten_percent_discount' | 'on_request';
  devices: number;
}

interface PlansResponse {
  contractVersion: string;
  plans: Record<PublicPlanTier, PublicPlanEntitlements>;
}

function annualBillingLabel(value: PublicPlanEntitlements['annualBilling']): string {
  if (value === 'ten_percent_discount') return 'Jahresabrechnung verfügbar';
  if (value === 'on_request') return 'Jahresabrechnung auf Anfrage';
  return 'Kostenlos';
}

function formatMonthly(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function LandingPricingPanel({ userSession }: { userSession: UserSession | null }) {
  const [plans, setPlans] = useState<PlansResponse['plans'] | null>(null);
  const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [projectedTier, setProjectedTier] = useState(userSession?.subscriptionTier ?? 'Free');

  useEffect(() => {
    setProjectedTier(userSession?.subscriptionTier ?? 'Free');
  }, [userSession?.subscriptionTier]);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/entitlements/plans', { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.ok) throw new Error('pricing-catalog-unavailable');
        const data = await response.json() as PlansResponse;
        if (!data?.plans) throw new Error('pricing-catalog-invalid');
        if (!cancelled) {
          setPlans(data.plans);
          setCatalogState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogState('failed');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (userSession?.type === 'registered') {
    return (
      <Abonnements
        currentTier={projectedTier}
        onUpdateTier={setProjectedTier}
        email={userSession.email}
        userId={userSession.id}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="ui-panel border-brand-primary/20 bg-surface/30 p-5 sm:p-6">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary">
          Pricing · Backend projection
        </p>
        <h2 className="mt-2 text-2xl font-black text-text-primary">Tarife direkt auf der Landingpage</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-secondary">
          Preise und Leistungsgrenzen werden aus dem serverseitigen Entitlement-Katalog geladen.
          Checkout und aktive Abonnements bleiben server- bzw. Stripe-autoritativ.
        </p>
      </div>

      {catalogState === 'loading' ? (
        <div className="ui-panel border-border bg-surface/25 p-5 text-sm text-text-secondary" role="status">
          Tarifkatalog wird geladen…
        </div>
      ) : null}

      {catalogState === 'failed' ? (
        <div className="ui-panel border-status-warning/30 bg-status-warning/5 p-5 text-sm text-text-secondary" role="alert">
          Der serverseitige Tarifkatalog ist derzeit nicht verfügbar. Es werden keine Ersatzpreise angezeigt.
        </div>
      ) : null}

      {plans ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="CAPITAL-AI Tarife">
          {(Object.keys(plans) as PublicPlanTier[]).map((tier) => {
            const plan = plans[tier];
            return (
              <article key={tier} className="ui-panel flex min-h-full flex-col border-border bg-surface/30 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary">
                  {annualBillingLabel(plan.annualBilling)}
                </p>
                <h3 className="mt-2 text-xl font-black text-text-primary">{tier}</h3>
                <p className="mt-3 font-mono text-2xl font-black text-brand-primary">
                  {formatMonthly(plan.monthlyPriceEur)}
                </p>
                <p className="mt-1 text-[11px] text-text-secondary">pro Monat · {plan.devices} Gerät(e)</p>
                <div className="mt-auto pt-5">
                  {tier === 'Free' ? (
                    <a
                      href="#analysis-workbench"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border bg-surface/60 px-4 text-xs font-black text-text-primary"
                    >
                      BTC Scorer testen
                    </a>
                  ) : (
                    <a
                      href="/login"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-primary px-4 text-xs font-black text-background transition hover:brightness-110"
                    >
                      Anmelden &amp; Abo wählen
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
