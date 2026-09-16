import { describe, expect, it } from 'vitest';
import {
  PRE_COMMAND_FLOW_NON_AUTHORIZING_STATEMENT,
  evaluatePreCommandFlow,
  type PreCommandFlowInput,
} from '../../src/platform/Governance/Contracts/PreCommandFlow';

const MAIN_SHA = '5ae2b371da45a5c07304fd704a7026eded976f1b';

function validInput(): PreCommandFlowInput {
  return {
    repository: {
      mainSha: MAIN_SHA,
      isCurrent: true,
      openPullRequestsInspected: true,
      activeWritersInspected: true,
      sourceRef: 'main/open-pr correlation',
    },
    trustRoot: {
      path: '/AGENTS.md',
      sha: MAIN_SHA,
      resolved: true,
      sourceRef: 'AUTH-GOV-AGENT-TRUST-ROOT',
    },
    capability: {
      requestedCapability: 'BRANCH',
      resolved: true,
      explicitlyGranted: true,
      classificationRef: 'AUTH-ESS-AI-AGENT-CAPABILITY-PLANE',
    },
    project: {
      state: 'RESOLVED',
      projectId: 'CAPITAL-AI-GOV',
      projectFolder: 'docs/projects/governance/',
      primaryOwner: 'CAPITAL-AI-GOV',
      primaryPvc: 'PVC-05',
      roadmapPath: 'docs/projects/governance/ROADMAP.md',
      sourceRef: 'docs/projects/README.md + PROJECT_VALUE_CHAIN.md + GOV ROADMAP',
    },
    authority: {
      state: 'RESOLVED',
      authorityRefs: [
        'AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19',
        'AUTH-ESS-AI-AGENT-CAPABILITY-PLANE',
        'AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION',
      ],
      sourceRef: 'ADR/ESS/CTRL/AUTH resolution',
    },
    leastPrivilege: {
      verdict: 'ALLOW',
      reason: 'Existing Agent IAM and policy gates allow the exact bounded capability.',
      sourceRefs: ['ADR-0058', 'src/platform/Security/agentIam.ts'],
    },
  };
}

describe('evaluatePreCommandFlow', () => {
  it('allows only after every upstream stage is resolved', () => {
    const decision = evaluatePreCommandFlow(validInput());

    expect(decision).toMatchObject({
      verdict: 'ALLOW',
      stoppedAt: 'execution',
      readyForAuthorizedExecution: true,
      nonAuthorizingStatement: PRE_COMMAND_FLOW_NON_AUTHORIZING_STATEMENT,
    });
    expect(decision.sourceRefs).toContain('AUTH-GOV-AGENT-TRUST-ROOT');
    expect(decision.sourceRefs).toContain('src/platform/Security/agentIam.ts');
  });

  it('blocks stale repository state before any downstream routing', () => {
    const input = validInput();
    input.repository = { ...input.repository, isCurrent: false };

    expect(evaluatePreCommandFlow(input)).toMatchObject({
      verdict: 'BLOCK',
      stoppedAt: 'repository-baseline',
      readyForAuthorizedExecution: false,
    });
  });

  it('blocks when AGENTS is not bound to the exact current-main SHA', () => {
    const input = validInput();
    input.trustRoot = {
      ...input.trustRoot,
      sha: '1111111111111111111111111111111111111111',
    };

    expect(evaluatePreCommandFlow(input)).toMatchObject({
      verdict: 'BLOCK',
      stoppedAt: 'trust-root',
      readyForAuthorizedExecution: false,
    });
  });

  it('blocks an unresolved or non-granted capability', () => {
    const input = validInput();
    input.capability = { ...input.capability, explicitlyGranted: false };

    expect(evaluatePreCommandFlow(input)).toMatchObject({
      verdict: 'BLOCK',
      stoppedAt: 'capability',
      readyForAuthorizedExecution: false,
    });
  });

  it('routes owner-correctly instead of inventing foreign project authority', () => {
    const input = validInput();
    input.project = {
      state: 'ROUTE_REQUIRED',
      routeToProjectId: 'CAPITAL-AI-OPS',
      reason: 'The target work belongs to the Operations Primary Owner.',
      sourceRef: 'docs/projects/PROJECT_VALUE_CHAIN.md',
    };

    expect(evaluatePreCommandFlow(input)).toMatchObject({
      verdict: 'ROUTE',
      stoppedAt: 'project-routing',
      routeToProjectId: 'CAPITAL-AI-OPS',
      readyForAuthorizedExecution: false,
    });
  });

  it('blocks conflicting or incomplete authority resolution', () => {
    const input = validInput();
    input.authority = {
      state: 'BLOCKED',
      reason: 'Applicable authority versions conflict.',
      authorityRefs: ['AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION'],
      sourceRef: 'authority-registry correlation',
    };

    expect(evaluatePreCommandFlow(input)).toMatchObject({
      verdict: 'BLOCK',
      stoppedAt: 'authority',
      readyForAuthorizedExecution: false,
    });
  });

  it('projects an unresolved PR-create gate as REQUIRE_GATE without granting it', () => {
    const input = validInput();
    input.capability = {
      ...input.capability,
      requestedCapability: 'PR',
    };
    input.leastPrivilege = {
      verdict: 'REQUIRE_GATE',
      gateId: 'CTRL-SDLC-PR-CREATE-001',
      reason: 'Final create-correlation must pass before the PR capability may execute.',
      sourceRefs: ['CTRL-SDLC-PR-CREATE-001', 'AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION'],
    };

    expect(evaluatePreCommandFlow(input)).toMatchObject({
      verdict: 'REQUIRE_GATE',
      stoppedAt: 'least-privilege',
      requiredGateId: 'CTRL-SDLC-PR-CREATE-001',
      readyForAuthorizedExecution: false,
    });
  });

  it('maps an authoritative least-privilege DENY to BLOCK without widening authority', () => {
    const input = validInput();
    input.leastPrivilege = {
      verdict: 'DENY',
      reason: 'Agent IAM denied the requested capability.',
      sourceRefs: ['ADR-0058', 'src/platform/Security/agentIam.ts'],
    };

    expect(evaluatePreCommandFlow(input)).toMatchObject({
      verdict: 'BLOCK',
      stoppedAt: 'least-privilege',
      readyForAuthorizedExecution: false,
    });
  });
});
