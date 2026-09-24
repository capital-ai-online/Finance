#!/usr/bin/env node

import {
  ISSUE_PROJECT_ROUTING_SCHEMA,
} from '../governance/issueProjectRouting.mjs';
import {
  PR_AUTOFIX_REPAIR_REGISTRY,
  resolveRegisteredPrAutofixRepair,
} from './prAutofixRepairRegistry.mjs';

export const ISSUE_REPAIR_ELIGIBILITY_SCHEMA =
  'self-healing-issue-repair-eligibility/1.0.0';

const SHA = /^[0-9a-f]{40}$/;
const GENERATION = /^sha256:[0-9a-f]{64}$/;
const SAFE_PATH =
  /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*[\r\n])[A-Za-z0-9._/@+\-]+(?:\/[A-Za-z0-9._/@+\-]+)*$/;

function blocked(reason, extra = {}) {
  return {
    schema: ISSUE_REPAIR_ELIGIBILITY_SCHEMA,
    state: 'BLOCKED',
    reason,
    mutationAuthorized: false,
    executionAuthority: false,
    ...extra,
  };
}

function observeOnly(reason, extra = {}) {
  return {
    schema: ISSUE_REPAIR_ELIGIBILITY_SCHEMA,
    state: 'OBSERVE_ONLY',
    reason,
    mutationAuthorized: false,
    executionAuthority: false,
    ...extra,
  };
}

