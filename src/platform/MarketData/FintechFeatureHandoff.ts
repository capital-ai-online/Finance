import {
  projectValidatedDataInputForFintech,
  type FintechDataHandoffProjection,
} from './FintechDataHandoff';
import type { ValidatedDataInput } from './ValidatedDataInput';

export type FintechComputability = 'COMPUTABLE' | 'NOT_COMPUTABLE';

/**
 * Thin FINTECH-owned FIN-12 validated-data projection over the canonical PVC-11 -> PVC-12 handoff.
 * It does not add another DQ decision: the existing handoff remains authoritative
 * and this surface only makes the downstream computability state explicit.
 */
export interface FintechFeatureHandoffProjection extends FintechDataHandoffProjection {
  readonly computability: FintechComputability;
}

export function projectValidatedFeatureDataForFintech(
  input: ValidatedDataInput,
): FintechFeatureHandoffProjection {
  const projection = projectValidatedDataInputForFintech(input);
  return {
    ...projection,
    computability: projection.admissibleForNumericFeatures
      ? 'COMPUTABLE'
      : 'NOT_COMPUTABLE',
  };
}
