import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  ArrowRight, 
  X, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface CheckoutProps {
  planId: 'Starter' | 'Pro' | 'Enterprise';
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  email: string;
  userId?: string;
  onClose: () => void;
  onSuccess: (tier: 'Starter' | 'Pro' | 'Enterprise') => void;
}

export function Checkout({ planId, price, billingPeriod, email, userId, onClose, onSuccess }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [serverPublishableKey, setServerPublishableKey] = useState<string | null>(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; percent_off: number | null; description: string } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    // Fetch Stripe publishable key dynamically at run-time
    fetch('/api/stripe/config')
      .then(res => res.json())
      .then(data => {
        let pk = data.publishableKey;
        if (pk) {
          pk = pk.trim();
          if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.slice(1, -1);
          if (pk.startsWith("'") && pk.endsWith("'")) pk = pk.slice(1, -1);
          pk = pk.trim();
        }
        if (pk && pk !== '' && pk !== 'pk_test_...' && !pk.startsWith('pk_test_...')) {
          setServerPublishableKey(pk);
        }
      })
      .catch(err => console.error("Error loading stripe config at run-time:", err));
  }, []);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const response = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Ungültiger Gutscheincode.');
      }
      setAppliedCoupon({
        id: data.couponId,
        percent_off: data.percent_off,
        description: data.description
      });
      setCouponSuccess(`✓ ${data.description}`);
    } catch (err: any) {
      setCouponError(err.message || 'Gutscheincode konnte nicht verifiziert werden.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    // Retrieve publishable key from dynamic state first, then build-time env as fallback
    let publishableKey = serverPublishableKey || (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (publishableKey) {
      publishableKey = publishableKey.trim();
      if (publishableKey.startsWith('"') && publishableKey.endsWith('"')) {
        publishableKey = publishableKey.slice(1, -1);
      }
      if (publishableKey.startsWith("'") && publishableKey.endsWith("'")) {
        publishableKey = publishableKey.slice(1, -1);
      }
      publishableKey = publishableKey.trim();
    }

    console.log("[Stripe Diagnostics] Resolved publishable key:", publishableKey ? `${publishableKey.substring(0, 10)}...` : 'undefined');

    // Gracefully handle missing Stripe keys with a high-fidelity guidance UI
    if (!publishableKey || publishableKey === '' || publishableKey === 'pk_test_...' || publishableKey.startsWith('pk_test_...')) {
      console.warn("[Stripe Diagnostics] Publishable key is missing or is a placeholder. Switching to sandbox/demo mode.");
      setDemoMode(true);
      setLoading(false);
      return;
    }

    try {
      // 1. Erstelle Checkout-Session auf dem Server
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          email,
          userId,
          billingPeriod,
          couponId: appliedCoupon ? appliedCoupon.id : undefined,
          successUrl: window.location.origin + '?payment=success',
          cancelUrl: window.location.origin + '?payment=cancelled',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen der Checkout-Session');
      }

      // 2. Stripe-Instanz laden
      const stripe = (await loadStripe(publishableKey)) as any;
      if (!stripe) {
        throw new Error('Stripe.js konnte nicht geladen werden.');
      }

      // 3. Weiterleitung zu Stripe Checkout
      if (data.checkoutUrl) {
        // Direkte Weiterleitung an die gehostete URL
        window.location.href = data.checkoutUrl;
      } else if (data.sessionId) {
        // Fallback über sessionId
        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });
        if (stripeError) {
          throw new Error(stripeError.message);
        }
      } else {
        throw new Error('Ungültige Antwort von Checkout-API');
      }
    } catch (err: any) {
      console.error('Stripe-Weiterleitungsfehler:', err);
      setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten.');
      setLoading(false);
    }
  };

  const handleSimulateSuccess = () => {
    setLoading(true);
    setTimeout(() => {
      onSuccess(planId);
      setLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Background overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
      />

      {/* Checkout Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-zinc-950 border border-white/15 p-6 rounded-2xl max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(245,196,83,0.15)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-aif-gold-DEFAULT via-amber-500 to-aif-neon-cyan" />
        
        {/* Header with Close */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 rounded-lg text-aif-gold-DEFAULT">
              <CreditCard size={18} />
            </div>
            <span className="text-xs uppercase font-mono tracking-widest text-white/50 font-bold">Stripe Secure Pay</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="text-center space-y-2 mb-6">
          <h3 className="text-xl font-black text-white font-display">Abonnement freischalten</h3>
          <p className="text-xs text-white/50 max-w-xs mx-auto">
            Sichere Zahlungsabwicklung für den <span className="text-aif-gold-DEFAULT font-bold">{planId} Plan</span>. Sofortige Aktivierung nach Abschluss.
          </p>
        </div>

        {/* Pricing details */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3 font-mono">
          <div className="flex justify-between text-xs text-white/60">
            <span>Tarifstufe:</span>
            <span className="text-white font-bold">{planId}</span>
          </div>
          <div className="flex justify-between text-xs text-white/60">
            <span>Intervall:</span>
            <span className="text-white uppercase">{billingPeriod === 'yearly' ? 'Jährlich' : 'Monatlich'}</span>
          </div>
          <div className="flex justify-between text-xs text-white/60 border-b border-white/5 pb-2">
            <span>Zahlungsmethoden:</span>
            <span className="text-white">Kreditkarte, SEPA, Sofort</span>
          </div>
          {appliedCoupon && appliedCoupon.percent_off !== null && (
            <div className="flex justify-between text-xs text-emerald-400 font-bold">
              <span>Gutschein-Rabatt ({appliedCoupon.percent_off}%):</span>
              <span>-{(price * (appliedCoupon.percent_off / 100)).toFixed(2)} €</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-white pt-1">
            <span className="font-sans font-bold">Gesamtbetrag:</span>
            <span className="text-aif-gold-DEFAULT font-black text-base">
              {appliedCoupon && appliedCoupon.percent_off === 100 ? 'Gratis' : `${(price * (appliedCoupon && appliedCoupon.percent_off !== null ? (100 - appliedCoupon.percent_off) / 100 : 1)).toFixed(2)} €`}
              {!(appliedCoupon && appliedCoupon.percent_off === 100) && <span className="text-[10px] text-white/40 font-mono ml-0.5">{billingPeriod === 'yearly' ? '/ Jahr' : '/ Monat'}</span>}
            </span>
          </div>
        </div>

        {/* Coupon redemption input */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-5 space-y-2">
          <label className="text-[10px] uppercase font-mono tracking-wider text-white/40 block font-bold">Gutscheincode einlösen</label>
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Code (z.B. SAVE20, FREE100)"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCouponError(null);
                setCouponSuccess(null);
              }}
              disabled={validatingCoupon || !!appliedCoupon}
              className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-aif-gold-DEFAULT/40 disabled:opacity-50"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponCode('');
                  setCouponSuccess(null);
                }}
                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all cursor-pointer font-mono"
              >
                Entfernen
              </button>
            ) : (
              <button
                type="button"
                onClick={handleValidateCoupon}
                disabled={validatingCoupon || !couponCode.trim()}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-white hover:text-aif-gold-DEFAULT text-xs font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 font-mono"
              >
                {validatingCoupon ? 'Prüft...' : 'Einlösen'}
              </button>
            )}
          </div>
          {couponError && (
            <p className="text-[10px] text-red-400 font-mono">{couponError}</p>
          )}
          {couponSuccess && (
            <p className="text-[10px] text-emerald-400 font-mono font-bold">{couponSuccess}</p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-lg text-xs text-red-400 font-mono flex gap-2 items-start">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Zahlungsfehler:</span> {error}
            </div>
          </div>
        )}

        {/* Guidance when API Keys are not yet filled */}
        {demoMode ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-400 font-mono space-y-2">
              <div className="flex gap-2 items-start font-bold text-white">
                <Info size={16} className="shrink-0 text-amber-400" />
                <span>Stripe-Integration unvollständig</span>
              </div>
              <p className="text-white/70 leading-relaxed text-[11px]">
                Um echte Stripe Checkout-Sitzungen zu starten, müssen Sie die folgenden Variablen in der Datei <code className="text-white font-bold">.env</code> konfigurieren:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-white/60 text-[10px]">
                <li><code className="text-white">VITE_STRIPE_PUBLISHABLE_KEY</code></li>
                <li><code className="text-white">STRIPE_SECRET_KEY</code></li>
                <li><code className="text-white">STRIPE_PRICE_ID_{planId.toUpperCase()}</code></li>
              </ul>
              <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between">
                <span className="text-[10px] text-amber-500 font-bold uppercase">Sandbox-Modus aktiv</span>
                <span className="text-white/40 text-[9px]">Sie können die Zahlung simulieren</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleSimulateSuccess}
                disabled={loading}
                className="flex-1 py-3 bg-aif-gold-DEFAULT hover:bg-aif-gold-light disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,196,83,0.3)]"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>Demo-Upgrade simulieren</span>
              </button>
              <button 
                onClick={() => setDemoMode(false)}
                className="px-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all cursor-pointer"
                title="Erneut versuchen"
              >
                Zurück
              </button>
            </div>
          </div>
        ) : (
          /* Real Stripe checkout initiator button */
          <div className="space-y-3">
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,196,83,0.3)]"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Sitzung wird erstellt...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={14} />
                  <span>Sichere Stripe-Zahlung starten</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
            
            <p className="text-[10px] text-white/30 text-center font-mono flex items-center justify-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" /> End-to-End SSL verschlüsselt via Stripe Gateway
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
