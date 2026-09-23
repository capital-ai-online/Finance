import React from 'react';
import { Eye, ShieldCheck } from 'lucide-react';
import type { SubscriptionTier } from '../../../config/subscriptionEntitlements';
import {
  PRICING_MODEL_ARCHIVE_REFERENCE,
  PRICING_MODEL_STATE,
} from '../billingContract';

interface AbonnementsProps {
  currentTier: SubscriptionTier;
  onUpdateTier: (tier: SubscriptionTier) => void;
  email?: string;
  userId?: string;
}

/**
 * Temporary open-visibility projection.
 *
 * The previous paid pricing matrix is archived and no longer rendered as an active offer.
 * Account tier may still exist as server-side historical/account state, but it does not hide
 * components in this presentation. Protected execution remains governed by server controls.
 */
export function Abonnements({ currentTier }: AbonnementsProps) {
  return (
    <main className="space-y-6" aria-labelledby="billing-heading" data-pricing-model-state={PRICING_MODEL_STATE}>
      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand-primary">
              Open Access · Pricing pausiert
            </p>
            <h1 id="billing-heading" className="mt-1 text-2xl font-black text-white">
              Alle Komponenten sichtbar
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Das bisherige Pricing-Modell ist vorerst deaktiviert und archiviert. Die Oberfläche
              blendet Funktionen nicht mehr anhand eines Abonnements aus. Ein späteres Pricing-Modell
              wird als eigener, neu versionierter Vertrag eingeführt.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm">
            <div className="flex items-center gap-2 font-black text-emerald-200">
              <Eye size={17} aria-hidden="true" />
              <span>PUBLIC ALL COMPONENTS</span>
            </div>
            <p className="mt-1 text-xs text-emerald-100/70">Sichtbarkeit unabhängig vom Tarif.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-white/45">Serverseitiger Konto-Tarif</p>
            <div className="mt-1 flex items-center gap-2 font-black text-white">
              <ShieldCheck size={16} className="text-brand-primary" aria-hidden="true" />
              <span>{currentTier}</span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/45">
              Nur Kontometadatum; nicht mehr Sichtbarkeits- oder Pricing-Authority.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-white/45">Archivierte Pricing-Baseline</p>
            <p className="mt-1 font-mono text-[11px] font-bold text-white/75">
              {PRICING_MODEL_ARCHIVE_REFERENCE}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-white/45">
              Historische Preise bleiben nur für Provenienz und spätere Neukonzeption erhalten.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-primary/20 bg-brand-primary/[0.05] p-5">
        <h2 className="text-sm font-black text-white">Aktueller Produktmodus</h2>
        <p className="mt-2 text-xs leading-relaxed text-white/60">
          Keine Tarifkarte, kein Upgrade-CTA und kein Checkout werden aus diesem Screen gestartet.
          Sicherheitsrelevante Ausführungen behalten ihre jeweiligen Auth-, Quota- und Provider-Gates;
          diese Grenzen sind nicht Teil des Pricing-Modells.
        </p>
      </section>
    </main>
  );
}
