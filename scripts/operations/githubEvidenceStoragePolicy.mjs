const GIB = 1024 ** 3;

export const GITHUB_ZERO_COST_STORAGE_LIMITS = Object.freeze({
  enterpriseSharedActionsPackagesGiB: 50,
  repositoryCacheIncludedGiB: 10,
  artifactWarningGiB: 35,
  artifactFreezeNonessentialGiB: 40,
  artifactHardStopGiB: 50,
  cacheDefaultRetentionDays: 7,
  privateRepositoryRetentionMaximumDays: 400,
  transientArtifactRetentionDays: 1,
  evidenceArtifactRetentionDays: 90,
});

export const EVIDENCE_STORAGE_CLASSES = Object.freeze({
  CACHE: Object.freeze({
    evidence: false,
    purpose: 'recreatable acceleration only',
    maximumRetentionDays: 7,
  }),
  TRANSIENT_ARTIFACT: Object.freeze({
    evidence: false,
    purpose: 'short handoff, debugging, or downstream consumption',
    maximumRetentionDays: 7,
  }),
  EVIDENCE_ARTIFACT: Object.freeze({
    evidence: true,
    purpose: 'verification identity, provenance, audit, rollback, or release evidence',
    maximumRetentionDays: 90,
  }),
});

function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function bytesToGiB(value) {
  const bytes = finiteNumber(value);
  return bytes === null ? null : Number((bytes / GIB).toFixed(6));
}

function guardBand(usedGiB) {
  if (usedGiB >= GITHUB_ZERO_COST_STORAGE_LIMITS.artifactHardStopGiB) return 'HARD_STOP';
  if (usedGiB >= GITHUB_ZERO_COST_STORAGE_LIMITS.artifactFreezeNonessentialGiB) {
    return 'FREEZE_NONESSENTIAL';
  }
  if (usedGiB >= GITHUB_ZERO_COST_STORAGE_LIMITS.artifactWarningGiB) return 'WARNING';
  return 'NORMAL';
}

/**
 * @param {{
 *   activeCacheBytes?: number | null;
 *   configuredCacheLimitGiB?: number | null;
 *   billedNetAmount?: number | null;
 *   entitlement?: 'INCLUDED_VERIFIED' | 'NOT_INCLUDED' | 'UNKNOWN';
 *   settingsStatus?: string;
 * }} [input]
 */
export function evaluateRepositoryCacheCapacity({
  activeCacheBytes = null,
  configuredCacheLimitGiB = null,
  billedNetAmount = null,
  entitlement = 'UNKNOWN',
  settingsStatus = 'NOT_OBSERVABLE',
} = {}) {
  if (entitlement === 'NOT_INCLUDED') {
    return Object.freeze({
      state: 'NOT_INCLUDED',
      automaticEnablementAllowed: false,
      reason: 'cache entitlement is not included in the verified plan',
    });
  }

  const activeGiB = bytesToGiB(activeCacheBytes);
  const limitGiB = finiteNumber(configuredCacheLimitGiB);
  const netAmount = finiteNumber(billedNetAmount);

  if (
    entitlement !== 'INCLUDED_VERIFIED'
    || settingsStatus !== 'PASS'
    || activeGiB === null
    || limitGiB === null
    || netAmount === null
  ) {
    return Object.freeze({
      state: 'NOT_OBSERVABLE',
      automaticEnablementAllowed: false,
      reason: 'cache usage, configured limit, entitlement, settings, and billing must all be observable',
      activeCacheGiB: activeGiB,
      configuredCacheLimitGiB: limitGiB,
    });
  }

  if (
    netAmount > 0
    || activeGiB > GITHUB_ZERO_COST_STORAGE_LIMITS.repositoryCacheIncludedGiB
    || limitGiB > GITHUB_ZERO_COST_STORAGE_LIMITS.repositoryCacheIncludedGiB
  ) {
    return Object.freeze({
      state: 'COST_REVIEW_REQUIRED',
      automaticEnablementAllowed: false,
      reason: 'cache usage, cache limit, or billed amount exceeds the zero-cost boundary',
      activeCacheGiB: activeGiB,
      configuredCacheLimitGiB: limitGiB,
      observedNetAmount: netAmount,
    });
  }

  return Object.freeze({
    state: 'CANDIDATE_ZERO_COST',
    automaticEnablementAllowed: false,
    reason: 'cache usage and configured limit remain inside the included repository allowance',
    activeCacheGiB: activeGiB,
    configuredCacheLimitGiB: limitGiB,
    observedNetAmount: 0,
  });
}

