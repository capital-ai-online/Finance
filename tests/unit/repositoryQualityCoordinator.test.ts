import { describe, expect, it } from 'vitest';
import type {
  RepositoryQualityAdapter,
  RepositoryQualityDomain,
  RepositoryQualityStatus,
} from '../../src/platform/Governance/Contracts/RepositoryQualityEvidence';
import { RepositoryQualityCoordinator } from '../../src/platform/Quality/RepositoryQuality/RepositoryQualityCoordinator';
import { ValidatorRegistry } from '../../src/platform/Validators/ValidatorRegistry';

function adapter(
  domain: RepositoryQualityDomain,
  status: RepositoryQualityStatus,
  blocking = status === 'FAIL' || status === 'NOT_AVAILABLE',
): RepositoryQualityAdapter {
  return {
    domain,
    run: ({ checkedAt }) => ({
      domain,
      status,
      blocking,
      checkedAt,
      source: `test:${domain}`,
      authorityRefs: ['ESS-0005'],
      findings: status === 'WARN'
        ? [{ domain, ruleId: 'TEST-WARN', severity: 'warning', message: 'warning' }]
        : [],
    }),
  };
}

describe('RepositoryQualityCoordinator', () => {
  it('aggregates deterministic PASS/WARN evidence through the central registry without elevating authority', () => {
    const registry = new ValidatorRegistry([
      adapter('platform-version', 'PASS'),
      adapter('documentation-hygiene', 'WARN', false),
    ]);
    const coordinator = new RepositoryQualityCoordinator(
      registry,
      ['platform-version', 'documentation-hygiene'],
    );

    const result = coordinator.observe({
      repoRoot: '/tmp/repo',
      checkedAt: '2026-08-20T00:00:00.000Z',
      sourceCommit: 'a'.repeat(40),
    });

    expect(result.schemaVersion).toBe('repository-quality-observation/1.1.0');
    expect(result.overallStatus).toBe('WARN');
    expect(result.blocking).toBe(false);
    expect(result.summary).toMatchObject({ checks: 2, passed: 1, warnings: 1, findings: 1 });
    expect(result.nonAuthorizingStatement).toContain('does not authorize merge');
    expect(result.sourceCommit).toBe('a'.repeat(40));
  });

  it('fails closed when a required validator is missing', () => {
    const coordinator = new RepositoryQualityCoordinator(
      [adapter('platform-version', 'PASS')],
      ['platform-version', 'compliance'],
    );

    const result = coordinator.observe({ checkedAt: '2026-08-20T00:00:00.000Z' });

    expect(result.overallStatus).toBe('FAIL');
    expect(result.blocking).toBe(true);
    expect(result.checks.find((check) => check.domain === 'compliance')).toMatchObject({
      status: 'NOT_AVAILABLE',
      blocking: true,
    });
  });

  it('fails closed when a validator throws and rejects ambiguous commit evidence', () => {
    const throwing: RepositoryQualityAdapter = {
      domain: 'platform-version',
      run: () => {
        throw new Error('boom');
      },
    };
    const coordinator = new RepositoryQualityCoordinator([throwing], ['platform-version']);

    const result = coordinator.observe({ checkedAt: '2026-08-20T00:00:00.000Z' });
    expect(result.checks[0].status).toBe('NOT_AVAILABLE');
    expect(result.checks[0].findings[0].ruleId).toBe('QUALITY-VALIDATOR-ERROR');

    expect(() => coordinator.observe({
      checkedAt: '2026-08-20T00:00:00.000Z',
      sourceCommit: 'abc1234',
    })).toThrow(/full 40-character Git commit SHA/);
  });
});
