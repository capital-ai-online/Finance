import {
  GOPLUS_TRANSACTION_SIMULATION_PROVIDER_ID,
  type GoPlusTradeSimulationEvidence,
} from '../../../../MarketData/providers/GoPlusTransactionSimulationProvider';
import {
  composeMemeHoneypotSimulationEvidence,
  type CryptoMemeHoneypotSimulationEvidence,
} from '../Adapters/GoPlusHoneypotSimulationEvidenceAdapter';

export const CRYPTO_MEME_HONEYPOT_SIMULATION_ADMISSION_VERSION =
  'crypto-meme-honeypot-simulation-admission/0.1.0' as const;
export const CRYPTO_MEME_HONEYPOT_SIMULATION_VALIDATION_VERSION =
  'crypto-meme-honeypot-simulation-validation/0.1.0' as const;

export interface CryptoMemeHoneypotSimulationAdmissionPolicy {
  readonly contractVersion: typeof CRYPTO_MEME_HONEYPOT_SIMULATION_ADMISSION_VERSION;
  readonly policyId: string;
  readonly policyVersion: string;
  /** Exact empirical coverage scope. No chain/token coverage is inferred from provider availability. */
  readonly chainId: string;
  readonly tokenAddress: string;
  readonly routeAuthorityId: string;
  readonly routeAuthorityVersion: string;
  readonly coverageAuthorityId: string;
  readonly coverageAuthorityVersion: string;
  readonly coverageEvidenceRefs: readonly string[];
  readonly maxObservationAgeMs: number;
  readonly maxPairObservationSkewMs: number;
}

export type CryptoMemeHoneypotSimulationAdmissionStatus = 'ADMITTED' | 'NOT_ADMITTED';

export interface CryptoMemeHoneypotSimulationAdmissionResult {
  readonly contractVersion: typeof CRYPTO_MEME_HONEYPOT_SIMULATION_ADMISSION_VERSION;
  readonly status: CryptoMemeHoneypotSimulationAdmissionStatus;
  readonly evaluatedAt: string;
  readonly policyId: string;
  readonly policyVersion: string;
  readonly coverageAuthorityId: string;
  readonly coverageAuthorityVersion: string;
  readonly coverageEvidenceRefs: readonly string[];
  readonly chainId: string;
  readonly tokenAddress: string;
  readonly routeAuthorityId: string;
  readonly routeAuthorityVersion: string;
  readonly buyObservationAgeMs: number | null;
  readonly sellObservationAgeMs: number | null;
  readonly pairObservationSkewMs: number | null;
  readonly evidence: CryptoMemeHoneypotSimulationEvidence | null;
  readonly reason?: string;
  readonly scoreEligible: false;
  readonly executionEligible: false;
  readonly authority: 'RESEARCH_EVIDENCE_ADMISSION_ONLY';
}

export type HoneypotValidationExpectedOutcome = 'SAFE' | 'BLOCKED';

export interface HoneypotSimulationValidationCase {
  readonly caseId: string;
  readonly expectedOutcome: HoneypotValidationExpectedOutcome;
  /** Must be independently governed from the GoPlus provider under test. */
  readonly labelProviderId: string;
  readonly labelAuthorityId: string;
  readonly labelAuthorityVersion: string;
  readonly labelEvidenceRefs: readonly string[];
  readonly admission: CryptoMemeHoneypotSimulationAdmissionResult;
}

export interface HoneypotSimulationValidationReport {
  readonly contractVersion: typeof CRYPTO_MEME_HONEYPOT_SIMULATION_VALIDATION_VERSION;
  readonly evaluatedAt: string;
  readonly acceptedCaseCount: number;
  readonly rejectedCaseCount: number;
  readonly computableCaseCount: number;
  readonly inconclusiveCaseCount: number;
  readonly expectedSafeCount: number;
  readonly expectedBlockedCount: number;
  readonly trueSafeCount: number;
  readonly trueBlockedCount: number;
  readonly falseBlockedCount: number;
  readonly falseSafeCount: number;
  /** Includes inconclusive cases in the denominator so missing evidence never improves validation. */
  readonly computableRate: number | null;
  readonly safeAcceptanceRate: number | null;
  readonly blockedDetectionRate: number | null;
  readonly acceptedCaseIds: readonly string[];
  readonly rejectedCaseIds: readonly string[];
  readonly inconclusiveCaseIds: readonly string[];
  readonly scoreEligible: false;
  readonly executionEligible: false;
  /** Validation evidence is advisory input to a later human-gated promotion decision, never promotion itself. */
  readonly promotionEligible: false;
  readonly authority: 'RESEARCH_VALIDATION_ONLY';
}

