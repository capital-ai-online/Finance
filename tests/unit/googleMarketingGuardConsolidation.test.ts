import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const governancePath = path.join(root, '.github/workflows/pr-governance.yml');
const legacyGuardPath = path.join(root, '.github/workflows/google-marketing-protected-change.yml');
const wiringScriptPath = path.join(root, 'scripts/security/verifyGoogleMarketingProtectedWiring.mjs');

function read(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

describe('S5 Google Marketing guard runner consolidation', () => {
  it('runs the static protected-wiring check inside the existing governance runner', () => {
    const yaml = read(governancePath);
    expect(yaml).toContain('Google-Marketing Schutzverdrahtung im bestehenden Governance-Runner prüfen');
    expect(yaml).toContain('../policy/scripts/security/verifyGoogleMarketingProtectedWiring.mjs');
    expect(yaml).toContain('scripts/security/verifyGoogleMarketingProtectedWiring.mjs');
    expect(yaml).toContain('PR_BASE_REF: origin/main');
    expect(yaml).toContain('PR_HEAD_REF: HEAD');
    expect([...yaml.matchAll(/^\s+runs-on:\s+ubuntu-latest$/gm)]).toHaveLength(1);
  });

  it('keeps a trusted-main steady-state with a one-time bootstrap fallback', () => {
    const yaml = read(governancePath);
    const trusted = yaml.indexOf('node ../policy/scripts/security/verifyGoogleMarketingProtectedWiring.mjs');
    const bootstrap = yaml.indexOf('node scripts/security/verifyGoogleMarketingProtectedWiring.mjs');
    expect(trusted).toBeGreaterThan(-1);
    expect(bootstrap).toBeGreaterThan(trusted);
    expect(yaml).toContain('Bootstrap: trusted main enthält den neuen Wiring-Validator noch nicht');
  });

  it('retires the separate automatic Google-Marketing hosted runner but preserves manual diagnostics', () => {
    const yaml = read(legacyGuardPath);
    expect(yaml).toContain('workflow_dispatch:');
    expect(yaml).not.toContain('pull_request:');
    expect(yaml).not.toContain('push:');
    expect(yaml).toContain('node scripts/security/verifyGoogleMarketingProtectedWiring.mjs --force');
  });

  it('keeps the protected path contract and central CI invariants in one reusable script', () => {
    const script = read(wiringScriptPath);
    for (const marker of [
      "'index.html'",
      "'public/google-analytics-consent.js'",
      "'.github/workflows/ci.yml'",
      "'.github/workflows/pr-governance.yml'",
      "'.dockerignore'",
      "'run: npm test'",
      "'run: npm run build'",
      "'run: npx vitest run tests/unit/securityResponse.production.test.ts'",
      "'npm run predeploy:check'",
    ]) {
      expect(script).toContain(marker);
    }
  });
});
