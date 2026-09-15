import { execFileSync } from 'node:child_process';
import { describe, it } from 'vitest';

// Shared dependency-free behavioral suite also runs in constrained pre-PR hosts.
// Includes "loads no Google tag before opt-in", idempotence, saved revocation,
// invalid/expired consent, AdSense pause and pinned upstream asset integrity.
describe('Google marketing consent runtime', () => {
  it('passes the CookieConsent v3 behavioral contract', () => {
    execFileSync(process.execPath, ['--test', 'scripts/security/cookieConsentRuntime.test.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe',
    });
  });
});
