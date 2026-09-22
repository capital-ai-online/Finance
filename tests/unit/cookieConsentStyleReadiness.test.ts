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
  analyticsConsent = false,
} = {}) {
  const vendorStyle = createStylesheet(vendorReady);
  const themeStyle = createStylesheet(themeReady);
  const elements: Array<ReturnType<typeof createElement>> = [];
  const errors: unknown[][] = [];
  const accepted: unknown[] = [];
  let runCount = 0;
  let config: Record<string, unknown> | undefined;
  let hasConsent = validConsent;
  let analyticsAccepted = analyticsConsent;

  const styles = new Map<string, ReturnType<typeof createStylesheet>>([
    ['cookieconsent-vendor-style', vendorStyle],
  ]);
  if (!omitTheme) styles.set('cookieconsent-theme-style', themeStyle);

  function createElement(tagName = 'div') {
    const listeners = new Map<string, Listener>();
    const children: unknown[] = [];
    const attrs = new Map<string, string>();
    const element = {
      tagName,
      id: undefined as string | undefined,
      className: undefined as string | undefined,
      type: undefined as string | undefined,
      textContent: undefined as string | undefined,
      checked: false,
      disabled: false,
      children,
      addEventListener(name: string, listener: Listener) {
        listeners.set(name, listener);
      },
      appendChild(child: unknown) {
        children.push(child);
      },
      setAttribute(name: string, value: string) {
        attrs.set(name, value);
      },
      removeAttribute(name: string) {
        attrs.delete(name);
      },
      remove() {
        const index = elements.indexOf(element);
        if (index >= 0) elements.splice(index, 1);
      },
      click() {
        listeners.get('click')?.();
      },
      focus() {},
      getAttribute(name: string) {
        return attrs.get(name) ?? null;
      },
    };
    return element;
  }

  const document = {
    cookie: validConsent ? 'capital_ai_consent_v3=stored-choice' : '',
    getElementById(id: string) {
      return styles.get(id) ?? elements.find((element) => element.id === id) ?? null;
    },
    createElement,
    body: {
      appendChild(element: ReturnType<typeof createElement>) {
        elements.push(element);
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
      showPreferences() {
        throw new Error('Vendor preferences UI must not be used by the CAPITAL-AI settings path.');
      },
      validConsent() {
        return hasConsent;
      },
      acceptedCategory(category: string) {
        return category === 'analytics' && analyticsAccepted;
      },
      acceptCategory(value: unknown) {
        accepted.push(value);
        hasConsent = true;
        analyticsAccepted = value === 'all';
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
    elements,
    errors,
    accepted,
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
    expect(r.elements.some((element) => element.id === 'capital-ai-cookie-settings')).toBe(true);
    expect(r.elements.some((element) => element.id === 'capital-ai-cookie-panel')).toBe(false);

    const init = fs.readFileSync('public/cookieconsent-init.js', 'utf8');
    expect(init).toContain('lazyHtmlGeneration: true');
    expect(init).toContain('autoShow: false');
    expect(init).toContain('if (hasStoredConsentCookie())');
    expect(init).not.toContain('installFirstVisitNotice');
    expect(init).not.toContain('consent.showPreferences()');
  });

  it('opens the native settings surface without using the vendor preferences overlay', async () => {
    const r = runtime({ vendorReady: true, themeReady: true });
    await r.flush();

    r.elements.find((element) => element.id === 'capital-ai-cookie-settings')?.click();
    await r.flush();

    expect(r.runCount).toBe(1);
    expect(r.elements.some((element) => element.id === 'capital-ai-cookie-panel')).toBe(true);
    expect(r.elements.some((element) => element.id === 'capital-ai-cookie-analytics')).toBe(true);
    expect(r.elements.some((element) => element.id === 'capital-ai-cookie-save')).toBe(true);
  });

  it('saves an Analytics opt-in through the canonical CookieConsent category API', async () => {
    const r = runtime({ vendorReady: true, themeReady: true });
    await r.flush();

    r.elements.find((element) => element.id === 'capital-ai-cookie-settings')?.click();
    await r.flush();

    const analytics = r.elements.find((element) => element.id === 'capital-ai-cookie-analytics');
    const save = r.elements.find((element) => element.id === 'capital-ai-cookie-save');
    expect(analytics).toBeTruthy();
    expect(save).toBeTruthy();

    if (analytics) analytics.checked = true;
    save?.click();

    expect(r.accepted).toEqual(['all']);
    expect(r.elements.some((element) => element.id === 'capital-ai-cookie-panel')).toBe(false);
  });

  it('saves a necessary-only choice without enabling analytics', async () => {
    const r = runtime({ vendorReady: true, themeReady: true });
    await r.flush();

    r.elements.find((element) => element.id === 'capital-ai-cookie-settings')?.click();
    await r.flush();
    r.elements.find((element) => element.id === 'capital-ai-cookie-save')?.click();

    expect(r.accepted).toEqual([[]]);
    expect(r.elements.some((element) => element.id === 'capital-ai-cookie-panel')).toBe(false);
  });

  it('restores a previously stored analytics choice into the native checkbox', async () => {
    const r = runtime({
      vendorReady: true,
      themeReady: true,
      validConsent: true,
      analyticsConsent: true,
    });
    await r.flush();

    expect(r.runCount).toBe(1);
    r.elements.find((element) => element.id === 'capital-ai-cookie-settings')?.click();
    await r.flush();

    expect(r.elements.find((element) => element.id === 'capital-ai-cookie-analytics')?.checked).toBe(true);
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
    expect(r.elements.some((element) => element.id === 'capital-ai-cookie-settings')).toBe(true);
    expect(String(r.errors[0]?.[1])).toContain('Required stylesheet missing');
  });

  it('makes the native settings surface explicitly pointer-interactive without a full-page overlay', () => {
    const theme = fs.readFileSync('public/cookieconsent-theme.css', 'utf8');
    expect(theme).toMatch(/#capital-ai-cookie-panel\s*\{[\s\S]*pointer-events:\s*auto;/);
    expect(theme).toMatch(/#capital-ai-cookie-panel \.capital-ai-cookie-panel__button\s*\{[\s\S]*pointer-events:\s*auto;/);
    expect(theme).not.toContain('#capital-ai-cookie-panel::before');
  });
});
