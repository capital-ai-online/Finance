import { describe, expect, it } from 'vitest';
import {
  evaluateZeroCostCapability,
  summarizeZeroCostDecisions,
} from '../../scripts/operations/githubZeroCostEligibility.mjs';

describe('GitHub zero-cost eligibility', () => {
  it('marks verified included capacity with zero billed amount as candidate only', () => {
    expect(evaluateZeroCostCapability({
      capabilityId: 'actions_artifact_storage',
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
      netAmount: 0,
      usageObserved: false,
      evidence: ['enterprise-plan-readback', 'billing-summary'],
    })).toEqual({
      capabilityId: 'actions_artifact_storage',
      state: 'CANDIDATE_ZERO_COST',
      automaticEnablementAllowed: false,
      reason: 'provider entitlement is verified as included and observed billed net amount is zero',
      observedNetAmount: 0,
      usageObserved: false,
      evidence: ['enterprise-plan-readback', 'billing-summary'],
    });
  });

  it('requires cost review immediately when the provider reports a positive net amount', () => {
    expect(evaluateZeroCostCapability({
      capabilityId: 'actions_artifact_storage',
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
      netAmount: 0.01,
      usageObserved: true,
    })).toMatchObject({
      state: 'COST_REVIEW_REQUIRED',
      automaticEnablementAllowed: false,
      observedNetAmount: 0.01,
    });
  });

  it('fails closed when entitlement, settings, or billing evidence is missing', () => {
    expect(evaluateZeroCostCapability({
      capabilityId: 'actions_cache',
      entitlement: 'UNKNOWN',
      settingsStatus: 'PASS',
      netAmount: 0,
    }).state).toBe('NOT_OBSERVABLE');

    expect(evaluateZeroCostCapability({
      capabilityId: 'actions_cache',
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'NOT_OBSERVABLE',
      netAmount: 0,
    }).state).toBe('NOT_OBSERVABLE');

    expect(evaluateZeroCostCapability({
      capabilityId: 'actions_cache',
      entitlement: 'INCLUDED_VERIFIED',
      settingsStatus: 'PASS',
      netAmount: null,
    }).state).toBe('NOT_OBSERVABLE');
  });

  it('never turns a decision summary into automatic enablement authority', () => {
    const decisions = [
      evaluateZeroCostCapability({
        capabilityId: 'a',
        entitlement: 'INCLUDED_VERIFIED',
        settingsStatus: 'PASS',
        netAmount: 0,
      }),
      evaluateZeroCostCapability({
        capabilityId: 'b',
        entitlement: 'NOT_INCLUDED',
        settingsStatus: 'PASS',
        netAmount: 0,
      }),
    ];

    expect(summarizeZeroCostDecisions(decisions)).toEqual({
      assessedCapabilities: 2,
      byState: {
        CANDIDATE_ZERO_COST: 1,
        COST_REVIEW_REQUIRED: 0,
        NOT_OBSERVABLE: 0,
        NOT_INCLUDED: 1,
      },
      automaticEnablementAllowed: false,
      paidUsageMutationPerformed: false,
    });
  });
});
