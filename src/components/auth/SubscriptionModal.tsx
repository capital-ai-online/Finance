import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Check, 
  Zap, 
  Star, 
  Cpu, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import { Checkout } from './Checkout';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: 'Free' | 'Starter' | 'Pro' | 'Enterprise';
  onUpdateTier: (tier: 'Free' | 'Starter' | 'Pro' | 'Enterprise') => void;
  email: string;
}

export function SubscriptionModal({ isOpen, onClose, currentTier, onUpdateTier, email }: SubscriptionModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'Starter' | 'Pro' | 'Enterprise' | null>(null);

  const discountMultiplier = billingPeriod === 'yearly' ? 0.9 : 1.0;

  const PLANS = [
    {
      id: 'Starter' as const,
      name: 'Starter Plan',
      price: 7,
      badge: 'Capital-AI Basis',
      desc: 'Erweiterte Limits und Backtests für ambitionierte Retail-Investoren.',
      features: [
        '5 Screenings pro Tag',
        'Unbegrenzte quantitative Backtests',
        '1 vollständige KI-Analyse pro Tag',
        'Intelligent Score & Pattern Recognition',
        'Standard PDF-Report-Export (Basis)'
      ],
      color: 'border-blue-500/30 hover:border-blue-500/50 bg-blue-500/5 text-blue-400',
      icon: Zap,
      shadow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]',
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'Pro' as const,
      name: 'Pro Edition',
      price: 29,
      badge: 'Bestseller',
      desc: 'Detaillierte Monte-Carlo-Simulationen und tiefe KI-Insights für aktive Händler.',
      features: [
        '20 Screenings pro Tag',
        'Unbegrenzte quantitative Backtests',
        '1 Monte-Carlo-Simulation pro Tag',
        'Vollständige KI-Analysen & Erklärungen',
        'Erweiterte Watchlists & Portfolio-Analysen',
        'Premium PDF-Reports'
      ],
      color: 'border-aif-gold-DEFAULT/40 hover:border-aif-gold-DEFAULT/60 bg-aif-gold-DEFAULT/5 text-aif-gold-DEFAULT',
      icon: Star,
      shadow: 'shadow-[0_0_30px_rgba(245,196,83,0.15)]',
      gradient: 'from-aif-gold-DEFAULT to-amber-500',
      popular: true
    },
    {
      id: 'Enterprise' as const,
      name: 'Enterprise OS',
      price: 109,
      badge: 'Professional',
      desc: 'Unbegrenzte Kapazitäten und buffet-style KI-Strategien für Asset Manager.',
      features: [
        'Unbegrenzte Screenings & Backtests',
        'Unbegrenzte Monte-Carlo-Simulationen',
        'Exklusiver Zugriff auf Buffett-Style AI',
        'Alle KI-Agenten & priorisierte Verarbeitung',
        'API-Zugang & Rollenverwaltung (optional)',
        'Enterprise PDF-Export & Beta-Features'
      ],
      color: 'border-aif-neon-cyan/40 hover:border-aif-neon-cyan/60 bg-aif-neon-cyan/5 text-aif-neon-cyan',
      icon: Cpu,
      shadow: 'shadow-[0_0_20px_rgba(13,221,221,0.1)]',
      gradient: 'from-aif-neon-cyan to-teal-500'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md cursor-pointer"
      />

      {/* Subscription Card Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-zinc-950 border border-white/10 p-6 md:p-8 rounded-2xl max-w-5xl w-full relative z-10 shadow-[0_0_50px_rgba(245,196,83,0.15)] max-h-[90vh] overflow-y-auto"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-aif-gold-DEFAULT via-amber-500 to-aif-neon-cyan" />

        {/* Header with Close */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/25 tracking-widest font-mono">
              PREMIUM UPGRADE
            </span>
            <span className="text-xs uppercase font-mono tracking-widest text-white/40 hidden sm:inline">Stripe Integration</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Promo Title */}
        <div className="text-center space-y-3 mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-white font-display">
            AIFinancial Premium-Pläne
          </h2>
          <p className="text-xs md:text-sm text-white/55 max-w-xl mx-auto leading-relaxed">
            Schalte fortschrittliche neuronale Analysetools, unbegrenzte Backtests und exklusive KI-Module frei. Flexibel kündbar und sicher verschlüsselt.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center justify-center gap-3 pt-3">
            <span className={`text-xs font-mono transition-colors ${billingPeriod === 'monthly' ? 'text-white font-bold' : 'text-white/40'}`}>
              Monatlich
            </span>
            <button 
              onClick={() => setBillingPeriod(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              className="w-12 h-6 rounded-full bg-white/10 border border-white/20 p-1 flex items-center transition-all cursor-pointer"
            >
              <div className={`w-4 h-4 rounded-full bg-aif-gold-DEFAULT transition-all ${billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-xs font-mono flex items-center gap-1.5 transition-colors ${billingPeriod === 'yearly' ? 'text-aif-gold-DEFAULT font-bold' : 'text-white/40'}`}>
              Jährlich 
              <span className="bg-aif-gold-DEFAULT/15 border border-aif-gold-DEFAULT/25 text-aif-gold-DEFAULT text-[9px] px-2 py-0.5 rounded uppercase font-black tracking-wider animate-pulse">
                -10% Rabatt
              </span>
            </span>
          </div>
        </div>

        {/* PROMO-CODE MODULE: Promo-Code TRIAL26 für 1 Monat kostenlosen Pro-Zugang */}
        {/* HINWEIS ZU GELDBEZUG: Dieses Feature bewerbt den Gutscheincode TRIAL26 für ein kostenloses Pro-Abonnement. */}
        <div className="max-w-4xl mx-auto mb-8 relative z-10">
          <div className="bg-gradient-to-r from-amber-500/10 via-aif-gold-DEFAULT/10 to-emerald-500/10 border border-aif-gold-DEFAULT/25 p-4 rounded-xl relative overflow-hidden shadow-[0_0_20px_rgba(245,196,83,0.12)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-gradient-to-br from-aif-gold-DEFAULT/10 to-transparent rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 rounded-lg text-aif-gold-DEFAULT animate-pulse shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] bg-aif-gold-DEFAULT text-black px-1.5 py-0.5 rounded font-black uppercase tracking-wider font-mono">
                    Aktion
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                    <CheckCircle size={10} /> 100% Gratis-Monat
                  </span>
                </div>
                <h3 className="text-sm font-black text-white font-display leading-tight">
                  1 Monat CAPITAL-AI PRO gratis freischalten!
                </h3>
                <p className="text-[11px] text-white/60 leading-relaxed max-w-xl">
                  Nutze den Code <strong className="text-aif-gold-DEFAULT font-mono bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">TRIAL26</strong> im Checkout des <strong className="text-white">Pro Monats-Abos</strong> für 30 Tage vollen Premium-Zugang.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-stretch sm:items-center gap-1.5 w-full md:w-auto shrink-0">
              <div className="bg-black/60 border border-white/10 px-3.5 py-1.5 rounded-lg text-center font-mono select-all cursor-pointer group hover:border-aif-gold-DEFAULT/30 transition-colors">
                <span className="text-[8px] text-white/40 block uppercase tracking-wider">Gutscheincode</span>
                <span className="text-xs font-black text-aif-gold-DEFAULT tracking-widest font-mono uppercase">TRIAL26</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {PLANS.map((plan) => {
            const PlanIcon = plan.icon;
            const discountedPrice = Math.round(plan.price * discountMultiplier);
            const isCurrent = currentTier === plan.id;

            return (
              <div 
                key={plan.id}
                className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all ${plan.color} ${plan.shadow} ${
                  plan.popular ? 'md:scale-[1.03] md:-translate-y-1' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 text-black text-[9px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(245,196,83,0.4)]">
                    Meistgewählt
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono tracking-widest uppercase opacity-60">
                        {plan.badge}
                      </span>
                      <h3 className="text-lg font-black text-white font-display">
                        {plan.name}
                      </h3>
                    </div>
                    <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                      <PlanIcon size={16} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white font-mono">
                        {discountedPrice} €
                      </span>
                      <span className="text-[10px] opacity-40 font-mono">
                        / Monat
                      </span>
                    </div>
                    <p className="text-[11px] opacity-50 leading-relaxed mt-2 min-h-[36px]">
                      {plan.desc}
                    </p>
                  </div>

                  <div className="border-t border-white/10 my-4" />

                  <ul className="space-y-2 mb-6 text-xs">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white/80">
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    isCurrent 
                      ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 cursor-default'
                      : plan.popular
                        ? 'bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 text-black hover:brightness-110 font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]'
                        : 'bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white'
                  }`}
                >
                  {isCurrent ? 'Aktiver Plan' : 'Jetzt upgraden'}
                </button>
              </div>
            );
          })}
        </div>

        {/* SSL encryption seal */}
        <div className="flex justify-center items-center gap-2 text-[10px] font-mono opacity-30">
          <ShieldCheck size={14} />
          <span>Sichere Übertragung via SSL &amp; Stripe • Jederzeit kündbar</span>
        </div>

        {/* Overlay Checkout Module */}
        <AnimatePresence>
          {selectedPlan && (
            <Checkout 
              planId={selectedPlan}
              price={Math.round(PLANS.find(p => p.id === selectedPlan)!.price * discountMultiplier)}
              billingPeriod={billingPeriod}
              email={email}
              onClose={() => setSelectedPlan(null)}
              onSuccess={(tier) => {
                onUpdateTier(tier);
                setSelectedPlan(null);
                onClose();
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
