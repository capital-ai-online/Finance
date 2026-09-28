import type {
  AnalysisComponentDescriptor,
  AnalysisComponentEligibility,
  AnalysisComponentResult,
} from './contracts';

export const ANALYSIS_COMPONENT_POLICY_VERSION = 'analysis-component-policy/1.0.0' as const;

export function lifecycleAllowsProductiveEligibility(
  descriptor: AnalysisComponentDescriptor,
): boolean {
  return descriptor.status === 'active';
}

export function failClosedEligibility(
  descriptor: AnalysisComponentDescriptor,
  requested: AnalysisComponentEligibility,
  sourceMode: AnalysisComponentResult['sourceMode'],
): AnalysisComponentEligibility {
  if (sourceMode === 'DEMO' || !lifecycleAllowsProductiveEligibility(descriptor)) {
    return Object.freeze({
      scoreEligible: false,
      rankingEligible: false,
      alertEligible: false,
    });
  }

  if (descriptor.riskPolicy === 'research-block' || descriptor.eligibilityPolicy === 'research-only') {
    return Object.freeze({
      scoreEligible: false,
      rankingEligible: false,
      alertEligible: false,
    });
  }

  return Object.freeze({ ...requested });
}

export function confidenceIsDataSufficiency(
  result: AnalysisComponentResult<unknown>,
): boolean {
  if (result.confidence.semantics !== 'DATA_SUFFICIENCY') return false;
  return result.confidence.value === null
    || (Number.isFinite(result.confidence.value)
      && result.confidence.value >= 0
      && result.confidence.value <= 1);
}
