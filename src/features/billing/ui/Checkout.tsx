import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, CreditCard, Loader2, ShieldCheck, X } from 'lucide-react';
import { authFetch } from '../../../lib/authFetch';

export type CheckoutPlan = 'Starter' | 'Pro' | 'Enterprise';

export interface CheckoutProps {
  planId: CheckoutPlan;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  /** Compatibility-only presentation input. Identity is bearer-derived server-side. */
  email: string;
  /** Compatibility-only presentation input. Never sent as entitlement identity. */
  userId?: string;
  onClose: () => void;
  /** Retained for legacy call-site compatibility; checkout never grants a tier locally. */
  onSuccess: (tier: CheckoutPlan) => void;
}

interface AppliedCoupon {
  id: string;
  description: string;
}

function formatCheckoutPrice(price: number, billingPeriod: 'monthly' | 'yearly'): string {
  return `${new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)} ${billingPeriod === 'yearly' ? '/ Jahr' : '/ Monat'}`;
}

/**
 * Authenticated Stripe Checkout projection.
 *
 * The browser may select a plan and request checkout, but it never supplies subscription identity
 * and never marks a paid tier active. Identity is resolved from authFetch's bearer token and the
 * post-checkout tier is accepted only after authoritative subscription readback on return.
 */
export function Checkout({ planId, price, billingPeriod, onClose }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const response = await authFetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data?.couponId) {
        throw new Error(data?.error || 'Gutscheincode konnte nicht verifiziert werden.');
      }
      setAppliedCoupon({ id: String(data.couponId), description: String(data.description || 'Gutschein verifiziert') });
    } catch (err: any) {
      setAppliedCoupon(null);
      setCouponError(err?.message || 'Gutscheincode konnte nicht verifiziert werden.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const startCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingPeriod,
          couponId: appliedCoupon?.id,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Stripe Checkout konnte nicht gestartet werden.');
      }
      if (typeof data?.checkoutUrl !== 'string' || !data.checkoutUrl) {
        throw new Error('Der Server hat keine gültige Stripe-Checkout-URL geliefert.');
      }

      window.location.assign(data.checkoutUrl);
    } catch (err: any) {
      setError(err?.message || 'Stripe Checkout ist derzeit nicht verfügbar.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        aria-describedby="checkout-authority-note"
        className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-neutral-950 p-5 text-white shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-primary/25 bg-brand-primary/10 text-brand-primary">
              <CreditCard size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">Stripe Checkout</p>
              <h2 id="checkout-title" className="text-lg font-black">{planId} auswählen</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Checkout schließen"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-white/55">Katalogpreis</span>
              <strong className="font-mono text-brand-primary">{formatCheckoutPrice(price, billingPeriod)}</strong>
            </div>
            <p id="checkout-authority-note" className="mt-3 text-xs leading-relaxed text-white/50">
              Der tatsächlich belastete Betrag und ein angewendeter Rabatt werden ausschließlich im autoritativen Stripe Checkout bestätigt. Eine erfolgreiche Weiterleitung aktiviert im Browser keinen Tarif.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <label htmlFor="checkout-coupon" className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-white/55">
              Gutscheincode
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="checkout-coupon"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value);
                  setAppliedCoupon(null);
                  setCouponError(null);
                }}
                disabled={validatingCoupon || loading}
                className="min-h-11 flex-1 rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:opacity-50"
                placeholder="Optional"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => void validateCoupon()}
                disabled={validatingCoupon || loading || !couponCode.trim()}
                className="min-h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                {validatingCoupon ? 'Prüft…' : 'Prüfen'}
              </button>
            </div>
            {appliedCoupon ? (
              <p className="mt-2 text-xs text-emerald-300" role="status">{appliedCoupon.description}</p>
            ) : null}
            {couponError ? <p className="mt-2 text-xs text-rose-300" role="alert">{couponError}</p> : null}
          </div>

          {error ? (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs text-rose-200">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={loading}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
            <span>{loading ? 'Checkout wird vorbereitet…' : 'Zu Stripe Checkout'}</span>
            {!loading ? <ArrowRight size={16} aria-hidden="true" /> : null}
          </button>
        </div>
      </section>
    </div>
  );
}
