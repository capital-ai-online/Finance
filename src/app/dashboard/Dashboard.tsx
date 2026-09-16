import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { BillingUI, UserUI } from '../../features';
import { secureStorage } from '../../lib/cryptoHelper';
import { readAuthenticatedSubscriptionTier } from '../../lib/subscriptionReadback';
import { CAPITAL_AI_VERSION } from '../../platform/Branding/runtimeBrand';
import type { UserSession } from '../types/UserSession';
import { DashboardFooter } from './DashboardFooter';
import {
  DashboardHome,
  type DashboardPushNotificationInput,
} from './DashboardHome';
import { DashboardHeader } from './DashboardHeader';
import {
  DashboardNotificationStack,
  type DashboardPushNotification,
} from './DashboardNotificationStack';
import { DashboardViewRouter, type DashboardAdminTab } from './DashboardViewRouter';
import { MyWorkspaceView } from './MyWorkspaceView';
import type { DashboardView } from './dashboardViews';

export interface DashboardProps {
  userSession: UserSession;
  onLogout: () => void;
  onGlobalLogout?: () => Promise<void>;
  onRegister: (name: string, email: string) => void;
  onLoginEmail?: (email: string, password: string) => Promise<void>;
  onRegisterEmail?: (name: string, email: string, password: string) => Promise<void>;
}

const DASHBOARD_VIEW_LABELS: Partial<Record<DashboardView, string>> = {
  myworkspace: 'Myworkspace – Persönlicher Radar',
  learning: 'Learning · CAPITAL-AI Vocabulary',
  'universe-scoring': 'Universe TOP Rankings',
  'raw-materials': 'Rohstoff-Kategorisierung & AI-Scoring',
  'social-accounts': 'Social Media Direct Publishing Hub',
  'asset-universe': 'Multi-Asset-Klassen Cockpit',
  'defi-orchestration': 'DeFi Token Orchestration & IL Radar',
  'buffet-value': 'Buffet Value Check',
  backtest: 'Quantitative Backtest Engine',
  'market-screener': 'Profi Markt-Screener',
  abonnements: 'Abonnements & Tarife',
  profil: 'Profilseite',
  'admin-portal': 'Admin-Portal & DevOps-Zentrale',
  interact: 'Interact Workspace (Modul 2)',
  'risiko-assessment': 'Value-at-Risk Risiko-Zentrale',
  'preis-alarme': 'Echtzeit Preis-Alarme & Push-Simulation',
  'sentiment-dashboard': 'AI Markt-Sentiment Cockpit & Sandbox',
  login: 'System-Anmeldung (Capital-AI Login)',
};

/**
 * Canonical authenticated dashboard composition for BB-2G.
 *
 * Home, MyWorkspace, header/navigation, detail routing, footer and transient
 * overlays now compose from the app layer. Domain/data/scoring/IAM authority
 * remains in the existing feature, service and server contracts.
 */
