import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serverApplication = readFileSync(new URL('../../server.application.ts', import.meta.url), 'utf8');
const runbook = readFileSync(
  new URL('../../docs/runbooks/DOMAIN_MAIL_SECURITY_HARDENING_2026-08-25.md', import.meta.url),
  'utf8',
);

test('production web security headers remain explicitly enforced', () => {
  assert.match(serverApplication, /app\.disable\('x-powered-by'\)/);
  assert.match(serverApplication, /X-Content-Type-Options', 'nosniff'/);
  assert.match(serverApplication, /Referrer-Policy', 'strict-origin-when-cross-origin'/);
  assert.match(serverApplication, /X-Frame-Options', 'SAMEORIGIN'/);
  assert.match(serverApplication, /Content-Security-Policy/);
  assert.match(serverApplication, /frame-ancestors/);
  assert.match(serverApplication, /Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'/);

  const productionScriptSrc =
    "? \"'self' https://*.stripe.com https://cdn.cookiehub.eu https://www.googletagmanager.com\"";
  assert.ok(
    serverApplication.includes(productionScriptSrc),
    'production script-src must keep the explicit allowlist without unsafe-inline/unsafe-eval',
  );
});

test('domain hardening runbook preserves Render CAA and IPv6 safety invariants', () => {
  for (const expected of [
    '@ CAA 0 issue "letsencrypt.org"',
    '@ CAA 0 issuewild "letsencrypt.org"',
    '@ CAA 0 issue "pki.goog; cansignhttpexchanges=yes"',
    '@ CAA 0 issuewild "pki.goog; cansignhttpexchanges=yes"',
    'PROVIDER_EXCEPTION_RENDER_IPV4',
    'keinen AAAA-Record hinzufügen',
  ]) {
    assert.ok(runbook.includes(expected), `missing hardening invariant: ${expected}`);
  }
});

test('mail enforcement stays staged and protected by explicit mutation gates', () => {
  for (const expected of [
    'p=none',
    'p=quarantine',
    'pct=25',
    'p=reject',
    'mode: testing',
    'mode: enforce',
    'PLANNED / OWNER MUTATION REQUIRED',
    'HUMAN APPROVED',
    'MUTATED',
    'VERIFIED PASS',
  ]) {
    assert.ok(runbook.includes(expected), `missing staged enforcement or mutation gate: ${expected}`);
  }

  assert.match(runbook, /Private Keys.*niemals in Repository-Evidence/s);
  assert.match(runbook, /keine frei erfundenen Key-Tags\/Digests/);
});
