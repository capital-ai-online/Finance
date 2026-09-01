import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  Compass,
  Cpu,
  CreditCard,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Layers,
  LogIn,
  LogOut,
  Orbit,
  Percent,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  User,
  X,
  Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { UserProfile } from '../../features/users/ui';
import { CapitalAiLogo } from '../../shared/branding/CapitalAiLogo';
import type { UserSession } from '../types/UserSession';
import type { DashboardAdminTab } from './DashboardViewRouter';
import {
  getDashboardSection,
  type DashboardSection,
  type DashboardView,
} from './dashboardViews';

type DashboardExpandedSection = DashboardSection | 'universes';
type UniverseId = 'equities' | 'forex' | 'crypto' | 'commodity' | 'bond';

interface NavigationItem {
  view: DashboardView;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface UniverseDefinition {
  id: UniverseId;
  label: string;
  symbol: string;
  category: string;
  icon: LucideIcon;
  className: string;
  actions: Array<{
    label: string;
    detail: string;
    view: DashboardView;
  }>;
}

const HUB_ITEMS: NavigationItem[] = [
  {
    view: 'dashboard',
    label: 'Dashboard Home',
    title: 'Dashboard Home',
    description: 'Gesamtübersicht, Markttrends, KI-Analysen und zentrale Kennzahlen.',
    icon: LayoutDashboard,
  },
  {
    view: 'myworkspace',
    label: 'Myworkspace',
    title: 'Myworkspace',
    description: 'Persönlicher Arbeitsbereich mit Watchlist und Asset-Monitoren.',
    icon: FolderKanban,
  },
  {
    view: 'learning',
    label: 'Learning',
    title: 'Learning',
    description: 'Kanonisches CAPITAL-AI Vocabulary als read-only Lernprojektion.',
    icon: BookOpen,
  },
  {
    view: 'universe-scoring',
    label: 'Universe TOP Rankings',
    title: 'Best & Worst Scoring',
    description: 'Presentation der kanonisch gelieferten Top-/Worst-Rankings.',
    icon: Award,
  },
  {
    view: 'buffet-value',
    label: 'Buffet Value Check',
    title: 'Buffet Value Check',
    description: 'Aktienbewertung über den bestehenden fachlichen Consumer.',
    icon: Percent,
  },
  {
    view: 'abonnements',
    label: 'Abonnements',
    title: 'Abonnements & Tarife',
    description: 'Tarif- und Zahlungsoberfläche des bestehenden Billing-Consumers.',
    icon: CreditCard,
  },
];

const ANALYSIS_ITEMS: NavigationItem[] = [
  {
    view: 'asset-universe',
    label: 'Multi-Asset Universum',
    title: 'Multi-Asset Universum',
    description: 'Cockpit für die vorhandenen Asset-Klassen und deren UI-Projektionen.',
    icon: Sparkles,
  },
  {
    view: 'market-screener',
    label: 'Profi Markt-Screener',
    title: 'Profi Markt-Screener',
    description: 'Screening-Consumer über die bestehenden Feature-Contracts.',
    icon: SlidersHorizontal,
  },
  {
    view: 'charts',
    label: 'Ad-Hoc Charts',
    title: 'Ad-Hoc Charts & Indikatoren',
    description: 'Chart- und Indikatoransicht für das aktuell gewählte Asset.',
    icon: BarChart3,
  },
  {
    view: 'preis-alarme',
    label: 'Preis-Alarme',
    title: 'Echtzeit Preis-Alarme',
    description: 'Presentation der bestehenden Preisalarm-Funktion.',
    icon: Bell,
  },
  {
    view: 'backtest',
    label: 'Backtest Engine',
    title: 'Backtest Engine',
    description: 'Historische Strategieauswertung über den bestehenden Portfolio-Consumer.',
    icon: TrendingUp,
  },
  {
    view: 'sentiment-dashboard',
    label: 'AI Markt-Sentiment',
    title: 'AI Markt-Sentiment',
    description: 'Sentiment-Cockpit über die vorhandenen News-/Evidence-Consumer.',
    icon: Gauge,
  },
  {
    view: 'raw-materials',
    label: 'Rohstoff-Bewertung',
    title: 'Rohstoff-Bewertung',
    description: 'Commodity-UI über den kanonischen Feature-Slice.',
    icon: Orbit,
  },
  {
    view: 'social-accounts',
    label: 'Social Media Accounts',
    title: 'Social Media Accounts',
    description: 'Bestehende Social-Account-Oberfläche ohne neue OAuth-Authority.',
    icon: Share2,
  },
];

const UNIVERSES: UniverseDefinition[] = [
  {
    id: 'equities',
    label: 'Equities',
    symbol: 'AAPL',
    category: 'stock',
    icon: TrendingUp,
    className: 'text-cyan-400 bg-cyan-500/5 border-cyan-500/10',
    actions: [
      { label: '1. Sentiment Analysis', detail: 'Echtzeit KI-News Sentiment (AAPL)', view: 'sentiment-dashboard' },
      { label: '2. Graham Valuation', detail: 'Graham Fair Value & DCF Analyse', view: 'buffet-value' },
      { label: '3. Risk Assessment', detail: 'Stress-Testing & Value-at-Risk', view: 'risiko-assessment' },
    ],
  },
  {
    id: 'forex',
    label: 'Forex',
    symbol: 'EURUSD',
    category: 'forex',
    icon: Activity,
    className: 'text-amber-400 bg-amber-500/5 border-amber-500/10',
    actions: [
      { label: '1. Sentiment Analysis', detail: 'Geopolitisches News-Sentiment (EURUSD)', view: 'sentiment-dashboard' },
      { label: '2. Graham Valuation', detail: 'Makro- & Zinsparitäten Fair Value', view: 'buffet-value' },
      { label: '3. Risk Assessment', detail: 'Stress-Testing & Value-at-Risk', view: 'risiko-assessment' },
    ],
  },
  {
    id: 'crypto',
    label: 'Crypto',
    symbol: 'BTC',
    category: 'crypto',
    icon: Orbit,
    className: 'text-purple-400 bg-purple-500/5 border-purple-500/10',
    actions: [
      { label: '1. Sentiment Analysis', detail: 'Echtzeit News & Social Sentiment (BTC)', view: 'sentiment-dashboard' },
      { label: '2. Graham Valuation', detail: 'Network Value / Fair Value Analyse', view: 'buffet-value' },
      { label: '3. Risk Assessment', detail: 'Stress-Testing & Value-at-Risk', view: 'risiko-assessment' },
    ],
  },
  {
    id: 'commodity',
    label: 'Commodities',
    symbol: 'GLD',
    category: 'commodity',
    icon: Layers,
    className: 'text-rose-400 bg-rose-500/5 border-rose-500/10',
    actions: [
      { label: '1. Sentiment Analysis', detail: 'Supply-Chain & Markt-News Sentiment', view: 'sentiment-dashboard' },
      { label: '2. Graham Valuation', detail: 'Rohstoff-Kritikalitäts- & Wertungsindex', view: 'buffet-value' },
      { label: '3. Risk Assessment', detail: 'Stress-Testing & Value-at-Risk', view: 'risiko-assessment' },
    ],
  },
  {
    id: 'bond',
    label: 'Bonds',
    symbol: 'US10Y',
    category: 'bond',
    icon: Percent,
    className: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10',
    actions: [
      { label: '1. Sentiment Analysis', detail: 'Notenbankentscheide & Zins-News Sentiment', view: 'sentiment-dashboard' },
      { label: '2. Graham Valuation', detail: 'Renditekurven & Fair Yield Bewertung', view: 'buffet-value' },
      { label: '3. Risk Assessment', detail: 'Stress-Testing & Value-at-Risk', view: 'risiko-assessment' },
    ],
  },
];

const ADMIN_ITEMS: Array<{ tab: DashboardAdminTab; label: string; icon: LucideIcon }> = [
  { tab: 'users', label: 'Admin-Zentrale', icon: ShieldAlert },
  { tab: 'auth', label: 'Auth State Debugger', icon: Activity },
  { tab: 'markdown', label: 'Markdown Orchestrator', icon: Cpu },
  { tab: 'requests', label: 'Request Orchestrator', icon: Cpu },
  { tab: 'performance', label: 'Performance-Zentrale', icon: Gauge },
  { tab: 'logs', label: 'Audit-Trail & Logs', icon: ShieldCheck },
  { tab: 'hygiene', label: 'Capital-AI Documentary', icon: Sparkles },
  { tab: 'supervisor', label: 'Capital-AI Supervisor', icon: Shield },
  { tab: 'compliance', label: 'Compliance Auditor', icon: ShieldCheck },
];

function SidebarTooltip({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative group/sidebar-tooltip w-full">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3.5 w-64 p-3 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white shadow-2xl hidden group-hover/sidebar-tooltip:block pointer-events-none z-50 animate-fade-in normal-case tracking-normal">
        <div className="font-extrabold text-aif-gold-DEFAULT mb-1 flex items-center gap-1.5">
          <Sparkles size={12} />
          <span>{title}</span>
        </div>
        <p className="text-[10px] text-white/70 leading-normal font-sans font-medium">{text}</p>
      </div>
    </div>
  );
}

function NavItemButton({
  item,
  activeView,
  onNavigate,
}: {
  item: NavigationItem;
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
}) {
  const Icon = item.icon;
  const active = activeView === item.view;

  return (
    <SidebarTooltip title={item.title} text={item.description}>
      <button
        type="button"
        onClick={() => onNavigate(item.view)}
        className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
          active
            ? 'bg-aif-gold-DEFAULT text-black font-black shadow-[0_0_15px_rgba(245,196,83,0.25)]'
            : 'text-white/70 hover:text-white hover:bg-white/5 border border-transparent'
        }`}
      >
        <Icon size={14} />
        <span>{item.label}</span>
      </button>
    </SidebarTooltip>
  );
}

function Section({
  id,
  label,
  icon: Icon,
  expanded,
  onToggle,
  children,
  emphasis = false,
}: {
  id: string;
  label: string;
  icon: LucideIcon;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="border-b border-white/5 pb-2">
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-3 py-2.5 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-lg ${
          emphasis ? 'text-aif-gold-DEFAULT hover:text-white' : 'text-white/80 hover:text-white'
        }`}
        aria-expanded={expanded}
        aria-controls={id}
      >
        <div className="flex items-center gap-2.5">
          <Icon size={14} className="text-aif-gold-DEFAULT" />
          <span>{label}</span>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} className="text-white/50" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={id}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-1 px-1 space-y-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function avatarIcon(avatarId: string): LucideIcon {
  if (avatarId === '2') return Sparkles;
  if (avatarId === '4') return ShieldCheck;
  if (avatarId === '1' || avatarId === '3') return Cpu;
  return User;
}

