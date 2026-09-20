import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  evaluateDeterministicVersionDecision,
  PLATFORM_VERSION_AUTHORITY,
  RULE_ENGINE_VERSION,
} from '../governance/deterministicVersioningDecision.mjs';
import { PR_TEMPLATE_VERSION } from './lib.mjs';

function packageVersion() {
  return JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
}

function nextPatch(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

function nextMinor(version) {
  const [major, minor] = version.split('.').map(Number);
  return `${major}.${minor + 1}.0`;
}

function decision(changeType, evidenceId) {
  const previousVersion = packageVersion();
  return evaluateDeterministicVersionDecision({
    previousVersion,
    baseSha: '1'.repeat(40),
    branchHeadShaBeforeVersioning: '2'.repeat(40),
    timestamp: '2026-09-19T21:45:00.000Z',
    actor: 'pr-template-version-manager-smoke',
    client: 'node-test',
    affectedProject: 'CAPITAL-AI-OPS',
    affectedComponent: 'PR Governance / Version Management',
    ruleSetVersion: RULE_ENGINE_VERSION,
    versionAuthorities: [PLATFORM_VERSION_AUTHORITY],
    semanticDelta: [{
      evidenceId,
      changeType,
      source: 'scripts/pr/prTemplateVersionManagerSmoke.test.mjs',
      subject: 'deterministic version-manager function smoke',
    }],
    applicableAdrRefs: ['ADR-0030', 'ADR-0105'],
    applicableEssRefs: ['ESS-0001-CONTRACTS'],
    applicableControlRefs: ['CTRL-GOV-VERSION-001', 'CTRL-GOV-VERSION-002'],
    majorReleasePolicyAuthorized: false,
  });
}

test('version-manager decision path calculates PATCH deterministically without mutating package.json', () => {
  const before = packageVersion();
  const result = decision('TEST_VALIDATION_FIX_NO_PUBLIC_CAPABILITY', 'PR-TEMPLATE-VM-PATCH');

  assert.equal(result.previousVersion, before);
  assert.equal(result.bumpType, 'PATCH');
  assert.equal(result.calculatedVersion, nextPatch(before));
  assert.equal(result.materialization.eligible, true);
  assert.equal(result.materialization.directMain, 'DENY');
  assert.equal(result.materialization.automaticMerge, 'DENY');
  assert.equal(result.materialization.automaticReleaseAcceptance, 'DENY');
  assert.equal(result.materialization.automaticDeployment, 'DENY');
  assert.equal(packageVersion(), before, 'decision evaluation must not mutate the platform-version authority');
});

test('version-manager decision path calculates a backward-compatible contract extension as MINOR', () => {
  const before = packageVersion();
  const result = decision('NEW_OPTIONAL_CONTRACT_FIELD', 'PR-TEMPLATE-VM-MINOR');

  assert.equal(result.bumpType, 'MINOR');
  assert.equal(result.calculatedVersion, nextMinor(before));
  assert.equal(packageVersion(), before);
});

test('PR template contract version is independent from the platform product version', () => {
  const template = fs.readFileSync('.github/pull_request_template.md', 'utf8');
  const before = packageVersion();

  assert.equal(PR_TEMPLATE_VERSION, '1.7.0');
  assert.match(template, /CAPITAL_AI_PR_TEMPLATE_VERSION: 1\.6\.0/);
  assert.ok(template.includes('{{VERSION_IMPACT}}'));
  assert.ok(template.includes('{{VERSION_MANAGER_CHECK}}'));\n  assert.ok(template.includes('{{DECISION_STATUS}}'));\n  assert.ok(template.includes('## 1. 🧭 Entscheidung'));\n  assert.ok(template.includes('## 2. ✅ Evidence'));\n  assert.ok(template.includes('## 3. 🔍 Technical Evidence'));
  assert.equal(packageVersion(), before);
});