function normalizedPaths(values, label) {
  if (!Array.isArray(values)) {
    throw new Error(label + ' must be an array.');
  }
  const result = [];
  const seen = new Set();
  for (const value of values) {
    const normalized = String(value || '').trim().replace(/\\/g, '/');
    if (!SAFE_PATH.test(normalized)) {
      throw new Error(label + ' contains an unsafe repository path: ' + String(value));
    }
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result.sort();
}

export function evaluateRoutedIssueRepairEligibility(
  {
    route,
    currentMainSha,
    sourceWorkflow,
    failureSignature,
    evidenceText,
    authoritativeScopePaths = [],
    writerOverlapPaths = [],
    protectedMutation = false,
    attemptsUsed = 0,
  },
  registry = PR_AUTOFIX_REPAIR_REGISTRY,
) {
  const mainSha = String(currentMainSha || '').trim().toLowerCase();
  if (!SHA.test(mainSha)) {
    throw new Error('currentMainSha must be an exact 40-character SHA.');
  }

  if (!route || typeof route !== 'object' || Array.isArray(route)) {
    return blocked('ROUTE_EVIDENCE_MISSING');
  }
  if (route.schema !== ISSUE_PROJECT_ROUTING_SCHEMA) {
    return blocked('ROUTE_SCHEMA_MISMATCH');
  }
  if (route.state !== 'READY_FOR_PROJECT_EXECUTION') {
    return blocked('ISSUE_NOT_EXECUTION_READY');
  }
  if (route.trustedForExecution !== true) {
    return blocked('ISSUE_ROUTE_NOT_TRUSTED');
  }
  if (String(route.currentMainSha || '').toLowerCase() !== mainSha) {
    return blocked('ROUTING_GENERATION_STALE');
  }
  if (!GENERATION.test(String(route.generation || '').toLowerCase())) {
    return blocked('ROUTING_GENERATION_INVALID');
  }
  if (
    route?.authority?.issue_is_instruction_surface !== false ||
    route?.authority?.issue_body_is_executable !== false ||
    route?.authority?.title_prefix_selects_project_only !== true ||
    route?.authority?.execution_authority !== '/AGENTS.md@CURRENT_MAIN'
  ) {
    return blocked('ISSUE_AUTHORITY_BOUNDARY_INVALID');
  }

  const issueNumber = Number(route.issueNumber);
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    return blocked('ISSUE_IDENTITY_INVALID');
  }

  const projectId = String(route?.project?.projectId || '').trim();
  const owner = String(route?.project?.owner || '').trim();
  if (!/^CAPITAL-AI-[A-Z0-9-]+$/.test(projectId) || owner !== projectId) {
    return blocked('PROJECT_OWNER_RESOLUTION_INVALID', { issueNumber });
  }

  if (protectedMutation === true) {
    return blocked('PROTECTED_MUTATION_EXCLUDED', {
      issueNumber,
      projectId,
      owner,
    });
  }

  if (!Number.isInteger(Number(attemptsUsed)) || Number(attemptsUsed) < 0) {
    throw new Error('attemptsUsed must be a non-negative integer.');
  }
  if (Number(attemptsUsed) > 0) {
    return blocked('REPAIR_ATTEMPT_ALREADY_USED', {
      issueNumber,
      projectId,
      owner,
    });
  }

  const scopePaths = normalizedPaths(authoritativeScopePaths, 'authoritativeScopePaths');
  const overlaps = normalizedPaths(writerOverlapPaths, 'writerOverlapPaths');
  if (scopePaths.length === 0) {
    return blocked('AUTHORITATIVE_SCOPE_NOT_PROVEN', {
      issueNumber,
      projectId,
      owner,
    });
  }
  if (overlaps.length > 0) {
    return blocked('OPEN_WRITER_OVERLAP', {
      issueNumber,
      projectId,
      owner,
      writerOverlapPaths: overlaps,
    });
  }

  const repair = resolveRegisteredPrAutofixRepair(
    {
      sourceWorkflow: String(sourceWorkflow || '').trim(),
      signature: String(failureSignature || '').trim(),
      evidenceText: String(evidenceText || ''),
    },
    registry,
  );

  if (!repair.registered) {
    return observeOnly(repair.reason || 'REGISTERED_REPAIR_NOT_PROVEN', {
      issueNumber,
      projectId,
      owner,
      failureSignature: String(failureSignature || '').trim(),
      repairerId: repair.repairerId || '',
    });
  }

  const registered = registry.find((entry) => entry.id === repair.repairerId);
  if (!registered) {
    return blocked('REPAIRER_REGISTRY_INCONSISTENT', {
      issueNumber,
      projectId,
      owner,
    });
  }

  if (registered.owner !== owner) {
    return blocked('OWNER_CORRECT_HANDOFF_REQUIRED', {
      issueNumber,
      projectId,
      owner,
      repairOwner: registered.owner,
      repairerId: registered.id,
    });
  }

  const allowed = new Set(repair.allowedPaths);
  const outsideAllowlist = scopePaths.filter((file) => !allowed.has(file));
  if (outsideAllowlist.length > 0) {
    return blocked('AUTHORITATIVE_SCOPE_OUTSIDE_REPAIR_ALLOWLIST', {
      issueNumber,
      projectId,
      owner,
      repairerId: repair.repairerId,
      outsideAllowlist,
    });
  }

  return {
    schema: ISSUE_REPAIR_ELIGIBILITY_SCHEMA,
    state: 'ELIGIBLE_FOR_OWNER_WORK_PACKAGE',
    reason: 'ROUTED_ISSUE_AND_REGISTERED_REPAIR_EVIDENCE_CONVERGED',
    issueNumber,
    projectId,
    owner,
    primaryPvc: [...(route?.project?.primaryPvc || [])].sort(),
    currentMainSha: mainSha,
    routingGeneration: route.generation,
    failureSignature: String(failureSignature || '').trim(),
    repairerId: repair.repairerId,
    repairerPath: repair.repairerPath,
    authoritativeScopePaths: scopePaths,
    allowedPaths: [...repair.allowedPaths].sort(),
    mutationAuthorized: false,
    executionAuthority: false,
    nextStep: 'DERIVE_OWNER_CORRECT_BOUNDED_WORK_PACKAGE',
    issueBodyExecutable: false,
    commentsExecutable: false,
    mergeAuthority: 'HUMAN_OR_CODEOWNER_ONLY',
  };
}
