import { describe, expect, it } from 'vitest';
import {
  evaluateProviderCutoverReadiness,
  evaluateProviderScopedAuthorization,
  PROVIDER_PROFILES,
  type ProviderScopedAuthorizationRequest,
} from '../../src/platform/Security/providerProfile';
import type { AgentPrincipalContext } from '../../src/platform/Security/agentIam';

// M8 (ADR-0062, docs/runbooks/M8_AGENT_CUTOVER.md, "Policy Equivalence Tests" and "Negative Tests").
// Proves the Phase 1 Provider Profile Contract + Registry: the same semantic request produces the
// same authorization outcome regardless of provider where inputs are equivalent, and every
// required negative scenario actually resolves to DENY.

function principal(appId: string, overrides: Partial<AgentPrincipalContext> = {}): AgentPrincipalContext {
  return {
    humanActorId: 'SvenKulessa',
    appId,
    agentId: `${appId}-agent`,
    sessionId: 'session-1',
    requestId: 'req-1',
    credentialHolderId: `${appId}-credential-holder`,
    provider: 'irrelevant-should-not-matter',
    model: 'irrelevant-should-not-matter',
    ...overrides,
  };
}

function request(
  appId: string,
  overrides: Partial<ProviderScopedAuthorizationRequest> = {},
): ProviderScopedAuthorizationRequest {
  return {
    appId,
    principal: principal(appId),
    capability: 'READ',
    riskClass: 'LOW',
    environment: 'production',
    targetResource: 'repo:SvenKulessa/Finance',
    ...overrides,
  };
}

describe('Provider Profile Registry', () => {
  it('declares all four documented providers with a capability ceiling', () => {
    expect(Object.keys(PROVIDER_PROFILES).sort()).toEqual([
      'chatgpt-github-connector',
      'claude-code-cli',
      'google-ai-studio',
      'notebooklm',
    ]);
  });

  it('never grants a research-plane profile any mutating capability (constructor-enforced)', () => {
    expect(PROVIDER_PROFILES.notebooklm.allowedCapabilities).toEqual(['READ', 'ANALYZE']);
  });

  it('never lists MERGE for any profile (it is not a known agent capability at all)', () => {
    for (const p of Object.values(PROVIDER_PROFILES)) {
      expect(p.allowedCapabilities).not.toContain('MERGE');
    }
  });
});

