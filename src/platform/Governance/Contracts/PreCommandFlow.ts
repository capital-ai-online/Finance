export const PRE_COMMAND_FLOW_SCHEMA_VERSION = 'governance-pre-command-flow/1.0.0' as const;

export const PRE_COMMAND_FLOW_NON_AUTHORIZING_STATEMENT =
  'This pre-command decision is a projection of existing authority and does not grant capability, merge, deployment or production-mutation authority.' as const;

export type PreCommandVerdict = 'ALLOW' | 'ROUTE' | 'REQUIRE_GATE' | 'BLOCK';

export type PreCommandStage =
  | 'repository-baseline'
  | 'trust-root'
  | 'capability'
  | 'project-routing'
  | 'authority'
  | 'least-privilege'
  | 'execution';

export interface RepositoryBaselineResolution {
  mainSha: string;
  isCurrent: boolean;
  openPullRequestsInspected: boolean;
  activeWritersInspected: boolean;
  sourceRef: string;
}

export interface TrustRootResolution {
  path: string;
  sha: string;
  resolved: boolean;
  sourceRef: string;
}

export interface CapabilityResolution {
  requestedCapability: string;
  resolved: boolean;
  explicitlyGranted: boolean;
  classificationRef: string;
}

export type ProjectRoutingResolution =
  | {
      state: 'RESOLVED';
      projectId: string;
      projectFolder: string;
      primaryOwner: string;
      primaryPvc: string;
      roadmapPath: string;
      sourceRef: string;
    }
  | {
      state: 'ROUTE_REQUIRED';
      routeToProjectId: string;
      reason: string;
      sourceRef: string;
    }
  | {
      state: 'BLOCKED';
      reason: string;
      sourceRef: string;
    };

export type AuthorityResolution =
  | {
      state: 'RESOLVED';
      authorityRefs: readonly string[];
      sourceRef: string;
    }
  | {
      state: 'BLOCKED';
      reason: string;
      authorityRefs?: readonly string[];
      sourceRef: string;
    };

export type LeastPrivilegeProjection =
  | {
      verdict: 'ALLOW';
      reason: string;
      sourceRefs: readonly string[];
    }
  | {
      verdict: 'REQUIRE_GATE';
      gateId: string;
      reason: string;
      sourceRefs: readonly string[];
    }
  | {
      verdict: 'DENY';
      reason: string;
      sourceRefs: readonly string[];
    };

export interface PreCommandFlowInput {
  repository: Readonly<RepositoryBaselineResolution>;
  trustRoot: Readonly<TrustRootResolution>;
  capability: Readonly<CapabilityResolution>;
  project: Readonly<ProjectRoutingResolution>;
  authority: Readonly<AuthorityResolution>;
  leastPrivilege: Readonly<LeastPrivilegeProjection>;
}

export interface PreCommandDecision {
  schemaVersion: typeof PRE_COMMAND_FLOW_SCHEMA_VERSION;
  verdict: PreCommandVerdict;
  stoppedAt: PreCommandStage;
  readyForAuthorizedExecution: boolean;
  reason: string;
  sourceRefs: readonly string[];
  routeToProjectId?: string;
  requiredGateId?: string;
  nonAuthorizingStatement: typeof PRE_COMMAND_FLOW_NON_AUTHORIZING_STATEMENT;
}

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeRef(value: string): string {
  return value.trim();
}

function sourceRefs(values: readonly (string | undefined)[]): readonly string[] {
  return [...new Set(values.filter(isNonEmpty).map(normalizeRef))];
}

function decide(
  verdict: PreCommandVerdict,
  stoppedAt: PreCommandStage,
  reason: string,
  refs: readonly string[],
  extras: Pick<PreCommandDecision, 'routeToProjectId' | 'requiredGateId'> = {},
): PreCommandDecision {
  return {
    schemaVersion: PRE_COMMAND_FLOW_SCHEMA_VERSION,
    verdict,
    stoppedAt,
    readyForAuthorizedExecution: verdict === 'ALLOW',
    reason,
    sourceRefs: refs,
    ...extras,
    nonAuthorizingStatement: PRE_COMMAND_FLOW_NON_AUTHORIZING_STATEMENT,
  };
}

/**
 * Provider-neutral staged pre-command projection for repository execution.
 *
 * This function deliberately does not discover authority, grant capabilities or execute commands.
 * Callers must resolve current-main/open-writer state, the repository trust root, capability
 * classification/grant, Project/PVC/Roadmap routing, applicable ADR/ESS/CTRL/AUTH and the
 * least-privileged IAM/policy decision through their existing authoritative components first.
 * The function only fail-closes those resolved facts into ALLOW | ROUTE | REQUIRE_GATE | BLOCK.
 */
