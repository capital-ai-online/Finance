import { describe, expect, it } from 'vitest';
import {
  simulateProviderCutover,
  type ProviderCutoverSimulationRequest,
} from '../../src/platform/Security/providerCutoverSimulator';
import type { ProviderScopedAuthorizationRequest } from '../../src/platform/Security/providerProfile';

const completeEvidence = {
  realCallerVerified: true,
  canonicalControlPlanePathVerified: true,
  providerSpecificBypassDenied: true,
  auditCorrelationVerified: true,
  rollbackToReadOnlyVerified: true,
  externalHostConfigurationVerified: true,
} as const;

function candidate(
  appId = 'chatgpt-github-connector',
  overrides: Partial<ProviderScopedAuthorizationRequest> = {},
): ProviderScopedAuthorizationRequest {
  return {
    appId,
    principal: {
      humanActorId: 'SvenKulessa',
      appId,
      agentId: `${appId}-agent`,
      sessionId: 'session-sa-p05',
      requestId: 'request-sa-p05',
      credentialHolderId: `${appId}-credential-holder`,
      provider: 'provider-neutral',
      model: 'provider-neutral',
    },
    capability: 'BRANCH',
    riskClass: 'MEDIUM',
    environment: 'development',
    targetResource: 'repo:SvenKulessa/Finance',
    auditCorrelationId: 'audit-sa-p05',
    envelopeId: 'envelope-sa-p05',
    ...overrides,
  };
}

function simulation(
  overrides: Partial<ProviderCutoverSimulationRequest> = {},
): ProviderCutoverSimulationRequest {
  return {
    baselineVerdict: 'ALLOW',
    candidateRequest: candidate(),
    cutoverEvidence: completeEvidence,
    ...overrides,
  };
}

describe('SA-P05 Provider Cutover Simulator', () => {
  it('reports matching shadow decisions without ever permitting execution', () => {
    const result = simulateProviderCutover(simulation());
    expect(result).toMatchObject({
      status: 'MATCH',
      executionPermitted: false,
      baselineVerdict: 'ALLOW',
      candidateVerdict: 'ALLOW',
    });
  });

  it('blocks a semantic mismatch fail-closed', () => {
    const result = simulateProviderCutover(simulation({
      candidateRequest: candidate('chatgpt-github-connector', { killSwitchActive: true }),
    }));
    expect(result).toMatchObject({
      status: 'MISMATCH',
      executionPermitted: false,
      baselineVerdict: 'ALLOW',
      candidateVerdict: 'DENY',
    });
  });

  it('blocks before authorization when readiness evidence is incomplete', () => {
    const result = simulateProviderCutover(simulation({
      cutoverEvidence: { ...completeEvidence, externalHostConfigurationVerified: false },
    }));
    expect(result).toMatchObject({
      status: 'BLOCKED',
      executionPermitted: false,
      missingEvidence: ['externalHostConfigurationVerified'],
    });
  });

  it('marks retired Google AI Studio / NotebookLM as RETIRED (Owner 2026-08-16)', () => {
    const google = simulateProviderCutover(simulation({
      candidateRequest: candidate('google-ai-studio', { capability: 'READ' }),
    }));
    const notebook = simulateProviderCutover(simulation({
      candidateRequest: candidate('notebooklm', { capability: 'READ' }),
    }));
    expect(google).toMatchObject({ status: 'RETIRED', executionPermitted: false });
    expect(notebook).toMatchObject({ status: 'RETIRED', executionPermitted: false });
  });

  it('marks removed Gemini alias as RETIRED', () => {
    const result = simulateProviderCutover(simulation({
      candidateRequest: candidate('gemini'),
    }));
    expect(result).toMatchObject({ status: 'RETIRED', executionPermitted: false });
  });

  it('surfaces replay denial as a shadow mismatch and never mutates state', () => {
    const result = simulateProviderCutover(simulation({
      candidateRequest: candidate('claude-code-cli', {
        seenEnvelopeIds: new Set(['envelope-sa-p05']),
      }),
    }));
    expect(result).toMatchObject({
      status: 'MISMATCH',
      executionPermitted: false,
      candidateVerdict: 'DENY',
    });
  });
});
