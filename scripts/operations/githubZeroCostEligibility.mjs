export const ZERO_COST_DECISION_STATES = Object.freeze([
  'CANDIDATE_ZERO_COST',
  'COST_REVIEW_REQUIRED',
  'NOT_OBSERVABLE',
  'NOT_INCLUDED',
]);

function fail(message) {
  throw new Error(\`[GITHUB-ZERO-COST-ELIGIBILITY] \${message}\`);
}

function finiteOrNull(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeEntitlement(value) {
  if (!['INCLUDED_VERIFIED', 'NOT_INCLUDED', 'UNKNOWN'].includes(value)) {
    fail('entitlement must be INCLUDED_VERIFIED, NOT_INCLUDED, or UNKNOWN');
  }
  return value;
}

export function evaluateZeroCostCapability({
  capabilityId,
  entitlement = 'UNKNOWN',
  settingsStatus = 'NOT_OBSERVABLE',
  netAmount = null,
  usageObserved = false,
  evidence = [],
} = {}) {
  if (typeof capabilityId !== 'string' || capabilityId.trim().length < 1) {
    fail('capabilityId is required');
  }
  const normalizedEntitlement = normalizeEntitlement(entitlement);
  const normalizedNetAmount = finiteOrNull(netAmount);

  if (normalizedEntitlement === 'NOT_INCLUDED') {
    return Object.freeze({
      capabilityId,
      state: 'NOT_INCLUDED',
      automaticEnablementAllowed: false,
      reason: 'provider entitlement is not included in the currently verified plan',
      evidence: Object.freeze([...evidence]),
    });
  }

  if (
    normalizedEntitlement !== 'INCLUDED_VERIFIED'
    || settingsStatus !== 'PASS'
    || normalizedNetAmount === null
  ) {
    return Object.freeze({
      capabilityId,
      state: 'NOT_OBSERVABLE',
      automaticEnablementAllowed: false,
      reason: 'included entitlement, settings readback, and billed net amount must all be observable',
      evidence: Object.freeze([...evidence]),
    });
  }

  if (normalizedNetAmount > 0) {
    return Object.freeze({
      capabilityId,
      state: 'COST_REVIEW_REQUIRED',
      automaticEnablementAllowed: false,
      reason: 'provider billing reports a positive net amount',
      observedNetAmount: normalizedNetAmount,
      usageObserved: usageObserved === true,
      evidence: Object.freeze([...evidence]),
    });
  }

  return Object.freeze({
    capabilityId,
    state: 'CANDIDATE_ZERO_COST',
    automaticEnablementAllowed: false,
    reason: 'provider entitlement is verified as included and observed billed net amount is zero',
    observedNetAmount: 0,
    usageObserved: usageObserved === true,
    evidence: Object.freeze([...evidence]),
  });
}

export function summarizeZeroCostDecisions(decisions) {
  const rows = Array.isArray(decisions) ? decisions : [];
  const byState = Object.fromEntries(
    ZERO_COST_DECISION_STATES.map((state) => [
      state,
      rows.filter((row) => row?.state === state).length,
    ]),
  );

  return Object.freeze({
    assessedCapabilities: rows.length,
    byState: Object.freeze(byState),
    automaticEnablementAllowed: false,
    paidUsageMutationPerformed: false,
  });
}
