import { describe, expect, it } from 'vitest';
import { githubBillingAlertSubjectMatchesCanonicalRepository } from '../../server/billing/githubBillingAlertOidc';

describe('GitHub billing alert OIDC subject binding', () => {
  it('accepts the classic Finance repository subject', () => {
    expect(
      githubBillingAlertSubjectMatchesCanonicalRepository(
        'repo:capital-ai-online/Finance:ref:refs/heads/main',
      ),
    ).toBe(true);
  });

  it('accepts the canonical id-hardened Finance repository subject', () => {
    expect(
      githubBillingAlertSubjectMatchesCanonicalRepository(
        'repo:capital-ai-online@313205484/Finance@1284319285:ref:refs/heads/main',
      ),
    ).toBe(true);
  });

  it('rejects another repository even when owner and ref look valid', () => {
    expect(
      githubBillingAlertSubjectMatchesCanonicalRepository(
        'repo:capital-ai-online@313205484/Other@999:ref:refs/heads/main',
      ),
    ).toBe(false);
  });
});