function TierBadge({ tier }: { tier: string }) {
  const className =
    tier === 'Enterprise'
      ? 'bg-[#F0D597]/15 text-[#F0D597] border-[#F0D597]/30'
      : tier === 'Pro'
        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
        : tier === 'Starter'
          ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
          : 'bg-white/5 text-white/50 border-white/10';

  return (
    <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest rounded border ${className}`}>
      {tier}
    </span>
  );
}

export interface DashboardDrawerProps {
  open: boolean;
  onClose: () => void;
  activeView: DashboardView;
  onNavigate: (view: DashboardView) => void;
  userSession: UserSession;
  profile: UserProfile;
  onLogout: () => void;
  onSelectSymbol: (symbol: string) => void;
  onCategoryFilterChange: (category: string) => void;
  adminTab: DashboardAdminTab;
  onChangeAdminTab: (tab: DashboardAdminTab) => void;
  showAdminNavigation: boolean;
}

/**
 * BB-2E presentation-only drawer.
 *
 * It owns only navigation expansion and drawer interaction state. Domain,
 * entitlement, IAM, scoring and market-data semantics remain upstream.
 */
export function DashboardDrawer({
  open,
  onClose,
  activeView,
  onNavigate,
  userSession,
  profile,
  onLogout,
  onSelectSymbol,
  onCategoryFilterChange,
  adminTab,
  onChangeAdminTab,
  showAdminNavigation,
}: DashboardDrawerProps) {
  const [expandedSection, setExpandedSection] = React.useState<DashboardExpandedSection | null>('hub');
  const [expandedUniverse, setExpandedUniverse] = React.useState<UniverseId | null>(null);

  React.useEffect(() => {
    setExpandedSection(getDashboardSection(activeView));
  }, [activeView]);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const navigate = (view: DashboardView) => {
    onNavigate(view);
    onClose();
  };

  const selectUniverseAction = (universe: UniverseDefinition, view: DashboardView) => {
    onSelectSymbol(universe.symbol);
    onCategoryFilterChange(universe.category);
    navigate(view);
  };

  const selectAdminTab = (tab: DashboardAdminTab) => {
    onChangeAdminTab(tab);
    navigate('admin-portal');
  };

  const ActiveAvatarIcon = avatarIcon(profile.avatarId);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 cursor-pointer"
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 bottom-0 left-0 w-full sm:w-80 bg-black/95 border-r border-white/10 shadow-[0_0_50px_rgba(245,196,83,0.15)] z-50 flex flex-col justify-between overflow-y-auto"
            aria-label="Dashboard Navigation"
          >
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CapitalAiLogo size={40} showText={false} />
                  <div className="flex flex-col items-start leading-none">
                    <span className="font-black text-sm tracking-widest text-aif-gold-DEFAULT font-display uppercase">Capital-AI</span>
                    <span className="text-[11px] text-white/50 font-mono tracking-widest uppercase mt-0.5">Production Release</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
                  aria-label="Hauptmenü schließen"
                >
                  <X size={18} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate('profil')}
                className="w-full p-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 transition-all text-left flex items-center gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
                title="Mein Profil verwalten"
              >
                <span className={`w-12 h-12 rounded-xl bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center overflow-hidden`}>
                  {profile.customAvatarUrl ? (
                    <img src={profile.customAvatarUrl} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <ActiveAvatarIcon className="w-6 h-6 text-black" />
                  )}
                </span>
                <span className="overflow-hidden">
                  <span className="text-xs text-aif-gold-DEFAULT font-mono uppercase tracking-widest font-black block">{profile.subscriptionTier}</span>
                  <span className="text-sm font-bold text-white truncate font-display flex items-center gap-2">
                    <span className="truncate">{profile.name}</span>
                    <TierBadge tier={profile.subscriptionTier} />
                  </span>
                  <span className="text-[11px] text-white/70 truncate font-mono block">{profile.email}</span>
                </span>
              </button>

              <div className="p-4 space-y-3">
                <Section
                  id="nav-sec-hub"
                  label="Hauptzentrale"
                  icon={Orbit}
                  expanded={expandedSection === 'hub'}
                  onToggle={() => setExpandedSection(expandedSection === 'hub' ? null : 'hub')}
                >
                  {HUB_ITEMS.map((item) => (
                    <NavItemButton key={item.view} item={item} activeView={activeView} onNavigate={navigate} />
                  ))}
                </Section>

                <Section
                  id="nav-sec-analysis"
                  label="Analysetools"
                  icon={TrendingUp}
                  expanded={expandedSection === 'analysis'}
                  onToggle={() => setExpandedSection(expandedSection === 'analysis' ? null : 'analysis')}
                >
                  {ANALYSIS_ITEMS.map((item) => (
                    <NavItemButton key={item.view} item={item} activeView={activeView} onNavigate={navigate} />
                  ))}
                </Section>

                <Section
                  id="nav-sec-universes"
                  label="Asset-Universen"
                  icon={Compass}
                  expanded={expandedSection === 'universes'}
                  onToggle={() => setExpandedSection(expandedSection === 'universes' ? null : 'universes')}
                >
                  <div className="space-y-2 pl-1">
                    {UNIVERSES.map((universe) => {
                      const Icon = universe.icon;
                      const expanded = expandedUniverse === universe.id;
                      return (
                        <div key={universe.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setExpandedUniverse(expanded ? null : universe.id)}
                            className={`w-full px-3 py-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider rounded-md border ${universe.className}`}
                            aria-expanded={expanded}
                          >
                            <span className="flex items-center gap-2"><Icon size={12} />{universe.label}</span>
                            <ChevronDown size={12} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
                          </button>
                          {expanded && (
                            <div className="pl-2 py-1 space-y-1 bg-black/40 rounded-lg border border-white/5">
                              {universe.actions.map((action) => (
                                <button
                                  type="button"
                                  key={`${universe.id}-${action.view}-${action.label}`}
                                  onClick={() => selectUniverseAction(universe, action.view)}
                                  className="w-full text-left p-2 hover:bg-white/5 rounded text-[10px] text-white/70 hover:text-white transition-all"
                                >
                                  <span className="font-bold uppercase tracking-wide text-aif-gold-DEFAULT block">{action.label}</span>
                                  <span className="text-[9px] text-white/40 font-mono mt-0.5 block">{action.detail}</span>
                                </button>
                              ))}
                              {universe.id === 'crypto' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectSymbol('AAVE');
                                    onCategoryFilterChange('crypto');
                                    navigate('defi-orchestration');
                                  }}
                                  className="w-full text-left p-2 hover:bg-purple-500/10 rounded text-[10px] text-purple-300 transition-all border-t border-white/5"
                                >
                                  <span className="font-bold uppercase tracking-wide flex items-center gap-1"><Zap size={10} />DeFi Orchestration</span>
                                  <span className="text-[9px] text-white/40 font-mono mt-0.5 block">Liquidity depth & IL Radar</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Section>

                {showAdminNavigation && (
                  <Section
                    id="nav-sec-admin"
                    label="Admin-Portal"
                    icon={ShieldAlert}
                    expanded={expandedSection === 'system_admin'}
                    onToggle={() => setExpandedSection(expandedSection === 'system_admin' ? null : 'system_admin')}
                    emphasis
                  >
                    {ADMIN_ITEMS.map(({ tab, label, icon: Icon }) => {
                      const active = activeView === 'admin-portal' && adminTab === tab;
                      return (
                        <button
                          type="button"
                          key={tab}
                          onClick={() => selectAdminTab(tab)}
                          className={`w-full px-4 py-2.5 rounded-xl text-left text-xs font-bold uppercase tracking-wider flex items-center gap-3 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${
                            active
                              ? 'bg-aif-gold-DEFAULT text-black border-aif-gold-DEFAULT'
                              : 'text-aif-gold-DEFAULT hover:text-white hover:bg-aif-gold-DEFAULT/15 border-aif-gold-DEFAULT/20'
                          }`}
                        >
                          <Icon size={14} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </Section>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-black/60 space-y-2">
              {userSession.type === 'guest' ? (
                <button
                  type="button"
                  onClick={() => navigate('login')}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-aif-gold-DEFAULT to-aif-gold-dark text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <LogIn size={15} />
                  <span>Login (Anmelden)</span>
                </button>
              ) : (
                <>
                  <button type="button" onClick={onLogout} className="w-full py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <LogIn size={14} />
                    <span>Konto wechseln</span>
                  </button>
                  <button type="button" onClick={onLogout} className="w-full py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <LogOut size={14} />
                    <span>Abmelden (Logout)</span>
                  </button>
                </>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
