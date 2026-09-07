export const DASHBOARD_VIEWS = [
  'dashboard',
  'myworkspace',
  'learning',
  'universe-scoring',
  'buffet-value',
  'backtest',
  'heatmap',
  'market-screener',
  'abonnements',
  'profil',
  'markdown-orchestrator',
  'interact',
  'charts',
  'request-orchestrator',
  'performance',
  'risiko-assessment',
  'admin-panel',
  'preis-alarme',
  'audit-logs',
  'sentiment-dashboard',
  'raw-materials',
  'asset-universe',
  'defi-orchestration',
  'social-accounts',
  'login',
  'auth-debugger',
  'admin-portal',
] as const;

export type DashboardView = (typeof DASHBOARD_VIEWS)[number];

export type DashboardSection = 'hub' | 'analysis' | 'system_admin';

/**
 * Presentation-only ownership of the dashboard navigation accordion.
 *
 * BB-2E keeps this mapping as the single section contract consumed by the
 * drawer and by active-view auto-expansion. It does not define feature, IAM,
 * entitlement, scoring, or runtime authority.
 */
export const DASHBOARD_VIEW_SECTION = {
  dashboard: 'hub',
  myworkspace: 'hub',
  learning: 'hub',
  'universe-scoring': 'hub',
  'buffet-value': 'hub',
  backtest: 'analysis',
  heatmap: 'analysis',
  'market-screener': 'analysis',
  abonnements: 'hub',
  profil: 'hub',
  'markdown-orchestrator': 'system_admin',
  interact: 'hub',
  charts: 'analysis',
  'request-orchestrator': 'system_admin',
  performance: 'system_admin',
  'risiko-assessment': 'analysis',
  'admin-panel': 'system_admin',
  'preis-alarme': 'analysis',
  'audit-logs': 'system_admin',
  'sentiment-dashboard': 'analysis',
  'raw-materials': 'analysis',
  'asset-universe': 'analysis',
  'defi-orchestration': 'hub',
  'social-accounts': 'analysis',
  login: 'hub',
  'auth-debugger': 'system_admin',
  'admin-portal': 'system_admin',
} as const satisfies Record<DashboardView, DashboardSection>;

export function getDashboardSection(view: DashboardView): DashboardSection {
  return DASHBOARD_VIEW_SECTION[view];
}
