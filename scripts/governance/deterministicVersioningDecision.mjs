import crypto from 'node:crypto';

export const RULE_ENGINE_VERSION = 'capital-ai-versioning-rules/1.0.0';
export const PLATFORM_VERSION_AUTHORITY = 'package.json#version';

export const DETERMINISTIC_CHANGE_RULES = Object.freeze({
  NO_VERSION_RELEVANT_DELTA: ['NONE', 'NONE_NO_VERSION_RELEVANT_DELTA'],
  BACKWARD_COMPATIBLE_BUG_FIX: ['PATCH', 'PATCH_BACKWARD_COMPATIBLE_BUG_FIX'],
  DOCUMENTATION_CORRECTION_NO_NEW_CAPABILITY: ['PATCH', 'PATCH_DOCUMENTATION_CORRECTION'],
  INTERNAL_IMPLEMENTATION_NO_CONTRACT_EXTENSION: ['PATCH', 'PATCH_INTERNAL_IMPLEMENTATION_CHANGE'],
  TEST_VALIDATION_FIX_NO_PUBLIC_CAPABILITY: ['PATCH', 'PATCH_TEST_VALIDATION_FIX'],
  NEW_BACKWARD_COMPATIBLE_RULE: ['MINOR', 'MINOR_NEW_BACKWARD_COMPATIBLE_RULE'],
  NEW_CAPABILITY: ['MINOR', 'MINOR_NEW_CAPABILITY'],
  NEW_VALIDATOR: ['MINOR', 'MINOR_NEW_VALIDATOR'],
  NEW_OPTIONAL_CONTRACT_FIELD: ['MINOR', 'MINOR_NEW_OPTIONAL_CONTRACT_FIELD'],
  NEW_BACKWARD_COMPATIBLE_API_FUNCTION: ['MINOR', 'MINOR_NEW_BACKWARD_COMPATIBLE_API_FUNCTION'],
  NEW_BACKWARD_COMPATIBLE_EVENT_FUNCTION: ['MINOR', 'MINOR_NEW_BACKWARD_COMPATIBLE_EVENT_FUNCTION'],
  REMOVE_PUBLIC_CONTRACT: ['MAJOR', 'MAJOR_REMOVE_PUBLIC_CONTRACT'],
  INCOMPATIBLE_PUBLIC_CONTRACT: ['MAJOR', 'MAJOR_INCOMPATIBLE_PUBLIC_CONTRACT'],
  REMOVE_REQUIRED_INTERFACE: ['MAJOR', 'MAJOR_REMOVE_REQUIRED_INTERFACE'],
  INCOMPATIBLE_EVENT_SCHEMA: ['MAJOR', 'MAJOR_INCOMPATIBLE_EVENT_SCHEMA'],
  INCOMPATIBLE_API_SCHEMA: ['MAJOR', 'MAJOR_INCOMPATIBLE_API_SCHEMA'],
  SEMANTIC_CHANGE_WITH_CONSUMER_BREAKAGE: ['MAJOR', 'MAJOR_EVIDENCED_CONSUMER_BREAKAGE'],
});

const SEVERITY = Object.freeze({ NONE: 0, PATCH: 1, MINOR: 2, MAJOR: 3 });
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function fail(code, message) {
  throw new Error(`FAIL_CLOSED:${code}:${message}`);
}

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) fail('MISSING_EVIDENCE', `${name} is required`);
  return value.trim();
}

function parseSemver(value) {
  const version = requireString(value, 'previousVersion');
  const match = SEMVER.exec(version);
  if (!match) fail('INVALID_SEMVER', `invalid strict SemVer: ${version}`);
  return match.slice(1).map(Number);
}

