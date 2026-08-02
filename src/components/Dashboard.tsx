import React, { useState } from 'react';
import { secureStorage } from '../lib/cryptoHelper';
import { Screener } from './Screener';
import { Newsticker } from './Newsticker';
import { UniverseBestWorst } from './UniverseBestWorst';
import { PortfolioPerformance } from './PortfolioPerformance';
import { ComplianceExporter } from './ComplianceExporter';
import { ImageAnalyzer } from './ImageAnalyzer';
import { CryptoEnterpriseEvaluator } from './CryptoEnterpriseEvaluator';
import { ProfilePage, UserProfile } from './ProfilePage';
import { BuffetValueCheck } from './BuffetValueCheck';
import { Abonnements } from './Abonnements';
import { SubscriptionModal } from './SubscriptionModal';
import { RealtimeAiNewsfeed } from './RealtimeAiNewsfeed';
import { Watchlist } from './Watchlist';
import { BacktestEngine } from './BacktestEngine';
import { HeatmapCreator } from './HeatmapCreator';
import { CapitalAiLogo } from './CapitalAiLogo';
import { MarketScreener } from './MarketScreener';
import { CryptoScoringEnterprise } from './CryptoScoringEnterprise';
import { UserSession } from '../App';
import { GuestCliffhangerModal } from './GuestCliffhangerModal';
import { AdminPortal } from './AdminPortal';
import { InteractModule } from './InteractModule';
import { Charts } from './Charts';
import { RealTimeRiskAssessment } from './RealTimeRiskAssessment';
import { PriceAlert } from './PriceAlert';
import { MarketSentiment } from './MarketSentiment';
import { SentimentDashboard } from './SentimentDashboard';
import { RawMaterialsDashboard } from './RawMaterialsDashboard';
import { SocialAccountManager } from './SocialAccountManager';
import { AssetUniverseDashboard } from './AssetUniverseDashboard';
import { SystemLatencyMonitor } from './SystemLatencyMonitor';
import { LandingPage } from './LandingPage';
import { DeFiOrchestration } from './DeFiOrchestration';

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
  Shield,
  Percent, 
  HelpCircle, 
  LogIn, 
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Compass,
  Layers,
  Flame,
  SlidersHorizontal,
  FileText,
  Orbit,
  BarChart3,
  Gauge,
  ShieldAlert,
  Bell,
  Video,
  Mail,
  Zap,
  FolderKanban,
  Eye,
  ArrowUpRight,
  Award,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  userSession: UserSession;
  onLogout: () => void;
  onRegister: (name: string, email: string) => void;
  onLoginEmail?: (email: string, password: string) => Promise<void>;
  onRegisterEmail?: (name: string, email: string, password: string) => Promise<void>;
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

