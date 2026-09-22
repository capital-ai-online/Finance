import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const read = (path) => fs.readFileSync(path, 'utf8');

function runtime({ valid = false, analytics = false, id = 'G-TEST123', missing = false } = {}) {
  const state = { valid, analytics, marketing: false };
  const listeners = new Map();
  const scripts = [];
  const cookieWrites = [];
  const jar = new Map([['_ga', 'old'], ['_ga_TEST', 'old'], ['session', 'keep'], ['cookiehub', 'legacy']]);
  let reloads = 0;
  const document = {
    currentScript: { nonce: 'request-nonce' },
    querySelector: (selector) => selector.includes('ga-measurement-id') ? { getAttribute: () => id } : null,
    getElementById: (id) => scripts.find((s) => s.id === id),
    createElement: () => ({ setAttribute(name, value) { this[name] = value; } }),
    head: { appendChild: (script) => scripts.push(script) },
    get cookie() { return [...jar].map(([k, v]) => k + '=' + v).join('; '); },
    set cookie(value) {
      cookieWrites.push(value);
      if (value.includes('Max-Age=0')) jar.delete(decodeURIComponent(value.split('=')[0]));
    },
  };
  const window = {
    CookieConsent: missing ? undefined : {
      validConsent: () => state.valid,
      acceptedCategory: (category) => state[category],
    },
    cookiehub: { hasConsented() { throw new Error('Legacy state must never be read'); } },
    location: { hostname: 'app.capital-ai.online', reload() { reloads++; } },
    setTimeout: (fn) => fn(),
    addEventListener(name, fn) {
      listeners.set(name, [...(listeners.get(name) || []), fn]);
    },
  };
  vm.runInNewContext(read('public/google-analytics-consent.js'), {
    window, document, console: { error() {} },
  });
  return {
    state, window, scripts, jar, cookieWrites, listeners,
    dispatch(name, detail = {}) { for (const fn of listeners.get(name) || []) fn({ detail }); },
    get reloads() { return reloads; },
    latestConsent() { return [...window.dataLayer].reverse().find((v) => v[0] === 'consent')[2]; },
  };
}

test('loads no Google tag before opt-in, even with a legacy CookieHub cookie', () => {
  const r = runtime();
  r.dispatch('cc:onConsent');
  assert.equal(r.scripts.length, 0);
  assert.equal(r.latestConsent().analytics_storage, 'denied');
  assert.equal(r.jar.get('session'), 'keep');
  assert.equal(r.jar.has('_ga'), false);
});

test('invalid and expired consent cannot grant analytics', () => {
  const r = runtime({ analytics: true });
  r.dispatch('cc:onConsent');
  assert.equal(r.scripts.length, 0);
});

test('valid analytics consent loads GA exactly once and preserves the response nonce', () => {
  const r = runtime({ valid: true, analytics: true });
  r.dispatch('cc:onConsent');
  r.dispatch('cc:onConsent');
  r.dispatch('cc:onChange');
  assert.equal(r.scripts.length, 1);
  assert.match(r.scripts[0].src, /^https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-TEST123$/);
  assert.equal(r.scripts[0].nonce, 'request-nonce');
  assert.equal(r.window['ga-disable-G-TEST123'], false);
});

test('accept all never enables AdSense or advertising consent signals', () => {
  const r = runtime({ valid: true, analytics: true });
  r.state.marketing = true;
  r.dispatch('cc:onConsent');
  r.dispatch('cc:onChange');
  assert.equal(r.scripts.length, 1);
  for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization']) {
    assert.equal(r.latestConsent()[key], 'denied');
  }
  assert.equal(r.scripts.some((s) => /adsbygoogle|googlesyndication/.test(s.src)), false);
});

test('marketing alone cannot load analytics or advertising', () => {
  const r = runtime({ valid: true });
  r.state.marketing = true;
  r.dispatch('cc:onConsent');
  assert.equal(r.scripts.length, 0);
});

