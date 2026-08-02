export type ConsentStatus = 'accepted' | 'declined';

const STORAGE_KEY = 'capital_ai_cookie_consent';
const REOPEN_EVENT = 'capital-ai:cookie-consent:reopen';

export function getStoredConsent(): ConsentStatus | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'accepted' || value === 'declined' ? value : null;
}

export function setStoredConsent(status: ConsentStatus): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, status);
}

// Lässt Nutzer ihre Cookie-Entscheidung nachträglich ändern (z.B. Link in der
// Datenschutzerklärung), ohne dass die Banner-Komponente den Aufrufer kennen muss.
export function reopenCookieBanner(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(REOPEN_EVENT));
}

export function onReopenCookieBanner(handler: () => void): () => void {
  window.addEventListener(REOPEN_EVENT, handler);
  return () => window.removeEventListener(REOPEN_EVENT, handler);
}
