import React from 'react';
import { Menu } from 'lucide-react';
import type { UserProfile } from '../../features/users/ui';
import type { UserSession } from '../types/UserSession';
import type { DashboardAdminTab } from './DashboardViewRouter';
import { DashboardDrawer } from './DashboardDrawer';
import type { DashboardView } from './dashboardViews';

export interface DashboardNavigationProps {
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
 * BB-2E app-level navigation composition.
 *
 * Drawer open/close state belongs to the dashboard shell rather than the
 * legacy feature monolith. Navigation only projects existing DashboardView
 * and callback contracts; it does not authorize domain actions.
 */
export function DashboardNavigation(props: DashboardNavigationProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="p-2 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:border-aif-gold-DEFAULT/45 text-white/90 hover:text-aif-gold-DEFAULT transition-all flex items-center justify-center gap-1 group shadow-[0_0_15px_rgba(255,255,255,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
        aria-label="Hauptmenü öffnen"
        aria-expanded={open}
      >
        <Menu size={20} className="group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline text-[11px] font-mono tracking-widest uppercase pr-1 font-bold">Menü</span>
      </button>

      <DashboardDrawer {...props} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
