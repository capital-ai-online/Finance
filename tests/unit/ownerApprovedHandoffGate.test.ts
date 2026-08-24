import { describe, expect, it } from 'vitest';
import {
  CLAUDE_PROVIDER_APP_ID,
  MUTATION_EXECUTOR_BINDINGS,
  evaluateOwnerApprovedHandoff,
  getProviderHandoffBindingProjection,
  type MutationExecutorBinding,
  type OwnerApprovedHandoffRequest,
} from '../../src/platform/Security/ownerApprovedHandoffGate';
import { PROVIDER_PROFILES } from '../../src/platform/Security/providerProfile';
import { AGENT_CAPABILITIES } from '../../src/platform/Security/agentIam';
import { validateMutationHandoff } from '../../src/platform/Security/developmentChainMutationHandoff';

// M8 Provider Equivalence (docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md): "production
// mutation requires exact approved Handoff plus separately verified execution permission." These
// tests turn that sentence into a decidable outcome per provider, and pin the specific answer the
// repository owes for Claude: no exact Owner-approved Claude Handoff can exist today, because no
// registered mutation executor binds to claude-code-cli at all.

const BASE_SHA = 'a'.repeat(40);
const OTHER_SHA = 'b'.repeat(40);
const FUTURE = '2099-01-01T00:00:00.000Z';
const PAST = '2020-01-01T00:00:00.000Z';
const RENDER_SERVICE = 'srv-d91o1o9o3t8c73edi55g';

/** The one Handoff shape that really happened: Owner executes the Render mutation personally (M7). */
function ownerHandoff(overrides: Record<string, unknown> = {}): unknown {
  return {
    contractId: 'DCH-M7-ROLLBACK-VERIFICATION-001',
    contractVersion: '1.0.0',
    status: 'MUTATION_APPROVED',
    roadmapPhase: 'M7',
    roadmapItem: 'M7 rollback proof',
    repository: 'SvenKulessa/Finance',
    baseBranch: 'main',
    baseSha: BASE_SHA,
    owner: 'SvenKulessa',
    executorAgentId: 'render-manual-owner-execution',
    authorityRefs: ['ADR-0061', 'docs/runbooks/M7_ROLLBACK_VERIFICATION_HANDOFF.md'],
    approvalEvidenceRef: 'docs/runbooks/M7_ROLLBACK_VERIFICATION_HANDOFF.md#section-9',
    platform: 'RENDER',
    mutationClass: 'DEPLOYMENT',
    riskClass: 'LOW',
    targetResource: RENDER_SERVICE,
    allowedOperations: ['RENDER_ROLLBACK_TO_DEPLOY'],
    forbiddenOperations: ['MERGE', 'SELF_AUTHORITY_EXPANSION', 'SECURITY_CONTROL_DISABLEMENT'],
    expectedPostState: `Render service ${RENDER_SERVICE} live on the Handoff target deploy.`,
    idempotencyKey: 'm7-rollback-2026-08-14-001',
    concurrencyKey: 'm7-render-srv',
    auditRequired: true,
    dryRunRequired: false,
    expiresAt: FUTURE,
    ...overrides,
  };
}

function ownerRequest(
  overrides: Partial<OwnerApprovedHandoffRequest> = {},
): OwnerApprovedHandoffRequest {
  return {
    providerAppId: null,
    handoff: ownerHandoff(),
    actor: { humanActorId: 'SvenKulessa', executorAgentId: 'render-manual-owner-execution' },
    attemptedOperation: 'RENDER_ROLLBACK_TO_DEPLOY',
    attemptedTargetResource: RENDER_SERVICE,
    currentBaseSha: BASE_SHA,
    auditPermitRef: 'audit-permit-m7-rollback-001',
    now: '2026-08-14T00:00:00.000Z',
    ...overrides,
  };
}