function normalizedRefs(refs: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(refs.map((ref) => ref.trim()).filter(Boolean))].sort());
}

function isCanonicalEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

function validPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function validNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function validateAdmissionPolicy(policy: CryptoMemeHoneypotSimulationAdmissionPolicy): string | null {
  if (policy.contractVersion !== CRYPTO_MEME_HONEYPOT_SIMULATION_ADMISSION_VERSION) {
    return 'Unsupported admission policy contract version.';
  }
  if (!policy.policyId.trim() || !policy.policyVersion.trim()) {
    return 'Versioned admission policy identity is required.';
  }
  if (!/^[0-9]+$/.test(policy.chainId.trim()) || !isCanonicalEvmAddress(policy.tokenAddress)) {
    return 'Admission policy requires an exact numeric EVM chainId and token address.';
  }
  if (!policy.routeAuthorityId.trim() || !policy.routeAuthorityVersion.trim()) {
    return 'Admission policy requires the exact governed route authority identity.';
  }
  if (!policy.coverageAuthorityId.trim() || !policy.coverageAuthorityVersion.trim()) {
    return 'Versioned empirical coverage authority is required.';
  }
  if (normalizedRefs(policy.coverageEvidenceRefs).length === 0) {
    return 'Empirical coverage evidenceRefs are required.';
  }
  if (!validPositiveInteger(policy.maxObservationAgeMs)) {
    return 'maxObservationAgeMs must be a positive safe integer.';
  }
  if (!validNonNegativeInteger(policy.maxPairObservationSkewMs)) {
    return 'maxPairObservationSkewMs must be a non-negative safe integer.';
  }
  return null;
}

function admissionResult(
  policy: CryptoMemeHoneypotSimulationAdmissionPolicy,
  evaluatedAt: string,
  status: CryptoMemeHoneypotSimulationAdmissionStatus,
  timing: Readonly<{
    buyObservationAgeMs: number | null;
    sellObservationAgeMs: number | null;
    pairObservationSkewMs: number | null;
  }>,
  evidence: CryptoMemeHoneypotSimulationEvidence | null,
  reason?: string,
): CryptoMemeHoneypotSimulationAdmissionResult {
  return Object.freeze({
    contractVersion: CRYPTO_MEME_HONEYPOT_SIMULATION_ADMISSION_VERSION,
    status,
    evaluatedAt,
    policyId: policy.policyId.trim(),
    policyVersion: policy.policyVersion.trim(),
    coverageAuthorityId: policy.coverageAuthorityId.trim(),
    coverageAuthorityVersion: policy.coverageAuthorityVersion.trim(),
    coverageEvidenceRefs: normalizedRefs(policy.coverageEvidenceRefs),
    chainId: policy.chainId.trim(),
    tokenAddress: policy.tokenAddress.trim().toLowerCase(),
    routeAuthorityId: policy.routeAuthorityId.trim(),
    routeAuthorityVersion: policy.routeAuthorityVersion.trim(),
    ...timing,
    evidence,
    ...(reason ? { reason } : {}),
    scoreEligible: false,
    executionEligible: false,
    authority: 'RESEARCH_EVIDENCE_ADMISSION_ONLY' as const,
  });
}

/**
 * P1-A coverage/freshness gate. This function does not call a provider and does not construct a
 * transaction. It only admits already-governed BUY/SELL observations when exact coverage identity,
 * freshness and pair timing are explicitly policy-bound.
 */
