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

function runtime({ vendorReady = false, themeReady = false, omitTheme = false } = {}) {
  const vendorStyle = createStylesheet(vendorReady);
  const themeStyle = createStylesheet(themeReady);
  const buttons: Array<{ id?: string }> = [];
  const errors: unknown[][] = [];
  let runCount = 0;
  let config: Record<string, unknown> | undefined;

  const styles = new Map<string, ReturnType<typeof createStylesheet>>([
    ['cookieconsent-vendor-style', vendorStyle],
  ]);
  if (!omitTheme) styles.set('cookieconsent-theme-style', themeStyle);

  const document = {
    getElementById(id: string) {
      return styles.get(id) ?? buttons.find((button) => button.id === id) ?? null;
    },
    createElement() {
      return {
        addEventListener() {},
      };
    },
    body: {
      appendChild(button: { id?: string }) {
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

  it('keeps a fresh/private first visit non-blocking outside visible consent surfaces', async () => {
    const r = runtime({ vendorReady: true, themeReady: true });
    await r.flush();

    expect(r.runCount).toBe(1);
    expect(r.config?.disablePageInteraction).toBe(false);

    const theme = fs.readFileSync('public/cookieconsent-theme.css', 'utf8');
    expect(theme).toMatch(/#cc-main\s*\{[\s\S]*pointer-events:\s*none;/);
    expect(theme).toMatch(/#cc-main \.cm,[\s\S]*#cc-main \.pm\s*\{[\s\S]*pointer-events:\s*auto;/);
  });

  it('initializes immediately when both required stylesheets are already ready', async () => {
    const r = runtime({ vendorReady: true, themeReady: true });
    await r.flush();

    expect(r.runCount).toBe(1);
    expect(r.config?.mode).toBe('opt-in');
    expect(r.buttons).toHaveLength(1);
  });

  it('waits for both stylesheet load events before initializing', async () => {
    const r = runtime();
    await r.flush();
    expect(r.runCount).toBe(0);

    r.vendorStyle.dispatch('load');
    await r.flush();
    expect(r.runCount).toBe(0);

    r.themeStyle.dispatch('load');
    await r.flush();
    expect(r.runCount).toBe(1);
    expect(r.buttons).toHaveLength(1);
  });

  it('fails closed when a required stylesheet is missing', async () => {
    const r = runtime({ vendorReady: true, omitTheme: true });
    await r.flush();

    expect(r.runCount).toBe(0);
    expect(r.buttons).toHaveLength(0);
    expect(String(r.errors[0]?.[1])).toContain('Required stylesheet missing');
  });

  it('fails closed when a required stylesheet errors', async () => {
    const r = runtime({ vendorReady: true });
    r.themeStyle.dispatch('error');
    await r.flush();

    expect(r.runCount).toBe(0);
    expect(r.buttons).toHaveLength(0);
    expect(String(r.errors[0]?.[1])).toContain('Required stylesheet failed to load');
  });
});
