import {
  AGENT_CAPABILITIES,
  evaluateAgentAuthorization,
  isKnownAgentCapability,
  minimumRiskForCapability,
  type AgentAuthorizationDecision,
  type AgentCapability,
  type AgentEnvironment,
  type AgentPrincipalContext,
  type AgentRiskClass,
} from './agentIam';

export const SYSTEMADMIN_OWNER_ACTOR_ID = 'SvenKulessa';
export const SYSTEMADMIN_AGENT_ID = 'capital-ai-systemadmin-roadmap-executor';
export const SYSTEMADMIN_REPOSITORY = 'SvenKulessa/Finance';
export const SYSTEMADMIN_BASE_BRANCH = 'main';

export const ROADMAP_EXECUTION_MUTATION_CLASSES = {
  REPOSITORY: 'REPOSITORY',
  NON_PRODUCTION_CONFIG: 'NON_PRODUCTION_CONFIG',
  BOUNDED_REVERSIBLE_PRODUCTION: 'BOUNDED_REVERSIBLE_PRODUCTION',
  MERGE: 'MERGE',
  REPOSITORY_PROTECTION_WEAKENING: 'REPOSITORY_PROTECTION_WEAKENING',
  OWNER_IAM_ELEVATION: 'OWNER_IAM_ELEVATION',
  OWNER_MFA_OR_BREAK_GLASS: 'OWNER_MFA_OR_BREAK_GLASS',
  SECRET_DISCLOSURE: 'SECRET_DISCLOSURE',
  UNRESTRICTED_CREDENTIAL_ROTATION: 'UNRESTRICTED_CREDENTIAL_ROTATION',
  DESTRUCTIVE_PRODUCTION_DATA: 'DESTRUCTIVE_PRODUCTION_DATA',
  LIVE_BILLING_MONEY_OR_ENTITLEMENT: 'LIVE_BILLING_MONEY_OR_ENTITLEMENT',
  PRODUCTION_RESOURCE_DELETION: 'PRODUCTION_RESOURCE_DELETION',
  DNS_TLS_DOMAIN_OWNERSHIP: 'DNS_TLS_DOMAIN_OWNERSHIP',
  SECURITY_CONTROL_DISABLEMENT: 'SECURITY_CONTROL_DISABLEMENT',
  SELF_MANDATE_EXPANSION: 'SELF_MANDATE_EXPANSION',
} as const;

export type RoadmapExecutionMutationClass =
  typeof ROADMAP_EXECUTION_MUTATION_CLASSES[keyof typeof ROADMAP_EXECUTION_MUTATION_CLASSES];
export type RoadmapExecutionMandateStatus =
  | 'DRAFT'
  | 'OWNER_APPROVED'
  | 'REVOKED'
  | 'EXPIRED'
  | 'COMPLETE';
export type RoadmapExecutionPrOperation = 'CREATE' | 'UPDATE';

const ALLOWED_MUTATION_CLASSES = new Set<RoadmapExecutionMutationClass>([
  ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY,
  ROADMAP_EXECUTION_MUTATION_CLASSES.NON_PRODUCTION_CONFIG,
  ROADMAP_EXECUTION_MUTATION_CLASSES.BOUNDED_REVERSIBLE_PRODUCTION,
]);

