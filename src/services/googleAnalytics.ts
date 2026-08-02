declare global {
  interface Window {
    dataLayer: unknown[][];
  }
}

// ADR-fähig: GA darf laut docs/runbooks/GOOGLE_ANALYTICS_SETUP.md ausschließlich nach aktiver
// Opt-in-Einwilligung (CookieConsentBanner) geladen werden, niemals beim App-Start. Ohne gesetzte
// Measurement-ID bleibt Tracking vollständig deaktiviert (fail-closed, kein Fallback-Tracking-ID).
const MEASUREMENT_ID = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID as string | undefined;

let loaded = false;

export function isGoogleAnalyticsConfigured(): boolean {
  return Boolean(MEASUREMENT_ID);
}

export function loadGoogleAnalytics(): void {
  if (loaded || !MEASUREMENT_ID || typeof document === 'undefined') return;
  loaded = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  const gtag = (...args: unknown[]) => {
    window.dataLayer.push(args);
  };
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { anonymize_ip: true });
}

// GA lässt sich nach dem Laden nicht aus dem DOM entfernen, aber gtag respektiert dieses von
// Google dokumentierte Opt-out-Flag und stoppt jede weitere Datenerfassung/-übertragung.
export function unloadGoogleAnalytics(): void {
  if (!MEASUREMENT_ID || typeof window === 'undefined') return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${MEASUREMENT_ID}`] = true;
}
