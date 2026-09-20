import { describe, expect, it } from 'vitest';
import {
  GITHUB_ZERO_COST_STORAGE_LIMITS,
  evaluateRepositoryCacheCapacity,
  evaluateRetentionPolicy,
  evaluateSharedArtifactPoolCapacity,
} from '../../scripts/operations/githubEvidenceStoragePolicy.mjs';

const GIB = 1024 ** 3;

describe('GitHub zero-cost evidence storage policy', () => {
  it('keeps repository cache inside the included 10 GiB boundary', () => {
    expect(evaluateRepositoryCacheCapacity({
      activeCacheBytes: 5 * GIB,
      configuredCacheLimitGiB: 10,
      billedNetAmount: 0,
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
    })).toMatchObject({
      state: 'CANDIDATE_ZERO_COST',
      automaticEnablementAllowed: false,
      activeCacheGiB: 5,
      configuredCacheLimitGiB: 10,
      observedNetAmount: 0,
    });
  });

  it('requires cost review if the configured cache limit can exceed the included allowance', () => {
    expect(evaluateRepositoryCacheCapacity({
      activeCacheBytes: 1 * GIB,
      configuredCacheLimitGiB: 20,
      billedNetAmount: 0,
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
    })).toMatchObject({
      state: 'COST_REVIEW_REQUIRED',
      automaticEnablementAllowed: false,
      configuredCacheLimitGiB: 20,
    });
  });

  it('fails closed for the shared artifact pool when current pool usage is not observable', () => {
    expect(evaluateSharedArtifactPoolCapacity({
      sharedPoolUsedGiB: null,
      actionsStorageNetAmount: 0,
      packagesStorageNetAmount: 0,
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
    })).toMatchObject({
      state: 'NOT_OBSERVABLE',
      automaticEnablementAllowed: false,
    });
  });

  it('classifies shared storage guard bands without granting enablement authority', () => {
    expect(evaluateSharedArtifactPoolCapacity({
      sharedPoolUsedGiB: 36,
      actionsStorageNetAmount: 0,
      packagesStorageNetAmount: 0,
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
    })).toMatchObject({
      state: 'CANDIDATE_ZERO_COST',
      guardBand: 'WARNING',
      automaticEnablementAllowed: false,
    });

    expect(evaluateSharedArtifactPoolCapacity({
      sharedPoolUsedGiB: 42,
      actionsStorageNetAmount: 0,
      packagesStorageNetAmount: 0,
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
    })).toMatchObject({
      state: 'CANDIDATE_ZERO_COST',
      guardBand: 'FREEZE_NONESSENTIAL',
      automaticEnablementAllowed: false,
    });

    expect(evaluateSharedArtifactPoolCapacity({
      sharedPoolUsedGiB: 50,
      actionsStorageNetAmount: 0,
      packagesStorageNetAmount: 0,
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
    })).toMatchObject({
      state: 'COST_REVIEW_REQUIRED',
      guardBand: 'HARD_STOP',
      automaticEnablementAllowed: false,
    });
  });

  it('blocks positive billed storage even below the capacity warning threshold', () => {
    expect(evaluateSharedArtifactPoolCapacity({
      sharedPoolUsedGiB: 1,
      actionsStorageNetAmount: 0.01,
      packagesStorageNetAmount: 0,
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
    })).toMatchObject({
      state: 'COST_REVIEW_REQUIRED',
      observedNetAmount: 0.01,
    });
  });

  it('keeps retention purpose-bound', () => {
    expect(evaluateRetentionPolicy({
      storageClass: 'TRANSIENT_ARTIFACT',
      retentionDays: 1,
    })).toMatchObject({ status: 'PASS', evidence: false });

    expect(evaluateRetentionPolicy({
      storageClass: 'EVIDENCE_ARTIFACT',
      retentionDays: 90,
    })).toMatchObject({ status: 'PASS', evidence: true });

    expect(evaluateRetentionPolicy({
      storageClass: 'TRANSIENT_ARTIFACT',
      retentionDays: 30,
    })).toMatchObject({ status: 'BLOCKED' });

    expect(GITHUB_ZERO_COST_STORAGE_LIMITS).toMatchObject({
      enterpriseSharedActionsPackagesGiB: 50,
      repositoryCacheIncludedGiB: 10,
      artifactWarningGiB: 35,
      artifactFreezeNonessentialGiB: 40,
      artifactHardStopGiB: 50,
    });
  });
});
