// M7 (Deployment Identity, ADR-0061, docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md,
// "Required Negative Tests"). Structural validator and execution-time authorization gate for the
// DEVELOPMENT Chain Mutation Handoff Contract (.ai/contracts/development-chain-mutation-handoff.schema.json,
// docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md).
//
// The schema's executorAgentId is hardcoded to the SA3B/GitHub roadmap executor, so this Contract
// has never had a machine validator: every M7 Render mutation so far (deploy-hook rotation,
// rollback, roll-forward) was performed manually by the Owner and verified only after the fact via
// Render's own API. This module exists to prove the DENY logic the Contract implies is actually
// correct - it is not wired into a live Render execution host, because none exists yet. If one is
// ever built, evaluateMutationHandoffExecution is the gate it would call before any side effect.

const KNOWN_PLATFORMS = new Set(['GITHUB', 'SUPABASE', 'STRIPE', 'RENDER', 'IONOS', 'OTHER']);
const KNOWN_MUTATION_CLASSES = new Set([
  'REPOSITORY',
  'PLATFORM_CONFIG',
  'IDENTITY',
  'DEPLOYMENT',
  'BILLING',
  'DATA',
  'DNS_TLS',
]);
const KNOWN_RISK_CLASSES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const KNOWN_STATUSES = new Set([
  'DRAFT',
  'ROADMAP_APPROVED',
  'PRECHECK_PASS',
  'MUTATION_APPROVED',
  'EXECUTING',
  'VERIFIED_PASS',
  'FAILED_ROLLBACK_REQUIRED',
  'ROLLED_BACK',
  'CANCELLED',
]);
const APPROVAL_REQUIRED_STATUSES = new Set([
  'MUTATION_APPROVED',
  'EXECUTING',
  'VERIFIED_PASS',
  'FAILED_ROLLBACK_REQUIRED',
  'ROLLED_BACK',
]);
const EXECUTABLE_STATUSES = new Set(['MUTATION_APPROVED', 'EXECUTING']);
const ALWAYS_FORBIDDEN = ['MERGE', 'SELF_AUTHORITY_EXPANSION', 'SECURITY_CONTROL_DISABLEMENT'] as const;
const NEVER_ALLOWED = [
  'MERGE',
  'SELF_AUTHORITY_EXPANSION',
  'SECURITY_CONTROL_DISABLEMENT',
  'OWNER_ADMIN_ELEVATION',
  'SECRET_DISCLOSURE',
] as const;

const CANONICAL_REPOSITORY = 'SvenKulessa/Finance';
const CANONICAL_BASE_BRANCH = 'main';
const CANONICAL_OWNER = 'SvenKulessa';
const CONTRACT_ID_PATTERN = /^DCH-[A-Z0-9][A-Z0-9._-]{2,80}$/;
const OPERATION_PATTERN = /^[A-Z][A-Z0-9_:-]{2,180}$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,180}$/;
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const WILDCARD_PATTERN = /(^|[/.:])\*($|[/.:])/;

