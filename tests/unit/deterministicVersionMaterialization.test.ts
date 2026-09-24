import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DETERMINISTIC_RULE_CONTRACT_AUTHORITY,
  DETERMINISTIC_RULE_ENGINE_VERSION,
  DETERMINISTIC_VERSIONING_ADR,
  DETERMINISTIC_VERSIONING_CONTROL,
  resolveDeterministicVersionMaterialization,
  type DeterministicVersionDecisionEvidence,
} from '../../src/platform/Release/Services/deterministicVersionMaterialization';

const tempRoots: string[] = [];
const baseSha = 'a'.repeat(40);
const headSha = 'b'.repeat(40);

function write(root: string, relativePath: string, content: string): void {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function createFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'capital-ai-deterministic-version-'));
  tempRoots.push(root);
  write(root, 'package.json', JSON.stringify({ name: 'capital-ai', version: '0.6.0' }, null, 2));
  write(root, 'package-lock.json', JSON.stringify({ name: 'capital-ai', version: '0.6.0', lockfileVersion: 3, packages: { '': { name: 'capital-ai', version: '0.6.0' } } }, null, 2));
  write(root, 'metadata.json', JSON.stringify({ name: 'Capital-AI', version: '0.6.0' }, null, 2));
  write(root, 'README.md', '[![Version](Version-0.6.0_Beta)]');
  write(root, 'docs/code-quality/CODE_QUALITY_STANDARDS.md', '**Version:** 0.6.0');
  write(root, 'docs/ceo/EXECUTIVE_SUMMARY.md', '**Version:** 0.6.0 (Beta-Phase)');
  write(root, 'docs/archive/raw-materials/API.md', '*Historical snapshot under CAPITAL-AI Platform Specification Version 0.6.0.*');
  write(root, 'index.html', '<meta name="description" content="CAPITAL-AI (Version 0.6.0)"><script type="application/ld+json">{"@type":"SoftwareApplication","softwareVersion":"0.6.0"}</script>');
  write(root, 'docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json', JSON.stringify({
    schemaVersion: '1.0.0',
    authorityId: DETERMINISTIC_RULE_CONTRACT_AUTHORITY,
    lifecycle: 'accepted-after-human-merge',
    adoptedBy: DETERMINISTIC_VERSIONING_ADR,
    singleVersionAuthority: 'package.json#version',
    ruleEngineVersion: DETERMINISTIC_RULE_ENGINE_VERSION,
    rules: [
      { ruleId: 'NONE_NO_VERSION_RELEVANT_DELTA', changeType: 'NO_VERSION_RELEVANT_DELTA', bumpType: 'NONE' },
      { ruleId: 'PATCH_INTERNAL_IMPLEMENTATION_CHANGE', changeType: 'INTERNAL_IMPLEMENTATION_NO_CONTRACT_EXTENSION', bumpType: 'PATCH' },
      { ruleId: 'MINOR_NEW_CAPABILITY', changeType: 'NEW_CAPABILITY', bumpType: 'MINOR' },
      { ruleId: 'MAJOR_INCOMPATIBLE_API_SCHEMA', changeType: 'INCOMPATIBLE_API_SCHEMA', bumpType: 'MAJOR' },
    ],
    branchMaterialization: {
      allowedAfterAuthorityEffective: true,
      scope: 'current-scoped-work-branch-only',
      directMainMutation: 'DENY',
      automaticMerge: 'DENY',
      automaticReleaseAcceptance: 'DENY',
      automaticDeployment: 'DENY',
      canonicalMutationPath: 'CAPITAL-AI-OPS / PVC-06 / PVC-07 existing Release Version Gate',
    },
  }, null, 2));
  return root;
}

function decision(overrides: Partial<DeterministicVersionDecisionEvidence> = {}): DeterministicVersionDecisionEvidence {
  return {
    status: 'DECISION_READY',
    previousVersion: '0.6.0',
    calculatedVersion: '0.7.0',
    bumpType: 'MINOR',
    triggeredRules: ['MINOR_NEW_CAPABILITY'],
    changedContracts: ['release-version-materialization'],
    changedCapabilities: ['deterministic-version-materialization'],
    baseSha,
    branchHeadShaBeforeVersioning: headSha,
    resultingBranchHeadSha: null,
    ruleEngineVersion: DETERMINISTIC_RULE_ENGINE_VERSION,
    decisionHash: `sha256:${'c'.repeat(64)}`,
    timestamp: '2026-09-15T00:00:00.000Z',
    actor: 'agent:operations',
    client: 'ChatGPT',
    affectedProject: 'CAPITAL-AI-OPS',
    affectedComponent: 'PVC-06/PVC-07 Release Version Gate',
    applicableAdrRefs: ['ADR-0030', 'ADR-0105'],
    applicableEssRefs: ['ESS-0001-CONTRACTS', 'ESS-0007'],
    applicableControlRefs: ['CTRL-GOV-VERSION-001', DETERMINISTIC_VERSIONING_CONTROL],
    materialization: {
      eligible: true,
      reason: 'ELIGIBLE_FOR_SCOPED_BRANCH_MATERIALIZATION_AFTER_AUTHORITY_EFFECTIVE',
      directMain: 'DENY',
      automaticMerge: 'DENY',
      automaticReleaseAcceptance: 'DENY',
      automaticDeployment: 'DENY',
    },
    ...overrides,
  };
}

