import { describe, expect, it } from 'vitest';
import {
  CANONICAL_VALUE_CHAIN_PROVIDER_IDS,
  evaluateProviderCutoverReadiness,
  evaluateProviderScopedAuthorization,
  getCanonicalValueChainProviderInventory,
  PROVIDER_PROFILES,
  RETIRED_PROVIDER_ALIASES,
  type ProviderScopedAuthorizationRequest,
} from '../../src/platform/Security/providerProfile';
import type { AgentPrincipalContext } from '../../src/platform/Security/agentIam';

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

describe('Provider Profile Registry (canonical ChatGPT / Claude / Grok)', () => {
  it('declares exactly the three canonical value-chain providers', () => {
    expect(Object.keys(PROVIDER_PROFILES).sort()).toEqual([
      'chatgpt-github-connector',
      'claude-code-cli',
      'grok-xai-connector',
    ]);
    expect([...CANONICAL_VALUE_CHAIN_PROVIDER_IDS].sort()).toEqual([
      'chatgpt-github-connector',
      'claude-code-cli',
      'grok-xai-connector',
    ]);
  });

  it('reports a complete canonical inventory', () => {
    const inventory = getCanonicalValueChainProviderInventory();
    expect(inventory.complete).toBe(true);
    expect(inventory.missing).toEqual([]);
  });

  it('never lists MERGE for any profile', () => {
    for (const p of Object.values(PROVIDER_PROFILES)) {
      expect(p.allowedCapabilities).not.toContain('MERGE');
    }
  });

  it('lists Google AI Studio / NotebookLM / Gemini as retired aliases', () => {
    expect([...RETIRED_PROVIDER_ALIASES].sort()).toEqual(['gemini', 'google-ai-studio', 'notebooklm']);
  });
});

describe('Policy Equivalence Tests (M8)', () => {
  it('allows read-only under ChatGPT, Claude and Grok', () => {
    for (const appId of CANONICAL_VALUE_CHAIN_PROVIDER_IDS) {
      expect(evaluateProviderScopedAuthorization(request(appId)).verdict).toBe('ALLOW');
    }
  });

  it('allows repository PR work identically for ChatGPT, Claude and Grok under an equivalent scoped request', () => {
    const approvalFor = (appId: string) => ({
      approvalId: 'approval-1',
      approvedByHumanActorId: 'SvenKulessa',
      subjectAgentId: `${appId}-agent`,
      capability: 'PR' as const,
      targetResource: 'repo:SvenKulessa/Finance',
      expiresAt: '2099-01-01T00:00:00.000Z',
      stepUpVerified: false,
    });
    for (const appId of CANONICAL_VALUE_CHAIN_PROVIDER_IDS) {
      const decision = evaluateProviderScopedAuthorization(
        request(appId, {
          capability: 'PR',
          riskClass: 'MEDIUM',
          auditCorrelationId: 'audit-pr-1',
          approval: approvalFor(appId),
        }),
      );
      expect(decision.verdict).toBe('ALLOW');
    }
  });

  it('denies MERGE for every provider profile', () => {
    for (const appId of Object.keys(PROVIDER_PROFILES)) {
      expect(evaluateProviderScopedAuthorization(request(appId, { capability: 'MERGE' })).verdict).toBe('DENY');
    }
  });

  it('denies production mutation without an explicit approved Handoff', () => {
    const chatgpt = evaluateProviderScopedAuthorization(
      request('chatgpt-github-connector', { capability: 'PRODUCTION_MUTATION', riskClass: 'CRITICAL' }),
    );
    expect(chatgpt.verdict).toBe('DENY');
    expect(chatgpt.layer).toBe('PROVIDER_PROFILE');
  });

  it('denies a mutating request with no audit correlation id', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('claude-code-cli', { capability: 'BRANCH', auditCorrelationId: undefined }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Audit-Korrelations-ID/);
  });

  it('denies Self-Authority-Expansion-shaped capabilities', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('grok-xai-connector', { capability: 'SELF_AUTHORITY_EXPANSION' }),
    );
    expect(decision.verdict).toBe('DENY');
  });
});

describe('Negative Tests — retired aliases and unknowns', () => {
  it('denies retired Google AI Studio', () => {
    const decision = evaluateProviderScopedAuthorization(request('google-ai-studio'));
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/retired/i);
  });

  it('denies retired NotebookLM', () => {
    const decision = evaluateProviderScopedAuthorization(request('notebooklm', { capability: 'READ' }));
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/retired/i);
  });

  it('denies unknown provider profile', () => {
    const decision = evaluateProviderScopedAuthorization(request('some-unregistered-app'));
    expect(decision.verdict).toBe('DENY');
    expect(decision.reason).toMatch(/Unbekanntes Provider-Profil/);
  });

  it('denies principal/appId mismatch', () => {
    const decision = evaluateProviderScopedAuthorization(
      request('claude-code-cli', { principal: principal('chatgpt-github-connector') }),
    );
    expect(decision.verdict).toBe('DENY');
  });

  it('denies replayed mutation envelope', () => {
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

  it('denies mutation while kill switch is active but keeps read access', () => {
    const mutation = evaluateProviderScopedAuthorization(
      request('grok-xai-connector', { capability: 'BRANCH', killSwitchActive: true }),
    );
    const read = evaluateProviderScopedAuthorization(
      request('grok-xai-connector', { capability: 'READ', killSwitchActive: true }),
    );
    expect(mutation.verdict).toBe('DENY');
    expect(read.verdict).toBe('ALLOW');
  });
});

