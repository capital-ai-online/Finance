import fs from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync('public/cookieconsent-init.js', 'utf8');

type Listener = () => void;

function createStylesheet(initiallyReady = false) {
  let sheet: object | null = initiallyReady ? {} : null;
  const listeners = new Map<string, Set<Listener>>();

  return {
    get sheet() {
      return sheet;
    },
    addEventListener(name: string, listener: Listener) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name)?.add(listener);
    },
    removeEventListener(name: string, listener: Listener) {
      listeners.get(name)?.delete(listener);
    },
    dispatch(name: 'load' | 'error') {
      if (name === 'load') sheet = {};
      for (const listener of [...(listeners.get(name) ?? [])]) listener();
    },
  };
}

function runtime({
  vendorReady = false,
  themeReady = false,
  omitTheme = false,
  validConsent = false,
} = {}) {
  const vendorStyle = createStylesheet(vendorReady);
  const themeStyle = createStylesheet(themeReady);
  const buttons: Array<{ id?: string; click?: () => void }> = [];
  const errors: unknown[][] = [];
  let runCount = 0;
  let config: Record<string, unknown> | undefined;
  let hasConsent = validConsent;

  const styles = new Map<string, ReturnType<typeof createStylesheet>>([
    ['cookieconsent-vendor-style', vendorStyle],
  ]);
  if (!omitTheme) styles.set('cookieconsent-theme-style', themeStyle);

  function createElement() {
    const listeners = new Map<string, Listener>();
    const children: unknown[] = [];
    return {
      id: undefined as string | undefined,
      className: undefined as string | undefined,
      type: undefined as string | undefined,
      textContent: undefined as string | undefined,
      children,
      addEventListener(name: string, listener: Listener) {
        listeners.set(name, listener);
      },
      appendChild(child: unknown) {
        children.push(child);
      },
      setAttribute() {},
      remove() {},
      click() {
        listeners.get('click')?.();
      },
    };
  }

  const document = {
    cookie: validConsent ? 'capital_ai_consent_v3=stored-choice' : '',
    getElementById(id: string) {
      return styles.get(id) ?? buttons.find((button) => button.id === id) ?? null;
    },
    createElement,
    body: {
      appendChild(button: ReturnType<typeof createElement>) {
        buttons.push(button);
      },
    },
  };

  const window = {
    dispatchEvent() {},
    CookieConsent: {
      run(value: Record<string, unknown>) {
        runCount += 1;
        config = value;
        return Promise.resolve();
      },
      showPreferences() {},
      validConsent() {
        return hasConsent;
      },
      acceptCategory() {
        hasConsent = true;
      },
    },
  };

  vm.runInNewContext(source, {
    window,
    document,
    console: {
      error(...args: unknown[]) {
        errors.push(args);
      },
    },
    CustomEvent: class {
      constructor(public type: string) {}
    },
  });

  async function flush() {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise((resolve) => setImmediate(resolve));
  }

  return {
    vendorStyle,
    themeStyle,
    buttons,
    errors,
    flush,
    get runCount() {
      return runCount;
    },
    get config() {
      return config;
    },
  };
}

describe('CookieConsent stylesheet readiness', () => {
  it('marks both consent stylesheets as required readiness inputs', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    expect(html).toContain('id="cookieconsent-vendor-style"');
    expect(html).toContain('id="cookieconsent-theme-style"');
  });

  it('keeps a fresh/private first visit completely outside the vendor runtime', async () => {
    const r = runtime({ vendorReady: true, themeReady: true });
    await r.flush();

    expect(r.runCount).toBe(0);
    expect(r.buttons).toHaveLength(1);

    const init = fs.readFileSync('public/cookieconsent-init.js', 'utf8');
    expect(init).toContain('lazyHtmlGeneration: true');
    expect(init).toContain('autoShow: false');
    expect(init).toContain('if (hasStoredConsentCookie())');
    expect(init).not.toContain('installFirstVisitNotice');
    expect(init).not.toContain('capital-ai-consent-notice');

    const theme = fs.readFileSync('public/cookieconsent-theme.css', 'utf8');
    expect(theme).not.toContain('#capital-ai-consent-notice');
  });

  it('initializes CookieConsent only after an explicit settings click on a fresh visit', async () => {
    const r = runtime({ vendorReady: true, themeReady: true });
    await r.flush();
    expect(r.runCount).toBe(0);

    r.buttons[0]?.click?.();
    await r.flush();

    expect(r.runCount).toBe(1);
    expect(r.config?.mode).toBe('opt-in');
    expect(r.config?.disablePageInteraction).toBe(false);
    expect(r.config?.autoShow).toBe(false);
    expect(r.config?.lazyHtmlGeneration).toBe(true);
  });

  it('restores a previously stored consent choice without showing startup UI', async () => {
    const r = runtime({ vendorReady: true, themeReady: true, validConsent: true });
    await r.flush();

    expect(r.runCount).toBe(1);
    expect(r.config?.mode).toBe('opt-in');
    expect(r.config?.autoShow).toBe(false);
    expect(r.config?.lazyHtmlGeneration).toBe(true);
    expect(r.buttons).toHaveLength(1);
  });

  it('waits for required stylesheets only when a stored choice requires vendor initialization', async () => {
    const r = runtime({ validConsent: true });
    await r.flush();
    expect(r.runCount).toBe(0);

    r.vendorStyle.dispatch('load');
    await r.flush();
    expect(r.runCount).toBe(0);

    r.themeStyle.dispatch('load');
    await r.flush();
    expect(r.runCount).toBe(1);
  });

  it('keeps the page available when returning-consent initialization lacks a required stylesheet', async () => {
    const r = runtime({ vendorReady: true, omitTheme: true, validConsent: true });
    await r.flush();

    expect(r.runCount).toBe(0);
    expect(r.buttons).toHaveLength(1);
    expect(String(r.errors[0]?.[1])).toContain('Required stylesheet missing');
  });

  it('keeps the page available when returning-consent stylesheet loading fails', async () => {
    const r = runtime({ vendorReady: true, validConsent: true });
    r.themeStyle.dispatch('error');
    await r.flush();

    expect(r.runCount).toBe(0);
    expect(r.buttons).toHaveLength(1);
    expect(String(r.errors[0]?.[1])).toContain('Required stylesheet failed to load');
  });
});