export function Dashboard({
  userSession,
  onLogout,
  onGlobalLogout,
  onRegister,
  onLoginEmail,
  onRegisterEmail,
}: DashboardProps) {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('1std');
  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const [adminTab, setAdminTab] = useState<DashboardAdminTab>('users');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cliffhangerModalOpen, setCliffhangerModalOpen] = useState(false);
  const [failedActionName, setFailedActionName] = useState('');

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('capital_ai_watchlist');
      return saved ? JSON.parse(saved) : ['BTC', 'ETH', 'TSLA', 'AAPL', 'EURUSD'];
    } catch {
      return ['BTC', 'ETH', 'TSLA', 'AAPL', 'EURUSD'];
    }
  });

  const [pushNotifications, setPushNotifications] = useState<DashboardPushNotification[]>([]);
  const [profile, setProfile] = useState<UserUI.UserProfile>({
    name: userSession.name,
    email: userSession.email,
    avatarId: '1',
    avatarColor: 'from-aif-gold-DEFAULT to-aif-gold-dark',
    preferredAssetClass: 'Crypto',
    riskProfile: 'Ausgewogen',
    capital: 150000,
    subscriptionTier: userSession.type === 'guest' ? 'Free' : userSession.subscriptionTier,
    id: userSession.id,
  });

  React.useEffect(() => {
    localStorage.setItem('capital_ai_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  React.useEffect(() => {
    if (userSession.type === 'registered' && activeView === 'login') {
      setActiveView('dashboard');
    }
  }, [userSession.type, activeView]);

  React.useEffect(() => {
    const loadSecureProfile = async () => {
      if (!userSession.email) return;

      try {
        const pass = `${userSession.email}_aif_secure_passcode`;
        const savedStr = await secureStorage.getItem('aif_encrypted_user_profile', pass);
        if (savedStr) {
          const parsed = JSON.parse(savedStr) as UserUI.UserProfile;
          setProfile({
            ...parsed,
            email: userSession.email,
            subscriptionTier: userSession.type === 'guest' ? 'Free' : userSession.subscriptionTier,
            id: userSession.id,
          });
          return;
        }
      } catch (error) {
        console.error('Failed to decrypt local secure profile:', error);
      }

      setProfile((previous) => ({
        ...previous,
        name: userSession.name,
        email: userSession.email,
        subscriptionTier: userSession.type === 'guest' ? 'Free' : userSession.subscriptionTier,
        id: userSession.id,
      }));
    };

    void loadSecureProfile();
  }, [userSession]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const plan = params.get('plan');

    if (payment === 'success' && plan) {
      setProfile((previous) => ({
        ...previous,
        subscriptionTier: plan as UserUI.UserProfile['subscriptionTier'],
      }));
      setActiveView('abonnements');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (userSession.type === 'registered' && userSession.id) {
      void readAuthenticatedSubscriptionTier()
        .then((tier) => {
          if (tier) {
            setProfile((previous) =>
              previous.subscriptionTier === tier
                ? previous
                : { ...previous, subscriptionTier: tier },
            );
          }
        })
        .catch((error) => console.error('Error syncing authenticated subscription tier:', error));
    }
    // The dashboard instance remains bound to one authenticated subject.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = async (newProfile: UserUI.UserProfile) => {
    setProfile(newProfile);
    if (!userSession.email) return;

    try {
      const pass = `${userSession.email}_aif_secure_passcode`;
      await secureStorage.setItem('aif_encrypted_user_profile', JSON.stringify(newProfile), pass);
    } catch (error) {
      console.error('Failed to encrypt and save secure profile:', error);
    }
  };

  const triggerAttempt = (actionName: string, onExecute: () => void) => {
    if (userSession.type !== 'guest') {
      onExecute();
      return;
    }

    if (attempts >= 1) {
      setFailedActionName(actionName);
      setCliffhangerModalOpen(true);
      return;
    }

    setAttempts(1);
    onExecute();
  };

  const navigateTo = (view: DashboardView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerPushNotification = React.useCallback((data: DashboardPushNotificationInput) => {
    const id = `push-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    setPushNotifications((previous) => [{ ...data, id, timestamp }, ...previous].slice(0, 5));
    setTimeout(() => {
      setPushNotifications((previous) => previous.filter((notification) => notification.id !== id));
    }, 8000);
  }, []);

  const handleTriggerTestScoreEvent = (_symbol: string, _type: 'crash' | 'rally') => {
    console.warn('Synthetic score test events are disabled in production. Use verified screening evidence instead.');
  };

  const handleGlobalLogoutClick = async () => {
    if (!onGlobalLogout) return;

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Von allen Geräten abmelden? Bestehende Sitzungen werden serverseitig abgemeldet. Bereits ausgestellte Access-Tokens können bis zu ihrem Ablauf gültig bleiben.',
      );
      if (!confirmed) return;
    }

    await onGlobalLogout();
  };

  return (
    <div className="min-h-screen bg-[#18181b] text-white selection:bg-aif-gold-DEFAULT/30 font-sans relative">
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50" aria-hidden="true">
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
          <path d="M 0,200 Q 300,50 600,250 T 1200,100 T 1800,300" fill="none" stroke="url(#dash-neural-1)" strokeWidth="2" className="animate-pulse opacity-40" />
          <path d="M 100,600 Q 450,400 800,650 T 1500,450 T 2000,700" fill="none" stroke="url(#dash-neural-2)" strokeWidth="1.5" className="animate-pulse opacity-30" />
          <line x1="10%" y1="20%" x2="25%" y2="35%" stroke="#F5C453" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-40" />
          <line x1="25%" y1="35%" x2="40%" y2="15%" stroke="#0DDDDD" strokeWidth="2" className="opacity-50" />
          <line x1="40%" y1="15%" x2="60%" y2="30%" stroke="#B026FF" strokeWidth="1" className="opacity-40" />
          <line x1="60%" y1="30%" x2="85%" y2="20%" stroke="#0DDDDD" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-50" />
          <line x1="5%" y1="80%" x2="20%" y2="65%" stroke="#B026FF" strokeWidth="1.5" className="opacity-40" />
          <line x1="20%" y1="65%" x2="35%" y2="85%" stroke="#F5C453" strokeWidth="2" className="opacity-50" />
          <line x1="35%" y1="85%" x2="55%" y2="70%" stroke="#0DDDDD" strokeWidth="1.5" className="opacity-40" />
          <line x1="55%" y1="70%" x2="75%" y2="90%" stroke="#F5C453" strokeWidth="3" className="opacity-30" />
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

      <DashboardHeader
        activeView={activeView}
        profile={profile}
        isGuest={userSession.type === 'guest'}
        isAdmin={profile.email === 'sven.kulessa@gmail.com' || profile.email === 'sven.kulessa@gmx.net'}
        onNavigate={navigateTo}
        onLogout={onLogout}
        onGlobalLogout={onGlobalLogout ? handleGlobalLogoutClick : undefined}
        onSelectSymbol={setSelectedSymbol}
        onCategoryFilterChange={setCategoryFilter}
        onAdminNavigate={(tab) => {
          setActiveView('admin-portal');
          setAdminTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onUpgradeClick={() => setIsSubscriptionModalOpen(true)}
      />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {activeView !== 'dashboard' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-mono text-white/50">
              <button
                type="button"
                className="hover:text-white cursor-pointer uppercase tracking-wider font-bold"
                onClick={() => navigateTo('dashboard')}
              >
                Capital-AI
              </button>
              <span>/</span>
              <span className="text-aif-gold-DEFAULT uppercase tracking-wider font-bold">
                {DASHBOARD_VIEW_LABELS[activeView] ?? activeView}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Zurück zum Dashboard</span>
            </button>
          </div>
        )}

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
              <DashboardHome
                userSession={userSession}
                subscriptionTier={profile.subscriptionTier}
                platformVersion={CAPITAL_AI_VERSION}
                capital={profile.capital}
                preferredAssetClass={profile.preferredAssetClass}
                selectedSymbol={selectedSymbol}
                timeframe={timeframe}
                watchlist={watchlist}
                onSelectSymbol={setSelectedSymbol}
                onChangeTimeframe={setTimeframe}
                onNavigate={navigateTo}
                onTriggerPushNotification={triggerPushNotification}
                triggerAttempt={triggerAttempt}
              />
            )}

            {activeView === 'myworkspace' && (
              <MyWorkspaceView
                watchlist={watchlist}
                selectedSymbol={selectedSymbol}
                onRemoveWatchlistSymbol={(symbol) => setWatchlist((previous) => previous.filter((item) => item !== symbol))}
                onAddWatchlistSymbol={(symbol) => {
                  setWatchlist((previous) => previous.includes(symbol) ? previous : [...previous, symbol]);
                }}
                onSelectSymbol={setSelectedSymbol}
                onNavigate={navigateTo}
                onSimulateScoreEvent={handleTriggerTestScoreEvent}
              />
            )}

            <DashboardViewRouter
              activeView={activeView}
              selectedSymbol={selectedSymbol}
              onSelectSymbol={setSelectedSymbol}
              onNavigate={navigateTo}
              userSession={userSession}
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              adminTab={adminTab}
              onChangeAdminTab={setAdminTab}
              onUpdateTier={(tier) => setProfile((previous) => ({ ...previous, subscriptionTier: tier }))}
              triggerAttempt={triggerAttempt}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              onLoginEmail={onLoginEmail}
              onRegisterEmail={onRegisterEmail}
            />
          </motion.div>
        </AnimatePresence>

        <DashboardFooter onNavigate={navigateTo} />
      </main>

      <AnimatePresence>
        {isSubscriptionModalOpen && (
          <BillingUI.SubscriptionModal
            isOpen={isSubscriptionModalOpen}
            onClose={() => setIsSubscriptionModalOpen(false)}
            currentTier={profile.subscriptionTier}
            onUpdateTier={(tier) => setProfile((previous) => ({ ...previous, subscriptionTier: tier }))}
            email={profile.email}
            userId={profile.id}
          />
        )}
        {cliffhangerModalOpen && (
          <BillingUI.GuestCliffhangerModal
            isOpen={cliffhangerModalOpen}
            onClose={() => setCliffhangerModalOpen(false)}
            onRegister={onRegister}
            actionName={failedActionName}
          />
        )}
      </AnimatePresence>

      <DashboardNotificationStack
        notifications={pushNotifications}
        onDismiss={(id) => setPushNotifications((previous) => previous.filter((notification) => notification.id !== id))}
      />
    </div>
  );
}
