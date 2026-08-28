const HCAPTCHA_SCRIPT_ID = 'capital-ai-hcaptcha-sdk';
const HCAPTCHA_READY_CALLBACK = '__capitalAiHcaptchaReady';
const HCAPTCHA_SCRIPT_SRC =
  `https://js.hcaptcha.com/1/api.js?render=explicit&recaptchacompat=off&onload=${HCAPTCHA_READY_CALLBACK}`;
const HCAPTCHA_LOAD_TIMEOUT_MS = 12_000;

interface HcaptchaApi {
  render: (
    container: HTMLElement,
    params: {
      sitekey: string;
      size: 'invisible';
      theme: 'dark';
    },
  ) => string | number;
  execute: (
    widgetId: string | number,
    options: { async: true },
  ) => Promise<{ response: string; key?: string }>;
  reset: (widgetId: string | number) => void;
  remove?: (widgetId: string | number) => void;
}

declare global {
  interface Window {
    hcaptcha?: HcaptchaApi;
    __capitalAiHcaptchaReady?: () => void;
  }
}

let sdkPromise: Promise<HcaptchaApi> | null = null;

function configuredSiteKey(): string {
  return String((import.meta as any).env?.VITE_HCAPTCHA_SITE_KEY || '').trim();
}

function waitForSdk(): Promise<HcaptchaApi> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.reject(new Error('CAPTCHA ist nur in einer Browser-Sitzung verfügbar.'));
  }

  if (window.hcaptcha) return Promise.resolve(window.hcaptcha);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<HcaptchaApi>((resolve, reject) => {
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      delete window.__capitalAiHcaptchaReady;

      if (error) {
        document.getElementById(HCAPTCHA_SCRIPT_ID)?.remove();
        sdkPromise = null;
        reject(error);
        return;
      }
      if (!window.hcaptcha) {
        document.getElementById(HCAPTCHA_SCRIPT_ID)?.remove();
        sdkPromise = null;
        reject(new Error('hCaptcha wurde geladen, aber die Browser-API ist nicht verfügbar.'));
        return;
      }
      resolve(window.hcaptcha);
    };

    window.__capitalAiHcaptchaReady = () => finish();

    const timeoutId = window.setTimeout(() => {
      finish(new Error('hCaptcha konnte nicht rechtzeitig geladen werden.'));
    }, HCAPTCHA_LOAD_TIMEOUT_MS);

    const existing = document.getElementById(HCAPTCHA_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener(
        'error',
        () => finish(new Error('hCaptcha-Sicherheitsmodul konnte nicht geladen werden.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.id = HCAPTCHA_SCRIPT_ID;
    script.src = HCAPTCHA_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      'error',
      () => finish(new Error('hCaptcha-Sicherheitsmodul konnte nicht geladen werden.')),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return sdkPromise;
}

/**
 * Starts loading the hCaptcha browser SDK without requesting or persisting a challenge token.
 *
 * This is a latency optimization only. Missing public configuration remains fail-closed in
 * requestHcaptchaToken(), and every protected authentication request still obtains a fresh token.
 */
export async function preloadHcaptchaSdk(): Promise<void> {
  if (!configuredSiteKey()) return;
  await waitForSdk();
}

/**
 * Obtains one short-lived hCaptcha token for a user-initiated Supabase Auth request.
 *
 * The public site key is build-time client configuration. The hCaptcha secret remains solely in
 * Supabase Auth. Tokens are returned directly to the caller and are never persisted or logged.
 */
export async function requestHcaptchaToken(): Promise<string> {
  const sitekey = configuredSiteKey();
  if (!sitekey) {
    throw new Error(
      'CAPTCHA-Schutz ist aktiv, aber VITE_HCAPTCHA_SITE_KEY fehlt in der Website-Konfiguration.',
    );
  }

  const hcaptcha = await waitForSdk();
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.position = 'fixed';
  container.style.width = '1px';
  container.style.height = '1px';
  container.style.overflow = 'hidden';
  container.style.pointerEvents = 'none';
  container.style.opacity = '0';
  document.body.appendChild(container);

  let widgetId: string | number | null = null;
  try {
    widgetId = hcaptcha.render(container, {
      sitekey,
      size: 'invisible',
      theme: 'dark',
    });
    const result = await hcaptcha.execute(widgetId, { async: true });
    const token = String(result?.response || '').trim();
    if (!token) {
      throw new Error('hCaptcha hat keinen gültigen Verifikationstoken geliefert.');
    }
    return token;
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error(`hCaptcha-Verifikation fehlgeschlagen: ${String(err)}`);
  } finally {
    if (widgetId !== null) {
      try {
        if (typeof hcaptcha.remove === 'function') hcaptcha.remove(widgetId);
        else hcaptcha.reset(widgetId);
      } catch {
        // Cleanup must never mask the authentication result.
      }
    }
    container.remove();
  }
}
