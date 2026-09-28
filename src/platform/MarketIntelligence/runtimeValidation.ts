import { PROVIDER_MATRIX } from '../MarketData/ProviderMatrix';
import type { ProviderCapability } from '../MarketData/contracts';
import { ANALYSIS_COMPONENTS, getAnalysisComponent } from './AnalysisComponentRegistry';
import {
  ANALYSIS_COMPONENT_RESULT_CONTRACT_VERSION,
  type AnalysisComponentDescriptor,
  type AnalysisComponentResult,
} from './contracts';
import { confidenceIsDataSufficiency, failClosedEligibility } from './componentPolicies';
import { isAnalysisReasonCodeCatalogId } from './reasonCodeCatalog';

const providerCapabilities = new Set<ProviderCapability>(
  PROVIDER_MATRIX.flatMap(entry => [...entry.capabilities]),
);

function nonEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateAnalysisComponentRegistry(
  components: readonly AnalysisComponentDescriptor[] = ANALYSIS_COMPONENTS,
): readonly string[] {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (components.length !== 50) errors.push(`component-count:${components.length}`);

  for (const descriptor of components) {
    if (!nonEmpty(descriptor.componentId)) errors.push('component-id-empty');
    if (ids.has(descriptor.componentId)) errors.push(`component-id-duplicate:${descriptor.componentId}`);
    ids.add(descriptor.componentId);

    if (!nonEmpty(descriptor.displayName)) errors.push(`display-name-empty:${descriptor.componentId}`);
    if (descriptor.assetClassScope.length === 0) errors.push(`asset-scope-empty:${descriptor.componentId}`);
    if (descriptor.dataAvailability.length === 0) errors.push(`data-availability-empty:${descriptor.componentId}`);
    if (descriptor.inputContracts.length === 0) errors.push(`input-contracts-empty:${descriptor.componentId}`);
    if (!nonEmpty(descriptor.calculationVersion)) errors.push(`calculation-version-empty:${descriptor.componentId}`);
    if (!isAnalysisReasonCodeCatalogId(descriptor.reasonCodeCatalog)) {
      errors.push(`reason-code-catalog-unknown:${descriptor.componentId}:${descriptor.reasonCodeCatalog}`);
    }
    if (descriptor.owner !== 'CAPITAL-AI-FINTECH') errors.push(`owner-invalid:${descriptor.componentId}`);
    if (descriptor.lastValidatedAt !== null && !Number.isFinite(Date.parse(descriptor.lastValidatedAt))) {
      errors.push(`last-validated-at-invalid:${descriptor.componentId}`);
    }

    for (const dependency of descriptor.providerDependencies) {
      if (!providerCapabilities.has(dependency.capability)) {
        errors.push(`provider-capability-unmapped:${descriptor.componentId}:${dependency.capability}`);
      }
    }

    if (
      ['planned','mock','shadow','blocked','retired'].includes(descriptor.status)
      && descriptor.eligibilityPolicy === 'canonical-score-only'
      && descriptor.status !== 'shadow'
    ) {
      errors.push(`nonactive-canonical-eligibility-policy:${descriptor.componentId}`);
    }
  }

  return Object.freeze(errors.sort());
}

export function validateAnalysisComponentResult(
  result: AnalysisComponentResult<unknown>,
): readonly string[] {
  const errors: string[] = [];
  const descriptor = getAnalysisComponent(result.componentId);

  if (!descriptor) return Object.freeze([`component-unknown:${result.componentId}`]);
  if (result.contractVersion !== ANALYSIS_COMPONENT_RESULT_CONTRACT_VERSION) {
    errors.push('result-contract-version-invalid');
  }
  if (result.calculationVersion !== descriptor.calculationVersion) {
    errors.push('calculation-version-mismatch');
  }
  if (!nonEmpty(result.assetId)) errors.push('asset-id-empty');
  if (!nonEmpty(result.correlationId)) errors.push('correlation-id-empty');
  if (!Number.isFinite(Date.parse(result.evaluatedAt))) errors.push('evaluated-at-invalid');
  if (!confidenceIsDataSufficiency(result)) errors.push('confidence-invalid');

  const guardedEligibility = failClosedEligibility(
    descriptor,
    result.eligibility,
    result.sourceMode,
  );
  if (
    guardedEligibility.scoreEligible !== result.eligibility.scoreEligible
    || guardedEligibility.rankingEligible !== result.eligibility.rankingEligible
    || guardedEligibility.alertEligible !== result.eligibility.alertEligible
  ) {
    errors.push('eligibility-violates-lifecycle-or-source-mode');
  }

  if (result.sourceMode === 'DEMO' && result.status === 'READY') {
    errors.push('demo-result-cannot-be-ready');
  }
  if (result.risk.state === 'BLOCK'
    && (result.eligibility.scoreEligible || result.eligibility.rankingEligible || result.eligibility.alertEligible)) {
    errors.push('risk-block-cannot-be-eligible');
  }
  if ((result.status === 'NOT_COMPUTABLE' || result.status === 'BLOCKED') && result.value !== null) {
    errors.push('noncomputable-result-must-have-null-value');
  }

  return Object.freeze(errors.sort());
}