describe('Policy Equivalence Tests (M8 runbook)', () => {
  it('allows read-only under any profile that grants READ', () => {
    const chatgpt = evaluateProviderScopedAuthorization(request('chatgpt-github-connector'));
    const claude = evaluateProviderScopedAuthorization(request('claude-code-cli'));
    expect(chatgpt.verdict).toBe('ALLOW');
    expect(claude.verdict).toBe('ALLOW');
  });

  it('allows repository PR work identically for ChatGPT and Claude Code under an equivalent scoped request', () => {
    const approvalFor = (appId: string) => ({
      approvalId: 'approval-1',
      approvedByHumanActorId: 'SvenKulessa',
      subjectAgentId: `${appId}-agent`,
      capability: 'PR' as const,
      targetResource: 'repo:SvenKulessa/Finance',
      expiresAt: '2099-01-01T00:00:00.000Z',
      stepUpVerified: false,
    });
    const chatgpt = evaluateProviderScopedAuthorization(
      request('chatgpt-github-connector', {
        capability: 'PR', riskClass: 'MEDIUM', auditCorrelationId: 'audit-pr-1', approval: approvalFor('chatgpt-github-connector'),
      }),
    );
    const claude = evaluateProviderScopedAuthorization(
      request('claude-code-cli', {
        capability: 'PR', riskClass: 'MEDIUM', auditCorrelationId: 'audit-pr-1', approval: approvalFor('claude-code-cli'),
      }),
    );
    expect(chatgpt.verdict).toBe('ALLOW');
    expect(claude.verdict).toBe('ALLOW');
  });

  it('denies MERGE for every provider profile', () => {
    for (const appId of Object.keys(PROVIDER_PROFILES)) {
      const decision = evaluateProviderScopedAuthorization(request(appId, { capability: 'MERGE' }));
      expect(decision.verdict).toBe('DENY');
    }
  });

  it('denies production mutation without an explicit approved Handoff/permit, identically across providers', () => {
    const chatgpt = evaluateProviderScopedAuthorization(
      request('chatgpt-github-connector', { capability: 'PRODUCTION_MUTATION', riskClass: 'CRITICAL' }),
    );
    // PRODUCTION_MUTATION is outside both profiles' allowedCapabilities in the first place.
    expect(chatgpt.verdict).toBe('DENY');
    expect(chatgpt.layer).toBe('PROVIDER_PROFILE');
  });

  it('denies a missing/empty target resource identically across providers ("wrong target")', () => {
    const chatgpt = evaluateProviderScopedAuthorization(request('chatgpt-github-connector', { targetResource: '' }));
    const claude = evaluateProviderScopedAuthorization(request('claude-code-cli', { targetResource: '' }));
    expect(chatgpt.verdict).toBe('DENY');
    expect(claude.verdict).toBe('DENY');
  });

  it('denies an expired approval identically across providers', () => {
    const expiredApproval = {
      approvalId: 'approval-expired',
      approvedByHumanActorId: 'SvenKulessa',
      subjectAgentId: 'claude-code-cli-agent',
      capability: 'PR' as const,
      targetResource: 'repo:SvenKulessa/Finance',
      expiresAt: '2020-01-01T00:00:00.000Z',
      stepUpVerified: false,
    };
    const decision = evaluateProviderScopedAuthorization(
      request('claude-code-cli', { capability: 'PR', riskClass: 'MEDIUM', approval: expiredApproval }),
    );
    expect(decision.verdict).toBe('DENY');
  });

  it('denies Self-Authority-Expansion-shaped capabilities the same way it denies MERGE (unknown to the agent capability model)', () => {
    const decision = evaluateProviderScopedAuthorization(request('claude-code-cli', { capability: 'SELF_AUTHORITY_EXPANSION' }));
    expect(decision.verdict).toBe('DENY');
    expect(decision.layer).toBe('PROVIDER_PROFILE');
  });

  it('ignores a provider/model field that claims admin status', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('notebooklm', {
        principal: principal('notebooklm', { provider: 'admin', model: 'owner-override' }),
        capability: 'READ',
      }),
    );
    expect(decision.verdict).toBe('ALLOW');
    // Same request with a mutating capability must still be denied despite the spoofed fields.
    const mutation = evaluateProviderScopedAuthorization(
      request('notebooklm', {
        principal: principal('notebooklm', { provider: 'admin', model: 'owner-override' }),
        capability: 'BRANCH',
      }),
    );
    expect(mutation.verdict).toBe('DENY');
  });

  it('denies a mutation attempt under the research profile', () => {
    const decision = evaluateProviderScopedAuthorization(request('notebooklm', { capability: 'BRANCH' }));
    expect(decision.verdict).toBe('DENY');
    expect(decision.layer).toBe('PROVIDER_PROFILE');
  });

  it('denies a mutating request with no audit correlation id', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('claude-code-cli', { capability: 'BRANCH', auditCorrelationId: undefined }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Audit-Korrelations-ID/);
  });
});

describe('Negative Tests (M8 runbook)', () => {
  it('denies an unknown provider profile', () => {
    const decision = evaluateProviderScopedAuthorization(request('some-unregistered-app'));
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Unbekanntes Provider-Profil/);
  });

  it('denies when the principal appId does not match the requested provider profile', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('claude-code-cli', { principal: principal('chatgpt-github-connector') }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/appId/);
  });

  it('denies a request with an incomplete principal on a privileged capability', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('claude-code-cli', {
        capability: 'PR',
        riskClass: 'MEDIUM',
        principal: { ...principal('claude-code-cli'), humanActorId: '' },
        approval: {
          approvalId: 'approval-1',
          approvedByHumanActorId: 'SvenKulessa',
          subjectAgentId: 'claude-code-cli-agent',
          capability: 'PR',
          targetResource: 'repo:SvenKulessa/Finance',
          expiresAt: '2099-01-01T00:00:00.000Z',
          stepUpVerified: false,
        },
      }),
    );
    expect(decision.verdict).toBe('DENY');
  });

  it('denies a profile/capability mismatch (capability not in this profile\'s allowlist)', () => {
    const decision = evaluateProviderScopedAuthorization(request('google-ai-studio', { capability: 'BRANCH' }));
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/liegt außerhalb des Provider-Profils/);
  });

  it('has no "direct admin" path: every request must resolve through a registered profile', () => {
    const decision = evaluateProviderScopedAuthorization(request(''));
    expect(decision.verdict).toBe('DENY');
  });

  it('denies a research profile calling a mutation endpoint', () => {
    const decision = evaluateProviderScopedAuthorization(request('notebooklm', { capability: 'CI_REQUEST' }));
    expect(decision.verdict).toBe('DENY');
  });

  it('denies a target mismatch (empty target on an otherwise valid request)', () => {
    const decision = evaluateProviderScopedAuthorization(request('claude-code-cli', { targetResource: '   ' }));
    expect(decision.verdict).toBe('DENY');
  });

  it('denies a replayed mutation envelope (dedupe)', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('claude-code-cli', {
        capability: 'BRANCH',
        auditCorrelationId: 'audit-1',
        envelopeId: 'envelope-1',
        seenEnvelopeIds: new Set(['envelope-1']),
      }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Replay/);
  });

  it('denies when audit is unavailable on a mutation path', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('claude-code-cli', { capability: 'COMMIT', auditCorrelationId: '' }),
    );
    expect(decision.verdict).toBe('DENY');
  });

  it('denies mutation while the kill switch is active but keeps read access', () => {
    const mutation = evaluateProviderScopedAuthorization(
      request('claude-code-cli', { capability: 'BRANCH', killSwitchActive: true }),
    );
    const read = evaluateProviderScopedAuthorization(
      request('claude-code-cli', { capability: 'READ', killSwitchActive: true }),
    );
    expect(mutation.verdict).toBe('DENY');
    expect(read.verdict).toBe('ALLOW');
  });
});