/**
 * @param {{
 *   sharedPoolUsedGiB?: number | null;
 *   actionsStorageNetAmount?: number | null;
 *   packagesStorageNetAmount?: number | null;
 *   entitlement?: 'INCLUDED_VERIFIED' | 'NOT_INCLUDED' | 'UNKNOWN';
 *   settingsStatus?: string;
 * }} [input]
 */
export function evaluateSharedArtifactPoolCapacity({
  sharedPoolUsedGiB = null,
  actionsStorageNetAmount = null,
  packagesStorageNetAmount = null,
  entitlement = 'UNKNOWN',
  settingsStatus = 'NOT_OBSERVABLE',
} = {}) {
  if (entitlement === 'NOT_INCLUDED') {
    return Object.freeze({
      state: 'NOT_INCLUDED',
      automaticEnablementAllowed: false,
      reason: 'shared Actions/Packages storage is not included in the verified plan',
    });
  }

  const usedGiB = finiteNumber(sharedPoolUsedGiB);
  const actionsAmount = finiteNumber(actionsStorageNetAmount);
  const packagesAmount = finiteNumber(packagesStorageNetAmount);

  if (
    entitlement !== 'INCLUDED_VERIFIED'
    || settingsStatus !== 'PASS'
    || usedGiB === null
    || actionsAmount === null
    || packagesAmount === null
  ) {
    return Object.freeze({
      state: 'NOT_OBSERVABLE',
      automaticEnablementAllowed: false,
      reason: 'current shared-pool usage plus Actions and Packages billed amounts must be observable',
      sharedPoolUsedGiB: usedGiB,
    });
  }

  const totalNetAmount = Number((actionsAmount + packagesAmount).toFixed(6));
  const band = guardBand(usedGiB);

  if (totalNetAmount > 0 || band === 'HARD_STOP') {
    return Object.freeze({
      state: 'COST_REVIEW_REQUIRED',
      automaticEnablementAllowed: false,
      reason: 'shared storage reached the hard boundary or GitHub reports positive billed storage',
      sharedPoolUsedGiB: usedGiB,
      guardBand: band,
      observedNetAmount: totalNetAmount,
    });
  }

  return Object.freeze({
    state: 'CANDIDATE_ZERO_COST',
    automaticEnablementAllowed: false,
    reason: 'shared storage remains inside the included allowance with zero observed billed storage',
    sharedPoolUsedGiB: usedGiB,
    guardBand: band,
    observedNetAmount: 0,
  });
}

/**
 * @param {{
 *   storageClass?: keyof typeof EVIDENCE_STORAGE_CLASSES;
 *   retentionDays?: number | null;
 * }} [input]
 */
export function evaluateRetentionPolicy({ storageClass, retentionDays = null } = {}) {
  const descriptor = EVIDENCE_STORAGE_CLASSES[storageClass];
  const days = finiteNumber(retentionDays);

  if (!descriptor || days === null || !Number.isInteger(days) || days < 1) {
    return Object.freeze({
      status: 'BLOCKED',
      reason: 'storage class and positive integer retention are required',
    });
  }

  if (days > descriptor.maximumRetentionDays) {
    return Object.freeze({
      status: 'BLOCKED',
      reason: 'retention exceeds the CAPITAL-AI purpose-bound limit for this storage class',
      storageClass,
      retentionDays: days,
      maximumRetentionDays: descriptor.maximumRetentionDays,
    });
  }

  return Object.freeze({
    status: 'PASS',
    storageClass,
    retentionDays: days,
    maximumRetentionDays: descriptor.maximumRetentionDays,
    evidence: descriptor.evidence,
  });
}
