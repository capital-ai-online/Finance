declare global {
  interface Window {
    CookieConsent?: {
      showPreferences: () => void;
      validConsent: () => boolean;
      acceptedCategory: (category: string) => boolean;
    };
    CapitalAIConsent?: {
      openSettings: () => void;
    };
  }
}

export function openCookieConsentSettings(): void {
  const trigger = document.getElementById('capital-ai-cookie-settings') as HTMLButtonElement | null;
  if (trigger) {
    trigger.click();
    return;
  }

  window.CapitalAIConsent?.openSettings();
}

// Compatibility export for current and parallel Login/Landing consumers.
// No CookieHub SDK, state or second consent authority is retained.
export const openCookieHubSettings = openCookieConsentSettings;
