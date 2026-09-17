import { UNIVERSAL_ASSET_CONTRACT_VERSION } from '../Scoring/contracts';
import { evaluateDataFreshness } from './dataFreshness';
import type { FintechComputability } from './FintechFeatureHandoff';
import {
  VALIDATED_DATA_INPUT_CONTRACT_VERSION,
  type ValidatedHistoryInput,
} from './ValidatedDataInput';

export interface FintechHistoryPoint {
  readonly timestamp: string;
  readonly value: number;
}

/**
 * FINTECH-owned validated-data projection of the existing canonical ValidatedHistoryInput across
 * PVC-11 -> PVC-12. It does not create a second history authority: callers must
 * first use buildValidatedHistoryInput(), which remains responsible for provider
 * input validation, provenance and signed-vs-price value semantics.
 */
export interface FintechHistoryHandoffProjection {
  readonly sourceContractVersion: typeof VALIDATED_DATA_INPUT_CONTRACT_VERSION;
  readonly assetId: string;
  readonly correlationId: string;
  readonly providerId: string;
  readonly providerFeed: string | null;
  readonly evidenceRef: string | null;
  readonly observedAt: string | null;
  readonly retrievedAt: string;
  readonly valueSemantics: ValidatedHistoryInput['valueSemantics'];
  readonly sourceStatus: ValidatedHistoryInput['status'];
  readonly provenanceComplete: boolean;
  readonly computability: FintechComputability;
  readonly points: readonly FintechHistoryPoint[];
  readonly blockingReasons: readonly string[];
}

function normalizeSymbol(value: string): string {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function validTimestamp(value: string | null | undefined): value is string {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function latestTimestamp(
  points: readonly { readonly timestamp: string }[],
): string | null {
  if (points.length === 0) return null;
  return points.reduce<string | null>((latest, point) => {
    if (!validTimestamp(point.timestamp)) return latest;
    if (!latest || Date.parse(point.timestamp) > Date.parse(latest)) return point.timestamp;
    return latest;
  }, null);
}

function pointValueValid(
  value: number,
  semantics: ValidatedHistoryInput['valueSemantics'],
): boolean {
  if (!Number.isFinite(value)) return false;
  return semantics === 'SIGNED_VALUE' ? true : value > 0;
}

function addReason(reasons: string[], reason: string): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

export function projectValidatedHistoryInputForFintech(
  input: ValidatedHistoryInput,
): FintechHistoryHandoffProjection {
  const blockingReasons: string[] = [];
  const symbol = normalizeSymbol(input.assetIdentity.symbol);
  const observedAt = latestTimestamp(input.points);

  if (String(input.contractVersion) !== VALIDATED_DATA_INPUT_CONTRACT_VERSION) {
    addReason(blockingReasons, `contract-version:${String(input.contractVersion)}`);
  }
  if (
    input.assetIdentity.contractVersion !== UNIVERSAL_ASSET_CONTRACT_VERSION
    || !symbol
    || input.assetIdentity.assetId !== `${input.assetIdentity.assetClass}:${symbol}`
  ) {
    addReason(blockingReasons, 'asset-identity-invalid');
  }
  if (!input.correlationId.trim()) addReason(blockingReasons, 'correlation-id-required');
  if (!input.providerId.trim()) addReason(blockingReasons, 'provider-required');
  if (!input.evidenceRef?.trim()) addReason(blockingReasons, 'evidence-required');
  if (!validTimestamp(input.receivedAt)) addReason(blockingReasons, 'retrieved-at-invalid');
  if (!input.provenanceComplete) addReason(blockingReasons, 'provenance-incomplete');
  if (input.status !== 'PASS') addReason(blockingReasons, `source-status:${input.status}`);

  if (input.points.length === 0) {
    addReason(blockingReasons, 'history-points-required');
  } else {
    for (const [index, point] of input.points.entries()) {
      if (!validTimestamp(point.timestamp)) {
        addReason(blockingReasons, `point:${index}:timestamp-invalid`);
      }
      if (!pointValueValid(point.close, input.valueSemantics)) {
        addReason(blockingReasons, `point:${index}:value-invalid`);
      }
    }
  }

  if (!observedAt) {
    addReason(blockingReasons, 'observed-at-required');
  } else if (validTimestamp(input.receivedAt)) {
    const freshness = evaluateDataFreshness({
      capability: 'history',
      observedAt,
      evaluatedAt: input.receivedAt,
    });
    if (!freshness.scoringAdmissible) {
      addReason(blockingReasons, `history-freshness:${freshness.state}`);
    }
  }

  const computability: FintechComputability = blockingReasons.length === 0
    ? 'COMPUTABLE'
    : 'NOT_COMPUTABLE';

  return {
    sourceContractVersion: VALIDATED_DATA_INPUT_CONTRACT_VERSION,
    assetId: input.assetIdentity.assetId,
    correlationId: input.correlationId,
    providerId: input.providerId,
    providerFeed: input.providerFeed,
    evidenceRef: input.evidenceRef,
    observedAt,
    retrievedAt: input.receivedAt,
    valueSemantics: input.valueSemantics,
    sourceStatus: input.status,
    provenanceComplete: input.provenanceComplete,
    computability,
    points: computability === 'COMPUTABLE'
      ? input.points.map(point => ({ timestamp: point.timestamp, value: point.close }))
      : [],
    blockingReasons,
  };
}
