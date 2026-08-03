// ADR-0035 / ESS-0014 — deployment-time protected-change guard.
//
// Zweck: Ein versehentlicher Rueckbau der funktionierenden CookieHub-/Google-Marketing-
// Security-Invarianten darf nicht unbemerkt deployen. Der Guard wird vor jedem `npm run build`
// ausgefuehrt und blockiert den Build fail-closed, wenn eine geschuetzte Invariante fehlt.
//
// WICHTIG: Dieser Guard ersetzt NICHT die IAM-Autorisierung. Ein absichtlicher Rueckbau ist
// ausschliesslich ueber den in ESS-0014 definierten Protected-Change-Prozess zulaessig
// (Human OWNER + TOTP Step-up oder OWNER-delegierter Service Account + one-time Approval).
// Die spaetere MCP/Service-Account-Implementierung darf diesen Guard erweitern, aber nicht
// still umgehen.

import fs from 'fs';
import path from 'path';

interface InvariantCheck {
  id: string;
  file: string;
  description: string;
  pattern?: RegExp;
  includes?: string;
}

const root = process.cwd();

function read(relativePath: string): string {
  const absolute = path.join(root, relativePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`required protected file missing: ${relativePath}`);
  }
  return fs.readFileSync(absolute, 'utf8');
}

const checks: InvariantCheck[] = [
  {
    id: 'GMG-001',
    file: 'index.html',
    description: 'CookieHub production SDK must remain present',
    includes: 'https://cdn.cookiehub.eu/c2/75f66920.js',
  },
  {
    id: 'GMG-002',
    file: 'index.html',
    description: 'CSP-compliant first-party CookieHub initializer must remain present',
    includes: '/cookiehub-init.js',
  },
  {
    id: 'GMG-003',
    file: 'index.html',
    description: 'Google AdSense publisher loader must remain present',
    includes: 'pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1353017943074018',
  },
  {
    id: 'GMG-004',
    file: 'index.html',
    description: 'AMP Auto Ads extension hook requested by architecture must remain present',
    includes: 'https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js',
  },
  {
    id: 'GMG-005',
    file: 'index.html',
    description: 'AMP Auto Ads body hook requested by architecture must remain present',
    pattern: /<amp-auto-ads[\s\S]*?data-ad-client="ca-pub-1353017943074018"[\s\S]*?<\/amp-auto-ads>/,
  },
  {
    id: 'GMG-006',
    file: 'index.html',
    description: 'HTML must expose server-replaced CSP nonce placeholders',
    pattern: /nonce="__CSP_NONCE__"/,
  },
  {
    id: 'GMG-007',
    file: 'public/google-analytics-consent.js',
    description: 'Analytics must remain gated by CookieHub analytics consent',
    includes: "hasConsented('analytics')",
  },
  {
    id: 'GMG-008',
    file: 'server/securityResponse.ts',
    description: 'Production CSP must keep strict-dynamic',
    includes: "'strict-dynamic'",
  },
  {
    id: 'GMG-009',
    file: 'server/securityResponse.ts',
    description: 'Production CSP must disable plugin/object execution',
    includes: "object-src 'none'",
  },
  {
    id: 'GMG-010',
    file: 'server/securityResponse.ts',
    description: 'Production CSP must prevent base tag injection',
    includes: "base-uri 'none'",
  },
  {
    id: 'GMG-011',
    file: 'server/securityResponse.ts',
    description: 'CSP nonce must be generated from cryptographic randomness',
    pattern: /randomBytes\((1[6-9]|[2-9][0-9])\)/,
  },
  {
    id: 'GMG-012',
    file: 'server/securityResponse.ts',
    description: 'CookieHub data endpoint must remain allowed by CSP',
    includes: 'https://ds.cookiehub.net',
  },
  {
    id: 'GMG-013',
    file: 'server/securityResponse.ts',
    description: 'CookieHub consent endpoint must remain allowed by CSP',
    includes: 'https://consent.cookiehub.net',
  },
  {
    id: 'GMG-014',
    file: 'server/securityResponse.ts',
    description: 'CookieHub EU region endpoint must remain allowed by CSP',
    includes: 'https://region-eu.cookiehub.net',
  },
  {
    id: 'GMG-015',
    file: 'server/securityResponse.ts',
    description: 'CookieHub EU consent endpoint must remain allowed by CSP',
    includes: 'https://consent-eu.cookiehub.net',
  },
  {
    id: 'GMG-016',
    file: 'server/securityResponse.ts',
    description: 'Dynamic-nonce HTML must remain no-store',
    includes: "Cache-Control', 'no-store",
  },
  {
    id: 'GMG-017',
    file: 'server/logger.ts',
    description: 'Early request middleware must attach the security response context',
    includes: 'attachSecurityResponseContext(req, res)',
  },
  {
    id: 'GMG-018',
    file: 'src/platform/Security/types.ts',
    description: 'OWNER-only role set must remain explicit',
    pattern: /OWNER_ONLY_ROLES[\s\S]*?\['owner'\]/,
  },
  {
    id: 'GMG-019',
    file: 'src/platform/Security/authMiddleware.ts',
    description: 'Critical-owner TOTP step-up primitive must remain implemented',
    includes: 'export async function requireStepUp',
  },
  {
    id: 'GMG-020',
    file: '.ai/skills/ESS-0014-Google-Marketing-MCP-Governance.md',
    description: 'Normative Google Marketing governance ESS must remain present',
    includes: 'Protected Change / Rollback Protocol',
  },
  {
    id: 'GMG-021',
    file: 'docs/adr/ADR-0035-protected-google-marketing-integration-strict-csp.md',
    description: 'ADR-0035 protected-change decision must remain present',
    includes: 'Mandatory Impact Confirmation',
  },
];

const failures: Array<{ id: string; file: string; description: string }> = [];

for (const check of checks) {
  let content = '';
  try {
    content = read(check.file);
  } catch {
    failures.push({ id: check.id, file: check.file, description: check.description });
    continue;
  }

  const valid = check.includes !== undefined
    ? content.includes(check.includes)
    : check.pattern?.test(content) === true;

  if (!valid) {
    failures.push({ id: check.id, file: check.file, description: check.description });
  }
}

if (failures.length > 0) {
  console.error('\n[PROTECTED_CHANGE_GUARD] DEPLOYMENT BLOCKED\n');
  console.error('A protected CookieHub / Google Marketing / CSP invariant was removed or changed.');
  console.error('Do NOT bypass this guard as a generic build fix.');
  console.error('A rollback requires ESS-0014 impact disclosure and explicit approval:');
  console.error('- Human principal: CAPITAL-AI IAM role OWNER + fresh TOTP step-up');
  console.error('- Service account: OWNER-delegated exact capability + one-time OWNER rollback approval');
  console.error('- Dry-run, expected fingerprint, audit evidence and post-change verification are mandatory.\n');

  for (const failure of failures) {
    console.error(`- ${failure.id} ${failure.file}: ${failure.description}`);
  }

  process.exit(1);
}

console.log(`[PROTECTED_CHANGE_GUARD] ${checks.length} Google Marketing invariants verified.`);
