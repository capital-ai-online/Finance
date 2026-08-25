import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serverEntry = readFileSync(new URL('../../server.ts', import.meta.url), 'utf8');
const serverApplication = readFileSync(new URL('../../server.application.ts', import.meta.url), 'utf8');
const logger = readFileSync(new URL('../../server/logger.ts', import.meta.url), 'utf8');
const securityResponse = readFileSync(new URL('../../server/securityResponse.ts', import.meta.url), 'utf8');
const extractedSecurityHeaders = readFileSync(
  new URL('../../server/middleware/securityHeaders.ts', import.meta.url),
  'utf8',
);
const runbook = readFileSync(
  new URL('../../docs/runbooks/DOMAIN_MAIL_SECURITY_HARDENING_2026-08-25.md', import.meta.url),
  'utf8',
);

test('production web security checks follow the canonical runtime response path', () => {
  assert.match(serverEntry, /import '\.\/server\.application';/);
  assert.match(serverApplication, /import \{ createLogger, requestContext \} from '\.\/server\/logger';/);
  assert.match(serverApplication, /app\.use\(requestContext\);/);
  assert.match(logger, /import \{ attachSecurityResponseContext \} from '\.\/securityResponse';/);
  assert.match(logger, /attachSecurityResponseContext\(req, res\);/);

  assert.match(securityResponse, /buildBaselineProductionCsp/);
  assert.match(securityResponse, /buildStrictProductionCsp/);
  assert.match(securityResponse, /DEFAULT_PRODUCTION_CSP_MODE: ProductionCspMode = 'report-only'/);
  assert.match(securityResponse, /Content-Security-Policy/);
  assert.match(securityResponse, /Content-Security-Policy-Report-Only/);
  assert.match(securityResponse, /X-CSP-Policy/);
  assert.match(securityResponse, /X-CSP-Mode/);
  assert.match(securityResponse, /object-src 'none'/);
  assert.match(securityResponse, /frame-ancestors 'self'/);
  assert.match(securityResponse, /nonce-\$\{nonce\}/);

  assert.match(serverApplication, /app\.disable\('x-powered-by'\)/);
  assert.match(serverApplication, /X-Content-Type-Options', 'nosniff'/);
  assert.match(serverApplication, /Referrer-Policy', 'strict-origin-when-cross-origin'/);
  assert.match(serverApplication, /X-Frame-Options', 'SAMEORIGIN'/);
  assert.match(serverApplication, /Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'/);

  const requestContextAt = serverApplication.indexOf('app.use(requestContext);');
  const compatibilityCspAt = serverApplication.indexOf("'Content-Security-Policy'");
  assert.ok(requestContextAt >= 0, 'requestContext must be mounted');
  assert.ok(
    compatibilityCspAt > requestContextAt,
    'canonical security response context must be attached before the compatibility CSP setter',
  );

  assert.ok(
    extractedSecurityHeaders.includes('The active server entry point is') &&
      extractedSecurityHeaders.includes('not switched in this phase'),
    'extracted securityHeaders middleware must not be mistaken for the active runtime authority',
  );
});

test('runbook names the canonical security and governance authorities', () => {
  for (const expected of [
    '/AGENTS.md',
    'AUTH-GOV-AGENT-TRUST-ROOT',
    'docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md',
    'AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION',
    'server.ts',
    'server.application.ts',
    'server/logger.ts',
    'server/securityResponse.ts',
    'ADR-0013',
    'ADR-0040',
  ]) {
    assert.ok(runbook.includes(expected), `missing canonical authority/path: ${expected}`);
  }
});

test('domain hardening runbook preserves minimal Render CAA and IPv6 safety invariants', () => {
  for (const expected of [
    '@ CAA 0 issue "letsencrypt.org"',
    '@ CAA 0 issue "pki.goog"',
    'issuewild',
    'verifizierter Render-Wildcard-Scope',
    'PROVIDER_EXCEPTION_RENDER_IPV4',
    'keinen AAAA-Record hinzufügen',
  ]) {
    assert.ok(runbook.includes(expected), `missing hardening invariant: ${expected}`);
  }

  assert.doesNotMatch(
    runbook,
    /pki\.goog;\s*cansignhttpexchanges=yes/,
    'normal Render TLS must not inherit the SXG-specific Google CAA parameter',
  );
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
