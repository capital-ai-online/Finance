import type { DashboardView } from './dashboardViews';

export const DASHBOARD_ROUTED_VIEWS = [
  'learning',
  'universe-scoring',
  'buffet-value',
  'backtest',
  'market-screener',
  'heatmap',
  'charts',
  'abonnements',
  'sentiment-dashboard',
  'profil',
  'admin-portal',
  'preis-alarme',
  'raw-materials',
  'asset-universe',
  'defi-orchestration',
  'social-accounts',
  'risiko-assessment',
  'interact',
  'login',
] as const satisfies readonly DashboardView[];

export type DashboardRoutedView = (typeof DASHBOARD_ROUTED_VIEWS)[number];

export function isDashboardRoutedView(view: DashboardView): view is DashboardRoutedView {
  return (DASHBOARD_ROUTED_VIEWS as readonly DashboardView[]).includes(view);
}
