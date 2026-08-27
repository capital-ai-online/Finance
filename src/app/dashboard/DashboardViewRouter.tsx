import React from 'react';
import {
  AnalyticsUI,
  BillingUI,
  CommoditiesUI,
  CryptoUI,
  GovernanceUI,
  LearningUI,
  NewsUI,
  PortfolioUI,
  PublicUI,
  ScreeningUI,
  SocialUI,
  StocksUI,
  UserUI,
} from '../../features';
import type { SubscriptionTier, UserSession } from '../types/UserSession';
import type { DashboardView } from './dashboardViews';

export type DashboardAdminTab =
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

export interface DashboardViewRouterProps {
  activeView: DashboardView;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onNavigate: (view: DashboardView) => void;
  userSession: UserSession;
  profile: UserUI.UserProfile;
  onUpdateProfile: (profile: UserUI.UserProfile) => void;
  adminTab: DashboardAdminTab;
  onChangeAdminTab: (tab: DashboardAdminTab) => void;
  onUpdateTier: (tier: SubscriptionTier) => void;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  onLoginEmail?: (email: string, password: string) => Promise<void>;
  onRegisterEmail?: (name: string, email: string, password: string) => Promise<void>;
}

function DisabledDashboardView({
  title,
  description,
  onNavigate,
}: {
  title: string;
  description: string;
  onNavigate: (view: DashboardView) => void;
}) {
  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 backdrop-blur-md">
      <h3 className="text-lg font-bold text-rose-400 mb-2 font-display uppercase tracking-wider">
        {title}
      </h3>
      <p className="text-sm text-white/60 mb-6 leading-relaxed">{description}</p>
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
      >
        Zurück zum Dashboard
      </button>
    </div>
  );
}

/**
 * BB-2D strangler router.
 *
 * Feature views are composed exclusively through canonical feature facades;
 * disabled views remain presentation-only. The router projects state and
 * callbacks supplied by the Dashboard composition layer and does not create
 * scoring, IAM, billing, evidence, trading, or provider/runtime authority.
 */
export function DashboardViewRouter({
  activeView,
  selectedSymbol,
  onSelectSymbol,
  onNavigate,
  userSession,
  profile,
  onUpdateProfile,
  adminTab,
  onChangeAdminTab,
  onUpdateTier,
  triggerAttempt,
  searchQuery,
  onSearchQueryChange,
  categoryFilter,
  onCategoryFilterChange,
  onLoginEmail,
  onRegisterEmail,
}: DashboardViewRouterProps): React.ReactNode {
  switch (activeView) {
    case 'learning':
      return <LearningUI.LearningVocabulary />;

    case 'universe-scoring':
      return (
        <div className="space-y-6">
          <ScreeningUI.UniverseBestWorst
            onSelectAsset={(symbol) => {
              onSelectSymbol(symbol);
              onNavigate('charts');
            }}
          />
        </div>
      );

    case 'buffet-value':
      return (
        <StocksUI.BuffetValueCheck
          selectedSymbol={selectedSymbol}
          triggerAttempt={triggerAttempt}
        />
      );

    case 'backtest':
      return (
        <PortfolioUI.BacktestEngine
          selectedSymbol={selectedSymbol}
          userCapital={profile.capital}
          triggerAttempt={triggerAttempt}
          userEmail={profile.email}
        />
      );

    case 'market-screener':
      return (
        <ScreeningUI.MarketScreener
          onSelectSymbol={(symbol) => {
            onSelectSymbol(symbol);
            onNavigate('dashboard');
          }}
          selectedSymbol={selectedSymbol}
          triggerAttempt={triggerAttempt}
          userSession={userSession}
          searchQuery={searchQuery}
          setSearchQuery={onSearchQueryChange}
          categoryFilter={categoryFilter}
          setCategoryFilter={onCategoryFilterChange}
        />
      );

    case 'heatmap':
      return (
        <AnalyticsUI.HeatmapCreator
          subscriptionTier={profile.subscriptionTier}
          onUpgradeClick={() => onNavigate('abonnements')}
          triggerAttempt={triggerAttempt}
        />
      );

    case 'charts':
      return (
        <AnalyticsUI.Charts
          selectedSymbol={selectedSymbol}
          onSelectSymbol={onSelectSymbol}
        />
      );

    case 'abonnements':
      return (
        <BillingUI.Abonnements
          currentTier={profile.subscriptionTier}
          onUpdateTier={onUpdateTier}
          email={profile.email}
          userId={profile.id}
        />
      );

    case 'sentiment-dashboard':
      return <NewsUI.SentimentDashboard />;

    case 'profil':
      return <UserUI.ProfilePage profile={profile} onUpdateProfile={onUpdateProfile} />;

    case 'admin-portal':
      return (
        <GovernanceUI.AdminPortal
          currentUserEmail={profile.email}
          activeTab={adminTab}
          onChangeTab={onChangeAdminTab}
        />
      );

    case 'preis-alarme':
      return <AnalyticsUI.PriceAlert selectedSymbol={selectedSymbol} userSession={userSession} />;

    case 'raw-materials':
      return <CommoditiesUI.RawMaterialsDashboard />;

    case 'asset-universe':
      return <ScreeningUI.AssetUniverseDashboard />;

    case 'defi-orchestration':
      return <CryptoUI.DeFiOrchestration />;

    case 'social-accounts':
      return <SocialUI.SocialAccountManager />;

    case 'risiko-assessment':
      return (
        <DisabledDashboardView
          title="Risikoassessment Deaktiviert"
          description="Dieses Modul wurde gemäß Benutzeranweisung deaktiviert und steht derzeit nicht zur Verfügung. Die Rohdaten wurden archiviert."
          onNavigate={onNavigate}
        />
      );

    case 'interact':
      return (
        <DisabledDashboardView
          title="Interact-Workspace Deaktiviert"
          description="Das Interaktions-Modul wurde gemäß Benutzeranweisung deaktiviert und steht derzeit nicht zur Verfügung. Die Rohdaten wurden archiviert."
          onNavigate={onNavigate}
        />
      );

    case 'login':
      return (
        <PublicUI.LandingPage
          onLoginEmail={async (email, password) => {
            if (onLoginEmail) await onLoginEmail(email, password);
          }}
          onGuestLogin={() => onNavigate('dashboard')}
          onRegisterEmail={async (name, email, password) => {
            if (onRegisterEmail) await onRegisterEmail(name, email, password);
          }}
        />
      );

    default:
      return null;
  }
}
