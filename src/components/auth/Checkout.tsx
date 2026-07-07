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
  onClose: () => void;
  onSuccess: (tier: 'Starter' | 'Pro' | 'Enterprise') => void;
}

export function Checkout({ planId, price, billingPeriod, email, onClose, onSuccess }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverPublishableKey, setServerPublishableKey] = useState<string | null>(null);

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

    if (!publishableKey || publishableKey === '' || publishableKey === 'pk_test_...' || publishableKey.startsWith('pk_test_...')) {
      setError("Stripe ist derzeit nicht vollständig konfiguriert (Stripe API-Schlüssel fehlen im Backend).");
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
          billingPeriod,
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

  const isStripeConfigured = !!(serverPublishableKey || (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY);

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
          <div className="flex justify-between text-sm text-white pt-1">
            <span className="font-sans font-bold">Gesamtbetrag:</span>
            <span className="text-aif-gold-DEFAULT font-black text-base">
              {price} €
              <span className="text-[10px] text-white/40 font-mono ml-0.5">/ Monat</span>
            </span>
          </div>
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

        {/* Real Stripe checkout initiator button */}
        <div className="space-y-3">
          <button 
            onClick={handleCheckout}
            disabled={loading || !isStripeConfigured}
            className="w-full py-3 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,196,83,0.3)] disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Aktivierung läuft...</span>
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
      </motion.div>
    </div>
  );
}
