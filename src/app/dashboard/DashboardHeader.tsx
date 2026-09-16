import { Activity, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { CapitalAiLogo } from '../../shared/branding/CapitalAiLogo';
import {
  DashboardNavigation,
  type DashboardNavigationAdminTab,
  type DashboardNavigationProfile,
} from './DashboardNavigation';
import type { DashboardView } from './dashboardViews';

export interface DashboardHeaderProps {
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
  onUpgradeClick: () => void;
}

/**
 * BB-2F app-owned authenticated dashboard header/workspace chrome.
 *
 * Authentication, logout execution and subscription authority remain outside
 * this component. It projects the supplied session/profile state and callbacks
 * only; it never derives entitlements or mutates IAM/session state itself.
 */
export function DashboardHeader({
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
  onUpgradeClick,
}: DashboardHeaderProps) {
  const enterprisePresented = profile.subscriptionTier === 'Enterprise';

  return (
    <header
      data-testid="dashboard-app-header"
      className="sticky top-0 z-30 border-b border-brand-primary/20 bg-background/90 shadow-[0_4px_30px_rgba(249,191,33,0.12)] backdrop-blur-xl"
      aria-label="CAPITAL-AI Dashboard-Kopfbereich"
    >
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <DashboardNavigation
            activeView={activeView}
            profile={profile}
            isGuest={isGuest}
            isAdmin={isAdmin}
            onNavigate={onNavigate}
            onLogout={onLogout}
            onGlobalLogout={onGlobalLogout}
            onSelectSymbol={onSelectSymbol}
            onCategoryFilterChange={onCategoryFilterChange}
            onAdminNavigate={onAdminNavigate}
          />

          <div className="flex min-w-0 items-center gap-3 rounded-xl p-1.5 sm:p-2">
            <CapitalAiLogo size={44} showText={false} />
            <div className="hidden min-w-0 flex-col items-start leading-none sm:flex">
              <span className="truncate bg-gradient-to-r from-brand-primary to-amber-500 bg-clip-text font-display text-lg font-black uppercase tracking-widest text-transparent">
                Capital-AI
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary lg:text-[11px]">
                  Production Release
                </span>
                <span className="rounded border border-brand-primary/20 bg-brand-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-primary lg:text-[11px]">
                  Aktiv
                </span>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-1.5 lg:flex">
            <Activity className="text-status-info" size={14} aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
              Workspace
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a
            href="mailto:support@capital-ai.online"
            className="ui-hit hidden min-h-11 items-center gap-1.5 rounded-xl border border-border bg-surface/60 px-3 text-xs font-mono text-text-secondary transition hover:bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary md:flex"
            title="Support per E-Mail kontaktieren"
          >
            <Mail size={12} className="text-brand-primary" aria-hidden="true" />
            <span>Support</span>
          </a>

          {!enterprisePresented ? (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="ui-hit inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-primary px-3 text-[11px] font-black uppercase tracking-wider text-background shadow-[0_0_15px_rgba(249,191,33,0.25)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:px-4 sm:text-xs"
              aria-label="Abonnementoptionen öffnen"
            >
              <Sparkles size={13} aria-hidden="true" />
              <span className="hidden sm:inline">Premium freischalten</span>
              <span className="sm:hidden">Premium</span>
            </button>
          ) : (
            <div
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-score-best/20 bg-score-best/10 px-3 text-xs font-bold text-score-best"
              aria-label="Enterprise-Abonnement aktiv"
            >
              <ShieldCheck size={14} aria-hidden="true" />
              <span className="hidden sm:inline">Enterprise aktiv</span>
              <span className="sm:hidden">Enterprise</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
