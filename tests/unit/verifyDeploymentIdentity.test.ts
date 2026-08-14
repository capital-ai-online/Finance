import { describe, expect, it } from 'vitest';
import { verifyDeploymentIdentity } from '../../scripts/deployment/verifyDeploymentIdentity';

const VALID_SHA = 'a'.repeat(40);
const OTHER_SHA = 'b'.repeat(40);

function healthyPayload(overrides: Record<string, any> = {}) {
  return {
    status: 'ok',
    deployment: {
      commitSha: VALID_SHA,
      branch: 'main',
      repoSlug: 'SvenKulessa/Finance',
      provider: 'render',
      ...overrides,
    },
  };
}

describe('verifyDeploymentIdentity', () => {
  it('PASS: exact commit/repo/branch match on a healthy response', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: VALID_SHA,
      expectedRepository: 'SvenKulessa/Finance',
      responseOk: true,
      healthPayload: healthyPayload(),
    });
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.observed.commitSha).toBe(VALID_SHA);
  });

  it('PASS: expectedRepository null skips the repo check', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: VALID_SHA,
      expectedRepository: null,
      responseOk: true,
      healthPayload: healthyPayload(),
    });
    expect(result.ok).toBe(true);
  });

  it('DENY: HTTP response not ok', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: VALID_SHA,
      expectedRepository: null,
      responseOk: false,
      healthPayload: healthyPayload(),
    });
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes('HTTP 2xx'))).toBe(true);
  });

  it('DENY: health status is not "ok"', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: VALID_SHA,
      expectedRepository: null,
      responseOk: true,
      healthPayload: healthyPayload({}) && { status: 'degraded', deployment: healthyPayload().deployment },
    });
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes('Health-Status'))).toBe(true);
  });

  it('DENY: missing commit in deployment payload', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: VALID_SHA,
      expectedRepository: null,
      responseOk: true,
      healthPayload: { status: 'ok', deployment: { commitSha: null, branch: 'main', repoSlug: 'SvenKulessa/Finance' } },
    });
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes('gueltigen 40-stelligen Commit-SHA'))).toBe(true);
  });

  it('DENY: deployed commit does not match expected commit', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: VALID_SHA,
      expectedRepository: null,
      responseOk: true,
      healthPayload: healthyPayload({ commitSha: OTHER_SHA }),
    });
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes('entspricht nicht dem erwarteten'))).toBe(true);
  });

  it('DENY: repository mismatch', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: VALID_SHA,
      expectedRepository: 'SvenKulessa/Finance',
      responseOk: true,
      healthPayload: healthyPayload({ repoSlug: 'someone-else/fork' }),
    });
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes('gehoert zu'))).toBe(true);
  });

  it('DENY: branch is not main', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: VALID_SHA,
      expectedRepository: null,
      responseOk: true,
      healthPayload: healthyPayload({ branch: 'staging' }),
    });
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes('Branch staging'))).toBe(true);
  });

  it('DENY: expected commit itself is not a valid 40-char SHA', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: 'not-a-real-sha',
      expectedRepository: null,
      responseOk: true,
      healthPayload: healthyPayload(),
    });
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.includes('kein gueltiger 40-stelliger SHA'))).toBe(true);
  });

  it('DENY: case-insensitive SHA still matches (positive contract, not a violation)', () => {
    const result = verifyDeploymentIdentity({
      expectedCommitSha: VALID_SHA.toUpperCase(),
      expectedRepository: null,
      responseOk: true,
      healthPayload: healthyPayload(),
    });
    expect(result.ok).toBe(true);
  });
});
