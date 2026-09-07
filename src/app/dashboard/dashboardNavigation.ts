import type { DashboardSection, DashboardView } from './dashboardViews';

export interface DashboardNavigationItem {
  view: DashboardView;
  label: string;
  section: DashboardSection;
}

/**
 * App-owned presentation model for BB-2E navigation extraction.
 *
 * This file carries labels and section placement only. It intentionally owns no
 * routing, IAM, entitlement, scoring, data, or feature authority.
 */
export const DASHBOARD_NAVIGATION_ITEMS = [
  { view: 'dashboard', label: 'Dashboard Home', section: 'hub' },
  { view: 'myworkspace', label: 'Myworkspace', section: 'hub' },
  { view: 'learning', label: 'Learning', section: 'hub' },
  { view: 'universe-scoring', label: 'Universe TOP Rankings', section: 'hub' },
  { view: 'buffet-value', label: 'Buffet Value Check', section: 'hub' },
  { view: 'abonnements', label: 'Abonnements', section: 'hub' },
  { view: 'asset-universe', label: 'Multi-Asset Universum', section: 'analysis' },
  { view: 'market-screener', label: 'Profi Markt-Screener', section: 'analysis' },
  { view: 'charts', label: 'Ad-Hoc Charts', section: 'analysis' },
  { view: 'preis-alarme', label: 'Preis-Alarme', section: 'analysis' },
  { view: 'backtest', label: 'Backtest Engine', section: 'analysis' },
  { view: 'sentiment-dashboard', label: 'AI Markt-Sentiment', section: 'analysis' },
  { view: 'raw-materials', label: 'Rohstoff-Bewertung', section: 'analysis' },
  { view: 'social-accounts', label: 'Social Media Accounts', section: 'analysis' },
] as const satisfies readonly DashboardNavigationItem[];

export function getDashboardNavigationItems(section: DashboardSection) {
  return DASHBOARD_NAVIGATION_ITEMS.filter((item) => item.section === section);
}