export function Dashboard({ userSession, onLogout, onRegister, onLoginEmail, onRegisterEmail }: DashboardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<string>('1std');
  const [activeView, setActiveView] = useState<'dashboard' | 'myworkspace' | 'universe-scoring' | 'buffet-value' | 'backtest' | 'heatmap' | 'market-screener' | 'abonnements' | 'profil' | 'markdown-orchestrator' | 'interact' | 'charts' | 'request-orchestrator' | 'performance' | 'risiko-assessment' | 'admin-panel' | 'preis-alarme' | 'audit-logs' | 'sentiment-dashboard' | 'raw-materials' | 'asset-universe' | 'defi-orchestration' | 'social-accounts' | 'login' | 'auth-debugger' | 'admin-portal'>('dashboard');
  const [adminTab, setAdminTab] = useState<'users' | 'auth' | 'markdown' | 'requests' | 'performance' | 'logs' | 'hygiene' | 'supervisor' | 'compliance'>('users');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('hub');
  const [expandedUniverse, setExpandedUniverse] = useState<string | null>(null);

  // Auto-expand appropriate accordion section on activeView changes for best mobile/desktop experience
  React.useEffect(() => {
    const getViewCategory = (view: string) => {
      if (['dashboard', 'myworkspace', 'universe-scoring', 'abonnements', 'profil'].includes(view)) return 'hub';
      if (['market-screener', 'charts', 'preis-alarme', 'buffet-value', 'backtest', 'heatmap', 'risiko-assessment', 'sentiment-dashboard', 'raw-materials', 'asset-universe'].includes(view)) return 'analysis';
      if (['admin-panel', 'auth-debugger', 'markdown-orchestrator', 'request-orchestrator', 'performance', 'audit-logs', 'admin-portal'].includes(view)) return 'system_admin';
      return 'hub';
    };
    setExpandedSection(getViewCategory(activeView));
  }, [activeView]);

  // Switch to dashboard view automatically when user becomes registered
  React.useEffect(() => {
    if (userSession.type === 'registered' && activeView === 'login') {
      setActiveView('dashboard');
    }
  }, [userSession.type, activeView]);

  // Guest limitations state
  const [attempts, setAttempts] = useState<number>(0);
  const [cliffhangerModalOpen, setCliffhangerModalOpen] = useState(false);
  const [failedActionName, setFailedActionName] = useState('');

  // Watchlist state & persistent logic
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('capital_ai_watchlist');
      return saved ? JSON.parse(saved) : ['BTC', 'ETH', 'TSLA', 'AAPL', 'EURUSD'];
    } catch {
      return ['BTC', 'ETH', 'TSLA', 'AAPL', 'EURUSD'];
    }
  });

  React.useEffect(() => {
    localStorage.setItem('capital_ai_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Push notifications queue
  interface PushNotification {
    id: string;
    symbol: string;
    name: string;
    score: number;
    oldScore: number;
    headline: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    impact: 'high' | 'medium' | 'low';
    isOnWatchlist: boolean;
    timestamp: string;
    type: string;
  }
  const [pushNotifications, setPushNotifications] = useState<PushNotification[]>([]);

  // Sound chime synthesizer (disabled per site settings)
  const playPushNotificationSound = () => {
    // Töne & Sound deaktiviert
    return;
  };

  // Push Notification trigger
  const triggerPushNotification = React.useCallback((data: Omit<PushNotification, 'id' | 'timestamp'>) => {
    const id = `push-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const newNotif: PushNotification = {
      ...data,
      id,
      timestamp
    };

    setPushNotifications(prev => [newNotif, ...prev].slice(0, 5)); // Keep last 5 notifications in state queue
    playPushNotificationSound();

    // Auto dismiss notification after 8 seconds
    setTimeout(() => {
      setPushNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  }, [watchlist]);

  // ARCH-AUDIT-0004 / AUD4-F-003: produktive Test-Score-Fabrikation ist deaktiviert.
  // Testevents dürfen keine erfundenen Finanzscores oder Marktbewegungen erzeugen.
  const handleTriggerTestScoreEvent = (_symbol: string, _type: 'crash' | 'rally') => {
    console.warn('Synthetic score test events are disabled in production. Use verified screening evidence instead.');
  };

  // Unified global persistent user profile
  const [profile, setProfile] = useState<UserProfile>({
    name: userSession.name,
    email: userSession.email,
    avatarId: '1',
    avatarColor: 'from-aif-gold-DEFAULT to-aif-gold-dark',
    preferredAssetClass: 'Crypto',
    riskProfile: 'Ausgewogen',
    capital: 150000,
    subscriptionTier: userSession.type === 'guest' ? 'Free' : userSession.subscriptionTier,
    id: userSession.id
  });

  // Synchronize profile state with userSession prop and load encrypted cached profile if database is offline
  React.useEffect(() => {
    const loadSecureProfile = async () => {
      if (userSession && userSession.email) {
        try {
          const pass = userSession.email + '_aif_secure_passcode';
          const savedStr = await secureStorage.getItem('aif_encrypted_user_profile', pass);
          if (savedStr) {
            const parsed = JSON.parse(savedStr);
            setProfile({ ...parsed, id: userSession.id });
            return;
          }
        } catch (e) {
          console.error('Failed to decrypt local secure profile:', e);
        }

        // Fallback to prop sync if no secure cache existed yet
        setProfile(prev => ({
          ...prev,
          name: userSession.name,
          email: userSession.email,
          subscriptionTier: userSession.type === 'guest' ? 'Free' : userSession.subscriptionTier,
          id: userSession.id
        }));
      }
    };
    loadSecureProfile();
  }, [userSession]);

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (userSession && userSession.email) {
      try {
        const pass = userSession.email + '_aif_secure_passcode';
        await secureStorage.setItem('aif_encrypted_user_profile', JSON.stringify(newProfile), pass);
      } catch (e) {
        console.error('Failed to encrypt and save secure profile:', e);
      }
    }
  };

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

    // 2. Fetch/sync latest persistent tier from backend webhook storage on mount
    if (profile.email) {
      fetch(`/api/stripe/user-subscription?email=${encodeURIComponent(profile.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.subscriptionTier && data.subscriptionTier !== profile.subscriptionTier) {
            setProfile(prev => ({ ...prev, subscriptionTier: data.subscriptionTier }));
          }
        })
        .catch(err => console.error("Error syncing subscription tier with server:", err));
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

  const renderTierBadge = (tier: string) => {
    let classes = "";
    switch (tier) {
      case "Enterprise":
        classes = "bg-[#F0D597]/15 text-[#F0D597] border-[#F0D597]/30 shadow-[0_0_8px_rgba(240,213,151,0.25)]";
        break;
      case "Pro":
        classes = "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.25)]";
        break;
      case "Starter":
        classes = "bg-violet-500/15 text-violet-400 border-violet-500/30 shadow-[0_0_8px_rgba(139,92,246,0.25)]";
        break;
      default:
        classes = "bg-white/5 text-white/50 border-white/10";
    }
    return (
      <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest rounded border ${classes} inline-flex items-center justify-center shrink-0`}>
        {tier}
      </span>
    );
  };

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
              className="fixed top-0 bottom-0 left-0 w-full sm:w-80 bg-black/95 border-r border-white/10 shadow-[0_0_50px_rgba(245,196,83,0.15)] z-50 flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-white/10"
            >
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {/* Drawer Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CapitalAiLogo size={40} showText={false} />
                    <div className="flex flex-col items-start leading-none">
                      <span className="font-black text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#F0D597] to-[#D4A017] font-display uppercase">Capital-AI</span>
                      <span className="text-[11px] text-white/50 font-mono tracking-widest uppercase mt-0.5">PRODUCTION RELEASE</span>
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
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center shadow-[0_0_15px_rgba(245,196,83,0.2)] group-hover:scale-105 transition-all overflow-hidden`}>
                    {profile.customAvatarUrl ? (
                      <img src={profile.customAvatarUrl} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ActiveAvatarIcon className="w-6 h-6 text-black" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs text-aif-gold-DEFAULT font-mono uppercase tracking-widest font-black flex items-center gap-1">
                      {profile.subscriptionTier}
                    </div>
                    <h4 className="text-sm font-bold text-white truncate font-display group-hover:text-aif-gold-light transition-colors flex items-center gap-2">
                      <span className="truncate">{profile.name}</span>
                      {renderTierBadge(profile.subscriptionTier)}
                    </h4>
                    <p className="text-[11px] text-white/70 truncate font-mono">
                      {profile.email}
                    </p>
                  </div>
                </div>

                {/* Navigation Items with Premium Vertical Accordion */}
                <div className="p-4 space-y-3">
                  {/* Category 1: Hauptzentrale */}
                  <div className="border-b border-white/5 pb-2">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'hub' ? null : 'hub')}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-white/80 hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
                      aria-expanded={expandedSection === 'hub'}
                      aria-controls="nav-sec-hub"
                    >
                      <div className="flex items-center gap-2.5">
                        <Orbit size={14} className="text-aif-gold-DEFAULT group-hover:rotate-45 transition-transform" />
                        <span>Hauptzentrale</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === 'hub' ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={14} className="text-white/40 group-hover:text-white/80" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedSection === 'hub' && (
                        <motion.div
                          id="nav-sec-hub"
                          role="region"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden mt-1 px-1 space-y-1"
                        >
                          <SidebarTooltip title="Dashboard Home" text="Bietet eine Gesamtübersicht des Portfolios, aktuelle Markttrends, KI-Analysen und die wichtigsten Kennzahlen auf einen Blick.">
                            <button 
                              onClick={() => navigateTo('dashboard')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'dashboard' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <LayoutDashboard size={14} />
                              <span>Dashboard Home</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Myworkspace" text="Dein persönlicher Arbeitsbereich mit individuellem Radar, Watchlist-Analyse und benutzerdefinierten Asset-Monitoren.">
                            <button 
                              onClick={() => navigateTo('myworkspace')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'myworkspace' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <FolderKanban size={14} className={activeView === 'myworkspace' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>Myworkspace</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Best & Worst Scoring" text="Live-Performance-Leaderboards & Top 3 / Flop 3 Grafik-Analysen aller 5 quantitativen Handelsuniversen.">
                            <button 
                              onClick={() => navigateTo('universe-scoring')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'universe-scoring' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <Award size={14} className={activeView === 'universe-scoring' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>Best & Worst Assets</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Abonnements & Tarife" text="Verwalte Deine Zahlungsmethoden und wähle den optimalen Tarif für Deine Investment-Bedürfnisse.">
                            <button 
                              onClick={() => navigateTo('abonnements')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'abonnements' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <CreditCard size={14} />
                              <span>Abonnements</span>
                            </button>
                          </SidebarTooltip>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category 2: Analysetools & Screening */}
                  <div className="border-b border-white/5 pb-2">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'analysis' ? null : 'analysis')}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-white/80 hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
                      aria-expanded={expandedSection === 'analysis'}
                      aria-controls="nav-sec-analysis"
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingUp size={14} className="text-aif-gold-DEFAULT group-hover:scale-110 transition-transform" />
                        <span>Analysetools</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === 'analysis' ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={14} className="text-white/40 group-hover:text-white/80" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedSection === 'analysis' && (
                        <motion.div
                          id="nav-sec-analysis"
                          role="region"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden mt-1 px-1 space-y-1"
                        >
                          <SidebarTooltip title="Multi-Asset Universum" text="Institutionelles Cockpit für Kryptowährungen, Aktien, Indizes, Rohstoffe und Forex.">
                            <button 
                              onClick={() => navigateTo('asset-universe')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'asset-universe' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <Sparkles size={14} className={activeView === 'asset-universe' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>Multi-Asset Universum</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Profi Markt-Screener" text="Filtere hunderte von Aktien und Kryptowährungen nach komplexen Kriterien wie KGV, Dividenden, KI-Scores und Graham-Formeln.">
                            <button 
                              onClick={() => navigateTo('market-screener')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'market-screener' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <SlidersHorizontal size={14} className={activeView === 'market-screener' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>Profi Markt-Screener</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Ad-Hoc Charts & Indikatoren" text="Echtzeit-Preischarts mit gleitenden Durchschnitten (SMA/EMA), RSI, MACD, Bollinger-Bändern und ad-hoc KI-Agent-Scoring.">
                            <button 
                              onClick={() => navigateTo('charts')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'charts' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <BarChart3 size={14} className={activeView === 'charts' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>Ad-Hoc Charts</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Echtzeit Preis-Alarme" text="Richte intelligente Benachrichtigungs-Schwellen für Krypto, Aktien, Rohstoffe und Forex ein mit interaktivem Echtzeit-Preissimulator.">
                            <button 
                              onClick={() => navigateTo('preis-alarme')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'preis-alarme' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <Bell size={14} className={activeView === 'preis-alarme' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>Preis-Alarme</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Buffet Value Check" text="Bewertet Aktien nach den zeitlosen Kriterien der Value-Investing-Legende Warren Buffett und berechnet den fairen inneren Wert.">
                            <button 
                              onClick={() => navigateTo('buffet-value')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'buffet-value' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <Percent size={14} />
                              <span>BuffetValueCheck</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Backtest Engine" text="Teste historische Handelsstrategien (wie gleitende Durchschnitte) an vergangenen Daten, um zu sehen, wie profitabel sie gewesen wären.">
                            <button 
                              onClick={() => navigateTo('backtest')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'backtest' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <TrendingUp size={14} className={activeView === 'backtest' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>Backtest Engine</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="AI Markt-Sentiment" text="Ausführlicher Sentiment-Cockpit mit Echtzeit-Nachrichtenrecherche über Google Search Grounding und interaktivem Risiko-Simulation-Sandbox.">
                            <button 
                              onClick={() => navigateTo('sentiment-dashboard')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'sentiment-dashboard' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <Gauge size={14} className={activeView === 'sentiment-dashboard' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>AI Markt-Sentiment</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Rohstoff-Bewertung" text="Analysiere, kategorisiere und bewerte physische & kritische Rohstoffe nach geopolitischen Risiken, Fundamentaldaten und strategischer Bedeutung.">
                            <button 
                              onClick={() => navigateTo('raw-materials')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'raw-materials' 
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <Orbit size={14} className={activeView === 'raw-materials' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>Rohstoff-Bewertung</span>
                            </button>
                          </SidebarTooltip>

                          <SidebarTooltip title="Social Media Accounts" text="Verknüpfe YouTube, TikTok, Instagram, X und Facebook per OAuth 2.0 für Direct Publishing und Terminierung (ADR-0020).">
                            <button
                              onClick={() => navigateTo('social-accounts')}
                              className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                activeView === 'social-accounts'
                                  ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]'
                                  : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
                              }`}
                            >
                              <Share2 size={14} className={activeView === 'social-accounts' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                              <span>Social Media Accounts</span>
                            </button>
                          </SidebarTooltip>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Category 2.5: Asset-Universen (Enterprise) */}
                  <div className="border-b border-white/5 pb-2">
                    <button
                      onClick={() => setExpandedSection(expandedSection === 'universes' ? null : 'universes')}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-white/80 hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
                      aria-expanded={expandedSection === 'universes'}
                    >
                      <div className="flex items-center gap-2.5">
                        <Compass size={14} className="text-aif-gold-DEFAULT group-hover:rotate-45 transition-transform" />
                        <span>Asset-Universen</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedSection === 'universes' ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={14} className="text-white/40 group-hover:text-white/80" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedSection === 'universes' && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden mt-1 px-1 space-y-2 pl-2 border-l border-white/5"
                        >
                                    {/* Universe 1: Equities */}
                          <div className="space-y-1">
                            <button
                              onClick={() => setExpandedUniverse(expandedUniverse === 'equities' ? null : 'equities')}
                              className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-cyan-400 hover:text-white transition-all rounded-md bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <TrendingUp size={12} className="text-cyan-400" />
                                <span>Equities</span>
                              </div>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${expandedUniverse === 'equities' ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedUniverse === 'equities' && (
                              <div className="pl-2 py-1 space-y-1 bg-black/40 rounded-lg border border-white/5">
                                <button 
                                  onClick={() => { setSelectedSymbol('AAPL'); setCategoryFilter('stock'); navigateTo('sentiment-dashboard'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">1. Sentiment Analysis</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Echtzeit KI-News Sentiment (AAPL)</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('AAPL'); setCategoryFilter('stock'); navigateTo('buffet-value'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">2. Graham Valuation</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Graham Fair Value &amp; DCF Analyse</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('AAPL'); setCategoryFilter('stock'); navigateTo('risiko-assessment'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">3. Risk Assessment</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Stress-Testing &amp; Value-at-Risk</div>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Universe 2: Forex */}
                          <div className="space-y-1">
                            <button
                              onClick={() => setExpandedUniverse(expandedUniverse === 'forex' ? null : 'forex')}
                              className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-400 hover:text-white transition-all rounded-md bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Activity size={12} className="text-amber-400" />
                                <span>Forex</span>
                              </div>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${expandedUniverse === 'forex' ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedUniverse === 'forex' && (
                              <div className="pl-2 py-1 space-y-1 bg-black/40 rounded-lg border border-white/5">
                                <button 
                                  onClick={() => { setSelectedSymbol('EURUSD'); setCategoryFilter('forex'); navigateTo('sentiment-dashboard'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">1. Sentiment Analysis</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Geopolitisches News-Sentiment (EURUSD)</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('EURUSD'); setCategoryFilter('forex'); navigateTo('buffet-value'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">2. Graham Valuation</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Makro- &amp; Zinsparitäten Fair Value</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('EURUSD'); setCategoryFilter('forex'); navigateTo('risiko-assessment'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">3. Risk Assessment</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Stress-Testing &amp; Value-at-Risk</div>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Universe 3: Crypto */}
                          <div className="space-y-1">
                            <button
                              onClick={() => setExpandedUniverse(expandedUniverse === 'crypto' ? null : 'crypto')}
                              className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-purple-400 hover:text-white transition-all rounded-md bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Orbit size={12} className="animate-spin-slow text-purple-400" />
                                <span>Crypto</span>
                              </div>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${expandedUniverse === 'crypto' ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedUniverse === 'crypto' && (
                              <div className="pl-2 py-1 space-y-1 bg-black/40 rounded-lg border border-white/5">
                                <button 
                                  onClick={() => { setSelectedSymbol('BTC'); setCategoryFilter('crypto'); navigateTo('sentiment-dashboard'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">1. Sentiment Analysis</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Echtzeit News &amp; Social Sentiment (BTC)</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('BTC'); setCategoryFilter('crypto'); navigateTo('buffet-value'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">2. Graham Valuation</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Network Value / Fair Value Analyse</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('BTC'); setCategoryFilter('crypto'); navigateTo('risiko-assessment'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">3. Risk Assessment</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Stress-Testing &amp; Value-at-Risk</div>
                                </button>

                                {/* DeFi subcategory section */}
                                <div className="border-t border-white/5 mt-1 pt-1.5 space-y-1">
                                  <div className="text-[9px] font-mono text-purple-400 font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                    <span>DeFi Kategorie</span>
                                  </div>
                                  <button 
                                    onClick={() => { setSelectedSymbol('AAVE'); setCategoryFilter('crypto'); navigateTo('defi-orchestration'); setMenuOpen(false); }}
                                    className={`w-full text-left p-2 hover:bg-purple-500/10 rounded text-[10px] transition-all cursor-pointer ${activeView === 'defi-orchestration' ? 'bg-purple-500/10 text-white border-l border-purple-500' : 'text-white/70 hover:text-white'}`}
                                  >
                                    <div className="font-bold uppercase tracking-wide text-purple-300 flex items-center gap-1">
                                      <Zap size={10} className="text-purple-400 animate-bounce" />
                                      <span>DeFi Orchestration</span>
                                    </div>
                                    <div className="text-[9px] text-white/40 font-mono mt-0.5">Liquidity depth &amp; IL Radar</div>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Universe 4: Commodities */}
                          <div className="space-y-1">
                            <button
                              onClick={() => setExpandedUniverse(expandedUniverse === 'commodity' ? null : 'commodity')}
                              className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-rose-400 hover:text-white transition-all rounded-md bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Layers size={12} className="text-rose-400" />
                                <span>Commodities</span>
                              </div>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${expandedUniverse === 'commodity' ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedUniverse === 'commodity' && (
                              <div className="pl-2 py-1 space-y-1 bg-black/40 rounded-lg border border-white/5">
                                <button 
                                  onClick={() => { setSelectedSymbol('GLD'); setCategoryFilter('commodity'); navigateTo('sentiment-dashboard'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all cursor-pointer"
                                    >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">1. Sentiment Analysis</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Supply-Chain &amp; Markt-News Sentiment</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('GLD'); setCategoryFilter('commodity'); navigateTo('buffet-value'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">2. Graham Valuation</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Rohstoff-Kritikalitäts &amp; Wertungsindex</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('GLD'); setCategoryFilter('commodity'); navigateTo('risiko-assessment'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">3. Risk Assessment</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Stress-Testing &amp; Value-at-Risk</div>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Universe 5: Bonds */}
                          <div className="space-y-1">
                            <button
                              onClick={() => setExpandedUniverse(expandedUniverse === 'bond' ? null : 'bond')}
                              className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-emerald-400 hover:text-white transition-all rounded-md bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <Percent size={12} className="text-emerald-400" />
                                <span>Bonds</span>
                              </div>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${expandedUniverse === 'bond' ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedUniverse === 'bond' && (
                              <div className="pl-2 py-1 space-y-1 bg-black/40 rounded-lg border border-white/5">
                                <button 
                                  onClick={() => { setSelectedSymbol('US10Y'); setCategoryFilter('bond'); navigateTo('sentiment-dashboard'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">1. Sentiment Analysis</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Notenbankentscheide &amp; Zins-News Sentiment</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('US10Y'); setCategoryFilter('bond'); navigateTo('buffet-value'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">2. Graham Valuation</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Renditekurven &amp; Fair Yield Bewertung</div>
                                </button>
                                <button 
                                  onClick={() => { setSelectedSymbol('US10Y'); setCategoryFilter('bond'); navigateTo('risiko-assessment'); setMenuOpen(false); }}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all border-t border-white/5 cursor-pointer"
                                >
                                  <div className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT">3. Risk Assessment</div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">Stress-Testing &amp; Value-at-Risk</div>
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>




                  {/* Category 5: Admin-Portal (if user is Sven Kulessa) */}
                  {(profile.email === 'sven.kulessa@gmail.com' || profile.email === 'sven.kulessa@gmx.net') && (
                    <div className="border-b border-white/5 pb-2">
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'system_admin' ? null : 'system_admin')}
                        className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-aif-gold-DEFAULT hover:text-white transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg"
                        aria-expanded={expandedSection === 'system_admin'}
                        aria-controls="nav-sec-admin"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert size={14} className="text-aif-gold-DEFAULT group-hover:animate-bounce" />
                          <span>Admin-Portal</span>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedSection === 'system_admin' ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown size={14} className="text-aif-gold-DEFAULT/40 group-hover:text-aif-gold-DEFAULT/85" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSection === 'system_admin' && (
                          <motion.div
                            id="nav-sec-admin"
                            role="region"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden mt-1 px-1 space-y-1"
                          >
                            <SidebarTooltip title="Admin-Zentrale" text="Exklusive Steuerzentrale für Sven Kulessa: Überwache Latenzstatistiken, plane das Investoren-Abo und verwalte Benutzer.">
                              <button 
                                onClick={() => { setActiveView('admin-portal'); setAdminTab('users'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                  activeView === 'admin-portal' && adminTab === 'users'
                                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                    : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                                }`}
                              >
                                <ShieldAlert size={14} className={activeView === 'admin-portal' && adminTab === 'users' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                                <span>Admin-Zentrale</span>
                              </button>
                            </SidebarTooltip>

                            <SidebarTooltip title="Auth State Debugger" text="Überwache Live-Authentifizierungstokens, Benutzer-Sitzungen und verschlüsselte lokale Speicher-Pipelines.">
                              <button 
                                onClick={() => { setActiveView('admin-portal'); setAdminTab('auth'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                  activeView === 'admin-portal' && adminTab === 'auth'
                                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                    : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                                }`}
                              >
                                <Activity size={14} className={activeView === 'admin-portal' && adminTab === 'auth' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                                <span>Auth State Debugger</span>
                              </button>
                            </SidebarTooltip>

                            <SidebarTooltip title="Markdown Orchestrator" text="Ein intelligenter Multi-Perspektiven Dokumenten-Generator, der professionelle Berichte (CEO, Security, QA, Frontend, Backend) direkt auf Codebasis erstellt.">
                              <button 
                                onClick={() => { setActiveView('admin-portal'); setAdminTab('markdown'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                  activeView === 'admin-portal' && adminTab === 'markdown'
                                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                    : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                                }`}
                              >
                                <FileText size={14} className={activeView === 'admin-portal' && adminTab === 'markdown' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                                <span>Markdown Orchestrator</span>
                              </button>
                            </SidebarTooltip>

                            <SidebarTooltip title="Request Orchestrator" text="Live Telemetrie-Überwachung des Server-Datenstroms, asynchrones Thread-Queueing und proaktive Absicherung gegen API-Abstürze.">
                              <button 
                                onClick={() => { setActiveView('admin-portal'); setAdminTab('requests'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                  activeView === 'admin-portal' && adminTab === 'requests'
                                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                    : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                                }`}
                              >
                                <Cpu size={14} className={activeView === 'admin-portal' && adminTab === 'requests' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                                <span>Request Orchestrator</span>
                              </button>
                            </SidebarTooltip>

                            <SidebarTooltip title="Performance-Zentrale" text="D3.js-basierte Überwachung von Latenzzeiten, API-Effizienz des Asset Registries und Speicherauslastung.">
                              <button 
                                onClick={() => { setActiveView('admin-portal'); setAdminTab('performance'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                  activeView === 'admin-portal' && adminTab === 'performance'
                                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                    : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                                }`}
                              >
                                <Gauge size={14} className={activeView === 'admin-portal' && adminTab === 'performance' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                                <span>Performance-Zentrale</span>
                              </button>
                            </SidebarTooltip>

                            <SidebarTooltip title="Audit-Trail & Logs" text="Lückenlose Rückverfolgbarkeit aller automatisierten Hintergrundprozesse, quantitative Konformitätsberichte und kryptografische Integritätsprüfungen.">
                              <button 
                                onClick={() => { setActiveView('admin-portal'); setAdminTab('logs'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                  activeView === 'admin-portal' && adminTab === 'logs'
                                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                    : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                                }`}
                              >
                                <ShieldCheck size={14} className={activeView === 'admin-portal' && adminTab === 'logs' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                                <span>Audit-Trail & Logs</span>
                              </button>
                            </SidebarTooltip>

                            <SidebarTooltip title="Capital-AI Documentary" text="Autonome KI-gestützte Dokumentenpflege, Änderungs-Klassifizierung, semantische Synchronisation und revisionssicherer Rollback-Manager. Verwaltet durch Gründer Sven Kulessa (sven.kulessa@capital-ai.online).">
                              <button 
                                onClick={() => { setActiveView('admin-portal'); setAdminTab('hygiene'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                  activeView === 'admin-portal' && adminTab === 'hygiene'
                                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                    : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                                }`}
                              >
                                <Sparkles size={14} className={activeView === 'admin-portal' && adminTab === 'hygiene' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                                <span>Capital-AI Documentary</span>
                              </button>
                            </SidebarTooltip>

                            <SidebarTooltip title="Capital-AI Supervisor" text="Zentralisierte Echtzeit-Überwachung aller Plattformkomponenten. Visualisiert Latenzen, LLM-Routen, Circuit Breaker und Container-Ressourcen der Live-Plattform.">
                              <button 
                                onClick={() => { setActiveView('admin-portal'); setAdminTab('supervisor'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                  activeView === 'admin-portal' && adminTab === 'supervisor'
                                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                    : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                                }`}
                              >
                                <Shield size={14} className={activeView === 'admin-portal' && adminTab === 'supervisor' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                                <span>Capital-AI Supervisor</span>
                              </button>
                            </SidebarTooltip>

                            <SidebarTooltip title="Compliance Auditor" text="Regulatorische BaFin- und DSGVO-Compliance-Prüfung. Führt 21 automatisierte Quellcode- und Konfigurationsscans durch.">
                              <button 
                                onClick={() => { setActiveView('admin-portal'); setAdminTab('compliance'); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                                  activeView === 'admin-portal' && adminTab === 'compliance'
                                    ? 'bg-aif-gold-DEFAULT text-black font-black border-aif-gold-DEFAULT shadow-[0_0_15px_rgba(245,196,83,0.25)]' 
                                    : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                                }`}
                              >
                                <ShieldCheck size={14} className={activeView === 'admin-portal' && adminTab === 'compliance' ? 'text-black' : 'text-aif-gold-DEFAULT'} />
                                <span>Compliance Auditor</span>
                              </button>
                            </SidebarTooltip>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Login & Logout buttons */}
              <div className="p-4 border-t border-white/10 bg-black/60 space-y-2">
                {userSession.type === 'guest' ? (
                  <button 
                    onClick={() => { setActiveView('login'); setMenuOpen(false); }} 
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark hover:from-aif-gold-light hover:to-aif-gold-DEFAULT text-black font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,196,83,0.35)] hover:shadow-[0_0_30px_rgba(245,196,83,0.55)] scale-100 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LogIn size={15} className="stroke-[3px]" />
                    <span>Login (Anmelden)</span>
                  </button>
                ) : (
                  <>
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
                  </>
                )}
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
              <div 
                className="flex items-center gap-3 p-2 rounded-xl"
              >
                <CapitalAiLogo size={44} showText={false} />
                <div className="flex flex-col items-start leading-none">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#F0D597] to-[#D4A017] font-display uppercase">Capital-AI</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[11px] text-white/50 font-mono tracking-widest uppercase">PRODUCTION RELEASE</span>
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 font-mono tracking-widest">
                      AKTIV
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Thread Activity Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Activity className="text-aif-neon-cyan animate-pulse" size={14} />
              <span className="text-[11px] font-mono text-white/80 tracking-widest uppercase">8 Worker-Threads / Parallel API-Querying</span>
            </div>
          </div>

          {/* Top right area cleaned of duplicate navigation buttons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Global Support E-Mail Link */}
            <a 
              href="mailto:support@capital-ai.online" 
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-xs font-mono text-white/70 hover:text-white transition-all"
              title="Support per E-Mail kontaktieren"
            >
              <Mail size={12} className="text-aif-gold-DEFAULT" />
              <span>support@capital-ai.online</span>
            </a>

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
              <span className="hover:text-white cursor-pointer uppercase tracking-wider font-bold" onClick={() => setActiveView('dashboard')}>Capital-AI</span>
              <span>/</span>
              <span className="text-aif-gold-DEFAULT uppercase tracking-wider font-bold">
                {activeView === 'myworkspace' && 'Myworkspace – Persönlicher Radar'}
                {activeView === 'universe-scoring' && 'Universum Best & Worst Asset Leaderboard'}
                {activeView === 'raw-materials' && 'Rohstoff-Kategorisierung & AI-Scoring'}
                {activeView === 'social-accounts' && 'Social Media Direct Publishing Hub'}
                {activeView === 'asset-universe' && 'Multi-Asset-Klassen Cockpit'}
                {activeView === 'defi-orchestration' && 'DeFi Token Orchestration & IL Radar'}
                {activeView === 'buffet-value' && 'Buffet Value Check'}
                {activeView === 'backtest' && 'Quantitative Backtest Engine'}
                {activeView === 'market-screener' && 'Profi Markt-Screener'}
                {activeView === 'abonnements' && 'Abonnements & Tarife'}
                {activeView === 'profil' && 'Profilseite'}
                {activeView === 'admin-portal' && 'Admin-Portal & DevOps-Zentrale'}
                {activeView === 'interact' && 'Interact Workspace (Modul 2)'}
                {activeView === 'risiko-assessment' && 'Value-at-Risk Risiko-Zentrale'}
                {activeView === 'preis-alarme' && 'Echtzeit Preis-Alarme & Push-Simulation'}
                {activeView === 'sentiment-dashboard' && 'AI Markt-Sentiment Cockpit & Sandbox'}
                {activeView === 'login' && 'System-Anmeldung (Capital-AI Login)'}
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
                  {/* Top Row: Universe Enterprise Scorer with all elements */}
                  <CryptoScoringEnterprise 
                     selectedSymbol={selectedSymbol} 
                     onSelectSymbol={setSelectedSymbol} 
                     timeframe={timeframe} 
                     onChangeTimeframe={setTimeframe} 
                     userSession={userSession}
                     subscriptionTier={profile.subscriptionTier}
                     onUpgradeClick={() => navigateTo('abonnements')}
                  />

                  {/* Free & Guest User Upgrade Banner & Support Link */}
                  {(profile.subscriptionTier === 'Free' || userSession?.type === 'guest') && (
                    <div className="bg-gradient-to-br from-amber-950/40 via-black to-blue-950/40 border border-aif-gold-DEFAULT/40 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-[0_10px_40px_rgba(245,196,83,0.15)] my-6">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-3 max-w-2xl text-left">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aif-gold-DEFAULT/15 border border-aif-gold-DEFAULT/30 text-aif-gold-DEFAULT font-mono text-xs font-bold uppercase tracking-wider">
                            <Sparkles size={14} className="animate-spin" />
                            <span>Free &amp; Gast Modus – Limitierte Vorschau</span>
                          </div>
                          <h3 className="text-xl sm:text-2xl font-black text-white font-display">
                            Schalten Sie das volle CAPITAL-AI Potenzial frei
                          </h3>
                          <p className="text-xs sm:text-sm text-white/70 font-mono leading-relaxed">
                            Als Gast- oder Free-Nutzer sehen Sie exklusiv das <strong className="text-white">BTC Enterprise Scoring Ergebnis</strong>. Für den Zugriff auf weitere Website-Inhalte, den Realtime AI-Newsfeed, Backtesting, Heatmaps und unbegrenztes Screening wählen Sie ein höheres Abonnement.
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/60 pt-1">
                            <span>✓ Starter (7€/m): Max 3 Assets</span>
                            <span>✓ Pro (29€/m): Realtime AI Newsfeed</span>
                            <span>✓ Enterprise (109€/m): BaFin PDF Exports</span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                          <button
                            onClick={() => navigateTo('abonnements')}
                            className="px-6 py-3 bg-gradient-to-r from-aif-gold-DEFAULT via-amber-400 to-aif-gold-DEFAULT text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(245,196,83,0.4)] hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Zap size={16} />
                            <span>Abonnement Upgraden</span>
                          </button>
                          <a
                            href="mailto:support@capital-ai.online"
                            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs font-mono rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Mail size={14} className="text-aif-gold-DEFAULT" />
                            <span>support@capital-ai.online</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Realtime AI-Newsfeed Full Width */}
                  <div className="w-full">
                    <RealtimeAiNewsfeed 
                      subscriptionTier={profile.subscriptionTier} 
                      onUpgradeClick={() => navigateTo('abonnements')}
                      onTriggerPushNotification={triggerPushNotification}
                      watchlist={watchlist}
                      maxDisplayItems={3}
                      selectedSymbol={selectedSymbol}
                    />
                  </div>

                  {/* Portfolio Performance Zentrale (Vorerst deaktiviert - wird zu einem späteren Zeitpunkt aktiviert) */}
                  {/* <PortfolioPerformance baseCapital={profile.capital} /> */}

                   {/* Compliance Exporter for BaFin & DSGVO PDF downloads */}
                   <ComplianceExporter 
                     capital={profile.capital} 
                     selectedSymbol={selectedSymbol} 
                     subscriptionTier={profile.subscriptionTier}
                     onUpgradeClick={() => navigateTo('abonnements')}
                   />

                 {/* Middle Row: Enterprise Trading Evaluation Tool & Quantitative Ticker */}
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2">
                     <CryptoEnterpriseEvaluator 
                       selectedSymbol={selectedSymbol} 
                       onSelectSymbol={setSelectedSymbol}
                       subscriptionTier={profile.subscriptionTier}
                       onUpgradeClick={() => navigateTo('abonnements')}
                     />
                   </div>
                   <div className="space-y-6">
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


                 {/* Market Sentiment Tool */}
                 <MarketSentiment selectedSymbol={selectedSymbol} assetClass={profile.preferredAssetClass} />


                 {/* Bottom Row: AI Tools */}
                 <div className="grid grid-cols-1 gap-6">
                   <ImageAnalyzer triggerAttempt={triggerAttempt} />
                 </div>
               </>
             )}

            {activeView === 'myworkspace' && (
              <div className="space-y-6">
                {/* Myworkspace Header Banner */}
                <div className="bg-gradient-to-r from-black/80 via-black/60 to-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/30 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-aif-gold-DEFAULT/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3.5 bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/30 rounded-2xl text-aif-gold-DEFAULT shadow-[0_0_20px_rgba(245,196,83,0.15)]">
                        <FolderKanban size={28} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 px-2.5 py-0.5 rounded-full">
                            Persönlicher Arbeitsbereich
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Radar-Engine Aktiv
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-white font-display mt-1">Myworkspace</h2>
                        <p className="text-xs text-white/60 max-w-2xl mt-0.5">
                          Dein persönliches Radar-Cockpit für benutzerdefinierte Asset-Überwachung, Scoring-Aktionen und selektive Markt-Transparenz.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigateTo('market-screener')}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2"
                      >
                        <SlidersHorizontal size={14} className="text-aif-gold-DEFAULT" />
                        <span>Assets suchen</span>
                      </button>
                      <button
                        onClick={() => navigateTo('charts')}
                        className="px-4 py-2 bg-aif-gold-DEFAULT text-black font-black rounded-xl text-xs uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,196,83,0.25)]"
                      >
                        <BarChart3 size={14} />
                        <span>Chart Analyse</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Myworkspace Main Section: Persönlicher Radar (Watchlist) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 h-full">
                    <Watchlist 
                      watchlist={watchlist}
                      onRemove={(symbol) => setWatchlist(prev => prev.filter(s => s !== symbol))}
                      onAdd={(symbol) => {
                        if (!watchlist.includes(symbol)) {
                          setWatchlist(prev => [...prev, symbol]);
                        }
                      }}
                      onSelectAsset={(symbol) => setSelectedSymbol(symbol)}
                      selectedSymbol={selectedSymbol}
                      onSimulateScoreEvent={handleTriggerTestScoreEvent}
                    />
                  </div>

                  {/* Right Column: Quick Workspace Widgets */}
                  <div className="space-y-6 flex flex-col justify-between">
                    {/* Radar Telemetry & Status Card */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center gap-2">
                          <Eye size={16} className="text-aif-gold-DEFAULT" />
                          <h4 className="text-sm font-bold text-white font-display">Radar Telemetrie</h4>
                        </div>
                        <span className="text-[10px] font-mono text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 px-2 py-0.5 rounded-full border border-aif-gold-DEFAULT/20">
                          PRO-LEVEL
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-white/60">Überwachte Assets:</span>
                          <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
                            {watchlist.length} Assets
                          </span>
                        </div>

                        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-white/60">Fokus-Asset:</span>
                          <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 px-2 py-0.5 rounded-md">
                            {selectedSymbol || 'BTC-USD'}
                          </span>
                        </div>

                        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                          <span className="text-xs text-white/60">Benachrichtigungen:</span>
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            Echtzeit Live
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <p className="text-[11px] text-white/40 leading-relaxed">
                          Assets auf Deinem persönlichen Radar werden kontinuierlich vom CAPITAL-AI Multi-Modell Router bezüglich Sentiment, Liquidität und Scoring-Veränderungen überwacht.
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="bg-gradient-to-br from-black/60 to-purple-950/20 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md space-y-3">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        <Sparkles size={14} />
                        Workspace Schnellzugriff
                      </h4>
                      <p className="text-xs text-white/60">
                        Nutze die KI-Funktionen für vertiefte Analysen Deines persönlichen Radars:
                      </p>
                      <div className="grid grid-cols-1 gap-2 pt-1">
                        <button
                          onClick={() => navigateTo('sentiment-dashboard')}
                          className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white transition-all flex items-center justify-between group"
                        >
                          <span>AI Sentiment Cockpit öffnen</span>
                          <ArrowUpRight size={14} className="text-white/40 group-hover:text-aif-gold-DEFAULT group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                        <button
                          onClick={() => navigateTo('risiko-assessment')}
                          className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white transition-all flex items-center justify-between group"
                        >
                          <span>Value-at-Risk Assessment</span>
                          <ArrowUpRight size={14} className="text-white/40 group-hover:text-aif-gold-DEFAULT group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Views */}
            {activeView === 'universe-scoring' && (
              <div className="space-y-6">
                <UniverseBestWorst onSelectAsset={(symbol) => { setSelectedSymbol(symbol); setActiveView('charts'); }} />
              </div>
            )}

            {activeView === 'buffet-value' && (
              <BuffetValueCheck selectedSymbol={selectedSymbol} triggerAttempt={triggerAttempt} />
            )}

            {activeView === 'backtest' && (
              <BacktestEngine selectedSymbol={selectedSymbol} userCapital={profile.capital} triggerAttempt={triggerAttempt} userEmail={profile.email} />
            )}

            {activeView === 'market-screener' && (
              <MarketScreener 
                onSelectSymbol={(sym) => {
                  setSelectedSymbol(sym);
                  navigateTo('dashboard');
                }}
                selectedSymbol={selectedSymbol}
                triggerAttempt={triggerAttempt}
                userSession={userSession}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
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
                userId={profile.id}
              />
            )}

            {activeView === 'sentiment-dashboard' && (
              <SentimentDashboard />
            )}

            {activeView === 'profil' && (
              <ProfilePage 
                profile={profile} 
                onUpdateProfile={handleUpdateProfile} 
              />
            )}

            {activeView === 'admin-portal' && (
              <AdminPortal 
                currentUserEmail={profile.email} 
                activeTab={adminTab} 
                onChangeTab={setAdminTab} 
              />
            )}

            {/* Risikoassessment (Value-at-Risk Risiko-Zentrale): DEAKTIVIERT / DEACTIVATED */}
            {/* HINWEIS: Dieses Modul wurde gemäß System- und Benutzeranweisung deaktiviert und aus der Navigation entfernt. */}
            {activeView === 'risiko-assessment' && (
              <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 backdrop-blur-md">
                <h3 className="text-lg font-bold text-rose-400 mb-2 font-display uppercase tracking-wider">Risikoassessment Deaktiviert</h3>
                <p className="text-sm text-white/60 mb-6 leading-relaxed">
                  Dieses Modul wurde gemäß Benutzeranweisung deaktiviert und steht derzeit nicht zur Verfügung. Die Rohdaten wurden archiviert.
                </p>
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Zurück zum Dashboard
                </button>
              </div>
            )}

            {/* Interact (Modul 2): DEAKTIVIERT / DEACTIVATED */}
            {/* HINWEIS: Dieses Modul wurde gemäß System- und Benutzeranweisung deaktiviert und aus der Navigation entfernt. */}
            {activeView === 'interact' && (
              <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 backdrop-blur-md">
                <h3 className="text-lg font-bold text-rose-400 mb-2 font-display uppercase tracking-wider">Interact-Workspace Deaktiviert</h3>
                <p className="text-sm text-white/60 mb-6 leading-relaxed">
                  Das Interaktions-Modul wurde gemäß Benutzeranweisung deaktiviert und steht derzeit nicht zur Verfügung. Die Rohdaten wurden archiviert.
                </p>
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Zurück zum Dashboard
                </button>
              </div>
            )}

            {activeView === 'charts' && (
              <Charts 
                selectedSymbol={selectedSymbol} 
                onSelectSymbol={(sym) => setSelectedSymbol(sym)}
              />
            )}

            {activeView === 'preis-alarme' && (
              <PriceAlert selectedSymbol={selectedSymbol} userSession={userSession} />
            )}

            {activeView === 'raw-materials' && (
              <RawMaterialsDashboard />
            )}

            {activeView === 'social-accounts' && (
              <SocialAccountManager />
            )}

            {activeView === 'asset-universe' && (
              <AssetUniverseDashboard />
            )}

            {activeView === 'defi-orchestration' && (
              <DeFiOrchestration />
            )}



            {activeView === 'login' && (
              <LandingPage 
                onLoginEmail={async (email, pwd) => {
                  if (onLoginEmail) {
                    await onLoginEmail(email, pwd);
                  }
                }}
                onGuestLogin={() => {
                  setActiveView('dashboard');
                }}
                onRegisterEmail={async (name, email, pwd) => {
                  if (onRegisterEmail) {
                    await onRegisterEmail(name, email, pwd);
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <footer className="pt-8 pb-12 text-center border-t border-white/10 mt-12 px-6">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
            {/* Live System Latency Monitor for API Streams */}
            <SystemLatencyMonitor />

            {/* Info Siegel: Version 0.5.0 mit dem Logo versehen */}
            <div className="flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-aif-gold-DEFAULT/10 via-black/40 to-aif-gold-DEFAULT/5 border border-aif-gold-DEFAULT/20 rounded-2xl px-5 py-2.5 backdrop-blur-md shadow-[0_0_25px_rgba(245,196,83,0.08)] mb-4">
              <div className="flex items-center gap-2">
                <CapitalAiLogo size={24} showText={false} />
                <span className="font-display font-black tracking-widest text-sm uppercase text-aif-gold-DEFAULT">Capital-AI</span>
              </div>
              <span className="hidden sm:inline text-white/20">|</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-white/80 font-mono tracking-wider uppercase">
                  Sicherheitssiegel
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider font-mono uppercase">
                  Zertifiziert
                </span>
              </div>
            </div>

            {/* Contact Email in Footer */}
            <div className="text-xs text-white/60 flex items-center justify-center gap-2 mb-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-aif-gold-DEFAULT animate-pulse" />
              <span>Kundenservice:</span>
              <a href="mailto:support@capital-ai.online" className="text-aif-gold-DEFAULT hover:text-aif-gold-light hover:underline font-bold transition-all">
                support@capital-ai.online
              </a>
            </div>

            <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
              ⚠️ Keine Anlageberatung. Capital-AI zeigt ausschließlich quantitative Berechnungsmodelle und sentimentbasierte Live-Informationen – die Anlageentscheidung trifft immer der Nutzer selbst. Kapitalverlust ist möglich. MiFID II konforme Datenanalyse-Software.
            </p>

            {/* Kraken Pro Referral Card */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/20 to-black/50 border border-violet-500/20 max-w-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(139,92,246,0.05)] mt-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-violet-300 font-mono">Kraken Pro Partner-Bonus</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed">
                  Melde dich über meinen Link unten oder mit meinem Empfehlungscode <code className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-aif-gold-DEFAULT font-mono font-bold select-all">yc4ggk3f</code> bei Kraken Pro an, dann können wir beide Prämien verdienen.
                </p>
              </div>
              <a 
                href="https://proinvite.kraken.com/9f1e/5bq7c9cn" 
                target="_blank" 
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:scale-[1.02] active:scale-[0.98] group"
              >
                <span>Kraken Pro</span>
                <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-xs">↗</span>
              </a>
            </div>

            <p className="text-[11px] font-mono text-white/60 uppercase tracking-widest mt-3">
              Strikte No-Demo-Data-Policy: Keine Interpolation unvollständiger Datenreihen.
            </p>

            {/* Legal quick navigation shortcuts inside footer - Moved to the absolute bottom */}
            <div className="w-full max-w-4xl border-t border-white/5 mt-6 pt-4 flex flex-col items-center gap-4">
              {/* Website Under Construction Notice */}
              <div className="w-full max-w-md bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2.5 text-xs text-amber-200/80 font-mono tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.03)]">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>Diese Webseite befindet sich aktuell im Aufbau.</span>
              </div>

              <div className="flex justify-center gap-4 text-[11px] font-mono text-white/40">
                <a href="https://capital-ai.online/datenschutz/" target="_blank" rel="noopener noreferrer" className="hover:text-aif-gold-DEFAULT hover:underline transition-colors cursor-pointer">Datenschutz</a>
                <span>•</span>
                <a href="https://capital-ai.online/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-aif-gold-DEFAULT hover:underline transition-colors cursor-pointer">Impressum</a>
                <span>•</span>
                <a href="https://capital-ai.online/agb/" target="_blank" rel="noopener noreferrer" className="hover:text-aif-gold-DEFAULT hover:underline transition-colors cursor-pointer">AGB</a>
                <span>•</span>
                <button onClick={() => navigateTo('abonnements')} className="hover:text-aif-gold-DEFAULT hover:underline transition-colors cursor-pointer">Abonnements</button>
              </div>
            </div>
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
            userId={profile.id}
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

        {/* Floating Real-Time Push-Up Notifications Stack */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
          <AnimatePresence>
            {pushNotifications.map((notif) => {
              const isBullish = notif.sentiment === 'bullish';
              const isBearish = notif.sentiment === 'bearish';
              
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                  className="pointer-events-auto w-full bg-[#0e0e11]/95 border border-white/10 rounded-xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md relative overflow-hidden flex flex-col gap-2 group"
                >
                  {/* Glowing vertical side accent line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    isBullish ? 'bg-emerald-500' : isBearish ? 'bg-rose-500' : 'bg-blue-500'
                  }`} />

                  {/* Top Bar: Title, Badges and Close button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono shrink-0 ${
                        isBullish 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : isBearish 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {isBullish ? '🟢 BULLISH SCORE ALERT' : isBearish ? '🔴 BEARISH SCORE ALERT' : '🔵 NEWS ALERT'}
                      </span>
                      
                      {notif.isOnWatchlist && (
                        <span className="bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT px-1.5 py-0.5 rounded text-[8px] font-black font-mono tracking-wider shrink-0 animate-pulse flex items-center gap-0.5">
                          ⭐ RADAR
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setPushNotifications(prev => prev.filter(n => n.id !== notif.id))}
                      className="text-white/40 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* Body: Asset, Adjusted Score and Headline */}
                  <div className="flex items-start gap-2.5 mt-1">
                    <div className="flex flex-col items-center shrink-0">
                      <span className="font-mono text-[14px] font-black text-white">{notif.symbol}</span>
                      <div className={`mt-1 font-mono text-xs py-0.5 px-1.5 rounded font-black border text-center ${
                        notif.score > 7 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}>
                        {notif.score.toFixed(1)}
                      </div>
                      <span className="text-[7px] font-mono text-white/30 uppercase mt-0.5">Score</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white leading-snug line-clamp-3">
                        {notif.headline}
                      </p>
                      
                      {/* Sub-text: Score change detail and time */}
                      <div className="flex items-center justify-between mt-2 text-[9px] font-mono text-white/40">
                        <span>
                          Score: <span className="text-white/60">{notif.oldScore}</span> → <span className={isBullish ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{notif.score}</span>
                        </span>
                        <span>{notif.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </AnimatePresence>
    </div>
  );
}
