import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (repoPath: string) => fs.readFileSync(path.join(root, repoPath), 'utf8');

describe('application-wide merge cadence governance', () => {
  const agents = read('AGENTS.md');
  const catalog = JSON.parse(read('docs/governance/control-catalog.json')) as {
    controls: Array<{ controlId: string; requirement: string }>;
  };
  const versionContract = JSON.parse(
    read('docs/governance/control-plane/DETERMINISTIC_VERSIONING_RULE_CONTRACT.json'),
  );

  it('binds normal Render deployment to exactly five merged pull requests', () => {
    expect(agents).toContain('positive `mergeOrdinal` divisible by **5**');
    expect(agents).toContain('`5, 10, 15, ...`');
    expect(agents).toContain('the state becomes `DEPLOYMENT_DUE`');
    expect(agents).toContain('the deployment target is the then-latest `CURRENT_MAIN`');
    expect(agents).toContain('Render native Auto Deploy remains off');
  });

  it('keeps tests, self-healing and dashboard truth on latest current main', () => {
    expect(agents).toContain('CI, tests, Security/Compliance checks, Self-Healing and the live/current-state dashboard MUST follow the latest `CURRENT_MAIN`');
    expect(agents).toContain('`DEPLOYMENT_QUEUED` below `5/5` MUST NOT trigger exact-SHA runtime recovery');
    expect(agents).toContain('repository automation MAY advance the existing next-PR synchronization and Self-Healing continuation lanes');
    expect(read('.github/workflows/self-healing-package-continuation.yml')).toContain("workflows: ['Post-Merge Production Correlation']");
    expect(read('.github/workflows/ops-exact-sha-runtime-recovery.yml')).toContain("workflows: ['CI', 'Post-Merge Production Correlation']");
  });

  it('defines a non-retroactive cadence epoch and truthful dashboard projection', () => {
    expect(agents).toContain('non-retroactive `cadenceEpoch`');
    expect(agents).toContain('Pull Requests merged before that epoch do not count');
    expect(agents).toContain('deployment progress `x/5`');
    expect(agents).toContain('version progress `x/10`');
    expect(agents).toContain('deterministic next PATCH target');
  });

  it('requires the tenth merged pull request to carry the next patch before merge', () => {
    expect(agents).toContain('**ten merged Pull Request** cadence');
    expect(agents).toContain('current ordinal is `9 mod 10`');
    expect(agents).toContain('Example: `0.6.0 → 0.6.1`');
    expect(agents).toContain('`package.json#version` as the single version authority');
    expect(agents).toContain('`package-lock.json#packages[""]#version`');
    expect(versionContract.version).toBe('1.1.0');
    expect(versionContract.branchMaterialization.allowedAfterAuthorityEffective).toBe(true);
    expect(versionContract.branchMaterialization.reactivationCondition).toContain('PR_1338');
    expect(versionContract.branchMaterialization.reactivationCondition).toContain('currentMergeOrdinal_%_10_==_9');
    const cadenceRuntime = read('scripts/operations/mergeCadence.mjs');
    const cadenceRepairer = read('scripts/pr/repairers/mergeCadencePatchV1.mjs');
    expect(cadenceRuntime).toContain("MERGED_PR_CADENCE_PATCH");
    expect(cadenceRuntime).toContain("POSITIVE_MULTIPLES_OF_10");
    expect(cadenceRepairer).toContain("cadence.mergeOrdinal % 10 !== 9");
    expect(cadenceRepairer).toContain("MERGE_CADENCE_PATCH_V1");
    expect(versionContract.automaticMaterializationPolicy).toMatchObject({
      mode: 'MERGED_PR_CADENCE_PATCH',
      retroactiveCounting: false,
      mergedPullRequestsPerPatch: 10,
      candidatePreparationAtPriorMergedCount: 9,
      mergeOrdinalBoundaries: 'POSITIVE_MULTIPLES_OF_10',
      explicitHigherReleaseShiftsCadence: false,
      bumpType: 'PATCH',
      targetRule: 'STRICT_NEXT_PATCH',
      materializeBeforeHumanMerge: true,
      directMainMutation: 'DENY',
      automaticMerge: 'DENY',
      automaticDeployment: 'DENY',
    });
  });

  it('preserves one deploy authority and one version authority', () => {
    const deploy = catalog.controls.filter((item) => item.controlId === 'CTRL-DEPLOY-AUTH-001');
    const version = catalog.controls.filter((item) => item.controlId === 'CTRL-GOV-VERSION-002');
    expect(deploy).toHaveLength(1);
    expect(version).toHaveLength(1);
    expect(deploy[0].requirement).toContain('every fifth merged Pull Request');
    expect(version[0].requirement).toContain('every tenth merged Pull Request');
    expect(version[0].requirement).toContain('package.json remains the sole authority');
  });
});
