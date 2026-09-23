import { describe, expect, it } from 'vitest';
import {
  computeMergeCadence,
  isPullRequestMerge,
  nextPatchVersion,
} from '../../scripts/operations/mergeCadence.mjs';

describe('merge cadence runtime', () => {
  it('keeps legacy behavior until the cadence contract is active', () => {
    expect(computeMergeCadence({
      active: false,
      mergeOrdinal: 0,
      currentVersion: '0.6.0',
    })).toMatchObject({
      mode: 'LEGACY_PER_MERGE',
      deployAllowed: true,
      nextVersionDue: false,
    });
  });

  it('uses fixed five-merge deployment boundaries', () => {
    expect(computeMergeCadence({
      active: true,
      mergeOrdinal: 4,
      productionOrdinal: 0,
      productionRelation: 'PRE_EPOCH',
      productionHealthy: true,
      currentVersion: '0.6.0',
    })).toMatchObject({
      deployDue: false,
      deployProgress: 4,
      deployRemaining: 1,
      recoveryEligible: false,
    });

    expect(computeMergeCadence({
      active: true,
      mergeOrdinal: 5,
      productionOrdinal: 0,
      productionRelation: 'PRE_EPOCH',
      productionHealthy: true,
      currentVersion: '0.6.0',
    })).toMatchObject({
      deployDue: true,
      deploymentBoundary: 5,
      deployProgress: 5,
      deployRemaining: 0,
      recoveryEligible: true,
    });

    expect(computeMergeCadence({
      active: true,
      mergeOrdinal: 6,
      productionOrdinal: 6,
      productionRelation: 'CURRENT_MAIN',
      productionHealthy: true,
      currentVersion: '0.6.0',
    })).toMatchObject({
      deployDue: false,
      satisfiedDeploymentBoundary: 5,
      deployProgress: 1,
      deployRemaining: 4,
    });
  });

  it('marks only the next tenth merge candidate for PATCH materialization', () => {
    expect(computeMergeCadence({
      active: true,
      mergeOrdinal: 8,
      currentVersion: '0.6.0',
    }).nextVersionDue).toBe(false);

    expect(computeMergeCadence({
      active: true,
      mergeOrdinal: 9,
      currentVersion: '0.6.0',
    })).toMatchObject({
      nextVersionDue: true,
      versionProgress: 9,
      versionRemaining: 1,
      nextPatchVersion: '0.6.1',
    });

    expect(computeMergeCadence({
      active: true,
      mergeOrdinal: 10,
      currentVersion: '0.6.1',
    })).toMatchObject({
      nextVersionDue: false,
      versionProgress: 0,
      versionRemaining: 10,
      nextPatchVersion: '0.6.2',
    });
  });

  it('retains recovery for actual broken production', () => {
    expect(computeMergeCadence({
      active: true,
      mergeOrdinal: 3,
      productionOrdinal: 0,
      productionRelation: 'DIVERGED',
      productionHealthy: true,
      currentVersion: '0.6.0',
    }).recoveryEligible).toBe(true);

    expect(computeMergeCadence({
      active: true,
      mergeOrdinal: 3,
      productionOrdinal: 0,
      productionRelation: 'PRE_EPOCH',
      productionHealthy: false,
      currentVersion: '0.6.0',
    }).recoveryEligible).toBe(true);
  });

  it('counts only canonical PR merge commits and increments strict patch versions', () => {
    expect(isPullRequestMerge('Merge pull request #1400 from capital-ai-online/feature/test', 'a b')).toBe(true);
    expect(isPullRequestMerge('chore: direct commit', 'a')).toBe(false);
    expect(isPullRequestMerge('Merge branch main', 'a b')).toBe(false);
    expect(nextPatchVersion('0.6.0')).toBe('0.6.1');
    expect(nextPatchVersion('2.9.9')).toBe('2.9.10');
  });
});
