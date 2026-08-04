declare global {
  interface Window {
    cookiehub?: {
      hasConsented: (category: string) => boolean;
      openSettings: (tab?: string) => void;
    };
  }
}

// Das Laden von GA4/AdSense sowie das Mapping auf Google Consent Mode v2 erfolgt bewusst
// ausserhalb des React-Bundles in public/google-analytics-consent.js. Dort werden die
// CookieHub-Listener bereits waehrend der <head>-Verarbeitung am document registriert, bevor
// CookieHub bei DOMContentLoaded initialisiert wird. Ein React useEffect waere dafuer zu spaet
// und koennte den gespeicherten Initialstatus wiederkehrender Besucher verpassen.
export function openCookieHubSettings(): void {
  window.cookiehub?.openSettings();
}