function targetVersion(previousVersion, bumpType) {
  const [major, minor, patch] = parseSemver(previousVersion);
  if (bumpType === 'NONE') return previousVersion;
  if (bumpType === 'PATCH') return `${major}.${minor}.${patch + 1}`;
  if (bumpType === 'MINOR') return `${major}.${minor + 1}.0`;
  return `${major + 1}.0.0`;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function canonicalSemanticDelta(items) {
  return items
    .map((item) => stableValue(item))
    .sort((a, b) => String(a.evidenceId).localeCompare(String(b.evidenceId)));
}

function decisionHash({ baseSha, semanticDelta, ruleSetVersion, previousVersion }) {
  const canonical = JSON.stringify(stableValue({ baseSha, semanticDelta, ruleSetVersion, previousVersion }));
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

function validateAuthorities(versionAuthorities) {
  if (!Array.isArray(versionAuthorities) || versionAuthorities.length !== 1 || versionAuthorities[0] !== PLATFORM_VERSION_AUTHORITY) {
    fail('DUPLICATE_OR_INVALID_VERSION_AUTHORITY', `expected exactly ${PLATFORM_VERSION_AUTHORITY}`);
  }
}

function validateEvidence(semanticDelta) {
  if (!Array.isArray(semanticDelta) || semanticDelta.length === 0) fail('MISSING_EVIDENCE', 'semanticDelta must contain machine-readable evidence');

  const seen = new Map();
  return semanticDelta.map((item) => {
    if (!item || typeof item !== 'object') fail('MISSING_EVIDENCE', 'semanticDelta item must be an object');
    const evidenceId = requireString(item.evidenceId, 'evidenceId');
    const changeType = requireString(item.changeType, 'changeType');
    requireString(item.source, 'source');
    requireString(item.subject, 'subject');
    if (!DETERMINISTIC_CHANGE_RULES[changeType]) fail('UNKNOWN_CHANGE_TYPE', changeType);

    const prior = seen.get(evidenceId);
    const signature = JSON.stringify(stableValue(item));
    if (prior && prior !== signature) fail('CONTRADICTORY_EVIDENCE', `conflicting evidenceId ${evidenceId}`);
    seen.set(evidenceId, signature);
    return { ...item, evidenceId, changeType };
  });
}

export function evaluateDeterministicVersionDecision(input) {
  const previousVersion = requireString(input?.previousVersion, 'previousVersion');
  parseSemver(previousVersion);
  const baseSha = requireString(input?.baseSha, 'baseSha');
  const branchHeadShaBeforeVersioning = requireString(input?.branchHeadShaBeforeVersioning, 'branchHeadShaBeforeVersioning');
  const timestamp = requireString(input?.timestamp, 'timestamp');
  const actor = requireString(input?.actor, 'actor');
  const client = requireString(input?.client, 'client');
  const affectedProject = requireString(input?.affectedProject, 'affectedProject');
  const affectedComponent = requireString(input?.affectedComponent, 'affectedComponent');

  if (input?.ruleSetVersion !== RULE_ENGINE_VERSION) fail('UNKNOWN_RULE_SET', `expected ${RULE_ENGINE_VERSION}`);
  validateAuthorities(input?.versionAuthorities);
  const evidence = validateEvidence(input?.semanticDelta);

  const classified = evidence.map((item) => {
    const [bumpType, ruleId] = DETERMINISTIC_CHANGE_RULES[item.changeType];
    return { item, bumpType, ruleId };
  });
  const bumpType = classified.reduce((highest, entry) => SEVERITY[entry.bumpType] > SEVERITY[highest] ? entry.bumpType : highest, 'NONE');
  const normalizedDelta = canonicalSemanticDelta(evidence);
  const hash = decisionHash({ baseSha, semanticDelta: normalizedDelta, ruleSetVersion: RULE_ENGINE_VERSION, previousVersion });
  const formattedDecisionHash = `sha256:${hash}`;
  const repeated = Array.isArray(input?.existingDecisionHashes) && input.existingDecisionHashes.includes(formattedDecisionHash);
  const calculatedVersion = targetVersion(previousVersion, bumpType);

  const majorPolicyBlocked = bumpType === 'MAJOR' && input?.majorReleasePolicyAuthorized !== true;
  const materializationEligible = !repeated && bumpType !== 'NONE' && !majorPolicyBlocked;

  return Object.freeze({
    status: repeated ? 'NO_CHANGE_ALREADY_APPLIED' : 'DECISION_READY',
    previousVersion,
    calculatedVersion,
    bumpType,
    triggeredRules: [...new Set(classified.map((entry) => entry.ruleId))].sort(),
    changedContracts: [...new Set(evidence.map((item) => item.contractId).filter(Boolean))].sort(),
    changedCapabilities: [...new Set(evidence.map((item) => item.capabilityId).filter(Boolean))].sort(),
    baseSha,
    branchHeadShaBeforeVersioning,
    resultingBranchHeadSha: null,
    ruleEngineVersion: RULE_ENGINE_VERSION,
    decisionHash: formattedDecisionHash,
    timestamp,
    actor,
    client,
    affectedProject,
    affectedComponent,
    applicableAdrRefs: [...(input?.applicableAdrRefs ?? [])].sort(),
    applicableEssRefs: [...(input?.applicableEssRefs ?? [])].sort(),
    applicableControlRefs: [...(input?.applicableControlRefs ?? [])].sort(),
    materialization: {
      eligible: materializationEligible,
      reason: repeated
        ? 'NO_CHANGE_ALREADY_APPLIED'
        : bumpType === 'NONE'
          ? 'NO_VERSION_MUTATION'
          : majorPolicyBlocked
            ? 'BLOCKED_BY_APPLICABLE_MAJOR_RELEASE_POLICY'
            : 'ELIGIBLE_FOR_SCOPED_BRANCH_MATERIALIZATION_AFTER_AUTHORITY_EFFECTIVE',
      directMain: 'DENY',
      automaticMerge: 'DENY',
      automaticReleaseAcceptance: 'DENY',
      automaticDeployment: 'DENY',
    },
  });
}
