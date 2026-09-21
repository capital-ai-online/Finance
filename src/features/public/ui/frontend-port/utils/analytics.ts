export interface PresentationEventParams {
  category?: string;
  label?: string;
  value?: number;
  destination?: string;
  [key: string]: unknown;
}

/**
 * Presentation-only analytics bridge for the mirrored FRONTEND components.
 *
 * Upstream Header/Footer may emit interaction intent, but this adapter deliberately
 * does not load third-party analytics scripts, set cookies, or mutate SEO metadata.
 * Finance-owned analytics/consent infrastructure may subscribe to this event later.
 */
export function trackEvent(action: string, params: PresentationEventParams = {}) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('capital-ai:presentation-event', {
      detail: { action, ...params },
    }),
  );
}

export function trackLoginClick(source: string = 'header') {
  trackEvent('login_button_click', {
    category: 'authentication',
    label: `login_source_${source}`,
    destination: '/login',
  });
}
