import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  Compass,
  CreditCard,
  Gauge,
  Layers,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Orbit,
  Percent,
  Share2,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { DashboardNavigationDrawer } from './DashboardNavigationDrawer';
import { getDashboardNavigationItems } from './dashboardNavigation';
import { getDashboardSection, type DashboardSection, type DashboardView } from './dashboardViews';

export type DashboardNavigationAdminTab =
  | 'users'
  | 'auth'
  | 'markdown'
  | 'requests'
  | 'performance'
  | 'logs'
  | 'hygiene'
  | 'supervisor'
  | 'seo'
  | 'compliance';

export interface DashboardNavigationProfile {
  name: string;
  email: string;
  subscriptionTier: string;
  avatarColor: string;
  customAvatarUrl?: string;
}

export interface DashboardNavigationProps {
  activeView: DashboardView;
  profile: DashboardNavigationProfile;
  isGuest: boolean;
  isAdmin: boolean;
  onNavigate: (view: DashboardView) => void;
  onLogout: () => void;
  onGlobalLogout?: () => void | Promise<void>;
  onSelectSymbol: (symbol: string) => void;
  onCategoryFilterChange: (category: string) => void;
  onAdminNavigate: (tab: DashboardNavigationAdminTab) => void;
}

type ExpandedSection = DashboardSection | 'universes' | null;
type UniverseId = 'equities' | 'forex' | 'crypto' | 'commodity';

const ITEM_ICON: Partial<Record<DashboardView, LucideIcon>> = {
  dashboard: LayoutDashboard,
  myworkspace: Compass,
  learning: BookOpen,
  'universe-scoring': Sparkles,
  'buffet-value': Percent,
  abonnements: CreditCard,
  'asset-universe': Sparkles,
  'market-screener': SlidersHorizontal,
  charts: BarChart3,
  'preis-alarme': Bell,
  backtest: TrendingUp,
  'sentiment-dashboard': Gauge,
  'raw-materials': Orbit,
  'social-accounts': Share2,
};

const UNIVERSES: ReadonlyArray<{
  id: UniverseId;
  label: string;
  symbol: string;
  category: string;
}> = [
  { id: 'equities', label: 'Aktien', symbol: 'AAPL', category: 'stock' },
  { id: 'forex', label: 'Forex', symbol: 'EURUSD', category: 'forex' },
  { id: 'crypto', label: 'Krypto', symbol: 'BTC', category: 'crypto' },
  { id: 'commodity', label: 'Rohstoffe', symbol: 'GLD', category: 'commodity' },
];

const ADMIN_ITEMS: ReadonlyArray<{ tab: DashboardNavigationAdminTab; label: string }> = [
  { tab: 'users', label: 'Admin-Zentrale' },
  { tab: 'auth', label: 'Auth State Debugger' },
  { tab: 'markdown', label: 'Markdown Orchestrator' },
  { tab: 'requests', label: 'Request Orchestrator' },
  { tab: 'performance', label: 'Performance-Zentrale' },
  { tab: 'logs', label: 'Audit-Trail & Logs' },
  { tab: 'hygiene', label: 'Capital-AI Documentary' },
  { tab: 'supervisor', label: 'Capital-AI Supervisor' },
  { tab: 'compliance', label: 'Compliance Auditor' },
];

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/70">
      {tier}
    </span>
  );
}

function SectionButton({
  expanded,
  controls,
  icon: Icon,
  label,
  onClick,
}: {
  expanded: boolean;
  controls: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ui-hit flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white/80 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
      aria-expanded={expanded}
      aria-controls={controls}
    >
      <span className="flex items-center gap-2.5">
        <Icon size={14} className="text-aif-gold-DEFAULT" />
        {label}
      </span>
      <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </button>
  );
}

/**
 * BB-2E app-owned dashboard navigation.
 *
 * The component projects the canonical DashboardView/section contracts and
 * existing callbacks. It does not create routing, IAM, entitlement, scoring,
 * data or feature authority.
 */