const RESERVED_MUTATION_CLASSES = new Set<RoadmapExecutionMutationClass>([
  ROADMAP_EXECUTION_MUTATION_CLASSES.MERGE,
  ROADMAP_EXECUTION_MUTATION_CLASSES.REPOSITORY_PROTECTION_WEAKENING,
  ROADMAP_EXECUTION_MUTATION_CLASSES.OWNER_IAM_ELEVATION,
  ROADMAP_EXECUTION_MUTATION_CLASSES.OWNER_MFA_OR_BREAK_GLASS,
  ROADMAP_EXECUTION_MUTATION_CLASSES.SECRET_DISCLOSURE,
  ROADMAP_EXECUTION_MUTATION_CLASSES.UNRESTRICTED_CREDENTIAL_ROTATION,
  ROADMAP_EXECUTION_MUTATION_CLASSES.DESTRUCTIVE_PRODUCTION_DATA,
  ROADMAP_EXECUTION_MUTATION_CLASSES.LIVE_BILLING_MONEY_OR_ENTITLEMENT,
  ROADMAP_EXECUTION_MUTATION_CLASSES.PRODUCTION_RESOURCE_DELETION,
  ROADMAP_EXECUTION_MUTATION_CLASSES.DNS_TLS_DOMAIN_OWNERSHIP,
  ROADMAP_EXECUTION_MUTATION_CLASSES.SECURITY_CONTROL_DISABLEMENT,
  ROADMAP_EXECUTION_MUTATION_CLASSES.SELF_MANDATE_EXPANSION,
]);

const KNOWN_MUTATION_CLASSES = new Set<RoadmapExecutionMutationClass>(
  Object.values(ROADMAP_EXECUTION_MUTATION_CLASSES),
);

/**
 * SA1 deliberately stops at repository/control-plane automation.
 * Deployment and production mutation remain blocked until later stages provide
 * strong Owner assurance and exact-target production enforcement.
 */
const SA1_CAPABILITIES = new Set<AgentCapability>([
  AGENT_CAPABILITIES.READ,
  AGENT_CAPABILITIES.ANALYZE,
  AGENT_CAPABILITIES.PLAN,
  AGENT_CAPABILITIES.BRANCH,
  AGENT_CAPABILITIES.COMMIT,
  AGENT_CAPABILITIES.PR,
  AGENT_CAPABILITIES.CI_REQUEST,
]);

const REPOSITORY_MUTATING_CAPABILITIES = new Set<AgentCapability>([
  AGENT_CAPABILITIES.BRANCH,
  AGENT_CAPABILITIES.COMMIT,
  AGENT_CAPABILITIES.PR,
  AGENT_CAPABILITIES.CI_REQUEST,
]);

const PATH_SCOPED_CAPABILITIES = new Set<AgentCapability>([
  AGENT_CAPABILITIES.COMMIT,
  AGENT_CAPABILITIES.PR,
  AGENT_CAPABILITIES.CI_REQUEST,
]);

/**
 * The Systemadmin profile may never rewrite its own trust root through a REM.
 * Changes to these files continue through the normal Human/Owner-controlled path.
 */
const SYSTEMADMIN_SELF_AUTHORITY_PATHS = [
  '.ai/skills/ESS-0021-Systemadmin-Roadmap-Executor.md',
  '.ai/contracts/systemadmin-roadmap-execution-profile.json',
  '.ai/contracts/systemadmin-audit-execution-profile.json',
  '.ai/mandates/REM-SA3B-PROBE-001.json',
  '.ai/mandates/REM-SA4-PILOT-001.json',
  '.ai/mandates/REM-M5A-REPOSITORY-001.json',
  '.github/workflows/systemadmin-roadmap-executor.yml',
  '.github/workflows/systemadmin-sa4-pilot.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/capital-ai-ci-shadow.yml',
  '.github/policies/main-production-protection.expected.json',
  'AGENTS.md',
  'docs/adr/ADR-0065-systemadmin-roadmap-execution-mandate.md',
  'docs/adr/ADR-0067-systemadmin-github-actions-execution-host.md',
  'docs/adr/ADR-0068-first-bounded-autonomous-work-package.md',
  'docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md',
  'docs/governance/ROADMAP_EXECUTION_MANDATE.schema.json',
  'docs/governance/SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY.md',
  'src/platform/Security/agentIam.ts',
  'src/platform/Security/roadmapExecutionMandate.ts',
  'src/platform/Security/systemadminExecutionProfile.ts',
  'src/platform/Compliance/PolicyGate.ts',
  'server/agentAudit/agentAuditWriter.ts',
  'server/agentAudit/authorizedAgentExecution.ts',
  'server/agentAudit/systemadminAuditedExecution.ts',
  'server/systemadmin/githubActionsOidc.ts',
  'server/systemadmin/systemadminExecutionBrokerRouter.ts',
  'scripts/systemadmin/validateExecutionIssue.mjs',
  'scripts/systemadmin/validateSa4PilotIssue.mjs',
  'scripts/systemadmin/runSa4Pilot.mjs',
  'scripts/security/verifyChangedWorkflowSecurity.mjs',
] as const;

