import { DASHBOARD_VIEWS, type DashboardView } from '../dashboard/dashboardViews';

export const DASHBOARD_VIEW_SEARCH_PARAM = 'view';
export const DASHBOARD_HISTORY_STATE_KEY = 'capitalAiDashboardView';

const DASHBOARD_VIEW_SET = new Set<string>(DASHBOARD_VIEWS);

export function isDashboardView(value: string | null): value is DashboardView {
  return value !== null && DASHBOARD_VIEW_SET.has(value);
}

export function readDashboardView(search: string): DashboardView {
  const candidate = new URLSearchParams(search).get(DASHBOARD_VIEW_SEARCH_PARAM);
  return isDashboardView(candidate) ? candidate : 'dashboard';
}

export function buildDashboardViewUrl(
  href: string,
  view: DashboardView,
  removeSearchParams: readonly string[] = [],
): string {
  const url = new URL(href);

  for (const parameter of removeSearchParams) {
    url.searchParams.delete(parameter);
  }

  if (view === 'dashboard') {
    url.searchParams.delete(DASHBOARD_VIEW_SEARCH_PARAM);
  } else {
    url.searchParams.set(DASHBOARD_VIEW_SEARCH_PARAM, view);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function mergeDashboardHistoryState(
  currentState: unknown,
  view: DashboardView,
): Record<string, unknown> {
  const preservedState = (
    currentState !== null
    && typeof currentState === 'object'
    && !Array.isArray(currentState)
  )
    ? currentState as Record<string, unknown>
    : {};

  return {
    ...preservedState,
    [DASHBOARD_HISTORY_STATE_KEY]: view,
  };
}