test('missing or throwing SDK fails closed', () => {
  const r = runtime({ missing: true });
  r.dispatch('cc:onConsent');
  assert.equal(r.scripts.length, 0);
  r.window.CookieConsent = { validConsent() { throw new Error('bad storage'); } };
  r.dispatch('cc:onChange');
  assert.equal(r.scripts.length, 0);
});

test('truthy malformed API responses cannot authorize analytics', () => {
  const r = runtime({ valid: true, analytics: 'false' });
  r.dispatch('cc:onConsent');
  assert.equal(r.scripts.length, 0);
});

test('empty, unresolved and malformed measurement IDs never create requests', () => {
  for (const id of ['', '%VITE_GA_MEASUREMENT_ID%', 'G-x&injected=1']) {
    const r = runtime({ valid: true, analytics: true, id });
    r.dispatch('cc:onConsent');
    assert.equal(r.scripts.length, 0);
  }
});

test('editing or closing the dialog does not reload or mutate consent', () => {
  const r = runtime({ valid: true, analytics: true });
  r.dispatch('cc:onConsent');
  r.dispatch('change', { checked: false });
  r.dispatch('cc:onModalHide');
  assert.equal(r.reloads, 0);
  assert.equal(r.window['ga-disable-G-TEST123'], false);
});

test('saved analytics revocation disables GA and reloads only once', () => {
  const r = runtime({ valid: true, analytics: true });
  r.dispatch('cc:onConsent');
  r.jar.set('_ga', 'new');
  r.state.analytics = false;
  r.dispatch('cc:onChange');
  r.dispatch('cc:onChange');
  assert.equal(r.reloads, 1);
  assert.equal(r.window['ga-disable-G-TEST123'], true);
  assert.equal(r.latestConsent().analytics_storage, 'denied');
  assert.equal(r.jar.has('_ga'), false);
  assert.equal(r.jar.get('session'), 'keep');
  assert.ok(r.cookieWrites.some((c) => c.includes('domain=.capital-ai.online')));
});

test('a new document with a saved rejection starts without Google requests', () => {
  const r = runtime({ valid: true, analytics: false });
  r.dispatch('cc:onConsent');
  assert.equal(r.scripts.length, 0);
  assert.equal(r.reloads, 0);
});

test('saving unchanged analytics consent does not reload', () => {
  const r = runtime({ valid: true, analytics: true });
  r.dispatch('cc:onConsent');
  r.dispatch('cc:onChange');
  assert.equal(r.reloads, 0);
});

