import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

type ConsentCategory = 'analytics' | 'marketing';

function executeConsentRuntime() {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), 'public/google-analytics-consent.js'),
    'utf8',
  );

  const listeners = new Map<string, Array<(event?: unknown) => void>>();
  const scripts: Array<Record<string, any>> = [];
  const elementsById = new Map<string, Record<string, any>>();
  const consent: Record<ConsentCategory, boolean> = {
    analytics: false,
    marketing: false,
  };

  let cookieHeader = '_ga=old; _ga_TEST=old2; session=ok';
  let reloads = 0;

  const document = {
    readyState: 'loading',
    head: {
      appendChild(element: Record<string, any>) {
        scripts.push(element);
        if (element.id) elementsById.set(element.id, element);
      },
    },
    querySelector(selector: string) {
      if (selector === 'meta[name="ga-measurement-id"]') {
        return { getAttribute: () => 'G-TEST123' };
      }
      if (selector === 'meta[name="adsense-publisher-id"]') {
        return { getAttribute: () => 'ca-pub-1353017943074018' };
      }
      return null;
    },
    getElementById(id: string) {
      return elementsById.get(id) || null;
    },
    createElement(tagName: string) {
      return {
        tagName,
        attributes: {} as Record<string, string>,
        setAttribute(name: string, value: string) {
          this.attributes[name] = value;
        },
      };
    },
    addEventListener(name: string, listener: (event?: unknown) => void) {
      const registered = listeners.get(name) || [];
      registered.push(listener);
      listeners.set(name, registered);
    },
    get cookie() {
      return cookieHeader;
    },
    set cookie(value: string) {
      cookieHeader = value;
    },
  };

  const windowObject: Record<string, any> = {
    cookiehub: {
      hasConsented(category: ConsentCategory) {
        return consent[category];
      },
      isReady() {
        return true;
      },
    },
    location: {
      hostname: 'capital-ai.online',
      reload() {
        reloads += 1;
      },
    },
    setTimeout(callback: () => void) {
      callback();
      return 1;
    },
  };

  vm.runInNewContext(source, {
    window: windowObject,
    document,
    console,
    Date,
    Boolean,
    String,
    RegExp,
    encodeURIComponent,
    decodeURIComponent,
  }, { filename: 'public/google-analytics-consent.js' });

  function dispatch(name: string): void {
    for (const listener of listeners.get(name) || []) listener({ type: name });
  }

  return {
    consent,
    dispatch,
    listeners,
    scripts,
    windowObject,
    get reloads() {
      return reloads;
    },
  };
}

describe('Google marketing consent runtime', () => {
  it('sets Consent Mode v2 to denied and loads no Google tag before opt-in', () => {
    const runtime = executeConsentRuntime();

    expect(runtime.scripts).toHaveLength(0);
    expect(runtime.listeners.has('cookiehub_onInitialise')).toBe(true);
    expect(runtime.listeners.has('cookiehub_onStatusChange')).toBe(true);
    expect(runtime.listeners.has('cookiehub_onRevoke')).toBe(true);

    const defaultConsent = runtime.windowObject.dataLayer.find(
      (entry: IArguments) => entry[0] === 'consent' && entry[1] === 'default',
    );

    expect(defaultConsent).toBeDefined();
    expect(defaultConsent[2]).toMatchObject({
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });

    runtime.dispatch('cookiehub_onInitialise');
    expect(runtime.scripts).toHaveLength(0);
  });

  it('loads GA4 only for analytics consent and AdSense only for marketing consent', () => {
    const runtime = executeConsentRuntime();
    runtime.dispatch('cookiehub_onInitialise');

    runtime.consent.analytics = true;
    runtime.dispatch('cookiehub_onStatusChange');

    expect(runtime.scripts).toHaveLength(1);
    expect(runtime.scripts[0].id).toBe('capital-ai-ga4-loader');
    expect(runtime.scripts[0].src).toContain('www.googletagmanager.com/gtag/js');

    runtime.dispatch('cookiehub_onStatusChange');
    expect(runtime.scripts).toHaveLength(1);

    runtime.consent.marketing = true;
    runtime.dispatch('cookiehub_onStatusChange');

    expect(runtime.scripts).toHaveLength(2);
    expect(runtime.scripts[1].id).toBe('capital-ai-adsense-loader');
    expect(runtime.scripts[1].src).toContain('pagead2.googlesyndication.com');
    expect(runtime.scripts[1].crossOrigin).toBe('anonymous');
  });

  it('does not reload on generic CookieHub status changes while the consent UI is being edited', () => {
    const runtime = executeConsentRuntime();
    runtime.dispatch('cookiehub_onInitialise');

    runtime.consent.analytics = true;
    runtime.dispatch('cookiehub_onStatusChange');
    expect(runtime.windowObject['ga-disable-G-TEST123']).toBe(false);

    runtime.consent.analytics = false;
    runtime.dispatch('cookiehub_onStatusChange');

    expect(runtime.windowObject['ga-disable-G-TEST123']).toBe(true);
    expect(runtime.reloads).toBe(0);
  });

  it('does not reload for an explicit revoke event when analytics and marketing remain allowed', () => {
    const runtime = executeConsentRuntime();
    runtime.dispatch('cookiehub_onInitialise');

    runtime.consent.analytics = true;
    runtime.consent.marketing = true;
    runtime.dispatch('cookiehub_onStatusChange');
    expect(runtime.scripts).toHaveLength(2);

    runtime.dispatch('cookiehub_onRevoke');

    expect(runtime.windowObject['ga-disable-G-TEST123']).toBe(false);
    expect(runtime.reloads).toBe(0);
  });

  it('fails closed and reloads once after CookieHub emits a relevant explicit revocation', () => {
    const runtime = executeConsentRuntime();
    runtime.dispatch('cookiehub_onInitialise');

    runtime.consent.analytics = true;
    runtime.consent.marketing = true;
    runtime.dispatch('cookiehub_onStatusChange');
    expect(runtime.scripts).toHaveLength(2);

    runtime.consent.analytics = false;
    runtime.consent.marketing = false;
    runtime.dispatch('cookiehub_onStatusChange');
    expect(runtime.reloads).toBe(0);

    runtime.dispatch('cookiehub_onRevoke');
    runtime.dispatch('cookiehub_onRevoke');

    expect(runtime.windowObject['ga-disable-G-TEST123']).toBe(true);
    expect(runtime.reloads).toBe(1);
  });
});