export function admitMemeHoneypotSimulationEvidence(
  buy: GoPlusTradeSimulationEvidence,
  sell: GoPlusTradeSimulationEvidence,
  evaluatedAt: string,
  policy: CryptoMemeHoneypotSimulationAdmissionPolicy,
): CryptoMemeHoneypotSimulationAdmissionResult {
  const emptyTiming = {
    buyObservationAgeMs: null,
    sellObservationAgeMs: null,
    pairObservationSkewMs: null,
  } as const;
  const policyError = validateAdmissionPolicy(policy);
  if (policyError) return admissionResult(policy, evaluatedAt, 'NOT_ADMITTED', emptyTiming, null, policyError);

  const evaluationMs = Date.parse(evaluatedAt);
  if (!Number.isFinite(evaluationMs)) {
    return admissionResult(policy, evaluatedAt, 'NOT_ADMITTED', emptyTiming, null, 'A valid evaluatedAt timestamp is required.');
  }
  if (buy.kind !== 'BUY' || sell.kind !== 'SELL') {
    return admissionResult(policy, evaluatedAt, 'NOT_ADMITTED', emptyTiming, null, 'Exactly one BUY and one SELL observation are required.');
  }

  const policyIdentityMatches =
    buy.chainId === policy.chainId.trim()
    && sell.chainId === policy.chainId.trim()
    && buy.tokenAddress === policy.tokenAddress.trim().toLowerCase()
    && sell.tokenAddress === policy.tokenAddress.trim().toLowerCase()
    && buy.routeAuthorityId === policy.routeAuthorityId.trim()
    && sell.routeAuthorityId === policy.routeAuthorityId.trim()
    && buy.routeAuthorityVersion === policy.routeAuthorityVersion.trim()
    && sell.routeAuthorityVersion === policy.routeAuthorityVersion.trim();
  if (!policyIdentityMatches) {
    return admissionResult(
      policy,
      evaluatedAt,
      'NOT_ADMITTED',
      emptyTiming,
      null,
      'BUY/SELL evidence does not match the exact chain/token/route coverage policy identity.',
    );
  }

  if (
    buy.status !== 'VERIFIED'
    || sell.status !== 'VERIFIED'
    || !buy.evidenceId
    || !sell.evidenceId
    || buy.executionHandoffEligible !== false
    || sell.executionHandoffEligible !== false
  ) {
    return admissionResult(
      policy,
      evaluatedAt,
      'NOT_ADMITTED',
      emptyTiming,
      null,
      'Both provider observations must be VERIFIED, attributable and non-executable.',
    );
  }

  const buyRetrievedMs = Date.parse(buy.retrievedAt);
  const sellRetrievedMs = Date.parse(sell.retrievedAt);
  if (!Number.isFinite(buyRetrievedMs) || !Number.isFinite(sellRetrievedMs)) {
    return admissionResult(policy, evaluatedAt, 'NOT_ADMITTED', emptyTiming, null, 'Provider observation timestamps are invalid.');
  }
  if (evaluationMs < buyRetrievedMs || evaluationMs < sellRetrievedMs) {
    return admissionResult(policy, evaluatedAt, 'NOT_ADMITTED', emptyTiming, null, 'Evaluation timestamp cannot precede provider evidence.');
  }

  const buyObservationAgeMs = evaluationMs - buyRetrievedMs;
  const sellObservationAgeMs = evaluationMs - sellRetrievedMs;
  const pairObservationSkewMs = Math.abs(buyRetrievedMs - sellRetrievedMs);
  const timing = { buyObservationAgeMs, sellObservationAgeMs, pairObservationSkewMs } as const;

  if (buyObservationAgeMs > policy.maxObservationAgeMs || sellObservationAgeMs > policy.maxObservationAgeMs) {
    return admissionResult(policy, evaluatedAt, 'NOT_ADMITTED', timing, null, 'At least one simulation observation is stale under the governed admission policy.');
  }
  if (pairObservationSkewMs > policy.maxPairObservationSkewMs) {
    return admissionResult(policy, evaluatedAt, 'NOT_ADMITTED', timing, null, 'BUY/SELL observation skew exceeds the governed admission policy.');
  }

  const evidence = composeMemeHoneypotSimulationEvidence(buy, sell, evaluatedAt);
  if (evidence.status === 'NOT_COMPUTABLE') {
    return admissionResult(
      policy,
      evaluatedAt,
      'NOT_ADMITTED',
      timing,
      evidence,
      'The attributable fresh simulation pair remains NOT_COMPUTABLE.',
    );
  }

  return admissionResult(policy, evaluatedAt, 'ADMITTED', timing, evidence);
}

