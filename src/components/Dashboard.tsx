import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Screener } from './Screener';
import { Newsticker } from './Newsticker';
import { ImageAnalyzer } from './ImageAnalyzer';
import { CryptoEnterpriseEvaluator } from './CryptoEnterpriseEvaluator';
import { ProfilePage, UserProfile } from './ProfilePage';
import { MonteCarloDetailed } from './MonteCarloDetailed';
import { BuffetValueCheck } from './BuffetValueCheck';
import { Abonnements } from './Abonnements';
import { SubscriptionModal } from './SubscriptionModal';
import { Datenschutz } from './Datenschutz';
import { ImpressumAgb } from './ImpressumAgb';
import { RealtimeAiNewsfeed } from './RealtimeAiNewsfeed';
import { BacktestEngine } from './BacktestEngine';
import { HeatmapCreator } from './HeatmapCreator';
import { AifCoreLogo } from './AifCoreLogo';
import { MarketScreener } from './MarketScreener';
import { CryptoScoringEnterprise } from './CryptoScoringEnterprise';
import { UserSession } from '../App';
import { GuestCliffhangerModal } from './GuestCliffhangerModal';
import { MarkdownOrchestrator } from './MarkdownOrchestrator';
import { InteractModule } from './InteractModule';
import { Charts } from './Charts';
import { OrchestratorPanel } from './OrchestratorPanel';
import PerformanceDashboard from './PerformanceDashboard';
import { RealTimeRiskAssessment } from './RealTimeRiskAssessment';

import { 
  LogOut, 
  LayoutDashboard, 
  LineChart, 
  Cpu, 
  ShieldCheck, 
  ChevronDown, 
  User, 
  Settings, 
  CreditCard, 
  Activity, 
  Menu, 
  X, 
  Scale, 
  Shield, 
  Percent, 
  HelpCircle, 
  LogIn, 
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Flame,
  SlidersHorizontal,
  FileText,
  Orbit,
  BarChart3,
  Gauge,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  userSession: UserSession;
  onLogout: () => void;
  onRegister: (name: string, email: string) => void;
}

function SidebarTooltip({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="relative group/sidebar-tooltip w-full">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 w-64 p-3 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white shadow-2xl hidden group-hover/sidebar-tooltip:block pointer-events-none z-50 animate-fade-in normal-case tracking-normal">
        <div className="font-extrabold text-aif-gold-DEFAULT mb-1 flex items-center gap-1.5">
          <Sparkles size={12} className="text-aif-gold-DEFAULT" />
          <span>{title}</span>
        </div>
        <p className="text-[10px] text-white/70 leading-normal font-sans font-medium">{text}</p>
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-neutral-950" />
      </div>
    </div>
  );
}

