import React from 'react';
import { Archive, Eye, ShieldCheck } from 'lucide-react';
import { PRODUCT_ACCESS_POLICY } from '../../../config/productAccessPolicy';

/**
 * Historical pricing entrypoint retained as a user-visible lifecycle notice.
 *
 * The previous plan catalogue and checkout projection were archived on 2026-09-23.
 * A future pricing model must be introduced through a new owner-correlated contract.
 * This component intentionally exposes no price, plan comparison, upgrade or checkout action.
 */
export function Abonnements() {
  return (
    <main className="space-y-6" aria-labelledby="pricing-archive-heading">
      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand-primary">
              Pricing Lifecycle
            </p>
            <h1 id="pricing-archive-heading" className="mt-1 text-2xl font-black text-white">
              Pricing-Modell archiviert
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
              Das bisherige Pricing- und Abonnementmodell ist deaktiviert und als historischer Stand
              archiviert. Ein neues Pricing-Modell wird später über einen neuen, separat korrelierten
              Produkt- und Billing-Contract eingeführt.
            </p>
          </div>
          <span className="inline-flex min-h-11 items-center gap-2 self-start rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2 font-mono text-[10px] font-black uppercase tracking-wider text-amber-200">
            <Archive size={15} aria-hidden="true" />
            Archiviert · {PRODUCT_ACCESS_POLICY.pricingArchivedAt}
          </span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-label="Aktueller Zugangsstatus">
        <article className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
          <div className="flex items-start gap-3">
            <Eye className="mt-0.5 shrink-0 text-emerald-300" size={19} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-black text-white">Komponenten ohne Abo-Sichtbarkeitsgate</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                UI-Komponenten werden unabhängig von Free, Starter, Pro oder Enterprise sichtbar
                dargestellt. Das archivierte Tarifmodell entscheidet nicht mehr darüber, welche
                Produktbereiche in der Oberfläche gezeigt werden.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-cyan-300" size={19} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-black text-white">Sicherheitsgrenzen bleiben getrennt</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Serverseitige Authentifizierung, Provider-Verfügbarkeit, Quotas, Credits und andere
                Schutzgrenzen bleiben unverändert maßgeblich. Sichtbarkeit in der UI ist keine
                Autorisierung für geschützte oder kostenverursachende Aktionen.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-xs leading-relaxed text-white/50">
        Neue Käufe oder Upgrades werden über diese Oberfläche nicht angeboten. Bestehende
        Abonnements können weiterhin über die dafür vorgesehene Kontoverwaltung gekündigt oder
        verwaltet werden, bis der Billing-Owner einen separaten Lifecycle-Wechsel umsetzt.
      </section>
    </main>
  );
}