function validValidationLabel(item: HoneypotSimulationValidationCase): boolean {
  return Boolean(
    item.caseId.trim()
    && item.labelProviderId.trim()
    && item.labelAuthorityId.trim()
    && item.labelAuthorityVersion.trim()
    && normalizedRefs(item.labelEvidenceRefs).length > 0
    && item.labelProviderId.trim().toLowerCase() !== GOPLUS_TRANSACTION_SIMULATION_PROVIDER_ID,
  );
}

/**
 * Deterministic validation harness for an independently labelled corpus. Test fixtures can verify
 * the mathematics, but they are never real validation evidence. No threshold or automatic model
 * promotion is encoded here; the report remains research-validation-only.
 */
export function evaluateHoneypotSimulationValidation(
  cases: readonly HoneypotSimulationValidationCase[],
  evaluatedAt: string,
): HoneypotSimulationValidationReport {
  const seen = new Set<string>();
  const acceptedCaseIds: string[] = [];
  const rejectedCaseIds: string[] = [];
  const inconclusiveCaseIds: string[] = [];
  let expectedSafeCount = 0;
  let expectedBlockedCount = 0;
  let trueSafeCount = 0;
  let trueBlockedCount = 0;
  let falseBlockedCount = 0;
  let falseSafeCount = 0;
  let computableCaseCount = 0;

  for (const item of cases) {
    const caseId = item.caseId.trim();
    if (!validValidationLabel(item) || seen.has(caseId)) {
      rejectedCaseIds.push(caseId || '<missing-case-id>');
      continue;
    }
    seen.add(caseId);
    acceptedCaseIds.push(caseId);
    if (item.expectedOutcome === 'SAFE') expectedSafeCount += 1;
    else expectedBlockedCount += 1;

    const observed = item.admission.status === 'ADMITTED'
      ? item.admission.evidence?.status
      : undefined;
    if (observed !== 'READY' && observed !== 'BLOCKED') {
      inconclusiveCaseIds.push(caseId);
      continue;
    }

    computableCaseCount += 1;
    if (item.expectedOutcome === 'SAFE' && observed === 'READY') trueSafeCount += 1;
    else if (item.expectedOutcome === 'SAFE' && observed === 'BLOCKED') falseBlockedCount += 1;
    else if (item.expectedOutcome === 'BLOCKED' && observed === 'BLOCKED') trueBlockedCount += 1;
    else falseSafeCount += 1;
  }

  const acceptedCaseCount = acceptedCaseIds.length;
  const ratio = (numerator: number, denominator: number): number | null =>
    denominator > 0 ? numerator / denominator : null;

  return Object.freeze({
    contractVersion: CRYPTO_MEME_HONEYPOT_SIMULATION_VALIDATION_VERSION,
    evaluatedAt,
    acceptedCaseCount,
    rejectedCaseCount: rejectedCaseIds.length,
    computableCaseCount,
    inconclusiveCaseCount: inconclusiveCaseIds.length,
    expectedSafeCount,
    expectedBlockedCount,
    trueSafeCount,
    trueBlockedCount,
    falseBlockedCount,
    falseSafeCount,
    computableRate: ratio(computableCaseCount, acceptedCaseCount),
    safeAcceptanceRate: ratio(trueSafeCount, expectedSafeCount),
    blockedDetectionRate: ratio(trueBlockedCount, expectedBlockedCount),
    acceptedCaseIds: Object.freeze([...acceptedCaseIds].sort()),
    rejectedCaseIds: Object.freeze([...rejectedCaseIds].sort()),
    inconclusiveCaseIds: Object.freeze([...inconclusiveCaseIds].sort()),
    scoreEligible: false,
    executionEligible: false,
    promotionEligible: false,
    authority: 'RESEARCH_VALIDATION_ONLY' as const,
  });
}