export function evaluatePreCommandFlow(input: Readonly<PreCommandFlowInput>): PreCommandDecision {
  const repositoryRefs = sourceRefs([input.repository.sourceRef]);
  const mainSha = input.repository.mainSha.trim().toLowerCase();

  if (!/^[0-9a-f]{40}$/.test(mainSha)) {
    return decide('BLOCK', 'repository-baseline', 'Current-main identity is missing or invalid.', repositoryRefs);
  }

  if (!input.repository.isCurrent) {
    return decide('BLOCK', 'repository-baseline', 'Repository baseline is stale.', repositoryRefs);
  }

  if (!input.repository.openPullRequestsInspected || !input.repository.activeWritersInspected) {
    return decide(
      'BLOCK',
      'repository-baseline',
      'Open Pull Requests and active writers must both be inspected before command execution.',
      repositoryRefs,
    );
  }

  const trustRootRefs = sourceRefs([input.repository.sourceRef, input.trustRoot.sourceRef]);
  const trustRootPath = input.trustRoot.path.trim().replace(/^\//, '');
  if (
    !input.trustRoot.resolved ||
    trustRootPath !== 'AGENTS.md' ||
    input.trustRoot.sha.trim().toLowerCase() !== mainSha
  ) {
    return decide(
      'BLOCK',
      'trust-root',
      'The sole repository trust root must resolve from the exact current-main SHA.',
      trustRootRefs,
    );
  }

  const capabilityRefs = sourceRefs([
    input.repository.sourceRef,
    input.trustRoot.sourceRef,
    input.capability.classificationRef,
  ]);
  if (!input.capability.resolved || !isNonEmpty(input.capability.requestedCapability)) {
    return decide('BLOCK', 'capability', 'Requested capability is unresolved or unknown.', capabilityRefs);
  }
  if (!input.capability.explicitlyGranted) {
    return decide('BLOCK', 'capability', 'Requested capability is not explicitly granted.', capabilityRefs);
  }

  const projectRefs = sourceRefs([
    input.repository.sourceRef,
    input.trustRoot.sourceRef,
    input.capability.classificationRef,
    input.project.sourceRef,
  ]);
  if (input.project.state === 'ROUTE_REQUIRED') {
    if (!isNonEmpty(input.project.routeToProjectId)) {
      return decide('BLOCK', 'project-routing', 'Owner routing is required but has no target project.', projectRefs);
    }
    return decide('ROUTE', 'project-routing', input.project.reason, projectRefs, {
      routeToProjectId: input.project.routeToProjectId.trim(),
    });
  }
  if (input.project.state === 'BLOCKED') {
    return decide('BLOCK', 'project-routing', input.project.reason, projectRefs);
  }

  const projectResolved = [
    input.project.projectId,
    input.project.projectFolder,
    input.project.primaryOwner,
    input.project.primaryPvc,
    input.project.roadmapPath,
  ].every(isNonEmpty);
  if (!projectResolved) {
    return decide(
      'BLOCK',
      'project-routing',
      'Project, folder, Primary Owner, PVC relationship and Roadmap must be resolved.',
      projectRefs,
    );
  }

  const authorityRefs = sourceRefs([
    input.repository.sourceRef,
    input.trustRoot.sourceRef,
    input.capability.classificationRef,
    input.project.sourceRef,
    input.authority.sourceRef,
    ...('authorityRefs' in input.authority ? input.authority.authorityRefs : []),
  ]);
  if (input.authority.state === 'BLOCKED') {
    return decide('BLOCK', 'authority', input.authority.reason, authorityRefs);
  }
  if (input.authority.authorityRefs.length === 0 || input.authority.authorityRefs.some(ref => !isNonEmpty(ref))) {
    return decide('BLOCK', 'authority', 'Applicable ADR/ESS/CTRL/AUTH resolution is incomplete.', authorityRefs);
  }

  const leastPrivilegeRefs = sourceRefs([...authorityRefs, ...input.leastPrivilege.sourceRefs]);
  if (input.leastPrivilege.sourceRefs.length === 0) {
    return decide(
      'BLOCK',
      'least-privilege',
      'Least-privileged policy decision is missing its authoritative source.',
      leastPrivilegeRefs,
    );
  }

  if (input.leastPrivilege.verdict === 'REQUIRE_GATE') {
    if (!isNonEmpty(input.leastPrivilege.gateId)) {
      return decide('BLOCK', 'least-privilege', 'A required gate must have a stable gate identity.', leastPrivilegeRefs);
    }
    return decide('REQUIRE_GATE', 'least-privilege', input.leastPrivilege.reason, leastPrivilegeRefs, {
      requiredGateId: input.leastPrivilege.gateId.trim(),
    });
  }

  if (input.leastPrivilege.verdict === 'DENY') {
    return decide('BLOCK', 'least-privilege', input.leastPrivilege.reason, leastPrivilegeRefs);
  }

  return decide(
    'ALLOW',
    'execution',
    input.leastPrivilege.reason,
    leastPrivilegeRefs,
  );
}
