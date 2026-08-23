import type { VisualizationAuthority } from '../../../shared/ui/AuthorityBadge';

export interface CryptoVisualizationMetric<T = unknown> {
  readonly id: string;
  readonly label: string;
  readonly value: T;
  readonly authority: VisualizationAuthority;
  readonly status: string;
  readonly observedAt?: string | null;
  readonly retrievedAt?: string | null;
  readonly providers: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly scoreEligible?: boolean;
  readonly executionEligible?: boolean;
  readonly reason?: string | null;
}

export interface CryptoVisualizationMetricInput<T = unknown> {
  readonly id: string;
  readonly label: string;
  readonly value: T;
  readonly authority: VisualizationAuthority;
  readonly status: string;
  readonly observedAt?: string | null;
  readonly retrievedAt?: string | null;
  readonly providers?: readonly string[];
  readonly evidenceIds?: readonly string[];
  readonly scoreEligible?: boolean;
  readonly executionEligible?: boolean;
  readonly reason?: string | null;
}

export interface CryptoVisualizationViewModel {
  readonly metrics: readonly CryptoVisualizationMetric[];
}

function uniqueStrings(values?: readonly string[]): readonly string[] {
  if (!values) return Object.freeze([]);
  return Object.freeze([...new Set(values.map(value => value.trim()).filter(Boolean))]);
}

function assertAuthorityInvariant(input: CryptoVisualizationMetricInput): void {
  if (input.authority === 'RESEARCH') {
    if (input.scoreEligible !== false || input.executionEligible !== false) {
      throw new Error('CRYPTO_VISUALIZATION_RESEARCH_AUTHORITY_MISMATCH');
    }
  }

  if (input.authority === 'EVIDENCE_ONLY') {
    if (input.scoreEligible !== false || input.executionEligible !== false) {
      throw new Error('CRYPTO_VISUALIZATION_EVIDENCE_AUTHORITY_MISMATCH');
    }
  }
}

/**
 * Pure read-only projection from already-authorized backend/runtime contracts into presentation data.
 *
 * This function does not calculate scores, freshness, eligibility, gate outcomes or missing values.
 * It preserves null/undefined values and rejects only presentation-level authority contradictions for
 * RESEARCH and EVIDENCE_ONLY metrics, whose current parent contracts are explicitly non-authorizing.
 */
export function createCryptoVisualizationMetric<T>(
  input: CryptoVisualizationMetricInput<T>,
): CryptoVisualizationMetric<T> {
  assertAuthorityInvariant(input);

  return Object.freeze({
    id: input.id,
    label: input.label,
    value: input.value,
    authority: input.authority,
    status: input.status,
    observedAt: input.observedAt ?? null,
    retrievedAt: input.retrievedAt ?? null,
    providers: uniqueStrings(input.providers),
    evidenceIds: uniqueStrings(input.evidenceIds),
    scoreEligible: input.scoreEligible,
    executionEligible: input.executionEligible,
    reason: input.reason ?? null,
  });
}

export function createCryptoVisualizationViewModel(
  metrics: readonly CryptoVisualizationMetric[],
): CryptoVisualizationViewModel {
  return Object.freeze({ metrics: Object.freeze([...metrics]) });
}
