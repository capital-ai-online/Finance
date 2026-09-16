import fs from 'node:fs';
import path from 'node:path';
import {
  buildReleaseVersionPlan,
  expectedClassification,
  type ReleaseClassification,
  type ReleaseVersionPlan,
  type ReleaseVersionRequest,
} from './releaseVersionGate';

export const DETERMINISTIC_VERSION_MATERIALIZATION_VERSION = 'deterministic-version-materialization/1.0.0' as const;
export const DETERMINISTIC_RULE_CONTRACT_AUTHORITY = 'AUTH-GOV-DETERMINISTIC-VERSIONING-RULE-CONTRACT' as const;
export const DETERMINISTIC_VERSIONING_ADR = 'AUTH-ADR-DETERMINISTIC-AUTONOMOUS-VERSIONING-2026-09-11' as const;
export const DETERMINISTIC_VERSIONING_CONTROL = 'CTRL-GOV-VERSION-002' as const;
export const DETERMINISTIC_RULE_ENGINE_VERSION = 'capital-ai-versioning-rules/1.0.0' as const;
export const PLATFORM_VERSION_AUTHORITY = 'package.json#version' as const;

const SHA1 = /^[0-9a-f]{40}$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const SEVERITY: Record<'NONE' | ReleaseClassification, number> = { NONE: 0, PATCH: 1, MINOR: 2, MAJOR: 3 };
const REQUIRED_ADR_REFS = ['ADR-0030', 'ADR-0105'] as const;
const REQUIRED_ESS_REFS = ['ESS-0001-CONTRACTS'] as const;
const REQUIRED_CONTROL_REFS = ['CTRL-GOV-VERSION-001', 'CTRL-GOV-VERSION-002'] as const;

export interface DeterministicVersionDecisionEvidence {
  status: 'DECISION_READY' | 'NO_CHANGE_ALREADY_APPLIED';
  previousVersion: string;
  calculatedVersion: string;
  bumpType: 'NONE' | ReleaseClassification;
  triggeredRules: string[];
  changedContracts: string[];
  changedCapabilities: string[];
  baseSha: string;
  branchHeadShaBeforeVersioning: string;
  resultingBranchHeadSha: string | null;
  ruleEngineVersion: string;
  decisionHash: string;
  timestamp: string;
  actor: string;
  client: string;
  affectedProject: string;
  affectedComponent: string;
  applicableAdrRefs: string[];
  applicableEssRefs: string[];
  applicableControlRefs: string[];
  materialization: {
    eligible: boolean;
    reason: string;
    directMain: 'DENY';
    automaticMerge: 'DENY';
    automaticReleaseAcceptance: 'DENY';
    automaticDeployment: 'DENY';
  };
}

export interface ScopedBranchMaterializationContext {
  branchName: string;
  branchHeadSha: string;
  baseSha: string;
}

export interface DeterministicReleaseMetadata {
  workPackages: string[];
  migrations: string[];
  risks: string[];
  rollbackBoundary: string;
  acceptanceRequirements: string[];
  gaAdr?: string;
}

interface DeterministicRuleContract {
  authorityId: string;
  lifecycle: string;
  adoptedBy: string;
  singleVersionAuthority: string;
  ruleEngineVersion: string;
  rules: Array<{
    ruleId: string;
    changeType: string;
    bumpType: 'NONE' | ReleaseClassification;
  }>;
  branchMaterialization?: {
    allowedAfterAuthorityEffective?: boolean;
    scope?: string;
    directMainMutation?: string;
    automaticMerge?: string;
    automaticReleaseAcceptance?: string;
    automaticDeployment?: string;
    canonicalMutationPath?: string;
  };
}

export type DeterministicVersionMaterializationResolution =
  | {
      action: 'NO_MUTATION';
      reason: 'NO_CHANGE_ALREADY_APPLIED' | 'NO_VERSION_MUTATION' | 'MATERIALIZATION_INELIGIBLE';
      decision: DeterministicVersionDecisionEvidence;
    }
  | {
      action: 'MATERIALIZE';
      plan: ReleaseVersionPlan;
      decision: DeterministicVersionDecisionEvidence;
    };

function fail(message: string): never {
  throw new Error(`Deterministic version materialization denied: ${message}`);
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) fail(`${label} is required`);
  return value.trim();
}

