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
  AlertTriangle,
  Database,
  Server,
  Mail,
  ChevronDown,
  Clock,
  X,
  ArrowRight
} from 'lucide-react';
import { Checkout } from './Checkout';

interface AbonnementsProps {
  currentTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpdateTier: (tier: 'Free' | 'Starter' | 'Pro' | 'Enterprise') => void;
  email?: string;
  userId?: string;
}

export function Abonnements({ currentTier, onUpdateTier, email = 'sven.kulessa@gmail.com', userId }: AbonnementsProps) {
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showStripeGuide, setShowStripeGuide] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showCheckoutModal, setShowCheckoutModal] = useState<string | null>(null);
  const [showInactivityOverlay, setShowInactivityOverlay] = useState(false);
  const lastActivityRef = React.useRef<number>(Date.now());

  // Client-side inactivity monitoring for Free users (triggers after 180 seconds = 180,000ms)
  React.useEffect(() => {
    if (currentTier !== 'Free') {
      setShowInactivityOverlay(false);
      return;
    }

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, resetActivity, { passive: true }));

    const checkInterval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityRef.current;
      if (inactiveMs >= 180000) {
        setShowInactivityOverlay(prev => {
          if (!prev) return true;
          return prev;
        });
      }
    }, 2000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetActivity));
      clearInterval(checkInterval);
    };
  }, [currentTier]);

  const FAQS = [
    {
      question: "Was können Free- & Gast-User im Enterprise Scorer und Bewertungstool nutzen?",
      answer: "Free- & Gast-User erhalten vollen Zugriff auf Bitcoin (BTC) im Enterprise Scorer und Bewertungstool und können zusätzlich 1 weiteres Asset-Slot im Scorer hinzufügen (BTC + 1 Zusatz-Asset) und screenen.",
      tierBadge: "Free / Gast (BTC + 1 Slot)"
    },
    {
      question: "Welche Limits gelten für die Starter Version (7€/Monat)?",
      answer: "In der Starter Version steht der Enterprise Scorer frei zur Verfügung und ist auf täglich 5 Asset-Screenings beschränkt. Ein Screening umfasst die Auswahl eines Assets und dessen detaillierte Bewertungsergebnisse.",
      tierBadge: "Starter (5 Screenings/Tag)"
    },
    {
      question: "Was bietet die PRO Edition mit dem Realtime AI-Newsfeed?",
      answer: "Der Realtime AI-Newsfeed ist exklusiv ab der PRO Version (29€/Monat) freigeschaltet. Er liefert ungefilterte Markt-Eilmeldungen mit automatischer KI-Sentiment-Analyse, Sentiment-Impact-Scoring und unbegrenzten täglichen Screenings.",
      tierBadge: "PRO (Unbegrenztes Screening)"
    },
    {
      question: "Warum benötige ich die ENTERPRISE Version für Exports?",
      answer: "Formelle BaFin- und DSGVO-konforme PDF- & CSV-Exports aller Scoring-Ergebnisse, Compliance-Audits und Risikokennzahlen erfordern erhebliche Server-Ressourcen und Audit-Logs. Diese Funktion sowie der 24/7 VIP-Support sind der ENTERPRISE OS Version (109€/Monat) vorbehalten.",
      tierBadge: "Enterprise OS"
    },
    {
      question: "Kann ich mein Abonnement jederzeit kündigen oder anpassen?",
      answer: "Ja! Alle Abonnements sind monatlich flexibel im Stripe Kundenportal kündbar oder anpassbar. Nach einem Upgrade schaltet das System Ihre neuen Funktionen ohne Wartezeit sofort frei.",
      tierBadge: "Flexibler Vertrag"
    },
    {
      question: "Wie erreiche ich den Support bei Fragen oder individuellen Anfragen?",
      answer: "Sie können uns jederzeit per E-Mail unter support@capital-ai.online erreichen. Unser Team antwortet in der Regel innerhalb weniger Stunden und unterstützt Sie gerne bei allen Anliegen.",
      tierBadge: "Direkter Support"
    }
  ];
  const [configStatus, setConfigStatus] = useState({
    secretKeyConfigured: false,
    webhookSecretConfigured: false,
    publishableKeyConfigured: false,
    dbConfigured: false
  });

  React.useEffect(() => {
    // 1. Fetch Stripe configuration status safely without leaking keys
    fetch('/api/stripe/config-status')
      .then(res => res.json())
      .then(data => setConfigStatus(data))
      .catch(err => console.error("Error loading stripe config status:", err));

    // 2. Query persisted database-tier for this user
    if (email) {
      fetch(`/api/stripe/user-subscription?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.subscriptionTier && data.subscriptionTier !== currentTier) {
            onUpdateTier(data.subscriptionTier);
          }
        })
        .catch(err => console.error("Error syncing user subscription tier:", err));
    }
  }, [email]);

  // Preisvorschau im Frontend. Der tatsächlich abgerechnete Betrag wird
  // ausschließlich von Stripe über die separate STRIPE_PRICE_ID_*_YEARLY
  // Price-ID bestimmt (siehe server/stripe.ts) - der Rabatt steckt bereits
  // im dort hinterlegten Betrag, es gibt bewusst keine serverseitige
  // Rabattberechnung und keine Coupon-Variable (ADR-0017). Diese Berechnung
  // dient ausschließlich der Vorabanzeige vor dem Checkout.
  const discountMultiplier = billingPeriod === 'yearly' ? 0.9 : 1.0;

  // Bei jährlicher Abrechnung wird der Gesamtbetrag für 12 Monate ausgewiesen,
  // nicht der rabattierte Monatspreis. Der angezeigte Betrag entspricht damit
  // dem voraussichtlich abgebuchten Betrag.
  const priceFor = (basePrice: number) =>
    basePrice === 0
      ? 0
      : billingPeriod === 'yearly'
      ? Math.round(basePrice * 12 * discountMultiplier)
      : Math.round(basePrice * discountMultiplier);

  const periodLabel = billingPeriod === 'yearly' ? '/ Jahr' : '/ Monat';

  const PLANS = [
    {
      id: 'Free',
      name: 'Free & Gast',
      price: 0,
      badge: 'Basis-Zugang',
      desc: 'Bitcoin (BTC) Freischaltung + 1 zusätzliches Asset-Slot im Enterprise Scorer.',
      devices: '1 Gerät',
      features: [
        'BTC Enterprise Scoring & Bewertungstool freigeschaltet',
        '1 zusätzliches Asset-Slot im Scorer (BTC + 1 Zusatz-Asset)',
        'Echtzeit BTC-Metriken & Risiko-Score',
        'Support & Feedback (support@capital-ai.online)'
      ],
      lockedFeatures: [
        'Täglich mehr als 1 Zusatz-Asset screenen (ab Starter)',
        'Täglich 5 Screenings frei nutzen (ab Starter)',
        'Realtime AI Newsfeed (ab PRO)',
        'PDF- & Compliance-Exports (ab Enterprise)'
      ],
      color: 'border-white/10 hover:border-white/20 bg-white/5 text-white',
      buttonText: 'Free Nutzen',
      icon: Eye
    },
    {
      id: 'Starter',
      name: 'Starter Plan',
      price: 7,
      badge: '5 Screenings / Tag',
      desc: 'Freie Nutzung des Enterprise Scorers mit täglich 5 Asset-Screenings.',
      devices: '1 Gerät',
      features: [
        'ENTERPRISE Scorer frei nutzbar (täglich 5 Screenings)',
        'Flexible Asset-Auswahl (Krypto, Aktien, Indizes, Rohstoffe)',
        'Unbegrenzte quantitative Backtests',
        'Buffett-Value & DCF Rechner'
      ],
      lockedFeatures: [
        'Kein Realtime AI-Newsfeed (ab PRO)',
        'Limit auf 5 Screenings/Tag (ab PRO unbegrenzt)',
        'Keine PDF- / Compliance-Exports (ab Enterprise)'
      ],
      color: 'border-blue-500/30 hover:border-blue-500/50 bg-blue-500/5 text-blue-400',
      buttonText: 'Starter abonnieren',
      icon: Zap
    },
    {
      id: 'Pro',
      name: 'Pro Edition',
      price: 29,
      badge: 'Bestseller (Unbegrenzt)',
      desc: 'Unbegrenztes tägliches Asset-Screening & Realtime AI-Newsfeed.',
      devices: 'Bis zu 2 Geräte',
      features: [
        'Realtime AI-Newsfeed (vollständig freigeschaltet)',
        'Unbegrenztes tägliches Asset-Screening',
        'Multi-Model AI Auto-Routing & Push-Alerts',
        'Erweiterte Watchlists & KI-Sentiment Cockpit'
      ],
      lockedFeatures: [
        'Keine PDF- & CSV-Exports (ab Enterprise)'
      ],
      color: 'border-aif-gold-DEFAULT/40 hover:border-aif-gold-DEFAULT/60 bg-aif-gold-DEFAULT/5 text-aif-gold-DEFAULT shadow-[0_0_20px_rgba(245,196,83,0.1)]',
      buttonText: 'Pro abonnieren',
      icon: Star
    },
    {
      id: 'Enterprise',
      name: 'Enterprise OS',
      price: 109,
      badge: 'Alle Features & Exports',
      desc: 'Formelle BaFin/DSGVO PDF-Exports, API-Zugang und Prioritäts-Support.',
      devices: 'Bis zu 5 Geräte',
      features: [
        'Offizielle BaFin & DSGVO PDF/CSV Exports',
        'Realtime AI-Newsfeed & Multi-Model Engine',
        'Unbegrenzte Screenings, Backtests & Monte-Carlo',
        'Exklusives Buffett-Style AI Cockpit',
        'Priorisierter 24/7 Support (support@capital-ai.online)'
      ],
      lockedFeatures: [],
      color: 'border-aif-neon-cyan/40 hover:border-aif-neon-cyan/60 bg-aif-neon-cyan/5 text-aif-neon-cyan shadow-[0_0_20px_rgba(13,221,221,0.1)]',
      buttonText: 'Enterprise freischalten',
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
    { label: 'Enterprise Scorer (BTC)', free: '✅ Standard', starter: '✅', pro: '✅', enterprise: '✅' },
    { label: 'Assets Hinzufügen / Austauschen', free: '❌ (Fest auf BTC)', starter: '✅ Erlaubt', pro: '✅ Erlaubt', enterprise: '✅ Erlaubt' },
    { label: 'Monatliches Asset-Screening', free: '1 Asset (BTC)', starter: 'Max. 3 Assets', pro: 'Unbegrenzt', enterprise: 'Unbegrenzt' },
    { label: 'Realtime AI-Newsfeed', free: '❌ Gesperrt', starter: '❌ Gesperrt', pro: '✅ Freigeschaltet', enterprise: '✅ Freigeschaltet' },
    { label: 'BaFin/DSGVO PDF Exports', free: '❌', starter: '❌', pro: '❌', enterprise: '✅ Exklusiv' },
    { label: 'Website-Inhalte & Tools', free: 'Scoring Only', starter: 'Standard', pro: 'Vollständig', enterprise: 'Vollständig' },
    { label: 'Buffett-Style AI', free: '❌', starter: '❌', pro: '❌', enterprise: '✅' },
    { label: 'Priorisierter Support', free: 'Standard', starter: 'Standard', pro: 'Priorisiert', enterprise: '24/7 VIP' }
  ];

  return (
    <div className="space-y-8">
      {/* Upper Promo Banner */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/45 to-transparent" />

        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-10 relative z-10">
          <span className="px-2.5 py-1 rounded text-[9px] font-bold bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/40 tracking-wider font-mono uppercase">
            CAPITAL-AI SUBSCRIPTION &amp; UPGRADE PLATFORM
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white font-display mt-3">
            Wählen Sie Ihren Investment-Vorsprung
          </h2>
          <p className="text-xs sm:text-sm text-white/70 mt-2 max-w-xl mx-auto font-mono leading-relaxed">
            Schalten Sie mit <strong className="text-aif-gold-DEFAULT">PRO</strong> den Realtime AI-Newsfeed frei oder sichern Sie sich mit <strong className="text-aif-neon-cyan">ENTERPRISE</strong> offizielle BaFin &amp; DSGVO PDF-Exports sowie uneingeschränktes Asset-Screening.
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
          {billingPeriod === 'yearly' && (
            <p className="text-[10px] text-white/40 font-mono mt-2">
              Gezeigte Preise sind Vorabschätzungen. Der endgültige Betrag wird beim Checkout von Stripe ausgewiesen.
            </p>
          )}
        </div>

        {/* Conversion Focus Banner for Free Users */}
        {currentTier === 'Free' && (
          <div className="mb-8 p-6 bg-gradient-to-r from-amber-950/40 via-black to-blue-950/40 border border-aif-gold-DEFAULT/40 rounded-2xl relative overflow-hidden backdrop-blur-xl shadow-[0_0_30px_rgba(245,196,83,0.15)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2.5 max-w-2xl text-left">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-widest bg-aif-gold-DEFAULT text-black">
                    Nutzungs-Hinweis
                  </span>
                  <span className="text-xs text-white/60 font-mono">Aktueller Status: Free Edition (Standard: BTC)</span>
                </div>
                <h3 className="text-xl font-black text-white font-display">
                  Warum Sie von Free auf PRO oder Enterprise wechseln sollten:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-black/60 border border-aif-gold-DEFAULT/30 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-aif-gold-DEFAULT font-bold text-xs font-mono uppercase mb-1">
                      <Zap size={14} />
                      <span>PRO Version (€29/m)</span>
                    </div>
                    <p className="text-[11px] text-white/70 font-mono leading-relaxed">
                      ★ <strong className="text-white">Realtime AI-Newsfeed</strong> vollständig freigeschaltet.<br />
                      ★ <strong className="text-white">Unbegrenztes Assets-Screening</strong> im Scorer.<br />
                      ★ Multi-Model AI Auto-Routing &amp; Push-Signale.
                    </p>
                  </div>
                  <div className="bg-black/60 border border-aif-neon-cyan/30 p-3 rounded-xl">
                    <div className="flex items-center gap-1.5 text-aif-neon-cyan font-bold text-xs font-mono uppercase mb-1">
                      <Cpu size={14} />
                      <span>ENTERPRISE OS (€109/m)</span>
                    </div>
                    <p className="text-[11px] text-white/70 font-mono leading-relaxed">
                      ★ <strong className="text-white">BaFin &amp; DSGVO PDF-Exports</strong> inklusive.<br />
                      ★ Uneingeschränkte Asset-Auswahl &amp; Multi-Asset Universe.<br />
                      ★ Priorisierter 24/7 VIP-Support.
                    </p>
                  </div>
                </div>
              </div>
              <div className="shrink-0 space-y-3 w-full md:w-auto text-center">
                <button
                  onClick={() => handleSubscribeClick('Pro')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:from-amber-400 hover:to-aif-gold-DEFAULT text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(245,196,83,0.3)] flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
                >
                  <Star size={15} />
                  <span>Jetzt auf PRO Upgraden</span>
                </button>
                <a
                  href="mailto:support@capital-ai.online"
                  className="block text-[11px] text-white/60 hover:text-aif-gold-DEFAULT font-mono underline"
                >
                  Fragen? support@capital-ai.online
                </a>
              </div>
            </div>
          </div>
        )}

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
            const calculatedPrice = priceFor(plan.price);
            const effectiveMonthly = plan.price === 0 ? 0 : Math.round(plan.price * discountMultiplier);

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

                  <div className="my-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-mono font-black text-white">{calculatedPrice}€</span>
                      <span className="text-xs opacity-40 font-mono">{periodLabel}</span>
                    </div>
                    {billingPeriod === 'yearly' && plan.price > 0 && (
                      <div className="text-[10px] text-aif-gold-DEFAULT/70 font-mono mt-1">
                        entspricht {effectiveMonthly}€ / Monat
                      </div>
                    )}
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

      {/* Frequently Asked Questions (FAQ) Section for Free User Conversions */}
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 sm:p-8 backdrop-blur-md relative">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/30 rounded-lg text-aif-gold-DEFAULT">
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white font-display">Häufig gestellte Fragen (FAQ) &amp; Tarif-Vergleich</h3>
            <p className="text-xs text-white/60 font-mono">Antworten zu Limits im Free-Modus, AI Newsfeed Freischaltung und Exports</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={index} 
                className={`border rounded-xl transition-all duration-200 overflow-hidden ${
                  isOpen 
                    ? 'border-aif-gold-DEFAULT/40 bg-white/[0.03]' 
                    : 'border-white/10 bg-black/20 hover:border-white/20'
                }`}
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-white/5 border border-white/10 text-aif-gold-DEFAULT shrink-0">
                      {faq.tierBadge}
                    </span>
                    <h4 className="text-sm font-bold text-white font-display">{faq.question}</h4>
                  </div>
                  <ChevronDown 
                    size={18} 
                    className={`text-white/50 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-aif-gold-DEFAULT' : ''}`} 
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-4 sm:px-5 pb-5 pt-1 text-xs text-white/75 font-mono leading-relaxed border-t border-white/5 bg-black/40"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
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
          Für die reale Abrechnung von Capital-AI wurde das Stripe-Protokoll vorbereitet. Der untere Code zeigt die Stripe Session-Erstellung, um Stripe Customer Portals und Webhooks für automatische API-Planänderungen zu aktivieren.
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5">
          <div className="bg-white/5 border border-white/10 p-3 rounded-lg font-mono">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">Stripe Secret Key</span>
            <span className={`text-xs font-bold block mt-1 ${configStatus.secretKeyConfigured ? 'text-emerald-400' : 'text-amber-500'}`}>
              {configStatus.secretKeyConfigured ? '● Aktiviert (Live)' : '○ Sandbox-Modus (.env)'}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-lg font-mono">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">Stripe Webhook Secret</span>
            <span className={`text-xs font-bold block mt-1 ${configStatus.webhookSecretConfigured ? 'text-emerald-400' : 'text-amber-500'}`}>
              {configStatus.webhookSecretConfigured ? '● Aktiviert (Live Webhook)' : '○ Sandbox-Modus (.env)'}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-lg font-mono">
            <span className="text-[9px] uppercase tracking-wider text-white/40 block">Stripe Publishable Key</span>
            <span className={`text-xs font-bold block mt-1 ${configStatus.publishableKeyConfigured ? 'text-emerald-400' : 'text-amber-500'}`}>
              {configStatus.publishableKeyConfigured ? '● Aktiviert (Live)' : '○ Sandbox-Modus (.env)'}
            </span>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-lg font-mono flex justify-between items-center">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/40 block">Produktiv-Datenbank (Supabase)</span>
              <span className={`text-xs font-bold block mt-1 flex items-center gap-1 ${configStatus.dbConfigured ? 'text-emerald-400' : 'text-amber-500'}`}>
                {configStatus.dbConfigured ? '● Verbunden (Live)' : '○ Fallback (Lokales File)'}
              </span>
            </div>
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${configStatus.secretKeyConfigured && configStatus.webhookSecretConfigured && configStatus.dbConfigured ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'}`}>
              {configStatus.secretKeyConfigured && configStatus.webhookSecretConfigured && configStatus.dbConfigured ? 'PROD BEREIT' : 'SEMI-PROD'}
            </span>
          </div>
        </div>

        {/* Support & Contact Banner */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-950/30 via-indigo-950/30 to-purple-950/30 border border-blue-500/20 rounded-xl text-xs font-mono text-white/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-aif-gold-DEFAULT shrink-0 animate-pulse" />
            <div>
              <span className="font-bold text-white block">Fragen, Anregungen oder spezielle Wünsche zu den Abonnements?</span>
              <span className="text-white/60 text-[11px]">Unser Support-Team unterstützt Sie gerne jederzeit persönlich.</span>
            </div>
          </div>
          <a 
            href="mailto:support@capital-ai.online" 
            className="px-4 py-2 bg-aif-gold-DEFAULT text-black font-black uppercase tracking-wider text-[11px] rounded-lg hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,196,83,0.3)] shrink-0 cursor-pointer"
          >
            support@capital-ai.online
          </a>
        </div>

        {/* Informational Guidance Alert for Prod sync */}
        <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/5 text-[11px] font-mono leading-relaxed text-white/70 flex items-start gap-2">
          <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-white font-bold block mb-0.5">Produktiv-Synchronisation &amp; Go-Live Leitfaden</span>
            Die Anwendung ist voll funktionsfähig für den Produktivbetrieb vorbereitet. Sobald Sie Ihre echten Supabase Zugangsdaten und Stripe Price-IDs in der Server-Konfiguration (<code className="text-aif-gold-DEFAULT">.env</code>) hinterlegen, synchronisieren sich Daten und Zahlungen in Echtzeit. 
            Eine detaillierte Schritt-für-Schritt-Anleitung wurde in <code className="text-aif-gold-DEFAULT">docs/PRODUCTION_DEPLOYMENT_GUIDE.md</code> für Sie hinterlegt.
          </div>
        </div>
      </div>

      {/* Stripe Payment Integration Modal Dialog */}
      <AnimatePresence>
        {showCheckoutModal && (
          <Checkout 
            planId={showCheckoutModal as any}
            price={showCheckoutModal === 'Free' ? 0 : priceFor(PLANS.find(p => p.id === showCheckoutModal)!.price)}
            billingPeriod={billingPeriod}
            email={email}
            userId={userId}
            onClose={() => setShowCheckoutModal(null)}
            onSuccess={(tier) => {
              onUpdateTier(tier);
              setSuccess(tier);
              setTimeout(() => setSuccess(null), 4000);
            }}
          />
        )}
      </AnimatePresence>

      {/* Client-side Inactivity Overlay for Free Users (Triggered after 180s inactivity) */}
      <AnimatePresence>
        {showInactivityOverlay && currentTier === 'Free' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="max-w-2xl w-full bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-aif-gold-DEFAULT/50 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,196,83,0.25)] relative overflow-hidden"
            >
              {/* Decorative top bar glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-aif-gold-DEFAULT via-amber-400 to-aif-neon-cyan" />

              {/* Close button */}
              <button
                onClick={() => {
                  setShowInactivityOverlay(false);
                  lastActivityRef.current = Date.now();
                }}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all cursor-pointer"
                title="Hinweis schließen"
              >
                <X size={18} />
              </button>

              {/* Header Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/40 flex items-center gap-1.5">
                  <Clock size={12} className="animate-spin" style={{ animationDuration: '6s' }} />
                  Inaktivitäts-Hinweis (180s System-Limit)
                </span>
                <span className="text-xs text-white/50 font-mono">Aktuell: Free Edition (BTC)</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white font-display leading-tight mb-2">
                Verpassen Sie keine wichtigen Marktsignale
              </h2>
              <p className="text-xs sm:text-sm text-white/70 font-mono leading-relaxed mb-6">
                Nach 180 Sekunden Inaktivität möchten wir Sie an Ihre ungenutzten Handelsvorteile erinnern. Im kostenlosen <strong className="text-white">Free-Modus</strong> nutzen Sie lediglich die Vorschau für Bitcoin (BTC).
              </p>

              {/* Upgrade Tier Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* PRO Tier Highlight */}
                <div className="p-4 bg-gradient-to-b from-aif-gold-DEFAULT/10 to-black/60 border border-aif-gold-DEFAULT/40 rounded-xl relative group hover:border-aif-gold-DEFAULT transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-aif-gold-DEFAULT uppercase tracking-wider font-mono flex items-center gap-1">
                      <Star size={14} /> PRO Edition
                    </span>
                    <span className="text-xs font-bold text-white font-mono">€29/m</span>
                  </div>
                  <ul className="text-[11px] text-white/80 font-mono space-y-1.5 mb-4">
                    <li className="flex items-start gap-1.5">
                      <Zap size={13} className="text-aif-gold-DEFAULT shrink-0 mt-0.5" />
                      <span><strong className="text-white">Realtime AI-Newsfeed</strong> mit Sentiment-Scoring</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check size={13} className="text-aif-gold-DEFAULT shrink-0 mt-0.5" />
                      <span>Unbegrenztes Screening aller Assets</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check size={13} className="text-aif-gold-DEFAULT shrink-0 mt-0.5" />
                      <span>Multi-Model AI Auto-Routing &amp; Push-Alerts</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => {
                      setShowInactivityOverlay(false);
                      handleSubscribeClick('Pro');
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:from-amber-400 hover:to-aif-gold-DEFAULT text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(245,196,83,0.3)] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                  >
                    <span>Jetzt auf PRO Upgraden</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* ENTERPRISE OS Highlight */}
                <div className="p-4 bg-gradient-to-b from-aif-neon-cyan/10 to-black/60 border border-aif-neon-cyan/40 rounded-xl relative group hover:border-aif-neon-cyan transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-aif-neon-cyan uppercase tracking-wider font-mono flex items-center gap-1">
                      <Cpu size={14} /> Enterprise OS
                    </span>
                    <span className="text-xs font-bold text-white font-mono">€109/m</span>
                  </div>
                  <ul className="text-[11px] text-white/80 font-mono space-y-1.5 mb-4">
                    <li className="flex items-start gap-1.5">
                      <ShieldCheck size={13} className="text-aif-neon-cyan shrink-0 mt-0.5" />
                      <span><strong className="text-white">Offizielle BaFin &amp; DSGVO PDF-Exports</strong></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check size={13} className="text-aif-neon-cyan shrink-0 mt-0.5" />
                      <span>Uneingeschränkte Asset-Auswahl &amp; Backtesting</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check size={13} className="text-aif-neon-cyan shrink-0 mt-0.5" />
                      <span>Priorisierter 24/7 VIP-Support</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => {
                      setShowInactivityOverlay(false);
                      handleSubscribeClick('Enterprise');
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-aif-neon-cyan to-blue-500 hover:from-cyan-400 hover:to-aif-neon-cyan text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(13,221,221,0.3)] flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                  >
                    <span>Enterprise Wählen</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Action Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs font-mono">
                <span className="text-white/50 text-[11px]">
                  Jederzeit monatlich flexibel kündbar.
                </span>
                <button
                  onClick={() => {
                    setShowInactivityOverlay(false);
                    lastActivityRef.current = Date.now();
                  }}
                  className="text-white/60 hover:text-white underline cursor-pointer text-[11px]"
                >
                  Weiter im Free-Modus bleiben
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