// Every known production service this Contract is currently allowed to target. A Handoff whose
// targetResource does not match its platform's known resource is rejected outright, closing the
// "wrong Render service/environment" negative test for real rather than relying on operator care.
const KNOWN_PLATFORM_RESOURCES: Readonly<Record<string, ReadonlySet<string>>> = {
  RENDER: new Set(['srv-d91o1o9o3t8c73edi55g']),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isUniqueStringArray(value: unknown, pattern?: RegExp): value is string[] {
  return Array.isArray(value)
    && value.length > 0
    && value.every(item => typeof item === 'string' && (!pattern || pattern.test(item)))
    && new Set(value).size === value.length;
}

function isFiniteDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export interface MutationHandoff {
  contractId: string;
  contractVersion: '1.0.0';
  status: string;
  roadmapPhase: string;
  roadmapItem: string;
  repository: string;
  baseBranch: string;
  baseSha: string;
  owner: string;
  executorAgentId: string;
  authorityRefs: readonly string[];
  approvalEvidenceRef?: string | null;
  platform: string;
  mutationClass: string;
  riskClass: string;
  targetResource: string;
  allowedOperations: readonly string[];
  forbiddenOperations: readonly string[];
  expectedPostState: string;
  idempotencyKey: string;
  concurrencyKey: string;
  auditRequired: true;
  dryRunRequired: boolean;
  expiresAt: string;
}

export type MutationHandoffValidation =
  | { valid: true; handoff: Readonly<MutationHandoff> }
  | { valid: false; errors: readonly string[] };

// Mirrors .ai/contracts/development-chain-mutation-handoff.schema.json, plus the
// KNOWN_PLATFORM_RESOURCES pin (schema-level "wrong Render service/environment -> DENY").
export function validateMutationHandoff(input: unknown): MutationHandoffValidation {
  const errors: string[] = [];
  if (!isRecord(input)) return { valid: false, errors: ['Handoff muss ein Objekt sein.'] };

  if (!isNonEmptyString(input.contractId) || !CONTRACT_ID_PATTERN.test(input.contractId)) {
    errors.push('contractId ist ungueltig.');
  }
  if (input.contractVersion !== '1.0.0') errors.push('contractVersion muss 1.0.0 sein.');
  if (typeof input.status !== 'string' || !KNOWN_STATUSES.has(input.status)) {
    errors.push('status ist ungueltig.');
  }
  if (typeof input.roadmapPhase !== 'string' || !/^M(?:[0-9]+|5A)$/.test(input.roadmapPhase)) {
    errors.push('roadmapPhase ist ungueltig.');
  }
  if (!isNonEmptyString(input.roadmapItem)) errors.push('roadmapItem fehlt.');
  if (input.repository !== CANONICAL_REPOSITORY) errors.push('repository liegt ausserhalb des Scopes.');
  if (input.baseBranch !== CANONICAL_BASE_BRANCH) errors.push('baseBranch muss main sein.');
  if (typeof input.baseSha !== 'string' || !SHA_PATTERN.test(input.baseSha)) {
    errors.push('baseSha ist kein gueltiger 40-stelliger Commit-SHA.');
  }
  if (input.owner !== CANONICAL_OWNER) errors.push('owner entspricht nicht dem kanonischen Owner.');
  if (!isNonEmptyString(input.executorAgentId)) errors.push('executorAgentId fehlt.');
  if (!isUniqueStringArray(input.authorityRefs)) errors.push('authorityRefs muss eine eindeutige, nicht leere Liste sein.');

  if (
    typeof input.platform !== 'string' || !KNOWN_PLATFORMS.has(input.platform)
  ) errors.push('platform ist ungueltig.');
  if (
    typeof input.mutationClass !== 'string' || !KNOWN_MUTATION_CLASSES.has(input.mutationClass)
  ) errors.push('mutationClass ist ungueltig.');
  if (
    typeof input.riskClass !== 'string' || !KNOWN_RISK_CLASSES.has(input.riskClass)
  ) errors.push('riskClass ist ungueltig.');

  if (!isNonEmptyString(input.targetResource) || WILDCARD_PATTERN.test(input.targetResource)) {
    errors.push('targetResource fehlt oder enthaelt einen unzulaessigen Wildcard.');
  } else if (typeof input.platform === 'string' && KNOWN_PLATFORM_RESOURCES[input.platform]) {
    if (!KNOWN_PLATFORM_RESOURCES[input.platform].has(input.targetResource)) {
      errors.push(`targetResource ist kein bekannter ${input.platform}-Dienst dieses Repositories.`);
    }
  }

  if (!isUniqueStringArray(input.allowedOperations, OPERATION_PATTERN)) {
    errors.push('allowedOperations muss eine eindeutige, nicht leere Liste gueltiger Operationen sein.');
  } else {
    for (const forbidden of NEVER_ALLOWED) {
      if ((input.allowedOperations as string[]).includes(forbidden)) {
        errors.push(`allowedOperations darf ${forbidden} niemals enthalten.`);
      }
    }
  }

  if (!isUniqueStringArray(input.forbiddenOperations, OPERATION_PATTERN)) {
    errors.push('forbiddenOperations muss eine eindeutige, nicht leere Liste gueltiger Operationen sein.');
  } else {
    for (const required of ALWAYS_FORBIDDEN) {
      if (!(input.forbiddenOperations as string[]).includes(required)) {
        errors.push(`forbiddenOperations muss ${required} enthalten.`);
      }
    }
  }

  if (!isNonEmptyString(input.expectedPostState)) errors.push('expectedPostState fehlt.');
  if (typeof input.idempotencyKey !== 'string' || !IDEMPOTENCY_KEY_PATTERN.test(input.idempotencyKey)) {
    errors.push('idempotencyKey ist ungueltig.');
  }
  if (typeof input.concurrencyKey !== 'string' || input.concurrencyKey.trim().length < 6) {
    errors.push('concurrencyKey ist ungueltig.');
  }
  if (input.auditRequired !== true) errors.push('auditRequired muss immer true sein.');
  if (typeof input.dryRunRequired !== 'boolean') errors.push('dryRunRequired muss boolean sein.');
  if (!isFiniteDate(input.expiresAt)) errors.push('expiresAt muss ein gueltiges Datum sein.');

  if (
    typeof input.status === 'string'
    && APPROVAL_REQUIRED_STATUSES.has(input.status)
    && !isNonEmptyString(input.approvalEvidenceRef)
  ) {
    errors.push(`Status ${input.status} benoetigt approvalEvidenceRef (Human/Owner Mutation Approval).`);
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, handoff: input as unknown as MutationHandoff };
}

export interface MutationExecutionActor {
  humanActorId: string;
  executorAgentId: string;
}

export interface MutationExecutionRequest {
  handoff: unknown;
  actor: Readonly<MutationExecutionActor>;
  attemptedOperation: string;
  attemptedTargetResource: string;
  auditPermitRef?: string | null;
  now?: string | number | Date;
  seenIdempotencyKeys?: ReadonlySet<string>;
}

export interface MutationExecutionDecision {
  verdict: 'ALLOW' | 'DENY';
  reason: string;
  contractId?: string;
}

function deny(reason: string, contractId?: string): MutationExecutionDecision {
  return { verdict: 'DENY', reason, ...(contractId ? { contractId } : {}) };
}

function nowMs(value: MutationExecutionRequest['now']): number {
  if (value === undefined) return Date.now();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Date.parse(value);
}

// Execution-time gate. Never called by a live executor today (Render mutations remain manual and
// Owner-performed), but proves every M7 "Required Negative Tests" scenario that concerns the
// Handoff Contract really does resolve to DENY, not just "the schema looks strict".
export function evaluateMutationHandoffExecution(
  request: Readonly<MutationExecutionRequest>,
): MutationExecutionDecision {
  const validation = validateMutationHandoff(request.handoff);
  if ('errors' in validation) {
    return deny(`Handoff-Struktur ungueltig: ${validation.errors.join(' | ')}`);
  }
  const handoff = validation.handoff;

  // deploy request from non-main or unverified source -> DENY
  if (handoff.baseBranch !== CANONICAL_BASE_BRANCH || handoff.repository !== CANONICAL_REPOSITORY) {
    return deny('Handoff bindet nicht an main/das kanonische Repository.', handoff.contractId);
  }
  if (
    request.actor.humanActorId !== handoff.owner
    || request.actor.humanActorId !== CANONICAL_OWNER
  ) {
    return deny('Ausfuehrender Human-Actor stimmt nicht mit dem Handoff-Owner ueberein.', handoff.contractId);
  }
  if (request.actor.executorAgentId !== handoff.executorAgentId) {
    return deny('Ausfuehrender Agent stimmt nicht mit dem Handoff-Executor ueberein.', handoff.contractId);
  }

  // expired/missing Owner mutation approval -> DENY
  if (!EXECUTABLE_STATUSES.has(handoff.status)) {
    return deny(`Handoff-Status ${handoff.status} autorisiert keine Ausfuehrung.`, handoff.contractId);
  }
  if (!isNonEmptyString(handoff.approvalEvidenceRef ?? null)) {
    return deny('Keine Human/Owner Mutation Approval Evidence vorhanden.', handoff.contractId);
  }
  const currentTime = nowMs(request.now);
  if (!Number.isFinite(currentTime) || currentTime >= Date.parse(handoff.expiresAt)) {
    return deny('Handoff/Approval ist abgelaufen.', handoff.contractId);
  }

  // Handoff target mismatch -> DENY
  if (request.attemptedTargetResource !== handoff.targetResource) {
    return deny(
      `Zielressource ${request.attemptedTargetResource} weicht vom Handoff-Ziel ${handoff.targetResource} ab.`,
      handoff.contractId,
    );
  }

  // duplicate/replayed mutation request -> DENY/DEDUPE
  if (request.seenIdempotencyKeys?.has(handoff.idempotencyKey)) {
    return deny(`Idempotency-Key ${handoff.idempotencyKey} wurde bereits verarbeitet (Replay/Duplikat).`, handoff.contractId);
  }

  // execution without durable audit permit -> DENY
  if (!isNonEmptyString(request.auditPermitRef ?? null)) {
    return deny('Keine durable Audit-Permit-Referenz vor Ausfuehrung vorhanden.', handoff.contractId);
  }

  // agent attempts MERGE -> DENY; arbitrary platform operation outside Handoff -> DENY
  if (!OPERATION_PATTERN.test(request.attemptedOperation)) {
    return deny(`Angeforderte Operation ${request.attemptedOperation} ist syntaktisch ungueltig.`, handoff.contractId);
  }
  if ((NEVER_ALLOWED as readonly string[]).includes(request.attemptedOperation)) {
    return deny(`Operation ${request.attemptedOperation} ist grundsaetzlich nie zulaessig.`, handoff.contractId);
  }
  if (handoff.forbiddenOperations.includes(request.attemptedOperation)) {
    return deny(`Operation ${request.attemptedOperation} ist im Handoff explizit verboten.`, handoff.contractId);
  }
  if (!handoff.allowedOperations.includes(request.attemptedOperation)) {
    return deny(`Operation ${request.attemptedOperation} liegt ausserhalb der Handoff-Allowlist.`, handoff.contractId);
  }

  return { verdict: 'ALLOW', reason: 'Handoff ist gueltig und die angeforderte Operation ist vollstaendig freigegeben.', contractId: handoff.contractId };
}
