declare global {
  interface Window {
    cookiehub?: {
      hasConsented: (category: string) => boolean;
      openSettings: (tab?: string) => void;
    };
  }
}

// Das eigentliche Laden/Entladen von Google Analytics anhand der CookieHub-Einwilligung passiert
// als Inline-Script direkt in index.html (siehe dort) - nicht hier im React-Bundle. Grund: die
// Consent-Listener muessen registriert sein, BEVOR CookieHub bei DOMContentLoaded seinen initialen
// Status feuert; ein React `useEffect` haengt erst nach dem ersten Render+Commit an und wuerde
// dieses erste Event fuer wiederkehrende Besucher mit bereits gespeicherter Einwilligung verpassen.
export function openCookieHubSettings(): void {
  window.cookiehub?.openSettings();
}