describe('Owner-approved Handoff gate — Claude', () => {
  it('kennt keinen Mutation-Executor, der an claude-code-cli gebunden ist', () => {
    const projection = getProviderHandoffBindingProjection(CLAUDE_PROVIDER_APP_ID);
    expect(projection.executors).toEqual([]);
    expect(projection.handoffReachable).toBe(false);
  });

  it('verweigert einen Handoff, der Claude als Executor benennt', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({
        providerAppId: CLAUDE_PROVIDER_APP_ID,
        handoff: ownerHandoff({ executorAgentId: 'claude-code-cli' }),
        actor: { humanActorId: 'SvenKulessa', executorAgentId: 'claude-code-cli' },
      }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('EXECUTOR_BINDING');
  });

  it('verweigert Claude auch dann, wenn der Handoff strukturell und approval-seitig perfekt ist', () => {
    // Everything the Contract asks for is present: Owner, Approval Evidence, exakte Operation,
    // exaktes Ziel, gueltige Frist, korrekte Baseline. Der Handoff bleibt trotzdem DENY.
    const perfect = ownerHandoff({ executorAgentId: 'claude-code-cli' });
    expect(validateMutationHandoff(perfect)).toMatchObject({ valid: true });

    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({
        providerAppId: CLAUDE_PROVIDER_APP_ID,
        handoff: perfect,
        actor: { humanActorId: 'SvenKulessa', executorAgentId: 'claude-code-cli' },
      }),
    );
    expect(decision.verdict).toBe('DENY');
  });

  it('laesst Claude den Human/Owner-reservierten M7-Handoff nicht uebernehmen', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({ providerAppId: CLAUDE_PROVIDER_APP_ID }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('PROVIDER_BINDING');
  });

  it('haelt das Claude-Profil frei von mutierenden Plattform-Capabilities', () => {
    const claude = PROVIDER_PROFILES[CLAUDE_PROVIDER_APP_ID];
    expect(claude.allowedCapabilities).not.toContain(AGENT_CAPABILITIES.DEPLOY_REQUEST);
    expect(claude.allowedCapabilities).not.toContain(AGENT_CAPABILITIES.PRODUCTION_MUTATION);
  });
});

describe('Owner-approved Handoff gate — Executor-Registry', () => {
  it('verweigert jeden nicht registrierten Executor', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({
        handoff: ownerHandoff({ executorAgentId: 'some-new-mutation-runner' }),
        actor: { humanActorId: 'SvenKulessa', executorAgentId: 'some-new-mutation-runner' },
      }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('EXECUTOR_BINDING');
  });

  it('bindet jeden registrierten Executor an genau eine Ausfuehrungsidentitaet', () => {
    for (const [executorAgentId, binding] of Object.entries(MUTATION_EXECUTOR_BINDINGS)) {
      expect(executorAgentId.length).toBeGreaterThan(0);
      if (binding.kind === 'HUMAN_OWNER') {
        expect(binding.providerAppId).toBeNull();
      } else {
        expect(PROVIDER_PROFILES[binding.providerAppId]).toBeDefined();
      }
    }
  });

  it('verweigert einen Provider, der den Handoff eines anderen Providers ausfuehrt', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({
        providerAppId: CLAUDE_PROVIDER_APP_ID,
        handoff: ownerHandoff({ executorAgentId: 'capital-ai-systemadmin-roadmap-executor' }),
        actor: {
          humanActorId: 'SvenKulessa',
          executorAgentId: 'capital-ai-systemadmin-roadmap-executor',
        },
      }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('PROVIDER_BINDING');
  });
});

describe('Owner-approved Handoff gate — Provider-Capability', () => {
  it('kennt heute kein Provider-Profil mit DEPLOY_REQUEST oder PRODUCTION_MUTATION', () => {
    // Drift guard: sollte ein Profil diese Capability jemals erhalten, muss die Cutover-Evidence
    // dieses Providers neu bewertet werden, statt dass der Handoff-Pfad still aufgeht.
    for (const profile of Object.values(PROVIDER_PROFILES)) {
      expect(profile.allowedCapabilities).not.toContain(AGENT_CAPABILITIES.DEPLOY_REQUEST);
      expect(profile.allowedCapabilities).not.toContain(AGENT_CAPABILITIES.PRODUCTION_MUTATION);
    }
  });

  it('verweigert den SA3B/SA4-Executor mangels DEPLOY_REQUEST im gebundenen Profil', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({
        providerAppId: 'chatgpt-github-connector',
        handoff: ownerHandoff({ executorAgentId: 'capital-ai-systemadmin-roadmap-executor' }),
        actor: {
          humanActorId: 'SvenKulessa',
          executorAgentId: 'capital-ai-systemadmin-roadmap-executor',
        },
      }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('PROVIDER_CAPABILITY');
  });

  it('ist ein reines Narrowing: mit erteilter Capability geht derselbe Agent-Pfad auf', () => {
    // Beweist, dass das Gate kein pauschales DENY ist, sondern genau die fehlende Capability
    // blockiert. Die Registry-Injektion ist hypothetisch und veraendert keine echte Autoritaet.
    const grantedRegistry = {
      ...PROVIDER_PROFILES,
      'chatgpt-github-connector': {
        ...PROVIDER_PROFILES['chatgpt-github-connector'],
        allowedCapabilities: [
          ...PROVIDER_PROFILES['chatgpt-github-connector'].allowedCapabilities,
          AGENT_CAPABILITIES.DEPLOY_REQUEST,
        ],
      },
    };
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({
        providerAppId: 'chatgpt-github-connector',
        handoff: ownerHandoff({ executorAgentId: 'capital-ai-systemadmin-roadmap-executor' }),
        actor: {
          humanActorId: 'SvenKulessa',
          executorAgentId: 'capital-ai-systemadmin-roadmap-executor',
        },
        providerRegistry: grantedRegistry,
      }),
    );
    expect(decision.verdict).toBe('ALLOW');
  });

  it('haelt Claude auch mit erteilter Capability draussen, solange kein Executor auf ihn zeigt', () => {
    const grantedRegistry = {
      ...PROVIDER_PROFILES,
      [CLAUDE_PROVIDER_APP_ID]: {
        ...PROVIDER_PROFILES[CLAUDE_PROVIDER_APP_ID],
        allowedCapabilities: [
          ...PROVIDER_PROFILES[CLAUDE_PROVIDER_APP_ID].allowedCapabilities,
          AGENT_CAPABILITIES.DEPLOY_REQUEST,
        ],
      },
    };
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({
        providerAppId: CLAUDE_PROVIDER_APP_ID,
        handoff: ownerHandoff({ executorAgentId: 'claude-code-cli' }),
        actor: { humanActorId: 'SvenKulessa', executorAgentId: 'claude-code-cli' },
        providerRegistry: grantedRegistry,
      }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('EXECUTOR_BINDING');
  });
});