const RISK_ORDER: Readonly<Record<AgentRiskClass, number>> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

const MANDATE_ID_PATTERN = /^REM-[A-Z0-9][A-Z0-9._-]{3,63}$/;
const MANDATE_STATUSES = new Set<RoadmapExecutionMandateStatus>([
  'DRAFT',
  'OWNER_APPROVED',
  'REVOKED',
  'EXPIRED',
  'COMPLETE',
]);
const RISK_CLASSES = new Set<AgentRiskClass>(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const TOP_LEVEL_KEYS = new Set([
  'mandateId',
  'status',
  'ownerActorId',
  'subjectAgentId',
  'repository',
  'baseBranch',
  'roadmapItems',
  'authorityRefs',
  'allowedCapabilities',
  'allowedPaths',
  'allowedTargets',
  'maxRiskClass',
  'allowedMutationClasses',
  'prohibitedMutationClasses',
  'validFrom',
  'expiresAt',
  'maxOpenPullRequests',
  'ciBudgetPolicyRef',
  'killSwitch',
  'requiredPreflight',
  'requiredEvidence',
  'approvalEvidenceRef',
]);
const KILL_SWITCH_KEYS = new Set(['enabled', 'revocationAuthority', 'reason']);

export interface RoadmapExecutionMandate {
  mandateId: string;
  status: RoadmapExecutionMandateStatus;
  ownerActorId: string;
  subjectAgentId: string;
  repository: string;
  baseBranch: string;
  roadmapItems: readonly string[];
  authorityRefs: readonly string[];
  allowedCapabilities: readonly AgentCapability[];
  allowedPaths: readonly string[];
  allowedTargets: readonly string[];
  maxRiskClass: AgentRiskClass;
  allowedMutationClasses: readonly RoadmapExecutionMutationClass[];
  prohibitedMutationClasses: readonly RoadmapExecutionMutationClass[];
  validFrom: string;
  expiresAt: string;
  maxOpenPullRequests: number;
  ciBudgetPolicyRef: string;
  killSwitch: Readonly<{
    enabled: boolean;
    revocationAuthority: string;
    reason?: string;
  }>;
  requiredPreflight: readonly string[];
  requiredEvidence: readonly string[];
  approvalEvidenceRef?: string;
}

export type RoadmapExecutionMandateValidation =
  | { valid: true; mandate: Readonly<RoadmapExecutionMandate> }
  | { valid: false; errors: readonly string[] };

export interface SystemadminRoadmapExecutionContext {
  roadmapItem: string;
  repository: string;
  baseBranch: string;
  requestedPaths?: readonly string[];
  mutationClass?: RoadmapExecutionMutationClass;
  openSystemadminPullRequests?: number;
  pullRequestOperation?: RoadmapExecutionPrOperation;
  openPullRequestChangedPaths?: readonly string[];
  ciBudgetExceeded?: boolean;
  unchangedHeadAlreadyValidated?: boolean;
  now?: string | number | Date;
}

export interface SystemadminRoadmapAuthorizationRequest {
  principal: Readonly<AgentPrincipalContext>;
  capability: string;
  riskClass: AgentRiskClass;
  environment: AgentEnvironment;
  targetResource: string;
  mandate: unknown;
  execution: Readonly<SystemadminRoadmapExecutionContext>;
  /**
   * M8 (ADR-0062) rollback-to-read-only lever: distinct from mandate.killSwitch.enabled, which
   * denies everything (including READ) when disabled. Setting this true denies only mutating
   * capabilities while READ/ANALYZE/PLAN stay available, matching the M8 runbook's Rollback
   * requirement to "restore read-only operation" rather than cut access entirely. Optional and
   * off by default - existing callers are unaffected.
   */
  killSwitchActive?: boolean;
}

export interface SystemadminRoadmapAuthorizationDecision {
  verdict: 'ALLOW' | 'DENY';
  reason: string;
  riskClass: AgentRiskClass;
  capability?: AgentCapability;
  mandateId?: string;
  layer: 'REM_VALIDATION' | 'REM_SCOPE' | 'AGENT_IAM';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isUniqueStringArray(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length > 0
    && value.every(isNonEmptyString)
    && new Set(value).size === value.length;
}

function isFiniteDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isSafeRepoPath(path: string, allowPrefixWildcard: boolean): boolean {
  const value = path.trim();
  if (!value || value.startsWith('/') || value.includes('\\') || value.includes('\0')) return false;

  const hasWildcard = value.includes('*');
  if (
    hasWildcard
    && (!allowPrefixWildcard || !value.endsWith('/**') || value.slice(0, -3).includes('*'))
  ) return false;

  const concrete = value.endsWith('/**') ? value.slice(0, -3) : value;
  const parts = concrete.split('/');
  return concrete.length > 0
    && parts.every(part => part.length > 0 && part !== '.' && part !== '..');
}

function pathMatchesRule(path: string, rule: string): boolean {
  if (rule.endsWith('/**')) {
    const prefix = rule.slice(0, -3);
    return path === prefix || path.startsWith(`${prefix}/`);
  }
  return path === rule;
}

function touchesSelfAuthority(path: string): boolean {
  return SYSTEMADMIN_SELF_AUTHORITY_PATHS.some(
    protectedPath => path === protectedPath || path.startsWith(`${protectedPath}/`),
  );
}

function effectiveRisk(capability: AgentCapability, contextualRisk: AgentRiskClass): AgentRiskClass {
  const minimum = minimumRiskForCapability(capability);
  return RISK_ORDER[contextualRisk] >= RISK_ORDER[minimum] ? contextualRisk : minimum;
}

function deny(
  reason: string,
  riskClass: AgentRiskClass,
  layer: SystemadminRoadmapAuthorizationDecision['layer'],
  capability?: AgentCapability,
  mandateId?: string,
): SystemadminRoadmapAuthorizationDecision {
  return {
    verdict: 'DENY',
    reason,
    riskClass,
    layer,
    ...(capability ? { capability } : {}),
    ...(mandateId ? { mandateId } : {}),
  };
}

function allow(
  reason: string,
  riskClass: AgentRiskClass,
  capability: AgentCapability,
  mandateId: string,
  layer: SystemadminRoadmapAuthorizationDecision['layer'],
): SystemadminRoadmapAuthorizationDecision {
  return { verdict: 'ALLOW', reason, riskClass, capability, mandateId, layer };
}

export function validateRoadmapExecutionMandate(input: unknown): RoadmapExecutionMandateValidation {
  const errors: string[] = [];
  if (!isRecord(input)) return { valid: false, errors: ['Mandat muss ein Objekt sein.'] };

  for (const key of Object.keys(input)) {
    if (!TOP_LEVEL_KEYS.has(key)) errors.push(`Unbekanntes Mandatsfeld: ${key}.`);
  }

  if (!isNonEmptyString(input.mandateId) || !MANDATE_ID_PATTERN.test(input.mandateId)) {
    errors.push('mandateId ist ungültig.');
  }
  if (
    typeof input.status !== 'string'
    || !MANDATE_STATUSES.has(input.status as RoadmapExecutionMandateStatus)
  ) errors.push('status ist ungültig.');
  if (input.ownerActorId !== SYSTEMADMIN_OWNER_ACTOR_ID) {
    errors.push('ownerActorId entspricht nicht dem kanonischen Owner.');
  }
  if (input.subjectAgentId !== SYSTEMADMIN_AGENT_ID) {
    errors.push('subjectAgentId entspricht nicht dem Systemadmin-Agenten.');
  }
  if (input.repository !== SYSTEMADMIN_REPOSITORY) {
    errors.push('repository liegt außerhalb des Systemadmin-Scopes.');
  }
  if (input.baseBranch !== SYSTEMADMIN_BASE_BRANCH) errors.push('baseBranch muss main sein.');
  if (!isUniqueStringArray(input.roadmapItems)) {
    errors.push('roadmapItems muss eine eindeutige, nicht leere String-Liste sein.');
  }
  if (!isUniqueStringArray(input.authorityRefs)) {
    errors.push('authorityRefs muss eine eindeutige, nicht leere String-Liste sein.');
  }

  if (
    !Array.isArray(input.allowedCapabilities)
    || input.allowedCapabilities.length === 0
    || new Set(input.allowedCapabilities).size !== input.allowedCapabilities.length
    || !input.allowedCapabilities.every(
      value => typeof value === 'string' && isKnownAgentCapability(value),
    )
  ) errors.push('allowedCapabilities enthält unbekannte, doppelte oder fehlende Capabilities.');

  if (
    !isUniqueStringArray(input.allowedPaths)
    || !(input.allowedPaths as string[]).every(path => isSafeRepoPath(path, true))
  ) errors.push('allowedPaths enthält ungültige oder unsichere Pfade.');

  if (!isUniqueStringArray(input.allowedTargets)) {
    errors.push('allowedTargets muss eine eindeutige, nicht leere String-Liste sein.');
  }
  if (
    typeof input.maxRiskClass !== 'string'
    || !RISK_CLASSES.has(input.maxRiskClass as AgentRiskClass)
  ) errors.push('maxRiskClass ist ungültig.');

  if (
    !Array.isArray(input.allowedMutationClasses)
    || new Set(input.allowedMutationClasses).size !== input.allowedMutationClasses.length
    || !input.allowedMutationClasses.every(
      value => typeof value === 'string'
        && ALLOWED_MUTATION_CLASSES.has(value as RoadmapExecutionMutationClass),
    )
  ) errors.push('allowedMutationClasses ist ungültig.');

  if (
    !Array.isArray(input.prohibitedMutationClasses)
    || input.prohibitedMutationClasses.length === 0
    || new Set(input.prohibitedMutationClasses).size !== input.prohibitedMutationClasses.length
    || !input.prohibitedMutationClasses.every(
      value => typeof value === 'string'
        && RESERVED_MUTATION_CLASSES.has(value as RoadmapExecutionMutationClass),
    )
  ) errors.push('prohibitedMutationClasses ist ungültig.');

  if (Array.isArray(input.prohibitedMutationClasses)) {
    for (const required of RESERVED_MUTATION_CLASSES) {
      if (!input.prohibitedMutationClasses.includes(required)) {
        errors.push(`Reservierte Mutationsklasse fehlt in prohibitedMutationClasses: ${required}.`);
      }
    }
  }

  if (!isFiniteDate(input.validFrom) || !isFiniteDate(input.expiresAt)) {
    errors.push('validFrom/expiresAt müssen gültige Datumswerte sein.');
  }
  if (
    isFiniteDate(input.validFrom)
    && isFiniteDate(input.expiresAt)
    && Date.parse(input.validFrom) >= Date.parse(input.expiresAt)
  ) errors.push('expiresAt muss nach validFrom liegen.');

  if (
    !Number.isInteger(input.maxOpenPullRequests)
    || (input.maxOpenPullRequests as number) < 1
    || (input.maxOpenPullRequests as number) > 3
  ) errors.push('maxOpenPullRequests muss zwischen 1 und 3 liegen.');

  if (!isNonEmptyString(input.ciBudgetPolicyRef)) errors.push('ciBudgetPolicyRef fehlt.');
  if (!isUniqueStringArray(input.requiredPreflight)) {
    errors.push('requiredPreflight muss eine eindeutige, nicht leere Liste sein.');
  }
  if (!isUniqueStringArray(input.requiredEvidence)) {
    errors.push('requiredEvidence muss eine eindeutige, nicht leere Liste sein.');
  }

  if (!isRecord(input.killSwitch)) {
    errors.push('killSwitch fehlt oder ist ungültig.');
  } else {
    for (const key of Object.keys(input.killSwitch)) {
      if (!KILL_SWITCH_KEYS.has(key)) errors.push(`Unbekanntes killSwitch-Feld: ${key}.`);
    }
    if (typeof input.killSwitch.enabled !== 'boolean') {
      errors.push('killSwitch.enabled muss boolean sein.');
    }
    if (input.killSwitch.revocationAuthority !== SYSTEMADMIN_OWNER_ACTOR_ID) {
      errors.push('killSwitch.revocationAuthority muss der Owner sein.');
    }
    if (input.killSwitch.reason !== undefined && typeof input.killSwitch.reason !== 'string') {
      errors.push('killSwitch.reason muss String sein.');
    }
  }

  if (input.status === 'OWNER_APPROVED' && !isNonEmptyString(input.approvalEvidenceRef)) {
    errors.push('OWNER_APPROVED benötigt approvalEvidenceRef.');
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, mandate: input as unknown as RoadmapExecutionMandate };
}

function nowMs(value: SystemadminRoadmapExecutionContext['now']): number {
  if (value === undefined) return Date.now();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Date.parse(value);
}

function evaluateMandateScope(
  mandate: Readonly<RoadmapExecutionMandate>,
  request: Readonly<SystemadminRoadmapAuthorizationRequest>,
  capability: AgentCapability,
): SystemadminRoadmapAuthorizationDecision {
  const risk = effectiveRisk(capability, request.riskClass);
  const mandateId = mandate.mandateId;

  if (mandate.status !== 'OWNER_APPROVED') {
    return deny(
      `Mandatstatus ${mandate.status} autorisiert keine Ausführung.`,
      risk,
      'REM_SCOPE',
      capability,
      mandateId,
    );
  }
  if (!mandate.killSwitch.enabled) {
    return deny(
      'Mandat ohne aktivierbaren Kill-Switch ist nicht ausführbar.',
      risk,
      'REM_SCOPE',
      capability,
      mandateId,
    );
  }

  const currentTime = nowMs(request.execution.now);
  if (
    !Number.isFinite(currentTime)
    || currentTime < Date.parse(mandate.validFrom)
    || currentTime >= Date.parse(mandate.expiresAt)
  ) return deny('Mandat ist noch nicht gültig oder abgelaufen.', risk, 'REM_SCOPE', capability, mandateId);

  if (
    request.principal.humanActorId !== mandate.ownerActorId
    || request.principal.humanActorId !== SYSTEMADMIN_OWNER_ACTOR_ID
  ) return deny('Human Actor stimmt nicht mit dem REM-Owner überein.', risk, 'REM_SCOPE', capability, mandateId);

  if (
    request.principal.agentId !== mandate.subjectAgentId
    || request.principal.agentId !== SYSTEMADMIN_AGENT_ID
  ) return deny('Agent Principal stimmt nicht mit dem REM-Subjekt überein.', risk, 'REM_SCOPE', capability, mandateId);

  if (
    request.execution.repository !== mandate.repository
    || request.execution.repository !== SYSTEMADMIN_REPOSITORY
  ) return deny('Repository liegt außerhalb des REM-Scopes.', risk, 'REM_SCOPE', capability, mandateId);

  if (
    request.execution.baseBranch !== mandate.baseBranch
    || request.execution.baseBranch !== SYSTEMADMIN_BASE_BRANCH
  ) return deny('Base-Branch liegt außerhalb des REM-Scopes.', risk, 'REM_SCOPE', capability, mandateId);

  if (!mandate.roadmapItems.includes(request.execution.roadmapItem)) {
    return deny('Roadmap-Arbeitspaket ist im REM nicht freigegeben.', risk, 'REM_SCOPE', capability, mandateId);
  }
  if (!mandate.allowedCapabilities.includes(capability)) {
    return deny(`Capability ${capability} ist im REM nicht freigegeben.`, risk, 'REM_SCOPE', capability, mandateId);
  }
  if (!SA1_CAPABILITIES.has(capability)) {
    return deny(`Capability ${capability} ist in SA1 technisch noch nicht delegierbar.`, risk, 'REM_SCOPE', capability, mandateId);
  }
  if (
    RISK_ORDER[risk] > RISK_ORDER[mandate.maxRiskClass]
    || RISK_ORDER[risk] > RISK_ORDER.HIGH
  ) return deny(`Risikoklasse ${risk} überschreitet das REM-/SA1-Limit.`, risk, 'REM_SCOPE', capability, mandateId);

  if (!mandate.allowedTargets.includes(request.targetResource)) {
    return deny('Zielressource ist im REM nicht freigegeben.', risk, 'REM_SCOPE', capability, mandateId);
  }

  const requestedPaths = request.execution.requestedPaths ?? [];
  if (requestedPaths.some(path => !isSafeRepoPath(path, false))) {
    return deny(
      'Angeforderter Repository-Pfad ist ungültig oder traversal-verdächtig.',
      risk,
      'REM_SCOPE',
      capability,
      mandateId,
    );
  }
  if (PATH_SCOPED_CAPABILITIES.has(capability) && requestedPaths.length === 0) {
    return deny(
      `${capability} benötigt explizite requestedPaths für Scope-Enforcement.`,
      risk,
      'REM_SCOPE',
      capability,
      mandateId,
    );
  }

  for (const path of requestedPaths) {
    if (!mandate.allowedPaths.some(rule => pathMatchesRule(path, rule))) {
      return deny(`Pfad ${path} liegt außerhalb der REM-Allowlist.`, risk, 'REM_SCOPE', capability, mandateId);
    }
    if (touchesSelfAuthority(path)) {
      return deny(
        `Systemadmin darf seinen eigenen Control-Plane-Pfad nicht mutieren: ${path}.`,
        risk,
        'REM_SCOPE',
        capability,
        mandateId,
      );
    }
  }

  const openPaths = request.execution.openPullRequestChangedPaths ?? [];
  if (openPaths.some(path => !isSafeRepoPath(path, false))) {
    return deny(
      'Open-PR-Scope enthält ungültige Pfade; Konfliktprüfung ist nicht vertrauenswürdig.',
      risk,
      'REM_SCOPE',
      capability,
      mandateId,
    );
  }
  const overlap = requestedPaths.find(path => openPaths.includes(path));
  if (overlap) {
    return deny(`Concurrent-writer Konflikt auf ${overlap}.`, risk, 'REM_SCOPE', capability, mandateId);
  }

  if (REPOSITORY_MUTATING_CAPABILITIES.has(capability)) {
    const mutationClass = request.execution.mutationClass;
    if (!mutationClass || !KNOWN_MUTATION_CLASSES.has(mutationClass)) {
      return deny(
        `${capability} benötigt eine bekannte mutationClass.`,
        risk,
        'REM_SCOPE',
        capability,
        mandateId,
      );
    }
    if (RESERVED_MUTATION_CLASSES.has(mutationClass)) {
      return deny(
        `Mutationsklasse ${mutationClass} ist Human/Owner-reserviert.`,
        risk,
        'REM_SCOPE',
        capability,
        mandateId,
      );
    }
    if (!mandate.allowedMutationClasses.includes(mutationClass)) {
      return deny(
        `Mutationsklasse ${mutationClass} ist im REM nicht freigegeben.`,
        risk,
        'REM_SCOPE',
        capability,
        mandateId,
      );
    }
    if (mutationClass === ROADMAP_EXECUTION_MUTATION_CLASSES.BOUNDED_REVERSIBLE_PRODUCTION) {
      return deny(
        'Produktionsmutation bleibt in SA1 technisch gesperrt.',
        risk,
        'REM_SCOPE',
        capability,
        mandateId,
      );
    }
  }

  if (capability === AGENT_CAPABILITIES.PR) {
    const openCount = request.execution.openSystemadminPullRequests;
    if (!Number.isInteger(openCount) || (openCount as number) < 0) {
      return deny('Open-PR-Zähler fehlt oder ist ungültig.', risk, 'REM_SCOPE', capability, mandateId);
    }
    const operation = request.execution.pullRequestOperation;
    if (operation !== 'CREATE' && operation !== 'UPDATE') {
      return deny('PR-Operation muss CREATE oder UPDATE sein.', risk, 'REM_SCOPE', capability, mandateId);
    }
    if (operation === 'CREATE' && (openCount as number) >= mandate.maxOpenPullRequests) {
      return deny(
        'REM-Limit für gleichzeitig offene Systemadmin-PRs ist erreicht.',
        risk,
        'REM_SCOPE',
        capability,
        mandateId,
      );
    }
  }

  if (capability === AGENT_CAPABILITIES.CI_REQUEST) {
    if (request.execution.ciBudgetExceeded) {
      return deny(
        'CI_REQUEST wegen überschrittenem Budget-Limit verweigert.',
        risk,
        'REM_SCOPE',
        capability,
        mandateId,
      );
    }
    if (request.execution.unchangedHeadAlreadyValidated) {
      return deny(
        'Unveränderter Head wurde bereits validiert; redundanter CI_REQUEST wird verweigert.',
        risk,
        'REM_SCOPE',
        capability,
        mandateId,
      );
    }
  }

  return allow(
    'REM ist gültig und der angeforderte SA1-Scope ist vollständig freigegeben.',
    risk,
    capability,
    mandateId,
    'REM_SCOPE',
  );
}

/**
 * Canonical SA1 entry point.
 *
 * The REM is evaluated first and cannot widen the existing Agent IAM surface.
 * For HIGH repository work, the Owner-approved REM is converted into exact,
 * capability/target-bound approval evidence for the existing M4 evaluator.
 */
export function evaluateSystemadminRoadmapAuthorization(
  request: Readonly<SystemadminRoadmapAuthorizationRequest>,
): SystemadminRoadmapAuthorizationDecision {
  const validation = validateRoadmapExecutionMandate(request.mandate);
  if ('errors' in validation) {
    return deny(
      `REM-Struktur ungültig: ${validation.errors.join(' | ')}`,
      request.riskClass,
      'REM_VALIDATION',
    );
  }

  const mandate = validation.mandate;
  if (!isKnownAgentCapability(request.capability)) {
    return deny(
      `Unbekannte oder nicht delegierbare Capability: ${request.capability}.`,
      request.riskClass,
      'REM_SCOPE',
      undefined,
      mandate.mandateId,
    );
  }

  const capability = request.capability;
  const scoped = evaluateMandateScope(mandate, request, capability);
  if (scoped.verdict === 'DENY') return scoped;

  const risk = effectiveRisk(capability, request.riskClass);
  const iamRequest = {
    principal: request.principal,
    capability,
    grantedCapabilities: mandate.allowedCapabilities,
    riskClass: request.riskClass,
    environment: request.environment,
    targetResource: request.targetResource,
    approval: risk === 'HIGH'
      ? {
          approvalId: mandate.approvalEvidenceRef!,
          approvedByHumanActorId: mandate.ownerActorId,
          subjectAgentId: mandate.subjectAgentId,
          capability,
          targetResource: request.targetResource,
          expiresAt: mandate.expiresAt,
          stepUpVerified: false,
        }
      : undefined,
    killSwitchActive: request.killSwitchActive,
  } as const;

  const iamDecision: AgentAuthorizationDecision = evaluateAgentAuthorization(iamRequest);
  if (iamDecision.verdict === 'DENY') {
    return deny(
      iamDecision.reason,
      iamDecision.riskClass,
      'AGENT_IAM',
      iamDecision.capability,
      mandate.mandateId,
    );
  }

  return allow(
    'REM-Scope und bestehender Agent-IAM-Entscheid sind ALLOW.',
    iamDecision.riskClass,
    iamDecision.capability,
    mandate.mandateId,
    'AGENT_IAM',
  );
}
