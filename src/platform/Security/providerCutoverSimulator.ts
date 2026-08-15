import {
  evaluateProviderCutoverReadiness,
  evaluateProviderScopedAuthorization,
  type ProviderCutoverEvidence,
  type ProviderScopedAuthorizationDecision,
  type ProviderScopedAuthorizationRequest,
} from './providerProfile';

export type ProviderCutoverVerdict = 'ALLOW' | 'DENY';

export interface ProviderCutoverSimulationRequest {
  baselineVerdict: ProviderCutoverVerdict;
  candidateRequest: Readonly<ProviderScopedAuthorizationRequest>;
  cutoverEvidence: Readonly<ProviderCutoverEvidence>;
}

export type ProviderCutoverSimulationResult =
  | {
      status: 'MATCH';
      executionPermitted: false;
      baselineVerdict: ProviderCutoverVerdict;
      candidateVerdict: ProviderCutoverVerdict;
      candidateDecision: ProviderScopedAuthorizationDecision;
      reason: string;
    }
  | {
      status: 'MISMATCH';
      executionPermitted: false;
      baselineVerdict: ProviderCutoverVerdict;
      candidateVerdict: ProviderCutoverVerdict;
      candidateDecision: ProviderScopedAuthorizationDecision;
      reason: string;
    }
  | {
      status: 'BLOCKED' | 'NOT_APPLICABLE';
      executionPermitted: false;
      reason: string;
      missingEvidence: readonly (keyof ProviderCutoverEvidence)[];
    };

/**
 * SA-P05 / M8 sandbox-only provider cutover simulator.
 *
 * The simulator never invokes a provider, tool or mutation endpoint. It first applies the
 * fail-closed readiness gate, then evaluates the candidate through the canonical Provider Profile
 * + Agent IAM chain and compares that verdict with the already-observed baseline verdict.
 * A MATCH is evidence for review only and never an execution permit.
 */
export function simulateProviderCutover(
  request: Readonly<ProviderCutoverSimulationRequest>,
): ProviderCutoverSimulationResult {
  const readiness = evaluateProviderCutoverReadiness(
    request.candidateRequest.appId,
    request.cutoverEvidence,
    request.candidateRequest.registry,
  );

  if (readiness.status === 'BLOCKED') {
    return {
      status: 'BLOCKED',
      executionPermitted: false,
      reason: readiness.reason,
      missingEvidence: readiness.missingEvidence,
    };
  }

  if (readiness.status === 'NOT_APPLICABLE') {
    return {
      status: 'NOT_APPLICABLE',
      executionPermitted: false,
      reason: readiness.reason,
      missingEvidence: [],
    };
  }

  const candidateDecision = evaluateProviderScopedAuthorization(request.candidateRequest);
  const candidateVerdict = candidateDecision.verdict;

  if (candidateVerdict !== request.baselineVerdict) {
    return {
      status: 'MISMATCH',
      executionPermitted: false,
      baselineVerdict: request.baselineVerdict,
      candidateVerdict,
      candidateDecision,
      reason: 'Baseline- und Kandidatenentscheidung weichen ab; Cutover bleibt blockiert.',
    };
  }

  return {
    status: 'MATCH',
    executionPermitted: false,
    baselineVerdict: request.baselineVerdict,
    candidateVerdict,
    candidateDecision,
    reason: 'Shadow-Entscheidungen sind äquivalent; das Ergebnis ist nur Review-Evidence und keine Ausführungsfreigabe.',
  };
}
