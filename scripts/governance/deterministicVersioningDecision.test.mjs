import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  DETERMINISTIC_CHANGE_RULES,
  evaluateDeterministicVersionDecision,
  PLATFORM_VERSION_AUTHORITY,
  RULE_ENGINE_VERSION,
} from './deterministicVersioningDecision.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ruleContract = JSON.parse(fs.readFileSync(path.join(here, '../../docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json'), 'utf8'));

function base(overrides = {}) {
  return {
    previousVersion: '0.6.0',
    baseSha: 'base-a',
    branchHeadShaBeforeVersioning: 'head-a',
    ruleSetVersion: RULE_ENGINE_VERSION,
    versionAuthorities: [PLATFORM_VERSION_AUTHORITY],
    semanticDelta: [{ evidenceId: 'E1', changeType: 'NO_VERSION_RELEVANT_DELTA', source: 'machine:test', subject: 'scope' }],
    timestamp: '2026-09-11T01:51:00+02:00',
    actor: 'agent:test',
    client: 'ChatGPT',
    affectedProject: 'CAPITAL-AI-GOV',
    affectedComponent: 'Governance',
    applicableAdrRefs: ['ADR-0105'],
    applicableEssRefs: ['ESS-0001-CONTRACTS'],
    applicableControlRefs: ['CTRL-GOV-VERSION-001', 'CTRL-GOV-VERSION-002'],
    ...overrides,
  };
}

test('machine-readable contract exactly matches the executable rule map', () => {
  assert.equal(ruleContract.authorityId, 'AUTH-GOV-DETERMINISTIC-VERSIONING-RULE-CONTRACT');
  assert.equal(ruleContract.singleVersionAuthority, PLATFORM_VERSION_AUTHORITY);
  assert.equal(ruleContract.ruleEngineVersion, RULE_ENGINE_VERSION);
  assert.deepEqual(ruleContract.classificationPrecedence, ['MAJOR', 'MINOR', 'PATCH', 'NONE']);
  assert.equal(ruleContract.aggregation, 'highest_severity_wins');
  assert.equal(ruleContract.semanticEvidenceContract.freeLlmEstimationAllowed, false);
  assert.equal(ruleContract.branchMaterialization.directMainMutation, 'DENY');
  assert.equal(ruleContract.branchMaterialization.automaticMerge, 'DENY');
  assert.equal(ruleContract.branchMaterialization.automaticReleaseAcceptance, 'DENY');
  assert.equal(ruleContract.branchMaterialization.automaticDeployment, 'DENY');

  const contractMap = Object.fromEntries(
    ruleContract.rules.map((rule) => [rule.changeType, [rule.bumpType, rule.ruleId]]),
  );
  assert.deepEqual(contractMap, DETERMINISTIC_CHANGE_RULES);
});

for (const [name, changeType, bumpType, calculatedVersion] of [
  ['NONE', 'NO_VERSION_RELEVANT_DELTA', 'NONE', '0.6.0'],
  ['PATCH', 'BACKWARD_COMPATIBLE_BUG_FIX', 'PATCH', '0.6.1'],
  ['MINOR', 'NEW_CAPABILITY', 'MINOR', '0.7.0'],
  ['MAJOR', 'INCOMPATIBLE_PUBLIC_CONTRACT', 'MAJOR', '1.0.0'],
]) {
  test(name, () => {
    const result = evaluateDeterministicVersionDecision(base({
      semanticDelta: [{ evidenceId: 'E1', changeType, source: 'machine:test', subject: name }],
      majorReleasePolicyAuthorized: bumpType === 'MAJOR',
    }));
    assert.equal(result.bumpType, bumpType);
    assert.equal(result.calculatedVersion, calculatedVersion);
  });
}

test('mixed impacts use highest severity', () => {
  const result = evaluateDeterministicVersionDecision(base({ semanticDelta: [
    { evidenceId: 'E1', changeType: 'BACKWARD_COMPATIBLE_BUG_FIX', source: 'machine:test', subject: 'bug' },
    { evidenceId: 'E2', changeType: 'DOCUMENTATION_CORRECTION_NO_NEW_CAPABILITY', source: 'machine:test', subject: 'docs' },
    { evidenceId: 'E3', changeType: 'NEW_VALIDATOR', source: 'machine:test', subject: 'validator' },
  ] }));
  assert.equal(result.bumpType, 'MINOR');
  assert.equal(result.calculatedVersion, '0.7.0');
});