function requireUniqueStrings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a non-empty array`);
  const normalized = value.map((item) => requireString(item, label));
  if (new Set(normalized).size !== normalized.length) fail(`${label} contains duplicate entries`);
  return normalized;
}

function assertRefs(actual: string[], expected: readonly string[], label: string): void {
  for (const ref of expected) {
    if (!actual.includes(ref)) fail(`${label} is missing ${ref}`);
  }
}

function loadAcceptedRuleContract(repoRoot: string): DeterministicRuleContract {
  const contractPath = path.join(repoRoot, 'docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json');
  if (!fs.existsSync(contractPath)) fail('accepted deterministic Versioning Rule Contract is missing');
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8')) as DeterministicRuleContract;
  if (contract.authorityId !== DETERMINISTIC_RULE_CONTRACT_AUTHORITY) fail('unexpected Rule Contract authority');
  if (contract.lifecycle !== 'accepted-after-human-merge') fail('Rule Contract is not in the accepted post-merge lifecycle');
  if (contract.adoptedBy !== DETERMINISTIC_VERSIONING_ADR) fail('Rule Contract is not adopted by ADR-0105 authority');
  if (contract.singleVersionAuthority !== PLATFORM_VERSION_AUTHORITY) fail('single platform-version authority mismatch');
  if (contract.ruleEngineVersion !== DETERMINISTIC_RULE_ENGINE_VERSION) fail('Rule Contract engine version mismatch');
  if (!Array.isArray(contract.rules) || contract.rules.length === 0) fail('Rule Contract rules are missing');
  if (contract.branchMaterialization?.allowedAfterAuthorityEffective !== true) fail('branch materialization is not authorized');
  if (contract.branchMaterialization?.scope !== 'current-scoped-work-branch-only') fail('branch materialization scope mismatch');
  if (contract.branchMaterialization?.canonicalMutationPath !== 'CAPITAL-AI-OPS / PVC-06 / PVC-07 existing Release Version Gate') {
    fail('canonical mutation path mismatch');
  }
  for (const value of [
    contract.branchMaterialization?.directMainMutation,
    contract.branchMaterialization?.automaticMerge,
    contract.branchMaterialization?.automaticReleaseAcceptance,
    contract.branchMaterialization?.automaticDeployment,
  ]) {
    if (value !== 'DENY') fail('protected action boundary mismatch');
  }
  return contract;
}

function validateDecisionShape(decision: DeterministicVersionDecisionEvidence): void {
  if (!['DECISION_READY', 'NO_CHANGE_ALREADY_APPLIED'].includes(decision?.status)) fail(`unsupported decision status ${String(decision?.status ?? '')}`);
  if (!['NONE', 'PATCH', 'MINOR', 'MAJOR'].includes(decision?.bumpType)) fail(`unsupported bump type ${String(decision?.bumpType ?? '')}`);
  requireString(decision.previousVersion, 'previousVersion');
  requireString(decision.calculatedVersion, 'calculatedVersion');
  requireString(decision.timestamp, 'timestamp');
  requireString(decision.actor, 'actor');
  requireString(decision.client, 'client');
  requireString(decision.affectedProject, 'affectedProject');
  requireString(decision.affectedComponent, 'affectedComponent');
  requireString(decision.materialization?.reason, 'materialization.reason');
  if (!SEMVER.test(decision.previousVersion) || !SEMVER.test(decision.calculatedVersion)) fail('decision versions must be strict SemVer');
  if (!SHA1.test(decision.baseSha)) fail('decision baseSha must be a 40-character lowercase Git SHA');
  if (!SHA1.test(decision.branchHeadShaBeforeVersioning)) fail('decision branchHeadShaBeforeVersioning must be a 40-character lowercase Git SHA');
  if (!SHA256.test(decision.decisionHash)) fail('decisionHash must be sha256:<64 lowercase hex>');
  if (decision.ruleEngineVersion !== DETERMINISTIC_RULE_ENGINE_VERSION) fail('decision Rule Engine version mismatch');
  requireUniqueStrings(decision.triggeredRules, 'triggeredRules');
  if (!Array.isArray(decision.changedContracts) || !Array.isArray(decision.changedCapabilities)) fail('changed contract/capability arrays are required');
  const adrRefs = requireUniqueStrings(decision.applicableAdrRefs, 'applicableAdrRefs');
  const essRefs = requireUniqueStrings(decision.applicableEssRefs, 'applicableEssRefs');
  const controlRefs = requireUniqueStrings(decision.applicableControlRefs, 'applicableControlRefs');
  assertRefs(adrRefs, REQUIRED_ADR_REFS, 'applicableAdrRefs');
  assertRefs(essRefs, REQUIRED_ESS_REFS, 'applicableEssRefs');
  assertRefs(controlRefs, REQUIRED_CONTROL_REFS, 'applicableControlRefs');
  if (decision.materialization.directMain !== 'DENY') fail('decision weakens direct-main boundary');
  if (decision.materialization.automaticMerge !== 'DENY') fail('decision weakens merge boundary');
  if (decision.materialization.automaticReleaseAcceptance !== 'DENY') fail('decision weakens release-acceptance boundary');
  if (decision.materialization.automaticDeployment !== 'DENY') fail('decision weakens deployment boundary');
}

function validateTriggeredRules(decision: DeterministicVersionDecisionEvidence, contract: DeterministicRuleContract): void {
  const ruleBumps = new Map(contract.rules.map((rule) => [rule.ruleId, rule.bumpType]));
  let expectedBump: 'NONE' | ReleaseClassification = 'NONE';
  for (const ruleId of decision.triggeredRules) {
    const bump = ruleBumps.get(ruleId);
    if (!bump) fail(`triggered rule is not present in accepted Rule Contract: ${ruleId}`);
    if (SEVERITY[bump] > SEVERITY[expectedBump]) expectedBump = bump;
  }
  if (expectedBump !== decision.bumpType) fail(`decision bumpType ${decision.bumpType} does not match triggered rules (${expectedBump})`);

  if (decision.bumpType === 'NONE') {
    if (decision.calculatedVersion !== decision.previousVersion) fail('NONE decision must keep calculatedVersion unchanged');
    return;
  }
  const expected = expectedClassification(decision.previousVersion, decision.calculatedVersion);
  if (expected !== decision.bumpType) fail(`calculatedVersion does not match deterministic ${decision.bumpType} transition`);
}

function validateMaterializationContext(
  decision: DeterministicVersionDecisionEvidence,
  context: ScopedBranchMaterializationContext,
): void {
  if (context.branchName === 'main' || !context.branchName.trim()) fail('direct main materialization is prohibited');
  if (!SHA1.test(context.baseSha)) fail('scoped branch base SHA is invalid');
  if (!SHA1.test(context.branchHeadSha)) fail('scoped branch head SHA is invalid');
  if (decision.baseSha !== context.baseSha) fail('decision base SHA does not match scoped branch context');
  if (decision.branchHeadShaBeforeVersioning !== context.branchHeadSha) fail('decision branch-head SHA is stale');
  if (decision.resultingBranchHeadSha !== null) fail('decision has already been materialized');
}

function buildPlan(
  repoRoot: string,
  decision: DeterministicVersionDecisionEvidence & { bumpType: ReleaseClassification },
  metadata: DeterministicReleaseMetadata,
): ReleaseVersionPlan {
  const packageVersion = String(JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))?.version ?? '');
  if (packageVersion !== decision.previousVersion) fail('decision previousVersion is stale relative to package.json#version');

  const request: ReleaseVersionRequest = {
    targetVersion: decision.calculatedVersion,
    classification: decision.bumpType,
    workPackages: metadata.workPackages,
    adrs: [...new Set([...decision.applicableAdrRefs, DETERMINISTIC_VERSIONING_ADR])],
    migrations: metadata.migrations,
    risks: metadata.risks,
    rollbackBoundary: metadata.rollbackBoundary,
    acceptanceRequirements: metadata.acceptanceRequirements,
    gaAdr: metadata.gaAdr,
  };

  const plan = buildReleaseVersionPlan(repoRoot, request);
  if (plan.currentVersion !== decision.previousVersion) fail('Release Version Gate current version differs from decision evidence');
  if (plan.targetVersion !== decision.calculatedVersion) fail('Release Version Gate target differs from deterministic decision');
  if (plan.classification !== decision.bumpType) fail('Release Version Gate classification differs from deterministic decision');
  return plan;
}

export function resolveDeterministicVersionMaterialization(
  repoRoot: string,
  decision: DeterministicVersionDecisionEvidence,
  context: ScopedBranchMaterializationContext,
  metadata: DeterministicReleaseMetadata,
): DeterministicVersionMaterializationResolution {
  const contract = loadAcceptedRuleContract(repoRoot);
  validateDecisionShape(decision);
  validateTriggeredRules(decision, contract);

  if (decision.status === 'NO_CHANGE_ALREADY_APPLIED') {
    if (decision.materialization.eligible) fail('NO_CHANGE_ALREADY_APPLIED must not be materialization.eligible');
    if (decision.materialization.reason !== 'NO_CHANGE_ALREADY_APPLIED') fail('repeated decision materialization reason mismatch');
    return { action: 'NO_MUTATION', reason: 'NO_CHANGE_ALREADY_APPLIED', decision };
  }

  if (decision.bumpType === 'NONE') {
    if (decision.materialization.eligible) fail('NONE decision must not be materialization.eligible');
    if (decision.materialization.reason !== 'NO_VERSION_MUTATION') fail('NONE decision materialization reason mismatch');
    return { action: 'NO_MUTATION', reason: 'NO_VERSION_MUTATION', decision };
  }

  if (!decision.materialization.eligible) {
    return { action: 'NO_MUTATION', reason: 'MATERIALIZATION_INELIGIBLE', decision };
  }

  validateMaterializationContext(decision, context);
  return { action: 'MATERIALIZE', plan: buildPlan(repoRoot, decision as DeterministicVersionDecisionEvidence & { bumpType: ReleaseClassification }, metadata), decision };
}

export function buildDeterministicReleaseVersionPlan(
  repoRoot: string,
  decision: DeterministicVersionDecisionEvidence,
  context: ScopedBranchMaterializationContext,
  metadata: DeterministicReleaseMetadata,
): ReleaseVersionPlan {
  const resolution = resolveDeterministicVersionMaterialization(repoRoot, decision, context, metadata);
  if (resolution.action !== 'MATERIALIZE') fail(`decision does not authorize a mutation: ${resolution.reason}`);
  return resolution.plan;
}
