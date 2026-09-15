declare global {
  interface Window {
    CookieConsent?: {
      showPreferences: () => void;
      validConsent: () => boolean;
      acceptedCategory: (category: string) => boolean;
    };
  }
}

export function openCookieConsentSettings(): void {
  window.CookieConsent?.showPreferences();
}

// Compatibility export for current and parallel Login/Landing consumers.
// No CookieHub SDK, state or second consent authority is retained.
export const openCookieHubSettings = openCookieConsentSettings;