test('missing evidence fails closed', () => {
  assert.throws(() => evaluateDeterministicVersionDecision(base({ semanticDelta: [] })), /FAIL_CLOSED:MISSING_EVIDENCE/);
});

test('contradictory evidence fails closed', () => {
  assert.throws(() => evaluateDeterministicVersionDecision(base({ semanticDelta: [
    { evidenceId: 'E1', changeType: 'BACKWARD_COMPATIBLE_BUG_FIX', source: 'machine:test', subject: 'same' },
    { evidenceId: 'E1', changeType: 'NEW_CAPABILITY', source: 'machine:test', subject: 'same' },
  ] })), /FAIL_CLOSED:CONTRADICTORY_EVIDENCE/);
});

test('same decision repeated is idempotent', () => {
  const first = evaluateDeterministicVersionDecision(base({ semanticDelta: [
    { evidenceId: 'E1', changeType: 'BACKWARD_COMPATIBLE_BUG_FIX', source: 'machine:test', subject: 'bug' },
  ] }));
  const second = evaluateDeterministicVersionDecision(base({
    semanticDelta: [{ evidenceId: 'E1', changeType: 'BACKWARD_COMPATIBLE_BUG_FIX', source: 'machine:test', subject: 'bug' }],
    existingDecisionHashes: [first.decisionHash],
  }));
  assert.equal(second.status, 'NO_CHANGE_ALREADY_APPLIED');
  assert.equal(second.materialization.eligible, false);
});

test('base SHA change creates new decision identity', () => {
  const a = evaluateDeterministicVersionDecision(base());
  const b = evaluateDeterministicVersionDecision(base({ baseSha: 'base-b' }));
  assert.notEqual(a.decisionHash, b.decisionHash);
});

test('rule set change fails closed and therefore requires reevaluation under a known contract', () => {
  assert.throws(() => evaluateDeterministicVersionDecision(base({ ruleSetVersion: 'capital-ai-versioning-rules/2.0.0' })), /FAIL_CLOSED:UNKNOWN_RULE_SET/);
});

test('duplicate version authority fails', () => {
  assert.throws(() => evaluateDeterministicVersionDecision(base({ versionAuthorities: ['package.json#version', 'legacy'] })), /FAIL_CLOSED:DUPLICATE_OR_INVALID_VERSION_AUTHORITY/);
});

test('protected automatic actions remain denied', () => {
  const result = evaluateDeterministicVersionDecision(base({ semanticDelta: [
    { evidenceId: 'E1', changeType: 'NEW_CAPABILITY', source: 'machine:test', subject: 'capability', capabilityId: 'CAP-1' },
  ] }));
  assert.equal(result.materialization.directMain, 'DENY');
  assert.equal(result.materialization.automaticMerge, 'DENY');
  assert.equal(result.materialization.automaticReleaseAcceptance, 'DENY');
  assert.equal(result.materialization.automaticDeployment, 'DENY');
});

test('MAJOR classification does not bypass current GA release policy', () => {
  const result = evaluateDeterministicVersionDecision(base({ semanticDelta: [
    { evidenceId: 'E1', changeType: 'INCOMPATIBLE_API_SCHEMA', source: 'machine:test', subject: 'api-v2', contractId: 'API' },
  ] }));
  assert.equal(result.bumpType, 'MAJOR');
  assert.equal(result.calculatedVersion, '1.0.0');
  assert.equal(result.materialization.eligible, false);
  assert.equal(result.materialization.reason, 'BLOCKED_BY_APPLICABLE_MAJOR_RELEASE_POLICY');
});

test('evidence ordering does not change decision hash', () => {
  const one = { evidenceId: 'E1', changeType: 'BACKWARD_COMPATIBLE_BUG_FIX', source: 'machine:test', subject: 'bug' };
  const two = { evidenceId: 'E2', changeType: 'NEW_VALIDATOR', source: 'machine:test', subject: 'validator' };
  const a = evaluateDeterministicVersionDecision(base({ semanticDelta: [one, two] }));
  const b = evaluateDeterministicVersionDecision(base({ semanticDelta: [two, one] }));
  assert.equal(a.decisionHash, b.decisionHash);
});
