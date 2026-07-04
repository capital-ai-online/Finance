import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Cpu, 
  Award, 
  CreditCard, 
  Loader2, 
  Star, 
  Lock, 
  HelpCircle,
  Eye,
  Terminal,
  Code,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Checkout } from './Checkout';

interface AbonnementsProps {
  currentTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpdateTier: (tier: 'Free' | 'Starter' | 'Pro' | 'Enterprise') => void;
  email?: string;
  accessToken?: string;
}

export function Abonnements({ currentTier, onUpdateTier, email, accessToken }: AbonnementsProps) {
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showStripeGuide, setShowStripeGuide] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState({
    secretKeyConfigured: false,
    webhookSecretConfigured: false,
    publishableKeyConfigured: false
  });

  React.useEffect(() => {
    // 1. Fetch Stripe configuration status safely without leaking keys
    fetch('/api/stripe/config-status')
      .then(res => res.json())
      .then(data => setConfigStatus(data))
      .catch(err => console.error("Error loading stripe config status:", err));

    // 2. Query persisted database-tier for this user (requires a verified
    // session — no email fallback here, since defaulting to any email,
    // including the owner's, would leak whichever account's tier that is).
    if (email && accessToken) {
      fetch(`/api/stripe/user-subscription?email=${encodeURIComponent(email)}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.subscriptionTier && data.subscriptionTier !== currentTier) {
            onUpdateTier(data.subscriptionTier);
          }
        })
        .catch(err => console.error("Error syncing user subscription tier:", err));
    }
  }, [email, accessToken]);

  // Discount indicator
  const discountMultiplier = billingPeriod === 'yearly' ? 0.9 : 1.0;

  const PLANS = [
    {
      id: 'Free',
      name: 'Free Edition',
      price: 0,
      badge: 'Basis-Zugang',
      desc: 'Kostenloser Einstieg in die quantitative Analyse. Perfekt für Gelegenheits-Trader.',
      devices: '1 Gerät',
      features: [
        '3 Screenings alle 5 Tage',
        'Intelligent Score & Pattern Recognition',
        'Basis-Marktdaten',
        'KI-Analysen nur als Vorschau deklariert',
        'Upgrade-Hinweise im Terminal'
      ],
      lockedFeatures: [
        'Keine Backtests',
        'Keine Monte-Carlo-Simulationen',
        'Keine vollständigen KI-Erklärungen'
      ],
      color: 'border-white/10 hover:border-white/20 bg-white/5 text-white',
      buttonText: 'Free nutzen',
      icon: Eye
    },
    {
      id: 'Starter',
      name: 'Starter Plan',
      price: 7,
      badge: 'Capital-AI Basis',
      desc: 'Erweiterte Limits und Backtests für ambitionierte Retail-Investoren.',
      devices: '1 Gerät',
      features: [
        '5 Screenings pro Tag',
        'Unbegrenzte quantitative Backtests',
        '1 vollständige KI-Analyse pro Tag',
        'Intelligent Score & Pattern Recognition',
        'Standard PDF-Report-Export (Basis)'
      ],
      lockedFeatures: [
        'Keine Monte-Carlo-Simulationen',
        'Weitere KI-Analysen nur als Vorschau'
      ],
      color: 'border-blue-500/30 hover:border-blue-500/50 bg-blue-500/5 text-blue-400',
      buttonText: 'Starter abonnieren',
      icon: Zap
    },
    {
      id: 'Pro',
      name: 'Pro Edition',
      price: 29,
      badge: 'Bestseller',
      desc: 'Detaillierte Monte-Carlo-Simulationen und tiefe KI-Insights für aktive Händler.',
      devices: 'Bis zu 2 Geräte',
      features: [
        '20 Screenings pro Tag',
        'Unbegrenzte quantitative Backtests',
        '1 Monte-Carlo-Simulation pro Tag',
        'Vollständige KI-Analysen & Erklärungen',
        'Erweiterte Watchlists & Portfolio-Analysen',
        'Premium PDF-Reports',
        'Priorisierte Datenverarbeitung'
      ],
      lockedFeatures: [],
      color: 'border-aif-gold-DEFAULT/40 hover:border-aif-gold-DEFAULT/60 bg-aif-gold-DEFAULT/5 text-aif-gold-DEFAULT shadow-[0_0_20px_rgba(245,196,83,0.1)]',
      buttonText: 'Pro abonnieren',
      icon: Star
    },
    {
      id: 'Enterprise',
      name: 'Enterprise OS',
      price: 109,
      badge: 'Professional',
      desc: 'Unbegrenzte Kapazitäten und buffet-style KI-Strategien für Asset Manager.',
      devices: 'Bis zu 5 Geräte',
      features: [
        'Unbegrenzte Screenings & Backtests',
        'Unbegrenzte Monte-Carlo-Simulationen',
        'Exklusiver Zugriff auf Buffett-Style AI',
        'Alle KI-Agenten & priorisierte Verarbeitung',
        'API-Zugang & Rollenverwaltung (optional)',
        'Enterprise PDF-Export & Beta-Features',
        'Priorisierter 24/7 Support'
      ],
      lockedFeatures: [],
      color: 'border-aif-neon-cyan/40 hover:border-aif-neon-cyan/60 bg-aif-neon-cyan/5 text-aif-neon-cyan shadow-[0_0_20px_rgba(13,221,221,0.1)]',
      buttonText: 'Enterprise anfordern',
      icon: Cpu
    }
  ];

  const handleSubscribeClick = (planId: string) => {
    if (planId === currentTier) return;
    setShowCheckoutModal(planId);
  };

  const handleStripeCheckout = (planId: string) => {
    setSubscribing(planId);
    setShowCheckoutModal(null);

    // Simulated Stripe Payment Session Redirect
    setTimeout(() => {
      onUpdateTier(planId as any);
      setSubscribing(null);
      setSuccess(planId);
      setTimeout(() => setSuccess(null), 4000);
    }, 1800);
  };

  // Feature comparison list as requested in pricing.md
  const COMPARISON = [
    { label: 'Intelligent Score', free: '✅', starter: '✅', pro: '✅', enterprise: '✅' },
    { label: 'Pattern Recognition', free: '✅', starter: '✅', pro: '✅', enterprise: '✅' },
    { label: 'KI-Vorschau', free: '✅', starter: '✅', pro: '—', enterprise: '—' },
    { label: 'Vollständige KI', free: '❌', starter: '1 / Tag', pro: '✅', enterprise: '✅' },
    { label: 'Screenings', free: '3 / 5 Tage', starter: '5 / Tag', pro: '20 / Tag', enterprise: 'Unbegrenzt' },
    { label: 'Backtests', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
    { label: 'Monte-Carlo', free: '❌', starter: '❌', pro: '1 / Tag', enterprise: 'Unbegrenzt' },
    { label: 'PDF-Export', free: '❌', starter: 'Basis', pro: 'Premium', enterprise: 'Enterprise' },
    { label: 'Geräte', free: '1', starter: '1', pro: '2', enterprise: '5' },
    { label: 'Buffett-Style AI', free: '❌', starter: '❌', pro: '❌', enterprise: '✅' },
    { label: 'API-Zugang', free: '❌', starter: '❌', pro: 'Optional', proClass: 'text-white/40', enterprise: 'Optional' },
    { label: 'Prio-Verarbeitung', free: '❌', starter: '❌', pro: '✅', enterprise: '✅' },
    { label: 'Enterprise Features', free: '❌', starter: '❌', pro: 'Teilweise', enterprise: 'Vollständig' }
  ];

  return (
    <div className="space-y-8">
      {/* Upper Promo Banner */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/45 to-transparent" />

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 relative z-10">
          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/40 tracking-wider font-mono">
            CAPITAL-AI SUBSCRIPTION PLATFORM
          </span>
          <h2 className="text-3xl font-black text-white font-display mt-3">Tarifstufen &amp; Stripe-Brücke</h2>
          <p className="text-xs text-white/50 mt-1 max-w-lg mx-auto">
            Wählen Sie den optimalen Tarif für Ihr Handelsvolumen. Alle Tarife greifen auf dieselbe ausgereifte Enterprise-Architektur zu.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-xs font-mono ${billingPeriod === 'monthly' ? 'text-white font-bold' : 'text-white/40'}`}>Monatlich</span>
            <button 
              onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-white/10 border border-white/20 p-1 flex items-center transition-all cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-full bg-aif-gold-DEFAULT transition-all ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-mono flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'text-aif-gold-DEFAULT font-bold' : 'text-white/40'}`}>
              Jährlich 
              <span className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT text-[9px] px-1.5 py-0.5 rounded uppercase font-black">
                -10% Rabatt
              </span>
            </span>
          </div>
        </div>

        {/* Success notification popup */}
        <AnimatePresence>
          {success && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black p-5 rounded-xl shadow-[0_0_35px_rgba(16,185,129,0.5)] max-w-md text-center border border-emerald-400"
            >
              <ShieldCheck size={28} className="mx-auto mb-2" />
              <h4 className="text-sm font-black uppercase tracking-wider font-display">Abonnement via Stripe aktiviert!</h4>
              <p className="text-xs font-medium mt-1 leading-relaxed">
                Der Webhook wurde erfolgreich verbucht. Ihr Account wurde auf die Stufe <span className="font-bold underline">{success}</span> hochgestuft. Alle Berechtigungen wurden im CAPITAL-AI Berechtigungssystem aktualisiert.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plans layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            const isCurrent = currentTier === plan.id;
            const isButtonDisabled = subscribing !== null || isCurrent;
            const calculatedPrice = plan.price === 0 ? 0 : Math.round(plan.price * discountMultiplier);

            return (
              <div 
                key={plan.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between relative transition-all duration-300 group ${
                  isCurrent 
                    ? 'border-aif-gold-DEFAULT/60 bg-aif-gold-DEFAULT/5 text-aif-gold-DEFAULT' 
                    : plan.color
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-aif-gold-DEFAULT text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-aif-gold-DEFAULT/20 shadow-md">
                    Aktiver Tarif
                  </div>
                )}

                {/* Top Details */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="p-2 bg-white/5 border border-white/10 rounded-xl text-white">
                      <PlanIcon size={18} />
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-bold opacity-60 font-mono">
                      {plan.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black font-display text-white">{plan.name}</h3>
                  <p className="text-xs opacity-60 mt-1.5 min-h-[48px] leading-relaxed">{plan.desc}</p>

                  <div className="my-5 flex items-baseline gap-1">
                    <span className="text-3xl font-mono font-black text-white">{calculatedPrice}€</span>
                    <span className="text-xs opacity-40 font-mono">/ Monat</span>
                  </div>

                  <div className="text-[10px] text-white/40 font-mono mb-3 uppercase tracking-widest">
                    Gerätelimit: <span className="text-white font-bold">{plan.devices}</span>
                  </div>

                  {/* Features checklist */}
                  <div className="space-y-2.5 pt-3 border-t border-white/5">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <Check size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-white/80 leading-normal">{feat}</span>
                      </div>
                    ))}
                    {plan.lockedFeatures.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs opacity-40">
                        <Lock size={12} className="text-white/40 shrink-0 mt-0.5" />
                        <span className="text-white/60 leading-normal line-through">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Action button */}
                <div className="mt-6">
                  <button
                    onClick={() => handleSubscribeClick(plan.id)}
                    disabled={isButtonDisabled}
                    className={`w-full py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrent 
                        ? 'bg-white/10 border border-white/10 text-white/45 cursor-default'
                        : plan.id === 'Free'
                        ? 'bg-white text-black hover:bg-white/90 active:scale-[0.98]'
                        : plan.id === 'Starter'
                        ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98] shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : plan.id === 'Pro'
                        ? 'bg-aif-gold-DEFAULT hover:bg-aif-gold-light text-black active:scale-[0.98] shadow-[0_0_15px_rgba(245,196,83,0.3)]'
                        : 'bg-aif-neon-cyan hover:bg-aif-neon-cyan/90 text-black active:scale-[0.98] shadow-[0_0_15px_rgba(13,221,221,0.3)]'
                    }`}
                  >
                    {subscribing === plan.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : isCurrent ? (
                      <ShieldCheck size={13} />
                    ) : (
                      <CreditCard size={13} />
                    )}
                    {subscribing === plan.id ? 'Wird verbucht...' : isCurrent ? 'Bereits aktiv' : plan.buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Future Founder Edition planned placeholder */}
        <div className="mt-6 bg-gradient-to-r from-violet-950/20 via-black/40 to-violet-950/20 border border-violet-500/15 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400">
              <Award size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white font-display">Founder Edition (Future)</h4>
                <span className="text-[8px] bg-violet-500 text-white font-mono uppercase px-1.5 py-0.5 rounded">Planned</span>
              </div>
              <p className="text-xs text-white/50">Exklusiver Lifetime-Zugang für frühe Unterstützer mit lebenslangen Updates und Founder Badge.</p>
            </div>
          </div>
          <button 
            onClick={() => alert('Vielen Dank! Wir haben Sie auf die exklusive Founder Edition Warteliste gesetzt.')}
            className="px-4 py-2 bg-violet-600/25 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            Auf Warteliste setzen
          </button>
        </div>
      </div>

      {/* Structured Comparison Table from pricing.md */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md relative">
        <h3 className="text-lg font-black text-white font-display mb-4">Vollständiger Funktionsvergleich</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 text-white/50 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Funktion</th>
                <th className="py-3 px-4 text-center">Free</th>
                <th className="py-3 px-4 text-center">Starter</th>
                <th className="py-3 px-4 text-center">Pro</th>
                <th className="py-3 px-4 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {COMPARISON.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-medium text-white">{row.label}</td>
                  <td className="py-3 px-4 text-center font-mono text-white/80">{row.free}</td>
                  <td className="py-3 px-4 text-center font-mono text-white/80">{row.starter}</td>
                  <td className="py-3 px-4 text-center font-mono text-white/80">{row.pro}</td>
                  <td className="py-3 px-4 text-center font-mono text-white/80">{row.enterprise}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stripe Developer & Integration Guide section */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="text-aif-gold-DEFAULT" size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider font-display text-white">Stripe Checkout Integration (Developer Hub)</h3>
          </div>
          <button 
            onClick={() => setShowStripeGuide(prev => !prev)}
            className="text-xs text-aif-gold-DEFAULT hover:underline font-mono flex items-center gap-1 cursor-pointer"
          >
            <Code size={12} />
            {showStripeGuide ? 'Dokumentation verbergen' : 'Backend Code anzeigen'}
          </button>
        </div>

        <p className="text-xs text-white/60 leading-relaxed mb-4">
          Für die reale Abrechnung von AIFinancial wurde das Stripe-Protokoll vorbereitet. Der untere Code zeigt die Stripe Session-Erstellung, um Stripe Customer Portals und Webhooks für automatische API-Planänderungen zu aktivieren.
        </p>

        {showStripeGuide && (
          <div className="space-y-4">
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/15 overflow-x-auto font-mono text-[11px] leading-relaxed text-zinc-300">
              <div className="flex justify-between text-[10px] text-white/30 uppercase border-b border-white/5 pb-2 mb-3 font-bold">
                <span>server.ts (Express API Endpoint)</span>
                <span className="text-emerald-400">Node.js ES6</span>
              </div>
              <pre className="whitespace-pre">{`import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_...');