// M8 (ADR-0062) Exit Gate item 6: "rollback-to-read-only is proven", specifically "disable the
// privileged provider profile" (M8 runbook Rollback requirement 1). Proves the profile registry
// itself is a real, independent rollback lever - distinct from the killSwitchActive flag above -
// using a rolled-back registry snapshot injected via the registry parameter, never mutating the
// real exported PROVIDER_PROFILES singleton.
describe('Rollback-to-read-only via profile registry (M8 Exit Gate item 6)', () => {
  const rolledBackRegistry = {
    ...PROVIDER_PROFILES,
    'chatgpt-github-connector': {
      ...PROVIDER_PROFILES['chatgpt-github-connector'],
      allowedCapabilities: ['READ', 'ANALYZE'] as const,
    },
  };

  it('denies a previously-allowed mutating capability once the profile is rolled back', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('chatgpt-github-connector', { capability: 'BRANCH', registry: rolledBackRegistry }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.layer).toBe('PROVIDER_PROFILE');
  });

  it('keeps read access available through the same rolled-back profile', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('chatgpt-github-connector', { capability: 'READ', registry: rolledBackRegistry }),
    );
    expect(decision.verdict).toBe('ALLOW');
  });

  it('never mutated the real exported PROVIDER_PROFILES singleton', () => {
    expect(PROVIDER_PROFILES['chatgpt-github-connector'].allowedCapabilities).toContain('BRANCH');
  });
});


describe('M8 Provider Cutover Readiness Gate', () => {
  const completeEvidence = {
    realCallerVerified: true,
    canonicalControlPlanePathVerified: true,
    providerSpecificBypassDenied: true,
    auditCorrelationVerified: true,
    rollbackToReadOnlyVerified: true,
    externalHostConfigurationVerified: true,
  } as const;

  it('allows a mutating provider only with complete cutover evidence', () => {
    const decision = evaluateProviderCutoverReadiness(
      'chatgpt-github-connector',
      completeEvidence,
    );
    expect(decision.status).toBe('READY');
  });

  it('fails closed when external host or bypass evidence is missing', () => {
    const decision = evaluateProviderCutoverReadiness('claude-code-cli', {
      ...completeEvidence,
      providerSpecificBypassDenied: false,
      externalHostConfigurationVerified: false,
    });
    expect(decision).toMatchObject({
      status: 'BLOCKED',
      missingEvidence: [
        'providerSpecificBypassDenied',
        'externalHostConfigurationVerified',
      ],
    });
  });

  it('keeps Google AI Studio non-privileged and does not require a Gemini runtime cutover', () => {
    const decision = evaluateProviderCutoverReadiness('google-ai-studio', {
      realCallerVerified: false,
      canonicalControlPlanePathVerified: false,
      providerSpecificBypassDenied: false,
      auditCorrelationVerified: false,
      rollbackToReadOnlyVerified: false,
      externalHostConfigurationVerified: false,
    });
    expect(decision.status).toBe('NOT_APPLICABLE');
    expect(PROVIDER_PROFILES['google-ai-studio'].allowedCapabilities).not.toContain('BRANCH');
    expect(PROVIDER_PROFILES['google-ai-studio'].allowedCapabilities).not.toContain('PR');
    expect(PROVIDER_PROFILES.gemini).toBeUndefined();
  });

  it('keeps NotebookLM research-only and outside privileged cutover', () => {
    const decision = evaluateProviderCutoverReadiness('notebooklm', completeEvidence);
    expect(decision.status).toBe('NOT_APPLICABLE');
  });

  it('blocks unknown or removed provider aliases such as Gemini', () => {
    const decision = evaluateProviderCutoverReadiness('gemini', completeEvidence);
    expect(decision).toMatchObject({ status: 'BLOCKED', missingEvidence: [] });
  });
});