describe('Owner-approved Handoff gate — Exaktheit', () => {
  it('erlaubt den exakten Human/Owner-Handoff des M7-Runbooks', () => {
    const decision = evaluateOwnerApprovedHandoff(ownerRequest());
    expect(decision.verdict).toBe('ALLOW');
    expect(decision.verdict === 'ALLOW' && decision.contractId).toBe(
      'DCH-M7-ROLLBACK-VERIFICATION-001',
    );
    expect(decision.verdict === 'ALLOW' && decision.executorBinding.kind).toBe('HUMAN_OWNER');
  });

  it('verweigert Baseline-Drift gegenueber dem gepinnten baseSha', () => {
    const decision = evaluateOwnerApprovedHandoff(ownerRequest({ currentBaseSha: OTHER_SHA }));
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('BASELINE_DRIFT');
  });

  it('verweigert eine leere Baseline-Angabe', () => {
    const decision = evaluateOwnerApprovedHandoff(ownerRequest({ currentBaseSha: '' }));
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('BASELINE_DRIFT');
  });

  it('verweigert einen Handoff ohne Owner-Approval-Evidence', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({ handoff: ownerHandoff({ status: 'PRECHECK_PASS', approvalEvidenceRef: null }) }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('HANDOFF_EXECUTION');
  });

  it('verweigert eine abgelaufene Owner-Freigabe', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({ handoff: ownerHandoff({ expiresAt: PAST }) }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('HANDOFF_EXECUTION');
  });

  it('verweigert ein abweichendes Ziel', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({ attemptedTargetResource: 'srv-not-this-one' }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('HANDOFF_EXECUTION');
  });

  it('verweigert MERGE auch bei sonst gueltigem Handoff', () => {
    const decision = evaluateOwnerApprovedHandoff(ownerRequest({ attemptedOperation: 'MERGE' }));
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('HANDOFF_EXECUTION');
  });

  it('verweigert einen bereits konsumierten Idempotency-Key', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({ seenIdempotencyKeys: new Set(['m7-rollback-2026-08-14-001']) }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('HANDOFF_EXECUTION');
  });

  it('verweigert Ausfuehrung ohne durable Audit-Permit', () => {
    const decision = evaluateOwnerApprovedHandoff(ownerRequest({ auditPermitRef: null }));
    expect(decision.verdict).toBe('DENY');
  });

  it('verweigert einen strukturell ungueltigen Handoff, bevor irgendeine Bindung geprueft wird', () => {
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({ handoff: ownerHandoff({ repository: 'someone-else/Finance' }) }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('HANDOFF_STRUCTURE');
  });

  it('akzeptiert keine injizierte Bindung, die den Owner-Abgleich umgeht', () => {
    const rogue: Record<string, MutationExecutorBinding> = {
      'rogue-executor': { kind: 'HUMAN_OWNER', providerAppId: null },
    };
    const decision = evaluateOwnerApprovedHandoff(
      ownerRequest({
        handoff: ownerHandoff({ executorAgentId: 'rogue-executor' }),
        actor: { humanActorId: 'someone-else', executorAgentId: 'rogue-executor' },
        executorBindings: rogue,
      }),
    );
    expect(decision.verdict).toBe('DENY');
    expect(decision.verdict === 'DENY' && decision.stage).toBe('HANDOFF_EXECUTION');
  });
});