describe('Rollback-to-read-only via profile registry', () => {
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

  it('never mutated the real exported PROVIDER_PROFILES singleton', () => {
    expect(PROVIDER_PROFILES['chatgpt-github-connector'].allowedCapabilities).toContain('BRANCH');
  });
});

// M9 (ADR-0063, docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md "Assurance Domain 8:
// Rollback / Recovery") Owner-authorized live drill (2026-08-16, AskUserQuestion
// "Rollback/Recovery-Drill (empfohlen)"). Extends the M8 rollback-to-read-only proof above
// (which only proved DENY-after-rollback + singleton-immutability for one provider) into a full
// M9 recovery drill: baseline ALLOW -> rolled-back DENY -> RESTORED ALLOW again, across all three
// canonical providers, through the composed evaluateProviderScopedAuthorization() path (not just
// the isolated scope check), with an independent before/after snapshot proving the real exported
// registry was never mutated at any point in the sequence.
describe('M9 Rollback/Recovery Live-Drill (I2 Assurance, 2026-08-16)', () => {
  const registrySnapshotBeforeDrill = JSON.parse(JSON.stringify(PROVIDER_PROFILES));

  function rolledBackRegistry(appId: string) {
    return {
      ...PROVIDER_PROFILES,
      [appId]: {
        ...PROVIDER_PROFILES[appId],
        allowedCapabilities: ['READ', 'ANALYZE'] as const,
      },
    };
  }

  it.each(CANONICAL_VALUE_CHAIN_PROVIDER_IDS)(
    'recovers %s from a rolled-back profile to full capability again (last-known-good state restored)',
    (appId) => {
      const auditCorrelationId = `m9-rollback-drill-${appId}`;

      // 1) Baseline: real, unrolled registry allows the real live mutating capability.
      const baseline = evaluateProviderScopedAuthorization(
        request(appId, { capability: 'BRANCH', riskClass: 'MEDIUM', auditCorrelationId }),
      );
      expect(baseline.verdict).toBe('ALLOW');

      // 2) Rollback: narrowed snapshot denies the mutating capability, keeps READ.
      const rolledBack = rolledBackRegistry(appId);
      const duringRollbackMutating = evaluateProviderScopedAuthorization(
        request(appId, { capability: 'BRANCH', riskClass: 'MEDIUM', auditCorrelationId, registry: rolledBack }),
      );
      expect(duringRollbackMutating.verdict).toBe('DENY');
      expect(duringRollbackMutating.layer).toBe('PROVIDER_PROFILE');

      const duringRollbackRead = evaluateProviderScopedAuthorization(
        request(appId, { capability: 'READ', registry: rolledBack }),
      );
      expect(duringRollbackRead.verdict).toBe('ALLOW');

      // 3) Recovery: the very next request against the real registry is ALLOW again - proves the
      // rollback is reversible (a snapshot swap, not a one-way ratchet or persisted mutation).
      const restored = evaluateProviderScopedAuthorization(
        request(appId, { capability: 'BRANCH', riskClass: 'MEDIUM', auditCorrelationId }),
      );
      expect(restored.verdict).toBe('ALLOW');
    },
  );

  it('never mutated the real exported PROVIDER_PROFILES registry across the full baseline/rollback/recovery sequence, for any canonical provider', () => {
    expect(JSON.parse(JSON.stringify(PROVIDER_PROFILES))).toEqual(registrySnapshotBeforeDrill);
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
    for (const appId of CANONICAL_VALUE_CHAIN_PROVIDER_IDS) {
      expect(evaluateProviderCutoverReadiness(appId, completeEvidence).status).toBe('READY');
    }
  });

  it('fails closed when external host or bypass evidence is missing', () => {
    const decision = evaluateProviderCutoverReadiness('claude-code-cli', {
      ...completeEvidence,
      providerSpecificBypassDenied: false,
      externalHostConfigurationVerified: false,
    });
    expect(decision).toMatchObject({
      status: 'BLOCKED',
      missingEvidence: ['providerSpecificBypassDenied', 'externalHostConfigurationVerified'],
    });
  });

  it('marks Google AI Studio as RETIRED (not part of the value chain)', () => {
    const decision = evaluateProviderCutoverReadiness('google-ai-studio', completeEvidence);
    expect(decision.status).toBe('RETIRED');
    expect(PROVIDER_PROFILES['google-ai-studio']).toBeUndefined();
  });

  it('marks NotebookLM as RETIRED', () => {
    expect(evaluateProviderCutoverReadiness('notebooklm', completeEvidence).status).toBe('RETIRED');
  });

  it('marks Gemini as RETIRED', () => {
    expect(evaluateProviderCutoverReadiness('gemini', completeEvidence).status).toBe('RETIRED');
  });
});
