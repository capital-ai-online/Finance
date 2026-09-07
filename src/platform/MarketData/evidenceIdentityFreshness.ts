import {
  isAdmissibleMarketEvidence,
  type MarketEvidenceQualityRecord,
} from './evidenceQualityContracts';

export const EVIDENCE_IDENTITY_FRESHNESS_CONTRACT_VERSION = 'evidence-identity-freshness/1.0.0' as const;

/**
 * Security observation states required by S1-R2-11.
 * These labels do not replace DATA DQ statuses and do not authorize scoring.
 */
export type EvidenceSecurityObservationState =
  | 'CURRENT'
  | 'STALE'
  | 'CURRENT_AFTER_REFRESH'
  | 'STALE_RETRY_REQUIRED';

export interface RequiredImmutableIdentity {
  readonly assetId: string;
  readonly providerId: string;
  readonly capability: string;
  readonly field: string;
}

export interface TrustedRefreshAttempt {
  readonly trusted: boolean;
  readonly observation: MarketEvidenceQualityRecord | null;
}

export interface EvidenceIdentityFreshnessInput {
  readonly requiredIdentity: RequiredImmutableIdentity;
  readonly observation: MarketEvidenceQualityRecord | null;
  readonly priorState?: EvidenceSecurityObservationState | null;
  readonly refresh?: TrustedRefreshAttempt | null;
}

export interface EvidenceIdentityFreshnessResult {
  readonly contractVersion: typeof EVIDENCE_IDENTITY_FRESHNESS_CONTRACT_VERSION;
  readonly state: EvidenceSecurityObservationState;
  readonly authorizesCurrent: boolean;
  readonly reason: string;
}

function normalizeIdentityPart(value: string): string {
  return value.trim();
}

export function identitiesMatch(
  required: RequiredImmutableIdentity,
  evidence: Pick<MarketEvidenceQualityRecord, 'assetId' | 'providerId' | 'capability' | 'field'>,
): boolean {
  return normalizeIdentityPart(required.assetId) === normalizeIdentityPart(evidence.assetId)
    && normalizeIdentityPart(required.providerId) === normalizeIdentityPart(evidence.providerId)
    && normalizeIdentityPart(required.capability) === normalizeIdentityPart(evidence.capability)
    && normalizeIdentityPart(required.field) === normalizeIdentityPart(evidence.field);
}

export function isCurrentAuthorizingState(state: EvidenceSecurityObservationState): boolean {
  return state === 'CURRENT' || state === 'CURRENT_AFTER_REFRESH';
}

function result(
  state: EvidenceSecurityObservationState,
  reason: string,
): EvidenceIdentityFreshnessResult {
  return {
    contractVersion: EVIDENCE_IDENTITY_FRESHNESS_CONTRACT_VERSION,
    state,
    authorizesCurrent: isCurrentAuthorizingState(state),
    reason,
  };
}

function classifyObservation(
  requiredIdentity: RequiredImmutableIdentity,
  observation: MarketEvidenceQualityRecord | null,
): EvidenceIdentityFreshnessResult {
  if (observation === null) {
    return result('STALE_RETRY_REQUIRED', 'missing-observation');
  }

  if (!identitiesMatch(requiredIdentity, observation)) {
    return result('STALE', 'wrong-identity');
  }

  if (isAdmissibleMarketEvidence(observation)) {
    return result('CURRENT', 'identity-bound-fresh-verified-evidence');
  }

  if (
    observation.qualityStatus === 'UNAVAILABLE'
    || observation.qualityStatus === 'NOT_APPLICABLE'
    || observation.observedAt === null
    || !observation.evidenceRef?.trim()
  ) {
    return result('STALE_RETRY_REQUIRED', 'evidence-unavailable-or-incomplete');
  }

  return result('STALE', 'stale-or-inadmissible-evidence');
}

/**
 * Evaluate whether an observation may authorize current state for a required
 * immutable identity. A record cannot self-authorize CURRENT. A clock or label
 * rewrite is not a trusted refresh. Failed or untrusted refresh remains non-current.
 */
export function evaluateEvidenceIdentityFreshness(
  input: EvidenceIdentityFreshnessInput,
): EvidenceIdentityFreshnessResult {
  const classified = classifyObservation(input.requiredIdentity, input.observation);

  if (!input.refresh) {
    return classified;
  }

  if (!input.refresh.trusted || input.refresh.observation === null) {
    return result('STALE_RETRY_REQUIRED', 'untrusted-or-missing-refresh');
  }

  if (!identitiesMatch(input.requiredIdentity, input.refresh.observation)) {
    return result('STALE', 'refresh-wrong-identity');
  }

  if (!isAdmissibleMarketEvidence(input.refresh.observation)) {
    return result('STALE_RETRY_REQUIRED', 'refresh-not-admissible');
  }

  const prior = input.priorState ?? classified.state;
  if (prior === 'CURRENT') {
    return result('CURRENT', 'trusted-refresh-confirms-current');
  }

  return result('CURRENT_AFTER_REFRESH', 'trusted-refresh-bound-to-required-identity');
}