// POST endpoint to spin up a checkout session based on tier
app.post('/api/stripe/create-checkout', async (req, res) => {
  const { planId, email, successUrl, cancelUrl } = req.body;
  
  // Pricing IDs in your Stripe Dashboard
  const STRIPE_PRICES: Record<string, string> = {
    'Starter': 'price_1PabcStarterMonthly',
    'Pro': 'price_1PabcProMonthly',
    'Enterprise': 'price_1PabcEnterpriseMonthly'
  };

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit', 'sofort'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{
        price: STRIPE_PRICES[planId],
        quantity: 1,
      }],
      success_url: \`\${successUrl}?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { planId, email } // Passed into webhook for instant activation
      }
    });

    res.json({ sessionId: session.id, checkoutUrl: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`}</pre>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl border border-white/15 overflow-x-auto font-mono text-[11px] leading-relaxed text-zinc-300">
              <div className="flex justify-between text-[10px] text-white/30 uppercase border-b border-white/5 pb-2 mb-3 font-bold">
                <span>stripe-webhooks.ts (Instant activation worker)</span>
                <span className="text-emerald-400">Secure Webhook Handlers</span>
              </div>
              <pre className="whitespace-pre">{`// Listen for Stripe events (e.g. checkout.session.completed)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const planId = session.metadata.planId;
    const email = session.metadata.email;
    
    // DB Query: Update user plan tier instantly
    db.users.update({ email }, { subscriptionTier: planId });
    console.log(\`[CAPITAL-AI webhook] User \${email} upgraded to \${planId} plan!\`);
  }
  
  res.json({ received: true });
});`}</pre>
            </div>
          </div>
        )}

        {/* Integration Credentials list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
          <div className="bg-white/5 border border-white/10 p-3 rounded-lg font-mono">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">Stripe Secret Key</span>
            <span className={`text-xs font-bold block mt-1 ${configStatus.secretKeyConfigured ? 'text-emerald-400' : 'text-amber-500'}`}>
              {configStatus.secretKeyConfigured ? '● Aktiviert (Produktiv-Modus)' : '○ Nicht konfiguriert (.env)'}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-lg font-mono">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">Stripe Webhook Secret</span>
            <span className={`text-xs font-bold block mt-1 ${configStatus.webhookSecretConfigured ? 'text-emerald-400' : 'text-amber-500'}`}>
              {configStatus.webhookSecretConfigured ? '● Aktiviert (Live Webhook)' : '○ Nicht konfiguriert (.env)'}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-lg font-mono flex justify-between items-center">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/40 block">Publishable Key</span>
              <span className={`text-xs font-bold block mt-1 flex items-center gap-1 ${configStatus.publishableKeyConfigured ? 'text-emerald-400' : 'text-amber-500'}`}>
                {configStatus.publishableKeyConfigured ? '● Aktiviert (Live)' : '○ Nicht konfiguriert (.env)'}
              </span>
            </div>
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${configStatus.secretKeyConfigured && configStatus.webhookSecretConfigured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
              {configStatus.secretKeyConfigured && configStatus.webhookSecretConfigured ? 'Live Aktiv' : 'Sandbox Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Stripe Payment Integration Modal Dialog */}
      <AnimatePresence>
        {showCheckoutModal && (
          <Checkout 
            planId={showCheckoutModal as any}
            price={showCheckoutModal === 'Free' ? 0 : Math.round(PLANS.find(p => p.id === showCheckoutModal)!.price * discountMultiplier)}
            billingPeriod={billingPeriod}
            email={email}
            accessToken={accessToken}
            onClose={() => setShowCheckoutModal(null)}
            onSuccess={(tier) => {
              onUpdateTier(tier);
              setSuccess(tier);
              setTimeout(() => setSuccess(null), 4000);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
