import { describe, expect, it } from 'vitest';
import type { RepositoryQualityAdapter } from '../../src/platform/Governance/Contracts/RepositoryQualityEvidence';
import { ValidatorRegistry } from '../../src/platform/Validators/ValidatorRegistry';

function adapter(domain: RepositoryQualityAdapter['domain']): RepositoryQualityAdapter {
  return {
    domain,
    run: ({ checkedAt }) => ({
      domain,
      status: 'PASS',
      blocking: false,
      checkedAt,
      source: `test:${domain}`,
      authorityRefs: ['ESS-0005'],
      findings: [],
    }),
  };
}

describe('ValidatorRegistry', () => {
  it('registers and resolves validators in canonical domain order', () => {
    const registry = new ValidatorRegistry([
      adapter('compliance'),
      adapter('platform-version'),
      adapter('documentation-consistency'),
    ]);

    expect(registry.domains()).toEqual([
      'platform-version',
      'documentation-consistency',
      'compliance',
    ]);
    expect(registry.resolve('compliance')?.domain).toBe('compliance');
  });

  it('rejects duplicate domain validators', () => {
    expect(() => new ValidatorRegistry([
      adapter('platform-version'),
      adapter('platform-version'),
    ])).toThrow(/duplicate validator/);
  });
});
