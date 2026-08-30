import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const serverEntry = readFileSync(new URL('../../server.ts', import.meta.url), 'utf8');
const serverApplication = readFileSync(new URL('../../server.application.ts', import.meta.url), 'utf8');
const logger = readFileSync(new URL('../../server/logger.ts', import.meta.url), 'utf8');
const securityResponse = readFileSync(new URL('../../server/securityResponse.ts', import.meta.url), 'utf8');
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
  assert.match(securityResponse, /DEFAULT_PRODUCTION_CSP_MODE: ProductionCspMode = 'strict'/);
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

  assert.ok(serverApplication.includes('app.use(requestContext);'), 'requestContext must be mounted');

  // F-04: Zuvor genuegte es, dass der kanonische Response-Context VOR dem Kompatibilitaets-CSP-
  // Setter montiert war - die Haertung hing damit allein an der Middleware-Reihenfolge. Der
  // Kompatibilitaets-Setter ist entfernt; die Invariante ist jetzt strenger und nicht mehr von
  // einer Reihenfolge abhaengig: server.application.ts setzt ueberhaupt keine CSP.
  assert.ok(
    !serverApplication.includes("'Content-Security-Policy'"),
    'server.application.ts must not set Content-Security-Policy - server/securityResponse.ts is the sole authority',
  );

  // F-03: Security-Middleware darf nicht doppelt vorliegen. Die aktive Kette konsumiert die
  // Module unter server/middleware/, statt deren Logik ein zweites Mal inline zu fuehren.
  assert.match(serverApplication, /import \{ isOriginAllowed \} from '\.\/server\/middleware\/cors';/);
  assert.match(serverApplication, /import \{ isKnownProbePath \} from '\.\/server\/middleware\/probeProtection';/);
  assert.ok(
    !serverApplication.includes('const PROBE_PATH_PATTERNS'),
    'probe patterns must live only in server/middleware/probeProtection.ts',
  );
  assert.ok(
    !serverApplication.includes('const PRODUCTION_ORIGINS'),
    'CORS origin allowlist must live only in server/middleware/cors.ts',
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
    '@ CAA 0 issuewild ";"',
    '@ CAA 0 issuewild "letsencrypt.org"',
    '@ CAA 0 issuewild "pki.goog"',
    'verifizierter Render-Wildcard-Scope',
    'PROVIDER_EXCEPTION_RENDER_IPV4',
    'keinen AAAA-Record hinzufügen',
  ]) {
    assert.ok(runbook.includes(expected), `missing hardening invariant: ${expected}`);
  }

  const defaultScopeStart = runbook.indexOf('Vorgesehener minimaler Satz für `capital-ai.online` ohne Wildcard-Scope:');
  const verifiedWildcardStart = runbook.indexOf('Falls später ein verifizierter Render-Wildcard-Scope erforderlich ist');
  const preCheckStart = runbook.indexOf('### Pre-Check');

  assert.ok(defaultScopeStart >= 0, 'default CAA scope must be documented');
  assert.ok(verifiedWildcardStart > defaultScopeStart, 'verified wildcard scope must follow the default scope');
  assert.ok(preCheckStart > verifiedWildcardStart, 'pre-check must follow the wildcard transition block');

  const defaultScope = runbook.slice(defaultScopeStart, verifiedWildcardStart);
  const verifiedWildcardScope = runbook.slice(verifiedWildcardStart, preCheckStart);

  assert.ok(
    defaultScope.includes('@ CAA 0 issuewild ";"'),
    'default non-wildcard scope must explicitly deny wildcard issuance',
  );
  assert.ok(
    !defaultScope.includes('@ CAA 0 issuewild "letsencrypt.org"') &&
      !defaultScope.includes('@ CAA 0 issuewild "pki.goog"'),
    'default non-wildcard scope must not grant wildcard issuance to Render CAs',
  );
  assert.ok(
    verifiedWildcardScope.includes('muss der Deny-Record `@ CAA 0 issuewild ";"` ersetzt werden'),
    'verified wildcard transition must replace, not append to, the deny record',
  );
  assert.ok(
    verifiedWildcardScope.includes('@ CAA 0 issuewild "letsencrypt.org"') &&
      verifiedWildcardScope.includes('@ CAA 0 issuewild "pki.goog"'),
    'verified wildcard scope must remain restricted to the two Render CAs',
  );

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