export function Dashboard({ userSession, onLogout, onRegister }: DashboardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [timeframe, setTimeframe] = useState<string>('1std');
  const [activeView, setActiveView] = useState<'dashboard' | 'monte-carlo' | 'buffet-value' | 'backtest' | 'heatmap' | 'market-screener' | 'abonnements' | 'datenschutz' | 'impressum-agb' | 'profil' | 'markdown-orchestrator' | 'interact' | 'charts' | 'request-orchestrator' | 'performance' | 'risiko-assessment'>('dashboard');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  // Guest limitations state
  const [attempts, setAttempts] = useState<number>(0);
  const [cliffhangerModalOpen, setCliffhangerModalOpen] = useState(false);
  const [failedActionName, setFailedActionName] = useState('');

  // Unified global persistent user profile
  const [profile, setProfile] = useState<UserProfile>({
    name: userSession.name,
    email: userSession.email,
    avatarId: '1',
    avatarColor: 'from-aif-gold-DEFAULT to-aif-gold-dark',
    preferredAssetClass: 'Crypto',
    riskProfile: 'Ausgewogen',
    capital: 150000,
    subscriptionTier: userSession.type === 'guest' ? 'Free' : userSession.subscriptionTier
  });

  // Synchronize profile state with userSession prop
  React.useEffect(() => {
    if (userSession) {
      setProfile(prev => ({
        ...prev,
        name: userSession.name,
        email: userSession.email,
        subscriptionTier: userSession.type === 'guest' ? 'Free' : userSession.subscriptionTier
      }));
    }
  }, [userSession]);

  const triggerAttempt = (actionName: string, onExecute: () => void) => {
    if (userSession.type === 'guest') {
      if (attempts >= 1) {
        setFailedActionName(actionName);
        setCliffhangerModalOpen(true);
      } else {
        setAttempts(1);
        onExecute();
      }
    } else {
      onExecute();
    }
  };

  React.useEffect(() => {
    // 1. Check for success query parameter from Stripe redirect fallback
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const plan = params.get('plan');

    if (payment === 'success' && plan) {
      setProfile(prev => ({ ...prev, subscriptionTier: plan as any }));
      setActiveView('abonnements');
      // Clear URL query parameters cleanly
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Fetch/sync latest persistent tier from backend webhook storage on mount (auth required)
    if (profile.email) {
      supabase.auth.getSession().then(({ data: sessionData }) => {
        const token = sessionData?.session?.access_token;
        if (!token) return;
        fetch(`/api/stripe/user-subscription`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            if (data.subscriptionTier && data.subscriptionTier !== profile.subscriptionTier) {
              setProfile(prev => ({ ...prev, subscriptionTier: data.subscriptionTier }));
            }
          })
          .catch(err => console.error("Error syncing subscription tier with server:", err));
      });
    }
  }, []);

  // Get active avatar icon for sidebar and profile dropdown
  const getAvatarIcon = (id: string) => {
    switch (id) {
      case '1': return Cpu;
      case '2': return Sparkles;
      case '3': return Cpu; // fallback
      case '4': return ShieldCheck;
      default: return User;
    }
  };

  const ActiveAvatarIcon = getAvatarIcon(profile.avatarId);

  // Quick navigation handler that closes the drawer automatically
  const navigateTo = (view: typeof activeView) => {
    setActiveView(view);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#18181b] text-white selection:bg-aif-gold-DEFAULT/30 font-sans relative">
      
      {/* Background Effect - Highly Active Neural Connections */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
          <defs>
            <linearGradient id="dash-neural-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5C453" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#0DDDDD" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#B026FF" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="dash-neural-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#B026FF" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#0DDDDD" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F5C453" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Connected organic neural path lines */}
          <path d="M 0,200 Q 300,50 600,250 T 1200,100 T 1800,300" fill="none" stroke="url(#dash-neural-1)" strokeWidth="2" className="animate-pulse opacity-40" />
          <path d="M 100,600 Q 450,400 800,650 T 1500,450 T 2000,700" fill="none" stroke="url(#dash-neural-2)" strokeWidth="1.5" className="animate-pulse opacity-30" />

          {/* Interconnected secondary neural lines */}
          <line x1="10%" y1="20%" x2="25%" y2="35%" stroke="#F5C453" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-40" />
          <line x1="25%" y1="35%" x2="40%" y2="15%" stroke="#0DDDDD" strokeWidth="2" className="opacity-50" />
          <line x1="40%" y1="15%" x2="60%" y2="30%" stroke="#B026FF" strokeWidth="1" className="opacity-40" />
          <line x1="60%" y1="30%" x2="85%" y2="20%" stroke="#0DDDDD" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-50" />

          <line x1="5%" y1="80%" x2="20%" y2="65%" stroke="#B026FF" strokeWidth="1.5" className="opacity-40" />
          <line x1="20%" y1="65%" x2="35%" y2="85%" stroke="#F5C453" strokeWidth="2" className="opacity-50" />
          <line x1="35%" y1="85%" x2="55%" y2="70%" stroke="#0DDDDD" strokeWidth="1.5" className="opacity-40" />
          <line x1="55%" y1="70%" x2="75%" y2="90%" stroke="#F5C453" strokeWidth="3" className="opacity-30" />

          {/* Active neural intersection nodes */}
          <circle cx="10%" cy="20%" r="5" fill="#0DDDDD" className="animate-neural-pulse-fast" />
          <circle cx="25%" cy="35%" r="7" fill="#B026FF" className="animate-neural-pulse" />
          <circle cx="40%" cy="15%" r="6" fill="#F5C453" className="animate-gold-pulse" />
          <circle cx="60%" cy="30%" r="5" fill="#0DDDDD" className="animate-neural-pulse-fast" />
          <circle cx="85%" cy="20%" r="6" fill="#B026FF" className="animate-neural-pulse" />

          <circle cx="5%" cy="80%" r="4" fill="#0DDDDD" className="animate-neural-pulse-fast" />
          <circle cx="20%" cy="65%" r="6" fill="#B026FF" className="animate-neural-pulse" />
          <circle cx="35%" cy="85%" r="5" fill="#F5C453" className="animate-gold-pulse" />
          <circle cx="55%" cy="70%" r="4" fill="#0DDDDD" className="animate-neural-pulse-fast" />
          <circle cx="75%" cy="90%" r="7" fill="#F5C453" className="animate-gold-pulse" />
        </svg>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-aif-neon-purple/15 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-aif-neon-cyan/15 blur-[150px] rounded-full" />
      </div>

      {/* Slide-out Retractable Hamburger Drawer Navigation (Left-hand side) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 cursor-pointer"
            />

            {/* Slideout Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-full sm:w-80 bg-black/95 border-r border-white/10 shadow-[0_0_50px_rgba(245,196,83,0.15)] z-50 flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Drawer Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AifCoreLogo size={40} showText={false} />
                    <div className="flex flex-col items-start leading-none">
                      <span className="font-black text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#F0D597] to-[#D4A017] font-display uppercase">AIF-CORE</span>
                      <span className="text-[11px] text-white/70 font-mono tracking-widest uppercase mt-0.5">MODUL 1</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-white/70"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Account / Profil Profile Logo section */}
                <div 
                  onClick={() => navigateTo('profil')}
                  className="p-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 transition-all cursor-pointer flex items-center gap-4 group"
                  title="Mein Profil verwalten"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center shadow-[0_0_15px_rgba(245,196,83,0.2)] group-hover:scale-105 transition-all`}>
                    <ActiveAvatarIcon className="w-6 h-6 text-black" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs text-aif-gold-DEFAULT font-mono uppercase tracking-widest font-black flex items-center gap-1">
                      {profile.subscriptionTier}
                    </div>
                    <h4 className="text-sm font-bold text-white truncate font-display group-hover:text-aif-gold-light transition-colors">
                      {profile.name}
                    </h4>
                    <p className="text-[11px] text-white/70 truncate font-mono">
                      {profile.email}
                    </p>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="p-4 space-y-1">
                  <span className="text-[11px] uppercase tracking-widest text-white/65 font-mono px-3 block mb-2">Plattform Navigation</span>
                  
                  <SidebarTooltip title="Dashboard Home" text="Bietet eine Gesamtübersicht des Portfolios, aktuelle Markttrends, KI-Analysen und die wichtigsten Kennzahlen auf einen Blick.">
                    <button 
                      onClick={() => navigateTo('dashboard')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'dashboard' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <LayoutDashboard size={16} />
                      <span>Dashboard Home</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="Profi Markt-Screener" text="Filtere hunderte von Aktien und Kryptowährungen nach komplexen Kriterien wie KGV, Dividenden, KI-Scores und Graham-Formeln.">
                    <button 
                      onClick={() => navigateTo('market-screener')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'market-screener' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <SlidersHorizontal size={16} className={activeView === 'market-screener' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                      <span>Profi Markt-Screener</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="Ad-Hoc Charts & Indikatoren" text="Echtzeit-Preischarts mit gleitenden Durchschnitten (SMA/EMA), RSI, MACD, Bollinger-Bändern und ad-hoc KI-Agent-Scoring.">
                    <button 
                      onClick={() => navigateTo('charts')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'charts' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <BarChart3 size={16} className={activeView === 'charts' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                      <span>Ad-Hoc Charts</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="Monte Carlo Simulation" text="Berechnet tausende zufällige Zukunftsszenarien für Deine Vermögenswerte, um die Wahrscheinlichkeit von Gewinnen und Verlusten einzuschätzen.">
                    <button 
                      onClick={() => navigateTo('monte-carlo')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'monte-carlo' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <LineChart size={16} />
                      <span>Monte Carlo Simulation</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="Buffet Value Check" text="Bewertet Aktien nach den zeitlosen Kriterien der Value-Investing-Legende Warren Buffett und berechnet den fairen inneren Wert.">
                    <button 
                      onClick={() => navigateTo('buffet-value')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'buffet-value' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <Percent size={16} />
                      <span>BuffetValueCheck</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="Backtest Engine" text="Teste historische Handelsstrategien (wie gleitende Durchschnitte) an vergangenen Daten, um zu sehen, wie profitabel sie gewesen wären.">
                    <button 
                      onClick={() => navigateTo('backtest')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'backtest' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <TrendingUp size={16} className={activeView === 'backtest' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                      <span>Backtest Engine</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="Markdown Orchestrator" text="Ein intelligenter Multi-Perspektiven Dokumenten-Generator, der professionelle Berichte (CEO, Security, QA, Frontend, Backend) direkt auf Codebasis erstellt.">
                    <button 
                      onClick={() => navigateTo('markdown-orchestrator')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'markdown-orchestrator' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <FileText size={16} className={activeView === 'markdown-orchestrator' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                      <span>Markdown Orchestrator</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="AIF Interact (Modul 2) - Temporär Deaktiviert" text="Dieses Modul wurde gemäß Systemvorgabe deaktiviert. Alle anderen Reiter stehen uneingeschränkt zur Verfügung.">
                    <button 
                      disabled
                      className="w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center justify-between gap-3 transition-all relative overflow-hidden opacity-40 cursor-not-allowed border border-dashed border-white/10 bg-black/20"
                    >
                      <div className="flex items-center gap-3">
                        <Orbit size={16} className="text-cyan-500/50" />
                        <span className="text-white/60">Interact (Modul 2)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-black uppercase">Deaktiviert</span>
                    </button>
                  </SidebarTooltip>

                  {(profile.subscriptionTier === 'Enterprise' || profile.email === 'sven.kulessa@gmail.com') && (
                  <SidebarTooltip title="Request Orchestrator" text="Live Telemetrie-Überwachung des Server-Datenstroms, asynchrones Thread-Queueing und proaktive Absicherung gegen API-Abstürze. (Nur Enterprise/Admin)">
                    <button 
                      onClick={() => navigateTo('request-orchestrator')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'request-orchestrator' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <Cpu size={16} className={activeView === 'request-orchestrator' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                      <span>Request Orchestrator</span>
                    </button>
                  </SidebarTooltip>
                  )}

                  <SidebarTooltip title="Performance-Zentrale" text="D3.js-basierte Überwachung von Latenzzeiten, API-Effizienz des Asset Registries und Speicherauslastung.">
                    <button 
                      onClick={() => navigateTo('performance')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'performance' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <Gauge size={16} className={activeView === 'performance' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                      <span>Performance-Zentrale</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="Risiko-Assessment (VaR)" text="Mathematische Risiko-Simulationen (Variance-Covariance, Historisches Bootstrapping & Monte-Carlo) zur Bestimmung Deiner Portfoliorisiken.">
                    <button 
                      onClick={() => navigateTo('risiko-assessment')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'risiko-assessment' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <ShieldAlert size={16} className={activeView === 'risiko-assessment' ? 'text-black' : 'text-rose-500'} />
                      <span>Risiko-Assessment (VaR)</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="Abonnements & Tarife" text="Verwalte Deine Zahlungsmethoden und wähle den optimalen Tarif für Deine Investment-Bedürfnisse.">
                    <button 
                      onClick={() => navigateTo('abonnements')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'abonnements' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <CreditCard size={16} />
                      <span>Abonnements</span>
                    </button>
                  </SidebarTooltip>

                  <span className="text-[11px] uppercase tracking-widest text-white/65 font-mono px-3 block mt-4 mb-2">Rechtliches & Support</span>

                  <SidebarTooltip title="Datenschutz" text="Erfahre, wie wir Deine persönlichen Daten und Portfolio-Informationen nach DSGVO-Richtlinien schützen.">
                    <button 
                      onClick={() => navigateTo('datenschutz')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'datenschutz' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <Shield size={16} />
                      <span>Datenschutz</span>
                    </button>
                  </SidebarTooltip>

                  <SidebarTooltip title="Impressum & AGB" text="Rechtliche Informationen über das Unternehmen, Nutzungsbedingungen und Allgemeine Geschäftsbedingungen.">
                    <button 
                      onClick={() => navigateTo('impressum-agb')}
                      className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all ${
                        activeView === 'impressum-agb' 
                          ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                          : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
                      }`}
                    >
                      <Scale size={16} />
                      <span>Impressum & AGB</span>
                    </button>
                  </SidebarTooltip>
                </div>
              </div>

              {/* Drawer Footer Login & Logout buttons */}
              <div className="p-4 border-t border-white/10 bg-black/60 space-y-2">
                <button 
                  onClick={onLogout} 
                  className="w-full py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn size={14} className="text-aif-neon-cyan" />
                  <span>Konto wechseln</span>
                </button>
                <button 
                  onClick={onLogout} 
                  className="w-full py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={14} />
                  <span>Abmelden (Logout)</span>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Sticky Main Navigation */}
      <nav className="relative z-10 border-b border-aif-gold-DEFAULT/20 bg-black/70 backdrop-blur-xl sticky top-0 shadow-[0_4px_30px_rgba(245,196,83,0.15)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Elegant Hamburger menu button */}
            <button 
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:border-aif-gold-DEFAULT/45 text-white/90 hover:text-aif-gold-DEFAULT transition-all flex items-center justify-center gap-1 group shadow-[0_0_15px_rgba(255,255,255,0.05)]"
              aria-label="Hauptmenü öffnen"
            >
              <Menu size={20} className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-[11px] font-mono tracking-widest uppercase pr-1 font-bold">Menü</span>
            </button>

            {/* Logo and Brand */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all"
              >
                <AifCoreLogo size={44} showText={false} />
                <div className="flex flex-col items-start leading-none">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#F0D597] to-[#D4A017] font-display uppercase">AIF-CORE</span>
                    <ChevronDown size={16} className={`text-aif-gold-DEFAULT transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-white/70 font-mono tracking-widest uppercase">MODUL 1</span>
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 font-mono tracking-widest">
                      AKTIV
                    </span>
                  </div>
                </div>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-black/95 border border-aif-gold-DEFAULT/40 rounded-xl shadow-[0_0_40px_rgba(245,196,83,0.2)] backdrop-blur-2xl z-50 overflow-hidden">
                  <div className="p-5 border-b border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${profile.avatarColor} border border-white/20 flex items-center justify-center text-black font-black`}>
                        <ActiveAvatarIcon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white font-display">{profile.name}</p>
                        <p className="text-xs text-white/50 truncate max-w-[180px]">{profile.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => { setDropdownOpen(false); setActiveView('profil'); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <User size={16} className="text-aif-neon-cyan" /> Profil verwalten
                    </button>
                    <button 
                      onClick={() => { setDropdownOpen(false); setActiveView('abonnements'); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <CreditCard size={16} className="text-aif-gold-DEFAULT" /> Abonnements verwalten
                    </button>
                    <button 
                      onClick={() => { setDropdownOpen(false); setActiveView('datenschutz'); }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"
                    >
                      <Shield size={16} className="text-white/50" /> Datenschutz & DSGVO
                    </button>
                  </div>
                  <div className="p-2 border-t border-white/10 bg-black/50">
                    <button onClick={onLogout} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-3 transition-colors">
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Thread Activity Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Activity className="text-aif-neon-cyan animate-pulse" size={14} />
              <span className="text-[11px] font-mono text-white/80 tracking-widest uppercase">8 Worker-Threads / Parallel API-Querying</span>
            </div>
          </div>

          {/* Top right area cleaned of duplicate navigation buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {profile.subscriptionTier !== 'Enterprise' ? (
              <button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 text-black font-black text-[11px] sm:text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1 sm:gap-1.5 shadow-[0_0_15px_rgba(245,196,83,0.3)] cursor-pointer"
              >
                <Sparkles size={12} className="animate-pulse" />
                <span className="hidden sm:inline">Premium freischalten</span>
                <span className="sm:hidden">Premium</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>Enterprise Aktiv</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Breadcrumb Header for Inner Views */}
        {activeView !== 'dashboard' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-mono text-white/50">
              <span className="hover:text-white cursor-pointer uppercase tracking-wider font-bold" onClick={() => setActiveView('dashboard')}>AIF-CORE</span>
              <span>/</span>
              <span className="text-aif-gold-DEFAULT uppercase tracking-wider font-bold">
                {activeView === 'monte-carlo' && 'Monte Carlo Simulation'}
                {activeView === 'buffet-value' && 'Buffet Value Check'}
                {activeView === 'backtest' && 'Quantitative Backtest Engine'}
                {activeView === 'market-screener' && 'Profi Markt-Screener'}
                {activeView === 'abonnements' && 'Abonnements & Tarife'}
                {activeView === 'datenschutz' && 'Datenschutzbestimmungen'}
                {activeView === 'impressum-agb' && 'Impressum & AGB'}
                {activeView === 'profil' && 'Profilseite'}
                {activeView === 'markdown-orchestrator' && 'Markdown Orchestrator'}
                {activeView === 'interact' && 'Interact Workspace (Modul 2)'}
                {activeView === 'risiko-assessment' && 'Value-at-Risk Risiko-Zentrale'}
              </span>
            </div>
            
            <button
              onClick={() => setActiveView('dashboard')}
              className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Zurück zum Dashboard</span>
            </button>
          </div>
        )}

        {/* Dynamic Rendering of Active View */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-8"
          >
            {activeView === 'dashboard' && (
              <>
                {/* Top Row: Enterprise Crypto Scoring Module */}
                <CryptoScoringEnterprise 
                  selectedSymbol={selectedSymbol} 
                  onSelectSymbol={setSelectedSymbol} 
                  timeframe={timeframe} 
                  onChangeTimeframe={setTimeframe} 
                />

                {/* Middle Row: Enterprise Trading Evaluation Tool & AI-Newsfeed */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <CryptoEnterpriseEvaluator selectedSymbol={selectedSymbol} onSelectSymbol={setSelectedSymbol} />
                  </div>
                  <div className="space-y-6">
                    {/* Realtime AI-Newsfeed instead of Monte-Carlo Quick Card */}
                    <RealtimeAiNewsfeed 
                      subscriptionTier={profile.subscriptionTier} 
                      onUpgradeClick={() => navigateTo('abonnements')}
                      selectedSymbol={selectedSymbol}
                    />

                    {/* Strategie-Evidenz-Check Quick Card (Clickable to Buffett DCF check) */}
                    <div 
                      onClick={() => navigateTo('buffet-value')}
                      className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md cursor-pointer hover:border-aif-gold-DEFAULT/50 hover:shadow-[0_0_20px_rgba(245,196,83,0.1)] transition-all group"
                      title="Klicke für BuffettValueCheck Graham-DCF Rechner"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-sm font-medium text-white/80 font-display group-hover:text-aif-gold-light transition-colors">
                          Buffett-Value & DCF Check
                        </h3>
                        <span className="text-[11px] font-mono font-bold text-aif-gold-DEFAULT uppercase tracking-wider bg-aif-gold-DEFAULT/10 px-2 py-0.5 rounded">
                          Berechnen
                        </span>
                      </div>
                      <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-3 rounded-lg mb-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                        <ShieldCheck className="text-green-400 z-10" size={20} />
                        <div className="z-10">
                          <div className="text-xs text-white/60 uppercase font-mono">Status</div>
                          <div className="text-sm font-bold text-green-400 uppercase tracking-wide font-display drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">Verifiziert</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-white/50 mb-1 font-mono">Graham-Wert</div>
                          <div className="text-xl font-mono text-white font-bold text-aif-gold-DEFAULT">Aktiv</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/50 mb-1 font-mono">Modell</div>
                          <div className="text-xs font-mono text-white font-semibold">Benjamin Graham</div>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                        <span className="text-[11px] text-white/70 uppercase tracking-wider">Klicken für Rechner</span>
                        <span className="text-[11px] font-mono text-aif-gold-DEFAULT">Graham-Formel-Modell</span>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Bottom Row: AI Tools */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Newsticker selectedSymbol={selectedSymbol} timeframe={timeframe} />
                  <ImageAnalyzer triggerAttempt={triggerAttempt} />
                </div>
              </>
            )}

            {/* Detailed Views */}
            {activeView === 'monte-carlo' && (
              <MonteCarloDetailed selectedSymbol={selectedSymbol} triggerAttempt={triggerAttempt} />
            )}

            {activeView === 'buffet-value' && (
              <BuffetValueCheck selectedSymbol={selectedSymbol} triggerAttempt={triggerAttempt} />
            )}

            {activeView === 'backtest' && (
              <BacktestEngine selectedSymbol={selectedSymbol} userCapital={profile.capital} triggerAttempt={triggerAttempt} />
            )}

            {activeView === 'market-screener' && (
              <MarketScreener 
                onSelectSymbol={(sym) => {
                  setSelectedSymbol(sym);
                  navigateTo('dashboard');
                }}
                selectedSymbol={selectedSymbol}
                triggerAttempt={triggerAttempt}
              />
            )}

            {activeView === 'heatmap' && (
              <HeatmapCreator 
                subscriptionTier={profile.subscriptionTier}
                onUpgradeClick={() => navigateTo('abonnements')}
                triggerAttempt={triggerAttempt}
              />
            )}

            {activeView === 'abonnements' && (
              <Abonnements 
                currentTier={profile.subscriptionTier} 
                onUpdateTier={(tier) => setProfile(prev => ({ ...prev, subscriptionTier: tier }))} 
                email={profile.email}
              />
            )}

            {activeView === 'datenschutz' && (
              <Datenschutz />
            )}

            {activeView === 'impressum-agb' && (
              <ImpressumAgb />
            )}

            {activeView === 'profil' && (
              <ProfilePage 
                profile={profile} 
                onUpdateProfile={(newProfile) => setProfile(newProfile)} 
              />
            )}

            {activeView === 'markdown-orchestrator' && (
              <MarkdownOrchestrator />
            )}

            {activeView === 'request-orchestrator' && (profile.subscriptionTier === 'Enterprise' || profile.email === 'sven.kulessa@gmail.com') && (
              <OrchestratorPanel />
            )}

            {activeView === 'performance' && (
              <PerformanceDashboard />
            )}

            {activeView === 'risiko-assessment' && (
              <RealTimeRiskAssessment 
                userCapital={profile.capital}
                selectedSymbol={selectedSymbol}
                onSelectSymbol={setSelectedSymbol}
                triggerAttempt={triggerAttempt}
              />
            )}

            {activeView === 'interact' && (
              <InteractModule />
            )}

            {activeView === 'charts' && (
              <Charts 
                selectedSymbol={selectedSymbol} 
                onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <footer className="pt-8 pb-12 text-center border-t border-white/10 mt-12 px-6">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
            {/* Info Siegel: Version 0.5 Beta-Phase mit dem Logo versehen */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-aif-gold-DEFAULT/10 via-black/40 to-aif-gold-DEFAULT/5 border border-aif-gold-DEFAULT/20 rounded-2xl px-5 py-2.5 backdrop-blur-md shadow-[0_0_25px_rgba(245,196,83,0.08)] mb-4">
              <div className="flex items-center gap-2">
                <AifCoreLogo size={24} showText={false} />
                <span className="font-display font-black tracking-widest text-sm uppercase text-aif-gold-DEFAULT">AIF-CORE</span>
              </div>
              <span className="hidden sm:inline text-white/20">|</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-white/80 font-mono tracking-wider uppercase">
                  Sicherheitssiegel
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/30 tracking-wider font-mono">
                  Version 0.5 Beta-Phase
                </span>
              </div>
            </div>
            
            {/* Legal quick navigation shortcuts inside footer */}
            <div className="flex gap-4 text-[11px] font-mono text-white/40 mb-2">
              <button onClick={() => navigateTo('datenschutz')} className="hover:text-aif-gold-DEFAULT hover:underline transition-colors">Datenschutz</button>
              <span>•</span>
              <button onClick={() => navigateTo('impressum-agb')} className="hover:text-aif-gold-DEFAULT hover:underline transition-colors">Impressum</button>
              <span>•</span>
              <button onClick={() => navigateTo('impressum-agb')} className="hover:text-aif-gold-DEFAULT hover:underline transition-colors">AGB</button>
              <span>•</span>
              <button onClick={() => navigateTo('abonnements')} className="hover:text-aif-gold-DEFAULT hover:underline transition-colors">Abonnements</button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
              ⚠️ Keine Anlageberatung. AIFinancial zeigt ausschließlich quantitative Berechnungsmodelle und sentimentbasierte Live-Informationen – die Anlageentscheidung trifft immer der Nutzer selbst. Kapitalverlust ist möglich. MiFID II konforme Datenanalyse-Software.
            </p>
            <p className="text-[11px] font-mono text-white/60 uppercase tracking-widest mt-2">
              Strikte No-Demo-Data-Policy: Keine Interpolation unvollständiger Datenreihen.
            </p>
          </div>
        </footer>
      </main>

      <AnimatePresence>
        {isSubscriptionModalOpen && (
          <SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            currentTier={profile.subscriptionTier}
            onUpdateTier={(tier) => setProfile(prev => ({ ...prev, subscriptionTier: tier }))}
            email={profile.email}
          />
        )}
        {cliffhangerModalOpen && (
          <GuestCliffhangerModal
            isOpen={cliffhangerModalOpen}
            onClose={() => setCliffhangerModalOpen(false)}
            onRegister={onRegister}
            actionName={failedActionName}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
