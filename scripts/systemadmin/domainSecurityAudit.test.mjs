import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { evaluateCaa, parseDmarcPolicy, parseSpf } from './domainSecurityAudit.mjs';

const auditSource = readFileSync(new URL('./domainSecurityAudit.mjs', import.meta.url), 'utf8');
const guide = readFileSync(
  new URL('../../docs/runbooks/DOMAIN_SECURITY_SELF_SERVICE_2026-08-27.md', import.meta.url),
  'utf8',
);

test('DMARC parser preserves staged policy and percentage', () => {
  assert.deepEqual(parseDmarcPolicy(['"v=DMARC1; p=none; rua=mailto:dmarc@example.com"']), {
    record: 'v=DMARC1; p=none; rua=mailto:dmarc@example.com',
    policy: 'none',
    pct: 100,
  });

  assert.deepEqual(parseDmarcPolicy(['"v=DMARC1; p=quarantine; pct=25"']), {
    record: 'v=DMARC1; p=quarantine; pct=25',
    policy: 'quarantine',
    pct: 25,
  });

  assert.equal(parseDmarcPolicy(['"v=DMARC1; p=reject"']).policy, 'reject');
});

test('SPF parser detects duplicate records and hard-fail only when explicit', () => {
  assert.deepEqual(parseSpf(['"v=spf1 include:_spf.example.com ~all"']), {
    count: 1,
    record: 'v=spf1 include:_spf.example.com ~all',
    hardFail: false,
    softFail: true,
  });

  assert.equal(parseSpf(['"v=spf1 include:_spf.example.com -all"']).hardFail, true);
  assert.equal(parseSpf(['"v=spf1 -all"', '"v=spf1 include:mail.example.com -all"']).count, 2);
});

test('CAA evaluator distinguishes wildcard deny from explicit wildcard grants', () => {
  const defaultScope = evaluateCaa([
    '0 issue "letsencrypt.org"',
    '0 issue "pki.goog"',
    '0 issuewild ";"',
  ]);

  assert.equal(defaultScope.hasLetsEncrypt, true);
  assert.equal(defaultScope.hasGoogle, true);
  assert.equal(defaultScope.wildcardDenied, true);
  assert.equal(defaultScope.wildcardLetsEncrypt, false);
  assert.equal(defaultScope.wildcardGoogle, false);

  const wildcardScope = evaluateCaa([
    '0 issue "letsencrypt.org"',
    '0 issue "pki.goog"',
    '0 issuewild "letsencrypt.org"',
    '0 issuewild "pki.goog"',
  ]);

  assert.equal(wildcardScope.wildcardDenied, false);
  assert.equal(wildcardScope.wildcardLetsEncrypt, true);
  assert.equal(wildcardScope.wildcardGoogle, true);
});

test('audit implementation is explicitly read-only and uses GET probes only', () => {
  assert.match(auditSource, /mutationMode: 'READ_ONLY'/);
  assert.match(auditSource, /method: 'GET'/);
  assert.doesNotMatch(auditSource, /method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i);
  assert.doesNotMatch(auditSource, /update_environment_variables|trigger_deploy|create_|delete_/i);
});

test('self-service guide preserves protected mutation boundaries', () => {
  for (const expected of [
    'kein AAAA-Record erzwingen',
    '@ CAA 0 issue "letsencrypt.org"',
    '@ CAA 0 issue "pki.goog"',
    '@ CAA 0 issuewild ";"',
    'p=none',
    'p=quarantine',
    'pct=25',
    'p=reject',
    'DNSSEC beim **autoritativen DNS-Provider** aktivieren',
    'Ausschließlich die dort erzeugten DS-Daten',
    'CSP_MODE=strict',
    'Supabase Leaked-Password-Protection',
  ]) {
    assert.ok(guide.includes(expected), `missing protected hardening invariant: ${expected}`);
  }

  assert.match(guide, /Kein SPF `-all`, bevor das Senderinventar vollständig ist/);
  assert.match(guide, /Keine Wildcard-CAA-Freigabe ohne tatsächlich verifizierten Render-Wildcard-Scope/);
});
