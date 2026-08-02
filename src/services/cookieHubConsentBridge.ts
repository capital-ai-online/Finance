import { loadGoogleAnalytics, unloadGoogleAnalytics } from './googleAnalytics';

declare global {
  interface Window {
    cookiehub?: {
      hasConsented: (category: string) => boolean;
      openSettings: (tab?: string) => void;
    };
  }
}

const ANALYTICS_CATEGORY = 'analytics';

function syncGoogleAnalyticsConsent(): void {
  if (!window.cookiehub) return;
  if (window.cookiehub.hasConsented(ANALYTICS_CATEGORY)) {
    loadGoogleAnalytics();
  } else {
    unloadGoogleAnalytics();
  }
}

// CookieHub (siehe index.html) laedt asynchron und verwaltet Banner/Speicherung der Entscheidung
// selbst. Wir reagieren nur auf dessen Events, statt GA jemals unconditioniert beim App-Start zu
// laden - bleibt fail-closed, falls das CookieHub-Skript blockiert wird (Adblocker o.ae.).
export function initCookieHubAnalyticsBridge(): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('cookiehub_onInitialise', syncGoogleAnalyticsConsent);
  window.addEventListener('cookiehub_onStatusChange', syncGoogleAnalyticsConsent);
  return () => {
    window.removeEventListener('cookiehub_onInitialise', syncGoogleAnalyticsConsent);
    window.removeEventListener('cookiehub_onStatusChange', syncGoogleAnalyticsConsent);
  };
}

export function openCookieHubSettings(): void {
  window.cookiehub?.openSettings();
}