export function DashboardNavigation({
  activeView,
  profile,
  isGuest,
  isAdmin,
  onNavigate,
  onLogout,
  onGlobalLogout,
  onSelectSymbol,
  onCategoryFilterChange,
  onAdminNavigate,
}: DashboardNavigationProps) {
  const [open, setOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>('hub');
  const [expandedUniverse, setExpandedUniverse] = useState<UniverseId | null>(null);

  useEffect(() => {
    setExpandedSection(getDashboardSection(activeView));
  }, [activeView]);

  const navigate = (view: DashboardView) => {
    onNavigate(view);
    setOpen(false);
  };

  const navigateAsset = (symbol: string, category: string, view: DashboardView) => {
    onSelectSymbol(symbol);
    onCategoryFilterChange(category);
    navigate(view);
  };

  return (
    <>
      <button
        id="dashboard-main-menu-trigger"
        type="button"
        onClick={() => setOpen(true)}
        className="ui-hit flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/5 p-2 text-white/90 shadow-[0_0_15px_rgba(255,255,255,0.05)] transition hover:border-aif-gold-DEFAULT/45 hover:bg-white/10 hover:text-aif-gold-DEFAULT focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
        aria-label="Hauptmenü öffnen"
        aria-haspopup="dialog"
        aria-controls="dashboard-navigation-drawer"
        aria-expanded={open}
      >
        <Menu size={20} aria-hidden="true" />
        <span className="hidden pr-1 text-[11px] font-bold uppercase tracking-widest sm:inline">Menü</span>
      </button>

      <DashboardNavigationDrawer open={open} onClose={() => setOpen(false)}>
        <div className="flex min-h-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <header className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 id="dashboard-navigation-title" className="text-sm font-black uppercase tracking-widest text-aif-gold-DEFAULT">
                  Capital-AI
                </h2>
                <p className="mt-0.5 text-[11px] uppercase tracking-widest text-white/50">Production Release</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ui-hit min-h-11 min-w-11 rounded-lg border border-white/10 bg-white/5 px-3 text-white/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
                aria-label="Hauptmenü schließen"
              >
                Schließen
              </button>
            </header>

            <button
              type="button"
              onClick={() => navigate('profil')}
              className="ui-hit flex min-h-11 w-full items-center gap-4 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent p-5 text-left transition hover:from-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-aif-gold-DEFAULT"
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${profile.avatarColor}`}>
                {profile.customAvatarUrl ? (
                  <img src={profile.customAvatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="h-6 w-6 text-black" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-bold text-white">
                  <span className="truncate">{profile.name}</span>
                  <TierBadge tier={profile.subscriptionTier} />
                </span>
                <span className="block truncate text-[11px] text-white/70">{profile.email}</span>
              </span>
            </button>

            <nav className="space-y-3 p-4" aria-label="Dashboard-Navigation">
              {(['hub', 'analysis'] as const).map((section) => {
                const sectionId = `dashboard-nav-${section}`;
                const sectionLabel = section === 'hub' ? 'Hauptzentrale' : 'Analysetools';
                const SectionIcon = section === 'hub' ? Orbit : TrendingUp;
                return (
                  <section key={section} className="border-b border-white/5 pb-2">
                    <SectionButton
                      expanded={expandedSection === section}
                      controls={sectionId}
                      icon={SectionIcon}
                      label={sectionLabel}
                      onClick={() => setExpandedSection(expandedSection === section ? null : section)}
                    />
                    {expandedSection === section ? (
                      <div id={sectionId} className="mt-1 space-y-1 px-1">
                        {getDashboardNavigationItems(section).map((item) => {
                          const Icon = ITEM_ICON[item.view] ?? LayoutDashboard;
                          const active = activeView === item.view;
                          return (
                            <button
                              key={item.view}
                              type="button"
                              onClick={() => navigate(item.view)}
                              className={`ui-hit flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT ${active ? 'bg-aif-gold-DEFAULT text-black' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                              aria-current={active ? 'page' : undefined}
                            >
                              <Icon size={14} aria-hidden="true" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                );
              })}

              <section className="border-b border-white/5 pb-2">
                <SectionButton
                  expanded={expandedSection === 'universes'}
                  controls="dashboard-nav-universes"
                  icon={Compass}
                  label="Asset-Universen"
                  onClick={() => setExpandedSection(expandedSection === 'universes' ? null : 'universes')}
                />
                {expandedSection === 'universes' ? (
                  <div id="dashboard-nav-universes" className="mt-1 space-y-2 border-l border-white/5 pl-2">
                    {UNIVERSES.map((universe) => (
                      <div key={universe.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setExpandedUniverse(expandedUniverse === universe.id ? null : universe.id)}
                          className="ui-hit flex min-h-11 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 text-[11px] font-bold uppercase tracking-wider text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
                          aria-expanded={expandedUniverse === universe.id}
                        >
                          <span className="flex items-center gap-2"><Layers size={12} aria-hidden="true" />{universe.label}</span>
                          <ChevronDown size={12} aria-hidden="true" className={`transition-transform ${expandedUniverse === universe.id ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedUniverse === universe.id ? (
                          <div className="space-y-1 rounded-lg border border-white/5 bg-black/40 p-1">
                            <button type="button" className="ui-hit min-h-11 w-full rounded p-2 text-left text-[10px] text-white/70 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT" onClick={() => navigateAsset(universe.symbol, universe.category, 'sentiment-dashboard')}>1. Sentiment Analysis</button>
                            <button type="button" className="ui-hit min-h-11 w-full rounded p-2 text-left text-[10px] text-white/70 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT" onClick={() => navigateAsset(universe.symbol, universe.category, 'buffet-value')}>2. Graham Valuation</button>
                            <button type="button" className="ui-hit min-h-11 w-full rounded p-2 text-left text-[10px] text-white/70 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT" onClick={() => navigateAsset(universe.symbol, universe.category, 'risiko-assessment')}>3. Risk Assessment</button>
                            {universe.id === 'crypto' ? (
                              <button type="button" className="ui-hit flex min-h-11 w-full items-center gap-2 rounded p-2 text-left text-[10px] font-bold text-purple-300 hover:bg-purple-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT" onClick={() => navigateAsset('AAVE', 'crypto', 'defi-orchestration')}><Zap size={10} aria-hidden="true" />DeFi Orchestration</button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              {isAdmin ? (
                <section className="border-b border-white/5 pb-2">
                  <SectionButton
                    expanded={expandedSection === 'system_admin'}
                    controls="dashboard-nav-admin"
                    icon={ShieldAlert}
                    label="Admin-Portal"
                    onClick={() => setExpandedSection(expandedSection === 'system_admin' ? null : 'system_admin')}
                  />
                  {expandedSection === 'system_admin' ? (
                    <div id="dashboard-nav-admin" className="mt-1 space-y-1 px-1">
                      {ADMIN_ITEMS.map((item) => (
                        <button
                          key={item.tab}
                          type="button"
                          onClick={() => {
                            onAdminNavigate(item.tab);
                            setOpen(false);
                          }}
                          className="ui-hit flex min-h-11 w-full items-center gap-3 rounded-xl border border-aif-gold-DEFAULT/20 px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-aif-gold-DEFAULT transition hover:bg-aif-gold-DEFAULT/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
                        >
                          <Activity size={14} aria-hidden="true" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : null}
            </nav>
          </div>

          <footer className="space-y-2 border-t border-white/10 bg-black/60 p-4">
            {isGuest ? (
              <button type="button" onClick={() => navigate('login')} className="ui-hit flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-aif-gold-DEFAULT px-3 font-black uppercase tracking-widest text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><LogIn size={15} aria-hidden="true" />Login (Anmelden)</button>
            ) : (
              <>
                <button type="button" onClick={onLogout} className="ui-hit flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"><LogIn size={14} aria-hidden="true" />Konto wechseln</button>
                <button type="button" onClick={onLogout} className="ui-hit flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><LogOut size={14} aria-hidden="true" />Abmelden (Logout)</button>
                {onGlobalLogout ? (
                  <button type="button" onClick={() => void onGlobalLogout()} className="ui-hit flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-950/40 px-3 text-xs font-bold uppercase tracking-widest text-red-200 hover:bg-red-950/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><ShieldAlert size={14} aria-hidden="true" />Von allen Geräten abmelden</button>
                ) : null}
              </>
            )}
          </footer>
        </div>
      </DashboardNavigationDrawer>
    </>
  );
}

export default DashboardNavigation;