const metadata = {
  workPackages: ['OPS-PR900-02'],
  migrations: ['none'],
  risks: ['No Production Acceptance or deployment is implied by branch materialization.'],
  rollbackBoundary: 'Restore the exact prior platform-version authority/projection set.',
  acceptanceRequirements: ['Production Acceptance remains separately authorized'],
};

const context = {
  branchName: 'agent/operations-deterministic-version-materialization-20260915',
  branchHeadSha: headSha,
  baseSha,
};

afterEach(() => {
  for (const root of tempRoots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('ADR-0105 deterministic release materialization', () => {
  it('builds the existing Release Version Gate plan from deterministic evidence without free target/classification input', () => {
    const result = resolveDeterministicVersionMaterialization(createFixture(), decision(), context, metadata);
    expect(result.action).toBe('MATERIALIZE');
    if (result.action !== 'MATERIALIZE') throw new Error('expected materialization');
    expect(result.plan.currentVersion).toBe('0.6.0');
    expect(result.plan.targetVersion).toBe('0.7.0');
    expect(result.plan.classification).toBe('MINOR');
    expect(result.plan.request.adrs).toContain('ADR-0105');
    expect(result.plan.updatedFiles).toContain('package.json');
  });

  it('returns no mutation for NONE and repeated decisions', () => {
    const root = createFixture();
    const none = resolveDeterministicVersionMaterialization(root, decision({
      calculatedVersion: '0.6.0',
      bumpType: 'NONE',
      triggeredRules: ['NONE_NO_VERSION_RELEVANT_DELTA'],
      materialization: { ...decision().materialization, eligible: false, reason: 'NO_VERSION_MUTATION' },
    }), context, metadata);
    expect(none).toMatchObject({ action: 'NO_MUTATION', reason: 'NO_VERSION_MUTATION' });

    const replay = resolveDeterministicVersionMaterialization(root, decision({
      status: 'NO_CHANGE_ALREADY_APPLIED',
      materialization: { ...decision().materialization, eligible: false, reason: 'NO_CHANGE_ALREADY_APPLIED' },
    }), { ...context, branchHeadSha: 'd'.repeat(40) }, metadata);
    expect(replay).toMatchObject({ action: 'NO_MUTATION', reason: 'NO_CHANGE_ALREADY_APPLIED' });
  });

  it('returns no mutation when materialization.eligible=false, including the MAJOR GA policy block', () => {
    const result = resolveDeterministicVersionMaterialization(createFixture(), decision({
      calculatedVersion: '1.0.0',
      bumpType: 'MAJOR',
      triggeredRules: ['MAJOR_INCOMPATIBLE_API_SCHEMA'],
      materialization: { ...decision().materialization, eligible: false, reason: 'BLOCKED_BY_APPLICABLE_MAJOR_RELEASE_POLICY' },
    }), context, metadata);
    expect(result).toMatchObject({ action: 'NO_MUTATION', reason: 'MATERIALIZATION_INELIGIBLE' });
  });

  it('denies direct-main and stale branch/base identity before an eligible mutation plan is returned', () => {
    const root = createFixture();
    expect(() => resolveDeterministicVersionMaterialization(root, decision(), { ...context, branchName: 'main' }, metadata))
      .toThrow('direct main materialization is prohibited');
    expect(() => resolveDeterministicVersionMaterialization(root, decision(), { ...context, branchHeadSha: 'd'.repeat(40) }, metadata))
      .toThrow('branch-head SHA is stale');
    expect(() => resolveDeterministicVersionMaterialization(root, decision(), { ...context, baseSha: 'd'.repeat(40) }, metadata))
      .toThrow('base SHA does not match');
  });

  it('fails closed for malformed identity, rule drift, missing refs and protected-boundary weakening', () => {
    const root = createFixture();
    expect(() => resolveDeterministicVersionMaterialization(root, decision({ decisionHash: 'sha256:bad' }), context, metadata))
      .toThrow('decisionHash');
    expect(() => resolveDeterministicVersionMaterialization(root, decision({ triggeredRules: ['MINOR_UNKNOWN'] }), context, metadata))
      .toThrow('not present in accepted Rule Contract');
    expect(() => resolveDeterministicVersionMaterialization(root, decision({ applicableEssRefs: ['ESS-0007'] }), context, metadata))
      .toThrow('ESS-0001-CONTRACTS');
    expect(() => resolveDeterministicVersionMaterialization(root, decision({ applicableControlRefs: ['CTRL-GOV-VERSION-002'] }), context, metadata))
      .toThrow('CTRL-GOV-VERSION-001');
    expect(() => resolveDeterministicVersionMaterialization(root, decision({
      materialization: { ...decision().materialization, automaticDeployment: 'ALLOW' as 'DENY' },
    }), context, metadata)).toThrow('deployment boundary');
  });

  it('rejects bump/classification contradictions and stale package.json#version', () => {
    const root = createFixture();
    expect(() => resolveDeterministicVersionMaterialization(root, decision({ bumpType: 'PATCH' }), context, metadata))
      .toThrow('does not match triggered rules');
    expect(() => resolveDeterministicVersionMaterialization(root, decision({ calculatedVersion: '0.6.1' }), context, metadata))
      .toThrow('does not match deterministic MINOR transition');
    write(root, 'package.json', JSON.stringify({ name: 'capital-ai', version: '0.6.1' }, null, 2));
    expect(() => resolveDeterministicVersionMaterialization(root, decision(), context, metadata))
      .toThrow('previousVersion is stale');
  });
});