test('initialization config keeps opt-in and uses the native non-blocking settings panel', async () => {
  let config;
  let vendorPreferencesOpened = 0;
  const accepted = [];
  const elements = [];
  const readyStyles = new Map([
    ['cookieconsent-vendor-style', { sheet: {} }],
    ['cookieconsent-theme-style', { sheet: {} }],
  ]);

  function createElement(tagName = 'div') {
    const listeners = new Map();
    const attrs = new Map();
    const element = {
      tagName,
      id: undefined,
      className: '',
      type: '',
      textContent: '',
      checked: false,
      disabled: false,
      children: [],
      addEventListener(name, fn) { listeners.set(name, fn); },
      appendChild(child) { this.children.push(child); },
      setAttribute(name, value) { attrs.set(name, value); },
      removeAttribute(name) { attrs.delete(name); },
      remove() {
        const index = elements.indexOf(element);
        if (index >= 0) elements.splice(index, 1);
      },
      click() { listeners.get('click')?.(); },
      focus() {},
    };
    return element;
  }

  const document = {
    cookie: '',
    getElementById: (id) => readyStyles.get(id) || elements.find((e) => e.id === id) || null,
    createElement,
    body: { appendChild: (element) => elements.push(element) },
  };
  const window = { dispatchEvent() {}, CookieConsent: {
    run(value) { config = value; return Promise.resolve(); },
    showPreferences() { vendorPreferencesOpened++; },
    validConsent() { return false; },
    acceptedCategory() { return false; },
    acceptCategory(value) { accepted.push(value); },
  } };

  vm.runInNewContext(read('public/cookieconsent-init.js'), {
    window,
    document,
    console,
    CustomEvent: class { constructor(type) { this.type = type; } },
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(config, undefined);
  const trigger = elements.find((e) => e.id === 'capital-ai-cookie-settings');
  assert.ok(trigger);

  trigger.click();
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(config.mode, 'opt-in');
  assert.equal(config.revision, 1);
  assert.equal(config.autoShow, false);
  assert.equal(config.lazyHtmlGeneration, true);
  assert.equal(config.cookie.name, 'capital_ai_consent_v3');
  assert.equal(config.categories.analytics.enabled, false);
  assert.equal(config.categories.necessary.readOnly, true);
  assert.equal(config.manageScriptTags, false);
  assert.equal(vendorPreferencesOpened, 0);

  const analytics = elements.find((e) => e.id === 'capital-ai-cookie-analytics');
  const save = elements.find((e) => e.id === 'capital-ai-cookie-save');
  assert.ok(analytics);
  assert.ok(save);
  analytics.checked = true;
  save.click();

  assert.deepEqual(accepted, ['all']);
  assert.equal(elements.some((e) => e.id === 'capital-ai-cookie-panel'), false);
});

test('HTML orders consent defaults before SDK initialization and contains no legacy SDK', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('/google-analytics-consent.js') < html.indexOf('/cookieconsent-init.js'));
  assert.match(html, /defer src="\/vendor\/cookieconsent\/3.1.0\/cookieconsent.umd.js"/);
  assert.match(html, /defer src="\/cookieconsent-init.js"/);
  assert.doesNotMatch(html, /cdn\.cookiehub|src="\/cookiehub-init/);
  assert.equal(fs.existsSync('public/cookiehub-init.js'), false);
});

test('vendored JavaScript, CSS and MIT license exactly match pinned upstream blobs', () => {
  const files = {
    'cookieconsent.umd.js': '7f85a316a121b854e7647ad39a6b894e7f950b10',
    'cookieconsent.css': 'fdcc6ba6cb636090661685d4c3d4f831d6cd19ff',
    LICENSE: 'cac51b2d15105cbc66135ced5e8c9bdd01aecff8',
  };
  for (const [file, expected] of Object.entries(files)) {
    const bytes = fs.readFileSync('public/vendor/cookieconsent/3.1.0/' + file);
    const actual = crypto.createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
    assert.equal(actual, expected, file);
  }
});

test('returning valid analytics choice preserves existing GA cookies', () => {
  const r = runtime({ valid: true, analytics: true });
  r.dispatch('cc:onConsent');
  r.dispatch('capital-ai:consent-ready');
  assert.equal(r.jar.get('_ga'), 'old');
  assert.equal(r.scripts.length, 1);
});

test('SDK readiness without consent clears stale GA cookies without loading Google', () => {
  const r = runtime();
  r.dispatch('capital-ai:consent-ready');
  assert.equal(r.jar.has('_ga'), false);
  assert.equal(r.scripts.length, 0);
});

test('production policies retain self-hosted scripts, nonce and report-only defaults', async () => {
  const { buildBaselineProductionCsp, buildStrictProductionCsp, resolveProductionCspMode } =
    await import('../../server/securityResponse.ts');
  const baseline = buildBaselineProductionCsp('test-nonce');
  const strict = buildStrictProductionCsp('test-nonce');
  assert.match(baseline, /script-src 'self' 'nonce-test-nonce'/);
  assert.match(baseline, /style-src 'self'/);
  assert.match(strict, /'strict-dynamic'/);
  assert.doesNotMatch(baseline + strict, /cookiehub|unsafe-eval/);
  assert.match(baseline, /object-src 'none'/);
  assert.match(baseline, /base-uri 'none'/);
  assert.equal(resolveProductionCspMode('unknown'), 'report-only');
});
